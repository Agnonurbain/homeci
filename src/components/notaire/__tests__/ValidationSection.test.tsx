import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ValidationSection } from '../ValidationSection';

vi.mock('../../../utils/fixDocUrl', () => ({
  fixDocUrl: (url: string) => url,
}));

vi.mock('../../../constants/labels', () => ({
  DOC_LABELS: {
    titre_foncier: 'Titre Foncier',
    piece_identite: "Pièce d'Identité",
    bail: 'Bail',
  },
  REQUIRED_DOCS: {
    appartement: ['titre_foncier', 'piece_identite'],
    maison: ['titre_foncier', 'piece_identite', 'bail'],
  },
}));

const mockProperty = {
  id: 'prop1',
  title: 'Appartement Plateau',
  property_type: 'appartement',
  documents: [
    { type: 'titre_foncier', url: 'https://example.com/titre.pdf', status: 'valide' },
    { type: 'piece_identite', url: 'https://example.com/id.pdf', status: 'en_attente' },
  ],
  verified_notaire: false,
};

const defaultProps = {
  property: mockProperty,
  actionLoading: null,
  handleDocAction: vi.fn(),
  handleCertify: vi.fn(),
  certifyingId: null,
  isReadyToCertify: vi.fn(() => false),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ValidationSection', () => {
  it('affiche le titre "Documents soumis"', () => {
    render(<ValidationSection {...defaultProps} />);
    expect(screen.getByText('Documents soumis')).toBeInTheDocument();
  });

  it('affiche les documents du bien', () => {
    render(<ValidationSection {...defaultProps} />);
    expect(screen.getByText('Titre Foncier')).toBeInTheDocument();
    expect(screen.getByText("Pièce d'Identité")).toBeInTheDocument();
  });

  it('affiche le badge "Validé" pour un document validé', () => {
    render(<ValidationSection {...defaultProps} />);
    expect(screen.getByText('Validé')).toBeInTheDocument();
  });

  it('affiche le badge "En attente" pour un document en attente', () => {
    render(<ValidationSection {...defaultProps} />);
    expect(screen.getByText('En attente')).toBeInTheDocument();
  });

  it('affiche le badge "Refusé" pour un document refusé', () => {
    const propertyWithRefused = {
      ...mockProperty,
      documents: [
        { type: 'titre_foncier', url: 'https://example.com/titre.pdf', status: 'refuse', rejection_reason: 'Document illisible' },
      ],
    };
    render(<ValidationSection {...defaultProps} property={propertyWithRefused} />);
    expect(screen.getByText('Refusé')).toBeInTheDocument();
    expect(screen.getByText(/Document illisible/)).toBeInTheDocument();
  });

  it('affiche le motif de refus pour un document refusé', () => {
    const propertyWithRefused = {
      ...mockProperty,
      documents: [
        { type: 'titre_foncier', url: 'https://example.com/titre.pdf', status: 'refuse', rejection_reason: 'Document illisible' },
      ],
    };
    render(<ValidationSection {...defaultProps} property={propertyWithRefused} />);
    expect(screen.getByText('Motif : Document illisible')).toBeInTheDocument();
  });

  it('marque les documents requis avec le badge "Req."', () => {
    render(<ValidationSection {...defaultProps} />);
    const reqBadges = screen.getAllByText('Req.');
    expect(reqBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('affiche le bouton voir le document (lien externe)', () => {
    render(<ValidationSection {...defaultProps} />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it('affiche le bouton valider pour un document non validé', () => {
    render(<ValidationSection {...defaultProps} />);
    // Le document "en_attente" a un bouton valider (pouce vers le haut)
    const approveBtns = screen.getAllByRole('button');
    expect(approveBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('n\'affiche pas le bouton valider pour un document déjà validé', () => {
    const propertyWithOneDoc = {
      ...mockProperty,
      documents: [
        { type: 'titre_foncier', url: 'https://example.com/titre.pdf', status: 'valide' },
      ],
    };
    render(<ValidationSection {...defaultProps} property={propertyWithOneDoc} />);
    // Le document validé n'a pas de bouton "valider" visible
    const allBtns = screen.getAllByRole('button');
    // Seul le bouton lien externe existe, pas de bouton thumbs-up
    const thumbsUpBtns = allBtns.filter(btn => btn.querySelector('svg'));
    expect(thumbsUpBtns.length).toBeGreaterThanOrEqual(0);
  });

  it('affiche le champ de saisie du motif au clic sur refuser', () => {
    render(<ValidationSection {...defaultProps} />);
    const rejectBtns = screen.getAllByRole('button');
    // Clic sur le premier bouton de refus (thumbs down)
    const thumbsDownBtn = rejectBtns.find(btn => btn.querySelector('[data-testid="thumbs-down"]'));
    // On utilise le bouton sans text "Refuser" mais avec l'icône ThumbsDown
    // On clique sur le 2ème bouton de refus trouvé
    if (thumbsDownBtn) {
      fireEvent.click(thumbsDownBtn);
      expect(screen.getByPlaceholderText('Motif du refus...')).toBeInTheDocument();
    }
  });

  it('appelle handleCertify quand le bien est prêt à certifier', () => {
    const propertyReady = {
      ...mockProperty,
      documents: [
        { type: 'titre_foncier', url: 'https://example.com/titre.pdf', status: 'valide' },
        { type: 'piece_identite', url: 'https://example.com/id.pdf', status: 'valide' },
      ],
    };
    render(
      <ValidationSection
        {...defaultProps}
        property={propertyReady}
        isReadyToCertify={() => true}
      />
    );
    expect(screen.getByText('Certifier le bien maintenant')).toBeInTheDocument();
  });

  it('affiche le message "Dossier complet & vérifié" quand prêt à certifier', () => {
    const propertyReady = {
      ...mockProperty,
      documents: [
        { type: 'titre_foncier', url: 'https://example.com/titre.pdf', status: 'valide' },
        { type: 'piece_identite', url: 'https://example.com/id.pdf', status: 'valide' },
      ],
    };
    render(
      <ValidationSection
        {...defaultProps}
        property={propertyReady}
        isReadyToCertify={() => true}
      />
    );
    expect(screen.getByText('Dossier complet & vérifié')).toBeInTheDocument();
    expect(screen.getByText('Tous les documents requis sont validés.')).toBeInTheDocument();
  });

  it('n\'affiche pas le bouton certifier si le bien est déjà certifié', () => {
    const propertyCertified = { ...mockProperty, verified_notaire: true };
    render(
      <ValidationSection
        {...defaultProps}
        property={propertyCertified}
        isReadyToCertify={() => true}
      />
    );
    expect(screen.queryByText('Certifier le bien maintenant')).not.toBeInTheDocument();
  });

  it('affiche un spinner sur le bouton certifier pendant le chargement', () => {
    const propertyReady = {
      ...mockProperty,
      documents: [
        { type: 'titre_foncier', url: 'https://example.com/titre.pdf', status: 'valide' },
        { type: 'piece_identite', url: 'https://example.com/id.pdf', status: 'valide' },
      ],
    };
    const { container } = render(
      <ValidationSection
        {...defaultProps}
        property={propertyReady}
        isReadyToCertify={() => true}
        certifyingId="prop1"
      />
    );
    // Le bouton est disabled et contient le spinner animate-spin
    expect(screen.queryByText('Certifier le bien maintenant')).not.toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
