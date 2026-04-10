/**
 * HOMECI — Tests: VisitDisclaimerModal
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VisitDisclaimerModal from '../VisitDisclaimerModal';

const mockData = {
  propertyTitle: 'Appartement Cocody',
  visitDate: '2026-04-15T10:00:00Z',
};

function renderModal(overrides: Partial<React.ComponentProps<typeof VisitDisclaimerModal>> = {}) {
  const props = {
    data: mockData,
    onClose: vi.fn(),
    ...overrides,
  };
  render(<VisitDisclaimerModal {...props} />);
  return props;
}

describe('VisitDisclaimerModal', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('affiche le titre "Visite confirmee -- Vos obligations"', () => {
    renderModal();
    expect(screen.getByText(/Visite confirmée/)).toBeInTheDocument();
  });

  it('affiche le titre du bien', () => {
    renderModal();
    expect(screen.getByText(/Appartement Cocody/)).toBeInTheDocument();
  });

  it('affiche la date de la visite', () => {
    renderModal();
    // Date formatée en fr-FR
    expect(screen.getByText(/mercredi 15 avril 2026|15.*avril.*2026|15\/04\/2026/)).toBeInTheDocument();
  });

  it('explique que le bien est en cours de transaction', () => {
    renderModal();
    expect(screen.getByText(/cours de transaction/)).toBeInTheDocument();
  });

  it('affiche les 2 issues possibles', () => {
    renderModal();
    expect(screen.getByText(/Loué.*Vendu/)).toBeInTheDocument();
    expect(screen.getByText(/Transaction non aboutie/)).toBeInTheDocument();
  });

  it('affiche l\'avertissement legal CGU', () => {
    renderModal();
    expect(screen.getByText(/CGU/)).toBeInTheDocument();
    expect(screen.getByText(/1382/)).toBeInTheDocument();
  });

  it('affiche le bouton "J\'ai compris mes obligations"', () => {
    renderModal();
    expect(screen.getByText(/J'ai compris/)).toBeInTheDocument();
  });

  it('appelle onClose quand on clique sur le bouton', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByText(/J'ai compris/));
    expect(onClose).toHaveBeenCalled();
  });
});
