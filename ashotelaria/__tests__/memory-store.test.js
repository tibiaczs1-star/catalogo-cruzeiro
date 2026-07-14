"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { createSeed } = require("../seed");
const { createMemoryStore } = require("../memory-store");

const CZS_TENANT = "tenant-czs";
const JURUA_PROPERTY = "property-jurua-palace";
const OTHER_TENANT = "tenant-vale-demo";
const OTHER_PROPERTY = "property-rio-moa";

function reservationInput(overrides = {}) {
  return {
    guestName: "  Maria da Silva  ",
    guestEmail: "maria@example.com",
    guestPhone: "+55 68 99999-0000",
    document: "123.456.789-00",
    roomTypeId: "room-type-standard-jurua",
    checkIn: "2026-08-20",
    checkOut: "2026-08-22",
    adults: 2,
    children: 0,
    nightlyRate: 1,
    ...overrides,
  };
}

test("createSeed is deterministic and includes isolated demo organizations and hotel roles", () => {
  const first = createSeed("2026-07-14");
  const second = createSeed("2026-07-14");

  assert.deepEqual(first, second);
  assert.equal(first.tenants.length >= 2, true);
  assert.equal(first.properties.length >= 2, true);
  assert.equal(
    first.properties.some((property) => (
      property.id === JURUA_PROPERTY
      && property.tenantId === CZS_TENANT
      && property.name === "Hotel Juruá Palace"
    )),
    true,
  );

  for (const collection of [
    "roomTypes",
    "rooms",
    "guests",
    "reservations",
    "housekeepingTasks",
    "maintenanceOrders",
    "integrations",
    "users",
    "memberships",
  ]) {
    assert.equal(first[collection].length > 0, true, `${collection} must be seeded`);
  }

  const roles = new Set(first.memberships
    .filter((membership) => membership.tenantId === CZS_TENANT)
    .map((membership) => membership.role));
  assert.deepEqual(
    [...roles].sort(),
    ["administrador", "camareira", "contador", "recepcionista"],
  );
});

test("health identifies the ephemeral server-side demo store", async () => {
  const store = createMemoryStore();

  assert.deepEqual(await store.health(), {
    ok: true,
    store: "memory",
    mode: "test-demo",
    persistence: "ephemeral-server-memory",
  });
});

test("public property lookup and availability expose only the requested slug", async () => {
  const store = createMemoryStore(createSeed("2026-07-14"));

  const property = await store.getPublicPropertyBySlug("hotel-jurua-palace");
  assert.equal(property.id, JURUA_PROPERTY);
  assert.equal(property.name, "Hotel Juruá Palace");
  assert.equal(await store.getPublicPropertyBySlug("missing-hotel"), null);

  const result = await store.findAvailability({
    propertySlug: "hotel-jurua-palace",
    checkIn: "2026-07-20",
    checkOut: "2026-07-22",
    adults: 2,
    children: 0,
  });

  assert.equal(result.property.id, JURUA_PROPERTY);
  assert.equal(result.nights, 2);
  const standard = result.roomTypes.find(({ id }) => id === "room-type-standard-jurua");
  assert.equal(standard.availableUnits, 1);
  assert.deepEqual(standard.availableRoomIds, ["room-102"]);
  assert.equal(standard.total, standard.nightlyRate * 2);
});

test("availability ignores cancelled stays and treats checkout as exclusive", async () => {
  const store = createMemoryStore(createSeed("2026-07-14"));

  const cancelledDates = await store.findAvailability({
    propertySlug: "hotel-jurua-palace",
    checkIn: "2026-08-10",
    checkOut: "2026-08-12",
    adults: 2,
    children: 0,
  });
  assert.deepEqual(
    cancelledDates.roomTypes
      .find(({ id }) => id === "room-type-standard-jurua")
      .availableRoomIds,
    ["room-101", "room-102"],
  );

  const startsAtExistingCheckout = await store.findAvailability({
    propertySlug: "hotel-jurua-palace",
    checkIn: "2026-07-22",
    checkOut: "2026-07-23",
    adults: 2,
    children: 0,
  });
  assert.deepEqual(
    startsAtExistingCheckout.roomTypes
      .find(({ id }) => id === "room-type-standard-jurua")
      .availableRoomIds,
    ["room-101", "room-102"],
  );
});

