const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const ROOT = path.resolve(__dirname, "..", "..");
const V8 = fs.readFileSync(path.join(ROOT, "assets", "v8-final", "v8-merge-ready.js"), "utf8");
const HOME = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

test("camada V8 usa o lote editorial atual em vez do snapshot inline antigo", () => {
  assert.match(V8, /const liveItems = Array\.isArray\(window\.NEWS_DATA\) \? window\.NEWS_DATA : \[\];/);
  assert.match(V8, /window\.CzsEditorialScope\?\.orderPortalStories\?\.\(rawStories\)/);
  assert.match(HOME, /v8-merge-ready\.js\?v=20260803-editorial-source-v1/);
  assert.doesNotMatch(V8, /1610 notícias/);
  assert.doesNotMatch(HOME, /1610 notícias/);
});
