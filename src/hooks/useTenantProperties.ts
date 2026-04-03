import { useState, useEffect, useMemo } from 'react';
import { propertyService, type Property } from '../services/propertyService';
import type { FilterValues } from '../components/PropertyFilters';
import { analyticsService } from '../services/analyticsService';

export function useTenantProperties() {
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [filtered, setFiltered] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleFilterChange = (filters: FilterValues) => {
    let r = [...allProperties];
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
    
    if (filters.advancedQuery) {
      const q = filters.advancedQuery.toLowerCase();
      r = r.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.city.toLowerCase().includes(q) ||
        p.commune?.toLowerCase().includes(q) ||
        p.quartier?.toLowerCase().includes(q) ||
        p.amenities?.some(a => a.toLowerCase().includes(q))
      );
    }
    
    setFiltered(r);
    // Track search if any filter is active
    if (Object.values(filters).some(v => v)) analyticsService.search('filter', r.length);
  };

  return {
    allProperties,
    filtered,
    loading,
    error,
    handleFilterChange
  };
}
