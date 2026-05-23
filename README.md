# Life Manager

A small personal command-center for daily life. Pages:

- **Dashboard** — summary cards for everything below.
- **Grocery List** — items with qty, category, priority, notes (editable).
- **Upcoming Events** — title, date, time (editable, deletable).
- **Office Pending Work** — title, due date, status, project, priority, description.
- **Key Dates & Events** — past memories + recurring annual dates.
- **Monthly Tasks** — per-month list with optional due dates and notes (editable).
- **Upcoming IPOs** — manual tracker with price band, GMP, status, dates.
- **India Headlines** — top 5 Google News India stories (auto-fetched).
- **Cricket Scores** — live India + IPL matches via CricAPI.
- **Expense Tracker** — daily expenses with category, payment method, merchant, tags, and recurring flag.

Phase 1 (now): React + Vite + Tailwind, local data persisted to `localStorage`.
Phase 2 (later): swap the data layer to Supabase with multi-user auth + RLS.

## Getting started

```bash
cd life-manager
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

To make a production build:

```bash
npm run build
npm run preview
```

## API keys (.env)

The News and Cricket pages call external APIs. Copy `.env.example` to `.env` and fill in keys:

```bash
cp .env.example .env
```

- **CricAPI key** — Cricket Scores page. Get a free key at https://cricapi.com (free tier: 100 reqs/day). Set `VITE_CRICAPI_KEY` in `.env`.
- **News** — uses Google News India RSS via `rss2json.com`. No key needed for low traffic.
- **IPO/GMP** — there's no reliable free public API for live GMP, so this page is a manual tracker. The page includes links to Chittorgarh, IPO Watch, and InvestorGain where you can look up GMP.

After changing `.env`, restart `npm run dev` for Vite to pick up the new values.

## Project structure

```
life-manager/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── components/
    │   ├── Sidebar.jsx
    │   ├── PageHeader.jsx
    │   └── EmptyState.jsx
    ├── hooks/
    │   └── useLocalCollection.js
    ├── lib/
    │   └── dateUtils.js
    └── pages/
        ├── Dashboard.jsx
        ├── Grocery.jsx
        ├── Events.jsx
        ├── Office.jsx
        ├── KeyDates.jsx
        ├── Monthly.jsx
        ├── IPO.jsx
        ├── News.jsx
        └── Cricket.jsx
```

## Data model

- **grocery**: id, name, qty, category, priority, notes, checked, created_at
- **events**: id, title, date, time, created_at
- **office**: id, title, due_date, status, project, priority, description, created_at
- **keyDates**: id, title, date, type ('memory' | 'recurring'), notes, created_at
- **monthly**: id, month (YYYY-MM), title, due_date, notes, done, created_at
- **ipos**: id, name, open_date, close_date, listing_date, price_band, gmp, status, link, notes, created_at
- **expenses**: id, date, category, amount, description, payment_method, merchant, recurring, tags (text[]), created_at

News and Cricket are fetched live from third-party APIs and are not stored locally.

## Deploy to GitHub Pages

The repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml` that builds the app and publishes it on every push to `main`.

One-time setup:

1. Create a public repo on github.com named exactly **life-manager** (the name must match `base` in `vite.config.js`).
2. From `C:\TestCode\life-manager` run:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/life-manager.git
   git push -u origin main
   ```

3. On GitHub: **Settings → Pages → Build and deployment → Source = GitHub Actions**.
4. The first push kicks off the workflow. After it finishes (Actions tab), your site is live at `https://<your-username>.github.io/life-manager/`.

Subsequent pushes auto-deploy. No manual steps.

**Note on the Cricket page:** `VITE_*` env vars are baked into the public JS bundle, so a CricAPI key configured in CI would be visible to anyone. The deployed site therefore won't have cricket scores by default — only the local dev environment will. Everything else (Grocery, Expenses, Events, Office, Key Dates, Monthly, IPO, News, Dashboard) works on the live site.

## Switching to Supabase (Phase 2)

1. Create a Supabase project. Copy the project URL and anon key into `.env`:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
2. Install: `npm install @supabase/supabase-js`.
3. Create `src/lib/supabase.js`:
   ```js
   import { createClient } from '@supabase/supabase-js';
   export const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_ANON_KEY
   );
   ```
4. Replace the internals of `useLocalCollection.js` with `supabase.from(table)` calls. The hook's external shape (items, add, update, remove) stays the same, so the pages don't need to change.
5. Run this SQL in the Supabase SQL editor:

```sql
create table if not exists grocery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  qty text,
  category text,
  priority text,
  notes text,
  checked boolean default false,
  created_at timestamptz default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  date date not null,
  time time,
  created_at timestamptz default now()
);

create table if not exists office (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due_date date,
  status text default 'Pending',
  project text,
  priority text default 'Medium',
  description text,
  created_at timestamptz default now()
);

create table if not exists key_dates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  date date not null,
  type text not null check (type in ('memory', 'recurring')),
  notes text,
  created_at timestamptz default now()
);

create table if not exists monthly (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null,
  title text not null,
  due_date date,
  notes text,
  done boolean default false,
  created_at timestamptz default now()
);

create table if not exists ipos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  open_date date,
  close_date date,
  listing_date date,
  price_band text,
  gmp text,
  status text default 'Upcoming',
  link text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  category text not null,
  amount numeric(12,2) not null,
  description text,
  payment_method text,
  merchant text,
  recurring boolean default false,
  tags text[],
  created_at timestamptz default now()
);

alter table grocery   enable row level security;
alter table events    enable row level security;
alter table office    enable row level security;
alter table key_dates enable row level security;
alter table monthly   enable row level security;
alter table ipos      enable row level security;
alter table expenses  enable row level security;

create policy "own rows" on grocery   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on events    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on office    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on key_dates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on monthly   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on ipos      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on expenses  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

6. Add login UI using `supabase.auth.signInWithPassword` / `signUp` and gate the app behind a session.
