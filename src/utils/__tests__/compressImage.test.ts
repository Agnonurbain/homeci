import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compressImage, COMPRESS_PRESETS } from '../compressImage';

/** Crée un fichier fictif */
function createMockFile(name: string, sizeMB: number, type: string): File {
  const bytes = new Uint8Array(Math.round(sizeMB * 1024 * 1024));
  return new File([bytes], name, { type });
}

describe('compressImage', () => {
  // ── Fichiers non-images ──

  it('retourne le fichier tel quel si ce n\'est pas une image', async () => {
    const pdf = createMockFile('doc.pdf', 2, 'application/pdf');
    const result = await compressImage(pdf);
    expect(result).toBe(pdf);
    expect(result.name).toBe('doc.pdf');
  });

  // ── Fichiers déjà petits ──

  it('retourne le fichier tel quel si déjà < maxSizeMB', async () => {
    const small = createMockFile('photo.jpg', 0.5, 'image/jpeg');
    const result = await compressImage(small, { maxSizeMB: 1 });
    expect(result).toBe(small);
  });

  // ── Presets ──

  it('les presets sont définis correctement', () => {
    expect(COMPRESS_PRESETS.property.maxWidth).toBe(1920);
    expect(COMPRESS_PRESETS.property.quality).toBe(0.8);
    expect(COMPRESS_PRESETS.thumbnail.maxWidth).toBe(600);
    expect(COMPRESS_PRESETS.thumbnail.quality).toBe(0.7);
    expect(COMPRESS_PRESETS.avatar.maxWidth).toBe(400);
  });

  // Note: la compression réelle utilise canvas + Image qui ne fonctionnent pas en jsdom.
  // Ce test doit être exécuté dans un vrai navigateur (e2e).
  it.skip('compresse une grande image (nécessite un vrai navigateur)', async () => {
    // À tester en e2e avec Playwright ou Cypress
  });
});
