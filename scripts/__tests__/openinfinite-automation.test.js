"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");

const { createSuperbadSalesApi } = require("../../badclaude-superbad-api");

const repoRoot = path.resolve(__dirname, "../..");

function createEd25519TestSigner() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  const expSec = Math.floor((Date.now() + 30 * 86400000) / 1000);

  function mintLicenseKey(prefix, tier, edition, label, extraSalt = "") {
    const payloadB64 = Buffer.from(
      JSON.stringify({
        issuer: "juniorplay-local",
        tier,
        edition,
        label: `${label}${extraSalt}`,
        iat: Date.now(),
        exp: expSec,
      }),
      "utf8"
    ).toString("base64url");
    const signingInput = `${prefix}-${payloadB64}`;
    const sigB64 = crypto.sign(null, Buffer.from(signingInput, "utf8"), privateKey).toString("base64url");
    return `${signingInput}.${sigB64}`;
  }

  function signOwnerProof(method, pathname) {
    const ts = String(Date.now());
    const nonce = crypto.randomBytes(12).toString("hex");
    const msg = `owner-proof:${ts}:${nonce}:${String(method).toUpperCase()}:${pathname}`;
    const sig = crypto.sign(null, Buffer.from(msg, "utf8"), privateKey).toString("base64url");
    return `${ts}.${nonce}.${sig}`;
  }

  return { publicKeyPem, privateKey, mintLicenseKey, signOwnerProof };
}

async function startAutomationFixture(t, customEnv = {}, customOpts = {}) {
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "openinfinite-auto-test-"));
  const dataDir = path.join(tmpDir, "data");
  const releasesDir = path.join(tmpDir, "private_releases");
  await fsp.mkdir(dataDir, { recursive: true });
  await fsp.mkdir(releasesDir, { recursive: true });
  t.after(() => fsp.rm(tmpDir, { recursive: true, force: true }));

  let mockGoogleUser = null;
  let googleAuthEnabled = false;
  const whatsappAlerts = [];
  const sentEmails = [];

  const signer = createEd25519TestSigner();
  const api = createSuperbadSalesApi({
    rootDir: tmpDir,
    dataDir,
    releasesDir,
    publicKeyPem: signer.publicKeyPem,
    getAuthUser: (req) => {
      if (req.headers["x-test-google-email"]) {
        return {
          sub: String(req.headers["x-test-google-sub"] || "google-sub-123"),
          email: String(req.headers["x-test-google-email"]),
          name: String(req.headers["x-test-google-name"] || "Cliente Google"),
          picture: "https://lh3.googleusercontent.com/a/test",
        };
      }
      return mockGoogleUser;
    },
    isGoogleAuthEnabled: () => googleAuthEnabled || Boolean(api.getGoogleClientId()),
    async notifyOwnerWhatsApp(payload) {
      whatsappAlerts.push(payload);
      return { attempted: true, sent: true, provider: "mock-whatsapp", at: new Date().toISOString(), reason: "sent" };
    },
    async sendEmail(mailPayload) {
      sentEmails.push(mailPayload);
      return { sent: true, provider: "mock-smtps" };
    },
    environment: {
      NODE_ENV: "test",
      SITE_URL: "https://catalogo-cruzeiro-web.onrender.com",
      PIX_WEBHOOK_SECRET: "pix-wh-secret-test-9988776655",
      KEY_POOL_SECRET: "key-pool-aes256gcm-secret-test-11223344",
      ...customEnv,
    },
    sessionSecret: "auto-session-secret-0123456789abcdef0123456789abcdef",
    downloadSecret: "auto-download-secret-0123456789abcdef0123456789abcdef",
    ...customOpts,
  });

  const server = http.createServer((req, res) => api.handleApi(req, res));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  async function reqJson(pathname, init = {}) {
    const res = await fetch(`${baseUrl}${pathname}`, {
      ...init,
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers || {}),
      },
    });
    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    return { status: res.status, headers: res.headers, data, rawText: text };
  }

  return {
    api,
    baseUrl,
    dataDir,
    signer,
    reqJson,
    whatsappAlerts,
    sentEmails,
    setGoogleAuthEnabled: (v) => {
      googleAuthEnabled = Boolean(v);
    },
    setMockGoogleUser: (u) => {
      mockGoogleUser = u;
    },
  };
}

