export const compressImage = async (
  file: File,
  maxWidth: number = 1600,
  maxHeight: number = 900,
  quality: number = 0.7
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const outputFormat = 'image/webp';
        const outputName = file.name.replace(/\.[^/.]+$/, '.webp');

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            const compressedFile = new File([blob], outputName, {
              type: outputFormat,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          outputFormat,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

export const generateThumbnail = async (
  file: File,
  maxSize: number = 150
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const aspectRatio = img.width / img.height;

        let width = maxSize;
        let height = maxSize / aspectRatio;

        if (height > maxSize) {
          height = maxSize;
          width = maxSize * aspectRatio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.filter = 'blur(20px)';
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/webp', 0.05));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

export const getOptimizedImageUrl = (url: string, width?: number): string => {
  if (!url) return '';

  if (width) {
    const urlObj = new URL(url);
    urlObj.searchParams.set('width', width.toString());
    urlObj.searchParams.set('quality', '85');
    return urlObj.toString();
  }

  return url;
};

export const isVideoFile = (file: File): boolean => {
  return file.type.startsWith('video/');
};

export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const getConnectionQuality = (): 'slow' | 'medium' | 'fast' => {
  if (!('connection' in navigator)) return 'medium';

  const connection = (navigator as any).connection;
  if (!connection) return 'medium';

  const effectiveType = connection.effectiveType;

  if (effectiveType === 'slow-2g' || effectiveType === '2g') {
    return 'slow';
  } else if (effectiveType === '3g') {
    return 'medium';
  } else {
    return 'fast';
  }
};

export const getOptimalImageQuality = (): {
  maxWidth: number;
  maxHeight: number;
  quality: number;
} => {
  const connectionQuality = getConnectionQuality();

  switch (connectionQuality) {
    case 'slow':
      return { maxWidth: 1200, maxHeight: 675, quality: 0.5 };
    case 'medium':
      return { maxWidth: 1600, maxHeight: 900, quality: 0.65 };
    case 'fast':
      return { maxWidth: 1920, maxHeight: 1080, quality: 0.75 };
    default:
      return { maxWidth: 1600, maxHeight: 900, quality: 0.7 };
  }
};

const imageCache = new Map<string, string>();

export const getCachedImage = (url: string): string | null => {
  return imageCache.get(url) || null;
};

export const cacheImage = (url: string, dataUrl: string): void => {
  if (imageCache.size > 50) {
    const firstKey = imageCache.keys().next().value;
    if (firstKey) imageCache.delete(firstKey);
  }
  imageCache.set(url, dataUrl);
};

export const clearImageCache = (): void => {
  imageCache.clear();
};
