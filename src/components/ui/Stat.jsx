import { cx } from '../../lib/cx.js';

/**
 * KPI-style card for the dashboard stat strip.
 *   <Stat label="Overdue" value={2} tone="rose" icon={<AlertCircle/>} delta={{ kind: 'down', text: '+1 since Mon' }} />
 */
export default function Stat({ label, value, icon, tone = 'indigo', delta, className = '' }) {
  return (
    <div className={cx(
      'glass rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-glass-soft',
      'transition-all duration-200 ease-spring',
      'hover:-translate-y-0.5 hover:shadow-glass glass-hover',
      className,
    )}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</div>
      <div className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mt-1.5">{value}</div>
      {delta && (
        <span className={cx(
          'inline-flex items-center gap-1 mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full',
          deltaClass(delta.kind),
        )}>
          {delta.icon}
          {delta.text}
        </span>
      )}
      {icon && (
        <div className={cx(
          'absolute top-3 right-3 grid place-items-center rounded-xl w-8 h-8',
          toneClass(tone),
        )}>
          {icon}
        </div>
      )}
    </div>
  );
}

function toneClass(tone) {
  const map = {
    indigo: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300',
    sky:    'bg-sky-500/15 text-sky-700 dark:text-sky-300',
    emerald:'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    amber:  'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    rose:   'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    violet: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
    brand:  'bg-brand-500/15 text-brand-700 dark:text-brand-300',
  };
  return map[tone] ?? map.indigo;
}

function deltaClass(kind) {
  if (kind === 'up')   return 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15';
  if (kind === 'down') return 'text-rose-700 dark:text-rose-300 bg-rose-500/15';
  return 'text-ink-faint bg-surface-strong/60';
}
