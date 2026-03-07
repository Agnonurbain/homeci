/**
 * Fix les URLs Cloudinary de PDFs uploadés avec resource_type 'auto'.
 * Cloudinary stocke les PDFs comme 'image' mais ne peut pas les servir directement → 401.
 * Le flag fl_attachment force le téléchargement du PDF original.
 */
export function fixDocUrl(url: string | undefined): string {
  if (!url) return '';
  // PDFs stockés sous /image/upload/ → ajouter fl_attachment pour forcer le téléchargement
  if (url.endsWith('.pdf') && url.includes('/image/upload/') && !url.includes('fl_attachment')) {
    return url.replace('/image/upload/', '/image/upload/fl_attachment/');
  }
  // PDFs stockés sous /raw/upload/ → fonctionnent directement
  return url;
}
