(function (root, factory) {
  const api = factory();
  root.CZSFlowEngine = api;
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const REGION_ORDER = [
    "cruzeiro-do-sul",
    "vale-jurua",
    "rio-branco",
    "vale-purus",
    "brasil",
    "geral",
  ];

  const REGIONS = {
    "cruzeiro-do-sul": {
      id: "cruzeiro-do-sul",
      label: "Cruzeiro do Sul",
      short: "Cruzeiro",
      police: "Polícia de Cruzeiro",
      weight: 980,
      pattern: /\b(cruzeiro do sul|czs|campus floresta|aeroporto de cruzeiro|bairro do remanso|bairro da varzea|bairro da v[aá]rzea|copacabana|miritizal|tel[eé]grafo)\b/i,
    },
    "vale-jurua": {
      id: "vale-jurua",
      label: "Vale do Juruá",
      short: "Juruá",
      police: "Polícia do Juruá",
      weight: 900,
      pattern: /\b(vale do jurua|vale do juru[aá]|juru[aá]|mancio lima|m[âa]ncio lima|rodrigues alves|porto walter|marechal thaumaturgo|guajar[aá]|tarauac[aá]|feij[oó]|jurua)\b/i,
    },
    "rio-branco": {
      id: "rio-branco",
      label: "Rio Branco",
      short: "Rio Branco",
      police: "Polícia de Rio Branco",
      weight: 640,
      pattern: /\b(rio branco|capital acreana|baixada da sobral|cidade do povo|segundo distrito|aleac|pal[aá]cio rio branco)\b/i,
    },
    "vale-purus": {
      id: "vale-purus",
      label: "Vale do Purus",
      short: "Purus",
      police: "Polícia do Purus",
      weight: 560,
      pattern: /\b(vale do purus|purus|sena madureira|manoel urbano|santa rosa do purus|assis brasil|xapuri|brasil[eé]ia|epitaciol[aâ]ndia)\b/i,
    },
    brasil: {
      id: "brasil",
      label: "Brasil",
      short: "Brasil",
      police: "Polícia do Brasil",
      weight: 260,
      pattern: /\b(brasil|nacional|bras[ií]lia|stf|congresso|senado|c[aâ]mara dos deputados|governo federal|pol[ií]cia federal|pf\b|receita federal|inss|caixa econ[oô]mica)\b/i,
    },
    geral: {
      id: "geral",
      label: "Geral orgânico",
      short: "Geral",
      police: "Polícia",
      weight: 120,
      pattern: /./i,
    },
  };

  const TOPIC_PATTERNS = {
    police: /\b(pol[ií]cia|pm\b|pc\b|pf\b|civil|militar|delegacia|pris[aã]o|preso|apreend|opera[cç][aã]o|mandado|foragido|assalto|roubo|furto|homic[ií]dio|tr[aá]fico|arma|crime|criminal|fac[cç][aã]o|bope|denarc)\b/i,
    politics: /\b(pol[ií]tica|prefeito|prefeitura|vereador|c[aâ]mara|governo|governador|aleac|senador|deputad|elei[cç][aã]o|partido|mdb|pl\b|pt\b|uni[aã]o brasil)\b/i,
    service: /\b(servi[cç]o|prazo|cadastro|inscri[cç][aã]o|benef[ií]cio|inss|bolsa fam[ií]lia|energia|[aá]gua|tr[aâ]nsito|defesa civil|telefone|atendimento|documento|edital|licita[cç][aã]o|concurso|vaga|emprego)\b/i,
    health: /\b(sa[uú]de|hospital|upa|vacina|dengue|m[eé]dico|hemocentro|samu|uti|farm[aá]cia|doen[cç]a)\b/i,
    education: /\b(educa[cç][aã]o|escola|ufac|ifac|aluno|estudante|fies|enem|curso|professor|universidade)\b/i,
    economy: /\b(economia|dinheiro|imposto|receita|pre[cç]o|com[eé]rcio|empreendedor|sebrae|empresa|mercado|renda)\b/i,
    culture: /\b(cultura|show|festival|expoacre|festa|m[uú]sica|esporte|futebol|jogo|evento|cinema|celebridade)\b/i,
    viral: /\b(v[ií]deo|viral|meme|pol[eê]mica|curiosidade|internet|redes sociais|fofoca|celebridade|influencer|repercute|assusta|emociona)\b/i,
    climate: /\b(rio|chuva|clima|tempo|seca|cheia|enchente|alagamento|igarap[eé]|ponte|ramal|br-364|estrada)\b/i,
  };

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function signalText(story) {
    return [
      story?.title,
      story?.subtitle,
      story?.summary,
      story?.category,
      story?.categoryKey,
      story?.sourceName,
      story?.sourceLabel,
      story?.city,
      story?.region,
    ].filter(Boolean).join(" ");
  }

  function regionFor(story) {
    const text = signalText(story);
    for (const id of REGION_ORDER) {
      const region = REGIONS[id];
      if (region.pattern.test(text)) return region;
    }
    return REGIONS.geral;
  }

  function topicFor(story) {
    const text = signalText(story);
    if (TOPIC_PATTERNS.police.test(text)) return "police";
    if (TOPIC_PATTERNS.service.test(text)) return "service";
    if (TOPIC_PATTERNS.health.test(text)) return "health";
    if (TOPIC_PATTERNS.education.test(text)) return "education";
    if (TOPIC_PATTERNS.politics.test(text)) return "politics";
    if (TOPIC_PATTERNS.climate.test(text)) return "climate";
    if (TOPIC_PATTERNS.economy.test(text)) return "economy";
    if (TOPIC_PATTERNS.viral.test(text)) return "viral";
    if (TOPIC_PATTERNS.culture.test(text)) return "culture";
    return "general";
  }

  function subsectionLabel(topic, region) {
    if (topic === "police") return region.police;
    if (topic === "politics") return region.id === "brasil" ? "Política nacional" : `Política de ${region.short}`;
    if (topic === "service") return region.id === "brasil" ? "Serviços do Brasil" : `Serviços de ${region.short}`;
    if (topic === "health") return `Saúde de ${region.short}`;
    if (topic === "education") return `Educação de ${region.short}`;
    if (topic === "economy") return region.id === "brasil" ? "Economia do Brasil" : `Economia de ${region.short}`;
    if (topic === "climate") return region.id === "brasil" ? "Clima e estradas" : `Rio, clima e estrada`;
    if (topic === "viral") return "Vídeos, memes e polêmicas";
    if (topic === "culture") return `Cultura de ${region.short}`;
    return region.id === "geral" ? "Geral orgânico" : `Geral de ${region.short}`;
  }

  function classifyStory(story = {}) {
    const region = regionFor(story);
    const topic = topicFor(story);
    const subsection = subsectionLabel(topic, region);
    const text = signalText(story);
    const organic = region.id === "geral" || topic === "viral" || /meme|pol[eê]mica|curiosidade|celebridade|viral|v[ií]deo/i.test(text);
    return {
      regionId: region.id,
      region: region.label,
      regionShort: region.short,
      topic,
      subsection,
      organic,
      weight: region.weight + (topic === "police" ? 80 : 0) + (topic === "service" ? 70 : 0),
    };
  }

  function storyStamp(story) {
    const parsed = Date.parse(story?.publishedAt || story?.capturedAt || story?.date || "");
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function scoreStory(story) {
    const flow = classifyStory(story);
    const priority = Number(story?.priority || 0);
    const freshness = storyStamp(story) ? Math.min(220, Math.floor((Date.now() - storyStamp(story)) / -3600000) || 0) : 0;
    return priority + flow.weight + freshness;
  }

  function hasMedia(story) {
    return Boolean(story?.imageUrl || story?.feedImageUrl || story?.sourceImageUrl || story?.videoUrl || story?.video);
  }

  function isViralCandidate(story = {}) {
    return Boolean(story?.flow?.topic === "viral" || story?.videoUrl || story?.video || topicFor(story) === "viral");
  }

  function buildCzsFlowEntries(stories = [], options = {}) {
    const limit = Math.max(12, Number(options.limit || 96));
    const blockSize = Math.max(1, Number(options.blockSize || 4));
    const rowColumns = Math.max(1, Number(options.rowColumns || 4));
    const sponsorEvery = Math.max(4, Number(options.sponsorEvery || 8));
    const viralEvery = Math.max(2, Number(options.viralEvery || 6));
    const seed = Math.max(0, Number(options.seed || 3));
    const seen = new Set();
    const buckets = new Map(REGION_ORDER.map((id) => [id, []]));
    const organicPool = [];
    const viralPool = [];

    stories.filter(Boolean).forEach((story) => {
      const key = story.slug || story.url || story.title;
      if (!key || seen.has(key) || !hasMedia(story)) return;
      seen.add(key);
      const flow = classifyStory(story);
      const enriched = { ...story, flow };
      if (!buckets.has(flow.regionId)) buckets.set(flow.regionId, []);
      buckets.get(flow.regionId).push(enriched);
      if (flow.organic || flow.regionId === "brasil" || flow.regionId === "geral") organicPool.push(enriched);
      if (isViralCandidate(enriched)) viralPool.push(enriched);
    });

    buckets.forEach((items) => items.sort((a, b) => scoreStory(b) - scoreStory(a) || storyStamp(b) - storyStamp(a)));
    organicPool.sort((a, b) => scoreStory(b) - scoreStory(a) || storyStamp(b) - storyStamp(a));
    viralPool.sort((a, b) => scoreStory(b) - scoreStory(a) || storyStamp(b) - storyStamp(a));

    const entries = [];
    const usedStories = new Set();
    let organicIndex = 0;
    let viralIndex = seed % Math.max(1, viralPool.length || 1);
    let storyCount = 0;
    let adIndex = 0;

    function pushStory(story, type = "story") {
      const key = story.slug || story.url || story.title;
      if (!key || usedStories.has(key) || entries.length >= limit) return false;
      usedStories.add(key);
      entries.push({ type, story, flow: story.flow || classifyStory(story) });
      storyCount += 1;
      if (storyCount % sponsorEvery === 0 && entries.length < limit) {
        entries.push({ type: "sponsor", adIndex: adIndex++, position: storyCount });
      }
      return true;
    }

    function pushViral() {
      if (!viralPool.length) return false;
      let attempts = 0;
      while (attempts < viralPool.length) {
        const story = viralPool[viralIndex % viralPool.length];
        viralIndex += 1;
        attempts += 1;
        if (pushStory(story, "viral")) return true;
      }
      return false;
    }

    function pushOrganic() {
      while (organicIndex < organicPool.length) {
        const story = organicPool[organicIndex++];
        if (pushStory(story, isViralCandidate(story) ? "viral" : "organic")) return true;
      }
      return false;
    }

    let guard = 0;
    while (entries.length < limit && guard < 40) {
      guard += 1;
      let moved = false;
      for (const regionId of REGION_ORDER) {
        const bucket = buckets.get(regionId) || [];
        if (!bucket.length || entries.length >= limit) continue;
        const region = REGIONS[regionId] || REGIONS.geral;
        entries.push({ type: "region-header", regionId, region: region.label, short: region.short });
        let taken = 0;
        let cardsSinceHeader = 0;
        const countInsertedCards = (beforeLength) => {
          cardsSinceHeader += Math.max(0, entries.length - beforeLength);
        };
        while (bucket.length && taken < blockSize && entries.length < limit) {
          const nextStory = bucket.shift();
          const beforeStory = entries.length;
          if (pushStory(nextStory, isViralCandidate(nextStory) ? "viral" : "story")) {
            taken += 1;
            countInsertedCards(beforeStory);
          }
          if (storyCount > 0 && storyCount % viralEvery === 0 && entries.length < limit) {
            const beforeViral = entries.length;
            if (pushViral()) countInsertedCards(beforeViral);
          }
        }
        while (cardsSinceHeader > 0 && cardsSinceHeader % rowColumns !== 0 && entries.length < limit) {
          const beforeOrganic = entries.length;
          if (!pushOrganic()) break;
          countInsertedCards(beforeOrganic);
        }
        moved = true;
      }
      if (!moved) break;
    }

    while (entries.length < limit && pushOrganic()) {}
    return entries.slice(0, limit);
  }

  function buildRssFallbackEntries(stories = [], options = {}) {
    const limit = Math.max(1, Number(options.limit || 24));
    const offset = Math.max(0, Number(options.offset || 0));
    const candidates = stories
      .filter(Boolean)
      .filter(hasMedia)
      .map((story) => ({ ...story, flow: classifyStory(story) }))
      .filter((story) => story.flow.organic || story.flow.regionId === "brasil" || story.flow.regionId === "geral" || story.flow.topic === "viral");
    const source = candidates.length ? candidates : stories.filter(Boolean).filter(hasMedia).map((story) => ({ ...story, flow: classifyStory(story) }));
    if (!source.length) return [];
    const sorted = source.sort((a, b) => scoreStory(b) - scoreStory(a) || storyStamp(b) - storyStamp(a));
    const entries = [];
    for (let i = 0; i < limit; i += 1) {
      const story = sorted[(offset + i) % sorted.length];
      const cycle = Math.floor((offset + i) / sorted.length);
      entries.push({
        type: "rss",
        cycle,
        story: {
          ...story,
          flow: {
            ...story.flow,
            regionId: story.flow.regionId === "geral" ? "rss-aberto" : story.flow.regionId,
            region: story.flow.regionId === "geral" ? "RSS aberto" : story.flow.region,
            subsection: `RSS aberto • ${story.flow.subsection}`,
            organic: true,
          },
        },
        flow: {
          ...story.flow,
          regionId: story.flow.regionId === "geral" ? "rss-aberto" : story.flow.regionId,
          region: story.flow.regionId === "geral" ? "RSS aberto" : story.flow.region,
          subsection: `RSS aberto • ${story.flow.subsection}`,
          organic: true,
        },
      });
    }
    return entries;
  }

  return {
    classifyStory,
    buildCzsFlowEntries,
    buildRssFallbackEntries,
    normalize,
    regions: REGIONS,
  };
});
