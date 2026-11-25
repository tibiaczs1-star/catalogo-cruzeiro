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

test("OpenInfinite route, monthly R$99/R$159 checkout, living hero, clean photos and BadClaude L3+ inclusion are configured", () => {
  const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
  const oiHtml = fs.readFileSync(path.join(root, "openinfinite", "index.html"), "utf8");
  const bcHtml = fs.readFileSync(path.join(root, "badclaude", "index.html"), "utf8");
  const sbHtml = fs.readFileSync(path.join(root, "badclaude", "superbad-texte", "index.html"), "utf8");
  const apiJs = fs.readFileSync(path.join(root, "badclaude-superbad-api.js"), "utf8");

  assert.match(server, /pathname === "\/openinfinite"/);
  assert.match(server, /Location: "\/openinfinite\/"/);
  assert.match(server, /pathname\.startsWith\("\/openinfinite\/"\)/);
  assert.match(server, /"\.exe"/);
  assert.match(server, /"\.dmg"/);

  assert.match(oiHtml, /\/downloads\/OpenInfinite-Client-Setup\.exe/);
  assert.match(oiHtml, /\/downloads\/OpenInfinite-Client-macOS\.dmg/);
  assert.match(oiHtml, /R\$ 99,00/);
  assert.match(oiHtml, /R\$ 159,00/);
  assert.match(oiHtml, /id="livingStage"/);
  assert.match(oiHtml, /id="livingCore"/);
  assert.match(oiHtml, /id="checkout"/);
  assert.match(oiHtml, /id="orderForm"/);
  assert.match(oiHtml, /3º nível|3º Nível/i);
  assert.match(oiHtml, /Cockpit Pro/);
  assert.match(oiHtml, /Fundador VIP/);
  assert.match(oiHtml, /href="\/badclaude\//);
  assert.doesNotMatch(oiHtml, /4114|demo_lock|shift_i\.png|NÃO é vendido separado|não é vendido avulso/i);

  assert.ok(!fs.existsSync(path.join(root, "openinfinite", "assets", "openinfinite_demo_lock.png")));
  assert.ok(!fs.existsSync(path.join(root, "openinfinite", "assets", "openinfinite_shift_i.png")));
  assert.ok(fs.existsSync(path.join(root, "openinfinite", "assets", "openinfinite_estatisticas.png")));

  assert.match(bcHtml, /OpenInfinite/);
  assert.match(sbHtml, /OpenInfinite/);
  assert.match(bcHtml, /\/openinfinite\//);
  assert.match(sbHtml, /\/openinfinite\//);

  assert.match(apiJs, /includesOpenInfinite/);
  assert.match(apiJs, /R\$ 99,00/);
  assert.match(apiJs, /R\$ 159,00/);
});

test("OpenInfinite UI enforces WCAG AA patterns, inline PIX/license states without alert(), WAI-ARIA tabs, comparator and CSS Grid FAQ", () => {
  const oiHtml = fs.readFileSync(path.join(root, "openinfinite", "index.html"), "utf8");

  // Zero raw alert() calls and zero Private Use Area Apple glyph (\uF8FF) that renders as tofu on Windows
  assert.doesNotMatch(oiHtml, /\balert\s*\(/);
  assert.doesNotMatch(oiHtml, /\uF8FF/);
  assert.match(oiHtml, /scroll-margin-top:/);
  assert.match(oiHtml, /outline-offset:\s*-3px/);

  // Skip link, keyboard focus ring, and WAI-ARIA tabs + keyboard handlers
  assert.match(oiHtml, /class="skip-link"/);
  assert.match(oiHtml, /:focus-visible/);
  assert.match(oiHtml, /role="tablist"/);
  assert.match(oiHtml, /role="tabpanel"/);
  assert.match(oiHtml, /ArrowRight/);
  assert.match(oiHtml, /ArrowLeft/);

  // Interactive language/stack focus pills in cockpit simulator
  assert.match(oiHtml, /data-lang="python"/);
  assert.match(oiHtml, /data-lang="ts"/);
  assert.match(oiHtml, /data-lang="go"/);
  assert.match(oiHtml, /data-lang="rust"/);

  // Interactive comparator (Demo 1h vs Windows R$ 99 vs macOS R$ 159)
  assert.match(oiHtml, /id="comparador"/);
  assert.match(oiHtml, /data-comp="demo"/);
  assert.match(oiHtml, /data-comp="infinite"/);
  assert.match(oiHtml, /data-comp="infinite_pro"/);

  // Expandable FAQ using compositor-friendly CSS Grid 0fr -> 1fr
  assert.match(oiHtml, /id="faq"/);
  assert.match(oiHtml, /grid-template-rows:\s*0fr/);
  assert.match(oiHtml, /grid-template-rows:\s*1fr/);
  assert.match(oiHtml, /class="faq-trigger"[^>]*aria-expanded=/);

  // Inline PIX copy + inline error/offline/retry UX
  assert.match(oiHtml, /id="copyPixBtn"/);
  assert.match(oiHtml, /id="pixCopyFeedback"/);
  assert.match(oiHtml, /id="copyBrcodeBtn"/);
  assert.match(oiHtml, /id="orderErrorBox"/);
  assert.match(oiHtml, /id="retryOrderBtn"/);
  assert.match(oiHtml, /retryVerifyBtn/);
  assert.match(oiHtml, /navigator\.onLine === false/);

  // Parse inline <script> block with Node VM to guarantee zero JS syntax errors
  const scriptMatch = oiHtml.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(scriptMatch, "Expected inline <script> in openinfinite/index.html");
  assert.doesNotThrow(() => new vm.Script(scriptMatch[1], { filename: "openinfinite/index.html" }));
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
      buyer_contact: "68999990000",
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
      buyer_contact: "joao@example.com",
      requested_edition: "infinite_pro",
    }),
  });
  assert.equal(resMac.status, 201);
  const bodyMac = await resMac.json();
  assert.equal(bodyMac.ok, true);
  assert.equal(bodyMac.order.amount_centavos, 15900);
  assert.equal(bodyMac.order.amount_display, "R$ 159,00");

  // 3) Invalid key check
  const resBad = await fetch(`${baseUrl}/api/v1/licenses/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: "OI6-INVALID-0000", hwid: "web-Win32" }),
  });
  assert.equal(resBad.status, 401);
  const bodyBad = await resBad.json();
  assert.equal(bodyBad.ok, false);

  // 4) Valid OpenInfinite keys (OI6-INF, OI6-PRO) and BadClaude L3+ (BC5-FND) -> includesOpenInfinite: true
  for (const k of [infKey, proKey, founderKey]) {
    const resValid = await fetch(`${baseUrl}/api/v1/licenses/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: k, hwid: "web-Win32" }),
    });
    assert.equal(resValid.status, 200);
    const bodyValid = await resValid.json();
    assert.equal(bodyValid.ok, true);
    assert.equal(bodyValid.includesOpenInfinite, true);
  }

  // 5) BadClaude L1/L2 key -> includesOpenInfinite: false
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
