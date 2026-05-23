import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useLocalCollection from '../hooks/useLocalCollection.js';
import {
  currentMonthKey,
  formatMonthKey,
  shiftMonth,
  daysUntil,
  formatDate,
} from '../lib/dateUtils.js';

const SEED = [];
const empty = { title: '', due_date: '', notes: '' };

export default function Monthly() {
  const { items, add, update, remove } = useLocalCollection('monthly', SEED);
  const [month, setMonth] = useState(currentMonthKey());
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  const monthItems = useMemo(
    () =>
      items
        .filter((i) => i.month === month)
        .slice()
        .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || '')),
    [items, month]
  );

  const progress = useMemo(() => {
    if (monthItems.length === 0) return 0;
    const done = monthItems.filter((i) => i.done).length;
    return Math.round((done / monthItems.length) * 100);
  }, [monthItems]);

  function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (editingId) {
      update(editingId, {
        title: form.title.trim(),
        due_date: form.due_date || null,
        notes: form.notes.trim(),
      });
      setEditingId(null);
    } else {
      add({
        month,
        title: form.title.trim(),
        due_date: form.due_date || null,
        notes: form.notes.trim(),
        done: false,
      });
    }
    setForm(empty);
  }

  function startEdit(it) {
    setEditingId(it.id);
    setForm({
      title: it.title || '',
      due_date: it.due_date || '',
      notes: it.notes || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancel() {
    setEditingId(null);
    setForm(empty);
  }

  function copyFromPrevious() {
    const prev = shiftMonth(month, -1);
    const prevItems = items.filter((i) => i.month === prev);
    if (prevItems.length === 0) return;
    for (const it of prevItems) {
      add({
        month,
        title: it.title,
        due_date: null,
        notes: it.notes || '',
        done: false,
      });
    }
  }

  const isCurrent = month === currentMonthKey();

  return (
    <div>
      <PageHeader
        title="Monthly Tasks"
        subtitle="Bills, habits, recurring chores — tracked month by month."
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

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-slate-600">
            {monthItems.length} task(s) · {progress}% done
          </div>
          <button
            onClick={copyFromPrevious}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white hover:border-slate-400"
            title="Copy tasks from the previous month into this one (all unchecked)"
          >
            Copy from previous month
          </button>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: progress + '%' }} />
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
            Editing task — make your changes and click Save.
          </div>
        )}
        <input
          className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Task title (e.g. Pay rent)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          type="date"
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          value={form.due_date}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          title="Due date (optional)"
        />
        <input
          className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
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

      {monthItems.length === 0 ? (
        <EmptyState title={'No tasks for ' + formatMonthKey(month)} hint="Add one above, or copy from the previous month." />
      ) : (
        <ul className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {monthItems.map((it) => {
            const d = daysUntil(it.due_date);
            const overdue = d != null && d < 0 && !it.done;
            const soon = d != null && d >= 0 && d <= 3 && !it.done;
            return (
              <li key={it.id} className="flex items-center gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-500"
                  checked={!!it.done}
                  onChange={(e) => update(it.id, { done: e.target.checked })}
                />
                <div className="flex-1 min-w-0">
                  <div className={'text-sm font-medium ' + (it.done ? 'line-through text-slate-400' : 'text-slate-800')}>
                    {it.title}
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                    {it.due_date && (
                      <span className={overdue ? 'text-red-600 font-medium' : soon ? 'text-amber-700 font-medium' : ''}>
                        Due {formatDate(it.due_date)}
                        {d != null && !it.done && (
                          <>
                            {' · '}
                            {d < 0
                              ? Math.abs(d) + ' day(s) overdue'
                              : d === 0
                              ? 'today'
                              : d === 1
                              ? 'tomorrow'
                              : 'in ' + d + ' days'}
                          </>
                        )}
                      </span>
                    )}
                    {it.notes && <span className="truncate">{it.notes}</span>}
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
            );
          })}
        </ul>
      )}
    </div>
  );
}
