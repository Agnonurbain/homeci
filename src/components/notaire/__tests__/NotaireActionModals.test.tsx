import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RevokeModal, DelegationModal } from '../NotaireActionModals';

describe('RevokeModal (Decertification)', () => {
  const mockProperty = { id: 'p1', title: 'Villa Cocody' };
  const noop = vi.fn();

  it('ne rend rien quand isOpen=false', () => {
    const { container } = render(
      <RevokeModal isOpen={false} onClose={noop} onConfirm={noop} property={mockProperty} hasActiveVisit={false} loading={false} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('affiche le titre de décertification', () => {
    render(
      <RevokeModal isOpen onClose={noop} onConfirm={noop} property={mockProperty} hasActiveVisit={false} loading={false} />
    );
    expect(screen.getByText(/Décertifier ce bien/)).toBeInTheDocument();
    expect(screen.getByText(/Villa Cocody/)).toBeInTheDocument();
  });

  it('affiche l\'avertissement visites actives', () => {
    render(
      <RevokeModal isOpen onClose={noop} onConfirm={noop} property={mockProperty} hasActiveVisit loading={false} />
    );
    expect(screen.getByText(/visites sont programmées/)).toBeInTheDocument();
  });

  it('désactive le bouton quand le motif est vide', () => {
    render(
      <RevokeModal isOpen onClose={noop} onConfirm={noop} property={mockProperty} hasActiveVisit={false} loading={false} />
    );
    const btn = screen.getByText('Confirmer le retrait');
    expect(btn).toBeDisabled();
  });

  it('active le bouton quand un motif est saisi et appelle onConfirm', () => {
    const onConfirm = vi.fn();
    render(
      <RevokeModal isOpen onClose={noop} onConfirm={onConfirm} property={mockProperty} hasActiveVisit={false} loading={false} />
    );
    const textarea = screen.getByPlaceholderText('Indiquez la raison précise...');
    fireEvent.change(textarea, { target: { value: 'Titre foncier falsifié' } });
    const btn = screen.getByText('Confirmer le retrait');
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(onConfirm).toHaveBeenCalledWith('Titre foncier falsifié');
  });

  it('appelle onClose quand on clique Annuler', () => {
    const onClose = vi.fn();
    render(
      <RevokeModal isOpen onClose={onClose} onConfirm={vi.fn()} property={mockProperty} hasActiveVisit={false} loading={false} />
    );
    fireEvent.click(screen.getByText('Annuler'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('DelegationModal', () => {
  const noop = vi.fn();

  it('ne rend rien quand token est null/undefined', () => {
    const { container } = render(
      <DelegationModal token={null} onClose={noop} action="certify" propertyTitle="Villa" />
    );
    expect(container.innerHTML).toBe('');
  });

  it('affiche le token de délégation', () => {
    render(
      <DelegationModal token="ABC-12345" onClose={noop} action="certify" propertyTitle="Villa Cocody" />
    );
    expect(screen.getByText('ABC-12345')).toBeInTheDocument();
    expect(screen.getByText(/certification/)).toBeInTheDocument();
    expect(screen.getByText(/Villa Cocody/)).toBeInTheDocument();
  });

  it('affiche "décertification" quand action=decertify', () => {
    render(
      <DelegationModal token="XYZ-99" onClose={noop} action="decertify" propertyTitle="Studio" />
    );
    expect(screen.getByText(/décertification/)).toBeInTheDocument();
  });

  it('copie le token dans le presse-papier', () => {
    const mockClipboard = { writeText: vi.fn(async () => {}) };
    Object.assign(navigator, { clipboard: mockClipboard });

    render(
      <DelegationModal token="TOKEN-123" onClose={noop} action="certify" propertyTitle="Test" />
    );
    fireEvent.click(screen.getByText(/Copier le code/));
    expect(mockClipboard.writeText).toHaveBeenCalledWith('TOKEN-123');
  });
});
