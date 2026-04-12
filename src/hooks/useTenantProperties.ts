import { useState, useEffect, useCallback, useMemo } from 'react';
import { propertyService, type Property } from '../services/propertyService';
import type { FilterValues } from '../components/PropertyFilters';
import { parseAdvancedSearch } from '../utils/searchParser';
import { analyticsService } from '../services/analyticsService';

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'views' | 'surface_asc';

export function useTenantProperties() {
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [filtered, setFiltered] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    let mounted = true;
    propertyService.getProperties({ status: 'published' })
      .then(data => {
        if (mounted) {
          setAllProperties(data);
          setFiltered(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Error fetching properties:', err);
        if (mounted) {
          setError('Impossible de charger les biens.');
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  /**
   * Filtre les propriétés selon les filtres (dropdown + NLP search)
   */
  const handleFilterChange = useCallback((filters: FilterValues) => {
    let r = [...allProperties];

    // ── Filtres dropdown ──
    if (filters.propertyType) r = r.filter(p => p.property_type === filters.propertyType);
    if (filters.transactionType) r = r.filter(p => p.transaction_type === filters.transactionType || p.transaction_type === 'both');
    if (filters.district) r = r.filter(p => p.district === filters.district);
    if (filters.region) r = r.filter(p => p.region === filters.region);
    if (filters.departement) r = r.filter(p => p.departement === filters.departement);
    if (filters.city) r = r.filter(p => p.city === filters.city);
    if (filters.commune) r = r.filter(p => p.commune === filters.commune);
    if (filters.quartier) r = r.filter(p => p.quartier?.toLowerCase().includes(filters.quartier.toLowerCase()));
    if (filters.minPrice) r = r.filter(p => p.price >= Number(filters.minPrice));
    if (filters.maxPrice) r = r.filter(p => p.price <= Number(filters.maxPrice));
    if (filters.bedrooms) r = r.filter(p => p.bedrooms >= Number(filters.bedrooms));
    if (filters.furnished) r = r.filter(p => p.furnished);
    if (filters.parking) r = r.filter(p => p.parking);
    if (filters.verifiedOnly) r = r.filter(p => p.verified_notaire);

    // ── NLP Search (parseAdvancedSearch) ──
    if (filters.advancedQuery && filters.advancedQuery.trim()) {
      const parsed = parseAdvancedSearch(filters.advancedQuery);

      // Filtre par type de bien (si spécifié dans la recherche NLP mais pas dans les dropdowns)
      if (parsed.propertyType && !filters.propertyType) {
        r = r.filter(p => p.property_type === parsed.propertyType);
      }

      // Filtre par transaction
      if (parsed.transactionType && !filters.transactionType) {
        r = r.filter(p => p.transaction_type === parsed.transactionType || p.transaction_type === 'both');
      }

      // Filtre par localisation (quartier/commune/city)
      if (parsed.quartier && !filters.quartier) {
        r = r.filter(p => p.quartier?.toLowerCase().includes(parsed.quartier!.toLowerCase()));
      }
      if (parsed.commune && !filters.commune) {
        r = r.filter(p => p.commune?.toLowerCase().includes(parsed.commune!.toLowerCase()));
      }
      if (parsed.city && !filters.city) {
        r = r.filter(p => p.city?.toLowerCase().includes(parsed.city!.toLowerCase()));
      }

      // Filtre par prix (NLP operators)
      if (parsed.exactPrice !== undefined) {
        r = r.filter(p => p.price === parsed.exactPrice);
      } else {
        if (parsed.minPrice !== undefined) r = r.filter(p => p.price >= parsed.minPrice!);
        if (parsed.maxPrice !== undefined) r = r.filter(p => p.price <= parsed.maxPrice!);
      }

      // Filtre par chambres (NLP operators)
      if (parsed.exactBedrooms !== undefined) {
        r = r.filter(p => p.bedrooms === parsed.exactBedrooms);
      } else {
        if (parsed.minBedrooms !== undefined) r = r.filter(p => p.bedrooms >= parsed.minBedrooms!);
        if (parsed.maxBedrooms !== undefined) r = r.filter(p => p.bedrooms <= parsed.maxBedrooms!);
      }

      // Filtre étoiles (hôtels)
      if (parsed.stars !== undefined) {
        r = r.filter(p => p.hotel_stars === parsed.stars);
      }

      // Filtre vérifié notaire
      if (parsed.verifiedNotaire && !filters.verifiedOnly) {
        r = r.filter(p => p.verified_notaire);
      }

      // Keywords: recherche dans title, description-like fields, amenities
      if (parsed.keywords && parsed.keywords.length > 0) {
        const allKeywords = [...parsed.keywords, ...parsed.keywords.map(k => k.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))];
        r = r.filter(p => {
          const searchableText = [
            p.title,
            p.city,
            p.commune,
            p.quartier,
            p.district,
            p.property_type,
            ...(p.amenities || []),
          ].join(' ').toLowerCase();

          return allKeywords.some(kw => searchableText.includes(kw));
        });
      }
    }

    setFiltered(r);
    if (Object.values(filters).some(v => v)) analyticsService.search('filter', r.length);
  }, [allProperties]);

  /**
   * Trie les propriétés filtrées selon le critère sélectionné
   */
  const sorted = useMemo(() => {
    const sorted = [...filtered];

    switch (sortBy) {
      case 'price_asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'views':
        sorted.sort((a, b) => b.views_count - a.views_count);
        break;
      case 'surface_asc':
        sorted.sort((a, b) => (a.surface_area || 0) - (b.surface_area || 0));
        break;
    }

    return sorted;
  }, [filtered, sortBy]);

  return {
    allProperties,
    filtered: sorted,
    sortBy,
    setSortBy,
    loading,
    error,
    handleFilterChange,
  };
}
