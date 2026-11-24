-- Ranglisten, Gruppen und Kontolöschung als abgeschirmte RPCs (additiv).
create index if not exists run_points_run_id_idx on public.run_points (run_id, recorded_at);
create index if not exists run_points_user_id_idx on public.run_points (user_id);
create index if not exists runs_user_id_idx on public.runs (user_id, started_at desc);
create index if not exists runs_valid_idx on public.runs (duration_seconds) where status = 'valid';
create index if not exists group_members_user_id_idx on public.group_members (user_id);
create index if not exists groups_owner_idx on public.groups (owner_user_id);

-- Bestzeit pro Person; mit p_group_id nur für Mitglieder dieser Gruppe.
create or replace function public.get_leaderboard(p_since timestamptz default null, p_group_id uuid default null)
returns table (id uuid, nickname text, avatar_url text, ended_at timestamptz, duration_seconds numeric, is_current_user boolean)
language sql stable security definer set search_path = public
as $$
  select b.* from (
    select distinct on (r.user_id)
      r.id, p.nickname, p.avatar_url, r.ended_at, r.duration_seconds, r.user_id = auth.uid() as is_current_user
    from runs r
    join profiles p on p.user_id = r.user_id and p.deleted_at is null
    where auth.uid() is not null
      and r.status = 'valid'
      and r.ended_at <= now()
      and (p_since is null or r.ended_at >= p_since)
      and case when p_group_id is null then p.show_in_public_leaderboard
        else exists (select 1 from group_members m where m.group_id = p_group_id and m.user_id = auth.uid())
          and exists (select 1 from group_members m where m.group_id = p_group_id and m.user_id = r.user_id) end
    order by r.user_id, r.duration_seconds, r.ended_at
  ) b order by b.duration_seconds, b.ended_at limit 100;
$$;

-- count(distinct): der Join auf runs vervielfachte sonst die Mitgliederzahl.
create or replace function public.group_summary_row(p_group_id uuid, p_role text default 'member')
returns table (id uuid, name text, description text, invite_code text, is_private boolean, member_count int, best_time_seconds numeric, role text)
language sql security definer set search_path = public
as $$
  select g.id, g.name, coalesce(g.description, ''), g.invite_code, g.is_private,
    count(distinct gm.id)::int, min(r.duration_seconds) filter (where r.status = 'valid'), p_role
  from groups g
  left join group_members gm on gm.group_id = g.id
  left join runs r on r.user_id = gm.user_id
  where g.id = p_group_id group by g.id;
$$;

create or replace function public.get_my_groups()
returns table (id uuid, name text, description text, invite_code text, is_private boolean, member_count int, best_time_seconds numeric, role text)
language sql security definer set search_path = public
as $$
  select g.id, g.name, coalesce(g.description, ''), g.invite_code, g.is_private,
    count(distinct gm.id)::int, min(r.duration_seconds) filter (where r.status = 'valid'), me.role
  from group_members me
  join groups g on g.id = me.group_id
  left join group_members gm on gm.group_id = g.id
  left join runs r on r.user_id = gm.user_id
  where me.user_id = auth.uid() group by g.id, me.role order by g.created_at desc;
$$;

create or replace function public.get_public_groups()
returns table (id uuid, name text, description text, invite_code text, is_private boolean, member_count int, best_time_seconds numeric, role text)
language sql security definer set search_path = public
as $$
  select g.id, g.name, coalesce(g.description, ''), g.invite_code, g.is_private,
    count(distinct gm.id)::int, min(r.duration_seconds) filter (where r.status = 'valid'), 'member'::text
  from groups g
  left join group_members gm on gm.group_id = g.id
  left join runs r on r.user_id = gm.user_id
  where g.is_private = false group by g.id order by g.created_at desc;
$$;

-- Gruppen des Kontos gehen an das älteste Mitglied; der Rest kaskadiert über auth.users.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not_authenticated'; end if;
  update groups g set owner_user_id = h.user_id
  from (select distinct on (group_id) group_id, user_id from group_members where user_id <> me order by group_id, created_at) h
  where g.owner_user_id = me and h.group_id = g.id;
  update group_members m set role = 'owner' from groups g
  where g.id = m.group_id and g.owner_user_id = m.user_id and m.role <> 'owner';
  delete from analytics_events where user_id = me;
  delete from audit_logs where user_id = me;
  delete from auth.users where id = me;
end;
$$;

revoke all on function public.get_leaderboard(timestamptz, uuid), public.delete_my_account() from public, anon;
grant execute on function public.get_leaderboard(timestamptz, uuid), public.delete_my_account() to authenticated;

-- Nur was die Edge Function validate-run braucht.
grant usage on schema public to service_role;
grant select, update on public.runs to service_role;
grant select on public.run_points, public.challenge_config to service_role;
