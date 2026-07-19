const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..");
const script = fs.readFileSync(path.join(ROOT, "assets", "v8-final", "v8-merge-ready.js"), "utf8");
const css = fs.readFileSync(path.join(ROOT, "assets", "v8-final", "v8-merge-ready.css"), "utf8");

test("contrato de navegação mantém Cheffe restrita, destinos reais e um único salto de rodapé", () => {
  assert.match(script, /function installCzsNavigationContract\(\)/);
  assert.match(script, /adminHref = "\/cheffe-call\.html\?admin=1"/);
  assert.match(script, /"vagasCzs"/);
  assert.match(script, /"catalogo-telefonico"/);
  assert.match(script, /"participacao-comunitaria"/);
  assert.match(script, /"agentesAutonomos"/);
  assert.match(script, /"checagemCzs"/);
  assert.match(script, /"cheffePhotoDesk"/);
  assert.match(script, /"correcaoEditorialCzs"/);
  assert.match(script, /\/legal\.html#privacidade/);
  assert.match(script, /aria-label", "Ir para o rodapé"/);
  assert.doesNotMatch(script, /link\.textContent = "Checagem"/);
  assert.doesNotMatch(script, /function renderCheffeFooterAccess\(\)/);
  assert.doesNotMatch(script, /textContent = "Mapa do site"/);
  assert.match(css, /\.czs-admin-entry/);
  assert.match(css, /\.footer-jump-float/);
});
