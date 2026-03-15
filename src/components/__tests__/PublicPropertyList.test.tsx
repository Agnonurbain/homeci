import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { firestoreMocks } from '../../tests/firebase.mock';
import { createMockProperty } from '../../tests/factories';

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

import PublicPropertyList from '../PublicPropertyList';

beforeEach(() => {
  vi.clearAllMocks();
  firestoreMocks.getDocs.mockReset();
});

describe('PublicPropertyList', () => {

  it('affiche le chargement initialement', () => {
    firestoreMocks.getDocs.mockReturnValue(new Promise(() => {}));
    render(<PublicPropertyList />);
    const loadingEls = screen.getAllByText(/[Cc]hargement/);
    expect(loadingEls.length).toBeGreaterThanOrEqual(1);
  });

  it('affiche "Aucun bien trouvé" quand la liste est vide', async () => {
    firestoreMocks.getDocs.mockResolvedValueOnce({ docs: [] });
    render(<PublicPropertyList />);

    await waitFor(() => {
      expect(screen.getByText('Aucun bien trouvé')).toBeInTheDocument();
    });
  });

  it('affiche les cards de propriétés', async () => {
    firestoreMocks.getDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 'p1',
          data: () => ({
            title: 'Villa Cocody', property_type: 'villa', transaction_type: 'vente',
            price: 50000000, city: 'Cocody', status: 'published', owner_id: 'o1',
            images: [], amenities: [],
            created_at: Timestamp.fromDate(new Date()),
            updated_at: Timestamp.fromDate(new Date()),
          }),
        },
        {
          id: 'p2',
          data: () => ({
            title: 'Appart Plateau', property_type: 'appartement', transaction_type: 'location',
            price: 300000, city: 'Plateau', status: 'published', owner_id: 'o2',
            images: [], amenities: [],
            created_at: Timestamp.fromDate(new Date()),
            updated_at: Timestamp.fromDate(new Date()),
          }),
        },
      ],
    });

    render(<PublicPropertyList />);

    await waitFor(() => {
      expect(screen.getByText('Villa Cocody')).toBeInTheDocument();
      expect(screen.getByText('Appart Plateau')).toBeInTheDocument();
    });
  });

  it('affiche le nombre de biens trouvés', async () => {
    firestoreMocks.getDocs.mockResolvedValueOnce({
      docs: [
        { id: 'p1', data: () => ({ title: 'Test', property_type: 'maison', transaction_type: 'vente', price: 1, city: 'X', status: 'published', owner_id: 'o', images: [], amenities: [], created_at: Timestamp.fromDate(new Date()), updated_at: Timestamp.fromDate(new Date()) }) },
        { id: 'p2', data: () => ({ title: 'Test2', property_type: 'villa', transaction_type: 'vente', price: 2, city: 'Y', status: 'published', owner_id: 'o', images: [], amenities: [], created_at: Timestamp.fromDate(new Date()), updated_at: Timestamp.fromDate(new Date()) }) },
      ],
    });

    render(<PublicPropertyList />);

    await waitFor(() => {
      expect(screen.getByText(/2 biens trouvés/)).toBeInTheDocument();
    });
  });
});
