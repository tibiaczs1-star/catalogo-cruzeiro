"use strict";

const CATEGORY_QUOTAS = new Map([
  ["iPhone", 15],
  ["Mac", 8],
  ["iPad", 7],
  ["Apple Watch", 6],
  ["AirPods", 5],
  ["Casa e TV", 4],
  ["Outros", 5],
]);

const COLORS = [
  "Titânio natural",
  "Preto espacial",
  "Azul profundo",
  "Prateado",
  "Verde alpino",
  "Branco estelar",
  "Grafite",
  "Rosa",
];

const COLOR_HEX = {
  "Titânio natural": "#c7b9a8",
  "Titânio preto": "#3c3b3d",
  "Titânio branco": "#e7e4df",
  "Preto espacial": "#2f3033",
  "Cinza espacial": "#6e7074",
  "Azul profundo": "#394e68",
  "Azul-céu": "#a8c4d1",
  Azul: "#4b718e",
  Prateado: "#d6d7d8",
  "Verde alpino": "#58645b",
  "Branco estelar": "#eee8dd",
  Estelar: "#eee8dd",
  Branco: "#f4f1ea",
  Preto: "#1d1d1f",
  Grafite: "#55545a",
  Rosa: "#e8b8ba",
  Roxo: "#b7a4cb",
  Laranja: "#e99562",
  Amarelo: "#e9d87a",
  "Meia-noite": "#252b34",
};

const PAYMENT_METHODS = ["pix", "card", "cash", "online", "transfer"];

function stableNumber(value) {
  return [...String(value)].reduce((total, character, index) => {
    return (total + character.charCodeAt(0) * (index + 17)) % 1_000_003;
  }, 0);
}

function dateDaysAgo(days, hour = 14) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function selectDemoProducts(catalog, count = 50) {
  const requested = Math.max(1, Math.min(Number(count) || 50, catalog.length));
  const ordered = [];
  const selectedKeys = new Set();

  for (const [category, quota] of CATEGORY_QUOTAS) {
    const categoryProducts = catalog
      .filter((product) => product.category === category)
      .sort((a, b) => b.year - a.year || a.name.localeCompare(b.name, "pt-BR"));
    for (const product of categoryProducts.slice(0, quota)) {
      ordered.push(product);
      selectedKeys.add(product.key);
    }
  }

  if (ordered.length < requested) {
    const remaining = catalog
      .filter((product) => !selectedKeys.has(product.key))
      .sort((a, b) => b.year - a.year || a.name.localeCompare(b.name, "pt-BR"));
    ordered.push(...remaining.slice(0, requested - ordered.length));
  }

  return ordered.slice(0, requested);
}

function retailAnchorCents(product) {
  const name = product.name.toLowerCase();

  if (name.includes("airtag")) return 69_900;
  if (name.includes("apple pencil")) return 149_900;
  if (name.includes("studio display xdr")) return 3_299_900;
  if (name.includes("studio display")) return 1_699_900;
  if (name.includes("vision pro")) return 3_999_900;

  if (product.category === "iPhone") {
    if (name.includes("17 pro max")) return 1_199_900;
    if (name.includes("17 pro")) return 999_900;
    if (name.includes("17e")) return 499_900;
    if (name.includes("iphone 17")) return 699_900;
    if (name.includes("iphone air")) return 899_900;
    if (name.includes("16 pro max")) return 999_900;
    if (name.includes("16 pro")) return 849_900;
    if (name.includes("16 plus")) return 699_900;
    if (name.includes("16e")) return 399_900;
    if (name.includes("iphone 16")) return 599_900;
    if (name.includes("15 pro max")) return 849_900;
    if (name.includes("15 pro")) return 699_900;
    if (name.includes("15 plus")) return 549_900;
    if (name.includes("iphone 15")) return 499_900;
    return 399_900;
  }

  if (product.category === "Mac") {
    if (name.includes("m3 ultra")) return 3_999_900;
    if (name.includes("m4 max")) return 2_499_900;
    if (name.includes("macbook pro")) return 1_699_900;
    if (name.includes("imac")) return 1_199_900;
    if (name.includes("15 polegadas")) return 899_900;
    return 799_900;
  }

  if (product.category === "iPad") {
    if (name.includes("pro 13")) return 1_299_900;
    if (name.includes("pro 11")) return 999_900;
    if (name.includes("air 13")) return 799_900;
    if (name.includes("air 11")) return 599_900;
    return 399_900;
  }

  if (product.category === "Apple Watch") {
    if (name.includes("ultra")) return 849_900;
    if (name.includes("se")) return 249_900;
    if (name.includes("series 11")) return 449_900;
    if (name.includes("series 10")) return 389_900;
    return 329_900;
  }

  if (product.category === "AirPods") {
    if (name.includes("max")) return 549_900;
    if (name.includes("pro")) return 239_900;
    if (name.includes("cancelamento")) return 189_900;
    return 139_900;
  }

  if (name.includes("homepod mini")) return 129_900;
  if (name.includes("homepod")) return 299_900;
  if (name.includes("apple tv") && name.includes("3ª")) return 139_900;
  if (name.includes("apple tv")) return 119_900;
  return 199_900;
}

