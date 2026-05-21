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

create or replace function public.list_my_groups()
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

create or replace function public.list_public_groups()
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
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if length(trim(coalesce(p_name, ''))) < 3 then
    raise exception 'group_name_too_short';
  end if;

  loop
    new_invite_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.groups where invite_code = new_invite_code);
  end loop;

  insert into public.groups (owner_user_id, name, description, invite_code, is_private)
  values (current_user_id, trim(p_name), '', new_invite_code, p_is_private)
  returning groups.id into new_group_id;

  insert into public.group_members (group_id, user_id, role)
  values (new_group_id, current_user_id, 'owner')
  on conflict (group_id, user_id) do update set role = 'owner';

  return query select * from public.group_summary_row(new_group_id, 'owner');
end;
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
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_group_id uuid;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select g.id into target_group_id
  from public.groups g
  where g.invite_code = upper(regexp_replace(coalesce(p_invite_code, ''), '[^A-Za-z0-9]', '', 'g'))
  limit 1;

  if target_group_id is null then
    raise exception 'group_not_found';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (target_group_id, current_user_id, 'member')
  on conflict (group_id, user_id) do nothing;

  return query
    select * from public.group_summary_row(
      target_group_id,
      coalesce((select gm.role from public.group_members gm where gm.group_id = target_group_id and gm.user_id = current_user_id), 'member')
    );
end;
$$;

create or replace function public.leave_tusiger_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  is_owner boolean;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select exists (
    select 1 from public.groups g
    where g.id = p_group_id and g.owner_user_id = current_user_id
  ) into is_owner;

  if is_owner then
    delete from public.groups where id = p_group_id and owner_user_id = current_user_id;
  else
    delete from public.group_members
    where group_id = p_group_id and user_id = current_user_id;
  end if;
end;
$$;

grant execute on function public.group_summary_row(uuid, text) to authenticated;
grant execute on function public.list_my_groups() to authenticated;
grant execute on function public.list_public_groups() to authenticated;
grant execute on function public.create_tusiger_group(text, boolean) to authenticated;
grant execute on function public.join_tusiger_group(text) to authenticated;
grant execute on function public.leave_tusiger_group(uuid) to authenticated;
