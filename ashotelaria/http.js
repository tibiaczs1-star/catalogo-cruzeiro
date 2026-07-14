"use strict";

const { randomUUID } = require("node:crypto");
const { hasPermission } = require("./auth");

const API_PREFIX = "/api/ashotelaria/v1";
const DEFAULT_BODY_LIMIT = 64 * 1024;
const DEFAULT_COOKIE_NAME = "ashotelaria_session";

function createASHotelariaHandler({ store, authService, config = {} } = {}) {
  if (!store || !authService) throw new TypeError("store and authService are required");
  const bodyLimit = positiveInteger(config.bodyLimitBytes, DEFAULT_BODY_LIMIT);
  const cookieName = config.cookieName ?? DEFAULT_COOKIE_NAME;
  const production = config.production ?? process.env.NODE_ENV === "production";

  return async function handleASHotelaria(req, res) {
    const rawUrl = typeof req.url === "string" ? req.url : "/";
    const parsedUrl = new URL(rawUrl, "http://ashotelaria.invalid");
    if (parsedUrl.pathname !== API_PREFIX && !parsedUrl.pathname.startsWith(`${API_PREFIX}/`)) {
      return false;
    }

    const correlationId = validCorrelationId(header(req, "x-correlation-id")) ?? randomUUID();
    res.setHeader("x-correlation-id", correlationId);
    res.setHeader("cache-control", "no-store");
    res.setHeader("x-content-type-options", "nosniff");

    try {
      enforceSameOrigin(req, config);
      const method = String(req.method ?? "GET").toUpperCase();
      const routePath = parsedUrl.pathname.slice(API_PREFIX.length) || "/";

      if (method === "OPTIONS") {
        res.setHeader("allow", "GET, POST, PATCH, OPTIONS");
        sendEmpty(res, 204);
        return true;
      }

      if (method === "GET" && routePath === "/health") {
        sendJson(res, 200, await store.health());
        return true;
      }

      const propertyMatch = routePath.match(/^\/public\/properties\/([^/]+)$/);
      if (method === "GET" && propertyMatch) {
        const property = await store.getPublicPropertyBySlug(decodeURIComponent(propertyMatch[1]));
        if (!property) throw httpError("NOT_FOUND", "Property not found", 404);
        sendJson(res, 200, { property });
        return true;
      }

      if (method === "GET" && routePath === "/public/availability") {
        const query = {
          propertySlug: requiredQuery(parsedUrl, "propertySlug"),
          checkIn: requiredQuery(parsedUrl, "checkIn"),
          checkOut: requiredQuery(parsedUrl, "checkOut"),
          adults: integerQuery(parsedUrl, "adults", 1, 1),
          children: integerQuery(parsedUrl, "children", 0, 0),
        };
        const availability = await store.findAvailability(query);
        if (!availability) throw httpError("NOT_FOUND", "Property not found", 404);
        sendJson(res, 200, { availability });
        return true;
      }

      if (method === "POST" && routePath === "/public/reservations") {
        const body = await readJson(req, bodyLimit);
        const idempotencyKey = stringHeader(req, "idempotency-key").trim();
        if (!idempotencyKey) throw httpError("IDEMPOTENCY_KEY_REQUIRED", "Idempotency-Key is required", 400);
        if (idempotencyKey.length > 200) throw httpError("INVALID_IDEMPOTENCY_KEY", "Invalid idempotency key", 400);
        const property = await store.getPublicPropertyBySlug(requiredString(body.propertySlug, "propertySlug"));
        if (!property) throw httpError("NOT_FOUND", "Property not found", 404);
        const result = await store.createReservation({
          tenantId: property.tenantId,
          propertyId: property.id,
          idempotencyKey,
          actor: { id: "public-booking", role: "hospede" },
          input: reservationInput(body),
          includeReplayMetadata: true,
        });
        if (!result?.reservation) throw httpError("NOT_FOUND", "Property not found", 404);
        sendJson(res, result.replayed ? 200 : 201, { reservation: result.reservation });
        return true;
      }

      if (method === "POST" && routePath === "/auth/login") {
        const body = await readJson(req, bodyLimit);
        const result = await authService.login({
          propertySlug: body.propertySlug,
          username: body.username,
          role: body.role,
          password: body.password,
          remoteAddress: req.socket?.remoteAddress ?? "unknown",
        });
        res.setHeader("set-cookie", sessionCookie(cookieName, result.token, result.session, production));
        sendJson(res, 200, { session: result.session });
        return true;
      }

      if (method === "GET" && routePath === "/auth/session") {
        const session = await requireSession(req, authService, cookieName);
        sendJson(res, 200, { session });
        return true;
      }

      if (method === "POST" && routePath === "/auth/logout") {
        res.setHeader("set-cookie", expiredCookie(cookieName, production));
        sendEmpty(res, 204);
        return true;
      }

      if (method === "POST" && routePath === "/auth/change-password") {
        const session = await requireSession(req, authService, cookieName);
        const body = await readJson(req, bodyLimit);
        await authService.changePassword({
          session,
          currentPassword: body.currentPassword,
          newPassword: body.newPassword,
        });
        res.setHeader("set-cookie", expiredCookie(cookieName, production));
        sendJson(res, 200, { changed: true });
        return true;
      }

      if (method === "POST" && routePath === "/admin/credentials/reset") {
        const session = await requireSession(req, authService, cookieName);
        requirePasswordChanged(session);
        requirePermission(session, "credentials.reset");
        const body = await readJson(req, bodyLimit);
        const result = await authService.resetPassword({
          session,
          targetRole: body.role,
          newPassword: body.newPassword,
        });
        sendJson(res, 200, result);
        return true;
      }

      if (method === "GET" && routePath === "/bootstrap") {
        const session = await requireSession(req, authService, cookieName);
        requirePasswordChanged(session);
        requirePermission(session, "hotel.bootstrap.read");
        const bootstrap = await store.getBootstrap({
          tenantId: session.tenantId,
          propertyId: session.propertyId,
        });
        if (!bootstrap) throw httpError("NOT_FOUND", "Property not found", 404);
        sendJson(res, 200, { session, bootstrap: projectBootstrap(bootstrap, session) });
        return true;
      }

      if (method === "GET" && routePath === "/reservations") {
        const session = await requireSession(req, authService, cookieName);
        requirePasswordChanged(session);
        requirePermission(session, "reservations.read");
        const reservations = await store.listReservations({
          tenantId: session.tenantId,
          propertyId: session.propertyId,
        });
        sendJson(res, 200, { reservations });
        return true;
      }

      const reservationStatusMatch = routePath.match(/^\/reservations\/([^/]+)\/status$/);
      if (method === "PATCH" && reservationStatusMatch) {
        const session = await requireSession(req, authService, cookieName);
        requirePasswordChanged(session);
        requirePermission(session, "reservations.manage");
        const body = await readJson(req, bodyLimit);
        const reservation = await store.updateReservationStatus({
          tenantId: session.tenantId,
          propertyId: session.propertyId,
          reservationId: decodeURIComponent(reservationStatusMatch[1]),
          status: body.status,
          actor: {
            id: `${session.username}:${session.role}`,
            username: session.username,
            role: session.role,
          },
        });
        if (!reservation) throw httpError("NOT_FOUND", "Reservation not found", 404);
        sendJson(res, 200, { reservation });
        return true;
      }

      const roomStatusMatch = routePath.match(/^\/rooms\/([^/]+)\/status$/);
      if (method === "PATCH" && roomStatusMatch) {
        const session = await requireSession(req, authService, cookieName);
        requirePasswordChanged(session);
        requirePermission(session, "rooms.operational.update");
        const body = await readJson(req, bodyLimit);
        const room = await store.updateRoomStatus({
          tenantId: session.tenantId,
          propertyId: session.propertyId,
          roomId: decodeURIComponent(roomStatusMatch[1]),
          status: body.status,
          actor: {
            id: `${session.username}:${session.role}`,
            username: session.username,
            role: session.role,
          },
        });
        if (!room) throw httpError("NOT_FOUND", "Room not found", 404);
        sendJson(res, 200, { room });
        return true;
      }

      throw httpError("NOT_FOUND", "Route not found", 404);
    } catch (error) {
      const safe = normalizeError(error);
      sendJson(res, safe.status, {
        error: { code: safe.code, message: safe.message },
        correlationId,
      });
      return true;
    }
  };
}

