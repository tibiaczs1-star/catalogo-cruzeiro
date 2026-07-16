"use strict";

const { Readable } = require("node:stream");
const test = require("node:test");
const assert = require("node:assert/strict");

const { createMemoryStore } = require("../memory-store");
const { createSeed } = require("../seed");
const { createAuthService } = require("../auth");
const { createASHotelariaHandler } = require("../http");

const BASE = "/api/ashotelaria/v1";
const SESSION_SECRET = "http-test-session-secret-is-long-enough-123456";

function fixture(options = {}) {
  const store = options.store ?? createMemoryStore();
  const authService = options.authService ?? createAuthService({
    store,
    config: {
      sessionSecret: SESSION_SECRET,
      sessionTtlSeconds: 3600,
      environment: {
        ASHOTELARIA_ADMIN_PASSWORD: "Admin-inicial-2026!",
        ASHOTELARIA_FINANCE_PASSWORD: "Financeiro-inicial-2026!",
        ASHOTELARIA_RECEPTION_PASSWORD: "Recepcao-inicial-2026!",
        ASHOTELARIA_DEFAULT_PASSWORD: "Padrao-inicial-2026!",
      },
    },
  });
  const handler = createASHotelariaHandler({
    store,
    authService,
    config: { production: false, ...options.config },
  });
  return { store, authService, handler };
}

function fakeRequest(method, url, { headers = {}, body, remoteAddress = "127.0.0.1" } = {}) {
  const serialized = body === undefined
    ? ""
    : typeof body === "string" || Buffer.isBuffer(body)
      ? body
      : JSON.stringify(body);
  const req = Readable.from(serialized === "" ? [] : [serialized]);
  req.method = method;
  req.url = url;
  req.headers = Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
  req.socket = { remoteAddress };
  return req;
}

function fakeResponse() {
  const headers = new Map();
  let body = Buffer.alloc(0);
  let ended = false;
  return {
    statusCode: 200,
    setHeader(name, value) { headers.set(String(name).toLowerCase(), value); },
    getHeader(name) { return headers.get(String(name).toLowerCase()); },
    end(chunk) {
      if (chunk !== undefined) body = Buffer.concat([body, Buffer.from(chunk)]);
      ended = true;
    },
    get ended() { return ended; },
    get text() { return body.toString("utf8"); },
    get json() { return body.length ? JSON.parse(body.toString("utf8")) : null; },
  };
}

async function request(handler, method, url, options = {}) {
  const headers = { host: "hotel.test", ...options.headers };
  if (options.body !== undefined && !Object.keys(headers).some((key) => key.toLowerCase() === "content-type")) {
    headers["content-type"] = "application/json";
  }
  const req = fakeRequest(method, url, { ...options, headers });
  const res = fakeResponse();
  const handled = await handler(req, res);
  return { handled, res };
}

async function login(handler, role, password, { completeInitialChange = true } = {}) {
  const loginRequest = (candidate) => request(handler, "POST", `${BASE}/auth/login`, {
    body: { propertySlug: "hotel-jurua-palace", username: "admin", role, password: candidate },
  });
  let result = await loginRequest(password);
  assert.equal(result.res.statusCode, 200, result.res.text);
  let cookie = String(result.res.getHeader("set-cookie")).split(";")[0];
  if (completeInitialChange && result.res.json.session.forceChange) {
    const activePassword = `Ativa-${role}-2026!`;
    const changed = await request(handler, "POST", `${BASE}/auth/change-password`, {
      headers: { cookie },
      body: { currentPassword: password, newPassword: activePassword },
    });
    assert.equal(changed.res.statusCode, 200, changed.res.text);
    result = await loginRequest(activePassword);
    assert.equal(result.res.statusCode, 200, result.res.text);
    cookie = String(result.res.getHeader("set-cookie")).split(";")[0];
  }
  return cookie;
}

