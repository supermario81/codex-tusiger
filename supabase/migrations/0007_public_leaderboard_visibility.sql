-- Add user-controlled public leaderboard visibility.
-- Users are visible by default and can opt out in profile settings.

alter table public.profiles
add column if not exists show_in_public_leaderboard boolean not null default true;

alter table public.profiles
drop constraint if exists profiles_nickname_check;

alter table public.profiles
drop constraint if exists profiles_nickname_length;

alter table public.profiles
add constraint profiles_nickname_length
check (char_length(nickname) between 3 and 30);

create or replace view public.leaderboard_public
with (security_invoker = true) as
select
  r.id,
  r.user_id,
  p.nickname,
  p.avatar_url,
  r.started_at,
  r.ended_at,
  r.duration_seconds,
  r.status,
  r.validation_score
from public.runs r
join public.profiles p on p.user_id = r.user_id
where r.status = 'valid'
  and p.deleted_at is null
  and p.show_in_public_leaderboard = true;
