"use strict";

// Reconstroi chamada e corpo de todas as materias a partir do resumo que ja
// esta gravado, usando o divisor de frases corrigido.
//
// Por que: a primeira rodada de reparo montou os corpos com um divisor que
// tratava todo ponto como fim de frase. O resultado ficou gravado
// ("1. 171 quilometros", "US$ 399. 4 mil"). Como o servidor usa o corpo
// gravado, e nao o reconstruido, o texto ruim continuava na tela.
// Este script so reescreve lede e body; o summary (texto real da fonte)
// fica exatamente como esta.
//
// Uso: node scripts/rebuild-article-bodies.js [--dry]

const fs = require("node:fs");
const path = require("node:path");
const { splitSentences } = require("./lib/split-sentences.js");

const ROOT = path.resolve(__dirname, "..");
const TARGET = path.join(ROOT, "data", "runtime-news.json");
const DRY = process.argv.includes("--dry");

// Mesma assinatura de colapso de espaco usada no servidor.
const collapse = (value) => String(value || "").replace(/[\s ]+/g, " ").trim();

// Divide o texto real em chamada curta e corpo.
function splitArticleText(fullText = "") {
  const text = collapse(fullText);
  if (!text) return { kicker: "", body: [] };

  const sentences = splitSentences(text);
  if (!sentences.length) return { kicker: text, body: [] };

  let consumed = 1;
  if (sentences[0].length < 60 && sentences.length > 1) consumed = 2;

  const kicker = sentences.slice(0, consumed).join(" ");
  const rest = sentences.slice(consumed);
  if (!rest.length) return { kicker, body: [] };

  const body = [];
  for (let i = 0; i < rest.length; i += 2) {
    const paragraph = collapse(rest.slice(i, i + 2).join(" "));
    if (paragraph.length >= 40) body.push(paragraph);
  }

  return { kicker, body };
}

const runtime = JSON.parse(fs.readFileSync(TARGET, "utf8"));
const items = Array.isArray(runtime.items) ? runtime.items : [];

let changed = 0;
const samples = [];

for (const item of items) {
  if (!item || typeof item !== "object") continue;
  const source = collapse(item.summary || "");
  if (!source) continue;

  const { kicker, body } = splitArticleText(source);
  if (!kicker) continue;

  const nextLede = kicker;
  // Se o corpo comecaria repetindo a chamada, tira o paragrafo repetido: a
  // pagina descarta o corpo igual ao lede e sobraria texto nenhum abaixo do
  // titulo. Sem sobra, o corpo fica vazio e o leitor ve a chamada uma vez so.
  const deduped = body.filter((paragraph) => collapse(paragraph) !== collapse(nextLede));
  const nextBody = deduped;
  const bodySame =
    JSON.stringify(item.body || []) === JSON.stringify(nextBody);

  if (item.lede === nextLede && bodySame) continue;

  if (samples.length < 5) {
    samples.push({
      title: String(item.title || "").slice(0, 56),
      lede: nextLede.slice(0, 100),
      bodyCount: nextBody.length
    });
  }

  item.lede = nextLede;
  item.body = nextBody;
  changed += 1;
}

console.log(`[rebuild] ${changed} de ${items.length} materias reescritas${DRY ? " (dry)" : ""}`);
samples.forEach((sample) => {
  console.log(`  - ${sample.title}`);
  console.log(`      ${sample.lede}  [${sample.bodyCount} paragrafo(s)]`);
});

// Relatorio: sobrou algum numero partido ao meio?
const broken = items
  .flatMap((item) => (Array.isArray(item.body) ? item.body : []))
  .filter((paragraph) => /\d\.\s+\d/.test(String(paragraph)) || /US\$\s*\d+\.\s/.test(String(paragraph)));
console.log(`[rebuild] paragrafos com numero partido: ${broken.length}`);
broken.slice(0, 5).forEach((paragraph) => console.log("   " + String(paragraph).slice(0, 110)));

if (DRY) {
  console.log("[rebuild] modo seco: nada gravado");
} else if (changed) {
  fs.writeFileSync(TARGET, JSON.stringify(runtime), "utf8");
  console.log("[rebuild] runtime-news.json gravado");
}