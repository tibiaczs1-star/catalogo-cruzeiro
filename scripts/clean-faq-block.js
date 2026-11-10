"use strict";

// Substitui renderArticleFaq pelo bloco final, sem FAQ de fabrica.
// O arquivo usa CRLF: a linha anterior ao fim e "\r", nao "}". O limite e
// encontrado pela funcao seguinte (renderArticleRelated) e recuado ate a
// linha que realmente fecha a funcao.

const fs = require("node:fs");
const path = require("node:path");

const file = path.join("C:/Users/junio/Documents/Codex/_czs-work", "czs-design-system.js");
const lines = fs.readFileSync(file, "utf8").split("\n");

const start = lines.findIndex((l) => l.includes("function renderArticleFaq(article) {"));
const related = lines.findIndex((l, i) => i > start && l.includes("function renderArticleRelated(article) {"));
if (start < 0 || related < 0) throw new Error(`limites nao achados: ${start}, ${related}`);

// Recua do inicio da proxima funcao ate a primeira linha que e "}" sozinho.
let end = -1;
for (let i = related - 1; i > start; i -= 1) {
  if (lines[i].trim() === "}") {
    end = i;
    break;
  }
}
if (end < 0) throw new Error("fechamento da funcao nao encontrado");

const block = [
  "  function renderArticleFaq(article) {",
  '    const container = ensureElement("article-faq", "section", "article-faq czs-card", document.querySelector("#detail-shell"));',
  '    container.setAttribute("aria-labelledby", "article-faq-title");',
  "    // CZS 2026-11-10 - sem FAQ de fabrica.",
  "    // Havia duas perguntas fixas (\"O que foi confirmado nesta materia?\" e",
  "    // \"Por que isso importa para o Vale do Jurua?\") cujas respostas eram a",
  "    // propria chamada. Aparecia igual em toda materia e nao respondia nada.",
  "    // O bloco so existe quando a materia traz perguntas proprias em `faq`.",
  "    const explicit = Array.isArray(article?.faq) ? article.faq : [];",
  "    const faq = explicit",
  "      .map((item) => ({ question: text(item.question || item.q), answer: text(item.answer || item.a) }))",
  "      .filter((item) => item.question && item.answer)",
  "      .slice(0, 4);",
  "    if (!faq.length) { container.hidden = true; return; }",
  "    container.hidden = false;",
  '    container.innerHTML = `<p class="eyebrow">Perguntas</p><h2 id="article-faq-title">Duvidas sobre esta materia</h2>${faq.map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join("")}`;',
  "    container.__czsFaqItems = faq;",
  "  }"
];

lines.splice(start, end - start + 1, ...block);
fs.writeFileSync(file, lines.join("\n"), "utf8");
console.log(`FAQ substituido: linhas ${start + 1}-${end + 1} -> ${block.length} linhas`);