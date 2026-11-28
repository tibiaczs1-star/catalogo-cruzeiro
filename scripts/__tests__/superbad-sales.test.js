"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");

const {
  createSuperbadSalesApi,
  hashScrypt,
} = require("../../badclaude-superbad-api");

const repoRoot = path.resolve(__dirname, "../..");

async function startFixture(t, { env = {}, options = {} } = {}) {
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "superbad-sales-test-"));
  const dataDir = path.join(tmpDir, "data");
  const releasesDir = path.join(tmpDir, "private_releases");
  await fsp.mkdir(dataDir, { recursive: true });
  await fsp.mkdir(releasesDir, { recursive: true });
  t.after(() => fsp.rm(tmpDir, { recursive: true, force: true }));

  const api = createSuperbadSalesApi({
    rootDir: tmpDir,
    dataDir,
    releasesDir,
    environment: { NODE_ENV: "test", ...env },
    sessionSecret: "test-session-secret-0123456789abcdef0123456789abcdef",
    downloadSecret: "test-download-secret-0123456789abcdef0123456789abcdef",
    ...options,
  });

  const server = http.createServer((req, res) => api.handleApi(req, res));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  async function reqJson(pathname, init = {}) {
    const res = await fetch(`${baseUrl}${pathname}`, {
      ...init,
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers || {}),
      },
    });
    const data = await res.json();
    return { status: res.status, headers: res.headers, data };
  }

  return { api, baseUrl, dataDir, releasesDir, reqJson };
}

test("unconfigured admin password fails closed across session, login, and admin orders", async (t) => {
  const { reqJson } = await startFixture(t, { env: {} });

  const sessionRes = await reqJson("/api/superbad/admin/session");
  assert.equal(sessionRes.status, 200);
  assert.deepEqual(sessionRes.data, {
    ok: true,
    authenticated: false,
    configured: false,
  });

  const loginRes = await reqJson("/api/superbad/admin/login", {
    method: "POST",
    body: JSON.stringify({ password: "anything" }),
  });
  assert.equal(loginRes.status, 503);
  assert.equal(loginRes.data.ok, false);

  const ordersRes = await reqJson("/api/superbad/admin/orders");
  assert.equal(ordersRes.status, 503);
  assert.equal(ordersRes.data.ok, false);
});

