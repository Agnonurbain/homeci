import { Calendar, MapPin, Bed, Maximize, CheckCircle, Eye, Phone, MessageSquare, X } from 'lucide-react';
import type { VisitRequest } from '../../services/visitService';
import type { Property } from '../../services/propertyService';
import { VISIT_STATUS_TENANT as VISIT_STATUS } from '../../constants/visitStatus';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import ScrollTimePicker from '../ScrollTimePicker';
import { useState } from 'react';

interface VisitsTabProps {
  visitRequests: VisitRequest[];
  visitProperties: Record<string, Property>;
  onViewProperty: (id: string) => void;
  onOpenChat: (visit: VisitRequest) => void;
  chatLoadingId: string | null;
  onAcceptCounter: (visit: VisitRequest) => void;
  onProposeCounter: (visitId: string, date: string, time: string) => void;
  onReplan: (property: Property) => void;
  onCancel?: (visitId: string) => void;
}

function formatPrice(p: number) {
  return new Intl.NumberFormat('fr-FR').format(p) + ' FCFA';
}

export default function VisitsTab({
  visitRequests,
  visitProperties,
  onViewProperty,
  onOpenChat,
  chatLoadingId,
  onAcceptCounter,
  onProposeCounter,
  onReplan,
  onCancel
}: VisitsTabProps) {
  const [counterForm, setCounterForm] = useState<{ visitId: string; date: string; time: string } | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'confirmed'>('all');

  if (visitRequests.length === 0) {
    return (
      <div className="rounded-2xl p-16 text-center"
        style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
        <Calendar className="w-14 h-14 mx-auto mb-4" style={{ color: HAlpha.gold25 }} />
        <h3 className="text-lg font-semibold mb-1"
          style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>Aucune demande</h3>
        <p className="text-sm mb-6" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
          Ouvrez la fiche d'un bien pour planifier une visite
        </p>
      </div>
    );
  }

  const filteredVisits = visitRequests.filter(v => {
    if (activeFilter === 'pending') return v.status === 'pending' || v.status === 'counter_proposed';
    if (activeFilter === 'confirmed') return v.status === 'accepted' || v.status === 'completed';
    return true;
  });

  const filters: { key: typeof activeFilter; label: string }[] = [
    { key: 'all', label: 'Toutes' },
    { key: 'pending', label: 'En attente' },
    { key: 'confirmed', label: 'Confirmées' },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: '1.8rem',
            fontWeight: 700,
            color: HColors.darkBrown,
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Mes Visites
        </h2>
        <p
          className="text-sm"
          style={{
            fontFamily: 'var(--font-nunito)',
            color: HColors.brown,
            margin: '0.25rem 0 0',
          }}
        >
          {visitRequests.length} demande{visitRequests.length > 1 ? 's' : ''} de visite
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map(f => {
          const isActive = activeFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{
                background: isActive ? HAlpha.gold10 : HAlpha.gold08,
                border: `1px solid ${isActive ? HAlpha.gold25 : HAlpha.gold15}`,
                color: isActive ? HColors.gold : HColors.brown,
                fontWeight: isActive ? 700 : 500,
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {filteredVisits
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map(visit => {
          const vsKey = visit.status === 'counter_proposed' && visit.counter_proposed_by === 'tenant'
            ? 'counter_waiting' : visit.status;
          const vs = VISIT_STATUS[vsKey] || VISIT_STATUS['pending'];
          const prop = visitProperties[visit.property_id];
          const img = prop?.images?.[0];

          return (
            <div key={visit.id} className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
              style={{
                background: HColors.white, border: `1px solid ${vs.border}`,
                boxShadow: '0 2px 12px rgba(26,14,0,0.06)'
              }}>

              <div className="h-1" style={{ background: vs.bg }} />

              <div className="flex gap-4 p-4">
                {img ? (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0">
                    <img src={img} alt={visit.property_title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(212,160,23,0.07)', border: `1px solid ${HAlpha.gold15}` }}>
                    <MapPin className="w-7 h-7" style={{ color: HAlpha.gold40 }} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-bold text-sm leading-tight truncate"
                      style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1rem' }}>
                      {visit.property_title}
                    </h3>
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0"
                      style={{
                        background: vs.bg, color: vs.text, border: `1px solid ${vs.border}`,
                        fontFamily: 'var(--font-nunito)'
                      }}>
                      {vs.icon} {vs.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs mb-1.5 flex-wrap"
                    style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" style={{ color: HColors.orangeCI }} />{visit.property_city}
                    </span>
                    {prop?.price && (
                      <span className="font-bold" style={{ color: HColors.orangeCI }}>
                        {formatPrice(prop.price)}{prop.transaction_type !== 'vente' ? '/mois' : ''}
                      </span>
                    )}
                    {prop && prop.bedrooms > 0 && (
                      <span className="flex items-center gap-1">
                        <Bed className="w-3 h-3" />{prop.bedrooms} ch.
                      </span>
                    )}
                    {prop?.surface_area && (
                      <span className="flex items-center gap-1">
                        <Maximize className="w-3 h-3" />{prop.surface_area} m²
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs">
                    <Calendar className="w-3.5 h-3.5" style={{ color: HColors.orangeCI }} />
                    <span className="font-medium" style={{ color: HColors.brownDark }}>
                      {visit.status === 'counter_proposed' && visit.counter_date
                        ? <>{new Date(visit.counter_date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'long' })} à {visit.counter_time}</>
                        : <>{new Date(visit.preferred_date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'long' })} à {visit.preferred_time}</>
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Counter Propositions */}
              {visit.status === 'counter_proposed' && visit.counter_proposed_by === 'owner' && (
                <div className="mx-2 sm:mx-4 mb-4 p-4 rounded-xl"
                  style={{ background: HAlpha.terra08, border: '1px solid rgba(192,124,62,0.3)' }}>
                  <p className="text-xs font-semibold mb-1 flex items-center gap-1.5"
                    style={{ color: HColors.brownDeep, fontFamily: 'var(--font-nunito)' }}>
                    <Calendar className="w-3.5 h-3.5" /> Le propriétaire propose une nouvelle date
                  </p>
                  <p className="text-base font-bold mb-3"
                    style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
                    {visit.counter_date ? new Date(visit.counter_date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' }) : ''} à {visit.counter_time}
                  </p>

                  {counterForm?.visitId === visit.id ? (
                    <div className="space-y-3 pt-3" style={{ borderTop: '1px solid rgba(192,124,62,0.25)' }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-terra-dark uppercase mb-1 block">Nouvelle Date</label>
                          <input type="date" value={counterForm.date}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={e => setCounterForm(f => f ? { ...f, date: e.target.value } : f)}
                            className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                            style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(192,124,62,0.3)' }} />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-terra-dark uppercase mb-1 block">Nouvelle Heure</label>
                          <ScrollTimePicker value={counterForm.time} onChange={v => setCounterForm(f => f ? { ...f, time: v } : f)} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setCounterForm(null)} className="flex-1 px-3 py-2 text-xs rounded-xl font-medium border border-gray-200">Annuler</button>
                        <button onClick={() => { onProposeCounter(visit.id, counterForm.date, counterForm.time); setCounterForm(null); }}
                          disabled={!counterForm.date || !counterForm.time}
                          className="flex-1 px-3 py-2 text-xs rounded-xl font-semibold bg-navy text-white disabled:opacity-50">
                          Envoyer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => onAcceptCounter(visit)}
                        className="flex-1 px-3 py-2.5 text-xs font-semibold rounded-xl bg-orange-600 text-white hover:bg-orange-700 transition-colors">
                        <CheckCircle className="w-3.5 h-3.5 inline mr-1" /> Confirmer
                      </button>
                      <button onClick={() => setCounterForm({ visitId: visit.id, date: '', time: '' })}
                        className="flex-1 px-3 py-2.5 text-xs font-medium rounded-xl border border-orange-200 bg-orange-50 text-orange-900">
                        Proposer autre chose
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Actions Footer */}
              <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
                <button onClick={() => onViewProperty(visit.property_id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                  <Eye className="w-3.5 h-3.5" /> Voir le bien
                </button>

                {visit.status === 'accepted' && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 border border-green-100">
                    <Phone className="w-3.5 h-3.5" /> Contact révélé après paiement caution
                  </div>
                )}

                {visit.status !== 'rejected' && (
                  <button onClick={() => onOpenChat(visit)}
                    disabled={chatLoadingId === visit.id || (visit.status !== 'accepted' && visit.status !== 'completed')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                    style={{
                      background: (visit.status === 'accepted' || visit.status === 'completed') ? 'linear-gradient(135deg,#FF6B00,#D4A017)' : '#e5e7eb',
                      color: (visit.status === 'accepted' || visit.status === 'completed') ? '#FFFFFF' : '#9ca3af',
                    }}>
                    <MessageSquare className="w-3.5 h-3.5" /> Discuter
                  </button>
                )}

                {visit.status === 'rejected' && (
                   <button onClick={() => prop && onReplan(prop)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-navy-50 text-navy-600 border border-navy-100">
                    <Calendar className="w-3.5 h-3.5" /> Replanifier
                  </button>
                )}

                {onCancel && (visit.status === 'pending' || visit.status === 'counter_proposed') && (
                  <button onClick={() => onCancel(visit.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors">
                    <X className="w-3.5 h-3.5" /> Annuler
                  </button>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}
