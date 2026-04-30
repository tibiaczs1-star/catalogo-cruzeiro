#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const RUNTIME_NEWS_FILE = path.join(DATA_DIR, "runtime-news.json");
const NEWS_ARCHIVE_FILE = path.join(DATA_DIR, "news-archive.json");
const STATIC_NEWS_FILE = path.join(ROOT_DIR, "news-data.js");
const TOPIC_FEED_PATTERN = /^topic-feed-.*\.json$/i;

const PUBLIC_NEWS_TEXT_FIELDS = new Set([
  "title",
  "sourceLabel",
  "lede",
  "summary",
  "analysis",
  "body",
  "highlights",
  "development",
  "description",
  "displaySummary"
]);

const PUBLIC_LANGUAGE_PATTERNS = [
  /\b(?:in late|in early|in the first)\b/i,
  /\bstarted rolling out\b/i,
  /\bnow it seems\b/i,
  /\bnew look is coming\b/i,
  /\bcoming to the rest\b/i,
  /\bwith a gradient design\b/i,
  /\bpart of what has held back\b/i,
  /\bfor a while there\b/i,
  /\bmultiple sources are reporting\b/i,
  /\bnobody is talking\b/i,
  /\bwindows users will no longer\b/i,
  /\bthe ram shortage\b/i,
  /\bcould get even worse\b/i,
  /\bwill no longer be forced\b/i,
  /\bthe us military struck\b/i,
  /\baccording to\b/i
];

