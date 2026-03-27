import { describe, it, expect } from 'vitest';
import { parseAdvancedSearch } from '../searchParser';

describe('parseAdvancedSearch', () => {
  it('retourne un objet vide (+ keywords) pour une requête vide', () => {
    const result = parseAdvancedSearch('');
    expect(result.keywords).toEqual([]);
    expect(result.propertyType).toBeUndefined();
    expect(result.transactionType).toBeUndefined();
  });

  // Transaction type
  it('détecte "location" comme transactionType', () => {
    expect(parseAdvancedSearch('louer un appartement').transactionType).toBe('location');
  });

  it('détecte "vente" comme transactionType', () => {
    expect(parseAdvancedSearch('maison à vendre').transactionType).toBe('vente');
  });

  it('détecte "achat" comme transactionType vente', () => {
    expect(parseAdvancedSearch('achat terrain').transactionType).toBe('vente');
  });

  // Property type
  it('détecte le type "villa"', () => {
    expect(parseAdvancedSearch('villa cocody').propertyType).toBe('villa');
  });

  it('détecte le type "appartement"', () => {
    expect(parseAdvancedSearch('appartement 3 pièces').propertyType).toBe('appartement');
  });

  it('détecte le type "terrain"', () => {
    expect(parseAdvancedSearch('terrain à vendre').propertyType).toBe('terrain');
  });

  // Bedrooms
  it('détecte le nombre de pièces (ex: "3 pièces")', () => {
    expect(parseAdvancedSearch('3 pièces cocody').exactBedrooms).toBe(3);
  });

  it('détecte le nombre de chambres (ex: "2 chambres")', () => {
    expect(parseAdvancedSearch('2 chambres').exactBedrooms).toBe(2);
  });

  // Stars
  it('détecte les étoiles pour hôtel', () => {
    expect(parseAdvancedSearch('hotel 5 etoiles').stars).toBe(5);
  });

  // Price operators
  it('détecte prix > valeur', () => {
    const result = parseAdvancedSearch('prix > 500000');
    expect(result.minPrice).toBe(500000);
  });

  it('détecte prix < valeur', () => {
    const result = parseAdvancedSearch('prix < 1000000');
    expect(result.maxPrice).toBe(1000000);
  });

  it('détecte prix = valeur', () => {
    const result = parseAdvancedSearch('prix = 250000');
    expect(result.exactPrice).toBe(250000);
  });

  // Bedroom operators
  it('détecte pieces > valeur', () => {
    const result = parseAdvancedSearch('pieces > 2');
    expect(result.minBedrooms).toBe(2);
  });

  it('détecte chambres < valeur', () => {
    const result = parseAdvancedSearch('chambres < 5');
    expect(result.maxBedrooms).toBe(5);
  });

  // Verified notaire
  it('détecte "vérifié" pour verifiedNotaire', () => {
    expect(parseAdvancedSearch('villa vérifiée').verifiedNotaire).toBe(true);
  });

  it('détecte "certifié" pour verifiedNotaire', () => {
    expect(parseAdvancedSearch('bien certifié').verifiedNotaire).toBe(true);
  });

  it('détecte "notaire" pour verifiedNotaire', () => {
    expect(parseAdvancedSearch('avec notaire').verifiedNotaire).toBe(true);
  });

  // Keywords via ~
  it('extrait les mots-clés après ~', () => {
    const result = parseAdvancedSearch('villa ~piscine jardin');
    expect(result.keywords).toContain('piscine');
    expect(result.keywords).toContain('jardin');
  });

  // Geo detection
  it('détecte une ville connue', () => {
    const result = parseAdvancedSearch('appartement à Abidjan');
    expect(result.city).toBeDefined();
  });

  // Combined query
  it('parse une requête combinée', () => {
    const result = parseAdvancedSearch('villa 4 pièces à vendre prix < 100000000');
    expect(result.propertyType).toBe('villa');
    expect(result.exactBedrooms).toBe(4);
    expect(result.transactionType).toBe('vente');
    expect(result.maxPrice).toBe(100000000);
  });
});
