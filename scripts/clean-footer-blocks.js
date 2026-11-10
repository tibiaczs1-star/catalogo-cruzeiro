"use strict";

// Limpeza final do rodape da materia.
//
// 1. `.footer-photo` e uma div de 425x320px que nunca recebe conteudo em
//    noticia.html — so desenha um retangulo escuro no canto. Sai.
// 2. A faixa do topo tem um "Voltar para a home" e o cabecalho logo abaixo
//    tem o logo, que tambem volta. No celular os dois aparecem juntos, na
//    mesma dobra. Fica o logo; a faixa inteira sai.

const fs = require("node:fs");
const path = require("node:path");

const root = "C:/Users/junio/Documents/Codex/_czs-work";

// ---------- 1) remove a div vazia ----------
const htmlPath = path.join(root, "noticia.html");
let html = fs.readFileSync(htmlPath, "utf8");

const photoPattern = /[ \t]*<div class="footer-photo"[^>]*><\/div>\r?\n/;
const removedPhoto = photoPattern.test(html);
html = html.replace(photoPattern, "");

// ---------- 2) remove a faixa do topo ----------
const stripStart = html.indexOf('<div class="top-strip">');
let removedStrip = false;
if (stripStart >= 0) {
  let depth = 0;
  let i = stripStart;
  let stripEnd = -1;
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
        stripEnd = close + "</div>".length;
        break;
      }
      i = close + 6;
    }
  }
  if (stripEnd > stripStart) {
    const lineStart = html.lastIndexOf("\n", stripStart) + 1;
    const lineEnd = html.indexOf("\n", stripEnd) + 1;
    html = html.slice(0, lineStart) + html.slice(lineEnd);
    removedStrip = true;
  }
}

fs.writeFileSync(htmlPath, html, "utf8");

console.log(`footer-photo removida: ${removedPhoto} | faixa do topo removida: ${removedStrip}`);

// ---------- 3) garante que o rodape nao deixe buraco no grid ----------
const cssPath = path.join(root, "czs-article-sheet.css");
let css = fs.readFileSync(cssPath, "utf8");

const marker = "/* === RODAPE SEM COLUNA VAZIA === */";
if (!css.includes(marker)) {
  css += `

${marker}
/* O rodape era uma grade de tres colunas; sem a foto, sobram duas.
   Sem isto a primeira coluna continua reservada e o texto fica estreito. */
html body.detail-body .site-footer.detail-footer,
html body.detail-body .site-footer.rich-footer {
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) !important;
  gap: clamp(1.5rem, 3vw, 3rem) !important;
  padding: clamp(1.75rem, 3vw, 2.75rem) 0 !important;
}

@media (max-width: 760px) {
  html body.detail-body .site-footer.detail-footer,
  html body.detail-body .site-footer.rich-footer {
    grid-template-columns: 1fr !important;
    gap: 1.5rem !important;
  }
}
`;
  fs.writeFileSync(cssPath, css, "utf8");
}

console.log("rodape com duas colunas");