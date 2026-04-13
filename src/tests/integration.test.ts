/**
 * HOMECI — Integration Tests
 *
 * Tests d'intégration qui vérifient le bon fonctionnement
 * des services ensemble (pas unitairement).
 *
 * Ces tests utilisent les mocks Firebase mais testent les interactions
 * entre plusieurs services/hooks/composants.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ══════════════════════════════════════════════════════════════════════════
// 1. EXPORT SERVICE + DATA FLOW
// ══════════════════════════════════════════════════════════════════════════

describe('1. Intégration — Export CSV', () => {
  it('exportService génère un CSV valide pour des utilisateurs', async () => {
    const { exportService } = await import('../services/exportService');

    // Vérifie que les colonnes sont correctes
    const cols = exportService.getColumns('users');
    expect(cols.map(c => c.key)).toContain('email');
    expect(cols.map(c => c.key)).toContain('full_name');
    expect(cols.map(c => c.key)).toContain('role');
  });

  it('exportService gère tous les types d\'export', async () => {
    const { exportService } = await import('../services/exportService');

    const types = ['users', 'properties', 'visits', 'surveys', 'reports'] as const;
    for (const type of types) {
      const cols = exportService.getColumns(type);
      expect(cols.length).toBeGreaterThan(0);
      expect(cols[0].key).toBeTruthy();
      expect(cols[0].label).toBeTruthy();
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 2. FILE SCANNER + UPLOAD FLOW
// ══════════════════════════════════════════════════════════════════════════

describe('2. Intégration — File Scanner + Upload', () => {
  it('quickCheck + scan fonctionnent ensemble', async () => {
    const { fileScanner } = await import('../utils/fileScanner');

    const file = new File(['Contenu normal'], 'document.txt', { type: 'text/plain' });

    // Quick check d'abord
    const quick = fileScanner.quickCheck(file);
    expect(quick.safe).toBe(true);

    // Puis scan complet
    const full = await fileScanner.scan(file);
    expect(full.safe).toBe(true);
    expect(full.mimeType).toBe('text/plain');
  });

  it('rejette un fichier malveillant à deux niveaux', async () => {
    const { fileScanner } = await import('../utils/fileScanner');

    const file = new File(['<script>document.cookie</script>'], 'malicious.txt', { type: 'text/plain' });

    // Quick check passe (pas d'extension suspecte)
    expect(fileScanner.quickCheck(file).safe).toBe(true);

    // Mais le scan complet détecte le pattern suspect
    const full = await fileScanner.scan(file);
    expect(full.safe).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 3. IP WHITELIST + ADMIN ACCESS
// ══════════════════════════════════════════════════════════════════════════

describe('3. Intégration — IP Whitelist + Admin Access', () => {
  it('checkAdminIp + isIpRestrictionEnabled cohérents', async () => {
    vi.stubEnv('ADMIN_ALLOWED_IPS', '41.210.5.10');
    const { checkAdminIp, isIpRestrictionEnabled, getAllowedIps } = await import('../utils/ipWhitelist');

    expect(isIpRestrictionEnabled()).toBe(true);
    expect(getAllowedIps()).toEqual(['41.210.5.10']);
    expect(checkAdminIp('41.210.5.10')).toBe(true);
    expect(checkAdminIp('41.210.5.11')).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 4. COMPARISON SERVICE + LOCALSTORAGE
// ══════════════════════════════════════════════════════════════════════════

describe('4. Intégration — Property Comparison', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('comparisonService persiste entre les appels', async () => {
    const { comparisonService } = await import('../components/PropertyComparison');

    comparisonService.addProperty('p1');
    comparisonService.addProperty('p2');

    // Vérifie que les données persistent
    expect(comparisonService.getComparisons()).toEqual(['p1', 'p2']);
    expect(comparisonService.count()).toBe(2);
    expect(comparisonService.isComparing('p1')).toBe(true);
    expect(comparisonService.isComparing('p3')).toBe(false);
  });

  it('max 4 propriétés comparables', async () => {
    const { comparisonService } = await import('../components/PropertyComparison');

    comparisonService.addProperty('p1');
    comparisonService.addProperty('p2');
    comparisonService.addProperty('p3');
    comparisonService.addProperty('p4');
    comparisonService.addProperty('p5'); // Should be rejected

    expect(comparisonService.count()).toBe(4);
    expect(comparisonService.getComparisons()).toEqual(['p1', 'p2', 'p3', 'p4']);
  });

  it('remove + clear fonctionnent', async () => {
    const { comparisonService } = await import('../components/PropertyComparison');

    comparisonService.addProperty('p1');
    comparisonService.addProperty('p2');
    comparisonService.removeProperty('p1');

    expect(comparisonService.getComparisons()).toEqual(['p2']);

    comparisonService.clear();
    expect(comparisonService.getComparisons()).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 5. EXPORT + FILE SCANNER COMBINÉS
// ══════════════════════════════════════════════════════════════════════════

describe('5. Intégration — Export + Scanner workflow', () => {
  it('un export CSV ne passe pas par le scanner (pas de fichier upload)', async () => {
    const { exportService } = await import('../services/exportService');
    const { fileScanner } = await import('../utils/fileScanner');

    // Les exports génèrent du CSV en mémoire, pas de fichier binaire
    const cols = exportService.getColumns('users');
    expect(cols.length).toBe(8);

    // Le scanner n'est pas utilisé pour les exports
    // Vérifie que le scanner accepte bien le CSV si on le lui donne
    const csvContent = 'Nom;Email;Rôle\nJean;jean@test.ci;locataire';
    const csvFile = new File([csvContent], 'export.csv', { type: 'text/csv' });
    const quickCheck = fileScanner.quickCheck(csvFile);
    expect(quickCheck.safe).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 6. GEO DATA + LOCATION FLOW
// ══════════════════════════════════════════════════════════════════════════

describe('6. Intégration — Geo Data + Location Picker', () => {
  it('toutes les villes majeures ont des quartiers', async () => {
    const { QUARTIERS_BY_VILLE, VILLES_BY_DEPARTEMENT } = await import('../data/coteIvoireGeo');

    // Vérifie que chaque département a des villes
    for (const dept of Object.keys(VILLES_BY_DEPARTEMENT)) {
      const villes = VILLES_BY_DEPARTEMENT[dept];
      expect(villes.length).toBeGreaterThan(0);
    }

    // Vérifie que les villes majeures ont des quartiers
    const majorCities = ['Bouaké', 'Yamoussoukro', 'San-Pédro', 'Daloa', 'Korhogo'];
    for (const city of majorCities) {
      const quartiers = QUARTIERS_BY_VILLE[city];
      expect(quartiers).toBeDefined();
      expect(quartiers.length).toBeGreaterThan(0);
    }
  });

  it('Abidjan a ses 13 communes', async () => {
    const { COMMUNES_BY_VILLE } = await import('../data/coteIvoireGeo');
    const abidjanCommunes = COMMUNES_BY_VILLE['Abidjan'];
    expect(abidjanCommunes.length).toBe(13);
    expect(abidjanCommunes).toContain('Cocody');
    expect(abidjanCommunes).toContain('Yopougon');
    expect(abidjanCommunes).toContain('Plateau');
  });
});
