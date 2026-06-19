import { useState } from 'react';
import { Shield, AlertCircle, Loader, Smartphone } from 'lucide-react';
import { twoFactorService } from '../services/twoFactorService';
import { HColors, HAlpha } from '../styles/homeci-tokens';

interface AdminTwoFactorVerifyProps {
  userId: string;
  onSuccess: () => void;
  onBack: () => void;
}

export default function AdminTwoFactorVerify({ userId, onSuccess, onBack }: AdminTwoFactorVerifyProps) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length !== 6) return;

    setLoading(true);
    setError('');
    try {
      const isValid = await twoFactorService.verifyToken(userId, token);
      if (isValid) {
        onSuccess();
      } else {
        setError('Code incorrect. Vérifiez votre application d\'authentification et réessayez.');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la vérification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl max-w-md mx-auto"
      style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}` }}>
      <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#FF6B00,#009E49,#FFFFFF,#D4A017)' }} />
      <div className="p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: HAlpha.gold10, border: `2px solid ${HAlpha.gold30}` }}>
            <Smartphone className="w-8 h-8" style={{ color: HColors.gold }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>
            Vérification 2FA
          </h2>
          <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            Étape 2 sur 2 — Entrez le code de votre application
          </p>
          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="w-8 h-1.5 rounded-full" style={{ background: HColors.gold }} />
            <div className="w-8 h-1.5 rounded-full" style={{ background: HColors.gold }} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-2fa-code" className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-center"
              style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
              Code à 6 chiffres
            </label>
            <input
              id="admin-2fa-code"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full text-center text-3xl font-mono font-bold tracking-[0.5em] py-4 rounded-xl outline-none focus:ring-2 focus:ring-[#D4A017]/40 transition-all"
              style={{ background: HColors.creamBg, border: `2px solid ${HAlpha.gold25}`, color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: HAlpha.bord10, border: `1px solid ${HAlpha.bord25}` }}>
              <AlertCircle className="w-4 h-4 shrink-0" style={{ color: HColors.bordeaux }} />
              <p className="text-sm" style={{ color: HColors.bordeaux, fontFamily: 'var(--font-nunito)' }}>{error}</p>
            </div>
          )}

          <button type="submit" disabled={token.length !== 6 || loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#FF6B00,#D4A017)', color: '#FFFFFF', fontFamily: 'var(--font-nunito)', fontSize: '0.95rem' }}>
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
            {loading ? 'Vérification…' : 'Vérifier et Accéder'}
          </button>
        </form>

        <button onClick={onBack}
          className="w-full mt-3 py-2.5 rounded-xl font-bold text-xs transition-all hover:bg-[rgba(212,160,23,0.08)]"
          style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
          ← Retour
        </button>

        <div className="mt-5 pt-4 border-t space-y-2" style={{ borderColor: HAlpha.gold15 }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: HColors.vertCI }} />
            Code généré toutes les 30 secondes
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: HColors.vertCI }} />
            Fonctionne même hors connexion
          </div>
        </div>
      </div>
    </div>
  );
}
