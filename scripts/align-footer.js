"use strict";

// Rodape da materia com margem e alinhado.
//
// Medido em 1440px: o rodape ocupa x=3 a 1430, com o texto encostado na
// borda esquerda da tela, enquanto a materia tem 640px centrados em x=397.
// Rodape de jornal acompanha a mancha do texto ou, no minimo, tem margem.

const fs = require("node:fs");
const path = require("node:path");

const file = path.join("C:/Users/junio/Documents/Codex/_czs-work", "czs-article-sheet.css");
let css = fs.readFileSync(file, "utf8");

const marker = "/* === RODAPE ALINHADO === */";
if (css.includes(marker)) css = css.slice(0, css.indexOf(marker));

css += `

${marker}
/* O rodape ocupa a largura da pagina, mas o conteudo respeita a mesma
   margem da materia. Sem isto o texto encostava na borda da tela. */
html body.detail-body .site-footer.detail-footer,
html body.detail-body .site-footer.rich-footer {
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
  padding-left: max(1.25rem, calc((100vw - 76rem) / 2)) !important;
  padding-right: max(1.25rem, calc((100vw - 76rem) / 2)) !important;
  border-radius: 0 !important;
}

/* Tipografia do rodape: mesma familia, pesos contidos. */
html body.detail-body .site-footer .footer-meta h3 {
  font-family: Fraunces, Georgia, serif !important;
  font-size: clamp(1.25rem, 1rem + 1vw, 1.75rem) !important;
  font-weight: 700 !important;
  line-height: 1.22 !important;
  max-width: 34rem !important;
  color: #ffffff !important;
}

html body.detail-body .site-footer .footer-meta p {
  max-width: 34rem !important;
  color: rgba(255, 255, 255, 0.76) !important;
  font-size: 0.92rem !important;
  line-height: 1.55 !important;
}

html body.detail-body .site-footer .eyebrow {
  color: #ff6b5c !important;
  font-size: 0.68rem !important;
  letter-spacing: 0.14em !important;
}

html body.detail-body .site-footer h4 {
  color: #ffffff !important;
  font-size: 0.9rem !important;
  letter-spacing: 0.02em !important;
}

html body.detail-body .site-footer ul li a {
  color: rgba(255, 255, 255, 0.78) !important;
  font-size: 0.88rem !important;
  text-decoration: none !important;
}

html body.detail-body .site-footer ul li a:hover {
  color: #ffffff !important;
}

/* Botoes do rodape com contraste real sobre o fundo escuro. */
html body.detail-body .site-footer .footer-links a {
  display: inline-flex !important;
  align-items: center !important;
  min-height: 34px !important;
  padding: 0.35rem 0.85rem !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 2px !important;
  background: transparent !important;
  color: #ffffff !important;
  font-size: 0.82rem !important;
  font-weight: 600 !important;
  text-decoration: none !important;
}

html body.detail-body .site-footer .footer-links a:hover {
  border-color: #ffffff !important;
  background: rgba(255, 255, 255, 0.08) !important;
}

@media (max-width: 760px) {
  html body.detail-body .site-footer.detail-footer,
  html body.detail-body .site-footer.rich-footer {
    padding-left: 1.25rem !important;
    padding-right: 1.25rem !important;
  }
}
`;

fs.writeFileSync(file, css, "utf8");
console.log("rodape com margem e alinhado");