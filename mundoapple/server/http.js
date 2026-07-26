"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const {
  buildExpiredSessionCookie,
  buildSessionCookie,
  createRateLimiter,
  issueSessionToken,
  parseSessionToken,
  readCookie,
  verifyPassword,
} = require("./auth");

const API_PREFIX = "/api/mundoapple";
const MAX_JSON_BYTES = 12 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = new Map([
  ["application/pdf", ".pdf"],
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

const HELP_TOPICS = [
  {
    id: "catalog",
    title: "Catálogo mestre",
    summary: "Escolha um produto Apple da lista e use “Colocar no estoque”. A lista mestre não representa estoque físico.",
  },
  {
    id: "inventory",
    title: "Estoque",
    summary: "Informe quantidade, estado, garantia, custos, preço web e preço de retirada. O anúncio só aparece quando estiver publicado e com saldo.",
  },
  {
    id: "pricing",
    title: "Custos, lucro e margem",
    summary: "O custo final soma compra, frete, motoboy, embalagem, preparação e reserva de garantia. O lucro final desconta taxas, desconto e despesas da venda.",
  },
  {
    id: "sales",
    title: "Vendas e baixa",
    summary: "Crie a venda como pendente e dê baixa apenas quando receber. A mesma baixa não pode ser aplicada duas vezes.",
  },
  {
    id: "trade-in",
    title: "Aparelho de entrada",
    summary: "Registre modelo, IMEI, estado, avaliação e observações do aparelho recebido como parte do pagamento.",
  },
  {
    id: "documents",
    title: "Comprovantes e documentos",
    summary: "Anexe PDF, JPG, PNG ou WebP de até 8 MB e vincule à venda ou despesa. O arquivo fica privado no administrativo.",
  },
  {
    id: "payments",
    title: "Pagamentos",
    summary: "Dinheiro, Pix e maquininha têm confirmação manual. Mercado Pago, PagBank e Asaas aparecem como opções futuras e só serão ligados com credenciais próprias.",
  },
  {
    id: "receipt",
    title: "Recibo e garantia",
    summary: "Abra uma venda para imprimir o recibo com cliente, aparelho, condição, IMEI, pagamento, data e dias de garantia.",
  },
];

function sendJson(res, statusCode, value, headers = {}) {
  if (res.writableEnded) return;
  const body = JSON.stringify(value);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(body),
    ...headers,
  });
  res.end(body);
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_JSON_BYTES) {
      const error = new Error("Conteúdo muito grande.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new TypeError("JSON inválido.");
    error.statusCode = 400;
    throw error;
  }
}

function safeFilename(name, extension) {
  const base = path
    .basename(String(name || "documento"), path.extname(String(name || "")))
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "documento";
  return `${base}${extension}`;
}

function requestIp(req) {
  return String(req.socket?.remoteAddress || "unknown");
}

