-- Life Manager — Supabase schema
-- Run this in your Supabase project: SQL Editor → New query → Run
-- All tables use Row Level Security so each user only sees their own rows.

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
create policy "ipos: own rows" on ipos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Enable realtime for all tables ───────────────────────────────────────────
-- Run this after creating tables so the app receives live updates.
alter publication supabase_realtime add table grocery;
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table office;
alter publication supabase_realtime add table key_dates;
alter publication supabase_realtime add table monthly;
alter publication supabase_realtime add table expenses;
alter publication supabase_realtime add table ipos;
