import { useState, useEffect, useRef } from 'react';
import { Shield, Key, CheckCircle, RefreshCw, Home, Loader, AlertCircle } from 'lucide-react';
import { KenteLine } from './ui/KenteLine';
import { HColors, HAlpha } from '../styles/homeci-tokens';

interface AdminAccessCodeProps {
  onSuccess: () => void;
}

// Génère un code alphanumérique sécurisé de 8 caractères
function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans 0/O/1/I pour lisibilité
  let code = '';
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  for (let i = 0; i < 8; i++) {
    code += chars[array[i] % chars.length];
  }
  return code;
}

const SESSION_CODE_KEY = 'homeci_admin_session_code';
const SESSION_CODE_EXPIRY = 'homeci_admin_session_expiry';
const CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getOrCreateSessionCode(): string {
  // Vérifie si un code valide existe déjà en session
  const existing = sessionStorage.getItem(SESSION_CODE_KEY);
  const expiry = sessionStorage.getItem(SESSION_CODE_EXPIRY);
  if (existing && expiry && Date.now() < parseInt(expiry)) return existing;
  // Génère un nouveau code
  const newCode = generateSessionCode();
  sessionStorage.setItem(SESSION_CODE_KEY, newCode);
  sessionStorage.setItem(SESSION_CODE_EXPIRY, String(Date.now() + CODE_TTL_MS));
  return newCode;
}

export function clearSessionCode(): void {
  sessionStorage.removeItem(SESSION_CODE_KEY);
  sessionStorage.removeItem(SESSION_CODE_EXPIRY);
}

