(() => {
  "use strict";

  const API = "/api/mundoapple";
  const ADMIN_CATALOG_ENDPOINT = "/api/mundoapple/admin/catalog";
  const ADMIN_DOCUMENTS_ENDPOINT = "/api/mundoapple/admin/documents";
  const ADMIN_SALES_ENDPOINT = "/api/mundoapple/admin/sales";
  const moneyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
  const pageTitles = {
    dashboard: "Visão geral",
    activate: "Colocar no estoque",
    inventory: "Estoque ativo",
    sales: "Vendas",
    cash: "Caixa",
    expenses: "Despesas",
    documents: "Documentos",
    help: "Ajuda e FAQ",
  };
  const categoryLabels = {
    iphone: "iPhone",
    ipad: "iPad",
    mac: "Mac",
    watch: "Apple Watch",
    airpods: "AirPods",
    tv: "Apple TV",
    accessories: "Acessórios",
  };
  const paymentLabels = {
    cash: "Dinheiro",
    pix: "Pix",
    card: "Maquininha",
    transfer: "Transferência",
    online: "Online",
  };
  const expenseLabels = {
    motoboy: "Motoboy",
    freight: "Frete / transportadora",
    repair: "Reparo / preparação",
    supplies: "Material / embalagem",
    tax: "Taxa",
    other: "Outro",
  };
  const documentLabels = {
    "payment-proof": "Comprovante de pagamento",
    "customer-document": "Documento do cliente",
    "supplier-invoice": "Nota / comprovante do fornecedor",
    warranty: "Garantia",
    other: "Outro",
  };
  const localHelp = [
    {
      id: "dashboard",
      title: "Visão geral",
      summary: "Mostra apenas números já registrados no sistema. Receita e lucro entram depois da confirmação do recebimento da venda.",
    },
    {
      id: "condition",
      title: "Novo ou seminovo",
      summary: "Use “Novo” para aparelho sem uso. Em seminovos, registre bateria, IMEI, conservação e acessórios nas observações.",
    },
    {
      id: "warranty",
      title: "Dias de garantia",
      summary: "É o prazo oferecido pela própria loja e que será mostrado no recibo. Confira a política comercial antes de entregar ao cliente.",
    },
    {
      id: "battery",
      title: "Saúde da bateria",
      summary: "Informe o percentual mostrado nos ajustes do aparelho usado. Deixe vazio quando não se aplicar ou não houver medição.",
    },
    {
      id: "imei",
      title: "IMEI e número de série",
      summary: "Identificadores do aparelho para controle e recibo. Confira os números no dispositivo e evite fotografá-los na vitrine pública.",
    },
    {
      id: "cash",
      title: "Caixa",
      summary: "Entradas são criadas quando uma venda é baixada. Despesas registradas aparecem como saídas. O saldo é entradas menos saídas.",
    },
    {
      id: "expenses",
      title: "Despesas",
      summary: "Campo aberto para motoboy, frete, transportadora, embalagem, reparos, taxas e outros gastos da operação.",
    },
  ];

  const state = {
    catalog: [],
    inventory: [],
    sales: [],
    cash: [],
    expenses: [],
    documents: [],
    help: [],
    dashboard: null,
    catalogCategory: "all",
    catalogQuery: "",
    selectedCatalogKey: "",
    settlementKeys: new Map(),
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
  const cents = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
  const formatMoney = (value) => moneyFormatter.format(cents(value) / 100);
  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? escapeHtml(value) : dateFormatter.format(date);
  };
  const parseMoney = (value) => {
    const raw = String(value ?? "").trim().replace(/[R$\s]/g, "");
    if (!raw) return 0;
    let normalized = raw;
    if (raw.includes(",")) normalized = raw.replace(/\./g, "").replace(",", ".");
    else if ((raw.match(/\./g) || []).length > 1) normalized = raw.replace(/\./g, "");
    else if (/^\d{1,3}\.\d{3}$/.test(raw)) normalized = raw.replace(".", "");
    const number = Number(normalized);
    if (!Number.isFinite(number) || number < 0) {
      throw new TypeError("Informe um valor válido, sem sinal negativo.");
    }
    return Math.round(number * 100);
  };
  const formValue = (form, name) => form.elements.namedItem(name)?.value?.trim?.() || "";
  const setMessage = (element, text, success = false) => {
    element.textContent = text || "";
    element.style.color = success ? "#4f7e18" : "";
  };
  const makeIdempotencyKey = () => globalThis.crypto?.randomUUID?.()
    || `settle-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  async function api(path, options = {}) {
    const endpoint = path.startsWith("/api/") ? path : `${API}${path}`;
    const response = await fetch(endpoint, {
      credentials: "same-origin",
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });
    let payload = {};
    try {
      payload = await response.json();
    } catch {
      payload = { ok: false, error: "Resposta inválida do servidor." };
    }
    if (response.status === 401 && path !== "/auth/login" && path !== "/auth/session") {
      showLogin();
      throw new Error("Sua sessão terminou. Entre novamente.");
    }
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.error || "Não foi possível concluir a operação.");
    }
    return payload;
  }

  function showLogin() {
    $("#login-view").hidden = false;
    $("#admin-app").hidden = true;
    document.body.classList.remove("sidebar-open");
  }

  function showApp() {
    $("#login-view").hidden = true;
    $("#admin-app").hidden = false;
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 3200);
  }

  function goTo(section) {
    if (!pageTitles[section]) section = "dashboard";
    $$(".admin-section").forEach((item) => item.classList.toggle("active", item.dataset.view === section));
    $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.section === section));
    $("#page-title").textContent = pageTitles[section];
    document.body.classList.remove("sidebar-open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showHelp(id) {
    const topic = state.help.find((item) => item.id === id)
      || localHelp.find((item) => item.id === id)
      || { title: "Ajuda", summary: "Abra Ajuda e FAQ para consultar o manual completo do administrativo." };
    $("#help-dialog-title").textContent = topic.title;
    $("#help-dialog-copy").textContent = topic.summary;
    $("#help-dialog").showModal();
  }

  function productMeta(item) {
    return [
      categoryLabels[item.category] || item.category,
      item.year,
      item.storage,
      item.color,
    ].filter(Boolean).join(" · ");
  }

  function categoryClass(value) {
    const category = String(value || "").toLocaleLowerCase("pt-BR");
    if (category.includes("iphone")) return "iphone";
    if (category.includes("ipad")) return "ipad";
    if (category.includes("mac")) return "mac";
    if (category.includes("watch")) return "watch";
    if (category.includes("airpods")) return "airpods";
    if (category.includes("tv") || category.includes("casa")) return "tv";
    return "accessories";
  }

  function renderMasterCategories() {
    const categories = [...new Set(state.catalog.map((item) => item.category))];
    $("#master-categories").innerHTML = [
      ["all", "Todos"],
      ...categories.map((category) => [category, categoryLabels[category] || category]),
    ].map(([value, label]) => (
      `<button type="button" class="${state.catalogCategory === value ? "active" : ""}" data-category="${escapeHtml(value)}">${escapeHtml(label)}</button>`
    )).join("");
  }

  function filteredCatalog() {
    const query = state.catalogQuery.toLocaleLowerCase("pt-BR");
    return state.catalog.filter((item) => {
      const categoryMatches = state.catalogCategory === "all" || item.category === state.catalogCategory;
      const searchMatches = !query || `${item.name} ${item.family} ${item.year}`.toLocaleLowerCase("pt-BR").includes(query);
      return categoryMatches && searchMatches;
    });
  }

  function renderMasterCatalog() {
    renderMasterCategories();
    const items = filteredCatalog();
    $("#catalog-counter").textContent = `${items.length} de ${state.catalog.length} produtos prontos para ativar`;
    $("#master-list").innerHTML = items.length ? items.map((item) => `
      <button class="master-item ${state.selectedCatalogKey === item.key ? "selected" : ""}" type="button" data-catalog-key="${escapeHtml(item.key)}">
        <span class="mini-thumb mini-thumb-${categoryClass(item.category)}"></span>
        <span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(productMeta(item))}</small></span>
        <span>›</span>
      </button>
    `).join("") : `<div class="empty-list"><strong>Nenhum produto encontrado</strong>Tente outro nome ou categoria.</div>`;
  }

  function selectCatalog(key) {
    const item = state.catalog.find((product) => product.key === key);
    if (!item) return;
    state.selectedCatalogKey = key;
    $("#inventory-form").elements.namedItem("catalogKey").value = key;
    $("#selected-product").innerHTML = `
      <div class="product-thumb product-thumb-${categoryClass(item.category)}"><span></span></div>
      <div><small>PRODUTO SELECIONADO</small><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(productMeta(item))}</span></div>
    `;
    renderMasterCatalog();
    if (window.innerWidth < 981) $("#selected-product").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function renderPricePreview() {
    const form = $("#inventory-form");
    let totalCost = 0;
    let webPrice = 0;
    try {
      totalCost = ["purchasePrice", "freight", "motoboy", "packaging", "preparation", "warrantyReserve"]
        .reduce((sum, name) => sum + parseMoney(formValue(form, name)), 0);
      webPrice = parseMoney(formValue(form, "webPrice"));
    } catch {
      return;
    }
    const profit = webPrice - totalCost;
    const margin = webPrice > 0 ? (profit / webPrice) * 100 : 0;
    $("#price-preview").innerHTML = `
      <div><span>Custo total unitário</span><strong>${formatMoney(totalCost)}</strong></div>
      <div><span>Lucro estimado web</span><strong>${formatMoney(profit)}</strong></div>
      <div><span>Margem estimada</span><strong>${margin.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</strong></div>
    `;
  }

  function renderInventory() {
    const query = $("#inventory-search").value.trim().toLocaleLowerCase("pt-BR");
    const items = state.inventory.filter((item) => (
      !query || `${item.name} ${item.imei} ${item.color} ${item.storage}`.toLocaleLowerCase("pt-BR").includes(query)
    ));
    const units = state.inventory.reduce((sum, item) => sum + item.quantity, 0);
    const active = state.inventory.filter((item) => item.published && item.quantity > 0).length;
    $("#inventory-summary").innerHTML = `<strong>${units}</strong> unidades · <strong>${active}</strong> anúncios ativos`;
    $("#inventory-list").innerHTML = items.length ? `
      <table class="data-table">
        <thead><tr><th>Produto</th><th>Estado</th><th>Saldo</th><th>Preço web</th><th>Lucro unit.</th><th>Loja</th><th>Ação</th></tr></thead>
        <tbody>${items.map((item) => `
          <tr>
            <td><div class="table-product"><span class="mini-thumb mini-thumb-${categoryClass(item.category)}"></span><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml([item.storage, item.color, item.imei ? `IMEI ${item.imei}` : ""].filter(Boolean).join(" · "))}</small></div></div></td>
            <td><span class="pill ${item.condition === "new" ? "green" : "orange"}">${item.condition === "new" ? "Novo" : "Seminovo"}</span></td>
            <td><strong>${item.quantity}</strong></td>
            <td>${formatMoney(item.webPriceCents)}</td>
            <td>${formatMoney(item.webProjectedProfitCents)}</td>
            <td><span class="pill ${item.published && item.quantity > 0 ? "green" : ""}">${item.published && item.quantity > 0 ? "Publicado" : "Oculto"}</span></td>
            <td><button class="table-action" type="button" data-toggle-published="${escapeHtml(item.id)}">${item.published ? "Ocultar" : "Publicar"}</button></td>
          </tr>
        `).join("")}</tbody>
      </table>
    ` : `<div class="empty-list"><strong>Nenhum item no estoque</strong>Escolha um produto no catálogo mestre e ative a primeira unidade.</div>`;
  }

  function renderSaleOptions() {
    const active = state.inventory.filter((item) => item.quantity > 0);
    const options = active.map((item) => (
      `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} · ${item.quantity} un. · ${formatMoney(item.webPriceCents)}</option>`
    )).join("");
    $("#sale-inventory").innerHTML = `<option value="">Escolha...</option>${options}`;
    $("#document-sale").innerHTML = `<option value="">Sem vínculo</option>${state.sales.map((sale) => (
      `<option value="${escapeHtml(sale.id)}">${escapeHtml(sale.customerName)} · ${escapeHtml(sale.productName)}</option>`
    )).join("")}`;
  }

  function renderSales() {
    renderSaleOptions();
    $("#sales-list").innerHTML = state.sales.length ? state.sales.map((sale) => {
      const total = cents(sale.priceCents) - cents(sale.discountCents);
      const paid = sale.status === "paid";
      return `
        <article class="stack-card">
          <div class="stack-card-head">
            <div><strong>${escapeHtml(sale.productName)}</strong><small>${escapeHtml(sale.customerName)} · ${sale.quantity} un. · ${formatDate(sale.createdAt)}</small></div>
            <span class="pill ${paid ? "green" : "orange"}">${paid ? "Recebida" : "Pendente"}</span>
          </div>
          ${sale.tradeIn ? `<small>Entrada: ${escapeHtml(sale.tradeIn.model)} · avaliação ${formatMoney(sale.tradeIn.appraisedValueCents)}</small>` : ""}
          <div class="stack-card-bottom">
            <div><small>${paid ? `Recebido em ${paymentLabels[sale.paymentMethod] || sale.paymentMethod}` : "Valor combinado"}</small><strong>${formatMoney(paid ? sale.receivedCents : total)}</strong></div>
            <div class="stack-actions">
              ${paid ? `<button type="button" data-receipt="${escapeHtml(sale.id)}">Imprimir recibo</button>` : `<button class="settle-button" type="button" data-settle="${escapeHtml(sale.id)}">Confirmar recebimento</button>`}
            </div>
          </div>
        </article>
      `;
    }).join("") : `<div class="empty-list"><strong>Nenhuma venda registrada</strong>As vendas aparecerão aqui antes e depois da baixa.</div>`;
  }

  function renderCash() {
    const income = state.cash.filter((item) => item.type === "income").reduce((sum, item) => sum + cents(item.amountCents), 0);
    const expenses = state.cash.filter((item) => item.type === "expense").reduce((sum, item) => sum + cents(item.amountCents), 0);
    const balance = income - expenses;
    $("#cash-metrics").innerHTML = `
      <article><span>Entradas recebidas</span><strong>${formatMoney(income)}</strong><small>Vendas com baixa</small></article>
      <article><span>Saídas registradas</span><strong>${formatMoney(expenses)}</strong><small>Despesas da operação</small></article>
      <article class="metric-accent"><span>Saldo do caixa</span><strong>${formatMoney(balance)}</strong><small>Entradas menos saídas</small></article>
    `;
    $("#cash-list").innerHTML = state.cash.length ? `
      <table class="data-table">
        <thead><tr><th>Data</th><th>Movimento</th><th>Forma</th><th>Tipo</th><th>Valor</th></tr></thead>
        <tbody>${state.cash.map((item) => `
          <tr>
            <td>${formatDate(item.createdAt)}</td>
            <td>${escapeHtml(item.description)}</td>
            <td>${escapeHtml(paymentLabels[item.paymentMethod] || item.paymentMethod || "—")}</td>
            <td><span class="pill ${item.type === "income" ? "green" : "orange"}">${item.type === "income" ? "Entrada" : "Saída"}</span></td>
            <td><strong>${item.type === "income" ? "+" : "−"} ${formatMoney(item.amountCents)}</strong></td>
          </tr>
        `).join("")}</tbody>
      </table>
    ` : `<div class="empty-list"><strong>Caixa ainda sem movimentos</strong>Dê baixa em uma venda ou lance uma despesa.</div>`;
  }

  function renderExpenses() {
    $("#expense-list").innerHTML = state.expenses.length ? state.expenses.map((expense) => `
      <article class="stack-card">
        <div class="stack-card-head">
          <div><strong>${escapeHtml(expense.description)}</strong><small>${escapeHtml(expenseLabels[expense.category] || expense.category)} · ${escapeHtml(expense.occurredAt)}</small></div>
          <span class="pill orange">Saída</span>
        </div>
        ${expense.notes ? `<small>${escapeHtml(expense.notes)}</small>` : ""}
        <div class="stack-card-bottom"><div><small>Valor lançado</small><strong>${formatMoney(expense.amountCents)}</strong></div></div>
      </article>
    `).join("") : `<div class="empty-list"><strong>Nenhuma despesa lançada</strong>Frete, motoboy e outros custos aparecerão aqui.</div>`;
  }

  function renderDocuments() {
    $("#document-list").innerHTML = state.documents.length ? state.documents.map((documentItem) => {
      const sale = state.sales.find((item) => item.id === documentItem.saleId);
      return `
        <article class="stack-card">
          <div class="stack-card-head">
            <div><strong>${escapeHtml(documentItem.name)}</strong><small>${escapeHtml(documentLabels[documentItem.kind] || documentItem.kind)} · ${formatDate(documentItem.createdAt)}</small></div>
            <span class="pill green">Privado</span>
          </div>
          ${sale ? `<small>Venda: ${escapeHtml(sale.customerName)} · ${escapeHtml(sale.productName)}</small>` : ""}
          <div class="stack-card-bottom">
            <div><small>Tamanho</small><strong>${(cents(documentItem.size) / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} KB</strong></div>
            <div class="stack-actions"><a href="${API}/admin/documents/${encodeURIComponent(documentItem.id)}/download" target="_blank" rel="noopener">Abrir arquivo</a></div>
          </div>
        </article>
      `;
    }).join("") : `<div class="empty-list"><strong>Nenhum documento guardado</strong>Envie um comprovante ou documento em PDF ou imagem.</div>`;
  }

  function renderHelp() {
    const query = $("#help-search").value.trim().toLocaleLowerCase("pt-BR");
    const topics = state.help.filter((item) => (
      !query || `${item.title} ${item.summary}`.toLocaleLowerCase("pt-BR").includes(query)
    ));
    $("#faq-list").innerHTML = topics.map((item) => `
      <article class="faq-item panel">
        <button type="button"><span>?</span>${escapeHtml(item.title)}<b>＋</b></button>
        <p>${escapeHtml(item.summary)}</p>
      </article>
    `).join("");
  }

  function renderDashboard() {
    const dashboard = state.dashboard || {};
    $("#dashboard-metrics").innerHTML = `
      <article><span>Unidades em estoque <button class="inline-help" data-help="inventory" type="button">?</button></span><strong>${cents(dashboard.stockUnits)}</strong><small>${cents(dashboard.activeProducts)} anúncios ativos</small></article>
      <article><span>Receita recebida <button class="inline-help" data-help="cash" type="button">?</button></span><strong>${formatMoney(dashboard.grossRevenueCents)}</strong><small>${cents(dashboard.paidSales)} vendas baixadas</small></article>
      <article class="metric-accent"><span>Lucro das vendas <button class="inline-help" data-help="pricing" type="button">?</button></span><strong>${formatMoney(dashboard.profitCents)}</strong><small>Antes das despesas gerais: ${formatMoney(dashboard.expensesCents)}</small></article>
      <article><span>Vendas pendentes <button class="inline-help" data-help="sales" type="button">?</button></span><strong>${cents(dashboard.pendingSales)}</strong><small>Aguardando confirmação</small></article>
    `;
    const operationalProfit = cents(dashboard.profitCents) - cents(dashboard.expensesCents);
    $("#dashboard-summary").innerHTML = `
      <div><span>Produtos publicados</span><strong>${cents(dashboard.activeProducts)}</strong></div>
      <div><span>Vendas concluídas</span><strong>${cents(dashboard.paidSales)}</strong></div>
      <div><span>Documentos protegidos</span><strong>${cents(dashboard.documentCount)}</strong></div>
      <div><span>Despesas gerais</span><strong>${formatMoney(dashboard.expensesCents)}</strong></div>
      <div><span>Resultado operacional</span><strong>${formatMoney(operationalProfit)}</strong></div>
    `;
  }

  function renderAll() {
    renderMasterCatalog();
    renderInventory();
    renderSales();
    renderCash();
    renderExpenses();
    renderDocuments();
    renderHelp();
    renderDashboard();
  }

  async function loadAll() {
    const requests = await Promise.all([
      api(ADMIN_CATALOG_ENDPOINT),
      api("/admin/inventory"),
      api(ADMIN_SALES_ENDPOINT),
      api("/admin/cash"),
      api("/admin/expenses"),
      api(ADMIN_DOCUMENTS_ENDPOINT),
      api("/admin/help"),
      api("/admin/dashboard"),
    ]);
    [
      state.catalog,
      state.inventory,
      state.sales,
      state.cash,
      state.expenses,
      state.documents,
      state.help,
      state.dashboard,
    ] = [
      requests[0].items,
      requests[1].items,
      requests[2].items,
      requests[3].items,
      requests[4].items,
      requests[5].items,
      [...requests[6].items, ...localHelp],
      requests[7].item,
    ];
    renderAll();
  }

  async function refreshOperationalData() {
    const [inventory, sales, cash, expenses, documents, dashboard] = await Promise.all([
      api("/admin/inventory"),
      api(ADMIN_SALES_ENDPOINT),
      api("/admin/cash"),
      api("/admin/expenses"),
      api(ADMIN_DOCUMENTS_ENDPOINT),
      api("/admin/dashboard"),
    ]);
    state.inventory = inventory.items;
    state.sales = sales.items;
    state.cash = cash.items;
    state.expenses = expenses.items;
    state.documents = documents.items;
    state.dashboard = dashboard.item;
    renderInventory();
    renderSales();
    renderCash();
    renderExpenses();
    renderDocuments();
    renderDashboard();
  }

  function receiptHtml(sale) {
    const total = cents(sale.receivedCents || sale.priceCents - sale.discountCents);
    return `<!doctype html>
      <html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
      <title>Recibo Mundo Apple</title>
      <style>
        body{margin:0;background:#eee;color:#111;font:14px Arial,sans-serif}.sheet{width:720px;max-width:calc(100% - 48px);margin:28px auto;padding:46px;background:#fff;border-top:8px solid #9bea2c;box-shadow:0 15px 50px #0002}
        h1{margin:0;font-size:34px}h1 span{color:#699f1d}.meta{color:#666}.row{display:flex;justify-content:space-between;gap:24px;padding:12px 0;border-bottom:1px solid #ddd}.row strong{text-align:right}.total{font-size:20px}.terms{margin-top:28px;padding:20px;background:#f5f6f2;line-height:1.55}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:50px;margin-top:70px;text-align:center}.signatures div{border-top:1px solid #222;padding-top:8px}.print{display:block;margin:0 auto 20px;padding:12px 20px;border:0;background:#9bea2c;font-weight:bold;cursor:pointer}@media print{body{background:#fff}.sheet{box-shadow:none;margin:0;max-width:none;width:auto}.print{display:none}}
      </style></head><body><article class="sheet">
      <button class="print" onclick="window.print()">Imprimir / salvar em PDF</button>
      <h1>MUNDO <span>APPLE</span></h1><p class="meta">Cruzeiro do Sul · Acre · +55 68 9981-1047</p>
      <h2>Recibo e declaração de venda</h2>
      <div class="row"><span>Cliente</span><strong>${escapeHtml(sale.customerName)}</strong></div>
      <div class="row"><span>Documento</span><strong>${escapeHtml(sale.customerDocument || "Não informado")}</strong></div>
      <div class="row"><span>Produto</span><strong>${escapeHtml(sale.productName)} · ${sale.quantity} un.</strong></div>
      <div class="row"><span>Condição</span><strong>${sale.condition === "new" ? "Novo" : "Seminovo / usado"}</strong></div>
      <div class="row"><span>IMEI / série</span><strong>${escapeHtml(sale.imei || sale.serialNumber || "Não informado")}</strong></div>
      <div class="row"><span>Pagamento</span><strong>${escapeHtml(paymentLabels[sale.paymentMethod] || sale.paymentMethod)}</strong></div>
      <div class="row"><span>Data do recebimento</span><strong>${formatDate(sale.paidAt || sale.createdAt)}</strong></div>
      <div class="row total"><span>Valor recebido</span><strong>${formatMoney(total)}</strong></div>
      ${sale.tradeIn ? `<div class="row"><span>Aparelho recebido como entrada</span><strong>${escapeHtml(sale.tradeIn.model)} · ${formatMoney(sale.tradeIn.appraisedValueCents)}</strong></div>` : ""}
      <div class="terms"><strong>Garantia informada: ${cents(sale.warrantyDays)} dias.</strong><br>Este documento registra a negociação descrita acima. A garantia da loja respeita o prazo informado e as condições entregues ao cliente, sem excluir direitos previstos na legislação aplicável. Danos por queda, líquido, mau uso ou intervenção de terceiros devem ser avaliados conforme a política entregue pela loja.</div>
      <div class="signatures"><div>Mundo Apple / responsável</div><div>${escapeHtml(sale.customerName)}</div></div>
      </article></body></html>`;
  }

  function openReceipt(saleId) {
    const sale = state.sales.find((item) => item.id === saleId);
    if (!sale) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Permita pop-ups para abrir o recibo.");
      return;
    }
    printWindow.opener = null;
    printWindow.document.open();
    printWindow.document.write(receiptHtml(sale));
    printWindow.document.close();
  }

  function bindEvents() {
    $("#login-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const message = $("#login-message");
      const button = form.querySelector("button[type=submit]");
      setMessage(message, "");
      button.disabled = true;
      try {
        await api("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            username: formValue(form, "username"),
            password: formValue(form, "password"),
          }),
        });
        form.reset();
        showApp();
        await loadAll();
        showToast("Acesso liberado.");
      } catch (error) {
        setMessage(message, error.message);
      } finally {
        button.disabled = false;
      }
    });

    $("#logout-button").addEventListener("click", async () => {
      try {
        await api("/auth/logout", { method: "POST", body: "{}" });
      } finally {
        showLogin();
      }
    });

    document.addEventListener("click", async (event) => {
      const nav = event.target.closest("[data-section]");
      const go = event.target.closest("[data-go]");
      const help = event.target.closest("[data-help]");
      const category = event.target.closest("[data-category]");
      const catalogItem = event.target.closest("[data-catalog-key]");
      const publishButton = event.target.closest("[data-toggle-published]");
      const settleButton = event.target.closest("[data-settle]");
      const receiptButton = event.target.closest("[data-receipt]");
      if (nav) goTo(nav.dataset.section);
      if (go) goTo(go.dataset.go);
      if (help) showHelp(help.dataset.help);
      if (category) {
        state.catalogCategory = category.dataset.category;
        renderMasterCatalog();
      }
      if (catalogItem) selectCatalog(catalogItem.dataset.catalogKey);
      if (publishButton) {
        const item = state.inventory.find((inventory) => inventory.id === publishButton.dataset.togglePublished);
        if (!item) return;
        publishButton.disabled = true;
        try {
          await api(`/admin/inventory/${encodeURIComponent(item.id)}`, {
            method: "PATCH",
            body: JSON.stringify({ published: !item.published }),
          });
          await refreshOperationalData();
          showToast(item.published ? "Produto retirado da vitrine." : "Produto publicado na vitrine.");
        } catch (error) {
          showToast(error.message);
          publishButton.disabled = false;
        }
      }
      if (settleButton) {
        const sale = state.sales.find((item) => item.id === settleButton.dataset.settle);
        if (!sale) return;
        const form = $("#settle-form");
        form.elements.namedItem("saleId").value = sale.id;
        form.elements.namedItem("paymentMethod").value = sale.paymentMethod === "online" ? "pix" : sale.paymentMethod;
        form.elements.namedItem("received").value = ((cents(sale.priceCents) - cents(sale.discountCents)) / 100).toFixed(2).replace(".", ",");
        form.elements.namedItem("paymentFee").value = "";
        form.elements.namedItem("saleExpenses").value = "";
        form.elements.namedItem("confirmed").checked = false;
        state.settlementKeys.set(sale.id, makeIdempotencyKey());
        setMessage($("#settle-message"), "");
        $("#settle-dialog").showModal();
      }
      if (receiptButton) openReceipt(receiptButton.dataset.receipt);
      const faqButton = event.target.closest(".faq-item button");
      if (faqButton) {
        const item = faqButton.closest(".faq-item");
        item.classList.toggle("open");
        faqButton.querySelector("b").textContent = item.classList.contains("open") ? "−" : "＋";
      }
    });

    $("#mobile-menu").addEventListener("click", () => document.body.classList.add("sidebar-open"));
    $("#mobile-close").addEventListener("click", () => document.body.classList.remove("sidebar-open"));
    $("#sidebar-backdrop").addEventListener("click", () => document.body.classList.remove("sidebar-open"));
    $$(".dialog-close").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
    $("#help-dialog-ok").addEventListener("click", () => $("#help-dialog").close());

    $("#master-search").addEventListener("input", (event) => {
      state.catalogQuery = event.target.value;
      renderMasterCatalog();
    });
    $("#inventory-search").addEventListener("input", renderInventory);
    $("#help-search").addEventListener("input", renderHelp);
    $("#inventory-form").addEventListener("input", renderPricePreview);
    $("#trade-in-toggle").addEventListener("change", (event) => {
      $("#trade-in-fields").hidden = !event.target.checked;
    });
    $("#sale-inventory").addEventListener("change", (event) => {
      const item = state.inventory.find((inventory) => inventory.id === event.target.value);
      if (item) $("#sale-form").elements.namedItem("price").value = (item.webPriceCents / 100).toFixed(2).replace(".", ",");
    });
    $("#expense-form").elements.namedItem("occurredAt").value = new Date().toISOString().slice(0, 10);

    $("#inventory-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const message = $("#inventory-message");
      setMessage(message, "");
      if (!formValue(form, "catalogKey")) {
        setMessage(message, "Escolha um produto na lista ao lado.");
        return;
      }
      const button = form.querySelector("button[type=submit]");
      button.disabled = true;
      try {
        await api("/admin/inventory", {
          method: "POST",
          body: JSON.stringify({
            catalogKey: formValue(form, "catalogKey"),
            quantity: Number(formValue(form, "quantity")),
            condition: formValue(form, "condition"),
            warrantyDays: Number(formValue(form, "warrantyDays")),
            batteryHealth: formValue(form, "batteryHealth") === "" ? "" : Number(formValue(form, "batteryHealth")),
            storage: formValue(form, "storage"),
            color: formValue(form, "color"),
            imei: formValue(form, "imei"),
            serialNumber: formValue(form, "serialNumber"),
            notes: formValue(form, "notes"),
            published: form.elements.namedItem("published").checked,
            purchasePriceCents: parseMoney(formValue(form, "purchasePrice")),
            freightCents: parseMoney(formValue(form, "freight")),
            motoboyCents: parseMoney(formValue(form, "motoboy")),
            packagingCents: parseMoney(formValue(form, "packaging")),
            preparationCents: parseMoney(formValue(form, "preparation")),
            warrantyReserveCents: parseMoney(formValue(form, "warrantyReserve")),
            webPriceCents: parseMoney(formValue(form, "webPrice")),
            pickupPriceCents: parseMoney(formValue(form, "pickupPrice")),
          }),
        });
        form.reset();
        form.elements.namedItem("quantity").value = "1";
        form.elements.namedItem("warrantyDays").value = "90";
        form.elements.namedItem("published").checked = true;
        form.elements.namedItem("catalogKey").value = state.selectedCatalogKey;
        await refreshOperationalData();
        renderPricePreview();
        setMessage(message, "Produto colocado no estoque com sucesso.", true);
        showToast("Estoque atualizado e vitrine sincronizada.");
      } catch (error) {
        setMessage(message, error.message);
      } finally {
        button.disabled = false;
      }
    });

    $("#sale-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const message = $("#sale-message");
      const button = form.querySelector("button[type=submit]");
      setMessage(message, "");
      button.disabled = true;
      try {
        const hasTradeIn = $("#trade-in-toggle").checked;
        await api(ADMIN_SALES_ENDPOINT, {
          method: "POST",
          body: JSON.stringify({
            inventoryId: formValue(form, "inventoryId"),
            customerName: formValue(form, "customerName"),
            customerPhone: formValue(form, "customerPhone"),
            customerDocument: formValue(form, "customerDocument"),
            customerAddress: formValue(form, "customerAddress"),
            quantity: Number(formValue(form, "quantity")),
            priceCents: parseMoney(formValue(form, "price")),
            discountCents: parseMoney(formValue(form, "discount")),
            paymentMethod: formValue(form, "paymentMethod"),
            tradeIn: hasTradeIn ? {
              model: formValue(form, "tradeInModel"),
              imei: formValue(form, "tradeInImei"),
              condition: formValue(form, "tradeInCondition"),
              appraisedValueCents: parseMoney(formValue(form, "tradeInValue")),
              notes: formValue(form, "tradeInNotes"),
            } : null,
          }),
        });
        form.reset();
        $("#trade-in-toggle").checked = false;
        $("#trade-in-fields").hidden = true;
        form.elements.namedItem("quantity").value = "1";
        await refreshOperationalData();
        setMessage(message, "Venda registrada. Confirme o recebimento para dar baixa.", true);
        showToast("Venda pendente criada.");
      } catch (error) {
        setMessage(message, error.message);
      } finally {
        button.disabled = false;
      }
    });

    $("#settle-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const saleId = formValue(form, "saleId");
      const message = $("#settle-message");
      const button = form.querySelector("button[type=submit]");
      setMessage(message, "");
      button.disabled = true;
      try {
        await api(`/admin/sales/${encodeURIComponent(saleId)}/settle`, {
          method: "POST",
          body: JSON.stringify({
            paymentMethod: formValue(form, "paymentMethod"),
            receivedCents: parseMoney(formValue(form, "received")),
            paymentFeeCents: parseMoney(formValue(form, "paymentFee")),
            saleExpensesCents: parseMoney(formValue(form, "saleExpenses")),
            idempotencyKey: state.settlementKeys.get(saleId) || makeIdempotencyKey(),
          }),
        });
        await refreshOperationalData();
        $("#settle-dialog").close();
        showToast("Pagamento confirmado, estoque baixado e caixa atualizado.");
      } catch (error) {
        setMessage(message, error.message);
      } finally {
        button.disabled = false;
      }
    });

    $("#expense-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const message = $("#expense-message");
      const button = form.querySelector("button[type=submit]");
      setMessage(message, "");
      button.disabled = true;
      try {
        await api("/admin/expenses", {
          method: "POST",
          body: JSON.stringify({
            description: formValue(form, "description"),
            category: formValue(form, "category"),
            amountCents: parseMoney(formValue(form, "amount")),
            occurredAt: formValue(form, "occurredAt"),
            paymentMethod: formValue(form, "paymentMethod"),
            notes: formValue(form, "notes"),
          }),
        });
        form.reset();
        form.elements.namedItem("occurredAt").value = new Date().toISOString().slice(0, 10);
        await refreshOperationalData();
        setMessage(message, "Despesa lançada no caixa.", true);
        showToast("Despesa registrada.");
      } catch (error) {
        setMessage(message, error.message);
      } finally {
        button.disabled = false;
      }
    });

    $("#document-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const file = $("#document-file").files[0];
      const message = $("#document-message");
      const button = form.querySelector("button[type=submit]");
      setMessage(message, "");
      if (!file) return setMessage(message, "Escolha um arquivo.");
      if (file.size > 8 * 1024 * 1024) return setMessage(message, "O arquivo ultrapassa o limite de 8 MB.");
      button.disabled = true;
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
          reader.readAsDataURL(file);
        });
        await api(ADMIN_DOCUMENTS_ENDPOINT, {
          method: "POST",
          body: JSON.stringify({
            name: file.name,
            mimeType: file.type,
            contentBase64: String(dataUrl).split(",")[1],
            kind: formValue(form, "kind"),
            saleId: formValue(form, "saleId"),
          }),
        });
        form.reset();
        await refreshOperationalData();
        setMessage(message, "Documento guardado no administrativo.", true);
        showToast("Arquivo protegido e salvo.");
      } catch (error) {
        setMessage(message, error.message);
      } finally {
        button.disabled = false;
      }
    });
  }

  async function initialize() {
    bindEvents();
    try {
      await api("/auth/session");
      showApp();
      await loadAll();
    } catch {
      showLogin();
    }
  }

  initialize();
})();
