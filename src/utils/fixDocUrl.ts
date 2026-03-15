/**
 * Fix les URLs de documents.
 * - URLs Firebase Storage : fonctionnent directement, pas de fix nécessaire
 * - URLs Cloudinary legacy : ajoute fl_attachment pour les PDFs
 */
export function fixDocUrl(url: string | undefined): string {
  if (!url) return '';
  // Firebase Storage URLs → OK directement
  if (url.includes('firebasestorage.googleapis.com')) return url;
  // Cloudinary legacy : PDFs sous /image/upload/ → ajouter fl_attachment
  if (url.includes('cloudinary.com') && url.endsWith('.pdf') && url.includes('/image/upload/') && !url.includes('fl_attachment')) {
    return url.replace('/image/upload/', '/image/upload/fl_attachment/');
  }
  return url;
}
