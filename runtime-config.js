"use strict";

(function () {
  if (typeof window.CATALOGO_API_BASE === "string" && window.CATALOGO_API_BASE) {
    return;
  }

  try {
    const saved = localStorage.getItem("catalogo_api_base");
    if (saved) {
      window.CATALOGO_API_BASE = saved.replace(/\/$/, "");
      return;
    }
  } catch {
    // ignore
  }

  if (location.protocol === "file:") {
    window.CATALOGO_API_BASE = "http://localhost:8787";
    return;
  }

  window.CATALOGO_API_BASE = location.origin;
})();
