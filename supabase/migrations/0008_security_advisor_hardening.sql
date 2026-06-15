-- Harden Supabase Security Advisor findings without breaking Tusiger app flows.
-- Run after 0007_public_leaderboard_visibility.sql.

begin;

-- New functions should not be executable by PUBLIC unless explicitly granted.
alter default privileges in schema public revoke execute on functions from public;

-- is_admin only checks the caller's own auth.uid(). It does not need elevated
-- privileges, and keeping it SECURITY DEFINER creates an unnecessary warning.
create or replace function public.is_admin()
returns boolean
language sql
security invoker
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and role = 'admin'
      and deleted_at is null
  );
$$;

-- Remove broad PUBLIC execute defaults from existing functions, then re-grant
-- only the API surface the app intentionally uses.
revoke execute on all functions in schema public from public;

grant execute on function public.is_admin() to anon, authenticated;

-- Internal helper: must only be callable from owner-owned SECURITY DEFINER RPCs,
-- never directly from anon/authenticated users.
revoke all on function public.group_summary_row(uuid, text) from public, anon, authenticated;

-- Intentionally public: public group discovery is part of the product.
grant execute on function public.list_public_groups() to public, anon, authenticated;

-- Authenticated group RPCs. These remain SECURITY DEFINER by design because
-- they encapsulate membership logic and avoid recursive RLS policies.
grant execute on function public.list_my_groups() to authenticated;
grant execute on function public.get_my_groups() to authenticated;
grant execute on function public.get_public_groups() to authenticated;
grant execute on function public.get_group_by_invite(text) to authenticated;
grant execute on function public.create_tusiger_group(text, boolean) to authenticated;
grant execute on function public.create_group_with_invite(text, boolean) to authenticated;
grant execute on function public.join_tusiger_group(text) to authenticated;
grant execute on function public.join_group_by_invite(text) to authenticated;
grant execute on function public.leave_tusiger_group(uuid) to authenticated;
grant execute on function public.tusiger_invite_code(text) to authenticated;

-- Legacy/manual helper found by Security Advisor. It is not used by Tusiger and
-- should not be callable from the API.
do $$
begin
  revoke all on function public.rls_auto_enable() from public, anon, authenticated;
exception
  when undefined_function then null;
end $$;

drop function if exists public.rls_auto_enable();

-- Keep the avatars bucket public for direct image rendering, but remove the broad
-- SELECT policy that allows unauthenticated listing of all object names.
drop policy if exists "avatar read public" on storage.objects;
drop policy if exists "avatar own read" on storage.objects;

create policy "avatar own read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

commit;
