import {
  Calendar, Users, MapPin, CheckCircle, MessageSquare
} from 'lucide-react';
import type { VisitRequest } from '../../services/visitService';
import type { VisitFilter } from '../../hooks/useOwnerVisits';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import { VISIT_STATUS_STYLES, VISIT_STATUS_FALLBACK } from '../../constants/visitStatus';

/* ── Props ─────────────────────────────────────────────────────────────────── */

interface VisitRequestsTabProps {
  visits: VisitRequest[];
  filteredVisits: VisitRequest[];
  filter: VisitFilter;
  setFilter: (f: VisitFilter) => void;
  actionLoading: boolean;
  chatLoadingId: string | null;
  onRespond: (visit: VisitRequest) => void;
  onMarkCompleted: (visit: VisitRequest) => void;
  onOpenChat: (visit: VisitRequest) => void;
}

/* ── Component ────────────────────────────────────────────────────────────── */

export default function VisitRequestsTab({
  visits, filteredVisits, filter, setFilter,
  actionLoading, chatLoadingId,
  onRespond, onMarkCompleted, onOpenChat,
}: VisitRequestsTabProps) {
  return (
    <div>
      <div className="mb-7">
        <h1 className="font-bold mb-1"
          style={{ fontFamily: 'var(--font-cormorant)', fontSize: '2rem', color: HColors.darkBrown }}>
          Demandes de Visite
        </h1>
        <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
          {visits.length} demande(s) reçue(s)
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'pending', 'accepted', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={filter === f
              ? { background: HColors.navyDark, color: HColors.cream, fontFamily: 'var(--font-nunito)' }
              : { background: HColors.white, color: HColors.brown, border: '1px solid rgba(212,160,23,0.2)', fontFamily: 'var(--font-nunito)' }}>
            {f === 'all' ? `Toutes (${visits.length})`
              : f === 'pending' ? `En attente (${visits.filter(v => v.status === 'pending').length})`
                : f === 'accepted' ? `Acceptées (${visits.filter(v => v.status === 'accepted' || v.status === 'completed').length})`
                  : `Refusées (${visits.filter(v => v.status === 'rejected').length})`}
          </button>
        ))}
      </div>

      {filteredVisits.length === 0 ? (
        <div className="rounded-2xl p-14 text-center"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <Calendar className="w-14 h-14 mx-auto mb-4" style={{ color: HAlpha.gold25 }} />
          <p className="text-lg font-semibold mb-1"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>Aucune demande</p>
          <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            Les demandes de visite apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVisits.map(visit => {
            const vs = VISIT_STATUS_STYLES[visit.status] ?? VISIT_STATUS_FALLBACK;
            return (
              <div key={visit.id} className="rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                style={{
                  background: HColors.white, border: `1px solid ${HAlpha.gold15}`,
                  boxShadow: '0 2px 10px rgba(26,14,0,0.05)'
                }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: vs.bg, color: vs.text, border: `1px solid ${vs.border}`,
                          fontFamily: 'var(--font-nunito)'
                        }}>
                        {vs.icon} {vs.label}
                      </span>
                      <h3 className="font-bold text-sm" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1rem' }}>
                        {visit.property_title}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm"
                      style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" style={{ color: HColors.orangeDark }} />{visit.tenant_name}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" style={{ color: HColors.orangeDark }} />
                        {visit.status === 'counter_proposed' && visit.counter_proposed_by === 'tenant' && visit.counter_date
                          ? <>{new Date(visit.counter_date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'long' })} à {visit.counter_time}</>
                          : <>{new Date(visit.preferred_date).toLocaleDateString('fr-FR')} à {visit.preferred_time}</>
                        }
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" style={{ color: HColors.orangeDark }} />{visit.property_city}
                      </div>
                    </div>

                    {/* Counter proposals */}
                    {visit.status === 'counter_proposed' && visit.counter_proposed_by === 'tenant' && visit.counter_date && (
                      <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                        style={{
                          background: HAlpha.orange10, border: '1px solid rgba(192,124,62,0.25)',
                          color: HColors.brownDeep, fontFamily: 'var(--font-nunito)'
                        }}>
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        Le locataire propose : <strong className="ml-1">
                          {new Date(visit.counter_date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'long' })} à {visit.counter_time}
                        </strong>
                        <span className="ml-2 opacity-60" style={{ textDecoration: 'line-through' }}>
                          (initial : {new Date(visit.preferred_date).toLocaleDateString('fr-FR')} à {visit.preferred_time})
                        </span>
                      </div>
                    )}
                    {visit.status === 'counter_proposed' && visit.counter_proposed_by === 'owner' && visit.counter_date && (
                      <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                        style={{
                          background: HAlpha.navy08, border: '1px solid rgba(26,58,107,0.2)',
                          color: HColors.navy, fontFamily: 'var(--font-nunito)'
                        }}>
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        Votre proposition : <strong className="ml-1">
                          {new Date(visit.counter_date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'long' })} à {visit.counter_time}
                        </strong> — en attente du locataire
                      </div>
                    )}
                  </div>

                  {(visit.status === 'pending' || (visit.status === 'counter_proposed' && visit.counter_proposed_by === 'tenant')) && (
                    <button onClick={() => onRespond(visit)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold shrink-0 transition-all hover:opacity-90"
                      style={visit.status === 'counter_proposed'
                        ? { background: HColors.navyDark, color: HColors.cream, fontFamily: 'var(--font-nunito)' }
                        : {
                          background: HAlpha.gold12, color: HColors.brownMid,
                          border: '1px solid rgba(212,160,23,0.3)', fontFamily: 'var(--font-nunito)'
                        }}>
                      Répondre
                    </button>
                  )}
                  {visit.status === 'accepted' && (
                    <button onClick={() => onMarkCompleted(visit)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl text-sm font-semibold shrink-0 transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                      style={{ background: HColors.vertCI, color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
                      <CheckCircle className="w-3.5 h-3.5" /> Visite effectuée
                    </button>
                  )}
                  {visit.status !== 'rejected' && (
                    <button onClick={() => onOpenChat(visit)}
                      disabled={chatLoadingId === visit.id || (visit.status !== 'accepted' && visit.status !== 'completed')}
                      className="px-4 py-2 rounded-xl flex items-center gap-1.5 text-sm font-semibold shrink-0 transition-all hover:opacity-90 disabled:opacity-50"
                      style={{
                        background: (visit.status === 'accepted' || visit.status === 'completed')
                          ? 'linear-gradient(135deg,#FF6B00,#D4A017)'
                          : '#e5e7eb',
                        color: (visit.status === 'accepted' || visit.status === 'completed') ? '#FFFFFF' : '#9ca3af',
                        fontFamily: 'var(--font-nunito)'
                      }}
                      title={(visit.status !== 'accepted' && visit.status !== 'completed') ? "Le chat sera accessible dès que vous aurez accepté la visite." : ""}>
                      {chatLoadingId === visit.id
                        ? <div className="w-3.5 h-3.5 animate-spin rounded-full border-b-2 border-white" />
                        : <MessageSquare className="w-3.5 h-3.5" />}
                      Discuter
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
