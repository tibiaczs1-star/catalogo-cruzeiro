const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..");
const server = fs.readFileSync(path.join(ROOT, "server.js"), "utf8");
const app = fs.readFileSync(path.join(ROOT, "ashotelaria-app", "app.js"), "utf8");
const page = fs.readFileSync(path.join(ROOT, "ashotelaria-app", "index.html"), "utf8");

// ASHOTELARIA_ENABLED=true sem ASHOTELARIA_DATABASE_URL lancava excecao na
// construcao do store e caia no 404 generico do portal. O servico precisa
// dizer que esta offline, nao fingir que a rota nao existe.
test("ashotelaria sem banco responde 503 com motivo legivel", () => {
  const block = server.slice(server.indexOf('pathname.startsWith("/api/ashotelaria/v1")'));
  const body = block.slice(0, block.indexOf("return ashotelariaApiHandler(req, res);"));
  assert.match(body, /try \{/);
  assert.match(body, /catch \(error\)/);
  assert.match(body, /sendJson\(res, 503,/);
  assert.match(body, /CONFIGURATION_ERROR/);
});

test("tela do ashotelaria explica o 503 em vez de erro generico", () => {
  assert.match(app, /error\.status === 503/);
  assert.match(app, /indisponivel agora: banco de dados nao configurado/);
  assert.match(app, /error\.status !== 401 && error\.status !== 404/);
});

test("pagina do ashotelaria carrega o script com versao de conteudo", () => {
  assert.match(page, /app\.js\?v=[a-f0-9]{12}/);
  const fp = require("node:crypto")
    .createHash("sha256")
    .update(fs.readFileSync(path.join(ROOT, "ashotelaria-app", "app.js"), "utf8").replace(/\r\n/g, "\n"))
    .digest("hex")
    .slice(0, 12);
  assert.ok(page.includes(`app.js?v=${fp}`), "app.js precisa do fingerprint atual");
});
