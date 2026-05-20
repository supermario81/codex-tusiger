create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  nickname text not null check (char_length(nickname) between 3 and 20),
  avatar_url text,
  language text not null default 'de' check (language in ('de', 'en')),
  role text not null default 'user' check (role in ('user', 'admin')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.challenge_config (
  id uuid primary key default gen_random_uuid(),
  active boolean not null default true,
  name text not null default 'Tusiger',
  total_steps int not null default 1000,
  start_lat numeric not null default 47.315206553,
  start_lng numeric not null default 7.886963657,
  start_radius_m numeric not null default 25,
  end_lat numeric not null default 47.318954559,
  end_lng numeric not null default 7.882850574,
  end_radius_m numeric not null default 35,
  expected_elevation_gain_m numeric not null default 235,
  elevation_valid_min_m numeric not null default 205,
  elevation_valid_max_m numeric not null default 265,
  elevation_review_min_m numeric not null default 180,
  elevation_review_max_m numeric not null default 290,
  gps_accuracy_valid_max_m numeric not null default 25,
  gps_accuracy_review_max_m numeric not null default 45,
  min_duration_seconds int not null default 240,
  max_duration_seconds int not null default 7200,
  publish_needs_review boolean not null default false,
  donation_url text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds numeric,
  status text not null default 'draft' check (status in ('valid', 'needs_review', 'invalid', 'draft')),
  validation_score int not null default 0,
  validation_reasons jsonb not null default '[]'::jsonb,
  start_lat numeric,
  start_lng numeric,
  end_lat numeric,
  end_lng numeric,
  elevation_gain_m numeric,
  gps_accuracy_avg_m numeric,
  gps_accuracy_min_m numeric,
  gps_accuracy_max_m numeric,
  estimated_steps int,
  pace_per_100_steps_seconds numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.run_points (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.runs(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  recorded_at timestamptz not null,
  lat numeric not null,
  lng numeric not null,
  altitude_m numeric,
  altitude_accuracy_m numeric,
  accuracy_m numeric not null,
  speed_mps numeric,
  heading numeric
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  invite_code text unique not null,
  is_private boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique(group_id, user_id)
);

create table if not exists public.history_content (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  language text not null default 'de' check (language in ('de', 'en')),
  year_label text,
  title text,
  body text,
  sort_order int not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.legal_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  language text not null default 'de' check (language in ('de', 'en')),
  title text not null,
  body text,
  version text not null default 'draft-legal-review-required',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(slug, language)
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  session_id text,
  event_name text not null,
  page text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin' and deleted_at is null
  );
$$;

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
where r.status = 'valid' and p.deleted_at is null;

create or replace view public.group_summaries
with (security_invoker = true) as
select
  g.*,
  count(gm.id)::int as member_count,
  min(r.duration_seconds) filter (where r.status = 'valid') as best_time_seconds
from public.groups g
left join public.group_members gm on gm.group_id = g.id
left join public.runs r on r.user_id = gm.user_id
group by g.id;

alter table public.profiles enable row level security;
alter table public.challenge_config enable row level security;
alter table public.runs enable row level security;
alter table public.run_points enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.history_content enable row level security;
alter table public.legal_pages enable row level security;
alter table public.analytics_events enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "profiles public identity read" on public.profiles;
drop policy if exists "profiles own insert" on public.profiles;
drop policy if exists "profiles own update" on public.profiles;
create policy "profiles public identity read" on public.profiles for select using (deleted_at is null);
create policy "profiles own insert" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles own update" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "challenge active read" on public.challenge_config;
drop policy if exists "challenge admin write" on public.challenge_config;
create policy "challenge active read" on public.challenge_config for select using (active = true);
create policy "challenge admin write" on public.challenge_config for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "runs own insert" on public.runs;
drop policy if exists "runs own read" on public.runs;
drop policy if exists "runs own update draft" on public.runs;
drop policy if exists "runs admin update" on public.runs;
create policy "runs own insert" on public.runs for insert with check (auth.uid() = user_id);
create policy "runs own read" on public.runs for select using (
  auth.uid() = user_id or status = 'valid' or public.is_admin()
);
create policy "runs own update draft" on public.runs for update using (auth.uid() = user_id and status in ('draft','needs_review')) with check (auth.uid() = user_id);
create policy "runs admin update" on public.runs for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "points own insert" on public.run_points;
drop policy if exists "points own read" on public.run_points;
create policy "points own insert" on public.run_points for insert with check (auth.uid() = user_id);
create policy "points own read" on public.run_points for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "groups create" on public.groups;
drop policy if exists "groups read public or member" on public.groups;
drop policy if exists "groups owner update" on public.groups;
create policy "groups create" on public.groups for insert with check (auth.uid() = owner_user_id);
create policy "groups read public or member" on public.groups for select using (
  is_private = false or owner_user_id = auth.uid() or exists (
    select 1 from public.group_members gm where gm.group_id = groups.id and gm.user_id = auth.uid()
  )
);
create policy "groups owner update" on public.groups for update using (owner_user_id = auth.uid() or public.is_admin());

drop policy if exists "members join" on public.group_members;
drop policy if exists "members read related" on public.group_members;
drop policy if exists "members owner manage" on public.group_members;
create policy "members join" on public.group_members for insert with check (auth.uid() = user_id);
create policy "members read related" on public.group_members for select using (
  user_id = auth.uid() or public.is_admin() or exists (
    select 1 from public.group_members own where own.group_id = group_members.group_id and own.user_id = auth.uid()
  )
);
create policy "members owner manage" on public.group_members for delete using (
  user_id = auth.uid() or public.is_admin() or exists (
    select 1 from public.groups g where g.id = group_members.group_id and g.owner_user_id = auth.uid()
  )
);

drop policy if exists "history read active" on public.history_content;
drop policy if exists "history admin write" on public.history_content;
create policy "history read active" on public.history_content for select using (active = true);
create policy "history admin write" on public.history_content for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "legal read active" on public.legal_pages;
drop policy if exists "legal admin write" on public.legal_pages;
create policy "legal read active" on public.legal_pages for select using (active = true);
create policy "legal admin write" on public.legal_pages for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "analytics insert own or anon" on public.analytics_events;
drop policy if exists "analytics admin read" on public.analytics_events;
create policy "analytics insert own or anon" on public.analytics_events for insert with check (user_id is null or auth.uid() = user_id);
create policy "analytics admin read" on public.analytics_events for select using (public.is_admin());

drop policy if exists "audit admin read" on public.audit_logs;
drop policy if exists "audit insert own" on public.audit_logs;
create policy "audit admin read" on public.audit_logs for select using (public.is_admin());
create policy "audit insert own" on public.audit_logs for insert with check (user_id is null or auth.uid() = user_id);

insert into public.challenge_config (
  name, total_steps, start_lat, start_lng, start_radius_m, end_lat, end_lng, end_radius_m,
  expected_elevation_gain_m, elevation_valid_min_m, elevation_valid_max_m,
  elevation_review_min_m, elevation_review_max_m, gps_accuracy_valid_max_m,
  gps_accuracy_review_max_m, min_duration_seconds, max_duration_seconds,
  publish_needs_review, donation_url, active
) values (
  'Tusiger', 1000, 47.315206553, 7.886963657, 25, 47.318954559, 7.882850574, 35,
  235, 205, 265, 180, 290, 25, 45, 240, 7200, false, '', true
) on conflict do nothing;

insert into public.history_content (slug, language, year_label, title, body, sort_order) values
('1904', 'de', '1904', 'Inbetriebnahme', 'Inbetriebnahme der Druckleitung und der Borntreppe.', 1),
('1960', 'de', '1960', 'Rückbau', 'Rückbau der Druckleitung und beginnender Zerfall der Treppe.', 2),
('1986', 'de', '1986', 'Neuerstellung', 'Neuerstellung des Stäglis durch den Aarburger Initianten Herbert Scheidegger, kurz «Born-Hörbi» genannt.', 3),
('1987-open', 'de', '1987', 'Eröffnung', 'Eröffnung des Stäglis, heute 1150 Stufen.', 4),
('1987-care', 'de', '1987', 'Unterhalt durch Freiwillige', 'Beginn mit dem Unterhalt durch Freiwillige.', 5)
on conflict (slug) do nothing;

insert into public.legal_pages (slug, language, title, body, version) values
('datenschutz', 'de', 'Datenschutzrichtlinie', 'Entwurf, rechtlich zu prüfen. Betreiber: Mario Martic / seven-art.com, Riedtalstrasse 14a, 4800 Zofingen, Schweiz, mario@seven-art.com. Verarbeitet werden E-Mail für Auth, öffentliche Profilangaben, GPS-Punkte während aktiver Läufe, Gruppen und first-party Analytics.', 'draft-legal-review-required'),
('nutzungsbedingungen', 'de', 'Nutzungsbedingungen', 'Entwurf, rechtlich zu prüfen. Tusiger ist ein privates Herzprojekt. Sportliche Aktivitäten erfolgen auf eigene Verantwortung.', 'draft-legal-review-required'),
('impressum', 'de', 'Impressum', 'Mario Martic / seven-art.com, Riedtalstrasse 14a, 4800 Zofingen, Schweiz. E-Mail: mario@seven-art.com. Telefon: 076 572 20 81.', 'draft-legal-review-required'),
('standort-sensoren', 'de', 'Standort- und Sensor-Einwilligung', 'Entwurf, rechtlich zu prüfen. Standortdaten werden erst nach Nutzeraktion im Pre-Run und während eines aktiven Laufs verwendet. iPhone Safari kann Höhenwerte ungenau oder gar nicht liefern.', 'draft-legal-review-required')
on conflict (slug, language) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "avatar read public" on storage.objects;
drop policy if exists "avatar own upload" on storage.objects;
drop policy if exists "avatar own update" on storage.objects;
drop policy if exists "avatar own delete" on storage.objects;
create policy "avatar read public" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatar own upload" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatar own update" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatar own delete" on storage.objects for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
