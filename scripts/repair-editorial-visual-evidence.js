"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const RUNTIME_FILE = path.join(ROOT_DIR, "data", "runtime-news.json");
const ARCHIVE_FILE = path.join(ROOT_DIR, "data", "news-archive.json");
const NEWS_DATA_FILE = path.join(ROOT_DIR, "news-data.js");

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function extractOgImage(html, baseUrl) {
  const tags = String(html || "").match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    if (!/\b(?:property|name)\s*=\s*["']og:image(?::url)?["']/i.test(tag)) continue;
    const match = tag.match(/\bcontent\s*=\s*(["'])(.*?)\1/i);
    if (!match || !match[2]) continue;
    try {
      return new URL(decodeHtml(match[2].trim()), baseUrl).href;
    } catch {
      return "";
    }
  }
  return "";
}

function hasImage(item) {
  return Boolean(item.imageUrl || item.feedImageUrl || item.sourceImageUrl);
}

function repairItem(item, fetchedImageUrl = "") {
  const next = { ...item };
  let changed = false;
  if (!hasImage(next) && fetchedImageUrl) {
    next.imageUrl = fetchedImageUrl;
    next.feedImageUrl = fetchedImageUrl;
    next.sourceImageUrl = fetchedImageUrl;
    next.imageFocus = next.imageFocus || "center";
    next.imageFit = next.imageFit || "cover";
    next.imageQuality = next.imageQuality || "imagem-da-pagina-fonte";
    changed = true;
  }
  if (
    !hasImage(next) &&
    !fetchedImageUrl &&
    next.imageQuality === "imagem-ausente-na-fonte-enviar-cheffe-call" &&
    next.visualPolicy !== "text-only-source"
  ) {
    next.visualPolicy = "text-only-source";
    changed = true;
  }
  if (hasImage(next) && !String(next.imageCredit || "").trim() && next.sourceName) {
    next.imageCredit = `Imagem reproduzida da fonte: ${next.sourceName}`;
    changed = true;
  }
  return { item: next, changed };
}

async function fetchOgImage(sourceUrl) {
  if (!sourceUrl) return "";
  const response = await fetch(sourceUrl, {
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
    headers: { "user-agent": "Mozilla/5.0 CZS-Editorial-Audit/1.0" }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return extractOgImage(await response.text(), response.url || sourceUrl);
}

async function buildImageMap(items) {
  const missing = items.filter((item) => !hasImage(item) && item.sourceUrl);
  const results = await Promise.all(
    missing.map(async (item) => {
      try {
        return [item.slug, await fetchOgImage(item.sourceUrl), ""];
      } catch (error) {
        return [item.slug, "", error.message];
      }
    })
  );
  return new Map(results.map(([slug, imageUrl]) => [slug, imageUrl]));
}

function repairList(items, imageMap) {
  let changed = 0;
  const next = items.map((item) => {
    const repaired = repairItem(item, imageMap.get(item.slug) || "");
    if (repaired.changed) changed += 1;
    return repaired.item;
  });
  return { items: next, changed };
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const runtime = JSON.parse(fs.readFileSync(RUNTIME_FILE, "utf8"));
  const archive = JSON.parse(fs.readFileSync(ARCHIVE_FILE, "utf8"));
  const imageMap = await buildImageMap(archive);
  const archiveResult = repairList(archive, imageMap);
  const activeResult = repairList(runtime.activeWindowItems || [], imageMap);
  const runtimeItemsResult = repairList(runtime.items || [], imageMap);

  runtime.activeWindowItems = activeResult.items;
  if (Array.isArray(runtime.items)) runtime.items = runtimeItemsResult.items;
  writeJson(RUNTIME_FILE, runtime);
  writeJson(ARCHIVE_FILE, archiveResult.items);
  fs.writeFileSync(
    NEWS_DATA_FILE,
    `window.NEWS_ARCHIVE_TOTAL = ${archiveResult.items.length};\nwindow.NEWS_DATA = ${JSON.stringify(archiveResult.items, null, 2)};\n`,
    "utf8"
  );

  const archiveBySlug = new Map(archiveResult.items.map((item) => [item.slug, item]));
  const unresolvedMissing = [...imageMap.entries()]
    .filter(([slug, url]) => !url && archiveBySlug.get(slug)?.visualPolicy !== "text-only-source")
    .map(([slug]) => slug);
  console.log(
    JSON.stringify(
      {
        ok: unresolvedMissing.length === 0,
        fetchedMissingImages: imageMap.size - unresolvedMissing.length,
        unresolvedMissing,
        changed: {
          archive: archiveResult.changed,
          activeWindow: activeResult.changed,
          runtimeItems: runtimeItemsResult.changed
        }
      },
      null,
      2
    )
  );
  if (unresolvedMissing.length) process.exitCode = 1;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { decodeHtml, extractOgImage, repairItem };
