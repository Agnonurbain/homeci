import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Building2, User, Home, Briefcase, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KenteLine } from './ui/KenteLine';
import { HColors, HAlpha } from '../styles/homeci-tokens';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

const ROLES = [
  { value: 'locataire',    label: 'Locataire / Acheteur', icon: Home,      desc: 'Je cherche un bien' },
  { value: 'proprietaire', label: 'Propriétaire',          icon: Building2, desc: 'Je loue ou vends' },
  { value: 'agent',        label: 'Agent immobilier',      icon: Briefcase, desc: 'Je représente des biens' },
  { value: 'notaire',      label: 'Notaire Agréé',         icon: Award,     desc: 'Je certifie les biens' },
];

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'locataire' | 'proprietaire' | 'agent' | 'notaire'>('locataire');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) { setMode(initialMode); setError(''); }
  }, [isOpen, initialMode]);

  const handleModeSwitch = () => {
    setMode(m => m === 'login' ? 'signup' : 'login');
    setError(''); setEmail(''); setPassword(''); setFullName(''); setShowPassword(false);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        if (!fullName.trim()) throw new Error('Veuillez entrer votre nom complet');
        await signUp(email, password, fullName, role);
      }
      onClose();
      setEmail(''); setPassword(''); setFullName('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue';
      if (msg.includes('Invalid login credentials')) setError('Email ou mot de passe incorrect');
      else if (msg.includes('User already registered')) setError('Cet email est déjà utilisé');
      else if (msg.includes('Email not confirmed')) setError('Veuillez confirmer votre email');
      else setError(msg);
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
  const inputFocusStyle = 'focus:ring-2 focus:ring-yellow-500/30';

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>

      <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(160deg, #0D1F12 0%, #1A0E00 100%)',
                 border: '1px solid rgba(212,160,23,0.25)' }}>

        {/* Kente top stripe */}
        <KenteLine height={5} />

        {/* Adinkra subtle bg */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.03 }}>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="auth-adinkra" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <circle cx="40" cy="40" r="28" fill="none" stroke="#D4A017" strokeWidth="1"/>
                <circle cx="40" cy="40" r="14" fill="none" stroke="#D4A017" strokeWidth="0.8"/>
                <line x1="40" y1="12" x2="40" y2="68" stroke="#D4A017" strokeWidth="0.7"/>
                <line x1="12" y1="40" x2="68" y2="40" stroke="#D4A017" strokeWidth="0.7"/>
                <line x1="20" y1="20" x2="60" y2="60" stroke="#D4A017" strokeWidth="0.4"/>
                <line x1="60" y1="20" x2="20" y2="60" stroke="#D4A017" strokeWidth="0.4"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#auth-adinkra)"/>
          </svg>
        </div>

        <div className="relative z-10 p-8">

          {/* Close */}
          <button onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full transition-all hover:opacity-80"
            style={{ background: HAlpha.gold10, border: '1px solid rgba(212,160,23,0.2)' }}>
            <X className="w-4 h-4" style={{ color: HColors.gold }} />
          </button>

          {/* Logo + Title */}
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: HColors.gold }}>
              <Building2 className="w-4 h-4" style={{ color: HColors.night }} />
            </div>
            <span className="text-lg font-bold tracking-widest"
              style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)', letterSpacing: '0.18em' }}>
              HOMECI
            </span>
          </div>

          <h2 className="mt-4 mb-1 font-bold"
            style={{ fontFamily: 'var(--font-cormorant)', fontSize: '2rem',
                     color: HColors.cream, lineHeight: 1.2 }}>
            {mode === 'login' ? 'Bon retour' : 'Bienvenue'}
          </h2>
          <p className="mb-7 text-sm"
            style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
            {mode === 'login'
              ? 'Connectez-vous à votre espace HOMECI'
              : 'Créez votre compte et rejoignez HOMECI'}
          </p>

          {/* Mode switcher tabs */}
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

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm"
              style={{ background: HAlpha.bord30, border: '1px solid rgba(139,29,29,0.5)',
                       color: '#FFAAAA', fontFamily: 'var(--font-nunito)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Signup fields */}
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                    style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
                    Nom complet
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: HAlpha.gold50 }} />
                    <input type="text" value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Votre nom et prénom"
                      className={`${inputCls} ${inputFocusStyle} pl-10`}
                      style={inputStyle} required />
                  </div>
                </div>

                {/* Role selector */}
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                    style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
                    Type de compte
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map(r => {
                      const Icon = r.icon;
                      const active = role === r.value;
                      return (
                        <button key={r.value} type="button" onClick={() => setRole(r.value as typeof role)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all"
                          style={active
                            ? { background: HAlpha.gold20, border: '1px solid rgba(212,160,23,0.6)' }
                            : { background: 'rgba(13,31,18,0.5)', border: '1px solid rgba(212,160,23,0.12)' }}>
                          <Icon className="w-4 h-4 shrink-0"
                            style={{ color: active ? HColors.gold : 'rgba(245,230,200,0.4)' }} />
                          <div>
                            <p className="text-xs font-semibold leading-tight"
                              style={{ color: active ? HColors.cream : HAlpha.cream60,
                                       fontFamily: 'var(--font-nunito)' }}>
                              {r.label}
                            </p>
                            <p className="text-xs leading-tight mt-0.5"
                              style={{ color: active ? HAlpha.cream60 : 'rgba(245,230,200,0.3)',
                                       fontFamily: 'var(--font-nunito)' }}>
                              {r.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
                Email
              </label>
              <input type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className={`${inputCls} ${inputFocusStyle}`}
                style={inputStyle} required />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
                Mot de passe
              </label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Minimum 6 caractères' : '••••••••'}
                  className={`${inputCls} ${inputFocusStyle} pr-12`}
                  style={inputStyle} required minLength={6} />
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
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 mt-2"
              style={{ background: 'linear-gradient(135deg, #D4A017 0%, #C07C3E 100%)',
                       color: HColors.night, fontFamily: 'var(--font-nunito)' }}>
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                    Chargement...
                  </span>
                : mode === 'login' ? 'Se connecter' : "Créer mon compte"}
            </button>
          </form>

          {/* Switch mode link */}
          <p className="mt-5 text-center text-sm"
            style={{ color: 'rgba(245,230,200,0.4)', fontFamily: 'var(--font-nunito)' }}>
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
