const CACHE_NAME = 'becoming-static-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './week.html',
  './journey.html',
  './journal.html',
  './pause.html',
  './thoughts.html',
  './settings.html',
  './styles.css',
  './script.js',
  './icon.svg',
  './manifest.json'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key !== CACHE_NAME;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

// Network-First strategy: always load your newest local edits, fall back to cache when offline
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(function (networkResponse) {
        return caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(function () {
        return caches.match(event.request).then(function (cachedResponse) {
          return cachedResponse || caches.match('./index.html');
        });
      })
  );
});