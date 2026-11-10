"use strict";

// Ajustes finais de leitura da materia.
//
// 1. Foto com canto arredondado de 16px herdado do cartao antigo.
// 2. A chamada (lede) sai do tamanho de corpo e vira abertura de materia.
// 3. A colonha/capitular: a regra antiga injetava uma aspa gigante antes do
//    primeiro paragrafo e ela colidia com a letra capitular.
// 4. A coluna lateral com regua de 2px que comecava no meio do texto.

const fs = require("node:fs");
const path = require("node:path");

const file = path.join("C:/Users/junio/Documents/Codex/_czs-work", "czs-article-sheet.css");
let css = fs.readFileSync(file, "utf8");

const marker = "/* === ACABAMENTO DE LEITURA === */";
if (css.includes(marker)) css = css.slice(0, css.indexOf(marker));

const block = `${marker}

/* Foto: canto reto. O raio de 16px vinha do tempo em que a materia era card. */
html body.detail-body .detail-hero-thumb,
html body.detail-body .detail-hero-thumb img,
html body.detail-body .detail-hero-thumb video {
  border-radius: 0 !important;
}

/* Chamada: abertura de materia, nao paragrafo. Aumenta o tamanho e abre o
   espaco antes do corpo. */
html body.detail-body #detail-lede {
  margin: 1.75rem auto 2.25rem !important;
  padding-left: 1rem !important;
  border-left: 3px solid var(--art-accent) !important;
  font-family: Fraunces, Georgia, serif !important;
  font-size: clamp(1.15rem, 1rem + 0.5vw, 1.32rem) !important;
  font-weight: 400 !important;
  line-height: 1.5 !important;
  color: var(--art-ink-soft) !important;
}

/* Primeiro paragrafo: capitular limpa, sem aspa decorativa colidindo.
   A marca citada vem de um ::before antigo em noticia-premium.css. */
html body.detail-body .detail-content::before,
html body.detail-body .detail-content > p:first-of-type::before,
html body.detail-body #detail-content::before,
html body.detail-body #detail-content > p:first-of-type::before {
  content: none !important;
  display: none !important;
}

html body.detail-body .detail-content > p:first-of-type::first-letter,
html body.detail-body #detail-content > p:first-of-type::first-letter {
  float: left !important;
  margin: 0.06em 0.09em 0 0 !important;
  padding: 0 !important;
  font-family: Fraunces, Georgia, serif !important;
  font-size: 3.2em !important;
  line-height: 0.82 !important;
  font-weight: 700 !important;
  color: var(--art-accent) !important;
  background: none !important;
  border: 0 !important;
  box-shadow: none !important;
}

/* Coluna lateral: a regua comeca alinhada ao corpo, nao no meio da pagina. */
html body.detail-body .detail-aside {
  padding-top: 0 !important;
  margin-top: 0 !important;
}

html body.detail-body .detail-card > span {
  color: var(--art-accent) !important;
  font-size: 0.68rem !important;
  letter-spacing: 0.12em !important;
}

/* Leitura em voz: depois do texto, discreta. */
html body.detail-body .detail-audio-reader {
  margin-top: 2.5rem !important;
}

html body.detail-body .detail-audio-reader .eyebrow {
  color: var(--art-accent) !important;
  background: none !important;
  padding: 0 !important;
}

/* O texto narrado nao precisa aparecer inteiro na tela: ele e o audio. */
html body.detail-body #detail-audio-text {
  display: -webkit-box !important;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--art-muted) !important;
  font-size: 0.84rem !important;
  line-height: 1.45 !important;
}
`;

css += "\n" + block;
fs.writeFileSync(file, css, "utf8");
console.log("acabamento de leitura aplicado");