test("returns false outside the AShotelaria API and serves health with a correlation id", async () => {
  const { handler } = fixture();
  const outside = await request(handler, "GET", "/api/other");
  assert.equal(outside.handled, false);
  assert.equal(outside.res.ended, false);

  const health = await request(handler, "GET", `${BASE}/health`, {
    headers: { "x-correlation-id": "hotel-check-123" },
  });
  assert.equal(health.handled, true);
  assert.equal(health.res.statusCode, 200);
  assert.equal(health.res.json.ok, true);
  assert.equal(health.res.getHeader("x-correlation-id"), "hotel-check-123");
  assert.equal(health.res.getHeader("cache-control"), "no-store");
});

test("public property and availability routes remain unauthenticated and same-origin only", async () => {
  const { handler } = fixture();
  const property = await request(handler, "GET", `${BASE}/public/properties/hotel-jurua-palace`);
  assert.equal(property.res.statusCode, 200);
  assert.equal(property.res.json.property.name, "Hotel Juruá Palace");

  const availability = await request(
    handler,
    "GET",
    `${BASE}/public/availability?propertySlug=hotel-jurua-palace&checkIn=2026-09-01&checkOut=2026-09-03&adults=2&children=0`,
  );
  assert.equal(availability.res.statusCode, 200);
  assert.equal(availability.res.json.availability.nights, 2);

  const crossOrigin = await request(handler, "GET", `${BASE}/health`, {
    headers: { origin: "https://evil.example" },
  });
  assert.equal(crossOrigin.res.statusCode, 403);
  assert.equal(crossOrigin.res.json.error.code, "CROSS_ORIGIN_FORBIDDEN");
});

test("public reservation requires JSON and idempotency and repeats the stored result", async () => {
  const { handler, store, authService } = fixture();
  const body = {
    propertySlug: "hotel-jurua-palace",
    roomTypeId: "room-type-standard-jurua",
    checkIn: "2026-09-01",
    checkOut: "2026-09-03",
    adults: 2,
    children: 0,
    guestName: "Maria da Silva",
    guestEmail: "maria@example.com",
  };
  const unsupported = await request(handler, "POST", `${BASE}/public/reservations`, {
    headers: { "content-type": "text/plain", "idempotency-key": "public-001" },
    body: JSON.stringify(body),
  });
  assert.equal(unsupported.res.statusCode, 415);

  const missingKey = await request(handler, "POST", `${BASE}/public/reservations`, { body });
  assert.equal(missingKey.res.statusCode, 400);

  const first = await request(handler, "POST", `${BASE}/public/reservations`, {
    headers: { "idempotency-key": "public-001" }, body,
  });
  const restartedHandler = createASHotelariaHandler({ store, authService, config: { production: false } });
  const repeated = await request(restartedHandler, "POST", `${BASE}/public/reservations`, {
    headers: { "idempotency-key": "public-001" }, body: { ...body, guestName: "Outra pessoa" },
  });
  assert.equal(first.res.statusCode, 201);
  assert.equal(repeated.res.statusCode, 200);
  assert.deepEqual(repeated.res.json.reservation, first.res.json.reservation);
});

test("rejects JSON bodies over 64KB before route logic", async () => {
  const { handler } = fixture();
  const oversized = await request(handler, "POST", `${BASE}/auth/login`, {
    body: { propertySlug: "hotel-jurua-palace", username: "admin", role: "recepcionista", password: "x".repeat(66 * 1024) },
  });
  assert.equal(oversized.res.statusCode, 413);
  assert.equal(oversized.res.json.error.code, "PAYLOAD_TOO_LARGE");
});

test("login sets a hardened cookie and session/logout never return the token", async () => {
  const { store, authService } = fixture();
  const handler = createASHotelariaHandler({ store, authService, config: { production: true } });
  const loggedIn = await request(handler, "POST", `${BASE}/auth/login`, {
    body: {
      propertySlug: "hotel-jurua-palace", username: "admin", role: "recepcionista",
      password: "Recepcao-inicial-2026!",
    },
  });
  assert.equal(loggedIn.res.statusCode, 200, loggedIn.res.text);
  const setCookie = String(loggedIn.res.getHeader("set-cookie"));
  assert.match(setCookie, /^ashotelaria_session=/);
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /Secure/);
  assert.match(setCookie, /SameSite=Lax/);
  assert.equal(Object.hasOwn(loggedIn.res.json, "token"), false);

  const cookie = setCookie.split(";")[0];
  const session = await request(handler, "GET", `${BASE}/auth/session`, { headers: { cookie } });
  assert.equal(session.res.statusCode, 200);
  assert.equal(session.res.json.session.role, "recepcionista");
  assert.equal(JSON.stringify(session.res.json).includes("password"), false);

  const logout = await request(handler, "POST", `${BASE}/auth/logout`, { headers: { cookie }, body: {} });
  assert.equal(logout.res.statusCode, 204);
  assert.match(String(logout.res.getHeader("set-cookie")), /Max-Age=0/);
});

