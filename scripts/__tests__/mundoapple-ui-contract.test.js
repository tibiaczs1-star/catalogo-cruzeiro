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
    "Relatórios",
  ]) {
    assert.match(html, new RegExp(label));
  }
  assert.match(html, /data-help=/);
  assert.match(html, /Preço web/);
  assert.match(html, /Preço retirada/);
  assert.match(html, /Cores disponíveis/);
  assert.match(html, /Aparelho de entrada/);
  assert.match(html, /Comprovante de pagamento/);
  assert.match(html, /Dar baixa/);
  assert.match(html, /Carregar demonstração/);
  assert.match(html, /data-demo-seed/);
  assert.match(html, /data-delivery-settings/);
  assert.match(html, /Taxa base de envio/);
  assert.match(html, /99 Entrega/);
  assert.match(html, /Logística local/);
  assert.match(html, /Preço a combinar/);
});

test("front-end assets use the scoped Mundo Apple API and remain mobile responsive", () => {
  const storeScript = read("store.js");
  const adminScript = read("admin/admin.js");
  const styles = `${read("styles.css")}\n${read("admin/admin.css")}`;
  assert.match(storeScript, /\/api\/mundoapple\/catalog/);
  assert.match(adminScript, /\/api\/mundoapple\/admin\/catalog/);
  assert.match(adminScript, /\/api\/mundoapple\/admin\/documents/);
  assert.match(adminScript, /\/api\/mundoapple\/admin\/sales/);
  assert.match(adminScript, /\/api\/mundoapple\/admin\/reports/);
  assert.match(adminScript, /\/api\/mundoapple\/admin\/demo/);
  assert.match(adminScript, /\/api\/mundoapple\/admin\/settings\/delivery/);
  assert.match(adminScript, /colorVariants/);
  assert.match(storeScript, /variant-product-preview/);
  assert.match(storeScript, /data-select-color/);
  assert.doesNotMatch(storeScript, /data-card-color/);
  assert.doesNotMatch(storeScript, /card-color-status/);
  assert.match(storeScript, /data-product-color-visual/);
  assert.match(storeScript, /\/api\/mundoapple\/checkout\/pix/);
  assert.match(read("index.html"), /id="checkout-dialog"/);
  assert.match(storeScript, /data-checkout-form/);
  assert.match(storeScript, /Retirada direta/);
  assert.match(storeScript, /99 Entrega/);
  assert.match(storeScript, /Logística local/);
  assert.match(storeScript, /Preço a combinar/);
  assert.match(storeScript, /data-checkout-subtotal/);
  assert.match(storeScript, /data-delivery-fee/);
  assert.match(read("index.html"), /PROPRIETÁRIO E ATENDIMENTO/);
  assert.match(read("index.html"), /data-premium-showcase/);
  assert.doesNotMatch(read("index.html"), /data-journey-stage/);
  assert.match(read("index.html"), /class="hero-backdrop"/);
  assert.match(read("index.html"), /hero-mundoapple-fullbleed-v3\.png/);
  assert.doesNotMatch(read("index.html"), /class="hero-visual-frame"/);
  assert.doesNotMatch(read("index.html"), /class="floating-proof/);
  assert.doesNotMatch(storeScript, /Olá, Matheus/);
  assert.doesNotMatch(storeScript, /Quero falar com Matheus/);
  assert.match(styles, /\.variant-product-preview/);
  assert.match(styles, /\.selected-product-color/);
  assert.match(styles, /\.premium-showcase/);
  assert.match(
    styles,
    /\.product-dialog\s*\{[^}]*overflow:\s*auto/s,
    "the product purchase dialog must remain scrollable on short screens",
  );
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

test("official store logo and the selected color drive the product photograph", () => {
  const storefront = read("index.html");
  const admin = read("admin/index.html");
  const storeScript = read("store.js");
  const mediaModulePath = path.join(root, "product-media.js");

  assert.match(storefront, /assets\/mundo-apple-logo-header\.png/);
  assert.match(admin, /\.\.\/assets\/mundo-apple-logo-header\.png/);
  assert.equal(fs.existsSync(mediaModulePath), true);
  assert.match(storefront, /product-media\.js/);
  assert.match(storeScript, /productVisual\(item,\s*true,\s*selected\)/);

  const { variantArtPath } = require(mediaModulePath);
  const item = {
    catalogKey: "iphone-16-pro-2024",
    artPath: "assets/products-ai/iphone-16-pro-2024.png",
  };
  const natural = variantArtPath(item, { name: "Titânio natural", hex: "#c7b9a8" });
  const black = variantArtPath(item, { name: "Titânio preto", hex: "#3c3b3d" });

  assert.notEqual(natural, black);
  assert.match(natural, /assets\/product-colors\/iphone-16-pro-2024\/c7b9a8\.webp(?:\?|$)/);
  assert.match(black, /assets\/product-colors\/iphone-16-pro-2024\/3c3b3d\.webp(?:\?|$)/);
});

test("storefront exposes the hold-to-enter cinematic opening", () => {
  const storefront = read("index.html");
  const introScript = read("intro.js");
  const styles = read("styles.css");

  assert.match(storefront, /id="intro-experience"/);
  assert.match(storefront, /class="intro-apple-mark"/);
  assert.match(storefront, /assets\/mundoapple-opening-cinematic-v1\.png/);
  assert.match(storefront, /intro\.js/);
  assert.match(storefront, /Segure para entrar/);
  assert.match(introScript, /requestAnimationFrame/);
  assert.match(introScript, /is-revealing/);
  assert.match(introScript, /skipIntro/);
  assert.match(styles, /\.intro-experience/);
  assert.match(styles, /\.intro-experience\.is-revealing/);
});

test("the hold interaction charges light, a galaxy and sound before opening", () => {
  const storefront = read("index.html");
  const introScript = read("intro.js");
  const styles = read("styles.css");

  assert.match(storefront, /id="intro-cosmos"/);
  assert.match(storefront, /class="intro-galaxy"/);
  assert.match(storefront, /class="intro-energy-core"/);
  assert.match(introScript, /const createCosmos/);
  assert.match(introScript, /const createAudioEngine/);
  assert.match(introScript, /audio\.startCharge\(\)/);
  assert.match(introScript, /audio\.burst\(\)/);
  assert.match(introScript, /overlay\.style\.setProperty\("--intro-progress-unit"/);
  assert.match(styles, /\.intro-cosmos/);
  assert.match(styles, /\.intro-experience\.is-revealing \.intro-galaxy/);
});

test("the charged opening adds 3d parallax, tremor, orbiting stars and a terminal explosion", () => {
  const introScript = read("intro.js");
  const styles = read("styles.css");

  assert.match(introScript, /const updateParallax/);
  assert.match(introScript, /overlay\.style\.setProperty\("--intro-parallax-x"/);
  assert.match(introScript, /hold\.addEventListener\("pointermove"/);
  assert.match(introScript, /overlay\.classList\.add\("is-exploding"/);
  assert.match(styles, /--intro-parallax-x/);
  assert.match(styles, /\.intro-experience\.is-pressing \.intro-scene/);
  assert.match(styles, /rotateX\(/);
  assert.match(styles, /\.intro-experience\.is-exploding \.intro-galaxy/);
  assert.match(styles, /@keyframes intro-cinematic-shake/);
});
