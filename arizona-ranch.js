"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const QRCode = require("qrcode");

const PUBLIC_PREFIX = "/pagamentos/ai";
const API_PREFIX = "/api/arizona-ranch";
const RESERVATION_TTL_MS = 24 * 60 * 60 * 1000;
const PIX_KEY_DEFAULT = "556899582615";
const WHATSAPP_DEFAULT = "556899582615";
const STATIC_OCCUPIED_TABLES = new Set([9, 22, 28, 29, 30, 31, 33, 39, 40, 41, 42, 45, 50, 52, 57, 65, 67]);

function formatCurrency(amountCents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
    .format(Number(amountCents) / 100)
    .replace(/\u00a0/g, " ");
}

function calculateReservation(rawSeats) {
  const seats = Number(rawSeats);
  if (seats !== 2 && seats !== 4) {
    throw new Error("Escolha uma mesa de 2 ou 4 lugares.");
  }

  const amountCents = seats === 2 ? 10000 : 20000;
  return { seats, amountCents, amountLabel: formatCurrency(amountCents) };
}

function emvField(id, value) {
  const normalized = String(value ?? "");
  return `${id}${String(Buffer.byteLength(normalized, "utf8")).padStart(2, "0")}${normalized}`;
}

function crc16(payload) {
  let crc = 0xffff;
  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function buildPixPayload({ pixKey, amountCents, reference }) {
  const key = String(pixKey || PIX_KEY_DEFAULT).replace(/\D/g, "");
  const amount = (Number(amountCents) / 100).toFixed(2);
  const txid = String(reference || "ARIZONA").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "ARIZONA";
  const merchantAccount = emvField("00", "BR.GOV.BCB.PIX") + emvField("01", key);
  const additionalData = emvField("05", txid);
  const payload = [
    emvField("00", "01"),
    emvField("26", merchantAccount),
    emvField("52", "0000"),
    emvField("53", "986"),
    emvField("54", amount),
    emvField("58", "BR"),
    emvField("59", "ARIZONA RANCH"),
    emvField("60", "CRUZEIRO DO SUL"),
    emvField("62", additionalData),
  ].join("");
  const payloadForCrc = `${payload}6304`;
  return `${payloadForCrc}${crc16(payloadForCrc)}`;
}

function statusLabel(status) {
  return {
    awaiting_payment: "Aguardando pagamento",
    receipt_submitted: "Comprovante enviado",
    confirmed: "Confirmada",
    rejected: "Recusada",
    expired: "Expirada",
  }[status] || "Em análise";
}

function normalizeState(state) {
  if (!state || typeof state !== "object") {
    return { version: 1, reservations: [] };
  }
  return {
    version: 1,
    reservations: Array.isArray(state.reservations) ? state.reservations : [],
  };
}

function createReservationStore({ filePath = "", now = () => new Date() } = {}) {
  let memoryState = { version: 1, reservations: [] };

  function load() {
    if (!filePath) {
      return normalizeState(memoryState);
    }
    try {
      return normalizeState(JSON.parse(fs.readFileSync(filePath, "utf8")));
    } catch (error) {
      if (error && error.code === "ENOENT") {
        return { version: 1, reservations: [] };
      }
      throw error;
    }
  }

  function save(state) {
    const normalized = normalizeState(state);
    if (!filePath) {
      memoryState = normalized;
      return;
    }
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(temporaryPath, JSON.stringify(normalized, null, 2), "utf8");
    fs.renameSync(temporaryPath, filePath);
  }

  function refreshExpired(state) {
    const nowMs = now().getTime();
    let changed = false;
    for (const reservation of state.reservations) {
      if (
        (reservation.status === "awaiting_payment" || reservation.status === "receipt_submitted") &&
        new Date(reservation.expiresAt).getTime() <= nowMs
      ) {
        reservation.status = "expired";
        reservation.expiredAt = new Date(nowMs).toISOString();
        changed = true;
      }
    }
    if (changed) {
      save(state);
    }
    return state;
  }

  function withFreshState() {
    return refreshExpired(load());
  }

  function isTableLocked(reservation) {
    return ["awaiting_payment", "receipt_submitted", "confirmed"].includes(reservation.status);
  }

  function getTableStatus(state, tableNumber) {
    if (STATIC_OCCUPIED_TABLES.has(tableNumber)) {
      return "unavailable";
    }
    const reservation = state.reservations.find((item) => item.tableNumber === tableNumber && isTableLocked(item));
    if (!reservation) {
      return "available";
    }
    return reservation.status === "confirmed" ? "reserved" : "pending";
  }

  function publicReservation(reservation, { includeOwner = false } = {}) {
    if (!reservation) {
      return null;
    }
    const result = {
      id: reservation.id,
      tableNumber: reservation.tableNumber,
      seats: reservation.seats,
      amountCents: reservation.amountCents,
      amountLabel: formatCurrency(reservation.amountCents),
      status: reservation.status,
      statusLabel: statusLabel(reservation.status),
      createdAt: reservation.createdAt,
      expiresAt: reservation.expiresAt,
      receipt: reservation.receipt
        ? {
            name: reservation.receipt.name,
            contentType: reservation.receipt.contentType,
            size: reservation.receipt.size,
            uploadedAt: reservation.receipt.uploadedAt,
            reviewedAt: reservation.receipt.reviewedAt || null,
          }
        : null,
      reviewedAt: reservation.reviewedAt || null,
      reviewerEmail: reservation.reviewerEmail || null,
      history: Array.isArray(reservation.history) ? reservation.history : [],
    };
    if (includeOwner) {
      result.customer = {
        name: reservation.customer.name,
        email: reservation.customer.email,
        phone: reservation.customer.phone || "",
      };
    }
    return result;
  }

  function findReservation(state, id) {
    return state.reservations.find((reservation) => reservation.id === id) || null;
  }

  return {
    create({ tableNumber: rawTableNumber, seats: rawSeats, user, phone = "" }) {
      const tableNumber = Number(rawTableNumber);
      if (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > 67) {
        throw new Error("Mesa inválida.");
      }
      if (!user || !user.sub || !user.email) {
        throw new Error("Entre com sua conta Google para reservar.");
      }
      const reservationInfo = calculateReservation(rawSeats);
      const state = withFreshState();
      if (getTableStatus(state, tableNumber) !== "available") {
        throw new Error("Esta mesa está indisponível no momento.");
      }
      const createdAt = now();
      const id = `AR-${createdAt.getTime().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      const reservation = {
        id,
        tableNumber,
        seats: reservationInfo.seats,
        amountCents: reservationInfo.amountCents,
        status: "awaiting_payment",
        createdAt: createdAt.toISOString(),
        expiresAt: new Date(createdAt.getTime() + RESERVATION_TTL_MS).toISOString(),
        customer: {
          sub: String(user.sub),
          name: String(user.name || user.givenName || "Cliente"),
          email: String(user.email).toLowerCase(),
          phone: String(phone || "").replace(/[^0-9+()\-\s]/g, "").slice(0, 30),
        },
        receipt: null,
        history: [{ type: "created", at: createdAt.toISOString() }],
      };
      state.reservations.push(reservation);
      save(state);
      return publicReservation(reservation, { includeOwner: true });
    },

    get(id) {
      return findReservation(withFreshState(), id);
    },

    getPublic(id, options) {
      return publicReservation(this.get(id), options);
    },

    listForOwner(ownerSub) {
      const state = withFreshState();
      return state.reservations
        .filter((reservation) => reservation.customer.sub === String(ownerSub))
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        .map((reservation) => publicReservation(reservation, { includeOwner: true }));
    },

    listForAdmin() {
      return withFreshState()
        .reservations.slice()
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        .map((reservation) => publicReservation(reservation, { includeOwner: true }));
    },

    tables() {
      const state = withFreshState();
      return Array.from({ length: 67 }, (_, index) => {
        const number = index + 1;
        return { number, status: getTableStatus(state, number) };
      });
    },

    addReceipt({ id, ownerSub, receipt }) {
      const state = withFreshState();
      const reservation = findReservation(state, id);
      if (!reservation) {
        throw new Error("Reserva não encontrada.");
      }
      if (reservation.customer.sub !== String(ownerSub)) {
        throw new Error("Você não pode alterar esta reserva.");
      }
      if (!["awaiting_payment", "receipt_submitted"].includes(reservation.status)) {
        throw new Error("Esta reserva não aceita mais comprovantes.");
      }
      reservation.receipt = receipt;
      reservation.status = "receipt_submitted";
      reservation.history.push({ type: "receipt_submitted", at: now().toISOString() });
      save(state);
      return publicReservation(reservation, { includeOwner: true });
    },

    review({ id, action, adminEmail }) {
      const state = withFreshState();
      const reservation = findReservation(state, id);
      if (!reservation) {
        throw new Error("Reserva não encontrada.");
      }
      const reviewedAt = now().toISOString();
      if (action === "confirm") {
        reservation.status = "confirmed";
      } else if (action === "reject") {
        reservation.status = "rejected";
      } else if (action === "review_receipt") {
        if (!reservation.receipt) {
          throw new Error("Nenhum comprovante foi enviado.");
        }
        reservation.receipt.reviewedAt = reviewedAt;
      } else {
        throw new Error("Ação administrativa inválida.");
      }
      reservation.reviewedAt = reviewedAt;
      reservation.reviewerEmail = String(adminEmail || "").toLowerCase();
      reservation.history.push({ type: action, at: reviewedAt, by: reservation.reviewerEmail });
      save(state);
      return publicReservation(reservation, { includeOwner: true });
    },
  };
}

function cleanUser(user) {
  if (!user || !user.sub || !user.email) {
    return null;
  }
  return {
    sub: String(user.sub),
    email: String(user.email).toLowerCase(),
    name: String(user.name || user.givenName || "Cliente"),
    givenName: String(user.givenName || ""),
  };
}

function getAdminEmails(environment) {
  return [
    environment.ARIZONA_ADMIN_GOOGLE_EMAILS,
    environment.ADMIN_GOOGLE_EMAILS,
    environment.SUPER_ADMIN_EMAIL,
  ]
    .filter(Boolean)
    .join(",")
    .split(/[,;\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function buildWhatsAppUrl({ reservation, phoneNumber }) {
  const phone = String(phoneNumber || WHATSAPP_DEFAULT).replace(/\D/g, "");
  const message = [
    "Olá! Enviei o comprovante da minha reserva no Arizona Ranch.",
    `Pedido: ${reservation.id}`,
    `Mesa: ${reservation.tableNumber} (${reservation.seats} lugares)`,
    `Valor: ${reservation.amountLabel}`,
    `Nome: ${reservation.customer.name}`,
  ].join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function readRequestJson(request, maxBytes = 6 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let failed = false;
    request.on("data", (chunk) => {
      if (failed) {
        return;
      }
      total += chunk.length;
      if (total > maxBytes) {
        failed = true;
        reject(new Error("O arquivo enviado é maior que 4 MB."));
        return;
      }
      chunks.push(chunk);
    });
    request.on("error", reject);
    request.on("end", () => {
      if (failed) {
        return;
      }
      try {
        const raw = Buffer.concat(chunks).toString("utf8").trim();
        resolve(raw ? JSON.parse(raw) : {});
      } catch (_error) {
        reject(new Error("Dados inválidos."));
      }
    });
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(message);
}

function dataUrlToBuffer(dataUrl) {
  const matched = String(dataUrl || "").match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!matched) {
    throw new Error("Envie um comprovante em formato válido.");
  }
  return { contentType: matched[1].toLowerCase(), buffer: Buffer.from(matched[2].replace(/\s/g, ""), "base64") };
}

function getReceiptExtension(contentType) {
  return {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
  }[contentType] || "";
}

function createArizonaRanchIntegration({ rootDir, dataDir, environment = process.env, sendFile, getAuthUser }) {
  if (typeof sendFile !== "function" || typeof getAuthUser !== "function") {
    throw new Error("A integração Arizona Ranch precisa do servidor principal.");
  }

  const publicRoot = path.join(rootDir, "pagamentos", "ai");
  const storageRoot = path.join(dataDir, "arizona-ranch");
  const receiptRoot = path.join(storageRoot, "receipts");
  const store = createReservationStore({ filePath: path.join(storageRoot, "reservations.json") });
  const pixKey = String(environment.ARIZONA_PIX_KEY || PIX_KEY_DEFAULT).trim();
  const whatsappNumber = String(environment.ARIZONA_WHATSAPP_NUMBER || WHATSAPP_DEFAULT).trim();
  const adminEmails = new Set(getAdminEmails(environment));

  function getUser(request) {
    return cleanUser(getAuthUser(request));
  }

  function isAdmin(user) {
    return Boolean(user && adminEmails.has(user.email));
  }

  function requireUser(request, response) {
    const user = getUser(request);
    if (!user) {
      sendJson(response, 401, { ok: false, error: "Entre com sua conta Google para continuar." });
      return null;
    }
    return user;
  }

  function requireAdmin(request, response) {
    const user = requireUser(request, response);
    if (!user) {
      return null;
    }
    if (!isAdmin(user)) {
      sendJson(response, 403, { ok: false, error: "Esta conta não possui acesso administrativo." });
      return null;
    }
    return user;
  }

  function serializeForUser(reservation, user, admin = false) {
    const isOwner = reservation && reservation.customer && reservation.customer.sub === user.sub;
    if (!reservation || (!admin && !isOwner)) {
      return null;
    }
    return store.getPublic(reservation.id, { includeOwner: admin || isOwner });
  }

  function paymentDetails(reservation) {
    const pixCode = buildPixPayload({
      pixKey,
      amountCents: reservation.amountCents,
      reference: reservation.id,
    });
    return QRCode.toDataURL(pixCode, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 420,
      color: { dark: "#17120e", light: "#fffaf0" },
    }).then((qrCodeDataUrl) => ({
      pixCode,
      qrCodeDataUrl,
      whatsappUrl: buildWhatsAppUrl({ reservation, phoneNumber: whatsappNumber }),
    }));
  }

  async function handleApi(request, response, pathname) {
    const route = pathname.slice(API_PREFIX.length) || "/";
    try {
      if (request.method === "GET" && route === "/config") {
        const user = getUser(request);
        sendJson(response, 200, {
          ok: true,
          whatsappNumber,
          prices: { 2: calculateReservation(2), 4: calculateReservation(4) },
          staticOccupiedTables: [...STATIC_OCCUPIED_TABLES],
          session: {
            signedIn: Boolean(user),
            user: user ? { email: user.email, name: user.name } : null,
            isAdmin: isAdmin(user),
          },
        });
        return;
      }

      if (request.method === "GET" && route === "/tables") {
        sendJson(response, 200, { ok: true, tables: store.tables() });
        return;
      }

      if (request.method === "GET" && route === "/reservations/me") {
        const user = requireUser(request, response);
        if (!user) {
          return;
        }
        sendJson(response, 200, { ok: true, reservations: store.listForOwner(user.sub) });
        return;
      }

      if (request.method === "POST" && route === "/reservations") {
        const user = requireUser(request, response);
        if (!user) {
          return;
        }
        const payload = await readRequestJson(request);
        const reservation = store.create({
          tableNumber: payload.tableNumber,
          seats: payload.seats,
          phone: payload.phone,
          user,
        });
        const payment = await paymentDetails(reservation);
        sendJson(response, 201, { ok: true, reservation, payment });
        return;
      }

      const receiptDownload = route.match(/^\/reservations\/([A-Za-z0-9-]+)\/receipt$/);
      if (request.method === "GET" && receiptDownload) {
        const user = requireUser(request, response);
        if (!user) {
          return;
        }
        const reservation = store.get(receiptDownload[1]);
        const isOwner = reservation && reservation.customer.sub === user.sub;
        if (!reservation || (!isOwner && !isAdmin(user)) || !reservation.receipt) {
          sendJson(response, 404, { ok: false, error: "Comprovante não encontrado." });
          return;
        }
        const receiptPath = path.join(receiptRoot, reservation.receipt.fileName);
        if (!fs.existsSync(receiptPath)) {
          sendJson(response, 404, { ok: false, error: "Arquivo do comprovante não encontrado." });
          return;
        }
        await sendFile(request, response, receiptPath, { cacheControl: "no-store" });
        return;
      }

      const receiptUpload = route.match(/^\/reservations\/([A-Za-z0-9-]+)\/receipt$/);
      if (request.method === "POST" && receiptUpload) {
        const user = requireUser(request, response);
        if (!user) {
          return;
        }
        const payload = await readRequestJson(request);
        const uploaded = dataUrlToBuffer(payload.dataUrl);
        const extension = getReceiptExtension(uploaded.contentType);
        if (!extension || uploaded.buffer.length === 0 || uploaded.buffer.length > 4 * 1024 * 1024) {
          throw new Error("Envie uma imagem ou PDF de até 4 MB.");
        }
        const id = receiptUpload[1];
        const existing = store.get(id);
        if (!existing) {
          throw new Error("Reserva não encontrada.");
        }
        if (existing.customer.sub !== user.sub) {
          throw new Error("Você não pode alterar esta reserva.");
        }
        if (!["awaiting_payment", "receipt_submitted"].includes(existing.status)) {
          throw new Error("Esta reserva não aceita mais comprovantes.");
        }
        const safeFileName = `${id}.${extension}`;
        fs.mkdirSync(receiptRoot, { recursive: true });
        fs.writeFileSync(path.join(receiptRoot, safeFileName), uploaded.buffer);
        const reservation = store.addReceipt({
          id,
          ownerSub: user.sub,
          receipt: {
            name: String(payload.fileName || `comprovante.${extension}`).slice(0, 120),
            contentType: uploaded.contentType,
            size: uploaded.buffer.length,
            uploadedAt: new Date().toISOString(),
            fileName: safeFileName,
          },
        });
        sendJson(response, 200, { ok: true, reservation });
        return;
      }

      const reservationRoute = route.match(/^\/reservations\/([A-Za-z0-9-]+)$/);
      if (request.method === "GET" && reservationRoute) {
        const user = requireUser(request, response);
        if (!user) {
          return;
        }
        const reservation = store.get(reservationRoute[1]);
        const publicReservation = serializeForUser(reservation, user, isAdmin(user));
        if (!publicReservation) {
          sendJson(response, 404, { ok: false, error: "Reserva não encontrada." });
          return;
        }
        const payment = reservation.status === "awaiting_payment" || reservation.status === "receipt_submitted"
          ? await paymentDetails(publicReservation)
          : null;
        sendJson(response, 200, { ok: true, reservation: publicReservation, payment });
        return;
      }

      if (request.method === "GET" && route === "/admin/reservations") {
        const user = requireAdmin(request, response);
        if (!user) {
          return;
        }
        sendJson(response, 200, { ok: true, reservations: store.listForAdmin() });
        return;
      }

      const adminReservation = route.match(/^\/admin\/reservations\/([A-Za-z0-9-]+)$/);
      if (request.method === "PATCH" && adminReservation) {
        const user = requireAdmin(request, response);
        if (!user) {
          return;
        }
        const payload = await readRequestJson(request);
        const reservation = store.review({
          id: adminReservation[1],
          action: payload.action,
          adminEmail: user.email,
        });
        sendJson(response, 200, { ok: true, reservation });
        return;
      }

      sendJson(response, 404, { ok: false, error: "Rota não encontrada." });
    } catch (error) {
      const message = error && error.message ? error.message : "Não foi possível concluir a solicitação.";
      const statusCode = /indisponível|não aceita mais/i.test(message) ? 409 : 400;
      sendJson(response, statusCode, { ok: false, error: message });
    }
  }

  async function handleStatic(request, response, pathname) {
    if (pathname !== PUBLIC_PREFIX && !pathname.startsWith(`${PUBLIC_PREFIX}/`)) {
      return false;
    }
    if (pathname === PUBLIC_PREFIX) {
      response.writeHead(302, { Location: `${PUBLIC_PREFIX}/` });
      response.end();
      return true;
    }
    const relativePath = pathname === `${PUBLIC_PREFIX}/admin/` || pathname === `${PUBLIC_PREFIX}/admin`
      ? "admin.html"
      : pathname.slice(`${PUBLIC_PREFIX}/`.length) || "index.html";
    const resolvedPath = path.resolve(publicRoot, relativePath);
    if (!resolvedPath.startsWith(`${publicRoot}${path.sep}`) || !fs.existsSync(resolvedPath) || fs.statSync(resolvedPath).isDirectory()) {
      sendText(response, 404, "Página não encontrada.");
      return true;
    }
    await sendFile(request, response, resolvedPath, {
      cacheControl: /\.html$/i.test(resolvedPath) ? "no-store" : "public, max-age=3600",
    });
    return true;
  }

  return { handleApi, handleStatic };
}

module.exports = {
  API_PREFIX,
  PUBLIC_PREFIX,
  STATIC_OCCUPIED_TABLES,
  buildPixPayload,
  calculateReservation,
  createArizonaRanchIntegration,
  createReservationStore,
};
