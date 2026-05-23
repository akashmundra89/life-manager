import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { isSupabaseConfigured } from './lib/supabase';
import Sidebar from './components/Sidebar.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Grocery from './pages/Grocery.jsx';
import Events from './pages/Events.jsx';
import Office from './pages/Office.jsx';
import KeyDates from './pages/KeyDates.jsx';
import Monthly from './pages/Monthly.jsx';
import IPO from './pages/IPO.jsx';
import News from './pages/News.jsx';
import Cricket from './pages/Cricket.jsx';
import Expenses from './pages/Expenses.jsx';

export default function App() {
  const { user, loading, guestMode } = useAuth() ?? {};
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400 text-sm">
        Loading…
      </div>
    );
  }

  if (isSupabaseConfigured && !user && !guestMode) {
    return <Login />;
  }

  return (
    <div className="flex h-full">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-slate-900 text-white shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 rounded hover:bg-slate-700 transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-semibold text-sm">Life Manager</span>
        </div>

        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-4 py-6 lg:px-6 lg:py-8">
            <Routes>
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
