/**
 * Compression d'images côté client avant upload.
 * Réduit la taille des photos de ~80% tout en gardant une qualité suffisante pour un site immobilier.
 */

interface CompressOptions {
  maxWidth?: number;     // Largeur max (défaut: 1920px)
  maxHeight?: number;    // Hauteur max (défaut: 1080px)
  quality?: number;      // Qualité JPEG 0-1 (défaut: 0.8)
  maxSizeMB?: number;    // Taille max en Mo (défaut: 1)
}

const DEFAULTS: Required<CompressOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  maxSizeMB: 1,
};

/**
 * Compresse une image File → retourne un nouveau File compressé.
 * - Redimensionne si dépasse maxWidth/maxHeight (garde le ratio)
 * - Convertit en JPEG avec la qualité spécifiée
 * - Si le fichier est déjà plus petit que maxSizeMB, retourne tel quel
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const opts = { ...DEFAULTS, ...options };

  // Si ce n'est pas une image, retourner tel quel
  if (!file.type.startsWith('image/')) return file;

  // Si déjà assez petit, retourner tel quel
  if (file.size <= opts.maxSizeMB * 1024 * 1024) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculer les nouvelles dimensions (garder le ratio)
      let { width, height } = img;
      if (width > opts.maxWidth || height > opts.maxHeight) {
        const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Dessiner sur un canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas non supporté'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir en blob JPEG
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Compression échouée'));
            return;
          }
          // Créer un nouveau File avec le même nom mais extension .jpg
          const name = file.name.replace(/\.[^.]+$/, '.jpg');
          const compressed = new File([blob], name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          console.info(
            `[HOMECI] Image compressée: ${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB (${Math.round((1 - compressed.size / file.size) * 100)}% réduit)`
          );
          resolve(compressed);
        },
        'image/jpeg',
        opts.quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de charger l'image"));
    };

    img.src = url;
  });
}

/**
 * Compresse un lot d'images.
 */
export async function compressImages(
  files: File[],
  options: CompressOptions = {}
): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f, options)));
}

/**
 * Options prédéfinies pour HOMECI
 */
export const COMPRESS_PRESETS = {
  /** Photos de propriétés (listing) — bon équilibre qualité/taille */
  property: { maxWidth: 1920, maxHeight: 1080, quality: 0.8, maxSizeMB: 1 },
  /** Miniatures (cards, grilles) */
  thumbnail: { maxWidth: 600, maxHeight: 400, quality: 0.7, maxSizeMB: 0.3 },
  /** Avatar utilisateur */
  avatar: { maxWidth: 400, maxHeight: 400, quality: 0.75, maxSizeMB: 0.2 },
} as const;
