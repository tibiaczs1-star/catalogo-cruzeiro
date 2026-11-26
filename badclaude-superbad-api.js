"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const tls = require("node:tls");
const DefaultQRCode = require("qrcode");

const PIX_DISPLAY_KEY = "68 99226-9296";
const PIX_RECIPIENT = "Raiane Leoncio";
const PIX_CITY = "CRUZEIRO DO SUL";
const DEFAULT_PIX_EMV_KEY = "+5568992269296";
const DEFAULT_WHATSAPP = "5568992269296";
const SESSION_COOKIE_NAME = "superbad_admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const DOWNLOAD_TOKEN_TTL_MS = 15 * 60 * 1000;
const MAX_JSON_BYTES = 256 * 1024;
const MAX_RECEIPT_JSON_BYTES = 4 * 1024 * 1024;
const MAX_RECEIPT_FILE_BYTES = 3 * 1024 * 1024;
const DEFAULT_MAX_RELEASE_BYTES = 15 * 1024 * 1024;
const MAX_HEARTBEAT_TOKENS = 50_000_000_000;
const MAX_HEARTBEAT_REQUESTS = 100_000_000;
const DEFAULT_PUBLIC_STATS_CACHE_TTL_MS = 10 * 1000;
const LICENSE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const ALLOWED_RECEIPT_MIMES = Object.freeze({
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
});

// Tabela de referência medida para cálculo transparente de economia dos clientes:
// Preço blended comercial (input + output) de APIs frontier medidas: US$ 9,00 / 1M tokens
// Câmbio de referência: R$ 5,80 -> R$ 52,20 por 1 milhão de tokens processados.
const PRICING_REFERENCE = Object.freeze({
  metered_blended_usd_per_1m_tokens: 9.0,
  usd_brl: 5.8,
  metered_blended_brl_per_1m_tokens: 52.2,
});

const TELEMETRY_PROFILES = Object.freeze({
  demo: { profile: "demo", label: "Demo 1h Grátis", planCostBrl: 0 },
  infinito: { profile: "infinito", label: "OpenInfinite Windows (R$ 99)", planCostBrl: 99 },
  pro: { profile: "pro", label: "OpenInfinite Pro Multi-OS + Hermes (R$ 159)", planCostBrl: 159 },
  infinite_claude: { profile: "infinite_claude", label: "InfiniteClaude v6.2 Multi-OS + Claude Code (R$ 199)", planCostBrl: 199 },
  infinite_max: { profile: "infinite_max", label: "InfiniteClaude v6.2 Max Multi-CLI (R$ 249)", planCostBrl: 249 },
  superbad: { profile: "superbad", label: "Cockpit Pro SuperBad (R$ 350)", planCostBrl: 350 },
  founder: { profile: "founder", label: "Fundador VIP (R$ 690)", planCostBrl: 690 },
  editor: { profile: "editor", label: "Editor Master", planCostBrl: 0 },
});
const TELEMETRY_PROFILE_ORDER = Object.freeze(["demo", "infinito", "pro", "infinite_claude", "infinite_max", "superbad", "founder", "editor"]);

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
  infinite: {
    edition: "infinite",
    tier: "infinite-basic",
    tierCode: "INF",
    label: "OpenInfinite Windows (1 Mês)",
    amountCentavos: 9_900,
    amountDisplay: "R$ 99,00",
    defaultDays: 30,
    defaultMaxHwids: 1,
    unlockedModes: ["essential"],
    freeProvidersIncluded: ["infinite-gateway"],
    summary: "Painel completo para Windows (1 PC · 30 dias), Motor Infinite AI com prioridade HY4 #1, renovação automática, auto-configuração e 3 temas.",
  },
  infinite_pro: {
    edition: "infinite_pro",
    tier: "infinite-pro",
    tierCode: "PRO",
    prefixFamily: "OI6",
    label: "OpenInfinite macOS & Multi (1 Mês)",
    amountCentavos: 15_900,
    amountDisplay: "R$ 159,00",
    defaultDays: 30,
    defaultMaxHwids: 2,
    unlockedModes: ["essential", "cockpit-pro"],
    freeProvidersIncluded: ["infinite-gateway", "turbo-auto"],
    summary: "OpenInfinite para macOS (MacBook/iMac/Mac mini), Windows e Ubuntu Linux VPS (até 2 máquinas · 30 dias), com Hermes Agent.",
  },
  infinite_claude: {
    edition: "infinite_claude",
    tier: "infinite-claude",
    tierCode: "PRO",
    prefixFamily: "IC6",
    label: "InfiniteClaude v6.2 Multi-OS + Claude Code (1 Mês)",
    amountCentavos: 19_900,
    amountDisplay: "R$ 199,00",
    defaultDays: 30,
    defaultMaxHwids: 3,
    unlockedModes: ["essential", "cockpit-pro", "claude-code-v1", "hermes-pro"],
    freeProvidersIncluded: ["infinite-gateway", "turbo-auto", "claude-code-bridge"],
    summary: "InfiniteClaude v6.2 nativo Windows, macOS Liquid Glass & Ubuntu VPS (até 3 máquinas · 30 dias), Motor Headless OpenCode Swap nos 4 perfis white-label, injeção direta no Claude Code (~/.claude/settings.json com infinite/coder, infinite/reasoning e infinite/fast) + OpenCode + Hermes Pro+.",
  },
  infinite_max: {
    edition: "infinite_max",
    tier: "infinite-max",
    tierCode: "MAX",
    prefixFamily: "IC6",
    label: "InfiniteClaude v6.2 Max Multi-CLI Total (1 Mês)",
    amountCentavos: 24_900,
    amountDisplay: "R$ 249,00",
    defaultDays: 30,
    defaultMaxHwids: 5,
    unlockedModes: ["essential", "cockpit-pro", "claude-code-v1", "hermes-pro", "multi-cli-max"],
    freeProvidersIncluded: ["infinite-gateway", "turbo-auto", "claude-code-bridge", "multi-cli-total"],
    summary: "InfiniteClaude v6.2 Max Multi-OS (até 5 máquinas · 30 dias): Escada Multi-CLI total com auto-detecção e injeção em 1 clique no OpenCode, Claude Code, Hermes Agent (~/.hermes/config.yaml sem iniciar daemon), Local Harness e Codex CLI sobre Motor Headless OpenCode Swap.",
  },
});

const VALID_EDITIONS = new Set(Object.keys(EDITION_PLANS));
const PRIVATE_RELEASE_LIST_EDITIONS = Object.freeze([
  "basic",
  "mid",
  "beta",
  "superbad",
  "founder",
  "infinite",
  "infinite_pro",
  "infinite_claude",
  "infinite_max",
]);
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
  infinite: "OpenInfinite-Client-v6.1-Portable.zip",
  infinite_pro: "OpenInfinite-Client-v6.1-Portable.zip",
  infinite_claude: "InfiniteClaude-Client-v6.2-Portable.zip",
  infinite_max: "InfiniteClaude-Client-v6.2-Portable.zip",
};

const EDITION_RELEASE_FILES = {
  basic: ["BadClaude-Basic-Desktop.zip", "BadClaudio-Desktop-Beta.zip"],
  mid: ["BadClaude-Studio-Desktop.zip", "BadClaudio-Desktop-SuperBad.zip"],
  beta: ["BadClaudio-Desktop-Beta.zip", "Badclaude-Beta.zip", "BadClaudio-Beta.zip"],
  superbad: ["BadClaudio-Desktop-SuperBad.zip", "Badclaude-SuperBad.zip", "BadClaudio-SuperBad.zip"],
  founder: ["BadClaude-Founder-Desktop.zip", "BadClaude-Founder-v6.4-Portable.zip", "BadClaudio-Desktop-SuperBad.zip"],
  infinite: ["OpenInfinite-Client-v6.1-Portable.zip"],
  infinite_pro: ["OpenInfinite-Client-v6.1-Portable.zip"],
  infinite_claude: ["InfiniteClaude-Client-v6.2-Portable.zip", "OpenInfinite-Client-v6.1-Portable.zip"],
  infinite_max: ["InfiniteClaude-Client-v6.2-Portable.zip", "OpenInfinite-Client-v6.1-Portable.zip"],
};

const CODE_TO_TIER = Object.freeze({
  FND: "founder",
  MID: "client-mid",
  BSC: "client-basic",
  PRO: "infinite-pro",
  INF: "infinite-basic",
  MAX: "infinite-max",
});

