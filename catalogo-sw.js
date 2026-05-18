"use strict";

const VERSION = "20260517-mobilefix1";
const CACHE_PREFIXES = ["catalogo-", "pubpaid", "ppg"];

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => CACHE_PREFIXES.some((prefix) => key.toLowerCase().startsWith(prefix)))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
      .then(() => self.registration.unregister())
      .catch(() => self.registration.unregister())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request));
});
