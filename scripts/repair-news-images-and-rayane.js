"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const RUNTIME_NEWS_FILE = path.join(DATA_DIR, "runtime-news.json");
const NEWS_ARCHIVE_FILE = path.join(DATA_DIR, "news-archive.json");
const STATIC_NEWS_FILE = path.join(ROOT_DIR, "news-data.js");
const INDEX_FILE = path.join(ROOT_DIR, "index.html");
const RAYANE_MANUAL_FILE = path.join(
  ROOT_DIR,
  ".codex-temp",
  "rayane-carreira-expoacre-20260706",
  "site-ready",
  "manual-news-item-20260706-rayane-sampaio.json"
);

const RAYANE_IMAGE = "assets/news-manual/rayane-sampaio-carreira-expoacre-jurua-20260706.png";
const FALLBACKS = {
  jurua: "assets/home-cache/news-batelao-local.jpg",
  cidade: "assets/home-cache/news-batelao-local.jpg",
  prefeitura: "assets/home-cache/news-batelao-local.jpg",
  local: "assets/home-cache/news-batelao-local.jpg",
  clima: "assets/home-cache/rio-jurua-panorama.jpg",
  rio: "assets/home-cache/rio-jurua-panorama.jpg",
  acre: "assets/home-cache/trend-theo-acreano.jpg",
  default: "assets/home-cache/buzz-cruzeiro-01.jpg"
};

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

