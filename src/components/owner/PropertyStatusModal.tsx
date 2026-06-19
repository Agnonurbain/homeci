import { Home, CheckCircle, RefreshCw } from 'lucide-react';
import type { Property } from '../../types/property';
import { KenteLine } from '../ui/KenteLine';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import { useEscapeClose } from '../../hooks/useEscapeClose';

/* ── Props ─────────────────────────────────────────────────────────────────── */

interface PropertyStatusModalProps {
  property: Property;
  loading: boolean;
  onSelectStatus: (status: 'rented' | 'sold' | 'published' | 'failed') => void;
  onClose: () => void;
}

/* ── Component ────────────────────────────────────────────────────────────── */

export default function PropertyStatusModal({ property, loading, onSelectStatus, onClose }: PropertyStatusModalProps) {
  useEscapeClose(onClose);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: 'rgba(10,61,31,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: HColors.night, border: `1px solid ${HAlpha.gold20}` }}>
        <KenteLine height={3} />
        <div className="px-6 pt-5 pb-6">
          <h2 className="text-center text-lg font-bold mb-2"
            style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)', fontSize: '1.4rem' }}>
            Quel est le résultat de la visite ?
          </h2>
          <p className="text-center text-sm mb-5" style={{ color: HAlpha.cream60, fontFamily: 'var(--font-nunito)' }}>
            Bien : <strong style={{ color: HColors.orangeDark }}>« {property.title} »</strong>
          </p>

          <div className="space-y-3 mb-5">
            {/* Loué */}
            <button onClick={() => onSelectStatus('rented')} disabled={loading}
              className="w-full flex items-center gap-4 p-4 rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: HAlpha.vertCI10, border: `1px solid ${HAlpha.vertCI25}` }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: HColors.vertCI }}>
                <Home className="w-5 h-5" style={{ color: '#FFFFFF' }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold" style={{ color: HColors.vertCI, fontFamily: 'var(--font-nunito)' }}>
                  Le bien a été loué
                </p>
                <p className="text-xs" style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
                  Le bien sera retiré des annonces
                </p>
              </div>
            </button>

            {/* Vendu */}
            <button onClick={() => onSelectStatus('sold')} disabled={loading}
              className="w-full flex items-center gap-4 p-4 rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: HAlpha.navy08, border: `1px solid ${HAlpha.navy18}` }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: HColors.navy }}>
                <CheckCircle className="w-5 h-5" style={{ color: '#FFFFFF' }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold" style={{ color: HColors.navy, fontFamily: 'var(--font-nunito)' }}>
                  Le bien a été vendu
                </p>
                <p className="text-xs" style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
                  Le bien sera retiré des annonces
                </p>
              </div>
            </button>

            {/* Transaction non aboutie */}
            <button onClick={() => onSelectStatus('published')} disabled={loading}
              className="w-full flex items-center gap-4 p-4 rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: HAlpha.orange08, border: `1px solid ${HAlpha.orange15}` }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: HColors.orangeCI }}>
                <RefreshCw className="w-5 h-5" style={{ color: '#FFFFFF' }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold" style={{ color: HColors.orangeDark, fontFamily: 'var(--font-nunito)' }}>
                  Transaction non aboutie
                </p>
                <p className="text-xs" style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
                  Le bien redevient disponible pour d'autres visites
                </p>
              </div>
            </button>
          </div>

          <div className="p-3 rounded-xl mb-4"
            style={{ background: 'rgba(139,29,29,0.08)', border: '1px solid rgba(139,29,29,0.2)' }}>
            <p className="text-xs leading-relaxed" style={{ color: HColors.errorText, fontFamily: 'var(--font-nunito)' }}>
              <strong>⚠️ Rappel :</strong> Conformément aux CGU (Art. 4a), toute déclaration mensongère
              engage votre responsabilité civile. Passé le délai de 3 jours, le bien sera automatiquement
              remis en disponible.
            </p>
          </div>

          <button onClick={onClose}
            className="w-full py-2 text-xs text-center transition-all hover:opacity-80"
            style={{ color: HAlpha.cream40, fontFamily: 'var(--font-nunito)' }}>
            Je mettrai à jour plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
