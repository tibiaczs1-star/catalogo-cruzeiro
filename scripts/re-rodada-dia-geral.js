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
const NEWS_ARCHIVE_FILE = path.join(DATA_DIR, "news-archive.json");
const STATIC_NEWS_FILE = path.join(ROOT_DIR, "news-data.js");
const REPORT_FILE = path.join(DATA_DIR, "re-rodada-dia-geral-report.json");
const FALLBACK_DIR = path.join(ROOT_DIR, "assets", "news-fallbacks");
const DEFAULT_ONLINE_URL = "https://catalogo-cruzeiro-web.onrender.com";
const SYNC_FETCH_LIMIT = Math.max(120, Number(process.env.CATALOGO_SYNC_NEWS_LIMIT || 1000));
const HOME_PREVIEW_MAX_CHARS = 230;

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
  const safeItems = Array.isArray(items) ? items : [];
  fs.writeFileSync(
    STATIC_NEWS_FILE,
    `window.NEWS_ARCHIVE_TOTAL = ${safeItems.length};\nwindow.NEWS_DATA = ${JSON.stringify(safeItems, null, 2)};\n`,
    "utf-8"
  );
}

function readStaticNewsItems() {
  if (!fs.existsSync(STATIC_NEWS_FILE)) return [];
  const source = fs.readFileSync(STATIC_NEWS_FILE, "utf-8");
  const match = source.match(/window\.NEWS_DATA\s*=\s*([\s\S]*?);\s*$/);
  if (!match) return [];
  try {
    return JSON.parse(match[1]);
  } catch (_error) {
    return [];
  }
}

