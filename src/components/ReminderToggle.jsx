import { useEffect, useState } from 'react';
import { Bell, BellOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, Button } from './ui';
import {
  isPushSupported,
  getRemindersState,
  enableReminders,
  disableReminders,
} from '../lib/pushNotifications.js';
import { isSupabaseConfigured } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

/**
 * Small card the user drops on the Dashboard. Asks for permission and
 * subscribes the current device to the daily reminders Edge Function.
 *
 * It's safe to render this even when Supabase isn't configured or the user
 * isn't signed in — the card will explain why reminders aren't available.
 */
export default function ReminderToggle({ className = '' }) {
  const auth = useAuth();
  const supported = isPushSupported();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState({ active: false, permission: 'default' });
  const [error, setError] = useState(null);

  const signedIn = !!auth?.user;
  const canEnable = supported && isSupabaseConfigured && signedIn;

  useEffect(() => {
    let cancelled = false;
    if (!supported) { setLoading(false); return; }
    getRemindersState()
      .then((s) => { if (!cancelled) setState(s); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [supported]);

  async function toggle() {
    setError(null);
    setBusy(true);
    try {
      if (state.active) {
        await disableReminders();
        setState({ active: false, permission: 'granted' });
      } else {
        await enableReminders();
        setState({ active: true, permission: 'granted' });
      }
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <Card className={className}>
        <div className="flex items-center gap-3">
          <div className="grid place-items-center w-10 h-10 rounded-xl bg-surface-strong/60 text-ink-faint">
            <BellOff className="w-5 h-5" />
          </div>
          <div className="text-sm text-ink-muted">
            Push reminders aren't supported in this browser.
            Install the app to your home screen and try again.
          </div>
        </div>
      </Card>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <Card className={className}>
        <div className="flex items-center gap-3">
          <BellOff className="w-5 h-5 text-ink-faint" />
          <div className="text-sm text-ink-muted">
            Reminders need cloud sync. Configure Supabase to turn them on.
          </div>
        </div>
      </Card>
    );
  }

  if (!signedIn) {
    return (
      <Card className={className}>
        <div className="flex items-center gap-3">
          <BellOff className="w-5 h-5 text-ink-faint" />
          <div className="text-sm text-ink-muted">
            Sign in to enable daily reminders on this device.
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="flex items-center gap-3">
        <div className={`grid place-items-center w-10 h-10 rounded-xl ${
          state.active ? 'bg-emerald-500/15 text-emerald-600' : 'bg-brand-500/15 text-brand-600'
        }`}>
          {state.active ? <CheckCircle2 className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-ink">
            {state.active ? 'Daily reminders are on' : 'Get a daily reminder at 7am'}
          </div>
          <div className="text-xs text-ink-faint mt-0.5">
            {state.active
              ? "We'll nudge you each morning if anything is due today."
              : 'Key dates, events, and birthdays for today — one notification.'}
          </div>
        </div>

        <Button
          variant={state.active ? 'secondary' : 'primary'}
          size="sm"
          onClick={toggle}
          disabled={!canEnable || busy || loading}
        >
          {busy ? '…' : state.active ? 'Turn off' : 'Turn on'}
        </Button>
      </div>

      {state.permission === 'denied' && !state.active && (
        <div className="mt-3 flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Notifications are blocked. Open your browser site settings and allow them for this site, then try again.</span>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </Card>
  );
}
