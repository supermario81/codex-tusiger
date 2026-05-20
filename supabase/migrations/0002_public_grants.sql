-- Required SQL privileges for Supabase PostgREST.
-- RLS policies still decide which rows are visible or writable.

grant usage on schema public to anon, authenticated;

grant execute on function public.is_admin() to anon, authenticated;

grant select on public.challenge_config to anon, authenticated;
grant select on public.history_content to anon, authenticated;
grant select on public.legal_pages to anon, authenticated;
grant select on public.leaderboard_public to anon, authenticated;
grant select on public.group_summaries to anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;

grant select on public.runs to anon, authenticated;
grant insert, update on public.runs to authenticated;

grant select, insert on public.run_points to authenticated;

grant select on public.groups to anon, authenticated;
grant insert, update on public.groups to authenticated;

grant select on public.group_members to authenticated;
grant insert, delete on public.group_members to authenticated;

grant insert on public.analytics_events to anon, authenticated;
grant select on public.analytics_events to authenticated;

grant insert on public.audit_logs to anon, authenticated;
grant select on public.audit_logs to authenticated;

grant usage, select on all sequences in schema public to authenticated;
