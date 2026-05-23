import { useMemo } from 'react';
import {
  AlertCircle, Clock, CheckCircle2, Wallet,
  CalendarDays, ShoppingCart, Briefcase, CalendarCheck, Star,
  ArrowRight, Sparkles, Plus,
} from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import { Card, CardHeader, Stat, Badge, badgeForDays, labelForDays, ProgressRing, Button } from '../components/ui';
import useLocalCollection from '../hooks/useLocalCollection.js';
import { useAuth } from '../contexts/AuthContext';
import {
  formatDate,
  daysUntil,
  daysUntilNextOccurrence,
  currentMonthKey,
  formatMonthKey,
} from '../lib/dateUtils.js';
import { cx } from '../lib/cx.js';

export default function Dashboard() {
  const auth = useAuth();
  const grocery = useLocalCollection('grocery', []);
  const events = useLocalCollection('events', []);
  const office = useLocalCollection('office', []);
  const keyDates = useLocalCollection('keyDates', []);
  const monthly = useLocalCollection('monthly', []);
  const expenses = useLocalCollection('expenses', []);

  const month = currentMonthKey();
  const firstName = (auth?.user?.email?.split('@')[0] || 'Akash').replace(/[._-]/g, ' ').split(' ')[0];
  const niceName = firstName[0].toUpperCase() + firstName.slice(1);
  const greeting = greetingFor(new Date());

  // ── Aggregations ─────────────────────────────────────────────────────────
  const urgentGroceries = useMemo(
    () => grocery.items.filter((g) => !g.checked && g.priority === 'High').slice(0, 5),
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
  const monthPct = monthThis.length > 0 ? Math.round((monthDone / monthThis.length) * 100) : 0;

  // Stat strip metrics
  const overdueCount = useMemo(() => {
    return [...office.items, ...events.items].filter((it) => {
      const d = daysUntil(it.due_date || it.date);
      const isDone = it.status === 'Done';
      return !isDone && d != null && d < 0;
    }).length;
  }, [office.items, events.items]);

  const dueTodayCount = useMemo(() => {
    return [...office.items, ...events.items].filter((it) => {
      const d = daysUntil(it.due_date || it.date);
      const isDone = it.status === 'Done';
      return !isDone && d === 0;
    }).length;
  }, [office.items, events.items]);

  const doneThisWeek = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 86400000;
    return office.items.filter((t) => {
      if (t.status !== 'Done') return false;
      const ts = t.completed_at ? new Date(t.completed_at).getTime() : (t.created_at ? new Date(t.created_at).getTime() : 0);
      return ts >= weekAgo;
    }).length;
  }, [office.items]);

  const monthSpend = useMemo(() => {
    const total = expenses.items
      .filter((i) => (i.date || '').startsWith(month))
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    return total;
  }, [expenses.items, month]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        icon={<Sparkles className="w-5 h-5" />}
        title={`${greeting}, ${niceName}`}
        subtitle={`${formatDate(new Date().toISOString())} · ${attentionPhrase(overdueCount, dueTodayCount)}`}
        action={
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4" /> Quick add
          </Button>
        }
      />

      {/* STAT STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <Stat
          label="Overdue"
          value={overdueCount}
          tone="rose"
          icon={<AlertCircle className="w-4 h-4" />}
          delta={overdueCount > 0 ? { kind: 'down', text: 'needs attention' } : { kind: 'up', text: 'all clear' }}
          className="animate-fade-up"
        />
        <Stat
          label="Due today"
          value={dueTodayCount}
          tone="amber"
          icon={<Clock className="w-4 h-4" />}
          delta={{ kind: 'neutral', text: dueTodayCount === 0 ? 'nothing pressing' : 'on the menu' }}
          className="animate-fade-up [animation-delay:60ms]"
        />
        <Stat
          label="Done this week"
          value={doneThisWeek}
          tone="emerald"
          icon={<CheckCircle2 className="w-4 h-4" />}
          delta={{ kind: 'up', text: 'last 7 days' }}
          className="animate-fade-up [animation-delay:120ms]"
        />
        <Stat
          label={`${formatMonthKey(month).split(' ')[0]} spend`}
          value={formatMoney(monthSpend)}
          tone="indigo"
          icon={<Wallet className="w-4 h-4" />}
          delta={{ kind: 'neutral', text: `${expenses.items.filter((i) => (i.date || '').startsWith(month)).length} txns` }}
          className="animate-fade-up [animation-delay:180ms]"
        />
      </div>

      {/* CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <DashCard
          to="/events"
          icon={<CalendarDays className="w-4 h-4" />}
          iconTone="indigo"
          title="Upcoming events"
          subtitle="Next 7 days"
          count={upcomingEvents.length}
          delay={220}
          empty={upcomingEvents.length === 0 && 'No events in the next week.'}
        >
          <List>
            {upcomingEvents.map((e) => {
              const d = daysUntil(e.date);
              return (
                <Row key={e.id} name={e.title} badge={<Badge tone={badgeForDays(d)}>{labelForDays(d)}</Badge>} />
              );
            })}
          </List>
        </DashCard>

        <DashCard
          to="/grocery"
          icon={<ShoppingCart className="w-4 h-4" />}
          iconTone="rose"
          title="Urgent groceries"
          subtitle="High priority"
          count={urgentGroceries.length}
          delay={270}
          empty={urgentGroceries.length === 0 && 'No high-priority items pending.'}
        >
          <List>
            {urgentGroceries.map((g) => (
              <Row
                key={g.id}
                name={`${g.name}${g.qty ? ` · ${g.qty}` : ''}`}
                badge={<Badge tone="rose">High</Badge>}
              />
            ))}
          </List>
        </DashCard>

        <DashCard
          to="/office"
          icon={<Briefcase className="w-4 h-4" />}
          iconTone="amber"
          title="Office due soon"
          subtitle="Next 7 days"
          count={officeDueSoon.length}
          delay={320}
          empty={officeDueSoon.length === 0 && 'No tasks due in the next week.'}
        >
          <List>
            {officeDueSoon.map((t) => {
              const d = daysUntil(t.due_date);
              return (
                <Row key={t.id} name={t.title} badge={<Badge tone={badgeForDays(d)}>{labelForDays(d)}</Badge>} />
              );
            })}
          </List>
        </DashCard>

        <DashCard
          to="/monthly"
          icon={<CalendarCheck className="w-4 h-4" />}
          iconTone="emerald"
          title="Monthly progress"
          subtitle={formatMonthKey(month)}
          count={`${monthDone} / ${monthThis.length}`}
          delay={370}
        >
          <div className="flex items-center gap-4">
            <ProgressRing value={monthPct} size={72} stroke={7} />
            <div className="text-sm text-ink-muted leading-tight">
              <div className="font-semibold text-ink">{Math.max(0, monthThis.length - monthDone)} left</div>
              <div className="text-xs text-ink-faint mt-1">
                {monthThis.length === 0 ? 'No tasks yet — add a few.' : monthPct >= 75 ? 'Almost there!' : monthPct >= 40 ? 'On pace.' : 'Just getting started.'}
              </div>
            </div>
          </div>
        </DashCard>

        <DashCard
          to="/key-dates"
          icon={<Star className="w-4 h-4" />}
          iconTone="violet"
          title="Recurring dates"
          subtitle="Next 2 weeks"
          count={recurringSoon.length}
          delay={420}
          empty={recurringSoon.length === 0 && 'No recurring dates approaching.'}
        >
          <List>
            {recurringSoon.map((k) => (
              <Row
                key={k.id}
                name={k.title}
                badge={<Badge tone="violet">{k._d === 0 ? 'today' : `in ${k._d}d`}</Badge>}
              />
            ))}
          </List>
        </DashCard>

        <Card className="animate-fade-up [animation-delay:470ms]" hover={false}>
          <CardHeader
            icon={<Sparkles className="w-4 h-4" />}
            iconTone="brand"
            title="Quick links"
          />
          <div className="grid grid-cols-2 gap-2">
            {[
              { to: '/grocery',   label: 'Grocery',   Icon: ShoppingCart },
              { to: '/events',    label: 'Events',    Icon: CalendarDays },
              { to: '/office',    label: 'Office',    Icon: Briefcase },
              { to: '/expenses',  label: 'Expenses',  Icon: Wallet },
              { to: '/key-dates', label: 'Key dates', Icon: Star },
              { to: '/monthly',   label: 'Monthly',   Icon: CalendarCheck },
            ].map(({ to, label, Icon }) => (
              <a
                key={to}
                href={`#${to}`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl glass-soft glass-hover hover:bg-surface-strong/60 text-sm text-ink-muted hover:text-ink transition-colors"
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </a>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function DashCard({ to, icon, iconTone, title, subtitle, count, children, empty, delay = 0 }) {
  return (
    <Card to={to} className={cx('group animate-fade-up')} hover={true} style={{ animationDelay: `${delay}ms` }}>
      <CardHeader
        icon={icon}
        iconTone={iconTone}
        title={title}
        subtitle={subtitle}
        action={
          <div className="flex items-center gap-2">
            {count != null && count !== 0 && count !== '0' && (
              <Badge tone="slate" size="sm">{count}</Badge>
            )}
            <ArrowRight className="w-4 h-4 text-ink-faint opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </div>
        }
      />
      {empty ? <div className="text-sm text-ink-faint pt-0.5">{empty}</div> : children}
    </Card>
  );
}

function List({ children }) {
  return <ul className="space-y-2">{children}</ul>;
}

function Row({ name, badge }) {
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="truncate text-ink">{name}</span>
      {badge}
    </li>
  );
}

function greetingFor(date) {
  const h = date.getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function attentionPhrase(overdue, today) {
  const n = overdue + today;
  if (n === 0) return "Nothing urgent — enjoy your day.";
  if (overdue > 0 && today > 0) return `${overdue} overdue · ${today} due today.`;
  if (overdue > 0) return `${overdue} overdue item${overdue > 1 ? 's' : ''}.`;
  return `${today} thing${today > 1 ? 's' : ''} due today.`;
}

function formatMoney(n) {
  if (n == null) return '—';
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${Math.round(n)}`;
}
