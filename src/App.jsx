import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
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
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
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
  );
}
