/**
 * HOMECI — Tests: paymentService
 * paymentService utilise setDoc/getDoc/updateDoc/where/query sur la collection 'transactions'.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firestoreMocks, mockFirestore } from '../../tests/firebase.mock';

describe('paymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFirestore.reset();
    vi.resetModules();
  });

  describe('createTransaction', () => {
    it('crée une transaction dans Firestore et retourne son ID', async () => {
      firestoreMocks.doc.mockReturnValueOnce({ id: 'txn-001', path: 'transactions/txn-001' } as any);
      firestoreMocks.setDoc.mockResolvedValueOnce(undefined);
      const { paymentService } = await import('../../services/paymentService');
      const id = await paymentService.createTransaction({
        userId: 'user-1',
        amount: 1000,
        currency: 'XOF',
        provider: 'orange_money',
        phone: '+2250700000000',
        status: 'pending',
        context: 'rent',
        reference: 'HMCI-REF-001',
      });
      expect(id).toBe('txn-001');
      expect(firestoreMocks.setDoc).toHaveBeenCalledTimes(1);
      const callArgs = (firestoreMocks.setDoc.mock.calls[0] as any[])?.[1] as Record<string, unknown>;
      expect(callArgs?.userId).toBe('user-1');
      expect(callArgs?.amount).toBe(1000);
      expect(callArgs?.status).toBe('pending');
    });
  });

  describe('updateTransactionStatus', () => {
    it('met à jour le statut d\'une transaction', async () => {
      firestoreMocks.doc.mockReturnValueOnce({} as any);
      firestoreMocks.updateDoc.mockResolvedValueOnce(undefined);
      const { paymentService } = await import('../../services/paymentService');
      await paymentService.updateTransactionStatus('txn-001', 'success', 'MOVAPAY-REF');
      expect(firestoreMocks.updateDoc).toHaveBeenCalledTimes(1);
      const callArgs = (firestoreMocks.updateDoc.mock.calls[0] as any[])?.[1] as Record<string, unknown>;
      expect(callArgs?.status).toBe('success');
      expect(callArgs?.movapayReference).toBe('MOVAPAY-REF');
    });
  });

  describe('getTransaction', () => {
    it('retourne une transaction existante', async () => {
      firestoreMocks.doc.mockReturnValueOnce({} as any);
      firestoreMocks.getDoc.mockResolvedValueOnce({
        exists: () => true,
        id: 'txn-001',
        data: () => ({ id: 'txn-001', status: 'success', amount: 1000 }),
      } as any);
      const { paymentService } = await import('../../services/paymentService');
      const result = await paymentService.getTransaction('txn-001');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('txn-001');
    });

    it('retourne null si la transaction n\'existe pas', async () => {
      firestoreMocks.doc.mockReturnValueOnce({} as any);
      firestoreMocks.getDoc.mockResolvedValueOnce({ exists: () => false, data: () => ({}), id: undefined } as any);
      const { paymentService } = await import('../../services/paymentService');
      const result = await paymentService.getTransaction('txn-999');
      expect(result).toBeNull();
    });
  });

  describe('getUserTransactions', () => {
    it('retourne toutes les transactions d\'un utilisateur', async () => {
      firestoreMocks.getDocs.mockResolvedValueOnce({
        docs: [
          { id: 'txn-1', data: () => ({ id: 'txn-1', status: 'success', userId: 'user-1' }) },
          { id: 'txn-2', data: () => ({ id: 'txn-2', status: 'pending', userId: 'user-1' }) },
        ],
      });
      const { paymentService } = await import('../../services/paymentService');
      const result = await paymentService.getUserTransactions('user-1');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('txn-1');
      expect(result[1].id).toBe('txn-2');
    });
  });
});
