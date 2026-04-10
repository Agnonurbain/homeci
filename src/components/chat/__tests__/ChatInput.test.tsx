/**
 * HOMECI — Tests: ChatInput
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatInput from '../ChatInput';

function renderInput(overrides: Partial<React.ComponentProps<typeof ChatInput>> = {}) {
  const props = {
    onSend: vi.fn(async () => true),
    sending: false,
    error: null,
    onClearError: vi.fn(),
    ...overrides,
  };
  render(<ChatInput {...props} />);
  return props;
}

describe('ChatInput', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('affiche le champ de saisie avec placeholder', () => {
    renderInput();
    expect(screen.getByPlaceholderText('Répondre...')).toBeInTheDocument();
  });

  it('affiche le bouton envoyer', () => {
    renderInput();
    const btn = screen.getByRole('button', {} );
    expect(btn).toBeInTheDocument();
  });

  it('désactive le bouton quand le message est vide', () => {
    renderInput();
    const btn = screen.getByRole('button', {} );
    expect(btn).toBeDisabled();
  });

  it('active le bouton quand un message est saisi', () => {
    renderInput();
    const textarea = screen.getByPlaceholderText('Répondre...');
    fireEvent.change(textarea, { target: { value: 'Bonjour !' } });
    const btn = screen.getByRole('button', {} );
    expect(btn).not.toBeDisabled();
  });

  it('appelle onSend quand on soumet le formulaire', async () => {
    const onSend = vi.fn(async () => true);
    renderInput({ onSend });
    const textarea = screen.getByPlaceholderText('Répondre...');
    fireEvent.change(textarea, { target: { value: 'Bonjour !' } });
    fireEvent.submit(textarea.closest('form')!);
    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith('Bonjour !');
    });
  });

  it('efface le champ après un envoi réussi', async () => {
    const onSend = vi.fn(async () => true);
    renderInput({ onSend });
    const textarea = screen.getByPlaceholderText('Répondre...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.submit(textarea.closest('form')!);
    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });

  it('ne désactive PAS le champ après un échec d\'envoi', async () => {
    const onSend = vi.fn(async () => false);
    renderInput({ onSend });
    const textarea = screen.getByPlaceholderText('Répondre...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.submit(textarea.closest('form')!);
    await waitFor(() => {
      // Le message reste dans le champ en cas d'échec
      expect(textarea).toHaveValue('Hello');
    });
  });

  it('désactive le bouton pendant l\'envoi', () => {
    renderInput({ sending: true });
    const btn = screen.getByRole('button', {} );
    expect(btn).toBeDisabled();
  });

  it('affiche un spinner quand sending est true', () => {
    renderInput({ sending: true });
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('envoie le message quand on appuie sur Entrée (sans Shift)', () => {
    const onSend = vi.fn(async () => true);
    renderInput({ onSend });
    const textarea = screen.getByPlaceholderText('Répondre...');
    fireEvent.change(textarea, { target: { value: 'Test' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(onSend).toHaveBeenCalledWith('Test');
  });

  it('n\'envoie PAS le message quand on appuie sur Shift+Entrée', () => {
    const onSend = vi.fn(async () => true);
    renderInput({ onSend });
    const textarea = screen.getByPlaceholderText('Répondre...');
    fireEvent.change(textarea, { target: { value: 'Test\n' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('affiche le message d\'erreur', () => {
    renderInput({ error: 'Erreur de connexion' });
    expect(screen.getByText('Erreur de connexion')).toBeInTheDocument();
  });

  it('appelle onClearError après 4 secondes', async () => {
    vi.useFakeTimers();
    const onClearError = vi.fn();
    renderInput({ error: 'Erreur', onClearError });
    vi.advanceTimersByTime(4000);
    expect(onClearError).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('n\'envoie PAS de message vide', () => {
    const onSend = vi.fn(async () => true);
    renderInput({ onSend });
    const form = screen.getByRole('button', {} ).closest('form');
    fireEvent.submit(form!);
    expect(onSend).not.toHaveBeenCalled();
  });
});
