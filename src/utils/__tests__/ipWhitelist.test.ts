import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkAdminIp, isIpRestrictionEnabled } from '../ipWhitelist';

beforeEach(() => {
  vi.resetModules();
});

describe('ipWhitelist', () => {
  describe('checkAdminIp', () => {
    it('autorise toujours localhost', () => {
      expect(checkAdminIp('127.0.0.1')).toBe(true);
      expect(checkAdminIp('::1')).toBe(true);
      expect(checkAdminIp('localhost')).toBe(true);
    });

    it('autorise tout si aucune IP configurée', () => {
      expect(checkAdminIp('41.210.5.10')).toBe(true);
      expect(checkAdminIp('196.1.100.50')).toBe(true);
    });

    it('vérifie une IP individuelle', async () => {
      vi.stubEnv('ADMIN_ALLOWED_IPS', '41.210.5.10,196.1.100.50');
      const { checkAdminIp: checkIp } = await import('../ipWhitelist');

      expect(checkIp('41.210.5.10')).toBe(true);
      expect(checkIp('196.1.100.50')).toBe(true);
      expect(checkIp('41.210.5.11')).toBe(false);
      expect(checkIp('8.8.8.8')).toBe(false);
    });

    it('vérifie un range CIDR', async () => {
      vi.stubEnv('ADMIN_ALLOWED_IPS', '192.168.1.0/24');
      const { checkAdminIp: checkIp } = await import('../ipWhitelist');

      expect(checkIp('192.168.1.1')).toBe(true);
      expect(checkIp('192.168.1.254')).toBe(true);
      expect(checkIp('192.168.2.1')).toBe(false);
    });
  });

  describe('isIpRestrictionEnabled', () => {
    it('retourne false par défaut (aucune IP configurée)', () => {
      expect(isIpRestrictionEnabled()).toBe(false);
    });
  });

  describe('getAllowedIps', () => {
    it('retourne la liste des IPs autorisées', async () => {
      vi.stubEnv('ADMIN_ALLOWED_IPS', '1.2.3.4, 5.6.7.8');
      const { getAllowedIps } = await import('../ipWhitelist');
      expect(getAllowedIps()).toEqual(['1.2.3.4', '5.6.7.8']);
    });
  });
});
