"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");

const { createSuperbadSalesApi, EDITION_PLANS } = require("../badclaude-superbad-api");
const { criarVendaBadclaude } = require("../badclaude-venda");

function makeKeyPair() {
  return crypto.generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
}

function signLicense({ tier, tierCode, days = 30, label = "Teste" }, privPem) {
  const iat = Date.now();
  const exp = iat + days * 86400000;
  const payload = { tier, days, iat, exp, label, issuer: "juniorplay-local" };
  const input = `BC5-${tierCode}-${Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")}`;
  const sig = crypto.sign(null, Buffer.from(input, "utf8"), privPem).toString("base64url");
  return `${input}.${sig}`;
}

function signOwnerProof(method, pathname, privPem) {
  const ts = String(Date.now());
  const nonce = crypto.randomBytes(12).toString("hex");
  const msg = `owner-proof:${ts}:${nonce}:${method.toUpperCase()}:${pathname}`;
  const sig = crypto.sign(null, Buffer.from(msg, "utf8"), privPem).toString("base64url");
  return `${ts}.${nonce}.${sig}`;
}

async function startTempServer(api) {
  const server = http.createServer((req, res) => {
    const u = new URL(req.url || "/", "http://127.0.0.1");
    api.handleApi(req, res, u.pathname, u.searchParams);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

describe("BadClaude Cloud Licensing, PIX 68 99226-9296 & Dashboard Control Sync", () => {
  it("removes legacy non-existent PIX 99566741204 across venda modules", () => {
    const vendaSrc = fs.readFileSync(path.join(__dirname, "..", "badclaude-venda.js"), "utf8");
    assert.equal(vendaSrc.includes("99566741204"), false);
    assert.equal(vendaSrc.includes("ANTONIO CLOVIS"), false);
    assert.equal(vendaSrc.includes("+5568992269296"), true);

    const apiSrc = fs.readFileSync(path.join(__dirname, "..", "badclaude-superbad-api.js"), "utf8");
    assert.equal(apiSrc.includes("99566741204"), false);
    assert.equal(apiSrc.includes("68 99226-9296"), true);
    assert.ok(EDITION_PLANS.founder && EDITION_PLANS.basic && EDITION_PLANS.mid && EDITION_PLANS.superbad);
    assert.deepEqual(EDITION_PLANS.basic.freeProvidersIncluded, ["openrouter"]);
    assert.deepEqual(EDITION_PLANS.mid.freeProvidersIncluded, ["openrouter", "google", "omnirouter"]);
    assert.equal(EDITION_PLANS.superbad.freeProvidersIncluded.includes("nvidia-chat-21"), true);
    assert.equal(EDITION_PLANS.founder.freeProvidersIncluded.includes("nvidia-full-38"), true);
    const texteHtml = fs.readFileSync(path.join(__dirname, "..", "badclaude", "superbad-texte", "index.html"), "utf8");
    assert.equal(texteHtml.includes("38 modelos gratuitos NVIDIA Build"), true);
    assert.equal(texteHtml.includes("trocar qualquer chave depois"), true);
  });

  it("supports multi-plan PIX 68 99226-9296, Ed25519 + HWID lock, Dashboard Control Owner-Proof & revocation", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "badclaude-czs-"));
    const { publicKey, privateKey } = makeKeyPair();
    const api = createSuperbadSalesApi({
      rootDir: path.join(__dirname, ".."),
      dataDir: tmpDir,
      publicKeyPem: publicKey,
      environment: { NODE_ENV: "test" },
    });
    const { server, baseUrl } = await startTempServer(api);

    try {
      // 1. Order for Founder tier on PIX 68 99226-9296
      const ordRes = await fetch(`${baseUrl}/api/superbad/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_name: "Comprador Fundador",
          buyer_contact: "68999990000",
          requested_edition: "founder",
        }),
      });
      assert.equal(ordRes.status, 201);
      const ordJson = await ordRes.json();
      assert.equal(ordJson.order.amount_centavos, 69000);
      assert.equal(ordJson.order.pix.key, "68 99226-9296");
      assert.equal(ordJson.order.pix.recipient, "Raiane Leoncio");

      // 2. Dashboard Control registers local-signed Ed25519 Founder key using Owner-Proof (no private key sent!)
      const founderKey = signLicense({ tier: "founder", tierCode: "FND", days: 30, label: "Fundador 1" }, privateKey);
      const keySha = crypto.createHash("sha256").update(founderKey, "utf8").digest("hex");
      const regPath = "/api/superbad/admin/licenses/register";
      const regRes = await fetch(`${baseUrl}${regPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BadClaude-Owner-Proof": signOwnerProof("POST", regPath, privateKey),
        },
        body: JSON.stringify({
          license_id: "LIC-FND-01",
          key_hash: keySha,
          key_prefix: founderKey.slice(0, 10),
          edition: "founder",
          tier: "founder",
          label: "Comprador Fundador",
          days: 30,
          max_hwids: 1,
          order_id: ordJson.order.order_id,
        }),
      });
      assert.equal(regRes.status, 200);
      const regJson = await regRes.json();
      assert.equal(regJson.license.revoked, false);

      // 3. First device (HWID-A) verifies Founder key -> 200 OK
      const verA = await fetch(`${baseUrl}/api/v1/licenses/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: founderKey, hwid: "hwid-machine-a", hostname: "PC-A" }),
      });
      assert.equal(verA.status, 200);
      const verAJson = await verA.json();
      assert.equal(verAJson.tier, "founder");
      assert.ok(verAJson.unlockedModes.includes("founder-vip"));

      // 4. Second unauthorized device (HWID-B) tries same Founder key -> 403 HWID_MISMATCH
      const verB = await fetch(`${baseUrl}/api/v1/licenses/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: founderKey, hwid: "hwid-machine-b", hostname: "PC-B" }),
      });
      assert.equal(verB.status, 403);
      const verBJson = await verB.json();
      assert.equal(verBJson.code, "HWID_MISMATCH");

      // 5. Heartbeat telemetry updates live network view for Dashboard Control
      const hbRes = await fetch(`${baseUrl}/api/v1/telemetry/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key_hash: keySha,
          hwid: "hwid-machine-a",
          hostname: "PC-A",
          edition: "founder",
          version: "6.4.0",
          watchdog_ok: true,
          requests_count: 12,
          tokens_est: 4500,
        }),
      });
      assert.equal(hbRes.status, 200);

      const netPath = "/api/superbad/admin/network";
      const netRes = await fetch(`${baseUrl}${netPath}`, {
        headers: { "X-BadClaude-Owner-Proof": signOwnerProof("GET", netPath, privateKey) },
      });
      assert.equal(netRes.status, 200);
      const netJson = await netRes.json();
      assert.equal(netJson.summary.onlineNow, 1);
      assert.equal(netJson.network_nodes[0].hwid, "hwid-machine-a");

      // 6. Owner revokes Founder license -> immediate 403 LICENSE_REVOKED
      const revPath = "/api/superbad/admin/licenses/LIC-FND-01/revoke";
      const revRes = await fetch(`${baseUrl}${revPath}`, {
        method: "POST",
        headers: { "X-BadClaude-Owner-Proof": signOwnerProof("POST", revPath, privateKey) },
      });
      assert.equal(revRes.status, 200);

      const verAfterRev = await fetch(`${baseUrl}/api/v1/licenses/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: founderKey, hwid: "hwid-machine-a" }),
      });
      assert.equal(verAfterRev.status, 403);
      const revCheck = await verAfterRev.json();
      assert.equal(revCheck.code, "LICENSE_REVOKED");

      // 7. Cloud update manifest strictly blocks owner-master channel
      const forbiddenUpd = await fetch(`${baseUrl}/api/updates/manifest?edition=owner-master`);
      assert.equal(forbiddenUpd.status, 403);

      // Publish signed founder update manifest & fetch it
      const pubPath = "/api/superbad/admin/updates/manifest";
      const canonical = JSON.stringify({
        version: "6.5.0",
        channel: "founder",
        platform: "win32-x64",
        sha256: "a".repeat(64),
        url: "https://cdn.example.invalid/founder.zip",
        securityInvariants: {
          watchdogRequired: true,
          appOnlyClosedRequired: true,
          forbidPaidFallbackFromClaude: true,
          forbidKeygenAdminModules: true,
        },
      });
      const sigEd = crypto.sign(null, Buffer.from(canonical, "utf8"), privateKey).toString("base64url");
      const pubRes = await fetch(`${baseUrl}${pubPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BadClaude-Owner-Proof": signOwnerProof("POST", pubPath, privateKey),
        },
        body: JSON.stringify({
          channel: "founder",
          version: "6.5.0",
          sha256: "a".repeat(64),
          url: "https://cdn.example.invalid/founder.zip",
          signatureEd25519: sigEd,
        }),
      });
      assert.equal(pubRes.status, 200);

      const founderManifestRes = await fetch(`${baseUrl}/api/updates/manifest?edition=founder`);
      assert.equal(founderManifestRes.status, 200);
      const fm = await founderManifestRes.json();
      assert.equal(fm.version, "6.5.0");
      assert.equal(fm.securityInvariants.watchdogRequired, true);
    } finally {
      server.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("supports delta bundle upload, licensed update download without counting downloads_used, cross-tier 403, revocation & selective heartbeat", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "badclaude-delta-"));
    const releasesDir = path.join(tmpDir, "releases");
    const { publicKey, privateKey } = makeKeyPair();
    const api = createSuperbadSalesApi({
      rootDir: path.join(__dirname, ".."),
      dataDir: tmpDir,
      releasesDir,
      publicKeyPem: publicKey,
      environment: { NODE_ENV: "test" },
    });
    const { server, baseUrl } = await startTempServer(api);

    try {
      // Buffer ZIP válido mínimo (PK\x03\x04 + payload determinístico)
      const zipPayload = Buffer.concat([
        Buffer.from([0x50, 0x4b, 0x03, 0x04]),
        Buffer.from("badclaude-delta-test-6.6.0-payload", "utf8"),
      ]);
      const expectedSha256 = crypto.createHash("sha256").update(zipPayload).digest("hex");

      // 1. Upload de delta bundle protegido por Owner-Proof (+ atualização do pacote canônico)
      const bundlePath = "/api/superbad/admin/updates/bundle";
      const upRes = await fetch(
        `${baseUrl}${bundlePath}?channel=founder&version=6.6.0&alsoUpdateRelease=1`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/zip",
            "X-BadClaude-Owner-Proof": signOwnerProof("POST", bundlePath, privateKey),
          },
          body: zipPayload,
        }
      );
      assert.equal(upRes.status, 200);
      const upJson = await upRes.json();
      assert.equal(upJson.ok, true);
      assert.equal(upJson.channel, "founder");
      assert.equal(upJson.version, "6.6.0");
      assert.equal(upJson.sha256, expectedSha256);
      assert.equal(upJson.sizeBytes, zipPayload.length);
      assert.equal(upJson.downloadUrl, "/api/updates/download?channel=founder&version=6.6.0");
      assert.equal(
        fs.existsSync(path.join(releasesDir, "BadClaude-Founder-Desktop.zip")),
        true
      );

      // 2. Publica manifest com forceImmediate e notes
      const pubPath = "/api/superbad/admin/updates/manifest";
      const pubRes = await fetch(`${baseUrl}${pubPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BadClaude-Owner-Proof": signOwnerProof("POST", pubPath, privateKey),
        },
        body: JSON.stringify({
          channel: "founder",
          version: "6.6.0",
          sha256: expectedSha256,
          url: upJson.downloadUrl,
          sizeBytes: zipPayload.length,
          forceImmediate: true,
          notes: "Atualização crítica de segurança",
        }),
      });
      assert.equal(pubRes.status, 200);
      const pubJson = await pubRes.json();
      assert.equal(pubJson.manifest.forceImmediate, true);
      assert.equal(pubJson.manifest.notes, "Atualização crítica de segurança");

      // 3. Registra licenças Founder e Basic
      const founderKey = signLicense({ tier: "founder", tierCode: "FND", days: 30, label: "Founder Delta" }, privateKey);
      const founderSha = crypto.createHash("sha256").update(founderKey, "utf8").digest("hex");
      const basicKey = signLicense({ tier: "client-basic", tierCode: "BSC", days: 30, label: "Basic Delta" }, privateKey);
      const basicSha = crypto.createHash("sha256").update(basicKey, "utf8").digest("hex");

      const regPath = "/api/superbad/admin/licenses/register";
      for (const [licId, sha, ed, tier, key] of [
        ["LIC-FND-DLT", founderSha, "founder", "founder", founderKey],
        ["LIC-BSC-DLT", basicSha, "basic", "client-basic", basicKey],
      ]) {
        const r = await fetch(`${baseUrl}${regPath}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-BadClaude-Owner-Proof": signOwnerProof("POST", regPath, privateKey),
          },
          body: JSON.stringify({
            license_id: licId,
            key_hash: sha,
            key_prefix: key.slice(0, 10),
            edition: ed,
            tier,
            days: 30,
          }),
        });
        assert.equal(r.status, 200);
      }

      // 4. Sem licença -> 403
      const noKeyRes = await fetch(`${baseUrl}${upJson.downloadUrl}`);
      assert.equal(noKeyRes.status, 403);

      // 5. Cross-tier: client-basic tentando canal founder -> 403 CHANNEL_TIER_FORBIDDEN
      const crossTierRes = await fetch(`${baseUrl}${upJson.downloadUrl}`, {
        headers: { "X-BadClaude-License": basicKey },
      });
      assert.equal(crossTierRes.status, 403);
      const crossTierJson = await crossTierRes.json();
      assert.equal(crossTierJson.code, "CHANNEL_TIER_FORBIDDEN");

      // 6. Founder baixa com sucesso, SHA-256 bate e downloads_used permanece 0
      const okDlRes = await fetch(`${baseUrl}${upJson.downloadUrl}`, {
        headers: { "X-BadClaude-License": founderKey },
      });
      assert.equal(okDlRes.status, 200);
      assert.equal(okDlRes.headers.get("content-type"), "application/zip");
      const dlBuf = Buffer.from(await okDlRes.arrayBuffer());
      const dlSha = crypto.createHash("sha256").update(dlBuf).digest("hex");
      assert.equal(dlSha, expectedSha256);

      const ordersPath = "/api/superbad/admin/orders";
      const ordersRes = await fetch(`${baseUrl}${ordersPath}`, {
        headers: { "X-BadClaude-Owner-Proof": signOwnerProof("GET", ordersPath, privateKey) },
      });
      assert.equal(ordersRes.status, 200);
      const ordersJson = await ordersRes.json();
      const founderLicRecord = ordersJson.licenses.find((l) => l.license_id === "LIC-FND-DLT");
      assert.equal(founderLicRecord.downloads_used, 0);

      // 7. Seletividade do heartbeat:
      // 7a. Chave Ed25519 nova via header x-badclaude-license auto-enrola e recebe update_available + force_immediate
      const freshFounderKey = signLicense({ tier: "founder", tierCode: "FND", days: 30, label: "Founder Auto" }, privateKey);
      const hbOutdated = await fetch(`${baseUrl}/api/v1/telemetry/heartbeat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BadClaude-License": freshFounderKey,
        },
        body: JSON.stringify({
          hwid: "hwid-auto-1",
          hostname: "PC-AUTO",
          version: "6.5.0",
        }),
      });
      assert.equal(hbOutdated.status, 200);
      const hbOutJson = await hbOutdated.json();
      assert.equal(hbOutJson.active, true);
      assert.equal(hbOutJson.update_available, true);
      assert.equal(hbOutJson.latest_version, "6.6.0");
      assert.equal(hbOutJson.force_immediate, true);
      assert.equal(hbOutJson.delta_url, "/api/updates/download?channel=founder&version=6.6.0");

      // 7b. Mesma versão -> update_available = false
      const hbCurrent = await fetch(`${baseUrl}/api/v1/telemetry/heartbeat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BadClaude-License": freshFounderKey,
        },
        body: JSON.stringify({
          hwid: "hwid-auto-1",
          version: "6.6.0",
        }),
      });
      assert.equal(hbCurrent.status, 200);
      const hbCurJson = await hbCurrent.json();
      assert.equal(hbCurJson.update_available, false);
      assert.equal(hbCurJson.force_immediate, true);

      // 7c. client-basic sem manifest publicado no seu canal -> update_available = false, force_immediate = false
      const hbBasic = await fetch(`${baseUrl}/api/v1/telemetry/heartbeat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BadClaude-License": basicKey,
        },
        body: JSON.stringify({
          hwid: "hwid-bsc-1",
          version: "6.5.0",
        }),
      });
      assert.equal(hbBasic.status, 200);
      const hbBasicJson = await hbBasic.json();
      assert.equal(hbBasicJson.update_available, false);
      assert.equal(hbBasicJson.force_immediate, false);
      assert.equal(hbBasicJson.delta_url, null);

      // 8. Revogação da licença Founder bloqueia /api/updates/download -> 403 LICENSE_REVOKED
      const revPath = "/api/superbad/admin/licenses/LIC-FND-DLT/revoke";
      const revRes = await fetch(`${baseUrl}${revPath}`, {
        method: "POST",
        headers: { "X-BadClaude-Owner-Proof": signOwnerProof("POST", revPath, privateKey) },
      });
      assert.equal(revRes.status, 200);

      const dlAfterRev = await fetch(`${baseUrl}${upJson.downloadUrl}`, {
        headers: { "X-BadClaude-License": founderKey },
      });
      assert.equal(dlAfterRev.status, 403);
      const dlRevJson = await dlAfterRev.json();
      assert.equal(dlRevJson.code, "LICENSE_REVOKED");
    } finally {
      server.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("permits .glb 3D hound, .mp3 cues and application/javascript .mjs modules in server.js", () => {
    const serverSrc = fs.readFileSync(path.join(__dirname, "..", "server.js"), "utf8");
    assert.match(serverSrc, /"\.glb"/);
    assert.match(serverSrc, /"\.mjs"/);
    assert.match(serverSrc, /case "\.mjs":\s*return "application\/javascript; charset=utf-8";/);
    assert.match(serverSrc, /badclaudeExt[\s\S]{0,180}"\.glb"[\s\S]{0,80}"\.mp3"/);
  });
});
