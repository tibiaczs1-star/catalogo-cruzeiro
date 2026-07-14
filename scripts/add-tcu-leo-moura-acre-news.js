"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const RUNTIME_FILE = path.join(ROOT_DIR, "data", "runtime-news.json");
const ARCHIVE_FILE = path.join(ROOT_DIR, "data", "news-archive.json");
const STATIC_FILE = path.join(ROOT_DIR, "news-data.js");
const INDEX_FILE = path.join(ROOT_DIR, "index.html");

const slug = "tcu-apura-ong-presente-acre-leo-moura";
const title = "TCU apura ONG presente no Acre";
const summary =
  "O TCU apontou falhas e indícios de irregularidades em repasses federais destinados ao Instituto Léo Moura Sports. A entidade mantém projetos no Acre financiados por emendas do senador Alan Rick, incluindo núcleos em Rio Branco e Cruzeiro do Sul. Até o momento, não há informação de que os convênios acreanos estejam entre os contratos analisados, nem decisão definitiva sobre responsabilização dos envolvidos.";
const sourceUrl = "https://www.facebook.com/share/p/19TtV4LS7K/";
const tcuUrl =
  "https://pesquisa.apps.tcu.gov.br/resultado/acordao-completo/pesquisa%2520e%2520mercado%2520e%2520pre%25C3%25A7o/COPIATIPO%253A%2528%2522AC%25C3%2593RD%25C3%2583O%2522%2529";
const geUrl =
  "https://ge.globo.com/ac/noticia/2024/11/11/instituto-leo-moura-inaugura-escolinha-de-volei-em-rio-branco-com-emendas-de-senador-do-ac.ghtml";
const imageUrl = "assets/news-manual/tcu-instituto-leo-moura-acre-20260714.jpg";

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

function upsertFirst(items, item, limit) {
  const filtered = (Array.isArray(items) ? items : []).filter(
    (candidate) => candidate && candidate.slug !== item.slug && candidate.id !== item.id
  );
  return [item, ...filtered].slice(0, limit);
}

