(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CzsNewsApp = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const NEWS_ENDPOINT = "/api/news?limit=40&lite=1&sort=latest";
  const NEWS_POLL_ENDPOINT = "/api/news?limit=1&lite=1&sort=latest";
  const VIDEO_NEWS_ENDPOINT = "/api/news?limit=40&lite=1&sort=latest&video=1";
  const NEWS_BATCH_SIZE = 40;
  const MAX_NEWS_LIMIT = 200;
  const POLL_INTERVAL_MS = 90 * 1000;
  const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  function text(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function normalizeNewsPayload(payload) {
    const items = Array.isArray(payload?.items) ? payload.items : [];
    return items.filter(Boolean).map((item) => ({
      ...item,
      id: text(item.id),
      slug: text(item.slug),
      title: text(item.title),
      summary: text(item.summary || item.lede),
      category: text(item.category || item.eyebrow || "Notícias"),
      publishedAt: text(item.publishedAt || item.date),
      imageUrl: text(item.imageUrl || item.feedImageUrl || item.sourceImageUrl),
      imageAlt: text(item.accessibility?.alt || item.title),
      videoUrl: text(item.videoUrl),
      media: item.media && typeof item.media === "object" ? item.media : null
    })).filter((item) => item.title && (item.slug || item.id));
  }

  function getArticleHref(item) {
    const slug = text(item?.slug).toLowerCase();
    return SAFE_SLUG.test(slug) ? `/app.html?slug=${encodeURIComponent(slug)}` : "";
  }

  function hasPlayableVideo(item) {
    const directUrl = text(item?.videoUrl);
    const mediaType = text(item?.media?.type).toLowerCase();
    const mediaUrl = text(item?.media?.url || item?.media?.src || item?.media?.videoUrl);
    return Boolean(directUrl || (mediaType === "video" && mediaUrl));
  }

  function itemKey(item) {
    return text(item?.id || item?.slug || item?.title).toLowerCase();
  }

  function findNewItems(previousItems, nextItems) {
    if (!Array.isArray(previousItems) || previousItems.length === 0) return [];
    const known = new Set(previousItems.map(itemKey).filter(Boolean));
    return (Array.isArray(nextItems) ? nextItems : []).filter((item) => {
      const key = itemKey(item);
      return key && !known.has(key);
    });
  }

  function normalizeSearch(value) {
    return text(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function filterNewsItems(items, options = {}) {
    const query = normalizeSearch(options.query);
    const category = normalizeSearch(options.category || "all");
    return (Array.isArray(items) ? items : []).filter((item) => {
      const matchesCategory = category === "all" || normalizeSearch(item?.category) === category;
      const haystack = normalizeSearch([item?.title, item?.summary, item?.category].filter(Boolean).join(" "));
      return matchesCategory && (!query || haystack.includes(query));
    });
  }

  function getNextNewsLimit(currentLimit) {
    const current = Math.max(NEWS_BATCH_SIZE, Number(currentLimit) || NEWS_BATCH_SIZE);
    return Math.min(MAX_NEWS_LIMIT, current + NEWS_BATCH_SIZE);
  }

  function getNewsEndpoint(limit) {
    const safeLimit = Math.max(1, Math.min(MAX_NEWS_LIMIT, Number(limit) || NEWS_BATCH_SIZE));
    return `/api/news?limit=${safeLimit}&lite=1&sort=latest`;
  }

  function formatDate(value) {
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) return text(value);
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(parsed);
  }

  function createElement(tag, className, content) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.textContent = content;
    return element;
  }

  function getSafeUrl(value) {
    const raw = text(value);
    if (!raw || typeof location === "undefined") return "";
    try {
      const parsed = new URL(raw, location.origin);
      return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "";
    } catch (_error) {
      return "";
    }
  }

  function createStory(item, index) {
    const article = createElement("article", index === 0 ? "story lead-story" : "story");
    article.style.animationDelay = `${Math.min(index * 28, 220)}ms`;
    const href = getArticleHref(item);
    const link = href ? createElement("a", "story-link") : createElement("div", "story-static");
    if (href) {
      link.href = href;
      link.setAttribute("aria-label", `Ler: ${item.title}`);
    }

    if (item.imageUrl) {
      const media = createElement("div", "story-media");
      const image = document.createElement("img");
      image.src = item.imageUrl;
      image.alt = item.imageAlt;
      image.loading = index < 2 ? "eager" : "lazy";
      image.decoding = "async";
      image.addEventListener("error", () => media.remove(), { once: true });
      media.appendChild(image);
      if (hasPlayableVideo(item)) media.appendChild(createElement("span", "video-badge", "Vídeo"));
      link.appendChild(media);
    }

    const copy = createElement("div", "story-copy");
    const label = createElement("div", "story-label");
    label.appendChild(document.createTextNode(item.category));
    const time = document.createElement("time");
    time.dateTime = item.publishedAt;
    time.textContent = formatDate(item.publishedAt);
    label.appendChild(time);
    copy.appendChild(label);
    copy.appendChild(createElement("h2", "", item.title));
    if (item.summary) copy.appendChild(createElement("p", "", item.summary));
    link.appendChild(copy);
    article.appendChild(link);
    return article;
  }

  function startBrowserApp() {
    const feed = document.getElementById("newsFeed");
    const status = document.getElementById("feedStatus");
    const notice = document.getElementById("newNewsNotice");
    const shell = document.querySelector(".feed-shell");
    const navButtons = Array.from(document.querySelectorAll(".bottom-nav button"));
    const editionDate = document.getElementById("editionDate");
    const search = document.getElementById("newsSearch");
    const categoryFilter = document.getElementById("categoryFilter");
    const filterStatus = document.getElementById("filterStatus");
    const feedTools = document.getElementById("feedTools");
    const categoryPanel = document.getElementById("categoryPanel");
    const searchPanel = document.getElementById("searchPanel");
    const loadMore = document.getElementById("loadMoreNews");
    const feedView = document.getElementById("feedView");
    const articleReader = document.getElementById("articleReader");
    const articleContent = document.getElementById("articleContent");
    const articleBack = document.getElementById("articleBack");
    if (!feed || !status || !notice || !shell || !search || !categoryFilter || !filterStatus || !feedTools || !categoryPanel || !searchPanel || !loadMore || !feedView || !articleReader || !articleContent || !articleBack) return;

    let currentItems = [];
    let activeFilter = "all";
    let loadedLimit = NEWS_BATCH_SIZE;
    let totalAvailable = NEWS_BATCH_SIZE;
    let openedFromFeed = false;
    let feedReadyPromise = null;

    function visibleItems() {
      const mediaItems = activeFilter === "video" ? currentItems.filter(hasPlayableVideo) : currentItems;
      return filterNewsItems(mediaItems, { query: search.value, category: categoryFilter.value });
    }

    function updateCategoryOptions() {
      const selected = categoryFilter.value;
      const categories = Array.from(new Set(currentItems.map((item) => item.category).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"));
      categoryFilter.replaceChildren(new Option("Todas", "all"));
      categories.forEach((category) => categoryFilter.appendChild(new Option(category, category)));
      categoryFilter.value = categories.includes(selected) ? selected : "all";
    }

    function render() {
      const items = visibleItems();
      feed.replaceChildren();
      if (!items.length) {
        status.hidden = false;
        status.textContent = search.value || categoryFilter.value !== "all"
          ? "Nenhuma notícia corresponde aos filtros."
          : activeFilter === "video" ? "Ainda não há vídeos nesta edição." : "Nenhuma notícia disponível agora.";
      } else {
        status.hidden = true;
        items.forEach((item, index) => feed.appendChild(createStory(item, index)));
      }
      filterStatus.textContent = `${items.length} ${items.length === 1 ? "notícia encontrada" : "notícias encontradas"}`;
      loadMore.hidden = currentItems.length >= Math.min(totalAvailable, MAX_NEWS_LIMIT) || loadedLimit >= MAX_NEWS_LIMIT;
      shell.setAttribute("aria-busy", "false");
    }

    async function fetchNews({ polling = false, limit = loadedLimit } = {}) {
      try {
        const response = await fetch(polling ? NEWS_POLL_ENDPOINT : getNewsEndpoint(limit), { headers: { Accept: "application/json" }, cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        const nextItems = normalizeNewsPayload(payload);
        if (!nextItems.length) throw new Error("empty-feed");
        const newItems = findNewItems(currentItems, nextItems);
        if (polling && newItems.length) {
          notice.hidden = false;
          return;
        }
        if (polling) return;
        loadedLimit = Math.max(NEWS_BATCH_SIZE, Math.min(MAX_NEWS_LIMIT, Number(limit) || NEWS_BATCH_SIZE));
        totalAvailable = Math.max(nextItems.length, Number(payload.total || payload.archiveTotal || nextItems.length));
        currentItems = nextItems;
        updateCategoryOptions();
        editionDate.textContent = `Atualizado ${formatDate(nextItems[0].publishedAt)}`;
        render();
      } catch (_error) {
        if (polling || currentItems.length) return;
        shell.setAttribute("aria-busy", "false");
        status.replaceChildren();
        status.appendChild(document.createTextNode("Não foi possível carregar as notícias."));
        const retry = createElement("button", "", "Tentar novamente");
        retry.type = "button";
        retry.addEventListener("click", () => {
          status.innerHTML = '<span class="loading-line"></span><span class="loading-line short"></span>';
          shell.setAttribute("aria-busy", "true");
          fetchNews();
        });
        status.appendChild(retry);
      }
    }

    function ensureFeed() {
      if (currentItems.length && activeFilter === "all") return Promise.resolve();
      if (!feedReadyPromise) {
        feedReadyPromise = fetchNews({ limit: loadedLimit }).finally(() => {
          feedReadyPromise = null;
        });
      }
      return feedReadyPromise;
    }

    async function fetchVideoNews() {
      shell.setAttribute("aria-busy", "true");
      status.hidden = false;
      status.textContent = "Carregando vídeos…";
      try {
        const response = await fetch(VIDEO_NEWS_ENDPOINT, { headers: { Accept: "application/json" }, cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        currentItems = normalizeNewsPayload(payload);
        loadedLimit = NEWS_BATCH_SIZE;
        totalAvailable = currentItems.length;
        updateCategoryOptions();
        render();
      } catch (_error) {
        currentItems = [];
        render();
      }
    }

    function renderArticle(item) {
      articleContent.replaceChildren();
      articleContent.className = "article-content";
      const label = createElement("div", "story-label");
      label.appendChild(document.createTextNode(text(item.category || item.eyebrow || "Notícias")));
      const time = document.createElement("time");
      time.dateTime = text(item.publishedAt || item.date);
      time.textContent = formatDate(item.publishedAt || item.date);
      label.appendChild(time);
      articleContent.appendChild(label);
      articleContent.appendChild(createElement("h1", "", text(item.title || "Notícia")));

      const imageUrl = getSafeUrl(item.imageUrl || item.feedImageUrl || item.sourceImageUrl);
      if (imageUrl) {
        const image = document.createElement("img");
        image.className = "article-image";
        image.src = imageUrl;
        image.alt = text(item.accessibility?.alt || item.title);
        image.decoding = "async";
        articleContent.appendChild(image);
      }

      const videoUrl = getSafeUrl(item.videoUrl || item.media?.url || item.media?.src || item.media?.videoUrl);
      if (videoUrl) {
        const video = document.createElement("video");
        video.src = videoUrl;
        video.controls = true;
        video.preload = "metadata";
        video.playsInline = true;
        articleContent.appendChild(video);
      }

      const summary = text(item.lede || item.summary);
      if (summary) articleContent.appendChild(createElement("p", "article-lede", summary));
      const body = Array.isArray(item.body) ? item.body : Array.isArray(item.development) ? item.development : [];
      if (body.length) {
        const bodyElement = createElement("div", "article-body");
        body.map(text).filter(Boolean).forEach((paragraph) => bodyElement.appendChild(createElement("p", "", paragraph)));
        articleContent.appendChild(bodyElement);
      }

      const sourceUrl = getSafeUrl(item.sourceUrl);
      if (sourceUrl) {
        const source = createElement("a", "article-source", `Fonte: ${text(item.sourceName || "original")}`);
        source.href = sourceUrl;
        source.target = "_blank";
        source.rel = "noopener noreferrer";
        articleContent.appendChild(source);
      }
      articleContent.focus();
    }

    async function openArticle(slug) {
      if (!SAFE_SLUG.test(slug)) return;
      feedView.hidden = true;
      articleReader.hidden = false;
      articleContent.className = "article-error";
      articleContent.textContent = "Carregando matéria…";
      window.scrollTo({ top: 0, behavior: "instant" });
      try {
        const response = await fetch(`/api/news/${encodeURIComponent(slug)}`, { headers: { Accept: "application/json" }, cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        renderArticle(payload.item || {});
        document.title = `${text(payload.item?.title || "Notícia")} — Catálogo CZS`;
      } catch (_error) {
        articleContent.className = "article-error";
        articleContent.textContent = "Não foi possível abrir esta matéria.";
        articleContent.focus();
      }
    }

    function showFeed({ updateUrl = false } = {}) {
      articleReader.hidden = true;
      feedView.hidden = false;
      document.title = "Catálogo CZS — Notícias do Juruá";
      if (updateUrl) history.replaceState({}, "", "/app.html");
    }

    function closeToolPanels() {
      categoryPanel.hidden = true;
      searchPanel.hidden = true;
      feedTools.hidden = true;
      navButtons.forEach((button) => {
        if (button.hasAttribute("aria-expanded")) button.setAttribute("aria-expanded", "false");
      });
    }

    async function setPrimaryDestination(destination) {
      activeFilter = destination === "video" ? "video" : "all";
      navButtons.forEach((button) => {
        if (!button.hasAttribute("aria-current")) return;
        button.setAttribute("aria-current", button.dataset.destination === destination ? "page" : "false");
      });
      closeToolPanels();
      showFeed({ updateUrl: true });
      if (destination === "video") await fetchVideoNews();
      else await fetchNews({ limit: loadedLimit });
    }

    function toggleTool(destination) {
      const targetPanel = destination === "categories" ? categoryPanel : searchPanel;
      const targetButton = navButtons.find((button) => button.dataset.destination === destination);
      const willOpen = targetPanel.hidden;
      closeToolPanels();
      if (!willOpen || !targetButton) return;
      feedTools.hidden = false;
      targetPanel.hidden = false;
      targetButton.setAttribute("aria-expanded", "true");
      if (destination === "search") search.focus();
      else categoryFilter.focus();
    }

    navButtons.forEach((button) => button.addEventListener("click", () => {
      const destination = button.dataset.destination;
      if (destination === "latest" || destination === "video") setPrimaryDestination(destination);
      else if (destination === "categories" || destination === "search") toggleTool(destination);
    }));

    search.addEventListener("input", render);
    categoryFilter.addEventListener("change", render);
    loadMore.addEventListener("click", async () => {
      const nextLimit = getNextNewsLimit(loadedLimit);
      loadMore.disabled = true;
      loadMore.setAttribute("aria-busy", "true");
      await fetchNews({ limit: nextLimit });
      loadMore.disabled = false;
      loadMore.setAttribute("aria-busy", "false");
    });

    notice.addEventListener("click", async () => {
      notice.hidden = true;
      await fetchNews();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    feed.addEventListener("click", (event) => {
      const link = event.target.closest(".story-link");
      if (!link) return;
      const slug = new URL(link.href, location.origin).searchParams.get("slug") || "";
      if (!SAFE_SLUG.test(slug)) return;
      event.preventDefault();
      openedFromFeed = true;
      history.pushState({ article: true }, "", getArticleHref({ slug }));
      openArticle(slug);
    });

    articleBack.addEventListener("click", async () => {
      if (openedFromFeed) history.back();
      else {
        if (!currentItems.length) await ensureFeed();
        showFeed({ updateUrl: true });
      }
    });

    window.addEventListener("popstate", () => {
      const slug = new URLSearchParams(location.search).get("slug") || "";
      if (SAFE_SLUG.test(slug)) openArticle(slug);
      else {
        openedFromFeed = false;
        showFeed();
      }
    });

    const initialSlug = new URLSearchParams(location.search).get("slug") || "";
    if (SAFE_SLUG.test(initialSlug)) {
      ensureFeed();
      openArticle(initialSlug);
    } else ensureFeed();
    window.setInterval(() => {
      if (document.visibilityState === "visible") fetchNews({ polling: true });
    }, POLL_INTERVAL_MS);
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startBrowserApp, { once: true });
    else startBrowserApp();
  }

  return { NEWS_ENDPOINT, NEWS_POLL_ENDPOINT, VIDEO_NEWS_ENDPOINT, normalizeNewsPayload, getArticleHref, hasPlayableVideo, findNewItems, filterNewsItems, getNextNewsLimit };
});
