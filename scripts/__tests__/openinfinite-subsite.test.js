"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "..");

test("OpenInfinite route, static installer extensions and reciprocal cross-links are configured", () => {
  const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
  const oiHtml = fs.readFileSync(path.join(root, "openinfinite", "index.html"), "utf8");
  const bcHtml = fs.readFileSync(path.join(root, "badclaude", "index.html"), "utf8");
  const sbHtml = fs.readFileSync(path.join(root, "badclaude", "superbad-texte", "index.html"), "utf8");
  const apiJs = fs.readFileSync(path.join(root, "badclaude-superbad-api.js"), "utf8");

  assert.match(server, /pathname === "\/openinfinite"/);
  assert.match(server, /Location: "\/openinfinite\/"/);
  assert.match(server, /pathname\.startsWith\("\/openinfinite\/"\)/);
  assert.match(server, /"\.exe"/);
  assert.match(server, /"\.dmg"/);

  assert.match(oiHtml, /\/downloads\/OpenInfinite-Client-Setup\.exe/);
  assert.match(oiHtml, /\/downloads\/OpenInfinite-Client-macOS\.dmg/);
  assert.match(oiHtml, /3º Nível|3º nível/i);
  assert.match(oiHtml, /Cockpit Pro/);
  assert.match(oiHtml, /Fundador VIP/);
  assert.match(oiHtml, /href="\/badclaude\//);
  assert.doesNotMatch(oiHtml, /R\$ 49,90|R\$ 97,00|infinite_pro/);

  assert.match(bcHtml, /OpenInfinite/);
  assert.match(sbHtml, /OpenInfinite/);
  assert.match(bcHtml, /\/openinfinite\//);
  assert.match(sbHtml, /\/openinfinite\//);

  assert.match(apiJs, /includesOpenInfinite/);
  assert.doesNotMatch(apiJs, /\binfinite_pro\s*:\s*\{/);
});
