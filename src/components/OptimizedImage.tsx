import { useState, useEffect, useRef } from 'react';
import { getCachedImage, cacheImage, getConnectionQuality } from '../utils/imageOptimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  thumbnail,
  width,
  height,
  priority = false,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [imageSrc, setImageSrc] = useState(thumbnail || '');
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      setImageSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority, src]);

  useEffect(() => {
    if (isInView && src) {
      const cached = getCachedImage(src);
      if (cached) {
        setImageSrc(cached);
        setIsLoaded(true);
        return;
      }

      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
        cacheImage(src, src);
      };
    }
  }, [isInView, src]);

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden bg-gray-200 ${className}`}
      style={{ width, height }}
    >
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          // fetchPriority removed - not a standard React img prop
          className={`w-full h-full object-cover transition-all duration-300 ${
            isLoaded && imageSrc === src
              ? 'opacity-100 scale-100'
              : 'opacity-70 scale-105 blur-sm'
          }`}
        />
      )}
      {!isLoaded && !imageSrc && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
