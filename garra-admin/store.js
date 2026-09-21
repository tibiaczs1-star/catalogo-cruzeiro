const path = require("node:path");

const MODE = "homologation";

function clone(value) {
  return structuredClone(value);
}

function createEmptyState() {
  return {
    mode: MODE,
    inventoryBatches: [],
    ledger: [],
    auditEvents: [],
    idempotencyRecords: {},
  };
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyText(value) {
  return typeof value === "string" && value.trim() !== "";
}

function assertPersistedInventoryBatch(batch) {
  if (!isRecord(batch)
    || !isNonEmptyText(batch.id)
    || !isNonEmptyText(batch.name)
    || !isNonEmptyText(batch.rarity)
    || !Number.isSafeInteger(batch.quantity) || batch.quantity <= 0
    || !Number.isSafeInteger(batch.unitCostCents) || batch.unitCostCents <= 0
    || !isNonEmptyText(batch.actor)
    || !isNonEmptyText(batch.reason)
    || !isNonEmptyText(batch.idempotencyKey)
    || !isNonEmptyText(batch.createdAt)) {
    throw new TypeError("invalid persisted inventory batch");
  }
}

function assertPersistedLedgerEntry(entry) {
  if (!isRecord(entry)
    || !isNonEmptyText(entry.id)
    || entry.eventType !== "inventory_batch_created"
    || !Number.isSafeInteger(entry.amountCents) || entry.amountCents <= 0
    || !isNonEmptyText(entry.inventoryBatchId)
    || !isNonEmptyText(entry.actor)
    || !isNonEmptyText(entry.reason)
    || !isNonEmptyText(entry.idempotencyKey)
    || !isNonEmptyText(entry.createdAt)) {
    throw new TypeError("invalid persisted ledger entry");
  }
}

function assertPersistedAuditEvent(event) {
  if (!isRecord(event)
    || !isNonEmptyText(event.id)
    || event.action !== "inventory_batch_created"
    || event.entityType !== "inventory_batch"
    || !isNonEmptyText(event.entityId)
    || !isNonEmptyText(event.actor)
    || !isNonEmptyText(event.reason)
    || !isNonEmptyText(event.idempotencyKey)
    || !isNonEmptyText(event.createdAt)) {
    throw new TypeError("invalid persisted audit event");
  }
}

function assertPersistedIdempotencyRecords(records) {
  if (!isRecord(records)) throw new TypeError("invalid persisted idempotency records");

  for (const [key, receipt] of Object.entries(records)) {
    if (!isNonEmptyText(key) || !isRecord(receipt)
      || receipt.replayed !== false
      || !isRecord(receipt.batch)
      || !isRecord(receipt.ledgerEntry)
      || !isRecord(receipt.auditEvent)) {
      throw new TypeError("invalid persisted idempotency record");
    }
    assertPersistedInventoryBatch(receipt.batch);
    assertPersistedLedgerEntry(receipt.ledgerEntry);
    assertPersistedAuditEvent(receipt.auditEvent);
    if (key !== receipt.batch.idempotencyKey
      || key !== receipt.ledgerEntry.idempotencyKey
      || key !== receipt.auditEvent.idempotencyKey
      || receipt.ledgerEntry.inventoryBatchId !== receipt.batch.id
      || receipt.auditEvent.entityId !== receipt.batch.id) {
      throw new TypeError("invalid persisted idempotency record");
    }
  }
}

function normalizeState(value) {
  const empty = createEmptyState();
  if (!value || typeof value !== "object" || Array.isArray(value)) return empty;

  const inventoryBatches = Array.isArray(value.inventoryBatches) ? value.inventoryBatches : [];
  const ledger = Array.isArray(value.ledger) ? value.ledger : [];
  const auditEvents = Array.isArray(value.auditEvents) ? value.auditEvents : [];
  const idempotencyRecords = value.idempotencyRecords && typeof value.idempotencyRecords === "object"
    && !Array.isArray(value.idempotencyRecords)
    ? value.idempotencyRecords
    : {};

  inventoryBatches.forEach(assertPersistedInventoryBatch);
  ledger.forEach(assertPersistedLedgerEntry);
  auditEvents.forEach(assertPersistedAuditEvent);
  assertPersistedIdempotencyRecords(idempotencyRecords);

  return {
    mode: MODE,
    inventoryBatches,
    ledger,
    auditEvents,
    idempotencyRecords,
  };
}

function requiredText(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${name} must be a non-empty string`);
  }
  return value.trim();
}

function positiveSafeInteger(value, name) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive safe integer`);
  }
  return value;
}

