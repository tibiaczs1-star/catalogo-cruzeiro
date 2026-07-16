"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { Pool } = require("pg");
const { createSeed } = require("./seed");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function runMigrations({ pool, connectionString = process.env.ASHOTELARIA_DATABASE_URL, bootstrap = true } = {}) {
  if (!pool && !connectionString) throw new Error("ASHOTELARIA_DATABASE_URL is required for migrations");
  const ownedPool = pool ?? new Pool({ connectionString });
  const client = await ownedPool.connect();
  try {
    await client.query("CREATE TABLE IF NOT EXISTS ashotelaria_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
    const files = (await fs.readdir(MIGRATIONS_DIR)).filter((file) => file.endsWith(".sql")).sort();
    let appliedCount = 0;
    for (const name of files) {
      await client.query("BEGIN");
      try {
        await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`ashotelaria-migration:${name}`]);
        const applied = await client.query("SELECT 1 FROM ashotelaria_migrations WHERE name = $1", [name]);
        if (applied.rowCount) {
          await client.query("COMMIT");
          continue;
        }
        const source = await fs.readFile(path.join(MIGRATIONS_DIR, name), "utf8");
        await client.query(withoutOuterTransaction(source));
        await client.query("INSERT INTO ashotelaria_migrations (name) VALUES ($1)", [name]);
        await client.query("COMMIT");
        appliedCount += 1;
      } catch (error) {
        try { await client.query("ROLLBACK"); } catch {}
        throw error;
      }
    }
    if (bootstrap) {
      await client.query("BEGIN");
      try {
        await bootstrapMinimum(client, createSeed());
        await client.query("COMMIT");
      } catch (error) {
        try { await client.query("ROLLBACK"); } catch {}
        throw error;
      }
    }
    return { applied: appliedCount };
  } finally {
    client.release();
    if (!pool) await ownedPool.end();
  }
}

function withoutOuterTransaction(sql) {
  return String(sql)
    .replace(/^\s*BEGIN\s*;\s*/i, "")
    .replace(/\s*COMMIT\s*;\s*$/i, "")
    .trim();
}

