// Urban Ninja Service Worker
const CACHE_NAME = 'urban-ninja-v1.0.0';
const STATIC_CACHE = 'urban-ninja-static-v1.0.0';
const TILE_CACHE = 'urban-ninja-tiles-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  // External assets (CDNs)
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css',
  'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== TILE_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Fetch event - implement cache strategies
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Handle map tiles (OpenStreetMap)
  if (isMapTile(url)) {
    event.respondWith(cacheFirstTile(event.request));
    return;
  }

  // Handle static assets (CSS, JS, images)
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Default: network first with cache fallback
  event.respondWith(networkFirst(event.request));
});

// Check if URL is a map tile (OpenStreetMap)
function isMapTile(url) {
  return url.hostname.includes('tile.openstreetmap.org') ||
         url.hostname.includes('openstreetmap.org') ||
         url.pathname.endsWith('.png') && url.pathname.includes('/tile/');
}

// Check if URL is a static asset
function isStaticAsset(url) {
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
         url.pathname === '/' ||
         url.pathname === '/index.html' ||
         url.pathname === '/manifest.json';
}

// Cache-first strategy for tiles (prioritize cached tiles for offline use)
async function cacheFirstTile(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(TILE_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Tile cache-first failed, trying cache-only:', error);
    return caches.match(request);
  }
}

// Cache-first strategy for static assets
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Static cache-first failed:', error);
    // For static assets, return cached version if available
    return caches.match(request);
  }
}

// Network-first strategy with cache fallback
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network request failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Offline fallback - return cached index.html for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }

    // Return offline response
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Background sync for when connection is restored
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('Service Worker: Performing background sync');
  // Could implement sync logic here for routes, etc.
}

// Message handling for communication with main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_MAP_TILES') {
    // Handle manual tile caching requests from app
    cacheMapTiles(event.data.tiles);
  }
});

// Manual tile caching function
async function cacheMapTiles(tiles) {
  if (!tiles || !Array.isArray(tiles)) return;

  const cache = await caches.open(TILE_CACHE);
  const cachePromises = tiles.map(tileUrl => {
    return fetch(tileUrl)
      .then(response => {
        if (response.ok) {
          return cache.put(tileUrl, response);
        }
      })
      .catch(error => {
        console.log('Failed to cache tile:', tileUrl, error);
      });
  });

  await Promise.allSettled(cachePromises);
  console.log('Service Worker: Cached', tiles.length, 'map tiles');
}
