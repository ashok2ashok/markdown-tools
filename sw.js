// Tombstone service worker - clears all caches and unregisters itself.
// Users stuck in earlier SW versions (especially the infinite-reload-loop
// state) will install this on next update check. It then nukes everything
// and detaches from the page. Subsequent loads bypass SW entirely.
const VERSION = 'v16-tombstone';

self.addEventListener('install', e => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    // Wipe every cache this origin has
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    // Detach from clients
    await self.registration.unregister();
    // Force reload of all controlled clients so they pick up the no-SW state
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(c => { try { c.navigate(c.url); } catch {} });
  })());
});

// No fetch handler -> all requests bypass SW after activation.
