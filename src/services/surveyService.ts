import {
  collection, addDoc, getDocs, query, where, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface SurveyResponse {
  id: string;
  user_id: string;
  user_role: string;
  rating: number;          // 1 à 5 étoiles
  comment: string;
  trigger: 'visit_accepted' | 'visit_completed' | 'property_rented' | 'property_sold';
  property_id?: string;
  property_title?: string;
  created_at: string;
}

function toISO(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Timestamp) return val.toDate().toISOString();
  return String(val);
}

export const surveyService = {
  async submitSurvey(data: Omit<SurveyResponse, 'id' | 'created_at'>): Promise<string> {
    const ref = await addDoc(collection(db, 'surveys'), {
      ...data,
      created_at: serverTimestamp(),
    });
    return ref.id;
  },

  /** Vérifie si l'utilisateur a déjà répondu pour ce trigger + propriété */
  async hasAlreadyResponded(userId: string, trigger: string, propertyId?: string): Promise<boolean> {
    const constraints = [
      where('user_id', '==', userId),
      where('trigger', '==', trigger),
    ];
    if (propertyId) constraints.push(where('property_id', '==', propertyId));

    const q = query(collection(db, 'surveys'), ...constraints);
    const snap = await getDocs(q);
    return !snap.empty;
  },

  async getSurveysByUser(userId: string): Promise<SurveyResponse[]> {
    const q = query(collection(db, 'surveys'), where('user_id', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        user_id: String(data.user_id ?? ''),
        user_role: String(data.user_role ?? ''),
        rating: Number(data.rating ?? 0),
        comment: String(data.comment ?? ''),
        trigger: data.trigger as SurveyResponse['trigger'],
        property_id: data.property_id ? String(data.property_id) : undefined,
        property_title: data.property_title ? String(data.property_title) : undefined,
        created_at: toISO(data.created_at),
      };
    });
  },

  async getAllSurveys(): Promise<SurveyResponse[]> {
    const snap = await getDocs(collection(db, 'surveys'));
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        user_id: String(data.user_id ?? ''),
        user_role: String(data.user_role ?? ''),
        rating: Number(data.rating ?? 0),
        comment: String(data.comment ?? ''),
        trigger: data.trigger as SurveyResponse['trigger'],
        property_id: data.property_id ? String(data.property_id) : undefined,
        property_title: data.property_title ? String(data.property_title) : undefined,
        created_at: toISO(data.created_at),
      };
    });
  },
};