test("all operational reads require both tenant and property and guests stay masked", async () => {
  const store = createMemoryStore(createSeed("2026-07-14"));

  const bootstrap = await store.getBootstrap({
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
  });
  assert.equal(bootstrap.property.name, "Hotel Juruá Palace");
  assert.equal(bootstrap.rooms.every((row) => row.tenantId === CZS_TENANT), true);
  assert.equal(bootstrap.reservations.every((row) => row.propertyId === JURUA_PROPERTY), true);
  assert.equal(bootstrap.housekeepingTasks.length > 0, true);
  assert.equal(bootstrap.maintenanceOrders.length > 0, true);
  assert.equal(bootstrap.integrations.every(({ status }) => status === "sandbox"), true);
  assert.equal(bootstrap.summary.totalRooms, bootstrap.rooms.length);

  for (const guest of bootstrap.guests) {
    assert.equal(Object.hasOwn(guest, "document"), false);
    assert.equal(Object.hasOwn(guest, "cpf"), false);
    assert.match(guest.documentMasked, /^\*+/);
    assert.equal(guest.documentMasked.includes("123.456.789-00"), false);
  }

  assert.equal(await store.getBootstrap({
    tenantId: OTHER_TENANT,
    propertyId: JURUA_PROPERTY,
  }), null);
  assert.deepEqual(await store.listReservations({
    tenantId: OTHER_TENANT,
    propertyId: JURUA_PROPERTY,
  }), []);
  assert.deepEqual(await store.listAuditEvents({
    tenantId: OTHER_TENANT,
    propertyId: JURUA_PROPERTY,
  }), []);

  const otherBootstrap = await store.getBootstrap({
    tenantId: OTHER_TENANT,
    propertyId: OTHER_PROPERTY,
  });
  assert.equal(otherBootstrap.property.tenantId, OTHER_TENANT);
  assert.equal(otherBootstrap.rooms.some((row) => row.tenantId === CZS_TENANT), false);
});

test("bootstrap guest projections deep-clone nested fields", async () => {
  const seed = createSeed("2026-07-14");
  seed.guests[0].preferences = { accessibility: ["ground-floor"] };
  const store = createMemoryStore(seed);

  const first = await store.getBootstrap({
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
  });
  first.guests[0].preferences.accessibility.push("mutated-outside-store");

  const second = await store.getBootstrap({
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
  });
  assert.deepEqual(second.guests[0].preferences, { accessibility: ["ground-floor"] });
});

test("createReservation validates through domain, chooses the first free room and audits it", async () => {
  const store = createMemoryStore(createSeed("2026-07-14"));

  const created = await store.createReservation({
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
    input: reservationInput(),
    idempotencyKey: "booking-001",
    actor: { id: "user-reception-jurua", role: "recepcionista" },
  });

  assert.equal(created.status, "confirmed");
  assert.equal(created.roomId, "room-101");
  assert.equal(created.guestName, undefined);
  assert.equal(created.nightlyRate, 18_900);
  assert.equal(created.total, 37_800);

  const reservations = await store.listReservations({
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
  });
  assert.equal(reservations.some(({ id }) => id === created.id), true);
  const bootstrap = await store.getBootstrap({
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
  });
  const guest = bootstrap.guests.find(({ id }) => id === created.guestId);
  assert.equal(guest.name, "Maria da Silva");
  assert.equal(Object.hasOwn(guest, "document"), false);
  assert.equal(guest.documentMasked.endsWith("00"), true);

  const events = await store.listAuditEvents({
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
  });
  const event = events.find(({ entityId }) => entityId === created.id);
  assert.equal(event.action, "reservation.created");
  assert.equal(event.actor.id, "user-reception-jurua");
});

