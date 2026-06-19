/**
 * AddressAutocomplete — Autocomplétion d'adresse pour la Côte d'Ivoire.
 *
 * Utilise les données locales `coteIvoireGeo.ts` (pas d'API externe payante).
 * Cascade : Ville → Commune → Quartier avec filtrage en temps réel.
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  VILLES_BY_DEPARTEMENT,
  COMMUNES_BY_VILLE,
  QUARTIERS_BY_COMMUNE,
  QUARTIERS_BY_VILLE,
} from '../data/coteIvoireGeo';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import { MapPin, ChevronDown, Search, X } from 'lucide-react';

interface AddressAutocompleteProps {
  value: { city?: string; commune?: string; quartier?: string };
  onChange: (value: { city: string; commune: string; quartier: string }) => void;
  placeholder?: string;
}

export function AddressAutocomplete({ value, onChange, placeholder = 'Rechercher une adresse...' }: AddressAutocompleteProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Construire la liste de suggestions
  const suggestions = useMemo(() => {
    const results: Array<{ type: string; label: string; city: string; commune: string; quartier: string }> = [];
    const q = search.toLowerCase().trim();

    if (!q) return results;

    // Chercher dans les villes
    const allVilles = new Set<string>();
    Object.values(VILLES_BY_DEPARTEMENT).forEach(arr => arr.forEach(v => allVilles.add(v)));

    for (const ville of allVilles) {
      if (ville.toLowerCase().includes(q)) {
        results.push({ type: 'Ville', label: ville, city: ville, commune: '', quartier: '' });
      }

      // Communes de cette ville
      const communes = COMMUNES_BY_VILLE[ville] || [];
      for (const commune of communes) {
        if (commune.toLowerCase().includes(q)) {
          results.push({ type: 'Commune', label: `${commune}, ${ville}`, city: ville, commune, quartier: '' });
        }
      }

      // Quartiers de cette ville
      const quartiersVille = QUARTIERS_BY_VILLE[ville] || [];
      for (const quartier of quartiersVille) {
        if (quartier.toLowerCase().includes(q)) {
          results.push({ type: 'Quartier', label: `${quartier}, ${ville}`, city: ville, commune: '', quartier });
        }
      }

      // Quartiers par commune
      for (const commune of communes) {
        const quartiersCommune = QUARTIERS_BY_COMMUNE[commune] || [];
        for (const quartier of quartiersCommune) {
          if (quartier.toLowerCase().includes(q)) {
            results.push({ type: 'Quartier', label: `${quartier}, ${commune}, ${ville}`, city: ville, commune, quartier });
          }
        }
      }
    }

    return results.slice(0, 20);
  }, [search]);

  const handleSelect = (item: typeof suggestions[0]) => {
    onChange({ city: item.city, commune: item.commune, quartier: item.quartier });
    setSearch('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const displayValue = [value.city, value.commune, value.quartier].filter(Boolean).join(', ');

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: HColors.brown }} />
        <input
          type="text"
          value={search || displayValue}
          onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => search && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#D4A017]/40 text-sm transition-all"
          style={{
            background: HColors.white,
            border: `1.5px solid ${isOpen ? HColors.gold : HAlpha.gold20}`,
            color: HColors.darkBrown,
            fontFamily: 'var(--font-nunito)',
          }}
        />
        {(search || displayValue) && (
          <button
            onClick={() => { setSearch(''); onChange({ city: '', commune: '', quartier: '' }); }}
            className="absolute right-3 p-1 rounded-full hover:bg-[rgba(212,160,23,0.08)] transition-colors"
          >
            <X className="w-4 h-4" style={{ color: HColors.brown }} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && search && (
        <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-xl max-h-64 overflow-y-auto"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}` }}>
          {suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-center" style={{ color: HColors.brown }}>
              <MapPin className="w-5 h-5 mx-auto mb-1 opacity-30" />
              Aucun résultat pour "{search}"
            </div>
          ) : (
            suggestions.map((item, i) => (
              <button key={`${item.type}-${item.label}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlightedIndex(i)}
                className="w-full px-4 py-3 text-left flex items-center gap-3 transition-colors hover:bg-amber-50"
                style={{
                  background: i === highlightedIndex ? `${HAlpha.gold10}` : 'transparent',
                  borderBottom: `1px solid ${HAlpha.gold08}`,
                }}>
                <MapPin className="w-4 h-4 shrink-0" style={{ color: item.type === 'Ville' ? HColors.orangeCI : item.type === 'Commune' ? HColors.vertCI : HColors.gold }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: HColors.darkBrown }}>{item.label}</div>
                  <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: item.type === 'Ville' ? HColors.orangeCI : item.type === 'Commune' ? HColors.vertCI : HColors.gold }}>
                    {item.type}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 -rotate-90" style={{ color: HColors.brown }} />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default AddressAutocomplete;
