"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");

const { createSuperbadSalesApi } = require("../../badclaude-superbad-api");

const root = path.resolve(__dirname, "..", "..");

test("OpenInfinite route, dedicated checkout page, Linux VPS paid distinction, logo variations and BadClaude L3+ inclusion are configured", () => {
  const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
  const oiHtml = fs.readFileSync(path.join(root, "openinfinite", "index.html"), "utf8");
  const checkoutHtml = fs.readFileSync(path.join(root, "openinfinite", "checkout", "index.html"), "utf8");
  const oiReadme = fs.readFileSync(path.join(root, "openinfinite", "README.md"), "utf8");
  const bcHtml = fs.readFileSync(path.join(root, "badclaude", "index.html"), "utf8");
  const sbHtml = fs.readFileSync(path.join(root, "badclaude", "superbad-texte", "index.html"), "utf8");
  const apiJs = fs.readFileSync(path.join(root, "badclaude-superbad-api.js"), "utf8");

  assert.match(server, /pathname === "\/openinfinite"/);
  assert.match(server, /Location: `\/openinfinite\/\$\{oiQuerySuffix\}`/);
  assert.match(server, /pathname === "\/openinfinite\/checkout"/);
  assert.match(server, /pathname === "\/openinfinite\/checkin"/);
  assert.match(server, /Location: `\/openinfinite\/checkout\/\$\{oiQuerySuffix\}`/);
  assert.match(server, /pathname\.startsWith\("\/openinfinite\/"\)/);
  assert.match(server, /"\.exe"/);
  assert.match(server, /"\.dmg"/);

  assert.match(oiHtml, /\/downloads\/OpenInfinite-Client-Setup\.exe/);
  assert.match(oiHtml, /\/downloads\/InfiniteClaude-Client-Setup\.exe/);
  assert.match(oiHtml, /\/downloads\/OpenInfinite-Client-macOS\.dmg/);
  assert.match(oiHtml, /\/downloads\/InfiniteClaude-Client-macOS\.dmg/);
  assert.match(oiHtml, /\/downloads\/OpenInfinite-Client-Ubuntu-VPS\.tar\.gz/);
  assert.match(oiHtml, /\/downloads\/InfiniteClaude-Client-Ubuntu-VPS\.tar\.gz/);
  assert.match(oiHtml, /curl -fsSL https:\/\/catalogo-cruzeiro-web\.onrender\.com\/install-openinfinite\.sh \| bash/);
  assert.match(oiHtml, /curl -fsSL https:\/\/catalogo-cruzeiro-web\.onrender\.com\/install-infiniteclaude\.sh \| bash/);
  assert.match(oiHtml, /curl -fsSL https:\/\/catalogo-cruzeiro-web\.onrender\.com\/install-mac\.sh \| bash/);
  assert.match(oiHtml, /irm https:\/\/catalogo-cruzeiro-web\.onrender\.com\/install-win\.ps1 \| iex/);

  // Lean Customer Landing Page: company + product names only, logo variations per OS/product, no internal dev jargon
  assert.match(oiHtml, /--bg:\s*#070709/i);
  assert.match(oiHtml, /id="izHoodMark"/);
  assert.match(oiHtml, /id="izOpenInfiniteMark"/);
  assert.match(oiHtml, /id="izClaudeMark"/);
  assert.match(oiHtml, /id="izWinMark"/);
  assert.match(oiHtml, /id="izMacMark"/);
  assert.match(oiHtml, /id="izLinuxMark"/);
  assert.match(oiHtml, /id="izMaxMark"/);
  assert.match(oiHtml, /INFINITE ZONE/);
  assert.match(oiHtml, /OpenInfinite/);
  assert.match(oiHtml, /InfiniteClaude/);
  assert.match(oiHtml, /Mac Normal/i);
  assert.match(oiHtml, /não é VPS/i);
  assert.match(oiHtml, /Requer Pedido Pago/i);
  assert.match(oiHtml, /href="\/openinfinite\/checkout\/"/);
  assert.match(oiHtml, /R\$ 99,00/);
  assert.match(oiHtml, /R\$ 159,00/);
  assert.match(oiHtml, /R\$ 199,00/);
  assert.match(oiHtml, /R\$ 249,00/);

  // Ensure new 3D multi-device hero showcase & updated v6.2/v6.3 real UI captures are present (NOT old v6.1 mockups)
  assert.match(oiHtml, /id="deviceRig"/);
  assert.match(oiHtml, /id="tab-dev-mac"/);
  assert.match(oiHtml, /id="tab-dev-win"/);
  assert.match(oiHtml, /id="tab-dev-linux"/);
  assert.match(oiHtml, /id="nextDeviceBtn"/);
  assert.match(oiHtml, /id="toggleAppBtn"/);
  assert.match(oiHtml, /\/openinfinite\/assets\/hero_mac_liquid_glass\.png/);
  assert.match(oiHtml, /\/openinfinite\/assets\/hero_win_infiniteclaude\.png/);
  assert.match(oiHtml, /\/openinfinite\/assets\/hero_win_openinfinite\.png/);
  assert.match(oiHtml, /\/openinfinite\/assets\/hero_linux_vps_tui\.png/);
  assert.doesNotMatch(oiHtml, /openinfinite_tema_escuro\.png/);
  for (const assetName of [
    "hero_mac_liquid_glass.png",
    "hero_win_infiniteclaude.png",
    "hero_win_openinfinite.png",
    "hero_linux_vps_tui.png",
  ]) {
    assert.ok(fs.existsSync(path.join(root, "openinfinite", "assets", assetName)), `Expected ${assetName}`);
  }

  // Ensure removed clutter, internal jargon, and inline checkout are NOT on landing page
  assert.doesNotMatch(oiHtml, /2 softwares nativos|White-Label|Símbolo Vivo|HTTP 200 Real Verificado|WinForms GDI\+|SwiftUI NSVisualEffectView/i);
  assert.doesNotMatch(oiHtml, /id="particleCanvas"|id="cursorAura"|orbit-ring|float-badge/);
  assert.doesNotMatch(oiHtml, /id="orderForm"|id="receiptForm"|id="verifyForm"/);
  assert.doesNotMatch(oiHtml, /4114|demo_lock|shift_i\.png|NÃO é vendido separado|não é vendido avulso/i);
  assert.doesNotMatch(oiHtml, /claude-sonnet|claude-opus|claude-haiku/i);
  assert.doesNotMatch(oiReadme, /claude-sonnet|claude-opus|claude-haiku/i);

  assert.ok(!fs.existsSync(path.join(root, "openinfinite", "assets", "openinfinite_demo_lock.png")));
  assert.ok(!fs.existsSync(path.join(root, "openinfinite", "assets", "openinfinite_shift_i.png")));
  assert.ok(fs.existsSync(path.join(root, "openinfinite", "assets", "openinfinite_estatisticas.png")));

  assert.match(bcHtml, /OpenInfinite/);
  assert.match(sbHtml, /OpenInfinite/);
  assert.match(bcHtml, /\/openinfinite\//);
  assert.match(sbHtml, /\/openinfinite\//);

  assert.match(checkoutHtml, /id="checkout"/);
  assert.match(checkoutHtml, /id="validador"/);
  assert.match(checkoutHtml, /Raiane Leoncio/);
  assert.match(checkoutHtml, /68 99226-9296/);
  assert.doesNotMatch(checkoutHtml, /Lenoncio/i);
  assert.doesNotMatch(oiHtml, /Lenoncio/i);

  assert.match(apiJs, /includesOpenInfinite/);
  assert.match(apiJs, /includesInfiniteClaude/);
  assert.match(apiJs, /infinite_claude/);
  assert.match(apiJs, /R\$ 99,00/);
  assert.match(apiJs, /R\$ 159,00/);
  assert.match(apiJs, /R\$ 199,00/);
});

test("OpenInfinite separate checkout (/openinfinite/checkout/) enforces Google Auth, Buyer WhatsApp, PIX Raiane Leoncio, Receipt attachment & Key Validator with zero alert()", () => {
  const oiHtml = fs.readFileSync(path.join(root, "openinfinite", "index.html"), "utf8");
  const checkoutHtml = fs.readFileSync(path.join(root, "openinfinite", "checkout", "index.html"), "utf8");

  for (const doc of [oiHtml, checkoutHtml]) {
    assert.doesNotMatch(doc, /\balert\s*\(/);
    assert.doesNotMatch(doc, /\uF8FF/);
    assert.match(doc, /class="skip-link"/);
    assert.match(doc, /:focus-visible/);
    assert.match(doc, /navigator\.clipboard/);
  }

  // Google Auth integration + Buyer WhatsApp field + Orders auto-restore on /openinfinite/checkout/
  assert.match(checkoutHtml, /<script src="\/site-google-auth\.js"><\/script>/);
  assert.match(checkoutHtml, /id="step1Google"/);
  assert.match(checkoutHtml, /id="ordWhatsapp"/);
  assert.match(checkoutHtml, /buyer_whatsapp/);
  assert.match(checkoutHtml, /data-google-auth-card/);
  assert.match(checkoutHtml, /data-google-auth-button/);
  assert.match(checkoutHtml, /data-google-auth-logout/);
  assert.match(checkoutHtml, /\/api\/superbad\/my-orders/);
  assert.match(checkoutHtml, /\/api\/auth\/config/);
  assert.match(checkoutHtml, /\/api\/auth\/session/);

  // 4-Step Checkout: Step 2 PIX -> Step 3 Receipt attachment -> Step 4 WhatsApp immediate + Key release
  assert.match(checkoutHtml, /id="step2Pix"/);
  assert.match(checkoutHtml, /id="step3Receipt"/);
  assert.match(checkoutHtml, /id="step4Analysis"/);
  assert.match(checkoutHtml, /id="receiptForm"/);
  assert.match(checkoutHtml, /id="receiptFileInput"/);
  assert.match(checkoutHtml, /id="receiptE2eInput"/);
  assert.match(checkoutHtml, /receipt_file_b64/);
  assert.match(checkoutHtml, /receipt_file_mime/);
  assert.match(checkoutHtml, /receipt_analysis/);
  assert.match(checkoutHtml, /whatsapp_immediate_url/);
  assert.match(checkoutHtml, /Falar no WhatsApp para Ativação Imediata/);
  assert.match(checkoutHtml, /id="deliveredKeyBox"/);
  assert.match(checkoutHtml, /isKeyUnlockedStatus/);

  // Validator (#validador + #verifyKeyInput + ?test_key= URL auto-runner + canonical plan name without PII leak)
  assert.match(checkoutHtml, /id="validador"/);
  assert.match(checkoutHtml, /id="verifyKeyInput"/);
  assert.match(checkoutHtml, /params\.get\(['"]test_key['"]\)/);
  assert.match(checkoutHtml, /Testar Chave no Validador/);
  assert.match(checkoutHtml, /resolveCanonicalPlanName/);

  // Inline PIX copy + inline error/offline/retry UX
  assert.match(checkoutHtml, /id="copyPixBtn"/);
  assert.match(checkoutHtml, /id="pixCopyFeedback"/);
  assert.match(checkoutHtml, /id="copyBrcodeBtn"/);
  assert.match(checkoutHtml, /id="orderErrorBox"/);
  assert.match(checkoutHtml, /id="retryOrderBtn"/);
  assert.match(checkoutHtml, /retryVerifyBtn/);
  assert.match(checkoutHtml, /navigator\.onLine === false/);

  // Parse inline <script> blocks in BOTH pages with Node VM to guarantee zero JS syntax errors
  for (const [name, doc] of [["openinfinite/index.html", oiHtml], ["openinfinite/checkout/index.html", checkoutHtml]]) {
    const scriptBlocks = [...doc.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    assert.ok(scriptBlocks.length >= 1, `Expected inline <script> in ${name}`);
    for (const [, code] of scriptBlocks) {
      assert.doesNotThrow(() => new vm.Script(code, { filename: name }));
    }
  }
});

test("OpenInfinite PIX checkout (infinite R$99 / infinite_pro R$159) and license verification contracts work end-to-end", async (t) => {
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "openinfinite-api-test-"));
  const dataDir = path.join(tmpDir, "data");
  const releasesDir = path.join(tmpDir, "releases");
  await fsp.mkdir(dataDir, { recursive: true });
  await fsp.mkdir(releasesDir, { recursive: true });
  t.after(() => fsp.rm(tmpDir, { recursive: true, force: true }));

  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  const expSec = Math.floor((Date.now() + 30 * 86400000) / 1000);

  function mintEdKey(prefix, tier, edition, label) {
    const payloadB64 = Buffer.from(
      JSON.stringify({ issuer: "juniorplay-local", tier, edition, label, exp: expSec }),
      "utf8"
    ).toString("base64url");
    const signingInput = `${prefix}-${payloadB64}`;
    const sigB64 = crypto.sign(null, Buffer.from(signingInput, "utf8"), privateKey).toString("base64url");
    return `${signingInput}.${sigB64}`;
  }

  const infKey = mintEdKey("OI6-INF", "infinite-basic", "infinite", "OpenInfinite Windows (1 Mês)");
  const proKey = mintEdKey("OI6-PRO", "infinite-pro", "infinite_pro", "OpenInfinite macOS & Multi (1 Mês)");
  const claudeKey = mintEdKey("IC6-PRO", "infinite-claude", "infinite_claude", "InfiniteClaude v6.2 Multi-OS + Claude Code (1 Mês)");
  const maxKey = mintEdKey("IC6-MAX", "infinite-max", "infinite_max", "InfiniteClaude v6.2 Max Multi-CLI Total (1 Mês)");
  const maxCompatKey = mintEdKey("IC6-MAX", "infinite-claude-max", "infinite_max", "InfiniteClaude v6.2 Max Multi-CLI Total (1 Mês)");
  const founderKey = mintEdKey("BC5-FND", "founder", "founder", "BadClaude Fundador");
  const basicKey = mintEdKey("BC5-BSC", "client-basic", "basic", "BadClaude Básico");

  const api = createSuperbadSalesApi({
    rootDir: tmpDir,
    dataDir,
    releasesDir,
    publicKeyPem,
    environment: { NODE_ENV: "test" },
    sessionSecret: "oi-test-session-secret-0123456789abcdef0123456789abcdef",
    downloadSecret: "oi-test-download-secret-0123456789abcdef0123456789abcdef",
  });

  const srv = http.createServer((req, res) => api.handleApi(req, res));
  await new Promise((resolve) => srv.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => srv.close(resolve)));
  const baseUrl = `http://127.0.0.1:${srv.address().port}`;

  // 1) Order Windows R$ 99,00 (infinite)
  const resWin = await fetch(`${baseUrl}/api/superbad/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      buyer_name: "Maria Oliveira",
      buyer_email: "maria@gmail.com",
      buyer_contact: "maria@gmail.com",
      requested_edition: "infinite",
    }),
  });
  assert.equal(resWin.status, 201);
  const bodyWin = await resWin.json();
  assert.equal(bodyWin.ok, true);
  assert.equal(bodyWin.order.amount_centavos, 9900);
  assert.equal(bodyWin.order.amount_display, "R$ 99,00");
  assert.match(bodyWin.order.pix.brcode, /^000201/);
  assert.match(bodyWin.order.pix.qr_data_url, /^data:image\/png;base64,/);

  // 2) Order macOS & Multi R$ 159,00 (infinite_pro)
  const resMac = await fetch(`${baseUrl}/api/superbad/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      buyer_name: "João Silva",
      buyer_email: "joao@gmail.com",
      buyer_contact: "joao@gmail.com",
      requested_edition: "infinite_pro",
    }),
  });
  assert.equal(resMac.status, 201);
  const bodyMac = await resMac.json();
  assert.equal(bodyMac.ok, true);
  assert.equal(bodyMac.order.amount_centavos, 15900);
  assert.equal(bodyMac.order.amount_display, "R$ 159,00");

  // 2b) Order InfiniteClaude v6.2 Multi-OS + Claude Code R$ 199,00 (infinite_claude / IC6-PRO)
  const resClaude = await fetch(`${baseUrl}/api/superbad/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      buyer_name: "Lucas Andrade",
      buyer_email: "lucas@gmail.com",
      buyer_contact: "lucas@gmail.com",
      requested_edition: "infinite_claude",
    }),
  });
  assert.equal(resClaude.status, 201);
  const bodyClaude = await resClaude.json();
  assert.equal(bodyClaude.ok, true);
  assert.equal(bodyClaude.order.amount_centavos, 19900);
  assert.equal(bodyClaude.order.amount_display, "R$ 199,00");
  assert.equal(bodyClaude.order.requested_edition, "infinite_claude");

  // 2c) Order InfiniteClaude v6.2 Max Multi-CLI Total R$ 249,00 (infinite_max / IC6-MAX)
  const resMax = await fetch(`${baseUrl}/api/superbad/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      buyer_name: "Marcos Max",
      buyer_email: "marcos.max@gmail.com",
      buyer_contact: "marcos.max@gmail.com",
      requested_edition: "infinite_max",
    }),
  });
  assert.equal(resMax.status, 201);
  const bodyMax = await resMax.json();
  assert.equal(bodyMax.ok, true);
  assert.equal(bodyMax.order.amount_centavos, 24900);
  assert.equal(bodyMax.order.amount_display, "R$ 249,00");
  assert.equal(bodyMax.order.requested_edition, "infinite_max");

  // 3) Receipt upload transitions order to receipt_submitted without auto-unlocking license_key
  const tinyPngB64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const resReceipt = await fetch(`${baseUrl}/api/superbad/orders/${bodyMac.order.order_id}/receipt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_secret: bodyMac.order.order_secret,
      receipt_note: "Comprovante enviado no Passo 3",
      receipt_file_b64: tinyPngB64,
      receipt_file_mime: "image/png",
      receipt_file_name: "pix.png",
    }),
  });
  assert.equal(resReceipt.status, 200);
  const bodyReceipt = await resReceipt.json();
  assert.equal(bodyReceipt.ok, true);
  assert.equal(bodyReceipt.status, "receipt_submitted");
  assert.equal(Boolean(bodyReceipt.license_key), false);

  // 4) Invalid key check
  const resBad = await fetch(`${baseUrl}/api/v1/licenses/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: "OI6-INVALID-0000", hwid: "web-Win32" }),
  });
  assert.equal(resBad.status, 401);
  const bodyBad = await resBad.json();
  assert.equal(bodyBad.ok, false);

  // 5) Valid OpenInfinite/InfiniteClaude keys (OI6-INF, OI6-PRO, IC6-PRO, IC6-MAX) and BadClaude L3+ (BC5-FND) -> includesOpenInfinite: true
  for (const k of [infKey, proKey, claudeKey, maxKey, maxCompatKey, founderKey]) {
    const resValid = await fetch(`${baseUrl}/api/v1/licenses/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: k, hwid: "web-Win32" }),
    });
    assert.equal(resValid.status, 200);
    const bodyValid = await resValid.json();
    assert.equal(bodyValid.ok, true);
    assert.equal(bodyValid.includesOpenInfinite, true);
    if (k === claudeKey || k === maxKey || k === maxCompatKey || k === founderKey) {
      assert.equal(bodyValid.includesInfiniteClaude, true);
    } else {
      assert.equal(bodyValid.includesInfiniteClaude, false);
    }
  }

  // 6) BadClaude L1/L2 key -> includesOpenInfinite: false
  const resL1 = await fetch(`${baseUrl}/api/v1/licenses/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: basicKey, hwid: "web-Win32" }),
  });
  assert.equal(resL1.status, 200);
  const bodyL1 = await resL1.json();
  assert.equal(bodyL1.ok, true);
  assert.equal(bodyL1.includesOpenInfinite, false);
});
