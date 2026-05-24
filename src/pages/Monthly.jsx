import { useMemo, useState } from 'react';
import {
  CalendarCheck, Plus, Pencil, Trash2, X as XIcon, ChevronLeft, ChevronRight,
  Copy, Check, AlertCircle, Clock,
} from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import BackupMenu from '../components/BackupMenu.jsx';
import { Card, CardHeader, Badge, Button, EmptyState, ProgressRing } from '../components/ui';
import { Input, Label } from '../components/ui/Input.jsx';
import useLocalCollection from '../hooks/useLocalCollection.js';
import {
  currentMonthKey, formatMonthKey, shiftMonth, daysUntil, formatDate,
} from '../lib/dateUtils.js';
import { cx } from '../lib/cx.js';

const empty = { title: '', due_date: '', notes: '' };

export default function Monthly() {
  const { items, add, update, remove, replaceAll } = useLocalCollection('monthly', []);
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

  const stats = useMemo(() => {
    const total = monthItems.length;
    const done = monthItems.filter((i) => i.done).length;
    const overdue = monthItems.filter((i) => {
      const d = daysUntil(i.due_date);
      return !i.done && d != null && d < 0;
    }).length;
    const today = monthItems.filter((i) => !i.done && daysUntil(i.due_date) === 0).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, overdue, today, pct };
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
    setForm({ title: it.title || '', due_date: it.due_date || '', notes: it.notes || '' });
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
      add({ month, title: it.title, due_date: null, notes: it.notes || '', done: false });
    }
  }

  const isCurrent = month === currentMonthKey();

  return (
    <div>
      <PageHeader
        icon={<CalendarCheck className="w-5 h-5" />}
        title="Monthly tasks"
        subtitle="Bills, habits, recurring chores — tracked month by month."
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
            <BackupMenu filenameBase="monthly" items={items} onReplaceAll={replaceAll} compact />
          </div>
        }
      />

      {/* Progress hero */}
      <Card className="mb-5 animate-fade-up" hover={false}>
        <div className="flex items-center gap-5 flex-wrap">
          <ProgressRing value={stats.pct} size={80} stroke={8} />
          <div className="flex-1 min-w-[200px]">
            <div className="text-2xl font-bold text-ink tracking-tight">
              {stats.done} <span className="text-ink-faint font-normal text-base">/ {stats.total} done</span>
            </div>
            <div className="text-sm text-ink-muted mt-1">
              {stats.total === 0
                ? `No tasks for ${formatMonthKey(month)} yet.`
                : stats.pct === 100
                  ? `🎉 Everything ticked off for ${formatMonthKey(month)}.`
                  : `${stats.total - stats.done} task${stats.total - stats.done === 1 ? '' : 's'} left this month.`}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {stats.overdue > 0 && <Badge tone="rose"><AlertCircle className="w-3 h-3" /> {stats.overdue} overdue</Badge>}
              {stats.today > 0 && <Badge tone="amber"><Clock className="w-3 h-3" /> {stats.today} today</Badge>}
              {stats.overdue === 0 && stats.today === 0 && stats.total > 0 && <Badge tone="emerald"><Check className="w-3 h-3" /> on track</Badge>}
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={copyFromPrevious} title="Copy tasks from the previous month (all unchecked)">
            <Copy className="w-3.5 h-3.5" /> Copy from previous
          </Button>
        </div>
      </Card>

      <Card
        className={cx('mb-5 animate-fade-up [animation-delay:60ms]', editingId && 'ring-2 ring-brand-500/40')}
        hover={false}
      >
        <CardHeader
          icon={editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          iconTone={editingId ? 'amber' : 'emerald'}
          title={editingId ? 'Editing task' : 'Add task'}
          subtitle={editingId ? 'Make your changes and save.' : 'Title required. Due date is optional.'}
          action={editingId && (
            <Button variant="ghost" size="sm" onClick={cancel}>
              <XIcon className="w-4 h-4" /> Cancel
            </Button>
          )}
        />
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-3">
            <Label>Title</Label>
            <Input autoFocus placeholder="e.g. Pay rent" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Due date</Label>
            <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div className="md:col-span-1 flex items-end">
            <Button type="submit" variant="primary" size="md" className="w-full">
              {editingId ? 'Save' : (<><Plus className="w-4 h-4" /> Add</>)}
            </Button>
          </div>
          <div className="md:col-span-6">
            <Label>Notes</Label>
            <Input placeholder="Optional" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </form>
      </Card>

      {monthItems.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="w-5 h-5" />}
          title={`No tasks for ${formatMonthKey(month)}`}
          hint="Add one above, or copy tasks from the previous month."
        />
      ) : (
        <Card padded={false} hover={false} className="animate-fade-up [animation-delay:120ms]">
          <ul className="divide-y divide-edge/5">
            {monthItems.map((it) => {
              const d = daysUntil(it.due_date);
              const overdue = d != null && d < 0 && !it.done;
              const soon = d != null && d >= 0 && d <= 3 && !it.done;
              return (
                <li key={it.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-strong/30 transition-colors">
                  <Checkbox checked={!!it.done} onChange={(v) => update(it.id, { done: v })} />
                  <div className="flex-1 min-w-0">
                    <div className={cx('text-sm font-semibold', it.done ? 'line-through text-ink-faint' : 'text-ink')}>
                      {it.title}
                    </div>
                    <div className="text-xs text-ink-faint flex flex-wrap gap-x-2 gap-y-1 mt-0.5">
                      {it.due_date && (
                        <span className={cx(
                          'inline-flex items-center gap-1',
                          overdue && 'text-rose-600 dark:text-rose-300 font-semibold',
                          soon && 'text-amber-600 dark:text-amber-300 font-semibold',
                        )}>
                          {overdue && <AlertCircle className="w-3 h-3" />}
                          Due {formatDate(it.due_date)}
                          {d != null && !it.done && (
                            <span>
                              {d < 0 ? ` · ${Math.abs(d)}d overdue`
                                : d === 0 ? ' · today'
                                : d === 1 ? ' · tomorrow'
                                : ` · in ${d}d`}
                            </span>
                          )}
                        </span>
                      )}
                      {it.notes && <span className="truncate">{it.notes}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" iconOnly onClick={() => startEdit(it)} aria-label="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" iconOnly onClick={() => remove(it.id)} aria-label="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
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
