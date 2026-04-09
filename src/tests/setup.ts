import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Fix React act() error in production builds
// Must be set before any React code is imported
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
if (typeof window !== 'undefined') {
  (window as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
}

// Suppress act() errors — known issue with React 18 production builds in jsdom
const _origErr = console.error;
console.error = (...a: unknown[]) => {
  const m = typeof a[0] === 'string' ? a[0] : '';
  if (m.includes('act(') || m.includes('ReactDOMTest')) return;
  _origErr.apply(console, a);
};

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApp: vi.fn(),
  getApps: vi.fn(() => []),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
    onAuthStateChanged: vi.fn(),
    signOut: vi.fn(),
  })),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  onAuthStateChanged: vi.fn(),
  connectAuthEmulator: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  connectFirestoreEmulator: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
  connectStorageEmulator: vi.fn(),
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn(() => vi.fn(async () => ({ data: { success: true } }))),
  connectFunctionsEmulator: vi.fn(),
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(),
  isSupported: vi.fn().mockResolvedValue(false),
}));

vi.mock('firebase/messaging', () => ({
  getMessaging: vi.fn(),
  isSupported: vi.fn().mockResolvedValue(false),
  getToken: vi.fn(),
  onMessage: vi.fn(),
}));

// Mock Firebase App Check to avoid IndexedDB errors in JSDOM
vi.mock('firebase/app-check', () => ({
  initializeAppCheck: vi.fn(),
  ReCaptchaEnterpriseProvider: vi.fn(),
}));

// Mock window.scrollTo
window.scrollTo = vi.fn();

// Mock ResizeObserver
window.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
