"use strict";

const {
  parseStayRange,
  rangesOverlap,
  buildOperationalSummary,
  operationalDate,
  validateCheckInEligibility,
  validateCheckInRoom,
  validateReservationInput,
  validateReservationTransition,
} = require("./domain");
const { createSeed } = require("./seed");

const ACTIVE_STAY_STATUSES = new Set(["confirmed", "checked_in"]);
const SELLABLE_ROOM_STATUSES = new Set(["available", "inspected"]);
const ROOM_STATUSES = new Set([
  "available", "occupied", "dirty", "cleaning", "inspected", "maintenance",
  "blocked", "do_not_disturb",
]);
const ROOM_PHOTO_KINDS = new Set(["room", "delivery"]);
const MAINTENANCE_STATUSES = new Set(["open", "in_progress", "closed"]);
const HOUSEKEEPING_TASK_TYPES = new Set(["daily_cleaning", "final_cleaning", "consumption_count"]);
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

function addDays(dateValue, days) {
  const [year, month, day] = String(dateValue).split("-").map(Number);
  const instant = new Date(Date.UTC(year, month - 1, day));
  instant.setUTCDate(instant.getUTCDate() + days);
  return instant.toISOString().slice(0, 10);
}

function isValidImageDataUrl(value) {
  return typeof value === "string"
    && /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(value)
    && value.length <= 2_000_000;
}

function invalidMaintenanceStatus() {
  const error = new RangeError("maintenance order status is unknown");
  error.code = "INVALID_MAINTENANCE_STATUS";
  return error;
}

function serviceRequestError() {
  const error = new Error("Service request is not allowed for this reservation");
  error.code = "SERVICE_REQUEST_NOT_ALLOWED";
  return error;
}

function validTime(value) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : "";
}

function reservationResult(reservation, replayed, includeReplayMetadata) {
  const safe = copy(reservation);
  return includeReplayMetadata ? { reservation: safe, replayed } : safe;
}

