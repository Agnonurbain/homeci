import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface PropertyAvailability {
  property_id: string;
  owner_id: string;
  // Plages horaires de disponibilité par jour de la semaine (0 = Dimanche, 1 = Lundi, etc.)
  // ex: { 1: ['09:00-12:00', '14:00-18:00'] }
  weekly_schedule: Record<number, string[]>;
  // Jours spécifiquement bloqués au format YYYY-MM-DD
  blocked_dates: string[];
  updated_at: string;
}

export const availabilityService = {
  /**
   * Récupère les disponibilités d'un bien
   */
  async getAvailability(propertyId: string): Promise<PropertyAvailability | null> {
    try {
      const docRef = doc(db, 'property_availabilities', propertyId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as PropertyAvailability;
      }
      return null;
    } catch (error) {
      console.error('Error fetching availability:', error);
      throw error;
    }
  },

  /**
   * Enregistre ou met à jour les disponibilités d'un bien
   */
  async setAvailability(data: Omit<PropertyAvailability, 'updated_at'>): Promise<void> {
    try {
      const docRef = doc(db, 'property_availabilities', data.property_id);
      await setDoc(docRef, {
        ...data,
        updated_at: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Error setting availability:', error);
      throw error;
    }
  },

  /**
   * Génère les créneaux disponibles pour une date donnée selon le schedule
   * (Ne vérifie pas les requêtes de visites existantes, seulement le planning)
   */
  getAvailableSlots(availability: PropertyAvailability, date: Date): string[] {
    const dateStr = date.toISOString().split('T')[0];
    
    // Si la date est spécifiquement bloquée
    if (availability.blocked_dates.includes(dateStr)) {
      return [];
    }

    const dayOfWeek = date.getDay();
    const timeRanges = availability.weekly_schedule[dayOfWeek];

    if (!timeRanges || timeRanges.length === 0) {
      return [];
    }

    // Convertit les plages "HH:MM-HH:MM" en créneaux de 30 ou 60 mins etc.
    // Pour l'instant on retourne juste les plages complètes comme choix
    return timeRanges;
  }
};