function projectBootstrap(source, session) {
  if (session.role === "camareira") {
    const housekeepingTasks = (source.housekeepingTasks ?? []).filter((task) => (
      task.assignedUsername === session.username && task.assignedRole === session.role
    ));
    const assignedRoomIds = new Set(housekeepingTasks.map((task) => task.roomId));
    return {
      property: source.property,
      rooms: (source.rooms ?? []).filter((room) => assignedRoomIds.has(room.id)),
      housekeepingTasks,
    };
  }
  const projected = { property: source.property };
  if (source.summary) {
    projected.summary = source.summary;
  }
  if (hasPermission(session.role, "rooms.operational.read")) projected.rooms = source.rooms ?? [];
  if (hasPermission(session.role, "reservations.read")) {
    projected.roomTypes = source.roomTypes ?? [];
    projected.reservations = source.reservations ?? [];
  }
  if (hasPermission(session.role, "guests.basic.read")) projected.guests = source.guests ?? [];
  if (hasPermission(session.role, "tasks.housekeeping.read")) {
    projected.housekeepingTasks = source.housekeepingTasks ?? [];
  }
  if (hasPermission(session.role, "tasks.maintenance.read")) {
    projected.maintenanceOrders = source.maintenanceOrders ?? [];
  }
  if (hasPermission(session.role, "admin.settings.manage")) projected.integrations = source.integrations ?? [];
  return projected;
}

