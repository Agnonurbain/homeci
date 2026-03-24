/**
 * Types pour le système de publicité ciblée HomeCI.
 * Deux produits : Biens Sponsorisés (Boost) et Bannières Partenaires.
 */

// ── Biens Sponsorisés (Boost) ───────────────────────────────────────────────

export type BoostDuration = 7 | 14 | 30;
export type BoostStatus = 'active' | 'expired' | 'cancelled';

export interface PropertyBoost {
  id?: string;
  propertyId: string;
  propertyTitle: string;
  ownerId: string;
  duration: BoostDuration;
  status: BoostStatus;
  startDate: string;   // ISO
  endDate: string;     // ISO
  amountPaid: number;
  createdAt: string;
  updatedAt: string;
}

/** Tarifs boost (FCFA) — modifiables par l'admin à terme */
export const BOOST_PRICES: Record<BoostDuration, { price: number; label: string }> = {
  7:  { price: 5000,  label: '7 jours' },
  14: { price: 9000,  label: '14 jours' },
  30: { price: 15000, label: '30 jours' },
};

// ── Bannières Partenaires ───────────────────────────────────────────────────

export type BannerStatus = 'active' | 'paused' | 'expired';

export interface AdBanner {
  id?: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  advertiserName: string;
  status: BannerStatus;
  startDate: string;
  endDate: string;
  amountPaid: number;
  impressions: number;
  clicks: number;
  // ── Ciblage ──
  targetCity?: string;           // ex: "Abidjan"
  targetTransactionType?: string; // "location" | "vente" | ""
  targetPropertyType?: string;    // "villa" | "terrain" | ""
  targetRole?: string;            // "locataire" | "proprietaire" | ""
  createdAt: string;
  updatedAt: string;
}

/** Tarifs bannières (FCFA) */
export const BANNER_PRICES = {
  monthly: { price: 50000, label: '1 mois' },
};

// ── Contexte de ciblage (passé aux composants) ──────────────────────────────

export interface AdContext {
  city?: string;
  transactionType?: string;
  propertyType?: string;
  userRole?: string;
}
