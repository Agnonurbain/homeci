import {
  collection, doc, addDoc, updateDoc, getDocs,
  query, where, serverTimestamp, Timestamp, getDoc, onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { notificationService } from './notificationService';
import { emailService } from './emailService';

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
  const status = (data.status as VisitRequest['status']) ?? 'pending';
  let preferredDate = String(data.preferred_date ?? '');
  let preferredTime = String(data.preferred_time ?? '');
  let counterDate = data.counter_date ? String(data.counter_date) : undefined;
  let counterTime = data.counter_time ? String(data.counter_time) : undefined;
  let counterProposedBy = data.counter_proposed_by as VisitRequest['counter_proposed_by'] ?? undefined;

  // Auto-fix: visites acceptées avant le fix qui ont encore des champs counter
  if (status === 'accepted' && counterDate) {
    preferredDate = counterDate;
    preferredTime = counterTime || preferredTime;
    counterDate = undefined;
    counterTime = undefined;
    counterProposedBy = undefined;
    // Corriger en arrière-plan dans Firestore (fire-and-forget)
    updateDoc(doc(db, 'visits', id), {
      preferred_date: preferredDate,
      preferred_time: preferredTime,
      counter_date: null,
      counter_time: null,
      counter_proposed_by: null,
    }).catch(() => {});
  }

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
    preferred_date: preferredDate,
    preferred_time: preferredTime,
    status,
    owner_notes: String(data.owner_notes ?? ''),
    counter_date: counterDate,
    counter_time: counterTime,
    counter_proposed_by: counterProposedBy,
    created_at: toISO(data.created_at),
    updated_at: toISO(data.updated_at),
  };
}

