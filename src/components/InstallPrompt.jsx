import { useEffect, useState } from 'react';

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);   // Android/Chrome deferred prompt
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('pwa-install-dismissed') === 'true'
  );

  useEffect(() => {
    // Already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (navigator.standalone) return; // iOS standalone

    // Android / Chrome — capture the browser's install prompt
    const handler = (e) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS Safari doesn't fire beforeinstallprompt — detect manually
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !('MSStream' in window);
    setIsIOS(ios);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function dismiss() {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setDismissed(true);
  }

  async function install() {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') dismiss();
    setPrompt(null);
  }

  if (dismissed) return null;
  if (!prompt && !isIOS) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-fade-in">
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <img src="/icon-192.png" alt="" className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">Add to Home Screen</div>
            {isIOS && !prompt ? (
              <p className="text-xs text-slate-300 mt-0.5">
                Tap the <strong>Share</strong> button in Safari, then{' '}
                <strong>Add to Home Screen</strong>.
              </p>
            ) : (
              <p className="text-xs text-slate-300 mt-0.5">
                Install for one-tap access and offline support.
              </p>
            )}
          </div>
          <button
            onClick={dismiss}
            className="text-slate-400 hover:text-white transition-colors p-0.5 shrink-0"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {prompt && (
          <button
            onClick={install}
            className="mt-3 w-full py-2 bg-brand-500 hover:bg-brand-600 rounded-xl text-sm font-medium transition-colors"
          >
            Install app
          </button>
        )}
      </div>
    </div>
  );
}
