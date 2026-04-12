import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTenantProperties } from '../useTenantProperties';
import { propertyService } from '../../services/propertyService';

vi.mock('../../services/propertyService', () => ({
  propertyService: {
    getProperties: vi.fn(),
  },
}));

vi.mock('../../services/analyticsService', () => ({
  analyticsService: {
    search: vi.fn(),
  },
}));

const makeProperty = (overrides: Record<string, unknown> = {}) => ({
  id: `prop-${Math.random()}`,
  owner_id: 'owner-1',
  title: String(overrides.title || 'Test'),
  property_type: String(overrides.property_type || 'appartement'),
  transaction_type: String(overrides.transaction_type || 'location'),
  price: Number(overrides.price ?? 100000),
  city: String(overrides.city || 'Abidjan'),
  commune: String(overrides.commune || 'Cocody'),
  quartier: (overrides.quartier as string | null) ?? null,
  district: (overrides.district as string | null) ?? null,
  region: (overrides.region as string | null) ?? null,
  departement: (overrides.departement as string | null) ?? null,
  address: null, latitude: null, longitude: null,
  bedrooms: Number(overrides.bedrooms ?? 2),
  bathrooms: 1, surface_area: Number(overrides.surface_area ?? 50),
  land_area: null, rooms_count: null, hotel_stars: (overrides.hotel_stars as number | null) ?? null,
  furnished: Boolean(overrides.furnished), parking: Boolean(overrides.parking),
  amenities: (overrides.amenities as string[]) ?? [],
  images: [], videos: [], documents: [],
  status: 'published', verified_notaire: Boolean(overrides.verified_notaire),
  verification_date: null, notaire_id: null, views_count: Number(overrides.views_count ?? 10),
  featured: false, available_from: null,
  nb_etages: null, etage_appartement: null, nb_etages_immeuble: null,
  annee_construction: null, ascenseur: false, interphone: false,
  surface_par_unite: null, chambres_par_unite: null, cuisine_par_unite: false,
  needs_status_update: false,
  created_at: String(overrides.created_at || '2026-01-01T00:00:00Z'),
  updated_at: '2026-01-01T00:00:00Z',
});

