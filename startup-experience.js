"use strict";

(function () {
  const CONSENT_KEY = "catalogo_lgpd_consent_v1";
  const BRAND_SPLASH_MS = 1600;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
      return;
    }
    fn();
  }

  function setConsent(value) {
    try {
      localStorage.setItem(CONSENT_KEY, value ? "accepted" : "rejected");
    } catch {
      // ignore
    }
  }

  function dispatchConsent(value) {
    window.dispatchEvent(
      new CustomEvent("catalogo:consent", {
        detail: { accepted: Boolean(value) }
      })
    );
  }

  function createIntroOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "catalogo-intro";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <div class="catalogo-book-wrap">
        <div class="catalogo-book-title">Abrindo Catálogo</div>
        <div class="catalogo-book">
          <div class="catalogo-page left">
            <div class="catalogo-page-text">
              <strong>Catálogo Cruzeiro do Sul</strong>
              <span>Informação local, serviços e utilidade pública.</span>
            </div>
          </div>
          <div class="catalogo-page right">
            <div class="catalogo-page-text">
              <strong>Radar em tempo real</strong>
              <span>Notícias, agenda, clima, eleições e comunidade.</span>
            </div>
          </div>
          <div class="catalogo-page right flip-1">
            <div class="catalogo-page-text">
              <strong>Leitura rápida</strong>
              <span>Resumo, contexto e link para fonte original.</span>
            </div>
          </div>
          <div class="catalogo-page right flip-2">
            <div class="catalogo-page-text">
              <strong>Serviços por módulo</strong>
              <span>Telefones úteis, restaurantes, saúde e transporte.</span>
            </div>
          </div>
          <div class="catalogo-page right flip-3">
            <div class="catalogo-page-text">
              <strong>Projeto em construção</strong>
              <span>Feito com foco na comunidade e melhoria contínua.</span>
            </div>
          </div>
        </div>
      </div>
    `;
    return overlay;
  }

  function createWelcomeModal() {
    const modal = document.createElement("section");
    modal.className = "catalogo-welcome";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Boas-vindas ao Catálogo");
    modal.innerHTML = `
      <article class="catalogo-welcome-card">
        <header class="catalogo-welcome-head">
          <h2>Bem-vindo ao maior catálogo de informações de Cruzeiro do Sul e região</h2>
        </header>
        <div class="catalogo-welcome-body">
          <p>
            Aqui você tem informações de todos os lugares e tipos: notícias locais, nacionais,
            mídias, pesquisas e tudo que você imaginar para acompanhar a região com mais clareza.
          </p>
          <p>
            Além de informação, em breve teremos novos serviços para comunidade e negócios locais.
          </p>
          <p class="catalogo-welcome-note">
            Obs: site em construção. De forma discreta, coletamos dados para estudos, melhoria
            de experiência e relatórios administrativos, conforme nossa política.
          </p>
          <label class="catalogo-terms-check">
            <input type="checkbox" id="catalogoAcceptTerms">
            <span>Li e aceito os termos de serviço e política de dados.</span>
          </label>
          <div class="catalogo-welcome-actions">
            <button class="catalogo-btn primary" data-catalogo-action="accept-enter">
              Aceito os termos e entrar
            </button>
            <button class="catalogo-btn warn" data-catalogo-action="exit-site">
              Não aceito
            </button>
            <a class="catalogo-btn ghost" href="legal.html" target="_blank" rel="noopener noreferrer">
              Ver política de dados
            </a>
          </div>
        </div>
      </article>
    `;
    return modal;
  }

  function createBrandSplash() {
    const splash = document.createElement("section");
    splash.className = "catalogo-brand-splash";
    splash.setAttribute("aria-hidden", "true");
    splash.innerHTML = `
      <article class="catalogo-brand-card">
        <div class="catalogo-brand-logo-wrap">
          <img id="catalogoBrandLogo" alt="Logo Catálogo Cruzeiro do Sul" hidden />
          <div class="catalogo-brand-fallback" id="catalogoBrandFallback">CZS</div>
        </div>
        <h2 class="catalogo-brand-name">Catálogo Cruzeiro do Sul</h2>
        <p class="catalogo-brand-sub">Informação local com identidade da região</p>
      </article>
    `;
    return splash;
  }

  function tryResolveLogoUrl() {
    const selectors = [
      "img[alt*='catalogo' i]",
      "img[alt*='atlas' i]",
      ".brand img",
      ".logo img",
      "header img",
      ".site-header img"
    ];

    for (const selector of selectors) {
      const node = document.querySelector(selector);
      if (!node) continue;
      const src = String(node.getAttribute("src") || "").trim();
      if (!src) continue;
      return src;
    }
    return "";
  }

  function setupBrandLogo(splash) {
    const img = splash.querySelector("#catalogoBrandLogo");
    const fallback = splash.querySelector("#catalogoBrandFallback");
    if (!img || !fallback) return;

    const src = tryResolveLogoUrl();
    if (!src) return;
    img.src = src;
    img.hidden = false;
    fallback.hidden = true;
  }

  function runBrandSplash(splash, onEnd) {
    splash.classList.remove("is-fade");
    splash.classList.add("is-open");
    setTimeout(() => {
      splash.classList.add("is-fade");
      splash.classList.remove("is-open");
      setTimeout(() => {
        onEnd?.();
      }, 430);
    }, BRAND_SPLASH_MS);
  }

  function openWelcomeModal(modal) {
    modal.classList.add("is-open");
    document.body.classList.add("catalogo-lock-scroll");
  }

  function closeWelcomeModal(modal) {
    modal.classList.remove("is-open");
    document.body.classList.remove("catalogo-lock-scroll");
  }

  ready(() => {
    const overlay = createIntroOverlay();
    const modal = createWelcomeModal();
    const brandSplash = createBrandSplash();
    setupBrandLogo(brandSplash);
    document.body.append(overlay, brandSplash, modal);

    const closeAndContinue = () => {
      const checkbox = modal.querySelector("#catalogoAcceptTerms");
      if (!checkbox || !checkbox.checked) {
        window.alert("Para continuar, marque que aceita os termos.");
        return;
      }
      setConsent(true);
      dispatchConsent(true);
      closeWelcomeModal(modal);
    };

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        return;
      }
      const action = event.target?.getAttribute?.("data-catalogo-action");
      if (action === "accept-enter") {
        closeAndContinue();
      } else if (action === "exit-site") {
        window.location.href = "https://www.google.com";
      }
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) {
        closeWelcomeModal(modal);
      }
    });

    document.body.classList.add("catalogo-lock-scroll");

    setTimeout(() => {
      overlay.classList.add("is-hidden");
      runBrandSplash(brandSplash, () => {
        openWelcomeModal(modal);
        window.dispatchEvent(new CustomEvent("catalogo:intro-finished"));
      });
    }, 2400);

    // Fallback de segurança: garante abertura do popup mesmo que uma animação falhe
    setTimeout(() => {
      if (!modal.classList.contains("is-open")) {
        openWelcomeModal(modal);
      }
    }, 6200);
  });
})();
