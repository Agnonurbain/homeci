import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PropertiesTab from '../PropertiesTab';
import type { Property } from '../../../services/propertyService';

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const baseProperty: Property = {
  id: 'prop-1',
  owner_id: 'owner-1',
  title: 'Appartement Cocody',
  property_type: 'appartement',
  transaction_type: 'location',
  price: 150000,
  district: null,
  region: null,
  departement: null,
  city: 'Abidjan',
  commune: 'Cocody',
  quartier: null,
  address: null,
  latitude: null,
  longitude: null,
  bedrooms: 2,
  bathrooms: 1,
  surface_area: 60,
  land_area: null,
  rooms_count: null,
  hotel_stars: null,
  furnished: false,
  parking: false,
  amenities: [],
  images: [],
  videos: [],
  documents: [],
  status: 'published',
  verified_notaire: false,
  verification_date: null,
  notaire_id: null,
  views_count: 5,
  featured: false,
  available_from: null,
  nb_etages: null,
  etage_appartement: null,
  nb_etages_immeuble: null,
  annee_construction: null,
  ascenseur: false,
  interphone: false,
  surface_par_unite: null,
  chambres_par_unite: null,
  cuisine_par_unite: false,
  needs_status_update: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const defaultStats = { total: 1, published: 1, pending: 0, rented_sold: 0, verified: 0 };
const noop = vi.fn();
const noopAsync = vi.fn(async () => {});

function renderTab(properties: Property[], overrides = {}) {
  return render(
    <PropertiesTab
      properties={properties}
      loading={false}
      stats={defaultStats}
      submittingVerif={null}
      onAddProperty={noop}
      onExportCSV={noop}
      onViewProperty={noop}
      onEditProperty={noop}
      onStatusUpdate={noop}
      onAvailability={noop}
      onBoost={noop}
      onSubmitVerification={noopAsync}
      {...overrides}
    />
  );
}

/* ── Tests ────────────────────────────────────────────────────────────────── */

describe('PropertiesTab', () => {
  it('affiche le titre "Mes Biens"', () => {
    renderTab([baseProperty]);
    expect(screen.getByText('Mes Biens')).toBeInTheDocument();
  });

  it('affiche le nombre de biens enregistrés', () => {
    renderTab([baseProperty], { stats: { total: 5, published: 3, pending: 1, rented_sold: 1, verified: 2 } });
    expect(screen.getByText('5 bien(s) enregistré(s)')).toBeInTheDocument();
  });

  it('affiche le message vide quand aucune propriété', () => {
    renderTab([]);
    expect(screen.getByText('Aucun bien enregistré')).toBeInTheDocument();
  });

  it('affiche le bouton "Enregistrer un bien" dans le message vide', () => {
    renderTab([]);
    const addBtn = screen.getByText('Enregistrer un bien');
    expect(addBtn).toBeInTheDocument();
    fireEvent.click(addBtn);
  });

  it('affiche la bannière de mise à jour quand needs_status_update est true', () => {
    const prop = { ...baseProperty, needs_status_update: true };
    renderTab([prop]);
    expect(screen.getByText(/Visite effectuée/)).toBeInTheDocument();
    expect(screen.getByText(/Indiquez le résultat/)).toBeInTheDocument();
    expect(screen.getByText('Mettre à jour')).toBeInTheDocument();
  });

  it('n\'affiche PAS la bannière quand needs_status_update est false', () => {
    renderTab([baseProperty]);
    expect(screen.queryByText(/Visite effectuée/)).not.toBeInTheDocument();
    expect(screen.queryByText('Mettre à jour')).not.toBeInTheDocument();
  });

  it('n\'affiche PAS la bannière pour un bien non publié même avec needs_status_update', () => {
    const prop = { ...baseProperty, status: 'rented' as const, needs_status_update: true };
    renderTab([prop]);
    expect(screen.queryByText(/Visite effectuée/)).not.toBeInTheDocument();
  });

  it('appelle onStatusUpdate au clic sur la bannière', () => {
    const onStatusUpdate = vi.fn();
    const prop = { ...baseProperty, needs_status_update: true };
    renderTab([prop], { onStatusUpdate });
    fireEvent.click(screen.getByText('Mettre à jour'));
    expect(onStatusUpdate).toHaveBeenCalledWith(prop);
  });

  it('affiche plusieurs bannières pour plusieurs biens en attente de statut', () => {
    const prop1 = { ...baseProperty, id: 'p1', title: 'Villa Plateau', needs_status_update: true };
    const prop2 = { ...baseProperty, id: 'p2', title: 'Studio Marcory', needs_status_update: true };
    renderTab([prop1, prop2], { stats: { ...defaultStats, total: 2, published: 2 } });
    expect(screen.getAllByText('Mettre à jour')).toHaveLength(2);
    const banners = screen.getAllByText(/Visite effectuée/);
    expect(banners).toHaveLength(2);
  });

  it('appelle onExportCSV au clic sur Exporter', () => {
    const onExportCSV = vi.fn();
    renderTab([baseProperty], { onExportCSV });
    fireEvent.click(screen.getByText(/Exporter/));
    expect(onExportCSV).toHaveBeenCalled();
  });

  it('appelle onAddProperty au clic sur Ajouter', () => {
    const onAddProperty = vi.fn();
    renderTab([baseProperty], { onAddProperty });
    fireEvent.click(screen.getByText('Ajouter'));
    expect(onAddProperty).toHaveBeenCalled();
  });

  it('affiche les lignes de propriétés dans le tableau', () => {
    renderTab([baseProperty]);
    // The table should contain the property title
    expect(screen.getByText('Appartement Cocody')).toBeInTheDocument();
  });

  it('affiche plusieurs propriétés dans le tableau', () => {
    const prop1 = { ...baseProperty, id: 'p1', title: 'Villa Plateau', price: 300000 };
    const prop2 = { ...baseProperty, id: 'p2', title: 'Studio Marcory', price: 80000 };
    renderTab([prop1, prop2], { stats: { ...defaultStats, total: 2, published: 2 } });
    expect(screen.getByText('Villa Plateau')).toBeInTheDocument();
    expect(screen.getByText('Studio Marcory')).toBeInTheDocument();
  });

  it('affiche le statut de vérification notaire', () => {
    const verifiedProp = { ...baseProperty, verified_notaire: true };
    renderTab([verifiedProp]);
    // Should show "✓ Vérifié" badge
    expect(screen.getByText('✓ Vérifié')).toBeInTheDocument();
  });

  it('appelle onViewProperty au clic sur voir', () => {
    const onViewProperty = vi.fn();
    renderTab([baseProperty], { onViewProperty });
    const viewBtn = screen.getByRole('button', { name: /détails/i });
    fireEvent.click(viewBtn);
    expect(onViewProperty).toHaveBeenCalledWith('prop-1');
  });

  it('appelle onEditProperty au clic sur éditer', () => {
    const onEditProperty = vi.fn();
    renderTab([baseProperty], { onEditProperty });
    const editBtn = screen.getByRole('button', { name: /modifier/i });
    fireEvent.click(editBtn);
    expect(onEditProperty).toHaveBeenCalledWith('prop-1');
  });

  it('appelle onBoost au clic sur booster', () => {
    const onBoost = vi.fn();
    renderTab([baseProperty], { onBoost });
    const boostBtn = screen.getByRole('button', { name: /booster/i });
    fireEvent.click(boostBtn);
    expect(onBoost).toHaveBeenCalledWith(baseProperty);
  });
});
