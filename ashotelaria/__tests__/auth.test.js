"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { createMemoryStore } = require("../memory-store");
const {
  CANONICAL_ROLES,
  ROLE_PERMISSIONS,
  hasPermission,
  hashPassword,
  verifyPassword,
  createAuthService,
} = require("../auth");

const SESSION_SECRET = "test-session-secret-that-is-long-enough-123456";

function createService(options = {}) {
  const store = options.store ?? createMemoryStore();
  let now = options.now ?? Date.parse("2026-07-14T12:00:00.000Z");
  const service = createAuthService({
    store,
    config: {
      sessionSecret: SESSION_SECRET,
      sessionTtlSeconds: 3600,
      maxFailedAttempts: 3,
      lockoutMs: 60_000,
      now: () => now,
      environment: {
        ASHOTELARIA_ADMIN_PASSWORD: "Admin-inicial-2026!",
        ASHOTELARIA_FINANCE_PASSWORD: "Financeiro-inicial-2026!",
        ASHOTELARIA_RECEPTION_PASSWORD: "Recepcao-inicial-2026!",
        ASHOTELARIA_DEFAULT_PASSWORD: "Padrao-inicial-2026!",
      },
      ...options.config,
    },
  });
  return { store, service, advance(ms) { now += ms; } };
}

test("declares the 14 canonical roles and limits cashflow to the four approved roles", () => {
  assert.deepEqual(CANONICAL_ROLES, [
    "superadmin", "proprietario", "administrador", "gerente", "recepcionista", "camareira",
    "supervisor_governanca", "contador", "financeiro", "caixa", "manutencao", "revenue_manager",
    "auditor", "hospede",
  ]);
  assert.equal(Object.keys(ROLE_PERMISSIONS).length, 14);

  const cashflowRoles = CANONICAL_ROLES.filter((role) => hasPermission(role, "finance.cashflow.read"));
  assert.deepEqual(cashflowRoles, ["proprietario", "administrador", "contador", "financeiro"]);
  assert.equal(hasPermission("camareira", "reservations.read"), false);
  assert.equal(hasPermission("camareira", "guests.basic.read"), false);
  assert.equal(hasPermission("camareira", "rooms.operational.update"), true);
  assert.equal(hasPermission("recepcionista", "reservations.read"), true);
  assert.equal(hasPermission("recepcionista", "reservations.manage"), true);
  assert.equal(hasPermission("recepcionista", "guests.basic.read"), true);
  assert.equal(hasPermission("recepcionista", "finance.cashflow.read"), false);
  assert.equal(hasPermission("camareira", "reservations.manage"), false);

  for (const role of ["administrador", "proprietario", "superadmin"]) {
    assert.equal(hasPermission(role, "credentials.reset"), true, role);
  }
  for (const role of CANONICAL_ROLES.filter((role) => !["administrador", "proprietario", "superadmin"].includes(role))) {
    assert.equal(hasPermission(role, "credentials.reset"), false, role);
  }
});

test("hashes passwords with random scrypt salts and verifies without exposing plaintext", async () => {
  const first = await hashPassword("uma-senha-segura");
  const second = await hashPassword("uma-senha-segura");

  assert.match(first, /^scrypt\$/);
  assert.notEqual(first, second);
  assert.equal(first.includes("uma-senha-segura"), false);
  assert.equal(await verifyPassword("uma-senha-segura", first), true);
  assert.equal(await verifyPassword("senha-errada", first), false);
  assert.equal(await verifyPassword("uma-senha-segura", "hash-invalido"), false);
});

