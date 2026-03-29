import {
  collection, doc, setDoc, addDoc, query, orderBy, onSnapshot, getDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ChatMessage {
  id?: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export interface Chat {
  id?: string;
  property_id: string;
  tenant_id: string;
  owner_id: string;
  visit_id: string;
  updated_at: string;
  tenant_name?: string;
  owner_name?: string;
  property_title?: string;
}

// Filtre basique pour expurger les emails (on garde les numéros de téléphone accessibles)
const filterMessage = (msg: string): string => {
  // Regex basique pour emails
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
  return msg.replace(emailRegex, ' [Email masqué par sécurité] ').trim();
};

export const chatService = {
  /**
   * Crée ou récupère le chat lié à une visite
   */
  async getOrCreateChat(visitId: string, propertyId: string, tenantId: string, ownerId: string): Promise<string> {
    const chatRef = doc(db, 'chats', visitId);
    const snap = await getDoc(chatRef);
    
    if (snap.exists()) {
      return snap.id;
    }

    try {
      // Créer un nouveau chat avec visitId comme ID
      await setDoc(chatRef, {
        property_id: propertyId,
        tenant_id: tenantId,
        owner_id: ownerId,
        visit_id: visitId,
        updated_at: new Date().toISOString()
      });
      return visitId;
    } catch (err) {
      console.error('[chatService] Error creating chat:', err);
      throw err;
    }
  },

  /**
   * Récupère les infos d'un chat
   */
  async getChatContext(chatId: string): Promise<Chat | null> {
    const d = await getDoc(doc(db, 'chats', chatId));
    return d.exists() ? { id: d.id, ...d.data() } as Chat : null;
  },

  /**
   * Écoute en temps réel les messages d'un chat
   */
  subscribeToMessages(chatId: string, callback: (messages: ChatMessage[]) => void) {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('created_at', 'asc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as ChatMessage[];
      callback(msgs);
    });
  },

  /**
   * Envoie un message
   */
  async sendMessage(chatId: string, senderId: string, content: string): Promise<void> {
    const filteredContent = filterMessage(content);
    if (!filteredContent) return;

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        chat_id: chatId,
        sender_id: senderId,
        content: filteredContent,
        created_at: serverTimestamp(),
        read: false
      });

      // Mettre à jour le chat parent pour les tris
      await setDoc(doc(db, 'chats', chatId), {
        updated_at: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error('[chatService] Error sending message:', err);
      throw err;
    }
  }
};
