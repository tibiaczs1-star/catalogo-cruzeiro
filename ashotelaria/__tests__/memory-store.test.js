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
    ["administrador", "camareira", "contador", "gerente", "manutencao", "recepcionista", "supervisor_governanca"],
  );

  const juruaTypes = first.roomTypes.filter((row) => row.propertyId === JURUA_PROPERTY);
  const juruaRooms = first.rooms.filter((row) => row.propertyId === JURUA_PROPERTY);
  const juruaReservations = first.reservations.filter((row) => row.propertyId === JURUA_PROPERTY);
  assert.deepEqual(juruaTypes.map((row) => row.name), ["Standard", "Superior", "Suíte Família"]);
  assert.equal(juruaRooms.length, 12);
  assert.deepEqual(
    [...new Set(juruaReservations.map((row) => row.status))].sort(),
    ["cancelled", "checked_in", "checked_out", "confirmed"],
  );
  assert.deepEqual(
    juruaReservations.find(({ id }) => id === "reservation-jurua-arrival-20260714"),
    {
      id: "reservation-jurua-arrival-20260714",
      tenantId: CZS_TENANT,
      propertyId: JURUA_PROPERTY,
      guestId: "guest-jurua-01",
      roomTypeId: "room-type-standard-jurua",
      roomId: "room-102",
      checkIn: "2026-07-14",
      checkOut: "2026-07-16",
      adults: 2,
      children: 0,
      nightlyRate: 18_900,
      total: 37_800,
      status: "confirmed",
    },
  );
});

