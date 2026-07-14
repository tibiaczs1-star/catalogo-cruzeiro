"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const RUNTIME = path.join(ROOT, "data", "runtime-news.json");
const ARCHIVE = path.join(ROOT, "data", "news-archive.json");
const STATIC = path.join(ROOT, "news-data.js");
const INDEX = path.join(ROOT, "index.html");

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function words(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean);
}

function validateConfig(config) {
  const required = [
    "slug",
    "title",
    "summary",
    "publishedAt",
    "date",
    "eyebrow",
    "category",
    "categoryKey",
    "previewClass",
    "sourceName",
    "sourceUrl",
    "imageUrl",
    "imageCredit",
    "alt",
    "editorialPriority"
  ];
  for (const field of required) {
    if (!config[field]) throw new Error(`Campo obrigatório ausente: ${field}`);
  }
  if (words(config.title).length > 8) {
    throw new Error("Headline deve ter no máximo 8 palavras.");
  }
  const summaryWords = words(config.summary).length;
  if (summaryWords < 40 || summaryWords > 80) {
    throw new Error("Resumo deve ter de 40 a 80 palavras.");
  }
}

function findDuplicate(items, config) {
  for (const item of Array.isArray(items) ? items : []) {
    if (!item) continue;
    if (item.title === config.title) return { reason: "title", item };
    if (item.sourceUrl === config.sourceUrl) return { reason: "sourceUrl", item };
  }
  return null;
}

function buildItem(config) {
  const sourceLine = `Fonte: ${config.sourceName}.`;
  return {
    id: `manual-czs-${config.slug}`,
    slug: config.slug,
    title: config.title,
    seoTitle: `${config.title} | Catálogo CZS`,
    seoDescription: config.summary,
    eyebrow: config.eyebrow,
    date: config.date,
    publishedAt: config.publishedAt,
    category: config.category,
    categoryKey: config.categoryKey,
    previewClass: config.previewClass,
    sourceName: config.sourceName,
    sourceUrl: config.sourceUrl,
    sourceLabel: config.title,
    lede: config.summary,
    summary: config.summary,
    analysis: "",
    highlights: [],
    development: [config.summary, sourceLine],
    imageUrl: config.imageUrl,
    feedImageUrl: config.imageUrl,
    sourceImageUrl: config.imageUrl,
    imageCredit: config.imageCredit,
    imageFocus: config.imageFocus || "center",
    imageFit: "cover",
    media: null,
    videoUrl: config.videoUrl || "",
    priority: Number(config.priority || 2000),
    editorialPriority: config.editorialPriority,
    crossSources: [{ name: config.sourceName, url: config.sourceUrl }],
    alternateSources: [],
    sourceCount: Number(config.sourceCount || 1),
    alternateSlugs: [],
    audioNarrationText: `${config.title}. ${config.summary}`,
    audioNarrationTranscript: `${config.title}. ${config.summary}`,
    audioNarrationVoice: "raiane-francisca-whatsapp-normal",
    audioNarrationVoiceName: "RAIane Francisca WhatsApp normal",
    audioNarrationVoiceEngine: "edge-tts",
    audioNarrationVoiceModel: "pt-BR-FranciscaNeural",
    audioNarrationVoiceSampleUrl: "/assets/voice/rayl/rayl-ref2-francisca-whatsapp-normal.mp3",
    audioNarrationLanguage: "pt-BR",
    audioNarrationStatus: "ready-transcript",
    videoCaptionText: `${config.summary} ${sourceLine}`,
    videoCaptionStatus: "ready",
    accessibility: {
      alt: config.alt,
      caption: config.title,
      hasAudioNarrationText: true,
      hasAudioNarrationTranscript: true,
      raylVoice: "raiane-francisca-whatsapp-normal",
      hasVideoCaptionText: true
    },
    body: [config.summary, sourceLine]
  };
}

