/**
 * HOMECI — Tests: movapayService
 * MovapayService est un mock/simulateur — pas de Firestore, pas de fetch.
 * Il simule des appels API avec du setTimeout.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('movapayService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initiateTransaction', () => {
    it('retourne un succès avec une référence simulée', async () => {
      const { movapayService } = await import('../../services/movapayService');
      const promise = movapayService.initiateTransaction({
        amount: 1000,
        currency: 'XOF',
        phone: '+2250700000000',
        provider: 'orange_money',
        reference: 'HMCI-REF-001',
        description: 'Paiement visite',
      });
      // Avancer le timer de 1000ms (latence simulée)
      await vi.advanceTimersByTimeAsync(1000);
      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.movapayReference).toMatch(/^MVA-SIM-/);
      expect(result.message).toContain('successfully initiated');
    });

    it('échoue si le numéro de téléphone est trop court', async () => {
      const { movapayService } = await import('../../services/movapayService');
      const promise = movapayService.initiateTransaction({
        amount: 1000,
        currency: 'XOF',
        phone: '123',
        provider: 'orange_money',
        reference: 'HMCI-REF-001',
        description: 'Paiement visite',
      });
      await vi.advanceTimersByTimeAsync(1000);
      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid phone number');
    });
  });

  describe('verifyTransaction', () => {
    it('vérifie une transaction et retourne le statut', async () => {
      const { movapayService } = await import('../../services/movapayService');
      const promise = movapayService.verifyTransaction('MVA-SIM-ABC123');
      // Avancer le timer de 500ms (latence simulée)
      await vi.advanceTimersByTimeAsync(500);
      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.status).toBe('success');
      expect(result.movapayReference).toBe('MVA-SIM-ABC123');
    });
  });
});
