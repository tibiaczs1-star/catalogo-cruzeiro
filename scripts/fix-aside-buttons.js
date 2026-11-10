"use strict";

// 1. Botoes da coluna lateral com contraste real.
//    "Abrir fonte", "Ver fonte" e "Anuncie aqui" apareciam quase invisiveis:
//    herdavam borda azul translucida (alfa 0.18) e texto de um estilo antigo
//    pensado para fundo escuro.
// 2. Indentacao do bloco de audio movido, que ficou com 22 espacos.

const fs = require("node:fs");
const path = require("node:path");

const root = "C:/Users/junio/Documents/Codex/_czs-work";

// ---------- CSS ----------
const cssPath = path.join(root, "czs-article-sheet.css");
let css = fs.readFileSync(cssPath, "utf8");

const marker = "/* === BOTOES DA COLUNA LATERAL === */";
if (css.includes(marker)) css = css.slice(0, css.indexOf(marker));

const block = `${marker}

/* Botoes da coluna: contorno escuro sobre papel, alvo de toque confortavel. */
html body.detail-body .detail-aside .solid-button,
html body.detail-body .detail-aside .outline-button,
html body.detail-body .detail-card .solid-button,
html body.detail-body .detail-card .outline-button {
  display: inline-flex !important;
  align-items: center !important;
  min-height: 36px !important;
  margin-top: 0.7rem !important;
  padding: 0.4rem 0.8rem !important;
  border: 1px solid var(--art-rule-strong) !important;
  border-radius: 2px !important;
  background: transparent !important;
  background-image: none !important;
  color: var(--art-ink) !important;
  font-size: 0.82rem !important;
  font-weight: 600 !important;
  text-decoration: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
}

html body.detail-body .detail-aside .solid-button:hover,
html body.detail-body .detail-aside .outline-button:hover,
html body.detail-body .detail-card .solid-button:hover,
html body.detail-body .detail-card .outline-button:hover {
  border-color: var(--art-accent) !important;
  color: var(--art-accent) !important;
}

/* Player de audio depois do texto: botoes no mesmo padrao. */
html body.detail-body .detail-audio-actions button {
  min-height: 36px !important;
  padding: 0.4rem 0.9rem !important;
  border: 1px solid var(--art-rule-strong) !important;
  border-radius: 2px !important;
  background: transparent !important;
  color: var(--art-ink) !important;
  font-size: 0.84rem !important;
  font-weight: 600 !important;
  cursor: pointer !important;
}

html body.detail-body .detail-audio-actions button:hover {
  border-color: var(--art-accent) !important;
  color: var(--art-accent) !important;
}
`;

css += "\n" + block;
fs.writeFileSync(cssPath, css, "utf8");

// ---------- HTML: indentacao do bloco de audio ----------
const htmlPath = path.join(root, "noticia.html");
const lines = fs.readFileSync(htmlPath, "utf8").split("\n");

const audioIdx = lines.findIndex((l) => l.includes('<section class="detail-audio-reader"'));
if (audioIdx >= 0) {
  let end = audioIdx;
  for (let i = audioIdx; i < lines.length; i += 1) {
    if (lines[i].trim() === "</section>") {
      end = i;
      break;
    }
  }
  const target = "          ";
  for (let i = audioIdx; i <= end; i += 1) {
    const content = lines[i].trimStart();
    // O bloco vinha com 10 espacos extras; normaliza mantendo a hierarquia.
    const extra = Math.max(0, lines[i].length - lines[i].trimStart().length - target.length);
    lines[i] = target + " ".repeat(Math.max(0, extra)) + content;
  }
  fs.writeFileSync(htmlPath, lines.join("\n"), "utf8");
  console.log(`indentacao normalizada nas linhas ${audioIdx + 1}-${end + 1}`);
}

console.log("botoes da coluna com contraste");