"use strict";

// Fecha a limpeza visual da pagina da materia.
//
// O que ainda estava errado no print:
// 1. #detail-shell tinha um radial-gradient escuro: a manchete ficava sobre
//    um bloco azul dentro de uma pagina clara.
// 2. Data e tempo de leitura vinham como pilulas brancas translucidas.
// 3. O botao flutuante "Voltar para a home" cobria a linha da data no
//    desktop. Ele existe para o celular; no desktop o topo ja tem o link.
// 4. O cabecalho do site era um bloco azul-escuro alto com logo brilhando,
//    que fazia a pagina parecer jogo, nao jornal.

const fs = require("node:fs");
const path = require("node:path");

const file = path.join("C:/Users/junio/Documents/Codex/_czs-work", "czs-article-sheet.css");
let css = fs.readFileSync(file, "utf8");

const marker = "/* === SUPERFICIES E CABECALHO DA MATERIA === */";
if (css.includes(marker)) css = css.slice(0, css.indexOf(marker));

const block = `${marker}

/* Nada de bloco escuro atras da manchete. */
html body.detail-body #detail-shell,
html body.detail-body #detail-shell.detail-shell,
html body.detail-body .article-premium-template {
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
}

/* Data e tempo de leitura: texto simples, sem pilula. */
body.detail-body #article-byline time,
body.detail-body #article-byline .article-reading-time,
body.detail-body .article-meta-grid time,
body.detail-body .article-meta-grid .article-reading-time {
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: none !important;
  box-shadow: none !important;
  color: var(--art-muted) !important;
  font-size: 0.85rem !important;
}

/* Linha de metadados: uma vez a editoria, alinhada com o titulo. */
body.detail-body #detail-meta {
  max-width: calc(var(--art-measure) + 8rem);
  margin: 0 auto 0.85rem;
  color: var(--art-muted) !important;
  font-size: 0.82rem;
  letter-spacing: 0.01em;
}

/* O botao flutuante e do celular. No desktop ele cobria a data. */
@media (min-width: 901px) {
  body.detail-body .detail-home-return-fab {
    display: none !important;
  }
}

/* Cabecalho do site na materia: papel, tipografia escura, sem brilho. */
body.detail-body .site-header {
  background-color: var(--art-paper) !important;
  background-image: none !important;
  border-bottom: 1px solid var(--art-rule) !important;
  box-shadow: none !important;
}

body.detail-body .site-header .top-strip {
  background: transparent !important;
  border-bottom: 1px solid var(--art-rule) !important;
  color: var(--art-muted) !important;
}

body.detail-body .site-header .top-strip p,
body.detail-body .site-header .top-strip a {
  color: var(--art-muted) !important;
  font-size: 0.78rem;
}

body.detail-body .site-header .top-strip a:hover {
  color: var(--art-accent) !important;
}

body.detail-body .site-header .masthead {
  background: transparent !important;
  padding: 0.5rem 0 0.75rem;
}

body.detail-body .site-header .brand {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  filter: none !important;
  box-shadow: none !important;
}

body.detail-body .site-header .brand img {
  height: 44px;
  width: auto;
  border-radius: 0;
  box-shadow: none !important;
}

body.detail-body .site-header .brand-kicker {
  color: var(--art-muted) !important;
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

body.detail-body .site-header .brand strong {
  color: var(--art-ink) !important;
  font-family: Fraunces, Georgia, serif;
  font-size: 1.05rem;
  font-weight: 700;
}
`;

css += "\n" + block;
fs.writeFileSync(file, css, "utf8");
console.log("superficies e cabecalho da materia ajustados");