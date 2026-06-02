const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const CORPUS_PATH = path.join(ROOT_DIR, "docs", "commercial", "research", "czs-premium-corpus-2026-06-01.csv");

const TARGETS = {
  newspaper_landing: 500,
  technology_landing: 500,
  newspaper_media_kit_report: 1000,
  website_sales_report: 1000
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

function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    parsed.hostname = parsed.hostname.toLowerCase();
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return String(url || "").trim().toLowerCase();
  }
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

function main() {
  if (!fs.existsSync(CORPUS_PATH)) {
    console.error(`Corpus not found: ${CORPUS_PATH}`);
    process.exitCode = 1;
    return;
  }

  const rows = readCorpus(CORPUS_PATH);
  const byCategory = {};
  const byStatus = {};
  const duplicateUrls = [];
  const seenUrls = new Map();

  for (const row of rows) {
    byCategory[row.category] = (byCategory[row.category] || 0) + 1;
    byStatus[row.status] = (byStatus[row.status] || 0) + 1;
    const normalized = normalizeUrl(row.url);
    if (seenUrls.has(normalized)) {
      duplicateUrls.push({ first: seenUrls.get(normalized), duplicate: row.id, url: row.url });
    } else {
      seenUrls.set(normalized, row.id);
    }
  }

  const targets = Object.fromEntries(
    Object.entries(TARGETS).map(([category, target]) => [
      category,
      {
        target,
        current: byCategory[category] || 0,
        remaining: Math.max(0, target - (byCategory[category] || 0))
      }
    ])
  );

  const report = {
    generatedAt: new Date().toISOString(),
    corpusPath: path.relative(ROOT_DIR, CORPUS_PATH),
    totalRows: rows.length,
    uniqueUrls: seenUrls.size,
    duplicateUrls,
    byCategory,
    byStatus,
    targets
  };

  console.log(JSON.stringify(report, null, 2));

  if (duplicateUrls.length > 0) {
    process.exitCode = 2;
  }
}

main();
