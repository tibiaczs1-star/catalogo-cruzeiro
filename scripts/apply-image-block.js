"use strict";

// Substitui o bloco de imagem do server.js pelo conteudo literal de
// scripts/image-block.txt. O texto mora num arquivo proprio para as barras
// invertidas das regex chegarem intactas (heredoc e string de shell as comem).

const fs = require("node:fs");
const path = require("node:path");

const root = "C:/Users/junio/Documents/Codex/_czs-work";
const serverPath = path.join(root, "server.js");
const blockPath = path.join(root, "scripts", "image-block.txt");

const lines = fs.readFileSync(serverPath, "utf8").split("\n");
const block = fs.readFileSync(blockPath, "utf8").replace(/\r\n/g, "\n").trimEnd().split("\n");

const start = lines.findIndex((line) => line.startsWith("const IMAGE_EXT_PATTERN ="));
const fnStart = lines.findIndex((line) => line.startsWith("function resolveSafeArticleRecordImage("));
if (start < 0 || fnStart < 0) throw new Error("ancoras nao encontradas");

let fnEnd = -1;
for (let i = fnStart + 1; i < lines.length; i += 1) {
  if (lines[i] === "}") {
    fnEnd = i;
    break;
  }
}
if (fnEnd < 0) throw new Error("fim da funcao nao encontrado");

lines.splice(start, fnEnd - start + 1, ...block);
fs.writeFileSync(serverPath, lines.join("\n"), "utf8");
console.log("bloco de imagem substituido pelo arquivo literal");