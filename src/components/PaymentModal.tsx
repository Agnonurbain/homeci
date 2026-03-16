import { useState } from 'react';
import { Phone, CheckCircle, Loader, Shield, ArrowRight, X } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import { KenteLine } from './ui/KenteLine';

// ─── Providers Mobile Money ─────────────────────────────────────────────────

interface MoMoProvider {
  id: string;
  name: string;
  color: string;
  bg: string;
  prefix: string;
  logo: string; // emoji/text logo
}

const PROVIDERS: MoMoProvider[] = [
  { id: 'orange', name: 'Orange Money', color: '#FF6600', bg: 'rgba(255,102,0,0.12)', prefix: '07', logo: '🟠' },
  { id: 'mtn',    name: 'MTN MoMo',    color: '#FFCC00', bg: 'rgba(255,204,0,0.12)', prefix: '05', logo: '🟡' },
  { id: 'wave',   name: 'Wave',         color: '#1DC3E2', bg: 'rgba(29,195,226,0.12)', prefix: '01', logo: '🔵' },
  { id: 'flooz',  name: 'Moov Flooz',   color: '#00A651', bg: 'rgba(0,166,81,0.12)', prefix: '01', logo: '🟢' },
];

// ─── Types ──────────────────────────────────────────────────────────────────

type Step = 'provider' | 'phone' | 'otp' | 'processing' | 'success';

export interface PaymentConfig {
  /** Titre affiché dans le modal (ex: "Frais de publication") */
  title: string;
  /** Description courte */
  description: string;
  /** Montant en FCFA */
  amount: number;
  /** Icône optionnelle */
  icon?: React.ReactNode;
}

interface PaymentModalProps {
  config: PaymentConfig;
  onSuccess: () => void;
  onClose: () => void;
}

// ─── Composant ──────────────────────────────────────────────────────────────