function storageFor(product, index) {
  const seed = stableNumber(product.key) + index;
  const name = product.name.toLowerCase();
  let options = [];

  if (product.category === "iPhone" && (name.includes("16e") || name.includes("17e") || name.includes(" se"))) {
    options = ["128 GB", "256 GB", "512 GB"];
  } else if (product.category === "iPhone" && name.includes("pro max")) {
    options = ["256 GB", "512 GB", "1 TB"];
  } else if (product.category === "iPhone" && name.includes("pro")) {
    options = ["128 GB", "256 GB", "512 GB", "1 TB"];
  } else if (product.category === "iPhone") {
    options = ["128 GB", "256 GB", "512 GB"];
  }
  else if (product.category === "Mac") options = ["256 GB", "512 GB", "1 TB", "2 TB"];
  else if (product.category === "iPad" && name.includes("pro")) options = ["128 GB", "256 GB", "512 GB", "1 TB", "2 TB"];
  else if (product.category === "iPad" && name.includes("air")) options = ["128 GB", "256 GB", "512 GB", "1 TB"];
  else if (product.category === "iPad") options = ["128 GB", "256 GB", "512 GB"];
  else if (name.includes("apple tv")) options = ["64 GB", "128 GB"];
  else if (name.includes("vision pro")) options = ["256 GB", "512 GB", "1 TB"];

  return options.length ? options[seed % options.length] : "";
}

function colorOptionsFor(product) {
  const name = product.name.toLowerCase();
  let options = COLORS;

  if (name.includes("airtag") || name.includes("pencil") || name.includes("vision pro")) options = ["Branco"];
  else if (name.includes("studio display")) options = ["Prateado"];
  else if (name.includes("apple tv")) options = ["Preto"];
  else if (name.includes("homepod")) options = ["Meia-noite", "Branco"];
  else if (product.category === "iPhone" && (name.includes("16e") || name.includes("17e"))) {
    options = ["Preto", "Branco"];
  } else if (product.category === "iPhone" && name.includes("pro")) {
    options = ["Titânio natural", "Titânio preto", "Titânio branco", "Azul profundo"];
  } else if (product.category === "Mac" && name.includes("macbook pro")) {
    options = ["Preto espacial", "Prateado"];
  } else if (product.category === "Mac" && name.includes("macbook air")) {
    options = ["Meia-noite", "Branco estelar", "Prateado", "Azul-céu"];
  } else if (product.category === "iPad" && name.includes("pro")) {
    options = ["Prateado", "Preto espacial"];
  } else if (product.category === "iPad" && name.includes("air")) {
    options = ["Azul", "Roxo", "Cinza espacial", "Branco estelar"];
  } else if (product.category === "iPad") {
    options = ["Azul", "Rosa", "Amarelo", "Prateado"];
  }
  else if (product.category === "AirPods") options = name.includes("max")
    ? ["Meia-noite", "Azul", "Roxo", "Laranja", "Estelar"]
    : ["Branco"];
  else if (product.category === "Apple Watch") options = ["Preto", "Prateado", "Titânio natural"];

  return options;
}