function reservationInput(body) {
  return {
    roomTypeId: body.roomTypeId,
    checkIn: body.checkIn,
    checkOut: body.checkOut,
    adults: body.adults,
    children: body.children,
    guestName: body.guestName,
    guestEmail: body.guestEmail,
    guestPhone: body.guestPhone,
    document: body.document,
    cpf: body.cpf,
    extras: body.extras,
    taxes: body.taxes,
  };
}

async function requireSession(req, authService, cookieName) {
  const token = parseCookies(stringHeader(req, "cookie"))[cookieName];
  if (!token) throw httpError("AUTHENTICATION_REQUIRED", "Authentication required", 401);
  return authService.authenticate(token);
}

function requirePermission(session, permission) {
  if (!hasPermission(session.role, permission) || !session.tenantId || !session.propertyId) {
    throw httpError("FORBIDDEN", "Forbidden", 403);
  }
}

function requirePasswordChanged(session) {
  if (session.forceChange) {
    throw httpError("PASSWORD_CHANGE_REQUIRED", "Password change required", 409);
  }
}

async function readJson(req, limit) {
  const mediaType = stringHeader(req, "content-type").split(";", 1)[0].trim().toLowerCase();
  if (mediaType !== "application/json" && !mediaType.endsWith("+json")) {
    throw httpError("UNSUPPORTED_MEDIA_TYPE", "Content-Type must be application/json", 415);
  }
  const declaredLength = Number(stringHeader(req, "content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > limit) {
    throw httpError("PAYLOAD_TOO_LARGE", "JSON body exceeds 64KB", 413);
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > limit) throw httpError("PAYLOAD_TOO_LARGE", "JSON body exceeds 64KB", 413);
    chunks.push(buffer);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text.trim()) return {};
  try {
    const parsed = JSON.parse(text);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new TypeError("JSON object required");
    }
    return parsed;
  } catch {
    throw httpError("INVALID_JSON", "Invalid JSON body", 400);
  }
}

function enforceSameOrigin(req, config) {
  const origin = stringHeader(req, "origin").trim();
  if (!origin) return;
  const configuredOrigin = typeof config.publicOrigin === "string"
    ? new URL(config.publicOrigin).origin
    : null;
  let expectedOrigin = configuredOrigin;
  if (!expectedOrigin) {
    const host = stringHeader(req, "host");
    const forwarded = stringHeader(req, "x-forwarded-proto").split(",", 1)[0].trim();
    const protocol = forwarded || (req.socket?.encrypted ? "https" : "http");
    expectedOrigin = host ? `${protocol}://${host}` : "";
  }
  let normalized;
  try { normalized = new URL(origin).origin; } catch { normalized = ""; }
  if (!expectedOrigin || normalized !== expectedOrigin) {
    throw httpError("CROSS_ORIGIN_FORBIDDEN", "Cross-origin request forbidden", 403);
  }
}

function sessionCookie(name, token, session, secure) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const maxAge = Number.isSafeInteger(session.expiresAt)
    ? Math.max(0, session.expiresAt - nowSeconds)
    : 8 * 60 * 60;
  return cookie(name, token, { secure, maxAge });
}

