import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useLocalCollection from '../hooks/useLocalCollection.js';
import { formatDate, daysUntil } from '../lib/dateUtils.js';

const STATUSES = ['Pending', 'In Progress', 'Done'];
const PRIORITIES = ['High', 'Medium', 'Low'];

const SEED = [];
const empty = {
  title: '',
  due_date: '',
  status: 'Pending',
  project: '',
  priority: 'Medium',
  description: '',
};

export default function Office() {
  const { items, add, update, remove } = useLocalCollection('office', SEED);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('open');

  const filtered = useMemo(() => {
    let list = items;
    if (statusFilter === 'open') list = items.filter((i) => i.status !== 'Done');
    else if (statusFilter === 'done') list = items.filter((i) => i.status === 'Done');
    return [...list].sort((a, b) => {
      // Priority weight, then due date
      const pw = { High: 0, Medium: 1, Low: 2 };
      const pa = pw[a.priority] ?? 1;
      const pb = pw[b.priority] ?? 1;
      if (pa !== pb) return pa - pb;
      return (a.due_date || '').localeCompare(b.due_date || '');
    });
  }, [items, statusFilter]);

  function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
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
      due_date: it.due_date || '',
      status: it.status || 'Pending',
      project: it.project || '',
      priority: it.priority || 'Medium',
      description: it.description || '',
    });
  }

  return (
    <div>
      <PageHeader
        title="Office Pending Work"
        subtitle="Track what's open, what's due, and what's done."
      />

      <form
        onSubmit={submit}
        className="bg-white border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-6 gap-3"
      >
        <input
          className="md:col-span-3 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Task title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          type="date"
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          value={form.due_date}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
        />
        <select
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
        >
          {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input
          className="md:col-span-3 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Project / category (optional)"
          value={form.project}
          onChange={(e) => setForm({ ...form, project: e.target.value })}
        />
        <input
          className="md:col-span-3 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Description / notes (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="md:col-span-6 flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium"
          >
            {editingId ? 'Save changes' : 'Add task'}
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
      </form>

      <div className="flex gap-2 mb-4 text-sm">
        {[
          ['open', 'Open'],
          ['done', 'Done'],
          ['all', 'All'],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setStatusFilter(v)}
            className={
              'px-3 py-1.5 rounded-full border ' +
              (statusFilter === v
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400')
            }
          >
            {l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nothing here" hint="Add a task above." />
      ) : (
        <ul className="space-y-3">
          {filtered.map((it) => {
            const d = daysUntil(it.due_date);
            const overdue = d != null && d < 0 && it.status !== 'Done';
            const soon = d != null && d >= 0 && d <= 2 && it.status !== 'Done';
            return (
              <li
                key={it.id}
                className={
                  'bg-white border rounded-xl p-4 ' +
                  (overdue ? 'border-red-300' : soon ? 'border-amber-300' : 'border-slate-200')
                }
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={'font-medium ' + (it.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-900')}>
                        {it.title}
                      </span>
                      <PriorityPill value={it.priority} />
                      <StatusPill value={it.status} />
                      {it.project && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {it.project}
                        </span>
                      )}
                    </div>
                    {it.description && (
                      <p className="text-sm text-slate-600 mt-1">{it.description}</p>
                    )}
                    <div className="text-xs text-slate-500 mt-2">
                      {it.due_date ? (
                        <>
                          Due {formatDate(it.due_date)}
                          {d != null && (
                            <span className={'ml-2 ' + (overdue ? 'text-red-600 font-medium' : soon ? 'text-amber-700 font-medium' : '')}>
                              {d < 0 ? `${Math.abs(d)} day(s) overdue`
                                : d === 0 ? 'today'
                                : d === 1 ? 'tomorrow'
                                : `in ${d} days`}
                            </span>
                          )}
                        </>
                      ) : 'No due date'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => update(it.id, { status: s })}
                        className={
                          'text-xs px-2 py-1 rounded-md border ' +
                          (it.status === s
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400')
                        }
                      >
                        {s}
                      </button>
                    ))}
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

function PriorityPill({ value }) {
  const color =
    value === 'High' ? 'bg-red-100 text-red-700' :
    value === 'Low' ? 'bg-slate-100 text-slate-600' :
    'bg-amber-100 text-amber-700';
  return <span className={'text-xs font-medium px-2 py-0.5 rounded-full ' + color}>{value || 'Medium'}</span>;
}

function StatusPill({ value }) {
  const color =
    value === 'Done' ? 'bg-emerald-100 text-emerald-700' :
    value === 'In Progress' ? 'bg-blue-100 text-blue-700' :
    'bg-slate-100 text-slate-600';
  return <span className={'text-xs font-medium px-2 py-0.5 rounded-full ' + color}>{value || 'Pending'}</span>;
}