test("manual Pix order locks price at R$ 350,00 and protects order lookup with order_secret", async (t) => {
  const { reqJson } = await startFixture(t);

  const badReq = await reqJson("/api/superbad/orders", {
    method: "POST",
    body: JSON.stringify({ buyer_name: "", buyer_contact: "" }),
  });
  assert.equal(badReq.status, 400);

  const badEdition = await reqJson("/api/superbad/orders", {
    method: "POST",
    body: JSON.stringify({
      buyer_name: "Ana",
      buyer_contact: "68999990000",
      requested_edition: "enterprise",
    }),
  });
  assert.equal(badEdition.status, 400);

  // Attempt client-side price tampering — must be ignored and locked to 35000.
  const created = await reqJson("/api/superbad/orders", {
    method: "POST",
    body: JSON.stringify({
      buyer_name: "Maria Silva",
      buyer_contact: "68 99999-1111",
      requested_edition: "superbad",
      amount_centavos: 100,
      status: "approved",
    }),
  });
  assert.equal(created.status, 201);
  assert.equal(created.data.ok, true);
  const { order } = created.data;
  assert.ok(order.order_id.startsWith("SB-"));
  assert.ok(order.order_secret.length >= 20);
  assert.equal(order.status, "pending_pix");
  assert.equal(order.amount_centavos, 35000);
  assert.equal(order.amount_display, "R$ 350,00");
  assert.equal(order.requested_edition, "superbad");
  assert.equal(order.payment_provider, "pix_manual");
  assert.equal(order.pix.key, "68 99226-9296");
  assert.equal(order.pix.recipient, "Raiane Leoncio");
  assert.match(order.pix.brcode, /5406350\.00/);
  assert.match(order.pix.qr_data_url, /^data:image\/png;base64,/);
  assert.match(order.whatsapp_url, /^https:\/\/wa\.me\/5568992269296\?text=/);

  // Enumeration without or with wrong secret must fail with 403.
  const noSecret = await reqJson(`/api/superbad/orders/${order.order_id}`);
  assert.equal(noSecret.status, 403);
  const wrongSecret = await reqJson(
    `/api/superbad/orders/${order.order_id}?order_secret=wrong-secret`
  );
  assert.equal(wrongSecret.status, 403);
  const unknownOrder = await reqJson(
    `/api/superbad/orders/SB-DOESNOTEXIST?order_secret=${encodeURIComponent(order.order_secret)}`
  );
  assert.equal(unknownOrder.status, 403);

  // Lookup succeeds via query param or x-order-secret header.
  const byQuery = await reqJson(
    `/api/superbad/orders/${order.order_id}?order_secret=${encodeURIComponent(order.order_secret)}`
  );
  assert.equal(byQuery.status, 200);
  assert.equal(byQuery.data.order.status, "pending_pix");
  assert.equal(byQuery.data.order.order_secret, undefined);

  const byHeader = await reqJson(`/api/superbad/orders/${order.order_id}`, {
    headers: { "x-order-secret": order.order_secret },
  });
  assert.equal(byHeader.status, 200);

  // Receipt submission requires valid secret and non-empty note.
  const emptyReceipt = await reqJson(`/api/superbad/orders/${order.order_id}/receipt`, {
    method: "POST",
    body: JSON.stringify({ order_secret: order.order_secret, receipt_note: "   " }),
  });
  assert.equal(emptyReceipt.status, 400);

  const badReceiptSecret = await reqJson(`/api/superbad/orders/${order.order_id}/receipt`, {
    method: "POST",
    body: JSON.stringify({ order_secret: "nope", receipt_note: "E123456" }),
  });
  assert.equal(badReceiptSecret.status, 403);

  const okReceipt = await reqJson(`/api/superbad/orders/${order.order_id}/receipt`, {
    method: "POST",
    body: JSON.stringify({
      order_secret: order.order_secret,
      receipt_note: "Comprovante enviado no WhatsApp TX9988",
    }),
  });
  assert.equal(okReceipt.status, 200);
  assert.equal(okReceipt.data.order.status, "receipt_submitted");
  assert.equal(okReceipt.data.order.receipt_note, "Comprovante enviado no WhatsApp TX9988");
});

