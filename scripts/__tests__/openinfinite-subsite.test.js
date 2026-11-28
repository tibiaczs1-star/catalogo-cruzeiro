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

test("OpenInfinite announces pending unified installers and directs existing customers to order support", () => {
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

  assert.doesNotMatch(oiHtml, /href="\/downloads\/|href="[^"]*checkout\/\?plan=|curl -fsSL|irm https:/);
  assert.match(oiHtml, /Três planos em preparação/);
  assert.match(oiHtml, /Novas compras estão pausadas/);
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
  assert.match(oiHtml, /href="\/openinfinite\/checkout\/"/);
  assert.match(oiHtml, /Instaladores em validação/);
  assert.match(oiHtml, /Claude no desktop/);
  assert.match(oiHtml, /id="painel-live"/);
  assert.match(oiHtml, /id="stage3dTheater"/);
  assert.match(oiHtml, /id="deviceRig"/);
  assert.match(oiHtml, /id="cockpitPanel"/);
  assert.match(oiHtml, /id="orbitalCarousel"/);
  assert.match(oiHtml, /id="orbitToggleBtn"/);
  assert.match(oiHtml, /id="orbitProgressLabel"/);
  assert.match(oiHtml, /id="orbitProgressFill"/);
  assert.match(oiHtml, /id="tab-dev-mac"/);
  assert.match(oiHtml, /id="tab-dev-win"/);
  assert.match(oiHtml, /id="tab-dev-linux"/);
  assert.match(oiHtml, /id="nextDeviceBtn"/);
  assert.match(oiHtml, /id="toggleAppBtn"/);
  assert.match(oiHtml, /id="zoomModal"/);
  assert.match(oiHtml, /id="stageZoomBtn"/);
  assert.match(oiHtml, /id="captionZoomBtn"/);
  assert.match(oiHtml, /class="arena-architecture"/);
  assert.match(oiHtml, /class="arena-hairlines"/);
  assert.match(oiHtml, /class="arena-volumetric-light"/);
  assert.match(oiHtml, /class="arena-floor-grid"/);
  assert.match(oiHtml, /hw-bezel-slice-1/);
  assert.match(oiHtml, /hw-bezel-slice-2/);
  assert.match(oiHtml, /hw-bezel-slice-3/);
  assert.match(oiHtml, /hw-edge-left/);
  assert.match(oiHtml, /hw-edge-right/);
  assert.match(oiHtml, /hw-edge-top/);
  assert.match(oiHtml, /kb-well-mac/);
  assert.match(oiHtml, /trackpad-mac/);
  assert.match(oiHtml, /pc-chamber/);
  assert.match(oiHtml, /pc-tower-front-mesh/);
  assert.match(oiHtml, /kb-well-linux/);
  assert.match(oiHtml, /trackpoint-dot/);
  assert.match(oiHtml, /hw-iridescent-rim/);
  assert.match(oiHtml, /hud-glass-pill/);
  assert.match(oiHtml, /class="pc-tower"/);
  assert.match(oiHtml, /class="pc-tower-strip"/);
  assert.match(oiHtml, /id="winHudLabel"/);

  const orbitSlots = [...oiHtml.matchAll(/<div\s+class="orbit-slot"\s+data-device="(mac|windows|linux)"/g)];
  assert.deepEqual(
    orbitSlots.map((m) => m[1]),
    ["mac", "windows", "linux"]
  );
  assert.equal((oiHtml.match(/class="orbit-slot"/g) || []).length, 3);
  assert.match(oiHtml, /id="macSlotImg"[^>]*src="\/openinfinite\/assets\/hero_mac_liquid_glass\.png"/);
  assert.match(oiHtml, /id="winSlotImg"[^>]*src="\/openinfinite\/assets\/hero_win_openinfinite\.png"/);
  assert.match(oiHtml, /id="linuxSlotImg"[^>]*src="\/openinfinite\/assets\/hero_linux_vps_tui\.png"/);
  assert.match(oiHtml, /\/openinfinite\/assets\/hero_mac_liquid_glass\.png/);
  assert.match(oiHtml, /\/openinfinite\/assets\/hero_win_infiniteclaude\.png/);
  assert.match(oiHtml, /\/openinfinite\/assets\/hero_win_openinfinite\.png/);
  assert.match(oiHtml, /\/openinfinite\/assets\/hero_linux_vps_tui\.png/);
  assert.match(oiHtml, /transform-style:\s*preserve-3d/);
  assert.match(oiHtml, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(oiHtml, /overflow-x:\s*hidden/);
  assert.match(oiHtml, /overflow-x:\s*clip/);
  assert.match(oiHtml, /requestAnimationFrame/);
  assert.match(oiHtml, /AUTO_ORBIT_MS/);
  assert.match(oiHtml, /Pausar Giro/);
  assert.match(oiHtml, /Retomar Giro/);
  assert.match(oiHtml, /Ativar Giro 3D/);
  assert.match(oiHtml, /Modo Reduzido/);
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
  assert.doesNotMatch(checkoutHtml, /Raiane Leoncio/);
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

test("OpenInfinite customer area restores previous orders and validates keys without offering new payments", () => {
  const oiHtml = fs.readFileSync(path.join(root, "openinfinite", "index.html"), "utf8");
  const checkoutHtml = fs.readFileSync(path.join(root, "openinfinite", "checkout", "index.html"), "utf8");

  for (const doc of [oiHtml, checkoutHtml]) {
    assert.doesNotMatch(doc, /\balert\s*\(/);
    assert.doesNotMatch(doc, /\uF8FF/);
    assert.match(doc, /class="skip-link"/);
    assert.match(doc, /:focus-visible/);
  }

  assert.match(checkoutHtml, /navigator\.clipboard/);
  assert.doesNotMatch(checkoutHtml, /id="orderForm"|fetch\([\x27"]\/api\/superbad\/orders[\x27"]/);

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

  // Previous orders retain receipt review, contact and license delivery.
  assert.doesNotMatch(checkoutHtml, /id="step2Pix"/);
  assert.match(checkoutHtml, /id="step3Receipt"/);
  assert.match(checkoutHtml, /id="step4Analysis"/);
  assert.match(checkoutHtml, /id="receiptForm"/);
  assert.match(checkoutHtml, /id="receiptFileInput"/);
  assert.match(checkoutHtml, /id="receiptE2eInput"/);
  assert.match(checkoutHtml, /receipt_file_b64/);
  assert.match(checkoutHtml, /receipt_file_mime/);
  assert.match(checkoutHtml, /receipt_analysis/);
  assert.match(checkoutHtml, /whatsapp_immediate_url/);
  assert.match(checkoutHtml, /Falar com o atendimento no WhatsApp/);
  assert.match(checkoutHtml, /id="deliveredKeyBox"/);
  assert.match(checkoutHtml, /isKeyUnlockedStatus/);

  // Validator (#validador + #verifyKeyInput + ?test_key= URL auto-runner + canonical plan name without PII leak)
  assert.match(checkoutHtml, /id="validador"/);
  assert.match(checkoutHtml, /id="verifyKeyInput"/);
  assert.match(checkoutHtml, /params\.get\(['"]test_key['"]\)/);
  assert.match(checkoutHtml, /Testar Chave no Validador/);
  assert.match(checkoutHtml, /resolveCanonicalPlanName/);

  // New payment controls are gone; validation errors still allow a retry.
  assert.doesNotMatch(checkoutHtml, /id="copyPixBtn"/);
  assert.doesNotMatch(checkoutHtml, /id="pixCopyFeedback"/);
  assert.doesNotMatch(checkoutHtml, /id="copyBrcodeBtn"/);
  assert.doesNotMatch(checkoutHtml, /id="orderErrorBox"/);
  assert.doesNotMatch(checkoutHtml, /id="retryOrderBtn"/);
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

test("OpenInfinite 3D orbital hero stage drives continuous rAF motion, auto-orbit, pause/resume toggle, reduced-motion opt-in, slot focus, and Windows app swap", () => {
  const oiHtml = fs.readFileSync(path.join(root, "openinfinite", "index.html"), "utf8");
  const scriptMatch = oiHtml.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(scriptMatch, "Expected inline <script> in openinfinite/index.html");

  function makeStubEl(dataset = {}) {
    const attrs = {};
    const classes = new Set();
    const listeners = {};
    return {
      dataset: { ...dataset },
      style: {},
      textContent: "",
      src: "",
      alt: "",
      classList: {
        add: (c) => classes.add(c),
        remove: (c) => classes.delete(c),
        contains: (c) => classes.has(c),
        toggle: (c, force) => {
          const next = force === undefined ? !classes.has(c) : Boolean(force);
          if (next) classes.add(c);
          else classes.delete(c);
          return next;
        },
      },
      setAttribute: (k, v) => {
        attrs[k] = String(v);
      },
      getAttribute: (k) => (Object.prototype.hasOwnProperty.call(attrs, k) ? attrs[k] : null),
      addEventListener: (ev, fn) => {
        (listeners[ev] ||= []).push(fn);
      },
      click: (ev = {}) => {
        const event = {
          preventDefault() {},
          stopPropagation() {},
          target: { closest: () => null },
          ...ev,
        };
        for (const fn of listeners.click || []) fn(event);
      },
      focus() {},
      closest: () => null,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 1180, height: 478 }),
    };
  }

  function mountHero3dScript({ reducedMotion }) {
    const byId = new Map();
    const getEl = (id) => {
      if (!byId.has(id)) byId.set(id, makeStubEl());
      return byId.get(id);
    };
    const tabs = [
      ["tab-dev-mac", "mac"],
      ["tab-dev-win", "windows"],
      ["tab-dev-linux", "linux"],
    ].map(([id, device]) => {
      const el = makeStubEl({ device });
      byId.set(id, el);
      return el;
    });
    const slots = ["mac", "windows", "linux"].map((device) => makeStubEl({ device }));

    let nextRafId = 1;
    const rafQueue = new Map();
    const cancelledRafs = [];
    const mediaListeners = [];
    let nowMs = 0;

    vm.runInNewContext(scriptMatch[1], {
      window: {
        location: { search: "", hash: "", replace() {} },
        innerWidth: 1440,
        isSecureContext: true,
        matchMedia: () => ({
          matches: reducedMotion,
          addEventListener: (ev, fn) => {
            if (ev === "change") mediaListeners.push(fn);
          },
        }),
        requestAnimationFrame: (fn) => {
          const id = nextRafId++;
          rafQueue.set(id, fn);
          return id;
        },
        cancelAnimationFrame: (id) => {
          cancelledRafs.push(id);
          rafQueue.delete(id);
        },
        addEventListener() {},
      },
      document: {
        hidden: false,
        activeElement: null,
        getElementById: getEl,
        querySelectorAll: (sel) => {
          if (sel === '#deviceTabs [role="tab"]') return tabs;
          if (sel === "#orbitalCarousel .orbit-slot") return slots;
          return [];
        },
        createElement: () => makeStubEl(),
        body: makeStubEl(),
      },
      URLSearchParams,
      Image: function Image() {
        this.src = "";
      },
      performance: { now: () => nowMs },
      setTimeout,
    });

    function stepFrames(count, stepMs) {
      for (let i = 0; i < count; i += 1) {
        nowMs += stepMs;
        const pending = [...rafQueue.entries()];
        rafQueue.clear();
        for (const [, fn] of pending) fn(nowMs);
      }
    }

    return { getEl, tabs, slots, rafQueue, cancelledRafs, mediaListeners, stepFrames };
  }

  // 1) Default prefers-reduced-motion: no-preference
  const live = mountHero3dScript({ reducedMotion: false });
  const [slotMac, slotWin, slotLinux] = live.slots;
  const rig = live.getEl("deviceRig");
  const orbitToggleBtn = live.getEl("orbitToggleBtn");
  const orbitProgressLabel = live.getEl("orbitProgressLabel");
  const toggleAppBtn = live.getEl("toggleAppBtn");
  const winSlotImg = live.getEl("winSlotImg");
  const winHudLabel = live.getEl("winHudLabel");

  assert.equal(rig.getAttribute("data-device"), "mac");
  assert.equal(slotMac.getAttribute("data-orbit-pos"), "front");
  assert.equal(slotWin.getAttribute("data-orbit-pos"), "right");
  assert.equal(slotLinux.getAttribute("data-orbit-pos"), "left");
  assert.match(slotMac.style.transform, /90\.00px\)/);
  assert.equal(orbitToggleBtn.getAttribute("aria-pressed"), "false");
  assert.equal(orbitToggleBtn.textContent, "Pausar Giro");
  assert.equal(orbitProgressLabel.textContent, "Órbita 3D");

  // Two rAF frames (t=0 -> t=900ms) produce continuous 3D transform motion without user clicks
  live.stepFrames(1, 16);
  const t0Mac = slotMac.style.transform;
  const t0Rig = rig.style.transform;
  live.stepFrames(20, 45);
  assert.notEqual(slotMac.style.transform, t0Mac);
  assert.notEqual(rig.style.transform, t0Rig);

  // Waiting past ~3.8s auto-orbit interval advances the carousel automatically to windows
  live.stepFrames(90, 40);
  assert.equal(rig.getAttribute("data-device"), "windows");
  assert.equal(slotWin.getAttribute("data-orbit-pos"), "front");
  assert.equal(toggleAppBtn.style.display, "inline-flex");

  // #orbitToggleBtn pauses auto-orbit cleanly and resumes when clicked again
  orbitToggleBtn.click();
  assert.equal(orbitToggleBtn.getAttribute("aria-pressed"), "true");
  assert.equal(orbitToggleBtn.textContent, "Retomar Giro");
  assert.equal(orbitProgressLabel.textContent, "Pausado");
  live.stepFrames(110, 40);
  assert.equal(rig.getAttribute("data-device"), "windows");

  orbitToggleBtn.click();
  assert.equal(orbitToggleBtn.getAttribute("aria-pressed"), "false");
  assert.equal(orbitToggleBtn.textContent, "Pausar Giro");
  assert.equal(orbitProgressLabel.textContent, "Órbita 3D");

  // Clicking flanking linux slot focuses linux immediately
  slotLinux.click();
  assert.equal(rig.getAttribute("data-device"), "linux");
  assert.equal(slotLinux.getAttribute("data-orbit-pos"), "front");
  assert.equal(toggleAppBtn.style.display, "none");

  // Focusing windows tab + toggling OpenInfinite / InfiniteClaude swaps winSlotImg & HUD label
  live.tabs[1].click();
  assert.equal(rig.getAttribute("data-device"), "windows");
  assert.equal(winSlotImg.src, "/openinfinite/assets/hero_win_openinfinite.png");
  toggleAppBtn.click();
  assert.equal(winSlotImg.src, "/openinfinite/assets/hero_win_infiniteclaude.png");
  assert.equal(winHudLabel.textContent, "Win 10/11 · InfiniteClaude");
  toggleAppBtn.click();
  assert.equal(winSlotImg.src, "/openinfinite/assets/hero_win_openinfinite.png");

  // #nextDeviceBtn advances windows -> linux, and runtime reduce media change cancels rAF & syncs UI
  live.getEl("nextDeviceBtn").click();
  assert.equal(rig.getAttribute("data-device"), "linux");
  assert.equal(live.mediaListeners.length, 1);
  live.mediaListeners[0]({ matches: true });
  assert.ok(live.cancelledRafs.length >= 1);
  assert.equal(orbitToggleBtn.textContent, "Ativar Giro 3D");
  assert.equal(orbitToggleBtn.getAttribute("aria-pressed"), "true");
  assert.equal(orbitProgressLabel.textContent, "Modo Reduzido");

  // An initial reduced-motion preference keeps the stage still until enabled manually.
  const winPerf = mountHero3dScript({ reducedMotion: true });
  const winToggle = winPerf.getEl("orbitToggleBtn");
  const winLabel = winPerf.getEl("orbitProgressLabel");
  assert.equal(winPerf.rafQueue.size, 0);
  assert.equal(winToggle.textContent, "Ativar Giro 3D");
  assert.equal(winToggle.getAttribute("aria-pressed"), "true");
  assert.equal(winLabel.textContent, "Modo Reduzido");
  const initialTransform = winPerf.slots[0].style.transform;
  winPerf.stepFrames(20, 45);
  assert.equal(winPerf.slots[0].style.transform, initialTransform);

  winToggle.click();
  assert.equal(winToggle.textContent, "Pausar Giro");
  assert.equal(winToggle.getAttribute("aria-pressed"), "false");
  assert.equal(winLabel.textContent, "Órbita 3D");
});
