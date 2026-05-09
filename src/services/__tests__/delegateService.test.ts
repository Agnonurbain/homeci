/**
 * HOMECI — Tests: delegateService
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firestoreMocks, mockFirestore } from '../../tests/firebase.mock';

describe('delegateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFirestore.reset();
    vi.resetModules();
  });

  describe('createToken', () => {
    it('crée un token de délégation et retourne le code', async () => {
      firestoreMocks.addDoc.mockResolvedValueOnce({ id: 'dt-001' });
      const { delegateService } = await import('../../services/delegateService');
      const token = await delegateService.createToken({
        notary_id: 'notaire-1',
        property_id: 'prop-1',
        property_title: 'Appartement Cocody',
        action: 'certify',
      });
      expect(token).toMatch(/^HC-[A-F0-9]{24}$/);
      expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1);
      const callArgs = (firestoreMocks.addDoc.mock.calls[0][1] as Record<string, unknown>);
      expect(callArgs.token).toBe(token);
      expect(callArgs.notary_id).toBe('notaire-1');
      expect(callArgs.status).toBe('pending');
    });
  });

  describe('getTokenByCode', () => {
    it('retourne un token existant', async () => {
      firestoreMocks.getDocs.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'dt-001',
            data: () => ({
              token: 'HC-123456',
              notary_id: 'notaire-1',
              property_id: 'prop-1',
              action: 'certify',
              status: 'pending',
            }),
          },
        ],
      });
      const { delegateService } = await import('../../services/delegateService');
      const result = await delegateService.getTokenByCode('HC-123456');
      expect(result).not.toBeNull();
      expect(result?.token).toBe('HC-123456');
    });

    it('retourne null si le token n\'existe pas', async () => {
      firestoreMocks.getDocs.mockResolvedValueOnce({ empty: true, docs: [] });
      const { delegateService } = await import('../../services/delegateService');
      const result = await delegateService.getTokenByCode('HC-999999');
      expect(result).toBeNull();
    });
  });

  describe('consumeToken', () => {
    it('consomme un token avec succès (certify)', async () => {
      // Mock getTokenByCode
      firestoreMocks.getDocs.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'dt-001',
            data: () => ({
              token: 'HC-123456',
              notary_id: 'notaire-1',
              property_id: 'prop-1',
              property_title: 'Appartement Cocody',
              action: 'certify',
              status: 'pending',
            }),
          },
        ],
      });
      // Mock propertyService.updateProperty
      const propertyServiceMock = {
        updateProperty: vi.fn().mockResolvedValue(undefined),
      };
      vi.doMock('../../services/propertyService', () => ({
        propertyService: propertyServiceMock,
      }));

      firestoreMocks.doc.mockReturnValueOnce({} as any);
      firestoreMocks.updateDoc.mockResolvedValueOnce(undefined);

      const { delegateService } = await import('../../services/delegateService');
      const result = await delegateService.consumeToken('HC-123456', 'admin-1');
      expect(result.success).toBe(true);
      expect(result.message).toContain('Certification');
    });

    it('échoue si le token n\'existe pas', async () => {
      firestoreMocks.getDocs.mockResolvedValueOnce({ empty: true, docs: [] });
      const { delegateService } = await import('../../services/delegateService');
      await expect(delegateService.consumeToken('HC-000000', 'admin-1')).rejects.toThrow(
        'Jeton invalide, expiré ou déjà utilisé'
      );
    });
  });
});