test("admin login supports scrypt hash env, rate limits failures, sets HttpOnly SameSite=Strict cookie, and redacts store", async (t) => {
  const adminSecret = "TestAdminPass!2026";
  const adminHash = hashScrypt(adminSecret);
  const { reqJson, dataDir } = await startFixture(t, {
    env: { SUPERBAD_ADMIN_PASSWORD_HASH: adminHash },
    options: { loginMaxAttempts: 3, secureCookies: true },
  });

  // Unauthenticated admin access fails with 401.
  const unauthOrders = await reqJson("/api/superbad/admin/orders");
  assert.equal(unauthOrders.status, 401);

  // Rate limit triggers after 3 failed login attempts.
  for (let i = 0; i < 3; i += 1) {
    const failRes = await reqJson("/api/superbad/admin/login", {
      method: "POST",
      body: JSON.stringify({ password: "wrong-password" }),
    });
    assert.equal(failRes.status, 401);
  }
  const lockedRes = await reqJson("/api/superbad/admin/login", {
    method: "POST",
    body: JSON.stringify({ password: adminSecret }),
  });
  assert.equal(lockedRes.status, 429);
  assert.ok(Number(lockedRes.headers.get("retry-after")) >= 1);

  // Fresh fixture with plaintext env password checks login + cookie + logout.
  const fresh = await startFixture(t, {
    env: { SUPERBAD_ADMIN_PASSWORD: adminSecret },
    options: { secureCookies: true },
  });

  const loginOk = await fresh.reqJson("/api/superbad/admin/login", {
    method: "POST",
    body: JSON.stringify({ password: adminSecret }),
  });
  assert.equal(loginOk.status, 200);
  assert.equal(loginOk.data.authenticated, true);
  const setCookie = loginOk.headers.get("set-cookie");
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Strict/);
  assert.match(setCookie, /Secure/);
  const cookiePair = setCookie.split(";")[0];

  const sessionAuth = await fresh.reqJson("/api/superbad/admin/session", {
    headers: { Cookie: cookiePair },
  });
  assert.deepEqual(sessionAuth.data, {
    ok: true,
    authenticated: true,
    configured: true,
  });

  // Create order, authorize it as Beta, ensure secret hashes are never exposed.
  const created = await fresh.reqJson("/api/superbad/orders", {
    method: "POST",
    body: JSON.stringify({
      buyer_name: "Carlos Teste",
      buyer_contact: "carlos@example.com",
      requested_edition: "beta",
    }),
  });
  const orderId = created.data.order.order_id;

  const authRes = await fresh.reqJson(`/api/superbad/admin/orders/${orderId}/authorize`, {
    method: "POST",
    headers: { Cookie: cookiePair },
    body: JSON.stringify({ edition: "beta", expires_in_days: 15, max_downloads: 2 }),
  });
  assert.equal(authRes.status, 200);
  assert.equal(authRes.data.ok, true);
  assert.equal(authRes.data.license.edition, "beta");
  assert.equal(authRes.data.license.max_downloads, 2);
  assert.match(authRes.data.license_key, /^BT-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);

  const rawStoreText = await fsp.readFile(path.join(fresh.dataDir, "superbad-orders.json"), "utf8");
  assert.equal(rawStoreText.includes(authRes.data.license_key), false);
  assert.equal(rawStoreText.includes(created.data.order.order_secret), false);
  assert.match(rawStoreText, /scrypt\$/);

  const adminOrders = await fresh.reqJson("/api/superbad/admin/orders", {
    headers: { Cookie: cookiePair },
  });
  assert.equal(adminOrders.status, 200);
  assert.equal(adminOrders.data.orders.length, 1);
  assert.equal(adminOrders.data.orders[0].order_secret_hash, undefined);
  assert.equal(adminOrders.data.licenses.length, 1);
  assert.equal(adminOrders.data.licenses[0].key_hash, undefined);
  assert.equal(adminOrders.data.licenses[0].license_key, undefined);

  const logoutRes = await fresh.reqJson("/api/superbad/admin/logout", {
    method: "POST",
    headers: { Cookie: cookiePair },
  });
  assert.equal(logoutRes.status, 200);
  assert.match(logoutRes.headers.get("set-cookie"), /Max-Age=0/);
});

