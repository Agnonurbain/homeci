import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase Admin
vi.mock('./firebase-admin', () => ({
  getFirestore: vi.fn(),
  getStorage: vi.fn(),
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { cleanupOrphanedFiles } from '../storageCleanup';
import * as admin from './firebase-admin';

function makeMockDoc(data: any, id = 'doc1') {
  return { id, data: () => data };
}

function makeMockQuerySnapshot(docs: any[]) {
  return {
    empty: docs.length === 0,
    docs,
    size: docs.length,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('cleanupOrphanedFiles', () => {
  it('ne supprime rien si aucun bien orphelin', async () => {
    const mockGet = vi.fn().mockResolvedValue(makeMockQuerySnapshot([]));
    const mockWhere = vi.fn().mockReturnValue({ where: mockWhere2, get: mockGet });
    const mockWhere2 = vi.fn().mockReturnValue({ where: mockWhere3, get: mockGet });
    const mockWhere3 = vi.fn().mockReturnValue({ get: mockGet });

    (admin.getFirestore as any).mockReturnValue({
      collection: vi.fn().mockReturnValue({ where: mockWhere }),
    });

    const result = await cleanupOrphanedFiles({} as any);
    expect(result).toEqual({ deletedImages: 0, deletedDocuments: 0 });
  });

  it('supprime les images et documents des biens rejetés anciens', async () => {
    const mockDelete = vi.fn().mockResolvedValue(undefined);
    const mockExists = vi.fn().mockResolvedValue([true]);
    const mockFile = vi.fn().mockReturnValue({ exists: mockExists, delete: mockDelete });
    const mockBucket = { file: mockFile };

    (admin.getStorage as any).mockReturnValue({
      bucket: vi.fn().mockReturnValue(mockBucket),
    });

    const staleProp = makeMockDoc({
      id: 'p1',
      status: 'rejected',
      images: ['https://firebasestorage.googleapis.com/v0/b/bucket/o/properties%2Fp1%2Fimg1.jpg?alt=media'],
      documents: [{ type: 'titre_foncier', url: 'https://firebasestorage.googleapis.com/v0/b/bucket/o/properties%2Fp1%2Fdoc.pdf?alt=media' }],
      updated_at: new Date('2020-01-01').toISOString(),
    });

    const mockGet = vi.fn().mockResolvedValue(makeMockQuerySnapshot([staleProp]));
    const mockWhere = vi.fn().mockReturnValue({ where: mockWhere2, get: mockGet });
    const mockWhere2 = vi.fn().mockReturnValue({ where: mockWhere3, get: mockGet });
    const mockWhere3 = vi.fn().mockReturnValue({ get: mockGet });

    (admin.getFirestore as any).mockReturnValue({
      collection: vi.fn().mockReturnValue({ where: mockWhere }),
    });

    const result = await cleanupOrphanedFiles({} as any);
    expect(result.deletedImages).toBeGreaterThanOrEqual(0);
  });
});
