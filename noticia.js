const params = new URLSearchParams(window.location.search);
const OFFLINE_NEWS_CACHE_KEY = "catalogo_news_cache_v1";
const OFFLINE_LAST_ARTICLE_KEY = "catalogo_last_article_v1";
const SKIP_HOME_INTRO_KEY = "catalogo_skip_home_intro_once";
const HOME_RETURN_URL = "./index.html?skipIntro=1";
const DETAIL_FALLBACK_IMAGES = [];

const normalizeSlug = (value) => {
  let raw = String(value || "").trim();

  try {
    raw = decodeURIComponent(raw);
  } catch (_error) {
    // URLSearchParams already decodes values in modern browsers.
  }

  return raw
    .split(/[?#&\s]/)[0]
    .replace(/^\/+|\/+$/g, "")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
};

const getSlugFromLocation = () => {
  const fromQuery = params.get("slug") || params.get("id");
  if (fromQuery) {
    return normalizeSlug(fromQuery);
  }

  const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return normalizeSlug(fromHash.get("slug") || fromHash.get("id"));
};

const slug = getSlugFromLocation();

if (document.body) {
  document.body.classList.add("site-loaded");
}

try {
  sessionStorage.setItem(SKIP_HOME_INTRO_KEY, "1");
} catch (_error) {
  // Ignora ambientes sem sessionStorage.
}

const titleNode = document.querySelector("#detail-title");
const eyebrowNode = document.querySelector("#detail-eyebrow");
const metaNode = document.querySelector("#detail-meta");
const thumbNode = document.querySelector("#detail-thumb");
const categoryNode = document.querySelector("#detail-category");
const ledeNode = document.querySelector("#detail-lede");
const contentNode = document.querySelector("#detail-content");
const sourceNameNode = document.querySelector("#detail-source-name");
const sourceLabelNode = document.querySelector("#detail-source-label");
const sourceLinkNode = document.querySelector("#detail-source-link");
const mediaKindNode = document.querySelector("#detail-media-kind");
const mediaNoteNode = document.querySelector("#detail-media-note");
const mediaLinkNode = document.querySelector("#detail-media-link");
const highlightsNode = document.querySelector("#detail-highlights");
const analysisContainer = document.querySelector("#detail-analysis-container");
const analysisText = document.querySelector("#detail-analysis");
const metaDescriptionNode = document.querySelector("#meta-description");
const metaRobotsNode = document.querySelector("#meta-robots");
const canonicalNode = document.querySelector("#meta-canonical");
const ogTitleNode = document.querySelector("#og-title");
const ogDescriptionNode = document.querySelector("#og-description");
const ogImageNode = document.querySelector("#og-image");
const ogUrlNode = document.querySelector("#og-url");
const twitterTitleNode = document.querySelector("#twitter-title");
const twitterDescriptionNode = document.querySelector("#twitter-description");
const twitterImageNode = document.querySelector("#twitter-image");
const structuredDataNode = document.querySelector("#article-structured-data");
let detailHeroRequestId = 0;
const DEFAULT_OG_IMAGE = "./assets/og-cover.svg";

const truncateSeoText = (value, limit = 180) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - 3)).trim()}...`;
};

const toAbsoluteUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    return new URL(raw, window.location.href).href;
  } catch (_error) {
    return raw;
  }
};

const updateArticleSeo = (article, options = {}) => {
  const indexable = options.indexable !== false;
  const pageTitle = article?.title
    ? `Catalogo Cruzeiro do Sul | ${article.title}`
    : "Catalogo Cruzeiro do Sul | Noticia";
  const description = truncateSeoText(
    article?.lede ||
      article?.summary ||
      article?.analysis ||
      "Pagina interna do Catalogo Cruzeiro do Sul com resumo editorial, contexto e link para a fonte consultada."
  );
  const canonicalHref = article?.slug
    ? toAbsoluteUrl(`./noticia.html?slug=${encodeURIComponent(article.slug)}`)
    : toAbsoluteUrl("./noticia.html");
  const imageHref = toAbsoluteUrl(
    article?.imageUrl || article?.feedImageUrl || article?.sourceImageUrl || DEFAULT_OG_IMAGE
  );

  document.title = pageTitle;

  if (metaDescriptionNode) {
    metaDescriptionNode.setAttribute("content", description);
  }

  if (metaRobotsNode) {
    metaRobotsNode.setAttribute(
      "content",
      indexable ? "index,follow,max-image-preview:large" : "noindex,nofollow"
    );
  }

  if (canonicalNode) {
    canonicalNode.setAttribute("href", canonicalHref);
  }

  [
    [ogTitleNode, pageTitle],
    [twitterTitleNode, pageTitle],
    [ogDescriptionNode, description],
    [twitterDescriptionNode, description],
    [ogImageNode, imageHref],
    [twitterImageNode, imageHref],
    [ogUrlNode, canonicalHref]
  ].forEach(([node, value]) => {
    if (node) {
      node.setAttribute("content", value);
    }
  });

  if (structuredDataNode) {
    const payload = {
      "@context": "https://schema.org",
      "@type": indexable ? "NewsArticle" : "WebPage",
      headline: article?.title || "Catalogo Cruzeiro do Sul",
      description,
      image: [imageHref],
      url: canonicalHref,
      mainEntityOfPage: canonicalHref,
      datePublished: article?.publishedAt || article?.date || new Date().toISOString(),
      dateModified: article?.publishedAt || article?.date || new Date().toISOString(),
      articleSection: article?.category || "Noticia",
      publisher: {
        "@type": "NewsMediaOrganization",
        name: "Catalogo Cruzeiro do Sul",
        logo: {
          "@type": "ImageObject",
          url: toAbsoluteUrl("./assets/favicon-512x512.png")
        }
      }
    };

    if (article?.sourceName) {
      payload.author = {
        "@type": "Organization",
        name: article.sourceName
      };
    }

    structuredDataNode.textContent = JSON.stringify(payload);
  }
};

const resolveApiBases = () => {
  const bases = [];
  const addBase = (value, allowEmpty = false) => {
    const normalized = String(value ?? "").replace(/\/$/, "");
    if (!normalized && !allowEmpty) {
      return;
    }
    if (!bases.includes(normalized)) {
      bases.push(normalized);
    }
  };
  const configured =
    typeof window.CATALOGO_API_BASE === "string" && window.CATALOGO_API_BASE
      ? window.CATALOGO_API_BASE
      : "";

  if (window.location.protocol.startsWith("http")) {
    addBase(configured || "", true);
    return bases;
  }

  addBase("http://localhost:3000");
  if (configured) {
    addBase(configured);
  }
  addBase("http://localhost:8787");
  return bases;
};

const applyMediaBadge = (node, media) => {
  if (!node || !media || !media.badge) {
    return;
  }

  const badge = document.createElement("span");
  badge.className = "thumb-media-badge";
  badge.textContent = media.badge;
  node.appendChild(badge);
};

const resetDetailThumb = () => {
  if (!thumbNode) {
    return;
  }

  thumbNode.className = "detail-hero-thumb";
  thumbNode.removeAttribute("data-top-image");
  thumbNode.style.removeProperty("--bg-image");
  thumbNode.style.removeProperty("--bg-position");
  thumbNode.style.removeProperty("--bg-size");
  thumbNode.style.removeProperty("--hero-image-position");
  thumbNode.style.removeProperty("backgroundImage");
  thumbNode.style.removeProperty("backgroundPosition");
  thumbNode.style.removeProperty("backgroundSize");
  thumbNode.style.removeProperty("backgroundRepeat");
  thumbNode.style.removeProperty("backgroundColor");
  thumbNode.querySelector(".detail-hero-media")?.remove();
  thumbNode.querySelectorAll(".thumb-media-badge").forEach((node) => node.remove());
};

const normalizeParagraph = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const decodeBasicEntities = (value = "") =>
  String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&hellip;|&#8230;/gi, "...")
    .replace(/&#8211;|&#8212;/gi, "-")
    .replace(/&#8216;|&#8217;/gi, "'")
    .replace(/&#8220;|&#8221;/gi, '"')
    .replace(/&#(\d+);/g, (_match, code) => {
      const parsed = Number(code);
      return Number.isFinite(parsed) ? String.fromCharCode(parsed) : "";
    });

const sanitizeImageUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const cleaned = raw.replace(/'/g, "%27");
  const needsProxy = /ac24horas\.com|jurua24horas\.com|cruzeirodosul\.net|cruzeirodosul\.ac\.gov\.br|static\.wixstatic\.com|agencia\.ac\.gov\.br|www\.amac\.com\.br|ifac\.edu\.br|portalacre\.com\.br/i.test(
    cleaned
  );

  if (!needsProxy || /images\.weserv\.nl/i.test(cleaned)) {
    return cleaned;
  }

  const withoutProtocol = cleaned.replace(/^https?:\/\//i, "");
  return `https://images.weserv.nl/?url=${encodeURIComponent(withoutProtocol)}`;
};

const unwrapProxyImageUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw || !/images\.weserv\.nl/i.test(raw)) {
    return raw;
  }

  try {
    const parsed = new URL(raw);
    const proxiedValue = parsed.searchParams.get("url") || "";
    return proxiedValue ? `https://${decodeURIComponent(proxiedValue)}` : raw;
  } catch (_error) {
    return raw;
  }
};

const getImageFingerprint = (value) => {
  const raw = unwrapProxyImageUrl(value);
  if (!raw) {
    return "";
  }

  try {
    const parsed = new URL(raw);
    return decodeURIComponent(`${parsed.hostname}${parsed.pathname}`)
      .toLowerCase()
      .replace(/-\d{2,4}x\d{2,4}(?=\.[a-z0-9]+$)/i, "")
      .replace(/\.(avif|gif|jpe?g|png|webp)$/i, "");
  } catch (_error) {
    return raw
      .toLowerCase()
      .replace(/^https?:\/\//i, "")
      .replace(/\?.*$/, "")
      .replace(/-\d{2,4}x\d{2,4}(?=\.[a-z0-9]+$)/i, "")
      .replace(/\.(avif|gif|jpe?g|png|webp)$/i, "");
  }
};

const extractImageUrlFromText = (value) => {
  const raw = decodeBasicEntities(value).replace(/\\(["'])/g, "$1");
  if (!raw) {
    return "";
  }

  const directPatterns = [
    /data-full-file\s*=\s*["']([^"']+)["']/i,
    /data-large-file\s*=\s*["']([^"']+)["']/i,
    /data-medium-file\s*=\s*["']([^"']+)["']/i,
    /data-original\s*=\s*["']([^"']+)["']/i,
    /<img[^>]+src\s*=\s*["']([^"']+)["']/i,
    /src\s*=\s*["']([^"']+\.(?:avif|gif|jpe?g|png|webp)(?:\?[^"']*)?)["']/i
  ];

  for (const pattern of directPatterns) {
    const match = raw.match(pattern);
    if (match?.[1]) {
      return sanitizeImageUrl(
        match[1].replace(/\\\//g, "/").replace(/&amp;/gi, "&").trim()
      );
    }
  }

  const looseUrlMatch = raw.match(
    /https?:\/\/[^\s"'<>]+?\.(?:avif|gif|jpe?g|png|webp)(?:\?[^\s"'<>]*)?/i
  );
  if (looseUrlMatch?.[0]) {
    return sanitizeImageUrl(looseUrlMatch[0].replace(/&amp;/gi, "&"));
  }

  return "";
};

const extractInlineArticleImage = (article = {}) => {
  const candidates = [
    article.feedImageUrl,
    article.imageUrl,
    article.image,
    article.sourceImageUrl,
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
    const imageUrl = extractImageUrlFromText(candidate);
    if (imageUrl) {
      return imageUrl;
    }
  }

  return "";
};

const isIllustrativeImage = (article = {}, candidate = "") => {
  const imageUrl = String(candidate || article.imageUrl || "").toLowerCase();
  const credit = String(article.imageCredit || "").toLowerCase();
  if (/images\.unsplash\.com/i.test(imageUrl)) return true;
  if (credit.includes("ilustrativa")) return true;
  return false;
};

const normalizeDetailArticle = (article = {}) => {
  const inlineImageUrl = extractInlineArticleImage(article);
  const canonicalFeedImage =
    article.feedImageUrl || article.imageUrl || article.image || inlineImageUrl || "";
  const canonicalSourceImage = article.sourceImageUrl || "";
  const canonicalImage =
    canonicalFeedImage || inlineImageUrl || canonicalSourceImage || article.image || "";

  return {
    ...article,
    feedImageUrl: canonicalFeedImage,
    imageUrl: canonicalImage,
    sourceImageUrl: canonicalSourceImage
  };
};

const pushUniqueImageCandidate = (bucket, value) => {
  const normalized = String(value || "").trim();
  if (!normalized || bucket.includes(normalized)) {
    return;
  }

  bucket.push(normalized);
};

const buildImageLoadCandidates = (values = []) => {
  const items = Array.isArray(values) ? values : [values];
  const candidates = [];

  items.forEach((value) => {
    const raw = String(value || "").trim();
    if (!raw) {
      return;
    }

    const directUrl = raw.replace(/'/g, "%27");
    const proxiedUrl = sanitizeImageUrl(directUrl);
    pushUniqueImageCandidate(candidates, directUrl);
    pushUniqueImageCandidate(candidates, proxiedUrl);
  });

  return candidates;
};

const getUniqueItems = (values = []) =>
  [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];

const looksLikeImageAsset = (value) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return false;
  }

  if (/^data:image\//i.test(raw)) {
    return true;
  }

  if (/wikimedia\.org\/wiki\/Special:FilePath\//i.test(raw)) {
    return true;
  }

  return /^https?:\/\/.+\.(avif|webp|png|jpe?g|gif|bmp|svg)(\?.*)?$/i.test(raw);
};

const ensureDetailHeroMediaNode = () => {
  if (!thumbNode) {
    return null;
  }

  let mediaNode = thumbNode.querySelector(".detail-hero-media");
  if (mediaNode) {
    return mediaNode;
  }

  mediaNode = document.createElement("img");
  mediaNode.className = "detail-hero-media";
  mediaNode.alt = "";
  mediaNode.decoding = "async";
  mediaNode.loading = "eager";
  thumbNode.insertBefore(mediaNode, thumbNode.firstChild || null);
  return mediaNode;
};

const preloadHeroImage = (url) =>
  new Promise((resolve) => {
    const testImage = new Image();
    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve("");
    }, 4200);

    const finish = (value) => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeoutId);
      resolve(value);
    };

    testImage.onload = () => finish(url);
    testImage.onerror = () => finish("");
    testImage.src = url;
  });

