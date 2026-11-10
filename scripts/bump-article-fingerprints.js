"use strict";

// Recalcula e troca o ?v= de cada asset do noticia.html.
// Feito em arquivo: a versao em -e nao casou porque a barra invertida da
// regex se perdeu na camada do shell.

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = "C:/Users/junio/Documents/Codex/_czs-work";
const htmlPath = path.join(root, "noticia.html");

const hashOf = (file) =>
  crypto.createHash("sha1").update(fs.readFileSync(path.join(root, file))).digest("hex").slice(0, 12);

const assets = [
  "noticia-premium.css",
  "czs-article-sheet.css",
  "noticia.js",
  "czs-design-system.css",
  "cs-design-system.js",
  "noticia-enhance.css",
  "modern-launch.css",
  "czs-design-system.js"
];

let html = fs.readFileSync(htmlPath, "utf8");
const report = [];

for (const asset of assets) {
  if (!fs.existsSync(path.join(root, asset))) continue;
  const hash = hashOf(asset);
  const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`${escaped}\\?v=[A-Za-z0-9._-]+`, "g");
  const before = html;
  html = html.replace(pattern, `${asset}?v=${hash}`);
  if (html !== before) report.push(`${asset} -> ${hash}`);
}

fs.writeFileSync(htmlPath, html, "utf8");

// Confere o resultado final.
const remaining = [...html.matchAll(/([A-Za-z0-9_.-]+\.(?:css|js))\?v=([A-Za-z0-9._-]+)/g)].map(
  (m) => `${m[1]}?v=${m[2]}`
);

report.forEach((line) => console.log("  " + line));
console.log("total de assets com versao:", remaining.length);