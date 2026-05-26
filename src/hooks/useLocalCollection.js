import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { idbGet, idbSet } from '../lib/idb';

// Collection keys that differ from their Supabase table names
const TABLE_MAP = {
  keyDates: 'key_dates',
  vacationPlans: 'vacation_plans',
  placesVisited: 'places_visited',
};
const toTable = (key) => TABLE_MAP[key] ?? key;

// ── localStorage fallback (no Supabase configured) ───────────────────────────
function useLocalStorageImpl(key, seed) {
  const storageKey = `life-manager:${key}`;
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return seed;
  });

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(items)); }
    catch { /* ignore */ }
  }, [storageKey, items]);

  const add = useCallback((record) => {
    const item = {
      id: record.id ?? crypto.randomUUID(),
      created_at: record.created_at ?? new Date().toISOString(),
      ...record,
    };
    setItems((p) => [item, ...p]);
    return item;
  }, []);

  const update = useCallback((id, patch) => {
    setItems((p) => p.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const remove = useCallback((id) => {
    setItems((p) => p.filter((it) => it.id !== id));
  }, []);

  const replaceAll = useCallback((next) => setItems(next), []);

  return { items, add, update, remove, replaceAll, loading: false };
}

// ── IndexedDB (guest / browse-without-login mode) ────────────────────────────
function useIndexedDBImpl(key, seed, enabled) {
  const storageKey = `life-manager:${key}`;
  const [items, setItems] = useState(seed);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    setLoading(true);
    idbGet(storageKey)
      .then((data) => { if (Array.isArray(data)) setItems(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [storageKey, enabled]);

  useEffect(() => {
    if (!enabled || loading) return;
    idbSet(storageKey, items).catch(console.error);
  }, [storageKey, items, loading, enabled]);

  const add = useCallback((record) => {
    const item = {
      id: record.id ?? crypto.randomUUID(),
      created_at: record.created_at ?? new Date().toISOString(),
      ...record,
    };
    setItems((p) => [item, ...p]);
    return item;
  }, []);

  const update = useCallback((id, patch) => {
    setItems((p) => p.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const remove = useCallback((id) => {
    setItems((p) => p.filter((it) => it.id !== id));
  }, []);

  const replaceAll = useCallback((next) => setItems(next), []);

  return { items, add, update, remove, replaceAll, loading };
}

// ── Supabase implementation (authenticated) ───────────────────────────────────
function useSupabaseImpl(key, user) {
  const table = toTable(key);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    supabase
      .from(table)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('[supabase] fetch', table, error);
        else setItems(data ?? []);
        setLoading(false);
      });

    const channel = supabase
      .channel(`${table}:${user.id}:${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `user_id=eq.${user.id}` },
        ({ eventType, new: n, old: o }) => {
          setItems((p) => {
            if (eventType === 'INSERT') return p.some((it) => it.id === n.id) ? p : [n, ...p];
            if (eventType === 'UPDATE') return p.map((it) => (it.id === n.id ? n : it));
            if (eventType === 'DELETE') return p.filter((it) => it.id !== o.id);
            return p;
          });
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [table, user?.id]);

  const add = useCallback((record) => {
    if (!user) return record;
    const item = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...record,
      user_id: user.id,
    };
    setItems((p) => [item, ...p]);
    supabase.from(table).insert(item).then(({ error }) => {
      if (error) {
        console.error('[supabase] insert', table, error);
        setItems((p) => p.filter((it) => it.id !== item.id));
      }
    });
    return item;
  }, [table, user?.id]);

  const update = useCallback((id, patch) => {
    if (!user) return;
    setItems((p) => p.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    supabase.from(table).update(patch).eq('id', id).eq('user_id', user.id)
      .then(({ error }) => { if (error) console.error('[supabase] update', table, error); });
  }, [table, user?.id]);

  const remove = useCallback((id) => {
    if (!user) return;
    setItems((p) => p.filter((it) => it.id !== id));
    supabase.from(table).delete().eq('id', id).eq('user_id', user.id)
      .then(({ error }) => { if (error) console.error('[supabase] delete', table, error); });
  }, [table, user?.id]);

  const replaceAll = useCallback((next) => {
    if (!user) return;
    setItems(next);
    supabase.from(table).delete().eq('user_id', user.id).then(() => {
      if (next.length === 0) return;
      const rows = next.map(({ user_id: _uid, ...rest }) => ({
        id: rest.id ?? crypto.randomUUID(),
        created_at: rest.created_at ?? new Date().toISOString(),
        ...rest,
        user_id: user.id,
      }));
      supabase.from(table).insert(rows)
        .then(({ error }) => { if (error) console.error('[supabase] replaceAll', table, error); });
    });
  }, [table, user?.id]);

  return { items, add, update, remove, replaceAll, loading };
}

// ── Public hook ───────────────────────────────────────────────────────────────
export default function useLocalCollection(key, seed = []) {
  const auth = useAuth();
  const guestMode = auth?.guestMode ?? false;
  const user = auth?.user ?? null;

  // All three hooks are always called to satisfy React's rules of hooks.
  // Only the result matching the active storage backend is returned.
  const local = useLocalStorageImpl(key, seed);
  const idb = useIndexedDBImpl(key, seed, isSupabaseConfigured && guestMode);
  const db = useSupabaseImpl(key, isSupabaseConfigured && !guestMode ? user : null);

  if (!isSupabaseConfigured) return local;
  if (guestMode) return idb;
  return db;
}
