"use strict";

const fs = require("node:fs");
const path = require("node:path");

const PT_STOPWORDS = new Set([
  "de", "da", "do", "das", "dos", "em", "no", "na", "nos", "nas", "um", "uma",
  "uns", "umas", "por", "para", "com", "sem", "sob", "sobre", "entre", "ate",
  "apos", "ante", "contra", "desde", "perante", "que", "se", "ao", "aos", "as",
  "os", "e", "ou", "mas", "como", "mais", "menos", "muito", "muita", "foi",
  "ser", "sao", "esta", "estao", "tem", "ter", "vai", "vao", "pode", "podem",
  "nesta", "neste", "nessa", "nesse", "isso", "isto", "aquele", "aquela",
  "cruzeiro", "sul", "acre", "jurua", "vale", "estado", "governo", "prefeitura",
  "ano", "anos", "dia", "dias", "hoje", "ontem", "amanha", "feira", "Durante"
]);

const LOW_QUALITY_RE =
  /lei\s+org[aâ]nica|selo\s+qualidade|e-saj|confer[eê]ncia\s+de\s+documentos|documentos\s+e-saj|\[vc_row\]|\[\/vc_|<script|lorem\s+ipsum|^sem\s+t[ií]tulo$/i;

function stripAccents(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function cleanText(value = "") {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeXml(value = "") {
  return String(value || "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

function normalizeTopicTokens(text = "") {
  const raw = stripAccents(cleanText(text).toLowerCase());
  const words = raw.match(/[a-z0-9]{3,}/g) || [];
  return words.filter((w) => !PT_STOPWORDS.has(w) && !/^\d{4}$/.test(w));
}

function extractNumbersAndValues(text = "") {
  const cleaned = cleanText(text);
  const currency = cleaned.match(/R\$\s*[\d.,]+(?:\s*(?:mil|milh[õo]es|bilh[õo]es))?/gi) || [];
  const percentages = cleaned.match(/\b\d+(?:[.,]\d+)?%/g) || [];
  const quantities =
    cleaned.match(
      /\b\d+(?:[.,]\d+)?\s*(?:kg|quilos|toneladas|fam[ií]lias|casas|vagas|alunos|escolas|pessoas|mortos|feridos|presos|suspeitos|dias|meses|anos|km|metros|mil|milh[õo]es)\b/gi
    ) || [];
  return {
    currency: [...new Set(currency.map((x) => x.trim()))],
    percentages: [...new Set(percentages.map((x) => x.trim()))],
    quantities: [...new Set(quantities.map((x) => x.trim()))]
  };
}

function storyTimestamp(story = {}) {
  const raw = story.publishedAt || story.published || story.createdAt || story.created || story.updatedAt || story.date || "";
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function areStoriesSameEvent(a = {}, b = {}) {
  if (!a || !b) return false;
  if (a.slug && b.slug && a.slug === b.slug) return true;
  const urlA = String(a.sourceUrl || a.url || "").trim();
  const urlB = String(b.sourceUrl || b.url || "").trim();
  if (urlA && urlB && urlA === urlB) return true;

  const tA = storyTimestamp(a);
  const tB = storyTimestamp(b);
  if (tA && tB && Math.abs(tA - tB) > 72 * 3600 * 1000) {
    return false;
  }

  const tokensA = normalizeTopicTokens(a.title || "");
  const tokensB = normalizeTopicTokens(b.title || "");
  if (tokensA.length < 3 || tokensB.length < 3) return false;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let shared = 0;
  for (const tk of setA) {
    if (setB.has(tk)) shared++;
  }
  const union = new Set([...setA, ...setB]).size;
  const jaccard = union > 0 ? shared / union : 0;

  if (jaccard >= 0.34) return true;
  if (shared >= 3 && Math.min(setA.size, setB.size) <= 6) return true;

  // Confronto complementar com lead/resumo quando 2 tokens fortes do título batem
  if (shared >= 2) {
    const bodyTokensA = new Set(normalizeTopicTokens(`${a.title} ${a.summary || a.lede || ""}`));
    const bodyTokensB = new Set(normalizeTopicTokens(`${b.title} ${b.summary || b.lede || ""}`));
    let bodyShared = 0;
    for (const tk of bodyTokensA) {
      if (bodyTokensB.has(tk)) bodyShared++;
    }
    const bodyUnion = new Set([...bodyTokensA, ...bodyTokensB]).size;
    if (bodyShared >= 5 && bodyUnion > 0 && bodyShared / bodyUnion >= 0.28) {
      return true;
    }
  }
  return false;
}

function passesEditorialQualityGate(item = {}) {
  if (!item || typeof item !== "object") return false;
  if (item.isOriginal || item.newsroomId) return true;
  const title = cleanText(item.title || "");
  if (title.length < 18) return false;
  const combined = `${title} ${cleanText(item.summary || item.lede || item.subtitle || "")}`;
  if (LOW_QUALITY_RE.test(combined)) return false;
  if (/^(?:inexigibilidade|aviso\s+de\s+reabertura|dispensa\s+de\s+licita)/i.test(title) && cleanText(item.summary || "").length < 45) {
    return false;
  }
  return true;
}

function isCapturedRealPhoto(url = "") {
  const raw = String(url || "").trim();
  if (!raw) return false;
  if (raw.startsWith("/api/editores/midia/")) return true;
  if (raw.includes("/illustration.svg")) return false;
  if (
    /(?:^|\/)assets\/(?:home-cache|news-fallbacks)\/|banner-governo|infancia-protegida|1140x300|blur_2|placeholder|default[-_]|sem-imagem|avatar|favicon|logo/i.test(
      raw
    )
  ) {
    return false;
  }
  return /^(?:https?:\/\/|\/?assets\/news-manual\/)/i.test(raw);
}

function formatPtDate(isoOrText = "") {
  if (!isoOrText) return "18 de nov. de 2026";
  const ts = Date.parse(isoOrText);
  if (!Number.isFinite(ts)) return String(isoOrText);
  try {
    return new Date(ts).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch (_e) {
    return String(isoOrText);
  }
}

function loadPublishedEditorArticles(dataDir) {
  const file = path.join(dataDir, "newsroom-private.json");
  if (!fs.existsSync(file)) return [];
  try {
    const state = JSON.parse(fs.readFileSync(file, "utf8"));
    const list = Array.isArray(state?.articles) ? state.articles : [];
    return list
      .filter((a) => a && a.status === "Publicada" && a.title)
      .sort((a, b) => (Number(b.level || 0) - Number(a.level || 0)) || String(b.published || "").localeCompare(String(a.published || "")))
      .map((a) => {
        const slug = `redacao-${a.id}`;
        const paragraphs = String(a.content || "")
          .split(/\r?\n\r?\n+/)
          .map((p) => cleanText(p))
          .filter(Boolean);
        const summary = paragraphs[0] ? paragraphs[0].slice(0, 240) : cleanText(a.content || "").slice(0, 240);
        const hasImage = Boolean(a.media && String(a.mediaType || a.media?.type || "").startsWith("image/"));
        const imageUrl = hasImage
          ? `/api/editores/midia/${encodeURIComponent(a.id)}`
          : `/api/articles/${encodeURIComponent(slug)}/illustration.svg`;
        const level = Number(a.level || 0);
        return {
          id: slug,
          newsroomId: String(a.id),
          slug,
          isOriginal: true,
          newsroomLevel: level,
          editorialBadge: level === 2 ? "Manchete Original • Redação CZS" : level === 1 ? "Destaque Original • Redação CZS" : "Reportagem Original • Redação CZS",
          title: cleanText(a.title),
          subtitle: summary,
          lede: summary,
          summary,
          body: paragraphs.length ? paragraphs : [cleanText(a.content || "")],
          rawContent: String(a.content || ""),
          category: a.category || (level === 2 ? "Manchete CZS" : "Redação CZS"),
          categoryKey: "redacao-czs",
          sourceName: "Redação Catálogo CZS",
          sourceLabel: `Por ${a.author || "Redação CZS"} • Apuração própria`,
          sourceUrl: `/noticia.html?slug=${encodeURIComponent(slug)}`,
          publishedAt: a.published || a.created || new Date().toISOString(),
          date: formatPtDate(a.published || a.created),
          readMin: Math.max(2, Math.round(cleanText(a.content || "").split(/\s+/).length / 180)),
          imageUrl,
          feedImageUrl: imageUrl,
          sourceImageUrl: imageUrl,
          hasCapturedPhoto: hasImage,
          mediaKind: hasImage ? "foto-captada" : "ilustracao-editorial",
          priority: 5000 + level * 500,
          comparedOutlets: [],
          crossSources: [
            {
              name: "Redação Catálogo CZS (Original)",
              url: `/noticia.html?slug=${encodeURIComponent(slug)}`
            }
          ]
        };
      });
  } catch (_err) {
    return [];
  }
}

function mergeEditorAndDeduplicateReplicas(editorArticles = [], externalItems = []) {
  const accepted = [];
  const seenSlugs = new Set();

  // 1. Soberania das matérias originais do editor
  for (const ed of editorArticles) {
    if (!ed || !ed.slug || seenSlugs.has(ed.slug)) continue;
    seenSlugs.add(ed.slug);
    accepted.push({
      ...ed,
      comparedOutlets: Array.isArray(ed.comparedOutlets) ? [...ed.comparedOutlets] : [],
      crossSources: Array.isArray(ed.crossSources) ? [...ed.crossSources] : []
    });
  }

  // 2. Processa matérias externas: filtra qualidade e absorve réplicas nas originais/primárias
  for (const rawItem of externalItems) {
    if (!passesEditorialQualityGate(rawItem)) continue;
    const slug = String(rawItem.slug || rawItem.id || "").trim();
    if (!slug || seenSlugs.has(slug)) continue;

    const match = accepted.find((existing) => areStoriesSameEvent(existing, rawItem));
    if (match) {
      // Se já existe matéria original (ou matéria primária consolidada) sobre o fato:
      // Apaga a réplica do feed e absorve a fonte para checagem de fatos e incoerências!
      const outletName = cleanText(rawItem.sourceName || rawItem.sourceLabel || "Veículo externo");
      const outletUrl = String(rawItem.sourceUrl || rawItem.url || "").trim();
      match.comparedOutlets = match.comparedOutlets || [];
      match.comparedOutlets.push({
        sourceName: outletName,
        sourceUrl: outletUrl,
        title: cleanText(rawItem.title || ""),
        summary: cleanText(rawItem.summary || rawItem.lede || rawItem.subtitle || ""),
        date: rawItem.date || formatPtDate(rawItem.publishedAt),
        bodyText: Array.isArray(rawItem.body) ? rawItem.body.join(" ") : cleanText(rawItem.summary || "")
      });
      match.crossSources = match.crossSources || [];
      if (!match.crossSources.some((s) => s.name === outletName || (outletUrl && s.url === outletUrl))) {
        match.crossSources.push({ name: outletName, url: outletUrl });
      }
      // Se a matéria primária não tinha foto captada e a réplica tem foto real captada, aproveita a foto real com crédito
      if (!match.hasCapturedPhoto) {
        const replicaPhoto = rawItem.imageUrl || rawItem.feedImageUrl || rawItem.sourceImageUrl || "";
        if (isCapturedRealPhoto(replicaPhoto)) {
          match.imageUrl = replicaPhoto;
          match.feedImageUrl = replicaPhoto;
          match.hasCapturedPhoto = true;
          match.mediaKind = "foto-captada";
          match.imageCredit = `Foto captada / ${outletName}`;
        }
      }
      match.sourceCount = (match.crossSources || []).length;
      continue;
    }

    // Não é réplica: consolida como matéria autoral checada pelo CZS
    seenSlugs.add(slug);
    const currentPhoto = rawItem.imageUrl || rawItem.feedImageUrl || rawItem.sourceImageUrl || "";
    const hasPhoto = isCapturedRealPhoto(currentPhoto);
    const illustrationUrl = `/api/articles/${encodeURIComponent(slug)}/illustration.svg`;
    const finalImage = hasPhoto ? currentPhoto : illustrationUrl;

    accepted.push({
      ...rawItem,
      slug,
      hasCapturedPhoto: hasPhoto,
      mediaKind: hasPhoto ? "foto-captada" : "ilustracao-editorial",
      imageUrl: finalImage,
      feedImageUrl: finalImage,
      comparedOutlets: [],
      crossSources: Array.isArray(rawItem.crossSources) && rawItem.crossSources.length
        ? [...rawItem.crossSources]
        : [
            {
              name: cleanText(rawItem.sourceName || "Fonte consultada"),
              url: String(rawItem.sourceUrl || "")
            }
          ]
    });
  }

  return accepted;
}

function detectCrossOutletInconsistencies(primaryStory = {}, relatedStories = []) {
  const outlets = [
    {
      sourceName: cleanText(primaryStory.sourceName || "Catálogo CZS"),
      title: cleanText(primaryStory.title || ""),
      text: cleanText(
        `${primaryStory.title || ""} ${primaryStory.summary || ""} ${
          Array.isArray(primaryStory.body) ? primaryStory.body.join(" ") : primaryStory.rawContent || ""
        }`
      )
    },
    ...(Array.isArray(relatedStories) ? relatedStories : []).map((r) => ({
      sourceName: cleanText(r.sourceName || "Outro veículo"),
      title: cleanText(r.title || ""),
      text: cleanText(`${r.title || ""} ${r.summary || ""} ${r.bodyText || ""}`)
    }))
  ].filter((o) => o.text.length > 15);

  const inconsistencies = [];

  if (outlets.length >= 2) {
    const byOutlet = outlets.map((o) => ({
      ...o,
      extracted: extractNumbersAndValues(o.text)
    }));

    // 1. Confronta valores em Reais (R$)
    const withCurrency = byOutlet.filter((o) => o.extracted.currency.length > 0);
    if (withCurrency.length >= 2) {
      const firstVal = withCurrency[0].extracted.currency.join(", ");
      for (let i = 1; i < withCurrency.length; i++) {
        const otherVal = withCurrency[i].extracted.currency.join(", ");
        if (firstVal !== otherVal) {
          inconsistencies.push({
            topic: "Divergência de valores financeiros (R$)",
            comparison: `${withCurrency[0].sourceName} cita "${firstVal}", enquanto ${withCurrency[i].sourceName} registra "${otherVal}".`,
            editorialFinding:
              "O Catálogo CZS recomenda conferir o valor consolidado no documento oficial/empenho antes de tomar o número isolado como definitivo."
          });
        }
      }
    }

    // 2. Confronta quantidades e números (vagas, famílias, kg, casos, etc.)
    const withQuantities = byOutlet.filter((o) => o.extracted.quantities.length > 0);
    if (withQuantities.length >= 2) {
      const q0 = withQuantities[0].extracted.quantities.join(", ");
      for (let i = 1; i < withQuantities.length; i++) {
        const qi = withQuantities[i].extracted.quantities.join(", ");
        if (q0.toLowerCase() !== qi.toLowerCase()) {
          inconsistencies.push({
            topic: "Diferença em números e quantitativos reportados",
            comparison: `${withQuantities[0].sourceName} aponta "${q0}", ao passo que ${withQuantities[i].sourceName} menciona "${qi}".`,
            editorialFinding:
              "As redações divulgaram recortes numéricos distintos do mesmo levantamento; o texto autoral abaixo prioriza o dado confirmado."
          });
        }
      }
    }

    // 3. Confronta omissão de dados quantitativos ou enquadramento no título
    if (inconsistencies.length === 0) {
      const a = byOutlet[0];
      const b = byOutlet[1];
      if (a.title && b.title && a.title.toLowerCase() !== b.title.toLowerCase()) {
        const aNums = [...a.extracted.currency, ...a.extracted.quantities];
        const bNums = [...b.extracted.currency, ...b.extracted.quantities];
        if (aNums.length > 0 && bNums.length === 0) {
          inconsistencies.push({
            topic: "Omissão de dados objetivos na cobertura secundária",
            comparison: `${a.sourceName} especifica os números da ocorrência (${aNums.join(", ")}), dado omitido na chamada de ${b.sourceName} ("${b.title}").`,
            editorialFinding: "A réplica secundária foi suprimida do feed principal por trazer menos precisão factual que a apuração principal."
          });
        } else if (bNums.length > 0 && aNums.length === 0) {
          inconsistencies.push({
            topic: "Complemento quantitativo entre veículos",
            comparison: `${b.sourceName} acrescenta dados numéricos (${bNums.join(", ")}) que não constavam no relato inicial de ${a.sourceName}.`,
            editorialFinding: "Os dados objetivos das duas publicações foram cruzados e incorporados nesta versão consolidada."
          });
        } else {
          inconsistencies.push({
            topic: "Diferença de enquadramento editorial entre veículos",
            comparison: `${a.sourceName} destacou "${a.title}", enquanto ${b.sourceName} abordou o fato sob o título "${b.title}".`,
            editorialFinding: "Não houve contradição material nos fatos centrais; a réplica foi unificada para evitar duplicidade no portal."
          });
        }
      }
    }
  }

  return inconsistencies;
}

function synthesizeAuthorialNytParagraphs(story = {}, relatedStories = [], inconsistencies = []) {
  if (story.isOriginal && Array.isArray(story.body) && story.body.length > 0) {
    return story.body;
  }

  const title = cleanText(story.title || "Fato em apuração no Vale do Juruá");
  const rawSummary = cleanText(story.summary || story.lede || story.subtitle || "");
  const rawBody = Array.isArray(story.body)
    ? story.body.map((p) => cleanText(p)).filter(Boolean)
    : [];
  const sourceName = cleanText(story.sourceName || "apuração local");
  const category = cleanText(story.category || "Cotidiano");
  const allSources = [
    sourceName,
    ...(Array.isArray(relatedStories) ? relatedStories.map((r) => cleanText(r.sourceName || "")) : []),
    ...(Array.isArray(story.crossSources) ? story.crossSources.map((s) => cleanText(s.name || "")) : [])
  ].filter(Boolean);
  const uniqueSources = [...new Set(allSources)];

  const allText = cleanText(`${title}. ${rawSummary} ${rawBody.join(" ")}`);
  const nums = extractNumbersAndValues(allText);
  const keyFigures = [...nums.currency, ...nums.quantities, ...nums.percentages];

  const paragraphs = [];

  // Parágrafo 1 (Lede autoral contextualizado - sem copiar cacoetes de release)
  if (rawSummary && rawSummary.toLowerCase() !== title.toLowerCase()) {
    const cleanLede = rawSummary
      .replace(/^a informa[cç][aã]o vem[^.]*\.\s*/i, "")
      .replace(/^fonte:\s*[^.]*\.\s*/i, "")
      .trim();
    paragraphs.push(
      `CRUZEIRO DO SUL — ${cleanLede}${cleanLede.endsWith(".") ? "" : "."}`
    );
  } else {
    paragraphs.push(
      `CRUZEIRO DO SUL — A reportagem do Catálogo CZS verificou os desdobramentos sobre "${title}", tema que mobiliza a agenda de ${category.toLowerCase()} na região do Vale do Juruá e no Acre.`
    );
  }

  // Parágrafo 2 (Desenvolvimento a partir dos fatos extras e corpo)
  const extraSentences = [];
  for (const p of rawBody) {
    if (!p || p.length < 35) continue;
    if (/^fonte:|^a informa[cç][aã]o vem|^o czs acompanha/i.test(p)) continue;
    if (rawSummary && p.slice(0, 50).toLowerCase() === rawSummary.slice(0, 50).toLowerCase()) continue;
    extraSentences.push(p);
  }
  for (const rel of relatedStories) {
    const relSum = cleanText(rel.summary || "");
    if (relSum.length > 40 && !paragraphs[0].includes(relSum.slice(0, 35))) {
      extraSentences.push(`No cruzamento com os dados publicados por ${rel.sourceName || "veículo regional"}, consta ainda que ${relSum.charAt(0).toLowerCase() + relSum.slice(1)}`);
    }
  }

  if (extraSentences.length > 0) {
    paragraphs.push(...extraSentences.slice(0, 3));
  } else if (keyFigures.length > 0) {
    paragraphs.push(
      `Os dados objetivos levantados na checagem destacam os seguintes indicadores centrais da ocorrência: ${keyFigures.join("; ")}. Esses números servem de base para o acompanhamento público pelos moradores e órgãos de controle de Cruzeiro do Sul.`
    );
  }

  // Parágrafo 3 (Metodologia de checagem e transparência de fontes padrão NYT)
  if (uniqueSources.length > 1) {
    paragraphs.push(
      `Para consolidar esta matéria e eliminar réplicas repetidas no feed, o sistema editorial do Catálogo CZS confrontou os relatos de ${uniqueSources.join(", ")}.${
        inconsistencies.length > 0
          ? ` Durante a verificação cruzada, foram identificadas ${inconsistencies.length} divergência(s) ou diferença(s) de recorte entre as publicações externas, detalhadas no quadro de checagem abaixo.`
          : " Os fatos principais mostraram convergência entre as fontes consultadas."
      }`
    );
  } else {
    paragraphs.push(
      `A apuração tem como base primária os registros divulgados por ${sourceName}, submetidos ao filtro editorial do Catálogo CZS para verificação de consistência, clareza e impacto direto na comunidade local.`
    );
  }

  return paragraphs;
}

function buildNutGraph(story = {}, relatedStories = [], inconsistencies = []) {
  const category = cleanText(story.category || "Notícias").toLowerCase();
  const nums = extractNumbersAndValues(`${story.title || ""} ${story.summary || ""}`);
  const figures = [...nums.currency, ...nums.quantities];
  const outletCount = Math.max(
    1,
    new Set([
      story.sourceName,
      ...(Array.isArray(relatedStories) ? relatedStories.map((r) => r.sourceName) : []),
      ...(Array.isArray(story.crossSources) ? story.crossSources.map((s) => s.name) : [])
    ].filter(Boolean)).size
  );

  let impact = "O tema afeta diretamente o cotidiano e o acompanhamento público dos moradores de Cruzeiro do Sul e do Vale do Juruá.";
  if (/educa|escola|aluno|faculdade|ufac|ifac/i.test(category + " " + story.title)) {
    impact = "O caso impacta diretamente a comunidade escolar, estudantes e famílias da rede de ensino em Cruzeiro do Sul.";
  } else if (/pol[ií]cia|seguran|delegacia|pris|apreen|crime|justi/i.test(category + " " + story.title)) {
    impact = "A ocorrência reflete na segurança pública local e no acompanhamento das ações policiais e judiciais na comarca de Cruzeiro do Sul.";
  } else if (/sa[uú]de|hospital|surto|catapora|vacina|maternidade/i.test(category + " " + story.title)) {
    impact = "O alerta exige atenção imediata das famílias e acompanhamento da rede pública de saúde e vigilância epidemiológica no Juruá.";
  } else if (/economia|emprego|vaga|feir[aã]o|neg[oó]cio|produtor|rural/i.test(category + " " + story.title)) {
    impact = "A medida mexe com a geração de renda, oportunidades de trabalho e o abastecimento econômico nos municípios do Vale do Juruá.";
  } else if (/deslizamento|rio|cheia|clima|chuva|defesa civil|bairro/i.test(category + " " + story.title)) {
    impact = "A situação demanda monitoramento de risco ambiental, infraestrutura urbana e assistência às famílias nas áreas afetadas.";
  }

  return `${impact}${figures.length ? ` Dados-chave verificados: ${figures.slice(0, 3).join(", ")}.` : ""} (${outletCount} ${outletCount > 1 ? "fontes cruzadas" : "fonte verificada"}${inconsistencies.length ? ` • ${inconsistencies.length} ponto(s) de divergência explicitado(s)` : ""}).`;
}

function buildAuthorialNytDossier(story = {}, allStories = [], options = {}) {
  const dataDir = options.dataDir;
  const cacheFile = dataDir ? path.join(dataDir, "editorial-dossiers.json") : "";
  let cache = {};
  if (cacheFile && fs.existsSync(cacheFile)) {
    try {
      cache = JSON.parse(fs.readFileSync(cacheFile, "utf8")) || {};
    } catch (_e) {
      cache = {};
    }
  }

  const slug = String(story.slug || story.id || "materia").trim();
  if (!options.forceRefresh && cache[slug] && cache[slug].authorialBody?.length) {
    return cache[slug];
  }

  // Encontra réplicas ou matérias correlatas no acervo para comparação multi-fonte
  const related = [
    ...(Array.isArray(story.comparedOutlets) ? story.comparedOutlets : [])
  ];
  for (const candidate of Array.isArray(allStories) ? allStories : []) {
    if (!candidate || candidate.slug === slug) continue;
    if (areStoriesSameEvent(story, candidate)) {
      const srcName = cleanText(candidate.sourceName || "Outro veículo");
      if (!related.some((r) => r.sourceName === srcName && r.title === cleanText(candidate.title))) {
        related.push({
          sourceName: srcName,
          sourceUrl: candidate.sourceUrl || "",
          title: cleanText(candidate.title || ""),
          summary: cleanText(candidate.summary || candidate.lede || ""),
          date: candidate.date || formatPtDate(candidate.publishedAt),
          bodyText: Array.isArray(candidate.body) ? candidate.body.join(" ") : ""
        });
      }
    }
  }

  const inconsistencies = detectCrossOutletInconsistencies(story, related);
  const authorialBody = synthesizeAuthorialNytParagraphs(story, related, inconsistencies);
  const nutGraph = buildNutGraph(story, related, inconsistencies);

  const nums = extractNumbersAndValues(`${story.title || ""} ${story.summary || ""} ${authorialBody.join(" ")}`);
  const verifiedFacts = [
    `Fato central apurado: ${cleanText(story.title)}.`,
    ...(nums.currency.length ? [`Valores financeiros registrados na documentação/apuração: ${nums.currency.join(", ")}.`] : []),
    ...(nums.quantities.length ? [`Quantitativos e indicadores verificados: ${nums.quantities.join(", ")}.`] : []),
    `Localidade e escopo de impacto: ${cleanText(story.category || "Cruzeiro do Sul / Vale do Juruá")} (${story.date || "Novembro de 2026"}).`
  ];

  const sourcesChecked = [
    {
      name: cleanText(story.sourceName || "Redação Catálogo CZS"),
      url: String(story.sourceUrl || `/noticia.html?slug=${encodeURIComponent(slug)}`),
      role: story.isOriginal ? "Reportagem Original (Soberana)" : "Fonte Primária Consultada"
    },
    ...related.map((r) => ({
      name: r.sourceName,
      url: r.sourceUrl || "",
      role: "Fonte Cruzada (Réplica absorvida e comparada)"
    }))
  ];

  const dossier = {
    slug,
    isOriginal: Boolean(story.isOriginal),
    editorialStandard: "The New York Times + Semafor Fact-Check",
    headline: cleanText(story.title),
    nutGraph,
    authorialBody,
    mediaKind: story.hasCapturedPhoto ? "foto-captada" : "ilustracao-editorial",
    imageUrl: story.imageUrl || `/api/articles/${encodeURIComponent(slug)}/illustration.svg`,
    factCheck: {
      status: inconsistencies.length > 0 ? "divergencia-entre-jornais" : story.isOriginal ? "original-verificado" : "fato-checado",
      label:
        inconsistencies.length > 0
          ? `Fato Checado • ${inconsistencies.length} Divergência(s) entre Jornais`
          : story.isOriginal
          ? "Reportagem Original Verificada • Redação CZS"
          : "Fato Checado • Síntese Autoral CZS",
      verifiedFacts,
      methodology:
        "O Catálogo CZS não copia matérias de terceiros: o sistema lê as fontes disponíveis, extrai os fatos objetivos, suprime réplicas repetidas e explicita divergências entre veículos.",
      sourcesCount: sourcesChecked.length,
      sourcesChecked
    },
    inconsistencies,
    updatedAt: new Date().toISOString()
  };

  if (cacheFile) {
    try {
      cache[slug] = dossier;
      fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
      fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2), "utf8");
    } catch (_e) {
      // ignore disk errors
    }
  }

  return dossier;
}

async function enrichDossierWithAi(story = {}, currentDossier = {}, aiCallFn, dataDir) {
  if (typeof aiCallFn !== "function") return currentDossier;
  const sourcesSummary = (currentDossier.factCheck?.sourcesChecked || [])
    .map((s) => `- ${s.name} (${s.role})`)
    .join("\n");
  const currentText = (currentDossier.authorialBody || []).join("\n\n");
  const prompt = [
    "Você é editor-chefe de checagem e jornalismo autoral do Catálogo CZS (inspirado no The New York Times e Semafor).",
    "Analise os dados abaixo sobre o fato em Cruzeiro do Sul / Acre. NÃO copie frases prontas de outros sites: escreva uma matéria autoral impecável, clara e analítica.",
    "Retorne APENAS um JSON válido com as chaves:",
    '{ "nutGraph": "1 parágrafo explicando por que o fato importa", "authorialBody": ["parágrafo 1", "parágrafo 2", "parágrafo 3"], "verifiedFacts": ["fato 1", "fato 2", "fato 3"], "inconsistencies": [{"topic": "Ponto analisado entre jornais", "comparison": "O que cada fonte informou ou omitiu", "editorialFinding": "Conclusão da checagem CZS"}] }',
    "",
    `Título: ${story.title}`,
    `Categoria: ${story.category || "Notícias"} | Data: ${story.date || ""}`,
    `Fontes consultadas:\n${sourcesSummary}`,
    `Incoerências já detectadas:\n${JSON.stringify(currentDossier.inconsistencies || [])}`,
    `Rascunho base:\n${currentText}`
  ].join("\n");

  try {
    const res = await aiCallFn({
      prompt,
      system: "Responda exclusivamente com JSON válido em português do Brasil, sem blocos markdown ```json."
    });
    if (!res?.ok || !res.answer) return currentDossier;
    const rawJson = String(res.answer)
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    const parsed = JSON.parse(rawJson);
    const updated = {
      ...currentDossier,
      nutGraph: cleanText(parsed.nutGraph || currentDossier.nutGraph),
      authorialBody:
        Array.isArray(parsed.authorialBody) && parsed.authorialBody.length
          ? parsed.authorialBody.map((p) => cleanText(p)).filter(Boolean)
          : currentDossier.authorialBody,
      factCheck: {
        ...currentDossier.factCheck,
        verifiedFacts:
          Array.isArray(parsed.verifiedFacts) && parsed.verifiedFacts.length
            ? parsed.verifiedFacts.map((f) => cleanText(f)).filter(Boolean)
            : currentDossier.factCheck.verifiedFacts
      },
      inconsistencies:
        Array.isArray(parsed.inconsistencies) && parsed.inconsistencies.length
          ? parsed.inconsistencies.map((inc) => ({
              topic: cleanText(inc.topic || "Comparação entre veículos"),
              comparison: cleanText(inc.comparison || ""),
              editorialFinding: cleanText(inc.editorialFinding || "")
            }))
          : currentDossier.inconsistencies,
      aiVerified: true,
      aiModel: res.ai?.model || "cloud-free",
      updatedAt: new Date().toISOString()
    };

    if (dataDir) {
      const cacheFile = path.join(dataDir, "editorial-dossiers.json");
      let cache = {};
      if (fs.existsSync(cacheFile)) {
        try {
          cache = JSON.parse(fs.readFileSync(cacheFile, "utf8")) || {};
        } catch (_e) {}
      }
      cache[currentDossier.slug] = updated;
      fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2), "utf8");
    }
    return updated;
  } catch (_err) {
    return currentDossier;
  }
}

function wrapSvgLines(text = "", maxChars = 42, maxLines = 3) {
  const words = cleanText(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current.length > maxChars ? `${current.slice(0, maxChars - 1)}…` : current);
  }
  return lines;
}

function buildEditorialIllustrationSvg(story = {}) {
  const category = cleanText(story.category || "Reportagem CZS").toUpperCase();
  const title = cleanText(story.title || "Catálogo Cruzeiro do Sul");
  const source = cleanText(story.sourceName || "Redação Catálogo CZS").toUpperCase();
  const date = cleanText(story.date || "18 NOV 2026").toUpperCase();
  const combined = `${category} ${title}`.toLowerCase();

  let motif = "city";
  let accent = "#8b1e1e";
  if (/pol[ií]cia|justi|delegacia|crime|seguran|pris|apreen/i.test(combined)) {
    motif = "justice";
    accent = "#7c1d1d";
  } else if (/rio|jurua|clima|chuva|deslizamento|ambiente|floresta|natureza/i.test(combined)) {
    motif = "river";
    accent = "#1b4332";
  } else if (/sa[uú]de|hospital|vacina|surto|catapora|maternidade/i.test(combined)) {
    motif = "health";
    accent = "#7f1d1d";
  } else if (/educa|escola|aluno|faculdade|aula|universidade/i.test(combined)) {
    motif = "education";
    accent = "#1e3a5f";
  } else if (/economia|emprego|vaga|feir[aã]o|neg[oó]cio|rural|produ/i.test(combined)) {
    motif = "economy";
    accent = "#5c3d1e";
  }

  const motifSvg = {
    justice: `
      <g stroke="#121923" stroke-width="2.5" fill="none">
        <line x1="880" y1="150" x2="880" y2="450"/>
        <line x1="760" y1="220" x2="1000" y2="220"/>
        <path d="M760 220 L720 320 L800 320 Z" fill="rgba(139,30,30,0.12)"/>
        <path d="M1000 220 L960 320 L1040 320 Z" fill="rgba(18,25,35,0.08)"/>
        <rect x="810" y="450" width="140" height="18" fill="#121923"/>
        <circle cx="880" cy="150" r="14" fill="${accent}"/>
      </g>`,
    river: `
      <g stroke="#121923" stroke-width="2.2" fill="none">
        <circle cx="930" cy="210" r="56" fill="rgba(27,67,50,0.14)" stroke="${accent}"/>
        <path d="M700 350 Q790 315 880 350 T1060 350" stroke-width="3"/>
        <path d="M700 390 Q790 355 880 390 T1060 390" stroke="${accent}" stroke-width="2.5"/>
        <path d="M700 430 Q790 395 880 430 T1060 430" stroke-width="1.8"/>
      </g>`,
    health: `
      <g stroke="#121923" stroke-width="2.4" fill="none">
        <circle cx="880" cy="295" r="115" fill="rgba(127,29,29,0.07)"/>
        <path d="M860 215 H900 V275 H960 V315 H900 V375 H860 V315 H800 V275 H860 Z" fill="${accent}" stroke="none"/>
      </g>`,
    education: `
      <g stroke="#121923" stroke-width="2.4" fill="none">
        <path d="M740 340 Q810 310 880 340 Q950 310 1020 340 V200 Q950 170 880 200 Q810 170 740 200 Z" fill="rgba(30,58,95,0.09)"/>
        <line x1="880" y1="200" x2="880" y2="340"/>
        <line x1="775" y1="240" x2="850" y2="240" stroke="${accent}"/>
        <line x1="775" y1="275" x2="850" y2="275"/>
        <line x1="910" y1="240" x2="985" y2="240" stroke="${accent}"/>
        <line x1="910" y1="275" x2="985" y2="275"/>
      </g>`,
    economy: `
      <g stroke="#121923" stroke-width="2.4" fill="none">
        <rect x="750" y="330" width="44" height="100" fill="rgba(18,25,35,0.1)"/>
        <rect x="825" y="280" width="44" height="150" fill="rgba(18,25,35,0.16)"/>
        <rect x="900" y="220" width="44" height="210" fill="rgba(92,61,30,0.22)"/>
        <rect x="975" y="165" width="44" height="265" fill="${accent}" stroke="none"/>
        <line x1="725" y1="430" x2="1045" y2="430" stroke-width="3"/>
      </g>`,
    city: `
      <g stroke="#121923" stroke-width="2.2" fill="none">
        <rect x="745" y="250" width="75" height="180" fill="rgba(18,25,35,0.07)"/>
        <rect x="835" y="185" width="95" height="245" fill="rgba(139,30,30,0.1)"/>
        <rect x="945" y="280" width="75" height="150" fill="rgba(18,25,35,0.07)"/>
        <line x1="715" y1="430" x2="1055" y2="430" stroke-width="3"/>
        <circle cx="882" cy="145" r="16" fill="${accent}" stroke="none"/>
      </g>`
  }[motif];

  const lines = wrapSvgLines(title, 34, 3);
  const titleTspans = lines
    .map((line, idx) => `<tspan x="88" dy="${idx === 0 ? 0 : 54}">${escapeXml(line)}</tspan>`)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-label="${escapeXml(title)}">
  <rect width="1200" height="675" fill="#f6f1e7"/>
  <rect x="36" y="36" width="1128" height="603" fill="#faf7f0" stroke="#121923" stroke-width="2"/>
  <line x1="36" y1="112" x2="1164" y2="112" stroke="#d8d0c0" stroke-width="1.5"/>
  <line x1="680" y1="112" x2="680" y2="565" stroke="#d8d0c0" stroke-width="1.5"/>
  <line x1="36" y1="565" x2="1164" y2="565" stroke="#121923" stroke-width="1.5"/>
  <rect x="88" y="62" width="14" height="14" fill="${accent}"/>
  <text x="114" y="75" fill="#121923" font-family="Georgia, 'Times New Roman', serif" font-size="16" font-weight="700" letter-spacing="2.5">ILUSTRAÇÃO EDITORIAL • CATÁLOGO CZS</text>
  <text x="1112" y="75" text-anchor="end" fill="#5c6470" font-family="Georgia, 'Times New Roman', serif" font-size="15" letter-spacing="1.5">${escapeXml(category)}</text>
  <text x="88" y="185" fill="${accent}" font-family="Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="2">${escapeXml(category)}</text>
  <text x="88" y="252" fill="#121923" font-family="Georgia, 'Times New Roman', serif" font-size="42" font-weight="700">${titleTspans}</text>
  <line x1="88" y1="468" x2="240" y2="468" stroke="${accent}" stroke-width="3"/>
  <text x="88" y="505" fill="#374151" font-family="Georgia, 'Times New Roman', serif" font-size="18" font-style="italic">Síntese autoral e verificação de fatos • Vale do Juruá, Acre</text>
  ${motifSvg}
  <text x="88" y="608" fill="#121923" font-family="Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="1.2">${escapeXml(source)}</text>
  <text x="1112" y="608" text-anchor="end" fill="#5c6470" font-family="Georgia, 'Times New Roman', serif" font-size="15">${escapeXml(date)}</text>
</svg>`;
}

module.exports = {
  cleanText,
  normalizeTopicTokens,
  areStoriesSameEvent,
  passesEditorialQualityGate,
  isCapturedRealPhoto,
  loadPublishedEditorArticles,
  mergeEditorAndDeduplicateReplicas,
  detectCrossOutletInconsistencies,
  buildAuthorialNytDossier,
  enrichDossierWithAi,
  buildEditorialIllustrationSvg
};