test("license validation, private download streaming, missing archive 404, download counter, expiration, and revocation", async (t) => {
  const adminSecret = "SuperBadAdmin#99";
  const { baseUrl, releasesDir, dataDir, reqJson } = await startFixture(t, {
    env: { SUPERBAD_ADMIN_PASSWORD: adminSecret },
  });

  const loginRes = await reqJson("/api/superbad/admin/login", {
    method: "POST",
    body: JSON.stringify({ password: adminSecret }),
  });
  const cookie = loginRes.headers.get("set-cookie").split(";")[0];

  const orderRes = await reqJson("/api/superbad/orders", {
    method: "POST",
    body: JSON.stringify({
      buyer_name: "Joao Comprador",
      buyer_contact: "68991112222",
      requested_edition: "superbad",
    }),
  });
  const orderId = orderRes.data.order.order_id;

  const authRes = await reqJson(`/api/superbad/admin/orders/${orderId}/authorize`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: JSON.stringify({ edition: "superbad", expires_in_days: 30, max_downloads: 2 }),
  });
  assert.equal(authRes.status, 200);
  const licenseKey = authRes.data.license_key;
  const licenseId = authRes.data.license.license_id;
  assert.match(licenseKey, /^SB-/);

  // Invalid license key returns 401.
  const invalidValidate = await reqJson("/api/superbad/license/validate", {
    method: "POST",
    body: JSON.stringify({ license_key: "SB-AAAA-BBBB-CCCC-DDDD" }),
  });
  assert.equal(invalidValidate.status, 401);

  // Valid license key issues temporary signed download URL.
  const validRes = await reqJson("/api/superbad/license/validate", {
    method: "POST",
    body: JSON.stringify({ license_key: licenseKey }),
  });
  assert.equal(validRes.status, 200);
  assert.equal(validRes.data.ok, true);
  assert.equal(validRes.data.edition, "superbad");
  assert.equal(validRes.data.downloads_remaining, 2);
  assert.match(validRes.data.download_url, /^\/api\/superbad\/download\?token=/);

  assert.equal(validRes.data.macos_download_url, undefined);
  for (const platform of ["mac", "macos", "darwin"]) {
    const withdrawn = await reqJson(validRes.data.download_url + "&platform=" + platform);
    assert.equal(withdrawn.status, 410);
    assert.equal(withdrawn.data.code, "RELEASE_WITHDRAWN");
  }

  // Tampered token is rejected.
  const tamperedDl = await fetch(`${baseUrl}${validRes.data.download_url}tampered`);
  assert.equal(tamperedDl.status, 403);

  // If private archive is not yet placed in private_releases/, returns graceful 404 JSON and does NOT burn a download.
  const missingArchive = await fetch(`${baseUrl}${validRes.data.download_url}`);
  assert.equal(missingArchive.status, 404);
  const missingPayload = await missingArchive.json();
  assert.equal(missingPayload.error, "release_archive_not_ready");

  // Place private release archive in private_releases/.
  const fakeZipContent = Buffer.from("PK\x03\x04SUPERBAD-PRIVATE-BUILD", "utf8");
  await fsp.writeFile(path.join(releasesDir, "BadClaudio-Desktop-SuperBad.zip"), fakeZipContent);

  // First download succeeds and increments counter (1 of 2 used).
  const dl1 = await fetch(`${baseUrl}${validRes.data.download_url}`);
  assert.equal(dl1.status, 200);
  assert.equal(dl1.headers.get("content-type"), "application/zip");
  assert.match(dl1.headers.get("content-disposition"), /BadClaudio-Desktop-SuperBad\.zip/);
  const dl1Bytes = Buffer.from(await dl1.arrayBuffer());
  assert.deepEqual(dl1Bytes, fakeZipContent);

  // Re-validate shows 1 download remaining.
  const validRes2 = await reqJson("/api/superbad/license/validate", {
    method: "POST",
    body: JSON.stringify({ license_key: licenseKey }),
  });
  assert.equal(validRes2.status, 200);
  assert.equal(validRes2.data.downloads_remaining, 1);

  // Second download succeeds (2 of 2 used).
  const dl2 = await fetch(`${baseUrl}${validRes2.data.download_url}`);
  assert.equal(dl2.status, 200);
  await dl2.arrayBuffer();

  // Third download with existing token is blocked (403), and validate is blocked (403).
  const dl3 = await fetch(`${baseUrl}${validRes2.data.download_url}`);
  assert.equal(dl3.status, 403);
  const exhaustedValidate = await reqJson("/api/superbad/license/validate", {
    method: "POST",
    body: JSON.stringify({ license_key: licenseKey }),
  });
  assert.equal(exhaustedValidate.status, 403);

  // Authorize another order, then test immediate revocation.
  const order2 = await reqJson("/api/superbad/orders", {
    method: "POST",
    body: JSON.stringify({ buyer_name: "Paula", buyer_contact: "paula@example.com" }),
  });
  const auth2 = await reqJson(`/api/superbad/admin/orders/${order2.data.order.order_id}/authorize`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: JSON.stringify({ edition: "beta", expires_in_days: 10, max_downloads: 5 }),
  });
  const validBeta = await reqJson("/api/superbad/license/validate", {
    method: "POST",
    body: JSON.stringify({ license_key: auth2.data.license_key }),
  });
  assert.equal(validBeta.status, 200);

  const revokeRes = await reqJson(`/api/superbad/admin/licenses/${auth2.data.license.license_id}/revoke`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  assert.equal(revokeRes.status, 200);
  assert.equal(revokeRes.data.revoked, true);

  const afterRevokeValidate = await reqJson("/api/superbad/license/validate", {
    method: "POST",
    body: JSON.stringify({ license_key: auth2.data.license_key }),
  });
  assert.equal(afterRevokeValidate.status, 403);

  const afterRevokeDl = await fetch(`${baseUrl}${validBeta.data.download_url}`);
  assert.equal(afterRevokeDl.status, 403);

  // Verify expiration check as well.
  const storePath = path.join(dataDir, "superbad-orders.json");
  const storeJson = JSON.parse(await fsp.readFile(storePath, "utf8"));
  const origLic = storeJson.licenses.find((l) => l.license_id === licenseId);
  origLic.downloads_used = 0;
  origLic.expires_at = new Date(Date.now() - 60_000).toISOString();
  await fsp.writeFile(storePath, JSON.stringify(storeJson, null, 2), "utf8");

  const expiredValidate = await reqJson("/api/superbad/license/validate", {
    method: "POST",
    body: JSON.stringify({ license_key: licenseKey }),
  });
  assert.equal(expiredValidate.status, 403);
});

