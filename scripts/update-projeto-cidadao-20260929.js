"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const slug = "projeto-cidadao-leva-mutirao-de-servicos-e-encerra-com-o-tradicional-casamento-coletivo-para-cru";
const officialUrl = "https://www.tjac.jus.br/2026/09/projeto-cidadao-leva-mutirao-de-servicos-e-casamento-coletivo-para-cruzeiro-do-sul/";
const localImage = "/assets/news-manual/tjac-projeto-cidadao-20260929.jpeg";
const officialImage = "https://www.tjac.jus.br/wp-content/uploads/2026/09/Projeto-Cidadao-Cruzeiro-do-Sul-3.jpeg";
const vozUrl = "https://www.vozdonorte.com.br/projeto-cidadao-leva-mutirao-de-servicos-e-casamento-coletivo-para-cruzeiro-do-sul/";
const title = "Projeto Cidadão começa hoje com serviços gratuitos em Cruzeiro do Sul";
const lede = "O mutirão do TJAC atende nesta terça e quarta-feira, das 8h às 15h, no Templo Sede da Assembleia de Deus, no bairro João Alves. Há serviços de saúde, documentação, assistência social e orientação jurídica.";
const body = [
  "O Projeto Cidadão começa nesta terça-feira (29) em Cruzeiro do Sul e segue na quarta-feira (30), com atendimentos gratuitos das 8h às 15h. A ação é organizada pelo Tribunal de Justiça do Acre (TJAC), em parceria com instituições públicas.",
  "Os serviços serão concentrados no Templo Sede da Igreja Assembleia de Deus, na Rua Newton Prado, 50, bairro João Alves. A programação inclui orientação jurídica, consultas médicas e odontológicas, vacinas, testes rápidos e vacinação antirrábica de cães e gatos.",
  "Também haverá emissão da Carteira de Identidade, certidão de nascimento e regularização de CPF, além de atendimento relacionado ao Cadastro Único, Bolsa Família, CRAS e Benefício de Prestação Continuada (BPC). A disponibilidade de cada serviço deve ser confirmada diretamente no local.",
  "A programação termina na quarta-feira (30), às 17h, com o Casamento Coletivo no Teatro dos Náuas, na Rua do Purus, 479, também no João Alves. O casamento é uma atividade distinta do mutirão de serviços.",
  `Fontes: ${"Tribunal de Justiça do Estado do Acre (TJAC)"} e Voz do Norte. Atualizado em 29 de setembro de 2026.`
];
const summary = `${lede} No dia 30, às 17h, haverá Casamento Coletivo no Teatro dos Náuas.`;
const sources = [
  { name: "Tribunal de Justiça do Estado do Acre (TJAC)", url: officialUrl },
  { name: "Voz do Norte", url: vozUrl }
];

function updateItem(item) {
  Object.assign(item, {
    title,
    seoTitle: `${title} | Catálogo CZS`,
    seoDescription: summary,
    eyebrow: "Serviço",
    date: "29 de set de 2026",
    publishedAt: "2026-09-29T00:00:00-05:00",
    category: "Serviço",
    categoryKey: "servico",
    sourceName: "TJAC / Voz do Norte",
    sourceUrl: officialUrl,
    sourceLabel: "Mutirão gratuito do Projeto Cidadão começa hoje em Cruzeiro do Sul",
    lede,
    summary,
    analysis: "Serviço público de utilidade local; agenda confirmada na publicação oficial do TJAC.",
    highlights: [
      "29 e 30 de setembro, das 8h às 15h",
      "Templo Sede da Assembleia de Deus, Rua Newton Prado, 50, João Alves",
      "Serviços jurídicos, de saúde, documentação e assistência social",
      "Casamento Coletivo: 30 de setembro, às 17h, no Teatro dos Náuas"
    ],
    development: body,
    body,
    imageUrl: localImage,
    feedImageUrl: localImage,
    sourceImageUrl: officialImage,
    originalImageUrl: officialImage,
    originalFeedImageUrl: officialImage,
    originalSourceImageUrl: officialImage,
    imageCredit: "Imagem: Comunicação/TJAC",
    imageAltText: "Card oficial do TJAC com locais, horários e serviços do Projeto Cidadão em Cruzeiro do Sul.",
    imageFocus: "center",
    imageFit: "cover",
    media: null,
    priority: 9400,
    editorialPriority: "cruzeiro-servico-hoje",
    crossSources: sources,
    alternateSources: sources,
    sourceCount: sources.length,
    audioNarrationText: `${title}. ${summary}`,
    audioNarrationTranscript: `${title}. ${summary}`,
    videoCaptionText: `${title}. ${summary} Fonte: TJAC.`,
    imageQuality: "official-source-image",
    accessibility: {
      alt: "Card oficial do TJAC com os serviços, datas, horário e endereço do Projeto Cidadão em Cruzeiro do Sul.",
      caption: title,
      hasAudioNarrationText: true,
      hasAudioNarrationTranscript: true,
      raylVoice: "rayl-francisca-whatsapp-normal",
      hasVideoCaptionText: true
    }
  });
}

function updateArray(items) {
  let count = 0;
  for (const item of items) {
    if (item && item.slug === slug) {
      updateItem(item);
      count++;
    }
  }
  return count;
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const runtimePath = path.join(root, "data/runtime-news.json");
const runtime = JSON.parse(fs.readFileSync(runtimePath, "utf8"));
const runtimeCount = updateArray([...(runtime.activeWindowItems || []), ...(runtime.items || [])]);
if (runtimeCount !== 2) throw new Error(`Esperava duas ocorrências no runtime; encontrei ${runtimeCount}.`);
writeJson(runtimePath, runtime);

const archivePath = path.join(root, "data/news-archive.json");
const archive = JSON.parse(fs.readFileSync(archivePath, "utf8"));
const archiveCount = updateArray(archive);
if (archiveCount !== 1) throw new Error(`Esperava uma ocorrência no arquivo; encontrei ${archiveCount}.`);
writeJson(archivePath, archive);

const staticPath = path.join(root, "news-data.js");
let staticText = fs.readFileSync(staticPath, "utf8");
const context = { window: {} };
vm.runInNewContext(staticText, context);
const staticItems = context.window.NEWS_DATA;
if (updateArray(staticItems) !== 1) throw new Error("Registro exato não encontrado em news-data.js.");
const marker = `"slug": "${slug}"`;
const markerAt = staticText.indexOf(marker);
let start = staticText.lastIndexOf("  {", markerAt);
if (markerAt < 0 || start < 0) throw new Error("Não localizei o objeto da matéria em news-data.js.");
let depth = 0;
let inString = false;
let escaped = false;
let end = -1;
for (let i = start; i < staticText.length; i++) {
  const ch = staticText[i];
  if (inString) {
    if (escaped) escaped = false;
    else if (ch === "\\") escaped = true;
    else if (ch === '"') inString = false;
    continue;
  }
  if (ch === '"') inString = true;
  else if (ch === "{") depth++;
  else if (ch === "}" && --depth === 0) { end = i + 1; break; }
}
if (end < 0) throw new Error("Objeto da matéria não terminou corretamente.");
const updatedItem = staticItems.find((item) => item.slug === slug);
const formatted = JSON.stringify(updatedItem, null, 2).split("\n").map((line) => `  ${line}`).join("\n");
staticText = `${staticText.slice(0, start)}${formatted}${staticText.slice(end)}`;
fs.writeFileSync(staticPath, staticText, "utf8");

console.log(JSON.stringify({ ok: true, slug, title, runtimeCount, archiveCount, image: localImage }, null, 2));
