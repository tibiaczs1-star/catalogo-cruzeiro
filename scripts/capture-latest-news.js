#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT_DIR, "data");
const RUNTIME_NEWS_FILE = path.join(DATA_DIR, "runtime-news.json");
const NEWS_ARCHIVE_FILE = path.join(DATA_DIR, "news-archive.json");
const STATIC_NEWS_FILE = path.join(ROOT_DIR, "news-data.js");
const FALLBACK_DIR = path.join(ROOT_DIR, "assets", "news-fallbacks");
const DEFAULT_LIMIT_PER_SOURCE = Math.max(5, Math.min(80, Number(process.env.CATALOGO_CAPTURE_LIMIT_PER_SOURCE || 30)));
const ACTIVE_WINDOW_LIMIT = Math.max(120, Number(process.env.CATALOGO_ACTIVE_NEWS_LIMIT || 420));
const ARCHIVE_LIMIT = Math.max(ACTIVE_WINDOW_LIMIT, Number(process.env.CATALOGO_ARCHIVE_NEWS_LIMIT || 1000));
const HTML_NOISE_ATTR_PATTERN = new RegExp(
  "\\b(?:" +
    ["src", "srcset", "alt", "class", "width", "height", "sizes", "load" + "ing", "decoding"].join("|") +
    ")=(?:\"[^\"]*(?:\"|$)|'[^']*(?:'|$)|\\S*)",
  "gi"
);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
}

function readStaticNewsItems() {
  try {
    if (!fs.existsSync(STATIC_NEWS_FILE)) return [];
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(STATIC_NEWS_FILE, "utf-8"), sandbox, {
      filename: STATIC_NEWS_FILE,
      timeout: 1000
    });
    return Array.isArray(sandbox.window.NEWS_DATA) ? sandbox.window.NEWS_DATA : [];
  } catch {
    return [];
  }
}

function writeStaticNews(items = []) {
  const safeItems = Array.isArray(items) ? items : [];
  fs.writeFileSync(
    STATIC_NEWS_FILE,
    `window.NEWS_ARCHIVE_TOTAL = ${safeItems.length};\nwindow.NEWS_DATA = ${JSON.stringify(safeItems, null, 2)};\n`,
    "utf-8"
  );
}

function decodeEntities(value = "") {
  return String(value || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/<!\[CDATA\[|\]\]>/gi, " ")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code) || 32))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCharCode(parseInt(code, 16) || 32))
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&apos;|&#8216;|&#8217;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&hellip;|&#8230;/gi, "...");
}

function truncateTextAtBoundary(value = "", limit = 0) {
  const text = String(value || "").trim();
  if (!limit || text.length <= limit) return text;

  const candidate = text.slice(0, Math.max(1, limit - 1)).trim();
  const sentenceEnd = Math.max(candidate.lastIndexOf("."), candidate.lastIndexOf("!"), candidate.lastIndexOf("?"));
  if (sentenceEnd >= Math.min(80, Math.floor(limit * 0.45))) {
    return candidate.slice(0, sentenceEnd + 1).trim();
  }

  const wordEnd = candidate.lastIndexOf(" ");
  const safeCut = wordEnd >= Math.floor(limit * 0.5) ? candidate.slice(0, wordEnd) : candidate;
  return `${safeCut.replace(/[,:;(-]+$/g, "").trim()}...`;
}

