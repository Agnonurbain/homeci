import { describe, it, expect } from 'vitest';
import { sanitizePropertyData, type RawFormData } from '../propertyDataSanitizer';

/** Helper : crée un formulaire complet avec des valeurs par défaut */
function makeForm(overrides: Partial<RawFormData> = {}): RawFormData {
  return {
    property_type: 'maison',
    transaction_type: 'vente',
    title: 'Ma maison test',
    price: '50000000',
    district: 'Abidjan',
    region: 'Lagunes',
    departement: 'Abidjan',
    city: 'Cocody',
    commune: 'Cocody',
    quartier: 'Riviera 3',
    address: '10 BP 123',
    latitude: 5.36,
    longitude: -3.98,
    surface_area: '250',
    land_area: '400',
    bedrooms: '4',
    bathrooms: '3',
    rooms_count: '',
    nb_etages: '2',
    terrain_type: '',
    is_fenced: false,
    has_acd: false,
    has_conference_room: false,
    nb_restaurants: '',
    hotel_stars: '',
    furnished: true,
    parking: true,
    amenities: ['piscine', 'jardin'],
    available_from: '2026-04-01',
    etage_appartement: '',
    nb_etages_immeuble: '',
    annee_construction: '',
    ascenseur: false,
    interphone: false,
    surface_par_unite: '',
    chambres_par_unite: '',
    cuisine_par_unite: false,
    is_serviced: false,
    topography: '',
    ...overrides,
  };
}

describe('sanitizePropertyData', () => {
  // ── Champs communs ──

  it('sanitize les champs texte (trim)', () => {
    const result = sanitizePropertyData(makeForm({ title: '  Ma maison  ' }));
    expect(result.title).toBe('Ma maison');
  });

  it('ne contient PAS de champ description', () => {
    const result = sanitizePropertyData(makeForm()) as Record<string, unknown>;
    expect(result).not.toHaveProperty('description');
  });

  it('ne contient PAS de champ documents', () => {
    const result = sanitizePropertyData(makeForm()) as Record<string, unknown>;
    expect(result).not.toHaveProperty('documents');
  });

  it('convertit le prix en nombre', () => {
    const result = sanitizePropertyData(makeForm({ price: '25000000' }));
    expect(result.price).toBe(25000000);
  });

  it('retourne 0 si le prix est invalide', () => {
    const result = sanitizePropertyData(makeForm({ price: 'abc' }));
    expect(result.price).toBe(0);
  });

  it('conserve les coordonnées GPS', () => {
    const result = sanitizePropertyData(makeForm({ latitude: 5.36, longitude: -3.98 }));
    expect(result.latitude).toBe(5.36);
    expect(result.longitude).toBe(-3.98);
  });

  it('gère les coordonnées nulles', () => {
    const result = sanitizePropertyData(makeForm({ latitude: null, longitude: null }));
    expect(result.latitude).toBeNull();
    expect(result.longitude).toBeNull();
  });

  // ── Type Maison ──

  it('retourne les bons champs pour une maison', () => {
    const result = sanitizePropertyData(makeForm({ property_type: 'maison' }));
    expect(result.property_type).toBe('maison');
    expect(result.bedrooms).toBe(4);
    expect(result.bathrooms).toBe(3);
    expect(result.land_area).toBe(400);
    expect(result.surface_area).toBe(250);
    expect(result.nb_etages).toBe(2);
    // Champs non applicables
    expect(result.hotel_stars).toBeNull();
    expect(result.etage_appartement).toBeNull();
    expect(result.surface_par_unite).toBeNull();
  });

  // ── Type Terrain ──

  it('met bedrooms/bathrooms à 0 pour un terrain', () => {
    const result = sanitizePropertyData(makeForm({ property_type: 'terrain' }));
    expect(result.bedrooms).toBe(0);
    expect(result.bathrooms).toBe(0);
    expect(result.furnished).toBe(false);
    expect(result.nb_etages).toBeNull();
  });

  // ── Type Appartement ──

  it('inclut etage_appartement pour un appartement', () => {
    const result = sanitizePropertyData(makeForm({
      property_type: 'appartement',
      etage_appartement: '3',
      nb_etages_immeuble: '10',
      annee_construction: '2020',
      ascenseur: true,
    }));
    expect(result.etage_appartement).toBe(3);
    expect(result.nb_etages_immeuble).toBe(10);
    expect(result.annee_construction).toBe(2020);
    expect(result.ascenseur).toBe(true);
    expect(result.nb_etages).toBeNull();
    expect(result.land_area).toBeNull();
  });

  // ── Type Hôtel ──

  it('inclut hotel_stars et rooms_count pour un hôtel', () => {
    const result = sanitizePropertyData(makeForm({
      property_type: 'hotel',
      hotel_stars: '4',
      rooms_count: '50',
      surface_area: '1200',
      bedrooms: '30',
      bathrooms: '30',
      annee_construction: '2018',
      nb_etages: '3',
      nb_restaurants: '2',
      has_conference_room: true,
    }));
    expect(result.hotel_stars).toBe(4);
    expect(result.rooms_count).toBe(50);
    expect(result.surface_area).toBe(1200);
    expect(result.bedrooms).toBe(30);
    expect(result.bathrooms).toBe(30);
    expect(result.annee_construction).toBe(2018);
    expect(result.nb_etages).toBe(3);
    expect(result.nb_restaurants).toBe(2);
    expect(result.has_conference_room).toBe(true);
    expect(result.etage_appartement).toBeNull();
    expect(result.surface_par_unite).toBeNull();
  });

  it('retourne nb_etages null pour un hôtel sans niveaux', () => {
    const result = sanitizePropertyData(makeForm({
      property_type: 'hotel',
      nb_etages: '',
    }));
    expect(result.nb_etages).toBeNull();
  });

  // ── Type Appart-Hôtel ──

  it('inclut tous les champs pour un appart-hôtel', () => {
    const result = sanitizePropertyData(makeForm({
      property_type: 'appart_hotel',
      surface_area: '800',
      bedrooms: '20',
      bathrooms: '20',
      hotel_stars: '3',
      annee_construction: '2015',
      nb_etages: '2',
      surface_par_unite: '45',
      chambres_par_unite: '2',
      cuisine_par_unite: true,
    }));
    expect(result.surface_area).toBe(800);
    expect(result.bedrooms).toBe(20);
    expect(result.bathrooms).toBe(20);
    expect(result.hotel_stars).toBe(3);
    expect(result.annee_construction).toBe(2015);
    expect(result.nb_etages).toBe(2);
    expect(result.surface_par_unite).toBe(45);
    expect(result.chambres_par_unite).toBe(2);
    expect(result.cuisine_par_unite).toBe(true);
  });

  // ── Amenities ──

  it('conserve les amenities comme array', () => {
    const result = sanitizePropertyData(makeForm({ amenities: ['wifi', 'climatisation'] }));
    expect(result.amenities).toEqual(['wifi', 'climatisation']);
  });

  it('retourne un array vide si amenities est vide', () => {
    const result = sanitizePropertyData(makeForm({ amenities: [] }));
    expect(result.amenities).toEqual([]);
  });

  // ── Champs numériques vides ──

  it('retourne null pour les champs numériques vides', () => {
    const result = sanitizePropertyData(makeForm({
      surface_area: '',
      land_area: '',
      nb_etages: '',
    }));
    expect(result.surface_area).toBeNull();
    expect(result.land_area).toBeNull();
    expect(result.nb_etages).toBeNull();
  });
});
