const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs/promises");
const crypto = require("node:crypto");

const sourceConfig = require("./backend/source-config");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, "data");
const COMMENTS_FILE = path.join(DATA_DIR, "comments.json");
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, "subscriptions.json");
const RUNTIME_NEWS_FILE = path.join(DATA_DIR, "runtime-news.json");
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

const DEFAULT_COMMENTS = [
  {
    id: "seed-comment-1",
    name: "Marina A.",
    badge: "Membro fundador",
    message:
      "O que me prende aqui e quando o site junta a noticia da rua com documento e linha do tempo. Ai vira servico, nao so opiniao.",
    createdAt: "2026-04-10T07:10:00-05:00",
    approved: true
  },
  {
    id: "seed-comment-2",
    name: "Paulo R.",
    badge: "Leitor nivel 9",
    message:
      "A secao de humor funciona melhor quando bate no assunto do dia com uma imagem forte e pouca enrolacao.",
    createdAt: "2026-04-10T07:18:00-05:00",
    approved: true
  }
];

const DEFAULT_RUNTIME_NEWS = {
  lastAttemptAt: null,
  lastSuccessAt: null,
  items: [],
  reports: []
};

const refreshState = {
  isRunning: false,
  timer: null
};

const normalizeWhitespace = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const stripHtml = (value) =>
  normalizeWhitespace(
    String(value || "")
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );

const decodeXmlEntities = (value) =>
  String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

const sanitizeText = (value) => normalizeWhitespace(decodeXmlEntities(stripHtml(value)));

const truncateText = (value, maxLength) => {
  const cleanValue = normalizeWhitespace(value);

  if (cleanValue.length <= maxLength) {
    return cleanValue;
  }

  return `${cleanValue.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
};

const slugify = (value) =>
  normalizeWhitespace(
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
  )
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "nota";

const getHash = (value) =>
  crypto.createHash("sha1").update(String(value || "")).digest("hex").slice(0, 8);

const extractXmlTag = (source, tagName) => {
  const matcher = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = String(source || "").match(matcher);
  return match ? match[1] : "";
};

const extractAtomLink = (source) => {
  const match = String(source || "").match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  return match ? match[1] : "";
};

const extractImageUrl = (rawItem) => {
  const patterns = [
    /<media:content\b[^>]*url=["']([^"']+)["']/i,
    /<media:thumbnail\b[^>]*url=["']([^"']+)["']/i,
    /<enclosure\b[^>]*url=["']([^"']+)["'][^>]*type=["']image\//i,
    /<img\b[^>]*src=["']([^"']+)["']/i
  ];

  for (const pattern of patterns) {
    const match = String(rawItem || "").match(pattern);

    if (match) {
      return match[1];
    }
  }

  return "";
};

const CATEGORY_RULES = [
  {
    category: "Policia",
    previewClass: "thumb-policia",
    keywords: ["policia", "pris", "assalto", "roubo", "trafico", "crime", "operacao", "homic"]
  },
  {
    category: "Saude",
    previewClass: "thumb-saude",
    keywords: ["saude", "hospital", "ubs", "vacina", "dengue", "medic", "sus", "atendimento"]
  },
  {
    category: "Educacao",
    previewClass: "thumb-educacao",
    keywords: ["educa", "escola", "aluno", "ensino", "ifac", "creche", "professor", "campus"]
  },
  {
    category: "Prefeitura",
    previewClass: "thumb-politica",
    keywords: [
      "prefeitura",
      "governo",
      "secretaria",
      "camara",
      "vereador",
      "decreto",
      "planejamento",
      "gestao"
    ]
  },
  {
    category: "Negocios",
    previewClass: "thumb-pascoa",
    keywords: ["economia", "mercado", "feira", "comercio", "negocio", "bolsa", "preco", "ramal"]
  },
  {
    category: "Utilidade Publica",
    previewClass: "thumb-servico",
    keywords: ["servico", "cadastro", "inscric", "beneficio", "aviso", "atencao", "prazo", "bolsa familia"]
  },
  {
    category: "Festas & Social",
    previewClass: "thumb-rede",
    keywords: ["festa", "show", "viral", "rede", "cultura", "social", "evento", "influenci"]
  },
  {
    category: "Cotidiano",
    previewClass: "thumb-cheia",
    keywords: ["cheia", "jurua", "chuva", "bairro", "familia", "cidade", "rua", "morador"]
  }
];

const categoryConfig = new Map(CATEGORY_RULES.map((rule) => [rule.category, rule]));

const detectCategory = (title, summary, fallbackCategory) => {
  const haystack = `${title} ${summary}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) {
      return rule.category;
    }
  }

  return fallbackCategory || "Cotidiano";
};

