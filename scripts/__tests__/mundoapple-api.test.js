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
  const publicCatalog = await catalogResponse.json();
  assert.deepEqual(publicCatalog.items, []);
  assert.equal(publicCatalog.delivery.baseFeeCents, 3_000);
  assert.deepEqual(
    publicCatalog.delivery.providers.map((provider) => provider.label),
    ["99 Entrega", "Logística local", "Preço a combinar"],
  );

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

test("demo Pix checkout preserves the selected color and server-side price", async (t) => {
  const { request, store } = await createFixture(t);
  const inventory = await store.addInventory({
    catalogKey: catalog[0].key,
    quantity: 3,
    color: "Preto",
    colorVariants: [
      { name: "Preto", hex: "#111111", quantity: 1 },
      { name: "Azul", hex: "#123456", quantity: 2 },
    ],
    condition: "new",
    warrantyDays: 365,
    purchasePriceCents: 300_000,
    webPriceCents: 450_000,
    pickupPriceCents: 430_000,
    published: true,
  });

  const response = await request("/api/mundoapple/checkout/pix", {
    method: "POST",
    body: JSON.stringify({
      inventoryId: inventory.id,
      selectedColor: "Azul",
      quantity: 1,
      deliveryMode: "delivery",
      deliveryProvider: "99-entrega",
      customerName: "Cliente Teste",
      customerPhone: "68999999999",
      customerDocument: "00000000000",
      address: {
        street: "Avenida Copacabana",
        number: "100",
        neighborhood: "Centro",
        city: "Cruzeiro do Sul",
        state: "AC",
        postalCode: "69980-000",
        complement: "Sala 2",
      },
    }),
  });

  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.item.selectedColor, "Azul");
  assert.equal(payload.item.subtotalCents, 450_000);
  assert.equal(payload.item.deliveryFeeCents, 3_000);
  assert.equal(payload.item.amountCents, 453_000);
  assert.equal(payload.item.deliveryProvider, "99-entrega");
  assert.equal(payload.item.deliveryProviderLabel, "99 Entrega");
  assert.equal(payload.item.payable, false);
  assert.equal(payload.item.mode, "demo");
  assert.match(payload.item.qrCodeDataUrl, /^data:image\/png;base64,/);

  const sale = (await store.listSales()).at(-1);
  assert.equal(sale.selectedColor, "Azul");
  assert.equal(sale.priceCents, 453_000);
  assert.equal(sale.deliveryFeeCents, 3_000);
  assert.equal(sale.deliveryProvider, "99-entrega");
  assert.match(sale.customerAddress, /Avenida Copacabana/);

  const unavailable = await request("/api/mundoapple/checkout/pix", {
    method: "POST",
    body: JSON.stringify({
      inventoryId: inventory.id,
      selectedColor: "Vermelho",
      quantity: 1,
      deliveryMode: "pickup",
      customerName: "Cliente Teste",
      customerPhone: "68999999999",
    }),
  });
  assert.equal(unavailable.status, 400);
});

test("admin configures the Vale do Jurua delivery fee with a R$ 30 minimum", async (t) => {
  const { request } = await createFixture(t);
  const loginResponse = await request("/api/mundoapple/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "matheus", password: "senha-segura-de-teste" }),
  });
  const cookie = loginResponse.headers.get("set-cookie").split(";")[0];

  const initialResponse = await request("/api/mundoapple/admin/settings/delivery", {
    headers: { cookie },
  });
  assert.equal(initialResponse.status, 200);
  assert.equal((await initialResponse.json()).item.baseFeeCents, 3_000);

  const updateResponse = await request("/api/mundoapple/admin/settings/delivery", {
    method: "PATCH",
    headers: { cookie },
    body: JSON.stringify({ baseFeeCents: 4_500 }),
  });
  assert.equal(updateResponse.status, 200);
  assert.equal((await updateResponse.json()).item.baseFeeCents, 4_500);

  const catalogResponse = await request("/api/mundoapple/catalog");
  assert.equal((await catalogResponse.json()).delivery.baseFeeCents, 4_500);

  const invalidResponse = await request("/api/mundoapple/admin/settings/delivery", {
    method: "PATCH",
    headers: { cookie },
    body: JSON.stringify({ baseFeeCents: 2_999 }),
  });
  assert.equal(invalidResponse.status, 400);
  assert.match((await invalidResponse.json()).error, /mínima.*R\$ 30/i);
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

test("demo and reports routes are protected and seed the Matheus showcase", async (t) => {
  const { request } = await createFixture(t);
  assert.equal((await request("/api/mundoapple/admin/reports")).status, 401);
  assert.equal((await request("/api/mundoapple/admin/demo", { method: "POST" })).status, 401);

  const loginResponse = await request("/api/mundoapple/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "matheus", password: "senha-segura-de-teste" }),
  });
  const cookie = loginResponse.headers.get("set-cookie").split(";")[0];
  const seedResponse = await request("/api/mundoapple/admin/demo", {
    method: "POST",
    headers: { cookie },
    body: JSON.stringify({ count: 50 }),
  });
  assert.equal(seedResponse.status, 201);
  assert.equal((await seedResponse.json()).item.productCount, 50);

  const publicResponse = await request("/api/mundoapple/catalog");
  assert.equal((await publicResponse.json()).items.length, 50);

  const reportsResponse = await request("/api/mundoapple/admin/reports", {
    headers: { cookie },
  });
  const reports = await reportsResponse.json();
  assert.equal(reports.item.profile.username, "matheus");
  assert.equal(reports.item.demo.productCount, 50);
});
