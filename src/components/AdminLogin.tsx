import { useState } from 'react';
import { Shield, Lock, Mail, AlertCircle, Eye, EyeOff, Home, Loader } from 'lucide-react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { KenteLine } from './ui/KenteLine';
import { HColors, HAlpha } from '../styles/homeci-tokens';

interface AdminLoginProps {
  onSuccess: () => void;
}

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, 'profiles', cred.user.uid));
      if (!snap.exists() || snap.data()?.role !== 'admin') {
        await signOut(auth);
        setError('Accès non autorisé. Ce portail est réservé aux administrateurs.');
        return;
      }
      onSuccess();
    } catch (err: any) {
      if (['auth/wrong-password','auth/user-not-found','auth/invalid-credential'].includes(err.code)) {
        setError('Identifiants incorrects. Veuillez réessayer.');
      } else {
        setError(err.message || 'Une erreur est survenue.');
      }
    } finally {
      setLoading(false);
    }
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
        {/* Card */}
        <div className="rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}` }}>
          <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#D4A017,#C07C3E,#2D6A4F,#D4A017)', backgroundSize: '200%' }} />

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                style={{ background: HAlpha.gold10, border: `2px solid ${HAlpha.gold30}` }}>
                <Shield className="w-8 h-8" style={{ color: HColors.gold }} />
              </div>
              <h1 className="font-bold mb-1"
                style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '2rem' }}>
                Portail Administrateur
              </h1>
              <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                Étape 1 sur 2 — Identification
              </p>
              {/* Stepper */}
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="w-8 h-1.5 rounded-full" style={{ background: HColors.gold }} />
                <div className="w-8 h-1.5 rounded-full" style={{ background: HAlpha.gold20 }} />
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl flex items-start gap-3"
                style={{ background: HAlpha.bord10, border: `1px solid ${HAlpha.bord25}` }}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: HColors.bordeaux }} />
                <p className="text-sm" style={{ color: HColors.bordeaux, fontFamily: 'var(--font-nunito)' }}>{error}</p>
              </div>
            )}

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: HColors.brown }} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    disabled={loading} placeholder="admin@homeci.ci"
                    className="w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all"
                    style={{ background: HColors.creamBg, border: `1.5px solid ${HAlpha.gold20}`,
                             color: HColors.darkBrown, fontFamily: 'var(--font-nunito)', fontSize: '0.9rem' }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: HColors.brown }} />
                  <input type={showPassword ? 'text' : 'password'} required value={password}
                    onChange={e => setPassword(e.target.value)} disabled={loading} placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 rounded-xl outline-none transition-all"
                    style={{ background: HColors.creamBg, border: `1.5px solid ${HAlpha.gold20}`,
                             color: HColors.darkBrown, fontFamily: 'var(--font-nunito)', fontSize: '0.9rem' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-all hover:opacity-70"
                    style={{ color: HColors.brown }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                style={{ background: 'linear-gradient(135deg,#D4A017,#C07C3E)', color: HColors.night,
                         fontFamily: 'var(--font-nunito)', fontSize: '0.95rem' }}>
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                {loading ? 'Vérification…' : 'Connexion Sécurisée'}
              </button>
            </form>

            {/* Sécurité */}
            <div className="mt-6 pt-5 border-t space-y-2" style={{ borderColor: HAlpha.gold15 }}>
              {['Chiffrement SSL/TLS end-to-end', 'Protection brute force active', 'Code de session dynamique généré à la connexion'].map(txt => (
                <div key={txt} className="flex items-center gap-2 text-xs"
                  style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: HColors.green }} />
                  {txt}
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: HAlpha.cream40, fontFamily: 'var(--font-nunito)' }}>
          Toutes les tentatives de connexion sont enregistrées
        </p>
      </div>
    </div>
  );
}
