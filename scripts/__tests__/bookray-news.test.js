"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "..");
const slug = "modelo-cruzeirense-lanca-seu-book-online-confira";
const title = "Modelo cruzeirense lança seu book online — confira";

function findInFile(filePath) {
  const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const items = Array.isArray(payload) ? payload : payload.activeWindowItems;
  return items.find((item) => item.slug === slug);
}

test("publishes the exclusive Raiane book story in every public news surface", () => {
  const runtimeItem = findInFile(path.join(root, "data", "runtime-news.json"));
  const archiveItem = findInFile(path.join(root, "data", "news-archive.json"));
  const staticNews = fs.readFileSync(path.join(root, "news-data.js"), "utf8");
  const home = fs.readFileSync(path.join(root, "index.html"), "utf8");

  for (const item of [runtimeItem, archiveItem]) {
    assert.ok(item, `${slug} must exist in the public news collections`);
    assert.equal(item.title, title);
    assert.equal(item.categoryKey, "cruzeiro-do-sul");
    assert.equal(item.imageUrl, "bookray/assets/IMG_1127.jpeg");
    assert.equal(item.sourceUrl, "https://catalogo-cruzeiro-web.onrender.com/bookray/");
    assert.match(item.summary, /Raiane Leoncio/i);
    assert.match(item.summary, /17 anos/i);
    assert.match(item.body.join(" "), /modelo de passarela/i);
    assert.match(item.body.join(" "), /book completo/i);
  }

  assert.match(staticNews, new RegExp(`"slug": "${slug}"`));
  assert.match(home, new RegExp(`"slug":"${slug}"`));
});
