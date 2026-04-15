(() => {
  if (window.__catalogoStartupV2Mounted) return;
  window.__catalogoStartupV2Mounted = true;

  const TERMS_KEY = "catalogo_terms_accepted_v2";
  const INTRO_ID = "catalogoIntroOverlay";
  const POPUP_ID = "catalogoWelcomePopup";

  const TIMING = {
    book: 5200,
    brand: 1600,
    office: 0,
    fade: 650,
  };

  function lockPage(lock) {
    document.documentElement.classList.toggle("catalogo-intro-lock", lock);
    document.body.classList.toggle("catalogo-intro-lock", lock);
  }

  function getLogoSrc() {
    const logo = document.querySelector(
      "img[alt*='catalogo' i], img[alt*='atlas' i], img[src*='logo' i], .brand img"
    );
    return logo ? logo.src : "";
  }

  function buildIntroOverlay() {
    document.querySelectorAll(".catalogo-intro-overlay").forEach((node) => node.remove());
    const old = document.getElementById(INTRO_ID);
    if (old) old.remove();

    const overlay = document.createElement("div");
    overlay.id = INTRO_ID;
    overlay.className = "catalogo-intro-overlay";
    overlay.innerHTML = `
      <section class="intro-scene intro-scene--book is-active" data-scene="book">
        <div class="intro-book-wrap">
          <div class="intro-notebook">
            <div class="intro-notebook-cover">
              <span class="intro-cover-label">Catálogo Cruzeiro do Sul</span>
              <strong class="intro-cover-title">Caderno do dia</strong>
              <p>Resumo local com foco no que muda a rotina.</p>
            </div>
            <div class="intro-spiral"></div>
            <div class="intro-notebook-pages">
              <div class="intro-notebook-page page-1"></div>
              <div class="intro-notebook-page page-2"></div>
              <div class="intro-notebook-page page-3"></div>
              <div class="intro-notebook-page page-4"></div>
            </div>
          </div>
          <p class="intro-caption">Virando as páginas do catálogo...</p>
        </div>
      </section>

      <section class="intro-scene intro-scene--brand" data-scene="brand">
        <div class="intro-brand-wrap">
          <div class="intro-brand-logo">${
            getLogoSrc()
              ? `<img src="${getLogoSrc()}" alt="Logo Catálogo Cruzeiro do Sul">`
              : `<div class="intro-brand-emblem">CZS</div>`
          }</div>
          <h2>CATÁLOGO CRUZEIRO DO SUL</h2>
          <p>Notícia local com visão regional</p>
        </div>
      </section>

      <section class="intro-scene intro-scene--office" data-scene="office"></section>
    `;

    document.body.appendChild(overlay);
    return overlay;
  }

  function setScene(overlay, sceneName) {
    overlay.querySelectorAll(".intro-scene").forEach((scene) => {
      scene.classList.toggle("is-active", scene.dataset.scene === sceneName);
    });
  }

  function buildPopup() {
    if (document.getElementById(POPUP_ID)) return;

    const popup = document.createElement("aside");
    popup.id = POPUP_ID;
    popup.className = "catalogo-welcome-popup";
    popup.innerHTML = `
      <div class="catalogo-welcome-dialog" role="dialog" aria-modal="true" aria-labelledby="welcomeTitle">
        <h3 id="welcomeTitle">Bem-vindo ao Catálogo Cruzeiro do Sul</h3>
        <p>
          Aqui você encontra notícias e serviços da cidade e região.
          O portal segue em evolução contínua.
        </p>
        <p class="catalogo-welcome-note">
          Coletamos dados de navegação para estudos de melhoria da plataforma.
        </p>
        <label class="catalogo-terms-check">
          <input type="checkbox" id="catalogoTermsCheck">
          <span>Li e aceito os termos de serviço e política de dados.</span>
        </label>
        <button id="catalogoAcceptTerms" disabled>Aceito os termos e entrar</button>
      </div>
    `;

    document.body.appendChild(popup);

    const check = popup.querySelector("#catalogoTermsCheck");
    const button = popup.querySelector("#catalogoAcceptTerms");

    if (localStorage.getItem(TERMS_KEY) === "1") {
      check.checked = true;
      button.disabled = false;
    }

    check.addEventListener("change", () => {
      button.disabled = !check.checked;
    });

    button.addEventListener("click", () => {
      localStorage.setItem(TERMS_KEY, "1");
      popup.classList.add("is-leaving");
      setTimeout(() => popup.remove(), 280);
    });
  }

  function runIntroSequence() {
    const overlay = buildIntroOverlay();
    lockPage(true);

    setScene(overlay, "book");

    const t1 = TIMING.book;
    const t2 = t1 + TIMING.brand;

    setTimeout(() => setScene(overlay, "brand"), t1);
    setTimeout(() => overlay.classList.add("is-leaving"), t2);
    setTimeout(() => {
      overlay.remove();
      lockPage(false);
      buildPopup();
    }, t2 + TIMING.fade);
  }

  function boot() {
    runIntroSequence();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