async function bootstrapMinimum(client, seed) {
  const tenant = seed.tenants.find((row) => row.id === "tenant-czs");
  const property = seed.properties.find((row) => row.slug === "hotel-jurua-palace");
  if (!tenant || !property) throw new Error("hotel-jurua-palace seed is missing");
  await client.query(
    "INSERT INTO tenants (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now()",
    [tenant.id, tenant.name],
  );
  await client.query(
    "INSERT INTO properties (id, tenant_id, name, slug, time_zone) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, time_zone = EXCLUDED.time_zone, updated_at = now()",
    [property.id, property.tenantId, property.name, property.slug, property.timeZone],
  );
  for (const type of seed.roomTypes.filter((row) => row.propertyId === property.id)) {
    await client.query(
      "INSERT INTO room_types (id, tenant_id, property_id, name, capacity, nightly_rate_cents) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, capacity = EXCLUDED.capacity, nightly_rate_cents = EXCLUDED.nightly_rate_cents, updated_at = now()",
      [type.id, type.tenantId, type.propertyId, type.name, type.capacity, type.nightlyRate],
    );
  }
  for (const room of seed.rooms.filter((row) => row.propertyId === property.id)) {
    await client.query(
      "INSERT INTO rooms (id, tenant_id, property_id, room_type_id, number, status) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET room_type_id = EXCLUDED.room_type_id, number = EXCLUDED.number, updated_at = now()",
      [room.id, room.tenantId, room.propertyId, room.roomTypeId, room.number, room.status],
    );
  }
  for (const guest of seed.guests.filter((row) => row.propertyId === property.id)) {
    await client.query(
      "INSERT INTO guests (id, tenant_id, property_id, name, email, phone, document) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, document = EXCLUDED.document, updated_at = now()",
      [guest.id, guest.tenantId, guest.propertyId, guest.name, guest.email ?? null, guest.phone ?? null, guest.document ?? null],
    );
  }
  for (const reservation of seed.reservations.filter((row) => row.propertyId === property.id)) {
    await client.query(
      `INSERT INTO reservations
        (id, tenant_id, property_id, guest_id, room_type_id, check_in, check_out, adults, children,
         nightly_rate_cents, extras_cents, taxes_cents, total_cents, status, guest_access_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, 0, $11, $12, $13)
       ON CONFLICT (id) DO UPDATE SET guest_access_code = COALESCE(reservations.guest_access_code, EXCLUDED.guest_access_code)`,
      [reservation.id, reservation.tenantId, reservation.propertyId, reservation.guestId,
        reservation.roomTypeId, reservation.checkIn, reservation.checkOut, reservation.adults,
        reservation.children, reservation.nightlyRate, reservation.total, reservation.status, reservation.accessCode ?? null],
    );
    await client.query(
      "INSERT INTO reservation_rooms (id, tenant_id, property_id, reservation_id, room_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING",
      [`reservation-room-${reservation.id}`, reservation.tenantId, reservation.propertyId, reservation.id, reservation.roomId],
    );
  }
  for (const task of seed.housekeepingTasks.filter((row) => row.propertyId === property.id)) {
    await client.query(
      `INSERT INTO housekeeping_tasks
        (id, tenant_id, property_id, room_id, status, assigned_username, assigned_role,
         task_type, reservation_id, scheduled_date, away_from, away_until, note, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10::date, CURRENT_DATE), $11, $12, $13, $14)
       ON CONFLICT (id) DO UPDATE
        SET room_id = EXCLUDED.room_id,
            assigned_username = EXCLUDED.assigned_username,
            assigned_role = EXCLUDED.assigned_role,
            task_type = EXCLUDED.task_type,
            reservation_id = EXCLUDED.reservation_id,
            scheduled_date = EXCLUDED.scheduled_date,
            source = EXCLUDED.source,
            updated_at = now()`,
      [task.id, task.tenantId, task.propertyId, task.roomId, task.status, task.assignedUsername ?? null, task.assignedRole ?? null,
        task.taskType ?? "daily_cleaning", task.reservationId ?? null, task.scheduledDate ?? null, task.awayFrom ?? null, task.awayUntil ?? null,
        task.note ?? null, task.source ?? "system"],
    );
  }
  for (const partner of seed.clientPartners.filter((row) => row.propertyId === property.id)) {
    await client.query(
      `INSERT INTO client_partners (id, tenant_id, property_id, name, category, discount_label, contact, description, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, discount_label = EXCLUDED.discount_label, contact = EXCLUDED.contact, description = EXCLUDED.description, active = true, updated_at = now()`,
      [partner.id, partner.tenantId, partner.propertyId, partner.name, partner.category, partner.discountLabel, partner.contact, partner.description],
    );
  }
  for (const item of seed.foodMenu.filter((row) => row.propertyId === property.id)) {
    await client.query(
      `INSERT INTO food_menu (id, tenant_id, property_id, partner_id, name, category, price_cents, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       ON CONFLICT (id) DO UPDATE SET partner_id = EXCLUDED.partner_id, name = EXCLUDED.name, category = EXCLUDED.category, price_cents = EXCLUDED.price_cents, active = true, updated_at = now()`,
      [item.id, item.tenantId, item.propertyId, item.partnerId ?? null, item.name, item.category, item.price],
    );
  }
  for (const order of seed.maintenanceOrders.filter((row) => row.propertyId === property.id)) {
    await client.query(
      "INSERT INTO maintenance_orders (id, tenant_id, property_id, room_id, title, status) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET room_id = EXCLUDED.room_id, title = EXCLUDED.title, updated_at = now()",
      [order.id, order.tenantId, order.propertyId, order.roomId, order.title, order.status],
    );
  }
  for (const integration of seed.integrations.filter((row) => row.propertyId === property.id)) {
    await client.query(
      "INSERT INTO integration_connections (id, tenant_id, property_id, provider, status) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET provider = EXCLUDED.provider, status = EXCLUDED.status, updated_at = now()",
      [integration.id, integration.tenantId, integration.propertyId, integration.provider, integration.status],
    );
  }
}

if (require.main === module) {
  runMigrations().then((result) => {
    process.stdout.write(`${JSON.stringify({ ok: true, ...result })}\n`);
  }).catch((error) => {
    process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
    process.exitCode = 1;
  });
}

module.exports = { runMigrations, bootstrapMinimum };
