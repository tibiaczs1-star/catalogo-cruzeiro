"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const RUNTIME_NEWS_FILE = path.join(DATA_DIR, "runtime-news.json");
const NEWS_ARCHIVE_FILE = path.join(DATA_DIR, "news-archive.json");
const STATIC_NEWS_FILE = path.join(ROOT_DIR, "news-data.js");
const INDEX_FILE = path.join(ROOT_DIR, "index.html");

const slug = "servico-publico-menina-11-anos-desaparecida-cruzeiro-do-sul";
const sourceUrl = "https://deunoticia.com/2026/06/menina-de-11-anos-e-dada-como-desaparecida-em-cruzeiro-do-sul/";

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function writeStaticNews(items) {
  fs.writeFileSync(
    STATIC_NEWS_FILE,
    `window.NEWS_ARCHIVE_TOTAL = ${items.length};\nwindow.NEWS_DATA = ${JSON.stringify(items, null, 2)};\n`,
    "utf8"
  );
}

function syncIndex(items) {
  const index = fs.readFileSync(INDEX_FILE, "utf8");
  const payload = {
    ok: true,
    total: items.length,
    archiveTotal: items.length,
    returned: items.length,
    items
  };
  const replacement = `<script id="newsData" type="application/json">${JSON.stringify(payload)}</script>`;
  const updated = index.replace(
    /<script id="newsData" type="application\/json">[\s\S]*?<\/script>/,
    replacement
  );

  if (updated === index) {
    throw new Error("Bloco newsData nao encontrado no index.html.");
  }

  fs.writeFileSync(INDEX_FILE, updated, "utf8");
}

function upsertFirst(items, item, limit) {
  const filtered = (Array.isArray(items) ? items : []).filter(
    (candidate) => candidate && candidate.slug !== item.slug && candidate.id !== item.id
  );
  return [item, ...filtered].slice(0, limit);
}

const title = "Serviço público: menina de 11 anos é dada como desaparecida em Cruzeiro do Sul";
const summary =
  "Caso publicado pelo Deu Notícia mobiliza familiares e moradores. Por envolver menor de idade, a orientação é compartilhar apenas informações verificadas e evitar boatos.";
const body = [
  "Uma menina de 11 anos, identificada pela fonte como Bianca Silva de Araújo, foi dada como desaparecida em Cruzeiro do Sul, no interior do Acre.",
  "Segundo publicação do Deu Notícia, o caso mobiliza familiares e moradores da cidade. Até esta apuração, o Catálogo CZS não localizou confirmação pública confiável de que ela tenha sido encontrada.",
  "Por se tratar de uma menor de idade, a orientação é compartilhar apenas informações verificadas, evitar boatos e procurar familiares ou autoridades competentes quando houver informação segura.",
  "O Catálogo CZS acompanha o caso e atualiza a matéria se houver confirmação oficial ou nova publicação da fonte."
];

const item = {
  id: sourceUrl,
  slug,
  title,
  eyebrow: "Serviço Público",
  date: "28 de jun de 2026",
  publishedAt: "2026-06-28T16:45:00.000-05:00",
  category: "Juruá",
  categoryKey: "jurua",
  previewClass: "thumb-jurua",
  sourceName: "Deu Notícia",
  sourceUrl,
  sourceLabel: title,
  lede: summary,
  summary,
  analysis: "Conteúdo sensível envolvendo menor de idade. Publicação tratada como serviço público, com foco em informação verificada, fonte clara e responsabilidade no compartilhamento.",
  highlights: [
    "Fonte informa desaparecimento em Cruzeiro do Sul.",
    "Catálogo CZS não encontrou confirmação pública confiável de localização até esta atualização.",
    "Compartilhamento deve evitar boatos por envolver menor de idade."
  ],
  development: body,
  imageUrl: "assets/news-manual/bianca-desaparecida-cruzeiro-do-sul-20260628.png",
  feedImageUrl: "assets/news-manual/bianca-desaparecida-cruzeiro-do-sul-20260628.png",
  sourceImageUrl: "",
  imageCredit: "Arte Catálogo CZS sobre informação publicada pelo Deu Notícia",
  imageFocus: "center",
  imageFit: "contain",
  media: null,
  videoUrl: "",
  priority: 999,
  editorialPriority: "servico-publico-hiperlocal",
  crossSources: [{ name: "Deu Notícia", url: sourceUrl }],
  alternateSources: [],
  sourceCount: 1,
  alternateSlugs: [],
  audioNarrationText: `${title}. ${summary} ${body.join(" ")}`,
  audioNarrationTranscript: `${title}. ${summary} ${body.join(" ")}`,
  audioNarrationVoice: "raiane-francisca-whatsapp-normal",
  audioNarrationVoiceName: "RAIane Francisca WhatsApp normal",
  audioNarrationVoiceEngine: "edge-tts",
  audioNarrationVoiceModel: "pt-BR-FranciscaNeural",
  audioNarrationVoiceSampleUrl: "/assets/voice/rayl/rayl-ref2-francisca-whatsapp-normal.mp3",
  audioNarrationLanguage: "pt-BR",
  audioNarrationStatus: "script-pronto",
  videoCaptionText: "Serviço público em Cruzeiro do Sul. Fonte: Deu Notícia. Compartilhe apenas informação verificada.",
  videoCaptionStatus: "pronto",
  accessibility: {
    alt: "Card do Catálogo CZS sobre menina de 11 anos dada como desaparecida em Cruzeiro do Sul",
    caption: "Serviço público: caso publicado pelo Deu Notícia em Cruzeiro do Sul."
  },
  imageQuality: {
    status: "arte-propria",
    note: "Card 1080x1350 com logo oficial Catálogo CZS e fonte identificada."
  },
  body
};

const runtime = readJson(RUNTIME_NEWS_FILE, {});
const archive = readJson(NEWS_ARCHIVE_FILE, []);
const archiveLimit = Math.max(480, Array.isArray(archive) ? archive.length : 480);
const activeLimit = Math.max(360, Array.isArray(runtime.activeWindowItems) ? runtime.activeWindowItems.length : 360);
const updatedArchive = upsertFirst(archive, item, archiveLimit);
const updatedItems = upsertFirst(runtime.items, item, archiveLimit);
const updatedActive = upsertFirst(runtime.activeWindowItems || runtime.items, item, activeLimit);

const updatedRuntime = {
  ...runtime,
  lastAttemptAt: new Date().toISOString(),
  lastSuccessAt: new Date().toISOString(),
  source: "manual-editorial-czs",
  activeWindowItems: updatedActive,
  items: updatedItems
};

writeJson(RUNTIME_NEWS_FILE, updatedRuntime);
writeJson(NEWS_ARCHIVE_FILE, updatedArchive);
writeStaticNews(updatedArchive);
syncIndex(updatedArchive);

console.log(JSON.stringify({ ok: true, slug, title, archive: updatedArchive.length, active: updatedActive.length }, null, 2));
