const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..");
const server = fs.readFileSync(path.join(ROOT, "server.js"), "utf8");

test("servidor filtra registro retirado mesmo com disco persistente", () => {
  assert.match(server, /const RETIRED_NEWS_IDS = new Set\(\[/);
  assert.ok(server.includes(String.raw`"czs-real-video-001"`), "id retirado declarado");
  assert.match(server, /RETIRED_NEWS_IDS\.has\(String\(item\.id \|\| ""\)\.trim\(\)\)/);
  assert.ok(
    server.includes("demonstracao-tecnica-nvenc-rtx-5070"),
    "slug retirado tambem barrado quando chega sem id"
  );
});

test("servidor neutraliza midia de endereco local antes de publicar", () => {
  assert.match(server, /function isNonPublicMediaUrl\(value = ""\)/);
  assert.ok(server.includes(String.raw`192\.168`), "guarda cobre 192.168.x");
  assert.ok(server.includes(String.raw`172\.(?:1[6-9]|2\d|3[01])`), "guarda cobre 172.16-31");
  assert.match(server, /function sanitizeRawNewsItem\(item\)/);
  assert.match(server, /next = \{ \.\.\.next, videoUrl: "", media: isLocalMedia \? null : item\.media \}/);
  assert.match(server, /\.map\(sanitizeRawNewsItem\)/);
});

test("todo caminho publico passa pela filtragem", () => {
  assert.match(server, /const source = fileItems\.length > 0 \? fileItems : parseHomeLinkedArticleFallbacks\(\);/);
  assert.doesNotMatch(server, /if \(fileItems\.length > 0\) \{\s*\n\s*return fileItems;/);
});
