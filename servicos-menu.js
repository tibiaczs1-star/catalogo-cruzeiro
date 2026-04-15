"use strict";

(function () {
  const ITEM_ID = "catalogo-servicos-menu-link";

  const MODULES = [
    { id: "restaurantes", label: "Restaurantes" },
    { id: "farmacias", label: "Farmácias" },
    { id: "saude", label: "Saúde" },
    { id: "transporte", label: "Transporte" },
    { id: "locacao-transporte", label: "Locação e Transporte" },
    { id: "ninjas-cruzeiro", label: "Ninjas Cruzeiro" },
    { id: "emergencia", label: "Emergência" }
  ];

  function createMainLink() {
    const a = document.createElement("a");
    a.href = "catalogo-servicos.html";
    a.id = ITEM_ID;
    a.className = "servicos-menu-link";
    a.textContent = "Catálogo de Serviços";
    return a;
  }

  function createModulesRow() {
    const wrap = document.createElement("div");
    wrap.className = "servicos-modulos-row";
    wrap.innerHTML = MODULES.map(
      (module) => {
        const href =
          module.id === "ninjas-cruzeiro"
            ? "ninjas.html"
            : `catalogo-servicos.html?modulo=${encodeURIComponent(module.id)}`;
        return `<a class="servicos-modulo-link" href="${href}">${module.label}</a>`;
      }
    ).join("");
    return wrap;
  }

  function attach(container) {
    if (!container || document.getElementById(ITEM_ID)) return false;

    const wrapper = document.createElement("div");
    wrapper.className = "servicos-menu-item";
    wrapper.append(createMainLink(), createModulesRow());

    const tag = container.tagName.toLowerCase();
    if (tag === "ul" || tag === "ol") {
      const li = document.createElement("li");
      li.appendChild(wrapper);
      container.appendChild(li);
      return true;
    }

    container.appendChild(wrapper);
    return true;
  }

  function inject() {
    if (document.getElementById(ITEM_ID)) return;
    const selectors = [
      ".menu-local",
      ".menu-list",
      ".left-menu",
      ".side-menu",
      "aside nav",
      "header nav ul",
      "nav ul",
      "nav"
    ];
    for (const selector of selectors) {
      const nodes = Array.from(document.querySelectorAll(selector));
      for (const node of nodes) {
        if (attach(node)) return;
      }
    }
  }

  function initPhonebookRedirects() {
    const mapping = {
      EMERGENCIA: "emergencia",
      "EMERGÊNCIA": "emergencia",
      SAUDE: "saude",
      "SAÚDE": "saude",
      TRANSPORTE: "transporte",
      SERVICOS: "utilidades",
      "SERVIÇOS": "utilidades",
      RESTAURANTES: "restaurantes",
      FARMACIAS: "farmacias",
      "FARMÁCIAS": "farmacias"
    };

    const clickable = Array.from(
      document.querySelectorAll(
        ".servicos-menu-item button, .servicos-menu-item a, [data-servicos-module], [data-servico-modulo]"
      )
    );

    clickable.forEach((node) => {
      const label = String(node.textContent || "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();
      const explicitModuleId = node.getAttribute("data-servicos-module") || node.getAttribute("data-servico-modulo");
      const moduleId = explicitModuleId || mapping[label];
      if (!moduleId) return;
      if (node.getAttribute("data-servicos-linked") === "1") return;
      node.setAttribute("data-servicos-linked", "1");
      node.style.cursor = "pointer";
      node.addEventListener("click", (event) => {
        if (explicitModuleId) {
          event.preventDefault();
        }

        location.href = `catalogo-servicos.html?modulo=${encodeURIComponent(moduleId)}`;
      });
    });
  }

  function init() {
    inject();
    initPhonebookRedirects();
    const observer = new MutationObserver(() => {
      inject();
      initPhonebookRedirects();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