export const visitService = {
  async createVisitRequest(
    data: Omit<VisitRequest, 'id' | 'created_at' | 'updated_at' | 'status' | 'owner_notes'>,
    options?: { notify?: boolean; tenantName?: string }
  ): Promise<string> {
    const ref = await addDoc(collection(db, 'visits'), {
      ...data,
      status: 'pending',
      owner_notes: '',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    if (options?.notify) {
      await notificationService.createNotification({
        user_id: data.owner_id,
        type: 'visit_request',
        title: '📅 Nouvelle demande de visite',
        message: `${options.tenantName || 'Un locataire'} souhaite visiter "${data.property_title || 'votre bien'}" le ${data.preferred_date} à ${data.preferred_time}.`,
        property_id: data.property_id,
      });
    }

    return ref.id;
  },

  async getVisitRequestsByOwner(ownerId: string): Promise<VisitRequest[]> {
    const q = query(collection(db, 'visits'), where('owner_id', '==', ownerId));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => docToVisit(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  listenToVisitRequestsByOwner(ownerId: string, callback: (visits: VisitRequest[]) => void) {
    const q = query(collection(db, 'visits'), where('owner_id', '==', ownerId));
    return onSnapshot(q, (snap) => {
      callback(snap.docs
        .map(d => docToVisit(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    });
  },

  async getVisitRequestsByTenant(tenantId: string): Promise<VisitRequest[]> {
    const q = query(collection(db, 'visits'), where('tenant_id', '==', tenantId));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => docToVisit(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  listenToVisitRequestsByTenant(tenantId: string, callback: (visits: VisitRequest[]) => void) {
    const q = query(collection(db, 'visits'), where('tenant_id', '==', tenantId));
    return onSnapshot(q, (snap) => {
      callback(snap.docs
        .map(d => docToVisit(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    });
  },

  /** Vérifie si un bien a une visite active en consultant property.has_active_visit */
  async hasActiveVisit(propertyId: string): Promise<boolean> {
    const snap = await getDoc(doc(db, 'properties', propertyId));
    if (!snap.exists()) return false;
    return Boolean(snap.data().has_active_visit);
  },

  async updateVisitStatus(
    visitId: string,
    status: 'accepted' | 'rejected' | 'completed',
    notes?: string,
    options?: { notify?: boolean }
  ): Promise<void> {
    const visitSnap = await getDoc(doc(db, 'visits', visitId));
    if (!visitSnap.exists()) throw new Error('Visite introuvable');
    const visitData = visitSnap.data() as VisitRequest;

    await updateDoc(doc(db, 'visits', visitId), {
      status,
      owner_notes: notes || '',
      updated_at: serverTimestamp(),
      // Si on accepte, on s'assure que les champs counter sont vidés
      ...(status === 'accepted' && {
        counter_date: null,
        counter_time: null,
        counter_proposed_by: null,
      })
    });

    const propId = visitData.property_id;

    // Mise à jour du flag sur la propriété
    if (status === 'accepted') {
      await updateDoc(doc(db, 'properties', propId), { has_active_visit: true });
    } else if (status === 'completed' || status === 'rejected') {
      // Vérifier s'il reste d'autres visites actives
      const qOther = query(
        collection(db, 'visits'),
        where('property_id', '==', propId),
        where('status', 'in', ['accepted', 'completed'])
      );
      const snapOther = await getDocs(qOther);
      const hasOtherActive = snapOther.docs.some(d => d.id !== visitId);
      if (!hasOtherActive) {
        await updateDoc(doc(db, 'properties', propId), { has_active_visit: false });
      }
    }

    // Notifications et Emails
    if (options?.notify) {
      const propertyTitle = visitData.property_title || 'votre bien';
      
      await notificationService.createNotification({
        user_id: visitData.tenant_id,
        type: status === 'accepted' ? 'visit_accepted' : status === 'rejected' ? 'visit_rejected' : 'visit_completed',
        title: status === 'accepted' ? 'Visite confirmée ✅' : status === 'rejected' ? 'Visite refusée' : 'Visite effectuée ✅',
        message: status === 'accepted'
          ? `Votre visite pour "${propertyTitle}" le ${new Date(visitData.preferred_date).toLocaleDateString('fr-FR')} à ${visitData.preferred_time} est confirmée.`
          : status === 'rejected'
          ? `Votre demande de visite pour "${propertyTitle}" a été refusée.`
          : `Votre visite de "${propertyTitle}" a été marquée comme effectuée. Merci de partager votre avis !`,
        property_id: propId,
      });

      if (visitData.tenant_email) {
        const emailStatus = status === 'accepted' ? 'approved' : status === 'rejected' ? 'rejected' : 'completed';
        await emailService.notifyVisitUpdate(visitData.tenant_email, propertyTitle, emailStatus).catch(console.error);
      }
    }
  },

  async proposeCounterDate(
    visitId: string,
    counterDate: string,
    counterTime: string,
    proposedBy: 'owner' | 'tenant',
    options?: { notify?: boolean; proposerName?: string }
  ): Promise<void> {
    const visitSnap = await getDoc(doc(db, 'visits', visitId));
    if (!visitSnap.exists()) throw new Error('Visite introuvable');
    const visitData = visitSnap.data() as VisitRequest;

    await updateDoc(doc(db, 'visits', visitId), {
      status: 'counter_proposed',
      counter_date: counterDate,
      counter_time: counterTime,
      counter_proposed_by: proposedBy,
      updated_at: serverTimestamp(),
    });

    if (options?.notify) {
      const targetId = proposedBy === 'owner' ? visitData.tenant_id : visitData.owner_id;
      await notificationService.createNotification({
        user_id: targetId,
        type: 'visit_request',
        title: '📅 Nouvelle date proposée',
        message: `${options.proposerName || 'L\'autre partie'} propose le ${new Date(counterDate).toLocaleDateString('fr-FR')} à ${counterTime} pour "${visitData.property_title || 'le bien'}".`,
        property_id: visitData.property_id,
      });
    }
  },

  async acceptCounterDate(visitId: string, options?: { notify?: boolean; acceptorName?: string }): Promise<void> {
    const snap = await getDoc(doc(db, 'visits', visitId));
    if (!snap.exists()) throw new Error('Visite introuvable');
    const data = snap.data();
    
    const newDate = data.counter_date || data.preferred_date;
    const newTime = data.counter_time || data.preferred_time;
    const proposedBy = data.counter_proposed_by;

    await updateDoc(doc(db, 'visits', visitId), {
      status: 'accepted',
      preferred_date: newDate,
      preferred_time: newTime,
      counter_date: null,
      counter_time: null,
      counter_proposed_by: null,
      updated_at: serverTimestamp(),
    });
    
    await updateDoc(doc(db, 'properties', data.property_id), { has_active_visit: true });

    if (options?.notify) {
      const targetId = proposedBy === 'tenant' ? data.owner_id : data.tenant_id;
      await notificationService.createNotification({
        user_id: targetId,
        type: 'visit_accepted',
        title: 'Visite confirmée ✅',
        message: `${options.acceptorName || 'L\'autre partie'} a accepté la date proposée pour "${data.property_title || 'le bien'}" : le ${new Date(newDate).toLocaleDateString('fr-FR')} à ${newTime}.`,
        property_id: data.property_id,
      });

      if (targetId === data.tenant_id && data.tenant_email) {
        await emailService.notifyVisitUpdate(data.tenant_email, data.property_title || 'votre bien', 'approved').catch(console.error);
      }
    }
  },

  /** Récupère toutes les visites (admin) */
  async getAllVisits(): Promise<VisitRequest[]> {
    const snap = await getDocs(collection(db, 'visits'));
    return snap.docs
      .map(d => docToVisit(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
};
