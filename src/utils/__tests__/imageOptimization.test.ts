import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateThumbnail,
  formatFileSize,
  isImageFile,
  isVideoFile,
  getOptimalImageQuality,
  getOptimizedImageUrl
} from '../imageOptimization';

describe('imageOptimization', () => {
  describe('formatFileSize', () => {
    it('formate correctement les octets', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(5.5 * 1024 * 1024)).toBe('5.5 MB');
    });
  });

  describe('isImageFile & isVideoFile', () => {
    it('détecte correctement les types de fichiers', () => {
      const imgFile = { type: 'image/jpeg' } as File;
      const vidFile = { type: 'video/mp4' } as File;
      const otherFile = { type: 'application/pdf' } as File;

      expect(isImageFile(imgFile)).toBe(true);
      expect(isImageFile(vidFile)).toBe(false);
      expect(isVideoFile(vidFile)).toBe(true);
      expect(isVideoFile(imgFile)).toBe(false);
      expect(isImageFile(otherFile)).toBe(false);
    });
  });

  describe('getOptimizedImageUrl', () => {
    it('ajoute les paramètres de largeur si fournis', () => {
      const url = 'https://firebasestorage.googleapis.com/v0/b/homeci.appspot.com/o/img.jpg?alt=media';
      expect(getOptimizedImageUrl('', 800)).toBe('');
      expect(getOptimizedImageUrl(url)).toBe(url);
      const optimized = getOptimizedImageUrl(url, 800);
      expect(optimized).toContain('width=800');
      expect(optimized).toContain('quality=85');
    });
  });

  describe('getOptimalImageQuality', () => {
    it('retourne des valeurs cohérentes par défaut', () => {
      const quality = getOptimalImageQuality();
      expect(quality).toHaveProperty('maxWidth');
      expect(quality).toHaveProperty('quality');
    });
  });

  describe('Asynchronous browser-based functions', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      
      // Mock FileReader
      vi.stubGlobal('FileReader', vi.fn().mockImplementation(function(this: any) {
        this.readAsDataURL = vi.fn((_file: File) => {
          setTimeout(() => {
            if (this.onload) this.onload({ target: { result: 'data:image/jpeg;base64,mock' } });
          }, 0);
        });
      }));

      // Mock Image
      vi.stubGlobal('Image', vi.fn().mockImplementation(function(this: any) {
        this.onload = null;
        this.onerror = null;
        this.width = 2000;
        this.height = 1000;
        Object.defineProperty(this, 'src', {
          set(_val: string) {
            setTimeout(() => {
              if (this.onload) this.onload();
            }, 0);
          }
        });
      }));

      // Mock Canvas
      const mockCanvas = {
        getContext: vi.fn(() => ({
          drawImage: vi.fn(),
          filter: '',
        })),
        toBlob: vi.fn((cb) => cb(new Blob(['mock_blob'], { type: 'image/webp' }))),
        toDataURL: vi.fn(() => 'data:image/webp;base64,mock_thumb'),
        width: 0,
        height: 0,
      };
      vi.stubGlobal('document', {
        createElement: vi.fn((tag) => {
          if (tag === 'canvas') return mockCanvas;
          return {};
        }),
      });
    });

    it('generateThumbnail génère une miniature', async () => {
      const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      const thumb = await generateThumbnail(file);
      expect(thumb).toBe('data:image/webp;base64,mock_thumb');
    });
  });
});
