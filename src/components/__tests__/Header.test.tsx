import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockSignOut = vi.fn();
const mockUser = { current: null as any };
const mockProfile = { current: null as any };

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser.current,
    profile: mockProfile.current,
    signOut: mockSignOut,
  }),
}));

import { Header } from '../Header';

beforeEach(() => {
  vi.clearAllMocks();
  mockUser.current = null;
  mockProfile.current = null;
});

describe('Header (non connecté)', () => {
  it('affiche le logo HOMECI', () => {
    render(<Header />);
    expect(screen.getByText('HOMECI')).toBeInTheDocument();
  });

  it('affiche Connexion et Inscription', () => {
    render(<Header />);
    expect(screen.getByText('Connexion')).toBeInTheDocument();
    expect(screen.getByText("S'inscrire")).toBeInTheDocument();
  });

  it('appelle onLoginClick au clic sur Connexion', () => {
    const onLoginClick = vi.fn();
    render(<Header onLoginClick={onLoginClick} />);
    fireEvent.click(screen.getByText('Connexion'));
    expect(onLoginClick).toHaveBeenCalledTimes(1);
  });

  it('appelle onSignupClick au clic sur Inscription', () => {
    const onSignupClick = vi.fn();
    render(<Header onSignupClick={onSignupClick} />);
    fireEvent.click(screen.getByText("S'inscrire"));
    expect(onSignupClick).toHaveBeenCalledTimes(1);
  });
});

describe('Header (connecté)', () => {
  beforeEach(() => {
    mockUser.current = { uid: 'u1', email: 'test@test.com' };
    mockProfile.current = { id: 'u1', full_name: 'Aymeric', role: 'proprietaire' };
  });

  it('affiche Déconnexion quand connecté', () => {
    render(<Header />);
    expect(screen.getByText('Déconnexion')).toBeInTheDocument();
  });

  it('n\'affiche pas Connexion quand connecté', () => {
    render(<Header />);
    expect(screen.queryByText('Connexion')).not.toBeInTheDocument();
  });
});
