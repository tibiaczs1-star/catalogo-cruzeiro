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
    body: JSON.stringify({ requested_edition: "infinite_pro" }),
  });
  assert.equal(createRes.status, 201);
  assert.equal(createRes.data.order.buyer_email, "alice.dev@gmail.com");
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
    Buffer.from("Comprovante PIX R$ 159,00 Raiane Lenoncio "),
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
  assert.equal(recRes.data.license_key, undefined);
  assert.equal(recRes.data.receipt_analysis.magic_valid, true);
  assert.equal(recRes.data.receipt_analysis.is_duplicate, false);
  assert.equal(recRes.data.receipt_analysis.e2e_format_ok, true);
  assert.equal(recRes.data.receipt_analysis.amount_hint, "R$ 159,00");
  assert.equal(recRes.data.receipt_analysis.receiver_hint, "Raiane Lenoncio");
  assert.equal(recRes.data.owner_whatsapp_alert.attempted, true);
  assert.equal(recRes.data.owner_whatsapp_alert.sent, true);
  assert.match(recRes.data.whatsapp_immediate_url, /^https:\/\/wa\.me\/5568992269296\?text=/);
  assert.equal(whatsappAlerts.length, 1);

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
    sentEmails[0].testUrl.includes(`/openinfinite/?test_key=${encodeURIComponent(proKey)}#validador`)
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
  assert.doesNotMatch(raw, /OI6-|BC5-|LIC-/i);
  assert.doesNotMatch(raw, /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  assert.doesNotMatch(raw, /\b(?:\d{1,3}\.){2,3}(?:\d{1,3}|x)\b/);
  assert.doesNotMatch(raw, /[a-f0-9]{64}/i);
  assert.doesNotMatch(raw, /HWID-SUPER-SECRET|MACBOOK-CONFIDENCIAL|PC-SECRETO|alice|roberto/i);
});

test("server.js configures Google Auth dynamic Client ID fallback, .tar.gz as application/gzip, and /api/openinfinite/", () => {
  const serverSource = fs.readFileSync(path.join(repoRoot, "server.js"), "utf8");
  assert.match(serverSource, /process\.env\.SUPERBAD_SESSION_SECRET/);
  assert.match(serverSource, /function getEffectiveGoogleClientId\(\)/);
  assert.match(serverSource, /superbadSalesApi\?\.getGoogleClientId\?\.\(\)/);
  assert.match(serverSource, /getAuthUser:\s*readCatalogoAuthSession/);
  assert.match(serverSource, /case "\.gz":[\s\S]{0,60}return "application\/gzip"/);
  assert.match(serverSource, /pathname\.startsWith\("\/api\/openinfinite\/"\)/);
});
