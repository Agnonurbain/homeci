import { useState } from 'react';
import { SlidersHorizontal, X, ChevronDown, MapPin } from 'lucide-react';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import {
  ALL_DISTRICTS, getRegionsByDistrict, getDepartementsByRegion,
  getVillesByDepartement, getCommunesByVille, getQuartiersByCommune, getQuartiersByVille,
} from '../data/coteIvoireGeo';

interface PropertyFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
}

export interface FilterValues {
  propertyType: string; transactionType: string;
  district: string; region: string; departement: string;
  city: string; commune: string; quartier: string;
  minPrice: string; maxPrice: string; bedrooms: string;
  furnished: boolean; parking: boolean; verifiedOnly: boolean;
}

const DEFAULT_FILTERS: FilterValues = {
  propertyType: '', transactionType: '',
  district: '', region: '', departement: '', city: '', commune: '', quartier: '',
  minPrice: '', maxPrice: '', bedrooms: '',
  furnished: false, parking: false, verifiedOnly: false,
};

const GEO_LEVELS = [
  { key: 'district',    label: 'District',     placeholder: 'Tous les districts' },
  { key: 'region',      label: 'Région',       placeholder: 'Toutes les régions' },
  { key: 'departement', label: 'Département',  placeholder: 'Tous les départements' },
  { key: 'city',        label: 'Ville',        placeholder: 'Toutes les villes' },
  { key: 'commune',     label: 'Commune',      placeholder: 'Toutes les communes' },
  { key: 'quartier',    label: 'Quartier',     placeholder: 'Tous les quartiers' },
] as const;

const cascadeResets: Record<string, (keyof FilterValues)[]> = {
  district: ['region','departement','city','commune','quartier'],
  region: ['departement','city','commune','quartier'],
  departement: ['city','commune','quartier'],
  city: ['commune','quartier'],
  commune: ['quartier'],
  quartier: [],
};

