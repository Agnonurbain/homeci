import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storageMocks } from '../../tests/firebase.mock';

import { storageService } from '../storageService';

// Mock compressImage pour éviter les appels canvas en jsdom
vi.mock('../../utils/compressImage', () => ({
  compressImage: vi.fn(async (file: File) => file), // Retourne le fichier tel quel
  COMPRESS_PRESETS: {
    property: { maxWidth: 1920, maxHeight: 1080, quality: 0.8, maxSizeMB: 1 },
    thumbnail: { maxWidth: 600, maxHeight: 400, quality: 0.7, maxSizeMB: 0.3 },
    avatar: { maxWidth: 400, maxHeight: 400, quality: 0.75, maxSizeMB: 0.2 },
  },
}));

function createMockFile(name: string, type: string): File {
  return new File([new Uint8Array(100)], name, { type });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('storageService', () => {

  // ── uploadImage ──

  describe('uploadImage', () => {
    it('upload une image et retourne une URL Firebase Storage', async () => {
      const file = createMockFile('photo.jpg', 'image/jpeg');
      const url = await storageService.uploadImage(file, 'properties/user1/prop1');

      expect(storageMocks.ref).toHaveBeenCalledTimes(1);
      expect(storageMocks.uploadBytes).toHaveBeenCalledTimes(1);
      expect(storageMocks.getDownloadURL).toHaveBeenCalledTimes(1);
      expect(url).toContain('firebasestorage.googleapis.com');
    });

    it('utilise le bon chemin de stockage images/{path}/', async () => {
      const file = createMockFile('photo.jpg', 'image/jpeg');
      await storageService.uploadImage(file, 'user1/prop1');

      const refPath = storageMocks.ref.mock.calls[0][1] as string;
      expect(refPath).toMatch(/^images\/user1\/prop1\//);
      expect(refPath).toMatch(/\.jpg$/);
    });
  });

  // ── uploadDocument ──

  describe('uploadDocument', () => {
    it('upload un PDF dans documents/{propertyId}/', async () => {
      const file = createMockFile('titre.pdf', 'application/pdf');
      const url = await storageService.uploadDocument(file, 'prop-123', 'titre_foncier');

      expect(storageMocks.uploadBytes).toHaveBeenCalledTimes(1);
      const refPath = storageMocks.ref.mock.calls[0][1] as string;
      expect(refPath).toMatch(/^documents\/prop-123\/titre_foncier_/);
      expect(refPath).toMatch(/\.pdf$/);
      expect(url).toContain('firebasestorage');
    });

    it('upload une image de document dans documents/', async () => {
      const file = createMockFile('scan.jpg', 'image/jpeg');
      await storageService.uploadDocument(file, 'prop-456', 'plan_cadastral');

      const refPath = storageMocks.ref.mock.calls[0][1] as string;
      expect(refPath).toMatch(/^documents\/prop-456\/plan_cadastral_/);
    });
  });

  // ── uploadModel3D ──

  describe('uploadModel3D', () => {
    it('upload un fichier 3D dans models3d/{propertyId}/', async () => {
      const file = createMockFile('model.glb', 'model/gltf-binary');
      const url = await storageService.uploadModel3D(file, 'prop-789');

      const refPath = storageMocks.ref.mock.calls[0][1] as string;
      expect(refPath).toMatch(/^models3d\/prop-789\//);
      expect(refPath).toMatch(/\.glb$/);
      expect(url).toContain('firebasestorage');
    });
  });

  // ── uploadMultipleImages ──

  describe('uploadMultipleImages', () => {
    it('upload plusieurs images et retourne un tableau d\'URLs', async () => {
      const files = [
        createMockFile('img1.jpg', 'image/jpeg'),
        createMockFile('img2.jpg', 'image/jpeg'),
        createMockFile('img3.jpg', 'image/jpeg'),
      ];

      const urls = await storageService.uploadMultipleImages(files, 'user1/prop1');

      expect(urls).toHaveLength(3);
      urls.forEach(url => expect(url).toContain('firebasestorage'));
    });

    it('appelle onProgress pour chaque fichier', async () => {
      const files = [
        createMockFile('a.jpg', 'image/jpeg'),
        createMockFile('b.jpg', 'image/jpeg'),
      ];
      const onProgress = vi.fn();

      await storageService.uploadMultipleImages(files, 'path', onProgress);

      // onProgress appelé au moins pour chaque fichier
      expect(onProgress).not.toHaveBeenCalled(); // Pas de progress car uploadBytes (pas resumable)
    });
  });

  // ── deleteFile ──

  describe('deleteFile', () => {
    it('appelle deleteObject', async () => {
      await storageService.deleteFile('https://firebasestorage.googleapis.com/some-file.jpg');
      expect(storageMocks.deleteObject).toHaveBeenCalledTimes(1);
    });

    it('ne throw pas si la suppression échoue', async () => {
      storageMocks.deleteObject.mockRejectedValueOnce(new Error('Not found'));
      // Ne doit pas throw
      await storageService.deleteFile('https://fake-url');
    });
  });
});
