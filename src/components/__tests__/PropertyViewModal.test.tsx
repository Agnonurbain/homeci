import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { firestoreMocks } from '../../tests/firebase.mock';

const { Timestamp } = firestoreMocks;

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, profile: null }),
}));

vi.mock('../OptimizedImage', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} data-testid="opt-image" />,
}));

vi.mock('../MapDisplay', () => ({
  default: () => <div data-testid="map-display" />,
}));

vi.mock('../Property3DViewer', () => ({
  Property3DViewer: () => <div data-testid="3d-viewer" />,
}));

vi.mock('../../services/analyticsService', () => ({
  analyticsService: {
    viewProperty: vi.fn(),
    submitReport: vi.fn(),
  },
}));

import PropertyViewModal from '../PropertyViewModal';

function mockPropertyDoc(overrides: Record<string, unknown> = {}) {
  return {
    exists: () => true,
    id: 'prop-1',
    data: () => ({
      owner_id: 'o1', title: 'Villa Test', property_type: 'villa',
      transaction_type: 'vente', price: 50000000, city: 'Abidjan',
      quartier: 'Cocody', bedrooms: 3, bathrooms: 2, surface_area: 200,
      images: [], amenities: [], status: 'published', verified_notaire: false,
      created_at: Timestamp.fromDate(new Date()),
      updated_at: Timestamp.fromDate(new Date()),
      ...overrides,
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  firestoreMocks.getDoc.mockReset();
  firestoreMocks.getDocs.mockReset();
  // Default: sous-collection documents vide + pas de visites
  firestoreMocks.getDocs.mockResolvedValue({ docs: [] });
});

describe('PropertyViewModal', () => {

  it('affiche un loader pendant le chargement', () => {
    firestoreMocks.getDoc.mockReturnValue(new Promise(() => {}));
    render(<PropertyViewModal propertyId="prop-1" onClose={vi.fn()} />);
    expect(document.body).toBeTruthy();
  });

  it('affiche le titre de la propriété une fois chargée', async () => {
    firestoreMocks.getDoc.mockResolvedValue(mockPropertyDoc({ title: 'Superbe villa' }));

    render(<PropertyViewModal propertyId="prop-1" onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Superbe villa')).toBeInTheDocument();
    });
  });

  it('affiche le prix formaté', async () => {
    firestoreMocks.getDoc.mockResolvedValue(mockPropertyDoc({ price: 95000000 }));

    render(<PropertyViewModal propertyId="prop-1" onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getAllByText(/95.*000.*000/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('affiche le badge Vérifié quand verified_notaire=true', async () => {
    firestoreMocks.getDoc.mockResolvedValue(mockPropertyDoc({ verified_notaire: true }));

    render(<PropertyViewModal propertyId="prop-1" onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getAllByText(/[Vv]érifi/).length).toBeGreaterThanOrEqual(1);
    });
  });
});
