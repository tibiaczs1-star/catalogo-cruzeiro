"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");
const server = fs.readFileSync(path.join(ROOT, "server.js"), "utf8");
const pluginJs = fs.readFileSync(path.join(ROOT, "agente-vivo", "agentes.js"), "utf8");
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "agente-vivo", "registro.json"), "utf8"));

test("plugin dos agentes e injetado pelo servidor, sem editar pagina por pagina", () => {
  assert.match(server, /function injectAgenteVivo/);
  assert.match(server, /data-czs-agente-vivo="1"/);
  assert.match(server, /\/agente-vivo\/agentes\.js\?v=/);
  // Um unico ponto de injeçao no sendFile, nao em cada pagina.
  assert.equal((server.match(/injectsAgenteVivo/g) || []).length >= 2, true);
});

test("plugin fica fora de cockpit interno, jogos e manutencao", () => {
  for (const file of ["pubpaid-admin.html", "pubpaid.html", "maintenance.html", "real-agents.html"]) {
    assert.match(server, new RegExp(`"${file.replace(".", "\\.")}"`));
  }
  assert.match(server, /AGENTE_VIVO_EXCLUDED_PREFIXES = \["backend\/", "assets\/"\]/);
});

test("registro dos agentes carrega dado verificavel e um aviso de honestidade", () => {
  assert.ok(Array.isArray(registry.machines) && registry.machines.length > 0);
  assert.ok(registry.updatedAt, "registro precisa de carimbo de tempo");
  assert.match(registry.disclaimer, /checagem|previs/i);
  for (const machine of registry.machines) {
    assert.ok(machine.label, "cada maquina precisa de rotulo");
    assert.ok(machine.note && machine.note.length > 3, "cada maquina precisa de um dado real");
    assert.ok(["ok", "alert"].includes(machine.status), "status precisa ser ok ou alert");
  }
});

test("plugin recolhe e solta com base na rolagem, sem depender de requestAnimationFrame", () => {
  assert.match(pluginJs, /setCollapsed\(true\)/);
  assert.match(pluginJs, /scheduleSettle/);
  // rAF nao dispara em aba de fundo e prendia o guard de scroll.
  assert.doesNotMatch(pluginJs, /requestAnimationFrame/);
});

test("plugin respeita movimento reduzido sem perder o estado da interface", () => {
  assert.match(pluginJs, /prefers-reduced-motion/);
  // O caminho de movimento reduzido tambem precisa recolher.
  assert.match(pluginJs, /if \(REDUCED\) \{\s*markAllDone\(\);\s*scheduleSettle\(\);/);
});

test("rota do registro e servida sem cache para o painel ver o estado novo", () => {
  assert.match(server, /pathname === "\/agente-vivo\/registro\.json"/);
  const routeBlock = server.slice(server.indexOf("/agente-vivo/registro.json"));
  assert.match(routeBlock.slice(0, 600), /cacheControl: "no-store"/);
});
test("camada surreal sai no mesmo ponto de injecao, declarada antes do uso", () => {
  const surrealIndex = server.indexOf("const SURREAL_LAYER_TAG");
  assert.ok(surrealIndex > 0, "SURREAL_LAYER_TAG precisa existir");
  assert.ok(surrealIndex < server.indexOf("function injectAgenteVivo"), "constante antes da funcao");
  assert.match(server, /\/surreal\/surreal\.css\?v=/);
  assert.match(server, /\/surreal\/surreal\.js\?v=/);
  // Uma pagina que pede so uma das camadas recebe so ela.
  assert.match(server, /const wantsSurreal =/);
  assert.match(server, /if \(wantsSurreal\) tags\.push\(SURREAL_LAYER_TAG\)/);
});

test("camada surreal nao mexe em conteudo nem esconde texto", () => {
  const surrealJs = fs.readFileSync(path.join(ROOT, "surreal", "surreal.js"), "utf8");
  assert.doesNotMatch(surrealJs, /innerHTML|textContent\s*=|display\s*=\s*["']none/);
  assert.match(surrealJs, /prefers-reduced-motion/);
  assert.match(surrealJs, /saveData/);
});
