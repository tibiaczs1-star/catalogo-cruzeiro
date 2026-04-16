"use strict";

(function () {
  const configuredPageSize = Number(document.body?.dataset?.archivePageSize || 6);
  const pageSize = Number.isFinite(configuredPageSize) && configuredPageSize > 0 ? configuredPageSize : 6;
  const localeTimeZone = "America/Rio_Branco";
  const categoryAliases = {
    cotidiano: ["cotidiano"],
    prefeitura: ["prefeitura", "politica", "utilidade publica", "gestao publica"],
    politica: ["politica", "prefeitura", "utilidade publica", "gestao publica"],
    policia: ["policia", "seguranca"],
    saude: ["saude"],
    educacao: ["educacao"]
  };
  const previewClassByCategory = {
    cotidiano: "thumb-cheia",
    saude: "thumb-saude",
    negocios: "thumb-pascoa",
    policia: "thumb-policia",
    educacao: "thumb-educacao",
    prefeitura: "thumb-politica",
    "utilidade publica": "thumb-alerta",
    "festas & social": "thumb-social",
    social: "thumb-social",
    cultura: "thumb-cultura"
  };
  const monthIndex = {
    janeiro: 0,
    fevereiro: 1,
    marco: 2,
    abril: 3,
    maio: 4,
    junho: 5,
    julho: 6,
    agosto: 7,
    setembro: 8,
    outubro: 9,
    novembro: 10,
    dezembro: 11
  };
  const state = {
    items: [],
    activeCategory: "",
    visibleItems: pageSize,
    ownsRendering: false,
    initialQueryApplied: false
  };

  const normalizeText = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const slugifyText = (value) =>
    normalizeText(value)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const escapeAttribute = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const sanitizeImageUrl = (value) => {
    const cleanValue = String(value || "")
      .replace(/\\\//g, "/")
      .replace(/&amp;/gi, "&")
      .trim();

    if (!cleanValue) {
      return "";
    }

    try {
      const parsed = new URL(cleanValue, window.location.href);
      if (!/^https?:$/i.test(parsed.protocol)) {
        return "";
      }
      return parsed.toString();
    } catch (_error) {
      return "";
    }
  };

  const extractImageUrlFromText = (value, baseUrl = "") => {
    const raw = String(value || "")
      .replace(/\\(["'])/g, "$1")
      .replace(/<!\[CDATA\[(.*?)\]\]>/gis, "$1");

    if (!raw) {
      return "";
    }

    const directPatterns = [
      /data-large-file=["']([^"']+)["']/i,
      /data-medium-file=["']([^"']+)["']/i,
      /<img[^>]+src=["']([^"']+)["']/i,
      /<enclosure[^>]+url=["']([^"']+)["']/i,
      /https?:\/\/[^\s"'<>]+?\.(?:avif|gif|jpe?g|png|webp)(?:\?[^\s"'<>]*)?/i
    ];

    for (const pattern of directPatterns) {
      const match = raw.match(pattern);
      if (!match?.[1] && !match?.[0]) {
        continue;
      }

      const candidate = match[1] || match[0];
      try {
        const resolved = new URL(candidate, baseUrl || window.location.href).toString();
        const safeUrl = sanitizeImageUrl(resolved);
        if (safeUrl) {
          return safeUrl;
        }
      } catch (_error) {
        const safeUrl = sanitizeImageUrl(candidate);
        if (safeUrl) {
          return safeUrl;
        }
      }
    }

    const srcSetMatch = raw.match(/srcset=["']([^"']+)["']/i);
    if (srcSetMatch?.[1]) {
      const firstSource = srcSetMatch[1]
        .split(",")
        .map((entry) => entry.trim().split(/\s+/)[0])
        .find(Boolean);

      if (firstSource) {
        return extractImageUrlFromText(firstSource, baseUrl);
      }
    }

    return "";
  };

  const extractInlineArticleImage = (article = {}) => {
    const baseUrl = article.sourceUrl || article.url || article.link || "";
    const candidates = [
      article.imageUrl,
      article.image,
      article.media?.imageUrl,
      article.media?.image,
      article.media?.src,
      article.media?.url,
      article.summary,
      article.lede,
      article.description,
      Array.isArray(article.body) ? article.body.join(" ") : "",
      Array.isArray(article.highlights) ? article.highlights.join(" ") : ""
    ];

    for (const candidate of candidates) {
      const imageUrl = extractImageUrlFromText(candidate, baseUrl);
      if (imageUrl) {
        return imageUrl;
      }
    }

    return "";
  };

  const formatDisplayDate = (value) => {
    if (!value) {
      return "Sem data";
    }

    if (typeof value === "string" && !/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return String(value);
    }

    return parsed.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: localeTimeZone
    });
  };

  const parseArticleDate = (value) => {
    const normalized = normalizeText(value).replace("º", "");
    const match = normalized.match(/(\d{1,2}) de ([a-z]+) de (\d{4})/);

    if (!match) {
      return 0;
    }

    const [, day, month, year] = match;
    return new Date(Number(year), monthIndex[month] ?? 0, Number(day)).getTime();
  };

  const normalizeArticle = (article = {}) => {
    const title = String(article.title || article.sourceLabel || "Atualizacao");
    const category = String(article.category || "Geral");
    const sourceName = article.sourceName || article.source || article.sourceLabel || "Fonte local";
    const sourceUrl = article.sourceUrl || article.url || article.link || "#";
    const lede = article.lede || article.summary || article.description || "Sem resumo.";
    const slug = String(article.slug || slugifyText(title) || article.id || "").trim();
    const imageUrl = sanitizeImageUrl(
      article.sourceImageUrl || article.imageUrl || extractInlineArticleImage(article)
    );

    return {
      ...article,
      id: article.id || slug || sourceUrl || title,
      slug,
      title,
      category,
      previewClass:
        article.previewClass || previewClassByCategory[normalizeText(category)] || "thumb-servico",
      sourceName,
      sourceUrl,
      sourceLabel: article.sourceLabel || title,
      lede,
      date: formatDisplayDate(article.date || article.publishedAt || article.createdAt || ""),
      publishedAt: article.publishedAt || article.createdAt || article.date || "",
      imageUrl
    };
  };

  const getArticleKey = (article) => {
    const normalized = normalizeArticle(article);
    return (
      normalized.slug ||
      normalized.sourceUrl ||
      normalizeText([normalized.title, normalized.date, normalized.sourceName].join(" "))
    );
  };

  const getSortTimestamp = (article) =>
    Date.parse(article.publishedAt || article.createdAt || "") || parseArticleDate(article.date || "");

  const dedupeArticles = (items = []) => {
    const map = new Map();

    items.forEach((item) => {
      const normalized = normalizeArticle(item);
      const key = getArticleKey(normalized);
      if (key && !map.has(key)) {
        map.set(key, normalized);
      }
    });

    return [...map.values()].sort((left, right) => {
      const dateDiff = getSortTimestamp(right) - getSortTimestamp(left);
      if (dateDiff !== 0) {
        return dateDiff;
      }

      return String(left.title || "").localeCompare(String(right.title || ""), "pt-BR");
    });
  };

  const getSearchTerms = (query = "") =>
    [...new Set(normalizeText(query).split(/\s+/).filter(Boolean))];

  const getQueryScore = (article, query = "") => {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) {
      return 0;
    }

    const normalizedArticle = normalizeArticle(article);
    const title = normalizeText(normalizedArticle.title);
    const lede = normalizeText(normalizedArticle.lede);
    const category = normalizeText(normalizedArticle.category);
    const sourceName = normalizeText(normalizedArticle.sourceName);
    const sourceLabel = normalizeText(normalizedArticle.sourceLabel);
    const haystack = normalizeText([title, lede, category, sourceName, sourceLabel].join(" "));
    const terms = getSearchTerms(normalizedQuery);

    let score = 0;
    let matchedTerms = 0;

    if (title === normalizedQuery) score += 260;
    if (title.includes(normalizedQuery)) score += 140;
    if (sourceLabel.includes(normalizedQuery)) score += 84;
    if (category === normalizedQuery) score += 72;
    if (category.includes(normalizedQuery)) score += 34;
    if (sourceName.includes(normalizedQuery)) score += 28;
    if (lede.includes(normalizedQuery)) score += 40;
    if (haystack.includes(normalizedQuery)) score += 18;

    terms.forEach((term) => {
      let matched = false;

      if (title.includes(term)) {
        score += 42;
        matched = true;
      }

      if (sourceLabel.includes(term)) {
        score += 22;
        matched = true;
      }

      if (category.includes(term)) {
        score += 18;
        matched = true;
      }

      if (sourceName.includes(term)) {
        score += 14;
        matched = true;
      }

      if (lede.includes(term)) {
        score += 12;
        matched = true;
      }

      if (matched || haystack.includes(term)) {
        matchedTerms += 1;
      }
    });

    if (matchedTerms === terms.length && terms.length > 1) {
      score += 56;
    } else if (matchedTerms > 0) {
      score += matchedTerms * 8;
    }

    return score;
  };

  const getApiUrl = (path) => {
    if (typeof window.CATALOGO_API_BASE === "string" && window.CATALOGO_API_BASE) {
      return `${window.CATALOGO_API_BASE.replace(/\/$/, "")}${path}`;
    }

    return window.location.protocol.startsWith("http") ? path : `http://localhost:3000${path}`;
  };

  const resolveArticleImage = async (article = {}) => {
    const inlineImageUrl = sanitizeImageUrl(
      article.sourceImageUrl || article.imageUrl || extractInlineArticleImage(article)
    );

    if (inlineImageUrl) {
      return inlineImageUrl;
    }

    return "";
  };

  const paintSurfaceImage = (node, url, position = "center", size = "cover") => {
    if (!node || !url) {
      return;
    }

    node.style.setProperty("--bg-image", `url('${url}')`);
    node.style.setProperty("--news-photo", `url('${url}')`);
    node.style.setProperty("--bg-position", position);
    node.style.setProperty("--bg-size", size);
    node.style.setProperty("background-image", `url('${url}')`, "important");
    node.style.setProperty("background-position", position, "important");
    node.style.setProperty("background-size", size, "important");
    node.style.setProperty("background-repeat", "no-repeat", "important");
  };

  const applyThumbImage = (thumbNode, article = {}) => {
    if (!thumbNode) {
      return;
    }

    resolveArticleImage(article).then((safeUrl) => {
      if (!safeUrl) {
        return;
      }

      const preloader = new Image();
      preloader.onload = () => {
        paintSurfaceImage(
          thumbNode,
          safeUrl,
          article.imageFocus || "center",
          article.imageFit || "cover"
        );
        thumbNode.dataset.imageUrl = safeUrl;
        thumbNode.dataset.sourceImage = safeUrl;
        thumbNode.classList.add("has-photo", "has-real-photo");

        const photoCard = thumbNode.closest(".news-card, .archive-card, .live-feed-card, .feed-card");
        if (photoCard) {
          photoCard.classList.add("news-photo-fixed");
          photoCard.dataset.imageUrl = safeUrl;
          photoCard.dataset.sourceImage = safeUrl;
          photoCard.style.setProperty("--news-photo", `url('${safeUrl}')`);
        }
      };
      preloader.src = safeUrl;
    });
  };

  const fetchArchiveArticles = async () => {
    const paths = ["/api/news/archive?limit=500", "/api/news?limit=500"];

    try {
      for (const path of paths) {
        const response = await fetch(getApiUrl(path), { headers: { Accept: "application/json" } });
        if (!response.ok) {
          continue;
        }

        const payload = await response.json().catch(() => ({}));
        if (Array.isArray(payload.items)) {
          return payload.items;
        }
      }
    } catch (_error) {
      // A base estatica continua funcionando quando a API nao estiver online.
    }

    return [];
  };

  const getCategoryGroup = (filter = "") => {
    const normalized = normalizeText(filter);
    return categoryAliases[normalized] || (normalized ? [normalized] : []);
  };

  const matchesCategory = (article, filter = "") => {
    const normalizedFilter = normalizeText(filter);

    if (!normalizedFilter || normalizedFilter === "todos") {
      return true;
    }

    return getCategoryGroup(normalizedFilter).includes(normalizeText(article.category));
  };

  const matchesQuery = (article, query = "") => {
    return getQueryScore(article, query) > 0;
  };

  const buildArticleHref = (article) =>
    article.slug ? `./noticia.html?slug=${encodeURIComponent(article.slug)}` : article.sourceUrl || "#";

  const isExternalUrl = (href) => /^https?:\/\//i.test(String(href || ""));

  const buildCard = (article) => {
    const href = buildArticleHref(article);
    const card = document.createElement("article");
    const thumb = document.createElement("a");
    const chip = document.createElement("span");
    const source = document.createElement("span");
    const title = document.createElement("h3");
    const summary = document.createElement("p");
    const footer = document.createElement("footer");
    const category = document.createElement("span");
    const link = document.createElement("a");

    card.className = "news-card generated-feed-card reveal active";
    card.dataset.category = normalizeText(article.category);

    thumb.className = `news-thumb ${article.previewClass}`;
    thumb.href = href;
    thumb.setAttribute("aria-label", `Abrir noticia ${article.title}`);
    thumb.dataset.topic = article.category;
    applyThumbImage(thumb, article);
    chip.textContent = article.category;
    thumb.appendChild(chip);

    source.className = "news-source";
    source.textContent = `${article.sourceName} • ${article.date}`;
    title.textContent = article.title;
    summary.textContent = article.lede;
    category.textContent = `Fonte consultada: ${article.sourceName}`;
    link.href = href;
    link.textContent = "ler análise";

    if (isExternalUrl(href)) {
      link.target = "_blank";
      link.rel = "noreferrer";
      thumb.target = "_blank";
      thumb.rel = "noreferrer";
    }

    footer.append(category, link);
    card.append(thumb, source, title, summary, footer);
    return card;
  };

  const getNodes = () => ({
    grid: document.querySelector("#live-feed-grid"),
    query: document.querySelector("#live-feed-query"),
    more: document.querySelector("#live-feed-more"),
    count: document.querySelector("#live-feed-count"),
    countLabel: document.querySelector("#live-feed-count-label"),
    total: document.querySelector("#live-feed-total"),
    status: document.querySelector("#live-feed-status"),
    filters: document.querySelector("#live-feed-filters"),
    updated: document.querySelector("#live-feed-updated"),
    focus: document.querySelector("#live-feed-focus"),
    sources: document.querySelector("#live-feed-sources"),
    clear: document.querySelector("#live-feed-clear"),
    suggestions: document.querySelector("#arquivo-noticias-sugestoes")
  });

  const getInitialQuery = () => {
    try {
      return String(new URLSearchParams(window.location.search).get("q") || "").trim();
    } catch (_error) {
      return "";
    }
  };

  const applyInitialQuery = () => {
    const { query } = getNodes();
    if (!query || state.initialQueryApplied) {
      return;
    }

    const initialQuery = getInitialQuery();
    if (!initialQuery) {
      state.initialQueryApplied = true;
      return;
    }

    query.value = initialQuery;
    state.initialQueryApplied = true;
  };

  const getFilteredItems = (queryNode) => {
    const queryValue = String(queryNode?.value || "").trim();
    const categoryFiltered = state.items.filter((article) =>
      matchesCategory(article, state.activeCategory)
    );

    if (!normalizeText(queryValue)) {
      return categoryFiltered;
    }

    return categoryFiltered
      .map((article) => ({
        article,
        score: getQueryScore(article, queryValue)
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        const dateDiff = getSortTimestamp(right.article) - getSortTimestamp(left.article);
        if (dateDiff !== 0) {
          return dateDiff;
        }

        return String(left.article.title || "").localeCompare(String(right.article.title || ""), "pt-BR");
      })
      .map((entry) => entry.article);
  };

  const getDominantCategory = (items) => {
    const counts = new Map();
    items.forEach((article) => {
      counts.set(article.category, (counts.get(article.category) || 0) + 1);
    });

    return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] || "Arquivo geral";
  };

  const renderAutocomplete = () => {
    const { suggestions, query } = getNodes();
    if (!suggestions || !query) {
      return;
    }

    const seen = new Set();
    const values = [];

    state.items.forEach((article) => {
      [article.title, article.category, article.sourceName, article.sourceLabel].forEach((value) => {
        const label = String(value || "").trim();
        const key = normalizeText(label);
        if (!label || seen.has(key)) {
          return;
        }

        seen.add(key);
        values.push(label);
      });
    });

    suggestions.__arquivoValues = values.slice(0, 260);
    query.removeAttribute("list");
    query.setAttribute("autocomplete", "off");
    query.setAttribute("aria-controls", "arquivo-noticias-sugestoes");
    query.setAttribute("aria-expanded", "false");

    const closeSuggestions = () => {
      suggestions.hidden = true;
      query.setAttribute("aria-expanded", "false");
    };

    const updateSuggestions = () => {
      const currentValue = normalizeText(query.value);
      const sourceValues = Array.isArray(suggestions.__arquivoValues)
        ? suggestions.__arquivoValues
        : [];
      const visibleValues = sourceValues
        .filter((value) => !currentValue || normalizeText(value).includes(currentValue))
        .slice(0, 90);

      suggestions.innerHTML = "";
      if (!visibleValues.length || document.activeElement !== query) {
        closeSuggestions();
        return;
      }

      visibleValues.forEach((value) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "feed-suggestion-button";
        button.setAttribute("role", "option");

        const title = document.createElement("strong");
        title.textContent = value;
        const meta = document.createElement("small");
        meta.textContent = "buscar no arquivo";

        button.append(title, meta);
        suggestions.appendChild(button);
      });

      suggestions.hidden = false;
      query.setAttribute("aria-expanded", "true");
    };

    if (!suggestions.dataset.bound) {
      suggestions.dataset.bound = "true";

      query.addEventListener("focus", updateSuggestions);
      query.addEventListener("input", updateSuggestions);
      query.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          closeSuggestions();
        }
      });

      suggestions.addEventListener("mousedown", (event) => {
        const button = event.target.closest(".feed-suggestion-button");
        if (!button) {
          return;
        }

        event.preventDefault();
        const value = button.querySelector("strong")?.textContent || "";
        query.value = value;
        closeSuggestions();
        query.dispatchEvent(new Event("input", { bubbles: true }));
        query.focus();
      });

      document.addEventListener("mousedown", (event) => {
        if (event.target === query || suggestions.contains(event.target)) {
          return;
        }

        closeSuggestions();
      });
    }
  };

  const renderFilters = () => {
    const { filters } = getNodes();
    if (!filters) {
      return;
    }

    const options = [
      ["", "Tudo"],
      ["cotidiano", "Cotidiano"],
      ["prefeitura", "Prefeitura"],
      ["policia", "Polícia"],
      ["saude", "Saúde"],
      ["educacao", "Educação"]
    ];

    filters.innerHTML = "";
    options.forEach(([key, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `feed-filter-chip${state.activeCategory === key ? " is-active" : ""}`;
      button.dataset.category = key;
      button.textContent = label;
      button.addEventListener("click", () => {
        state.activeCategory = key;
        state.visibleItems = pageSize;
        renderArchive();
      });
      filters.appendChild(button);
    });
  };

  const updateSummary = (filtered, visibleSlice) => {
    const { count, countLabel, total, status, updated, focus, sources, clear, query } = getNodes();
    const activeText = state.activeCategory ? state.activeCategory : "";
    const queryText = String(query?.value || "").trim();
    const activeContext = [activeText, queryText ? `busca "${queryText}"` : ""].filter(Boolean);
    const summaryItems = filtered.length ? filtered : state.items;

    if (count) {
      count.textContent = String(filtered.length);
    }

    if (countLabel) {
      countLabel.textContent = activeContext.length ? "pautas no recorte atual" : "notícias já postadas";
    }

    if (total) {
      total.textContent = `Arquivo local: ${state.items.length} notícias cadastradas`;
    }

    if (updated) {
      updated.textContent = summaryItems[0]?.date || "--";
    }

    if (focus) {
      focus.textContent = getDominantCategory(summaryItems);
    }

    if (sources) {
      const sourceCount = new Set(summaryItems.map((article) => article.sourceName).filter(Boolean)).size;
      sources.textContent = `${sourceCount} ${sourceCount === 1 ? "fonte" : "fontes"}`;
    }

    if (clear) {
      clear.hidden = activeContext.length === 0;
    }

    if (!status) {
      return;
    }

    if (!filtered.length) {
      status.textContent = "Nenhuma notícia postada bateu com esse recorte. Tente outro termo ou limpe o filtro.";
      return;
    }

    if (activeContext.length) {
      status.textContent = `Recorte ativo no arquivo por ${activeContext.join(" e ")}. Mostrando ${visibleSlice.length} de ${filtered.length} agora.`;
      return;
    }

    status.textContent = `Arquivo de notícias postadas pronto. Use o auto completar para buscar por título, fonte, editoria ou palavra do resumo.`;
  };

  const renderArchive = () => {
    const { grid, query, more } = getNodes();
    if (!grid || !query || !more) {
      return;
    }

    const filtered = getFilteredItems(query);
    const visibleSlice = filtered.slice(0, state.visibleItems);

    grid.innerHTML = "";
    updateSummary(filtered, visibleSlice);
    renderFilters();

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "feed-empty";
      empty.textContent = "Nenhuma notícia encontrada. Experimente buscar por fonte, bairro, órgão ou editoria.";
      grid.appendChild(empty);
      more.hidden = true;
      return;
    }

    visibleSlice.forEach((article) => grid.appendChild(buildCard(article)));
    more.hidden = visibleSlice.length >= filtered.length;
  };

  const attachFallbackRendering = () => {
    const { grid, query, more, clear, count, status } = getNodes();
    if (!grid || !query || !more) {
      return;
    }

    state.ownsRendering =
      !grid.children.length ||
      String(count?.textContent || "").trim() === "--" ||
      normalizeText(status?.textContent || "").includes("carregando");

    if (!state.ownsRendering) {
      return;
    }

    query.addEventListener("input", () => {
      state.visibleItems = pageSize;
      renderArchive();
    });

    more.addEventListener("click", () => {
      state.visibleItems += pageSize;
      renderArchive();
    });

    clear?.addEventListener("click", () => {
      state.activeCategory = "";
      state.visibleItems = pageSize;
      query.value = "";
      query.focus();
      renderArchive();
    });

    document.querySelectorAll("#radar .chip-button[data-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        const filter = normalizeText(button.dataset.filter || "");
        state.activeCategory = filter === "todos" ? "" : filter;
        state.visibleItems = pageSize;
        query.value = "";
        renderArchive();
        document.querySelector("#arquivo-vivo")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    applyInitialQuery();
    renderArchive();
  };

  const boot = async () => {
    const staticItems = Array.isArray(window.NEWS_DATA) ? window.NEWS_DATA : [];
    state.items = dedupeArticles(staticItems);
    window.ARQUIVO_NOTICIAS = state.items;
    renderAutocomplete();
    attachFallbackRendering();

    const refreshFromApi = async () => {
      const apiItems = await fetchArchiveArticles();
      if (!apiItems.length) {
        return;
      }

      state.items = dedupeArticles([...apiItems, ...state.items]);
      window.ARQUIVO_NOTICIAS = state.items;
      renderAutocomplete();

      if (state.ownsRendering) {
        renderArchive();
      }
    };

    const scheduleRefresh = () => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(refreshFromApi, { timeout: 1800 });
        return;
      }

      window.setTimeout(refreshFromApi, 300);
    };

    if (document.readyState === "complete") {
      scheduleRefresh();
      return;
    }

    window.addEventListener("load", scheduleRefresh, { once: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