function writeStaticNews(items) {
  const safeItems = Array.isArray(items) ? items : [];
  fs.writeFileSync(
    STATIC_NEWS_FILE,
    `window.NEWS_ARCHIVE_TOTAL = ${safeItems.length};\nwindow.NEWS_DATA = ${JSON.stringify(safeItems, null, 2)};\n`,
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

function hasImage(item) {
  return Boolean(
    item &&
      (String(item.imageUrl || "").trim() ||
        String(item.feedImageUrl || "").trim() ||
        String(item.sourceImageUrl || "").trim() ||
        String(item.image || "").trim() ||
        String(item.thumbnail || "").trim())
  );
}

function chooseFallback(item) {
  const text = [
    item.categoryKey,
    item.category,
    item.previewClass,
    item.title,
    item.summary,
    item.lede,
    item.sourceName
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/jurua|juruá|cruzeiro|mancio|mâncio|rodrigues|porto walter|marechal/.test(text)) return FALLBACKS.jurua;
  if (/prefeitura|cidade|comunidade|bairro/.test(text)) return FALLBACKS.cidade;
  if (/clima|tempo|rio|enchente|defesa civil|fria|calor/.test(text)) return FALLBACKS.clima;
  if (/acre|rio branco|tarauaca|tarauacá|sena madureira|assis brasil|xapuri|brasileia|brasiléia/.test(text)) {
    return FALLBACKS.acre;
  }
  return FALLBACKS.default;
}

function ensurePublicImage(item) {
  if (!item || typeof item !== "object") return { item, changed: false };
  if (hasImage(item)) return { item, changed: false };

  const fallback = chooseFallback(item);
  const updated = {
    ...item,
    imageUrl: fallback,
    feedImageUrl: fallback,
    sourceImageUrl: "",
    imageCredit: item.imageCredit || "Imagem editorial Catálogo CZS",
    imageFocus: item.imageFocus || "center",
    imageFit: item.imageFit || "cover",
    accessibility: {
      ...(item.accessibility || {}),
      alt:
        item.accessibility?.alt ||
        `Imagem editorial do Catálogo CZS para a matéria: ${item.title || "notícia regional"}`
    },
    imageQuality: {
      ...(item.imageQuality || {}),
      status: item.imageQuality?.status || "fallback-editorial-czs",
      note:
        item.imageQuality?.note ||
        "Fonte sem imagem pública no momento da captação; aplicada imagem editorial regional para impedir matéria sem foto no site."
    }
  };

  return { item: updated, changed: true };
}

function normalizeImages(items) {
  let repaired = 0;
  const normalized = (Array.isArray(items) ? items : []).map((item) => {
    const result = ensurePublicImage(item);
    if (result.changed) repaired += 1;
    return result.item;
  });
  return { items: normalized, repaired };
}

function upsertFirst(items, item, limit) {
  const filtered = (Array.isArray(items) ? items : []).filter(
    (candidate) => candidate && candidate.slug !== item.slug && candidate.id !== item.id
  );
  return [item, ...filtered].slice(0, limit);
}

function buildRayaneItem() {
  const manual = readJson(RAYANE_MANUAL_FILE, null);
  if (!manual) throw new Error(`Materia manual da Rayane nao encontrada: ${RAYANE_MANUAL_FILE}`);

  const title = manual.title;
  const summary = manual.lede;
  const bodyText = String(manual.body || "")
    .replace(/^# .+$/m, "")
    .replace(/\n- /g, "\n")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    id: `manual-czs-${manual.slug}`,
    slug: manual.slug,
    title,
    eyebrow: "Expoacre Juruá",
    date: "06 de jul de 2026",
    publishedAt: "2026-07-06T21:00:00.000-05:00",
    category: "Juruá",
    categoryKey: "jurua",
    previewClass: "thumb-jurua",
    sourceName: manual.source || "Material recebido pelo Catálogo CZS",
    sourceUrl: manual.links?.[0] || "https://www.instagram.com/ray_ofc_czs/",
    sourceLabel: "Material recebido pelo Catálogo CZS",
    lede: summary,
    summary,
    analysis:
      "Lançamento de carreira com foco regional, presença nos espaços parceiros da Expoacre Juruá, moda, tecnologia e interação com o público.",
    highlights: [
      "Rayane Sampaio lançou publicamente sua carreira durante a Expoacre Juruá.",
      "A ação valorizou marcas parceiras do Juruá e atividades com crianças por meio da realidade virtual.",
      "O público pode acompanhar Rayane e Miguel pelas redes oficiais."
    ],
    development: bodyText,
    imageUrl: RAYANE_IMAGE,
    feedImageUrl: RAYANE_IMAGE,
    sourceImageUrl: RAYANE_IMAGE,
    imageCredit: "Foto enviada ao Catálogo CZS",
    imageFocus: "center",
    imageFit: "cover",
    media: null,
    videoUrl: "",
    priority: 1000,
    editorialPriority: "jurua-manual-destaque",
    crossSources: [
      { name: "Rayane Sampaio", url: "https://www.instagram.com/ray_ofc_czs/" },
      { name: "Miguel", url: "https://www.instagram.com/myggueloreal?igsh=eW4yN3JjNmxnd3E2" }
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
    audioNarrationStatus: "script-pronto",
    videoCaptionText:
      "Rayane Sampaio, a Princesinha do Juruá, lançou carreira na Expoacre Juruá com glamour, simpatia e gratidão aos parceiros.",
    videoCaptionStatus: "pronto",
    accessibility: {
      alt: "Rayane Sampaio posa em espaço de realidade virtual durante a Expoacre Juruá",
      caption: "Rayane Sampaio lançou sua carreira durante a Expoacre Juruá."
    },
    imageQuality: {
      status: "foto-propria",
      note: "Imagem local publicada em assets/news-manual para evitar matéria sem foto no Render."
    },
    body: bodyText
  };
}

const runtime = readJson(RUNTIME_NEWS_FILE, {});
const archive = readJson(NEWS_ARCHIVE_FILE, []);
const rayaneItem = buildRayaneItem();

const normalizedArchive = normalizeImages(archive);
const normalizedRuntimeItems = normalizeImages(runtime.items || []);
const normalizedActive = normalizeImages(runtime.activeWindowItems || runtime.items || []);

const archiveLimit = Math.max(480, normalizedArchive.items.length);
const activeLimit = Math.max(360, normalizedActive.items.length);

const updatedArchive = upsertFirst(normalizedArchive.items, rayaneItem, archiveLimit + 1);
const updatedItems = upsertFirst(normalizedRuntimeItems.items, rayaneItem, archiveLimit + 1);
const updatedActive = upsertFirst(normalizedActive.items, rayaneItem, activeLimit);

const updatedRuntime = {
  ...runtime,
  lastAttemptAt: new Date().toISOString(),
  lastSuccessAt: new Date().toISOString(),
  source: "manual-rayane-image-repair",
  activeWindowItems: updatedActive,
  items: updatedItems,
  reports: {
    ...(runtime.reports || {}),
    imageRepair20260707: {
      at: new Date().toISOString(),
      repairedArchive: normalizedArchive.repaired,
      repairedRuntimeItems: normalizedRuntimeItems.repaired,
      repairedActiveWindow: normalizedActive.repaired,
      inserted: rayaneItem.slug,
      fallbackPolicy: "no-public-news-with-empty-image-fields"
    }
  }
};

writeJson(RUNTIME_NEWS_FILE, updatedRuntime);
writeJson(NEWS_ARCHIVE_FILE, updatedArchive);
writeStaticNews(updatedArchive);
syncIndex(updatedArchive);

const missingAfter = updatedArchive.filter((item) => !hasImage(item));

console.log(
  JSON.stringify(
    {
      ok: true,
      inserted: rayaneItem.slug,
      rayaneImage: RAYANE_IMAGE,
      archive: updatedArchive.length,
      active: updatedActive.length,
      repairedArchive: normalizedArchive.repaired,
      repairedRuntimeItems: normalizedRuntimeItems.repaired,
      repairedActiveWindow: normalizedActive.repaired,
      missingAfter: missingAfter.length
    },
    null,
    2
  )
);
