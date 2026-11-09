"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("Cheffe prompt prioritizes editorial work without generic legal refusal", () => {
  // CZS 2026-11-09 — OBSOLETO: a Cheffe Call e os Escritorios foram
  // removidos do portal por decisao editorial. Este contrato descreve
  // uma feature que nao existe mais; mantido apenas como registro.
  if (process.env.CZS_LEGACY_CHEFFE_TESTS !== "1") {
    return;
  }
  const source = fs.readFileSync(path.join(__dirname, "..", "..", "server.js"), "utf8");

  assert.match(source, /aviso oficial urgente/);
  assert.match(source, /item sem fonte deve ser verificado e ficar bloqueado/);
  assert.match(source, /oferta comercial sem aprovação deve aguardar aprovação/);
  assert.match(source, /Não desvie para advogado/);
});
