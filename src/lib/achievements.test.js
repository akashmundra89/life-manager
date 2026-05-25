import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  CATEGORIES,
  CATEGORY_TONE,
  CATEGORY_HEX,
  TIERS,
  TIER_META,
  PERSON_COLORS,
  bucketBySchoolYear,
  formatSchoolYear,
  onThisDay,
  ageFromDob,
  unknownPeople,
} from './achievements.js';

// Pin "today" so age/onThisDay math is deterministic.
const FIXED_NOW = new Date('2026-05-25T10:30:00.000Z');

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterAll(() => {
  vi.useRealTimers();
});

describe('static taxonomies', () => {
  it('exposes the expected categories and tiers', () => {
    expect(CATEGORIES).toContain('Academic');
    expect(CATEGORIES).toContain('Sports');
    expect(CATEGORIES.length).toBe(8);

    expect(TIERS).toEqual(['Gold', 'Silver', 'Bronze', 'Participation', '—']);
  });

  it('has tone and hex entries for every category', () => {
    for (const cat of CATEGORIES) {
      expect(CATEGORY_TONE[cat]).toBeTruthy();
      expect(CATEGORY_HEX[cat]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('has meta for every tier', () => {
    for (const tier of TIERS) {
      expect(TIER_META[tier]).toBeTruthy();
      expect(TIER_META[tier].hex).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('exposes at least 4 person palette colors', () => {
    expect(PERSON_COLORS.length).toBeGreaterThanOrEqual(4);
    for (const c of PERSON_COLORS) {
      expect(c).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('bucketBySchoolYear', () => {
  it('returns {} for empty input', () => {
    expect(bucketBySchoolYear([])).toEqual({});
  });

  it('groups by Indian academic year (June → May) with default cutoff', () => {
    const items = [
      { id: '1', date: '2025-03-15', title: 'March 2025' },   // 2024-25
      { id: '2', date: '2024-09-10', title: 'Sept 2024' },   // 2024-25
      { id: '3', date: '2025-07-01', title: 'Jul 2025' },    // 2025-26
      { id: '4', date: '2026-02-14', title: 'Feb 2026' },    // 2025-26
    ];
    const out = bucketBySchoolYear(items);
    expect(Object.keys(out)).toEqual(['2025-26', '2024-25']); // newest first
    expect(out['2024-25'].map((x) => x.id).sort()).toEqual(['1', '2']);
    expect(out['2025-26'].map((x) => x.id).sort()).toEqual(['3', '4']);
  });

  it('sorts each year newest-first by date string', () => {
    const items = [
      { id: 'a', date: '2024-09-01' },
      { id: 'b', date: '2025-04-20' },
      { id: 'c', date: '2024-11-11' },
    ];
    const out = bucketBySchoolYear(items);
    expect(out['2024-25'].map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });

  it('skips entries without a valid date', () => {
    const items = [
      { id: 'ok', date: '2025-03-15' },
      { id: 'no-date' },
      { id: 'bad', date: 'not-a-date' },
    ];
    const out = bucketBySchoolYear(items);
    const all = Object.values(out).flat().map((x) => x.id);
    expect(all).toEqual(['ok']);
  });

  it('respects a custom cutoffMonth', () => {
    // Cutoff Sept: anything Sept onwards belongs to the new year.
    const items = [
      { id: 'aug', date: '2025-08-15' }, // 2024-25
      { id: 'sep', date: '2025-09-15' }, // 2025-26
    ];
    const out = bucketBySchoolYear(items, 9);
    expect(out['2024-25'][0].id).toBe('aug');
    expect(out['2025-26'][0].id).toBe('sep');
  });
});

describe('formatSchoolYear', () => {
  it('returns empty string for falsy input', () => {
    expect(formatSchoolYear('')).toBe('');
    expect(formatSchoolYear(null)).toBe('');
  });

  it('uses an en-dash separator', () => {
    expect(formatSchoolYear('2024-25')).toBe('2024–25');
    expect(formatSchoolYear('1999-00')).toBe('1999–00');
  });
});

describe('onThisDay', () => {
  it('returns achievements that fall on the same month+day in a prior year', () => {
    const items = [
      { id: 'match1', date: '2020-05-25', title: 'Five years ago today' },
      { id: 'match2', date: '2024-05-25', title: 'Two years ago today' },
      { id: 'miss-day', date: '2020-05-24' },
      { id: 'miss-month', date: '2020-06-25' },
      { id: 'today', date: '2026-05-25' }, // current year — excluded
    ];
    const result = onThisDay(items);
    const ids = result.map((r) => r.id);
    expect(ids).toEqual(['match2', 'match1']); // newest-first
  });

  it('attaches a _yearsAgo field', () => {
    const items = [{ id: 'x', date: '2020-05-25' }];
    const [hit] = onThisDay(items);
    expect(hit._yearsAgo).toBe(6); // 2026 - 2020
  });

  it('ignores entries with invalid or missing date', () => {
    const items = [
      { id: 'good', date: '2020-05-25' },
      { id: 'bad', date: 'nope' },
      { id: 'none' },
    ];
    expect(onThisDay(items).map((x) => x.id)).toEqual(['good']);
  });

  it('returns empty array when no matches', () => {
    expect(onThisDay([{ date: '2020-01-01' }])).toEqual([]);
  });
});

describe('ageFromDob', () => {
  it('returns null for missing or invalid dob', () => {
    expect(ageFromDob(null)).toBeNull();
    expect(ageFromDob('')).toBeNull();
    expect(ageFromDob('bogus')).toBeNull();
  });

  it('returns the right age when birthday has already passed this year', () => {
    // Today is 2026-05-25. Birthday Jan 1, 2000 → 26.
    expect(ageFromDob('2000-01-01')).toBe(26);
  });

  it('returns one less when the birthday is later in the year', () => {
    // Today is 2026-05-25. Birthday Dec 31, 2000 → still 25.
    expect(ageFromDob('2000-12-31')).toBe(25);
  });

  it('handles the exact-birthday case', () => {
    // Today is 2026-05-25. Birthday May 25, 2000 → 26 (today counts).
    expect(ageFromDob('2000-05-25')).toBe(26);
  });
});

describe('unknownPeople', () => {
  it('returns names referenced in achievements but not in roster', () => {
    const achievements = [
      { person: 'Alice', title: 'A' },
      { person: 'Bob', title: 'B' },
      { person: 'alice', title: 'A2' },  // dupe (case-insensitive)
      { person: '  Carol  ', title: 'C' }, // trimmed but kept as displayed
      { title: 'no person' },
      { person: '', title: 'blank' },
    ];
    const people = [{ name: 'Alice' }];
    const result = unknownPeople(achievements, people);
    // "Alice" is known → excluded. Bob and Carol remain, in encounter order.
    expect(result).toEqual(['Bob', 'Carol']);
  });

  it('returns [] when there are no achievements', () => {
    expect(unknownPeople([], [{ name: 'X' }])).toEqual([]);
  });

  it('treats name matching as case-insensitive against the roster', () => {
    const achievements = [{ person: 'ALICE' }];
    const people = [{ name: 'alice' }];
    expect(unknownPeople(achievements, people)).toEqual([]);
  });
});
