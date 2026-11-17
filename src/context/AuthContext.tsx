import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, BOOTSTRAPPED_ADMIN_EMAIL, db, googleAuthProvider } from '../lib/firebase';
import { ensureAdminSeeded } from '../lib/portfolioService';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAdmin: false,
  authError: null,
  signInWithGoogle: async () => {},
  logout: async () => {},
  getIdToken: async () => null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthError(null);
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
          await ensureAdminSeeded(nextUser.uid, nextUser.email).catch((e) => {
            console.warn('Seed sync notice:', e);
          });
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
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
    }
  };

  const logout = async () => {
    await signOut(auth);
    setIsAdmin(false);
  };

  const getIdToken = async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdmin, authError, signInWithGoogle, logout, getIdToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
