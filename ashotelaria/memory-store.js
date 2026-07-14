"use strict";

const {
  parseStayRange,
  rangesOverlap,
  buildOperationalSummary,
  validateReservationInput,
} = require("./domain");
const { createSeed } = require("./seed");

const ACTIVE_STAY_STATUSES = new Set(["confirmed", "checked_in"]);
const SELLABLE_ROOM_STATUSES = new Set(["available", "inspected"]);
const ROOM_STATUSES = new Set([
  "available", "occupied", "dirty", "cleaning", "inspected", "maintenance",
  "blocked", "do_not_disturb",
]);
const SUMMARY_ROOM_STATUS = {
  cleaning: "dirty",
  inspected: "available",
  blocked: "maintenance",
  do_not_disturb: "occupied",
};

function copy(value) {
  return structuredClone(value);
}

function maskedGuest(guest) {
  const { document, cpf, ...safe } = copy(guest);
  const source = String(document ?? cpf ?? "");
  return { ...safe, documentMasked: `${"*".repeat(Math.max(8, source.length - 2))}${source.slice(-2)}` };
}

function reservationResult(reservation, replayed, includeReplayMetadata) {
  const safe = copy(reservation);
  return includeReplayMetadata ? { reservation: safe, replayed } : safe;
}

function createMemoryStore(initialSeed = createSeed()) {
  const state = copy(initialSeed);
  state.auditEvents ??= [];
  state.credentialProfiles ??= [];
  const idempotency = new Map();
  const inFlightByIdempotencyKey = new Map();
  const inventoryQueues = new Map();
  const credentialQueues = new Map();

  async function withInventoryLock(scopeKey, operation) {
    const previous = inventoryQueues.get(scopeKey) ?? Promise.resolve();
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    const queueTail = previous.catch(() => {}).then(() => gate);
    inventoryQueues.set(scopeKey, queueTail);

    await previous.catch(() => {});
    try {
      return await operation();
    } finally {
      release();
      if (inventoryQueues.get(scopeKey) === queueTail) {
        inventoryQueues.delete(scopeKey);
      }
    }
  }

  async function withCredentialLock(scopeKey, operation) {
    const previous = credentialQueues.get(scopeKey) ?? Promise.resolve();
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    const queueTail = previous.catch(() => {}).then(() => gate);
    credentialQueues.set(scopeKey, queueTail);
    await previous.catch(() => {});
    try {
      return await operation();
    } finally {
      release();
      if (credentialQueues.get(scopeKey) === queueTail) credentialQueues.delete(scopeKey);
    }
  }

  function scopedProperty(tenantId, propertyId) {
    return state.properties.find((row) => row.id === propertyId && row.tenantId === tenantId) ?? null;
  }

  function scopedRows(collection, tenantId, propertyId) {
    return state[collection].filter((row) => row.tenantId === tenantId && row.propertyId === propertyId);
  }

  function audit({ tenantId, propertyId, action, entityId, actor, changes }) {
    state.auditEvents.push({
      id: `audit-${state.auditEvents.length + 1}`,
      tenantId,
      propertyId,
      action,
      entityId,
      actor: copy(actor ?? { id: "system" }),
      changes: copy(changes ?? {}),
    });
  }

  async function findAvailability({ propertySlug, checkIn, checkOut, adults = 1, children = 0 }) {
    const range = parseStayRange({ checkIn, checkOut });
    const property = state.properties.find((row) => row.slug === propertySlug) ?? null;
    if (!property) return null;
    const roomTypes = scopedRows("roomTypes", property.tenantId, property.id)
      .filter((type) => type.capacity >= adults + children)
      .map((type) => {
        const rooms = scopedRows("rooms", property.tenantId, property.id)
          .filter((room) => room.roomTypeId === type.id)
          .filter((room) => SELLABLE_ROOM_STATUSES.has(room.status));
        const occupiedRoomIds = new Set(scopedRows("reservations", property.tenantId, property.id)
          .filter((reservation) => ACTIVE_STAY_STATUSES.has(reservation.status))
          .filter((reservation) => rangesOverlap(checkIn, checkOut, reservation.checkIn, reservation.checkOut))
          .map((reservation) => reservation.roomId));
        const availableRoomIds = rooms
          .filter((room) => !occupiedRoomIds.has(room.id))
          .map((room) => room.id);
        return {
          ...copy(type),
          availableUnits: availableRoomIds.length,
          availableRoomIds,
          total: type.nightlyRate * range.nights,
        };
      });
    return { property: copy(property), ...range, adults, children, roomTypes };
  }

  return {
    async health() {
      return { ok: true, store: "memory", mode: "test-demo", persistence: "ephemeral-server-memory" };
    },

    async getPublicPropertyBySlug(slug) {
      return copy(state.properties.find((row) => row.slug === slug) ?? null);
    },

    findAvailability,

    async getBootstrap({ tenantId, propertyId }) {
      const property = scopedProperty(tenantId, propertyId);
      if (!property) return null;
      const rooms = copy(scopedRows("rooms", tenantId, propertyId));
      const reservations = copy(scopedRows("reservations", tenantId, propertyId));
      return {
        property: copy(property),
        roomTypes: copy(scopedRows("roomTypes", tenantId, propertyId)),
        rooms,
        guests: scopedRows("guests", tenantId, propertyId).map(maskedGuest),
        reservations,
        housekeepingTasks: copy(scopedRows("housekeepingTasks", tenantId, propertyId)),
        maintenanceOrders: copy(scopedRows("maintenanceOrders", tenantId, propertyId)),
        integrations: copy(scopedRows("integrations", tenantId, propertyId)),
        summary: buildOperationalSummary({
          rooms: rooms.map((room) => ({
            ...room,
            status: SUMMARY_ROOM_STATUS[room.status] ?? room.status,
          })),
          reservations,
          now: state.generatedAt,
        }),
      };
    },

    async listReservations({ tenantId, propertyId }) {
      if (!scopedProperty(tenantId, propertyId)) return [];
      return copy(scopedRows("reservations", tenantId, propertyId));
    },

    async listAuditEvents({ tenantId, propertyId }) {
      if (!scopedProperty(tenantId, propertyId)) return [];
      return copy(scopedRows("auditEvents", tenantId, propertyId));
    },

    async createReservation({
      tenantId, propertyId, input, idempotencyKey, actor, includeReplayMetadata = false,
    }) {
      if (typeof idempotencyKey !== "string" || !idempotencyKey.trim()) {
        throw new RangeError("idempotencyKey cannot be empty");
      }
      if (!scopedProperty(tenantId, propertyId)) return null;
      const key = `${tenantId}:${propertyId}:${idempotencyKey.trim()}`;
      if (idempotency.has(key)) {
        return reservationResult(idempotency.get(key), true, includeReplayMetadata);
      }
      if (inFlightByIdempotencyKey.has(key)) {
        return reservationResult(
          await inFlightByIdempotencyKey.get(key),
          true,
          includeReplayMetadata,
        );
      }

      const pending = withInventoryLock(`${tenantId}:${propertyId}`, async () => {
        if (idempotency.has(key)) return copy(idempotency.get(key));
        const roomType = scopedRows("roomTypes", tenantId, propertyId)
          .find((row) => row.id === input.roomTypeId);
        if (!roomType) throw new RangeError("roomTypeId is unknown");
        const validated = validateReservationInput({ ...input, nightlyRate: roomType.nightlyRate });
        const availability = await findAvailability({
          propertySlug: scopedProperty(tenantId, propertyId).slug,
          checkIn: validated.checkIn,
          checkOut: validated.checkOut,
          adults: validated.adults,
          children: validated.children,
        });
        const available = availability.roomTypes.find((row) => row.id === roomType.id);
        if (!available || available.availableRoomIds.length === 0) {
          const error = new Error("No inventory is available for this stay");
          error.code = "INVENTORY_CONFLICT";
          throw error;
        }

        const guest = {
          id: `guest-${tenantId}-${state.guests.length + 1}`,
          tenantId,
          propertyId,
          name: validated.guestName,
          email: input.guestEmail,
          phone: input.guestPhone,
          document: input.document ?? input.cpf ?? "",
        };
        state.guests.push(guest);
        const reservation = {
          id: `reservation-${tenantId}-${state.reservations.length + 1}`,
          tenantId,
          propertyId,
          guestId: guest.id,
          roomTypeId: roomType.id,
          roomId: available.availableRoomIds[0],
          checkIn: validated.checkIn,
          checkOut: validated.checkOut,
          adults: validated.adults,
          children: validated.children,
          nightlyRate: roomType.nightlyRate,
          extras: validated.extras,
          taxes: validated.taxes,
          total: roomType.nightlyRate * validated.nights + validated.extras + validated.taxes,
          status: "confirmed",
        };
        state.reservations.push(reservation);
        audit({ tenantId, propertyId, action: "reservation.created", entityId: reservation.id, actor });
        idempotency.set(key, copy(reservation));
        return copy(reservation);
      });
      inFlightByIdempotencyKey.set(key, pending);
      try {
        return reservationResult(await pending, false, includeReplayMetadata);
      } finally {
        if (inFlightByIdempotencyKey.get(key) === pending) {
          inFlightByIdempotencyKey.delete(key);
        }
      }
    },

    async updateRoomStatus({ tenantId, propertyId, roomId, status, actor }) {
      if (typeof status !== "string" || !ROOM_STATUSES.has(status.trim().toLowerCase())) {
        throw new RangeError("room status is unknown");
      }
      if (!scopedProperty(tenantId, propertyId)) return null;
      const room = state.rooms.find((row) => row.id === roomId && row.tenantId === tenantId && row.propertyId === propertyId);
      if (!room) return null;
      const previous = room.status;
      room.status = status.trim().toLowerCase();
      audit({ tenantId, propertyId, action: "room.status_updated", entityId: room.id, actor, changes: { from: previous, to: room.status } });
      return copy(room);
    },

    async getUserByEmail(email) {
      if (typeof email !== "string") return null;
      const user = state.users.find((row) => row.email.toLowerCase() === email.trim().toLowerCase());
      if (!user) return null;
      const { password, passwordHash, ...safe } = user;
      return { ...copy(safe), memberships: copy(state.memberships.filter((row) => row.userId === user.id)) };
    },

    async getCredentialProfile({ tenantId, propertyId, username, role }) {
      const normalizedUsername = typeof username === "string" ? username.trim().toLowerCase() : "";
      const normalizedRole = typeof role === "string" ? role.trim().toLowerCase() : "";
      const profile = state.credentialProfiles.find((row) => (
        row.tenantId === tenantId
        && row.propertyId === propertyId
        && row.username === normalizedUsername
        && row.role === normalizedRole
      ));
      return copy(profile ?? null);
    },

    async upsertCredentialProfile(profile) {
      if (!scopedProperty(profile.tenantId, profile.propertyId)) return null;
      const normalized = {
        ...copy(profile),
        username: String(profile.username ?? "").trim().toLowerCase(),
        role: String(profile.role ?? "").trim().toLowerCase(),
      };
      const index = state.credentialProfiles.findIndex((row) => (
        row.tenantId === normalized.tenantId
        && row.propertyId === normalized.propertyId
        && row.username === normalized.username
        && row.role === normalized.role
      ));
      if (index === -1) state.credentialProfiles.push(normalized);
      else state.credentialProfiles[index] = normalized;
      return copy(normalized);
    },

    async updateCredentialProfile({ tenantId, propertyId, username, role, changes }) {
      const normalizedUsername = typeof username === "string" ? username.trim().toLowerCase() : "";
      const normalizedRole = typeof role === "string" ? role.trim().toLowerCase() : "";
      const profile = state.credentialProfiles.find((row) => (
        row.tenantId === tenantId
        && row.propertyId === propertyId
        && row.username === normalizedUsername
        && row.role === normalizedRole
      ));
      if (!profile) return null;
      for (const field of [
        "passwordHash", "sessionVersion", "failedAttempts", "lockedUntil", "forceChange", "updatedAt",
      ]) {
        if (Object.hasOwn(changes ?? {}, field)) profile[field] = copy(changes[field]);
      }
      return copy(profile);
    },

    async recordCredentialFailure({
      tenantId, propertyId, username, role, maxFailedAttempts, lockedUntil, updatedAt,
    }) {
      const normalizedUsername = typeof username === "string" ? username.trim().toLowerCase() : "";
      const normalizedRole = typeof role === "string" ? role.trim().toLowerCase() : "";
      const key = `${tenantId}:${propertyId}:${normalizedUsername}:${normalizedRole}`;
      return withCredentialLock(key, async () => {
        const profile = state.credentialProfiles.find((row) => (
          row.tenantId === tenantId
          && row.propertyId === propertyId
          && row.username === normalizedUsername
          && row.role === normalizedRole
        ));
        if (!profile) return null;
        profile.failedAttempts = Number(profile.failedAttempts ?? 0) + 1;
        profile.lockedUntil = profile.failedAttempts >= maxFailedAttempts ? lockedUntil : null;
        profile.updatedAt = updatedAt;
        return copy(profile);
      });
    },
  };
}

module.exports = { createMemoryStore };
