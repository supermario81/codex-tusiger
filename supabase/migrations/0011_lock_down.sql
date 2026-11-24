-- Rechte härten. Erst einspielen, wenn validate-run deployt und der Client ab 0.11.0 live ist.
begin;

-- Rolle und Laufergebnis setzt nie der Client, nur service_role/postgres.
create or replace function public.guard_profile()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.role := case when tg_op = 'UPDATE' then old.role else 'user' end;
  end if;
  return new;
end $$;
drop trigger if exists guard_profile on public.profiles;
create trigger guard_profile before insert or update on public.profiles for each row execute function public.guard_profile();

create or replace function public.guard_run()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('anon', 'authenticated') then
    if (select count(*) from runs where user_id = new.user_id and created_at > now() - interval '1 day') >= 30 then
      raise exception 'too_many_runs';
    end if;
    new.status := 'draft';
    new.validation_score := 0;
    new.validation_reasons := '[]';
    new.validation_checks := '[]';
    new.tracking_summary := null;
    new.created_at := now();
  end if;
  return new;
end $$;
drop trigger if exists guard_run on public.runs;
create trigger guard_run before insert on public.runs for each row execute function public.guard_run();

create or replace function public.guard_run_points()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('anon', 'authenticated') and exists (
    select 1 from run_points p where p.run_id in (select distinct run_id from inserted)
    group by p.run_id having count(*) > 20000
  ) then
    raise exception 'too_many_points';
  end if;
  return null;
end $$;
drop trigger if exists guard_run_points on public.run_points;
create trigger guard_run_points after insert on public.run_points
referencing new table as inserted for each statement execute function public.guard_run_points();
revoke execute on function public.guard_profile(), public.guard_run(), public.guard_run_points() from public;

drop policy if exists "runs own update draft" on public.runs;
drop policy if exists "runs own read" on public.runs;
create policy "runs own read" on public.runs for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "points own insert" on public.run_points;
create policy "points own insert" on public.run_points for insert with check (
  auth.uid() = user_id and exists (
    select 1 from public.runs r where r.id = run_id and r.user_id = auth.uid() and r.status = 'draft'
  )
);

drop policy if exists "profiles public identity read" on public.profiles;
create policy "profiles own read" on public.profiles for select using (auth.uid() = user_id or public.is_admin());

-- Beitritt und Gründung laufen nur noch über die RPCs.
drop policy if exists "members insert own" on public.group_members;
drop policy if exists "groups insert own" on public.groups;
drop policy if exists "groups owner update" on public.groups;

drop policy if exists "analytics insert own or anon" on public.analytics_events;
create policy "analytics insert own" on public.analytics_events for insert to authenticated
with check (auth.uid() = user_id and length(event_name) <= 64 and pg_column_size(metadata) <= 2048 and length(coalesce(page, '')) <= 200);
drop policy if exists "audit insert own" on public.audit_logs;

drop view if exists public.leaderboard_public;
drop view if exists public.group_summaries;
drop function if exists public.list_public_groups();
drop function if exists public.list_my_groups();

revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
revoke all on public.runs, public.profiles, public.groups, public.group_members, public.run_points, public.analytics_events, public.audit_logs from anon;
revoke insert on public.group_members, public.groups, public.audit_logs from authenticated;
revoke update on public.groups from authenticated;

commit;
