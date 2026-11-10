const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..");
const server = fs.readFileSync(path.join(ROOT, "server.js"), "utf8");
const noticiaHtml = fs.readFileSync(path.join(ROOT, "noticia.html"), "utf8");
const homeHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

// A capa anuncia window.CZS_CURRENT_FEATURES como plantao. Se essa fonte nao
// entrar na leitura do servidor nem na pagina de materia, o destaque da capa
// abre "Noticia nao encontrada".
test("servidor le a selecao atual junto do acervo", () => {
  assert.match(server, /const CURRENT_NEWS_FILE = path\.join\(ROOT_DIR, "home-current-news\.js"\);/);
  assert.match(server, /function getCurrentNewsFeatures\(\)/);
  assert.match(server, /\.concat\(getCurrentNewsFeatures\(\)\)/);
  assert.match(server, /STATIC_NEWS_FILE,\s*\n\s*CURRENT_NEWS_FILE/, "selecao entra na chave de cache");
});

test("pagina de materia conhece a selecao atual", () => {
  assert.match(noticiaHtml, /home-current-news\.js\?v=[a-f0-9]{12}/);
});

test("capa e materia usam a mesma versao da selecao atual", () => {
  const v = (html) => (html.match(/home-current-news\.js\?v=([a-f0-9]{12})/) || [])[1];
  assert.ok(v(homeHtml), "capa precisa carregar a selecao atual");
  assert.equal(v(noticiaHtml), v(homeHtml), "versoes divergentes entre capa e materia");
});

test("toda materia da selecao atual tem slug", () => {
  const sandbox = { window: {} };
  require("node:vm").createContext(sandbox);
  require("node:vm").runInContext(
    fs.readFileSync(path.join(ROOT, "home-current-news.js"), "utf8"),
    sandbox
  );
  const items = sandbox.window.CZS_CURRENT_FEATURES;
  assert.ok(Array.isArray(items) && items.length > 0, "selecao atual vazia");
  items.forEach((item) => {
    assert.ok(item.slug && item.slug.trim(), `item sem slug: ${item.title}`);
    assert.ok(item.title && item.title.trim(), `item sem titulo: ${item.slug}`);
  });
});
