#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const ROOT_DIR = path.resolve(__dirname, "..");
const REPORT_DIR = path.join(ROOT_DIR, ".codex-temp", "review-team");
const REPORT_JSON_FILE = path.join(REPORT_DIR, "latest-report.json");
const REPORT_MD_FILE = path.join(REPORT_DIR, "latest-report.md");
const FALLBACK_FILE = path.join(ROOT_DIR, "data", "topic-feed-fallback.json");
const BACKEND_SOURCE_FILE = path.join(ROOT_DIR, "backend", "source-config.js");
const SERVER_FILE = path.join(ROOT_DIR, "server.js");
const SELF_FILE = path.resolve(__filename);

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  ".codex-backups",
  ".codex-temp",
  ".codex-memory",
  ".codex-review-team",
  ".chrome-headless-codex",
  ".edge-headless",
  "vendor",
  "recovered-chat-assets",
  "recovered-vscode-chat-assets"
]);

const FRONT_EXTENSIONS = new Set([".html", ".js"]);
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
const PORTUGUESE_PUBLIC_MARKER_PATTERN =
  /\b(?:que|com|para|por|uma|um|das|dos|nas|nos|ao|aos|pela|pelo|mais|sobre|como|quando|porque|tambem|também|empresa|aplicativos|visual|icone|ícone|noticia|notícia|fonte|resumo|atualizacao|atualização|publicou|redacao|redação|internacional|brasil|acre)\b/g;

const INTERNAL_COPY_PATTERNS = [
  {
    id: "placeholder",
    label: "placeholder ou copy provisoria",
    regex: /\b(lorem ipsum|wireframe|preencher depois|texto provis[oó]rio|copy provis[oó]ria)\b|(?:^|[\s/])(?:todo|to-do)\s*:/i
  },
  {
    id: "loading",
    label: "texto temporario de carregamento",
    regex: /\b(carregando|loading|em breve)\b/i,
    ignore: [
      /\breadyState\s*===?\s*["']loading["']/i,
      /\bloading\s*=\s*["'][^"']+["']/i,
      /\bloading\s*:\s*["'][^"']+["']/i,
      /\(\?:data\|srcset\|sizes\|loading\|decoding/i
    ]
  },
  {
    id: "internal-editorial",
    label: "linguagem interna/editorial",
    regex: /\b(briefing|pauta|uso interno|texto interno|recado interno|para o criador|leitura editorial|monitoramento ativo|painel interno|fechando pauta)\b/i,
    ignore: [
      /\bclass=(["'])[^"']*briefing[^"']*\1/i,
      /\blogo-splash-briefing-bubble\b/i
    ]
  },
  {
    id: "demo",
    label: "linguagem de demo ou teste",
    regex: /\b(modo demo|teste local|ambiente de teste|prot[oó]tipo)\b/i
  }
];

const CARD_CLASS_PATTERN = /\b(card|panel|tile|spotlight|feature|story)\b/i;
const HOME_PREVIEW_FILES = new Set(["index.html", "script.js"]);
const MAX_HOME_PREVIEW_CHARS = 260;
const FULL_ARTICLE_LEAK_PATTERNS =
  /\b(LEIA TAMB[EÉ]M|VEJA TAMB[EÉ]M|ASSISTA|Clique aqui|Veja os v[ií]deos|canal do .* WhatsApp|Reprodu[cç][aã]o\/|Divulga[cç][aã]o\/)\b/i;

function walkFiles(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        return;
      }

      walkFiles(fullPath, results);
      return;
    }

    if (FRONT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      if (path.resolve(fullPath) === SELF_FILE) {
        return;
      }

      results.push(fullPath);
    }
  });

  return results;
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

function normalizePath(filePath) {
  return path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");
}

