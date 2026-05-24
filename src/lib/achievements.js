// Helpers shared between the Achievements page, On-this-day widget, and yearbook PDF.

export const CATEGORIES = [
  'Academic', 'Sports', 'Arts', 'Music', 'Social', 'Milestone', 'Certificate', 'Other',
];

export const CATEGORY_TONE = {
  Academic:    'indigo',
  Sports:      'emerald',
  Arts:        'rose',
  Music:       'violet',
  Social:      'sky',
  Milestone:   'amber',
  Certificate: 'brand',
  Other:       'slate',
};

export const CATEGORY_HEX = {
  Academic: '#6366f1', Sports: '#10b981', Arts: '#fb7185', Music: '#9b6bff',
  Social: '#0ea5e9', Milestone: '#f59e0b', Certificate: '#3b6dff', Other: '#64748b',
};

export const TIERS = ['Gold', 'Silver', 'Bronze', 'Participation', '—'];

export const TIER_META = {
  Gold:          { hex: '#f59e0b', tone: 'amber',   label: 'Gold' },
  Silver:        { hex: '#94a3b8', tone: 'slate',   label: 'Silver' },
  Bronze:        { hex: '#c2410c', tone: 'amber',   label: 'Bronze' },
  Participation: { hex: '#10b981', tone: 'emerald', label: 'Participated' },
  '—':           { hex: '#94a3b8', tone: 'slate',   label: '—' },
};

// Default palette for new people (color-rotates as you add).
export const PERSON_COLORS = [
  '#3b6dff', '#9b6bff', '#fb7185', '#10b981',
  '#f59e0b', '#0ea5e9', '#a855f7', '#ec4899',
];

/**
 * Bucket achievements by school year. Indian academic year = June → May,
 * so an achievement in March 2025 belongs to "2024–25". Override via cutoffMonth.
 */
export function bucketBySchoolYear(achievements, cutoffMonth = 6) {
  const out = {};
  for (const a of achievements) {
    if (!a?.date) continue;
    const d = new Date(a.date);
    if (Number.isNaN(d.getTime())) continue;
    const m = d.getMonth() + 1; // 1..12
    const y = d.getFullYear();
    const startYear = m >= cutoffMonth ? y : y - 1;
    const key = `${startYear}-${String(startYear + 1).slice(2)}`;
    (out[key] ||= []).push(a);
  }
  // Newest year first
  const sortedKeys = Object.keys(out).sort((a, b) => b.localeCompare(a));
  const ordered = {};
  for (const k of sortedKeys) {
    ordered[k] = out[k].sort((x, y) => (y.date || '').localeCompare(x.date || ''));
  }
  return ordered;
}

/** "2024-25" → "2024–25"  (en-dash for display) */
export function formatSchoolYear(key) {
  if (!key) return '';
  const [a, b] = key.split('-');
  return `${a}–${b}`;
}

/**
 * Achievements happening on today's month+day in any past year.
 * Returns newest-first within those.
 */
export function onThisDay(achievements, today = new Date()) {
  const m = today.getMonth() + 1;
  const d = today.getDate();
  const todayY = today.getFullYear();
  return achievements
    .filter((a) => {
      if (!a?.date) return false;
      const dt = new Date(a.date);
      if (Number.isNaN(dt.getTime())) return false;
      return (
        dt.getMonth() + 1 === m &&
        dt.getDate() === d &&
        dt.getFullYear() < todayY
      );
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .map((a) => ({ ...a, _yearsAgo: todayY - new Date(a.date).getFullYear() }));
}

/** Compute current age in whole years from a YYYY-MM-DD dob. */
export function ageFromDob(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const mDiff = now.getMonth() - d.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

/** Get unique people referenced in achievements but not yet in the people roster. */
export function unknownPeople(achievements, people) {
  const known = new Set(people.map((p) => (p.name || '').toLowerCase()));
  const seen = new Set();
  const out = [];
  for (const a of achievements) {
    const n = (a.person || '').trim();
    if (!n) continue;
    const lc = n.toLowerCase();
    if (known.has(lc) || seen.has(lc)) continue;
    seen.add(lc);
    out.push(n);
  }
  return out;
}
