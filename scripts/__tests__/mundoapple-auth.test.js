const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildSessionCookie,
  createRateLimiter,
  hashPassword,
  issueSessionToken,
  parseSessionToken,
  verifyPassword,
} = require("../../mundoapple/server/auth");

test("session cookie is scoped to the API routes that consume it", () => {
  const cookie = buildSessionCookie("signed-token", { secure: false });
  assert.match(cookie, /Path=\/api\/mundoapple(?:;|$)/);
});

test("password hashes never contain the plaintext and verify correctly", async () => {
  const hash = await hashPassword("senha de teste", { iterations: 10_000 });
  assert.match(hash, /^pbkdf2_sha256\$/);
  assert.equal(hash.includes("senha de teste"), false);
  assert.equal(await verifyPassword("senha de teste", hash), true);
  assert.equal(await verifyPassword("senha errada", hash), false);
});

test("signed sessions expire and reject tampering", () => {
  const secret = "segredo-de-teste-com-mais-de-32-caracteres";
  const token = issueSessionToken(
    { sub: "matheus", role: "admin" },
    { secret, now: 1_000, ttlMs: 5_000 },
  );

  assert.deepEqual(parseSessionToken(token, { secret, now: 4_000 }), {
    sub: "matheus",
    role: "admin",
    exp: 6_000,
  });
  assert.equal(parseSessionToken(`${token}x`, { secret, now: 4_000 }), null);
  assert.equal(parseSessionToken(token, { secret, now: 6_001 }), null);
});

test("rate limiter blocks repeated login attempts for a bounded window", () => {
  const limiter = createRateLimiter({ maxAttempts: 2, windowMs: 10_000 });
  assert.equal(limiter.consume("127.0.0.1", 0).allowed, true);
  assert.equal(limiter.consume("127.0.0.1", 1).allowed, true);
  assert.equal(limiter.consume("127.0.0.1", 2).allowed, false);
  assert.equal(limiter.consume("127.0.0.1", 10_001).allowed, true);
});
