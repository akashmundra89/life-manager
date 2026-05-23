import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useLocalCollection from '../hooks/useLocalCollection.js';
import { formatDate, daysUntilNextOccurrence } from '../lib/dateUtils.js';

const TYPES = [
  { value: 'memory', label: 'Memory (past event)' },
  { value: 'recurring', label: 'Recurring (annual)' },
];

const SEED = [];
const empty = { title: '', date: '', type: 'memory', notes: '' };

export default function KeyDates() {
  const { items, add, update, remove } = useLocalCollection('keyDates', SEED);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = useMemo(() => {
    let list = items;
    if (typeFilter !== 'all') list = items.filter((i) => i.type === typeFilter);
    return [...list].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [items, typeFilter]);

  function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;
    if (editingId) {
      update(editingId, { ...form, title: form.title.trim() });
      setEditingId(null);
    } else {
      add({ ...form, title: form.title.trim() });
    }
    setForm(empty);
  }

  function startEdit(it) {
    setEditingId(it.id);
    setForm({
      title: it.title,
      date: it.date,
      type: it.type || 'memory',
      notes: it.notes || '',
    });
  }

  return (
    <div>
      <PageHeader
        title="Key Dates & Events"
        subtitle="Memories you want to remember, and recurring dates that come back every year."
      />

      <form
        onSubmit={submit}
        className="bg-white border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3"
      >
        <input
          className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Title (e.g. Started new job)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          type="date"
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <select
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium"
          >
            {editingId ? 'Save' : 'Add'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => { setEditingId(null); setForm(empty); }}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              Cancel
            </button>
          )}
        </div>
        <input
          className="md:col-span-5 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </form>

      <div className="flex gap-2 mb-4 text-sm">
        {[
          ['all', 'All'],
          ['memory', 'Memories'],
          ['recurring', 'Recurring'],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTypeFilter(v)}
            className={
              'px-3 py-1.5 rounded-full border ' +
              (typeFilter === v
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400')
            }
          >
            {l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          hint="Record a memory or an annual recurring date above."
        />
      ) : (
        <ul className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {filtered.map((it) => {
            const recurring = it.type === 'recurring';
            const daysToNext = recurring ? daysUntilNextOccurrence(it.date) : null;
            return (
              <li key={it.id} className="px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900">{it.title}</span>
                    <span className={'text-xs font-medium px-2 py-0.5 rounded-full ' + (recurring ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600')}>
                      {recurring ? 'Recurring' : 'Memory'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {formatDate(it.date)}
                    {recurring && daysToNext != null && (
                      <span className="ml-2 text-violet-700 font-medium">
                        {daysToNext === 0 ? 'Today!' : `in ${daysToNext} day(s)`}
                      </span>
                    )}
                  </div>
                  {it.notes && (
                    <div className="text-sm text-slate-600 mt-1">{it.notes}</div>
                  )}
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
            );
          })}
        </ul>
      )}
    </div>
  );
}