test("server.js keeps private_releases and backend modules blocked from static serving and wires SuperBad routes", () => {
  const serverSource = fs.readFileSync(path.join(repoRoot, "server.js"), "utf8");
  const apiSource = fs.readFileSync(path.join(repoRoot, "badclaude-superbad-api.js"), "utf8");

  assert.match(serverSource, /"badclaude-superbad-api\.js"/);
  assert.match(serverSource, /"private_releases"/);
  assert.match(serverSource, /pathname\.startsWith\("\/api\/superbad\/"\)/);
  assert.match(serverSource, /pathname === "\/superbad-texte"/);
  assert.match(serverSource, /pathname === "\/superbad-admin"/);
  assert.match(serverSource, /badclaudeRoot\}\$\{path\.sep\}/);

  // Ensure no hardcoded admin password exists in badclaude-superbad-api.js
  assert.match(apiSource, /SUPERBAD_ADMIN_PASSWORD/);
  assert.match(apiSource, /SUPERBAD_ADMIN_PASSWORD_HASH/);
  assert.match(apiSource, /timingSafeEqual/);
  assert.match(apiSource, /scryptSync/);
  assert.doesNotMatch(apiSource, /admin123|senha123/);
  assert.doesNotMatch(apiSource, /(?:adminPassword|password)\s*===?\s*["'](?!string["'])[^"']{3,}["']/i);
});


test("admin release upload and listing require session, validate PK ZIP signature, enforce size limit, and feed private download", async (t) => {
  const adminSecret = "ReleaseAdmin!2026";
  const { baseUrl, reqJson } = await startFixture(t, {
    env: { SUPERBAD_ADMIN_PASSWORD: adminSecret },
    options: { maxReleaseBytes: 1024 },
  });

  // Unauthenticated access is blocked.
  const unauthList = await reqJson("/api/superbad/admin/releases");
  assert.equal(unauthList.status, 401);

  const unauthUpload = await fetch(`${baseUrl}/api/superbad/admin/releases/beta`, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: Buffer.from("PK\x03\x04hello"),
  });
  assert.equal(unauthUpload.status, 401);

  const loginRes = await reqJson("/api/superbad/admin/login", {
    method: "POST",
    body: JSON.stringify({ password: adminSecret }),
  });
  const cookie = loginRes.headers.get("set-cookie").split(";")[0];

  const listEmpty = await reqJson("/api/superbad/admin/releases", {
    headers: { Cookie: cookie },
  });
  assert.equal(listEmpty.status, 200);
  assert.equal(listEmpty.data.releases_dir_configured, true);
  assert.equal(listEmpty.data.releases.length, 9);
  assert.ok(listEmpty.data.releases.every((r) => r.exists === false));

  // Reject invalid edition, bad content-type, non-ZIP body, and oversized upload.
  const badEdition = await fetch(`${baseUrl}/api/superbad/admin/releases/pro`, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/octet-stream" },
    body: Buffer.from("PK\x03\x04hello"),
  });
  assert.equal(badEdition.status, 400);

  const badType = await fetch(`${baseUrl}/api/superbad/admin/releases/beta`, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: Buffer.from("PK\x03\x04hello"),
  });
  assert.equal(badType.status, 415);

  const badMagic = await fetch(`${baseUrl}/api/superbad/admin/releases/beta`, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/octet-stream" },
    body: Buffer.from("NOT_A_ZIP_FILE"),
  });
  assert.equal(badMagic.status, 400);

  const tooBig = await fetch(`${baseUrl}/api/superbad/admin/releases/beta`, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/octet-stream" },
    body: Buffer.concat([Buffer.from("PK\x03\x04"), Buffer.alloc(1200, 0x41)]),
  });
  assert.equal(tooBig.status, 413);

  // Valid upload of Beta ZIP.
  const betaZip = Buffer.from("PK\x03\x04BETA-PRIVATE-ARCHIVE", "utf8");
  const uploadRes = await fetch(`${baseUrl}/api/superbad/admin/releases/beta`, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/octet-stream" },
    body: betaZip,
  });
  assert.equal(uploadRes.status, 200);
  const uploadData = await uploadRes.json();
  assert.deepEqual(uploadData, {
    ok: true,
    edition: "beta",
    filename: "BadClaudio-Desktop-Beta.zip",
    size_bytes: betaZip.length,
  });

  const listAfter = await reqJson("/api/superbad/admin/releases", {
    headers: { Cookie: cookie },
  });
  assert.equal(listAfter.status, 200);
  const betaItem = listAfter.data.releases.find((r) => r.edition === "beta");
  assert.equal(betaItem.exists, true);
  assert.equal(betaItem.size_bytes, betaZip.length);
  assert.ok(betaItem.updated_at);

  // Authorize an order and download the uploaded Beta ZIP via license token.
  const ord = await reqJson("/api/superbad/orders", {
    method: "POST",
    body: JSON.stringify({ buyer_name: "Ana", buyer_contact: "ana@example.com", requested_edition: "beta" }),
  });
  const auth = await reqJson(`/api/superbad/admin/orders/${ord.data.order.order_id}/authorize`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: JSON.stringify({ edition: "beta", expires_in_days: 7, max_downloads: 3 }),
  });
  const val = await reqJson("/api/superbad/license/validate", {
    method: "POST",
    body: JSON.stringify({ license_key: auth.data.license_key }),
  });
  const dl = await fetch(`${baseUrl}${val.data.download_url}`);
  assert.equal(dl.status, 200);
  assert.deepEqual(Buffer.from(await dl.arrayBuffer()), betaZip);
});