function readNewsArchiveItems() {
  const payload = readJson(NEWS_ARCHIVE_FILE, []);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
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

function stripPreviewNoise(value = "") {
  return cleanText(value)
    .replace(/\b(leia tambem|leia tamb[eé]m|assista tambem|assista tamb[eé]m|clique aqui)\b[\s\S]*$/i, "")
    .replace(/\b(Jornal Nacional|Reproducao|Reprodução|Foto:|Imagem:)\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateAtBoundary(value = "", limit = HOME_PREVIEW_MAX_CHARS) {
  const text = stripPreviewNoise(value);
  if (!text || text.length <= limit) return text;
  const slice = text.slice(0, limit + 1);
  const boundary = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("; "),
    slice.lastIndexOf(": "),
    slice.lastIndexOf(", "),
    slice.lastIndexOf(" ")
  );
  const end = boundary > 90 ? boundary : limit - 1;
  return `${slice.slice(0, end).trim().replace(/[.,;:]+$/, "")}...`;
}

function pickPreviewSentences(value = "", limit = HOME_PREVIEW_MAX_CHARS) {
  const text = stripPreviewNoise(value);
  if (!text) return "";
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  let picked = "";

  for (const sentence of sentences) {
    const candidate = cleanText(`${picked} ${sentence}`);
    if (candidate.length > limit) break;
    picked = candidate;
    if (picked.length >= 120) break;
  }

  return picked || truncateAtBoundary(text, limit);
}

function buildHomePreviewSummary(item = {}, title = "") {
  const bodyText = Array.isArray(item.body) ? item.body.find(Boolean) : item.body;
  const candidates = [
    item.summary,
    item.lede,
    item.description,
    item.sourceLabel,
    bodyText
  ]
    .map((candidate) => stripPreviewNoise(candidate))
    .filter(Boolean);
  const titleText = stripPreviewNoise(title || item.title || item.sourceLabel || "Noticia");
  const selected = candidates.find((candidate) => {
    if (candidate.length < 40) return false;
    return candidate.toLowerCase() !== titleText.toLowerCase();
  });

  if (!selected) {
    return truncateAtBoundary(`${titleText}. Veja os principais pontos e acompanhe os detalhes da fonte original.`);
  }

  return pickPreviewSentences(selected);
}

function normalizeHomePreviewField(value = "", fallback = "") {
  const cleaned = stripPreviewNoise(value).replace(/\bpauta de cidade\b/gi, "assunto da cidade");
  if (cleaned && cleaned.length <= HOME_PREVIEW_MAX_CHARS) return cleaned;
  return truncateAtBoundary(fallback || cleaned);
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

function normalizeStoryText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const IMAGE_PEOPLE_PATTERN =
  /\b(ciclista|atleta|jogador|jogadora|governador|governadora|prefeito|prefeita|senador|senadora|deputado|deputada|vereador|vereadora|delegado|delegada|secretario|secretaria|ministro|ministra|presidente|artista|cantor|cantora|ator|atriz|apresentador|apresentadora|treinador|treinadora|empresario|empresaria|medico|medica|juiz|juiza|professor|professora|estudante|aluno|aluna|familia|mae|pai|crianca|indigena|influenciador|mulher|homem|pessoa|pessoas|morador|moradores|lider|equipe|time|colegio|escola|posse|reuniao|entrevista|mailza|mailsa|lula|nikolas|bolsonaro|jair renan|alcolumbre|motta|fachin|alckmin|carmen lucia|madonna|pericles)\b/i;
const IMAGE_GROUP_PATTERN =
  /\b(posse|cerimonia|solenidade|evento|auditorio|reuniao|encontro|coletiva|equipe|time|selecao|colegio|grupo|plateia|assembleia|turma|delegacao|comite|familia|pessoas|moradores|estudantes|professores|policia civil|congresso|entrega|viaturas|jogo|multidao)\b/i;

function inferSafeImageFocus(item = {}) {
  const currentFocus = String(item.imageFocus || "").trim();
  if (currentFocus) return currentFocus;

  const storyText = normalizeStoryText([
    item.title,
    item.sourceLabel,
    item.summary,
    item.lede,
    item.category,
    item.sourceName
  ].join(" "));

  if (IMAGE_GROUP_PATTERN.test(storyText)) return "center 42%";
  if (IMAGE_PEOPLE_PATTERN.test(storyText)) return "center 38%";
  return "";
}

function isMailzaPriorityArticle(item = {}) {
  const text = slugify(
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

  return /\b(mailza|mailsa|mailza-assis|mailza-assis-cameli|governadora-mailza|governadora-em-exercicio)\b/.test(text);
}

function getNewsTimestamp(item = {}) {
  const timestamp = Date.parse(item.publishedAt || item.createdAt || item.date || "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getArticleArchiveKey(item = {}) {
  return String(
    item.slug ||
      item.id ||
      item.sourceUrl ||
      item.url ||
      item.link ||
      item.title ||
      ""
  ).trim();
}

function mergeNewsCollections(...collections) {
  const map = new Map();

  collections.flat().filter(Boolean).forEach((item) => {
    const key = getArticleArchiveKey(item);
    if (!key) return;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, item);
      return;
    }

    const existingImage = imageOf(existing);
    const itemImage = imageOf(item);
    const existingBodyCount = Array.isArray(existing.body) ? existing.body.filter(Boolean).length : 0;
    const itemBodyCount = Array.isArray(item.body) ? item.body.filter(Boolean).length : 0;
    const existingScore = (existingImage ? 10 : 0) + existingBodyCount;
    const itemScore = (itemImage ? 10 : 0) + itemBodyCount;

    map.set(key, itemScore >= existingScore ? { ...existing, ...item } : { ...item, ...existing });
  });

  return [...map.values()].sort((left, right) => {
    const dateDiff = getNewsTimestamp(right) - getNewsTimestamp(left);
    if (dateDiff !== 0) return dateDiff;
    return Number(right.priority || 0) - Number(left.priority || 0);
  });
}

function promoteMailzaPriority(items = []) {
  return items
    .map((item) => {
      if (!isMailzaPriorityArticle(item)) return item;

      return {
        ...item,
        category: "Política Regional",
        categoryKey: "politica",
        eyebrow: "governadora mailza",
        priority: Math.max(Number(item.priority || 0), 950),
        editorialPriority: "mailza-prioridade"
      };
    })
    .sort((left, right) => {
      const mailzaDiff = Number(isMailzaPriorityArticle(right)) - Number(isMailzaPriorityArticle(left));
      if (mailzaDiff !== 0) return mailzaDiff;

      const dateDiff = getNewsTimestamp(right) - getNewsTimestamp(left);
      if (dateDiff !== 0) return dateDiff;

      return Number(right.priority || 0) - Number(left.priority || 0);
    });
}

function buildLocalArticleHints() {
  const runtimePayload = readJson(RUNTIME_NEWS_FILE, { items: [] });
  const localItems = [
    ...(Array.isArray(runtimePayload.items) ? runtimePayload.items : []),
    ...readStaticNewsItems()
  ];
  const hints = new Map();
  localItems.forEach((item) => {
    const slug = String(item.slug || "").trim();
    if (!slug) return;
    const current = hints.get(slug) || {};
    hints.set(slug, {
      imageFocus: current.imageFocus || item.imageFocus || "",
      imageFit: current.imageFit || item.imageFit || "",
      editorialPriority: current.editorialPriority || item.editorialPriority || "",
      priority: Math.max(Number(current.priority || 0), Number(item.priority || 0))
    });
  });
  return hints;
}

function applyLocalArticleHints(items = [], hints = new Map()) {
  return items.map((item) => {
    const hint = hints.get(String(item.slug || "").trim());
    if (!hint) return item;
    return {
      ...item,
      imageFocus: item.imageFocus || hint.imageFocus || "",
      imageFit: item.imageFit || hint.imageFit || "",
      editorialPriority: item.editorialPriority || hint.editorialPriority || "",
      priority: Math.max(Number(item.priority || 0), Number(hint.priority || 0))
    };
  });
}

const REVIEW_COPY_BLOCKLIST = [
  "na leitura do " + "catalogo",
  "na leitura do " + "catálogo",
  "na escolha " + "editorial do catalogo",
  "na escolha " + "editorial do catálogo",
  "na leitura " + "editorial",
  "o diferencial " + "editorial aqui",
  "merece vitrine"
];

function hasReviewBlockedCopy(value = "") {
  const text = cleanText(value).toLowerCase();
  return REVIEW_COPY_BLOCKLIST.some((fragment) => text.includes(fragment));
}

function sanitizeReviewCopy(item = {}) {
  const title = cleanText(item.title || item.sourceLabel || "Noticia", 180);
  const isLongTheaterFeed =
    /g1 pop/i.test(String(item.sourceName || "")) &&
    /critica de musical de teatro|crítica de musical de teatro/i.test(`${item.lede || ""} ${item.summary || ""}`);
  const sanitizedBody = Array.isArray(item.body)
    ? item.body.filter((paragraph) => !hasReviewBlockedCopy(paragraph))
    : item.body;
  const sanitizedDevelopment = Array.isArray(item.development)
    ? item.development.filter((paragraph) => !hasReviewBlockedCopy(paragraph))
    : item.development;
  const previewSummary = buildHomePreviewSummary(item, title);
  const summary = cleanText(item.summary || "");
  const lede = cleanText(item.lede || item.summary || "");
  const publicLede = hasReviewBlockedCopy(lede) || /\bpauta\b/i.test(lede)
    ? previewSummary
    : lede;
  const publicSummary = hasReviewBlockedCopy(summary) || /\bpauta\b/i.test(summary)
    ? previewSummary
    : summary;

  return {
    ...item,
    lede: isLongTheaterFeed
      ? `${title}. A publicacao do G1 Pop & Arte traz os principais detalhes do espetaculo e da temporada.`
      : normalizeHomePreviewField(publicLede, previewSummary),
    summary: isLongTheaterFeed
      ? `${title}. O registro cultural foi resumido para melhorar a leitura no portal e manter o link da fonte original.`
      : normalizeHomePreviewField(publicSummary, previewSummary),
    analysis: hasReviewBlockedCopy(item.analysis || "") ? "" : item.analysis,
    body: sanitizedBody,
    development: sanitizedDevelopment,
    imageFocus: item.imageFocus || inferSafeImageFocus(item)
  };
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
  if (imageUrl.includes("/assets/news-fallbacks/")) return true;
  if (/(?:logo|favicon|icon|avatar|emoji|gravatar|pixel|placeholder|spacer|blank)\b/i.test(imageUrl)) {
    return true;
  }
  if (imageUrl.includes("agenciabrasil.ebc.com.br/ebc.png")) return true;
  if (imageUrl.includes("/edital-assinado-")) return true;
  return false;
}

function splitSvgLongWord(word = "", maxChars = 27) {
  const raw = String(word || "");
  if (raw.length <= maxChars) return [raw];

  const chunks = [];
  for (let index = 0; index < raw.length; index += maxChars - 1) {
    chunks.push(raw.slice(index, index + maxChars - 1));
  }
  return chunks;
}

function wrapSvgTextByWords(value = "", maxChars = 27, maxLines = 3) {
  const words = cleanText(value, 150)
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((word) => splitSvgLongWord(word, maxChars));
  const lines = [];

  words.forEach((word) => {
    if (!lines.length) {
      lines.push(word);
      return;
    }

    const current = lines[lines.length - 1] || "";
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      lines[lines.length - 1] = next;
      return;
    }

    if (lines.length < maxLines) {
      lines.push(word);
    }
  });

  const consumed = lines.join(" ").replace(/\.\.\.$/, "");
  if (words.join(" ").length > consumed.length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/\s+\S*$/, "").trim() || lines[lines.length - 1]}...`;
  }

  return lines.slice(0, maxLines);
}

function buildFallbackSvg(item = {}, reason = "fallback") {
  const title = cleanText(item.title || item.sourceLabel || "Notícia em revisão", 150);
  const category = cleanText(item.category || item.eyebrow || "Notícia", 42).toUpperCase();
  const source = cleanText(item.sourceName || "Catálogo", 42);
  const hue = (hashString(`${item.slug || title}|${reason}`) % 280) + 20;
  const titleMarkup = wrapSvgTextByWords(title, 27, 3)
    .map((line, index) => `<tspan x="126" dy="${index === 0 ? "0" : "60"}">${escapeHtml(line)}</tspan>`)
    .join("");

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
  <rect x="126" y="126" width="244" height="48" rx="24" fill="hsl(${hue} 78% 58%)"/>
  <text x="154" y="158" fill="#07111f" font-family="Arial, sans-serif" font-size="24" font-weight="800">${escapeHtml(cleanText(category, 20))}</text>
  <circle cx="986" cy="158" r="76" fill="hsl(${hue} 78% 58%)" opacity=".9"/>
  <circle cx="1038" cy="210" r="52" fill="hsl(${(hue + 55) % 360} 72% 48%)" opacity=".78"/>
  <path d="M126 492h948" stroke="hsl(${hue} 78% 58%)" stroke-width="12" stroke-linecap="round" opacity=".82"/>
  <text x="126" y="282" fill="#fff8ea" font-family="Georgia, serif" font-size="50" font-weight="700">
    ${titleMarkup}
  </text>
  <text x="126" y="574" fill="rgba(255,248,234,.72)" font-family="Arial, sans-serif" font-size="23" font-weight="700">${escapeHtml(cleanText(`${source} - imagem editorial segura`, 56))}</text>
</svg>
`;
}

function fallbackImageFor(item = {}, reason = "fallback") {
  ensureDir(FALLBACK_DIR);
  const slug = slugify(item.slug || item.title || "noticia");
  const fileName = `${slug || `noticia-${Date.now()}`}.svg`;
  const filePath = path.join(FALLBACK_DIR, fileName);
  fs.writeFileSync(filePath, buildFallbackSvg(item, reason), "utf-8");
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
    const sourceUrl = String(item.sourceUrl || item.url || item.link || "").trim();
    if (sourceUrl && sourceUrl !== "#") {
      repaired += 1;
      return {
        ...item,
        imageUrl: "",
        feedImageUrl: "",
        sourceImageUrl: "",
        originalImageUrl: isWeakImage(currentImage) ? "" : currentImage || item.originalImageUrl || "",
        originalFeedImageUrl: isWeakImage(item.feedImageUrl) ? "" : item.originalFeedImageUrl || item.feedImageUrl || "",
        originalSourceImageUrl: isWeakImage(item.sourceImageUrl) ? "" : item.originalSourceImageUrl || item.sourceImageUrl || "",
        imageQuality: `${reason}-buscar-na-fonte`
      };
    }

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
  const baseUrl = process.env.SITE_URL || DEFAULT_ONLINE_URL;
  try {
    const payload = await requestJson(`${baseUrl.replace(/\/$/, "")}/api/news?limit=${SYNC_FETCH_LIMIT}`);
    writeJson(ONLINE_NEWS_FILE, payload);
    return payload;
  } catch (error) {
    if (fs.existsSync(ONLINE_NEWS_FILE)) {
      const payload = readJson(ONLINE_NEWS_FILE, null);
      if (Array.isArray(payload?.items)) {
        return {
          ...payload,
          cachedFallback: true,
          cachedFallbackReason: String(error.message || error).slice(0, 240)
        };
      }
    }
    throw error;
  }
}

async function runReRodadaDiaGeral() {
  const startedAt = new Date().toISOString();
  const localHints = buildLocalArticleHints();
  const onlinePayload = await loadOnlineNews();
  const onlineItems = Array.isArray(onlinePayload.items) ? onlinePayload.items : [];
  const onlineAuditBefore = auditItems(onlineItems);
  const repaired = repairImages(applyLocalArticleHints(onlineItems, localHints));
  const prioritizedItems = promoteMailzaPriority(repaired.items).map(sanitizeReviewCopy);
  const archiveItems = mergeNewsCollections(
    readNewsArchiveItems(),
    readStaticNewsItems(),
    Array.isArray(readJson(RUNTIME_NEWS_FILE, { items: [] }).items)
      ? readJson(RUNTIME_NEWS_FILE, { items: [] }).items
      : [],
    prioritizedItems
  ).map(sanitizeReviewCopy);
  const onlineAuditAfterLocalRepair = auditItems(prioritizedItems);
  const archiveAuditAfterSync = auditItems(archiveItems);

  const runtimePayload = {
    lastAttemptAt: startedAt,
    lastSuccessAt: new Date().toISOString(),
    source: "re-rodada-dia-geral-online-first",
    activeWindowItems: prioritizedItems,
    items: archiveItems,
    reports: [
      {
        sourceName: "Render online",
        ok: true,
        fetched: onlineItems.length,
        activeWindowItems: prioritizedItems.length,
        archiveItems: archiveItems.length,
        repairedImages: repaired.repaired,
        mailzaPriorityItems: prioritizedItems.filter(isMailzaPriorityArticle).length,
        cachedFallback: Boolean(onlinePayload.cachedFallback),
        cachedFallbackReason: onlinePayload.cachedFallbackReason || ""
      }
    ]
  };

  writeJson(RUNTIME_NEWS_FILE, runtimePayload);
  writeJson(NEWS_ARCHIVE_FILE, archiveItems);
  writeStaticNews(archiveItems);

  const report = {
    ok: true,
    startedAt,
    finishedAt: new Date().toISOString(),
    source: "Re Rodada do Dia Geral",
    cachedFallback: Boolean(onlinePayload.cachedFallback),
    cachedFallbackReason: onlinePayload.cachedFallbackReason || "",
    onlineAuditBefore,
    localAuditAfterSync: onlineAuditAfterLocalRepair,
    archiveAuditAfterSync,
    activeWindowItems: prioritizedItems.length,
    archiveItems: archiveItems.length,
    syncFetchLimit: SYNC_FETCH_LIMIT,
    repairedImages: repaired.repaired,
    mailzaPriorityItems: prioritizedItems.filter(isMailzaPriorityArticle).length,
    rule:
      "Toda reunião grande/deploy começa lendo o online, sincroniza local, revisa offline, sobe e audita online de novo."
  };
  writeJson(REPORT_FILE, report);
  return report;
}

if (require.main === module) {
  runReRodadaDiaGeral()
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  runReRodadaDiaGeral
};
