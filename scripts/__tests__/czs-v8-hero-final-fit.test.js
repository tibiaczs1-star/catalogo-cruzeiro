const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..");

test("real V8 hero classifies graphic cards and exposes safe fit hooks", () => {
  const js = fs.readFileSync(path.join(ROOT, "assets", "v8-final", "v8-merge-ready.js"), "utf8");

  assert.match(js, /function\s+czsHeroMediaFit\s*\(/, "V8 hero needs its own media-fit classifier");
  assert.match(js, /CZS_GRAPHIC_MEDIA_PATTERN/, "graphic/card/PNG detection must be centralized");
  assert.match(js, /lead\.dataset\.czsMediaFit\s*=\s*mediaFit/, "main hero must expose media fit on the root");
  assert.match(js, /v8-hero-media-frame czs-media-\$\{esc\(mediaFit\)\}/, "hero media frame must receive the fit class");
  assert.match(js, /v8-rail-story czs-media-\$\{esc\(mediaFit\)\}/, "side rail cards must receive the fit class");
  assert.match(js, /data-czs-media-fit="\$\{esc\(mediaFit\)\}"/, "side rail cards must expose the fit data attribute");
});

test("real V8 hero final CSS prevents cropped hero images and clipped titles", () => {
  const css = fs.readFileSync(path.join(ROOT, "assets", "v8-final", "v8-merge-ready.css"), "utf8");

  assert.match(css, /CZS_HERO_FINAL_SAFE_FIT_20260809/, "missing final hero safe-fit maintenance block");
  assert.match(css, /#leadStory\.v8-live-hero\[data-czs-media-fit="contain"\][\s\S]*object-fit:\s*contain\s*!important/, "graphic hero media must use contain");
  assert.match(css, /#leadStory\.v8-live-hero\[data-czs-media-fit="cover"\][\s\S]*object-fit:\s*cover\s*!important/, "photo hero media must keep cover");
  assert.match(css, /#leadStory\.v8-live-hero \.v8-hero-copy h1[\s\S]*-webkit-line-clamp:\s*4\s*!important/, "desktop hero title must be clamped instead of visually cropped");
  assert.match(css, /#heroSide \.v8-rail-story\[data-czs-media-fit="contain"\] img[\s\S]*object-fit:\s*contain\s*!important/, "side rail graphic cards must not be amputated");
});
