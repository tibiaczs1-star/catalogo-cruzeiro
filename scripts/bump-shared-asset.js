"use strict";

// Sobe o ?v= de um asset em TODOS os HTML que o referenciam.
//
// O bump-article-fingerprints.js so mexe no noticia.html. Quando um arquivo
// compartilhado muda (czs-design-system.css serve 16 paginas), as outras
// continuam apontando para o hash antigo e, com Cache-Control immutable de
// 1 ano, o leitor nunca recebe a correcao.

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = "C:/Users/junio/Documents/Codex/_czs-work";
const asset = process.argv[2];
if (!asset) {
  console.error("uso: node scripts/bump-shared-asset.js <arquivo.css|js>");
  process.exit(1);
}

const assetPath = path.join(root, asset);
if (!fs.existsSync(assetPath)) {
  console.error("asset nao existe:", asset);
  process.exit(1);
}

const hash = crypto.createHash("sha1").update(fs.readFileSync(assetPath)).digest("hex").slice(0, 12);
const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const pattern = new RegExp(`${escaped}\\?v=[A-Za-z0-9._-]+`, "g");

const htmlFiles = fs
  .readdirSync(root)
  .filter((name) => name.endsWith(".html"));

const touched = [];
for (const name of htmlFiles) {
  const file = path.join(root, name);
  const before = fs.readFileSync(file, "utf8");
  if (!before.includes(asset)) continue;
  const after = before.replace(pattern, `${asset}?v=${hash}`);
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    touched.push(name);
  }
}

console.log(`${asset} -> v=${hash}`);
console.log(`paginas atualizadas: ${touched.length}`);
touched.forEach((name) => console.log("  " + name));