test("login requires literal admin plus an explicit canonical role and provisions only from environment", async () => {
  const { service, store } = createService();

  await assert.rejects(
    service.login({ propertySlug: "hotel-jurua-palace", username: "recepcao", role: "recepcionista", password: "Recepcao-inicial-2026!" }),
    (error) => error.code === "INVALID_CREDENTIALS",
  );
  await assert.rejects(
    service.login({ propertySlug: "hotel-jurua-palace", username: "admin", password: "Recepcao-inicial-2026!" }),
    (error) => error.code === "ROLE_REQUIRED",
  );

  const loggedIn = await service.login({
    propertySlug: "hotel-jurua-palace",
    username: "admin",
    role: "recepcionista",
    password: "Recepcao-inicial-2026!",
    remoteAddress: "127.0.0.1",
  });
  assert.equal(typeof loggedIn.token, "string");
  assert.equal(loggedIn.session.role, "recepcionista");
  assert.equal(loggedIn.session.tenantId, "tenant-czs");
  assert.equal(loggedIn.session.propertyId, "property-jurua-palace");
  assert.deepEqual(loggedIn.session.permissions, ROLE_PERMISSIONS.recepcionista);
  assert.equal(JSON.stringify(loggedIn).includes("Recepcao-inicial-2026!"), false);
  assert.equal(Object.hasOwn(loggedIn.session, "passwordHash"), false);

  const profile = await store.getCredentialProfile({
    tenantId: "tenant-czs",
    propertyId: "property-jurua-palace",
    username: "admin",
    role: "recepcionista",
  });
  assert.match(profile.passwordHash, /^scrypt\$/);
  assert.equal(profile.sessionVersion, 1);
  assert.equal(profile.failedAttempts, 0);
});

test("initial temporary passwords accept four characters but future passwords still require eight", async () => {
  const { service } = createService({
    config: {
      environment: {
        ASHOTELARIA_RECEPTION_PASSWORD: "T4mp",
      },
    },
  });
  const loggedIn = await service.login({
    propertySlug: "hotel-jurua-palace",
    username: "admin",
    role: "recepcionista",
    password: "T4mp",
  });
  assert.equal(loggedIn.session.forceChange, true);
  await assert.rejects(
    service.changePassword({
      session: loggedIn.session,
      currentPassword: "T4mp",
      newPassword: "1234567",
    }),
    (error) => error.code === "INVALID_PASSWORD",
  );
});

test("demo access can disable the mandatory initial password change for new and existing profiles", async () => {
  const store = createMemoryStore();
  const environment = { ASHOTELARIA_RECEPTION_PASSWORD: "T4mp" };
  const temporary = createService({ store, config: { environment } });
  const first = await temporary.service.login({
    propertySlug: "hotel-jurua-palace",
    username: "admin",
    role: "recepcionista",
    password: "T4mp",
  });
  assert.equal(first.session.forceChange, true);

  const demo = createService({
    store,
    config: { environment, requireInitialPasswordChange: false },
  });
  const loggedIn = await demo.service.login({
    propertySlug: "hotel-jurua-palace",
    username: "admin",
    role: "recepcionista",
    password: "T4mp",
  });
  assert.equal(loggedIn.session.forceChange, false);
  assert.equal((await store.getCredentialProfile({
    tenantId: "tenant-czs",
    propertyId: "property-jurua-palace",
    username: "admin",
    role: "recepcionista",
  })).forceChange, false);

  const strictAfterDemo = createService({
    store,
    config: { environment, requireInitialPasswordChange: true },
  });
  const cutoverLogin = await strictAfterDemo.service.login({
    propertySlug: "hotel-jurua-palace",
    username: "admin",
    role: "recepcionista",
    password: "T4mp",
  });
  assert.equal(cutoverLogin.session.forceChange, true);
});

test("strict cutover does not force a second change after the initial password was replaced", async () => {
  const store = createMemoryStore();
  const environment = { ASHOTELARIA_RECEPTION_PASSWORD: "T4mp" };
  const demo = createService({
    store,
    config: { environment, requireInitialPasswordChange: false },
  });
  const loggedIn = await demo.service.login({
    propertySlug: "hotel-jurua-palace", username: "admin", role: "recepcionista", password: "T4mp",
  });
  await demo.service.changePassword({
    session: loggedIn.session,
    currentPassword: "T4mp",
    newPassword: "Recepcao-real-2026!",
  });

  const strict = createService({ store, config: { environment, requireInitialPasswordChange: true } });
  const afterCutover = await strict.service.login({
    propertySlug: "hotel-jurua-palace",
    username: "admin",
    role: "recepcionista",
    password: "Recepcao-real-2026!",
  });
  assert.equal(afterCutover.session.forceChange, false);
});

