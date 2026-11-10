"use strict";

// Amplia a lista de hosts que passam pelo proxy de imagem.
//
// O navegador nao carrega as fotos do acreagora.com, batelao.com,
// vozdonorte.com.br e tribunadojurua.com.br: os servidores recusam hotlink.
// A mesma URL carrega normalmente pelo images.weserv.nl (testado: 1536x1125).
// `buildImageLoadCandidates` ja empurra a versao direta E a proxiada para a
// fila, entao basta o host entrar na lista para a foto aparecer.
//
// Escrito em arquivo porque heredoc/-e come as barras invertidas da regex.

const fs = require("node:fs");
const path = require("node:path");

const file = path.join("C:/Users/junio/Documents/Codex/_czs-work", "noticia.js");
let src = fs.readFileSync(file, "utf8");

const marker = "const needsProxy = /";
const idx = src.indexOf(marker);
if (idx < 0) throw new Error("lista de proxy nao encontrada");

const lineEnd = src.indexOf(";", idx);
const currentLine = src.slice(idx, lineEnd + 1);

// Monta a lista nova mantendo os hosts que ja existiam.
const B = String.fromCharCode(92);
const hosts = [
  "ac24horas" + B + ".com",
  "jurua24horas" + B + ".com",
  "acreagora" + B + ".com",
  "batelao" + B + ".com",
  "vozdonorte" + B + ".com" + B + ".br",
  "tribunadojurua" + B + ".com" + B + ".br",
  "juruaemtempo" + B + ".com" + B + ".br",
  "ac24agro" + B + ".com",
  "cruzeirodosul" + B + ".net",
  "cruzeirodosul" + B + ".ac" + B + ".gov" + B + ".br",
  "static" + B + ".wixstatic" + B + ".com",
  "agencia" + B + ".ac" + B + ".gov" + B + ".br",
  "www" + B + ".amac" + B + ".com" + B + ".br",
  "ifac" + B + ".edu" + B + ".br",
  "portalacre" + B + ".com" + B + ".br"
];

const newLine =
  "const needsProxy = /" +
  hosts.join("|") +
  "/i.test(\n    cleaned\n  );";

src = src.slice(0, idx) + newLine + src.slice(lineEnd + 1);
fs.writeFileSync(file, src, "utf8");

console.log("hosts no proxy:", hosts.length);
console.log("linha antiga:", currentLine.replace(/\s+/g, " ").slice(0, 110));