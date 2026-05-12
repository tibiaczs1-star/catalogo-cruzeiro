"use strict";

(() => {
  const MODAL_ID = "catalogoPremiumTerms";
  const CONSENT_BANNER_ID = "catalogo-cookie-consent";
  const READY_FALLBACK_MS = 6200;
  const OPEN_DELAY_MS = 140;
  const CONSENT_KEY = "catalogo_lgpd_consent_v1";
  const CONSENT_COOKIE = "catalogo_tracking_consent";
  const COOKIE_MAX_AGE_DAYS = 3650;
  const SESSION_ACCEPT_KEY = "catalogo_terms_session_accept_v1";
  const WELCOME_SESSION_COOKIE = "catalogo_terms_welcome_session_v1";
  const WELCOME_WEEKLY_KEY = "catalogo_terms_welcome_seen_week_v1";
  const WELCOME_WEEKLY_COOKIE = "catalogo_terms_welcome_seen_week_v1";
  const FOUNDER_PRELUDE_SESSION_KEY = "catalogo_founder_prelude_seen_session_v1";
  const FOUNDER_PRELUDE_WEEKLY_KEY = "catalogo_founder_prelude_seen_week_v1";
  const FOUNDER_PRELUDE_WEEKLY_COOKIE = "catalogo_founder_prelude_seen_week_v1";
  const INITIAL_HOME_LOADER_SESSION_KEY = "catalogo_initial_home_loader_seen_session_v2";
  const INITIAL_HOME_LOADER_DAILY_KEY = "catalogo_initial_home_loader_seen_day_v2";
  const PAGE_ACTION_LOADER_KEY = "catalogo_page_action_loader_pending_v1";
  const WEEKLY_MARKER_MAX_AGE_DAYS = 8;
  const INITIAL_HOME_LOADER_MIN_MS = 4200;
  const ACTION_LOADER_MIN_MS = 4200;
  const ACTION_LOADER_MAX_MS = 5400;
  const THANKS_SCREEN_MS = 2600;
  const THANKS_SCREEN_MS_COMPACT = 2200;
  const THANKS_SCREEN_MS_PHONE = 1800;
  const FOUNDER_PRELUDE_MS = 3000;
  const FOUNDER_PRELUDE_MS_COMPACT = 3000;
  const FOUNDER_PRELUDE_MS_PHONE = 3000;
  const RETURNING_LOADER_MS = 4200;
  const FOUNDERS_CAFE_IMAGE_SRC = "./assets/founders-cafe-pack-static.jpg";
  const FOUNDERS_GRUPO_AS_LOGO_SRC = "./assets/founders-grupo-as-logo.jpeg";
  const FOUNDERS_GEANE_LOGO_SRC = "./assets/founders-geane-logo-optimized.png";
  const FOUNDERS_RECOMMENCER_LOGO_SRC = "./assets/founders-recommencer-logo.svg";
  const FOUNDER_BANNER_ASSETS = [
    FOUNDERS_CAFE_IMAGE_SRC,
    FOUNDERS_GRUPO_AS_LOGO_SRC,
    FOUNDERS_GEANE_LOGO_SRC,
    FOUNDERS_RECOMMENCER_LOGO_SRC
  ];
  const FOUNDERS_OPENING_STEPS = [
    "marcas apoiadoras em destaque",
    "visual do portal em camadas",
    "abertura mais leve e dinâmica",
    "experiência principal pronta"
  ];
  const LEGACY_WELCOME_ACCEPT_KEYS = [
    "catalogo_terms_welcome_accepted_v1",
    "catalogo_terms_welcome_accepted_v2"
  ];

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }

    callback();
  }

  function clearStoredConsent() {
    try {
      localStorage.removeItem("catalogo_lgpd_consent_v3");
    } catch (_error) {
      // ignore storage failures
    }
  }

  function clearLocalItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (_error) {
      // ignore storage failures
    }
  }

  function setCookie(name, value, options = {}) {
    let cookie = `${name}=${encodeURIComponent(value)}; path=${options.path || "/"}; SameSite=${options.sameSite || "Lax"}`;

    if (typeof options.days === "number") {
      const expiresAt = new Date(Date.now() + options.days * 24 * 60 * 60 * 1000);
      cookie += `; Expires=${expiresAt.toUTCString()}`;
    }

    if (options.secure || location.protocol === "https:") {
      cookie += "; Secure";
    }

    document.cookie = cookie;
  }

  function getCookie(name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : "";
  }

  function clearCookie(name) {
    document.cookie = `${name}=; path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  }

  function persistConsentState(state) {
    if (state !== "accepted" && state !== "rejected") {
      return;
    }

    try {
      localStorage.setItem(CONSENT_KEY, state);
    } catch (_error) {
      // ignore storage failures
    }

    setCookie(CONSENT_COOKIE, state, { days: COOKIE_MAX_AGE_DAYS });
  }

  function rememberWelcomeAcceptedThisBrowserSession() {
    setCookie(WELCOME_SESSION_COOKIE, "1");
  }

  function getWeekKey() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 4 - (date.getDay() || 7));
    const yearStart = new Date(date.getFullYear(), 0, 1);
    const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
    return `${date.getFullYear()}-W${String(week).padStart(2, "0")}`;
  }

  function getDayKey() {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "America/Rio_Branco",
        year: "numeric"
      }).format(new Date());
    } catch (_error) {
      return new Date().toISOString().slice(0, 10);
    }
  }

  function rememberWelcomeAcceptedThisWeek() {
    const weekKey = getWeekKey();

    try {
      localStorage.setItem(WELCOME_WEEKLY_KEY, weekKey);
    } catch (_error) {
      // ignore storage failures
    }

    setCookie(WELCOME_WEEKLY_COOKIE, weekKey, { days: WEEKLY_MARKER_MAX_AGE_DAYS });
  }

  function hasAcceptedWelcomeThisWeek() {
    const weekKey = getWeekKey();

    try {
      if (localStorage.getItem(WELCOME_WEEKLY_KEY) === weekKey) {
        return true;
      }
    } catch (_error) {
      // ignore storage failures
    }

    return getCookie(WELCOME_WEEKLY_COOKIE) === weekKey;
  }

  function hasAcceptedWelcomeInThisBrowserSession() {
    return getCookie(WELCOME_SESSION_COOKIE) === "1";
  }

  function resetConsentForNewBrowserSession() {
    if (hasStoredConsent() || hasAcceptedWelcomeThisWeek()) {
      return;
    }

    clearStoredConsent();
    clearLocalItem(CONSENT_KEY);
    clearCookie(CONSENT_COOKIE);

    for (const key of LEGACY_WELCOME_ACCEPT_KEYS) {
      clearLocalItem(key);
    }
  }

  function removeLegacyConsentBanner() {
    document.getElementById(CONSENT_BANNER_ID)?.remove();
  }

  function preloadImage(src) {
    return new Promise((resolve) => {
      if (!src) {
        resolve(false);
        return;
      }

      const image = new Image();
      image.decoding = "async";
      image.loading = "eager";
      image.onload = () => {
        if (typeof image.decode === "function") {
          image.decode().then(() => resolve(true)).catch(() => resolve(true));
          return;
        }
        resolve(true);
      };
      image.onerror = () => resolve(false);
      image.src = src;
    });
  }

  let founderAssetsPromise = null;

  function preloadFounderBannerAssets() {
    if (founderAssetsPromise) {
      return founderAssetsPromise;
    }

    founderAssetsPromise = Promise.all(FOUNDER_BANNER_ASSETS.map((src) => preloadImage(src)));
    return founderAssetsPromise;
  }

  function releaseIntroLocks() {
    document.body.classList.remove("home-ready-gate-active", "founder-prelude-active");

    if (!document.querySelector(".catalogo-welcome.is-open:not(.is-leaving), .catalogo-founder-prelude.is-open")) {
      document.body.classList.remove("catalogo-lock-scroll");
    }
  }

  function dispatchIntroFinished() {
    releaseIntroLocks();
    document.querySelectorAll(".catalogo-welcome.is-home-opening-loader").forEach((node) => {
      node.remove();
    });
    window.dispatchEvent(new CustomEvent("catalogo:intro-finished"));
  }

  function dispatchConsent(value) {
    window.dispatchEvent(
      new CustomEvent("catalogo:consent", {
        detail: {
          accepted: Boolean(value),
          state: value ? "accepted" : "rejected",
          source: "welcome-modal"
        }
      })
    );
  }

  function rememberWelcomeAcceptedThisSession() {
    try {
      sessionStorage.setItem(SESSION_ACCEPT_KEY, "1");
    } catch (_error) {
      // ignore storage failures
    }
  }

  function rememberFounderPreludeInThisSession() {
    try {
      sessionStorage.setItem(FOUNDER_PRELUDE_SESSION_KEY, "1");
    } catch (_error) {
      // ignore storage failures
    }
  }

  function rememberFounderPreludeThisWeek() {
    const weekKey = getWeekKey();

    try {
      localStorage.setItem(FOUNDER_PRELUDE_WEEKLY_KEY, weekKey);
    } catch (_error) {
      // ignore storage failures
    }

    setCookie(FOUNDER_PRELUDE_WEEKLY_COOKIE, weekKey, { days: WEEKLY_MARKER_MAX_AGE_DAYS });
  }

  function hasSeenFounderPreludeThisWeek() {
    const weekKey = getWeekKey();

    try {
      if (localStorage.getItem(FOUNDER_PRELUDE_WEEKLY_KEY) === weekKey) {
        return true;
      }
    } catch (_error) {
      // ignore storage failures
    }

    return getCookie(FOUNDER_PRELUDE_WEEKLY_COOKIE) === weekKey;
  }

  function hasSeenFounderPreludeInThisSession() {
    try {
      return sessionStorage.getItem(FOUNDER_PRELUDE_SESSION_KEY) === "1";
    } catch (_error) {
      return false;
    }
  }

  function rememberInitialHomeLoaderInThisSession() {
    const dayKey = getDayKey();

    try {
      sessionStorage.setItem(INITIAL_HOME_LOADER_SESSION_KEY, dayKey);
    } catch (_error) {
      // ignore storage failures
    }

    try {
      localStorage.setItem(INITIAL_HOME_LOADER_DAILY_KEY, dayKey);
    } catch (_error) {
      // ignore storage failures
    }
  }

  function hasSeenInitialHomeLoaderToday() {
    const dayKey = getDayKey();

    try {
      if (localStorage.getItem(INITIAL_HOME_LOADER_DAILY_KEY) === dayKey) {
        return true;
      }
    } catch (_error) {
      // ignore storage failures
    }

    try {
      return sessionStorage.getItem(INITIAL_HOME_LOADER_SESSION_KEY) === dayKey;
    } catch (_error) {
      return false;
    }
  }

  function isBackForwardNavigation() {
    try {
      const navigationEntry = performance.getEntriesByType("navigation")?.[0];
      return navigationEntry?.type === "back_forward";
    } catch (_error) {
      return false;
    }
  }

  function consumePageActionLoaderFlag() {
    try {
      const hasFlag = sessionStorage.getItem(PAGE_ACTION_LOADER_KEY) === "1";
      sessionStorage.removeItem(PAGE_ACTION_LOADER_KEY);
      return hasFlag;
    } catch (_error) {
      return false;
    }
  }

  function cameFromArticlePage() {
    try {
      return /\/noticia\.html(?:\?|$)/i.test(new URL(document.referrer).pathname + new URL(document.referrer).search);
    } catch (_error) {
      return false;
    }
  }

  function shouldSkipWelcomeModal() {
    if (window.__CATALOGO_SKIP_HOME_WELCOME__ === true) {
      return true;
    }

    if (window.location.protocol === "file:") {
      return true;
    }

    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("skipWelcome") === "1" || params.get("skipIntro") === "1") {
        return true;
      }
    } catch (_error) {
      // ignore URL parsing failures
    }

    if (hasStoredConsent() || hasAcceptedWelcomeThisWeek()) {
      return true;
    }

    try {
      if (sessionStorage.getItem(SESSION_ACCEPT_KEY) === "1" && (hasStoredConsent() || hasAcceptedWelcomeThisWeek())) {
        return true;
      }
    } catch (_error) {
      // ignore storage failures
    }

    return false;
  }

  function isSkipIntroNavigation() {
    try {
      const params = new URLSearchParams(window.location.search);
      const rawValue = String(params.get("skipIntro") || "").trim().toLowerCase();
      return rawValue === "1" || rawValue === "true" || rawValue === "yes";
    } catch (_error) {
      return false;
    }
  }

  function connectionPrefersLite() {
    const connection =
      navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;

    if (!connection) {
      return false;
    }

    return Boolean(connection.saveData) || /(?:^|slow-)?2g$/i.test(String(connection.effectiveType || ""));
  }

  function shouldUseCompactWelcome() {
    return (
      window.matchMedia("(max-width: 920px)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      connectionPrefersLite()
    );
  }

  function releaseFounderPreludeGate() {
    document.body.classList.remove("founder-prelude-pending", "founder-prelude-active");
  }

  function shouldUsePhoneWelcome() {
    const narrowViewport = window.matchMedia("(max-width: 760px)").matches;
    const liteViewport = window.matchMedia("(max-width: 720px)").matches && connectionPrefersLite();
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const noHover = window.matchMedia("(hover: none)").matches;
    const mobileUserAgent =
      /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(navigator.userAgent || "");

    return (narrowViewport || liteViewport) && (coarsePointer || noHover || mobileUserAgent);
  }

  function hasStoredConsent() {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored === "accepted" || stored === "rejected") {
        return true;
      }
    } catch (_error) {
      // ignore storage failures
    }

    const cookieConsent = getCookie(CONSENT_COOKIE);
    return cookieConsent === "accepted" || cookieConsent === "rejected";
  }

  function createMobileConsentBanner() {
    const banner = document.createElement("aside");
    banner.id = CONSENT_BANNER_ID;
    banner.className = "cookie-consent-banner cookie-consent-banner-mobile is-passive";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-live", "polite");
    banner.setAttribute("aria-label", "Consentimento de cookies");
    banner.innerHTML = `
      <span class="cookie-consent-handle" aria-hidden="true"></span>
      <p class="cookie-consent-kicker">Privacidade</p>
      <h3>Cookies e LGPD</h3>
      <p>
        Usamos cookies essenciais e métricas básicas para manter a leitura rápida,
        lembrar preferências e melhorar o portal.
      </p>
      <span class="cookie-consent-inline-note">
        <span class="cookie-consent-inline-dot" aria-hidden="true"></span>
        O site continua liberado enquanto você decide.
      </span>
      <div class="cookie-consent-actions">
        <button class="cookie-consent-accept" type="button">Aceitar</button>
        <a class="cookie-consent-policy" href="./legal.html">Ver política</a>
      </div>
    `;
    return banner;
  }

  function showMobileConsentBanner(callback) {
    removeLegacyConsentBanner();
    if (hasStoredConsent()) {
      releaseFounderPreludeGate();
      if (typeof callback === "function") callback();
      else dispatchIntroFinished();
      return;
    }

    const banner = createMobileConsentBanner();
    document.body.appendChild(banner);
    document.body.classList.add("cookie-consent-visible");
    document.body.classList.remove("catalogo-lock-scroll", "mobile-cookie-consent-active");
    releaseFounderPreludeGate();

    window.requestAnimationFrame(() => {
      banner.classList.add("is-visible");
    });

    if (typeof callback === "function") {
      callback();
    } else {
      dispatchIntroFinished();
    }

    banner.querySelector(".cookie-consent-accept")?.addEventListener("click", () => {
      persistConsentState("accepted");
      rememberWelcomeAcceptedThisSession();
      rememberWelcomeAcceptedThisBrowserSession();
      rememberWelcomeAcceptedThisWeek();
      dispatchConsent(true);
      banner.classList.add("is-leaving");
      banner.remove();
      document.body.classList.remove("cookie-consent-visible");
    });
  }

  function buildWelcomeCopyMarkup(options = {}) {
    const phone = options.phone === true;
    if (phone) {
      return `
        <p class="catalogo-welcome-kicker">No celular</p>
        <h2 id="catalogoWelcomeTitle">Leitura rápida do Juruá</h2>
        <p class="catalogo-welcome-lead">
          O portal abre leve, com manchetes grandes, cookie simples e fotos em tela
          cheia para você escolher o que ler.
        </p>

        <div class="catalogo-welcome-actions">
          <button class="catalogo-btn primary" id="catalogoAcceptButton" type="button">
            Abrir portal
          </button>
        </div>
      `;
    }

    return `
      <p class="catalogo-welcome-kicker">Antes de continuar</p>
      <h2 id="catalogoWelcomeTitle">Cookies no portal</h2>
      <p class="catalogo-welcome-lead">
        Cookies ajudam a manter a leitura rápida, lembrar preferências básicas e melhorar a experiência no Catálogo Cruzeiro do Sul.
      </p>

      <div class="catalogo-consent-intro">
        <strong>Uso simples e transparente</strong>
        <p>
          Ao continuar, você concorda com cookies essenciais e métricas básicas de navegação.
        </p>
      </div>

      <div class="catalogo-welcome-actions">
        <button class="catalogo-btn primary" id="catalogoAcceptButton" type="button">
          Aceitar
        </button>
        <a class="catalogo-btn ghost" href="./legal.html" target="_blank" rel="noopener noreferrer">
          Ver política
        </a>
      </div>
    `;
  }

  function buildDirectorMarkup() {
    return `
      <div class="catalogo-director-stage" aria-hidden="true">
        <div class="catalogo-pixel-director">
          <i class="catalogo-director-shadow"></i>
          <i class="catalogo-director-hair"></i>
          <i class="catalogo-director-head"></i>
          <i class="catalogo-director-glasses"></i>
          <i class="catalogo-director-body"></i>
          <i class="catalogo-director-arm arm-left">
            <span class="catalogo-director-hand left-hand"></span>
          </i>
          <i class="catalogo-director-arm arm-right">
            <span class="catalogo-director-hand right-hand"></span>
            <span class="catalogo-director-laser-burst">
              <span class="catalogo-pointer-beam"></span>
            </span>
          </i>
          <i class="catalogo-director-leg leg-left"></i>
          <i class="catalogo-director-leg leg-right"></i>
        </div>
      </div>
    `;
  }

  function buildFounderThanksMarkup() {
    return `
      <div class="catalogo-founder-thanks" aria-hidden="true">
        <div class="catalogo-founder-thanks-overlay"></div>
        <div class="catalogo-founder-thanks-atmosphere">
          <span class="catalogo-founder-orb orb-a"></span>
          <span class="catalogo-founder-orb orb-b"></span>
          <span class="catalogo-founder-orb orb-c"></span>
          <span class="catalogo-founder-spotlight spot-a"></span>
          <span class="catalogo-founder-spotlight spot-b"></span>
          <span class="catalogo-founder-spotlight spot-c"></span>
          <span class="catalogo-founder-beam beam-a"></span>
          <span class="catalogo-founder-beam beam-b"></span>
          <span class="catalogo-founder-spark spark-a"></span>
          <span class="catalogo-founder-spark spark-b"></span>
          <span class="catalogo-founder-spark spark-c"></span>
          <span class="catalogo-founder-spark spark-d"></span>
          <span class="catalogo-founder-spark spark-e"></span>
          <span class="catalogo-founder-spark spark-f"></span>
        </div>

        <div class="catalogo-founder-thanks-layout">
          <div class="catalogo-founder-thanks-media catalogo-founder-reveal reveal-2">
            <div class="catalogo-founder-stage-label">
              <span>Apoio que impulsiona</span>
              <strong>Cafe Cruzeiro</strong>
            </div>
            <img
              class="catalogo-founder-thanks-image"
              src="${FOUNDERS_CAFE_IMAGE_SRC}"
              alt="Pacote do Cafe Cruzeiro em destaque na abertura do portal"
              decoding="async"
              loading="eager"
              fetchpriority="high"
            />
            <div class="catalogo-founder-stage-applause" aria-hidden="true">
              <span>aplausos</span>
              <i></i>
              <i></i>
              <i></i>
            </div>
          </div>

          <div class="catalogo-founder-thanks-copy">
            <p class="catalogo-founder-thanks-kicker catalogo-founder-reveal reveal-1">Apoiadores fundadores</p>
            <span class="catalogo-founder-thanks-seal catalogo-founder-reveal reveal-2">Tecnologia com apoio local</span>
            <div class="catalogo-founder-banner-rail catalogo-founder-reveal reveal-3">
              <article class="catalogo-founder-banner-card catalogo-founder-banner-card-cafe">
                <span>Apoio que impulsiona</span>
                <div class="catalogo-founder-thanks-logo-wrap catalogo-founder-thanks-copy-card">
                  <strong>Cafe Cruzeiro</strong>
                  <small>presença visual na abertura do portal</small>
                </div>
              </article>
              <article class="catalogo-founder-banner-card catalogo-founder-banner-card-grupoas">
                <span>Apoiador em destaque</span>
                <div class="catalogo-founder-thanks-logo-wrap">
                  <img
                    class="catalogo-founder-thanks-logo"
                    src="${FOUNDERS_GRUPO_AS_LOGO_SRC}"
                    alt="Logo do Grupo A.S"
                    loading="eager"
                    decoding="async"
                    fetchpriority="high"
                  />
                </div>
              </article>
              <article class="catalogo-founder-banner-card">
                <span>Fundadora em destaque</span>
                <div class="catalogo-founder-thanks-logo-wrap">
                  <img
                    class="catalogo-founder-thanks-logo"
                    src="${FOUNDERS_GEANE_LOGO_SRC}"
                    alt="Logo da Dra. Geane Campo"
                    loading="eager"
                    decoding="async"
                    fetchpriority="high"
                  />
                </div>
              </article>
              <article class="catalogo-founder-banner-card catalogo-founder-banner-card-dark">
                <span>Marca fundadora</span>
                <div class="catalogo-founder-thanks-logo-wrap">
                  <img
                    class="catalogo-founder-thanks-logo"
                    src="${FOUNDERS_RECOMMENCER_LOGO_SRC}"
                    alt="Logo da Recommencer"
                    loading="eager"
                    decoding="async"
                    fetchpriority="high"
                  />
                </div>
              </article>
            </div>
            <strong class="catalogo-founder-reveal reveal-4">Cafe Cruzeiro, Grupo A.S, Dra. Geane Campo e Recommencer ajudam a abrir uma experiência mais viva para o Juruá.</strong>
            <span class="catalogo-founder-reveal reveal-5">Apoio local, carregamento visual e tecnologia trabalhando para aproximar a cidade da informação.</span>
            <div class="catalogo-founder-opening catalogo-founder-reveal reveal-5" aria-live="polite">
              <div class="catalogo-founder-opening-head">
                <strong>Experiência do portal</strong>
                <span data-founder-opening-percent>0%</span>
              </div>
              <div class="catalogo-founder-opening-bar">
                <span data-founder-opening-bar></span>
              </div>
              <p data-founder-opening-text>${FOUNDERS_OPENING_STEPS[0]}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function startFounderOpening(modal) {
    const openingText = modal?.querySelector("[data-founder-opening-text]");
    const openingPercent = modal?.querySelector("[data-founder-opening-percent]");
    const openingBar = modal?.querySelector("[data-founder-opening-bar]");
    if (!openingText || !openingPercent || !openingBar) {
      return () => {};
    }

    const totalDuration = modal?.classList.contains("is-phone")
      ? THANKS_SCREEN_MS_PHONE
      : modal?.classList.contains("is-compact")
        ? THANKS_SCREEN_MS_COMPACT
        : THANKS_SCREEN_MS;

    const startedAt = Date.now();
    let stepIndex = 0;
    openingText.textContent = FOUNDERS_OPENING_STEPS[0];
    openingPercent.textContent = "0%";
    openingBar.style.width = "0%";

    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      openingPercent.textContent = `${progress}%`;
      openingBar.style.width = `${progress}%`;
    }, 120);

    const stepTimer = window.setInterval(() => {
      stepIndex = (stepIndex + 1) % FOUNDERS_OPENING_STEPS.length;
      openingText.textContent = FOUNDERS_OPENING_STEPS[stepIndex];
    }, 760);

    return () => {
      window.clearInterval(progressTimer);
      window.clearInterval(stepTimer);
      openingPercent.textContent = "100%";
      openingBar.style.width = "100%";
    };
  }

  function createFounderPrelude() {
    const prelude = document.createElement("section");
    prelude.className = "catalogo-founder-prelude";
    prelude.setAttribute("aria-hidden", "true");
    prelude.innerHTML = `
      <div class="catalogo-founder-prelude-stars">
        <span class="starfield starfield-a"></span>
        <span class="starfield starfield-b"></span>
        <span class="star a"></span>
        <span class="star b"></span>
        <span class="star c"></span>
        <span class="star d"></span>
        <span class="star e"></span>
        <span class="star f"></span>
        <span class="star g"></span>
        <span class="star h"></span>
        <span class="star i"></span>
        <span class="star j"></span>
        <span class="constellation constellation-a"></span>
        <span class="constellation constellation-b"></span>
        <span class="grid grid-a"></span>
        <span class="grid grid-b"></span>
        <span class="orbit orbit-a"></span>
        <span class="orbit orbit-b"></span>
        <span class="office-core"></span>
        <span class="data-column data-column-a"></span>
        <span class="data-column data-column-b"></span>
        <span class="ring ring-a"></span>
        <span class="ring ring-b"></span>
        <span class="beam beam-a"></span>
        <span class="beam beam-b"></span>
        <span class="nebula nebula-a"></span>
        <span class="nebula nebula-b"></span>
        <span class="cinema-light light-a"></span>
        <span class="cinema-light light-b"></span>
        <span class="cinema-light light-c"></span>
        <span class="cinema-flare flare-a"></span>
        <span class="cinema-flare flare-b"></span>
        <span class="cinema-curtain curtain-left"></span>
        <span class="cinema-curtain curtain-right"></span>
        <span class="premium-particle particle-a"></span>
        <span class="premium-particle particle-b"></span>
        <span class="premium-particle particle-c"></span>
        <span class="premium-particle particle-d"></span>
        <span class="founder-premium-floor"></span>
        <span class="founder-premium-halo halo-a"></span>
        <span class="founder-premium-halo halo-b"></span>
        <span class="founder-premium-orb orb-a"></span>
        <span class="founder-premium-orb orb-b"></span>
        <span class="founder-premium-orb orb-c"></span>
        <span class="founder-premium-ribbon ribbon-a"></span>
        <span class="founder-premium-ribbon ribbon-b"></span>
        <span class="founder-premium-ribbon ribbon-c"></span>
        <span class="founder-premium-diamond diamond-a"></span>
        <span class="founder-premium-diamond diamond-b"></span>
      </div>
      <div class="catalogo-founder-prelude-shell">
        <div class="catalogo-founder-prelude-hud hud-left" aria-hidden="true">
          <span>apoio que impulsiona</span>
          <strong>Tecnologia com marcas locais</strong>
          <small>apoio local, presença e continuidade</small>
          <em>abertura visual do portal</em>
        </div>
        <div class="catalogo-founder-prelude-hud hud-right" aria-hidden="true">
          <span>experiência imersiva</span>
          <strong>Interface em movimento</strong>
          <small>profundidade, volume e movimento</small>
          <em>marcas carregadas com prioridade</em>
        </div>
        <div class="catalogo-founder-prelude-side side-left" aria-hidden="true">
          <span>apoio local</span>
          <strong>Presenca viva</strong>
          <small>marcas que ajudam a manter o portal de pe</small>
        </div>
        <div class="catalogo-founder-prelude-side side-right" aria-hidden="true">
          <span>abertura do portal</span>
          <strong>Presença inteligente</strong>
          <small>o apoio local aparece com destaque antes da leitura</small>
        </div>
        <div class="catalogo-founder-prelude-copy">
          <span>apoiadores fundadores</span>
          <strong>Marcas locais ajudam a acender a tecnologia do portal</strong>
          <small>Cafe Cruzeiro, Grupo A.S, Dra. Geane Campo e Recommencer</small>
        </div>
        <div class="catalogo-founder-prelude-logos">
          <figure class="logo-card cafe"><img src="${FOUNDERS_CAFE_IMAGE_SRC}" alt="Cafe Cruzeiro" loading="eager" decoding="async" fetchpriority="high" /></figure>
          <figure class="logo-card grupo"><img src="${FOUNDERS_GRUPO_AS_LOGO_SRC}" alt="Grupo A.S" loading="eager" decoding="async" fetchpriority="high" /></figure>
          <figure class="logo-card geane"><img src="${FOUNDERS_GEANE_LOGO_SRC}" alt="Dra. Geane Campo" loading="eager" decoding="async" fetchpriority="high" /></figure>
          <figure class="logo-card recommencer"><img src="${FOUNDERS_RECOMMENCER_LOGO_SRC}" alt="Recommencer" loading="eager" decoding="async" fetchpriority="high" /></figure>
        </div>
        <div class="catalogo-founder-prelude-stage" aria-live="polite">
          <div class="catalogo-founder-prelude-stage-head">
            <strong>Abertura visual do portal</strong>
            <span data-founder-prelude-percent>0%</span>
          </div>
          <div class="catalogo-founder-prelude-stage-bar">
            <span data-founder-prelude-bar></span>
          </div>
          <p data-founder-prelude-text>marcas apoiadoras em destaque</p>
        </div>
      </div>
    `;
    return prelude;
  }

  async function showFounderPreludeThen(callback) {
    rememberFounderPreludeInThisSession();
    rememberFounderPreludeThisWeek();
    await preloadFounderBannerAssets();

    const prelude = createFounderPrelude();
    document.body.appendChild(prelude);
    document.body.classList.add("catalogo-lock-scroll", "founder-prelude-active");

    window.requestAnimationFrame(() => {
      prelude.classList.add("is-open");
    });

    const duration = window.matchMedia("(max-width: 760px)").matches
      ? FOUNDER_PRELUDE_MS_PHONE
      : shouldUseCompactWelcome()
        ? FOUNDER_PRELUDE_MS_COMPACT
        : FOUNDER_PRELUDE_MS;

    const percentNode = prelude.querySelector("[data-founder-prelude-percent]");
    const barNode = prelude.querySelector("[data-founder-prelude-bar]");
    const textNode = prelude.querySelector("[data-founder-prelude-text]");
    const steps = [
      "marcas apoiadoras em destaque",
      "recursos visuais em sintonia",
      "entrada principal preparada",
      "home principal pronta"
    ];
    let stepIndex = 0;
    const startedAt = Date.now();
    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      if (percentNode) percentNode.textContent = `${progress}%`;
      if (barNode) barNode.style.width = `${progress}%`;
    }, 90);
    const stepTimer = window.setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, steps.length - 1);
      if (textNode) textNode.textContent = steps[stepIndex];
    }, Math.max(420, Math.round(duration / 4)));

    window.setTimeout(() => {
      window.clearInterval(progressTimer);
      window.clearInterval(stepTimer);
      if (percentNode) percentNode.textContent = "100%";
      if (barNode) barNode.style.width = "100%";
      if (textNode) textNode.textContent = steps[steps.length - 1];
      prelude.classList.remove("is-open");
      prelude.classList.add("is-leaving");
      window.setTimeout(() => {
        prelude.remove();
        document.body.classList.remove("catalogo-lock-scroll", "founder-prelude-active");
        callback();
      }, 280);
    }, duration);
  }

  function buildWelcomeVisualMarkup(options = {}) {
    const compact = options.compact === true;
    const phone = options.phone === true;
    const visualClass = compact
      ? `catalogo-welcome-visual catalogo-welcome-visual-compact${phone ? " catalogo-welcome-visual-phone" : ""}`
      : "catalogo-welcome-visual";

    return `
        <div class="${visualClass}" aria-hidden="true">
        <div class="catalogo-stage-chip">PORTAL REGIONAL, LEITURA EM CAMADAS</div>

        <div class="catalogo-cosmos">
          <span class="catalogo-sky-glow glow-a"></span>
          <span class="catalogo-sky-glow glow-b"></span>
          <span class="catalogo-sky-glow glow-c"></span>
          <span class="catalogo-sky-ribbon ribbon-a"></span>
          <span class="catalogo-sky-ribbon ribbon-b"></span>
          <span class="catalogo-orbital-satellite satellite-a"></span>
          <span class="catalogo-orbital-satellite satellite-b"></span>
          <span class="catalogo-ufo ufo-a"></span>
          <span class="catalogo-ufo ufo-b"></span>
          <div class="catalogo-cruzeiro-sul">
            <span class="catalogo-cruzeiro-trace trace-top"></span>
            <span class="catalogo-cruzeiro-trace trace-left"></span>
            <span class="catalogo-cruzeiro-trace trace-right"></span>
            <span class="catalogo-cruzeiro-trace trace-bottom"></span>
            <span class="catalogo-cruzeiro-star star-top"></span>
            <span class="catalogo-cruzeiro-star star-left"></span>
            <span class="catalogo-cruzeiro-star star-core"></span>
            <span class="catalogo-cruzeiro-star star-right"></span>
            <span class="catalogo-cruzeiro-star star-bottom"></span>
          </div>
          <span class="catalogo-star-alien alien-star-a"></span>
          <span class="catalogo-star-alien alien-star-b"></span>
          <span class="catalogo-star-alien alien-star-c"></span>
          <span class="catalogo-star-alien alien-star-d"></span>
          <span class="catalogo-star-alien alien-star-e"></span>
          <span class="catalogo-sky-angel sky-angel-a"></span>
          <span class="catalogo-sky-angel sky-angel-b"></span>
          <span class="catalogo-sky-angel sky-angel-c"></span>
          <span class="catalogo-bomber-plane bomber-plane-a">
            <span class="catalogo-plane-bomb"></span>
          </span>
          <span class="catalogo-bomber-plane bomber-plane-b">
            <span class="catalogo-plane-bomb"></span>
          </span>
          <span class="catalogo-bomber-plane bomber-plane-c">
            <span class="catalogo-plane-bomb"></span>
          </span>
          <span class="catalogo-bomber-plane bomber-plane-d">
            <span class="catalogo-plane-bomb"></span>
          </span>
          <span class="catalogo-war-drone drone-a"></span>
          <span class="catalogo-war-drone drone-b"></span>
          <span class="catalogo-war-drone drone-c"></span>
          <span class="catalogo-space-bus" aria-label="Onibus espacial com Elon Musk sentado">
            <span class="catalogo-space-bus-window"></span>
            <span class="catalogo-space-bus-passenger"></span>
          </span>
          <span class="catalogo-shooting-star"></span>
        </div>

        <div class="catalogo-war-tableau" aria-hidden="true">
          <span class="catalogo-war-smoke smoke-left"></span>
          <span class="catalogo-war-smoke smoke-mid"></span>
          <span class="catalogo-war-smoke smoke-right"></span>
          <span class="catalogo-war-flash flash-left"></span>
          <span class="catalogo-war-flash flash-center"></span>
          <span class="catalogo-war-flash flash-right"></span>
          <span class="catalogo-war-bomb bomb-a"></span>
          <span class="catalogo-war-bomb bomb-b"></span>
          <span class="catalogo-war-bomb bomb-c"></span>
          <span class="catalogo-war-bomb bomb-d"></span>
          <span class="catalogo-war-bomb bomb-e"></span>
          <span class="catalogo-war-blast blast-a"></span>
          <span class="catalogo-war-blast blast-b"></span>
          <span class="catalogo-war-blast blast-c"></span>
          <span class="catalogo-war-blast blast-d"></span>
          <span class="catalogo-war-tracer tracer-left"></span>
          <span class="catalogo-war-tracer tracer-mid"></span>
          <span class="catalogo-war-tracer tracer-right"></span>
          <span class="catalogo-war-searchlight light-left"></span>
          <span class="catalogo-war-searchlight light-right"></span>
          <span class="catalogo-war-jet jet-left"></span>
          <span class="catalogo-war-jet jet-right"></span>
          <span class="catalogo-war-vehicle vehicle-left"></span>
          <span class="catalogo-war-vehicle vehicle-right"></span>
          <span class="catalogo-war-tower tower-left"></span>
          <span class="catalogo-war-tower tower-right"></span>
        </div>

        <div class="catalogo-prophecy-panel" aria-hidden="true">
          <span class="catalogo-prophecy-kicker">Ilustracao alegorica do portal</span>
          <strong class="catalogo-prophecy-title">Tecnologia transforma barulho em manchete</strong>
          <div class="catalogo-prophecy-console">
            <span class="catalogo-prophecy-console-line">fontes locais em organização</span>
            <span class="catalogo-prophecy-console-line">serviços úteis em destaque</span>
            <span class="catalogo-prophecy-console-line">leitura regional pronta para abrir</span>
          </div>
          <div class="catalogo-prophecy-stream">
            <div class="catalogo-prophecy-phase phase-binary">
              01000100 01000101 01010011 01010100 01010010 01010101<br />
              01001001 01000011 01000001 01001111 00100000 01001101<br />
              01010101 01001110 01000100 01001001 01000001 01001100
            </div>
            <div class="catalogo-prophecy-phase phase-ascii">
              44 45 53 54 52 55 49 43 41 4F<br />
              4D 55 4E 44 49 41 4C // 45 4D<br />
              50 4F 55 43 4F 53 20 44 49 41 53
            </div>
            <div class="catalogo-prophecy-phase phase-code">
              Notícias, serviços e agenda local<br />
              ganham ordem antes da leitura.<br />
              Cada destaque aponta para sua fonte.
            </div>
            <div class="catalogo-prophecy-phase phase-glyph">
              Prioridade regional<br />
              serviços em primeiro plano<br />
              fontes identificadas<br />
              comunidade com caminho de checagem
            </div>
            <div class="catalogo-prophecy-phase phase-alert">
              <span class="catalogo-prophecy-alert-tag">leitura regional</span>
              <strong>Juruá em foco, serviços no mapa</strong>
              <span>informação útil antes do ruído</span>
              <small>leitura regional com fonte aberta</small>
            </div>
            <div class="catalogo-prophecy-phase phase-meme">
              <span class="catalogo-prophecy-alert-tag">leitura do dia</span>
              <strong>Juruá em destaque, serviços no mapa, agenda aberta</strong>
              <span>o portal organiza o que afeta a rotina da região</span>
              <small>notícias, agenda, serviços e comunidade no mesmo fluxo</small>
            </div>
          </div>
          <small>fontes > contexto > serviço > comunidade > leitura</small>
        </div>

        <div class="catalogo-night-landscape" aria-hidden="true">
          <span class="catalogo-horizon-glow"></span>
          <span class="catalogo-sea-band"></span>
          <span class="catalogo-war-ship ship-left"></span>
          <span class="catalogo-war-ship ship-center"></span>
          <span class="catalogo-war-ship ship-right"></span>
          <span class="catalogo-land-ridge ridge-back"></span>
          <span class="catalogo-land-ridge ridge-mid"></span>
          <span class="catalogo-land-ridge ridge-front"></span>
          <span class="catalogo-land-trail"></span>
          <div class="catalogo-skywatcher watcher-one"></div>
          <div class="catalogo-skywatcher watcher-two"></div>
          <div class="catalogo-battle-line">
            <span class="catalogo-trench trench-back"></span>
            <span class="catalogo-trench trench-front"></span>
            <span class="catalogo-war-crater crater-a"></span>
            <span class="catalogo-war-crater crater-b"></span>
            <span class="catalogo-war-crater crater-c"></span>
            <span class="catalogo-war-crater crater-d"></span>
            <span class="catalogo-war-tank tank-left"></span>
            <span class="catalogo-war-tank tank-center"></span>
            <span class="catalogo-war-tank tank-right"></span>
            <span class="catalogo-field-gun gun-left"></span>
            <span class="catalogo-field-gun gun-right"></span>

            <div class="catalogo-war-soldier human-unit runner-unit soldier-alpha">
              <span class="catalogo-war-rifle"></span>
            </div>
            <div class="catalogo-war-soldier human-unit striker-unit soldier-beta">
              <span class="catalogo-war-rifle"></span>
            </div>
            <div class="catalogo-war-soldier human-unit soldier-gamma">
              <span class="catalogo-war-rifle"></span>
            </div>
            <div class="catalogo-war-soldier human-unit runner-unit soldier-epsilon">
              <span class="catalogo-war-rifle"></span>
            </div>
            <div class="catalogo-war-soldier human-unit soldier-zeta">
              <span class="catalogo-war-rifle"></span>
            </div>
            <div class="catalogo-war-soldier human-unit soldier-delta">
              <span class="catalogo-war-rifle"></span>
            </div>
            <div class="catalogo-war-soldier human-unit soldier-eta">
              <span class="catalogo-war-rifle"></span>
            </div>
            <div class="catalogo-war-soldier human-unit striker-unit soldier-theta">
              <span class="catalogo-war-rifle"></span>
            </div>
            <div class="catalogo-war-soldier human-unit soldier-iota">
              <span class="catalogo-war-rifle"></span>
            </div>
            <div class="catalogo-war-soldier human-unit soldier-kappa">
              <span class="catalogo-war-rifle"></span>
            </div>
            <div class="catalogo-war-soldier human-unit soldier-lambda">
              <span class="catalogo-war-rifle"></span>
            </div>
            <span class="catalogo-battle-burst burst-a"></span>
            <span class="catalogo-battle-burst burst-b"></span>
            <span class="catalogo-battle-burst burst-c"></span>
            <span class="catalogo-battle-shot shot-a"></span>
            <span class="catalogo-battle-shot shot-b"></span>
            <span class="catalogo-battle-shot shot-c"></span>
          </div>
        </div>

        <div class="catalogo-visual-copy">
          <strong>Tecnologia em movimento</strong>
          <span>IA, curadoria local e recursos visuais trabalham juntos para deixar a entrada no portal mais clara e viva.</span>
        </div>
      </div>
    `;
  }

  function createWelcomeModal(options = {}) {
    const compact = options.compact === true;
    const phone = options.phone === true;
    const modal = document.createElement("section");
    modal.id = MODAL_ID;
    modal.className = `catalogo-welcome${compact ? " is-compact" : ""}${phone ? " is-phone" : ""}`;
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <article
        class="catalogo-welcome-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalogoWelcomeTitle"
      >
        ${buildWelcomeVisualMarkup({ compact, phone })}
        <div class="catalogo-welcome-copy">
          <div class="catalogo-compact-banner" aria-hidden="true">
            <span class="catalogo-compact-dot"></span>
            <strong>PORTAL REGIONAL, LEITURA EM CAMADAS</strong>
          </div>
          ${buildWelcomeCopyMarkup({ phone })}
        </div>
      </article>
    `;

    return modal;
  }

  function createReturningLoaderModal(options = {}) {
    const label = options.label || "Preparando página";
    const loader = document.createElement("div");
    loader.id = `${MODAL_ID}ReturningLoader`;
    loader.className = "catalogo-top-return-loader";
    loader.setAttribute("role", "status");
    loader.setAttribute("aria-live", "polite");
    loader.setAttribute("aria-label", label);
    loader.innerHTML = `
      <span class="catalogo-top-return-loader-track" aria-hidden="true"><i></i></span>
      <span class="catalogo-top-return-loader-row">
        <span class="catalogo-top-return-loader-text" data-top-loader-text>${label}</span>
        <strong data-top-loader-percent>0%</strong>
      </span>
    `;
    return loader;
  }

  function createInitialHomeLoaderModal() {
    const modal = document.createElement("section");
    modal.id = `${MODAL_ID}InitialLoader`;
    modal.className = "catalogo-welcome is-home-opening-loader is-premium-loader is-newspaper-loader";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <article
        class="catalogo-welcome-card premium-opening-card"
        role="status"
        aria-live="polite"
        aria-label="Abertura da página inicial"
      >
        <div class="premium-opening-map" aria-hidden="true">
          <span class="map-line"></span>
          <i class="map-point point-czs"></i>
          <i class="map-point point-mancio"></i>
          <i class="map-point point-rodrigues"></i>
          <i class="map-point point-porto"></i>
          <em class="map-label label-czs">Cruzeiro do Sul</em>
          <em class="map-label label-mancio">Mancio Lima</em>
          <em class="map-label label-porto">Porto Walter</em>
        </div>
        <div class="premium-opening-fragments" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
        </div>
        <div class="premium-opening-media" aria-hidden="true"></div>
        <div class="premium-opening-copy">
          <span class="premium-opening-compass"></span>
          <p class="catalogo-welcome-kicker">Portal</p>
          <h2 id="catalogoInitialLoaderTitle">Cruzeiro do Sul</h2>
          <strong class="premium-opening-subtitle">Vale do Juruá</strong>
          <p class="catalogo-welcome-lead">
            Informação que conecta. Conteúdo que transforma nossa região.
          </p>
          <div class="premium-opening-pillars" aria-hidden="true">
            <span><i></i>Notícias</span>
            <span><i></i>Comunidade</span>
            <span><i></i>Agenda</span>
            <span><i></i>Serviços</span>
          </div>
          <div class="catalogo-founder-opening premium-opening-progress" aria-live="polite">
            <div class="catalogo-founder-opening-head">
              <strong>Carregando</strong>
              <span data-initial-loader-percent>0%</span>
            </div>
            <div class="catalogo-founder-opening-bar">
              <span data-initial-loader-bar style="width: 0%"></span>
            </div>
            <p data-initial-loader-status>organizando os destaques do portal</p>
          </div>
        </div>
      </article>
    `;
    return modal;
  }

  function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function waitForVisiblePaint() {
    return new Promise((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(resolve);
      });
    });
  }

  function waitForLogoSplashDone(timeoutMs = 3200) {
    if (
      window.__CATALOGO_LOGO_SPLASH_DONE__ === true ||
      document.body.classList.contains("site-loaded") ||
      !document.body.classList.contains("catalogo-site-booting")
    ) {
      return Promise.resolve();
    }

    return Promise.race([
      new Promise((resolve) => {
        window.addEventListener("catalogo:logo-splash-finished", resolve, { once: true });
      }),
      delay(timeoutMs)
    ]);
  }

  function waitForDocumentComplete(timeoutMs = READY_FALLBACK_MS) {
    if (document.readyState === "complete") {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const timer = window.setTimeout(resolve, timeoutMs);
      window.addEventListener(
        "load",
        () => {
          window.clearTimeout(timer);
          resolve();
        },
        { once: true }
      );
    });
  }

  function waitForFontsReady(timeoutMs = 1600) {
    const fontsReady = document.fonts?.ready;
    if (!fontsReady || typeof fontsReady.then !== "function") {
      return Promise.resolve();
    }

    return Promise.race([fontsReady.catch(() => undefined), delay(timeoutMs)]);
  }

  function waitForHomeReady(timeoutMs = READY_FALLBACK_MS) {
    return Promise.race([
      Promise.all([
        new Promise((resolve) => whenSiteReady(resolve)),
        waitForDocumentComplete(timeoutMs),
        waitForFontsReady()
      ]),
      delay(timeoutMs)
    ]);
  }

  function updateInitialLoaderProgress(loader, progress, status = "") {
    const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
    const percentNode = loader.querySelector("[data-initial-loader-percent]");
    const barNode = loader.querySelector("[data-initial-loader-bar]");
    const statusNode = loader.querySelector("[data-initial-loader-status]");

    if (percentNode) percentNode.textContent = `${safeProgress}%`;
    if (barNode) barNode.style.width = `${safeProgress}%`;
    if (statusNode && status) statusNode.textContent = status;
  }

  function updateTopLoaderProgress(loader, progress, label = "") {
    const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
    const percentNode = loader.querySelector("[data-top-loader-percent]");
    const textNode = loader.querySelector("[data-top-loader-text]");
    const barNode = loader.querySelector(".catalogo-top-return-loader-track i");

    if (percentNode) percentNode.textContent = `${safeProgress}%`;
    if (textNode && label) textNode.textContent = label;
    if (barNode) barNode.style.width = `${Math.max(14, safeProgress)}%`;
  }

  async function runProgressUntilReady(loader, options = {}) {
    const minDuration = options.minDuration || INITIAL_HOME_LOADER_MIN_MS;
    const maxDuration = options.maxDuration || READY_FALLBACK_MS;
    const update = typeof options.update === "function" ? options.update : () => {};
    const statuses = Array.isArray(options.statuses) && options.statuses.length
      ? options.statuses
      : ["preparando estrutura", "montando notícias", "preparando imagens", "home pronta"];
    let currentProgress = 0;
    let statusIndex = 0;
    let ready = false;

    await waitForVisiblePaint();
    const startedAt = Date.now();

    waitForHomeReady(maxDuration).then(() => {
      ready = true;
    });

    return new Promise((resolve) => {
      const timer = window.setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const timeCap = ready ? 100 : 94;
        const timeProgress = Math.min(timeCap, Math.round((elapsed / minDuration) * 82) + 8);
        currentProgress = Math.max(currentProgress, timeProgress);
        statusIndex = Math.min(
          statuses.length - 1,
          Math.floor((currentProgress / 100) * statuses.length)
        );
        update(currentProgress, statuses[statusIndex]);

        if (ready && elapsed >= minDuration) {
          window.clearInterval(timer);
          update(100, statuses[statuses.length - 1]);
          window.setTimeout(resolve, 180);
        }
      }, 90);

      window.setTimeout(() => {
        ready = true;
      }, maxDuration);
    });
  }

  function prefetchNavigationTarget(href = "") {
    const normalizedHref = String(href || "").trim();
    if (!normalizedHref || normalizedHref.startsWith("#") || /^https?:\/\//i.test(normalizedHref)) {
      return Promise.resolve();
    }

    try {
      const targetUrl = new URL(normalizedHref, window.location.href);
      if (targetUrl.origin !== window.location.origin) {
        return Promise.resolve();
      }

      return Promise.race([
        fetch(targetUrl.href, {
          cache: "force-cache",
          credentials: "same-origin"
        }).then(() => undefined).catch(() => undefined),
        delay(ACTION_LOADER_MAX_MS)
      ]);
    } catch (_error) {
      return Promise.resolve();
    }
  }

  function openWelcomeModal(modal) {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("catalogo-lock-scroll");
  }

  function closeWelcomeModal(modal, callback) {
    if (!modal || modal.classList.contains("is-leaving")) {
      return;
    }
    closeWelcomeModalImmediately(modal, callback);
  }

  function closeWelcomeModalImmediately(modal, callback) {
    if (!modal) return;
    if (typeof modal.__stopFounderOpening === "function") {
      modal.__stopFounderOpening();
    }
    modal.classList.remove("is-open");
    modal.classList.add("is-leaving");
    modal.setAttribute("aria-hidden", "true");
    modal.style.pointerEvents = "none";
    releaseIntroLocks();
    window.setTimeout(() => {
      modal.remove();
      dispatchIntroFinished();
      if (typeof callback === "function") {
        callback();
      }
    }, 280);
  }

  function clearStaleWelcomeArtifacts() {
    document
      .querySelectorAll(
        ".catalogo-welcome.is-splash-loader.is-leaving, .catalogo-welcome.is-splash-loader, .catalogo-welcome.is-home-opening-loader.is-leaving, .catalogo-top-return-loader"
      )
      .forEach((node) => {
        node.remove();
      });

    releaseIntroLocks();
  }

  function showReturningLoaderThen(callback) {
    waitForLogoSplashDone(1800).then(() => {
      const loader = createReturningLoaderModal({
        label: "Preparando retorno"
      });
      let finished = false;
      const finish = () => {
        if (finished) {
          return;
        }
        finished = true;
        loader.classList.add("is-leaving");
        window.setTimeout(() => {
          loader.remove();
          if (typeof callback === "function") {
            callback();
          }
        }, 180);
      };

      document.body.appendChild(loader);
      window.requestAnimationFrame(() => {
        releaseFounderPreludeGate();
        loader.classList.add("is-visible");
        updateTopLoaderProgress(loader, 8, "Preparando retorno");
      });

      waitForVisiblePaint().then(() => {
        runProgressUntilReady(loader, {
          minDuration: RETURNING_LOADER_MS,
          maxDuration: READY_FALLBACK_MS,
          statuses: ["retomando página", "atualizando capa", "conferindo notícias", "home pronta"],
          update: (progress, status) => updateTopLoaderProgress(loader, progress, status)
        }).then(finish).catch(finish);
      });
    });
  }

  function showInitialHomeLoaderThen(callback) {
    rememberInitialHomeLoaderInThisSession();
    waitForLogoSplashDone().then(() => {
      const loader = createInitialHomeLoaderModal();
      let finished = false;
      let failsafeTimer = 0;
      const finish = () => {
        if (finished) {
          return;
        }
        finished = true;
        window.clearTimeout(failsafeTimer);
        updateInitialLoaderProgress(loader, 100, "portal pronto para leitura");
        closeWelcomeModalImmediately(loader, () => {
          releaseIntroLocks();
          if (typeof callback === "function") {
            callback();
          }
        });
      };

      document.body.classList.add("home-ready-gate-active");
      document.body.appendChild(loader);

      window.setTimeout(() => {
        releaseFounderPreludeGate();
        openWelcomeModal(loader);
        updateInitialLoaderProgress(loader, 4, "preparando a primeira abertura");
        runProgressUntilReady(loader, {
          minDuration: INITIAL_HOME_LOADER_MIN_MS,
          maxDuration: READY_FALLBACK_MS,
          statuses: [
            "montando capa do jornal",
            "guardando áreas no navegador",
            "organizando agenda e serviços",
            "portal pronto para leitura"
          ],
          update: (progress, status) => updateInitialLoaderProgress(loader, progress, status)
        }).then(finish).catch(finish);
      }, 30);

      failsafeTimer = window.setTimeout(finish, Math.max(READY_FALLBACK_MS + 1200, INITIAL_HOME_LOADER_MIN_MS + 2200));
    }).catch(() => {
      releaseIntroLocks();
      if (typeof callback === "function") {
        callback();
      }
    });
  }

  function showNavigationActionLoader(options = {}) {
    const href = options.href || "";
    const label = options.label || "Abrindo materia";
    const persistUntilNavigation = options.persistUntilNavigation !== false;
    const loader = createReturningLoaderModal({ label });
    let finished = false;

    const finish = () => {
      if (finished) {
        return;
      }
      finished = true;
      updateTopLoaderProgress(loader, 100, "abrindo página");
      if (persistUntilNavigation) {
        return;
      }
      loader.classList.add("is-leaving");
      window.setTimeout(() => {
        loader.remove();
      }, 180);
    };

    try {
      sessionStorage.setItem(PAGE_ACTION_LOADER_KEY, "1");
    } catch (_error) {
      // ignore storage failures
    }

    document.body.appendChild(loader);
    window.requestAnimationFrame(() => {
      loader.classList.add("is-visible", "is-action-loader");
      updateTopLoaderProgress(loader, 6, label);
    });

    return waitForVisiblePaint()
      .then(() =>
        Promise.all([
          prefetchNavigationTarget(href),
          runProgressUntilReady(loader, {
            minDuration: ACTION_LOADER_MIN_MS,
            maxDuration: ACTION_LOADER_MAX_MS,
            statuses: ["preparando matéria", "baixando página", "conferindo conteúdo", "abrindo página"],
            update: (progress, status) => updateTopLoaderProgress(loader, progress, status)
          })
        ])
      )
      .finally(() => {
        finish();
      });
  }

  function runWhenBrowserIsIdle(callback) {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => callback(), { timeout: 1200 });
      return;
    }

    window.setTimeout(callback, 180);
  }

  function whenSiteReady(callback) {
    const release = () => {
      if (released) return;
      released = true;
      observer?.disconnect();
      callback();
    };

    if (document.body.classList.contains("site-loaded")) {
      callback();
      return;
    }

    let released = false;
    const observer = new MutationObserver(() => {
      if (document.body.classList.contains("site-loaded")) {
        release();
      }
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"]
    });

    window.setTimeout(release, READY_FALLBACK_MS);
  }

  function openWelcomeConsentModal(options = {}) {
    const afterAccept = typeof options.afterAccept === "function" ? options.afterAccept : null;
    if (document.body.classList.contains("editorial-home")) {
      showMobileConsentBanner(afterAccept);
      return;
    }

    whenSiteReady(() => {
      runWhenBrowserIsIdle(() => {
        preloadFounderBannerAssets();
        removeLegacyConsentBanner();
        const oldModal = document.getElementById(MODAL_ID);
        if (oldModal) {
          oldModal.remove();
        }

        const modal = createWelcomeModal({
          compact: shouldUseCompactWelcome(),
          phone: shouldUsePhoneWelcome()
        });
        document.body.appendChild(modal);

        const checkbox = modal.querySelector("#catalogoAcceptTerms");
        const acceptButton = modal.querySelector("#catalogoAcceptButton");
        const requiresCheckbox = Boolean(checkbox);

        if (!acceptButton) {
          releaseFounderPreludeGate();
          closeWelcomeModalImmediately(modal, afterAccept);
          return;
        }

        if (checkbox) {
          checkbox.addEventListener("change", () => {
            acceptButton.disabled = !checkbox.checked;
          });
        }

        acceptButton.addEventListener("click", () => {
          if (requiresCheckbox && !checkbox.checked) {
            return;
          }

          clearStoredConsent();
          persistConsentState("accepted");
          rememberWelcomeAcceptedThisSession();
          rememberWelcomeAcceptedThisBrowserSession();
          rememberWelcomeAcceptedThisWeek();
          dispatchConsent(true);
          closeWelcomeModal(modal, afterAccept);
        });

        window.setTimeout(() => {
          releaseFounderPreludeGate();
          openWelcomeModal(modal);
        }, OPEN_DELAY_MS);
      });
    });
  }

  window.CatalogoPageLoader = {
    showForNavigation: showNavigationActionLoader
  };

  ready(() => {
    clearStaleWelcomeArtifacts();
    resetConsentForNewBrowserSession();
    const phoneFlow = shouldUsePhoneWelcome();
    const fastEditorialHome = document.body.classList.contains("editorial-home");
    const actionLoaderRequested =
      isBackForwardNavigation() ||
      isSkipIntroNavigation() ||
      cameFromArticlePage() ||
      consumePageActionLoaderFlag();
    let handledPersistedPageShow = false;

    window.addEventListener("pageshow", (event) => {
      if (!event.persisted) {
        return;
      }
      clearStaleWelcomeArtifacts();
      if (handledPersistedPageShow || phoneFlow || !fastEditorialHome) {
        return;
      }
      handledPersistedPageShow = true;
      releaseFounderPreludeGate();
      dispatchIntroFinished();
    });

    const continueAfterFounderPrelude = (options = {}) => {
      const shouldShowReturningLoader =
        !fastEditorialHome && (options.afterFounderPrelude === true || !phoneFlow);
      const finishLoaded = () => {
        releaseFounderPreludeGate();
        dispatchIntroFinished();
      };
      const showInitialLoaderAfterConsent = () => {
        showInitialHomeLoaderThen(finishLoaded);
      };

      const finishOrOpenWelcome = () => {
        if (shouldSkipWelcomeModal()) {
          removeLegacyConsentBanner();
          const oldModal = document.getElementById(MODAL_ID);
          if (oldModal) {
            oldModal.remove();
          }
          showInitialHomeLoaderThen(finishLoaded);
          return;
        }

        if (phoneFlow) {
          releaseFounderPreludeGate();
          showMobileConsentBanner(showInitialLoaderAfterConsent);
          return;
        }

        openWelcomeConsentModal({
          afterAccept: showInitialLoaderAfterConsent
        });
      };

      if (fastEditorialHome && !phoneFlow) {
        if (actionLoaderRequested) {
          showReturningLoaderThen(finishOrOpenWelcome);
          return;
        }

        if (!shouldSkipWelcomeModal()) {
          openWelcomeConsentModal({
            afterAccept: showInitialLoaderAfterConsent
          });
          return;
        }

        showInitialLoaderAfterConsent();
        return;
      }

      if (shouldSkipWelcomeModal()) {
        removeLegacyConsentBanner();
        const oldModal = document.getElementById(MODAL_ID);
        if (oldModal) {
          oldModal.remove();
        }
        if (shouldShowReturningLoader) {
          showReturningLoaderThen(() => {
            dispatchIntroFinished();
          });
          return;
        }
        releaseFounderPreludeGate();
        dispatchIntroFinished();
        return;
      }

      if (phoneFlow) {
        releaseFounderPreludeGate();
        showMobileConsentBanner();
        return;
      }

      if (shouldShowReturningLoader) {
        showReturningLoaderThen(openWelcomeConsentModal);
        return;
      }

      openWelcomeConsentModal();
    };

    if (fastEditorialHome && !phoneFlow) {
      continueAfterFounderPrelude();
      return;
    }

    if (actionLoaderRequested || hasSeenFounderPreludeThisWeek() || hasSeenFounderPreludeInThisSession()) {
      releaseFounderPreludeGate();
      continueAfterFounderPrelude();
      return;
    }

    if (phoneFlow) {
      rememberFounderPreludeInThisSession();
      rememberFounderPreludeThisWeek();
      releaseFounderPreludeGate();
      continueAfterFounderPrelude();
      return;
    }

    showFounderPreludeThen(() => continueAfterFounderPrelude({ afterFounderPrelude: true }));
  });
})();
