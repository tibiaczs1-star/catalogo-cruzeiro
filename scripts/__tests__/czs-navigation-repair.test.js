const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..");
const script = fs.readFileSync(path.join(ROOT, "assets", "v8-final", "v8-merge-ready.js"), "utf8");
const css = fs.readFileSync(path.join(ROOT, "assets", "v8-final", "v8-merge-ready.css"), "utf8");

test("contrato de navegação mantém destinos reais e um único acesso ao rodapé", () => {
  assert.match(script, /function installCzsNavigationContract\(\)/);
  assert.match(script, /"vagasCzs"/);
  assert.match(script, /"catalogo-telefonico"/);
  assert.match(script, /"participacao-comunitaria"/);
  assert.match(script, /"checagemCzs"/);
  assert.match(script, /"correcaoEditorialCzs"/);
  assert.match(script, /\/legal\.html#privacidade/);
  // CZS 2026-11-09: Cheffe Call e Escritórios foram removidos do portal.
  assert.doesNotMatch(script, /cheffe-call\.html/);
  assert.doesNotMatch(script, /"agentesAutonomos"/);
  // O painel de fotos da Cheffe fica neutralizado (retorna antes de renderizar).
  assert.match(script, /function renderCheffePhotoDesk\(\) \{\s*\n\s*\/\/ CZS 2026-11-09[\s\S]{0,200}?\n\s*return;/);
  assert.doesNotMatch(script, /link\.textContent = "Checagem"/);
  assert.doesNotMatch(script, /function renderCheffeFooterAccess\(\)/);
  assert.doesNotMatch(script, /textContent = "Mapa do site"/);
  // O rodapé é acessado por um único botão flutuante visível.
  assert.match(css, /\.czs-footer-cta/);
  assert.match(css, /\.footer-jump-float/);
});
