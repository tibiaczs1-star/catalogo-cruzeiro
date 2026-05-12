#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT_DIR, "data");
const RUNTIME_NEWS_FILE = path.join(DATA_DIR, "runtime-news.json");
const NEWS_ARCHIVE_FILE = path.join(DATA_DIR, "news-archive.json");
const STATIC_NEWS_FILE = path.join(ROOT_DIR, "news-data.js");
const TOPIC_FEED_PATTERN = /^topic-feed-.*\.json$/i;

const PUBLIC_NEWS_TEXT_FIELDS = new Set([
  "title",
  "sourceLabel",
  "lede",
  "summary",
  "analysis",
  "body",
  "highlights",
  "development",
  "description",
  "displaySummary"
]);

const PUBLIC_LANGUAGE_PATTERNS = [
  /\b(?:in late|in early|in the first)\b/i,
  /\bstarted rolling out\b/i,
  /\bnow it seems\b/i,
  /\bnew look is coming\b/i,
  /\bcoming to the rest\b/i,
  /\bwith a gradient design\b/i,
  /\bpart of what has held back\b/i,
  /\bfor a while there\b/i,
  /\bmultiple sources are reporting\b/i,
  /\bnobody is talking\b/i,
  /\bwindows users will no longer\b/i,
  /\bthe ram shortage\b/i,
  /\bcould get even worse\b/i,
  /\bwill no longer be forced\b/i,
  /\bthe us military struck\b/i,
  /\baccording to\b/i,
  /\b(?:the|a)\s+company\s+(?:said|announced|confirmed|reported)\b/i,
  /\b(?:is|are|was|were)\s+coming\s+to\b/i,
  /\b(?:will|would|could|should)\s+(?:be|have|get|make|bring|allow|include)\b/i,
  /\b(?:said|says|reported|announced|confirmed)\s+(?:that|it|the)\b/i,
  /\b(?:new|old|latest|early|late|major)\s+(?:look|design|feature|update|app|apps|icons|service|services)\b/i,
  /\b(?:users|customers|developers|people)\s+(?:can|will|would|could|should)\b/i,
  /\b(?:Microsoft will let|Alex Jones has uncovered|Xreal’s best|Xreal's best|360-degree cameras have|Cybercab goes into production|Skylight’s color-coded|Skylight's color-coded|Acclaimed Japanese director)\b/i
];

