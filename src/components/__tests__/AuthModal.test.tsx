import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { firestoreMocks } from '../../tests/firebase.mock';

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockSignInWithProvider = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    signInWithProvider: mockSignInWithProvider,
  }),
}));

vi.mock('../ui/KenteLine', () => ({
  KenteLine: () => <hr data-testid="kente-line" />,
}));

import { AuthModal } from '../AuthModal';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AuthModal', () => {

  it('ne rend rien quand isOpen=false', () => {
    render(<AuthModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Connexion')).not.toBeInTheDocument();
  });

  it('affiche la modal quand isOpen=true', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Connexion')).toBeInTheDocument();
  });

  it('affiche les champs email et mot de passe en mode login', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    expect(screen.getByPlaceholderText('votre@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('affiche le bouton Google', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/Google/)).toBeInTheDocument();
  });

  it('bascule en mode inscription au clic sur S\'inscrire', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    fireEvent.click(screen.getByText("S'inscrire"));
    // Le champ nom apparaît en mode inscription
    expect(screen.getByPlaceholderText('Votre nom et prénom')).toBeInTheDocument();
  });

  it('affiche les rôles Locataire et Propriétaire en mode inscription', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="signup" />);
    expect(screen.getByText(/Locataire/)).toBeInTheDocument();
    expect(screen.getByText(/Propriétaire/)).toBeInTheDocument();
  });

  it('affiche le bouton Se connecter en mode login', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    expect(screen.getByText('Se connecter')).toBeInTheDocument();
  });

  it('affiche le bouton Créer mon compte en mode signup', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="signup" />);
    expect(screen.getByText('Créer mon compte')).toBeInTheDocument();
  });

  it('affiche le toggle Email/Téléphone en mode login', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    expect(screen.getByText(/📱 Téléphone/)).toBeInTheDocument();
    expect(screen.getByText(/✉️ Email/)).toBeInTheDocument();
  });
});
