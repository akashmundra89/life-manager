import { useMemo, useState } from 'react';
import {
  Globe2, Plus, Pencil, Trash2, X as XIcon, MapPin, Star, Users, Heart,
} from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import BackupMenu from '../components/BackupMenu.jsx';
import { Card, CardHeader, Badge, Button, EmptyState, Stat } from '../components/ui';
import { Input, Select, Label } from '../components/ui/Input.jsx';
import useLocalCollection from '../hooks/useLocalCollection.js';
import { formatDate } from '../lib/dateUtils.js';
import { cx } from '../lib/cx.js';

const RETURN_OPTIONS = [
  { value: '',     label: '—' },
  { value: 'yes',  label: 'Yes, definitely' },
  { value: 'maybe',label: 'Maybe' },
  { value: 'no',   label: 'No' },
];

const empty = {
  place: '',
  country: '',
  visited_date: '',
  companions: '',
  rating: 0,
  would_return: '',
  notes: '',
};

function StarRating({ value, onChange, readOnly = false, size = 'md' }) {
  const px = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n === value ? 0 : n)}
          className={cx(
            'transition-colors',
            readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
          )}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star
            className={cx(
              px,
              n <= value
                ? 'text-amber-400 fill-amber-400'
                : 'text-ink-faint/40',
            )}
          />
        </button>
      ))}
    </div>
  );
}

export default function PlacesVisited() {
  const { items, add, update, remove, replaceAll } = useLocalCollection('placesVisited', []);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');

  const stats = useMemo(() => {
    const countries = new Set(items.map((i) => (i.country || '').trim().toLowerCase()).filter(Boolean));
    const years = new Set(
      items
        .map((i) => i.visited_date ? new Date(i.visited_date).getFullYear() : null)
        .filter(Boolean),
    );
    const favourites = items.filter((i) => Number(i.rating) >= 4).length;
    return {
      places: items.length,
      countries: countries.size,
      years: years.size,
      favourites,
    };
  }, [items]);

  const byCountry = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      const k = (it.country || 'Unknown').trim() || 'Unknown';
      map.set(k, (map.get(k) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? items.filter((i) =>
          (i.place || '').toLowerCase().includes(q) ||
          (i.country || '').toLowerCase().includes(q) ||
          (i.notes || '').toLowerCase().includes(q))
      : items;
    return [...list].sort((a, b) => (b.visited_date || '').localeCompare(a.visited_date || ''));
  }, [items, search]);

  function submit(e) {
    e.preventDefault();
    if (!form.place.trim()) return;
    const payload = {
      ...form,
      place: form.place.trim(),
      country: form.country.trim(),
      companions: form.companions.trim(),
      rating: Number(form.rating) || 0,
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
      place: it.place || '',
      country: it.country || '',
      visited_date: it.visited_date || '',
      companions: it.companions || '',
      rating: Number(it.rating) || 0,
      would_return: it.would_return || '',
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
        icon={<Globe2 className="w-5 h-5" />}
        title="Places visited"
        subtitle="A travel log of the places you've already been."
        action={<BackupMenu filenameBase="places-visited" items={items} onReplaceAll={replaceAll} />}
      />

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 animate-fade-up">
        <Stat label="Places" value={stats.places} icon={<MapPin className="w-4 h-4" />} tone="brand" />
        <Stat label="Countries" value={stats.countries} icon={<Globe2 className="w-4 h-4" />} tone="violet" />
        <Stat label="Years on the road" value={stats.years} icon={<Star className="w-4 h-4" />} tone="amber" />
        <Stat label="Favourites" value={stats.favourites} icon={<Heart className="w-4 h-4" />} tone="rose" />
      </div>

      <Card
        className={cx('mb-5 animate-fade-up', editingId && 'ring-2 ring-brand-500/40')}
        hover={false}
      >
        <CardHeader
          icon={editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          iconTone={editingId ? 'amber' : 'emerald'}
          title={editingId ? 'Editing place' : 'Add place'}
          subtitle={editingId ? 'Make your changes and save.' : 'Place name is required.'}
          action={editingId && (
            <Button variant="ghost" size="sm" onClick={cancel}>
              <XIcon className="w-4 h-4" /> Cancel
            </Button>
          )}
        />
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-3">
            <Label>Place</Label>
            <Input autoFocus placeholder="e.g. Kyoto, Bali, Goa" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Country</Label>
            <Input placeholder="Japan" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
          <div className="md:col-span-1">
            <Label>Date</Label>
            <Input type="date" value={form.visited_date} onChange={(e) => setForm({ ...form, visited_date: e.target.value })} />
          </div>

          <div className="md:col-span-3">
            <Label>Companions</Label>
            <Input placeholder="e.g. Family, Priya, Solo" value={form.companions} onChange={(e) => setForm({ ...form, companions: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Would return?</Label>
            <Select value={form.would_return} onChange={(e) => setForm({ ...form, would_return: e.target.value })}>
              {RETURN_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
          </div>
          <div className="md:col-span-1">
            <Label>Rating</Label>
            <div className="h-[42px] flex items-center">
              <StarRating value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
            </div>
          </div>

          <div className="md:col-span-5">
            <Label>Notes</Label>
            <Input placeholder="Highlights, food, what to remember…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="md:col-span-1 flex items-end">
            <Button type="submit" variant="primary" size="md" className="w-full">
              {editingId ? 'Save' : (<><Plus className="w-4 h-4" /> Add</>)}
            </Button>
          </div>
        </form>
      </Card>

      {/* Search + country chips */}
      {items.length > 0 && (
        <div className="mb-4 animate-fade-up [animation-delay:80ms] space-y-3">
          <Input
            placeholder="Search places, countries, notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {byCountry.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {byCountry.slice(0, 12).map(([country, n]) => (
                <Badge key={country} tone="slate" size="sm">
                  <MapPin className="w-3 h-3" /> {country} · {n}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Globe2 className="w-5 h-5" />}
          title={items.length ? 'Nothing matches that search' : 'No places logged yet'}
          hint={items.length ? 'Try a different search term.' : 'Add a place above to start your travel log.'}
        />
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((it) => (
            <li key={it.id} className="animate-fade-up" data-focus-id={it.id}>
              <Card padded={true} hover={false} className="h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-grad-brand-soft text-violet-600 dark:text-violet-300 grid place-items-center shrink-0">
                    <Globe2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-ink truncate">{it.place}</span>
                      {it.country && (
                        <Badge tone="slate" size="sm">
                          <MapPin className="w-3 h-3" /> {it.country}
                        </Badge>
                      )}
                      {it.would_return === 'yes' && (
                        <Badge tone="emerald" size="sm">
                          <Heart className="w-3 h-3" /> Return
                        </Badge>
                      )}
                      {it.would_return === 'no' && (
                        <Badge tone="rose" size="sm">Once was enough</Badge>
                      )}
                    </div>
                    <div className="text-xs text-ink-faint mt-1 flex items-center gap-2 flex-wrap">
                      {it.visited_date && <span>{formatDate(it.visited_date)}</span>}
                      {it.companions && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3 h-3" /> {it.companions}
                        </span>
                      )}
                    </div>
                    {Number(it.rating) > 0 && (
                      <div className="mt-1.5">
                        <StarRating value={Number(it.rating)} readOnly size="sm" />
                      </div>
                    )}
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
          ))}
        </ul>
      )}
    </div>
  );
}