test("forceChange blocks every operational route until the initial password is changed", async () => {
  const { handler } = fixture();
  const initialCookie = await login(handler, "administrador", "Admin-inicial-2026!", { completeInitialChange: false });
  const headers = { cookie: initialCookie };

  const session = await request(handler, "GET", `${BASE}/auth/session`, { headers });
  assert.equal(session.res.statusCode, 200);
  for (const [method, path, body] of [
    ["GET", "/bootstrap"],
    ["GET", "/reservations"],
    ["PATCH", "/reservations/reservation-jurua-active/status", { status: "checked_in" }],
    ["PATCH", "/rooms/room-102/status", { status: "cleaning" }],
    ["POST", "/admin/credentials/reset", { role: "camareira", newPassword: "Nova-camareira-2026!" }],
  ]) {
    const blocked = await request(handler, method, `${BASE}${path}`, { headers, ...(body ? { body } : {}) });
    assert.equal(blocked.res.statusCode, 409, path);
    assert.equal(blocked.res.json.error.code, "PASSWORD_CHANGE_REQUIRED", path);
  }

  const changed = await request(handler, "POST", `${BASE}/auth/change-password`, {
    headers,
    body: { currentPassword: "Admin-inicial-2026!", newPassword: "Admin-alterada-2026!" },
  });
  assert.equal(changed.res.statusCode, 200);
  const activeCookie = await login(handler, "administrador", "Admin-alterada-2026!", { completeInitialChange: false });
  const bootstrap = await request(handler, "GET", `${BASE}/bootstrap`, { headers: { cookie: activeCookie } });
  assert.equal(bootstrap.res.statusCode, 200);
});

test("backend RBAC filters bootstrap and blocks camareira from reservations", async () => {
  const seed = createSeed("2026-07-14");
  seed.housekeepingTasks[0].assignedUsername = "admin";
  seed.housekeepingTasks[0].assignedRole = "camareira";
  seed.housekeepingTasks.push({
    id: "housekeeping-jurua-supervisor",
    tenantId: "tenant-czs",
    propertyId: "property-jurua-palace",
    roomId: "room-101",
    status: "pending",
    assignedUsername: "admin",
    assignedRole: "supervisor_governanca",
  });
  const { handler } = fixture({ store: createMemoryStore(seed) });
  const cookie = await login(handler, "camareira", "Padrao-inicial-2026!");
  const headers = { cookie };

  const denied = await request(handler, "GET", `${BASE}/reservations`, { headers });
  assert.equal(denied.res.statusCode, 403);
  const bootstrap = await request(handler, "GET", `${BASE}/bootstrap`, { headers });
  assert.equal(bootstrap.res.statusCode, 200);
  assert.equal(Array.isArray(bootstrap.res.json.bootstrap.rooms), true);
  assert.equal(Array.isArray(bootstrap.res.json.bootstrap.housekeepingTasks), true);
  assert.deepEqual(bootstrap.res.json.bootstrap.housekeepingTasks.map(({ id }) => id), ["housekeeping-jurua-01", "housekeeping-jurua-02"]);
  assert.deepEqual(bootstrap.res.json.bootstrap.rooms.map(({ id }) => id), ["room-104", "room-301"]);
  for (const hidden of ["guests", "reservations", "integrations", "maintenanceOrders", "summary"]) {
    assert.equal(Object.hasOwn(bootstrap.res.json.bootstrap, hidden), false, hidden);
  }

  const updated = await request(handler, "PATCH", `${BASE}/rooms/room-102/status`, {
    headers, body: { status: "cleaning" },
  });
  assert.equal(updated.res.statusCode, 200);
  assert.equal(updated.res.json.room.status, "cleaning");
});

