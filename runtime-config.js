"use strict";

(function () {
  const DEFAULT_LOCAL_API_BASES = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8787",
    "http://127.0.0.1:8787"
  ];
  const normalizeBase = (value) => String(value || "").trim().replace(/\/$/, "");
  const addBase = (list, value) => {
    const normalized = normalizeBase(value);
    if (!normalized || list.includes(normalized)) {
      return;
    }
    list.push(normalized);
  };
  const bases = [];
  const presetBase = normalizeBase(window.CATALOGO_API_BASE);

  if (presetBase) {
    addBase(bases, presetBase);
  }

  try {
    const saved = localStorage.getItem("catalogo_api_base");
    if (saved) {
      addBase(bases, saved);
    }
  } catch {
    // ignore
  }

  const localHostPattern = /^(localhost|127(?:\.\d{1,3}){3})$/i;
  const isLocalHttp = location.protocol.startsWith("http") && localHostPattern.test(location.hostname);

  if (location.protocol === "file:") {
    DEFAULT_LOCAL_API_BASES.forEach((base) => addBase(bases, base));
  } else if (isLocalHttp && location.port !== "3000") {
    DEFAULT_LOCAL_API_BASES.forEach((base) => addBase(bases, base));
    addBase(bases, location.origin);
  } else {
    addBase(bases, location.origin);
    if (isLocalHttp) {
      DEFAULT_LOCAL_API_BASES.forEach((base) => addBase(bases, base));
    }
  }

  window.CATALOGO_API_BASES = bases;
  window.CATALOGO_API_BASE = bases[0] || normalizeBase(location.origin) || DEFAULT_LOCAL_API_BASES[0];
})();
