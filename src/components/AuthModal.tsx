import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Building2, User, Home, Briefcase, Award, Key, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KenteLine } from './ui/KenteLine';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onNewGoogleUser?: (data: {uid:string;displayName:string;photoURL:string|null}) => void;
}

// Rôles publics — Notaire retiré délibérément
const PUBLIC_ROLES = [
  { value: 'locataire',    label: 'Locataire / Acheteur', icon: Home,      desc: 'Je cherche un bien'    },
  { value: 'proprietaire', label: 'Propriétaire',          icon: Building2, desc: 'Je loue ou vends'      },
];

async function validateNotaireCode(code: string): Promise<{ valid: boolean; docId?: string }> {
  try {
    const q = query(
      collection(db, 'notaire_codes'),
      where('code', '==', code.toUpperCase()),
      where('used', '==', false)
    );
    const snap = await getDocs(q);
    if (snap.empty) return { valid: false };
    const d = snap.docs[0];
    const data = d.data();
    // Vérifier expiration
    if (data.expires_at && data.expires_at.toDate() < new Date()) return { valid: false };
    return { valid: true, docId: d.id };
  } catch { return { valid: false }; }
}

async function markNotaireCodeUsed(docId: string) {
  await updateDoc(doc(db, 'notaire_codes', docId), { used: true, used_at: new Date().toISOString() });
}