function createMemoryStore(initialSeed = createSeed(), config = {}) {
  const state = copy(initialSeed);
  const now = typeof config.now === "function" ? config.now : () => new Date();
  state.auditEvents ??= [];
  state.credentialProfiles ??= [];
  state.roomPhotos ??= [];
  state.clientPartners ??= [];
  state.foodMenu ??= [];
  state.roomServiceOrders ??= [];
  state.guestMessages ??= [];
  state.notifications ??= [];
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

  function roomLockKey(tenantId, propertyId, roomId) {
    return `${tenantId}:${propertyId}:room:${roomId}`;
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

  function maidsForProperty(tenantId, propertyId) {
    const userById = new Map(state.users.map((user) => [user.id, user]));
    const names = state.memberships
      .filter((membership) => membership.tenantId === tenantId && membership.propertyId === propertyId && membership.role === "camareira")
      .map((membership) => userById.get(membership.userId)?.email?.split("@")[0] || "admin");
    return [...new Set(["admin", ...names])].sort();
  }

  function workloadByMaid(tenantId, propertyId) {
    const maids = maidsForProperty(tenantId, propertyId);
    const workload = Object.fromEntries(maids.map((maid) => [maid, 0]));
    for (const task of state.housekeepingTasks.filter((row) => (
      row.tenantId === tenantId && row.propertyId === propertyId && !["done", "cancelled"].includes(row.status)
    ))) {
      if (task.assignedUsername && Object.hasOwn(workload, task.assignedUsername)) workload[task.assignedUsername] += 1;
    }
    return workload;
  }

  function assignMaid(tenantId, propertyId) {
    const workload = workloadByMaid(tenantId, propertyId);
    return Object.entries(workload).sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? "admin";
  }

  function createHousekeepingTask({
    tenantId, propertyId, roomId, taskType, reservationId = "", scheduledDate, awayFrom = "", awayUntil = "",
    note = "", source = "system", actor,
  }) {
    if (!HOUSEKEEPING_TASK_TYPES.has(taskType)) throw new RangeError("housekeeping task type is unknown");
    const assignedUsername = assignMaid(tenantId, propertyId);
    const task = {
      id: `housekeeping-${tenantId}-${state.housekeepingTasks.length + 1}`,
      tenantId,
      propertyId,
      roomId,
      reservationId,
      taskType,
      status: "pending",
      assignedUsername,
      assignedRole: "camareira",
      scheduledDate,
      awayFrom,
      awayUntil,
      note: String(note ?? "").trim().slice(0, 300),
      source,
    };
    state.housekeepingTasks.push(task);
    const notification = {
      id: `notification-${state.notifications.length + 1}`,
      tenantId,
      propertyId,
      roomId,
      taskId: task.id,
      assignedUsername,
      assignedRole: "camareira",
      title: taskType,
      message: `Quarto ${roomId}: ${taskType}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    state.notifications.push(notification);
    audit({ tenantId, propertyId, action: "housekeeping.task_created", entityId: task.id, actor, changes: { taskType, roomId, assignedUsername } });
    return { task: copy(task), notification: copy(notification) };
  }

  function activeReservationForRequest(property, reservationId) {
    const reservation = state.reservations.find((row) => (
      row.id === reservationId && row.tenantId === property.tenantId && row.propertyId === property.id
    ));
    if (!reservation || reservation.status !== "checked_in") throw serviceRequestError();
    return reservation;
  }

  function photosForRoom(tenantId, propertyId, roomId) {
    const photos = state.roomPhotos
      .filter((photo) => photo.tenantId === tenantId && photo.propertyId === propertyId && photo.roomId === roomId)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    const roomPhoto = photos.find((photo) => photo.kind === "room");
    return {
      photoUrl: roomPhoto?.imageDataUrl ?? "",
      deliveryPhotos: copy(photos.filter((photo) => photo.kind === "delivery")),
    };
  }

  function roomWithPhotos(room) {
    return {
      ...room,
      ...photosForRoom(room.tenantId, room.propertyId, room.id),
      photoUrl: room.photoUrl || photosForRoom(room.tenantId, room.propertyId, room.id).photoUrl || "",
    };
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
      const rooms = copy(scopedRows("rooms", tenantId, propertyId).map(roomWithPhotos));
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
        roomServiceOrders: copy(scopedRows("roomServiceOrders", tenantId, propertyId)),
        guestMessages: copy(scopedRows("guestMessages", tenantId, propertyId)),
        notifications: copy(scopedRows("notifications", tenantId, propertyId)),
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

    async getClientPortal({ propertySlug }) {
      const property = state.properties.find((row) => row.slug === propertySlug) ?? null;
      if (!property) return null;
      return {
        property: copy(property),
        partners: copy(scopedRows("clientPartners", property.tenantId, property.id)),
        foodMenu: copy(scopedRows("foodMenu", property.tenantId, property.id)),
      };
    },

    async distributeHousekeepingWork({ tenantId, propertyId, date = state.generatedAt, actor }) {
      const property = scopedProperty(tenantId, propertyId);
      if (!property) return null;
      const created = [];
      const make = (roomId, taskType, reservationId = "") => {
        const exists = state.housekeepingTasks.some((task) => (
          task.tenantId === tenantId && task.propertyId === propertyId && task.roomId === roomId
          && task.taskType === taskType && task.scheduledDate === date && task.source === "auto_distribution"
          && task.status !== "cancelled"
        ));
        if (!exists) created.push(createHousekeepingTask({
          tenantId, propertyId, roomId, taskType, reservationId, scheduledDate: date, source: "auto_distribution", actor,
        }));
      };
      for (const reservation of scopedRows("reservations", tenantId, propertyId)) {
        if (reservation.status === "checked_in") {
          make(reservation.roomId, "daily_cleaning", reservation.id);
          make(reservation.roomId, "consumption_count", reservation.id);
        }
      }
      for (const reservation of scopedRows("reservations", tenantId, propertyId)) {
        const room = scopedRows("rooms", tenantId, propertyId).find((row) => row.id === reservation.roomId && row.status === "dirty");
        if (reservation.status === "checked_out" && room) {
          make(room.id, "final_cleaning", reservation.id);
        }
      }
      return {
        created: created.map(({ task }) => task),
        notifications: created.map(({ notification }) => notification),
        workloadByMaid: workloadByMaid(tenantId, propertyId),
      };
    },

    async createGuestServiceRequest({ propertySlug, reservationId, requestType, awayFrom, awayUntil, note }) {
      const property = state.properties.find((row) => row.slug === propertySlug) ?? null;
      if (!property) return null;
      const taskType = String(requestType ?? "").trim().toLowerCase();
      if (!HOUSEKEEPING_TASK_TYPES.has(taskType)) throw new RangeError("housekeeping task type is unknown");
      const reservation = activeReservationForRequest(property, reservationId);
      return createHousekeepingTask({
        tenantId: property.tenantId,
        propertyId: property.id,
        roomId: reservation.roomId,
        reservationId: reservation.id,
        taskType,
        scheduledDate: state.generatedAt,
        awayFrom: validTime(awayFrom),
        awayUntil: validTime(awayUntil),
        note,
        source: "guest_portal",
        actor: { id: "guest-portal", role: "hospede" },
      });
    },

    async createRoomServiceOrder({ propertySlug, reservationId, items, note }) {
      const property = state.properties.find((row) => row.slug === propertySlug) ?? null;
      if (!property) return null;
      const reservation = activeReservationForRequest(property, reservationId);
      const menu = new Map(scopedRows("foodMenu", property.tenantId, property.id).map((item) => [item.id, item]));
      const normalizedItems = (Array.isArray(items) ? items : []).map((item) => {
        const menuItem = menu.get(String(item.itemId ?? ""));
        const quantity = Number(item.quantity);
        if (!menuItem || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 20) {
          throw new RangeError("room service item is invalid");
        }
        return { itemId: menuItem.id, name: menuItem.name, quantity, unitPrice: menuItem.price, total: menuItem.price * quantity };
      });
      if (!normalizedItems.length) throw new RangeError("room service order cannot be empty");
      const order = {
        id: `room-service-${state.roomServiceOrders.length + 1}`,
        tenantId: property.tenantId,
        propertyId: property.id,
        reservationId: reservation.id,
        roomId: reservation.roomId,
        status: "requested",
        items: normalizedItems,
        total: normalizedItems.reduce((sum, item) => sum + item.total, 0),
        note: String(note ?? "").trim().slice(0, 300),
        createdAt: new Date().toISOString(),
      };
      state.roomServiceOrders.push(order);
      audit({ tenantId: property.tenantId, propertyId: property.id, action: "room_service.created", entityId: order.id, actor: { id: "guest-portal", role: "hospede" }, changes: { roomId: order.roomId, total: order.total } });
      return copy(order);
    },

    async createGuestMessage({ propertySlug, reservationId, target = "frontdesk", message }) {
      const property = state.properties.find((row) => row.slug === propertySlug) ?? null;
      if (!property) return null;
      const reservation = activeReservationForRequest(property, reservationId);
      if (typeof message !== "string" || !message.trim()) throw new RangeError("message cannot be empty");
      const row = {
        id: `guest-message-${state.guestMessages.length + 1}`,
        tenantId: property.tenantId,
        propertyId: property.id,
        reservationId: reservation.id,
        roomId: reservation.roomId,
        target: String(target ?? "frontdesk").trim().toLowerCase().slice(0, 40) || "frontdesk",
        message: message.trim().slice(0, 500),
        status: "open",
        createdAt: new Date().toISOString(),
      };
      state.guestMessages.push(row);
      audit({ tenantId: property.tenantId, propertyId: property.id, action: "guest_message.created", entityId: row.id, actor: { id: "guest-portal", role: "hospede" }, changes: { target: row.target, roomId: row.roomId } });
      return copy(row);
    },

    async getAdminOverview({ tenantId, propertyId }) {
      if (!scopedProperty(tenantId, propertyId)) return null;
      const reservations = scopedRows("reservations", tenantId, propertyId);
      const housekeeping = scopedRows("housekeepingTasks", tenantId, propertyId);
      const rooms = scopedRows("rooms", tenantId, propertyId);
      const roomReadiness = rooms.map((room) => ({
        roomId: room.id,
        number: room.number,
        status: room.status,
        lastDeliveryPhoto: photosForRoom(tenantId, propertyId, room.id).deliveryPhotos[0] ?? null,
      }));
      return {
        roomReadiness: copy(roomReadiness),
        housekeepingTasks: copy(housekeeping),
        roomServiceOrders: copy(scopedRows("roomServiceOrders", tenantId, propertyId)),
        guestMessages: copy(scopedRows("guestMessages", tenantId, propertyId)),
        partners: copy(scopedRows("clientPartners", tenantId, propertyId)),
        charts: {
          housekeepingByStatus: housekeeping.reduce((acc, task) => ({ ...acc, [task.status]: (acc[task.status] ?? 0) + 1 }), {}),
          roomsByStatus: rooms.reduce((acc, room) => ({ ...acc, [room.status]: (acc[room.status] ?? 0) + 1 }), {}),
          revenue: {
            totalConfirmedCents: reservations
              .filter((row) => !["cancelled"].includes(row.status))
              .reduce((sum, row) => sum + Number(row.total || 0), 0),
          },
        },
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

    async createWalkIn({ tenantId, propertyId, input, actor }) {
      const property = scopedProperty(tenantId, propertyId);
      if (!property) return null;
      return withInventoryLock(`${tenantId}:${propertyId}`, async () => {
        const roomId = typeof input?.roomId === "string" ? input.roomId.trim() : "";
        const room = state.rooms.find((row) => (
          row.id === roomId && row.tenantId === tenantId && row.propertyId === propertyId
        ));
        if (!room) return null;
        const hasCheckedInReservation = state.reservations.some((row) => (
          row.tenantId === tenantId
          && row.propertyId === propertyId
          && row.roomId === room.id
          && row.status === "checked_in"
        ));
        validateCheckInRoom({ roomStatus: room.status, hasCheckedInReservation });
        const roomType = scopedRows("roomTypes", tenantId, propertyId)
          .find((row) => row.id === room.roomTypeId);
        if (!roomType) throw new RangeError("roomTypeId is unknown");
        const checkIn = operationalDate(now(), property.timeZone);
        const validated = validateReservationInput({
          ...input,
          roomTypeId: roomType.id,
          checkIn,
          checkOut: input?.checkOut || addDays(checkIn, 1),
          nightlyRate: roomType.nightlyRate,
        });
        const overlaps = state.reservations.some((row) => (
          row.tenantId === tenantId
          && row.propertyId === propertyId
          && row.roomId === room.id
          && ACTIVE_STAY_STATUSES.has(row.status)
          && rangesOverlap(validated.checkIn, validated.checkOut, row.checkIn, row.checkOut)
        ));
        if (overlaps) {
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
          id: `walkin-${tenantId}-${state.reservations.length + 1}`,
          tenantId,
          propertyId,
          guestId: guest.id,
          roomTypeId: roomType.id,
          roomId: room.id,
          checkIn: validated.checkIn,
          checkOut: validated.checkOut,
          adults: validated.adults,
          children: validated.children,
          nightlyRate: roomType.nightlyRate,
          extras: validated.extras,
          taxes: validated.taxes,
          total: roomType.nightlyRate * validated.nights + validated.extras + validated.taxes,
          status: "checked_in",
          source: "frontdesk",
        };
        state.reservations.push(reservation);
        room.status = "occupied";
        audit({ tenantId, propertyId, action: "walkin.created", entityId: reservation.id, actor, changes: { roomId: room.id } });
        return copy(reservation);
      });
    },

    async addRoomPhoto({ tenantId, propertyId, roomId, kind = "delivery", imageDataUrl, note = "", actor }) {
      if (!scopedProperty(tenantId, propertyId)) return null;
      const normalizedKind = String(kind ?? "").trim().toLowerCase();
      if (!ROOM_PHOTO_KINDS.has(normalizedKind)) throw new RangeError("room photo kind is unknown");
      if (!isValidImageDataUrl(imageDataUrl)) throw new RangeError("room photo image is invalid");
      return withInventoryLock(roomLockKey(tenantId, propertyId, roomId), async () => {
        const room = state.rooms.find((row) => row.id === roomId && row.tenantId === tenantId && row.propertyId === propertyId);
        if (!room) return null;
        const photo = {
          id: `room-photo-${state.roomPhotos.length + 1}`,
          tenantId,
          propertyId,
          roomId,
          kind: normalizedKind,
          imageDataUrl,
          note: String(note ?? "").trim().slice(0, 240),
          actor: copy(actor ?? { id: "system" }),
          createdAt: new Date().toISOString(),
        };
        state.roomPhotos.push(photo);
        if (normalizedKind === "delivery") {
          if (!["occupied", "maintenance", "blocked"].includes(room.status)) room.status = "inspected";
          for (const task of state.housekeepingTasks.filter((row) => (
            row.tenantId === tenantId && row.propertyId === propertyId && row.roomId === roomId
          ))) {
            if (task.status !== "cancelled") task.status = "done";
          }
        }
        audit({ tenantId, propertyId, action: `room.photo_${normalizedKind}.created`, entityId: roomId, actor, changes: { photoId: photo.id } });
        return copy(photo);
      });
    },

    async updateRoomStatus({ tenantId, propertyId, roomId, status, actor }) {
      if (typeof status !== "string" || !ROOM_STATUSES.has(status.trim().toLowerCase())) {
        throw new RangeError("room status is unknown");
      }
      if (!scopedProperty(tenantId, propertyId)) return null;
      return withInventoryLock(roomLockKey(tenantId, propertyId, roomId), async () => {
        const room = state.rooms.find((row) => row.id === roomId && row.tenantId === tenantId && row.propertyId === propertyId);
        if (!room) return null;
        const previous = room.status;
        room.status = status.trim().toLowerCase();
        audit({ tenantId, propertyId, action: "room.status_updated", entityId: room.id, actor, changes: { from: previous, to: room.status } });
        return copy(room);
      });
    },

    async updateMaintenanceOrderStatus({ tenantId, propertyId, maintenanceOrderId, status, actor }) {
      const next = String(status ?? "").trim().toLowerCase();
      if (!MAINTENANCE_STATUSES.has(next)) throw invalidMaintenanceStatus();
      if (!scopedProperty(tenantId, propertyId)) return null;
      const order = state.maintenanceOrders.find((row) => (
        row.id === maintenanceOrderId && row.tenantId === tenantId && row.propertyId === propertyId
      ));
      if (!order) return null;
      const previous = order.status;
      order.status = next;
      audit({
        tenantId,
        propertyId,
        action: "maintenance.status_updated",
        entityId: order.id,
        actor,
        changes: { from: previous, to: order.status, roomId: order.roomId },
      });
      return copy(order);
    },

    async updateReservationStatus({ tenantId, propertyId, reservationId, status, actor }) {
      const property = scopedProperty(tenantId, propertyId);
      if (!property) return null;
      const initialReservation = state.reservations.find((row) => (
        row.id === reservationId && row.tenantId === tenantId && row.propertyId === propertyId
      ));
      if (!initialReservation) return null;
      const lockKey = initialReservation.roomId
        ? roomLockKey(tenantId, propertyId, initialReservation.roomId)
        : `${tenantId}:${propertyId}:reservation:${reservationId}`;
      return withInventoryLock(lockKey, async () => {
        const reservation = state.reservations.find((row) => (
          row.id === reservationId && row.tenantId === tenantId && row.propertyId === propertyId
        ));
        if (!reservation) return null;
        const next = validateReservationTransition(reservation.status, status);
        const previous = reservation.status;
        if (next === previous) return copy(reservation);

        const room = state.rooms.find((row) => (
          row.id === reservation.roomId && row.tenantId === tenantId && row.propertyId === propertyId
        ));
        if (next === "checked_in") {
          validateCheckInEligibility({
            checkIn: reservation.checkIn,
            checkOut: reservation.checkOut,
            operationalDate: operationalDate(now(), property.timeZone),
          });
          const hasCheckedInReservation = state.reservations.some((row) => (
            row.id !== reservation.id
            && row.tenantId === tenantId
            && row.propertyId === propertyId
            && row.roomId === reservation.roomId
            && row.status === "checked_in"
          ));
          validateCheckInRoom({ roomStatus: room?.status, hasCheckedInReservation });
        }

        reservation.status = next;
        if (room && next === "checked_in") room.status = "occupied";
        if (room && next === "checked_out") room.status = "dirty";
        audit({
          tenantId,
          propertyId,
          action: "reservation.status_updated",
          entityId: reservation.id,
          actor,
          changes: { from: previous, to: next, roomId: reservation.roomId },
        });
        return copy(reservation);
      });
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

    async createCredentialProfileIfAbsent(profile) {
      if (!scopedProperty(profile.tenantId, profile.propertyId)) return null;
      const normalized = {
        ...copy(profile),
        username: String(profile.username ?? "").trim().toLowerCase(),
        role: String(profile.role ?? "").trim().toLowerCase(),
      };
      const key = `${normalized.tenantId}:${normalized.propertyId}:${normalized.username}:${normalized.role}`;
      return withCredentialLock(key, async () => {
        const existing = state.credentialProfiles.find((row) => (
          row.tenantId === normalized.tenantId
          && row.propertyId === normalized.propertyId
          && row.username === normalized.username
          && row.role === normalized.role
        ));
        if (existing) return copy(existing);
        state.credentialProfiles.push(normalized);
        return copy(normalized);
      });
    },

    async updateCredentialProfile({ tenantId, propertyId, username, role, expectedSessionVersion, changes }) {
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
        const compareVersion = expectedSessionVersion !== undefined && expectedSessionVersion !== null;
        if (!profile || (compareVersion && profile.sessionVersion !== expectedSessionVersion)) return null;
        for (const field of [
          "passwordHash", "sessionVersion", "failedAttempts", "lockedUntil", "forceChange", "updatedAt",
        ]) {
          if (Object.hasOwn(changes ?? {}, field)) profile[field] = copy(changes[field]);
        }
        return copy(profile);
      });
    },

    async setCredentialPassword({
      tenantId, propertyId, username, role, passwordHash, forceChange,
      expectedSessionVersion, updatedAt, actor, action,
    }) {
      if (!scopedProperty(tenantId, propertyId)) return null;
      const normalizedUsername = String(username ?? "").trim().toLowerCase();
      const normalizedRole = String(role ?? "").trim().toLowerCase();
      const key = `${tenantId}:${propertyId}:${normalizedUsername}:${normalizedRole}`;
      return withCredentialLock(key, async () => {
        let profile = state.credentialProfiles.find((row) => (
          row.tenantId === tenantId
          && row.propertyId === propertyId
          && row.username === normalizedUsername
          && row.role === normalizedRole
        ));
        const compareVersion = expectedSessionVersion !== undefined && expectedSessionVersion !== null;
        if (compareVersion && (!profile || profile.sessionVersion !== expectedSessionVersion)) return null;
        if (!profile) {
          profile = {
            tenantId,
            propertyId,
            username: normalizedUsername,
            role: normalizedRole,
            sessionVersion: 1,
          };
          state.credentialProfiles.push(profile);
        } else {
          profile.sessionVersion += 1;
        }
        profile.passwordHash = passwordHash;
        profile.failedAttempts = 0;
        profile.lockedUntil = null;
        profile.forceChange = Boolean(forceChange);
        profile.updatedAt = updatedAt;
        audit({
          tenantId,
          propertyId,
          action,
          entityId: `credential:${normalizedUsername}:${normalizedRole}`,
          actor: {
            username: String(actor?.username ?? "system").trim().toLowerCase(),
            role: String(actor?.role ?? "system").trim().toLowerCase(),
          },
          changes: {
            targetUsername: normalizedUsername,
            targetRole: normalizedRole,
            sessionVersion: profile.sessionVersion,
          },
        });
        return copy(profile);
      });
    },

    async recordCredentialFailure({
      tenantId, propertyId, username, role, expectedSessionVersion,
      maxFailedAttempts, lockedUntil, updatedAt,
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
        const compareVersion = expectedSessionVersion !== undefined && expectedSessionVersion !== null;
        if (!profile || (compareVersion && profile.sessionVersion !== expectedSessionVersion)) return null;
        profile.failedAttempts = Number(profile.failedAttempts ?? 0) + 1;
        profile.lockedUntil = profile.failedAttempts >= maxFailedAttempts ? lockedUntil : null;
        profile.updatedAt = updatedAt;
        return copy(profile);
      });
    },
  };
}

module.exports = { createMemoryStore };
