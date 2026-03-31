import { useState, useEffect, useCallback } from 'react';
import { notificationService, type Notification } from '../services/notificationService';

/* ── Hook ─────────────────────────────────────────────────────────────────── */

export function useOwnerNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!userId) return;
    const unsub = notificationService.listenToNotifications(userId, (notifs) => {
      setNotifications(notifs);
    });
    return unsub;
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback(async (notifId: string) => {
    await notificationService.markAsRead(notifId);
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    await notificationService.markAllAsRead(userId);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [userId]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
