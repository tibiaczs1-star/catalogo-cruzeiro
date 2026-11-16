"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const DefaultQRCode = require("qrcode");

const AMOUNT_CENTAVOS = 35_000;
const AMOUNT_DISPLAY = "R$ 350,00";
const PIX_DISPLAY_KEY = "68 99226-9296";
const PIX_RECIPIENT = "Raiane Lenoncio";
const PIX_CITY = "CRUZEIRO DO SUL";
const DEFAULT_PIX_EMV_KEY = "+5568992269296";
const DEFAULT_WHATSAPP = "5568992269296";
const SESSION_COOKIE_NAME = "superbad_admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const DOWNLOAD_TOKEN_TTL_MS = 15 * 60 * 1000;
const MAX_JSON_BYTES = 256 * 1024;
const DEFAULT_MAX_RELEASE_BYTES = 15 * 1024 * 1024;
const LICENSE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const VALID_EDITIONS = new Set(["beta", "superbad"]);
const CANONICAL_RELEASE_FILES = {
  beta: "BadClaudio-Desktop-Beta.zip",
  superbad: "BadClaudio-Desktop-SuperBad.zip",
};
const EDITION_RELEASE_FILES = {
  beta: ["BadClaudio-Desktop-Beta.zip", "Badclaude-Beta.zip", "BadClaudio-Beta.zip"],
  superbad: ["BadClaudio-Desktop-SuperBad.zip", "Badclaude-SuperBad.zip", "BadClaudio-SuperBad.zip"],
};

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  if (res.writableEnded) return;
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "SAMEORIGIN",
    ...extraHeaders,
  });
  res.end(body);
}

async function readJsonBody(req) {
  let total = 0;
  const chunks = [];
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_JSON_BYTES) {
      const err = new Error("Corpo da requisição excede o limite permitido.");
      err.statusCode = 413;
      throw err;
    }
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_err) {
    const err = new TypeError("JSON inválido.");
    err.statusCode = 400;
    throw err;
  }
}

async function readBinaryBody(req, maxBytes) {
  let total = 0;
  const chunks = [];
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      const err = new Error(`Arquivo excede o limite de ${Math.round(maxBytes / (1024 * 1024))} MB.`);
      err.statusCode = 413;
      throw err;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function isZipBuffer(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 4) return false;
  return (
    buf[0] === 0x50 &&
    buf[1] === 0x4b &&
    ((buf[2] === 0x03 && buf[3] === 0x04) || (buf[2] === 0x05 && buf[3] === 0x06))
  );
}

function cleanText(value, maxLen) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

function timingSafeEqualText(left, right) {
  const leftBuf = Buffer.from(String(left), "utf8");
  const rightBuf = Buffer.from(String(right), "utf8");
  if (leftBuf.length !== rightBuf.length) return false;
  return crypto.timingSafeEqual(leftBuf, rightBuf);
}

function hashSecretSha256(value) {
  return crypto.createHash("sha256").update(String(value), "utf8").digest("hex");
}

function hashScrypt(secret) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(String(secret), salt, 64);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

function verifyScrypt(secret, encoded) {
  if (typeof secret !== "string" || !secret) return false;
  const parts = String(encoded || "").split(/[:$]/);
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex || !/^[0-9a-f]+$/i.test(expectedHex) || expectedHex.length % 2 !== 0) {
    return false;
  }
  try {
    const expectedBuf = Buffer.from(expectedHex, "hex");
    if (expectedBuf.length < 16 || expectedBuf.length > 128) return false;
    const derived = crypto.scryptSync(secret, salt, expectedBuf.length);
    return crypto.timingSafeEqual(derived, expectedBuf);
  } catch (_err) {
    return false;
  }
}

function signToken(payloadObj, secret) {
  const body = Buffer.from(JSON.stringify(payloadObj), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verifyToken(token, secret) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length !== 2) return null;
    const [body, sig] = parts;
    if (!body || !sig) return null;
    const expectedSig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
    if (!timingSafeEqualText(sig, expectedSig)) return null;
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object") return null;
    if (!Number.isFinite(parsed.exp) || parsed.exp <= Date.now()) return null;
    return parsed;
  } catch (_err) {
    return null;
  }
}

function parseCookies(req) {
  const header = String(req?.headers?.cookie || "");
  const out = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const name = part.slice(0, idx).trim();
    const rawVal = part.slice(idx + 1).trim();
    if (!name) continue;
    try {
      out[name] = decodeURIComponent(rawVal);
    } catch (_err) {
      out[name] = rawVal;
    }
  }
  return out;
}

