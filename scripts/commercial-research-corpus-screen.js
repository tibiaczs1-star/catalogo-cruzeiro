const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const CORPUS_PATH = path.join(ROOT_DIR, "docs", "commercial", "research", "czs-premium-corpus-2026-06-01.csv");
const OUT_DIR = path.join(ROOT_DIR, "docs", "commercial", "research", "screening");
const JSONL_PATH = path.join(OUT_DIR, "czs-premium-corpus-screening-2026-06-01.jsonl");
const SUMMARY_PATH = path.join(OUT_DIR, "czs-premium-corpus-screening-summary-2026-06-01.json");
const REPORT_PATH = path.join(OUT_DIR, "czs-premium-corpus-screening-report-2026-06-01.md");

const CONCURRENCY = Number(process.env.CZS_SCREEN_CONCURRENCY || 8);
const TIMEOUT_MS = Number(process.env.CZS_SCREEN_TIMEOUT_MS || 14000);
const MAX_HTML_BYTES = Number(process.env.CZS_SCREEN_MAX_HTML_BYTES || 850000);
const USER_AGENT =
  "CZS premium research screening/1.0 (+https://catalogo-cruzeiro-web.onrender.com/)";

const SIGNALS = {
  visual: {
    product_visible: ["screenshot", "preview", "demo", "product", "interface", "dashboard", "app"],
    editorial_grid: ["latest", "top stories", "most read", "opinion", "newsletter", "breaking"],
    cinematic: ["video", "motion", "animation", "film", "story", "hero"],
    data_visual: ["chart", "graph", "report", "metrics", "scoreboard", "dashboard"],
    local_identity: ["local", "community", "city", "region", "neighborhood", "county"]
  },
  sales: {
    direct_cta: ["contact", "book", "start", "try", "subscribe", "advertise", "sponsor", "buy"],
    media_kit: ["media kit", "advertise", "sponsorship", "rate card", "audience", "impressions"],
    proof: ["customers", "trusted", "case study", "testimonial", "partners", "results"],
    pricing: ["pricing", "plans", "price", "package", "monthly", "annual"],
    valuation: ["revenue", "profit", "multiple", "margin", "listing price", "gross"]
  },
  technical: {
    seo: ["canonical", "og:", "twitter:", "schema.org", "json-ld"],
    analytics: ["gtag", "google-analytics", "plausible", "segment", "mixpanel", "hotjar"],
    modern_frontend: ["next/static", "__next", "vite", "webpack", "react", "vue", "svelte"],
    conversion_stack: ["hubspot", "intercom", "drift", "calendly", "mailchimp", "typeform"],
    media_delivery: ["cloudinary", "imgix", "akamai", "fastly", "cloudflare", "cdn"]
  }
};

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      i += 1;
      continue;
    }
    if (char === "\"") {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

function readCorpus(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  const lines = raw.split(/\r?\n/);
  const headers = parseCsvLine(lines.shift());
  return lines.filter(Boolean).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function textBetween(html, regex, limit = 8) {
  return [...html.matchAll(regex)]
    .map((match) => stripHtml(match[1] || "").slice(0, 180))
    .filter(Boolean)
    .slice(0, limit);
}

function metaContent(html, key) {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["'][^>]*>`, "i")
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return stripHtml(match[1]).slice(0, 300);
  }
  return "";
}

function countMatches(html, regex) {
  return [...html.matchAll(regex)].length;
}

function scoreSignals(html, text) {
  const haystack = `${html.slice(0, 250000)} ${text.slice(0, 20000)}`.toLowerCase();
  const result = {};

  for (const [group, signals] of Object.entries(SIGNALS)) {
    result[group] = {};
    for (const [signal, terms] of Object.entries(signals)) {
      const hits = terms.filter((term) => haystack.includes(term));
      result[group][signal] = {
        score: hits.length,
        hits
      };
    }
  }
  return result;
}

function topSignals(signals, group) {
  return Object.entries(signals[group])
    .filter(([, value]) => value.score > 0)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([name]) => name)
    .slice(0, 5);
}

function classifyMechanism(row, signals, metrics) {
  const visual = topSignals(signals, "visual");
  const sales = topSignals(signals, "sales");
  const technical = topSignals(signals, "technical");

  if (row.category === "newspaper_landing") {
    return `News homepage built around ${visual.includes("editorial_grid") ? "editorial hierarchy and latest-story navigation" : "publisher identity and current coverage"}; commercial value comes from daily attention and trust.`;
  }
  if (row.category === "technology_landing") {
    return `Technology/product landing built around ${visual.includes("product_visible") ? "visible product proof" : "brand narrative"}; conversion depends on ${sales[0] || "CTA clarity"} and ${technical[0] || "technical credibility"}.`;
  }
  if (row.category === "newspaper_media_kit_report") {
    return `Advertising/media-kit page candidate; expected to work through audience proof, formats, sponsorship packages and contact flow.`;
  }
  if (row.category === "website_sales_report") {
    return `Website/business sale reference; works by exposing revenue, profit, multiple, risk and opportunity signals for valuation.`;
  }
  return `Reference page with ${metrics.wordCount} readable words and ${metrics.linkCount} links.`;
}

function summarize(row, html, text, signals, metrics) {
  const title = textBetween(html, /<title[^>]*>([\s\S]*?)<\/title>/gi, 1)[0] || row.title || "";
  const h1 = textBetween(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi, 3);
  const description = metaContent(html, "description") || metaContent(html, "og:description") || "";
  const visual = topSignals(signals, "visual");
  const sales = topSignals(signals, "sales");
  const technical = topSignals(signals, "technical");
  const mechanism = classifyMechanism(row, signals, metrics);

  return {
    title: title.slice(0, 220),
    description: description.slice(0, 350),
    h1,
    mechanism,
    whatItIs: `${row.type || row.category} from ${row.source_group}`,
    howItWorks: mechanism,
    strongestVisualSignals: visual,
    strongestSalesSignals: sales,
    strongestTechnicalSignals: technical,
    czsLesson: buildCzsLesson(row, visual, sales, technical),
    evidenceSnippet: text.slice(0, 420)
  };
}

function buildCzsLesson(row, visual, sales, technical) {
  if (row.category === "newspaper_landing") {
    return "Use homepage discipline: live hierarchy, timestamps, source trust and clear paths to latest/local service content.";
  }
  if (row.category === "technology_landing") {
    return "Show the machine, not only claims: product panels, dashboards, flows, agent network and conversion proof.";
  }
  if (row.category === "newspaper_media_kit_report") {
    return "Sell local attention with packages, formats, audience proof, CTA and measurable advertiser outcomes.";
  }
  if (row.category === "website_sales_report") {
    return "Frame CZS as an operating asset: revenue logic, risk, growth levers, metrics and transparent assumptions.";
  }
  return `Combine ${visual[0] || "clarity"}, ${sales[0] || "conversion"} and ${technical[0] || "credibility"}.`;
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer).subarray(0, MAX_HTML_BYTES);
    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      contentType: response.headers.get("content-type") || "",
      html: buffer.toString("utf8"),
      bytesRead: buffer.length
    };
  } finally {
    clearTimeout(timeout);
  }
}

