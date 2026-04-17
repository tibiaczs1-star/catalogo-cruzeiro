"use strict";

(function () {
  const MODULES = [
    {
      key: "POLÍTICA LOCAL",
      items: [
        "Agenda da prefeitura e câmara com contexto local",
        "Repasse de recursos e obras com data de entrega",
        "Movimentação de bastidores explicada sem jargão"
      ],
      href: "index.html#eleicoes"
    },
    {
      key: "POLICIA",
      items: [
        "Ocorrências confirmadas com horário e bairro",
        "Alertas de segurança com atualização diária",
        "Quadro de queda/alta de crimes por recorte local"
      ],
      href: "index.html#radar"
    },
    {
      key: "SERVICO",
      items: [
        "Calendário escolar, provas e editais em um só lugar",
        "Agenda de serviços e canais oficiais de atendimento",
        "Bloco de utilidades com números prontos para ligar"
      ],
      href: "catalogo-servicos.html?modulo=utilidades"
    },
    {
      key: "SAUDE",
      items: [
        "Hospitais, UBS e campanha atualizados",
        "Mapa de vacinação e prevenção por bairro",
        "Canal rápido para emergências de saúde"
      ],
      href: "catalogo-servicos.html?modulo=saude"
    },
    {
      key: "CULTURA E CIDADE",
      items: [
        "Eventos, festivais e agenda da semana",
        "Projetos locais, memória e patrimônio da cidade",
        "Cobertura de lazer, turismo e economia criativa"
      ],
      href: "index.html#trending"
    }
  ];

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  }

  function apiBase() {
    if (typeof window.CATALOGO_API_BASE === "string" && window.CATALOGO_API_BASE) {
      return window.CATALOGO_API_BASE.replace(/\/$/, "");
    }
    if (location.protocol === "file:") return "http://localhost:8787";
    return location.origin;
  }

  function findSection() {
    const headings = Array.from(document.querySelectorAll("h1, h2, h3"));
    const title = headings.find((node) => /sala de reda[cç][aã]o/i.test(node.textContent || ""));
    if (!title) return null;
    return title.closest("section, article, .block, .panel, main") || null;
  }

  function findCards(section) {
    const candidates = Array.from(
      section.querySelectorAll("article, .card, .module-card, .news-card, .editoria-card, div")
    );
    const keys = MODULES.map((item) => item.key);
    return candidates.filter((node) => {
      if (node.classList.contains("sr-live-panel")) return false;
      const text = normalize(node.textContent);
      if (!text) return false;
      return keys.some((key) => text.includes(key));
    });
  }

  function pickModuleByText(text) {
    const raw = normalize(text);
    return MODULES.find((module) => raw.includes(module.key)) || null;
  }

  function patchCard(card, module) {
    if (!card || !module) return;
    if (card.getAttribute("data-sr-real") === "1") return;
    card.setAttribute("data-sr-real", "1");

    const block = document.createElement("div");
    block.className = "sr-real-block";
    block.innerHTML = `
      <p class="sr-real-title">Já em produção</p>
      <ul class="sr-real-list">
        ${module.items.map((item) => `<li>${item}</li>`).join("")}
      </ul>
      <a class="sr-real-link" href="${module.href}">Abrir módulo</a>
    `;
    card.appendChild(block);
  }

  async function fillLivePanel(panel) {
    const list = panel.querySelector(".sr-live-list");
    if (!list) return;

    list.innerHTML = `<li>Buscando atualizações reais do agregador...</li>`;

    try {
      const response = await fetch(`${apiBase()}/api/news/aggregator?limit=6`);
      if (!response.ok) throw new Error("api off");
      const payload = await response.json();
      const items = Array.isArray(payload?.items) ? payload.items.slice(0, 6) : [];
      if (!items.length) throw new Error("sem itens");

      list.innerHTML = items
        .map((item) => {
          const title = String(item.title || "Atualização");
          const link = item.slug
            ? `./noticia.html?slug=${encodeURIComponent(item.slug)}`
            : String(item.url || item.sourceUrl || "#");
          const source = String(item.sourceLabel || item.sourceName || item.source || "fonte local");
          const linkAttrs = /^https?:\/\//i.test(link)
            ? ' target="_blank" rel="noopener noreferrer"'
            : "";
          return `<li><a href="${link}"${linkAttrs}>${title}</a><small>${source}</small></li>`;
        })
        .join("");
    } catch {
      list.innerHTML = `
        <li><a href="catalogo-servicos.html?modulo=emergencia">Números de emergência e serviço já disponíveis</a><small>atual</small></li>
        <li><a href="catalogo-servicos.html?modulo=restaurantes">Catálogo telefônico de restaurantes ativo</a><small>atual</small></li>
        <li><a href="catalogo-servicos.html?modulo=saude">Módulo saúde com contatos rápidos</a><small>atual</small></li>
      `;
    }
  }

  function ensureLivePanel(section) {
    if (!section || section.querySelector(".sr-live-panel")) return;
    const panel = document.createElement("div");
    panel.className = "sr-live-panel";
    panel.innerHTML = `
      <p class="sr-live-head">Atualizações reais da redação</p>
      <ul class="sr-live-list"></ul>
    `;
    section.appendChild(panel);
    fillLivePanel(panel);
  }

  function init() {
    const section = findSection();
    if (!section) return;

    const cards = findCards(section);
    cards.forEach((card) => {
      const module = pickModuleByText(card.textContent || "");
      if (module) patchCard(card, module);
    });

    ensureLivePanel(section);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
