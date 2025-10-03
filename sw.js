const CACHE = 'campus-drivers-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE = [
  '/', '/index.html',
  '/manifest.webmanifest',
  '/offline.html',
  '/logo.png', '/map.png', // ajoute tes assets statiques
  // ajoute tes CSS/JS/images si tu veux du precache
];

// Install: pre-cache
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first pour HTML, cache-first pour le reste
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const isHTML = request.headers.get('accept')?.includes('text/html');

  if (isHTML) {
    // Network first -> offline fallback
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then(r => r || caches.match(OFFLINE_URL)))
    );
  } else {
    // Cache first
    e.respondWith(
      caches.match(request).then((r) => r || fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(request, copy));
        return res;
      }))
    );
  }
});
