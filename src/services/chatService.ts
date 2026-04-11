import {
  collection, doc, setDoc, addDoc, query, orderBy, onSnapshot, getDoc, updateDoc, serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

export type ChatAttachmentType = 'image' | 'document';

export interface ChatMessage {
  id?: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: any; // Firestore Timestamp
  read: boolean;
  attachment_url?: string;
  attachment_type?: ChatAttachmentType;
  attachment_name?: string;
}

export interface Chat {
  id?: string;
  property_id: string;
  tenant_id: string;
  owner_id: string;
  visit_id: string;
  updated_at: any;
  tenant_name?: string;
  owner_name?: string;
  property_title?: string;
}

// Filtre d'emails uniquement (les numéros de téléphone restent visibles selon le choix HomeCI)
const filterMessage = (msg: string): string => {
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
  return msg.replace(emailRegex, ' [Email masqué] ').trim();
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
      await setDoc(chatRef, {
        property_id: propertyId,
        tenant_id: tenantId,
        owner_id: ownerId,
        visit_id: visitId,
        updated_at: serverTimestamp()
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
   * Upload a chat attachment (image or PDF) to Firebase Storage
   */
  async uploadChatAttachment(
    file: File,
    chatId: string
  ): Promise<{ url: string; type: ChatAttachmentType; name: string }> {
    const isImage = file.type.startsWith('image/');
    const ext = file.name.split('.').pop() || (isImage ? 'jpg' : 'pdf');
    const attachmentType: ChatAttachmentType = isImage ? 'image' : 'document';
    const storagePath = `chat_attachments/${chatId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    return { url, type: attachmentType, name: file.name };
  },

  /**
   * Delete a chat attachment from Firebase Storage
   */
  async deleteChatAttachment(fileUrl: string): Promise<void> {
    try {
      const storageRef = ref(storage, fileUrl);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn('[chatService] Failed to delete attachment:', err);
    }
  },

  /**
   * Envoie un message (texte seul ou avec pièce jointe)
   */
  async sendMessage(
    chatId: string,
    senderId: string,
    content: string,
    options?: {
      attachmentUrl?: string;
      attachmentType?: ChatAttachmentType;
      attachmentName?: string;
    }
  ): Promise<void> {
    const filteredContent = options?.attachmentUrl
      ? content || '[Pièce jointe]'
      : filterMessage(content);
    if (!filteredContent && !options?.attachmentUrl) return;

    try {
      const messageData: Record<string, unknown> = {
        chat_id: chatId,
        sender_id: senderId,
        content: filteredContent,
        created_at: serverTimestamp(),
        read: false,
      };

      if (options?.attachmentUrl) {
        messageData.attachment_url = options.attachmentUrl;
        messageData.attachment_type = options.attachmentType;
        messageData.attachment_name = options.attachmentName;
      }

      await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);

      // Mettre à jour le chat parent pour les tris
      await updateDoc(doc(db, 'chats', chatId), {
        updated_at: serverTimestamp()
      });
    } catch (err) {
      console.error('[chatService] Error sending message:', err);
      throw err;
    }
  },

  /**
   * Marque un message comme lu
   */
  async markMessageAsRead(chatId: string, messageId: string): Promise<void> {
    try {
      const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
      await updateDoc(msgRef, { read: true });
    } catch (err) {
      console.error('[chatService] Error marking as read:', err);
    }
  }
};
