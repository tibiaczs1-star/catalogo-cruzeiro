"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const RUNTIME_NEWS_FILE = path.join(DATA_DIR, "runtime-news.json");
const NEWS_ARCHIVE_FILE = path.join(DATA_DIR, "news-archive.json");
const STATIC_NEWS_FILE = path.join(ROOT_DIR, "news-data.js");
const INDEX_FILE = path.join(ROOT_DIR, "index.html");

const slug = "pf-apura-encomendas-iphones-remedios-proibidos-acre-grupo-yma";
const sourceUrl = "documento-pf-ipl-2026-0054609-dpf-czs-ac";

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function writeStaticNews(items) {
  fs.writeFileSync(
    STATIC_NEWS_FILE,
    `window.NEWS_ARCHIVE_TOTAL = ${items.length};\nwindow.NEWS_DATA = ${JSON.stringify(items, null, 2)};\n`,
    "utf8"
  );
}

function syncIndex(items) {
  const index = fs.readFileSync(INDEX_FILE, "utf8");
  const payload = {
    ok: true,
    total: items.length,
    archiveTotal: items.length,
    returned: items.length,
    items
  };
  const replacement = `<script id="newsData" type="application/json">${JSON.stringify(payload)}</script>`;
  const updated = index.replace(
    /<script id="newsData" type="application\/json">[\s\S]*?<\/script>/,
    replacement
  );
  if (updated === index) {
    throw new Error("Bloco newsData nao encontrado no index.html.");
  }
  fs.writeFileSync(INDEX_FILE, updated, "utf8");
}

function upsertFirst(items, item, limit) {
  const filtered = (Array.isArray(items) ? items : []).filter(
    (candidate) => candidate && candidate.slug !== item.slug && candidate.id !== item.id
  );
  return [item, ...filtered].slice(0, limit);
}

const title = "PF apura encomendas com iPhones e remédios proibidos ligados ao Acre";
const summary =
  "Documento da Polícia Federal cita 10 volumes apreendidos no Aeroporto Internacional de Rio Branco, pacotes ligados ao Grupo Yma e indícios de descaminho, contrabando e risco sanitário.";
const body = [
  "Documento da Polícia Federal obtido pelo Catálogo CZS aponta que uma apreensão realizada em 9 de janeiro de 2026, no Aeroporto Internacional de Rio Branco, resultou na análise de 10 volumes despachados pela LATAM, entre caixas de grande porte e malas de viagem.",
  "Segundo a portaria e o relatório de análise, os volumes continham produtos eletrônicos, principalmente aparelhos celulares, e medicamentos sem autorização regular. A PF afirma haver indícios de dois eixos de investigação: descaminho, ligado a eletrônicos possivelmente introduzidos no país sem o pagamento correto de tributos, e contrabando, relacionado a medicamentos proibidos ou sem autorização sanitária.",
  "O documento cita embalagens da transportadora Grupo Yma e menciona que, em vários casos, os pacotes teriam sido preparados a partir de endereço no bairro Brás, em São Paulo. A PF também registra que algumas encomendas não traziam identificação clara do remetente nem documentação fiscal idônea, o que, segundo o relatório, dificultaria a identificação preliminar do vendedor.",
  "Entre os itens analisados aparecem iPhones lacrados, acessórios eletrônicos e medicamentos associados a substâncias usadas para emagrecimento, como produtos similares ao Mounjaro, tirzepatida e retatrutida. Em relação aos medicamentos, o relatório aponta ausência de autorização, falhas de armazenamento, falta de refrigeração em alguns casos e possível risco direto à saúde pública.",
  "Na conclusão, a Polícia Federal afirma ter identificado elementos que indicam possível prática reiterada de ilícitos penais, incluindo descaminho, contrabando e comercialização ou distribuição de medicamentos proibidos. O documento recomenda o prosseguimento das investigações, envio dos itens à perícia e comunicação a órgãos competentes.",
  "O caso ainda está em fase investigativa. A menção a pessoas, empresas ou transportadoras no documento não representa condenação. Dados pessoais presentes no PDF foram omitidos nesta publicação por segurança e responsabilidade editorial.",
  "Fonte: documento da Polícia Federal - IPL 2026.0054609-DPF/CZS/AC."
];

