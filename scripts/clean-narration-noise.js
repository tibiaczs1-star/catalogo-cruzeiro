"use strict";

// Limpa o texto que vira voz (RAIane) das materias.
//
// O RSS do WordPress entrega, no fim do resumo, lixo de feed:
//   "O post ... apareceu primeiro em Acre Agora - acreagora.com."
//   "]]>"
//   "[...]" quando o resumo foi cortado
// Isso ia direto para a narracao. O leitor ouvia o dominio da fonte e
// marcadores de XML no meio da noticia.

const fs = require("node:fs");
const path = require("node:path");

const root = "C:/Users/junio/Documents/Codex/_czs-work";

// ---------- 1) Limpador no server.js ----------
const serverPath = path.join(root, "server.js");
let server = fs.readFileSync(serverPath, "utf8");

const anchor = "function buildRaylNarrationTextForArticle(item = {}) {";
if (!server.includes(anchor)) throw new Error("ancora buildRaylNarrationTextForArticle ausente");

const cleaner = [
  "// CZS 2026-11-10 - tira lixo de feed do texto falado.",
  "// Fontes WordPress anexam ao resumo: \"O post ... apareceu primeiro em",
  "// <site> - <dominio>. \" e o fecho CDATA \"]]>\". No corpo da pagina isso",
  "// aparece feio; na voz, o leitor ouve o dominio. Tambem remove o marcador",
  "// de corte \"[...]\" que o agregador deixa quando encurta o resumo.",
  "function stripNarrationFeedNoise(value = \"\") {",
  "  return String(value || \"\")",
  "    .replace(/\\]\\]>/g, \" \")",
  "    .replace(/<!\\[CDATA\\[/gi, \" \")",
  "    .replace(/\\s*O post .*? apareceu primeiro em [^.]{0,160}\\.?/gi, \" \")",
  "    .replace(/\\s*The post .*? appeared first on [^.]{0,160}\\.?/gi, \" \")",
  "    .replace(/\\s*\\[\\.\\.\\.\\]\\s*/g, \" \")",
  "    .replace(/\\s*\\[&hellip;\\]\\s*/gi, \" \")",
  "    .replace(/\\s*Fonte:\\s*[A-Za-z0-9 .\\/-]{0,60}\\.?\\s*$/i, \" \")",
  "    .replace(/\\s+/g, \" \")",
  "    .trim();",
  "}",
  "",
  ""
].join("\n");

server = server.replace(anchor, cleaner + anchor);

// Aplica o limpador no resultado final da narracao.
const finalReturn = [
  "  return prepareRaylNarrationText(",
  "    ["
].join("\n");
if (!server.includes(finalReturn)) throw new Error("ancora do return da narracao ausente");

// A narracao e montada em cadeia; envolve o bloco inteiro.
const narStart = server.indexOf(anchor);
const narEnd = server.indexOf("\n}\n", narStart);
if (narStart < 0 || narEnd < 0) throw new Error("bloco da narracao nao delimitado");

let narrationBlock = server.slice(narStart, narEnd + 3);
narrationBlock = narrationBlock.replace(
  /return prepareRaylNarrationText\(\s*\[([\s\S]*?)\]\s*\.filter\(Boolean\)\s*\.join\(" "\),\s*950\s*\);/,
  'return stripNarrationFeedNoise(prepareRaylNarrationText([$1].filter(Boolean).join(" "), 950));'
);

if (narrationBlock === server.slice(narStart, narEnd + 3)) {
  throw new Error("nao consegui envolver o return da narracao");
}

server = server.slice(0, narStart) + narrationBlock + server.slice(narEnd + 3);
fs.writeFileSync(serverPath, server, "utf8");

// ---------- 2) Limpa tambem o que ja esta gravado no acervo ----------
const dataPath = path.join(root, "data", "runtime-news.json");
const runtime = JSON.parse(fs.readFileSync(dataPath, "utf8"));
let cleaned = 0;

const noisePatterns = [
  /\s*\]\]>\s*/g,
  /\s*<!\[CDATA\[\s*/gi,
  /\s*O post[\s\S]{0,120}?apareceu primeiro em[\s\S]{0,160}?\.?/gi,
  /\s*The post[\s\S]{0,120}?appeared first on[\s\S]{0,160}?\.?/gi,
  /\s*\[\.\.\.\]\s*/g,
  /\s*/g
];

for (const item of runtime.items || []) {
  for (const field of ["audioNarrationText", "audioNarrationTranscript"]) {
    const before = String(item[field] || "");
    if (!before) continue;
    let next = before
      .replace(/\]\]>/g, " ")
      .replace(/<!\[CDATA\[/gi, " ")
      .replace(/\s*O post[\s\S]{0,120}?apareceu primeiro em[\s\S]{0,160}?\.?/gi, " ")
      .replace(/\s*The post[\s\S]{0,120}?appeared first on[\s\S]{0,160}?\.?/gi, " ")
      .replace(/\s*\[\.\.\.\]\s*/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (next !== before) {
      item[field] = next;
      cleaned += 1;
    }
  }
}

if (cleaned) fs.writeFileSync(dataPath, JSON.stringify(runtime), "utf8");

console.log(`narracao: limpador instalado | registros do acervo limpos: ${cleaned}`);