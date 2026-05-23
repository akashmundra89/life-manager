import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const GUEST_KEY = 'life-manager:guest-mode';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [guestMode, setGuestMode] = useState(
    () => isSupabaseConfigured && localStorage.getItem(GUEST_KEY) === 'true'
  );

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = (email, password) =>
    supabase.auth.signUp({ email, password });

  // Works for both authenticated users and guest mode
  const signOut = async () => {
    if (isSupabaseConfigured && user) {
      try { await supabase.auth.signOut(); } catch { /* ignore */ }
    }
    localStorage.removeItem(GUEST_KEY);
    setGuestMode(false);
    setUser(null);
  };

  const enterGuestMode = () => {
    localStorage.setItem(GUEST_KEY, 'true');
    setGuestMode(true);
  };

  // Go back to the login screen from guest mode
  const exitGuestMode = () => {
    localStorage.removeItem(GUEST_KEY);
    setGuestMode(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, guestMode, signIn, signUp, signOut, enterGuestMode, exitGuestMode }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