/* ── Styles ─────────────────────────────────────────────────────────────────── */
const SEL = { background:'rgba(255,255,255,0.8)', border:'1px solid rgba(212,160,23,0.2)', color:HColors.darkBrown, fontFamily:'var(--font-nunito)', fontSize:'0.875rem' } as React.CSSProperties;
const SEL_DIS = { ...SEL, background:'rgba(255,255,255,0.4)', color:'rgba(26,14,0,0.35)', cursor:'not-allowed' } as React.CSSProperties;
const INP = { ...SEL } as React.CSSProperties;
const LBL = { color:HAlpha.brown55, fontFamily:'var(--font-nunito)', fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase' } as React.CSSProperties;
const cls = 'w-full px-3 py-2 rounded-xl outline-none';

export function PropertyFilters({ onFilterChange }: PropertyFiltersProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS);

  const activeCount = [
    filters.propertyType, filters.transactionType, filters.district, filters.region,
    filters.departement, filters.city, filters.commune, filters.quartier,
    filters.minPrice, filters.maxPrice, filters.bedrooms,
  ].filter(Boolean).length + (filters.furnished ? 1 : 0) + (filters.parking ? 1 : 0) + (filters.verifiedOnly ? 1 : 0);

  const geoPath = [filters.district, filters.region, filters.departement, filters.city, filters.commune, filters.quartier].filter(Boolean);

  const update = (key: keyof FilterValues, value: string | boolean, resets: (keyof FilterValues)[] = []) => {
    const next = { ...filters, [key]: value };
    resets.forEach(k => { (next as any)[k] = typeof filters[k] === 'boolean' ? false : ''; });
    setFilters(next);
    onFilterChange(next);
  };

  const reset = () => { setFilters(DEFAULT_FILTERS); onFilterChange(DEFAULT_FILTERS); };

  const options: Record<string, string[]> = {
    district:    ALL_DISTRICTS,
    region:      filters.district    ? getRegionsByDistrict(filters.district) : [],
    departement: filters.region      ? getDepartementsByRegion(filters.region) : [],
    city:        filters.departement ? getVillesByDepartement(filters.departement) : [],
    commune:     filters.city        ? getCommunesByVille(filters.city) : [],
    quartier:    filters.commune     ? getQuartiersByCommune(filters.commune) : filters.city ? getQuartiersByVille(filters.city) : [],
  };

  return (
    <div className="rounded-2xl mb-5 overflow-hidden"
      style={{ background:'#fff', border:'1px solid rgba(212,160,23,0.15)', boxShadow:'0 2px 12px rgba(26,14,0,0.04)' }}>

      {/* ── Barre principale ── */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <button onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 font-semibold transition-all"
          style={{ color: open ? HColors.gold : HColors.brownMid, fontFamily:'var(--font-nunito)', fontSize:'0.875rem' }}>
          <SlidersHorizontal className="w-4 h-4" />
          Filtres
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
              style={{ background:HColors.gold, color:HColors.night }}>
              {activeCount}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color:'rgba(212,160,23,0.6)' }} />
        </button>

        {/* Chips filtres actifs */}
        <div className="flex-1 flex flex-wrap gap-1.5 min-w-0">
          {filters.propertyType && <FilterChip label={filters.propertyType} onRemove={() => update('propertyType', '')} />}
          {filters.transactionType && <FilterChip label={filters.transactionType} onRemove={() => update('transactionType', '')} />}
          {geoPath.length > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background:HAlpha.green10, border:'1px solid rgba(45,106,79,0.25)', color:HColors.green }}>
              <MapPin className="w-3 h-3" />
              {geoPath.join(' › ')}
              <button onClick={() => update('district', '', ['region','departement','city','commune','quartier'])}
                className="ml-1 hover:opacity-70"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.minPrice && <FilterChip label={`≥ ${Number(filters.minPrice).toLocaleString('fr-FR')} F`} onRemove={() => update('minPrice', '')} />}
          {filters.maxPrice && <FilterChip label={`≤ ${Number(filters.maxPrice).toLocaleString('fr-FR')} F`} onRemove={() => update('maxPrice', '')} />}
          {filters.bedrooms && <FilterChip label={`${filters.bedrooms}+ ch.`} onRemove={() => update('bedrooms', '')} />}
          {filters.furnished && <FilterChip label="Meublé" onRemove={() => update('furnished', false)} />}
          {filters.parking && <FilterChip label="Parking" onRemove={() => update('parking', false)} />}
          {filters.verifiedOnly && <FilterChip label="✓ Notaire" color="green" onRemove={() => update('verifiedOnly', false)} />}
        </div>

        {activeCount > 0 && (
          <button onClick={reset} className="flex items-center gap-1 text-xs transition-all shrink-0 hover:opacity-70"
            style={{ color:'rgba(139,29,29,0.7)', fontFamily:'var(--font-nunito)' }}>
            <X className="w-3.5 h-3.5" /> Effacer
          </button>
        )}
      </div>

      {/* ── Panneau étendu ── */}
      {open && (
        <div className="px-4 pb-5 space-y-5"
          style={{ borderTop:'1px solid rgba(212,160,23,0.1)' }}>

          <div className="pt-4 grid grid-cols-2 gap-3">
            {/* Type de bien */}
            <div>
              <label className="block mb-1.5" style={LBL}>Type de bien</label>
              <select value={filters.propertyType} onChange={e => update('propertyType', e.target.value)} className={cls} style={SEL}>
                <option value="">Tous les types</option>
                <option value="appartement">Appartement</option>
                <option value="maison">Maison</option>
                <option value="villa">Villa</option>
                <option value="terrain">Terrain</option>
                <option value="hotel">Hôtel</option>
                <option value="appart_hotel">Appart-Hôtel</option>
              </select>
            </div>
            {/* Transaction */}
            <div>
              <label className="block mb-1.5" style={LBL}>Transaction</label>
              <select value={filters.transactionType} onChange={e => update('transactionType', e.target.value)} className={cls} style={SEL}>
                <option value="">Location & Vente</option>
                <option value="location">Location</option>
                <option value="vente">Vente</option>
              </select>
            </div>
          </div>

          {/* Géolocalisation en cascade */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-3.5 h-3.5" style={{ color:'rgba(45,106,79,0.7)' }} />
              <span style={{ ...LBL, fontSize:'0.65rem' }}>Localisation</span>
            </div>
            <div className="space-y-2">
              {GEO_LEVELS.map((level, idx) => {
                const prevLevel = idx > 0 ? GEO_LEVELS[idx - 1] : null;
                const prevVal = prevLevel ? filters[prevLevel.key] : 'always';
                const opts = options[level.key];
                const val = filters[level.key];
                const isActive = val !== '';
                const isAvailable = prevVal !== '' && opts.length > 0;
                if (!isActive && !isAvailable && idx > 0) return null;

                return (
                  <div key={level.key} className="flex items-center gap-2">
                    {/* Connecteur visuel */}
                    <div className="flex flex-col items-center w-4 shrink-0 self-stretch justify-center gap-0.5">
                      <div className="flex-1 w-px" style={{ background: isActive ? HAlpha.gold40 : HAlpha.gold10 }} />
                      <div className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: isActive ? HColors.gold : isAvailable ? 'rgba(212,160,23,0.3)' : HAlpha.gold10 }} />
                      <div className="flex-1 w-px" style={{ background: isActive ? HAlpha.gold40 : HAlpha.gold10 }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span style={{ ...LBL, fontSize:'0.6rem', color: isActive ? HColors.brownMid : 'rgba(122,85,0,0.45)' }}>
                          {level.label}
                        </span>
                        {isActive && (
                          <button onClick={() => update(level.key, '', cascadeResets[level.key])}
                            className="transition-opacity hover:opacity-70">
                            <X className="w-2.5 h-2.5" style={{ color:HAlpha.bord20 }} />
                          </button>
                        )}
                      </div>
                      <select value={val}
                        onChange={e => update(level.key, e.target.value, cascadeResets[level.key])}
                        disabled={!isAvailable && idx > 0}
                        className={cls}
                        style={(!isAvailable && idx > 0) ? SEL_DIS : SEL}>
                        <option value="">{level.placeholder}</option>
                        {opts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prix & Chambres */}
          <div>
            <label className="block mb-2" style={LBL}>Prix & Caractéristiques</label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="mb-1" style={{ ...LBL, fontSize:'0.6rem', color:'rgba(122,85,0,0.5)' }}>Prix min</p>
                <input type="number" value={filters.minPrice}
                  onChange={e => update('minPrice', e.target.value)}
                  placeholder="0 FCFA" className={cls} style={INP} />
              </div>
              <div>
                <p className="mb-1" style={{ ...LBL, fontSize:'0.6rem', color:'rgba(122,85,0,0.5)' }}>Prix max</p>
                <input type="number" value={filters.maxPrice}
                  onChange={e => update('maxPrice', e.target.value)}
                  placeholder="Illimité" className={cls} style={INP} />
              </div>
              <div>
                <p className="mb-1" style={{ ...LBL, fontSize:'0.6rem', color:'rgba(122,85,0,0.5)' }}>Chambres min</p>
                <select value={filters.bedrooms}
                  onChange={e => update('bedrooms', e.target.value)}
                  className={cls} style={SEL}>
                  <option value="">Toutes</option>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}+</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Options toggle */}
          <div className="flex flex-wrap gap-2">
            {[
              { key:'furnished' as const,   label:'🛋  Meublé' },
              { key:'parking' as const,      label:'🚗  Parking' },
              { key:'verifiedOnly' as const, label:'✅  Vérifié Notaire' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-sm transition-all"
                style={filters[key]
                  ? { background:'rgba(212,160,23,0.12)', border:'1px solid rgba(212,160,23,0.4)', color:HColors.brownMid, fontFamily:'var(--font-nunito)', fontWeight:600 }
                  : { background:'rgba(255,255,255,0.6)', border:'1px solid rgba(212,160,23,0.15)', color:HColors.brown, fontFamily:'var(--font-nunito)' }}>
                <input type="checkbox" checked={filters[key] as boolean}
                  onChange={e => update(key, e.target.checked)} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, color = 'gold', onRemove }: { label: string; color?: 'gold' | 'green'; onRemove: () => void }) {
  const styles = color === 'green'
    ? { background:HAlpha.green10, border:'1px solid rgba(45,106,79,0.25)', color:HColors.green }
    : { background:HAlpha.gold10, border:'1px solid rgba(212,160,23,0.25)', color:HColors.brownMid };
  return (
    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ ...styles, fontFamily:'var(--font-nunito)' }}>
      {label}
      <button onClick={onRemove} className="ml-0.5 hover:opacity-60 transition-opacity">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
