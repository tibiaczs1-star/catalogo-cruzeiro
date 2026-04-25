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
    document.body.dataset.svcModule = slug(module.id);
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
    if (item.ctaHref) {
      const target = /^#/.test(item.ctaHref) ? "" : ` target="_blank" rel="noopener noreferrer"`;
      actions.push(`<a class="svc-btn" href="${item.ctaHref}"${target}>${item.ctaLabel || "Ver destaque"}</a>`);
    }
    if (!actions.length) {
      actions.push(`<span class="svc-tag em-breve">Em preparação</span>`);
    }

    const statusValue = safe(item.status).replace(/-/g, " ");
    const statusSlug = slug(item.status);
    const tagClass =
      statusSlug === "em-breve"
        ? "svc-tag em-breve"
        : statusSlug === "destaque"
          ? "svc-tag destaque"
          : "svc-tag";
    const cardClass = statusSlug === "destaque" ? "svc-card is-featured" : "svc-card";
    return `
      <article class="${cardClass}">
        <h3>${item.name}</h3>
        <p>${item.description || ""}</p>
        ${item.status ? `<span class="${tagClass}">${statusValue}</span>` : ""}
        <div class="svc-actions">
          ${actions.join("")}
        </div>
      </article>
    `;
  }

  function renderFeatured(module) {
    const el = document.getElementById("svcFeatured");
    if (!el) return;

    const featured = module?.featured;
    const isConstructionModule = slug(module?.id) === "locacao-transporte";
    if (!featured) {
      el.hidden = true;
      el.innerHTML = "";
      return;
    }

    if (isConstructionModule) {
      el.hidden = false;
      el.innerHTML = `
        <article class="svc-featured svc-construction-only">
          <div class="svc-feature-copy">
            <span class="svc-feature-eyebrow">${featured.eyebrow || "em construção"}</span>
            <h2>${featured.title || "Projeto Uber e Logística CZS em construção"}</h2>
            <p>${featured.description || "O projeto Uber e Logística CZS ainda está em construção."}</p>
          </div>
        </article>
      `;
      return;
    }

    const chips = Array.isArray(featured.chips) ? featured.chips : [];
    const bullets = Array.isArray(featured.bullets) ? featured.bullets : [];
    const miniCards = Array.isArray(featured.miniCards) ? featured.miniCards : [];

    el.hidden = false;
    el.innerHTML = `
      <article class="svc-featured">
        <div class="svc-feature-copy">
          <span class="svc-feature-eyebrow">${featured.eyebrow || "destaque premium"}</span>
          <h2>${featured.title || "Destaque do modulo"}</h2>
          <p>${featured.description || ""}</p>
          <div class="svc-feature-chip-row">
            ${chips.map((chip) => `<span>${chip}</span>`).join("")}
          </div>
          <ul class="svc-feature-list">
            ${bullets.map((item) => `<li>${item}</li>`).join("")}
          </ul>
          ${
            isConstructionModule
              ? `<div class="svc-construction-strip" aria-label="Modulo em construcao">
                  <div class="svc-construction-sign">
                    <span>EM CONSTRUCAO</span>
                    <strong>Robos montando os cards do modulo</strong>
                  </div>
                  <div class="svc-pixel-worker-field" aria-hidden="true">
                    <span class="svc-pixel-card board-a"></span>
                    <span class="svc-pixel-card board-b"></span>
                    <span class="svc-pixel-card board-c"></span>
                    <span class="svc-pixel-bot bot-a"></span>
                    <span class="svc-pixel-bot bot-b"></span>
                    <span class="svc-pixel-bot bot-c"></span>
                    <span class="svc-pixel-spark spark-a"></span>
                    <span class="svc-pixel-spark spark-b"></span>
                    <span class="svc-pixel-sand"></span>
                  </div>
                </div>`
              : ""
          }
          <div class="svc-feature-actions">
            <a class="svc-btn primary" href="#svcGrid">Ver cards do modulo</a>
            <a class="svc-btn" href="index.html">Voltar para home</a>
          </div>
        </div>

        <div class="svc-feature-visual" aria-hidden="true">
          <span class="svc-feature-ring ring-a"></span>
          <span class="svc-feature-ring ring-b"></span>
          <span class="svc-feature-ring ring-c"></span>
          <div class="svc-feature-headset">
            <span class="svc-feature-lens lens-a"></span>
            <span class="svc-feature-lens lens-b"></span>
            <span class="svc-feature-visor"></span>
          </div>
          <div class="svc-feature-controller left"></div>
          <div class="svc-feature-controller right"></div>
          <div class="svc-feature-mini-row">
            ${miniCards
              .map(
                (card) => `
                  <article class="svc-feature-mini">
                    <strong>${card.title || ""}</strong>
                    <small>${card.text || ""}</small>
                  </article>
                `
              )
              .join("")}
          </div>
          <div class="svc-feature-accent">${featured.accent || "vr"}</div>
        </div>
      </article>
    `;
  }

  function renderSources(module) {
    const el = document.getElementById("svcSources");
    if (!el || !module) return;
    if (slug(module.id) === "locacao-transporte") {
      el.hidden = true;
      el.innerHTML = "";
      return;
    }

    el.hidden = false;
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

  function renderAds(module) {
    const el = document.getElementById("svcAdsRack");
    if (!el || !module) return;

    const moduleTitle = safe(module.title || "Serviços locais");
    const moduleLabel = safe(module.adLabel || module.title || "catalogo local");

    el.hidden = false;
    el.innerHTML = `
      <div class="svc-ads-head">
        <div>
          <span>espaços de propaganda</span>
          <strong>Anúncios prontos para vender neste módulo</strong>
        </div>
        <a class="svc-btn" href="./index.html#monetizacao">Reservar anúncio</a>
      </div>

      <div class="svc-ads-grid">
        <a class="svc-ad-slot svc-ad-slot-wide" href="./index.html#monetizacao">
          <span>anúncio principal 728 x 90</span>
          <strong>${moduleTitle} com chamada premium no topo desta área</strong>
          <small>Espaço para marca, serviço, clínica, loja, agenda ou campanha local com clique direto.</small>
        </a>

        <a class="svc-ad-slot" href="./index.html#monetizacao">
          <span>vitrine local</span>
          <strong>Chamada patrocinada dentro de ${moduleLabel}</strong>
          <small>Formato enxuto para telefone, WhatsApp, bairro, oferta e chamada.</small>
        </a>

        <a class="svc-ad-slot" href="./index.html#monetizacao">
          <span>destaque de bairro</span>
          <strong>Anúncio rápido para público da região</strong>
          <small>Bom para eventos, restaurantes, farmácias, serviços e utilidade pública patrocinada.</small>
        </a>
      </div>
    `;
  }

  function renderModule(module) {
    if (!module) return;
    updateHero(module);
    renderFeatured(module);

    const grid = document.getElementById("svcGrid");
    if (!grid) return;
    if (slug(module.id) === "locacao-transporte") {
      grid.hidden = true;
      grid.innerHTML = "";
      const disclaimer = document.querySelector(".svc-disclaimer");
      if (disclaimer) {
        disclaimer.hidden = true;
      }
      renderAds(module);
      renderSources(module);
      return;
    }

    grid.hidden = false;
    const disclaimer = document.querySelector(".svc-disclaimer");
    if (disclaimer) {
      disclaimer.hidden = false;
    }
    grid.innerHTML = module.items.map(cardHtml).join("");
    renderAds(module);
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
