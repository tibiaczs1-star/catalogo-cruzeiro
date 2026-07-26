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
    quantity: 2,
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
  assert.equal((await store.listPublicCatalog()).length, 1);

  const sale = await store.createSale({
    inventoryId: inventory.id,
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
  assert.equal(settled.profitCents, 88_000);
  assert.equal((await store.getInventory(inventory.id)).quantity, 1);

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
