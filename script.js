const revealNodes = document.querySelectorAll(".reveal");
const filterButtons = document.querySelectorAll(".chip-button");
const dayChips = document.querySelectorAll(".day-chip");
const newsCards = document.querySelectorAll(".news-card");
const betButtons = document.querySelectorAll(".bet-option");
const parallaxNodes = document.querySelectorAll("[data-parallax]");
const stakeInput = document.querySelector("#stake");
const stakeValue = document.querySelector("#stake-value");
const stakeReturn = document.querySelector("#stake-return");
const commentForm = document.querySelector("#comment-form");
const commentAuthorInput = document.querySelector("#comment-author");
const opinionInput = document.querySelector("#opinion");
const publishCommentButton = document.querySelector("#publish-comment");
const commentsFeed = document.querySelector(".comments-feed");
const commentFeedback = document.querySelector("#comment-feedback");
const charCount = document.querySelector("#char-count");
const guideTip = document.querySelector("#guide-tip");
const menuToggle = document.querySelector("#menu-toggle");
const siteHeader = document.querySelector(".site-header");
const thumbNodes = document.querySelectorAll(".news-thumb, .mini-thumb");
const subscriptionForm = document.querySelector("#subscription-form");
const subscriptionNameInput = document.querySelector("#subscription-name");
const subscriptionEmailInput = document.querySelector("#subscription-email");
const subscriptionPlanInput = document.querySelector("#subscription-plan");
const subscriptionFeedback = document.querySelector("#subscription-feedback");
const localeTimeZone = "America/Rio_Branco";
const initialStaticNews = Array.isArray(window.NEWS_DATA) ? [...window.NEWS_DATA] : [];
const thumbTopicFallbacks = {
  "thumb-cheia": "Cheia",
  "thumb-saude": "Saude",
  "thumb-servico": "Servico",
  "thumb-politica": "Prefeitura",
  "thumb-social": "Social",
  "thumb-educacao": "Educacao",
  "thumb-educacao-alt": "Educacao",
  "thumb-cultura": "Cultura",
  "thumb-pascoa": "Pascoa",
  "thumb-policia": "Policia",
  "thumb-rede": "Rede",
  "thumb-alerta": "Utilidade"
};

const getSlugFromThumbNode = (node) => {
  const linkNode = node?.closest?.("a");
  const href = linkNode?.getAttribute("href") || node?.getAttribute?.("href") || "";
  const match = href.match(/slug=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : "";
};

const getThumbTopic = (thumbNode, article) => {
  const inlineLabel = thumbNode.querySelector("span")?.textContent?.trim();

  if (inlineLabel) {
    return inlineLabel;
  }

  if (article?.category) {
    return article.category;
  }

  const fallbackClass = [...thumbNode.classList].find((className) =>
    className.startsWith("thumb-")
  );

  return thumbTopicFallbacks[fallbackClass] || "Radar";
};

// Convert visual thumbs into simple topical cards.
if (window.NEWS_DATA) {
  const newsMap = Object.fromEntries(
    window.NEWS_DATA.map((item) => [item.slug, item])
  );

  thumbNodes.forEach((thumbNode) => {
    const slug = getSlugFromThumbNode(thumbNode);
    const article = newsMap[slug];
    thumbNode.dataset.topic = getThumbTopic(thumbNode, article);
  });
}

const guideMessages = [
  "Comece pelo Radar para ver o que mexeu com Cruzeiro do Sul nesta semana.",
  "No Arquivo de Abril você revê o mês até agora sem perder a linha do tempo.",
  "Festas & Social reúne clima de Páscoa, cultura e buzz público de rede.",
  "Se você não quer estar aqui, o botão Remoção te leva para revisão manual."
];
const candidatesList = ["gladson", "mailza", "alan", "jorge"];

if (menuToggle && siteHeader) {
  menuToggle.addEventListener("click", () => {
    const collapsed = siteHeader.classList.toggle("is-collapsed");
    menuToggle.textContent = collapsed ? "Mostrar Menu" : "Ocultar Menu";
    menuToggle.setAttribute("aria-expanded", String(!collapsed));
  });
}

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".reveal").forEach((node) => revealObserver.observe(node));
} else {
  document.querySelectorAll(".reveal").forEach((node) => node.classList.add("active"));
}

const motionPanelSelector = [
  ".mosaic-item",
  ".news-card",
  ".archive-card",
  ".social-card",
  ".caderno-card",
  ".sidebar-widget",
  ".side-card",
  ".ad-unit",
  ".membership-card",
  ".projection-card",
  ".feature-card",
  ".comment-card",
  ".signal-band"
].join(", ");

const motionMediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

