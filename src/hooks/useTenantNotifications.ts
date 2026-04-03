import { useState, useEffect } from 'react';
import { notificationService, type Notification } from '../services/notificationService';

export function useTenantNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubNotifs = notificationService.listenToNotifications(userId, (notifs) => {
      setNotifications(notifs);
      setLoading(false);
    });

    return () => unsubNotifs();
  }, [userId]);

  const handleMarkAllRead = async () => {
    if (!userId) return;
    try {
      await notificationService.markAllAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error('Failed to mark all as read:', e);
      throw e;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    loading,
    unreadCount,
    handleMarkAllRead
  };
}
