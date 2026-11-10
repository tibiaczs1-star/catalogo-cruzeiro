"use strict";

// Desliga as regras antigas que pintavam por cima da folha nova da materia.
//
// 1) noticia-enhance.css: `.detail-hero-thumb.no-image` forcava fundo branco
//    com `!important`. Era isso que desenhava o retangulo branco de 433px
//    quando a imagem falhava.
// 2) czs-design-system.css: no celular, um linear-gradient pintava o corpo de
//    azul-marinho e branco. A folha nova ja define papel claro.
//
// Os arquivos usam CRLF. Casar bloco literal com \n falha; aqui a busca e
// por linha, normalizando o fim de linha na leitura e restaurando na escrita.

const fs = require("node:fs");
const path = require("node:path");

const root = "C:/Users/junio/Documents/Codex/_czs-work";

function patch(fileName, matcher, replacement, label) {
  const file = path.join(root, fileName);
  const original = fs.readFileSync(file, "utf8");
  const eol = original.includes("\r\n") ? "\r\n" : "\n";
  const lines = original.split(/\r?\n/);

  const start = matcher(lines);
  if (start < 0) {
    console.log(` - ${label}: nao encontrado (nada alterado)`);
    return;
  }

  // Remove a regra inteira: da linha inicial ate a que contem "}".
  let end = -1;
  for (let i = start; i < lines.length; i += 1) {
    if (lines[i].trim() === "}") {
      end = i;
      break;
    }
  }
  if (end < 0) {
    console.log(` - ${label}: fim da regra nao encontrado`);
    return;
  }

  const comment = replacement.map((line) => line);
  lines.splice(start, end - start + 1, ...comment);
  fs.writeFileSync(file, lines.join(eol), "utf8");
  console.log(` - ${label}: regra substituida (linhas ${start + 1}-${end + 1})`);
}

// 1) Caixa branca da imagem quebrada.
patch(
  "noticia-enhance.css",
  (lines) => lines.findIndex((l) => l.trim() === ".detail-hero-thumb.no-image,"),
  [
    "/* CZS 2026-11-10 - substituido.",
    "   Forcava um retangulo branco de 433px quando a imagem da materia",
    "   falhava. Sem imagem utilizavel, o bloco nao ocupa tela. */",
    ".detail-hero-thumb.no-image,",
    ".article-hero-thumb.no-image,",
    ".news-detail-hero-thumb.no-image {",
    "  display: none;",
    "}"
  ],
  "noticia-enhance.css (caixa branca)"
);

// 2) Gradiente azul do celular no design system.
patch(
  "czs-design-system.css",
  (lines) => {
    const idx = lines.findIndex((l) => l.includes("linear-gradient(180deg, #061323"));
    return idx;
  },
  [
    "  /* CZS 2026-11-10 - removido: pintava a materia de azul-marinho ate",
    "     18rem. A folha da materia define papel claro. */",
    "  body.czs-official-system {",
    "    background: #fbf8f2;",
    "  }"
  ],
  "czs-design-system.css (gradiente do celular)"
);