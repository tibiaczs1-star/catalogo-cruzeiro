"use strict";

const fs = require("fs");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");

const ROOT = path.resolve(__dirname, "..", "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

test("RAIane usa a porta pública da Cheffe Call, sem enviar a fila interna", () => {
  const frontend = read("assets/v8-final/v8-merge-ready.js");

  assert.match(frontend, /cheffePublicAI: "\/api\/cheffe-call\/ai\/public"/);
  assert.match(frontend, /apiPostJson\(API\.cheffePublicAI, \{/);
  assert.doesNotMatch(frontend, /apiPostJson\(API\.cheffeAI, \{\s*question/);
});

test("a API pública da Cheffe Call tem rota própria e usa inteligência sem ações internas", () => {
  const server = read("server.js");

  assert.match(server, /async function answerCheffePublicAiChat\(body = \{\}, req = null\)/);
  assert.match(server, /pathname === "\/api\/cheffe-call\/ai\/public"/);
  assert.match(server, /answerCheffePublicAiChat\(body, req\)/);
  assert.match(server, /channel: "public"/);
});

test("respostas de navegação usam a IA quando disponível e mantêm o fallback editorial", () => {
  const server = read("server.js");

  assert.match(server, /const safeAiAnswer = aiResult\?\.ok[\s\S]{0,600}sanitizeCatalogAiAnswer/);
  assert.match(server, /const answer = humanFallback \? fallbackAnswer : safeAiAnswer;/);
});

test("a porta operacional da Cheffe fica restrita e a interface pública não envia fila", () => {
  const server = read("server.js");
  const frontend = read("assets/v8-final/v8-merge-ready.js");
  const routeAt = server.indexOf('pathname === "/api/cheffe-call/ai"');
  const clientAt = frontend.indexOf("async function askCheffeAI");
  const internalRoute = server.slice(routeAt, routeAt + 500);
  const cheffeClient = frontend.slice(clientAt, clientAt + 1400);

  assert.match(internalRoute, /requireFullAdminOrderAccess\(req, body\)/);
  assert.match(cheffeClient, /apiPostJson\(API\.cheffePublicAI, \{/);
  assert.doesNotMatch(cheffeClient, /queue:\s*safeRead/);
});

test("a sala e os prompts da Cheffe só existem após a autenticação Full Admin", () => {
  const server = read("server.js");
  const page = read("cheffe-call.html");
  const client = read("cheffe-call.js");
  const styles = read("cheffe-call.css");
  const callRoute = server.slice(server.indexOf('pathname === "/api/cheffe-call"'), server.indexOf('pathname === "/api/cheffe-call"') + 420);
  const promptsRoute = server.slice(server.indexOf('pathname === "/api/cheffe-call/prompts"'), server.indexOf('pathname === "/api/cheffe-call/prompts"') + 420);

  assert.match(callRoute, /requireFullAdminOrderAccess\(req\)/);
  assert.match(promptsRoute, /requireFullAdminOrderAccess\(req\)/);
  assert.match(page, /<body class="cheffe-call-page cheffe-access-locked">/);
  assert.match(styles, /body\.cheffe-access-locked \.call-topbar,[\s\S]{0,120}body\.cheffe-access-locked \.call-shell/);
  assert.match(client, /fetch\("\/api\/cheffe-call\/prompts", \{[\s\S]{0,180}"x-admin-password": password/);
  assert.doesNotMatch(client, /\n  initPromptConsole\(\);\n  loadCall\(\)/);
});

test("senhas administrativas não usam valores padrão no código", () => {
  const server = read("server.js");

  assert.doesNotMatch(server, /SUPER_ADMIN_PASSWORD",\s*"[^"]+"/);
  assert.doesNotMatch(server, /POLL_ADMIN_PASSWORD",\s*"[^"]+"/);
  assert.doesNotMatch(server, /SPRITE_CHECK_PASSWORD\s*\|\|\s*"[^"]+"/);
});
