#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT_DIR, "data");
const RUNTIME_NEWS_FILE = path.join(DATA_DIR, "runtime-news.json");
const NEWS_ARCHIVE_FILE = path.join(DATA_DIR, "news-archive.json");
const TOPIC_FEED_FALLBACK_FILE = path.join(DATA_DIR, "topic-feed-fallback.json");
const REPORT_JSON_FILE = path.join(DATA_DIR, "editorial-health-report.json");
const REPORT_MD_FILE = path.join(DATA_DIR, "editorial-health-report.md");
const DEFAULT_LIMIT = 360;

const P0_PATTERN =
  /\b(ataque|atentado|tiroteio|morte|morre|morreu|morto|morta|assassin|homicidio|feminicidio|estupro|abuso|violencia|violent|crianca|adolescente|menor|escola|instituto|aluno|policia|prisao|preso|suspeito|arma|tiro|ferido|hospital|acidente|desastre|enchente|incendio|ameaca|mpac|gaeco)\b/i;
const P1_PATTERN =
  /\b(lula|bolsonaro|governo|prefeitura|governador|presidente|vereador|deputado|senador|senado|camara|stf|justica|tribunal|ministerio publico|mpf|tse|eleicao|eleicoes|campanha|orçamento|orcamento|imposto|tarifa|lei|projeto de lei|greve|audiencia|audiencia publica|acre|rio branco)\b/i;
const SPECIAL_SAFE_PATTERN =
  /\b(economia|tecnologia|educacao|educação|servico|serviço|turismo|cultura|esporte|games|anime|estudo|enem|concurso|agenda|previsao|previsão)\b/i;
const SPECIAL_BLOCK_PATTERN =
  /\b(ataque|morte|morreu|assassin|homicidio|feminicidio|estupro|abuso|violencia|acidente|desastre|incendio|crianca|adolescente|policia|prisao|arma|tiro)\b/i;

function cleanText(value, limit = 500) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function normalizeText(value) {
  return cleanText(value, 10000)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function getArrayFromStore(store) {
  if (Array.isArray(store)) return store;
  if (!store || typeof store !== "object") return [];
  if (Array.isArray(store.items)) return store.items;
  if (Array.isArray(store.news)) return store.news;
  if (Array.isArray(store.articles)) return store.articles;
  return [];
}

function readNewsFile(filePath, source) {
  return getArrayFromStore(readJson(filePath, null))
    .filter((item) => item && typeof item === "object")
    .map((item) => ({ ...item, editorialHealthSource: source }));
}

function readTopicFeedNews(filePath) {
  const store = readJson(filePath, {});
  if (!store || typeof store !== "object") return [];
  const groups = Array.isArray(store) ? { feed: store } : store;
  return Object.entries(groups).flatMap(([group, items]) => {
    if (!Array.isArray(items)) return [];
    return items
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        ...item,
        slug: item.slug || slugify(item.title || item.sourceUrl || group),
        category: item.category || group,
        categoryKey: item.categoryKey || slugify(item.category || group),
        editorialHealthSource: `topic-feed:${group}`
      }));
  });
}

