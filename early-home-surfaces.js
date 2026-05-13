(function () {
  const isCompactBoot =
    typeof window.matchMedia === "function" && window.matchMedia("(max-width: 820px)").matches;
  const requestNewsPayload = () => {
    if (typeof window.__CATALOGO_START_NEWS_PRELOAD__ === "function") {
      return window.__CATALOGO_START_NEWS_PRELOAD__();
    }

    return window.location.protocol !== "file:"
      ? fetch("./api/news", { credentials: "same-origin" })
          .then((response) => (response.ok ? response.json() : null))
          .catch(() => null)
      : Promise.resolve(null);
  };
  const newsPromise =
    window.__CATALOGO_NEWS_PRELOAD__ && typeof window.__CATALOGO_NEWS_PRELOAD__.then === "function"
      ? window.__CATALOGO_NEWS_PRELOAD__
      : isCompactBoot
        ? new Promise((resolve) => {
            window.setTimeout(() => {
              Promise.resolve(requestNewsPayload()).then(resolve).catch(() => resolve(null));
            }, 520);
          })
        : requestNewsPayload();

  const normalizeText = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const escapeAttr = escapeHtml;

  const truncate = (value, max = 120) => {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length > max ? `${text.slice(0, Math.max(0, max - 1)).trim()}…` : text;
  };

  const cleanPublicSummary = (value = "") =>
    String(value || "")
      .replace(
        /\s+e\s+o ponto principal da atualiza[cç][aã]o captada automaticamente\.?\s*O portal organiza o material para leitura r[aá]pida e mant[eé]m o link da fonte original para acompanhamento completo\.?/gi,
        ". O portal resume o caso e mantém o link da fonte original para acompanhamento."
      )
      .replace(/\s+/g, " ")
      .trim();

  const asItems = (payload) => (Array.isArray(payload?.items) ? payload.items : []);

  const getArticleText = (item = {}) =>
    normalizeText(
      [
        item.title,
        item.summary,
        item.displaySummary,
        item.lede,
        item.description,
        item.category,
        item.sourceName,
        item.sourceLabel
      ].join(" ")
    );

  const getHref = (item = {}) => {
    if (item.slug) {
      return `./noticia.html?slug=${encodeURIComponent(item.slug)}`;
    }

    if (/^https?:\/\//i.test(item.sourceUrl || item.url || "")) {
      return item.sourceUrl || item.url;
    }

    const query = item.title || item.category || "noticias";
    return `./arquivo.html?busca=${encodeURIComponent(query)}`;
  };

  const getLinkAttrs = (href = "") => (/^https?:\/\//i.test(href) ? ' target="_blank" rel="noreferrer"' : "");

  const getSummary = (item = {}, max = 130) =>
    truncate(
      cleanPublicSummary(
        item.displaySummary ||
          item.summary ||
          item.lede ||
          item.description ||
          "Leia o resumo, veja a fonte e abra a matéria completa."
      ),
      max
    );

  const getDateLabel = (item = {}) => {
    const raw = item.publishedAt || item.date || item.createdAt || "";
    const date = raw ? new Date(raw) : null;
    if (!date || Number.isNaN(date.getTime())) {
      return item.sourceName || "agora";
    }

    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
  };

  const getSafeImageStyle = (item = {}) => {
    const raw = item.imageUrl || item.image || item.thumbnail || item.photoUrl || "";
    if (!/^(https?:\/\/|\.\/|\/|assets\/)/i.test(raw)) {
      return "";
    }

    const safeUrl = raw.replace(/[\\'")]/g, "");
    return ` style="--premium-image:url('${escapeAttr(safeUrl)}')"`;
  };

  const dedupe = (items = []) => {
    const seen = new Set();
    return items.filter((item) => {
      const key = normalizeText(item.slug || item.sourceUrl || item.url || item.title);
      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return Boolean(item.title);
    });
  };

  const scoreItem = (item = {}) => {
    const text = getArticleText(item);
    let score = Date.parse(item.publishedAt || item.date || item.createdAt || "") || 0;
    if (/\b(cruzeiro do sul|vale do jurua|jurua|juru[aá]|mancio lima|rodrigues alves|porto walter|marechal)\b/.test(text)) {
      score += 900000000000;
    }
    if (/\b(alerta|cheia|enchente|rio|chuva|defesa civil|transito|servico|saude|hospital|energia|agua|br-364)\b/.test(text)) {
      score += 450000000000;
    }
    if (/\b(governo|prefeitura|secretaria|assembleia|acre)\b/.test(text)) {
      score += 180000000000;
    }
    return score;
  };

  const pick = (items, matcher, limit) =>
    dedupe(items)
      .filter((item) => (typeof matcher === "function" ? matcher(item) : true))
      .sort((left, right) => scoreItem(right) - scoreItem(left))
      .slice(0, limit);

  const isProcurementNoise = (item) =>
    /\b(licitacao|licita[cç][aã]o|cotacao|cota[cç][aã]o|pregao|preg[aã]o|edital|contratacao|contrata[cç][aã]o|fornecimento|precos|pre[cç]os|pessoa juridica|jur[ií]dica|registro de preco|registro de pre[cç]o)\b/.test(
      getArticleText(item)
    );

  const isClimate = (item) =>
    !isProcurementNoise(item) &&
    /\b(clima|tempo|chuva|cheia|enchente|alag|rio|jurua|juru[aá]|defesa civil|cota|alerta|transito|tr[aâ]nsito|br-364|energia|abastecimento|agua|saude|saúde|hospital)\b/.test(
      getArticleText(item)
    );

  const isPublicAlert = (item) =>
    !isProcurementNoise(item) &&
    /\b(acidente|vitima|v[ií]tima|morte|ferid|hospital|samu|policia|pol[ií]cia|bombeiro|defesa civil|transito|tr[aâ]nsito|rodovia|br-364|ponte|energia|abastecimento|agua|[áa]gua|atendimento|interdit|emergencia|emerg[eê]ncia|alerta)\b/.test(
      getArticleText(item)
    );

  const isEvent = (item) =>
    /\b(show|festa|festival|evento|agenda|cultura|musica|música|teatro|cavalgada|feira|programacao|programa[cç][aã]o|oficina|expoacre|expojurua|expojuru[aá]|artista)\b/.test(
      getArticleText(item)
    );

  const isAnalysis = (item) =>
    /\b(coluna|opiniao|opini[aã]o|analise|an[aá]lise|impacto|politica|pol[ií]tica|economia|governo|assembleia|aleac)\b/.test(
      getArticleText(item)
    );

  const hydrateClimate = (items) => {
    const section = document.querySelector("#clima-alertas");
    const stack = section?.querySelector(".premium-alert-stack");
    if (!section || !stack) {
      return 0;
    }

    const climateRows = pick(items, isClimate, 3);
    const alertRows = climateRows.length < 3 ? pick(items, isPublicAlert, 3) : [];
    const rows = dedupe([...climateRows, ...alertRows]).slice(0, 3);
    if (!rows.length) {
      return 0;
    }

    const classes = ["alert-high", "alert-mid", "alert-ok"];
    const labels = ["Alerta principal", "Atenção no dia", "Serviço público"];
    stack.innerHTML = rows
      .map((item, index) => {
        const href = getHref(item);
        return `<a class="premium-alert-row ${classes[index] || "alert-mid"}" href="${escapeAttr(href)}"${getLinkAttrs(href)}><span></span><div><small>${labels[index] || "Atualização"}</small><strong>${escapeHtml(
          truncate(item.title, 96)
        )}</strong><p>${escapeHtml(getSummary(item, 132))}</p></div><em>${escapeHtml(getDateLabel(item))}</em></a>`;
      })
      .join("");

    const weatherCopy = section.querySelector(".premium-weather-card > div p");
    const riverStatus = section.querySelector(".premium-weather-card li:nth-child(3) strong");
    if (weatherCopy) {
      weatherCopy.textContent = `Última atualização: ${truncate(rows[0].title, 118)}`;
    }
    if (riverStatus) {
      riverStatus.textContent = rows.some((item) => /\b(cheia|enchente|rio|cota|alag)\b/.test(getArticleText(item)))
        ? "Atenção"
        : "Monitorado";
    }
    return rows.length;
  };

  const hydrateAgenda = (items) => {
    return 0;
  };

  const hydrateBottomNews = (items) => {
    const panels = document.querySelectorAll("#trending.premium-bottom-news .premium-bottom-grid > section");
    const latestPanel = panels[0];
    const columnsPanel = panels[1];
    let count = 0;

    if (latestPanel) {
      const latest = pick(items, null, 4);
      if (latest.length) {
        latestPanel.querySelectorAll(".premium-news-row").forEach((node) => node.remove());
        latestPanel.insertAdjacentHTML(
          "beforeend",
          latest
            .map((item) => {
              const href = getHref(item);
              return `<a class="premium-news-row" href="${escapeAttr(href)}"${getLinkAttrs(href)}><span${getSafeImageStyle(
                item
              )}></span><small>${escapeHtml(item.category || "Notícia")}</small><strong>${escapeHtml(
                truncate(item.title, 96)
              )}</strong><em>${escapeHtml(getDateLabel(item))}</em><i>Ler matéria</i></a>`;
            })
            .join("")
        );
        count += latest.length;
      }
    }

    if (columnsPanel) {
      const columns = pick(items, isAnalysis, 3);
      if (columns.length) {
        columnsPanel.querySelectorAll(".premium-column-row").forEach((node) => node.remove());
        columnsPanel.insertAdjacentHTML(
          "beforeend",
          columns
            .map((item) => {
              const href = getHref(item);
              const initials = escapeHtml(String(item.sourceName || item.category || "AN").slice(0, 2).toUpperCase());
              return `<a class="premium-column-row" href="${escapeAttr(href)}"${getLinkAttrs(href)}><b>${initials}</b><span><small>${escapeHtml(
                item.category || "Contexto"
              )}</small><strong>${escapeHtml(truncate(item.title, 104))}</strong></span><i>Abrir artigo</i></a>`;
            })
            .join("")
        );
        count += columns.length;
      }
    }

    return count;
  };

  newsPromise.then((payload) => {
    const items = asItems(payload);
    if (!items.length) {
      return;
    }

    const updated = hydrateClimate(items) + hydrateAgenda(items) + hydrateBottomNews(items);
    window.__CATALOGO_EARLY_SURFACES_READY__ = {
      at: Date.now(),
      items: items.length,
      updated
    };
    if (window.performance?.mark) {
      window.performance.mark("catalogo-early-surfaces-ready");
    }
  });
})();
