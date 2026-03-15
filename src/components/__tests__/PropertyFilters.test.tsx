import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyFilters } from '../PropertyFilters';

describe('PropertyFilters', () => {
  const onFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le bouton Filtres', () => {
    render(<PropertyFilters onFilterChange={onFilterChange} />);
    expect(screen.getByText('Filtres')).toBeInTheDocument();
  });

  it('affiche le panneau de filtres au clic', () => {
    render(<PropertyFilters onFilterChange={onFilterChange} />);
    fireEvent.click(screen.getByText('Filtres'));
    expect(screen.getByText('Type de bien')).toBeInTheDocument();
  });

  it('affiche les options de type de bien', () => {
    render(<PropertyFilters onFilterChange={onFilterChange} />);
    fireEvent.click(screen.getByText('Filtres'));
    expect(screen.getByText('Appartement')).toBeInTheDocument();
    expect(screen.getByText('Maison')).toBeInTheDocument();
    expect(screen.getByText('Villa')).toBeInTheDocument();
    expect(screen.getByText('Terrain')).toBeInTheDocument();
  });

  it('affiche les options de transaction dans le select', () => {
    render(<PropertyFilters onFilterChange={onFilterChange} />);
    fireEvent.click(screen.getByText('Filtres'));
    // "Location & Vente" + "Location" + "Vente" = il y a des options multiples
    const locationOpts = screen.getAllByText(/Location/);
    expect(locationOpts.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Vente')).toBeInTheDocument();
  });

  it('affiche les options meublé, parking, vérifié', () => {
    render(<PropertyFilters onFilterChange={onFilterChange} />);
    fireEvent.click(screen.getByText('Filtres'));
    expect(screen.getByText(/[Mm]eublé/)).toBeInTheDocument();
    expect(screen.getByText(/[Pp]arking/)).toBeInTheDocument();
    expect(screen.getByText(/[Vv]érifié/)).toBeInTheDocument();
  });

  it('affiche le bouton Effacer quand un filtre est actif', () => {
    render(<PropertyFilters onFilterChange={onFilterChange} />);
    fireEvent.click(screen.getByText('Filtres'));
    // Sélectionner un type de bien pour activer un filtre
    const typeSelect = screen.getByDisplayValue('Tous les types');
    fireEvent.change(typeSelect, { target: { value: 'villa' } });
    expect(screen.getByText('Effacer')).toBeInTheDocument();
  });

  it('affiche les sélecteurs géographiques', () => {
    render(<PropertyFilters onFilterChange={onFilterChange} />);
    fireEvent.click(screen.getByText('Filtres'));
    const districtEls = screen.getAllByText(/District/i);
    expect(districtEls.length).toBeGreaterThanOrEqual(1);
  });
});
