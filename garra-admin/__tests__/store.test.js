const assert = require("node:assert/strict");
const test = require("node:test");

const { createGarraAdminStore } = require("../store");

function createHarness() {
  let savedState = null;
  const writes = [];
  let id = 0;

  const store = createGarraAdminStore({
    dataDir: "C:/temporary/data",
    readJson: (filePath, fallback) => savedState ?? fallback,
    writeJson: (filePath, state) => {
      savedState = structuredClone(state);
      writes.push({ filePath, state: structuredClone(state) });
    },
    now: () => new Date("2026-08-27T15:00:00.000Z"),
    idFactory: () => `id-${++id}`,
  });

  return { store, writes, getSavedState: () => savedState };
}

test("starts with an empty homologation state", () => {
  const { store } = createHarness();

  assert.deepEqual(store.getSummary(), {
    mode: "homologation",
    inventoryBatchCount: 0,
    inventoryUnits: 0,
    ledgerEntryCount: 0,
    auditEventCount: 0,
  });
  assert.deepEqual(store.listInventoryBatches(), []);
  assert.deepEqual(store.listLedger(), []);
  assert.deepEqual(store.listAuditEvents(), []);
});

test("creates an inventory batch in cents and records immutable ledger and audit events", () => {
  const { store, writes, getSavedState } = createHarness();

  const receipt = store.createInventoryBatch({
    idempotencyKey: "batch-aurora-001",
    actor: "admin:junior",
    reason: "entrada de estoque de teste",
    name: "Urso Aurora",
    rarity: "rare",
    quantity: 12,
    unitCostCents: 2599,
  });

  assert.equal(receipt.replayed, false);
  assert.equal(receipt.batch.quantity, 12);
  assert.equal(receipt.batch.unitCostCents, 2599);
  assert.equal(receipt.batch.createdAt, "2026-08-27T15:00:00.000Z");
  assert.equal(receipt.ledgerEntry.eventType, "inventory_batch_created");
  assert.equal(receipt.ledgerEntry.amountCents, 31188);
  assert.equal(receipt.auditEvent.action, "inventory_batch_created");
  assert.equal(writes.length, 1);
  assert.match(writes[0].filePath, /garra-admin[\\/]state\.json$/);
  assert.deepEqual(getSavedState().inventoryBatches, [receipt.batch]);

  const exposedLedger = store.listLedger();
  exposedLedger[0].amountCents = 1;
  assert.equal(store.listLedger()[0].amountCents, 31188);
  assert.equal(typeof store.updateLedgerEntry, "undefined");
  assert.equal(typeof store.removeAuditEvent, "undefined");
});

test("rejects invalid quantity and non-integer monetary values", () => {
  const { store } = createHarness();
  const validBase = {
    idempotencyKey: "invalid-batch",
    actor: "admin:junior",
    reason: "teste de validacao",
    name: "Urso Sol",
    rarity: "common",
    quantity: 1,
    unitCostCents: 100,
  };

  assert.throws(() => store.createInventoryBatch({ ...validBase, quantity: 0 }), /quantity/);
  assert.throws(() => store.createInventoryBatch({ ...validBase, quantity: 1.5 }), /quantity/);
  assert.throws(() => store.createInventoryBatch({ ...validBase, unitCostCents: 10.5 }), /unitCostCents/);
  assert.throws(() => store.createInventoryBatch({ ...validBase, unitCostCents: -1 }), /unitCostCents/);
});

test("replays a batch request by idempotency key without appending another ledger event", () => {
  const { store, writes } = createHarness();
  const command = {
    idempotencyKey: "batch-mar-001",
    actor: "admin:junior",
    reason: "estoque inicial",
    name: "Urso Marinho",
    rarity: "epic",
    quantity: 4,
    unitCostCents: 5000,
  };

  const first = store.createInventoryBatch(command);
  const replay = store.createInventoryBatch(command);

  assert.equal(first.replayed, false);
  assert.equal(replay.replayed, true);
  assert.deepEqual(replay.batch, first.batch);
  assert.equal(store.listInventoryBatches().length, 1);
  assert.equal(store.listLedger().length, 1);
  assert.equal(store.listAuditEvents().length, 1);
  assert.equal(writes.length, 1);
});

