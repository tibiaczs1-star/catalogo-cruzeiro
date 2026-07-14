"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const RUNTIME = path.join(ROOT, "data", "runtime-news.json");
const ARCHIVE = path.join(ROOT, "data", "news-archive.json");
const STATIC = path.join(ROOT, "news-data.js");
const INDEX = path.join(ROOT, "index.html");

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function upsertMany(current, incoming, limit) {
  const ids = new Set(incoming.flatMap((item) => [item.id, item.slug]));
  const filtered = (Array.isArray(current) ? current : []).filter(
    (item) => item && !ids.has(item.id) && !ids.has(item.slug)
  );
  return [...incoming, ...filtered].slice(0, limit);
}

function prependStatic(items) {
  let current = fs.readFileSync(STATIC, "utf8");
  const unseen = items.filter((item) => !current.includes(`\"slug\": \"${item.slug}\"`));
  if (unseen.length === 0) return;
  const total = current.match(/window\.NEWS_ARCHIVE_TOTAL = (\d+);/);
  if (!total || !/window\.NEWS_DATA = \[\r?\n/.test(current)) {
    throw new Error("Estrutura de news-data.js não reconhecida.");
  }
  const serialized = unseen
    .map((item) =>
      JSON.stringify(item, null, 2)
        .split("\n")
        .map((line) => `  ${line}`)
        .join("\n")
    )
    .join(",\n");
  current = current
    .replace(
      /window\.NEWS_ARCHIVE_TOTAL = \d+;/,
      `window.NEWS_ARCHIVE_TOTAL = ${Number(total[1]) + unseen.length};`
    )
    .replace(/window\.NEWS_DATA = \[\r?\n/, `window.NEWS_DATA = [\n${serialized},\n`);
  fs.writeFileSync(STATIC, current, "utf8");
}

function prependIndex(items) {
  const current = fs.readFileSync(INDEX, "utf8");
  const match = current.match(/<script id="newsData" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error("Bloco newsData não encontrado.");
  const payload = JSON.parse(match[1]);
  payload.items = upsertMany(payload.items, items, Number.MAX_SAFE_INTEGER);
  payload.total = payload.items.length;
  payload.archiveTotal = payload.items.length;
  payload.returned = payload.items.length;
  const replacement = `<script id="newsData" type="application/json">${JSON.stringify(payload)}</script>`;
  fs.writeFileSync(INDEX, current.replace(match[0], replacement), "utf8");
}

function buildItem(config) {
  return {
    id: `manual-czs-${config.slug}`,
    slug: config.slug,
    title: config.title,
    seoTitle: `${config.title} | Catálogo CZS`,
    seoDescription: config.summary,
    eyebrow: config.eyebrow,
    date: "14 de jul de 2026",
    publishedAt: config.publishedAt,
    category: config.category,
    categoryKey: config.categoryKey,
    previewClass: config.previewClass,
    sourceName: config.sourceName,
    sourceUrl: config.sourceUrl,
    sourceLabel: config.title,
    lede: config.summary,
    summary: config.summary,
    analysis: config.analysis,
    highlights: config.highlights,
    development: config.body,
    imageUrl: config.imageUrl,
    feedImageUrl: config.imageUrl,
    sourceImageUrl: config.imageUrl,
    imageCredit: config.imageCredit,
    imageFocus: "center",
    imageFit: "cover",
    media: null,
    videoUrl: "",
    priority: config.priority,
    editorialPriority: config.editorialPriority,
    crossSources: [{ name: config.sourceName, url: config.sourceUrl }],
    alternateSources: [],
    sourceCount: 1,
    alternateSlugs: [],
    audioNarrationText: `${config.title}. ${config.summary}`,
    audioNarrationTranscript: `${config.title}. ${config.summary}`,
    audioNarrationVoice: "raiane-francisca-whatsapp-normal",
    audioNarrationVoiceName: "RAIane Francisca WhatsApp normal",
    audioNarrationVoiceEngine: "edge-tts",
    audioNarrationVoiceModel: "pt-BR-FranciscaNeural",
    audioNarrationVoiceSampleUrl: "/assets/voice/rayl/rayl-ref2-francisca-whatsapp-normal.mp3",
    audioNarrationLanguage: "pt-BR",
    audioNarrationStatus: "ready-transcript",
    videoCaptionText: `${config.summary} Fonte: ${config.sourceName}.`,
    videoCaptionStatus: "ready",
    accessibility: {
      alt: config.alt,
      caption: config.title,
      hasAudioNarrationText: true,
      hasAudioNarrationTranscript: true,
      raylVoice: "raiane-francisca-whatsapp-normal",
      hasVideoCaptionText: true
    },
    body: config.body
  };
}

const items = [
  buildItem({
    slug: "mari-fernandes-deve-cantar-em-cruzeiro",
    title: "Mari Fernandes deve cantar em Cruzeiro",
    summary:
      "Segundo apuração do ContilNet, Mari Fernandes deve se apresentar no Festival da Farinha, em Cruzeiro do Sul, no dia 26 de agosto. Na mesma noite, o cantor Panda está previsto para a abertura da Expo Tarauacá. As programações completas ainda aguardam divulgação oficial, mas a coincidência promete movimentar o comércio e o turismo regional.",
    publishedAt: "2026-07-14T09:58:00.000-05:00",
    eyebrow: "Cruzeiro do Sul",
    category: "Cruzeiro do Sul",
    categoryKey: "cruzeiro-do-sul",
    previewClass: "thumb-cruzeiro-do-sul",
    sourceName: "ContilNet",
    sourceUrl:
      "https://contilnetnoticias.com.br/destaque-2/disputa-de-shows-no-acre-panda-em-tarauaca-e-mari-fernandes-em-cruzeiro/",
    imageUrl: "assets/news-manual/mari-fernandes-festival-farinha-20260714.webp",
    imageCredit: "Foto: Reprodução/Redes sociais via ContilNet",
    analysis: "A possível apresentação reforça o calendário cultural e econômico do Vale do Juruá.",
    highlights: [
      "Mari Fernandes deve cantar no Festival da Farinha.",
      "A apresentação está prevista para 26 de agosto.",
      "Panda deve abrir a Expo Tarauacá na mesma noite.",
      "As programações completas aguardam confirmação oficial."
    ],
    body: [
      "Segundo apuração do ContilNet, a cantora Mari Fernandes deve integrar a programação do Festival da Farinha, em Cruzeiro do Sul, no dia 26 de agosto.",
      "Na mesma data, o cantor Panda está previsto para a abertura da Expo Tarauacá, criando uma noite de grandes atrações em municípios do interior do Acre.",
      "As agendas completas dos eventos ainda aguardam divulgação oficial pelos organizadores.",
      "A coincidência de shows deve movimentar comércio, hospedagem, transporte e turismo regional.",
      "Fonte: ContilNet."
    ],
    alt: "Mari Fernandes e Panda em montagem sobre shows previstos no Acre",
    priority: 2002,
    editorialPriority: "jurua-destaque"
  }),
  buildItem({
    slug: "cnh-social-abre-matricula-no-acre",
    title: "CNH Social abre matrícula no Acre",
    summary:
      "O Detran do Acre divulgou a lista de selecionados para a CNH Social 2026 na modalidade Rural. Os aprovados têm 20 dias úteis para fazer a matrícula e apresentar documentos como CPF, identidade, comprovante de endereço e Passaporte CNH Social. Candidatos do interior devem procurar a Ciretran local; quem mora onde não há unidade pode enviar a documentação por e-mail.",
    publishedAt: "2026-07-14T09:58:00.000-05:00",
    eyebrow: "Acre",
    category: "Acre",
    categoryKey: "acre",
    previewClass: "thumb-acre",
    sourceName: "ContilNet / Detran-AC",
    sourceUrl:
      "https://contilnetnoticias.com.br/destaque-2/cnh-social-detran-divulga-lista-de-selecionados-e-abre-prazo-para-matricula/",
    imageUrl: "assets/news-manual/cnh-social-acre-20260714.webp",
    imageCredit: "Foto: Reprodução/Detran-AC via ContilNet",
    analysis: "O prazo exige atenção dos selecionados para evitar a perda do benefício.",
    highlights: [
      "Detran divulgou selecionados da modalidade Rural.",
      "A matrícula deve ser feita em até 20 dias úteis.",
      "Moradores do interior devem procurar a Ciretran.",
      "Onde não houver unidade, os documentos podem ser enviados por e-mail."
    ],
    body: [
      "O Detran do Acre divulgou a relação de candidatos selecionados para a CNH Social 2026 na modalidade Rural.",
      "Os aprovados têm 20 dias úteis para apresentar CPF, documento de identidade, comprovante de endereço e Passaporte CNH Social, além dos demais documentos exigidos no edital.",
      "Candidatos do interior devem procurar a Ciretran do município. Nos locais sem unidade, a documentação pode ser encaminhada pelo canal eletrônico informado pelo Detran.",
      "O não cumprimento do prazo pode comprometer a continuidade no programa.",
      "Fonte: ContilNet e Detran-AC."
    ],
    alt: "Carteira Nacional de Habilitação sobre documento do programa CNH Social",
    priority: 2001,
    editorialPriority: "acre-servico"
  })
];

const runtime = readJson(RUNTIME, {});
const archive = readJson(ARCHIVE, []);
const archiveLimit = Math.max(1400, Array.isArray(archive) ? archive.length : 1400);
const activeLimit = Math.max(360, Array.isArray(runtime.activeWindowItems) ? runtime.activeWindowItems.length : 360);
const updatedArchive = upsertMany(archive, items, archiveLimit);
const updatedItems = upsertMany(runtime.items, items, archiveLimit);
const updatedActive = upsertMany(runtime.activeWindowItems || runtime.items, items, activeLimit);

writeJson(ARCHIVE, updatedArchive);
writeJson(RUNTIME, {
  ...runtime,
  lastAttemptAt: new Date().toISOString(),
  lastSuccessAt: new Date().toISOString(),
  source: "manual-czs-fast-confirmed-batch-20260714",
  activeWindowItems: updatedActive,
  items: updatedItems
});
prependStatic(items);
prependIndex(items);

console.log(
  JSON.stringify(
    { ok: true, slugs: items.map((item) => item.slug), archive: updatedArchive.length, active: updatedActive.length },
    null,
    2
  )
);
