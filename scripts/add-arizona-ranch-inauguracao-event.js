"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const RUNTIME = path.join(ROOT, "data", "runtime-news.json");
const ARCHIVE = path.join(ROOT, "data", "news-archive.json");
const STATIC = path.join(ROOT, "news-data.js");
const INDEX = path.join(ROOT, "index.html");

const slug = "agenda-arizona-ranch-inauguracao-05-setembro";
const title = "Agenda: Arizona Ranch inaugura em 5 de setembro com Especial Marília Mendonça";
const purchaseUrl = "https://catalogo-cruzeiro-web.onrender.com/pagamentos/reservaranch/";
const supportUrl = "https://wa.me/556899582615";
const imageUrl = "assets/news-manual/2026-08-26/arizona-ranch-inauguracao.png";
const summary =
  "Conteúdo comercial: o Arizona Ranch anuncia sua inauguração oficial em Cruzeiro do Sul, com Luzienne Lucena no Especial Marília Mendonça. Mesas podem ser escolhidas e reservadas online.";

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
  "Conteúdo comercial: o Arizona Ranch informa que sua inauguração oficial será realizada em 5 de setembro, em Cruzeiro do Sul.",
  "A programação terá Luzienne Lucena no Especial Marília Mendonça.",
  "As mesas para duas pessoas custam R$ 100 e as mesas para quatro pessoas, R$ 200. O couvert é de R$ 7 por pessoa.",
  `As mesas disponíveis podem ser escolhidas no mapa e reservadas pelo endereço oficial: ${purchaseUrl}`,
  `Para dúvidas e suporte, o proprietário Silem Paulo atende pelo WhatsApp +55 68 9958-2615: ${supportUrl}`
];

const item = {
  id: `manual-czs-${slug}`,
  slug,
  title,
  seoTitle: `${title} | Catálogo CZS`,
  seoDescription: summary,
  eyebrow: "Agenda patrocinada",
  date: "26 de ago de 2026",
  publishedAt: "2026-08-26T01:45:00.000-05:00",
  category: "Cultura",
  categoryKey: "cultura",
  previewClass: "thumb-cultura",
  contentType: "publicidade",
  commercialDisclosure: "Conteúdo comercial",
  eventDate: "2026-09-05",
  sourceName: "Arizona Ranch",
  sourceUrl: purchaseUrl,
  sourceLabel: "Reserva oficial Arizona Ranch",
  lede: summary,
  summary,
  analysis: "A reserva antecipada permite escolher a mesa no mapa, conforme a disponibilidade exibida no sistema oficial.",
  highlights: [
    "Inauguração oficial em 5 de setembro.",
    "Luzienne Lucena no Especial Marília Mendonça.",
    "Mesa para duas pessoas: R$ 100; mesa para quatro: R$ 200.",
    "Suporte com Silem Paulo pelo WhatsApp +55 68 9958-2615."
  ],
  development: body,
  imageUrl,
  feedImageUrl: imageUrl,
  sourceImageUrl: imageUrl,
  imageCredit: "Arte: Arizona Ranch",
  imageFocus: "center",
  imageFit: "contain",
  media: null,
  videoUrl: "",
  priority: 1800,
  editorialPriority: "agenda-patrocinada",
  crossSources: [
    { name: "Reserva oficial Arizona Ranch", url: purchaseUrl },
    { name: "Suporte do proprietário", url: supportUrl }
  ],
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
  videoCaptionText: `${summary} Reserva: ${purchaseUrl} Suporte: +55 68 9958-2615.`,
  videoCaptionStatus: "ready",
  accessibility: {
    alt: "Flyer de inauguração do Arizona Ranch em Cruzeiro do Sul",
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
  source: "manual-arizona-ranch-agenda-patrocinada",
  activeWindowItems: updatedActive,
  items: updatedItems
});
prependStatic(item);
prependIndex(item);

console.log(JSON.stringify({ ok: true, slug, archive: updatedArchive.length, active: updatedActive.length }, null, 2));