function cleanText(value = "", limit = 0) {
  const text = decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\bdata-[a-z0-9_-]+=(?:"[^"]*(?:"|$)|'[^']*(?:'|$)|\S*)/gi, " ")
    .replace(HTML_NOISE_ATTR_PATTERN, " ")
    .replace(/["']?\s*\bdata-[a-z0-9_-]+=["']?\S*/gi, " ")
    .replace(/["']?\s*\b(?:src|srcset|alt|class|width|height|sizes|decoding)=["']?\S*/gi, " ")
    .replace(/\s*\/?>\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return truncateTextAtBoundary(text, limit);
}

function normalizeText(value = "") {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value = "") {
  return normalizeText(value)
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function escapeHtml(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hashString(value = "") {
  let hash = 2166136261;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function sanitizeUrl(value = "") {
  const text = decodeEntities(value)
    .replace(/\s+(?=(utm_|fbclid|gclid|mc_cid|mc_eid|campaign|medium|source)=)/gi, "&")
    .replace(/\s+/g, "")
    .trim();
  return /^https?:\/\//i.test(text) ? text : "";
}

function resolveUrl(baseUrl = "", value = "") {
  const cleaned = decodeEntities(value).trim();
  if (!cleaned) return "";
  try {
    return new URL(cleaned, baseUrl || undefined).toString();
  } catch {
    return sanitizeUrl(cleaned);
  }
}

function pickTag(block = "", tagName = "") {
  const pattern = new RegExp(`<${tagName.replace(":", "\\:")}\\b[^>]*>([\\s\\S]*?)<\\/${tagName.replace(":", "\\:")}>`, "i");
  const match = String(block || "").match(pattern);
  return match ? decodeEntities(match[1]) : "";
}

function pickFirstTag(block = "", tags = []) {
  for (const tag of tags) {
    const value = pickTag(block, tag);
    if (cleanText(value)) return value;
  }
  return "";
}

function pickAttr(block = "", tagName = "", attrName = "") {
  const pattern = new RegExp(`<${tagName.replace(":", "\\:")}\\b[^>]*\\s${attrName}=["']([^"']+)["'][^>]*>`, "i");
  const match = String(block || "").match(pattern);
  return match ? decodeEntities(match[1]) : "";
}

function splitBlocks(xmlText = "", tagName = "") {
  const pattern = new RegExp(`<${tagName}\\b[\\s\\S]*?<\\/${tagName}>`, "gi");
  return String(xmlText || "").match(pattern) || [];
}

function extractImageFromMarkup(markup = "", baseUrl = "") {
  const imageAttr =
    pickAttr(markup, "img", "src") ||
    pickAttr(markup, "img", "data-src") ||
    pickAttr(markup, "img", "data-lazy-src");
  return resolveUrl(baseUrl, imageAttr);
}

function parseFeedDate(value = "") {
  const timestamp = Date.parse(cleanText(value));
  return Number.isNaN(timestamp) ? new Date().toISOString() : new Date(timestamp).toISOString();
}

function formatDate(value = "") {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "data recente";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Rio_Branco"
  })
    .format(date)
    .replace(".", "");
}

function categoryKeyFromLabel(label = "") {
  const normalized = normalizeText(label);
  if (/\bprefeitura|municipal|mancio lima|cruzeiro do sul\b/.test(normalized)) return "prefeitura";
  if (/\bpolitica|eleic|senado|stf|governo|governadora|deputad|vereador|aleac\b/.test(normalized)) return "politica";
  if (/\bpolicia|seguranca|prisao|homicidio|delegacia|bombeiros|acidente\b/.test(normalized)) return "policia";
  if (/\bsaude|hospital|cirurgia|vacina|medic|paciente\b/.test(normalized)) return "saude";
  if (/\beducacao|escola|aluno|estudante|enem|onibus escolar\b/.test(normalized)) return "educacao";
  if (/\beconomia|negocio|ifood|banco central|juros|comercio|mercadoria|fpm\b/.test(normalized)) return "negocios";
  if (/\besporte|futebol|campeonato|time|atleta\b/.test(normalized)) return "esporte";
  if (/\bcultura|show|joelma|shakira|anitta|musica|festival|festa|social\b/.test(normalized)) return "cultura";
  if (/\bacre|deracre|seasdh|iapen|agenda 2030\b/.test(normalized)) return "acre-governo";
  return normalized || "cotidiano";
}

const CATEGORY_LABELS = {
  "acre-governo": "Acre / Governo",
  cotidiano: "Cotidiano",
  cultura: "Cultura",
  educacao: "Educacao",
  esporte: "Esporte",
  negocios: "Negocios",
  policia: "Policia",
  politica: "Politica",
  prefeitura: "Prefeitura",
  saude: "Saude"
};

const PREVIEW_CLASS_BY_CATEGORY = {
  "acre-governo": "thumb-acre-governo",
  cotidiano: "thumb-cotidiano",
  cultura: "thumb-cultura",
  educacao: "thumb-educacao",
  esporte: "thumb-esporte",
  negocios: "thumb-negocios",
  policia: "thumb-policia",
  politica: "thumb-politica",
  prefeitura: "thumb-prefeitura",
  saude: "thumb-saude"
};

function inferCategory({ title = "", summary = "", source = {}, rawCategory = "" } = {}) {
  const sourceDefault = source.defaultCategory || "";
  const key = categoryKeyFromLabel([rawCategory, sourceDefault, title, summary].join(" "));
  return {
    categoryKey: key,
    category: CATEGORY_LABELS[key] || cleanText(sourceDefault || rawCategory || "Cotidiano", 48) || "Cotidiano"
  };
}

function wrapSvgText(text = "", maxChars = 28, maxLines = 3) {
  const words = cleanText(text, 150).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
      return;
    }
    current = next;
  });
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s+\S*$/, "").trim()}...`;
  }
  return lines;
}

function fallbackImageFor(item = {}, reason = "rss-sem-imagem") {
  ensureDir(FALLBACK_DIR);
  const slug = slugify(item.slug || item.title || "noticia") || `noticia-${Date.now()}`;
  const filePath = path.join(FALLBACK_DIR, `${slug}.svg`);
  const publicPath = `./assets/news-fallbacks/${slug}.svg`;
  if (fs.existsSync(filePath)) return publicPath;

  const hue = (hashString(`${slug}|${reason}`) % 280) + 20;
  const titleLines = wrapSvgText(item.title || "Noticia em atualizacao")
    .map((line, index) => `<tspan x="112" dy="${index === 0 ? "0" : "58"}">${escapeHtml(line)}</tspan>`)
    .join("");
  const category = cleanText(item.category || "Noticia", 24).toUpperCase();
  const source = cleanText(item.sourceName || "Fonte monitorada", 54);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
  <rect width="1200" height="720" fill="#101827"/>
  <rect x="68" y="62" width="1064" height="596" rx="28" fill="#f8fafc"/>
  <rect x="112" y="112" width="310" height="54" rx="27" fill="hsl(${hue} 82% 50%)"/>
  <text x="140" y="147" fill="#08111f" font-family="Arial, sans-serif" font-size="24" font-weight="800">${escapeHtml(category)}</text>
  <text x="112" y="286" fill="#111827" font-family="Georgia, serif" font-size="52" font-weight="700">${titleLines}</text>
  <path d="M112 548h976" stroke="hsl(${hue} 82% 50%)" stroke-width="14" stroke-linecap="round"/>
  <text x="112" y="612" fill="#475569" font-family="Arial, sans-serif" font-size="25" font-weight="700">${escapeHtml(source)} - imagem editorial segura</text>
</svg>
`;
  fs.writeFileSync(filePath, svg, "utf-8");
  return publicPath;
}

function buildBody(item = {}) {
  const sourceName = cleanText(item.sourceName || "Fonte monitorada", 80);
  const title = cleanText(item.title || "noticia", 180);
  const dateLabel = formatDate(item.publishedAt || item.createdAt || item.date);
  return [
    `${sourceName} publicou em ${dateLabel} a base desta noticia sobre ${title}.`,
    `${title} e o ponto principal da atualizacao captada automaticamente. O portal organiza o material para leitura rapida e mantem o link da fonte original para acompanhamento completo.`,
    "A redacao automatica acompanha novas atualizacoes da fonte e pode ampliar o contexto conforme novas informacoes forem publicadas."
  ];
}

function hasFeedMarkupNoise(value = "") {
  return /\]\]>|\bdata-[a-z0-9_-]+=|<\/?\w|\b(?:src|srcset|sizes|decoding)=|\/?>/i.test(String(value || ""));
}

