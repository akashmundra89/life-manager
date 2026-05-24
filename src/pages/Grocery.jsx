import { useMemo, useState } from 'react';
import { ShoppingCart, Plus, Pencil, Trash2, X as XIcon, Check } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import BackupMenu from '../components/BackupMenu.jsx';
import { Card, CardHeader, Badge, Button, EmptyState } from '../components/ui';
import { Input, Select, Label } from '../components/ui/Input.jsx';
import useLocalCollection from '../hooks/useLocalCollection.js';
import { cx } from '../lib/cx.js';

const CATEGORIES = ['Vegetables', 'Fruits', 'Dairy', 'Grains', 'Meat', 'Snacks', 'Household', 'Other'];
const PRIORITIES = ['High', 'Medium', 'Low'];

const CAT_TONE = {
  Vegetables: 'emerald', Fruits: 'rose', Dairy: 'sky',
  Grains: 'amber', Meat: 'rose', Snacks: 'violet',
  Household: 'indigo', Other: 'slate',
};

const SEED = [
  { id: 's1', name: 'Milk', qty: '2L', category: 'Dairy', priority: 'High', notes: 'Amul Gold', checked: false, created_at: new Date().toISOString() },
  { id: 's2', name: 'Tomatoes', qty: '1kg', category: 'Vegetables', priority: 'Medium', notes: '', checked: false, created_at: new Date().toISOString() },
];

const empty = { name: '', qty: '', category: 'Other', priority: 'Medium', notes: '' };

export default function Grocery() {
  const { items, add, update, remove, replaceAll } = useLocalCollection('grocery', SEED);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all');

  const counts = useMemo(() => ({
    all: items.length,
    pending: items.filter((i) => !i.checked).length,
    done: items.filter((i) => i.checked).length,
  }), [items]);

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
      <PageHeader
        icon={<ShoppingCart className="w-5 h-5" />}
        title="Grocery list"
        subtitle="What needs to be picked up next."
        action={<BackupMenu filenameBase="grocery" items={items} onReplaceAll={replaceAll} />}
      />

      <Card
        className={cx('mb-5 animate-fade-up', editingId && 'ring-2 ring-brand-500/40')}
        hover={false}
      >
        <CardHeader
          icon={editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          iconTone={editingId ? 'amber' : 'emerald'}
          title={editingId ? 'Editing item' : 'Add to list'}
          subtitle={editingId ? 'Make your changes and save.' : 'Name + category. Press enter to add quickly.'}
          action={editingId && (
            <Button variant="ghost" size="sm" onClick={cancel}>
              <XIcon className="w-4 h-4" /> Cancel
            </Button>
          )}
        />
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-3">
            <Label>Name</Label>
            <Input autoFocus placeholder="e.g. Almond milk" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="md:col-span-1">
            <Label>Qty</Label>
            <Input placeholder="2L" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
          </div>
          <div className="md:col-span-1">
            <Label>Category</Label>
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </div>
          <div className="md:col-span-1">
            <Label>Priority</Label>
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </Select>
          </div>
          <div className="md:col-span-5">
            <Label>Notes</Label>
            <Input placeholder="Brand / store preference (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="md:col-span-1 flex items-end">
            <Button type="submit" variant="primary" size="md" className="w-full">
              {editingId ? 'Save' : (<><Plus className="w-4 h-4" /> Add</>)}
            </Button>
          </div>
        </form>
      </Card>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-4 animate-fade-up [animation-delay:80ms]">
        {[
          ['all', 'All', counts.all],
          ['pending', 'Pending', counts.pending],
          ['done', 'Done', counts.done],
        ].map(([v, l, n]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={cx(
              'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all',
              filter === v
                ? 'bg-grad-brand text-white shadow-glow-brand'
                : 'glass glass-hover text-ink-muted hover:text-ink',
            )}
          >
            <span>{l}</span>
            <span className={cx(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
              filter === v ? 'bg-white/20' : 'bg-surface-strong/70 text-ink-faint',
            )}>{n}</span>
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="w-5 h-5" />}
          title="Your grocery list is empty"
          hint="Add what you need above — items group by category automatically."
        />
      ) : Object.keys(grouped).length === 0 ? (
        <EmptyState title={`Nothing ${filter}`} hint="Switch filter to see other items." />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, list]) => (
            <section key={cat} className="animate-fade-up">
              <div className="flex items-center justify-between mb-2 px-1">
                <h2 className="text-[11px] font-bold text-ink-faint uppercase tracking-wider flex items-center gap-2">
                  <span className={cx('w-2 h-2 rounded-full', dotForTone(CAT_TONE[cat] || 'slate'))} />
                  {cat}
                </h2>
                <span className="text-[11px] text-ink-faint">{list.length} item{list.length === 1 ? '' : 's'}</span>
              </div>
              <Card padded={false} hover={false}>
                <ul className="divide-y divide-edge/5">
                  {list.map((it) => (
                    <li key={it.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-strong/30 transition-colors">
                      <Checkbox
                        checked={!!it.checked}
                        onChange={(v) => update(it.id, { checked: v })}
                      />
                      <div className="flex-1 min-w-0">
                        <div className={cx(
                          'text-sm font-semibold transition-colors',
                          it.checked ? 'line-through text-ink-faint' : 'text-ink',
                        )}>
                          {it.name}
                          {it.qty && <span className="text-ink-faint font-normal"> · {it.qty}</span>}
                        </div>
                        {it.notes && <div className="text-xs text-ink-faint truncate mt-0.5">{it.notes}</div>}
                      </div>
                      <PriorityBadge value={it.priority} />
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
          ))}
        </div>
      )}
    </div>
  );
}

function PriorityBadge({ value }) {
  const tone = value === 'High' ? 'rose' : value === 'Low' ? 'slate' : 'amber';
  return <Badge tone={tone} size="sm">{value || 'Medium'}</Badge>;
}

function dotForTone(tone) {
  return {
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    sky: 'bg-sky-500',
    amber: 'bg-amber-500',
    violet: 'bg-violet-500',
    indigo: 'bg-indigo-500',
    slate: 'bg-slate-400',
  }[tone] || 'bg-slate-400';
}

function Checkbox({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cx(
        'w-5 h-5 rounded-md border-2 grid place-items-center shrink-0 transition-all',
        checked
          ? 'bg-grad-brand border-transparent text-white shadow-glow-brand'
          : 'border-edge-strong/40 hover:border-brand-500/70 text-transparent',
      )}
      aria-label={checked ? 'Mark as not done' : 'Mark as done'}
    >
      <Check className="w-3 h-3" />
    </button>
  );
}
