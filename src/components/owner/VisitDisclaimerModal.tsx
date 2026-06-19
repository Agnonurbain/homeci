import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import type { DisclaimerData } from '../../hooks/useOwnerVisits';
import { KenteLine } from '../ui/KenteLine';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import { useEscapeClose } from '../../hooks/useEscapeClose';

/* ── Props ─────────────────────────────────────────────────────────────────── */

interface VisitDisclaimerModalProps {
  data: DisclaimerData;
  onClose: () => void;
}

/* ── Component ────────────────────────────────────────────────────────────── */

export default function VisitDisclaimerModal({ data, onClose }: VisitDisclaimerModalProps) {
  useEscapeClose(onClose);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: 'rgba(10,61,31,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: HColors.night, border: `1px solid ${HAlpha.orange20}` }}>
        <KenteLine height={3} />
        <div className="px-6 pt-5 pb-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: HAlpha.orange10, border: `2px solid ${HAlpha.orange25}` }}>
            <AlertTriangle className="w-7 h-7" style={{ color: HColors.orangeDark }} />
          </div>
          <h2 className="text-center text-lg font-bold mb-3"
            style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)', fontSize: '1.4rem' }}>
            Visite confirmée — Vos obligations
          </h2>

          <div className="space-y-3 mb-5">
            <div className="p-3 rounded-xl" style={{ background: HAlpha.orange08, border: `1px solid ${HAlpha.orange15}` }}>
              <p className="text-sm font-semibold mb-1" style={{ color: HColors.orangeDark, fontFamily: 'var(--font-nunito)' }}>
                Bien : « {data.propertyTitle} »
              </p>
              <p className="text-xs" style={{ color: HAlpha.cream60, fontFamily: 'var(--font-nunito)' }}>
                Visite prévue le : <strong style={{ color: HColors.cream }}>
                  {new Date(data.visitDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </strong>
              </p>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: HAlpha.cream70, fontFamily: 'var(--font-nunito)' }}>
              Ce bien est désormais <strong style={{ color: HColors.orangeDark }}>en cours de transaction</strong>.
              Aucune autre demande de visite ne sera acceptée pendant cette période.
            </p>

            <p className="text-sm leading-relaxed" style={{ color: HAlpha.cream70, fontFamily: 'var(--font-nunito)' }}>
              Vous disposez d'un <strong style={{ color: HColors.cream }}>délai de 3 jours après la date de visite</strong> pour
              revenir sur la plateforme et mettre à jour le statut de votre bien :
            </p>

            <div className="flex flex-col gap-2 pl-2">
              <p className="text-xs flex items-center gap-2" style={{ color: HAlpha.cream60, fontFamily: 'var(--font-nunito)' }}>
                <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: HColors.vertCI }} />
                <span><strong style={{ color: HColors.vertCI }}>Loué / Vendu</strong> — le bien sera retiré des annonces</span>
              </p>
              <p className="text-xs flex items-center gap-2" style={{ color: HAlpha.cream60, fontFamily: 'var(--font-nunito)' }}>
                <RefreshCw className="w-3.5 h-3.5 shrink-0" style={{ color: HColors.gold }} />
                <span><strong style={{ color: HColors.gold }}>Transaction non aboutie</strong> — le bien redevient disponible</span>
              </p>
            </div>

            <div className="p-3 rounded-xl" style={{ background: 'rgba(139,29,29,0.08)', border: '1px solid rgba(139,29,29,0.2)' }}>
              <p className="text-xs leading-relaxed" style={{ color: HColors.errorText, fontFamily: 'var(--font-nunito)' }}>
                <strong>⚠️ Avertissement :</strong> Conformément aux CGU que vous avez acceptées (Art. 4a),
                toute déclaration mensongère sur l'état de votre bien engage votre responsabilité civile
                au sens des articles 1382 et suivants du Code civil ivoirien.
                Passé le délai de 3 jours sans mise à jour de votre part, le bien sera automatiquement remis en disponible sur la plateforme.
              </p>
            </div>
          </div>

          <button onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: HColors.orangeCI, color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
            J'ai compris mes obligations
          </button>
        </div>
      </div>
    </div>
  );
}
