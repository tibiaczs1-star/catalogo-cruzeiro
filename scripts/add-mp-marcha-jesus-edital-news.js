"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const RUNTIME = path.join(ROOT, "data", "runtime-news.json");
const ARCHIVE = path.join(ROOT, "data", "news-archive.json");
const STATIC = path.join(ROOT, "news-data.js");
const INDEX = path.join(ROOT, "index.html");

const slug = "mp-questiona-edital-de-r-2-4-milhoes";
const title = "MP questiona edital de R$ 2,4 milhões";
const summary =
  "O Ministério Público do Acre recomendou que a Fundação Elias Mansour suspenda o edital de R$ 2,4 milhões destinado à Marcha para Jesus em 21 municípios. O MP cita possíveis falhas apontadas pelo TCE, como prazo reduzido, critérios religiosos, concentração dos recursos em uma entidade e ausência do projeto no Plano Estadual de Cultura. A FEM tem 15 dias para responder.";
const sourceUrl =
  "https://jurua24horas.com/2026/07/mp-recomenda-suspensao-de-edital-de-r-24-milhoes-da-marcha-para-jesus-e-aponta-possiveis-irregularidades/";
const mpacUrl =
  "https://www.mpac.mp.br/mpac-instaura-procedimento-para-fiscalizar-a-aplicacao-de-recursos-publicos-destinados-a-marcha-para-jesus/";
const imageUrl = "assets/news-manual/mp-marcha-jesus-edital-20260714.webp";

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
  "O Ministério Público do Acre recomendou a suspensão dos atos ligados ao edital da Fundação Elias Mansour que prevê R$ 2,4 milhões para a Marcha para Jesus em 21 municípios.",
  "Segundo a reportagem, a recomendação cita possíveis falhas apontadas pelo Tribunal de Contas do Estado, entre elas prazo reduzido, critérios de participação ligados à religião e concentração dos recursos em uma única organização.",
  "O documento também questiona a ausência do projeto no Plano Estadual de Cultura. A FEM e a Casa Civil têm 15 dias para informar as providências adotadas.",
  "O procedimento segue em apuração, com preservação do contraditório e do direito de defesa. Em maio, o MPAC já havia informado a abertura de fiscalização sobre a aplicação dos recursos.",
  "Fontes: Juruá 24 Horas, ac24horas e Ministério Público do Acre."
];

const item = {
  id: `manual-czs-${slug}`,
  slug,
  title,
  seoTitle: `${title} | Catálogo CZS`,
  seoDescription: summary,
  eyebrow: "Acre",
  date: "14 de jul de 2026",
  publishedAt: "2026-07-14T12:18:00.000-05:00",
  category: "Acre",
  categoryKey: "acre",
  previewClass: "thumb-acre",
  sourceName: "Juruá 24 Horas / ac24horas / MPAC",
  sourceUrl,
  sourceLabel: title,
  lede: summary,
  summary,
  analysis: "A recomendação amplia o controle sobre recursos públicos destinados ao evento e aguarda manifestação dos órgãos estaduais.",
  highlights: [
    "O edital prevê R$ 2,4 milhões para 21 municípios.",
    "O MP recomendou a suspensão dos atos ligados ao chamamento.",
    "A recomendação cita possíveis falhas apontadas pelo TCE.",
    "A FEM tem 15 dias para responder."
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
  priority: 2006,
  editorialPriority: "acre-destaque",
  crossSources: [
    { name: "Juruá 24 Horas", url: sourceUrl },
    { name: "MPAC", url: mpacUrl }
  ],
  alternateSources: [{ name: "MPAC", url: mpacUrl }],
  sourceCount: 3,
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
  videoCaptionText: `${summary} Fonte: Juruá 24 Horas / ac24horas / MPAC.`,
  videoCaptionStatus: "ready",
  accessibility: {
    alt: "Multidão participa da Marcha para Jesus no Acre",
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
  source: "manual-mp-marcha-jesus-edital",
  activeWindowItems: updatedActive,
  items: updatedItems
});
prependStatic(item);
prependIndex(item);

console.log(JSON.stringify({ ok: true, slug, archive: updatedArchive.length, active: updatedActive.length }, null, 2));
