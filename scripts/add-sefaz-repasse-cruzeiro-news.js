"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const RUNTIME = path.join(ROOT, "data", "runtime-news.json");
const ARCHIVE = path.join(ROOT, "data", "news-archive.json");
const STATIC = path.join(ROOT, "news-data.js");
const INDEX = path.join(ROOT, "index.html");

const slug = "cruzeiro-recebe-r-6-7-milhoes-da-sefaz";
const title = "Cruzeiro recebe R$ 6,7 milhões da Sefaz";
const summary =
  "A Sefaz informou o repasse de R$ 62 milhões aos 22 municípios acreanos referente à arrecadação de junho. Cruzeiro do Sul recebeu R$ 6,78 milhões em cotas de ICMS, IPVA e Fundeb, segundo maior valor do estado, atrás apenas de Rio Branco. Os recursos ajudam a financiar serviços públicos e investimentos municipais.";
const sourceUrl =
  "https://jurua24horas.com/2026/07/sefaz-repassa-mais-de-r-62-milhoes-aos-municipios-acreanos-cruzeiro-do-sul-recebe-r-67-milhoes/";
const imageUrl = "assets/news-manual/sefaz-repasse-cruzeiro-20260714.webp";

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
  "A Secretaria de Estado da Fazenda informou a distribuição de R$ 62.059.351,12 aos 22 municípios acreanos, referente à arrecadação estadual de junho de 2026.",
  "Cruzeiro do Sul recebeu R$ 6.783.121,38 em cotas de ICMS, IPVA e Fundeb, o segundo maior repasse do estado no período.",
  "Rio Branco liderou a lista, com R$ 28,4 milhões. Brasiléia, Senador Guiomard, Sena Madureira e Tarauacá também aparecem entre os maiores valores.",
  "Os repasses mensais ajudam as prefeituras a custear serviços públicos e realizar investimentos municipais.",
  "Fonte: Juruá 24 Horas e Sefaz-AC."
];

const item = {
  id: `manual-czs-${slug}`,
  slug,
  title,
  seoTitle: `${title} | Catálogo CZS`,
  seoDescription: summary,
  eyebrow: "Cruzeiro do Sul",
  date: "14 de jul de 2026",
  publishedAt: "2026-07-14T10:36:00.000-05:00",
  category: "Cruzeiro do Sul",
  categoryKey: "cruzeiro-do-sul",
  previewClass: "thumb-cruzeiro-do-sul",
  sourceName: "Juruá 24 Horas / Sefaz-AC",
  sourceUrl,
  sourceLabel: title,
  lede: summary,
  summary,
  analysis: "O repasse coloca Cruzeiro do Sul na segunda posição estadual e reforça o caixa dos serviços municipais.",
  highlights: [
    "Cruzeiro do Sul recebeu R$ 6,78 milhões.",
    "O total distribuído aos municípios foi de R$ 62 milhões.",
    "Os valores vêm de ICMS, IPVA e Fundeb.",
    "Cruzeiro teve o segundo maior repasse do Acre."
  ],
  development: body,
  imageUrl,
  feedImageUrl: imageUrl,
  sourceImageUrl: imageUrl,
  imageCredit: "Foto ilustrativa: Reprodução via Juruá 24 Horas",
  imageFocus: "center",
  imageFit: "cover",
  media: null,
  videoUrl: "",
  priority: 2003,
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
  videoCaptionText: `${summary} Fonte: Juruá 24 Horas / Sefaz-AC.`,
  videoCaptionStatus: "ready",
  accessibility: {
    alt: "Cédulas de cem reais em imagem ilustrativa sobre repasses municipais",
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
  source: "manual-sefaz-repasse-cruzeiro",
  activeWindowItems: updatedActive,
  items: updatedItems
});
prependStatic(item);
prependIndex(item);

console.log(JSON.stringify({ ok: true, slug, archive: updatedArchive.length, active: updatedActive.length }, null, 2));