const ENGLISH_PUBLIC_MARKER_PATTERN =
  /\b(?:the|and|that|with|from|this|will|would|could|should|their|there|these|those|about|after|before|because|during|while|into|over|under|more|most|new|now|look|coming|started|rolling|design|apps|users|people|company|whether|it's|its|is|are|was|were|been|being|have|has|had|can|may|might|must|your|you|they|them|his|her|our|out|up|down|when|where|why|how|who|what|which|if|then|than|as|at|by|for|of|on|off|in|to|or|not|one|first|last|latest|today|according|reports|reportedly|expected|available|feature|features|released|announced|video|podcast|phone|camera|smart|gaming|mouse|touchscreen)\b/g;
const PORTUGUESE_PUBLIC_MARKER_PATTERN =
  /\b(?:que|com|para|por|uma|um|das|dos|nas|nos|ao|aos|pela|pelo|mais|sobre|como|quando|porque|tambem|também|empresa|aplicativos|visual|icone|ícone|noticia|notícia|fonte|resumo|atualizacao|atualização|publicou|redacao|redação|internacional|brasil|acre)\b/g;

const KNOWN_SOURCE_URL_TITLES = new Map([
  ["best-mothers-day-gift-ideas-2026-mom-tech-gadgets", "Ideias de presentes tecnológicos para o Dia das Mães em 2026"],
  ["canva-magic-layers-ai-replacing-palestine", "Canva corrige falha de IA em camadas mágicas"],
  ["ul-testing-fire-safety-ai-standards-jennifer-scanlon", "UL fala sobre testes de segurança, fogo e padrões para IA"],
  ["amazon-wondery-oprah-podcast-show", "Podcast de Oprah Winfrey ganha distribuição pela Amazon"],
  ["govee-ceiling-light-ultra-led-pricing-availability", "Govee apresenta luminária de teto multicolorida"],
  ["spotify-peloton-guided-workouts", "Spotify amplia conteúdos de treino e bem-estar"],
  ["samsung-galaxy-z-fold-8-wide-dummy-leak", "Vazamento mostra possível Galaxy Z Fold largo"],
  ["gm-ai-car-design-nissan-neural-concept", "Montadoras testam IA no desenho de novos carros"],
  ["turtle-beach-mc7-gaming-mouse-touchscreen-command-series", "Mouse gamer da Turtle Beach aposta em tela sensível ao toque"],
  ["googles-new-gradient-icon-design-is-coming-to-more-apps", "Novo visual de ícones do Google chega a mais aplicativos"],
  ["microsoft-windows-update-pause-indefinitely", "Microsoft deve facilitar pausa nas atualizações do Windows"],
  ["how-project-maven-taught-the-military-to-love-ai", "Como o Project Maven aproximou os militares da IA"]
]);
const ENGLISH_SOURCE_FRAGMENT_PATTERN =
  /\b(?:Microsoft will let|Alex Jones has uncovered|Xreal’s best|Xreal's best|360-degree cameras have|Cybercab goes into production|Skylight’s color-coded|Skylight's color-coded|Acclaimed Japanese director)\b/i;

function readText(filePath) {
  return fs.readFileSync(filePath, "utf-8");
}

function writeText(filePath, text) {
  fs.writeFileSync(filePath, text, "utf-8");
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(readText(filePath));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  writeText(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function stripTags(value = "") {
  return String(value || "").replace(/<[^>]+>/g, " ");
}

function normalizePublicText(value) {
  return stripTags(value)
    .replace(/<!\[CDATA\[|\]\]>/gi, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fallbackIncompletePublicText(kind, item) {
  const sourceName = deriveSourceName(item) || "Fonte monitorada";
  const title = String(item?.title || item?.sourceLabel || "a atualizacao").trim();
  return `${sourceName} publicou uma atualização sobre ${title}. O portal mantém o link da fonte original para acompanhamento completo.`;
}

function repairIncompletePublicText(value, kind, item) {
  if (!["lede", "summary", "description", "displaySummary"].includes(kind)) return value;
  const hasBrokenMarkup = /\]\]>|<!\[CDATA\[/i.test(String(value || ""));
  if (hasBrokenMarkup) {
    return fallbackIncompletePublicText(kind, item);
  }

  const text = normalizePublicText(value);
  if (text.length < 80 || /[.!?…]$/.test(text)) return value;

  const sentenceEnd = Math.max(text.lastIndexOf("."), text.lastIndexOf("!"), text.lastIndexOf("?"));
  if (sentenceEnd >= 60) {
    return text.slice(0, sentenceEnd + 1).trim();
  }

  return fallbackIncompletePublicText(kind, item);
}

function publicTextLooksEnglish(value) {
  const text = normalizePublicText(value);
  if (!text) return false;
  if (PUBLIC_LANGUAGE_PATTERNS.some((regex) => regex.test(text))) {
    return true;
  }

  const lowerText = text.toLowerCase();
  const words = lowerText.match(/[a-záàâãéêíóôõúç]+/gi) || [];
  if (words.length < 5) {
    return false;
  }

  const englishMarkers = lowerText.match(ENGLISH_PUBLIC_MARKER_PATTERN) || [];
  const portugueseMarkers = lowerText.match(PORTUGUESE_PUBLIC_MARKER_PATTERN) || [];
  const hasPortugueseSignal = portugueseMarkers.length > 0 || /[áàâãéêíóôõúç]/i.test(text);

  if (words.length >= 5 && englishMarkers.length >= 4 && !hasPortugueseSignal) {
    return true;
  }

  return englishMarkers.length >= 7 && englishMarkers.length >= Math.max(1, portugueseMarkers.length * 2);
}

function deriveSourceName(item = {}) {
  const sourceName = String(item.sourceName || item.source || "").trim();
  if (sourceName) return sourceName;
  const sourceDomain = String(item.sourceDomain || "").trim();
  if (sourceDomain) return sourceDomain;
  const slug = String(item.slug || item.sourceUrl || "").trim();
  if (!slug) return "";
  try {
    const url = new URL(slug.startsWith("http") ? slug : `https://${slug}`);
    return url.hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

function translateKnownEnglishText(text, kind = "summary") {
  const value = normalizePublicText(text);
  if (!value) return null;

  // Specific recent leaks (The Verge)
  if (/in late 2025, google started rolling out new icons with a gradient design/i.test(value)) {
    if (kind === "title") return "Ícones em degradê do Google devem chegar a mais apps";
    return "Google começou a adotar ícones em degradê; a mudança deve chegar a mais aplicativos.";
  }

  if (/multiple sources are reporting that the trump administration has dismissed the entire national science board/i.test(value)) {
    if (kind === "title") return "Relatos apontam demissão do Conselho Nacional de Ciência (NSB)";
    return "Relatos apontam que o governo Trump demitiu todo o Conselho Nacional de Ciência (NSB).";
  }

  if (/part of what has held back electric cars has been the cost/i.test(value)) {
    if (kind === "title") return "Oferta de elétricos usados pode reduzir preços";
    return "O preço ainda freia os carros elétricos, mas a oferta de usados pode derrubar valores nos próximos anos.";
  }

  if (/for a while there, it seemed like double fine might be struggling/i.test(value)) {
    if (kind === "title") return "Double Fine sob a Microsoft entra em foco";
    return "Por um tempo, parecia que o estúdio Double Fine enfrentava dificuldades sob a estrutura corporativa da Microsoft.";
  }

  if (/nobody is talking/i.test(value)) {
    if (kind === "title") return "Ninguém está falando";
    return "Ninguém está falando.";
  }

  if (/windows users will no longer be forced to run automatic updates/i.test(value)) {
    if (kind === "title") return "Windows deve reduzir interrupções por atualizações automáticas";
    return "Usuários do Windows não devem mais ser forçados a instalar atualizações automáticas no meio do uso.";
  }

  if (/the ram shortage could get even worse if samsung labor protests cut production/i.test(value)) {
    if (kind === "title") return "Escassez de RAM pode piorar com protestos na Samsung";
    return "A escassez de RAM pode piorar se protestos na Samsung afetarem a produção.";
  }

  if (/the ram shortage caused by demand from ai datacenters/i.test(value)) {
    if (kind === "title") return "Escassez de RAM pode piorar com protestos na Samsung";
    return "A escassez de RAM, pressionada pela demanda de IA, pode piorar se protestos na Samsung afetarem a produção.";
  }

  if (/in the first 24 hours of the assault on iran, the us military struck more than 1,000 targets/i.test(value)) {
    if (kind === "title") return "Ataque ao Irã: EUA relatam mais de 1.000 alvos nas primeiras 24 horas";
    return 'Nas primeiras 24 horas do ataque ao Irã, os EUA disseram ter atingido mais de 1.000 alvos, em escala maior que a ofensiva no Iraque.';
  }

  // Known headlines we saw leaking as-is
  if (/^the ram shortage could get even worse if samsung labor protests cut production$/i.test(value)) {
    return "Escassez de RAM pode piorar com protestos na Samsung";
  }

  if (/^how project maven taught the military to love ai$/i.test(value)) {
    if (kind === "title") return "Como o Project Maven aproximou os militares da IA";
    return "Como o Project Maven aproximou os militares da IA.";
  }

  return null;
}

function fallbackPortuguese(kind, item) {
  const sourceName = deriveSourceName(item);
  const sourceHint = sourceName ? ` (fonte: ${sourceName})` : "";
  if (kind === "title") return `Notícia internacional${sourceHint}`.trim();
  if (kind === "sourceLabel") return sourceName || "Fonte externa";
  if (kind === "lede" || kind === "summary" || kind === "description" || kind === "displaySummary") {
    const title = String(item?.title || item?.sourceLabel || "tema internacional").trim();
    return `${sourceName || "Fonte externa"} publicou uma atualização sobre ${title}. A redação manteve o link da fonte original e bloqueou o resumo importado até que uma versão em português esteja pronta.`.trim();
  }
  if (kind === "body") {
    return `Notícia internacional${sourceHint}. O portal apresenta o essencial e mantém o acesso direto para a fonte completa.`.trim();
  }
  return `Notícia internacional${sourceHint}.`.trim();
}

function hasPortuguesePublicSignal(value = "") {
  const text = normalizePublicText(value);
  if (!text) return false;
  PORTUGUESE_PUBLIC_MARKER_PATTERN.lastIndex = 0;
  return PORTUGUESE_PUBLIC_MARKER_PATTERN.test(text.toLowerCase()) || /[áàâãéêíóôõúç]/i.test(text);
}

function isEnglishSourceItem(item = {}) {
  const sourceText = [item.sourceName, item.source, item.sourceDomain, item.sourceUrl, item.url, item.id, item.slug]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");
  return /\b(the verge|theverge\.com|techcrunch\.com|deadline\.com|variety\.com|cartoonbrew\.com|broadwayworld\.com|insidehighered\.com|edsurge\.com|thepienews\.com)\b/.test(sourceText);
}

function inferPublicTitle(item) {
  const candidates = [item?.sourceUrl, item?.url, item?.id, item?.slug].map((value) => String(value || ""));
  for (const candidate of candidates) {
    const known = [...KNOWN_SOURCE_URL_TITLES.entries()].find(([needle]) => candidate.includes(needle));
    if (known) return known[1];
  }
  const sourceName = deriveSourceName(item);
  const timestamp = Date.parse(item?.publishedAt || item?.createdAt || item?.date || "");
  const timeLabel = Number.isNaN(timestamp)
    ? String(item?.slug || item?.id || "").slice(0, 8)
    : new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Rio_Branco"
      }).format(new Date(timestamp));
  const suffix = timeLabel ? ` - ${timeLabel}` : "";
  return sourceName ? `Atualização internacional de ${sourceName}${suffix}` : `Atualização internacional${suffix}`;
}

function ensurePublicLabels(item) {
  if (!item || typeof item !== "object") return;
  const title = String(item.title || "").trim();
  const sourceLabel = String(item.sourceLabel || "").trim();

  if (!title || (isEnglishSourceItem(item) && (!hasPortuguesePublicSignal(title) || publicTextLooksEnglish(title)))) {
    item.title = inferPublicTitle(item);
  }

  if (!sourceLabel || (isEnglishSourceItem(item) && (!hasPortuguesePublicSignal(sourceLabel) || publicTextLooksEnglish(sourceLabel)))) {
    item.sourceLabel = item.title || inferPublicTitle(item);
  }
}

function sanitizeEnglishSourceFields(item) {
  if (!isEnglishSourceItem(item)) return;

  ["lede", "summary", "description", "displaySummary"].forEach((key) => {
    const value = item[key];
    if (typeof value !== "string") return;
    if (
      value.trim() &&
      hasPortuguesePublicSignal(value) &&
      !publicTextLooksEnglish(value) &&
      !ENGLISH_SOURCE_FRAGMENT_PATTERN.test(value)
    ) {
      return;
    }
    item[key] = fallbackPortuguese(key, item);
  });

  if (Array.isArray(item.body)) {
    item.body = item.body.map((entry) => {
      if (typeof entry !== "string") return entry;
      if (
        entry.trim() &&
        hasPortuguesePublicSignal(entry) &&
        !publicTextLooksEnglish(entry) &&
        !ENGLISH_SOURCE_FRAGMENT_PATTERN.test(entry)
      ) {
        return entry;
      }
      return fallbackPortuguese("body", item);
    });
  } else if (
    typeof item.body === "string" &&
    (!hasPortuguesePublicSignal(item.body) || publicTextLooksEnglish(item.body) || ENGLISH_SOURCE_FRAGMENT_PATTERN.test(item.body))
  ) {
    item.body = fallbackPortuguese("body", item);
  }
}

function sanitizeText(value, kind, item) {
  if (typeof value !== "string") return value;
  const repaired = repairIncompletePublicText(value, kind, item);
  const trimmed = String(repaired || "").trim();
  if (!trimmed) return value;
  if (!publicTextLooksEnglish(trimmed)) return repaired;

  const translated = translateKnownEnglishText(trimmed, kind);
  if (translated) return translated;

  return fallbackPortuguese(kind, item);
}

function sanitizeBodyValue(value, item) {
  if (typeof value !== "string") return value;
  let text = value;
  const title = typeof item?.title === "string" ? item.title.trim() : "";
  const sourceLabel = typeof item?.sourceLabel === "string" ? item.sourceLabel.trim() : "";
  const titlePt = translateKnownEnglishText(title, "title");

  if (title && publicTextLooksEnglish(title) && titlePt) {
    const pattern = new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    text = text.replace(pattern, titlePt);
  }

  if (sourceLabel && publicTextLooksEnglish(sourceLabel) && titlePt) {
    const pattern = new RegExp(sourceLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    text = text.replace(pattern, titlePt);
  }

  if (titlePt && /a base desta noticia sobre\s*\./i.test(text)) {
    text = text.replace(/(a base desta noticia sobre)\s*\./i, `$1 ${titlePt}.`);
  }

  if (publicTextLooksEnglish(text)) {
    const translated = translateKnownEnglishText(text, "body");
    if (translated) return translated;
    return fallbackPortuguese("body", item);
  }

  return text;
}

function sanitizePublicFields(item) {
  if (!item || typeof item !== "object") return item;

  ensurePublicLabels(item);
  sanitizeEnglishSourceFields(item);

  Object.entries(item).forEach(([key, value]) => {
    if (!PUBLIC_NEWS_TEXT_FIELDS.has(key)) return;

    if (Array.isArray(value)) {
      if (key === "body") {
        item[key] = value.map((entry) => sanitizeBodyValue(entry, item));
      } else {
        item[key] = value.map((entry) => sanitizeText(entry, key, item));
      }
      return;
    }

    if (key === "body") {
      item[key] = sanitizeBodyValue(value, item);
      return;
    }

    item[key] = sanitizeText(value, key, item);
  });

  return item;
}

function sanitizeNewsList(items) {
  if (!Array.isArray(items)) return items;
  items.forEach((item) => sanitizePublicFields(item));
  return items;
}

function readStaticNewsItems() {
  if (!fs.existsSync(STATIC_NEWS_FILE)) return [];
  const source = readText(STATIC_NEWS_FILE);
  const match = source.match(/window\.NEWS_DATA\s*=\s*([\s\S]*?);\s*$/);
  if (!match) return [];
  try {
    return JSON.parse(match[1]);
  } catch {
    return [];
  }
}

function writeStaticNewsItems(items) {
  const safeItems = Array.isArray(items) ? items : [];
  writeText(
    STATIC_NEWS_FILE,
    `window.NEWS_ARCHIVE_TOTAL = ${safeItems.length};\nwindow.NEWS_DATA = ${JSON.stringify(safeItems, null, 2)};\n`
  );
}

function sanitizeRuntimeNews() {
  const payload = readJson(RUNTIME_NEWS_FILE, null);
  if (!payload || typeof payload !== "object") return { changed: false, issues: ["runtime-news unreadable"] };
  const before = JSON.stringify(payload);
  sanitizeNewsList(payload.items);
  sanitizeNewsList(payload.activeWindowItems);
  const after = JSON.stringify(payload);
  if (before !== after) {
    writeJson(RUNTIME_NEWS_FILE, payload);
    return { changed: true, issues: [] };
  }
  return { changed: false, issues: [] };
}

function sanitizeNewsArchive() {
  const payload = readJson(NEWS_ARCHIVE_FILE, null);
  if (!Array.isArray(payload)) return { changed: false, issues: ["news-archive unreadable"] };
  const before = JSON.stringify(payload);
  sanitizeNewsList(payload);
  const after = JSON.stringify(payload);
  if (before !== after) {
    writeJson(NEWS_ARCHIVE_FILE, payload);
    return { changed: true, issues: [] };
  }
  return { changed: false, issues: [] };
}

function sanitizeStaticNews() {
  const items = readStaticNewsItems();
  const before = JSON.stringify(items);
  sanitizeNewsList(items);
  const after = JSON.stringify(items);
  if (before !== after) {
    writeStaticNewsItems(items);
    return { changed: true, issues: [] };
  }
  return { changed: false, issues: [] };
}

function sanitizeTopicFeedFiles() {
  if (!fs.existsSync(DATA_DIR)) return [];

  return fs.readdirSync(DATA_DIR)
    .filter((fileName) => TOPIC_FEED_PATTERN.test(fileName))
    .map((fileName) => {
      const filePath = path.join(DATA_DIR, fileName);
      const payload = readJson(filePath, null);
      if (!payload) {
        return { file: path.relative(ROOT_DIR, filePath), changed: false, issues: [`${fileName} unreadable`] };
      }

      const before = JSON.stringify(payload);
      if (Array.isArray(payload)) {
        sanitizeNewsList(payload);
      } else if (Array.isArray(payload.items)) {
        sanitizeNewsList(payload.items);
      } else {
        Object.values(payload).forEach((value) => {
          if (Array.isArray(value)) sanitizeNewsList(value);
        });
      }

      const after = JSON.stringify(payload);
      if (before !== after) {
        writeJson(filePath, payload);
        return { file: path.relative(ROOT_DIR, filePath), changed: true, issues: [] };
      }

      return { file: path.relative(ROOT_DIR, filePath), changed: false, issues: [] };
    });
}

async function runSanitizePublicLanguage() {
  const results = [];

  results.push({ file: path.relative(ROOT_DIR, RUNTIME_NEWS_FILE), ...sanitizeRuntimeNews() });
  results.push({ file: path.relative(ROOT_DIR, NEWS_ARCHIVE_FILE), ...sanitizeNewsArchive() });
  results.push({ file: path.relative(ROOT_DIR, STATIC_NEWS_FILE), ...sanitizeStaticNews() });
  results.push(...sanitizeTopicFeedFiles());

  const issues = results.flatMap((entry) => entry.issues || []);
  return {
    ok: issues.length === 0,
    changedFiles: results.filter((entry) => entry.changed).map((entry) => entry.file),
    exitCode: issues.length === 0 ? 0 : 1,
    issues
  };
}

module.exports = { runSanitizePublicLanguage };

if (require.main === module) {
  runSanitizePublicLanguage()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      if (!result.ok) process.exitCode = 1;
    })
    .catch((error) => {
      console.error(error?.stack || error?.message || String(error || "error"));
      process.exitCode = 1;
    });
}
