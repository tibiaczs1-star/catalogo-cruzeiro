"use strict";

// 1. Data sem hora inventada (arquivo usa CRLF; casar bloco com \n falha).
// 2. O botao flutuante, agora estatico, virou um terceiro "Voltar para a
//    home" no topo do celular: a faixa do topo ja tem o link. Escondido.

const fs = require("node:fs");
const path = require("node:path");

const root = "C:/Users/junio/Documents/Codex/_czs-work";

// ---------- 1) formatDate ----------
const dsPath = path.join(root, "czs-design-system.js");
const dsRaw = fs.readFileSync(dsPath, "utf8");
const eol = dsRaw.includes("\r\n") ? "\r\n" : "\n";
const dsLines = dsRaw.split(/\r?\n/);

const idx = dsLines.findIndex((l) => l.includes("timeStyle: \"short\""));
if (idx < 0) throw new Error("linha do timeStyle nao encontrada");

// Insere o comentario acima da funcao e troca a linha do formatador.
dsLines[idx] = "    return new Intl.DateTimeFormat(\"pt-BR\", { dateStyle: \"medium\" }).format(date);";

let fnStart = idx;
while (fnStart > 0 && !dsLines[fnStart].includes("const formatDate")) fnStart -= 1;

if (!dsLines[fnStart - 1] || !dsLines[fnStart - 1].includes("2026-11-10")) {
  dsLines.splice(fnStart, 0, [
    "  // CZS 2026-11-10 - data sem hora inventada.",
    "  // O RSS garante o dia da publicacao, nao o horario. A hora que aparecia",
    '  // ("00:15") era o instante em que o agregador rodou, nao a publicacao.',
    "  // Mostrar isso da ao leitor uma precisao que a fonte nao tem."
  ].join(eol));
}
fs.writeFileSync(dsPath, dsLines.join(eol), "utf8");

// ---------- 2) esconde o FAB no celular ----------
const cssPath = path.join(root, "czs-article-sheet.css");
let css = fs.readFileSync(cssPath, "utf8");

const marker = "/* === FAB FORA DO CELULAR === */";
if (!css.includes(marker)) {
  css += `

${marker}
/* A faixa do topo ja leva para a home. O botao flutuante, quando vira
   estatico, cria um terceiro link igual na mesma tela. */
@media (max-width: 900px) {
  html body.detail-body .detail-home-return-fab {
    display: none !important;
  }
}
`;
  fs.writeFileSync(cssPath, css, "utf8");
}

console.log("formatDate sem hora | FAB oculto no celular");