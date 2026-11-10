"use strict";

// Ajustes vistos na captura de 390px.
//
// 1. O botao flutuante "Voltar para a home" cobria o texto do corpo. Ele
//    existe para dar saida rapida, mas nao pode flutuar sobre a leitura:
//    no celular vira uma barra no rodape do artigo, nao um elemento solto.
// 2. O "Cotidiano" do caminho (breadcrumb) estava cinza claro demais para
//    papel; precisa do mesmo cinza do resto dos metadados.
// 3. "Informar erro" ficava entre o compartilhar e a foto, cortando a
//    leitura antes dela comecar. Vai para depois do texto.

const fs = require("node:fs");
const path = require("node:path");

const root = "C:/Users/junio/Documents/Codex/_czs-work";

// ---------- CSS ----------
const cssPath = path.join(root, "czs-article-sheet.css");
let css = fs.readFileSync(cssPath, "utf8");

const marker = "/* === AJUSTES DE CELULAR === */";
if (css.includes(marker)) css = css.slice(0, css.indexOf(marker));

const block = `${marker}

/* O botao flutuante nao pode ficar por cima do texto no celular.
   Vira uma linha discreta no fim do artigo, sem sobrepor a leitura. */
@media (max-width: 900px) {
  html body.detail-body .detail-home-return-fab {
    position: static !important;
    display: inline-flex !important;
    margin: 0 0 1rem !important;
    border-radius: 2px !important;
    box-shadow: none !important;
    background: transparent !important;
    color: var(--art-ink-soft) !important;
    font-size: 0.82rem !important;
    font-weight: 600 !important;
    padding: 0.4rem 0 !important;
    border: 0 !important;
    border-bottom: 1px solid var(--art-rule-strong) !important;
  }
}

/* Breadcrumb: cinza legivel sobre papel, sem apagar a ultima migalha. */
html body.detail-body .article-breadcrumbs ol li,
html body.detail-body .article-breadcrumbs ol li span {
  color: var(--art-muted) !important;
}

html body.detail-body .article-breadcrumbs ol li:last-child span {
  color: var(--art-ink-soft) !important;
  font-weight: 600 !important;
}

/* "Informar erro": discreto e fora do caminho da leitura. */
html body.detail-body .detail-report-row {
  margin: 2rem auto 0 !important;
  padding-top: 1rem !important;
  border-top: 1px solid var(--art-rule) !important;
  justify-content: flex-start !important;
}

html body.detail-body .detail-report-button {
  min-height: 32px !important;
  padding: 0.3rem 0.7rem !important;
  border: 1px solid var(--art-rule-strong) !important;
  border-radius: 2px !important;
  background: transparent !important;
  color: var(--art-muted) !important;
  font-size: 0.78rem !important;
}

html body.detail-body .detail-report-hint {
  color: var(--art-muted) !important;
  font-size: 0.76rem !important;
}
`;

css += "\n" + block;
fs.writeFileSync(cssPath, css, "utf8");

// ---------- HTML: move o bloco de "informar erro" para depois do texto ----------
const htmlPath = path.join(root, "noticia.html");
let html = fs.readFileSync(htmlPath, "utf8");

const repStart = html.indexOf('<div class="detail-report-row">');
if (repStart >= 0) {
  let depth = 0;
  let i = repStart;
  let repEnd = -1;
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
        repEnd = close + "</div>".length;
        break;
      }
      i = close + 6;
    }
  }

  if (repEnd > repStart) {
    const lineStart = html.lastIndexOf("\n", repStart) + 1;
    const lineEnd = html.indexOf("\n", repEnd) + 1;
    const reportBlock = html.slice(lineStart, lineEnd).trim();

    html = html.slice(0, lineStart) + html.slice(lineEnd);

    // Reinsere depois do bloco de audio (que ja esta depois do texto).
    const audioIdx = html.indexOf('<section class="detail-audio-reader"');
    if (audioIdx >= 0) {
      const closeAudio = html.indexOf("</section>", audioIdx) + "</section>".length;
      const insertAt = html.indexOf("\n", closeAudio) + 1;
      html = html.slice(0, insertAt) + "          " + reportBlock + "\n" + html.slice(insertAt);
      console.log("bloco de informar erro movido para depois do texto");
    }
  }
}

fs.writeFileSync(htmlPath, html, "utf8");
console.log("css de celular aplicado");