test("recepcionista gets scoped reservations and basic guests but never cashflow permission", async () => {
  const { handler } = fixture();
  const cookie = await login(handler, "recepcionista", "Recepcao-inicial-2026!");
  const headers = { cookie };
  const reservations = await request(handler, "GET", `${BASE}/reservations`, { headers });
  assert.equal(reservations.res.statusCode, 200);
  assert.equal(reservations.res.json.reservations.every((row) => row.propertyId === "property-jurua-palace"), true);
  const bootstrap = await request(handler, "GET", `${BASE}/bootstrap`, { headers });
  assert.equal(Array.isArray(bootstrap.res.json.bootstrap.guests), true);
  assert.equal(bootstrap.res.json.session.permissions.includes("finance.cashflow.read"), false);
  assert.equal(Object.hasOwn(bootstrap.res.json.bootstrap, "integrations"), false);
});

test("gerente inherits the full operational chain including finance, settings and security", async () => {
  const { handler } = fixture();
  const cookie = await login(handler, "gerente", "Padrao-inicial-2026!");
  const headers = { cookie };
  const bootstrap = await request(handler, "GET", `${BASE}/bootstrap`, { headers });

  assert.equal(bootstrap.res.statusCode, 200, bootstrap.res.text);
  for (const key of ["summary", "rooms", "roomTypes", "reservations", "guests", "housekeepingTasks", "maintenanceOrders", "integrations"]) {
    assert.equal(Object.hasOwn(bootstrap.res.json.bootstrap, key), true, key);
  }
  for (const permission of ["finance.cashflow.read", "admin.settings.manage", "credentials.reset"]) {
    assert.equal(bootstrap.res.json.session.permissions.includes(permission), true, permission);
  }
});

test("administrator can control maintenance orders and attach room delivery photos without switching role", async () => {
  const { handler } = fixture();
  const cookie = await login(handler, "administrador", "Admin-inicial-2026!");
  const headers = { cookie };

  const maintenance = await request(handler, "PATCH", `${BASE}/maintenance-orders/maintenance-jurua-01/status`, {
    headers,
    body: { status: "in_progress" },
  });
  assert.equal(maintenance.res.statusCode, 200, maintenance.res.text);
  assert.equal(maintenance.res.json.maintenanceOrder.status, "in_progress");

  const photo = await request(handler, "POST", `${BASE}/rooms/room-104/photos`, {
    headers,
    body: {
      kind: "delivery",
      imageDataUrl: "data:image/png;base64,Zm90by1hZG1pbi1uby1xdWFydG8=",
      note: "Administrador conferiu o quarto pessoalmente",
    },
  });
  assert.equal(photo.res.statusCode, 201, photo.res.text);
  assert.equal(photo.res.json.photo.actor.role, "administrador");
});

test("maintenance order updates are scoped and blocked for reception", async () => {
  const { handler } = fixture();
  const receptionCookie = await login(handler, "recepcionista", "Recepcao-inicial-2026!");
  const forbidden = await request(handler, "PATCH", `${BASE}/maintenance-orders/maintenance-jurua-01/status`, {
    headers: { cookie: receptionCookie },
    body: { status: "closed" },
  });
  assert.equal(forbidden.res.statusCode, 403);

  const adminCookie = await login(handler, "administrador", "Admin-inicial-2026!");
  const missing = await request(handler, "PATCH", `${BASE}/maintenance-orders/maintenance-moa-01/status`, {
    headers: { cookie: adminCookie },
    body: { status: "closed" },
  });
  assert.equal(missing.res.statusCode, 404);
});

