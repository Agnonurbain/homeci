import { X, Calendar, Users, CheckCircle, XCircle } from 'lucide-react';
import type { VisitRequest } from '../../services/visitService';
import type { VisitAction } from '../../hooks/useOwnerVisits';
import { KenteLine } from '../ui/KenteLine';
import ScrollTimePicker from '../ScrollTimePicker';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import { useEscapeClose } from '../../hooks/useEscapeClose';

/* ── Props ─────────────────────────────────────────────────────────────────── */

interface VisitResponseModalProps {
  visit: VisitRequest;
  counterDate: string;
  counterTime: string;
  actionLoading: boolean;
  onCounterDateChange: (d: string) => void;
  onCounterTimeChange: (t: string) => void;
  onAction: (action: VisitAction) => void;
  onClose: () => void;
}

/* ── Component ────────────────────────────────────────────────────────────── */

export default function VisitResponseModal({
  visit, counterDate, counterTime, actionLoading,
  onCounterDateChange, onCounterTimeChange, onAction, onClose,
}: VisitResponseModalProps) {
  useEscapeClose(onClose);
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(160deg,#0D1F12,#1A0E00)',
          border: '1px solid rgba(212,160,23,0.25)'
        }}>
        <KenteLine />
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="font-bold mb-0.5"
                style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)', fontSize: '1.3rem' }}>
                Répondre à la demande
              </h3>
              <p className="text-sm" style={{ color: 'rgba(245,230,200,0.55)', fontFamily: 'var(--font-nunito)' }}>
                {visit.property_title}
              </p>
            </div>
            <button onClick={onClose}
              aria-label="Fermer le modal de visite"
              className="p-1.5 rounded-full transition-all hover:opacity-70"
              style={{ background: HAlpha.gold10, border: '1px solid rgba(212,160,23,0.2)' }}>
              <X className="w-4 h-4" style={{ color: HColors.gold }} />
            </button>
          </div>

          {/* Tenant info */}
          <div className="rounded-xl p-4 mb-4 text-sm"
            style={{ background: 'rgba(212,160,23,0.07)', border: `1px solid ${HAlpha.gold15}` }}>
            <div className="flex items-center gap-2" style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }}>
              <Users className="w-4 h-4" style={{ color: HColors.gold }} />
              <span className="font-medium">{visit.tenant_name}</span>
            </div>
          </div>

          {/* Date info */}
          {visit.status === 'counter_proposed' && visit.counter_proposed_by === 'tenant' && visit.counter_date ? (
            <>
              <div className="flex items-center gap-3 p-3 rounded-xl mb-2 text-sm"
                style={{ background: HAlpha.orange10, border: '1px solid rgba(192,124,62,0.25)' }}>
                <Calendar className="w-4 h-4 shrink-0" style={{ color: HColors.orangeDark }} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-0.5"
                    style={{ color: HColors.orangeDark, fontFamily: 'var(--font-nunito)' }}>Contre-proposition du locataire</p>
                  <p className="font-semibold" style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }}>
                    {new Date(visit.counter_date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} à {visit.counter_time}
                  </p>
                </div>
              </div>
              <p className="text-xs mb-4 pl-1" style={{ color: 'rgba(245,230,200,0.4)', fontFamily: 'var(--font-nunito)', textDecoration: 'line-through' }}>
                Date initiale : {new Date(visit.preferred_date).toLocaleDateString('fr-FR')} à {visit.preferred_time}
              </p>
            </>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl mb-4 text-sm"
              style={{ background: HAlpha.orange10, border: '1px solid rgba(192,124,62,0.25)' }}>
              <Calendar className="w-4 h-4 shrink-0" style={{ color: HColors.orangeDark }} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-0.5"
                  style={{ color: HColors.orangeDark, fontFamily: 'var(--font-nunito)' }}>Date demandée</p>
                <p className="font-semibold" style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }}>
                  {new Date(visit.preferred_date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} à {visit.preferred_time}
                </p>
              </div>
            </div>
          )}

          {/* Counter-date picker */}
          <div className="mb-5">
            <p className="text-sm font-semibold mb-2"
              style={{ color: HAlpha.cream70, fontFamily: 'var(--font-nunito)' }}>
              Proposer une autre date (optionnel)
            </p>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
              <div>
                <label htmlFor="visit-response-date" className="block text-[10px] sm:text-xs mb-1 uppercase font-bold tracking-wider" style={{ color: 'rgba(212,160,23,0.6)', fontFamily: 'var(--font-nunito)' }}>
                  Nouvelle date
                </label>
                <input id="visit-response-date" type="date" value={counterDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => onCounterDateChange(e.target.value)}
                  className="w-full px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#D4A017]/40"
                  style={{
                    background: 'rgba(13,31,18,0.7)', border: '1px solid rgba(212,160,23,0.2)',
                    color: HColors.cream, fontFamily: 'var(--font-nunito)'
                  }} />
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs mb-1 uppercase font-bold tracking-wider" style={{ color: 'rgba(212,160,23,0.6)', fontFamily: 'var(--font-nunito)' }}>Heure</label>
                <ScrollTimePicker value={counterTime} onChange={onCounterTimeChange} />
              </div>
            </div>
            {counterDate && counterTime && (
              <p className="mt-2 text-xs flex items-center gap-1"
                style={{ color: HColors.gold, fontFamily: 'var(--font-nunito)' }}>
                <Calendar className="w-3 h-3" />
                Proposition : {new Date(counterDate).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'long' })} à {counterTime}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            {counterDate && counterTime ? (
              <button onClick={() => onAction('counter')} disabled={actionLoading}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: HColors.navy, color: HColors.cream, fontFamily: 'var(--font-nunito)' }}>
                {actionLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" /> : <Calendar className="w-4 h-4" />}
                Proposer le {new Date(counterDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} à {counterTime}
              </button>
            ) : (
              <button onClick={() => onAction('accepted')} disabled={actionLoading}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#FF6B00,#D4A017)', color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
                {actionLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" /> : <CheckCircle className="w-4 h-4" />}
                Confirmer le {visit.status === 'counter_proposed' && visit.counter_proposed_by === 'tenant' && visit.counter_date
                  ? <>{new Date(visit.counter_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} à {visit.counter_time}</>
                  : <>{new Date(visit.preferred_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} à {visit.preferred_time}</>
                }
              </button>
            )}
            <button onClick={() => onAction('rejected')} disabled={actionLoading}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-80 disabled:opacity-50"
              style={{
                background: HAlpha.bord20, color: HColors.errorText,
                border: '1px solid rgba(139,29,29,0.35)', fontFamily: 'var(--font-nunito)'
              }}>
              <XCircle className="w-4 h-4" /> Refuser la demande
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
