#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const vm = require("node:vm");
const { spawnSync } = require("node:child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT_DIR, "data");
const RUNTIME_NEWS_FILE = path.join(DATA_DIR, "runtime-news.json");
const NEWS_ARCHIVE_FILE = path.join(DATA_DIR, "news-archive.json");
const STATIC_NEWS_FILE = path.join(ROOT_DIR, "news-data.js");
const OUTPUT_DIR = path.join(ROOT_DIR, "assets", "source-screenshots");
const DEFAULT_LIMIT = Math.max(1, Math.min(80, Number(process.env.CZS_SOURCE_SCREENSHOT_LIMIT || 32)));
const DEFAULT_CAPTURE_TIMEOUT_MS = Math.max(5000, Math.min(35000, Number(process.env.CZS_SOURCE_SCREENSHOT_TIMEOUT_MS || 16000)));

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
}

function readStaticNewsItems() {
  try {
    if (!fs.existsSync(STATIC_NEWS_FILE)) return [];
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(STATIC_NEWS_FILE, "utf-8"), sandbox, {
      filename: STATIC_NEWS_FILE,
      timeout: 1000
    });
    return Array.isArray(sandbox.window.NEWS_DATA) ? sandbox.window.NEWS_DATA : [];
  } catch {
    return [];
  }
}

function writeStaticNews(items = []) {
  fs.writeFileSync(
    STATIC_NEWS_FILE,
    `window.NEWS_ARCHIVE_TOTAL = ${items.length};\nwindow.NEWS_DATA = ${JSON.stringify(items, null, 2)};\n`,
    "utf-8"
  );
}

function normalizeAssetUrl(value = "") {
  return String(value || "").replace(/^\/assets\//, "assets/");
}

function weakImage(value = "") {
  const text = normalizeAssetUrl(value);
  return !text || /(?:^|\/)assets\/(?:home-cache|news-fallbacks)\/|\/news-fallbacks\/|loading_v2\.gif|pixel-art-editorial\.svg|placeholder|spacer|blank|favicon|logo|avatar|gravatar|default|sem-imagem|generica|gen[eé]rica/i.test(text);
}

function slugify(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || "fonte";
}

function findChrome() {
  const candidates = [
    process.env.CHROME,
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/microsoft-edge"
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate)) || "";
}

function collectItems() {
  const runtime = readJson(RUNTIME_NEWS_FILE, {});
  const archive = readJson(NEWS_ARCHIVE_FILE, []);
  const staticItems = readStaticNewsItems();
  return [
    ...(Array.isArray(runtime.activeWindowItems) ? runtime.activeWindowItems : []),
    ...(Array.isArray(runtime.items) ? runtime.items : []),
    ...(Array.isArray(archive) ? archive : []),
    ...staticItems
  ].filter(Boolean);
}

function shouldHydrate(item = {}) {
  if (!item || typeof item !== "object") return false;
  if (!/^https?:\/\//i.test(String(item.sourceUrl || ""))) return false;
  if (String(item.sourceUrl || "").includes("youtube.com/results")) return false;
  return weakImage(item.imageUrl || item.feedImageUrl || item.sourceImageUrl || "");
}

function screenshotPathFor(item = {}) {
  const date = String(item.publishedAt || item.date || "").slice(0, 10).replace(/[^0-9]/g, "") || "semdata";
  const slug = slugify(item.slug || item.title || item.sourceUrl);
  return path.join(OUTPUT_DIR, `${date}-${slug}.png`);
}

function captureSourceScreenshot(chromePath, item = {}, outputPath = "") {
  ensureDir(path.dirname(outputPath));
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "czs-source-shot-"));
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--no-default-browser-check",
    "--ignore-certificate-errors",
    "--window-size=1280,820",
    `--user-data-dir=${userDataDir}`,
    `--screenshot=${outputPath}`,
    String(item.sourceUrl)
  ];
  const result = spawnSync(chromePath, args, { timeout: DEFAULT_CAPTURE_TIMEOUT_MS, stdio: "pipe" });
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch {
    // Best effort cleanup only.
  }
  if (result.status !== 0 || !fs.existsSync(outputPath) || fs.statSync(outputPath).size < 12000) {
    try {
      fs.rmSync(outputPath, { force: true });
    } catch {
      // ignore
    }
    const stderr = Buffer.isBuffer(result.stderr) ? result.stderr.toString("utf-8") : "";
    throw new Error(stderr.trim().slice(0, 240) || `Chrome saiu com status ${result.status}`);
  }
  return outputPath;
}

