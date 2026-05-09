#!/usr/bin/env node
/**
 * HOMECI — Test de charge simple
 *
 * Teste les endpoints critiques sous charge concurrente :
 *   - Page d'accueil (SPA HTML)
 *   - Assets statiques
 *   - Temps de réponse sous N requêtes simultanées
 *
 * Usage :
 *   node scripts/load-test.js [url] [concurrency] [total]
 *
 * Exemples :
 *   node scripts/load-test.js                                    # défaut: homeci.vercel.app, 20 concurrents, 200 requêtes
 *   node scripts/load-test.js https://homeci.vercel.app 50 500   # 50 concurrents, 500 requêtes
 */

const BASE_URL = process.argv[2] || 'https://homeci.vercel.app';
const CONCURRENCY = parseInt(process.argv[3] || '20', 10);
const TOTAL_REQUESTS = parseInt(process.argv[4] || '200', 10);

const ENDPOINTS = [
  { path: '/', name: 'Page accueil (SPA)' },
  { path: '/manifest.json', name: 'Manifest PWA' },
  { path: '/robots.txt', name: 'robots.txt' },
  { path: '/favicon.ico', name: 'Favicon' },
];

async function fetchWithTiming(url) {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'HOMECI-LoadTest/1.0' },
    });
    const elapsed = performance.now() - start;
    return { status: res.status, elapsed, ok: res.ok, error: null };
  } catch (err) {
    const elapsed = performance.now() - start;
    return { status: 0, elapsed, ok: false, error: err.message };
  }
}

async function runBatch(url, name, concurrency, total) {
  const results = [];
  let completed = 0;

  for (let i = 0; i < total; i += concurrency) {
    const batchSize = Math.min(concurrency, total - i);
    const batch = Array.from({ length: batchSize }, () => fetchWithTiming(url));
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
    completed += batchSize;
    process.stdout.write(`\r  ${name}: ${completed}/${total}`);
  }
  process.stdout.write('\n');
  return results;
}

function analyzeResults(results) {
  const ok = results.filter(r => r.ok);
  const errors = results.filter(r => !r.ok);
  const times = results.map(r => r.elapsed).sort((a, b) => a - b);

  return {
    total: results.length,
    success: ok.length,
    errors: errors.length,
    errorRate: ((errors.length / results.length) * 100).toFixed(1) + '%',
    min: times[0]?.toFixed(0) + 'ms',
    max: times[times.length - 1]?.toFixed(0) + 'ms',
    avg: (times.reduce((s, t) => s + t, 0) / times.length).toFixed(0) + 'ms',
    p50: times[Math.floor(times.length * 0.5)]?.toFixed(0) + 'ms',
    p95: times[Math.floor(times.length * 0.95)]?.toFixed(0) + 'ms',
    p99: times[Math.floor(times.length * 0.99)]?.toFixed(0) + 'ms',
  };
}

(async () => {
  console.log('=== HOMECI — Test de charge ===');
  console.log(`URL:          ${BASE_URL}`);
  console.log(`Concurrence:  ${CONCURRENCY}`);
  console.log(`Total:        ${TOTAL_REQUESTS} requêtes par endpoint`);
  console.log(`Endpoints:    ${ENDPOINTS.length}`);
  console.log('');

  const allResults = [];

  for (const endpoint of ENDPOINTS) {
    const url = BASE_URL + endpoint.path;
    const results = await runBatch(url, endpoint.name, CONCURRENCY, TOTAL_REQUESTS);
    const stats = analyzeResults(results);

    allResults.push({ name: endpoint.name, ...stats });
  }

  console.log('\n=== Résultats ===\n');
  console.log(
    '| Endpoint'.padEnd(30) +
    '| Succès'.padEnd(10) +
    '| Erreurs'.padEnd(10) +
    '| Avg'.padEnd(10) +
    '| P50'.padEnd(10) +
    '| P95'.padEnd(10) +
    '| P99'.padEnd(10) + '|'
  );
  console.log('|' + '-'.repeat(29) + '|' + ('-'.repeat(9) + '|').repeat(6));

  for (const r of allResults) {
    console.log(
      `| ${r.name}`.padEnd(30) +
      `| ${r.success}/${r.total}`.padEnd(10) +
      `| ${r.errorRate}`.padEnd(10) +
      `| ${r.avg}`.padEnd(10) +
      `| ${r.p50}`.padEnd(10) +
      `| ${r.p95}`.padEnd(10) +
      `| ${r.p99}`.padEnd(10) + '|'
    );
  }

  const totalErrors = allResults.reduce((s, r) => s + r.errors, 0);
  console.log(`\n${totalErrors === 0 ? 'Tous les tests ont réussi !' : `${totalErrors} erreurs détectées.`}`);

  process.exit(totalErrors > 0 ? 1 : 0);
})();