const item = {
  id: `manual-czs-${slug}`,
  slug,
  title,
  eyebrow: "Urgente",
  date: "09 de jul de 2026",
  publishedAt: "2026-07-09T13:20:00.000-05:00",
  category: "Acre",
  categoryKey: "acre",
  previewClass: "thumb-acrelandia",
  sourceName: "Documento da Polícia Federal",
  sourceUrl,
  sourceLabel: "Documento da Polícia Federal - IPL 2026.0054609-DPF/CZS/AC",
  lede: summary,
  summary,
  analysis:
    "Pauta sensível de segurança pública e saúde. A publicação preserva dados pessoais e usa linguagem investigativa: indício, apuração e documento apontam, sem tratar citados como condenados.",
  highlights: [
    "PF analisou 10 volumes apreendidos no Aeroporto Internacional de Rio Branco.",
    "Documento cita eletrônicos, iPhones e medicamentos sem autorização regular.",
    "Relatório menciona embalagens do Grupo Yma e pacotes vindos do Brás, em São Paulo.",
    "Caso segue em fase investigativa; citação em documento não representa condenação."
  ],
  development: body,
  imageUrl: "assets/news-manual/pf-yma-contrabando-acre-20260709.png",
  feedImageUrl: "assets/news-manual/pf-yma-contrabando-acre-20260709.png",
  sourceImageUrl: "assets/news-manual/pf-yma-contrabando-acre-20260709.png",
  imageCredit: "Montagem Catálogo CZS com imagens de documento da Polícia Federal; dados pessoais redigidos",
  imageFocus: "center",
  imageFit: "cover",
  media: null,
  videoUrl: "assets/news-manual/pf-yma-contrabando-acre-reel-20260709.mp4",
  priority: 2000,
  editorialPriority: "urgente-seguranca-saude-acre",
  crossSources: [{ name: "Polícia Federal", url: sourceUrl }],
  alternateSources: [],
  sourceCount: 1,
  alternateSlugs: [],
  audioNarrationText: `${title}. ${summary} ${body.join(" ")}`,
  audioNarrationTranscript: `${title}. ${summary} ${body.join(" ")}`,
  audioNarrationVoice: "raiane-francisca-whatsapp-normal",
  audioNarrationVoiceName: "RAIane Francisca WhatsApp normal",
  audioNarrationVoiceEngine: "edge-tts",
  audioNarrationVoiceModel: "pt-BR-FranciscaNeural",
  audioNarrationVoiceSampleUrl: "/assets/voice/rayl/rayl-ref2-francisca-whatsapp-normal.mp3",
  audioNarrationLanguage: "pt-BR",
  audioNarrationStatus: "script-pronto",
  videoCaptionText:
    "Documento da PF aponta encomendas com iPhones, eletrônicos e medicamentos proibidos/sem autorização ligados ao Acre. Caso segue em investigação.",
  videoCaptionStatus: "pronto",
  accessibility: {
    alt: "Montagem do Catálogo CZS sobre documento da Polícia Federal citando pacotes do Grupo Yma, eletrônicos e medicamentos apreendidos",
    caption: "PF apura encomendas com iPhones e remédios proibidos ligados ao Acre."
  },
  imageQuality: {
    status: "arte-propria-documento-redigido",
    note: "Arte 1080x1350 com logo Catálogo CZS, dados pessoais redigidos e imagens do documento da PF."
  },
  body
};

const runtime = readJson(RUNTIME_NEWS_FILE, {});
const archive = readJson(NEWS_ARCHIVE_FILE, []);
const archiveLimit = Math.max(1400, Array.isArray(archive) ? archive.length : 1400);
const activeLimit = Math.max(360, Array.isArray(runtime.activeWindowItems) ? runtime.activeWindowItems.length : 360);
const updatedArchive = upsertFirst(archive, item, archiveLimit);
const updatedItems = upsertFirst(runtime.items, item, archiveLimit);
const updatedActive = upsertFirst(runtime.activeWindowItems || runtime.items, item, activeLimit);

const updatedRuntime = {
  ...runtime,
  lastAttemptAt: new Date().toISOString(),
  lastSuccessAt: new Date().toISOString(),
  source: "manual-pf-yma-contrabando-acre",
  activeWindowItems: updatedActive,
  items: updatedItems
};

writeJson(RUNTIME_NEWS_FILE, updatedRuntime);
writeJson(NEWS_ARCHIVE_FILE, updatedArchive);
writeStaticNews(updatedArchive);
syncIndex(updatedArchive);

console.log(JSON.stringify({ ok: true, slug, title, archive: updatedArchive.length, active: updatedActive.length }, null, 2));
