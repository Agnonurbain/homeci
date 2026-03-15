import {
  collection, addDoc, getDocs, query, where, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface PropertyReport {
  id: string;
  property_id: string;
  property_title: string;
  reporter_id: string;
  reporter_role: string;
  reason: 'fraudulent' | 'misleading' | 'inappropriate' | 'duplicate' | 'other';
  details: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
}

const REASON_LABELS: Record<string, string> = {
  fraudulent: 'Annonce frauduleuse',
  misleading: 'Informations trompeuses',
  inappropriate: 'Contenu inapproprié',
  duplicate: 'Annonce en double',
  other: 'Autre',
};

export { REASON_LABELS };

function toISO(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Timestamp) return val.toDate().toISOString();
  return String(val);
}

export const reportService = {
  async submitReport(data: Omit<PropertyReport, 'id' | 'created_at' | 'status'>): Promise<string> {
    const ref = await addDoc(collection(db, 'reports'), {
      ...data,
      status: 'pending',
      created_at: serverTimestamp(),
    });
    return ref.id;
  },

  /** Vérifie si l'utilisateur a déjà signalé cette propriété */
  async hasAlreadyReported(userId: string, propertyId: string): Promise<boolean> {
    const q = query(
      collection(db, 'reports'),
      where('reporter_id', '==', userId),
      where('property_id', '==', propertyId),
    );
    const snap = await getDocs(q);
    return !snap.empty;
  },

  async getReportsByProperty(propertyId: string): Promise<PropertyReport[]> {
    const q = query(collection(db, 'reports'), where('property_id', '==', propertyId));
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        property_id: String(data.property_id ?? ''),
        property_title: String(data.property_title ?? ''),
        reporter_id: String(data.reporter_id ?? ''),
        reporter_role: String(data.reporter_role ?? ''),
        reason: (data.reason as PropertyReport['reason']) ?? 'other',
        details: String(data.details ?? ''),
        status: (data.status as PropertyReport['status']) ?? 'pending',
        created_at: toISO(data.created_at),
      };
    });
  },

  async getAllReports(): Promise<PropertyReport[]> {
    const snap = await getDocs(collection(db, 'reports'));
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        property_id: String(data.property_id ?? ''),
        property_title: String(data.property_title ?? ''),
        reporter_id: String(data.reporter_id ?? ''),
        reporter_role: String(data.reporter_role ?? ''),
        reason: (data.reason as PropertyReport['reason']) ?? 'other',
        details: String(data.details ?? ''),
        status: (data.status as PropertyReport['status']) ?? 'pending',
        created_at: toISO(data.created_at),
      };
    });
  },
};
