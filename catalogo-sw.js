"use strict";

const VERSION = "20260513-editorial-flow2";
const STATIC_CACHE = `catalogo-static-${VERSION}`;
const RUNTIME_CACHE = `catalogo-runtime-${VERSION}`;
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=20260513-editorial-flow2",
  "./premium-home-redesign.css?v=20260513-founder-premium1",
  "./mobile-home-final.css?v=20260430-public-sync1",
  "./assets/logo-czs.svg?v=20260513-editorial-flow2",
  "./assets/favicon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./catalogo-app-core.js?v=20260513-editorial-flow2"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("catalogo-") && ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isCacheable(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/")) return false;
  return true;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  if (!isCacheable(event.request)) return;
  event.respondWith(staleWhileRevalidate(event.request));
});
