/**
 * Service de gestion des publicités HomeCI.
 * Collections Firestore : `boosts` et `ad_banners`.
 */

import {
  collection, doc, setDoc, getDoc, getDocs, updateDoc,
  query, where, orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type {
  PropertyBoost, BoostDuration, BoostStatus,
  AdBanner, BannerStatus, AdContext
} from '../types/ad';
import { BOOST_PRICES } from '../types/ad';

// ── Helpers ─────────────────────────────────────────────────────────────────

const now = () => new Date().toISOString();

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isExpired(endDate: string): boolean {
  return new Date(endDate) < new Date();
}

// ── Boosts ──────────────────────────────────────────────────────────────────

class AdService {

  /* ──── Créer un boost ──── */
  async createBoost(
    propertyId: string,
    propertyTitle: string,
    ownerId: string,
    duration: BoostDuration
  ): Promise<string> {
    const ref = doc(collection(db, 'boosts'));
    const start = new Date();
    const end = addDays(start, duration);
    const boost: PropertyBoost = {
      id: ref.id,
      propertyId,
      propertyTitle,
      ownerId,
      duration,
      status: 'active',
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      amountPaid: BOOST_PRICES[duration].price,
      createdAt: now(),
      updatedAt: now(),
    };
    await setDoc(ref, boost);
    return ref.id;
  }

  /* ──── Récupérer les boosts actifs ──── */
  async getActiveBoosts(): Promise<PropertyBoost[]> {
    const q = query(
      collection(db, 'boosts'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const boosts = snap.docs.map(d => ({ ...d.data(), id: d.id } as PropertyBoost));

    // Auto-expire les boosts dont la date est dépassée
    const active: PropertyBoost[] = [];
    for (const b of boosts) {
      if (isExpired(b.endDate)) {
        await this.updateBoostStatus(b.id!, 'expired');
      } else {
        active.push(b);
      }
    }
    return active;
  }

  /* ──── Tous les boosts (admin) ──── */
  async getAllBoosts(): Promise<PropertyBoost[]> {
    const q = query(collection(db, 'boosts'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as PropertyBoost));
  }

  /* ──── IDs des biens actuellement boostés ──── */
  async getBoostedPropertyIds(): Promise<Set<string>> {
    const active = await this.getActiveBoosts();
    return new Set(active.map(b => b.propertyId));
  }

  /* ──── Vérifier si un bien est boosté ──── */
  async isPropertyBoosted(propertyId: string): Promise<boolean> {
    const ids = await this.getBoostedPropertyIds();
    return ids.has(propertyId);
  }

  /* ──── Mettre à jour le statut d'un boost ──── */
  async updateBoostStatus(boostId: string, status: BoostStatus): Promise<void> {
    await updateDoc(doc(db, 'boosts', boostId), { status, updatedAt: now() });
  }

  // ── Bannières Partenaires ─────────────────────────────────────────────────

  /* ──── Créer une bannière ──── */
  async createBanner(data: Omit<AdBanner, 'id' | 'impressions' | 'clicks' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ref = doc(collection(db, 'ad_banners'));
    const banner: AdBanner = {
      ...data,
      id: ref.id,
      impressions: 0,
      clicks: 0,
      createdAt: now(),
      updatedAt: now(),
    };
    await setDoc(ref, banner);
    return ref.id;
  }

  /* ──── Récupérer les bannières actives avec ciblage contextuel ──── */
  async getActiveBanners(context?: AdContext): Promise<AdBanner[]> {
    const q = query(
      collection(db, 'ad_banners'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    let banners = snap.docs.map(d => ({ ...d.data(), id: d.id } as AdBanner));

    // Auto-expire
    const active: AdBanner[] = [];
    for (const b of banners) {
      if (isExpired(b.endDate)) {
        await this.updateBannerStatus(b.id!, 'expired');
      } else {
        active.push(b);
      }
    }

    // Filtrage contextuel
    if (context) {
      return active.filter(b => {
        if (b.targetCity && context.city && b.targetCity.toLowerCase() !== context.city.toLowerCase()) return false;
        if (b.targetTransactionType && context.transactionType && b.targetTransactionType !== context.transactionType) return false;
        if (b.targetPropertyType && context.propertyType && b.targetPropertyType !== context.propertyType) return false;
        if (b.targetRole && context.userRole && b.targetRole !== context.userRole) return false;
        return true;
      });
    }
    return active;
  }

  /* ──── Toutes les bannières (admin) ──── */
  async getAllBanners(): Promise<AdBanner[]> {
    const q = query(collection(db, 'ad_banners'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as AdBanner));
  }

  /* ──── Mettre à jour le statut d'une bannière ──── */
  async updateBannerStatus(bannerId: string, status: BannerStatus): Promise<void> {
    await updateDoc(doc(db, 'ad_banners', bannerId), { status, updatedAt: now() });
  }

  /* ──── Incrémenter les impressions ──── */
  async trackImpression(bannerId: string): Promise<void> {
    const ref = doc(db, 'ad_banners', bannerId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const current = snap.data().impressions || 0;
      await updateDoc(ref, { impressions: current + 1 });
    }
  }

  /* ──── Incrémenter les clics ──── */
  async trackClick(bannerId: string): Promise<void> {
    const ref = doc(db, 'ad_banners', bannerId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const current = snap.data().clicks || 0;
      await updateDoc(ref, { clicks: current + 1 });
    }
  }
}

export const adService = new AdService();
