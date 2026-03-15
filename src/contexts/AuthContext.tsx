import { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: 'locataire' | 'proprietaire' | 'admin' | 'notaire';
  avatar_url: string | null;
  company_name: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface PendingNewUser {
  uid: string;
  displayName: string;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  pendingNewUser: PendingNewUser | null;
  clearPendingNewUser: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: Profile['role']) => Promise<void>;
  signInWithProvider: (provider: 'google' | 'facebook' | 'twitter') => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helpers cache localStorage ───────────────────────────────────────────────
const CACHE_KEY = (uid: string) => `homeci_profile_${uid}`;

function getCachedProfile(uid: string): Profile | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY(uid));
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch { return null; }
}

function setCachedProfile(profile: Profile) {
  try { localStorage.setItem(CACHE_KEY(profile.id), JSON.stringify(profile)); } catch {}
}

function clearCachedProfile(uid: string) {
  try { localStorage.removeItem(CACHE_KEY(uid)); } catch {}
}
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingNewUser, setPendingNewUser] = useState<PendingNewUser | null>(null);
  const skipNextProfileLoad = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      (async () => {
        setUser(firebaseUser);

        if (firebaseUser) {
          if (skipNextProfileLoad.current) {
            skipNextProfileLoad.current = false;
            setLoading(false);
            return;
          }

          const cached = getCachedProfile(firebaseUser.uid);
          if (cached) {
            setProfile(cached);
            setLoading(false);
            refreshProfileInBackground(firebaseUser.uid);
          } else {
            await loadProfile(firebaseUser.uid);
          }
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Profile;
        setProfile(data);
        setCachedProfile(data);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  }

  async function refreshProfileInBackground(userId: string) {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Profile;
        setProfile(data);
        setCachedProfile(data);
      }
    } catch {}
  }

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signUp(email: string, password: string, fullName: string, role: Profile['role']) {
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);

      const now = new Date().toISOString();
      const profileData: Profile = {
        id: newUser.uid, email, full_name: fullName, role,
        phone: null, avatar_url: null, company_name: null,
        verified: false, created_at: now, updated_at: now,
      };

      setDoc(doc(db, 'users', newUser.uid), {
        ...profileData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      }).catch(console.error);

      setCachedProfile(profileData);
      skipNextProfileLoad.current = true;
      setUser(newUser);
      setProfile(profileData);
      setLoading(false);
    } catch (error) {
      throw error;
    }
  }

  async function signInWithProvider(provider: 'google' | 'facebook' | 'twitter') {
    const authProvider =
      provider === 'google'   ? new GoogleAuthProvider()   :
      provider === 'facebook' ? new FacebookAuthProvider() :
                                new TwitterAuthProvider();

    const result = await signInWithPopup(auth, authProvider);
    const fbUser = result.user;
    const profileRef = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(profileRef);

    if (!snap.exists()) {
      // Nouvel utilisateur → créer profil temporaire locataire
      const now = new Date().toISOString();
      const profileData: Profile = {
        id: fbUser.uid,
        email: fbUser.email || '',
        full_name: fbUser.displayName || 'Utilisateur',
        role: 'locataire',
        phone: null,
        avatar_url: fbUser.photoURL || null,
        company_name: null,
        verified: false,
        created_at: now,
        updated_at: now,
      };
      await setDoc(profileRef, {
        ...profileData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      setCachedProfile(profileData);
      setProfile(profileData);

      // Afficher le modal de sélection de rôle
      setPendingNewUser({
        uid: fbUser.uid,
        displayName: fbUser.displayName || '',
        photoURL: fbUser.photoURL,
      });
    }
    // Utilisateur existant → onAuthStateChanged charge le profil automatiquement
  }

  function clearPendingNewUser() {
    setPendingNewUser(null);
  }

  async function refreshProfile() {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Profile;
        setProfile(data);
        setCachedProfile(data);
      }
    } catch (e) {
      console.error('refreshProfile error:', e);
    }
  }

  async function signOut() {
    if (user) clearCachedProfile(user.uid);
    setUser(null);
    setProfile(null);
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading, pendingNewUser, clearPendingNewUser,
      signIn, signUp, signInWithProvider, refreshProfile, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