function createMundoAppleHandler(options = {}) {
  const {
    store,
    catalog = [],
    adminUser = "",
    passwordHash = "",
    sessionSecret = "",
    secureCookies = true,
    documentsDir,
  } = options;
  if (!store) throw new TypeError("Store do Mundo Apple é obrigatório.");
  const documentRoot = path.resolve(documentsDir || path.join(process.cwd(), "render-data", "mundoapple", "documents"));
  const loginLimiter = createRateLimiter({ maxAttempts: 6, windowMs: 15 * 60 * 1_000 });

  function authenticated(req) {
    const token = readCookie(req);
    return parseSessionToken(token, { secret: sessionSecret });
  }

  function requireAdmin(req, res) {
    const session = authenticated(req);
    if (!session) {
      sendJson(res, 401, { ok: false, error: "Acesso administrativo não autorizado." });
      return null;
    }
    return session;
  }

  async function uploadDocument(input) {
    const extension = ALLOWED_DOCUMENT_TYPES.get(String(input.mimeType || "").toLowerCase());
    if (!extension) throw new TypeError("Formato não permitido. Use PDF, JPG, PNG ou WebP.");
    let buffer;
    try {
      buffer = Buffer.from(String(input.contentBase64 || ""), "base64");
    } catch {
      throw new TypeError("Arquivo inválido.");
    }
    if (!buffer.length) throw new TypeError("Arquivo vazio.");
    if (buffer.length > MAX_DOCUMENT_BYTES) {
      const error = new Error("O arquivo ultrapassa 8 MB.");
      error.statusCode = 413;
      throw error;
    }
    await fs.mkdir(documentRoot, { recursive: true });
    const storageName = `${crypto.randomUUID()}-${safeFilename(input.name, extension)}`;
    const fullPath = path.join(documentRoot, storageName);
    await fs.writeFile(fullPath, buffer, { flag: "wx", mode: 0o600 });
    try {
      return await store.addDocument({
        name: safeFilename(input.name, extension),
        mimeType: String(input.mimeType).toLowerCase(),
        size: buffer.length,
        relativePath: storageName,
        kind: input.kind,
        saleId: input.saleId,
        expenseId: input.expenseId,
      });
    } catch (error) {
      await fs.rm(fullPath, { force: true });
      throw error;
    }
  }

  async function downloadDocument(id, res) {
    const document = await store.getDocument(id);
    if (!document) {
      sendJson(res, 404, { ok: false, error: "Documento não encontrado." });
      return;
    }
    const fullPath = path.resolve(documentRoot, document.relativePath);
    if (!fullPath.startsWith(`${documentRoot}${path.sep}`)) {
      sendJson(res, 400, { ok: false, error: "Caminho de documento inválido." });
      return;
    }
    try {
      const data = await fs.readFile(fullPath);
      res.writeHead(200, {
        "content-type": document.mimeType,
        "content-length": data.length,
        "content-disposition": `attachment; filename="${safeFilename(document.name, path.extname(document.name))}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      });
      res.end(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        sendJson(res, 404, { ok: false, error: "Arquivo não encontrado." });
        return;
      }
      throw error;
    }
  }

  return async function handleMundoApple(req, res) {
    const requestUrl = new URL(req.url, "http://localhost");
    const pathname = requestUrl.pathname.replace(/\/+$/, "") || "/";
    if (!pathname.startsWith(API_PREFIX)) return false;

    try {
      if (pathname === `${API_PREFIX}/catalog` && req.method === "GET") {
        sendJson(res, 200, { ok: true, items: await store.listPublicCatalog() });
        return true;
      }
      if (pathname === `${API_PREFIX}/payments/status` && req.method === "GET") {
        sendJson(res, 200, {
          ok: true,
          enabled: false,
          mode: "disabled",
          providers: ["Mercado Pago", "PagBank", "Asaas"],
        });
        return true;
      }
      if (pathname === `${API_PREFIX}/auth/session` && req.method === "GET") {
        const session = authenticated(req);
        sendJson(res, session ? 200 : 401, { ok: Boolean(session), session });
        return true;
      }
      if (pathname === `${API_PREFIX}/auth/login` && req.method === "POST") {
        if (!adminUser || !passwordHash || sessionSecret.length < 32) {
          sendJson(res, 503, { ok: false, error: "Acesso administrativo ainda não configurado." });
          return true;
        }
        const key = requestIp(req);
        const rate = loginLimiter.consume(key);
        if (!rate.allowed) {
          sendJson(res, 429, { ok: false, error: "Muitas tentativas. Aguarde alguns minutos." }, {
            "retry-after": Math.ceil(rate.retryAfterMs / 1_000),
          });
          return true;
        }
        const input = await readJson(req);
        const userMatches = crypto.timingSafeEqual(
          crypto.createHash("sha256").update(String(input.username || "")).digest(),
          crypto.createHash("sha256").update(String(adminUser)).digest(),
        );
        const passwordMatches = await verifyPassword(input.password, passwordHash);
        if (!userMatches || !passwordMatches) {
          sendJson(res, 401, { ok: false, error: "Usuário ou senha inválidos." });
          return true;
        }
        loginLimiter.reset(key);
        const token = issueSessionToken({ sub: adminUser, role: "admin" }, { secret: sessionSecret });
        sendJson(res, 200, { ok: true, user: { username: adminUser, role: "admin" } }, {
          "set-cookie": buildSessionCookie(token, { secure: secureCookies }),
        });
        return true;
      }
      if (pathname === `${API_PREFIX}/auth/logout` && req.method === "POST") {
        sendJson(res, 200, { ok: true }, {
          "set-cookie": buildExpiredSessionCookie({ secure: secureCookies }),
        });
        return true;
      }

      if (!pathname.startsWith(`${API_PREFIX}/admin`)) {
        sendJson(res, 404, { ok: false, error: "Rota não encontrada." });
        return true;
      }
      if (!requireAdmin(req, res)) return true;

      if (pathname === `${API_PREFIX}/admin/dashboard` && req.method === "GET") {
        sendJson(res, 200, { ok: true, item: await store.getDashboard() });
      } else if (pathname === `${API_PREFIX}/admin/catalog` && req.method === "GET") {
        sendJson(res, 200, { ok: true, items: catalog.length ? catalog : await store.listMasterCatalog() });
      } else if (pathname === `${API_PREFIX}/admin/inventory` && req.method === "GET") {
        sendJson(res, 200, { ok: true, items: await store.listInventory() });
      } else if (pathname === `${API_PREFIX}/admin/inventory` && req.method === "POST") {
        sendJson(res, 201, { ok: true, item: await store.addInventory(await readJson(req)) });
      } else if (/^\/api\/mundoapple\/admin\/inventory\/[^/]+$/.test(pathname) && req.method === "PATCH") {
        const id = decodeURIComponent(pathname.split("/").at(-1));
        sendJson(res, 200, { ok: true, item: await store.updateInventory(id, await readJson(req)) });
      } else if (pathname === `${API_PREFIX}/admin/sales` && req.method === "GET") {
        sendJson(res, 200, { ok: true, items: await store.listSales() });
      } else if (pathname === `${API_PREFIX}/admin/sales` && req.method === "POST") {
        sendJson(res, 201, { ok: true, item: await store.createSale(await readJson(req)) });
      } else if (/^\/api\/mundoapple\/admin\/sales\/[^/]+\/settle$/.test(pathname) && req.method === "POST") {
        const id = decodeURIComponent(pathname.split("/").at(-2));
        sendJson(res, 200, { ok: true, item: await store.settleSale(id, await readJson(req)) });
      } else if (/^\/api\/mundoapple\/admin\/sales\/[^/]+$/.test(pathname) && req.method === "GET") {
        const id = decodeURIComponent(pathname.split("/").at(-1));
        const item = await store.getSale(id);
        sendJson(res, item ? 200 : 404, item ? { ok: true, item } : { ok: false, error: "Venda não encontrada." });
      } else if (pathname === `${API_PREFIX}/admin/expenses` && req.method === "GET") {
        sendJson(res, 200, { ok: true, items: await store.listExpenses() });
      } else if (pathname === `${API_PREFIX}/admin/expenses` && req.method === "POST") {
        sendJson(res, 201, { ok: true, item: await store.addExpense(await readJson(req)) });
      } else if (pathname === `${API_PREFIX}/admin/cash` && req.method === "GET") {
        sendJson(res, 200, { ok: true, items: await store.listCashEntries() });
      } else if (pathname === `${API_PREFIX}/admin/documents` && req.method === "GET") {
        sendJson(res, 200, { ok: true, items: await store.listDocuments() });
      } else if (pathname === `${API_PREFIX}/admin/documents` && req.method === "POST") {
        sendJson(res, 201, { ok: true, item: await uploadDocument(await readJson(req)) });
      } else if (/^\/api\/mundoapple\/admin\/documents\/[^/]+\/download$/.test(pathname) && req.method === "GET") {
        await downloadDocument(decodeURIComponent(pathname.split("/").at(-2)), res);
      } else if (pathname === `${API_PREFIX}/admin/help` && req.method === "GET") {
        sendJson(res, 200, { ok: true, items: HELP_TOPICS });
      } else {
        sendJson(res, 404, { ok: false, error: "Rota administrativa não encontrada." });
      }
      return true;
    } catch (error) {
      const statusCode = error.statusCode || (error instanceof TypeError ? 400 : 500);
      const message = statusCode >= 500 ? "Não foi possível concluir a operação." : error.message;
      sendJson(res, statusCode, { ok: false, error: message });
      return true;
    }
  };
}

module.exports = {
  HELP_TOPICS,
  createMundoAppleHandler,
};
