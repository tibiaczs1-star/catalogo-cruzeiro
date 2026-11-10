"use strict";

// Limpa corpos de materia que ainda carregam o texto de formula gerado pela
// antiga buildFallbackEditorialBody. O servidor ja filtra na leitura; este
// script limpa tambem o acervo em disco para o payload nao carregar lixo.
//
// Uso: node scripts/clean-slop-bodies.js [--dry]

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DRY = process.argv.includes("--dry");
const FILES = ["runtime-news.json", "news-archive.json"];

function fingerprint(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isSlop(paragraph) {
  const key = fingerprint(paragraph);
  if (!key) return false;
  return (
    (key.includes("registrou em") && key.includes("a leitura do czs parte desse fato confirmado")) ||
    key.startsWith("impacto pratico") ||
    key.startsWith("o que seguir") ||
    (key.includes("publicou em") && key.includes("a base desta noticia")) ||
    (key.includes("redacao automatica acompanha") && key.includes("novas atualizacoes")) ||
    (key.includes("e o eixo mais concreto da publicacao consultada") && key.includes("impacto imediato")) ||
    (key.includes("material original ainda nao trouxe desenvolvimento suficiente") && key.includes("fonte completa")) ||
    (key.includes("ponto principal da atualizacao captada automaticamente") && key.includes("link da fonte original"))
  );
}

function cleanItem(item) {
  if (!item || typeof item !== "object") return false;
  const body = Array.isArray(item.body) ? item.body : item.body ? [item.body] : [];
  const kept = body.filter((line) => String(line || "").trim() && !isSlop(line));
  if (kept.length === body.length) return false;

  // Sem corpo real, devolve o resumo da fonte (uma vez, sem repetir o lede).
  const summary = String(item.summary || item.description || "").trim();
  const lede = String(item.lede || "").trim();
  const fallback = summary && fingerprint(summary) !== fingerprint(lede) ? [summary] : [];
  item.body = kept.length ? kept : fallback;
  return true;
}

let totalChanged = 0;
for (const file of FILES) {
  const target = path.join(ROOT, "data", file);
  if (!fs.existsSync(target)) {
    console.log(`[slop] ${file}: ausente, pulando`);
    continue;
  }
  const json = JSON.parse(fs.readFileSync(target, "utf8"));
  const buckets = [];
  if (Array.isArray(json.items)) buckets.push(json.items);
  if (Array.isArray(json.activeWindowItems)) buckets.push(json.activeWindowItems);
  if (Array.isArray(json)) buckets.push(json);

  let changed = 0;
  for (const bucket of buckets) {
    for (const item of bucket) if (cleanItem(item)) changed += 1;
  }

  // items e activeWindowItems podem compartilhar objetos depois do parse?
  // Nao compartilham: sao copias distintas no JSON. Por isso o total pode
  // contar o mesmo slug duas vezes; o numero serve so de relatorio.
  console.log(`[slop] ${file}: ${changed} registro(s) limpo(s)${DRY ? " (dry)" : ""}`);
  totalChanged += changed;
  if (changed && !DRY) fs.writeFileSync(target, JSON.stringify(json), "utf8");
}

console.log(`[slop] total: ${totalChanged}${DRY ? " (dry run, nada gravado)" : ""}`);
