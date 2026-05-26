import { useMemo, useState } from 'react';
import {
  Plane, Plus, Pencil, Trash2, X as XIcon, MapPin, Calendar, Wallet,
  Users, CheckCircle2, ArrowRight,
} from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import BackupMenu from '../components/BackupMenu.jsx';
import { Card, CardHeader, Badge, Button, EmptyState, Stat } from '../components/ui';
import { Input, Select, Textarea, Label } from '../components/ui/Input.jsx';
import useLocalCollection from '../hooks/useLocalCollection.js';
import { formatDate, daysUntil } from '../lib/dateUtils.js';
import { cx } from '../lib/cx.js';

const STATUSES = [
  { value: 'idea',      label: 'Idea',       tone: 'slate'   },
  { value: 'planning',  label: 'Planning',   tone: 'amber'   },
  { value: 'booked',    label: 'Booked',     tone: 'sky'     },
  { value: 'upcoming',  label: 'Upcoming',   tone: 'violet'  },
  { value: 'completed', label: 'Completed',  tone: 'emerald' },
];

const STATUS_BY_VALUE = Object.fromEntries(STATUSES.map((s) => [s.value, s]));

const empty = {
  destination: '',
  country: '',
  start_date: '',
  end_date: '',
  budget: '',
  companions: '',
  status: 'idea',
  notes: '',
};