function applyHydrationToItem(item = {}, hydratedByUrl = new Map()) {
  const shot = hydratedByUrl.get(item.sourceUrl);
  if (!shot) return false;
  if (!weakImage(item.imageUrl || item.feedImageUrl || item.sourceImageUrl || "")) return false;
  item.imageUrl = shot.assetPath;
  item.feedImageUrl = shot.assetPath;
  item.sourceImageUrl = shot.assetPath;
  item.imageCredit = "Print da fonte original";
  item.imageFocus = "source-page-first-fold";
  item.imageFit = "cover";
  item.imageQuality = "print-da-fonte-para-revisao-cheffe-call";
  item.imageHydration = "source-page-screenshot";
  item.imageHydratedAt = shot.capturedAt;
  item.sourceScreenshotUrl = shot.assetPath;
  return true;
}

function updateCollections(hydratedByUrl = new Map()) {
  const runtime = readJson(RUNTIME_NEWS_FILE, {});
  const archive = readJson(NEWS_ARCHIVE_FILE, []);
  const staticItems = readStaticNewsItems();
  let changed = 0;
  const visit = (item) => {
    if (applyHydrationToItem(item, hydratedByUrl)) changed += 1;
  };
  if (Array.isArray(runtime.activeWindowItems)) runtime.activeWindowItems.forEach(visit);
  if (Array.isArray(runtime.items)) runtime.items.forEach(visit);
  if (Array.isArray(archive)) archive.forEach(visit);
  if (Array.isArray(staticItems)) staticItems.forEach(visit);
  if (changed > 0) {
    writeJson(RUNTIME_NEWS_FILE, runtime);
    writeJson(NEWS_ARCHIVE_FILE, archive);
    writeStaticNews(staticItems);
  }
  return changed;
}

function parseArgs(argv = []) {
  const options = { limit: DEFAULT_LIMIT, dryRun: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") options.dryRun = true;
    if (arg === "--limit") options.limit = Math.max(1, Math.min(200, Number(argv[index + 1] || options.limit)));
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const chromePath = findChrome();
  const candidates = [];
  const seen = new Set();
  collectItems().forEach((item) => {
    if (!shouldHydrate(item)) return;
    const key = String(item.sourceUrl || "");
    if (!key || seen.has(key)) return;
    seen.add(key);
    candidates.push(item);
  });
  const selected = candidates.slice(0, options.limit);
  const report = {
    ok: true,
    chromePath: chromePath || null,
    candidateCount: candidates.length,
    selectedCount: selected.length,
    timeoutMs: DEFAULT_CAPTURE_TIMEOUT_MS,
    captured: [],
    failed: [],
    changedItems: 0
  };
  if (!chromePath) {
    report.ok = false;
    report.error = "Chrome/Edge nao encontrado para capturar prints da fonte.";
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = 1;
    return;
  }
  if (!options.dryRun) {
    const hydratedByUrl = new Map();
    for (const item of selected) {
      const outputPath = screenshotPathFor(item);
      const assetPath = path.relative(ROOT_DIR, outputPath).replace(/\\/g, "/");
      try {
        if (!fs.existsSync(outputPath)) captureSourceScreenshot(chromePath, item, outputPath);
        hydratedByUrl.set(item.sourceUrl, {
          assetPath,
          capturedAt: new Date().toISOString()
        });
        report.captured.push({ title: item.title, sourceUrl: item.sourceUrl, assetPath });
      } catch (error) {
        report.failed.push({
          title: item.title,
          sourceUrl: item.sourceUrl,
          error: String(error?.message || error).slice(0, 240)
        });
      }
      writeJson(path.join(DATA_DIR, "source-screenshot-hydration-report.json"), report);
    }
    report.changedItems = updateCollections(hydratedByUrl);
  }
  ensureDir(DATA_DIR);
  writeJson(path.join(DATA_DIR, "source-screenshot-hydration-report.json"), report);
  console.log(JSON.stringify(report, null, 2));
  if (report.failed.length && !report.captured.length) process.exitCode = 1;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
