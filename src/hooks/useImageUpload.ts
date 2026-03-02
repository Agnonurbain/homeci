import { useState } from 'react';
import { storageService } from '../services/storageService';
import { compressImage, isVideoFile, isImageFile, getOptimalImageQuality } from '../utils/imageOptimization';
import { generateVideoThumbnail } from '../utils/videoProcessing';

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

export const useImageUpload = () => {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (
    file: File,
    folder: string,
    options?: {
      compress?: boolean;
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
    }
  ): Promise<string> => {
    const optimalSettings = getOptimalImageQuality();
    const {
      compress = true,
      maxWidth = optimalSettings.maxWidth,
      maxHeight = optimalSettings.maxHeight,
      quality = optimalSettings.quality,
    } = options || {};

    const uploadId = `${Date.now()}-${file.name}`;

    setUploads((prev) => {
      const newMap = new Map(prev);
      newMap.set(uploadId, {
        fileName: file.name,
        progress: 0,
        status: 'uploading',
      });
      return newMap;
    });

    setIsUploading(true);

    try {
      let fileToUpload = file;
      const isVideo = isVideoFile(file);

      if (compress && isImageFile(file)) {
        setUploads((prev) => {
          const newMap = new Map(prev);
          const current = newMap.get(uploadId);
          if (current) {
            current.progress = 10;
            newMap.set(uploadId, current);
          }
          return newMap;
        });

        fileToUpload = await compressImage(file, maxWidth, maxHeight, quality);
      }

      const onProgress = (p: { progress: number }) => {
        setUploads((prev) => {
          const newMap = new Map(prev);
          const current = newMap.get(uploadId);
          if (current) {
            current.progress = Math.min(Math.round(p.progress), 95);
            newMap.set(uploadId, current);
          }
          return newMap;
        });
      };

      let url: string;
      if (isVideo) {
        url = await storageService.uploadVideo(fileToUpload, folder, onProgress);
      } else {
        url = await storageService.uploadImage(fileToUpload, folder, onProgress);
      }

      setUploads((prev) => {
        const newMap = new Map(prev);
        newMap.set(uploadId, {
          fileName: file.name,
          progress: 100,
          status: 'completed',
          url,
        });
        return newMap;
      });

      return url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      setUploads((prev) => {
        const newMap = new Map(prev);
        newMap.set(uploadId, {
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: errorMessage,
        });
        return newMap;
      });

      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadMultiple = async (
    files: File[],
    folder: string,
    options?: {
      compress?: boolean;
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
    }
  ): Promise<string[]> => {
    const uploadPromises = files.map((file) => uploadFile(file, folder, options));
    return Promise.all(uploadPromises);
  };

  const clearUploads = () => {
    setUploads(new Map());
  };

  const removeUpload = (uploadId: string) => {
    setUploads((prev) => {
      const newMap = new Map(prev);
      newMap.delete(uploadId);
      return newMap;
    });
  };

  const generateVideoPreview = async (file: File): Promise<string> => {
    try {
      return await generateVideoThumbnail(file);
    } catch (error) {
      console.error('Failed to generate video thumbnail:', error);
      throw error;
    }
  };

  return {
    uploads: Array.from(uploads.entries()).map(([id, data]) => ({ id, ...data })),
    isUploading,
    uploadFile,
    uploadMultiple,
    clearUploads,
    removeUpload,
    generateVideoPreview,
  };
};
