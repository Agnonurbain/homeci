import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CharacteristicsStep from '../CharacteristicsStep';
import type { PropertyFormData } from '../../../PropertyFormBase';

const defaultFormData: PropertyFormData = {
  title: 'Test', property_type: 'maison', transaction_type: 'location', price: 100000,
  available_from: '2026-05-01',
  district: '', region: '', departement: '', city: '', commune: '', quartier: '', address: '',
  latitude: 5.3484, longitude: -4.0305,
  surface_area: 120, rooms_count: 4, bedrooms: 3, bathrooms: 2, amenities: [],
};

const noop = vi.fn();

describe('CharacteristicsStep', () => {
  it('affiche le titre de l\'etape', () => {
    render(<CharacteristicsStep formData={defaultFormData} onChange={noop} toggleAmenity={noop} />);
    expect(screen.getByText(/Caractéristiques/)).toBeInTheDocument();
  });

  it('affiche les champs pour une maison (residential)', () => {
    render(<CharacteristicsStep formData={defaultFormData} onChange={noop} toggleAmenity={noop} />);
    expect(screen.getByText('Surface habitable (m²) *')).toBeInTheDocument();
    expect(screen.getByText('Chambres')).toBeInTheDocument();
    expect(screen.getByText('Salles de bain')).toBeInTheDocument();
    expect(screen.getByText('Superficie du terrain (m²)')).toBeInTheDocument();
  });

  it('affiche les champs specifiques pour un appartement', () => {
    const data = { ...defaultFormData, property_type: 'appartement' as const };
    render(<CharacteristicsStep formData={data} onChange={noop} toggleAmenity={noop} />);
    expect(screen.getByText('Niveau (Étage)')).toBeInTheDocument();
    expect(screen.getByText('Total étages de l\'immeuble')).toBeInTheDocument();
    expect(screen.getByText('Ascenseur')).toBeInTheDocument();
    expect(screen.getByText('Interphone')).toBeInTheDocument();
    expect(screen.queryByText('Superficie du terrain')).not.toBeInTheDocument();
  });

  it('affiche les champs specifiques pour un terrain', () => {
    const data = { ...defaultFormData, property_type: 'terrain' as const, land_area: 500 };
    render(<CharacteristicsStep formData={data} onChange={noop} toggleAmenity={noop} />);
    expect(screen.getByText('Superficie totale (m²) *')).toBeInTheDocument();
    expect(screen.getByText('Usage du terrain')).toBeInTheDocument();
    expect(screen.getByText('Topographie (Relief)')).toBeInTheDocument();
    expect(screen.getByText('Possède un ACD')).toBeInTheDocument();
    expect(screen.getByText(/Terrain viabilisé/)).toBeInTheDocument();
  });

  it('affiche les champs specifiques pour un hotel', () => {
    const data = { ...defaultFormData, property_type: 'hotel' as const };
    render(<CharacteristicsStep formData={data} onChange={noop} toggleAmenity={noop} />);
    expect(screen.getByText('Surface totale (m²) *')).toBeInTheDocument();
    expect(screen.getByText('Étoiles')).toBeInTheDocument();
    expect(screen.getByText('Nombre de restaurants')).toBeInTheDocument();
    expect(screen.getByText('Salles de conférence')).toBeInTheDocument();
  });

  it('appelle onChange quand un champ numerique change', () => {
    render(<CharacteristicsStep formData={defaultFormData} onChange={noop} toggleAmenity={noop} />);
    const bedrooms = screen.getByDisplayValue('3');
    fireEvent.change(bedrooms, { target: { value: '4' } });
    expect(noop).toHaveBeenCalled();
  });

  it('appelle onChange quand une checkbox change', () => {
    render(<CharacteristicsStep formData={defaultFormData} onChange={noop} toggleAmenity={noop} />);
    const checkbox = screen.getByLabelText('Propriété clôturée');
    fireEvent.click(checkbox);
    expect(noop).toHaveBeenCalled();
  });

  it('appelle toggleAmenity au clic sur une commodite', () => {
    const toggle = vi.fn();
    render(<CharacteristicsStep formData={defaultFormData} onChange={noop} toggleAmenity={toggle} />);
    const amenityBtn = screen.getByText('Climatisation');
    fireEvent.click(amenityBtn);
    expect(toggle).toHaveBeenCalledWith('Climatisation');
  });

  it('affiche les commodites selectionnees avec un style different', () => {
    const data = { ...defaultFormData, amenities: ['Climatisation'] };
    render(<CharacteristicsStep formData={data} onChange={noop} toggleAmenity={noop} />);
    const selectedBtn = screen.getByText('Climatisation');
    expect(selectedBtn).toBeInTheDocument();
  });
});
