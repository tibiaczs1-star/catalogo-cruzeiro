"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const ARCHIVE_FILE = path.join(ROOT_DIR, "data", "news-archive.json");
const RUNTIME_FILE = path.join(ROOT_DIR, "data", "runtime-news.json");
const REPORT_FILE = path.join(ROOT_DIR, "data", "latest-news-capture-report.json");
const STATIC_FILE = path.join(ROOT_DIR, "news-data.js");
const INDEX_FILE = path.join(ROOT_DIR, "index.html");

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function storyKey(item = {}) {
  const text = normalizeText([item.title, item.summary, item.lede].filter(Boolean).join(" "));
  if (text.includes("rodrigues alves") && text.includes("ramal dos esquecidos")) {
    return "story:ramal-dos-esquecidos-rodrigues-alves";
  }
  if (text.includes("sena madureira") && text.includes("piracema")) {
    return "story:piracema-sena-madureira";
  }
  if (text.includes("tarauaca") && text.includes("ambulancia") && text.includes("boi")) {
    return "story:ambulancia-boi-tarauaca";
  }
  if (text.includes("pirarara") && (text.includes("rio madeira") || text.includes("pescador carrega"))) {
    return "story:pirarara-rio-madeira";
  }
  if (text.includes("dias martins") && (text.includes("colisao") || text.includes("lentidao"))) {
    return "story:colisao-dias-martins";
  }
  return `item:${normalizeText(item.id || item.sourceUrl || item.title)}`;
}

function mergeNews(existing, manualItems, limit) {
  const keys = new Set(manualItems.map(storyKey));
  const ids = new Set(manualItems.flatMap((item) => [item.id, item.slug, item.sourceUrl]).filter(Boolean));
  const filtered = (Array.isArray(existing) ? existing : []).filter((item) => {
    if (!item || keys.has(storyKey(item))) return false;
    return ![item.id, item.slug, item.sourceUrl].some((value) => value && ids.has(value));
  });
  return [...manualItems, ...filtered].slice(0, limit);
}

function buildItem(config) {
  const narration = `${config.title}. ${config.summary} Fonte: ${config.sourceName}.`;
  return {
    id: `manual-czs-social-${config.slug}`,
    slug: config.slug,
    title: config.title,
    eyebrow: config.eyebrow,
    date: "13 de jul de 2026",
    publishedAt: config.publishedAt,
    category: config.category,
    categoryKey: config.categoryKey,
    previewClass: config.previewClass,
    sourceName: config.sourceName,
    sourceUrl: config.sourceUrl,
    sourceLabel: config.sourceName,
    lede: config.summary,
    summary: config.summary,
    analysis: config.analysis || "",
    highlights: config.highlights || [],
    development: config.body,
    imageUrl: config.imageUrl,
    feedImageUrl: config.imageUrl,
    sourceImageUrl: config.imageUrl,
    imageCredit: `Frame do vídeo publicado por ${config.sourceName}`,
    imageFocus: "center",
    imageFit: "cover",
    media: null,
    videoUrl: "",
    priority: config.priority,
    editorialPriority: config.editorialPriority,
    crossSources: [{ name: config.sourceName, url: config.sourceUrl }],
    alternateSources: [],
    sourceCount: 1,
    alternateSlugs: [],
    audioNarrationText: narration,
    audioNarrationTranscript: narration,
    audioNarrationVoice: "raiane-francisca-whatsapp-normal",
    audioNarrationVoiceName: "RAIane Francisca WhatsApp normal",
    audioNarrationVoiceEngine: "edge-tts",
    audioNarrationVoiceModel: "pt-BR-FranciscaNeural",
    audioNarrationVoiceSampleUrl: "/assets/voice/rayl/rayl-ref2-francisca-whatsapp-normal.mp3",
    audioNarrationLanguage: "pt-BR",
    audioNarrationStatus: "ready-transcript",
    videoCaptionText: `Imagem da notícia: ${config.title}. ${config.summary} Fonte: ${config.sourceName}.`,
    videoCaptionStatus: "ready",
    accessibility: {
      alt: config.alt,
      hasAudioNarrationText: true,
      hasAudioNarrationTranscript: true,
      raylVoice: "raiane-francisca-whatsapp-normal",
      hasVideoCaptionText: true
    },
    imageQuality: {
      status: "frame-real-do-video",
      note: "Capa extraída do vídeo original e publicada com identidade horizontal do Catálogo CZS."
    },
    editorialGate: "P1",
    editorialApproval: "manual-check",
    editorialSpotlightReady: true,
    editorialSurfaceTier: "news",
    editorialLocalTier: config.localTier,
    socialSync: {
      instagramAccount: "@catalogo_czs_",
      instagramMilestone: 1050,
      collaboratorsRequested: ["@conexaoacreac", "@acre.diario"],
      syncedAt: "2026-07-13T15:35:00.000Z"
    },
    body: config.body
  };
}

