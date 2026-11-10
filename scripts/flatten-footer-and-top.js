"use strict";

// 1. Caixa de audio com borda de 0,8px: o bloco e texto, nao card.
// 2. Rodape: modern-launch.css aplica dois radial-gradients e um
//    linear-gradient de 160deg. O leitor pediu zero gradiente.
// 3. Topo: a faixa diz "leitura local com resumo proprio e saida para a
//    fonte" e, ao lado, o mesmo link "Voltar para a home". A frase e
//    redundante com a funcao do portal e ocupa a linha inteira no celular.

const fs = require("node:fs");
const path = require("node:path");

const root = "C:/Users/junio/Documents/Codex/_czs-work";

// ---------- 1) audio sem contorno ----------
const sheetPath = path.join(root, "czs-article-sheet.css");
let sheet = fs.readFileSync(sheetPath, "utf8");

const marker = "/* === AUDIO E TOPO === */";
if (sheet.includes(marker)) sheet = sheet.slice(0, sheet.indexOf(marker));

sheet += `

${marker}

/* Leitura em voz: sem contorno, so as reguas que separam do texto. */
html body.detail-body .detail-audio-reader {
  border: 0 !important;
  border-top: 1px solid var(--art-rule) !important;
  border-bottom: 1px solid var(--art-rule) !important;
  border-radius: 0 !important;
  padding: 1rem 0 !important;
}

/* Faixa do topo: so o link, sem a frase institucional repetida. */
html body.detail-body .site-header .top-strip p {
  display: none !important;
}

html body.detail-body .site-header .top-strip {
  justify-content: flex-end !important;
  min-height: 0 !important;
  padding: 0.55rem 0 !important;
}
`;
fs.writeFileSync(sheetPath, sheet, "utf8");

// ---------- 2) rodape sem gradiente ----------
const launchPath = path.join(root, "modern-launch.css");
let launch = fs.readFileSync(launchPath, "utf8");
const eol = launch.includes("\r\n") ? "\r\n" : "\n";
const lines = launch.split(/\r?\n/);

const footerIdx = lines.findIndex((l) => l.trim() === ".site-footer,");
let changed = false;

if (footerIdx >= 0) {
  // Procura o bloco ".site-footer, .detail-footer { ... }" e troca o fundo.
  let end = footerIdx;
  while (end < lines.length && lines[end].trim() !== "}") end += 1;

  for (let i = footerIdx; i <= end; i += 1) {
    if (lines[i].includes("radial-gradient") || lines[i].includes("linear-gradient")) {
      lines[i] = "  /* CZS 2026-11-10 - gradientes removidos: rodape e cor chapada. */";
      changed = true;
    }
    if (lines[i].includes("background:")) {
      lines[i] = "  background: #101820 !important;";
      changed = true;
    }
  }
}

if (changed) fs.writeFileSync(launchPath, lines.join(eol), "utf8");

console.log(`audio sem contorno | rodape achatado: ${changed} | topo sem frase repetida`);