"use strict";

// Gera home-current-news.js a partir de noticias reais e verificadas do
// runtime. Nada e escrito a mao aqui: cada campo vem do item coletado.
//
// Uso: node scripts/build-current-features.js

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const runtime = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "runtime-news.json"), "utf8"));
const items = Array.isArray(runtime.items) ? runtime.items : [];
const bySlug = new Map(items.map((item) => [item.slug, item]));

// Ordem editorial da capa. Cada slug precisa existir no runtime.
const PICKS = [
  "cruzeiro-do-sul-e-2-do-norte-em-cobertura-da-atencao-primaria-a-saude",
  "chuva-com-ventos-fortes-provoca-destelhamentos-e-queda-de-arvores-em-cruzeiro-do-sul",
  "prefeitura-de-cruzeiro-do-sul-articula-regularizacao-de-cerca-de-60-caminhoes-que-atendem-comunidades-rurais",
  "ufac-abre-selecao-para-medicina-com-80-vagas-em-2027-provas-serao-aplicadas-em-cruzeiro-do-sul-e-outras-quatro-cidades",
  "apreensao-de-15-kg-de-cocaina-causa-prejuizo-de-mais-de-r-210-mil-ao-crime-em-cruzeiro-do-sul",
  "prefeitura-inicia-obra-para-evitar-desmoronamento-de-tumulos-no-cemiterio-sao-joao-batista-em-cruzeiro-do-sul"
];

// Correcao de categoria: a fonte manda errado em varios casos.
const CATEGORY_FIX = {
  "prefeitura-de-cruzeiro-do-sul-articula-regularizacao-de-cerca-de-60-caminhoes-que-atendem-comunidades-rurais":
    { category: "Juruá", categoryKey: "jurua" },
  "chuva-com-ventos-fortes-provoca-destelhamentos-e-queda-de-arvores-em-cruzeiro-do-sul":
    { category: "Cotidiano", categoryKey: "cotidiano" },
  "ufac-abre-selecao-para-medicina-com-80-vagas-em-2027-provas-serao-aplicadas-em-cruzeiro-do-sul-e-outras-quatro-cidades":
    { category: "Educação", categoryKey: "educacao" },
  "apreensao-de-15-kg-de-cocaina-causa-prejuizo-de-mais-de-r-210-mil-ao-crime-em-cruzeiro-do-sul":
    { category: "Polícia", categoryKey: "policia" },
  "prefeitura-inicia-obra-para-evitar-desmoronamento-de-tumulos-no-cemiterio-sao-joao-batista-em-cruzeiro-do-sul":
    { category: "Cruzeiro do Sul", categoryKey: "cruzeiro-do-sul" },
  "cruzeiro-do-sul-e-2-do-norte-em-cobertura-da-atencao-primaria-a-saude":
    { category: "Saúde", categoryKey: "saude" }
};

const PREVIEW_BY_KEY = {
  saude: "thumb-saude",
  educacao: "thumb-educacao",
  policia: "thumb-policia",
  cotidiano: "thumb-cotidiano",
  jurua: "thumb-jurua",
  "cruzeiro-do-sul": "thumb-cruzeiro"
};

function shortDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`;
}

function feature(item, index) {
  const fix = CATEGORY_FIX[item.slug] || {};
  const categoryKey = fix.categoryKey || item.categoryKey || "cotidiano";
  const category = fix.category || item.category || "Cotidiano";
  const publishedAt = item.publishedAt || item.date || new Date().toISOString();
  const title = String(item.title || "").trim();
  const summary = String(item.summary || item.lede || "").trim();

  return {
    id: `czs-current-${index + 1}`,
    slug: item.slug,
    title,
    seoTitle: `${title} | Catálogo CZS`,
    seoDescription: summary.slice(0, 155),
    date: shortDate(publishedAt),
    publishedAt,
    sourcePublishedDate: String(item.sourcePublishedDate || publishedAt).slice(0, 10),
    sourceTimePrecision: "day",
    eyebrow: category,
    category,
    categoryKey,
    previewClass: PREVIEW_BY_KEY[categoryKey] || "thumb-cotidiano",
    sourceName: item.sourceName || "Fonte",
    sourceUrl: item.sourceUrl || "",
    sourceLabel: `${item.sourceName || "Fonte"}: ${title.slice(0, 48)}`,
    lede: String(item.lede || summary).slice(0, 220),
    summary,
    highlights: [],
    development: [],
    body: Array.isArray(item.body) && item.body.length ? item.body : [summary],
    imageUrl: item.imageUrl || item.feedImageUrl || "",
    feedImageUrl: item.feedImageUrl || item.imageUrl || "",
    imageCredit: item.imageCredit || item.sourceName || "",
    imageFocus: item.imageFocus || "center 50%",
    imageFit: item.imageFit || "cover",
    media: null,
    videoUrl: item.videoUrl || "",
    priority: 6400,
    editorialPriority: "capa-atual",
    sourceCount: 1,
    crossSources: [{ name: item.sourceName || "Fonte", url: item.sourceUrl || "" }],
    alternateSources: [],
    alternateSlugs: [],
    accessibility: {
      alt: title,
      caption: item.imageCredit || item.sourceName || ""
    }
  };
}

const picked = PICKS.map((slug) => bySlug.get(slug)).filter(Boolean);
if (!picked.length) {
  console.error("[features] nenhuma noticia encontrada no runtime; nada foi escrito");
  process.exit(1);
}

const missing = PICKS.filter((slug) => !bySlug.has(slug));
if (missing.length) console.warn("[features] slugs ausentes:", missing);

const features = picked.map(feature);
const stamp = new Date().toISOString().slice(0, 10);
const header = `/* Gerado por scripts/build-current-features.js em ${stamp}. Nao editar a mao. */\n`;
const payload = `${header}window.CZS_CURRENT_FEATURES = ${JSON.stringify(features, null, 2)};\n`;

fs.writeFileSync(path.join(ROOT, "home-current-news.js"), payload, "utf8");
console.log(`[features] ${features.length} destaques gravados em home-current-news.js`);
features.forEach((f) => console.log(` - ${f.date} | ${f.category} | ${f.title.slice(0, 52)}`));
