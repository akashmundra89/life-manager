import { useCallback, useEffect, useState } from 'react';

/**
 * A tiny data layer that mimics what Supabase will give us later.
 * Reads/writes a list of records to localStorage under a namespaced key.
 *
 * When we swap to Supabase, replace the internals with calls to
 * supabase.from(table).select/insert/update/delete and keep the same
 * shape: { items, add, update, remove, replaceAll, loading }.
 */
export default function useLocalCollection(key, seed = []) {
  const storageKey = `life-manager:${key}`;
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to read localStorage for', storageKey, e);
    }
    return seed;
  });
  const [loading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to write localStorage for', storageKey, e);
    }
  }, [storageKey, items]);

  const add = useCallback((record) => {
    const withId = {
      id: record.id ?? crypto.randomUUID(),
      created_at: record.created_at ?? new Date().toISOString(),
      ...record,
    };
    setItems((prev) => [withId, ...prev]);
    return withId;
  }, []);

  const update = useCallback((id, patch) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it))
    );
  }, []);

  const remove = useCallback((id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const replaceAll = useCallback((nextItems) => {
    setItems(nextItems);
  }, []);

  return { items, add, update, remove, replaceAll, loading };
}
