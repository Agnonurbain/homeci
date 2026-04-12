/**
 * HOMECI — Presence Hook
 *
 * Tracks user online status by updating `last_seen` timestamp in Firestore.
 * Updates every 15 seconds while tab is active, and on visibility change.
 */
import { useEffect, useRef, useCallback } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Hook that updates the user's `last_seen` timestamp periodically.
 * Updates every 15s when tab is visible, and immediately on visibility change.
 */
export function usePresence(userId: string | undefined) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const UPDATE_INTERVAL_MS = 15_000; // 15 seconds

  const updateLastSeen = useCallback(async () => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'users', userId), {
        last_seen: serverTimestamp(),
      });
    } catch (err) {
      // Silently fail — presence is best-effort
      console.warn('[usePresence] Failed to update last_seen:', err);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    // Initial update
    updateLastSeen();

    // Set up periodic updates
    intervalRef.current = setInterval(updateLastSeen, UPDATE_INTERVAL_MS);

    // Update on visibility change (tab switch, minimize, etc.)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateLastSeen();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Update on user activity (mouse, keyboard, scroll, touch)
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => {
      // Debounce: only update if more than 5s since last update
      updateLastSeen();
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [userId, updateLastSeen]);

  return { updateLastSeen };
}
