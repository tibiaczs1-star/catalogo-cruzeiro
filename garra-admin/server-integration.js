"use strict";

const crypto = require("node:crypto");
const path = require("node:path");
const { createGarraAdminStore } = require("./store");

const MODE = "homologation";

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(payload));
}

async function readBody(req, limit = 64 * 1024) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > limit) throw Object.assign(new Error("payload_too_large"), { status: 413 });
  }
  try { return raw ? JSON.parse(raw) : {}; }
  catch { throw Object.assign(new Error("invalid_json"), { status: 400 }); }
}

function createGarraAdminServerIntegration(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const publicRoot = path.join(rootDir, "garra-admin", "public");
  const sendFile = options.sendFile;
  const isAdmin = options.isAdmin;
  if (typeof sendFile !== "function" || typeof isAdmin !== "function") throw new TypeError("sendFile e isAdmin são obrigatórios");
  const store = createGarraAdminStore({
    dataDir: options.dataDir,
    readJson: options.readJson,
    writeJson: options.writeJson,
    now: options.now,
    idFactory: options.idFactory || (() => crypto.randomUUID()),
  });
  const getActor = options.getActor || (() => "catalogo-admin");

  function authorize(req, res) {
    if (isAdmin(req)) return true;
    sendJson(res, 401, { ok: false, mode: MODE, message: "Acesso administrativo necessário." });
    return false;
  }

  return {
    async handleApi(req, res, pathname) {
      if (!pathname.startsWith("/api/garra-admin/")) return false;
      if (!authorize(req, res)) return true;
      try {
        if (req.method === "GET" && pathname === "/api/garra-admin/health") {
          sendJson(res, 200, { ok: true, mode: MODE }); return true;
        }
        if (req.method === "GET" && pathname === "/api/garra-admin/summary") {
          sendJson(res, 200, { ok: true, ...store.getSummary() }); return true;
        }
        if (req.method === "GET" && pathname === "/api/garra-admin/inventory") {
          sendJson(res, 200, { ok: true, mode: MODE, batches: store.listInventoryBatches() }); return true;
        }
        if (req.method === "GET" && pathname === "/api/garra-admin/ledger") {
          sendJson(res, 200, { ok: true, mode: MODE, entries: store.listLedger(), auditEvents: store.listAuditEvents() }); return true;
        }
        if (req.method === "POST" && pathname === "/api/garra-admin/inventory/batches") {
          const idempotencyKey = String(req.headers["idempotency-key"] || "").trim();
          if (!idempotencyKey) { sendJson(res, 400, { ok: false, mode: MODE, message: "Idempotency-Key é obrigatório." }); return true; }
          const body = await readBody(req);
          const receipt = store.createInventoryBatch({ ...body, actor: getActor(req), idempotencyKey });
          sendJson(res, receipt.replayed ? 200 : 201, { ok: true, mode: MODE, ...receipt }); return true;
        }
        sendJson(res, 404, { ok: false, mode: MODE, message: "Rota não encontrada." }); return true;
      } catch (error) {
        const validation = error instanceof TypeError || error instanceof RangeError;
        sendJson(res, error.status || (validation ? 400 : 500), { ok: false, mode: MODE, message: validation ? error.message : "Não foi possível concluir a operação." });
        return true;
      }
    },
    async handleStatic(req, res, pathname) {
      if (pathname === "/garra-admin") {
        res.writeHead(308, { Location: "/garra-admin/", "Cache-Control": "no-store" }); res.end(); return true;
      }
      if (!pathname.startsWith("/garra-admin/") || pathname.includes("..")) return false;
      if (!authorize(req, res)) return true;
      const relative = pathname.slice("/garra-admin/".length) || "index.html";
      const target = path.resolve(publicRoot, relative);
      if (target !== path.join(publicRoot, "index.html") && !target.startsWith(`${publicRoot}${path.sep}`)) return false;
      sendFile(req, res, target, { cacheControl: "no-store" }); return true;
    },
  };
}

module.exports = { createGarraAdminServerIntegration };