const bindInteractivePanel = (panel) => {
  if (!panel || panel.dataset.motionBound === "true") {
    return;
  }

  panel.dataset.motionBound = "true";
  panel.classList.add("interactive-panel");

  const resetPanel = () => {
    panel.style.transform = "";
  };

  panel.addEventListener("pointermove", (event) => {
    if (!motionMediaQuery.matches) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    const offsetX = (event.clientX - rect.left) / rect.width;
    const offsetY = (event.clientY - rect.top) / rect.height;
    const rotateY = (offsetX - 0.5) * 7;
    const rotateX = (0.5 - offsetY) * 5;

    panel.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });

  panel.addEventListener("pointerleave", resetPanel);
  panel.addEventListener("pointerup", resetPanel);
};

const registerInteractivePanels = (root = document) => {
  if (!root) {
    return;
  }

  const panels = [];

  if (root.matches?.(motionPanelSelector)) {
    panels.push(root);
  }

  const nestedPanels = root.querySelectorAll
    ? [...root.querySelectorAll(motionPanelSelector)]
    : [];

  panels.push(...nestedPanels);
  panels.forEach(bindInteractivePanel);
};

registerInteractivePanels();

// FUNÃ‡ÃƒO PARA RENDERIZAR O RADAR (HOME)
const renderRadar = (filter = "todos") => {
  const radarGrid = document.querySelector("#radar .news-grid");
  if (!radarGrid || !window.NEWS_DATA) return;

  const filtered = window.NEWS_DATA.filter(article => 
    filter === "todos" || normalizeText(article.category) === normalizeText(filter)
  ).slice(0, 10); // Exibir as 10 principais no radar

  radarGrid.innerHTML = "";
  filtered.forEach((article, index) => {
    const card = buildFeedCard(article);
    if (index === 0 && filter === "todos") card.classList.add("featured");
    card.classList.add("reveal");
    radarGrid.appendChild(card);
  });

  // Re-observar novos nÃ³s se o observer existir
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    }, { threshold: 0.1 });
    radarGrid.querySelectorAll(".reveal").forEach(el => observer.observe(el));
  }

  registerInteractivePanels(radarGrid);
};

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const { filter } = button.dataset;
    filterButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    renderRadar(filter);
  });
});

dayChips.forEach((button) => {
  button.addEventListener("click", () => {
    dayChips.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
  });
});

betButtons.forEach((button) => {
  button.addEventListener("click", () => {
    betButtons.forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
  });
});

const updateProjection = () => {
  const stake = Number(stakeInput.value);
  const trackedItems = Math.round(18 + ((stake - 7) / (31 - 7)) * (74 - 18));

  stakeValue.textContent = `${stake} dias`;
  stakeReturn.textContent = `${trackedItems} notas`;
};

if (stakeInput && stakeValue && stakeReturn) {
  updateProjection();
  stakeInput.addEventListener("input", updateProjection);
}

if (opinionInput && charCount) {
  opinionInput.addEventListener("input", () => {
    charCount.textContent = `${opinionInput.value.length} / 180`;
  });
}

const buildCommentCard = (comment) => {
  const article = document.createElement("article");
  const header = document.createElement("header");
  const author = document.createElement("strong");
  const badge = document.createElement("span");
  const message = document.createElement("p");

  article.className = "comment-card reveal active";
  author.textContent = comment.name || "Leitor local";
  badge.textContent = comment.badge || "Comunidade";
  message.textContent = `“${comment.message || ""}”`;

  header.append(author, badge);
  article.append(header, message);
  return article;
};

const renderCommentsFeed = (items = []) => {
  if (!commentsFeed) {
    return;
  }

  commentsFeed.innerHTML = "";
  items.forEach((comment) => {
    commentsFeed.appendChild(buildCommentCard(comment));
  });
};

let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 2;
let scrollY = window.scrollY;

const renderParallax = () => {
  parallaxNodes.forEach((node) => {
    const depth = Number(node.dataset.depth || 12);
    const offsetX = ((pointerX - window.innerWidth / 2) / window.innerWidth) * depth;
    const offsetY = ((pointerY - window.innerHeight / 2) / window.innerHeight) * depth;
    const scrollOffset = Math.min(scrollY * 0.015, depth * 1.5);
    node.style.transform = `translate3d(${offsetX}px, ${offsetY + scrollOffset}px, 0)`;
  });
};

if (parallaxNodes.length > 0) {
  renderParallax();

  window.addEventListener("mousemove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    renderParallax();
  });

  window.addEventListener(
    "scroll",
    () => {
      scrollY = window.scrollY;
      renderParallax();
    },
    { passive: true }
  );
}

if (guideTip) {
  let guideIndex = 0;

  window.setInterval(() => {
    guideIndex = (guideIndex + 1) % guideMessages.length;
    guideTip.textContent = guideMessages[guideIndex];
  }, 4200);
}

const mediaDefaults = {
  badge: "",
  label: "",
  note: "Cobertura direta do Catalogo Cruzeiro do Sul",
  creditLabel: "Politica visual do Catalogo",
  creditUrl: "./index.html#desmonte"
};