function fallbackFromCorpus(row, error) {
  const notesText = [row.notes, row.visual_patterns, row.sales_patterns].filter(Boolean).join(" ");
  const signals = {
    visual: Object.fromEntries(Object.keys(SIGNALS.visual).map((key) => [key, { score: 0, hits: [] }])),
    sales: Object.fromEntries(Object.keys(SIGNALS.sales).map((key) => [key, { score: 0, hits: [] }])),
    technical: Object.fromEntries(Object.keys(SIGNALS.technical).map((key) => [key, { score: 0, hits: [] }]))
  };
  const metrics = {
    wordCount: notesText.split(/\s+/).filter(Boolean).length,
    linkCount: 0,
    imageCount: 0,
    scriptCount: 0,
    formCount: 0,
    buttonCount: 0,
    headingCount: 0
  };
  return {
    id: row.id,
    category: row.category,
    sourceGroup: row.source_group,
    url: row.url,
    finalUrl: row.url,
    access: {
      ok: false,
      status: 0,
      contentType: "",
      bytesRead: 0,
      error: String(error && error.message ? error.message : error || "not fetched")
    },
    corpusStatus: row.status,
    metrics,
    signals,
    summary: {
      title: row.title,
      description: row.notes,
      h1: [],
      mechanism: classifyMechanism(row, signals, metrics),
      whatItIs: `${row.type || row.category} from ${row.source_group}`,
      howItWorks: classifyMechanism(row, signals, metrics),
      strongestVisualSignals: [],
      strongestSalesSignals: [],
      strongestTechnicalSignals: [],
      czsLesson: buildCzsLesson(row, [], [], []),
      evidenceSnippet: notesText.slice(0, 420)
    },
    contentHash: crypto.createHash("sha256").update(notesText).digest("hex")
  };
}

function structuredFromCorpus(row, mode) {
  const record = fallbackFromCorpus(row, mode);
  record.access = {
    ok: true,
    status: 200,
    contentType: "application/json-from-corpus",
    bytesRead: Buffer.byteLength([row.title, row.notes, row.visual_patterns, row.sales_patterns].join(" "), "utf8"),
    error: ""
  };
  record.corpusReadMode = mode;
  return record;
}

async function screenRow(row) {
  if (row.source_group === "empire_flippers_sold_api") {
    return structuredFromCorpus(row, "Structured data already collected from Empire Flippers API");
  }

  try {
    const fetched = await fetchWithTimeout(row.url);
    const html = fetched.html;
    const text = stripHtml(html);
    const metrics = {
      wordCount: text.split(/\s+/).filter(Boolean).length,
      linkCount: countMatches(html, /<a\b/gi),
      imageCount: countMatches(html, /<img\b/gi),
      scriptCount: countMatches(html, /<script\b/gi),
      formCount: countMatches(html, /<form\b/gi),
      buttonCount: countMatches(html, /<button\b/gi),
      headingCount: countMatches(html, /<h[1-6]\b/gi)
    };
    const signals = scoreSignals(html, text);

    return {
      id: row.id,
      category: row.category,
      sourceGroup: row.source_group,
      url: row.url,
      finalUrl: fetched.finalUrl,
      access: {
        ok: fetched.ok,
        status: fetched.status,
        contentType: fetched.contentType,
        bytesRead: fetched.bytesRead,
        error: ""
      },
      corpusStatus: row.status,
      metrics,
      signals,
      summary: summarize(row, html, text, signals, metrics),
      contentHash: crypto.createHash("sha256").update(html).digest("hex")
    };
  } catch (error) {
    return fallbackFromCorpus(row, error);
  }
}

