import { useState } from 'react';
import { Users, Plus, Pencil, Trash2, X as XIcon, Palette } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import BackupMenu from '../components/BackupMenu.jsx';
import { Card, CardHeader, Badge, Button, EmptyState } from '../components/ui';
import { Input, Select, Label } from '../components/ui/Input.jsx';
import useLocalCollection from '../hooks/useLocalCollection.js';
import { PERSON_COLORS, ageFromDob } from '../lib/achievements.js';
import { cx } from '../lib/cx.js';

const ROLES = ['Kid', 'Adult'];

const empty = { name: '', dob: '', role: 'Kid', color: PERSON_COLORS[0] };

export default function People() {
  const { items, add, update, remove, replaceAll } = useLocalCollection('people', []);
  const [form, setForm] = useState({
    ...empty,
    color: PERSON_COLORS[items.length % PERSON_COLORS.length],
  });
  const [editingId, setEditingId] = useState(null);

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingId) {
      update(editingId, { ...form, name: form.name.trim() });
      setEditingId(null);
    } else {
      add({ ...form, name: form.name.trim() });
    }
    setForm({
      ...empty,
      color: PERSON_COLORS[(items.length + 1) % PERSON_COLORS.length],
    });
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      name: p.name || '',
      dob: p.dob || '',
      role: p.role || 'Kid',
      color: p.color || PERSON_COLORS[0],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancel() {
    setEditingId(null);
    setForm({ ...empty, color: PERSON_COLORS[items.length % PERSON_COLORS.length] });
  }

  return (
    <div>
      <PageHeader
        icon={<Users className="w-5 h-5" />}
        title="Family"
        subtitle="Add the people whose achievements and memories you'd like to track."
        action={<BackupMenu filenameBase="people" items={items} onReplaceAll={replaceAll} />}
      />

      <Card
        className={cx('mb-5 animate-fade-up', editingId && 'ring-2 ring-brand-500/40')}
        hover={false}
      >
        <CardHeader
          icon={editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          iconTone={editingId ? 'amber' : 'emerald'}
          title={editingId ? 'Editing person' : 'Add person'}
          subtitle={editingId ? 'Make your changes and save.' : 'Name is required. Date of birth lets the app show ages.'}
          action={editingId && (
            <Button variant="ghost" size="sm" onClick={cancel}>
              <XIcon className="w-4 h-4" /> Cancel
            </Button>
          )}
        />
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-3">
            <Label>Name</Label>
            <Input autoFocus placeholder="e.g. Aanya" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Date of birth</Label>
            <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          </div>
          <div className="md:col-span-1">
            <Label>Role</Label>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </Select>
          </div>
          <div className="md:col-span-6">
            <Label className="flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Color</Label>
            <div className="flex flex-wrap gap-2">
              {PERSON_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={cx(
                    'w-8 h-8 rounded-full transition-all',
                    form.color === c ? 'ring-2 ring-offset-2 ring-offset-surface ring-ink scale-110' : 'hover:scale-105',
                  )}
                  style={{ background: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
          <div className="md:col-span-6 flex justify-end">
            <Button type="submit" variant="primary" size="md">
              {editingId ? 'Save changes' : (<><Plus className="w-4 h-4" /> Add person</>)}
            </Button>
          </div>
        </form>
      </Card>

      {items.length === 0 ? (
        <EmptyState
          icon={<Users className="w-5 h-5" />}
          title="No one added yet"
          hint="Add yourself, your kids, or anyone whose memories you'd like to track."
        />
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((p) => {
            const age = ageFromDob(p.dob);
            return (
              <li key={p.id} className="animate-fade-up">
                <Card padded={true} hover={false} className="h-full">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl grid place-items-center text-white text-base font-bold shrink-0 shadow-glass-soft"
                      style={{ background: p.color || PERSON_COLORS[0] }}
                    >
                      {(p.name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-ink truncate">{p.name}</span>
                        <Badge tone={p.role === 'Adult' ? 'slate' : 'sky'} size="sm">{p.role || 'Kid'}</Badge>
                      </div>
                      {p.dob && (
                        <div className="text-xs text-ink-faint mt-1">
                          Born {new Date(p.dob).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                          {age != null && <span> · {age} years old</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="sm" iconOnly onClick={() => startEdit(p)} aria-label="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" iconOnly onClick={() => remove(p.id)} aria-label="Delete">
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
