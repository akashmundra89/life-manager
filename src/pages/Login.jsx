import { useState } from 'react';
import { Sparkles, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Card, Button } from '../components/ui';
import { Input, Label } from '../components/ui/Input.jsx';
import { Sun, Moon } from 'lucide-react';
import { cx } from '../lib/cx.js';

export default function Login() {
  const { signIn, signUp, enterGuestMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) setError(error.message);
      } else {
        const { error, data } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else if (!data.session) {
          setMessage('Check your email to confirm your account, then sign in.');
          setMode('signin');
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative">
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 grid place-items-center w-10 h-10 rounded-xl glass glass-hover text-ink-muted hover:text-ink"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-7">
          <div className="grid place-items-center w-14 h-14 mx-auto mb-3 rounded-2xl bg-grad-brand text-white shadow-glow-brand animate-pop-in">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="text-2xl font-bold text-ink tracking-tight">Life Manager</div>
          <div className="text-sm text-ink-faint mt-1">Your daily command center</div>
        </div>

        <Card hover={false} variant="strong" className="p-6 sm:p-7 shadow-glass">
          <h1 className="text-lg font-bold text-ink mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-xs text-ink-faint mb-5">
            {mode === 'signin'
              ? 'Sign in to sync across devices.'
              : 'Free — your data syncs across every device.'}
          </p>

          {message && (
            <div className="mb-4 text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{message}</span>
            </div>
          )}
          {error && (
            <div className="mb-4 text-sm text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                required
                autoComplete="email"
                placeholder="you@email.com"
                leadingIcon={<Mail className="w-4 h-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                required
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                minLength={6}
                placeholder="••••••••"
                leadingIcon={<Lock className="w-4 h-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full mt-2">
              {loading ? 'Please wait…' : (
                <>
                  {mode === 'signin' ? 'Sign in' : 'Create account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-ink-faint">
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage(''); }}
              className="text-brand-600 dark:text-brand-300 hover:underline font-semibold"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          <div className="mt-5 pt-5 border-t border-edge/10">
            <Button onClick={enterGuestMode} variant="secondary" size="md" className="w-full">
              Browse without signing in
            </Button>
            <p className="mt-2 text-center text-[11px] text-ink-faint">
              Data saved locally on this device. Sign in anytime to sync.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
