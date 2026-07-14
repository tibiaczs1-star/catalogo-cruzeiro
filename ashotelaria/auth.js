"use strict";

const {
  createHmac,
  randomBytes,
  scrypt: scryptCallback,
  timingSafeEqual,
} = require("node:crypto");
const { promisify } = require("node:util");

const scrypt = promisify(scryptCallback);
const SCRYPT_COST = 16_384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SCRYPT_KEY_LENGTH = 64;

const CANONICAL_ROLES = Object.freeze([
  "superadmin", "proprietario", "administrador", "gerente", "recepcionista", "camareira",
  "supervisor_governanca", "contador", "financeiro", "caixa", "manutencao", "revenue_manager",
  "auditor", "hospede",
]);

const ROLE_PERMISSIONS = Object.freeze({
  superadmin: permissions(
    "hotel.bootstrap.read", "reservations.read", "reservations.create", "reservations.manage", "guests.basic.read",
    "rooms.operational.read", "rooms.operational.update", "tasks.housekeeping.read",
    "tasks.housekeeping.update", "tasks.maintenance.read", "tasks.maintenance.update",
    "admin.users.manage", "admin.roles.manage", "admin.settings.manage", "audit.read",
    "credentials.reset",
  ),
  proprietario: permissions(
    "hotel.bootstrap.read", "reservations.read", "reservations.create", "reservations.manage", "guests.basic.read",
    "rooms.operational.read", "rooms.operational.update", "tasks.housekeeping.read",
    "tasks.housekeeping.update", "tasks.maintenance.read", "tasks.maintenance.update",
    "finance.cashflow.read", "admin.users.manage", "admin.roles.manage", "admin.settings.manage",
    "audit.read", "credentials.reset",
  ),
  administrador: permissions(
    "hotel.bootstrap.read", "reservations.read", "reservations.create", "reservations.manage", "guests.basic.read",
    "rooms.operational.read", "rooms.operational.update", "tasks.housekeeping.read",
    "tasks.housekeeping.update", "tasks.maintenance.read", "tasks.maintenance.update",
    "finance.cashflow.read", "admin.users.manage", "admin.roles.manage", "admin.settings.manage",
    "audit.read", "credentials.reset",
  ),
  gerente: permissions(
    "hotel.bootstrap.read", "frontdesk.read", "reservations.read", "reservations.create", "reservations.manage",
    "guests.basic.read", "rooms.operational.read", "rooms.operational.update",
    "tasks.housekeeping.read", "tasks.housekeeping.update", "tasks.maintenance.read",
    "tasks.maintenance.update", "audit.read",
  ),
  recepcionista: permissions(
    "hotel.bootstrap.read", "frontdesk.read", "reservations.read", "reservations.create", "reservations.manage",
    "guests.basic.read", "rooms.operational.read", "rooms.operational.update",
  ),
  camareira: permissions(
    "hotel.bootstrap.read", "rooms.operational.read", "rooms.operational.update",
    "tasks.housekeeping.read", "tasks.housekeeping.update",
  ),
  supervisor_governanca: permissions(
    "hotel.bootstrap.read", "rooms.operational.read", "rooms.operational.update",
    "tasks.housekeeping.read", "tasks.housekeeping.update",
  ),
  contador: permissions(
    "hotel.bootstrap.read", "reservations.read", "guests.basic.read", "finance.cashflow.read",
  ),
  financeiro: permissions(
    "hotel.bootstrap.read", "reservations.read", "guests.basic.read", "finance.cashflow.read",
  ),
  caixa: permissions("hotel.bootstrap.read", "frontdesk.read", "payments.cashier.operate"),
  manutencao: permissions(
    "hotel.bootstrap.read", "rooms.operational.read", "rooms.operational.update",
    "tasks.maintenance.read", "tasks.maintenance.update",
  ),
  revenue_manager: permissions("hotel.bootstrap.read", "reservations.read", "rates.manage"),
  auditor: permissions("hotel.bootstrap.read", "reservations.read", "guests.basic.read", "audit.read"),
  hospede: permissions("guest.reservations.own.read"),
});

function permissions(...values) {
  return Object.freeze(values);
}

function hasPermission(role, permission) {
  return Boolean(ROLE_PERMISSIONS[role]?.includes(permission));
}

function authError(code, message = "Authentication failed") {
  const error = new Error(message);
  error.code = code;
  return error;
}

