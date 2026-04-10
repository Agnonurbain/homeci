/**
 * HOMECI — Tests: VisitRequestsTab (owner)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VisitRequestsTab from '../VisitRequestsTab';
import type { VisitRequest } from '../../../services/visitService';

// Mock DossierViewerModal
vi.mock('../DossierViewerModal', () => ({
  default: vi.fn(({ onClose }) => <button onClick={onClose}>Fermer dossier</button>),
}));

const baseVisit: VisitRequest = {
  id: 'visit-1',
  property_id: 'prop-1',
  property_title: 'Appartement Cocody',
  property_city: 'Abidjan',
  owner_id: 'owner-1',
  tenant_id: 'tenant-1',
  tenant_name: 'Jean Dupont',
  preferred_date: '2026-04-15',
  preferred_time: '10:00',
  status: 'pending',
  counter_date: undefined,
  counter_time: undefined,
  counter_proposed_by: undefined,
  owner_notes: '',
  tenant_phone: '+225 07 00 00 00',
  tenant_email: 'jean@example.com',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const noop = vi.fn();
const noopAsync = vi.fn(async () => {});

function renderTab(overrides: Partial<React.ComponentProps<typeof VisitRequestsTab>> = {}) {
  const props = {
    visits: [baseVisit],
    filteredVisits: [baseVisit],
    filter: 'all' as const,
    setFilter: noop,
    actionLoading: false,
    chatLoadingId: null,
    onRespond: noopAsync,
    onMarkCompleted: noopAsync,
    onOpenChat: noopAsync,
    ...overrides,
  };
  render(<VisitRequestsTab {...props} />);
  return props;
}

describe('VisitRequestsTab', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('affiche le titre "Demandes de Visite"', () => {
    renderTab();
    expect(screen.getByText(/Demandes de Visite/)).toBeInTheDocument();
  });

  it('affiche le nombre de demandes', () => {
    renderTab({ filteredVisits: [baseVisit, { ...baseVisit, id: 'v2' }], visits: [baseVisit, { ...baseVisit, id: 'v2' }] });
    // Le texte exact peut varier
    const countText = screen.queryByText(/2.*demande/) || screen.queryByText(/demande.*2/);
    expect(countText).toBeInTheDocument();
  });

  it('affiche les filtres : Toutes, En attente, Acceptées, Refusées', () => {
    renderTab({ visits: [baseVisit] });
    expect(screen.getByText(/Toutes \(/)).toBeInTheDocument();
    expect(screen.getByText(/En attente \(/)).toBeInTheDocument();
    expect(screen.getByText(/Acceptées \(/)).toBeInTheDocument();
    expect(screen.getByText(/Refusées \(/)).toBeInTheDocument();
  });

  it('appelle setFilter quand on clique sur un filtre', () => {
    const setFilter = vi.fn();
    renderTab({ visits: [baseVisit], setFilter });
    fireEvent.click(screen.getByText(/En attente \(/));
    expect(setFilter).toHaveBeenCalledWith('pending');
  });

  it('affiche le nom du locataire et le titre du bien', () => {
    renderTab();
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('Appartement Cocody')).toBeInTheDocument();
  });

  it('affiche le bouton "Dossier"', () => {
    renderTab();
    expect(screen.getByText('Dossier')).toBeInTheDocument();
  });

  it('affiche le bouton "Repondre" pour une visite pending', () => {
    renderTab({ filteredVisits: [{ ...baseVisit, status: 'pending' }] });
    expect(screen.getByText('Répondre')).toBeInTheDocument();
  });

  it('affiche le bouton "Visite effectuée" pour une visite accepted', () => {
    renderTab({ filteredVisits: [{ ...baseVisit, status: 'accepted' }] });
    expect(screen.getByText(/Visite effectuée/)).toBeInTheDocument();
    expect(screen.queryByText('Répondre')).not.toBeInTheDocument();
  });

  it('appelle onRespond quand on clique sur Répondre', () => {
    const onRespond = vi.fn();
    renderTab({ filteredVisits: [{ ...baseVisit, status: 'pending' }], onRespond });
    fireEvent.click(screen.getByText('Répondre'));
    expect(onRespond).toHaveBeenCalledWith(expect.objectContaining({ id: 'visit-1' }));
  });

  it('appelle onMarkCompleted pour une visite acceptée', () => {
    const onMarkCompleted = vi.fn();
    renderTab({
      filteredVisits: [{ ...baseVisit, status: 'accepted' }],
      onMarkCompleted,
    });
    fireEvent.click(screen.getByText(/Visite effectuée/));
    expect(onMarkCompleted).toHaveBeenCalledWith(expect.objectContaining({ id: 'visit-1' }));
  });

  it('affiche une contre-proposition du locataire', () => {
    const counterVisit = {
      ...baseVisit,
      status: 'counter_proposed' as const,
      counter_proposed_by: 'tenant' as const,
      counter_date: '2026-04-20',
      counter_time: '14:00',
    };
    renderTab({ filteredVisits: [counterVisit] });
    expect(screen.getByText(/Proposition locataire/)).toBeInTheDocument();
  });

  it('affiche un état vide quand aucune visite', () => {
    renderTab({ filteredVisits: [] });
    expect(screen.getByText(/Aucune demande/)).toBeInTheDocument();
  });

  it('affiche un spinner sur le bouton Chat quand chatLoadingId correspond', () => {
    renderTab({
      filteredVisits: [{ ...baseVisit, status: 'accepted' }],
      chatLoadingId: 'visit-1',
    });
    // Le bouton devrait contenir un spinner (div animate-spin)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
