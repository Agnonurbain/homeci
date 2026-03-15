import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocumentsStep } from '../DocumentsStep';
import type { PropertyDocument } from '../../services/propertyService';

// Mock storageService
vi.mock('../../services/storageService', () => ({
  storageService: {
    uploadDocument: vi.fn(async () => 'https://firebasestorage.googleapis.com/mock-doc.pdf'),
  },
}));

// Mock fixDocUrl
vi.mock('../../utils/fixDocUrl', () => ({
  fixDocUrl: vi.fn((url: string) => url || ''),
}));

describe('DocumentsStep', () => {
  const defaultProps = {
    propertyType: 'maison',
    propertyId: 'prop-123',
    documents: [] as PropertyDocument[],
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Affichage des documents requis ──

  it('affiche les documents requis pour une maison', () => {
    render(<DocumentsStep {...defaultProps} propertyType="maison" />);

    expect(screen.getByText('Titre foncier')).toBeInTheDocument();
    expect(screen.getByText('Permis de construire')).toBeInTheDocument();
    expect(screen.getByText('Plan cadastral')).toBeInTheDocument();
    expect(screen.getByText('Certificat de propriété')).toBeInTheDocument();
  });

  it('affiche les documents requis pour un terrain', () => {
    render(<DocumentsStep {...defaultProps} propertyType="terrain" />);

    expect(screen.getByText('Titre foncier')).toBeInTheDocument();
    expect(screen.getByText('Plan cadastral')).toBeInTheDocument();
    expect(screen.getByText('Arrêté de lotissement')).toBeInTheDocument();
  });

  it('affiche les documents requis pour un hôtel', () => {
    render(<DocumentsStep {...defaultProps} propertyType="hotel" />);

    expect(screen.getByText('Titre foncier')).toBeInTheDocument();
    expect(screen.getByText("Autorisation d'exploitation")).toBeInTheDocument();
    expect(screen.getByText('Registre de commerce')).toBeInTheDocument();
  });

  // ── Badges obligatoire/optionnel ──

  it('marque les documents obligatoires et optionnels', () => {
    render(<DocumentsStep {...defaultProps} propertyType="maison" />);

    const obligatoires = screen.getAllByText('Obligatoire');
    const optionnels = screen.getAllByText('Optionnel');

    // Maison : titre_foncier + permis = 2 obligatoires, plan + certificat = 2 optionnels
    expect(obligatoires).toHaveLength(2);
    expect(optionnels).toHaveLength(2);
  });

  // ── Progression ──

  it('affiche la barre de progression 0/2 sans documents', () => {
    render(<DocumentsStep {...defaultProps} propertyType="maison" documents={[]} />);

    expect(screen.getByText('0/2')).toBeInTheDocument();
  });

  it('affiche la progression 1/2 avec un document obligatoire uploadé', () => {
    const docs: PropertyDocument[] = [
      { type: 'titre_foncier', label: 'Titre foncier', url: 'https://example.com/doc.pdf', status: 'en_attente' },
    ];
    render(<DocumentsStep {...defaultProps} propertyType="maison" documents={docs} />);

    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('affiche la progression 2/2 avec tous les documents obligatoires', () => {
    const docs: PropertyDocument[] = [
      { type: 'titre_foncier', label: 'Titre foncier', url: 'https://example.com/doc1.pdf', status: 'en_attente' },
      { type: 'permis_construire', label: 'Permis de construire', url: 'https://example.com/doc2.pdf', status: 'en_attente' },
    ];
    render(<DocumentsStep {...defaultProps} propertyType="maison" documents={docs} />);

    expect(screen.getByText('2/2')).toBeInTheDocument();
  });

  // ── Statuts des documents ──

  it('affiche "En attente de validation" pour un doc uploadé', () => {
    const docs: PropertyDocument[] = [
      { type: 'titre_foncier', label: 'Titre foncier', url: 'https://example.com/doc.pdf', status: 'en_attente' },
    ];
    render(<DocumentsStep {...defaultProps} documents={docs} />);

    expect(screen.getByText('En attente de validation')).toBeInTheDocument();
  });

  it('affiche "Validé par le notaire" pour un doc validé', () => {
    const docs: PropertyDocument[] = [
      { type: 'titre_foncier', label: 'Titre foncier', url: 'https://example.com/doc.pdf', status: 'valide' },
    ];
    render(<DocumentsStep {...defaultProps} documents={docs} />);

    expect(screen.getByText('Validé par le notaire')).toBeInTheDocument();
  });

  it('affiche le motif de refus pour un doc refusé', () => {
    const docs: PropertyDocument[] = [
      { type: 'titre_foncier', label: 'Titre foncier', url: 'https://example.com/doc.pdf', status: 'refuse', rejection_reason: 'Document illisible' },
    ];
    render(<DocumentsStep {...defaultProps} documents={docs} />);

    expect(screen.getByText(/Document illisible/)).toBeInTheDocument();
  });

  // ── Bouton Téléverser ──

  it('affiche un bouton Téléverser pour les documents non uploadés', () => {
    render(<DocumentsStep {...defaultProps} propertyType="maison" documents={[]} />);

    const uploadBtns = screen.getAllByText('Téléverser');
    // 4 documents pour une maison → 4 boutons Téléverser
    expect(uploadBtns).toHaveLength(4);
  });

  it('n\'affiche pas Téléverser pour un document déjà uploadé', () => {
    const docs: PropertyDocument[] = [
      { type: 'titre_foncier', label: 'Titre foncier', url: 'https://example.com/doc.pdf', status: 'en_attente' },
    ];
    render(<DocumentsStep {...defaultProps} propertyType="maison" documents={docs} />);

    // 3 boutons restants (les 3 autres documents)
    const uploadBtns = screen.getAllByText('Téléverser');
    expect(uploadBtns).toHaveLength(3);
  });

  // ── Note de confidentialité ──

  it('affiche la note de confidentialité', () => {
    render(<DocumentsStep {...defaultProps} />);
    // Le texte est dans un <p> avec <strong>🔒 Confidentialité :</strong> + texte
    expect(screen.getByText(/chiffrés et uniquement accessibles/)).toBeInTheDocument();
  });

  // ── Fallback type inconnu ──

  it('utilise les documents maison par défaut pour un type inconnu', () => {
    render(<DocumentsStep {...defaultProps} propertyType="inconnu_type" />);

    expect(screen.getByText('Titre foncier')).toBeInTheDocument();
    expect(screen.getByText('Permis de construire')).toBeInTheDocument();
  });
});
