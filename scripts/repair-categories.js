"use strict";

// Correcao cirurgica de categoria: apenas atos da Prefeitura de Cruzeiro do
// Sul que o RSS rotulou como "Policia" so porque a Policia Rodoviaria Federal
// foi citada numa reuniao. Nada mais e tocado: a inferencia por palavra-chave
// erra em texto arbitrario e reclassificar em massa troca um erro por outro.
//
// Uso: node scripts/repair-categories.js [--dry]

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DRY = process.argv.includes("--dry");
const FILES = ["runtime-news.json", "news-archive.json"];

const CRIME =
  /\b(preso|prende|prenderam|prisao|presos|trafico|traficante|crime|criminal|assalto|roubo|furt(?:o|aram|ou)|homicidio|homicida|assassin(?:ato|ad[oa]|aram|ou|o)|matou|mataram|morto|morte violenta|estupr|esfaque|foragido|apreensao|apreende|apreendid|cocaina|maconha|crack|entorpecente|drogas?|armas? de fogo|mandado de prisao|ocorrencia policial|balead|tiroteio|executad|sequestro|latrocinio|corrupcao|gefron)\b/;
const POLICE_KEY = new Set(["policia", "seguranca", "seguranca-publica"]);
const PREFEITURA =
  /\bprefeitura (?:de|do|da) cruzeiro do sul|\bprefeitura municipal\b|\bsecretaria municipal\b/;

function fold(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

let total = 0;
for (const file of FILES) {
  const target = path.join(ROOT, "data", file);
  if (!fs.existsSync(target)) continue;
  const json = JSON.parse(fs.readFileSync(target, "utf8"));
  const buckets = [];
  if (Array.isArray(json)) buckets.push(json);
  if (Array.isArray(json.items)) buckets.push(json.items);
  if (Array.isArray(json.activeWindowItems)) buckets.push(json.activeWindowItems);

  let changed = 0;
  const sample = [];
  for (const bucket of buckets) {
    for (const item of bucket) {
      if (!item || typeof item !== "object") continue;
      if (!POLICE_KEY.has(fold(item.categoryKey || ""))) continue;
      const text = fold([item.title, item.summary, item.lede, item.description].filter(Boolean).join(" "));
      if (!text || CRIME.test(text) || !PREFEITURA.test(text)) continue;

      if (sample.length < 8) sample.push(`${item.categoryKey} -> prefeitura | ${String(item.title).slice(0, 64)}`);
      item.categoryKey = "prefeitura";
      item.category = "Prefeitura";
      item.eyebrow = "prefeitura";
      changed += 1;
    }
  }
  console.log(`[cat] ${file}: ${changed} correcao(oes)${DRY ? " (dry)" : ""}`);
  sample.forEach((s) => console.log("   " + s));
  total += changed;
  if (changed && !DRY) fs.writeFileSync(target, JSON.stringify(json), "utf8");
}
console.log(`[cat] total: ${total}`);
