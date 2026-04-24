#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { runRealAgentsRuntimeLocal } = require("./real-agents-runtime");
const { runReviewTeamAudit } = require("./review-team-audit");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT_DIR, "data");
const RUNTIME_NEWS_FILE = path.join(DATA_DIR, "runtime-news.json");
const STATIC_NEWS_FILE = path.join(ROOT_DIR, "news-data.js");
const AUTONOMY_REPORT_FILE = path.join(DATA_DIR, "agents-autonomy-report.json");

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
}

function stripHtml(value = "") {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#8220;|&#8221;/gi, "\"")
    .replace(/&#8216;|&#8217;/gi, "'")
    .replace(/&hellip;|&#8230;/gi, "...")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(value = "", limit = 0) {
  const text = stripHtml(value)
    .replace(/The post .*? appeared first on .*?(?:\.|$)/gi, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return limit && text.length > limit ? `${text.slice(0, limit - 1).trim()}...` : text;
}

function formatDate(value) {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "data recente";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date).replace(".", "");
}

function fingerprint(value = "") {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isMailzaPriorityArticle(item = {}) {
  const text = fingerprint(
    [
      item.title,
      item.summary,
      item.lede,
      item.description,
      item.category,
      item.categoryKey,
      item.eyebrow,
      item.sourceName,
      item.sourceLabel,
      item.sourceUrl,
      Array.isArray(item.body) ? item.body.join(" ") : item.body
    ].join(" ")
  );

  return /\b(mailza|mailsa|mailza assis|mailza assis cameli|governadora mailza|governadora em exercicio)\b/.test(text);
}

function getNewsTimestamp(item = {}) {
  const timestamp = Date.parse(item.publishedAt || item.createdAt || item.date || "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function applyMailzaPriority(items = []) {
  return items
    .map((item) => {
      if (!isMailzaPriorityArticle(item)) return item;
      return {
        ...item,
        category: "Política Regional",
        categoryKey: "politica",
        eyebrow: "governadora mailza",
        priority: Math.max(Number(item.priority || 0), 950),
        editorialPriority: "mailza-prioridade"
      };
    })
    .sort((left, right) => {
      const mailzaDiff = Number(isMailzaPriorityArticle(right)) - Number(isMailzaPriorityArticle(left));
      if (mailzaDiff !== 0) return mailzaDiff;

      const dateDiff = getNewsTimestamp(right) - getNewsTimestamp(left);
      if (dateDiff !== 0) return dateDiff;

      return Number(right.priority || 0) - Number(left.priority || 0);
    });
}

const REVIEW_COPY_BLOCKLIST = [
  "na leitura do " + "catalogo",
  "na escolha " + "editorial do catalogo",
  "na leitura " + "editorial",
  "o diferencial " + "editorial aqui"
];

function hasReviewBlockedCopy(value = "") {
  const text = cleanText(value).toLowerCase();
  return REVIEW_COPY_BLOCKLIST.some((fragment) => text.includes(fragment));
}

function sanitizeReviewCopy(item = {}) {
  const title = cleanText(item.title || item.sourceLabel || "Noticia", 180);
  const isLongTheaterFeed =
    /g1 pop/i.test(String(item.sourceName || "")) &&
    /critica de musical de teatro|crítica de musical de teatro/i.test(`${item.lede || ""} ${item.summary || ""}`);
  const sanitizedBody = Array.isArray(item.body)
    ? item.body.filter((paragraph) => !hasReviewBlockedCopy(paragraph))
    : item.body;
  const sanitizedDevelopment = Array.isArray(item.development)
    ? item.development.filter((paragraph) => !hasReviewBlockedCopy(paragraph))
    : item.development;
  const summary = cleanText(item.summary || "");

  return {
    ...item,
    lede: isLongTheaterFeed
      ? `${title}. A publicacao do G1 Pop & Arte traz os principais detalhes do espetaculo e da temporada.`
      : item.lede,
    summary: isLongTheaterFeed
      ? `${title}. O registro cultural foi resumido para melhorar a leitura no portal e manter o link da fonte original.`
      : summary.replace(/\bpauta de cidade\b/gi, "assunto da cidade"),
    body: sanitizedBody,
    development: sanitizedDevelopment
  };
}

function isRepeated(paragraph = "", reference = "") {
  const paragraphKey = fingerprint(paragraph);
  const referenceKey = fingerprint(reference);
  if (!paragraphKey || !referenceKey) return false;
  if (paragraphKey === referenceKey) return true;
  const shortest = Math.min(paragraphKey.length, referenceKey.length);
  return shortest >= 80 && (paragraphKey.includes(referenceKey) || referenceKey.includes(paragraphKey));
}

function buildFallbackBody(item = {}) {
  const title = cleanText(item.title || "este assunto", 180);
  const sourceName = cleanText(item.sourceName || item.source || item.sourceLabel || "a fonte consultada", 90);
  const category = cleanText(item.category || "noticia local", 80).toLowerCase();
  const dateLabel = item.date || formatDate(item.publishedAt || item.createdAt);
  const sourceLabel = cleanText(item.sourceLabel || title, 180);

  return [
    `${sourceName} publicou em ${dateLabel} a base desta noticia sobre ${title}. Para o leitor local, o ponto principal e entender como o tema se conecta ao cotidiano de quem vive no Acre e acompanha os servicos, decisoes publicas e impactos da regiao.`,
    `${sourceLabel} e o eixo mais concreto da publicacao consultada. A partir dele, a materia deve ser lida com atencao a origem da informacao, impacto imediato e possibilidade de novas atualizacoes conforme a fonte publicar mais detalhes.`,
    `Como o material original ainda nao trouxe desenvolvimento suficiente para um texto mais longo nesta pagina, o portal apresenta o essencial sobre ${category}, mostra a base consultada e mantem o acesso direto para a fonte completa.`
  ];
}

function normalizeBody(item = {}) {
  const reference = item.lede || item.summary || item.description || "";
  const body = Array.isArray(item.body) ? item.body.map((line) => cleanText(line)).filter(Boolean) : [];
  const unique = body.filter((paragraph) => !isRepeated(paragraph, reference));
  return unique.length ? unique : buildFallbackBody(item);
}

function normalizeNewsItems(items = []) {
  let addedBody = 0;
  let removedRepeated = 0;

  const nextItems = items.map((item) => {
    const previousBody = Array.isArray(item.body) ? item.body.filter(Boolean) : [];
    const nextBody = normalizeBody(item);
    if (!previousBody.length) addedBody += 1;
    if (previousBody.length && nextBody.length < previousBody.length) removedRepeated += 1;
    return { ...item, body: nextBody };
  });

  return { items: applyMailzaPriority(nextItems).map(sanitizeReviewCopy), addedBody, removedRepeated };
}

function readStaticNewsData() {
  if (!fs.existsSync(STATIC_NEWS_FILE)) return [];
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(STATIC_NEWS_FILE, "utf-8"), sandbox, {
    filename: STATIC_NEWS_FILE,
    timeout: 1000
  });
  return Array.isArray(sandbox.window.NEWS_DATA) ? sandbox.window.NEWS_DATA : [];
}

function writeStaticNewsData(items = []) {
  fs.writeFileSync(STATIC_NEWS_FILE, `window.NEWS_DATA = ${JSON.stringify(items.slice(0, 120), null, 2)};\n`, "utf-8");
}

function runReviewTeam() {
  try {
    const output = runReviewTeamAudit();
    return { ok: output.totalIssues === 0, output: JSON.stringify(output) };
  } catch (error) {
    return {
      ok: false,
      error: String(error.message || "review-team failed").slice(0, 2000)
    };
  }
}

function runAutonomyCycle({ trigger = "manual" } = {}) {
  const startedAt = new Date().toISOString();
  const runtimeNews = readJson(RUNTIME_NEWS_FILE, { items: [] });
  const runtimeResult = normalizeNewsItems(Array.isArray(runtimeNews.items) ? runtimeNews.items : []);
  const staticResult = normalizeNewsItems(readStaticNewsData());

  writeJson(RUNTIME_NEWS_FILE, {
    ...runtimeNews,
    lastAutonomyFixAt: startedAt,
    items: runtimeResult.items
  });
  writeStaticNewsData(staticResult.items);

  const agents = runRealAgentsRuntimeLocal();
  const review = runReviewTeam();
  const report = {
    ok: review.ok,
    trigger,
    startedAt,
    finishedAt: new Date().toISOString(),
    actions: [
      {
        id: "news-editorial-body",
        agentGroup: "copy/editor/review/sources",
        status: "done",
        changedRuntimeItems: runtimeResult.addedBody + runtimeResult.removedRepeated,
        changedStaticItems: staticResult.addedBody + staticResult.removedRepeated,
        detail:
          "Garantiu body editorial proprio em noticias captadas e removeu repeticao entre resumo e corpo."
      },
      {
        id: "real-agents-runtime",
        agentGroup: "181 agentes reais",
        status: "done",
        totalAgents: agents.totalAgents,
        totalOffices: agents.totalOffices,
        newsItems: agents.newsItems
      },
      {
        id: "review-team",
        agentGroup: "equipe local de revisao",
        status: review.ok ? "done" : "failed",
        output: review.output || review.error || ""
      }
    ]
  };

  writeJson(AUTONOMY_REPORT_FILE, report);
  return report;
}

function runDaemon() {
  const intervalMs = Math.max(60 * 1000, Number(process.env.AGENTS_AUTONOMY_INTERVAL_MS || 5 * 60 * 1000));
  const run = () => {
    const report = runAutonomyCycle({ trigger: "daemon" });
    console.log(`[agents-daemon] ciclo ${report.ok ? "ok" : "falhou"} ${report.finishedAt}`);
  };
  run();
  setInterval(run, intervalMs);
}

if (require.main === module) {
  if (process.argv.includes("--daemon")) {
    runDaemon();
  } else {
    console.log(JSON.stringify(runAutonomyCycle({ trigger: process.argv.includes("--once") ? "once" : "manual" }), null, 2));
  }
}

module.exports = {
  runAutonomyCycle
};
