import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VisitsTab from '../VisitsTab';
import type { VisitRequest } from '../../../services/visitService';
import type { Property } from '../../../services/propertyService';

vi.mock('../../../services/visitService', () => ({
  visitService: {},
}));

vi.mock('../../ScrollTimePicker', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <input data-testid="scroll-time-picker" value={value} onChange={e => onChange(e.target.value)} />
  ),
}));

const mockProperty = (id: string, title = 'Villa Cocody'): Property => ({
  id, owner_id: 'owner-1', title, property_type: 'maison', transaction_type: 'location',
  price: 200000, city: 'Abidjan', commune: 'Cocody', quartier: null,
  district: null, region: null, departement: null, address: null,
  latitude: null, longitude: null, bedrooms: 3, bathrooms: 2, surface_area: 120,
  land_area: null, rooms_count: null, hotel_stars: null, furnished: false,
  parking: false, amenities: [], images: ['https://example.com/villa.jpg'],
  videos: [], documents: [], status: 'published', verified_notaire: false,
  verification_date: null, notaire_id: null, views_count: 20, featured: false,
  available_from: null, nb_etages: null, etage_appartement: null,
  nb_etages_immeuble: null, annee_construction: null, ascenseur: false,
  interphone: false, surface_par_unite: null, chambres_par_unite: null,
  cuisine_par_unite: false, needs_status_update: false,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
});

const mockVisit = (id: string, status: string, ov = {}): VisitRequest => ({
  id, property_id: 'prop-1', property_title: 'Villa Cocody', property_city: 'Abidjan',
  owner_id: 'owner-1', tenant_id: 'tenant-1', tenant_name: 'Jean Locataire',
  preferred_date: '2026-05-15', preferred_time: '10:00',
  status: status as VisitRequest['status'],
  counter_date: null, counter_time: null, counter_proposed_by: null, owner_notes: '',
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  ...ov,
});

const noop = vi.fn();
const defaultProps = {
  visitRequests: [mockVisit('v1', 'pending'), mockVisit('v2', 'accepted')],
  visitProperties: { 'prop-1': mockProperty('prop-1') },
  onViewProperty: noop, onOpenChat: noop, chatLoadingId: null,
  onAcceptCounter: noop, onProposeCounter: noop, onReplan: noop,
};

describe('VisitsTab', () => {
  it('affiche le message vide quand aucune demande', () => {
    render(<VisitsTab {...defaultProps} visitRequests={[]} visitProperties={{}} />);
    expect(screen.getByText(/Aucune demande/)).toBeInTheDocument();
  });

  it('affiche les demandes de visites', () => {
    render(<VisitsTab {...defaultProps} />);
    expect(screen.getAllByText('Villa Cocody').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Abidjan').length).toBeGreaterThanOrEqual(2);
  });

  it('affiche le prix du bien', () => {
    render(<VisitsTab {...defaultProps} />);
    expect(screen.getAllByText('200 000 FCFA/mois').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche les chambres', () => {
    render(<VisitsTab {...defaultProps} />);
    expect(screen.getAllByText('3 ch.').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche le bouton Voir le bien', () => {
    const onView = vi.fn();
    render(<VisitsTab {...defaultProps} onViewProperty={onView} />);
    fireEvent.click(screen.getAllByText('Voir le bien')[0]);
    expect(onView).toHaveBeenCalledWith('prop-1');
  });

  it('appelle onOpenChat pour une visite acceptee', () => {
    const onOpenChat = vi.fn();
    const accepted = mockVisit('v-acc', 'accepted');
    render(<VisitsTab {...defaultProps} visitRequests={[accepted]} onOpenChat={onOpenChat} />);
    fireEvent.click(screen.getByText('Discuter'));
    expect(onOpenChat).toHaveBeenCalled();
  });

  it('affiche la contre-proposition du proprietaire', () => {
    const counter = mockVisit('v3', 'counter_proposed', {
      counter_date: '2026-06-01', counter_time: '14:00', counter_proposed_by: 'owner' as const,
    });
    render(<VisitsTab {...defaultProps} visitRequests={[counter]} />);
    expect(screen.getByText(/Le propri\u00e9taire propose/)).toBeInTheDocument();
    expect(screen.getByText('Confirmer')).toBeInTheDocument();
  });

  it('appelle onAcceptCounter au clic sur Confirmer', () => {
    const onAccept = vi.fn();
    const counter = mockVisit('v4', 'counter_proposed', {
      counter_date: '2026-06-01', counter_time: '14:00', counter_proposed_by: 'owner' as const,
    });
    render(<VisitsTab {...defaultProps} visitRequests={[counter]} onAcceptCounter={onAccept} />);
    fireEvent.click(screen.getByText('Confirmer'));
    expect(onAccept).toHaveBeenCalledWith(counter);
  });

  it('affiche Replanifier pour les visites rejetees', () => {
    const rejected = mockVisit('v5', 'rejected');
    render(<VisitsTab {...defaultProps} visitRequests={[rejected]} />);
    expect(screen.getByText(/Replanifier/)).toBeInTheDocument();
  });

  it('appelle onReplanifier au clic sur Replanifier', () => {
    const onReplan = vi.fn();
    const rejected = mockVisit('v5', 'rejected');
    const prop = mockProperty('prop-1');
    render(<VisitsTab {...defaultProps} visitRequests={[rejected]} onReplan={onReplan} visitProperties={{ 'prop-1': prop }} />);
    fireEvent.click(screen.getByText(/Replanifier/));
    expect(onReplan).toHaveBeenCalledWith(prop);
  });
});
