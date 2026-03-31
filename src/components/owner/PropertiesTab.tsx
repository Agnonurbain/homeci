import {
  Plus, Home, Eye, Edit, Calendar, Star, CheckCircle, Clock,
  AlertTriangle, Zap, Download
} from 'lucide-react';
import type { Property } from '../../types/property';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import { TYPE_LABELS } from '../../constants/labels';
import { StatGridSkeleton, PropertyTableSkeleton } from '../Skeletons';

/* ── Constants ────────────────────────────────────────────────────────────── */

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  draft: { bg: HAlpha.gold05, text: HColors.brownMid, border: HAlpha.gold15, label: 'Brouillon' },
  pending: { bg: HAlpha.gold10, text: HColors.brownDeep, border: HAlpha.gold25, label: 'En attente' },
  published: { bg: HAlpha.vertCI10, text: HColors.vertDark, border: HAlpha.vertCI25, label: 'Publié' },
  rented: { bg: HAlpha.navy08, text: HColors.navy, border: HAlpha.navy20, label: 'Loué' },
  sold: { bg: HAlpha.bord10, text: HColors.bordeaux, border: HAlpha.bord25, label: 'Vendu' },
  failed: { bg: HAlpha.orange08, text: HColors.orangeCI, border: HAlpha.orange15, label: 'Non abouti' },
};

/* ── Sub-components ───────────────────────────────────────────────────────── */

function StatCard({ icon: Icon, label, value, accent = HColors.gold }: { icon: any; label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-2xl p-3 sm:p-5 text-center"
      style={{
        background: HColors.white, border: `1px solid ${HAlpha.gold15}`,
        boxShadow: '0 2px 12px rgba(26,14,0,0.05)',
        minWidth: 0, overflow: 'hidden'
      }}>
      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3"
        style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: accent }} />
      </div>
      <div className="text-xl sm:text-2xl font-bold" style={{ color: accent, fontFamily: 'var(--font-cormorant)' }}>{value}</div>
      <div className="text-[10px] sm:text-xs mt-0.5 truncate" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.draft;
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{
        background: s.bg, color: s.text, border: `1px solid ${s.border}`,
        fontFamily: 'var(--font-nunito)'
      }}>
      {s.label}
    </span>
  );
}

/* ── Props ─────────────────────────────────────────────────────────────────── */

interface PropertiesTabProps {
  properties: Property[];
  loading: boolean;
  stats: { total: number; published: number; pending: number; rented_sold: number; verified: number };
  submittingVerif: string | null;
  onAddProperty: () => void;
  onExportCSV: () => void;
  onViewProperty: (id: string) => void;
  onEditProperty: (id: string) => void;
  onStatusUpdate: (property: Property) => void;
  onAvailability: (property: Property) => void;
  onBoost: (property: Property) => void;
  onSubmitVerification: (property: Property) => Promise<void>;
}

/* ── Component ────────────────────────────────────────────────────────────── */

