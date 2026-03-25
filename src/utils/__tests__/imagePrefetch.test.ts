import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prefetchImage, prefetchImages, clearPrefetchCache, isPrefetched } from '../imagePrefetch';

describe('imagePrefetch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearPrefetchCache();
    
    // Mock document.createElement('link') and document.head.appendChild
    const mockLink = {
      rel: '',
      as: '',
      href: '',
    };
    
    vi.stubGlobal('document', {
      createElement: vi.fn((tag) => {
        if (tag === 'link') return mockLink;
        return {};
      }),
      head: {
        appendChild: vi.fn(),
      },
    });
    
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ajoute une image à la file et la marque comme préchargée', async () => {
    const url = 'https://example.com/image.jpg';
    prefetchImage(url);
    
    // Attendre que processQueue (async) s'exécute
    await vi.advanceTimersByTimeAsync(0);
    
    expect(isPrefetched(url)).toBe(true);
    expect(document.head.appendChild).toHaveBeenCalled();
  });

  it('ne précharge pas deux fois la même image', async () => {
    const url = 'https://example.com/image.jpg';
    prefetchImage(url);
    await vi.advanceTimersByTimeAsync(0);
    prefetchImage(url);
    await vi.advanceTimersByTimeAsync(0);
    
    expect(document.head.appendChild).toHaveBeenCalledTimes(1);
  });

  it('précharge plusieurs images à la suite', async () => {
    const urls = ['https://ex.com/1.jpg', 'https://ex.com/2.jpg'];
    prefetchImages(urls);
    
    // Attendre le premier traitement
    await vi.advanceTimersByTimeAsync(0);
    expect(isPrefetched(urls[0])).toBe(true);
    expect(document.head.appendChild).toHaveBeenCalledTimes(1);
    
    // Deuxième appel après le timeout de 100ms
    await vi.advanceTimersByTimeAsync(150);
    expect(isPrefetched(urls[1])).toBe(true);
    expect(document.head.appendChild).toHaveBeenCalledTimes(2);
  });

  it('vide le cache et la file', () => {
    prefetchImage('https://ex.com/1.jpg');
    clearPrefetchCache();
    expect(isPrefetched('https://ex.com/1.jpg')).toBe(false);
  });
});
