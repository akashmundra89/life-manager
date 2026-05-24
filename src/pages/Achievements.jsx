import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, Plus, Pencil, Trash2, X as XIcon, FileDown, Award, Image as ImageIcon,
  Sparkles, Users as UsersIcon, Filter, Quote,
} from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import BackupMenu from '../components/BackupMenu.jsx';
import { Card, CardHeader, Stat, Badge, Button, EmptyState, Modal } from '../components/ui';
import { Input, Select, Textarea, Label } from '../components/ui/Input.jsx';
import useLocalCollection from '../hooks/useLocalCollection.js';
import {
  CATEGORIES, CATEGORY_TONE, TIERS, TIER_META, PERSON_COLORS,
  bucketBySchoolYear, formatSchoolYear,
} from '../lib/achievements.js';
import { cx } from '../lib/cx.js';
import { generateYearbook } from '../lib/yearbook.js';

const empty = {
  person: '', date: '', title: '', description: '',
  category: 'Academic', tier: '—', grade_level: '',
  issuer: '', photo_url: '', tagsText: '', quote: '',
};

export default function Achievements() {
  const { items, add, update, remove, replaceAll } = useLocalCollection('achievements', []);
  const people = useLocalCollection('people', []);

  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [personFilter, setPersonFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showYearbook, setShowYearbook] = useState(false);

  const colorForPerson = useMemo(() => {
    const m = {};
    for (const p of people.items) m[p.name?.toLowerCase()] = p.color || PERSON_COLORS[0];
    return (name) => (m[(name || '').toLowerCase()] || '#64748b');
  }, [people.items]);

  const filtered = useMemo(() => {
    return items.filter((a) => {
      if (personFilter !== 'all' && (a.person || '').toLowerCase() !== personFilter.toLowerCase()) return false;
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      return true;
    });
  }, [items, personFilter, categoryFilter]);

  const byYear = useMemo(() => bucketBySchoolYear(filtered), [filtered]);

  // Stat strip
  const stats = useMemo(() => {
    const total = filtered.length;
    const thisYearKey = Object.keys(byYear)[0];
    const thisYear = thisYearKey ? byYear[thisYearKey].length : 0;
    const golds = filtered.filter((a) => a.tier === 'Gold').length;
    const cats = new Set(filtered.map((a) => a.category)).size;
    return { total, thisYear, thisYearKey, golds, cats };
  }, [filtered, byYear]);

  function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;
    const payload = {
      person: form.person.trim(),
      date: form.date,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      tier: form.tier,
      grade_level: form.grade_level.trim(),
      issuer: form.issuer.trim(),
      photo_url: form.photo_url.trim(),
      tags: form.tagsText.split(',').map((t) => t.trim()).filter(Boolean),
      quote: form.quote.trim(),
    };
    if (editingId) {
      update(editingId, payload);
      setEditingId(null);
    } else {
      add(payload);
    }
    setForm({ ...empty, person: form.person, category: form.category });
  }

  function startEdit(a) {
    setEditingId(a.id);
    setForm({
      person: a.person || '',
      date: a.date || '',
      title: a.title || '',
      description: a.description || '',
      category: a.category || 'Academic',
      tier: a.tier || '—',
      grade_level: a.grade_level || '',
      issuer: a.issuer || '',
      photo_url: a.photo_url || '',
      tagsText: Array.isArray(a.tags) ? a.tags.join(', ') : '',
      quote: a.quote || '',
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
        icon={<Trophy className="w-5 h-5" />}
        title="Achievements"
        subtitle="Memories, awards, and milestones — saved year by year."
        action={
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => setShowYearbook(true)} disabled={filtered.length === 0}>
              <FileDown className="w-4 h-4" /> Yearbook PDF
            </Button>
            <BackupMenu filenameBase="achievements" items={items} onReplaceAll={replaceAll} compact />
          </div>
        }
      />

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <Stat
          label="Total"
          value={stats.total}
          tone="violet"
          icon={<Trophy className="w-4 h-4" />}
          delta={{ kind: 'neutral', text: people.items.length > 0 ? `${people.items.length} ${people.items.length === 1 ? 'person' : 'people'}` : 'add family →' }}
          className="animate-fade-up"
        />
        <Stat
          label={stats.thisYearKey ? formatSchoolYear(stats.thisYearKey) : 'This year'}
          value={stats.thisYear}
          tone="indigo"
          icon={<Sparkles className="w-4 h-4" />}
          delta={{ kind: 'neutral', text: 'most recent year' }}
          className="animate-fade-up [animation-delay:60ms]"
        />
        <Stat
          label="Gold"
          value={stats.golds}
          tone="amber"
          icon={<Award className="w-4 h-4" />}
          delta={{ kind: 'neutral', text: stats.total > 0 ? `${Math.round((stats.golds / stats.total) * 100)}% of all` : '—' }}
          className="animate-fade-up [animation-delay:120ms]"
        />
        <Stat
          label="Categories"
          value={stats.cats}
          tone="emerald"
          icon={<Filter className="w-4 h-4" />}
          delta={{ kind: 'neutral', text: 'distinct' }}
          className="animate-fade-up [animation-delay:180ms]"
        />
      </div>

      {/* No people yet → guide them to the People page first */}
      {people.items.length === 0 && (
        <Card className="mb-5 animate-fade-up [animation-delay:220ms]" hover={false}>
          <CardHeader
            icon={<UsersIcon className="w-4 h-4" />}
            iconTone="sky"
            title="Add your family first"
            subtitle="Add a person and you'll get color-coded cards plus per-person filtering."
            action={<Button as={Link} to="/people" variant="primary" size="sm">Add people →</Button>}
          />
        </Card>
      )}

      {/* Add / edit form */}
      <Card
        className={cx('mb-5 animate-fade-up [animation-delay:240ms]', editingId && 'ring-2 ring-brand-500/40')}
        hover={false}
      >
        <CardHeader
          icon={editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          iconTone={editingId ? 'amber' : 'emerald'}
          title={editingId ? 'Editing achievement' : 'Add achievement'}
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
            <Input autoFocus placeholder="e.g. Won inter-school chess tournament" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="md:col-span-1">
            <Label>Tier</Label>
            <Select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}>
              {TIERS.map((t) => <option key={t} value={t}>{TIER_META[t].label}</option>)}
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Person</Label>
            {people.items.length > 0 ? (
              <Select value={form.person} onChange={(e) => setForm({ ...form, person: e.target.value })}>
                <option value="">— Select —</option>
                {people.items.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
              </Select>
            ) : (
              <Input placeholder="Type a name" value={form.person} onChange={(e) => setForm({ ...form, person: e.target.value })} />
            )}
          </div>
          <div className="md:col-span-2">
            <Label>Category</Label>
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Grade / class</Label>
            <Input placeholder="e.g. Class 5, College Y1" value={form.grade_level} onChange={(e) => setForm({ ...form, grade_level: e.target.value })} />
          </div>
          <div className="md:col-span-3">
            <Label>Issuer / school</Label>
            <Input placeholder="DPS Bangalore, ABC Music School…" value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} />
          </div>
          <div className="md:col-span-3">
            <Label>Tags</Label>
            <Input placeholder="chess, regional, team" value={form.tagsText} onChange={(e) => setForm({ ...form, tagsText: e.target.value })} />
          </div>
          <div className="md:col-span-6">
            <Label>Description</Label>
            <Textarea rows={2} placeholder="What happened, why it's special…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="md:col-span-4">
            <Label className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Photo URL (optional)</Label>
            <Input placeholder="https://… (e.g. Google Photos share link)" value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label className="flex items-center gap-1.5"><Quote className="w-3.5 h-3.5" /> Quote (optional)</Label>
            <Input placeholder="'I never thought I'd win!'" value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} />
          </div>
          <div className="md:col-span-6 flex justify-end">
            <Button type="submit" variant="primary" size="md">
              {editingId ? 'Save changes' : (<><Plus className="w-4 h-4" /> Add achievement</>)}
            </Button>
          </div>
        </form>
      </Card>

      {/* Filter chips */}
      {items.length > 0 && (
        <div className="space-y-3 mb-4 animate-fade-up [animation-delay:280ms]">
          <div className="flex flex-wrap gap-2">
            <FilterChip active={personFilter === 'all'} onClick={() => setPersonFilter('all')}>
              All people
            </FilterChip>
            {people.items.map((p) => (
              <FilterChip
                key={p.id}
                active={personFilter.toLowerCase() === p.name.toLowerCase()}
                onClick={() => setPersonFilter(p.name)}
                color={p.color}
              >
                {p.name}
              </FilterChip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')} small>
              All categories
            </FilterChip>
            {CATEGORIES.map((c) => (
              <FilterChip
                key={c}
                active={categoryFilter === c}
                onClick={() => setCategoryFilter(c)}
                small
              >
                {c}
              </FilterChip>
            ))}
          </div>
        </div>
      )}

      {/* Achievements grouped by school year */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Trophy className="w-5 h-5" />}
          title={items.length === 0 ? 'No achievements saved yet' : 'Nothing matches the filter'}
          hint={items.length === 0 ? 'Add the first one above — even small wins are worth remembering.' : 'Try clearing filters to see more.'}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(byYear).map(([yearKey, list]) => {
            const golds = list.filter((a) => a.tier === 'Gold').length;
            return (
              <section key={yearKey} className="animate-fade-up">
                <div className="flex items-center justify-between mb-3 px-1 flex-wrap gap-2">
                  <h2 className="text-sm font-bold text-ink">
                    {formatSchoolYear(yearKey)}
                  </h2>
                  <div className="text-[11px] text-ink-faint">
                    {list.length} achievement{list.length === 1 ? '' : 's'}
                    {golds > 0 && <span> · <span className="text-amber-600 dark:text-amber-300 font-semibold">{golds} gold</span></span>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {list.map((a) => (
                    <AchievementCard
                      key={a.id}
                      a={a}
                      colorForPerson={colorForPerson}
                      onEdit={startEdit}
                      onDelete={remove}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {showYearbook && (
        <YearbookModal
          onClose={() => setShowYearbook(false)}
          achievements={items}
          people={people.items}
        />
      )}
    </div>
  );
}

function AchievementCard({ a, colorForPerson, onEdit, onDelete }) {
  const tier = TIER_META[a.tier] ?? TIER_META['—'];
  const tone = CATEGORY_TONE[a.category] || 'slate';
  const color = colorForPerson(a.person);
  return (
    <Card padded={false} hover={false} className="overflow-hidden">
      <div className="flex">
        <div className="w-1 self-stretch shrink-0" style={{ background: color }} />
        <div className="flex-1 p-4">
          <div className="flex items-start gap-3">
            {a.photo_url ? (
              <a href={a.photo_url} target="_blank" rel="noreferrer" className="shrink-0">
                <img
                  src={a.photo_url}
                  alt=""
                  loading="lazy"
                  className="w-16 h-16 rounded-xl object-cover shadow-glass-soft"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </a>
            ) : (
              <div
                className="w-12 h-12 rounded-xl grid place-items-center shrink-0"
                style={{ background: tier.hex + '22', color: tier.hex }}
              >
                <Award className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-ink">{a.title}</span>
                <Badge tone={tone} size="sm">{a.category}</Badge>
                {a.tier && a.tier !== '—' && <Badge tone={tier.tone} size="sm">{tier.label}</Badge>}
                {a.grade_level && <Badge tone="slate" size="sm">{a.grade_level}</Badge>}
              </div>
              <div className="text-xs text-ink-faint mt-1 flex flex-wrap gap-x-2">
                {a.person && (
                  <span className="font-semibold inline-flex items-center gap-1.5" style={{ color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                    {a.person}
                  </span>
                )}
                {a.date && <span>· {new Date(a.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                {a.issuer && <span>· {a.issuer}</span>}
              </div>
              {a.description && (
                <p className="text-sm text-ink-muted mt-2 line-clamp-3">{a.description}</p>
              )}
              {a.quote && (
                <blockquote className="text-xs italic text-ink-muted border-l-2 pl-2 mt-2" style={{ borderColor: color }}>
                  &ldquo;{a.quote}&rdquo;
                </blockquote>
              )}
              {Array.isArray(a.tags) && a.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {a.tags.map((t) => <Badge key={t} tone="slate" size="sm">#{t}</Badge>)}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Button variant="ghost" size="sm" iconOnly onClick={() => onEdit(a)} aria-label="Edit">
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="sm" iconOnly onClick={() => onDelete(a.id)} aria-label="Delete">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function FilterChip({ active, onClick, children, color, small = false }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'inline-flex items-center gap-2 rounded-full font-medium transition-all',
        small ? 'px-3 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
        active
          ? 'bg-grad-brand text-white shadow-glow-brand'
          : 'glass glass-hover text-ink-muted hover:text-ink',
      )}
    >
      {color && (
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      )}
      {children}
    </button>
  );
}

function YearbookModal({ onClose, achievements, people }) {
  // Default to "Everyone" so every available year is visible right away.
  const [person, setPerson] = useState('');
  const [year, setYear] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  // Years available for the current person selection (newest first because
  // bucketBySchoolYear returns sorted-desc keys).
  const years = useMemo(() => {
    const filtered = person
      ? achievements.filter((a) => (a.person || '').toLowerCase() === person.toLowerCase())
      : achievements;
    return Object.keys(bucketBySchoolYear(filtered));
  }, [achievements, person]);

  // Re-pick `year` whenever the available years change (e.g. user switched person).
  // Keeps the current year if it's still valid; otherwise jumps to the newest.
  useEffect(() => {
    setYear((cur) => {
      if (years.length === 0) return '';
      if (years.includes(cur)) return cur;
      return years[0];
    });
  }, [years]);

  async function go() {
    setBusy(true);
    setError('');
    try {
      const matching = achievements.filter((a) => {
        if (person && (a.person || '').toLowerCase() !== person.toLowerCase()) return false;
        const buckets = bucketBySchoolYear([a]);
        return Object.keys(buckets)[0] === year;
      });
      if (matching.length === 0) {
        setError('No achievements for this person/year.');
        return;
      }
      await generateYearbook({
        person: person || 'Family',
        year,
        achievements: matching,
        people,
      });
      if (mounted.current) onClose();
    } catch (err) {
      setError(err?.message || 'Could not generate the PDF.');
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  const canDownload = !!year && !busy && achievements.length > 0;
  const matchCount = useMemo(() => {
    if (!year) return 0;
    return achievements.filter((a) => {
      if (person && (a.person || '').toLowerCase() !== person.toLowerCase()) return false;
      const buckets = bucketBySchoolYear([a]);
      return Object.keys(buckets)[0] === year;
    }).length;
  }, [achievements, person, year]);

  return (
    <Modal open={true} onClose={onClose} title="Generate yearbook" size="md">
      <p className="text-sm text-ink-muted mb-4">
        Build a printable PDF of achievements for one person — or the whole family — across a single school year.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Person</Label>
          {people.length > 0 ? (
            <Select value={person} onChange={(e) => setPerson(e.target.value)}>
              <option value="">Everyone (family)</option>
              {people.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </Select>
          ) : (
            <Input value={person} onChange={(e) => setPerson(e.target.value)} placeholder="Name (or leave blank for everyone)" />
          )}
        </div>
        <div>
          <Label>School year</Label>
          <Select value={year} onChange={(e) => setYear(e.target.value)} disabled={years.length === 0}>
            {years.length === 0
              ? <option value="">No data for this person</option>
              : years.map((y) => <option key={y} value={y}>{formatSchoolYear(y)}</option>)}
          </Select>
        </div>
      </div>
      <div className="mt-3 text-xs text-ink-faint">
        {year ? (
          <>
            <span className="font-semibold text-ink">{matchCount}</span> achievement{matchCount === 1 ? '' : 's'} will be included.
          </>
        ) : (
          <>Pick a person and a school year to enable the download.</>
        )}
      </div>
      {error && (
        <div className="mt-3 text-sm text-rose-700 dark:text-rose-300 bg-rose-500/10 rounded-xl px-3 py-2">
          {error}
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={go} disabled={!canDownload}>
          {busy ? 'Generating…' : (<><FileDown className="w-4 h-4" /> Download PDF</>)}
        </Button>
      </div>
    </Modal>
  );
}
