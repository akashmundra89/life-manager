import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// Force Supabase to "not configured" so useLocalCollection uses the
// localStorage backend (the path most users hit in dev/preview).
vi.mock('../lib/supabase.js', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

// Provide a stable AuthContext value — useLocalCollection only reads
// `guestMode` and `user` from it, both of which default to falsy here.
vi.mock('../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({ user: null, guestMode: false }),
}));

import useLocalCollection from './useLocalCollection.js';

const STORAGE_PREFIX = 'life-manager:';

describe('useLocalCollection — localStorage backend', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('seeds from the provided default when storage is empty', () => {
    const seed = [{ id: 'a', title: 'Seeded' }];
    const { result } = renderHook(() => useLocalCollection('events', seed));

    expect(result.current.loading).toBe(false);
    expect(result.current.items).toEqual(seed);
  });

  it('reads prior data from localStorage on mount', () => {
    const stored = [{ id: 'x', title: 'Already here' }];
    localStorage.setItem(`${STORAGE_PREFIX}grocery`, JSON.stringify(stored));

    const { result } = renderHook(() => useLocalCollection('grocery', []));
    expect(result.current.items).toEqual(stored);
  });

  it('add() prepends a new record with auto-generated id and created_at', () => {
    const { result } = renderHook(() => useLocalCollection('events', []));

    let returned;
    act(() => {
      returned = result.current.add({ title: 'Hello' });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({ title: 'Hello' });
    expect(result.current.items[0].id).toBeTruthy();
    expect(result.current.items[0].created_at).toBeTruthy();
    // add() returns the inserted item
    expect(returned.id).toBe(result.current.items[0].id);
  });

  it('add() preserves an explicit id and created_at if provided', () => {
    const { result } = renderHook(() => useLocalCollection('events', []));

    act(() => {
      result.current.add({ id: 'my-id', created_at: '2026-01-01', title: 'T' });
    });

    expect(result.current.items[0]).toMatchObject({
      id: 'my-id',
      created_at: '2026-01-01',
      title: 'T',
    });
  });

  it('add() places newest items first', () => {
    const { result } = renderHook(() => useLocalCollection('events', []));

    act(() => { result.current.add({ title: 'First' }); });
    act(() => { result.current.add({ title: 'Second' }); });

    expect(result.current.items.map((i) => i.title)).toEqual(['Second', 'First']);
  });

  it('update() merges the patch into the matching record only', () => {
    const { result } = renderHook(() => useLocalCollection('events', []));

    let inserted;
    act(() => {
      inserted = result.current.add({ title: 'Old', done: false });
      result.current.add({ title: 'Other', done: false });
    });

    act(() => {
      result.current.update(inserted.id, { done: true, title: 'New' });
    });

    const updated = result.current.items.find((i) => i.id === inserted.id);
    expect(updated).toMatchObject({ title: 'New', done: true });
    // Sibling item should still have done: false
    expect(result.current.items.find((i) => i.id !== inserted.id).done).toBe(false);
  });

  it('update() is a no-op when id does not match', () => {
    const { result } = renderHook(() => useLocalCollection('events', []));
    act(() => { result.current.add({ title: 'A' }); });
    const snapshot = result.current.items;

    act(() => { result.current.update('does-not-exist', { title: 'X' }); });

    expect(result.current.items).toEqual(snapshot);
  });

  it('remove() drops the matching record', () => {
    const { result } = renderHook(() => useLocalCollection('events', []));

    let kept;
    act(() => {
      result.current.add({ title: 'Drop me' });
      kept = result.current.add({ title: 'Keep me' });
    });
    const dropId = result.current.items.find((i) => i.title === 'Drop me').id;

    act(() => { result.current.remove(dropId); });

    expect(result.current.items.map((i) => i.id)).toEqual([kept.id]);
  });

  it('replaceAll() swaps the entire collection', () => {
    const { result } = renderHook(() => useLocalCollection('events', []));

    act(() => { result.current.add({ title: 'will go' }); });
    const next = [
      { id: '1', title: 'A' },
      { id: '2', title: 'B' },
    ];

    act(() => { result.current.replaceAll(next); });

    expect(result.current.items).toEqual(next);
  });

  it('writes through to localStorage after each mutation', () => {
    const { result } = renderHook(() => useLocalCollection('events', []));

    act(() => { result.current.add({ id: 'p', title: 'Persisted' }); });

    const raw = localStorage.getItem(`${STORAGE_PREFIX}events`);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw);
    expect(parsed[0]).toMatchObject({ id: 'p', title: 'Persisted' });
  });

  it('survives unmount + remount: state is rehydrated from storage', () => {
    const first = renderHook(() => useLocalCollection('events', []));
    act(() => { first.result.current.add({ id: 'r', title: 'Rehydrated' }); });
    first.unmount();

    const second = renderHook(() => useLocalCollection('events', []));
    expect(second.result.current.items.find((i) => i.id === 'r')).toBeTruthy();
  });

  it('ignores malformed JSON in storage and falls back to the seed', () => {
    localStorage.setItem(`${STORAGE_PREFIX}events`, '{not json');
    const seed = [{ id: 's', title: 'seed' }];
    const { result } = renderHook(() => useLocalCollection('events', seed));
    expect(result.current.items).toEqual(seed);
  });

  it('keeps separate storage for separate collection names', () => {
    const a = renderHook(() => useLocalCollection('events', []));
    const b = renderHook(() => useLocalCollection('grocery', []));

    act(() => { a.result.current.add({ id: 'ev', title: 'event' }); });
    act(() => { b.result.current.add({ id: 'gr', title: 'grocery' }); });

    expect(a.result.current.items.map((i) => i.id)).toEqual(['ev']);
    expect(b.result.current.items.map((i) => i.id)).toEqual(['gr']);
  });
});