function getUnlockedModesForTier(tier) {
  const clean = String(tier || "").trim().toLowerCase();
  if (clean === "founder" || clean === "fundador") {
    return ["essential", "badcode", "cockpit-pro", "founder-vip"];
  }
  if (clean === "infinite-max" || clean === "infinite-claude-max" || clean === "infinite_max") {
    return ["essential", "cockpit-pro", "claude-code-v1", "hermes-pro", "multi-cli-max"];
  }
  if (clean === "infinite-claude" || clean === "infinite_claude") {
    return ["essential", "cockpit-pro", "claude-code-v1", "hermes-pro"];
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
  if (["founder", "fundador", "fnd", "infinite_max", "infinite-max", "infinite-claude-max"].includes(clean)) return "founder";
  if (["superbad", "mid", "client-mid", "studio", "infinite_pro", "infinite-pro", "infinite_claude", "infinite-claude"].includes(clean)) return "client-mid";
  if (["basic", "client-basic", "beta", "client", "infinite", "infinite-basic"].includes(clean)) return "client-basic";
  return "client-mid";
}

function tierCanAccessUpdateChannel(tier, channel) {
  const rankMap = {
    "client-basic": 1,
    basic: 1,
    beta: 1,
    infinite: 1,
    "infinite-basic": 1,
    "client-mid": 2,
    mid: 2,
    superbad: 2,
    infinite_pro: 2,
    "infinite-pro": 2,
    infinite_claude: 2,
    "infinite-claude": 2,
    infinite_max: 3,
    "infinite-max": 3,
    "infinite-claude-max": 3,
    founder: 3,
    fundador: 3,
  };
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

async function readJsonBody(req, maxBytes = MAX_JSON_BYTES) {
  let total = 0;
  const chunks = [];
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
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

function deriveKeyPoolAesKey(secret) {
  return Buffer.from(
    crypto.hkdfSync(
      "sha256",
      Buffer.from(String(secret || ""), "utf8"),
      Buffer.from("superbad-key-pool-salt-v1", "utf8"),
      Buffer.from("aes-256-gcm-at-rest", "utf8"),
      32
    )
  );
}

function encryptLicenseKeyAtRest(plainKey, aesKey32) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", aesKey32, iv);
  const ct = Buffer.concat([cipher.update(String(plainKey), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `aes256gcm$${iv.toString("base64url")}$${tag.toString("base64url")}$${ct.toString("base64url")}`;
}

function decryptLicenseKeyAtRest(encoded, aesKey32) {
  if (typeof encoded !== "string" || !encoded.startsWith("aes256gcm$")) return null;
  const parts = encoded.split("$");
  if (parts.length !== 4) return null;
  try {
    const iv = Buffer.from(parts[1], "base64url");
    const tag = Buffer.from(parts[2], "base64url");
    const ct = Buffer.from(parts[3], "base64url");
    if (iv.length !== 12 || tag.length !== 16 || ct.length === 0) return null;
    const decipher = crypto.createDecipheriv("aes-256-gcm", aesKey32, iv);
    decipher.setAuthTag(tag);
    const out = Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
    return out || null;
  } catch {
    return null;
  }
}

function normalizeTelemetryProfile(rawProfile, fallbackEdition = "", fallbackTier = "") {
  const candidates = [rawProfile, fallbackEdition, fallbackTier]
    .map((v) => String(v || "").trim().toLowerCase())
    .filter(Boolean);
  for (const c of candidates) {
    if (c === "demo" || c === "trial" || c === "free") return "demo";
    if (["infinito", "infinite", "infinite-basic", "infinite_basic", "oi6-inf", "inf", "basic", "client-basic", "beta"].includes(c)) {
      return "infinito";
    }
    if (["infinite_max", "infinite-max", "infinite-claude-max", "infinite_claude_max", "ic6-max", "infinitemax"].includes(c)) {
      return "infinite_max";
    }
    if (["infinite_claude", "infinite-claude", "ic6-pro", "ic6", "infiniteclaude"].includes(c)) {
      return "infinite_claude";
    }
    if (["pro", "infinite-pro", "infinite_pro", "oi6-pro"].includes(c)) return "pro";
    if (["superbad", "client-mid", "mid", "studio"].includes(c)) return "superbad";
    if (["founder", "fundador", "fnd"].includes(c)) return "founder";
    if (["editor", "owner", "owner-master", "admin"].includes(c)) return "editor";
  }
  return "superbad";
}

function clampSafeInt(value, maxVal) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(maxVal, Math.floor(n));
}

function cleanE2eId(value) {
  return String(value ?? "")
    .trim()
    .replace(/[^A-Za-z0-9._:-]/g, "")
    .slice(0, 120);
}

function cleanEmailAddress(value) {
  const email = String(value ?? "").trim().toLowerCase().slice(0, 160);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function normalizePublicOrderStatus(rawStatus) {
  const s = String(rawStatus || "").trim().toLowerCase();
  if (s === "delivered") return "delivered";
  if (s === "approved") return "approved";
  if (s === "receipt_submitted") return "receipt_submitted";
  if (s === "awaiting_receipt") return "awaiting_receipt";
  return "pending_pix";
}

function verifyReceiptMagicBytes(buf, mime) {
  if (!Buffer.isBuffer(buf) || buf.length < 4) return false;
  if (mime === "image/png") {
    return (
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a
    );
  }
  if (mime === "image/jpeg") {
    return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (mime === "image/webp") {
    return (
      buf.length >= 12 &&
      buf.subarray(0, 4).toString("ascii") === "RIFF" &&
      buf.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  if (mime === "application/pdf") {
    return buf.length >= 5 && buf.subarray(0, 5).toString("ascii") === "%PDF-";
  }
  return false;
}

function parseReceiptAttachment(rawB64, rawMime, rawFilename) {
  const str = String(rawB64 || "").trim();
  if (!str) return null;

  let detectedMime = String(rawMime || "").trim().toLowerCase();
  let payloadB64 = str;
  const dataUrlMatch = str.match(/^data:([a-z0-9/+.-]+);base64,([\s\S]+)$/i);
  if (dataUrlMatch) {
    if (!detectedMime) detectedMime = dataUrlMatch[1].toLowerCase();
    payloadB64 = dataUrlMatch[2];
  }
  if (detectedMime === "image/jpg") detectedMime = "image/jpeg";

  const ext = ALLOWED_RECEIPT_MIMES[detectedMime];
  if (!ext) {
    const err = new Error("Tipo de comprovante inválido. Envie PNG, JPEG, WEBP ou PDF.");
    err.statusCode = 400;
    throw err;
  }

  const compactB64 = payloadB64.replace(/\s+/g, "");
  if (!compactB64 || !/^[A-Za-z0-9+/=_-]+$/.test(compactB64)) {
    const err = new Error("Conteúdo base64 do comprovante inválido.");
    err.statusCode = 400;
    throw err;
  }

  const normalizedB64 = compactB64.replace(/-/g, "+").replace(/_/g, "/");
  const buf = Buffer.from(normalizedB64, "base64");
  if (!buf.length) {
    const err = new Error("Arquivo de comprovante vazio.");
    err.statusCode = 400;
    throw err;
  }
  if (buf.length > MAX_RECEIPT_FILE_BYTES) {
    const err = new Error("Comprovante excede o limite máximo de 3 MB.");
    err.statusCode = 413;
    throw err;
  }
  if (!verifyReceiptMagicBytes(buf, detectedMime)) {
    const err = new Error("Comprovante inválido ou corrompido: assinatura binária não confere com PNG/JPEG/WEBP/PDF.");
    err.statusCode = 400;
    throw err;
  }

  const cleanOrigName = path
    .basename(String(rawFilename || `comprovante${ext}`))
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .slice(0, 80);

  return {
    buffer: buf,
    mime: detectedMime,
    ext,
    originalName: cleanOrigName || `comprovante${ext}`,
  };
}

function analyzeReceiptSubmission({ order, attachment, e2eId, receiptNote, existingOrders, nowIso }) {
  const sha256 = attachment
    ? crypto.createHash("sha256").update(attachment.buffer).digest("hex")
    : null;
  const others = (Array.isArray(existingOrders) ? existingOrders : []).filter(
    (o) => o && o.order_id !== order.order_id
  );
  const duplicateBySha = Boolean(
    sha256 &&
      others.some(
        (o) => o.receipt_file?.sha256 === sha256 || o.receipt_analysis?.sha256 === sha256
      )
  );
  const duplicateByE2e = Boolean(e2eId && others.some((o) => o.e2e_id && o.e2e_id === e2eId));
  const isDuplicate = duplicateBySha || duplicateByE2e;

  const e2eFormatOk = Boolean(e2eId && /^E[0-9A-Za-z]{31}$/.test(e2eId));
  const sampleSlice = attachment
    ? attachment.buffer.subarray(0, Math.min(attachment.buffer.length, 262144)).toString("latin1")
    : "";
  const searchable = `${receiptNote || ""} ${sampleSlice}`;
  const expectedDot = (Number(order.amount_centavos || 0) / 100).toFixed(2);
  const expectedComma = expectedDot.replace(".", ",");
  const amountHint =
    searchable.includes(expectedComma) || searchable.includes(expectedDot)
      ? order.amount_display
      : null;
  const receiverHint = /raiane|le(?:n)?oncio|99226[- ]?9296/i.test(searchable)
    ? "Raiane Leoncio"
    : null;

  let verdict = "note_pending_owner";
  if (isDuplicate) {
    verdict = "duplicate_detected";
  } else if (attachment && (e2eFormatOk || amountHint || receiverHint)) {
    verdict = "valid_match_pending_owner";
  } else if (attachment) {
    verdict = "valid_file_pending_owner";
  }

  const fmtLabel = attachment ? attachment.mime.split("/")[1].toUpperCase() : "Referência";
  const summaryPt = isDuplicate
    ? "⚠️ Alerta: este comprovante ou código E2E já apareceu em outro pedido e passará por conferência manual."
    : `Pré-análise concluída (${fmtLabel} íntegro${e2eFormatOk ? " · E2E BACEN válido" : ""}${amountHint ? " · " + amountHint : ""}). Aguardando ativação pelo dono no app central (imediata no WhatsApp ou em até 1 hora com envio ao seu e-mail).`;

  return {
    analyzed_at: nowIso,
    mime: attachment ? attachment.mime : null,
    size_bytes: attachment ? attachment.buffer.length : 0,
    sha256,
    magic_valid: attachment ? true : null,
    is_duplicate: isDuplicate,
    e2e_format_ok: e2eFormatOk,
    amount_hint: amountHint,
    receiver_hint: receiverHint,
    verdict,
    summary_pt: summaryPt,
  };
}

function sendSmtpsMail({ host, port = 465, user, pass, from, to, subject, text, html, timeoutMs = 12000 }) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host, port, servername: host, rejectUnauthorized: true });
    let buffer = "";
    let step = 0;
    let settled = false;

    const finish = (err, val) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket.destroy();
      } catch {}
      if (err) reject(err);
      else resolve(val);
    };

    const timer = setTimeout(() => finish(new Error("Timeout na conexão SMTPS.")), timeoutMs);
    socket.on("error", (err) => finish(err));
    socket.on("close", () => finish(new Error("Conexão SMTPS encerrada antes da confirmação.")));

    const wrapB64 = (str) =>
      Buffer.from(String(str || ""), "utf8")
        .toString("base64")
        .replace(/.{1,76}/g, "$&\r\n")
        .replace(/\r\n$/, "");
    const safeHdr = (val) => String(val || "").replace(/[\r\n]+/g, " ").trim();
    const safeTo = safeHdr(to);
    const boundary = `b_${crypto.randomBytes(8).toString("hex")}`;
    const encodedSubject = `=?UTF-8?B?${Buffer.from(safeHdr(subject), "utf8").toString("base64")}?=`;
    const fromHeader = from && from.includes("<") ? safeHdr(from) : `OpenInfinite Oficial <${safeHdr(user)}>`;
    const mimeMsg = [
      `From: ${fromHeader}`,
      `To: <${safeTo}>`,
      `Subject: ${encodedSubject}`,
      `Date: ${new Date().toUTCString()}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      wrapB64(text || ""),
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      wrapB64(html || text || ""),
      `--${boundary}--`,
      ``,
    ]
      .join("\r\n")
      .replace(/^\./gm, "..");

    const sendLine = (line) => socket.write(`${line}\r\n`);

    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!/^\d{3} /.test(line)) continue;
        const code = Number(line.slice(0, 3));
        if (step === 0 && code === 220) {
          step = 1;
          sendLine("EHLO openinfinite.local");
        } else if (step === 1 && code === 250) {
          step = 2;
          sendLine("AUTH LOGIN");
        } else if (step === 2 && code === 334) {
          step = 3;
          sendLine(Buffer.from(String(user), "utf8").toString("base64"));
        } else if (step === 3 && code === 334) {
          step = 4;
          sendLine(Buffer.from(String(pass), "utf8").toString("base64"));
        } else if (step === 4 && code === 235) {
          step = 5;
          sendLine(`MAIL FROM:<${safeHdr(user)}>`);
        } else if (step === 5 && code === 250) {
          step = 6;
          sendLine(`RCPT TO:<${safeTo}>`);
        } else if (step === 6 && (code === 250 || code === 251)) {
          step = 7;
          sendLine("DATA");
        } else if (step === 7 && code === 354) {
          step = 8;
          socket.write(`${mimeMsg}\r\n.\r\n`);
        } else if (step === 8 && code === 250) {
          step = 9;
          sendLine("QUIT");
          finish(null, { ok: true, provider: "smtps" });
        } else {
          finish(new Error(`Erro SMTP (passo ${step}): ${line}`));
        }
      }
    });
  });
}

async function sendActivationEmail({
  to,
  buyerName,
  orderId,
  editionLabel,
  licenseKey,
  publicSiteUrl,
  environment = {},
  customSendEmail = null,
}) {
  const nowIso = new Date().toISOString();
  const cleanTo = cleanEmailAddress(to);
  const siteBase = String(
    publicSiteUrl || environment.SITE_URL || "https://catalogo-cruzeiro-web.onrender.com"
  ).replace(/\/+$/, "");
  const testUrl = `${siteBase}/openinfinite/checkout/?test_key=${encodeURIComponent(licenseKey)}#validador`;
  const subject = `Sua Chave Oficial Ativada — ${editionLabel} (${orderId})`;
  const greeting = buyerName ? `Olá, ${buyerName}!` : "Olá!";

  const text = [
    greeting,
    "",
    `Seu pagamento PIX do pedido ${orderId} (${editionLabel}) foi conferido e ativado!`,
    "",
    "SUA CHAVE OFICIAL (Ed25519):",
    licenseKey,
    "",
    "TESTAR E VALIDAR SUA CHAVE AGORA NO SITE:",
    testUrl,
    "",
    "Como ativar no aplicativo:",
    "1. Clique no link acima para confirmar que sua chave já consta ATIVA no servidor.",
    "2. Abra o aplicativo OpenInfinite no seu computador e cole a chave acima.",
    "",
    "Suporte direto WhatsApp: +55 68 99226-9296",
  ].join("\n");

  const html = `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:600px;color:#111;line-height:1.55;">
    <h2 style="color:#0f172a;margin-bottom:8px;">${greeting}</h2>
    <p>Seu pagamento PIX referente ao pedido <strong>${orderId}</strong> (<strong>${editionLabel}</strong>) foi conferido e sua licença oficial já está <strong>ATIVA</strong>.</p>
    <div style="background:#0f172a;color:#f8fafc;padding:14px;border-radius:8px;font-family:Consolas,monospace;font-size:13px;word-break:break-all;margin:16px 0;">${licenseKey}</div>
    <p><a href="${testUrl}" style="display:inline-block;background:#10b981;color:#052e16;font-weight:700;text-decoration:none;padding:11px 18px;border-radius:6px;">Testar Minha Chave Agora no Portal</a></p>
    <p style="font-size:12.5px;color:#475569;">Link direto do validador: <a href="${testUrl}">${testUrl}</a></p>
  </div>`;

  const gmailComposeUrl = cleanTo
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(cleanTo)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`
    : null;

  if (!cleanTo) {
    return {
      attempted: false,
      sent: false,
      provider: "none",
      to: null,
      test_url: testUrl,
      gmail_compose_url: null,
      at: nowIso,
      error: "Pedido sem e-mail vinculado.",
    };
  }

  try {
    if (typeof customSendEmail === "function") {
      const customRes = await customSendEmail({
        to: cleanTo,
        subject,
        text,
        html,
        orderId,
        editionLabel,
        licenseKey,
        testUrl,
      });
      return {
        attempted: true,
        sent: customRes?.sent !== false,
        provider: String(customRes?.provider || "custom-mailer"),
        to: cleanTo,
        test_url: testUrl,
        gmail_compose_url: gmailComposeUrl,
        at: nowIso,
        error: customRes?.error || null,
      };
    }

    const resendKey = String(environment.RESEND_API_KEY || "").trim();
    if (resendKey) {
      const fromAddr = String(environment.EMAIL_FROM || "OpenInfinite <onboarding@resend.dev>").trim();
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: fromAddr, to: [cleanTo], subject, text, html }),
      });
      if (!r.ok) throw new Error(`Resend HTTP ${r.status}`);
      return {
        attempted: true,
        sent: true,
        provider: "resend",
        to: cleanTo,
        test_url: testUrl,
        gmail_compose_url: gmailComposeUrl,
        at: nowIso,
        error: null,
      };
    }

    const brevoKey = String(environment.BREVO_API_KEY || "").trim();
    if (brevoKey) {
      const senderEmail = cleanEmailAddress(environment.EMAIL_FROM || environment.GMAIL_USER || "noreply@openinfinite.dev") || "noreply@openinfinite.dev";
      const r = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": brevoKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: { name: "OpenInfinite Oficial", email: senderEmail },
          to: [{ email: cleanTo, name: buyerName || cleanTo }],
          subject,
          textContent: text,
          htmlContent: html,
        }),
      });
      if (!r.ok) throw new Error(`Brevo HTTP ${r.status}`);
      return {
        attempted: true,
        sent: true,
        provider: "brevo",
        to: cleanTo,
        test_url: testUrl,
        gmail_compose_url: gmailComposeUrl,
        at: nowIso,
        error: null,
      };
    }

    const smtpUser = cleanEmailAddress(environment.GMAIL_USER || environment.SMTP_USER || "");
    const smtpPass = String(environment.GMAIL_APP_PASSWORD || environment.SMTP_PASS || "").replace(/\s+/g, "");
    const smtpHost = String(environment.SMTP_HOST || "smtp.gmail.com").trim();
    const smtpPort = Number(environment.SMTP_PORT || 465);
    if (smtpUser && smtpPass) {
      await sendSmtpsMail({
        host: smtpHost,
        port: smtpPort,
        user: smtpUser,
        pass: smtpPass,
        from: environment.EMAIL_FROM || `OpenInfinite Oficial <${smtpUser}>`,
        to: cleanTo,
        subject,
        text,
        html,
      });
      return {
        attempted: true,
        sent: true,
        provider: "gmail-smtps",
        to: cleanTo,
        test_url: testUrl,
        gmail_compose_url: gmailComposeUrl,
        at: nowIso,
        error: null,
      };
    }

    return {
      attempted: false,
      sent: false,
      provider: "unconfigured",
      to: cleanTo,
      test_url: testUrl,
      gmail_compose_url: gmailComposeUrl,
      at: nowIso,
      error: "SMTP/API de e-mail ainda não configurado; use o atalho Gmail Compose ou configure Senha de App no Dashboard Control.",
    };
  } catch (err) {
    return {
      attempted: true,
      sent: false,
      provider: "error",
      to: cleanTo,
      test_url: testUrl,
      gmail_compose_url: gmailComposeUrl,
      at: nowIso,
      error: String(err?.message || "Falha no envio de e-mail.").slice(0, 200),
    };
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
      : (edCheck.tier === "infinite-max" || edCheck.tier === "infinite-claude-max") ? "infinite_max"
      : edCheck.tier === "infinite-claude" ? "infinite_claude"
      : edCheck.tier === "infinite-pro" ? "infinite_pro"
      : edCheck.tier === "infinite-basic" ? "infinite"
      : (lblLower.includes("superbad") || lblLower.includes("cockpit")) ? "superbad" : "mid");
  const defaultMaxHwids = resolvedEdition === "infinite_max"
    ? 5
    : resolvedEdition === "infinite_claude"
      ? 3
      : (resolvedEdition === "superbad" || resolvedEdition === "infinite_pro") ? 2 : 1;
  return {
    license_id: `LIC-ED-${keySha.slice(0, 10).toUpperCase()}`,
    order_id: null,
    edition: resolvedEdition,
    tier: edCheck.tier,
    label: EDITION_PLANS[resolvedEdition]?.label || edCheck.label || edCheck.tier,
    email,
    key_prefix: edCheck.keyPrefix,
    key_hash: `sha256:${keySha}`,
    key_sha256: keySha,
    expires_at: edCheck.expiresAt,
    max_downloads: 10,
    downloads_used: 0,
    max_hwids: defaultMaxHwids,
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
  const m = rawKey.match(/^((?:(BC5)-(FND|MID|BSC)|(OI6)-(INF|PRO)|(IC6)-(PRO|MAX))-([A-Za-z0-9_-]+))\.([A-Za-z0-9_-]+)$/);
  if (!m) {
    return { ok: false, isEd25519Format: false, code: "INVALID_FORMAT", error: "Formato fora do padrão BC5/OI6/IC6." };
  }
  const signingInput = m[1];
  const prefixFamily = m[2] || m[4] || m[6];
  const tierCode = m[3] || m[5] || m[7];
  const payloadB64Url = m[8];
  const sigB64Url = m[9];
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
  const payloadTier = String(payload.tier || "").trim().toLowerCase();
  let expectedTier = CODE_TO_TIER[tierCode];
  if (prefixFamily === "IC6" && tierCode === "MAX") {
    expectedTier = "infinite-max";
    if (!["infinite-claude-max", "infinite-max", "infinite_max"].includes(payloadTier)) {
      return { ok: false, isEd25519Format: true, code: "TIER_MISMATCH", error: "Tier divergente para IC6-MAX." };
    }
  } else if (prefixFamily === "IC6") {
    expectedTier = "infinite-claude";
    if (!["infinite-claude", "infinite_claude", "infinite-pro"].includes(payloadTier)) {
      return { ok: false, isEd25519Format: true, code: "TIER_MISMATCH", error: "Tier divergente para IC6-PRO." };
    }
  } else if (!expectedTier || payloadTier !== expectedTier) {
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
  const resolvedEdition = cleanText(
    payload.edition || (prefixFamily === "IC6" ? (tierCode === "MAX" ? "infinite_max" : "infinite_claude") : ""),
    32
  ).toLowerCase();
  return {
    ok: !expired,
    isEd25519Format: true,
    valid: !expired,
    expired,
    code: expired ? "LICENSE_EXPIRED" : "VALID",
    error: expired ? "Licença Ed25519 expirada." : null,
    tier: expectedTier,
    tierCode,
    prefixFamily,
    edition: resolvedEdition,
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
    emvField("59", asciiClean(recipient, 25) || "RAIANE LEONCIO"),
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
  const prefix = edition === "beta" ? "BT" : edition === "superbad" ? "SB" : (edition === "infinite_claude" || edition === "infinite_max") ? "IC" : (plan.tierCode || "SB");
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
  function loadOrCreatePersistedSecret(fileName) {
    const filePath = path.join(dataDir, fileName);
    try {
      if (fs.existsSync(filePath)) {
        const existing = fs.readFileSync(filePath, "utf8").trim();
        if (existing.length >= 32) return existing;
      }
      fs.mkdirSync(dataDir, { recursive: true });
      const generated = crypto.randomBytes(32).toString("hex");
      fs.writeFileSync(filePath, generated + "\n", { encoding: "utf8", mode: 0o600 });
      return generated;
    } catch {
      return crypto.randomBytes(32).toString("hex");
    }
  }

  const sessionSecret =
    String(options.sessionSecret || environment.SUPERBAD_SESSION_SECRET || "").trim() ||
    loadOrCreatePersistedSecret(".superbad-session-secret");
  const downloadSecret =
    String(options.downloadSecret || environment.SUPERBAD_DOWNLOAD_SECRET || "").trim() ||
    loadOrCreatePersistedSecret(".superbad-download-secret");
  const keyPoolSecret =
    String(options.keyPoolSecret || environment.KEY_POOL_SECRET || options.downloadSecret || environment.SUPERBAD_DOWNLOAD_SECRET || "").trim() ||
    downloadSecret;
  const keyPoolAesKey = deriveKeyPoolAesKey(keyPoolSecret);
  const pixWebhookSecret = String(options.pixWebhookSecret || environment.PIX_WEBHOOK_SECRET || "").trim();
  const receiptsDir = path.join(dataDir, "superbad-receipts");
  const publicStatsCacheTtlMs =
    options.publicStatsCacheTtlMs !== undefined
      ? Math.max(0, Number(options.publicStatsCacheTtlMs))
      : DEFAULT_PUBLIC_STATS_CACHE_TTL_MS;
  let publicStatsCache = { expiresAt: 0, payload: null };

  const getAuthUserFn = typeof options.getAuthUser === "function" ? options.getAuthUser : () => null;
  const isGoogleAuthEnabledFn =
    typeof options.isGoogleAuthEnabled === "function"
      ? options.isGoogleAuthEnabled
      : () => Boolean(getGoogleClientId());
  const notifyOwnerWhatsAppFn =
    typeof options.notifyOwnerWhatsApp === "function" ? options.notifyOwnerWhatsApp : null;
  const customSendEmailFn = typeof options.sendEmail === "function" ? options.sendEmail : null;

  let cachedGoogleClientId = String(
    options.googleClientId || environment.GOOGLE_AUTH_CLIENT_ID || environment.PUBPAID_GOOGLE_CLIENT_ID || ""
  ).trim();
  try {
    if (fs.existsSync(storeFile)) {
      const bootRaw = JSON.parse(fs.readFileSync(storeFile, "utf8"));
      const storedCid = String(bootRaw?.auth_config?.google_client_id || "").trim();
      if (storedCid) cachedGoogleClientId = storedCid;
    }
  } catch {}

  function getGoogleClientId() {
    return String(
      cachedGoogleClientId ||
        environment.GOOGLE_AUTH_CLIENT_ID ||
        environment.PUBPAID_GOOGLE_CLIENT_ID ||
        ""
    ).trim();
  }

  function isCloudMailerConfigured() {
    return Boolean(
      customSendEmailFn ||
        environment.RESEND_API_KEY ||
        environment.BREVO_API_KEY ||
        ((environment.GMAIL_USER || environment.SMTP_USER) &&
          (environment.GMAIL_APP_PASSWORD || environment.SMTP_PASS))
    );
  }

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
          description: requestedEdition === "infinite_max"
            ? "INFINITECLAUDE MAX"
            : requestedEdition === "infinite_claude"
              ? "INFINITECLAUDE PRO"
              : `${requestedEdition.startsWith("infinite") ? "OPENINFINITE" : "BADCLAUDE"} ${requestedEdition.toUpperCase()}`,
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
        key_pool:
          parsed?.key_pool && typeof parsed.key_pool === "object" && !Array.isArray(parsed.key_pool)
            ? parsed.key_pool
            : {},
        pix_webhooks: Array.isArray(parsed?.pix_webhooks) ? parsed.pix_webhooks : [],
        auth_config:
          parsed?.auth_config && typeof parsed.auth_config === "object" && !Array.isArray(parsed.auth_config)
            ? parsed.auth_config
            : {},
      };
    } catch (_err) {
      return {
        version: 2,
        orders: [],
        licenses: [],
        network_nodes: [],
        update_manifests: {},
        key_pool: {},
        pix_webhooks: [],
        auth_config: {},
      };
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
      const hasOwnerHeader = Boolean(String(req?.headers?.["x-badclaude-owner-proof"] || "").trim());
      sendJson(res, hasOwnerHeader ? 401 : 503, {
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

  function redactEmailDeliveryForStore(ed) {
    if (!ed || typeof ed !== "object") return null;
    return {
      attempted: Boolean(ed.attempted),
      sent: Boolean(ed.sent),
      provider: String(ed.provider || "none"),
      to: ed.to || null,
      at: ed.at || null,
      error: ed.error || null,
    };
  }

  function buildWhatsappImmediateUrl(order) {
    const plan = EDITION_PLANS[order.requested_edition];
    const editionLabel = plan ? plan.label : order.requested_edition;
    const parts = [
      `Olá! Enviei o comprovante do pedido ${order.order_id} (${editionLabel} · ${order.amount_display}) no site Infinite Zone.`,
      order.buyer_email ? `Conta Google: ${order.buyer_email}.` : `Nome: ${order.buyer_name}.`,
      order.buyer_whatsapp ? `Meu WhatsApp: ${order.buyer_whatsapp}.` : "",
      order.e2e_id ? `E2E: ${order.e2e_id}.` : "",
      "Pode verificar para ativação imediata da minha chave?",
    ].filter(Boolean);
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(parts.join(" "))}`;
  }

  function isOrderOwnedByGoogleUser(order, authUser) {
    if (!order || !authUser) return false;
    if (authUser.sub && order.google_sub && authUser.sub === order.google_sub) return true;
    const uEmail = cleanEmailAddress(authUser.email || "");
    if (!uEmail) return false;
    return (
      (order.google_email && cleanEmailAddress(order.google_email) === uEmail) ||
      (order.buyer_email && cleanEmailAddress(order.buyer_email) === uEmail)
    );
  }

  function serializeOrderForBuyer(order) {
    const publicStatus = normalizePublicOrderStatus(order.status);
    const canExposeKey = publicStatus === "approved" || publicStatus === "delivered";
    const unlockedLicenseKey =
      canExposeKey && order.encrypted_license_key
        ? decryptLicenseKeyAtRest(order.encrypted_license_key, keyPoolAesKey)
        : null;

    return {
      order_id: order.order_id,
      status: publicStatus,
      amount_centavos: order.amount_centavos,
      amount_display: order.amount_display,
      requested_edition: order.requested_edition,
      edition: order.edition || null,
      buyer_email: order.buyer_email || order.google_email || null,
      buyer_whatsapp: order.buyer_whatsapp || null,
      google_name: order.google_name || null,
      sla_minutes: 60,
      receipt_note: order.receipt_note || "",
      has_receipt_file: Boolean(order.receipt_file && order.receipt_file.filename),
      e2e_id: order.e2e_id || null,
      receipt_analysis: order.receipt_analysis || null,
      whatsapp_immediate_url: buildWhatsappImmediateUrl(order),
      email_delivery: order.email_delivery || null,
      license_key: canExposeKey ? unlockedLicenseKey : null,
      created_at: order.created_at,
      updated_at: order.updated_at,
    };
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
      buyer_whatsapp: order.buyer_whatsapp || null,
      buyer_email: order.buyer_email || order.google_email || null,
      google_name: order.google_name || null,
      google_picture: order.google_picture || null,
      payment_provider: order.payment_provider,
      receipt_note: order.receipt_note || "",
      e2e_id: order.e2e_id || null,
      has_receipt_file: Boolean(order.receipt_file && order.receipt_file.filename),
      receipt_mime: order.receipt_file?.mime || null,
      receipt_analysis: order.receipt_analysis || null,
      owner_whatsapp_alert: order.owner_whatsapp_alert || null,
      email_delivery: order.email_delivery || null,
      whatsapp_immediate_url: buildWhatsappImmediateUrl(order),
      key_delivered: Boolean(order.encrypted_license_key),
      webhook_verified: Boolean(order.webhook_verified || order.pix_verified),
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
      profile: normalizeTelemetryProfile(
        nodeData.profile || prev.profile || "",
        nodeData.edition || prev.edition || "",
        nodeData.tier || prev.tier || ""
      ),
      requests_count: Math.max(Number(prev.requests_count || 0), Number(nodeData.requests_count || 0)),
      tokens_est: Math.max(Number(prev.tokens_est || 0), Number(nodeData.tokens_est || 0)),
      tokens_total: Math.max(
        Number(prev.tokens_total ?? prev.tokens_est ?? 0),
        Number(nodeData.tokens_total ?? nodeData.tokens_est ?? 0)
      ),
      cache_tokens: Math.max(Number(prev.cache_tokens || 0), Number(nodeData.cache_tokens || 0)),
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

  function summarizeKeyPoolCounts(store) {
    const counts = {};
    let totalAvailable = 0;
    const nowMs = Date.now();
    for (const edition of VALID_EDITIONS) {
      const list = Array.isArray(store.key_pool?.[edition]) ? store.key_pool[edition] : [];
      const validCount = list.filter((item) => item && item.encrypted_key && Date.parse(item.expires_at) > nowMs).length;
      counts[edition] = validCount;
      totalAvailable += validCount;
    }
    return { counts, total_available: totalAvailable };
  }

  function reserveKeyFromPoolAndApproveOrder(store, order, { e2eId = null, nowIso = new Date().toISOString() } = {}) {
    const edition = String(order.requested_edition || "superbad").toLowerCase();
    const plan = EDITION_PLANS[edition] || EDITION_PLANS.superbad;
    if (!store.key_pool || typeof store.key_pool !== "object") store.key_pool = {};
    const poolList = Array.isArray(store.key_pool[edition]) ? store.key_pool[edition] : [];
    const nowMs = Date.now();

    let chosenItem = null;
    let plainKey = null;
    const remaining = [];
    for (const item of poolList) {
      if (!item || !item.encrypted_key) continue;
      if (Date.parse(item.expires_at) <= nowMs) continue;
      if (!chosenItem) {
        const dec = decryptLicenseKeyAtRest(item.encrypted_key, keyPoolAesKey);
        if (dec) {
          chosenItem = item;
          plainKey = dec;
          continue;
        }
      }
      remaining.push(item);
    }
    store.key_pool[edition] = remaining;

    if (!chosenItem || !plainKey) {
      return { approved: false, poolExhausted: true, licenseKey: null, license: null };
    }

    for (const existingLic of store.licenses) {
      if (existingLic.order_id === order.order_id && !existingLic.revoked) {
        existingLic.revoked = true;
        existingLic.revoked_at = nowIso;
      }
    }

    const licenseId = `LIC-POOL-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
    const license = {
      license_id: licenseId,
      order_id: order.order_id,
      edition,
      tier: chosenItem.tier || plan.tier,
      label: plan?.label || edition,
      email: order.buyer_contact || "",
      key_prefix: chosenItem.key_prefix || plainKey.slice(0, 10),
      key_hash: `sha256:${chosenItem.key_sha256}`,
      key_sha256: chosenItem.key_sha256,
      expires_at: chosenItem.expires_at,
      max_downloads: 10,
      downloads_used: 0,
      max_hwids: plan.defaultMaxHwids,
      bound_hwids: [],
      revoked: false,
      revoked_at: null,
      issued_origin: "key-pool-auto",
      last_seen_at: null,
      usage_requests: 0,
      usage_tokens: 0,
      created_at: nowIso,
      last_download_at: null,
    };
    store.licenses.push(license);

    order.status = "approved";
    order.edition = edition;
    order.license_id = licenseId;
    order.encrypted_license_key = chosenItem.encrypted_key;
    if (e2eId) order.e2e_id = e2eId;
    order.pix_verified = true;
    order.approved_at = nowIso;
    order.updated_at = nowIso;

    return { approved: true, poolExhausted: false, licenseKey: plainKey, license };
  }

  function buildAnonymousPublicStats(store) {
    const nowMs = Date.now();
    const activeNodes = (Array.isArray(store.network_nodes) ? store.network_nodes : []).filter((n) => !n?.revoked);

    const buckets = new Map();
    for (const profKey of TELEMETRY_PROFILE_ORDER) {
      buckets.set(profKey, {
        spec: TELEMETRY_PROFILES[profKey],
        clientsCount: 0,
        activeNow: 0,
        distinctAccounts: new Set(),
        totalTokens: 0,
        cacheTokens: 0,
        requests: 0,
      });
    }

    let totalTokensProcessed = 0;
    let totalCacheTokens = 0;
    let totalRequests = 0;
    let activeClientsNow = 0;

    for (let idx = 0; idx < activeNodes.length; idx += 1) {
      const n = activeNodes[idx];
      const profKey = normalizeTelemetryProfile(n.profile, n.edition, n.tier);
      const bucket = buckets.get(profKey) || buckets.get("superbad");
      const nodeTokens = clampSafeInt(n.tokens_total ?? n.tokens_est ?? 0, MAX_HEARTBEAT_TOKENS);
      const nodeCache = clampSafeInt(n.cache_tokens ?? 0, MAX_HEARTBEAT_TOKENS);
      const nodeReqs = clampSafeInt(n.requests_count ?? 0, MAX_HEARTBEAT_REQUESTS);
      const ageMs = nowMs - Date.parse(n.last_seen_at || 0);
      const isOnline = Number.isFinite(ageMs) && ageMs >= 0 && ageMs <= 5 * 60 * 1000;

      bucket.clientsCount += 1;
      if (isOnline) {
        bucket.activeNow += 1;
        activeClientsNow += 1;
      }
      // Agrupamento interno apenas em memória (nunca serializado) para não cobrar 2x o mesmo plano em multi-PC
      bucket.distinctAccounts.add(n.license_id || n.key_sha256 || `anon-${idx}`);
      bucket.totalTokens += nodeTokens;
      bucket.cacheTokens += nodeCache;
      bucket.requests += nodeReqs;

      totalTokensProcessed += nodeTokens;
      totalCacheTokens += nodeCache;
      totalRequests += nodeReqs;
    }

    const round2 = (v) => Math.round(v * 100) / 100;
    let savedBrlTotal = 0;

    const profiles = TELEMETRY_PROFILE_ORDER.map((profKey) => {
      const b = buckets.get(profKey);
      const meteredEquivalentBrl = round2(
        (b.totalTokens / 1_000_000) * PRICING_REFERENCE.metered_blended_brl_per_1m_tokens
      );
      const totalPlanCostBrl = b.distinctAccounts.size * b.spec.planCostBrl;
      const savedBrl = Math.max(0, round2(meteredEquivalentBrl - totalPlanCostBrl));
      savedBrlTotal = round2(savedBrlTotal + savedBrl);

      return {
        profile: b.spec.profile,
        label: b.spec.label,
        clients_count: b.clientsCount,
        active_now: b.activeNow,
        total_tokens: b.totalTokens,
        cache_tokens: b.cacheTokens,
        requests: b.requests,
        avg_tokens_per_client: b.clientsCount > 0 ? Math.round(b.totalTokens / b.clientsCount) : 0,
        metered_equivalent_brl: meteredEquivalentBrl,
        plan_cost_brl: b.spec.planCostBrl,
        saved_brl: savedBrl,
        avg_saved_brl_per_client: b.clientsCount > 0 ? round2(savedBrl / b.clientsCount) : 0,
      };
    });

    return {
      ok: true,
      updated_at: new Date(nowMs).toISOString(),
      pricing_reference: { ...PRICING_REFERENCE },
      totals: {
        total_tokens_processed: totalTokensProcessed,
        cache_tokens: totalCacheTokens,
        requests: totalRequests,
        active_clients_now: activeClientsNow,
        registered_client_nodes: activeNodes.length,
        saved_brl_total: savedBrlTotal,
      },
      total_tokens_processed: totalTokensProcessed,
      cache_tokens: totalCacheTokens,
      requests: totalRequests,
      active_clients_now: activeClientsNow,
      saved_brl_total: savedBrlTotal,
      profiles,
    };
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

      // 0c) GET /api/superbad/my-orders (Authenticated Google User Order History)
      if (method === "GET" && pathname === "/api/superbad/my-orders") {
        const authUser = getAuthUserFn(req);
        if (!authUser || (!authUser.sub && !authUser.email)) {
          return sendJson(res, 200, { ok: true, signed_in: false, user: null, orders: [] });
        }
        const store = await readStore();
        const myOrders = store.orders
          .filter((o) => isOrderOwnedByGoogleUser(o, authUser))
          .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
          .slice(0, 25)
          .map(serializeOrderForBuyer);
        return sendJson(res, 200, {
          ok: true,
          signed_in: true,
          user: {
            sub: authUser.sub || null,
            email: authUser.email || null,
            name: authUser.name || null,
            picture: authUser.picture || null,
          },
          orders: myOrders,
        });
      }

      // 1) POST /api/superbad/orders
      if (method === "POST" && pathname === "/api/superbad/orders") {
        const body = await readJsonBody(req);
        const authUser = getAuthUserFn(req);
        const googleEnabled = Boolean(isGoogleAuthEnabledFn(req));
        if (googleEnabled && (!authUser || !authUser.email)) {
          return sendJson(res, 401, {
            ok: false,
            code: "GOOGLE_AUTH_REQUIRED",
            error: "Entre com sua conta Google antes de gerar o pagamento PIX.",
          });
        }

        const googleSub = cleanText(authUser?.sub || "", 120) || null;
        const googleEmail = cleanEmailAddress(authUser?.email || "") || null;
        const googleName = cleanText(authUser?.name || "", 120) || null;
        const googlePicture = cleanText(authUser?.picture || "", 360) || null;
        const bodyBuyerEmail = cleanEmailAddress(body.buyer_email || "");
        const rawBuyerWhatsapp = cleanText(body.buyer_whatsapp || "", 40);
        const contactAsEmail = cleanEmailAddress(body.buyer_contact || "");
        const contactDigits = String(body.buyer_contact || "").replace(/\D/g, "");
        const fallbackWhatsapp =
          !contactAsEmail && contactDigits.length >= 10 ? cleanText(body.buyer_contact || "", 40) : "";
        const resolvedWhatsapp = rawBuyerWhatsapp || fallbackWhatsapp || null;
        const resolvedBuyerEmail = googleEmail || bodyBuyerEmail || contactAsEmail || null;

        const buyerName = cleanText(
          body.buyer_name || googleName || (resolvedBuyerEmail ? resolvedBuyerEmail.split("@")[0] : ""),
          120
        );
        const buyerContact = cleanText(
          body.buyer_contact || resolvedWhatsapp || resolvedBuyerEmail || googleEmail || "",
          160
        );
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
            error: `Edição solicitada inválida. Escolha uma de: ${Array.from(VALID_EDITIONS).join(", ")}.`,
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
          buyer_whatsapp: resolvedWhatsapp,
          buyer_email: resolvedBuyerEmail,
          google_sub: googleSub,
          google_email: googleEmail,
          google_name: googleName,
          google_picture: googlePicture,
          payment_provider: paymentInfo.payment_provider,
          txid,
          receipt_note: "",
          receipt_submitted_at: null,
          receipt_analysis: null,
          owner_whatsapp_alert: null,
          email_delivery: null,
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
            buyer_email: resolvedBuyerEmail,
            buyer_whatsapp: resolvedWhatsapp,
            google_name: googleName,
            sla_minutes: 60,
            pix: paymentInfo.pix,
            whatsapp_url: paymentInfo.whatsapp_url,
            whatsapp_immediate_url: buildWhatsappImmediateUrl(storedOrder),
            payment_provider: paymentInfo.payment_provider,
            created_at: now,
          },
        });
      }

      // 0b) Public Anonymous Telemetry Stats: GET /api/openinfinite/public-stats
      if (method === "GET" && pathname === "/api/openinfinite/public-stats") {
        const nowMs = Date.now();
        if (!publicStatsCache.payload || nowMs >= publicStatsCache.expiresAt) {
          const store = await readStore();
          publicStatsCache = {
            expiresAt: nowMs + publicStatsCacheTtlMs,
            payload: buildAnonymousPublicStats(store),
          };
        }
        return sendJson(res, 200, publicStatsCache.payload, {
          "Cache-Control": "public, max-age=10",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
        });
      }

      // 2) GET /api/superbad/orders/:orderId
      const orderGetMatch = pathname.match(/^\/api\/superbad\/orders\/([A-Za-z0-9_-]+)$/);
      if (method === "GET" && orderGetMatch) {
        const orderId = orderGetMatch[1];
        const secret = String(searchParams.get("order_secret") || req.headers["x-order-secret"] || "").trim();
        const authUser = getAuthUserFn(req);
        const store = await readStore();
        const order = store.orders.find((item) => item.order_id === orderId);
        const authorizedBySecret = verifyOrderSecret(order, secret);
        const authorizedByGoogle = !secret && isOrderOwnedByGoogleUser(order, authUser);
        if (!order || (!authorizedBySecret && !authorizedByGoogle)) {
          return sendJson(res, 403, { ok: false, error: "Acesso negado ao pedido." });
        }
        return sendJson(res, 200, { ok: true, order: serializeOrderForBuyer(order) });
      }

      // 3) POST /api/superbad/orders/:orderId/receipt (4 MB JSON limit ONLY on this route; NEVER auto-approves!)
      const orderReceiptMatch = pathname.match(/^\/api\/superbad\/orders\/([A-Za-z0-9_-]+)\/receipt$/);
      if (method === "POST" && orderReceiptMatch) {
        const orderId = orderReceiptMatch[1];
        const body = await readJsonBody(req, MAX_RECEIPT_JSON_BYTES);
        const secret = String(body.order_secret || req.headers["x-order-secret"] || "").trim();
        const authUser = getAuthUserFn(req);
        const receiptNote = cleanText(body.receipt_note, 500);
        const e2eId = cleanE2eId(body.e2e_id);
        const overrideEmail = cleanEmailAddress(body.buyer_email || "");
        const overrideWhatsapp = cleanText(body.buyer_whatsapp || "", 40);
        const attachment = parseReceiptAttachment(
          body.receipt_file_b64,
          body.receipt_file_mime,
          body.receipt_file_name
        );

        if (!receiptNote && !e2eId && !attachment) {
          return sendJson(res, 400, {
            ok: false,
            error: "Informe a observação, o código E2E PIX ou anexe a imagem/PDF do comprovante.",
          });
        }

        const lockOutcome = await withStoreLock(async () => {
          const store = await readStore();
          const order = store.orders.find((item) => item.order_id === orderId);
          const authorizedBySecret = verifyOrderSecret(order, secret);
          const authorizedByGoogle = !secret && isOrderOwnedByGoogleUser(order, authUser);
          if (!order || (!authorizedBySecret && !authorizedByGoogle)) {
            return { status: 403, payload: { ok: false, error: "Acesso negado ao pedido." } };
          }
          if (order.status === "approved" || order.status === "delivered") {
            return { status: 409, payload: { ok: false, error: "Pedido já aprovado." } };
          }

          const now = new Date().toISOString();
          if (overrideEmail && !order.buyer_email) {
            order.buyer_email = overrideEmail;
          }
          if (overrideWhatsapp) {
            order.buyer_whatsapp = overrideWhatsapp;
            if (!order.buyer_contact || cleanEmailAddress(order.buyer_contact)) {
              order.buyer_contact = overrideWhatsapp;
            }
          }
          if (authUser?.email && !order.buyer_email) {
            order.buyer_email = cleanEmailAddress(authUser.email) || null;
          }

          const analysis = analyzeReceiptSubmission({
            order,
            attachment,
            e2eId,
            receiptNote,
            existingOrders: store.orders,
            nowIso: now,
          });

          if (attachment) {
            await fs.promises.mkdir(receiptsDir, { recursive: true });
            const realReceiptsRoot = await fs.promises.realpath(receiptsDir);
            const storedFilename = `${order.order_id}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${attachment.ext}`;
            const targetPath = path.resolve(realReceiptsRoot, storedFilename);
            if (!targetPath.startsWith(`${realReceiptsRoot}${path.sep}`)) {
              return { status: 400, payload: { ok: false, error: "Caminho de comprovante inválido." } };
            }
            await writeFileAtomic(targetPath, attachment.buffer);
            order.receipt_file = {
              filename: storedFilename,
              original_name: attachment.originalName,
              mime: attachment.mime,
              size_bytes: attachment.buffer.length,
              sha256: analysis.sha256,
              saved_at: now,
            };
          }

          if (receiptNote) {
            order.receipt_note = receiptNote;
          } else if (!order.receipt_note) {
            order.receipt_note = e2eId ? `PIX E2E: ${e2eId}` : `Arquivo anexado (${attachment.originalName})`;
          }
          if (e2eId) {
            order.e2e_id = e2eId;
          }
          order.receipt_analysis = analysis;
          order.receipt_submitted_at = now;
          // REGRA DE OURO DO DONO: NUNCA auto-libera chave no envio do comprovante!
          order.status = "receipt_submitted";
          order.updated_at = now;

          await writeStore(store);
          return { status: 200, orderSnapshot: { ...order }, analysis };
        });

        if (lockOutcome.status !== 200) {
          return sendJson(res, lockOutcome.status, lockOutcome.payload);
        }

        const ordSnap = lockOutcome.orderSnapshot;
        const analysis = lockOutcome.analysis;
        const nowAlertIso = new Date().toISOString();
        let ownerAlert = {
          attempted: false,
          sent: false,
          provider: "none",
          at: nowAlertIso,
          reason: "not-configured",
        };
        const alertMsg = [
          `🔔 [Infinite Zone PIX] Comprovante enviado!`,
          `Pedido: ${ordSnap.order_id} (${ordSnap.requested_edition} · ${ordSnap.amount_display})`,
          `Cliente: ${ordSnap.buyer_name}${ordSnap.buyer_email ? " <" + ordSnap.buyer_email + ">" : ""}${ordSnap.buyer_whatsapp ? " | WhatsApp: " + ordSnap.buyer_whatsapp : ""}`,
          analysis.is_duplicate ? `⚠️ ALERTA: Comprovante/E2E DUPLICADO!` : `Análise: ${analysis.verdict}`,
          `Abra o Dashboard Control -> Pedidos PIX para ver o comprovante e clicar em Ativar & Enviar E-mail.`,
        ].join("\n");

        if (notifyOwnerWhatsAppFn) {
          try {
            const whOut = await notifyOwnerWhatsAppFn({
              to: whatsappNumber,
              message: alertMsg,
              order: ordSnap,
              analysis,
            });
            ownerAlert = {
              attempted: whOut?.attempted !== false,
              sent: Boolean(whOut?.sent),
              provider: String(whOut?.provider || "whatsapp-hook"),
              at: whOut?.at || nowAlertIso,
              reason: String(whOut?.reason || (whOut?.sent ? "sent" : "skipped")),
            };
          } catch (err) {
            ownerAlert = {
              attempted: true,
              sent: false,
              provider: "whatsapp-hook",
              at: nowAlertIso,
              reason: String(err?.message || "error").slice(0, 120),
            };
          }
        }

        await withStoreLock(async () => {
          const store = await readStore();
          const ord = store.orders.find((o) => o.order_id === orderId);
          if (ord) {
            ord.owner_whatsapp_alert = ownerAlert;
            await writeStore(store);
          }
        });

        const whatsappImmediateUrl = buildWhatsappImmediateUrl(ordSnap);
        return sendJson(res, 200, {
          ok: true,
          order_id: ordSnap.order_id,
          status: "receipt_submitted",
          auto_approved: false,
          awaiting_owner_activation: true,
          sla_minutes: 60,
          edition: ordSnap.requested_edition,
          buyer_email: ordSnap.buyer_email || null,
          buyer_whatsapp: ordSnap.buyer_whatsapp || null,
          receipt_analysis: analysis,
          owner_whatsapp_alert: ownerAlert,
          whatsapp_immediate_url: whatsappImmediateUrl,
          message_pt:
            "Comprovante em análise! Fale no WhatsApp para ativação imediata ou aguarde até 1 hora — assim que ativarmos no painel central, sua chave chegará no seu e-mail.",
          order: {
            order_id: ordSnap.order_id,
            status: "receipt_submitted",
            receipt_note: ordSnap.receipt_note,
            e2e_id: ordSnap.e2e_id || null,
            has_receipt_file: Boolean(ordSnap.receipt_file && ordSnap.receipt_file.filename),
            buyer_email: ordSnap.buyer_email || null,
            buyer_whatsapp: ordSnap.buyer_whatsapp || null,
            sla_minutes: 60,
            receipt_analysis: analysis,
            whatsapp_immediate_url: whatsappImmediateUrl,
          },
        });
      }

      // 3b) POST /api/superbad/webhooks/pix (authenticated with PIX_WEBHOOK_SECRET + timingSafeEqual)
      if (method === "POST" && pathname === "/api/superbad/webhooks/pix") {
        if (!pixWebhookSecret) {
          return sendJson(res, 503, { ok: false, error: "PIX_WEBHOOK_SECRET não configurado no servidor." });
        }
        const authHeader = String(req.headers.authorization || "").trim();
        const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
          ? authHeader.slice(7).trim()
          : "";
        const providedSecret = String(req.headers["x-pix-webhook-secret"] || bearerToken || "").trim();
        if (!providedSecret || !timingSafeEqualText(providedSecret, pixWebhookSecret)) {
          return sendJson(res, 401, { ok: false, error: "Credencial do webhook PIX inválida." });
        }

        const body = await readJsonBody(req);
        const firstPix = Array.isArray(body.pix) && body.pix[0] && typeof body.pix[0] === "object" ? body.pix[0] : null;
        const e2eId = cleanE2eId(body.e2e_id || body.endToEndId || firstPix?.endToEndId || "");
        if (!e2eId) {
          return sendJson(res, 400, { ok: false, error: "e2e_id é obrigatório no webhook PIX." });
        }

        const txid = cleanText(body.txid || firstPix?.txid || "", 64) || null;
        const orderIdHint = cleanText(body.order_id || "", 64) || null;
        let amountCentavos = null;
        if (body.amount_centavos !== undefined && body.amount_centavos !== null && body.amount_centavos !== "") {
          amountCentavos = Math.round(Number(body.amount_centavos));
        } else {
          const rawBrl = body.amount_brl ?? body.valor ?? firstPix?.valor;
          if (rawBrl !== undefined && rawBrl !== null && rawBrl !== "") {
            amountCentavos = Math.round(Number(String(rawBrl).replace(",", ".")) * 100);
          }
        }
        if (amountCentavos !== null && (!Number.isFinite(amountCentavos) || amountCentavos <= 0)) {
          return sendJson(res, 400, { ok: false, error: "Valor do pagamento PIX inválido." });
        }

        const outcome = await withStoreLock(async () => {
          const store = await readStore();
          if (!Array.isArray(store.pix_webhooks)) store.pix_webhooks = [];

          const existingWh = store.pix_webhooks.find((w) => w && w.e2e_id === e2eId);
          if (existingWh && existingWh.matched_order_id) {
            const prevOrd = store.orders.find((o) => o.order_id === existingWh.matched_order_id);
            return {
              status: 200,
              payload: {
                ok: true,
                matched: true,
                idempotent: true,
                order_id: existingWh.matched_order_id,
                status: prevOrd ? normalizePublicOrderStatus(prevOrd.status) : "approved",
              },
            };
          }

          const nowIso = new Date().toISOString();
          let whRecord = existingWh;
          if (!whRecord) {
            whRecord = {
              e2e_id: e2eId,
              amount_centavos: amountCentavos,
              txid,
              order_id: orderIdHint,
              received_at: nowIso,
              matched_order_id: null,
              matched_at: null,
            };
            store.pix_webhooks.unshift(whRecord);
            if (store.pix_webhooks.length > 1000) {
              store.pix_webhooks = store.pix_webhooks.slice(0, 1000);
            }
          } else {
            if (amountCentavos !== null) whRecord.amount_centavos = amountCentavos;
            if (txid) whRecord.txid = txid;
            if (orderIdHint) whRecord.order_id = orderIdHint;
          }

          const candidate = store.orders.find((o) => {
            if (!o || o.status === "approved" || o.status === "delivered") return false;
            if (amountCentavos !== null && Number(o.amount_centavos) !== amountCentavos) return false;
            return Boolean(
              (orderIdHint && o.order_id === orderIdHint) ||
                (txid && o.txid && o.txid === txid) ||
                (o.e2e_id && o.e2e_id === e2eId) ||
                (o.receipt_note && o.receipt_note.includes(e2eId))
            );
          });

          if (!candidate) {
            await writeStore(store);
            return {
              status: 200,
              payload: {
                ok: true,
                matched: false,
                queued_for_match: true,
                e2e_id: e2eId,
              },
            };
          }

          candidate.pix_verified = true;
          candidate.webhook_verified = true;
          candidate.webhook_verified_at = nowIso;
          candidate.e2e_id = e2eId;
          candidate.updated_at = nowIso;
          whRecord.matched_order_id = candidate.order_id;
          whRecord.matched_at = nowIso;
          await writeStore(store);

          return {
            status: 200,
            payload: {
              ok: true,
              matched: true,
              webhook_verified: true,
              auto_approved: false,
              awaiting_owner_activation: true,
              order_id: candidate.order_id,
              status: normalizePublicOrderStatus(candidate.status),
              license_id: candidate.license_id || null,
            },
          };
        });

        return sendJson(res, outcome.status, outcome.payload);
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
            pendingOrders: orders.filter((o) => !["approved", "delivered", "cancelled", "rejected"].includes(o.status)).length,
            watchdogAlerts: nodes.filter((n) => n.watchdog_ok === false).length,
          },
          network_nodes: nodes,
          orders,
          licenses,
          key_pool: summarizeKeyPoolCounts(store),
          auth_config: {
            google_client_id: getGoogleClientId(),
            email_configured: isCloudMailerConfigured(),
          },
          update_manifests: store.update_manifests || {},
          serverTime: new Date().toISOString(),
        });
      }

      if (method === "GET" && pathname === "/api/superbad/admin/auth-config") {
        if (!requireAdminOrOwnerProof(req, res, method, pathname)) return;
        return sendJson(res, 200, {
          ok: true,
          google_client_id: getGoogleClientId(),
          google_auth_enabled: Boolean(isGoogleAuthEnabledFn(req)),
          email_configured: isCloudMailerConfigured(),
        });
      }

      if (method === "POST" && pathname === "/api/superbad/admin/auth-config") {
        if (!requireAdminOrOwnerProof(req, res, method, pathname)) return;
        const body = await readJsonBody(req);
        const rawCid = cleanText(body.google_client_id ?? body.googleClientId ?? "", 220);
        if (rawCid && !/^[A-Za-z0-9._-]{8,220}$/.test(rawCid)) {
          return sendJson(res, 400, { ok: false, error: "Formato de Google Client ID inválido." });
        }
        await withStoreLock(async () => {
          const store = await readStore();
          if (!store.auth_config || typeof store.auth_config !== "object") store.auth_config = {};
          store.auth_config.google_client_id = rawCid;
          store.auth_config.updated_at = new Date().toISOString();
          cachedGoogleClientId = rawCid;
          await writeStore(store);
        });
        return sendJson(res, 200, {
          ok: true,
          google_client_id: getGoogleClientId(),
          google_auth_enabled: Boolean(isGoogleAuthEnabledFn(req)),
          email_configured: isCloudMailerConfigured(),
        });
      }

      if (method === "GET" && pathname === "/api/superbad/admin/key-pool") {
        if (!requireAdminOrOwnerProof(req, res, method, pathname)) return;
        const store = await readStore();
        return sendJson(res, 200, { ok: true, ...summarizeKeyPoolCounts(store) });
      }

      if (method === "POST" && pathname === "/api/superbad/admin/key-pool/stock") {
        if (!requireAdminOrOwnerProof(req, res, method, pathname)) return;
        const body = await readJsonBody(req);
        const edition = String(body.edition || "").trim().toLowerCase();
        if (!VALID_EDITIONS.has(edition)) {
          return sendJson(res, 400, { ok: false, error: "Edição inválida para estoque de chaves." });
        }
        const rawKeys = Array.isArray(body.keys) ? body.keys : [];
        if (rawKeys.length === 0 || rawKeys.length > 500) {
          return sendJson(res, 400, { ok: false, error: "Envie entre 1 e 500 chaves assinadas no lote." });
        }

        const expectedPlan = EDITION_PLANS[edition];
        const validatedBatch = [];
        for (const candidateRaw of rawKeys) {
          const cleanKey = String(candidateRaw || "").trim();
          const edCheck = verifyEd25519LicenseKey(cleanKey, licensePublicKeyPem);
          if (!edCheck.ok) {
            return sendJson(res, 400, {
              ok: false,
              error: `Chave Ed25519 inválida ou expirada no lote (${edCheck.code}): ${edCheck.error}`,
            });
          }
          if (edCheck.tier !== expectedPlan.tier) {
            return sendJson(res, 400, {
              ok: false,
              error: `Tier da chave (${edCheck.tier}) incompatível com a edição "${edition}" (${expectedPlan.tier}).`,
            });
          }
          if (edCheck.edition && edCheck.edition !== edition) {
            return sendJson(res, 400, {
              ok: false,
              error: `Edição da chave (${edCheck.edition}) incompatível com "${edition}".`,
            });
          }
          validatedBatch.push({
            cleanKey,
            edCheck,
          });
        }

        const stockResult = await withStoreLock(async () => {
          const store = await readStore();
          if (!store.key_pool || typeof store.key_pool !== "object") store.key_pool = {};
          if (!Array.isArray(store.key_pool[edition])) store.key_pool[edition] = [];

          const existingShas = new Set();
          for (const lic of store.licenses) {
            if (lic?.key_sha256) existingShas.add(lic.key_sha256);
          }
          for (const edKey of Object.keys(store.key_pool)) {
            for (const item of store.key_pool[edKey] || []) {
              if (item?.key_sha256) existingShas.add(item.key_sha256);
            }
          }

          const nowIso = new Date().toISOString();
          let stockedCount = 0;
          let skippedDuplicates = 0;

          for (const { cleanKey, edCheck } of validatedBatch) {
            if (existingShas.has(edCheck.keyHash)) {
              skippedDuplicates += 1;
              continue;
            }
            existingShas.add(edCheck.keyHash);
            store.key_pool[edition].push({
              pool_id: `POOL-${crypto.randomBytes(5).toString("hex").toUpperCase()}`,
              edition,
              tier: edCheck.tier,
              key_prefix: edCheck.keyPrefix,
              key_sha256: edCheck.keyHash,
              expires_at: edCheck.expiresAt,
              encrypted_key: encryptLicenseKeyAtRest(cleanKey, keyPoolAesKey),
              stocked_at: nowIso,
            });
            stockedCount += 1;
          }

          await writeStore(store);
          return {
            ok: true,
            edition,
            stocked_count: stockedCount,
            skipped_duplicates: skippedDuplicates,
            fulfilled_waiting_orders: 0,
            pool_available: store.key_pool[edition].length,
          };
        });

        return sendJson(res, 200, stockResult);
      }

      const adminReceiptFileMatch = pathname.match(
        /^\/api\/superbad\/admin\/orders\/([A-Za-z0-9_-]+)\/receipt(?:-file)?$/
      );
      if (method === "GET" && adminReceiptFileMatch) {
        if (!requireAdminOrOwnerProof(req, res, method, pathname)) return;
        const orderId = adminReceiptFileMatch[1];
        const store = await readStore();
        const order = store.orders.find((o) => o.order_id === orderId);
        if (!order || !order.receipt_file || !order.receipt_file.filename) {
          return sendJson(res, 404, { ok: false, error: "Comprovante não anexado neste pedido." });
        }
        try {
          const realReceiptsRoot = await fs.promises.realpath(receiptsDir);
          const safeName = path.basename(order.receipt_file.filename);
          const candidate = path.resolve(realReceiptsRoot, safeName);
          if (!candidate.startsWith(`${realReceiptsRoot}${path.sep}`)) {
            return sendJson(res, 403, { ok: false, error: "Acesso negado." });
          }
          const buf = await fs.promises.readFile(candidate);
          const inlineRequested = searchParams.get("disposition") === "inline";
          res.writeHead(200, {
            "Content-Type": order.receipt_file.mime || "application/octet-stream",
            "Content-Disposition": `${inlineRequested ? "inline" : "attachment"}; filename="${safeName}"`,
            "Content-Length": buf.length,
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "default-src 'none'; img-src 'self' data: blob:; style-src 'unsafe-inline'; sandbox",
          });
          res.end(buf);
          return;
        } catch {
          return sendJson(res, 404, { ok: false, error: "Arquivo do comprovante não encontrado em disco." });
        }
      }

      const deliverKeyMatch = pathname.match(/^\/api\/superbad\/admin\/orders\/([A-Za-z0-9_-]+)\/deliver-key$/);
      if (method === "POST" && deliverKeyMatch) {
        if (!requireAdminOrOwnerProof(req, res, method, pathname)) return;
        const orderId = deliverKeyMatch[1];
        const body = await readJsonBody(req);
        const rawProvidedKey = String(body.license_key || body.raw_license_key || "").trim();
        if (!rawProvidedKey) {
          return sendJson(res, 400, { ok: false, error: "Informe license_key assinada para entregar ao pedido." });
        }
        const edCheck = verifyEd25519LicenseKey(rawProvidedKey, licensePublicKeyPem);
        if (!edCheck.ok) {
          return sendJson(res, 400, { ok: false, error: edCheck.error || "Chave Ed25519 inválida." });
        }
        const keySha256 = edCheck.keyHash;
        const encryptedKey = encryptLicenseKeyAtRest(rawProvidedKey, keyPoolAesKey);
        const nowIso = new Date().toISOString();

        const deliverOutcome = await withStoreLock(async () => {
          const store = await readStore();
          const ord = store.orders.find((o) => o.order_id === orderId);
          if (!ord) {
            return { status: 404, payload: { ok: false, error: "Pedido não encontrado." } };
          }
          const edition = cleanText(body.edition || edCheck.edition || ord.requested_edition, 32).toLowerCase();
          if (!VALID_EDITIONS.has(edition)) {
            return {
              status: 400,
              payload: { ok: false, error: `Edição inválida para entrega (${edition}).` },
            };
          }
          const plan = EDITION_PLANS[edition] || EDITION_PLANS[ord.requested_edition] || EDITION_PLANS.superbad;
          if (EDITION_PLANS[edition] && edCheck.tier && EDITION_PLANS[edition].tier !== edCheck.tier) {
            return {
              status: 400,
              payload: {
                ok: false,
                error: `Tier da chave (${edCheck.tier}) não corresponde à edição solicitada (${edition} / ${EDITION_PLANS[edition].tier}).`,
              },
            };
          }
          const explicitEmail = cleanEmailAddress(body.buyer_email || "");
          if (explicitEmail) ord.buyer_email = explicitEmail;

          for (const lic of store.licenses) {
            if (lic.order_id === orderId && lic.key_sha256 !== keySha256 && !lic.revoked) {
              lic.revoked = true;
              lic.revoked_at = nowIso;
            }
          }

          let lic = store.licenses.find((l) => l.key_sha256 === keySha256);
          if (!lic) {
            lic = {
              license_id: `LIC-${crypto.randomBytes(5).toString("hex").toUpperCase()}`,
              order_id: orderId,
              edition,
              tier: edCheck.tier,
              label: plan?.label || edition,
              email: ord.buyer_email || ord.buyer_contact || "",
              key_prefix: edCheck.keyPrefix,
              key_hash: `sha256:${keySha256}`,
              key_sha256: keySha256,
              expires_at: edCheck.expiresAt,
              max_downloads: 10,
              downloads_used: 0,
              max_hwids: Math.max(1, Math.min(20, Number(body.max_hwids || plan.defaultMaxHwids || 1))),
              bound_hwids: [],
              revoked: false,
              revoked_at: null,
              issued_origin: "dashboard-deliver-key",
              last_seen_at: null,
              usage_requests: 0,
              usage_tokens: 0,
              created_at: nowIso,
              last_download_at: null,
            };
            store.licenses.push(lic);
          } else {
            lic.order_id = orderId;
            lic.revoked = false;
            lic.revoked_at = null;
          }

          ord.status = "delivered";
          ord.edition = edition;
          ord.license_id = lic.license_id;
          ord.encrypted_license_key = encryptedKey;
          ord.approved_at = ord.approved_at || nowIso;
          ord.delivered_at = nowIso;
          ord.updated_at = nowIso;

          await writeStore(store);
          return {
            status: 200,
            licAdmin: redactLicenseForAdmin(lic),
            orderForMail: {
              order_id: ord.order_id,
              buyer_name: ord.google_name || ord.buyer_name,
              buyer_email: ord.buyer_email || ord.google_email || cleanEmailAddress(ord.buyer_contact),
              editionLabel: plan.label || edition,
            },
          };
        });

        if (deliverOutcome.status !== 200) {
          return sendJson(res, deliverOutcome.status, deliverOutcome.payload);
        }

        let emailDelivery =
          body.email_delivery_override && typeof body.email_delivery_override === "object"
            ? body.email_delivery_override
            : null;
        if (!emailDelivery) {
          emailDelivery = await sendActivationEmail({
            to: deliverOutcome.orderForMail.buyer_email,
            buyerName: deliverOutcome.orderForMail.buyer_name,
            orderId: deliverOutcome.orderForMail.order_id,
            editionLabel: deliverOutcome.orderForMail.editionLabel,
            licenseKey: rawProvidedKey,
            publicSiteUrl: body.public_site_url || environment.SITE_URL,
            environment,
            customSendEmail: customSendEmailFn,
          });
        }

        await withStoreLock(async () => {
          const store = await readStore();
          const ord = store.orders.find((o) => o.order_id === orderId);
          if (ord) {
            ord.email_delivery = redactEmailDeliveryForStore(emailDelivery);
            await writeStore(store);
          }
        });

        return sendJson(res, 200, {
          ok: true,
          order_id: orderId,
          status: "delivered",
          license: deliverOutcome.licAdmin,
          email_delivery: emailDelivery,
        });
      }

      if (method === "POST" && pathname === "/api/superbad/admin/licenses/register") {
        if (!requireAdminOrOwnerProof(req, res, method, pathname)) return;
        const body = await readJsonBody(req);
        const rawProvidedKey = String(body.raw_license_key || body.license_key || "").trim();
        let keySha256 = cleanText(body.key_hash || body.key_sha256, 128).toLowerCase();
        if (!keySha256 && rawProvidedKey) {
          keySha256 = hashSecretSha256(rawProvidedKey);
        }
        if (!/^[a-f0-9]{64}$/.test(keySha256)) {
          return sendJson(res, 400, { ok: false, error: "key_hash SHA-256 inválido." });
        }
        let encryptedOrderKey = null;
        if (rawProvidedKey) {
          if (hashSecretSha256(rawProvidedKey) !== keySha256) {
            return sendJson(res, 400, { ok: false, error: "raw_license_key não confere com key_hash." });
          }
          const edCheck = verifyEd25519LicenseKey(rawProvidedKey, licensePublicKeyPem);
          if (edCheck.isEd25519Format && !edCheck.ok) {
            return sendJson(res, 400, { ok: false, error: edCheck.error || "Assinatura Ed25519 inválida." });
          }
          encryptedOrderKey = encryptLicenseKeyAtRest(rawProvidedKey, keyPoolAesKey);
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

          let mailOrderCtx = null;
          if (orderId) {
            const ord = store.orders.find((o) => o.order_id === orderId);
            if (ord) {
              for (const lic of store.licenses) {
                if (lic.order_id === orderId && lic.license_id !== existing.license_id && !lic.revoked) {
                  lic.revoked = true;
                  lic.revoked_at = nowIso;
                }
              }
              ord.status = body.deliver_key ? "delivered" : "approved";
              ord.edition = edition;
              ord.approved_at = ord.approved_at || nowIso;
              if (encryptedOrderKey) {
                ord.encrypted_license_key = encryptedOrderKey;
                ord.delivered_at = nowIso;
              }
              if (body.buyer_email) {
                const cleaned = cleanEmailAddress(body.buyer_email);
                if (cleaned) ord.buyer_email = cleaned;
              }
              ord.updated_at = nowIso;
              ord.license_id = existing.license_id;
              if (body.deliver_key && rawProvidedKey) {
                mailOrderCtx = {
                  order_id: ord.order_id,
                  buyer_name: ord.google_name || ord.buyer_name,
                  buyer_email: ord.buyer_email || ord.google_email || cleanEmailAddress(ord.buyer_contact),
                  editionLabel: plan.label || edition,
                };
              }
            }
          }

          await writeStore(store);
          return { licAdmin: redactLicenseForAdmin(existing), mailOrderCtx };
        });

        let emailDelivery = null;
        if (outcome.mailOrderCtx) {
          emailDelivery =
            body.email_delivery_override && typeof body.email_delivery_override === "object"
              ? body.email_delivery_override
              : await sendActivationEmail({
                  to: outcome.mailOrderCtx.buyer_email,
                  buyerName: outcome.mailOrderCtx.buyer_name,
                  orderId: outcome.mailOrderCtx.order_id,
                  editionLabel: outcome.mailOrderCtx.editionLabel,
                  licenseKey: rawProvidedKey,
                  publicSiteUrl: body.public_site_url || environment.SITE_URL,
                  environment,
                  customSendEmail: customSendEmailFn,
                });
          await withStoreLock(async () => {
            const store = await readStore();
            const ord = store.orders.find((o) => o.order_id === orderId);
            if (ord) {
              ord.email_delivery = redactEmailDeliveryForStore(emailDelivery);
              await writeStore(store);
            }
          });
        }

        return sendJson(res, 200, {
          ok: true,
          license: outcome.licAdmin,
          ...(emailDelivery ? { email_delivery: emailDelivery } : {}),
        });
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
            error: `Escolha uma edição válida (${Array.from(VALID_EDITIONS).join(", ")}).`,
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
            label: plan?.label || edition,
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
          order.encrypted_license_key = encryptLicenseKeyAtRest(licenseKey, keyPoolAesKey);

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
        const icResolved = resolveReleaseFile("infinite_claude");
        const icMaxResolved = resolveReleaseFile("infinite_max");
        const extraEditions = [];
        if (icResolved.filePath) extraEditions.push("infinite_claude");
        if (icMaxResolved.filePath) extraEditions.push("infinite_max");
        const listedEditions = extraEditions.length > 0
          ? [...PRIVATE_RELEASE_LIST_EDITIONS, ...extraEditions]
          : PRIVATE_RELEASE_LIST_EDITIONS;
        const releases = listedEditions.map((edition) => {
          const resolved = edition === "infinite_claude"
            ? icResolved
            : edition === "infinite_max"
              ? icMaxResolved
              : resolveReleaseFile(edition);
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
        const isProbeOnly = Boolean(body.check_only === true || body.probe === true || !hwid || /^web-/i.test(hwid));
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
            if (!isProbeOnly) {
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
            }
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
          if (!isProbeOnly && hwid && !license.bound_hwids.includes(hwid)) {
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
          if (!isProbeOnly) {
            license.last_seen_at = nowIso;
          }
          if (email && !license.email) license.email = email;

          const tier = license.tier || EDITION_PLANS[license.edition]?.tier || "client-mid";
          const expMs = Date.parse(license.expires_at);
          const daysLeft = Math.max(1, Math.ceil((expMs - Date.now()) / 86400000));

          if (!isProbeOnly) {
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
          }
          await writeStore(store);

          const sessionToken = isProbeOnly
            ? null
            : signToken(
                { sub: license.license_id, tier, hwid: hwid || "", exp: Date.now() + 24 * 60 * 60 * 1000 },
                sessionSecret
              );

          const includesOpenInfinite = Boolean(
            license.edition === "founder"
            || license.edition === "superbad"
            || license.edition === "infinite_claude"
            || license.edition === "infinite_max"
            || tier === "founder"
            || String(tier).startsWith("infinite")
          );
          const includesInfiniteClaude = Boolean(
            license.edition === "infinite_claude"
            || license.edition === "infinite_max"
            || license.edition === "founder"
            || license.edition === "superbad"
            || tier === "infinite-claude"
            || tier === "infinite-max"
            || tier === "infinite-claude-max"
            || tier === "founder"
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
              includesInfiniteClaude,
              tier,
              planLabel: EDITION_PLANS[license.edition]?.label || license.label || tier,
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

        const sanitizedTokensTotal = clampSafeInt(
          body.tokens_total !== undefined ? body.tokens_total : body.tokens_est,
          MAX_HEARTBEAT_TOKENS
        );
        const sanitizedCacheTokens = clampSafeInt(body.cache_tokens, MAX_HEARTBEAT_TOKENS);
        const sanitizedRequests = clampSafeInt(
          body.requests !== undefined ? body.requests : body.requests_count,
          MAX_HEARTBEAT_REQUESTS
        );
        const rawProfileInput = cleanText(body.profile || "", 32).toLowerCase();

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
            lic.usage_requests = Math.max(Number(lic.usage_requests || 0), sanitizedRequests);
            lic.usage_tokens = Math.max(Number(lic.usage_tokens || 0), sanitizedTokensTotal);
          }

          const effectiveEdition = lic?.edition || edition;
          const effectiveTier = lic?.tier || tier;
          const normalizedProfile = normalizeTelemetryProfile(rawProfileInput, effectiveEdition, effectiveTier);

          upsertNetworkNode(store, {
            license_id: lic?.license_id || null,
            key_sha256: keySha || lic?.key_sha256 || null,
            hwid,
            hostname: body.hostname || "",
            user_label: body.user_label || lic?.email || lic?.label || "",
            edition: effectiveEdition,
            tier: effectiveTier,
            profile: normalizedProfile,
            version: body.version || "6.4.0",
            active_layer: body.active_layer || "layer-1",
            watchdog_ok: body.watchdog_ok !== false,
            ip_masked: maskIp(req.socket?.remoteAddress || ""),
            requests_count: sanitizedRequests,
            tokens_est: sanitizedTokensTotal,
            tokens_total: sanitizedTokensTotal,
            cache_tokens: sanitizedCacheTokens,
            revoked: isRevoked,
          });
          await writeStore(store);
          publicStatsCache.expiresAt = 0;

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

        const validateOutcome = await withStoreLock(async () => {
          const store = await readStore();
          let license = findLicenseByKey(store.licenses, rawKey);
          if (!license && edCheck.ok) {
            const keySha = hashSecretSha256(rawKey);
            license = buildAutoEnrolledEd25519License(edCheck, keySha, {});
            store.licenses.push(license);
            await writeStore(store);
          }
          if (!license) {
            return { status: 401, payload: { ok: false, error: "Chave de licença inválida." } };
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

          const token = signToken(
            {
              lid: license.license_id,
              ed: license.edition,
              exp: Date.now() + DOWNLOAD_TOKEN_TTL_MS,
              jti: crypto.randomBytes(8).toString("hex"),
            },
            downloadSecret
          );

          return {
            status: 200,
            payload: {
              ok: true,
              edition: license.edition,
              tier: license.tier || (edCheck.ok ? edCheck.tier : undefined),
              expires_at: license.expires_at,
              downloads_remaining: license.max_downloads - license.downloads_used,
              download_url: `/api/superbad/download?token=${encodeURIComponent(token)}`,
            },
          };
        });
        return sendJson(res, validateOutcome.status, validateOutcome.payload);
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
    getGoogleClientId,
    EDITION_PLANS,
    releasesDir,
    storeFile,
  };
}

module.exports = {
  createSuperbadSalesApi,
  EDITION_PLANS,
  verifyEd25519LicenseKey,
  verifyReceiptMagicBytes,
  sendActivationEmail,
  buildPixBrCode,
  hashScrypt,
  verifyScrypt,
};
