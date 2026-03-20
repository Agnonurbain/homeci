import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { firestoreMocks } from '../../tests/firebase.mock';

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockSignInWithProvider = vi.fn();
const mockSendPhoneOTP = vi.fn();
const mockVerifyPhoneOTP = vi.fn();
const mockResetPassword = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    signInWithProvider: mockSignInWithProvider,
    sendPhoneOTP: mockSendPhoneOTP,
    verifyPhoneOTP: mockVerifyPhoneOTP,
    resetPassword: mockResetPassword,
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

  // ── Affichage de base ──

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

  // ── Toggle Email / Téléphone (locataire) ──

  it('affiche le toggle Email/Téléphone en mode login (locataire par défaut)', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    expect(screen.getByText(/📱 Téléphone/)).toBeInTheDocument();
    expect(screen.getByText(/✉️ Email/)).toBeInTheDocument();
  });

  it('affiche le formulaire téléphone quand on clique sur Téléphone', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    fireEvent.click(screen.getByText(/📱 Téléphone/));
    expect(screen.getByPlaceholderText('07 00 00 00 00')).toBeInTheDocument();
    expect(screen.getByText('Recevoir le code SMS')).toBeInTheDocument();
  });

  it('affiche le préfixe +225 dans le formulaire téléphone', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    fireEvent.click(screen.getByText(/📱 Téléphone/));
    expect(screen.getByText('+225')).toBeInTheDocument();
  });

  it('envoie le code OTP au clic sur Recevoir le code SMS', async () => {
    mockSendPhoneOTP.mockResolvedValueOnce(undefined);
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    fireEvent.click(screen.getByText(/📱 Téléphone/));
    fireEvent.change(screen.getByPlaceholderText('07 00 00 00 00'), { target: { value: '0700000000' } });
    fireEvent.click(screen.getByText('Recevoir le code SMS'));

    await waitFor(() => {
      expect(mockSendPhoneOTP).toHaveBeenCalledWith('0700000000', 'recaptcha-container');
    });
  });

  it('affiche une erreur si le numéro est invalide', async () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    fireEvent.click(screen.getByText(/📱 Téléphone/));
    fireEvent.change(screen.getByPlaceholderText('07 00 00 00 00'), { target: { value: '123' } });
    fireEvent.click(screen.getByText('Recevoir le code SMS'));

    await waitFor(() => {
      expect(screen.getByText(/Numéro ivoirien invalide/)).toBeInTheDocument();
    });
  });

  it('affiche la saisie OTP après envoi réussi', async () => {
    mockSendPhoneOTP.mockResolvedValueOnce(undefined);
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    fireEvent.click(screen.getByText(/📱 Téléphone/));
    fireEvent.change(screen.getByPlaceholderText('07 00 00 00 00'), { target: { value: '0700000000' } });
    fireEvent.click(screen.getByText('Recevoir le code SMS'));

    await waitFor(() => {
      expect(screen.getByText(/Code envoyé/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
      expect(screen.getByText('Vérifier et se connecter')).toBeInTheDocument();
    });
  });

  // ── Mot de passe oublié ──

  it('affiche le lien "Mot de passe oublié ?" en mode login', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    expect(screen.getByText(/Mot de passe oublié/)).toBeInTheDocument();
  });

  it('n\'affiche pas "Mot de passe oublié ?" en mode signup', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="signup" />);
    expect(screen.queryByText(/Mot de passe oublié/)).not.toBeInTheDocument();
  });

  it('affiche le formulaire de réinitialisation au clic sur "Mot de passe oublié"', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    fireEvent.click(screen.getByText(/Mot de passe oublié/));
    expect(screen.getByText('Envoyer le lien de réinitialisation')).toBeInTheDocument();
    expect(screen.getByText(/Retour à la connexion/)).toBeInTheDocument();
  });

  it('affiche les instructions par rôle sur la page de réinitialisation', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    fireEvent.click(screen.getByText(/Mot de passe oublié/));
    expect(screen.getByText(/inscrit par téléphone/)).toBeInTheDocument();
    expect(screen.getByText(/Propriétaire \/ Notaire/)).toBeInTheDocument();
  });

  it('envoie le lien de réinitialisation', async () => {
    mockResetPassword.mockResolvedValueOnce(undefined);
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    fireEvent.click(screen.getByText(/Mot de passe oublié/));
    fireEvent.change(screen.getByPlaceholderText('votre@email.com'), { target: { value: 'test@homeci.ci' } });
    fireEvent.click(screen.getByText('Envoyer le lien de réinitialisation'));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@homeci.ci');
    });
  });

  it('affiche la confirmation après envoi du lien', async () => {
    mockResetPassword.mockResolvedValueOnce(undefined);
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    fireEvent.click(screen.getByText(/Mot de passe oublié/));
    fireEvent.change(screen.getByPlaceholderText('votre@email.com'), { target: { value: 'test@homeci.ci' } });
    fireEvent.click(screen.getByText('Envoyer le lien de réinitialisation'));

    await waitFor(() => {
      expect(screen.getByText(/Email envoyé/)).toBeInTheDocument();
      expect(screen.getByText(/test@homeci.ci/)).toBeInTheDocument();
      expect(screen.getByText(/expire dans 1 heure/)).toBeInTheDocument();
    });
  });

  it('affiche une erreur si l\'email est vide pour la réinitialisation', async () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    fireEvent.click(screen.getByText(/Mot de passe oublié/));
    fireEvent.click(screen.getByText('Envoyer le lien de réinitialisation'));

    await waitFor(() => {
      expect(screen.getByText(/Veuillez saisir/)).toBeInTheDocument();
    });
  });

  it('affiche une erreur si aucun compte trouvé pour l\'email', async () => {
    mockResetPassword.mockRejectedValueOnce({ code: 'auth/user-not-found' });
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    fireEvent.click(screen.getByText(/Mot de passe oublié/));
    fireEvent.change(screen.getByPlaceholderText('votre@email.com'), { target: { value: 'inconnu@test.ci' } });
    fireEvent.click(screen.getByText('Envoyer le lien de réinitialisation'));

    await waitFor(() => {
      expect(screen.getByText(/Aucun compte trouvé/)).toBeInTheDocument();
    });
  });

  it('retourne au formulaire login au clic sur "Retour à la connexion"', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />);
    fireEvent.click(screen.getByText(/Mot de passe oublié/));
    expect(screen.getByText('Envoyer le lien de réinitialisation')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Retour à la connexion/));
    expect(screen.getByText('Se connecter')).toBeInTheDocument();
  });
});
