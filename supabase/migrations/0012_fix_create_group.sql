-- create_tusiger_group scheiterte immer: invite_code war als Ausgabespalte und Tabellenspalte mehrdeutig.
create or replace function public.create_tusiger_group(p_name text, p_is_private boolean default true)
returns table (id uuid, name text, description text, invite_code text, is_private boolean, member_count int, best_time_seconds numeric, role text)
language plpgsql security definer set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  new_group_id uuid;
  clean_name text := trim(coalesce(p_name, ''));
begin
  if current_user_id is null then raise exception 'not_authenticated'; end if;
  if length(clean_name) < 3 or length(clean_name) > 40 then raise exception 'group_name_too_short'; end if;
  if exists (select 1 from groups g where lower(g.name) = lower(clean_name)) then raise exception 'group_name_already_exists'; end if;
  insert into groups (owner_user_id, name, description, invite_code, is_private)
  values (current_user_id, clean_name, '', 'TUS' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)), p_is_private)
  returning groups.id into new_group_id;
  insert into group_members (group_id, user_id, role) values (new_group_id, current_user_id, 'owner');
  return query select * from group_summary_row(new_group_id, 'owner');
end;
$$;

create or replace function public.join_group_by_invite(p_invite_code text)
returns table (id uuid, name text, description text, invite_code text, is_private boolean, member_count int, best_time_seconds numeric, role text)
language plpgsql security definer set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  clean_code text := public.tusiger_invite_code(p_invite_code);
  target_group_id uuid;
  member_role text;
begin
  if current_user_id is null then raise exception 'not_authenticated'; end if;
  if clean_code = '' then raise exception 'invalid_invite_code'; end if;
  select g.id into target_group_id from groups g where g.invite_code = clean_code;
  if target_group_id is null then raise exception 'group_not_found'; end if;
  insert into group_members (group_id, user_id, role) values (target_group_id, current_user_id, 'member')
  on conflict (group_id, user_id) do nothing;
  select gm.role into member_role from group_members gm where gm.group_id = target_group_id and gm.user_id = current_user_id;
  return query select * from group_summary_row(target_group_id, member_role);
end;
$$;
