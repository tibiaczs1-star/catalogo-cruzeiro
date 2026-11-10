"use strict";

// Remove o bloco <section class="detail-fact-tabs"> de noticia.html.
// O JavaScript ja nao o alimenta; ficou no arquivo so como markup morto com
// 786px de altura quando algum estilo forcar display.

const fs = require("node:fs");
const path = require("node:path");

const file = path.join("C:/Users/junio/Documents/Codex/_czs-work", "noticia.html");
const lines = fs.readFileSync(file, "utf8").split("\n");

const startIdx = lines.findIndex((line, i) => {
  return (
    line.trim() === "<section" &&
    String(lines[i + 1] || "").includes("detail-fact-tabs")
  );
});

if (startIdx < 0) {
  console.log("bloco de abas nao encontrado; nada a remover");
  process.exit(0);
}

// Fecha no primeiro </section> no mesmo nivel (o bloco nao tem section interno).
let endIdx = -1;
let depth = 0;
for (let i = startIdx; i < lines.length; i += 1) {
  const line = lines[i];
  if (line.trim().startsWith("<section")) depth += 1;
  if (line.trim().startsWith("</section>")) {
    depth -= 1;
    if (depth === 0) {
      endIdx = i;
      break;
    }
  }
}

if (endIdx < 0) throw new Error("fim do bloco de abas nao encontrado");

const removed = endIdx - startIdx + 1;
lines.splice(startIdx, removed);
fs.writeFileSync(file, lines.join("\n"), "utf8");
console.log(`abas removidas: ${removed} linhas (${startIdx + 1} a ${endIdx + 1})`);