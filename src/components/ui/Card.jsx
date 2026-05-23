import { Link } from 'react-router-dom';
import { cx } from '../../lib/cx.js';

/**
 * Glassmorphism card. Pass `to` to make it a router link (with hover lift).
 * Variants: 'glass' (default) | 'soft' (lighter) | 'strong' (more opaque)
 */
export default function Card({
  to,
  href,
  variant = 'glass',
  padded = true,
  className = '',
  hover = true,
  children,
  ...rest
}) {
  const variantClass =
    variant === 'soft' ? 'glass-soft' : variant === 'strong' ? 'glass-strong' : 'glass';

  const base = cx(
    variantClass,
    'rounded-2xl shadow-glass-soft',
    'transition-all duration-200 ease-spring',
    padded && 'p-4 sm:p-5',
    hover && 'glass-hover hover:shadow-glass hover:-translate-y-0.5',
    className,
  );

  if (to) {
    return (
      <Link to={to} className={cx(base, 'block')} {...rest}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cx(base, 'block')} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <div className={base} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ icon, iconTone = 'indigo', title, subtitle, action, className = '' }) {
  return (
    <div className={cx('flex items-center gap-3 mb-3', className)}>
      {icon && (
        <div className={cx('grid place-items-center rounded-xl w-8 h-8 shrink-0', iconToneClass(iconTone))}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-ink truncate">{title}</div>
        {subtitle && <div className="text-[11px] text-ink-faint truncate">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

function iconToneClass(tone) {
  // Soft tinted background + dark-mode aware text.
  const map = {
    indigo: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300',
    sky:    'bg-sky-500/15 text-sky-700 dark:text-sky-300',
    emerald:'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    amber:  'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    rose:   'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    violet: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
    slate:  'bg-slate-500/15 text-slate-700 dark:text-slate-300',
    brand:  'bg-brand-500/15 text-brand-700 dark:text-brand-300',
  };
  return map[tone] ?? map.indigo;
}
