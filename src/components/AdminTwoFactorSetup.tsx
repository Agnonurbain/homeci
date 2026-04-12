import { useState } from 'react';
import { Shield, Copy, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { twoFactorService } from '../services/twoFactorService';
import { HColors, HAlpha } from '../styles/homeci-tokens';

interface AdminTwoFactorSetupProps {
  onCompleted: () => void;
  onSkip: () => void;
}

export default function AdminTwoFactorSetup({ onCompleted, onSkip }: AdminTwoFactorSetupProps) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<'intro' | 'setup' | 'verify'>('intro');
  const [secret, setSecret] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const { secret: s, otpauthUrl: url } = await twoFactorService.generateSecret(
        user.uid,
        profile?.email || 'admin@homeci.ci'
      );
      setSecret(s);
      setOtpauthUrl(url);
      setStep('setup');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération du secret.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!user || token.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const isValid = await twoFactorService.verifyAndEnable(user.uid, token);
      if (isValid) {
        setStep('verify');
        setTimeout(onCompleted, 1500);
      } else {
        setError('Code incorrect. Vérifiez votre application d\'authentification.');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la vérification.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (step === 'intro') {
    return (
      <div className="rounded-3xl overflow-hidden shadow-2xl max-w-lg mx-auto"
        style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}` }}>
        <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#FF6B00,#009E49,#FFFFFF,#D4A017)' }} />
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: HAlpha.vertCI10, border: `2px solid ${HAlpha.vertCI25}` }}>
              <Shield className="w-8 h-8" style={{ color: HColors.vertCI }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>
              Authentification à deux facteurs
            </h2>
            <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
              Sécurisez votre compte admin avec un code supplémentaire
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {['Protection contre les accès non autorisés', 'Code généré par votre smartphone', 'Fonctionne hors connexion'].map(txt => (
              <div key={txt} className="flex items-center gap-2 text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                <CheckCircle className="w-4 h-4 shrink-0" style={{ color: HColors.vertCI }} />
                {txt}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ background: HAlpha.bord10, border: `1px solid ${HAlpha.bord25}` }}>
              <AlertCircle className="w-4 h-4 shrink-0" style={{ color: HColors.bordeaux }} />
              <p className="text-sm" style={{ color: HColors.bordeaux, fontFamily: 'var(--font-nunito)' }}>{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onSkip}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:bg-gray-100"
              style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
              Plus tard
            </button>
            <button onClick={handleGenerate} disabled={loading}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: HColors.vertCI, fontFamily: 'var(--font-nunito)' }}>
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Configurer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'setup') {
    return (
      <div className="rounded-3xl overflow-hidden shadow-2xl max-w-lg mx-auto"
        style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}` }}>
        <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#FF6B00,#009E49,#FFFFFF,#D4A017)' }} />
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold mb-2" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>
              Étape 1 : Scanner le QR Code
            </h2>
            <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
              Ouvrez Google Authenticator (ou équivalent) et scannez ce code
            </p>
          </div>

          {/* QR Code (using Google Charts API for simplicity) */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white rounded-xl border-2 border-dashed" style={{ borderColor: HAlpha.gold25 }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`}
                alt="QR Code 2FA"
                className="w-48 h-48"
              />
            </div>
          </div>

          {/* Secret key for manual entry */}
          <div className="mb-6">
            <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
              Ou entrez manuellement :
            </p>
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: HColors.creamBg, border: `1px solid ${HAlpha.gold20}` }}>
              <code className="flex-1 font-mono text-sm font-bold tracking-wider" style={{ color: HColors.darkBrown }}>
                {secret}
              </code>
              <button onClick={copyToClipboard}
                className="p-2 rounded-lg transition-all hover:bg-white"
                style={{ color: HColors.gold }}>
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button onClick={() => setStep('verify')}
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
            style={{ background: HColors.vertCI, fontFamily: 'var(--font-nunito)' }}>
            J'ai scanné le code →
          </button>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="rounded-3xl overflow-hidden shadow-2xl max-w-lg mx-auto"
        style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}` }}>
        <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#FF6B00,#009E49,#FFFFFF,#D4A017)' }} />
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: HAlpha.vertCI10 }}>
            <CheckCircle className="w-8 h-8" style={{ color: HColors.vertCI }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>
            2FA Activé avec succès !
          </h2>
          <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            Votre compte est maintenant protégé par l'authentification à deux facteurs.
          </p>
        </div>
      </div>
    );
  }

  // Verification step
  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl max-w-lg mx-auto"
      style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}` }}>
      <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#FF6B00,#009E49,#FFFFFF,#D4A017)' }} />
      <div className="p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: HAlpha.gold10, border: `2px solid ${HAlpha.gold30}` }}>
            <Shield className="w-8 h-8" style={{ color: HColors.gold }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>
            Étape 2 : Vérifier le code
          </h2>
          <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            Entrez le code à 6 chiffres affiché sur votre application
          </p>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="w-full text-center text-3xl font-mono font-bold tracking-[0.5em] py-4 rounded-xl outline-none"
            style={{ background: HColors.creamBg, border: `2px solid ${HAlpha.gold25}`, color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ background: HAlpha.bord10, border: `1px solid ${HAlpha.bord25}` }}>
            <AlertCircle className="w-4 h-4 shrink-0" style={{ color: HColors.bordeaux }} />
            <p className="text-sm" style={{ color: HColors.bordeaux, fontFamily: 'var(--font-nunito)' }}>{error}</p>
          </div>
        )}

        <button onClick={handleVerify} disabled={token.length !== 6 || loading}
          className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: HColors.vertCI, fontFamily: 'var(--font-nunito)' }}>
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          Vérifier et Activer
        </button>
      </div>
    </div>
  );
}
