/**
 * HOMECI — Tests Automatisés de Pré-Lancement
 *
 * Couvre les sections 1, 3, 8 (partiel), 9, 10, 11 de la checklist PDF.
 * Exécuter : npx vitest run src/tests/prelaunch.test.ts
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../..');

function readFile(path: string): string {
  return readFileSync(resolve(ROOT, path), 'utf-8');
}
function fileExists(path: string): boolean {
  return existsSync(resolve(ROOT, path));
}
function fileSize(path: string): number {
  return statSync(resolve(ROOT, path)).size;
}

// ══════════════════════════════════════════════════════════════════════════
// 1. VÉRIFICATIONS PRÉ-LANCEMENT — Fichiers & Configuration
// ══════════════════════════════════════════════════════════════════════════

describe('1. Pré-lancement — Fichiers & Config', () => {
  it('firebase.json existe et contient firestore + storage', () => {
    expect(fileExists('firebase.json')).toBe(true);
    const content = readFile('firebase.json');
    expect(content).toContain('firestore');
    expect(content).toContain('storage');
  });

  it('.firebaserc existe et pointe vers homeci-prod', () => {
    expect(fileExists('.firebaserc')).toBe(true);
    const content = readFile('.firebaserc');
    expect(content).toContain('homeci-prod');
  });

  it('firestore.rules existe et contient les règles critiques', () => {
    expect(fileExists('firestore.rules')).toBe(true);
    const rules = readFile('firestore.rules');
    // Auth checks
    expect(rules).toContain('isAuth()');
    expect(rules).toContain('isAdmin()');
    expect(rules).toContain('isOwner(uid)');
    // Collections critiques
    expect(rules).toContain('match /users/{uid}');
    expect(rules).toContain('match /properties/{propertyId}');
    expect(rules).toContain('match /visits/{visitId}');
    expect(rules).toContain('match /notifications/{notifId}');
    expect(rules).toContain('match /reports/{reportId}');
    expect(rules).toContain('match /surveys/{surveyId}');
    // Sous-collections
    expect(rules).toContain('match /favorites/{propertyId}');
    expect(rules).toContain('match /fcm_tokens/{tokenId}');
    // Sécurité notaire_codes
    expect(rules).toContain('notaire_codes');
    // Admin peut modifier reports
    expect(rules).toContain('allow update: if isAdmin()');
  });

  it('storage.rules existe et contient identity/', () => {
    expect(fileExists('storage.rules')).toBe(true);
    const rules = readFile('storage.rules');
    expect(rules).toContain('identity/{userId}');
  });

  it('vercel.json existe avec rewrites SPA + cache headers', () => {
    expect(fileExists('vercel.json')).toBe(true);
    const config = JSON.parse(readFile('vercel.json'));
    // SPA rewrite
    const rewrites = config.rewrites || [];
    expect(rewrites.some((r: any) => r.destination === '/index.html')).toBe(true);
    // Cache headers
    const headers = config.headers || [];
    expect(headers.length).toBeGreaterThan(1);
    // COOP header
    const coopHeader = headers.find((h: any) => h.source === '/(.*)');
    expect(coopHeader).toBeDefined();
  });

  it('Cloud Functions index.ts contient les 2 fonctions', () => {
    expect(fileExists('functions/src/index.ts')).toBe(true);
    const content = readFile('functions/src/index.ts');
    expect(content).toContain('autoResetPropertyStatus');
    expect(content).toContain('sendPushNotification');
    expect(content).toContain('onSchedule');
    expect(content).toContain('onDocumentCreated');
  });

  it('functions/package.json existe avec firebase-functions', () => {
    expect(fileExists('functions/package.json')).toBe(true);
    const pkg = JSON.parse(readFile('functions/package.json'));
    expect(pkg.dependencies['firebase-functions']).toBeDefined();
    expect(pkg.dependencies['firebase-admin']).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 2. FAVICONS & PWA
// ══════════════════════════════════════════════════════════════════════════

describe('2. Favicons & PWA', () => {
  const favicons = [
    'public/favicon.ico',
    'public/favicon-16x16.png',
    'public/favicon-32x32.png',
    'public/favicon-192x192.png',
    'public/favicon-512x512.png',
    'public/apple-touch-icon.png',
  ];

  favicons.forEach(f => {
    it(`${f} existe`, () => {
      expect(fileExists(f)).toBe(true);
    });
  });

  it('manifest.json est valide et complet', () => {
    expect(fileExists('public/manifest.json')).toBe(true);
    const manifest = JSON.parse(readFile('public/manifest.json'));
    expect(manifest.name).toContain('HOMECI');
    expect(manifest.short_name).toBe('HOMECI');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#0D1F12');
    expect(manifest.lang).toBe('fr');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
    // Vérifier chaque taille d'icône
    const sizes = manifest.icons.map((i: any) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  it('service worker existe avec cache + push handlers', () => {
    expect(fileExists('public/sw.js')).toBe(true);
    const sw = readFile('public/sw.js');
    expect(sw).toContain('CACHE_NAME');
    expect(sw).toContain("addEventListener('install'");
    expect(sw).toContain("addEventListener('activate'");
    expect(sw).toContain("addEventListener('fetch'");
    expect(sw).toContain("addEventListener('push'");
    expect(sw).toContain("addEventListener('notificationclick'");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 3. SEO — index.html
// ══════════════════════════════════════════════════════════════════════════

describe('3. SEO — index.html', () => {
  let html: string;

  it('index.html existe', () => {
    expect(fileExists('index.html')).toBe(true);
    html = readFile('index.html');
  });

  it('langue FR', () => {
    expect(html).toContain('lang="fr"');
  });

  it('viewport avec viewport-fit=cover', () => {
    expect(html).toContain('viewport-fit=cover');
  });

  it('meta description', () => {
    expect(html).toContain('name="description"');
    expect(html).toContain('HOMECI');
  });

  it('meta keywords', () => {
    expect(html).toContain('name="keywords"');
    expect(html).toContain('immobilier');
    expect(html).toContain("Côte d'Ivoire");
  });

  it('canonical URL', () => {
    expect(html).toContain('rel="canonical"');
  });

  it('Open Graph tags', () => {
    expect(html).toContain('og:title');
    expect(html).toContain('og:description');
    expect(html).toContain('og:image');
    expect(html).toContain('og:type');
    expect(html).toContain('og:locale');
  });

  it('Twitter Card tags', () => {
    expect(html).toContain('twitter:card');
    expect(html).toContain('twitter:title');
    expect(html).toContain('twitter:image');
  });

  it('JSON-LD structured data (RealEstateAgent)', () => {
    expect(html).toContain('application/ld+json');
    expect(html).toContain('RealEstateAgent');
    expect(html).toContain('"addressCountry": "CI"');
  });

  it('PWA meta tags', () => {
    expect(html).toContain('name="theme-color"');
    expect(html).toContain('apple-mobile-web-app-capable');
    expect(html).toContain('rel="manifest"');
  });

  it('Favicon links', () => {
    expect(html).toContain('favicon.ico');
    expect(html).toContain('apple-touch-icon');
    expect(html).toContain('favicon-32x32.png');
  });

  it('Service Worker registration', () => {
    expect(html).toContain("serviceWorker.register('/sw.js')");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 4. SEO — robots.txt & sitemap.xml
// ══════════════════════════════════════════════════════════════════════════

describe('4. SEO — robots.txt & sitemap.xml', () => {
  it('robots.txt autorise / et bloque /portail-securise', () => {
    expect(fileExists('public/robots.txt')).toBe(true);
    const robots = readFile('public/robots.txt');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Disallow: /portail-securise');
    expect(robots).toContain('Disallow: /admin');
    expect(robots).toContain('Sitemap:');
  });

  it('sitemap.xml existe et contient la page principale', () => {
    expect(fileExists('public/sitemap.xml')).toBe(true);
    const sitemap = readFile('public/sitemap.xml');
    expect(sitemap).toContain('<urlset');
    expect(sitemap).toContain('<loc>');
    expect(sitemap).toContain('<priority>1.0</priority>');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 5. LOGOS PAIEMENT
// ══════════════════════════════════════════════════════════════════════════

describe('5. Logos paiement SVG', () => {
  const logos = [
    'public/logos/orange.jpeg',
    'public/logos/mtn.jpeg',
    'public/logos/wave.jpeg',
    'public/logos/flooz.jpeg',
    'public/logos/djamo.jpeg',
  ];

  logos.forEach(f => {
    it(`${f} existe et est une image valide`, () => {
      expect(fileExists(f)).toBe(true);
      const size = fileSize(f);
      expect(size).toBeGreaterThan(1000); // Au moins 1KB
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 6. PERFORMANCE — Taille des assets
// ══════════════════════════════════════════════════════════════════════════

describe('6. Performance — Taille des assets', () => {

  it('chaque favicon < 300 KB', () => {
    ['favicon-192x192.png', 'favicon-512x512.png', 'apple-touch-icon.png'].forEach(f => {
      const size = fileSize(`public/${f}`);
      expect(size).toBeLessThan(300 * 1024);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 7. FIREBASE CONFIG
// ══════════════════════════════════════════════════════════════════════════

describe('7. Firebase config', () => {
  it('firebase.ts exporte auth, db, storage, analyticsPromise, messagingPromise', () => {
    const content = readFile('src/lib/firebase.ts');
    expect(content).toContain('export const auth');
    expect(content).toContain('export const db');
    expect(content).toContain('export const storage');
    expect(content).toContain('export const analyticsPromise');
    expect(content).toContain('export const messagingPromise');
  });

  it('firebase.ts contient le projectId (soit en dur, soit via env)', () => {
    const content = readFile('src/lib/firebase.ts');
    // Accepter soit l'ID de prod en dur, soit la variable d'env
    expect(content).toMatch(/projectId:\s*(['"]homeci-prod-72e4b['"]|import\.meta\.env\.VITE_FIREBASE_PROJECT_ID)/);
  });

  it('analyticsService.ts exporte 18+ méthodes', () => {
    const content = readFile('src/services/analyticsService.ts');
    const methods = ['login', 'signup', 'logout', 'pageView', 'search', 'viewProperty',
      'favoriteProperty', 'publishProperty', 'certifyProperty', 'decertifyProperty',
      'updatePropertyStatus', 'requestVisit', 'acceptVisit', 'completeVisit',
      'submitSurvey', 'submitReport', 'initiatePayment', 'completePayment'];
    methods.forEach(m => {
      expect(content).toContain(`${m}(`);
    });
  });

  it('pushNotificationService.ts existe et exporte pushService', () => {
    const content = readFile('src/services/pushNotificationService.ts');
    expect(content).toContain('export const pushService');
    expect(content).toContain('requestPermissionAndRegister');
    expect(content).toContain('onForegroundMessage');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 8. COMPOSANTS CRITIQUES — Existence et exports
// ══════════════════════════════════════════════════════════════════════════

describe('8. Composants critiques — Existence', () => {
  const criticalComponents = [
    { file: 'src/App.tsx', contains: ['ErrorBoundary', 'NotFoundPage', 'ProfileModal', 'pushService', 'Suspense', 'lazy'] },
    { file: 'src/components/Header.tsx', contains: ['onProfileClick', 'Settings', 'onLoginClick'] },
    { file: 'src/components/Footer.tsx', contains: ['/faq', 'Orange Money', 'Djamo'] },
    { file: 'src/components/ErrorBoundary.tsx', contains: ['componentDidCatch', 'getDerivedStateFromError'] },
    { file: 'src/components/NotFoundPage.tsx', contains: ['404', 'introuvable'] },
    { file: 'src/components/ProfileModal.tsx', contains: ['avatar', 'refreshProfile', 'phone'] },
    { file: 'src/components/FAQPage.tsx', contains: ['AccordionItem', 'contact@homeci'] },
    { file: 'src/components/Skeletons.tsx', contains: ['PropertyCardSkeleton', 'StatGridSkeleton', 'NotaireListSkeleton'] },
    { file: 'src/components/AdminReportsTab.tsx', contains: ['updateReportStatus', 'Traiter', 'Rejeter'] },
    { file: 'src/components/AdminSurveysTab.tsx', contains: ['getAllSurveys', 'StarRating', 'distribution'] },
    { file: 'src/components/AdminVisitsTab.tsx', contains: ['getAllVisits', 'BarChart', 'PieChart'] },
    { file: 'src/components/AdminUsersSearchTab.tsx', contains: ['handleSuspend', 'handleReactivate', 'searchQuery'] },
    { file: 'src/components/AdminDashboard.tsx', contains: ['AdminReportsTab', 'AdminSurveysTab', 'AdminVisitsTab', 'AdminUsersSearchTab'] },
    { file: 'src/components/AuthModal.tsx', contains: ['analyticsService', 'resetPassword'] },
    { file: 'src/components/TenantDashboard.tsx', contains: ['PropertyGridSkeleton', 'useTenantVisits', 'requestVisit'] },
    { file: 'src/components/OwnerAgentDashboard.tsx', contains: ['useOwnerProperties', 'useOwnerVisits', 'PropertiesTab', 'VisitRequestsTab'] },
    { file: 'src/components/NotaireDashboard.tsx', contains: ['NotaireListSkeleton', 'analyticsService', 'certifyProperty'] },
    { file: 'src/components/SatisfactionModal.tsx', contains: ['analyticsService', 'submitSurvey'] },
  ];

  criticalComponents.forEach(({ file, contains }) => {
    it(`${file.split('/').pop()} existe et contient les éléments critiques`, () => {
      expect(fileExists(file)).toBe(true);
      const content = readFile(file);
      contains.forEach(keyword => {
        expect(content).toContain(keyword);
      });
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 9. PALETTE CI — Zéro anciennes couleurs
// ══════════════════════════════════════════════════════════════════════════

describe('9. Palette CI — Aucune ancienne couleur', () => {
  const componentFiles = [
    'src/components/TenantDashboard.tsx',
    'src/components/OwnerAgentDashboard.tsx',
    'src/components/NotaireDashboard.tsx',
    'src/components/AdminDashboard.tsx',
    'src/components/Header.tsx',
    'src/components/Footer.tsx',
    'src/components/PropertyCard.tsx',
    'src/components/PropertyViewModal.tsx',
    'src/components/PublicPropertyList.tsx',
    'src/components/AuthModal.tsx',
    'src/components/Hero.tsx',
    'src/components/Features.tsx',
  ];

  componentFiles.forEach(file => {
    it(`${file.split('/').pop()} — pas de HColors.green (utiliser vertCI)`, () => {
      const content = readFile(file);
      // Regex: HColors.green suivi d'un non-mot (pas greenCI, pas green10)
      const matches = content.match(/HColors\.green\b(?!CI)/g);
      expect(matches).toBeNull();
    });

    it(`${file.split('/').pop()} — pas de HColors.terracotta (utiliser orangeCI)`, () => {
      const content = readFile(file);
      expect(content).not.toContain('HColors.terracotta');
    });
  });

  it('homeci-tokens.ts contient les tokens CI', () => {
    const tokens = readFile('src/styles/homeci-tokens.ts');
    expect(tokens).toContain("orangeCI");
    expect(tokens).toContain("vertCI");
    expect(tokens).toContain("'#FF6B00'");
    expect(tokens).toContain("'#009E49'");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 10. SERVICES — Méthodes requises
// ══════════════════════════════════════════════════════════════════════════

describe('10. Services — Méthodes requises', () => {
  it('reportService a getAllReports + updateReportStatus', () => {
    const content = readFile('src/services/reportService.ts');
    expect(content).toContain('getAllReports');
    expect(content).toContain('updateReportStatus');
    expect(content).toContain('submitReport');
    expect(content).toContain('hasAlreadyReported');
  });

  it('visitService a getAllVisits + hasActiveVisit', () => {
    const content = readFile('src/services/visitService.ts');
    expect(content).toContain('getAllVisits');
    expect(content).toContain('hasActiveVisit');
    expect(content).toContain('createVisitRequest');
    expect(content).toContain('updateVisitStatus');
    expect(content).toContain('proposeCounterDate');
  });

  it('surveyService a getAllSurveys', () => {
    const content = readFile('src/services/surveyService.ts');
    expect(content).toContain('getAllSurveys');
    expect(content).toContain('submitSurvey');
  });

  it('notificationService a createNotification + getNotifications', () => {
    const content = readFile('src/services/notificationService.ts');
    expect(content).toContain('createNotification');
    expect(content).toContain('getNotifications');
    expect(content).toContain('markAsRead');
    expect(content).toContain('markAllAsRead');
  });

  it('storageService a uploadImage + uploadIdentityDocument', () => {
    const content = readFile('src/services/storageService.ts');
    expect(content).toContain('uploadImage');
    expect(content).toContain('uploadIdentityDocument');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 11. SÉCURITÉ — Aucun doublon d'import
// ══════════════════════════════════════════════════════════════════════════

describe('11. Sécurité — Pas de doublons d\'import', () => {
  const files = [
    'src/components/TenantDashboard.tsx',
    'src/components/OwnerAgentDashboard.tsx',
    'src/components/NotaireDashboard.tsx',
    'src/components/PropertyViewModal.tsx',
    'src/components/AuthModal.tsx',
    'src/components/SatisfactionModal.tsx',
  ];

  files.forEach(file => {
    it(`${file.split('/').pop()} — pas de doublon analyticsService`, () => {
      const content = readFile(file);
      const matches = content.match(/import.*analyticsService.*from/g);
      if (matches) {
        expect(matches.length).toBeLessThanOrEqual(1);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 12. ROUTES — App.tsx
// ══════════════════════════════════════════════════════════════════════════

describe('12. Routes — App.tsx', () => {
  let content: string;

  it('App.tsx charge', () => {
    content = readFile('src/App.tsx');
  });

  it('routes connues incluent /, /portail-securise, /admin, /faq', () => {
    expect(content).toMatch(/path\s*=\s*["']\/["']/);
    expect(content).toMatch(/path\s*=\s*["']\/portail-securise["']/);
    expect(content).toMatch(/path\s*=\s*["']\/admin["']/);
    expect(content).toMatch(/path\s*=\s*["']\/faq["']/);
  });

  it('lazy loading des dashboards', () => {
    expect(content).toContain("lazy(() => import('./components/TenantDashboard'))");
    expect(content).toContain("lazy(() => import('./components/OwnerAgentDashboard'))");
    expect(content).toContain("lazy(() => import('./components/AdminDashboard'))");
    expect(content).toContain("lazy(() => import('./components/NotaireDashboard'))");
    expect(content).toContain("lazy(() => import('./components/FAQPage'))");
  });

  it('ErrorBoundary wraps l\'application', () => {
    expect(content).toContain('<ErrorBoundary>');
    expect(content).toContain('</ErrorBoundary>');
  });

  it('page 404 gérée', () => {
    expect(content).toMatch(/path\s*=\s*["']\*["']/);
    expect(content).toContain('<NotFoundPage');
  });

  it('push notifications initialisées', () => {
    expect(content).toContain('pushService.requestPermissionAndRegister');
    expect(content).toContain('pushService.onForegroundMessage');
  });

  it('profil modal intégré', () => {
    expect(content).toContain('showProfile');
    expect(content).toContain('<ProfileModal');
  });
});
