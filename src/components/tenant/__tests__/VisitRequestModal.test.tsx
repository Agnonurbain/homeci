import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VisitRequestModal from '../VisitRequestModal';
import type { Property } from '../../../services/propertyService';

const mockProperty: Property = {
  id: 'prop-1', owner_id: 'owner-1', title: 'Villa Cocody',
  property_type: 'maison', transaction_type: 'location', price: 200000,
  city: 'Abidjan', commune: 'Cocody', quartier: null, district: null,
  region: null, departement: null, address: null, latitude: null, longitude: null,
  bedrooms: 3, bathrooms: 2, surface_area: 120,
  land_area: null, rooms_count: null, hotel_stars: null,
  furnished: false, parking: false, amenities: [],
  images: ['https://example.com/villa.jpg'], videos: [], documents: [],
  status: 'published', verified_notaire: false, verification_date: null,
  notaire_id: null, views_count: 20, featured: false, available_from: null,
  nb_etages: null, etage_appartement: null, nb_etages_immeuble: null,
  annee_construction: null, ascenseur: false, interphone: false,
  surface_par_unite: null, chambres_par_unite: null, cuisine_par_unite: false,
  needs_status_update: false,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
};

vi.mock('../../../services/availabilityService', () => ({
  availabilityService: { getAvailability: vi.fn(async () => null), getAvailableSlots: vi.fn(() => []) },
}));

vi.mock('../../ScrollTimePicker', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <input data-testid="time-picker" value={value} onChange={e => onChange(e.target.value)} />
  ),
}));

describe('VisitRequestModal', () => {
  it('ne rend rien quand property est null', () => {
    const { container } = render(
      <VisitRequestModal property={null} onClose={vi.fn()} onSubmit={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('affiche le titre et le nom du bien', () => {
    render(
      <VisitRequestModal property={mockProperty} onClose={vi.fn()} onSubmit={vi.fn()} />
    );
    expect(screen.getByText(/Plannifier une Visite/)).toBeInTheDocument();
    expect(screen.getByText('Villa Cocody')).toBeInTheDocument();
  });

  it('appelle onClose au clic sur X', () => {
    const onClose = vi.fn();
    render(
      <VisitRequestModal property={mockProperty} onClose={onClose} onSubmit={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: '' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('desactive le bouton quand date ou heure sont vides', () => {
    render(
      <VisitRequestModal property={mockProperty} onClose={vi.fn()} onSubmit={vi.fn()} />
    );
    const btn = screen.getByText('Envoyer la demande');
    expect(btn).toBeDisabled();
  });
});
