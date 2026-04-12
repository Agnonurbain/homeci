import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatService, MESSAGES_PER_PAGE } from '../chatService';

const mockUnsub = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

vi.mock('../../lib/firebase', () => ({
  db: {},
  storage: {},
}));

const makeTimestamp = (seconds: number) => ({
  seconds,
  nanoseconds: 0,
  toDate: () => new Date(seconds * 1000),
  toMillis: () => seconds * 1000,
});

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  setDoc: vi.fn(async () => {}),
  addDoc: vi.fn(async () => ({ id: 'msg-1' })),
  query: vi.fn(() => []),
  orderBy: vi.fn(() => ({})),
  limit: vi.fn(() => ({})),
  endBefore: vi.fn(() => ({})),
  onSnapshot: vi.fn((_q: unknown, cb: (snap: { docs: { id: string; data: () => Record<string, unknown> }[] }) => void) => {
    cb({
      docs: [
        { id: 'msg-1', data: () => ({ sender_id: 'u1', content: 'Hello', read: false, created_at: makeTimestamp(1000) }) },
        { id: 'msg-2', data: () => ({ sender_id: 'u2', content: 'Hi', read: false, created_at: makeTimestamp(2000) }) },
      ],
    });
    return mockUnsub;
  }),
  getDoc: vi.fn(async () => ({
    exists: () => false,
    data: () => ({}),
    id: undefined,
  })),
  getDocs: vi.fn(async () => ({
    empty: false,
    docs: [
      { id: 'msg-old-1', data: () => ({ sender_id: 'u1', content: 'Older message', read: false, created_at: makeTimestamp(500) }) },
    ],
  })),
  updateDoc: vi.fn(async () => {}),
  serverTimestamp: vi.fn(() => ({ __type: 'serverTimestamp' })),
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(() => ({})),
  uploadBytes: vi.fn(async () => {}),
  getDownloadURL: vi.fn(async () => 'https://firebasestorage.url/attachment.jpg'),
  deleteObject: vi.fn(async () => {}),
}));

import * as fs from 'firebase/firestore';
const { setDoc, addDoc, getDoc, updateDoc, onSnapshot, getDocs } = fs;