describe('useTenantProperties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('charge les propriétés au montage', async () => {
    const mockProps = [makeProperty({ title: 'A' }), makeProperty({ title: 'B' })];
    vi.mocked(propertyService.getProperties).mockResolvedValue(mockProps as any);

    const { result } = renderHook(() => useTenantProperties());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.allProperties).toHaveLength(2);
    expect(result.current.filtered).toHaveLength(2);
  });

  it('gère les erreurs de chargement', async () => {
    vi.mocked(propertyService.getProperties).mockRejectedValue(new Error('Network'));

    const { result } = renderHook(() => useTenantProperties());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).not.toBeNull();
    });
  });

  describe('tri (sorting)', () => {
    it('trie par prix croissant', async () => {
      const mockProps = [
        makeProperty({ title: 'Cher', price: 300000 }),
        makeProperty({ title: 'Pas cher', price: 50000 }),
        makeProperty({ title: 'Moyen', price: 150000 }),
      ];
      vi.mocked(propertyService.getProperties).mockResolvedValue(mockProps as any);

      const { result } = renderHook(() => useTenantProperties());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.setSortBy('price_asc');
      });

      expect(result.current.filtered[0].title).toBe('Pas cher');
      expect(result.current.filtered[1].title).toBe('Moyen');
      expect(result.current.filtered[2].title).toBe('Cher');
    });

    it('trie par prix décroissant', async () => {
      const mockProps = [
        makeProperty({ title: 'Cher', price: 300000 }),
        makeProperty({ title: 'Pas cher', price: 50000 }),
        makeProperty({ title: 'Moyen', price: 150000 }),
      ];
      vi.mocked(propertyService.getProperties).mockResolvedValue(mockProps as any);

      const { result } = renderHook(() => useTenantProperties());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.setSortBy('price_desc');
      });

      expect(result.current.filtered[0].title).toBe('Cher');
      expect(result.current.filtered[1].title).toBe('Moyen');
      expect(result.current.filtered[2].title).toBe('Pas cher');
    });

    it('trie par popularité (views_count)', async () => {
      const mockProps = [
        makeProperty({ title: 'Peu vu', views_count: 5 }),
        makeProperty({ title: 'Populaire', views_count: 500 }),
        makeProperty({ title: 'Moyen', views_count: 50 }),
      ];
      vi.mocked(propertyService.getProperties).mockResolvedValue(mockProps as any);

      const { result } = renderHook(() => useTenantProperties());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.setSortBy('views');
      });

      expect(result.current.filtered[0].title).toBe('Populaire');
      expect(result.current.filtered[1].title).toBe('Moyen');
      expect(result.current.filtered[2].title).toBe('Peu vu');
    });

    it('trie par surface croissante', async () => {
      const mockProps = [
        makeProperty({ title: 'Grand', surface_area: 200 }),
        makeProperty({ title: 'Petit', surface_area: 30 }),
        makeProperty({ title: 'Moyen', surface_area: 100 }),
      ];
      vi.mocked(propertyService.getProperties).mockResolvedValue(mockProps as any);

      const { result } = renderHook(() => useTenantProperties());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.setSortBy('surface_asc');
      });

      expect(result.current.filtered[0].title).toBe('Petit');
      expect(result.current.filtered[1].title).toBe('Moyen');
      expect(result.current.filtered[2].title).toBe('Grand');
    });
  });

  describe('filtrage NLP (parseAdvancedSearch)', () => {
    it('filtre par type de bien via recherche NLP', async () => {
      const mockProps = [
        makeProperty({ title: 'Appart', property_type: 'appartement' }),
        makeProperty({ title: 'Villa', property_type: 'villa' }),
      ];
      vi.mocked(propertyService.getProperties).mockResolvedValue(mockProps as any);

      const { result } = renderHook(() => useTenantProperties());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.handleFilterChange({
          propertyType: '', transactionType: '',
          district: '', region: '', departement: '',
          city: '', commune: '', quartier: '',
          minPrice: '', maxPrice: '', bedrooms: '',
          furnished: false, parking: false, verifiedOnly: false,
          advancedQuery: 'villa',
        });
      });

      expect(result.current.filtered).toHaveLength(1);
      expect(result.current.filtered[0].property_type).toBe('villa');
    });

    it('filtre par prix avec opérateur NLP', async () => {
      const mockProps = [
        makeProperty({ title: 'Cher', price: 500000 }),
        makeProperty({ title: 'Abordable', price: 80000 }),
        makeProperty({ title: 'Moyen', price: 200000 }),
      ];
      vi.mocked(propertyService.getProperties).mockResolvedValue(mockProps as any);

      const { result } = renderHook(() => useTenantProperties());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.handleFilterChange({
          propertyType: '', transactionType: '',
          district: '', region: '', departement: '',
          city: '', commune: '', quartier: '',
          minPrice: '', maxPrice: '', bedrooms: '',
          furnished: false, parking: false, verifiedOnly: false,
          advancedQuery: 'prix < 250000',
        });
      });

      expect(result.current.filtered).toHaveLength(2);
      expect(result.current.filtered.map(p => p.title)).toContain('Abordable');
      expect(result.current.filtered.map(p => p.title)).toContain('Moyen');
    });

    it('filtre par chambres avec opérateur NLP', async () => {
      const mockProps = [
        makeProperty({ title: '3ch', bedrooms: 3 }),
        makeProperty({ title: '1ch', bedrooms: 1 }),
        makeProperty({ title: '5ch', bedrooms: 5 }),
      ];
      vi.mocked(propertyService.getProperties).mockResolvedValue(mockProps as any);

      const { result } = renderHook(() => useTenantProperties());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.handleFilterChange({
          propertyType: '', transactionType: '',
          district: '', region: '', departement: '',
          city: '', commune: '', quartier: '',
          minPrice: '', maxPrice: '', bedrooms: '',
          furnished: false, parking: false, verifiedOnly: false,
          advancedQuery: 'chambres > 2',
        });
      });

      expect(result.current.filtered).toHaveLength(2);
      expect(result.current.filtered.map(p => p.title)).toContain('3ch');
      expect(result.current.filtered.map(p => p.title)).toContain('5ch');
    });

    it('filtre par étoiles hôtels', async () => {
      const mockProps = [
        makeProperty({ title: '3★', property_type: 'hotel', hotel_stars: 3 }),
        makeProperty({ title: '5★', property_type: 'hotel', hotel_stars: 5 }),
      ];
      vi.mocked(propertyService.getProperties).mockResolvedValue(mockProps as any);

      const { result } = renderHook(() => useTenantProperties());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.handleFilterChange({
          propertyType: '', transactionType: '',
          district: '', region: '', departement: '',
          city: '', commune: '', quartier: '',
          minPrice: '', maxPrice: '', bedrooms: '',
          furnished: false, parking: false, verifiedOnly: false,
          advancedQuery: '3 etoiles',
        });
      });

      expect(result.current.filtered).toHaveLength(1);
      expect(result.current.filtered[0].title).toBe('3★');
    });
  });

  describe('filtrage dropdown classique', () => {
    it('filtre par prix min/max des dropdowns', async () => {
      const mockProps = [
        makeProperty({ title: 'Cher', price: 500000 }),
        makeProperty({ title: 'Abordable', price: 80000 }),
        makeProperty({ title: 'Moyen', price: 200000 }),
      ];
      vi.mocked(propertyService.getProperties).mockResolvedValue(mockProps as any);

      const { result } = renderHook(() => useTenantProperties());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.handleFilterChange({
          propertyType: '', transactionType: '',
          district: '', region: '', departement: '',
          city: '', commune: '', quartier: '',
          minPrice: '100000', maxPrice: '300000', bedrooms: '',
          furnished: false, parking: false, verifiedOnly: false,
        });
      });

      expect(result.current.filtered).toHaveLength(1);
      expect(result.current.filtered[0].title).toBe('Moyen');
    });

    it('filtre par verifiedOnly', async () => {
      const mockProps = [
        makeProperty({ title: 'Vérifié', verified_notaire: true }),
        makeProperty({ title: 'Non vérifié', verified_notaire: false }),
      ];
      vi.mocked(propertyService.getProperties).mockResolvedValue(mockProps as any);

      const { result } = renderHook(() => useTenantProperties());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.handleFilterChange({
          propertyType: '', transactionType: '',
          district: '', region: '', departement: '',
          city: '', commune: '', quartier: '',
          minPrice: '', maxPrice: '', bedrooms: '',
          furnished: false, parking: false, verifiedOnly: true,
        });
      });

      expect(result.current.filtered).toHaveLength(1);
      expect(result.current.filtered[0].title).toBe('Vérifié');
    });
  });
});
