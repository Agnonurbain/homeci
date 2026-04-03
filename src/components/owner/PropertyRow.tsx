import { Home, Eye, Edit, AlertTriangle, Calendar, Zap } from 'lucide-react';
import type { Property } from '../../types/property';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import { TYPE_LABELS } from '../../constants/labels';

/* ── Constants ────────────────────────────────────────────────────────────── */

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  draft: { bg: HAlpha.gold05, text: HColors.brownMid, border: HAlpha.gold15, label: 'Brouillon' },
  pending: { bg: HAlpha.gold10, text: HColors.brownDeep, border: HAlpha.gold25, label: 'En attente' },
  published: { bg: HAlpha.vertCI10, text: HColors.vertDark, border: HAlpha.vertCI25, label: 'Publié' },
  rented: { bg: HAlpha.navy08, text: HColors.navy, border: HAlpha.navy20, label: 'Loué' },
  sold: { bg: HAlpha.bord10, text: HColors.bordeaux, border: HAlpha.bord25, label: 'Vendu' },
  failed: { bg: HAlpha.orange08, text: HColors.orangeCI, border: HAlpha.orange15, label: 'Non abouti' },
};

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface PropertyRowProps {
  property: Property;
  submittingVerif: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onStatusUpdate: (p: Property) => void;
  onAvailability: (p: Property) => void;
  onBoost: (p: Property) => void;
  onSubmitVerification: (p: Property) => void;
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.draft;
  return (
    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{
        background: s.bg, color: s.text, border: `1px solid ${s.border}`,
        fontFamily: 'var(--font-nunito)'
      }}>
      {s.label}
    </span>
  );
}

/* ── Main Component ────────────────────────────────────────────────────────── */

export default function PropertyRow({
  property, submittingVerif,
  onView, onEdit, onStatusUpdate, onAvailability, onBoost, onSubmitVerification
}: PropertyRowProps) {
  return (
    <tr className="transition-all hover:bg-amber-50/30 group"
      style={{ borderBottom: `1.2px solid ${HAlpha.gold10}` }}>
      
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm transition-transform group-hover:scale-105"
            style={{ border: `1px solid ${HAlpha.gold15}` }}>
            {property.images?.[0]
              ? <img src={property.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
              : <div className="w-full h-full flex items-center justify-center" style={{ background: HAlpha.gold05 }}>
                  <Home className="w-5 h-5" style={{ color: HAlpha.gold30 }} />
                </div>
            }
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>{property.title}</p>
            <p className="text-[10px] uppercase font-bold opacity-50 tracking-widest" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>{property.city}</p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4 text-xs font-bold uppercase tracking-wide opacity-60" 
          style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
        {TYPE_LABELS[property.property_type] || property.property_type}
      </td>

      <td className="px-5 py-4">
        <span className="text-sm font-bold" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
          {property.price?.toLocaleString('fr-FR')} <span className="text-[10px] font-normal opacity-50">FCFA</span>
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={property.status} />
          
          {property.verified_notaire ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ background: HAlpha.vertCI10, color: HColors.vertCI, border: `1px solid ${HAlpha.vertCI25}` }}>✓ Vérifié</span>
          ) : property.status === 'draft' && (
            <button onClick={() => onSubmitVerification(property)}
              disabled={submittingVerif}
              className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hover:bg-gold/10 disabled:opacity-50"
              style={{ background: HAlpha.gold10, color: HColors.brownMid, border: `1.5px solid ${HAlpha.gold25}` }}>
              {submittingVerif ? 'Envoi...' : 'Soumettre'}
            </button>
          )}
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
          <Eye className="w-3.5 h-3.5 opacity-40" /> {property.views_count || 0}
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5">
          <button onClick={() => onView(property.id)}
            className="p-2 rounded-xl transition-all hover:bg-gold/10"
            style={{ color: HColors.brown, border: `1px solid ${HAlpha.gold15}` }} 
            title="Détails">
            <Eye className="w-4 h-4" />
          </button>
          
          <button onClick={() => onEdit(property.id)}
            className="p-2 rounded-xl transition-all hover:bg-emerald-50"
            style={{ color: HColors.vertCI, border: `1px solid ${HAlpha.vertCI20}` }} 
            title="Modifier">
            <Edit className="w-4 h-4" />
          </button>

          {property.status === 'published' && property.needs_status_update && (
            <button onClick={() => onStatusUpdate(property)}
              className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all hover:shadow-md animate-pulse"
              style={{ background: HAlpha.orange10, color: HColors.orangeDark, border: `1px solid ${HAlpha.orange25}` }} 
              title="Mettre à jour le statut">
              <AlertTriangle className="w-3.5 h-3.5" /> Statut
            </button>
          )}

          <button onClick={() => onAvailability(property)}
            className="p-2 rounded-xl transition-all hover:bg-gold/10"
            style={{ color: HColors.gold, border: `1px solid ${HAlpha.gold20}` }} 
            title="Disponibilités">
            <Calendar className="w-4 h-4" />
          </button>

          {property.status === 'published' && (
            <button onClick={() => onBoost(property)}
              className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all hover:bg-gold hover:text-white"
              style={{ background: HAlpha.gold10, color: HColors.gold, border: `1.5px solid ${HAlpha.gold25}` }} 
              title="Booster l'annonce">
              <Zap className="w-3.5 h-3.5" /> Booster
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
