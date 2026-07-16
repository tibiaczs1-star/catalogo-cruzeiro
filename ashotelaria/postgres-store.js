"use strict";

const { randomUUID } = require("node:crypto");
const {
  parseStayRange,
  buildOperationalSummary,
  operationalDate,
  validateCheckInEligibility,
  validateCheckInRoom,
  validateReservationInput,
  validateReservationTransition,
} = require("./domain");

const ROOM_STATUSES = new Set([
  "available", "occupied", "dirty", "cleaning", "inspected", "maintenance",
  "blocked", "do_not_disturb",
]);
const ROOM_PHOTO_KINDS = new Set(["room", "delivery"]);
const SUMMARY_ROOM_STATUS = {
  cleaning: "dirty",
  inspected: "available",
  blocked: "maintenance",
  do_not_disturb: "occupied",
};

function integer(value) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new RangeError("database cents exceed the safe integer range");
  return parsed;
}

function dateOnly(value) {
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
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

function propertyFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    slug: row.slug,
    timeZone: row.time_zone,
  };
}

function roomTypeFromRow(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    propertyId: row.property_id,
    name: row.name,
    capacity: Number(row.capacity),
    nightlyRate: integer(row.nightly_rate_cents),
  };
}

function roomFromRow(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    propertyId: row.property_id,
    roomTypeId: row.room_type_id,
    number: row.number,
    status: row.status,
  };
}

function guestFromRow(row) {
  const source = String(row.document ?? "");
  return {
    id: row.id,
    tenantId: row.tenant_id,
    propertyId: row.property_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    documentMasked: `${"*".repeat(Math.max(8, source.length - 2))}${source.slice(-2)}`,
  };
}

function reservationFromRow(row, roomId = row.room_id) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    propertyId: row.property_id,
    guestId: row.guest_id,
    roomTypeId: row.room_type_id,
    roomId,
    checkIn: dateOnly(row.check_in),
    checkOut: dateOnly(row.check_out),
    adults: Number(row.adults),
    children: Number(row.children),
    nightlyRate: integer(row.nightly_rate_cents),
    extras: integer(row.extras_cents ?? 0),
    taxes: integer(row.taxes_cents ?? 0),
    total: integer(row.total_cents),
    status: row.status,
  };
}

function taskFromRow(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    propertyId: row.property_id,
    roomId: row.room_id,
    status: row.status,
    assignedUsername: row.assigned_username,
    assignedRole: row.assigned_role,
  };
}

function maintenanceFromRow(row) {
  return { ...taskFromRow(row), title: row.title };
}

function integrationFromRow(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    propertyId: row.property_id,
    provider: row.provider,
    status: row.status,
  };
}

function auditFromRow(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    propertyId: row.property_id,
    action: row.action,
    entityId: row.entity_id,
    actor: row.actor,
    changes: row.changes,
    createdAt: row.created_at,
  };
}

