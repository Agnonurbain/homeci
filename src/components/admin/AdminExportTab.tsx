/**
 * AdminExportTab — Onglet d'export de données (Admin Dashboard).
 *
 * Permet d'exporter en CSV :
 * - Utilisateurs
 * - Biens immobiliers
 * - Visites
 * - Enquêtes de satisfaction
 * - Signalements
 *
 * Les données sont chargées à la demande (au clic sur Exporter) pour éviter
 * de surcharger le dashboard admin avec des subscriptions inutiles.
 */

import { useState } from 'react';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { Download, Users, Home, CalendarCheck, Star, Flag, Loader2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import { SectionTitle } from './AdminSections';
import { exportService, type ExportType } from '../../services/exportService';
import type { Profile } from '../../contexts/AuthContext';

interface AdminExportTabProps {
  users: (Profile & { suspended?: boolean })[];
  showToast: (msg: string, ok?: boolean) => void;
}

const EXPORT_OPTIONS = [
  { type: 'users' as ExportType, label: 'Utilisateurs', icon: Users, color: HColors.orangeCI, collection: 'users' },
  { type: 'properties' as ExportType, label: 'Biens immobiliers', icon: Home, color: HColors.vertCI, collection: 'properties' },
  { type: 'visits' as ExportType, label: 'Visites', icon: CalendarCheck, color: HColors.gold, collection: 'visits' },
  { type: 'surveys' as ExportType, label: 'Enquêtes satisfaction', icon: Star, color: HColors.navy, collection: 'surveys' },
  { type: 'reports' as ExportType, label: 'Signalements', icon: Flag, color: HColors.bordeaux, collection: 'reports' },
];

/** Charge les données d'une collection Firestore pour l'export */
async function loadCollectionData(type: ExportType): Promise<Record<string, unknown>[]> {
  const q = query(collection(db, EXPORT_OPTIONS.find(e => e.type === type)!.collection), orderBy('created_at', 'desc'), limit(5000));
  const snap = await getDocs(q);

  const toISO = (v: unknown): string => {
    if (!v) return new Date().toISOString();
    if (typeof v === 'object' && v !== null && 'toDate' in v) return (v as any).toDate().toISOString();
    return String(v);
  };

  return snap.docs.map(d => {
    const data = d.data();
    const result: Record<string, unknown> = { id: d.id };

    switch (type) {
      case 'users':
        result.uid = d.id;
        result.email = data.email ?? '';
        result.full_name = data.full_name ?? '';
        result.phone = data.phone ?? '';
        result.role = data.role ?? 'locataire';
        result.verified = Boolean(data.verified ?? false);
        result.suspended = Boolean(data.suspended ?? false);
        result.created_at = toISO(data.created_at);
        break;
      case 'properties':
        result.id = d.id;
        result.title = data.title ?? '';
        result.owner_id = data.owner_id ?? '';
        result.property_type = data.property_type ?? '';
        result.transaction_type = data.transaction_type ?? '';
        result.price = data.price ?? 0;
        result.city = data.city ?? '';
        result.commune = data.commune ?? '';
        result.quartier = data.quartier ?? '';
        result.bedrooms = data.bedrooms ?? 0;
        result.surface_area = data.surface_area ?? 0;
        result.status = data.status ?? '';
        result.verified_notaire = Boolean(data.verified_notaire ?? false);
        result.views_count = data.views_count ?? 0;
        result.created_at = toISO(data.created_at);
        break;
      case 'visits':
        result.id = d.id;
        result.property_id = data.property_id ?? '';
        result.property_title = data.property_title ?? '';
        result.tenant_name = data.tenant_name ?? '';
        result.tenant_email = data.tenant_email ?? '';
        result.preferred_date = data.preferred_date ?? '';
        result.preferred_time = data.preferred_time ?? '';
        result.status = data.status ?? '';
        result.owner_id = data.owner_id ?? '';
        result.created_at = toISO(data.created_at);
        break;
      case 'surveys':
        result.id = d.id;
        result.user_id = data.user_id ?? '';
        result.user_role = data.user_role ?? '';
        result.rating = data.rating ?? 0;
        result.comment = data.comment ?? '';
        result.trigger = data.trigger ?? '';
        result.property_title = data.property_title ?? '';
        result.created_at = toISO(data.created_at);
        break;
      case 'reports':
        result.id = d.id;
        result.property_id = data.property_id ?? '';
        result.property_title = data.property_title ?? '';
        result.reporter_email = data.reporter_email ?? '';
        result.reporter_role = data.reporter_role ?? '';
        result.reason = data.reason ?? '';
        result.details = data.details ?? '';
        result.status = data.status ?? '';
        result.created_at = toISO(data.created_at);
        break;
    }
    return result;
  });
}

export default function AdminExportTab({ users, showToast }: AdminExportTabProps) {
  const [exporting, setExporting] = useState<ExportType | null>(null);
  const [counts, setCounts] = useState<Record<ExportType, number | null>>({
    users: users.length,
    properties: null,
    visits: null,
    surveys: null,
    reports: null,
  });

  const getCount = (type: ExportType): number => {
    return counts[type] ?? 0;
  };

  const handleExport = async (type: ExportType) => {
    setExporting(type);
    try {
      const data = await loadCollectionData(type);
      const count = data.length;

      // Update count cache
      setCounts(prev => ({ ...prev, [type]: count }));

      if (count === 0) {
        showToast('Aucune donnée à exporter', false);
        return;
      }

      // Map to typed export
      const records = data as Record<string, unknown>[];
      switch (type) {
        case 'users':
          exportService.exportUsers(records as any);
          break;
        case 'properties':
          exportService.exportProperties(records as any);
          break;
        case 'visits':
          exportService.exportVisits(records as any);
          break;
        case 'surveys':
          exportService.exportSurveys(records as any);
          break;
        case 'reports':
          exportService.exportReports(records as any);
          break;
      }
      showToast(`${count} ligne(s) exportée(s) en CSV`);
    } catch (e) {
      console.error('[HOMECI] Export error:', e);
      showToast('Erreur lors de l\'export', false);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <SectionTitle
        title="Export de Données"
        sub="Téléchargez les données de la plateforme au format CSV (compatible Excel)"
      />

      {/* Info box */}
      <div className="rounded-2xl p-5 mb-7 flex items-start gap-4"
        style={{ background: HAlpha.gold08, border: `1px solid ${HAlpha.gold15}` }}>
        <Download className="w-6 h-6 shrink-0 mt-0.5" style={{ color: HColors.gold }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
            Format CSV (point-virgule)
          </p>
          <p className="text-xs mt-1" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            Les fichiers sont encodés en UTF-8 avec BOM pour une ouverture directe dans Excel.
            Chargement à la demande — chaque export récupère les données fraîches (max 5000 lignes).
          </p>
        </div>
      </div>

      {/* Export cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {EXPORT_OPTIONS.map(option => {
          const count = getCount(option.type);
          const isExporting = exporting === option.type;
          const Icon = option.icon;

          return (
            <div key={option.type}
              className="rounded-2xl p-5 transition-all hover:scale-[1.02]"
              style={{ background: HColors.white, border: `1.5px solid ${HAlpha.gold15}`, boxShadow: '0 2px 12px rgba(26,14,0,0.04)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${option.color}15`, border: `1px solid ${option.color}30` }}>
                  <Icon className="w-5 h-5" style={{ color: option.color }} />
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>
                    {option.label}
                  </h3>
                  <p className="text-xs" style={{ color: HColors.brown }}>
                    {isExporting ? 'Chargement...' : count > 0 ? `${count} enregistrement(s)` : 'Cliquer pour charger'}
                  </p>
                </div>
              </div>

              {/* Columns preview */}
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: HAlpha.brown50 }}>
                  Colonnes ({exportService.getColumns(option.type).length})
                </p>
                <p className="text-[10px] truncate" style={{ color: HColors.brown }}>
                  {exportService.getColumns(option.type).slice(0, 4).map(c => c.label).join(', ')}
                  {exportService.getColumns(option.type).length > 4 && '...'}
                </p>
              </div>

              {/* Export button */}
              <button onClick={() => handleExport(option.type)} disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${option.color}, ${HColors.gold})`,
                  color: '#FFF',
                }}>
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Exporter CSV
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Summary — only for counts we know */}
      <div className="mt-7 rounded-2xl p-5"
        style={{ background: HAlpha.vertCI10, border: `1px solid ${HAlpha.vertCI20}` }}>
        <h4 className="font-bold text-sm mb-2" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>
          Récapitulatif
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-center">
          {EXPORT_OPTIONS.map(opt => (
            <div key={opt.type}>
              <p className="text-lg font-black" style={{ color: counts[opt.type] !== null ? opt.color : HAlpha.brown50 }}>
                {counts[opt.type] !== null ? counts[opt.type] : '—'}
              </p>
              <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: HColors.brown }}>{opt.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
