import { useMemo, useState } from 'react';
import {
  Wallet, ChevronLeft, ChevronRight, Search, Pencil, Trash2,
  Repeat, Tag as TagIcon, Plus, X as XIcon, Filter, TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import PageHeader from '../components/PageHeader.jsx';
import BackupMenu from '../components/BackupMenu.jsx';
import { Card, CardHeader, Stat, Badge, Button, EmptyState } from '../components/ui';
import { Input, Select, Label } from '../components/ui/Input.jsx';
import useLocalCollection from '../hooks/useLocalCollection.js';
import {
  currentMonthKey, formatMonthKey, shiftMonth, formatDate, todayISO,
} from '../lib/dateUtils.js';
import { cx } from '../lib/cx.js';

const CATEGORIES = [
  'Food & Dining', 'Groceries', 'Transport', 'Bills & Utilities', 'Shopping',
  'Health', 'Entertainment', 'Rent', 'Investment', 'Subscriptions',
  'Travel', 'Education', 'Other',
];

const PAYMENT_METHODS = ['UPI', 'Cash', 'Credit Card', 'Debit Card', 'Net Banking', 'Other'];

// Stable color per category — taken from Tailwind palette stops.
const CAT_COLOR = {
  'Food & Dining':     '#f97316', // orange-500
  'Groceries':         '#10b981', // emerald-500
  'Transport':         '#0ea5e9', // sky-500
  'Bills & Utilities': '#6366f1', // indigo-500
  'Shopping':          '#ec4899', // pink-500
  'Health':            '#14b8a6', // teal-500
  'Entertainment':     '#a855f7', // purple-500
  'Rent':              '#f43f5e', // rose-500
  'Investment':        '#22c55e', // green-500
  'Subscriptions':     '#9b6bff', // violet-500
  'Travel':            '#3b6dff', // brand-500
  'Education':         '#eab308', // yellow-500
  'Other':             '#64748b', // slate-500
};

const empty = {
  date: '', category: 'Food & Dining', amount: '',
  description: '', payment_method: 'UPI', merchant: '',
  recurring: false, tagsText: '',
};

export default function Expenses() {
  const { items, add, update, remove, replaceAll } = useLocalCollection('expenses', []);
  const [month, setMonth] = useState(currentMonthKey());
  const [form, setForm] = useState({ ...empty, date: todayISO() });
  const [editingId, setEditingId] = useState(null);

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [search, setSearch] = useState('');

  const monthItems = useMemo(() => {
    return items
      .filter((i) => (i.date || '').startsWith(month))
      .filter((i) => categoryFilter === 'all' || i.category === categoryFilter)
      .filter((i) => paymentFilter === 'all' || i.payment_method === paymentFilter)
      .filter((i) => {
        if (!search.trim()) return true;
        const s = search.trim().toLowerCase();
        return (
          (i.description || '').toLowerCase().includes(s) ||
          (i.merchant || '').toLowerCase().includes(s) ||
          (i.tags || []).some((t) => t.toLowerCase().includes(s))
        );
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [items, month, categoryFilter, paymentFilter, search]);

  const stats = useMemo(() => {
    const all = items.filter((i) => (i.date || '').startsWith(month));
    const total = all.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const count = all.length;
    const byCat = {};
    for (const i of all) {
      const c = i.category || 'Other';
      byCat[c] = (byCat[c] || 0) + (Number(i.amount) || 0);
    }
    const topCategory = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0] || ['—', 0];
    const recurring = all.filter((i) => i.recurring).reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const today = new Date();
    const [y, m] = month.split('-').map(Number);
    const sameMonth = today.getFullYear() === y && today.getMonth() + 1 === m;
    const daysInMonth = new Date(y, m, 0).getDate();
    const daysElapsed = sameMonth ? today.getDate() : daysInMonth;
    const dailyAvg = daysElapsed > 0 ? total / daysElapsed : 0;

    // Daily series for the bar chart
    const byDay = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${month}-${String(d).padStart(2, '0')}`;
      byDay[key] = 0;
    }
    for (const i of all) {
      if (i.date && byDay[i.date] != null) byDay[i.date] += Number(i.amount) || 0;
    }
    const dailySeries = Object.entries(byDay).map(([date, amount]) => ({
      date,
      day: Number(date.slice(-2)),
      amount: Math.round(amount),
    }));
    const peakDay = dailySeries.reduce((p, c) => (c.amount > p.amount ? c : p), { amount: 0 });

    return {
      total, count, byCat, topCategory, recurring, dailyAvg,
      daysElapsed, daysInMonth, dailySeries, peakDay,
    };
  }, [items, month]);

  const categoryData = useMemo(() => {
    return Object.entries(stats.byCat)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value: Math.round(value), color: CAT_COLOR[name] || CAT_COLOR.Other }));
  }, [stats.byCat]);

  function submit(e) {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!form.date || !form.category || !Number.isFinite(amt) || amt <= 0) return;
    const payload = {
      date: form.date,
      category: form.category,
      amount: amt,
      description: form.description.trim(),
      payment_method: form.payment_method,
      merchant: form.merchant.trim(),
      recurring: !!form.recurring,
      tags: form.tagsText.split(',').map((t) => t.trim()).filter(Boolean),
    };
    if (editingId) {
      update(editingId, payload);
      setEditingId(null);
    } else {
      add(payload);
    }
    setForm({ ...empty, date: form.date });
  }

  function startEdit(it) {
    setEditingId(it.id);
    setForm({
      date: it.date || '',
      category: it.category || 'Other',
      amount: String(it.amount ?? ''),
      description: it.description || '',
      payment_method: it.payment_method || 'UPI',
      merchant: it.merchant || '',
      recurring: !!it.recurring,
      tagsText: Array.isArray(it.tags) ? it.tags.join(', ') : '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancel() {
    setEditingId(null);
    setForm({ ...empty, date: todayISO() });
  }

  const groupedByDate = useMemo(() => {
    const out = {};
    for (const it of monthItems) {
      const d = it.date || 'No date';
      (out[d] ||= []).push(it);
    }
    return out;
  }, [monthItems]);

  const isCurrent = month === currentMonthKey();
  const monthLabelShort = formatMonthKey(month).split(' ')[0];

  return (
    <div>
      <PageHeader
        icon={<Wallet className="w-5 h-5" />}
        title="Expenses"
        subtitle="Daily spending, monthly totals, where the money goes."
        action={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="flex items-center gap-1">
              <Button variant="secondary" size="sm" iconOnly onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="glass rounded-xl px-3 py-1.5 text-sm font-semibold text-ink min-w-[150px] text-center">
                {formatMonthKey(month)}
                {isCurrent && <span className="ml-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">now</span>}
              </div>
              <Button variant="secondary" size="sm" iconOnly onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <BackupMenu filenameBase="expenses" items={items} onReplaceAll={replaceAll} compact />
          </div>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <Stat
          label={`${monthLabelShort} total`}
          value={formatINR(stats.total)}
          tone="indigo"
          icon={<Wallet className="w-4 h-4" />}
          delta={{ kind: 'neutral', text: `${stats.count} txn${stats.count === 1 ? '' : 's'}` }}
          className="animate-fade-up"
        />
        <Stat
          label="Daily average"
          value={formatINR(stats.dailyAvg)}
          tone="brand"
          icon={<TrendingUp className="w-4 h-4" />}
          delta={{ kind: 'neutral', text: `over ${stats.daysElapsed} day${stats.daysElapsed === 1 ? '' : 's'}` }}
          className="animate-fade-up [animation-delay:60ms]"
        />
        <Stat
          label="Top category"
          value={stats.topCategory[0] === '—' ? '—' : trim(stats.topCategory[0], 14)}
          tone="violet"
          icon={<TagIcon className="w-4 h-4" />}
          delta={{ kind: 'neutral', text: formatINR(stats.topCategory[1]) }}
          className="animate-fade-up [animation-delay:120ms]"
        />
        <Stat
          label="Recurring"
          value={formatINR(stats.recurring)}
          tone="amber"
          icon={<Repeat className="w-4 h-4" />}
          delta={{ kind: 'neutral', text: stats.total > 0 ? `${Math.round((stats.recurring / stats.total) * 100)}% of spend` : 'none yet' }}
          className="animate-fade-up [animation-delay:180ms]"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2 animate-fade-up [animation-delay:220ms]" hover={false}>
          <CardHeader
            icon={<TrendingUp className="w-4 h-4" />}
            iconTone="brand"
            title="Daily spend"
            subtitle={`${formatMonthKey(month)} · peak day ${stats.peakDay.amount > 0 ? `${stats.peakDay.day} (${formatINR(stats.peakDay.amount)})` : '—'}`}
          />
          {stats.dailySeries.every((d) => d.amount === 0) ? (
            <div className="h-[200px] grid place-items-center text-sm text-ink-faint">
              No transactions yet this month.
            </div>
          ) : (
            <div className="h-[200px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailySeries} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b6dff" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#9b6bff" stopOpacity={0.75} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="currentColor" className="text-edge-strong/15" />
                  <XAxis dataKey="day" stroke="currentColor" className="text-ink-faint" fontSize={11} tickLine={false} axisLine={false} interval={2} />
                  <YAxis stroke="currentColor" className="text-ink-faint" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip content={<DailyTooltip />} cursor={{ fill: 'rgba(155,107,255,0.08)' }} />
                  <Bar dataKey="amount" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="animate-fade-up [animation-delay:280ms]" hover={false}>
          <CardHeader
            icon={<TagIcon className="w-4 h-4" />}
            iconTone="violet"
            title="By category"
            subtitle={`${categoryData.length} categor${categoryData.length === 1 ? 'y' : 'ies'}`}
          />
          {categoryData.length === 0 ? (
            <div className="h-[200px] grid place-items-center text-sm text-ink-faint">
              No data yet.
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-[120px] h-[140px] relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {categoryData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CategoryTooltip total={stats.total} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 grid place-items-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-[10px] text-ink-faint font-semibold uppercase tracking-wider">Total</div>
                    <div className="text-xs font-bold text-ink">{formatINR(stats.total)}</div>
                  </div>
                </div>
              </div>
              <ul className="flex-1 min-w-0 space-y-1.5">
                {categoryData.slice(0, 5).map((c) => {
                  const pct = stats.total > 0 ? (c.value / stats.total) * 100 : 0;
                  return (
                    <li key={c.name} className="text-xs flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                      <span className="truncate text-ink-muted">{c.name}</span>
                      <span className="ml-auto text-ink-faint shrink-0">{pct.toFixed(0)}%</span>
                    </li>
                  );
                })}
                {categoryData.length > 5 && (
                  <li className="text-[11px] text-ink-faint pt-0.5">+{categoryData.length - 5} more</li>
                )}
              </ul>
            </div>
          )}
        </Card>
      </div>

      {/* Add / Edit form */}
      <Card
        className={cx('mb-5 animate-fade-up [animation-delay:340ms]', editingId && 'ring-2 ring-brand-500/40')}
        hover={false}
      >
        <CardHeader
          icon={editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          iconTone={editingId ? 'amber' : 'emerald'}
          title={editingId ? 'Editing expense' : 'Add expense'}
          subtitle={editingId ? 'Make your changes and save.' : 'Quick entry — date, amount, category required.'}
          action={editingId && (
            <Button variant="ghost" size="sm" onClick={cancel}>
              <XIcon className="w-4 h-4" /> Cancel
            </Button>
          )}
        />
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Amount (₹)</Label>
            <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Category</Label>
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Payment</Label>
            <Select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
              {PAYMENT_METHODS.map((p) => <option key={p}>{p}</option>)}
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Merchant</Label>
            <Input placeholder="e.g. Swiggy" value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Tags</Label>
            <Input placeholder="family, trip" value={form.tagsText} onChange={(e) => setForm({ ...form, tagsText: e.target.value })} />
          </div>
          <div className="md:col-span-6">
            <Label>Description</Label>
            <Input placeholder="Optional note" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="md:col-span-6 flex items-center justify-between gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-ink-muted cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand-500 rounded"
                checked={form.recurring}
                onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
              />
              <Repeat className="w-3.5 h-3.5" /> Recurring expense
            </label>
            <Button type="submit" variant="primary" size="md">
              {editingId ? 'Save changes' : (<><Plus className="w-4 h-4" /> Add expense</>)}
            </Button>
          </div>
        </form>
      </Card>

      {/* Filter bar */}
      <Card className="mb-4 animate-fade-up [animation-delay:400ms]" hover={false} padded={false}>
        <div className="p-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
          <div className="md:col-span-5">
            <Input
              leadingIcon={<Search className="w-4 h-4" />}
              placeholder="Search description, merchant, tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </div>
          <div className="md:col-span-3">
            <Select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
              <option value="all">All payment methods</option>
              {PAYMENT_METHODS.map((p) => <option key={p}>{p}</option>)}
            </Select>
          </div>
          <div className="md:col-span-1 flex justify-end">
            {(categoryFilter !== 'all' || paymentFilter !== 'all' || search) && (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                onClick={() => { setCategoryFilter('all'); setPaymentFilter('all'); setSearch(''); }}
                aria-label="Clear filters"
                title="Clear filters"
              >
                <XIcon className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* List grouped by day */}
      {monthItems.length === 0 ? (
        <EmptyState
          icon={<Filter className="w-5 h-5" />}
          title={`No expenses for ${formatMonthKey(month)}`}
          hint={items.length === 0 ? 'Add your first expense above.' : 'Try clearing filters to see more.'}
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDate).map(([date, list]) => {
            const dayTotal = list.reduce((s, i) => s + (Number(i.amount) || 0), 0);
            return (
              <section key={date}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-[11px] font-bold text-ink-faint uppercase tracking-wider">
                    {formatDate(date)}
                  </h2>
                  <span className="text-[11px] text-ink-faint">
                    {list.length} txn · <span className="font-semibold text-ink">{formatINR(dayTotal)}</span>
                  </span>
                </div>
                <Card padded={false} hover={false}>
                  <ul className="divide-y divide-edge/5">
                    {list.map((it) => (
                      <li key={it.id} className="flex items-start gap-3 px-4 py-3 hover:bg-surface-strong/30 transition-colors">
                        <div
                          className="w-1 self-stretch rounded-full shrink-0"
                          style={{ background: CAT_COLOR[it.category] || CAT_COLOR.Other }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-ink">{formatINR(it.amount)}</span>
                            <Badge tone="slate" size="sm">{it.category}</Badge>
                            <Badge tone="sky" size="sm">{it.payment_method}</Badge>
                            {it.recurring && <Badge tone="violet" size="sm">Recurring</Badge>}
                            {Array.isArray(it.tags) && it.tags.map((t) => (
                              <Badge key={t} tone="amber" size="sm">#{t}</Badge>
                            ))}
                          </div>
                          {(it.merchant || it.description) && (
                            <div className="text-sm text-ink-muted mt-1 truncate">
                              {it.merchant && <span className="font-semibold text-ink">{it.merchant}</span>}
                              {it.merchant && it.description && <span> · </span>}
                              {it.description}
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" iconOnly onClick={() => startEdit(it)} aria-label="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" iconOnly onClick={() => remove(it.id)} aria-label="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </Card>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatINR(n) {
  const v = Number(n) || 0;
  if (v === 0) return '₹0';
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
  return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function trim(s, n) {
  if (!s) return s;
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function DailyTooltip({ active, payload }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 shadow-glass text-xs">
      <div className="font-semibold text-ink">Day {d.day}</div>
      <div className="text-ink-muted">{formatINR(d.amount)}</div>
    </div>
  );
}

function CategoryTooltip({ active, payload, total }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const pct = total > 0 ? (d.value / total) * 100 : 0;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 shadow-glass text-xs">
      <div className="font-semibold text-ink flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
        {d.name}
      </div>
      <div className="text-ink-muted">{formatINR(d.value)} · {pct.toFixed(0)}%</div>
    </div>
  );
}
