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
  role: 'locataire' | 'proprietaire' | 'agent' | 'admin' | 'notaire';
  avatar_url: string | null;
  company_name: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: Profile['role']) => Promise<void>;
  signInWithProvider: (provider: 'google' | 'facebook' | 'twitter') => Promise<{ isNewUser: boolean; uid: string; displayName: string; email: string; photoURL: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helpers cache localStorage ───────────────────────────────────────────────
const CACHE_KEY = (uid: string) => `homeci_profile_${uid}`;

function getCachedProfile(uid: string): Profile | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY(uid));
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

function setCachedProfile(profile: Profile) {
  try {
    localStorage.setItem(CACHE_KEY(profile.id), JSON.stringify(profile));
  } catch {}
}

function clearCachedProfile(uid: string) {
  try {
    localStorage.removeItem(CACHE_KEY(uid));
  } catch {}
}
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // Ref pour éviter le double chargement du profil après signUp
  const skipNextProfileLoad = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      (async () => {
        setUser(firebaseUser);

        if (firebaseUser) {
          // Cas signUp : profil déjà en mémoire, on skip le getDoc
          if (skipNextProfileLoad.current) {
            skipNextProfileLoad.current = false;
            setLoading(false);
            return;
          }

          // Cas signIn : on charge d'abord le cache pour affichage instantané
          const cached = getCachedProfile(firebaseUser.uid);
          if (cached) {
            setProfile(cached);
            setLoading(false);
            // Puis on rafraîchit le profil en arrière-plan (rôle, vérification, etc.)
            refreshProfileInBackground(firebaseUser.uid);
          } else {
            // Première connexion : pas de cache, on lit Firestore normalement
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

  // Lecture Firestore bloquante (première connexion)
  async function loadProfile(userId: string) {
    try {
      const docRef = doc(db, 'profiles', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Profile;
        setProfile(data);
        setCachedProfile(data); // mise en cache pour les prochaines connexions
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  }

  // Rafraîchissement en arrière-plan (connexions suivantes)
  async function refreshProfileInBackground(userId: string) {
    try {
      const docRef = doc(db, 'profiles', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Profile;
        setProfile(data);
        setCachedProfile(data); // mise à jour du cache
      }
    } catch {
      // Silencieux — le cache est déjà affiché
    }
  }

  async function signIn(email: string, password: string) {
    // Ne pas setLoading(true) ici — évite de masquer le modal d'erreur
    // onAuthStateChanged prend le relais en cas de succès
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signUp(
    email: string,
    password: string,
    fullName: string,
    role: Profile['role']
  ) {
    // Ne pas setLoading(true) ici — évite de masquer le modal d'erreur
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);

      const now = new Date().toISOString();
      const profileData: Profile = {
        id: newUser.uid,
        email,
        full_name: fullName,
        role,
        phone: null,
        avatar_url: null,
        company_name: null,
        verified: false,
        created_at: now,
        updated_at: now,
      };

      // Sauvegarde Firestore en arrière-plan (non bloquant)
      setDoc(doc(db, 'profiles', newUser.uid), {
        ...profileData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      }).catch(console.error);

      // Mise en cache immédiate
      setCachedProfile(profileData);

      // Injection directe en mémoire → dashboard instantané
      skipNextProfileLoad.current = true;
      setUser(newUser);
      setProfile(profileData);
      setLoading(false);
    } catch (error) {
      throw error;
    }
  }

  async function signInWithProvider(provider: 'google' | 'facebook' | 'twitter'): Promise<{ isNewUser: boolean; uid: string; displayName: string; email: string; photoURL: string | null }> {
    const authProvider =
      provider === 'google'   ? new GoogleAuthProvider()   :
      provider === 'facebook' ? new FacebookAuthProvider() :
                                new TwitterAuthProvider();
    const result = await signInWithPopup(auth, authProvider);
    const fbUser = result.user;
    const profileRef = doc(db, 'profiles', fbUser.uid);
    const snap = await getDoc(profileRef);
    if (!snap.exists()) {
      // Nouveau utilisateur — on crée un profil temporaire locataire
      // Le rôle sera mis à jour par le modal de sélection
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
      return { isNewUser: true, uid: fbUser.uid, displayName: fbUser.displayName || '', email: fbUser.email || '', photoURL: fbUser.photoURL };
    }
    return { isNewUser: false, uid: fbUser.uid, displayName: fbUser.displayName || '', email: fbUser.email || '', photoURL: fbUser.photoURL };
  }

  async function signOut() {
    if (user) clearCachedProfile(user.uid);
    setUser(null);
    setProfile(null);
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signInWithProvider, signOut }}>
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
