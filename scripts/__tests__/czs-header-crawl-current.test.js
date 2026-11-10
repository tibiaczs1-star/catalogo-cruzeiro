const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..");
const V8 = fs.readFileSync(path.join(ROOT, "assets", "v8-final", "v8-merge-ready.js"), "utf8");
const HOME = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

// O letreiro "Plantao" ficava com o acervo inteiro (manchetes de setembro).
// Ele precisa anunciar a selecao editorial atual.
test("letreiro do plantao usa a selecao editorial atual", () => {
  const crawl = V8.slice(V8.indexOf("function installHeaderNewsCrawl()"));
  const body = crawl.slice(0, crawl.indexOf("function startLegacyTickerMarquee"));

  assert.match(body, /window\.CZS_CURRENT_FEATURES/);
  assert.match(body, /currentFeatures\.length\s*\n?\s*\?\s*currentFeatures/);
  assert.doesNotMatch(
    body,
    /const source = \(allStories\.length \? allStories : heroStories\)/,
    "allStories nao pode alimentar o plantao"
  );
  assert.match(body, /heroStories\.length \? heroStories : allStories/, "fallback coerente");
});

test("capa publica o v8-merge-ready com fingerprint de conteudo", () => {
  assert.match(HOME, /v8-merge-ready\.js\?v=[a-f0-9]{12}/);
});
