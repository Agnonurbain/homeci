import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyCard } from '../PropertyCard';
import { createMockProperty } from '../../tests/factories';

// Mock OptimizedImage
vi.mock('../OptimizedImage', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} data-testid="property-image" />
  ),
}));

describe('PropertyCard', () => {

  it('affiche le titre de la propriété', () => {
    render(<PropertyCard property={createMockProperty({ title: 'Villa Cocody Riviera' })} />);
    expect(screen.getByText('Villa Cocody Riviera')).toBeInTheDocument();
  });

  it('affiche le prix formaté en XOF', () => {
    render(<PropertyCard property={createMockProperty({ price: 75000000 })} />);
    expect(screen.getByText(/75.*000.*000/)).toBeInTheDocument();
  });

  it('affiche la ville et le quartier', () => {
    render(<PropertyCard property={createMockProperty({ city: 'Cocody', quartier: 'Riviera 3' })} />);
    // Le composant rend "{quartier}, {city}"
    expect(screen.getByText(/Riviera 3.*Cocody/)).toBeInTheDocument();
  });

  it('affiche le nombre de chambres', () => {
    render(<PropertyCard property={createMockProperty({ bedrooms: 4 })} />);
    // Rendu : icône Bed + "4" en bold
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('affiche le nombre de salles de bain', () => {
    render(<PropertyCard property={createMockProperty({ bathrooms: 3 })} />);
    // Rendu : icône Bath + "3" en bold
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('affiche la surface', () => {
    render(<PropertyCard property={createMockProperty({ surface_area: 250 })} />);
    expect(screen.getByText(/250/)).toBeInTheDocument();
  });

  it('affiche le badge vérifié si verified_notaire=true', () => {
    render(<PropertyCard property={createMockProperty({ verified_notaire: true })} />);
    expect(screen.getByText(/[Vv]érifi/)).toBeInTheDocument();
  });

  it('n\'affiche pas le badge vérifié si verified_notaire=false', () => {
    render(<PropertyCard property={createMockProperty({ verified_notaire: false })} />);
    expect(screen.queryByText(/Vérifié/i)).not.toBeInTheDocument();
  });

  it('affiche "À vendre" pour transaction_type=vente', () => {
    render(<PropertyCard property={createMockProperty({ transaction_type: 'vente' })} />);
    expect(screen.getByText(/À vendre/)).toBeInTheDocument();
  });

  it('affiche "À louer" pour transaction_type=location', () => {
    render(<PropertyCard property={createMockProperty({ transaction_type: 'location' })} />);
    expect(screen.getByText(/À louer/)).toBeInTheDocument();
  });

  it('appelle onFavorite au clic sur le bouton favori', () => {
    const onFavorite = vi.fn();
    render(<PropertyCard property={createMockProperty()} onFavorite={onFavorite} isFavorite={false} />);
    // Le bouton Heart est le 1er bouton du composant
    const buttons = screen.getAllByRole('button');
    const heartBtn = buttons[0]; // Le bouton favori est le premier
    fireEvent.click(heartBtn);
    expect(onFavorite).toHaveBeenCalledTimes(1);
  });

  it('affiche l\'image de la propriété', () => {
    render(<PropertyCard property={createMockProperty({ images: ['https://example.com/photo.jpg'] })} />);
    expect(screen.getByTestId('property-image')).toBeInTheDocument();
  });

  it('utilise un placeholder si pas d\'images', () => {
    render(<PropertyCard property={createMockProperty({ images: [] })} />);
    const img = screen.getByTestId('property-image');
    expect(img.getAttribute('src')).toContain('pexels');
  });
});
