import { Plus, Home, Download, AlertTriangle } from 'lucide-react';
import type { Property } from '../../types/property';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import { StatGridSkeleton, PropertyTableSkeleton } from '../Skeletons';
import PropertyStats from './PropertyStats';
import PropertyRow from './PropertyRow';

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
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-7">
        <div className="text-center sm:text-left">
          <h1 className="font-bold mb-1"
            style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.5rem, 5vw, 2rem)', color: HColors.darkBrown }}>
            Mes Biens
          </h1>
          <p className="text-xs sm:text-sm uppercase tracking-widest font-bold opacity-50" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            {stats.total} bien(s) enregistré(s)
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={onExportCSV}
            className="flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2.5 rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-gray-100 border border-gray-200"
            style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)', background: HColors.white }}>
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden xs:inline">Exporter</span><span className="xs:hidden">Export</span>
          </button>
          <button onClick={onAddProperty}
            className="flex-[2] sm:flex-none justify-center px-3 sm:px-5 py-2.5 rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-2 transition-all hover:opacity-90 active:scale-95 shadow-lg whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg,#FF6B00,#D4A017)', color: '#FFFFFF',
              fontFamily: 'var(--font-nunito)'
            }}>
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Ajouter
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
          <PropertyStats stats={stats} />

          {/* Bannière d'alerte pour les biens nécessitant une mise à jour de statut */}
          {properties.filter(p => p.status === 'published' && p.needs_status_update).map(p => (
            <button key={p.id} onClick={() => onStatusUpdate(p)}
              className="w-full flex items-center gap-3 p-3 sm:p-4 mb-4 rounded-xl text-left transition-all hover:shadow-md active:scale-[0.99]"
              style={{ background: HAlpha.orange08, border: `1.5px solid ${HAlpha.orange25}` }}>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: HColors.orangeCI }}>
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#FFFFFF' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold truncate" style={{ color: HColors.orangeDark, fontFamily: 'var(--font-nunito)' }}>
                  Visite effectuée — «&nbsp;{p.title}&nbsp;»
                </p>
                <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: HAlpha.brown60, fontFamily: 'var(--font-nunito)' }}>
                  Indiquez le résultat : loué, vendu ou transaction non aboutie
                </p>
              </div>
              <span className="shrink-0 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider"
                style={{ background: HColors.orangeCI, color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
                Mettre à jour
              </span>
            </button>
          ))}

          {properties.length === 0 ? (
            <div className="rounded-3xl p-14 text-center"
              style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div className="w-20 h-20 bg-gold/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Home className="w-10 h-10 style={{ color: HAlpha.gold30 }}" />
              </div>
              <h3 className="text-xl font-bold mb-2"
                style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>Aucun bien enregistré</h3>
              <p className="text-sm mb-8 opacity-60" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                Il semble que votre inventaire soit vide. Commencez par ajouter votre premier bien pour le proposer aux locataires.
              </p>
              <button onClick={onAddProperty}
                className="px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest inline-flex items-center gap-2 transition-all hover:opacity-90 shadow-md"
                style={{ background: 'linear-gradient(135deg,#FF6B00,#D4A017)', color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
                <Plus className="w-4 h-4" /> Enregistrer un bien
              </button>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: HColors.white, border: `1.5px solid ${HAlpha.gold15}`, boxShadow: '0 4px 25px rgba(26,14,0,0.04)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ fontFamily: 'var(--font-nunito)' }}>
                  <thead>
                    <tr style={{ background: 'rgba(212,160,23,0.04)', borderBottom: `1.5px solid ${HAlpha.gold15}` }}>
                      <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: HColors.brownMid }}>Informations du Bien</th>
                      <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: HColors.brownMid }}>Catégorie</th>
                      <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: HColors.brownMid }}>Loyer/Prix</th>
                      <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: HColors.brownMid }}>Vérification & Statut</th>
                      <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: HColors.brownMid }}>Engagement</th>
                      <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: HColors.brownMid }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map(property => (
                      <PropertyRow 
                        key={property.id} 
                        property={property}
                        submittingVerif={submittingVerif === property.id}
                        onView={onViewProperty}
                        onEdit={onEditProperty}
                        onStatusUpdate={onStatusUpdate}
                        onAvailability={onAvailability}
                        onBoost={onBoost}
                        onSubmitVerification={onSubmitVerification}
                      />
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
