// Service Worker for Singapore Weather Cam PWA
// Provides offline functionality and caching strategies

const CACHE_NAME = 'singapore-weather-cam-v1.2.0';
const STATIC_CACHE = 'static-v1.2.0';
const DATA_CACHE = 'data-v1.2.0';

// Get base path for GitHub Pages deployment
const BASE_PATH = '/singapore_weather_cam';

// Static assets to cache
const STATIC_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/favicon.ico`,
  `${BASE_PATH}/android-chrome-192x192.png`,
  `${BASE_PATH}/android-chrome-512x512.png`,
  `${BASE_PATH}/weather-icon.svg`
];

// Data endpoints to cache
const DATA_ENDPOINTS = [
  `${BASE_PATH}/data/weather/latest.json`,
  `${BASE_PATH}/data/webcam/latest.json`
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

  // Filter out unsupported schemes and browser extension requests
  if (!isCacheableRequest(request, url)) {
    // Let browser handle extension requests and other unsupported schemes
    return;
  }

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
      clients.openWindow(`${BASE_PATH}/`)
    );
  }
});

// Helper functions

function isCacheableRequest(request, url) {
  // Filter out browser extension requests and unsupported schemes
  const unsupportedSchemes = [
    'chrome-extension:',
    'moz-extension:',
    'safari-extension:',
    'edge-extension:',
    'extension:',
    'chrome-search:',
    'chrome-devtools:',
    'devtools:',
    'about:',
    'moz:',
    'resource:',
    'blob:',
    'data:'
  ];

  // Check if request uses an unsupported scheme
  if (unsupportedSchemes.some(scheme => url.protocol.startsWith(scheme))) {
    return false;
  }

  // Only cache HTTP/HTTPS requests
  if (!url.protocol.startsWith('http')) {
    return false;
  }

  // Only cache GET requests (safe to cache)
  if (request.method !== 'GET') {
    return false;
  }

  // Filter out requests that look like browser extension injected content
  if (url.pathname.includes('injected') || 
      url.pathname.includes('content.js') || 
      url.pathname.includes('inpage.js') ||
      url.hostname.includes('extension')) {
    return false;
  }

  return true;
}

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
      try {
        const cache = await caches.open(DATA_CACHE);
        await cache.put(request, networkResponse.clone());
      } catch (cacheError) {
        console.log('[ServiceWorker] Failed to cache response:', cacheError);
        // Continue serving the response even if caching fails
      }
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
      try {
        const cache = await caches.open(STATIC_CACHE);
        await cache.put(request, networkResponse.clone());
      } catch (cacheError) {
        console.log('[ServiceWorker] Failed to cache static asset:', cacheError);
        // Continue serving the response even if caching fails
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Cache and network failed:', error);
    
    // Return offline fallback for HTML requests
    if (request.destination === 'document') {
      return caches.match(`${BASE_PATH}/index.html`);
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
    return caches.match(`${BASE_PATH}/index.html`);
  }
  
  throw new Error('No cached response available');
}

// Update cache in background
function updateCache(request) {
  fetch(request).then((response) => {
    if (response.ok) {
      caches.open(STATIC_CACHE).then(cache => {
        cache.put(request, response).catch(cacheError => {
          console.log('[ServiceWorker] Background cache update failed:', cacheError);
        });
      });
    }
  }).catch(() => {
    // Ignore background update failures
  });
}

// Sync weather data
async function syncWeatherData() {
  try {
    const responses = await Promise.all([
      fetch(`${BASE_PATH}/data/weather/latest.json`),
      fetch(`${BASE_PATH}/data/webcam/latest.json`)
    ]);
    
    const cache = await caches.open(DATA_CACHE);
    
    responses.forEach((response, index) => {
      if (response.ok) {
        const url = index === 0 ? `${BASE_PATH}/data/weather/latest.json` : `${BASE_PATH}/data/webcam/latest.json`;
        cache.put(url, response.clone());
      }
    });
    
    console.log('[ServiceWorker] Background sync completed');
  } catch (error) {
    console.log('[ServiceWorker] Background sync failed:', error);
  }
}