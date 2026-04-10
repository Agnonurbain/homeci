import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InfoStep from '../InfoStep';
import type { PropertyFormData } from '../../../PropertyFormBase';

const defaultFormData: PropertyFormData = {
  title: '', property_type: 'appartement', transaction_type: 'location', price: 0,
  available_from: '2026-05-01',
  district: '', region: '', departement: '', city: '', commune: '', quartier: '', address: '',
  latitude: 5.3484, longitude: -4.0305,
  surface_area: 0, rooms_count: 1, bedrooms: 1, bathrooms: 1, amenities: [],
};

const noop = vi.fn();

describe('InfoStep', () => {
  it('affiche le titre de l\'etape', () => {
    render(<InfoStep formData={defaultFormData} onChange={noop} />);
    expect(screen.getByText(/Informations essentielles/)).toBeInTheDocument();
  });

  it('affiche les selects de type et transaction', () => {
    render(<InfoStep formData={defaultFormData} onChange={noop} />);
    // Les select elements — on les trouve par leur nom
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(2);
    expect(selects[0]).toHaveValue('appartement');
    expect(selects[1]).toHaveValue('location');
  });

  it('affiche le champ titre', () => {
    render(<InfoStep formData={defaultFormData} onChange={noop} />);
    expect(screen.getByPlaceholderText(/Belle villa/)).toBeInTheDocument();
  });

  it('affiche le champ prix avec label FCFA/mois pour location', () => {
    render(<InfoStep formData={defaultFormData} onChange={noop} />);
    expect(screen.getByText(/FCFA\/mois/)).toBeInTheDocument();
  });

  it('affiche le label FCFA pour vente', () => {
    const data = { ...defaultFormData, transaction_type: 'vente' as const };
    render(<InfoStep formData={data} onChange={noop} />);
    expect(screen.getByText(/FCFA\)/)).toBeInTheDocument();
  });

  it('appelle onChange quand le titre change', () => {
    render(<InfoStep formData={defaultFormData} onChange={noop} />);
    const titleInput = screen.getByPlaceholderText(/Belle villa/);
    fireEvent.change(titleInput, { target: { value: 'Mon bien test' } });
    expect(noop).toHaveBeenCalled();
  });

  it('appelle onChange quand le prix change', () => {
    render(<InfoStep formData={defaultFormData} onChange={noop} />);
    const priceInput = screen.getByDisplayValue('0');
    fireEvent.change(priceInput, { target: { value: '150000' } });
    expect(noop).toHaveBeenCalled();
  });

  it('affiche les options de type de bien', () => {
    render(<InfoStep formData={defaultFormData} onChange={noop} />);
    const selects = screen.getAllByRole('combobox');
    const typeSelect = selects[0];
    expect(typeSelect).toHaveValue('appartement');
    expect(screen.getByRole('option', { name: 'Appartement' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Maison' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Villa' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Terrain' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Hôtel' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Appart-Hôtel' })).toBeInTheDocument();
  });

  it('affiche les options de transaction', () => {
    render(<InfoStep formData={defaultFormData} onChange={noop} />);
    const selects = screen.getAllByRole('combobox');
    const txSelect = selects[1];
    expect(txSelect).toHaveValue('location');
    expect(screen.getByRole('option', { name: 'Location' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Vente' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Location & Vente' })).toBeInTheDocument();
  });
});