test("Google session checkout, receipt magic-byte & duplicate analysis, WhatsApp owner alert, NO auto-release, and owner email activation + validator", async (t) => {
  const {
    baseUrl,
    dataDir,
    signer,
    reqJson,
    whatsappAlerts,
    sentEmails,
    setGoogleAuthEnabled,
  } = await startAutomationFixture(t);

  // Configure Google Client ID via Owner Proof on /api/superbad/admin/auth-config
  const authCfgRes = await reqJson("/api/superbad/admin/auth-config", {
    method: "POST",
    headers: {
      "X-BadClaude-Owner-Proof": signer.signOwnerProof("POST", "/api/superbad/admin/auth-config"),
    },
    body: JSON.stringify({ google_client_id: "987654321-openinfinite.apps.googleusercontent.com" }),
  });
  assert.equal(authCfgRes.status, 200);
  assert.equal(authCfgRes.data.google_client_id, "987654321-openinfinite.apps.googleusercontent.com");
  setGoogleAuthEnabled(true);

  // Unauthenticated PIX order attempt MUST return 401 when Google Auth is enabled
  const unauthOrder = await reqJson("/api/superbad/orders", {
    method: "POST",
    body: JSON.stringify({ requested_edition: "infinite_pro" }),
  });
  assert.equal(unauthOrder.status, 401);
  assert.equal(unauthOrder.data.code, "GOOGLE_AUTH_REQUIRED");

  // Authenticated Google user creates order for infinite_pro (R$ 159,00)
  const googleHeaders = {
    "x-test-google-sub": "google-uid-alice-001",
    "x-test-google-email": "alice.dev@gmail.com",
    "x-test-google-name": "Alice Ferreira",
  };
  const createRes = await reqJson("/api/superbad/orders", {
    method: "POST",
    headers: googleHeaders,
    body: JSON.stringify({
      requested_edition: "infinite_pro",
      buyer_whatsapp: "(68) 99988-7766",
    }),
  });
  assert.equal(createRes.status, 201);
  assert.equal(createRes.data.order.buyer_email, "alice.dev@gmail.com");
  assert.equal(createRes.data.order.buyer_whatsapp, "(68) 99988-7766");
  assert.equal(createRes.data.order.google_name, "Alice Ferreira");
  assert.equal(createRes.data.order.sla_minutes, 60);
  const { order_id: orderId, order_secret: orderSecret } = createRes.data.order;

  // Fake magic bytes (e.g. HTML/text pretending to be image/png) MUST be rejected with 400
  const fakePngRes = await reqJson(`/api/superbad/orders/${orderId}/receipt`, {
    method: "POST",
    body: JSON.stringify({
      order_secret: orderSecret,
      receipt_file_b64: Buffer.from("FAKE_NOT_A_REAL_PNG_HEADER_123456").toString("base64"),
      receipt_file_mime: "image/png",
      receipt_file_name: "falso.png",
    }),
  });
  assert.equal(fakePngRes.status, 400);

  // Submit valid >256KB PNG receipt with BACEN E2E ID -> MUST analyze, alert WhatsApp, and NEVER auto-approve!
  const realPng512KB = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from("Comprovante PIX R$ 159,00 Raiane Leoncio "),
    Buffer.alloc(512 * 1024, 0x42),
  ]);
  const validE2e = "E18236120202611251430ABCDEF12345"; // 32 chars (E + 31)

  const recRes = await reqJson(`/api/superbad/orders/${orderId}/receipt`, {
    method: "POST",
    body: JSON.stringify({
      order_secret: orderSecret,
      e2e_id: validE2e,
      receipt_note: "Pago no Nubank agora",
      receipt_file_b64: `data:image/png;base64,${realPng512KB.toString("base64")}`,
      receipt_file_name: "pix-alice.png",
    }),
  });
  assert.equal(recRes.status, 200);
  assert.equal(recRes.data.status, "receipt_submitted");
  assert.equal(recRes.data.auto_approved, false);
  assert.equal(recRes.data.awaiting_owner_activation, true);
  assert.equal(recRes.data.sla_minutes, 60);
  assert.equal(recRes.data.buyer_whatsapp, "(68) 99988-7766");
  assert.equal(recRes.data.license_key, undefined);
  assert.equal(recRes.data.receipt_analysis.magic_valid, true);
  assert.equal(recRes.data.receipt_analysis.is_duplicate, false);
  assert.equal(recRes.data.receipt_analysis.e2e_format_ok, true);
  assert.equal(recRes.data.receipt_analysis.amount_hint, "R$ 159,00");
  assert.equal(recRes.data.receipt_analysis.receiver_hint, "Raiane Leoncio");
  assert.equal(recRes.data.owner_whatsapp_alert.attempted, true);
  assert.equal(recRes.data.owner_whatsapp_alert.sent, true);
  assert.match(recRes.data.whatsapp_immediate_url, /^https:\/\/wa\.me\/5568992269296\?text=/);
  assert.ok(decodeURIComponent(recRes.data.whatsapp_immediate_url).includes("(68) 99988-7766"));
  assert.equal(whatsappAlerts.length, 1);

  // Admin order serialization must include buyer_whatsapp + has_receipt_file so Dashboard Control can message client
  const adminOrdersPath = "/api/superbad/admin/orders";
  const adminOrdRes = await reqJson(adminOrdersPath, {
    headers: { "X-BadClaude-Owner-Proof": signer.signOwnerProof("GET", adminOrdersPath) },
  });
  assert.equal(adminOrdRes.status, 200);
  const aliceAdminOrd = adminOrdRes.data.orders.find((o) => o.order_id === orderId);
  assert.equal(aliceAdminOrd.buyer_whatsapp, "(68) 99988-7766");
  assert.equal(aliceAdminOrd.has_receipt_file, true);

  // Even if PIX bank webhook arrives, order stays awaiting owner activation (license_key STILL null!)
  const whRes = await reqJson("/api/superbad/webhooks/pix", {
    method: "POST",
    headers: { "x-pix-webhook-secret": "pix-wh-secret-test-9988776655" },
    body: JSON.stringify({ e2e_id: validE2e, amount_centavos: 15900 }),
  });
  assert.equal(whRes.status, 200);
  assert.equal(whRes.data.webhook_verified, true);
  assert.equal(whRes.data.auto_approved, false);

  const getWhilePending = await reqJson(
    `/api/superbad/orders/${orderId}?order_secret=${encodeURIComponent(orderSecret)}`
  );
  assert.equal(getWhilePending.status, 200);
  assert.equal(getWhilePending.data.order.status, "receipt_submitted");
  assert.equal(getWhilePending.data.order.license_key, null);

  // GET /api/superbad/my-orders restores Alice's pending order without exposing license_key
  const myOrdersPending = await reqJson("/api/superbad/my-orders", { headers: googleHeaders });
  assert.equal(myOrdersPending.status, 200);
  assert.equal(myOrdersPending.data.signed_in, true);
  assert.equal(myOrdersPending.data.orders.length, 1);
  assert.equal(myOrdersPending.data.orders[0].order_id, orderId);
  assert.equal(myOrdersPending.data.orders[0].license_key, null);

  // Second order submitting the SAME receipt bytes MUST be flagged as duplicate!
  const ordDupCreate = await reqJson("/api/superbad/orders", {
    method: "POST",
    headers: {
      "x-test-google-sub": "google-uid-bob-002",
      "x-test-google-email": "bob@gmail.com",
      "x-test-google-name": "Bob",
    },
    body: JSON.stringify({ requested_edition: "infinite_pro" }),
  });
  const dupRecRes = await reqJson(`/api/superbad/orders/${ordDupCreate.data.order.order_id}/receipt`, {
    method: "POST",
    body: JSON.stringify({
      order_secret: ordDupCreate.data.order.order_secret,
      receipt_file_b64: realPng512KB.toString("base64"),
      receipt_file_mime: "image/png",
    }),
  });
  assert.equal(dupRecRes.status, 200);
  assert.equal(dupRecRes.data.receipt_analysis.is_duplicate, true);
  assert.equal(dupRecRes.data.receipt_analysis.verdict, "duplicate_detected");

  // Owner views receipt in Dashboard Control via /api/superbad/admin/orders/:id/receipt
  const adminReceiptPath = `/api/superbad/admin/orders/${orderId}/receipt`;
  const viewRec = await fetch(`${baseUrl}${adminReceiptPath}?disposition=inline`, {
    headers: { "X-BadClaude-Owner-Proof": signer.signOwnerProof("GET", adminReceiptPath) },
  });
  assert.equal(viewRec.status, 200);
  assert.equal(viewRec.headers.get("x-content-type-options"), "nosniff");
  assert.equal((await viewRec.arrayBuffer()).byteLength, realPng512KB.length);

  // STEP 4 OF GOLDEN RULE: Owner activates in Dashboard Control (/deliver-key) -> sends email -> key unlocks!
  const proKey = signer.mintLicenseKey("OI6-PRO", "infinite-pro", "infinite_pro", "Alice Pro 30d");
  const deliverPath = `/api/superbad/admin/orders/${orderId}/deliver-key`;
  const deliverRes = await reqJson(deliverPath, {
    method: "POST",
    headers: { "X-BadClaude-Owner-Proof": signer.signOwnerProof("POST", deliverPath) },
    body: JSON.stringify({
      license_key: proKey,
      edition: "infinite_pro",
    }),
  });
  assert.equal(deliverRes.status, 200);
  assert.equal(deliverRes.data.status, "delivered");
  assert.equal(deliverRes.data.email_delivery.sent, true);
  assert.equal(deliverRes.data.email_delivery.to, "alice.dev@gmail.com");
  assert.equal(sentEmails.length, 1);
  assert.match(sentEmails[0].text, /Alice Ferreira/);
  assert.ok(sentEmails[0].text.includes(proKey));
  assert.ok(
    sentEmails[0].testUrl.includes(`/openinfinite/checkout/?test_key=${encodeURIComponent(proKey)}#validador`)
  );

  // Now GET order & my-orders return the decrypted license_key, and /api/v1/licenses/verify passes!
  const getAfterOwnerActivation = await reqJson(
    `/api/superbad/orders/${orderId}?order_secret=${encodeURIComponent(orderSecret)}`
  );
  assert.equal(getAfterOwnerActivation.status, 200);
  assert.equal(getAfterOwnerActivation.data.order.status, "delivered");
  assert.equal(getAfterOwnerActivation.data.order.license_key, proKey);
  assert.equal(getAfterOwnerActivation.data.order.email_delivery.sent, true);

  const verifyRes = await reqJson("/api/v1/licenses/verify", {
    method: "POST",
    body: JSON.stringify({ key: proKey, hwid: "ALICE-MAC-HWID-01" }),
  });
  assert.equal(verifyRes.status, 200);
  assert.equal(verifyRes.data.ok, true);
  assert.equal(verifyRes.data.valid, true);
  assert.equal(verifyRes.data.includesOpenInfinite, true);
  assert.equal(verifyRes.data.planLabel, "OpenInfinite macOS & Multi (1 Mês)");
  assert.equal(verifyRes.data.planLabel.includes("Alice"), false);

  // Confirm superbad-orders.json on disk NEVER stores plaintext proKey
  const diskStore = await fsp.readFile(path.join(dataDir, "superbad-orders.json"), "utf8");
  assert.equal(diskStore.includes(proKey), false, "Plaintext key must never be stored on disk");
});