const getPreviewClass = (category) =>
  categoryConfig.get(category)?.previewClass || "thumb-cheia";

const formatArticleDate = (isoString) => {
  const date = new Date(isoString || Date.now());

  if (Number.isNaN(date.getTime())) {
    return "Sem data";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Rio_Branco"
  });
};

const buildParagraphs = (summary) => {
  const mainParagraph = truncateText(summary, 320);
  const noteParagraph =
    "Esta nota entrou automaticamente no agregador do Atlas CZS a partir do feed da fonte original. Abra a materia original para conferir o contexto integral.";

  return [mainParagraph, noteParagraph].filter(Boolean);
};

const buildHighlights = (article) => [
  `Fonte original: ${article.sourceName}`,
  `Categoria no Atlas: ${article.category}`,
  `Atualizada em ${article.date}`
];

const readJson = async (filePath, fallbackValue) => {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    return fallbackValue;
  }
};

const writeJson = async (filePath, value) => {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const ensureDataFiles = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const seeds = [
    [COMMENTS_FILE, DEFAULT_COMMENTS],
    [SUBSCRIPTIONS_FILE, []],
    [RUNTIME_NEWS_FILE, DEFAULT_RUNTIME_NEWS]
  ];

  for (const [filePath, seedValue] of seeds) {
    try {
      await fs.access(filePath);
    } catch (error) {
      await writeJson(filePath, seedValue);
    }
  }
};

const parseFeedEntries = (xmlString) => {
  const xml = String(xmlString || "");
  const itemMatches = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];

  if (itemMatches.length > 0) {
    return itemMatches.map((rawItem) => ({
      rawItem,
      title: sanitizeText(extractXmlTag(rawItem, "title")),
      link: sanitizeText(extractXmlTag(rawItem, "link")),
      description: sanitizeText(extractXmlTag(rawItem, "description")),
      content: sanitizeText(extractXmlTag(rawItem, "content:encoded")),
      publishedAt:
        sanitizeText(extractXmlTag(rawItem, "pubDate")) ||
        sanitizeText(extractXmlTag(rawItem, "dc:date"))
    }));
  }

  const atomEntries = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];

  return atomEntries.map((rawItem) => ({
    rawItem,
    title: sanitizeText(extractXmlTag(rawItem, "title")),
    link: sanitizeText(extractAtomLink(rawItem)),
    description: sanitizeText(extractXmlTag(rawItem, "summary")),
    content: sanitizeText(extractXmlTag(rawItem, "content")),
    publishedAt:
      sanitizeText(extractXmlTag(rawItem, "updated")) ||
      sanitizeText(extractXmlTag(rawItem, "published"))
  }));
};

const normalizeFeedEntry = (entry, source) => {
  const title = truncateText(entry.title, 180);
  const summary = truncateText(entry.content || entry.description || entry.title, 240);
  const parsedPublishedAt = Date.parse(entry.publishedAt || "");
  const publishedAt = Number.isNaN(parsedPublishedAt)
    ? new Date().toISOString()
    : new Date(parsedPublishedAt).toISOString();
  const category = detectCategory(title, summary, source.defaultCategory);
  const previewClass = getPreviewClass(category);
  const link = entry.link || source.siteUrl;
  const slug = `${slugify(title)}-${getHash(link)}`;

  const article = {
    slug,
    title,
    eyebrow: `${category.toLowerCase()} • agregador automatico`,
    date: formatArticleDate(publishedAt),
    category,
    previewClass,
    sourceName: source.name,
    sourceUrl: link,
    sourceLabel: title,
    imageUrl: extractImageUrl(entry.rawItem),
    imageCredit: `Credito: ${source.name}`,
    lede: summary,
    analysis:
      "Nota importada automaticamente do feed da fonte. O Atlas ainda nao produziu analise editorial propria para esta pauta.",
    body: buildParagraphs(summary),
    highlights: [],
    publishedAt,
    importedAt: new Date().toISOString(),
    kind: "runtime",
    feedSource: source.feedUrl
  };

  article.highlights = buildHighlights(article);
  return article;
};

