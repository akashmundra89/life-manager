import { useMemo, useState } from 'react';
import { Star, Plus, Pencil, Trash2, X as XIcon, Heart, RotateCcw } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import BackupMenu from '../components/BackupMenu.jsx';
import { Card, CardHeader, Badge, Button, EmptyState, ProgressRing } from '../components/ui';
import { Input, Select, Label } from '../components/ui/Input.jsx';
import useLocalCollection from '../hooks/useLocalCollection.js';
import { formatDate, daysUntilNextOccurrence } from '../lib/dateUtils.js';
import { cx } from '../lib/cx.js';

const TYPES = [
  { value: 'memory',    label: 'Memory (past event)' },
  { value: 'recurring', label: 'Recurring (annual)' },
];

const empty = { title: '', date: '', type: 'memory', notes: '' };

export default function KeyDates() {
  const { items, add, update, remove, replaceAll } = useLocalCollection('keyDates', []);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');

  const counts = useMemo(() => ({
    all: items.length,
    memory: items.filter((i) => i.type === 'memory').length,
    recurring: items.filter((i) => i.type === 'recurring').length,
  }), [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (typeFilter !== 'all') list = items.filter((i) => i.type === typeFilter);
    // Recurring: sort by days-until-next; memories: most-recent first.
    return [...list].sort((a, b) => {
      if (a.type === 'recurring' && b.type === 'recurring') {
        const da = daysUntilNextOccurrence(a.date) ?? 999;
        const db = daysUntilNextOccurrence(b.date) ?? 999;
        return da - db;
      }
      return (b.date || '').localeCompare(a.date || '');
    });
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancel() {
    setEditingId(null);
    setForm(empty);
  }

  return (
    <div>
      <PageHeader
        icon={<Star className="w-5 h-5" />}
        title="Key dates"
        subtitle="Memories you want to remember, and annual dates that come back every year."
        action={<BackupMenu filenameBase="key-dates" items={items} onReplaceAll={replaceAll} />}
      />

      <Card
        className={cx('mb-5 animate-fade-up', editingId && 'ring-2 ring-brand-500/40')}
        hover={false}
      >
        <CardHeader
          icon={editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          iconTone={editingId ? 'amber' : 'emerald'}
          title={editingId ? 'Editing date' : 'Add date'}
          subtitle={editingId ? 'Make your changes and save.' : 'Title + date required.'}
          action={editingId && (
            <Button variant="ghost" size="sm" onClick={cancel}>
              <XIcon className="w-4 h-4" /> Cancel
            </Button>
          )}
        />
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-3">
            <Label>Title</Label>
            <Input autoFocus placeholder="e.g. Started new job" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="md:col-span-1">
            <Label>Type</Label>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </div>
          <div className="md:col-span-5">
            <Label>Notes</Label>
            <Input placeholder="Optional context" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="md:col-span-1 flex items-end">
            <Button type="submit" variant="primary" size="md" className="w-full">
              {editingId ? 'Save' : (<><Plus className="w-4 h-4" /> Add</>)}
            </Button>
          </div>
        </form>
      </Card>

      <div className="flex flex-wrap gap-2 mb-4 animate-fade-up [animation-delay:80ms]">
        {[
          ['all', 'All', counts.all],
          ['recurring', 'Recurring', counts.recurring],
          ['memory', 'Memories', counts.memory],
        ].map(([v, l, n]) => (
          <button
            key={v}
            onClick={() => setTypeFilter(v)}
            className={cx(
              'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all',
              typeFilter === v
                ? 'bg-grad-brand text-white shadow-glow-brand'
                : 'glass glass-hover text-ink-muted hover:text-ink',
            )}
          >
            <span>{l}</span>
            <span className={cx(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
              typeFilter === v ? 'bg-white/20' : 'bg-surface-strong/70 text-ink-faint',
            )}>{n}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Star className="w-5 h-5" />}
          title="Nothing saved yet"
          hint="Record a memory or an annual recurring date above."
        />
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((it) => {
            const recurring = it.type === 'recurring';
            const daysToNext = recurring ? daysUntilNextOccurrence(it.date) : null;
            const pctOfYear = recurring && daysToNext != null
              ? Math.max(0, Math.min(100, Math.round(((365 - daysToNext) / 365) * 100)))
              : null;
            return (
              <li key={it.id} className="animate-fade-up">
                <Card padded={true} hover={false} className="h-full">
                  <div className="flex items-start gap-4">
                    {recurring ? (
                      <ProgressRing value={pctOfYear ?? 0} size={56} stroke={5} showLabel={false} />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-grad-brand-soft text-violet-600 dark:text-violet-300 grid place-items-center shrink-0">
                        <Heart className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-ink truncate">{it.title}</span>
                        <Badge tone={recurring ? 'violet' : 'slate'} size="sm">
                          {recurring ? (<><RotateCcw className="w-3 h-3" /> Annual</>) : 'Memory'}
                        </Badge>
                      </div>
                      <div className="text-xs text-ink-faint mt-1">
                        {formatDate(it.date)}
                        {recurring && daysToNext != null && (
                          <span className="ml-2 text-violet-600 dark:text-violet-300 font-semibold">
                            {daysToNext === 0 ? 'Today!' : `· in ${daysToNext}d`}
                          </span>
                        )}
                      </div>
                      {it.notes && <div className="text-sm text-ink-muted mt-1.5 line-clamp-2">{it.notes}</div>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="sm" iconOnly onClick={() => startEdit(it)} aria-label="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" iconOnly onClick={() => remove(it.id)} aria-label="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
