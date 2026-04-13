/**
 * PropertyComparison — Comparaison côte à côte de biens immobiliers.
 *
 * Permet de sélectionner jusqu'à 4 biens et de les comparer dans un tableau.
 * Stocké dans localStorage pour persister entre les sessions.
 */

import { useState, useCallback, useEffect } from 'react';
import { X, Check, XCircle, Ruler, Award } from 'lucide-react';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import { TYPE_LABELS } from '../constants/labels';

const STORAGE_KEY = 'homeci_comparison';
const MAX_PROPERTIES = 4;

export interface ComparableProperty {
  id: string;
  title: string;
  property_type: string;
  transaction_type: string;
  price: number;
  city: string;
  commune: string;
  quartier: string;
  bedrooms: number;
  bathrooms: number;
  surface_area: number;
  status: string;
  verified_notaire: boolean;
  views_count: number;
  images: string[];
}

export const comparisonService = {
  getComparisons(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addProperty(propertyId: string): string[] {
    const current = this.getComparisons();
    if (current.includes(propertyId)) return current;
    if (current.length >= MAX_PROPERTIES) return current;
    const next = [...current, propertyId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  },

  removeProperty(propertyId: string): string[] {
    const current = this.getComparisons();
    const next = current.filter(id => id !== propertyId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  isComparing(propertyId: string): boolean {
    return this.getComparisons().includes(propertyId);
  },

  count(): number {
    return this.getComparisons().length;
  },
};

export function useComparison() {
  const [propertyIds, setPropertyIds] = useState<string[]>([]);

  useEffect(() => {
    setPropertyIds(comparisonService.getComparisons());
  }, []);

  const add = useCallback((id: string) => {
    const next = comparisonService.addProperty(id);
    setPropertyIds(next);
  }, []);

  const remove = useCallback((id: string) => {
    const next = comparisonService.removeProperty(id);
    setPropertyIds(next);
  }, []);

  const clear = useCallback(() => {
    comparisonService.clear();
    setPropertyIds([]);
  }, []);

  return { propertyIds, add, remove, clear, count: propertyIds.length };
}

/* ── Comparison Button ─────────────────────────────────────────────────── */

export function CompareButton({ propertyId, comparing }: { propertyId: string; comparing: boolean }) {
  return (
    <button onClick={() => {
      if (comparing) comparisonService.removeProperty(propertyId);
      else comparisonService.addProperty(propertyId);
      window.dispatchEvent(new CustomEvent('homeci-comparison-change'));
    }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
      style={{
        background: comparing ? `${HColors.vertCI}20` : HAlpha.gold08,
        border: `1px solid ${comparing ? HColors.vertCI : HAlpha.gold20}`,
        color: comparing ? HColors.vertCI : HColors.brownMid,
      }}>
      {comparing ? <Check className="w-3.5 h-3.5" /> : <Ruler className="w-3.5 h-3.5" />}
      {comparing ? 'Comparé' : 'Comparer'}
    </button>
  );
}

/* ── Comparison Panel ──────────────────────────────────────────────────── */

interface ComparisonPanelProps {
  properties: ComparableProperty[];
  onClose: () => void;
  onRemove: (id: string) => void;
}

export function ComparisonPanel({ properties, onClose, onRemove }: ComparisonPanelProps) {
  if (properties.length < 2) return null;

  const ROWS = [
    { label: 'Type', key: 'property_type', render: (v: any) => TYPE_LABELS[v] || v },
    { label: 'Transaction', key: 'transaction_type' },
    { label: 'Prix (FCFA)', key: 'price', format: (v: number) => v.toLocaleString('fr-FR') },
    { label: 'Ville', key: 'city' },
    { label: 'Commune', key: 'commune' },
    { label: 'Quartier', key: 'quartier' },
    { label: 'Chambres', key: 'bedrooms' },
    { label: 'Salles de bain', key: 'bathrooms' },
    { label: 'Surface (m²)', key: 'surface_area' },
    { label: 'Statut', key: 'status' },
    { label: 'Certifié notaire', key: 'verified_notaire', render: (v: any) => v ? 'Oui' : 'Non' },
    { label: 'Vues', key: 'views_count' },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl"
        style={{ background: HColors.white, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
          style={{ background: HColors.white, borderColor: HAlpha.gold15 }}>
          <h2 className="text-xl font-bold" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>
            Comparaison de biens ({properties.length})
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" style={{ color: HColors.brown }} />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontFamily: 'var(--font-nunito)' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${HAlpha.gold15}` }}>
                <th className="sticky left-0 z-10 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider min-w-[140px]"
                  style={{ background: HColors.white, color: HColors.brownMid }}>
                  Caractéristique
                </th>
                {properties.map(p => (
                  <th key={p.id} className="px-4 py-3 text-center min-w-[180px]">
                    <div className="flex flex-col items-center gap-2">
                      {p.images?.[0] && (
                        <img src={p.images[0]} alt={p.title}
                          className="w-full h-24 object-cover rounded-xl"
                          style={{ border: `1px solid ${HAlpha.gold15}` }} />
                      )}
                      <div className="text-sm font-bold" style={{ color: HColors.darkBrown }}>{p.title}</div>
                      <div className="text-xs" style={{ color: HColors.gold, fontWeight: 700 }}>{p.price.toLocaleString('fr-FR')} FCFA</div>
                      <button onClick={() => onRemove(p.id)}
                        className="p-1 rounded-lg hover:bg-red-50 transition-colors"
                        style={{ color: HColors.bordeaux }}>
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={row.key} style={{ borderBottom: `1px solid ${HAlpha.gold08}`, background: i % 2 === 0 ? HAlpha.gold05 : 'transparent' }}>
                  <td className="sticky left-0 z-10 px-4 py-3 text-sm font-semibold"
                    style={{ background: i % 2 === 0 ? HAlpha.gold05 : HColors.white, color: HColors.brownMid }}>
                    {row.label}
                  </td>
                  {properties.map(p => {
                    const val = (p as any)[row.key];
                    const display = row.render ? row.render(val) : (row.format ? row.format(val) : val);
                    const isBest = row.key === 'price'
                      ? Math.min(...properties.map(x => x.price)) === val
                      : row.key === 'surface_area'
                      ? Math.max(...properties.map(x => x.surface_area)) === val
                      : row.key === 'bedrooms'
                      ? Math.max(...properties.map(x => x.bedrooms)) === val
                      : false;

                    return (
                      <td key={p.id} className="px-4 py-3 text-sm text-center"
                        style={{ color: isBest ? HColors.vertCI : HColors.darkBrown, fontWeight: isBest ? 700 : 400 }}>
                        {row.key === 'verified_notaire' ? (
                          val ? <Award className="w-4 h-4 mx-auto" style={{ color: HColors.vertCI }} /> : <X className="w-4 h-4 mx-auto" style={{ color: HColors.bordeaux }} />
                        ) : display}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
