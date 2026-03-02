import {
  collection, doc, addDoc, updateDoc, getDocs,
  query, where, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Notification {
  id: string;
  user_id: string;
  type: 'visit_request' | 'visit_accepted' | 'visit_rejected' | 'notaire_approved' | 'notaire_rejected' | 'new_message';
  title: string;
  message: string;
  property_id?: string;
  read: boolean;
  created_at: string;
}

function docToNotif(id: string, data: Record<string, unknown>): Notification {
  const toISO = (val: unknown) => {
    if (!val) return new Date().toISOString();
    if (val instanceof Timestamp) return val.toDate().toISOString();
    return String(val);
  };
  return {
    id,
    user_id: String(data.user_id ?? ''),
    type: (data.type as Notification['type']) ?? 'new_message',
    title: String(data.title ?? ''),
    message: String(data.message ?? ''),
    property_id: data.property_id ? String(data.property_id) : undefined,
    read: Boolean(data.read ?? false),
    created_at: toISO(data.created_at),
  };
}

export const notificationService = {
  async createNotification(data: Omit<Notification, 'id' | 'created_at' | 'read'>): Promise<void> {
    await addDoc(collection(db, 'notifications'), {
      ...data,
      read: false,
      created_at: serverTimestamp(),
    });
  },

  async getNotifications(userId: string): Promise<Notification[]> {
    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => docToNotif(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);
  },

  async markAsRead(notifId: string): Promise<void> {
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  },

  async markAllAsRead(userId: string): Promise<void> {
    const notifs = await this.getNotifications(userId);
    const unread = notifs.filter(n => !n.read);
    await Promise.all(unread.map(n => this.markAsRead(n.id)));
  },
};
