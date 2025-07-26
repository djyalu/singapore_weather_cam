// Service Worker for Singapore Weather Cam PWA
// Provides offline functionality and caching strategies

const CACHE_NAME = 'singapore-weather-cam-v1.1.0';
const STATIC_CACHE = 'static-v1.1.0';
const DATA_CACHE = 'data-v1.1.0';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/weather-icon.svg'
];

// Data endpoints to cache
const DATA_ENDPOINTS = [
  '/data/weather/latest.json',
  '/data/webcam/latest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install event');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache initial data
      caches.open(DATA_CACHE).then((cache) => {
        console.log('[ServiceWorker] Caching initial data');
        return cache.addAll(DATA_ENDPOINTS);
      })
    ]).then(() => {
      // Force activation of new service worker
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate event');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DATA_CACHE) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests with appropriate strategies
  if (isDataRequest(url)) {
    // Data requests: Network first, fallback to cache
    event.respondWith(networkFirstStrategy(request));
  } else if (isStaticAsset(url)) {
    // Static assets: Cache first, fallback to network
    event.respondWith(cacheFirstStrategy(request));
  } else if (isImageRequest(url)) {
    // Images: Cache first with extended TTL
    event.respondWith(cacheFirstStrategy(request, 24 * 60 * 60 * 1000)); // 24 hours
  } else {
    // Other requests: Network first
    event.respondWith(networkFirstStrategy(request));
  }
});

// Background sync for data updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'weather-data-sync') {
    event.waitUntil(syncWeatherData());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Weather update available',
    icon: '/android-chrome-192x192.png',
    badge: '/weather-icon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Weather',
        icon: '/weather-icon.svg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favicon-32x32.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Singapore Weather Cam', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions

function isDataRequest(url) {
  return url.pathname.includes('/data/') && url.pathname.endsWith('.json');
}

function isStaticAsset(url) {
  const staticExtensions = ['.html', '.css', '.js', '.png', '.jpg', '.svg', '.ico'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

function isImageRequest(url) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  return imageExtensions.some(ext => url.pathname.endsWith(ext));
}

// Network first strategy (for data and dynamic content)
async function networkFirstStrategy(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // Network failed, try cache
    return await getCachedResponse(request);
  } catch (error) {
    console.log('[ServiceWorker] Network request failed, trying cache:', error);
    return await getCachedResponse(request);
  }
}

// Cache first strategy (for static assets)
async function cacheFirstStrategy(request, maxAge = null) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Check if cached response is still fresh
      if (maxAge) {
        const cachedTime = new Date(cachedResponse.headers.get('date')).getTime();
        const now = Date.now();
        
        if (now - cachedTime > maxAge) {
          // Cache expired, try to update in background
          updateCache(request);
        }
      }
      
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Cache and network failed:', error);
    
    // Return offline fallback for HTML requests
    if (request.destination === 'document') {
      return caches.match('/index.html');
    }
    
    throw error;
  }
}

// Get cached response
async function getCachedResponse(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // No cache available, return offline fallback
  if (request.destination === 'document') {
    return caches.match('/index.html');
  }
  
  throw new Error('No cached response available');
}

// Update cache in background
function updateCache(request) {
  fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(STATIC_CACHE);
      cache.then(c => c.put(request, response));
    }
  }).catch(() => {
    // Ignore background update failures
  });
}

// Sync weather data
async function syncWeatherData() {
  try {
    const responses = await Promise.all([
      fetch('/data/weather/latest.json'),
      fetch('/data/webcam/latest.json')
    ]);
    
    const cache = await caches.open(DATA_CACHE);
    
    responses.forEach((response, index) => {
      if (response.ok) {
        const url = index === 0 ? '/data/weather/latest.json' : '/data/webcam/latest.json';
        cache.put(url, response.clone());
      }
    });
    
    console.log('[ServiceWorker] Background sync completed');
  } catch (error) {
    console.log('[ServiceWorker] Background sync failed:', error);
  }
}