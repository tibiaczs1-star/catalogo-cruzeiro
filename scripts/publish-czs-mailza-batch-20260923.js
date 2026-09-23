const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const NOW = "2026-09-23T12:00:00-05:00";
const DISPLAY_DATE = "23 de set de 2026";

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function normalizeUrl(sourceUrl) {
  return sourceUrl || `https://catalogo-cruzeiro-web.onrender.com/`;
}

function buildItem(config, index) {
  const sourceUrl = normalizeUrl(config.sourceUrl);
  const summary = config.summary;
  const title = config.title;
  const body = [
    config.body,
    `Fonte: ${config.sourceName}. Publicado/checado em ${config.sourceDate}. Link original preservado para conferencia editorial.`
  ];

  return {
    id: sourceUrl,
    slug: config.slug,
    title,
    eyebrow: config.eyebrow,
    date: DISPLAY_DATE,
    publishedAt: new Date(new Date(NOW).getTime() - index * 60000).toISOString(),
    category: config.category,
    categoryKey: config.categoryKey,
    previewClass: config.previewClass,
    sourceName: config.sourceName,
    sourceUrl,
    sourceLabel: title,
    lede: config.lede,
    summary,
    analysis: config.analysis || "",
    highlights: config.highlights || [],
    development: config.development || [],
    imageUrl: config.imageUrl,
    feedImageUrl: config.imageUrl,
    sourceImageUrl: config.imageUrl,
    imageCredit: config.imageCredit || "Imagem de apoio Catálogo CZS",
    imageFocus: config.imageFocus || "",
    imageFit: config.imageFit || "cover",
    media: null,
    videoUrl: "",
    priority: 7600 - index,
    editorialPriority: config.editorialPriority || "cruzeiro-destaque",
    crossSources: [{ name: config.sourceName, url: sourceUrl }],
    alternateSources: [{ name: config.sourceName, url: sourceUrl }],
    sourceCount: 1,
    alternateSlugs: [config.slug],
    audioNarrationText: `Boa tarde. Eu sou a RAyL, do Catalogo Cruzeiro do Sul. Agora no catalogo: ${title}. ${summary} A informacao vem de ${config.sourceName}.`,
    audioNarrationTranscript: `Boa tarde. Eu sou a RAyL, do Catalogo Cruzeiro do Sul. Agora no catalogo: ${title}. ${summary} A informacao vem de ${config.sourceName}.`,
    audioNarrationVoice: "rayl-francisca-whatsapp-normal",
    audioNarrationVoiceName: "RAyL Francisca WhatsApp normal",
    audioNarrationVoiceEngine: "edge-tts",
    audioNarrationVoiceModel: "pt-BR-FranciscaNeural",
    audioNarrationVoiceSampleUrl: "/assets/voice/rayl/rayl-ref2-francisca-whatsapp-normal.mp3",
    audioNarrationLanguage: "pt-BR",
    audioNarrationStatus: "ready-transcript",
    videoCaptionText: `Imagem da noticia: ${title}. ${summary} Fonte: ${config.sourceName}.`,
    videoCaptionStatus: "ready",
    accessibility: {
      hasAudioNarrationText: true,
      hasAudioNarrationTranscript: true,
      raylVoice: "rayl-francisca-whatsapp-normal",
      hasVideoCaptionText: true
    },
    body,
    editorialScope: config.editorialScope || "cruzeiro-do-sul",
    editorialLocalTier: config.editorialLocalTier || 4,
    editorialSurfaceTier: config.editorialSurfaceTier || 4
  };
}

const img = {
  servicos: "assets/cadernos/caderno-servicos.jpg",
  cidade: "assets/home-cache/rio-jurua-panorama.jpg",
  comunidade: "assets/cadernos/caderno-comunidade.jpg",
  educacao: "assets/home-cache/fallback-educacao.jpg",
  cotidiano: "assets/home-cache/fallback-cotidiano.jpg",
  calendario: "assets/cadernos/caderno-calendario.jpg",
  arquivo: "assets/cadernos/caderno-arquivo.jpg"
};

