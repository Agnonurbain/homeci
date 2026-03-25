import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  formatDuration, 
  estimateVideoSize, 
  shouldCompressVideo, 
  getOptimalVideoBitrate, 
  isVideoFile,
  getVideoDuration,
  getVideoResolution,
  generateVideoThumbnail
} from '../videoProcessing';

describe('videoProcessing', () => {
  describe('formatDuration', () => {
    it('formate correctement les secondes en temps lisible', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(60)).toBe('1:00');
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(3600)).toBe('1:00:00');
      expect(formatDuration(3665)).toBe('1:01:05');
    });
  });

  describe('estimateVideoSize', () => {
    it('estime la taille du fichier vidéo', () => {
      // 10s * 5Mbps = 50Mb = 6.25MB = 6,553,600 bytes
      const duration = 10;
      const bitrate = 5;
      const estimated = estimateVideoSize(duration, bitrate);
      expect(estimated).toBeGreaterThan(0);
      expect(estimated).toBe((10 * 5 * 1024 * 1024) / 8);
    });
  });

  describe('shouldCompressVideo', () => {
    it('détecte les vidéos trop grandes (>500MB)', () => {
      const smallFile = { size: 100 * 1024 * 1024 } as File;
      const largeFile = { size: 600 * 1024 * 1024 } as File;
      expect(shouldCompressVideo(smallFile)).toBe(false);
      expect(shouldCompressVideo(largeFile)).toBe(true);
    });
  });

  describe('getOptimalVideoBitrate', () => {
    it('retourne le bitrate optimal selon la résolution', () => {
      expect(getOptimalVideoBitrate(1920, 1080)).toBe('4000k');
      expect(getOptimalVideoBitrate(1280, 720)).toBe('2500k');
      expect(getOptimalVideoBitrate(640, 360)).toBe('1000k');
    });
  });

  describe('isVideoFile', () => {
    it('détecte correctement les fichiers vidéo', () => {
      expect(isVideoFile({ type: 'video/mp4' } as File)).toBe(true);
      expect(isVideoFile({ type: 'image/jpeg' } as File)).toBe(false);
    });
  });

  describe('Asynchronous browser-based functions', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      
      // Mock URL.createObjectURL/revokeObjectURL
      vi.stubGlobal('URL', {
        createObjectURL: vi.fn(() => 'blob:mock'),
        revokeObjectURL: vi.fn(),
      });

      // Mock Video Element
      const mockVideo = {
        set src(_val: string) {
          setTimeout(() => {
            if (this.onloadedmetadata) this.onloadedmetadata();
            setTimeout(() => {
              if (this.onseeked) this.onseeked();
            }, 0);
          }, 0);
        },
        onloadedmetadata: null as any,
        onseeked: null as any,
        onerror: null as any,
        duration: 120,
        videoWidth: 1280,
        videoHeight: 720,
        currentTime: 0,
        currentTimeSet: 0,
        set currentTimeValue(val: number) {
            this.currentTime = val;
        }
      };
      
      vi.stubGlobal('document', {
        createElement: vi.fn((tag) => {
          if (tag === 'video') return mockVideo;
          if (tag === 'canvas') return {
            getContext: () => ({
              drawImage: vi.fn(),
            }),
            toBlob: (cb: any) => cb(new Blob(['mock'], { type: 'image/webp' })),
            width: 0,
            height: 0,
          };
          return {};
        }),
      });
    });

    it('getVideoDuration récupère la durée de la vidéo', async () => {
      const file = new File(['dummy'], 'test.mp4', { type: 'video/mp4' });
      const duration = await getVideoDuration(file);
      expect(duration).toBe(120);
    });

    it('getVideoResolution récupère la résolution de la vidéo', async () => {
      const file = new File(['dummy'], 'test.mp4', { type: 'video/mp4' });
      const res = await getVideoResolution(file);
      expect(res).toEqual({ width: 1280, height: 720 });
    });

    it('generateVideoThumbnail génère une miniature de vidéo', async () => {
      const file = new File(['dummy'], 'test.mp4', { type: 'video/mp4' });
      const thumb = await generateVideoThumbnail(file);
      expect(thumb).toBe('blob:mock');
    });
  });
});