function expiredCookie(name, secure) {
  return cookie(name, "", { secure, maxAge: 0 });
}

function cookie(name, value, { secure, maxAge }) {
  const parts = [
    `${name}=${value}`,
    "Path=/api/ashotelaria/v1",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

function parseCookies(source) {
  const result = {};
  for (const part of source.split(";")) {
    const index = part.indexOf("=");
    if (index <= 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

function requiredQuery(url, name) {
  const value = url.searchParams.get(name);
  if (!value?.trim()) throw httpError("INVALID_REQUEST", `${name} is required`, 400);
  return value.trim();
}

function integerQuery(url, name, fallback, minimum) {
  const raw = url.searchParams.get(name);
  if (raw === null || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw httpError("INVALID_REQUEST", `${name} is invalid`, 400);
  }
  return value;
}

function requiredString(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw httpError("INVALID_REQUEST", `${name} is required`, 400);
  }
  return value.trim();
}

function header(req, name) {
  return req.headers?.[name.toLowerCase()];
}

function stringHeader(req, name) {
  const value = header(req, name);
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}

function validCorrelationId(value) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return typeof candidate === "string" && /^[A-Za-z0-9._-]{1,128}$/.test(candidate)
    ? candidate
    : null;
}

function httpError(code, message, status) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  if (status >= 400 && status < 500) error.publicMessage = message;
  return error;
}

function normalizeError(error) {
  const authStatuses = {
    INVALID_CREDENTIALS: 401,
    INVALID_SESSION: 401,
    SESSION_EXPIRED: 401,
    SESSION_REVOKED: 401,
    ROLE_REQUIRED: 400,
    INVALID_ROLE: 400,
    INVALID_PASSWORD: 400,
    FORBIDDEN: 403,
    ACCOUNT_LOCKED: 423,
    RATE_LIMITED: 429,
    CREDENTIAL_NOT_CONFIGURED: 503,
    CONFIGURATION_ERROR: 503,
    INVENTORY_CONFLICT: 409,
    INVALID_RESERVATION_TRANSITION: 409,
    CHECK_IN_NOT_ALLOWED: 409,
    ROOM_NOT_READY: 409,
  };
  if (authStatuses[error?.code]) {
    const code = error.code;
    const status = authStatuses[code];
    if (status >= 500) return { status, code, message: "Internal server error" };
    const messages = {
      INVALID_CREDENTIALS: "Invalid credentials",
      INVALID_SESSION: "Invalid session",
      SESSION_EXPIRED: "Session expired",
      SESSION_REVOKED: "Session revoked",
      ROLE_REQUIRED: "Role is required",
      INVALID_ROLE: "Invalid role",
      INVALID_PASSWORD: "Password does not meet policy",
      FORBIDDEN: "Forbidden",
      ACCOUNT_LOCKED: "Credential is temporarily locked",
      RATE_LIMITED: "Too many attempts",
      INVENTORY_CONFLICT: "No inventory is available for this stay",
      INVALID_RESERVATION_TRANSITION: "Reservation status transition is invalid",
      CHECK_IN_NOT_ALLOWED: "Check-in is only allowed on the reservation arrival date",
      ROOM_NOT_READY: "Room is not ready for check-in",
    };
    return { status, code, message: messages[code] };
  }
  if (Number.isSafeInteger(error?.status) && error.status >= 500 && error.status <= 599) {
    return { status: error.status, code: "INTERNAL_ERROR", message: "Internal server error" };
  }
  if (Number.isSafeInteger(error?.status) && error.status >= 400 && error.status < 500) {
    if (typeof error.publicMessage === "string") {
      return { status: error.status, code: error.code ?? "REQUEST_FAILED", message: error.publicMessage };
    }
    return { status: error.status, code: "INVALID_REQUEST", message: "Invalid request" };
  }
  if (error instanceof RangeError || error instanceof TypeError) {
    return { status: 400, code: "INVALID_REQUEST", message: "Invalid request" };
  }
  return { status: 500, code: "INTERNAL_ERROR", message: "Internal server error" };
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("content-length", Buffer.byteLength(body));
  res.end(body);
}

function sendEmpty(res, status) {
  res.statusCode = status;
  res.end();
}

function positiveInteger(value, fallback) {
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

module.exports = { createASHotelariaHandler };
