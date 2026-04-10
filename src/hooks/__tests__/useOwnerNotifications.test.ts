/**
 * HOMECI — Tests: useOwnerNotifications
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOwnerNotifications } from '../../hooks/useOwnerNotifications';

vi.mock('../../services/notificationService', () => ({
  notificationService: {
    listenToNotifications: vi.fn((_userId, cb) => {
      cb([]);
      return vi.fn();
    }),
    markAsRead: vi.fn(async () => {}),
    markAllAsRead: vi.fn(async () => {}),
  },
}));

import { notificationService } from '../../services/notificationService';

describe('useOwnerNotifications', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('retourne un état initial vide', () => {
    const { result } = renderHook(() => useOwnerNotifications('user-1'));
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('retourne les notifications du propriétaire', async () => {
    const mockNotifs = [
      { id: 'n1', type: 'visit_request', read: false, title: 'Nouvelle visite' },
      { id: 'n2', type: 'new_message', read: true, title: 'Message' },
    ];
    (notificationService.listenToNotifications as any).mockImplementation((_userId: any, cb: any) => {
      cb(mockNotifs);
      return vi.fn();
    });

    const { result } = renderHook(() => useOwnerNotifications('user-1'));
    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });
    expect(result.current.unreadCount).toBe(1);
  });

  it('appelle markAsRead et met à jour localement', async () => {
    (notificationService.listenToNotifications as any).mockImplementation((_userId: any, cb: any) => {
      cb([{ id: 'n1', read: false }]);
      return vi.fn();
    });

    const { result } = renderHook(() => useOwnerNotifications('user-1'));
    await waitFor(() => {
      expect(result.current.notifications[0].read).toBe(false);
    });

    await act(async () => {
      await result.current.markAsRead('n1');
    });

    expect(notificationService.markAsRead).toHaveBeenCalledWith('n1');
    expect(result.current.notifications[0].read).toBe(true);
  });

  it('appelle markAllAsRead et met à jour localement', async () => {
    (notificationService.listenToNotifications as any).mockImplementation((_userId: any, cb: any) => {
      cb([{ id: 'n1', read: false }, { id: 'n2', read: false }]);
      return vi.fn();
    });

    const { result } = renderHook(() => useOwnerNotifications('user-1'));
    await waitFor(() => {
      expect(result.current.unreadCount).toBe(2);
    });

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(notificationService.markAllAsRead).toHaveBeenCalledWith('user-1');
    expect(result.current.unreadCount).toBe(0);
  });

  it('ne crée PAS de listener quand userId est undefined', () => {
    renderHook(() => useOwnerNotifications(undefined));
    expect(notificationService.listenToNotifications).not.toHaveBeenCalled();
  });
});
