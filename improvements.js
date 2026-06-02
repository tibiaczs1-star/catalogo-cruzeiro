/**
 * CATALOGO IMPROVEMENTS MODULE
 * Todas as melhorias: intros, pop-ups e camadas
 * Carregado após o boot do site
 */
(function () {
  "use strict";

  // ========== CONFIG ==========
  const CONFIG = {
    // Intro
    introModes: {
      cinematic: { duration: 1250, label: "Cinematográfica" },
      preview: { duration: 1600, label: "Com headline" },
      minimal: { duration: 800, label: "Mínima" },
      none: { duration: 0, label: "Sem intro" }
    },
    // Pop-ups
    popupDelay: 30000, // newsletter aparece após 30s
    cookieExpiry: 365 * 24 * 60 * 60 * 1000, // 1 ano
    // Camadas
    tickerUpdateInterval: 60000, // 1 min
    weatherCacheTime: 30 * 60 * 1000, // 30 min
    regionStorageKey: "catalogo_region_v1",
    feedbackStorageKey: "catalogo_feedback_sent"
  };

  // ========== UTILS ==========
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const create = (tag, attrs = {}) => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  };
  const emit = (name, detail = {}) =>
    window.dispatchEvent(new CustomEvent(name, { detail }));
  const storage = {
    get: (k) => {
      try {
        return JSON.parse(sessionStorage.getItem(k) || localStorage.getItem(k) || "null");
      } catch {
        return null;
      }
    },
    set: (k, v, session = false) => {
      try {
        (session ? sessionStorage : localStorage).setItem(k, JSON.stringify(v));
      } catch {}
    }
  };
  const isMobile = () =>
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    window.innerWidth < 640;
  const isTablet = () =>
    window.innerWidth >= 640 && window.innerWidth < 1024;

  // ========== INTRO MODULE ==========
  function initIntro() {
    const mode = document.body.dataset.introMode || "cinematic";
    const intro = CONFIG.introModes[mode];
    if (!intro || intro.duration === 0) {
      // Modo none — revela conteúdo direto
      document.body.classList.add("site-loaded", "mobile-intro-ready");
      return;
    }

    // Adiciona classe de modo no splash
    const splash = $(".logo-splash");
    if (!splash) return;
    splash.dataset.introMode = mode;

    // Para modo preview, injeta headline no splash
    if (mode === "preview") {
      injectIntroHeadline(splash);
    }

    // Para modo minimal, encurta durações
    if (mode === "minimal") {
      splash.style.setProperty("--splash-scene-duration", "600ms");
      splash.style.setProperty("--splash-door-duration", "400ms");
    }

    emit("catalogo:intro-ready", { mode, duration: intro.duration });
  }

  function injectIntroHeadline(splash) {
    // Pega a primeira notícia do editorial flow
    const firstCard = $("[data-flow-live-title]");
    if (!firstCard) return;

    const title = firstCard.textContent?.trim() || "";
    if (!title) return;

    let headlineEl = splash.querySelector(".splash-intro-headline");
    if (!headlineEl) {
      headlineEl = create("div", {
        class: "splash-intro-headline",
        "aria-hidden": "true"
      });
      const card = splash.querySelector(".logo-splash-card");
      if (card) card.appendChild(headlineEl);
    }
    headlineEl.textContent = title;
  }

  // ========== POPUP MODULES ==========
  function initPopups() {
    // Hot News popup
    if (document.body.dataset.popupHotnews === "on") {
      initHotNewsPopup();
    }

    // Newsletter popup (com delay de 30s)
    if (document.body.dataset.popupNewsletter === "on") {
      initNewsletterPopup();
    }

    // Cookie/GDPR banner
    if (document.body.dataset.popupCookie === "on") {
      initCookieBanner();
    }

    // Dark mode toggle
    if (document.body.dataset.popupDarkmode === "on") {
      initDarkModeToggle();
    }

    // Capture popup (botão de câmera)
    if (document.body.dataset.popupCapture === "on") {
      initCaptureButton();
    }
  }

  // --- Hot News Popup ---
  function initHotNewsPopup() {
    // Escuta evento de nova notícia quente
    window.addEventListener("catalogo:hot-news", (e) => {
      showHotNewsPopup(e.detail);
    });

    // Também verifica manualmente ao carregar se há notícia quente
    const hotNews = $("[data-hot-news-title]");
    if (hotNews) {
      const title = hotNews.dataset.hotNewsTitle;
      const url = hotNews.dataset.hotNewsUrl || "#";
      if (title) showHotNewsPopup({ title, url });
    }
  }

  function showHotNewsPopup({ title, url }) {
    if (document.body.classList.contains("hot-news-popup-visible")) return;

    let popup = $("#hot-news-popup");
    if (!popup) {
      popup = create("div", {
        id: "hot-news-popup",
        class: "catalogo-popup hot-news-popup",
        role: "alertdialog",
        "aria-modal": "true",
        hidden: ""
      });
      popup.innerHTML = `
        <div class="popup-card">
          <span class="popup-badge">🔥 NOVIDADE</span>
          <p class="popup-headline"></p>
          <div class="popup-actions">
            <a href="#" class="popup-btn-primary">Ler agora</a>
            <button class="popup-btn-close" aria-label="Fechar">×</button>
          </div>
        </div>
      `;
      document.body.appendChild(popup);

      popup.querySelector(".popup-btn-close").addEventListener("click", (e) => {
        e.preventDefault();
        hidePopup(popup);
      });

      popup.addEventListener("click", (e) => {
        if (e.target === popup) hidePopup(popup);
      });
    }

    popup.querySelector(".popup-headline").textContent = title;
    popup.querySelector(".popup-btn-primary").href = url;
    popup.hidden = false;
    document.body.classList.add("hot-news-popup-visible");
    emit("catalogo:popup-shown", { type: "hotnews" });
  }

  // --- Newsletter Popup ---
  function initNewsletterPopup() {
    const shown = storage.get("catalogo_newsletter_shown");
    if (shown) return;

    setTimeout(() => {
      showNewsletterPopup();
      storage.set("catalogo_newsletter_shown", true);
    }, CONFIG.popupDelay);
  }

  function showNewsletterPopup() {
    let popup = $("#newsletter-popup");
    if (!popup) {
      popup = create("div", {
        id: "newsletter-popup",
        class: "catalogo-popup newsletter-popup",
        role: "dialog",
        "aria-modal": "true",
        hidden: ""
      });
      popup.innerHTML = `
        <div class="popup-card">
          <span class="popup-badge">📬 BOLETIM</span>
          <h3>Resumo do dia no seu e-mail</h3>
          <p>Receba as principais notícias de Cruzeiro do Sul e região toda manhã.</p>
          <form class="popup-form" onsubmit="return false">
            <input type="email" placeholder="seu@email.com" required />
            <button type="submit">Inscrever</button>
          </form>
          <button class="popup-btn-close" aria-label="Fechar">×</button>
        </div>
      `;
      document.body.appendChild(popup);

      popup.querySelector(".popup-btn-close").addEventListener("click", () => hidePopup(popup));
      popup.querySelector(".popup-form").addEventListener("submit", handleNewsletterSubmit);
      popup.addEventListener("click", (e) => { if (e.target === popup) hidePopup(popup); });
    }
    popup.hidden = false;
    emit("catalogo:popup-shown", { type: "newsletter" });
  }

  function handleNewsletterSubmit(e) {
    const input = e.target.querySelector("input[type=email]");
    const email = input?.value;
    if (!email) return;

    // Envia para API
    fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name: "" })
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok || d.error?.includes("Google")) {
          showInlineMessage(e.target, "Enviado! Obrigado.");
        } else {
          showInlineMessage(e.target, "Tente novamente.");
        }
      })
      .catch(() => showInlineMessage(e.target, "Erro. Tente mais tarde."));

    function showInlineMessage(form, msg) {
      const old = form.querySelector(".form-msg");
      if (old) old.remove();
      const el = create("p", { class: "form-msg" });
      el.textContent = msg;
      form.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    }
  }

  // --- Cookie Banner ---
  function initCookieBanner() {
    const consent = storage.get("catalogo_cookie_consent");
    if (consent) return;

    let banner = $("#cookie-banner");
    if (!banner) {
      banner = create("div", {
        id: "cookie-banner",
        class: "catalogo-popup cookie-banner",
        role: "region",
        "aria-label": "Aviso de cookie",
        hidden: ""
      });
      banner.innerHTML = `
        <div class="cookie-card">
          <p>Usamos cookies para melhorar sua experiência. Ao continuar navegando, você aceita nossa <a href="/politica-privacidade.html">política de privacidade</a>.</p>
          <div class="cookie-actions">
            <button class="cookie-accept" onclick="window.__acceptCookies__()">Aceitar</button>
            <button class="cookie-settings" onclick="window.__cookieSettings__()">Configurar</button>
          </div>
        </div>
      `;
      document.body.appendChild(banner);

      window.__acceptCookies__ = () => {
        storage.set("catalogo_cookie_consent", "accepted", false);
        storage.set("catalogo_cookie_consent_date", Date.now(), false);
        hidePopup(banner);
      };
      window.__cookieSettings__ = () => {
        storage.set("catalogo_cookie_consent", "custom", false);
        hidePopup(banner);
        showCookieSettings();
      };
    }
    banner.hidden = false;
    emit("catalogo:popup-shown", { type: "cookie" });
  }

  function showCookieSettings() {
    // Configurações detalhadas de cookies
    const modal = create("div", {
      id: "cookie-settings-modal",
      class: "catalogo-popup cookie-settings-modal",
      role: "dialog",
      "aria-modal": "true",
      hidden: ""
    });
    modal.innerHTML = `
      <div class="popup-card">
        <h3>Configurar Cookies</h3>
        <label><input type="checkbox" checked disabled /> Necessários (sempre ativos)</label>
        <label><input type="checkbox" id="cookie-analytics" /> Analytics</label>
        <label><input type="checkbox" id="cookie-marketing" /> Marketing</label>
        <label><input type="checkbox" id="cookie-preferences" /> Preferências</label>
        <button class="popup-btn-primary" onclick="window.__saveCookieSettings__()">Salvar</button>
        <button class="popup-btn-close" aria-label="Fechar">×</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.hidden = false;

    modal.querySelector(".popup-btn-close").addEventListener("click", () => {
      modal.remove();
    });

    window.__saveCookieSettings__ = () => {
      const analytics = modal.querySelector("#cookie-analytics")?.checked;
      const marketing = modal.querySelector("#cookie-marketing")?.checked;
      storage.set("catalogo_cookie_analytics", analytics);
      storage.set("catalogo_cookie_marketing", marketing);
      modal.remove();
    };
  }

  // --- Dark Mode Toggle ---
  function initDarkModeToggle() {
    // Adiciona botão de dark mode no header
    const header = $(".site-header-stack, .masthead, header");
    if (!header) return;

    let toggle = header.querySelector(".dark-mode-toggle");
    if (!toggle) {
      toggle = create("button", {
        class: "dark-mode-toggle",
        "aria-label": "Alternar modo escuro",
        title: "Modo escuro"
      });
      toggle.innerHTML = "🌙";
      toggle.addEventListener("click", toggleDarkMode);
      header.appendChild(toggle);
    }

    // Aplica modo salvo
    const saved = storage.get("catalogo_dark_mode");
    if (saved === "on") {
      document.body.classList.add("dark-mode");
      toggle.textContent = "☀️";
    }
  }

  function toggleDarkMode() {
    const isDark = document.body.classList.toggle("dark-mode");
    storage.set("catalogo_dark_mode", isDark ? "on" : "off");
    const toggle = $(".dark-mode-toggle");
    if (toggle) toggle.textContent = isDark ? "☀️" : "🌙";
    emit("catalogo:dark-mode-toggle", { active: isDark });
  }

  // --- Capture Button ---
  function initCaptureButton() {
    // Adiciona botão flutuante de captura de foto/vídeo
    if ($(".capture-fab")) return; // já existe

    const fab = create("button", {
      class: "capture-fab",
      "aria-label": "Enviar foto ou vídeo",
      title: "Enviar foto ou vídeo"
    });
    fab.innerHTML = "📷";
    fab.addEventListener("click", openCapturePopup);
    document.body.appendChild(fab);
  }

  function openCapturePopup() {
    // Se tem CatalogoCapture no window, usa ele
    if (typeof window.CatalogoCapture?.open === "function") {
      window.CatalogoCapture.open();
      return;
    }
    // Fallback: popup simples com instruções
    let popup = $("#capture-popup");
    if (!popup) {
      popup = create("div", {
        id: "capture-popup",
        class: "catalogo-popup capture-popup",
        role: "dialog",
        "aria-modal": "true",
        hidden: ""
      });
      popup.innerHTML = `
        <div class="popup-card">
          <h3>📷 Enviar Foto ou Vídeo</h3>
          <p>Envie uma foto ou vídeo para o Catálogo Cruzeiro do Sul.</p>
          <div class="capture-methods">
            <label class="capture-method">
              <input type="file" accept="image/*" capture="environment" />
              <span>📸 Foto</span>
            </label>
            <label class="capture-method">
              <input type="file" accept="video/*" capture="camcorder" />
              <span>🎥 Vídeo</span>
            </label>
          </div>
          <button class="popup-btn-close" aria-label="Fechar">×</button>
        </div>
      `;
      document.body.appendChild(popup);
      popup.querySelector(".popup-btn-close").addEventListener("click", () => hidePopup(popup));

      popup.querySelectorAll("input[type=file]").forEach((input) => {
        input.addEventListener("change", handleCaptureFile);
      });
    }
    popup.hidden = false;
    emit("catalogo:popup-shown", { type: "capture" });
  }

  function handleCaptureFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Feedback simples
    alert(`Arquivo selecionado: ${file.name}\n\nEm breve: envio direto para a redação.`);
    hidePopup($("#capture-popup"));
  }

  // ========== LAYER MODULES ==========
  function initLayers() {
    // Live ticker
    if (document.body.dataset.layerLive === "on") {
      initLiveTicker();
    }

    // Weather widget
    if (document.body.dataset.layerClimate === "on") {
      initWeatherWidget();
    }

    // Region selector
    if (document.body.dataset.layerRegion === "on") {
      initRegionSelector();
    }

    // Quick access drawer
    if (document.body.dataset.layerQuick === "on") {
      initQuickAccessDrawer();
    }

    // Feedback button
    if (document.body.dataset.layerFeedback === "on") {
      initFeedbackButton();
    }
  }

  // --- Live Ticker ---
  function initLiveTicker() {
    const ticker = $(".ticker-live-shell, .portal-status-ribbon");
    if (!ticker) return;

    // Torna o ticker mais ativo com atualização automática
    const updateTicker = () => {
      fetch("/api/news?limit=3")
        .then((r) => r.json())
        .then((d) => {
          const items = (d.items || []).slice(0, 3);
          if (!items.length) return;
          const tickerItems = ticker.querySelector(".ticker-items") || ticker;
          const tickerEl = create("div", { class: "ticker-update" });
          tickerEl.textContent = items.map((i) => `• ${i.title}`).join("  ");
          tickerEl.style.opacity = "0";
          ticker.appendChild(tickerEl);
          requestAnimationFrame(() => {
            tickerEl.style.transition = "opacity 0.4s";
            tickerEl.style.opacity = "1";
          });
          setTimeout(() => {
            tickerEl.style.opacity = "0";
            setTimeout(() => tickerEl.remove(), 400);
          }, 15000);
        })
        .catch(() => {});
    };

    // Atualiza a cada 5 min
    setInterval(updateTicker, 5 * 60 * 1000);
    // Primeira atualização em 30s
    setTimeout(updateTicker, 30000);
  }

  // --- Weather Widget ---
  function initWeatherWidget() {
    const hero = $(".hero-newsroom-shell, .hero-tourism-shell");
    if (!hero) return;

    let widget = hero.querySelector(".weather-widget");
    if (!widget) {
      widget = create("div", { class: "weather-widget" });
      hero.appendChild(widget);
    }

    // Busca dados de clima (mock - substituir por API real)
    const weatherData = storage.get("catalogo_weather");
    if (weatherData && Date.now() - weatherData.ts < CONFIG.weatherCacheTime) {
      renderWeatherWidget(widget, weatherData.data);
    } else {
      fetch("/api/weather")
        .then((r) => r.json())
        .then((d) => {
          if (d.ok) {
            storage.set("catalogo_weather", { ts: Date.now(), data: d });
            renderWeatherWidget(widget, d);
          }
        })
        .catch(() => {
          // Fallback offline
          renderWeatherWidget(widget, {
            temp: "--",
            condition: "offline",
            city: "Cruzeiro do Sul"
          });
        });
    }
  }

  function renderWeatherWidget(widget, data) {
    const icons = {
      sun: "☀️", cloud: "☁️", rain: "🌧️", storm: "⛈️",
      snow: "❄️", fog: "🌫️", night: "🌙", offline: "📡"
    };
    const icon = icons[data.condition] || icons.offline;
    widget.innerHTML = `
      <span class="weather-icon">${icon}</span>
      <span class="weather-temp">${data.temp || "--"}°</span>
      <span class="weather-city">${data.city || ""}</span>
    `;
  }

  // --- Region Selector ---
  function initRegionSelector() {
    const header = $(".site-header-stack, .masthead, header");
    if (!header) return;

    let selector = header.querySelector(".region-selector");
    if (!selector) {
      selector = create("div", { class: "region-selector" });
      const regions = [
        { id: "cruzeiro-sul", label: "Cruzeiro do Sul" },
        { id: "jurua", label: "Juruá" },
        { id: "purus", label: "Purus" },
        { id: "acre", label: "Acre" }
      ];
      selector.innerHTML = `
        <button class="region-current" aria-haspopup="listbox">
          <span class="region-label">🌐 Cruzeiro do Sul</span>
        </button>
        <ul class="region-list" role="listbox" hidden>
          ${regions
            .map(
              (r) =>
                `<li><button data-region="${r.id}" role="option">${r.label}</button></li>`
            )
            .join("")}
        </ul>
      `;
      header.appendChild(selector);

      const btn = selector.querySelector(".region-current");
      const list = selector.querySelector(".region-list");

      btn.addEventListener("click", () => {
        list.hidden = !list.hidden;
      });

      selector.querySelectorAll("[data-region]").forEach((item) => {
        item.addEventListener("click", () => {
          const region = item.dataset.region;
          storage.set(CONFIG.regionStorageKey, region);
          list.hidden = true;
          updateRegionUI(selector, item.textContent);
          emit("catalogo:region-change", { region });
          // Recarrega com região
          window.location.search = `?region=${region}`;
        });
      });

      // Aplica região salva
      const savedRegion = storage.get(CONFIG.regionStorageKey);
      if (savedRegion) {
        const savedItem = selector.querySelector(`[data-region="${savedRegion}"]`);
        if (savedItem) {
          updateRegionUI(selector, savedItem.textContent);
        }
      }

      // Fecha ao clicar fora
      document.addEventListener("click", (e) => {
        if (!selector.contains(e.target)) {
          list.hidden = true;
        }
      });
    }
  }

  function updateRegionUI(selector, label) {
    const labelEl = selector.querySelector(".region-label");
    if (labelEl) labelEl.textContent = label;
    selector.querySelectorAll("[data-region]").forEach((btn) => {
      btn.setAttribute(
        "aria-selected",
        btn.textContent === label ? "true" : "false"
      );
    });
  }

  // --- Quick Access Drawer ---
  function initQuickAccessDrawer() {
    // Adiciona botão de drawer no header
    const header = $(".site-header-stack, .masthead, header");
    if (!header || $(".quick-access-btn")) return;

    const btn = create("button", {
      class: "quick-access-btn",
      "aria-label": "Acesso rápido",
      "aria-expanded": "false",
      "aria-controls": "quick-access-drawer"
    });
    btn.innerHTML = "☰";
    btn.addEventListener("click", toggleQuickDrawer);
    header.appendChild(btn);

    // Cria drawer
    let drawer = $("#quick-access-drawer");
    if (!drawer) {
      drawer = create("div", {
        id: "quick-access-drawer",
        class: "quick-access-drawer",
        role: "dialog",
        "aria-label": "Acesso rápido"
      });
      drawer.innerHTML = `
        <div class="drawer-header">
          <h3>Acesso Rápido</h3>
          <button class="drawer-close" aria-label="Fechar">×</button>
        </div>
        <nav class="drawer-nav">
          <a href="#noticias" class="drawer-item">📰 Notícias</a>
          <a href="#servicos" class="drawer-item">📋 Serviços</a>
          <a href="#agenda" class="drawer-item">📅 Agenda</a>
          <a href="#clima-alertas" class="drawer-item">🌤️ Clima</a>
          <a href="#arquivo" class="drawer-item">📁 Arquivo</a>
          <a href="#newsletter" class="drawer-item">📬 Newsletter</a>
          <a href="#contato" class="drawer-item">📞 Contato</a>
          <a href="/pubpaid.html" class="drawer-item">🎮 PubPaid</a>
        </nav>
      `;
      document.body.appendChild(drawer);

      drawer.querySelector(".drawer-close").addEventListener("click", toggleQuickDrawer);
      drawer.querySelectorAll(".drawer-item").forEach((item) => {
        item.addEventListener("click", () => {
          toggleQuickDrawer();
        });
      });

      drawer.addEventListener("click", (e) => {
        if (e.target === drawer) toggleQuickDrawer();
      });
    }

    function toggleQuickDrawer() {
      const isOpen = !drawer.hidden;
      drawer.hidden = isOpen;
      btn.setAttribute("aria-expanded", String(!isOpen));
      document.body.classList.toggle("drawer-open", !isOpen);
    }
  }

  // --- Feedback Button ---
  function initFeedbackButton() {
    if ($(".feedback-fab")) return;

    const fab = create("button", {
      class: "feedback-fab",
      "aria-label": "Enviar feedback ou dica",
      title: "Feedback ou dica"
    });
    fab.innerHTML = "💬";
    fab.addEventListener("click", openFeedbackPopup);
    document.body.appendChild(fab);
  }

  function openFeedbackPopup() {
    // Verifica se já enviou recentemente
    const sent = storage.get(CONFIG.feedbackStorageKey);
    if (sent && Date.now() - sent < 60 * 60 * 1000) {
      alert("Obrigado! Já recebemos seu feedback recently. Tente novamente em 1 hora.");
      return;
    }

    let popup = $("#feedback-popup");
    if (!popup) {
      popup = create("div", {
        id: "feedback-popup",
        class: "catalogo-popup feedback-popup",
        role: "dialog",
        "aria-modal": "true",
        hidden: ""
      });
      popup.innerHTML = `
        <div class="popup-card">
          <h3>💬 Enviar Feedback ou Dica</h3>
          <form class="popup-form" onsubmit="return false">
            <select class="feedback-type">
              <option value="tip">💡 Dica de pauta</option>
              <option value="correction">🔍 Correção</option>
              <option value="complaint">⚠️ Denúncia</option>
              <option value="praise">✅ Elogio</option>
              <option value="other">💬 Outro</option>
            </select>
            <textarea class="feedback-message" placeholder="Descreva aqui..." rows="4" required></textarea>
            <input type="email" class="feedback-email" placeholder="Seu e-mail (opcional)" />
            <button type="submit">Enviar</button>
          </form>
          <button class="popup-btn-close" aria-label="Fechar">×</button>
        </div>
      `;
      document.body.appendChild(popup);

      popup.querySelector(".popup-btn-close").addEventListener("click", () => hidePopup(popup));
      popup.querySelector(".popup-form").addEventListener("submit", handleFeedbackSubmit);
    }
    popup.hidden = false;
  }

  function handleFeedbackSubmit(e) {
    const type = e.target.querySelector(".feedback-type")?.value;
    const message = e.target.querySelector(".feedback-message")?.value;
    const email = e.target.querySelector(".feedback-email")?.value;

    if (!message) return;

    // Envia para API
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, message, email, url: window.location.href })
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          storage.set(CONFIG.feedbackStorageKey, Date.now());
          hidePopup($("#feedback-popup"));
          alert("Obrigado! Seu feedback foi enviado.");
        } else {
          alert("Erro ao enviar. Tente mais tarde.");
        }
      })
      .catch(() => alert("Erro ao enviar. Tente mais tarde."));
  }

  // ========== SHARED HELPERS ==========
  function hidePopup(popup) {
    if (!popup) return;
    popup.hidden = true;
    popup.setAttribute("aria-hidden", "true");
    document.body.classList.remove("hot-news-popup-visible");
    emit("catalogo:popup-hidden", {});
  }

  // ========== BOOT ==========
  function boot() {
    initIntro();
    initPopups();
    initLayers();
    injectPopupStyles();
    injectLayerStyles();
    emit("catalogo:improvements-ready", {});
  }

  // ========== INLINE STYLES ==========
  function injectPopupStyles() {
    if ($("#improvements-popup-styles")) return;
    const style = create("style", { id: "improvements-popup-styles" });
    style.textContent = `
      /* ===== POPUP BASE ===== */
      .catalogo-popup {
        position: fixed;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        background: rgba(3,14,26,0.64);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
      }
      .catalogo-popup[hidden] { display: none !important; }
      .catalogo-popup .popup-card {
        position: relative;
        max-width: 420px;
        width: 100%;
        padding: 1.5rem;
        border-radius: 1.2rem;
        background: linear-gradient(160deg,rgba(10,47,76,0.98),rgba(13,74,84,0.98));
        color: #f4fbff;
        box-shadow: 0 30px 80px rgba(0,0,0,0.42);
      }
      .catalogo-popup .popup-badge {
        display: inline-block;
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        background: rgba(247,201,122,0.2);
        color: #f7c97a;
        font-size: 0.7rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 0.5rem;
      }
      .catalogo-popup h3 {
        margin: 0 0 0.5rem;
        font-size: 1.15rem;
        color: #fff;
      }
      .catalogo-popup p { color: rgba(232,242,255,0.82); line-height: 1.5; }
      .catalogo-popup .popup-btn-close {
        position: absolute;
        top: 0.6rem;
        right: 0.8rem;
        background: none;
        border: none;
        color: rgba(232,242,255,0.6);
        font-size: 1.4rem;
        cursor: pointer;
        line-height: 1;
        padding: 0.2rem 0.4rem;
      }
      .catalogo-popup .popup-btn-close:hover { color: #fff; }
      .popup-actions { display: flex; gap: 0.5rem; margin-top: 1rem; align-items: center; }
      .popup-btn-primary {
        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.65rem 1rem;
        border-radius: 0.6rem;
        background: #f0b429;
        color: #071321;
        font-weight: 900;
        font-size: 0.9rem;
        text-decoration: none;
        text-align: center;
        border: none;
        cursor: pointer;
      }
      .popup-btn-primary:hover { background: #ffd66f; }
      .popup-form { display: flex; flex-direction: column; gap: 0.6rem; margin-top: 0.8rem; }
      .popup-form input, .popup-form select, .popup-form textarea {
        padding: 0.6rem 0.8rem;
        border-radius: 0.5rem;
        border: 1px solid rgba(255,255,255,0.16);
        background: rgba(255,255,255,0.08);
        color: #fff;
        font-size: 0.9rem;
        font-family: inherit;
      }
      .popup-form input::placeholder, .popup-form textarea::placeholder { color: rgba(232,242,255,0.4); }
      .popup-form textarea { resize: vertical; min-height: 80px; }
      .popup-form button[type=submit] {
        padding: 0.7rem;
        border-radius: 0.5rem;
        background: #f0b429;
        color: #071321;
        font-weight: 900;
        font-size: 0.9rem;
        border: none;
        cursor: pointer;
      }
      .popup-form label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: rgba(232,242,255,0.82);
        font-size: 0.88rem;
        cursor: pointer;
      }

      /* ===== HOT NEWS ===== */
      .hot-news-popup .popup-headline {
        font-size: 1.05rem;
        font-weight: 700;
        color: #fff;
        margin: 0.4rem 0 0.5rem;
        line-height: 1.3;
      }

      /* ===== COOKIE BANNER ===== */
      .cookie-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 9000;
        padding: 0.75rem 1rem;
        background: rgba(3,14,26,0.92);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border-top: 1px solid rgba(247,201,122,0.24);
      }
      .cookie-banner[hidden] { display: none !important; }
      .cookie-card {
        max-width: 680px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .cookie-card p { margin: 0; color: rgba(232,242,255,0.82); font-size: 0.85rem; flex: 1; min-width: 200px; }
      .cookie-card p a { color: #f0b429; }
      .cookie-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
      .cookie-actions button {
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.82rem;
        font-weight: 700;
        cursor: pointer;
        border: none;
      }
      .cookie-accept { background: #f0b429; color: #071321; }
      .cookie-settings { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2) !important; }
      .cookie-settings-modal .popup-card label { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0; cursor: pointer; }

      /* ===== DARK MODE TOGGLE ===== */
      .dark-mode-toggle {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.14);
        font-size: 1.1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background 0.2s;
      }
      .dark-mode-toggle:hover { background: rgba(255,255,255,0.18); }
      body.dark-mode { filter: invert(0.92) hue-rotate(180deg); }

      /* ===== CAPTURE FAB ===== */
      .capture-fab {
        position: fixed;
        bottom: 5.5rem;
        right: 1rem;
        z-index: 8000;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: linear-gradient(135deg,#f0b429,#e07820);
        color: #fff;
        font-size: 1.4rem;
        border: none;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(240,180,41,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .capture-methods { display: flex; gap: 0.75rem; margin-top: 0.8rem; }
      .capture-method {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.4rem;
        padding: 0.8rem;
        border-radius: 0.8rem;
        border: 1px solid rgba(255,255,255,0.14);
        background: rgba(255,255,255,0.06);
        cursor: pointer;
        color: rgba(232,242,255,0.82);
        font-size: 0.82rem;
        font-weight: 700;
        transition: background 0.2s, border-color 0.2s;
      }
      .capture-method:hover { background: rgba(255,255,255,0.12); border-color: rgba(240,180,41,0.5); }
      .capture-method input[type=file] { display: none; }
      .capture-method span { font-size: 1.4rem; }
    `;
    document.head.appendChild(style);
  }

  function injectLayerStyles() {
    if ($("#improvements-layer-styles")) return;
    const style = create("style", { id: "improvements-layer-styles" });
    style.textContent = `
      /* ===== WEATHER WIDGET ===== */
      .weather-widget {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.3rem 0.7rem;
        border-radius: 999px;
        background: rgba(255,255,255,0.12);
        border: 1px solid rgba(255,255,255,0.14);
        font-size: 0.85rem;
        color: #fff;
        white-space: nowrap;
      }
      .weather-icon { font-size: 1rem; }
      .weather-temp { font-weight: 900; }
      .weather-city { color: rgba(232,242,255,0.7); font-size: 0.78rem; }

      /* ===== REGION SELECTOR ===== */
      .region-selector { position: relative; }
      .region-current {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.3rem 0.6rem;
        border-radius: 0.4rem;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.14);
        color: rgba(232,242,255,0.82);
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
      }
      .region-list {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 0.3rem;
        min-width: 160px;
        border-radius: 0.6rem;
        background: linear-gradient(160deg,rgba(10,47,76,0.98),rgba(13,74,84,0.98));
        border: 1px solid rgba(247,201,122,0.24);
        box-shadow: 0 16px 40px rgba(0,0,0,0.36);
        overflow: hidden;
        z-index: 100;
        list-style: none;
        margin: 0;
        padding: 0.3rem;
      }
      .region-list[hidden] { display: none !important; }
      .region-list li button {
        display: block;
        width: 100%;
        padding: 0.5rem 0.7rem;
        text-align: left;
        background: none;
        border: none;
        color: rgba(232,242,255,0.82);
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        border-radius: 0.4rem;
        transition: background 0.15s;
      }
      .region-list li button:hover,
      .region-list li button[aria-selected="true"] {
        background: rgba(247,201,122,0.16);
        color: #f7c97a;
      }

      /* ===== QUICK ACCESS DRAWER ===== */
      .quick-access-btn {
        width: 36px;
        height: 36px;
        border-radius: 0.5rem;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.14);
        color: rgba(232,242,255,0.82);
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .quick-access-btn:hover { background: rgba(255,255,255,0.18); }
      .quick-access-drawer {
        position: fixed;
        inset: 0;
        z-index: 9998;
        background: rgba(3,14,26,0.78);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
      }
      .quick-access-drawer[hidden] { display: none !important; }
      .quick-access-drawer .drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.2rem;
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }
      .quick-access-drawer .drawer-header h3 { margin: 0; color: #fff; font-size: 1.05rem; }
      .quick-access-drawer .drawer-close {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255,255,255,0.1);
        border: none;
        color: #fff;
        font-size: 1.2rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .quick-access-drawer .drawer-nav {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
        padding: 1rem;
        background: linear-gradient(160deg,rgba(10,47,76,0.98),rgba(13,74,84,0.98));
        border-radius: 1.2rem 1.2rem 0 0;
        max-height: 70vh;
        overflow-y: auto;
      }
      .drawer-item {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.75rem 1rem;
        border-radius: 0.7rem;
        background: rgba(255,255,255,0.07);
        border: 1px solid rgba(255,255,255,0.1);
        color: rgba(232,242,255,0.88);
        font-size: 0.9rem;
        font-weight: 600;
        text-decoration: none;
        transition: background 0.15s, border-color 0.15s;
      }
      .drawer-item:hover { background: rgba(247,201,122,0.12); border-color: rgba(240,180,41,0.4); color: #f7c97a; }
      @media (max-width: 640px) {
        .quick-access-drawer .drawer-nav { grid-template-columns: 1fr; }
      }

      /* ===== FEEDBACK FAB ===== */
      .feedback-fab {
        position: fixed;
        bottom: 5.5rem;
        left: 1rem;
        z-index: 8000;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: rgba(15,39,66,0.88);
        color: #f0b429;
        font-size: 1.2rem;
        border: 1px solid rgba(240,180,41,0.3);
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(8px);
      }
      .feedback-fab:hover { background: rgba(15,39,66,0.98); }

      /* ===== SPLASH INTRO HEADLINE ===== */
      .splash-intro-headline {
        margin-top: 0.5rem;
        padding: 0.4rem 0.8rem;
        border-radius: 0.4rem;
        background: rgba(247,201,122,0.14);
        color: #f7c97a;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        text-align: center;
        max-width: 40ch;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        animation: splashHeadlineFade 1s ease-out forwards;
      }
      @keyframes splashHeadlineFade {
        0% { opacity: 0; transform: translateY(4px); }
        30% { opacity: 1; transform: translateY(0); }
        80% { opacity: 1; }
        100% { opacity: 0.6; }
      }

      /* ===== TICKER UPDATE ===== */
      .ticker-update {
        font-size: 0.8rem;
        color: rgba(232,242,255,0.7);
        padding: 0.2rem 0.5rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* ===== FEEDBACK POPUP ===== */
      .feedback-type { width: 100%; }
      .feedback-message { width: 100%; }

      /* ===== MOBILE ADJUSTMENTS ===== */
      @media (max-width: 640px) {
        .cookie-banner { padding: 0.6rem 0.75rem; }
        .cookie-card { flex-direction: column; gap: 0.6rem; }
        .capture-fab, .feedback-fab { bottom: 6rem; }
        .catalogo-popup .popup-card { padding: 1.2rem; border-radius: 1rem; }
      }
    `;
    document.head.appendChild(style);
  }

  // Executa quando DOM estiver pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