const sourceHome = {
  juruaOnline: "https://juruaonline.com.br/",
  juruaTempo: "https://www.juruaemtempo.com.br/",
  agoraAcre: "https://agoraacre.com/",
  prefeitura: "https://www.cruzeirodosul.ac.gov.br/",
  portalAcre: "https://agencia.ac.gov.br/",
  noticiasAcreana: "https://noticiasacreana.com/",
  critica: "https://acriticadoacre.com.br/"
};

const batch = [
  {
    slug: "caps-cruzeiro-novo-endereco-retoma-atendimentos-dia-29",
    title: "CAPS retoma atendimentos dia 29",
    eyebrow: "Saude",
    category: "Saude",
    categoryKey: "saude",
    previewClass: "thumb-servicos",
    sourceName: "Jurua Online",
    sourceDate: "22/09/2026",
    sourceUrl: "https://juruaonline.com.br/caps-de-cruzeiro-do-sul-passa-a-funcionar-em-novo-endereco-e-retoma-atendimentos-no-dia-29/",
    lede: "O CAPS de Cruzeiro do Sul passa a funcionar em novo endereco e tem retomada dos atendimentos informada para o dia 29.",
    summary: "O CAPS de Cruzeiro do Sul passa a funcionar em novo endereco, na Rua Pedro Teles, e deve retomar os atendimentos no dia 29, com impacto direto para usuarios do servico de saude mental.",
    body: "A mudanca exige atencao de pacientes e familias que acompanham o servico. A orientacao editorial e tratar a nota como utilidade publica, preservando endereco, data de retomada e fonte original.",
    imageUrl: img.servicos,
    editorialPriority: "servico-publico"
  },
  {
    slug: "previsao-tempo-cruzeiro-do-sul-23-setembro",
    title: "Cruzeiro tera calor e chuva",
    eyebrow: "Tempo",
    category: "Tempo",
    categoryKey: "servicos",
    previewClass: "thumb-servicos",
    sourceName: "Jurua Online",
    sourceDate: "23/09/2026",
    sourceUrl: sourceHome.juruaOnline,
    lede: "A previsao para Cruzeiro do Sul aponta calor, variacao de nuvens e possibilidade de pancadas de chuva.",
    summary: "A previsao indica quarta-feira de calor em Cruzeiro do Sul, com nebulosidade variavel e possibilidade de pancadas de chuva, reforcando atencao para mudancas rapidas no tempo.",
    body: "A nota entra como servico local e deve ser atualizada se houver novo boletim meteorologico ou alerta oficial para a regiao do Vale do Jurua.",
    imageUrl: img.cidade
  },
  {
    slug: "bombeiros-combatem-incendios-cruzeiro-rodrigues-alves",
    title: "Bombeiros combatem incendios no Jurua",
    eyebrow: "Meio ambiente",
    category: "Meio ambiente",
    categoryKey: "cotidiano",
    previewClass: "thumb-cotidiano",
    sourceName: "Agora Acre",
    sourceDate: "22/09/2026",
    sourceUrl: sourceHome.agoraAcre,
    lede: "Equipes do Corpo de Bombeiros atuaram em ocorrencias de incendio em Cruzeiro do Sul e Rodrigues Alves.",
    summary: "Bombeiros atuaram em focos de incendio em Cruzeiro do Sul e Rodrigues Alves, com registro de area queimada e de area preservada durante o combate as chamas.",
    body: "O texto deve evitar alarmismo e manter o foco em servico, prevencao e balanco operacional informado pelas fontes regionais.",
    imageUrl: img.cotidiano
  },
  {
    slug: "rogerio-mesquita-assume-presidio-manoel-neri",
    title: "Mesquita assume presidio Manoel Neri",
    eyebrow: "Seguranca",
    category: "Seguranca publica",
    categoryKey: "seguranca",
    previewClass: "thumb-cotidiano",
    sourceName: "Jurua Online",
    sourceDate: "22/09/2026",
    sourceUrl: sourceHome.juruaOnline,
    lede: "Rogerio Mesquita foi anunciado na direcao do presidio Manoel Neri, em Cruzeiro do Sul.",
    summary: "Rogerio Mesquita assume a direcao do presidio Manoel Neri, em Cruzeiro do Sul, em mudanca administrativa no sistema prisional local.",
    body: "A cobertura deve ficar no tom institucional, registrando a alteracao de gestao e preservando a fonte original.",
    imageUrl: img.arquivo
  },
  {
    slug: "semana-nacional-transito-redacao-premiada-cruzeiro",
    title: "Transito premia redacoes em Cruzeiro",
    eyebrow: "Educacao",
    category: "Educacao",
    categoryKey: "educacao",
    previewClass: "thumb-educacao",
    sourceName: "Prefeitura de Cruzeiro do Sul",
    sourceDate: "21/09/2026",
    sourceUrl: sourceHome.prefeitura,
    lede: "A Semana Nacional de Transito abriu a acao Redacao Premiada em escola de Cruzeiro do Sul.",
    summary: "A Semana Nacional de Transito em Cruzeiro do Sul abriu o concurso Redacao Premiada, com atividades na Escola Civico-Militar Madre Adelgundes Becker e programacao ate o dia 25.",
    body: "O assunto serve para site e redes de servico, com foco em educacao no transito e participacao estudantil.",
    imageUrl: img.educacao,
    editorialPriority: "servico-publico"
  },
  {
    slug: "duas-mulheres-presas-trafico-miritizal-cruzeiro",
    title: "Mulheres sao presas no Miritizal",
    eyebrow: "Policia",
    category: "Policia",
    categoryKey: "seguranca",
    previewClass: "thumb-cotidiano",
    sourceName: "Agora Acre",
    sourceDate: "22/09/2026",
    sourceUrl: sourceHome.agoraAcre,
    lede: "Duas mulheres foram presas no bairro Miritizal, em ocorrencia relacionada a suspeita de trafico.",
    summary: "Duas mulheres foram presas no bairro Miritizal, em Cruzeiro do Sul, em ocorrencia ligada a suspeita de trafico de drogas, segundo veiculos regionais.",
    body: "Usar cautela juridica: evitar condenacao antecipada, manter atribuicao a fonte e registrar como ocorrencia policial.",
    imageUrl: img.arquivo
  },
  {
    slug: "casal-preso-maconha-morro-da-gloria-cruzeiro",
    title: "Casal e preso no Morro",
    eyebrow: "Policia",
    category: "Policia",
    categoryKey: "seguranca",
    previewClass: "thumb-cotidiano",
    sourceName: "Agora Acre",
    sourceDate: "22/09/2026",
    sourceUrl: sourceHome.agoraAcre,
    lede: "Um casal foi preso no bairro Morro da Gloria durante ocorrencia com apreensao de maconha.",
    summary: "Um casal foi preso no bairro Morro da Gloria, em Cruzeiro do Sul, durante ocorrencia policial envolvendo apreensao de maconha.",
    body: "A publicacao deve manter linguagem objetiva, sem expor detalhes desnecessarios alem do informado pela fonte.",
    imageUrl: img.arquivo
  },
  {
    slug: "mpac-apura-cemiterio-municipal-jordao",
    title: "MPAC apura cemiterio em Jordao",
    eyebrow: "Interior",
    category: "Interior",
    categoryKey: "jurua",
    previewClass: "thumb-jurua",
    sourceName: "Jurua Online",
    sourceDate: "21/09/2026",
    sourceUrl: sourceHome.juruaOnline,
    lede: "O Ministerio Publico do Acre apura a situacao do cemiterio municipal de Jordao.",
    summary: "O MPAC converteu procedimento em inquerito civil para apurar a situacao do cemiterio municipal de Jordao, com pontos sobre lotacao, alagamentos e proximidade do Rio Tarauaca.",
    body: "O caso tem interesse regional e deve ser acompanhado por atualizacoes oficiais do Ministerio Publico e da prefeitura local.",
    imageUrl: img.comunidade,
    editorialScope: "jurua"
  },
  {
    slug: "tre-ac-orientacoes-atendimento-eleitoral-acre",
    title: "TRE orienta eleitores no Acre",
    eyebrow: "Eleicoes",
    category: "Eleicoes",
    categoryKey: "servicos",
    previewClass: "thumb-servicos",
    sourceName: "TRE-AC",
    sourceDate: "22/09/2026",
    sourceUrl: "https://www.tre-ac.jus.br/",
    lede: "O TRE-AC divulgou orientacoes sobre atendimento eleitoral para eleitores do Acre.",
    summary: "O TRE-AC divulgou orientacoes de atendimento eleitoral, com informacoes para eleitores que precisam regularizar situacao ou buscar servicos da Justica Eleitoral.",
    body: "Como servico publico, a chamada deve priorizar prazos, canais oficiais e orientacao para consulta direta no TRE-AC.",
    imageUrl: img.servicos,
    editorialPriority: "servico-publico"
  },
  {
    slug: "cruzeiro-122-anos-desfile-copao-jurua",
    title: "Cruzeiro prepara agenda de 122 anos",
    eyebrow: "Agenda",
    category: "Agenda",
    categoryKey: "agenda",
    previewClass: "thumb-agenda",
    sourceName: "Jurua Online",
    sourceDate: "22/09/2026",
    sourceUrl: "https://juruaonline.com.br/desfile-civico-e-final-do-copao-do-jurua-marcam-aniversario-de-cruzeiro-do-sul/",
    lede: "Desfile civico e final do Copao do Jurua aparecem na programacao do aniversario de Cruzeiro do Sul.",
    summary: "Cruzeiro do Sul prepara agenda de aniversario de 122 anos com desfile civico e final do Copao do Jurua entre os destaques de programacao.",
    body: "A materia pode funcionar como guia de agenda, com atualizacao de locais e horarios conforme a prefeitura divulgar novas informacoes.",
    imageUrl: img.calendario,
    editorialPriority: "agenda-local"
  },
  {
    slug: "agenda-unicef-crianca-adolescente-cruzeiro",
    title: "Cruzeiro cria agenda da infancia",
    eyebrow: "Gestao publica",
    category: "Gestao publica",
    categoryKey: "prefeitura",
    previewClass: "thumb-prefeitura",
    sourceName: "Prefeitura de Cruzeiro do Sul",
    sourceDate: "setembro de 2026",
    sourceUrl: sourceHome.prefeitura,
    lede: "Cruzeiro do Sul instituiu agenda transversal voltada a criancas e adolescentes.",
    summary: "Cruzeiro do Sul instituiu uma agenda transversal para criancas e adolescentes, vinculada a politicas publicas e ao acompanhamento de indicadores do Selo UNICEF.",
    body: "A cobertura deve explicar o decreto de forma simples e acompanhar entregas concretas para a populacao.",
    imageUrl: img.educacao
  },
  {
    slug: "campanha-antirrabica-bairros-cruzeiro",
    title: "Antirrabica segue nos bairros",
    eyebrow: "Servico",
    category: "Servico",
    categoryKey: "servicos",
    previewClass: "thumb-servicos",
    sourceName: "Jurua Online",
    sourceDate: "setembro de 2026",
    sourceUrl: "https://juruaonline.com.br/vacinacao-antirrabica-de-porta-a-porta-acontecera-de-segunda-a-sexta-conheca-o-calendario-nos-bairros/",
    lede: "A campanha antirrabica de porta em porta segue em bairros de Cruzeiro do Sul.",
    summary: "A vacinacao antirrabica de caes e gatos segue em bairros de Cruzeiro do Sul, com calendario de porta em porta e meta de imunizar milhares de animais.",
    body: "O ideal e atualizar a nota com calendario por bairro e orientar moradores a manter animais acessiveis no periodo de visita.",
    imageUrl: img.servicos,
    editorialPriority: "servico-publico"
  },
  {
    slug: "mailza-hospital-ponte-empregos-bom-dia-jurua",
    title: "Mailza fala de saude e ponte",
    eyebrow: "Politica",
    category: "Politica",
    categoryKey: "politica",
    previewClass: "thumb-politica",
    sourceName: "Jurua Online",
    sourceDate: "22/09/2026",
    sourceUrl: "https://juruaonline.com.br/mailza-destaca-hospital-do-cancer-ponte-para-rodrigues-alves-e-geracao-de-empregos-como-prioridades-para-novo-mandato/",
    lede: "Mailza citou hospital do cancer, ponte para Rodrigues Alves e geracao de empregos como prioridades.",
    summary: "Em entrevista ao Bom Dia Jurua, Mailza destacou hospital do cancer, ponte para Rodrigues Alves e geracao de empregos como prioridades para um novo mandato.",
    body: "A nota deve deixar claro que se trata de fala de campanha/entrevista, sem apresentar promessa como obra entregue.",
    imageUrl: img.cidade,
    editorialPriority: "politica-verificada"
  },
  {
    slug: "mailza-insercoes-tv-emprego-familias",
    title: "Insercoes destacam emprego e familias",
    eyebrow: "Campanha",
    category: "Politica",
    categoryKey: "politica",
    previewClass: "thumb-politica",
    sourceName: "A Critica do Acre",
    sourceDate: "22/09/2026",
    sourceUrl: sourceHome.critica,
    lede: "Novas insercoes de TV da campanha destacam emprego, empreendedorismo e familias.",
    summary: "Novas insercoes de TV ligadas a Mailza destacam emprego, empreendedorismo e cuidado com familias, em conteudo de campanha que exige atribuicao clara ao material eleitoral.",
    body: "Tratar como acompanhamento de campanha. Evitar linguagem promocional e identificar a origem do conteudo.",
    imageUrl: img.arquivo,
    editorialPriority: "campanha-monitorada"
  },
  {
    slug: "mailza-agenda-santa-rosa-do-purus",
    title: "Mailza cumpre agenda em Santa Rosa",
    eyebrow: "Campanha",
    category: "Politica",
    categoryKey: "politica",
    previewClass: "thumb-politica",
    sourceName: "A Critica do Acre",
    sourceDate: "22/09/2026",
    sourceUrl: sourceHome.critica,
    lede: "Agenda em Santa Rosa do Purus reuniu liderancas e representantes locais.",
    summary: "Mailza cumpriu agenda em Santa Rosa do Purus, com reuniao junto a liderancas indigenas, vice-prefeito e area de saude, segundo fonte de campanha.",
    body: "Manter a publicacao como registro de agenda no interior e evitar apresentar presenca politica como endosso institucional do jornal.",
    imageUrl: img.comunidade,
    editorialPriority: "campanha-monitorada"
  },
  {
    slug: "mailza-propoe-programa-permanente-ramais",
    title: "Proposta mira ramais e pontes",
    eyebrow: "Campanha",
    category: "Politica",
    categoryKey: "politica",
    previewClass: "thumb-politica",
    sourceName: "A Critica do Acre",
    sourceDate: "22/09/2026",
    sourceUrl: sourceHome.critica,
    lede: "Proposta de campanha fala em programa permanente para ramais e pontes de madeira.",
    summary: "A campanha de Mailza divulgou proposta de programa permanente para ramais, substituicao de pontes de madeira e conclusao de obras em areas rurais.",
    body: "Publicar como promessa de campanha, com checagem posterior de valores, obras citadas e viabilidade.",
    imageUrl: img.cidade,
    editorialPriority: "campanha-monitorada"
  },
  {
    slug: "mailza-saneamento-xapuri-eta-redes",
    title: "Proposta cita saneamento em Xapuri",
    eyebrow: "Campanha",
    category: "Politica",
    categoryKey: "politica",
    previewClass: "thumb-politica",
    sourceName: "A Critica do Acre",
    sourceDate: "22/09/2026",
    sourceUrl: sourceHome.critica,
    lede: "Proposta de campanha envolve ETA e redes de abastecimento em Xapuri.",
    summary: "Uma atualizacao de campanha de Mailza cita proposta para agua e saneamento em Xapuri, envolvendo ETA e redes de abastecimento.",
    body: "Tratar como proposta, nao como entrega confirmada. Acompanhamento deve buscar dados oficiais do saneamento local.",
    imageUrl: img.servicos,
    editorialPriority: "campanha-monitorada"
  },
  {
    slug: "mailza-saude-mental-interior-servicos",
    title: "Campanha cita saude mental no interior",
    eyebrow: "Campanha",
    category: "Politica",
    categoryKey: "politica",
    previewClass: "thumb-politica",
    sourceName: "A Critica do Acre",
    sourceDate: "15/09/2026",
    sourceUrl: sourceHome.critica,
    lede: "Atualizacao de campanha cita saude mental e servicos especializados fora da capital.",
    summary: "A campanha de Mailza voltou a citar ampliacao de cuidados em saude mental e servicos especializados no interior, tema que exige separacao entre proposta politica e servico publico local.",
    body: "Nao misturar com a nota do CAPS, que e utilidade publica municipal. Esta materia deve permanecer no eixo de campanha.",
    imageUrl: img.servicos,
    editorialPriority: "campanha-monitorada"
  },
  {
    slug: "mulheres-mailza-jessica-cruzeiro-do-sul",
    title: "Mulheres reunem Mailza e Jessica",
    eyebrow: "Politica",
    category: "Politica",
    categoryKey: "politica",
    previewClass: "thumb-politica",
    sourceName: "Agencia de Noticias do Acre",
    sourceDate: "22/09/2026",
    sourceUrl: sourceHome.portalAcre,
    lede: "Encontro com mulheres reuniu Mailza Assis e Jessica Sales em Cruzeiro do Sul.",
    summary: "Encontro com mulheres em Cruzeiro do Sul reuniu Mailza Assis e Jessica Sales, em ato politico acompanhado por apoiadores e liderancas.",
    body: "A cobertura deve registrar participantes, local e pauta, sem converter a nota em material de propaganda.",
    imageUrl: img.comunidade,
    editorialPriority: "politica-verificada"
  },
  {
    slug: "caminhada-acre-avanca-miritizal-mailza-jessica",
    title: "Miritizal recebe caminhada politica",
    eyebrow: "Politica",
    category: "Politica",
    categoryKey: "politica",
    previewClass: "thumb-politica",
    sourceName: "Agencia de Noticias do Acre",
    sourceDate: "21/09/2026",
    sourceUrl: sourceHome.portalAcre,
    lede: "A caminhada O Acre Avanca passou pelo bairro Miritizal, em Cruzeiro do Sul.",
    summary: "A caminhada O Acre Avanca passou pelo Miritizal, em Cruzeiro do Sul, com participacao de Mailza Assis e Jessica Sales, segundo divulgacao de campanha.",
    body: "Tratar como agenda politica no bairro e manter a atribuicao de campanha no texto.",
    imageUrl: img.cidade,
    editorialPriority: "politica-verificada"
  }
];