function photoFromRow(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    propertyId: row.property_id,
    roomId: row.room_id,
    kind: row.kind,
    imageDataUrl: row.image_data_url,
    note: row.note ?? "",
    actor: row.actor ?? {},
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

function credentialFromRow(row) {
  if (!row) return null;
  return {
    tenantId: row.tenant_id,
    propertyId: row.property_id,
    username: row.username,
    role: row.role,
    passwordHash: row.password_hash,
    sessionVersion: Number(row.session_version),
    failedAttempts: Number(row.failed_attempts),
    lockedUntil: row.locked_until instanceof Date ? row.locked_until.toISOString() : row.locked_until,
    forceChange: Boolean(row.force_change),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

function conflictError() {
  const error = new Error("No inventory is available for this stay");
  error.code = "INVENTORY_CONFLICT";
  return error;
}

function normalizeIdempotencyKey(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new RangeError("idempotencyKey cannot be empty");
  }
  return value.trim();
}

function reservationResult(reservation, replayed, includeReplayMetadata) {
  return includeReplayMetadata ? { reservation, replayed } : reservation;
}

function createPostgresStore({ pool, idFactory = randomUUID, now = () => new Date() } = {}) {
  if (!pool || typeof pool.query !== "function") {
    throw new TypeError("pool must provide query");
  }
  if (typeof now !== "function") throw new TypeError("now must be a function");

  async function scopedProperty(executor, tenantId, propertyId) {
    const result = await executor.query(
      `SELECT id, tenant_id, name, slug, time_zone
         FROM properties
        WHERE tenant_id = $1 AND id = $2`,
      [tenantId, propertyId],
    );
    return result.rows[0] ?? null;
  }

  async function insertAudit(executor, { tenantId, propertyId, action, entityId, actor, changes }) {
    await executor.query(
      `INSERT INTO audit_events (id, tenant_id, property_id, action, entity_id, actor, changes)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)`,
      [idFactory(), tenantId, propertyId, action, entityId, JSON.stringify(actor ?? { id: "system" }), JSON.stringify(changes ?? {})],
    );
  }

  return {
    async health() {
      await pool.query("SELECT 1 AS ok");
      return { ok: true, store: "postgres", persistence: "postgresql" };
    },

    async getPublicPropertyBySlug(slug) {
      const result = await pool.query(
        `SELECT id, tenant_id, name, slug, time_zone
           FROM properties
          WHERE slug = $1`,
        [slug],
      );
      return propertyFromRow(result.rows[0]);
    },

    async findAvailability({ propertySlug, checkIn, checkOut, adults = 1, children = 0 }) {
      const range = parseStayRange({ checkIn, checkOut });
      const propertyResult = await pool.query(
        `SELECT id, tenant_id, name, slug, time_zone FROM properties WHERE slug = $1`,
        [propertySlug],
      );
      const propertyRow = propertyResult.rows[0];
      if (!propertyRow) return null;
      const result = await pool.query(
        `SELECT rt.id, rt.tenant_id, rt.property_id, rt.name, rt.capacity, rt.nightly_rate_cents,
                COALESCE(array_agg(r.id ORDER BY r.number) FILTER (WHERE r.id IS NOT NULL), '{}') AS available_room_ids
           FROM room_types rt
           LEFT JOIN rooms r
             ON r.tenant_id = rt.tenant_id AND r.property_id = rt.property_id
            AND r.room_type_id = rt.id AND r.status IN ('available', 'inspected')
            AND NOT EXISTS (
              SELECT 1 FROM reservation_rooms rr
              JOIN reservations rv
                ON rv.tenant_id = rr.tenant_id AND rv.property_id = rr.property_id AND rv.id = rr.reservation_id
             WHERE rr.tenant_id = r.tenant_id AND rr.property_id = r.property_id AND rr.room_id = r.id
               AND rv.status IN ('confirmed', 'checked_in')
               AND rv.check_in < $4::date AND $3::date < rv.check_out
            )
          WHERE rt.tenant_id = $1 AND rt.property_id = $2 AND rt.capacity >= $5
          GROUP BY rt.id, rt.tenant_id, rt.property_id, rt.name, rt.capacity, rt.nightly_rate_cents
          ORDER BY rt.name`,
        [propertyRow.tenant_id, propertyRow.id, checkIn, checkOut, adults + children],
      );
      const roomTypes = result.rows.map((row) => {
        const availableRoomIds = row.available_room_ids ?? [];
        const roomType = roomTypeFromRow(row);
        const total = roomType.nightlyRate * range.nights;
        if (!Number.isSafeInteger(total)) throw new RangeError("stay total cents exceed the safe integer range");
        return {
          ...roomType,
          availableUnits: availableRoomIds.length,
          availableRoomIds,
          total,
        };
      });
      return { property: propertyFromRow(propertyRow), ...range, adults, children, roomTypes };
    },

    async getBootstrap({ tenantId, propertyId }) {
      const propertyRow = await scopedProperty(pool, tenantId, propertyId);
      if (!propertyRow) return null;
      const values = [tenantId, propertyId];
      const [types, roomsResult, photosResult, guests, reservations, housekeeping, maintenance, integrations] = await Promise.all([
        pool.query(`SELECT * FROM room_types WHERE tenant_id = $1 AND property_id = $2 ORDER BY name`, values),
        pool.query(`SELECT * FROM rooms WHERE tenant_id = $1 AND property_id = $2 ORDER BY number`, values),
        pool.query(`SELECT * FROM room_photos WHERE tenant_id = $1 AND property_id = $2 ORDER BY created_at DESC`, values),
        pool.query(`SELECT id, tenant_id, property_id, name, email, phone, document FROM guests WHERE tenant_id = $1 AND property_id = $2 ORDER BY name`, values),
        pool.query(`SELECT rv.*, rr.room_id FROM reservations rv LEFT JOIN reservation_rooms rr ON rr.tenant_id = rv.tenant_id AND rr.property_id = rv.property_id AND rr.reservation_id = rv.id WHERE rv.tenant_id = $1 AND rv.property_id = $2 ORDER BY rv.check_in, rv.id`, values),
        pool.query(`SELECT * FROM housekeeping_tasks WHERE tenant_id = $1 AND property_id = $2 ORDER BY created_at`, values),
        pool.query(`SELECT * FROM maintenance_orders WHERE tenant_id = $1 AND property_id = $2 ORDER BY created_at`, values),
        pool.query(`SELECT id, tenant_id, property_id, provider, status FROM integration_connections WHERE tenant_id = $1 AND property_id = $2 ORDER BY provider`, values),
      ]);
      const photosByRoom = new Map();
      for (const photoRow of photosResult.rows) {
        const photo = photoFromRow(photoRow);
        const list = photosByRoom.get(photo.roomId) ?? [];
        list.push(photo);
        photosByRoom.set(photo.roomId, list);
      }
      const roomRows = roomsResult.rows.map((row) => {
        const room = roomFromRow(row);
        const photos = photosByRoom.get(room.id) ?? [];
        return {
          ...room,
          photoUrl: photos.find((photo) => photo.kind === "room")?.imageDataUrl ?? "",
          deliveryPhotos: photos.filter((photo) => photo.kind === "delivery"),
        };
      });
      const reservationRows = reservations.rows.map((row) => reservationFromRow(row));
      return {
        property: propertyFromRow(propertyRow),
        roomTypes: types.rows.map(roomTypeFromRow),
        rooms: roomRows,
        guests: guests.rows.map(guestFromRow),
        reservations: reservationRows,
        housekeepingTasks: housekeeping.rows.map(taskFromRow),
        maintenanceOrders: maintenance.rows.map(maintenanceFromRow),
        integrations: integrations.rows.map(integrationFromRow),
        summary: buildOperationalSummary({
          rooms: roomRows.map((room) => ({ ...room, status: SUMMARY_ROOM_STATUS[room.status] ?? room.status })),
          reservations: reservationRows,
          now: new Date(),
          timeZone: propertyRow.time_zone,
        }),
      };
    },

    async listReservations({ tenantId, propertyId }) {
      if (!await scopedProperty(pool, tenantId, propertyId)) return [];
      const result = await pool.query(
        `SELECT rv.*, rr.room_id FROM reservations rv
          LEFT JOIN reservation_rooms rr ON rr.tenant_id = rv.tenant_id AND rr.property_id = rv.property_id AND rr.reservation_id = rv.id
         WHERE rv.tenant_id = $1 AND rv.property_id = $2 ORDER BY rv.check_in, rv.id`,
        [tenantId, propertyId],
      );
      return result.rows.map((row) => reservationFromRow(row));
    },

    async listAuditEvents({ tenantId, propertyId }) {
      if (!await scopedProperty(pool, tenantId, propertyId)) return [];
      const result = await pool.query(
        `SELECT id, tenant_id, property_id, action, entity_id, actor, changes, created_at
           FROM audit_events WHERE tenant_id = $1 AND property_id = $2 ORDER BY created_at DESC, id DESC`,
        [tenantId, propertyId],
      );
      return result.rows.map(auditFromRow);
    },

    async createReservation({
      tenantId, propertyId, input, idempotencyKey, actor, includeReplayMetadata = false,
    }) {
      const key = normalizeIdempotencyKey(idempotencyKey);
      const client = await pool.connect();
      let idempotencyConflict = false;
      try {
        await client.query("BEGIN");
        await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`${tenantId}:${propertyId}`]);
        const existing = await client.query(
          `SELECT response FROM idempotency_keys WHERE tenant_id = $1 AND property_id = $2 AND key = $3`,
          [tenantId, propertyId, key],
        );
        if (existing.rows[0]) {
          await client.query("COMMIT");
          return reservationResult(existing.rows[0].response, true, includeReplayMetadata);
        }

        const propertyRow = await scopedProperty(client, tenantId, propertyId);
        if (!propertyRow) {
          await client.query("ROLLBACK");
          return null;
        }

        const typeResult = await client.query(
          `SELECT id, tenant_id, property_id, name, capacity, nightly_rate_cents
             FROM room_types
            WHERE tenant_id = $1 AND property_id = $2 AND id = $3`,
          [tenantId, propertyId, input.roomTypeId],
        );
        const roomType = typeResult.rows[0];
        if (!roomType) throw new RangeError("roomTypeId is unknown");
        const validated = validateReservationInput({ ...input, nightlyRate: integer(roomType.nightly_rate_cents) });
        if (validated.adults + validated.children > Number(roomType.capacity)) throw conflictError();

        const roomResult = await client.query(
          `SELECT r.id
             FROM rooms r
            WHERE r.tenant_id = $1 AND r.property_id = $2 AND r.room_type_id = $3
              AND r.status IN ('available', 'inspected')
              AND NOT EXISTS (
                SELECT 1 FROM reservation_rooms rr
                JOIN reservations rv
                  ON rv.tenant_id = rr.tenant_id AND rv.property_id = rr.property_id AND rv.id = rr.reservation_id
               WHERE rr.tenant_id = r.tenant_id AND rr.property_id = r.property_id AND rr.room_id = r.id
                 AND rv.status IN ('confirmed', 'checked_in')
                 AND rv.check_in < $5::date AND $4::date < rv.check_out
              )
            ORDER BY r.number
            FOR UPDATE SKIP LOCKED
            LIMIT 1`,
          [tenantId, propertyId, roomType.id, validated.checkIn, validated.checkOut],
        );
        const roomId = roomResult.rows[0]?.id;
        if (!roomId) throw conflictError();

        const guestId = idFactory();
        await client.query(
          `INSERT INTO guests (id, tenant_id, property_id, name, email, phone, document)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [guestId, tenantId, propertyId, validated.guestName, input.guestEmail ?? null, input.guestPhone ?? null, input.document ?? input.cpf ?? null],
        );
        const reservationId = idFactory();
        const inserted = await client.query(
          `INSERT INTO reservations
             (id, tenant_id, property_id, guest_id, room_type_id, check_in, check_out, adults, children,
              nightly_rate_cents, extras_cents, taxes_cents, total_cents, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'confirmed')
           RETURNING *`,
          [reservationId, tenantId, propertyId, guestId, roomType.id, validated.checkIn, validated.checkOut,
            validated.adults, validated.children, validated.nightlyRate, validated.extras, validated.taxes, validated.total],
        );
        await client.query(
          `INSERT INTO reservation_rooms (id, tenant_id, property_id, reservation_id, room_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [idFactory(), tenantId, propertyId, reservationId, roomId],
        );
        const reservation = reservationFromRow(inserted.rows[0], roomId);
        await insertAudit(client, { tenantId, propertyId, action: "reservation.created", entityId: reservationId, actor });
        try {
          await client.query(
            `INSERT INTO idempotency_keys (id, tenant_id, property_id, key, response)
             VALUES ($1, $2, $3, $4, $5::jsonb)`,
            [idFactory(), tenantId, propertyId, key, JSON.stringify(reservation)],
          );
        } catch (error) {
          idempotencyConflict = error.code === "23505";
          throw error;
        }
        await client.query("COMMIT");
        return reservationResult(reservation, false, includeReplayMetadata);
      } catch (error) {
        try { await client.query("ROLLBACK"); } catch {}
        if (idempotencyConflict) {
          const existing = await client.query(
            `SELECT response FROM idempotency_keys WHERE tenant_id = $1 AND property_id = $2 AND key = $3`,
            [tenantId, propertyId, key],
          );
          if (existing.rows[0]) {
            return reservationResult(existing.rows[0].response, true, includeReplayMetadata);
          }
        }
        if (error.code === "40001" || error.code === "40P01" || error.code === "23P01") throw conflictError();
        throw error;
      } finally {
        client.release();
      }
    },

    async createWalkIn({ tenantId, propertyId, input, actor }) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`${tenantId}:${propertyId}`]);
        const propertyRow = await scopedProperty(client, tenantId, propertyId);
        if (!propertyRow) {
          await client.query("COMMIT");
          return null;
        }

        const roomId = typeof input?.roomId === "string" ? input.roomId.trim() : "";
        const roomResult = await client.query(
          `SELECT r.*, rt.nightly_rate_cents, rt.capacity
             FROM rooms r
             JOIN room_types rt
               ON rt.tenant_id = r.tenant_id AND rt.property_id = r.property_id AND rt.id = r.room_type_id
            WHERE r.tenant_id = $1 AND r.property_id = $2 AND r.id = $3
            FOR UPDATE OF r`,
          [tenantId, propertyId, roomId],
        );
        const room = roomResult.rows[0];
        if (!room) {
          await client.query("COMMIT");
          return null;
        }
        const checkedInResult = await client.query(
          `SELECT rv.id
             FROM reservation_rooms rr
             JOIN reservations rv
               ON rv.tenant_id = rr.tenant_id AND rv.property_id = rr.property_id
              AND rv.id = rr.reservation_id
            WHERE rr.tenant_id = $1 AND rr.property_id = $2 AND rr.room_id = $3
              AND rv.status = 'checked_in'
            LIMIT 1`,
          [tenantId, propertyId, roomId],
        );
        validateCheckInRoom({
          roomStatus: room.status,
          hasCheckedInReservation: Boolean(checkedInResult.rows[0]),
        });
        const checkIn = operationalDate(now(), propertyRow.time_zone);
        const validated = validateReservationInput({
          ...input,
          roomTypeId: room.room_type_id,
          checkIn,
          checkOut: input?.checkOut || addDays(checkIn, 1),
          nightlyRate: integer(room.nightly_rate_cents),
        });
        if (validated.adults + validated.children > Number(room.capacity)) throw conflictError();
        const overlap = await client.query(
          `SELECT 1
             FROM reservation_rooms rr
             JOIN reservations rv
               ON rv.tenant_id = rr.tenant_id AND rv.property_id = rr.property_id
              AND rv.id = rr.reservation_id
            WHERE rr.tenant_id = $1 AND rr.property_id = $2 AND rr.room_id = $3
              AND rv.status IN ('confirmed', 'checked_in')
              AND rv.check_in < $5::date AND $4::date < rv.check_out
            LIMIT 1`,
          [tenantId, propertyId, roomId, validated.checkIn, validated.checkOut],
        );
        if (overlap.rows[0]) throw conflictError();

        const guestId = idFactory();
        await client.query(
          `INSERT INTO guests (id, tenant_id, property_id, name, email, phone, document)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [guestId, tenantId, propertyId, validated.guestName, input.guestEmail ?? null, input.guestPhone ?? null, input.document ?? input.cpf ?? null],
        );
        const reservationId = idFactory();
        const inserted = await client.query(
          `INSERT INTO reservations
             (id, tenant_id, property_id, guest_id, room_type_id, check_in, check_out, adults, children,
              nightly_rate_cents, extras_cents, taxes_cents, total_cents, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'checked_in')
           RETURNING *`,
          [reservationId, tenantId, propertyId, guestId, room.room_type_id, validated.checkIn, validated.checkOut,
            validated.adults, validated.children, validated.nightlyRate, validated.extras, validated.taxes, validated.total],
        );
        await client.query(
          `INSERT INTO reservation_rooms (id, tenant_id, property_id, reservation_id, room_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [idFactory(), tenantId, propertyId, reservationId, roomId],
        );
        await client.query(
          `UPDATE rooms
              SET status = 'occupied', updated_at = now()
            WHERE tenant_id = $1 AND property_id = $2 AND id = $3`,
          [tenantId, propertyId, roomId],
        );
        await insertAudit(client, {
          tenantId,
          propertyId,
          action: "walkin.created",
          entityId: reservationId,
          actor,
          changes: { roomId },
        });
        await client.query("COMMIT");
        return { ...reservationFromRow(inserted.rows[0], roomId), source: "frontdesk" };
      } catch (error) {
        try { await client.query("ROLLBACK"); } catch {}
        throw error;
      } finally {
        client.release();
      }
    },

    async addRoomPhoto({ tenantId, propertyId, roomId, kind = "delivery", imageDataUrl, note = "", actor }) {
      const normalizedKind = String(kind ?? "").trim().toLowerCase();
      if (!ROOM_PHOTO_KINDS.has(normalizedKind)) throw new RangeError("room photo kind is unknown");
      if (!isValidImageDataUrl(imageDataUrl)) throw new RangeError("room photo image is invalid");
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const roomResult = await client.query(
          `SELECT id, status
             FROM rooms
            WHERE tenant_id = $1 AND property_id = $2 AND id = $3
            FOR UPDATE`,
          [tenantId, propertyId, roomId],
        );
        if (!roomResult.rows[0]) {
          await client.query("COMMIT");
          return null;
        }
        const photoId = idFactory();
        const inserted = await client.query(
          `INSERT INTO room_photos (id, tenant_id, property_id, room_id, kind, image_data_url, note, actor)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
           RETURNING *`,
          [
            photoId,
            tenantId,
            propertyId,
            roomId,
            normalizedKind,
            imageDataUrl,
            String(note ?? "").trim().slice(0, 240) || null,
            JSON.stringify(actor ?? { id: "system" }),
          ],
        );
        if (normalizedKind === "delivery" && !["occupied", "maintenance", "blocked"].includes(roomResult.rows[0].status)) {
          await client.query(
            `UPDATE rooms
                SET status = 'inspected', updated_at = now()
              WHERE tenant_id = $1 AND property_id = $2 AND id = $3`,
            [tenantId, propertyId, roomId],
          );
          await client.query(
            `UPDATE housekeeping_tasks
                SET status = 'done', updated_at = now()
              WHERE tenant_id = $1 AND property_id = $2 AND room_id = $3
                AND status <> 'cancelled'`,
            [tenantId, propertyId, roomId],
          );
        }
        await insertAudit(client, {
          tenantId,
          propertyId,
          action: `room.photo_${normalizedKind}.created`,
          entityId: roomId,
          actor,
          changes: { photoId },
        });
        await client.query("COMMIT");
        return photoFromRow(inserted.rows[0]);
      } catch (error) {
        try { await client.query("ROLLBACK"); } catch {}
        throw error;
      } finally {
        client.release();
      }
    },

    async updateReservationStatus({ tenantId, propertyId, reservationId, status, actor }) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const currentResult = await client.query(
          `SELECT rv.*, rr.room_id, p.time_zone
             FROM reservations rv
             JOIN properties p
               ON p.tenant_id = rv.tenant_id AND p.id = rv.property_id
             LEFT JOIN reservation_rooms rr
               ON rr.tenant_id = rv.tenant_id AND rr.property_id = rv.property_id
              AND rr.reservation_id = rv.id
            WHERE rv.tenant_id = $1 AND rv.property_id = $2 AND rv.id = $3
            FOR UPDATE OF rv`,
          [tenantId, propertyId, reservationId],
        );
        const current = currentResult.rows[0];
        if (!current) {
          await client.query("COMMIT");
          return null;
        }
        const next = validateReservationTransition(current.status, status);
        if (next === current.status) {
          await client.query("COMMIT");
          return reservationFromRow(current);
        }
        if (next === "checked_in") {
          validateCheckInEligibility({
            checkIn: dateOnly(current.check_in),
            checkOut: dateOnly(current.check_out),
            operationalDate: operationalDate(now(), current.time_zone),
          });
          const roomResult = await client.query(
            `SELECT id, status
               FROM rooms
              WHERE tenant_id = $1 AND property_id = $2 AND id = $3
              FOR UPDATE`,
            [tenantId, propertyId, current.room_id],
          );
          const checkedInResult = await client.query(
            `SELECT rv.id
               FROM reservation_rooms rr
               JOIN reservations rv
                 ON rv.tenant_id = rr.tenant_id AND rv.property_id = rr.property_id
                AND rv.id = rr.reservation_id
              WHERE rr.tenant_id = $1 AND rr.property_id = $2 AND rr.room_id = $3
                AND rv.status = 'checked_in' AND rv.id <> $4
              LIMIT 1`,
            [tenantId, propertyId, current.room_id, reservationId],
          );
          validateCheckInRoom({
            roomStatus: roomResult.rows[0]?.status,
            hasCheckedInReservation: Boolean(checkedInResult.rows[0]),
          });
        }
        const updated = await client.query(
          `UPDATE reservations
              SET status = $4, updated_at = now()
            WHERE tenant_id = $1 AND property_id = $2 AND id = $3
          RETURNING *`,
          [tenantId, propertyId, reservationId, next],
        );
        const roomStatus = next === "checked_in" ? "occupied" : next === "checked_out" ? "dirty" : null;
        if (current.room_id && roomStatus) {
          await client.query(
            `UPDATE rooms
                SET status = $4, updated_at = now()
              WHERE tenant_id = $1 AND property_id = $2 AND id = $3
            RETURNING id, status`,
            [tenantId, propertyId, current.room_id, roomStatus],
          );
        }
        await insertAudit(client, {
          tenantId,
          propertyId,
          action: "reservation.status_updated",
          entityId: reservationId,
          actor,
          changes: { from: current.status, to: next, roomId: current.room_id },
        });
        await client.query("COMMIT");
        return reservationFromRow(updated.rows[0], current.room_id);
      } catch (error) {
        try { await client.query("ROLLBACK"); } catch {}
        throw error;
      } finally {
        client.release();
      }
    },

    async updateRoomStatus({ tenantId, propertyId, roomId, status, actor }) {
      const normalized = typeof status === "string" ? status.trim().toLowerCase() : "";
      if (!ROOM_STATUSES.has(normalized)) throw new RangeError("room status is unknown");
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await client.query(
          `WITH current AS (
             SELECT status AS previous_status FROM rooms
              WHERE tenant_id = $1 AND property_id = $2 AND id = $3 FOR UPDATE
           )
           UPDATE rooms
              SET status = $4, updated_at = now()
             FROM current
            WHERE tenant_id = $1 AND property_id = $2 AND id = $3
           RETURNING rooms.*, current.previous_status`,
          [tenantId, propertyId, roomId, normalized],
        );
        const row = result.rows[0];
        if (!row) {
          await client.query("COMMIT");
          return null;
        }
        await insertAudit(client, {
          tenantId, propertyId, action: "room.status_updated", entityId: roomId, actor,
          changes: { from: row.previous_status, to: normalized },
        });
        await client.query("COMMIT");
        return roomFromRow(row);
      } catch (error) {
        try { await client.query("ROLLBACK"); } catch {}
        throw error;
      } finally {
        client.release();
      }
    },

    async getUserByEmail(email) {
      if (typeof email !== "string") return null;
      const result = await pool.query(
        `SELECT id, name, email FROM users WHERE lower(email) = lower($1)`,
        [email.trim()],
      );
      const user = result.rows[0];
      if (!user) return null;
      const memberships = await pool.query(
        `SELECT id, user_id, tenant_id, property_id, role
           FROM memberships WHERE user_id = $1 ORDER BY tenant_id, property_id`,
        [user.id],
      );
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        memberships: memberships.rows.map((row) => ({
          id: row.id, userId: row.user_id, tenantId: row.tenant_id, propertyId: row.property_id, role: row.role,
        })),
      };
    },

    async getCredentialProfile({ tenantId, propertyId, username, role }) {
      const result = await pool.query(
        `SELECT tenant_id, property_id, username, role, password_hash, session_version,
                failed_attempts, locked_until, force_change, updated_at
           FROM credential_profiles
          WHERE tenant_id = $1 AND property_id = $2 AND username = $3 AND role = $4`,
        [tenantId, propertyId, String(username ?? "").trim().toLowerCase(), String(role ?? "").trim().toLowerCase()],
      );
      return credentialFromRow(result.rows[0]);
    },

    async upsertCredentialProfile(profile) {
      const result = await pool.query(
        `INSERT INTO credential_profiles
           (tenant_id, property_id, username, role, password_hash, session_version,
            failed_attempts, locked_until, force_change, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (tenant_id, property_id, username, role) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           session_version = EXCLUDED.session_version,
           failed_attempts = EXCLUDED.failed_attempts,
           locked_until = EXCLUDED.locked_until,
           force_change = EXCLUDED.force_change,
           updated_at = EXCLUDED.updated_at
         RETURNING tenant_id, property_id, username, role, password_hash, session_version,
                   failed_attempts, locked_until, force_change, updated_at`,
        [
          profile.tenantId,
          profile.propertyId,
          String(profile.username ?? "").trim().toLowerCase(),
          String(profile.role ?? "").trim().toLowerCase(),
          profile.passwordHash,
          profile.sessionVersion,
          profile.failedAttempts,
          profile.lockedUntil,
          profile.forceChange,
          profile.updatedAt,
        ],
      );
      return credentialFromRow(result.rows[0]);
    },

    async createCredentialProfileIfAbsent(profile) {
      const scope = [
        profile.tenantId,
        profile.propertyId,
        String(profile.username ?? "").trim().toLowerCase(),
        String(profile.role ?? "").trim().toLowerCase(),
      ];
      const inserted = await pool.query(
        `INSERT INTO credential_profiles
           (tenant_id, property_id, username, role, password_hash, session_version,
            failed_attempts, locked_until, force_change, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (tenant_id, property_id, username, role) DO NOTHING
         RETURNING tenant_id, property_id, username, role, password_hash, session_version,
                   failed_attempts, locked_until, force_change, updated_at`,
        [
          ...scope,
          profile.passwordHash,
          profile.sessionVersion,
          profile.failedAttempts,
          profile.lockedUntil,
          profile.forceChange,
          profile.updatedAt,
        ],
      );
      if (inserted.rows[0]) return credentialFromRow(inserted.rows[0]);
      const existing = await pool.query(
        `SELECT tenant_id, property_id, username, role, password_hash, session_version,
                failed_attempts, locked_until, force_change, updated_at
           FROM credential_profiles
          WHERE tenant_id = $1 AND property_id = $2 AND username = $3 AND role = $4`,
        scope,
      );
      return credentialFromRow(existing.rows[0]);
    },

    async updateCredentialProfile({ tenantId, propertyId, username, role, expectedSessionVersion, changes }) {
      const columns = {
        passwordHash: "password_hash",
        sessionVersion: "session_version",
        failedAttempts: "failed_attempts",
        lockedUntil: "locked_until",
        forceChange: "force_change",
        updatedAt: "updated_at",
      };
      const assignments = [];
      const values = [
        tenantId,
        propertyId,
        String(username ?? "").trim().toLowerCase(),
        String(role ?? "").trim().toLowerCase(),
      ];
      for (const [field, column] of Object.entries(columns)) {
        if (!Object.hasOwn(changes ?? {}, field)) continue;
        values.push(changes[field]);
        assignments.push(`${column} = $${values.length}`);
      }
      if (assignments.length === 0) return this.getCredentialProfile({ tenantId, propertyId, username, role });
      const compareVersion = expectedSessionVersion !== undefined && expectedSessionVersion !== null;
      if (compareVersion) values.push(expectedSessionVersion);
      const result = await pool.query(
        `UPDATE credential_profiles
            SET ${assignments.join(", ")}
          WHERE tenant_id = $1 AND property_id = $2 AND username = $3 AND role = $4
            ${compareVersion ? `AND session_version = $${values.length}` : ""}
        RETURNING tenant_id, property_id, username, role, password_hash, session_version,
                  failed_attempts, locked_until, force_change, updated_at`,
        values,
      );
      return credentialFromRow(result.rows[0]);
    },

    async setCredentialPassword({
      tenantId, propertyId, username, role, passwordHash, forceChange,
      expectedSessionVersion, updatedAt, actor, action,
    }) {
      const normalizedUsername = String(username ?? "").trim().toLowerCase();
      const normalizedRole = String(role ?? "").trim().toLowerCase();
      const scope = [tenantId, propertyId, normalizedUsername, normalizedRole];
      const compareVersion = expectedSessionVersion !== undefined && expectedSessionVersion !== null;
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = compareVersion
          ? await client.query(
            `UPDATE credential_profiles
                SET password_hash = $5,
                    session_version = session_version + 1,
                    failed_attempts = 0,
                    locked_until = NULL,
                    force_change = $6,
                    updated_at = $7
              WHERE tenant_id = $1 AND property_id = $2 AND username = $3 AND role = $4
                AND session_version = $8
            RETURNING tenant_id, property_id, username, role, password_hash, session_version,
                      failed_attempts, locked_until, force_change, updated_at`,
            [...scope, passwordHash, Boolean(forceChange), updatedAt, expectedSessionVersion],
          )
          : await client.query(
            `INSERT INTO credential_profiles
               (tenant_id, property_id, username, role, password_hash, session_version,
                failed_attempts, locked_until, force_change, updated_at)
             VALUES ($1, $2, $3, $4, $5, 1, 0, NULL, $6, $7)
             ON CONFLICT (tenant_id, property_id, username, role) DO UPDATE SET
               password_hash = EXCLUDED.password_hash,
               session_version = credential_profiles.session_version + 1,
               failed_attempts = 0,
               locked_until = NULL,
               force_change = EXCLUDED.force_change,
               updated_at = EXCLUDED.updated_at
             RETURNING tenant_id, property_id, username, role, password_hash, session_version,
                       failed_attempts, locked_until, force_change, updated_at`,
            [...scope, passwordHash, Boolean(forceChange), updatedAt],
          );
        const profile = credentialFromRow(result.rows[0]);
        if (!profile) {
          await client.query("COMMIT");
          return null;
        }
        await insertAudit(client, {
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
        await client.query("COMMIT");
        return profile;
      } catch (error) {
        try { await client.query("ROLLBACK"); } catch {}
        throw error;
      } finally {
        client.release();
      }
    },

    async recordCredentialFailure({
      tenantId, propertyId, username, role, expectedSessionVersion,
      maxFailedAttempts, lockedUntil, updatedAt,
    }) {
      const compareVersion = expectedSessionVersion !== undefined && expectedSessionVersion !== null;
      const values = [
        tenantId,
        propertyId,
        String(username ?? "").trim().toLowerCase(),
        String(role ?? "").trim().toLowerCase(),
        maxFailedAttempts,
        lockedUntil,
        updatedAt,
      ];
      if (compareVersion) values.push(expectedSessionVersion);
      const result = await pool.query(
        `UPDATE credential_profiles
            SET failed_attempts = failed_attempts + 1,
                locked_until = CASE
                  WHEN failed_attempts + 1 >= $5 THEN $6::timestamptz
                  ELSE NULL
                END,
                updated_at = $7
          WHERE tenant_id = $1 AND property_id = $2 AND username = $3 AND role = $4
            ${compareVersion ? `AND session_version = $${values.length}` : ""}
        RETURNING tenant_id, property_id, username, role, password_hash, session_version,
                  failed_attempts, locked_until, force_change, updated_at`,
        values,
      );
      return credentialFromRow(result.rows[0]);
    },
  };
}

module.exports = { createPostgresStore };
