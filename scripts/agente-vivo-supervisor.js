"use strict";

/* ============================================================
   Supervisor dos Agentes ao Vivo.
   Percorre as páginas publicadas e grava, em agente-vivo/registro.json,
   só o que consegue provar: seções, imagens existentes, links internos
   resolvidos e o resultado do último teste de rotas.

   Uso:  node scripts/agente-vivo-supervisor.js
   O painel no site lê esse arquivo; se ele não existir ou estiver velho,
   o painel mostra a leitura real da página em vez de inventar atividade.
   ============================================================ */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "agente-vivo", "registro.json");

const PUBLIC_PAGES = [
  "index.html",
  "noticia.html",
  "catalogo-servicos.html",
  "games.html",
  "galeria.html",
  "divulgue.html",
  "arquivo.html",
  "estudantes.html",
  "fontes-monitoradas.html",
  "legal.html",
  "projetos.html",
  "vendas.html"
];

function read(file) {
  try {
    return fs.readFileSync(path.join(ROOT, file), "utf8");
  } catch (_error) {
    return "";
  }
}

function countSections(html) {
  const matches = html.match(/<section\b/gi);
  return matches ? matches.length : 0;
}

function checkImages(html) {
  const refs = [];
  const re = /<img\b[^>]*\bsrc=["']([^"']+)["']/gi;
  let match;
  while ((match = re.exec(html))) {
    const src = match[1];
    if (!src || /^(https?:|data:|\/\/)/i.test(src)) continue;
    // Imagem montada por template no cliente não é arquivo do repositório.
    if (src.includes("${") || src.includes("{{")) continue;
    refs.push(src.split("?")[0].split("#")[0]);
  }
  const unique = Array.from(new Set(refs));
  const missing = unique.filter((src) => {
    const local = src.startsWith("/") ? src.slice(1) : src;
    return !fs.existsSync(path.join(ROOT, local));
  });
  return { total: unique.length, missing };
}

function checkLinks(html) {
  const refs = [];
  const re = /href=["'](\/[^"'#?]+)["']/gi;
  let match;
  while ((match = re.exec(html))) refs.push(match[1]);
  const unique = Array.from(new Set(refs)).filter((href) => {
    return !/^\/(api|agente-vivo)\//.test(href);
  });
  const missing = unique.filter((href) => {
    const target = path.join(ROOT, href.replace(/^\//, ""));
    return !(fs.existsSync(target) || fs.existsSync(target + ".html") || fs.existsSync(path.join(target, "index.html")));
  });
  return { total: unique.length, missing };
}

function build() {
  let pages = 0;
  let sections = 0;
  let images = 0;
  const missingImages = [];
  let links = 0;
  const missingLinks = [];

  for (const page of PUBLIC_PAGES) {
    const html = read(page);
    if (!html) continue;
    pages += 1;
    sections += countSections(html);

    const imgs = checkImages(html);
    images += imgs.total;
    imgs.missing.forEach((m) => missingImages.push(`${page}: ${m}`));

    const hrefs = checkLinks(html);
    links += hrefs.total;
    hrefs.missing.forEach((m) => missingLinks.push(`${page}: ${m}`));
  }

  const subpages = ["czslbs/index.html", "bookray/index.html", "metafest/index.html", "questfest/index.html", "cruzeiro-do-sul-barzinho/index.html"]
    .filter((page) => fs.existsSync(path.join(ROOT, page)));

  const machines = [
    {
      label: "Leitor de estrutura",
      note: `${sections} seções lidas em ${pages} páginas públicas`,
      status: "ok"
    },
    {
      label: "Verificador de imagem",
      note: missingImages.length
        ? `${missingImages.length} imagem(ns) sem arquivo local`
        : `${images} imagens resolvem no disco`,
      status: missingImages.length ? "alert" : "ok"
    },
    {
      label: "Guardião de rotas",
      note: missingLinks.length
        ? `${missingLinks.length} link(s) interno(s) sem destino`
        : `${links} links internos conferidos`,
      status: missingLinks.length ? "alert" : "ok"
    },
    {
      label: "Indexador de subsistemas",
      note: `${subpages.length} subsistemas publicados: ${subpages.map((p) => p.split("/")[0]).join(", ")}`,
      status: "ok"
    },
    {
      label: "Inspetor de reservas",
      note: fs.existsSync(path.join(ROOT, "reservar", "hotel-jurua-palace", "index.html"))
        ? "página de reserva publicada"
        : "página de reserva ausente",
      status: fs.existsSync(path.join(ROOT, "reservar", "hotel-jurua-palace", "index.html")) ? "ok" : "alert"
    }
  ];

  return {
    updatedAt: new Date().toISOString(),
    source: "scripts/agente-vivo-supervisor.js",
    disclaimer: "Cada linha vem de checagem de arquivos e rotas publicadas. Nada aqui é previsão.",
    machines,
    details: {
      pages,
      subpages,
      missingImages: missingImages.slice(0, 20),
      missingLinks: missingLinks.slice(0, 20)
    }
  };
}

const report = build();
fs.writeFileSync(OUTPUT, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(`[agente-vivo] registro atualizado: ${report.machines.length} máquinas, ${report.details.pages} páginas`);
if (report.details.missingImages.length) console.log("[agente-vivo] imagens sem arquivo:", report.details.missingImages);
if (report.details.missingLinks.length) console.log("[agente-vivo] links sem destino:", report.details.missingLinks);