import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firestoreMocks } from '../../tests/firebase.mock';

const { Timestamp } = firestoreMocks;

import { notificationService } from '../notificationService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('notificationService', () => {

  // ── createNotification ──

  describe('createNotification', () => {
    it('crée une notification avec read=false et timestamp', async () => {
      await notificationService.createNotification({
        user_id: 'user-1',
        type: 'visit_request',
        title: 'Nouvelle demande de visite',
        message: 'Jean veut visiter votre villa',
        property_id: 'prop-1',
      });

      expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1);
      const data = firestoreMocks.addDoc.mock.calls[0][1];
      expect(data.user_id).toBe('user-1');
      expect(data.type).toBe('visit_request');
      expect(data.read).toBe(false);
      expect(data.created_at).toBeDefined();
    });

    it('crée une notification sans property_id', async () => {
      await notificationService.createNotification({
        user_id: 'user-2',
        type: 'new_message',
        title: 'Message système',
        message: 'Bienvenue sur HOMECI',
      });

      const data = firestoreMocks.addDoc.mock.calls[0][1];
      expect(data.user_id).toBe('user-2');
      expect(data.type).toBe('new_message');
    });
  });

  // ── markAsRead ──

  describe('markAsRead', () => {
    it('marque une notification comme lue', async () => {
      await notificationService.markAsRead('notif-123');

      expect(firestoreMocks.updateDoc).toHaveBeenCalledTimes(1);
      const data = firestoreMocks.updateDoc.mock.calls[0][1];
      expect(data.read).toBe(true);
    });
  });

  // ── getNotifications ──

  describe('getNotifications', () => {
    it('retourne les notifications triées et limitées à 50', async () => {
      const mockNotifs = Array.from({ length: 5 }, (_, i) => ({
        id: `notif-${i}`,
        data: () => ({
          user_id: 'user-1',
          type: 'visit_request',
          title: `Notif ${i}`,
          message: `Message ${i}`,
          read: i < 2,
          created_at: Timestamp.fromDate(new Date(2026, 0, i + 1)),
        }),
      }));

      firestoreMocks.getDocs.mockResolvedValueOnce({ docs: mockNotifs });

      const notifs = await notificationService.getNotifications('user-1');

      expect(notifs).toHaveLength(5);
      // Triées par date décroissante → notif-4 (5 jan) en premier
      expect(notifs[0].title).toBe('Notif 4');
      expect(notifs[4].title).toBe('Notif 0');
    });

    it('retourne un tableau vide si aucune notification', async () => {
      firestoreMocks.getDocs.mockResolvedValueOnce({ docs: [] });
      const notifs = await notificationService.getNotifications('user-vide');
      expect(notifs).toEqual([]);
    });
  });

  // ── markAllAsRead ──

  describe('markAllAsRead', () => {
    it('marque toutes les notifications non lues comme lues', async () => {
      firestoreMocks.getDocs.mockResolvedValueOnce({
        docs: [
          { id: 'n1', data: () => ({ user_id: 'u1', type: 'new_message', title: '', message: '', read: false, created_at: Timestamp.fromDate(new Date()) }) },
          { id: 'n2', data: () => ({ user_id: 'u1', type: 'new_message', title: '', message: '', read: false, created_at: Timestamp.fromDate(new Date()) }) },
          { id: 'n3', data: () => ({ user_id: 'u1', type: 'new_message', title: '', message: '', read: true, created_at: Timestamp.fromDate(new Date()) }) },
        ],
      });

      await notificationService.markAllAsRead('u1');

      // Seules les 2 non lues doivent être mises à jour
      expect(firestoreMocks.updateDoc).toHaveBeenCalledTimes(2);
    });
  });
});