export default function VacationPlanning() {
  const { items, add, update, remove, replaceAll } = useLocalCollection('vacationPlans', []);
  const placesVisited = useLocalCollection('placesVisited', []);

  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const counts = useMemo(() => {
    const base = { all: items.length };
    for (const s of STATUSES) base[s.value] = items.filter((i) => i.status === s.value).length;
    return base;
  }, [items]);

  const nextTrip = useMemo(() => {
    const upcoming = items
      .filter((i) => i.start_date && i.status !== 'completed')
      .map((i) => ({ ...i, _d: daysUntil(i.start_date) }))
      .filter((i) => i._d != null && i._d >= 0)
      .sort((a, b) => a._d - b._d);
    return upcoming[0] ?? null;
  }, [items]);

  const totalBudget = useMemo(
    () => items.reduce((s, i) => s + (Number(i.budget) || 0), 0),
    [items],
  );

  const filtered = useMemo(() => {
    let list = items;
    if (statusFilter !== 'all') list = items.filter((i) => i.status === statusFilter);
    return [...list].sort((a, b) => (a.start_date || '9999').localeCompare(b.start_date || '9999'));
  }, [items, statusFilter]);

  function submit(e) {
    e.preventDefault();
    if (!form.destination.trim()) return;
    const payload = {
      ...form,
      destination: form.destination.trim(),
      country: form.country.trim(),
      companions: form.companions.trim(),
      budget: form.budget === '' ? null : Number(form.budget),
    };
    if (editingId) {
      update(editingId, payload);
      setEditingId(null);
    } else {
      add(payload);
    }
    setForm(empty);
  }

  function startEdit(it) {
    setEditingId(it.id);
    setForm({
      destination: it.destination || '',
      country: it.country || '',
      start_date: it.start_date || '',
      end_date: it.end_date || '',
      budget: it.budget ?? '',
      companions: it.companions || '',
      status: it.status || 'idea',
      notes: it.notes || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancel() {
    setEditingId(null);
    setForm(empty);
  }

  function markCompletedAndLog(it) {
    // Move a finished plan into the Places Visited collection,
    // then mark the plan completed so the history stays around.
    placesVisited.add({
      place: it.destination,
      country: it.country || '',
      visited_date: it.end_date || it.start_date || '',
      companions: it.companions || '',
      rating: 0,
      would_return: null,
      notes: it.notes || '',
    });
    update(it.id, { status: 'completed' });
  }

  return (
    <div>
      <PageHeader
        icon={<Plane className="w-5 h-5" />}
        title="Vacation planning"
        subtitle="Trips you're dreaming up, booking, and counting down to."
        action={<BackupMenu filenameBase="vacation-plans" items={items} onReplaceAll={replaceAll} />}
      />

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 animate-fade-up">
        <Stat
          label="Trips"
          value={counts.all}
          icon={<Plane className="w-4 h-4" />}
          tone="brand"
        />
        <Stat
          label="Upcoming"
          value={(counts.booked || 0) + (counts.upcoming || 0)}
          icon={<Calendar className="w-4 h-4" />}
          tone="violet"
        />
        <Stat
          label="Next trip"
          value={nextTrip ? `${nextTrip._d}d` : '—'}
          icon={<ArrowRight className="w-4 h-4" />}
          tone="sky"
          delta={nextTrip ? { kind: 'neutral', text: nextTrip.destination } : null}
        />
        <Stat
          label="Total budget"
          value={totalBudget ? `₹${totalBudget.toLocaleString()}` : '—'}
          icon={<Wallet className="w-4 h-4" />}
          tone="emerald"
        />
      </div>

      <Card
        className={cx('mb-5 animate-fade-up', editingId && 'ring-2 ring-brand-500/40')}
        hover={false}
      >
        <CardHeader
          icon={editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          iconTone={editingId ? 'amber' : 'emerald'}
          title={editingId ? 'Editing trip' : 'Add trip'}
          subtitle={editingId ? 'Make your changes and save.' : 'Destination is required.'}
          action={editingId && (
            <Button variant="ghost" size="sm" onClick={cancel}>
              <XIcon className="w-4 h-4" /> Cancel
            </Button>
          )}
        />
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-3">
            <Label>Destination</Label>
            <Input autoFocus placeholder="e.g. Kyoto, Bali, Goa" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Country</Label>
            <Input placeholder="Japan" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
          <div className="md:col-span-1">
            <Label>Status</Label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label>Start date</Label>
            <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>End date</Label>
            <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Budget</Label>
            <Input type="number" min="0" step="100" placeholder="50000" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          </div>

          <div className="md:col-span-3">
            <Label>Companions</Label>
            <Input placeholder="e.g. Family, Priya, Solo" value={form.companions} onChange={(e) => setForm({ ...form, companions: e.target.value })} />
          </div>
          <div className="md:col-span-3">
            <Label>Notes</Label>
            <Input placeholder="Passport, visa, bookings…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="md:col-span-6 flex justify-end">
            <Button type="submit" variant="primary" size="md">
              {editingId ? 'Save changes' : (<><Plus className="w-4 h-4" /> Add trip</>)}
            </Button>
          </div>
        </form>
      </Card>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-4 animate-fade-up [animation-delay:80ms]">
        {[
          ['all', 'All', counts.all],
          ...STATUSES.map((s) => [s.value, s.label, counts[s.value] || 0]),
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
          icon={<Plane className="w-5 h-5" />}
          title="No trips yet"
          hint="Add a destination above — even an idea is a start."
        />
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((it) => {
            const status = STATUS_BY_VALUE[it.status] ?? STATUS_BY_VALUE.idea;
            const d = daysUntil(it.start_date);
            return (
              <li key={it.id} className="animate-fade-up" data-focus-id={it.id}>
                <Card padded={true} hover={false} className="h-full">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-grad-brand-soft text-violet-600 dark:text-violet-300 grid place-items-center shrink-0">
                      <Plane className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-ink truncate">{it.destination}</span>
                        {it.country && (
                          <Badge tone="slate" size="sm">
                            <MapPin className="w-3 h-3" /> {it.country}
                          </Badge>
                        )}
                        <Badge tone={status.tone} size="sm">{status.label}</Badge>
                      </div>
                      <div className="text-xs text-ink-faint mt-1 flex items-center gap-1.5 flex-wrap">
                        {it.start_date && (
                          <span>
                            {formatDate(it.start_date)}
                            {it.end_date && it.end_date !== it.start_date && (
                              <> &rarr; {formatDate(it.end_date)}</>
                            )}
                          </span>
                        )}
                        {d != null && d >= 0 && it.status !== 'completed' && (
                          <span className="text-brand-600 dark:text-brand-300 font-semibold">
                            {d === 0 ? '· Today!' : `· in ${d}d`}
                          </span>
                        )}
                      </div>
                      {(it.companions || it.budget) && (
                        <div className="text-xs text-ink-faint mt-1 flex items-center gap-3 flex-wrap">
                          {it.companions && (
                            <span className="inline-flex items-center gap-1">
                              <Users className="w-3 h-3" /> {it.companions}
                            </span>
                          )}
                          {it.budget != null && it.budget !== '' && (
                            <span className="inline-flex items-center gap-1">
                              <Wallet className="w-3 h-3" /> ₹{Number(it.budget).toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                      {it.notes && <div className="text-sm text-ink-muted mt-1.5 line-clamp-2">{it.notes}</div>}
                    </div>
                    <div className="flex flex-col gap-1">
                      {it.status !== 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          iconOnly
                          onClick={() => markCompletedAndLog(it)}
                          aria-label="Mark visited"
                          title="Mark visited & log to Places visited"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
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
