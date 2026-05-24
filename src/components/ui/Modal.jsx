import { useEffect } from 'react';
import { cx } from '../../lib/cx.js';
import { X } from 'lucide-react';

/**
 * Glass modal with focus trap (ESC close) and a strong dim+blur backdrop so the
 * page underneath doesn't bleed through. Panel uses a near-opaque surface
 * (95% in both themes) layered over a backdrop-blur so it still feels glassy
 * without losing legibility against the dashboard's busy ambient bg.
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
      {/* Backdrop — strong dim + blur so the dashboard doesn't show through */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
        onClick={onClose}
      />
      {/* Panel — near-opaque surface, light + dark variants, subtle border + shadow */}
      <div
        className={cx(
          'relative w-full rounded-3xl p-5 sm:p-6 animate-pop-in',
          'bg-white/95 dark:bg-slate-900/95',
          'backdrop-blur-2xl',
          'ring-1 ring-edge/10 dark:ring-white/10',
          'shadow-[0_30px_60px_-20px_rgb(15_23_42/0.45)]',
          sizes[size] ?? sizes.md,
        )}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            <button
              onClick={onClose}
              className="grid place-items-center w-8 h-8 rounded-lg text-ink-faint hover:text-ink hover:bg-surface-strong/60 transition-colors"
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
