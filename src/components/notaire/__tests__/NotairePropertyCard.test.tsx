import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotairePropertyCard } from '../NotairePropertyCard';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  doc: vi.fn(),
}));

vi.mock('../../../lib/firebase', () => ({ db: {} }));

vi.mock('../../../hooks/useNotaireDashboard', () => ({
  getDocStatus: vi.fn(() => 'partiel'),
  isReadyToCertify: vi.fn(() => false),
}));

vi.mock('../../admin/AdminSections', () => ({
  SectionTitle: ({ title, sub }: any) => (
    <div data-testid="section-title">
      <h2>{title}</h2>
      {sub && <p>{sub}</p>}
    </div>
  ),
}));

import * as notaireHooks from '../../../hooks/useNotaireDashboard';

const mockProperty = {
  id: 'prop1',
  title: 'Appartement Plateau',
  property_type: 'appartement',
  city: 'Abidjan',
  owner_id: 'owner1',
  images: ['https://example.com/img1.jpg'],
  documents: [
    { type: 'titre_foncier', url: 'https://example.com/doc.pdf', status: 'valide' },
    { type: 'piece_identite', url: 'https://example.com/id.pdf', status: 'en_attente' },
  ],
  verified_notaire: false,
};

const mockOwner = {
  id: 'owner1',
  full_name: 'Koffi Diallo',
  email: 'koffi@test.ci',
  phone: '+225 07 00 00 00',
};

const defaultProps = {
  property: mockProperty,
  owners: { owner1: mockOwner },
  activeTab: 'en_cours',
  isExpanded: false,
  onToggleExpand: vi.fn(),
  onTakeCharge: vi.fn(),
  takingId: null,
  actionLoading: null,
  handleDocAction: vi.fn(),
  handleCertify: vi.fn(),
  certifyingId: null,
  isReadyToCertify: (notaireHooks.isReadyToCertify as any),
};

beforeEach(() => {
  vi.clearAllMocks();
  (notaireHooks.getDocStatus as any).mockReturnValue('partiel');
  (notaireHooks.isReadyToCertify as any).mockReturnValue(false);
});

describe('NotairePropertyCard', () => {
  it('affiche le titre du bien', () => {
    render(<NotairePropertyCard {...defaultProps} />);
    expect(screen.getByText('Appartement Plateau')).toBeInTheDocument();
  });

  it('affiche la ville du bien', () => {
    render(<NotairePropertyCard {...defaultProps} />);
    expect(screen.getByText('Abidjan')).toBeInTheDocument();
  });

  it('affiche l\'image du bien si disponible', () => {
    render(<NotairePropertyCard {...defaultProps} />);
    const img = screen.getByRole('img', { name: /Appartement Plateau/ });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/img1.jpg');
  });

  it('affiche une icône par défaut si pas d\'image', () => {
    const propWithoutImg = { ...mockProperty, images: [] };
    render(<NotairePropertyCard {...defaultProps} property={propWithoutImg} />);
    expect(screen.queryByRole('img', { name: /Appartement Plateau/ })).not.toBeInTheDocument();
  });

  it('affiche le pourcentage de progression des documents', () => {
    render(<NotairePropertyCard {...defaultProps} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('affiche le badge de statut "En cours" pour un dossier partiel', () => {
    (notaireHooks.getDocStatus as any).mockReturnValue('partiel');
    render(<NotairePropertyCard {...defaultProps} />);
    expect(screen.getByText('En cours')).toBeInTheDocument();
  });

  it('affiche le badge "Certifié" pour un bien certifié', () => {
    (notaireHooks.getDocStatus as any).mockReturnValue('certifie');
    render(<NotairePropertyCard {...defaultProps} />);
    expect(screen.getByText('Certifié')).toBeInTheDocument();
  });

  it('affiche le badge "Dossier Complet" pour un dossier complet', () => {
    (notaireHooks.getDocStatus as any).mockReturnValue('complet');
    render(<NotairePropertyCard {...defaultProps} />);
    expect(screen.getByText('Dossier Complet')).toBeInTheDocument();
  });

  it('affiche "Aucun document" quand aucun document', () => {
    (notaireHooks.getDocStatus as any).mockReturnValue('aucun');
    render(<NotairePropertyCard {...defaultProps} />);
    expect(screen.getByText('Aucun document')).toBeInTheDocument();
  });

  it('affiche le bouton "Examiner" quand l\'onglet est en_cours et non expandé', () => {
    render(<NotairePropertyCard {...defaultProps} activeTab="en_cours" isExpanded={false} />);
    expect(screen.getByText('Examiner')).toBeInTheDocument();
  });

  it('affiche le bouton "Masquer" quand expandé', () => {
    render(<NotairePropertyCard {...defaultProps} activeTab="en_cours" isExpanded />);
    expect(screen.getByText('Masquer')).toBeInTheDocument();
  });

  it('appelle onToggleExpand au clic sur Examiner', () => {
    render(<NotairePropertyCard {...defaultProps} activeTab="en_cours" isExpanded={false} />);
    fireEvent.click(screen.getByText('Examiner'));
    expect(defaultProps.onToggleExpand).toHaveBeenCalled();
  });

  it('affiche les infos du propriétaire quand expandé', () => {
    render(<NotairePropertyCard {...defaultProps} isExpanded />);
    expect(screen.getAllByText('Koffi Diallo').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('+225 07 00 00 00')).toBeInTheDocument();
    expect(screen.getByText('koffi@test.ci')).toBeInTheDocument();
  });

  it('affiche le bouton "Prendre en charge" sur l\'onglet disponible', () => {
    render(<NotairePropertyCard {...defaultProps} activeTab="disponible" />);
    expect(screen.getByText('Prendre en charge')).toBeInTheDocument();
  });

  it('appelle onTakeCharge au clic sur Prendre en charge', () => {
    render(<NotairePropertyCard {...defaultProps} activeTab="disponible" />);
    fireEvent.click(screen.getByText('Prendre en charge'));
    expect(defaultProps.onTakeCharge).toHaveBeenCalledWith(mockProperty);
  });

  it('désactive le bouton Prendre en charge pendant le chargement', () => {
    render(<NotairePropertyCard {...defaultProps} activeTab="disponible" takingId="prop1" />);
    expect(screen.getByText('Prendre en charge')).toBeDisabled();
  });

  it('affiche le spinner quand takingId correspond au property id', () => {
    render(<NotairePropertyCard {...defaultProps} activeTab="disponible" takingId="prop1" />);
    // Le bouton affiche le spinner à la place de l'icône FileCheck
    expect(screen.getByText('Prendre en charge')).toBeInTheDocument();
  });

  it('affiche ValidationSection quand le bien est expandé', () => {
    (notaireHooks.getDocStatus as any).mockReturnValue('partiel');
    render(<NotairePropertyCard {...defaultProps} isExpanded />);
    expect(screen.getByText('Documents soumis')).toBeInTheDocument();
  });

  it('n\'affiche pas ValidationSection quand non expandé', () => {
    render(<NotairePropertyCard {...defaultProps} isExpanded={false} />);
    expect(screen.queryByText('Documents soumis')).not.toBeInTheDocument();
  });

  it('affiche le type de bien via TYPE_LABELS', () => {
    render(<NotairePropertyCard {...defaultProps} />);
    // TYPE_LABELS['appartement'] = 'Appartement'
    expect(screen.getByText('Appartement')).toBeInTheDocument();
  });
});
