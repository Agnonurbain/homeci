import { useState } from 'react';
import {
  Calendar, Users, MapPin, CheckCircle, MessageSquare, FileText
} from 'lucide-react';
import type { VisitRequest } from '../../services/visitService';
import type { VisitFilter } from '../../hooks/useOwnerVisits';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import { VISIT_STATUS_STYLES, VISIT_STATUS_FALLBACK } from '../../constants/visitStatus';
import DossierViewerModal from './DossierViewerModal';

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
  const [viewingDossier, setViewingDossier] = useState<{ id: string, name: string } | null>(null);

  return (
    <div>
      <div className="mb-7 text-center sm:text-left">
        <h1 className="font-bold mb-1"
          style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.5rem, 5vw, 2rem)', color: HColors.darkBrown }}>
          Demandes de Visite
        </h1>
        <p className="text-xs sm:text-sm uppercase tracking-widest font-bold opacity-50" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col xs:flex-row xs:items-center gap-2 mb-3">
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold w-fit"
                        style={{
                          background: vs.bg, color: vs.text, border: `1px solid ${vs.border}`,
                          fontFamily: 'var(--font-nunito)'
                        }}>
                        {vs.icon} {vs.label}
                      </span>
                      <h3 className="font-bold text-sm truncate" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1rem' }}>
                        {visit.property_title}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-[11px] sm:text-sm"
                      style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                      <div className="flex items-center gap-1.5 truncate">
                        <Users className="w-3.5 h-3.5" style={{ color: HColors.orangeDark }} />{visit.tenant_name}
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5" style={{ color: HColors.orangeDark }} />
                        {visit.status === 'counter_proposed' && visit.counter_proposed_by === 'tenant' && visit.counter_date
                          ? <>{new Date(visit.counter_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} à {visit.counter_time}</>
                          : <>{new Date(visit.preferred_date).toLocaleDateString('fr-FR')} à {visit.preferred_time}</>
                        }
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5" style={{ color: HColors.orangeDark }} />{visit.property_city}
                      </div>
                      <button onClick={() => setViewingDossier({ id: visit.tenant_id, name: visit.tenant_name || 'Locataire' })}
                        className="flex items-center gap-1.5 px-2 py-1 rounded bg-navy-50 text-navy-700 hover:bg-navy-100 transition-colors w-fit group"
                        style={{ background: HAlpha.navy08, color: HColors.navy }}>
                        <FileText className="w-3 h-3 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Dossier</span>
                      </button>
                    </div>

                    {/* Counter proposals */}
                    {visit.status === 'counter_proposed' && visit.counter_proposed_by === 'tenant' && visit.counter_date && (
                      <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] sm:text-xs"
                        style={{
                          background: HAlpha.orange10, border: '1px solid rgba(192,124,62,0.25)',
                          color: HColors.brownDeep, fontFamily: 'var(--font-nunito)'
                        }}>
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        Proposition locataire : <strong className="ml-1">
                          {new Date(visit.counter_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} à {visit.counter_time}
                        </strong>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-row sm:flex-col lg:flex-row gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                    {(visit.status === 'pending' || (visit.status === 'counter_proposed' && visit.counter_proposed_by === 'tenant')) && (
                      <button onClick={() => onRespond(visit)}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all hover:opacity-90"
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
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5"
                        style={{ background: HColors.vertCI, color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
                        <CheckCircle className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Visite effectuée</span><span className="xs:hidden">Effectuée</span>
                      </button>
                    )}
                    {visit.status !== 'rejected' && (
                      <button onClick={() => onOpenChat(visit)}
                        disabled={chatLoadingId === visit.id || (visit.status !== 'accepted' && visit.status !== 'completed')}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                        style={{
                          background: (visit.status === 'accepted' || visit.status === 'completed')
                            ? 'linear-gradient(135deg,#FF6B00,#D4A017)'
                            : '#e5e7eb',
                          color: (visit.status === 'accepted' || visit.status === 'completed') ? '#FFFFFF' : '#9ca3af',
                          fontFamily: 'var(--font-nunito)'
                        }}>
                        {chatLoadingId === visit.id
                          ? <div className="w-3.5 h-3.5 animate-spin rounded-full border-b-2 border-white" />
                          : <MessageSquare className="w-3.5 h-3.5" />}
                        <span className="hidden xs:inline">Discuter</span><span className="xs:hidden">Chat</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NEW: Dossier Viewer Modal */}
      {viewingDossier && (
        <DossierViewerModal
          tenantId={viewingDossier.id}
          tenantName={viewingDossier.name}
          onClose={() => setViewingDossier(null)}
        />
      )}
    </div>
  );
}
