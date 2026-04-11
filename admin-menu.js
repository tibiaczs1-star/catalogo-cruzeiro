"use strict";

(function () {
  const ADMIN_PASSWORD = "99831455a";
  const TOKEN_KEY = "catalogo_admin_token";
  const ITEM_ID = "menu-administrativo-catalogo";

  function resolveApiBase() {
    if (typeof window.CATALOGO_API_BASE === "string" && window.CATALOGO_API_BASE) {
      return window.CATALOGO_API_BASE.replace(/\/$/, "");
    }
    if (location.protocol === "file:") return "http://localhost:8787";
    return location.origin;
  }

  function openDashboard(token) {
    const base = resolveApiBase();
    const url = `${base}/admin/admin-dashboard.html?token=${encodeURIComponent(token)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function ensureTokenAndOpen() {
    const saved = localStorage.getItem(TOKEN_KEY) || "";
    if (saved === ADMIN_PASSWORD) {
      openDashboard(saved);
      return;
    }

    const typed = window.prompt("Senha administrativa:");
    if (!typed) return;

    if (String(typed).trim() !== ADMIN_PASSWORD) {
      window.alert("Senha incorreta.");
      return;
    }

    localStorage.setItem(TOKEN_KEY, ADMIN_PASSWORD);
    openDashboard(ADMIN_PASSWORD);
  }

  function createAdminButton() {
    const button = document.createElement("a");
    button.href = "#";
    button.id = ITEM_ID;
    button.className = "admin-menu-link";
    button.textContent = "Administrativo";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      ensureTokenAndOpen();
    });
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
    injectMenuItem();
    const observer = new MutationObserver(() => injectMenuItem());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
