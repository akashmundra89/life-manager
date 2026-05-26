/* eslint-disable no-restricted-globals */
// Custom service worker — wired up via vite-plugin-pwa's `injectManifest`
// strategy in vite.config.js. We keep the default Workbox precaching for the
// app shell, and add a `push` handler so the daily-reminders Edge Function
// can wake the SW and show a notification even when the PWA is closed.

import { precacheAndRoute } from 'workbox-precaching';

// vite-plugin-pwa replaces __WB_MANIFEST with the build-time precache list.
precacheAndRoute(self.__WB_MANIFEST || []);

// Activate immediately so a freshly deployed SW takes over without a reload.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// ─────────────────────────────────────────────────────────────────────────────
// Push: server sends { title, body, url, tag } — we show a system notification.
// Falls back gracefully if no payload was attached.
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'Life Manager', body: event.data?.text() || 'You have something to do today.' };
  }

  const title = payload.title || 'Life Manager';
  const options = {
    body: payload.body || 'You have something to do today.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.tag || 'life-manager-digest',
    renotify: true,
    data: { url: payload.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─────────────────────────────────────────────────────────────────────────────
// Tap on a notification: focus an existing app window, or open a new one,
// pointed at the URL the server sent (or the root).
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      // Try to focus a tab already on this origin.
      for (const w of wins) {
        try {
          const u = new URL(w.url);
          if (u.origin === self.location.origin && 'focus' in w) {
            // Best-effort: navigate the existing tab to the target URL.
            if ('navigate' in w) w.navigate(url).catch(() => {});
            return w.focus();
          }
        } catch { /* ignore */ }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
      return null;
    }),
  );
});
