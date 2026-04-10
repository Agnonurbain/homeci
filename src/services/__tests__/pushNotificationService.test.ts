/**
 * HOMECI — Tests: pushNotificationService
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase messaging
const mockOnMessage = vi.fn(() => vi.fn());
const mockGetToken = vi.fn();
vi.mock('firebase/messaging', () => ({
  getToken: mockGetToken,
  onMessage: mockOnMessage,
}));

// Mock firebase app / lib/firebase
vi.mock('../../lib/firebase', () => ({
  db: {},
  messagingPromise: Promise.resolve({}),
}));

describe('pushNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Reset Notification mock
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'default', requestPermission: vi.fn() },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: vi.fn().mockResolvedValue({}) },
      writable: true,
      configurable: true,
    });
  });

  describe('isSupported', () => {
    it('retourne true quand Notification et serviceWorker sont disponibles', async () => {
      const { pushService } = await import('../../services/pushNotificationService');
      expect(pushService.isSupported()).toBe(true);
    });
  });

  describe('getPermissionStatus', () => {
    it('retourne la permission actuelle', async () => {
      const { pushService } = await import('../../services/pushNotificationService');
      const status = pushService.getPermissionStatus();
      expect(status).toBe('default');
    });
  });

  describe('requestPermissionAndRegister', () => {
    it('retourne false si la permission est refusée', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('denied');
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'default', requestPermission: mockRequestPermission },
        writable: true,
        configurable: true,
      });
      const { pushService } = await import('../../services/pushNotificationService');
      const result = await pushService.requestPermissionAndRegister('user-1');
      expect(result).toBe(false);
    });

    it('retourne false si VAPID_KEY est vide', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('granted');
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'default', requestPermission: mockRequestPermission },
        writable: true,
        configurable: true,
      });
      // VAPID_KEY est vide par défaut dans le service
      const { pushService } = await import('../../services/pushNotificationService');
      const result = await pushService.requestPermissionAndRegister('user-1');
      expect(result).toBe(false);
    });
  });

  describe('onForegroundMessage', () => {
    it('accepte un callback sans erreur', async () => {
      const { pushService } = await import('../../services/pushNotificationService');
      const callback = vi.fn();
      // Ne doit pas lancer d'erreur
      expect(() => pushService.onForegroundMessage(callback)).not.toThrow();
    });
  });
});
