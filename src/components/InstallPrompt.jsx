import { useEffect, useState } from 'react';
import { X, Download, Share } from 'lucide-react';

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('pwa-install-dismissed') === 'true'
  );

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (navigator.standalone) return;

    const handler = (e) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);

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
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-fade-up">
      <div className="glass-strong rounded-2xl p-4 shadow-glass border border-edge/10">
        <div className="flex items-start gap-3">
          <img src="/icon-192.png" alt="" className="w-10 h-10 rounded-xl shrink-0 shadow-glow-brand" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-ink">Add to home screen</div>
            {isIOS && !prompt ? (
              <p className="text-xs text-ink-faint mt-0.5 inline-flex items-center gap-1 flex-wrap">
                Tap <Share className="w-3 h-3 inline" /> <strong className="text-ink">Share</strong>, then{' '}
                <strong className="text-ink">Add to Home Screen</strong>.
              </p>
            ) : (
              <p className="text-xs text-ink-faint mt-0.5">
                Install for one-tap access and offline support.
              </p>
            )}
          </div>
          <button
            onClick={dismiss}
            className="text-ink-faint hover:text-ink transition-colors p-1 rounded-lg hover:bg-surface-strong/60 shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {prompt && (
          <button
            onClick={install}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 bg-grad-brand text-white rounded-xl text-sm font-semibold shadow-glow-brand hover:brightness-110 transition-all"
          >
            <Download className="w-4 h-4" /> Install app
          </button>
        )}
      </div>
    </div>
  );
}
