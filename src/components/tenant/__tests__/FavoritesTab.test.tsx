import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FavoritesTab from '../FavoritesTab';
import type { Property } from '../../../services/propertyService';

// Mock PropertyCard to avoid complex dependencies
vi.mock('../../PropertyCard', () => ({
  PropertyCard: ({ property, isFavorite, onFavorite, onContactClick }: any) => (
    <div data-testid={`property-card-${property.id}`}>
      <span>{property.title}</span>
      <button onClick={() => onFavorite(property.id)} aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
        {isFavorite ? '❤️' : '🤍'}
      </button>
      <button onClick={() => onContactClick(property.id)}>Contacter</button>
    </div>
  ),
}));

const mockProperty = (i: number): Property => ({
  id: `prop-${i}`,
  owner_id: 'owner-1',
  title: `Favori ${i}`,
  property_type: 'appartement',
  transaction_type: 'location',
  price: 150000,
  city: 'Abidjan',
  commune: 'Cocody',
  quartier: null, district: null, region: null, departement: null,
  address: null, latitude: null, longitude: null,
  bedrooms: 2, bathrooms: 1, surface_area: 60,
  land_area: null, rooms_count: null, hotel_stars: null,
  furnished: false, parking: false, amenities: [],
  images: [], videos: [], documents: [],
  status: 'published', verified_notaire: false, verification_date: null,
  notaire_id: null, views_count: 5, featured: false, available_from: null,
  nb_etages: null, etage_appartement: null, nb_etages_immeuble: null,
  annee_construction: null, ascenseur: false, interphone: false,
  surface_par_unite: null, chambres_par_unite: null, cuisine_par_unite: false,
  needs_status_update: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
});

const noop = vi.fn();

describe('FavoritesTab', () => {
  it('affiche le titre "Mes Favoris"', () => {
    render(
      <MemoryRouter>
        <FavoritesTab favoriteProperties={[mockProperty(1)]} onFavorite={noop} onViewProperty={noop} />
      </MemoryRouter>
    );
    expect(screen.getByText('Mes Favoris')).toBeInTheDocument();
  });

  it('affiche les biens favoris', () => {
    render(
      <MemoryRouter>
        <FavoritesTab favoriteProperties={[mockProperty(1), mockProperty(2)]} onFavorite={noop} onViewProperty={noop} />
      </MemoryRouter>
    );
    expect(screen.getByText('Favori 1')).toBeInTheDocument();
    expect(screen.getByText('Favori 2')).toBeInTheDocument();
  });

  it('affiche le message vide quand aucun favori', () => {
    render(
      <MemoryRouter>
        <FavoritesTab favoriteProperties={[]} onFavorite={noop} onViewProperty={noop} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Aucun favori/)).toBeInTheDocument();
    expect(screen.getByText(/D\u00e9couvrir les biens/)).toBeInTheDocument();
  });

  it('appelle onFavorite pour retirer un favori', () => {
    const onFavorite = vi.fn();
    render(
      <MemoryRouter>
        <FavoritesTab favoriteProperties={[mockProperty(1)]} onFavorite={onFavorite} onViewProperty={noop} />
      </MemoryRouter>
    );
    const heart = screen.getByLabelText(/Retirer des favoris/);
    fireEvent.click(heart);
    expect(onFavorite).toHaveBeenCalledWith('prop-1');
  });

  it('appelle onViewProperty au clic sur contacter', () => {
    const onView = vi.fn();
    render(
      <MemoryRouter>
        <FavoritesTab favoriteProperties={[mockProperty(1)]} onFavorite={noop} onViewProperty={onView} />
      </MemoryRouter>
    );
    const contactBtn = screen.getByText('Contacter');
    fireEvent.click(contactBtn);
    expect(onView).toHaveBeenCalledWith('prop-1');
  });
});
