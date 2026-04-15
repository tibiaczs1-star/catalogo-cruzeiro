(function () {
  const data = Array.isArray(window.CATALOGO_TELEFONICO_PLUS)
    ? window.CATALOGO_TELEFONICO_PLUS
    : [];

  const normalize = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const digits = (value) => String(value || "").replace(/\D/g, "");

  const escapeHtml = (value) =>
    String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const phoneHref = (phone) => {
    const number = digits(phone);
    if (!number) return "";
    if (number.startsWith("0800") || number.length <= 8) return `tel:${number}`;
    return `tel:+55${number}`;
  };

  const whatsappHref = (phone) => {
    const number = digits(phone);
    if (number.length < 10) return "";
    return `https://wa.me/55${number}`;
  };

  const getSearchText = (item) =>
    normalize(
      [
        item.name,
        item.category,
        item.address,
        item.source,
        ...(item.phones || []),
        ...(item.tags || [])
      ].join(" ")
    );

  const initPhonebookPlus = () => {
    const panel = document.getElementById("catalogo-telefonico");
    if (!panel || !data.length) return;

    const categories = ["Todos", ...Array.from(new Set(data.map((item) => item.category))).sort()];
    let activeCategory = "Todos";
    let query = "";

    panel.classList.add("phonebook-plus");
    panel.innerHTML = `
      <div class="phonebook-plus-head">
        <div>
          <p class="left-rail-title">Catálogo Telefônico</p>
          <h3>Serviços, delivery e lojas de CZS</h3>
        </div>
        <strong id="phonebook-plus-count">${data.length}</strong>
      </div>

      <label class="phonebook-plus-search">
        <span>Buscar no catálogo</span>
        <input id="phonebook-plus-query" type="search" placeholder="pizza, farmácia, mercado, escola..." autocomplete="off" />
      </label>

      <div class="phonebook-plus-categories" id="phonebook-plus-categories">
        ${categories
          .map(
            (category) =>
              `<button type="button" data-phonebook-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`
          )
          .join("")}
      </div>

      <div class="phonebook-plus-list" id="phonebook-plus-list"></div>

      <p class="phonebook-plus-note">
        Base com contatos comerciais e institucionais publicados. Confirme horário e disponibilidade antes de sair.
      </p>
    `;

    const input = panel.querySelector("#phonebook-plus-query");
    const categoryBox = panel.querySelector("#phonebook-plus-categories");
    const list = panel.querySelector("#phonebook-plus-list");
    const count = panel.querySelector("#phonebook-plus-count");

    const render = () => {
      const normalizedQuery = normalize(query);
      const filtered = data
        .filter((item) => activeCategory === "Todos" || item.category === activeCategory)
        .filter((item) => !normalizedQuery || getSearchText(item).includes(normalizedQuery))
        .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

      count.textContent = String(filtered.length);

      list.innerHTML = filtered
        .slice(0, 120)
        .map((item) => {
          const firstPhone = (item.phones || [])[0];
          const tel = firstPhone ? phoneHref(firstPhone) : "";
          const whats = firstPhone ? whatsappHref(firstPhone) : "";
          const phoneButtons = (item.phones || [])
            .map((phone) => {
              const href = phoneHref(phone);
              return href
                ? `<a class="phonebook-plus-phone" href="${href}">${escapeHtml(phone)}</a>`
                : `<span class="phonebook-plus-phone">${escapeHtml(phone)}</span>`;
            })
            .join("");

          return `
            <article class="phonebook-plus-card">
              <div class="phonebook-plus-card-top">
                <span>${escapeHtml(item.category)}</span>
                <small>${escapeHtml(item.verified || "verificar")}</small>
              </div>
              <h4>${escapeHtml(item.name)}</h4>
              <p>${escapeHtml(item.address || "Cruzeiro do Sul - AC")}</p>
              <div class="phonebook-plus-phones">
                ${phoneButtons || (item.website ? `<a class="phonebook-plus-phone" href="${escapeHtml(item.website)}" target="_blank" rel="noreferrer">abrir site/app</a>` : "<span class=\"phonebook-plus-phone muted\">sem telefone público</span>")}
              </div>
              <div class="phonebook-plus-actions">
                ${tel ? `<a href="${tel}">Ligar</a>` : ""}
                ${whats ? `<a href="${whats}" target="_blank" rel="noreferrer">WhatsApp</a>` : ""}
                ${item.website ? `<a href="${escapeHtml(item.website)}" target="_blank" rel="noreferrer">Site/App</a>` : ""}
                ${item.sourceUrl ? `<a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noreferrer">Fonte</a>` : ""}
              </div>
            </article>
          `;
        })
        .join("");

      if (!filtered.length) {
        list.innerHTML = `
          <article class="phonebook-plus-card empty">
            <h4>Nada encontrado</h4>
            <p>Tente buscar por categoria, bairro, nome da loja ou tipo de serviço.</p>
          </article>
        `;
      }

      categoryBox.querySelectorAll("button").forEach((button) => {
        button.classList.toggle("active", button.dataset.phonebookCategory === activeCategory);
      });
    };

    input.addEventListener("input", (event) => {
      query = event.target.value;
      render();
    });

    categoryBox.addEventListener("click", (event) => {
      const button = event.target.closest("[data-phonebook-category]");
      if (!button) return;
      activeCategory = button.dataset.phonebookCategory || "Todos";
      render();
    });

    render();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPhonebookPlus);
  } else {
    initPhonebookPlus();
  }
})();
