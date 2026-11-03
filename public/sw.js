/* Notification-only service worker for CloudSpaceChat.
 * It does not cache app assets; its job is to display notifications on mobile
 * browsers (where the Notification constructor is unavailable) and to route
 * notification clicks back into the correct chat.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const data = notification?.data || {};
  const targetUrl = data.url || self.registration.scope;
  notification?.close();

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of clientList) {
        if (!("focus" in client)) continue;
        try {
          if ("navigate" in client && targetUrl) {
            await client.navigate(targetUrl);
          }
          return client.focus();
        } catch {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })(),
  );
});
