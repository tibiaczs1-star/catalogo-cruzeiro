const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..");

test("homepage cards use compact visible titles while preserving full article labels", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

  assert.match(html, /function\s+czsCompactTitle\s*\(/, "index.html needs a compact title helper for long regional headlines");
  assert.match(html, /aria-label="Abrir matéria:\s*\$\{esc\(n\.title\)\}"/, "full article title must stay available to screen readers");
  assert.match(html, /<h3[^>]*>\$\{esc\(czsCompactTitle\(n\.title\)\)\}<\/h3>/, "feed and side cards must render a compact visible title");
  assert.match(html, /<b>\$\{esc\(czsCompactTitle\(n\.title\)\)\}<\/b>/, "archive rows must render compact visible titles");
  assert.match(html, /articlePreviewTitle['"]\)\.textContent\s*=\s*czsCompactTitle\(n\.title,\s*96\)/, "archive preview title must be shortened visually");
});

test("homepage CSS protects selected article preview from mobile title overflow", () => {
  const css = fs.readFileSync(path.join(ROOT, "assets", "v8-final", "v8-merge-ready.css"), "utf8");

  assert.match(css, /#articlePreviewTitle[\s\S]*font-size:\s*clamp\(/, "preview title needs responsive sizing");
  assert.match(css, /#articlePreviewTitle[\s\S]*-webkit-line-clamp:\s*4/, "preview title should clamp instead of being cropped");
  assert.match(css, /#articlePreviewText[\s\S]*overflow-y:\s*auto/, "preview text needs a safe scroll area for long summaries");
  assert.match(css, /\.czs-full-title-hint/, "compact titles need a visible hint that full text opens on click");
});