export function AuthModal({ isOpen, onClose, initialMode = 'login', onNewGoogleUser }: AuthModalProps) {
  const { signIn, signUp, signInWithProvider } = useAuth();
  const [socialLoading, setSocialLoading] = useState<string|null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'locataire' | 'proprietaire' | 'notaire'>('locataire');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Notaire invite code flow
  const [showNotaireCode, setShowNotaireCode] = useState(false);
  const [notaireCode, setNotaireCode] = useState('');
  const [notaireCodeError, setNotaireCodeError] = useState('');
  const [notaireCodeValid, setNotaireCodeValid] = useState(false);
  const [validatedCodeDocId, setValidatedCodeDocId] = useState<string | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode); setError('');
      setShowNotaireCode(false); setNotaireCode(''); setNotaireCodeError('');
      setNotaireCodeValid(false); setValidatedCodeDocId(null);
    }
  }, [isOpen, initialMode]);

  const handleModeSwitch = () => {
    setMode(m => m === 'login' ? 'signup' : 'login');
    setError(''); setEmail(''); setPassword(''); setFullName('');
    setShowNotaireCode(false); setNotaireCode(''); setNotaireCodeError('');
    setNotaireCodeValid(false); setValidatedCodeDocId(null);
    setRole('locataire');
  };

  const handleCheckNotaireCode = async () => {
    if (!notaireCode.trim()) return;
    setCheckingCode(true);
    setNotaireCodeError('');
    const result = await validateNotaireCode(notaireCode);
    if (result.valid && result.docId) {
      setNotaireCodeValid(true);
      setValidatedCodeDocId(result.docId);
      setRole('notaire');
    } else {
      setNotaireCodeError('Code invalide, expiré ou déjà utilisé.');
      setNotaireCodeValid(false);
    }
    setCheckingCode(false);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // ── Validation côté client ──
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError('Veuillez saisir votre adresse email.');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setError('Adresse email invalide. Vérifiez le format (ex: nom@domaine.com).');
      return;
    }
    if (!password) {
      setError('Veuillez saisir votre mot de passe.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (mode === 'signup' && !fullName.trim()) {
      setError('Veuillez entrer votre nom complet.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        // Sécurité double : si panneau notaire ouvert sans code validé → bloquer
        if (showNotaireCode && !notaireCodeValid) {
          throw new Error('Veuillez valider votre code d\'invitation notaire avant de créer le compte.');
        }
        const finalRole = (showNotaireCode && notaireCodeValid) ? 'notaire' : role;
        await signUp(email, password, fullName, finalRole);
        // Marquer le code comme utilisé
        if (showNotaireCode && notaireCodeValid && validatedCodeDocId) {
          await markNotaireCodeUsed(validatedCodeDocId);
        }
      }
      onClose();
      setEmail(''); setPassword(''); setFullName('');
    } catch (err: any) {
      const code = err?.code || '';
      const msg  = err instanceof Error ? err.message : String(err);
      // ── Connexion ──
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || msg.includes('Invalid login credentials'))
        setError('Mot de passe incorrect. Veuillez réessayer.');
      else if (code === 'auth/user-not-found' || msg.includes('user-not-found'))
        setError('Aucun compte trouvé avec cet email.');
      else if (code === 'auth/invalid-email')
        setError('Adresse email invalide. Vérifiez le format.');
      else if (code === 'auth/user-disabled')
        setError('Ce compte a été désactivé. Contactez le support.');
      else if (code === 'auth/too-many-requests')
        setError('Trop de tentatives. Réessayez dans quelques minutes.');
      // ── Inscription ──
      else if (code === 'auth/email-already-in-use' || msg.includes('User already registered'))
        setError('Cet email est déjà associé à un compte.');
      else if (code === 'auth/weak-password')
        setError('Mot de passe trop faible. Utilisez au moins 6 caractères.');
      else if (code === 'auth/operation-not-allowed')
        setError('Inscription temporairement désactivée.');
      // ── Email ──
      else if (msg.includes('Email not confirmed'))
        setError('Veuillez confirmer votre adresse email avant de vous connecter.');
      // ── Autres ──
      else
        setError(msg || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = `w-full px-4 py-3 rounded-xl text-sm outline-none transition-all`;
  const inputStyle = {
    background: 'rgba(13,31,18,0.6)',
    border: '1px solid rgba(212,160,23,0.2)',
    color: HColors.cream,
    fontFamily: 'var(--font-nunito)',
  } as React.CSSProperties;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>

      <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(160deg, #0D1F12 0%, #1A0E00 100%)',
                 border: '1px solid rgba(212,160,23,0.25)' }}>

        <KenteLine height={5} />

        {/* Adinkra bg */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.03 }}>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="auth-adinkra" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <circle cx="40" cy="40" r="28" fill="none" stroke="#D4A017" strokeWidth="1"/>
                <circle cx="40" cy="40" r="14" fill="none" stroke="#D4A017" strokeWidth="0.8"/>
                <line x1="40" y1="12" x2="40" y2="68" stroke="#D4A017" strokeWidth="0.7"/>
                <line x1="12" y1="40" x2="68" y2="40" stroke="#D4A017" strokeWidth="0.7"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#auth-adinkra)"/>
          </svg>
        </div>

        <div className="relative z-10 p-8 max-h-[90vh] overflow-y-auto">
          <button onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full transition-all hover:opacity-80"
            style={{ background: HAlpha.gold10, border: '1px solid rgba(212,160,23,0.2)' }}>
            <X className="w-4 h-4" style={{ color: HColors.gold }} />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: HColors.gold }}>
              <Building2 className="w-4 h-4" style={{ color: HColors.night }} />
            </div>
            <span className="text-lg font-bold tracking-widest"
              style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)', letterSpacing: '0.18em' }}>
              HOMECI
            </span>
          </div>

          <h2 className="mt-4 mb-1 font-bold"
            style={{ fontFamily: 'var(--font-cormorant)', fontSize: '2rem', color: HColors.cream, lineHeight: 1.2 }}>
            {mode === 'login' ? 'Bon retour' : 'Bienvenue'}
          </h2>
          <p className="mb-6 text-sm" style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
            {mode === 'login' ? 'Connectez-vous à votre espace HOMECI' : 'Créez votre compte et rejoignez HOMECI'}
          </p>

          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-6"
            style={{ background: 'rgba(212,160,23,0.07)', border: '1px solid rgba(212,160,23,0.15)' }}>
            {(['login', 'signup'] as const).map(m => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(''); }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={mode === m
                  ? { background: HColors.gold, color: HColors.night, fontFamily: 'var(--font-nunito)' }
                  : { color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          {/* Erreur */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(139,29,29,0.18)', border: '1px solid rgba(200,50,50,0.45)',
                       color: '#FFBBBB', fontFamily: 'var(--font-nunito)' }}>
              <span className="shrink-0 mt-0.5 text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Signup only fields */}
            {mode === 'signup' && (
              <>
                {/* Nom */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                    style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
                    Nom complet
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: HAlpha.gold50 }} />
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                      placeholder="Votre nom et prénom"
                      className={`${inputCls} pl-10`} style={inputStyle} required />
                  </div>
                </div>

                {/* Type de compte */}
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                    style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
                    Type de compte
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PUBLIC_ROLES.map(r => {
                      const Icon = r.icon;
                      const active = role === r.value;
                      return (
                        <button key={r.value} type="button"
                          onClick={() => { setRole(r.value as typeof role); setShowNotaireCode(false); setNotaireCodeValid(false); setNotaireCode(''); }}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all"
                          style={active
                            ? { background: HAlpha.gold20, border: '1px solid rgba(212,160,23,0.6)' }
                            : { background: 'rgba(13,31,18,0.5)', border: '1px solid rgba(212,160,23,0.12)' }}>
                          <Icon className="w-4 h-4 shrink-0"
                            style={{ color: active ? HColors.gold : 'rgba(245,230,200,0.4)' }} />
                          <div>
                            <p className="text-xs font-semibold leading-tight"
                              style={{ color: active ? HColors.cream : HAlpha.cream60, fontFamily: 'var(--font-nunito)' }}>
                              {r.label}
                            </p>
                            <p className="text-xs leading-tight mt-0.5"
                              style={{ color: active ? HAlpha.cream60 : 'rgba(245,230,200,0.3)', fontFamily: 'var(--font-nunito)' }}>
                              {r.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}

                    {/* Bouton Notaire avec code d'invitation */}
                    <button type="button"
                      onClick={() => { setShowNotaireCode(!showNotaireCode); if (role === 'notaire') { setRole('locataire'); setNotaireCodeValid(false); } }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all"
                      style={role === 'notaire' && notaireCodeValid
                        ? { background: HAlpha.gold20, border: '1px solid rgba(212,160,23,0.6)' }
                        : showNotaireCode
                        ? { background: 'rgba(13,31,18,0.8)', border: '1px solid rgba(212,160,23,0.35)' }
                        : { background: 'rgba(13,31,18,0.5)', border: '1px solid rgba(212,160,23,0.12)' }}>
                      <Award className="w-4 h-4 shrink-0"
                        style={{ color: (role === 'notaire' && notaireCodeValid) ? HColors.gold : 'rgba(245,230,200,0.4)' }} />
                      <div>
                        <p className="text-xs font-semibold leading-tight"
                          style={{ color: (role === 'notaire' && notaireCodeValid) ? HColors.cream : HAlpha.cream60,
                                   fontFamily: 'var(--font-nunito)' }}>
                          Notaire Agréé
                        </p>
                        <p className="text-xs leading-tight mt-0.5"
                          style={{ color: 'rgba(245,230,200,0.3)', fontFamily: 'var(--font-nunito)' }}>
                          Code requis
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Panneau code notaire */}
                  {showNotaireCode && (
                    <div className="mt-3 p-4 rounded-xl space-y-3"
                      style={{ background: 'rgba(13,31,18,0.8)', border: '1px solid rgba(212,160,23,0.25)' }}>
                      <div className="flex items-center gap-2 text-xs"
                        style={{ color: HAlpha.cream60, fontFamily: 'var(--font-nunito)' }}>
                        <Key className="w-3.5 h-3.5" style={{ color: HColors.gold }} />
                        Entrez le code d'invitation fourni par un administrateur HOMECI
                      </div>

                      {notaireCodeValid ? (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                          style={{ background: HAlpha.green10, border: `1px solid ${HAlpha.green25}` }}>
                          <Award className="w-4 h-4" style={{ color: HColors.green }} />
                          <span className="text-xs font-semibold" style={{ color: HColors.green, fontFamily: 'var(--font-nunito)' }}>
                            Code validé — compte Notaire Agréé activé
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={notaireCode}
                              onChange={e => { setNotaireCode(e.target.value.toUpperCase()); setNotaireCodeError(''); }}
                              placeholder="Ex: AB3K7P2Z"
                              maxLength={12}
                              className="flex-1 px-3 py-2 rounded-lg text-xs font-mono tracking-widest outline-none"
                              style={{ background: 'rgba(13,31,18,0.9)', border: '1px solid rgba(212,160,23,0.3)',
                                       color: HColors.cream }}
                            />
                            <button type="button" onClick={handleCheckNotaireCode}
                              disabled={checkingCode || notaireCode.length < 6}
                              className="px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-40 flex items-center gap-1.5"
                              style={{ background: 'linear-gradient(135deg,#D4A017,#C07C3E)', color: HColors.night,
                                       fontFamily: 'var(--font-nunito)' }}>
                              {checkingCode ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                              Valider
                            </button>
                          </div>
                          {notaireCodeError && (
                            <div className="flex items-center gap-1.5 text-xs"
                              style={{ color: '#FFAAAA', fontFamily: 'var(--font-nunito)' }}>
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              {notaireCodeError}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
                Email
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com" className={inputCls} style={inputStyle} required />
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
                Mot de passe
              </label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Minimum 6 caractères' : '••••••••'}
                  className={`${inputCls} pr-12`} style={inputStyle} required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100"
                  style={{ opacity: 0.5 }}>
                  {showPassword
                    ? <EyeOff className="w-4 h-4" style={{ color: HColors.gold }} />
                    : <Eye className="w-4 h-4" style={{ color: HColors.gold }} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading || (mode === 'signup' && showNotaireCode && !notaireCodeValid)}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 mt-2"
              style={{ background: 'linear-gradient(135deg, #D4A017 0%, #C07C3E 100%)',
                       color: HColors.night, fontFamily: 'var(--font-nunito)' }}>
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                    Chargement...
                  </span>
                : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>

          {/* ── Séparateur ── */}
          <div className="flex items-center gap-3 mt-5 mb-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(212,160,23,0.18)' }}/>
            <span className="text-xs" style={{ color: 'rgba(245,230,200,0.35)', fontFamily: 'var(--font-nunito)' }}>
              ou continuer avec
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(212,160,23,0.18)' }}/>
          </div>

          {/* ── Connexion sociale ── */}
          <div className="flex gap-3">
            {([
              { id:'google', label:'Continuer avec Google', icon:(
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )},
            ] as {id:string;label:string;icon:React.ReactNode}[]).map(p => (
              <button key={p.id} type="button"
                onClick={async () => {
                  setSocialLoading(p.id);
                  setError('');
                  try {
                    const result = await signInWithProvider(p.id as 'google'|'facebook'|'twitter');
                    if (result.isNewUser && onNewGoogleUser) {
                      onNewGoogleUser({ uid: result.uid, displayName: result.displayName, photoURL: result.photoURL });
                    }
                    onClose();
                  } catch (err: any) {
                    const code = err?.code || '';
                    console.error('[Google Auth] code:', code, '| message:', err?.message);
                    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
                      // Utilisateur a fermé le popup — pas d'erreur à afficher
                    } else if (code === 'auth/unauthorized-domain') {
                      setError('Domaine non autorisé. Ajoutez ce domaine dans Firebase Console → Authentication → Domaines autorisés.');
                    } else if (code === 'auth/operation-not-allowed') {
                      setError('Connexion Google non activée. Activez-la dans Firebase Console → Authentication → Sign-in method.');
                    } else if (code === 'auth/account-exists-with-different-credential') {
                      setError('Un compte existe déjà avec cet email. Connectez-vous avec email/mot de passe.');
                    } else if (code === 'auth/popup-blocked') {
                      setError('Popup bloquée. Autorisez les popups pour ce site dans votre navigateur.');
                    } else if (code === 'auth/network-request-failed') {
                      setError('Erreur réseau. Vérifiez votre connexion internet.');
                    } else {
                      setError(`Erreur Google (${code || err?.message || 'inconnue'}). Vérifiez la console du navigateur.`);
                    }
                  } finally {
                    setSocialLoading(null);
                  }
                }}
                disabled={!!socialLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                         color: HColors.cream, fontFamily: 'var(--font-nunito)' }}>
                {socialLoading === p.id
                  ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                  : p.icon}
                {p.label}
              </button>
            ))}
          </div>

          <p className="mt-5 text-center text-sm" style={{ color: 'rgba(245,230,200,0.4)', fontFamily: 'var(--font-nunito)' }}>
            {mode === 'login' ? "Pas encore de compte ?" : "Déjà un compte ?"}
            {' '}
            <button type="button" onClick={handleModeSwitch}
              className="font-semibold transition-colors hover:opacity-100"
              style={{ color: HColors.gold }}>
              {mode === 'login' ? "S'inscrire" : 'Se connecter'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
