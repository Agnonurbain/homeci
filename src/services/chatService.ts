import {
  collection, doc, getDocs, setDoc, addDoc, query, where, orderBy, onSnapshot, Timestamp, getDoc
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

// Filtre basique pour expurger les numéros de téléphones et les emails
const filterMessage = (msg: string): string => {
  // Regex pour attraper les numéros (ex: +22501020304, 0102030405, 01 02 03 04 05)
  const phoneRegex = /(?:\+?\d{1,3}[-. ]?)?\(?\d{2,3}\)?[-. ]?\d{2,3}[-. ]?\d{2,3}[-. ]?\d{2,3}([-. ]?\d{2,3})?/g;
  // Regex basique pour emails
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;

  let filtered = msg.replace(emailRegex, ' [Email masqué par sécurité] ');
  
  // Remplacer les chaînes qui ressemblent à des téléphones (seulement si la somme des chiffres >= 8)
  filtered = filtered.replace(phoneRegex, (match) => {
    const digitsCount = match.replace(/\D/g, '').length;
    if (digitsCount >= 8) {
      return ' [Téléphone masqué par sécurité] ';
    }
    return match;
  });

  return filtered.trim();
};

export const chatService = {
  /**
   * Crée ou récupère le chat lié à une visite
   */
  async getOrCreateChat(visitId: string, propertyId: string, tenantId: string, ownerId: string): Promise<string> {
    const q = query(collection(db, 'chats'), where('visit_id', '==', visitId));
    const snaps = await getDocs(q);
    
    if (!snaps.empty) {
      return snaps.docs[0].id;
    }

    // Créer un nouveau chat
    const newChatRef = doc(collection(db, 'chats'));
    await setDoc(newChatRef, {
      property_id: propertyId,
      tenant_id: tenantId,
      owner_id: ownerId,
      visit_id: visitId,
      updated_at: new Date().toISOString()
    });
    return newChatRef.id;
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

    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      chat_id: chatId,
      sender_id: senderId,
      content: filteredContent,
      created_at: new Date().toISOString(),
      read: false
    });

    // Mettre à jour le chat parent pour les tris
    await setDoc(doc(db, 'chats', chatId), {
      updated_at: new Date().toISOString()
    }, { merge: true });
  }
};