function isSecureRequest(req, environment, secureCookiesOption) {
  if (typeof secureCookiesOption === "boolean") return secureCookiesOption;
  const forwardedProto = String(req?.headers?.["x-forwarded-proto"] || "").toLowerCase();
  const isProd = String(environment?.NODE_ENV || "").trim().toLowerCase() === "production";
  return forwardedProto.includes("https") || Boolean(req?.socket?.encrypted) || isProd;
}

function buildPixBrCode({ pixKey, recipient, city, amountCentavos, txid, description }) {
  const emvField = (id, val) => `${id}${String(String(val).length).padStart(2, "0")}${val}`;
  const asciiClean = (val, maxLen) =>
    String(val || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9 /.-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase()
      .slice(0, maxLen);

  const accountInfo = [emvField("00", "br.gov.bcb.pix"), emvField("01", pixKey)];
  const cleanDesc = asciiClean(description, 40);
  if (cleanDesc) accountInfo.push(emvField("02", cleanDesc));

  const amountStr = (Number(amountCentavos) / 100).toFixed(2);
  const cleanTxid = String(txid || "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 25) || "SUPERBAD";

  const payload = [
    emvField("00", "01"),
    emvField("01", "12"),
    emvField("26", accountInfo.join("")),
    emvField("52", "0000"),
    emvField("53", "986"),
    emvField("54", amountStr),
    emvField("58", "BR"),
    emvField("59", asciiClean(recipient, 25) || "RAIANE LENONCIO"),
    emvField("60", asciiClean(city, 15) || "CRUZEIRO DO SUL"),
    emvField("62", emvField("05", cleanTxid)),
    "6304",
  ].join("");

  let crc = 0xffff;
  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return payload + crc.toString(16).toUpperCase().padStart(4, "0");
}

function generateLicenseKey(edition) {
  const prefix = edition === "beta" ? "BT" : "SB";
  const groups = [];
  for (let g = 0; g < 4; g += 1) {
    let part = "";
    for (let i = 0; i < 4; i += 1) {
      part += LICENSE_ALPHABET[crypto.randomInt(LICENSE_ALPHABET.length)];
    }
    groups.push(part);
  }
  return `${prefix}-${groups.join("-")}`;
}

function buildWhatsappUrl({ whatsappNumber, orderId, requestedEdition, buyerName }) {
  const editionLabel = requestedEdition === "beta" ? "Beta" : "SuperBad";
  const text = [
    `Olá! Fiz o Pix de ${AMOUNT_DISPLAY} referente ao pedido ${orderId} (BadClaudio ${editionLabel}).`,
    `Nome: ${buyerName}`,
    "Segue o comprovante para validação e liberação da licença.",
  ].join(" ");
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
}

function createRateLimiter({ maxAttempts = 6, windowMs = 15 * 60 * 1000 } = {}) {
  const attempts = new Map();
  return {
    consume(key, now = Date.now()) {
      const cutoff = now - windowMs;
      const recent = (attempts.get(key) || []).filter((ts) => ts > cutoff);
      if (recent.length >= maxAttempts) {
        attempts.set(key, recent);
        const retryAfterMs = Math.max(1000, recent[0] + windowMs - now);
        return { allowed: false, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) };
      }
      recent.push(now);
      attempts.set(key, recent);
      return { allowed: true, remaining: maxAttempts - recent.length };
    },
    reset(key) {
      attempts.delete(key);
    },
  };
}

function createSuperbadSalesApi(options = {}) {
  const environment = options.environment || process.env;
  const rootDir = path.resolve(options.rootDir || __dirname);
  const dataDir = path.resolve(options.dataDir || path.join(rootDir, "data"));
  const storeFile = path.join(dataDir, "superbad-orders.json");
  const releasesDir = path.resolve(
    options.releasesDir ||
      (environment.BADCLAUDE_RELEASES_DIR
        ? path.resolve(String(environment.BADCLAUDE_RELEASES_DIR))
        : path.join(rootDir, "private_releases"))
  );
  const qrcodeLib = options.qrcode || DefaultQRCode;

  const adminPasswordPlain = String(environment.SUPERBAD_ADMIN_PASSWORD || "");
  const adminPasswordHash = String(environment.SUPERBAD_ADMIN_PASSWORD_HASH || "").trim();
  const sessionSecret =
    String(options.sessionSecret || environment.SUPERBAD_SESSION_SECRET || "").trim() ||
    crypto.randomBytes(32).toString("hex");
  const downloadSecret =
    String(options.downloadSecret || environment.SUPERBAD_DOWNLOAD_SECRET || "").trim() ||
    crypto.randomBytes(32).toString("hex");

  const pixEmvKey = String(environment.SUPERBAD_PIX_KEY || DEFAULT_PIX_EMV_KEY).trim();
  const pixDisplayKey = cleanText(environment.SUPERBAD_PIX_DISPLAY_KEY || PIX_DISPLAY_KEY, 40);
  const pixRecipient = cleanText(environment.SUPERBAD_PIX_RECIPIENT || PIX_RECIPIENT, 40);
  const pixCity = cleanText(environment.SUPERBAD_PIX_CITY || PIX_CITY, 20);
  const whatsappNumber =
    String(environment.SUPERBAD_WHATSAPP || DEFAULT_WHATSAPP).replace(/\D/g, "") || DEFAULT_WHATSAPP;

  const loginLimiter = createRateLimiter({
    maxAttempts: Number(options.loginMaxAttempts || 6),
    windowMs: Number(options.loginWindowMs || 15 * 60 * 1000),
  });

  // Extensible payment provider registry: pix_manual is active today; gateways plug in here.
  const paymentProviders = {
    pix_manual: {
      id: "pix_manual",
      async createPayment({ orderId, txid, amountCentavos, requestedEdition, buyerName }) {
        const brcode = buildPixBrCode({
          pixKey: pixEmvKey,
          recipient: pixRecipient,
          city: pixCity,
          amountCentavos,
          txid,
          description: `SUPERBAD ${requestedEdition.toUpperCase()}`,
        });
        const qrDataUrl = await qrcodeLib.toDataURL(brcode, {
          margin: 1,
          width: 320,
          errorCorrectionLevel: "M",
        });
        return {
          payment_provider: "pix_manual",
          pix: {
            key: pixDisplayKey,
            recipient: pixRecipient,
            brcode,
            qr_data_url: qrDataUrl,
          },
          whatsapp_url: buildWhatsappUrl({
            whatsappNumber,
            orderId,
            requestedEdition,
            buyerName,
          }),
        };
      },
    },
  };

  let writeQueue = Promise.resolve();
  function withStoreLock(fn) {
    const next = writeQueue.then(fn, fn);
    writeQueue = next.catch(() => {});
    return next;
  }

  async function readStore() {
    try {
      const raw = await fs.promises.readFile(storeFile, "utf8");
      const parsed = JSON.parse(raw);
      return {
        version: 1,
        orders: Array.isArray(parsed?.orders) ? parsed.orders : [],
        licenses: Array.isArray(parsed?.licenses) ? parsed.licenses : [],
      };
    } catch (_err) {
      return { version: 1, orders: [], licenses: [] };
    }
  }

  async function writeStore(store) {
    await fs.promises.mkdir(path.dirname(storeFile), { recursive: true });
    const tmpFile = `${storeFile}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`;
    await fs.promises.writeFile(tmpFile, JSON.stringify(store, null, 2), "utf8");
    await fs.promises.rename(tmpFile, storeFile);
  }

  function isAdminConfigured() {
    return Boolean(adminPasswordHash || adminPasswordPlain);
  }

  function verifyAdminPassword(candidate) {
    if (typeof candidate !== "string" || !candidate) return false;
    if (adminPasswordHash && verifyScrypt(candidate, adminPasswordHash)) {
      return true;
    }
    if (adminPasswordPlain) {
      const salt = crypto.randomBytes(16).toString("hex");
      const candidateDigest = crypto.scryptSync(candidate, salt, 32);
      const expectedDigest = crypto.scryptSync(adminPasswordPlain, salt, 32);
      return crypto.timingSafeEqual(candidateDigest, expectedDigest);
    }
    return false;
  }

  function getAdminSession(req) {
    if (!isAdminConfigured()) return null;
    const cookies = parseCookies(req);
    const token = cookies[SESSION_COOKIE_NAME];
    if (!token) return null;
    const parsed = verifyToken(token, sessionSecret);
    if (!parsed || parsed.role !== "admin") return null;
    return parsed;
  }

  function requireAdmin(req, res) {
    if (!isAdminConfigured()) {
      sendJson(res, 503, {
        ok: false,
        error: "Acesso administrativo indisponível: senha não configurada no servidor.",
      });
      return null;
    }
    const session = getAdminSession(req);
    if (!session) {
      sendJson(res, 401, {
        ok: false,
        error: "Autenticação administrativa obrigatória.",
      });
      return null;
    }
    return session;
  }

  function buildSessionCookie(token, req, maxAgeSeconds) {
    const secure = isSecureRequest(req, environment, options.secureCookies) ? "; Secure" : "";
    return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/api/superbad/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}${secure}`;
  }

  function verifyOrderSecret(order, providedSecret) {
    if (!order || !order.order_secret_hash || typeof providedSecret !== "string" || !providedSecret) {
      return false;
    }
    const providedHash = hashSecretSha256(providedSecret);
    return timingSafeEqualText(providedHash, order.order_secret_hash);
  }

  function redactOrderForAdmin(order) {
    return {
      order_id: order.order_id,
      status: order.status,
      amount_centavos: order.amount_centavos,
      amount_display: order.amount_display,
      requested_edition: order.requested_edition,
      edition: order.edition || null,
      buyer_name: order.buyer_name,
      buyer_contact: order.buyer_contact,
      payment_provider: order.payment_provider,
      receipt_note: order.receipt_note || "",
      receipt_submitted_at: order.receipt_submitted_at || null,
      license_id: order.license_id || null,
      created_at: order.created_at,
      updated_at: order.updated_at,
      approved_at: order.approved_at || null,
    };
  }

  function redactLicenseForAdmin(license) {
    return {
      license_id: license.license_id,
      order_id: license.order_id,
      edition: license.edition,
      key_prefix: license.key_prefix,
      expires_at: license.expires_at,
      max_downloads: license.max_downloads,
      downloads_used: license.downloads_used,
      downloads_remaining: Math.max(0, license.max_downloads - license.downloads_used),
      revoked: Boolean(license.revoked),
      revoked_at: license.revoked_at || null,
      created_at: license.created_at,
      last_download_at: license.last_download_at || null,
    };
  }

  function getCandidateReleaseFilenames(edition) {
    const envVar =
      edition === "beta" ? environment.BADCLAUDE_BETA_ARCHIVE : environment.BADCLAUDE_SUPERBAD_ARCHIVE;
    const baseList = EDITION_RELEASE_FILES[edition] || [];
    if (envVar) {
      const safeName = path.basename(String(envVar).trim());
      if (safeName && safeName.endsWith(".zip") && !safeName.includes("..")) {
        return [safeName, ...baseList.filter((name) => name !== safeName)];
      }
    }
    return baseList;
  }

  function resolveReleaseFile(edition) {
    if (!VALID_EDITIONS.has(edition)) return { filePath: null, expectedFiles: [] };
    const candidates = getCandidateReleaseFilenames(edition);
    let realReleasesRoot;
    try {
      realReleasesRoot = fs.realpathSync(releasesDir);
    } catch (_err) {
      return { filePath: null, expectedFiles: candidates };
    }

    for (const filename of candidates) {
      if (path.basename(filename) !== filename) continue;
      const joined = path.resolve(realReleasesRoot, filename);
      if (!joined.startsWith(`${realReleasesRoot}${path.sep}`)) continue;
      try {
        const realTarget = fs.realpathSync(joined);
        if (!realTarget.startsWith(`${realReleasesRoot}${path.sep}`)) continue;
        const stat = fs.statSync(realTarget);
        if (stat.isFile()) {
          return { filePath: realTarget, fileName: filename, stat, expectedFiles: candidates };
        }
      } catch (_err) {
        // Candidate file does not exist yet; continue checking next candidate.
      }
    }
    return { filePath: null, expectedFiles: candidates };
  }

  function findLicenseByKey(licenses, normalizedKey) {
    if (!normalizedKey) return null;
    const prefix = normalizedKey.slice(0, 7);
    const matchingPrefix = licenses.filter((lic) => lic.key_prefix === prefix);
    const pool = matchingPrefix.length > 0 ? matchingPrefix : licenses;
    for (const lic of pool) {
      if (verifyScrypt(normalizedKey, lic.key_hash)) {
        return lic;
      }
    }
    return null;
  }

  async function handleApi(req, res, pathnameArg, searchParamsArg) {
    const parsedUrl = new URL(req.url || "/", "http://127.0.0.1");
    const pathname = pathnameArg || parsedUrl.pathname;
    const searchParams = searchParamsArg || parsedUrl.searchParams;
    const method = String(req.method || "GET").toUpperCase();

    try {
      // 1) POST /api/superbad/orders
      if (method === "POST" && pathname === "/api/superbad/orders") {
        const body = await readJsonBody(req);
        const buyerName = cleanText(body.buyer_name, 120);
        const buyerContact = cleanText(body.buyer_contact, 160);
        if (!buyerName || !buyerContact) {
          return sendJson(res, 400, {
            ok: false,
            error: "Nome e contato do comprador são obrigatórios.",
          });
        }

        const rawEdition = String(body.requested_edition ?? "superbad").trim().toLowerCase();
        const requestedEdition = rawEdition || "superbad";
        if (!VALID_EDITIONS.has(requestedEdition)) {
          return sendJson(res, 400, {
            ok: false,
            error: "Edição solicitada inválida. Escolha 'beta' ou 'superbad'.",
          });
        }

        const provider = paymentProviders.pix_manual;
        const orderId = `SB-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
        const orderSecret = crypto.randomBytes(24).toString("base64url");
        const txid = `SB${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString("hex").toUpperCase()}`.slice(0, 25);
        const paymentInfo = await provider.createPayment({
          orderId,
          txid,
          amountCentavos: AMOUNT_CENTAVOS,
          requestedEdition,
          buyerName,
        });

        const now = new Date().toISOString();
        const storedOrder = {
          order_id: orderId,
          order_secret_hash: hashSecretSha256(orderSecret),
          status: "pending_pix",
          amount_centavos: AMOUNT_CENTAVOS,
          amount_display: AMOUNT_DISPLAY,
          requested_edition: requestedEdition,
          edition: null,
          buyer_name: buyerName,
          buyer_contact: buyerContact,
          payment_provider: paymentInfo.payment_provider,
          txid,
          receipt_note: "",
          receipt_submitted_at: null,
          license_id: null,
          created_at: now,
          updated_at: now,
          approved_at: null,
        };

        await withStoreLock(async () => {
          const store = await readStore();
          store.orders.push(storedOrder);
          await writeStore(store);
        });

        return sendJson(res, 201, {
          ok: true,
          order: {
            order_id: orderId,
            order_secret: orderSecret,
            status: "pending_pix",
            amount_centavos: AMOUNT_CENTAVOS,
            amount_display: AMOUNT_DISPLAY,
            requested_edition: requestedEdition,
            pix: paymentInfo.pix,
            whatsapp_url: paymentInfo.whatsapp_url,
            payment_provider: paymentInfo.payment_provider,
            created_at: now,
          },
        });
      }

      // 2) GET /api/superbad/orders/:orderId
      const orderGetMatch = pathname.match(/^\/api\/superbad\/orders\/([A-Za-z0-9_-]+)$/);
      if (method === "GET" && orderGetMatch) {
        const orderId = orderGetMatch[1];
        const secret = String(
          searchParams.get("order_secret") || req.headers["x-order-secret"] || ""
        ).trim();
        const store = await readStore();
        const order = store.orders.find((item) => item.order_id === orderId);
        if (!verifyOrderSecret(order, secret)) {
          return sendJson(res, 403, { ok: false, error: "Acesso negado ao pedido." });
        }
        const responseOrder = {
          order_id: order.order_id,
          status: order.status,
          amount_centavos: order.amount_centavos,
          amount_display: order.amount_display,
          requested_edition: order.requested_edition,
          receipt_note: order.receipt_note || "",
          created_at: order.created_at,
          updated_at: order.updated_at,
        };
        if (order.edition) {
          responseOrder.edition = order.edition;
        }
        return sendJson(res, 200, { ok: true, order: responseOrder });
      }

      // 3) POST /api/superbad/orders/:orderId/receipt
      const orderReceiptMatch = pathname.match(/^\/api\/superbad\/orders\/([A-Za-z0-9_-]+)\/receipt$/);
      if (method === "POST" && orderReceiptMatch) {
        const orderId = orderReceiptMatch[1];
        const body = await readJsonBody(req);
        const secret = String(body.order_secret || req.headers["x-order-secret"] || "").trim();
        const receiptNote = cleanText(body.receipt_note, 500);
        if (!receiptNote) {
          return sendJson(res, 400, {
            ok: false,
            error: "Informe a referência ou observação do comprovante.",
          });
        }

        const result = await withStoreLock(async () => {
          const store = await readStore();
          const order = store.orders.find((item) => item.order_id === orderId);
          if (!verifyOrderSecret(order, secret)) {
            return { status: 403, payload: { ok: false, error: "Acesso negado ao pedido." } };
          }
          if (order.status === "approved") {
            return { status: 409, payload: { ok: false, error: "Pedido já aprovado." } };
          }
          const now = new Date().toISOString();
          order.receipt_note = receiptNote;
          order.receipt_submitted_at = now;
          order.status = "receipt_submitted";
          order.updated_at = now;
          await writeStore(store);
          return {
            status: 200,
            payload: {
              ok: true,
              order: {
                order_id: order.order_id,
                status: order.status,
                receipt_note: order.receipt_note,
              },
            },
          };
        });
        return sendJson(res, result.status, result.payload);
      }

      // 4) Admin auth endpoints
      if (method === "GET" && pathname === "/api/superbad/admin/session") {
        const configured = isAdminConfigured();
        const authenticated = Boolean(getAdminSession(req));
        return sendJson(res, 200, { ok: true, authenticated, configured });
      }

      if (method === "POST" && pathname === "/api/superbad/admin/login") {
        if (!isAdminConfigured()) {
          return sendJson(res, 503, {
            ok: false,
            error: "Senha administrativa não configurada no servidor.",
          });
        }
        const clientIp = String(req.socket?.remoteAddress || "unknown");
        const rate = loginLimiter.consume(clientIp);
        if (!rate.allowed) {
          return sendJson(
            res,
            429,
            {
              ok: false,
              error: "Muitas tentativas de login. Tente novamente mais tarde.",
              retry_after_seconds: rate.retryAfterSeconds,
            },
            { "Retry-After": String(rate.retryAfterSeconds) }
          );
        }

        const body = await readJsonBody(req);
        const password = typeof body.password === "string" ? body.password : "";
        if (!verifyAdminPassword(password)) {
          return sendJson(res, 401, { ok: false, error: "Credenciais inválidas." });
        }

        loginLimiter.reset(clientIp);
        const token = signToken(
          {
            sub: "superbad-admin",
            role: "admin",
            iat: Date.now(),
            exp: Date.now() + SESSION_TTL_MS,
          },
          sessionSecret
        );
        const cookie = buildSessionCookie(token, req, Math.floor(SESSION_TTL_MS / 1000));
        return sendJson(res, 200, { ok: true, authenticated: true }, { "Set-Cookie": cookie });
      }

      if (method === "POST" && pathname === "/api/superbad/admin/logout") {
        const expiredCookie = buildSessionCookie("", req, 0);
        return sendJson(res, 200, { ok: true }, { "Set-Cookie": expiredCookie });
      }

      // 5) Protected admin endpoints
      if (method === "GET" && pathname === "/api/superbad/admin/orders") {
        if (!requireAdmin(req, res)) return;
        const store = await readStore();
        const orders = store.orders
          .slice()
          .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
          .map(redactOrderForAdmin);
        const licenses = store.licenses
          .slice()
          .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
          .map(redactLicenseForAdmin);
        return sendJson(res, 200, { ok: true, orders, licenses });
      }

      const authorizeMatch = pathname.match(/^\/api\/superbad\/admin\/orders\/([A-Za-z0-9_-]+)\/authorize$/);
      if (method === "POST" && authorizeMatch) {
        if (!requireAdmin(req, res)) return;
        const orderId = authorizeMatch[1];
        const body = await readJsonBody(req);

        const edition = String(body.edition || "").trim().toLowerCase();
        if (!VALID_EDITIONS.has(edition)) {
          return sendJson(res, 400, {
            ok: false,
            error: "Escolha uma edição válida ('beta' ou 'superbad').",
          });
        }

        const rawDays = body.expires_in_days === undefined || body.expires_in_days === null || body.expires_in_days === ""
          ? 30
          : Number(body.expires_in_days);
        if (!Number.isInteger(rawDays) || rawDays < 1 || rawDays > 365) {
          return sendJson(res, 400, {
            ok: false,
            error: "expires_in_days deve ser um número inteiro entre 1 e 365.",
          });
        }

        const rawMaxDownloads =
          body.max_downloads === undefined || body.max_downloads === null || body.max_downloads === ""
            ? 5
            : Number(body.max_downloads);
        if (!Number.isInteger(rawMaxDownloads) || rawMaxDownloads < 1 || rawMaxDownloads > 100) {
          return sendJson(res, 400, {
            ok: false,
            error: "max_downloads deve ser um número inteiro entre 1 e 100.",
          });
        }

        const licenseKey = generateLicenseKey(edition);
        const keyHash = hashScrypt(licenseKey);
        const licenseId = `LIC-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + rawDays * 24 * 60 * 60 * 1000).toISOString();
        const nowIso = now.toISOString();

        const result = await withStoreLock(async () => {
          const store = await readStore();
          const order = store.orders.find((item) => item.order_id === orderId);
          if (!order) {
            return { status: 404, payload: { ok: false, error: "Pedido não encontrado." } };
          }

          // Revoke prior unrevoked license for this order so only the newly issued license stays active.
          for (const existingLic of store.licenses) {
            if (existingLic.order_id === orderId && !existingLic.revoked) {
              existingLic.revoked = true;
              existingLic.revoked_at = nowIso;
            }
          }

          const license = {
            license_id: licenseId,
            order_id: orderId,
            edition,
            key_prefix: licenseKey.slice(0, 7),
            key_hash: keyHash,
            expires_at: expiresAt,
            max_downloads: rawMaxDownloads,
            downloads_used: 0,
            revoked: false,
            revoked_at: null,
            created_at: nowIso,
            last_download_at: null,
          };

          store.licenses.push(license);
          order.status = "approved";
          order.edition = edition;
          order.approved_at = nowIso;
          order.updated_at = nowIso;
          order.license_id = licenseId;

          await writeStore(store);

          return {
            status: 200,
            payload: {
              ok: true,
              order_id: orderId,
              license: {
                license_id: license.license_id,
                edition: license.edition,
                expires_at: license.expires_at,
                max_downloads: license.max_downloads,
                downloads_used: license.downloads_used,
              },
              license_key: licenseKey,
            },
          };
        });

        return sendJson(res, result.status, result.payload);
      }

      const revokeMatch = pathname.match(/^\/api\/superbad\/admin\/licenses\/([A-Za-z0-9_-]+)\/revoke$/);
      if (method === "POST" && revokeMatch) {
        if (!requireAdmin(req, res)) return;
        const licenseId = revokeMatch[1];

        const result = await withStoreLock(async () => {
          const store = await readStore();
          const license = store.licenses.find((item) => item.license_id === licenseId);
          if (!license) {
            return { status: 404, payload: { ok: false, error: "Licença não encontrada." } };
          }
          license.revoked = true;
          license.revoked_at = new Date().toISOString();
          await writeStore(store);
          return {
            status: 200,
            payload: { ok: true, license_id: license.license_id, revoked: true },
          };
        });

        return sendJson(res, result.status, result.payload);
      }

      if (method === "GET" && pathname === "/api/superbad/admin/releases") {
        if (!requireAdmin(req, res)) return;
        const releases = ["beta", "superbad"].map((edition) => {
          const resolved = resolveReleaseFile(edition);
          if (resolved.filePath && resolved.stat) {
            return {
              edition,
              filename: resolved.fileName,
              exists: true,
              size_bytes: resolved.stat.size,
              updated_at: resolved.stat.mtime.toISOString(),
            };
          }
          return {
            edition,
            filename: CANONICAL_RELEASE_FILES[edition],
            exists: false,
            size_bytes: 0,
            updated_at: null,
          };
        });
        return sendJson(res, 200, {
          ok: true,
          releases_dir_configured: Boolean(releasesDir),
          releases,
        });
      }

      const uploadReleaseMatch = pathname.match(/^\/api\/superbad\/admin\/releases\/([A-Za-z0-9_-]+)$/);
      if (method === "POST" && uploadReleaseMatch) {
        if (!requireAdmin(req, res)) return;
        const edition = String(uploadReleaseMatch[1] || "").trim().toLowerCase();
        if (!VALID_EDITIONS.has(edition)) {
          return sendJson(res, 400, {
            ok: false,
            error: "Edição inválida. Escolha 'beta' ou 'superbad'.",
          });
        }

        const contentType = String(req.headers["content-type"] || "")
          .split(";")[0]
          .trim()
          .toLowerCase();
        if (
          contentType &&
          !["application/octet-stream", "application/zip", "application/x-zip-compressed"].includes(
            contentType
          )
        ) {
          return sendJson(res, 415, {
            ok: false,
            error: "Content-Type inválido. Envie o arquivo .zip como application/octet-stream.",
          });
        }

        const maxReleaseBytes =
          Number(options.maxReleaseBytes || environment.BADCLAUDE_MAX_RELEASE_BYTES) ||
          DEFAULT_MAX_RELEASE_BYTES;
        const zipBuffer = await readBinaryBody(req, maxReleaseBytes);
        if (!isZipBuffer(zipBuffer)) {
          return sendJson(res, 400, {
            ok: false,
            error: "Arquivo inválido. O upload deve ser um pacote .zip válido (assinatura PK).",
          });
        }

        const canonicalFilename = CANONICAL_RELEASE_FILES[edition];
        await fs.promises.mkdir(releasesDir, { recursive: true });
        const realReleasesRoot = await fs.promises.realpath(releasesDir);
        const targetPath = path.resolve(realReleasesRoot, canonicalFilename);
        if (!targetPath.startsWith(`${realReleasesRoot}${path.sep}`)) {
          return sendJson(res, 403, { ok: false, error: "Destino de release inválido." });
        }

        const tmpPath = `${targetPath}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`;
        await fs.promises.writeFile(tmpPath, zipBuffer);
        await fs.promises.rename(tmpPath, targetPath);

        return sendJson(res, 200, {
          ok: true,
          edition,
          filename: canonicalFilename,
          size_bytes: zipBuffer.length,
        });
      }

      // 6) POST /api/superbad/license/validate
      if (method === "POST" && pathname === "/api/superbad/license/validate") {
        const body = await readJsonBody(req);
        const licenseKey = String(body.license_key || "").trim().toUpperCase();
        if (!licenseKey || licenseKey.length > 80) {
          return sendJson(res, 400, { ok: false, error: "Informe uma chave de licença válida." });
        }

        const store = await readStore();
        const license = findLicenseByKey(store.licenses, licenseKey);
        if (!license) {
          return sendJson(res, 401, { ok: false, error: "Chave de licença inválida." });
        }
        if (license.revoked) {
          return sendJson(res, 403, { ok: false, error: "Licença revogada." });
        }
        if (Date.parse(license.expires_at) <= Date.now()) {
          return sendJson(res, 403, { ok: false, error: "Licença expirada." });
        }
        if (license.downloads_used >= license.max_downloads) {
          return sendJson(res, 403, { ok: false, error: "Limite de downloads atingido." });
        }

        const token = signToken(
          {
            lid: license.license_id,
            ed: license.edition,
            exp: Date.now() + DOWNLOAD_TOKEN_TTL_MS,
            jti: crypto.randomBytes(8).toString("hex"),
          },
          downloadSecret
        );

        return sendJson(res, 200, {
          ok: true,
          edition: license.edition,
          expires_at: license.expires_at,
          downloads_remaining: license.max_downloads - license.downloads_used,
          download_url: `/api/superbad/download?token=${encodeURIComponent(token)}`,
        });
      }

      // 7) GET /api/superbad/download?token=...
      if (method === "GET" && pathname === "/api/superbad/download") {
        const token = String(searchParams.get("token") || "").trim();
        const payload = verifyToken(token, downloadSecret);
        if (!payload || !payload.lid || !VALID_EDITIONS.has(payload.ed)) {
          return sendJson(res, 403, {
            ok: false,
            error: "Link de download inválido ou expirado. Valide sua licença novamente.",
          });
        }

        const lockOutcome = await withStoreLock(async () => {
          const store = await readStore();
          const license = store.licenses.find((item) => item.license_id === payload.lid);
          if (!license || license.edition !== payload.ed) {
            return { status: 403, payload: { ok: false, error: "Licença não encontrada." } };
          }
          if (license.revoked) {
            return { status: 403, payload: { ok: false, error: "Licença revogada." } };
          }
          if (Date.parse(license.expires_at) <= Date.now()) {
            return { status: 403, payload: { ok: false, error: "Licença expirada." } };
          }
          if (license.downloads_used >= license.max_downloads) {
            return { status: 403, payload: { ok: false, error: "Limite de downloads atingido." } };
          }

          const resolved = resolveReleaseFile(license.edition);
          if (!resolved.filePath) {
            return {
              status: 404,
              payload: {
                ok: false,
                error: "release_archive_not_ready",
                message:
                  "Licença válida, mas o pacote privado desta edição ainda não foi disponibilizado no servidor.",
                edition: license.edition,
                expected_files: resolved.expectedFiles,
              },
            };
          }

          license.downloads_used += 1;
          license.last_download_at = new Date().toISOString();
          await writeStore(store);

          return {
            status: 200,
            filePath: resolved.filePath,
            fileName: resolved.fileName,
            size: resolved.stat.size,
          };
        });

        if (lockOutcome.status !== 200) {
          return sendJson(res, lockOutcome.status, lockOutcome.payload);
        }

        res.writeHead(200, {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${lockOutcome.fileName}"`,
          "Content-Length": lockOutcome.size,
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        });

        const stream = fs.createReadStream(lockOutcome.filePath);
        stream.on("error", () => {
          if (!res.headersSent) {
            sendJson(res, 500, { ok: false, error: "Falha ao ler arquivo privado." });
          } else {
            res.destroy();
          }
        });
        stream.pipe(res);
        return;
      }

      return sendJson(res, 404, { ok: false, error: "Rota SuperBad não encontrada." });
    } catch (err) {
      const status = Number(err?.statusCode) || 500;
      const message =
        status >= 500 ? "Erro interno no serviço SuperBad." : err.message || "Requisição inválida.";
      return sendJson(res, status, { ok: false, error: message });
    }
  }

  return {
    handleApi,
    AMOUNT_CENTAVOS,
    AMOUNT_DISPLAY,
    releasesDir,
    storeFile,
  };
}

module.exports = {
  createSuperbadSalesApi,
  buildPixBrCode,
  hashScrypt,
  verifyScrypt,
};
