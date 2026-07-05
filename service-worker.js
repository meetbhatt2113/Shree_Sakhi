/**
 * SHREE SAKHI SERVICE WORKER
 * ---------------------------------------------------------
 * Makes the site installable as an app and caches key pages so they still
 * open (in a limited "last seen" way) even with a weak or no connection —
 * important for users on patchy mobile data.
 *
 * NOTE: This does NOT cache the AI voice feature's live responses (those
 * always need a real connection to reach the proxy) — it only caches the
 * static pages and their layout so the site doesn't show a blank error
 * screen when offline.
 *
 * If you rename or add pages, update CACHE_FILES below to match.
 */

const CACHE_NAME = 'shree-sakhi-v1';
const CACHE_FILES = [
  '/index.html',
  '/blog.html',
  '/pregnancy-guide.html',
  '/privacy.html',
  '/terms.html',
  '/parents.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache what we can; don't fail install if one file 404s
      return Promise.allSettled(CACHE_FILES.map((url) => cache.add(url)));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle simple GET page requests — never intercept the AI proxy or other POST calls
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Got a fresh copy from the network — update the cache for next time
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request)) // offline fallback to last cached version
  );
});
