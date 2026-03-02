import { storageService } from '../services/storageService';

export interface ChunkedUploadProgress {
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  currentChunk: number;
  totalChunks: number;
}

export interface ChunkedUploadOptions {
  onProgress?: (progress: ChunkedUploadProgress) => void;
  chunkSize?: number;
}

export const uploadLargeFile = async (
  file: File,
  folder: string,
  fileName: string,
  options?: ChunkedUploadOptions
): Promise<string> => {
  const { onProgress } = options || {};

  const isVideo = file.type.startsWith('video/');

  const progressCallback = onProgress
    ? (p: { progress: number; bytesTransferred: number; totalBytes: number }) => {
        onProgress({
          uploadedBytes: p.bytesTransferred,
          totalBytes: p.totalBytes,
          percentage: Math.round(p.progress),
          currentChunk: 1,
          totalChunks: 1,
        });
      }
    : undefined;

  if (isVideo) {
    return storageService.uploadVideo(file, folder, progressCallback);
  }
  return storageService.uploadImage(file, folder, progressCallback);
};

export const uploadMultipleLargeFiles = async (
  files: File[],
  folder: string,
  options?: ChunkedUploadOptions & {
    onFileComplete?: (fileName: string, url: string, index: number) => void;
  }
): Promise<string[]> => {
  const { onFileComplete, ...uploadOptions } = options || {};
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const url = await uploadLargeFile(file, folder, file.name, uploadOptions);
    urls.push(url);

    if (onFileComplete) {
      onFileComplete(file.name, url, i);
    }
  }

  return urls;
};

export const calculateTotalUploadTime = (
  fileSizeBytes: number,
  uploadSpeedMbps: number
): number => {
  const uploadSpeedBytesPerSecond = (uploadSpeedMbps * 1024 * 1024) / 8;
  return fileSizeBytes / uploadSpeedBytesPerSecond;
};

export const formatUploadTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.ceil(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}min`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.ceil((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  }
};
