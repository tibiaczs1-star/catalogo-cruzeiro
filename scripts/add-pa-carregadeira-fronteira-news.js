"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const RUNTIME = path.join(ROOT, "data", "runtime-news.json");
const ARCHIVE = path.join(ROOT, "data", "news-archive.json");
const STATIC = path.join(ROOT, "news-data.js");
const INDEX = path.join(ROOT, "index.html");

const slug = "maquina-de-r-200-mil-e-recuperada";
const title = "Máquina de R$ 200 mil é recuperada";
const summary =
  "Uma pá carregadeira avaliada em cerca de R$ 200 mil foi recuperada pela Polícia Civil em Costa Marques, Rondônia, perto da fronteira com a Bolívia. Segundo a investigação, a máquina havia sido obtida em um golpe registrado em Porto Velho e seria levada ao país vizinho por uma rota clandestina. O caso continua sob investigação.";
const sourceUrl =
  "https://www.juruaemtempo.com.br/2026/07/pa-carregadeira-de-r-200-mil-e-recuperada-antes-de-ser-levada-para-a-bolivia/";
const imageUrl = "assets/news-manual/pa-carregadeira-fronteira-20260714.webp";

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
  "Uma pá carregadeira avaliada em aproximadamente R$ 200 mil foi recuperada pela Polícia Civil em Costa Marques, Rondônia, região próxima à fronteira com a Bolívia.",
  "Segundo a investigação, o equipamento havia sido obtido por meio de fraude registrada em Porto Velho.",
  "A suspeita é de que a máquina seria levada para o país vizinho por uma rota clandestina na faixa de fronteira.",
  "O bem foi localizado antes de deixar o território brasileiro e o caso continua sob apuração das autoridades.",
  "Fonte: Juruá em Tempo e Polícia Civil de Rondônia."
];

const item = {
  id: `manual-czs-${slug}`,
  slug,
  title,
  seoTitle: `${title} | Catálogo CZS`,
  seoDescription: summary,
  eyebrow: "Fronteira",
  date: "14 de jul de 2026",
  publishedAt: "2026-07-14T10:16:00.000-05:00",
  category: "Brasil",
  categoryKey: "brasil",
  previewClass: "thumb-brasil",
  sourceName: "Juruá em Tempo / Polícia Civil de Rondônia",
  sourceUrl,
  sourceLabel: title,
  lede: summary,
  summary,
  analysis: "A recuperação evitou que um equipamento de alto valor atravessasse a fronteira por uma rota clandestina.",
  highlights: [
    "Máquina é avaliada em cerca de R$ 200 mil.",
    "Equipamento foi localizado perto da Bolívia.",
    "Investigação aponta fraude registrada em Porto Velho.",
    "O caso continua sob apuração policial."
  ],
  development: body,
  imageUrl,
  feedImageUrl: imageUrl,
  sourceImageUrl: imageUrl,
  imageCredit: "Foto: Polícia Civil de Rondônia via Juruá em Tempo",
  imageFocus: "center",
  imageFit: "cover",
  media: null,
  videoUrl: "",
  priority: 1999,
  editorialPriority: "brasil-destaque",
  crossSources: [{ name: "Juruá em Tempo", url: sourceUrl }],
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
  videoCaptionText: `${summary} Fonte: Juruá em Tempo / Polícia Civil de Rondônia.`,
  videoCaptionStatus: "ready",
  accessibility: {
    alt: "Pá carregadeira recuperada pela polícia durante a noite",
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
  source: "manual-pa-carregadeira-fronteira",
  activeWindowItems: updatedActive,
  items: updatedItems
});
prependStatic(item);
prependIndex(item);

console.log(JSON.stringify({ ok: true, slug, archive: updatedArchive.length, active: updatedActive.length }, null, 2));
