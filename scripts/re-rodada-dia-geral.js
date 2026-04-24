#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const TEMP_DIR = path.join(ROOT_DIR, ".codex-temp");
const ONLINE_NEWS_FILE = path.join(TEMP_DIR, "online-news-before.json");
const RUNTIME_NEWS_FILE = path.join(DATA_DIR, "runtime-news.json");
const STATIC_NEWS_FILE = path.join(ROOT_DIR, "news-data.js");
const REPORT_FILE = path.join(DATA_DIR, "re-rodada-dia-geral-report.json");
const FALLBACK_DIR = path.join(ROOT_DIR, "assets", "news-fallbacks");
const DEFAULT_ONLINE_URL = "https://catalogo-cruzeiro-web.onrender.com";

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (_error) {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
}

function writeStaticNews(items) {
  fs.writeFileSync(STATIC_NEWS_FILE, `window.NEWS_DATA = ${JSON.stringify(items.slice(0, 120), null, 2)};\n`, "utf-8");
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "user-agent": "catalogo-re-rodada-dia-geral" } }, (response) => {
        let raw = "";
        response.setEncoding("utf-8");
        response.on("data", (chunk) => {
          raw += chunk;
        });
        response.on("end", () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`HTTP ${response.statusCode} em ${url}`));
            return;
          }
          try {
            resolve(JSON.parse(raw));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

function cleanText(value = "", limit = 0) {
  const text = String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#8220;|&#8221;/gi, "\"")
    .replace(/&#8216;|&#8217;/gi, "'")
    .replace(/&hellip;|&#8230;/gi, "...")
    .replace(/\s+/g, " ")
    .trim();
  return limit && text.length > limit ? `${text.slice(0, limit - 1).trim()}...` : text;
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function hashString(value) {
  let hash = 0;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function imageOf(item = {}) {
  return item.imageUrl || item.feedImageUrl || item.sourceImageUrl || item.image || "";
}

function divisionOf(item = {}) {
  return (
    slugify(item.categoryKey || item.category || item.eyebrow || "sem-categoria") ||
    "sem-categoria"
  );
}

function comparableImageUrl(value) {
  return String(value || "")
    .trim()
    .replace(/[?#].*$/g, "")
    .replace(/-\d{2,5}x\d{2,5}(?=\.[a-z]{3,5}$)/i, "")
    .toLowerCase();
}

function isWeakImage(value) {
  const imageUrl = String(value || "").toLowerCase();
  if (!imageUrl) return true;
  if (/(?:logo|favicon|icon|avatar|emoji|gravatar|pixel|placeholder|spacer|blank)\b/i.test(imageUrl)) {
    return true;
  }
  if (imageUrl.includes("agenciabrasil.ebc.com.br/ebc.png")) return true;
  if (imageUrl.includes("/edital-assinado-")) return true;
  return false;
}

function buildFallbackSvg(item = {}, reason = "fallback") {
  const title = cleanText(item.title || item.sourceLabel || "Notícia em revisão", 105);
  const category = cleanText(item.category || item.eyebrow || "Notícia", 42).toUpperCase();
  const source = cleanText(item.sourceName || "Catálogo", 42);
  const hue = (hashString(`${item.slug || title}|${reason}`) % 280) + 20;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#07111f"/>
      <stop offset="1" stop-color="#20242d"/>
    </linearGradient>
    <pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse">
      <path d="M42 0H0v42" fill="none" stroke="rgba(255,255,255,.055)" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="1200" height="720" fill="url(#bg)"/>
  <rect width="1200" height="720" fill="url(#grid)"/>
  <rect x="86" y="82" width="1028" height="556" rx="28" fill="rgba(255,255,255,.055)" stroke="rgba(255,255,255,.14)" stroke-width="2"/>
  <rect x="126" y="126" width="260" height="48" rx="24" fill="hsl(${hue} 78% 58%)"/>
  <text x="154" y="158" fill="#07111f" font-family="Arial, sans-serif" font-size="24" font-weight="800">${escapeHtml(category)}</text>
  <circle cx="986" cy="158" r="76" fill="hsl(${hue} 78% 58%)" opacity=".9"/>
  <circle cx="1038" cy="210" r="52" fill="hsl(${(hue + 55) % 360} 72% 48%)" opacity=".78"/>
  <path d="M126 492h948" stroke="hsl(${hue} 78% 58%)" stroke-width="12" stroke-linecap="round" opacity=".82"/>
  <text x="126" y="292" fill="#fff8ea" font-family="Georgia, serif" font-size="56" font-weight="700">
    <tspan x="126" dy="0">${escapeHtml(title.slice(0, 34))}</tspan>
    <tspan x="126" dy="70">${escapeHtml(title.slice(34, 68))}</tspan>
    <tspan x="126" dy="70">${escapeHtml(title.slice(68, 102))}</tspan>
  </text>
  <text x="126" y="574" fill="rgba(255,248,234,.72)" font-family="Arial, sans-serif" font-size="25" font-weight="700">${escapeHtml(source)} • imagem editorial para evitar repetição</text>
</svg>
`;
}

function fallbackImageFor(item = {}, reason = "fallback") {
  ensureDir(FALLBACK_DIR);
  const slug = slugify(item.slug || item.title || "noticia");
  const fileName = `${slug || `noticia-${Date.now()}`}.svg`;
  const filePath = path.join(FALLBACK_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, buildFallbackSvg(item, reason), "utf-8");
  }
  return `/assets/news-fallbacks/${fileName}`;
}

function repairImages(items = []) {
  const seenByDivision = new Map();
  let repaired = 0;

  const nextItems = items.map((item) => {
    const currentImage = imageOf(item);
    const key = comparableImageUrl(currentImage);
    const division = divisionOf(item);
    const duplicateKey = key ? `${division}|${key}` : "";
    const repeated = duplicateKey && seenByDivision.has(duplicateKey);

    if (duplicateKey && !seenByDivision.has(duplicateKey)) {
      seenByDivision.set(duplicateKey, item.slug || item.id || currentImage);
    }

    if (!isWeakImage(currentImage) && !repeated) return item;

    const reason = isWeakImage(currentImage)
      ? "imagem-ausente-ou-generica"
      : "foto-repetida-na-mesma-divisao";
    const imageUrl = fallbackImageFor(item, reason);
    repaired += 1;

    return {
      ...item,
      imageUrl,
      feedImageUrl: imageUrl,
      sourceImageUrl: imageUrl,
      originalImageUrl: currentImage || item.originalImageUrl || "",
      imageCredit: item.imageCredit || "Arte editorial automática do Catálogo Cruzeiro do Sul",
      imageFocus: item.imageFocus || "center 50%",
      imageQuality: reason
    };
  });

  return { items: nextItems, repaired };
}

function auditItems(items = []) {
  const groups = new Map();
  const missing = [];

  items.forEach((item) => {
    const currentImage = imageOf(item);
    if (!currentImage) missing.push(item.slug);
    const key = `${divisionOf(item)}|${comparableImageUrl(currentImage)}`;
    if (!groups.has(key)) groups.set(key, new Set());
    groups.get(key).add(item.slug || item.id || item.title);
  });

  return {
    total: items.length,
    missing: missing.length,
    sameDivisionDuplicates: [...groups.values()].filter((set) => set.size > 1).length
  };
}

async function loadOnlineNews() {
  if (fs.existsSync(ONLINE_NEWS_FILE)) {
    const payload = readJson(ONLINE_NEWS_FILE, null);
    if (Array.isArray(payload?.items)) return payload;
  }
  const baseUrl = process.env.SITE_URL || DEFAULT_ONLINE_URL;
  return requestJson(`${baseUrl.replace(/\/$/, "")}/api/news?limit=120`);
}

async function main() {
  const startedAt = new Date().toISOString();
  const onlinePayload = await loadOnlineNews();
  const onlineItems = Array.isArray(onlinePayload.items) ? onlinePayload.items.slice(0, 120) : [];
  const onlineAuditBefore = auditItems(onlineItems);
  const repaired = repairImages(onlineItems);
  const onlineAuditAfterLocalRepair = auditItems(repaired.items);

  const runtimePayload = {
    lastAttemptAt: startedAt,
    lastSuccessAt: new Date().toISOString(),
    source: "re-rodada-dia-geral-online-first",
    items: repaired.items,
    reports: [
      {
        sourceName: "Render online",
        ok: true,
        fetched: onlineItems.length,
        repairedImages: repaired.repaired
      }
    ]
  };

  writeJson(RUNTIME_NEWS_FILE, runtimePayload);
  writeStaticNews(repaired.items);

  const report = {
    ok: true,
    startedAt,
    finishedAt: new Date().toISOString(),
    source: "Re Rodada do Dia Geral",
    onlineAuditBefore,
    localAuditAfterSync: onlineAuditAfterLocalRepair,
    repairedImages: repaired.repaired,
    rule:
      "Toda reunião grande/deploy começa lendo o online, sincroniza local, revisa offline, sobe e audita online de novo."
  };
  writeJson(REPORT_FILE, report);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