function stripTags(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function lineNumberFromIndex(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function findLineForSerializedText(source, value) {
  const rawValue = String(value || "");
  const serializedValue = JSON.stringify(rawValue).slice(1, -1);
  const candidates = [rawValue, serializedValue]
    .map((candidate) => candidate.replace(/\s+/g, " ").trim())
    .filter((candidate) => candidate.length >= 12);

  for (const candidate of candidates) {
    const needle = candidate.slice(0, 120);
    const index = source.indexOf(needle);
    if (index >= 0) {
      return lineNumberFromIndex(source, index);
    }
  }

  return 1;
}

function getPublicNewsTextFiles() {
  const files = [
    path.join(ROOT_DIR, "news-data.js"),
    path.join(ROOT_DIR, "data", "news-archive.json"),
    path.join(ROOT_DIR, "data", "runtime-news.json"),
    path.join(ROOT_DIR, "data", "topic-feed-fallback.json")
  ];
  const dataDir = path.join(ROOT_DIR, "data");

  try {
    fs.readdirSync(dataDir)
      .filter((fileName) => /^topic-feed-.*\.json$/i.test(fileName))
      .forEach((fileName) => files.push(path.join(dataDir, fileName)));
  } catch {
    return files.filter((filePath) => fs.existsSync(filePath));
  }

  return Array.from(new Set(files)).filter((filePath) => fs.existsSync(filePath));
}

function parsePublicNewsFile(filePath, source) {
  if (path.basename(filePath) === "news-data.js") {
    const match = source.match(/window\.NEWS_DATA\s*=\s*(\[[\s\S]*\]);?\s*$/);
    if (!match) {
      throw new Error("window.NEWS_DATA nao encontrado");
    }

    return JSON.parse(match[1]);
  }

  return JSON.parse(source);
}

function normalizePublicText(value) {
  return stripTags(value)
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function publicTextLooksEnglish(value) {
  const text = normalizePublicText(value);
  if (!text) {
    return false;
  }

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

function publicTextSnippet(value) {
  const text = normalizePublicText(value);
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

function auditPublicTextValue(filePath, source, valuePath, value, issues) {
  if (typeof value !== "string" || !publicTextLooksEnglish(value)) {
    return;
  }

  pushIssue(issues, {
    type: "language-review",
    severity: "high",
    file: normalizePath(filePath),
    line: findLineForSerializedText(source, value),
    label: "Texto publico em ingles",
    detail: `${valuePath}: ${publicTextSnippet(value)}`
  });
}

function auditPublicTextField(filePath, source, valuePath, value, issues) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      auditPublicTextField(filePath, source, `${valuePath}[${index}]`, item, issues);
    });
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, nested]) => {
      auditPublicTextField(filePath, source, `${valuePath}.${key}`, nested, issues);
    });
    return;
  }

  auditPublicTextValue(filePath, source, valuePath, value, issues);
}

function walkPublicNewsText(filePath, source, value, valuePath, issues) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      walkPublicNewsText(filePath, source, item, `${valuePath}[${index}]`, issues);
    });
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  Object.entries(value).forEach(([key, nested]) => {
    const nextPath = `${valuePath}.${key}`;
    if (PUBLIC_NEWS_TEXT_FIELDS.has(key)) {
      auditPublicTextField(filePath, source, nextPath, nested, issues);
      return;
    }

    walkPublicNewsText(filePath, source, nested, nextPath, issues);
  });
}

function auditPublicPortugueseLanguage(issues) {
  getPublicNewsTextFiles().forEach((filePath) => {
    const source = readText(filePath);
    if (!source.trim()) {
      return;
    }

    try {
      const data = parsePublicNewsFile(filePath, source);
      walkPublicNewsText(filePath, source, data, "$", issues);
    } catch (error) {
      pushIssue(issues, {
        type: "language-review",
        severity: "high",
        file: normalizePath(filePath),
        line: 1,
        label: "Dados publicos sem auditoria de idioma",
        detail: error.message
      });
    }
  });
}

function pushIssue(store, issue) {
  store.push(issue);
}

function hasInteractiveHook(attrText = "") {
  return /\b(data-[a-z0-9:_-]+|onclick=|onchange=|onsubmit=|form=|aria-controls=|popovertarget=|commandfor=)\b/i.test(
    attrText
  );
}

