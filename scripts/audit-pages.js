"use strict";

// Varre paginas locais por HTTP: status, tamanho, presenca das camadas,
// titulo e links/imagens mortos no HTML servido.
//
// Uso: node scripts/audit-pages.js [baseUrl]

const http = require("node:http");
const https = require("node:https");
const { URL } = require("node:url");

const BASE = process.argv[2] || "http://127.0.0.1:3321";
const PAGES = [
  "/",
  "/noticia.html",
  "/catalogo-servicos.html",
  "/games.html",
  "/galeria.html",
  "/divulgue.html",
  "/arquivo.html",
  "/estudantes.html",
  "/fontes-monitoradas.html",
  "/legal.html",
  "/projetos.html",
  "/vendas.html",
  "/czslbs/",
  "/bookray/",
  "/metafest/",
  "/questfest/",
  "/cruzeiro-do-sul-barzinho/",
  "/reservar/hotel-jurua-palace/",
  "/pubpaid.html",
  "/agente-vivo/registro.json",
  "/enxame/enxame.js",
  "/enxame/swarm-rebuild.js"
];

function get(url, redirects = 3) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch (_e) {
      return resolve({ status: 0, body: "", error: "url invalida" });
    }
    const mod = parsed.protocol === "https:" ? https : http;
    const req = mod.get(url, { headers: { "user-agent": "CatalogoCZS-Audit/1.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
        res.resume();
        return resolve(get(new URL(res.headers.location, url).toString(), redirects - 1));
      }
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, body, headers: res.headers }));
    });
    req.setTimeout(20000, () => { req.destroy(); resolve({ status: 0, body: "", error: "timeout" }); });
    req.on("error", (e) => resolve({ status: 0, body: "", error: e.code || e.message }));
  });
}

(async () => {
  console.log("pagina | status | bytes | camadas | titulo");
  console.log("---");
  let problems = 0;

  for (const page of PAGES) {
    const res = await get(BASE + page);
    const body = res.body || "";
    const titleMatch = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim().slice(0, 34) : "";
    const layers = [
      body.includes("data-czs-swarm-rebuild") ? "swarm" : "",
      body.includes("data-czs-enxame") ? "enxame" : ""
    ].filter(Boolean).join("+") || "-";
    const ok = res.status === 200;
    if (!ok) problems += 1;
    console.log(
      `${page} | ${res.status}${ok ? "" : " !!"} | ${body.length} | ${layers} | ${title}${res.error ? " (" + res.error + ")" : ""}`
    );
  }

  console.log("---");
  console.log(problems ? `PROBLEMAS: ${problems}` : "todas as paginas responderam 200");
  process.exit(problems ? 1 : 0);
})();
