import { useEffect } from 'react';
import { cx } from '../../lib/cx.js';
import { X } from 'lucide-react';

/**
 * Lightweight glass modal with focus trap + ESC close. No external deps.
 */
export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 animate-fade-in" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cx(
        'relative w-full glass-strong rounded-3xl shadow-glass p-5 sm:p-6 animate-pop-in',
        sizes[size] ?? sizes.md,
      )}>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            <button
              onClick={onClose}
              className="grid place-items-center w-8 h-8 rounded-lg text-ink-faint hover:text-ink hover:bg-surface-strong/60"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div>{children}</div>
        {footer && <div className="mt-5 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
