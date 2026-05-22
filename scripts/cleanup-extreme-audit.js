"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const REPORT_DIR = path.join(ROOT, ".codex-temp", "cleanup");
const REPORT_FILE = path.join(REPORT_DIR, "latest-extreme-audit.json");
const MD_REPORT_FILE = path.join(REPORT_DIR, "latest-extreme-audit.md");

const protectedPrefixes = [
  ".git",
  ".codex-memory",
  ".codex-backups",
  "data",
  "backend/data",
  "assets/pubpaid",
  "games/vale-pool",
  "pubpaid-phaser",
  "render-data",
  "node_modules"
];

const runtimeRoots = [
  "pubpaid.html",
  "pubpaid-phaser.css",
  "pubpaid-runtime.js",
  "pubpaid-phaser",
  "games",
  "catalogo-servicos.html",
  "catalogo-servicos.css",
  "catalogo-servicos.js",
  "pesquisa-acre-2026.html",
  "pesquisa-acre-2026.css",
  "pesquisa-acre-2026.js",
  "server.js",
  "render.yaml"
];

const generatedPatterns = [
  /(^|\/)__pycache__(\/|$)/,
  /\.pyc$/i,
  /\.pyo$/i,
  /(^|\/)test-results(\/|$)/,
  /(^|\/)playwright-report(\/|$)/,
  /(^|\/)\.cache(\/|$)/,
  /(^|\/)\.parcel-cache(\/|$)/,
  /(^|\/)\.next(\/|$)/,
  /(^|\/)dist(\/|$)/,
  /(^|\/)coverage(\/|$)/,
  /debug\.log$/i,
  /\.tmp$/i,
  /\.bak$/i
];

function toRel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function isProtected(relPath) {
  return protectedPrefixes.some((prefix) => relPath === prefix || relPath.startsWith(`${prefix}/`));
}

function matchesGenerated(relPath) {
  return generatedPatterns.some((pattern) => pattern.test(relPath));
}

function statSize(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      return fs.readdirSync(filePath).reduce((total, item) => total + statSize(path.join(filePath, item)), 0);
    }
    return stat.size;
  } catch (_error) {
    return 0;
  }
}

function walk(dir, output = []) {
  const relDir = toRel(dir);
  if (relDir && isProtected(relDir)) return output;

  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (_error) {
    return output;
  }

  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    const relPath = toRel(fullPath);
    if (!relPath || isProtected(relPath)) return;

    if (matchesGenerated(relPath)) {
      output.push({
        path: relPath,
        kind: entry.isDirectory() ? "directory" : "file",
        bytes: statSize(fullPath),
        reason: "generated-or-cache"
      });
      return;
    }

    if (entry.isDirectory()) {
      walk(fullPath, output);
    }
  });

  return output;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function main() {
  const candidates = walk(ROOT).sort((left, right) => right.bytes - left.bytes);
  const totalBytes = candidates.reduce((sum, item) => sum + item.bytes, 0);
  const payload = {
    ok: true,
    generatedAt: new Date().toISOString(),
    root: ROOT,
    totalCandidates: candidates.length,
    totalBytes,
    protectedPrefixes,
    runtimeRoots,
    candidates
  };

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    MD_REPORT_FILE,
    [
      "# Extreme Cleanup Audit",
      "",
      `Generated: ${payload.generatedAt}`,
      `Candidates: ${payload.totalCandidates}`,
      `Estimated removable size: ${formatBytes(totalBytes)}`,
      "",
      "## Protected Areas",
      "",
      ...protectedPrefixes.map((item) => `- ${item}`),
      "",
      "## Largest Candidates",
      "",
      ...candidates.slice(0, 80).map((item) => `- ${item.path} (${item.kind}, ${formatBytes(item.bytes)})`)
    ].join("\n"),
    "utf8"
  );

  console.log(`cleanup-audit ok: ${payload.totalCandidates} candidates, ${formatBytes(totalBytes)}`);
  console.log(toRel(MD_REPORT_FILE));
}

main();
