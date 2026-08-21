const CACHE_PREFIX = 'angel-midia-play-shell';
const CACHE_NAME = `${CACHE_PREFIX}-20260821-1`;
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './src/styles.css',
  './src/responsive.css',
  './src/app.js',
  './src/sound.js',
  './src/apps.js',
  './src/release.js',
  './release.json',
  './src/orchestration.js',
  './src/api.js',
  './assets/icon-192.svg',
  './assets/icon-512.svg',
  './assets/icon-maskable-512.svg',
  './assets/sounds/success.ogg',
  './assets/sounds/alert.ogg',
  './assets/sounds/error.ogg',
  './assets/sounds/start.ogg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)),
  )));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.url.includes('/api/')) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    try {
      const response = await fetch(request);
      if (response.ok && ['document', 'script', 'style', 'manifest', 'image'].includes(request.destination)) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      return cached || (request.mode === 'navigate' ? caches.match('./index.html') : Response.error());
    }
  })());
});
