import { cx } from '../../lib/cx.js';

/**
 * Pill-style label. Used for status (urgent / today / soon / done) and tags.
 * Tones map to semantic colors; pass `tone="auto"` with `days` to auto-pick.
 */
export default function Badge({ children, tone = 'slate', className = '', size = 'md' }) {
  return (
    <span className={cx(
      'inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap',
      size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-[11px] px-2.5 py-0.5',
      toneClass(tone),
      className,
    )}>
      {children}
    </span>
  );
}

/** Pick a tone from a "days until" number. */
export function badgeForDays(d) {
  if (d == null) return 'slate';
  if (d < 0)     return 'slate';
  if (d === 0)   return 'rose';
  if (d <= 3)    return 'amber';
  return 'emerald';
}

/** Human label for a "days until" number. */
export function labelForDays(d) {
  if (d == null) return '—';
  if (d < 0) return 'past';
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  return `in ${d}d`;
}

function toneClass(tone) {
  const map = {
    slate:   'bg-surface-strong/70 text-ink-muted',
    rose:    'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    amber:   'bg-amber-500/15 text-amber-800 dark:text-amber-300',
    emerald: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    sky:     'bg-sky-500/15 text-sky-700 dark:text-sky-300',
    violet:  'bg-violet-500/20 text-violet-700 dark:text-violet-300',
    indigo:  'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
    brand:   'bg-brand-500/15 text-brand-700 dark:text-brand-300',
  };
  return map[tone] ?? map.slate;
}
