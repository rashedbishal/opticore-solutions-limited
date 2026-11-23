/*
 * Opticore CMS admin service worker: shows incoming WhatsApp call alerts
 * when no CMS tab is open, closes them when the call is answered elsewhere
 * or ends, and opens the lead when tapped. Scoped to /admin/ only.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
    let payload = {};

    try {
        payload = event.data ? event.data.json() : {};
    } catch {
        payload = {};
    }

    const data = payload.data || {};
    const tag = payload.tag || (data.call_id ? 'wa-call-' + data.call_id : 'wa-call');

    if (data.type === 'ended') {
        event.waitUntil(
            self.registration.getNotifications({ tag }).then((list) => list.forEach((n) => n.close())),
        );

        return;
    }

    event.waitUntil(
        self.registration.showNotification(payload.title || 'Incoming WhatsApp call', {
            body: payload.body || '',
            icon: payload.icon || '/apple-touch-icon.png',
            tag,
            renotify: true,
            requireInteraction: true,
            vibrate: payload.vibrate || [300, 200, 300],
            data,
        }),
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = (event.notification.data && event.notification.data.url) || '/admin';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
            for (const win of windows) {
                if (new URL(win.url).pathname.startsWith('/admin') && 'focus' in win) {
                    win.navigate(url);

                    return win.focus();
                }
            }

            return self.clients.openWindow(url);
        }),
    );
});
