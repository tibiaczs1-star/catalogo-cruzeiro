"use strict";

// Corrige a linha da regex de extensao de imagem que o shell corrompeu:
// as barras invertidas (\., \s) sao consumidas pelo heredoc e pela string.
// Feito em arquivo, nao em -e, porque o texto precisa sair literal.

const fs = require("node:fs");
const path = require("node:path");

const file = path.join("C:/Users/junio/Documents/Codex/_czs-work", "server.js");
const lines = fs.readFileSync(file, "utf8").split("\n");

const DOT = String.fromCharCode(92) + ".";
const SLASH = String.fromCharCode(92) + "/";
const SPACE = String.fromCharCode(92) + "s";
const QMARK = String.fromCharCode(92) + "?";

const idx = lines.findIndex((line) => line.startsWith("const IMAGE_EXT_PATTERN ="));
if (idx < 0) throw new Error("linha IMAGE_EXT_PATTERN nao encontrada");

lines[idx] = `const IMAGE_EXT_PATTERN = /${DOT}(?:avif|gif|jpe?g|png|webp)(?:${QMARK}[^${SPACE},]*)?/i;`;

// Conserta tambem as barras quebradas no corpo da funcao inserida.
for (let i = idx; i < Math.min(idx + 60, lines.length); i += 1) {
  const line = lines[i];
  if (line.includes("/^https?:") && !line.includes("^https?:" + SLASH + SLASH)) {
    lines[i] = line.replace("/^https?:", "/^https?:" + SLASH + SLASH);
  }
  if (line.includes("raw.split(/[") && !line.includes(SLASH)) {
    lines[i] = line.replace("raw.split(/[", "raw.split(/[" + SLASH);
  }
  if (line.includes("/^https?:" + "/" + "/i.test(candidate)") === false && /if \(\/\^https\?:/.test(line) === false) {
    // nada
  }
}

fs.writeFileSync(file, lines.join("\n"), "utf8");
console.log("regex corrigida na linha", idx + 1);
console.log(lines[idx]);