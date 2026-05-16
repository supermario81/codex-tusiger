create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  nickname text not null check (char_length(nickname) between 3 and 20),
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.challenge_config (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  total_steps int not null default 1000,
  start_lat double precision not null,
  start_lng double precision not null,
  start_radius_m double precision not null,
  end_lat double precision not null,
  end_lng double precision not null,
  end_radius_m double precision not null,
  expected_elevation_gain_m double precision not null,
  elevation_valid_min_m double precision not null,
  elevation_valid_max_m double precision not null,
  elevation_review_min_m double precision not null,
  elevation_review_max_m double precision not null,
  gps_accuracy_valid_max_m double precision not null,
  gps_accuracy_review_max_m double precision not null,
  min_duration_seconds int not null,
  max_duration_seconds int not null,
  publish_needs_review boolean not null default false,
  donation_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds double precision,
  status text not null default 'draft' check (status in ('valid', 'needs_review', 'invalid', 'draft')),
  validation_score int not null default 0,
  validation_reasons jsonb not null default '[]'::jsonb,
  start_lat double precision,
  start_lng double precision,
  end_lat double precision,
  end_lng double precision,
  elevation_gain_m double precision,
  gps_accuracy_avg_m double precision,
  gps_accuracy_min_m double precision,
  gps_accuracy_max_m double precision,
  estimated_steps int,
  pace_per_100_steps_seconds double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.run_points (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.runs(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  recorded_at timestamptz not null,
  lat double precision not null,
  lng double precision not null,
  altitude_m double precision,
  altitude_accuracy_m double precision,
  accuracy_m double precision not null,
  speed_mps double precision,
  heading double precision,
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  invite_code text unique not null,
  is_private boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique(group_id, user_id)
);

create table public.motivation_messages (
  id uuid primary key default gen_random_uuid(),
  min_steps int not null,
  max_steps int not null,
  intensity int not null,
  message text not null,
  active boolean not null default true
);

create table public.history_content (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null,
  year_label text not null,
  title text not null,
  body text not null,
  active boolean not null default true
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text not null,
  entity_type text not null,
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
    where user_id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.challenge_config enable row level security;
alter table public.runs enable row level security;
alter table public.run_points enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.motivation_messages enable row level security;
alter table public.history_content enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles public identity read" on public.profiles
  for select using (true);
create policy "profiles own insert" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "profiles own update" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "challenge active read" on public.challenge_config
  for select using (active = true);
create policy "challenge admin write" on public.challenge_config
  for all using (public.is_admin()) with check (public.is_admin());

create policy "runs own insert" on public.runs
  for insert with check (auth.uid() = user_id);
create policy "runs own read" on public.runs
  for select using (auth.uid() = user_id or status = 'valid' or (status = 'needs_review' and exists (select 1 from public.challenge_config where active and publish_needs_review)));
create policy "runs admin update" on public.runs
  for update using (public.is_admin()) with check (public.is_admin());

create policy "points own insert" on public.run_points
  for insert with check (auth.uid() = user_id);
create policy "points own read" on public.run_points
  for select using (auth.uid() = user_id or public.is_admin());

create policy "groups create" on public.groups
  for insert with check (auth.uid() = owner_user_id);
create policy "groups read public or member" on public.groups
  for select using (
    is_private = false or owner_user_id = auth.uid() or exists (
      select 1 from public.group_members gm
      where gm.group_id = groups.id and gm.user_id = auth.uid()
    )
  );
create policy "groups owner update" on public.groups
  for update using (owner_user_id = auth.uid() or public.is_admin());

create policy "members join" on public.group_members
  for insert with check (auth.uid() = user_id);
create policy "members read related" on public.group_members
  for select using (
    user_id = auth.uid() or public.is_admin() or exists (
      select 1 from public.group_members own
      where own.group_id = group_members.group_id and own.user_id = auth.uid()
    )
  );
create policy "members owner manage" on public.group_members
  for delete using (
    user_id = auth.uid() or public.is_admin() or exists (
      select 1 from public.groups g
      where g.id = group_members.group_id and g.owner_user_id = auth.uid()
    )
  );

create policy "motivation read active" on public.motivation_messages
  for select using (active = true);
create policy "motivation admin write" on public.motivation_messages
  for all using (public.is_admin()) with check (public.is_admin());

create policy "history read active" on public.history_content
  for select using (active = true);
create policy "history admin write" on public.history_content
  for all using (public.is_admin()) with check (public.is_admin());

create policy "audit admin read" on public.audit_logs
  for select using (public.is_admin());

insert into public.challenge_config (
  name, total_steps, start_lat, start_lng, start_radius_m, end_lat, end_lng, end_radius_m,
  expected_elevation_gain_m, elevation_valid_min_m, elevation_valid_max_m,
  elevation_review_min_m, elevation_review_max_m, gps_accuracy_valid_max_m,
  gps_accuracy_review_max_m, min_duration_seconds, max_duration_seconds,
  publish_needs_review, donation_url, active
) values (
  'Tusiger', 1000, 47.315206553, 7.886963657, 25, 47.318954559, 7.882850574, 35,
  235, 205, 265, 180, 290, 25, 45, 240, 7200, false, 'https://example.org/spenden', true
);

insert into public.motivation_messages (min_steps, max_steps, intensity, message) values
(0, 200, 1, 'Starker Start. Finde deinen Rhythmus.'),
(0, 200, 1, 'Ruhig bleiben. Jeder Schritt zählt.'),
(200, 400, 2, 'Dranbleiben. Du bist im Flow.'),
(200, 400, 2, 'Stabil. Genau so weiter.'),
(400, 600, 3, 'Halbzeit. Jetzt beginnt der echte Tusiger.'),
(400, 600, 3, 'Du hast den Berg im Griff.'),
(600, 800, 4, 'Nicht nachlassen. Du bist stärker als du denkst.'),
(600, 800, 4, 'Jetzt zählt Fokus.'),
(800, 950, 5, 'Letzte Meter. Alles geben.'),
(800, 950, 5, 'Oben wartet deine Zeit.'),
(950, 1000, 6, 'Finish. Zieh durch.'),
(950, 1000, 6, 'Du hast es gleich geschafft.');

insert into public.history_content (sort_order, year_label, title, body) values
(1, '2021', 'Die Idee entsteht', 'Eine Challenge unter Freunden wird zur Herzensmission.'),
(2, '2022', 'Gemeinschaft wächst', 'Immer mehr Menschen finden zusammen und gehen gemeinsam den Weg.'),
(3, 'Heute', '1000 Stufen. Jeden Tag.', 'Tausende Schritte. Unzählige Geschichten. Ein Ziel: besser werden, zusammen.');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "avatar read public" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "avatar own upload" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatar own update" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatar own delete" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
