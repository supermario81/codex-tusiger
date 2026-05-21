-- Fix Tusiger group invites, public group visibility and recursive RLS policies.
-- Safe to run after 0001_tusiger_schema.sql and 0005_group_rpc.sql.

begin;

update public.challenge_config
set donation_url = ''
where donation_url = 'https://example.org/spenden';

create unique index if not exists profiles_unique_active_nickname_lower
on public.profiles (lower(nickname))
where deleted_at is null;

create unique index if not exists groups_unique_name_lower
on public.groups (lower(name));

drop policy if exists "groups create" on public.groups;
drop policy if exists "groups read public or member" on public.groups;
drop policy if exists "groups owner update" on public.groups;
drop policy if exists "groups insert own" on public.groups;
drop policy if exists "groups read public or owner" on public.groups;
drop policy if exists "groups owner delete" on public.groups;

drop policy if exists "members join" on public.group_members;
drop policy if exists "members read related" on public.group_members;
drop policy if exists "members owner manage" on public.group_members;
drop policy if exists "members insert own" on public.group_members;
drop policy if exists "members read own" on public.group_members;
drop policy if exists "members delete own" on public.group_members;
drop policy if exists "members owner delete" on public.group_members;

-- Do not query group_members from a group_members RLS policy. It causes infinite recursion.
create policy "groups insert own"
on public.groups for insert
with check (auth.uid() = owner_user_id);

create policy "groups read public or owner"
on public.groups for select
using (is_private = false or owner_user_id = auth.uid() or public.is_admin());

create policy "groups owner update"
on public.groups for update
using (owner_user_id = auth.uid() or public.is_admin())
with check (owner_user_id = auth.uid() or public.is_admin());

create policy "groups owner delete"
on public.groups for delete
using (owner_user_id = auth.uid() or public.is_admin());

create policy "members insert own"
on public.group_members for insert
with check (auth.uid() = user_id);

create policy "members read own"
on public.group_members for select
using (auth.uid() = user_id);

create policy "members delete own"
on public.group_members for delete
using (auth.uid() = user_id);

create policy "members owner delete"
on public.group_members for delete
using (
  exists (
    select 1
    from public.groups g
    where g.id = group_members.group_id
      and g.owner_user_id = auth.uid()
  )
  or public.is_admin()
);

create or replace function public.tusiger_invite_code(p_input text)
returns text
language sql
immutable
as $$
  select coalesce((regexp_match(upper(coalesce(p_input, '')), '(TUS[A-Z0-9]+)'))[1], '');
$$;

create or replace function public.group_summary_row(p_group_id uuid, p_role text default 'member')
returns table (
  id uuid,
  name text,
  description text,
  invite_code text,
  is_private boolean,
  member_count int,
  best_time_seconds numeric,
  role text
)
language sql
security definer
set search_path = public
as $$
  select
    g.id,
    g.name,
    coalesce(g.description, '') as description,
    g.invite_code,
    g.is_private,
    count(gm.id)::int as member_count,
    min(r.duration_seconds) filter (where r.status = 'valid') as best_time_seconds,
    p_role as role
  from public.groups g
  left join public.group_members gm on gm.group_id = g.id
  left join public.runs r on r.user_id = gm.user_id
  where g.id = p_group_id
  group by g.id, p_role;
$$;

create or replace function public.get_my_groups()
returns table (
  id uuid,
  name text,
  description text,
  invite_code text,
  is_private boolean,
  member_count int,
  best_time_seconds numeric,
  role text
)
language sql
security definer
set search_path = public
as $$
  select
    g.id,
    g.name,
    coalesce(g.description, '') as description,
    g.invite_code,
    g.is_private,
    count(all_members.id)::int as member_count,
    min(r.duration_seconds) filter (where r.status = 'valid') as best_time_seconds,
    me.role
  from public.group_members me
  join public.groups g on g.id = me.group_id
  left join public.group_members all_members on all_members.group_id = g.id
  left join public.runs r on r.user_id = all_members.user_id
  where me.user_id = auth.uid()
  group by g.id, me.role
  order by g.created_at desc;
$$;