function createGarraAdminStore({ dataDir, readJson, writeJson, now = () => new Date(), idFactory } = {}) {
  const baseDir = requiredText(dataDir, "dataDir");
  if (typeof readJson !== "function") throw new TypeError("readJson must be a function");
  if (typeof writeJson !== "function") throw new TypeError("writeJson must be a function");
  if (typeof idFactory !== "function") throw new TypeError("idFactory must be a function");

  const stateFilePath = path.join(baseDir, "garra-admin", "state.json");
  let state = normalizeState(readJson(stateFilePath, createEmptyState()));

  function persist(candidateState) {
    writeJson(stateFilePath, clone(candidateState));
  }

  function getSummary() {
    return {
      mode: MODE,
      inventoryBatchCount: state.inventoryBatches.length,
      inventoryUnits: state.inventoryBatches.reduce((total, batch) => total + batch.quantity, 0),
      ledgerEntryCount: state.ledger.length,
      auditEventCount: state.auditEvents.length,
    };
  }

  function listInventoryBatches() {
    return clone(state.inventoryBatches);
  }

  function listLedger() {
    return clone(state.ledger);
  }

  function listAuditEvents() {
    return clone(state.auditEvents);
  }

  function createInventoryBatch(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new TypeError("input must be an object");
    }

    const idempotencyKey = requiredText(input.idempotencyKey, "idempotencyKey");
    const existing = state.idempotencyRecords[idempotencyKey];
    if (existing) return { ...clone(existing), replayed: true };

    const actor = requiredText(input.actor, "actor");
    const reason = requiredText(input.reason, "reason");
    const name = requiredText(input.name, "name");
    const rarity = requiredText(input.rarity, "rarity");
    const quantity = positiveSafeInteger(input.quantity, "quantity");
    const unitCostCents = positiveSafeInteger(input.unitCostCents, "unitCostCents");
    const amountCents = quantity * unitCostCents;
    if (!Number.isSafeInteger(amountCents)) {
      throw new RangeError("amountCents exceeds safe integer range");
    }

    const createdAt = now().toISOString();
    const batch = {
      id: idFactory(),
      name,
      rarity,
      quantity,
      unitCostCents,
      actor,
      reason,
      idempotencyKey,
      createdAt,
    };
    const ledgerEntry = {
      id: idFactory(),
      eventType: "inventory_batch_created",
      amountCents,
      inventoryBatchId: batch.id,
      actor,
      reason,
      idempotencyKey,
      createdAt,
    };
    const auditEvent = {
      id: idFactory(),
      action: "inventory_batch_created",
      entityType: "inventory_batch",
      entityId: batch.id,
      actor,
      reason,
      idempotencyKey,
      createdAt,
    };
    const receipt = { replayed: false, batch, ledgerEntry, auditEvent };

    const candidateState = clone(state);
    candidateState.inventoryBatches.push(batch);
    candidateState.ledger.push(ledgerEntry);
    candidateState.auditEvents.push(auditEvent);
    candidateState.idempotencyRecords[idempotencyKey] = clone(receipt);
    persist(candidateState);
    state = candidateState;

    return clone(receipt);
  }

  return {
    getSummary,
    listInventoryBatches,
    listLedger,
    listAuditEvents,
    createInventoryBatch,
  };
}

module.exports = { createGarraAdminStore };
