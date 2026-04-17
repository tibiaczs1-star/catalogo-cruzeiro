(function () {
  "use strict";

  const state = {
    filter: "",
    items: []
  };
  const PORTAL_WHATSAPP_NUMBER = "5568992269296";

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $$(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function resolveApiBase() {
    if (typeof window.CATALOGO_API_BASE === "string" && window.CATALOGO_API_BASE) {
      return window.CATALOGO_API_BASE.replace(/\/$/, "");
    }
    return location.protocol === "file:" ? "http://localhost:3000" : location.origin;
  }

  async function requestJson(path, options = {}) {
    const response = await fetch(`${resolveApiBase()}${path}`, options);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || payload.message || "Nao foi possivel concluir agora.");
    }
    return payload;
  }

  function buildWhatsLink(phone) {
    const digits = String(phone || "").replace(/\D/g, "");
    if (!digits) return "";
    return `https://wa.me/55${digits}`;
  }

  function openPortalWhatsApp(lines) {
    const text = lines.filter(Boolean).join("\n");
    const url = `https://wa.me/${PORTAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      location.href = url;
    }
  }

  function cardHtml(item) {
    const whats = buildWhatsLink(item.phone);
    return `
      <article class="sales-card">
        <p class="sales-eyebrow">${escapeHtml(item.categoryLabel || item.category || "venda local")}</p>
        <h3>${escapeHtml(item.title || "Item sem titulo")}</h3>
        <p>${escapeHtml(item.description || "Sem descricao adicional.")}</p>
        <div class="sales-card-meta">
          <span>Preco<strong>${escapeHtml(item.price || "A combinar")}</strong></span>
          <span>Estado<strong>${escapeHtml(item.condition || "Nao informado")}</strong></span>
          <span>Local<strong>${escapeHtml([item.neighborhood, item.city].filter(Boolean).join(" / ") || "Cruzeiro do Sul")}</strong></span>
          <span>Entrega<strong>${escapeHtml(item.deliveryMode || "Combinar")}</strong></span>
        </div>
        <div class="sales-actions">
          ${
            whats
              ? `<a class="sales-button primary sales-contact" href="${whats}" target="_blank" rel="noreferrer">Chamar vendedor</a>`
              : ""
          }
          <span class="sales-button">${escapeHtml(item.sellerName || "Vendedor local")}</span>
        </div>
      </article>
    `;
  }

  function renderList() {
    const list = $("#sales-list");
    const status = $("#sales-list-status");
    if (!list || !status) return;

    list.innerHTML = state.items.length
      ? state.items.map(cardHtml).join("")
      : `<article class="sales-card"><h3>Nenhuma venda publicada nesse tipo ainda.</h3><p>Seja o primeiro a anunciar e preencher esta vitrine local.</p></article>`;

    status.textContent = state.items.length
      ? `${state.items.length} venda(s) encontrada(s) na vitrine.`
      : "A lista esta pronta, mas ainda nao recebeu itens nesse filtro.";
  }

  async function loadSales() {
    const status = $("#sales-list-status");
    if (status) status.textContent = "Buscando vendas locais...";

    try {
      const query = state.filter ? `?category=${encodeURIComponent(state.filter)}` : "";
      const payload = await requestJson(`/api/sales/listings${query}`, {
        headers: { Accept: "application/json" }
      });
      state.items = Array.isArray(payload.items) ? payload.items : [];
      renderList();
    } catch (error) {
      state.items = [];
      renderList();
      if (status) status.textContent = error.message;
    }
  }

  function initFilters() {
    $$(".sales-filter").forEach((button) => {
      button.addEventListener("click", () => {
        state.filter = button.dataset.salesFilter || "";
        $$(".sales-filter").forEach((item) => item.classList.toggle("is-active", item === button));
        loadSales();
      });
    });
  }

  function initForm() {
    const form = $("#sales-form");
    const status = $("#sales-form-status");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitButton = $('button[type="submit"]', form);
      const payload = Object.fromEntries(new FormData(form).entries());

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Publicando...";
      }
      if (status) status.textContent = "Salvando no backend...";

      try {
        const result = await requestJson("/api/sales/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (status) status.textContent = `${result.message} Codigo: ${result.item?.id || "venda salva"}.`;
        openPortalWhatsApp([
          "Novo anuncio de venda pelo Catalogo Cruzeiro do Sul.",
          "",
          `Item: ${payload.title || payload.item || payload.product || ""}`,
          `Categoria: ${payload.category || payload.type || "outros"}`,
          `Preco: ${payload.price || payload.value || "A combinar"}`,
          `Vendedor: ${payload.sellerName || payload.name || ""}`,
          `WhatsApp/telefone: ${payload.phone || payload.whatsapp || ""}`,
          `Bairro/cidade: ${[payload.neighborhood || payload.bairro, payload.city].filter(Boolean).join(" / ")}`,
          payload.description || payload.details ? `Descricao: ${payload.description || payload.details}` : "",
          `Codigo: ${result.item?.id || "venda salva"}`
        ]);
        form.reset();
        state.filter = "";
        $$(".sales-filter").forEach((item) => item.classList.toggle("is-active", item.dataset.salesFilter === ""));
        loadSales();
      } catch (error) {
        if (status) status.textContent = error.message;
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Publicar venda";
        }
      }
    });
  }

  function init() {
    initFilters();
    initForm();
    loadSales();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