function fallbackSummaryFor(item = {}) {
  const title = cleanText(item.title || item.sourceLabel || "Atualizacao monitorada", 180);
  const sourceName = cleanText(item.sourceName || "Fonte monitorada", 80);
  return `${title}. A fonte ${sourceName} traz a base da publicacao, e o portal acompanha novas atualizacoes antes de ampliar o texto.`;
}

function normalizeFeedMarkupNoise(item = {}) {
  if (!item || typeof item !== "object") return item;
  const next = { ...item };
  ["lede", "summary", "description", "displaySummary"].forEach((key) => {
    if (typeof next[key] === "string" && hasFeedMarkupNoise(next[key])) {
      next[key] = fallbackSummaryFor(next);
    }
  });
  if (Array.isArray(next.body)) {
    next.body = next.body.map((entry) =>
      typeof entry === "string" && hasFeedMarkupNoise(entry) ? fallbackSummaryFor(next) : entry
    );
  }
  return next;
}

function buildFeedRecord(block = "", source = {}, options = {}) {
  const atom = Boolean(options.atom);
  const title = cleanText(pickFirstTag(block, ["title"]), 180);
  const link =
    sanitizeUrl(atom ? pickAttr(block, "link", "href") : pickFirstTag(block, ["link"])) ||
    sanitizeUrl(pickFirstTag(block, ["guid", "id"]));
  const descriptionMarkup = pickFirstTag(block, ["description", "summary"]);
  const contentMarkup = pickFirstTag(block, ["content:encoded", "content"]);
  const summary = cleanText(descriptionMarkup || contentMarkup || title, 260);
  const rawDate = pickFirstTag(block, ["pubDate", "published", "updated", "dc:date"]);
  const publishedAt = parseFeedDate(rawDate);
  const rawCategory = cleanText(pickFirstTag(block, ["category"]), 80);
  const imageUrl =
    sanitizeUrl(pickAttr(block, "media:content", "url")) ||
    sanitizeUrl(pickAttr(block, "media:thumbnail", "url")) ||
    sanitizeUrl(pickAttr(block, "enclosure", "url")) ||
    extractImageFromMarkup(`${descriptionMarkup} ${contentMarkup}`, link);

  if (!title || !link) return null;

  const categoryInfo = inferCategory({ title, summary, source, rawCategory });
  const slug = slugify(title);
  const item = {
    id: link,
    slug,
    title,
    eyebrow: categoryInfo.category,
    date: formatDate(publishedAt),
    publishedAt,
    category: categoryInfo.category,
    categoryKey: categoryInfo.categoryKey,
    previewClass: PREVIEW_CLASS_BY_CATEGORY[categoryInfo.categoryKey] || "thumb-cotidiano",
    sourceName: source.name || source.id || "Fonte monitorada",
    sourceUrl: link,
    sourceLabel: title,
    lede: summary || title,
    summary: summary || title,
    analysis: "",
    highlights: [],
    development: [],
    imageUrl: imageUrl || "",
    feedImageUrl: imageUrl || "",
    sourceImageUrl: imageUrl || "",
    imageCredit: "",
    imageFocus: "",
    imageFit: "",
    media: null,
    priority: 0,
    editorialPriority: "",
    crossSources: [
      {
        name: source.name || source.id || "Fonte monitorada",
        url: link
      }
    ],
    alternateSources: [
      {
        name: source.name || source.id || "Fonte monitorada",
        url: link
      }
    ],
    sourceCount: 1,
    alternateSlugs: [slug].filter(Boolean)
  };

  const safeImage = item.imageUrl || fallbackImageFor(item);
  item.imageUrl = safeImage;
  item.feedImageUrl = safeImage;
  item.sourceImageUrl = safeImage;
  item.body = buildBody(item);
  return normalizeFeedMarkupNoise(item);
}