const MANUAL_ITEMS = [
  buildItem({
    slug: "moradores-fecham-ramal-dos-esquecidos-rodrigues-alves-20260713",
    title: "Moradores fecham Ramal dos Esquecidos em Rodrigues Alves",
    eyebrow: "Vale do Juruá",
    publishedAt: "2026-07-13T15:31:00.000Z",
    category: "Juruá",
    categoryKey: "jurua",
    previewClass: "thumb-jurua",
    sourceName: "ac24horas",
    sourceUrl: "https://www.instagram.com/ac24horas/reel/Danoa0wuApF/",
    summary: "Moradores da comunidade Foz do Paraná bloquearam o Ramal dos Esquecidos para cobrar recuperação da estrada, usada no transporte escolar, no acesso à saúde e no escoamento da produção.",
    analysis: "A mobilização expõe um problema direto de mobilidade rural e acesso a serviços básicos no Vale do Juruá.",
    highlights: [
      "O bloqueio ocorreu na zona rural de Rodrigues Alves.",
      "Moradores cobram manutenção e uma resposta oficial para a estrada.",
      "A prefeitura informou que o prefeito foi ao local conversar com os manifestantes."
    ],
    body: [
      "Moradores da comunidade Foz do Paraná fecharam o Ramal dos Esquecidos para cobrar a recuperação da via.",
      "Segundo os manifestantes, a precariedade afeta o transporte escolar, o acesso a atendimentos de saúde e o escoamento da produção agrícola.",
      "A prefeitura informou que o prefeito foi ao local conversar com o grupo. Até a última atualização da fonte, não havia cronograma de obras divulgado."
    ],
    imageUrl: "assets/news-manual/czs-1050-ramal-rodrigues-alves-20260713.jpg",
    priority: 1100,
    editorialPriority: "jurua-social-sync-1050",
    localTier: 5,
    alt: "Estrada de terra do Ramal dos Esquecidos durante protesto em Rodrigues Alves"
  }),
  buildItem({
    slug: "piracema-movimenta-porto-sena-madureira-20260713",
    title: "Piracema movimenta o Porto de Sena Madureira",
    eyebrow: "Rio Purus",
    publishedAt: "2026-07-13T15:25:00.000Z",
    category: "Acre",
    categoryKey: "acre",
    previewClass: "thumb-rio",
    sourceName: "ContilNet Notícias",
    sourceUrl: "https://www.instagram.com/contilnetnoticias/reel/DarFUdQJsJh/",
    summary: "Vídeo divulgado no sábado (11) mostra pescadores capturando mandi durante a chegada da piracema ao Rio Purus, em Sena Madureira.",
    body: [
      "A chegada da piracema ao Rio Purus movimentou o Porto de Sena Madureira.",
      "As imagens mostram pescadores capturando mandi e a grande quantidade de peixes nas margens do rio.",
      "O registro foi publicado pela ContilNet Notícias e ganhou repercussão nas redes sociais."
    ],
    imageUrl: "assets/news-manual/czs-1050-piracema-sena-madureira-20260713.jpg",
    priority: 1060,
    editorialPriority: "acre-social-sync-1050",
    localTier: 4,
    alt: "Pescadores e peixes durante a piracema no Porto de Sena Madureira"
  }),
  buildItem({
    slug: "ambulancia-atinge-boi-br-364-tarauaca-20260713",
    title: "Ambulância atinge boi na BR-364 em Tarauacá",
    eyebrow: "BR-364",
    publishedAt: "2026-07-13T15:18:00.000Z",
    category: "Segurança",
    categoryKey: "seguranca",
    previewClass: "thumb-transito",
    sourceName: "Acre Diário",
    sourceUrl: "https://www.instagram.com/acre.diario/reel/DarBuJvt-7h/",
    summary: "Vídeo divulgado pelo Acre Diário mostra uma ambulância após atingir um boi na BR-364, em Tarauacá, e reforça o alerta para animais soltos na rodovia.",
    body: [
      "Uma ambulância atingiu um boi em um trecho da BR-364, em Tarauacá.",
      "O registro mostra o veículo após a colisão e chama atenção para o risco de animais soltos na estrada durante a noite.",
      "Informações oficiais sobre feridos não haviam sido confirmadas pela fonte até a publicação."
    ],
    imageUrl: "assets/news-manual/czs-1050-ambulancia-boi-tarauaca-20260713.jpg",
    priority: 1055,
    editorialPriority: "acre-transito-social-sync-1050",
    localTier: 4,
    alt: "Ambulância parada à noite após colisão com boi na BR-364 em Tarauacá"
  }),
  buildItem({
    slug: "pescador-carrega-pirarara-gigante-rio-madeira-20260713",
    title: "Pescador carrega pirarara gigante nas costas no Rio Madeira",
    eyebrow: "Amazônia",
    publishedAt: "2026-07-13T15:04:00.000Z",
    category: "Amazônia",
    categoryKey: "amazonia",
    previewClass: "thumb-rio",
    sourceName: "ContilNet Notícias",
    sourceUrl: "https://contilnetnoticias.com.br/voce-viu/pescador-carrega-pirarara-gigante-nas-costas-em-barranco-do-rio-madeira/",
    summary: "Um pescador foi filmado carregando uma pirarara de grandes proporções enquanto subia um barranco às margens do Rio Madeira, em Rondônia.",
    body: [
      "O registro mostra um pescador transportando uma pirarara de grandes proporções às margens do Rio Madeira, em Rondônia.",
      "Conhecida como tubarão da Amazônia, a espécie pode ultrapassar 1,3 metro de comprimento e pesar mais de 50 quilos.",
      "O tamanho do peixe e o esforço para subir o barranco chamaram atenção nas redes sociais."
    ],
    imageUrl: "assets/news-manual/czs-1050-pirarara-rio-madeira-20260713.jpg",
    priority: 1045,
    editorialPriority: "amazonia-viral-social-sync-1050",
    localTier: 3,
    alt: "Pescador carregando uma pirarara gigante nas costas às margens do Rio Madeira"
  }),
  buildItem({
    slug: "colisao-longa-fila-estrada-dias-martins-20260713",
    title: "Colisão causa longa fila na Estrada Dias Martins",
    eyebrow: "Trânsito",
    publishedAt: "2026-07-13T14:57:00.000Z",
    category: "Trânsito",
    categoryKey: "transito",
    previewClass: "thumb-transito",
    sourceName: "ContilNet Notícias",
    sourceUrl: "https://contilnetnoticias.com.br/policia/acidente-na-descida-de-viaduto-provoca-lentidao-de-veiculos-em-rio-branco/",
    summary: "Uma colisão entre um automóvel e uma motocicleta causou lentidão e extensa fila na Estrada Dias Martins, em Rio Branco, na noite de sábado (11).",
    body: [
      "Uma colisão entre um automóvel e uma motocicleta causou lentidão na Estrada Dias Martins, em Rio Branco.",
      "O acidente ocorreu na descida do viaduto e formou uma extensa fila de veículos no início da noite de sábado (11).",
      "Até a última atualização da fonte, não havia confirmação oficial sobre a dinâmica do acidente nem sobre o estado de saúde dos envolvidos."
    ],
    imageUrl: "assets/news-manual/czs-1050-colisao-dias-martins-20260713.jpg",
    priority: 1040,
    editorialPriority: "acre-transito-social-sync-1050",
    localTier: 3,
    alt: "Fila de veículos após colisão na Estrada Dias Martins em Rio Branco"
  })
];

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function syncStaticSource(source, manualItems) {
  const match = source.match(/window\.NEWS_DATA\s*=\s*([\s\S]*?);\s*$/);
  if (!match) throw new Error("Bloco NEWS_DATA nao encontrado em news-data.js.");

  const currentItems = JSON.parse(match[1]);
  const updatedItems = mergeNews(currentItems, manualItems, currentItems.length || 480);
  const updatedSource = source
    .replace(/window\.NEWS_ARCHIVE_TOTAL\s*=\s*\d+;/, `window.NEWS_ARCHIVE_TOTAL = ${updatedItems.length};`)
    .replace(match[0], `window.NEWS_DATA = ${JSON.stringify(updatedItems, null, 2)};\n`);
  return { items: updatedItems, source: updatedSource };
}

