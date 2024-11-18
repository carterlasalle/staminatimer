const CACHE_NAME = 'stamina-timer-v1'
const OFFLINE_URL = '/offline.html'

const urlsToCache = [
  '/',
  '/offline.html',
  '/favicon.ico',
  '/manifest.json',
  '/static/styles/globals.css',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL)
      })
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    })
  )
}) 