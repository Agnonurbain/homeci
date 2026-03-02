import {
  collection, doc, addDoc, updateDoc, getDocs,
  query, where, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface VisitRequest {
  id: string;
  property_id: string;
  property_title: string;
  property_city: string;
  owner_id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_phone: string;
  tenant_email: string;
  preferred_date: string;
  preferred_time: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'counter_proposed';
  owner_notes: string;
  counter_date?: string;       // Date contre-proposée (owner ou tenant)
  counter_time?: string;       // Heure contre-proposée
  counter_proposed_by?: 'owner' | 'tenant'; // Qui a fait la contre-proposition
  created_at: string;
  updated_at: string;
}

function docToVisit(id: string, data: Record<string, unknown>): VisitRequest {
  const toISO = (val: unknown) => {
    if (!val) return new Date().toISOString();
    if (val instanceof Timestamp) return val.toDate().toISOString();
    return String(val);
  };
  return {
    id,
    property_id: String(data.property_id ?? ''),
    property_title: String(data.property_title ?? ''),
    property_city: String(data.property_city ?? ''),
    owner_id: String(data.owner_id ?? ''),
    tenant_id: String(data.tenant_id ?? ''),
    tenant_name: String(data.tenant_name ?? ''),
    tenant_phone: String(data.tenant_phone ?? ''),
    tenant_email: String(data.tenant_email ?? ''),
    preferred_date: String(data.preferred_date ?? ''),
    preferred_time: String(data.preferred_time ?? ''),
    status: (data.status as VisitRequest['status']) ?? 'pending',
    owner_notes: String(data.owner_notes ?? ''),
    counter_date: data.counter_date ? String(data.counter_date) : undefined,
    counter_time: data.counter_time ? String(data.counter_time) : undefined,
    counter_proposed_by: data.counter_proposed_by as VisitRequest['counter_proposed_by'] ?? undefined,
    created_at: toISO(data.created_at),
    updated_at: toISO(data.updated_at),
  };
}

export const visitService = {
  // Locataire : créer une demande de visite
  async createVisitRequest(data: Omit<VisitRequest, 'id' | 'created_at' | 'updated_at' | 'status' | 'owner_notes'>): Promise<string> {
    const ref = await addDoc(collection(db, 'visit_requests'), {
      ...data,
      status: 'pending',
      owner_notes: '',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return ref.id;
  },

  // Propriétaire : lire ses demandes
  async getVisitRequestsByOwner(ownerId: string): Promise<VisitRequest[]> {
    const q = query(
      collection(db, 'visit_requests'),
      where('owner_id', '==', ownerId)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => docToVisit(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // Locataire : lire ses demandes
  async getVisitRequestsByTenant(tenantId: string): Promise<VisitRequest[]> {
    const q = query(
      collection(db, 'visit_requests'),
      where('tenant_id', '==', tenantId)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => docToVisit(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // Propriétaire : accepter/rejeter
  async updateVisitStatus(visitId: string, status: 'accepted' | 'rejected' | 'completed', notes?: string): Promise<void> {
    await updateDoc(doc(db, 'visit_requests', visitId), {
      status,
      owner_notes: notes || '',
      updated_at: serverTimestamp(),
    });
  },

  // Contre-proposition de date (owner ou tenant)
  async proposeCounterDate(
    visitId: string,
    counterDate: string,
    counterTime: string,
    proposedBy: 'owner' | 'tenant',
  ): Promise<void> {
    await updateDoc(doc(db, 'visit_requests', visitId), {
      status: 'counter_proposed',
      counter_date: counterDate,
      counter_time: counterTime,
      counter_proposed_by: proposedBy,
      updated_at: serverTimestamp(),
    });
  },

  // Accepter la contre-proposition (les dates counter deviennent les dates officielles)
  async acceptCounterDate(visitId: string): Promise<void> {
    const snap = await (await import('firebase/firestore')).getDoc(doc(db, 'visit_requests', visitId));
    if (!snap.exists()) return;
    const data = snap.data();
    await updateDoc(doc(db, 'visit_requests', visitId), {
      status: 'accepted',
      preferred_date: data.counter_date || data.preferred_date,
      preferred_time: data.counter_time || data.preferred_time,
      counter_date: null,
      counter_time: null,
      counter_proposed_by: null,
      updated_at: serverTimestamp(),
    });
  },
};
