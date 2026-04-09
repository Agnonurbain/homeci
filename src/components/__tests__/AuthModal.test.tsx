import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockSignInWithProvider = vi.fn();
const mockResetPassword = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    signInWithProvider: mockSignInWithProvider,
    resetPassword: mockResetPassword,
  }),
}));

vi.mock('../ui/KenteLine', () => ({
  KenteLine: () => <hr data-testid="kente-line" />,
}));

vi.mock('../../services/analyticsService', () => ({
  analyticsService: { login: vi.fn(), signup: vi.fn() },
}));

import { AuthModal } from '../AuthModal';

beforeEach(() => { vi.clearAllMocks(); });

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

  it("bascule en mode inscription au clic sur S'inscrire", () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    fireEvent.click(screen.getByText("S'inscrire"));
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

  it("n'affiche pas de toggle Email/Téléphone (désactivé)", () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    expect(screen.queryByText(/Téléphone/)).not.toBeInTheDocument();
  });

  // ── Mot de passe oublié ──

  it('affiche le lien "Mot de passe oublié ?" en mode login', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    expect(screen.getByText(/Mot de passe oublié/)).toBeInTheDocument();
  });

  it("n'affiche pas Mot de passe oublié en mode signup", () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="signup" />);
    expect(screen.queryByText(/Mot de passe oublié/)).not.toBeInTheDocument();
  });

  it('affiche le formulaire de réinitialisation', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    fireEvent.click(screen.getByText(/Mot de passe oublié/));
    expect(screen.getByText('Envoyer le lien de réinitialisation')).toBeInTheDocument();
  });

  it('envoie le lien de réinitialisation', async () => {
    mockResetPassword.mockResolvedValueOnce(undefined);
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    fireEvent.click(screen.getByText(/Mot de passe oublié/));
    fireEvent.change(screen.getByPlaceholderText('votre@email.com'), { target: { value: 'test@homeci.ci' } });
    fireEvent.click(screen.getByText('Envoyer le lien de réinitialisation'));
    await waitFor(() => { expect(mockResetPassword).toHaveBeenCalledWith('test@homeci.ci'); });
  });

  it('affiche la confirmation après envoi', async () => {
    mockResetPassword.mockResolvedValueOnce(undefined);
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    fireEvent.click(screen.getByText(/Mot de passe oublié/));
    fireEvent.change(screen.getByPlaceholderText('votre@email.com'), { target: { value: 'test@homeci.ci' } });
    fireEvent.click(screen.getByText('Envoyer le lien de réinitialisation'));
    await waitFor(() => {
      expect(screen.getByText(/Email envoyé/)).toBeInTheDocument();
      expect(screen.getByText(/expire dans 1 heure/)).toBeInTheDocument();
    });
  });

  it("affiche une erreur si l'email est vide", async () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    fireEvent.click(screen.getByText(/Mot de passe oublié/));
    fireEvent.click(screen.getByText('Envoyer le lien de réinitialisation'));
    await waitFor(() => { expect(screen.getByText(/Veuillez saisir/)).toBeInTheDocument(); });
  });

  it('affiche une erreur si aucun compte trouvé', async () => {
    mockResetPassword.mockRejectedValueOnce({ code: 'auth/user-not-found' });
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    fireEvent.click(screen.getByText(/Mot de passe oublié/));
    fireEvent.change(screen.getByPlaceholderText('votre@email.com'), { target: { value: 'x@test.ci' } });
    fireEvent.click(screen.getByText('Envoyer le lien de réinitialisation'));
    await waitFor(() => { expect(screen.getByText(/Aucun compte trouvé/)).toBeInTheDocument(); });
  });

  it('retourne au login au clic sur Retour', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    fireEvent.click(screen.getByText(/Mot de passe oublié/));
    fireEvent.click(screen.getByText(/Retour à la connexion/));
    expect(screen.getByText('Se connecter')).toBeInTheDocument();
  });
});
