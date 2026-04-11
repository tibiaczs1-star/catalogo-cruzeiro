const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3000);
const HOST = "0.0.0.0";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "99831455a";

const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, "data");
const INDEX_FILE = path.join(ROOT_DIR, "index.html");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function safeJoin(base, targetPath) {
  const target = path.normalize(path.join(base, targetPath));
  if (!target.startsWith(base)) return null;
  return target;
}

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (_error) {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf-8");
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function sendText(res, status, text) {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(text),
  });
  res.end(text);
}

function parseBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) req.destroy();
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (_error) {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

function mimeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".ico":
      return "image/x-icon";
    case ".txt":
      return "text/plain; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, buffer) => {
    if (err) {
      return sendText(res, 404, "Arquivo não encontrado.");
    }
    res.writeHead(200, {
      "Content-Type": mimeFor(filePath),
      "Cache-Control": "public, max-age=300",
      "Content-Length": buffer.length,
    });
    res.end(buffer);
  });
}

function normalizeNewsItem(item) {
  return {
    id: item.id || item.url || `news-${Date.now()}`,
    title: item.title || "Atualização",
    summary: item.summary || item.description || "Sem resumo.",
    url: item.url || "#",
    source: item.source || "Fonte local",
    category: item.category || "Geral",
    location: item.location || "Cruzeiro do Sul",
    date: item.date || item.publishedAt || new Date().toISOString(),
  };
}

function getNews(limit = 30) {
  const runtime = readJson(path.join(DATA_DIR, "runtime-news.json"), []);
  const archive = readJson(path.join(DATA_DIR, "news-archive.json"), []);
  const items = []
    .concat(Array.isArray(runtime) ? runtime : runtime.items || [])
    .concat(Array.isArray(archive) ? archive : archive.items || [])
    .map(normalizeNewsItem);

  const map = new Map();
  items.forEach((item) => {
    const key = item.id || item.url || item.title;
    if (!map.has(key)) map.set(key, item);
  });

  return Array.from(map.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

function getBusinesses(cityFilter) {
  const list = readJson(path.join(DATA_DIR, "businesses-cruzeiro.json"), []);
  const items = Array.isArray(list) ? list : [];
  if (!cityFilter) return items;
  return items.filter((item) =>
    String(item.city || "").toLowerCase().includes(String(cityFilter).toLowerCase())
  );
}

function requireAdmin(req) {
  const tokenFromHeader = req.headers["x-admin-token"];
  const tokenFromQuery = new URL(req.url, `http://${req.headers.host}`).searchParams.get("token");
  return tokenFromHeader === ADMIN_TOKEN || tokenFromQuery === ADMIN_TOKEN;
}

async function handleApi(req, res, pathname, searchParams) {
  if (pathname === "/health") {
    return sendJson(res, 200, { ok: true, service: "catalogo-cruzeiro", time: new Date().toISOString() });
  }

  if (req.method === "GET" && pathname === "/api/news/aggregator") {
    const limit = Number(searchParams.get("limit") || 30);
    return sendJson(res, 200, { items: getNews(Math.max(1, Math.min(200, limit))) });
  }

  if (req.method === "GET" && pathname === "/api/catalog/businesses") {
    const city = searchParams.get("city");
    return sendJson(res, 200, { items: getBusinesses(city) });
  }

  if (req.method === "GET" && pathname === "/api/comments") {
    const comments = readJson(path.join(DATA_DIR, "comments.json"), []);
    return sendJson(res, 200, { items: Array.isArray(comments) ? comments : [] });
  }

  if (req.method === "POST" && pathname === "/api/comments") {
    const body = await parseBody(req);
    const comments = readJson(path.join(DATA_DIR, "comments.json"), []);
    const nextItem = {
      id: `c-${Date.now()}`,
      name: String(body.name || "Leitor").slice(0, 80),
      text: String(body.text || "").slice(0, 2000),
      createdAt: new Date().toISOString(),
    };
    const next = Array.isArray(comments) ? comments : [];
    next.push(nextItem);
    writeJson(path.join(DATA_DIR, "comments.json"), next);
    return sendJson(res, 201, { ok: true, item: nextItem });
  }

  if (req.method === "POST" && pathname === "/api/subscriptions") {
    const body = await parseBody(req);
    const subs = readJson(path.join(DATA_DIR, "subscriptions.json"), []);
    const nextItem = {
      id: `s-${Date.now()}`,
      email: String(body.email || "").trim().toLowerCase(),
      name: String(body.name || "").slice(0, 100),
      createdAt: new Date().toISOString(),
    };
    const next = Array.isArray(subs) ? subs : [];
    if (nextItem.email) next.push(nextItem);
    writeJson(path.join(DATA_DIR, "subscriptions.json"), next);
    return sendJson(res, 201, { ok: true, item: nextItem });
  }

  if (req.method === "GET" && pathname === "/api/admin/overview") {
    if (!requireAdmin(req)) return sendJson(res, 401, { ok: false, message: "Não autorizado." });

    const comments = readJson(path.join(DATA_DIR, "comments.json"), []);
    const subs = readJson(path.join(DATA_DIR, "subscriptions.json"), []);
    const news = getNews(200);
    const biz = getBusinesses();

    return sendJson(res, 200, {
      ok: true,
      totals: {
        comments: Array.isArray(comments) ? comments.length : 0,
        subscriptions: Array.isArray(subs) ? subs.length : 0,
        news: Array.isArray(news) ? news.length : 0,
        businesses: Array.isArray(biz) ? biz.length : 0,
      },
      updatedAt: new Date().toISOString(),
    });
  }

  return sendJson(res, 404, { ok: false, message: "Rota não encontrada." });
}

function handleStatic(req, res, pathname) {
  if (pathname === "/") return sendFile(res, INDEX_FILE);

  const decodedPath = decodeURIComponent(pathname);
  const safePath = safeJoin(ROOT_DIR, decodedPath.replace(/^\/+/, ""));

  if (!safePath) return sendText(res, 400, "Caminho inválido.");

  if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    return sendFile(res, safePath);
  }

  if (!path.extname(decodedPath) && fs.existsSync(INDEX_FILE)) {
    return sendFile(res, INDEX_FILE);
  }

  return sendText(res, 404, "Página não encontrada.");
}

ensureDataDir();

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = requestUrl.pathname;

  if (pathname.startsWith("/api/") || pathname === "/health") {
    return handleApi(req, res, pathname, requestUrl.searchParams);
  }

  return handleStatic(req, res, pathname);
});

server.listen(PORT, HOST, () => {
  console.log(`[catalogo] online em http://${HOST}:${PORT}`);
});