test("legacy badclaude-venda admin routes require admin authentication and harden receipt download headers", async (t) => {
  const { criarVendaBadclaude } = require("../../badclaude-venda");
  const QRCode = require("qrcode");

  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "badclaude-venda-sec-"));
  t.after(() => fsp.rm(tmpDir, { recursive: true, force: true }));

  let allowAdmin = false;
  const venda = criarVendaBadclaude({
    dataDir: tmpDir,
    qrcode: QRCode,
    isAdmin: () => allowAdmin,
    sendJson(res, status, payload) {
      const body = JSON.stringify(payload);
      res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
      res.end(body);
    },
    parseBody(req) {
      return new Promise((resolve) => {
        let raw = "";
        req.on("data", (c) => { raw += c; });
        req.on("end", () => {
          try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); }
        });
      });
    },
  });

  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, "http://127.0.0.1").pathname;
    return venda.tratar(req, res, pathname);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  // Create order + upload receipt as public user.
  const orderRes = await fetch(`${baseUrl}/api/badclaude/pedido`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plano: "dez", nome: "Teste", contato: "teste@example.com" }),
  });
  assert.equal(orderRes.status, 201);
  const { pedido } = await orderRes.json();

  const receiptRes = await fetch(`${baseUrl}/api/badclaude/pedido/${pedido.id}/comprovante`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      base64: Buffer.from("PNGDATA").toString("base64"),
      nomeArquivo: "recibo.png",
      observacao: "ok",
    }),
  });
  assert.equal(receiptRes.status, 200);

  // Unauthenticated admin calls must fail closed with 401.
  assert.equal((await fetch(`${baseUrl}/api/badclaude/admin/pedidos`)).status, 401);
  assert.equal(
    (await fetch(`${baseUrl}/api/badclaude/admin/pedido/${pedido.id}/aprovar`, { method: "POST" })).status,
    401
  );
  assert.equal(
    (await fetch(`${baseUrl}/api/badclaude/admin/pedido/${pedido.id}/comprovante`)).status,
    401
  );

  // Authenticated admin succeeds and receipt download includes nosniff + attachment disposition.
  allowAdmin = true;
  const adminPedidos = await fetch(`${baseUrl}/api/badclaude/admin/pedidos`);
  assert.equal(adminPedidos.status, 200);

  const adminReceipt = await fetch(`${baseUrl}/api/badclaude/admin/pedido/${pedido.id}/comprovante`);
  assert.equal(adminReceipt.status, 200);
  assert.equal(adminReceipt.headers.get("x-content-type-options"), "nosniff");
  assert.match(adminReceipt.headers.get("content-disposition"), /^attachment; filename="/);
});