export default function AdminAccessCode({ onSuccess }: AdminAccessCodeProps) {
  const [sessionCode] = useState(() => getOrCreateSessionCode());
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(CODE_TTL_MS);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Countdown
  useEffect(() => {
    const expiry = parseInt(sessionStorage.getItem(SESSION_CODE_EXPIRY) || '0');
    const interval = setInterval(() => {
      const remaining = expiry - Date.now();
      if (remaining <= 0) {
        clearSessionCode();
        window.location.reload();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const progressPct = (timeLeft / CODE_TTL_MS) * 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      if (input.toUpperCase() === sessionCode) {
        setConfirmed(true);
        setTimeout(() => onSuccess(), 800);
      } else {
        setError('Code incorrect. Recopiez exactement le code affiché ci-dessus.');
        setInput('');
        inputRef.current?.focus();
      }
      setLoading(false);
    }, 400);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative"
      style={{ background: `linear-gradient(135deg, ${HColors.night} 0%, #1A0E00 100%)` }}>
      <KenteLine height={4} className="fixed top-0 left-0 right-0 z-50" />

      <button onClick={() => window.location.pathname = '/'}
        className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:opacity-80"
        style={{ background: HAlpha.gold10, border: `1px solid ${HAlpha.gold25}`, color: HColors.brownMid, fontFamily: 'var(--font-nunito)', fontSize: '0.875rem' }}>
        <Home className="w-4 h-4" /> Accueil
      </button>

      <div className="max-w-md w-full">
        <div className="rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}` }}>
          <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#D4A017,#C07C3E,#2D6A4F,#D4A017)', backgroundSize: '200%' }} />

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                style={{ background: confirmed ? HAlpha.green10 : HAlpha.gold10,
                         border: `2px solid ${confirmed ? HAlpha.green25 : HAlpha.gold30}` }}>
                {confirmed
                  ? <CheckCircle className="w-8 h-8" style={{ color: HColors.green }} />
                  : <Key className="w-8 h-8" style={{ color: HColors.gold }} />}
              </div>
              <h1 className="font-bold mb-1"
                style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '2rem' }}>
                {confirmed ? 'Accès accordé !' : 'Code de session'}
              </h1>
              <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                {confirmed ? 'Redirection vers le tableau de bord…' : 'Étape 2 sur 2 — Vérification'}
              </p>
              {/* Stepper */}
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="w-8 h-1.5 rounded-full" style={{ background: HColors.green }} />
                <div className="w-8 h-1.5 rounded-full" style={{ background: confirmed ? HColors.green : HColors.gold }} />
              </div>
            </div>

            {!confirmed && (
              <>
                {/* Code affiché */}
                <div className="mb-5 rounded-2xl p-5 text-center"
                  style={{ background: HColors.night, border: `1px solid ${HAlpha.gold25}` }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                    style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
                    Votre code de session
                  </p>

                  {/* Code en grandes lettres */}
                  <div className="flex items-center justify-center gap-1.5 mb-4">
                    {sessionCode.split('').map((char, i) => (
                      <div key={i} className="w-9 h-11 rounded-lg flex items-center justify-center font-mono font-bold text-xl"
                        style={{ background: HAlpha.gold10, border: `1px solid ${HAlpha.gold30}`, color: HColors.gold }}>
                        {char}
                      </div>
                    ))}
                  </div>

                  {/* Expiry bar */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: HAlpha.gold10 }}>
                      <div className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${progressPct}%`,
                                 background: progressPct > 50 ? HColors.green : progressPct > 20 ? HColors.gold : HColors.bordeaux }} />
                    </div>
                    <span className="text-xs font-mono shrink-0"
                      style={{ color: progressPct > 20 ? HColors.brownMid : HColors.bordeaux, fontFamily: 'var(--font-nunito)' }}>
                      {minutes}:{seconds.toString().padStart(2, '0')}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: HAlpha.cream40, fontFamily: 'var(--font-nunito)' }}>
                    Ce code expire dans {minutes}min {seconds}s
                  </p>

                  <button onClick={handleCopy}
                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg mx-auto text-xs font-medium transition-all hover:opacity-80"
                    style={{ background: HAlpha.gold10, border: `1px solid ${HAlpha.gold25}`,
                             color: copied ? HColors.green : HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
                    {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>

                {/* Info */}
                <div className="mb-4 p-3 rounded-xl flex items-start gap-2"
                  style={{ background: HAlpha.navy08, border: `1px solid ${HAlpha.navy20}` }}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: HColors.navy }} />
                  <p className="text-xs" style={{ color: HColors.navy, fontFamily: 'var(--font-nunito)' }}>
                    Ce code est généré automatiquement pour cette session. Recopiez-le dans le champ ci-dessous pour confirmer votre identité.
                  </p>
                </div>

                {/* Erreur */}
                {error && (
                  <div className="mb-4 p-3 rounded-xl flex items-start gap-2"
                    style={{ background: HAlpha.bord10, border: `1px solid ${HAlpha.bord25}` }}>
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: HColors.bordeaux }} />
                    <p className="text-xs" style={{ color: HColors.bordeaux, fontFamily: 'var(--font-nunito)' }}>{error}</p>
                  </div>
                )}

                {/* Saisie */}
                <form onSubmit={handleSubmit}>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                    style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
                    Confirmez le code
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value.toUpperCase())}
                    placeholder="Ex: AB3K7P2Z"
                    maxLength={8}
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl outline-none text-center font-mono text-lg tracking-[0.3em] font-bold mb-4"
                    style={{ background: HColors.creamBg, border: `1.5px solid ${HAlpha.gold25}`,
                             color: HColors.darkBrown }}
                  />
                  <button type="submit" disabled={loading || input.length < 8}
                    className="w-full py-3.5 rounded-xl font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#D4A017,#C07C3E)', color: HColors.night,
                             fontFamily: 'var(--font-nunito)' }}>
                    {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                    {loading ? 'Vérification…' : 'Accéder au Dashboard'}
                  </button>
                </form>
              </>
            )}

            {confirmed && (
              <div className="flex justify-center py-4">
                <Loader className="w-8 h-8 animate-spin" style={{ color: HColors.gold }} />
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: HAlpha.cream40, fontFamily: 'var(--font-nunito)' }}>
          Code unique par session — invalidé à la déconnexion
        </p>
      </div>
    </div>
  );
}