test("key-pool stocks Ed25519 signed keys encrypted at rest with AES-256-GCM and rejects tampered or wrong-tier keys", async (t) => {
  const { dataDir, signer, reqJson } = await startAutomationFixture(t);

  const infKey1 = signer.mintLicenseKey("OI6-INF", "infinite-basic", "infinite", "Pool Key #1");
  const infKey2 = signer.mintLicenseKey("OI6-INF", "infinite-basic", "infinite", "Pool Key #2");
  const proKeyWrongEdition = signer.mintLicenseKey("OI6-PRO", "infinite-pro", "infinite_pro", "Wrong Edition");

  const mismatchStock = await reqJson("/api/superbad/admin/key-pool/stock", {
    method: "POST",
    headers: { "X-BadClaude-Owner-Proof": signer.signOwnerProof("POST", "/api/superbad/admin/key-pool/stock") },
    body: JSON.stringify({ edition: "infinite", keys: [proKeyWrongEdition] }),
  });
  assert.equal(mismatchStock.status, 400);

  const stockRes = await reqJson("/api/superbad/admin/key-pool/stock", {
    method: "POST",
    headers: { "X-BadClaude-Owner-Proof": signer.signOwnerProof("POST", "/api/superbad/admin/key-pool/stock") },
    body: JSON.stringify({ edition: "infinite", keys: [infKey1, infKey2, infKey1] }),
  });
  assert.equal(stockRes.status, 200);
  assert.equal(stockRes.data.stocked_count, 2);
  assert.equal(stockRes.data.skipped_duplicates, 1);

  const rawStore = await fsp.readFile(path.join(dataDir, "superbad-orders.json"), "utf8");
  assert.equal(rawStore.includes(infKey1), false);
  assert.match(JSON.parse(rawStore).key_pool.infinite[0].encrypted_key, /^aes256gcm\$/);
});

