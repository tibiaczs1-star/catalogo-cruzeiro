"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const {
  calculateInventoryPricing,
  calculateSaleResult,
  normalizeCondition,
  validateMoney,
} = require("./domain");

function initialState() {
  return {
    schemaVersion: 1,
    inventory: [],
    sales: [],
    expenses: [],
    cashEntries: [],
    documents: [],
    updatedAt: new Date(0).toISOString(),
  };
}

function cleanText(value, maxLength = 500) {
  return String(value || "").trim().slice(0, maxLength);
}

function requiredText(value, label, maxLength = 500) {
  const text = cleanText(value, maxLength);
  if (!text) throw new TypeError(`${label} é obrigatório.`);
  return text;
}

function integerAtLeast(value, minimum, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum) {
    throw new TypeError(`${label} inválido.`);
  }
  return number;
}

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function createJsonStore(options = {}) {
  const filePath = path.resolve(options.filePath);
  const catalog = Array.isArray(options.catalog) ? options.catalog : [];
  const catalogByKey = new Map(catalog.map((product) => [product.key, product]));
  let queue = Promise.resolve();

  async function readState() {
    try {
      return JSON.parse(await fs.readFile(filePath, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      return initialState();
    }
  }

  async function writeState(state) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    state.updatedAt = new Date().toISOString();
    const temporaryPath = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
    await fs.writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
    await fs.rename(temporaryPath, filePath);
  }

  function mutate(mutator) {
    const operation = queue.then(async () => {
      const state = await readState();
      const result = await mutator(state);
      await writeState(state);
      return copy(result);
    });
    queue = operation.catch(() => undefined);
    return operation;
  }

  async function initialize() {
    await mutate((state) => state);
  }

  async function addInventory(input = {}) {
    return mutate((state) => {
      const product = catalogByKey.get(cleanText(input.catalogKey, 160));
      if (!product) throw new TypeError("Produto do catálogo não encontrado.");
      const quantity = integerAtLeast(input.quantity, 1, "Quantidade");
      const condition = normalizeCondition(input.condition);
      const warrantyDays = integerAtLeast(input.warrantyDays ?? 0, 0, "Garantia");
      const pricing = calculateInventoryPricing(input);
      const inventory = {
        id: crypto.randomUUID(),
        catalogKey: product.key,
        name: product.name,
        category: product.category,
        family: product.family,
        year: product.year,
        quantity,
        condition,
        warrantyDays,
        batteryHealth: input.batteryHealth === "" || input.batteryHealth == null
          ? null
          : integerAtLeast(input.batteryHealth, 0, "Saúde da bateria"),
        imei: cleanText(input.imei, 40),
        serialNumber: cleanText(input.serialNumber, 80),
        color: cleanText(input.color, 80),
        storage: cleanText(input.storage, 80),
        notes: cleanText(input.notes, 2_000),
        published: Boolean(input.published),
        purchasePriceCents: validateMoney(input.purchasePriceCents || 0, "preço de compra"),
        freightCents: validateMoney(input.freightCents || 0, "frete"),
        motoboyCents: validateMoney(input.motoboyCents || 0, "motoboy"),
        packagingCents: validateMoney(input.packagingCents || 0, "embalagem"),
        preparationCents: validateMoney(input.preparationCents || 0, "preparação"),
        warrantyReserveCents: validateMoney(input.warrantyReserveCents || 0, "garantia"),
        webPriceCents: validateMoney(input.webPriceCents || 0, "preço web"),
        pickupPriceCents: validateMoney(input.pickupPriceCents || 0, "preço retirada"),
        ...pricing,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (inventory.batteryHealth != null && inventory.batteryHealth > 100) {
        throw new TypeError("Saúde da bateria deve ficar entre 0 e 100.");
      }
      state.inventory.push(inventory);
      return inventory;
    });
  }

  async function updateInventory(id, patch = {}) {
    return mutate((state) => {
      const inventory = state.inventory.find((item) => item.id === id);
      if (!inventory) throw new TypeError("Item de estoque não encontrado.");
      if (patch.quantity != null) inventory.quantity = integerAtLeast(patch.quantity, 0, "Quantidade");
      if (patch.published != null) inventory.published = Boolean(patch.published);
      if (patch.warrantyDays != null) {
        inventory.warrantyDays = integerAtLeast(patch.warrantyDays, 0, "Garantia");
      }
      for (const field of [
        "purchasePriceCents",
        "freightCents",
        "motoboyCents",
        "packagingCents",
        "preparationCents",
        "warrantyReserveCents",
        "webPriceCents",
        "pickupPriceCents",
      ]) {
        if (patch[field] != null) inventory[field] = validateMoney(patch[field], field);
      }
      if (patch.condition != null) inventory.condition = normalizeCondition(patch.condition);
      for (const field of ["imei", "serialNumber", "color", "storage", "notes"]) {
        if (patch[field] != null) inventory[field] = cleanText(patch[field], field === "notes" ? 2_000 : 80);
      }
      Object.assign(inventory, calculateInventoryPricing(inventory));
      inventory.updatedAt = new Date().toISOString();
      return inventory;
    });
  }

  async function getInventory(id) {
    const state = await readState();
    const item = state.inventory.find((inventory) => inventory.id === id);
    return item ? copy(item) : null;
  }

  async function listInventory() {
    const state = await readState();
    return copy(state.inventory.slice().reverse());
  }

  async function listMasterCatalog() {
    return copy(catalog);
  }

  async function listPublicCatalog() {
    const state = await readState();
    return copy(
      state.inventory
        .filter((item) => item.published && item.quantity > 0)
        .map((item) => ({ ...catalogByKey.get(item.catalogKey), ...item })),
    );
  }

  async function createSale(input = {}) {
    return mutate((state) => {
      const inventory = state.inventory.find((item) => item.id === input.inventoryId);
      if (!inventory) throw new TypeError("Item de estoque não encontrado.");
      const quantity = integerAtLeast(input.quantity || 1, 1, "Quantidade");
      if (quantity > inventory.quantity) throw new TypeError("Estoque insuficiente.");
      const paymentMethods = ["cash", "pix", "card", "transfer", "online"];
      const paymentMethod = cleanText(input.paymentMethod, 30);
      if (!paymentMethods.includes(paymentMethod)) throw new TypeError("Forma de pagamento inválida.");
      const tradeIn = input.tradeIn && input.tradeIn.model
        ? {
            model: requiredText(input.tradeIn.model, "Modelo do aparelho de entrada", 160),
            imei: cleanText(input.tradeIn.imei, 40),
            condition: normalizeCondition(input.tradeIn.condition || "used"),
            appraisedValueCents: validateMoney(
              input.tradeIn.appraisedValueCents || 0,
              "valor do aparelho de entrada",
            ),
            notes: cleanText(input.tradeIn.notes, 1_000),
          }
        : null;
      const sale = {
        id: crypto.randomUUID(),
        inventoryId: inventory.id,
        catalogKey: inventory.catalogKey,
        productName: inventory.name,
        quantity,
        customerName: requiredText(input.customerName, "Nome do cliente", 160),
        customerDocument: cleanText(input.customerDocument, 40),
        customerPhone: cleanText(input.customerPhone, 40),
        customerAddress: cleanText(input.customerAddress, 400),
        priceCents: validateMoney(input.priceCents || 0, "preço da venda"),
        discountCents: validateMoney(input.discountCents || 0, "desconto"),
        paymentMethod,
        tradeIn,
        status: "pending",
        warrantyDays: inventory.warrantyDays,
        condition: inventory.condition,
        imei: inventory.imei,
        serialNumber: inventory.serialNumber,
        totalCostCents: inventory.totalCostCents * quantity,
        settlementKey: "",
        createdAt: new Date().toISOString(),
        paidAt: null,
      };
      state.sales.push(sale);
      return sale;
    });
  }

  async function settleSale(id, input = {}) {
    return mutate((state) => {
      const sale = state.sales.find((item) => item.id === id);
      if (!sale) throw new TypeError("Venda não encontrada.");
      const idempotencyKey = requiredText(input.idempotencyKey, "Chave da baixa", 160);
      if (sale.status === "paid") {
        if (sale.settlementKey === idempotencyKey) return sale;
        throw new TypeError("Venda já baixada.");
      }
      const inventory = state.inventory.find((item) => item.id === sale.inventoryId);
      if (!inventory || inventory.quantity < sale.quantity) {
        throw new TypeError("Estoque insuficiente para concluir a baixa.");
      }
      const paymentMethod = cleanText(input.paymentMethod || sale.paymentMethod, 30);
      if (!["cash", "pix", "card", "transfer", "online"].includes(paymentMethod)) {
        throw new TypeError("Forma de pagamento inválida.");
      }
      const result = calculateSaleResult({
        totalCostCents: sale.totalCostCents,
        receivedCents: input.receivedCents,
        paymentFeeCents: input.paymentFeeCents,
        discountCents: sale.discountCents,
        saleExpensesCents: input.saleExpensesCents,
      });
      inventory.quantity -= sale.quantity;
      if (inventory.quantity === 0) inventory.published = false;
      inventory.updatedAt = new Date().toISOString();
      Object.assign(sale, result, {
        status: "paid",
        paymentMethod,
        receivedCents: validateMoney(input.receivedCents, "valor recebido"),
        paymentFeeCents: validateMoney(input.paymentFeeCents || 0, "taxa"),
        saleExpensesCents: validateMoney(input.saleExpensesCents || 0, "despesas"),
        settlementKey: idempotencyKey,
        paidAt: new Date().toISOString(),
      });
      state.cashEntries.push({
        id: crypto.randomUUID(),
        saleId: sale.id,
        type: "income",
        paymentMethod,
        amountCents: sale.receivedCents,
        description: `Venda ${sale.productName}`,
        createdAt: sale.paidAt,
      });
      return sale;
    });
  }

  async function listSales() {
    const state = await readState();
    return copy(state.sales.slice().reverse());
  }

  async function getSale(id) {
    const state = await readState();
    const sale = state.sales.find((item) => item.id === id);
    return sale ? copy(sale) : null;
  }

  async function addExpense(input = {}) {
    return mutate((state) => {
      const expense = {
        id: crypto.randomUUID(),
        description: requiredText(input.description, "Descrição", 240),
        category: cleanText(input.category || "other", 80),
        amountCents: validateMoney(input.amountCents, "valor da despesa"),
        occurredAt: cleanText(input.occurredAt || new Date().toISOString().slice(0, 10), 20),
        notes: cleanText(input.notes, 1_000),
        createdAt: new Date().toISOString(),
      };
      state.expenses.push(expense);
      state.cashEntries.push({
        id: crypto.randomUUID(),
        expenseId: expense.id,
        type: "expense",
        paymentMethod: cleanText(input.paymentMethod || "cash", 30),
        amountCents: expense.amountCents,
        description: expense.description,
        createdAt: expense.createdAt,
      });
      return expense;
    });
  }

  async function listExpenses() {
    const state = await readState();
    return copy(state.expenses.slice().reverse());
  }

  async function listCashEntries() {
    const state = await readState();
    return copy(state.cashEntries.slice().reverse());
  }

  async function addDocument(input = {}) {
    return mutate((state) => {
      const document = {
        id: crypto.randomUUID(),
        name: requiredText(input.name, "Nome do documento", 240),
        mimeType: requiredText(input.mimeType, "Tipo do documento", 120),
        size: integerAtLeast(input.size || 0, 0, "Tamanho"),
        relativePath: requiredText(input.relativePath, "Caminho do documento", 500),
        kind: cleanText(input.kind || "other", 80),
        saleId: cleanText(input.saleId, 80),
        expenseId: cleanText(input.expenseId, 80),
        createdAt: new Date().toISOString(),
      };
      state.documents.push(document);
      return document;
    });
  }

  async function listDocuments() {
    const state = await readState();
    return copy(state.documents.slice().reverse());
  }

  async function getDocument(id) {
    const state = await readState();
    const document = state.documents.find((item) => item.id === id);
    return document ? copy(document) : null;
  }

  async function getDashboard() {
    const state = await readState();
    const paidSales = state.sales.filter((sale) => sale.status === "paid");
    return {
      stockUnits: state.inventory.reduce((sum, item) => sum + item.quantity, 0),
      activeProducts: state.inventory.filter((item) => item.published && item.quantity > 0).length,
      pendingSales: state.sales.filter((sale) => sale.status === "pending").length,
      paidSales: paidSales.length,
      grossRevenueCents: paidSales.reduce((sum, sale) => sum + (sale.receivedCents || 0), 0),
      profitCents: paidSales.reduce((sum, sale) => sum + (sale.profitCents || 0), 0),
      expensesCents: state.expenses.reduce((sum, expense) => sum + expense.amountCents, 0),
      documentCount: state.documents.length,
      updatedAt: state.updatedAt,
    };
  }

  return {
    addDocument,
    addExpense,
    addInventory,
    createSale,
    getDashboard,
    getDocument,
    getInventory,
    getSale,
    initialize,
    listCashEntries,
    listDocuments,
    listExpenses,
    listInventory,
    listMasterCatalog,
    listPublicCatalog,
    listSales,
    settleSale,
    updateInventory,
  };
}

module.exports = { createJsonStore };