function slugify(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function getNewsKey(item) {
  return cleanText(item.slug || item.sourceUrl || item.id || item.title || "", 240).toLowerCase();
}

function uniqueNews(items) {
  const map = new Map();
  items.forEach((item) => {
    const key = getNewsKey(item);
    if (!key || map.has(key)) return;
    map.set(key, item);
  });
  return [...map.values()].sort((a, b) => getPublishedTime(b) - getPublishedTime(a));
}

function getPublishedTime(item) {
  const time = Date.parse(item.publishedAt || item.date || item.updatedAt || "");
  return Number.isFinite(time) ? time : 0;
}

function collectPublicText(item) {
  const body = Array.isArray(item.body) ? item.body.join(" ") : item.body;
  return [
    item.title,
    item.category,
    item.categoryKey,
    item.eyebrow,
    item.sourceLabel,
    item.lede,
    item.summary,
    item.analysis,
    body
  ].join(" ");
}

function getDomain(urlValue) {
  try {
    return new URL(String(urlValue || "")).hostname.replace(/^www\./i, "");
  } catch (error) {
    return "";
  }
}

function getSourceCount(item) {
  const urls = new Set();
  [item.sourceUrl, item.url, item.link].filter(Boolean).forEach((url) => urls.add(String(url)));
  ["crossSources", "alternateSources"].forEach((field) => {
    if (!Array.isArray(item[field])) return;
    item[field].forEach((source) => {
      if (source?.url) urls.add(String(source.url));
    });
  });
  const declared = Number(item.sourceCount || 0);
  return Math.max(declared || 0, urls.size, item.sourceUrl ? 1 : 0);
}

function classifyGate(item) {
  const text = normalizeText(collectPublicText(item));
  const p0 = P0_PATTERN.test(text);
  const p1 = P1_PATTERN.test(text);
  if (p0) {
    return {
      gate: "P0",
      approval: "human-required",
      reason: "Cobertura sensivel: violencia, menor, policia, justica, saude publica ou crise."
    };
  }
  if (p1) {
    return {
      gate: "P1",
      approval: "editor-review",
      reason: "Cobertura civica, politica, governo, economia publica ou impacto local."
    };
  }
  return {
    gate: "P2",
    approval: "auto-check",
    reason: "Baixo risco editorial; seguir checks automaticos."
  };
}

function analyzeSources(item, gateInfo) {
  const sourceUrl = cleanText(item.sourceUrl || item.url || item.link || "", 500);
  const sourceName = cleanText(item.sourceName || item.source || "", 160);
  const sourceCount = getSourceCount(item);
  const domain = getDomain(sourceUrl);
  const issues = [];
  if (!sourceUrl) issues.push("sem-url-da-fonte");
  if (!sourceName) issues.push("sem-nome-da-fonte");
  if (gateInfo.gate === "P0" && sourceCount < 2) issues.push("p0-com-fonte-unica");
  if (gateInfo.gate === "P1" && sourceCount < 1) issues.push("p1-sem-fonte-validada");
  return {
    ok: issues.length === 0,
    sourceUrl,
    sourceName,
    sourceCount,
    domain,
    issues
  };
}

function analyzeVisual(item, gateInfo) {
  const imageUrl = cleanText(item.imageUrl || item.feedImageUrl || item.sourceImageUrl || item.media?.url || "", 600);
  const imageCredit = cleanText(item.imageCredit || item.credit || item.media?.credit || "", 220);
  const normalized = normalizeText(imageUrl);
  const label = !imageUrl
    ? "sem-imagem"
    : /assets\/news-fallbacks|fallback|placeholder|thumb-/i.test(normalized)
      ? "ilustracao-editorial"
      : /^https?:\/\//i.test(imageUrl)
        ? "imagem-de-fonte"
        : "imagem-local";
  const issues = [];
  if (!imageUrl) issues.push("sem-imagem");
  if (gateInfo.gate !== "P2" && imageUrl && !imageCredit) issues.push("p0-p1-sem-credito-visual");
  if (gateInfo.gate === "P0" && label === "ilustracao-editorial") issues.push("p0-com-ilustracao-generica");
  return {
    ok: issues.length === 0,
    imageUrl,
    imageCredit,
    imageLabel: label,
    issues
  };
}

function lowercaseFirst(value) {
  const text = cleanText(value, 160);
  return text ? `${text.charAt(0).toLowerCase()}${text.slice(1)}` : "";
}

function buildTitleAlternatives(item, gateInfo) {
  const title = cleanText(item.title || "", 120).replace(/[.!?]+$/g, "");
  if (!title) return [];
  const sourceName = cleanText(item.sourceName || "", 80);
  const lowerTitle = lowercaseFirst(title);
  const carefulPrefix = gateInfo.gate === "P0" ? "O que se sabe sobre" : "Entenda";
  const alternatives = [
    `${title}: veja os pontos principais`,
    `${carefulPrefix} ${lowerTitle}`,
    sourceName ? `${sourceName} informa: ${title}` : ""
  ];
  const seen = new Set([normalizeText(title)]);
  return alternatives
    .map((alt) => cleanText(alt, 110))
    .filter((alt) => alt && alt.length >= 18)
    .filter((alt) => {
      const key = normalizeText(alt);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

function buildSpecialFormat(item, gateInfo) {
  const text = normalizeText(collectPublicText(item));
  if (gateInfo.gate === "P0" || SPECIAL_BLOCK_PATTERN.test(text)) return null;
  if (gateInfo.gate !== "P2" && !SPECIAL_SAFE_PATTERN.test(text)) return null;
  const category = normalizeText(item.category || item.categoryKey || "");
  const haystack = `${category} ${text}`;
  let format = "linha do tempo curta";
  if (/economia|imposto|tarifa|orcamento/.test(haystack)) format = "guia de impacto no bolso";
  if (/educacao|estudo|enem|concurso/.test(haystack)) format = "guia de servico";
  if (/tecnologia|games|anime/.test(haystack)) format = "comparativo rapido";
  if (/agenda|cultura|turismo|esporte/.test(haystack)) format = "agenda visual";
  return {
    slug: cleanText(item.slug || slugify(item.title), 140),
    title: cleanText(item.title || "Sem titulo", 160),
    gate: gateInfo.gate,
    format,
    why: "Tema permite formato explicativo sem aumentar risco editorial.",
    guardrail: "Usar apenas fatos da fonte, sem sensacionalismo e sem prometer dado nao apurado."
  };
}

function buildIdePrompt(action) {
  return [
    "Codex, resolva esta pendencia editorial do Jornal local.",
    `Prioridade: ${action.priority}. Gate: ${action.gate}.`,
    `Materia: ${action.title}`,
    `Slug: ${action.slug || "sem-slug"}.`,
    `Motivo: ${action.reason}`,
    `Requisitos faltando: ${(action.missingRequirements || []).join("; ") || "definir pela analise"}.`,
    `Comando sugerido: ${action.suggestedIdeCommand || "npm run editorial:health && npm run review:team"}.`,
    "Devolva prova no formato: problema identificado -> causa encontrada -> arquivo alterado -> teste passou -> prova retornada."
  ].join("\n");
}

function buildActionQueue(items) {
  const actions = [];
  items.forEach((item) => {
    if (item.gate === "P0") {
      actions.push({
        id: `human-${item.slug || item.index}`,
        priority: "P0",
        gate: item.gate,
        resolutionType: "human-approval",
        title: item.title,
        slug: item.slug,
        reason: item.gateReason,
        missingRequirements: [
          "aprovar ou segurar a publicacao/capa manualmente",
          "confirmar fonte e tom do resumo",
          "verificar imagem e credito antes de destaque"
        ],
        suggestedIdeCommand: "Cheffe Call: aprovar, segurar ou pedir ajuste humano antes de destacar a materia.",
        expectedProof: [
          "decisao humana registrada",
          "fonte conferida",
          "imagem/credito validados"
        ]
      });
    }
    if (item.sourceIssues.length) {
      actions.push({
        id: `source-${item.slug || item.index}`,
        priority: item.gate === "P0" ? "P0" : "P1",
        gate: item.gate,
        resolutionType: "ide-fix",
        title: item.title,
        slug: item.slug,
        reason: `Pendencia de fonte: ${item.sourceIssues.join(", ")}.`,
        missingRequirements: item.sourceIssues,
        suggestedIdeCommand: "Codex IDE: conferir sourceUrl/sourceName/crossSources da materia e rodar npm run editorial:health.",
        expectedProof: ["fonte ajustada ou justificativa registrada", "npm run editorial:health atualizado"]
      });
    }
    if (item.visualIssues.length) {
      actions.push({
        id: `visual-${item.slug || item.index}`,
        priority: item.gate === "P0" ? "P0" : "P1",
        gate: item.gate,
        resolutionType: "ide-fix",
        title: item.title,
        slug: item.slug,
        reason: `Pendencia visual: ${item.visualIssues.join(", ")}.`,
        missingRequirements: item.visualIssues,
        suggestedIdeCommand: "Codex IDE: conferir imageUrl/imageCredit/imageLabel da materia e rodar npm run editorial:health.",
        expectedProof: ["imagem/credito ajustados ou bloqueio explicado", "npm run editorial:health atualizado"]
      });
    }
  });
  return actions
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
    .map((action) => ({ ...action, idePrompt: buildIdePrompt(action) }));
}

function priorityRank(priority) {
  return priority === "P0" ? 0 : priority === "P1" ? 1 : 2;
}

function countBy(items, field) {
  return items.reduce((acc, item) => {
    const key = item[field] || "sem-valor";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function topEntries(map, limit = 12) {
  return [...map.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

function buildMarkdown(report) {
  const lines = [];
  lines.push("# Saude editorial do Jornal");
  lines.push("");
  lines.push(`Gerado em: ${report.generatedAt}`);
  lines.push(`Escopo: ${report.scope.reviewedItems}/${report.scope.totalItems} itens recentes.`);
  lines.push("");
  lines.push("## Resumo");
  lines.push(`- Gates: P0 ${report.gates.P0}, P1 ${report.gates.P1}, P2 ${report.gates.P2}`);
  lines.push(`- Aprovacao humana exigida: ${report.summary.humanApprovalRequired}`);
  lines.push(`- Pendencias de fonte: ${report.summary.sourceIssues}`);
  lines.push(`- Pendencias visuais: ${report.summary.visualIssues}`);
  lines.push(`- Titulos alternativos gerados: ${report.summary.titleAlternativeCount}`);
  lines.push(`- Especiais seguros sugeridos: ${report.summary.specialCandidates}`);
  lines.push("");
  lines.push("## Pendencias para humano/IDE");
  if (!report.actionQueue.length) {
    lines.push("- Nenhuma pendencia prioritaria encontrada.");
  } else {
    report.actionQueue.slice(0, 24).forEach((action) => {
      lines.push(`- ${action.priority} ${action.resolutionType}: ${action.title}`);
      lines.push(`  Motivo: ${action.reason}`);
      lines.push(`  Comando: ${action.suggestedIdeCommand}`);
    });
  }
  lines.push("");
  lines.push("## Titulos alternativos");
  report.titleAlternatives.slice(0, 12).forEach((item) => {
    lines.push(`- ${item.title}`);
    item.alternatives.forEach((alt) => lines.push(`  - ${alt}`));
  });
  lines.push("");
  lines.push("## Formatos especiais seguros");
  if (!report.specialFormats.length) {
    lines.push("- Nenhum candidato seguro no recorte atual.");
  } else {
    report.specialFormats.slice(0, 12).forEach((item) => {
      lines.push(`- ${item.format}: ${item.title}`);
      lines.push(`  Guarda: ${item.guardrail}`);
    });
  }
  return `${lines.join("\n")}\n`;
}

function runEditorialHealthCheck(options = {}) {
  const limit = Math.max(40, Math.min(Number(options.limit || process.env.EDITORIAL_HEALTH_LIMIT || DEFAULT_LIMIT), 1200));
  const loaded = uniqueNews([
    ...readNewsFile(RUNTIME_NEWS_FILE, "runtime-news"),
    ...readNewsFile(NEWS_ARCHIVE_FILE, "news-archive"),
    ...readTopicFeedNews(TOPIC_FEED_FALLBACK_FILE)
  ]);
  const selected = loaded.slice(0, limit);
  const domains = new Map();

  const items = selected.map((item, index) => {
    const gateInfo = classifyGate(item);
    const source = analyzeSources(item, gateInfo);
    const visual = analyzeVisual(item, gateInfo);
    if (source.domain) domains.set(source.domain, (domains.get(source.domain) || 0) + 1);
    return {
      index: index + 1,
      slug: cleanText(item.slug || slugify(item.title), 140),
      title: cleanText(item.title || "Sem titulo", 180),
      category: cleanText(item.category || item.categoryKey || "sem-editoria", 120),
      publishedAt: cleanText(item.publishedAt || item.date || "", 80),
      gate: gateInfo.gate,
      approval: gateInfo.approval,
      gateReason: gateInfo.reason,
      sourceDomain: source.domain,
      sourceCount: source.sourceCount,
      sourceIssues: source.issues,
      imageLabel: visual.imageLabel,
      visualIssues: visual.issues,
      titleAlternatives: buildTitleAlternatives(item, gateInfo),
      specialFormat: buildSpecialFormat(item, gateInfo),
      editorialHealthSource: item.editorialHealthSource || ""
    };
  });

  const fullActionQueue = buildActionQueue(items);
  const actionQueue = fullActionQueue.slice(0, 80);
  const titleAlternatives = items
    .filter((item) => item.titleAlternatives.length)
    .slice(0, 80)
    .map((item) => ({
      slug: item.slug,
      title: item.title,
      gate: item.gate,
      alternatives: item.titleAlternatives
    }));
  const specialFormats = items
    .map((item) => item.specialFormat)
    .filter(Boolean)
    .slice(0, 60);
  const fullHumanApprovalQueue = fullActionQueue.filter((action) => action.resolutionType === "human-approval");
  const humanApprovalQueue = fullHumanApprovalQueue.slice(0, 80);
  const sourceIssues = items.reduce((sum, item) => sum + item.sourceIssues.length, 0);
  const visualIssues = items.reduce((sum, item) => sum + item.visualIssues.length, 0);
  const report = {
    version: 1,
    kind: "editorial-health-report",
    status: "ok",
    generatedAt: new Date().toISOString(),
    files: {
      json: path.relative(ROOT_DIR, REPORT_JSON_FILE).replace(/\\/g, "/"),
      markdown: path.relative(ROOT_DIR, REPORT_MD_FILE).replace(/\\/g, "/")
    },
    scope: {
      totalItems: loaded.length,
      reviewedItems: selected.length,
      sources: {
        runtimeNews: path.relative(ROOT_DIR, RUNTIME_NEWS_FILE).replace(/\\/g, "/"),
        newsArchive: path.relative(ROOT_DIR, NEWS_ARCHIVE_FILE).replace(/\\/g, "/"),
        topicFeedFallback: path.relative(ROOT_DIR, TOPIC_FEED_FALLBACK_FILE).replace(/\\/g, "/")
      }
    },
    summary: {
      humanApprovalRequired: fullHumanApprovalQueue.length,
      sourceIssues,
      visualIssues,
      titleAlternativeCount: titleAlternatives.reduce((sum, item) => sum + item.alternatives.length, 0),
      specialCandidates: specialFormats.length,
      actionQueueTotal: fullActionQueue.length
    },
    gates: {
      P0: items.filter((item) => item.gate === "P0").length,
      P1: items.filter((item) => item.gate === "P1").length,
      P2: items.filter((item) => item.gate === "P2").length
    },
    byCategory: countBy(items, "category"),
    sourceCoverage: {
      topDomains: topEntries(domains),
      missingSourceItems: items.filter((item) => item.sourceIssues.length).slice(0, 40)
    },
    visualIntegrity: {
      byLabel: countBy(items, "imageLabel"),
      issueItems: items.filter((item) => item.visualIssues.length).slice(0, 40)
    },
    humanApprovalQueue,
    actionQueue,
    titleAlternatives,
    specialFormats,
    items: items.slice(0, 160)
  };

  writeJson(REPORT_JSON_FILE, report);
  fs.writeFileSync(REPORT_MD_FILE, buildMarkdown(report), "utf8");
  return report;
}

if (require.main === module) {
  const report = runEditorialHealthCheck();
  console.log(
    JSON.stringify(
      {
        ok: true,
        status: report.status,
        generatedAt: report.generatedAt,
        summary: report.summary,
        gates: report.gates,
        files: report.files
      },
      null,
      2
    )
  );
}

module.exports = {
  runEditorialHealthCheck
};
