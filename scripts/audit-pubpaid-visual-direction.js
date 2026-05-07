#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const REPORT_ONLY = process.argv.includes("--report-only");

const TARGETS = [
  "pubpaid-v2.html",
  "pubpaid-phaser.css",
  "pubpaid-phaser/app.js",
  "pubpaid-phaser/core",
  "pubpaid-phaser/scenes",
  "pubpaid-phaser/ui"
];

const EXTENSIONS = new Set([".html", ".css", ".js", ".mjs"]);

const RULES = [
  {
    id: "runtime-canvas-generation",
    severity: "error",
    message: "Arte visual nao pode ser gerada por canvas/runtime.",
    pattern: /\b(createCanvas|addCanvas|OffscreenCanvas|generateTexture|textures\.createCanvas|getContext\((["'`])2d\2\)|document\.createElement\((["'`])canvas\3\))/i
  },
  {
    id: "procedural-graphics",
    severity: "error",
    message: "Elemento visual final nao pode ser feito com graphics/formas procedurais; virar PNG/spritesheet pixel art aprovado.",
    pattern: /\b(this\.add\.graphics|scene\.add\.graphics|\.add\.graphics\(|fillRoundedRect|strokeRoundedRect|fillTriangle|fillCircle|fillRect|lineBetween|strokePoints|fillPoints)\b/
  },
  {
    id: "modern-vector-or-stock-style",
    severity: "error",
    message: "Nao usar Canva/vetor/stock como direcao de runtime visual.",
    pattern: /\b(canva|vecteezy|dreamstime|freepik|stock image|clipart|flat design|emoji)\b/i
  },
  {
    id: "smooth-modern-css",
    severity: "warn",
    message: "Verificar se glow/blur/gradiente moderno esta sendo usado como UI final em vez de asset pixel art.",
    pattern: /\b(filter:\s*blur|backdrop-filter|border-radius:\s*(1[2-9]|[2-9][0-9])px|linear-gradient|radial-gradient|box-shadow)\b/i
  },
  {
    id: "canvas-naming",
    severity: "warn",
    message: "Evitar nome visual 'canvas' para camada de produto; canvas tecnico do Phaser nao e direcao de arte.",
    pattern: /\bppg-canvas-shell\b/
  }
];

function walk(entry) {
  const absolute = path.join(ROOT, entry);
  if (!fs.existsSync(absolute)) return [];
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return [absolute];
  const files = [];
  for (const child of fs.readdirSync(absolute)) {
    const childAbsolute = path.join(absolute, child);
    const childStat = fs.statSync(childAbsolute);
    if (childStat.isDirectory()) {
      files.push(...walk(path.relative(ROOT, childAbsolute)));
    } else if (EXTENSIONS.has(path.extname(childAbsolute))) {
      files.push(childAbsolute);
    }
  }
  return files;
}

function lineNumberForIndex(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

const files = TARGETS.flatMap(walk);
const findings = [];

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const rule of RULES) {
    const flags = rule.pattern.flags.includes("g") ? rule.pattern.flags : `${rule.pattern.flags}g`;
    const pattern = new RegExp(rule.pattern.source, flags);
    for (const match of text.matchAll(pattern)) {
      findings.push({
        ...rule,
        file: path.relative(ROOT, file).replace(/\\/g, "/"),
        line: lineNumberForIndex(text, match.index || 0),
        match: match[0]
      });
    }
  }
}

if (!findings.length) {
  console.log("[pubpaid-visual-audit] OK: nenhum padrao proibido encontrado no runtime visual.");
  process.exit(0);
}

console.log("[pubpaid-visual-audit] Achados:");
for (const finding of findings) {
  console.log(
    `${finding.severity.toUpperCase()} ${finding.id} ${finding.file}:${finding.line} -> ${finding.match}`
  );
  console.log(`  ${finding.message}`);
}

const hasError = findings.some((finding) => finding.severity === "error");
if (hasError && !REPORT_ONLY) {
  console.error("[pubpaid-visual-audit] FALHOU: corrija ou mova a arte para spritesheets aprovados antes de concluir.");
  process.exit(1);
}

console.log("[pubpaid-visual-audit] Report-only concluido.");
