"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const DefaultQRCode = require("qrcode");

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

const DEFAULT_LICENSE_PUBLIC_KEY_PEM = [
  "-----BEGIN PUBLIC KEY-----",
  "MCowBQYDK2VwAyEAIsf0QQNy1C/6kVMCJEz5TzYlrAbHJlBkHvh+OBqwOEo=",
  "-----END PUBLIC KEY-----",
].join("\n");

const EDITION_PLANS = Object.freeze({
  basic: {
    edition: "basic",
    tier: "client-basic",
    tierCode: "BSC",
    label: "BadClaude Básico",
    amountCentavos: 7_900,
    amountDisplay: "R$ 79,00",
    defaultDays: 7,
    defaultMaxHwids: 1,
    unlockedModes: ["essential", "badcode", "cockpit-pro"],
    freeProvidersIncluded: ["openrouter"],
    summary: "Núcleo BYOK + OpenRouter (:free) guiado no instalador e troca livre em 1 máquina.",
  },
  mid: {
    edition: "mid",
    tier: "client-mid",
    tierCode: "MID",
    label: "BadClaude Studio",
    amountCentavos: 17_900,
    amountDisplay: "R$ 179,00",
    defaultDays: 30,
    defaultMaxHwids: 1,
    unlockedModes: ["essential", "badcode", "cockpit-pro"],
    freeProvidersIncluded: ["openrouter", "google", "omnirouter"],
    summary: "OpenRouter (:free) + Google AI Studio Grátis (AIza) + OmniRouter (:20128) com tutoriais + Super Poderes.",
  },
  beta: {
    edition: "beta",
    tier: "client-basic",
    tierCode: "BSC",
    label: "BadClaudio Beta",
    amountCentavos: 35_000,
    amountDisplay: "R$ 350,00",
    defaultDays: 30,
    defaultMaxHwids: 1,
    unlockedModes: ["essential", "badcode", "cockpit-pro"],
    freeProvidersIncluded: ["openrouter"],
    summary: "Código limpo, DPAPI local + OpenRouter (:free) e download privado dedicado.",
  },
  superbad: {
    edition: "superbad",
    tier: "client-mid",
    tierCode: "MID",
    label: "BadClaudio SuperBad",
    amountCentavos: 35_000,
    amountDisplay: "R$ 350,00",
    defaultDays: 30,
    defaultMaxHwids: 2,
    unlockedModes: ["essential", "badcode", "cockpit-pro"],
    freeProvidersIncluded: ["openrouter", "google", "omnirouter", "ninerouter", "nvidia-chat-21"],
    summary: "Studio + 9Router (:20129) + 21 modelos NVIDIA Free Chat/Embeddings + OpenInfinite v6.1 Win/Mac grátis + até 2 máquinas vinculadas.",
  },
  founder: {
    edition: "founder",
    tier: "founder",
    tierCode: "FND",
    label: "BadClaude Fundador",
    amountCentavos: 69_000,
    amountDisplay: "R$ 690,00",
    defaultDays: 30,
    defaultMaxHwids: 1,
    unlockedModes: ["essential", "badcode", "cockpit-pro", "founder-vip"],
    freeProvidersIncluded: ["openrouter", "google", "omnirouter", "ninerouter", "nvidia-full-38", "nvidia-bio-rest-grpc"],
    summary: "TUDO LIBERADO: todos os 38 modelos NVIDIA Free (+ REST, gRPC NVCF e Bio/NIM), Google, OpenRouter, OmniRouter, 9Router, OpenInfinite v6.1 Win/Mac grátis e atualizações imediatas em nuvem.",
  },
});

const VALID_EDITIONS = new Set(Object.keys(EDITION_PLANS));
const ALLOWED_UPDATE_CHANNELS = new Set(["founder", "client-mid", "client-basic"]);
const ALLOWED_ZIP_CONTENT_TYPES = new Set([
  "application/octet-stream",
  "application/zip",
  "application/x-zip-compressed",
]);
const UPDATE_VERSION_RE = /^[A-Za-z0-9._-]{1,32}$/;

const CANONICAL_RELEASE_FILES = {
  basic: "BadClaude-Basic-Desktop.zip",
  mid: "BadClaude-Studio-Desktop.zip",
  beta: "BadClaudio-Desktop-Beta.zip",
  superbad: "BadClaudio-Desktop-SuperBad.zip",
  founder: "BadClaude-Founder-Desktop.zip",
};

const EDITION_RELEASE_FILES = {
  basic: ["BadClaude-Basic-Desktop.zip", "BadClaudio-Desktop-Beta.zip"],
  mid: ["BadClaude-Studio-Desktop.zip", "BadClaudio-Desktop-SuperBad.zip"],
  beta: ["BadClaudio-Desktop-Beta.zip", "Badclaude-Beta.zip", "BadClaudio-Beta.zip"],
  superbad: ["BadClaudio-Desktop-SuperBad.zip", "Badclaude-SuperBad.zip", "BadClaudio-SuperBad.zip"],
  founder: ["BadClaude-Founder-Desktop.zip", "BadClaude-Founder-v6.4-Portable.zip", "BadClaudio-Desktop-SuperBad.zip"],
};

const CODE_TO_TIER = Object.freeze({
  FND: "founder",
  MID: "client-mid",
  BSC: "client-basic",
  PRO: "infinite-pro",
  INF: "infinite-basic",
});

function getUnlockedModesForTier(tier) {
  const clean = String(tier || "").trim().toLowerCase();
  if (clean === "founder" || clean === "fundador") {
    return ["essential", "badcode", "cockpit-pro", "founder-vip"];
  }
  if (clean === "client-mid" || clean === "client-basic" || clean === "mid" || clean === "basic") {
    return ["essential", "badcode", "cockpit-pro"];
  }
  return ["essential", "badcode"];
}

function mapEditionToUpdateChannel(rawEdition) {
  const clean = String(rawEdition || "").trim().toLowerCase();
  if (["editor", "admin", "owner", "owner-master", "enterprise", "enterprise-full"].includes(clean)) {
    return null;
  }
  if (clean === "founder" || clean === "fundador" || clean === "fnd") return "founder";
  if (["superbad", "mid", "client-mid", "studio"].includes(clean)) return "client-mid";
  if (["basic", "client-basic", "beta", "client"].includes(clean)) return "client-basic";
  return "client-mid";
}

function tierCanAccessUpdateChannel(tier, channel) {
  const rankMap = { "client-basic": 1, basic: 1, beta: 1, "client-mid": 2, mid: 2, superbad: 2, founder: 3, fundador: 3 };
  const channelMinRank = channel === "founder" ? 3 : channel === "client-mid" ? 2 : 1;
  const userRank = rankMap[String(tier || "").trim().toLowerCase()] || 0;
  return userRank >= channelMinRank;
}

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

