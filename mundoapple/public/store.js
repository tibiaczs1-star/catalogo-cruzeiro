(() => {
  "use strict";

  const API = "/api/mundoapple";
  const CATALOG_ENDPOINT = "/api/mundoapple/catalog";
  const WHATSAPP = "556899811047";
  const state = { items: [], category: "Todos", query: "" };
  const grid = document.querySelector("#catalog-grid");
  const emptyState = document.querySelector("#empty-state");
  const filters = document.querySelector("#category-filters");
  const search = document.querySelector("#catalog-search");
  const dialog = document.querySelector("#product-dialog");
  const dialogContent = document.querySelector("#product-dialog-content");
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const categoryArt = {
    iPhone: "assets/iphone-studio.webp",
    iPad: "assets/ipad-studio.webp",
    Mac: "assets/mac-studio.webp",
    "Apple Watch": "assets/watch-studio.webp",
    AirPods: "assets/airpods-studio.webp",
    "Casa e TV": "assets/home-studio.webp",
    Outros: "assets/accessories-studio.webp",
  };

  function formatMoney(cents) {
    return money.format((Number(cents) || 0) / 100);
  }

  function productVisual(item) {
    const source = categoryArt[item.category];
    if (!source) return '<span class="visual-fallback" aria-hidden="true"></span>';
    return `<img src="${source}" alt="${escapeHtml(item.category)} em composição de estúdio Mundo Apple" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'visual-fallback'}))">`;
  }

  function renderFilters() {
    const categories = ["Todos", ...new Set(state.items.map((item) => item.category))];
    filters.innerHTML = categories.map((category) =>
      `<button type="button" class="${category === state.category ? "active" : ""}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`,
    ).join("");
  }

  function visibleItems() {
    const normalizedQuery = state.query.toLocaleLowerCase("pt-BR");
    return state.items.filter((item) => {
      const matchesCategory = state.category === "Todos" || item.category === state.category;
      const matchesQuery = !normalizedQuery || `${item.name} ${item.family} ${item.storage} ${item.color}`.toLocaleLowerCase("pt-BR").includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }

  function renderCatalog() {
    const items = visibleItems();
    grid.innerHTML = items.map((item) => `
      <article class="product-card" tabindex="0" role="button" data-product-id="${escapeHtml(item.id)}" aria-label="Ver ${escapeHtml(item.name)}">
        <div class="product-visual">${productVisual(item)}</div>
        <div class="card-top">
          <div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml([item.storage, item.color].filter(Boolean).join(" · ") || item.category)}</p></div>
          <span class="condition-pill">${item.condition === "new" ? "Novo" : "Seminovo"}</span>
        </div>
        <div class="card-bottom">
          <div class="price"><small>A partir de</small><strong>${formatMoney(item.webPriceCents)}</strong></div>
          <span class="details-arrow" aria-hidden="true">↗</span>
        </div>
      </article>
    `).join("");
    grid.hidden = items.length === 0;
    emptyState.hidden = items.length !== 0;
  }

  function openProduct(id) {
    const item = state.items.find((product) => product.id === id);
    if (!item) return;
    const inquiry = encodeURIComponent(`Olá, Mundo Apple! Quero saber mais sobre ${item.name}${item.storage ? ` ${item.storage}` : ""}.`);
    dialogContent.innerHTML = `
      <div class="dialog-layout">
        <div class="product-visual">${productVisual(item)}</div>
        <div class="dialog-copy">
          <p class="eyebrow"><span></span> Disponível em Cruzeiro do Sul</p>
          <h2>${escapeHtml(item.name)}</h2>
          <p class="dialog-meta">${escapeHtml(item.condition === "new" ? "Novo" : "Seminovo")} · ${item.quantity} ${item.quantity === 1 ? "unidade" : "unidades"}</p>
          <div class="dialog-price"><small>Preço web</small><strong>${formatMoney(item.webPriceCents)}</strong></div>
          <div class="spec-list">
            <div><span>Retirada local</span><strong>${formatMoney(item.pickupPriceCents)}</strong></div>
            <div><span>Armazenamento</span><strong>${escapeHtml(item.storage || "Consultar")}</strong></div>
            <div><span>Cor</span><strong>${escapeHtml(item.color || "Consultar")}</strong></div>
            <div><span>Garantia</span><strong>${Number(item.warrantyDays) || 0} dias</strong></div>
            ${item.batteryHealth != null ? `<div><span>Saúde da bateria</span><strong>${Number(item.batteryHealth)}%</strong></div>` : ""}
          </div>
          <a class="button button-primary" href="https://wa.me/${WHATSAPP}?text=${inquiry}" target="_blank" rel="noopener">Quero este produto</a>
        </div>
      </div>`;
    dialog.showModal();
  }

  async function loadCatalog() {
    try {
      const response = await fetch(CATALOG_ENDPOINT, { headers: { accept: "application/json" } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível carregar o estoque.");
      state.items = Array.isArray(payload.items) ? payload.items : [];
      renderFilters();
      renderCatalog();
    } catch (error) {
      grid.hidden = true;
      emptyState.hidden = false;
      document.querySelector("#empty-state > p:not(.eyebrow)").textContent = "O estoque está sendo atualizado. Fale com a gente para consultar os modelos disponíveis.";
      console.error(error);
    }
  }

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.category = button.dataset.category;
    renderFilters();
    renderCatalog();
  });
  search.addEventListener("input", () => {
    state.query = search.value.trim();
    renderCatalog();
  });
  grid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-product-id]");
    if (card) openProduct(card.dataset.productId);
  });
  grid.addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key)) return;
    const card = event.target.closest("[data-product-id]");
    if (card) {
      event.preventDefault();
      openProduct(card.dataset.productId);
    }
  });
  dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  loadCatalog();
})();
