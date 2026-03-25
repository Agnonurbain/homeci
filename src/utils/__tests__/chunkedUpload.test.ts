import { describe, it, expect, vi } from 'vitest';
import { uploadLargeFile, calculateTotalUploadTime, formatUploadTime } from '../chunkedUpload';
import { storageService } from '../../services/storageService';

vi.mock('../../services/storageService', () => ({
  storageService: {
    uploadImage: vi.fn(() => Promise.resolve('https://mock.url/img.png')),
    uploadVideo: vi.fn(() => Promise.resolve('https://mock.url/vid.mp4')),
  },
}));

describe('chunkedUpload', () => {
  describe('calculateTotalUploadTime', () => {
    it('calcule correctement le temps d\'upload', () => {
      // 1MB file, 1Mbps speed = 8s
      const time = calculateTotalUploadTime(1024 * 1024, 1);
      expect(time).toBe(8);
    });
  });

  describe('formatUploadTime', () => {
    it('formate correctement le temps d\'upload', () => {
      expect(formatUploadTime(30)).toBe('30s');
      expect(formatUploadTime(120)).toBe('2min');
      expect(formatUploadTime(3660)).toBe('1h 1min');
    });
  });

  describe('uploadLargeFile', () => {
    it('appelle uploadImage pour les images', async () => {
      const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      const url = await uploadLargeFile(file, 'folder', 'test.jpg');
      expect(storageService.uploadImage).toHaveBeenCalled();
      expect(url).toBe('https://mock.url/img.png');
    });

    it('appelle uploadVideo pour les vidéos', async () => {
      const file = new File(['dummy'], 'test.mp4', { type: 'video/mp4' });
      const url = await uploadLargeFile(file, 'folder', 'test.mp4');
      expect(storageService.uploadVideo).toHaveBeenCalled();
      expect(url).toBe('https://mock.url/vid.mp4');
    });
  });
});