export default function PaymentModal({ config, onSuccess, onClose }: PaymentModalProps) {
  useBodyScrollLock(true);

  const [step, setStep] = useState<Step>('provider');
  const [provider, setProvider] = useState<MoMoProvider | null>(null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n);

  // ── Handlers ──

  const handleSelectProvider = (p: MoMoProvider) => {
    setProvider(p);
    setPhone(p.prefix);
    setStep('phone');
    setError('');
  };

  const handleSubmitPhone = () => {
    const cleaned = phone.replace(/\s/g, '');
    if (cleaned.length < 10) {
      setError('Numéro invalide — 10 chiffres requis');
      return;
    }
    setError('');
    setStep('otp');
  };

  const handleSubmitOtp = () => {
    if (otp.length < 4) {
      setError('Code à 4 chiffres requis');
      return;
    }
    setError('');
    setStep('processing');

    // Simuler le traitement (2 secondes)
    setTimeout(() => {
      setStep('success');
      // Auto-ferme après 2s
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }, 2500);
  };

  // ── Rendu par étape ──

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(10,22,14,0.88)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: HColors.night, border: `1px solid ${HAlpha.gold20}` }}>

        {/* Header */}
        <div className="px-6 pt-5 pb-3">
          <KenteLine />
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: HAlpha.gold12, border: `1px solid ${HAlpha.gold20}` }}>
                {config.icon || <Phone className="w-5 h-5" style={{ color: HColors.gold }} />}
              </div>
              <div>
                <h2 className="text-base font-bold"
                  style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>
                  {config.title}
                </h2>
                <p className="text-xs" style={{ color: 'rgba(245,230,200,0.5)', fontFamily: 'var(--font-nunito)' }}>
                  {config.description}
                </p>
              </div>
            </div>
            {step !== 'processing' && step !== 'success' && (
              <button onClick={onClose} className="p-1.5 rounded-lg transition-all hover:opacity-70"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <X className="w-4 h-4" style={{ color: 'rgba(245,230,200,0.4)' }} />
              </button>
            )}
          </div>

          {/* Montant */}
          <div className="mt-4 p-3 rounded-xl text-center"
            style={{ background: HAlpha.gold05, border: `1px solid ${HAlpha.gold15}` }}>
            <p className="text-xs mb-0.5" style={{ color: 'rgba(245,230,200,0.5)', fontFamily: 'var(--font-nunito)' }}>
              Montant à payer
            </p>
            <p className="text-2xl font-bold"
              style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)' }}>
              {formatPrice(config.amount)}
            </p>
          </div>
        </div>

        {/* Contenu par étape */}
        <div className="px-6 pb-6 pt-2">

          {/* ── Étape 1 : Sélection opérateur ── */}
          {step === 'provider' && (
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'rgba(245,230,200,0.5)', fontFamily: 'var(--font-nunito)' }}>
                Choisissez votre opérateur
              </p>
              {PROVIDERS.map(p => (
                <button key={p.id} onClick={() => handleSelectProvider(p)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl transition-all hover:opacity-90"
                  style={{ background: p.bg, border: `1px solid ${p.color}33` }}>
                  <span className="text-2xl">{p.logo}</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold" style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }}>
                      {p.name}
                    </p>
                    <p className="text-xs" style={{ color: 'rgba(245,230,200,0.4)' }}>
                      Numéros en {p.prefix}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4" style={{ color: p.color }} />
                </button>
              ))}

              <div className="flex items-center gap-2 mt-3 pt-3"
                style={{ borderTop: `1px solid ${HAlpha.gold10}` }}>
                <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(245,230,200,0.3)' }} />
                <p className="text-xs" style={{ color: 'rgba(245,230,200,0.3)', fontFamily: 'var(--font-nunito)' }}>
                  Paiement sécurisé — Mode test (aucun débit réel)
                </p>
              </div>
            </div>
          )}

          {/* ── Étape 2 : Numéro de téléphone ── */}
          {step === 'phone' && provider && (
            <div className="space-y-4">
              <button onClick={() => { setStep('provider'); setError(''); }}
                className="text-xs flex items-center gap-1 transition-all hover:opacity-70"
                style={{ color: 'rgba(245,230,200,0.5)', fontFamily: 'var(--font-nunito)' }}>
                ← Changer d'opérateur
              </button>

              <div className="flex items-center gap-2 p-2.5 rounded-xl"
                style={{ background: provider.bg, border: `1px solid ${provider.color}33` }}>
                <span className="text-lg">{provider.logo}</span>
                <span className="text-sm font-semibold" style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }}>
                  {provider.name}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5"
                  style={{ color: 'rgba(245,230,200,0.6)', fontFamily: 'var(--font-nunito)' }}>
                  Numéro {provider.name}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(245,230,200,0.5)', fontFamily: 'var(--font-nunito)' }}>
                    +225
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                    placeholder={`${provider.prefix} XX XX XX XX`}
                    maxLength={14}
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: `1px solid ${error ? 'rgba(139,29,29,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      color: HColors.cream, fontFamily: 'var(--font-nunito)',
                    }}
                    autoFocus
                  />
                </div>
                {error && (
                  <p className="text-xs mt-1.5" style={{ color: '#E05555', fontFamily: 'var(--font-nunito)' }}>{error}</p>
                )}
              </div>

              <button onClick={handleSubmitPhone}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{ background: provider.color, color: '#fff', fontFamily: 'var(--font-nunito)' }}>
                Recevoir le code de confirmation
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Étape 3 : Code OTP ── */}
          {step === 'otp' && provider && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3"
                  style={{ background: provider.bg }}>
                  <Phone className="w-6 h-6" style={{ color: provider.color }} />
                </div>
                <p className="text-sm" style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }}>
                  Un code a été envoyé au
                </p>
                <p className="text-base font-bold" style={{ color: HColors.gold, fontFamily: 'var(--font-nunito)' }}>
                  +225 {phone}
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(245,230,200,0.4)', fontFamily: 'var(--font-nunito)' }}>
                  (Mode test — entrez n'importe quel code à 4 chiffres)
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • •"
                  maxLength={6}
                  className="w-full px-4 py-3.5 rounded-xl text-center text-xl tracking-[0.5em] outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${error ? 'rgba(139,29,29,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    color: HColors.cream, fontFamily: 'var(--font-nunito)',
                    letterSpacing: '0.4em',
                  }}
                  autoFocus
                />
                {error && (
                  <p className="text-xs mt-1.5 text-center" style={{ color: '#E05555', fontFamily: 'var(--font-nunito)' }}>{error}</p>
                )}
              </div>

              <button onClick={handleSubmitOtp}
                disabled={otp.length < 4}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: provider.color, color: '#fff', fontFamily: 'var(--font-nunito)' }}>
                Confirmer le paiement — {formatPrice(config.amount)}
              </button>

              <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                className="w-full text-xs text-center transition-all hover:opacity-70"
                style={{ color: 'rgba(245,230,200,0.4)', fontFamily: 'var(--font-nunito)' }}>
                Modifier le numéro
              </button>
            </div>
          )}

          {/* ── Étape 4 : Traitement ── */}
          {step === 'processing' && provider && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 animate-pulse"
                style={{ background: provider.bg }}>
                <Loader className="w-8 h-8 animate-spin" style={{ color: provider.color }} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }}>
                Traitement en cours...
              </p>
              <p className="text-xs" style={{ color: 'rgba(245,230,200,0.4)', fontFamily: 'var(--font-nunito)' }}>
                Veuillez patienter, ne fermez pas cette fenêtre
              </p>
            </div>
          )}

          {/* ── Étape 5 : Succès ── */}
          {step === 'success' && provider && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{ background: 'rgba(34,87,46,0.2)', border: '2px solid rgba(34,87,46,0.4)' }}>
                <CheckCircle className="w-8 h-8" style={{ color: HColors.vertCI }} />
              </div>
              <p className="text-lg font-bold mb-1"
                style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>
                Paiement confirmé !
              </p>
              <p className="text-sm mb-2" style={{ color: HColors.gold, fontFamily: 'var(--font-nunito)' }}>
                {formatPrice(config.amount)} via {provider.name}
              </p>
              <p className="text-xs" style={{ color: 'rgba(245,230,200,0.4)', fontFamily: 'var(--font-nunito)' }}>
                Référence : HMCI-{Date.now().toString(36).toUpperCase()}
              </p>
              <div className="mt-3 px-3 py-1.5 rounded-full inline-flex items-center gap-1 text-xs"
                style={{ background: HAlpha.vertCI15, color: HColors.vertCI, fontFamily: 'var(--font-nunito)' }}>
                <Shield className="w-3 h-3" /> Mode test — Aucun débit réel
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
