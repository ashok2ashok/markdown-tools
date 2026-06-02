// Service worker - app-shell cache-first, network-fallback
const VERSION = 'v9';
const CACHE = `mdtools-${VERSION}`;
const SHELL = [
  './',
  './index.html',
  './app.js',
  './styles.css',
  './favicon.ico',
  './shared/store.js',
  './shared/utils.js',
  './shared/deps.js',
  './shared/print.js',
  './tools/paste/index.js',
  './tools/editor/index.js',
  './tools/editor/adapters/textarea.js',
  './tools/editor/adapters/easymde.js',
  './tools/editor/adapters/toastui.js',
  './tools/convert/index.js',
  './tools/tables/index.js',
  './tools/toc/index.js',
  './tools/format/index.js',
  './tools/frontmatter/index.js',
  './tools/diff/index.js',
  './tools/links/index.js',
  './tools/plugins/index.js',
];

self.addEventListener('install', e => {
  // cache:'reload' bypasses HTTP cache → SW always installs fresh files
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(SHELL.map(url =>
        fetch(new Request(url, { cache: 'reload' })).then(res => {
          if (res.ok) return c.put(url, res);
        })
      ))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Same-origin: NETWORK-FIRST so updates propagate without stale-cache traps.
  // Falls back to cache only on network failure (offline).
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => caches.match(req).then(hit => hit || new Response('Offline', { status: 503 })))
    );
    return;
  }

  // Cross-origin CDNs (jsdelivr, esm.sh): stale-while-revalidate
  if (url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'esm.sh') {
    e.respondWith(
      caches.match(req).then(hit => {
        const fetchPromise = fetch(req).then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
          return res;
        }).catch(() => hit);
        return hit || fetchPromise;
      })
    );
  }
});
