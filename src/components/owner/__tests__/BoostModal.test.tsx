/**
 * HOMECI — Tests: BoostModal (owner)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BoostModal from '../BoostModal';
import type { Property } from '../../../types/property';

// Mock KenteLine
vi.mock('../../components/KenteLine', () => ({
  default: vi.fn(() => <div data-testid="kente-line" />),
}));

const baseProperty: Property = {
  id: 'prop-1',
  owner_id: 'owner-1',
  title: 'Appartement Cocody',

  property_type: 'appartement',
  transaction_type: 'location',
  price: 150000,
  city: 'Abidjan',
  commune: 'Cocody',
  quartier: 'Angré',
  latitude: 5.36,
  longitude: -4.01,
  bedrooms: 2,
  bathrooms: 1,
  surface_area: 80,
  images: [],
  documents: [],
  status: 'published',
  verified_notaire: false,
  notaire_id: null,
  views_count: 45,
  needs_status_update: false,
  created_at: { toDate: () => new Date() } as any,
  updated_at: { toDate: () => new Date() } as any,
} as unknown as Property;

function renderModal(overrides: Partial<React.ComponentProps<typeof BoostModal>> = {}) {
  const props = {
    property: baseProperty,
    duration: 7 as const,
    onDurationChange: vi.fn(),
    onConfirm: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  render(<BoostModal {...props} />);
  return props;
}

describe('BoostModal', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('affiche le titre "Sponsoriser le bien"', () => {
    renderModal();
    expect(screen.getByText(/Sponsoriser le bien/)).toBeInTheDocument();
  });

  it('affiche le titre du bien dans la description', () => {
    renderModal();
    expect(screen.getByText(/Appartement Cocody/)).toBeInTheDocument();
  });

  it('mentionne "3x plus de contacts"', () => {
    renderModal();
    expect(screen.getByText(/3x plus de contacts/)).toBeInTheDocument();
  });

  it('affiche les 3 options de durée avec les prix', () => {
    renderModal();
    expect(screen.getByText('7 jours')).toBeInTheDocument();
    expect(screen.getByText('14 jours')).toBeInTheDocument();
    expect(screen.getByText('30 jours')).toBeInTheDocument();
    // Les prix sont affichs comme nombres bruts (5000, 9000, 15000)
    expect(screen.getByText('5000')).toBeInTheDocument();
    expect(screen.getByText('9000')).toBeInTheDocument();
    expect(screen.getByText('15000')).toBeInTheDocument();
  });

  it('appelle onDurationChange quand on clique sur une durée', () => {
    const onDurationChange = vi.fn();
    renderModal({ onDurationChange });
    const btns = screen.getAllByRole('button');
    // Cliquer sur le bouton "14 jours"
    const btn14 = btns.find(b => b.textContent?.includes('14 jours'));
    if (btn14) fireEvent.click(btn14);
    expect(onDurationChange).toHaveBeenCalledWith(14);
  });

  it('affiche le bouton "Activer le Boost" avec le prix', () => {
    renderModal({ duration: 7 });
    const btn = screen.getByText(/Activer le Boost/);
    expect(btn).toBeInTheDocument();
    expect(btn.textContent).toContain('5000');
  });

  it('met à jour le prix du bouton quand la durée change', () => {
    renderModal({ duration: 30 });
    const btn = screen.getByText(/Activer le Boost/);
    expect(btn.textContent).toContain('15000');
  });

  it('appelle onConfirm quand on clique sur Activer', () => {
    const onConfirm = vi.fn();
    renderModal({ duration: 7, onConfirm });
    fireEvent.click(screen.getByText(/Activer le Boost/));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 5000,
        title: expect.any(String),
        description: expect.any(String),
      })
    );
  });

  it('appelle onClose quand on clique sur le bouton X', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    // Premier bouton = X (close)
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it('mentionne les méthodes de paiement', () => {
    renderModal();
    expect(screen.getByText(/Orange Money/)).toBeInTheDocument();
    expect(screen.getByText(/Wave/)).toBeInTheDocument();
  });
});
