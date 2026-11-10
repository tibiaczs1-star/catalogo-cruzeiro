"use strict";

// Rodape: sem cartao, sem texto institucional.
//
// 1. "Navegacao rapida" aparecia como cartao com borda e canto arredondado
//    dentro de um rodape ja escuro. Rodape de jornal e lista, nao card.
// 2. O bloco de texto ("Notícia completa, fonte preservada e navegação
//    fácil" + dois paragrafos) repete o que a pagina ja faz e ocupa metade
//    do rodape sem informar nada ao leitor. Fica um titulo curto.

const fs = require("node:fs");
const path = require("node:path");

const root = "C:/Users/junio/Documents/Codex/_czs-work";

// ---------- 1) CSS: cartao -> lista ----------
const cssPath = path.join(root, "czs-article-sheet.css");
let css = fs.readFileSync(cssPath, "utf8");

const marker = "/* === RODAPE COMO LISTA === */";
if (css.includes(marker)) css = css.slice(0, css.indexOf(marker));

css += `

${marker}
html body.detail-body .site-footer .footer-sitemap,
html body.detail-body .site-footer .footer-meta,
html body.detail-body .site-footer .footer-aux {
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}

html body.detail-body .site-footer ul {
  margin: 0.85rem 0 0 !important;
  padding: 0 !important;
  list-style: none !important;
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 0.5rem 1.5rem !important;
}

@media (max-width: 760px) {
  html body.detail-body .site-footer ul {
    grid-template-columns: 1fr !important;
    gap: 0.4rem !important;
  }
}

html body.detail-body .site-footer .footer-links {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 0.75rem !important;
  margin-top: 1.25rem !important;
}
`;
fs.writeFileSync(cssPath, css, "utf8");

// ---------- 2) HTML: texto enxuto ----------
const htmlPath = path.join(root, "noticia.html");
let html = fs.readFileSync(htmlPath, "utf8");

const oldMeta = `          <p class="eyebrow">catálogo cruzeiro do sul</p>
          <h3>Notícia completa, fonte preservada e navegação fácil</h3>
          <p>
            Ao terminar a leitura, você pode voltar para a home e seguir
            acompanhando as principais atualizações do dia.
          </p>
          <p>
            Quando a apuração usa material externo, o crédito permanece ligado à
            fonte original.
          </p>`;

const newMeta = `          <p class="eyebrow">catálogo cruzeiro do sul</p>
          <h3>Jornal local de Cruzeiro do Sul e do Vale do Juruá</h3>
          <p>
            Cada matéria traz a fonte consultada e o link original. Quando o
            texto vem de outro veículo, o crédito fica ao lado da notícia.
          </p>`;

if (html.includes(oldMeta)) {
  html = html.replace(oldMeta, newMeta);
  fs.writeFileSync(htmlPath, html, "utf8");
  console.log("texto do rodape enxugado");
} else {
  console.log("AVISO: bloco de texto do rodape nao casou");
}

console.log("cartao de navegacao virou lista");