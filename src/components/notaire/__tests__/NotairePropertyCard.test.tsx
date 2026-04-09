import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotairePropertyCard } from '../NotairePropertyCard';

vi.mock('../../hooks/useNotaireDashboard', () => ({
  getDocStatus: () => 'partiel',
  isReadyToCertify: () => false,
}));

vi.mock('../../constants/labels', () => ({
  DOC_LABELS: { titre_foncier: 'Titre Foncier', cni: 'CNI / Passeport' },
  REQUIRED_DOCS: { maison: ['titre_foncier', 'cni'], appartement: ['titre_foncier'] },
  TYPE_LABELS: { maison: 'Maison', appartement: 'Appartement' },
}));

vi.mock('./ValidationSection', () => ({
  ValidationSection: () => <div data-testid="validation-section">Validation</div>,
}));

const mockProperty = {
  id: 'prop-1',
  title: 'Villa Cocody',
  property_type: 'maison',
  city: 'Abidjan',
  price: 500000,
  owner_id: 'owner-1',
  images: ['https://example.com/img1.jpg'],
  documents: [{ type: 'titre_foncier', status: 'valide', url: 'https://example.com/t.pdf' }],
  verified_notaire: false,
};

const mockOwners = {
  'owner-1': { full_name: 'Jean Koné', phone: '+225 07 00 00 00', email: 'jean@example.com' },
};

const noop = vi.fn();

function renderCard(overrides = {}) {
  return render(
    <NotairePropertyCard
      property={mockProperty}
      owners={mockOwners}
      activeTab="disponible"
      isExpanded={false}
      onToggleExpand={noop}
      onTakeCharge={noop}
      takingId={null}
      actionLoading={null}
      handleDocAction={noop}
      handleCertify={noop}
      certifyingId={null}
      {...overrides}
    />
  );
}

describe('NotairePropertyCard', () => {
  it('affiche le titre du bien', () => {
    renderCard();
    expect(screen.getByText('Villa Cocody')).toBeInTheDocument();
  });

  it('affiche la ville', () => {
    renderCard();
    expect(screen.getByText('Abidjan')).toBeInTheDocument();
  });

  it('affiche le nom du propriétaire', () => {
    renderCard();
    expect(screen.getByText('Jean Koné')).toBeInTheDocument();
  });

  it('affiche l\'image du bien si disponible', () => {
    renderCard();
    const img = screen.getByAltText('Villa Cocody');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/img1.jpg');
  });

  it('affiche l\'icône bâtiment si pas d\'image', () => {
    renderCard({ property: { ...mockProperty, images: [] } });
    expect(screen.queryByAltText('Villa Cocody')).not.toBeInTheDocument();
  });

  it('affiche le bouton "Prendre en charge" en mode disponible', () => {
    renderCard({ activeTab: 'disponible' });
    expect(screen.getByText('Prendre en charge')).toBeInTheDocument();
  });

  it('affiche le bouton "Examiner" en mode en_cours', () => {
    renderCard({ activeTab: 'en_cours' });
    expect(screen.getByText('Examiner')).toBeInTheDocument();
  });

  it('appelle onTakeCharge au clic sur "Prendre en charge"', () => {
    const onTakeCharge = vi.fn();
    renderCard({ onTakeCharge });
    fireEvent.click(screen.getByText('Prendre en charge'));
    expect(onTakeCharge).toHaveBeenCalledWith(mockProperty);
  });

  it('affiche la ValidationSection quand expanded', () => {
    renderCard({ activeTab: 'en_cours', isExpanded: true });
    expect(screen.getByTestId('validation-section')).toBeInTheDocument();
  });

  it('appelle onToggleExpand au clic sur "Examiner"', () => {
    const onToggleExpand = vi.fn();
    renderCard({ activeTab: 'en_cours', onToggleExpand });
    fireEvent.click(screen.getByText('Examiner'));
    expect(onToggleExpand).toHaveBeenCalled();
  });

  it('affiche le pourcentage de documents validés', () => {
    renderCard();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('affiche le badge "En cours" pour dossier partiel', () => {
    renderCard();
    expect(screen.getByText('En cours')).toBeInTheDocument();
  });

  it('désactive le bouton pendant le chargement', () => {
    renderCard({ takingId: mockProperty.id });
    const btn = screen.getByText('Prendre en charge');
    expect(btn).toBeDisabled();
  });
});
