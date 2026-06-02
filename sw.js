// Service worker - app-shell cache-first, network-fallback
const VERSION = 'v11';
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

  // Only intercept SAME-ORIGIN requests. Cross-origin (CDNs) handled natively
  // by browser - SW interception of CORS/integrity-checked requests has caused
  // "Returned response is null" and "TypeError: Load failed" errors.
  if (url.origin !== location.origin) return;

  // Network-first: updates propagate without stale-cache traps.
  // Cache fallback for offline.
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(req, clone)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || new Response('Offline', { status: 503 })))
  );
});
