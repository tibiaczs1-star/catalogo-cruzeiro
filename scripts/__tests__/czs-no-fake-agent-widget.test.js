const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..");
const article = fs.readFileSync(path.join(ROOT, "noticia.html"), "utf8");
const noticiaJs = fs.readFileSync(path.join(ROOT, "noticia.js"), "utf8");

// O portal nao opera agentes de noticia. O widget "agentes ao vivo" exibia
// frases inventadas ("Radar quase pronto", "Documento recebido") na pagina de
// materia e foi removido em 2026-11-09. Nao deve voltar.
test("pagina de materia nao carrega o widget de agentes ficticios", () => {
  assert.doesNotMatch(article, /agentes-newsroom-hero\.js/);
  assert.doesNotMatch(article, /agentes-newsroom-hero\.css/);
  assert.doesNotMatch(article, /sala-redacao-real\.js/);
});

test("cartao de midia nao imprime texto de preenchimento", () => {
  assert.doesNotMatch(noticiaJs, /mediaNoteNode\.textContent = "Esta capa é um apoio visual/);
  assert.doesNotMatch(noticiaJs, /mediaKindNode\.textContent = "Foto real"/);
  assert.match(noticiaJs, /article\.imageCredit \|\| "Imagem publicada pela fonte original/);
});