test("a stale successful login cannot survive a concurrent password change", async () => {
  const store = createMemoryStore();
  const environment = { ASHOTELARIA_RECEPTION_PASSWORD: "T4mp" };
  const demo = createService({
    store,
    config: { environment, requireInitialPasswordChange: false },
  });
  const active = await demo.service.login({
    propertySlug: "hotel-jurua-palace", username: "admin", role: "recepcionista", password: "T4mp",
  });

  const updateCredentialProfile = store.updateCredentialProfile.bind(store);
  let enteredResolve;
  const entered = new Promise((resolve) => { enteredResolve = resolve; });
  let releaseResolve;
  const release = new Promise((resolve) => { releaseResolve = resolve; });
  store.updateCredentialProfile = async (input) => {
    enteredResolve();
    await release;
    return updateCredentialProfile(input);
  };

  const strict = createService({ store, config: { environment, requireInitialPasswordChange: true } });
  const staleLogin = strict.service.login({
    propertySlug: "hotel-jurua-palace", username: "admin", role: "recepcionista", password: "T4mp",
  });
  await entered;
  await demo.service.changePassword({
    session: active.session,
    currentPassword: "T4mp",
    newPassword: "Recepcao-real-2026!",
  });
  releaseResolve();

  await assert.rejects(staleLogin, (error) => error.code === "SESSION_REVOKED");
  const relogged = await strict.service.login({
    propertySlug: "hotel-jurua-palace", username: "admin", role: "recepcionista", password: "Recepcao-real-2026!",
  });
  assert.equal(relogged.session.sessionVersion, 2);
  assert.equal(relogged.session.forceChange, false);
});

test("a stale failed login cannot increment or lock a concurrently changed credential", async () => {
  const store = createMemoryStore();
  const environment = { ASHOTELARIA_RECEPTION_PASSWORD: "T4mp" };
  const demo = createService({
    store,
    config: { environment, requireInitialPasswordChange: false, maxFailedAttempts: 1 },
  });
  const active = await demo.service.login({
    propertySlug: "hotel-jurua-palace", username: "admin", role: "recepcionista", password: "T4mp",
  });

  const recordCredentialFailure = store.recordCredentialFailure.bind(store);
  let enteredResolve;
  const entered = new Promise((resolve) => { enteredResolve = resolve; });
  let releaseResolve;
  const release = new Promise((resolve) => { releaseResolve = resolve; });
  store.recordCredentialFailure = async (input) => {
    enteredResolve();
    await release;
    return recordCredentialFailure(input);
  };

  const staleFailure = demo.service.login({
    propertySlug: "hotel-jurua-palace", username: "admin", role: "recepcionista", password: "senha-incorreta",
  });
  await entered;
  await demo.service.changePassword({
    session: active.session,
    currentPassword: "T4mp",
    newPassword: "Recepcao-real-2026!",
  });
  releaseResolve();

  await assert.rejects(
    staleFailure,
    (error) => error.code === "INVALID_CREDENTIALS" && error.message === "Invalid credentials",
  );
  const profile = await store.getCredentialProfile({
    tenantId: "tenant-czs", propertyId: "property-jurua-palace", username: "admin", role: "recepcionista",
  });
  assert.equal(profile.sessionVersion, 2);
  assert.equal(profile.failedAttempts, 0);
  assert.equal(profile.lockedUntil, null);
  assert.equal(profile.forceChange, false);
});

test("selected roles create isolated contexts for the same admin username", async () => {
  const { service } = createService();
  const reception = await service.login({
    propertySlug: "hotel-jurua-palace", username: "admin", role: "recepcionista",
    password: "Recepcao-inicial-2026!",
  });
  const finance = await service.login({
    propertySlug: "hotel-jurua-palace", username: "admin", role: "financeiro",
    password: "Financeiro-inicial-2026!",
  });

  assert.equal((await service.authenticate(reception.token)).role, "recepcionista");
  assert.equal((await service.authenticate(finance.token)).role, "financeiro");
  assert.equal(hasPermission((await service.authenticate(reception.token)).role, "finance.cashflow.read"), false);
  assert.equal(hasPermission((await service.authenticate(finance.token)).role, "finance.cashflow.read"), true);
});

