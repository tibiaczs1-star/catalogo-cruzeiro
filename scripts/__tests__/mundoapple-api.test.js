const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");

const catalog = require("../../mundoapple/data/apple-products.json");
const { hashPassword } = require("../../mundoapple/server/auth");
const { createMundoAppleHandler } = require("../../mundoapple/server/http");
const { createJsonStore } = require("../../mundoapple/server/store");

async function createFixture(t, overrides = {}) {
  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "mundoapple-api-"));
  t.after(() => fs.rm(tempDirectory, { recursive: true, force: true }));
  const store = createJsonStore({
    filePath: path.join(tempDirectory, "state.json"),
    catalog,
  });
  await store.initialize();
  const passwordHash = await hashPassword("senha-segura-de-teste", {
    iterations: 10_000,
    salt: "mundoapple-api-test",
  });
  const handler = createMundoAppleHandler({
    store,
    catalog,
    adminUser: "matheus",
    passwordHash,
    sessionSecret: "segredo-de-sessao-com-mais-de-trinta-e-dois-caracteres",
    secureCookies: false,
    documentsDir: path.join(tempDirectory, "documents"),
    ...overrides,
  });
  const server = http.createServer((req, res) => {
    handler(req, res).then((handled) => {
      if (!handled && !res.writableEnded) {
        res.writeHead(404);
        res.end();
      }
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const { port } = server.address();

  async function request(pathname, options = {}) {
    return fetch(`http://127.0.0.1:${port}${pathname}`, {
      ...options,
      headers: {
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });
  }

  return { request, store };
}

test("public catalog is open while administrative data requires a session", async (t) => {
  const { request } = await createFixture(t);
  const catalogResponse = await request("/api/mundoapple/catalog");
  assert.equal(catalogResponse.status, 200);
  assert.deepEqual((await catalogResponse.json()).items, []);

  const dashboardResponse = await request("/api/mundoapple/admin/dashboard");
  assert.equal(dashboardResponse.status, 401);
});

test("login issues a protected session and exposes the master activation catalog", async (t) => {
  const { request } = await createFixture(t);
  const loginResponse = await request("/api/mundoapple/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "matheus", password: "senha-segura-de-teste" }),
  });
  assert.equal(loginResponse.status, 200);
  assert.match(loginResponse.headers.get("set-cookie"), /HttpOnly/);
  assert.match(loginResponse.headers.get("set-cookie"), /SameSite=Strict/);

  const cookie = loginResponse.headers.get("set-cookie").split(";")[0];
  const adminCatalog = await request("/api/mundoapple/admin/catalog", {
    headers: { cookie },
  });
  assert.equal(adminCatalog.status, 200);
  assert.equal((await adminCatalog.json()).items.length, 184);
});

test("payments stay disabled until a supported gateway is explicitly configured", async (t) => {
  const { request } = await createFixture(t);
  const response = await request("/api/mundoapple/payments/status");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    enabled: false,
    mode: "disabled",
    providers: ["Mercado Pago", "PagBank", "Asaas"],
  });
});

test("authenticated document upload validates and persists payment proof metadata", async (t) => {
  const { request } = await createFixture(t);
  const loginResponse = await request("/api/mundoapple/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "matheus", password: "senha-segura-de-teste" }),
  });
  const cookie = loginResponse.headers.get("set-cookie").split(";")[0];
  const content = Buffer.from("arquivo de teste").toString("base64");
  const uploadResponse = await request("/api/mundoapple/admin/documents", {
    method: "POST",
    headers: { cookie },
    body: JSON.stringify({
      name: "comprovante.pdf",
      mimeType: "application/pdf",
      kind: "payment-proof",
      contentBase64: content,
    }),
  });
  assert.equal(uploadResponse.status, 201);
  const payload = await uploadResponse.json();
  assert.equal(payload.item.name, "comprovante.pdf");
  assert.equal(payload.item.kind, "payment-proof");
  assert.equal("contentBase64" in payload.item, false);
});
