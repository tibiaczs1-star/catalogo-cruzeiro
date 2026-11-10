"use strict";

// Fecha o layout da materia: sem cartao, sem linha duplicada.
//
// 1. #detail-shell vinha com border-radius 30px e borda de 1px, o que fazia
//    a materia parecer um card flutuante sobre um fundo cinza. Jornal nao
//    tem cartao: o texto corre na largura da coluna.
// 2. #detail-meta escreve "10 de nov. de 2026 . Cotidiano" e a assinatura,
//    logo abaixo, repete a mesma data com hora. Fica a assinatura.
// 3. Sobras de fundo cinza: page-shell, detail-main e o proprio shell.

const fs = require("node:fs");
const path = require("node:path");

const root = "C:/Users/junio/Documents/Codex/_czs-work";

// ---------- 1) remove a linha duplicada do HTML ----------
const htmlPath = path.join(root, "noticia.html");
let html = fs.readFileSync(htmlPath, "utf8");
const metaLine = /[ \t]*<p class="detail-meta" id="detail-meta"><\/p>\r?\n/;
const removedMeta = metaLine.test(html);
html = html.replace(metaLine, "");
fs.writeFileSync(htmlPath, html, "utf8");

// ---------- 2) CSS final ----------
const cssPath = path.join(root, "czs-article-sheet.css");
let css = fs.readFileSync(cssPath, "utf8");

const marker = "/* === LAYOUT FINAL: SEM CARTAO === */";
if (css.includes(marker)) css = css.slice(0, css.indexOf(marker));

const block = `${marker}

/* A materia nao e um card. Sem raio, sem borda, sem sombra: a coluna de
   texto e a propria pagina. */
html body.detail-body #detail-shell,
html body.detail-body #detail-shell.detail-shell,
html body.detail-body #detail-shell.active,
html body.detail-body .detail-shell.article-premium-template {
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

/* Fundos intermediarios tambem sao papel. */
html body.detail-body .page-shell,
html body.detail-body .detail-main {
  background: var(--art-paper) !important;
  background-image: none !important;
}

html body.detail-body .detail-main {
  padding-top: 1.75rem;
  padding-bottom: 3rem;
}

/* A coluna de leitura fica centrada na pagina, nao dentro de uma caixa. */
html body.detail-body .detail-shell > * {
  width: 100%;
}

/* Chips e pilulas que sobraram: contorno fino, nada arredondado em excesso. */
html body.detail-body .article-share a,
html body.detail-body .article-share button {
  border-radius: 0 !important;
}

/* Legenda de video, quando existir, em texto simples. */
html body.detail-body .detail-video-caption {
  background: transparent !important;
  background-image: none !important;
  border: 0 !important;
  border-left: 2px solid var(--art-rule-strong) !important;
  border-radius: 0 !important;
  padding: 0.25rem 0 0.25rem 0.9rem !important;
  box-shadow: none !important;
}

html body.detail-body .detail-video-caption h2 {
  font-family: var(--czs-font-ui, system-ui, sans-serif);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--art-muted) !important;
}

html body.detail-body .detail-video-caption p {
  color: var(--art-ink-soft) !important;
  font-size: 0.95rem;
  line-height: 1.55;
}
`;

css += "\n" + block;
fs.writeFileSync(cssPath, css, "utf8");

console.log(`linha de data duplicada removida: ${removedMeta}`);
console.log("cartao e fundos neutralizados");