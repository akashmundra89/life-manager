import { useMemo, useState } from 'react';
import {
  Briefcase, Plus, Pencil, Trash2, X as XIcon, AlertCircle, Clock,
  Circle, CircleDot, CheckCircle2,
} from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import { Card, CardHeader, Badge, Button, EmptyState } from '../components/ui';
import { Input, Select, Label } from '../components/ui/Input.jsx';
import useLocalCollection from '../hooks/useLocalCollection.js';
import { formatDate, daysUntil } from '../lib/dateUtils.js';
import { cx } from '../lib/cx.js';

const STATUSES = ['Pending', 'In Progress', 'Done'];
const PRIORITIES = ['High', 'Medium', 'Low'];

const empty = {
  title: '', due_date: '', status: 'Pending',
  project: '', priority: 'Medium', description: '',
};

export default function Office() {
  const { items, add, update, remove } = useLocalCollection('office', []);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('open');

  const counts = useMemo(() => ({
    all: items.length,
    open: items.filter((i) => i.status !== 'Done').length,
    done: items.filter((i) => i.status === 'Done').length,
  }), [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (statusFilter === 'open') list = items.filter((i) => i.status !== 'Done');
    else if (statusFilter === 'done') list = items.filter((i) => i.status === 'Done');
    return [...list].sort((a, b) => {
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancel() {
    setEditingId(null);
    setForm(empty);
  }

  return (
    <div>
      <PageHeader
        icon={<Briefcase className="w-5 h-5" />}
        title="Office work"
        subtitle="Track what's open, what's due, and what's done."
      />

      <Card
        className={cx('mb-5 animate-fade-up', editingId && 'ring-2 ring-brand-500/40')}
        hover={false}
      >
        <CardHeader
          icon={editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          iconTone={editingId ? 'amber' : 'emerald'}
          title={editingId ? 'Editing task' : 'Add task'}
          subtitle={editingId ? 'Make your changes and save.' : 'Title required. Priority + due date keep it sorted.'}
          action={editingId && (
            <Button variant="ghost" size="sm" onClick={cancel}>
              <XIcon className="w-4 h-4" /> Cancel
            </Button>
          )}
        />
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-3">
            <Label>Title</Label>
            <Input autoFocus placeholder="e.g. Send Q2 board deck" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="md:col-span-3">
            <Label>Project / category</Label>
            <Input placeholder="Optional grouping" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Due date</Label>
            <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Priority</Label>
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Status</Label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </div>
          <div className="md:col-span-6">
            <Label>Description</Label>
            <Input placeholder="Notes / context (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="md:col-span-6 flex justify-end">
            <Button type="submit" variant="primary" size="md">
              {editingId ? 'Save changes' : (<><Plus className="w-4 h-4" /> Add task</>)}
            </Button>
          </div>
        </form>
      </Card>

      <div className="flex flex-wrap gap-2 mb-4 animate-fade-up [animation-delay:80ms]">
        {[
          ['open', 'Open', counts.open],
          ['done', 'Done', counts.done],
          ['all', 'All', counts.all],
        ].map(([v, l, n]) => (
          <button
            key={v}
            onClick={() => setStatusFilter(v)}
            className={cx(
              'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all',
              statusFilter === v
                ? 'bg-grad-brand text-white shadow-glow-brand'
                : 'glass glass-hover text-ink-muted hover:text-ink',
            )}
          >
            <span>{l}</span>
            <span className={cx(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
              statusFilter === v ? 'bg-white/20' : 'bg-surface-strong/70 text-ink-faint',
            )}>{n}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-5 h-5" />}
          title={items.length === 0 ? 'No tasks yet' : `Nothing ${statusFilter}`}
          hint={items.length === 0 ? 'Add a task above to get started.' : 'Switch filter to see other tasks.'}
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((it) => {
            const d = daysUntil(it.due_date);
            const isDone = it.status === 'Done';
            const overdue = d != null && d < 0 && !isDone;
            const soon = d != null && d >= 0 && d <= 2 && !isDone;
            const edge = overdue ? 'rose' : soon ? 'amber' : isDone ? 'emerald' : 'slate';
            return (
              <li key={it.id} className="animate-fade-up">
                <Card padded={false} hover={false} className="overflow-hidden">
                  <div className="flex">
                    {/* Left status edge */}
                    <div className={cx('w-1 self-stretch shrink-0', edgeClass(edge))} />
                    <div className="flex-1 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cx(
                              'text-sm font-semibold',
                              isDone ? 'line-through text-ink-faint' : 'text-ink',
                            )}>
                              {it.title}
                            </span>
                            <PriorityBadge value={it.priority} />
                            <StatusBadge value={it.status} />
                            {it.project && <Badge tone="slate" size="sm">{it.project}</Badge>}
                          </div>
                          {it.description && (
                            <p className="text-sm text-ink-muted mt-1">{it.description}</p>
                          )}
                          {it.due_date ? (
                            <div className="text-xs text-ink-faint mt-2 flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              <span>Due {formatDate(it.due_date)}</span>
                              {d != null && (
                                <span className={cx(
                                  'inline-flex items-center gap-1 ml-1',
                                  overdue && 'text-rose-600 dark:text-rose-300 font-semibold',
                                  soon && 'text-amber-600 dark:text-amber-300 font-semibold',
                                )}>
                                  {overdue && <AlertCircle className="w-3 h-3" />}
                                  {d < 0 ? `· ${Math.abs(d)}d overdue`
                                    : d === 0 ? '· today'
                                    : d === 1 ? '· tomorrow'
                                    : `· in ${d}d`}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-ink-faint mt-2">No due date</div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1 mt-2 sm:mt-0 shrink-0">
                          {STATUSES.map((s) => (
                            <button
                              key={s}
                              onClick={() => update(it.id, { status: s, completed_at: s === 'Done' ? new Date().toISOString() : undefined })}
                              className={cx(
                                'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors',
                                it.status === s
                                  ? 'bg-grad-brand text-white'
                                  : 'glass glass-hover text-ink-muted hover:text-ink',
                              )}
                              title={`Set status: ${s}`}
                            >
                              <StatusIcon s={s} active={it.status === s} />
                              <span className="hidden sm:inline">{s}</span>
                            </button>
                          ))}
                          <Button variant="ghost" size="sm" iconOnly onClick={() => startEdit(it)} aria-label="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" iconOnly onClick={() => remove(it.id)} aria-label="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
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

function PriorityBadge({ value }) {
  const tone = value === 'High' ? 'rose' : value === 'Low' ? 'slate' : 'amber';
  return <Badge tone={tone} size="sm">{value || 'Medium'}</Badge>;
}

function StatusBadge({ value }) {
  const tone = value === 'Done' ? 'emerald' : value === 'In Progress' ? 'sky' : 'slate';
  return <Badge tone={tone} size="sm">{value || 'Pending'}</Badge>;
}

function StatusIcon({ s, active }) {
  if (s === 'Done') return <CheckCircle2 className="w-3 h-3" />;
  if (s === 'In Progress') return <CircleDot className="w-3 h-3" />;
  return <Circle className="w-3 h-3" />;
}

function edgeClass(edge) {
  return {
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    slate: 'bg-edge-strong/30',
  }[edge] || 'bg-edge-strong/30';
}