const campaignUpdates = [
  { key: "A", title: "Insercoes de TV", status: "publicada no lote como materia monitorada", slug: "mailza-insercoes-tv-emprego-familias" },
  { key: "B", title: "Agenda em Santa Rosa do Purus", status: "publicada no lote como agenda do interior", slug: "mailza-agenda-santa-rosa-do-purus" },
  { key: "C", title: "Programa permanente de ramais", status: "publicada no lote como proposta de campanha", slug: "mailza-propoe-programa-permanente-ramais" },
  { key: "D", title: "Agua e saneamento em Xapuri", status: "publicada no lote como proposta de campanha", slug: "mailza-saneamento-xapuri-eta-redes" },
  { key: "E", title: "Saude mental e servicos especializados no interior", status: "publicada no lote com separacao do servico municipal CAPS", slug: "mailza-saude-mental-interior-servicos" },
  { key: "F", title: "Pesquisa Data Control", status: "nao publicada: precisa metodologia, registro, amostra, margem e data de campo", slug: null },
  { key: "G", title: "Encontro com Mulheres em Cruzeiro do Sul", status: "publicada no lote como ato politico verificado", slug: "mulheres-mailza-jessica-cruzeiro-do-sul" },
  { key: "H", title: "Caminhada no Miritizal", status: "publicada no lote como agenda politica local", slug: "caminhada-acre-avanca-miritizal-mailza-jessica" },
  { key: "I", title: "Entrevista no Bom Dia Jurua", status: "publicada no lote como entrevista com propostas", slug: "mailza-hospital-ponte-empregos-bom-dia-jurua" }
];

