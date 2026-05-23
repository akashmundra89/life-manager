import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useLocalCollection from '../hooks/useLocalCollection.js';

const CATEGORIES = ['Vegetables', 'Fruits', 'Dairy', 'Grains', 'Meat', 'Snacks', 'Household', 'Other'];
const PRIORITIES = ['High', 'Medium', 'Low'];

const SEED = [
  { id: 's1', name: 'Milk', qty: '2L', category: 'Dairy', priority: 'High', notes: 'Amul Gold', checked: false, created_at: new Date().toISOString() },
  { id: 's2', name: 'Tomatoes', qty: '1kg', category: 'Vegetables', priority: 'Medium', notes: '', checked: false, created_at: new Date().toISOString() },
];

const empty = { name: '', qty: '', category: 'Other', priority: 'Medium', notes: '' };

export default function Grocery() {
  const { items, add, update, remove } = useLocalCollection('grocery', SEED);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all');

  const grouped = useMemo(() => {
    const filtered =
      filter === 'pending' ? items.filter((i) => !i.checked) :
      filter === 'done' ? items.filter((i) => i.checked) :
      items;
    const byCat = {};
    for (const it of filtered) {
      const c = it.category || 'Other';
      (byCat[c] ||= []).push(it);
    }
    return byCat;
  }, [items, filter]);

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingId) {
      update(editingId, { ...form, name: form.name.trim() });
      setEditingId(null);
    } else {
      add({ ...form, name: form.name.trim(), checked: false });
    }
    setForm(empty);
  }

  function startEdit(it) {
    setEditingId(it.id);
    setForm({
      name: it.name || '',
      qty: it.qty || '',
      category: it.category || 'Other',
      priority: it.priority || 'Medium',
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
      <PageHeader title="Grocery List" subtitle="What needs to be picked up next." />

      <form
        onSubmit={submit}
        className={
          'bg-white border rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-6 gap-3 ' +
          (editingId ? 'border-brand-500' : 'border-slate-200')
        }
      >
        {editingId && (
          <div className="md:col-span-6 text-sm text-brand-700 font-medium">
            Editing item — make your changes and click Save.
          </div>
        )}
        <input
          className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Item name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Qty (e.g. 2L)"
          value={form.qty}
          onChange={(e) => setForm({ ...form, qty: e.target.value })}
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
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
        >
          {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
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
              onClick={cancel}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              Cancel
            </button>
          )}
        </div>
        <input
          className="md:col-span-6 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Notes / brand preference (optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </form>

      <div className="flex gap-2 mb-4 text-sm">
        {['all', 'pending', 'done'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              'px-3 py-1.5 rounded-full border ' +
              (filter === f
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400')
            }
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState title="No grocery items yet" hint="Add what you need above." />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, list]) => (
            <section key={cat}>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                {cat}
              </h2>
              <ul className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                {list.map((it) => (
                  <li key={it.id} className="flex items-center gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-brand-500"
                      checked={!!it.checked}
                      onChange={(e) => update(it.id, { checked: e.target.checked })}
                    />
                    <div className="flex-1 min-w-0">
                      <div className={'text-sm font-medium ' + (it.checked ? 'line-through text-slate-400' : 'text-slate-800')}>
                        {it.name}
                        {it.qty && <span className="text-slate-500 font-normal"> · {it.qty}</span>}
                      </div>
                      {it.notes && (
                        <div className="text-xs text-slate-500 truncate">{it.notes}</div>
                      )}
                    </div>
                    <PriorityPill value={it.priority} />
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
          ))}
        </div>
      )}
    </div>
  );
}

function PriorityPill({ value }) {
  const color =
    value === 'High' ? 'bg-red-100 text-red-700' :
    value === 'Low' ? 'bg-slate-100 text-slate-600' :
    'bg-amber-100 text-amber-700';
  return (
    <span className={'text-xs font-medium px-2 py-0.5 rounded-full ' + color}>
      {value || 'Medium'}
    </span>
  );
}
