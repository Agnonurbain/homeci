import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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
export default app;
