import { describe, it, expect, vi, beforeEach } from 'vitest';
import { twoFactorService } from '../twoFactorService';

// Mock Firebase
vi.mock('../../lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(async () => ({
    exists: () => false,
    data: () => ({}),
  })),
  updateDoc: vi.fn(async () => {}),
  setDoc: vi.fn(async () => {}),
}));

vi.mock('otplib', () => ({
  generateSecret: vi.fn(() => 'JBSWY3DPEHPK3PXP'),
  generateURI: vi.fn(({ secret, label, issuer }: any) =>
    `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`
  ),
  verifySync: vi.fn(({ token }: { token: string }) =>
    token === '123456' ? { valid: true, delta: 0, epoch: 1776018150, timeStep: 59200605 } : { valid: false, delta: 0, epoch: 1776018150, timeStep: 59200605 }
  ),
}));

import * as fs from 'firebase/firestore';
import { generateSecret, generateURI, verifySync } from 'otplib';

describe('twoFactorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSecret', () => {
    it('génère un secret et une URL otpauth', async () => {
      const { setDoc } = fs;
      vi.mocked(setDoc).mockResolvedValue(undefined as any);

      const result = await twoFactorService.generateSecret('user-1', 'admin@homeci.ci');

      expect(result.secret).toBe('JBSWY3DPEHPK3PXP');
      expect(result.otpauthUrl).toContain('otpauth://totp/');
      expect(generateSecret).toHaveBeenCalled();
      expect(generateURI).toHaveBeenCalledWith({ secret: 'JBSWY3DPEHPK3PXP', label: 'admin@homeci.ci', issuer: 'HOMECI' });
    });
  });

  describe('verifyAndEnable', () => {
    it('active le 2FA avec un code valide', async () => {
      const { getDoc, updateDoc } = fs;
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ secret: 'JBSWY3DPEHPK3PXP' }),
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined as any);

      const result = await twoFactorService.verifyAndEnable('user-1', '123456');

      expect(result).toBe(true);
      expect(verifySync).toHaveBeenCalledWith(expect.objectContaining({ token: '123456', secret: 'JBSWY3DPEHPK3PXP' }));
      expect(updateDoc).toHaveBeenCalled();
    });

    it('retourne false avec un code invalide', async () => {
      const { getDoc } = fs;
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ secret: 'JBSWY3DPEHPK3PXP' }),
      } as any);

      const result = await twoFactorService.verifyAndEnable('user-1', '000000');

      expect(result).toBe(false);
    });

    it('jette une erreur si la config est introuvable', async () => {
      const { getDoc } = fs;
      vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);

      await expect(twoFactorService.verifyAndEnable('user-1', '123456'))
        .rejects.toThrow('Configuration 2FA introuvable');
    });
  });

  describe('verifyToken', () => {
    it('vérifie un code TOTP', async () => {
      const { getDoc } = fs;
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ secret: 'JBSWY3DPEHPK3PXP', enabled: true }),
      } as any);

      const result = await twoFactorService.verifyToken('user-1', '123456');

      expect(result).toBe(true);
    });

    it('jette une erreur si le 2FA n\'est pas activé', async () => {
      const { getDoc } = fs;
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ secret: 'JBSWY3DPEHPK3PXP', enabled: false }),
      } as any);

      await expect(twoFactorService.verifyToken('user-1', '123456'))
        .rejects.toThrow('Le 2FA n\'est pas activé');
    });
  });

  describe('isEnabled', () => {
    it('retourne true si le 2FA est activé', async () => {
      const { getDoc } = fs;
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ enabled: true }),
      } as any);

      const result = await twoFactorService.isEnabled('user-1');
      expect(result).toBe(true);
    });

    it('retourne false si le 2FA n\'est pas activé', async () => {
      const { getDoc } = fs;
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ enabled: false }),
      } as any);

      const result = await twoFactorService.isEnabled('user-1');
      expect(result).toBe(false);
    });

    it('retourne false si la config n\'existe pas', async () => {
      const { getDoc } = fs;
      vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);

      const result = await twoFactorService.isEnabled('user-1');
      expect(result).toBe(false);
    });
  });
});
