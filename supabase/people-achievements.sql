-- Life Manager — People + Achievements tables
-- Run this in your Supabase project: SQL Editor → New query → Run.
-- Safe to re-run (uses CREATE TABLE IF NOT EXISTS + CREATE POLICY IF NOT EXISTS).

-- ── people ────────────────────────────────────────────────────────────────────
create table if not exists people (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  dob          text,        -- ISO date 'YYYY-MM-DD'
  role         text,        -- 'Kid' | 'Adult'
  color        text,        -- hex color like '#3b6dff'
  created_at   timestamptz default now()
);

alter table people enable row level security;

create policy "people: own rows" on people
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── achievements ──────────────────────────────────────────────────────────────
create table if not exists achievements (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  person        text,        -- name of the person (matches people.name)
  date          text,        -- ISO date 'YYYY-MM-DD'
  title         text not null,
  description   text,
  category      text,        -- Academic | Sports | Arts | Music | Social | Milestone | Certificate | Other
  tier          text,        -- Gold | Silver | Bronze | Participation | —
  grade_level   text,        -- 'Class 5', 'College Y1', etc.
  issuer        text,        -- school / organization
  photo_url     text,        -- pasted URL
  tags          text[],      -- array of free-form tags
  quote         text,        -- optional pull quote
  created_at    timestamptz default now()
);

alter table achievements enable row level security;

create policy "achievements: own rows" on achievements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Enable realtime ───────────────────────────────────────────────────────────
-- So the app receives live updates across devices.
alter publication supabase_realtime add table people;
alter publication supabase_realtime add table achievements;