test(".gitignore and render.yaml protect private releases and declare SuperBad env vars without hardcoded secrets", () => {
  const gitignore = fs.readFileSync(path.join(repoRoot, ".gitignore"), "utf8");
  const renderYaml = fs.readFileSync(path.join(repoRoot, "render.yaml"), "utf8");
  const serverSource = fs.readFileSync(path.join(repoRoot, "server.js"), "utf8");

  assert.match(gitignore, /^private_releases\/$/m);
  assert.match(gitignore, /^data\/superbad-\*\.json$/m);

  assert.match(renderYaml, /key:\s*SUPERBAD_ADMIN_PASSWORD_HASH\r?\n\s*sync:\s*false/);
  assert.match(renderYaml, /key:\s*SUPERBAD_SESSION_SECRET\r?\n\s*sync:\s*false/);
  assert.match(
    renderYaml,
    /key:\s*BADCLAUDE_RELEASES_DIR\r?\n\s*value:\s*\/opt\/render\/project\/src\/render-data\/private_releases/
  );
  assert.match(serverSource, /isAdmin:\s*requireAdmin/);
});

test("a paused store rejects new orders before payment generation", async (t) => {
  const { reqJson } = await startFixture(t, { options: { acceptNewOrders: false } });
  const result = await reqJson("/api/superbad/orders", { method: "POST", body: "{}" });
  assert.equal(result.status, 503);
  assert.equal(result.data.code, "SALES_PAUSED");
});