function requirePassword(password, minimumLength = 8) {
  if (typeof password !== "string" || password.length < minimumLength || password.length > 1024) {
    throw authError("INVALID_PASSWORD", "Password does not meet policy");
  }
  return password;
}

async function derivePasswordHash(password, minimumLength) {
  requirePassword(password, minimumLength);
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
    maxmem: 32 * 1024 * 1024,
  });
  return [
    "scrypt",
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join("$");
}

async function hashPassword(password) {
  return derivePasswordHash(password, 8);
}

async function hashInitialPassword(password) {
  return derivePasswordHash(password, 4);
}

async function verifyPassword(password, serialized) {
  if (typeof password !== "string" || typeof serialized !== "string") return false;
  const [algorithm, costText, blockText, parallelText, saltText, hashText, extra] = serialized.split("$");
  if (algorithm !== "scrypt" || extra !== undefined || !saltText || !hashText) return false;
  const cost = Number(costText);
  const blockSize = Number(blockText);
  const parallelization = Number(parallelText);
  if (!Number.isSafeInteger(cost) || !Number.isSafeInteger(blockSize) || !Number.isSafeInteger(parallelization)) return false;
  if (cost < 2 || cost > SCRYPT_COST || blockSize < 1 || blockSize > SCRYPT_BLOCK_SIZE || parallelization < 1 || parallelization > 4) return false;

  try {
    const salt = Buffer.from(saltText, "base64url");
    const expected = Buffer.from(hashText, "base64url");
    if (salt.length < 16 || expected.length !== SCRYPT_KEY_LENGTH) return false;
    const actual = await scrypt(password, salt, expected.length, {
      N: cost,
      r: blockSize,
      p: parallelization,
      maxmem: 32 * 1024 * 1024,
    });
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function initialPasswordForRole(role, environment) {
  if (["superadmin", "proprietario", "administrador"].includes(role)) {
    return environment.ASHOTELARIA_ADMIN_PASSWORD;
  }
  if (["contador", "financeiro", "caixa", "revenue_manager"].includes(role)) {
    return environment.ASHOTELARIA_FINANCE_PASSWORD;
  }
  if (role === "recepcionista") return environment.ASHOTELARIA_RECEPTION_PASSWORD;
  return environment.ASHOTELARIA_DEFAULT_PASSWORD;
}

function sameConfiguredPassword(candidate, configured) {
  if (typeof candidate !== "string" || typeof configured !== "string") return false;
  const actual = Buffer.from(candidate, "utf8");
  const expected = Buffer.from(configured, "utf8");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function publicSession(payload) {
  return {
    tenantId: payload.tenantId,
    propertyId: payload.propertyId,
    propertySlug: payload.propertySlug,
    username: payload.username,
    role: payload.role,
    permissions: [...ROLE_PERMISSIONS[payload.role]],
    sessionVersion: payload.sessionVersion,
    forceChange: Boolean(payload.forceChange),
    issuedAt: payload.iat,
    expiresAt: payload.exp,
  };
}

function createAuthService({ store, config = {} } = {}) {
  if (!store
    || typeof store.getCredentialProfile !== "function"
    || typeof store.createCredentialProfileIfAbsent !== "function"
    || typeof store.upsertCredentialProfile !== "function"
    || typeof store.updateCredentialProfile !== "function"
    || typeof store.setCredentialPassword !== "function"
    || typeof store.recordCredentialFailure !== "function") {
    throw new TypeError("store must provide credential profile methods");
  }

  const sessionSecret = config.sessionSecret ?? process.env.ASHOTELARIA_SESSION_SECRET;
  if (typeof sessionSecret !== "string" || sessionSecret.length < 32) {
    throw authError("CONFIGURATION_ERROR", "ASHOTELARIA_SESSION_SECRET must contain at least 32 characters");
  }
  const now = typeof config.now === "function" ? config.now : Date.now;
  const environment = config.environment ?? process.env;
  const requireInitialPasswordChange = typeof config.requireInitialPasswordChange === "boolean"
    ? config.requireInitialPasswordChange
    : String(environment.ASHOTELARIA_REQUIRE_PASSWORD_CHANGE ?? "true").trim().toLowerCase() !== "false";
  const sessionTtlSeconds = positiveInteger(config.sessionTtlSeconds, 8 * 60 * 60);
  const maxFailedAttempts = positiveInteger(config.maxFailedAttempts, 5);
  const lockoutMs = positiveInteger(config.lockoutMs, 15 * 60 * 1000);
  const rateLimitMax = positiveInteger(config.rateLimitMax, 20);
  const rateLimitWindowMs = positiveInteger(config.rateLimitWindowMs, 60_000);
  const rateBuckets = new Map();

  function sign(encodedPayload) {
    return createHmac("sha256", sessionSecret).update(encodedPayload).digest("base64url");
  }

  function createToken(payload) {
    const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
    return `${encoded}.${sign(encoded)}`;
  }

  function parseToken(token) {
    if (typeof token !== "string") throw authError("INVALID_SESSION", "Invalid session");
    const parts = token.split(".");
    if (parts.length !== 2 || !parts[0] || !parts[1]) throw authError("INVALID_SESSION", "Invalid session");
    const expected = Buffer.from(sign(parts[0]), "utf8");
    const actual = Buffer.from(parts[1], "utf8");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      throw authError("INVALID_SESSION", "Invalid session");
    }
    try {
      return JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    } catch {
      throw authError("INVALID_SESSION", "Invalid session");
    }
  }

  function checkRateLimit(key) {
    const current = now();
    const bucket = rateBuckets.get(key);
    if (!bucket || current >= bucket.resetAt) {
      rateBuckets.set(key, { count: 1, resetAt: current + rateLimitWindowMs });
      return;
    }
    bucket.count += 1;
    if (bucket.count > rateLimitMax) throw authError("RATE_LIMITED", "Too many attempts");
  }

  async function ensureProfile({ property, username, role }) {
    let profile = await store.getCredentialProfile({
      tenantId: property.tenantId,
      propertyId: property.id,
      username,
      role,
    });
    if (profile) return profile;

    const initialPassword = initialPasswordForRole(role, environment);
    if (typeof initialPassword !== "string" || initialPassword.length === 0) {
      throw authError("CREDENTIAL_NOT_CONFIGURED", "Credential is not configured");
    }
    const updatedAt = new Date(now()).toISOString();
    profile = await store.createCredentialProfileIfAbsent({
      tenantId: property.tenantId,
      propertyId: property.id,
      username,
      role,
      passwordHash: await hashInitialPassword(initialPassword),
      sessionVersion: 1,
      failedAttempts: 0,
      lockedUntil: null,
      forceChange: requireInitialPasswordChange,
      updatedAt,
    });
    return profile;
  }

  async function login({ propertySlug, username, role, password, remoteAddress = "unknown" } = {}) {
    if (typeof role !== "string" || !role.trim()) throw authError("ROLE_REQUIRED", "Role is required");
    const normalizedRole = role.trim().toLowerCase();
    const normalizedUsername = typeof username === "string" ? username.trim().toLowerCase() : "";
    const normalizedSlug = typeof propertySlug === "string" ? propertySlug.trim() : "";
    checkRateLimit(`${remoteAddress}:${normalizedSlug}:${normalizedUsername}:${normalizedRole}`);
    if (normalizedUsername !== "admin" || !CANONICAL_ROLES.includes(normalizedRole) || !normalizedSlug) {
      throw authError("INVALID_CREDENTIALS", "Invalid credentials");
    }
    const property = await store.getPublicPropertyBySlug(normalizedSlug);
    if (!property) throw authError("INVALID_CREDENTIALS", "Invalid credentials");
    const profile = await ensureProfile({ property, username: normalizedUsername, role: normalizedRole });
    const current = now();
    if (profile.lockedUntil && Date.parse(profile.lockedUntil) > current) {
      throw authError("ACCOUNT_LOCKED", "Credential is temporarily locked");
    }

    const matches = await verifyPassword(password, profile.passwordHash);
    if (!matches) {
      const failed = await store.recordCredentialFailure({
        tenantId: property.tenantId,
        propertyId: property.id,
        username: normalizedUsername,
        role: normalizedRole,
        expectedSessionVersion: profile.sessionVersion,
        maxFailedAttempts,
        lockedUntil: new Date(current + lockoutMs).toISOString(),
        updatedAt: new Date(current).toISOString(),
      });
      if (failed?.failedAttempts >= maxFailedAttempts && failed.lockedUntil) {
        throw authError("ACCOUNT_LOCKED", "Credential is temporarily locked");
      }
      throw authError("INVALID_CREDENTIALS", "Invalid credentials");
    }

    const configuredInitialPassword = initialPasswordForRole(normalizedRole, environment);
    const mustChangePassword = requireInitialPasswordChange
      && (profile.forceChange || sameConfiguredPassword(password, configuredInitialPassword));
    const updated = await store.updateCredentialProfile({
      tenantId: property.tenantId,
      propertyId: property.id,
      username: normalizedUsername,
      role: normalizedRole,
      expectedSessionVersion: profile.sessionVersion,
      changes: {
        failedAttempts: 0,
        lockedUntil: null,
        forceChange: mustChangePassword,
        updatedAt: new Date(current).toISOString(),
      },
    });
    if (!updated) throw authError("SESSION_REVOKED", "Session revoked");
    const iat = Math.floor(current / 1000);
    const payload = {
      tenantId: property.tenantId,
      propertyId: property.id,
      propertySlug: property.slug,
      username: normalizedUsername,
      role: normalizedRole,
      sessionVersion: updated.sessionVersion,
      forceChange: updated.forceChange,
      iat,
      exp: iat + sessionTtlSeconds,
    };
    return { token: createToken(payload), session: publicSession(payload) };
  }

  async function authenticate(token) {
    const payload = parseToken(token);
    if (!CANONICAL_ROLES.includes(payload.role)
      || payload.username !== "admin"
      || !payload.tenantId
      || !payload.propertyId
      || !Number.isSafeInteger(payload.sessionVersion)) {
      throw authError("INVALID_SESSION", "Invalid session");
    }
    if (!Number.isSafeInteger(payload.exp) || now() >= payload.exp * 1000) {
      throw authError("SESSION_EXPIRED", "Session expired");
    }
    const profile = await store.getCredentialProfile({
      tenantId: payload.tenantId,
      propertyId: payload.propertyId,
      username: payload.username,
      role: payload.role,
    });
    if (!profile || profile.sessionVersion !== payload.sessionVersion) {
      throw authError("SESSION_REVOKED", "Session revoked");
    }
    return publicSession({ ...payload, forceChange: profile.forceChange });
  }

  async function changePassword({ session, currentPassword, newPassword } = {}) {
    requireSessionShape(session);
    requirePassword(newPassword);
    const profile = await store.getCredentialProfile({
      tenantId: session.tenantId,
      propertyId: session.propertyId,
      username: session.username,
      role: session.role,
    });
    if (!profile || !await verifyPassword(currentPassword, profile.passwordHash)) {
      throw authError("INVALID_CREDENTIALS", "Invalid credentials");
    }
    const updated = await store.setCredentialPassword({
      tenantId: session.tenantId,
      propertyId: session.propertyId,
      username: session.username,
      role: session.role,
      passwordHash: await hashPassword(newPassword),
      forceChange: false,
      expectedSessionVersion: profile.sessionVersion,
      updatedAt: new Date(now()).toISOString(),
      actor: { username: session.username, role: session.role },
      action: "credential.password_changed",
    });
    if (!updated) throw authError("SESSION_REVOKED", "Session revoked");
    return { changed: true };
  }

  async function resetPassword({ session, targetRole, newPassword } = {}) {
    requireSessionShape(session);
    if (!hasPermission(session.role, "credentials.reset")) throw authError("FORBIDDEN", "Forbidden");
    const role = typeof targetRole === "string" ? targetRole.trim().toLowerCase() : "";
    if (!CANONICAL_ROLES.includes(role)) throw authError("INVALID_ROLE", "Invalid role");
    requirePassword(newPassword);
    const scope = {
      tenantId: session.tenantId,
      propertyId: session.propertyId,
      username: "admin",
      role,
    };
    const updated = await store.setCredentialPassword({
      ...scope,
      passwordHash: await hashPassword(newPassword),
      forceChange: true,
      updatedAt: new Date(now()).toISOString(),
      actor: { username: session.username, role: session.role },
      action: "credential.password_reset",
    });
    return { reset: true, role, sessionVersion: updated.sessionVersion };
  }

  return { login, authenticate, changePassword, resetPassword };
}

function positiveInteger(value, fallback) {
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

function requireSessionShape(session) {
  if (!session || !session.tenantId || !session.propertyId || !session.username || !session.role) {
    throw authError("INVALID_SESSION", "Invalid session");
  }
}

module.exports = {
  CANONICAL_ROLES,
  ROLE_PERMISSIONS,
  hasPermission,
  hashPassword,
  verifyPassword,
  createAuthService,
};
