"use strict";

// Alinha a materia numa unica coluna de leitura.
//
// Medido em 1440px: manchete com 1180px de largura, corpo com 743px, e as
// margens esquerdas diferindo em 20px. Jornal tem uma coluna: titulo,
// chamada, assinatura, compartilhar e texto comecam no mesmo ponto e
// terminam no mesmo ponto.
//
// Tambem remove o arco decorativo que sobrou no canto direito (a forma
// cinza clara atras do texto), heranca do desenho de card.

const fs = require("node:fs");
const path = require("node:path");

const file = path.join("C:/Users/junio/Documents/Codex/_czs-work", "czs-article-sheet.css");
let css = fs.readFileSync(file, "utf8");

const marker = "/* === COLUNA UNICA === */";
if (css.includes(marker)) css = css.slice(0, css.indexOf(marker));

// Uma coluna: 72ch de texto + a largura da coluna lateral quando existir.
const measure = "calc(var(--art-measure) + 8rem)";

const block = `${marker}

/* Todo o bloco de leitura comeca e termina no mesmo ponto. */
html body.detail-body .article-breadcrumbs,
html body.detail-body #detail-eyebrow,
html body.detail-body #detail-title,
html body.detail-body .article-meta-grid,
html body.detail-body .article-share,
html body.detail-body #detail-lede,
html body.detail-body .detail-hero-thumb {
  max-width: ${measure} !important;
  margin-left: auto !important;
  margin-right: auto !important;
}

/* O titulo acompanha a largura da coluna, nao a da pagina. */
html body.detail-body #detail-title {
  width: 100% !important;
}

/* O grid (texto + coluna lateral) fica centrado e a coluna de texto
   alinhada com o titulo. */
html body.detail-body .detail-grid {
  max-width: calc(${measure} + 22rem) !important;
  margin-left: auto !important;
  margin-right: auto !important;
}

html body.detail-body .detail-content {
  max-width: var(--art-measure) !important;
  margin-left: 0 !important;
}

/* O arco decorativo do canto direito sai. */
html body.detail-body .detail-shell::before,
html body.detail-body .detail-shell::after,
html body.detail-body .article-premium-template::before,
html body.detail-body .article-premium-template::after {
  content: none !important;
  display: none !important;
  background: none !important;
}
`;

css += "\n" + block;
fs.writeFileSync(file, css, "utf8");
console.log("coluna unica aplicada | arco removido");