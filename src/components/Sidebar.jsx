import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

const links = [
  { to: '/', label: 'Dashboard', icon: '⌂' },
  { to: '/grocery', label: 'Grocery List', icon: '\u{1F6D2}' },
  { to: '/events', label: 'Upcoming Events', icon: '\u{1F4C5}' },
  { to: '/office', label: 'Office Work', icon: '\u{1F4BC}' },
  { to: '/key-dates', label: 'Key Dates', icon: '⭐' },
  { to: '/monthly', label: 'Monthly Tasks', icon: '\u{1F5D3}' },
  { to: '/expenses', label: 'Expense Tracker', icon: '\u{1F4B0}' },
  { to: '/ipo', label: 'Upcoming IPOs', icon: '\u{1F4C8}' },
  { to: '/news', label: 'India Headlines', icon: '\u{1F4F0}' },
  { to: '/cricket', label: 'Cricket Scores', icon: '\u{1F3CF}' },
];

export default function Sidebar({ open, onClose }) {
  const auth = useAuth();
  const user = auth?.user;
  const guestMode = auth?.guestMode;
  const signOut = auth?.signOut;
  const exitGuestMode = auth?.exitGuestMode;

  return (
    <aside
      className={[
        'fixed lg:static inset-y-0 left-0 z-30',
        'w-64 shrink-0 bg-slate-900 text-slate-100 flex flex-col',
        'transition-transform duration-200 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
      ].join(' ')}
    >
      {/* Header */}
      <div className="px-5 py-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="text-base font-semibold">Life Manager</div>
          <div className="text-xs text-slate-400 mt-0.5">Your daily command center</div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
          aria-label="Close menu"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-brand-500 text-white shadow'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              ].join(' ')
            }
          >
            <span className="text-base w-5 text-center">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-800">
        {isSupabaseConfigured ? (
          guestMode ? (
            <div>
              <div className="text-xs text-amber-400 font-medium mb-1 px-1">Guest mode</div>
              <div className="text-xs text-slate-400 mb-2 px-1">Data saved on this device only.</div>
              <button
                onClick={exitGuestMode}
                className="w-full text-left text-xs text-slate-300 hover:text-white px-2 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Sign in to sync →
              </button>
            </div>
          ) : user ? (
            <div>
              <div className="text-xs text-slate-400 truncate mb-2 px-1">{user.email}</div>
              <button
                onClick={signOut}
                className="w-full text-left text-xs text-slate-400 hover:text-slate-200 px-2 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-500 px-1">Connecting…</div>
          )
        ) : (
          <div className="text-xs text-slate-500 px-1">Local data · Supabase ready</div>
        )}
      </div>
    </aside>
  );
}
