const fs = require("fs");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");

const HOME = fs.readFileSync(path.resolve(__dirname, "..", "..", "index.html"), "utf8");

test("home sincroniza pela própria origem e preserva a seleção editorial regional", () => {
  assert.match(HOME, /const API_BASE=window\.location\.protocol==='http:'\|\|window\.location\.protocol==='https:'\s*\?\s*window\.location\.origin\s*:\s*LIVE;/);
  assert.match(HOME, /const API_ARCHIVE=`\$\{API_BASE\}\/api\/news\/archive\?limit=1000`;/);
  assert.match(HOME, /orderPortalStories\?\.\(d\.items\.map\(/);
  assert.match(HOME, /function czsSurfaceStories\(\)\{[\s\S]*?orderPortalStories\?\.\(eligible\)/);
  assert.doesNotMatch(HOME, /const API_ARCHIVE='https:\/\/catalogo-cruzeiro-web\.onrender\.com\/api\/news\/archive/);
});
