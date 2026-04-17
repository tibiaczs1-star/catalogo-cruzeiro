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
    strict: false
  };

  argv.forEach((arg) => {
    if (arg === "--offline") options.offline = true;
    if (arg === "--strict") options.strict = true;
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

async function run() {
  const options = parseArgs(process.argv.slice(2));
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

  if (options.strict && (summary.error > 0 || summary.warning > 0)) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("[news-focus-audit] fatal", error);
  process.exitCode = 1;
});
