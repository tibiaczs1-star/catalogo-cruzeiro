"use strict";

const APP_CACHE_PREFIX = "czs-android-app-";
const APP_CACHE_VERSION = "20260714-1";
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

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/downloads/")) return;
  if (request.mode === "navigate") {
    if (url.pathname === "/app.html") {
      event.respondWith(fetch(request).catch(() => caches.match("/app.html")));
    }
    return;
  }

  if (url.pathname === "/api/news" || url.pathname.startsWith("/api/news/")) {
    event.respondWith(networkFirstNews(request));
    return;
  }

  if (!SHELL_ASSETS.includes(url.pathname)) return;
  event.respondWith(caches.match(url.pathname).then((cached) => cached || fetch(request)));
});
