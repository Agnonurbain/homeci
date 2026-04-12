import {
  collection, doc, addDoc, updateDoc, getDocs,
  query, where, serverTimestamp, Timestamp, onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Notification {
  id: string;
  user_id: string;
  type: 'visit_request' | 'visit_accepted' | 'visit_rejected' | 'visit_completed' | 'notaire_approved' | 'notaire_rejected' | 'new_message' | 'system';
  title: string;
  message: string;
  property_id?: string;
  chat_id?: string;
  sender_id?: string;
  sender_name?: string;
  attachment_type?: string;
  target_tab?: 'properties' | 'visits' | 'favorites' | 'notifications' | 'chat';
  icon?: string;
  read: boolean;
  created_at: string;
  // Metadata for offline/online tracking
  delivery_mode?: 'instant' | 'push';
  recipient_online?: boolean;
  message_id?: string;
  push_sent?: boolean;
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
    chat_id: data.chat_id ? String(data.chat_id) : undefined,
    sender_id: data.sender_id ? String(data.sender_id) : undefined,
    sender_name: data.sender_name ? String(data.sender_name) : undefined,
    attachment_type: data.attachment_type ? String(data.attachment_type) : undefined,
    target_tab: (data.target_tab as Notification['target_tab']) ?? undefined,
    icon: data.icon ? String(data.icon) : undefined,
    read: Boolean(data.read ?? false),
    created_at: toISO(data.created_at),
    delivery_mode: (data.delivery_mode as 'instant' | 'push') ?? undefined,
    recipient_online: Boolean(data.recipient_online) ?? undefined,
    message_id: data.message_id ? String(data.message_id) : undefined,
    push_sent: Boolean(data.push_sent) ?? undefined,
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

  listenToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId)
    );
    return onSnapshot(q, (snap) => {
      const notifs = snap.docs
        .map(d => docToNotif(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50);
      callback(notifs);
    });
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
