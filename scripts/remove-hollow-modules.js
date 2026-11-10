"use strict";

// Desliga os tres modulos que o leitor chamou de "coisas sem sentido".
//
// 1) Abas de checagem (#detail-fact-tabs): 786px de altura para dizer "o que
//    a fonte confirma" repetindo a propria chamada. Nao e checagem: e a
//    materia reescrita em quatro abas.
// 2) FAQ generico: duas perguntas fixas ("O que foi confirmado nesta
//    materia?" / "Por que isso importa para o Vale do Jurua?") cujas
//    respostas sao a chamada de novo. Aparece igual em toda materia.
// 3) Indice rapido: quatro ancoras ("Resumo, Checagem, Texto completo,
//    Fonte") que apontam para blocos da mesma tela. Nao ajuda a navegar.
//
// O HTML dos modulos sai do documento e as chamadas saem do JS. O FAQ so
// permanece quando a materia traz `faq` de verdade, e o schema continua
// valido porque passa a nao declarar FAQPage.

const fs = require("node:fs");
const path = require("node:path");

const root = "C:/Users/junio/Documents/Codex/_czs-work";

// ---------- 1) noticia.html: remove o bloco de abas ----------
const htmlPath = path.join(root, "noticia.html");
let html = fs.readFileSync(htmlPath, "utf8");
const htmlBefore = html.length;

const tabsStart = html.indexOf('<section\n            class="detail-fact-tabs reveal"');
const tabsAlt = html.indexOf('<section class="detail-fact-tabs');
const start = tabsStart >= 0 ? tabsStart : tabsAlt;

let removedTabs = false;
if (start >= 0) {
  const closeToken = "</section>";
  let depth = 0;
  let i = start;
  let end = -1;
  while (i < html.length) {
    const openIdx = html.indexOf("<section", i);
    const closeIdx = html.indexOf(closeToken, i);
    if (closeIdx < 0) break;
    if (openIdx >= 0 && openIdx < closeIdx) {
      depth += 1;
      i = openIdx + 8;
    } else {
      if (depth === 0) {
        end = closeIdx + closeToken.length;
        break;
      }
      depth -= 1;
      i = closeIdx + closeToken.length;
    }
  }
  if (end > 0) {
    html = html.slice(0, start) + html.slice(end);
    removedTabs = true;
  }
}
fs.writeFileSync(htmlPath, html, "utf8");

// ---------- 2) czs-design-system.js: sem indice, FAQ so quando existe ----------
const dsPath = path.join(root, "czs-design-system.js");
let ds = fs.readFileSync(dsPath, "utf8");

// Nao chama mais o indice rapido.
ds = ds.replace(/[ \t]*renderArticleToc\(article\);\r?\n/, "");

// FAQ: so renderiza quando a materia tem perguntas proprias.
const faqFallbackStart = ds.indexOf("    const fallback = [\n      { question: \"O que foi confirmado nesta matéria?\"");
if (faqFallbackStart >= 0) {
  const faqFallbackEnd = ds.indexOf("    ];", faqFallbackStart);
  if (faqFallbackEnd > 0) {
    ds =
      ds.slice(0, faqFallbackStart) +
      "    // CZS 2026-11-10 - sem FAQ de fabrica. As duas perguntas fixas\n" +
      "    // repetiam a chamada em toda materia; o bloco so aparece quando a\n" +
      "    // materia traz perguntas reais.\n" +
      ds.slice(faqFallbackEnd);
  }
}
ds = ds.replace(
  /const faq = \(explicit\.length \? explicit : fallback\)/,
  "const faq = explicit"
);

fs.writeFileSync(dsPath, ds, "utf8");

console.log(`abas removidas do HTML: ${removedTabs} | bytes: ${htmlBefore} -> ${html.length}`);
console.log(`indice desligado: ${!/renderArticleToc\(article\);/.test(ds)} | FAQ sem fabrica: ${!/O que foi confirmado nesta matéria\?/.test(ds)}`);