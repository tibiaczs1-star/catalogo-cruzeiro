"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const RUNTIME = path.join(ROOT, "data", "runtime-news.json");
const ARCHIVE = path.join(ROOT, "data", "news-archive.json");
const STATIC = path.join(ROOT, "news-data.js");
const INDEX = path.join(ROOT, "index.html");

const slug = "cruzeiro-reforca-combate-as-queimadas";
const title = "Cruzeiro reforça combate às queimadas";
const summary =
  "Órgãos municipais, estaduais e federais alinharam ações para prevenir e combater queimadas em Cruzeiro do Sul durante a estiagem. A reunião definiu trabalho conjunto em fiscalização, educação ambiental e resposta a incêndios. A população foi orientada a evitar o uso do fogo e denunciar ocorrências à Defesa Civil ou aos Bombeiros pelo número 193.";
const sourceUrl =
  "https://contilnetnoticias.com.br/politica/cruzeiro-do-sul-une-seis-orgaos-para-reforcar-combate-as-queimadas/";
const imageUrl = "assets/news-manual/cruzeiro-combate-queimadas-20260714.webp";

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

function upsertFirst(items, item, limit) {
  const filtered = (Array.isArray(items) ? items : []).filter(
    (candidate) => candidate && candidate.slug !== item.slug && candidate.id !== item.id
  );
  return [item, ...filtered].slice(0, limit);
}

function prependStatic(item) {
  const current = fs.readFileSync(STATIC, "utf8");
  if (current.includes(`\"slug\": \"${item.slug}\"`)) return;
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

const body = [
  "Representantes da Prefeitura de Cruzeiro do Sul, Corpo de Bombeiros, Imac, Ministério Público, Defesa Civil, Ibama e Sema se reuniram para alinhar ações durante o período de estiagem.",
  "O trabalho conjunto deve reunir fiscalização, educação ambiental e resposta a incêndios florestais, rurais e urbanos, além de medidas para reduzir os impactos da fumaça.",
  "A orientação é evitar o uso do fogo e comunicar ocorrências à Defesa Civil de Cruzeiro do Sul ou aos Bombeiros pelo número 193.",
  "A programação operacional de cada órgão poderá ser atualizada conforme o avanço do período crítico de queimadas.",
  "Fonte: ContilNet e Prefeitura de Cruzeiro do Sul."
];

const item = {
  id: `manual-czs-${slug}`,
  slug,
  title,
  seoTitle: `${title} | Catálogo CZS`,
  seoDescription: summary,
  eyebrow: "Cruzeiro do Sul",
  date: "14 de jul de 2026",
  publishedAt: "2026-07-14T09:15:00.000-05:00",
  category: "Cruzeiro do Sul",
  categoryKey: "cruzeiro-do-sul",
  previewClass: "thumb-cruzeiro-do-sul",
  sourceName: "ContilNet / Prefeitura de Cruzeiro do Sul",
  sourceUrl,
  sourceLabel: title,
  lede: summary,
  summary,
  analysis: "A ação é preventiva e reúne órgãos dos três níveis de governo para o período de estiagem.",
  highlights: [
    "Órgãos alinharam prevenção e combate às queimadas.",
    "Fiscalização e educação ambiental fazem parte do plano.",
    "A população deve evitar fogo e denunciar ocorrências.",
    "Bombeiros atendem pelo número 193."
  ],
  development: body,
  imageUrl,
  feedImageUrl: imageUrl,
  sourceImageUrl: imageUrl,
  imageCredit: "Foto: Assessoria/Prefeitura de Cruzeiro do Sul via ContilNet",
  imageFocus: "center",
  imageFit: "cover",
  media: null,
  videoUrl: "",
  priority: 2000,
  editorialPriority: "jurua-destaque",
  crossSources: [{ name: "ContilNet", url: sourceUrl }],
  alternateSources: [],
  sourceCount: 1,
  alternateSlugs: [],
  audioNarrationText: `${title}. ${summary}`,
  audioNarrationTranscript: `${title}. ${summary}`,
  audioNarrationVoice: "raiane-francisca-whatsapp-normal",
  audioNarrationVoiceName: "RAIane Francisca WhatsApp normal",
  audioNarrationVoiceEngine: "edge-tts",
  audioNarrationVoiceModel: "pt-BR-FranciscaNeural",
  audioNarrationVoiceSampleUrl: "/assets/voice/rayl/rayl-ref2-francisca-whatsapp-normal.mp3",
  audioNarrationLanguage: "pt-BR",
  audioNarrationStatus: "ready-transcript",
  videoCaptionText: `${summary} Fonte: ContilNet / Prefeitura de Cruzeiro do Sul.`,
  videoCaptionStatus: "ready",
  accessibility: {
    alt: "Representantes de órgãos públicos reunidos em Cruzeiro do Sul",
    caption: title,
    hasAudioNarrationText: true,
    hasAudioNarrationTranscript: true,
    raylVoice: "raiane-francisca-whatsapp-normal",
    hasVideoCaptionText: true
  },
  body
};

const runtime = readJson(RUNTIME, {});
const archive = readJson(ARCHIVE, []);
const archiveLimit = Math.max(1400, Array.isArray(archive) ? archive.length : 1400);
const activeLimit = Math.max(360, Array.isArray(runtime.activeWindowItems) ? runtime.activeWindowItems.length : 360);
const updatedArchive = upsertFirst(archive, item, archiveLimit);
const updatedItems = upsertFirst(runtime.items, item, archiveLimit);
const updatedActive = upsertFirst(runtime.activeWindowItems || runtime.items, item, activeLimit);

writeJson(ARCHIVE, updatedArchive);
writeJson(RUNTIME, {
  ...runtime,
  lastAttemptAt: new Date().toISOString(),
  lastSuccessAt: new Date().toISOString(),
  source: "manual-cruzeiro-combate-queimadas",
  activeWindowItems: updatedActive,
  items: updatedItems
});
prependStatic(item);
prependIndex(item);

console.log(JSON.stringify({ ok: true, slug, archive: updatedArchive.length, active: updatedActive.length }, null, 2));
