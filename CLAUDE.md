# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server on port 5173
npm run build        # Production build → dist/
npm run preview      # Serve dist/ locally
npm run gen:icons    # Regenerate public/icon-192.png, icon-512.png, apple-touch-icon.png
```

There is no test suite.

## Architecture

### Data layer — `src/hooks/useLocalCollection.js`

This is the single most important file. Every page calls it as:

```js
const { items, add, update, remove, replaceAll, loading } = useLocalCollection('collectionName', seedData);
```

All three backend implementations are **always instantiated** (React rules of hooks), but only one is returned:

| Condition | Backend | Storage |
|---|---|---|
| `VITE_SUPABASE_*` env vars absent | `useLocalStorageImpl` | `localStorage` key `life-manager:{name}` |
| Supabase configured + `guestMode` | `useIndexedDBImpl` | IndexedDB DB `life-manager-idb`, store `collections` |
| Supabase configured + signed-in user | `useSupabaseImpl` | Supabase table, real-time subscription, optimistic updates |

Collection name → Supabase table name: `keyDates` → `key_dates`; all others are identical. This mapping lives in `TABLE_MAP` at the top of the hook.

Supabase writes are optimistic (state updated immediately, rolled back on error). Real-time `postgres_changes` subscriptions dedup incoming INSERT events against items already added optimistically.

### Auth — `src/contexts/AuthContext.jsx`

`AuthProvider` wraps the whole app in `main.jsx`. The flag `isSupabaseConfigured` (exported from `src/lib/supabase.js`) is the master switch:

- **Not configured**: `loading` is `false` immediately, no login gate, localStorage mode.
- **Configured**: `getSession()` runs on mount; `App.jsx` renders `<Login />` until `user || guestMode` is truthy.
- **Guest mode**: `localStorage['life-manager:guest-mode'] = 'true'`. Cleared by `exitGuestMode()` or `signOut()`.

Context value: `{ user, loading, guestMode, signIn, signUp, signOut, enterGuestMode, exitGuestMode }`.

### Routing

`HashRouter` — all routes are `/#/path`. Flat route tree defined entirely in `src/App.jsx`. No nested `<Routes>`. The sidebar's `<NavLink>` components call `onClose` on tap to dismiss the mobile slide-over.

### Adding a new page

1. `src/pages/NewPage.jsx` — use `useLocalCollection('tableName', [])` for persistence.
2. Add `<Route path="/new-page" element={<NewPage />} />` in `src/App.jsx`.
3. Add entry to `links` array in `src/components/Sidebar.jsx`.
4. **If Supabase is used**: add the table + RLS policy to `supabase/schema.sql` following the existing pattern, and add it to the `supabase_realtime` publication at the bottom of that file.

## Environment variables

```
VITE_SUPABASE_URL=       # Absence disables auth entirely; app works via localStorage
VITE_SUPABASE_ANON_KEY=  # Same — both must be set or both ignored
VITE_CRICAPI_KEY=        # Optional; Cricket page shows an error without it
```

Copy `.env.example` to `.env`. The `.env` file is gitignored.

## Deployment

**Vercel**: env vars must be added in Vercel project settings (Settings → Environment Variables). `vercel.json` has a single catch-all rewrite to `index.html` for SPA routing.

**Supabase tables**: must be created manually by running `supabase/schema.sql` in the Supabase SQL Editor. The schema creates all 7 tables with Row Level Security (`auth.uid() = user_id`) and enables real-time for each table.

**PWA icons**: if the brand color (`#3b6dff` in `tailwind.config.js` and `vite.config.js`) changes, regenerate icons with `npm run gen:icons`. The script (`scripts/generate-icons.mjs`) uses only Node built-ins.
