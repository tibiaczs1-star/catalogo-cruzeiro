"use strict";

(() => {
  const fullScriptSrc = "./script.js?v=20260524-fastboot2";
  const compact =
    typeof window.matchMedia === "function" && window.matchMedia("(max-width: 820px)").matches;
  const intentEvents = ["pointerdown", "keydown", "wheel", "touchstart"];
  const heavySectionSelector = [
    "#radar",
    "#social",
    "#trending",
    "#comentarios",
    "#founders",
    "#newsletter",
    "#participacao-comunitaria",
    "#monetizacao"
  ].join(",");

  let observer = null;
  let fallbackTimer = 0;

  const cleanupIntentListeners = () => {
    intentEvents.forEach((eventName) => {
      window.removeEventListener(eventName, loadFullScript, { capture: true });
    });
  };

  function loadFullScript(reason = "reader-intent") {
    if (window.__CATALOGO_FULL_SCRIPT_STARTED__) {
      return;
    }

    window.__CATALOGO_FULL_SCRIPT_STARTED__ = true;
    window.__CATALOGO_FULL_SCRIPT_REASON__ =
      typeof reason === "string" ? reason : "reader-intent";
    cleanupIntentListeners();
    observer?.disconnect();
    if (fallbackTimer) {
      window.clearTimeout(fallbackTimer);
      fallbackTimer = 0;
    }

    const script = document.createElement("script");
    script.src = fullScriptSrc;
    script.async = true;
    script.dataset.catalogoFullScript = "true";
    document.body.appendChild(script);
  }

  const armSectionObserver = () => {
    const sections = [...document.querySelectorAll(heavySectionSelector)];
    if (!sections.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadFullScript("section-near-viewport");
        }
      },
      {
        root: null,
        rootMargin: "30% 0px",
        threshold: 0.01
      }
    );

    sections.forEach((section) => observer.observe(section));
  };

  const armIntentListeners = () => {
    intentEvents.forEach((eventName) => {
      window.addEventListener(eventName, loadFullScript, {
        capture: true,
        once: true,
        passive: eventName !== "keydown"
      });
    });
  };

  const armFallback = () => {
    fallbackTimer = window.setTimeout(
      () => loadFullScript("quiet-reader-fallback"),
      compact ? 32000 : 28000
    );
  };

  const start = () => {
    armSectionObserver();
    armIntentListeners();
    armFallback();
    window.CatalogoHomeMainLoader = {
      load: loadFullScript,
      ready: true
    };
  };

  if (window.__CATALOGO_LOGO_SPLASH_DONE__ || document.body.classList.contains("site-loaded")) {
    window.setTimeout(start, compact ? 1800 : 1400);
    return;
  }

  window.addEventListener(
    "catalogo:logo-splash-finished",
    () => window.setTimeout(start, compact ? 1800 : 1400),
    { once: true }
  );
  window.setTimeout(start, compact ? 8000 : 7600);
})();
