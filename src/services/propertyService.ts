import {
  collection,
  collectionGroup,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// ─── Documents légaux (sous-collection) ────────────────────────────────────────

export interface PropertyDocument {
  type: string;
  label: string;
  url: string;
  status: 'en_attente' | 'valide' | 'refuse';
  validated_at?: string;
  validated_by?: string;
  rejection_reason?: string;
}

// ─── Modèle 3D ─────────────────────────────────────────────────────────────────

export interface RoomDimension {
  nom: string;
  longueur: number;
  largeur: number;
  hauteur: number;
}

export interface Model3DRequest {
  status: 'non_soumis' | 'en_attente' | 'en_cours' | 'termine';
  submitted_at?: string;
  nb_etages: number;
  hauteur_sous_plafond: number;
  surface_totale: number;
  plan_urls: string[];
  pieces: RoomDimension[];
  photo_nord?: string;
  photo_sud?: string;
  photo_est?: string;
  photo_ouest?: string;
  photos_interieures: string[];
  materiaux_facade: string;
  type_toiture: string;
  notes: string;
  model_url?: string;
  model_provider?: string;
}

export interface Model3D {
  type: 'url' | 'file';
  url: string;
  provider?: 'matterport' | 'sketchfab' | 'youtube' | 'other';
}

// ─── Propriété ──────────────────────────────────────────────────────────────────

export interface Property {
  id: string;
  owner_id: string;
  title: string;
  property_type: 'appartement' | 'maison' | 'villa' | 'terrain' | 'hotel' | 'appart_hotel';
  transaction_type: 'location' | 'vente' | 'both';
  price: number;
  district: string | null;
  region: string | null;
  departement: string | null;
  city: string;
  commune: string | null;
  quartier: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number;
  bathrooms: number;
  surface_area: number | null;
  land_area: number | null;
  rooms_count: number | null;
  hotel_stars: number | null;
  furnished: boolean;
  parking: boolean;
  amenities: string[];
  images: string[];
  videos: string[];
  /** Documents légaux — chargés séparément via getDocuments() */
  documents: PropertyDocument[];
  model3d: Model3D | null;
  model3d_request: Model3DRequest | null;
  status: 'draft' | 'pending' | 'published' | 'rented' | 'sold' | 'rejected';
  verified_notaire: boolean;
  verification_date: string | null;
  notaire_id: string | null;
  views_count: number;
  featured: boolean;
  available_from: string | null;
  nb_etages: number | null;
  etage_appartement: number | null;
  nb_etages_immeuble: number | null;
  annee_construction: number | null;
  ascenseur: boolean;
  interphone: boolean;
  surface_par_unite: number | null;
  chambres_par_unite: number | null;
  cuisine_par_unite: boolean;
  created_at: string;
  updated_at: string;
}

export type PropertyInsert = Omit<Property, 'id' | 'created_at' | 'updated_at' | 'documents'>;
export type PropertyUpdate = Partial<Omit<Property, 'id' | 'created_at' | 'documents'>>;

export interface PropertyFilters {
  type?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  minBedrooms?: number;
  search?: string;
  transaction_type?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function toISO(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Timestamp) return val.toDate().toISOString();
  return String(val);
}

function docToProperty(id: string, data: Record<string, unknown>): Property {
  return {
    id,
    owner_id: String(data.owner_id ?? ''),
    title: String(data.title ?? ''),
    property_type: (data.property_type as Property['property_type']) ?? 'appartement',
    transaction_type: (data.transaction_type as Property['transaction_type']) ?? 'location',
    price: Number(data.price ?? 0),
    district: (data.district as string | null) ?? null,
    region: (data.region as string | null) ?? null,
    departement: (data.departement as string | null) ?? null,
    city: String(data.city ?? ''),
    commune: (data.commune as string | null) ?? null,
    quartier: (data.quartier as string | null) ?? null,
    address: (data.address as string | null) ?? null,
    latitude: data.latitude != null ? Number(data.latitude) : null,
    longitude: data.longitude != null ? Number(data.longitude) : null,
    bedrooms: Number(data.bedrooms ?? 0),
    bathrooms: Number(data.bathrooms ?? 0),
    surface_area: data.surface_area != null ? Number(data.surface_area) : null,
    land_area: data.land_area != null ? Number(data.land_area) : null,
    rooms_count: data.rooms_count != null ? Number(data.rooms_count) : null,
    hotel_stars: data.hotel_stars != null ? Number(data.hotel_stars) : null,
    furnished: Boolean(data.furnished ?? false),
    parking: Boolean(data.parking ?? false),
    amenities: Array.isArray(data.amenities) ? (data.amenities as string[]) : [],
    images: Array.isArray(data.images) ? (data.images as string[]) : [],
    videos: Array.isArray(data.videos) ? (data.videos as string[]) : [],
    // Documents chargés séparément — initialisé à vide
    documents: [],
    model3d: (data.model3d as Property['model3d']) ?? null,
    model3d_request: (data.model3d_request as Property['model3d_request']) ?? null,
    status: (data.status as Property['status']) ?? 'pending',
    verified_notaire: Boolean(data.verified_notaire ?? false),
    notaire_id: (data.notaire_id as string) || null,
    verification_date: (data.verification_date as string | null) ?? null,
    views_count: Number(data.views_count ?? 0),
    featured: Boolean(data.featured ?? false),
    available_from: (data.available_from as string | null) ?? null,
    nb_etages: data.nb_etages != null ? Number(data.nb_etages) : null,
    etage_appartement: data.etage_appartement != null ? Number(data.etage_appartement) : null,
    nb_etages_immeuble: data.nb_etages_immeuble != null ? Number(data.nb_etages_immeuble) : null,
    annee_construction: data.annee_construction != null ? Number(data.annee_construction) : null,
    ascenseur: Boolean(data.ascenseur ?? false),
    interphone: Boolean(data.interphone ?? false),
    surface_par_unite: data.surface_par_unite != null ? Number(data.surface_par_unite) : null,
    chambres_par_unite: data.chambres_par_unite != null ? Number(data.chambres_par_unite) : null,
    cuisine_par_unite: Boolean(data.cuisine_par_unite ?? false),
    created_at: toISO(data.created_at),
    updated_at: toISO(data.updated_at),
  };
}

// ─── Service ────────────────────────────────────────────────────────────────────

export const propertyService = {
  // ── CRUD Propriétés ──

  async createProperty(propertyData: PropertyInsert): Promise<string> {
    const docRef = await addDoc(collection(db, 'properties'), {
      ...propertyData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateProperty(id: string, propertyData: PropertyUpdate): Promise<void> {
    const docRef = doc(db, 'properties', id);
    await updateDoc(docRef, {
      ...propertyData,
      updated_at: serverTimestamp(),
    });
  },

  async deleteProperty(id: string): Promise<void> {
    await deleteDoc(doc(db, 'properties', id));
  },

  async getProperty(id: string): Promise<Property | null> {
    const docRef = doc(db, 'properties', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const property = docToProperty(docSnap.id, docSnap.data() as Record<string, unknown>);
    // Charger les documents depuis la sous-collection (peut échouer si pas autorisé)
    try {
      property.documents = await this.getDocuments(id);
    } catch {
      // Locataire n'a pas accès aux documents — c'est normal
      property.documents = [];
    }
    return property;
  },

  async getProperties(filters?: PropertyFilters): Promise<Property[]> {
    const constraints = [];
    if (filters?.status) constraints.push(where('status', '==', filters.status));
    if (filters?.city) constraints.push(where('city', '==', filters.city));
    if (filters?.transaction_type) constraints.push(where('transaction_type', '==', filters.transaction_type));

    const q = query(collection(db, 'properties'), ...constraints);
    const snapshot = await getDocs(q);
    let properties = snapshot.docs.map(d => docToProperty(d.id, d.data() as Record<string, unknown>));
    properties.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (filters?.minPrice !== undefined) properties = properties.filter(p => p.price >= filters.minPrice!);
    if (filters?.maxPrice !== undefined) properties = properties.filter(p => p.price <= filters.maxPrice!);
    if (filters?.minBedrooms !== undefined) properties = properties.filter(p => p.bedrooms >= filters.minBedrooms!);
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      properties = properties.filter(p =>
        p.title.toLowerCase().includes(s) ||
        p.city.toLowerCase().includes(s) ||
        (p.quartier && p.quartier.toLowerCase().includes(s))
      );
    }
    return properties;
  },

  async getPropertiesByOwner(ownerId: string): Promise<Property[]> {
    const q = query(collection(db, 'properties'), where('owner_id', '==', ownerId));
    const snapshot = await getDocs(q);
    const props = snapshot.docs.map(d => docToProperty(d.id, d.data() as Record<string, unknown>));
    return props.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getFeaturedProperties(limitCount: number = 6): Promise<Property[]> {
    const q = query(collection(db, 'properties'), where('status', '==', 'published'));
    const snapshot = await getDocs(q);
    const props = snapshot.docs.map(d => docToProperty(d.id, d.data() as Record<string, unknown>));
    return props.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, limitCount);
  },

  async getAllProperties(): Promise<Property[]> {
    const q = query(collection(db, 'properties'));
    const snapshot = await getDocs(q);
    const props = snapshot.docs.map(d => docToProperty(d.id, d.data() as Record<string, unknown>));
    return props.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  /**
   * Charge les propriétés AVEC leurs documents (pour Notaire/Admin).
   * Plus lourd — n'utiliser que quand on a besoin des documents.
   */
  async getPropertiesWithDocs(filters?: PropertyFilters): Promise<Property[]> {
    const properties = await this.getProperties(filters);
    await Promise.all(properties.map(async (p) => {
      try {
        p.documents = await this.getDocuments(p.id);
      } catch {
        p.documents = [];
      }
    }));
    return properties;
  },

  // ── Sous-collection Documents ──

  /** Récupère les documents légaux d'une propriété */
  async getDocuments(propertyId: string): Promise<PropertyDocument[]> {
    const snap = await getDocs(collection(db, 'properties', propertyId, 'documents'));
    return snap.docs.map(d => {
      const data = d.data();
      return {
        type: d.id, // Le docType sert d'ID
        label: String(data.label ?? ''),
        url: String(data.url ?? ''),
        status: (data.status as PropertyDocument['status']) ?? 'en_attente',
        validated_at: data.validated_at ? String(data.validated_at) : undefined,
        validated_by: data.validated_by ? String(data.validated_by) : undefined,
        rejection_reason: data.rejection_reason ? String(data.rejection_reason) : undefined,
      };
    });
  },

  /** Ajoute ou met à jour un document légal (docType = ID du document) */
  async setDocument(propertyId: string, docData: PropertyDocument): Promise<void> {
    const docRef = doc(db, 'properties', propertyId, 'documents', docData.type);
    await setDoc(docRef, {
      label: docData.label,
      url: docData.url,
      status: docData.status,
      ...(docData.validated_at && { validated_at: docData.validated_at }),
      ...(docData.validated_by && { validated_by: docData.validated_by }),
      ...(docData.rejection_reason && { rejection_reason: docData.rejection_reason }),
    });
  },

  /** Met à jour le statut d'un document (validation notaire) */
  async updateDocumentStatus(
    propertyId: string,
    docType: string,
    status: PropertyDocument['status'],
    extra?: { validated_by?: string; rejection_reason?: string }
  ): Promise<void> {
    const docRef = doc(db, 'properties', propertyId, 'documents', docType);
    await updateDoc(docRef, {
      status,
      ...(status === 'valide' && { validated_at: new Date().toISOString() }),
      ...(extra?.validated_by && { validated_by: extra.validated_by }),
      ...(extra?.rejection_reason && { rejection_reason: extra.rejection_reason }),
      // Nettoyer le motif si on valide
      ...(status === 'valide' && { rejection_reason: null }),
    });
  },

  /** Supprime un document légal */
  async deleteDocument(propertyId: string, docType: string): Promise<void> {
    await deleteDoc(doc(db, 'properties', propertyId, 'documents', docType));
  },
};
