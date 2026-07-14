"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const RUNTIME = path.join(ROOT, "data", "runtime-news.json");
const ARCHIVE = path.join(ROOT, "data", "news-archive.json");
const STATIC = path.join(ROOT, "news-data.js");
const INDEX = path.join(ROOT, "index.html");

const slug = "bombeiros-alertam-para-riscos-no-rio-jurua";
const title = "Bombeiros alertam para riscos no Rio Juruá";
const summary =
  "O Corpo de Bombeiros alerta que a estiagem aumentou os riscos de navegação no Rio Juruá. Três embarcações afundaram nesta semana, sem feridos. Condutores devem evitar excesso de peso e superlotação, reduzir a velocidade em trechos rasos e observar bancos de areia e galhos. O uso de colete salva-vidas é indispensável para todos os ocupantes.";
const sourceUrl =
  "https://jurua24horas.com/2026/07/corpo-de-bombeiros-alerta-para-risco-de-acidentes-no-rio-jurua-durante-estiagem/";
const imageUrl = "assets/home-cache/rio-jurua-panorama.jpg";

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
  "O nível do Rio Juruá caiu com a estiagem e aumentou os riscos para embarcações que circulam na região de Cruzeiro do Sul.",
  "Segundo o Corpo de Bombeiros Militar do Acre, três embarcações afundaram nesta semana, mas as ocorrências causaram apenas danos materiais e ninguém ficou ferido.",
  "Os condutores devem evitar superlotação e excesso de peso, reduzir a velocidade nos trechos rasos e observar bancos de areia, galhos e outros obstáculos naturais.",
  "O uso de colete salva-vidas por todos os ocupantes é indispensável e reduz o risco de afogamento em caso de naufrágio.",
  "Fonte: Juruá 24 Horas e Corpo de Bombeiros Militar do Acre."
];

const item = {
  id: `manual-czs-${slug}`,
  slug,
  title,
  seoTitle: `${title} | Catálogo CZS`,
  seoDescription: summary,
  eyebrow: "Vale do Juruá",
  date: "14 de jul de 2026",
  publishedAt: "2026-07-14T11:17:00.000-05:00",
  category: "Vale do Juruá",
  categoryKey: "vale-do-jurua",
  previewClass: "thumb-vale-do-jurua",
  sourceName: "Juruá 24 Horas / Corpo de Bombeiros do Acre",
  sourceUrl,
  sourceLabel: title,
  lede: summary,
  summary,
  analysis: "O alerta combina prevenção, uso de equipamentos de segurança e condução cautelosa durante a vazante.",
  highlights: [
    "Três embarcações afundaram nesta semana.",
    "As ocorrências não deixaram pessoas feridas.",
    "Bancos de areia e galhos elevam o risco.",
    "Colete salva-vidas é indispensável."
  ],
  development: body,
  imageUrl,
  feedImageUrl: imageUrl,
  sourceImageUrl: imageUrl,
  imageCredit: "Imagem: arquivo regional do Catálogo CZS",
  imageFocus: "center",
  imageFit: "cover",
  media: null,
  videoUrl: "",
  priority: 2004,
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
  videoCaptionText: `${summary} Fonte: Juruá 24 Horas / Corpo de Bombeiros do Acre.`,
  videoCaptionStatus: "ready",
  accessibility: {
    alt: "Rio Juruá durante período de estiagem no Vale do Juruá",
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
  source: "manual-rio-jurua-alerta-estiagem",
  activeWindowItems: updatedActive,
  items: updatedItems
});
prependStatic(item);
prependIndex(item);

console.log(JSON.stringify({ ok: true, slug, archive: updatedArchive.length, active: updatedActive.length }, null, 2));
