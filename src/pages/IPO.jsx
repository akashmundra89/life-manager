import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useLocalCollection from '../hooks/useLocalCollection.js';
import { formatDate, daysUntil } from '../lib/dateUtils.js';

// Manual IPO tracker.
// There's no reliable free public API for live GMP, so we let the user
// log IPOs themselves and update the GMP daily. Help text below links
// to common sources where you can look it up.

const STATUSES = ['Upcoming', 'Open', 'Closed', 'Listed'];

const SEED = [];
const empty = {
  name: '',
  open_date: '',
  close_date: '',
  listing_date: '',
  price_band: '',
  gmp: '',
  status: 'Upcoming',
  link: '',
  notes: '',
};

export default function IPO() {
  const { items, add, update, remove } = useLocalCollection('ipos', SEED);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    let list = items;
    if (statusFilter !== 'all') list = items.filter((i) => i.status === statusFilter);
    return [...list].sort((a, b) => (a.open_date || '').localeCompare(b.open_date || ''));
  }, [items, statusFilter]);

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingId) {
      update(editingId, { ...form, name: form.name.trim() });
      setEditingId(null);
    } else {
      add({ ...form, name: form.name.trim() });
    }
    setForm(empty);
  }

  function startEdit(it) {
    setEditingId(it.id);
    setForm({
      name: it.name || '',
      open_date: it.open_date || '',
      close_date: it.close_date || '',
      listing_date: it.listing_date || '',
      price_band: it.price_band || '',
      gmp: it.gmp || '',
      status: it.status || 'Upcoming',
      link: it.link || '',
      notes: it.notes || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancel() {
    setEditingId(null);
    setForm(empty);
  }

  return (
    <div>
      <PageHeader
        title="Upcoming IPOs"
        subtitle="Track issues, price bands, and current GMP. Update the GMP yourself daily."
      />

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-900">
        <div className="font-medium mb-1">Where to check live GMP</div>
        <ul className="list-disc pl-5 space-y-0.5">
          <li>
            <a className="underline" href="https://www.chittorgarh.com/ipo/ipo_gmp.asp" target="_blank" rel="noreferrer">
              Chittorgarh — IPO GMP
            </a>
          </li>
          <li>
            <a className="underline" href="https://ipowatch.in/ipo-grey-market-premium-latest-ipo-gmp/" target="_blank" rel="noreferrer">
              IPO Watch — Grey Market Premium
            </a>
          </li>
          <li>
            <a className="underline" href="https://www.investorgain.com/ipo/" target="_blank" rel="noreferrer">
              InvestorGain — IPO Calendar
            </a>
          </li>
        </ul>
        <div className="mt-2 text-xs text-amber-800">
          No public IPO API gives reliable real-time GMP, so this page is a manual tracker — note the GMP from one of the sources above and update it here.
        </div>
      </div>

      <form
        onSubmit={submit}
        className={
          'bg-white border rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-6 gap-3 ' +
          (editingId ? 'border-brand-500' : 'border-slate-200')
        }
      >
        {editingId && (
          <div className="md:col-span-6 text-sm text-brand-700 font-medium">
            Editing IPO — make your changes and click Save.
          </div>
        )}
        <input
          className="md:col-span-3 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="IPO name (e.g. ABC Industries Ltd)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Price band (e.g. ₹105 – ₹110)"
          value={form.price_band}
          onChange={(e) => setForm({ ...form, price_band: e.target.value })}
        />
        <select
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <label className="text-xs text-slate-500 md:col-span-2">
          Open date
          <input
            type="date"
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            value={form.open_date}
            onChange={(e) => setForm({ ...form, open_date: e.target.value })}
          />
        </label>
        <label className="text-xs text-slate-500 md:col-span-2">
          Close date
          <input
            type="date"
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            value={form.close_date}
            onChange={(e) => setForm({ ...form, close_date: e.target.value })}
          />
        </label>
        <label className="text-xs text-slate-500 md:col-span-2">
          Listing date
          <input
            type="date"
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            value={form.listing_date}
            onChange={(e) => setForm({ ...form, listing_date: e.target.value })}
          />
        </label>
        <input
          className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="GMP (e.g. +45 or 'Nil')"
          value={form.gmp}
          onChange={(e) => setForm({ ...form, gmp: e.target.value })}
        />
        <input
          className="md:col-span-4 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Reference link (optional)"
          value={form.link}
          onChange={(e) => setForm({ ...form, link: e.target.value })}
        />
        <input
          className="md:col-span-6 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <div className="md:col-span-6 flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium"
          >
            {editingId ? 'Save changes' : 'Add IPO'}
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

      <div className="flex gap-2 mb-4 text-sm">
        {['all', ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={
              'px-3 py-1.5 rounded-full border ' +
              (statusFilter === s
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400')
            }
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No IPOs tracked"
          hint="Add an upcoming IPO above to start tracking its GMP."
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((it) => {
            const d = daysUntil(it.open_date);
            return (
              <li key={it.id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900">{it.name}</span>
                      <StatusPill value={it.status} />
                      {it.price_band && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {it.price_band}
                        </span>
                      )}
                      {it.gmp && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          GMP {it.gmp}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      {it.open_date && <span>Opens {formatDate(it.open_date)}{d != null && d > 0 && ` (in ${d}d)`}</span>}
                      {it.close_date && <span>Closes {formatDate(it.close_date)}</span>}
                      {it.listing_date && <span>Lists {formatDate(it.listing_date)}</span>}
                    </div>
                    {it.notes && <div className="text-sm text-slate-600 mt-2">{it.notes}</div>}
                    {it.link && (
                      <a
                        href={it.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-brand-600 hover:underline mt-2 inline-block"
                      >
                        Open reference →
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
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
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatusPill({ value }) {
  const color =
    value === 'Open' ? 'bg-emerald-100 text-emerald-700' :
    value === 'Closed' ? 'bg-amber-100 text-amber-700' :
    value === 'Listed' ? 'bg-blue-100 text-blue-700' :
    'bg-slate-100 text-slate-600';
  return (
    <span className={'text-xs font-medium px-2 py-0.5 rounded-full ' + color}>
      {value || 'Upcoming'}
    </span>
  );
}
