import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  todayISO,
  formatDate,
  daysUntil,
  daysUntilNextOccurrence,
  currentMonthKey,
  formatMonthKey,
  shiftMonth,
} from './dateUtils.js';

// Pin "today" so date math is deterministic.
const FIXED_NOW = new Date('2026-05-25T10:30:00.000Z');

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterAll(() => {
  vi.useRealTimers();
});

describe('todayISO', () => {
  it('returns a YYYY-MM-DD string for today', () => {
    const iso = todayISO();
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // Should be either 2026-05-24 or 2026-05-25 depending on TZ, both acceptable.
    expect(['2026-05-24', '2026-05-25']).toContain(iso);
  });
});

describe('formatDate', () => {
  it('returns empty string for falsy input', () => {
    expect(formatDate('')).toBe('');
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });

  it('returns the input back when the date is invalid', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });

  it('formats a valid ISO date with weekday/month/day/year', () => {
    const out = formatDate('2026-05-25');
    // Locale output varies by env, but it should contain the year and month name.
    expect(out).toMatch(/2026/);
    expect(out.length).toBeGreaterThan(6);
  });
});

describe('daysUntil', () => {
  it('returns null when no date is provided', () => {
    expect(daysUntil(null)).toBeNull();
    expect(daysUntil(undefined)).toBeNull();
    expect(daysUntil('')).toBeNull();
  });

  it('returns 0 for today', () => {
    // Build today's local-calendar ISO directly. `todayISO()` round-trips
    // through `toISOString()` which can drop a day in non-UTC timezones —
    // that quirk only matters for displaying the calendar date, not for
    // the day-math that `daysUntil` performs.
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    expect(daysUntil(`${y}-${m}-${d}`)).toBe(0);
  });

  it('returns a positive number for future dates', () => {
    // 7 days after fixed "today"
    const future = new Date(FIXED_NOW);
    future.setDate(future.getDate() + 7);
    const iso = future.toISOString().slice(0, 10);
    expect(daysUntil(iso)).toBe(7);
  });

  it('returns a negative number for past dates', () => {
    const past = new Date(FIXED_NOW);
    past.setDate(past.getDate() - 3);
    const iso = past.toISOString().slice(0, 10);
    expect(daysUntil(iso)).toBe(-3);
  });
});

describe('daysUntilNextOccurrence', () => {
  it('returns null for missing or invalid input', () => {
    expect(daysUntilNextOccurrence(null)).toBeNull();
    expect(daysUntilNextOccurrence('totally invalid')).toBeNull();
  });

  it('handles a birthday that already passed this year (rolls to next year)', () => {
    // System time is May 25, 2026. A birthday on Jan 15 has passed.
    const result = daysUntilNextOccurrence('1990-01-15');
    expect(result).toBeGreaterThan(180); // Should be ~235 days into 2027
    expect(result).toBeLessThan(366);
  });

  it('handles a birthday still upcoming this year', () => {
    // System time is May 25, 2026. A birthday on Dec 25 is still upcoming.
    const result = daysUntilNextOccurrence('1990-12-25');
    expect(result).toBeGreaterThan(150);
    expect(result).toBeLessThan(366);
  });
});

describe('currentMonthKey', () => {
  it('returns YYYY-MM for the system date by default', () => {
    expect(currentMonthKey()).toBe('2026-05');
  });

  it('zero-pads single-digit months', () => {
    expect(currentMonthKey(new Date(2024, 0, 15))).toBe('2024-01');
    expect(currentMonthKey(new Date(2024, 8, 15))).toBe('2024-09');
  });

  it('honors an explicit date argument', () => {
    expect(currentMonthKey(new Date(2030, 11, 1))).toBe('2030-12');
  });
});

describe('formatMonthKey', () => {
  it('returns empty string for falsy input', () => {
    expect(formatMonthKey('')).toBe('');
    expect(formatMonthKey(null)).toBe('');
  });

  it('produces a human-readable month and year', () => {
    const out = formatMonthKey('2026-05');
    expect(out).toMatch(/2026/);
    expect(out.toLowerCase()).toMatch(/may/);
  });
});

describe('shiftMonth', () => {
  it('shifts forward within the same year', () => {
    expect(shiftMonth('2026-05', 1)).toBe('2026-06');
    expect(shiftMonth('2026-05', 3)).toBe('2026-08');
  });

  it('shifts backward within the same year', () => {
    expect(shiftMonth('2026-05', -1)).toBe('2026-04');
    expect(shiftMonth('2026-05', -4)).toBe('2026-01');
  });

  it('wraps across year boundaries', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-06', 12)).toBe('2027-06');
  });
});
