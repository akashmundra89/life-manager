import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Menu, Sparkles } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { isSupabaseConfigured } from './lib/supabase';
import Sidebar from './components/Sidebar.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import useFocusFromQuery from './lib/useFocusFromQuery.js';

// Lazy-loaded — heavier and not needed for first paint.
const Grocery  = lazy(() => import('./pages/Grocery.jsx'));
const Events   = lazy(() => import('./pages/Events.jsx'));
const Office   = lazy(() => import('./pages/Office.jsx'));
const KeyDates = lazy(() => import('./pages/KeyDates.jsx'));
const Monthly  = lazy(() => import('./pages/Monthly.jsx'));
const IPO      = lazy(() => import('./pages/IPO.jsx'));
const News     = lazy(() => import('./pages/News.jsx'));
const Cricket  = lazy(() => import('./pages/Cricket.jsx'));
const Expenses = lazy(() => import('./pages/Expenses.jsx'));  // pulls in recharts
const Achievements = lazy(() => import('./pages/Achievements.jsx'));
const People = lazy(() => import('./pages/People.jsx'));
const VacationPlanning = lazy(() => import('./pages/VacationPlanning.jsx'));
const PlacesVisited = lazy(() => import('./pages/PlacesVisited.jsx'));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-[40vh] animate-fade-in">
      <div className="grid place-items-center w-12 h-12 rounded-2xl bg-grad-brand text-white shadow-glow-brand">
        <Sparkles className="w-5 h-5 animate-pulse" />
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  // Strip query string from the animation key so navigating with ?focus=
  // doesn't re-mount the page (which would lose the highlight target).
  const animationKey = location.pathname;
  return (
    <div key={animationKey} className="animate-fade-in">
      <Suspense fallback={<RouteFallback />}>
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/grocery" element={<Grocery />} />
          <Route path="/events" element={<Events />} />
          <Route path="/office" element={<Office />} />
          <Route path="/key-dates" element={<KeyDates />} />
          <Route path="/monthly" element={<Monthly />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/ipo" element={<IPO />} />
          <Route path="/news" element={<News />} />
          <Route path="/cricket" element={<Cricket />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/people" element={<People />} />
          <Route path="/vacation-planning" element={<VacationPlanning />} />
          <Route path="/places-visited" element={<PlacesVisited />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default function App() {
  const { user, loading, guestMode } = useAuth() ?? {};
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Scroll-to and highlight the row referenced by `?focus=...` after the
  // global search bar navigates to it.
  useFocusFromQuery();

  // Cmd/Ctrl+K from anywhere focuses the sidebar's global search input.
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        const el = document.getElementById('global-search-input');
        if (el) {
          e.preventDefault();
          el.focus();
          el.select?.();
          // On mobile, the sidebar is closed by default — open it so the
          // input is actually visible.
          setSidebarOpen(true);
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-3 text-ink-faint text-sm">
        <div className="grid place-items-center w-12 h-12 rounded-2xl bg-grad-brand text-white shadow-glow-brand animate-pop-in">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>Loading your space…</div>
      </div>
    );
  }

  if (isSupabaseConfigured && !user && !guestMode) {
    return <Login />;
  }

  return (
    <>
      <div className="flex h-full">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-20 lg:hidden animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0">
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 glass border-b border-edge/10 shrink-0 pt-safe">
            <button
              onClick={() => setSidebarOpen(true)}
              className="grid place-items-center w-9 h-9 rounded-xl glass-hover hover:bg-surface-strong/60 text-ink-muted hover:text-ink transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="grid place-items-center w-7 h-7 rounded-lg bg-grad-brand text-white shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-sm text-ink truncate">Life Manager</span>
            </div>
          </div>

          <main className="flex-1 overflow-auto">
            <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8 lg:py-8 pb-safe">
              <AnimatedRoutes />
            </div>
          </main>
        </div>
      </div>
      <InstallPrompt />
    </>
  );
}
