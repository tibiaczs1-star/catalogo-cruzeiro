"use strict";

// Move o bloco de leitura em voz para depois do texto.
//
// Na ordem atual, o player de audio vinha logo depois da chamada, antes do
// primeiro paragrafo. O leitor chegava ao texto e encontrava um painel de
// audio no caminho. Audio e um recurso opcional: fica depois da materia.
//
// O JavaScript liga os botoes por id (#detail-audio-play etc.), entao mover
// o bloco no HTML nao quebra nada.

const fs = require("node:fs");
const path = require("node:path");

const file = path.join("C:/Users/junio/Documents/Codex/_czs-work", "noticia.html");
let html = fs.readFileSync(file, "utf8");

const audioStart = html.indexOf('<section class="detail-audio-reader"');
if (audioStart < 0) throw new Error("bloco de audio nao encontrado");

// Fim do bloco: o primeiro </section> apos o inicio (o bloco nao tem section interno).
const audioEnd = html.indexOf("</section>", audioStart) + "</section>".length;
if (audioEnd <= audioStart) throw new Error("fim do bloco de audio nao encontrado");

const audioBlock = html.slice(audioStart, audioEnd);

// Remove do lugar atual, incluindo a indentacao da linha.
const lineStart = html.lastIndexOf("\n", audioStart) + 1;
const lineEnd = html.indexOf("\n", audioEnd) + 1;
html = html.slice(0, lineStart) + html.slice(lineEnd);

// Insere depois do fechamento do .detail-grid.
const gridStart = html.indexOf('<div class="detail-grid">');
if (gridStart < 0) throw new Error("detail-grid nao encontrado");

// Conta aberturas/fechamentos de <div> ate fechar o grid.
let depth = 0;
let i = gridStart;
let gridEnd = -1;
while (i < html.length) {
  const open = html.indexOf("<div", i);
  const close = html.indexOf("</div>", i);
  if (close < 0) break;
  if (open >= 0 && open < close) {
    depth += 1;
    i = open + 4;
  } else {
    depth -= 1;
    if (depth === 0) {
      gridEnd = close + "</div>".length;
      break;
    }
    i = close + 6;
  }
}
if (gridEnd < 0) throw new Error("fim do detail-grid nao encontrado");

const insertAt = html.indexOf("\n", gridEnd) + 1;
const indent = "          ";
const block = `${insertAt > 0 ? "" : "\n"}${indent}${audioBlock.replace(/\n/g, "\n" + indent)}\n`;

html = html.slice(0, insertAt) + block + html.slice(insertAt);
fs.writeFileSync(file, html, "utf8");

console.log("audio movido para depois do texto");
console.log("posicao audio:", html.indexOf('class="detail-audio-reader"'));
console.log("posicao grid :", html.indexOf('class="detail-grid"'));