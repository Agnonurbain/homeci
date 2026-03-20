import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getMessaging, isSupported as isMessagingSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBfRcYmFNc1HAZPASHq2na3WqpwT9HJTfM",
  authDomain: "homeci-prod-72e4b.firebaseapp.com",
  projectId: "homeci-prod-72e4b",
  storageBucket: "homeci-prod-72e4b.firebasestorage.app",
  messagingSenderId: "928950289353",
  appId: "1:928950289353:web:3666ae654a0d4ae3a55e18",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics — initialisé uniquement si le navigateur le supporte (pas en SSR/test)
export const analyticsPromise = isAnalyticsSupported().then(yes => yes ? getAnalytics(app) : null);

// FCM Messaging — initialisé uniquement si le navigateur supporte les notifications
export const messagingPromise = isMessagingSupported().then(yes => yes ? getMessaging(app) : null);

export default app;
