const prefetchQueue: string[] = [];
const prefetchedImages = new Set<string>();
let isProcessing = false;

export const prefetchImage = (url: string): void => {
  if (prefetchedImages.has(url) || prefetchQueue.includes(url)) {
    return;
  }

  prefetchQueue.push(url);

  if (!isProcessing) {
    processQueue();
  }
};

export const prefetchImages = (urls: string[]): void => {
  urls.forEach((url) => prefetchImage(url));
};

const processQueue = async (): Promise<void> => {
  if (prefetchQueue.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const url = prefetchQueue.shift();

  if (!url) {
    processQueue();
    return;
  }

  try {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);

    prefetchedImages.add(url);

    setTimeout(() => {
      processQueue();
    }, 100);
  } catch (error) {
    console.error('Error prefetching image:', error);
    processQueue();
  }
};

export const clearPrefetchCache = (): void => {
  prefetchedImages.clear();
  prefetchQueue.length = 0;
};

export const isPrefetched = (url: string): boolean => {
  return prefetchedImages.has(url);
};
