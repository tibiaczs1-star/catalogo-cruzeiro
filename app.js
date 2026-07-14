(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CzsNewsApp = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const NEWS_ENDPOINT = "/api/news?limit=40&lite=1";
  const NEWS_POLL_ENDPOINT = "/api/news?limit=1&lite=1";
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
    return SAFE_SLUG.test(slug) ? `/noticia.html?slug=${encodeURIComponent(slug)}` : "/arquivo.html";
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

  function createStory(item, index) {
    const article = createElement("article", index === 0 ? "story lead-story" : "story");
    article.style.animationDelay = `${Math.min(index * 28, 220)}ms`;
    const link = createElement("a", "story-link");
    link.href = getArticleHref(item);
    link.setAttribute("aria-label", `Ler: ${item.title}`);

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
    const tabs = Array.from(document.querySelectorAll(".feed-tab"));
    const editionDate = document.getElementById("editionDate");
    const search = document.getElementById("newsSearch");
    const categoryFilter = document.getElementById("categoryFilter");
    const filterStatus = document.getElementById("filterStatus");
    if (!feed || !status || !notice || !shell || !search || !categoryFilter || !filterStatus) return;

    let currentItems = [];
    let activeFilter = "all";

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
      shell.setAttribute("aria-busy", "false");
    }

    async function fetchNews({ polling = false } = {}) {
      try {
        const response = await fetch(polling ? NEWS_POLL_ENDPOINT : NEWS_ENDPOINT, { headers: { Accept: "application/json" }, cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const nextItems = normalizeNewsPayload(await response.json());
        if (!nextItems.length) throw new Error("empty-feed");
        const newItems = findNewItems(currentItems, nextItems);
        if (polling && newItems.length) {
          notice.hidden = false;
          return;
        }
        if (polling) return;
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

    tabs.forEach((tab) => tab.addEventListener("click", () => {
      activeFilter = tab.dataset.filter || "all";
      tabs.forEach((item) => {
        const selected = item === tab;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      render();
    }));

    search.addEventListener("input", render);
    categoryFilter.addEventListener("change", render);

    notice.addEventListener("click", async () => {
      notice.hidden = true;
      await fetchNews();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    fetchNews();
    window.setInterval(() => {
      if (document.visibilityState === "visible") fetchNews({ polling: true });
    }, POLL_INTERVAL_MS);
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startBrowserApp, { once: true });
    else startBrowserApp();
  }

  return { NEWS_ENDPOINT, NEWS_POLL_ENDPOINT, normalizeNewsPayload, getArticleHref, hasPlayableVideo, findNewItems, filterNewsItems };
});
