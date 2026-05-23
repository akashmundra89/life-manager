import { cx } from '../../lib/cx.js';

/**
 * Variants: primary (gradient), secondary (glass), ghost (transparent), danger.
 * Sizes: sm | md | lg.
 */
export default function Button({
  as: Tag = 'button',
  variant = 'secondary',
  size = 'md',
  iconOnly = false,
  className = '',
  children,
  ...rest
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 ease-spring focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';

  const sizes = {
    sm: iconOnly ? 'w-8 h-8 text-sm' : 'h-8 px-3 text-xs',
    md: iconOnly ? 'w-10 h-10 text-base' : 'h-10 px-4 text-sm',
    lg: iconOnly ? 'w-12 h-12 text-lg' : 'h-12 px-5 text-base',
  };

  const variants = {
    primary:
      'bg-grad-brand text-white shadow-glow-brand hover:shadow-lg hover:brightness-110',
    secondary:
      'glass glass-hover text-ink hover:shadow-glass-soft',
    ghost:
      'text-ink-muted hover:bg-surface-strong/60 hover:text-ink',
    danger:
      'bg-rose-500/15 text-rose-700 dark:text-rose-300 hover:bg-rose-500/25 border border-rose-500/20',
    success:
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/20',
  };

  return (
    <Tag className={cx(base, sizes[size], variants[variant], className)} {...rest}>
      {children}
    </Tag>
  );
}