create or replace function public.get_public_groups()
returns table (
  id uuid,
  name text,
  description text,
  invite_code text,
  is_private boolean,
  member_count int,
  best_time_seconds numeric,
  role text
)
language sql
security definer
set search_path = public
as $$
  select
    g.id,
    g.name,
    coalesce(g.description, '') as description,
    g.invite_code,
    g.is_private,
    count(gm.id)::int as member_count,
    min(r.duration_seconds) filter (where r.status = 'valid') as best_time_seconds,
    'member'::text as role
  from public.groups g
  left join public.group_members gm on gm.group_id = g.id
  left join public.runs r on r.user_id = gm.user_id
  where g.is_private = false
  group by g.id
  order by g.created_at desc;
$$;

create or replace function public.get_group_by_invite(p_invite_code text)
returns table (
  id uuid,
  name text,
  description text,
  invite_code text,
  is_private boolean,
  member_count int,
  best_time_seconds numeric,
  role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_code text := public.tusiger_invite_code(p_invite_code);
  target_group_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if clean_code = '' then
    raise exception 'invalid_invite_code';
  end if;

  select g.id into target_group_id
  from public.groups g
  where g.invite_code = clean_code
  limit 1;

  if target_group_id is null then
    raise exception 'group_not_found';
  end if;

  return query select * from public.group_summary_row(target_group_id, 'member');
end;
$$;

create or replace function public.create_tusiger_group(p_name text, p_is_private boolean default true)
returns table (
  id uuid,
  name text,
  description text,
  invite_code text,
  is_private boolean,
  member_count int,
  best_time_seconds numeric,
  role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  new_group_id uuid;
  new_invite_code text;
  clean_name text := trim(coalesce(p_name, ''));
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if length(clean_name) < 3 or length(clean_name) > 40 then
    raise exception 'group_name_too_short';
  end if;

  if exists (select 1 from public.groups g where lower(g.name) = lower(clean_name)) then
    raise exception 'group_name_already_exists';
  end if;

  loop
    new_invite_code := 'TUS' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.groups where invite_code = new_invite_code);
  end loop;

  insert into public.groups (owner_user_id, name, description, invite_code, is_private)
  values (current_user_id, clean_name, '', new_invite_code, p_is_private)
  returning groups.id into new_group_id;

  insert into public.group_members (group_id, user_id, role)
  values (new_group_id, current_user_id, 'owner')
  on conflict (group_id, user_id) do update set role = 'owner';

  return query select * from public.group_summary_row(new_group_id, 'owner');
end;
$$;

create or replace function public.join_group_by_invite(p_invite_code text)
returns table (
  id uuid,
  name text,
  description text,
  invite_code text,
  is_private boolean,
  member_count int,
  best_time_seconds numeric,
  role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  clean_code text := public.tusiger_invite_code(p_invite_code);
  target_group_id uuid;
  current_role text;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if clean_code = '' then
    raise exception 'invalid_invite_code';
  end if;

  select g.id into target_group_id
  from public.groups g
  where g.invite_code = clean_code
  limit 1;

  if target_group_id is null then
    raise exception 'group_not_found';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (target_group_id, current_user_id, 'member')
  on conflict (group_id, user_id) do nothing;

  select gm.role into current_role
  from public.group_members gm
  where gm.group_id = target_group_id
    and gm.user_id = current_user_id
  limit 1;

  return query select * from public.group_summary_row(target_group_id, coalesce(current_role, 'member'));
end;
$$;

create or replace function public.create_group_with_invite(p_name text, p_is_private boolean default true)
returns table (
  id uuid,
  name text,
  description text,
  invite_code text,
  is_private boolean,
  member_count int,
  best_time_seconds numeric,
  role text
)
language sql
security definer
set search_path = public
as $$
  select * from public.create_tusiger_group(p_name, p_is_private);
$$;

create or replace function public.join_tusiger_group(p_invite_code text)
returns table (
  id uuid,
  name text,
  description text,
  invite_code text,
  is_private boolean,
  member_count int,
  best_time_seconds numeric,
  role text
)
language sql
security definer
set search_path = public
as $$
  select * from public.join_group_by_invite(p_invite_code);
$$;

grant execute on function public.tusiger_invite_code(text) to authenticated;
grant execute on function public.group_summary_row(uuid, text) to authenticated;
grant execute on function public.get_my_groups() to authenticated;
grant execute on function public.get_public_groups() to authenticated;
grant execute on function public.get_group_by_invite(text) to authenticated;
grant execute on function public.create_tusiger_group(text, boolean) to authenticated;
grant execute on function public.create_group_with_invite(text, boolean) to authenticated;
grant execute on function public.join_group_by_invite(text) to authenticated;
grant execute on function public.join_tusiger_group(text) to authenticated;

commit;
