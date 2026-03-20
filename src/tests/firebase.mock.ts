/**
 * Mock Firebase pour les tests unitaires.
 * Simule Firestore et Storage sans connexion réelle.
 */
import { vi } from 'vitest';

// ─── Firestore mock ─────────────────────────────────────────────────────────────

const mockDocData = new Map<string, Record<string, unknown>>();

export const mockFirestore = {
  /** Injecte des données fictives pour un document */
  setMockDoc(path: string, data: Record<string, unknown>) {
    mockDocData.set(path, data);
  },
  /** Réinitialise toutes les données */
  reset() {
    mockDocData.clear();
  },
};

const mockDocRef = (path: string) => ({ id: path.split('/').pop(), path });
const mockCollectionRef = (path: string) => ({ path });

export const firestoreMocks = {
  doc: vi.fn((_db: unknown, ...segments: string[]) => mockDocRef(segments.join('/'))),
  collection: vi.fn((_db: unknown, ...segments: string[]) => mockCollectionRef(segments.join('/'))),
  collectionGroup: vi.fn((_db: unknown, name: string) => mockCollectionRef(name)),
  addDoc: vi.fn(async (_ref: unknown, data: unknown) => {
    const id = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    return { id };
  }),
  setDoc: vi.fn(async () => {}),
  updateDoc: vi.fn(async () => {}),
  deleteDoc: vi.fn(async () => {}),
  getDoc: vi.fn(async (ref: { path: string }) => {
    const data = mockDocData.get(ref.path);
    return {
      exists: () => !!data,
      data: () => data || {},
      id: ref.path.split('/').pop(),
    };
  }),
  getDocs: vi.fn(async () => ({
    docs: [],
    empty: true,
    size: 0,
  })),
  query: vi.fn((...args: unknown[]) => args[0]),
  where: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  limit: vi.fn(() => ({})),
  serverTimestamp: vi.fn(() => ({ _type: 'serverTimestamp' })),
  Timestamp: class MockTimestamp {
    _seconds: number;
    _nanoseconds: number;
    constructor(seconds: number = 0, nanoseconds: number = 0) {
      this._seconds = seconds;
      this._nanoseconds = nanoseconds;
    }
    toDate() { return new Date(this._seconds * 1000); }
    static now() { return new MockTimestamp(Math.floor(Date.now() / 1000)); }
    static fromDate(d: Date) { return new MockTimestamp(Math.floor(d.getTime() / 1000)); }
  },
};

// ─── Storage mock ───────────────────────────────────────────────────────────────

export const storageMocks = {
  ref: vi.fn((_storage: unknown, path: string) => ({ path, fullPath: path })),
  uploadBytes: vi.fn(async () => ({ ref: { fullPath: 'mock/path' } })),
  uploadBytesResumable: vi.fn(() => ({
    on: vi.fn((_event: string, _progress: unknown, _error: unknown, complete: () => void) => {
      complete?.();
    }),
    snapshot: { ref: { fullPath: 'mock/path' } },
  })),
  getDownloadURL: vi.fn(async () => 'https://firebasestorage.googleapis.com/mock-url'),
  deleteObject: vi.fn(async () => {}),
};

// ─── Appliquer les mocks ────────────────────────────────────────────────────────

vi.mock('firebase/firestore', () => firestoreMocks);
vi.mock('firebase/storage', () => storageMocks);
vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({})),
  isSupported: vi.fn(async () => false),
  logEvent: vi.fn(),
  setUserId: vi.fn(),
  setUserProperties: vi.fn(),
}));
vi.mock('../lib/firebase', () => ({
  db: {},
  auth: {},
  storage: {},
  analyticsPromise: Promise.resolve(null),
}));
// Alias pour les services dans des sous-dossiers
vi.mock('../../lib/firebase', () => ({
  db: {},
  auth: {},
  storage: {},
  analyticsPromise: Promise.resolve(null),
}));
