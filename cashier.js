"use strict";

const fs = require("fs");
const path = require("path");

const API_PREFIX = "/api/cashier";
const DEFAULT_CATEGORIES = [
  { id: "beer", label: "Cerveja", color: "#FFC107" },
  { id: "shot", label: "Shot", color: "#FF5722" },
  { id: "drink", label: "Drink", color: "#4CAF50" },
  { id: "whisky", label: "Whisky", color: "#795548" },
  { id: "energy", label: "Energético", color: "#00BCD4" },
  { id: "water", label: "Água/Refri", color: "#2196F3" },
  { id: "snack", label: "Petisco", color: "#FF9800" },
  { id: "combo", label: "Combo", color: "#9C27B0" },
];

function normalizeState(state) {
  if (!state || typeof state !== "object") return { version: 1, sales: [] };
  return {
    version: 1,
    sales: Array.isArray(state.sales) ? state.sales : [],
    categories: Array.isArray(state.categories) ? state.categories : DEFAULT_CATEGORIES,
  };
}

function createCashierStore({ filePath = "" } = {}) {
  let memoryState = normalizeState();

  function load() {
    if (!filePath) return memoryState;
    try { return normalizeState(JSON.parse(fs.readFileSync(filePath, "utf8"))); }
    catch (error) { if (error?.code === "ENOENT") return normalizeState({ categories: DEFAULT_CATEGORIES }); throw error; }
  }

  function save(state) {
    const normalized = normalizeState(state);
    if (!filePath) { memoryState = normalized; return; }
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(normalized, null, 2), "utf8");
    fs.renameSync(tmp, filePath);
  }

  function reset() {
    const empty = normalizeState({ categories: DEFAULT_CATEGORIES });
    save(empty);
    return empty;
  }

  function registerSale({ categoryId, itemName, quantity, unitPriceCents, paymentMethod, operator = "", notes = "" }) {
    const state = load();
    const category = state.categories.find((c) => c.id === categoryId) || state.categories[0];
    const qty = Number(quantity) || 1;
    const price = Math.max(0, Number(unitPriceCents) || 0);
    const total = qty * price;
    const sale = {
      id: `CX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      categoryId: category.id,
      categoryLabel: category.label,
      itemName: String(itemName || "").trim(),
      quantity: qty,
      unitPriceCents: price,
      totalCents: total,
      paymentMethod: String(paymentMethod || "pix").toLowerCase(),
      operator: String(operator || "").trim(),
      notes: String(notes || "").trim(),
      createdAt: new Date().toISOString(),
    };
    state.sales.push(sale);
    save(state);
    return sale;
  }

  function summary() {
    const state = load();
    const sales = state.sales.slice();
    const total = sales.reduce((s, r) => s + r.totalCents, 0);
    const byPayment = sales.reduce((acc, sale) => {
      const key = sale.paymentMethod || "outro";
      acc[key] = (acc[key] || 0) + sale.totalCents;
      return acc;
    }, {});
    return {
      totalSales: sales.length,
      totalRevenue: total,
      totalRevenueLabel: formatCurrency(total),
      byPayment,
    };
  }

  function list({ limit = 100, offset = 0 } = {}) {
    const state = load();
    const sorted = state.sales.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return sorted.slice(offset, offset + limit);
  }

  function categories() {
    return load().categories;
  }

  return { load, save, reset, registerSale, summary, list, categories };
}

function formatCurrency(cents) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cents) / 100);
}

function createCashierIntegration({ dataDir, environment = process.env }) {
  const storageRoot = path.join(dataDir, "cashier");
  const store = createCashierStore({ filePath: path.join(storageRoot, "sales.json") });

  function isAdmin(request) {
    const session = String(request?.headers?.cookie || "")
      .split(";").map((c) => c.trim().split("=")).find(([k]) => k === "arizona_ranch_admin");
    return Boolean(session);
  }

  function sendJson(response, statusCode, payload) {
    response.writeHead(statusCode, { "content-type": "application/json", "x-content-type-options": "nosniff" });
    response.end(JSON.stringify(payload));
  }

  function readJson(request) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      request.on("data", (chunk) => chunks.push(chunk));
      request.on("end", () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
        catch { reject(new Error("JSON inválido.")); }
      });
      request.on("error", () => reject(new Error("Erro ao ler requisição.")));
    });
  }

  async function handleApi(request, response, pathname) {
    const route = pathname.slice(API_PREFIX) || "/";
    try {
      if (request.method === "GET" && route === "/categories") {
        return sendJson(response, 200, { ok: true, categories: store.categories() });
      }

      if (request.method === "GET" && route === "/sales") {
        const limit = Number(request.url.match(/limit=(\d+)/)?.[1]) || 100;
        return sendJson(response, 200, { ok: true, sales: store.list({ limit: Math.min(limit, 500) }) });
      }

      if (request.method === "GET" && route === "/summary") {
        return sendJson(response, 200, { ok: true, summary: store.summary() });
      }

      if (request.method === "POST" && route === "/sales") {
        if (!isAdmin(request)) return sendJson(response, 401, { ok: false, error: "Acesso administrativo necessário." });
        const payload = await readJson(request);
        if (!payload.itemName || !payload.unitPriceCents) return sendJson(response, 400, { ok: false, error: "Informe item e preço." });
        const sale = store.registerSale({
          categoryId: payload.categoryId || "beer",
          itemName: payload.itemName,
          quantity: payload.quantity || 1,
          unitPriceCents: payload.unitPriceCents,
          paymentMethod: payload.paymentMethod || "pix",
          operator: payload.operator || "",
          notes: payload.notes || "",
        });
        return sendJson(response, 201, { ok: true, sale });
      }

      if (request.method === "POST" && route === "/reset") {
        if (!isAdmin(request)) return sendJson(response, 401, { ok: false, error: "Acesso administrativo necessário." });
        return sendJson(response, 200, { ok: true, data: store.reset() });
      }

      return sendJson(response, 404, { ok: false, error: "Rota não encontrada." });
    } catch (error) {
      return sendJson(response, 400, { ok: false, error: error?.message || "Erro inesperado." });
    }
  }

  return { handleApi };
}

module.exports = {
  API_PREFIX,
  DEFAULT_CATEGORIES,
  createCashierIntegration,
  createCashierStore,
  formatCurrency,
};
