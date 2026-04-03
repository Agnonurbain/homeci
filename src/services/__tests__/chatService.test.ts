import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firestoreMocks, mockFirestore } from '../../tests/firebase.mock';

// Les mocks doivent être importés AVANT le service
import { chatService } from '../chatService';

beforeEach(() => {
  vi.clearAllMocks();
  mockFirestore.reset();
});

describe('chatService', () => {

  describe('getOrCreateChat', () => {
    it('crée un nouveau chat si inexistant', async () => {
      firestoreMocks.getDoc.mockResolvedValueOnce({ 
        exists: () => false,
        data: () => ({}),
        id: 'visit-1'
      });
      
      const chatId = await chatService.getOrCreateChat('visit-1', 'prop-1', 'tenant-1', 'owner-1');
      
      expect(chatId).toBe('visit-1');
      expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          property_id: 'prop-1',
          tenant_id: 'tenant-1',
          owner_id: 'owner-1',
          visit_id: 'visit-1'
        })
      );
    });

    it('récupère l\'ID existant si le chat existe déjà', async () => {
      firestoreMocks.getDoc.mockResolvedValueOnce({ 
        exists: () => true,
        data: () => ({}),
        id: 'existing-chat' 
      });
      
      const chatId = await chatService.getOrCreateChat('visit-1', 'prop-1', 'tenant-1', 'owner-1');
      
      expect(chatId).toBe('existing-chat');
      expect(firestoreMocks.setDoc).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('filtre les emails et appelle addDoc avec serverTimestamp', async () => {
      await chatService.sendMessage('chat-1', 'user-1', 'Contactez moi sur test@gmail.com');
      
      expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1);
      const data = firestoreMocks.addDoc.mock.calls[0][1] as any;
      
      expect(data.content).toBe('Contactez moi sur  [Email masqué]');
      expect(data.sender_id).toBe('user-1');
      expect(data.created_at).toBeDefined();
      expect(data.read).toBe(false);
      
      // Vérifier la mise à jour du chat parent
      expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ updated_at: expect.anything() })
      );
    });

    it('ne fait rien si le contenu est vide après filtrage', async () => {
      await chatService.sendMessage('chat-1', 'user-1', '   ');
      expect(firestoreMocks.addDoc).not.toHaveBeenCalled();
    });
  });

  describe('markMessageAsRead', () => {
    it('met à jour uniquement le champ read', async () => {
      await chatService.markMessageAsRead('chat-1', 'msg-1');
      
      expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        { read: true }
      );
    });
  });

  describe('subscribeToMessages', () => {
    it('configure une requête ordonnée par created_at', () => {
      const callback = vi.fn();
      chatService.subscribeToMessages('chat-1', callback);
      
      expect(firestoreMocks.query).toHaveBeenCalled();
      expect(firestoreMocks.orderBy).toHaveBeenCalledWith('created_at', 'asc');
      expect(firestoreMocks.onSnapshot).toHaveBeenCalled();
    });
  });
});
