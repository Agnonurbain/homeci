import {
  collection, doc, addDoc, updateDoc, getDocs,
  query, where, serverTimestamp, Timestamp, getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface VisitRequest {
  id: string;
  property_id: string;
  /** Snapshot — copié à la création pour éviter des lectures supplémentaires */
  property_title?: string;
  property_city?: string;
  owner_id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_phone: string;
  tenant_email: string;
  preferred_date: string;
  preferred_time: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'counter_proposed';
  owner_notes: string;
  counter_date?: string;
  counter_time?: string;
  counter_proposed_by?: 'owner' | 'tenant';
  created_at: string;
  updated_at: string;
}

function toISO(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Timestamp) return val.toDate().toISOString();
  return String(val);
}

function docToVisit(id: string, data: Record<string, unknown>): VisitRequest {
  return {
    id,
    property_id: String(data.property_id ?? ''),
    property_title: data.property_title ? String(data.property_title) : undefined,
    property_city: data.property_city ? String(data.property_city) : undefined,
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
  async createVisitRequest(data: Omit<VisitRequest, 'id' | 'created_at' | 'updated_at' | 'status' | 'owner_notes'>): Promise<string> {
    const ref = await addDoc(collection(db, 'visits'), {
      ...data,
      status: 'pending',
      owner_notes: '',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return ref.id;
  },

  async getVisitRequestsByOwner(ownerId: string): Promise<VisitRequest[]> {
    const q = query(collection(db, 'visits'), where('owner_id', '==', ownerId));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => docToVisit(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getVisitRequestsByTenant(tenantId: string): Promise<VisitRequest[]> {
    const q = query(collection(db, 'visits'), where('tenant_id', '==', tenantId));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => docToVisit(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async updateVisitStatus(visitId: string, status: 'accepted' | 'rejected' | 'completed', notes?: string): Promise<void> {
    await updateDoc(doc(db, 'visits', visitId), {
      status,
      owner_notes: notes || '',
      updated_at: serverTimestamp(),
    });
  },

  async proposeCounterDate(
    visitId: string,
    counterDate: string,
    counterTime: string,
    proposedBy: 'owner' | 'tenant',
  ): Promise<void> {
    await updateDoc(doc(db, 'visits', visitId), {
      status: 'counter_proposed',
      counter_date: counterDate,
      counter_time: counterTime,
      counter_proposed_by: proposedBy,
      updated_at: serverTimestamp(),
    });
  },

  async acceptCounterDate(visitId: string): Promise<void> {
    const snap = await getDoc(doc(db, 'visits', visitId));
    if (!snap.exists()) return;
    const data = snap.data();
    await updateDoc(doc(db, 'visits', visitId), {
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