test("keeps a failed write out of memory so the same idempotency key can be retried", () => {
  let persistedState = null;
  let attempts = 0;
  let successfulWrites = 0;
  let id = 0;
  const store = createGarraAdminStore({
    dataDir: "C:/temporary/data",
    readJson: (filePath, fallback) => persistedState ?? fallback,
    writeJson: (filePath, state) => {
      attempts += 1;
      if (attempts === 1) throw new Error("simulated disk failure");
      successfulWrites += 1;
      persistedState = structuredClone(state);
    },
    now: () => new Date("2026-08-27T15:00:00.000Z"),
    idFactory: () => `id-${++id}`,
  });
  const command = {
    idempotencyKey: "batch-retry-001",
    actor: "admin:junior",
    reason: "teste de durabilidade",
    name: "Urso Retry",
    rarity: "rare",
    quantity: 2,
    unitCostCents: 1500,
  };

  assert.throws(() => store.createInventoryBatch(command), /simulated disk failure/);
  assert.deepEqual(store.getSummary(), {
    mode: "homologation",
    inventoryBatchCount: 0,
    inventoryUnits: 0,
    ledgerEntryCount: 0,
    auditEventCount: 0,
  });

  const retry = store.createInventoryBatch(command);
  const replay = store.createInventoryBatch(command);

  assert.equal(retry.replayed, false);
  assert.equal(replay.replayed, true);
  assert.equal(attempts, 2);
  assert.equal(successfulWrites, 1);
  assert.equal(persistedState.inventoryBatches.length, 1);
  assert.equal(persistedState.ledger.length, 1);
  assert.equal(persistedState.auditEvents.length, 1);
});

test("rejects malformed persisted records before they can corrupt the summary", () => {
  assert.throws(
    () => createGarraAdminStore({
      dataDir: "C:/temporary/data",
      readJson: () => ({
        mode: "homologation",
        inventoryBatches: [{ quantity: "12" }],
        ledger: [],
        auditEvents: [],
        idempotencyRecords: {},
      }),
      writeJson: () => {},
      idFactory: () => "unused",
    }),
    /invalid persisted inventory batch/,
  );
});

test("rejects persisted idempotency receipts whose map key does not match the receipt", () => {
  const batch = {
    id: "batch-1",
    name: "Urso Integridade",
    rarity: "rare",
    quantity: 1,
    unitCostCents: 100,
    actor: "admin:junior",
    reason: "teste de integridade",
    idempotencyKey: "receipt-key",
    createdAt: "2026-08-27T15:00:00.000Z",
  };
  const ledgerEntry = {
    id: "ledger-1",
    eventType: "inventory_batch_created",
    amountCents: 100,
    inventoryBatchId: batch.id,
    actor: batch.actor,
    reason: batch.reason,
    idempotencyKey: batch.idempotencyKey,
    createdAt: batch.createdAt,
  };
  const auditEvent = {
    id: "audit-1",
    action: "inventory_batch_created",
    entityType: "inventory_batch",
    entityId: batch.id,
    actor: batch.actor,
    reason: batch.reason,
    idempotencyKey: batch.idempotencyKey,
    createdAt: batch.createdAt,
  };

  assert.throws(
    () => createGarraAdminStore({
      dataDir: "C:/temporary/data",
      readJson: () => ({
        inventoryBatches: [batch],
        ledger: [ledgerEntry],
        auditEvents: [auditEvent],
        idempotencyRecords: {
          "different-map-key": { replayed: false, batch, ledgerEntry, auditEvent },
        },
      }),
      writeJson: () => {},
      idFactory: () => "unused",
    }),
    /invalid persisted idempotency record/,
  );
});
