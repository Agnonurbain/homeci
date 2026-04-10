/**
 * HOMECI — Tests: adService
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firestoreMocks, mockFirestore } from '../../tests/firebase.mock';

describe('adService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFirestore.reset();
    vi.resetModules();
  });

  describe('createBoost', () => {
    it('crée un boost pour un bien et retourne son ID', async () => {
      firestoreMocks.doc.mockReturnValueOnce({ id: 'boost-001' } as any);
      firestoreMocks.setDoc.mockResolvedValueOnce(undefined);
      const { adService } = await import('../../services/adService');
      // Utiliser une durée valide selon BOOST_PRICES
      const id = await adService.createBoost('prop-1', 'Appartement Cocody', 'owner-1', 7);
      expect(id).toBe('boost-001');
      expect(firestoreMocks.setDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe('getActiveBoosts', () => {
    it('retourne les boosts actifs non expirés', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      firestoreMocks.getDocs.mockResolvedValueOnce({
        docs: [
          { id: 'boost-1', data: () => ({ id: 'boost-1', status: 'active', endDate: futureDate, createdAt: new Date().toISOString() }) },
        ],
      });
      const { adService } = await import('../../services/adService');
      const result = await adService.getActiveBoosts();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('boost-1');
    });
  });

  describe('getAllBoosts', () => {
    it('retourne tous les boosts', async () => {
      firestoreMocks.getDocs.mockResolvedValueOnce({
        docs: [
          { id: 'boost-1', data: () => ({ id: 'boost-1', status: 'active', createdAt: new Date().toISOString() }) },
          { id: 'boost-2', data: () => ({ id: 'boost-2', status: 'expired', createdAt: new Date().toISOString() }) },
        ],
      });
      const { adService } = await import('../../services/adService');
      const result = await adService.getAllBoosts();
      expect(result).toHaveLength(2);
    });
  });

  describe('updateBoostStatus', () => {
    it('met à jour le statut d\'un boost', async () => {
      firestoreMocks.doc.mockReturnValueOnce({} as any);
      firestoreMocks.updateDoc.mockResolvedValueOnce(undefined);
      const { adService } = await import('../../services/adService');
      await adService.updateBoostStatus('boost-001', 'expired');
      expect(firestoreMocks.updateDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe('createBanner', () => {
    it('crée une bannière publicitaire', async () => {
      firestoreMocks.doc.mockReturnValueOnce({ id: 'banner-001' } as any);
      firestoreMocks.setDoc.mockResolvedValueOnce(undefined);
      const { adService } = await import('../../services/adService');
      const id = await adService.createBanner({
        title: 'Promo été',
        imageUrl: 'https://example.com/banner.jpg',
        linkUrl: 'https://example.com',
        advertiserName: 'HOMECI',
        status: 'active' as const,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        amountPaid: 50000,
      });
      expect(id).toBe('banner-001');
    });
  });

  describe('getActiveBanners', () => {
    it('retourne les bannières actives non expirées', async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      firestoreMocks.getDocs.mockResolvedValueOnce({
        docs: [{ id: 'banner-1', data: () => ({ id: 'banner-1', status: 'active', endDate: futureDate, createdAt: new Date().toISOString() }) }],
      });
      const { adService } = await import('../../services/adService');
      const result = await adService.getActiveBanners();
      expect(result).toHaveLength(1);
    });
  });

  describe('getAllBanners', () => {
    it('retourne toutes les bannières', async () => {
      firestoreMocks.getDocs.mockResolvedValueOnce({
        docs: [
          { id: 'b1', data: () => ({ id: 'b1', status: 'active', createdAt: new Date().toISOString() }) },
          { id: 'b2', data: () => ({ id: 'b2', status: 'draft', createdAt: new Date().toISOString() }) },
        ],
      });
      const { adService } = await import('../../services/adService');
      const result = await adService.getAllBanners();
      expect(result).toHaveLength(2);
    });
  });

  describe('updateBannerStatus', () => {
    it('met à jour le statut d\'une bannière', async () => {
      firestoreMocks.doc.mockReturnValueOnce({} as any);
      firestoreMocks.updateDoc.mockResolvedValueOnce(undefined);
      const { adService } = await import('../../services/adService');
      await adService.updateBannerStatus('banner-001', 'active');
      expect(firestoreMocks.updateDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe('trackImpression', () => {
    it('incrémente le compteur d\'impressions', async () => {
      firestoreMocks.doc.mockReturnValue({} as any);
      firestoreMocks.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ impressions: 5 }),
        id: 'banner-001',
      } as any);
      firestoreMocks.updateDoc.mockResolvedValueOnce(undefined);
      const { adService } = await import('../../services/adService');
      await adService.trackImpression('banner-001');
      expect(firestoreMocks.updateDoc).toHaveBeenCalledTimes(1);
      const callArgs = (firestoreMocks.updateDoc.mock.calls[0] as any[])[1] as Record<string, unknown>;
      expect(callArgs.impressions).toBe(6);
    });

    it('ne fait rien si la bannière n\'existe pas', async () => {
      firestoreMocks.doc.mockReturnValueOnce({} as any);
      firestoreMocks.getDoc.mockResolvedValueOnce({ exists: () => false, data: () => ({}), id: undefined } as any);
      const { adService } = await import('../../services/adService');
      await adService.trackImpression('banner-999');
      expect(firestoreMocks.updateDoc).not.toHaveBeenCalled();
    });
  });

  describe('trackClick', () => {
    it('incrémente le compteur de clics', async () => {
      firestoreMocks.doc.mockReturnValue({} as any);
      firestoreMocks.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ clicks: 3 }),
        id: 'banner-001',
      } as any);
      firestoreMocks.updateDoc.mockResolvedValueOnce(undefined);
      const { adService } = await import('../../services/adService');
      await adService.trackClick('banner-001');
      expect(firestoreMocks.updateDoc).toHaveBeenCalledTimes(1);
      const callArgs = (firestoreMocks.updateDoc.mock.calls[0] as any[])[1] as Record<string, unknown>;
      expect(callArgs.clicks).toBe(4);
    });
  });
});
