-- Enforce unique public names and remove placeholder donation URLs.
-- Run after 0005_group_rpc.sql.

update public.challenge_config
set donation_url = ''
where donation_url = 'https://example.org/spenden';

create unique index if not exists profiles_unique_active_nickname_lower
on public.profiles (lower(nickname))
where deleted_at is null;

create unique index if not exists groups_unique_name_lower
on public.groups (lower(name));

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

  if length(clean_name) < 3 then
    raise exception 'group_name_too_short';
  end if;

  if exists (select 1 from public.groups g where lower(g.name) = lower(clean_name)) then
    raise exception 'group_name_already_exists';
  end if;

  loop
    new_invite_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
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

grant execute on function public.create_tusiger_group(text, boolean) to authenticated;
