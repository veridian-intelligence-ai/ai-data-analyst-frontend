import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { loginRequest, logoutRequest, meRequest } from '../lib/api';
import {
  clearSession,
  getSession,
  getUserName,
  isSessionValid,
  saveSession,
} from '../lib/session';

export type LoginResult =
  | { ok: true }
  | { ok: false; code: 'invalid_credentials' | 'not_provisioned' | 'unavailable' };

interface AuthContextValue {
  /** True while the boot check runs — route guards should wait, not redirect. */
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  userName: string;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');

  // Boot: clear expired sessions immediately, then confirm live ones against
  // /auth/me so a server-side revocation also signs the client out.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const session = getSession();
      if (!isSessionValid(session)) {
        if (session) clearSession(); // expired — drop it rather than sending a dead token
        if (!cancelled) setIsBootstrapping(false);
        return;
      }

      // Optimistically authenticated: the UI renders while /auth/me confirms.
      setIsAuthenticated(true);
      setUserName(getUserName());
      setIsBootstrapping(false);

      try {
        const me = await meRequest();
        if (!cancelled && me.name) setUserName(me.name);
      } catch (e) {
        // Only a definitive auth rejection signs the user out; transient
        // network errors must not eject a working session.
        const msg = e instanceof Error ? e.message : '';
        if (!cancelled && (msg === 'AUTH_ERROR:401' || msg === 'AUTH_ERROR:403')) {
          clearSession();
          setIsAuthenticated(false);
          setUserName('');
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      const data = await loginRequest(email.trim(), password);
      const stored = saveSession(data);
      setIsAuthenticated(true);
      setUserName(stored.userName);
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === 'AUTH_ERROR:401') return { ok: false, code: 'invalid_credentials' };
      if (msg === 'AUTH_ERROR:403') return { ok: false, code: 'not_provisioned' };
      return { ok: false, code: 'unavailable' };
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest(); // best-effort server invalidation
    clearSession();
    setIsAuthenticated(false);
    setUserName('');
  }, []);

  const value = useMemo(
    () => ({ isBootstrapping, isAuthenticated, userName, login, logout }),
    [isBootstrapping, isAuthenticated, userName, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
