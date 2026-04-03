import { useState, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { propertyService } from '../services/propertyService';

export function usePropertyMedia(mode: 'create' | 'edit', initialImages: string[] = [], initialVideos: string[] = []) {
  // Common states
  const [error, setError] = useState<string | null>(null);

  // Status for UI
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);

  // For Edit mode
  const [existingImages, setExistingImages] = useState<string[]>(initialImages);
  const [existingVideos, setExistingVideos] = useState<string[]>(initialVideos);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;

    const currentTotal = mode === 'create' ? images.length : existingImages.length + images.length;
    if (currentTotal + files.length > 15) {
      setError('Maximum 15 photos autorisées');
      return;
    }

    setImages(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
    setError(null);
    e.target.value = '';
  }, [mode, images.length, existingImages.length]);

  const removeImage = useCallback((index: number, isExisting: boolean = false) => {
    if (isExisting) {
      setExistingImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setImages(prev => prev.filter((_, i) => i !== index));
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    }
  }, []);

  const handleVideoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('video/'));
    if (!files.length) return;

    const currentTotal = mode === 'create' ? videos.length : existingVideos.length + videos.length;
    if (currentTotal + files.length > 3) {
      setError('Maximum 3 vidéos autorisées');
      return;
    }

    const oversized = files.find(f => f.size > 100 * 1024 * 1024);
    if (oversized) {
      setError('Chaque vidéo doit faire moins de 100 Mo');
      return;
    }

    setVideos(prev => [...prev, ...files]);
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      setVideoPreviews(prev => [...prev, url]);
    });
    setError(null);
    e.target.value = '';
  }, [mode, videos.length, existingVideos.length]);

  const removeVideo = useCallback((index: number, isExisting: boolean = false) => {
    if (isExisting) {
      setExistingVideos(prev => prev.filter((_, i) => i !== index));
    } else {
      URL.revokeObjectURL(videoPreviews[index]);
      setVideos(prev => prev.filter((_, i) => i !== index));
      setVideoPreviews(prev => prev.filter((_, i) => i !== index));
    }
  }, [videoPreviews]);

  const uploadMedia = async (propertyId: string, userId: string) => {
    const propertyImages = [...existingImages];
    const propertyVideos = [...existingVideos];

    // Image Upload (Parallel with race for timeout protection)
    if (images.length > 0) {
      const uploadPromises = images.map(async (file) => {
        try {
          return await Promise.race([
            storageService.uploadImage(file, `properties/${userId}/${propertyId}`),
            new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), 45000)),
          ]);
        } catch (e) {
          console.warn('Image upload failed/timed out:', file.name);
          return null;
        }
      });

      const newUrls = (await Promise.all(uploadPromises)).filter((url): url is string => !!url);
      propertyImages.push(...newUrls);
      if (newUrls.length > 0) {
        await propertyService.updateProperty(propertyId, { images: propertyImages });
      }
    }

    // Video Upload (Parallel with race for timeout protection)
    if (videos.length > 0) {
      const videoPromises = videos.map(async (file) => {
        try {
          return await Promise.race([
            storageService.uploadVideo(file, `properties/${userId}/${propertyId}`),
            new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), 180000)),
          ]);
        } catch (e) {
          console.warn('Video upload failed/timed out:', file.name);
          return null;
        }
      });

      const newVideoUrls = (await Promise.all(videoPromises)).filter((url): url is string => !!url);
      propertyVideos.push(...newVideoUrls);
      if (newVideoUrls.length > 0) {
        await propertyService.updateProperty(propertyId, { videos: propertyVideos });
      }
    }

    return { images: propertyImages, videos: propertyVideos };
  };

  return {
    images, imagePreviews, handleImageChange, removeImage,
    videos, videoPreviews, handleVideoChange, removeVideo,
    existingImages, existingVideos,
    setExistingImages, setExistingVideos,
    error, setError,
    uploadMedia
  };
}
