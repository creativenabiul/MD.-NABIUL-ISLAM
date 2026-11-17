import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, BOOTSTRAPPED_ADMIN_EMAIL, db, googleAuthProvider } from '../lib/firebase';
import { ensureAdminSeeded, logAdminActivity } from '../lib/portfolioService';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  authError: string | null;
  cooldownSeconds: number;
  idleMinutes: number;
  setIdleMinutes: (mins: number) => void;
  signInWithGoogle: () => Promise<void>;
  logout: (reason?: string) => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAdmin: false,
  authError: null,
  cooldownSeconds: 0,
  idleMinutes: 60,
  setIdleMinutes: () => {},
  signInWithGoogle: async () => {},
  logout: async () => {},
  getIdToken: async () => null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [idleMinutes, setIdleMinutes] = useState<number>(() => {
    const saved = Number(localStorage.getItem('admin_idle_timeout_minutes') || '60');
    return Number.isFinite(saved) && saved >= 5 ? saved : 60;
  });

  const failedAttemptsRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const sessionLoggedRef = useRef<string | null>(null);

  const handleSetIdleMinutes = useCallback((mins: number) => {
    const bounded = Math.max(5, Math.min(1440, Math.round(mins)));
    setIdleMinutes(bounded);
    localStorage.setItem('admin_idle_timeout_minutes', String(bounded));
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const logout = useCallback(
    async (reason?: string) => {
      const currentEmail = auth.currentUser?.email;
      if (currentEmail && isAdmin) {
        await logAdminActivity(
          currentEmail,
          'logout',
          'auth_session',
          auth.currentUser?.uid || 'session',
          reason || 'Administrator signed out'
        );
      }
      sessionLoggedRef.current = null;
      await signOut(auth);
      setIsAdmin(false);
      if (reason) {
        setAuthError(reason);
      }
    },
    [isAdmin]
  );

  // Idle session expiration monitor when signed in as admin
  useEffect(() => {
    if (!isAdmin) return;
    const bump = () => {
      lastActivityRef.current = Date.now();
    };
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, bump, { passive: true }));

    const interval = window.setInterval(() => {
      const elapsedMs = Date.now() - lastActivityRef.current;
      if (elapsedMs > idleMinutes * 60 * 1000) {
        void logout('Session expired due to inactivity. Please sign in again.');
      }
    }, 30000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, bump));
      window.clearInterval(interval);
    };
  }, [isAdmin, idleMinutes, logout]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        if (!nextUser.emailVerified) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        let adminAuthorized = nextUser.email === BOOTSTRAPPED_ADMIN_EMAIL;
        if (!adminAuthorized) {
          const adminDoc = await getDoc(doc(db, 'admins', nextUser.uid)).catch(() => null);
          adminAuthorized = Boolean(adminDoc && adminDoc.exists());
        }

        setIsAdmin(adminAuthorized);
        if (adminAuthorized && nextUser.email) {
          setAuthError(null);
          failedAttemptsRef.current = 0;
          lastActivityRef.current = Date.now();
          await ensureAdminSeeded(nextUser.uid, nextUser.email).catch((e) => {
            console.warn('Seed sync notice:', e);
          });
          if (sessionLoggedRef.current !== nextUser.uid) {
            sessionLoggedRef.current = nextUser.uid;
            void logAdminActivity(
              nextUser.email,
              'login',
              'auth_session',
              nextUser.uid,
              'Administrator verified and signed in'
            );
          }
        } else {
          failedAttemptsRef.current += 1;
          if (failedAttemptsRef.current >= 3) {
            setCooldownSeconds(30);
          }
        }
      } catch (err) {
        console.error('Admin verification failed:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {
    if (cooldownSeconds > 0) {
      setAuthError(`Rate limit active. Please wait ${cooldownSeconds}s before trying again.`);
      return;
    }
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err) {
      failedAttemptsRef.current += 1;
      if (failedAttemptsRef.current >= 3) {
        setCooldownSeconds(30);
      }
      setAuthError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
    }
  };

  const getIdToken = async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        authError,
        cooldownSeconds,
        idleMinutes,
        setIdleMinutes: handleSetIdleMinutes,
        signInWithGoogle,
        logout,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
