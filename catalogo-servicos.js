"use strict";

(function () {
  const DATA = window.CATALOGO_SERVICOS_DATA || { modules: [] };

  function safe(v) {
    return String(v || "").trim();
  }

  function slug(v) {
    return safe(v)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function digits(v) {
    return safe(v).replace(/\D/g, "");
  }

  function toTel(phone) {
    const d = digits(phone);
    if (!d) return "";
    if (d.length <= 4) return `tel:${d}`;
    return `tel:+55${d}`;
  }

  function toWhats(phone) {
    const d = digits(phone);
    if (!d) return "";
    return `https://wa.me/55${d}`;
  }

  function getModuleIdFromUrl() {
    const params = new URLSearchParams(location.search);
    return slug(params.get("modulo") || params.get("module") || "");
  }

  function buildTabs(modules, activeId) {
    const el = document.getElementById("svcTabs");
    if (!el) return;
    el.innerHTML = modules
      .map((module) => {
        const active = slug(module.id) === activeId;
        return `<button class="svc-tab ${active ? "is-active" : ""}" data-module="${module.id}">
          ${module.title}
        </button>`;
      })
      .join("");
  }

  function updateHero(module) {
    const hero = document.getElementById("svcHero");
    const title = document.getElementById("svcTitle");
    const subtitle = document.getElementById("svcSubtitle");
    if (!hero || !title || !subtitle || !module) return;
    hero.style.backgroundImage = `url("${module.photoUrl || ""}")`;
    title.textContent = module.title || "Catálogo Telefônico";
    subtitle.textContent =
      module.subtitle ||
      "Números úteis em módulos para facilitar a busca e contato rápido.";
  }

  function cardHtml(item) {
    const actions = [];
    if (item.phone) {
      actions.push(`<a class="svc-btn primary" href="${toTel(item.phone)}">Ligar ${item.phone}</a>`);
    }
    if (item.whatsapp) {
      actions.push(
        `<a class="svc-btn" href="${toWhats(item.whatsapp)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>`
      );
    }
    if (item.website) {
      actions.push(
        `<a class="svc-btn" href="${item.website}" target="_blank" rel="noopener noreferrer">Abrir site/app</a>`
      );
    }
    if (!actions.length) {
      actions.push(`<span class="svc-tag em-breve">Em breve</span>`);
    }

    const tagClass = item.status === "em-breve" ? "svc-tag em-breve" : "svc-tag";
    return `
      <article class="svc-card">
        <h3>${item.name}</h3>
        <p>${item.description || ""}</p>
        ${item.status ? `<span class="${tagClass}">${item.status.replace("-", " ")}</span>` : ""}
        <div class="svc-actions">
          ${actions.join("")}
        </div>
      </article>
    `;
  }

  function renderSources(module) {
    const el = document.getElementById("svcSources");
    if (!el || !module) return;
    const links = module.items
      .map((item) => item.source)
      .filter(Boolean)
      .filter((value, idx, arr) => arr.indexOf(value) === idx);

    el.innerHTML = links.length
      ? `<strong>Fontes públicas consultadas:</strong><ul>${links
          .map((link) => `<li><a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a></li>`)
          .join("")}</ul>`
      : "<strong>Fontes:</strong> diretórios públicos e canais oficiais.";
  }

  function renderModule(module) {
    if (!module) return;
    updateHero(module);

    const grid = document.getElementById("svcGrid");
    if (!grid) return;
    grid.innerHTML = module.items.map(cardHtml).join("");
    renderSources(module);
  }

  function setupSearch(modules, getActiveId, setActiveModule) {
    const input = document.getElementById("svcSearch");
    if (!input) return;

    input.addEventListener("input", () => {
      const active = modules.find((m) => slug(m.id) === getActiveId());
      if (!active) return;
      const q = slug(input.value);
      if (!q) {
        renderModule(active);
        return;
      }

      const filtered = {
        ...active,
        items: active.items.filter((item) => {
          const text = slug(`${item.name} ${item.description} ${item.phone || ""}`);
          return text.includes(q);
        })
      };
      renderModule(filtered);
    });

    const resetByTab = () => {
      input.value = "";
      const active = modules.find((m) => slug(m.id) === getActiveId());
      if (active) renderModule(active);
    };

    window.addEventListener("catalogo:module-change", resetByTab);
  }

  function setupTabs(modules, state) {
    const tabs = document.getElementById("svcTabs");
    if (!tabs) return;

    tabs.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest(".svc-tab") : null;
      if (!target) return;
      const moduleId = slug(target.getAttribute("data-module"));
      const module = modules.find((m) => slug(m.id) === moduleId);
      if (!module) return;

      state.activeId = moduleId;
      const next = new URL(location.href);
      next.searchParams.set("modulo", module.id);
      history.replaceState({}, "", next.toString());
      buildTabs(modules, state.activeId);
      renderModule(module);
      window.dispatchEvent(new CustomEvent("catalogo:module-change"));
    });
  }

  function init() {
    const modules = Array.isArray(DATA.modules) ? DATA.modules : [];
    if (!modules.length) return;

    const requested = getModuleIdFromUrl();
    const defaultModule = modules.find((m) => slug(m.id) === requested) || modules[0];
    const state = { activeId: slug(defaultModule.id) };

    buildTabs(modules, state.activeId);
    renderModule(defaultModule);
    setupTabs(modules, state);
    setupSearch(modules, () => state.activeId);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
