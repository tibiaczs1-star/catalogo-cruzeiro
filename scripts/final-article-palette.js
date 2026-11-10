"use strict";

// Fecha a paleta da materia.
//
// noticia-premium.css define --article-text: #f8fbff e --article-muted:
// #b9c9d9 (cor de texto sobre fundo escuro) e aplica #fff !important em
// #detail-title. Com o fundo agora claro, o titulo ficou branco no branco.
//
// Aqui as variaveis sao redefinidas com os valores de papel, e os poucos
// pontos que ainda tem cor fixa clara recebem a cor escura com !important.
// Fica no fim de czs-article-sheet.css, que carrega por ultimo.

const fs = require("node:fs");
const path = require("node:path");

const file = path.join("C:/Users/junio/Documents/Codex/_czs-work", "czs-article-sheet.css");
let css = fs.readFileSync(file, "utf8");

const marker = "/* === PALETA FINAL DA MATERIA === */";
if (css.includes(marker)) css = css.slice(0, css.indexOf(marker));

const block = `${marker}

/* As variaveis antigas eram de texto claro sobre fundo escuro. Trocadas
   na raiz, todo o resto herda a cor certa sem brigar regra por regra. */
html body.detail-body {
  --article-text: #1a1a1a;
  --article-muted: #595959;
  --article-gold: #c70000;
  --article-blue: #c70000;
  --article-line: #dcd8ce;
  --article-bg: #faf8f3;
  --article-bg-soft: #f3ede2;
  --article-card: #ffffff;
}

/* Titulo e chamada: texto escuro sobre papel, sem excecao. */
html body.detail-body #detail-title,
html body.detail-body.article-premium-ready #detail-title,
html body.detail-body .detail-shell h1 {
  color: var(--art-ink) !important;
}

html body.detail-body #detail-lede,
html body.detail-body.article-premium-ready #detail-lede {
  color: var(--art-ink-soft) !important;
}

html body.detail-body #detail-meta,
html body.detail-body .article-breadcrumbs,
html body.detail-body .article-breadcrumbs a,
html body.detail-body .article-meta-grid,
html body.detail-body .article-meta-grid span,
html body.detail-body .article-meta-grid strong,
html body.detail-body .article-meta-grid time,
html body.detail-body .article-reading-time {
  color: var(--art-muted) !important;
}

html body.detail-body .article-meta-grid strong {
  color: var(--art-ink-soft) !important;
}

/* Corpo: escuro, sem depender de variavel de terceiros. */
html body.detail-body #detail-content p,
html body.detail-body #detail-content li {
  color: var(--art-ink) !important;
}

/* Cabecalho: texto escuro sobre papel. */
html body.detail-body .site-header .brand,
html body.detail-body .site-header .brand strong,
html body.detail-body .site-header .site-title {
  color: var(--art-ink) !important;
}

html body.detail-body .site-header .brand-kicker,
html body.detail-body .site-header .top-strip,
html body.detail-body .site-header .top-strip p {
  color: var(--art-muted) !important;
}

/* O link do topo era dourado sobre azul escuro. Agora o topo e papel. */
html body.detail-body .site-header .top-strip a {
  color: var(--art-accent) !important;
}

/* Chamada: sem negrito pesado, e texto de leitura. */
html body.detail-body #detail-lede {
  font-weight: 400 !important;
}
`;

css += "\n" + block;
fs.writeFileSync(file, css, "utf8");
console.log("paleta final aplicada");