test("failed attempts persist, lock the profile and successful login clears the counter", async () => {
  const { service, store, advance } = createService({ config: { maxFailedAttempts: 2 } });
  const input = {
    propertySlug: "hotel-jurua-palace", username: "admin", role: "camareira", password: "errada-123",
  };

  await assert.rejects(service.login(input), (error) => error.code === "INVALID_CREDENTIALS");
  await assert.rejects(service.login(input), (error) => error.code === "ACCOUNT_LOCKED");
  await assert.rejects(
    service.login({ ...input, password: "Padrao-inicial-2026!" }),
    (error) => error.code === "ACCOUNT_LOCKED",
  );

  let profile = await store.getCredentialProfile({
    tenantId: "tenant-czs", propertyId: "property-jurua-palace", username: "admin", role: "camareira",
  });
  assert.equal(profile.failedAttempts, 2);
  assert.equal(typeof profile.lockedUntil, "string");

  advance(60_001);
  await service.login({ ...input, password: "Padrao-inicial-2026!" });
  profile = await store.getCredentialProfile({
    tenantId: "tenant-czs", propertyId: "property-jurua-palace", username: "admin", role: "camareira",
  });
  assert.equal(profile.failedAttempts, 0);
  assert.equal(profile.lockedUntil, null);
});

test("concurrent failed logins atomically increment one profile and trigger lockout", async () => {
  const { service, store } = createService({ config: { maxFailedAttempts: 2 } });
  const input = {
    propertySlug: "hotel-jurua-palace", username: "admin", role: "camareira", password: "errada-123",
  };

  const results = await Promise.allSettled([service.login(input), service.login(input)]);
  assert.deepEqual(
    results.map((result) => result.reason?.code).sort(),
    ["ACCOUNT_LOCKED", "INVALID_CREDENTIALS"],
  );
  const profile = await store.getCredentialProfile({
    tenantId: "tenant-czs", propertyId: "property-jurua-palace", username: "admin", role: "camareira",
  });
  assert.equal(profile.failedAttempts, 2);
  assert.equal(typeof profile.lockedUntil, "string");
});

test("session signatures, expiry and sessionVersion are checked on every authentication", async () => {
  const { service, advance } = createService({ config: { sessionTtlSeconds: 2 } });
  const loggedIn = await service.login({
    propertySlug: "hotel-jurua-palace", username: "admin", role: "administrador",
    password: "Admin-inicial-2026!",
  });
  assert.equal((await service.authenticate(loggedIn.token)).role, "administrador");

  const tampered = `${loggedIn.token.slice(0, -1)}${loggedIn.token.endsWith("a") ? "b" : "a"}`;
  await assert.rejects(service.authenticate(tampered), (error) => error.code === "INVALID_SESSION");
  advance(2_001);
  await assert.rejects(service.authenticate(loggedIn.token), (error) => error.code === "SESSION_EXPIRED");
});

test("a user changes their own password and revokes every prior session", async () => {
  const { service, store } = createService();
  const loggedIn = await service.login({
    propertySlug: "hotel-jurua-palace", username: "admin", role: "recepcionista",
    password: "Recepcao-inicial-2026!",
  });

  await service.changePassword({
    session: loggedIn.session,
    currentPassword: "Recepcao-inicial-2026!",
    newPassword: "Recepcao-nova-2026!",
  });
  await assert.rejects(service.authenticate(loggedIn.token), (error) => error.code === "SESSION_REVOKED");
  await assert.rejects(
    service.login({ propertySlug: "hotel-jurua-palace", username: "admin", role: "recepcionista", password: "Recepcao-inicial-2026!" }),
    (error) => error.code === "INVALID_CREDENTIALS",
  );
  const relogged = await service.login({
    propertySlug: "hotel-jurua-palace", username: "admin", role: "recepcionista", password: "Recepcao-nova-2026!",
  });
  assert.equal(relogged.session.sessionVersion, 2);
  const events = await store.listAuditEvents({
    tenantId: "tenant-czs", propertyId: "property-jurua-palace",
  });
  const event = events.find(({ action }) => action === "credential.password_changed");
  assert.deepEqual(event.actor, { username: "admin", role: "recepcionista" });
  assert.deepEqual(event.changes, {
    targetUsername: "admin", targetRole: "recepcionista", sessionVersion: 2,
  });
  assert.equal(JSON.stringify(event).includes("Recepcao-nova-2026!"), false);
  assert.equal(JSON.stringify(event).includes("passwordHash"), false);
});

