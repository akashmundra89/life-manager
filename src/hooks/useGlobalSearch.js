import { useMemo } from 'react';
import useLocalCollection from './useLocalCollection.js';

/**
 * Sources are the 11 collections the app stores, plus how each maps to a
 * search result: which fields to match against, what to show as the title
 * and subtitle, and where clicking a result should navigate.
 *
 * Order here defines the order results are grouped in the dropdown.
 */
const SOURCES = [
  {
    key: 'keyDates',
    route: '/key-dates',
    label: 'Key dates',
    fields: ['title', 'notes'],
    title: (it) => it.title,
    subtitle: (it) => it.date || '',
  },
  {
    key: 'events',
    route: '/events',
    label: 'Events',
    fields: ['title'],
    title: (it) => it.title,
    subtitle: (it) => [it.date, it.time].filter(Boolean).join(' · '),
  },
  {
    key: 'office',
    route: '/office',
    label: 'Office',
    fields: ['title', 'description', 'project'],
    title: (it) => it.title,
    subtitle: (it) => [it.project, it.status, it.due_date].filter(Boolean).join(' · '),
  },
  {
    key: 'monthly',
    route: '/monthly',
    label: 'Monthly',
    fields: ['title', 'notes'],
    title: (it) => it.title,
    subtitle: (it) => [it.month, it.due_date].filter(Boolean).join(' · '),
  },
  {
    key: 'grocery',
    route: '/grocery',
    label: 'Grocery',
    fields: ['name', 'category', 'notes'],
    title: (it) => it.name,
    subtitle: (it) => [it.category, it.qty].filter(Boolean).join(' · '),
  },
  {
    key: 'expenses',
    route: '/expenses',
    label: 'Expenses',
    fields: ['description', 'category', 'merchant'],
    title: (it) => it.description || it.merchant || it.category || 'Expense',
    subtitle: (it) => [it.date, it.amount != null ? `₹${Number(it.amount).toLocaleString()}` : null].filter(Boolean).join(' · '),
  },
  {
    key: 'vacationPlans',
    route: '/vacation-planning',
    label: 'Vacation planning',
    fields: ['destination', 'country', 'companions', 'notes'],
    title: (it) => it.destination,
    subtitle: (it) => [it.country, it.start_date, it.status].filter(Boolean).join(' · '),
  },
  {
    key: 'placesVisited',
    route: '/places-visited',
    label: 'Places visited',
    fields: ['place', 'country', 'companions', 'notes'],
    title: (it) => it.place,
    subtitle: (it) => [it.country, it.visited_date].filter(Boolean).join(' · '),
  },
  {
    key: 'achievements',
    route: '/achievements',
    label: 'Achievements',
    fields: ['title', 'description', 'person', 'issuer'],
    title: (it) => it.title,
    subtitle: (it) => [it.person, it.date].filter(Boolean).join(' · '),
  },
  {
    key: 'people',
    route: '/people',
    label: 'Family',
    fields: ['name', 'role'],
    title: (it) => it.name,
    subtitle: (it) => [it.role, it.dob].filter(Boolean).join(' · '),
  },
  {
    key: 'ipos',
    route: '/ipo',
    label: 'IPOs',
    fields: ['name', 'notes'],
    title: (it) => it.name,
    subtitle: (it) => [it.open_date, it.status].filter(Boolean).join(' · '),
  },
];

const MAX_PER_SOURCE = 5;
const MAX_TOTAL = 30;

/**
 * Subscribes to every collection and returns matches for `query`.
 *
 * Mount this hook only when the search UI is open — it spins up one
 * subscription per collection in Supabase mode.
 *
 * Returns:
 *   {
 *     groups: [{ key, label, route, items: [{ id, title, subtitle, snippet }] }],
 *     total,
 *     loading,
 *   }
 */
export default function useGlobalSearch(query) {
  // React rules of hooks: call useLocalCollection in the same order every render.
  // We can't iterate dynamically, so spell each one out.
  const keyDates      = useLocalCollection('keyDates',      []);
  const events        = useLocalCollection('events',        []);
  const office        = useLocalCollection('office',        []);
  const monthly       = useLocalCollection('monthly',       []);
  const grocery       = useLocalCollection('grocery',       []);
  const expenses      = useLocalCollection('expenses',      []);
  const vacationPlans = useLocalCollection('vacationPlans', []);
  const placesVisited = useLocalCollection('placesVisited', []);
  const achievements  = useLocalCollection('achievements',  []);
  const people        = useLocalCollection('people',        []);
  const ipos          = useLocalCollection('ipos',          []);

  const byKey = {
    keyDates, events, office, monthly, grocery, expenses,
    vacationPlans, placesVisited, achievements, people, ipos,
  };

  const loading = Object.values(byKey).some((c) => c.loading);

  return useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    if (!q) return { groups: [], total: 0, loading };

    const groups = [];
    let total = 0;

    for (const src of SOURCES) {
      const coll = byKey[src.key];
      if (!coll) continue;

      const matches = [];
      for (const it of coll.items) {
        if (matches.length >= MAX_PER_SOURCE) break;

        let snippet = '';
        let matched = false;
        for (const field of src.fields) {
          const v = it[field];
          if (typeof v !== 'string') continue;
          const lower = v.toLowerCase();
          const at = lower.indexOf(q);
          if (at !== -1) {
            matched = true;
            // Build a small snippet around the match for context.
            const start = Math.max(0, at - 20);
            const end = Math.min(v.length, at + q.length + 30);
            snippet = (start > 0 ? '…' : '') + v.slice(start, end) + (end < v.length ? '…' : '');
            break;
          }
        }
        if (!matched) continue;

        matches.push({
          id: it.id,
          title: src.title(it) || '(untitled)',
          subtitle: src.subtitle(it) || '',
          snippet,
        });
      }

      if (matches.length > 0) {
        groups.push({ key: src.key, label: src.label, route: src.route, items: matches });
        total += matches.length;
        if (total >= MAX_TOTAL) break;
      }
    }

    return { groups, total, loading };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    query, loading,
    keyDates.items, events.items, office.items, monthly.items,
    grocery.items, expenses.items, vacationPlans.items, placesVisited.items,
    achievements.items, people.items, ipos.items,
  ]);
}
