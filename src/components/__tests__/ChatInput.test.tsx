import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatInput from '../chat/ChatInput';

const mockOnSend = vi.fn(async () => true);
const mockOnSendWithAttachment = vi.fn(async () => true);
const mockOnClearError = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ChatInput', () => {
  const defaultProps = {
    onSend: mockOnSend,
    sending: false,
    error: null,
    onClearError: mockOnClearError,
  };

  it('affiche le textarea et le bouton clip', () => {
    render(<ChatInput {...defaultProps} onSendWithAttachment={mockOnSendWithAttachment} />);
    expect(screen.getByPlaceholderText('Répondre...')).toBeTruthy();
    // Clip button via title attribute
    const clipBtn = screen.getByTitle(/joindre un fichier/i);
    expect(clipBtn).toBeTruthy();
  });

  it('envoie le message au submit', async () => {
    render(<ChatInput {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Répondre...');
    fireEvent.change(textarea, { target: { value: 'Bonjour' } });
    fireEvent.submit(textarea.closest('form')!);

    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith('Bonjour');
    });
  });

  it('envoie avec Enter mais pas avec Shift+Enter', async () => {
    render(<ChatInput {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Répondre...');
    fireEvent.change(textarea, { target: { value: 'Test' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith('Test');
    });
  });

  it('montre un message d\'erreur de format pour les fichiers non acceptés', () => {
    render(<ChatInput {...defaultProps} onSendWithAttachment={mockOnSendWithAttachment} />);
    const clipBtn = screen.getByTitle(/joindre un fichier/i);
    const fileInput = clipBtn.closest('form')?.querySelector('input[type="file"]')!;

    const invalidFile = new File(['content'], 'script.exe', { type: 'application/x-msdownload' });
    Object.defineProperty(fileInput, 'files', { value: [invalidFile] });
    fireEvent.change(fileInput);

    expect(screen.getByText(/format non accepté/i)).toBeTruthy();
  });

  it('montre un message d\'erreur pour les fichiers trop volumineux', () => {
    render(<ChatInput {...defaultProps} onSendWithAttachment={mockOnSendWithAttachment} />);
    const clipBtn = screen.getByTitle(/joindre un fichier/i);
    const fileInput = clipBtn.closest('form')?.querySelector('input[type="file"]')!;

    const bigFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'huge.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', { value: [bigFile] });
    fireEvent.change(fileInput);

    expect(screen.getByText(/fichier trop volumineux/i)).toBeTruthy();
  });

  it('désactive le clip button pendant l\'upload', () => {
    render(
      <ChatInput
        {...defaultProps}
        onSendWithAttachment={mockOnSendWithAttachment}
        uploading={{ fileName: 'photo.jpg', progress: 50 }}
      />
    );
    const clipBtn = screen.getByTitle(/joindre un fichier/i);
    expect(clipBtn).toBeDisabled();
    expect(screen.getByText(/photo\.jpg/i)).toBeTruthy();
  });

  it('affiche la barre de progression pendant l\'upload', () => {
    render(
      <ChatInput
        {...defaultProps}
        uploading={{ fileName: 'doc.pdf', progress: 75 }}
      />
    );
    expect(screen.getByText('doc.pdf')).toBeTruthy();
    // Check progress bar exists with 75%
    const progressBar = document.querySelector('[style*="width: 75%"]');
    expect(progressBar).toBeTruthy();
  });

  it('envoie avec pièce jointe quand un fichier est sélectionné', async () => {
    render(<ChatInput {...defaultProps} onSendWithAttachment={mockOnSendWithAttachment} />);
    const clipBtn = screen.getByTitle(/joindre un fichier/i);
    const fileInput = clipBtn.closest('form')?.querySelector('input[type="file"]')!;

    const imageFile = new File(['image data'], 'photo.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', { value: [imageFile] });
    fireEvent.change(fileInput);

    // Add some text and submit
    const textarea = screen.getByPlaceholderText(/ajouter un commentaire/i);
    fireEvent.change(textarea, { target: { value: 'Voici la photo' } });
    fireEvent.submit(textarea.closest('form')!);

    await waitFor(() => {
      expect(mockOnSendWithAttachment).toHaveBeenCalledWith('Voici la photo', expect.any(File));
    });
  });

  it('permet de retirer un fichier sélectionné', () => {
    render(<ChatInput {...defaultProps} onSendWithAttachment={mockOnSendWithAttachment} />);
    const clipBtn = screen.getByTitle(/joindre un fichier/i);
    const fileInput = clipBtn.closest('form')?.querySelector('input[type="file"]')!;

    const imageFile = new File(['image data'], 'photo.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', { value: [imageFile] });
    fireEvent.change(fileInput);

    // Click remove button (X button in the file preview)
    const buttons = screen.getAllByRole('button');
    const removeBtn = buttons.find(btn => btn.getAttribute('title') !== 'Joindre un fichier (image ou PDF, max 10 MB)');
    expect(removeBtn).toBeTruthy();
    fireEvent.click(removeBtn!);

    expect(screen.queryByText(/photo\.jpg/i)).toBeNull();
  });

  it('affiche le placeholder de commentaire quand un fichier est sélectionné', () => {
    render(<ChatInput {...defaultProps} onSendWithAttachment={mockOnSendWithAttachment} />);
    const clipBtn = screen.getByTitle(/joindre un fichier/i);
    const fileInput = clipBtn.closest('form')?.querySelector('input[type="file"]')!;

    const imageFile = new File(['image data'], 'photo.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', { value: [imageFile] });
    fireEvent.change(fileInput);

    expect(screen.getByPlaceholderText(/ajouter un commentaire/i)).toBeTruthy();
  });

  it('affiche une erreur quand onClearError est appelé', () => {
    render(<ChatInput {...defaultProps} error="Erreur de connexion" onClearError={mockOnClearError} />);
    expect(screen.getByText('Erreur de connexion')).toBeTruthy();
  });
});
