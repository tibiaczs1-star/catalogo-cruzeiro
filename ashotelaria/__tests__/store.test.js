"use strict";

const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const MIGRATION = path.join(__dirname, "..", "migrations", "001_initial.sql");
const AUTH_MIGRATION = path.join(__dirname, "..", "migrations", "002_auth.sql");

function withEnvironment(changes, operation) {
  const previous = {};
  for (const [key, value] of Object.entries(changes)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return operation();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function freshStoreModule() {
  const modulePath = require.resolve("../store");
  delete require.cache[modulePath];
  return require("../store");
}

test("migration creates the required tenant-scoped hotel tables and constraints", () => {
  const sql = fs.readFileSync(MIGRATION, "utf8").toLowerCase();
  const tables = [
    "tenants", "properties", "room_types", "rooms", "users", "memberships",
    "guests", "reservations", "reservation_rooms", "idempotency_keys",
    "housekeeping_tasks", "maintenance_orders", "integration_connections", "audit_events",
  ];
  for (const table of tables) assert.match(sql, new RegExp(`create table(?: if not exists)? ${table}\\b`));
  assert.match(sql, /bigint[^,]*check\s*\([^)]*>=\s*0/);
  assert.match(sql, /unique\s*\(tenant_id,\s*property_id,\s*key\)/);
  assert.match(sql, /references properties\s*\(tenant_id,\s*id\)/);
  assert.match(sql, /check\s*\(status in\s*\(/);
  assert.match(sql, /create index/);
  assert.doesNotMatch(sql, /foreign key\s*\(tenant_id,\s*property_id,\s*room_id\)[\s\S]*?on delete set null/);

  const memberships = sql.slice(sql.indexOf("create table memberships"), sql.indexOf("create table guests"));
  const canonicalRoles = [
    "superadmin", "proprietario", "administrador", "gerente", "recepcionista", "camareira",
    "supervisor_governanca", "contador", "financeiro", "caixa", "manutencao", "revenue_manager",
    "auditor", "hospede",
  ];
  for (const role of canonicalRoles) assert.match(memberships, new RegExp(`'${role}'`));
  assert.match(memberships, /unique\s*\(user_id,\s*tenant_id,\s*property_id,\s*role\)/);
});

test("auth migration stores only tenant-scoped password hashes and revocation state", () => {
  const sql = fs.readFileSync(AUTH_MIGRATION, "utf8").toLowerCase();
  assert.match(sql, /create table(?: if not exists)? credential_profiles\b/);
  for (const column of [
    "tenant_id", "property_id", "username", "role", "password_hash", "session_version",
    "failed_attempts", "locked_until", "force_change", "updated_at",
  ]) assert.match(sql, new RegExp(`\\b${column}\\b`), column);
  assert.match(sql, /unique\s*\(tenant_id,\s*property_id,\s*username,\s*role\)/);
  assert.match(sql, /references properties\s*\(tenant_id,\s*id\)/);
  assert.doesNotMatch(sql, /\bpassword\s+text\b/);
  assert.match(sql, /alter table housekeeping_tasks[\s\S]*assigned_username/);
  assert.match(sql, /alter table housekeeping_tasks[\s\S]*assigned_role/);
});

test("store selector uses memory only for tests or explicit non-production demo mode", async () => {
  await withEnvironment({ NODE_ENV: "test", ASHOTELARIA_DATABASE_URL: undefined, ASHOTELARIA_DEMO_MODE: undefined }, async () => {
    const store = freshStoreModule().createStore();
    assert.equal((await store.health()).store, "memory");
  });
  await withEnvironment({ NODE_ENV: "development", ASHOTELARIA_DATABASE_URL: undefined, ASHOTELARIA_DEMO_MODE: "true" }, async () => {
    const store = freshStoreModule().createStore();
    assert.equal((await store.health()).store, "memory");
  });
});

test("store selector refuses every production memory fallback", () => {
  withEnvironment({ NODE_ENV: "production", ASHOTELARIA_DATABASE_URL: undefined, ASHOTELARIA_DEMO_MODE: "true" }, () => {
    const { createStore } = freshStoreModule();
    assert.throws(() => createStore(), /ASHOTELARIA_DATABASE_URL/);
  });
});

test("store selector accepts an injected PostgreSQL pool", async () => {
  const pool = { query: async () => ({ rows: [{ ok: 1 }] }) };
  await withEnvironment({ NODE_ENV: "production", ASHOTELARIA_DATABASE_URL: undefined, ASHOTELARIA_DEMO_MODE: undefined }, async () => {
    const store = freshStoreModule().createStore({ pool });
    assert.deepEqual(await store.health(), { ok: true, store: "postgres", persistence: "postgresql" });
  });
});

function scriptedPool(handler) {
  const queries = [];
  const client = {
    releaseCount: 0,
    async query(text, values = []) {
      queries.push({ text: String(text), values });
      return handler(String(text), values);
    },
    release() { this.releaseCount += 1; },
  };
  return { queries, client, pool: { connect: async () => client, query: client.query.bind(client) } };
}

test("findAvailability rejects unsafe database rates and multiplied stay totals", async () => {
  function availabilityPool(nightlyRateCents) {
    return scriptedPool((sql) => {
      if (/FROM properties/.test(sql)) {
        return { rows: [{ id: "property-1", tenant_id: "tenant-1", name: "Hotel", slug: "hotel", time_zone: "America/Rio_Branco" }] };
      }
      if (/FROM room_types/.test(sql)) {
        return { rows: [{ id: "type-1", tenant_id: "tenant-1", property_id: "property-1", name: "Suíte", capacity: 2, nightly_rate_cents: nightlyRateCents, available_room_ids: ["room-1"] }] };
      }
      return { rows: [] };
    }).pool;
  }
  const { createPostgresStore } = require("../postgres-store");

  await assert.rejects(
    createPostgresStore({ pool: availabilityPool("9007199254740992") }).findAvailability({
      propertySlug: "hotel", checkIn: "2026-07-20", checkOut: "2026-07-21",
    }),
    (error) => error instanceof RangeError && /safe integer range/.test(error.message),
  );
  await assert.rejects(
    createPostgresStore({ pool: availabilityPool(String(Number.MAX_SAFE_INTEGER)) }).findAvailability({
      propertySlug: "hotel", checkIn: "2026-07-20", checkOut: "2026-07-22",
    }),
    (error) => error instanceof RangeError && /safe integer range/.test(error.message),
  );
});

test("createReservation locks the property before reads and records idempotency", async () => {
  const { pool, queries, client } = scriptedPool((sql) => {
    if (/^BEGIN$/.test(sql)) return { rows: [] };
    if (/FROM idempotency_keys/.test(sql)) return { rows: [] };
    if (/FROM properties/.test(sql)) return { rows: [{ id: "property-1", slug: "hotel-1", time_zone: "America/Rio_Branco" }] };
    if (/FROM room_types/.test(sql)) return { rows: [{ id: "type-1", nightly_rate_cents: "18900", capacity: 3 }] };
    if (/FOR UPDATE SKIP LOCKED/.test(sql)) return { rows: [{ id: "room-1" }] };
    if (/INSERT INTO guests/.test(sql)) return { rows: [{ id: "guest-1" }] };
    if (/INSERT INTO reservations/.test(sql)) return { rows: [{ id: "reservation-1", tenant_id: "tenant-1", property_id: "property-1", guest_id: "guest-1", room_type_id: "type-1", check_in: "2026-07-20", check_out: "2026-07-22", adults: 2, children: 0, nightly_rate_cents: "18900", extras_cents: "0", taxes_cents: "0", total_cents: "37800", status: "confirmed" }] };
    return { rows: [] };
  });
  const { createPostgresStore } = require("../postgres-store");
  const store = createPostgresStore({ pool, idFactory: (() => { let value = 0; return () => `uuid-${++value}`; })() });
  const reservation = await store.createReservation({
    tenantId: "tenant-1", propertyId: "property-1", idempotencyKey: "request-1",
    actor: { id: "user-1" },
    input: { guestName: "Maria", roomTypeId: "type-1", checkIn: "2026-07-20", checkOut: "2026-07-22", adults: 2 },
  });
  assert.equal(reservation.id, "reservation-1");
  assert.equal(reservation.roomId, "room-1");
  assert.equal(queries[0].text, "BEGIN");
  assert.equal(queries[1].text.trim(), "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))");
  assert.deepEqual(queries[1].values, ["tenant-1:property-1"]);
  const idempotencyReadIndex = queries.findIndex(({ text }) => /FROM idempotency_keys/.test(text));
  const propertyReadIndex = queries.findIndex(({ text }) => /FROM properties/.test(text));
  assert.ok(idempotencyReadIndex > 1);
  assert.ok(propertyReadIndex > 1);
  const allocation = queries.find(({ text }) => /FOR UPDATE SKIP LOCKED/.test(text));
  assert.ok(allocation);
  assert.match(allocation.text, /NOT EXISTS/);
  assert.match(allocation.text, /rv\.check_in < \$5::date AND \$4::date < rv\.check_out/);
  assert.ok(queries.some(({ text }) => /INSERT INTO reservation_rooms/.test(text)));
  assert.ok(queries.some(({ text }) => /INSERT INTO idempotency_keys/.test(text)));
  assert.equal(queries.at(-1).text, "COMMIT");
  assert.equal(client.releaseCount, 1);
});

test("createReservation recovers an idempotency unique conflict by rolling back and returning the committed response", async () => {
  const committed = {
    id: "reservation-original",
    tenantId: "tenant-1",
    propertyId: "property-1",
    guestId: "guest-original",
    roomTypeId: "type-1",
    roomId: "room-1",
    checkIn: "2026-07-20",
    checkOut: "2026-07-22",
    adults: 2,
    children: 0,
    nightlyRate: 18900,
    extras: 0,
    taxes: 0,
    total: 37800,
    status: "confirmed",
  };
  let rolledBack = false;
  const { pool, queries } = scriptedPool((sql) => {
    if (sql === "ROLLBACK") {
      rolledBack = true;
      return { rows: [] };
    }
    if (/FROM idempotency_keys/.test(sql)) {
      return { rows: rolledBack ? [{ response: committed }] : [] };
    }
    if (/FROM properties/.test(sql)) return { rows: [{ id: "property-1", slug: "hotel-1", time_zone: "America/Rio_Branco" }] };
    if (/FROM room_types/.test(sql)) return { rows: [{ id: "type-1", nightly_rate_cents: "18900", capacity: 3 }] };
    if (/FOR UPDATE SKIP LOCKED/.test(sql)) return { rows: [{ id: "room-1" }] };
    if (/INSERT INTO reservations/.test(sql)) return { rows: [{ id: "reservation-racing", tenant_id: "tenant-1", property_id: "property-1", guest_id: "guest-racing", room_type_id: "type-1", check_in: "2026-07-20", check_out: "2026-07-22", adults: 2, children: 0, nightly_rate_cents: "18900", extras_cents: "0", taxes_cents: "0", total_cents: "37800", status: "confirmed" }] };
    if (/INSERT INTO idempotency_keys/.test(sql)) {
      const error = new Error("duplicate key value violates unique constraint");
      error.code = "23505";
      throw error;
    }
    return { rows: [] };
  });
  const { createPostgresStore } = require("../postgres-store");
  const store = createPostgresStore({ pool, idFactory: (() => { let value = 0; return () => `uuid-${++value}`; })() });

  const reservation = await store.createReservation({
    tenantId: "tenant-1", propertyId: "property-1", idempotencyKey: "request-racing",
    input: { guestName: "Maria", roomTypeId: "type-1", checkIn: "2026-07-20", checkOut: "2026-07-22", adults: 2 },
  });

  assert.deepEqual(reservation, committed);
  const rollbackIndex = queries.findIndex(({ text }) => text === "ROLLBACK");
  assert.ok(rollbackIndex > 0);
  assert.match(queries[rollbackIndex + 1].text, /FROM idempotency_keys/);
  assert.deepEqual(queries[rollbackIndex + 1].values, ["tenant-1", "property-1", "request-racing"]);
});

test("PostgreSQL idempotency replay returns persistent metadata without creating again", async () => {
  const committed = {
    id: "reservation-original", tenantId: "tenant-1", propertyId: "property-1",
    guestId: "guest-1", roomTypeId: "type-1", roomId: "room-1", checkIn: "2026-07-20",
    checkOut: "2026-07-22", adults: 2, children: 0, nightlyRate: 18900, extras: 0,
    taxes: 0, total: 37800, status: "confirmed",
  };
  const { pool, queries } = scriptedPool((sql) => {
    if (/FROM idempotency_keys/.test(sql)) return { rows: [{ response: committed }] };
    return { rows: [] };
  });
  const { createPostgresStore } = require("../postgres-store");
  const result = await createPostgresStore({ pool }).createReservation({
    tenantId: "tenant-1",
    propertyId: "property-1",
    idempotencyKey: "request-replayed",
    input: {},
    includeReplayMetadata: true,
  });

  assert.deepEqual(result, { reservation: committed, replayed: true });
  assert.equal(queries.some(({ text }) => /INSERT INTO reservations/.test(text)), false);
});

test("createReservation rolls back with INVENTORY_CONFLICT when no sellable room exists", async () => {
  const { pool, queries, client } = scriptedPool((sql) => {
    if (/FROM idempotency_keys/.test(sql)) return { rows: [] };
    if (/FROM properties/.test(sql)) return { rows: [{ id: "property-1", slug: "hotel-1" }] };
    if (/FROM room_types/.test(sql)) return { rows: [{ id: "type-1", nightly_rate_cents: "10000", capacity: 2 }] };
    if (/FOR UPDATE SKIP LOCKED/.test(sql)) return { rows: [] };
    return { rows: [] };
  });
  const { createPostgresStore } = require("../postgres-store");
  const store = createPostgresStore({ pool });
  await assert.rejects(
    store.createReservation({ tenantId: "tenant-1", propertyId: "property-1", idempotencyKey: "request-2", input: { guestName: "Ana", roomTypeId: "type-1", checkIn: "2026-08-01", checkOut: "2026-08-02" } }),
    (error) => error.code === "INVENTORY_CONFLICT",
  );
  assert.ok(queries.some(({ text }) => text === "ROLLBACK"));
  assert.equal(client.releaseCount, 1);
});

test("getBootstrap masks guest documents and integration secrets", async () => {
  const { pool } = scriptedPool((sql) => {
    if (/FROM properties/.test(sql)) return { rows: [{ id: "property-1", tenant_id: "tenant-1", name: "Hotel", slug: "hotel", time_zone: "America/Rio_Branco" }] };
    if (/FROM room_types/.test(sql)) return { rows: [] };
    if (/FROM rooms/.test(sql)) return { rows: [] };
    if (/FROM guests/.test(sql)) return { rows: [{ id: "guest-1", tenant_id: "tenant-1", property_id: "property-1", name: "João", email: "j@example.com", document: "12345678900" }] };
    if (/FROM reservations/.test(sql)) return { rows: [] };
    if (/FROM housekeeping_tasks/.test(sql)) return { rows: [{
      id: "task-1", tenant_id: "tenant-1", property_id: "property-1", room_id: "room-1",
      status: "pending", assigned_username: "admin", assigned_role: "camareira",
    }] };
    if (/FROM maintenance_orders/.test(sql)) return { rows: [] };
    if (/FROM integration_connections/.test(sql)) return { rows: [{ id: "integration-1", provider: "payments", status: "active", secret_ciphertext: "never-return" }] };
    return { rows: [] };
  });
  const { createPostgresStore } = require("../postgres-store");
  const bootstrap = await createPostgresStore({ pool }).getBootstrap({ tenantId: "tenant-1", propertyId: "property-1" });
  assert.equal(bootstrap.guests[0].document, undefined);
  assert.match(bootstrap.guests[0].documentMasked, /00$/);
  assert.equal(bootstrap.integrations[0].secretCiphertext, undefined);
  assert.equal(bootstrap.housekeepingTasks[0].assignedUsername, "admin");
  assert.equal(bootstrap.housekeepingTasks[0].assignedRole, "camareira");
});

test("updateRoomStatus scopes the update and writes an audit event in one transaction", async () => {
  const { pool, queries } = scriptedPool((sql) => {
    if (/UPDATE rooms/.test(sql)) return { rows: [{ id: "room-1", tenant_id: "tenant-1", property_id: "property-1", room_type_id: "type-1", number: "101", status: "inspected", previous_status: "dirty" }] };
    return { rows: [] };
  });
  const { createPostgresStore } = require("../postgres-store");
  const room = await createPostgresStore({ pool }).updateRoomStatus({ tenantId: "tenant-1", propertyId: "property-1", roomId: "room-1", status: "inspected", actor: { id: "user-1" } });
  assert.equal(room.status, "inspected");
  assert.ok(queries.some(({ text, values }) => /WHERE tenant_id = \$1 AND property_id = \$2/.test(text) && values[0] === "tenant-1" && values[1] === "property-1"));
  assert.ok(queries.some(({ text }) => /INSERT INTO audit_events/.test(text)));
  assert.equal(queries.at(-1).text, "COMMIT");
});

test("PostgreSQL check-in locks the scoped stay and room before updating and auditing", async () => {
  let status = "confirmed";
  let roomStatus = "available";
  const reservationRow = () => ({
    id: "reservation-1", tenant_id: "tenant-1", property_id: "property-1", guest_id: "guest-1",
    room_type_id: "type-1", room_id: "room-1", check_in: "2026-07-14", check_out: "2026-07-16",
    adults: 2, children: 0, nightly_rate_cents: "18900", extras_cents: "0", taxes_cents: "0",
    total_cents: "37800", status, time_zone: "America/Rio_Branco",
  });
  const { pool, queries } = scriptedPool((sql, values) => {
    if (/SELECT rv\.\*, rr\.room_id/.test(sql) && /FOR UPDATE OF rv/.test(sql)) return { rows: [reservationRow()] };
    if (/FROM rooms/.test(sql) && /FOR UPDATE/.test(sql)) {
      return { rows: [{ id: "room-1", status: roomStatus }] };
    }
    if (/rv\.status = 'checked_in'/.test(sql)) return { rows: [] };
    if (/UPDATE reservations/.test(sql)) {
      status = values[3];
      return { rows: [reservationRow()] };
    }
    if (/UPDATE rooms/.test(sql)) {
      roomStatus = values[3];
      return { rows: [{ id: "room-1", status: roomStatus }] };
    }
    return { rows: [] };
  });
  const { createPostgresStore } = require("../postgres-store");
  const store = createPostgresStore({
    pool,
    idFactory: () => "audit-1",
    now: () => new Date("2026-07-15T03:30:00.000Z"),
  });
  const reservation = await store.updateReservationStatus({
    tenantId: "tenant-1",
    propertyId: "property-1",
    reservationId: "reservation-1",
    status: "checked_in",
    actor: { id: "admin:recepcionista" },
  });

  assert.equal(reservation.status, "checked_in");
  assert.equal(roomStatus, "occupied");
  assert.equal(queries[0].text, "BEGIN");
  const reservationLock = queries.find(({ text }) => /FOR UPDATE OF rv/.test(text));
  assert.match(reservationLock.text, /JOIN properties p/);
  assert.match(reservationLock.text, /p\.time_zone/);
  const roomLock = queries.find(({ text }) => /FROM rooms/.test(text) && /FOR UPDATE/.test(text));
  assert.deepEqual(roomLock.values, ["tenant-1", "property-1", "room-1"]);
  const occupiedCheck = queries.find(({ text }) => /rv\.status = 'checked_in'/.test(text));
  assert.deepEqual(occupiedCheck.values, ["tenant-1", "property-1", "room-1", "reservation-1"]);
  assert.ok(queries.some(({ text }) => /INSERT INTO audit_events/.test(text)));
  assert.equal(queries.at(-1).text, "COMMIT");
});

test("PostgreSQL check-in rejects an invalid operational day before any mutation", async () => {
  const current = {
    id: "reservation-1", tenant_id: "tenant-1", property_id: "property-1", guest_id: "guest-1",
    room_type_id: "type-1", room_id: "room-1", check_in: "2026-07-14", check_out: "2026-07-16",
    adults: 2, children: 0, nightly_rate_cents: "18900", extras_cents: "0", taxes_cents: "0",
    total_cents: "37800", status: "confirmed", time_zone: "America/Rio_Branco",
  };
  const { pool, queries, client } = scriptedPool((sql) => {
    if (/FOR UPDATE OF rv/.test(sql)) return { rows: [current] };
    return { rows: [] };
  });
  const { createPostgresStore } = require("../postgres-store");
  const store = createPostgresStore({ pool, now: () => "2026-07-15" });

  await assert.rejects(
    store.updateReservationStatus({
      tenantId: "tenant-1", propertyId: "property-1", reservationId: "reservation-1",
      status: "checked_in", actor: { id: "admin:recepcionista" },
    }),
    (error) => error.code === "CHECK_IN_NOT_ALLOWED",
  );
  assert.equal(queries.some(({ text }) => /UPDATE reservations|UPDATE rooms|INSERT INTO audit_events/.test(text)), false);
  assert.equal(queries.at(-1).text, "ROLLBACK");
  assert.equal(client.releaseCount, 1);
});

test("PostgreSQL check-in locks and preserves every incompatible room status", async () => {
  const incompatibleStatuses = ["maintenance", "blocked", "dirty", "cleaning", "occupied", "do_not_disturb"];
  for (const roomStatus of incompatibleStatuses) {
    const current = {
      id: "reservation-1", tenant_id: "tenant-1", property_id: "property-1", guest_id: "guest-1",
      room_type_id: "type-1", room_id: "room-1", check_in: "2026-07-14", check_out: "2026-07-16",
      adults: 2, children: 0, nightly_rate_cents: "18900", extras_cents: "0", taxes_cents: "0",
      total_cents: "37800", status: "confirmed", time_zone: "America/Rio_Branco",
    };
    const { pool, queries } = scriptedPool((sql) => {
      if (/FOR UPDATE OF rv/.test(sql)) return { rows: [current] };
      if (/FROM rooms/.test(sql) && /FOR UPDATE/.test(sql)) return { rows: [{ id: "room-1", status: roomStatus }] };
      return { rows: [] };
    });
    const { createPostgresStore } = require("../postgres-store");
    const store = createPostgresStore({ pool, now: () => "2026-07-14" });

    await assert.rejects(
      store.updateReservationStatus({
        tenantId: "tenant-1", propertyId: "property-1", reservationId: "reservation-1",
        status: "checked_in", actor: { id: "admin:recepcionista" },
      }),
      (error) => error.code === "ROOM_NOT_READY",
      roomStatus,
    );
    assert.ok(queries.some(({ text }) => /FROM rooms/.test(text) && /FOR UPDATE/.test(text)));
    assert.equal(queries.some(({ text }) => /UPDATE reservations|UPDATE rooms|INSERT INTO audit_events/.test(text)), false);
    assert.equal(queries.at(-1).text, "ROLLBACK");
  }
});

test("PostgreSQL check-in rejects another checked-in reservation in the same scoped room", async () => {
  const current = {
    id: "reservation-1", tenant_id: "tenant-1", property_id: "property-1", guest_id: "guest-1",
    room_type_id: "type-1", room_id: "room-1", check_in: "2026-07-14", check_out: "2026-07-16",
    adults: 2, children: 0, nightly_rate_cents: "18900", extras_cents: "0", taxes_cents: "0",
    total_cents: "37800", status: "confirmed", time_zone: "America/Rio_Branco",
  };
  const { pool, queries } = scriptedPool((sql) => {
    if (/FOR UPDATE OF rv/.test(sql)) return { rows: [current] };
    if (/FROM rooms/.test(sql) && /FOR UPDATE/.test(sql)) return { rows: [{ id: "room-1", status: "inspected" }] };
    if (/rv\.status = 'checked_in'/.test(sql)) return { rows: [{ id: "reservation-other" }] };
    return { rows: [] };
  });
  const { createPostgresStore } = require("../postgres-store");
  const store = createPostgresStore({ pool, now: () => "2026-07-14" });

  await assert.rejects(
    store.updateReservationStatus({
      tenantId: "tenant-1", propertyId: "property-1", reservationId: "reservation-1",
      status: "checked_in", actor: { id: "admin:recepcionista" },
    }),
    (error) => error.code === "ROOM_NOT_READY",
  );
  const conflict = queries.find(({ text }) => /rv\.status = 'checked_in'/.test(text));
  assert.deepEqual(conflict.values, ["tenant-1", "property-1", "room-1", "reservation-1"]);
  assert.match(conflict.text, /rr\.tenant_id = \$1/);
  assert.match(conflict.text, /rr\.property_id = \$2/);
  assert.equal(queries.some(({ text }) => /UPDATE reservations|UPDATE rooms|INSERT INTO audit_events/.test(text)), false);
  assert.equal(queries.at(-1).text, "ROLLBACK");
});

test("PostgreSQL credential repository reads and mutates profiles by the complete scope", async () => {
  const row = {
    tenant_id: "tenant-1", property_id: "property-1", username: "admin", role: "recepcionista",
    password_hash: "scrypt$hash", session_version: 2, failed_attempts: 1,
    locked_until: null, force_change: true, updated_at: "2026-07-14T12:00:00.000Z",
  };
  const { pool, queries } = scriptedPool((sql) => {
    if (/FROM credential_profiles/.test(sql)) return { rows: [row] };
    if (/INSERT INTO credential_profiles/.test(sql)) return { rows: [row] };
    if (/UPDATE credential_profiles/.test(sql)) return { rows: [{ ...row, failed_attempts: 0 }] };
    return { rows: [] };
  });
  const { createPostgresStore } = require("../postgres-store");
  const store = createPostgresStore({ pool });
  const scope = {
    tenantId: "tenant-1", propertyId: "property-1", username: "admin", role: "recepcionista",
  };

  assert.deepEqual(await store.getCredentialProfile(scope), {
    ...scope,
    passwordHash: "scrypt$hash",
    sessionVersion: 2,
    failedAttempts: 1,
    lockedUntil: null,
    forceChange: true,
    updatedAt: "2026-07-14T12:00:00.000Z",
  });
  await store.upsertCredentialProfile({
    ...scope, passwordHash: "scrypt$hash", sessionVersion: 2, failedAttempts: 1,
    lockedUntil: null, forceChange: true, updatedAt: "2026-07-14T12:00:00.000Z",
  });
  const updated = await store.updateCredentialProfile({
    ...scope, expectedSessionVersion: 2, changes: { failedAttempts: 0 },
  });
  assert.equal(updated.failedAttempts, 0);

  for (const query of queries) {
    if (/credential_profiles/.test(query.text)) {
      assert.match(query.text, /tenant_id/);
      assert.match(query.text, /property_id/);
      assert.match(query.text, /username/);
      assert.match(query.text, /role/);
    }
  }
  const update = queries.find(({ text }) => /UPDATE credential_profiles/.test(text));
  assert.deepEqual(update.values.slice(0, 4), ["tenant-1", "property-1", "admin", "recepcionista"]);
  assert.match(update.text, /session_version\s*=\s*\$\d+/i);
  assert.equal(update.values.at(-1), 2);
});

test("PostgreSQL credential provisioning returns the winner without updating a conflict", async () => {
  const existing = {
    tenant_id: "tenant-1", property_id: "property-1", username: "admin", role: "recepcionista",
    password_hash: "scrypt$reset-hash", session_version: 7, failed_attempts: 0,
    locked_until: null, force_change: false, updated_at: "2026-07-14T12:00:00.000Z",
  };
  const { pool, queries } = scriptedPool((sql) => {
    if (/INSERT INTO credential_profiles/.test(sql)) return { rows: [], rowCount: 0 };
    if (/FROM credential_profiles/.test(sql)) return { rows: [existing], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  });
  const { createPostgresStore } = require("../postgres-store");
  const store = createPostgresStore({ pool });

  const result = await store.createCredentialProfileIfAbsent({
    tenantId: "tenant-1", propertyId: "property-1", username: "admin", role: "recepcionista",
    passwordHash: "scrypt$initial-hash", sessionVersion: 1, failedAttempts: 0,
    lockedUntil: null, forceChange: true, updatedAt: "2026-07-14T12:01:00.000Z",
  });

  assert.equal(result.passwordHash, "scrypt$reset-hash");
  assert.equal(result.sessionVersion, 7);
  const insert = queries.find(({ text }) => /INSERT INTO credential_profiles/.test(text));
  assert.match(insert.text, /ON CONFLICT\s*\(tenant_id, property_id, username, role\)\s*DO NOTHING/i);
  assert.doesNotMatch(insert.text, /DO UPDATE/i);
});

test("PostgreSQL password change uses sessionVersion CAS and audits safe metadata atomically", async () => {
  const changed = {
    tenant_id: "tenant-1", property_id: "property-1", username: "admin", role: "recepcionista",
    password_hash: "scrypt$new-hash", session_version: 3, failed_attempts: 0,
    locked_until: null, force_change: false, updated_at: "2026-07-14T12:00:00.000Z",
  };
  const { pool, queries, client } = scriptedPool((sql) => {
    if (/UPDATE credential_profiles/.test(sql)) return { rows: [changed], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  });
  const { createPostgresStore } = require("../postgres-store");
  const store = createPostgresStore({ pool, idFactory: () => "audit-password-change" });

  const result = await store.setCredentialPassword({
    tenantId: "tenant-1", propertyId: "property-1", username: "admin", role: "recepcionista",
    passwordHash: "scrypt$new-hash", forceChange: false, expectedSessionVersion: 2,
    updatedAt: "2026-07-14T12:00:00.000Z",
    actor: { username: "admin", role: "recepcionista" },
    action: "credential.password_changed",
  });

  assert.equal(result.sessionVersion, 3);
  const update = queries.find(({ text }) => /UPDATE credential_profiles/.test(text));
  assert.match(update.text, /session_version\s*=\s*session_version\s*\+\s*1/i);
  assert.match(update.text, /session_version\s*=\s*\$\d+/i);
  const audit = queries.find(({ text }) => /INSERT INTO audit_events/.test(text));
  assert.ok(audit);
  assert.equal(audit.values[5], JSON.stringify({ username: "admin", role: "recepcionista" }));
  assert.deepEqual(JSON.parse(audit.values[6]), {
    targetUsername: "admin", targetRole: "recepcionista", sessionVersion: 3,
  });
  assert.equal(audit.values.some((value) => String(value).includes("scrypt$new-hash")), false);
  assert.equal(queries[0].text, "BEGIN");
  assert.equal(queries.at(-1).text, "COMMIT");
  assert.equal(client.releaseCount, 1);
});

test("PostgreSQL password reset upserts with an atomic version increment and safe audit", async () => {
  const reset = {
    tenant_id: "tenant-1", property_id: "property-1", username: "admin", role: "camareira",
    password_hash: "scrypt$reset-hash", session_version: 8, failed_attempts: 0,
    locked_until: null, force_change: true, updated_at: "2026-07-14T12:00:00.000Z",
  };
  const { pool, queries } = scriptedPool((sql) => {
    if (/INSERT INTO credential_profiles/.test(sql)) return { rows: [reset], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  });
  const { createPostgresStore } = require("../postgres-store");
  const store = createPostgresStore({ pool, idFactory: () => "audit-password-reset" });

  const result = await store.setCredentialPassword({
    tenantId: "tenant-1", propertyId: "property-1", username: "admin", role: "camareira",
    passwordHash: "scrypt$reset-hash", forceChange: true,
    updatedAt: "2026-07-14T12:00:00.000Z",
    actor: { username: "admin", role: "administrador" },
    action: "credential.password_reset",
  });

  assert.equal(result.sessionVersion, 8);
  const upsert = queries.find(({ text }) => /INSERT INTO credential_profiles/.test(text));
  assert.match(upsert.text, /ON CONFLICT[\s\S]*session_version\s*=\s*credential_profiles\.session_version\s*\+\s*1/i);
  const audit = queries.find(({ text }) => /INSERT INTO audit_events/.test(text));
  assert.deepEqual(JSON.parse(audit.values[6]), {
    targetUsername: "admin", targetRole: "camareira", sessionVersion: 8,
  });
  assert.equal(audit.values.some((value) => String(value).includes("scrypt$reset-hash")), false);
});

test("PostgreSQL credential failures increment atomically and return the resulting lock state", async () => {
  const lockedUntil = "2026-07-14T12:01:00.000Z";
  const row = {
    tenant_id: "tenant-1", property_id: "property-1", username: "admin", role: "camareira",
    password_hash: "scrypt$hash", session_version: 1, failed_attempts: 2,
    locked_until: lockedUntil, force_change: true, updated_at: "2026-07-14T12:00:00.000Z",
  };
  const { pool, queries } = scriptedPool((sql) => {
    if (/UPDATE credential_profiles/.test(sql)) return { rows: [row] };
    return { rows: [] };
  });
  const { createPostgresStore } = require("../postgres-store");
  const store = createPostgresStore({ pool });

  const profile = await store.recordCredentialFailure({
    tenantId: "tenant-1",
    propertyId: "property-1",
    username: "admin",
    role: "camareira",
    maxFailedAttempts: 2,
    lockedUntil,
    updatedAt: "2026-07-14T12:00:00.000Z",
    expectedSessionVersion: 1,
  });
  assert.equal(profile.failedAttempts, 2);
  assert.equal(profile.lockedUntil, lockedUntil);
  const update = queries.find(({ text }) => /UPDATE credential_profiles/.test(text));
  assert.match(update.text, /failed_attempts\s*=\s*failed_attempts\s*\+\s*1/i);
  assert.match(update.text, /session_version\s*=\s*\$\d+/i);
  assert.equal(update.values.at(-1), 1);
  assert.match(update.text, /returning/i);
});