async function writeFileAtomic(targetPath, data) {
  const tmpPath = `${targetPath}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  await fs.promises.writeFile(tmpPath, data);
  await fs.promises.rename(tmpPath, targetPath);
}

function streamZipFile(res, filePath, fileName, fileSize, errorMessage) {
  res.writeHead(200, {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Content-Length": fileSize,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  const stream = fs.createReadStream(filePath);
  stream.on("error", () => {
    if (!res.headersSent) {
      sendJson(res, 500, { ok: false, error: errorMessage });
    } else {
      res.destroy();
    }
  });
  stream.pipe(res);
}

function buildAutoEnrolledEd25519License(edCheck, keySha, { email = "", boundHwids = [], nowIso = new Date().toISOString() } = {}) {
  const lblLower = String(edCheck.label || "").toLowerCase();
  const payloadEd = String(edCheck.edition || "").trim().toLowerCase();
  const resolvedEdition = payloadEd
    || (edCheck.tier === "founder" ? "founder"
      : edCheck.tier === "client-basic" ? "basic"
      : edCheck.tier === "infinite-pro" ? "infinite_pro"
      : edCheck.tier === "infinite-basic" ? "infinite"
      : (lblLower.includes("superbad") || lblLower.includes("cockpit")) ? "superbad" : "mid");
  return {
    license_id: `LIC-ED-${keySha.slice(0, 10).toUpperCase()}`,
    order_id: null,
    edition: resolvedEdition,
    tier: edCheck.tier,
    label: edCheck.label || edCheck.tier,
    email,
    key_prefix: edCheck.keyPrefix,
    key_hash: `sha256:${keySha}`,
    key_sha256: keySha,
    expires_at: edCheck.expiresAt,
    max_downloads: 10,
    downloads_used: 0,
    max_hwids: (resolvedEdition === "superbad" || resolvedEdition === "infinite_pro") ? 2 : 1,
    bound_hwids: boundHwids,
    revoked: false,
    revoked_at: null,
    issued_origin: "ed25519-auto-enrolled",
    last_seen_at: nowIso,
    usage_requests: 0,
    usage_tokens: 0,
    created_at: nowIso,
    last_download_at: null,
  };
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

function maskIp(ipRaw) {
  const s = String(ipRaw || "").replace(/^::ffff:/, "").trim();
  if (!s) return "unknown";
  if (s === "::1" || s === "127.0.0.1") return s;
  if (s.includes(".")) {
    const parts = s.split(".");
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.x`;
  }
  return `${s.slice(0, 12)}...`;
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

function verifyEd25519LicenseKey(rawKeyInput, publicKeyPem = DEFAULT_LICENSE_PUBLIC_KEY_PEM) {
  const rawKey = String(rawKeyInput || "").trim();
  const m = rawKey.match(/^((?:BC5-(FND|MID|BSC)|OI6-(INF|PRO))-([A-Za-z0-9_-]+))\.([A-Za-z0-9_-]+)$/);
  if (!m) {
    return { ok: false, isEd25519Format: false, code: "INVALID_FORMAT", error: "Formato fora do padrão BC5/OI6." };
  }
  const signingInput = m[1];
  const tierCode = m[2] || m[3];
  const payloadB64Url = m[4];
  const sigB64Url = m[5];
  let validSig = false;
  try {
    const sigBuf = Buffer.from(sigB64Url, "base64url");
    if (sigBuf.length === 64) {
      validSig = crypto.verify(null, Buffer.from(signingInput, "utf8"), publicKeyPem, sigBuf);
    }
  } catch {
    validSig = false;
  }
  if (!validSig) {
    return { ok: false, isEd25519Format: true, code: "INVALID_SIGNATURE", error: "Assinatura Ed25519 inválida." };
  }
  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64Url, "base64url").toString("utf8"));
  } catch {
    return { ok: false, isEd25519Format: true, code: "INVALID_PAYLOAD", error: "Payload inválido." };
  }
  if (!payload || payload.issuer !== "juniorplay-local") {
    return { ok: false, isEd25519Format: true, code: "INVALID_ISSUER", error: "Emissor inválido." };
  }
  const expectedTier = CODE_TO_TIER[tierCode];
  if (!expectedTier || String(payload.tier || "").toLowerCase() !== expectedTier) {
    return { ok: false, isEd25519Format: true, code: "TIER_MISMATCH", error: "Tier divergente." };
  }
  const rawExp = Number(payload.exp);
  if (!Number.isFinite(rawExp) || rawExp <= 0) {
    return { ok: false, isEd25519Format: true, code: "INVALID_EXPIRATION", error: "Expiração inválida." };
  }
  const expMs = rawExp < 1e11 ? rawExp * 1000 : rawExp;
  const nowMs = Date.now();
  const expired = nowMs >= expMs;
  const daysLeft = expired ? 0 : Math.max(1, Math.ceil((expMs - nowMs) / 86400000));
  return {
    ok: !expired,
    isEd25519Format: true,
    valid: !expired,
    expired,
    code: expired ? "LICENSE_EXPIRED" : "VALID",
    error: expired ? "Licença Ed25519 expirada." : null,
    tier: expectedTier,
    tierCode,
    edition: cleanText(payload.edition || "", 32).toLowerCase(),
    label: cleanText(payload.label || expectedTier, 120),
    daysLeft,
    expiresAt: new Date(expMs).toISOString(),
    keyHash: hashSecretSha256(rawKey),
    keyPrefix: rawKey.slice(0, 10),
    unlockedModes: getUnlockedModesForTier(expectedTier),
  };
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
  const cleanTxid =
    String(txid || "")
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
  const plan = EDITION_PLANS[edition] || EDITION_PLANS.superbad;
  const prefix = plan.tierCode || (edition === "beta" ? "BT" : "SB");
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

