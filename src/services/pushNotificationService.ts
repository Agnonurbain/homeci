/**
 * HOMECI — Push Notification Service (FCM)
 *
 * Gère :
 * - Demande de permission notification
 * - Récupération et stockage du token FCM dans Firestore
 * - Écoute des messages en premier plan (foreground)
 *
 * Le VAPID_KEY doit être généré dans Firebase Console :
 * Project Settings → Cloud Messaging → Web Push certificates → Generate key pair
 */

import { getToken, onMessage } from 'firebase/messaging';
import type { Messaging } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, messagingPromise } from '../lib/firebase';

// ⚠️ REMPLACER par votre clé VAPID générée dans Firebase Console
// Project Settings → Cloud Messaging → Web Push certificates → Generate key pair
const VAPID_KEY = 'yQoVhdcAJO44CZTt_EBA4A0a9WQF-eEHoRM_WS0ivcE';

let messaging: Messaging | null = null;
messagingPromise.then(m => { messaging = m; }).catch(() => {});

export const pushService = {

  /**
   * Vérifie si les notifications push sont supportées et autorisées
   */
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  },

  /**
   * Vérifie l'état actuel de la permission
   */
  getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  },

  /**
   * Demande la permission et enregistre le token FCM dans Firestore
   * Retourne true si le token a été enregistré avec succès
   */
  async requestPermissionAndRegister(userId: string): Promise<boolean> {
    if (!this.isSupported() || VAPID_KEY === 'VOTRE_VAPID_KEY_ICI') return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;

      // Attendre que messaging soit prêt
      const msg = await messagingPromise;
      if (!msg) return false;

      // Enregistrer le service worker FCM
      const swRegistration = await navigator.serviceWorker.register('/sw.js');

      // Obtenir le token FCM
      const token = await getToken(msg, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      });

      if (!token) return false;

      // Stocker le token dans Firestore (sous-collection fcm_tokens du user)
      await setDoc(doc(db, 'users', userId, 'fcm_tokens', token), {
        token,
        created_at: serverTimestamp(),
        platform: 'web',
        user_agent: navigator.userAgent.slice(0, 200),
      });

      return true;
    } catch (e) {
      console.error('[HOMECI] FCM registration error:', e);
      return false;
    }
  },

  /**
   * Écoute les messages reçus en premier plan (quand l'app est ouverte)
   * Affiche un toast ou une notification custom
   */
  onForegroundMessage(callback: (payload: { title: string; body: string; propertyId?: string }) => void) {
    if (!messaging) {
      // Retry when messaging is ready
      messagingPromise.then(msg => {
        if (!msg) return;
        messaging = msg;
        onMessage(msg, (payload) => {
          callback({
            title: payload.notification?.title || 'HOMECI',
            body: payload.notification?.body || '',
            propertyId: payload.data?.property_id,
          });
        });
      });
      return;
    }

    onMessage(messaging, (payload) => {
      callback({
        title: payload.notification?.title || 'HOMECI',
        body: payload.notification?.body || '',
        propertyId: payload.data?.property_id,
      });
    });
  },
};
