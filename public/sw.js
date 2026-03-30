const CACHE_VERSION = 'v3';
const STATIC_CACHE = `stamina-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `stamina-dynamic-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';
const ALLOWED_CROSS_ORIGIN_HOSTS = new Set([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
]);

// Static assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
];

// Routes to cache with network-first strategy
const NETWORK_FIRST_ROUTES = [
  '/dashboard',
  '/training',
  '/analytics',
  '/goals',
  '/settings',
  '/kegels',
  '/mental',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('stamina-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - handle requests with appropriate strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (except known font hosts)
  if (url.origin !== location.origin && !ALLOWED_CROSS_ORIGIN_HOSTS.has(url.hostname)) {
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle static assets (images, fonts, CSS, JS)
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Default: network first with cache fallback
  event.respondWith(networkFirstWithCache(request));
});

// Navigation request handler - network first, offline fallback
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline page
    return caches.match(OFFLINE_URL);
  }
}

// Static asset handler - cache first, network fallback
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Return cached version and update in background
    fetchAndCache(request);
    return cachedResponse;
  }
  return fetchAndCache(request);
}

// Network first with cache fallback
async function networkFirstWithCache(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Fetch and cache helper
async function fetchAndCache(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Check if URL is a static asset
function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(pathname) ||
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/icons/');
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'New notification from Stamina Timer',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/dashboard',
    },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Stamina Timer', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const destinationUrl = resolveAppUrl(event.notification.data?.url);
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          try {
            const clientOrigin = new URL(client.url).origin;
            if (clientOrigin === self.location.origin && 'focus' in client) {
              client.navigate(destinationUrl);
              return client.focus();
            }
          } catch {
            // Ignore malformed client URLs.
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(destinationUrl);
        }
      })
  );
});

// Background sync (for future offline data sync)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-sessions') {
    event.waitUntil(syncSessions());
  }
});

async function syncSessions() {
  // Placeholder for syncing offline session data
}

// Periodic background sync (for future use)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

async function updateContent() {
  // Placeholder for periodic content updates
}

function resolveAppUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl || '/dashboard', self.location.origin);
    if (parsed.origin !== self.location.origin) {
      return '/dashboard';
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '/dashboard';
  }
}
