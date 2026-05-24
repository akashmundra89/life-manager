import { useMemo, useState } from 'react';
import { CalendarDays, Plus, Pencil, Trash2, X as XIcon, Clock } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import BackupMenu from '../components/BackupMenu.jsx';
import { Card, CardHeader, Badge, badgeForDays, labelForDays, Button, EmptyState } from '../components/ui';
import { Input, Label } from '../components/ui/Input.jsx';
import useLocalCollection from '../hooks/useLocalCollection.js';
import { formatDate, daysUntil, todayISO } from '../lib/dateUtils.js';
import { cx } from '../lib/cx.js';

const empty = { title: '', date: '', time: '' };

export default function Events() {
  const { items, add, update, remove, replaceAll } = useLocalCollection('events', []);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const ad = (a.date || '') + ' ' + (a.time || '');
      const bd = (b.date || '') + ' ' + (b.time || '');
      return ad.localeCompare(bd);
    });
  }, [items]);

  // Split into upcoming / past for visual separation
  const { upcoming, past } = useMemo(() => {
    const up = [];
    const pa = [];
    for (const it of sorted) {
      const d = daysUntil(it.date);
      if (d == null || d < 0) pa.push(it); else up.push(it);
    }
    return { upcoming: up, past: pa.reverse() };
  }, [sorted]);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancel() {
    setEditingId(null);
    setForm(empty);
  }

  return (
    <div>
      <PageHeader
        icon={<CalendarDays className="w-5 h-5" />}
        title="Upcoming events"
        subtitle="Things happening in the next few days."
        action={<BackupMenu filenameBase="events" items={items} onReplaceAll={replaceAll} />}
      />

      <Card
        className={cx('mb-5 animate-fade-up', editingId && 'ring-2 ring-brand-500/40')}
        hover={false}
      >
        <CardHeader
          icon={editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          iconTone={editingId ? 'amber' : 'emerald'}
          title={editingId ? 'Editing event' : 'Add event'}
          subtitle={editingId ? 'Make your changes and save.' : 'Title + date required, time is optional.'}
          action={editingId && (
            <Button variant="ghost" size="sm" onClick={cancel}>
              <XIcon className="w-4 h-4" /> Cancel
            </Button>
          )}
        />
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-3">
            <Label>Title</Label>
            <Input autoFocus placeholder="e.g. Dentist appointment" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Date</Label>
            <Input type="date" value={form.date} min={editingId ? undefined : todayISO()} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="md:col-span-1">
            <Label>Time</Label>
            <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
          <div className="md:col-span-6 flex justify-end">
            <Button type="submit" variant="primary" size="md">
              {editingId ? 'Save event' : (<><Plus className="w-4 h-4" /> Add event</>)}
            </Button>
          </div>
        </form>
      </Card>

      {items.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="w-5 h-5" />}
          title="No upcoming events"
          hint="Add one above to get a reminder on the dashboard."
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="mb-6 animate-fade-up">
              <h2 className="text-[11px] font-bold text-ink-faint uppercase tracking-wider mb-2 px-1">
                Upcoming · {upcoming.length}
              </h2>
              <Card padded={false} hover={false}>
                <ul className="divide-y divide-edge/5">
                  {upcoming.map((it) => (
                    <EventRow key={it.id} item={it} onEdit={startEdit} onDelete={remove} />
                  ))}
                </ul>
              </Card>
            </section>
          )}
          {past.length > 0 && (
            <section className="animate-fade-up [animation-delay:80ms]">
              <h2 className="text-[11px] font-bold text-ink-faint uppercase tracking-wider mb-2 px-1">
                Past · {past.length}
              </h2>
              <Card padded={false} hover={false}>
                <ul className="divide-y divide-edge/5">
                  {past.map((it) => (
                    <EventRow key={it.id} item={it} onEdit={startEdit} onDelete={remove} dim />
                  ))}
                </ul>
              </Card>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function EventRow({ item, onEdit, onDelete, dim = false }) {
  const d = daysUntil(item.date);
  return (
    <li className={cx('flex items-center gap-3 px-4 py-3 hover:bg-surface-strong/30 transition-colors', dim && 'opacity-60')}>
      <DateChip iso={item.date} />
      <div className="flex-1 min-w-0">
        <div className={cx('text-sm font-semibold truncate', dim && 'line-through')}>{item.title}</div>
        <div className="text-xs text-ink-faint flex items-center gap-1.5">
          <span>{formatDate(item.date)}</span>
          {item.time && (
            <>
              <span>·</span>
              <Clock className="w-3 h-3" />
              <span>{item.time}</span>
            </>
          )}
        </div>
      </div>
      <Badge tone={badgeForDays(d)}>{labelForDays(d)}</Badge>
      <Button variant="ghost" size="sm" iconOnly onClick={() => onEdit(item)} aria-label="Edit">
        <Pencil className="w-3.5 h-3.5" />
      </Button>
      <Button variant="ghost" size="sm" iconOnly onClick={() => onDelete(item.id)} aria-label="Delete">
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </li>
  );
}

function DateChip({ iso }) {
  if (!iso) return <div className="w-11 h-11 rounded-xl glass-soft" />;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return <div className="w-11 h-11 rounded-xl glass-soft" />;
  const day = d.getDate();
  const mon = d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
  return (
    <div className="w-11 h-11 rounded-xl glass flex flex-col items-center justify-center shrink-0">
      <div className="text-[9px] font-bold text-brand-600 dark:text-brand-300 leading-none">{mon}</div>
      <div className="text-base font-bold text-ink leading-none mt-0.5">{day}</div>
    </div>
  );
}
