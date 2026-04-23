/* Service worker: cache-first offline support.
 * Bump CACHE_VERSION whenever you ship changes that should invalidate the cache. */
const CACHE_VERSION = 'cbwwn-v9';
const CORE = [
  './',
  './index.html',
  './admin.html',
  './admin.css',
  './admin.js',
  './config.js',
  './api.js',
  './achievements.js',
  './styles.css',
  './tile-art.js',
  './textures.js',
  './levels.js',
  './audio.js',
  './background.js',
  './game.js',
  './ui.js',
  './main.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './icons/favicon-16.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const path = new URL(req.url).pathname;
  /* Never cache the JSON API or the live admin-published config -- if
   * we cached config.json, the SW would keep serving the OLD admin
   * config even after a fresh push. Always go to network for these. */
  if (path.startsWith('/api/') || path === '/config.json') {
    return; /* let browser handle */
  }
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
