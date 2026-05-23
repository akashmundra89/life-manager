import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, CalendarDays, Briefcase, Star, CalendarCheck,
  Wallet, TrendingUp, Newspaper, Trophy, Sparkles, X as XIcon,
  Sun, Moon, LogOut,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { cx } from '../lib/cx.js';

const SECTIONS = [
  { label: 'Overview', items: [
    { to: '/',          label: 'Dashboard',  Icon: LayoutDashboard },
  ]},
  { label: 'Daily', items: [
    { to: '/grocery',   label: 'Grocery',    Icon: ShoppingCart },
    { to: '/events',    label: 'Events',     Icon: CalendarDays },
    { to: '/office',    label: 'Office',     Icon: Briefcase },
  ]},
  { label: 'Planning', items: [
    { to: '/key-dates', label: 'Key dates',  Icon: Star },
    { to: '/monthly',   label: 'Monthly',    Icon: CalendarCheck },
    { to: '/expenses',  label: 'Expenses',   Icon: Wallet },
  ]},
  { label: 'Discover', items: [
    { to: '/ipo',       label: 'IPOs',       Icon: TrendingUp },
    { to: '/news',      label: 'Headlines',  Icon: Newspaper },
    { to: '/cricket',   label: 'Cricket',    Icon: Trophy },
  ]},
];

export default function Sidebar({ open, onClose }) {
  const auth = useAuth();
  const { theme, toggleTheme } = useTheme();
  const user = auth?.user;
  const guestMode = auth?.guestMode;
  const signOut = auth?.signOut;
  const exitGuestMode = auth?.exitGuestMode;

  const userInitial = user?.email?.[0]?.toUpperCase() ?? (guestMode ? 'G' : 'A');
  const userLabel = user?.email ?? (guestMode ? 'Guest mode' : 'Local data');

  return (
    <aside
      className={cx(
        'fixed lg:static inset-y-0 left-0 z-30',
        'w-64 shrink-0 glass border-r border-edge/10 text-ink flex flex-col',
        'transition-transform duration-300 ease-spring',
        open ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
      )}
    >
      <div className="px-4 py-4 flex items-center gap-3 border-b border-edge/10">
        <div className="grid place-items-center w-9 h-9 rounded-xl bg-grad-brand text-white shadow-glow-brand">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold leading-tight">Life Manager</div>
          <div className="text-[11px] text-ink-faint leading-tight mt-0.5">Your command center</div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden grid place-items-center w-7 h-7 rounded-lg text-ink-faint hover:text-ink hover:bg-surface-strong/60"
          aria-label="Close menu"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {SECTIONS.map((sec) => (
          <div key={sec.label} className="mb-3">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-faint px-3 mb-1">
              {sec.label}
            </div>
            <div className="space-y-0.5">
              {sec.items.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cx(
                      'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-grad-brand-soft text-ink ring-1 ring-inset ring-edge/10'
                        : 'text-ink-muted hover:bg-surface-strong/40 hover:text-ink',
                    )
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-edge/10 space-y-2">
        <div className="flex items-center gap-2 px-2 py-2 rounded-xl glass-soft">
          <div className="grid place-items-center w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 text-white text-xs font-bold">
            {userInitial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold truncate text-ink">{userLabel}</div>
            <div className="text-[10.5px] text-ink-faint">
              {isSupabaseConfigured ? (guestMode ? 'On this device only' : user ? 'Synced' : 'Connecting…') : 'Local · Supabase ready'}
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="grid place-items-center w-8 h-8 rounded-lg text-ink-faint hover:text-ink hover:bg-surface-strong/60"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {isSupabaseConfigured && guestMode && (
          <button
            onClick={exitGuestMode}
            className="w-full text-left text-xs px-3 py-2 rounded-xl text-ink-muted hover:bg-surface-strong/60 hover:text-ink"
          >
            Sign in to sync &rarr;
          </button>
        )}
        {isSupabaseConfigured && user && (
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 text-xs px-3 py-2 rounded-xl text-ink-muted hover:bg-surface-strong/60 hover:text-ink"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        )}
      </div>
    </aside>
  );
}