function colorFor(product, index) {
  const seed = stableNumber(product.key) + index;
  const options = colorOptionsFor(product);
  return options[seed % options.length];
}

function colorVariantsFor(product, index, totalQuantity) {
  const options = colorOptionsFor(product);
  const start = (stableNumber(product.key) + index) % options.length;
  const variantCount = Math.min(options.length, totalQuantity, 4);
  const variants = Array.from({ length: variantCount }, (_, offset) => {
    const name = options[(start + offset) % options.length];
    return {
      name,
      hex: COLOR_HEX[name] || "#8b8f88",
      quantity: 1,
    };
  });
  for (let remaining = totalQuantity - variantCount, offset = 0; remaining > 0; remaining -= 1) {
    variants[offset % variants.length].quantity += 1;
    offset += 1;
  }
  return variants;
}

function pricingFor(product, index, condition) {
  const seed = stableNumber(product.key);
  const retailAnchor = retailAnchorCents(product);
  const conditionFactor = condition === "new" ? 1 : 0.82;
  const variationFactor = 0.97 + (seed % 7) * 0.01;
  const targetRetailCents = Math.round(retailAnchor * conditionFactor * variationFactor);
  const purchasePriceCents = Math.round(
    retailAnchor * (condition === "new" ? 0.68 : 0.58) * variationFactor,
  );
  const freightCents = 4_900 + (index % 4) * 1_300;
  const motoboyCents = 1_500 + (index % 3) * 800;
  const packagingCents = 1_200 + (index % 2) * 700;
  const preparationCents = condition === "used" ? 8_900 : 3_900;
  const warrantyReserveCents = Math.round(purchasePriceCents * (condition === "new" ? 0.025 : 0.04));
  const totalCostCents =
    purchasePriceCents
    + freightCents
    + motoboyCents
    + packagingCents
    + preparationCents
    + warrantyReserveCents;
  const webPriceCents = Math.ceil(
    Math.max(targetRetailCents, totalCostCents * (condition === "new" ? 1.2 : 1.25)) / 1_000,
  ) * 1_000;
  const pickupPriceCents = webPriceCents - Math.max(5_000, Math.round(webPriceCents * 0.025));

  return {
    purchasePriceCents,
    freightCents,
    motoboyCents,
    packagingCents,
    preparationCents,
    warrantyReserveCents,
    totalCostCents,
    webPriceCents,
    pickupPriceCents,
    projectedWebProfitCents: webPriceCents - totalCostCents,
    projectedPickupProfitCents: pickupPriceCents - totalCostCents,
    projectedWebMarginPercent: Number((((webPriceCents - totalCostCents) / webPriceCents) * 100).toFixed(2)),
    projectedPickupMarginPercent: Number((((pickupPriceCents - totalCostCents) / pickupPriceCents) * 100).toFixed(2)),
  };
}

