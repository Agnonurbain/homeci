import { describe, it, expect } from 'vitest';
import { fixDocUrl } from '../fixDocUrl';

describe('fixDocUrl', () => {
  // ── Valeurs vides / nulles ──

  it('retourne une chaîne vide si url est undefined', () => {
    expect(fixDocUrl(undefined)).toBe('');
  });

  it('retourne une chaîne vide si url est vide', () => {
    expect(fixDocUrl('')).toBe('');
  });

  // ── URLs Firebase Storage (ne doivent pas être modifiées) ──

  it('ne modifie pas une URL Firebase Storage', () => {
    const url = 'https://firebasestorage.googleapis.com/v0/b/homeci-prod/o/documents%2Ftest.pdf?alt=media';
    expect(fixDocUrl(url)).toBe(url);
  });

  it('ne modifie pas une URL Firebase Storage même pour un PDF', () => {
    const url = 'https://firebasestorage.googleapis.com/v0/b/bucket/o/doc.pdf?alt=media';
    expect(fixDocUrl(url)).toBe(url);
  });

  // ── URLs Cloudinary legacy PDFs ──

  it('ajoute fl_attachment aux PDFs Cloudinary sous /image/upload/', () => {
    const url = 'https://res.cloudinary.com/daip1z5ej/image/upload/v123/homeci/documents/temp/titre.pdf';
    const expected = 'https://res.cloudinary.com/daip1z5ej/image/upload/fl_attachment/v123/homeci/documents/temp/titre.pdf';
    expect(fixDocUrl(url)).toBe(expected);
  });

  it('ne double pas fl_attachment si déjà présent', () => {
    const url = 'https://res.cloudinary.com/daip1z5ej/image/upload/fl_attachment/v123/doc.pdf';
    expect(fixDocUrl(url)).toBe(url);
  });

  // ── URLs Cloudinary images (ne doivent pas être modifiées) ──

  it('ne modifie pas une URL Cloudinary pour une image JPG', () => {
    const url = 'https://res.cloudinary.com/daip1z5ej/image/upload/v123/homeci/photo.jpg';
    expect(fixDocUrl(url)).toBe(url);
  });

  it('ne modifie pas une URL Cloudinary pour une image PNG', () => {
    const url = 'https://res.cloudinary.com/daip1z5ej/image/upload/v123/homeci/photo.png';
    expect(fixDocUrl(url)).toBe(url);
  });

  // ── URLs Cloudinary raw (ne doivent pas être modifiées) ──

  it('ne modifie pas une URL Cloudinary sous /raw/upload/', () => {
    const url = 'https://res.cloudinary.com/daip1z5ej/raw/upload/v123/doc.pdf';
    expect(fixDocUrl(url)).toBe(url);
  });

  // ── Autres URLs ──

  it('ne modifie pas une URL quelconque', () => {
    const url = 'https://example.com/document.pdf';
    expect(fixDocUrl(url)).toBe(url);
  });
});
