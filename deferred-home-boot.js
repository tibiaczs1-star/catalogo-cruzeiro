(function () {
  const essentialDeferredScripts = [
    "admin-menu.js?v=20260508-public-nav1",
    "analytics-client.js?v=20260510-mobile-ready1",
    "engagement-api.js?v=20260411k",
    "servicos-menu.js?v=20260511-no-ninjas1"
  ];
  const visualDeferredScripts = [
    "./insiders-crowd-march.js?v=20260426pt-caption",
    "./news-photo-fix.js?v=20260415c",
    "./arquivo-noticias.js?v=20260415b",
    "elections-static-fix.js?v=20260415b",
    "acre-photo-cards.js?v=20260415a",
    "catalogo-telefonico-plus-data.js?v=20260413a",
    "catalogo-telefonico-plus.js?v=20260508-preview1",
    "rodape-voz-humana.js?v=20260411o",
    "sala-redacao-real.js?v=20260414q",
    "photo-layout-fix.js?v=20260411ab",
    "agentes-newsroom-hero.js?v=20260413ac",
    "pro-design.js?v=20260413b"
  ];
  function loadScript(src) {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.onload = resolve;
      script.onerror = resolve;
      document.body.appendChild(script);
    });
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, Math.max(0, ms)));
  }

  function waitForIdle(timeout) {
    return new Promise((resolve) => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(resolve, { timeout });
        return;
      }

      window.setTimeout(resolve, Math.min(timeout, 900));
    });
  }

  async function loadDeferredScripts(scripts, gapMs) {
    for (const src of scripts) {
      // keep sequence predictable because some files depend on earlier globals
      // eslint-disable-next-line no-await-in-loop
      await waitForIdle(2200);
      // eslint-disable-next-line no-await-in-loop
      await loadScript(src);
      // eslint-disable-next-line no-await-in-loop
      await wait(gapMs);
    }
  }

  function scheduleDeferredBoot() {
    const runEssentials = () => {
      window.setTimeout(() => {
        loadDeferredScripts(essentialDeferredScripts, 280).catch(() => {});
      }, 1600);
    };
    const runVisualEnhancements = () => {
      window.setTimeout(() => {
        loadDeferredScripts(visualDeferredScripts, 420).catch(() => {});
      }, 6200);
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(runEssentials, { timeout: 2600 });
      window.requestIdleCallback(runVisualEnhancements, { timeout: 7000 });
      return;
    }

    window.setTimeout(runEssentials, 2400);
    window.setTimeout(runVisualEnhancements, 7600);
  }

  if (document.readyState === "complete") {
    scheduleDeferredBoot();
  } else {
    window.addEventListener("load", scheduleDeferredBoot, { once: true });
  }
})();
