#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT_DIR = path.resolve(__dirname, "..");
const NEWS_FILE = path.join(ROOT_DIR, "news-data.js");
const REPORT_FILE = path.join(ROOT_DIR, "data", "news-image-focus-audit.json");
const FRONTEND_FILES = [
  path.join(ROOT_DIR, "script.js"),
  path.join(ROOT_DIR, "arquivo-noticias.js")
];

const DEFAULT_TIMEOUT_MS = 9000;
const DEFAULT_CONCURRENCY = 5;
const DEFAULT_LIMIT = 80;
const WHATSAPP_MESSAGE_LIMIT = 3800;

const personPattern =
  /\b(ciclista|atleta|jogador|jogadora|governador|governadora|prefeito|prefeita|senador|senadora|deputado|deputada|delegado|delegada|secretario|secretaria|ministro|ministra|presidente|artista|cantor|cantora|ator|atriz|apresentador|apresentadora|treinador|treinadora|empresario|empresaria|medico|medica|juiz|juiza|estudante|aluno|aluna|professor|professora|entrevista|familia|mae|pai|crianca|indigena)\b/;
const groupPattern =
  /\b(posse|cerimonia|solenidade|evento|auditorio|reuniao|encontro|coletiva|equipe|time|selecao|colegio|grupo|plateia|assembleia|turma|delegacao|comite)\b/;
const landscapePattern =
  /\b(bolsa|mercado|dolar|cidade|rio|ponte|bairro|rodovia|estrada|enchente|cheia|alag|obra|calcadao|orcamento|salario|superavit|petroleo|economia|feira|fachada|predio|clima|friagem|chuva)\b/;

function parseArgs(argv) {
  const options = {
    concurrency: DEFAULT_CONCURRENCY,
    limit: DEFAULT_LIMIT,
    offline: false,
    strict: false,
    strictNew: false,
    notifyWhatsapp: "off"
  };

  argv.forEach((arg) => {
    if (arg === "--offline") options.offline = true;
    if (arg === "--strict") options.strict = true;
    if (arg === "--strict-new") options.strictNew = true;
    if (arg === "--notify-whatsapp") options.notifyWhatsapp = "all";
    if (arg.startsWith("--notify-whatsapp=")) {
      const mode = String(arg.replace("--notify-whatsapp=", "") || "").trim().toLowerCase();
      if (["off", "all", "new"].includes(mode)) {
        options.notifyWhatsapp = mode;
      }
    }
    if (arg.startsWith("--limit=")) {
      const parsed = Number(arg.replace("--limit=", ""));
      if (Number.isFinite(parsed) && parsed > 0) options.limit = Math.floor(parsed);
    }
    if (arg.startsWith("--concurrency=")) {
      const parsed = Number(arg.replace("--concurrency=", ""));
      if (Number.isFinite(parsed) && parsed > 0) options.concurrency = Math.floor(parsed);
    }
  });

  return options;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function loadNewsData() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(NEWS_FILE, "utf-8"), sandbox, {
    filename: NEWS_FILE
  });
  return Array.isArray(sandbox.window.NEWS_DATA) ? sandbox.window.NEWS_DATA : [];
}

function safeReadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return fallback;
  }
}

function extractObjectLiteral(source, name) {
  const startToken = `const ${name} = {`;
  const start = source.indexOf(startToken);
  if (start === -1) return null;

  const objectStart = source.indexOf("{", start);
  let depth = 0;
  for (let i = objectStart; i < source.length; i += 1) {
    const char = source[i];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) {
      return source.slice(objectStart, i + 1);
    }
  }

  return null;
}

function loadFocusOverrides() {
  const merged = {};

  FRONTEND_FILES.forEach((file) => {
    if (!fs.existsSync(file)) return;
    const source = fs.readFileSync(file, "utf-8");
    const literal = extractObjectLiteral(source, "articleImageFocusOverridesBySlug");
    if (!literal) return;

    try {
      const sandbox = { result: {} };
      vm.createContext(sandbox);
      vm.runInContext(`result = (${literal});`, sandbox, { filename: file });
      Object.assign(merged, sandbox.result || {});
    } catch (error) {
      console.warn(`[news-focus-audit] nao foi possivel ler overrides em ${path.basename(file)}: ${error.message}`);
    }
  });

  return merged;
}

