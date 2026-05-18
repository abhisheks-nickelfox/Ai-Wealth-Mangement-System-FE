import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../lib/api';
import type { User } from '../lib/api';
import { setCookie, getCookie, deleteCookie } from '../lib/cookies';

const TOKEN_KEY = 'mw_token';
const AUTH_CHANNEL = 'mw_auth';

type AuthMessage = { type: 'login' } | { type: 'logout' };

export function saveToken(token: string, remember = false) {
  setCookie(TOKEN_KEY, token, remember);
}

function getStoredToken(): string | null {
  return getCookie(TOKEN_KEY);
}

function clearToken() {
  deleteCookie(TOKEN_KEY);
}

interface AuthState {
  user: User | null;
  /** true while the initial token→me check is running */
  initialising: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => void;
  /** Refresh the current user profile (call after updating profile fields) */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, initialising: true });
  const channelRef = useRef<BroadcastChannel | null>(null);

  // On mount: verify stored token + subscribe to cross-tab auth events
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setState({ user: null, initialising: false });
    } else {
      authApi.me()
        .then((user) => setState({ user, initialising: false }))
        .catch(() => {
          clearToken();
          setState({ user: null, initialising: false });
        });
    }

    // Cross-tab sync via BroadcastChannel
    const ch = new BroadcastChannel(AUTH_CHANNEL);
    channelRef.current = ch;

    ch.onmessage = (e: MessageEvent<AuthMessage>) => {
      if (e.data.type === 'logout') {
        clearToken();
        setState({ user: null, initialising: false });
      } else if (e.data.type === 'login') {
        authApi.me()
          .then((user) => setState({ user, initialising: false }))
          .catch(() => {});
      }
    };

    return () => {
      ch.close();
      channelRef.current = null;
    };
  }, []);

  const login = useCallback(async (email: string, password: string, remember = false) => {
    const { token } = await authApi.login(email, password);
    saveToken(token, remember);
    const user = await authApi.me();
    setState({ user, initialising: false });
    channelRef.current?.postMessage({ type: 'login' } satisfies AuthMessage);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setState({ user: null, initialising: false });
    channelRef.current?.postMessage({ type: 'logout' } satisfies AuthMessage);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const user = await authApi.me();
      setState((prev) => ({ ...prev, user }));
    } catch {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
