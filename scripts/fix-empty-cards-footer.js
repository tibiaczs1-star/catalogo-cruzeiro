"use strict";

// 1. "O QUE IMPORTA" vazio.
//    A lista vinha das abas de checagem, que foram removidas. Sem elas,
//    quickHighlights cai em article.highlights, que esta vazio para quase
//    toda materia vinda de RSS. Resultado: titulo sem nada embaixo.
//    Regra: sem item, o cartao inteiro sai.
//
// 2. "COTIDIANO" repetido nos cartoes de relacionadas.
//    As quatro relacionadas sao da mesma editoria que a materia, entao o
//    rotulo se repete quatro vezes seguidas. Quando todas sao iguais, o
//    rotulo nao distingue nada: fica so a data.

const fs = require("node:fs");
const path = require("node:path");

const root = "C:/Users/junio/Documents/Codex/_czs-work";

// ---------- JS: esconde o cartao de destaques vazio ----------
const jsPath = path.join(root, "noticia.js");
let js = fs.readFileSync(jsPath, "utf8");

const oldBlock = [
  '  highlightsNode.innerHTML = "";',
  '  const quickHighlights =',
  '    editorialTabs.find((tab) => tab.id === "importance")?.items ||',
  '    dedupeTextList(article.highlights || []);',
  '',
  '  quickHighlights.slice(0, 4).forEach((highlight) => {',
  '    const li = document.createElement("li");',
  '    li.textContent = highlight;',
  '    highlightsNode.appendChild(li);',
  '  });'
].join("\n");

const newBlock = [
  '  highlightsNode.innerHTML = "";',
  '  const quickHighlights =',
  '    editorialTabs.find((tab) => tab.id === "importance")?.items ||',
  '    dedupeTextList(article.highlights || []);',
  '',
  "  // CZS 2026-11-10 - cartao vazio nao aparece.",
  "  // Sem itens, o bloco da coluna lateral mostrava so o titulo",
  '  // "o que importa" e nada embaixo.',
  '  const highlightsCard = highlightsNode.closest(".detail-card");',
  '  if (highlightsCard) highlightsCard.hidden = quickHighlights.length === 0;',
  '',
  '  quickHighlights.slice(0, 4).forEach((highlight) => {',
  '    const li = document.createElement("li");',
  '    li.textContent = highlight;',
  '    highlightsNode.appendChild(li);',
  '  });'
].join("\n");

if (!js.includes(oldBlock)) throw new Error("bloco de destaques nao encontrado");
js = js.replace(oldBlock, newBlock);
fs.writeFileSync(jsPath, js, "utf8");

// ---------- CSS: rodape chapado e rotulo repetido escondido ----------
const cssPath = path.join(root, "czs-article-sheet.css");
let css = fs.readFileSync(cssPath, "utf8");

const marker = "/* === RODAPE E RELACIONADAS === */";
if (css.includes(marker)) css = css.slice(0, css.indexOf(marker));

const block = `${marker}

/* Rodape da materia: bloco escuro chapado, sem gradiente nem brilho.
   O rodape escuro e padrao de jornal; o que saiu foi o efeito. */
html body.detail-body .site-footer,
html body.detail-body .site-footer.rich-footer,
html body.detail-body .site-footer.detail-footer,
html body.detail-body .site-footer * {
  background-image: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
}

html body.detail-body .site-footer {
  background-color: #101820 !important;
  border-top: 0 !important;
}

html body.detail-body .site-footer .footer-photo,
html body.detail-body .site-footer .footer-sitemap {
  background: transparent !important;
  background-image: none !important;
}

/* Relacionadas: quando todas as materias sao da mesma editoria, o rotulo
   repetido nao distingue nada. Mostra so a data. */
html body.detail-body .article-related-card span {
  display: none !important;
}

html body.detail-body .article-related-card small {
  margin-top: 0.5rem !important;
  color: var(--art-muted) !important;
  font-size: 0.74rem !important;
}

/* O cartao de destaques vazio some por completo. */
html body.detail-body .detail-card[hidden] {
  display: none !important;
}
`;

css += "\n" + block;
fs.writeFileSync(cssPath, css, "utf8");

console.log("destaques vazios ocultos | rodape chapado | rotulo repetido removido");