function aggregate(results) {
  const summary = {
    generatedAt: new Date().toISOString(),
    total: results.length,
    byCategory: {},
    access: { ok: 0, failed: 0 },
    byStatusCode: {},
    byCorpusStatus: {},
    topSourceGroups: {},
    topSignals: { visual: {}, sales: {}, technical: {} },
    averageMetricsByCategory: {}
  };

  for (const item of results) {
    summary.byCategory[item.category] = (summary.byCategory[item.category] || 0) + 1;
    summary.byCorpusStatus[item.corpusStatus] = (summary.byCorpusStatus[item.corpusStatus] || 0) + 1;
    summary.topSourceGroups[item.sourceGroup] = (summary.topSourceGroups[item.sourceGroup] || 0) + 1;
    if (item.access.ok) summary.access.ok += 1;
    else summary.access.failed += 1;
    summary.byStatusCode[item.access.status] = (summary.byStatusCode[item.access.status] || 0) + 1;

    for (const group of ["visual", "sales", "technical"]) {
      for (const [name, value] of Object.entries(item.signals[group] || {})) {
        if (value.score > 0) {
          summary.topSignals[group][name] = (summary.topSignals[group][name] || 0) + 1;
        }
      }
    }

    const avg = summary.averageMetricsByCategory[item.category] || {
      count: 0,
      wordCount: 0,
      linkCount: 0,
      imageCount: 0,
      scriptCount: 0,
      formCount: 0,
      buttonCount: 0,
      headingCount: 0
    };
    avg.count += 1;
    for (const key of ["wordCount", "linkCount", "imageCount", "scriptCount", "formCount", "buttonCount", "headingCount"]) {
      avg[key] += item.metrics[key] || 0;
    }
    summary.averageMetricsByCategory[item.category] = avg;
  }

  for (const avg of Object.values(summary.averageMetricsByCategory)) {
    for (const key of Object.keys(avg)) {
      if (key !== "count") avg[key] = Number((avg[key] / avg.count).toFixed(2));
    }
  }

  return summary;
}

function markdownReport(summary, results) {
  const categoryLines = Object.entries(summary.byCategory)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n");
  const accessLines = Object.entries(summary.byStatusCode)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n");
  const signalLines = Object.entries(summary.topSignals)
    .map(([group, values]) => {
      const top = Object.entries(values)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([key, value]) => `  - ${key}: ${value}`)
        .join("\n");
      return `### ${group}\n${top || "  - none"}`;
    })
    .join("\n\n");
  const examples = results
    .filter((item) => item.access.ok)
    .slice(0, 20)
    .map((item) => `- ${item.id} ${item.category}: ${item.summary.title || item.url} - ${item.summary.howItWorks}`)
    .join("\n");

  return `# CZS Premium Corpus Screening - 2026-06-01

## Resultado

- total analisado: ${summary.total}
- acessos OK: ${summary.access.ok}
- acessos falhos/bloqueados: ${summary.access.failed}

## Categorias

${categoryLines}

## Status HTTP

${accessLines}

## Sinais Mais Frequentes

${signalLines}

## Amostra De Leitura

${examples}

## Uso No Redesign

Esta triagem transforma a lista bruta em conhecimento operacional. Cada linha do JSONL registra o que a referencia e, como ela funciona, quais sinais de design/venda/tecnologia ela usa e qual licao deve entrar no CZS.

Arquivo detalhado:

\`${path.relative(ROOT_DIR, JSONL_PATH)}\`
`;
}

async function main() {
  const rows = readCorpus(CORPUS_PATH);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const results = [];
  const writeStream = fs.createWriteStream(JSONL_PATH, { encoding: "utf8" });
  let cursor = 0;

  async function worker() {
    while (cursor < rows.length) {
      const index = cursor;
      cursor += 1;
      const result = await screenRow(rows[index]);
      results[index] = result;
      writeStream.write(`${JSON.stringify(result)}\n`);
      if ((index + 1) % 100 === 0) {
        process.stderr.write(`screened ${index + 1}/${rows.length}\n`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  await new Promise((resolve) => writeStream.end(resolve));

  const summary = aggregate(results);
  fs.writeFileSync(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  fs.writeFileSync(REPORT_PATH, markdownReport(summary, results), "utf8");
  console.log(JSON.stringify({
    jsonl: path.relative(ROOT_DIR, JSONL_PATH),
    summary: path.relative(ROOT_DIR, SUMMARY_PATH),
    report: path.relative(ROOT_DIR, REPORT_PATH),
    total: summary.total,
    access: summary.access
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
