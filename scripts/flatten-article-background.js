"use strict";

// A regra que pintava a materia de azul com bolinhas douradas.
//
// `body.detail-body.article-premium-ready` tem especificidade maior que
// `body.detail-body`, entao vencia a folha nova mesmo com a folha carregando
// depois. Junto com ela vinham ::before e ::after com seis radial-gradients
// de "estrelas". O leitor pediu: sem gradiente, sem azul, design limpo.
//
// Aqui a regra e trocada por cor chapada, e os pseudo-elementos decorativos
// sao desligados no arquivo de origem.

const fs = require("node:fs");
const path = require("node:path");

const root = "C:/Users/junio/Documents/Codex/_czs-work";

// ---------- 1) Fundo da materia: cor chapada ----------
const premiumPath = path.join(root, "noticia-premium.css");
let css = fs.readFileSync(premiumPath, "utf8");
const eol = css.includes("\r\n") ? "\r\n" : "\n";

const bgStart = css.indexOf("body.detail-body.article-premium-ready {");
if (bgStart < 0) throw new Error("regra article-premium-ready nao encontrada");
const bgEnd = css.indexOf("}", bgStart);

const flatRule = [
  "/* CZS 2026-11-10 - fundo chapado.",
  "   Antes: dois radial-gradients (dourado e azul) sobre #03101d. A pagina",
  "   lia como landing page. Agora e papel solido e nada mais. */",
  "body.detail-body.article-premium-ready {",
  "  background-color: #faf8f3 !important;",
  "  background-image: none !important;"
].join(eol);

css = css.slice(0, bgStart) + flatRule + css.slice(bgEnd);

// ---------- 2) Bolinhas decorativas nos pseudo-elementos ----------
// Localiza o bloco que define o conteudo de body.detail-body::before,
// body.detail-body::after e troca por vazio.
const dotsMarker = "body.detail-body::before,";
const dotsStart = css.indexOf(dotsMarker);
if (dotsStart >= 0) {
  // Encontra o fim da definicao de ::after que vem depois.
  const afterIdx = css.indexOf("body.detail-body::after {", dotsStart);
  let cutEnd = -1;
  if (afterIdx >= 0) {
    const close = css.indexOf("}", afterIdx);
    if (close > 0) cutEnd = close + 1;
  }
  if (cutEnd > 0) {
    css =
      css.slice(0, dotsStart) +
      [
        "/* CZS 2026-11-10 - removido: campo de bolinhas douradas e azuis",
        "   fixado atras de todo o texto. Decoracao sem funcao. */",
        "body.detail-body::before,",
        "body.detail-body::after {",
        "  content: none !important;",
        "  display: none !important;",
        "}"
      ].join(eol) +
      css.slice(cutEnd);
  }
}

fs.writeFileSync(premiumPath, css, "utf8");

// ---------- 3) Cor da tela de fundo do documento ----------
const sheetPath = path.join(root, "czs-article-sheet.css");
let sheet = fs.readFileSync(sheetPath, "utf8");

const guard = "/* === ESPECIFICIDADE: vence article-premium-ready === */";
if (!sheet.includes(guard)) {
  sheet += `

${guard}
/* A regra original tem duas classes no seletor; esta tem tres, entao vence
   sem depender da ordem dos arquivos. */
html body.detail-body.article-premium-ready {
  background-color: #faf8f3 !important;
  background-image: none !important;
  color: #1a1a1a !important;
}

html body.detail-body.article-premium-ready::before,
html body.detail-body.article-premium-ready::after {
  content: none !important;
  display: none !important;
  background: none !important;
}
`;
  fs.writeFileSync(sheetPath, sheet, "utf8");
}

console.log("fundo da materia: chapado | bolinhas: removidas | guarda de especificidade: ok");