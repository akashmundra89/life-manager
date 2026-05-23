import { cx } from '../lib/cx.js';

export default function PageHeader({ title, subtitle, action, icon, className = '' }) {
  return (
    <div className={cx(
      'flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6',
      'animate-fade-up',
      className,
    )}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="grid place-items-center w-11 h-11 rounded-2xl bg-grad-brand text-white shadow-glow-brand shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-ink truncate">
            {title}
          </h1>
          {subtitle && <p className="text-sm text-ink-faint mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
