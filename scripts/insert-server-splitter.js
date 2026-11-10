"use strict";

// Insere splitSentences() no server.js antes de ARTICLE_WS.
// Feito em arquivo proprio porque heredoc/shell colapsa as barras invertidas
// das regex (\\b, \\s, \\d) e o texto saia corrompido.

const fs = require("node:fs");
const path = require("node:path");

const ROOT = "C:/Users/junio/Documents/Codex/_czs-work";
const serverPath = path.join(ROOT, "server.js");
const libPath = path.join(ROOT, "scripts", "lib", "split-sentences.js");

let server = fs.readFileSync(serverPath, "utf8");
const lib = fs.readFileSync(libPath, "utf8");

if (server.includes("function splitSentences(value = \"\") {")) {
  console.log("splitSentences ja existe em server.js; nada a fazer");
  process.exit(0);
}

// Pega apenas o bloco da funcao: do "const SENTENCE_END" ate antes do
// module.exports, descartando o cabecalho de comentarios do modulo.
const start = lib.indexOf("const SENTENCE_END");
const end = lib.indexOf("module.exports");
if (start < 0 || end < 0) throw new Error("nao achei o bloco da lib");

const functionBlock = lib.slice(start, end).trimEnd();

const header = [
  "// CZS 2026-11-10 - quebra texto em frases sem estragar numeros.",
  "// O padrao antigo (match(/[^.!?]+[.!?]?/g)) tratava todo ponto como fim",
  "// de frase: 1.171 quilometros virava 1. + 171 quilometros, e 399,4 mil",
  "// quebrava no separador de milhar. Como o corpo da materia e montado a",
  "// partir dessas frases, o texto publicado saia cortado no meio do numero.",
  "// A versao canonica fica em scripts/lib/split-sentences.js; aqui ela e",
  "// repetida porque o servidor nao carrega scripts/ em producao.",
  ""
].join("\n");

const anchor = "const ARTICLE_WS =";
if (!server.includes(anchor)) throw new Error("ancora ARTICLE_WS ausente");

server = server.replace(anchor, header + functionBlock + "\n\n" + anchor);

fs.writeFileSync(serverPath, server, "utf8");
console.log("splitSentences inserida em server.js");