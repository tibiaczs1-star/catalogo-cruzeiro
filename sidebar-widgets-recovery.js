(() => {
  const localeTimeZone = "America/Rio_Branco";

  const ready = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  };

  const normalizeText = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const escapeAttribute = (value) => escapeHtml(value);
  const isExternalUrl = (value) => /^https?:\/\//i.test(String(value || ""));
  const getLinkAttrs = (href) => (isExternalUrl(href) ? ' target="_blank" rel="noreferrer"' : "");

  const getSidebarNodes = () => ({
    now: document.querySelector("#sidebar-now"),
    holidays: document.querySelector("#sidebar-holidays"),
    national: document.querySelector("#sidebar-national"),
    politics: document.querySelector("#sidebar-politics"),
    market: document.querySelector("#sidebar-market"),
    agenda: document.querySelector("#sidebar-agenda"),
    world: document.querySelector("#sidebar-world"),
    varieties: document.querySelector("#sidebar-varieties"),
    famous: document.querySelector("#sidebar-famous"),
    buzz: document.querySelector("#sidebar-buzz"),
    popular: document.querySelector("#sidebar-popular"),
    commercial: document.querySelector("#sidebar-commercial"),
    ads: document.querySelector("#sidebar-ads")
  });

  const hasRenderedContent = (node) =>
    Boolean(node?.querySelector(".widget-title, .sidebar-heading, .card-kicker, .sidebar-photo-card"));

  const getNewsMap = () => {
    const items = Array.isArray(window.NEWS_DATA) ? window.NEWS_DATA : [];
    return Object.fromEntries(
      items
        .filter((item) => item && item.slug)
        .map((item) => [item.slug, item])
    );
  };

  const getSidebarWeatherIcon = (condition) => {
    const normalized = normalizeText(condition);

    if (normalized.includes("trovoada") || normalized.includes("tempestade")) return "⛈";
    if (normalized.includes("chuva")) return "🌧";
    if (normalized.includes("nuv")) return "☁";
    return "☀";
  };

  const getLocalTodayIso = () => {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: localeTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });

    return formatter.format(new Date());
  };

  const getNextHolidayText = (holidayGroups = []) => {
    const todayIso = getLocalTodayIso();
    const todayMs = Date.parse(`${todayIso}T12:00:00Z`);
    const upcoming = holidayGroups
      .flat()
      .filter((holiday) => holiday.isoDate >= todayIso)
      .sort((left, right) => left.isoDate.localeCompare(right.isoDate))[0];

    if (!upcoming) {
      return "Sem feriado futuro cadastrado no radar local.";
    }

    const holidayMs = Date.parse(`${upcoming.isoDate}T12:00:00Z`);
    const diffDays = Math.round((holidayMs - todayMs) / 86400000);
    const plural = diffDays === 1 ? "" : "s";

    return `Proximo feriado no radar: ${upcoming.name} em ${diffDays} dia${plural}.`;
  };

  const buildHolidayMarkup = (holidays = []) =>
    holidays
      .map(
        (holiday) => `
          <div class="holiday-item">
            <div>
              <span class="holiday-date">${escapeHtml(holiday.shortDate)}</span>
              <span class="holiday-weekday">${escapeHtml(holiday.weekday)}</span>
            </div>
            <div>
              <span class="holiday-name">${escapeHtml(holiday.name)}</span>
              ${holiday.scope ? `<small>${escapeHtml(holiday.scope)}</small>` : ""}
            </div>
          </div>
        `
      )
      .join("");

  const resolveArticleHref = (item, article) => {
    if (article?.slug) return `./noticia.html?slug=${encodeURIComponent(article.slug)}`;
    if (item?.slug) return `./noticia.html?slug=${encodeURIComponent(item.slug)}`;
    return item?.url || "./index.html";
  };

  const buildAgendaMarkup = (items = [], newsMap = {}) =>
    items
      .map((item) => {
        const article = item.slug ? newsMap[item.slug] : null;
        const href = resolveArticleHref(item, article);
        const title = article?.title || item.title || "Atualizacao";
        const sourceName = article?.sourceName || item.sourceName || "Fonte local";
        const meta = item.meta || article?.sourceLabel || "";

        return `
          <a class="sidebar-list-item" href="${escapeAttribute(href)}"${getLinkAttrs(href)}>
            <div class="sidebar-list-head">
              <span class="rail-pill">${escapeHtml(item.tag || "local")}</span>
              <strong>${escapeHtml(item.dateLabel || "agora")}</strong>
            </div>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(meta)}</p>
            <small>Fonte: ${escapeHtml(sourceName)}</small>
          </a>
        `;
      })
      .join("");

  const buildStoryMarkup = (items = [], newsMap = {}) =>
    items
      .map((item) => {
        const article = newsMap[item.slug];
        if (!article) return "";

        const href = `./noticia.html?slug=${encodeURIComponent(article.slug)}`;
        const photoStyle = article.imageUrl
          ? ` style="--story-photo:url('${String(article.imageUrl).replace(/'/g, "%27")}')"`
          : "";

        return `
          <a class="sidebar-photo-card" href="${href}"${photoStyle}>
            <div class="sidebar-photo-copy">
              <span>${escapeHtml(item.kicker || "destaque")}</span>
              <strong>${escapeHtml(article.title || "Atualizacao")}</strong>
              <small>${escapeHtml(item.stat || "")} • ${escapeHtml(article.sourceName || "Fonte local")}</small>
            </div>
          </a>
        `;
      })
      .join("");

  const buildListPanelMarkup = ({
    title,
    source,
    items,
    newsMap,
    actionLabel,
    actionUrl,
    passiveLabel = "recorte real"
  }) => {
    const actionMarkup = actionUrl
      ? `<a class="widget-link" href="${escapeAttribute(actionUrl)}"${getLinkAttrs(actionUrl)}>${escapeHtml(actionLabel || "abrir")}</a>`
      : `<span class="widget-link passive-link">${escapeHtml(passiveLabel)}</span>`;

    return `
      <div class="sidebar-heading">
        <div>
          <p class="widget-title">${escapeHtml(title)}</p>
          <span class="widget-source">${escapeHtml(source)}</span>
        </div>
        ${actionMarkup}
      </div>
      <div class="sidebar-list">
        ${buildAgendaMarkup(items, newsMap)}
      </div>
    `;
  };

  const buildMarketMarkup = (market, newsMap) => `
    <div class="sidebar-heading">
      <div>
        <p class="widget-title">Radar de Bolsa</p>
        <span class="widget-source">${escapeHtml(market.snapshotLabel || "fechamento recente")}</span>
      </div>
      <a class="widget-link" href="${escapeAttribute(market.sourceUrl || "#")}"${getLinkAttrs(market.sourceUrl || "#")}>fechamento</a>
    </div>
    <div class="market-quote-row">
      ${(market.quotes || [])
        .map(
          (quote) => `
            <div class="market-quote">
              <span>${escapeHtml(quote.label)}</span>
              <strong>${escapeHtml(quote.value)}</strong>
              <small>${escapeHtml(quote.note)}</small>
            </div>
          `
        )
        .join("")}
    </div>
    <div class="market-grid">
      ${(market.moves || [])
        .map(
          (item) => `
            <a class="market-move" href="${escapeAttribute(item.url || "#")}"${getLinkAttrs(item.url || "#")}>
              <div class="market-head">
                <span class="market-bias ${escapeHtml(item.bias || "mixed")}">${escapeHtml(item.badge || "misto")}</span>
                <strong>${escapeHtml(item.label || "mercado")}</strong>
              </div>
              <h3>${escapeHtml(item.title || "Atualizacao")}</h3>
              <p>${escapeHtml(item.summary || "")}</p>
              <small>Base: ${escapeHtml(item.sourceName || "Fonte local")}</small>
            </a>
          `
        )
        .join("")}
    </div>
    ${
      market.opinionTitle || market.opinionText
        ? `<div class="market-opinion">
            ${market.opinionTitle ? `<p class="widget-kicker">${escapeHtml(market.opinionTitle)}</p>` : ""}
            ${market.opinionText ? `<p>${escapeHtml(market.opinionText)}</p>` : ""}
          </div>`
        : ""
    }
    <div class="sidebar-list compact-list">
      ${buildAgendaMarkup(market.pocketTips || [], newsMap)}
    </div>
  `;

  const renderClock = () => {
    const clockNode = document.querySelector("#live-clock");
    const dateNode = document.querySelector("#live-date");
    const weekdayNode = document.querySelector("#live-weekday");
    if (!clockNode && !dateNode && !weekdayNode) return;

    const update = () => {
      const now = new Date();

      if (clockNode) {
        clockNode.textContent = now.toLocaleTimeString("pt-BR", {
          hour12: false,
          timeZone: localeTimeZone
        });
      }

      if (dateNode) {
        dateNode.textContent = now.toLocaleDateString("pt-BR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: localeTimeZone
        });
      }

      if (weekdayNode) {
        weekdayNode.textContent = now.toLocaleDateString("pt-BR", {
          weekday: "long",
          timeZone: localeTimeZone
        });
      }
    };

    update();
    if (!window.__sidebarRecoveryClockBound) {
      window.__sidebarRecoveryClockBound = true;
      setInterval(update, 1000);
    }
  };

  const renderSidebarRecovery = () => {
    const sidebarData = window.SIDEBAR_DATA;
    if (!sidebarData) return;

    const nodes = getSidebarNodes();
    if (!(nodes.now instanceof HTMLElement)) return;

    const visibleNodes = Object.values(nodes).filter((node) => node instanceof HTMLElement);
    const needsRecovery = visibleNodes.some((node) => !hasRenderedContent(node));
    if (!needsRecovery) {
      renderClock();
      return;
    }

    const newsMap = getNewsMap();
    const nextHolidayText = getNextHolidayText([
      sidebarData.holidays?.national || [],
      sidebarData.holidays?.local || []
    ]);
    const weather = sidebarData.weather || { current: { details: [] } };
    const weatherIcon = getSidebarWeatherIcon(weather.current?.condition || "");

    nodes.now.innerHTML = `
      <div class="rail-intro">
        <p class="rail-kicker">terceira coluna</p>
        <h3>Painel Local</h3>
        <p>Relogio, clima, feriados, agenda, buzz da rede e espaco comercial no mesmo trilho.</p>
      </div>
      <div class="sidebar-heading">
        <div>
          <p class="widget-title">Cruzeiro do Sul Agora</p>
          <span class="widget-source">snapshot ${escapeHtml(sidebarData.snapshotDate || "agora")}</span>
        </div>
        <a class="widget-link" href="${escapeAttribute(weather.sourceUrl || "#")}"${getLinkAttrs(weather.sourceUrl || "#")}>clima real</a>
      </div>
      <div class="sidebar-now-grid">
        <div>
          <div class="clock-time" id="live-clock">00:00:00</div>
          <div class="clock-date" id="live-date">hora local do Acre</div>
          <div class="clock-weekday" id="live-weekday">Acre • UTC-5</div>
        </div>
        <div class="sidebar-weather-badge">
          <span class="weather-icon">${weatherIcon}</span>
          <div>
            <strong class="weather-temp">${escapeHtml(weather.current?.temperature || "--")}</strong>
            <p class="weather-summary">${escapeHtml(weather.current?.condition || "Sem leitura")}</p>
          </div>
        </div>
      </div>
      <div class="weather-details">
        ${(weather.current?.details || []).map((detail) => `<span>${escapeHtml(detail)}</span>`).join("")}
      </div>
      <p class="widget-note">${escapeHtml(weather.note || "")} ${escapeHtml(weather.observedAt || "")}. ${escapeHtml(weather.tonight || "")}</p>
      <p class="widget-note">${escapeHtml(nextHolidayText)}</p>
      <label class="sidebar-search-inline">
        <span>Buscar no portal</span>
        <input type="text" id="sidebar-search" placeholder="cheia, escola, policia, cultura..." />
      </label>
    `;

    if (nodes.holidays) {
      nodes.holidays.innerHTML = `
      <div class="sidebar-heading">
        <div>
          <p class="widget-title">Feriados no Radar</p>
          <span class="widget-source">nacional + Acre + municipio</span>
        </div>
        <a class="widget-link" href="${escapeAttribute(sidebarData.holidays?.sourceUrl || "#")}"${getLinkAttrs(sidebarData.holidays?.sourceUrl || "#")}>fonte oficial</a>
      </div>
      <div class="holiday-columns">
        <section>
          <p class="widget-kicker">nacionais</p>
          <div class="holiday-list">
            ${buildHolidayMarkup(sidebarData.holidays?.national || [])}
          </div>
        </section>
        <section>
          <p class="widget-kicker">locais e regionais</p>
          <div class="holiday-list">
            ${buildHolidayMarkup(sidebarData.holidays?.local || [])}
          </div>
        </section>
      </div>
    `;
    }

    if (nodes.national) {
      nodes.national.innerHTML = buildListPanelMarkup({
        title: "Nacional do Dia",
        source: "servico, consumo e custo de vida no radar",
        items: sidebarData.national || [],
        newsMap,
        actionLabel: "economia",
        actionUrl: "https://agenciabrasil.ebc.com.br/economia"
      });
    }

    if (nodes.politics) {
      nodes.politics.innerHTML = buildListPanelMarkup({
        title: "Politica",
        source: "Brasilia, eleicoes e mudancas de equipe",
        items: sidebarData.politics || [],
        newsMap,
        actionLabel: "politica",
        actionUrl: "https://agenciabrasil.ebc.com.br/politica"
      });
    }

    if (nodes.market) {
      nodes.market.innerHTML = buildMarketMarkup(sidebarData.market || {}, newsMap);
    }

    if (nodes.agenda) {
      nodes.agenda.innerHTML = buildListPanelMarkup({
        title: "Agenda & Servico",
        source: "acoes uteis com data certa",
        items: sidebarData.agenda || [],
        newsMap
      });
    }

    if (nodes.world) {
      nodes.world.innerHTML = buildListPanelMarkup({
        title: "Internacional",
        source: "mundo, energia, juros e ciencia",
        items: sidebarData.world || [],
        newsMap,
        actionLabel: "mundo",
        actionUrl: "https://agenciabrasil.ebc.com.br/internacional"
      });
    }

    if (nodes.varieties) {
      nodes.varieties.innerHTML = buildListPanelMarkup({
        title: "Variedades",
        source: "cinema, museu, cultura e conversa",
        items: sidebarData.varieties || [],
        newsMap,
        actionLabel: "cultura",
        actionUrl: "https://agenciabrasil.ebc.com.br/cultura"
      });
    }

    if (nodes.famous) {
      nodes.famous.innerHTML = buildListPanelMarkup({
        title: "Famosos",
        source: "pop, relacionamento e bastidor",
        items: sidebarData.famous || [],
        newsMap,
        actionLabel: "gshow",
        actionUrl: "https://gshow.globo.com/cultura-pop/famosos/"
      });
    }

    if (nodes.buzz) {
      nodes.buzz.innerHTML = `
      <div class="sidebar-heading">
        <div>
          <p class="widget-title">Rede, Festas & Fofoca</p>
          <span class="widget-source">o que circula na conversa local</span>
        </div>
        <span class="widget-link passive-link">com foto quando houver</span>
      </div>
      <div class="sidebar-photo-list">
        ${buildStoryMarkup(sidebarData.buzz || [], newsMap)}
      </div>
    `;
    }

    if (nodes.popular) {
      nodes.popular.innerHTML = `
      <div class="sidebar-heading">
        <div>
          <p class="widget-title">Mais vistos do Catálogo</p>
          <span class="widget-source">destaques recentes</span>
        </div>
        <span class="widget-link passive-link">atalhos rápidos</span>
      </div>
      <div class="sidebar-photo-list compact">
        ${buildStoryMarkup(sidebarData.popular || [], newsMap)}
      </div>
    `;
    }

    if (nodes.commercial) {
      nodes.commercial.innerHTML = `
      <p class="card-kicker">publicidade local</p>
      <h3>Anúncio premium, publieditorial e agenda paga</h3>
      <p>
        Divulgue evento, festa, curso, clínica, loja, campanha e serviço
        com chamada forte e boa permanência em tela.
      </p>
      <div class="side-pill-row">
        <span class="rail-pill">300 x 600</span>
        <span class="rail-pill">post patrocinado</span>
        <span class="rail-pill">agenda local</span>
      </div>
      <a class="solid-button" href="#monetizacao">Reservar a lateral</a>
    `;
    }

    if (nodes.ads) {
      nodes.ads.innerHTML = `
      <p class="card-kicker">anúncios e divulgação</p>
      <h3>Espaços prontos para vender</h3>
      <div class="sidebar-ad-grid">
        <a class="ad-slot tall" href="#monetizacao">
          <span>300 x 600</span>
          <strong>Anúncio vertical premium</strong>
          <small>campanha fixa ao lado da leitura</small>
        </a>
        <a class="ad-slot" href="#monetizacao">
          <span>agenda patrocinada</span>
          <strong>Evento com data, local e chamada</strong>
          <small>festa, show, encontro ou promoção</small>
        </a>
        <a class="ad-slot" href="#monetizacao">
          <span>vitrine local</span>
          <strong>Guia rápido de marcas e serviços</strong>
          <small>entrada enxuta com selo parceiro</small>
        </a>
      </div>
    `;
    }

    document.querySelectorAll(".side-rail .reveal").forEach((node) => node.classList.add("active"));
    renderClock();
  };

  ready(() => {
    let attempts = 0;
    const run = () => {
      attempts += 1;
      renderSidebarRecovery();
      if (attempts >= 6) return;
      setTimeout(run, 700);
    };

    run();
    window.addEventListener("load", renderSidebarRecovery, { once: true });
    window.addEventListener("catalogo:intro-finished", renderSidebarRecovery);
  });
})();
