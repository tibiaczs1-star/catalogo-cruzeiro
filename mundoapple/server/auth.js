"use strict";

const crypto = require("node:crypto");
const { promisify } = require("node:util");

const pbkdf2 = promisify(crypto.pbkdf2);
const DEFAULT_ITERATIONS = 210_000;
const SESSION_COOKIE = "mundoapple_session";

function timingSafeEqualText(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

async function hashPassword(password, options = {}) {
  if (!password || String(password).length < 6) {
    throw new TypeError("A senha precisa ter pelo menos 6 caracteres.");
  }
  const iterations = Number(options.iterations || DEFAULT_ITERATIONS);
  const salt = options.salt || crypto.randomBytes(18).toString("base64url");
  const digest = await pbkdf2(String(password), salt, iterations, 32, "sha256");
  return `pbkdf2_sha256$${iterations}$${salt}$${digest.toString("base64url")}`;
}

async function verifyPassword(password, encodedHash) {
  const [algorithm, iterationsText, salt, expected] = String(encodedHash || "").split("$");
  if (algorithm !== "pbkdf2_sha256" || !iterationsText || !salt || !expected) return false;
  const iterations = Number(iterationsText);
  if (!Number.isSafeInteger(iterations) || iterations < 10_000) return false;
  const digest = await pbkdf2(String(password || ""), salt, iterations, 32, "sha256");
  return timingSafeEqualText(digest.toString("base64url"), expected);
}

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function issueSessionToken(payload, options = {}) {
  const secret = String(options.secret || "");
  if (secret.length < 32) throw new TypeError("Segredo de sessão inválido.");
  const now = Number(options.now ?? Date.now());
  const ttlMs = Number(options.ttlMs || 8 * 60 * 60 * 1_000);
  const body = Buffer.from(
    JSON.stringify({ sub: payload.sub, role: payload.role, exp: now + ttlMs }),
  ).toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

function parseSessionToken(token, options = {}) {
  try {
    const secret = String(options.secret || "");
    if (secret.length < 32) return null;
    const [body, signature, extra] = String(token || "").split(".");
    if (!body || !signature || extra) return null;
    if (!timingSafeEqualText(signature, sign(body, secret))) return null;
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    const now = Number(options.now ?? Date.now());
    if (!parsed.sub || parsed.role !== "admin" || !Number.isFinite(parsed.exp) || parsed.exp < now) {
      return null;
    }
    return { sub: parsed.sub, role: parsed.role, exp: parsed.exp };
  } catch {
    return null;
  }
}

function readCookie(req, name = SESSION_COOKIE) {
  const header = String(req.headers.cookie || "");
  for (const part of header.split(";")) {
    const [cookieName, ...rest] = part.trim().split("=");
    if (cookieName === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

function buildSessionCookie(token, options = {}) {
  const secure = options.secure !== false ? "; Secure" : "";
  const maxAge = Math.floor(Number(options.ttlMs || 8 * 60 * 60 * 1_000) / 1_000);
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/api/mundoapple; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

function buildExpiredSessionCookie(options = {}) {
  const secure = options.secure !== false ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/api/mundoapple; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

function createRateLimiter(options = {}) {
  const maxAttempts = Number(options.maxAttempts || 5);
  const windowMs = Number(options.windowMs || 15 * 60 * 1_000);
  const attempts = new Map();

  return {
    consume(key, now = Date.now()) {
      const cutoff = now - windowMs;
      const recent = (attempts.get(key) || []).filter((time) => time > cutoff);
      if (recent.length >= maxAttempts) {
        attempts.set(key, recent);
        return { allowed: false, retryAfterMs: Math.max(1, recent[0] + windowMs - now) };
      }
      recent.push(now);
      attempts.set(key, recent);
      return { allowed: true, remaining: maxAttempts - recent.length };
    },
    reset(key) {
      attempts.delete(key);
    },
  };
}

module.exports = {
  SESSION_COOKIE,
  buildExpiredSessionCookie,
  buildSessionCookie,
  createRateLimiter,
  hashPassword,
  issueSessionToken,
  parseSessionToken,
  readCookie,
  verifyPassword,
};
