import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RevokeModal, DelegationModal } from '../NotaireActionModals';

beforeEach(() => vi.clearAllMocks());

describe('RevokeModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    property: { id: 'p1', title: 'Villa Cocody' },
    hasActiveVisit: false,
    loading: false,
  };

  it('ne rend rien si isOpen est faux', () => {
    const { container } = render(<RevokeModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('affiche le titre de décertification', () => {
    render(<RevokeModal {...defaultProps} />);
    expect(screen.getByText('Décertifier ce bien ?')).toBeInTheDocument();
  });

  it('affiche le titre du bien concerné', () => {
    render(<RevokeModal {...defaultProps} />);
    expect(screen.getByText(/Villa Cocody/)).toBeInTheDocument();
  });

  it('affiche un avertissement si des visites actives existent', () => {
    render(<RevokeModal {...defaultProps} hasActiveVisit />);
    expect(screen.getByText(/visites sont programmées/)).toBeInTheDocument();
  });

  it('n\'affiche pas l\'avertissement si aucune visite active', () => {
    render(<RevokeModal {...defaultProps} hasActiveVisit={false} />);
    expect(screen.queryByText(/visites sont programmées/)).not.toBeInTheDocument();
  });

  it('permet de saisir un motif', () => {
    render(<RevokeModal {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Indiquez la raison précise...');
    fireEvent.change(textarea, { target: { value: 'Document falsifié' } });
    expect(textarea).toHaveValue('Document falsifié');
  });

  it('désactive le bouton confirmer si le motif est vide', () => {
    render(<RevokeModal {...defaultProps} />);
    const confirmBtn = screen.getByText('Confirmer le retrait');
    expect(confirmBtn).toBeDisabled();
  });

  it('active le bouton confirmer si le motif est rempli', () => {
    render(<RevokeModal {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Indiquez la raison précise...');
    fireEvent.change(textarea, { target: { value: 'Document falsifié' } });
    const confirmBtn = screen.getByText('Confirmer le retrait');
    expect(confirmBtn).not.toBeDisabled();
  });

  it('appelle onConfirm avec le motif au clic sur confirmer', () => {
    const onConfirm = vi.fn();
    render(<RevokeModal {...defaultProps} onConfirm={onConfirm} />);
    const textarea = screen.getByPlaceholderText('Indiquez la raison précise...');
    fireEvent.change(textarea, { target: { value: 'Faux documents' } });
    const confirmBtn = screen.getByText('Confirmer le retrait');
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledWith('Faux documents');
  });

  it('appelle onClose au clic sur annuler', () => {
    render(<RevokeModal {...defaultProps} />);
    const cancelBtn = screen.getByText('Annuler');
    fireEvent.click(cancelBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('affiche un spinner quand loading est vrai', () => {
    const { container } = render(<RevokeModal {...defaultProps} loading />);
    const textarea = screen.getByPlaceholderText('Indiquez la raison précise...');
    fireEvent.change(textarea, { target: { value: 'Raison' } });
    // Quand loading, le bouton n'affiche pas le texte mais le spinner
    expect(screen.queryByText('Confirmer le retrait')).not.toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});

describe('DelegationModal', () => {
  const defaultProps = {
    token: 'ABCD1234TOKEN',
    onClose: vi.fn(),
    action: 'certify' as const,
    propertyTitle: 'Villa Cocody',
  };

  it('ne rend rien si token est null/falsy', () => {
    const { container } = render(<DelegationModal {...defaultProps} token={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('affiche le titre "Jeton de Délégation Prêt"', () => {
    render(<DelegationModal {...defaultProps} />);
    expect(screen.getByText('Jeton de Délégation Prêt')).toBeInTheDocument();
  });

  it('affiche le token de délégation', () => {
    render(<DelegationModal {...defaultProps} />);
    expect(screen.getByText('ABCD1234TOKEN')).toBeInTheDocument();
  });

  it('affiche le titre du bien', () => {
    render(<DelegationModal {...defaultProps} />);
    expect(screen.getByText(/Villa Cocody/)).toBeInTheDocument();
  });

  it('mentionne "certification" pour l\'action certify', () => {
    render(<DelegationModal {...defaultProps} action="certify" />);
    expect(screen.getByText(/certification/)).toBeInTheDocument();
  });

  it('mentionne "décertification" pour l\'action decertify', () => {
    render(<DelegationModal {...defaultProps} action="decertify" />);
    expect(screen.getByText(/décertification/)).toBeInTheDocument();
  });

  it('copie le token au clic sur Copier', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    render(<DelegationModal {...defaultProps} />);
    const copyBtn = screen.getByText('Copier le code');
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABCD1234TOKEN');
  });

  it('appelle onClose au clic sur Fermer', () => {
    render(<DelegationModal {...defaultProps} />);
    const closeBtn = screen.getByText('Fermer et Terminer');
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
