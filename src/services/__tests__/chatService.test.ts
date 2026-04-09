import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatService } from '../chatService';

const mockUnsub = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

vi.mock('../../lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  setDoc: vi.fn(async () => {}),
  addDoc: vi.fn(async () => ({ id: 'msg-1' })),
  query: vi.fn(() => []),
  orderBy: vi.fn(() => ({})),
  onSnapshot: vi.fn((_q: unknown, cb: (snap: { docs: { id: string; data: () => Record<string, unknown> }[] }) => void) => {
    cb({
      docs: [
        { id: 'msg-1', data: () => ({ sender_id: 'u1', content: 'Hello', read: false, created_at: { toDate: () => new Date() } }) },
        { id: 'msg-2', data: () => ({ sender_id: 'u2', content: 'Hi', read: false, created_at: { toDate: () => new Date() } }) },
      ],
    });
    return mockUnsub;
  }),
  getDoc: vi.fn(async () => ({
    exists: () => false,
    data: () => ({}),
    id: undefined,
  })),
  updateDoc: vi.fn(async () => {}),
  serverTimestamp: vi.fn(() => ({ __type: 'serverTimestamp' })),
}));

// Re-import mocked functions for test usage
import * as fs from 'firebase/firestore';
const { setDoc, addDoc, getDoc, updateDoc, onSnapshot } = fs;

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
      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe('Hello');
      expect(messages[1].content).toBe('Hi');

      unsub();
      expect(mockUnsub).toHaveBeenCalled();
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
});
