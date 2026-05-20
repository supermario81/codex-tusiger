-- Destructive test reset for Tusiger.
-- Run only in the Supabase SQL Editor for a test/staging project.
-- This removes all app data and all Supabase Auth users.
-- Avatar files in Supabase Storage must be removed via the Storage UI/API;
-- direct deletion from storage.objects is intentionally blocked by Supabase.

begin;

truncate table
  public.run_points,
  public.group_members,
  public.groups,
  public.runs,
  public.profiles,
  public.analytics_events,
  public.audit_logs
restart identity cascade;

-- Supabase Auth users live in the auth schema.
-- Deleting users also removes auth identities/sessions through Supabase's auth schema cascades.
delete from auth.users;

commit;
