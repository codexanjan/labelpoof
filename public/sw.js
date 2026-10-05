const CACHE = "labelproof-shell-v3.1.0";
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll([
          "/",
          "/images/generic-pack.svg",
          "/images/oats-label.svg",
          "/images/tea-label.svg",
          "/images/snack-label.svg",
        ]),
      ),
  );
  self.skipWaiting();
});
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith("labelproof-shell-") && key !== CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (event) => {
  const req = event.request,
    url = new URL(req.url);
  if (
    req.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  )
    return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.mode === "navigate") return caches.match("/");
        return Response.error();
      }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "LP_REFRESH_OLD_TABS" || !event.source?.id) return;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) =>
        Promise.all(
          clients
            .filter(
              (client) =>
                client.id !== event.source.id &&
                new URL(client.url).origin === self.location.origin &&
                new URL(client.url).pathname.startsWith("/dashboard") &&
                new URL(client.url).pathname !== "/dashboard/new",
            )
            .map((client) => client.navigate(client.url).catch(() => null)),
        ),
      ),
  );
});
