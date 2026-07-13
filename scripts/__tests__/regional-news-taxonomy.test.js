"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const serverSource = fs.readFileSync(path.join(__dirname, "..", "..", "server.js"), "utf8");

function readObjectConstant(name) {
  const match = serverSource.match(new RegExp(`const ${name} = (\\{[\\s\\S]*?\\n\\});`));
  assert.ok(match, `${name} não encontrado`);
  return vm.runInNewContext(`(${match[1]})`);
}

test("preserves explicit regional categories used by the synchronized news batch", () => {
  const labels = readObjectConstant("CATEGORY_LABEL_BY_KEY");
  const aliases = readObjectConstant("CATEGORY_ALIAS_MAP");

  assert.deepEqual(
    {
      jurua: labels.jurua,
      seguranca: labels.seguranca,
      amazonia: labels.amazonia,
      transito: labels.transito
    },
    {
      jurua: "Juruá",
      seguranca: "Segurança",
      amazonia: "Amazônia",
      transito: "Trânsito"
    }
  );
  assert.equal(aliases.jurua, "jurua");
  assert.equal(aliases.seguranca, "seguranca");
  assert.equal(aliases.amazonia, "amazonia");
  assert.equal(aliases.transito, "transito");
});