function pickImageUrl(article) {
  return (
    article.imageUrl ||
    article.feedImageUrl ||
    article.sourceImageUrl ||
    article.image ||
    ""
  );
}

function inferDimensionsFromUrl(url) {
  const matches = String(url || "").match(/(?:^|[-_/])(\d{3,5})x(\d{3,5})(?:[-_.?/]|$)/i);
  if (!matches) return null;

  const width = Number(matches[1]);
  const height = Number(matches[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  return {
    width,
    height,
    ratio: Number((width / height).toFixed(3)),
    orientation: width > height ? "landscape" : width < height ? "portrait" : "square"
  };
}

function getStorySignals(article) {
  const text = normalizeText([
    article.title,
    article.sourceLabel,
    article.summary,
    article.lede,
    article.category,
    article.sourceName
  ].join(" "));

  return {
    hasPersonSignal: personPattern.test(text),
    hasGroupSignal: groupPattern.test(text),
    hasLandscapeSignal: landscapePattern.test(text)
  };
}

function getEffectiveFocus(article, focusOverrides) {
  const direct = String(article.imageFocus || "").trim();
  if (direct) return direct;
  const slug = String(article.slug || "").trim();
  return slug ? String(focusOverrides[slug] || "").trim() : "";
}

function parseFocusY(focus) {
  const tokens = String(focus || "").trim().split(/\s+/).filter(Boolean);
  const yToken = tokens[1] || "";
  const match = yToken.match(/^(-?\d+(?:\.\d+)?)%$/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function classifyArticle(article, imageCheck, focusOverrides, previousSlugs) {
  const slug = String(article.slug || article.id || article.url || article.title || "").trim();
  const title = String(article.title || article.sourceLabel || slug || "Sem titulo").trim();
  const imageUrl = pickImageUrl(article);
  const effectiveFocus = getEffectiveFocus(article, focusOverrides);
  const dimensions = inferDimensionsFromUrl(imageUrl);
  const signals = getStorySignals(article);
  const reasons = [];
  let level = "ok";

  if (!imageUrl) {
    level = "error";
    reasons.push("missing-image-url");
  } else if (imageCheck.status === "unreachable") {
    level = "warning";
    reasons.push("image-unreachable");
  } else if (imageCheck.status === "not-image") {
    level = "warning";
    reasons.push("image-content-type-not-confirmed");
  }

  const peopleScene = signals.hasPersonSignal || signals.hasGroupSignal;
  const likelyWideCrop =
    !dimensions ||
    dimensions.orientation === "portrait" ||
    (dimensions.ratio && dimensions.ratio < 1.45);

  if (!effectiveFocus && peopleScene && likelyWideCrop) {
    level = level === "error" ? level : "review";
    reasons.push("people-or-group-scene-without-manual-focus");
  }

  if (!effectiveFocus && signals.hasGroupSignal && !signals.hasLandscapeSignal) {
    level = level === "error" ? level : "review";
    if (!reasons.includes("group-scene-without-manual-focus")) {
      reasons.push("group-scene-without-manual-focus");
    }
  }

  if (effectiveFocus) {
    reasons.push("manual-focus-present");
  }

  const focusY = parseFocusY(effectiveFocus);
  if (peopleScene && focusY !== null && focusY < 28) {
    level = level === "error" ? level : "review";
    reasons.push("hero-focus-too-high-for-wide-headline");
  }

  return {
    slug,
    title,
    category: article.category || "",
    sourceName: article.sourceName || article.source || "",
    publishedAt: article.publishedAt || article.date || article.createdAt || "",
    isNewSinceLastAudit: !previousSlugs.has(slug),
    imageUrl,
    imageStatus: imageCheck.status,
    imageHttpStatus: imageCheck.httpStatus || null,
    imageContentType: imageCheck.contentType || "",
    dimensionsFromUrl: dimensions,
    hasManualFocus: Boolean(effectiveFocus),
    effectiveFocus,
    signals,
    level,
    reasons
  };
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": "CatalogoCruzeiroNewsFocusAudit/1.0",
        ...(options.headers || {})
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

async function checkImageUrl(url, offline) {
  if (!url) return { status: "missing" };
  if (offline) return { status: "skipped-offline" };

  if (/^(?:\.\/|\/)?assets\//i.test(String(url || ""))) {
    const localPath = path.join(ROOT_DIR, String(url).replace(/^\.\//, "").replace(/^\//, ""));
    return fs.existsSync(localPath)
      ? { status: "ok", httpStatus: 200, contentType: "image/svg+xml" }
      : { status: "unreachable", httpStatus: 404, contentType: "" };
  }

  try {
    let response = await fetchWithTimeout(url, { method: "HEAD" });
    if (!response.ok || response.status === 405) {
      response = await fetchWithTimeout(url, {
        method: "GET",
        headers: { Range: "bytes=0-4096" }
      });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) {
      return {
        status: "unreachable",
        httpStatus: response.status,
        contentType
      };
    }

    return {
      status: /^image\//i.test(contentType) || !contentType ? "ok" : "not-image",
      httpStatus: response.status,
      contentType
    };
  } catch (error) {
    return {
      status: "unreachable",
      error: error.name === "AbortError" ? "timeout" : error.message
    };
  }
}

function getPublicArticleUrl(item) {
  const siteUrl = String(process.env.SITE_URL || process.env.PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
  if (!siteUrl || !item.slug) return "";
  return `${siteUrl}/noticia.html?slug=${encodeURIComponent(item.slug)}`;
}

function formatReasons(reasons = []) {
  const labels = {
    "missing-image-url": "sem imagem",
    "image-unreachable": "imagem fora do ar",
    "image-content-type-not-confirmed": "tipo de imagem nao confirmado",
    "people-or-group-scene-without-manual-focus": "pessoa/grupo sem foco manual",
    "group-scene-without-manual-focus": "grupo sem foco manual",
    "manual-focus-present": "tem foco manual",
    "hero-focus-too-high-for-wide-headline": "foco alto demais para manchete larga"
  };
  return reasons.map((reason) => labels[reason] || reason).join(", ");
}

function buildWhatsappAuditMessage(items = [], report = {}) {
  const badItems = Array.isArray(items) ? items.filter(Boolean) : [];
  const header = [
    "Alerta do Catalogo: foto de noticia precisa revisao",
    `Gerado em: ${new Date(report.updatedAt || Date.now()).toLocaleString("pt-BR", {
      timeZone: "America/Rio_Branco"
    })}`,
    `Fila: ${badItems.length} item(ns)`
  ];

  const lines = badItems.slice(0, 8).flatMap((item, index) => {
    const articleUrl = getPublicArticleUrl(item);
    return [
      "",
      `${index + 1}. ${item.title || item.slug || "Sem titulo"}`,
      `Nivel: ${item.level || "review"}`,
      `Motivo: ${formatReasons(item.reasons) || "revisao de foto"}`,
      item.effectiveFocus ? `Foco atual: ${item.effectiveFocus}` : "Foco atual: sem foco manual",
      articleUrl ? `Abrir: ${articleUrl}` : "",
      item.imageUrl ? `Imagem: ${item.imageUrl}` : ""
    ].filter(Boolean);
  });

  if (badItems.length > 8) {
    lines.push("", `Mais ${badItems.length - 8} item(ns) no arquivo data/news-image-focus-audit.json.`);
  }

  return [...header, ...lines].join("\n").slice(0, WHATSAPP_MESSAGE_LIMIT);
}

function getWhatsappConfig() {
  return {
    enabled: /^(1|true|yes|sim)$/i.test(String(process.env.WHATSAPP_ALERT_ENABLED || "")),
    token: String(process.env.WHATSAPP_CLOUD_TOKEN || "").trim(),
    phoneNumberId: String(process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID || "").trim(),
    to: String(process.env.WHATSAPP_ALERT_TO || "").replace(/[^\d]/g, "")
  };
}

async function sendWhatsappAuditAlert(items = [], report = {}) {
  const config = getWhatsappConfig();
  if (!items.length) return;

  const message = buildWhatsappAuditMessage(items, report);
  if (!config.enabled) {
    console.log("[news-focus-audit] WhatsApp desativado. Configure WHATSAPP_ALERT_ENABLED=true para enviar alertas.");
    return;
  }

  if (!config.token || !config.phoneNumberId || !config.to) {
    const link = config.to ? `https://wa.me/${config.to}?text=${encodeURIComponent(message)}` : "";
    console.warn("[news-focus-audit] WhatsApp sem credenciais completas. Configure WHATSAPP_CLOUD_TOKEN, WHATSAPP_CLOUD_PHONE_NUMBER_ID e WHATSAPP_ALERT_TO.");
    if (link) {
      console.warn(`[news-focus-audit] Link manual: ${link}`);
    }
    return;
  }

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${encodeURIComponent(config.phoneNumberId)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: config.to,
        type: "text",
        text: {
          preview_url: true,
          body: message
        }
      })
    }
  );

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`WhatsApp Cloud API ${response.status}: ${body.slice(0, 500)}`);
  }

  console.log(`[news-focus-audit] alerta WhatsApp enviado para ${config.to}.`);
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  const workers = Array.from(
    { length: Math.max(1, Math.min(concurrency, items.length || 1)) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

async function runAuditNewsImageFocus(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const previousReport = safeReadJson(REPORT_FILE, {});
  const previousSlugs = new Set(Array.isArray(previousReport.slugs) ? previousReport.slugs : []);
  const focusOverrides = loadFocusOverrides();
  const articles = loadNewsData().slice(0, options.limit);
  const checks = await mapWithConcurrency(articles, options.concurrency, (article) =>
    checkImageUrl(pickImageUrl(article), options.offline)
  );

  const items = articles.map((article, index) =>
    classifyArticle(article, checks[index], focusOverrides, previousSlugs)
  );

  const summary = items.reduce(
    (acc, item) => {
      acc[item.level] = (acc[item.level] || 0) + 1;
      if (item.hasManualFocus) acc.manualFocus += 1;
      if (item.isNewSinceLastAudit) acc.newSinceLastAudit += 1;
      if (item.imageStatus === "missing") acc.missingImage += 1;
      if (item.imageStatus === "unreachable") acc.unreachableImage += 1;
      return acc;
    },
    {
      ok: 0,
      review: 0,
      warning: 0,
      error: 0,
      manualFocus: 0,
      newSinceLastAudit: 0,
      missingImage: 0,
      unreachableImage: 0
    }
  );

  const report = {
    updatedAt: new Date().toISOString(),
    sourceFile: path.relative(ROOT_DIR, NEWS_FILE).replace(/\\/g, "/"),
    checkedLimit: options.limit,
    offline: options.offline,
    total: items.length,
    summary,
    slugs: items.map((item) => item.slug).filter(Boolean),
    reviewQueue: items
      .filter((item) => item.level !== "ok")
      .map(({ slug, title, level, reasons, imageUrl, effectiveFocus }) => ({
        slug,
        title,
        level,
        reasons,
        imageUrl,
        effectiveFocus
      })),
    items
  };

  fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf-8");

  console.log(
    `[news-focus-audit] total=${summary.ok + summary.review + summary.warning + summary.error} ok=${summary.ok} review=${summary.review} warning=${summary.warning} error=${summary.error} manualFocus=${summary.manualFocus} new=${summary.newSinceLastAudit}`
  );

  if (report.reviewQueue.length) {
    report.reviewQueue.slice(0, 12).forEach((item) => {
      console.log(`[news-focus-audit] ${item.level}: ${item.slug} (${item.reasons.join(", ")})`);
    });
  }

  const newBlockers = items.filter(
    (item) => item.isNewSinceLastAudit && item.level !== "ok"
  );

  const whatsappItems =
    options.notifyWhatsapp === "new"
      ? newBlockers
      : options.notifyWhatsapp === "all"
        ? items.filter((item) => item.level !== "ok")
        : [];

  let exitCode = 0;
  if (whatsappItems.length) {
    try {
      await sendWhatsappAuditAlert(whatsappItems, report);
    } catch (error) {
      console.error(`[news-focus-audit] falha ao enviar WhatsApp: ${error.message}`);
      exitCode = 1;
    }
  }

  if (options.strictNew && newBlockers.length) {
    console.error(`[news-focus-audit] strict-new bloqueou ${newBlockers.length} item(ns) novo(s) para revisao de foto.`);
    newBlockers.slice(0, 12).forEach((item) => {
      console.error(`[news-focus-audit] novo ${item.level}: ${item.slug} (${item.reasons.join(", ")})`);
    });
    exitCode = 1;
  } else if (options.strict && (summary.error > 0 || summary.warning > 0)) {
    exitCode = 1;
  }

  return { report, exitCode };
}

if (require.main === module) {
  runAuditNewsImageFocus()
    .then(({ exitCode }) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      console.error("[news-focus-audit] fatal", error);
      process.exitCode = 1;
    });
}

module.exports = {
  runAuditNewsImageFocus
};
