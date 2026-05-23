import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import useLocalCollection from '../hooks/useLocalCollection.js';
import {
  formatDate,
  daysUntil,
  daysUntilNextOccurrence,
  currentMonthKey,
  formatMonthKey,
} from '../lib/dateUtils.js';

export default function Dashboard() {
  const grocery = useLocalCollection('grocery', []);
  const events = useLocalCollection('events', []);
  const office = useLocalCollection('office', []);
  const keyDates = useLocalCollection('keyDates', []);
  const monthly = useLocalCollection('monthly', []);

  const month = currentMonthKey();

  const urgentGroceries = useMemo(
    () =>
      grocery.items
        .filter((g) => !g.checked && g.priority === 'High')
        .slice(0, 5),
    [grocery.items]
  );

  const upcomingEvents = useMemo(() => {
    return [...events.items]
      .filter((e) => {
        const d = daysUntil(e.date);
        return d != null && d >= 0 && d <= 7;
      })
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .slice(0, 5);
  }, [events.items]);

  const officeDueSoon = useMemo(() => {
    return [...office.items]
      .filter((t) => t.status !== 'Done')
      .filter((t) => {
        const d = daysUntil(t.due_date);
        return d == null ? false : d <= 7;
      })
      .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
      .slice(0, 5);
  }, [office.items]);

  const recurringSoon = useMemo(() => {
    return keyDates.items
      .filter((k) => k.type === 'recurring')
      .map((k) => ({ ...k, _d: daysUntilNextOccurrence(k.date) }))
      .filter((k) => k._d != null && k._d <= 14)
      .sort((a, b) => a._d - b._d)
      .slice(0, 5);
  }, [keyDates.items]);

  const monthThis = useMemo(
    () => monthly.items.filter((i) => i.month === month),
    [monthly.items, month]
  );
  const monthDone = monthThis.filter((i) => i.done).length;
  const monthPct =
    monthThis.length > 0 ? Math.round((monthDone / monthThis.length) * 100) : 0;

  return (
    <div>
      <PageHeader
        title={`Hi Akash 👋`}
        subtitle={`Here's what's on your plate · ${formatDate(new Date().toISOString())}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card title="Upcoming events (7 days)" to="/events" count={upcomingEvents.length}>
          {upcomingEvents.length === 0 ? (
            <Hint>No events in the next week.</Hint>
          ) : (
            <ul className="space-y-2">
              {upcomingEvents.map((e) => {
                const d = daysUntil(e.date);
                return (
                  <li key={e.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{e.title}</span>
                    <span className={pillFor(d)}>{labelFor(d)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Urgent groceries" to="/grocery" count={urgentGroceries.length}>
          {urgentGroceries.length === 0 ? (
            <Hint>No high-priority items pending.</Hint>
          ) : (
            <ul className="space-y-2">
              {urgentGroceries.map((g) => (
                <li key={g.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">
                    {g.name}{g.qty ? ` · ${g.qty}` : ''}
                  </span>
                  <span className="text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                    High
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Office due soon (7 days)" to="/office" count={officeDueSoon.length}>
          {officeDueSoon.length === 0 ? (
            <Hint>No tasks due in the next week.</Hint>
          ) : (
            <ul className="space-y-2">
              {officeDueSoon.map((t) => {
                const d = daysUntil(t.due_date);
                return (
                  <li key={t.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{t.title}</span>
                    <span className={pillFor(d)}>{labelFor(d)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title={`Monthly progress · ${formatMonthKey(month)}`} to="/monthly" count={monthThis.length}>
          <div className="text-sm text-slate-600 mb-2">
            {monthDone} of {monthThis.length} done · {monthPct}%
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${monthPct}%` }}
            />
          </div>
        </Card>

        <Card title="Recurring dates (2 weeks)" to="/key-dates" count={recurringSoon.length}>
          {recurringSoon.length === 0 ? (
            <Hint>No recurring dates approaching.</Hint>
          ) : (
            <ul className="space-y-2">
              {recurringSoon.map((k) => (
                <li key={k.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{k.title}</span>
                  <span className="text-xs text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                    {k._d === 0 ? 'Today' : `in ${k._d}d`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Quick links" count={null}>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <QuickLink to="/grocery" label="Grocery" />
            <QuickLink to="/events" label="Events" />
            <QuickLink to="/office" label="Office" />
            <QuickLink to="/key-dates" label="Key Dates" />
            <QuickLink to="/monthly" label="Monthly" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, to, count, children }) {
  const header = (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {count != null && (
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
  const body = (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors h-full">
      {header}
      {children}
    </div>
  );
  return to ? <Link to={to} className="block">{body}</Link> : body;
}

function Hint({ children }) {
  return <div className="text-sm text-slate-500">{children}</div>;
}

function QuickLink({ to, label }) {
  return (
    <Link
      to={to}
      className="px-3 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-center"
    >
      {label}
    </Link>
  );
}

function pillFor(d) {
  if (d == null) return 'text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full';
  if (d < 0) return 'text-xs bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full';
  if (d === 0) return 'text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full';
  if (d <= 3) return 'text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full';
  return 'text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full';
}

function labelFor(d) {
  if (d == null) return '—';
  if (d < 0) return 'past';
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  return `in ${d}d`;
}