function parseFeedItems(xmlText = "", source = {}, limit = DEFAULT_LIMIT_PER_SOURCE) {
  const rssItems = splitBlocks(xmlText, "item").map((block) => buildFeedRecord(block, source));
  const atomItems = splitBlocks(xmlText, "entry").map((block) => buildFeedRecord(block, source, { atom: true }));
  return [...rssItems, ...atomItems].filter(Boolean).slice(0, limit);
}

async function fetchText(remoteUrl = "", timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(remoteUrl, {
      headers: { "user-agent": "catalogo-cruzeiro-capture/1.0" },
      signal: controller.signal
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

function readExistingNewsItems() {
  const runtimePayload = readJson(RUNTIME_NEWS_FILE, {});
  const archivePayload = readJson(NEWS_ARCHIVE_FILE, []);
  return []
    .concat(Array.isArray(runtimePayload.activeWindowItems) ? runtimePayload.activeWindowItems : [])
    .concat(Array.isArray(runtimePayload.items) ? runtimePayload.items : [])
    .concat(Array.isArray(archivePayload) ? archivePayload : Array.isArray(archivePayload.items) ? archivePayload.items : [])
    .concat(readStaticNewsItems())
    .filter(Boolean);
}

function getTimestamp(item = {}) {
  const timestamp = Date.parse(item.publishedAt || item.createdAt || item.date || "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getRegionalPriorityScore(item = {}) {
  const haystack = normalizeText(
    [
      item.title,
      item.summary,
      item.lede,
      item.description,
      item.category,
      item.categoryKey,
      item.eyebrow,
      item.sourceName,
      item.sourceLabel,
      item.sourceUrl,
      Array.isArray(item.body) ? item.body.join(" ") : item.body
    ].join(" ")
  );

  if (/\b(cruzeiro do sul|cruzeiro-do-sul|cruzeirodosul|czs)\b/.test(haystack)) return 5000;
  if (
    /\b(vale do jurua|vale do juru[aá]|vale-do-jurua|jurua|juru[aá]|mancio lima|m[âa]ncio lima|rodrigues alves|porto walter|marechal thaumaturgo|tarauaca|tarauac[aá]|jurua24horas|juruaemtempo|juruacomunicacao|tribunadojurua|portaldojurua)\b/.test(
      haystack
    )
  ) {
    return 4200;
  }
  if (
    /\b(acre|rio branco|sena madureira|feijo|feij[oó]|xapuri|brasileia|brasil[eé]ia|epitaciolandia|epitaciol[aâ]ndia|assis brasil|placido de castro|pl[aá]cido de castro|agencia acre|agencia\.ac|acre\.gov|ac24horas|contilnet|acrenews)\b/.test(
      haystack
    )
  ) {
    return 3200;
  }
  if (/\b(brasil|brasilia|bras[ií]lia|stf|senado|congresso|governo federal|agencia brasil|g1|cnn brasil)\b/.test(haystack)) {
    return 900;
  }
  return 0;
}

function dedupeKey(item = {}) {
  const titleKey = normalizeText(item.title || item.sourceLabel || "")
    .replace(/\bpra\b/g, "para")
    .replace(/\bpro\b/g, "para o")
    .replace(/\s+/g, " ")
    .trim();
  const dayKey = String(item.publishedAt || item.createdAt || item.date || "").slice(0, 10);
  if (titleKey) return `${titleKey.slice(0, 120)}::${dayKey}`;

  return (
    slugify(item.slug || item.title || "") ||
    normalizeText(item.sourceUrl || item.url || item.id || item.link || "")
  );
}

function mergeNewsItems(...collections) {
  const map = new Map();

  collections.flat().filter(Boolean).forEach((rawItem) => {
    const item = normalizeFeedMarkupNoise(rawItem);
    const key = dedupeKey(item);
    if (!key) return;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, item);
      return;
    }

    const existingBody = Array.isArray(existing.body) ? existing.body.filter(Boolean).length : 0;
    const itemBody = Array.isArray(item.body) ? item.body.filter(Boolean).length : 0;
    const existingScore = (existing.imageUrl || existing.feedImageUrl ? 10 : 0) + existingBody;
    const itemScore = (item.imageUrl || item.feedImageUrl ? 10 : 0) + itemBody;
    map.set(key, itemScore >= existingScore ? { ...existing, ...item } : { ...item, ...existing });
  });

  return [...map.values()].sort((left, right) => {
    const dateDiff = getTimestamp(right) - getTimestamp(left);
    if (dateDiff !== 0) return dateDiff;
    const regionalDiff = getRegionalPriorityScore(right) - getRegionalPriorityScore(left);
    if (regionalDiff !== 0) return regionalDiff;
    return Number(right.priority || 0) - Number(left.priority || 0);
  });
}

async function collectLatestNewsItems({ limitPerSource = DEFAULT_LIMIT_PER_SOURCE } = {}) {
  const sources = require(path.join(ROOT_DIR, "backend", "source-config.js"));
  const reports = [];
  const results = await Promise.all(
    sources.map(async (source) => {
      try {
        const xml = await fetchText(source.feedUrl);
        const items = parseFeedItems(xml, source, limitPerSource);
        reports.push({ source: source.id, ok: true, count: items.length });
        return items;
      } catch (error) {
        reports.push({
          source: source.id,
          ok: false,
          count: 0,
          error: String(error?.message || error).slice(0, 220)
        });
        return [];
      }
    })
  );

  return {
    ok: results.some((items) => items.length > 0),
    items: mergeNewsItems(results.flat()),
    reports: reports.sort((left, right) => String(left.source).localeCompare(String(right.source)))
  };
}

async function runCaptureLatestNews(options = {}) {
  const startedAt = new Date().toISOString();
  const capture = await collectLatestNewsItems(options);
  const existingItems = readExistingNewsItems();
  const mergedItems = mergeNewsItems(capture.items, existingItems).slice(0, ARCHIVE_LIMIT);
  const activeWindowItems = mergedItems.slice(0, ACTIVE_WINDOW_LIMIT);
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Rio_Branco",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
  const capturedToday = capture.items.filter((item) => String(item.publishedAt || "").slice(0, 10) === todayKey).length;

  const payload = {
    lastAttemptAt: startedAt,
    lastSuccessAt: capture.ok ? new Date().toISOString() : null,
    source: "rss-direct-agents-capture",
    activeWindowItems,
    items: mergedItems,
    reports: capture.reports
  };

  writeJson(RUNTIME_NEWS_FILE, payload);
  writeJson(NEWS_ARCHIVE_FILE, mergedItems);
  writeStaticNews(mergedItems);

  const report = {
    ok: capture.ok,
    startedAt,
    finishedAt: new Date().toISOString(),
    capturedItems: capture.items.length,
    capturedToday,
    activeWindowItems: activeWindowItems.length,
    archiveItems: mergedItems.length,
    reports: capture.reports
  };

  writeJson(path.join(DATA_DIR, "latest-news-capture-report.json"), report);
  return report;
}

if (require.main === module) {
  runCaptureLatestNews()
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
      if (!report.ok) process.exitCode = 1;
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}

module.exports = {
  collectLatestNewsItems,
  runCaptureLatestNews
};
