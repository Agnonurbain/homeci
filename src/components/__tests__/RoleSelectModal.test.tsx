import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { firestoreMocks } from '../../tests/firebase.mock';

// Mock AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    refreshProfile: vi.fn(),
  }),
}));

// Mock KenteLine
vi.mock('../ui/KenteLine', () => ({
  KenteLine: () => <hr data-testid="kente-line" />,
}));

import RoleSelectModal from '../RoleSelectModal';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RoleSelectModal', () => {
  const defaultProps = {
    uid: 'user-123',
    displayName: 'Aymeric',
    photoURL: null,
    onDone: vi.fn(),
  };

  // ── Affichage ──

  it('affiche le nom de l\'utilisateur', () => {
    render(<RoleSelectModal {...defaultProps} />);
    expect(screen.getByText(/Aymeric/)).toBeInTheDocument();
  });

  it('affiche les 3 rôles disponibles', () => {
    render(<RoleSelectModal {...defaultProps} />);

    expect(screen.getByText('Locataire / Acheteur')).toBeInTheDocument();
    expect(screen.getByText('Propriétaire')).toBeInTheDocument();
    expect(screen.getByText('Notaire Agréé')).toBeInTheDocument();
  });

  it('affiche les descriptions des rôles', () => {
    render(<RoleSelectModal {...defaultProps} />);

    expect(screen.getByText(/cherche un bien/)).toBeInTheDocument();
    expect(screen.getByText(/loue ou vends/)).toBeInTheDocument();
    expect(screen.getByText(/invitation requis/)).toBeInTheDocument();
  });

  // ── Sélection de rôle ──

  it('sélectionne Locataire par défaut', () => {
    render(<RoleSelectModal {...defaultProps} />);

    // Le bouton Confirmer doit être activable
    const confirmBtn = screen.getByText(/[Cc]onfirmer/);
    expect(confirmBtn).toBeInTheDocument();
  });

  it('permet de sélectionner Propriétaire', () => {
    render(<RoleSelectModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Propriétaire'));
    // Aucun champ de code ne doit apparaître
    expect(screen.queryByPlaceholderText(/code/i)).not.toBeInTheDocument();
  });

  // ── Code Notaire ──

  it('affiche le champ de code quand Notaire est sélectionné', () => {
    render(<RoleSelectModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Notaire Agréé'));
    const codeInput = screen.getByPlaceholderText(/invitation/i);
    expect(codeInput).toBeInTheDocument();
  });

  it('affiche le bouton Valider quand un code est saisi', () => {
    render(<RoleSelectModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Notaire Agréé'));
    const codeInput = screen.getByPlaceholderText(/invitation/i);
    fireEvent.change(codeInput, { target: { value: 'ABC123' } });
    expect(screen.getByText('Valider')).toBeInTheDocument();
  });

  // ── Confirmation pour Locataire/Propriétaire ──

  it('appelle updateDoc quand on confirme Locataire', async () => {
    render(<RoleSelectModal {...defaultProps} />);

    const confirmBtn = screen.getByText(/[Cc]onfirmer/);
    fireEvent.click(confirmBtn);

    // updateDoc devrait être appelé sur users/{uid}
    await vi.waitFor(() => {
      expect(firestoreMocks.updateDoc).toHaveBeenCalled();
    });
  });
});
