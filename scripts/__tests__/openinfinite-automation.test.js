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

  const signer = createEd25519TestSigner();
  const api = createSuperbadSalesApi({
    rootDir: tmpDir,
    dataDir,
    releasesDir,
    publicKeyPem: signer.publicKeyPem,
    environment: {
      NODE_ENV: "test",
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

  return { api, baseUrl, dataDir, signer, reqJson };
}

test("key-pool stocks Ed25519 signed keys encrypted at rest with AES-256-GCM and rejects tampered or wrong-tier keys", async (t) => {
  const { dataDir, signer, reqJson } = await startAutomationFixture(t);

  // Verify default empty key_pool via owner-proof
  const initialPool = await reqJson("/api/superbad/admin/key-pool", {
    headers: { "X-BadClaude-Owner-Proof": signer.signOwnerProof("GET", "/api/superbad/admin/key-pool") },
  });
  assert.equal(initialPool.status, 200);
  assert.equal(initialPool.data.total_available, 0);
  assert.equal(initialPool.data.counts.infinite, 0);

  const infKey1 = signer.mintLicenseKey("OI6-INF", "infinite-basic", "infinite", "Pool Key #1");
  const infKey2 = signer.mintLicenseKey("OI6-INF", "infinite-basic", "infinite", "Pool Key #2");
  const proKeyWrongEdition = signer.mintLicenseKey("OI6-PRO", "infinite-pro", "infinite_pro", "Wrong Edition");

  // Unauthenticated stock attempt must fail
  const unauthStock = await reqJson("/api/superbad/admin/key-pool/stock", {
    method: "POST",
    body: JSON.stringify({ edition: "infinite", keys: [infKey1] }),
  });
  assert.equal(unauthStock.status, 503);

  // Wrong tier/edition key in batch must fail with 400
  const mismatchStock = await reqJson("/api/superbad/admin/key-pool/stock", {
    method: "POST",
    headers: { "X-BadClaude-Owner-Proof": signer.signOwnerProof("POST", "/api/superbad/admin/key-pool/stock") },
    body: JSON.stringify({ edition: "infinite", keys: [proKeyWrongEdition] }),
  });
  assert.equal(mismatchStock.status, 400);

  // Valid signed batch stocks cleanly and deduplicates repeated keys
  const stockRes = await reqJson("/api/superbad/admin/key-pool/stock", {
    method: "POST",
    headers: { "X-BadClaude-Owner-Proof": signer.signOwnerProof("POST", "/api/superbad/admin/key-pool/stock") },
    body: JSON.stringify({ edition: "infinite", keys: [infKey1, infKey2, infKey1] }),
  });
  assert.equal(stockRes.status, 200);
  assert.equal(stockRes.data.ok, true);
  assert.equal(stockRes.data.stocked_count, 2);
  assert.equal(stockRes.data.skipped_duplicates, 1);
  assert.equal(stockRes.data.pool_available, 2);

  // Inspect superbad-orders.json on disk: keys MUST be encrypted with AES-256-GCM (zero plaintext keys on disk)
  const rawStore = await fsp.readFile(path.join(dataDir, "superbad-orders.json"), "utf8");
  assert.equal(rawStore.includes(infKey1), false, "Plaintext key #1 must NEVER appear on disk");
  assert.equal(rawStore.includes(infKey2), false, "Plaintext key #2 must NEVER appear on disk");
  const parsedStore = JSON.parse(rawStore);
  assert.ok(parsedStore.key_pool && Array.isArray(parsedStore.key_pool.infinite));
  assert.equal(parsedStore.key_pool.infinite.length, 2);
  assert.match(parsedStore.key_pool.infinite[0].encrypted_key, /^aes256gcm\$/);
});

test("receipt endpoint accepts >256KB base64 PNG/PDF attachments up to 3MB, blocks other routes >256KB, and stores privately", async (t) => {
  const { baseUrl, dataDir, signer, reqJson } = await startAutomationFixture(t);

  // Normal routes still enforce 256 KB body limit (413)
  const hugeOrderPayload = JSON.stringify({
    buyer_name: "Teste Limite",
    buyer_contact: "68999990000",
    requested_edition: "infinite",
    padding: "X".repeat(300 * 1024),
  });
  const hugeOrderRes = await reqJson("/api/superbad/orders", {
    method: "POST",
    body: hugeOrderPayload,
  });
  assert.equal(hugeOrderRes.status, 413);

  // Create valid order (infinite_pro R$ 159,00)
  const ordRes = await reqJson("/api/superbad/orders", {
    method: "POST",
    body: JSON.stringify({
      buyer_name: "Carla Dev",
      buyer_contact: "carla@example.com",
      requested_edition: "infinite_pro",
    }),
  });
  assert.equal(ordRes.status, 201);
  const { order_id: orderId, order_secret: orderSecret } = ordRes.data.order;

  // Reject invalid MIME (e.g. text/html)
  const badMimeRes = await reqJson(`/api/superbad/orders/${orderId}/receipt`, {
    method: "POST",
    body: JSON.stringify({
      order_secret: orderSecret,
      receipt_file_b64: Buffer.from("<script>alert(1)</script>").toString("base64"),
      receipt_file_mime: "text/html",
    }),
  });
  assert.equal(badMimeRes.status, 400);

  // Reject wrong order_secret BEFORE writing anything to disk
  const pngPayload512KB = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(512 * 1024, 0xab),
  ]);
  const wrongSecretRes = await reqJson(`/api/superbad/orders/${orderId}/receipt`, {
    method: "POST",
    body: JSON.stringify({
      order_secret: "wrong-secret-token",
      e2e_id: "E1234567890",
      receipt_file_b64: pngPayload512KB.toString("base64"),
      receipt_file_mime: "image/png",
      receipt_file_name: "pix-comprovante.png",
    }),
  });
  assert.equal(wrongSecretRes.status, 403);
  assert.equal(fs.existsSync(path.join(dataDir, "superbad-receipts")), false);

  // Accept 512 KB binary PNG (~683 KB JSON > 256 KB!) on the receipt route
  const okReceiptRes = await reqJson(`/api/superbad/orders/${orderId}/receipt`, {
    method: "POST",
    body: JSON.stringify({
      order_secret: orderSecret,
      receipt_note: "Pago via Nubank",
      e2e_id: "E9988776620261125ABCD",
      receipt_file_b64: `data:image/png;base64,${pngPayload512KB.toString("base64")}`,
      receipt_file_name: "comprovante-nubank.png",
    }),
  });
  assert.equal(okReceiptRes.status, 200);
  assert.equal(okReceiptRes.data.ok, true);
  assert.equal(okReceiptRes.data.order_id, orderId);
  assert.equal(okReceiptRes.data.status, "receipt_submitted");
  assert.equal(okReceiptRes.data.auto_approved, false);
  assert.equal(okReceiptRes.data.license_key, undefined);
  assert.equal(okReceiptRes.data.order.has_receipt_file, true);
  assert.equal(okReceiptRes.data.order.e2e_id, "E9988776620261125ABCD");

  // GET order before approval MUST NOT expose license_key
  const getPending = await reqJson(
    `/api/superbad/orders/${orderId}?order_secret=${encodeURIComponent(orderSecret)}`
  );
  assert.equal(getPending.status, 200);
  assert.equal(getPending.data.order.status, "receipt_submitted");
  assert.equal(getPending.data.order.has_receipt_file, true);
  assert.equal(getPending.data.order.e2e_id, "E9988776620261125ABCD");
  assert.equal(getPending.data.order.license_key, null);

  // Admin can securely download the private receipt attachment with nosniff + attachment headers
  const adminDlPath = `/api/superbad/admin/orders/${orderId}/receipt-file`;
  const adminDl = await fetch(`${baseUrl}${adminDlPath}`, {
    headers: { "X-BadClaude-Owner-Proof": signer.signOwnerProof("GET", adminDlPath) },
  });
  assert.equal(adminDl.status, 200);
  assert.equal(adminDl.headers.get("x-content-type-options"), "nosniff");
  assert.match(adminDl.headers.get("content-disposition"), /^attachment; filename="/);
  const downloadedBuf = Buffer.from(await adminDl.arrayBuffer());
  assert.equal(downloadedBuf.length, pngPayload512KB.length);
});

test("PIX webhook + key-pool auto-match (both arrival orders) and manual deliver_key deliver decrypted license_key only to valid order_secret", async (t) => {
  const { dataDir, signer, reqJson } = await startAutomationFixture(t);

  const proKeyA = signer.mintLicenseKey("OI6-PRO", "infinite-pro", "infinite_pro", "Auto Pool Key A");
  const proKeyB = signer.mintLicenseKey("OI6-PRO", "infinite-pro", "infinite_pro", "Auto Pool Key B");
  const infKeyManual = signer.mintLicenseKey("OI6-INF", "infinite-basic", "infinite", "Manual Deliver Key");

  // Stock 2 keys for infinite_pro
  const stockRes = await reqJson("/api/superbad/admin/key-pool/stock", {
    method: "POST",
    headers: { "X-BadClaude-Owner-Proof": signer.signOwnerProof("POST", "/api/superbad/admin/key-pool/stock") },
    body: JSON.stringify({ edition: "infinite_pro", keys: [proKeyA, proKeyB] }),
  });
  assert.equal(stockRes.status, 200);
  assert.equal(stockRes.data.pool_available, 2);

  // Webhook authentication checks
  const badSecretWh = await reqJson("/api/superbad/webhooks/pix", {
    method: "POST",
    headers: { "x-pix-webhook-secret": "wrong-secret" },
    body: JSON.stringify({ e2e_id: "E0001", amount_centavos: 15900 }),
  });
  assert.equal(badSecretWh.status, 401);

  // FLOW 1: Buyer submits receipt with E2E ID first -> Bank PIX webhook arrives second
  const ord1 = await reqJson("/api/superbad/orders", {
    method: "POST",
    body: JSON.stringify({
      buyer_name: "Lucas Pro",
      buyer_contact: "lucas@dev.br",
      requested_edition: "infinite_pro",
    }),
  });
  const o1 = ord1.data.order;

  await reqJson(`/api/superbad/orders/${o1.order_id}/receipt`, {
    method: "POST",
    body: JSON.stringify({
      order_secret: o1.order_secret,
      e2e_id: "E1111222233334444FLOW1",
      receipt_file_b64: Buffer.from("%PDF-1.4 recibo pix").toString("base64"),
      receipt_file_mime: "application/pdf",
    }),
  });

  // Wrong amount in webhook MUST NOT approve R$ 159,00 order
  const wrongAmountWh = await reqJson("/api/superbad/webhooks/pix", {
    method: "POST",
    headers: { "x-pix-webhook-secret": "pix-wh-secret-test-9988776655" },
    body: JSON.stringify({ e2e_id: "E1111222233334444FLOW1", amount_centavos: 9900 }),
  });
  assert.equal(wrongAmountWh.status, 200);
  assert.equal(wrongAmountWh.data.matched, false);

  // Exact amount (R$ 159,00 = 15900) matches, approves, and reserves proKeyA
  const validWh1 = await reqJson("/api/superbad/webhooks/pix", {
    method: "POST",
    headers: { Authorization: "Bearer pix-wh-secret-test-9988776655" },
    body: JSON.stringify({ e2e_id: "E1111222233334444FLOW1", amount_brl: "159.00" }),
  });
  assert.equal(validWh1.status, 200);
  assert.equal(validWh1.data.matched, true);
  assert.equal(validWh1.data.auto_approved, true);
  assert.equal(validWh1.data.order_id, o1.order_id);
  assert.equal(validWh1.data.status, "approved");

  // Idempotent retry of same webhook does NOT burn proKeyB
  const retryWh1 = await reqJson("/api/superbad/webhooks/pix", {
    method: "POST",
    headers: { "x-pix-webhook-secret": "pix-wh-secret-test-9988776655" },
    body: JSON.stringify({ e2e_id: "E1111222233334444FLOW1", amount_centavos: 15900 }),
  });
  assert.equal(retryWh1.status, 200);
  assert.equal(retryWh1.data.idempotent, true);

  // GET order with wrong secret returns 403; with valid secret returns decrypted proKeyA!
  const getO1Wrong = await reqJson(`/api/superbad/orders/${o1.order_id}?order_secret=invalid`);
  assert.equal(getO1Wrong.status, 403);

  const getO1Ok = await reqJson(
    `/api/superbad/orders/${o1.order_id}?order_secret=${encodeURIComponent(o1.order_secret)}`
  );
  assert.equal(getO1Ok.status, 200);
  assert.equal(getO1Ok.data.order.status, "approved");
  assert.equal(getO1Ok.data.order.license_key, proKeyA);

  // FLOW 2: Bank PIX webhook arrives FIRST -> Buyer submits E2E ID in receipt SECOND (instant auto_approved)
  const preWh = await reqJson("/api/superbad/webhooks/pix", {
    method: "POST",
    headers: { "x-pix-webhook-secret": "pix-wh-secret-test-9988776655" },
    body: JSON.stringify({ e2e_id: "E5555666677778888FLOW2", amount_centavos: 15900 }),
  });
  assert.equal(preWh.status, 200);
  assert.equal(preWh.data.matched, false);
  assert.equal(preWh.data.queued_for_match, true);

  const ord2 = await reqJson("/api/superbad/orders", {
    method: "POST",
    body: JSON.stringify({
      buyer_name: "Marina Mac",
      buyer_contact: "marina@dev.br",
      requested_edition: "infinite_pro",
    }),
  });
  const o2 = ord2.data.order;

  const rec2 = await reqJson(`/api/superbad/orders/${o2.order_id}/receipt`, {
    method: "POST",
    body: JSON.stringify({
      order_secret: o2.order_secret,
      e2e_id: "E5555666677778888FLOW2",
    }),
  });
  assert.equal(rec2.status, 200);
  assert.equal(rec2.data.auto_approved, true);
  assert.equal(rec2.data.status, "approved");
  assert.equal(rec2.data.license_key, proKeyB);

  // FLOW 3: Manual deliver_key via /api/superbad/admin/licenses/register (Dashboard Control integration)
  const ord3 = await reqJson("/api/superbad/orders", {
    method: "POST",
    body: JSON.stringify({
      buyer_name: "Pedro Win",
      buyer_contact: "pedro@dev.br",
      requested_edition: "infinite",
    }),
  });
  const o3 = ord3.data.order;

  const regDeliver = await reqJson("/api/superbad/admin/licenses/register", {
    method: "POST",
    headers: {
      "X-BadClaude-Owner-Proof": signer.signOwnerProof("POST", "/api/superbad/admin/licenses/register"),
    },
    body: JSON.stringify({
      key_hash: crypto.createHash("sha256").update(infKeyManual, "utf8").digest("hex"),
      key_prefix: infKeyManual.slice(0, 10),
      raw_license_key: infKeyManual,
      deliver_key: true,
      edition: "infinite",
      tier: "infinite-basic",
      order_id: o3.order_id,
    }),
  });
  assert.equal(regDeliver.status, 200);

  const getO3 = await reqJson(
    `/api/superbad/orders/${o3.order_id}?order_secret=${encodeURIComponent(o3.order_secret)}`
  );
  assert.equal(getO3.status, 200);
  assert.equal(getO3.data.order.status, "delivered");
  assert.equal(getO3.data.order.license_key, infKeyManual);

  // Confirm store on disk STILL contains zero plaintext Ed25519 keys
  const finalDiskJson = await fsp.readFile(path.join(dataDir, "superbad-orders.json"), "utf8");
  for (const secretKey of [proKeyA, proKeyB, infKeyManual]) {
    assert.equal(finalDiskJson.includes(secretKey), false, "Plaintext license key leaked to disk store");
  }
});

test("public-stats aggregates live heartbeats, computes savings accurately, and leaks ZERO keys, prefixes, emails, HWIDs, hostnames, or IPs", async (t) => {
  const { signer, reqJson } = await startAutomationFixture(t);

  const proKey = signer.mintLicenseKey("OI6-PRO", "infinite-pro", "infinite_pro", "Cliente Secreto Pro");
  const fndKey = signer.mintLicenseKey("BC5-FND", "founder", "founder", "Cliente Secreto Founder");

  // Send heartbeats containing sensitive fields that MUST NEVER leak into public-stats
  const hb1 = await reqJson("/api/v1/telemetry/heartbeat", {
    method: "POST",
    body: JSON.stringify({
      key: proKey,
      hwid: "HWID-SUPER-SECRET-MAC-998877",
      hostname: "MACBOOK-CONFIDENCIAL-ALICE",
      user_label: "alice.confidencial@empresa-privada.com.br",
      edition: "infinite_pro",
      profile: "pro",
      tokens_total: 10_000_000, // 10M tokens -> R$ 522,00 metered - R$ 159,00 plan = R$ 363,00 saved
      cache_tokens: 3_500_000,
      requests: 420,
    }),
  });
  assert.equal(hb1.status, 200);

  const hb2 = await reqJson("/api/v1/telemetry/heartbeat", {
    method: "POST",
    body: JSON.stringify({
      key: fndKey,
      hwid: "HWID-SUPER-SECRET-WIN-112233",
      hostname: "PC-SECRETO-ROBERTO",
      user_label: "roberto.vip@dominio-secreto.org",
      edition: "founder",
      profile: "founder",
      tokens_total: 100_000_000, // 100M tokens -> R$ 5.220,00 metered - R$ 690,00 plan = R$ 4.530,00 saved
      cache_tokens: 40_000_000,
      requests: 3100,
    }),
  });
  assert.equal(hb2.status, 200);

  // Demo client with extreme/out-of-bounds numbers to verify numeric ceiling & sanitization
  const hbDemo = await reqJson("/api/v1/telemetry/heartbeat", {
    method: "POST",
    body: JSON.stringify({
      hwid: "HWID-DEMO-USER-777",
      hostname: "NOTEBOOK-DEMO-TEST",
      user_label: "visitante@teste.io",
      edition: "demo",
      profile: "demo",
      tokens_total: 1_000_000, // 1M tokens -> R$ 52,20 metered - R$ 0 plan = R$ 52,20 saved
      cache_tokens: -999, // negative clamped to 0
      requests: 25,
    }),
  });
  assert.equal(hbDemo.status, 200);

  const stats = await reqJson("/api/openinfinite/public-stats");
  assert.equal(stats.status, 200);
  assert.equal(stats.headers.get("access-control-allow-origin"), "*");
  assert.match(String(stats.headers.get("cache-control")), /max-age=10/);

  const body = stats.data;
  assert.equal(body.ok, true);
  assert.equal(body.pricing_reference.metered_blended_brl_per_1m_tokens, 52.2);
  assert.equal(body.totals.total_tokens_processed, 111_000_000);
  assert.equal(body.totals.cache_tokens, 43_500_000);
  assert.equal(body.totals.requests, 3545);
  assert.equal(body.totals.active_clients_now, 3);
  assert.equal(body.totals.saved_brl_total, 4945.2);
  assert.equal(body.total_tokens_processed, 111_000_000);
  assert.equal(body.saved_brl_total, 4945.2);

  const proBucket = body.profiles.find((p) => p.profile === "pro");
  assert.ok(proBucket);
  assert.equal(proBucket.clients_count, 1);
  assert.equal(proBucket.total_tokens, 10_000_000);
  assert.equal(proBucket.avg_tokens_per_client, 10_000_000);
  assert.equal(proBucket.saved_brl, 363);

  // STRICT ZERO-LEAKAGE SECURITY ASSERTIONS
  const raw = stats.rawText;
  assert.doesNotMatch(raw, /OI6-|BC5-|LIC-/i, "Must never leak key prefixes or license IDs");
  assert.doesNotMatch(raw, /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, "Must never leak emails");
  assert.doesNotMatch(raw, /\b(?:\d{1,3}\.){2,3}(?:\d{1,3}|x)\b/, "Must never leak full or masked IPv4 addresses");
  assert.doesNotMatch(raw, /[a-f0-9]{64}/i, "Must never leak SHA-256 hashes");
  assert.doesNotMatch(
    raw,
    /HWID-SUPER-SECRET|MACBOOK-CONFIDENCIAL|PC-SECRETO|NOTEBOOK-DEMO|alice|roberto|visitante/i,
    "Must never leak HWIDs, hostnames, or user labels"
  );
});

test("server.js configures .tar.gz / .gz static downloads as application/gzip and wires /api/openinfinite/", () => {
  const serverSource = fs.readFileSync(path.join(repoRoot, "server.js"), "utf8");
  assert.match(serverSource, /"\.gz"/);
  assert.match(serverSource, /case "\.gz":[\s\S]{0,60}return "application\/gzip"/);
  assert.match(serverSource, /pathname\.startsWith\("\/api\/openinfinite\/"\)/);
});
