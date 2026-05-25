import { describe, it, expect } from 'vitest';
import { cx } from './cx.js';

describe('cx', () => {
  it('joins string args with spaces', () => {
    expect(cx('a', 'b', 'c')).toBe('a b c');
  });

  it('drops falsy values', () => {
    expect(cx('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('flattens arrays recursively', () => {
    expect(cx(['a', ['b', ['c']]], 'd')).toBe('a b c d');
  });

  it('reads truthy keys from object args', () => {
    expect(cx('a', { hidden: false, active: true, disabled: 1 })).toBe('a active disabled');
  });

  it('coerces numbers to strings', () => {
    expect(cx('rank', 1, 2)).toBe('rank 1 2');
  });

  it('returns an empty string when given nothing', () => {
    expect(cx()).toBe('');
    expect(cx(null, undefined, false)).toBe('');
  });
});