test("front desk walk-in route registers an immediate in-house guest", async () => {
  const { handler } = fixture({
    store: createMemoryStore(createSeed("2026-07-14"), { now: () => "2026-07-14" }),
  });
  const cookie = await login(handler, "recepcionista", "Recepcao-inicial-2026!");
  const created = await request(handler, "POST", `${BASE}/walk-ins`, {
    headers: { cookie },
    body: {
      roomId: "room-103",
      guestName: "Hospede direto do balcão",
      guestPhone: "+55 68 99900-0001",
      document: "111.000.222-33",
      checkOut: "2026-07-15",
      adults: 1,
      children: 0,
    },
  });

  assert.equal(created.res.statusCode, 201, created.res.text);
  assert.equal(created.res.json.reservation.status, "checked_in");
  assert.equal(created.res.json.reservation.roomId, "room-103");
  const bootstrap = await request(handler, "GET", `${BASE}/bootstrap`, { headers: { cookie } });
  assert.equal(bootstrap.res.json.bootstrap.rooms.find(({ id }) => id === "room-103").status, "occupied");
});

test("manager distributes housekeeping workload and guest portal schedules cleaning", async () => {
  const { handler } = fixture();
  const managerCookie = await login(handler, "gerente", "Padrao-inicial-2026!");
  const distributed = await request(handler, "POST", `${BASE}/housekeeping/distribute`, {
    headers: { cookie: managerCookie },
    body: { date: "2026-07-14" },
  });

  assert.equal(distributed.res.statusCode, 201, distributed.res.text);
  assert.equal(distributed.res.json.created.length, 3);
  assert.equal(distributed.res.json.notifications.length, 3);

  const scheduled = await request(handler, "POST", `${BASE}/public/service-requests`, {
    body: {
      propertySlug: "hotel-jurua-palace",
      reservationId: "reservation-jurua-inhouse",
      requestType: "daily_cleaning",
      awayFrom: "09:30",
      awayUntil: "11:00",
      note: "Estaremos fora para passeio",
    },
  });
  assert.equal(scheduled.res.statusCode, 201, scheduled.res.text);
  assert.equal(scheduled.res.json.task.roomId, "room-201");
  assert.equal(scheduled.res.json.task.awayFrom, "09:30");
});

test("public client portal lists discounted partners and blocks invalid service requests", async () => {
  const { handler } = fixture();
  const partners = await request(handler, "GET", `${BASE}/public/client-portal?propertySlug=hotel-jurua-palace`);
  assert.equal(partners.res.statusCode, 200, partners.res.text);
  assert.equal(partners.res.json.portal.partners.some((partner) => partner.category === "restaurant"), true);
  assert.equal(partners.res.json.portal.partners.every((partner) => partner.discountLabel), true);

  const invalid = await request(handler, "POST", `${BASE}/public/service-requests`, {
    body: {
      propertySlug: "hotel-jurua-palace",
      reservationId: "reservation-jurua-cancelled",
      requestType: "daily_cleaning",
      awayFrom: "09:30",
      awayUntil: "11:00",
    },
  });
  assert.equal(invalid.res.statusCode, 409);
  assert.equal(invalid.res.json.error.code, "SERVICE_REQUEST_NOT_ALLOWED");
});

test("client can order fast food and send messages while admin reads full overview", async () => {
  const { handler } = fixture();
  const order = await request(handler, "POST", `${BASE}/public/room-service-orders`, {
    body: {
      propertySlug: "hotel-jurua-palace",
      reservationId: "reservation-jurua-inhouse",
      items: [{ itemId: "food-burger-combo", quantity: 1 }],
      note: "Enviar para o quarto",
    },
  });
  assert.equal(order.res.statusCode, 201, order.res.text);
  assert.equal(order.res.json.order.roomId, "room-201");
  assert.equal(order.res.json.order.total, 3_900);

  const message = await request(handler, "POST", `${BASE}/public/messages`, {
    body: {
      propertySlug: "hotel-jurua-palace",
      reservationId: "reservation-jurua-inhouse",
      target: "housekeeping",
      message: "Pode trazer toalhas",
    },
  });
  assert.equal(message.res.statusCode, 201, message.res.text);
  assert.equal(message.res.json.message.target, "housekeeping");

  const adminCookie = await login(handler, "administrador", "Admin-inicial-2026!");
  const overview = await request(handler, "GET", `${BASE}/admin/overview`, { headers: { cookie: adminCookie } });
  assert.equal(overview.res.statusCode, 200, overview.res.text);
  assert.equal(overview.res.json.overview.roomServiceOrders.length, 1);
  assert.equal(overview.res.json.overview.guestMessages.length, 1);
  assert.equal(overview.res.json.overview.charts.revenue.totalConfirmedCents > 0, true);
});

