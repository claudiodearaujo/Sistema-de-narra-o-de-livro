/**
 * LIVRIA Service Worker
 * Provides offline support, caching strategies, and push notifications
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `livrya-cache-${CACHE_VERSION}`;

// Files to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Static assets - cache first
  STATIC: /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/,
  // API calls - network first
  API: /\/api\//,
  // HTML pages - network first with fallback
  PAGE: /\.html$/,
};

// Install event - precache assets
self.addEventListener('install', function(event) {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Precaching assets...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(function() {
        console.log('[SW] Skip waiting...');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function(name) {
              return name !== CACHE_NAME;
            })
            .map(function(name) {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(function() {
        console.log('[SW] Claiming clients...');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Determine strategy based on request type
  if (CACHE_STRATEGIES.API.test(url.pathname)) {
    // Network first for API calls
    event.respondWith(networkFirst(event.request));
  } else if (CACHE_STRATEGIES.STATIC.test(url.pathname)) {
    // Cache first for static assets
    event.respondWith(cacheFirst(event.request));
  } else if (event.request.mode === 'navigate') {
    // Network first with offline fallback for navigation
    event.respondWith(navigationHandler(event.request));
  } else {
    // Stale while revalidate for everything else
    event.respondWith(staleWhileRevalidate(event.request));
  }
});

// Cache first strategy
function cacheFirst(request) {
  return caches.match(request)
    .then(function(cached) {
      if (cached) {
        return cached;
      }
      return fetch(request)
        .then(function(response) {
          return cacheResponse(request, response);
        });
    });
}

// Network first strategy
function networkFirst(request) {
  return fetch(request)
    .then(function(response) {
      return cacheResponse(request, response);
    })
    .catch(function() {
      return caches.match(request);
    });
}

// Stale while revalidate strategy
function staleWhileRevalidate(request) {
  return caches.match(request)
    .then(function(cached) {
      var fetchPromise = fetch(request)
        .then(function(response) {
          return cacheResponse(request, response);
        })
        .catch(function() {
          // Network failed, return cached if available
        });
      
      // Return cached response immediately, update in background
      return cached || fetchPromise;
    });
}

// Navigation handler with offline fallback
function navigationHandler(request) {
  return fetch(request)
    .then(function(response) {
      return cacheResponse(request, response);
    })
    .catch(function() {
      return caches.match('/offline.html');
    });
}

// Cache a response
function cacheResponse(request, response) {
  // Don't cache non-2xx responses
  if (!response || response.status !== 200 || response.type !== 'basic') {
    return response;
  }
  
  var responseToCache = response.clone();
  
  caches.open(CACHE_NAME)
    .then(function(cache) {
      cache.put(request, responseToCache);
    });
  
  return response;
}

// Push notification handler
self.addEventListener('push', function(event) {
  var data = { title: 'LIVRIA', body: 'Nova notificação' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  var options = {
    body: data.body || 'Nova notificação',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-72x72.png',
    tag: data.tag || 'livrya-notification',
    data: data.data || {},
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'LIVRIA', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  var urlToOpen = '/';
  var notificationData = event.notification.data;
  
  if (notificationData && notificationData.url) {
    urlToOpen = notificationData.url;
  }
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Try to focus an existing window
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if ('focus' in client) {
            return client.focus().then(function(c) {
              c.navigate(urlToOpen);
              return c;
            });
          }
        }
        // Open a new window if no existing client
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync handler
self.addEventListener('sync', function(event) {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-posts') {
    event.waitUntil(syncPosts());
  }
});

// Sync pending posts
function syncPosts() {
  // This would sync any posts that were created offline
  // For now, just log that sync was triggered
  console.log('[SW] Syncing posts...');
  return Promise.resolve();
}

// Message handler for cache control
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(function() {
      event.ports[0].postMessage({ success: true });
    });
  }
});

console.log('[SW] Service worker loaded');
