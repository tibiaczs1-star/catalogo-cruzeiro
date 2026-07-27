(() => {
  "use strict";

  const CATALOG_ENDPOINT = "/api/mundoapple/catalog";
  const WHATSAPP = "556899811047";
  const state = {
    items: [],
    category: "Todos",
    query: "",
    sort: "featured",
    failed: false,
    activeProductId: "",
    selectedColors: new Map(),
    delivery: {
      baseFeeCents: 3_000,
      minimumFeeCents: 3_000,
      region: "Cruzeiro do Sul e Vale do Juruá",
      providers: [
        { id: "99-entrega", label: "99 Entrega" },
        { id: "logistica-local", label: "Logística local" },
        { id: "preco-a-combinar", label: "Preço a combinar" },
      ],
    },
  };
  const grid = document.querySelector("#catalog-grid");
  const emptyState = document.querySelector("#empty-state");
  const filters = document.querySelector("#category-filters");
  const search = document.querySelector("#catalog-search");
  const sort = document.querySelector("#catalog-sort");
  const catalogCount = document.querySelector("#catalog-count");
  const dialog = document.querySelector("#product-dialog");
  const dialogContent = document.querySelector("#product-dialog-content");
  const checkoutDialog = document.querySelector("#checkout-dialog");
  const checkoutContent = document.querySelector("#checkout-dialog-content");
  const toast = document.querySelector("#toast");
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function formatMoney(cents) {
    return money.format((Number(cents) || 0) / 100);
  }

  function productArt(item) {
    const catalogKey = String(item.catalogKey || "").replace(/[^a-z0-9-]/gi, "");
    return item.artPath || (catalogKey ? `assets/products/${catalogKey}.svg` : "");
  }

  function productVisual(item, eager = false) {
    const source = productArt(item);
    if (!source) return '<span class="visual-fallback" aria-hidden="true"></span>';
    return `<img src="${escapeHtml(source)}" alt="Arte exclusiva de ${escapeHtml(item.name)}" ${eager ? "" : 'loading="lazy"'} decoding="async" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'visual-fallback'}))">`;
  }

  function conditionLabel(item) {
    return item.condition === "new" ? "Novo" : "Seminovo";
  }

  function stockLabel(item) {
    const quantity = Number(item.quantity) || 0;
    return `${quantity} ${quantity === 1 ? "unidade" : "unidades"}`;
  }

  function availableColors(item) {
    const variants = Array.isArray(item.colorVariants) ? item.colorVariants : [];
    const normalized = variants
      .map((variant) => ({
        name: String(variant.name || "").trim(),
        hex: /^#[0-9a-f]{6}$/i.test(String(variant.hex || "")) ? variant.hex : "#8b8f88",
        quantity: Math.max(0, Number(variant.quantity) || 0),
      }))
      .filter((variant) => variant.name && variant.quantity > 0);
    if (normalized.length) return normalized;
    return item.color && Number(item.quantity) > 0
      ? [{ name: item.color, hex: "#8b8f88", quantity: Number(item.quantity) }]
      : [];
  }

  function selectedVariant(item) {
    const colors = availableColors(item);
    const rememberedColor = state.selectedColors.get(item.id);
    const selected = colors.find((variant) => variant.name === rememberedColor) || colors[0] || null;
    if (selected) state.selectedColors.set(item.id, selected.name);
    return selected;
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function colorSwatches(item, selectedColor = "") {
    const colors = availableColors(item);
    return colors.map((variant) => {
      const selected = variant.name === selectedColor;
      return `<button class="color-option ${selected ? "selected" : ""}" type="button" data-select-color="${escapeHtml(variant.name)}" aria-label="Escolher ${escapeHtml(variant.name)}, ${variant.quantity} em estoque" aria-pressed="${selected}">
        <span class="variant-product-preview" style="--variant-color:${escapeHtml(variant.hex)}" aria-hidden="true"><i></i></span>
        <span class="variant-color-copy"><strong>${escapeHtml(variant.name)}</strong><small>${variant.quantity} ${variant.quantity === 1 ? "unidade" : "unidades"}</small></span>
      </button>`;
    }).join("");
  }

  function renderFilters() {
    const categories = ["Todos", ...new Set(state.items.map((item) => item.category).filter(Boolean))];
    filters.innerHTML = categories.map((category) => `
      <button type="button" class="${category === state.category ? "active" : ""}" data-category="${escapeHtml(category)}" aria-pressed="${category === state.category}">
        ${escapeHtml(category)}
      </button>
    `).join("");
  }

  function visibleItems() {
    const normalizedQuery = state.query.toLocaleLowerCase("pt-BR");
    const items = state.items.filter((item) => {
      const matchesCategory = state.category === "Todos" || item.category === state.category;
      const colorNames = availableColors(item).map((variant) => variant.name).join(" ");
      const haystack = `${item.name} ${item.family} ${item.storage} ${item.color} ${colorNames} ${item.year}`.toLocaleLowerCase("pt-BR");
      return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery));
    });

    return items.sort((a, b) => {
      if (state.sort === "price-asc") return a.webPriceCents - b.webPriceCents;
      if (state.sort === "price-desc") return b.webPriceCents - a.webPriceCents;
      if (state.sort === "name") return a.name.localeCompare(b.name, "pt-BR");
      return Number(b.year || 0) - Number(a.year || 0) || a.name.localeCompare(b.name, "pt-BR");
    });
  }

  function observeReveals() {
    const elements = document.querySelectorAll(".reveal:not(.is-visible)");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -30px" });
    elements.forEach((element) => observer.observe(element));
  }

  function renderCatalog() {
    const items = visibleItems();
    grid.classList.remove("loading");
    grid.setAttribute("aria-busy", "false");
    catalogCount.textContent = state.failed
      ? "Vitrine temporariamente indisponível"
      : `${items.length} ${items.length === 1 ? "produto encontrado" : "produtos disponíveis"}${state.category === "Todos" ? "" : ` em ${state.category}`}`;

    grid.innerHTML = items.map((item, index) => {
      const colorCount = availableColors(item).length;
      return `
      <article class="product-card reveal" tabindex="0" role="button" data-product-id="${escapeHtml(item.id)}" aria-label="Ver detalhes de ${escapeHtml(item.name)}" style="--reveal-delay:${Math.min(index % 6, 5) * 45}ms">
        <div class="product-visual">
          ${productVisual(item)}
          <span class="product-index">${String(index + 1).padStart(2, "0")}</span>
          ${item.isDemo ? '<span class="demo-pill">DEMO</span>' : ""}
          <span class="visual-action">Ver em detalhes <b>↗</b></span>
        </div>
        <div class="product-kicker">
          <span>${escapeHtml(item.category)}${item.year ? ` · ${escapeHtml(item.year)}` : ""}</span>
          <span class="stock-dot"><i></i>${escapeHtml(stockLabel(item))}</span>
        </div>
        <div class="card-title">
          <div>
            <h3>${escapeHtml(item.name)}</h3>
            <p>${escapeHtml([item.storage, `${colorCount} ${colorCount === 1 ? "cor disponível" : "cores disponíveis"}`].filter(Boolean).join(" · ") || "Configuração sob consulta")}</p>
          </div>
          <span class="condition-pill ${item.condition === "used" ? "used" : ""}">${conditionLabel(item)}</span>
        </div>
        <div class="card-purchase-cue">
          <span>${colorCount ? "Cor escolhida na compra" : "Configuração sob consulta"}</span>
          <b>Ver opções <i>→</i></b>
        </div>
        <div class="card-price">
          <div><small>Preço online</small><strong>${formatMoney(item.webPriceCents)}</strong></div>
          <div class="pickup-price"><small>Retirada em CZS</small><strong>${formatMoney(item.pickupPriceCents)}</strong></div>
        </div>
        <div class="card-foot">
          <span>Garantia: ${Number(item.warrantyDays) || 0} dias</span>
          <b>Conhecer produto <i>→</i></b>
        </div>
      </article>
    `;
    }).join("");

    grid.hidden = items.length === 0;
    emptyState.hidden = items.length !== 0;
    observeReveals();
  }

  function renderProductDialog(item) {
    const colors = availableColors(item);
    const selected = selectedVariant(item);
    const details = [
      `Produto: ${item.name}`,
      item.storage ? `Armazenamento: ${item.storage}` : "",
      selected ? `Cor escolhida: ${selected.name}` : "",
      `Condição: ${conditionLabel(item)}`,
      `Preço online: ${formatMoney(item.webPriceCents)}`,
      `Retirada em CZS: ${formatMoney(item.pickupPriceCents)}`,
    ].filter(Boolean).join("\n");
    const inquiry = encodeURIComponent(`Olá, equipe Mundo Apple! Vi este produto na loja:\n\n${details}\n\nAinda está disponível?`);

    dialogContent.innerHTML = `
      <div class="dialog-layout">
        <div class="dialog-visual selected-product-color" data-product-color-visual style="--selected-color:${escapeHtml(selected?.hex || "#8b8f88")}">
          <div class="product-visual">${productVisual(item, true)}</div>
          ${selected ? `<span class="selected-color-badge"><i></i><span>Cor escolhida</span><strong>${escapeHtml(selected.name)}</strong></span>` : ""}
          <button class="motion-preview" type="button" data-present-product><span>▶</span> Ver apresentação</button>
          <small>Movimento ilustrativo do produto</small>
        </div>
        <div class="dialog-copy">
          <p class="eyebrow"><span></span> Disponível em Cruzeiro do Sul</p>
          <div class="dialog-badges"><span>${conditionLabel(item)}</span><span>${escapeHtml(stockLabel(item))}</span>${item.isDemo ? "<span>Demonstração</span>" : ""}</div>
          <h2>${escapeHtml(item.name)}</h2>
          <p class="dialog-meta">${escapeHtml([item.storage, item.year].filter(Boolean).join(" · ") || item.category)}</p>
          ${colors.length ? `
            <section class="dialog-color-picker" aria-label="Escolha da cor">
              <div><small>ESCOLHA A COR</small><strong>${escapeHtml(selected?.name || "")}</strong></div>
              <div class="color-options">${colorSwatches(item, selected?.name || "")}</div>
            </section>
          ` : ""}
          <div class="dialog-prices">
            <div><small>Compra online</small><strong>${formatMoney(item.webPriceCents)}</strong><span>Consulte pagamento e entrega</span></div>
            <div><small>Retirada local</small><strong>${formatMoney(item.pickupPriceCents)}</strong><span>Em Cruzeiro do Sul</span></div>
          </div>
          <div class="spec-list">
            <div><span>Categoria</span><strong>${escapeHtml(item.category)}</strong></div>
            <div><span>Garantia informada</span><strong>${Number(item.warrantyDays) || 0} dias</strong></div>
            ${item.batteryHealth != null ? `<div><span>Saúde da bateria</span><strong>${Number(item.batteryHealth)}%</strong></div>` : ""}
            <div><span>Estoque atual</span><strong>${escapeHtml(stockLabel(item))}</strong></div>
            ${selected ? `<div><span>Saldo na cor ${escapeHtml(selected.name)}</span><strong>${selected.quantity} ${selected.quantity === 1 ? "unidade" : "unidades"}</strong></div>` : ""}
          </div>
          <div class="dialog-actions">
            <button class="button button-primary dialog-cta" type="button" data-start-checkout>Comprar online com Pix <span>→</span></button>
            <a class="button button-ghost dialog-cta" href="https://wa.me/${WHATSAPP}?text=${inquiry}" target="_blank" rel="noopener">Falar com especialista <span>↗</span></a>
          </div>
          <p class="dialog-note">Os dados desta vitrine são demonstrativos. Confirme disponibilidade, especificações e pagamento no atendimento.</p>
        </div>
      </div>`;
  }

  function renderCheckoutForm(item) {
    const selected = selectedVariant(item);
    if (!selected) {
      checkoutContent.innerHTML = '<div class="checkout-message"><h2>Sem cor disponível</h2><p>Escolha outro produto ou fale com um especialista.</p></div>';
      return;
    }
    const providerOptions = state.delivery.providers.map((provider, index) => `
      <label>
        <input type="radio" name="deliveryProvider" value="${escapeHtml(provider.id)}" ${index === 0 ? "checked" : ""} disabled>
        <span><strong>${escapeHtml(provider.label)}</strong><small>${provider.id === "preco-a-combinar" ? "Ajuste final com o especialista" : "Atendimento no Vale do Juruá"}</small></span>
      </label>
    `).join("");
    checkoutContent.innerHTML = `
      <div class="checkout-shell">
        <aside class="checkout-summary" style="--selected-color:${escapeHtml(selected.hex)}">
          <p class="eyebrow"><span></span> Compra segura assistida</p>
          <div class="checkout-product-art">${productVisual(item, true)}</div>
          <div class="checkout-product-copy">
            <small>${escapeHtml(item.category)} · ${conditionLabel(item)}</small>
            <h2>${escapeHtml(item.name)}</h2>
            <p>${escapeHtml(item.storage || "Configuração informada no recibo")}</p>
            <div class="checkout-selected-color"><i></i><span>Cor escolhida</span><strong>${escapeHtml(selected.name)}</strong><small>${selected.quantity} ${selected.quantity === 1 ? "unidade disponível" : "unidades disponíveis"}</small></div>
          </div>
        </aside>
        <form class="checkout-form" data-checkout-form>
          <div class="checkout-form-heading">
            <span>FINALIZAR PEDIDO</span>
            <h2>Como você quer receber?</h2>
            <p>Preencha seus dados. O QR desta demonstração não realiza cobrança real.</p>
          </div>
          <fieldset class="delivery-options">
            <legend>Entrega ou retirada</legend>
            <label><input type="radio" name="deliveryMode" value="pickup" checked><span><strong>Retirada direta</strong><small>Você busca na loja · sem taxa</small></span></label>
            <label><input type="radio" name="deliveryMode" value="delivery"><span><strong>Envio no Vale do Juruá</strong><small>A partir de ${formatMoney(state.delivery.baseFeeCents)}</small></span></label>
          </fieldset>
          <fieldset class="delivery-options delivery-providers" data-delivery-provider-fields hidden>
            <legend>Como será o envio?</legend>
            ${providerOptions}
          </fieldset>
          <div class="checkout-fields checkout-person">
            <label><span>Nome completo</span><input name="customerName" required autocomplete="name" placeholder="Seu nome"></label>
            <label><span>WhatsApp</span><input name="customerPhone" required autocomplete="tel" inputmode="tel" placeholder="(68) 99999-9999"></label>
            <label><span>CPF ou documento</span><input name="customerDocument" autocomplete="off" inputmode="numeric" placeholder="Opcional nesta demonstração"></label>
            <label><span>Quantidade</span><input name="quantity" type="number" min="1" max="${selected.quantity}" value="1" required></label>
          </div>
          <div class="checkout-address" data-address-fields hidden>
            <div class="address-title"><strong>Endereço de entrega</strong><small>Todos os campos marcados são necessários.</small></div>
            <div class="checkout-fields">
              <label class="field-wide"><span>Rua *</span><input name="street" disabled autocomplete="address-line1"></label>
              <label><span>Número *</span><input name="number" disabled autocomplete="address-line2"></label>
              <label><span>Complemento</span><input name="complement" disabled autocomplete="address-line3"></label>
              <label><span>Bairro *</span><input name="neighborhood" disabled></label>
              <label><span>Cidade *</span><input name="city" value="Cruzeiro do Sul" disabled autocomplete="address-level2"></label>
              <label><span>Estado *</span><input name="state" value="AC" maxlength="2" disabled autocomplete="address-level1"></label>
              <label><span>CEP *</span><input name="postalCode" disabled inputmode="numeric" autocomplete="postal-code" placeholder="69980-000"></label>
            </div>
          </div>
          <div class="checkout-total">
            <div><span>Subtotal</span><strong data-checkout-subtotal>${formatMoney(item.pickupPriceCents)}</strong></div>
            <div><span>Taxa de envio</span><strong data-delivery-fee>${formatMoney(0)}</strong></div>
            <div class="checkout-grand-total"><span>Total demonstrativo</span><strong data-checkout-price>${formatMoney(item.pickupPriceCents)}</strong></div>
            <small>Pix · cobrança real desativada</small>
          </div>
          <button class="button button-primary checkout-submit" type="submit">Gerar QR Pix demonstrativo <span>→</span></button>
          <a class="checkout-specialist" href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Olá, equipe Mundo Apple! Quero finalizar com um especialista: ${item.name}, cor ${selected.name}.`)}" target="_blank" rel="noopener">Prefiro finalizar com especialista ↗</a>
          <p class="form-error" data-checkout-error role="alert"></p>
        </form>
      </div>`;
    updateCheckoutPricing(checkoutContent.querySelector("[data-checkout-form]"), item);
  }

  function updateCheckoutPricing(form, item) {
    if (!form || !item) return;
    const deliveryMode = form.elements.deliveryMode?.value || "pickup";
    const isDelivery = deliveryMode === "delivery";
    const quantityInput = form.elements.quantity;
    const quantity = Math.max(1, Number.parseInt(quantityInput?.value, 10) || 1);
    const unitPriceCents = isDelivery ? item.webPriceCents : item.pickupPriceCents;
    const subtotalCents = unitPriceCents * quantity;
    const deliveryFeeCents = isDelivery ? state.delivery.baseFeeCents : 0;
    const address = form.querySelector("[data-address-fields]");
    const providers = form.querySelector("[data-delivery-provider-fields]");
    address.hidden = !isDelivery;
    providers.hidden = !isDelivery;
    address.querySelectorAll("input").forEach((input) => {
      input.disabled = !isDelivery;
      if (["street", "number", "neighborhood", "city", "state", "postalCode"].includes(input.name)) {
        input.required = isDelivery;
      }
    });
    providers.querySelectorAll("input").forEach((input) => {
      input.disabled = !isDelivery;
      input.required = isDelivery;
    });
    form.querySelector("[data-checkout-subtotal]").textContent = formatMoney(subtotalCents);
    form.querySelector("[data-delivery-fee]").textContent = isDelivery
      ? formatMoney(deliveryFeeCents)
      : "Sem taxa";
    form.querySelector("[data-checkout-price]").textContent = formatMoney(
      subtotalCents + deliveryFeeCents,
    );
  }

  function openCheckout(item) {
    renderCheckoutForm(item);
    if (dialog.open) dialog.close();
    checkoutDialog.showModal();
    document.body.classList.add("dialog-open");
  }

  function renderCheckoutResult(item, order) {
    const specialistMessage = encodeURIComponent(
      `Olá, equipe Mundo Apple! Quero finalizar o pedido ${order.orderId} com um especialista.\nProduto: ${item.name}\nCor: ${order.selectedColor}\nModalidade: ${order.deliveryMode === "pickup" ? "Retirada direta" : order.deliveryProviderLabel}\nSubtotal: ${formatMoney(order.subtotalCents)}\nTaxa de envio: ${formatMoney(order.deliveryFeeCents)}\nTotal: ${formatMoney(order.amountCents)}.`,
    );
    checkoutContent.innerHTML = `
      <div class="pix-result">
        <div class="pix-confirmation">
          <span class="pix-status">PEDIDO REGISTRADO</span>
          <h2>Sua cor foi reservada<br>no pedido.</h2>
          <p><strong>${escapeHtml(item.name)}</strong> na cor <strong>${escapeHtml(order.selectedColor)}</strong>.</p>
          <dl>
            <div><dt>Pedido</dt><dd>${escapeHtml(order.orderId)}</dd></div>
            <div><dt>Modalidade</dt><dd>${order.deliveryMode === "pickup" ? "Retirada direta" : escapeHtml(order.deliveryProviderLabel)}</dd></div>
            <div><dt>Subtotal</dt><dd>${formatMoney(order.subtotalCents)}</dd></div>
            <div><dt>Taxa de envio</dt><dd>${order.deliveryFeeCents ? formatMoney(order.deliveryFeeCents) : "Sem taxa"}</dd></div>
            <div><dt>Total</dt><dd>${formatMoney(order.amountCents)}</dd></div>
          </dl>
          <a class="button button-primary" href="https://wa.me/${WHATSAPP}?text=${specialistMessage}" target="_blank" rel="noopener">Finalizar com especialista <span>↗</span></a>
        </div>
        <div class="pix-qr-card">
          <span>PIX DEMONSTRATIVO</span>
          <img src="${escapeHtml(order.qrCodeDataUrl)}" alt="QR Code demonstrativo do pedido">
          <strong>Não efetua pagamento</strong>
          <p>Este QR serve apenas para demonstrar o fluxo. Nenhuma cobrança será feita.</p>
        </div>
      </div>`;
  }

  function openProduct(id) {
    const item = state.items.find((product) => product.id === id);
    if (!item) return;
    state.activeProductId = id;
    renderProductDialog(item);
    dialog.showModal();
    document.body.classList.add("dialog-open");
  }

  async function loadCatalog() {
    try {
      const response = await fetch(CATALOG_ENDPOINT, { headers: { accept: "application/json" } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível carregar o estoque.");
      state.items = Array.isArray(payload.items) ? payload.items : [];
      if (payload.delivery && Number(payload.delivery.baseFeeCents) >= 3_000) {
        state.delivery = {
          ...state.delivery,
          ...payload.delivery,
          providers: Array.isArray(payload.delivery.providers)
            ? payload.delivery.providers
            : state.delivery.providers,
        };
      }
      state.failed = false;
      renderFilters();
      renderCatalog();
    } catch (error) {
      state.failed = true;
      state.items = [];
      renderCatalog();
      emptyState.querySelector("h3").textContent = "Vitrine temporariamente indisponível.";
      emptyState.querySelector("p:not(.eyebrow)").textContent = "Não conseguimos consultar o estoque agora. Fale com Matheus no WhatsApp para receber a lista atualizada.";
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

  sort.addEventListener("change", () => {
    state.sort = sort.value;
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
    const colorButton = event.target.closest("[data-select-color]");
    if (colorButton) {
      const item = state.items.find((product) => product.id === state.activeProductId);
      if (item) {
        state.selectedColors.set(item.id, colorButton.dataset.selectColor);
        renderProductDialog(item);
        const variant = availableColors(item).find((color) => color.name === colorButton.dataset.selectColor);
        if (variant) showToast(`${variant.name} escolhida · ${variant.quantity} ${variant.quantity === 1 ? "unidade" : "unidades"} nessa cor`);
      }
      return;
    }
    const checkoutButton = event.target.closest("[data-start-checkout]");
    if (checkoutButton) {
      const item = state.items.find((product) => product.id === state.activeProductId);
      if (item) openCheckout(item);
      return;
    }
    const presentButton = event.target.closest("[data-present-product]");
    if (presentButton) {
      const visual = dialog.querySelector(".dialog-visual .product-visual");
      visual.classList.toggle("presenting");
      presentButton.innerHTML = visual.classList.contains("presenting")
        ? "<span>■</span> Parar apresentação"
        : "<span>▶</span> Ver apresentação";
      return;
    }
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    if (!checkoutDialog.open) document.body.classList.remove("dialog-open");
  });

  checkoutDialog.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-checkout]") || event.target === checkoutDialog) checkoutDialog.close();
  });
  checkoutDialog.addEventListener("change", (event) => {
    const form = event.target.closest("[data-checkout-form]");
    if (!form || !["deliveryMode", "deliveryProvider", "quantity"].includes(event.target.name)) return;
    const item = state.items.find((product) => product.id === state.activeProductId);
    if (!item) return;
    updateCheckoutPricing(form, item);
  });
  checkoutDialog.addEventListener("input", (event) => {
    const form = event.target.closest("[data-checkout-form]");
    if (!form || event.target.name !== "quantity") return;
    const item = state.items.find((product) => product.id === state.activeProductId);
    updateCheckoutPricing(form, item);
  });
  checkoutDialog.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-checkout-form]");
    if (!form) return;
    event.preventDefault();
    const item = state.items.find((product) => product.id === state.activeProductId);
    const selected = item && selectedVariant(item);
    if (!item || !selected) return;
    const formData = new FormData(form);
    const submitButton = form.querySelector("[type=submit]");
    const errorBox = form.querySelector("[data-checkout-error]");
    submitButton.disabled = true;
    submitButton.textContent = "Registrando pedido...";
    errorBox.textContent = "";
    try {
      const response = await fetch("/api/mundoapple/checkout/pix", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          inventoryId: item.id,
          selectedColor: selected.name,
          quantity: Number(formData.get("quantity")) || 1,
          customerName: formData.get("customerName"),
          customerPhone: formData.get("customerPhone"),
          customerDocument: formData.get("customerDocument"),
          deliveryMode: formData.get("deliveryMode"),
          deliveryProvider: formData.get("deliveryProvider"),
          address: {
            street: formData.get("street"),
            number: formData.get("number"),
            complement: formData.get("complement"),
            neighborhood: formData.get("neighborhood"),
            city: formData.get("city"),
            state: formData.get("state"),
            postalCode: formData.get("postalCode"),
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível registrar o pedido.");
      renderCheckoutResult(item, payload.item);
      showToast(`Pedido registrado na cor ${payload.item.selectedColor}`);
    } catch (error) {
      errorBox.textContent = error.message;
      submitButton.disabled = false;
      submitButton.innerHTML = 'Gerar QR Pix demonstrativo <span>→</span>';
    }
  });
  checkoutDialog.addEventListener("close", () => {
    if (!dialog.open) document.body.classList.remove("dialog-open");
  });

  if (matchMedia("(pointer:fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const stage = document.querySelector("[data-parallax]");
    document.addEventListener("pointermove", (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 12;
      const y = (event.clientY / window.innerHeight - 0.5) * 9;
      stage?.style.setProperty("--parallax-x", `${x}px`);
      stage?.style.setProperty("--parallax-y", `${y}px`);
    }, { passive: true });
  }

  observeReveals();
  loadCatalog();
})();
