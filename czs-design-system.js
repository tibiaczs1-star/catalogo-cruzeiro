/* CZS Official Design System JS v20260603-official-ds1
   Enriquecimento progressivo: não remove fluxos legados, mas torna o DS oficial a camada final. */
(function () {
  "use strict";

  const STATE = {
    lastSlug: "",
    schemaId: "czs-official-schema"
  };

  const text = (value) => String(value || "").replace(/\s+/g, " ").trim();
  const slugify = (value) => text(value).toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "secao";

  const absoluteUrl = (value) => {
    try { return new URL(value || window.location.href, window.location.href).href; }
    catch (_error) { return String(value || ""); }
  };

  const getArticle = () => window.__CURRENT_ARTICLE__ || window.__ARTICLE__ || window.currentArticle || null;

  const getArticleParagraphs = (article) => {
    const blocks = [];
    if (Array.isArray(article?.body)) blocks.push(...article.body);
    if (typeof article?.body === "string") blocks.push(...article.body.split(/\n{2,}/));
    if (Array.isArray(article?.paragraphs)) blocks.push(...article.paragraphs);
    if (Array.isArray(article?.development)) blocks.push(...article.development);
    const domParagraphs = Array.from(document.querySelectorAll("#detail-content p")).map((p) => p.textContent);
    blocks.push(...domParagraphs);
    return blocks.map(text).filter(Boolean);
  };

  const readingStats = (article) => {
    const source = [article?.title, article?.lede, article?.summary, ...getArticleParagraphs(article)].join(" ");
    const words = text(source).split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 210));
    return { words, minutes };
  };

  const formatDate = (value) => {
    if (!value) return "Atualização em acompanhamento";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return text(value);
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(date);
  };

  const ensureElement = (id, tag, className, parent) => {
    let node = document.getElementById(id);
    if (!node) {
      node = document.createElement(tag || "div");
      node.id = id;
      if (className) node.className = className;
      (parent || document.body).appendChild(node);
    }
    return node;
  };

  const escapeHtml = (value) => text(value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");

  function renderArticleBreadcrumbs(article) {
    const nav = ensureElement("article-breadcrumbs", "nav", "article-breadcrumbs", document.querySelector("#detail-shell"));
    nav.setAttribute("aria-label", "Caminho da matéria");
    const category = text(article?.category) || "Notícia";
    nav.innerHTML = `<ol>
      <li><a href="./index.html?skipIntro=1">Início</a></li>
      <li><a href="./arquivo.html">Arquivo</a></li>
      <li><span>${escapeHtml(category)}</span></li>
    </ol>`;
  }

  function renderArticleByline(article) {
    const meta = ensureElement("article-byline", "div", "article-meta-grid", document.querySelector("#detail-title")?.parentElement);
    const stats = readingStats(article);
    const author = text(article?.authorName || article?.author || "Redação CZS");
    const source = text(article?.sourceName);
    const published = article?.publishedAt || article?.date;
    meta.innerHTML = `
      <span>Por <strong>${escapeHtml(author)}</strong>${source ? `, com fonte ${escapeHtml(source)}` : ""}</span>
      <time id="article-published-time" datetime="${escapeHtml(published || "")}">${escapeHtml(formatDate(published))}</time>
      <span class="article-reading-time" id="article-reading-time">${stats.minutes} min de leitura</span>
    `;
  }

  function renderArticleShare(article) {
    const share = ensureElement("article-share", "div", "article-share", document.querySelector("#article-byline")?.parentElement);
    share.setAttribute("aria-label", "Compartilhar matéria");
    const url = absoluteUrl(article?.slug ? `./noticia.html?slug=${encodeURIComponent(article.slug)}` : window.location.href);
    const title = text(article?.title || document.title);
    const encUrl = encodeURIComponent(url);
    const encTitle = encodeURIComponent(title);
    share.innerHTML = `
      <span>Compartilhar</span>
      <a href="https://api.whatsapp.com/send?text=${encTitle}%20${encUrl}" target="_blank" rel="noreferrer">WhatsApp</a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${encUrl}" target="_blank" rel="noreferrer">Facebook</a>
      <a href="https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}" target="_blank" rel="noreferrer">X</a>
      <button type="button" data-czs-copy-link>Copiar link</button>
    `;
    share.querySelector("[data-czs-copy-link]")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      try {
        await navigator.clipboard.writeText(url);
        button.textContent = "Link copiado";
      } catch (_error) {
        window.prompt("Copie o link da matéria", url);
      }
    }, { once: true });
  }

  function renderArticleToc(article) {
    const parent = document.querySelector("#detail-content")?.parentElement || document.querySelector("#detail-shell");
    const toc = ensureElement("article-toc", "nav", "article-toc", parent);
    toc.setAttribute("aria-label", "Índice da matéria");
    const entries = [];
    const lede = document.querySelector("#detail-lede");
    if (lede && text(lede.textContent)) { lede.id = lede.id || "resumo-da-materia"; entries.push(["Resumo", lede.id]); }
    const fact = document.querySelector("#detail-fact-tabs-title");
    if (fact) { fact.id = fact.id || "checagem-da-materia"; entries.push(["Checagem", fact.id]); }
    const content = document.querySelector("#detail-content");
    if (content) { content.id = content.id || "conteudo-da-materia"; entries.push(["Texto completo", content.id]); }
    const source = document.querySelector("#detail-source-name");
    if (source) { source.id = source.id || "fonte-da-materia"; entries.push(["Fonte", source.id]); }
    if (!entries.length) { toc.hidden = true; return; }
    toc.hidden = false;
    toc.innerHTML = `<strong>Índice rápido</strong><ol>${entries.map(([label, id]) => {
      const safeId = String(id || "").replace(/[^A-Za-z0-9_-]/g, "-");
      const href = "#" + safeId;
      return `<li><a href="${href}">${escapeHtml(label)}</a></li>`;
    }).join("")}</ol>`;
  }

  function renderArticleFaq(article) {
    const container = ensureElement("article-faq", "section", "article-faq czs-card", document.querySelector("#detail-shell"));
    container.setAttribute("aria-labelledby", "article-faq-title");
    const source = text(article?.sourceName || "a fonte consultada");
    const category = text(article?.category || "notícia");
    const explicit = Array.isArray(article?.faq) ? article.faq : [];
    const fallback = [
      { question: "O que foi confirmado nesta matéria?", answer: text(article?.lede || article?.summary || "A matéria reúne o fato principal, a fonte e o contexto mínimo para o leitor acompanhar a atualização.") },
      { question: "Por que isso importa para o Vale do Juruá?", answer: `O CZS prioriza impacto local, serviço público e contexto regional. Esta atualização entra como ${category.toLowerCase()} e mantém a origem em ${source}.` }
    ];
    const faq = (explicit.length ? explicit : fallback)
      .map((item) => ({ question: text(item.question || item.q), answer: text(item.answer || item.a) }))
      .filter((item) => item.question && item.answer)
      .slice(0, 4);
    if (!faq.length) { container.hidden = true; return; }
    container.hidden = false;
    container.innerHTML = `<p class="eyebrow">FAQ</p><h2 id="article-faq-title">Perguntas rápidas</h2>${faq.map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join("")}`;
    container.__czsFaqItems = faq;
  }

  function renderArticleRelated(article) {
    const container = ensureElement("article-related", "section", "article-related czs-card", document.querySelector("#detail-shell"));
    container.setAttribute("aria-labelledby", "article-related-title");
    const currentSlug = text(article?.slug);
    const category = text(article?.category).toLowerCase();
    const pool = Array.isArray(window.NEWS_DATA) ? window.NEWS_DATA : [];
    const related = pool
      .filter((item) => item && text(item.slug) && text(item.slug) !== currentSlug)
      .sort((a, b) => {
        const ac = category && text(a.category).toLowerCase() === category ? 0 : 1;
        const bc = category && text(b.category).toLowerCase() === category ? 0 : 1;
        return ac - bc;
      })
      .slice(0, 4);
    if (!related.length) { container.hidden = true; return; }
    container.hidden = false;
    container.innerHTML = `<p class="eyebrow">Relacionadas</p><h2 id="article-related-title">Continue acompanhando</h2><div class="article-related-grid">${related.map((item) => `
      <a class="article-related-card" href="./noticia.html?slug=${encodeURIComponent(item.slug)}">
        <span>${escapeHtml(item.category || "Notícia")}</span>
        <strong>${escapeHtml(item.title || "Matéria relacionada")}</strong>
        <small>${escapeHtml(formatDate(item.publishedAt || item.date))}</small>
      </a>`).join("")}</div>`;
  }

  function buildOfficialSchemaGraph(article) {
    const url = absoluteUrl(article?.slug ? `./noticia.html?slug=${encodeURIComponent(article.slug)}` : window.location.href);
    const stats = readingStats(article);
    const faqItems = document.querySelector("#article-faq")?.__czsFaqItems || [];
    const published = article?.publishedAt || article?.date || new Date().toISOString();
    const image = absoluteUrl(article?.imageUrl || article?.feedImageUrl || article?.sourceImageUrl || "./assets/og-cover.svg");
    const org = {
      "@type": "NewsMediaOrganization",
      "@id": absoluteUrl("./#organization"),
      name: "Catálogo Cruzeiro do Sul",
      url: absoluteUrl("./"),
      areaServed: "Cruzeiro do Sul, Vale do Juruá e Acre",
      inLanguage: "pt-BR"
    };
    const graph = [
      org,
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumbs`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: absoluteUrl("./") },
          { "@type": "ListItem", position: 2, name: "Arquivo", item: absoluteUrl("./arquivo.html") },
          { "@type": "ListItem", position: 3, name: text(article?.category || "Notícia"), item: url }
        ]
      },
      {
        "@type": "NewsArticle",
        "@id": `${url}#article`,
        headline: text(article?.title || document.title),
        description: text(article?.lede || article?.summary || document.querySelector("#detail-lede")?.textContent),
        image: [image],
        url,
        mainEntityOfPage: url,
        datePublished: published,
        dateModified: article?.modifiedAt || published,
        articleSection: text(article?.category || "Notícia"),
        articleBody: getArticleParagraphs(article).join("\n\n"),
        wordCount: stats.words,
        timeRequired: `PT${stats.minutes}M`,
        inLanguage: "pt-BR",
        publisher: { "@id": org["@id"] },
        author: { "@type": "Organization", name: text(article?.authorName || article?.author || "Redação CZS") },
        isAccessibleForFree: true
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: text(article?.title || document.title),
        breadcrumb: { "@id": `${url}#breadcrumbs` },
        primaryImageOfPage: { "@type": "ImageObject", url: image }
      }
    ];
    if (faqItems.length) {
      graph.push({
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer }
        }))
      });
    }
    return { "@context": "https://schema.org", "@graph": graph };
  }

  function renderOfficialSchema(article) {
    let script = document.getElementById(STATE.schemaId);
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = STATE.schemaId;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(buildOfficialSchemaGraph(article));
  }

  function enhanceArticleTemplate() {
    const shell = document.querySelector("#detail-shell");
    const article = getArticle();
    if (!shell || !article || !text(article.slug || article.title)) return false;
    const key = text(article.slug || article.title);
    if (STATE.lastSlug === key && shell.dataset.czsOfficialEnhanced === "1") return true;
    STATE.lastSlug = key;
    shell.dataset.czsArticleTemplate = "official";
    shell.dataset.czsOfficialEnhanced = "1";
    shell.classList.add("czs-article-template");
    renderArticleBreadcrumbs(article);
    renderArticleByline(article);
    renderArticleShare(article);
    renderArticleToc(article);
    renderArticleFaq(article);
    renderArticleRelated(article);
    renderOfficialSchema(article);
    return true;
  }

  function enhanceGlobalShell() {
    document.body?.classList.add("czs-official-system");
    document.documentElement.dataset.czsDesignSystem = "official-20260603";
    document.querySelectorAll("main").forEach((main) => main.setAttribute("data-czs-layout", main.getAttribute("data-czs-layout") || "official"));
  }

  function boot() {
    enhanceGlobalShell();
    enhanceArticleTemplate();
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      const ok = enhanceArticleTemplate();
      if (ok || attempts > 40) window.clearInterval(timer);
    }, 150);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  window.CZSDesignSystem = Object.freeze({
    version: "20260603-official-ds1",
    enhanceArticleTemplate,
    renderArticleRelated,
    renderArticleFaq,
    buildOfficialSchemaGraph
  });
})();