const getSlugFromLink = (node) => {
  if (!node || !node.getAttribute) {
    return "";
  }

  const href = node.getAttribute("href") || "";
  const match = href.match(/slug=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : "";
};

const ensureMediaBadge = (node, media) => {
  if (!node || node.querySelector(".thumb-media-badge")) {
    return;
  }

  if (!media || !media.badge) {
    return;
  }

  const badge = document.createElement("span");
  badge.className = "thumb-media-badge";
  badge.textContent = media.badge;
  node.appendChild(badge);
};

if (thumbNodes.length > 0 && window.NEWS_MAP) {
  thumbNodes.forEach((node) => {
    const slugFromHref = getSlugFromLink(node.closest("a") || node);
    const article = window.NEWS_MAP?.[slugFromHref];
    ensureMediaBadge(node, article?.media);
  });
}

const liveFeedGrid = document.querySelector("#live-feed-grid");
const liveFeedQuery = document.querySelector("#live-feed-query");
const liveFeedMore = document.querySelector("#live-feed-more");
const liveFeedCount = document.querySelector("#live-feed-count");
const liveFeedState = {
  pageSize: 6,
  visibleItems: 6,
  items: [...initialStaticNews]
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

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const parseArticleDate = (value) => {
  const normalized = normalizeText(value).replace("º", "");
  const match = normalized.match(/(\d{1,2}) de ([a-z]+) de (\d{4})/);

  if (!match) {
    return 0;
  }

  const [, day, month, year] = match;
  return new Date(Number(year), monthIndex[month] ?? 0, Number(day)).getTime();
};

const atlasApiBase = window.location.protocol.startsWith("http")
  ? ""
  : "http://localhost:3000";

const getApiUrl = (path) => `${atlasApiBase}${path}`;

const requestApiJson = async (path, options = {}) => {
  const nextHeaders = { ...(options.headers || {}) };

  if (options.body && !nextHeaders["Content-Type"]) {
    nextHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(getApiUrl(path), {
    headers: nextHeaders,
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Falha em ${path}`);
  }

  return response.json();
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const setFeedbackState = (node, message, tone = "") => {
  if (!node) {
    return;
  }

  node.textContent = message || "";
  node.classList.remove("is-error", "is-success");

  if (tone) {
    node.classList.add(tone);
  }
};

const dedupeNewsItems = (items = []) => {
  const mergedMap = new Map();

  items.forEach((item) => {
    const key =
      item.sourceUrl ||
      item.slug ||
      normalizeText([item.title, item.date, item.sourceName].join(" "));

    if (!mergedMap.has(key)) {
      mergedMap.set(key, item);
    }
  });

  return [...mergedMap.values()].sort((left, right) => {
    const rightDate = Date.parse(right.publishedAt || "") || parseArticleDate(right.date);
    const leftDate = Date.parse(left.publishedAt || "") || parseArticleDate(left.date);
    return rightDate - leftDate;
  });
};

const syncNewsDataset = (runtimeItems = []) => {
  const merged = dedupeNewsItems([...(runtimeItems || []), ...initialStaticNews]);
  window.NEWS_DATA = merged;
  window.NEWS_MAP = Object.fromEntries(merged.map((item) => [item.slug, item]));
  return merged;
};

// --- Elections: render candidates and setup filters ---
if (window.ELECTIONS_DATA) {
  const renderCandidates = (level = "todos") => {
    const grid = document.querySelector(".elections-grid");
    if (!grid) return;

    grid.innerHTML = "";
    Object.entries(window.ELECTIONS_DATA).forEach(([key, candidate]) => {
      if (level !== "todos" && candidate.level !== level) return;

      const card = document.createElement("article");
      card.className = "candidate-card news-card reveal active";
      card.dataset.level = candidate.level;
      
      card.innerHTML = `
        <header class="candidate-header">
          <div class="candidate-avatar ${candidate.imageUrl ? 'has-photo' : ''}" 
               style="--candidate-photo:url('${candidate.imageUrl || ''}');">
            ${candidate.imageUrl ? "" : candidate.name.charAt(0)}
          </div>
          <div>
            <h3 class="fraunces" style="margin:0; font-size:1.4rem;">${candidate.name}</h3>
            <span class="eyebrow" style="color:var(--copper); font-size:0.85rem; font-weight:700;">${candidate.party} | ${candidate.level.toUpperCase()}</span>
          </div>
        </header>
        <div class="candidate-propostas" style="margin-top:1rem; flex:1;">
          <h4 style="font-size:0.8rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--muted)">Principais Propostas</h4>
          <ul style="padding-left:1.1rem; margin-top:0.5rem; color:var(--muted); font-size:0.92rem; line-height:1.6;">
            ${candidate.propostas.map(p => `<li>${p}</li>`).join('')}
          </ul>
        </div>
        <footer style="margin-top:1.5rem; padding-top:1rem; border-top:1px solid rgba(16,35,60,0.08);">
          <button class="chip-button vote-button" data-candidate="${key}" style="width:100%; justify-content:center;">Simular Voto</button>
        </footer>
      `;
      grid.appendChild(card);
    });

    // Re-initialize polling listeners for new buttons
    if (typeof initializeElectionPolling === 'function') {
      initializeElectionPolling();
    }
  };

  const setupElectionFilters = () => {
    const filters = document.querySelectorAll(".election-filter");
    filters.forEach((f) =>
      f.addEventListener("click", () => {
        filters.forEach((x) => x.classList.remove("is-active"));
        f.classList.add("is-active");
        renderCandidates(f.dataset.level);
      })
    );
  };

  renderCandidates();
  setupElectionFilters();
}

const buildFeedCard = (article) => {
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
  thumb.href = `./noticia.html?slug=${article.slug}`;
  thumb.setAttribute("aria-label", `Abrir notícia ${article.title}`);
  thumb.dataset.topic = article.category;

  chip.textContent = article.category;
  thumb.append(chip);

  source.className = "news-source";
  source.textContent = `${article.sourceName} • ${article.date}`;

  title.textContent = article.title;
  summary.textContent = article.lede;

  category.textContent = `Fonte consultada: ${article.sourceName}`;
  link.href = `./noticia.html?slug=${article.slug}`;
  link.textContent = "ler análise";

  footer.append(category, link);
  card.append(thumb, source, title, summary, footer);

  return card;
};

// Inicializar Radar apenas depois que as dependências do card estiverem prontas.
renderRadar();

const getFilteredLiveFeedArticles = () => {
  const query = normalizeText(liveFeedQuery?.value || "");
  const sortedArticles = [...liveFeedState.items].sort((left, right) => {
    const rightDate = Date.parse(right.publishedAt || "") || parseArticleDate(right.date);
    const leftDate = Date.parse(left.publishedAt || "") || parseArticleDate(left.date);

    if (rightDate !== leftDate) {
      return rightDate - leftDate;
    }

    return left.title.localeCompare(right.title, "pt-BR");
  });

  return sortedArticles.filter((article) => {
    if (!query) {
      return true;
    }

    const haystack = normalizeText(
      [
        article.title,
        article.lede,
        article.category,
        article.eyebrow,
        article.sourceName,
        article.sourceLabel
      ].join(" ")
    );

    return haystack.includes(query);
  });
};

const renderLiveFeed = () => {
  if (!liveFeedGrid || !liveFeedQuery || !liveFeedMore || !liveFeedCount) {
    return;
  }

  const filtered = getFilteredLiveFeedArticles();
  const visibleSlice = filtered.slice(0, liveFeedState.visibleItems);

  liveFeedGrid.innerHTML = "";
  liveFeedCount.textContent = String(filtered.length);

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "feed-empty";
    empty.textContent =
      "Nenhuma pauta encontrada com esse termo. Tente buscar por tema, órgão ou bairro.";
    liveFeedGrid.appendChild(empty);
    liveFeedMore.hidden = true;
    return;
  }

  visibleSlice.forEach((article) => {
    liveFeedGrid.appendChild(buildFeedCard(article));
  });

  liveFeedMore.hidden = visibleSlice.length >= filtered.length;
  registerInteractivePanels(liveFeedGrid);
};

const updateLiveFeedItems = (items = []) => {
  liveFeedState.items = [...items];
  liveFeedState.visibleItems = liveFeedState.pageSize;
  renderLiveFeed();
};

if (liveFeedGrid && liveFeedQuery && liveFeedMore && liveFeedCount) {
  liveFeedQuery.addEventListener("input", () => {
    liveFeedState.visibleItems = liveFeedState.pageSize;
    renderLiveFeed();
  });

  liveFeedMore.addEventListener("click", () => {
    liveFeedState.visibleItems += liveFeedState.pageSize;
    renderLiveFeed();
  });

  updateLiveFeedItems(window.NEWS_DATA || []);
}

// SISTEMA DE VOTAÃ‡ÃƒO PARA ELEIÃ‡Ã•ES
function initializeElectionPolling() {
  // Recuperar dados salvos do localStorage
  const savedVotes = JSON.parse(localStorage.getItem("election-votes") || JSON.stringify({
    gladson: 0,
    mailza: 0,
    alan: 0,
    jorge: 0
  }));

  // Atualizar barras de resultado
  const updateResults = () => {
    const total = Object.values(savedVotes).reduce((sum, val) => sum + val, 0);
    
    candidatesList.forEach((candidate) => {
      const resultFill = document.querySelector(`#result-${candidate}`);
      const percentText = document.querySelector(`#percent-${candidate}`);
      
      if (resultFill && percentText) {
        const percentage = total > 0 ? Math.round((savedVotes[candidate] / total) * 100) : 0;
        resultFill.style.width = `${percentage}%`;
        percentText.textContent = `${percentage}%`;
      }
    });
  };

  // Inicializar exibiÃ§Ã£o
  updateResults();

  // Adicionar listeners nos botÃµes de votaÃ§Ã£o
  document.querySelectorAll(".vote-button").forEach((button) => {
    button.addEventListener("click", (e) => {
      const candidate = button.dataset.candidate;

      if (savedVotes.hasOwnProperty(candidate)) {
        // Incrementar voto
        savedVotes[candidate]++;
        
        // Salvar no localStorage
        localStorage.setItem("election-votes", JSON.stringify(savedVotes));
        sessionStorage.setItem(`voted-${candidate}`, "true");
        
        // Atualizar UI
        updateResults();
        
        // Feedback visual
        button.classList.add("voted");
        button.disabled = true;
        button.textContent = "✓ Votado";
        
        // Animar
        button.style.transform = "scale(0.95)";
        setTimeout(() => {
          button.style.transform = "scale(1)";
        }, 200);
      }
    });

    // Verificar se o usuÃ¡rio jÃ¡ votou
    const candidate = button.dataset.candidate;
    const userVote = JSON.parse(sessionStorage.getItem(`voted-${candidate}`) || "null");
    if (userVote) {
      button.classList.add("voted");
      button.disabled = true;
      button.textContent = "✓ Votado";
    }
  });

  // Detectar novo voto via outro tab/janela
  window.addEventListener("storage", (e) => {
    if (e.key === "election-votes" && e.newValue) {
      Object.assign(savedVotes, JSON.parse(e.newValue));
      updateResults();
    }
  });
}


// --- WIDGETS LATERAIS ---
const sidebarData = window.SIDEBAR_DATA || null;

const escapeAttribute = (value) =>
  String(value || "").replace(/"/g, "&quot;");

const isExternalUrl = (value) => /^https?:\/\//.test(String(value || ""));

const getSidebarHref = (item, article) => {
  if (article?.slug) {
    return `./noticia.html?slug=${article.slug}`;
  }

  return item?.url || "./index.html";
};

const getSidebarLinkAttrs = (href) =>
  isExternalUrl(href) ? ' target="_blank" rel="noreferrer"' : "";

const getSidebarWeatherIcon = (condition) => {
  const normalized = normalizeText(condition);

  if (normalized.includes("trovoada") || normalized.includes("tempestade")) {
    return "⛈";
  }

  if (normalized.includes("chuva")) {
    return "🌧";
  }

  if (normalized.includes("nuv")) {
    return "☁";
  }

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

const buildHolidayMarkup = (holidays) =>
  holidays
    .map(
      (holiday) => `
        <div class="holiday-item">
          <div>
            <span class="holiday-date">${holiday.shortDate}</span>
            <span class="holiday-weekday">${holiday.weekday}</span>
          </div>
          <div>
            <span class="holiday-name">${holiday.name}</span>
            ${holiday.scope ? `<small>${holiday.scope}</small>` : ""}
          </div>
        </div>
      `
    )
    .join("");

const buildAgendaMarkup = (items) =>
  items
    .map((item) => {
      const article = item.slug ? window.NEWS_MAP?.[item.slug] : null;
      const href = getSidebarHref(item, article);
      const title = article?.title || item.title;
      const sourceName = article?.sourceName || item.sourceName || "Fonte local";
      const meta = item.meta || article?.sourceLabel || "";

      return `
        <a class="sidebar-list-item" href="${escapeAttribute(href)}"${getSidebarLinkAttrs(href)}>
          <div class="sidebar-list-head">
            <span class="rail-pill">${item.tag}</span>
            <strong>${item.dateLabel}</strong>
          </div>
          <h3>${title}</h3>
          <p>${meta}</p>
          <small>Fonte: ${sourceName}</small>
        </a>
      `;
    })
    .join("");

const buildStoryMarkup = (items) =>
  items
    .map((item) => {
      const article = window.NEWS_MAP?.[item.slug];

      if (!article) {
        return "";
      }

      const href = `./noticia.html?slug=${article.slug}`;
      const photoStyle = article.imageUrl
        ? ` style="--story-photo:url('${article.imageUrl}')"`
        : "";

      return `
        <a class="sidebar-photo-card" href="${href}"${photoStyle}>
          <div class="sidebar-photo-copy">
            <span>${item.kicker}</span>
            <strong>${article.title}</strong>
            <small>${item.stat} • ${article.sourceName}</small>
          </div>
        </a>
      `;
    })
    .join("");

const buildListPanelMarkup = ({
  title,
  source,
  items,
  actionLabel,
  actionUrl,
  passiveLabel = "recorte real"
}) => {
  const actionMarkup = actionUrl
    ? `<a class="widget-link" href="${escapeAttribute(actionUrl)}"${getSidebarLinkAttrs(actionUrl)}>${actionLabel}</a>`
    : `<span class="widget-link passive-link">${passiveLabel}</span>`;

  return `
    <div class="sidebar-heading">
      <div>
        <p class="widget-title">${title}</p>
        <span class="widget-source">${source}</span>
      </div>
      ${actionMarkup}
    </div>
    <div class="sidebar-list">
      ${buildAgendaMarkup(items)}
    </div>
  `;
};

const buildMarketMarkup = (market) => `
  <div class="sidebar-heading">
    <div>
      <p class="widget-title">Radar de Bolsa</p>
      <span class="widget-source">${market.snapshotLabel}</span>
    </div>
    <a class="widget-link" href="${escapeAttribute(market.sourceUrl)}"${getSidebarLinkAttrs(market.sourceUrl)}>fechamento</a>
  </div>
  <div class="market-quote-row">
    ${market.quotes
      .map(
        (quote) => `
          <div class="market-quote">
            <span>${quote.label}</span>
            <strong>${quote.value}</strong>
            <small>${quote.note}</small>
          </div>
        `
      )
      .join("")}
  </div>
  <div class="market-grid">
    ${market.moves
      .map(
        (item) => `
          <a class="market-move" href="${escapeAttribute(item.url)}"${getSidebarLinkAttrs(item.url)}>
            <div class="market-head">
              <span class="market-bias ${item.bias}">${item.badge}</span>
              <strong>${item.label}</strong>
            </div>
            <h3>${item.title}</h3>
            <p>${item.summary}</p>
            <small>Base: ${item.sourceName}</small>
          </a>
        `
      )
      .join("")}
  </div>
  <div class="market-opinion">
    <p class="widget-kicker">${market.opinionTitle}</p>
    <p>${market.opinionText}</p>
  </div>
  <div class="sidebar-list compact-list">
    ${buildAgendaMarkup(market.pocketTips)}
  </div>
`;

const renderSidebarWidgets = () => {
  if (!sidebarData) {
    return;
  }

  const nowPanel = document.querySelector("#sidebar-now");
  const holidaysPanel = document.querySelector("#sidebar-holidays");
  const nationalPanel = document.querySelector("#sidebar-national");
  const politicsPanel = document.querySelector("#sidebar-politics");
  const marketPanel = document.querySelector("#sidebar-market");
  const agendaPanel = document.querySelector("#sidebar-agenda");
  const worldPanel = document.querySelector("#sidebar-world");
  const varietiesPanel = document.querySelector("#sidebar-varieties");
  const famousPanel = document.querySelector("#sidebar-famous");
  const buzzPanel = document.querySelector("#sidebar-buzz");
  const popularPanel = document.querySelector("#sidebar-popular");
  const commercialPanel = document.querySelector("#sidebar-commercial");
  const adsPanel = document.querySelector("#sidebar-ads");

  if (
    !nowPanel ||
    !holidaysPanel ||
    !nationalPanel ||
    !politicsPanel ||
    !marketPanel ||
    !agendaPanel ||
    !worldPanel ||
    !varietiesPanel ||
    !famousPanel ||
    !buzzPanel ||
    !popularPanel ||
    !commercialPanel ||
    !adsPanel
  ) {
    return;
  }

  const nextHolidayText = getNextHolidayText([
    sidebarData.holidays.national,
    sidebarData.holidays.local
  ]);
  const weatherIcon = getSidebarWeatherIcon(sidebarData.weather.current.condition);

  nowPanel.innerHTML = `
    <div class="rail-intro">
      <p class="rail-kicker">terceira coluna</p>
      <h3>Painel Local</h3>
      <p>Relógio, clima, feriados, agenda, buzz da rede e espaço comercial no mesmo trilho.</p>
    </div>
    <div class="sidebar-heading">
      <div>
        <p class="widget-title">Cruzeiro do Sul Agora</p>
        <span class="widget-source">snapshot ${sidebarData.snapshotDate}</span>
      </div>
      <a class="widget-link" href="${sidebarData.weather.sourceUrl}" target="_blank" rel="noreferrer">clima real</a>
    </div>
    <div class="sidebar-now-grid">
      <div>
        <div class="clock-time" id="live-clock">00:00:00</div>
        <div class="clock-date" id="live-date">carregando data local...</div>
        <div class="clock-weekday" id="live-weekday">Acre • UTC-5</div>
      </div>
      <div class="sidebar-weather-badge">
        <span class="weather-icon">${weatherIcon}</span>
        <div>
          <strong class="weather-temp" id="weather-temp">${sidebarData.weather.current.temperature}</strong>
          <p class="weather-summary">${sidebarData.weather.current.condition}</p>
        </div>
      </div>
    </div>
    <div class="weather-details">
      ${sidebarData.weather.current.details
        .map((detail) => `<span>${detail}</span>`)
        .join("")}
    </div>
    <p class="widget-note">${sidebarData.weather.note} ${sidebarData.weather.observedAt}. ${sidebarData.weather.tonight}</p>
    <p class="widget-note">${nextHolidayText}</p>
    <label class="sidebar-search-inline">
      <span>Buscar no portal</span>
      <input type="text" id="sidebar-search" placeholder="cheia, escola, policia, cultura..." />
    </label>
  `;

  holidaysPanel.innerHTML = `
    <div class="sidebar-heading">
      <div>
        <p class="widget-title">Feriados no Radar</p>
        <span class="widget-source">nacional + Acre + municipio</span>
      </div>
      <a class="widget-link" href="${sidebarData.holidays.sourceUrl}" target="_blank" rel="noreferrer">fonte oficial</a>
    </div>
    <div class="holiday-columns">
      <section>
        <p class="widget-kicker">nacionais</p>
        <div class="holiday-list">
          ${buildHolidayMarkup(sidebarData.holidays.national)}
        </div>
      </section>
      <section>
        <p class="widget-kicker">locais e regionais</p>
        <div class="holiday-list">
          ${buildHolidayMarkup(sidebarData.holidays.local)}
        </div>
      </section>
    </div>
  `;

  nationalPanel.innerHTML = buildListPanelMarkup({
    title: "Nacional do Dia",
    source: "servico, consumo e custo de vida no radar",
    items: sidebarData.national,
    actionLabel: "economia",
    actionUrl: "https://agenciabrasil.ebc.com.br/economia"
  });

  politicsPanel.innerHTML = buildListPanelMarkup({
    title: "Politica",
    source: "Brasilia, eleicoes e mudancas de equipe",
    items: sidebarData.politics,
    actionLabel: "politica",
    actionUrl: "https://agenciabrasil.ebc.com.br/politica"
  });

  marketPanel.innerHTML = buildMarketMarkup(sidebarData.market);

  agendaPanel.innerHTML = buildListPanelMarkup({
    title: "Agenda & Servico",
    source: "acoes uteis com data certa",
    items: sidebarData.agenda
  });

  worldPanel.innerHTML = buildListPanelMarkup({
    title: "Internacional",
    source: "mundo, energia, juros e ciencia",
    items: sidebarData.world,
    actionLabel: "mundo",
    actionUrl: "https://agenciabrasil.ebc.com.br/internacional"
  });

  varietiesPanel.innerHTML = buildListPanelMarkup({
    title: "Variedades",
    source: "cinema, museu, cultura e conversa",
    items: sidebarData.varieties,
    actionLabel: "cultura",
    actionUrl: "https://agenciabrasil.ebc.com.br/cultura"
  });

  famousPanel.innerHTML = buildListPanelMarkup({
    title: "Famosos",
    source: "pop, relacionamento e bastidor",
    items: sidebarData.famous,
    actionLabel: "gshow",
    actionUrl: "https://gshow.globo.com/cultura-pop/famosos/"
  });

  buzzPanel.innerHTML = `
    <div class="sidebar-heading">
      <div>
        <p class="widget-title">Rede, Festas & Fofoca</p>
        <span class="widget-source">o que circula na conversa local</span>
      </div>
      <span class="widget-link passive-link">com foto quando houver</span>
    </div>
    <div class="sidebar-photo-list">
      ${buildStoryMarkup(sidebarData.buzz)}
    </div>
  `;

  popularPanel.innerHTML = `
    <div class="sidebar-heading">
      <div>
        <p class="widget-title">Mais Vistos do Catalogo</p>
        <span class="widget-source">puxado da cobertura ativa</span>
      </div>
      <span class="widget-link passive-link">atalhos rapidos</span>
    </div>
    <div class="sidebar-photo-list compact">
      ${buildStoryMarkup(sidebarData.popular)}
    </div>
  `;

  commercialPanel.innerHTML = `
    <p class="card-kicker">publicidade local</p>
    <h3>Banner premium, publieditorial e agenda paga</h3>
    <p>
      A terceira coluna agora aguenta divulgacao de evento, festa, curso, clinica,
      loja, campanha e servico com chamada forte e boa permanencia em tela.
    </p>
    <div class="side-pill-row">
      <span class="rail-pill">300 x 600</span>
      <span class="rail-pill">post patrocinado</span>
      <span class="rail-pill">agenda local</span>
    </div>
    <a class="solid-button" href="#monetizacao">Reservar a lateral</a>
  `;

  adsPanel.innerHTML = `
    <p class="card-kicker">ads e divulgacao</p>
    <h3>Espacos prontos para vender</h3>
    <div class="sidebar-ad-grid">
      <a class="ad-slot tall" href="#monetizacao">
        <span>300 x 600</span>
        <strong>Banner vertical premium</strong>
        <small>campanha fixa ao lado da leitura</small>
      </a>
      <a class="ad-slot" href="#monetizacao">
        <span>agenda patrocinada</span>
        <strong>Evento com data, local e CTA</strong>
        <small>festa, show, encontro ou promocao</small>
      </a>
      <a class="ad-slot" href="#monetizacao">
        <span>vitrine local</span>
        <strong>Guia rapido de marcas e servicos</strong>
        <small>entrada enxuta com selo parceiro</small>
      </a>
    </div>
  `;
};

const initializeSidebarWidgets = () => {
  renderSidebarWidgets();
  document
    .querySelectorAll(".side-rail .reveal")
    .forEach((node) => node.classList.add("active"));

  const clockNode = document.querySelector("#live-clock");
  const dateNode = document.querySelector("#live-date");
  const weekdayNode = document.querySelector("#live-weekday");

  const updateClock = () => {
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

  if (clockNode || dateNode || weekdayNode) {
    updateClock();
    setInterval(updateClock, 1000);
  }

  const sidebarSearch = document.querySelector("#sidebar-search");

  if (sidebarSearch) {
    sidebarSearch.addEventListener("input", (event) => {
      const query = event.target.value;

      if (typeof liveFeedQuery !== "undefined" && liveFeedQuery) {
        liveFeedQuery.value = query;
        liveFeedQuery.dispatchEvent(new Event("input"));
      }

      if (typeof renderRadar === "function") {
        renderRadar("todos");
      }
    });
  }

  registerInteractivePanels(document.querySelector(".side-rail"));
};

initializeSidebarWidgets();

const hydrateDynamicNews = async () => {
  try {
    const payload = await requestApiJson("/api/news", { method: "GET" });
    const runtimeItems = Array.isArray(payload.items) ? payload.items : [];

    if (runtimeItems.length === 0) {
      return;
    }

    const merged = syncNewsDataset(runtimeItems);
    const activeFilter = document.querySelector(".chip-button.is-active")?.dataset.filter || "todos";
    renderRadar(activeFilter);
    updateLiveFeedItems(merged);
  } catch (error) {
    // Mantem o fallback estatico quando a API nao estiver ligada.
  }
};

const hydrateCommentsFromApi = async () => {
  try {
    const payload = await requestApiJson("/api/comments", { method: "GET" });
    const comments = Array.isArray(payload.items) ? payload.items : [];

    if (comments.length > 0) {
      renderCommentsFeed(comments.slice(0, 8));
    }
  } catch (error) {
    // Mantem os comentarios estaticos quando a API nao estiver ligada.
  }
};

const attachCommentSubmission = () => {
  if (!publishCommentButton || !opinionInput || !commentsFeed || !charCount) {
    return;
  }

  publishCommentButton.addEventListener("click", async () => {
    const name = commentAuthorInput?.value?.trim() || "";
    const message = opinionInput.value.trim();

    if (name.length < 2) {
      setFeedbackState(commentFeedback, "Escreva um nome ou apelido com pelo menos 2 letras.", "is-error");
      commentAuthorInput?.focus();
      return;
    }

    if (!message) {
      setFeedbackState(commentFeedback, "Escreva sua opiniao antes de enviar.", "is-error");
      opinionInput.focus();
      return;
    }

    publishCommentButton.disabled = true;
    setFeedbackState(commentFeedback, "Enviando comentario...", "");

    try {
      const payload = await requestApiJson("/api/comments", {
        method: "POST",
        body: JSON.stringify({
          name,
          message,
          badge: "Leitor local"
        })
      });

      if (payload.comment) {
        await hydrateCommentsFromApi();
      }

      opinionInput.value = "";
      if (commentAuthorInput) {
        commentAuthorInput.value = "";
      }
      charCount.textContent = "0 / 180";
      setFeedbackState(commentFeedback, "Comentario enviado para a comunidade.", "is-success");
    } catch (error) {
      commentsFeed.prepend(
        buildCommentCard({
          name,
          badge: "Somente local",
          message
        })
      );
      opinionInput.value = "";
      if (commentAuthorInput) {
        commentAuthorInput.value = "";
      }
      charCount.textContent = "0 / 180";
      setFeedbackState(
        commentFeedback,
        "Servidor offline. Seu comentario apareceu so nesta tela por enquanto.",
        "is-error"
      );
    } finally {
      publishCommentButton.disabled = false;
    }
  });
};

const attachSubscriptionSubmission = () => {
  if (!subscriptionForm || !subscriptionEmailInput || !subscriptionPlanInput) {
    return;
  }

  subscriptionForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = subscriptionEmailInput.value.trim();
    const name = subscriptionNameInput?.value?.trim() || "";
    const plan = subscriptionPlanInput.value;

    if (!email) {
      setFeedbackState(subscriptionFeedback, "Preencha o e-mail para assinar.", "is-error");
      subscriptionEmailInput.focus();
      return;
    }

    setFeedbackState(subscriptionFeedback, "Registrando assinatura...", "");

    try {
      await requestApiJson("/api/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          email,
          name,
          plan
        })
      });

      subscriptionForm.reset();
      setFeedbackState(subscriptionFeedback, "Assinatura recebida. Agora o backend ja guardou seu contato.", "is-success");
    } catch (error) {
      setFeedbackState(
        subscriptionFeedback,
        "Nao consegui falar com o backend agora. Ligue o servidor para receber assinaturas reais.",
        "is-error"
      );
    }
  });
};

attachCommentSubmission();
attachSubscriptionSubmission();
hydrateDynamicNews();
hydrateCommentsFromApi();
window.setInterval(hydrateDynamicNews, 300000);
