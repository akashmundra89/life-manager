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

export default function Sidebar() {
  const auth = useAuth();
  const user = auth?.user;
  const signOut = auth?.signOut;

  return (
    <aside className="w-60 shrink-0 bg-slate-900 text-slate-100 flex flex-col">
      <div className="px-6 py-6 border-b border-slate-800">
        <div className="text-xl font-semibold">Life Manager</div>
        <div className="text-xs text-slate-400 mt-1">Your daily command center</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
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
      <div className="px-4 py-4 border-t border-slate-800">
        {isSupabaseConfigured && user ? (
          <>
            <div className="text-xs text-slate-400 truncate mb-2 px-2">{user.email}</div>
            <button
              onClick={signOut}
              className="w-full text-left text-xs text-slate-400 hover:text-slate-200 px-2 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Sign out
            </button>
          </>
        ) : (
          <div className="text-xs text-slate-500 px-2">
            {isSupabaseConfigured ? 'Connecting…' : 'Local data · Supabase ready'}
          </div>
        )}
      </div>
    </aside>
  );
}
