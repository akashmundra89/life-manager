-- Life Manager — Supabase schema
-- Run this in your Supabase project: SQL Editor → New query → Run.
-- All tables use Row Level Security so each user only sees their own rows.
-- This script is idempotent: safe to re-run as the schema evolves.

-- ── grocery ───────────────────────────────────────────────────────────────────
create table if not exists grocery (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  qty          text,
  category     text,
  priority     text,
  notes        text,
  checked      boolean default false,
  created_at   timestamptz default now()
);
alter table grocery enable row level security;
drop policy if exists "grocery: own rows" on grocery;
create policy "grocery: own rows" on grocery
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── events ────────────────────────────────────────────────────────────────────
create table if not exists events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  title        text not null,
  date         text,
  time         text,
  created_at   timestamptz default now()
);
alter table events enable row level security;
drop policy if exists "events: own rows" on events;
create policy "events: own rows" on events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── office ────────────────────────────────────────────────────────────────────
create table if not exists office (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  title        text not null,
  due_date     text,
  status       text,
  project      text,
  priority     text,
  description  text,
  created_at   timestamptz default now()
);
alter table office enable row level security;
drop policy if exists "office: own rows" on office;
create policy "office: own rows" on office
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── key_dates ─────────────────────────────────────────────────────────────────
create table if not exists key_dates (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  title        text not null,
  date         text,
  type         text,
  notes        text,
  created_at   timestamptz default now()
);
alter table key_dates enable row level security;
drop policy if exists "key_dates: own rows" on key_dates;
create policy "key_dates: own rows" on key_dates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── monthly ───────────────────────────────────────────────────────────────────
create table if not exists monthly (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  month        text not null,
  title        text not null,
  due_date     text,
  notes        text,
  done         boolean default false,
  created_at   timestamptz default now()
);
alter table monthly enable row level security;
drop policy if exists "monthly: own rows" on monthly;
create policy "monthly: own rows" on monthly
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── expenses ──────────────────────────────────────────────────────────────────
create table if not exists expenses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  date            text,
  category        text,
  amount          numeric,
  description     text,
  payment_method  text,
  merchant        text,
  recurring       boolean default false,
  tags            text[],
  created_at      timestamptz default now()
);
alter table expenses enable row level security;
drop policy if exists "expenses: own rows" on expenses;
create policy "expenses: own rows" on expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── ipos ──────────────────────────────────────────────────────────────────────
create table if not exists ipos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  name          text not null,
  open_date     text,
  close_date    text,
  listing_date  text,
  price_band    text,
  gmp           text,
  status        text,
  link          text,
  notes         text,
  created_at    timestamptz default now()
);
alter table ipos enable row level security;
drop policy if exists "ipos: own rows" on ipos;
create policy "ipos: own rows" on ipos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── people ────────────────────────────────────────────────────────────────────
create table if not exists people (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  dob          text,
  role         text,
  color        text,
  created_at   timestamptz default now()
);
alter table people enable row level security;
drop policy if exists "people: own rows" on people;
create policy "people: own rows" on people
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── achievements ──────────────────────────────────────────────────────────────
create table if not exists achievements (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  person        text,
  date          text,
  title         text not null,
  description   text,
  category      text,
  tier          text,
  grade_level   text,
  issuer        text,
  photo_url     text,
  tags          text[],
  quote         text,
  created_at    timestamptz default now()
);
alter table achievements enable row level security;
drop policy if exists "achievements: own rows" on achievements;
create policy "achievements: own rows" on achievements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── push_subscriptions ───────────────────────────────────────────────────────
-- One row per device/browser the user has opted in for reminders from.
-- The Edge Function `daily-reminders` reads this table each morning.
create table if not exists push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  endpoint     text not null unique,
  p256dh       text not null,
  auth         text not null,
  user_agent   text,
  created_at   timestamptz default now(),
  last_seen_at timestamptz default now()
);
alter table push_subscriptions enable row level security;
drop policy if exists "push_subscriptions: own rows" on push_subscriptions;
create policy "push_subscriptions: own rows" on push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Enable realtime for all tables ───────────────────────────────────────────
-- Adding a table to a publication errors if it's already there, so wrap in
-- DO blocks that swallow the duplicate_object exception.
do $$
declare t text;
begin
  foreach t in array array[
    'grocery','events','office','key_dates','monthly',
    'expenses','ipos','people','achievements','push_subscriptions'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
