const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

const campaignAssets = [
  "campanha-country-botas-rosa-estudio.webp",
  "campanha-country-botas-douradas-close.webp",
  "produto-botas-douradas-perfil.webp",
  "campanha-country-raiane-botas-douradas.webp",
  "campanha-country-raiane-blocos.webp",
  "produto-botas-douradas-frontal.webp",
  "lifestyle-country-cavalo.webp",
  "produto-botas-rosa-fazenda.webp",
];

test("incorpora as 8 fotografias limpas da campanha country", () => {
  for (const asset of campaignAssets) {
    assert.match(app, new RegExp(asset.replaceAll(".", "\\.")));
    assert.ok(fs.existsSync(path.join(root, "assets", asset)), asset);
    assert.ok(
      fs.existsSync(path.join(root, "assets", asset.replace(".webp", "-720.webp"))),
      `${asset} responsiva`,
    );
  }
});

test("não publica fotografias com marcas de loja ou artefatos de remoção", () => {
  const excludedAssets = [
    "campanha-country-botas-rosa-loja.webp",
    "campanha-country-raiane-botas-rosa-loja.webp",
    "parceiros-laco-de-ouro.webp",
    "campanha-country-raiane-por-do-sol.webp",
    "campanha-country-raiane-editorial-estudio.webp",
    "produto-botas-rosa-pegada-loja.webp",
  ];

  for (const asset of excludedAssets) {
    assert.doesNotMatch(app, new RegExp(asset.replaceAll(".", "\\.")));
    assert.doesNotMatch(html, new RegExp(asset.replaceAll(".", "\\.")));
  }
});

test("organiza o book em capítulos editoriais", () => {
  for (const label of ["Campanha Country", "Produto em Cena", "Parceiros", "Passarela"]) {
    assert.match(html, new RegExp(label, "i"));
  }
});

test("galeria responsiva expõe metadados e lightbox acessível", () => {
  assert.match(app, /srcset=/);
  assert.match(app, /loading="lazy"/);
  assert.match(app, /decoding="async"/);
  assert.match(app, /width="\$\{item\.width\}"/);
  assert.match(html, /<dialog[^>]+id="lightbox"/);
  assert.match(html, /aria-label="Fechar/);
});