test("idempotency is tenant-scoped, returns the first result and rejects empty keys", async () => {
  const store = createMemoryStore(createSeed("2026-07-14"));
  const command = {
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
    input: reservationInput(),
    idempotencyKey: "booking-002",
    actor: { id: "user-admin-jurua" },
  };

  const first = await store.createReservation(command);
  const repeated = await store.createReservation({
    ...command,
    input: reservationInput({ guestName: "Outra pessoa" }),
  });
  assert.deepEqual(repeated, first);

  const rows = await store.listReservations({
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
  });
  assert.equal(rows.filter(({ id }) => id === first.id).length, 1);

  await assert.rejects(
    store.createReservation({ ...command, idempotencyKey: "   " }),
    /idempotencyKey/i,
  );

  const otherTenantReservation = await store.createReservation({
    tenantId: OTHER_TENANT,
    propertyId: OTHER_PROPERTY,
    input: reservationInput({ roomTypeId: "room-type-standard-rio-moa" }),
    idempotencyKey: "booking-002",
    actor: { id: "user-admin-rio-moa" },
  });
  assert.equal(otherTenantReservation.tenantId, OTHER_TENANT);
});

test("concurrent reservation retries share one tenant-scoped idempotent result", async () => {
  const store = createMemoryStore(createSeed("2026-07-14"));
  const command = {
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
    input: reservationInput(),
    idempotencyKey: "booking-concurrent-001",
    actor: { id: "user-reception-jurua", role: "recepcionista" },
  };

  const [first, repeated] = await Promise.all([
    store.createReservation(command),
    store.createReservation({
      ...command,
      input: reservationInput({ guestName: "Retry concorrente" }),
    }),
  ]);

  assert.deepEqual(repeated, first);
  const rows = await store.listReservations({
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
  });
  assert.equal(rows.filter(({ id }) => id === first.id).length, 1);
});

test("reservation replay metadata comes from the memory store across callers", async () => {
  const store = createMemoryStore(createSeed("2026-07-14"));
  const command = {
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
    input: reservationInput(),
    idempotencyKey: "booking-replay-metadata",
    actor: { id: "public-booking", role: "hospede" },
    includeReplayMetadata: true,
  };

  const first = await store.createReservation(command);
  const replay = await store.createReservation(command);
  assert.equal(first.replayed, false);
  assert.equal(replay.replayed, true);
  assert.deepEqual(replay.reservation, first.reservation);
});

test("idempotency keys are property-scoped inside the same tenant", async () => {
  const seed = createSeed("2026-07-14");
  seed.properties.push({
    id: "property-czs-annex",
    tenantId: CZS_TENANT,
    name: "Anexo CZS",
    slug: "anexo-czs",
    timeZone: "America/Rio_Branco",
  });
  seed.roomTypes.push({
    id: "room-type-standard-czs-annex",
    tenantId: CZS_TENANT,
    propertyId: "property-czs-annex",
    name: "Standard",
    capacity: 2,
    nightlyRate: 12_900,
  });
  seed.rooms.push({
    id: "room-czs-annex-01",
    tenantId: CZS_TENANT,
    propertyId: "property-czs-annex",
    roomTypeId: "room-type-standard-czs-annex",
    number: "01",
    status: "available",
  });
  const store = createMemoryStore(seed);
  const sharedKey = "same-key-different-properties";

  const first = await store.createReservation({
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
    input: reservationInput(),
    idempotencyKey: sharedKey,
    actor: { id: "user-admin-jurua" },
  });
  const second = await store.createReservation({
    tenantId: CZS_TENANT,
    propertyId: "property-czs-annex",
    input: reservationInput({ roomTypeId: "room-type-standard-czs-annex" }),
    idempotencyKey: sharedKey,
    actor: { id: "user-admin-jurua" },
  });

  assert.equal(first.propertyId, JURUA_PROPERTY);
  assert.equal(second.propertyId, "property-czs-annex");
  assert.notEqual(second.id, first.id);
});

test("concurrent distinct commands cannot allocate the same last room", async () => {
  const store = createMemoryStore(createSeed("2026-07-14"));
  const base = {
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
    input: reservationInput(),
    actor: { id: "user-reception-jurua", role: "recepcionista" },
  };
  await store.createReservation({ ...base, idempotencyKey: "fills-first-room" });

  const results = await Promise.allSettled([
    store.createReservation({ ...base, idempotencyKey: "competes-a" }),
    store.createReservation({ ...base, idempotencyKey: "competes-b" }),
  ]);

  assert.equal(results.filter(({ status }) => status === "fulfilled").length, 1);
  const rejected = results.find(({ status }) => status === "rejected");
  assert.equal(rejected.reason.code, "INVENTORY_CONFLICT");
});

