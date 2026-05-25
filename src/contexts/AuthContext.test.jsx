import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Force Supabase to "not configured" so the AuthProvider runs in
// localStorage-only mode (the path we can exercise without network).
vi.mock('../lib/supabase.js', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

import { AuthProvider, useAuth } from './AuthContext.jsx';

const GUEST_KEY = 'life-manager:guest-mode';

function wrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext (Supabase NOT configured)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('exposes a context with the expected shape', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current).toEqual(
      expect.objectContaining({
        user: null,
        loading: false,
        guestMode: false,
        signIn: expect.any(Function),
        signUp: expect.any(Function),
        signOut: expect.any(Function),
        enterGuestMode: expect.any(Function),
        exitGuestMode: expect.any(Function),
      }),
    );
  });

  it('loading is false immediately when Supabase is not configured', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.loading).toBe(false);
  });

  it('enterGuestMode() flips the flag and persists to localStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.guestMode).toBe(false);

    act(() => result.current.enterGuestMode());

    // When Supabase is unconfigured, AuthProvider initializes guestMode to false
    // regardless of localStorage — but enterGuestMode should still flip both
    // localStorage and the in-memory flag.
    expect(localStorage.getItem(GUEST_KEY)).toBe('true');
    expect(result.current.guestMode).toBe(true);
  });

  it('exitGuestMode() clears the flag', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => result.current.enterGuestMode());
    expect(result.current.guestMode).toBe(true);

    act(() => result.current.exitGuestMode());
    expect(result.current.guestMode).toBe(false);
    expect(localStorage.getItem(GUEST_KEY)).toBeNull();
  });

  it('signOut() clears guest mode and user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => result.current.enterGuestMode());
    await act(async () => { await result.current.signOut(); });

    expect(result.current.guestMode).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(GUEST_KEY)).toBeNull();
  });

  it('useAuth returns null when used outside the provider', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current).toBeNull();
  });

  it('makes auth available to consumer components', async () => {
    function Probe() {
      const auth = useAuth();
      return (
        <div>
          <span data-testid="mode">{auth.guestMode ? 'guest' : 'anonymous'}</span>
          <button onClick={auth.enterGuestMode}>Enter guest</button>
        </div>
      );
    }

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(screen.getByTestId('mode')).toHaveTextContent('anonymous');
    await userEvent.click(screen.getByRole('button', { name: /enter guest/i }));
    expect(screen.getByTestId('mode')).toHaveTextContent('guest');
  });
});
