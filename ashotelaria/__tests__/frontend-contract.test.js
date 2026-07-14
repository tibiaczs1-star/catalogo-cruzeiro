"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");

async function source(file) {
  return readFile(path.join(ROOT, "ashotelaria-app", file), "utf8");
}

function functionSource(script, name, nextName) {
  const start = script.indexOf(`function ${name}`);
  const next = script.indexOf(`function ${nextName}`, start + 1);
  assert.notEqual(start, -1, `${name} must exist`);
  assert.notEqual(next, -1, `${nextName} must exist after ${name}`);
  return script.slice(start, next);
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
  assert.match(html, /styles\.css\?v=20260714-p4/);
  assert.match(html, /app\.js\?v=20260714-p4/);
  assert.match(html, /simulation-badge/);
  assert.match(script, /dataset\.help/);
  assert.match(script, /setTimeout\(/);
  assert.match(script, /650\)/);
  assert.match(styles, /\.help-tooltip/);
});

test("formulários leem os valores antes de bloquear os campos", async () => {
  const [app, booking] = await Promise.all([source("app.js"), source("booking.js")]);
  const handlers = [
    functionSource(app, "handleLogin", "enterWorkspace"),
    functionSource(booking, "searchAvailability", "renderRooms"),
    functionSource(booking, "createReservation", "renderConfirmation"),
  ];

  for (const handler of handlers) {
    const readIndex = handler.indexOf("new FormData(");
    const busyIndex = handler.indexOf("setBusy(");
    assert.notEqual(readIndex, -1, "handler must read FormData");
    assert.notEqual(busyIndex, -1, "handler must set busy state");
    assert.ok(readIndex < busyIndex, "FormData must be captured before controls are disabled");
  }
});

test("painel oferece o ciclo operacional de reservas", async () => {
  const script = await source("app.js");

  assert.doesNotMatch(script, /\.map\(reservationRow\)/);
  assert.match(script, /data-reservation-status/);
  assert.match(script, /checked_in/);
  assert.match(script, /checked_out/);
  assert.match(script, /\/reservations\/\$\{encodeURIComponent\(reservationId\)\}\/status/);
});

test("ajuda contextual cobre controles e linhas operacionais com mensagens especificas", async () => {
  const [html, script] = await Promise.all([source("index.html"), source("app.js")]);

  for (const name of ["username", "role", "password"]) {
    assert.match(html, new RegExp(`<(?:input|select)[^>]*name="${name}"[^>]*data-help="[^"]+"`));
  }
  for (const id of ["refresh-button", "open-account", "logout-button"]) {
    assert.match(html, new RegExp(`id="${id}"[^>]*data-help="[^"]+"`));
  }
  assert.match(script, /element\.addEventListener\("mouseenter", show\)/);
  assert.match(script, /element\.addEventListener\("focus", show\)/);
  assert.match(script, /element\.tabIndex = 0/);
  assert.match(script, /data-help=.*Resumo da reserva/);
  assert.match(script, /data-help=.*Situação operacional do quarto/);
  assert.match(script, /data-help=.*Ação de reserva/);
  assert.doesNotMatch(script, /Passe o mouse para ver mais informações/);
});

test("reserva publica oferece ajuda atrasada inclusive nas opcoes dinamicas", async () => {
  const [html, script] = await Promise.all([source("booking.html"), source("booking.js")]);

  for (const name of ["checkIn", "checkOut", "adults", "children", "guestName", "guestEmail", "guestPhone", "document"]) {
    assert.match(html, new RegExp(`<input[^>]*name="${name}"[^>]*data-help="[^"]+"`));
  }
  assert.match(html, /type="submit"[^>]*data-help="[^"]+"/);
  assert.match(html, /data-back="[12]"[^>]*data-help="[^"]+"/);
  assert.match(script, /bindTooltips\(document\)/);
  assert.match(script, /button\.dataset\.help\s*=/);
  assert.match(script, /bindTooltips\(elements\.roomOptions\)/);
  assert.match(script, /element\.addEventListener\("mouseenter", show\)/);
  assert.match(script, /element\.addEventListener\("focus", show\)/);
  assert.match(script, /650\)/);
});

test("copy da reserva assume simulacao e orienta uso de dados ficticios", async () => {
  const [panelHtml, bookingHtml, bookingScript] = await Promise.all([
    source("index.html"), source("booking.html"), source("booking.js"),
  ]);
  const publicCopy = `${bookingHtml}\n${bookingScript}`;

  assert.doesNotMatch(publicCopy, /disponibilidade real|reserva protegida/i);
  assert.match(publicCopy, /dados fict[ií]cios/i);
  assert.match(publicCopy, /simula[cç][aã]o/i);
  assert.match(panelHtml, /styles\.css\?v=20260714-p4/);
  assert.match(panelHtml, /app\.js\?v=20260714-p4/);
  assert.match(bookingHtml, /styles\.css\?v=20260714-p4/);
  assert.match(bookingHtml, /booking\.js\?v=20260714-p4/);
});

test("painel libera check-in somente na data operacional do Acre", async () => {
  const script = await source("app.js");

  assert.match(script, /function operationalDate\(/);
  assert.match(script, /timeZone:\s*"America\/Rio_Branco"/);
  assert.match(script, /row\.checkIn\s*===\s*operationalDate\(\)/);
  assert.match(script, /Check-in disponível somente na data de entrada/);
  assert.match(script, /reservation-action-note/);
});
