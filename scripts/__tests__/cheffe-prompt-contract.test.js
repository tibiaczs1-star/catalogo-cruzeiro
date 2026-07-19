"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("Cheffe prompt prioritizes editorial work without generic legal refusal", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "..", "server.js"), "utf8");

  assert.match(source, /aviso oficial urgente/);
  assert.match(source, /item sem fonte deve ser verificado e ficar bloqueado/);
  assert.match(source, /oferta comercial sem aprovação deve aguardar aprovação/);
  assert.match(source, /Não desvie para advogado/);
});
