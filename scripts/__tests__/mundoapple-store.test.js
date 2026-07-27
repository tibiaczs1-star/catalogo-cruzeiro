const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const catalog = require("../../mundoapple/data/apple-products.json");
const { createJsonStore } = require("../../mundoapple/server/store");

test("inventory activation, settlement and cash posting are atomic and idempotent", async (t) => {
  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "mundoapple-store-"));
  t.after(() => fs.rm(tempDirectory, { recursive: true, force: true }));
  const store = createJsonStore({
    filePath: path.join(tempDirectory, "state.json"),
    catalog,
  });
  await store.initialize();

  const inventory = await store.addInventory({
    catalogKey: catalog[0].key,
    condition: "seminovo",
    quantity: 99,
    colorVariants: [
      { name: "Preto", hex: "#1d1d1f", quantity: 1 },
      { name: "Azul", hex: "#4f6f8f", quantity: 1 },
    ],
    warrantyDays: 90,
    batteryHealth: 91,
    imei: "000000000000001",
    color: "Preto",
    storage: "128 GB",
    purchasePriceCents: 300_000,
    freightCents: 5_000,
    motoboyCents: 2_000,
    packagingCents: 1_000,
    preparationCents: 4_000,
    warrantyReserveCents: 8_000,
    webPriceCents: 450_000,
    pickupPriceCents: 430_000,
    published: true,
  });
  assert.equal(inventory.totalCostCents, 320_000);
  assert.equal(inventory.quantity, 2);
  assert.equal((await store.listPublicCatalog()).length, 1);

  const sale = await store.createSale({
    inventoryId: inventory.id,
    selectedColor: "Azul",
    quantity: 1,
    customerName: "Cliente Teste",
    customerDocument: "000.000.000-00",
    customerPhone: "68999999999",
    priceCents: 430_000,
    discountCents: 5_000,
    paymentMethod: "card",
    tradeIn: {
      model: "iPhone usado",
      imei: "000000000000002",
      condition: "used",
      appraisedValueCents: 25_000,
      notes: "Entrada avaliada no balcão",
    },
  });

  assert.equal((await store.getInventory(inventory.id)).quantity, 2);
  const settled = await store.settleSale(sale.id, {
    idempotencyKey: "payment-1",
    receivedCents: 425_000,
    paymentMethod: "card",
    paymentFeeCents: 10_000,
    saleExpensesCents: 2_000,
  });
  assert.equal(settled.status, "paid");
  assert.equal(settled.selectedColor, "Azul");
  assert.equal(settled.profitCents, 88_000);
  const inventoryAfterSettlement = await store.getInventory(inventory.id);
  assert.equal(inventoryAfterSettlement.quantity, 1);
  assert.deepEqual(inventoryAfterSettlement.colorVariants, [
    { name: "Preto", hex: "#1d1d1f", quantity: 1 },
    { name: "Azul", hex: "#4f6f8f", quantity: 0 },
  ]);

  const duplicate = await store.settleSale(sale.id, {
    idempotencyKey: "payment-1",
    receivedCents: 425_000,
    paymentMethod: "card",
    paymentFeeCents: 10_000,
    saleExpensesCents: 2_000,
  });
  assert.equal(duplicate.id, settled.id);
  assert.equal((await store.getInventory(inventory.id)).quantity, 1);
  assert.equal((await store.listCashEntries()).length, 1);
});

test("a sale cannot reserve a missing or unavailable color", async (t) => {
  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "mundoapple-colors-"));
  t.after(() => fs.rm(tempDirectory, { recursive: true, force: true }));
  const store = createJsonStore({
    filePath: path.join(tempDirectory, "state.json"),
    catalog,
  });
  await store.initialize();

  const inventory = await store.addInventory({
    catalogKey: catalog[0].key,
    condition: "new",
    colorVariants: [{ name: "Branco", hex: "#f4f1ea", quantity: 1 }],
    warrantyDays: 365,
    purchasePriceCents: 300_000,
    webPriceCents: 450_000,
    pickupPriceCents: 430_000,
    published: true,
  });

  await assert.rejects(
    store.createSale({
      inventoryId: inventory.id,
      selectedColor: "Preto",
      quantity: 1,
      customerName: "Cliente Teste",
      priceCents: 450_000,
      paymentMethod: "pix",
    }),
    /Cor indisponível/,
  );
});

