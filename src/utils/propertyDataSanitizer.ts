import type { PropertyInsert, PropertyUpdate } from '../services/propertyService';

type PropertyType = PropertyInsert['property_type'];

export interface RawFormData {
  property_type: string;
  transaction_type: string;
  title: string;
  description?: string;
  price: string;
  district: string;
  region: string;
  departement: string;
  city: string;
  commune: string;
  quartier: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  surface_area: string;
  land_area: string;
  bedrooms: string;
  bathrooms: string;
  rooms_count: string;
  nb_etages: string;
  hotel_stars: string;
  furnished: boolean;
  parking: boolean;
  amenities: string[];
  available_from: string;
  // Appartement
  etage_appartement: string;
  nb_etages_immeuble: string;
  annee_construction: string;
  ascenseur: boolean;
  interphone: boolean;
  // Appart-Hôtel
  nb_unites: string;
  surface_par_unite: string;
  chambres_par_unite: string;
  cuisine_par_unite: boolean;
}

type SanitizedBase = Omit<
  PropertyInsert,
  | 'owner_id' | 'status' | 'images' | 'verified_notaire'
  | 'verification_date' | 'views_count' | 'featured'
>;

export function sanitizePropertyData(formData: RawFormData): SanitizedBase {
  const type = formData.property_type as PropertyType;

  const base = {
    title: formData.title.trim(),
    description: (formData.description || '').trim(),
    property_type: type,
    transaction_type: formData.transaction_type as PropertyInsert['transaction_type'],
    price: parseFloat(formData.price) || 0,
    district: formData.district || null,
    region: formData.region || null,
    departement: formData.departement || null,
    city: formData.city || '',
    commune: formData.commune || null,
    quartier: formData.quartier?.trim() || null,
    address: formData.address?.trim() || formData.quartier?.trim() || null,
    latitude: formData.latitude,
    longitude: formData.longitude,
    amenities: formData.amenities || [],
    available_from: formData.available_from || null,
    documents: [],
    model3d: null,
    model3d_request: null,
  };

  // ── Terrain ──────────────────────────────────────────────────────────────
  if (type === 'terrain') {
    return {
      ...base,
      nb_etages: null,
      land_area: formData.land_area ? parseFloat(formData.land_area) : null,
      surface_area: formData.surface_area ? parseFloat(formData.surface_area) : null,
      bedrooms: 0, bathrooms: 0, rooms_count: null, hotel_stars: null,
      furnished: false, parking: formData.parking,
      etage_appartement: null, nb_etages_immeuble: null,
      annee_construction: null, ascenseur: false, interphone: false,
      surface_par_unite: null, chambres_par_unite: null, cuisine_par_unite: false,
    };
  }

  // ── Hôtel ─────────────────────────────────────────────────────────────────
  if (type === 'hotel') {
    return {
      ...base,
      nb_etages: formData.nb_etages ? parseInt(formData.nb_etages) : null,
      surface_area: formData.surface_area ? parseFloat(formData.surface_area) : null,
      land_area: null,
      bedrooms: parseInt(formData.bedrooms) || 0,
      bathrooms: parseInt(formData.bathrooms) || 0,
      rooms_count: formData.rooms_count ? parseInt(formData.rooms_count) : null,
      hotel_stars: formData.hotel_stars ? parseInt(formData.hotel_stars) : null,
      furnished: formData.furnished, parking: formData.parking,
      etage_appartement: null, nb_etages_immeuble: null,
      annee_construction: null, ascenseur: false, interphone: false,
      surface_par_unite: null, chambres_par_unite: null, cuisine_par_unite: false,
    };
  }

  // ── Appart-Hôtel ──────────────────────────────────────────────────────────
  if (type === 'appart_hotel') {
    return {
      ...base,
      nb_etages: formData.nb_etages ? parseInt(formData.nb_etages) : null,
      surface_area: formData.surface_area ? parseFloat(formData.surface_area) : null,
      land_area: null,
      hotel_stars: formData.hotel_stars ? parseInt(formData.hotel_stars) : null,
      bathrooms: parseInt(formData.bathrooms) || 0,
      rooms_count: formData.rooms_count ? parseInt(formData.rooms_count) : null,
      bedrooms: parseInt(formData.bedrooms) || 0,
      furnished: formData.furnished, parking: formData.parking,
      etage_appartement: null, nb_etages_immeuble: null,
      annee_construction: null, ascenseur: false, interphone: false,
      surface_par_unite: formData.surface_par_unite ? parseFloat(formData.surface_par_unite) : null,
      chambres_par_unite: formData.chambres_par_unite ? parseInt(formData.chambres_par_unite) : null,
      cuisine_par_unite: formData.cuisine_par_unite || false,
    };
  }

  // ── Appartement ───────────────────────────────────────────────────────────
  if (type === 'appartement') {
    return {
      ...base,
      nb_etages: null,
      surface_area: formData.surface_area ? parseFloat(formData.surface_area) : null,
      land_area: null,
      bedrooms: parseInt(formData.bedrooms) || 0,
      bathrooms: parseInt(formData.bathrooms) || 0,
      rooms_count: null, hotel_stars: null,
      furnished: formData.furnished, parking: formData.parking,
      etage_appartement: formData.etage_appartement ? parseInt(formData.etage_appartement) : null,
      nb_etages_immeuble: formData.nb_etages_immeuble ? parseInt(formData.nb_etages_immeuble) : null,
      annee_construction: formData.annee_construction ? parseInt(formData.annee_construction) : null,
      ascenseur: formData.ascenseur || false,
      interphone: formData.interphone || false,
      surface_par_unite: null, chambres_par_unite: null, cuisine_par_unite: false,
    };
  }

  // ── Maison / Villa ────────────────────────────────────────────────────────
  const withLand = type === 'maison' || type === 'villa';
  return {
    ...base,
    nb_etages: formData.nb_etages ? parseInt(formData.nb_etages) : null,
    surface_area: formData.surface_area ? parseFloat(formData.surface_area) : null,
    land_area: withLand && formData.land_area ? parseFloat(formData.land_area) : null,
    bedrooms: parseInt(formData.bedrooms) || 0,
    bathrooms: parseInt(formData.bathrooms) || 0,
    rooms_count: null, hotel_stars: null,
    furnished: formData.furnished, parking: formData.parking,
    etage_appartement: null, nb_etages_immeuble: null,
    annee_construction: null, ascenseur: false, interphone: false,
    surface_par_unite: null, chambres_par_unite: null, cuisine_par_unite: false,
  };
}

export function sanitizePropertyUpdate(formData: RawFormData): PropertyUpdate {
  return sanitizePropertyData(formData);
}