test("only principal administrators, owners and superadmins reset another role", async () => {
  const { service, store } = createService();
  const admin = await service.login({
    propertySlug: "hotel-jurua-palace", username: "admin", role: "administrador",
    password: "Admin-inicial-2026!",
  });
  const reception = await service.login({
    propertySlug: "hotel-jurua-palace", username: "admin", role: "recepcionista",
    password: "Recepcao-inicial-2026!",
  });

  await assert.rejects(
    service.resetPassword({ session: reception.session, targetRole: "camareira", newPassword: "Camareira-nova-2026!" }),
    (error) => error.code === "FORBIDDEN",
  );
  await service.resetPassword({
    session: admin.session,
    targetRole: "camareira",
    newPassword: "Camareira-nova-2026!",
  });
  const maid = await service.login({
    propertySlug: "hotel-jurua-palace", username: "admin", role: "camareira",
    password: "Camareira-nova-2026!",
  });
  assert.equal(maid.session.role, "camareira");
  const events = await store.listAuditEvents({
    tenantId: "tenant-czs", propertyId: "property-jurua-palace",
  });
  const event = events.find(({ action }) => action === "credential.password_reset");
  assert.deepEqual(event.actor, { username: "admin", role: "administrador" });
  assert.deepEqual(event.changes, {
    targetUsername: "admin", targetRole: "camareira", sessionVersion: 1,
  });
  assert.equal(JSON.stringify(event).includes("Camareira-nova-2026!"), false);
  assert.equal(JSON.stringify(event).includes("passwordHash"), false);
});

test("memory credential repository scopes profiles and never aliases mutable values", async () => {
  const store = createMemoryStore();
  const profile = {
    tenantId: "tenant-czs", propertyId: "property-jurua-palace", username: "admin", role: "auditor",
    passwordHash: "scrypt$test", sessionVersion: 1, failedAttempts: 0, lockedUntil: null,
    forceChange: true, updatedAt: "2026-07-14T12:00:00.000Z",
  };
  await store.upsertCredentialProfile(profile);
  profile.failedAttempts = 99;

  const stored = await store.getCredentialProfile({
    tenantId: "tenant-czs", propertyId: "property-jurua-palace", username: "admin", role: "auditor",
  });
  assert.equal(stored.failedAttempts, 0);
  stored.failedAttempts = 50;
  const updated = await store.updateCredentialProfile({
    tenantId: "tenant-czs", propertyId: "property-jurua-palace", username: "admin", role: "auditor",
    changes: { failedAttempts: 1 },
  });
  assert.equal(updated.failedAttempts, 1);
  assert.equal(await store.getCredentialProfile({
    tenantId: "tenant-vale-demo", propertyId: "property-jurua-palace", username: "admin", role: "auditor",
  }), null);
});

test("stale credential provisioning cannot overwrite a profile created by another caller", async () => {
  const store = createMemoryStore();
  const scope = {
    tenantId: "tenant-czs",
    propertyId: "property-jurua-palace",
    username: "admin",
    role: "recepcionista",
  };
  const resetPassword = "Recepcao-reset-2026!";
  await store.upsertCredentialProfile({
    ...scope,
    passwordHash: await hashPassword(resetPassword),
    sessionVersion: 7,
    failedAttempts: 0,
    lockedUntil: null,
    forceChange: false,
    updatedAt: "2026-07-14T11:59:00.000Z",
  });

  const storedGet = store.getCredentialProfile.bind(store);
  let staleRead = true;
  store.getCredentialProfile = async (candidate) => {
    if (staleRead) {
      staleRead = false;
      return null;
    }
    return storedGet(candidate);
  };
  const { service } = createService({ store });

  await assert.rejects(
    service.login({
      propertySlug: "hotel-jurua-palace",
      username: "admin",
      role: "recepcionista",
      password: "Recepcao-inicial-2026!",
    }),
    (error) => error.code === "INVALID_CREDENTIALS",
  );
  const preserved = await storedGet(scope);
  assert.equal(preserved.sessionVersion, 7);
  assert.equal(await verifyPassword(resetPassword, preserved.passwordHash), true);
});
