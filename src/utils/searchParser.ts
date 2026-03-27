import { 
  ALL_DISTRICTS, 
  COMMUNES_BY_VILLE, 
  VILLES_BY_DEPARTEMENT,
  QUARTIERS_BY_COMMUNE
} from '../data/coteIvoireGeo';
import { TYPE_LABELS } from '../constants/labels';

export interface ParsedFilters {
  propertyType?: string;
  transactionType?: string;
  district?: string;
  city?: string;
  commune?: string;
  quartier?: string;
  minPrice?: number;
  maxPrice?: number;
  exactPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  exactBedrooms?: number;
  verifiedNotaire?: boolean;
  keywords?: string[];
  stars?: number;
}

/**
 * Normalise une chaîne pour faciliter le matching (minuscules, sans accents)
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Parse une requête en langage naturel pour extraire des filtres
 */
export function parseAdvancedSearch(query: string): ParsedFilters {
  const filters: ParsedFilters = { keywords: [] };
  const normalizedQuery = normalize(query);

  // 1. Détection du type de bien
  for (const [key, label] of Object.entries(TYPE_LABELS)) {
    const normLabel = normalize(label);
    if (normalizedQuery.includes(normLabel) || normalizedQuery.includes(key)) {
      filters.propertyType = key;
      break;
    }
  }

  // 2. Détection de la transaction
  if (normalizedQuery.includes('louer') || normalizedQuery.includes('location')) {
    filters.transactionType = 'location';
  } else if (normalizedQuery.includes('vendre') || normalizedQuery.includes('vente') || normalizedQuery.includes('achat')) {
    filters.transactionType = 'vente';
  }

  // 3. Détection Géo
  // On priorise les quartiers, puis communes, puis villes
  
  // Villes
  for (const deptVilles of Object.values(VILLES_BY_DEPARTEMENT)) {
    for (const ville of deptVilles) {
      if (normalizedQuery.includes(normalize(ville))) {
        filters.city = ville;
      }
    }
  }

  // Communes
  for (const cityCommunes of Object.values(COMMUNES_BY_VILLE)) {
    for (const commune of cityCommunes) {
      if (normalizedQuery.includes(normalize(commune))) {
        filters.commune = commune;
      }
    }
  }

  // Quartiers
  for (const commQuartiers of Object.values(QUARTIERS_BY_COMMUNE)) {
    for (const quartier of commQuartiers) {
      if (normalizedQuery.includes(normalize(quartier))) {
        filters.quartier = quartier;
      }
    }
  }

  // Districts
  for (const district of ALL_DISTRICTS) {
    if (normalizedQuery.includes(normalize(district))) {
      filters.district = district;
    }
  }

  // 4. Détection du nombre de pièces (ex: "2 pieces", "F3", "3 chambres")
  const piecesMatch = normalizedQuery.match(/(\d+)\s*(pieces?|chambres?|f\d*)/);
  if (piecesMatch) {
    filters.exactBedrooms = parseInt(piecesMatch[1]);
  }

  // 5. Détection des étoiles pour hôtels
  const starsMatch = normalizedQuery.match(/(\d+)\s*etoiles?/);
  if (starsMatch) {
    filters.stars = parseInt(starsMatch[1]);
  }

  // 6. Support des opérateurs < > = ~ /
  // Prix: prix > 500000, prix < 1000000, prix = 250000
  const priceRangeMatch = normalizedQuery.match(/(prix|loyer)\s*([<> =~])\s*(\d+)/);
  if (priceRangeMatch) {
    const op = priceRangeMatch[2];
    const val = parseInt(priceRangeMatch[3]);
    if (op === '>') filters.minPrice = val;
    if (op === '<') filters.maxPrice = val;
    if (op === '=') filters.exactPrice = val;
  }

  // Pièces avec opérateurs: pieces > 2
  const piecesOpMatch = normalizedQuery.match(/(pieces?|chambres?)\s*([<> =~])\s*(\d+)/);
  if (piecesOpMatch) {
    const op = piecesOpMatch[2];
    const val = parseInt(piecesOpMatch[3]);
    if (op === '>') filters.minBedrooms = val;
    if (op === '<') filters.maxBedrooms = val;
    if (op === '=') filters.exactBedrooms = val;
  }

  // ~ (contient des mots clés)
  if (normalizedQuery.includes('~')) {
    const keywordParts = normalizedQuery.split('~')[1]?.split(/\s+/).filter(Boolean);
    if (keywordParts) filters.keywords?.push(...keywordParts);
  }

  // / (séparateur ou recherche alternative - on l'utilise pour splitter si présent)
  // Non implémenté spécifiquement ici car le split initial gère déjà les mots.

  // 7. Vérifié Notaire
  if (normalizedQuery.includes('verifie') || normalizedQuery.includes('notaire') || normalizedQuery.includes('certifie')) {
    filters.verifiedNotaire = true;
  }

  return filters;
}