function buildDemoDataset(catalog, options = {}) {
  const ownerUsername = String(options.ownerUsername || "matheus").trim().toLowerCase() || "matheus";
  const products = selectDemoProducts(catalog, options.count || 50);
  const inventory = products.map((product, index) => {
    const condition = index % 4 === 3 ? "used" : "new";
    const pricing = pricingFor(product, index, condition);
    const quantity = 2 + (index % 3);
    const colorVariants = colorVariantsFor(product, index, quantity);
    return {
      id: `demo-inventory-${product.key}`,
      catalogKey: product.key,
      name: product.name,
      category: product.category,
      family: product.family,
      year: product.year,
      quantity,
      condition,
      warrantyDays: condition === "new" ? 365 : index % 2 ? 180 : 90,
      batteryHealth: condition === "used" && ["iPhone", "Apple Watch"].includes(product.category)
        ? 87 + (index % 10)
        : null,
      imei: "",
      serialNumber: "",
      color: colorVariants[0]?.name || colorFor(product, index),
      colorVariants,
      storage: storageFor(product, index),
      notes: "Produto demonstrativo. Confirme disponibilidade e especificações antes de fechar a venda.",
      published: true,
      artPath: `assets/products-ai/${product.key}.png`,
      isDemo: true,
      ownerUsername,
      ...pricing,
      createdAt: dateDaysAgo(15 - (index % 12), 9 + (index % 8)),
      updatedAt: dateDaysAgo(index % 3, 16),
    };
  });

  const inventoryByCategory = [...CATEGORY_QUOTAS.keys()].map((category) => (
    inventory.filter((item) => item.category === category)
  ));
  const salesInventory = [];
  for (let row = 0; salesInventory.length < Math.min(22, inventory.length); row += 1) {
    let added = false;
    for (const categoryItems of inventoryByCategory) {
      if (categoryItems[row]) {
        salesInventory.push(categoryItems[row]);
        added = true;
        if (salesInventory.length === 22) break;
      }
    }
    if (!added) break;
  }

  const sales = salesInventory.map((item, index) => {
    const paid = index < 18;
    const paymentMethod = PAYMENT_METHODS[index % PAYMENT_METHODS.length];
    const priceCents = index % 3 === 0 ? item.pickupPriceCents : item.webPriceCents;
    const discountCents = index % 4 === 0 ? 5_000 : 0;
    const paymentFeeCents = paymentMethod === "card" || paymentMethod === "online"
      ? Math.round(priceCents * 0.029)
      : 0;
    const saleExpensesCents = index % 3 === 1 ? 2_500 : 0;
    const receivedCents = priceCents - discountCents;
    const profitCents =
      receivedCents - item.totalCostCents - paymentFeeCents - saleExpensesCents;
    const marginPercent = receivedCents > 0 ? Number(((profitCents / receivedCents) * 100).toFixed(2)) : 0;
    const createdAt = dateDaysAgo(11 - (index % 10), 10 + (index % 7));
    return {
      id: `demo-sale-${String(index + 1).padStart(2, "0")}`,
      inventoryId: item.id,
      catalogKey: item.catalogKey,
      productName: item.name,
      category: item.category,
      quantity: 1,
      customerName: `Cliente demonstração ${String(index + 1).padStart(2, "0")}`,
      customerDocument: "",
      customerPhone: "",
      customerAddress: "Cruzeiro do Sul, AC",
      priceCents,
      discountCents,
      paymentMethod,
      tradeIn: index % 7 === 0
        ? {
            model: "iPhone recebido na troca",
            imei: "",
            condition: "used",
            appraisedValueCents: 65_000,
            notes: "Avaliação demonstrativa.",
          }
        : null,
      status: paid ? "paid" : "pending",
      warrantyDays: item.warrantyDays,
      condition: item.condition,
      imei: "",
      serialNumber: "",
      totalCostCents: item.totalCostCents,
      settlementKey: paid ? `demo-settlement-${index + 1}` : "",
      receivedCents: paid ? receivedCents : undefined,
      paymentFeeCents: paid ? paymentFeeCents : undefined,
      saleExpensesCents: paid ? saleExpensesCents : undefined,
      profitCents: paid ? profitCents : undefined,
      marginPercent: paid ? marginPercent : undefined,
      createdAt,
      paidAt: paid ? createdAt : null,
      isDemo: true,
      ownerUsername,
    };
  });

  const expenses = [
    ["Frete transportadora", "logistics", 18_900],
    ["Motoboy local", "logistics", 4_500],
    ["Embalagens premium", "packaging", 12_700],
    ["Impulsionamento local", "marketing", 25_000],
    ["Películas para cortesia", "supplies", 9_800],
    ["Manutenção da loja", "operations", 16_400],
    ["Internet comercial", "operations", 11_900],
  ].map(([description, category, amountCents], index) => ({
    id: `demo-expense-${index + 1}`,
    description,
    category,
    amountCents,
    occurredAt: dateDaysAgo(9 - index, 8).slice(0, 10),
    notes: "Lançamento demonstrativo.",
    createdAt: dateDaysAgo(9 - index, 8),
    isDemo: true,
    ownerUsername,
  }));

  const cashEntries = [
    ...sales
      .filter((sale) => sale.status === "paid")
      .map((sale) => ({
        id: `demo-cash-sale-${sale.id}`,
        saleId: sale.id,
        type: "income",
        paymentMethod: sale.paymentMethod,
        amountCents: sale.receivedCents,
        description: `Venda ${sale.productName}`,
        createdAt: sale.paidAt,
        isDemo: true,
        ownerUsername,
      })),
    ...expenses.map((expense) => ({
      id: `demo-cash-expense-${expense.id}`,
      expenseId: expense.id,
      type: "expense",
      paymentMethod: "pix",
      amountCents: expense.amountCents,
      description: expense.description,
      createdAt: expense.createdAt,
      isDemo: true,
      ownerUsername,
    })),
  ];

  return { inventory, sales, expenses, cashEntries };
}

