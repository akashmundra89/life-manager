import { forwardRef } from 'react';
import { cx } from '../../lib/cx.js';

const baseField = 'w-full h-10 px-3.5 rounded-xl text-sm text-ink bg-surface-strong/60 border border-edge/10 placeholder:text-ink-faint outline-none transition-colors focus:border-brand-500/60 focus:bg-surface-strong/80 focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50';

export const Input = forwardRef(function Input({ className = '', leadingIcon, trailingIcon, ...rest }, ref) {
  if (leadingIcon || trailingIcon) {
    return (
      <div className={cx('relative', className)}>
        {leadingIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none">{leadingIcon}</div>
        )}
        <input
          ref={ref}
          className={cx(baseField, leadingIcon && 'pl-9', trailingIcon && 'pr-9')}
          {...rest}
        />
        {trailingIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint">{trailingIcon}</div>
        )}
      </div>
    );
  }
  return <input ref={ref} className={cx(baseField, className)} {...rest} />;
});

export const Select = forwardRef(function Select({ className = '', children, ...rest }, ref) {
  return (
    <select
      ref={ref}
      className={cx(
        baseField,
        'appearance-none bg-[length:16px] bg-no-repeat pr-9',
        // chevron-down SVG as data URI (works in light + dark via CSS filter)
        'bg-[url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2364748b%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27><polyline points=%276 9 12 15 18 9%27/></svg>")]',
        'bg-[right_0.75rem_center]',
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
});

export const Textarea = forwardRef(function Textarea({ className = '', rows = 3, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cx(
        baseField,
        'h-auto py-2.5 resize-y min-h-[80px]',
        className,
      )}
      {...rest}
    />
  );
});

export const Label = ({ className = '', children, ...rest }) => (
  <label className={cx('block text-xs font-semibold text-ink-muted mb-1.5', className)} {...rest}>
    {children}
  </label>
);
