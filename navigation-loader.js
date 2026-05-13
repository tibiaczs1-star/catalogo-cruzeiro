"use strict";

(function () {
  if (window.CatalogoSharedNavigationLoader?.ready) {
    return;
  }

  const loaderStyleId = "catalogo-shared-navigation-loader-style";
  const skipHomeIntroKey = "catalogo_skip_home_intro_once";
  const pendingLoaderKey = "catalogo_page_action_loader_pending_v1";
  const handledPages = /\/(?:index|noticia|arquivo|galeria|cheffe-call)\.html$/i;
  const minimumMs = 520;
  const maximumMs = 980;
  let activeLoader = null;
  let activeStartedAt = 0;

  const injectStyle = () => {
    if (document.getElementById(loaderStyleId)) {
      return;
    }

    const style = document.createElement("style");
    style.id = loaderStyleId;
    style.textContent = `
      .catalogo-top-return-loader {
        position: fixed;
        left: 50%;
        bottom: max(1rem, env(safe-area-inset-bottom));
        z-index: 2147483000;
        width: min(520px, calc(100vw - 24px));
        padding: 0.74rem 0.84rem;
        border: 1px solid rgba(86, 157, 217, 0.35);
        border-radius: 18px;
        background: linear-gradient(160deg, rgba(4, 18, 32, 0.96), rgba(10, 37, 61, 0.94));
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.36), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        color: #eff8ff;
        font-family: Inter, Sora, system-ui, sans-serif;
        opacity: 0;
        pointer-events: none;
        transform: translate(-50%, 18px);
        transition: opacity 180ms ease, transform 180ms ease;
      }

      .catalogo-top-return-loader.is-visible {
        opacity: 1;
        transform: translate(-50%, 0);
      }

      .catalogo-top-return-loader.is-leaving {
        opacity: 0;
        transform: translate(-50%, 12px);
      }

      .catalogo-top-return-loader-track {
        display: block;
        width: 100%;
        height: 5px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.12);
      }

      .catalogo-top-return-loader-track i {
        display: block;
        width: 10%;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #43b8ff, #ffd66a);
        box-shadow: 0 0 18px rgba(255, 214, 106, 0.42);
        transition: width 180ms ease;
      }

      .catalogo-top-return-loader-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.8rem;
        margin-top: 0.54rem;
        font-weight: 900;
        letter-spacing: 0;
      }

      .catalogo-top-return-loader-text {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .catalogo-top-return-loader-row strong {
        color: #ffd66a;
      }

      @media (max-width: 620px) {
        .catalogo-top-return-loader {
          bottom: calc(0.7rem + env(safe-area-inset-bottom));
          border-radius: 16px;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const setPendingLoader = () => {
    try {
      sessionStorage.setItem(pendingLoaderKey, "1");
    } catch (_error) {
      // Navegacao continua mesmo sem sessionStorage.
    }
  };

  const setSkipHomeIntro = () => {
    try {
      sessionStorage.setItem(skipHomeIntroKey, "1");
    } catch (_error) {
      // Home ainda abre normalmente se o storage estiver bloqueado.
    }
  };

  const normalizeTargetUrl = (href) => {
    try {
      const target = new URL(href, window.location.href);
      if (target.origin !== window.location.origin) {
        return null;
      }

      if (!handledPages.test(target.pathname)) {
        return null;
      }

      if (/\/index\.html$/i.test(target.pathname) || target.pathname === "/") {
        target.searchParams.set("skipIntro", "1");
      }

      return target;
    } catch (_error) {
      return null;
    }
  };

  const labelForUrl = (target) => {
    const path = target?.pathname || "";
    if (/galeria\.html$/i.test(path)) return "Carregando galeria";
    if (/arquivo\.html$/i.test(path)) return "Carregando arquivo";
    if (/catalogo-servicos\.html$/i.test(path)) return "Carregando serviços";
    if (/noticia\.html$/i.test(path)) return "Carregando matéria";
    if (/cheffe-call\.html$/i.test(path)) return "Carregando Cheffe Call";
    return "Carregando página";
  };

  const createLoader = (label) => {
    injectStyle();
    const loader = document.createElement("div");
    loader.className = "catalogo-top-return-loader is-navigation-action-loader";
    loader.setAttribute("role", "status");
    loader.setAttribute("aria-live", "polite");
    loader.setAttribute("aria-label", label);
    loader.innerHTML = `
      <span class="catalogo-top-return-loader-track" aria-hidden="true"><i data-navigation-loader-bar style="width: 12%"></i></span>
      <span class="catalogo-top-return-loader-row">
        <span class="catalogo-top-return-loader-text" data-navigation-loader-status>${label}</span>
        <strong data-navigation-loader-percent>12%</strong>
      </span>
    `;
    return loader;
  };

  const updateLoader = (progress, label) => {
    if (!activeLoader) {
      return;
    }

    const safeProgress = Math.max(12, Math.min(100, Math.round(progress)));
    const bar = activeLoader.querySelector("[data-navigation-loader-bar]");
    const percent = activeLoader.querySelector("[data-navigation-loader-percent]");
    const status = activeLoader.querySelector("[data-navigation-loader-status]");
    if (bar) bar.style.width = `${safeProgress}%`;
    if (percent) percent.textContent = `${safeProgress}%`;
    if (status && label) status.textContent = label;
  };

  const showLoader = (label) => {
    if (activeLoader) {
      updateLoader(70, label);
      return activeLoader;
    }

    activeLoader = createLoader(label);
    activeStartedAt = Date.now();
    document.body.appendChild(activeLoader);
    window.requestAnimationFrame(() => {
      activeLoader?.classList.add("is-visible");
      updateLoader(18, label);
    });
    return activeLoader;
  };

  const preloadTarget = (target) =>
    Promise.race([
      fetch(target.href, { cache: "force-cache", credentials: "same-origin" })
        .then(() => undefined)
        .catch(() => undefined),
      new Promise((resolve) => window.setTimeout(resolve, maximumMs))
    ]);

  const finishThenNavigate = (target, label) => {
    const elapsed = Date.now() - activeStartedAt;
    const remaining = Math.max(0, minimumMs - elapsed);
    updateLoader(92, "Conteúdo carregado");
    window.setTimeout(() => {
      updateLoader(100, "Abrindo agora");
      window.location.href = target.href;
    }, remaining || (label ? 40 : 0));
  };

  const shouldHandle = (event, anchor) => {
    if (!anchor || event.defaultPrevented || event.button !== 0) {
      return false;
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return false;
    }

    const targetAttr = String(anchor.getAttribute("target") || "").trim();
    return !targetAttr || targetAttr === "_self";
  };

  document.addEventListener(
    "click",
    (event) => {
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!shouldHandle(event, anchor)) {
        return;
      }

      const target = normalizeTargetUrl(anchor.getAttribute("href") || "");
      if (!target) {
        return;
      }

      if (target.href.replace(/#.*/, "") === window.location.href.replace(/#.*/, "")) {
        return;
      }

      event.preventDefault();
      setPendingLoader();
      if (/\/index\.html$/i.test(target.pathname) || target.pathname === "/") {
        setSkipHomeIntro();
      }

      const label = labelForUrl(target);
      showLoader(label);
      Promise.all([preloadTarget(target), new Promise((resolve) => window.setTimeout(resolve, minimumMs))])
        .catch(() => undefined)
        .then(() => finishThenNavigate(target, label));
      window.setTimeout(() => {
        window.location.href = target.href;
      }, 1400);
    },
    { capture: true }
  );

  document.addEventListener("pointerenter", (event) => {
    const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
    const target = normalizeTargetUrl(anchor?.getAttribute("href") || "");
    if (!target) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "document";
    link.href = target.href;
    document.head.appendChild(link);
  }, true);

  window.CatalogoSharedNavigationLoader = {
    ready: true,
    show: showLoader
  };
})();
