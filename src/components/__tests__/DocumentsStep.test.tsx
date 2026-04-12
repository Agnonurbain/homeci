import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DocumentsStep } from '../DocumentsStep';
import type { PropertyDocument } from '../../services/propertyService';

/* ── Mocks ─────────────────────────────────────────────────────────────── */

vi.mock('../../services/storageService', () => ({
  storageService: {
    uploadDocument: vi.fn(async () => 'https://firebasestorage.url/doc.pdf'),
    uploadIdentityDocument: vi.fn(async () => 'https://firebasestorage.url/identity.pdf'),
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user-1' } }),
}));

vi.mock('../../utils/fixDocUrl', () => ({
  fixDocUrl: (url: string) => url,
}));

import { storageService } from '../../services/storageService';

const noop = vi.fn();
const defaultDocs: PropertyDocument[] = [];

function renderStep(overrides = {}) {
  return render(
    <DocumentsStep
      propertyType="appartement"
      propertyId="prop-1"
      documents={defaultDocs}
      onChange={noop}
      {...overrides}
    />
  );
}

describe('DocumentsStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le titre "Documents officiels"', () => {
    renderStep();
    expect(screen.getByText('Documents officiels')).toBeInTheDocument();
  });

  it('affiche la barre de progression', () => {
    renderStep();
    expect(screen.getByText('Documents obligatoires')).toBeInTheDocument();
    // Progress bar should exist
    const progressBar = document.querySelector('.bg-blue-600');
    expect(progressBar).toBeInTheDocument();
  });

  it('affiche les documents requis pour un appartement', () => {
    renderStep();
    expect(screen.getByText('Titre foncier')).toBeInTheDocument();
    expect(screen.getByText('Permis de construire')).toBeInTheDocument();
    expect(screen.getByText('Plan cadastral')).toBeInTheDocument();
    expect(screen.getByText('Certificat de propriété')).toBeInTheDocument();
  });

  it('marque les documents obligatoires', () => {
    renderStep();
    const requiredBadges = screen.getAllByText('Obligatoire');
    expect(requiredBadges.length).toBeGreaterThanOrEqual(2);
  });

  it('marque les documents optionnels', () => {
    renderStep();
    const optionalBadges = screen.getAllByText('Optionnel');
    expect(optionalBadges.length).toBeGreaterThanOrEqual(2);
  });

  it('affiche les documents d\'identité du propriétaire', () => {
    renderStep();
    expect(screen.getByText('Identité du propriétaire')).toBeInTheDocument();
    expect(screen.getByText('Carte d\'identité nationale (CNI)')).toBeInTheDocument();
    expect(screen.getByText('Passeport')).toBeInTheDocument();
  });

  it('appelle onChange après un upload réussi', async () => {
    const onChange = vi.fn();
    renderStep({ onChange });
    const file = new File(['dummy'], 'titre.pdf', { type: 'application/pdf' });
    // Get all file inputs - first one is for "Titre foncier"
    const fileInputs = screen.getAllByDisplayValue('');
    const input = fileInputs.find(i => i.tagName === 'INPUT' && (i as HTMLInputElement).type === 'file');
    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(storageService.uploadDocument).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });
    }
  });

  it('affiche un message d\'erreur en cas d\'échec d\'upload', async () => {
    vi.mocked(storageService.uploadDocument).mockRejectedValueOnce(new Error('Upload failed'));

    renderStep();
    const file = new File(['dummy'], 'titre.pdf', { type: 'application/pdf' });
    const fileInputs = screen.getAllByDisplayValue('');
    const input = fileInputs.find(i => i.tagName === 'INPUT' && (i as HTMLInputElement).type === 'file');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/Échec de l'upload/)).toBeInTheDocument();
      });
    }
  });

  it('met à jour la progression quand des documents sont déjà uploadés', () => {
    const existingDocs: PropertyDocument[] = [
      { type: 'titre_foncier', label: 'Titre foncier', url: 'https://example.com/titre.pdf', status: 'en_attente' },
      { type: 'cni', label: 'CNI', url: 'https://example.com/cni.pdf', status: 'en_attente' },
    ];
    renderStep({ documents: existingDocs });
    // Progress bar should exist
    const progressBar = document.querySelector('.bg-blue-600');
    expect(progressBar).toBeInTheDocument();
    // 2 required (titre_foncier + permis_construire) + 1 identity = 3, 2 uploaded
    expect(document.body.textContent).toContain('2/3');
  });

  it('supprime un document quand on clique sur le bouton X', () => {
    const existingDocs: PropertyDocument[] = [
      { type: 'titre_foncier', label: 'Titre foncier', url: 'https://example.com/titre.pdf', status: 'en_attente' },
    ];
    renderStep({ documents: existingDocs });

    const removeBtn = screen.getByRole('button', { name: /supprimer/i });
    fireEvent.click(removeBtn);

    // onChange should be called with the document removed
    expect(noop).toHaveBeenCalledWith([]);
  });

  it('affiche le statut "Validé par le notaire" pour un document validé', () => {
    const existingDocs: PropertyDocument[] = [
      { type: 'titre_foncier', label: 'Titre foncier', url: 'https://example.com/titre.pdf', status: 'valide' },
    ];
    renderStep({ documents: existingDocs });
    expect(screen.getByText('Validé par le notaire')).toBeInTheDocument();
  });

  it('affiche le motif de refus pour un document refusé', () => {
    const existingDocs: PropertyDocument[] = [
      { type: 'titre_foncier', label: 'Titre foncier', url: 'https://example.com/titre.pdf', status: 'refuse', rejection_reason: 'Document illisible' },
    ];
    renderStep({ documents: existingDocs });
    expect(screen.getByText(/Document illisible/)).toBeInTheDocument();
  });

  it('affiche le lien "Voir le document" pour un document uploadé', () => {
    const existingDocs: PropertyDocument[] = [
      { type: 'titre_foncier', label: 'Titre foncier', url: 'https://example.com/titre.pdf', status: 'en_attente' },
    ];
    renderStep({ documents: existingDocs });
    const viewLink = screen.getByRole('link', { name: /voir le document/i });
    expect(viewLink).toBeInTheDocument();
    expect(viewLink).toHaveAttribute('href', 'https://example.com/titre.pdf');
  });
});