test("expenses and document metadata feed the administrative dashboard", async (t) => {
  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "mundoapple-store-"));
  t.after(() => fs.rm(tempDirectory, { recursive: true, force: true }));
  const store = createJsonStore({
    filePath: path.join(tempDirectory, "state.json"),
    catalog,
  });
  await store.initialize();

  await store.addExpense({
    description: "Motoboy",
    category: "logistics",
    amountCents: 3_500,
    occurredAt: "2026-07-26",
  });
  await store.addDocument({
    name: "comprovante.pdf",
    mimeType: "application/pdf",
    size: 1200,
    relativePath: "documents/teste.pdf",
    kind: "payment-proof",
  });

  const dashboard = await store.getDashboard();
  assert.equal(dashboard.expensesCents, 3_500);
  assert.equal(dashboard.documentCount, 1);
  assert.equal(dashboard.stockUnits, 0);
});

test("Matheus demo seeds exactly 50 published products and business reports", async (t) => {
  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "mundoapple-demo-"));
  t.after(() => fs.rm(tempDirectory, { recursive: true, force: true }));
  const store = createJsonStore({
    filePath: path.join(tempDirectory, "state.json"),
    catalog,
  });
  await store.initialize();

  const first = await store.seedDemo({ ownerUsername: "matheus", count: 50 });
  const second = await store.seedDemo({ ownerUsername: "matheus", count: 50 });
  const publicItems = await store.listPublicCatalog();
  const reports = await store.getReports({ ownerUsername: "matheus" });

  assert.equal(first.productCount, 50);
  assert.equal(second.productCount, 50);
  assert.equal(publicItems.length, 50);
  assert.ok(publicItems.every((item) => item.isDemo && item.ownerUsername === "matheus"));
  assert.ok(publicItems.every((item) => (
    Array.isArray(item.colorVariants)
    && item.colorVariants.length >= 1
    && item.colorVariants.every((variant) => (
      variant.name
      && /^#[0-9a-f]{6}$/i.test(variant.hex)
      && Number.isSafeInteger(variant.quantity)
      && variant.quantity >= 0
    ))
    && item.colorVariants.reduce((sum, variant) => sum + variant.quantity, 0) === item.quantity
  )));
  assert.ok(publicItems.every((item) => (
    /^assets\/products-ai\/[a-z0-9-]+\.png$/i.test(item.artPath || "")
  )));
  assert.equal(new Set(publicItems.map((item) => item.artPath)).size, 50);
  await Promise.all(publicItems.map((item) => (
    fs.access(path.join(__dirname, "../../mundoapple/public", item.artPath))
  )));
  const airTag = publicItems.find((item) => item.catalogKey === "airtag-2-2026");
  const visionPro = publicItems.find((item) => item.catalogKey === "apple-vision-pro-m5-2025");
  const appleTv = publicItems.find((item) => item.catalogKey === "apple-tv-4k-3-2022");
  const iphone16e = publicItems.find((item) => item.catalogKey === "iphone-16e-2025");
  const ipadA16 = publicItems.find((item) => item.catalogKey === "ipad-a16-2025");
  const ipadAir = publicItems.find((item) => item.catalogKey === "ipad-air-13-m3-2025");
  assert.equal(airTag.storage, "");
  assert.ok(airTag.webPriceCents >= 50_000 && airTag.webPriceCents <= 150_000);
  assert.ok(visionPro.webPriceCents >= 3_000_000);
  assert.ok(["64 GB", "128 GB"].includes(appleTv.storage));
  assert.ok(["128 GB", "256 GB", "512 GB"].includes(iphone16e.storage));
  assert.ok(["128 GB", "256 GB", "512 GB"].includes(ipadA16.storage));
  assert.ok(["Azul", "Roxo", "Cinza espacial", "Branco estelar"].includes(ipadAir.color));
  assert.equal(reports.profile.username, "matheus");
  assert.equal(reports.demo.productCount, 50);
  assert.ok(reports.summary.grossRevenueCents > 0);
  assert.ok(reports.paymentMix.length >= 3);
  assert.ok(reports.categoryMix.length >= 5);
  assert.ok(reports.salesTimeline.length >= 5);
});

test("clearing demo data preserves real inventory", async (t) => {
  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "mundoapple-demo-clear-"));
  t.after(() => fs.rm(tempDirectory, { recursive: true, force: true }));
  const store = createJsonStore({
    filePath: path.join(tempDirectory, "state.json"),
    catalog,
  });
  await store.initialize();
  const real = await store.addInventory({
    catalogKey: catalog[0].key,
    condition: "new",
    quantity: 1,
    warrantyDays: 90,
    purchasePriceCents: 100_000,
    webPriceCents: 150_000,
    pickupPriceCents: 145_000,
    published: true,
  });
  await store.seedDemo({ ownerUsername: "matheus", count: 50 });
  await store.clearDemo();

  const inventory = await store.listInventory();
  assert.deepEqual(inventory.map((item) => item.id), [real.id]);
  assert.equal((await store.listPublicCatalog()).length, 1);
});