test("housekeeping can attach delivery photos but cannot create walk-ins", async () => {
  const { handler } = fixture();
  const cookie = await login(handler, "camareira", "Padrao-inicial-2026!");
  const headers = { cookie };

  const denied = await request(handler, "POST", `${BASE}/walk-ins`, {
    headers,
    body: { roomId: "room-104", guestName: "Sem permissao", checkOut: "2026-07-15" },
  });
  assert.equal(denied.res.statusCode, 403);

  const uploaded = await request(handler, "POST", `${BASE}/rooms/room-104/photos`, {
    headers,
    body: {
      kind: "delivery",
      imageDataUrl: "data:image/png;base64,Zm90by1kZS1lbnRyZWdh",
      note: "Entrega do quarto 104",
    },
  });
  assert.equal(uploaded.res.statusCode, 201, uploaded.res.text);
  assert.equal(uploaded.res.json.photo.kind, "delivery");
  assert.equal(uploaded.res.json.photo.roomId, "room-104");
});

test("reception can run check-in and check-out while invalid transitions stay controlled", async () => {
  const { handler } = fixture({
    store: createMemoryStore(createSeed("2026-07-14"), {
      now: () => new Date("2026-07-15T03:30:00.000Z"),
    }),
  });
  const cookie = await login(handler, "recepcionista", "Recepcao-inicial-2026!");
  const headers = { cookie };

  const checkedIn = await request(handler, "PATCH", `${BASE}/reservations/reservation-jurua-arrival-20260714/status`, {
    headers,
    body: { status: "checked_in" },
  });
  assert.equal(checkedIn.res.statusCode, 200, checkedIn.res.text);
  assert.equal(checkedIn.res.json.reservation.status, "checked_in");

  const checkedOut = await request(handler, "PATCH", `${BASE}/reservations/reservation-jurua-arrival-20260714/status`, {
    headers,
    body: { status: "checked_out" },
  });
  assert.equal(checkedOut.res.statusCode, 200, checkedOut.res.text);
  assert.equal(checkedOut.res.json.reservation.status, "checked_out");
  const bootstrap = await request(handler, "GET", `${BASE}/bootstrap`, { headers });
  assert.equal(bootstrap.res.json.bootstrap.rooms.find(({ id }) => id === "room-102").status, "dirty");

  const invalid = await request(handler, "PATCH", `${BASE}/reservations/reservation-jurua-arrival-20260714/status`, {
    headers,
    body: { status: "checked_in" },
  });
  assert.equal(invalid.res.statusCode, 409);
  assert.equal(invalid.res.json.error.code, "INVALID_RESERVATION_TRANSITION");
});

test("change-password revokes the cookie session and administrative reset is permission checked", async () => {
  const { handler } = fixture();
  const receptionCookie = await login(handler, "recepcionista", "Recepcao-inicial-2026!", { completeInitialChange: false });
  const changed = await request(handler, "POST", `${BASE}/auth/change-password`, {
    headers: { cookie: receptionCookie },
    body: { currentPassword: "Recepcao-inicial-2026!", newPassword: "Recepcao-alterada-2026!" },
  });
  assert.equal(changed.res.statusCode, 200);
  const revoked = await request(handler, "GET", `${BASE}/auth/session`, { headers: { cookie: receptionCookie } });
  assert.equal(revoked.res.statusCode, 401);
  const activeReceptionCookie = await login(handler, "recepcionista", "Recepcao-alterada-2026!", { completeInitialChange: false });
  const forbiddenReset = await request(handler, "POST", `${BASE}/admin/credentials/reset`, {
    headers: { cookie: activeReceptionCookie },
    body: { role: "camareira", newPassword: "Camareira-reset-2026!" },
  });
  assert.equal(forbiddenReset.res.statusCode, 403);

  const adminCookie = await login(handler, "administrador", "Admin-inicial-2026!");
  const reset = await request(handler, "POST", `${BASE}/admin/credentials/reset`, {
    headers: { cookie: adminCookie },
    body: { role: "camareira", newPassword: "Camareira-reset-2026!" },
  });
  assert.equal(reset.res.statusCode, 200);
  const maidCookie = await login(handler, "camareira", "Camareira-reset-2026!");
  assert.match(maidCookie, /^ashotelaria_session=/);
});

