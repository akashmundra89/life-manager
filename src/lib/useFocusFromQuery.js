import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Watches for `?focus=<id>` in the URL. When present, finds the DOM element
 * with `data-focus-id="<id>"`, scrolls it into view, and flashes a highlight
 * ring for about 1.8 seconds.
 *
 * Pages opt-in by rendering `data-focus-id={item.id}` on their card root.
 *
 * Designed to be called once at the App root so it works on every route.
 */
export default function useFocusFromQuery() {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const focusId = params.get('focus');
    if (!focusId) return;

    let cancelled = false;
    const start = Date.now();

    function flash(el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Use inline style for the ring so we don't depend on a specific
      // Tailwind class compile.
      const prev = el.style.cssText;
      el.style.transition = 'box-shadow 350ms ease, transform 350ms ease';
      el.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.55), 0 0 0 8px rgba(99, 102, 241, 0.18)';
      el.style.borderRadius = el.style.borderRadius || '1rem';
      setTimeout(() => {
        if (!cancelled) el.style.cssText = prev;
      }, 1800);
    }

    function tryFocus() {
      if (cancelled) return;
      const el = document.querySelector(`[data-focus-id="${CSS.escape(focusId)}"]`);
      if (el) { flash(el); return; }
      // The target page may still be lazy-loading. Poll briefly.
      if (Date.now() - start < 2500) {
        requestAnimationFrame(tryFocus);
      }
    }
    tryFocus();
    return () => { cancelled = true; };
  }, [location.search, location.pathname]);
}
