"use strict";

// Testa o detector de texto em ingles contra o acervo real.
//
// Motivo: o sanitizador trocava o resumo da materia pelo texto de formula
// "<Fonte> publicou uma atualizacao sobre..." sempre que achava que o texto
// estava em ingles. Isso aconteceu em 133 materias de fontes brasileiras
// (ac24horas, Agencia Acre, Batelao, Tribuna do Jurua...). Se o detector
// continua com falso positivo, o ciclo de noticias recria o problema.
//
// Uso: node scripts/test-language-detector.js

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(ROOT, "server.js"), "utf8");

// Extrai o trecho entre marcadores conhecidos: padroes de idioma, helpers e
// as tres funcoes que decidem se o texto "parece ingles".
function sliceFrom(marker, endMarker) {
  const start = source.indexOf(marker);
  const end = source.indexOf(endMarker);
  if (start < 0 || end < 0 || end < start) throw new Error(`ancora ausente: ${marker}`);
  return source.slice(start, end);
}

const constants = sliceFrom(
  "const ENGLISH_CARD_LEAK_PATTERN =",
  "const PUBLIC_NEWS_KNOWN_URL_TITLES"
);
const helpers = sliceFrom("function cleanShortText(", "function maskAuditActor(");
const detector = sliceFrom("function hasEnglishCardLeak(", "function filterPublicTopicFeedItems(");

const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(constants + "\n" + helpers + "\n" + detector, sandbox);

const { publicNewsTextLooksEnglish, hasPortugueseRuntimeSignal } = sandbox;

const runtime = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "runtime-news.json"), "utf8"));
const items = Array.isArray(runtime.items) ? runtime.items : [];

let falsePositives = 0;
const samples = [];

for (const item of items) {
  const fields = { title: item.title, summary: item.summary, lede: item.lede };
  for (const [field, value] of Object.entries(fields)) {
    if (!value || String(value).length < 40) continue;
    if (!publicNewsTextLooksEnglish(value)) continue;
    falsePositives += 1;
    if (samples.length < 12) {
      samples.push(`${item.sourceName} [${field}] ${String(value).slice(0, 90)}`);
    }
    break;
  }
}

console.log(`itens: ${items.length}`);
console.log(`campos marcados como ingles: ${falsePositives}`);
samples.forEach((line) => console.log("   - " + line));

// Amostra de controle: texto claramente ingles tem de continuar marcado.
const control =
  "The post appeared first on the website. Microsoft will let users try the new feature this week, according to the company.";
console.log(`\ncontrole em ingles marcado: ${publicNewsTextLooksEnglish(control)}`);
console.log(`controle em portugues marcado: ${publicNewsTextLooksEnglish(
  "A Prefeitura de Cruzeiro do Sul realizou nesta segunda-feira uma reunião com caminhoneiros rurais no Teatro José de Alencar."
)}`);
console.log(`texto curto sem sinal: ${hasPortugueseRuntimeSignal("Obra na avenida Copacabana avança")}`);