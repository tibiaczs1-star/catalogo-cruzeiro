"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "..");
const bookRoot = path.join(root, "bookray");

test("publishes Raiane Leoncio's approved portfolio as the /bookray/ subpage", () => {
  const indexPath = path.join(bookRoot, "index.html");
  const cssPath = path.join(bookRoot, "styles.css");
  const appPath = path.join(bookRoot, "app.js");

  for (const filePath of [indexPath, cssPath, appPath]) {
    assert.ok(fs.existsSync(filePath), `${path.relative(root, filePath)} must exist`);
  }

  const html = fs.readFileSync(indexPath, "utf8");
  const app = fs.readFileSync(appPath, "utf8");
  const server = fs.readFileSync(path.join(root, "server.js"), "utf8");

  assert.match(html, /Raiane Leoncio/i);
  assert.match(html, /17 anos/i);
  assert.match(html, /modelo de passarela/i);
  assert.match(html, /href="styles\.css"/);
  assert.match(html, /src="app\.js"/);
  assert.match(server, /pathname === "\/bookray"/);
  assert.match(server, /pathname === "\/bookray\/"/);
  assert.match(server, /path\.join\(ROOT_DIR, "bookray", "index\.html"\)/);
  assert.match(server, /"\.gif"/);

  assert.doesNotMatch(app, /IMG_0727(?:-web)?\.(?:MOV|mp4)/i);
  assert.doesNotMatch(app, /872BC754-C597-4446-A5D9-D42FB1117EB1\.MP4/);
  assert.match(app, /runway-film\.mp4/);

  const referencedAssets = [...app.matchAll(/['"]([^'"`]+\.(?:jpe?g|gif|mp4))['"]/gi)]
    .map((match) => match[1]);
  assert.equal(new Set(referencedAssets).size, 36);

  for (const asset of new Set(referencedAssets)) {
    const assetPath = path.join(bookRoot, "assets", asset);
    assert.ok(fs.existsSync(assetPath), `bookray/assets/${asset} must exist`);
    assert.ok(fs.statSync(assetPath).size < 25 * 1024 * 1024, `${asset} must stay below 25 MB`);
  }
});
