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
    initialQueryApplied: false,
    drawerOpen: false,
    drawerCloseTimer: 0
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

  const archiveStoryStopwords = new Set([
    "a",
    "o",
    "os",
    "as",
    "ao",
    "aos",
    "da",
    "das",
    "de",
    "do",
    "dos",
    "e",
    "em",
    "no",
    "na",
    "nos",
    "nas",
    "para",
    "por",
    "com",
    "sem",
    "que",
    "uma",
    "um",
    "sobre",
    "apos",
    "após",
    "acre",
    "brasil",
    "governo",
    "prefeitura"
  ]);

  const decodeEditorialEntities = (value = "") =>
    String(value || "")
      .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCharCode(parseInt(code, 16)))
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&apos;|&#39;/gi, "'")
      .replace(/&nbsp;/gi, " ")
      .replace(/&ndash;|&mdash;/gi, "-")
      .replace(/[“”‘’]/g, "'")
      .replace(/[–—]/g, "-");

  const normalizeArchiveStoryText = (value = "") =>
    normalizeText(decodeEditorialEntities(value))
      .replace(/&[a-z0-9#]+;/gi, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const getCanonicalArticleUrl = (article = {}) => {
    const rawUrl = String(article.sourceUrl || article.url || article.link || "").trim();
    if (!rawUrl || rawUrl === "#") {
      return "";
    }

    try {
      const parsed = new URL(rawUrl, window.location.href);
      [...parsed.searchParams.keys()].forEach((key) => {
        if (/^(utm_|fbclid|gclid|mc_|output|ref|source)$/i.test(key)) {
          parsed.searchParams.delete(key);
        }
      });
      parsed.hash = "";
      return parsed.toString().replace(/\/$/, "").toLowerCase();
    } catch (_error) {
      return normalizeArchiveStoryText(rawUrl);
    }
  };

  const getArchiveStoryTokens = (article = {}) =>
    normalizeArchiveStoryText(
      [
        article.title,
        article.sourceLabel,
        article.summary,
        article.lede,
        article.description,
        article.category,
        article.sourceName
      ].join(" ")
    )
      .split(/\s+/)
      .filter((token) => token.length > 3 && !archiveStoryStopwords.has(token))
      .slice(0, 9);

  const getArchiveStoryCluster = (article = {}) => {
    const haystack = normalizeArchiveStoryText(
      [
        article.title,
        article.sourceLabel,
        article.summary,
        article.lede,
        article.description,
        article.category,
        article.sourceName
      ].join(" ")
    );

    if (/\b(parana pesquisas|pesquisas rj|flavio.*lula|lula.*flavio)\b/.test(haystack)) {
      return "pesquisa-rj-lula-flavio";
    }
    if (/\b(mailza|mailsa|governadora mailza|mailza assis)\b/.test(haystack)) {
      return "mailza-governo";
    }
    if (/\b(cheia|enchente|jurua|juru[aá]|alagamento|abrigos?|vazante|familias atingidas)\b/.test(haystack)) {
      return "cheia-jurua";
    }
    if (/\b(derramamento|diesel|oleo|balsa|tarauaca)\b/.test(haystack)) {
      return "oleo-tarauaca";
    }
    if (/\b(edital|licenca|licenca de operacao|assembleia|convocacao)\b/.test(haystack)) {
      return `edital-${getArchiveStoryTokens(article).slice(0, 3).join("-")}`;
    }

    return getArchiveStoryTokens(article).slice(0, 5).join("-") || slugifyText(article.title || article.id || "");
  };

  const getArchiveImageKey = (article = {}) =>
    normalizeArchiveStoryText(article.imageUrl || article.feedImageUrl || article.sourceImageUrl || "")
      .replace(/\?.*$/, "")
      .slice(0, 180);

  const getArchiveArticleCanonicalKey = (article = {}) => {
    const canonicalUrl = getCanonicalArticleUrl(article);
    if (canonicalUrl) {
      return canonicalUrl;
    }

    return [
      getArchiveStoryCluster(article),
      normalizeArchiveStoryText(article.sourceName || article.source || ""),
      article.date || article.publishedAt || article.createdAt || ""
    ]
      .filter(Boolean)
      .join("|");
  };

  const diversifyArchiveStories = (items = [], desiredCount = pageSize) => {
    const limit = Math.max(1, Number(desiredCount || pageSize || 6));
    const selected = [];
    const selectedKeys = new Set();
    const counts = {
      source: new Map(),
      category: new Map(),
      cluster: new Map(),
      image: new Map()
    };
    const sourceLimit = 2;
    const categoryLimit = limit <= 6 ? 2 : 3;
    const clusterLimit = 1;
    const passes = [
      { source: sourceLimit, category: categoryLimit, cluster: clusterLimit, image: 1 },
      { source: sourceLimit + 1, category: categoryLimit + 1, cluster: clusterLimit + 1, image: 2 },
      { source: Infinity, category: Infinity, cluster: Infinity, image: Infinity }
    ];

    const canUse = (article, pass) => {
      const source = normalizeArchiveStoryText(article.sourceName || article.source || "fonte");
      const category = normalizeArchiveStoryText(article.category || "geral");
      const cluster = getArchiveStoryCluster(article);
      const image = getArchiveImageKey(article);

      return (
        (counts.source.get(source) || 0) < pass.source &&
        (counts.category.get(category) || 0) < pass.category &&
        (counts.cluster.get(cluster) || 0) < pass.cluster &&
        (!image || (counts.image.get(image) || 0) < pass.image)
      );
    };

    const addArticle = (article) => {
      const key = getArchiveArticleCanonicalKey(article);
      if (!key || selectedKeys.has(key)) {
        return false;
      }

      selected.push(article);
      selectedKeys.add(key);

      const source = normalizeArchiveStoryText(article.sourceName || article.source || "fonte");
      const category = normalizeArchiveStoryText(article.category || "geral");
      const cluster = getArchiveStoryCluster(article);
      const image = getArchiveImageKey(article);
      counts.source.set(source, (counts.source.get(source) || 0) + 1);
      counts.category.set(category, (counts.category.get(category) || 0) + 1);
      counts.cluster.set(cluster, (counts.cluster.get(cluster) || 0) + 1);
      if (image) counts.image.set(image, (counts.image.get(image) || 0) + 1);
      return true;
    };

    passes.forEach((pass) => {
      if (selected.length >= limit) {
        return;
      }

      items.forEach((article) => {
        if (selected.length >= limit || !canUse(article, pass)) {
          return;
        }

        addArticle(article);
      });
    });

    const remaining = items.filter((article) => !selectedKeys.has(getArchiveArticleCanonicalKey(article)));
    return [...selected, ...remaining];
  };

  const escapeAttribute = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const HOTLINK_BLOCKED_IMAGE_HOSTS = ["awn.com"];

  const isHotlinkBlockedImageUrl = (value) => {
    const raw = String(value || "").trim();
    if (!raw) {
      return false;
    }

    try {
      const parsed = new URL(raw, window.location.href);
      const hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();
      return HOTLINK_BLOCKED_IMAGE_HOSTS.some(
        (host) => hostname === host || hostname.endsWith(`.${host}`)
      );
    } catch (_error) {
      return /(^|\/\/)(?:www\.)?awn\.com\b/i.test(raw);
    }
  };

  const sanitizeImageUrl = (value) => {
    const cleanValue = String(value || "")
      .replace(/\\\//g, "/")
      .replace(/&amp;/gi, "&")
      .trim();

    if (!cleanValue) {
      return "";
    }

    if (isHotlinkBlockedImageUrl(cleanValue)) {
      return "";
    }

    try {
      const parsed = new URL(cleanValue, window.location.href);
      if (!/^https?:$/i.test(parsed.protocol)) {
        return "";
      }
      const path = decodeURIComponent(parsed.pathname || "").toLowerCase();
      if (/\.(?:pdf|docx?|xlsx?|pptx?|zip|rar|7z)(?:$|[?#])/i.test(`${path}${parsed.search || ""}`)) {
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

  const articleImageFocusOverridesBySlug = {
    "stf-decide-que-piso-nacional-deve-ser-pago-a-professores-temporarios": "62% 12%",
    "governo-avanca-na-regularizacao-fundiaria-e-conclui-primeira-etapa-do-programa-em-assis-brasil":
      "74% 32%",
    "acre-disputa-campeonato-regional-de-bocha-com-14-paratletas": "78% 43%",
    "jordao-celebra-34-anos-com-show-de-evoney-fernandes": "40% 38%",
    "com-presenca-da-familia-mario-sergio-toma-posse-no-tribunal-de-contas-do-acre": "58% 42%",
    "academia-acreana-de-letras-reune-mulheres-de-poder-em-primeira-roda-de-conversa-de-2026":
      "30% 58%",
    "socorro-propoe-jornada-especial-para-professores-em-tratamento-de-saude": "49% 26%",
    "prefeito-decreta-emergencia-e-anuncia-auxilio-a-familias-atingidas-por-enxurradas": "78% 38%",
    "traficante-foge-da-policia-e-deixa-esposa-com-bebe-recem-nascido-para-ser-presa": "58% 68%",
    "fundhacre-recebe-treinamento-da-fiocruz-para-diagnostico-molecular-de-leishmaniose": "78% 30%",
    "fundhacre-realiza-quinto-transplante-de-tecido-osseo-e-amplia-oferta-de-alta-complexidade-no-acre":
      "45% 22%",
    "acre-alcanca-o-segundo-lugar-no-ranking-nacional-de-matriculas-de-ensino-tecnico-articulado-com-o-ensino-medio":
      "38% 26%",
    "governo-do-acre-capacita-orgaos-do-executivo-estadual-sobre-planos-de-integridade": "60% 40%",
    "governo-do-acre-amplia-acesso-a-identidade-para-indigenas-com-acao-da-policia-civil-na-casai":
      "58% 16%",
    "morre-o-pai-de-ana-paula-renault-a-dois-dias-da-final-do-bbb-26": "center 18%",
    "com-um-a-menos-palmeiras-segura-athletico-pr-e-vence-pelo-brasileirao": "center 22%",
    "com-falha-de-lyanco-coritiba-vence-atletico-mg-no-campeonato-brasileiro": "center 22%",
    "internacional-perde-para-o-mirassol-e-se-aproxima-do-z-4-do-brasileirao": "center 22%",
    "paratletas-acreanos-conquistam-9-medalhas-no-regional-de-bocha": "center 24%",
    "brasileia-entrega-premiacao-aos-vencedores-do-2-campeonato-de-pesca": "center 24%",
    "mailza-e-gladson-se-encontram-em-manaus-para-reuniao-de-alinhamento-politico": "center 20%",
    "presidentes-de-bairros-denunciam-obra-irregular-e-mobilizam-embargo": "center 20%",
    "eua-ameacam-peru-apos-governo-sugerir-pausa-em-compra-de-avioes-de-combate": "center 18%",
    "denuncia-de-maus-tratos-contra-vendedor-de-bananas-termina-em-reconhecimento-de-ato-de-cuidado-em-rio-branco":
      "center 18%",
    "pista-goleia-o-ame-no-campeonato-estadual-de-futsal-sub-15": "center 22%",
    "seguranca-publica-intensifica-acoes-em-comunidades-indigenas-e-fortalece-seguranca-comunitaria-em-santa-rosa-do-purus":
      "center 24%",
    "governo-e-instituicoes-parceiras-certificam-40-alunos-na-1-etapa-do-projeto-pao-na-estrada":
      "center 22%",
    "crianca-desaparece-apos-naufragio-no-rio-purus-bombeiros-fazem-buscas": "center 18%",
    "com-foco-na-prevencao-prefeitura-de-mancio-lima-realiza-acao-de-saude-no-bairro-iracema":
      "center 22%",
    "bittar-sobre-ato-de-jv-nao-tem-votos-para-ganhar-de-mim-e-o-caminho-dele-e-o-tapetao": "center 30%",
    "esquenta-junino-2026-abre-temporada-cultural-com-quadrilhas-no-acre": "center 30%",
    "jorge-viana-aciona-stf-e-flavio-dino-investiga-emendas-de-bittar-a-santa-casa-e-obras-de-infraestrutura":
      "center 30%",
    "mais-de-200-inqueritos-foram-instaurados-na-delegacia-da-mulher-em-cruzeiro-do-sul": "center 30%",
    "circuito-country-em-epitaciolandia-tera-controle-de-acesso-de-criancas-e-adolescentes": "center 30%",
    "moradores-indigenas-cavam-estrada-para-escapar-da-lama-em-ramal-de-assis-brasil": "center 30%",
    "lula-preve-judicializacao-caso-desoneracao-seja-incluida-em-fim-da-6-215-1": "center 30%",
    "trump-diz-que-eua-tem-8220-controle-total-8221-sobre-o-estreito-de-ormuz": "center 30%",
    "prefeitura-de-cruzeiro-do-sul-realiza-4-edicao-do-programa-de-aquisicao-de-alimentos-com-investimento-de-r-225-mil":
      "center 30%",
    "voluntarios-da-adventist-health-atendem-milhares-de-pessoas-em-voluntariado-nas-filipinas":
      "center 30%",
    "edital-de-convocacao-da-assembleia-geral-extraordinaria-8211-coopertransgua": "center 30%",
    "edital-de-convocacao-de-assembleia-geral-ordinaria-8211-coopeguajara": "center 30%",
    "edital-de-convocacao-8211-assembleia-de-ratificacao-da-fundacao-do-sindicato-dos-trabalhadores-em-transporte-aquaviario-do-acre":
      "center 30%",
    "edital-de-convocacao-8211-assembleia-geral-de-eleicao-e-posse": "center 30%",
    "edital-de-eleicao-e-posse-8211-ascak": "center 30%",
    "exposicao-mostra-o-olhar-afro-brasileiro-da-fotografa-lita-cerqueira": "center 30%",
    "justica-nega-pedido-de-careca-do-inss-para-barrar-apelido": "center 30%",
    "sistema-prisional-de-sao-paulo-registra-uma-morte-a-cada-19-horas": "center 30%",
    "lula-qualidade-do-agro-e-essencial-para-ampliar-exportacoes": "center 30%",
    "stf-determina-atualizacao-anual-do-valor-do-minimo-existencial": "center 30%",
    "estado-de-sao-paulo-tem-mais-duas-mortes-por-febre-amarela": "center 30%",
    "enviado-de-trump-sugere-que-italia-substitua-ira-na-copa-do-mundo": "center 30%"
  };

  const articlePersonFocusPattern =
    /\b(rosto|face|pai|mae|mãe|filho|filha|crianca|criança|jovem|mulher|homem|prefeito|prefeita|governador|governadora|senador|senadora|deputado|deputada|presidente|atleta|jogador|jogadora|paratleta|cantor|cantora|ator|atriz|influenciadora|influenciador|motociclista|suspeito|vendedor|aluno|alunos|familia|família)\b/;
  const articleGroupFocusPattern =
    /\b(grupo|equipe|time|selecao|seleção|cerimonia|cerimônia|premiacao|premiação|reuniao|reunião|evento|acao|ação|campeonato|jogos|comunidades|indigenas|indígenas|alunos|familias|famílias)\b/;
  const articlePortraitFocusPattern = /\b(retrato|posse|entrevista|discurso|falou|reuniao|reunião|alinhamento)\b/;

  const resolveArticleImageFocus = (article = {}, fallback = "center") => {
    const manualFocus = String(article.imageFocus || "").trim();
    if (manualFocus) {
      return manualFocus;
    }

    const slug = String(article.slug || slugifyText(article.title || article.sourceLabel || "")).trim();
    if (slug && articleImageFocusOverridesBySlug[slug]) {
      return articleImageFocusOverridesBySlug[slug];
    }

    const haystack = normalizeText(
      [article.title, article.lede, article.summary, article.category, article.sourceName].join(" ")
    );
    if (articlePortraitFocusPattern.test(haystack)) {
      return "center 18%";
    }
    if (articlePersonFocusPattern.test(haystack) && articleGroupFocusPattern.test(haystack)) {
      return "center 22%";
    }
    if (articlePersonFocusPattern.test(haystack)) {
      return "center 20%";
    }

    return fallback;
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
      imageUrl,
      imageFocus: resolveArticleImageFocus({ ...article, slug, title }, article.imageFocus || "")
    };
  };

  const getArticleKey = (article) => {
    const normalized = normalizeArticle(article);
    return getArchiveArticleCanonicalKey(normalized);
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
          resolveArticleImageFocus(article, "center"),
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

  const buildDrawerItem = (article) => {
    const href = buildArticleHref(article);
    const item = document.createElement("article");
    const link = document.createElement("a");
    const meta = document.createElement("div");
    const category = document.createElement("span");
    const date = document.createElement("span");
    const title = document.createElement("strong");
    const summary = document.createElement("p");
    const footer = document.createElement("small");

    item.className = "feed-drawer-item";
    link.className = "feed-drawer-link";
    link.href = href;

    if (isExternalUrl(href)) {
      link.target = "_blank";
      link.rel = "noreferrer";
    }

    meta.className = "feed-drawer-item-meta";
    category.textContent = article.category || "Arquivo";
    date.textContent = article.date || "Sem data";
    title.textContent = article.title || "Atualizacao";
    summary.textContent = article.lede || "Sem resumo.";
    footer.textContent = `${article.sourceName || "Fonte local"}${article.slug ? " • notícia local" : " • link externo"}`;

    meta.append(category, date);
    link.append(meta, title, summary, footer);
    item.appendChild(link);
    return item;
  };

  const getNodes = () => ({
    section: document.querySelector("#arquivo-vivo"),
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
    suggestions: document.querySelector("#arquivo-noticias-sugestoes"),
    drawer: document.querySelector("#live-feed-drawer"),
    drawerBackdrop: document.querySelector("#live-feed-drawer-backdrop"),
    drawerList: document.querySelector("#live-feed-drawer-list"),
    drawerCount: document.querySelector("#live-feed-drawer-count"),
    drawerLabel: document.querySelector("#live-feed-drawer-label"),
    drawerStatus: document.querySelector("#live-feed-drawer-status"),
    drawerClose: document.querySelector("#live-feed-drawer-close")
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

  const openArchiveDrawer = () => {
    const { drawer, drawerBackdrop } = getNodes();
    if (!drawer || !drawerBackdrop || state.drawerOpen) {
      return;
    }

    if (state.drawerCloseTimer) {
      window.clearTimeout(state.drawerCloseTimer);
      state.drawerCloseTimer = 0;
    }

    state.drawerOpen = true;
    drawer.hidden = false;
    drawerBackdrop.hidden = false;
    drawer.setAttribute("aria-hidden", "false");

    window.requestAnimationFrame(() => {
      drawer.classList.add("is-open");
      drawerBackdrop.classList.add("is-open");
    });
  };

  const closeArchiveDrawer = () => {
    const { drawer, drawerBackdrop } = getNodes();
    if (!drawer || !drawerBackdrop || !state.drawerOpen) {
      return;
    }

    state.drawerOpen = false;
    drawer.classList.remove("is-open");
    drawerBackdrop.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");

    if (state.drawerCloseTimer) {
      window.clearTimeout(state.drawerCloseTimer);
    }

    state.drawerCloseTimer = window.setTimeout(() => {
      drawer.hidden = true;
      drawerBackdrop.hidden = true;
      state.drawerCloseTimer = 0;
    }, 220);
  };

  const renderArchiveDrawer = (items = state.items) => {
    const { drawerList, drawerCount, drawerLabel, drawerStatus, query } = getNodes();
    if (!drawerList || !drawerCount || !drawerLabel || !drawerStatus) {
      return;
    }

    const queryText = String(query?.value || "").trim();
    const activeCategory = String(state.activeCategory || "").trim();
    const activeContext = [activeCategory, queryText ? `busca "${queryText}"` : ""].filter(Boolean);

    drawerCount.textContent = String(items.length);
    drawerLabel.textContent =
      activeContext.length > 0
        ? "notícias no recorte lateral"
        : "notícias no arquivo lateral";

    if (!state.items.length) {
      drawerStatus.textContent = "Preparando a base completa para abrir o arquivo lateral.";
      drawerList.innerHTML = "";
      return;
    }

    if (!items.length) {
      drawerStatus.textContent = "Nenhuma notícia bateu com esse filtro na barra lateral.";
      drawerList.innerHTML = '<div class="feed-drawer-empty">Nenhuma notícia encontrada neste recorte.</div>';
      return;
    }

    drawerStatus.textContent = activeContext.length
      ? `Rolagem lateral com ${items.length} notícias filtradas por ${activeContext.join(" e ")}.`
      : `Rolagem lateral pronta com ${items.length} notícias ja verificadas na base.`;

    drawerList.textContent = "";
    items.forEach((article) => drawerList.appendChild(buildDrawerItem(article)));
  };

  const bindArchiveDrawer = () => {
    const { section, drawerClose } = getNodes();

    if (drawerClose && !drawerClose.dataset.bound) {
      drawerClose.dataset.bound = "true";
      drawerClose.addEventListener("click", closeArchiveDrawer);
    }

    if (!document.body.dataset.archiveDrawerBound) {
      document.body.dataset.archiveDrawerBound = "true";
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && state.drawerOpen) {
          closeArchiveDrawer();
        }
      });

      document.addEventListener("mousedown", (event) => {
        if (!state.drawerOpen) {
          return;
        }

        if (section?.contains(event.target)) {
          return;
        }

        closeArchiveDrawer();
      });
    }
  };

  const getFilteredItems = (queryNode) => {
    const queryValue = String(queryNode?.value || "").trim();
    const categoryFiltered = state.items.filter((article) =>
      matchesCategory(article, state.activeCategory)
    );

    if (!normalizeText(queryValue)) {
      return diversifyArchiveStories(categoryFiltered, state.visibleItems);
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

      query.addEventListener("focus", () => {
        renderArchiveDrawer(getFilteredItems(query));
        openArchiveDrawer();
        updateSuggestions();
      });
      query.addEventListener("input", () => {
        renderArchiveDrawer(getFilteredItems(query));
        openArchiveDrawer();
        updateSuggestions();
      });
      query.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          closeSuggestions();
          closeArchiveDrawer();
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
      countLabel.textContent = activeContext.length ? "notícias no recorte atual" : "notícias já postadas";
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
    const visibleSlice = diversifyArchiveStories(filtered, state.visibleItems).slice(0, state.visibleItems);

    grid.innerHTML = "";
    updateSummary(filtered, visibleSlice);
    renderFilters();
    renderArchiveDrawer(filtered);

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
      normalizeText(status?.textContent || "").includes("preparando");

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
    bindArchiveDrawer();
    renderAutocomplete();
    attachFallbackRendering();
    renderArchiveDrawer(state.items);

    const refreshFromApi = async () => {
      const apiItems = await fetchArchiveArticles();
      if (!apiItems.length) {
        return;
      }

      state.items = dedupeArticles([...apiItems, ...state.items]);
      window.ARQUIVO_NOTICIAS = state.items;
      renderAutocomplete();
      renderArchiveDrawer(getFilteredItems(getNodes().query));

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
