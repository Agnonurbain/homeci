import React from 'react';
import { MapPin } from 'lucide-react';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import { TYPE_LABELS } from '../../constants/labels';
import { SectionTitle, PropertyStatusBadge } from './AdminSections';
import { AdminStats } from './AdminStats';
import type { Property } from '../../types/property';
import type { AdminStats as AdminStatsType } from '../../hooks/useAdminDashboard';

interface OverviewSectionProps {
  stats: AdminStatsType;
  properties: Property[];
  onViewProperty: (p: Property) => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({ stats, properties, onViewProperty }) => {
  const recentProps = properties.slice(0, 5);

  return (
    <div className="animate-in fade-in duration-500">
      <SectionTitle title="Vue d'ensemble" sub="Statistiques générales de la plateforme HOMECI" />
      <AdminStats stats={stats} />

      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-bold text-darkBrown font-cormorant text-lg">Biens récents</h3>
          <span className="text-xs px-2.5 py-1 rounded-full bg-gold/10 text-brown font-semibold">{properties.length} au total</span>
        </div>
        <div className="divide-y">
          {recentProps.map(p => (
            <button key={p.id} onClick={() => onViewProperty(p)} className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-all text-left">
              <img src={p.images?.[0] || ''} alt="" className="w-10 h-10 rounded-lg object-cover border" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-darkBrown truncate">{p.title}</p>
                <p className="text-xs text-brown flex items-center gap-1"><MapPin className="w-3 h-3 text-orange-400" /> {p.city} · {TYPE_LABELS[p.property_type]}</p>
              </div>
              <PropertyStatusBadge status={p.status} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface PropertiesSectionProps {
  properties: Property[];
  filterType: string;
  setFilterType: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterCity: string;
  setFilterCity: (v: string) => void;
  sort: string;
  setSort: (v: any) => void;
  onViewDetails: (p: Property) => void;
}

export const PropertiesSection: React.FC<PropertiesSectionProps> = ({
  properties, filterType, setFilterType, filterStatus, setFilterStatus, filterCity, setFilterCity, sort, setSort
}) => (
  <div className="animate-in fade-in duration-500">
    <SectionTitle title="Tous les Biens" sub="Vue complète de tous les biens immobiliers de la plateforme" />
    <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
      <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 bg-gray-50 border-b">
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 rounded-xl text-xs outline-none border focus:ring-1 ring-gold">
          <option value="">Types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl text-xs outline-none border focus:ring-1 ring-gold">
          <option value="">Statuts</option>
          {['published', 'pending', 'draft', 'rejected', 'rented', 'sold'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="text" value={filterCity} onChange={e => setFilterCity(e.target.value)} placeholder="Ville..." className="px-3 py-2 rounded-xl text-xs outline-none border w-28 focus:ring-1 ring-gold" />
        <select value={sort} onChange={e => setSort(e.target.value)} className="px-3 py-2 rounded-xl text-xs outline-none border focus:ring-1 ring-gold">
          <option value="date_desc">↓ Date</option><option value="date_asc">↑ Date</option><option value="price_desc">↓ Prix</option><option value="price_asc">↑ Prix</option>
        </select>
        <span className="ml-auto text-xs text-brown">{properties.length} bien(s)</span>
      </div>
      <div className="homeci-table-scroll">
        <table className="min-w-full">
          <thead className="bg-night">
            <tr>{['Bien', 'Type', 'Ville', 'Prix', 'Statut', 'Date'].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-cream/60">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {properties.map((p, i) => (
              <tr key={p.id} className="hover:bg-gray-50" style={{ background: i % 2 === 0 ? '#FFF' : '#F9F3E840' }}>
                <td className="px-5 py-3 font-semibold text-darkBrown">{p.title}</td>
                <td className="px-5 py-3 text-xs text-brown">{TYPE_LABELS[p.property_type]}</td>
                <td className="px-5 py-3 text-xs text-brown">{p.city}</td>
                <td className="px-5 py-3 text-xs font-bold text-orangeCI">{p.price.toLocaleString()} FCFA</td>
                <td className="px-5 py-3"><PropertyStatusBadge status={p.status} /></td>
                <td className="px-5 py-3 text-xs text-brown">{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
