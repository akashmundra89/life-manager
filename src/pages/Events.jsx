import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useLocalCollection from '../hooks/useLocalCollection.js';
import { formatDate, daysUntil, todayISO } from '../lib/dateUtils.js';

const SEED = [];
const empty = { title: '', date: '', time: '' };

export default function Events() {
  const { items, add, update, remove } = useLocalCollection('events', SEED);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const ad = a.date + ' ' + (a.time || '');
      const bd = b.date + ' ' + (b.time || '');
      return ad.localeCompare(bd);
    });
  }, [items]);

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
    setForm({ title: it.title, date: it.date, time: it.time || '' });
  }

  function cancel() {
    setEditingId(null);
    setForm(empty);
  }

  return (
    <div>
      <PageHeader
        title="Upcoming Events"
        subtitle="Things happening in the next few days."
      />

      <form
        onSubmit={submit}
        className="bg-white border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3"
      >
        <input
          className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Event title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          type="date"
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          value={form.date}
          min={todayISO()}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <input
          type="time"
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          value={form.time}
          onChange={(e) => setForm({ ...form, time: e.target.value })}
        />
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
              onClick={cancel}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {sorted.length === 0 ? (
        <EmptyState title="No upcoming events" hint="Add one above to get a reminder on the dashboard." />
      ) : (
        <ul className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {sorted.map((it) => {
            const d = daysUntil(it.date);
            const tone =
              d == null ? 'bg-slate-100 text-slate-600' :
              d < 0 ? 'bg-slate-100 text-slate-400 line-through' :
              d === 0 ? 'bg-red-100 text-red-700' :
              d <= 3 ? 'bg-amber-100 text-amber-700' :
              'bg-emerald-100 text-emerald-700';
            const label =
              d == null ? '' :
              d < 0 ? 'Past' :
              d === 0 ? 'Today' :
              d === 1 ? 'Tomorrow' :
              `In ${d} days`;
            return (
              <li key={it.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800">{it.title}</div>
                  <div className="text-xs text-slate-500">
                    {formatDate(it.date)}
                    {it.time && ` · ${it.time}`}
                  </div>
                </div>
                <span className={'text-xs font-medium px-2 py-0.5 rounded-full ' + tone}>
                  {label}
                </span>
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
