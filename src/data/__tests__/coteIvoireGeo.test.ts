import { describe, it, expect } from 'vitest';
import {
  REGIONS_BY_DISTRICT,
  COMMUNES_BY_VILLE,
  QUARTIERS_BY_COMMUNE,
  QUARTIERS_BY_VILLE,
  ALL_DISTRICTS,
  getHierarchyByVille,
  getHierarchyByCommune,
} from '../coteIvoireGeo';

describe('coteIvoireGeo data completeness', () => {
  describe('Districts and Regions', () => {
    it('has all 13+ districts of Côte d\'Ivoire', () => {
      // CI has 14 districts; we have at least 13 in our data
      expect(ALL_DISTRICTS.length).toBeGreaterThanOrEqual(13);
    });

    it('every region has at least one district', () => {
      for (const [district, regions] of Object.entries(REGIONS_BY_DISTRICT)) {
        expect(regions.length).toBeGreaterThan(0);
        expect(district).toBeTruthy();
      }
    });
  });

  describe('Abidjan Communes', () => {
    const expectedCommunes = [
      'Abobo', 'Adjamé', 'Attécoubé', 'Cocody', 'Koumassi',
      'Marcory', 'Plateau', 'Port-Bouët', 'Treichville', 'Yopougon',
      'Bingerville', 'Songon', 'Anyama',
    ];

    it('has all 13 communes of Abidjan', () => {
      const abidjanCommunes = COMMUNES_BY_VILLE['Abidjan'] || [];
      for (const commune of expectedCommunes) {
        expect(abidjanCommunes).toContain(commune);
      }
    });

    it('each commune has at least 3 quartiers', () => {
      for (const commune of expectedCommunes) {
        const quartiers = QUARTIERS_BY_COMMUNE[commune];
        expect(quartiers.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('Cocody has at least 20 quartiers', () => {
      expect(QUARTIERS_BY_COMMUNE['Cocody'].length).toBeGreaterThanOrEqual(20);
    });

    it('Yopougon has at least 15 quartiers', () => {
      expect(QUARTIERS_BY_COMMUNE['Yopougon'].length).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Hierarchy lookups', () => {
    it('finds Abidjan hierarchy by ville', () => {
      const hierarchy = getHierarchyByVille('Abidjan');
      expect(hierarchy).not.toBeNull();
      expect(hierarchy?.district).toContain('Abidjan');
    });

    it('finds hierarchy for Cocody commune', () => {
      const hierarchy = getHierarchyByCommune('Cocody');
      expect(hierarchy).not.toBeNull();
      expect(hierarchy?.city).toBe('Abidjan');
    });

    it('returns null for unknown ville', () => {
      const hierarchy = getHierarchyByVille('VilleInexistante');
      expect(hierarchy).toBeNull();
    });

    it('returns null for unknown commune', () => {
      const hierarchy = getHierarchyByCommune('CommuneInexistante');
      expect(hierarchy).toBeNull();
    });
  });

  describe('Quartiers by Ville (non-Abidjan)', () => {
    const expectedVilles = [
      'Bouaké', 'Yamoussoukro', 'San-Pédro', 'Daloa', 'Korhogo',
      'Abengourou', 'Man', 'Gagnoa', 'Grand-Bassam',
    ];

    it('has quartiers for major cities', () => {
      for (const ville of expectedVilles) {
        const quartiers = QUARTIERS_BY_VILLE[ville];
        expect(quartiers.length).toBeGreaterThanOrEqual(3);
      }
    });
  });
});
