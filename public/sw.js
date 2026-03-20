/// <reference lib="webworker" />

const CACHE_NAME = 'homeci-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo_homeci.jpg',
  '/favicon-192x192.png',
  '/favicon-512x512.png',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and Firebase/external API calls
  if (event.request.method !== 'GET') return;
  if (url.hostname.includes('firestore.googleapis.com')) return;
  if (url.hostname.includes('firebaseauth.googleapis.com')) return;
  if (url.hostname.includes('identitytoolkit.googleapis.com')) return;
  if (url.hostname.includes('securetoken.googleapis.com')) return;
  if (url.hostname.includes('firebasestorage.googleapis.com')) return;

  // Static assets: cache-first
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML pages: network-first with cache fallback
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
    );
  }
});

// ══════════════════════════════════════════════════════════════════════════
// FCM Push Notifications — Background message handling
// ══════════════════════════════════════════════════════════════════════════

// Réception d'un push en arrière-plan
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { notification: { title: 'HOMECI', body: event.data.text() } };
  }

  const notif = data.notification || {};
  const title = notif.title || 'HOMECI';
  const options = {
    body: notif.body || '',
    icon: '/favicon-192x192.png',
    badge: '/favicon-192x192.png',
    tag: data.data?.property_id || 'homeci-general',
    data: {
      url: data.data?.property_id ? `/?property=${data.data.property_id}` : '/',
      property_id: data.data?.property_id || null,
    },
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Voir' },
      { action: 'close', title: 'Fermer' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Clic sur une notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Si un onglet HOMECI est déjà ouvert, on le focus
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Sinon on ouvre un nouvel onglet
      return self.clients.openWindow(url);
    })
  );
});