function prependStaticNews(item) {
  const current = fs.readFileSync(STATIC_FILE, "utf8");
  const slugNeedle = `\"slug\": \"${item.slug}\"`;
  if (current.includes(slugNeedle)) return;

  const totalMatch = current.match(/window\.NEWS_ARCHIVE_TOTAL = (\d+);/);
  if (!totalMatch || !/window\.NEWS_DATA = \[\r?\n/.test(current)) {
    throw new Error("Estrutura de news-data.js nao reconhecida.");
  }
  const serialized = JSON.stringify(item, null, 2)
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
  const updated = current
    .replace(
      /window\.NEWS_ARCHIVE_TOTAL = \d+;/,
      `window.NEWS_ARCHIVE_TOTAL = ${Number(totalMatch[1]) + 1};`
    )
    .replace(
      /window\.NEWS_DATA = \[\r?\n/,
      `window.NEWS_DATA = [\n${serialized},\n`
    );
  fs.writeFileSync(STATIC_FILE, updated, "utf8");
}

function prependIndexItem(item) {
  const current = fs.readFileSync(INDEX_FILE, "utf8");
  const match = current.match(
    /<script id="newsData" type="application\/json">([\s\S]*?)<\/script>/
  );
  if (!match) throw new Error("Bloco newsData nao encontrado.");
  const payload = JSON.parse(match[1]);
  const filtered = (Array.isArray(payload.items) ? payload.items : []).filter(
    (candidate) => candidate && candidate.slug !== item.slug && candidate.id !== item.id
  );
  payload.items = [item, ...filtered];
  payload.total = payload.items.length;
  payload.archiveTotal = payload.items.length;
  payload.returned = payload.items.length;
  const replacement = `<script id="newsData" type="application/json">${JSON.stringify(payload)}</script>`;
  const updated = current.replace(match[0], replacement);
  if (updated === current) {
    throw new Error("Bloco newsData nao foi atualizado.");
  }
  fs.writeFileSync(INDEX_FILE, updated, "utf8");
}

const body = [
  "O Tribunal de Contas da União analisou repasses federais destinados ao Instituto Léo Moura Sports e registrou falhas de governança, indícios de irregularidades na execução de termos de fomento e prestações de contas reprovadas ou ainda em análise.",
  "O Acórdão 1770/2026 cita achados como orçamentos falsos, sobrepreço, superfaturamento e ausência de documentação comprobatória em contratos específicos. O processo prevê determinações ao Ministério do Esporte e monitoramento das providências, com respeito ao contraditório e à ampla defesa.",
  "No Acre, o instituto mantém projetos esportivos financiados por emendas do senador Alan Rick. Há núcleos em Rio Branco, Cruzeiro do Sul e outros municípios, além de uma escolinha de vôlei inaugurada na capital.",
  "Até o momento, não há informação de que os convênios executados no Acre estejam entre os contratos específicos analisados pelo TCU. A existência dos projetos no estado não representa responsabilização do senador, dos gestores locais ou dos participantes das atividades.",
  "O espaço permanece aberto para manifestação do Instituto Léo Moura Sports e do senador Alan Rick. A matéria será atualizada caso haja posicionamento novo ou identificação oficial de convênio acreano no processo.",
  "Fontes: Agora Acre, Tribunal de Contas da União e ge Acre."
];

const item = {
  id: `manual-czs-${slug}`,
  slug,
  title,
  seoTitle: `${title} | Catálogo CZS`,
  seoDescription: summary,
  eyebrow: "Acre",
  date: "14 de jul de 2026",
  publishedAt: "2026-07-14T08:10:00.000-05:00",
  category: "Acre",
  categoryKey: "acre",
  previewClass: "thumb-acrelandia",
  sourceName: "Agora Acre / TCU",
  sourceUrl,
  sourceLabel: "TCU analisa repasses ao Instituto Léo Moura Sports",
  lede: summary,
  summary,
  analysis:
    "A ligação com o Acre é contextual. Não há confirmação de que os convênios acreanos façam parte dos contratos específicos apontados no processo.",
  highlights: [
    "TCU apontou falhas e indícios de irregularidades em repasses ao instituto.",
    "A entidade mantém projetos esportivos em Rio Branco e Cruzeiro do Sul.",
    "Não há confirmação de que convênios acreanos estejam entre os analisados.",
    "A citação no processo não representa condenação dos envolvidos."
  ],
  development: body,
  imageUrl,
  feedImageUrl: imageUrl,
  sourceImageUrl: imageUrl,
  imageCredit: "Foto: Gustavo Bardales/ge Acre",
  imageFocus: "center",
  imageFit: "cover",
  media: null,
  videoUrl: "",
  priority: 1900,
  editorialPriority: "acre-destaque",
  crossSources: [
    { name: "Agora Acre", url: sourceUrl },
    { name: "Tribunal de Contas da União", url: tcuUrl },
    { name: "ge Acre", url: geUrl }
  ],
  alternateSources: [
    { name: "Tribunal de Contas da União", url: tcuUrl },
    { name: "ge Acre", url: geUrl }
  ],
  sourceCount: 3,
  alternateSlugs: [],
  audioNarrationText: `${title}. ${summary}`,
  audioNarrationTranscript: `${title}. ${summary}`,
  audioNarrationVoice: "raiane-francisca-whatsapp-normal",
  audioNarrationVoiceName: "RAIane Francisca WhatsApp normal",
  audioNarrationVoiceEngine: "edge-tts",
  audioNarrationVoiceModel: "pt-BR-FranciscaNeural",
  audioNarrationVoiceSampleUrl: "/assets/voice/rayl/rayl-ref2-francisca-whatsapp-normal.mp3",
  audioNarrationLanguage: "pt-BR",
  audioNarrationStatus: "ready-transcript",
  videoCaptionText: `${summary} Fonte: Agora Acre / TCU / ge Acre.`,
  videoCaptionStatus: "ready",
  accessibility: {
    alt: "Crianças e responsáveis em projeto esportivo do Instituto Léo Moura no Acre",
    caption: title,
    hasAudioNarrationText: true,
    hasAudioNarrationTranscript: true,
    raylVoice: "raiane-francisca-whatsapp-normal",
    hasVideoCaptionText: true
  },
  body
};

const runtime = readJson(RUNTIME_FILE, {});
const archive = readJson(ARCHIVE_FILE, []);
const archiveLimit = Math.max(1400, Array.isArray(archive) ? archive.length : 1400);
const activeLimit = Math.max(
  360,
  Array.isArray(runtime.activeWindowItems) ? runtime.activeWindowItems.length : 360
);
const updatedArchive = upsertFirst(archive, item, archiveLimit);
const updatedItems = upsertFirst(runtime.items, item, archiveLimit);
const updatedActive = upsertFirst(runtime.activeWindowItems || runtime.items, item, activeLimit);
const updatedRuntime = {
  ...runtime,
  lastAttemptAt: new Date().toISOString(),
  lastSuccessAt: new Date().toISOString(),
  source: "manual-tcu-leo-moura-acre",
  activeWindowItems: updatedActive,
  items: updatedItems
};

writeJson(RUNTIME_FILE, updatedRuntime);
writeJson(ARCHIVE_FILE, updatedArchive);
prependStaticNews(item);
prependIndexItem(item);

console.log(
  JSON.stringify(
    { ok: true, slug, title, archive: updatedArchive.length, active: updatedActive.length },
    null,
    2
  )
);
