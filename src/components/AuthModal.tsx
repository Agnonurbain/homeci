import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Building2, User, Home, Briefcase, Award, Key, Loader, AlertCircle, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KenteLine } from './ui/KenteLine';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import { analyticsService } from '../services/analyticsService';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
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

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { signIn, signUp, signInWithProvider, sendPhoneOTP, verifyPhoneOTP, resetPassword } = useAuth();
  useBodyScrollLock(isOpen);
  const [socialLoading, setSocialLoading] = useState<string|null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [view, setView] = useState<'form' | 'forgotPassword' | 'resetSent'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'locataire' | 'proprietaire' | 'notaire'>('locataire');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Phone auth (locataire uniquement)
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneOTP, setPhoneOTP] = useState('');
  const [phoneStep, setPhoneStep] = useState<'number' | 'otp'>('number');
  const [phoneName, setPhoneName] = useState('');

  // Notaire invite code flow
  const [showNotaireCode, setShowNotaireCode] = useState(false);
  const [notaireCode, setNotaireCode] = useState('');
  const [notaireCodeError, setNotaireCodeError] = useState('');
  const [notaireCodeValid, setNotaireCodeValid] = useState(false);
  const [validatedCodeDocId, setValidatedCodeDocId] = useState<string | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode); setError(''); setView('form');
      setShowNotaireCode(false); setNotaireCode(''); setNotaireCodeError('');
      setNotaireCodeValid(false); setValidatedCodeDocId(null);
      setAuthMethod('email'); setPhoneNumber(''); setPhoneOTP('');
      setPhoneStep('number'); setPhoneName('');
    }
  }, [isOpen, initialMode]);

  const handleModeSwitch = () => {
    setMode(m => m === 'login' ? 'signup' : 'login');
    setError(''); setEmail(''); setPassword(''); setFullName(''); setView('form');
    setShowNotaireCode(false); setNotaireCode(''); setNotaireCodeError('');
    setNotaireCodeValid(false); setValidatedCodeDocId(null);
    setRole('locataire');
    setAuthMethod('email'); setPhoneNumber(''); setPhoneOTP('');
    setPhoneStep('number'); setPhoneName('');
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

  // ── Forgot password handler ──
  const handleResetPassword = async () => {
    setError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) { setError('Veuillez saisir votre adresse email.'); return; }
    if (!emailRegex.test(email.trim())) { setError('Adresse email invalide.'); return; }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setView('resetSent');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        setError('Aucun compte trouvé avec cet email. Vérifiez l\'adresse ou créez un compte.');
      } else if (code === 'auth/too-many-requests') {
        setError('Trop de tentatives. Réessayez dans quelques minutes.');
      } else if (code === 'auth/invalid-email') {
        setError('Adresse email invalide.');
      } else {
        setError('Erreur lors de l\'envoi. Vérifiez votre email et réessayez.');
      }
    } finally { setLoading(false); }
  };

  // ── Phone auth handlers ──
  const handleSendPhoneOTP = async () => {
    setError('');
    const cleaned = phoneNumber.replace(/\s/g, '');
    if (!/^(0[1579])\d{8}$/.test(cleaned)) {
      setError('Numéro ivoirien invalide (ex: 07 00 00 00 00).');
      return;
    }
    if (!phoneName.trim() && mode === 'signup') {
      setError('Veuillez entrer votre nom complet.');
      return;
    }
    setLoading(true);
    try {
      await sendPhoneOTP(cleaned, 'recaptcha-container');
      setPhoneStep('otp');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/invalid-phone-number') setError('Numéro de téléphone invalide.');
      else if (code === 'auth/too-many-requests') setError('Trop de tentatives. Réessayez dans quelques minutes.');
      else setError('Erreur d\'envoi du code. Vérifiez le numéro et réessayez.');
    } finally { setLoading(false); }
  };

  const handleVerifyPhoneOTP = async () => {
    setError('');
    if (phoneOTP.length < 6) { setError('Saisissez le code à 6 chiffres.'); return; }
    setLoading(true);
    try {
      await verifyPhoneOTP(phoneOTP, phoneName.trim() || 'Utilisateur');
      analyticsService.login('phone');
      onClose();
      setPhoneNumber(''); setPhoneOTP(''); setPhoneName(''); setPhoneStep('number');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/invalid-verification-code') setError('Code invalide. Vérifiez et réessayez.');
      else if (code === 'auth/code-expired') setError('Code expiré. Renvoyez un nouveau code.');
      else setError('Erreur de vérification. Réessayez.');
    } finally { setLoading(false); }
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
        analyticsService.login('email');
      } else {
        // Sécurité double : si panneau notaire ouvert sans code validé → bloquer
        if (showNotaireCode && !notaireCodeValid) {
          throw new Error('Veuillez valider votre code d\'invitation notaire avant de créer le compte.');
        }
        const finalRole = (showNotaireCode && notaireCodeValid) ? 'notaire' : role;
        await signUp(email, password, fullName, finalRole);
        analyticsService.signup('email', finalRole);
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
                  ? { background: HColors.orangeCI, color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }
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

          {/* ══════ VUE : MOT DE PASSE OUBLIÉ ══════ */}
          {view === 'forgotPassword' && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-sm" style={{ color: HAlpha.cream70, fontFamily: 'var(--font-nunito)' }}>
                  Saisissez l'email associé à votre compte. Vous recevrez un lien pour réinitialiser votre mot de passe.
                </p>
              </div>

              {/* Info par rôle */}
              <div className="p-3 rounded-xl text-xs leading-relaxed"
                style={{ background: HAlpha.orange08, border: `1px solid ${HAlpha.orange15}`,
                         color: HAlpha.cream60, fontFamily: 'var(--font-nunito)' }}>
                <strong style={{ color: HColors.orangeCI }}>Locataire :</strong> Si vous vous êtes inscrit par téléphone,
                vous n'avez pas de mot de passe — reconnectez-vous avec votre numéro.<br />
                <strong style={{ color: HColors.orangeCI }}>Propriétaire / Notaire :</strong> Utilisez l'email
                avec lequel vous avez créé votre compte ou connectez-vous avec Google.
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
                  Email
                </label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: 'rgba(13,31,18,0.7)', border: '1px solid rgba(212,160,23,0.25)',
                           color: HColors.cream, fontFamily: 'var(--font-nunito)' }} />
              </div>

              <button type="button" onClick={handleResetPassword} disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #D4A017 100%)',
                         color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                      Envoi en cours...
                    </span>
                  : 'Envoyer le lien de réinitialisation'}
              </button>

              <button type="button" onClick={() => { setView('form'); setError(''); }}
                className="w-full text-xs text-center transition-all hover:opacity-80"
                style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
                ← Retour à la connexion
              </button>
            </div>
          )}

          {/* ══════ VUE : EMAIL ENVOYÉ ══════ */}
          {view === 'resetSent' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                style={{ background: HAlpha.vertCI10, border: `2px solid ${HAlpha.vertCI25}` }}>
                <svg className="w-8 h-8" style={{ color: HColors.vertCI }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold"
                style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>
                Email envoyé !
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: HAlpha.cream60, fontFamily: 'var(--font-nunito)' }}>
                Un lien de réinitialisation a été envoyé à <strong style={{ color: HColors.orangeCI }}>{email}</strong>.
                Vérifiez votre boîte de réception (et vos spams).
              </p>
              <p className="text-xs" style={{ color: HAlpha.cream40, fontFamily: 'var(--font-nunito)' }}>
                Le lien expire dans 1 heure.
              </p>
              <button type="button" onClick={() => { setView('form'); setError(''); setEmail(''); }}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: HColors.orangeCI, color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
                Retour à la connexion
              </button>
            </div>
          )}

          {/* ══════ VUE : FORMULAIRE PRINCIPAL ══════ */}
          {view === 'form' && (
          <>
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
                            style={{ color: active ? HColors.orangeCI : 'rgba(245,230,200,0.4)' }} />
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
                          style={{ background: HAlpha.vertCI10, border: `1px solid ${HAlpha.vertCI25}` }}>
                          <Award className="w-4 h-4" style={{ color: HColors.vertCI }} />
                          <span className="text-xs font-semibold" style={{ color: HColors.vertCI, fontFamily: 'var(--font-nunito)' }}>
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
                              style={{ background: 'linear-gradient(135deg,#FF6B00,#D4A017)', color: '#FFFFFF',
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

            {/* ── Toggle Email / Téléphone (locataire uniquement) ── */}
            {(role === 'locataire' && !showNotaireCode) && (
              <div className="flex gap-2 mb-1">
                {(['email', 'phone'] as const).map(m => (
                  <button key={m} type="button" onClick={() => { setAuthMethod(m); setError(''); }}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={authMethod === m
                      ? { background: HAlpha.orange15, border: `2px solid ${HColors.orangeCI}`, color: HColors.orangeCI, fontFamily: 'var(--font-nunito)' }
                      : { background: 'rgba(13,31,18,0.5)', border: '1px solid rgba(245,230,200,0.1)', color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
                    {m === 'email' ? '✉️ Email' : '📱 Téléphone'}
                  </button>
                ))}
              </div>
            )}

            {/* ── Formulaire TÉLÉPHONE (locataire uniquement) ── */}
            {authMethod === 'phone' && role === 'locataire' ? (
              <div className="space-y-3">
                {phoneStep === 'number' ? (
                  <>
                    {mode === 'signup' && (
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                          style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
                          Nom complet
                        </label>
                        <input type="text" value={phoneName} onChange={e => setPhoneName(e.target.value)}
                          placeholder="Votre nom complet" className={inputCls} style={inputStyle} />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                        style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
                        Numéro de téléphone
                      </label>
                      <div className="flex gap-2">
                        <span className="flex items-center px-3 rounded-xl text-sm font-medium shrink-0"
                          style={{ background: 'rgba(13,31,18,0.7)', border: '1px solid rgba(212,160,23,0.2)',
                                   color: HColors.cream, fontFamily: 'var(--font-nunito)' }}>
                          +225
                        </span>
                        <input type="tel" value={phoneNumber}
                          onChange={e => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="07 00 00 00 00" maxLength={10}
                          className={`flex-1 ${inputCls}`} style={inputStyle} />
                      </div>
                    </div>
                    <button type="button" onClick={handleSendPhoneOTP} disabled={loading}
                      className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #D4A017 100%)',
                               color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
                      {loading
                        ? <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                            Envoi du code...
                          </span>
                        : 'Recevoir le code SMS'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                      style={{ background: HAlpha.vertCI10, border: `1px solid ${HAlpha.vertCI25}`,
                               color: HColors.vertCI, fontFamily: 'var(--font-nunito)' }}>
                      ✅ Code envoyé au +225 {phoneNumber}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                        style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
                        Code de vérification
                      </label>
                      <input type="text" value={phoneOTP}
                        onChange={e => setPhoneOTP(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="000000" maxLength={6}
                        className={`${inputCls} text-center text-lg tracking-[0.3em] font-mono`} style={inputStyle} />
                    </div>
                    <button type="button" onClick={handleVerifyPhoneOTP} disabled={loading}
                      className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #D4A017 100%)',
                               color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
                      {loading
                        ? <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                            Vérification...
                          </span>
                        : 'Vérifier et se connecter'}
                    </button>
                    <button type="button" onClick={() => { setPhoneStep('number'); setPhoneOTP(''); setError(''); }}
                      className="w-full text-xs text-center transition-all hover:opacity-80"
                      style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
                      ← Modifier le numéro
                    </button>
                  </>
                )}
              </div>
            ) : (
            <>
            {/* ── Formulaire EMAIL (tous les rôles) ── */}

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
              {mode === 'login' && (
                <button type="button" onClick={() => setView('forgotPassword')}
                  className="mt-1.5 text-xs transition-all hover:opacity-100"
                  style={{ color: HColors.orangeCI, fontFamily: 'var(--font-nunito)', opacity: 0.8 }}>
                  Mot de passe oublié ?
                </button>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading || (mode === 'signup' && showNotaireCode && !notaireCodeValid)}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 mt-2"
              style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #D4A017 100%)',
                       color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                    Chargement...
                  </span>
                : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
            </>
            )}
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
                    await signInWithProvider(p.id as 'google'|'facebook'|'twitter');
                    analyticsService.login('google');
                    onClose();
                  } catch (err: any) {
                    const code = err?.code || '';
                    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
                      // Utilisateur a fermé le popup — pas d'erreur
                    } else if (code === 'auth/unauthorized-domain') {
                      setError('Domaine non autorisé. Ajoutez ce domaine dans Firebase Console → Authentication → Domaines autorisés.');
                    } else if (code === 'auth/operation-not-allowed') {
                      setError('Connexion Google non activée. Activez-la dans Firebase Console → Authentication → Sign-in method.');
                    } else if (code === 'auth/account-exists-with-different-credential') {
                      setError('Un compte existe déjà avec cet email. Connectez-vous avec email/mot de passe.');
                    } else if (code === 'auth/popup-blocked') {
                      setError('Popup bloquée. Autorisez les popups pour ce site.');
                    } else {
                      setError(`Erreur connexion (${code || err?.message || 'inconnue'}).`);
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
              style={{ color: HColors.orangeCI }}>
              {mode === 'login' ? "S'inscrire" : 'Se connecter'}
            </button>
          </p>
          </>
          )}
        </div>
      </div>
      {/* Recaptcha invisible pour auth téléphone */}
      <div id="recaptcha-container" />
    </div>
  );
}
