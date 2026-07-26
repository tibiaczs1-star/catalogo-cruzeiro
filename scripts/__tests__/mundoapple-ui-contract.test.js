const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..", "mundoapple", "public");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("public storefront exposes product discovery, regional sales and administrative entry", () => {
  const html = read("index.html");
  assert.match(html, /Mundo Apple/);
  assert.match(html, /Cruzeiro do Sul/);
  assert.match(html, /id="catalog-grid"/);
  assert.match(html, /href="admin\/"/);
  assert.match(html, /wa\.me\/556899811047/);
  assert.match(html, /Estoque atualizado/);
  assert.match(html, /Sem estoque agora/);
});

test("admin interface covers the complete store workflow and contextual help", () => {
  const html = read("admin/index.html");
  for (const label of [
    "Visão geral",
    "Colocar no estoque",
    "Estoque ativo",
    "Vendas",
    "Caixa",
    "Despesas",
    "Documentos",
    "Ajuda e FAQ",
  ]) {
    assert.match(html, new RegExp(label));
  }
  assert.match(html, /data-help=/);
  assert.match(html, /Preço web/);
  assert.match(html, /Preço retirada/);
  assert.match(html, /Aparelho de entrada/);
  assert.match(html, /Comprovante de pagamento/);
  assert.match(html, /Dar baixa/);
});

test("front-end assets use the scoped Mundo Apple API and remain mobile responsive", () => {
  const storeScript = read("store.js");
  const adminScript = read("admin/admin.js");
  const styles = `${read("styles.css")}\n${read("admin/admin.css")}`;
  assert.match(storeScript, /\/api\/mundoapple\/catalog/);
  assert.match(adminScript, /\/api\/mundoapple\/admin\/catalog/);
  assert.match(adminScript, /\/api\/mundoapple\/admin\/documents/);
  assert.match(adminScript, /\/api\/mundoapple\/admin\/sales/);
  assert.match(styles, /@media\s*\(max-width:/);
  assert.match(styles, /prefers-reduced-motion/);
});

test("login keeps a stable form reference across the asynchronous request", () => {
  const adminScript = read("admin/admin.js");
  const loginHandler = adminScript.slice(
    adminScript.indexOf('$("#login-form").addEventListener'),
    adminScript.indexOf('$("#logout-button").addEventListener'),
  );

  assert.match(loginHandler, /const form = event\.currentTarget;/);
  assert.doesNotMatch(loginHandler, /await[\s\S]*event\.currentTarget/);
});

test("inventory table shows the projected web profit calculated by the server", () => {
  const adminScript = read("admin/admin.js");
  assert.match(adminScript, /formatMoney\(item\.webProjectedProfitCents\)/);
  assert.doesNotMatch(adminScript, /formatMoney\(item\.webProfitCents\)/);
});
