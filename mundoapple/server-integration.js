"use strict";

const path = require("node:path");
const catalog = require("./data/apple-products.json");
const { createMundoAppleHandler } = require("./server/http");
const { createJsonStore } = require("./server/store");

function redirect(res, location) {
  res.writeHead(308, { Location: location, "Cache-Control": "no-store" });
  res.end();
}

function createMundoAppleServerIntegration(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const dataDir = path.resolve(options.dataDir || path.join(rootDir, "data"));
  const environment = options.environment || process.env;
  const sendFile = options.sendFile;
  if (typeof sendFile !== "function") throw new TypeError("sendFile é obrigatório.");

  const publicRoot = path.join(rootDir, "mundoapple", "public");
  const store = createJsonStore({
    filePath: path.join(dataDir, "mundoapple", "state.json"),
    catalog,
  });
  let ready = null;
  function ensureReady() {
    if (!ready) ready = store.initialize();
    return ready;
  }
  const apiHandler = createMundoAppleHandler({
    store,
    catalog,
    adminUser: String(environment.MUNDOAPPLE_ADMIN_USER || "").trim(),
    passwordHash: String(environment.MUNDOAPPLE_ADMIN_PASSWORD_HASH || "").trim(),
    sessionSecret: String(environment.MUNDOAPPLE_SESSION_SECRET || "").trim(),
    secureCookies: String(environment.NODE_ENV || "").toLowerCase() === "production",
    documentsDir: path.join(dataDir, "mundoapple", "documents"),
  });

  return {
    async handleApi(req, res) {
      await ensureReady();
      return apiHandler(req, res);
    },
    async handleStatic(req, res, pathname) {
      if (pathname === "/mundoapple") {
        redirect(res, "/mundoapple/");
        return true;
      }
      if (pathname === "/mundoapple/admin") {
        redirect(res, "/mundoapple/admin/");
        return true;
      }
      if (!pathname.startsWith("/mundoapple/") || pathname.includes("..")) return false;
      const relative = pathname.slice("/mundoapple/".length);
      let target;
      if (!relative) {
        target = path.join(publicRoot, "index.html");
      } else if (relative === "admin/") {
        target = path.join(publicRoot, "admin", "index.html");
      } else {
        target = path.resolve(publicRoot, relative);
        if (!target.startsWith(`${publicRoot}${path.sep}`)) return false;
      }
      sendFile(req, res, target, {
        cacheControl: target.endsWith(".html")
          ? "no-store"
          : target.startsWith(`${path.join(publicRoot, "admin")}${path.sep}`)
            ? "no-cache"
            : "public, max-age=3600",
      });
      return true;
    },
  };
}

module.exports = { createMundoAppleServerIntegration };
