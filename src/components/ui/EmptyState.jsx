import { cx } from '../../lib/cx.js';

/**
 * Replaces the old EmptyState. Now supports an icon and an optional action.
 *   <EmptyState icon={<Sparkles/>} title="Nothing yet" hint="Add your first item." action={<Button>Add</Button>} />
 */
export default function EmptyState({ icon, title, hint, action, className = '' }) {
  return (
    <div className={cx(
      'glass-soft rounded-2xl p-8 text-center flex flex-col items-center gap-3',
      className,
    )}>
      {icon && (
        <div className="grid place-items-center w-12 h-12 rounded-2xl bg-grad-brand-soft text-brand-600 dark:text-brand-300">
          {icon}
        </div>
      )}
      {title && <div className="text-sm font-semibold text-ink">{title}</div>}
      {hint && <div className="text-xs text-ink-faint max-w-sm">{hint}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