function upsertFirst(items, item, limit) {
  const filtered = (Array.isArray(items) ? items : []).filter(
    (candidate) => candidate && candidate.slug !== item.slug && candidate.id !== item.id
  );
  return [item, ...filtered].slice(0, limit);
}

function prependStatic(item) {
  const current = fs.readFileSync(STATIC, "utf8");
  const total = current.match(/window\.NEWS_ARCHIVE_TOTAL = (\d+);/);
  if (!total || !/window\.NEWS_DATA = \[\r?\n/.test(current)) {
    throw new Error("Estrutura de news-data.js não reconhecida.");
  }
  const serialized = JSON.stringify(item, null, 2)
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
  const updated = current
    .replace(
      /window\.NEWS_ARCHIVE_TOTAL = \d+;/,
      `window.NEWS_ARCHIVE_TOTAL = ${Number(total[1]) + 1};`
    )
    .replace(/window\.NEWS_DATA = \[\r?\n/, `window.NEWS_DATA = [\n${serialized},\n`);
  fs.writeFileSync(STATIC, updated, "utf8");
}

function prependIndex(item) {
  const current = fs.readFileSync(INDEX, "utf8");
  const match = current.match(/<script id="newsData" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error("Bloco newsData não encontrado.");
  const payload = JSON.parse(match[1]);
  const filtered = (Array.isArray(payload.items) ? payload.items : []).filter(
    (candidate) => candidate && candidate.slug !== item.slug && candidate.id !== item.id
  );
  payload.items = [item, ...filtered];
  payload.total = payload.items.length;
  payload.archiveTotal = payload.items.length;
  payload.returned = payload.items.length;
  const replacement = `<script id="newsData" type="application/json">${JSON.stringify(payload)}</script>`;
  fs.writeFileSync(INDEX, current.replace(match[0], replacement), "utf8");
}

function run(configFile) {
  const config = readJson(path.resolve(configFile), null);
  if (!config) throw new Error(`Configuração inválida: ${configFile}`);
  validateConfig(config);

  const runtime = readJson(RUNTIME, {});
  const archive = readJson(ARCHIVE, []);
  const duplicate = findDuplicate(archive, config);
  if (duplicate) {
    const result = { ok: true, skipped: true, reason: duplicate.reason, slug: duplicate.item.slug };
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return result;
  }

  const item = buildItem(config);
  const imagePath = path.join(ROOT, item.imageUrl);
  if (!fs.existsSync(imagePath)) throw new Error(`Imagem ausente: ${imagePath}`);

  const archiveLimit = Math.max(1400, Array.isArray(archive) ? archive.length : 1400);
  const activeLimit = Math.max(360, Array.isArray(runtime.activeWindowItems) ? runtime.activeWindowItems.length : 360);
  const updatedArchive = upsertFirst(archive, item, archiveLimit);
  const updatedItems = upsertFirst(runtime.items, item, archiveLimit);
  const updatedActive = upsertFirst(runtime.activeWindowItems || runtime.items, item, activeLimit);
  const now = new Date().toISOString();

  writeJson(ARCHIVE, updatedArchive);
  writeJson(RUNTIME, {
    ...runtime,
    lastAttemptAt: now,
    lastSuccessAt: now,
    source: "czs-fast-mode-v3",
    activeWindowItems: updatedActive,
    items: updatedItems
  });
  prependStatic(item);
  prependIndex(item);

  const result = {
    ok: true,
    skipped: false,
    slug: item.slug,
    summaryWords: words(item.summary).length,
    archive: updatedArchive.length,
    active: updatedActive.length
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result;
}

function configArg(argv) {
  const index = argv.indexOf("--config");
  if (index < 0 || !argv[index + 1]) throw new Error("Use --config <arquivo.json>.");
  return argv[index + 1];
}

module.exports = {
  buildItem,
  findDuplicate,
  run,
  validateConfig
};

if (require.main === module) run(configArg(process.argv.slice(2)));
