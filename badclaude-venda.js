/* ============================================================
   BADCLAUDE — venda por PIX dentro do catálogo
   Tudo em um arquivo, sem dependência nova: QR vem do pacote
   qrcode já instalado no catálogo.

   Rotas (registradas em server.js):
     GET  /api/badclaude/planos
     POST /api/badclaude/pedido
     GET  /api/badclaude/pedido/:id/pix.svg
     POST /api/badclaude/pedido/:id/comprovante
     GET  /api/badclaude/pedido/:id/status
     POST /api/badclaude/acesso
     GET  /api/badclaude/admin/pedidos
     POST /api/badclaude/admin/pedido/:id/aprovar
     GET  /api/badclaude/admin/pedido/:id/comprovante
   ============================================================ */

"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PLANOS = {
  basic: { id: "basic", tier: "client-basic", nome: "Cliente Básico", preco: 79, duracao: "7 dias (BYOK)", horas: 168 },
  mid: { id: "mid", tier: "client-mid", nome: "Cliente Studio", preco: 179, duracao: "30 dias (APIs Grátis + Super Poderes)", horas: 720 },
  superbad: { id: "superbad", tier: "client-mid", nome: "BadClaude SuperBad", preco: 350, duracao: "30 dias (Portal + Releases)", horas: 720 },
  founder: { id: "founder", tier: "founder", nome: "Edição Fundador", preco: 690, duracao: "30 dias (Nuvem + 3 Camadas Blindado)", horas: 720 },
  // Aliases legados redirecionados para os mesmos planos ativos no PIX oficial
  dez: { id: "dez", tier: "client-basic", nome: "Passe Rápido", preco: 10, duracao: "8 horas", horas: 8 },
  dia: { id: "dia", tier: "client-basic", nome: "1 Dia", preco: 20, duracao: "24 horas", horas: 24 },
  semana: { id: "semana", tier: "client-basic", nome: "Cliente Básico (7d)", preco: 79, duracao: "168 horas", horas: 168 },
  quinzena: { id: "quinzena", tier: "client-mid", nome: "Studio Quinzena", preco: 100, duracao: "360 horas", horas: 360 },
  mes: { id: "mes", tier: "client-mid", nome: "Cliente Studio (30d)", preco: 179, duracao: "720 horas", horas: 720 },
  bilhao: { id: "bilhao", tier: "client-mid", nome: "BadClaude SuperBad", preco: 350, duracao: "30 dias completos", horas: 720 },
  fundador: { id: "fundador", tier: "founder", nome: "Edição Fundador", preco: 690, duracao: "30 dias blindados", horas: 720 },
};

const JANELA_MS = 30 * 60 * 1000;