function hasStructuralHook(attrText = "") {
  return /\b(id|class|name)=(["'])([^"']+)\2/i.test(attrText);
}

function hasButtonPurpose(attrText = "") {
  return /\btype=(["'])(submit|reset)\1/i.test(attrText) || hasInteractiveHook(attrText) || hasStructuralHook(attrText);
}

function extractIds(source) {
  const ids = new Set();
  const pattern = /\bid=(["'])([^"']+)\1/gi;
  let match = pattern.exec(source);

  while (match) {
    ids.add(match[2]);
    match = pattern.exec(source);
  }

  return ids;
}

function collectGlobalHtmlIds(files) {
  const ids = new Set();

  files.forEach((filePath) => {
    if (path.extname(filePath).toLowerCase() !== ".html") {
      return;
    }

    extractIds(readText(filePath)).forEach((id) => ids.add(id));
  });

  return ids;
}

function auditButtonsAndLinks(filePath, source, issues, globalIds) {
  const ids = extractIds(source);

  const buttonPattern = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  let buttonMatch = buttonPattern.exec(source);
  while (buttonMatch) {
    const attrs = buttonMatch[1] || "";
    const innerHtml = buttonMatch[2] || "";
    const text = stripTags(innerHtml);
    const line = lineNumberFromIndex(source, buttonMatch.index);
    const hasAriaLabel = /\baria-label=(["'])([^"']+)\1/i.test(attrs);

    if (!hasButtonPurpose(attrs)) {
      pushIssue(issues, {
        type: "cta-review",
        severity: "medium",
        file: normalizePath(filePath),
        line,
        label: "Botao sem indicio claro de funcao",
        detail: text || "botao sem texto legivel"
      });
    }

    if (!text && !hasAriaLabel) {
      pushIssue(issues, {
        type: "a11y-review",
        severity: "medium",
        file: normalizePath(filePath),
        line,
        label: "Botao sem texto visivel e sem aria-label",
        detail: "Adicionar rotulo acessivel"
      });
    }

    buttonMatch = buttonPattern.exec(source);
  }

  const anchorPattern = /<a\b([^>]*)href=(["'])([^"']+)\2([^>]*)>([\s\S]*?)<\/a>/gi;
  let anchorMatch = anchorPattern.exec(source);
  while (anchorMatch) {
    const beforeAttrs = anchorMatch[1] || "";
    const href = String(anchorMatch[3] || "").trim();
    const afterAttrs = anchorMatch[4] || "";
    const attrs = `${beforeAttrs} ${afterAttrs}`.trim();
    const text = stripTags(anchorMatch[5] || "");
    const line = lineNumberFromIndex(source, anchorMatch.index);
    const hasAriaLabel = /\baria-label=(["'])([^"']+)\1/i.test(attrs);

    if (href === "#" && !hasInteractiveHook(attrs)) {
      pushIssue(issues, {
        type: "cta-review",
        severity: "high",
        file: normalizePath(filePath),
        line,
        label: "Link com href=\"#\" sem funcao visivel",
        detail: text || "link sem texto legivel"
      });
    }

    if (href.startsWith("#") && href.length > 1 && !ids.has(href.slice(1)) && !globalIds.has(href.slice(1)) && !hasInteractiveHook(attrs)) {
      pushIssue(issues, {
        type: "link-review",
        severity: "high",
        file: normalizePath(filePath),
        line,
        label: "Ancora aponta para ID inexistente",
        detail: href
      });
    }

    if (!text && !hasAriaLabel) {
      pushIssue(issues, {
        type: "a11y-review",
        severity: "medium",
        file: normalizePath(filePath),
        line,
        label: "Link sem texto visivel e sem aria-label",
        detail: href || "link sem href legivel"
      });
    }

    anchorMatch = anchorPattern.exec(source);
  }
}

function auditInternalCopy(filePath, source, issues) {
  const lines = source.split(/\r?\n/);
  lines.forEach((lineText, index) => {
    INTERNAL_COPY_PATTERNS.forEach((pattern) => {
      if (/^\s*"(id|url|link|sourceUrl|sourceImageUrl|feedImageUrl|imageUrl)"\s*:/i.test(lineText)) {
        return;
      }

      if (Array.isArray(pattern.ignore) && pattern.ignore.some((ignorePattern) => ignorePattern.test(lineText))) {
        return;
      }

      if (!pattern.regex.test(lineText)) {
        return;
      }

      pushIssue(issues, {
        type: "editorial-review",
        severity: "medium",
        file: normalizePath(filePath),
        line: index + 1,
        label: `Texto com cara de ${pattern.label}`,
        detail: lineText.trim().slice(0, 220)
      });
    });
  });
}

function parseQuotedJsString(literal) {
  try {
    return JSON.parse(literal);
  } catch {
    return "";
  }
}

function auditHomePreviewSummarySafety(filePath, source, issues) {
  const fileName = path.basename(filePath);
  if (!HOME_PREVIEW_FILES.has(fileName)) {
    return;
  }

  const lines = source.split(/\r?\n/);

  lines.forEach((lineText, index) => {
    const textContentMatch = lineText.match(
      /\.textContent\s*=\s*([^;]+);?\s*$/
    );

    if (textContentMatch) {
      const expression = textContentMatch[1] || "";
      const usesRawArticleText =
        /\b(article|item|normalizedArticle|normalized)\.(summary|lede|description|rawLede)\b/.test(expression);
      const isProtected =
        /\b(truncateCopy|buildShortArticleSummary|displaySummary|cleanArticleExcerpt)\b/.test(expression);

      if (usesRawArticleText && !isProtected) {
        pushIssue(issues, {
          type: "editorial-review",
          severity: "high",
          file: normalizePath(filePath),
          line: index + 1,
          label: "Erro: chamada da home usa texto bruto",
          detail: "Cards da home precisam usar displaySummary/truncateCopy; a pagina de leitura pode manter o corpo completo."
        });
      }
    }

    const literalMatch = lineText.match(
      /^\s*(?:<p[^>]*>|(?:summary|description|articleSummary|displaySummary)\s*:\s*)("(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)/i
    );

    if (!literalMatch) {
      return;
    }

    const rawLiteral = literalMatch[1];
    const quotedLiteral = rawLiteral.startsWith("`")
      ? JSON.stringify(rawLiteral.slice(1, -1))
      : rawLiteral;
    const value = stripTags(parseQuotedJsString(quotedLiteral));
    const isTooLong = value.length > MAX_HOME_PREVIEW_CHARS;
    const looksLikeFullArticle = FULL_ARTICLE_LEAK_PATTERNS.test(value);

    if (value && (isTooLong || looksLikeFullArticle)) {
      pushIssue(issues, {
        type: "editorial-review",
        severity: "high",
        file: normalizePath(filePath),
        line: index + 1,
        label: "Erro: chamada da home parece artigo completo",
        detail: `Preview com ${value.length} caracteres; a home deve resumir e puxar interesse para o clique.`
      });
    }
  });
}

function auditCardTitles(filePath, source, issues) {
  if (path.extname(filePath).toLowerCase() !== ".html") {
    return;
  }

  const blockPattern =
    /<(article|div|section)\b([^>]*)class=(["'])([^"']*)\3[^>]*>([\s\S]*?)<\/\1>/gi;

  let match = blockPattern.exec(source);
  while (match) {
    const attrs = match[2] || "";
    const className = match[4] || "";
    const inner = match[5] || "";
    const line = lineNumberFromIndex(source, match.index);
    const hasCardLikeClass = CARD_CLASS_PATTERN.test(className);
    const hasMedia = /<(img|picture|video|iframe)\b/i.test(inner);
    const hasTitle = /<(h1|h2|h3|h4|h5|h6|strong)\b/i.test(inner) || /\baria-label=(["'])([^"']+)\1/i.test(attrs);

    if (hasCardLikeClass && hasMedia && !hasTitle) {
      pushIssue(issues, {
        type: "ui-review",
        severity: "medium",
        file: normalizePath(filePath),
        line,
        label: "Card com midia sem titulo evidente",
        detail: className
      });
    }

    match = blockPattern.exec(source);
  }
}

function getDomain(urlValue) {
  try {
    const hostname = new URL(urlValue).hostname.replace(/^www\./, "");
    return /^[a-z0-9.-]+$/i.test(hostname) ? hostname : "";
  } catch {
    return "";
  }
}

function auditSourceCoverage() {
  const fallback = JSON.parse(fs.readFileSync(FALLBACK_FILE, "utf-8"));
  const topicSummary = Object.entries(fallback).map(([topic, items]) => {
    const safeItems = Array.isArray(items) ? items : [];
    const uniqueSources = new Set(safeItems.map((item) => String(item.sourceName || "").trim()).filter(Boolean));
    const uniqueDomains = new Set(safeItems.map((item) => getDomain(item.sourceUrl)).filter(Boolean));

    return {
      topic,
      items: safeItems.length,
      uniqueSources: uniqueSources.size,
      uniqueDomains: uniqueDomains.size,
      status: uniqueDomains.size >= 4 ? "ok" : "review"
    };
  });

  const backendSourceDomains = Array.from(
    new Set(
      (readText(BACKEND_SOURCE_FILE).match(/https?:\/\/[^\s"']+/g) || [])
        .map((urlValue) => getDomain(urlValue))
        .filter(Boolean)
    )
  ).sort();

  const serverFeedDomains = Array.from(
    new Set(
      (readText(SERVER_FILE).match(/https?:\/\/[^\s"']+/g) || [])
        .map((urlValue) => getDomain(urlValue))
        .filter(Boolean)
    )
  ).sort();

  return {
    topicSummary,
    backendSourceDomains,
    serverFeedDomains
  };
}

function ensureReportDir() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

function getSeverityWeight(severity) {
  if (severity === "high") {
    return 0;
  }

  if (severity === "medium") {
    return 1;
  }

  return 2;
}

function sortIssues(issues) {
  return [...issues].sort((left, right) => {
    const severityDiff = getSeverityWeight(left.severity) - getSeverityWeight(right.severity);
    if (severityDiff !== 0) {
      return severityDiff;
    }

    const fileDiff = left.file.localeCompare(right.file);
    if (fileDiff !== 0) {
      return fileDiff;
    }

    return left.line - right.line;
  });
}

function buildTopFilesSummary(issues) {
  const counts = new Map();

  issues.forEach((issue) => {
    counts.set(issue.file, (counts.get(issue.file) || 0) + 1);
  });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 12)
    .map(([file, count]) => ({ file, count }));
}

function buildMarkdownReport(report) {
  const lines = [
    "# Review Team Report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Arquivos auditados: ${report.summary.filesAudited}`,
    `- Achados totais: ${report.summary.totalIssues}`,
    `- CTA / links: ${report.summary.byType["cta-review"] || 0}`,
    `- Editorial: ${report.summary.byType["editorial-review"] || 0}`,
    `- Idioma publico: ${report.summary.byType["language-review"] || 0}`,
    `- UI / cards: ${report.summary.byType["ui-review"] || 0}`,
    `- Acessibilidade: ${report.summary.byType["a11y-review"] || 0}`,
    `- Links quebrados: ${report.summary.byType["link-review"] || 0}`,
    "",
    "## Priority Files",
    "",
    ...(report.summary.topFiles.length
      ? report.summary.topFiles.map((item) => `- ${item.file}: ${item.count} achados`)
      : ["- Nenhum arquivo concentrando achados."]),
    "",
    "## Findings",
    ""
  ];

  if (!report.issues.length) {
    lines.push("- Nenhum achado encontrado nesta rodada.");
  } else {
    report.issues.forEach((issue) => {
      lines.push(
        `- [${issue.severity}] ${issue.label} - ${issue.file}:${issue.line} - ${issue.detail}`
      );
    });
  }

  lines.push("", "## Source Coverage", "");
  report.sources.topicSummary.forEach((topic) => {
    lines.push(
      `- ${topic.topic}: ${topic.items} itens, ${topic.uniqueSources} fontes, ${topic.uniqueDomains} dominios (${topic.status})`
    );
  });

  lines.push("", "## Runtime Source Domains", "");
  report.sources.serverFeedDomains.forEach((domain) => {
    lines.push(`- ${domain}`);
  });

  return `${lines.join("\n")}\n`;
}

function runReviewTeamAudit() {
  const files = walkFiles(ROOT_DIR);
  const globalHtmlIds = collectGlobalHtmlIds(files);
  const issues = [];

  files.forEach((filePath) => {
    const source = readText(filePath);
    auditButtonsAndLinks(filePath, source, issues, globalHtmlIds);
    auditInternalCopy(filePath, source, issues);
    auditHomePreviewSummarySafety(filePath, source, issues);
    auditCardTitles(filePath, source, issues);
  });
  auditPublicPortugueseLanguage(issues);

  const sources = auditSourceCoverage();
  const sortedIssues = sortIssues(issues);

  const summary = sortedIssues.reduce(
    (acc, issue) => {
      acc.totalIssues += 1;
      acc.byType[issue.type] = (acc.byType[issue.type] || 0) + 1;
      return acc;
    },
    {
      filesAudited: files.length,
      totalIssues: 0,
      byType: {},
      topFiles: []
    }
  );
  summary.topFiles = buildTopFilesSummary(sortedIssues);

  const report = {
    generatedAt: new Date().toISOString(),
    summary,
    issues: sortedIssues,
    sources
  };

  ensureReportDir();
  fs.writeFileSync(REPORT_JSON_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
  fs.writeFileSync(REPORT_MD_FILE, buildMarkdownReport(report), "utf-8");

  return {
    reportJson: normalizePath(REPORT_JSON_FILE),
    reportMd: normalizePath(REPORT_MD_FILE),
    filesAudited: report.summary.filesAudited,
    totalIssues: report.summary.totalIssues
  };
}

if (require.main === module) {
  console.log(JSON.stringify(runReviewTeamAudit(), null, 2));
}

module.exports = {
  runReviewTeamAudit
};