const resolveFirstAvailableHeroImage = async (candidates = []) => {
  for (const candidate of candidates) {
    const resolved = await preloadHeroImage(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return "";
};

const getDetailHeroCandidates = (article = {}) =>
  buildImageLoadCandidates(
    getUniqueItems([
      article.imageUrl,
      article.feedImageUrl,
      extractInlineArticleImage(article),
      looksLikeImageAsset(article.media?.imageUrl) ? article.media.imageUrl : "",
      looksLikeImageAsset(article.media?.url) ? article.media.url : "",
      article.sourceImageUrl,
      looksLikeImageAsset(article.media?.creditUrl) ? article.media.creditUrl : ""
    ]).filter((candidate, index, list) => {
      const fingerprint = getImageFingerprint(candidate);
      if (!fingerprint) {
        return true;
      }

      return list.findIndex((value) => getImageFingerprint(value) === fingerprint) === index;
    })
  ).filter((candidate) => !isIllustrativeImage(article, candidate));

const fetchSourceHeroImage = async (sourceUrl) => {
  const cleanUrl = String(sourceUrl || "").trim();
  if (!cleanUrl || cleanUrl === "#") return "";
  const bases = resolveApiBases();

  for (const base of bases) {
    const apiBase = base || "";
    try {
      const response = await fetch(
        `${apiBase}/api/preview-image?url=${encodeURIComponent(cleanUrl)}`
      );
      if (!response.ok) continue;
      const payload = await response.json();
      const imageUrl = await resolveFirstAvailableHeroImage(
        buildImageLoadCandidates(payload?.imageUrl || "")
      );
      if (imageUrl) return imageUrl;
    } catch (_error) {
      // tenta proxima base
    }
  }

  return "";
};

const applyResolvedDetailHeroImage = (imageUrl, article = {}) => {
  if (!thumbNode) {
    return;
  }

  const mediaNode = ensureDetailHeroMediaNode();
  if (!mediaNode) {
    return;
  }

  const normalizedImageUrl = sanitizeImageUrl(imageUrl);
  const backgroundPosition = String(article.imageFocus || "center 30%").trim() || "center 30%";
  const backgroundSize = String(article.imageFit || "cover").trim() || "cover";

  thumbNode.classList.remove("no-image");
  thumbNode.classList.add("has-image", "has-photo", "has-inline-media");
  thumbNode.dataset.topImage = "resolved";
  thumbNode.style.setProperty("--bg-image", `url('${normalizedImageUrl}')`);
  thumbNode.style.setProperty("--bg-position", backgroundPosition);
  thumbNode.style.setProperty("--bg-size", backgroundSize);
  thumbNode.style.setProperty("--hero-image-position", backgroundPosition);
  thumbNode.style.backgroundImage = `linear-gradient(180deg, rgba(8, 16, 29, 0.08) 0%, rgba(8, 16, 29, 0.28) 100%), url('${normalizedImageUrl}')`;
  thumbNode.style.backgroundPosition = `center, ${backgroundPosition}`;
  thumbNode.style.backgroundSize = `cover, ${backgroundSize}`;
  thumbNode.style.backgroundRepeat = "no-repeat";
  thumbNode.style.backgroundColor = "#102742";

  mediaNode.src = normalizedImageUrl;
  mediaNode.alt = article.title
    ? `Imagem principal da matéria: ${article.title}`
    : "Imagem principal da matéria";
  mediaNode.classList.toggle("is-contain", backgroundSize === "contain");
};

const applyDetailHeroImage = async (article = {}) => {
  if (!thumbNode) {
    return;
  }

  const requestId = ++detailHeroRequestId;
  const mediaNode = ensureDetailHeroMediaNode();
  const candidates = getDetailHeroCandidates(article);

  if (!mediaNode || !candidates.length) {
    thumbNode.classList.add("no-image");
    return;
  }

  thumbNode.dataset.topImage = "pending";
  const resolvedImageUrl = await resolveFirstAvailableHeroImage(candidates);

  if (requestId !== detailHeroRequestId) {
    return;
  }

  if (!resolvedImageUrl) {
    const previewImage = await fetchSourceHeroImage(article.sourceUrl);
    if (!previewImage) {
      thumbNode.classList.remove("has-inline-media");
      thumbNode.classList.add("no-image");
      thumbNode.removeAttribute("data-top-image");
      mediaNode.remove();
      return;
    }
    applyResolvedDetailHeroImage(previewImage, article);
    return;
  }

  applyResolvedDetailHeroImage(resolvedImageUrl, article);
};

const getExpandedBodyParagraphs = (article) => {
  const baseParagraphs = Array.isArray(article.body)
    ? article.body.map(normalizeParagraph).filter(Boolean)
    : [];
  const fallbackLede = normalizeParagraph(article.lede || "");
  const source = article.sourceName || "fonte local";
  const sourceLabel = normalizeParagraph(article.sourceLabel || article.title || "");
  const category = normalizeParagraph(article.category || "tema local").toLowerCase();
  const dateLabel = normalizeParagraph(article.date || "data recente");
  const highlights = Array.isArray(article.highlights)
    ? article.highlights.map(normalizeParagraph).filter(Boolean)
    : [];

  const highlightSentence = highlights.length > 0 ? highlights.join(", ") : "atualizacao da pauta";
  const analysisSentence = normalizeParagraph(article.analysis || "");

  const generated = [
    fallbackLede
      ? `No recorte do Catalogo Cruzeiro do Sul, esta pauta entra como uma leitura de ${category}, com impacto direto no dia a dia da cidade e no servico publico local. ${fallbackLede}`
      : `No recorte do Catalogo Cruzeiro do Sul, esta pauta entra como uma leitura de ${category}, com impacto direto no dia a dia da cidade e no servico publico local.`,
    `Em ${dateLabel}, a fonte ${source} destacou o seguinte eixo principal: ${sourceLabel}. A repercussao local costuma ir alem do fato inicial e atinge rotas de trabalho, atendimento e rotina dos bairros.`,
    `Os pontos mais observados nesta cobertura sao: ${highlightSentence}. Esse conjunto ajuda a entender o que ja aconteceu e o que ainda pode evoluir nos proximos dias.`,
    analysisSentence
      ? `Leitura editorial complementar: ${analysisSentence}`
      : "Leitura editorial complementar: a tendencia local depende da resposta institucional, do acompanhamento comunitario e de nova atualizacao da fonte original.",
    "Para continuar bem informado, vale acompanhar o link da fonte consultada e as proximas atualizacoes do Catalogo, especialmente quando houver mudanca de status, novos numeros ou decisao oficial."
  ].filter(Boolean);

  const merged = [...baseParagraphs];
  while (merged.length < 5 && generated.length > 0) {
    merged.push(generated.shift());
  }

  if (merged.length === 0) {
    return generated.slice(0, 5);
  }

  return merged;
};

const renderNotFound = () => {
  updateArticleSeo(null, { indexable: false });
  titleNode.textContent = "Noticia nao encontrada";
  eyebrowNode.textContent = "catalogo cruzeiro do sul";
  metaNode.textContent = "O link pode estar incompleto ou a noticia ainda nao foi cadastrada.";
  ledeNode.textContent = "Volte para a home e escolha outra pauta.";
  sourceLinkNode.href = HOME_RETURN_URL;
  sourceLinkNode.removeAttribute("target");
  sourceLinkNode.removeAttribute("rel");
  sourceLinkNode.textContent = "Voltar para a home";

  if (mediaKindNode && mediaNoteNode && mediaLinkNode) {
    mediaKindNode.textContent = "Foto real";
    mediaNoteNode.textContent = "Esta capa e um apoio visual da pagina de leitura.";
    mediaLinkNode.href = HOME_RETURN_URL;
    mediaLinkNode.removeAttribute("target");
    mediaLinkNode.removeAttribute("rel");
    mediaLinkNode.textContent = "Voltar para a home";
  }
};

const renderArticle = (article) => {
  if (!article) {
    renderNotFound();
    return;
  }

  article = normalizeDetailArticle(article);

  window.currentArticle = article;
  window.__CURRENT_ARTICLE__ = article;
  window.__ARTICLE__ = article;

  updateArticleSeo(article, { indexable: true });
  eyebrowNode.textContent = article.eyebrow || "catalogo cruzeiro do sul";
  titleNode.textContent = article.title || "Abrindo noticia";
  metaNode.textContent = `${article.date || "Sem data"} • ${article.category || "Noticia"}`;

  resetDetailThumb();
  categoryNode.textContent = article.category || "Noticia";
  ledeNode.textContent = article.lede || "";
  sourceNameNode.textContent = article.sourceName || "Fonte local";
  sourceLabelNode.textContent = article.sourceLabel || article.title || "";
  sourceLinkNode.href = article.sourceUrl || HOME_RETURN_URL;

  if (article.sourceUrl && article.sourceUrl.startsWith("http")) {
    sourceLinkNode.setAttribute("target", "_blank");
    sourceLinkNode.setAttribute("rel", "noreferrer");
  } else {
    sourceLinkNode.removeAttribute("target");
    sourceLinkNode.removeAttribute("rel");
  }

  if (article.analysis && analysisContainer && analysisText) {
    analysisText.textContent = article.analysis;
    analysisContainer.hidden = false;
    analysisContainer.classList.add("active");
  } else if (analysisContainer) {
    analysisContainer.hidden = true;
  }

  void applyDetailHeroImage(article);

  if (article.imageUrl || article.media) {
    applyMediaBadge(thumbNode, article.media);
  }

  if (mediaKindNode && mediaNoteNode && mediaLinkNode) {
    if (article.media) {
      mediaKindNode.textContent = article.media.label || "";
      mediaNoteNode.textContent = article.media.note || "";
      mediaLinkNode.href = article.media.creditUrl || HOME_RETURN_URL;
      mediaLinkNode.textContent = article.media.creditLabel || "Ver fonte";

      if (article.media.creditUrl && article.media.creditUrl.startsWith("http")) {
        mediaLinkNode.setAttribute("target", "_blank");
        mediaLinkNode.setAttribute("rel", "noreferrer");
      } else {
        mediaLinkNode.removeAttribute("target");
        mediaLinkNode.removeAttribute("rel");
      }
    } else if (article.imageUrl) {
      mediaKindNode.textContent = "Imagem da materia";
      mediaNoteNode.textContent = article.imageCredit || "";
      mediaLinkNode.href = article.sourceUrl || HOME_RETURN_URL;
      mediaLinkNode.textContent = "Ver fonte";
      if (article.sourceUrl && article.sourceUrl.startsWith("http")) {
        mediaLinkNode.setAttribute("target", "_blank");
        mediaLinkNode.setAttribute("rel", "noreferrer");
      } else {
        mediaLinkNode.removeAttribute("target");
        mediaLinkNode.removeAttribute("rel");
      }
    } else {
      mediaKindNode.textContent = "";
      mediaNoteNode.textContent = "";
      mediaLinkNode.href = HOME_RETURN_URL;
      mediaLinkNode.textContent = "Voltar para a home";
      mediaLinkNode.removeAttribute("target");
      mediaLinkNode.removeAttribute("rel");
    }
  }

  contentNode.innerHTML = "";
  getExpandedBodyParagraphs(article).forEach((paragraph) => {
    const p = document.createElement("p");
    p.textContent = paragraph;
    contentNode.appendChild(p);
  });

  const generatedDevelopment = Array.isArray(article.development)
    ? article.development
    : [
        `${article.title || "A pauta"} continua em acompanhamento no Catalogo Cruzeiro do Sul com foco nos impactos práticos para a rotina da cidade.`,
        `Na leitura local, o ponto central envolve ${String(article.category || "o tema principal").toLowerCase()} e seus efeitos diretos nos bairros, nos serviços e na vida de quem acompanha o caso.`,
        "O portal segue atualizando esta matéria conforme novas informações oficiais forem publicadas pela fonte original e pelos órgãos locais."
      ];

  const developmentBox = document.createElement("section");
  developmentBox.className = "detail-development";
  const developmentTitle = document.createElement("h4");
  developmentTitle.textContent = "Desenvolvimento da Materia";
  developmentBox.appendChild(developmentTitle);
  generatedDevelopment.forEach((line) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = line;
    developmentBox.appendChild(paragraph);
  });
  contentNode.appendChild(developmentBox);

  highlightsNode.innerHTML = "";
  (article.highlights || []).forEach((highlight) => {
    const li = document.createElement("li");
    li.textContent = highlight;
    highlightsNode.appendChild(li);
  });

};

const loadRuntimeArticle = async (targetSlug) => {
  if (!targetSlug) {
    return null;
  }

  for (const apiBase of resolveApiBases()) {
    const article = await requestRuntimeArticle(apiBase, targetSlug);
    if (article) {
      return article;
    }
  }

  return null;
};

const requestRuntimeArticle = async (apiBase, targetSlug) => {
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), 3500)
    : null;

  try {
    const response = await fetch(`${apiBase}/api/news/${encodeURIComponent(targetSlug)}`, {
      cache: "no-store",
      signal: controller?.signal
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return payload.item ? normalizeDetailArticle(payload.item) : null;
  } catch (error) {
    return null;
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  }
};

const findLocalArticle = (targetSlug) => {
  if (!targetSlug) {
    return null;
  }

  const article =
    window.NEWS_MAP?.[targetSlug] ||
    (Array.isArray(window.NEWS_DATA)
      ? window.NEWS_DATA.find((item) => normalizeSlug(item?.slug) === targetSlug)
      : null) ||
    findStoredArticle(targetSlug) ||
    null;

  return article ? normalizeDetailArticle(article) : null;
};

const getReadableStorages = () => {
  const storages = [];

  try {
    if (window.sessionStorage) {
      storages.push(window.sessionStorage);
    }
  } catch (_error) {
    // Ignora ambiente sem sessionStorage.
  }

  try {
    if (window.localStorage) {
      storages.push(window.localStorage);
    }
  } catch (_error) {
    // Ignora ambiente sem localStorage.
  }

  return storages;
};

const readStoredItems = (key) => {
  const storages = getReadableStorages();

  for (const storage of storages) {
    try {
      const raw = storage.getItem(key);
      if (!raw) {
        continue;
      }

      const parsed = JSON.parse(raw);
      if (parsed) {
        return parsed;
      }
    } catch (_error) {
      // Segue para o proximo storage.
    }
  }

  return null;
};

const findStoredArticle = (targetSlug) => {
  const recentArticle = readStoredItems(OFFLINE_LAST_ARTICLE_KEY);
  if (recentArticle && normalizeSlug(recentArticle.slug) === targetSlug) {
    return normalizeDetailArticle(recentArticle);
  }

  const cachedItems = readStoredItems(OFFLINE_NEWS_CACHE_KEY);
  if (!Array.isArray(cachedItems)) {
    return null;
  }

  const item = cachedItems.find((value) => normalizeSlug(value?.slug) === targetSlug) || null;
  return item ? normalizeDetailArticle(item) : null;
};

const persistLoadedArticle = (article) => {
  const normalizedArticle = normalizeDetailArticle(article);
  if (!normalizedArticle?.slug) {
    return;
  }

  const serialized = JSON.stringify(normalizedArticle);
  const storages = getReadableStorages();

  storages.forEach((storage) => {
    try {
      storage.setItem(OFFLINE_LAST_ARTICLE_KEY, serialized);
    } catch (_error) {
      // Ignora falhas de quota.
    }
  });
};

const loadArticle = async () => {
  if (!slug) {
    renderNotFound();
    return;
  }

  const fallbackArticle = findLocalArticle(slug);

  if (fallbackArticle) {
    renderArticle(fallbackArticle);
    persistLoadedArticle(fallbackArticle);
  }

  if (fallbackArticle && window.location.protocol === "file:") {
    return;
  }

  const runtimeArticle = await loadRuntimeArticle(slug);

  if (runtimeArticle) {
    renderArticle(runtimeArticle);
    persistLoadedArticle(runtimeArticle);
    return;
  }

  if (!fallbackArticle) {
    renderNotFound();
  }
};

loadArticle();
