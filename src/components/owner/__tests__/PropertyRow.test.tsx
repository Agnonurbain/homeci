/**
 * HOMECI — Tests: PropertyRow (owner)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PropertyRow from '../PropertyRow';
import type { Property } from '../../../types/property';

const baseProperty = {
  id: 'prop-1',
  owner_id: 'owner-1',
  title: 'Appartement Cocody',
  property_type: 'appartement',
  transaction_type: 'location',
  price: 150000,
  city: 'Abidjan',
  commune: 'Cocody',
  quartier: 'Angré',
  latitude: 5.36,
  longitude: -4.01,
  bedrooms: 2,
  bathrooms: 1,
  surface_area: 80,
  images: ['https://example.com/img1.jpg'],
  documents: [],
  status: 'published',
  verified_notaire: false,
  notaire_id: null,
  views_count: 45,
  needs_status_update: false,
  created_at: { toDate: () => new Date() } as any,
  updated_at: { toDate: () => new Date() } as any,
} as unknown as Property;

function renderRow(overrides: Partial<React.ComponentProps<typeof PropertyRow>> = {}) {
  const props = {
    property: baseProperty,
    submittingVerif: false,
    onView: vi.fn(),
    onEdit: vi.fn(),
    onStatusUpdate: vi.fn(),
    onAvailability: vi.fn(),
    onBoost: vi.fn(),
    onSubmitVerification: vi.fn(),
    ...overrides,
  };
  const { container } = render(
    <table><tbody><tr><PropertyRow {...props} /></tr></tbody></table>
  );
  return { props, container };
}

describe('PropertyRow', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('affiche le titre du bien', () => {
    renderRow();
    expect(screen.getByText('Appartement Cocody')).toBeInTheDocument();
  });

  it('affiche la ville et le type de bien', () => {
    renderRow();
    expect(screen.getByText('Abidjan')).toBeInTheDocument();
    expect(screen.getByText('Appartement')).toBeInTheDocument();
  });

  it('affiche le prix formaté', () => {
    renderRow();
    expect(screen.getByText('150 000')).toBeInTheDocument();
  });

  it('affiche le nombre de vues', () => {
    renderRow();
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  it('appelle onView quand on clique sur Détails', () => {
    const onView = vi.fn();
    renderRow({ onView });
    fireEvent.click(screen.getByTitle('Détails'));
    expect(onView).toHaveBeenCalledWith('prop-1');
  });

  it('appelle onEdit quand on clique sur Modifier', () => {
    const onEdit = vi.fn();
    renderRow({ onEdit });
    fireEvent.click(screen.getByTitle('Modifier'));
    expect(onEdit).toHaveBeenCalledWith('prop-1');
  });

  it('affiche le bouton "Soumettre" pour un bien draft non vérifié', () => {
    renderRow({ property: { ...baseProperty, status: 'draft', verified_notaire: false } });
    expect(screen.getByText('Soumettre')).toBeInTheDocument();
  });

  it('appelle onSubmitVerification pour un bien draft', () => {
    const onSubmitVerification = vi.fn();
    renderRow({
      property: { ...baseProperty, status: 'draft', verified_notaire: false },
      onSubmitVerification,
    });
    fireEvent.click(screen.getByText('Soumettre'));
    expect(onSubmitVerification).toHaveBeenCalledWith(expect.objectContaining({ id: 'prop-1' }));
  });

  it('affiche le bouton "Booster" pour un bien publié', () => {
    renderRow({ property: { ...baseProperty, status: 'published' } });
    expect(screen.getByText('Booster')).toBeInTheDocument();
  });

  it('appelle onBoost pour un bien publié', () => {
    const onBoost = vi.fn();
    renderRow({ property: { ...baseProperty, status: 'published' }, onBoost });
    fireEvent.click(screen.getByText('Booster'));
    expect(onBoost).toHaveBeenCalledWith(expect.objectContaining({ id: 'prop-1' }));
  });

  it('affiche le badge "Vérifié" si verified_notaire est true', () => {
    renderRow({ property: { ...baseProperty, verified_notaire: true } });
    expect(screen.getByText(/Vérifié/)).toBeInTheDocument();
  });

  it('affiche le bouton "Statut" si needs_status_update est true', () => {
    renderRow({ property: { ...baseProperty, status: 'published', needs_status_update: true } });
    expect(screen.getByTitle('Mettre à jour le statut')).toBeInTheDocument();
  });

  it('affiche un spinner quand submittingVerif est true', () => {
    renderRow({
      property: { ...baseProperty, status: 'draft', verified_notaire: false },
      submittingVerif: true,
    });
    expect(screen.getByText('Envoi...')).toBeInTheDocument();
  });
});
