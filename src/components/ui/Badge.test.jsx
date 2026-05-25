import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge, { badgeForDays, labelForDays } from './Badge.jsx';

describe('Badge component', () => {
  it('renders children text', () => {
    render(<Badge>Hello</Badge>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('applies the default slate tone classes when no tone is supplied', () => {
    render(<Badge>Default</Badge>);
    const el = screen.getByText('Default');
    expect(el.className).toMatch(/text-ink-muted/);
  });

  it('applies tone-specific classes', () => {
    render(<Badge tone="rose">Rose</Badge>);
    const el = screen.getByText('Rose');
    expect(el.className).toMatch(/rose/);
  });

  it('falls back to slate when an unknown tone is supplied', () => {
    render(<Badge tone="not-a-real-tone">X</Badge>);
    const el = screen.getByText('X');
    expect(el.className).toMatch(/text-ink-muted/);
  });

  it('shrinks padding/text for size="sm"', () => {
    render(<Badge size="sm">Tiny</Badge>);
    const el = screen.getByText('Tiny');
    expect(el.className).toMatch(/text-\[10px\]/);
  });
});

describe('badgeForDays', () => {
  it('returns slate for null and negative numbers', () => {
    expect(badgeForDays(null)).toBe('slate');
    expect(badgeForDays(undefined)).toBe('slate');
    expect(badgeForDays(-5)).toBe('slate');
  });

  it('returns rose for today (0)', () => {
    expect(badgeForDays(0)).toBe('rose');
  });

  it('returns amber for soon (1–3 days)', () => {
    expect(badgeForDays(1)).toBe('amber');
    expect(badgeForDays(2)).toBe('amber');
    expect(badgeForDays(3)).toBe('amber');
  });

  it('returns emerald for everything further out', () => {
    expect(badgeForDays(4)).toBe('emerald');
    expect(badgeForDays(30)).toBe('emerald');
  });
});

describe('labelForDays', () => {
  it('handles null/undefined', () => {
    expect(labelForDays(null)).toBe('—');
    expect(labelForDays(undefined)).toBe('—');
  });

  it('returns "past" for negative numbers', () => {
    expect(labelForDays(-1)).toBe('past');
    expect(labelForDays(-100)).toBe('past');
  });

  it('returns "today" / "tomorrow" for 0 / 1', () => {
    expect(labelForDays(0)).toBe('today');
    expect(labelForDays(1)).toBe('tomorrow');
  });

  it('returns "in Nd" for anything farther out', () => {
    expect(labelForDays(2)).toBe('in 2d');
    expect(labelForDays(42)).toBe('in 42d');
  });
});
