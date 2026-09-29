/* BAITIA Community Portal service worker
   Build: 2026-09-29-mobile-app-drawer-v25
   Intentionally avoids application-shell caching so deployments do not serve stale portal code. */

self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", event => {
  if (event?.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("push", event => {
  let data = {};
  try {
    data = event.data?.json?.() || {};
  } catch (_) {
    data = { body: event.data?.text?.() || "You have a new BAITIA notification." };
  }
  const title = String(data.title || "BAITIA Community Portal");
  const options = {
    body: String(data.body || "You have a new BAITIA notification."),
    icon: data.icon || undefined,
    badge: data.badge || undefined,
    tag: data.tag || undefined,
    renotify: Boolean(data.renotify),
    data: { ...(data.data || {}), url: data.url || data.data?.url || "./" }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil((async () => {
    const origin = self.location.origin;
    let targetUrl = origin + "/";
    try {
      const candidate = new URL(event.notification?.data?.url || "./", origin + "/");
      if (candidate.origin === origin) targetUrl = candidate.href;
    } catch (_) { }

    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      try {
        if (new URL(client.url).origin !== origin) continue;
        if ("navigate" in client && client.url !== targetUrl) await client.navigate(targetUrl);
        return await client.focus();
      } catch (_) { }
    }
    if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    return undefined;
  })());
});
