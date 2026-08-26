"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  STATIC_OCCUPIED_TABLES,
  calculateReservation,
  buildPixPayload,
  createArizonaAdminSessionManager,
  createReservationStore,
} = require("../arizona-ranch");

test("mantém a sessão administrativa separada do login Google", () => {
  const admin = createArizonaAdminSessionManager({
    environment: {
      ARIZONA_ADMIN_USERNAME: "admin-teste",
      ARIZONA_ADMIN_PASSWORD: "senha-de-teste",
      ARIZONA_ADMIN_SESSION_SECRET: "segredo-de-teste-com-tamanho-seguro",
    },
    now: () => new Date("2026-08-03T12:00:00.000Z"),
  });

  const token = admin.authenticate({ username: "admin-teste", password: "senha-de-teste" });
  assert.ok(token);
  assert.deepEqual(admin.verify(token), { username: "admin-teste" });
  assert.equal(admin.authenticate({ username: "admin-teste", password: "incorreta" }), null);
  assert.match(admin.createSessionCookie(token, { secure: true }), /HttpOnly/);
  assert.match(admin.createSessionCookie(token, { secure: true }), /SameSite=Strict/);
  assert.match(admin.clearSessionCookie({ secure: true }), /Max-Age=0/);
});

test("reaproveita a senha administrativa já configurada no catálogo", () => {
  const admin = createArizonaAdminSessionManager({
    environment: {
      FULL_ADMIN_PASSWORD: "senha-global-de-teste",
      SITE_AUTH_SESSION_SECRET: "segredo-global-de-teste-com-tamanho-seguro",
      NODE_ENV: "production",
    },
  });

  const token = admin.authenticate({ username: "arizona", password: "senha-global-de-teste" });
  assert.ok(token);
  assert.deepEqual(admin.verify(token), { username: "arizona" });
});

test("cobra o valor integral conforme a quantidade de lugares", () => {
  assert.deepEqual(calculateReservation(2), {
    seats: 2,
    amountCents: 10000,
    amountLabel: "R$ 100,00",
  });
  assert.deepEqual(calculateReservation(4), {
    seats: 4,
    amountCents: 20000,
    amountLabel: "R$ 200,00",
  });
  assert.throws(() => calculateReservation(3), /2 ou 4 lugares/i);
});

test("gera Pix copia e cola para a chave direta", () => {
  const payload = buildPixPayload({
    pixKey: "+5568992056283",
    amountCents: 20000,
    reference: "ARIZONA-12-ABCD",
  });

  assert.match(payload, /^000201/);
  assert.match(payload, /BR.GOV.BCB.PIX/);
  assert.match(payload, /5568992056283/);
  assert.match(payload, /200.00/);
  assert.match(payload, /6304[0-9A-F]{4}$/);
});

test("não libera mesa já ocupada nem duplica reserva pendente", () => {
  const store = createReservationStore({ now: () => new Date("2026-07-31T12:00:00.000Z") });
  assert.equal(STATIC_OCCUPIED_TABLES.has(22), true);
  assert.throws(() => store.create({ tableNumber: 22, seats: 2, user: { sub: "u1", email: "a@teste.com" } }), /indisponível/i);

  const { reservation, accessToken } = store.create({ tableNumber: 12, seats: 4 });
  assert.ok(accessToken);
  assert.equal(reservation.status, "awaiting_payment");
  assert.throws(() => store.create({ tableNumber: 12, seats: 2, user: { sub: "u2", email: "b@teste.com" } }), /indisponível/i);
});

test("admin libera mesa confirmada para voltar ao mapa de reservas", () => {
  const store = createReservationStore({ now: () => new Date("2026-08-03T12:00:00.000Z") });
  const { reservation } = store.create({ tableNumber: 3, seats: 4 });

  store.review({ id: reservation.id, action: "confirm", adminEmail: "admin@teste.com" });
  assert.equal(store.tables().find((table) => table.number === 3).status, "reserved");

  const released = store.review({ id: reservation.id, action: "release", adminEmail: "admin@teste.com" });
  assert.equal(released.status, "released");
  assert.equal(released.statusLabel, "Liberada");
  assert.equal(store.tables().find((table) => table.number === 3).status, "available");

  const { reservation: nextReservation } = store.create({ tableNumber: 3, seats: 2 });
  assert.equal(nextReservation.tableNumber, 3);
});

test("salva nome e e-mail ajustados após o acesso Google", () => {
  const store = createReservationStore({ now: () => new Date("2026-08-03T12:00:00.000Z") });
  const { reservation } = store.create({
    tableNumber: 13,
    seats: 2,
    user: { sub: "google-user-1", name: "Conta Google", email: "conta@google.test" },
    customer: { name: "Maria da Silva", email: "maria@exemplo.com" },
  });

  assert.equal(reservation.customer.name, "Maria da Silva");
  assert.equal(reservation.customer.email, "maria@exemplo.com");
});

test("o comprovante público exige o token secreto da reserva", () => {
  const store = createReservationStore({ now: () => new Date("2026-08-03T12:00:00.000Z") });
  const { reservation, accessToken } = store.create({ tableNumber: 14, seats: 2 });

  assert.throws(
    () => store.addReceipt({ id: reservation.id, accessToken: "token-incorreto", receipt: { dataUrl: "data:image/png;base64,AAAA", fileName: "pix.png", mimeType: "image/png" } }),
    /acesso/i,
  );
  const updated = store.addReceipt({ id: reservation.id, accessToken, receipt: { dataUrl: "data:image/png;base64,AAAA", fileName: "pix.png", mimeType: "image/png" } });
  assert.equal(updated.status, "receipt_submitted");
});