function groupSum(items, keyResolver, valueResolver = () => 1) {
  const totals = new Map();
  for (const item of items) {
    const key = keyResolver(item);
    totals.set(key, (totals.get(key) || 0) + valueResolver(item));
  }
  return [...totals.entries()].map(([label, value]) => ({ label, value }));
}

function buildReports(state, options = {}) {
  const ownerUsername = String(options.ownerUsername || "matheus").trim().toLowerCase() || "matheus";
  const ownerItems = (items) => items.filter((item) => !item.ownerUsername || item.ownerUsername === ownerUsername);
  const inventory = ownerItems(state.inventory || []);
  const paidSales = ownerItems(state.sales || []).filter((sale) => sale.status === "paid");
  const expenses = ownerItems(state.expenses || []);
  const grossRevenueCents = paidSales.reduce((sum, sale) => sum + (sale.receivedCents || 0), 0);
  const profitCents = paidSales.reduce((sum, sale) => sum + (sale.profitCents || 0), 0);
  const expensesCents = expenses.reduce((sum, expense) => sum + (expense.amountCents || 0), 0);
  const productByInventoryId = new Map(inventory.map((item) => [item.id, item]));
  const timeline = groupSum(
    paidSales,
    (sale) => String(sale.paidAt || sale.createdAt).slice(0, 10),
    (sale) => sale.receivedCents || 0,
  ).sort((a, b) => a.label.localeCompare(b.label));
  const topProducts = groupSum(
    paidSales,
    (sale) => sale.productName,
    (sale) => sale.receivedCents || 0,
  ).sort((a, b) => b.value - a.value).slice(0, 5);

  return {
    profile: {
      username: ownerUsername,
      displayName: ownerUsername === "matheus" ? "Matheus" : ownerUsername,
      role: "Proprietário",
    },
    demo: {
      active: inventory.some((item) => item.isDemo),
      productCount: inventory.filter((item) => item.isDemo && item.published && item.quantity > 0).length,
    },
    summary: {
      grossRevenueCents,
      profitCents,
      expensesCents,
      netProfitCents: profitCents - expensesCents,
      averageTicketCents: paidSales.length ? Math.round(grossRevenueCents / paidSales.length) : 0,
      unitsSold: paidSales.reduce((sum, sale) => sum + (sale.quantity || 0), 0),
      activeProducts: inventory.filter((item) => item.published && item.quantity > 0).length,
      stockUnits: inventory.reduce((sum, item) => sum + (item.quantity || 0), 0),
    },
    paymentMix: groupSum(paidSales, (sale) => sale.paymentMethod, (sale) => sale.receivedCents || 0)
      .sort((a, b) => b.value - a.value),
    categoryMix: groupSum(
      paidSales,
      (sale) => sale.category || productByInventoryId.get(sale.inventoryId)?.category || "Outros",
      (sale) => sale.receivedCents || 0,
    ).sort((a, b) => b.value - a.value),
    conditionMix: groupSum(inventory, (item) => item.condition, (item) => item.quantity || 0)
      .sort((a, b) => b.value - a.value),
    salesTimeline: timeline,
    topProducts,
  };
}

module.exports = {
  buildDemoDataset,
  buildReports,
  selectDemoProducts,
};
