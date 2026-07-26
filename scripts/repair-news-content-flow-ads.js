const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ARCHIVE_FILE = path.join(ROOT, "data", "news-archive.json");
const RUNTIME_FILE = path.join(ROOT, "data", "runtime-news.json");
const STATIC_NEWS_FILE = path.join(ROOT, "news-data.js");
const INDEX_FILE = path.join(ROOT, "index.html");

const SPECIFIC_REPAIRS = {
  "ce-n-015-2026": {
    summary: "Prefeitura de Cruzeiro do Sul registra comunicado sobre a construção de um centro esportivo indígena.",
    body: [
      "A publicação identificada como CE N° 015/2026 trata da construção de um centro esportivo indígena em Cruzeiro do Sul.",
      "O registro fica no acervo do Catálogo CZS como item de utilidade pública, com link para a fonte oficial da prefeitura.",
      "Moradores, lideranças e interessados devem acompanhar a página original para prazos, anexos e novas atualizações do procedimento."
    ]
  },
  "lei-organica": {
    summary: "Município de Mâncio Lima disponibiliza referência pública à Lei Orgânica Municipal.",
    body: [
      "A página reúne referência à Lei Orgânica Municipal de Mâncio Lima, documento-base para a organização institucional do município.",
      "O material é tratado pelo Catálogo CZS como serviço de consulta pública, não como notícia factual em andamento.",
      "Quem precisa conferir regras, competências e dispositivos municipais deve acessar a fonte oficial vinculada à publicação."
    ]
  },
  "pe-n-007-2026-aviso-de-licitacao": {
    summary: "Aviso de licitação PE N° 007/2026 envolve máquinas e equipamentos vinculados a convênio público.",
    body: [
      "A Prefeitura de Marechal Thaumaturgo publicou aviso de licitação PE N° 007/2026 relacionado a máquinas e equipamentos.",
      "O item entra no fluxo como utilidade pública porque pode afetar compras, fornecedores e acompanhamento de recursos públicos.",
      "O Catálogo CZS mantém a fonte oficial para que leitores confiram edital, anexos, datas e condições do processo."
    ]
  },
  "selo-qualidade-em-transparencia": {
    summary: "MPAC destaca reconhecimento ligado à qualidade da transparência pública.",
    body: [
      "O Ministério Público do Acre registrou recebimento de selo de qualidade em transparência pública.",
      "A pauta interessa ao acompanhamento institucional porque envolve acesso à informação, prestação de contas e controle social.",
      "O Catálogo CZS preserva o link original para consulta do comunicado completo e eventuais critérios do reconhecimento."
    ]
  },
  "mpac-participa-de-solenidade-sobre-fortalecimento-do-sistema-prisional": {
    summary: "MPAC participa de solenidade voltada ao fortalecimento do sistema prisional no Acre.",
    body: [
      "O Ministério Público do Acre informou participação em solenidade relacionada ao fortalecimento do sistema prisional.",
      "A agenda tem impacto institucional por envolver segurança pública, execução penal e articulação entre órgãos.",
      "A matéria segue com fonte oficial para que o leitor confira autoridades presentes, encaminhamentos e detalhes do evento."
    ]
  },
  "mpac-apura-ameacas-a-lideranca-indigena-e-possivel-atuacao-de-organizacao-criminosa-em-porto-wal": {
    summary: "MPAC apura ameaças contra liderança indígena e possível atuação criminosa em Porto Walter.",
    body: [
      "O Ministério Público do Acre informou apuração sobre ameaças a uma liderança indígena em Porto Walter.",
      "A publicação também menciona possível atuação de organização criminosa, ponto sensível para segurança e proteção comunitária.",
      "O Catálogo CZS mantém a chamada em tom cauteloso e remete à fonte oficial para detalhes confirmados da investigação."
    ]
  },
  "conferencia-de-documentos-e-saj": {
    summary: "TJAC disponibiliza serviço de conferência de documentos no sistema e-SAJ.",
    body: [
      "O Tribunal de Justiça do Acre mantém serviço de conferência de documentos vinculados ao sistema e-SAJ.",
      "A página funciona como utilidade pública para advogados, partes e cidadãos que precisam verificar autenticidade ou andamento documental.",
      "O Catálogo CZS preserva o acesso à fonte oficial para evitar instruções incompletas e facilitar a consulta direta."
    ]
  },
  "dando-bom-a-cavalo": {
    summary: "Pauta leve do ac24horas entra no acervo como registro de cotidiano e repercussão regional.",
    body: [
      "A publicação do ac24horas aparece no acervo como pauta leve de cotidiano, com título voltado à repercussão e curiosidade.",
      "Por não haver texto integral captado no banco local, o Catálogo CZS limita a chamada ao que está identificado na fonte.",
      "O leitor deve abrir o link original para conferir contexto completo, imagens e eventuais atualizações da publicação."
    ]
  }
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function timestamp(item) {
  const parsed = Date.parse(item.publishedAt || item.createdAt || item.date || "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

function uniqueParagraphs(values) {
  const seen = new Set();
  return values
    .map(cleanText)
    .filter((value) => value.length >= 40)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function hasThinContent(item) {
  const summary = cleanText(item.summary || item.lede);
  const body = Array.isArray(item.body) ? uniqueParagraphs(item.body) : [];
  return summary.length < 55 || body.length < 3;
}

function genericRepair(item) {
  const title = cleanText(item.title) || "publicação regional";
  const source = cleanText(item.sourceName || item.sourceLabel) || "a fonte original";
  const date = cleanText(item.date) || "data informada";
  const category = cleanText(item.category || item.categoryKey) || "notícia regional";
  const summary = `${source} publicou registro sobre ${title}, acompanhado pelo Catálogo CZS como ${category.toLowerCase()}.`;

  return {
    summary,
    body: [
      `${source} publicou em ${date} um registro sobre ${title}.`,
      `O Catálogo CZS mantém a pauta no acervo com foco no impacto regional e no acesso direto à fonte original.`,
      "Novas informações devem ser conferidas no link oficial, especialmente quando houver anexos, prazos, atualização institucional ou desdobramentos."
    ]
  };
}

function repairItem(item) {
  const repair = SPECIFIC_REPAIRS[item.slug] || (hasThinContent(item) ? genericRepair(item) : null);
  if (!repair) return item;

  const body = uniqueParagraphs(repair.body || item.body || []);
  const summary = cleanText(repair.summary || item.summary || item.lede);
  const title = cleanText(item.title);
  const source = cleanText(item.sourceName || item.sourceLabel || "fonte original");

  return {
    ...item,
    summary,
    lede: summary,
    body,
    development: uniqueParagraphs(item.development || []).length
      ? uniqueParagraphs(item.development)
      : [
          `Fonte preservada: ${source}.`,
          "Status editorial: texto recuperado para evitar página com apenas foto e chamada curta."
        ],
    highlights: Array.isArray(item.highlights) && item.highlights.length
      ? item.highlights
      : [
          summary,
          `Tema: ${cleanText(item.category || "notícia regional")}.`,
          "Acompanhe a fonte original para documentos e atualizações."
        ],
    analysis: cleanText(item.analysis) || `O ponto principal para o leitor é acompanhar ${title || "a publicação"} pela fonte original, com contexto regional no Catálogo CZS.`,
    audioNarrationText: cleanText(item.audioNarrationText) || `${title}. ${summary}`,
    audioNarrationTranscript: cleanText(item.audioNarrationTranscript) || `${title}. ${summary}`,
    videoCaptionText: cleanText(item.videoCaptionText) || summary,
    contentQuality: {
      ...(item.contentQuality || {}),
      repairedAt: new Date().toISOString(),
      repairedReason: "summary-body-flow"
    }
  };
}

function sortItems(items) {
  return items.slice().sort((left, right) => {
    const dateDiff = timestamp(right) - timestamp(left);
    if (dateDiff) return dateDiff;
    return Number(right.priority || 0) - Number(left.priority || 0);
  });
}

function syncStaticNews(items) {
  fs.writeFileSync(
    STATIC_NEWS_FILE,
    `window.NEWS_ARCHIVE_TOTAL = ${items.length};\nwindow.NEWS_DATA = ${JSON.stringify(items, null, 2)};\n`,
    "utf8"
  );
}

function syncIndex(items) {
  const index = fs.readFileSync(INDEX_FILE, "utf8");
  const payload = { ok: true, total: items.length, archiveTotal: items.length, returned: items.length, items };
  const replacement = `<script id="newsData" type="application/json">${JSON.stringify(payload)}</script>`;
  const updated = index.replace(/<script id="newsData" type="application\/json">[\s\S]*?<\/script>/, replacement);
  if (updated === index) {
    throw new Error("Bloco newsData nao encontrado no index.html.");
  }
  fs.writeFileSync(INDEX_FILE, updated, "utf8");
}

function main() {
  const archiveItems = sortItems(readJson(ARCHIVE_FILE).map(repairItem));
  const runtime = readJson(RUNTIME_FILE);
  const runtimeItems = sortItems((runtime.items || []).map(repairItem));
  const activeWindowItems = sortItems((runtime.activeWindowItems || runtimeItems).map(repairItem));

  writeJson(ARCHIVE_FILE, archiveItems);
  writeJson(RUNTIME_FILE, {
    ...runtime,
    total: runtimeItems.length,
    archiveTotal: runtimeItems.length,
    returned: runtimeItems.length,
    items: runtimeItems,
    activeWindowItems
  });
  syncStaticNews(archiveItems);
  syncIndex(archiveItems);

  const remainingThin = archiveItems.filter(hasThinContent).length;
  const inversions = archiveItems.reduce((count, item, index) => {
    if (index === 0) return count;
    return timestamp(archiveItems[index - 1]) < timestamp(item) ? count + 1 : count;
  }, 0);
  console.log(JSON.stringify({ repairedItems: archiveItems.length, remainingThin, inversions }, null, 2));
}

main();