const fetchSourceItems = async (source) => {
  const response = await fetch(source.feedUrl, {
    headers: {
      "user-agent": "Atlas-CZS-Bot/1.0 (+https://localhost)"
    },
    signal: AbortSignal.timeout(12000)
  });

  if (!response.ok) {
    throw new Error(`feed ${source.name} respondeu ${response.status}`);
  }

  const xml = await response.text();
  const entries = parseFeedEntries(xml)
    .filter((entry) => entry.title && entry.link)
    .slice(0, 12);

  return entries.map((entry) => normalizeFeedEntry(entry, source));
};

const updateNewsFeeds = async () => {
  if (refreshState.isRunning) {
    return readJson(RUNTIME_NEWS_FILE, DEFAULT_RUNTIME_NEWS);
  }

  refreshState.isRunning = true;
  const startedAt = new Date().toISOString();

  try {
    const current = await readJson(RUNTIME_NEWS_FILE, DEFAULT_RUNTIME_NEWS);
    const mergedMap = new Map(
      (Array.isArray(current.items) ? current.items : []).map((item) => [item.sourceUrl || item.slug, item])
    );
    const reports = [];
    let successCount = 0;

    for (const source of sourceConfig) {
      try {
        const items = await fetchSourceItems(source);
        successCount += 1;

        items.forEach((item) => {
          mergedMap.set(item.sourceUrl || item.slug, item);
        });

        reports.push({
          source: source.name,
          status: "ok",
          count: items.length,
          checkedAt: new Date().toISOString()
        });
      } catch (error) {
        reports.push({
          source: source.name,
          status: "offline",
          count: 0,
          checkedAt: new Date().toISOString(),
          error: error.message
        });
      }
    }

    const nextState = {
      lastAttemptAt: startedAt,
      lastSuccessAt: successCount > 0 ? new Date().toISOString() : current.lastSuccessAt,
      items: [...mergedMap.values()]
        .sort((left, right) => {
          const rightDate = Date.parse(right.publishedAt || right.importedAt || 0);
          const leftDate = Date.parse(left.publishedAt || left.importedAt || 0);
          return rightDate - leftDate;
        })
        .slice(0, 80),
      reports
    };

    await writeJson(RUNTIME_NEWS_FILE, nextState);
    return nextState;
  } finally {
    refreshState.isRunning = false;
  }
};

const parseRequestBody = async (request) => {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  const contentType = String(request.headers["content-type"] || "");

  if (contentType.includes("application/json")) {
    return JSON.parse(rawBody || "{}");
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(rawBody).entries());
  }

  return { rawBody };
};

const sendJson = (response, statusCode, payload) => {
  const body = `${JSON.stringify(payload, null, 2)}\n`;
  response.writeHead(statusCode, {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "Content-Type",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(body),
    "content-type": "application/json; charset=utf-8"
  });
  response.end(body);
};

const notFound = (response, message = "Nao encontrado") => {
  sendJson(response, 404, { error: message });
};

const getRuntimeNews = async () => readJson(RUNTIME_NEWS_FILE, DEFAULT_RUNTIME_NEWS);

const getVisibleComments = async () => {
  const comments = await readJson(COMMENTS_FILE, DEFAULT_COMMENTS);
  return comments
    .filter((comment) => comment.approved !== false)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
};

const createComment = async (payload) => {
  const name = truncateText(sanitizeText(payload.name || ""), 60);
  const message = truncateText(sanitizeText(payload.message || ""), 240);

  if (name.length < 2) {
    return { error: "Nome muito curto." };
  }

  if (message.length < 3) {
    return { error: "Comentario muito curto." };
  }

  const comments = await readJson(COMMENTS_FILE, DEFAULT_COMMENTS);
  const nextComment = {
    id: crypto.randomUUID(),
    name,
    badge: truncateText(sanitizeText(payload.badge || "Leitor local"), 40),
    message,
    createdAt: new Date().toISOString(),
    approved: true
  };

  comments.unshift(nextComment);
  await writeJson(COMMENTS_FILE, comments.slice(0, 200));
  return { comment: nextComment };
};

