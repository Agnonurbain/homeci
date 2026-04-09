import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ValidationSection } from '../ValidationSection';

vi.mock('../../constants/labels', () => ({
  DOC_LABELS: { titre_foncier: 'Titre Foncier', cni: 'CNI / Passeport' },
  REQUIRED_DOCS: { maison: ['titre_foncier', 'cni'] },
}));

vi.mock('../../utils/fixDocUrl', () => ({
  fixDocUrl: (url: string) => url,
}));

const mockProperty = {
  id: 'prop-1',
  title: 'Villa Cocody',
  property_type: 'maison',
  verified_notaire: false,
  documents: [
    { type: 'titre_foncier', url: 'https://example.com/titre.pdf', status: 'en_attente' },
    { type: 'cni', url: 'https://example.com/cni.pdf', status: 'valide' },
  ],
};

const noop = vi.fn();
const noopAsync = vi.fn(async () => {});

function renderValidation(overrides = {}) {
  return render(
    <ValidationSection
      property={mockProperty}
      actionLoading={null}
      handleDocAction={noopAsync}
      handleCertify={noop}
      certifyingId={null}
      isReadyToCertify={() => false}
      {...overrides}
    />
  );
}

describe('ValidationSection', () => {
  it('affiche la section "Documents soumis"', () => {
    renderValidation();
    expect(screen.getByText(/Documents soumis/)).toBeInTheDocument();
  });

  it('affiche les documents du bien', () => {
    renderValidation();
    // Le composant affiche les labels depuis DOC_LABELS mocké
    expect(screen.getByText('Titre Foncier')).toBeInTheDocument();
  });

  it('affiche les badges de statut pour chaque document', () => {
    renderValidation();
    expect(screen.getByText('En attente')).toBeInTheDocument();
    expect(screen.getByText('Validé')).toBeInTheDocument();
  });

  it('affiche le badge "Req." pour les documents requis', () => {
    renderValidation();
    expect(screen.getByText('Req.')).toBeInTheDocument();
  });

  it('affiche le bouton certifier quand pret', () => {
    renderValidation({ isReadyToCertify: () => true });
    expect(screen.getByText('Certifier le bien maintenant')).toBeInTheDocument();
  });

  it('n\'affiche PAS le bouton certifier si pas prêt', () => {
    renderValidation({ isReadyToCertify: () => false });
    expect(screen.queryByText('Certifier le bien maintenant')).not.toBeInTheDocument();
  });

  it('affiche le loader quand certifyingId correspond', () => {
    renderValidation({
      isReadyToCertify: () => true,
      certifyingId: mockProperty.id,
    });
    expect(screen.queryByText('Certifier le bien maintenant')).not.toBeInTheDocument();
  });

  it('affiche le motif de refus quand un document est refuse', () => {
    const propWithRefusal = {
      ...mockProperty,
      documents: [
        { type: 'titre_foncier', url: 'https://example.com/t.pdf', status: 'refuse', rejection_reason: 'Document illisible' },
      ],
    };
    renderValidation({ property: propWithRefusal });
    expect(screen.getByText(/Motif : Document illisible/)).toBeInTheDocument();
  });

  it('appelle handleCertify via le bouton', () => {
    const handleCertify = vi.fn();
    renderValidation({
      isReadyToCertify: () => true,
      handleCertify,
    });
    const btn = screen.getByText('Certifier le bien maintenant');
    btn.click();
    expect(handleCertify).toHaveBeenCalledWith(mockProperty);
  });
});
