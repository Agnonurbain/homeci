/**
 * Fix les URLs Cloudinary de PDFs stockées avec /image/upload/ au lieu de /raw/upload/.
 * Cloudinary ne sert pas les PDFs via l'endpoint image → 401.
 */
export function fixDocUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.endsWith('.pdf') && url.includes('/image/upload/')) {
    return url.replace('/image/upload/', '/raw/upload/');
  }
  return url;
}
