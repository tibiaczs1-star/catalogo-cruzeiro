"use strict";

// Uma coluna. De verdade.
//
// Medido em 1440px, havia tres larguras diferentes na mesma pagina:
//   titulo/chamada/compartilhar: 768px centrados (x=333)
//   grid da materia:            1120px (x=157)
//   coluna de texto:             640px (x=157)
// Nada alinhava com nada.
//
// Agora existe uma coluna unica de 40rem centrada. A coluna lateral deixa de
// ficar ao lado e vira uma faixa de tres blocos no fim do texto — o leitor
// le a materia de cima a baixo, sem desviar para a direita no meio da frase.

const fs = require("node:fs");
const path = require("node:path");

const file = path.join("C:/Users/junio/Documents/Codex/_czs-work", "czs-article-sheet.css");
let css = fs.readFileSync(file, "utf8");

const marker = "/* === UMA COLUNA CENTRADA === */";
if (css.includes(marker)) css = css.slice(0, css.indexOf(marker));

const block = `${marker}

/* Mesmo eixo para tudo: 40rem, centrado. */
html body.detail-body #detail-shell {
  display: block !important;
  width: min(40rem, 100% - 2.5rem) !important;
  max-width: 40rem !important;
  margin-left: auto !important;
  margin-right: auto !important;
}

html body.detail-body .article-breadcrumbs,
html body.detail-body #detail-eyebrow,
html body.detail-body #detail-title,
html body.detail-body .article-meta-grid,
html body.detail-body .article-share,
html body.detail-body #detail-lede,
html body.detail-body .detail-hero-thumb,
html body.detail-body .detail-grid,
html body.detail-body .detail-content,
html body.detail-body .detail-audio-reader,
html body.detail-body .detail-report-row,
html body.detail-body .article-faq,
html body.detail-body .article-related {
  width: 100% !important;
  max-width: 100% !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

/* O grid deixa de ser duas colunas. */
html body.detail-body .detail-grid {
  display: block !important;
  max-width: 100% !important;
}

html body.detail-body .detail-content {
  padding-left: 0 !important;
  padding-right: 0 !important;
}

/* A coluna lateral vira faixa de apoio no fim: tres blocos lado a lado no
   desktop, empilhados no celular. */
html body.detail-body .detail-aside {
  position: static !important;
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr)) !important;
  gap: 1.75rem 2rem !important;
  margin-top: 3rem !important;
  padding: 1.75rem 0 0 !important;
  border-left: 0 !important;
  border-top: 1px solid var(--art-rule-strong) !important;
}

html body.detail-body .detail-card {
  margin: 0 !important;
}

/* Espaco antes da primeira linha de texto. */
html body.detail-body #detail-lede {
  margin-top: 1.75rem !important;
  margin-bottom: 2rem !important;
}
`;

css += "\n" + block;
fs.writeFileSync(file, css, "utf8");
console.log("coluna unica de 40rem centrada");