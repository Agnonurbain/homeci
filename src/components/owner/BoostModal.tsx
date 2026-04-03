import { X, Zap } from 'lucide-react';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import { BOOST_PRICES } from '../../types/ad';
import type { Property } from '../../types/property';
import type { BoostDuration } from '../../types/ad';
import { KenteLine } from '../ui/KenteLine';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface BoostModalProps {
  property: Property;
  duration: BoostDuration;
  onDurationChange: (d: BoostDuration) => void;
  onConfirm: (config: { amount: number; title: string; description: string }) => void;
  onClose: () => void;
}

/* ── Component ────────────────────────────────────────────────────────────── */

export default function BoostModal({
  property, duration, onDurationChange, onConfirm, onClose
}: BoostModalProps) {
  const currentConfig = BOOST_PRICES[duration];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300" 
         style={{ background: 'rgba(10,22,14,0.85)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl scale-in-center" 
           style={{ background: HColors.night, border: `1.5px solid ${HAlpha.gold20}` }}>
        
        {/* Header */}
        <div className="px-6 pt-5 pb-3">
          <KenteLine />
          <div className="flex items-center justify-between mt-5 mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2.5" 
                style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>
              <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400/20" /> 
              Sponsoriser le bien
            </h2>
            <button onClick={onClose} 
                    className="p-2 rounded-xl transition-all hover:bg-white/10" 
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
              <X className="w-4 h-4" style={{ color: 'rgba(245,230,200,0.5)' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-8 space-y-6">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,230,200,0.85)', fontFamily: 'var(--font-nunito)' }}>
              Propulsez <strong>{property.title}</strong> en tête des résultats de recherche. Les biens sponsorisés reçoivent en moyenne <span className="text-gold font-bold">3x plus de contacts</span>.
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-3 opacity-60" 
                   style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }}>
              Choisir la durée de visibilité
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(Object.keys(BOOST_PRICES) as unknown as BoostDuration[]).map(d => (
                <button key={d} 
                  onClick={() => onDurationChange(Number(d) as BoostDuration)}
                  className="py-4 rounded-2xl text-center transition-all group relative overflow-hidden"
                  style={duration === Number(d)
                    ? { background: HAlpha.gold15, border: `2px solid ${HColors.gold}`, color: HColors.cream }
                    : { background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)', color: 'rgba(245,230,200,0.5)' }}>
                  <div className="text-xs font-bold font-nunito">{BOOST_PRICES[d].label}</div>
                  <div className="text-sm font-bold mt-1" style={{ color: duration === Number(d) ? HColors.gold : 'inherit' }}>
                    {BOOST_PRICES[d].price} <span className="text-[10px] opacity-60">FCFA</span>
                  </div>
                  {duration === Number(d) && (
                    <div className="absolute top-0 right-0 w-8 h-8 bg-gold rotate-45 translate-x-4 -translate-y-4 flex items-end justify-center pb-1">
                      <Zap className="w-2.5 h-2.5 text-night -rotate-45" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => onConfirm({ 
              amount: currentConfig.price, 
              title: 'Sponsoriser le bien', 
              description: `Boost Premium (${currentConfig.label}) : ${property.title}` 
            })}
            className="w-full py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-orange-950/20"
            style={{ 
              background: 'linear-gradient(135deg,#FF6B00,#D4A017)', 
              color: '#FFFFFF', 
              fontFamily: 'var(--font-nunito)' 
            }}>
            Activer le Boost ({currentConfig.price} FCFA)
          </button>
          
          <p className="text-center text-[10px] opacity-40 italic" style={{ color: HColors.cream }}>
            Paiement sécurisé via Orange Money, MTN MoMo, Wave ou Carte Bancaire.
          </p>
        </div>
      </div>
    </div>
  );
}
