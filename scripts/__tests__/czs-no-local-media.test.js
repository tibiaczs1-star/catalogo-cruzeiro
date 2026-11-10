const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..");
const noticia = fs.readFileSync(path.join(ROOT, "noticia.js"), "utf8");
const html = fs.readFileSync(path.join(ROOT, "noticia.html"), "utf8");

test("materia nunca renderiza midia de endereco local ou privado", () => {
  assert.match(noticia, /const isNonPublicMediaUrl = /);
  assert.match(noticia, /if \(!raw \|\| isNonPublicMediaUrl\(raw\)\) \{/);
  assert.ok(noticia.includes(String.raw`localhost|127(?:`), "guarda cobre 127.x");
  assert.ok(noticia.includes(String.raw`192\.168`), "guarda cobre 192.168.x");
  assert.ok(noticia.includes(String.raw`172\.(?:1[6-9]|2\d|3[01])`), "guarda cobre 172.16-31");
});

test("cache offline nao ressuscita materia que saiu do acervo", () => {
  assert.match(noticia, /const isSlugInCurrentArchive = /);
  assert.match(noticia, /isSlugInCurrentArchive\(targetSlug\) \? findStoredArticle\(targetSlug\) : null/);
});

test("pagina carrega a correcao com versao nova de cache", () => {
  assert.match(html, /noticia\.js\?v=20261109-media-local-guard1/);
});

test("acervo publicado nao contem midia local", () => {
  const news = fs.readFileSync(path.join(ROOT, "news-data.js"), "utf8");
  assert.doesNotMatch(news, /127\.0\.0\.1|localhost/i);
});

test("camada premium so desliga com saveData explicito", () => {
  const premium = fs.readFileSync(path.join(ROOT, "czs-premium.js"), "utf8");
  assert.match(premium, /navigator\.connection\.saveData === true/);
  assert.doesNotMatch(premium, /var saveData = navigator\.connection && navigator\.connection\.saveData;/);
});
