const fs = require("fs");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");

const ROOT = path.resolve(__dirname, "..", "..");

test("video rail cards never render an empty image source", () => {
  const runtime = fs.readFileSync(path.join(ROOT, "assets", "v8-final", "v8-merge-ready.js"), "utf8");

  assert.match(runtime, /function railMediaMarkup/);
  assert.match(runtime, /poster\s*\?\s*`<img/);
  assert.match(runtime, /:\s*`<video muted playsinline/);
  assert.match(runtime, /function videoPlaylistPreviewMarkup/);
  assert.doesNotMatch(runtime, /<img src="\$\{esc\(item\.poster\)\}"/);
  assert.match(runtime, /id="v8MainVideo"[\s\S]*?preload="metadata"/);
});

test("hero action labels stay intact", () => {
  const css = fs.readFileSync(path.join(ROOT, "assets", "v8-final", "v8-merge-ready.css"), "utf8");

  assert.match(css, /\.v8-hero-controls \.btn[\s\S]*?white-space:\s*nowrap\s*!important/);
  assert.match(css, /\.v8-rail-story video/);
  assert.match(css, /\.v8-story-bubble video/);
  assert.match(css, /\.v8-story-capture-note[\s\S]*?display:\s*flex\s*!important[\s\S]*?gap:\s*6px\s*!important/);
});

test("feed cards do not stretch rows or reserve blank media", () => {
  const css = fs.readFileSync(path.join(ROOT, "assets", "v8-final", "v8-merge-ready.css"), "utf8");
  const mobileRepair = css.slice(css.lastIndexOf("/* 20260713: compact mobile header"));

  assert.match(css, /\.feed-grid > \.news-card[\s\S]*?min-height:\s*0\s*!important[\s\S]*?height:\s*auto\s*!important/);
  assert.match(css, /\.news-card \.media-frame\.v8-img-missing[\s\S]*?display:\s*none\s*!important/);
  assert.match(css, /\.feed-grid > \.news-card \.copy p[\s\S]*?-webkit-line-clamp:\s*4\s*!important/);
  assert.match(css, /@media \(min-width:\s*981px\) and \(max-width:\s*1599px\)[\s\S]*?\.feed-grid[\s\S]*?repeat\(4,/);
  assert.match(mobileRepair, /@media \(max-width:\s*760px\)[\s\S]*?\.nav[\s\S]*?display:\s*flex\s*!important[\s\S]*?overflow-x:\s*auto\s*!important/);
  assert.match(mobileRepair, /\.brandrow > \.nav,\s*body\.v8-merge-ready \.nav/);
  assert.match(mobileRepair, /@media \(max-width:\s*760px\)[\s\S]*?\.utility-row[\s\S]*?display:\s*flex\s*!important[\s\S]*?overflow-x:\s*auto\s*!important/);
});

test("homepage cache keys expose the repaired assets and news snapshot", () => {
  const index = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

  assert.match(index, /v8-merge-ready\.css\?v=20260726-intro-recovery-v2/);
  assert.match(index, /v8-merge-ready\.js\?v=20260726-intro-recovery-v2/);
  assert.match(index, /news-data\.js\?v=20260716-photo-relevance-v1/);
});
