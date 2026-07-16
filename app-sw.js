"use strict";

const APP_CACHE_PREFIX = "czs-android-app-";
const APP_CACHE_VERSION = "20260716-1";
const SHELL_CACHE = `${APP_CACHE_PREFIX}shell-${APP_CACHE_VERSION}`;
const NEWS_CACHE = `${APP_CACHE_PREFIX}news-${APP_CACHE_VERSION}`;
const SHELL_ASSETS = [
  "/app.html",
  "/app.css",
  "/app.js",
  "/app.webmanifest",
  "/assets/icon-192.png",
  "/assets/icon-512.png",
  "/assets/brand/catalogo-czs-logo-offline-horizontal-crop-20260603.webp"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith(APP_CACHE_PREFIX) && key !== SHELL_CACHE && key !== NEWS_CACHE)
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

function isCacheableNewsResponse(response) {
  if (!response || !response.ok || response.type === "opaque") return false;
  const contentType = response.headers.get("content-type") || "";
  const cacheControl = response.headers.get("cache-control") || "";
  return contentType.includes("application/json")
    && !/\b(?:private|no-store)\b/i.test(cacheControl)
    && !response.headers.has("set-cookie");
}

async function networkFirstNews(request) {
  const cache = await caches.open(NEWS_CACHE);
  try {
    const response = await fetch(request);
    if (isCacheableNewsResponse(response)) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

function staleWhileRevalidateShell(request, cacheKey, event) {
  const cachedPromise = caches.match(cacheKey);
  const networkPromise = fetch(request).then(async (response) => {
    if (response && response.ok && response.type !== "opaque") {
      const cache = await caches.open(SHELL_CACHE);
      await cache.put(cacheKey, response.clone());
    }
    return response;
  });
  event.waitUntil(networkPromise.catch(() => {}));
  return cachedPromise.then((cached) => cached || networkPromise);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/downloads/")) return;
  if (request.mode === "navigate" && url.pathname !== "/app.html") return;

  if (url.pathname === "/api/news" || url.pathname.startsWith("/api/news/")) {
    event.respondWith(networkFirstNews(request));
    return;
  }

  if (!SHELL_ASSETS.includes(url.pathname)) return;
  event.respondWith(staleWhileRevalidateShell(request, url.pathname, event));
});
