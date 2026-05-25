import { describe, it, expect, beforeEach } from 'vitest';
import { idbGet, idbSet } from './idb.js';

// `fake-indexeddb/auto` is pulled in by vitest.setup.js, so `indexedDB` is
// already a working in-memory polyfill in the test environment.

describe('idb get/set', () => {
  beforeEach(async () => {
    // Wipe any data that lingered between tests by overwriting known keys.
    // (fake-indexeddb persists for the process, so we explicitly reset.)
    await idbSet('life-manager:test', null);
    await idbSet('life-manager:other', null);
  });

  it('returns null when no value has been written', async () => {
    expect(await idbGet('life-manager:never-written')).toBeNull();
  });

  it('round-trips an array value', async () => {
    const payload = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];
    await idbSet('life-manager:test', payload);
    expect(await idbGet('life-manager:test')).toEqual(payload);
  });

  it('overwrites the previous value on subsequent set', async () => {
    await idbSet('life-manager:test', [1, 2, 3]);
    await idbSet('life-manager:test', [9]);
    expect(await idbGet('life-manager:test')).toEqual([9]);
  });

  it('isolates values per key', async () => {
    await idbSet('life-manager:test', ['a']);
    await idbSet('life-manager:other', ['b']);
    expect(await idbGet('life-manager:test')).toEqual(['a']);
    expect(await idbGet('life-manager:other')).toEqual(['b']);
  });

  it('handles objects with nested data', async () => {
    const payload = { user: { id: 1, prefs: { theme: 'dark' } } };
    await idbSet('life-manager:test', payload);
    const got = await idbGet('life-manager:test');
    expect(got.user.prefs.theme).toBe('dark');
  });
});
