"use strict";

// Limpa o que sobrou morto no FAQ depois de desligar o texto de fabrica.
// `fallback`, `source` e `category` existiam so para montar as duas perguntas
// genericas; sem elas, ficariam variaveis sem uso e texto de fabrica no
// codigo, esperando alguem religar.

const fs = require("node:fs");
const path = require("node:path");

const file = path.join("C:/Users/junio/Documents/Codex/_czs-work", "czs-design-system.js");
let src = fs.readFileSync(file, "utf8");

const start = src.indexOf("  function renderArticleFaq(article) {");
if (start < 0) throw new Error("renderArticleFaq nao encontrada");

const end = src.indexOf("\n  }\n", start);
if (end < 0) throw new Error("fim de renderArticleFaq nao encontrado");

const block = [
  "  function renderArticleFaq(article) {",
  '    const container = ensureElement("article-faq", "section", "article-faq czs-card", document.querySelector("#detail-shell"));',
  '    container.setAttribute("aria-labelledby", "article-faq-title");',
  "    // CZS 2026-11-10 - sem FAQ de fabrica.",
  "    // Antes havia duas perguntas fixas (\"O que foi confirmado nesta",
  "    // materia?\" e \"Por que isso importa para o Vale do Jurua?\") cujas",
  "    // respostas eram a propria chamada. Aparecia igual em toda materia e",
  "    // nao respondia nada. O bloco so existe quando a materia traz",
  "    // perguntas proprias em `faq`.",
  "    const explicit = Array.isArray(article?.faq) ? article.faq : [];",
  "    const faq = explicit",
  "      .map((item) => ({ question: text(item.question || item.q), answer: text(item.answer || item.a) }))",
  "      .filter((item) => item.question && item.answer)",
  "      .slice(0, 4);",
  "    if (!faq.length) { container.hidden = true; return; }",
  "    container.hidden = false;",
  '    container.innerHTML = `<p class="eyebrow">Perguntas</p><h2 id="article-faq-title">Dúvidas sobre esta matéria</h2>${faq.map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join("")}`;',
  "    container.__czsFaqItems = faq;"
].join("\n");

src = src.slice(0, start) + block + src.slice(end + 1);
fs.writeFileSync(file, src, "utf8");
console.log("renderArticleFaq limpo");