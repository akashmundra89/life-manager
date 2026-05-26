import { useMemo, useState } from 'react';
import {
  TrendingUp, Plus, Pencil, Trash2, X as XIcon, ExternalLink, Info,
} from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import { Card, CardHeader, Badge, Button, EmptyState } from '../components/ui';
import { Input, Select, Label } from '../components/ui/Input.jsx';
import useLocalCollection from '../hooks/useLocalCollection.js';
import { formatDate, daysUntil } from '../lib/dateUtils.js';
import { cx } from '../lib/cx.js';

const STATUSES = ['Upcoming', 'Open', 'Closed', 'Listed'];

const empty = {
  name: '', open_date: '', close_date: '', listing_date: '',
  price_band: '', gmp: '', status: 'Upcoming', link: '', notes: '',
};

export default function IPO() {
  const { items, add, update, remove } = useLocalCollection('ipos', []);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    let list = items;
    if (statusFilter !== 'all') list = items.filter((i) => i.status === statusFilter);
    return [...list].sort((a, b) => (a.open_date || '').localeCompare(b.open_date || ''));
  }, [items, statusFilter]);

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingId) {
      update(editingId, { ...form, name: form.name.trim() });
      setEditingId(null);
    } else {
      add({ ...form, name: form.name.trim() });
    }
    setForm(empty);
  }

  function startEdit(it) {
    setEditingId(it.id);
    setForm({
      name: it.name || '', open_date: it.open_date || '', close_date: it.close_date || '',
      listing_date: it.listing_date || '', price_band: it.price_band || '', gmp: it.gmp || '',
      status: it.status || 'Upcoming', link: it.link || '', notes: it.notes || '',
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
        icon={<TrendingUp className="w-5 h-5" />}
        title="Upcoming IPOs"
        subtitle="Track issues, price bands, and current GMP. Update the GMP yourself daily."
      />

      <Card className="mb-5 animate-fade-up" hover={false}>
        <CardHeader
          icon={<Info className="w-4 h-4" />}
          iconTone="amber"
          title="Where to check live GMP"
          subtitle="No public IPO API has reliable real-time GMP — this is a manual tracker."
        />
        <div className="text-sm text-ink-muted space-y-1">
          <a className="block text-brand-600 dark:text-brand-300 hover:underline" href="https://www.investorgain.com/report/live-ipo-gmp/331/ipo/" target="_blank" rel="noreferrer">→ Live Mainboard IPO GMP | Grey Market Premium</a>
          <a className="block text-brand-600 dark:text-brand-300 hover:underline" href="https://ipowatch.in/ipo-grey-market-premium-latest-ipo-gmp/" target="_blank" rel="noreferrer">→ IPO Watch — Grey Market Premium</a>
          <a className="block text-brand-600 dark:text-brand-300 hover:underline" href="https://www.investorgain.com/ipo/" target="_blank" rel="noreferrer">→ InvestorGain — IPO Calendar</a>
        </div>
      </Card>

      <Card
        className={cx('mb-5 animate-fade-up [animation-delay:60ms]', editingId && 'ring-2 ring-brand-500/40')}
        hover={false}
      >
        <CardHeader
          icon={editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          iconTone={editingId ? 'amber' : 'emerald'}
          title={editingId ? 'Editing IPO' : 'Add IPO'}
          subtitle={editingId ? 'Make your changes and save.' : 'Name required. Dates and GMP help dashboard alerts.'}
          action={editingId && (
            <Button variant="ghost" size="sm" onClick={cancel}>
              <XIcon className="w-4 h-4" /> Cancel
            </Button>
          )}
        />
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-3">
            <Label>Name</Label>
            <Input autoFocus placeholder="e.g. ABC Industries Ltd" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Price band</Label>
            <Input placeholder="₹105 – ₹110" value={form.price_band} onChange={(e) => setForm({ ...form, price_band: e.target.value })} />
          </div>
          <div className="md:col-span-1">
            <Label>Status</Label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Open date</Label>
            <Input type="date" value={form.open_date} onChange={(e) => setForm({ ...form, open_date: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Close date</Label>
            <Input type="date" value={form.close_date} onChange={(e) => setForm({ ...form, close_date: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Listing date</Label>
            <Input type="date" value={form.listing_date} onChange={(e) => setForm({ ...form, listing_date: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>GMP</Label>
            <Input placeholder="+45 or 'Nil'" value={form.gmp} onChange={(e) => setForm({ ...form, gmp: e.target.value })} />
          </div>
          <div className="md:col-span-4">
            <Label>Reference link</Label>
            <Input placeholder="https://…" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
          </div>
          <div className="md:col-span-6">
            <Label>Notes</Label>
            <Input placeholder="Optional" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="md:col-span-6 flex justify-end">
            <Button type="submit" variant="primary" size="md">
              {editingId ? 'Save changes' : (<><Plus className="w-4 h-4" /> Add IPO</>)}
            </Button>
          </div>
        </form>
      </Card>

      <div className="flex flex-wrap gap-2 mb-4 animate-fade-up [animation-delay:120ms]">
        {['all', ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cx(
              'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all',
              statusFilter === s
                ? 'bg-grad-brand text-white shadow-glow-brand'
                : 'glass glass-hover text-ink-muted hover:text-ink',
            )}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="w-5 h-5" />}
          title="No IPOs tracked"
          hint="Add an upcoming IPO above to start tracking its GMP."
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((it) => {
            const d = daysUntil(it.open_date);
            return (
              <li key={it.id} data-focus-id={it.id} className="animate-fade-up">
                <Card padded={true} hover={false}>
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-ink">{it.name}</span>
                        <StatusBadge value={it.status} />
                        {it.price_band && <Badge tone="slate" size="sm">{it.price_band}</Badge>}
                        {it.gmp && <Badge tone="emerald" size="sm">GMP {it.gmp}</Badge>}
                      </div>
                      <div className="text-xs text-ink-faint mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                        {it.open_date && <span>Opens <span className="text-ink-muted">{formatDate(it.open_date)}</span>{d != null && d > 0 && <span className="text-brand-600 dark:text-brand-300 ml-1">· in {d}d</span>}</span>}
                        {it.close_date && <span>Closes <span className="text-ink-muted">{formatDate(it.close_date)}</span></span>}
                        {it.listing_date && <span>Lists <span className="text-ink-muted">{formatDate(it.listing_date)}</span></span>}
                      </div>
                      {it.notes && <div className="text-sm text-ink-muted mt-2">{it.notes}</div>}
                      {it.link && (
                        <a href={it.link} target="_blank" rel="noreferrer"
                           className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-300 hover:underline mt-2">
                          Open reference <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
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

function StatusBadge({ value }) {
  const tone =
    value === 'Open' ? 'emerald' :
    value === 'Closed' ? 'amber' :
    value === 'Listed' ? 'sky' : 'slate';
  return <Badge tone={tone} size="sm">{value || 'Upcoming'}</Badge>;
}
