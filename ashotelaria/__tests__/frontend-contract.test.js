"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");

async function source(file) {
  return readFile(path.join(ROOT, "ashotelaria-app", file), "utf8");
}

test("painel usa login por cargo e oferece troca e redefinicao de senha", async () => {
  const [html, script] = await Promise.all([source("index.html"), source("app.js")]);

  assert.match(html, /name="username"[^>]*value="admin"/);
  assert.match(html, /name="role"/);
  assert.match(html, /id="change-password-form"/);
  assert.match(html, /id="reset-password-form"/);
  assert.match(script, /\/auth\/change-password/);
  assert.match(script, /\/admin\/credentials\/reset/);
});

test("painel e reserva publica sao exclusivamente online", async () => {
  const files = await Promise.all([
    source("index.html"), source("app.js"), source("booking.html"), source("booking.js"),
  ]);
  const joined = files.join("\n").toLowerCase();

  assert.doesNotMatch(joined, /serviceworker|localstorage|indexeddb|modo offline|sincroniza/);
  assert.match(joined, /conex[aã]o/);
  assert.match(joined, /\/public\/availability/);
  assert.match(joined, /\/public\/reservations/);
  assert.match(joined, /idempotency-key/);
});

test("navegacao do painel e montada a partir das permissoes da sessao", async () => {
  const script = await source("app.js");

  assert.match(script, /session\.permissions/);
  assert.match(script, /credentials\.reset/);
  assert.match(script, /tasks\.housekeeping\.read/);
  assert.doesNotMatch(script, /ASHOTELARIA_(?:ADMIN|FINANCE|RECEPTION|DEFAULT)_PASSWORD\s*=/);
});

test("entrada é direta e áreas operacionais oferecem ajuda atrasada", async () => {
  const [html, script, styles] = await Promise.all([
    source("index.html"), source("app.js"), source("styles.css"),
  ]);

  assert.doesNotMatch(html, /Cada equipe vê o que precisa|Operação hoteleira, em tempo real/);
  assert.match(html, /styles\.css\?v=20260714-p1/);
  assert.match(html, /app\.js\?v=20260714-p1/);
  assert.match(script, /dataset\.help/);
  assert.match(script, /setTimeout\(/);
  assert.match(script, /650\)/);
  assert.match(styles, /\.help-tooltip/);
});