export default function PropertiesTab({
  properties, loading, stats, submittingVerif,
  onAddProperty, onExportCSV, onViewProperty, onEditProperty,
  onStatusUpdate, onAvailability, onBoost, onSubmitVerification,
}: PropertiesTabProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="font-bold mb-1"
            style={{ fontFamily: 'var(--font-cormorant)', fontSize: '2rem', color: HColors.darkBrown }}>
            Mes Biens
          </h1>
          <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            {stats.total} bien(s) enregistré(s)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onExportCSV}
            className="px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all hover:bg-gray-100 border border-gray-200"
            style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)', background: HColors.white }}>
            <Download className="w-4 h-4" /> Exporter CSV
          </button>
          <button onClick={onAddProperty}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all hover:opacity-90 active:scale-95 shadow-sm"
            style={{
              background: 'linear-gradient(135deg,#FF6B00,#D4A017)', color: '#FFFFFF',
              fontFamily: 'var(--font-nunito)'
            }}>
            <Plus className="w-4 h-4" /> Ajouter un bien
          </button>
        </div>
      </div>

      {loading ? (
        <>
          <StatGridSkeleton />
          <div className="mt-8"><PropertyTableSkeleton rows={4} /></div>
        </>
      ) : (
        <>
          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={CheckCircle} label="Publiés" value={stats.published} accent="#009E49" />
            <StatCard icon={Clock} label="En attente" value={stats.pending} accent="#D4A017" />
            <StatCard icon={Home} label="Loués/Vendus" value={stats.rented_sold} accent="#1A3A6B" />
            <StatCard icon={Star} label="Vérifiés ✓" value={stats.verified} accent="#FF6B00" />
          </div>

          {properties.length === 0 ? (
            <div className="rounded-2xl p-14 text-center"
              style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
              <Home className="w-14 h-14 mx-auto mb-4" style={{ color: HAlpha.gold30 }} />
              <h3 className="text-xl font-semibold mb-2"
                style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>Aucun bien enregistré</h3>
              <p className="text-sm mb-6" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                Commencez par ajouter votre premier bien
              </p>
              <button onClick={onAddProperty}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#FF6B00,#D4A017)', color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
                <Plus className="w-4 h-4" /> Ajouter un bien
              </button>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}`, boxShadow: '0 2px 12px rgba(26,14,0,0.05)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ fontFamily: 'var(--font-nunito)' }}>
                  <thead>
                    <tr style={{ background: 'rgba(212,160,23,0.05)', borderBottom: `1px solid ${HAlpha.gold15}` }}>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: HColors.brownMid }}>Bien</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: HColors.brownMid }}>Type</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: HColors.brownMid }}>Prix</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: HColors.brownMid }}>Statut</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: HColors.brownMid }}>Vues</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: HColors.brownMid }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map(property => (
                      <tr key={property.id} className="transition-all hover:bg-amber-50/30"
                        style={{ borderBottom: `1px solid ${HAlpha.gold10}` }}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0"
                              style={{ border: `1px solid ${HAlpha.gold15}` }}>
                              {property.images?.[0]
                                ? <img src={property.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
                                : <div className="w-full h-full flex items-center justify-center" style={{ background: HAlpha.gold05 }}>
                                  <Home className="w-5 h-5" style={{ color: HAlpha.gold30 }} />
                                </div>
                              }
                            </div>
                            <div>
                              <p className="font-semibold text-sm" style={{ color: HColors.darkBrown }}>{property.title}</p>
                              <p className="text-xs" style={{ color: HColors.brown }}>{property.city}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm" style={{ color: HColors.brown }}>
                          {TYPE_LABELS[property.property_type] || property.property_type}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-semibold" style={{ color: HColors.darkBrown }}>
                            {property.price?.toLocaleString('fr-FR')} <span className="text-xs font-normal" style={{ color: HColors.brown }}>FCFA</span>
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={property.status} />
                          {property.verified_notaire && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: HAlpha.vertCI10, color: HColors.vertCI, border: `1px solid ${HAlpha.vertCI25}` }}>✓ Notaire</span>
                          )}
                          {property.status === 'draft' && !submittingVerif && (
                            <button onClick={() => onSubmitVerification(property)}
                              disabled={!!submittingVerif}
                              className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                              style={{ background: HAlpha.gold10, color: HColors.brownMid, border: `1px solid ${HAlpha.gold25}` }}>
                              Soumettre
                            </button>
                          )}
                          {submittingVerif === property.id && (
                            <span className="ml-2 text-xs" style={{ color: HColors.gold }}>Envoi…</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                            <Eye className="w-4 h-4" />{property.views_count || 0}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => onViewProperty(property.id)}
                              aria-label={`Voir ${property.title}`}
                              className="p-1.5 rounded-lg transition-all hover:opacity-80"
                              style={{ color: HColors.brown, background: 'rgba(212,160,23,0.07)' }} title="Voir">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => onEditProperty(property.id)}
                              aria-label={`Modifier ${property.title}`}
                              className="p-1.5 rounded-lg transition-all hover:opacity-80"
                              style={{ color: HColors.vertCI, background: HAlpha.vertCI10 }} title="Modifier">
                              <Edit className="w-4 h-4" />
                            </button>
                            {(property.status === 'published' && property.needs_status_update) && (
                              <button onClick={() => onStatusUpdate(property)}
                                aria-label={`Statut ${property.title}`}
                                className="px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all hover:opacity-80 animate-pulse"
                                style={{
                                  background: HAlpha.orange10, color: HColors.orangeDark, border: `1px solid ${HAlpha.orange25}`,
                                  fontFamily: 'var(--font-nunito)'
                                }} title="Mettre à jour le statut">
                                <AlertTriangle className="w-3.5 h-3.5" /> Statut
                              </button>
                            )}
                            <button onClick={() => onAvailability(property)}
                              aria-label={`Gérer les disponibilités de ${property.title}`}
                              className="p-1.5 rounded-lg transition-all hover:opacity-80"
                              style={{ color: HColors.gold, background: HAlpha.gold10 }} title="Disponibilités">
                              <Calendar className="w-4 h-4" />
                            </button>
                            {property.status === 'published' && (
                              <button onClick={() => onBoost(property)}
                                aria-label={`Booster ${property.title}`}
                                className="px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all hover:opacity-80"
                                style={{
                                  background: HAlpha.gold10, color: HColors.gold, border: `1px solid ${HAlpha.gold25}`,
                                  fontFamily: 'var(--font-nunito)'
                                }} title="Sponsoriser ce bien">
                                <Zap className="w-3.5 h-3.5" /> Booster
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
