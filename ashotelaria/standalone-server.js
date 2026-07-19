"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createStore } = require("./store");
const { createAuthService } = require("./auth");
const { createASHotelariaHandler } = require("./http");

const ROOT_DIR = path.resolve(__dirname, "..");
const APP_DIR = path.join(ROOT_DIR, "ashotelaria-app");
const MIME_TYPES = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
});

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  res.end(JSON.stringify(payload));
}

function sendFile(res, filePath, cacheControl = "no-store") {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false;
  res.writeHead(200, {
    "content-type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    "cache-control": cacheControl,
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "same-origin",
  });
  fs.createReadStream(filePath).pipe(res);
  return true;
}

function safeAssetPath(pathname) {
  const relative = decodeURIComponent(pathname.slice("/ashotelaria-app/".length));
  const resolved = path.resolve(APP_DIR, relative);
  return resolved.startsWith(`${APP_DIR}${path.sep}`) ? resolved : null;
}

function createStandaloneRequestHandler({ apiHandler, rootDir = ROOT_DIR } = {}) {
  const appDir = path.join(rootDir, "ashotelaria-app");
  const aliases = new Map([
    ["/", "index.html"],
    ["/app", "index.html"],
    ["/app/", "index.html"],
    ["/ashotelaria/app", "index.html"],
    ["/ashotelaria/app/", "index.html"],
    ["/hoteis", "booking.html"],
    ["/hoteis/", "booking.html"],
  ]);

  return async function standaloneRequestHandler(req, res) {
    try {
      const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const { pathname } = requestUrl;

      if (req.method === "GET" && pathname === "/health") {
        return sendJson(res, 200, { ok: true, product: "ashotelaria", mode: "standalone" });
      }
      if (pathname.startsWith("/api/ashotelaria/v1") && typeof apiHandler === "function") {
        if (await apiHandler(req, res)) return;
      }
      if (req.method === "GET" && pathname.startsWith("/ashotelaria-app/")) {
        const assetPath = safeAssetPath.call(null, pathname)?.replace(APP_DIR, appDir);
        if (assetPath && sendFile(res, assetPath, "public, max-age=3600")) return;
      }
      const page = aliases.get(pathname) || (/^\/reservar\/[^/]+\/?$/.test(pathname) ? "booking.html" : null);
      if (req.method === "GET" && page && sendFile(res, path.join(appDir, page))) return;
      sendJson(res, 404, { ok: false, error: "not_found", product: "ashotelaria" });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: "internal_error" });
    }
  };
}

function createProductionHandler() {
  const store = createStore();
  const authService = createAuthService({
    store,
    config: {
      sessionSecret: process.env.ASHOTELARIA_SESSION_SECRET,
      environment: process.env,
      requireInitialPasswordChange: String(process.env.ASHOTELARIA_REQUIRE_PASSWORD_CHANGE ?? "true")
        .trim().toLowerCase() !== "false",
    },
  });
  const apiHandler = createASHotelariaHandler({
    store,
    authService,
    config: { production: process.env.NODE_ENV === "production" },
  });
  return createStandaloneRequestHandler({ apiHandler });
}

module.exports = { createStandaloneRequestHandler, createProductionHandler };
