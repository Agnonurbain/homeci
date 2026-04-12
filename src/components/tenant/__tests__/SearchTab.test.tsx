import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchTab from '../SearchTab';
import type { Property } from '../../../services/propertyService';
import type { SortOption } from '../../../hooks/useTenantProperties';

// Mock PropertyCard
vi.mock('../../PropertyCard', () => ({
  PropertyCard: ({ property, isFavorite, onFavorite, onContactClick }: any) => (
    <div data-testid={`property-card-${property.id}`}>
      <span>{property.title}</span>
      <span>{property.city}</span>
      <button onClick={() => onFavorite(property.id)} aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
        {isFavorite ? '❤️' : '🤍'}
      </button>
      <button onClick={() => onContactClick(property.id)}>Contacter</button>
    </div>
  ),
}));

// Mock MapDisplay (lazy loaded in SearchTab)
vi.mock('../../MapDisplay', () => ({
  default: Object.assign(() => <div data-testid="map-display">Map</div>, {
    __esModule: true,
  }),
}));

// Mock PropertyFilters
vi.mock('../../PropertyFilters', () => ({
  PropertyFilters: ({ onFilterChange }: any) => (
    <div data-testid="property-filters">
      <select aria-label="Type de bien" onChange={e => onFilterChange({ type: e.target.value })}>
        <option value="">Tous</option>
        <option value="maison">Maison</option>
      </select>
    </div>
  ),
}));

const mockProperty = (i: number): Property => ({
  id: `prop-${i}`,
  owner_id: 'owner-1',
  title: `Bien ${i}`,
  property_type: 'appartement',
  transaction_type: 'location',
  price: 100000 * i,
  city: 'Abidjan',
  commune: 'Cocody',
  quartier: null, district: null, region: null, departement: null,
  address: null, latitude: null, longitude: null,
  bedrooms: 2, bathrooms: 1, surface_area: 50,
  land_area: null, rooms_count: null, hotel_stars: null,
  furnished: false, parking: false, amenities: [],
  images: [`https://example.com/img${i}.jpg`],
  videos: [], documents: [],
  status: 'published', verified_notaire: false, verification_date: null,
  notaire_id: null, views_count: 10, featured: false, available_from: null,
  nb_etages: null, etage_appartement: null, nb_etages_immeuble: null,
  annee_construction: null, ascenseur: false, interphone: false,
  surface_par_unite: null, chambres_par_unite: null, cuisine_par_unite: false,
  needs_status_update: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
});

const noop = vi.fn();
const defaultProps = {
  loading: false,
  properties: [mockProperty(1), mockProperty(2), mockProperty(3)],
  sortBy: 'newest' as SortOption,
  onSortChange: noop,
  onFilterChange: noop,
  onFavorite: noop,
  isFavorite: () => false,
  onViewProperty: noop,
};

describe('SearchTab', () => {
  it('affiche le nombre de biens disponibles', () => {
    render(<SearchTab {...defaultProps} />);
    expect(screen.getByText(/bien\(s\) disponible\(s\)/)).toBeInTheDocument();
  });

  it('affiche les cartes de biens', () => {
    render(<SearchTab {...defaultProps} />);
    expect(screen.getByText('Bien 1')).toBeInTheDocument();
    expect(screen.getByText('Bien 2')).toBeInTheDocument();
    expect(screen.getByText('Bien 3')).toBeInTheDocument();
  });

  it('affiche le message vide quand aucun bien', () => {
    render(<SearchTab {...defaultProps} properties={[]} />);
    expect(screen.getByText(/Aucun bien trouv\u00e9/)).toBeInTheDocument();
  });

  it('appelle onFavorite au clic sur le coeur', () => {
    const onFavorite = vi.fn();
    render(<SearchTab {...defaultProps} onFavorite={onFavorite} />);
    const hearts = screen.getAllByLabelText(/Ajouter aux favoris/);
    fireEvent.click(hearts[0]);
    expect(onFavorite).toHaveBeenCalledWith('prop-1');
  });

  it('appelle onViewProperty au clic sur contacter', () => {
    const onView = vi.fn();
    render(<SearchTab {...defaultProps} onViewProperty={onView} />);
    const contactBtns = screen.getAllByText('Contacter');
    fireEvent.click(contactBtns[0]);
    expect(onView).toHaveBeenCalledWith('prop-1');
  });

  it('change de mode de vue entre liste et carte', async () => {
    render(<SearchTab {...defaultProps} />);
    const mapBtn = screen.getByLabelText('Vue carte');
    fireEvent.click(mapBtn);
    await waitFor(() => {
      expect(screen.getByTestId('map-display')).toBeInTheDocument();
    });
  });

  it('appelle onFilterChange quand les filtres changent', () => {
    const onFilterChange = vi.fn();
    render(<SearchTab {...defaultProps} onFilterChange={onFilterChange} />);
    const select = screen.getByLabelText(/Type de bien/i);
    fireEvent.change(select, { target: { value: 'maison' } });
    expect(onFilterChange).toHaveBeenCalledWith({ type: 'maison' });
  });

  it('affiche la pagination quand plus de 9 biens', () => {
    const manyProps = {
      ...defaultProps,
      properties: Array.from({ length: 15 }, (_, i) => mockProperty(i + 1)),
    };
    render(<SearchTab {...manyProps} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('affiche le menu de tri et appelle onSortChange', () => {
    const onSortChange = vi.fn();
    render(<SearchTab {...defaultProps} onSortChange={onSortChange} />);
    const sortBtn = screen.getByLabelText(/Trier par/);
    fireEvent.click(sortBtn);
    expect(screen.getByText('Prix croissant')).toBeInTheDocument();
    expect(screen.getByText('Plus populaires')).toBeInTheDocument();
  });

  it('réinitialise la page quand on change de tri', () => {
    const onSortChange = vi.fn();
    render(<SearchTab {...defaultProps} onSortChange={onSortChange} />);
    const sortBtn = screen.getByLabelText(/Trier par/);
    fireEvent.click(sortBtn);
    const priceAsc = screen.getByText('Prix croissant');
    fireEvent.click(priceAsc);
    expect(onSortChange).toHaveBeenCalledWith('price_asc');
  });
});