const items = batch.map(buildItem);

const archiveFile = path.join(ROOT, "data", "news-archive.json");
const runtimeFile = path.join(ROOT, "data", "runtime-news.json");
const newsDataFile = path.join(ROOT, "news-data.js");
const indexFile = path.join(ROOT, "index.html");
const campaignFile = path.join(ROOT, "data", "mailza-campaign-updates-20260923.json");

const archive = readJson(archiveFile, []);
const freshSlugs = new Set(items.map((item) => item.slug));
const merged = [
  ...items,
  ...archive.filter((item) => !freshSlugs.has(item.slug))
];

writeJson(archiveFile, merged);

const runtime = readJson(runtimeFile, {});
const previousRuntimeItems = Array.isArray(runtime.items)
  ? runtime.items
  : Array.isArray(runtime)
    ? runtime
    : [];
const previousActiveWindowItems = Array.isArray(runtime.activeWindowItems)
  ? runtime.activeWindowItems
  : previousRuntimeItems;
const mergedRuntimeItems = [
  ...items,
  ...previousRuntimeItems.filter((item) => !freshSlugs.has(item.slug))
];
const mergedActiveWindowItems = [
  ...items,
  ...previousActiveWindowItems.filter((item) => !freshSlugs.has(item.slug))
];
runtime.lastAttemptAt = new Date(NOW).toISOString();
runtime.lastSuccessAt = new Date(NOW).toISOString();
runtime.source = "manual-czs-mailza-batch-20260923";
runtime.activeWindowItems = mergedActiveWindowItems;
runtime.items = mergedRuntimeItems;
runtime.total = mergedRuntimeItems.length;
runtime.archiveTotal = merged.length;
writeJson(runtimeFile, runtime);