test("createReservation rejects cross-tenant access and reports inventory conflicts", async () => {
  const store = createMemoryStore(createSeed("2026-07-14"));

  assert.equal(await store.createReservation({
    tenantId: OTHER_TENANT,
    propertyId: JURUA_PROPERTY,
    input: reservationInput(),
    idempotencyKey: "wrong-tenant",
    actor: { id: "attacker" },
  }), null);

  await store.createReservation({
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
    input: reservationInput(),
    idempotencyKey: "fills-101",
    actor: { id: "user-reception-jurua" },
  });
  await store.createReservation({
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
    input: reservationInput(),
    idempotencyKey: "fills-102",
    actor: { id: "user-reception-jurua" },
  });

  await assert.rejects(
    store.createReservation({
      tenantId: CZS_TENANT,
      propertyId: JURUA_PROPERTY,
      input: reservationInput(),
      idempotencyKey: "no-inventory",
      actor: { id: "user-reception-jurua" },
    }),
    (error) => error && error.code === "INVENTORY_CONFLICT",
  );
});

test("availability sells only rooms marked available or inspected", async () => {
  const cases = [
    ["available", true],
    ["inspected", true],
    ["maintenance", false],
    ["blocked", false],
    ["dirty", false],
    ["cleaning", false],
    ["do_not_disturb", false],
    ["occupied", false],
  ];

  for (const [status, sellable] of cases) {
    const seed = createSeed("2026-07-14");
    seed.rooms.find(({ id }) => id === "room-101").status = status;
    seed.rooms.find(({ id }) => id === "room-102").status = "maintenance";
    const store = createMemoryStore(seed);
    const result = await store.findAvailability({
      propertySlug: "hotel-jurua-palace",
      checkIn: "2026-09-01",
      checkOut: "2026-09-02",
      adults: 2,
      children: 0,
    });
    const availableRoomIds = result.roomTypes
      .find(({ id }) => id === "room-type-standard-jurua")
      .availableRoomIds;
    assert.deepEqual(availableRoomIds, sellable ? ["room-101"] : [], status);
  }
});

test("updateRoomStatus accepts operational statuses, stays scoped and creates audit events", async () => {
  const store = createMemoryStore(createSeed("2026-07-14"));
  const allowed = [
    "available",
    "occupied",
    "dirty",
    "cleaning",
    "inspected",
    "maintenance",
    "blocked",
    "do_not_disturb",
  ];

  for (const status of allowed) {
    const updated = await store.updateRoomStatus({
      tenantId: CZS_TENANT,
      propertyId: JURUA_PROPERTY,
      roomId: "room-102",
      status,
      actor: { id: "user-maid-jurua", role: "camareira" },
    });
    assert.equal(updated.status, status);
  }

  assert.equal(await store.updateRoomStatus({
    tenantId: OTHER_TENANT,
    propertyId: JURUA_PROPERTY,
    roomId: "room-102",
    status: "dirty",
    actor: { id: "attacker" },
  }), null);
  await assert.rejects(
    store.updateRoomStatus({
      tenantId: CZS_TENANT,
      propertyId: JURUA_PROPERTY,
      roomId: "room-102",
      status: "lost",
      actor: { id: "user-maid-jurua" },
    }),
    RangeError,
  );

  const events = await store.listAuditEvents({
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
  });
  assert.equal(events.filter(({ action }) => action === "room.status_updated").length, allowed.length);

  const bootstrap = await store.getBootstrap({
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
  });
  assert.equal(bootstrap.summary.totalRooms, bootstrap.rooms.length);
});

test("getUserByEmail is case-insensitive and returns scoped memberships without secrets", async () => {
  const store = createMemoryStore(createSeed("2026-07-14"));

  const user = await store.getUserByEmail("  ADMIN@JURUA.EXAMPLE  ");
  assert.equal(user.id, "user-admin-jurua");
  assert.deepEqual(user.memberships.map(({ role }) => role), ["administrador"]);
  assert.equal(Object.hasOwn(user, "password"), false);
  assert.equal(Object.hasOwn(user, "passwordHash"), false);
  assert.equal(await store.getUserByEmail("missing@example.com"), null);
});