test("public-stats aggregates live heartbeats, computes savings accurately, and leaks ZERO keys, prefixes, emails, HWIDs, hostnames, or IPs", async (t) => {
  const { signer, reqJson } = await startAutomationFixture(t);

  const proKey = signer.mintLicenseKey("OI6-PRO", "infinite-pro", "infinite_pro", "Cliente Secreto Pro");
  const fndKey = signer.mintLicenseKey("BC5-FND", "founder", "founder", "Cliente Secreto Founder");

  await reqJson("/api/v1/telemetry/heartbeat", {
    method: "POST",
    body: JSON.stringify({
      key: proKey,
      hwid: "HWID-SUPER-SECRET-MAC-998877",
      hostname: "MACBOOK-CONFIDENCIAL-ALICE",
      user_label: "alice.confidencial@empresa-privada.com.br",
      edition: "infinite_pro",
      profile: "pro",
      tokens_total: 10_000_000,
      cache_tokens: 3_500_000,
      requests: 420,
    }),
  });

  await reqJson("/api/v1/telemetry/heartbeat", {
    method: "POST",
    body: JSON.stringify({
      key: fndKey,
      hwid: "HWID-SUPER-SECRET-WIN-112233",
      hostname: "PC-SECRETO-ROBERTO",
      user_label: "roberto.vip@dominio-secreto.org",
      edition: "founder",
      profile: "founder",
      tokens_total: 100_000_000,
      cache_tokens: 40_000_000,
      requests: 3100,
    }),
  });

  const stats = await reqJson("/api/openinfinite/public-stats");
  assert.equal(stats.status, 200);
  assert.equal(stats.headers.get("access-control-allow-origin"), "*");
  assert.equal(stats.data.totals.total_tokens_processed, 110_000_000);
  assert.equal(stats.data.totals.cache_tokens, 43_500_000);
  assert.equal(stats.data.totals.saved_brl_total, 4893);

  const raw = stats.rawText;
  assert.doesNotMatch(raw, /OI6-|IC6-|BC5-|LIC-/i);
  assert.doesNotMatch(raw, /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  assert.doesNotMatch(raw, /\b(?:\d{1,3}\.){2,3}(?:\d{1,3}|x)\b/);
  assert.doesNotMatch(raw, /[a-f0-9]{64}/i);
  assert.doesNotMatch(raw, /HWID-SUPER-SECRET|MACBOOK-CONFIDENCIAL|PC-SECRETO|alice|roberto/i);
});

test("IC6-PRO (infinite_claude) supports PIX order, key-pool stocking, owner deliver-key email and Ed25519 verification", async (t) => {
  const { dataDir, signer, reqJson, sentEmails } = await startAutomationFixture(t);

  const icKeyPool1 = signer.mintLicenseKey("IC6-PRO", "infinite-claude", "infinite_claude", "IC Pool #1");
  const icKeyDeliver = signer.mintLicenseKey("IC6-PRO", "infinite-claude", "infinite_claude", "IC Deliver");
  const oiKeyMismatch = signer.mintLicenseKey("OI6-PRO", "infinite-pro", "infinite_pro", "Wrong Tier");

  // Reject stocking OI6-PRO into infinite_claude pool
  const badStock = await reqJson("/api/superbad/admin/key-pool/stock", {
    method: "POST",
    headers: { "X-BadClaude-Owner-Proof": signer.signOwnerProof("POST", "/api/superbad/admin/key-pool/stock") },
    body: JSON.stringify({ edition: "infinite_claude", keys: [oiKeyMismatch] }),
  });
  assert.equal(badStock.status, 400);

  // Stock IC6-PRO encrypted AES-256-GCM at rest
  const okStock = await reqJson("/api/superbad/admin/key-pool/stock", {
    method: "POST",
    headers: { "X-BadClaude-Owner-Proof": signer.signOwnerProof("POST", "/api/superbad/admin/key-pool/stock") },
    body: JSON.stringify({ edition: "infinite_claude", keys: [icKeyPool1] }),
  });
  assert.equal(okStock.status, 200);
  assert.equal(okStock.data.stocked_count, 1);

  const poolRes = await reqJson("/api/superbad/admin/key-pool", {
    headers: { "X-BadClaude-Owner-Proof": signer.signOwnerProof("GET", "/api/superbad/admin/key-pool") },
  });
  assert.equal(poolRes.status, 200);
  assert.equal(poolRes.data.counts.infinite_claude, 1);

  // Create PIX order for infinite_claude (R$ 199,00) + deliver IC6-PRO key
  const createRes = await reqJson("/api/superbad/orders", {
    method: "POST",
    headers: {
      "x-test-google-sub": "google-uid-clara-ic6",
      "x-test-google-email": "clara.claude@gmail.com",
      "x-test-google-name": "Clara Mendes",
    },
    body: JSON.stringify({ requested_edition: "infinite_claude" }),
  });
  assert.equal(createRes.status, 201);
  assert.equal(createRes.data.order.amount_centavos, 19900);
  assert.equal(createRes.data.order.amount_display, "R$ 199,00");
  const { order_id: orderId, order_secret: orderSecret } = createRes.data.order;

  const deliverPath = `/api/superbad/admin/orders/${orderId}/deliver-key`;
  const deliverRes = await reqJson(deliverPath, {
    method: "POST",
    headers: { "X-BadClaude-Owner-Proof": signer.signOwnerProof("POST", deliverPath) },
    body: JSON.stringify({ license_key: icKeyDeliver, edition: "infinite_claude" }),
  });
  assert.equal(deliverRes.status, 200);
  assert.equal(deliverRes.data.status, "delivered");
  assert.equal(sentEmails.length, 1);
  assert.ok(sentEmails[0].testUrl.includes(`/openinfinite/checkout/?test_key=${encodeURIComponent(icKeyDeliver)}#validador`));

  const orderAfter = await reqJson(`/api/superbad/orders/${orderId}?order_secret=${encodeURIComponent(orderSecret)}`);
  assert.equal(orderAfter.status, 200);
  assert.equal(orderAfter.data.order.license_key, icKeyDeliver);

  const verifyIc = await reqJson("/api/v1/licenses/verify", {
    method: "POST",
    body: JSON.stringify({ key: icKeyDeliver, hwid: "CLARA-MAC-IC6-01" }),
  });
  assert.equal(verifyIc.status, 200);
  assert.equal(verifyIc.data.ok, true);
  assert.equal(verifyIc.data.edition, "infinite_claude");
  assert.equal(verifyIc.data.tier, "infinite-claude");
  assert.equal(verifyIc.data.includesOpenInfinite, true);
  assert.equal(verifyIc.data.includesInfiniteClaude, true);
  assert.equal(verifyIc.data.maxHwids, 3);
  assert.equal(verifyIc.data.planLabel, "InfiniteClaude v6.2 Multi-OS + Claude Code (1 Mês)");

  const rawDisk = await fsp.readFile(path.join(dataDir, "superbad-orders.json"), "utf8");
  assert.equal(rawDisk.includes(icKeyPool1), false);
  assert.equal(rawDisk.includes(icKeyDeliver), false);
});

test("IC6-MAX (infinite_max) supports PIX order (R$ 249), key-pool stocking, owner deliver-key email and Ed25519 verification", async (t) => {
  const { dataDir, signer, reqJson, sentEmails } = await startAutomationFixture(t);

  const maxKeyPool1 = signer.mintLicenseKey("IC6-MAX", "infinite-max", "infinite_max", "IC6-MAX Pool #1");
  const maxKeyDeliver = signer.mintLicenseKey("IC6-MAX", "infinite-claude-max", "infinite_max", "IC6-MAX Deliver");
  const icProMismatch = signer.mintLicenseKey("IC6-PRO", "infinite-claude", "infinite_claude", "Wrong Tier Pro");

  const badStock = await reqJson("/api/superbad/admin/key-pool/stock", {
    method: "POST",
    headers: { "X-BadClaude-Owner-Proof": signer.signOwnerProof("POST", "/api/superbad/admin/key-pool/stock") },
    body: JSON.stringify({ edition: "infinite_max", keys: [icProMismatch] }),
  });
  assert.equal(badStock.status, 400);

  const okStock = await reqJson("/api/superbad/admin/key-pool/stock", {
    method: "POST",
    headers: { "X-BadClaude-Owner-Proof": signer.signOwnerProof("POST", "/api/superbad/admin/key-pool/stock") },
    body: JSON.stringify({ edition: "infinite_max", keys: [maxKeyPool1] }),
  });
  assert.equal(okStock.status, 200);
  assert.equal(okStock.data.stocked_count, 1);

  const poolRes = await reqJson("/api/superbad/admin/key-pool", {
    headers: { "X-BadClaude-Owner-Proof": signer.signOwnerProof("GET", "/api/superbad/admin/key-pool") },
  });
  assert.equal(poolRes.status, 200);
  assert.equal(poolRes.data.counts.infinite_max, 1);

  const createRes = await reqJson("/api/superbad/orders", {
    method: "POST",
    headers: {
      "x-test-google-sub": "google-uid-max-ic6",
      "x-test-google-email": "lucas.max@gmail.com",
      "x-test-google-name": "Lucas Max",
    },
    body: JSON.stringify({ requested_edition: "infinite_max" }),
  });
  assert.equal(createRes.status, 201);
  assert.equal(createRes.data.order.amount_centavos, 24900);
  assert.equal(createRes.data.order.amount_display, "R$ 249,00");
  const { order_id: orderId, order_secret: orderSecret } = createRes.data.order;

  const deliverPath = `/api/superbad/admin/orders/${orderId}/deliver-key`;
  const deliverRes = await reqJson(deliverPath, {
    method: "POST",
    headers: { "X-BadClaude-Owner-Proof": signer.signOwnerProof("POST", deliverPath) },
    body: JSON.stringify({ license_key: maxKeyDeliver, edition: "infinite_max" }),
  });
  assert.equal(deliverRes.status, 200);
  assert.equal(deliverRes.data.status, "delivered");
  assert.equal(sentEmails.length, 1);
  assert.ok(sentEmails[0].testUrl.includes(`/openinfinite/checkout/?test_key=${encodeURIComponent(maxKeyDeliver)}#validador`));

  const orderAfter = await reqJson(`/api/superbad/orders/${orderId}?order_secret=${encodeURIComponent(orderSecret)}`);
  assert.equal(orderAfter.status, 200);
  assert.equal(orderAfter.data.order.license_key, maxKeyDeliver);

  const verifyMax = await reqJson("/api/v1/licenses/verify", {
    method: "POST",
    body: JSON.stringify({ key: maxKeyDeliver, hwid: "MAX-WORKSTATION-01" }),
  });
  assert.equal(verifyMax.status, 200);
  assert.equal(verifyMax.data.ok, true);
  assert.equal(verifyMax.data.edition, "infinite_max");
  assert.equal(verifyMax.data.tier, "infinite-max");
  assert.equal(verifyMax.data.includesOpenInfinite, true);
  assert.equal(verifyMax.data.includesInfiniteClaude, true);
  assert.equal(verifyMax.data.maxHwids, 5);
  assert.equal(verifyMax.data.planLabel, "InfiniteClaude v6.2 Max Multi-CLI Total (1 Mês)");

  const rawDisk = await fsp.readFile(path.join(dataDir, "superbad-orders.json"), "utf8");
  assert.equal(rawDisk.includes(maxKeyPool1), false);
  assert.equal(rawDisk.includes(maxKeyDeliver), false);
});

test("server.js configures Google Auth dynamic Client ID fallback, 1-prompt installer routes, silent opencode bootstrap, .tar.gz as application/gzip, and /api/openinfinite/", () => {
  const serverSource = fs.readFileSync(path.join(repoRoot, "server.js"), "utf8");
  assert.match(serverSource, /process\.env\.SUPERBAD_SESSION_SECRET/);
  assert.match(serverSource, /function getEffectiveGoogleClientId\(\)/);
  assert.match(serverSource, /superbadSalesApi\?\.getGoogleClientId\?\.\(\)/);
  assert.match(serverSource, /getAuthUser:\s*readCatalogoAuthSession/);
  assert.match(serverSource, /case "\.gz":[\s\S]{0,60}return "application\/gzip"/);
  assert.match(serverSource, /pathname\.startsWith\("\/api\/openinfinite\/"\)/);

  // 4 lightweight 1-prompt installer routes in server.js (text/plain; charset=utf-8) + silent headless opencode bootstrap
  assert.match(serverSource, /pathname === "\/install-openinfinite\.sh"/);
  assert.match(serverSource, /pathname === "\/install-infiniteclaude\.sh"/);
  assert.match(serverSource, /pathname === "\/install-mac\.sh"/);
  assert.match(serverSource, /pathname === "\/install-win\.ps1"/);
  assert.match(serverSource, /https:\/\/opencode\.ai\/install \| bash -s -- --no-modify-path/);
  assert.match(serverSource, /https:\/\/opencode\.ai\/install\.ps1 \| iex/);
  assert.match(serverSource, /opencode-cli\.exe/);
  assert.match(serverSource, /\/downloads\/OpenInfinite-Client-Ubuntu-VPS\.tar\.gz/);
  assert.match(serverSource, /\/downloads\/InfiniteClaude-Client-Ubuntu-VPS\.tar\.gz/);
  assert.match(serverSource, /\/downloads\/OpenInfinite-Client-macOS\.dmg/);
  assert.match(serverSource, /\/downloads\/InfiniteClaude-Client-macOS\.dmg/);
  assert.match(serverSource, /\/downloads\/OpenInfinite-Client-Setup\.exe/);
  assert.match(serverSource, /\/downloads\/InfiniteClaude-Client-Setup\.exe/);
  assert.doesNotMatch(serverSource, /const appParam = String\(searchParams\./);
});

test("server.js serves /install-* routes, /openinfinite/, /api/openinfinite/public-stats, and /downloads/* live with HTTP 200", async (t) => {
  const { spawn } = require("node:child_process");
  const tmpData = await fsp.mkdtemp(path.join(os.tmpdir(), "oi-server-live-"));
  const port = 15497;
  const child = spawn(process.execPath, [path.join(repoRoot, "server.js")], {
    cwd: repoRoot,
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", BADCLAUDE_DATA_DIR: tmpData, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(async () => {
    try { child.kill(); } catch {}
    await new Promise((r) => setTimeout(r, 200));
    await fsp.rm(tmpData, { recursive: true, force: true }).catch(() => {});
  });

  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/api/openinfinite/public-stats`);
      if (r.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 150));
  }

  for (const [p, expected] of [
    ["/install-openinfinite.sh", "/downloads/OpenInfinite-Client-Ubuntu-VPS.tar.gz"],
    ["/install-infiniteclaude.sh", "/downloads/InfiniteClaude-Client-Ubuntu-VPS.tar.gz"],
    ["/install-mac.sh?app=openinfinite", 'TARGET_APP="${INFINITE_APP:-openinfinite}"'],
    ["/install-win.ps1?app=infiniteclaude", "$TargetApp = if ($env:INFINITE_APP) { $env:INFINITE_APP.ToLower() } else { 'infiniteclaude' }"],
    ["/openinfinite/", "INFINITE ZONE"],
    ["/openinfinite/checkout/", "Raiane Leoncio"],
    ["/openinfinite/checkout/", "IC6-MAX"],
  ]) {
    const res = await fetch(`http://127.0.0.1:${port}${p}`);
    const body = await res.text();
    assert.equal(res.status, 200, `Expected 200 for ${p}, got ${res.status}`);
    assert.ok(body.includes(expected), `Expected ${expected} in ${p}`);
  }
  const checkinRedir = await fetch(`http://127.0.0.1:${port}/openinfinite/checkin?plan=infinite_pro`, { redirect: "manual" });
  assert.equal(checkinRedir.status, 302);
  assert.equal(checkinRedir.headers.get("location"), "/openinfinite/checkout/?plan=infinite_pro");
  for (const dl of [
    "/downloads/SHA256SUMS.txt",
    "/downloads/OpenInfinite-Client-Setup.exe",
    "/downloads/InfiniteClaude-Client-Setup.exe",
    "/downloads/OpenInfinite-Client-macOS.dmg",
    "/downloads/InfiniteClaude-Client-macOS.dmg",
    "/downloads/OpenInfinite-Client-Ubuntu-VPS.tar.gz",
    "/downloads/InfiniteClaude-Client-Ubuntu-VPS.tar.gz",
  ]) {
    const headRes = await fetch(`http://127.0.0.1:${port}${dl}`, { method: "HEAD" });
    assert.equal(headRes.status, 200, `Expected 200 HEAD for ${dl}`);
    assert.ok(Number(headRes.headers.get("content-length")) > 100);
  }
});
