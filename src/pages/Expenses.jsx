import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useLocalCollection from '../hooks/useLocalCollection.js';
import {
  currentMonthKey,
  formatMonthKey,
  shiftMonth,
  formatDate,
  todayISO,
} from '../lib/dateUtils.js';

const CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Transport',
  'Bills & Utilities',
  'Shopping',
  'Health',
  'Entertainment',
  'Rent',
  'Investment',
  'Subscriptions',
  'Travel',
  'Education',
  'Other',
];

const PAYMENT_METHODS = ['UPI', 'Cash', 'Credit Card', 'Debit Card', 'Net Banking', 'Other'];

// Each expense: {
//   id, date (YYYY-MM-DD), category, amount (number),
//   description, payment_method, merchant, recurring (bool), tags (string[])
// }
const SEED = [];

const empty = {
  date: '',
  category: 'Food & Dining',
  amount: '',
  description: '',
  payment_method: 'UPI',
  merchant: '',
  recurring: false,
  tagsText: '',
};

export default function Expenses() {
  const { items, add, update, remove } = useLocalCollection('expenses', SEED);
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
    const topCategory =
      Object.entries(byCat).sort((a, b) => b[1] - a[1])[0] || ['—', 0];
    const recurring = all
      .filter((i) => i.recurring)
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const today = new Date();
    const [y, m] = month.split('-').map(Number);
    const sameMonth = today.getFullYear() === y && today.getMonth() + 1 === m;
    const daysInMonth = new Date(y, m, 0).getDate();
    const daysElapsed = sameMonth ? today.getDate() : daysInMonth;
    const dailyAvg = daysElapsed > 0 ? total / daysElapsed : 0;
    return { total, count, byCat, topCategory, recurring, dailyAvg, daysElapsed, daysInMonth };
  }, [items, month]);

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
      tags: form.tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    if (editingId) {
      update(editingId, payload);
      setEditingId(null);
    } else {
      add(payload);
    }
    setForm({ ...empty, date: form.date }); // keep date to make rapid entry easier
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

  // Group displayed items by date for cleaner reading
  const groupedByDate = useMemo(() => {
    const out = {};
    for (const it of monthItems) {
      const d = it.date || 'No date';
      (out[d] ||= []).push(it);
    }
    return out;
  }, [monthItems]);

  const isCurrent = month === currentMonthKey();

  return (
    <div>
      <PageHeader
        title="Expense Tracker"
        subtitle="Daily spending, monthly totals, where the money goes."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMonth(shiftMonth(month, -1))}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white hover:border-slate-400"
            >
              ←
            </button>
            <div className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white min-w-[160px] text-center">
              {formatMonthKey(month)}
              {isCurrent && <span className="ml-2 text-xs text-emerald-600 font-medium">current</span>}
            </div>
            <button
              onClick={() => setMonth(shiftMonth(month, 1))}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white hover:border-slate-400"
            >
              →
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total this month" value={formatINR(stats.total)} />
        <StatCard label="Transactions" value={stats.count} />
        <StatCard
          label="Daily average"
          value={formatINR(stats.dailyAvg)}
          sub={`over ${stats.daysElapsed} day(s)`}
        />
        <StatCard
          label="Top category"
          value={stats.topCategory[0]}
          sub={formatINR(stats.topCategory[1])}
        />
      </div>

      {stats.count > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <div className="text-sm font-semibold text-slate-700 mb-3">
            Category breakdown
          </div>
          <ul className="space-y-2">
            {Object.entries(stats.byCat)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => {
                const pct = stats.total > 0 ? (amt / stats.total) * 100 : 0;
                return (
                  <li key={cat}>
                    <div className="flex items-center justify-between text-xs text-slate-700 mb-1">
                      <span className="font-medium">{cat}</span>
                      <span className="text-slate-500">
                        {formatINR(amt)} · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500"
                        style={{ width: pct + '%' }}
                      />
                    </div>
                  </li>
                );
              })}
          </ul>
          {stats.recurring > 0 && (
            <div className="mt-3 text-xs text-slate-500">
              Of which recurring (subscriptions): <span className="font-medium text-slate-700">{formatINR(stats.recurring)}</span>
            </div>
          )}
        </div>
      )}

      <form
        onSubmit={submit}
        className={
          'bg-white border rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-6 gap-3 ' +
          (editingId ? 'border-brand-500' : 'border-slate-200')
        }
      >
        {editingId && (
          <div className="md:col-span-6 text-sm text-brand-700 font-medium">
            Editing expense — make your changes and click Save.
          </div>
        )}
        <input
          type="date"
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <input
          type="number"
          step="0.01"
          min="0"
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Amount (₹)"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
        <select
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          value={form.payment_method}
          onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
        >
          {PAYMENT_METHODS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <input
          className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Merchant (e.g. Swiggy)"
          value={form.merchant}
          onChange={(e) => setForm({ ...form, merchant: e.target.value })}
        />
        <input
          className="md:col-span-3 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Description / note"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Tags (comma-separated, e.g. family, trip)"
          value={form.tagsText}
          onChange={(e) => setForm({ ...form, tagsText: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm text-slate-700 px-3">
          <input
            type="checkbox"
            className="h-4 w-4 accent-brand-500"
            checked={form.recurring}
            onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
          />
          Recurring
        </label>
        <div className="md:col-span-6 flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium"
          >
            {editingId ? 'Save changes' : 'Add expense'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancel}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl p-3 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <select
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="all">All payment methods</option>
          {PAYMENT_METHODS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <input
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Search description / merchant / tag"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {monthItems.length === 0 ? (
        <EmptyState
          title={'No expenses for ' + formatMonthKey(month)}
          hint="Add your first expense above."
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDate).map(([date, list]) => {
            const dayTotal = list.reduce((s, i) => s + (Number(i.amount) || 0), 0);
            return (
              <section key={date}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    {formatDate(date)}
                  </h2>
                  <span className="text-xs text-slate-500">
                    {list.length} txn · {formatINR(dayTotal)}
                  </span>
                </div>
                <ul className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {list.map((it) => (
                    <li key={it.id} className="flex items-start gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {formatINR(it.amount)}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {it.category}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {it.payment_method}
                          </span>
                          {it.recurring && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                              Recurring
                            </span>
                          )}
                          {Array.isArray(it.tags) && it.tags.map((t) => (
                            <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-800">
                              #{t}
                            </span>
                          ))}
                        </div>
                        <div className="text-sm text-slate-700 mt-1">
                          {it.merchant && <span className="font-medium">{it.merchant}</span>}
                          {it.merchant && it.description && <span> · </span>}
                          {it.description}
                        </div>
                      </div>
                      <button
                        onClick={() => startEdit(it)}
                        className="text-slate-400 hover:text-slate-700 text-sm px-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(it.id)}
                        className="text-slate-400 hover:text-red-600 text-sm px-2"
                        aria-label="Delete"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-lg font-semibold text-slate-900 truncate">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function formatINR(n) {
  const v = Number(n) || 0;
  return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}