function criarVendaBadclaude({ dataDir, sendJson, parseBody, qrcode, isAdmin }) {
  const checkAdmin = typeof isAdmin === "function" ? isAdmin : () => false;
  const dir = path.join(dataDir, "badclaude");
  const arquivo = path.join(dir, "pedidos.json");
  const recibos = path.join(dir, "comprovantes");

  const pixChave = String(process.env.BADCLAUDE_PIX_KEY || process.env.SUPERBAD_PIX_KEY || "+5568992269296").trim();
  const pixDisplay = String(process.env.SUPERBAD_PIX_DISPLAY_KEY || "68 99226-9296").trim();
  const pixNome = String(process.env.BADCLAUDE_PIX_NAME || process.env.SUPERBAD_PIX_RECIPIENT || "Raiane Lenoncio").toUpperCase().slice(0, 25);
  const pixCidade = String(process.env.BADCLAUDE_PIX_CITY || process.env.SUPERBAD_PIX_CITY || "CRUZEIRO DO SUL").toUpperCase().slice(0, 15);
  const whatsapp = String(process.env.BADCLAUDE_WHATSAPP || process.env.SUPERBAD_WHATSAPP || "5568992269296").replace(/\D/g, "");
  const emailAviso = String(process.env.BADCLAUDE_EMAIL || "");

  let fila = Promise.resolve();
  const serial = (fn) => { fila = fila.then(fn, fn); return fila; };

  async function ler() {
    try {
      const raw = await fs.promises.readFile(arquivo, "utf8");
      const d = JSON.parse(raw);
      return Array.isArray(d) ? d : [];
    } catch { return []; }
  }

  async function salvar(rows) {
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(arquivo, JSON.stringify(rows, null, 2), "utf8");
  }

  function pixCopiaECola(valor, txid, descricao) {
    const campo = (id, v) => `${id}${String(String(v).length).padStart(2, "0")}${v}`;
    const limpar = (v, n) => String(v || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z0-9 /.-]/g, " ").replace(/\s+/g, " ").trim().toUpperCase().slice(0, n);

    const conta = [campo("00", "br.gov.bcb.pix"), campo("01", pixChave)];
    const desc = limpar(descricao, 40);
    if (desc) conta.push(campo("02", desc));

    const base = [
      campo("00", "01"), campo("01", "12"), campo("26", conta.join("")),
      campo("52", "0000"), campo("53", "986"),
      campo("54", Number(valor).toFixed(2)),
      campo("58", "BR"),
      campo("59", limpar(pixNome, 25) || "BADCLAUDE"),
      campo("60", limpar(pixCidade, 15) || "CRUZEIRO SUL"),
      campo("62", campo("05", String(txid).replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 25))),
      "6304",
    ].join("");

    let crc = 0xffff;
    for (let i = 0; i < base.length; i += 1) {
      crc ^= base.charCodeAt(i) << 8;
      for (let b = 0; b < 8; b += 1) {
        crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
      }
    }
    return base + crc.toString(16).toUpperCase().padStart(4, "0");
  }

  function gerarSenha() {
    const alfa = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < 3; i += 1) {
      if (i) out += "-";
      for (let j = 0; j < 4; j += 1) out += alfa[crypto.randomInt(alfa.length)];
    }
    return out;
  }

  async function avisarPorEmail(pedido) {
    if (!emailAviso) return { enviado: false, motivo: "sem e-mail configurado" };
    const linha = [
      `Pedido: ${pedido.id}`,
      `Plano: ${pedido.plano} · R$ ${pedido.valor}`,
      `Nome: ${pedido.nome}`,
      `Contato: ${pedido.contato}`,
      `WhatsApp: ${pedido.whatsappCliente || "—"}`,
      `Comprovante: ${pedido.comprovante || "sem anexo"}`,
      `Criado em: ${pedido.at}`,
    ].join("\n");
    try {
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.appendFile(path.join(dir, "avisos.log"), `\n--- ${pedido.id}\n${linha}\n`, "utf8");
    } catch (e) {}
    return { enviado: false, motivo: "gravado em avisos.log" };
  }

  async function tratar(req, res, pathname) {
    /* ---------- públicos ---------- */
    if (req.method === "GET" && pathname === "/api/badclaude/planos") {
      return sendJson(res, 200, { ok: true, planos: Object.values(PLANOS), whatsapp, pixNome, pixChave: pixDisplay });
    }

    if (req.method === "POST" && pathname === "/api/badclaude/pedido") {
      const body = await parseBody(req);
      const plano = PLANOS[String(body.plano || "")];
      if (!plano) return sendJson(res, 404, { ok: false, error: "plano inválido" });
      const nome = String(body.nome || "").trim().slice(0, 120);
      const contato = String(body.contato || "").trim().slice(0, 160);
      if (!nome || !contato) return sendJson(res, 400, { ok: false, error: "nome e contato obrigatórios" });

      const pedido = await serial(async () => {
        const rows = await ler();
        const txid = "BC" + Date.now().toString(36).toUpperCase();
        const p = {
          id: crypto.randomBytes(4).toString("hex").toUpperCase(),
          txid,
          at: new Date().toISOString(),
          expiraEm: new Date(Date.now() + JANELA_MS).toISOString(),
          plano: plano.nome,
          planoId: plano.id,
          valor: plano.preco,
          horas: plano.horas,
          nome,
          contato,
          whatsappCliente: String(body.whatsapp || "").replace(/\D/g, "").slice(0, 20),
          status: "aguardando_pix",
          comprovante: "",
          senha: "",
          acessadoEm: "",
          expiraAcessoEm: "",
          observacao: "",
        };
        rows.push(p);
        await salvar(rows);
        return p;
      });

      const copia = pixCopiaECola(pedido.valor, pedido.txid, "BADCLAUDE " + pedido.plano);
      return sendJson(res, 201, { ok: true, pedido, copiaECola: copia, whatsapp });
    }

    const mPix = pathname.match(/^\/api\/badclaude\/pedido\/([A-F0-9]+)\/pix\.svg$/);
    if (req.method === "GET" && mPix) {
      const rows = await ler();
      const p = rows.find((r) => r.id === mPix[1]);
      if (!p) return sendJson(res, 404, { ok: false });
      const copia = pixCopiaECola(p.valor, p.txid, "BADCLAUDE " + p.plano);
      const svg = await qrcode.toString(copia, { type: "svg", margin: 1, width: 380, errorCorrectionLevel: "M" });
      res.writeHead(200, { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" });
      return res.end(svg);
    }

    const mComp = pathname.match(/^\/api\/badclaude\/pedido\/([A-F0-9]+)\/comprovante$/);
    if (req.method === "POST" && mComp) {
      const body = await parseBody(req);
      const id = mComp[1];
      const saida = await serial(async () => {
        const rows = await ler();
        const p = rows.find((r) => r.id === id);
        if (!p) return null;
        let nomeArq = "";
        if (body.base64) {
          const buf = Buffer.from(String(body.base64).replace(/^data:[^;]+;base64,/, ""), "base64");
          if (buf.length > 8 * 1024 * 1024) throw new Error("comprovante maior que 8 MB");
          await fs.promises.mkdir(recibos, { recursive: true });
          const seguro = String(body.nomeArquivo || "comprovante.png").replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 100);
          nomeArq = `${p.id}-${Date.now()}-${seguro}`;
          await fs.promises.writeFile(path.join(recibos, nomeArq), buf);
        }
        p.comprovante = nomeArq;
        p.observacao = String(body.observacao || "").slice(0, 500);
        p.status = "conferindo";
        await salvar(rows);
        return p;
      });
      if (!saida) return sendJson(res, 404, { ok: false });
      await avisarPorEmail(saida);
      return sendJson(res, 200, { ok: true, pedido: saida });
    }

    const mSt = pathname.match(/^\/api\/badclaude\/pedido\/([A-F0-9]+)\/status$/);
    if (req.method === "GET" && mSt) {
      const rows = await ler();
      const p = rows.find((r) => r.id === mSt[1]);
      if (!p) return sendJson(res, 404, { ok: false });
      const liberado = p.status === "aprovado" || p.status === "em_uso";
      return sendJson(res, 200, {
        ok: true,
        status: p.status,
        senha: liberado ? p.senha : "",
        horas: p.horas,
        expiraEm: p.expiraEm,
        expiraAcessoEm: p.expiraAcessoEm,
      });
    }

    if (req.method === "POST" && pathname === "/api/badclaude/acesso") {
      const body = await parseBody(req);
      const senha = String(body.senha || "").trim().toUpperCase();
      const rows = await ler();
      const p = rows.find((r) => r.senha && r.senha === senha);
      if (!p) return sendJson(res, 401, { ok: false, motivo: "senha inválida" });
      if (p.status === "expirado") return sendJson(res, 401, { ok: false, motivo: "plano expirado" });
      if (p.status === "conferindo" || p.status === "aguardando_pix") {
        return sendJson(res, 401, { ok: false, motivo: "pagamento ainda não confirmado" });
      }
      if (p.expiraAcessoEm && new Date(p.expiraAcessoEm).getTime() < Date.now()) {
        return sendJson(res, 401, { ok: false, motivo: "tempo esgotado" });
      }
      if (p.status === "aprovado") {
        p.acessadoEm = new Date().toISOString();
        p.expiraAcessoEm = new Date(Date.now() + (p.horas || 24) * 3600 * 1000).toISOString();
        p.status = "em_uso";
        await serial(async () => salvar(rows));
      }
      return sendJson(res, 200, {
        ok: true,
        pedido: { id: p.id, plano: p.plano, nome: p.nome },
        horas: p.horas,
        acessadoEm: p.acessadoEm,
        expiraAcessoEm: p.expiraAcessoEm,
      });
    }

    /* ---------- admin ---------- */
    if (pathname.startsWith("/api/badclaude/admin/") && !checkAdmin(req)) {
      return sendJson(res, 401, { ok: false, error: "Acesso administrativo obrigatório." });
    }
    if (req.method === "GET" && pathname === "/api/badclaude/admin/pedidos") {
      const rows = await ler();
      const lista = rows.slice().sort((a, b) => String(b.at).localeCompare(String(a.at)));
      return sendJson(res, 200, { ok: true, count: lista.length, pedidos: lista });
    }

    const mAprov = pathname.match(/^\/api\/badclaude\/admin\/pedido\/([A-F0-9]+)\/aprovar$/);
    if (req.method === "POST" && mAprov) {
      const saida = await serial(async () => {
        const rows = await ler();
        const p = rows.find((r) => r.id === mAprov[1]);
        if (!p) return null;
        p.status = "aprovado";
        p.conferidoEm = new Date().toISOString();
        if (!p.senha) p.senha = gerarSenha();
        await salvar(rows);
        return p;
      });
      return sendJson(res, saida ? 200 : 404, saida ? { ok: true, pedido: saida } : { ok: false });
    }

    const mRec = pathname.match(/^\/api\/badclaude\/admin\/pedido\/([A-F0-9]+)\/comprovante$/);
    if (req.method === "GET" && mRec) {
      const rows = await ler();
      const p = rows.find((r) => r.id === mRec[1]);
      if (!p || !p.comprovante) return sendJson(res, 404, { ok: false });
      const alvo = path.join(recibos, path.basename(p.comprovante));
      try {
        const buf = await fs.promises.readFile(alvo);
        const ext = path.extname(alvo).toLowerCase();
        const tipo = ext === ".pdf" ? "application/pdf" : ext === ".png" ? "image/png" : /\.jpe?g$/.test(ext) ? "image/jpeg" : "application/octet-stream";
        const nomeSeguro = path.basename(alvo).replace(/[^A-Za-z0-9._-]/g, "_");
        res.writeHead(200, {
          "Content-Type": tipo,
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "Content-Disposition": `attachment; filename="${nomeSeguro}"`,
        });
        return res.end(buf);
      } catch {
        return sendJson(res, 404, { ok: false });
      }
    }

    return sendJson(res, 404, { ok: false, error: "rota badclaude desconhecida" });
  }

  return { tratar, PLANOS };
}

module.exports = { criarVendaBadclaude, PLANOS };