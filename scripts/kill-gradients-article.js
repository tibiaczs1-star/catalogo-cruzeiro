"use strict";

// Remove gradientes e azul-marinho da PAGINA DA MATERIA.
//
// O leitor foi direto: "pare de usar gradientes", "design limpo nada de
// gradiente", "sem fundos gradientes azul pra artigos", "nao somos crianca
// fazendo landing page".
//
// Estrategia: em vez de reescrever 57 regras espalhadas por tres folhas
// antigas, o final de czs-article-sheet.css desliga tudo que pinta gradiente
// dentro de body.detail-body. Cor chapada, tipografia e hierarquia fazem o
// trabalho; nada de brilho, halo ou vinheta.

const fs = require("node:fs");
const path = require("node:path");

const file = path.join("C:/Users/junio/Documents/Codex/_czs-work", "czs-article-sheet.css");
let css = fs.readFileSync(file, "utf8");

const marker = "/* === LIMPEZA FINAL: SEM GRADIENTE, SEM AZUL === */";
if (css.includes(marker)) {
  console.log("bloco de limpeza ja existe; regravando");
  css = css.slice(0, css.indexOf(marker));
}

const block = `${marker}

/* A pagina da materia nao tem gradiente, halo, brilho nem vinheta.
   Qualquer regra antiga que tente isso perde para estas. */

body.detail-body,
body.detail-body::before,
body.detail-body::after,
body.detail-body *::before,
body.detail-body *::after {
  background-image: none !important;
}

body.detail-body {
  background-color: var(--art-paper) !important;
  color: var(--art-ink) !important;
}

/* Superficies: cor chapada, uma borda de 1px quando precisa separar. */
body.detail-body .detail-hero-thumb,
body.detail-body .detail-content,
body.detail-body .detail-card,
body.detail-body .analysis-box,
body.detail-body .article-faq,
body.detail-body .article-related,
body.detail-body .detail-audio-reader,
body.detail-body .article-toc,
body.detail-body .detail-fact-tabs {
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
}

/* A foto em si mantem a imagem; so o fundo vazio vira cor chapada. */
body.detail-body .detail-hero-thumb {
  background-color: var(--art-paper-2) !important;
}

/* Cabecalho do site: cor solida, sem brilho. */
body.detail-body .site-header,
body.detail-body .site-header * {
  background-image: none !important;
}

body.detail-body .site-header {
  background-color: #101820 !important;
}

/* Botoes e chips: contorno, nao pilula luminosa. */
body.detail-body button,
body.detail-body .solid-button,
body.detail-body .outline-button,
body.detail-body .article-share a,
body.detail-body .article-share button {
  background-image: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
}

/* Nada de texto com brilho. */
body.detail-body * {
  text-shadow: none !important;
}
`;

css += "\n" + block;
fs.writeFileSync(file, css, "utf8");
console.log("bloco de limpeza anexado (", block.split("\n").length, "linhas )");