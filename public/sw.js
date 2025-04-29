const CACHE_NAME = 'stamina-timer-v2';
const OFFLINE_URL = '/offline.html';

const urlsToCache = [
  '/',
  OFFLINE_URL,
  '/favicon.ico',
  '/manifest.json',
  '/static/styles/globals.css',
];

self.addEventListener('install', (event) => {
  console.log('SW Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW Caching app shell');
      return cache.addAll(urlsToCache);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('SW Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return cache.match(OFFLINE_URL);
      })
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response && urlsToCache.includes(new URL(event.request.url).pathname)) {
        return response;
      }

      return fetch(event.request).catch(async () => {
        const cachedResponse = await caches.match(event.request);
        return cachedResponse || caches.match(OFFLINE_URL);
      });
    })
  );
});