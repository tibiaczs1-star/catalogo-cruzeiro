"use strict";

// Limpeza do cabecalho da materia.
//
// O leitor reclamou de repeticao. A pagina oferecia "Voltar para a home"
// quatro vezes (botao flutuante, faixa do topo, barra sobre o texto e
// rodape) e o rotulo da editoria aparecia duas vezes seguidas: eyebrow
// acima do titulo e de novo num chip sobre a foto. Ficam uma de cada.

const fs = require("node:fs");
const path = require("node:path");

const file = path.join("C:/Users/junio/Documents/Codex/_czs-work", "noticia.html");
let html = fs.readFileSync(file, "utf8");
const before = html.length;

// 1) Barra de "Voltar" logo abaixo da assinatura: duplica o botao flutuante
//    e a faixa do topo, e empurra o texto para baixo sem informar nada.
const toolbarBlocks = [
  /[ \t]*<div class="detail-article-toolbar"[\s\S]*?<\/div>\r?\n/,
  /[ \t]*<div class="detail-article-toolbar"[^>]*>[\s\S]*?<\/div>\s*\r?\n/
];
let removedToolbar = false;
for (const pattern of toolbarBlocks) {
  const next = html.replace(pattern, "");
  if (next !== html) {
    html = next;
    removedToolbar = true;
    break;
  }
}

// 2) Chip da editoria sobre a imagem: repete o eyebrow acima do titulo.
//    O chip continua sendo criado pelo JS para casos sem eyebrow, mas sai do
//    HTML base para nao aparecer antes do script rodar.
const chipPattern = /[ \t]*<span id="detail-category">Notícia<\/span>\r?\n/;
const removedChip = chipPattern.test(html);
html = html.replace(chipPattern, "");

fs.writeFileSync(file, html, "utf8");
console.log(`toolbar removido: ${removedToolbar} | chip removido: ${removedChip}`);
console.log(`bytes: ${before} -> ${html.length}`);