"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildItem,
  findDuplicate,
  validateConfig
} = require("../add-czs-fast-item");

const config = {
  slug: "suspeita-de-ligar-faccao-entre-peru-e-acre",
  title: "Suspeita de ligar facção entre Peru e Acre",
  summary:
    "Uma mulher apontada pela Polícia Militar como responsável por intermediar a comunicação de uma organização criminosa entre o Peru, o Acre e o Nordeste foi presa pela ROTAM em Cruzeiro do Sul. Segundo a PM, ela estava foragida havia cerca de um ano e tentou destruir o celular durante a abordagem. O aparelho foi apreendido e será analisado pela Polícia Civil.",
  publishedAt: "2026-07-14T12:37:00.000-05:00",
  date: "14 de jul de 2026",
  eyebrow: "Cruzeiro do Sul",
  category: "Cruzeiro do Sul",
  categoryKey: "cruzeiro-do-sul",
  previewClass: "thumb-cruzeiro-do-sul",
  sourceName: "Juruá em Tempo / PMAC",
  sourceUrl:
    "https://www.juruaemtempo.com.br/2026/07/suspeita-de-intermediar-comunicacao-de-faccao-entre-peru-e-acre-e-presa-pela-pm-em-cruzeiro-do-sul/",
  imageUrl: "assets/news-manual/prisao-faccao-peru-acre-20260714.webp",
  imageCredit: "Foto: Reprodução via Juruá em Tempo",
  alt: "Mulher presa entre dois policiais da Rotam",
  priority: 2007,
  editorialPriority: "jurua-destaque"
};

test("preserva exatamente o resumo do Instagram no item do site", () => {
  validateConfig(config);
  const item = buildItem(config);
  assert.equal(item.summary, config.summary);
  assert.equal(item.lede, config.summary);
  assert.equal(item.seoDescription, config.summary);
  assert.deepEqual(item.body, [config.summary, `Fonte: ${config.sourceName}.`]);
});

test("aceita corpo editorial, destaques e análise opcionais", () => {
  const editorial = {
    ...config,
    body: ["Primeiro parágrafo.", "Segundo parágrafo."],
    highlights: ["Destaque editorial."],
    analysis: "Contexto editorial."
  };
  const item = buildItem(editorial);
  assert.deepEqual(item.body, editorial.body);
  assert.deepEqual(item.development, editorial.body);
  assert.deepEqual(item.highlights, editorial.highlights);
  assert.equal(item.analysis, editorial.analysis);
});

test("detecta duplicidade apenas por título ou link", () => {
  assert.equal(findDuplicate([{ title: config.title }], config).reason, "title");
  assert.equal(findDuplicate([{ sourceUrl: config.sourceUrl }], config).reason, "sourceUrl");
  assert.equal(findDuplicate([{ title: "Outra notícia", sourceUrl: "https://example.com/outra" }], config), null);
});

test("rejeita headline acima de oito palavras e resumo fora de 40 a 80", () => {
  assert.throws(() => validateConfig({ ...config, title: "Um dois três quatro cinco seis sete oito nove" }), /8 palavras/);
  assert.throws(() => validateConfig({ ...config, summary: "Resumo curto demais para publicação no site." }), /40 a 80 palavras/);
});