test("seed exposes real hotel-ready room photo slots without external sample photos", () => {
  const seed = createSeed("2026-07-14");
  const juruaRooms = seed.rooms.filter((row) => row.propertyId === JURUA_PROPERTY);

  assert.equal(juruaRooms.length, 12);
  for (const room of juruaRooms) {
    assert.equal(Object.hasOwn(room, "photoUrl"), true);
    assert.equal(room.photoUrl, "");
    assert.doesNotMatch(JSON.stringify(room), /unsplash|example-photo|demo/i);
  }
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
  assert.equal(standard.availableUnits, 2);
  assert.deepEqual(standard.availableRoomIds, ["room-102", "room-103"]);
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
    ["room-101", "room-102", "room-103"],
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
    ["room-101", "room-102", "room-103"],
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

test("walk-in registration creates an immediate checked-in stay and occupies the room", async () => {
  const store = createMemoryStore(createSeed("2026-07-14"), { now: () => "2026-07-14" });

  const reservation = await store.createWalkIn({
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
    actor: { id: "admin:recepcionista", role: "recepcionista" },
    input: {
      roomId: "room-103",
      guestName: "Hospede de balcão",
      guestEmail: "balcao@hotel.local",
      guestPhone: "+55 68 99900-0000",
      document: "999.888.777-66",
      checkOut: "2026-07-15",
      adults: 1,
      children: 0,
    },
  });

  assert.equal(reservation.status, "checked_in");
  assert.equal(reservation.roomId, "room-103");
  assert.equal(reservation.checkIn, "2026-07-14");
  assert.equal(reservation.total, 18_900);

  const bootstrap = await store.getBootstrap({ tenantId: CZS_TENANT, propertyId: JURUA_PROPERTY });
  assert.equal(bootstrap.rooms.find(({ id }) => id === "room-103").status, "occupied");
  assert.equal(bootstrap.guests.some(({ name }) => name === "Hospede de balcão"), true);
  assert.equal((await store.listAuditEvents({ tenantId: CZS_TENANT, propertyId: JURUA_PROPERTY }))
    .some(({ action, entityId }) => action === "walkin.created" && entityId === reservation.id), true);
});

test("walk-in registration only accepts ready rooms inside the scoped property", async () => {
  const store = createMemoryStore(createSeed("2026-07-14"), { now: () => "2026-07-14" });
  const input = {
    roomId: "room-104",
    guestName: "Hospede sem quarto pronto",
    checkOut: "2026-07-15",
    adults: 1,
    children: 0,
  };

  await assert.rejects(
    store.createWalkIn({
      tenantId: CZS_TENANT,
      propertyId: JURUA_PROPERTY,
      actor: { id: "admin:recepcionista", role: "recepcionista" },
      input,
    }),
    (error) => error.code === "ROOM_NOT_READY",
  );
  assert.equal(await store.createWalkIn({
    tenantId: OTHER_TENANT,
    propertyId: JURUA_PROPERTY,
    actor: { id: "attacker" },
    input: { ...input, roomId: "room-103" },
  }), null);
});

test("room delivery photos are persisted for the assigned housekeeping room", async () => {
  const store = createMemoryStore(createSeed("2026-07-14"));
  const photo = await store.addRoomPhoto({
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
    roomId: "room-104",
    kind: "delivery",
    imageDataUrl: "data:image/jpeg;base64,Zm90by1kby1xdWFydG8=",
    note: "Quarto entregue limpo",
    actor: { username: "admin", role: "camareira" },
  });

  assert.equal(photo.roomId, "room-104");
  assert.equal(photo.kind, "delivery");
  assert.equal(photo.note, "Quarto entregue limpo");
  const bootstrap = await store.getBootstrap({ tenantId: CZS_TENANT, propertyId: JURUA_PROPERTY });
  const room = bootstrap.rooms.find(({ id }) => id === "room-104");
  assert.equal(room.deliveryPhotos.length, 1);
  assert.equal(room.deliveryPhotos[0].imageDataUrl, "data:image/jpeg;base64,Zm90by1kby1xdWFydG8=");
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
  const seed = createSeed("2026-07-14");
  seed.rooms.find(({ id }) => id === "room-103").status = "maintenance";
  const store = createMemoryStore(seed);
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
  const seed = createSeed("2026-07-14");
  seed.rooms.find(({ id }) => id === "room-103").status = "maintenance";
  const store = createMemoryStore(seed);

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
    for (const roomId of ["room-102", "room-103", "room-104"]) {
      seed.rooms.find(({ id }) => id === roomId).status = "maintenance";
    }
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

test("memory check-in rejects days outside arrival without changing reservation, room or audit", async () => {
  for (const now of [
    new Date("2026-07-14T03:30:00.000Z"),
    "2026-07-15",
    "2026-07-16",
  ]) {
    const store = createMemoryStore(createSeed("2026-07-14"), { now: () => now });
    await assert.rejects(
      store.updateReservationStatus({
        tenantId: CZS_TENANT,
        propertyId: JURUA_PROPERTY,
        reservationId: "reservation-jurua-arrival-20260714",
        status: "checked_in",
        actor: { id: "admin:recepcionista" },
      }),
      (error) => error.code === "CHECK_IN_NOT_ALLOWED",
      String(now),
    );

    const reservations = await store.listReservations({ tenantId: CZS_TENANT, propertyId: JURUA_PROPERTY });
    assert.equal(reservations.find(({ id }) => id === "reservation-jurua-arrival-20260714").status, "confirmed");
    const bootstrap = await store.getBootstrap({ tenantId: CZS_TENANT, propertyId: JURUA_PROPERTY });
    assert.equal(bootstrap.rooms.find(({ id }) => id === "room-102").status, "available");
    assert.equal((await store.listAuditEvents({ tenantId: CZS_TENANT, propertyId: JURUA_PROPERTY }))
      .some(({ entityId }) => entityId === "reservation-jurua-arrival-20260714"), false);
  }
});

test("memory check-in preserves every incompatible room status", async () => {
  const incompatibleStatuses = ["maintenance", "blocked", "dirty", "cleaning", "occupied", "do_not_disturb"];
  for (const roomStatus of incompatibleStatuses) {
    const seed = createSeed("2026-07-14");
    seed.rooms.find(({ id }) => id === "room-102").status = roomStatus;
    const store = createMemoryStore(seed, { now: () => "2026-07-14" });

    await assert.rejects(
      store.updateReservationStatus({
        tenantId: CZS_TENANT,
        propertyId: JURUA_PROPERTY,
        reservationId: "reservation-jurua-arrival-20260714",
        status: "checked_in",
        actor: { id: "admin:recepcionista" },
      }),
      (error) => error.code === "ROOM_NOT_READY",
      roomStatus,
    );

    const reservations = await store.listReservations({ tenantId: CZS_TENANT, propertyId: JURUA_PROPERTY });
    assert.equal(reservations.find(({ id }) => id === "reservation-jurua-arrival-20260714").status, "confirmed");
    const bootstrap = await store.getBootstrap({ tenantId: CZS_TENANT, propertyId: JURUA_PROPERTY });
    assert.equal(bootstrap.rooms.find(({ id }) => id === "room-102").status, roomStatus);
    assert.equal((await store.listAuditEvents({ tenantId: CZS_TENANT, propertyId: JURUA_PROPERTY }))
      .some(({ entityId }) => entityId === "reservation-jurua-arrival-20260714"), false);
  }
});

test("memory check-in rejects another checked-in reservation in the same scoped room", async () => {
  const seed = createSeed("2026-07-14");
  seed.reservations.push({
    ...seed.reservations.find(({ id }) => id === "reservation-jurua-arrival-20260714"),
    id: "reservation-jurua-room-conflict",
    status: "checked_in",
  });
  const store = createMemoryStore(seed, { now: () => "2026-07-14" });

  await assert.rejects(
    store.updateReservationStatus({
      tenantId: CZS_TENANT,
      propertyId: JURUA_PROPERTY,
      reservationId: "reservation-jurua-arrival-20260714",
      status: "checked_in",
      actor: { id: "admin:recepcionista" },
    }),
    (error) => error.code === "ROOM_NOT_READY",
  );
  const reservations = await store.listReservations({ tenantId: CZS_TENANT, propertyId: JURUA_PROPERTY });
  assert.equal(reservations.find(({ id }) => id === "reservation-jurua-arrival-20260714").status, "confirmed");
  const bootstrap = await store.getBootstrap({ tenantId: CZS_TENANT, propertyId: JURUA_PROPERTY });
  assert.equal(bootstrap.rooms.find(({ id }) => id === "room-102").status, "available");
});

test("concurrent memory check-ins cannot both occupy the same room", async () => {
  const seed = createSeed("2026-07-14");
  seed.reservations.push({
    ...seed.reservations.find(({ id }) => id === "reservation-jurua-arrival-20260714"),
    id: "reservation-jurua-arrival-racing",
  });
  const store = createMemoryStore(seed, { now: () => "2026-07-14" });
  const command = (reservationId) => store.updateReservationStatus({
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
    reservationId,
    status: "checked_in",
    actor: { id: "admin:recepcionista" },
  });

  const results = await Promise.allSettled([
    command("reservation-jurua-arrival-20260714"),
    command("reservation-jurua-arrival-racing"),
  ]);
  assert.equal(results.filter(({ status }) => status === "fulfilled").length, 1);
  const rejected = results.find(({ status }) => status === "rejected");
  assert.equal(rejected.reason.code, "ROOM_NOT_READY");
  assert.equal((await store.listAuditEvents({ tenantId: CZS_TENANT, propertyId: JURUA_PROPERTY }))
    .filter(({ action }) => action === "reservation.status_updated").length, 1);
});

test("memory check-in cannot overwrite a concurrent incompatible room update", async () => {
  const store = createMemoryStore(createSeed("2026-07-14"), { now: () => "2026-07-14" });
  const results = await Promise.allSettled([
    store.updateRoomStatus({
      tenantId: CZS_TENANT,
      propertyId: JURUA_PROPERTY,
      roomId: "room-102",
      status: "maintenance",
      actor: { id: "admin:manutencao" },
    }),
    store.updateReservationStatus({
      tenantId: CZS_TENANT,
      propertyId: JURUA_PROPERTY,
      reservationId: "reservation-jurua-arrival-20260714",
      status: "checked_in",
      actor: { id: "admin:recepcionista" },
    }),
  ]);

  assert.equal(results[0].status, "fulfilled");
  assert.equal(results[1].status, "rejected");
  assert.equal(results[1].reason.code, "ROOM_NOT_READY");
  const bootstrap = await store.getBootstrap({ tenantId: CZS_TENANT, propertyId: JURUA_PROPERTY });
  assert.equal(bootstrap.rooms.find(({ id }) => id === "room-102").status, "maintenance");
  assert.equal(bootstrap.reservations.find(({ id }) => id === "reservation-jurua-arrival-20260714").status, "confirmed");
});

test("reservation lifecycle updates the stay, room and audit inside the property scope", async () => {
  const store = createMemoryStore(createSeed("2026-07-14"), {
    now: () => new Date("2026-07-15T03:30:00.000Z"),
  });
  const actor = { id: "admin:recepcionista", role: "recepcionista" };

  const checkedIn = await store.updateReservationStatus({
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
    reservationId: "reservation-jurua-arrival-20260714",
    status: "checked_in",
    actor,
  });
  assert.equal(checkedIn.status, "checked_in");
  let bootstrap = await store.getBootstrap({ tenantId: CZS_TENANT, propertyId: JURUA_PROPERTY });
  assert.equal(bootstrap.rooms.find(({ id }) => id === "room-102").status, "occupied");

  const checkedOut = await store.updateReservationStatus({
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
    reservationId: "reservation-jurua-arrival-20260714",
    status: "checked_out",
    actor,
  });
  assert.equal(checkedOut.status, "checked_out");
  bootstrap = await store.getBootstrap({ tenantId: CZS_TENANT, propertyId: JURUA_PROPERTY });
  assert.equal(bootstrap.rooms.find(({ id }) => id === "room-102").status, "dirty");
  assert.equal((await store.listAuditEvents({ tenantId: CZS_TENANT, propertyId: JURUA_PROPERTY }))
    .filter(({ action }) => action === "reservation.status_updated").length, 2);

  await assert.rejects(
    store.updateReservationStatus({
      tenantId: CZS_TENANT,
      propertyId: JURUA_PROPERTY,
      reservationId: "reservation-jurua-arrival-20260714",
      status: "checked_in",
      actor,
    }),
    (error) => error.code === "INVALID_RESERVATION_TRANSITION",
  );
  assert.equal(await store.updateReservationStatus({
    tenantId: OTHER_TENANT,
    propertyId: JURUA_PROPERTY,
    reservationId: "reservation-jurua-cancelled",
    status: "cancelled",
    actor,
  }), null);
});

test("a confirmed reservation can be cancelled without occupying the room", async () => {
  const store = createMemoryStore(createSeed("2026-07-14"));
  const cancelled = await store.updateReservationStatus({
    tenantId: CZS_TENANT,
    propertyId: JURUA_PROPERTY,
    reservationId: "reservation-jurua-active",
    status: "cancelled",
    actor: { id: "admin:administrador" },
  });
  assert.equal(cancelled.status, "cancelled");
  const bootstrap = await store.getBootstrap({ tenantId: CZS_TENANT, propertyId: JURUA_PROPERTY });
  assert.equal(bootstrap.rooms.find(({ id }) => id === "room-101").status, "available");
});

test("getUserByEmail is case-insensitive and returns scoped memberships without secrets", async () => {
  const store = createMemoryStore(createSeed("2026-07-14"));

  const user = await store.getUserByEmail("  ADMIN@JURUA.EXAMPLE  ");
  assert.equal(user.id, "user-admin-jurua");
  assert.deepEqual(user.memberships.map(({ role }) => role).sort(), ["administrador", "gerente", "manutencao"]);
  assert.equal(Object.hasOwn(user, "password"), false);
  assert.equal(Object.hasOwn(user, "passwordHash"), false);
  assert.equal(await store.getUserByEmail("missing@example.com"), null);
});