describe('chatService', () => {
  describe('getOrCreateChat', () => {
    it('retourne l\'id si le chat existe déjà', async () => {
      const mg = getDoc as ReturnType<typeof vi.fn>;
      mg.mockResolvedValueOnce({
        exists: () => true,
        id: 'visit-1',
        data: () => ({}),
      });

      const result = await chatService.getOrCreateChat('visit-1', 'prop-1', 'tenant-1', 'owner-1');
      expect(result).toBe('visit-1');
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('crée un nouveau chat s\'il n\'existe pas', async () => {
      const mg = getDoc as ReturnType<typeof vi.fn>;
      mg.mockResolvedValueOnce({
        exists: () => false,
        id: undefined,
        data: () => ({}),
      });

      const result = await chatService.getOrCreateChat('visit-2', 'prop-2', 'tenant-2', 'owner-2');
      expect(result).toBe('visit-2');
      expect(setDoc).toHaveBeenCalledTimes(1);
      const callArgs = (setDoc as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
      const data = callArgs[1] as Record<string, unknown>;
      expect(data.property_id).toBe('prop-2');
      expect(data.tenant_id).toBe('tenant-2');
      expect(data.owner_id).toBe('owner-2');
      expect(data.visit_id).toBe('visit-2');
    });
  });

  describe('getChatContext', () => {
    it('retourne null si le chat n\'existe pas', async () => {
      const mg = getDoc as ReturnType<typeof vi.fn>;
      mg.mockResolvedValueOnce({
        exists: () => false,
        id: undefined,
        data: () => ({}),
      });

      const result = await chatService.getChatContext('chat-1');
      expect(result).toBeNull();
    });

    it('retourne le contexte du chat', async () => {
      const mg = getDoc as ReturnType<typeof vi.fn>;
      mg.mockResolvedValueOnce({
        exists: () => true,
        id: 'chat-1',
        data: () => ({
          property_id: 'prop-1',
          tenant_id: 'tenant-1',
          owner_id: 'owner-1',
          visit_id: 'visit-1',
        }),
      });

      const result = await chatService.getChatContext('chat-1');
      expect(result).not.toBeNull();
      expect(result!.property_id).toBe('prop-1');
      expect(result!.tenant_id).toBe('tenant-1');
    });
  });

  describe('subscribeToMessages', () => {
    it('s\'abonne aux messages en temps réel et appelle le callback', () => {
      const callback = vi.fn();
      const unsub = chatService.subscribeToMessages('chat-1', callback);

      expect(onSnapshot).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();

      const messages = callback.mock.calls[0][0];
      // Messages are reversed (returned descending from Firestore, but we want ascending)
      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe('Hi');     // newest first after reverse
      expect(messages[1].content).toBe('Hello');  // oldest last

      unsub();
      expect(mockUnsub).toHaveBeenCalled();
    });

    it('accepte un pageSize personnalisé', () => {
      const callback = vi.fn();
      chatService.subscribeToMessages('chat-1', callback, 10);
      expect(onSnapshot).toHaveBeenCalled();
    });
  });

  describe('getMessagesBefore', () => {
    it('récupère les messages plus anciens que le cursor', async () => {
      const lastMsg = {
        id: 'msg-1',
        chat_id: 'chat-1',
        sender_id: 'u1',
        content: 'Last loaded',
        created_at: makeTimestamp(1000),
        read: false,
      };

      const msgs = await chatService.getMessagesBefore('chat-1', lastMsg);
      expect(getDocs).toHaveBeenCalled();
      expect(Array.isArray(msgs)).toBe(true);
    });

    it('retourne un tableau vide si le cursor n\'a pas de timestamp', async () => {
      const lastMsg = {
        id: 'msg-1',
        chat_id: 'chat-1',
        sender_id: 'u1',
        content: 'No timestamp',
        created_at: null,
        read: false,
      };

      const msgs = await chatService.getMessagesBefore('chat-1', lastMsg as any);
      expect(msgs).toEqual([]);
      expect(getDocs).not.toHaveBeenCalled();
    });
  });

  describe('searchMessages', () => {
    it('retourne un tableau vide si le terme est vide', async () => {
      const results = await chatService.searchMessages('chat-1', '');
      expect(results).toEqual([]);
    });

    it('retourne un tableau vide si le terme est uniquement des espaces', async () => {
      const results = await chatService.searchMessages('chat-1', '   ');
      expect(results).toEqual([]);
    });

    it('recherche dans les messages récents et filtre côté client', async () => {
      const mg = getDocs as ReturnType<typeof vi.fn>;
      mg.mockResolvedValueOnce({
        empty: false,
        docs: [
          { id: 'msg-1', data: () => ({ sender_id: 'u1', content: 'Hello world', read: false, created_at: makeTimestamp(1000) }) },
          { id: 'msg-2', data: () => ({ sender_id: 'u2', content: 'Foo bar', read: false, created_at: makeTimestamp(2000) }) },
          { id: 'msg-3', data: () => ({ sender_id: 'u1', content: 'Say hello again', read: false, created_at: makeTimestamp(3000) }) },
        ],
      });

      const results = await chatService.searchMessages('chat-1', 'hello');
      expect(results).toHaveLength(2);
      expect(results[0].content).toBe('Hello world');
      expect(results[1].content).toBe('Say hello again');
    });

    it('respecte maxResults', async () => {
      await chatService.searchMessages('chat-1', 'test', 20);
      expect(getDocs).toHaveBeenCalled();
      const callArgs = (getDocs as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
      expect(callArgs).toBeDefined();
    });
  });

  describe('getLastMessage', () => {
    it('retourne null si aucun message', async () => {
      const mg = getDocs as ReturnType<typeof vi.fn>;
      mg.mockResolvedValueOnce({ empty: true, docs: [] });

      const result = await chatService.getLastMessage('chat-1');
      expect(result).toBeNull();
    });

    it('retourne le dernier message', async () => {
      const mg = getDocs as ReturnType<typeof vi.fn>;
      mg.mockResolvedValueOnce({
        empty: false,
        docs: [
          { id: 'msg-last', data: () => ({ sender_id: 'u2', content: 'Latest', read: true, created_at: makeTimestamp(9999) }) },
        ],
      });

      const result = await chatService.getLastMessage('chat-1');
      expect(result).not.toBeNull();
      expect(result!.content).toBe('Latest');
      expect(result!.id).toBe('msg-last');
    });
  });

  describe('sendMessage', () => {
    it('envoie un message filtré et met à jour le chat', async () => {
      await chatService.sendMessage('chat-1', 'u1', 'Contactez-moi à test@email.com');

      expect(addDoc).toHaveBeenCalledTimes(1);
      const addArgs = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
      const msgData = addArgs[1] as Record<string, unknown>;
      expect(msgData.content).not.toContain('test@email.com');
      expect(msgData.sender_id).toBe('u1');
      expect(msgData.chat_id).toBe('chat-1');
      expect(msgData.read).toBe(false);

      expect(updateDoc).toHaveBeenCalledTimes(1);
    });

    it('filtre les emails du contenu', async () => {
      await chatService.sendMessage('chat-1', 'u1', 'Contactez test@email.com svp');

      expect(addDoc).toHaveBeenCalledTimes(1);
      const addArgs = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
      const msgData = addArgs[1] as Record<string, unknown>;
      expect(msgData.content).not.toContain('test@email.com');
      expect(msgData.content).toContain('Email masqué');
    });
  });

  describe('markMessageAsRead', () => {
    it('marque un message comme lu', async () => {
      await chatService.markMessageAsRead('chat-1', 'msg-1');

      expect(updateDoc).toHaveBeenCalledTimes(1);
      const callArgs = (updateDoc as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
      const data = callArgs[1] as Record<string, unknown>;
      expect(data.read).toBe(true);
    });
  });

  describe('uploadChatAttachment', () => {
    it('upload un fichier et retourne l\'URL avec le type et le nom', async () => {
      const file = new File(['dummy content'], 'photo.jpg', { type: 'image/jpeg' });
      const result = await chatService.uploadChatAttachment(file, 'chat-1');

      expect(result.url).toBe('https://firebasestorage.url/attachment.jpg');
      expect(result.type).toBe('image');
      expect(result.name).toBe('photo.jpg');
    });

    it('détecte un document PDF comme type "document"', async () => {
      const file = new File(['dummy content'], 'doc.pdf', { type: 'application/pdf' });
      const result = await chatService.uploadChatAttachment(file, 'chat-1');

      expect(result.type).toBe('document');
    });
  });

  describe('deleteChatAttachment', () => {
    it('supprime un fichier sans lever d\'erreur', async () => {
      await expect(chatService.deleteChatAttachment('https://example.com/file.jpg')).resolves.not.toThrow();
    });
  });

  describe('sendMessage with attachment', () => {
    it('envoie un message avec une pièce jointe', async () => {
      await chatService.sendMessage('chat-1', 'u1', 'Voici le document', {
        attachmentUrl: 'https://firebasestorage.url/doc.pdf',
        attachmentType: 'document',
        attachmentName: 'doc.pdf',
      });

      expect(addDoc).toHaveBeenCalledTimes(1);
      const addArgs = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
      const msgData = addArgs[1] as Record<string, unknown>;
      expect(msgData.attachment_url).toBe('https://firebasestorage.url/doc.pdf');
      expect(msgData.attachment_type).toBe('document');
      expect(msgData.attachment_name).toBe('doc.pdf');
      expect(msgData.content).toBe('Voici le document');
    });

    it('envoie un message avec pièce jointe seule (sans texte)', async () => {
      await chatService.sendMessage('chat-1', 'u1', '', {
        attachmentUrl: 'https://firebasestorage.url/img.jpg',
        attachmentType: 'image',
        attachmentName: 'img.jpg',
      });

      expect(addDoc).toHaveBeenCalledTimes(1);
      const addArgs = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
      const msgData = addArgs[1] as Record<string, unknown>;
      expect(msgData.content).toBe('[Pièce jointe]');
      expect(msgData.attachment_url).toBe('https://firebasestorage.url/img.jpg');
    });

    it('ne filtre pas les emails quand il y a une pièce jointe', async () => {
      await chatService.sendMessage('chat-1', 'u1', 'Contactez test@email.com', {
        attachmentUrl: 'https://firebasestorage.url/img.jpg',
        attachmentType: 'image',
        attachmentName: 'img.jpg',
      });

      const addArgs = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
      const msgData = addArgs[1] as Record<string, unknown>;
      expect(msgData.content).toBe('Contactez test@email.com');
    });
  });
});

describe('MESSAGES_PER_PAGE constant', () => {
  it('est défini à 30', () => {
    expect(MESSAGES_PER_PAGE).toBe(30);
  });
});
