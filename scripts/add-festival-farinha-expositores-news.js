"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const RUNTIME = path.join(ROOT, "data", "runtime-news.json");
const ARCHIVE = path.join(ROOT, "data", "news-archive.json");
const STATIC = path.join(ROOT, "news-data.js");
const INDEX = path.join(ROOT, "index.html");

const slug = "festival-da-farinha-abre-vagas-para-expositores";
const title = "Festival da Farinha abre vagas para expositores";
const summary =
  "A Prefeitura de Cruzeiro do Sul abriu o credenciamento de expositores para o 9º Festival da Farinha, marcado para 26 a 29 de agosto. As inscrições são online e seguem até 20 de julho. Há vagas para alimentação, bebidas, artesanato, ambulantes, cooperativas, MEIs e empresas; as taxas variam de R$ 50 a R$ 1.500.";
const sourceUrl =
  "https://jurua24horas.com/2026/07/prefeitura-abre-inscricoes-para-expositores-do-9o-festival-da-farinha-em-cruzeiro-do-sul/";
const imageUrl = "assets/news-manual/festival-farinha-expositores-20260714.webp";

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
  "A Prefeitura de Cruzeiro do Sul abriu o credenciamento de expositores para o 9º Festival da Farinha, programado para ocorrer entre 26 e 29 de agosto.",
  "As inscrições são online e ficam abertas até 20 de julho para pessoas físicas maiores de 18 anos e pessoas jurídicas que atendam ao edital.",
  "Há espaços para alimentação, bebidas, artesanato, ambulantes, restaurantes, trailers, cooperativas, associações, MEIs e empresas.",
  "As taxas variam de R$ 50 a R$ 1.500. Ambulantes e produtores de plantas ornamentais estão isentos, e os selecionados terão 48 horas para confirmar a participação.",
  "Fonte: Juruá 24 Horas e Prefeitura de Cruzeiro do Sul."
];

const item = {
  id: `manual-czs-${slug}`,
  slug,
  title,
  seoTitle: `${title} | Catálogo CZS`,
  seoDescription: summary,
  eyebrow: "Cruzeiro do Sul",
  date: "14 de jul de 2026",
  publishedAt: "2026-07-14T12:03:00.000-05:00",
  category: "Cruzeiro do Sul",
  categoryKey: "cruzeiro-do-sul",
  previewClass: "thumb-cruzeiro-do-sul",
  sourceName: "Juruá 24 Horas / Prefeitura de Cruzeiro do Sul",
  sourceUrl,
  sourceLabel: title,
  lede: summary,
  summary,
  analysis: "O credenciamento abre espaço para empreendedores locais participarem de um dos principais eventos do Vale do Juruá.",
  highlights: [
    "Inscrições seguem até 20 de julho.",
    "Festival ocorre de 26 a 29 de agosto.",
    "Há vagas para diversos segmentos econômicos.",
    "Taxas variam de R$ 50 a R$ 1.500."
  ],
  development: body,
  imageUrl,
  feedImageUrl: imageUrl,
  sourceImageUrl: imageUrl,
  imageCredit: "Foto: Reprodução via Juruá 24 Horas",
  imageFocus: "center",
  imageFit: "cover",
  media: null,
  videoUrl: "",
  priority: 2005,
  editorialPriority: "jurua-destaque",
  crossSources: [{ name: "Juruá 24 Horas", url: sourceUrl }],
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
  videoCaptionText: `${summary} Fonte: Juruá 24 Horas / Prefeitura de Cruzeiro do Sul.`,
  videoCaptionStatus: "ready",
  accessibility: {
    alt: "Trabalhadores produzindo farinha durante festival em Cruzeiro do Sul",
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
  source: "manual-festival-farinha-expositores",
  activeWindowItems: updatedActive,
  items: updatedItems
});
prependStatic(item);
prependIndex(item);

console.log(JSON.stringify({ ok: true, slug, archive: updatedArchive.length, active: updatedActive.length }, null, 2));