function buildWhatsappUrl({ whatsappNumber, orderId, requestedEdition, buyerName, amountDisplay }) {
  const plan = EDITION_PLANS[requestedEdition];
  const editionLabel = plan ? plan.label : requestedEdition;
  const valueLabel = amountDisplay || (plan ? plan.amountDisplay : "R$ 350,00");
  const text = [
    `Olá! Fiz o Pix de ${valueLabel} referente ao pedido ${orderId} (${editionLabel}).`,
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

  let licensePublicKeyPem = String(options.publicKeyPem || "").trim();
  if (!licensePublicKeyPem) {
    const pubCandidate = path.join(rootDir, "badclaude", "license-public.pem");
    try {
      if (fs.existsSync(pubCandidate)) {
        licensePublicKeyPem = fs.readFileSync(pubCandidate, "utf8").trim();
      }
    } catch {}
  }
  if (!licensePublicKeyPem) {
    licensePublicKeyPem = DEFAULT_LICENSE_PUBLIC_KEY_PEM;
  }

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

  const seenProofNonces = new Map();

  const paymentProviders = {
    pix_manual: {
      id: "pix_manual",
      async createPayment({ orderId, txid, amountCentavos, amountDisplay, requestedEdition, buyerName }) {
        const brcode = buildPixBrCode({
          pixKey: pixEmvKey,
          recipient: pixRecipient,
          city: pixCity,
          amountCentavos,
          txid,
          description: `BADCLAUDE ${requestedEdition.toUpperCase()}`,
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
            amountDisplay,
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
        version: 2,
        orders: Array.isArray(parsed?.orders) ? parsed.orders : [],
        licenses: Array.isArray(parsed?.licenses) ? parsed.licenses : [],
        network_nodes: Array.isArray(parsed?.network_nodes) ? parsed.network_nodes : [],
        update_manifests:
          parsed?.update_manifests && typeof parsed.update_manifests === "object"
            ? parsed.update_manifests
            : {},
      };
    } catch (_err) {
      return { version: 2, orders: [], licenses: [], network_nodes: [], update_manifests: {} };
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

  function verifyOwnerProof(req, method, pathname) {
    const rawHeader = String(req?.headers?.["x-badclaude-owner-proof"] || "").trim();
    if (!rawHeader) return null;
    const parts = rawHeader.split(".");
    if (parts.length !== 3) return null;
    const [tsStr, nonce, sigB64Url] = parts;
    const tsMs = Number(tsStr);
    if (!Number.isFinite(tsMs) || !nonce || nonce.length < 8 || nonce.length > 64 || !sigB64Url) {
      return null;
    }
    const now = Date.now();
    if (Math.abs(now - tsMs) > 5 * 60 * 1000) return null;

    for (const [k, expTs] of seenProofNonces.entries()) {
      if (expTs <= now) seenProofNonces.delete(k);
    }
    if (seenProofNonces.has(nonce)) return null;

    try {
      const sigBuf = Buffer.from(sigB64Url, "base64url");
      if (sigBuf.length !== 64) return null;
      const msg = `owner-proof:${tsStr}:${nonce}:${String(method).toUpperCase()}:${pathname}`;
      const ok = crypto.verify(null, Buffer.from(msg, "utf8"), licensePublicKeyPem, sigBuf);
      if (!ok) return null;
      seenProofNonces.set(nonce, now + 5 * 60 * 1000);
      return { role: "owner-ed25519", sub: "owner-control-plane" };
    } catch {
      return null;
    }
  }

  function requireAdminOrOwnerProof(req, res, method, pathname) {
    const proof = verifyOwnerProof(req, method, pathname);
    if (proof) return proof;
    const session = getAdminSession(req);
    if (session) return session;
    if (!isAdminConfigured()) {
      sendJson(res, 401, {
        ok: false,
        error: "Autenticação necessária (assinatura Ed25519 Owner ou sessão admin).",
      });
      return null;
    }
    sendJson(res, 401, { ok: false, error: "Autenticação administrativa obrigatória." });
    return null;
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
    const boundHwids = Array.isArray(license.bound_hwids) ? license.bound_hwids : [];
    const maxHwids = Number(license.max_hwids || 1);
    return {
      license_id: license.license_id,
      order_id: license.order_id || null,
      edition: license.edition,
      tier: license.tier || (EDITION_PLANS[license.edition]?.tier || license.edition),
      label: license.label || "",
      email: license.email || "",
      key_prefix: license.key_prefix,
      key_hash: license.key_hash || null,
      expires_at: license.expires_at,
      max_downloads: license.max_downloads,
      downloads_used: license.downloads_used,
      downloads_remaining: Math.max(0, license.max_downloads - license.downloads_used),
      max_hwids: maxHwids,
      bound_hwids: boundHwids,
      revoked: Boolean(license.revoked),
      revoked_at: license.revoked_at || null,
      issued_origin: license.issued_origin || "web-admin",
      last_seen_at: license.last_seen_at || null,
      usage_requests: Number(license.usage_requests || 0),
      usage_tokens: Number(license.usage_tokens || 0),
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
      } catch (_err) {}
    }
    return { filePath: null, expectedFiles: candidates };
  }

  function findLicenseByKey(licenses, rawKey) {
    const trimmed = String(rawKey || "").trim();
    if (!trimmed) return null;
    const sha = hashSecretSha256(trimmed);
    const bySha = licenses.find((lic) => lic.key_sha256 && timingSafeEqualText(lic.key_sha256, sha));
    if (bySha) return bySha;

    const normalizedUpper = trimmed.toUpperCase();
    const prefix = normalizedUpper.slice(0, 7);
    const matchingPrefix = licenses.filter((lic) => lic.key_prefix === prefix);
    const pool = matchingPrefix.length > 0 ? matchingPrefix : licenses;
    for (const lic of pool) {
      if (lic.key_hash && String(lic.key_hash).startsWith("scrypt$")) {
        if (verifyScrypt(normalizedUpper, lic.key_hash) || verifyScrypt(trimmed, lic.key_hash)) {
          return lic;
        }
      }
    }
    return null;
  }

  function upsertNetworkNode(store, nodeData) {
    if (!Array.isArray(store.network_nodes)) store.network_nodes = [];
    const nodeKey = `${nodeData.key_sha256 || nodeData.license_id || "anon"}::${nodeData.hwid || "no-hwid"}`;
    const nowIso = new Date().toISOString();
    const idx = store.network_nodes.findIndex((n) => n.node_key === nodeKey);
    const prev = idx >= 0 ? store.network_nodes[idx] : {};
    const record = {
      node_key: nodeKey,
      license_id: nodeData.license_id || prev.license_id || null,
      key_sha256: nodeData.key_sha256 || prev.key_sha256 || null,
      hwid: cleanText(nodeData.hwid || prev.hwid || "unknown", 96),
      hostname: cleanText(nodeData.hostname || prev.hostname || "PC-Cliente", 80),
      user_label: cleanText(nodeData.user_label || prev.user_label || "", 120),
      edition: cleanText(nodeData.edition || prev.edition || "client-mid", 32),
      tier: cleanText(nodeData.tier || prev.tier || "client-mid", 32),
      version: cleanText(nodeData.version || prev.version || "6.4.0", 24),
      active_layer: cleanText(nodeData.active_layer || prev.active_layer || "layer-1", 40),
      watchdog_ok: nodeData.watchdog_ok !== undefined ? Boolean(nodeData.watchdog_ok) : Boolean(prev.watchdog_ok ?? true),
      ip_masked: cleanText(nodeData.ip_masked || prev.ip_masked || "unknown", 48),
      requests_count: Math.max(Number(prev.requests_count || 0), Number(nodeData.requests_count || 0)),
      tokens_est: Math.max(Number(prev.tokens_est || 0), Number(nodeData.tokens_est || 0)),
      revoked: Boolean(nodeData.revoked),
      first_seen_at: prev.first_seen_at || nowIso,
      last_seen_at: nowIso,
    };
    if (idx >= 0) {
      store.network_nodes[idx] = record;
    } else {
      store.network_nodes.unshift(record);
    }
    if (store.network_nodes.length > 500) {
      store.network_nodes = store.network_nodes
        .sort((a, b) => String(b.last_seen_at).localeCompare(String(a.last_seen_at)))
        .slice(0, 500);
    }
    return record;
  }

  async function handleApi(req, res, pathnameArg, searchParamsArg) {
    const parsedUrl = new URL(req.url || "/", "http://127.0.0.1");
    const pathname = pathnameArg || parsedUrl.pathname;
    const searchParams = searchParamsArg || parsedUrl.searchParams;
    const method = String(req.method || "GET").toUpperCase();

    try {
      // 0) GET /api/superbad/plans
      if (method === "GET" && pathname === "/api/superbad/plans") {
        return sendJson(res, 200, {
          ok: true,
          pix: { key: pixDisplayKey, recipient: pixRecipient, city: pixCity },
          whatsapp: whatsappNumber,
          plans: Object.values(EDITION_PLANS),
        });
      }

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
            error: "Edição solicitada inválida. Escolha basic, mid, beta, superbad ou founder.",
          });
        }

        const plan = EDITION_PLANS[requestedEdition];
        const provider = paymentProviders.pix_manual;
        const orderId = `SB-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
        const orderSecret = crypto.randomBytes(24).toString("base64url");
        const txid = `SB${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString("hex").toUpperCase()}`.slice(0, 25);
        const paymentInfo = await provider.createPayment({
          orderId,
          txid,
          amountCentavos: plan.amountCentavos,
          amountDisplay: plan.amountDisplay,
          requestedEdition,
          buyerName,
        });

        const now = new Date().toISOString();
        const storedOrder = {
          order_id: orderId,
          order_secret_hash: hashSecretSha256(orderSecret),
          status: "pending_pix",
          amount_centavos: plan.amountCentavos,
          amount_display: plan.amountDisplay,
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
            amount_centavos: plan.amountCentavos,
            amount_display: plan.amountDisplay,
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
        const secret = String(searchParams.get("order_secret") || req.headers["x-order-secret"] || "").trim();
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
        if (order.edition) responseOrder.edition = order.edition;
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
          return sendJson(res, 400, { ok: false, error: "Informe a referência ou observação do comprovante." });
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
          return sendJson(res, 503, { ok: false, error: "Senha administrativa não configurada no servidor." });
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
          { sub: "superbad-admin", role: "admin", iat: Date.now(), exp: Date.now() + SESSION_TTL_MS },
          sessionSecret
        );
        const cookie = buildSessionCookie(token, req, Math.floor(SESSION_TTL_MS / 1000));
        return sendJson(res, 200, { ok: true, authenticated: true }, { "Set-Cookie": cookie });
      }

      if (method === "POST" && pathname === "/api/superbad/admin/logout") {
        const expiredCookie = buildSessionCookie("", req, 0);
        return sendJson(res, 200, { ok: true }, { "Set-Cookie": expiredCookie });
      }

      // 5) Protected admin & Dashboard Control endpoints
      if (method === "GET" && pathname === "/api/superbad/admin/orders") {
        if (!requireAdminOrOwnerProof(req, res, method, pathname)) return;
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

      if (method === "GET" && pathname === "/api/superbad/admin/network") {
        if (!requireAdminOrOwnerProof(req, res, method, pathname)) return;
        const store = await readStore();
        const now = Date.now();
        const nodes = (store.network_nodes || []).map((n) => {
          const ageMs = now - Date.parse(n.last_seen_at || 0);
          const presence = n.revoked
            ? "revoked"
            : Number.isFinite(ageMs) && ageMs <= 5 * 60 * 1000
              ? "online"
              : Number.isFinite(ageMs) && ageMs <= 60 * 60 * 1000
                ? "idle"
                : "offline";
          return { ...n, presence };
        });
        const orders = store.orders
          .slice()
          .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
          .map(redactOrderForAdmin);
        const licenses = store.licenses
          .slice()
          .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
          .map(redactLicenseForAdmin);
        return sendJson(res, 200, {
          ok: true,
          summary: {
            onlineNow: nodes.filter((n) => n.presence === "online").length,
            idleNodes: nodes.filter((n) => n.presence === "idle").length,
            totalNodes: nodes.length,
            activeLicenses: licenses.filter((l) => !l.revoked && Date.parse(l.expires_at) > now).length,
            revokedLicenses: licenses.filter((l) => l.revoked).length,
            pendingOrders: orders.filter((o) => o.status !== "approved").length,
            watchdogAlerts: nodes.filter((n) => n.watchdog_ok === false).length,
          },
          network_nodes: nodes,
          orders,
          licenses,
          update_manifests: store.update_manifests || {},
          serverTime: new Date().toISOString(),
        });
      }

      if (method === "POST" && pathname === "/api/superbad/admin/licenses/register") {
        if (!requireAdminOrOwnerProof(req, res, method, pathname)) return;
        const body = await readJsonBody(req);
        const keySha256 = cleanText(body.key_hash || body.key_sha256, 128).toLowerCase();
        if (!/^[a-f0-9]{64}$/.test(keySha256)) {
          return sendJson(res, 400, { ok: false, error: "key_hash SHA-256 inválido." });
        }
        const edition = cleanText(body.edition || "founder", 32).toLowerCase();
        const plan = EDITION_PLANS[edition] || EDITION_PLANS.founder;
        const rawDays = Number(body.days || plan.defaultDays || 30);
        const expiresAt = body.expires_at && Number.isFinite(Date.parse(body.expires_at))
          ? new Date(Date.parse(body.expires_at)).toISOString()
          : new Date(Date.now() + Math.max(1, rawDays) * 86400000).toISOString();
        const maxHwids = Math.max(1, Math.min(20, Number(body.max_hwids || plan.defaultMaxHwids || 1)));
        const maxDownloads = Math.max(1, Math.min(100, Number(body.max_downloads || 10)));
        const licenseId = cleanText(body.license_id || `LIC-${crypto.randomBytes(5).toString("hex").toUpperCase()}`, 64);
        const orderId = cleanText(body.order_id || "", 64) || null;
        const nowIso = new Date().toISOString();

        const outcome = await withStoreLock(async () => {
          const store = await readStore();
          let existing = store.licenses.find((l) => l.key_sha256 === keySha256 || l.license_id === licenseId);
          if (!existing) {
            existing = {
              license_id: licenseId,
              order_id: orderId,
              edition,
              tier: cleanText(body.tier || plan.tier, 32),
              label: cleanText(body.label || plan.label, 120),
              email: cleanText(body.email || "", 120),
              key_prefix: cleanText(body.key_prefix || "BC5-LOC", 16),
              key_hash: `sha256:${keySha256}`,
              key_sha256: keySha256,
              expires_at: expiresAt,
              max_downloads: maxDownloads,
              downloads_used: 0,
              max_hwids: maxHwids,
              bound_hwids: [],
              revoked: Boolean(body.revoked),
              revoked_at: body.revoked ? nowIso : null,
              issued_origin: "dashboard-control",
              last_seen_at: null,
              usage_requests: 0,
              usage_tokens: 0,
              created_at: nowIso,
              last_download_at: null,
            };
            store.licenses.push(existing);
          } else {
            existing.edition = edition;
            existing.tier = cleanText(body.tier || plan.tier, 32);
            existing.label = cleanText(body.label || existing.label, 120);
            existing.email = cleanText(body.email || existing.email, 120);
            existing.expires_at = expiresAt;
            existing.max_hwids = maxHwids;
            if (body.revoked !== undefined) {
              existing.revoked = Boolean(body.revoked);
              existing.revoked_at = existing.revoked ? nowIso : null;
            }
          }

          if (orderId) {
            const ord = store.orders.find((o) => o.order_id === orderId);
            if (ord) {
              for (const lic of store.licenses) {
                if (lic.order_id === orderId && lic.license_id !== existing.license_id && !lic.revoked) {
                  lic.revoked = true;
                  lic.revoked_at = nowIso;
                }
              }
              ord.status = "approved";
              ord.edition = edition;
              ord.approved_at = nowIso;
              ord.updated_at = nowIso;
              ord.license_id = existing.license_id;
            }
          }

          await writeStore(store);
          return redactLicenseForAdmin(existing);
        });

        return sendJson(res, 200, { ok: true, license: outcome });
      }

      const authorizeMatch = pathname.match(/^\/api\/superbad\/admin\/orders\/([A-Za-z0-9_-]+)\/authorize$/);
      if (method === "POST" && authorizeMatch) {
        if (!requireAdminOrOwnerProof(req, res, method, pathname)) return;
        const orderId = authorizeMatch[1];
        const body = await readJsonBody(req);

        const edition = String(body.edition || "").trim().toLowerCase();
        if (!VALID_EDITIONS.has(edition)) {
          return sendJson(res, 400, {
            ok: false,
            error: "Escolha uma edição válida (basic, mid, beta, superbad ou founder).",
          });
        }

        const plan = EDITION_PLANS[edition];
        const rawDays =
          body.expires_in_days === undefined || body.expires_in_days === null || body.expires_in_days === ""
            ? plan.defaultDays
            : Number(body.expires_in_days);
        if (!Number.isInteger(rawDays) || rawDays < 1 || rawDays > 365) {
          return sendJson(res, 400, { ok: false, error: "expires_in_days deve ser um inteiro entre 1 e 365." });
        }

        const rawMaxDownloads =
          body.max_downloads === undefined || body.max_downloads === null || body.max_downloads === ""
            ? 5
            : Number(body.max_downloads);
        if (!Number.isInteger(rawMaxDownloads) || rawMaxDownloads < 1 || rawMaxDownloads > 100) {
          return sendJson(res, 400, { ok: false, error: "max_downloads deve ser um inteiro entre 1 e 100." });
        }

        const licenseKey = generateLicenseKey(edition);
        const keyHash = hashScrypt(licenseKey);
        const keySha256 = hashSecretSha256(licenseKey);
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
            tier: plan.tier,
            label: order.buyer_name || plan.label,
            email: order.buyer_contact || "",
            key_prefix: licenseKey.slice(0, 7),
            key_hash: keyHash,
            key_sha256: keySha256,
            expires_at: expiresAt,
            max_downloads: rawMaxDownloads,
            downloads_used: 0,
            max_hwids: plan.defaultMaxHwids,
            bound_hwids: [],
            revoked: false,
            revoked_at: null,
            issued_origin: "web-admin",
            last_seen_at: null,
            usage_requests: 0,
            usage_tokens: 0,
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
        if (!requireAdminOrOwnerProof(req, res, method, pathname)) return;
        const licenseId = revokeMatch[1];

        const result = await withStoreLock(async () => {
          const store = await readStore();
          const license = store.licenses.find((item) => item.license_id === licenseId);
          if (!license) {
            return { status: 404, payload: { ok: false, error: "Licença não encontrada." } };
          }
          license.revoked = true;
          license.revoked_at = new Date().toISOString();
          for (const node of store.network_nodes || []) {
            if (node.license_id === licenseId || (license.key_sha256 && node.key_sha256 === license.key_sha256)) {
              node.revoked = true;
            }
          }
          await writeStore(store);
          return { status: 200, payload: { ok: true, license_id: license.license_id, revoked: true } };
        });

        return sendJson(res, result.status, result.payload);
      }

      const hwidResetMatch = pathname.match(/^\/api\/superbad\/admin\/licenses\/([A-Za-z0-9_-]+)\/hwid-reset$/);
      if (method === "POST" && hwidResetMatch) {
        if (!requireAdminOrOwnerProof(req, res, method, pathname)) return;
        const licenseId = hwidResetMatch[1];
        const body = await readJsonBody(req);

        const result = await withStoreLock(async () => {
          const store = await readStore();
          const license = store.licenses.find((item) => item.license_id === licenseId);
          if (!license) {
            return { status: 404, payload: { ok: false, error: "Licença não encontrada." } };
          }
          license.bound_hwids = [];
          if (Number.isInteger(Number(body.max_hwids)) && Number(body.max_hwids) >= 1) {
            license.max_hwids = Math.min(20, Number(body.max_hwids));
          }
          if (body.unrevoke === true) {
            license.revoked = false;
            license.revoked_at = null;
          }
          await writeStore(store);
          return { status: 200, payload: { ok: true, license: redactLicenseForAdmin(license) } };
        });
        return sendJson(res, result.status, result.payload);
      }

      if (method === "POST" && pathname === "/api/superbad/admin/updates/manifest") {
        if (!requireAdminOrOwnerProof(req, res, method, pathname)) return;
        const body = await readJsonBody(req);
        const channel = cleanText(body.channel || body.edition || "", 32).toLowerCase();
        if (!ALLOWED_UPDATE_CHANNELS.has(channel)) {
          return sendJson(res, 400, {
            ok: false,
            error: "Canal de update inválido. Use founder, client-mid ou client-basic (owner-master nunca é publicado na nuvem).",
          });
        }
        const version = cleanText(body.version || "", 32);
        const sha256 = cleanText(body.sha256 || "", 128).toLowerCase();
        if (!version || !sha256) {
          return sendJson(res, 400, { ok: false, error: "version e sha256 são obrigatórios." });
        }
        const manifest = {
          version,
          channel,
          platform: cleanText(body.platform || "win32-x64", 32),
          releaseDate: new Date().toISOString(),
          requiresMinAppVersion: cleanText(body.requiresMinAppVersion || "5.0.0", 24),
          forceImmediate: Boolean(body.forceImmediate || body.rollout === "immediate"),
          notes: cleanText(body.notes || "", 500),
          deltaBundle: body.deltaBundle && typeof body.deltaBundle === "object"
            ? body.deltaBundle
            : { url: cleanText(body.url || "", 500), sha256, sizeBytes: Number(body.sizeBytes || 0) },
          securityInvariants: {
            watchdogRequired: true,
            appOnlyClosedRequired: true,
            forbidPaidFallbackFromClaude: true,
            forbidKeygenAdminModules: true,
          },
          signatureEd25519: cleanText(body.signatureEd25519 || "", 512),
        };
        await withStoreLock(async () => {
          const store = await readStore();
          if (!store.update_manifests || typeof store.update_manifests !== "object") {
            store.update_manifests = {};
          }
          store.update_manifests[channel] = manifest;
          await writeStore(store);
        });
        return sendJson(res, 200, { ok: true, manifest });
      }

      if (method === "GET" && pathname === "/api/superbad/admin/releases") {
        if (!requireAdminOrOwnerProof(req, res, method, pathname)) return;
        const releases = Array.from(VALID_EDITIONS).map((edition) => {
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
        return sendJson(res, 200, { ok: true, releases_dir_configured: Boolean(releasesDir), releases });
      }

      const uploadReleaseMatch = pathname.match(/^\/api\/superbad\/admin\/releases\/([A-Za-z0-9_-]+)$/);
      if (method === "POST" && uploadReleaseMatch) {
        if (!requireAdminOrOwnerProof(req, res, method, pathname)) return;
        const edition = String(uploadReleaseMatch[1] || "").trim().toLowerCase();
        if (!VALID_EDITIONS.has(edition)) {
          return sendJson(res, 400, { ok: false, error: "Edição inválida para upload." });
        }

        const contentType = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
        if (contentType && !ALLOWED_ZIP_CONTENT_TYPES.has(contentType)) {
          return sendJson(res, 415, {
            ok: false,
            error: "Content-Type inválido. Envie o arquivo .zip como application/octet-stream.",
          });
        }

        const maxReleaseBytes =
          Number(options.maxReleaseBytes || environment.BADCLAUDE_MAX_RELEASE_BYTES) || DEFAULT_MAX_RELEASE_BYTES;
        const zipBuffer = await readBinaryBody(req, maxReleaseBytes);
        if (!isZipBuffer(zipBuffer)) {
          return sendJson(res, 400, { ok: false, error: "Arquivo inválido. O upload deve ser um pacote .zip válido." });
        }

        const canonicalFilename = CANONICAL_RELEASE_FILES[edition];
        await fs.promises.mkdir(releasesDir, { recursive: true });
        const realReleasesRoot = await fs.promises.realpath(releasesDir);
        const targetPath = path.resolve(realReleasesRoot, canonicalFilename);
        if (!targetPath.startsWith(`${realReleasesRoot}${path.sep}`)) {
          return sendJson(res, 403, { ok: false, error: "Destino de release inválido." });
        }

        await writeFileAtomic(targetPath, zipBuffer);

        return sendJson(res, 200, {
          ok: true,
          edition,
          filename: canonicalFilename,
          size_bytes: zipBuffer.length,
        });
      }

      if (method === "POST" && pathname === "/api/superbad/admin/updates/bundle") {
        if (!requireAdminOrOwnerProof(req, res, method, pathname)) return;
        const channel = String(searchParams.get("channel") || "").trim().toLowerCase();
        const version = String(searchParams.get("version") || "").trim();
        if (!ALLOWED_UPDATE_CHANNELS.has(channel)) {
          return sendJson(res, 400, {
            ok: false,
            error: "Canal de update inválido. Use founder, client-mid ou client-basic.",
          });
        }
        if (!UPDATE_VERSION_RE.test(version)) {
          return sendJson(res, 400, { ok: false, error: "Versão inválida para bundle de atualização." });
        }

        const contentType = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
        if (contentType && !ALLOWED_ZIP_CONTENT_TYPES.has(contentType)) {
          return sendJson(res, 415, {
            ok: false,
            error: "Content-Type inválido. Envie o pacote .zip como application/octet-stream ou application/zip.",
          });
        }

        const maxReleaseBytes =
          Number(options.maxReleaseBytes || environment.BADCLAUDE_MAX_RELEASE_BYTES) || DEFAULT_MAX_RELEASE_BYTES;
        const zipBuffer = await readBinaryBody(req, maxReleaseBytes);
        if (!isZipBuffer(zipBuffer)) {
          return sendJson(res, 400, { ok: false, error: "Arquivo inválido. O bundle deve ser um pacote .zip válido." });
        }

        const deltasRoot = path.join(releasesDir, "deltas");
        await fs.promises.mkdir(deltasRoot, { recursive: true });
        const realReleasesRoot = await fs.promises.realpath(releasesDir);
        const realDeltasRoot = await fs.promises.realpath(deltasRoot);
        if (!realDeltasRoot.startsWith(`${realReleasesRoot}${path.sep}`)) {
          return sendJson(res, 403, { ok: false, error: "Diretório de deltas inválido." });
        }

        const deltaFilename = `delta-${channel}-${version}.zip`;
        const deltaTargetPath = path.resolve(realDeltasRoot, deltaFilename);
        if (!deltaTargetPath.startsWith(`${realDeltasRoot}${path.sep}`)) {
          return sendJson(res, 403, { ok: false, error: "Destino de delta inválido." });
        }
        await writeFileAtomic(deltaTargetPath, zipBuffer);

        if (searchParams.get("alsoUpdateRelease") === "1") {
          const canonicalKey = channel === "founder" ? "founder" : channel === "client-mid" ? "superbad" : "basic";
          const canonicalFilename = CANONICAL_RELEASE_FILES[canonicalKey];
          const canonicalTargetPath = path.resolve(realReleasesRoot, canonicalFilename);
          if (!canonicalTargetPath.startsWith(`${realReleasesRoot}${path.sep}`)) {
            return sendJson(res, 403, { ok: false, error: "Destino de release canônico inválido." });
          }
          await writeFileAtomic(canonicalTargetPath, zipBuffer);
        }

        const sha256 = crypto.createHash("sha256").update(zipBuffer).digest("hex");
        return sendJson(res, 200, {
          ok: true,
          channel,
          version,
          sha256,
          sizeBytes: zipBuffer.length,
          downloadUrl: `/api/updates/download?channel=${encodeURIComponent(channel)}&version=${encodeURIComponent(version)}`,
        });
      }

      // 6) SaaS Contract: POST /api/v1/licenses/verify (Ed25519 + HWID + Revocation)
      if (method === "POST" && pathname === "/api/v1/licenses/verify") {
        const body = await readJsonBody(req);
        const rawKey = String(body.key || body.license_key || "").trim();
        const email = cleanText(body.email || "", 120);
        const hwid = cleanText(body.hwid || "", 96);
        const hostname = cleanText(body.hostname || "", 80);
        const version = cleanText(body.version || "6.4.0", 24);
        if (!rawKey) {
          return sendJson(res, 400, { ok: false, valid: false, code: "EMPTY_KEY", error: "Chave ausente." });
        }

        const edCheck = verifyEd25519LicenseKey(rawKey, licensePublicKeyPem);
        if (edCheck.isEd25519Format && !edCheck.ok) {
          const st = edCheck.code === "LICENSE_EXPIRED" ? 403 : 401;
          return sendJson(res, st, {
            ok: false,
            valid: false,
            revoked: false,
            code: edCheck.code,
            error: edCheck.error,
          });
        }

        const keySha = hashSecretSha256(rawKey);
        const clientIpMasked = maskIp(req.socket?.remoteAddress || "");

        const outcome = await withStoreLock(async () => {
          const store = await readStore();
          let license = findLicenseByKey(store.licenses, rawKey);

          if (!license) {
            if (!edCheck.ok) {
              return { status: 401, payload: { ok: false, valid: false, code: "INVALID_SIGNATURE", error: "Chave de licença inválida." } };
            }
            license = buildAutoEnrolledEd25519License(edCheck, keySha, { email });
            store.licenses.push(license);
          }

          if (license.revoked) {
            upsertNetworkNode(store, {
              license_id: license.license_id,
              key_sha256: keySha,
              hwid,
              hostname,
              user_label: email || license.label,
              edition: license.edition,
              tier: license.tier,
              version,
              ip_masked: clientIpMasked,
              revoked: true,
            });
            await writeStore(store);
            return {
              status: 403,
              payload: { ok: false, valid: false, revoked: true, code: "LICENSE_REVOKED", error: "Esta licença foi revogada pelo emissor." },
            };
          }

          if (Date.parse(license.expires_at) <= Date.now()) {
            return {
              status: 403,
              payload: { ok: false, valid: false, revoked: false, code: "LICENSE_EXPIRED", error: "Licença expirada segundo o relógio do servidor." },
            };
          }

          if (!Array.isArray(license.bound_hwids)) license.bound_hwids = [];
          const maxHwids = Math.max(1, Number(license.max_hwids || 1));
          if (hwid && !license.bound_hwids.includes(hwid)) {
            if (license.bound_hwids.length >= maxHwids) {
              return {
                status: 403,
                payload: {
                  ok: false,
                  valid: false,
                  revoked: false,
                  code: "HWID_MISMATCH",
                  error: `Limite de dispositivos (${maxHwids}) atingido para esta licença. Peça reset ao administrador.`,
                },
              };
            }
            license.bound_hwids.push(hwid);
          }

          const nowIso = new Date().toISOString();
          license.last_seen_at = nowIso;
          if (email && !license.email) license.email = email;

          const tier = license.tier || EDITION_PLANS[license.edition]?.tier || "client-mid";
          const expMs = Date.parse(license.expires_at);
          const daysLeft = Math.max(1, Math.ceil((expMs - Date.now()) / 86400000));

          upsertNetworkNode(store, {
            license_id: license.license_id,
            key_sha256: keySha,
            hwid,
            hostname,
            user_label: email || license.label,
            edition: license.edition,
            tier,
            version,
            ip_masked: clientIpMasked,
            revoked: false,
          });
          await writeStore(store);

          const sessionToken = signToken(
            { sub: license.license_id, tier, hwid: hwid || "", exp: Date.now() + 24 * 60 * 60 * 1000 },
            sessionSecret
          );

          const includesOpenInfinite = Boolean(
            license.edition === "founder"
            || license.edition === "superbad"
            || tier === "founder"
            || String(tier).startsWith("infinite")
          );

          return {
            status: 200,
            payload: {
              ok: true,
              valid: true,
              revoked: false,
              licenseId: license.license_id,
              edition: license.edition,
              includesOpenInfinite,
              tier,
              planLabel: license.label || (EDITION_PLANS[license.edition]?.label || tier),
              email: license.email || email,
              hwid,
              boundHwidsCount: license.bound_hwids.length,
              maxHwids,
              daysLeft,
              expiresAt: license.expires_at,
              unlockedModes: getUnlockedModesForTier(tier),
              sessionToken,
              serverTime: nowIso,
            },
          };
        });

        return sendJson(res, outcome.status, outcome.payload);
      }

      // 7) Live Network Telemetry Heartbeat: POST /api/v1/telemetry/heartbeat
      if (method === "POST" && pathname === "/api/v1/telemetry/heartbeat") {
        const body = await readJsonBody(req);
        const rawKey = String(body.key || req.headers["x-badclaude-license"] || "").trim();
        const edCheck = rawKey ? verifyEd25519LicenseKey(rawKey, licensePublicKeyPem) : null;
        const keySha = rawKey ? hashSecretSha256(rawKey) : cleanText(body.key_hash || "", 128).toLowerCase();
        const hwid = cleanText(body.hwid || "", 96);
        const edition = cleanText(body.edition || "client-mid", 32).toLowerCase();
        const tier = cleanText(body.tier || EDITION_PLANS[edition]?.tier || edition, 32).toLowerCase();

        const result = await withStoreLock(async () => {
          const store = await readStore();
          let lic = rawKey
            ? findLicenseByKey(store.licenses, rawKey)
            : store.licenses.find((l) => l.key_sha256 && keySha && l.key_sha256 === keySha);

          if (!lic && edCheck && edCheck.ok) {
            lic = buildAutoEnrolledEd25519License(edCheck, keySha, {
              email: cleanText(body.user_label || body.email || "", 120),
              boundHwids: hwid ? [hwid] : [],
            });
            store.licenses.push(lic);
          }

          const isRevoked = Boolean(lic && lic.revoked);
          const isExpired = Boolean(
            (lic && Date.parse(lic.expires_at) <= Date.now()) ||
              (!lic && edCheck?.code === "LICENSE_EXPIRED")
          );
          if (lic) {
            lic.last_seen_at = new Date().toISOString();
            lic.usage_requests = Math.max(Number(lic.usage_requests || 0), Number(body.requests_count || 0));
            lic.usage_tokens = Math.max(Number(lic.usage_tokens || 0), Number(body.tokens_est || 0));
          }

          upsertNetworkNode(store, {
            license_id: lic?.license_id || null,
            key_sha256: keySha || lic?.key_sha256 || null,
            hwid,
            hostname: body.hostname || "",
            user_label: body.user_label || lic?.email || lic?.label || "",
            edition: lic?.edition || edition,
            tier: lic?.tier || tier,
            version: body.version || "6.4.0",
            active_layer: body.active_layer || "layer-1",
            watchdog_ok: body.watchdog_ok !== false,
            ip_masked: maskIp(req.socket?.remoteAddress || ""),
            requests_count: Number(body.requests_count || 0),
            tokens_est: Number(body.tokens_est || 0),
            revoked: isRevoked,
          });
          await writeStore(store);

          const channel = mapEditionToUpdateChannel(lic?.edition || edition);
          const manifest = channel ? store.update_manifests?.[channel] || null : null;
          return {
            status: isRevoked ? 403 : 200,
            payload: {
              ok: !isRevoked,
              active: !isRevoked && !isExpired,
              revoked: isRevoked,
              expired: isExpired,
              code: isRevoked ? "LICENSE_REVOKED" : isExpired ? "LICENSE_EXPIRED" : "OK",
              update_available: Boolean(manifest && body.version && manifest.version !== body.version),
              latest_version: manifest?.version || null,
              force_immediate: Boolean(manifest?.forceImmediate),
              delta_url: manifest?.deltaBundle?.url || null,
              serverTime: new Date().toISOString(),
            },
          };
        });

        return sendJson(res, result.status, result.payload);
      }

      // 8) Cloud Update Manifest: GET /api/updates/manifest
      if (method === "GET" && pathname === "/api/updates/manifest") {
        const rawEdition = String(searchParams.get("edition") || "client-mid").trim();
        const channel = mapEditionToUpdateChannel(rawEdition);
        if (!channel || !ALLOWED_UPDATE_CHANNELS.has(channel)) {
          return sendJson(res, 403, {
            ok: false,
            code: "CHANNEL_FORBIDDEN",
            error: "Este canal não é distribuído publicamente pela nuvem.",
          });
        }
        const providedKey = String(req.headers["x-badclaude-license"] || searchParams.get("key") || "").trim();
        const store = await readStore();
        if (providedKey) {
          const lic = findLicenseByKey(store.licenses, providedKey);
          const edCheck = verifyEd25519LicenseKey(providedKey, licensePublicKeyPem);
          if ((!lic && !edCheck.ok) || (lic && lic.revoked) || (lic && Date.parse(lic.expires_at) <= Date.now())) {
            return sendJson(res, 403, {
              ok: false,
              code: lic?.revoked ? "LICENSE_REVOKED" : "LICENSE_REQUIRED",
              error: "Licença inválida, revogada ou expirada para atualização na nuvem.",
            });
          }
        }
        const manifest = store.update_manifests?.[channel] || null;
        if (!manifest) {
          return sendJson(res, 200, {
            ok: true,
            channel,
            updateAvailable: false,
            version: null,
            securityInvariants: {
              watchdogRequired: true,
              appOnlyClosedRequired: true,
              forbidPaidFallbackFromClaude: true,
              forbidKeygenAdminModules: true,
            },
          });
        }
        return sendJson(res, 200, { ok: true, channel, updateAvailable: true, ...manifest });
      }

      // 8b) Cloud Update Delta Download: GET /api/updates/download
      if (method === "GET" && pathname === "/api/updates/download") {
        const channel = String(searchParams.get("channel") || "").trim().toLowerCase();
        const version = String(searchParams.get("version") || "").trim();
        if (!ALLOWED_UPDATE_CHANNELS.has(channel)) {
          return sendJson(res, 400, {
            ok: false,
            code: "INVALID_CHANNEL",
            error: "Canal de update inválido.",
          });
        }
        if (!UPDATE_VERSION_RE.test(version)) {
          return sendJson(res, 400, {
            ok: false,
            code: "INVALID_VERSION",
            error: "Versão inválida para download de atualização.",
          });
        }

        const rawKey = String(req.headers["x-badclaude-license"] || searchParams.get("key") || "").trim();
        if (!rawKey) {
          return sendJson(res, 403, {
            ok: false,
            code: "LICENSE_REQUIRED",
            error: "Chave de licença obrigatória para baixar atualização.",
          });
        }

        const edCheck = verifyEd25519LicenseKey(rawKey, licensePublicKeyPem);
        if (edCheck.isEd25519Format && !edCheck.ok) {
          return sendJson(res, 403, {
            ok: false,
            code: edCheck.code,
            error: edCheck.error,
          });
        }

        const store = await readStore();
        const lic = findLicenseByKey(store.licenses, rawKey);
        if (!lic && !edCheck.ok) {
          return sendJson(res, 403, {
            ok: false,
            code: "INVALID_LICENSE",
            error: "Chave de licença inválida.",
          });
        }
        if (lic && lic.revoked) {
          return sendJson(res, 403, {
            ok: false,
            code: "LICENSE_REVOKED",
            error: "Esta licença foi revogada pelo emissor.",
          });
        }
        if (lic && Date.parse(lic.expires_at) <= Date.now()) {
          return sendJson(res, 403, {
            ok: false,
            code: "LICENSE_EXPIRED",
            error: "Licença expirada.",
          });
        }

        const effectiveTier =
          lic?.tier || (lic?.edition ? EDITION_PLANS[lic.edition]?.tier || lic.edition : null) || edCheck.tier;
        if (!tierCanAccessUpdateChannel(effectiveTier, channel)) {
          return sendJson(res, 403, {
            ok: false,
            code: "CHANNEL_TIER_FORBIDDEN",
            error: "Seu plano de licença não permite acesso a este canal de atualização.",
          });
        }

        const fileName = `delta-${channel}-${version}.zip`;
        let targetPath = null;
        let fileSize = 0;
        try {
          const realReleasesRoot = await fs.promises.realpath(releasesDir);
          const candidate = path.resolve(realReleasesRoot, "deltas", fileName);
          if (candidate.startsWith(`${realReleasesRoot}${path.sep}`)) {
            const realTarget = await fs.promises.realpath(candidate);
            if (realTarget.startsWith(`${realReleasesRoot}${path.sep}`)) {
              const stat = await fs.promises.stat(realTarget);
              if (stat.isFile()) {
                targetPath = realTarget;
                fileSize = stat.size;
              }
            }
          }
        } catch (_err) {
          targetPath = null;
        }

        if (!targetPath) {
          return sendJson(res, 404, {
            ok: false,
            code: "UPDATE_BUNDLE_NOT_FOUND",
            error: "Pacote de atualização não encontrado para este canal e versão.",
          });
        }

        streamZipFile(res, targetPath, fileName, fileSize, "Falha ao ler pacote de atualização.");
        return;
      }

      // 9) POST /api/superbad/license/validate
      if (method === "POST" && pathname === "/api/superbad/license/validate") {
        const body = await readJsonBody(req);
        const rawKey = String(body.license_key || "").trim();
        if (!rawKey || rawKey.length > 600) {
          return sendJson(res, 400, { ok: false, error: "Informe uma chave de licença válida." });
        }

        const edCheck = verifyEd25519LicenseKey(rawKey, licensePublicKeyPem);
        if (edCheck.isEd25519Format && !edCheck.ok) {
          return sendJson(res, edCheck.code === "LICENSE_EXPIRED" ? 403 : 401, { ok: false, error: edCheck.error });
        }

        const store = await readStore();
        let license = findLicenseByKey(store.licenses, rawKey);
        if (!license && edCheck.ok) {
          const edEdition = edCheck.tier === "founder" ? "founder" : edCheck.tier === "client-basic" ? "basic" : "superbad";
          const token = signToken(
            { lid: `ED-${edCheck.keyPrefix}`, ed: edEdition, exp: Date.now() + DOWNLOAD_TOKEN_TTL_MS, jti: crypto.randomBytes(8).toString("hex") },
            downloadSecret
          );
          return sendJson(res, 200, {
            ok: true,
            edition: edEdition,
            tier: edCheck.tier,
            expires_at: edCheck.expiresAt,
            downloads_remaining: 10,
            download_url: `/api/superbad/download?token=${encodeURIComponent(token)}`,
          });
        }
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

      // 10) GET /api/superbad/download?token=...
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
                message: "Licença válida, mas o pacote privado desta edição ainda não foi disponibilizado no servidor.",
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
      const message = status >= 500 ? "Erro interno no serviço SuperBad." : err.message || "Requisição inválida.";
      return sendJson(res, status, { ok: false, error: message });
    }
  }

  return {
    handleApi,
    EDITION_PLANS,
    releasesDir,
    storeFile,
  };
}

module.exports = {
  createSuperbadSalesApi,
  EDITION_PLANS,
  verifyEd25519LicenseKey,
  buildPixBrCode,
  hashScrypt,
  verifyScrypt,
};
