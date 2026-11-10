const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..");
const pages = ["index.html", "noticia.html", "arquivo.html"];

// news-data.js e servido com Cache-Control immutable por um ano. Sem trocar a
// versao na URL, o visitante continua rodando o acervo antigo depois do deploy.
test("toda pagina que carrega news-data.js usa a mesma versao atual", () => {
  const versions = pages.map((page) => {
    const html = fs.readFileSync(path.join(ROOT, page), "utf8");
    const match = html.match(/news-data\.js\?v=([^"'&]+)/);
    assert.ok(match, `${page} precisa carregar news-data.js com versao`);
    return { page, version: match[1] };
  });

  const distinct = [...new Set(versions.map((entry) => entry.version))];
  assert.equal(distinct.length, 1, `versoes divergentes: ${JSON.stringify(versions)}`);
  assert.notEqual(distinct[0], "20260424pixelart1", "versao antiga nao pode voltar");
  assert.notEqual(distinct[0], "20260425archive-pdfguard1", "versao antiga nao pode voltar");
});

test("acervo carregado pelas paginas nao contem o registro retirado", () => {
  const news = fs.readFileSync(path.join(ROOT, "news-data.js"), "utf8");
  assert.doesNotMatch(news, /czs-real-video-001/);
  assert.doesNotMatch(news, /127\.0\.0\.1|localhost/i);
});