const ENGLISH_PUBLIC_MARKER_PATTERN =
  /\b(?:the|and|that|with|from|this|will|would|could|should|their|there|these|those|about|after|before|because|during|while|into|over|under|more|most|new|now|look|coming|started|rolling|design|apps|users|people|company|whether|it's|its|is|are|was|were|been|being|have|has|had|can|may|might|must|your|you|they|them|his|her|our|out|up|down|when|where|why|how|who|what|which|if|then|than|as|at|by|for|of|on|off|in|to|or|not|one|first|last|latest|today|according|reports|reportedly|expected|available|feature|features|released|announced|video|podcast|phone|camera|smart|gaming|mouse|touchscreen)\b/g;
const EMBEDDED_ENGLISH_MARKER_PATTERN =
  /\b(?:according|announced|available|because|before|camera|coming|company|confirmed|customers|developers|expected|feature|features|gaming|latest|microsoft|people|podcast|released|reported|reportedly|rolling|shortage|started|touchscreen|update|users|windows|would|could|should|school districts|three-year degrees|double milestone|opening the doors|phasmophobia)\b/g;
const PORTUGUESE_PUBLIC_MARKER_PATTERN =
  /\b(?:que|com|para|por|uma|um|das|dos|nas|nos|ao|aos|pela|pelo|mais|sobre|como|quando|porque|tambem|também|empresa|aplicativos|visual|icone|ícone|noticia|notícia|fonte|resumo|atualizacao|atualização|publicou|redacao|redação|internacional|brasil|acre)\b/g;

const KNOWN_SOURCE_URL_TITLES = new Map([
  ["best-mothers-day-gift-ideas-2026-mom-tech-gadgets", "Ideias de presentes tecnológicos para o Dia das Mães em 2026"],
  ["canva-magic-layers-ai-replacing-palestine", "Canva corrige falha de IA em camadas mágicas"],
  ["ul-testing-fire-safety-ai-standards-jennifer-scanlon", "UL fala sobre testes de segurança, fogo e padrões para IA"],
  ["amazon-wondery-oprah-podcast-show", "Podcast de Oprah Winfrey ganha distribuição pela Amazon"],
  ["govee-ceiling-light-ultra-led-pricing-availability", "Govee apresenta luminária de teto multicolorida"],
  ["spotify-peloton-guided-workouts", "Spotify amplia conteúdos de treino e bem-estar"],
  ["samsung-galaxy-z-fold-8-wide-dummy-leak", "Vazamento mostra possível Galaxy Z Fold largo"],
  ["gm-ai-car-design-nissan-neural-concept", "Montadoras testam IA no desenho de novos carros"],
  ["turtle-beach-mc7-gaming-mouse-touchscreen-command-series", "Mouse gamer da Turtle Beach aposta em tela sensível ao toque"],
  ["googles-new-gradient-icon-design-is-coming-to-more-apps", "Novo visual de ícones do Google chega a mais aplicativos"],
  ["microsoft-windows-update-pause-indefinitely", "Microsoft deve facilitar pausa nas atualizações do Windows"],
  ["how-project-maven-taught-the-military-to-love-ai", "Como o Project Maven aproximou os militares da IA"],
  ["instagram-says-it-doesnt-want-your-tweet-round-ups", "Instagram quer reduzir republicações de tuítes"],
  ["girls-around-the-globe-are-losing-gains-in-math-data-shows", "Relatório aponta recuo global de meninas em matemática"],
  ["as-school-districts-cut-budgets-dei-work-may-be-first-to-go", "Cortes em distritos escolares ameaçam trabalho de diversidade"],
  ["opinion-three-year-degrees", "Diplomas de três anos ganham debate nos Estados Unidos"],
  ["eurovision-2026-70th-anniversary-youtube-guide", "Eurovision celebra 70 anos e guia especial no YouTube"],
  ["phasmophobia-by-alan-wake-opening-the-doors-to-phasmophobias-first-collaboration", "Phasmophobia anuncia colaboração com Alan Wake"]
]);
const ENGLISH_SOURCE_FRAGMENT_PATTERN =
  /\b(?:Microsoft will let|Alex Jones has uncovered|Xreal’s best|Xreal's best|360-degree cameras have|Cybercab goes into production|Skylight’s color-coded|Skylight's color-coded|Acclaimed Japanese director)\b/i;
const URL_LIKE_PATTERN = /^https?:\/\//i;
const GENERIC_BLOCKED_COPY_PATTERN =
  /\b(?:bloqueou o resumo importado|material original ainda n[aã]o trouxe desenvolvimento|base desta not[ií]cia|sem resumo)\b/i;

function readText(filePath) {
  return fs.readFileSync(filePath, "utf-8");
}

function writeText(filePath, text) {
  fs.writeFileSync(filePath, text, "utf-8");
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(readText(filePath));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  writeText(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function stripTags(value = "") {
  return String(value || "").replace(/<[^>]+>/g, " ");
}

function normalizePublicText(value) {
  return stripTags(value)
    .replace(/<!\[CDATA\[|\]\]>/gi, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugifyPublicKey(value = "", limit = 110) {
  return normalizePublicText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, limit);
}

function fallbackIncompletePublicText(kind, item) {
  const sourceName = deriveSourceName(item) || "Fonte monitorada";
  const title = String(item?.title || item?.sourceLabel || "a atualizacao").trim();
  return `${sourceName} publicou uma atualização sobre ${title}. O portal mantém o link da fonte original para acompanhamento completo.`;
}

function repairIncompletePublicText(value, kind, item) {
  if (!["lede", "summary", "description", "displaySummary"].includes(kind)) return value;
  const hasBrokenMarkup = /\]\]>|<!\[CDATA\[/i.test(String(value || ""));
  if (hasBrokenMarkup) {
    return fallbackIncompletePublicText(kind, item);
  }

  const text = normalizePublicText(value);
  if (text.length < 80 || /[.!?…]$/.test(text)) return value;

  const sentenceEnd = Math.max(text.lastIndexOf("."), text.lastIndexOf("!"), text.lastIndexOf("?"));
  if (sentenceEnd >= 60) {
    return text.slice(0, sentenceEnd + 1).trim();
  }

  return fallbackIncompletePublicText(kind, item);
}

function publicTextLooksEnglish(value) {
  const text = normalizePublicText(value);
  if (!text) return false;
  if (PUBLIC_LANGUAGE_PATTERNS.some((regex) => regex.test(text))) {
    return true;
  }

  const lowerText = text.toLowerCase();
  const words = lowerText.match(/[a-záàâãéêíóôõúç]+/gi) || [];
  if (words.length < 5) {
    return false;
  }

  const englishMarkers = lowerText.match(ENGLISH_PUBLIC_MARKER_PATTERN) || [];
  const portugueseMarkers = lowerText.match(PORTUGUESE_PUBLIC_MARKER_PATTERN) || [];
  const hasPortugueseSignal = portugueseMarkers.length > 0 || /[áàâãéêíóôõúç]/i.test(text);

  if (words.length >= 5 && englishMarkers.length >= 4 && !hasPortugueseSignal) {
    return true;
  }

  return englishMarkers.length >= 7 && englishMarkers.length >= Math.max(1, portugueseMarkers.length * 2);
}

function countEnglishMarkers(value = "") {
  const lowerText = normalizePublicText(value).toLowerCase();
  return lowerText.match(EMBEDDED_ENGLISH_MARKER_PATTERN)?.length || 0;
}

function publicTextHasEmbeddedEnglish(value, item = {}) {
  const text = normalizePublicText(value);
  if (!text) return false;
  if (publicTextLooksEnglish(text) || ENGLISH_SOURCE_FRAGMENT_PATTERN.test(text)) return true;
  if (!isEnglishSourceItem(item)) return false;
  return countEnglishMarkers(text) >= 3 && /\b(?:sobre|tema|atualizacao|atualização|publicou|fonte)\b/i.test(text);
}

function formatSourceDomain(domain = "") {
  const host = String(domain || "").replace(/^www\./i, "").toLowerCase();
  const labels = new Map([
    ["ac24horas.com", "ac24horas"],
    ["agencia.ac.gov.br", "Agencia de Noticias do Acre"],
    ["agenciabrasil.ebc.com.br", "Agencia Brasil"],
    ["batelao.com", "Batelao"],
    ["cnnbrasil.com.br", "CNN Brasil"],
    ["g1.globo.com", "G1"],
    ["jurua24horas.com", "Jurua 24 Horas"],
    ["juruacomunicacao.com.br", "Jurua Comunicacao"],
    ["theverge.com", "The Verge"]
  ]);
  return labels.get(host) || host;
}

function sourceValueLooksLikeTitle(value, item = {}) {
  const text = normalizePublicText(value).toLowerCase();
  if (!text) return true;
  const title = normalizePublicText(item.title || item.sourceLabel || "").toLowerCase();
  return text.length > 80 || (title && text === title);
}

function hostFromUrl(value = "") {
  const text = String(value || "").trim();
  if (!/^https?:\/\//i.test(text)) return "";
  try {
    return new URL(text).hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

function deriveSourceName(item = {}) {
  const directSource = String(item.sourceName || item.source || "").trim();
  if (directSource && !sourceValueLooksLikeTitle(directSource, item)) return directSource;

  const sourceDomain = String(item.sourceDomain || "").trim();
  if (sourceDomain) return formatSourceDomain(sourceDomain);

  const host = [item.sourceUrl, item.url, item.link, item.id].map(hostFromUrl).find(Boolean);
  return host ? formatSourceDomain(host) : "";
}

function translateKnownEnglishText(text, kind = "summary") {
  const value = normalizePublicText(text);
  if (!value) return null;

  // Specific recent leaks (The Verge)
  if (/in late 2025, google started rolling out new icons with a gradient design/i.test(value)) {
    if (kind === "title") return "Ícones em degradê do Google devem chegar a mais apps";
    return "Google começou a adotar ícones em degradê; a mudança deve chegar a mais aplicativos.";
  }

  if (/multiple sources are reporting that the trump administration has dismissed the entire national science board/i.test(value)) {
    if (kind === "title") return "Relatos apontam demissão do Conselho Nacional de Ciência (NSB)";
    return "Relatos apontam que o governo Trump demitiu todo o Conselho Nacional de Ciência (NSB).";
  }

  if (/part of what has held back electric cars has been the cost/i.test(value)) {
    if (kind === "title") return "Oferta de elétricos usados pode reduzir preços";
    return "O preço ainda freia os carros elétricos, mas a oferta de usados pode derrubar valores nos próximos anos.";
  }

  if (/for a while there, it seemed like double fine might be struggling/i.test(value)) {
    if (kind === "title") return "Double Fine sob a Microsoft entra em foco";
    return "Por um tempo, parecia que o estúdio Double Fine enfrentava dificuldades sob a estrutura corporativa da Microsoft.";
  }

  if (/nobody is talking/i.test(value)) {
    if (kind === "title") return "Ninguém está falando";
    return "Ninguém está falando.";
  }

  if (/windows users will no longer be forced to run automatic updates/i.test(value)) {
    if (kind === "title") return "Windows deve reduzir interrupções por atualizações automáticas";
    return "Usuários do Windows não devem mais ser forçados a instalar atualizações automáticas no meio do uso.";
  }

  if (/the ram shortage could get even worse if samsung labor protests cut production/i.test(value)) {
    if (kind === "title") return "Escassez de RAM pode piorar com protestos na Samsung";
    return "A escassez de RAM pode piorar se protestos na Samsung afetarem a produção.";
  }

  if (/the ram shortage caused by demand from ai datacenters/i.test(value)) {
    if (kind === "title") return "Escassez de RAM pode piorar com protestos na Samsung";
    return "A escassez de RAM, pressionada pela demanda de IA, pode piorar se protestos na Samsung afetarem a produção.";
  }

  if (/in the first 24 hours of the assault on iran, the us military struck more than 1,000 targets/i.test(value)) {
    if (kind === "title") return "Ataque ao Irã: EUA relatam mais de 1.000 alvos nas primeiras 24 horas";
    return 'Nas primeiras 24 horas do ataque ao Irã, os EUA disseram ter atingido mais de 1.000 alvos, em escala maior que a ofensiva no Iraque.';
  }

  // Known headlines we saw leaking as-is
  if (/^the ram shortage could get even worse if samsung labor protests cut production$/i.test(value)) {
    return "Escassez de RAM pode piorar com protestos na Samsung";
  }

  if (/^how project maven taught the military to love ai$/i.test(value)) {
    if (kind === "title") return "Como o Project Maven aproximou os militares da IA";
    return "Como o Project Maven aproximou os militares da IA.";
  }

  if (/instagram says it doesn[’']t want your tweet round ups/i.test(value)) {
    if (kind === "title") return "Instagram quer reduzir republicações de tuítes";
    return "Instagram quer reduzir republicações de tuítes e conteúdos copiados de baixo esforço na plataforma.";
  }

  return null;
}

function fallbackPortuguese(kind, item) {
  const sourceName = deriveSourceName(item);
  const sourceHint = sourceName ? ` (fonte: ${sourceName})` : "";
  if (kind === "title") return `Notícia internacional${sourceHint}`.trim();
  if (kind === "sourceLabel") return sourceName || "Fonte externa";
  if (kind === "lede" || kind === "summary" || kind === "description" || kind === "displaySummary") {
    const title = String(item?.title || item?.sourceLabel || "tema internacional").trim();
    return `${sourceName || "Fonte externa"} publicou uma atualização sobre ${title}. A redação manteve o link da fonte original e bloqueou o resumo importado até que uma versão em português esteja pronta.`.trim();
  }
  if (kind === "body") {
    return `Notícia internacional${sourceHint}. O portal apresenta o essencial e mantém o acesso direto para a fonte completa.`.trim();
  }
  return `Notícia internacional${sourceHint}.`.trim();
}

function fallbackBodyParagraphs(item) {
  const sourceName = deriveSourceName(item) || "Fonte externa";
  const title = normalizePublicText(item?.title || item?.sourceLabel || inferPublicTitle(item));
  return [
    `${sourceName} publicou uma atualização sobre ${title}. O portal mantém o link da fonte original e retira trechos importados em inglês até que a apuração tenha versão completa em português.`,
    "A informação permanece no acervo como acompanhamento de fonte externa, sem transformar o material importado em reportagem local sem revisão."
  ];
}

function hasPortuguesePublicSignal(value = "") {
  const text = normalizePublicText(value);
  if (!text) return false;
  PORTUGUESE_PUBLIC_MARKER_PATTERN.lastIndex = 0;
  return PORTUGUESE_PUBLIC_MARKER_PATTERN.test(text.toLowerCase()) || /[áàâãéêíóôõúç]/i.test(text);
}

function isEnglishSourceItem(item = {}) {
  const sourceText = [item.sourceName, item.source, item.sourceDomain, item.sourceUrl, item.url, item.id, item.slug]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");
  return /\b(the verge|theverge\.com|techcrunch\.com|deadline\.com|variety\.com|cartoonbrew\.com|broadwayworld\.com|insidehighered\.com|edsurge\.com|thepienews\.com|hechingerreport\.org|the hechinger report|blog\.youtube|youtube blog|news\.xbox\.com|xbox wire|blog\.playstation\.com|playstation blog)\b/.test(sourceText);
}

function inferPublicTitle(item) {
  const candidates = [item?.sourceUrl, item?.url, item?.id, item?.slug].map((value) => String(value || ""));
  for (const candidate of candidates) {
    const known = [...KNOWN_SOURCE_URL_TITLES.entries()].find(([needle]) => candidate.includes(needle));
    if (known) return known[1];
  }
  const sourceName = deriveSourceName(item);
  const timestamp = Date.parse(item?.publishedAt || item?.createdAt || item?.date || "");
  const timeLabel = Number.isNaN(timestamp)
    ? String(item?.slug || item?.id || "").slice(0, 8)
    : new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Rio_Branco"
      }).format(new Date(timestamp));
  const suffix = timeLabel ? ` - ${timeLabel}` : "";
  return sourceName ? `Atualização internacional de ${sourceName}${suffix}` : `Atualização internacional${suffix}`;
}

function ensurePublicLabels(item) {
  if (!item || typeof item !== "object") return;
  const title = String(item.title || "").trim();
  const sourceLabel = String(item.sourceLabel || "").trim();

  if (!title || (isEnglishSourceItem(item) && (!hasPortuguesePublicSignal(title) || publicTextLooksEnglish(title)))) {
    item.title = inferPublicTitle(item);
  }

  if (!sourceLabel || (isEnglishSourceItem(item) && (!hasPortuguesePublicSignal(sourceLabel) || publicTextLooksEnglish(sourceLabel)))) {
    item.sourceLabel = item.title || inferPublicTitle(item);
  }
}

function sanitizeEnglishSourceFields(item) {
  if (!isEnglishSourceItem(item)) return;

  if (typeof item.categoryKey === "string" && publicTextLooksEnglish(item.categoryKey)) {
    const categoryText = [item.category, item.title, item.sourceUrl, item.url, item.slug].join(" ");
    item.categoryKey = /instagram|tiktok|youtube|tweet|repost|social/i.test(categoryText)
      ? "social"
      : "cultura";
  }

  ["lede", "summary", "description", "displaySummary"].forEach((key) => {
    const value = item[key];
    if (typeof value !== "string") return;
    if (value.trim() && hasPortuguesePublicSignal(value) && !publicTextHasEmbeddedEnglish(value, item)) {
      return;
    }
    item[key] = fallbackPortuguese(key, item);
  });

  if (Array.isArray(item.body)) {
    const hasLeak = item.body.some((entry) => typeof entry === "string" && publicTextHasEmbeddedEnglish(entry, item));
    if (hasLeak || item.body.length <= 1) {
      item.body = fallbackBodyParagraphs(item);
    }
  } else if (
    typeof item.body === "string" &&
    (!hasPortuguesePublicSignal(item.body) || publicTextHasEmbeddedEnglish(item.body, item))
  ) {
    item.body = fallbackBodyParagraphs(item);
  }
}

function sanitizeText(value, kind, item) {
  if (typeof value !== "string") return value;
  const repaired = repairIncompletePublicText(value, kind, item);
  const trimmed = String(repaired || "").trim();
  if (!trimmed) return value;
  if (!publicTextLooksEnglish(trimmed)) return repaired;

  const translated = translateKnownEnglishText(trimmed, kind);
  if (translated) return translated;

  return fallbackPortuguese(kind, item);
}

function sanitizeBodyValue(value, item) {
  if (typeof value !== "string") return value;
  let text = value;
  const title = typeof item?.title === "string" ? item.title.trim() : "";
  const sourceLabel = typeof item?.sourceLabel === "string" ? item.sourceLabel.trim() : "";
  const titlePt = translateKnownEnglishText(title, "title");
  const inferredTitlePt = inferPublicTitle(item);
  const replacementTitle = titlePt || inferredTitlePt;

  if (title && publicTextLooksEnglish(title) && replacementTitle) {
    const pattern = new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    text = text.replace(pattern, replacementTitle);
  }

  if (sourceLabel && publicTextLooksEnglish(sourceLabel) && replacementTitle) {
    const pattern = new RegExp(sourceLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    text = text.replace(pattern, replacementTitle);
  }

  if (replacementTitle && /a base desta noticia sobre\s*\./i.test(text)) {
    text = text.replace(/(a base desta noticia sobre)\s*\./i, `$1 ${replacementTitle}.`);
  }

  if (replacementTitle && /^\s*e o eixo mais concreto/i.test(text)) {
    text = text.replace(/^\s*e o eixo mais concreto/i, `${replacementTitle} e o eixo mais concreto`);
  }

  if (/instagram says it doesn[’']t want your tweet round ups/i.test(text)) {
    text = text.replace(/instagram says it doesn[’']t want your tweet round ups/gi, inferredTitlePt);
  }

  if (publicTextHasEmbeddedEnglish(text, item)) {
    const translated = translateKnownEnglishText(text, "body");
    if (translated) return translated;
    return fallbackPortuguese("body", item);
  }

  return text;
}

function normalizeCanonicalUrl(value = "") {
  const text = String(value || "").trim();
  if (!URL_LIKE_PATTERN.test(text)) return "";
  try {
    const url = new URL(text);
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"].forEach((key) => {
      url.searchParams.delete(key);
    });
    url.hash = "";
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return text.toLowerCase();
  }
}

function getCanonicalNewsUrl(item = {}) {
  return [item.sourceUrl, item.url, item.link, item.canonicalUrl, item.id]
    .map(normalizeCanonicalUrl)
    .find(Boolean) || "";
}

function normalizeNewsSlug(item = {}) {
  const current = String(item.slug || "").trim();
  const title = normalizePublicText(item.title || item.sourceLabel || "");
  const fromTitle = slugifyPublicKey(title);
  const fromUrl = slugifyPublicKey(getCanonicalNewsUrl(item).split("/").filter(Boolean).pop() || "");
  const fallback = fromTitle || fromUrl || slugifyPublicKey(item.id || item.sourceUrl || "noticia");

  if (!current || URL_LIKE_PATTERN.test(current) || current.includes("/") || current.length > 130) {
    item.slug = fallback;
    return;
  }

  item.slug = slugifyPublicKey(current) || fallback;
}

function normalizeCategoryFields(item = {}) {
  const category = normalizePublicText(item.category || item.defaultCategory || "");
  const currentKey = String(item.categoryKey || "").trim();
  const keyLooksBad =
    !currentKey ||
    currentKey.length > 48 ||
    /\s/.test(currentKey) ||
    /[.!?]/.test(currentKey) ||
    URL_LIKE_PATTERN.test(currentKey) ||
    publicTextHasEmbeddedEnglish(currentKey, item);

  if (keyLooksBad) {
    item.categoryKey = slugifyPublicKey(category || item.topicGroup || "cotidiano", 48) || "cotidiano";
  }
}

function ensureVisualCredit(item = {}) {
  if (!item || typeof item !== "object") return;
  const imageUrl = String(item.imageUrl || item.feedImageUrl || item.sourceImageUrl || item.media?.url || "").trim();
  if (!URL_LIKE_PATTERN.test(imageUrl)) return;
  if (String(item.imageCredit || item.credit || item.media?.credit || "").trim()) return;
  item.imageCredit = deriveSourceName(item) || "Fonte original";
}

function sanitizeStructuralFields(item = {}) {
  if (!item || typeof item !== "object") return item;
  normalizeNewsSlug(item);
  normalizeCategoryFields(item);
  ensureVisualCredit(item);

  ["lede", "summary", "description", "displaySummary"].forEach((key) => {
    const value = String(item[key] || "").trim();
    if (!value || !GENERIC_BLOCKED_COPY_PATTERN.test(value)) return;
    item[key] = fallbackIncompletePublicText(key, item);
  });

  return sanitizeStructuralFields(item);
}

function sanitizePublicFields(item) {
  if (!item || typeof item !== "object") return item;

  ensurePublicLabels(item);
  sanitizeEnglishSourceFields(item);

  Object.entries(item).forEach(([key, value]) => {
    if (!PUBLIC_NEWS_TEXT_FIELDS.has(key)) return;

    if (Array.isArray(value)) {
      if (key === "body") {
        item[key] = value.map((entry) => sanitizeBodyValue(entry, item));
      } else {
        item[key] = value.map((entry) => sanitizeText(entry, key, item));
      }
      return;
    }

    if (key === "body") {
      item[key] = sanitizeBodyValue(value, item);
      return;
    }

    item[key] = sanitizeText(value, key, item);
  });

  return item;
}

function sanitizeNewsList(items) {
  if (!Array.isArray(items)) return items;
  const sanitizedItems = dedupeNewsList(items.map((item) => ensureArticleBody(sanitizePublicFields(item))));
  items.splice(0, items.length, ...sanitizedItems);
  return items;
}

function publicArticleText(item = {}) {
  return [item.body, item.article, item.content, item.articleBody, item.fullText, item.text]
    .map((value) => (Array.isArray(value) ? value.join(" ") : String(value || "")))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasUsableArticleBody(item = {}) {
  return publicArticleText(item).length >= 180;
}

function articleFallbackParagraphs(item = {}) {
  const sourceName = deriveSourceName(item) || "Fonte consultada";
  const title = normalizePublicText(item.title || item.sourceLabel || "atualizacao regional");
  const summary = normalizePublicText(item.summary || item.lede || item.description || title);
  const dateLabel = normalizePublicText(item.date || item.publishedLabel || item.publishedAt || "");
  const dateText = dateLabel ? ` em ${dateLabel}` : "";

  return [
    `${sourceName} publicou${dateText} uma atualizacao sobre ${title}. O ponto confirmado ate agora e: ${summary}.`,
    `Para o leitor do Vale do Jurua, a informacao entra como registro de acompanhamento, com atencao a impacto publico, origem da apuracao e possibilidade de novos desdobramentos.`,
    "Como a captura original ainda veio curta, o portal mantem o link da fonte para leitura completa e sinaliza que a materia pode receber complemento na proxima rodada de captacao."
  ];
}

function ensureArticleBody(item) {
  if (!item || typeof item !== "object" || hasUsableArticleBody(item)) return item;
  item.body = articleFallbackParagraphs(item);
  return item;
}

function newsItemKey(item = {}) {
  return (
    getCanonicalNewsUrl(item) ||
    normalizePublicText(item.canonicalUrl || item.slug || item.id || item.title).toLowerCase()
  );
}

function newsItemScore(item = {}) {
  const bodyLength = publicArticleText(item).length;
  const sourceUrl = String(item.sourceUrl || item.url || item.link || "").trim();
  const imageUrl = String(item.imageUrl || item.image || "").trim();
  const title = String(item.title || "").trim();
  return bodyLength + (sourceUrl ? 220 : 0) + (imageUrl ? 80 : 0) + (title ? 20 : 0);
}

function dedupeNewsList(items) {
  if (!Array.isArray(items)) return items;
  const output = [];
  const indexesByKey = new Map();

  items.forEach((item) => {
    const key = newsItemKey(item);
    if (!key) {
      output.push(item);
      return;
    }

    const existingIndex = indexesByKey.get(key);
    if (existingIndex === undefined) {
      indexesByKey.set(key, output.length);
      output.push(item);
      return;
    }

    const existing = output[existingIndex];
    if (newsItemScore(item) > newsItemScore(existing)) {
      output[existingIndex] = { ...existing, ...item };
    }
  });

  return output;
}

function readStaticNewsItems() {
  if (!fs.existsSync(STATIC_NEWS_FILE)) return [];
  const source = readText(STATIC_NEWS_FILE);
  const match = source.match(/window\.NEWS_DATA\s*=\s*([\s\S]*?);\s*$/);
  if (!match) return [];
  try {
    return JSON.parse(match[1]);
  } catch {
    return [];
  }
}

function writeStaticNewsItems(items) {
  const safeItems = Array.isArray(items) ? items : [];
  writeText(
    STATIC_NEWS_FILE,
    `window.NEWS_ARCHIVE_TOTAL = ${safeItems.length};\nwindow.NEWS_DATA = ${JSON.stringify(safeItems, null, 2)};\n`
  );
}

function sanitizeRuntimeNews() {
  const payload = readJson(RUNTIME_NEWS_FILE, null);
  if (!payload || typeof payload !== "object") return { changed: false, issues: ["runtime-news unreadable"] };
  const before = JSON.stringify(payload);
  sanitizeNewsList(payload.items);
  sanitizeNewsList(payload.activeWindowItems);
  const after = JSON.stringify(payload);
  if (before !== after) {
    writeJson(RUNTIME_NEWS_FILE, payload);
    return { changed: true, issues: [] };
  }
  return { changed: false, issues: [] };
}

function sanitizeNewsArchive() {
  const payload = readJson(NEWS_ARCHIVE_FILE, null);
  if (!Array.isArray(payload)) return { changed: false, issues: ["news-archive unreadable"] };
  const before = JSON.stringify(payload);
  sanitizeNewsList(payload);
  const after = JSON.stringify(payload);
  if (before !== after) {
    writeJson(NEWS_ARCHIVE_FILE, payload);
    return { changed: true, issues: [] };
  }
  return { changed: false, issues: [] };
}

function sanitizeStaticNews() {
  const items = readStaticNewsItems();
  const before = JSON.stringify(items);
  sanitizeNewsList(items);
  const after = JSON.stringify(items);
  if (before !== after) {
    writeStaticNewsItems(items);
    return { changed: true, issues: [] };
  }
  return { changed: false, issues: [] };
}

function sanitizeTopicFeedFiles() {
  if (!fs.existsSync(DATA_DIR)) return [];

  return fs.readdirSync(DATA_DIR)
    .filter((fileName) => TOPIC_FEED_PATTERN.test(fileName))
    .map((fileName) => {
      const filePath = path.join(DATA_DIR, fileName);
      const payload = readJson(filePath, null);
      if (!payload) {
        return { file: path.relative(ROOT_DIR, filePath), changed: false, issues: [`${fileName} unreadable`] };
      }

      const before = JSON.stringify(payload);
      if (Array.isArray(payload)) {
        sanitizeNewsList(payload);
      } else if (Array.isArray(payload.items)) {
        sanitizeNewsList(payload.items);
      } else {
        Object.values(payload).forEach((value) => {
          if (Array.isArray(value)) sanitizeNewsList(value);
        });
      }

      const after = JSON.stringify(payload);
      if (before !== after) {
        writeJson(filePath, payload);
        return { file: path.relative(ROOT_DIR, filePath), changed: true, issues: [] };
      }

      return { file: path.relative(ROOT_DIR, filePath), changed: false, issues: [] };
    });
}

async function runSanitizePublicLanguage() {
  const results = [];

  results.push({ file: path.relative(ROOT_DIR, RUNTIME_NEWS_FILE), ...sanitizeRuntimeNews() });
  results.push({ file: path.relative(ROOT_DIR, NEWS_ARCHIVE_FILE), ...sanitizeNewsArchive() });
  results.push({ file: path.relative(ROOT_DIR, STATIC_NEWS_FILE), ...sanitizeStaticNews() });
  results.push(...sanitizeTopicFeedFiles());

  const issues = results.flatMap((entry) => entry.issues || []);
  return {
    ok: issues.length === 0,
    changedFiles: results.filter((entry) => entry.changed).map((entry) => entry.file),
    exitCode: issues.length === 0 ? 0 : 1,
    issues
  };
}

module.exports = { runSanitizePublicLanguage, sanitizeNewsList };

if (require.main === module) {
  runSanitizePublicLanguage()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      if (!result.ok) process.exitCode = 1;
    })
    .catch((error) => {
      console.error(error?.stack || error?.message || String(error || "error"));
      process.exitCode = 1;
    });
}
