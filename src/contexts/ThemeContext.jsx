import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'life-manager:theme';
const ThemeContext = createContext(null);

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* ignore */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [followSystem, setFollowSystem] = useState(() => {
    try { return !localStorage.getItem(STORAGE_KEY); } catch { return true; }
  });

  // Apply to <html> whenever theme changes
  useEffect(() => { applyTheme(theme); }, [theme]);

  // Follow system pref if user hasn't picked manually
  useEffect(() => {
    if (!followSystem || typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [followSystem]);

  const setThemeManual = useCallback((next) => {
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
    setFollowSystem(false);
    setTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeManual(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setThemeManual]);

  const resetToSystem = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setFollowSystem(true);
    const next = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(next);
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme: setThemeManual, toggleTheme, followSystem, resetToSystem }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext) ?? { theme: 'light', toggleTheme: () => {} };
