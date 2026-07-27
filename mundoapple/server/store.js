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
const { buildDemoDataset, buildReports } = require("./demo");

const MIN_DELIVERY_FEE_CENTS = 3_000;
const DELIVERY_PROVIDERS = [
  { id: "99-entrega", label: "99 Entrega" },
  { id: "logistica-local", label: "Logística local" },
  { id: "preco-a-combinar", label: "Preço a combinar" },
];

function initialState() {
  return {
    schemaVersion: 1,
    inventory: [],
    sales: [],
    expenses: [],
    cashEntries: [],
    documents: [],
    settings: {
      delivery: {
        baseFeeCents: MIN_DELIVERY_FEE_CENTS,
      },
    },
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

function normalizeColorHex(value) {
  const hex = cleanText(value, 7).toLowerCase();
  return /^#[0-9a-f]{6}$/.test(hex) ? hex : "#8b8f88";
}

function normalizeColorVariants(value, fallbackColor = "", fallbackQuantity = 0) {
  const source = Array.isArray(value) ? value : [];
  const variants = [];
  const byName = new Map();

  for (const rawVariant of source) {
    const name = requiredText(rawVariant?.name, "Nome da cor", 80);
    const key = name.toLocaleLowerCase("pt-BR");
    const quantity = integerAtLeast(rawVariant?.quantity ?? 0, 0, `Quantidade da cor ${name}`);
    if (byName.has(key)) {
      variants[byName.get(key)].quantity += quantity;
      continue;
    }
    byName.set(key, variants.length);
    variants.push({
      name,
      hex: normalizeColorHex(rawVariant?.hex),
      quantity,
    });
  }

  if (variants.length) return variants;
  const color = cleanText(fallbackColor, 80);
  const quantity = Number(fallbackQuantity);
  return color && Number.isSafeInteger(quantity) && quantity >= 0
    ? [{ name: color, hex: "#8b8f88", quantity }]
    : [];
}

function colorVariantTotal(variants) {
  return variants.reduce((total, variant) => total + variant.quantity, 0);
}

function availableColorVariant(inventory, requestedColor = "") {
  const variants = normalizeColorVariants(
    inventory.colorVariants,
    inventory.color,
    inventory.quantity,
  );
  if (!variants.length) return { variants, selected: null };
  const requested = cleanText(requestedColor, 80).toLocaleLowerCase("pt-BR");
  const selected = requested
    ? variants.find((variant) => variant.name.toLocaleLowerCase("pt-BR") === requested)
    : variants.filter((variant) => variant.quantity > 0).length === 1
      ? variants.find((variant) => variant.quantity > 0)
      : null;
  return { variants, selected };
}

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function deliverySettings(state) {
  const configuredFeeCents = Number(state.settings?.delivery?.baseFeeCents);
  const baseFeeCents = Number.isSafeInteger(configuredFeeCents)
    && configuredFeeCents >= MIN_DELIVERY_FEE_CENTS
    ? configuredFeeCents
    : MIN_DELIVERY_FEE_CENTS;
  return {
    baseFeeCents,
    minimumFeeCents: MIN_DELIVERY_FEE_CENTS,
    region: "Cruzeiro do Sul e Vale do Juruá",
    providers: copy(DELIVERY_PROVIDERS),
  };
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
    await mutate((state) => {
      state.settings ||= {};
      state.settings.delivery ||= { baseFeeCents: MIN_DELIVERY_FEE_CENTS };
      if (
        !Number.isSafeInteger(Number(state.settings.delivery.baseFeeCents))
        || Number(state.settings.delivery.baseFeeCents) < MIN_DELIVERY_FEE_CENTS
      ) {
        state.settings.delivery.baseFeeCents = MIN_DELIVERY_FEE_CENTS;
      }
      return state;
    });
  }

  async function getDeliverySettings() {
    return deliverySettings(await readState());
  }

  async function updateDeliverySettings(input = {}) {
    const baseFeeCents = Number(input.baseFeeCents);
    if (!Number.isSafeInteger(baseFeeCents) || baseFeeCents < MIN_DELIVERY_FEE_CENTS) {
      throw new TypeError("A taxa mínima de envio é R$ 30,00.");
    }
    return mutate((state) => {
      state.settings ||= {};
      state.settings.delivery = { baseFeeCents };
      return deliverySettings(state);
    });
  }

  async function addInventory(input = {}) {
    return mutate((state) => {
      const product = catalogByKey.get(cleanText(input.catalogKey, 160));
      if (!product) throw new TypeError("Produto do catálogo não encontrado.");
      const hasColorVariants = Array.isArray(input.colorVariants) && input.colorVariants.length > 0;
      const fallbackQuantity = hasColorVariants
        ? 0
        : integerAtLeast(input.quantity, 1, "Quantidade");
      const colorVariants = normalizeColorVariants(
        input.colorVariants,
        input.color,
        fallbackQuantity,
      );
      const quantity = hasColorVariants ? colorVariantTotal(colorVariants) : fallbackQuantity;
      if (quantity < 1) throw new TypeError("Quantidade inválido.");
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
        color: colorVariants.find((variant) => variant.quantity > 0)?.name
          || cleanText(input.color, 80),
        colorVariants,
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
      if (patch.colorVariants != null) {
        inventory.colorVariants = normalizeColorVariants(patch.colorVariants);
        inventory.quantity = colorVariantTotal(inventory.colorVariants);
        inventory.color = inventory.colorVariants.find((variant) => variant.quantity > 0)?.name || "";
      } else if (patch.quantity != null) {
        const nextQuantity = integerAtLeast(patch.quantity, 0, "Quantidade");
        const variants = normalizeColorVariants(
          inventory.colorVariants,
          inventory.color,
          inventory.quantity,
        );
        if (variants.length) {
          const otherQuantity = variants.slice(1).reduce((total, variant) => total + variant.quantity, 0);
          variants[0].quantity = Math.max(0, nextQuantity - otherQuantity);
          inventory.colorVariants = variants;
          inventory.quantity = colorVariantTotal(variants);
        } else {
          inventory.quantity = nextQuantity;
        }
      }
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
      const colorSelection = availableColorVariant(inventory, input.selectedColor);
      if (colorSelection.variants.length) {
        if (!colorSelection.selected || colorSelection.selected.quantity < quantity) {
          throw new TypeError("Cor indisponível para a quantidade solicitada.");
        }
        inventory.colorVariants = colorSelection.variants;
      }
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
        selectedColor: colorSelection.selected?.name || cleanText(input.selectedColor, 80),
        selectedColorHex: colorSelection.selected?.hex || "",
        customerName: requiredText(input.customerName, "Nome do cliente", 160),
        customerDocument: cleanText(input.customerDocument, 40),
        customerPhone: cleanText(input.customerPhone, 40),
        customerAddress: cleanText(input.customerAddress, 400),
        priceCents: validateMoney(input.priceCents || 0, "preço da venda"),
        subtotalCents: validateMoney(input.subtotalCents ?? input.priceCents ?? 0, "subtotal"),
        deliveryFeeCents: validateMoney(input.deliveryFeeCents || 0, "taxa de envio"),
        deliveryMode: cleanText(input.deliveryMode, 30),
        deliveryProvider: cleanText(input.deliveryProvider, 80),
        deliveryProviderLabel: cleanText(input.deliveryProviderLabel, 120),
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
      const colorSelection = availableColorVariant(inventory, sale.selectedColor);
      if (colorSelection.variants.length) {
        if (!colorSelection.selected || colorSelection.selected.quantity < sale.quantity) {
          throw new TypeError("Cor indisponível para concluir a baixa.");
        }
        colorSelection.selected.quantity -= sale.quantity;
        inventory.colorVariants = colorSelection.variants;
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
      inventory.quantity = inventory.colorVariants?.length
        ? colorVariantTotal(inventory.colorVariants)
        : inventory.quantity - sale.quantity;
      inventory.color = inventory.colorVariants?.find((variant) => variant.quantity > 0)?.name
        || inventory.color
        || "";
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

  async function seedDemo(options = {}) {
    return mutate((state) => {
      const dataset = buildDemoDataset(catalog, options);
      state.inventory = state.inventory.filter((item) => !item.isDemo);
      state.sales = state.sales.filter((item) => !item.isDemo);
      state.expenses = state.expenses.filter((item) => !item.isDemo);
      state.cashEntries = state.cashEntries.filter((item) => !item.isDemo);
      state.documents = state.documents.filter((item) => !item.isDemo);
      state.inventory.push(...dataset.inventory);
      state.sales.push(...dataset.sales);
      state.expenses.push(...dataset.expenses);
      state.cashEntries.push(...dataset.cashEntries);
      return {
        ownerUsername: String(options.ownerUsername || "matheus").toLowerCase(),
        productCount: dataset.inventory.length,
        saleCount: dataset.sales.length,
        reportReady: true,
      };
    });
  }

  async function clearDemo() {
    return mutate((state) => {
      const before = [
        state.inventory,
        state.sales,
        state.expenses,
        state.cashEntries,
        state.documents,
      ].reduce((sum, items) => sum + items.filter((item) => item.isDemo).length, 0);
      state.inventory = state.inventory.filter((item) => !item.isDemo);
      state.sales = state.sales.filter((item) => !item.isDemo);
      state.expenses = state.expenses.filter((item) => !item.isDemo);
      state.cashEntries = state.cashEntries.filter((item) => !item.isDemo);
      state.documents = state.documents.filter((item) => !item.isDemo);
      return { removedCount: before };
    });
  }

  async function getReports(options = {}) {
    return copy(buildReports(await readState(), options));
  }

  return {
    addDocument,
    addExpense,
    addInventory,
    clearDemo,
    createSale,
    getDashboard,
    getDeliverySettings,
    getDocument,
    getInventory,
    getReports,
    getSale,
    initialize,
    listCashEntries,
    listDocuments,
    listExpenses,
    listInventory,
    listMasterCatalog,
    listPublicCatalog,
    listSales,
    seedDemo,
    settleSale,
    updateDeliverySettings,
    updateInventory,
  };
}

module.exports = { createJsonStore };