const createSubscription = async (payload) => {
  const name = truncateText(sanitizeText(payload.name || ""), 80);
  const email = String(payload.email || "").trim().toLowerCase();
  const whatsapp = truncateText(sanitizeText(payload.whatsapp || ""), 30);
  const plan = truncateText(sanitizeText(payload.plan || "resumo-7h"), 40);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "E-mail invalido." };
  }

  const subscriptions = await readJson(SUBSCRIPTIONS_FILE, []);
  const existingIndex = subscriptions.findIndex((entry) => entry.email === email);
  const nextEntry = {
    id: existingIndex >= 0 ? subscriptions[existingIndex].id : crypto.randomUUID(),
    name,
    email,
    whatsapp,
    plan,
    createdAt: existingIndex >= 0 ? subscriptions[existingIndex].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    subscriptions[existingIndex] = nextEntry;
  } else {
    subscriptions.unshift(nextEntry);
  }

  await writeJson(SUBSCRIPTIONS_FILE, subscriptions.slice(0, 1000));
  return { subscription: nextEntry };
};

const isSafeStaticPath = (pathname) => {
  const extension = path.extname(pathname).toLowerCase();
  return Boolean(MIME_TYPES[extension]);
};

const serveStaticFile = async (requestPath, response) => {
  const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
  const absolutePath = path.resolve(ROOT_DIR, `.${normalizedPath}`);

  if (!absolutePath.startsWith(ROOT_DIR) || !isSafeStaticPath(normalizedPath)) {
    notFound(response);
    return;
  }

  try {
    const fileBuffer = await fs.readFile(absolutePath);
    const extension = path.extname(absolutePath).toLowerCase();
    response.writeHead(200, { "content-type": MIME_TYPES[extension] || "application/octet-stream" });
    response.end(fileBuffer);
  } catch (error) {
    notFound(response);
  }
};

const handleApiRequest = async (request, response, url) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "Content-Type"
    });
    response.end();
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, {
      status: "ok",
      onlineUpdater: !refreshState.isRunning,
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/comments") {
    const comments = await getVisibleComments();
    sendJson(response, 200, { items: comments });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/comments") {
    const payload = await parseRequestBody(request);
    const result = await createComment(payload);

    if (result.error) {
      sendJson(response, 400, { error: result.error });
      return;
    }

    sendJson(response, 201, result);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/subscriptions") {
    const payload = await parseRequestBody(request);
    const result = await createSubscription(payload);

    if (result.error) {
      sendJson(response, 400, { error: result.error });
      return;
    }

    sendJson(response, 201, result);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/news") {
    const newsState = await getRuntimeNews();
    sendJson(response, 200, newsState);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/news/status") {
    const newsState = await getRuntimeNews();
    sendJson(response, 200, {
      lastAttemptAt: newsState.lastAttemptAt,
      lastSuccessAt: newsState.lastSuccessAt,
      reports: newsState.reports || []
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/news/refresh") {
    const nextState = await updateNewsFeeds();
    sendJson(response, 200, nextState);
    return;
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/news/")) {
    const slug = decodeURIComponent(url.pathname.replace("/api/news/", ""));
    const newsState = await getRuntimeNews();
    const item = (newsState.items || []).find((entry) => entry.slug === slug);

    if (!item) {
      notFound(response, "Noticia dinamica nao encontrada.");
      return;
    }

    sendJson(response, 200, { item });
    return;
  }

  notFound(response);
};

const createServer = () =>
  http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", `http://${request.headers.host || `localhost:${PORT}`}`);

      if (url.pathname.startsWith("/api/")) {
        await handleApiRequest(request, response, url);
        return;
      }

      await serveStaticFile(url.pathname, response);
    } catch (error) {
      sendJson(response, 500, {
        error: "Erro interno do servidor.",
        detail: error.message
      });
    }
  });

const startRefreshLoop = () => {
  if (refreshState.timer) {
    clearInterval(refreshState.timer);
  }

  refreshState.timer = setInterval(() => {
    updateNewsFeeds().catch((error) => {
      console.error("[atlas] falha no refresh automatico:", error.message);
    });
  }, REFRESH_INTERVAL_MS);
};

const main = async () => {
  await ensureDataFiles();

  if (process.argv.includes("--refresh-only")) {
    const result = await updateNewsFeeds();
    console.log(
      JSON.stringify(
        {
          lastAttemptAt: result.lastAttemptAt,
          lastSuccessAt: result.lastSuccessAt,
          totalItems: result.items?.length || 0
        },
        null,
        2
      )
    );
    return;
  }

  const server = createServer();
  server.listen(PORT, HOST, () => {
    console.log(`[atlas] servidor no ar em http://localhost:${PORT}`);
  });

  updateNewsFeeds().catch((error) => {
    console.error("[atlas] falha no refresh inicial:", error.message);
  });
  startRefreshLoop();
};

main().catch((error) => {
  console.error("[atlas] erro fatal:", error);
  process.exitCode = 1;
});
