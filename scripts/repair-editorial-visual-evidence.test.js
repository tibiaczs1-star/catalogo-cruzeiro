"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { extractOgImage, repairItem } = require("./repair-editorial-visual-evidence");

test("extractOgImage aceita atributos em qualquer ordem e resolve URL relativa", () => {
  const html = '<meta content="/media/noticia.jpg?a=1&amp;b=2" property="og:image">';
  assert.equal(extractOgImage(html, "https://fonte.example/noticia"), "https://fonte.example/media/noticia.jpg?a=1&b=2");
});

test("repairItem usa a imagem real da fonte e registra crédito conservador", () => {
  const result = repairItem(
    { slug: "materia", sourceName: "Fonte Acre", imageUrl: "", imageCredit: "" },
    "https://fonte.example/imagem.jpg"
  );
  assert.equal(result.item.imageUrl, "https://fonte.example/imagem.jpg");
  assert.equal(result.item.feedImageUrl, "https://fonte.example/imagem.jpg");
  assert.equal(result.item.imageCredit, "Imagem reproduzida da fonte: Fonte Acre");
  assert.equal(result.changed, true);
});

test("repairItem registra exceção auditável quando a fonte não possui imagem", () => {
  const result = repairItem({
    slug: "aviso-legal",
    sourceName: "Fonte Acre",
    imageQuality: "imagem-ausente-na-fonte-enviar-cheffe-call"
  });
  assert.equal(result.item.visualPolicy, "text-only-source");
  assert.equal(result.changed, true);
});
