/**
 * HOMECI — Tests: PropertyStatusModal
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PropertyStatusModal from '../PropertyStatusModal';

const mockProperty = {
  id: 'prop-1',
  title: 'Appartement Cocody',
} as any;

function renderModal(overrides: Partial<React.ComponentProps<typeof PropertyStatusModal>> = {}) {
  const props = {
    property: mockProperty,
    loading: false,
    onSelectStatus: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  render(<PropertyStatusModal {...props} />);
  return props;
}

describe('PropertyStatusModal', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('affiche le titre', () => {
    renderModal();
    expect(screen.getByText(/résultat de la visite/)).toBeInTheDocument();
  });

  it('affiche le titre du bien', () => {
    renderModal();
    expect(screen.getByText(/Appartement Cocody/)).toBeInTheDocument();
  });

  it('affiche les 3 options de statut', () => {
    renderModal();
    expect(screen.getByText(/loué/i)).toBeInTheDocument();
    expect(screen.getByText(/vendu/i)).toBeInTheDocument();
    expect(screen.getByText(/Transaction non aboutie/)).toBeInTheDocument();
  });

  it('appelle onSelectStatus avec "rented" quand on clique sur loué', () => {
    const onSelectStatus = vi.fn();
    renderModal({ onSelectStatus });
    const btn = screen.getByText(/loué/i);
    fireEvent.click(btn);
    expect(onSelectStatus).toHaveBeenCalledWith('rented');
  });

  it('appelle onSelectStatus avec "sold" quand on clique sur vendu', () => {
    const onSelectStatus = vi.fn();
    renderModal({ onSelectStatus });
    const btn = screen.getByText(/vendu/i);
    fireEvent.click(btn);
    expect(onSelectStatus).toHaveBeenCalledWith('sold');
  });

  it('appelle onSelectStatus avec "published" quand on clique sur Transaction non aboutie', () => {
    const onSelectStatus = vi.fn();
    renderModal({ onSelectStatus });
    fireEvent.click(screen.getByText(/Transaction non aboutie/));
    expect(onSelectStatus).toHaveBeenCalledWith('published');
  });

  it('appelle onClose quand on clique sur "Je mettrai a jour plus tard"', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByText(/plus tard/));
    expect(onClose).toHaveBeenCalled();
  });

  it('désactive les boutons quand loading est true', () => {
    renderModal({ loading: true });
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      if (btn.textContent?.match(/loué|vendu|Transaction/i)) {
        expect(btn).toBeDisabled();
      }
    });
  });

  it('affiche l\'avertissement CGU', () => {
    renderModal();
    expect(screen.getByText(/CGU/)).toBeInTheDocument();
  });
});
