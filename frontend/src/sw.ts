/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

// Runtime caching (same as previous generateSW config)
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({ cacheName: "google-fonts-css" })
);

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({ cacheName: "google-fonts-files" })
);

registerRoute(
  /^https?:\/\/.*\/school\/.*/i,
  new NetworkFirst({ cacheName: "api-school" })
);

registerRoute(
  /^https?:\/\/.*\/chat\/.*/i,
  new NetworkFirst({
    cacheName: "api-chat",
  })
);

// ── Push event ──

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || "Assistant Réussite";
  const options = {
    body: data.body || "",
    icon: "/icons/android/launchericon-192x192.png",
    badge: "/icons/android/launchericon-96x96.png",
    data: data.data || {},
  };
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options as unknown as NotificationOptions),
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: "PUSH_NOTIFICATION", title, body: data.body, data: data.data });
        }
      }),
    ])
  );
});

// ── Notification click ──

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
