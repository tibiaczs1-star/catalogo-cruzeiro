(function () {
  const API_URL = "./api/news?limit=24&lite=1";
  const FALLBACK_IMAGE = "./assets/og-cover.svg";

  const $ = (selector) => document.querySelector(selector);
  const liveStatus = $("#liveStatus");
  const leadImage = $("[data-lead-image]");
  const leadTitle = $("[data-lead-title]");
  const leadSummary = $("[data-lead-summary]");
  const leadSource = $("[data-lead-source]");
  const leadTime = $("[data-lead-time]");
  const leadLinks = document.querySelectorAll("[data-lead-link], [data-lead-read], [data-hero-link]");
  const liveList = $("[data-live-list]");
  const newsGrid = $("[data-news-grid]");
  const dominantTitle = $("#dominant-title");
  const dominantSummary = $("[data-dominant-summary]");

  function cleanText(value, fallback) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text || fallback;
  }

  function articleHref(article) {
    const slug = cleanText(article.slug || article.id, "");
    if (!slug) return "./index.html?skipIntro=1";
    return `./noticia.html?slug=${encodeURIComponent(slug)}`;
  }

  function articleImage(article) {
    return (
      article.image ||
      article.imageUrl ||
      article.coverImage ||
      article.thumbnail ||
      article.photo ||
      FALLBACK_IMAGE
    );
  }

  function articleSource(article) {
    return cleanText(article.sourceName || article.source || article.editorialSource, "CZS");
  }

  function articleTime(article) {
    const raw = article.publishedAt || article.updatedAt || article.createdAt || article.date;
    if (!raw) return "Agora";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "Agora";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function summarize(article) {
    return cleanText(
      article.summary || article.excerpt || article.lede || article.description,
      "Leia o resumo, confira a fonte e acompanhe as próximas atualizações."
    );
  }

  function normalizePayload(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.news)) return payload.news;
    if (Array.isArray(payload?.articles)) return payload.articles;
    return [];
  }

  function renderLead(article) {
    const title = cleanText(article.title || article.headline, "Atualização local");
    const href = articleHref(article);
    leadImage.src = articleImage(article);
    leadImage.alt = "";
    leadTitle.textContent = title;
    leadSummary.textContent = summarize(article);
    leadSource.textContent = articleSource(article);
    leadTime.textContent = articleTime(article);
    leadLinks.forEach((link) => {
      link.href = href;
    });
  }

  function renderLive(items) {
    liveList.textContent = "";
    items.slice(0, 4).forEach((article) => {
      const card = document.createElement("article");
      card.className = "czs-live-item";
      const time = document.createElement("time");
      time.textContent = articleTime(article);
      const title = document.createElement("strong");
      title.textContent = cleanText(article.title || article.headline, "Atualização local");
      const summary = document.createElement("p");
      summary.textContent = summarize(article);
      card.append(time, title, summary);
      card.addEventListener("click", () => {
        window.location.href = articleHref(article);
      });
      card.tabIndex = 0;
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter") window.location.href = articleHref(article);
      });
      liveList.appendChild(card);
    });
  }

  function renderGrid(items) {
    newsGrid.textContent = "";
    items.slice(0, 6).forEach((article) => {
      const card = document.createElement("a");
      card.className = "czs-news-card";
      card.href = articleHref(article);

      const image = document.createElement("img");
      image.src = articleImage(article);
      image.alt = "";
      image.loading = "lazy";

      const body = document.createElement("div");
      const source = document.createElement("small");
      source.textContent = articleSource(article);
      const title = document.createElement("h3");
      title.textContent = cleanText(article.title || article.headline, "Atualização local");
      const summary = document.createElement("p");
      summary.textContent = summarize(article);
      body.append(source, title, summary);
      card.append(image, body);
      newsGrid.appendChild(card);
    });
  }

  function renderDominant(items) {
    const local = items.find((article) => {
      const text = `${article.title || ""} ${article.summary || ""} ${article.source || ""}`.toLowerCase();
      return text.includes("cruzeiro") || text.includes("juruá") || text.includes("jurua") || text.includes("acre");
    }) || items[1] || items[0];

    if (!local) return;
    dominantTitle.textContent = cleanText(local.title || local.headline, "Acompanhe o tema local do dia");
    dominantSummary.textContent = summarize(local);
  }

  function render(items) {
    const usable = items.filter((item) => item && (item.title || item.headline));
    if (!usable.length) {
      liveStatus.textContent = "Radar local indisponível";
      return;
    }
    liveStatus.textContent = `${usable.length} atualizações conectadas ao site`;
    renderLead(usable[0]);
    renderLive(usable.slice(1));
    renderDominant(usable);
    renderGrid(usable.slice(2));
  }

  fetch(API_URL, { credentials: "same-origin" })
    .then((response) => (response.ok ? response.json() : null))
    .then((payload) => render(normalizePayload(payload)))
    .catch(() => {
      liveStatus.textContent = "Prévia carregada sem conexão com a API";
    });
})();
