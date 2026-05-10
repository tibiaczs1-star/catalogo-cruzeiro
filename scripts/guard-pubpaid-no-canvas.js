#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const TARGETS = [
  "pubpaid-phaser",
  "pubpaid-v2.html"
];

const FORBIDDEN = [
  {
    id: "sprite-factory",
    regex: /\bspriteFactory\b/i,
    message: "spriteFactory foi banido do PubPaid 2"
  },
  {
    id: "dom-create-element",
    regex: /document\s*\.\s*createElement\s*\(/i,
    message: "document.createElement foi banido do runtime PubPaid 2"
  },
  {
    id: "canvas-word",
    regex: /canvas/i,
    message: "referencias diretas a canvas foram banidas do runtime PubPaid 2"
  },
  {
    id: "phaser-create-canvas",
    regex: /\bcreateCanvas\s*\(/i,
    message: "textures.createCanvas foi banido do PubPaid 2"
  },
  {
    id: "add-canvas",
    regex: /\baddCanvas\s*\(/i,
    message: "addCanvas foi banido do PubPaid 2"
  },
  {
    id: "procedural-idle-texture",
    regex: /-idle-\d/i,
    message: "frames idle gerados por codigo foram banidos do PubPaid 2"
  }
];

const SKIP_DIRS = new Set([".git", "node_modules", ".codex-temp"]);
const FILE_EXTENSIONS = new Set([".html", ".js", ".css", ".json"]);

function walk(entryPath, files = []) {
  if (!fs.existsSync(entryPath)) return files;
  const stat = fs.statSync(entryPath);
  if (stat.isDirectory()) {
    fs.readdirSync(entryPath, { withFileTypes: true }).forEach((entry) => {
      if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) return;
      walk(path.join(entryPath, entry.name), files);
    });
    return files;
  }
  if (FILE_EXTENSIONS.has(path.extname(entryPath))) files.push(entryPath);
  return files;
}

function lineNumberFor(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

const files = TARGETS.flatMap((target) => walk(path.join(ROOT_DIR, target)));
const violations = [];

files.forEach((file) => {
  const source = fs.readFileSync(file, "utf8");
  FORBIDDEN.forEach((rule) => {
    const match = rule.regex.exec(source);
    if (!match) return;
    violations.push({
      file: path.relative(ROOT_DIR, file),
      line: lineNumberFor(source, match.index),
      rule: rule.id,
      message: rule.message
    });
  });
});

if (violations.length) {
  console.error("PubPaid 2 guard falhou. Remova os itens banidos:");
  violations.forEach((violation) => {
    console.error(`- ${violation.file}:${violation.line} [${violation.rule}] ${violation.message}`);
  });
  process.exit(1);
}

console.log("PubPaid 2 guard OK: sem spriteFactory, createElement, canvas, createCanvas, addCanvas ou idle gerado.");
