/* eslint-disable no-console */

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const DATA_FILES = [
  path.join(ROOT, "data", "runtime-news.json"),
  path.join(ROOT, "data", "news-archive.json")
];
const NEWS_DATA_FILE = path.join(ROOT, "news-data.js");

const BLOCKED_GENERIC_NEWS_IMAGES = [
  /assets\/home-cache\/trend-theo-acreano\.jpg/i,
  /assets\/home-cache\/news-batelao-local\.jpg/i,
  /assets\/home-cache\/buzz-cruzeiro-01\.jpg/i,
  /assets\/home-cache\/rio-jurua-panorama\.jpg/i
];

function loadJsonItems(file) {
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  return Array.isArray(parsed) ? parsed : parsed.items || [];
}

function loadNewsDataJs(file) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(file, "utf8"), sandbox, { filename: file });
  return Array.isArray(sandbox.window.NEWS_DATA) ? sandbox.window.NEWS_DATA : [];
}

function isBlockedImage(value = "") {
  const normalized = String(value || "").replace(/\\/g, "/");
  return BLOCKED_GENERIC_NEWS_IMAGES.some((pattern) => pattern.test(normalized));
}

function imageFields(item = {}) {
  return [item.imageUrl, item.feedImageUrl, item.sourceImageUrl].filter(Boolean);
}

function inspectFile(file, items) {
  const issues = [];
  items.forEach((item) => {
    const badImage = imageFields(item).find(isBlockedImage);
    if (!badImage) return;
    issues.push({
      file: path.relative(ROOT, file),
      slug: item.slug || "",
      title: item.title || "",
      imageUrl: badImage
    });
  });
  return issues;
}

const issues = [];

DATA_FILES.forEach((file) => {
  if (fs.existsSync(file)) issues.push(...inspectFile(file, loadJsonItems(file)));
});

if (fs.existsSync(NEWS_DATA_FILE)) {
  issues.push(...inspectFile(NEWS_DATA_FILE, loadNewsDataJs(NEWS_DATA_FILE)));
}

if (issues.length) {
  console.error("[news-image-relevance] fotos genericas bloqueadas em noticias:");
  console.error(JSON.stringify(issues.slice(0, 20), null, 2));
  console.error(`[news-image-relevance] total=${issues.length}`);
  process.exit(1);
}

console.log("[news-image-relevance] OK: nenhuma noticia usa retrato generico bloqueado.");
