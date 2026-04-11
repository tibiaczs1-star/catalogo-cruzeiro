(() => {
  if (window.__catalogoStartupV2Mounted) return;
  window.__catalogoStartupV2Mounted = true;

  const TERMS_KEY = "catalogo_terms_accepted_v2";
  const INTRO_ID = "catalogoIntroOverlay";
  const POPUP_ID = "catalogoWelcomePopup";

  const TIMING = {
    book: 9000,
    brand: 2200,
    office: 2600,
    fade: 700,
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
    const old = document.getElementById(INTRO_ID);
    if (old) old.remove();

    const overlay = document.createElement("div");
    overlay.id = INTRO_ID;
    overlay.className = "catalogo-intro-overlay";
    overlay.innerHTML = `
      <section class="intro-scene intro-scene--book is-active" data-scene="book">
        <div class="intro-book-wrap">
          <div class="intro-book">
            <div class="intro-page intro-page--left">
              <h3>Catálogo Cruzeiro do Sul</h3>
              <p>Informação local, utilidade pública e notícias da região.</p>
              <p>Abertura da edição em tempo real.</p>
            </div>
            <div class="intro-page intro-page--right">
              <h3>Radar da cidade</h3>
              <p>Atualizações contínuas com foco no que impacta o dia a dia.</p>
              <p>Leitura simples, direta e útil.</p>
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

      <section class="intro-scene intro-scene--office" data-scene="office">
        <div class="intro-office">
          <div class="intro-desk intro-desk--a"></div>
          <div class="intro-desk intro-desk--b"></div>
          <div class="intro-desk intro-desk--c"></div>
          <div class="intro-desk intro-desk--d"></div>
          <div class="intro-agent intro-agent--one"></div>
          <div class="intro-agent intro-agent--two"></div>
          <div class="intro-agent intro-agent--three"></div>
          <div class="intro-agent intro-agent--four"></div>
          <div class="intro-office-bubble">Lá vem notícia...</div>
        </div>
        <p class="intro-caption">Equipe monitorando o radar</p>
      </section>
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
    const t3 = t2 + TIMING.office;

    setTimeout(() => setScene(overlay, "brand"), t1);
    setTimeout(() => setScene(overlay, "office"), t2);
    setTimeout(() => overlay.classList.add("is-leaving"), t3);
    setTimeout(() => {
      overlay.remove();
      lockPage(false);
      buildPopup();
    }, t3 + TIMING.fade);
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