function syncIndexSource(source, manualItems) {
  const pattern = /<script id="newsData" type="application\/json">([\s\S]*?)<\/script>/;
  const match = source.match(pattern);
  if (!match) throw new Error("Bloco newsData nao encontrado no index.html.");

  const payload = JSON.parse(match[1]);
  const currentItems = Array.isArray(payload.items) ? payload.items : [];
  const updatedItems = mergeNews(currentItems, manualItems, currentItems.length || 480);
  const updatedPayload = {
    ...payload,
    total: updatedItems.length,
    archiveTotal: updatedItems.length,
    returned: updatedItems.length,
    items: updatedItems
  };
  const replacement = `<script id="newsData" type="application/json">${JSON.stringify(updatedPayload)}</script>`;
  return { items: updatedItems, source: source.replace(pattern, replacement) };
}

function run() {
  const archive = readJson(ARCHIVE_FILE, []);
  const runtime = readJson(RUNTIME_FILE, {});
  const report = readJson(REPORT_FILE, {});
  const staticSource = fs.readFileSync(STATIC_FILE, "utf8");
  const indexSource = fs.readFileSync(INDEX_FILE, "utf8");
  const updatedArchive = mergeNews(archive, MANUAL_ITEMS, 480);
  const updatedActive = mergeNews(runtime.activeWindowItems || runtime.items || [], MANUAL_ITEMS, 360);
  const updatedRuntimeItems = mergeNews(runtime.items || archive, MANUAL_ITEMS, 480);
  const updatedStatic = syncStaticSource(staticSource, MANUAL_ITEMS);
  const updatedIndex = syncIndexSource(indexSource, MANUAL_ITEMS);
  const now = new Date().toISOString();

  const updatedRuntime = {
    ...runtime,
    lastAttemptAt: now,
    lastSuccessAt: now,
    source: "instagram-goal-1050-sync",
    activeWindowItems: updatedActive,
    items: updatedRuntimeItems
  };
  const updatedReport = {
    ...report,
    generatedAt: now,
    goal1050Sync: {
      at: now,
      instagramAccount: "@catalogo_czs_",
      instagramPosts: 1050,
      insertedOrPromoted: MANUAL_ITEMS.map((item) => item.slug),
      archiveItems: updatedArchive.length,
      activeItems: updatedActive.length
    }
  };

  writeJson(ARCHIVE_FILE, updatedArchive);
  writeJson(RUNTIME_FILE, updatedRuntime);
  writeJson(REPORT_FILE, updatedReport);
  fs.writeFileSync(STATIC_FILE, updatedStatic.source, "utf8");
  fs.writeFileSync(INDEX_FILE, updatedIndex.source, "utf8");

  const ids = new Set();
  const titles = new Set();
  const duplicateIds = [];
  const duplicateTitles = [];
  for (const item of updatedArchive) {
    if (ids.has(item.id)) duplicateIds.push(item.id);
    if (titles.has(normalizeText(item.title))) duplicateTitles.push(item.title);
    ids.add(item.id);
    titles.add(normalizeText(item.title));
  }

  const result = {
    ok: duplicateIds.length === 0 && duplicateTitles.length === 0,
    first: updatedArchive[0].title,
    archive: updatedArchive.length,
    active: updatedActive.length,
    duplicateIds,
    duplicateTitles,
    synced: MANUAL_ITEMS.length
  };
  if (!result.ok) throw new Error(JSON.stringify(result));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = {
  MANUAL_ITEMS,
  mergeNews,
  normalizeText,
  run,
  storyKey,
  syncIndexSource,
  syncStaticSource
};

if (require.main === module) run();
