"use strict";

(function () {
  const ITEM_ID = "menu-administrativo-catalogo";
  const LINK_SELECTOR = "[data-admin-dashboard-link]";

  function resolveApiBase() {
    if (typeof window.CATALOGO_API_BASE === "string" && window.CATALOGO_API_BASE) {
      return window.CATALOGO_API_BASE.replace(/\/$/, "");
    }
    if (location.protocol === "file:") return "http://localhost:8787";
    return location.origin;
  }

  function buildDashboardUrl() {
    const base = resolveApiBase();
    return `${base}/admin/admin-dashboard.html`;
  }

  function hydrateDashboardLinks() {
    const url = buildDashboardUrl();
    const nodes = Array.from(document.querySelectorAll(LINK_SELECTOR));

    nodes.forEach((node) => {
      if (!(node instanceof HTMLAnchorElement)) {
        return;
      }

      node.href = url;
      node.target = "_blank";
      node.rel = "noopener noreferrer";
    });

    return nodes.length > 0;
  }

  function createAdminButton() {
    const button = document.createElement("a");
    button.href = buildDashboardUrl();
    button.id = ITEM_ID;
    button.className = "admin-menu-link";
    button.setAttribute("data-admin-dashboard-link", "");
    button.target = "_blank";
    button.rel = "noopener noreferrer";
    button.textContent = "Administrativo";
    return button;
  }

  function appendIn(container) {
    if (!container || document.getElementById(ITEM_ID)) return false;

    const button = createAdminButton();
    const tag = container.tagName.toLowerCase();

    if (tag === "ul" || tag === "ol") {
      const li = document.createElement("li");
      li.className = "admin-menu-item";
      li.appendChild(button);
      container.appendChild(li);
      return true;
    }

    if (container.matches("nav, .menu-local, .menu-list, .left-menu, .side-menu")) {
      const wrap = document.createElement("div");
      wrap.className = "admin-menu-item";
      wrap.appendChild(button);
      container.appendChild(wrap);
      return true;
    }

    return false;
  }

  function injectMenuItem() {
    if (document.getElementById(ITEM_ID)) return;

    const selectors = [
      ".menu-local",
      ".menu-list",
      ".left-menu",
      ".side-menu",
      "aside nav",
      "header nav ul",
      "header nav",
      "nav ul",
      "nav"
    ];

    for (const selector of selectors) {
      const nodes = Array.from(document.querySelectorAll(selector));
      for (const node of nodes) {
        if (appendIn(node)) return;
      }
    }
  }

  function init() {
    const hasManualLink = hydrateDashboardLinks();
    if (!hasManualLink) {
      injectMenuItem();
    }

    const observer = new MutationObserver(() => {
      const hasLink = hydrateDashboardLinks();
      if (!hasLink) {
        injectMenuItem();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
