import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { firestoreMocks } from '../../tests/firebase.mock';

// Mock firebase/auth complet
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('../ui/KenteLine', () => ({
  KenteLine: () => <hr data-testid="kente-line" />,
}));

import AdminLogin from '../AdminLogin';

beforeEach(() => vi.clearAllMocks());

describe('AdminLogin', () => {
  const onSuccess = vi.fn();

  it('affiche le titre Portail Administrateur', () => {
    render(<AdminLogin onSuccess={onSuccess} />);
    expect(screen.getByText('Portail Administrateur')).toBeInTheDocument();
  });

  it('affiche les champs email et mot de passe', () => {
    render(<AdminLogin onSuccess={onSuccess} />);
    expect(screen.getByPlaceholderText('admin@homeci.ci')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('affiche le label Adresse email', () => {
    render(<AdminLogin onSuccess={onSuccess} />);
    expect(screen.getByText('Adresse email')).toBeInTheDocument();
  });

  it('permet de saisir un email', () => {
    render(<AdminLogin onSuccess={onSuccess} />);
    const input = screen.getByPlaceholderText('admin@homeci.ci') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'admin@test.com' } });
    expect(input.value).toBe('admin@test.com');
  });

  it('permet de saisir un mot de passe', () => {
    render(<AdminLogin onSuccess={onSuccess} />);
    const input = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'secret123' } });
    expect(input.value).toBe('secret123');
  });
});
