(function () {
  const qs = (selector) => document.querySelector(selector);
  const cover = qs("[data-cover]");
  const topGrid = qs("[data-top-grid]");
  const socialFeed = qs("[data-social-feed]");
  const socialUpdated = qs("[data-social-updated]");
  const photoRail = qs("[data-photo-rail]");
  const newsGrid = qs("[data-news-grid]");
  const runtimeSources = qs("[data-runtime-sources]");
  const runtimeApproved = qs("[data-runtime-approved]");
  const runtimeBlocked = qs("[data-runtime-blocked]");
  const runtimeNext = qs("[data-runtime-next]");

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const escapeAttr = (value) => escapeHtml(value).replace(/`/g, "&#96;");

  const truncate = (value, limit) => {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length > limit ? `${text.slice(0, limit - 1).trim()}...` : text;
  };

  const fetchJson = (url) =>
    fetch(url, { headers: { Accept: "application/json" } })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null);

  const normalizeArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.news)) return payload.news;
    if (Array.isArray(payload?.articles)) return payload.articles;
    return [];
  };

  const imageOf = (item) =>
    item?.imageUrl ||
    item?.feedImageUrl ||
    item?.sourceImageUrl ||
    item?.media?.url ||
    "";

  const hrefOf = (item) => {
    if (item?.slug) return `./noticia.html?slug=${encodeURIComponent(item.slug)}`;
    return item?.sourceUrl || item?.url || "#";
  };

  const isExternal = (href) => /^https?:\/\//i.test(href);

  const fashionWords = /\b(moda|fashion|look|beleza|style|estilo|make|maquiagem|cabelo|unha|skincare|pele|perfume|sal[aã]o|loja|vitrine|marca|cole[cç][aã]o|tend[eê]ncia|passarela|modelo|ensaio|editorial|styling|creator|criador|influenc|reels|story|stories|instagram|tiktok|acess[oó]rio|bolsa|sand[aá]lia|vestido|alfaiataria|street style)\b/i;
  const hardNewsWords = /\b(morte|homic[ií]dio|estupro|pris[aã]o|crime|viol[eê]ncia|abuso sexual|guerra|arma|fac[cç][aã]o)\b/i;

  const scoreLifestyle = (item) => {
    const haystack = [
      item?.title,
      item?.summary,
      item?.lede,
      item?.category,
      item?.categoryKey,
      item?.sourceName,
      item?.topicGroup,
      item?.coverageLayer
    ].join(" ");
    let score = 0;
    if (fashionWords.test(haystack)) score += 60;
    if (/\b(acre|cruzeiro|jurua|juru[aá]|rio branco|tarauac[aá]|xapuri|sena madureira|brasileia|feij[oó])\b/i.test(haystack)) score += 12;
    if (/\b(evento|festa|show|formatura|feira|lan[cç]amento|campanha|foto|fotografia|social)\b/i.test(haystack) && fashionWords.test(haystack)) score += 18;
    if (imageOf(item)) score += 12;
    if (hardNewsWords.test(haystack)) score -= 90;
    return score;
  };

  const categoryLabel = (item, fallback = "lifestile") =>
    truncate(item?.category || item?.eyebrow || item?.socialPlatform || item?.topicGroup || fallback, 28);

  const fallbackArticles = [
    {
      title: "Como montar um look real no Acre",
      summary: "Calor, chuva, trabalho, faculdade e festa entram juntos na leitura de moda local.",
      category: "moda local",
      sourceName: "Estilo Acre"
    },
    {
      title: "Beleza de salão também é comportamento",
      summary: "Maquiagem, cabelo, unhas e autocuidado viram serviço quando conectados a agenda e profissionais locais.",
      category: "beleza",
      sourceName: "Estilo Acre"
    },
    {
      title: "Criadores de moda e vitrines movimentam a imagem pública da cidade",
      summary: "O radar observa sinais públicos de moda e transforma repercussão em tendência com contexto.",
      category: "moda nas redes",
      sourceName: "Estilo Acre"
    },
    {
      title: "Cinco sinais para saber se uma vitrine local merece matéria",
      summary: "Coleção, campanha, beleza, produção de estilo e presença nas redes indicam quando o comércio vira destaque de moda.",
      category: "vitrine",
      sourceName: "Estilo Acre"
    },
    {
      title: "O guia do look de formatura, show e evento no Acre",
      summary: "A página acompanha vestidos, sandálias, cabelo, maquiagem e acessórios quando aparecem em eventos públicos.",
      category: "eventos de moda",
      sourceName: "Estilo Acre"
    },
    {
      title: "Beleza acreana: cabelo, maquiagem e unha como guia de serviço",
      summary: "Salões, profissionais e tendências entram com leitura útil para quem quer referência local.",
      category: "beleza",
      sourceName: "Estilo Acre"
    },
    {
      title: "Moda de rua em Cruzeiro do Sul: como captar sem forçar",
      summary: "O foco é roupa possível, presença na cidade, clima e combinação com a rotina real.",
      category: "moda de rua",
      sourceName: "Estilo Acre"
    },
    {
      title: "Acessórios que ajudam a contar a moda local",
      summary: "Bolsa, óculos, sandália, bijuteria e cabelo contam tanto quanto a roupa principal.",
      category: "acessórios",
      sourceName: "Estilo Acre"
    },
    {
      title: "Como transformar vídeos curtos de moda em tendência local",
      summary: "O radar procura repetição, estética, serviço, marca local e conversa pública antes de publicar.",
      category: "moda nas redes",
      sourceName: "Estilo Acre"
    }
  ];

  const fashionSeedImages = [
    "linear-gradient(135deg, rgba(240,91,140,.24), rgba(255,248,239,.96) 48%, rgba(31,138,103,.18))",
    "linear-gradient(135deg, rgba(200,141,53,.26), rgba(255,248,239,.96) 52%, rgba(240,91,140,.16))",
    "linear-gradient(135deg, rgba(49,95,155,.2), rgba(255,248,239,.96) 48%, rgba(240,91,140,.18))",
    "linear-gradient(135deg, rgba(31,138,103,.22), rgba(255,248,239,.96) 50%, rgba(200,141,53,.18))"
  ];

  const forbiddenNewsWords = /\b(prefeit|governador|governadora|deputad|vereador|secret[aá]ri|governo|decreto|nomea[cç][aã]o|exonera[cç][aã]o|licen[cç]a ambiental|cnh|capacete|habita[cç][aã]o|sa[uú]de|fazenda|agricultura|processo seletivo|pol[ií]tica|elei[cç][aã]o|pol[ií]cia|pris[aã]o|morte|crime|homic[ií]dio|acidente|enchente|alag|obra p[uú]blica)\b/i;
  const forbiddenLifestyleNoise = /\b(bolsonaro|honda|vidro|fachada|junino|quadrilha|filme|cinema|bbb|show|copa|futebol|v[oô]lei|igreja|santu[aá]rio|orquestra|canal digital|certifica[cç][aã]o|alunos|ambiental|tr[aâ]nsito|web reage|deusa hipnotizante|abre [aá]lbum)\b/i;
  const directFashionWords = /\b(moda|fashion|look|beleza|style|estilo|make|maquiagem|cabelo|unha|skincare|pele|perfume|sal[aã]o|loja|vitrine|marca|cole[cç][aã]o|tend[eê]ncia|passarela|modelo|ensaio|editorial de moda|styling|acess[oó]rio|bolsa|sand[aá]lia|vestido|alfaiataria|street style|transforma[cç][aã]o radical no cabelo)\b/i;

  const isFashionStrict = (item) => {
    const haystack = [
      item?.title,
      item?.summary,
      item?.lede,
      item?.category,
      item?.categoryKey,
      item?.sourceName,
      item?.topicGroup
    ].join(" ");
    const titleText = String(item?.title || "");
    const directText = [item?.title, item?.summary, item?.lede, item?.category, item?.categoryKey].join(" ");
    const isSeed = String(item?.id || "").startsWith("fashion-seed-") || item?.sourceName === "Estilo Acre";
    return (isSeed || directFashionWords.test(titleText)) && !forbiddenNewsWords.test(haystack) && !forbiddenLifestyleNoise.test(directText);
  };

  const expandFashionSeeds = (min = 28) => {
    const seeds = [];
    while (seeds.length < min) {
      const source = fallbackArticles[seeds.length % fallbackArticles.length];
      seeds.push({
        ...source,
        id: `fashion-seed-${seeds.length}`,
        slug: "",
        sourceUrl: "#guia",
        seedImage: fashionSeedImages[seeds.length % fashionSeedImages.length]
      });
    }
    return seeds;
  };

  const mergeUnique = (...groups) => {
    const seen = new Set();
    return groups.flat().filter((item) => {
      const key = item?.id || item?.slug || item?.sourceUrl || item?.title;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const pickArticles = (items, min = 16) => {
    const ranked = [...items]
      .filter(isFashionStrict)
      .map((item) => ({ item, score: scoreLifestyle(item) }))
      .sort((a, b) => b.score - a.score)
      .filter((entry) => entry.score > 35)
      .map((entry) => entry.item);
    while (ranked.length < min) {
      ranked.push(expandFashionSeeds(min)[ranked.length]);
    }
    return ranked;
  };

  const updateRuntimeBoard = (rawItems, approvedItems, socialItems) => {
    if (runtimeSources) runtimeSources.textContent = String(4 + (socialItems.length ? 1 : 0));
    if (runtimeApproved) runtimeApproved.textContent = String(Math.min(approvedItems.length, 99));
    if (runtimeBlocked) runtimeBlocked.textContent = String(Math.max(0, rawItems.length - rawItems.filter(isFashionStrict).length));
    if (runtimeNext) {
      const next = new Date(Date.now() + 24 * 60 * 60 * 1000);
      runtimeNext.textContent = next.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }
  };

  const renderCover = (articles) => {
    if (!cover) return;
    const lead = articles.find((item) => imageOf(item)) || articles[0];
    const image = imageOf(lead);
    const art = cover.querySelector(".hero-art");
    const title = cover.querySelector(".hero-copy h1");
    const summary = cover.querySelector(".hero-copy p:not(.style-kicker)");
    const action = cover.querySelector(".hero-actions a");
    if (image && art) {
      art.classList.add("has-photo");
      art.style.setProperty("--hero-image", `url("${image.replace(/"/g, "%22")}")`);
    } else if (lead?.seedImage && art) {
      art.classList.remove("has-photo");
      art.style.setProperty("--hero-image", lead.seedImage);
    }
    if (title) title.textContent = lead?.title || "O Acre agora tem uma editoria de moda de verdade.";
    if (summary) summary.textContent = truncate(lead?.summary || lead?.lede || "Moda, beleza, vitrines, criadores e novidades públicas entram em leitura local.", 220);
    if (action) {
      const href = hrefOf(lead);
      action.href = href;
      if (isExternal(href)) {
        action.target = "_blank";
        action.rel = "noreferrer";
      }
      action.textContent = "Abrir destaque";
    }
  };

  const renderTopGrid = (articles) => {
    if (!topGrid) return;
    topGrid.innerHTML = articles.slice(0, 3).map((item) => {
      const href = hrefOf(item);
      const image = imageOf(item);
      const attrs = isExternal(href) ? ' target="_blank" rel="noreferrer"' : "";
      const style = image
        ? ` style="--story-image:url('${escapeAttr(image)}')"`
        : item.seedImage
          ? ` style="--story-image:${escapeAttr(item.seedImage)}"`
          : "";
      return `
        <a class="story-card" href="${escapeAttr(href)}"${attrs}${style}>
          <span>${escapeHtml(categoryLabel(item))}</span>
          <strong>${escapeHtml(truncate(item.title, 105))}</strong>
          <p>${escapeHtml(truncate(item.summary || item.lede, 150))}</p>
        </a>
      `;
    }).join("");
  };

  const renderPhotoRail = (articles) => {
    if (!photoRail) return;
    const photos = articles.filter((item) => imageOf(item)).slice(0, 12);
    const seedPhotos = expandFashionSeeds(12 - photos.length);
    photoRail.innerHTML = photos.map((item) => {
      const href = hrefOf(item);
      const attrs = isExternal(href) ? ' target="_blank" rel="noreferrer"' : "";
      return `
        <a class="photo-card" href="${escapeAttr(href)}"${attrs}>
          <img src="${escapeAttr(imageOf(item))}" alt="" loading="lazy" decoding="async" />
          <span>${escapeHtml(truncate(item.title, 54))}</span>
        </a>
      `;
    }).join("") + seedPhotos.map((item) => `
      <a class="photo-card photo-card-seed" href="#guia">
        <span>${escapeHtml(truncate(item.title, 54))}</span>
      </a>
    `).join("");
  };

  const renderNewsGrid = (articles) => {
    if (!newsGrid) return;
    newsGrid.innerHTML = articles.slice(0, 24).map((item) => {
      const href = hrefOf(item);
      const attrs = isExternal(href) ? ' target="_blank" rel="noreferrer"' : "";
      const image = imageOf(item);
      const seedStyle = !image && item.seedImage ? ` style="background:${escapeAttr(item.seedImage)}"` : "";
      return `
        <a class="article-card" href="${escapeAttr(href)}"${attrs}>
          <figure${seedStyle}>${image ? `<img src="${escapeAttr(image)}" alt="" loading="lazy" decoding="async" />` : ""}</figure>
          <div class="article-card-content">
            <em>${escapeHtml(categoryLabel(item))}</em>
            <h3>${escapeHtml(truncate(item.title, 92))}</h3>
            <p>${escapeHtml(truncate(item.summary || item.lede || "Artigo em curadoria pelo Estilo Acre.", 134))}</p>
            <footer>${escapeHtml(truncate(item.sourceName || "Estilo Acre", 42))}</footer>
          </div>
        </a>
      `;
    }).join("");
  };

  const renderSocialFeed = (socialItems, articles) => {
    if (!socialFeed) return;
    const articleSignals = articles
      .filter((item) => scoreLifestyle(item) > 35 && isFashionStrict(item))
      .slice(0, 8)
      .map((item) => ({
        title: item.title,
        summary: item.summary || item.lede || "Sinal de moda do radar editorial do portal.",
        sourceName: item.sourceName || "Portal",
        sourceUrl: hrefOf(item),
        socialPlatform: "Moda no portal",
        publishedAt: item.publishedAt || item.date
      }));
    const fallbackSocial = expandFashionSeeds(14).map((item, index) => ({
      id: `fashion-social-seed-${index}`,
      title: item.title,
      summary: item.summary,
      sourceName: "Estilo Acre",
      sourceUrl: item.sourceUrl,
      socialPlatform: ["Instagram", "TikTok", "Vitrine", "Beleza"][index % 4],
      publishedAt: new Date(Date.now() - index * 45 * 60 * 1000).toISOString()
    }));
    const merged = mergeUnique(articleSignals, fallbackSocial).slice(0, 14);
    if (socialUpdated) {
      const latest = merged.find((item) => item.publishedAt || item.date);
      socialUpdated.textContent = latest ? `atualizado ${formatDate(latest.publishedAt || latest.date)}` : "radar social ativo";
    }
    socialFeed.innerHTML = merged.map((item, index) => {
      const href = item.sourceUrl || item.url || "#";
      const attrs = isExternal(href) ? ' target="_blank" rel="noreferrer"' : "";
      return `
        <a class="social-item" href="${escapeAttr(href)}"${attrs}>
          <b class="social-rank">${String(index + 1).padStart(2, "0")}</b>
          <span>${escapeHtml(item.socialPlatform || item.category || "sinal social")}</span>
          <small>${escapeHtml(formatDate(item.publishedAt || item.date))}</small>
          <strong>${escapeHtml(truncate(item.title, 82))}</strong>
          <small>${escapeHtml(truncate(item.summary || item.sourceName || "Tendência pública em monitoramento.", 120))}</small>
        </a>
      `;
    }).join("");
  };

  const formatDate = (value) => {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return "agora";
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  Promise.all([
    fetchJson("./api/news?limit=80"),
    fetchJson("./api/topic-feed?topic=buzz&limit=30"),
    fetchJson("./api/topic-feed?topic=culture&limit=20"),
    fetchJson("./api/social-trends"),
    fetchJson("./data/runtime-news.json"),
    fetchJson("./data/social-trends-cache.json")
  ]).then(([apiNews, buzz, culture, apiSocial, runtimeNews, socialCache]) => {
    const articles = pickArticles(
      mergeUnique(
        normalizeArray(apiNews),
        normalizeArray(buzz),
        normalizeArray(culture),
        normalizeArray(runtimeNews)
      ),
      28
    );
    const socialItems = mergeUnique(normalizeArray(apiSocial), normalizeArray(socialCache));
    const rawItems = mergeUnique(normalizeArray(apiNews), normalizeArray(buzz), normalizeArray(culture), normalizeArray(runtimeNews));
    updateRuntimeBoard(rawItems, articles, socialItems);
    renderCover(articles);
    renderTopGrid(articles.slice(1));
    renderSocialFeed(socialItems, articles);
    renderPhotoRail(articles);
    renderNewsGrid(articles);
  }).catch(() => {
    const articles = pickArticles(fallbackArticles, 28);
    updateRuntimeBoard(fallbackArticles, articles, []);
    renderCover(articles);
    renderTopGrid(articles);
    renderSocialFeed([], articles);
    renderPhotoRail(articles);
    renderNewsGrid(articles);
  });
})();
