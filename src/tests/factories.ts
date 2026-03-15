import type { Property } from '../services/propertyService';
import type { VisitRequest } from '../services/visitService';

/**
 * Crée une Property fictive avec des valeurs par défaut pour les tests.
 */
export function createMockProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: 'prop-test-1',
    owner_id: 'owner-1',
    title: 'Belle villa Cocody',
    property_type: 'villa',
    transaction_type: 'vente',
    price: 75000000,
    district: 'Abidjan',
    region: 'Lagunes',
    departement: 'Abidjan',
    city: 'Cocody',
    commune: 'Cocody',
    quartier: 'Riviera 3',
    address: '10 BP 123 Abidjan',
    latitude: 5.36,
    longitude: -3.98,
    bedrooms: 4,
    bathrooms: 3,
    surface_area: 250,
    land_area: 400,
    rooms_count: null,
    hotel_stars: null,
    furnished: true,
    parking: true,
    amenities: ['piscine', 'jardin', 'climatisation'],
    images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
    videos: [],
    documents: [],
    model3d: null,
    model3d_request: null,
    status: 'published',
    verified_notaire: true,
    verification_date: '2026-03-01',
    notaire_id: 'notaire-1',
    views_count: 42,
    featured: false,
    available_from: null,
    nb_etages: 2,
    etage_appartement: null,
    nb_etages_immeuble: null,
    annee_construction: null,
    ascenseur: false,
    interphone: false,
    surface_par_unite: null,
    chambres_par_unite: null,
    cuisine_par_unite: false,
    created_at: '2026-01-15T10:00:00.000Z',
    updated_at: '2026-03-01T14:30:00.000Z',
    ...overrides,
  };
}

/**
 * Crée une VisitRequest fictive avec des valeurs par défaut pour les tests.
 */
export function createMockVisit(overrides: Partial<VisitRequest> = {}): VisitRequest {
  return {
    id: 'visit-test-1',
    property_id: 'prop-test-1',
    property_title: 'Belle villa Cocody',
    property_city: 'Cocody',
    owner_id: 'owner-1',
    tenant_id: 'tenant-1',
    tenant_name: 'Jean Kouamé',
    tenant_phone: '+225 07 00 00 00',
    tenant_email: 'jean@test.com',
    preferred_date: '2026-04-15',
    preferred_time: '10:00',
    status: 'pending',
    owner_notes: '',
    created_at: '2026-04-01T10:00:00.000Z',
    updated_at: '2026-04-01T10:00:00.000Z',
    ...overrides,
  };
}
