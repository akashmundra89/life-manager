import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CornerDownLeft, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from './ui/Input.jsx';
import useGlobalSearch from '../hooks/useGlobalSearch.js';
import { cx } from '../lib/cx.js';

/**
 * Inline search input + floating results dropdown.
 *
 * Lives in the sidebar. Cmd/Ctrl+K from anywhere focuses the input
 * (handled in App.jsx — we just expose an element with id="global-search-input").
 *
 * Props:
 *   onResultClick — optional callback fired after navigation (e.g. to close
 *                   the mobile sidebar drawer).
 */
export default function GlobalSearch({ onResultClick }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Only run the (potentially heavy) global search subscription when the
  // search UI is actually engaged.
  const active = focused && query.trim().length > 0;
  const { groups, total, loading } = useGlobalSearch(active ? query : '');

  // Flattened result list for arrow-key navigation.
  const flat = useMemo(
    () => groups.flatMap((g) => g.items.map((it) => ({ ...it, group: g }))),
    [groups],
  );

  // Reset highlighted row whenever the result set changes.
  useEffect(() => { setActiveIndex(0); }, [query]);

  // Close the dropdown when the user clicks outside.
  useEffect(() => {
    if (!focused) return;
    function onDocClick(e) {
      if (!containerRef.current?.contains(e.target)) setFocused(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [focused]);

  const goToResult = useCallback((row) => {
    if (!row) return;
    const url = `${row.group.route}?focus=${encodeURIComponent(row.id)}`;
    navigate(url);
    setQuery('');
    setFocused(false);
    inputRef.current?.blur();
    onResultClick?.();
  }, [navigate, onResultClick]);

  function onKeyDown(e) {
    if (!active || flat.length === 0) {
      if (e.key === 'Escape') {
        setQuery('');
        setFocused(false);
        inputRef.current?.blur();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % flat.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + flat.length) % flat.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      goToResult(flat[activeIndex]);
    } else if (e.key === 'Escape') {
      setQuery('');
      setFocused(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        id="global-search-input"
        type="search"
        placeholder="Search…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={onKeyDown}
        leadingIcon={<Search className="w-4 h-4" />}
        trailingIcon={
          <kbd className="hidden md:inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-surface-strong/70 text-ink-faint border border-edge/10">
            ⌘K
          </kbd>
        }
        autoComplete="off"
      />

      {active && (
        <div className={cx(
          'absolute z-40 left-0 top-full mt-2',
          // Wide enough to be readable; on mobile the sidebar is fixed-width,
          // so it just spans the sidebar. On lg+, overlap into main content.
          'w-[min(28rem,calc(100vw-2rem))] lg:w-[28rem]',
          'rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl',
          'ring-1 ring-edge/10 dark:ring-white/10',
          'shadow-[0_20px_50px_-15px_rgb(15_23_42/0.5)]',
          'overflow-hidden animate-pop-in',
        )}>
          {flat.length === 0 ? (
            <div className="p-4 text-sm text-ink-faint">
              {loading ? 'Searching…' : `No matches for "${query}"`}
            </div>
          ) : (
            <>
              <div className="max-h-[60vh] overflow-y-auto">
                {(() => {
                  let cursor = 0;
                  return groups.map((g) => (
                    <div key={g.key}>
                      <div className="sticky top-0 px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-faint bg-white/95 dark:bg-slate-900/95 border-b border-edge/10">
                        {g.label}
                      </div>
                      <ul>
                        {g.items.map((row) => {
                          const idx = cursor++;
                          const isActive = idx === activeIndex;
                          return (
                            <li key={`${g.key}:${row.id}`}>
                              <button
                                type="button"
                                onMouseDown={(e) => {
                                  // Prevent input blur before navigate runs
                                  e.preventDefault();
                                }}
                                onMouseEnter={() => setActiveIndex(idx)}
                                onClick={() => goToResult({ ...row, group: g })}
                                className={cx(
                                  'w-full text-left px-3 py-2 transition-colors',
                                  isActive ? 'bg-grad-brand-soft' : 'hover:bg-surface-strong/60',
                                )}
                              >
                                <div className="text-sm font-medium text-ink truncate">
                                  {row.title}
                                </div>
                                {row.subtitle && (
                                  <div className="text-[11px] text-ink-faint truncate">{row.subtitle}</div>
                                )}
                                {row.snippet && row.snippet !== row.title && (
                                  <div className="text-xs text-ink-muted truncate mt-0.5">{row.snippet}</div>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ));
                })()}
              </div>
              <div className="flex items-center justify-between px-3 py-2 border-t border-edge/10 text-[10.5px] text-ink-faint bg-surface-strong/30">
                <span>{total} result{total === 1 ? '' : 's'}</span>
                <span className="hidden sm:inline-flex items-center gap-2">
                  <span className="inline-flex items-center gap-1"><ArrowUp className="w-3 h-3" /><ArrowDown className="w-3 h-3" /> navigate</span>
                  <span className="inline-flex items-center gap-1"><CornerDownLeft className="w-3 h-3" /> open</span>
                  <span>esc to close</span>
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