fs.writeFileSync(
  newsDataFile,
  `window.NEWS_ARCHIVE_TOTAL = ${merged.length};\nwindow.NEWS_DATA = ${JSON.stringify(merged, null, 2)};\n`
);

const indexPayload = {
  ok: true,
  total: merged.length,
  archiveTotal: merged.length,
  returned: Math.min(12, merged.length),
  items: merged.slice(0, 12)
};
const indexHtml = fs.readFileSync(indexFile, "utf8");
const newsDataPattern = /<script\b[^>]*\bid=["']newsData["'][^>]*>[\s\S]*?<\/script>/i;
if (!newsDataPattern.test(indexHtml)) {
  throw new Error("Nao encontrei o bloco newsData em index.html");
}
const replaced = indexHtml.replace(
  newsDataPattern,
  `<script id="newsData" type="application/json">${JSON.stringify(indexPayload)}</script>`
);
fs.writeFileSync(indexFile, replaced);

writeJson(campaignFile, {
  generatedAt: new Date(NOW).toISOString(),
  sourcePackage: "outputs/pacote-czs-20-materias-mailza-2026-09-23.md",
  note: "Atualizacoes de campanha tratadas como cobertura politica/editorial. Pesquisa estacionada ate checagem humana.",
  updates: campaignUpdates
});

console.log(JSON.stringify({
  insertedOrUpdated: items.length,
  total: merged.length,
  topSlugs: merged.slice(0, 5).map((item) => item.slug),
  parked: campaignUpdates.filter((update) => update.slug === null).map((update) => update.title)
}, null, 2));
