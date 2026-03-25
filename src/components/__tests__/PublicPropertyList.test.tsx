import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { firestoreMocks } from '../../tests/firebase.mock';
import { propertyService } from '../../services/propertyService';
import { adService } from '../../services/adService';

const { Timestamp } = firestoreMocks;

// Mock sub-components
vi.mock('../PropertyCard', () => ({
  PropertyCard: ({ property }: any) => <div data-testid="property-card">{property.title}</div>,
}));

vi.mock('../PropertyFilters', () => ({
  PropertyFilters: () => <div data-testid="property-filters" />,
}));

vi.mock('../PropertyViewModal', () => ({
  default: () => <div data-testid="property-view-modal" />,
}));

vi.mock('../../services/propertyService', () => ({
  propertyService: {
    getProperties: vi.fn(),
  },
}));

vi.mock('../../services/adService', () => ({
  adService: {
    getBoostedPropertyIds: vi.fn(async () => new Set()),
  },
}));

import PublicPropertyList from '../PublicPropertyList';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(adService.getBoostedPropertyIds).mockResolvedValue(new Set());
});

describe('PublicPropertyList', () => {

  it('affiche le chargement initialement', () => {
    vi.mocked(propertyService.getProperties).mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter>
        <HelmetProvider>
          <PublicPropertyList />
        </HelmetProvider>
      </MemoryRouter>
    );
    const loadingEls = screen.getAllByText(/[Cc]hargement/);
    expect(loadingEls.length).toBeGreaterThanOrEqual(1);
  });

  it('affiche "Aucun bien trouvé" quand la liste est vide', async () => {
    vi.mocked(propertyService.getProperties).mockResolvedValueOnce([]);
    render(
      <MemoryRouter>
        <HelmetProvider>
          <PublicPropertyList />
        </HelmetProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Aucun bien trouvé')).toBeInTheDocument();
    });
  });

  it('affiche les cards de propriétés', async () => {
    vi.mocked(propertyService.getProperties).mockResolvedValueOnce([
      {
        id: 'p1',
        title: 'Villa Cocody', property_type: 'villa', transaction_type: 'vente',
        price: 50000000, city: 'Cocody', status: 'published', owner_id: 'o1',
        images: [], amenities: [], bedrooms: 0, bathrooms: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      } as any,
      {
        id: 'p2',
        title: 'Appart Plateau', property_type: 'appartement', transaction_type: 'location',
        price: 300000, city: 'Plateau', status: 'published', owner_id: 'o2',
        images: [], amenities: [], bedrooms: 0, bathrooms: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      } as any,
    ]);

    render(
      <MemoryRouter>
        <HelmetProvider>
          <PublicPropertyList />
        </HelmetProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Villa Cocody')).toBeInTheDocument();
      expect(screen.getByText('Appart Plateau')).toBeInTheDocument();
    });
  });

  it('affiche le nombre de biens trouvés', async () => {
    vi.mocked(propertyService.getProperties).mockResolvedValueOnce([
      { id: 'p1', title: 'Test', property_type: 'maison', transaction_type: 'vente', price: 1, city: 'X', status: 'published', owner_id: 'o', images: [], amenities: [], bedrooms: 0, bathrooms: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any,
      { id: 'p2', title: 'Test2', property_type: 'villa', transaction_type: 'vente', price: 2, city: 'Y', status: 'published', owner_id: 'o', images: [], amenities: [], bedrooms: 0, bathrooms: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any,
    ]);

    render(
      <MemoryRouter>
        <HelmetProvider>
          <PublicPropertyList />
        </HelmetProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/2 biens trouvés/)).toBeInTheDocument();
    });
  });
});