test("inventory conflicts and internal exceptions use safe errors with correlation ids", async () => {
  const seed = createSeed("2026-07-14");
  seed.rooms.find(({ id }) => id === "room-103").status = "maintenance";
  const { handler } = fixture({ store: createMemoryStore(seed) });
  const base = {
    propertySlug: "hotel-jurua-palace", roomTypeId: "room-type-standard-jurua",
    checkIn: "2026-07-20", checkOut: "2026-07-22", adults: 1, guestName: "Visitante",
  };
  const fillLastRoom = await request(handler, "POST", `${BASE}/public/reservations`, {
    headers: { "idempotency-key": "fill-last-room" }, body: base,
  });
  assert.equal(fillLastRoom.res.statusCode, 201);
  const conflict = await request(handler, "POST", `${BASE}/public/reservations`, {
    headers: { "idempotency-key": "conflicting-room" }, body: base,
  });
  assert.equal(conflict.res.statusCode, 409);
  assert.equal(conflict.res.json.error.code, "INVENTORY_CONFLICT");

  const brokenStore = {
    ...createMemoryStore(),
    async health() {
      const error = new Error("database password super-secret leaked");
      error.status = 503;
      error.code = "DATABASE_UNAVAILABLE_INTERNAL";
      throw error;
    },
  };
  const broken = fixture({ store: brokenStore });
  const failure = await request(broken.handler, "GET", `${BASE}/health`, {
    headers: { "x-correlation-id": "failure-42" },
  });
  assert.equal(failure.res.statusCode, 503);
  assert.equal(failure.res.json.error.code, "INTERNAL_ERROR");
  assert.equal(failure.res.json.error.message, "Internal server error");
  assert.equal(failure.res.text.includes("super-secret"), false);
  assert.equal(failure.res.getHeader("x-correlation-id"), "failure-42");
});

test("only controlled 4xx errors expose public messages", async () => {
  const unsafeStore = {
    ...createMemoryStore(),
    async health() {
      const error = new Error("private validation detail");
      error.status = 400;
      error.code = "PRIVATE_VALIDATION";
      throw error;
    },
  };
  const unsafe = fixture({ store: unsafeStore });
  const normalized = await request(unsafe.handler, "GET", `${BASE}/health`);
  assert.equal(normalized.res.statusCode, 400);
  assert.deepEqual(normalized.res.json.error, { code: "INVALID_REQUEST", message: "Invalid request" });

  const controlled = await request(unsafe.handler, "GET", `${BASE}/missing`);
  assert.equal(controlled.res.statusCode, 404);
  assert.deepEqual(controlled.res.json.error, { code: "NOT_FOUND", message: "Route not found" });
});

test("controlled check-in errors are exposed as public HTTP 409 responses", async (t) => {
  const cases = [
    ["CHECK_IN_NOT_ALLOWED", "Check-in is only allowed on the reservation arrival date"],
    ["ROOM_NOT_READY", "Room is not ready for check-in"],
  ];

  for (const [code, message] of cases) {
    await t.test(code, async () => {
      const store = {
        ...createMemoryStore(),
        async updateReservationStatus() {
          const error = new Error("private check-in detail");
          error.code = code;
          throw error;
        },
      };
      const { handler } = fixture({ store });
      const cookie = await login(handler, "recepcionista", "Recepcao-inicial-2026!");
      const result = await request(handler, "PATCH", `${BASE}/reservations/reservation-jurua-active/status`, {
        headers: { cookie },
        body: { status: "checked_in" },
      });

      assert.equal(result.res.statusCode, 409);
      assert.deepEqual(result.res.json.error, { code, message });
      assert.equal(result.res.text.includes("private check-in detail"), false);
    });
  }
});
