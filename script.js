const revealNodes = document.querySelectorAll(".reveal");
const radarFilterButtons = document.querySelectorAll("#radar .chip-button[data-filter]");
const dayChips = document.querySelectorAll(".day-chip");
const betButtons = document.querySelectorAll(".bet-option");
const parallaxNodes = document.querySelectorAll("[data-parallax]");
const stakeInput = document.querySelector("#stake");
const stakeValue = document.querySelector("#stake-value");
const stakeReturn = document.querySelector("#stake-return");
const commentForm = document.querySelector("#comment-form");
const commentAuthorInput = document.querySelector("#comment-author");
const opinionInput = document.querySelector("#opinion");
const publishCommentButton = document.querySelector("#publish-comment");
const commentsFeed = document.querySelector(".comments-feed");
const commentFeedback = document.querySelector("#comment-feedback");
const charCount = document.querySelector("#char-count");
const guideTip = document.querySelector("#guide-tip");
const splashRoot = document.querySelector(".logo-splash");
const splashStatus = document.querySelector("#logo-splash-status");
const splashDate = document.querySelector("#logo-splash-date");
const radarGuide = document.querySelector("#radar-guide");
const radarGuideLabel = document.querySelector("#radar-guide-label");
const radarGuideText = document.querySelector("#radar-guide-text");
const radarGuideScene = radarGuide?.querySelector(".radar-guide-scene");
const radarGuideSprite = radarGuide?.querySelector(".radar-guide-sprite");
const radarGuideLaser = radarGuide?.querySelector(".radar-guide-laser");
const radarGuideLaserDot = radarGuide?.querySelector(".radar-guide-laser-dot");
const radarGuideLantern = radarGuide?.querySelector(".radar-guide-lantern");
const radarGuideFrontArm = radarGuide?.querySelector(".radar-guide-arm.arm-front");
const radarFlowFocus = radarGuide?.querySelector("[data-radar-flow-focus]");
const radarFlowLead = radarGuide?.querySelector("[data-radar-flow-lead]");
const thumbNodes = document.querySelectorAll(".news-thumb, .mini-thumb");
const subscriptionForm = document.querySelector("#subscription-form");
const subscriptionNameInput = document.querySelector("#subscription-name");
const subscriptionEmailInput = document.querySelector("#subscription-email");
const subscriptionPlanInput = document.querySelector("#subscription-plan");
const subscriptionFounderWrap = document.querySelector("#subscription-founder-wrap");
const subscriptionFounderAmountInput = document.querySelector("#subscription-founder-amount");
const subscriptionFeedback = document.querySelector("#subscription-feedback");
const subscriptionSubmitButton = document.querySelector("#subscription-submit");
const subscriptionPaymentCard = document.querySelector("#subscription-payment-card");
const subscriptionPixKey = document.querySelector("[data-supporter-pix-key]");
const subscriptionPixAmount = document.querySelector("[data-supporter-pix-amount]");
const subscriptionPixTxid = document.querySelector("[data-supporter-pix-txid]");
const subscriptionPixQr = document.querySelector("#subscription-pix-qr");
const subscriptionPixCode = document.querySelector("#subscription-pix-code");
const subscriptionPaymentNote = document.querySelector("#subscription-payment-note");
const subscriptionCopyPixButton = document.querySelector("#subscription-copy-pix");
const subscriptionRefreshPixButton = document.querySelector("#subscription-refresh-pix");
const foundersCount = document.querySelector("#founders-count");
const foundersList = document.querySelector("#founders-list");
const agentMailModal = document.querySelector("#agent-mail-modal");
const agentMailForm = document.querySelector("#agent-mail-form");
const agentMailNameInput = document.querySelector("#agent-mail-name");
const agentMailEmailInput = document.querySelector("#agent-mail-email");
const agentMailSubjectInput = document.querySelector("#agent-mail-subject");
const agentMailMessageInput = document.querySelector("#agent-mail-message");
const agentMailFeedback = document.querySelector("#agent-mail-feedback");
const footerChatInput = document.querySelector("#footer-chat-input");
const footerChatSend = document.querySelector("#footer-chat-send");
const heroTourismShell = document.querySelector(".hero-newsroom-shell");
const heroInsidersShell = document.querySelector(".hero-insiders-shell");
const heroTourismSlides = [...document.querySelectorAll("[data-hero-tourism-slide]")];
const heroTourismKicker = document.querySelector("[data-hero-tourism-kicker]");
const heroTourismTitle = document.querySelector("[data-hero-tourism-title]");
const heroTourismNote = document.querySelector("[data-hero-tourism-note]");
const heroTourismMetaLink = document.querySelector("[data-hero-tourism-meta-link]");
const heroDailyNewsCard = document.querySelector("[data-hero-daily-link]");
const heroDailyNewsCategory = document.querySelector("[data-hero-daily-category]");
const heroDailyNewsTitle = document.querySelector("[data-hero-daily-title]");
const heroDailyNewsSummary = document.querySelector("[data-hero-daily-summary]");
const heroTopicCards = [...document.querySelectorAll("[data-hero-topic-card]")];
const heroOfficeStatusNodes = [...document.querySelectorAll("[data-hero-office-status]")];
const heroOfficeBubble = document.querySelector("[data-hero-office-bubble]");
const heroOfficeFeedItems = [...document.querySelectorAll("[data-hero-office-item]")];
const heroOfficePhoto = document.querySelector("[data-hero-office-photo]");
const heroOfficePhotoCategory = document.querySelector("[data-hero-office-photo-category]");
const heroOfficePhotoTitle = document.querySelector("[data-hero-office-photo-title]");
const heroOfficeTvFrame = document.querySelector("[data-hero-office-tv-frame]");
const heroOfficeTvCanvas = document.querySelector("[data-hero-office-tv]");
const heroOfficeTvCaption = document.querySelector("[data-hero-office-tv-caption]");
const heroTopicTrack = document.querySelector("[data-hero-topic-track]");
const heroTopicDots = document.querySelector("[data-hero-topic-dots]");
const communityAgentForm = document.querySelector("#community-agent-form");
const communityAgentFeedback = document.querySelector("#community-agent-feedback");
const communityReportList = document.querySelector("#community-report-list");
const communityTrendCard = document.querySelector("#community-trend-card");
const communityTrendTitle = document.querySelector("[data-community-trend-title]");
const communityTrendSummary = document.querySelector("[data-community-trend-summary]");
const communityTrendCaptions = document.querySelector("[data-community-trend-captions]");
const communityTrendTags = document.querySelector("[data-community-trend-tags]");
const communityTrendUpdated = document.querySelector("[data-community-trend-updated]");
let heroDesktopHighlightItems = [];
const cadernoCards = [...document.querySelectorAll(".cadernos-grid .caderno-card")];
const archiveBrowserLaunchers = [...document.querySelectorAll("[data-open-archive-browser]")];
const insidersTypedNodes = [...document.querySelectorAll("[data-insiders-typed]")];
const insidersBootScene = document.querySelector("[data-insiders-boot-scene]");
const insidersArmyScene = document.querySelector(
  "[data-insiders-army]:not([data-insiders-crowd-stage])"
);
const insidersChantTrack = document.querySelector("[data-insiders-chant-track]");
const tickerLiveGrid = document.querySelector("#ticker-live-grid");
const trendingBuzzGrid = document.querySelector("#trending .trending-grid");
const monthlyBuzzGrid = document.querySelector("#monthly .month-grid");
const whatMattersGrid = document.querySelector("[data-what-matters-grid]");
const performanceLiteMode = document.body.classList.contains("fx-lite");
const localeTimeZone = "America/Rio_Branco";
const isLocalFileProtocol = window.location.protocol === "file:";
const portalWhatsappNumber = "5568992269296";
const splashMessages = [
  "Abrindo os destaques de Cruzeiro do Sul",
  "Notícias, serviços e agenda em uma só leitura",
  "Atualizando a edição com foco no Vale do Juruá"
];
const splashMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const tickerDesktopStaticMedia =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(min-width: 821px)")
    : null;
const tickerPhrasePool = [
  { label: "Notícias", text: "As notícias locais mostram primeiro o que impacta Cruzeiro do Sul no dia." },
  { label: "Arquivo", text: "Arquivo do mês ajuda a entender o contexto das notícias mais recentes." },
  { label: "Comunidade", text: "Recados da comunidade entram com leitura rápida e informação útil." },
  { label: "Serviço", text: "Serviço útil aparece com endereço, horário e caminho para resolver." },
  { label: "Checagem", text: "Cada destaque sobe com checagem, contexto e fonte identificada." },
  { label: "Agenda", text: "Agenda cultural, cinema e teatro correm juntos no painel vivo." },
  { label: "Negócios", text: "Negócios locais ganham espaço com foco no que movimenta a cidade." },
  { label: "Educação", text: "Escolas, vestibular e oportunidades estudantis ficam sempre por perto." },
  { label: "Trânsito", text: "Mudou a rua, mudou a rotina: o letreiro avisa sem rodeio." },
  { label: "Clima", text: "Tempo, cheia e alerta entram cedo quando afetam o dia da população." },
  { label: "Cultura", text: "A cultura local aparece com voz própria e espaço de verdade." },
  { label: "Social", text: "Festas, encontros e repercussão social passam aqui com ritmo leve." },
  { label: "Opinião", text: "Humor e opinião aparecem sem tirar o foco do fato principal." },
  { label: "Fonte", text: "Resumo original com link para a fonte segue firme em cada bloco." },
  { label: "Assunto", text: "Os temas mais quentes entram com contexto, não só com barulho." },
  { label: "Bairro", text: "O que acontece no bairro também merece manchete bem tratada." },
  { label: "Plantão", text: "Plantão leve, visual limpo e leitura rápida para quem está no corre." },
  { label: "Comunidade", text: "Pedidos de correção, avisos de evento e mensagens úteis entram no fluxo." },
  { label: "Saúde", text: "Saúde, escola e utilidade pública ficam mais fáceis de achar nesta faixa." },
  { label: "Feira", text: "Feira, comércio e pequenos negócios entram no mapa com clareza." },
  { label: "Atualização", text: "A página mostra movimento e atualização sem perder clareza." },
  { label: "Agenda", text: "Show, peça, oficina e evento local aparecem em uma mesma corrida." },
  { label: "Serviço", text: "Telefone, endereço e atalho de serviço ficam mais perto do clique." },
  { label: "Rede", text: "O que viraliza aparece com contexto, fonte e cuidado." },
  { label: "Manchete", text: "Cada trilha mistura notícia, serviço e comunidade em equilíbrio." },
  { label: "Cobertura", text: "Cobertura regional passa em camadas para leitura rápida e contexto claro." },
  { label: "Leitor", text: "Quem mora na cidade encontra serviço rápido antes mesmo de abrir a matéria." },
  { label: "Centro", text: "Centro, bairros e zona rural podem dividir o mesmo painel com equilíbrio." },
  { label: "Política", text: "Política entra com leitura clara, contexto e nomes identificados." },
  { label: "Mercado", text: "Anúncio, membro e patrocínio convivem sem apagar a informação." },
  { label: "Cultura", text: "Cinema, teatro e agenda criativa ganham mais presença no topo." },
  { label: "Tempo real", text: "As frases trocam ao longo do dia para acompanhar o que está acontecendo agora." },
  { label: "Seleção", text: "A seleção regional mantém o foco no que realmente importa por aqui." },
  { label: "Destaque", text: "O topo vira uma grade viva para mostrar o que mexe com a cidade." },
  { label: "Vale do Juruá", text: "O Vale do Juruá aparece como território vivo, com contexto e proximidade." },
  { label: "Portal", text: "A entrada do site reúne atualização contínua, leitura rápida e contexto local." }
];
const tickerRuntime = {
  timerIds: []
};
const supporterPaymentState = {
  txid: "",
  amount: 5,
  locked: false
};
const heroTourismRotation = {
  photoIndex: 0,
  activeSlideIndex: 0,
  activeTopicIndex: 0,
  statusIndex: 0,
  bubbleIndex: 0,
  timerId: 0,
  bubbleTimerId: 0,
  statusTimerId: 0,
  topicTimerId: 0
};
let heroOfficeTvSourceItems = [];
let heroOfficeTvItems = [];
let heroOfficeTvCursor = 0;
let heroOfficeTvTimerId = 0;
let heroOfficeTvPaintToken = 0;
const heroDesktopBackdropMedia =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(min-width: 1041px)")
    : null;
const shouldUseSolidHeroShell = () => !heroDesktopBackdropMedia?.matches;
const heroOfficeBubblePool = [
  "Atualizando destaques da cidade",
  "Resumo local em revisão",
  "Acompanhando ruas, redes e agenda",
  "Novas informações chegando",
  "Edição do dia em atualização"
];
const heroOfficeStatusGroups = [
  ["Cobertura local", "Fontes verificadas", "Atualização contínua"],
  ["Notícias do Juruá", "Serviço em destaque", "Leitura rápida"],
  ["Agenda da cidade", "Contexto local", "Publicação no ar"],
  ["Movimento da região", "Apuração ativa", "Destaques confirmados"]
];
const mobileHomeLeadMedia =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(max-width: 740px)")
    : null;
const mobileIntroMedia =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(max-width: 760px)")
    : null;
const mobileHomeDomState = {
  initialized: false,
  menuDropdown: null,
  movedNodes: [],
  placeHolders: new Map()
};
const isMobileHomeViewport = () => Boolean(mobileHomeLeadMedia?.matches);
let lastArchiveBrowserOpenAt = 0;

const clearLiveTickerRuntime = () => {
  tickerRuntime.timerIds.forEach((timerId) => {
    window.clearTimeout(timerId);
    window.clearInterval(timerId);
  });
  tickerRuntime.timerIds = [];
};

const buildLiveTickerPhrasePool = (items = []) => {
  const seenKeys = new Set();
  const seenLabels = new Set();
  const firstByLabel = [];
  const repeatedLabels = [];

  (Array.isArray(items) ? items : [])
    .map((item) => normalizeRuntimeArticle(item))
    .filter((article) => {
      const key = article.slug || article.sourceUrl || article.id || article.title;

      if (!article.title || seenKeys.has(key)) {
        return false;
      }

      seenKeys.add(key);
      return true;
    })
    .slice(0, 80)
    .map((article) => ({
      label: truncateCopy(article.category || article.sourceName || "Agora", 20),
      text: truncateCopy(article.title || article.lede || "Atualização local em destaque.", 84)
    }))
    .forEach((phrase) => {
      const labelKey = normalizeText(phrase.label || "agora") || "agora";

      if (!seenLabels.has(labelKey)) {
        seenLabels.add(labelKey);
        firstByLabel.push(phrase);
        return;
      }

      repeatedLabels.push(phrase);
    });

  return [...firstByLabel, ...repeatedLabels].slice(0, 18);
};

const ensureTickerPhraseDiversity = (phrases = []) => {
  const normalized = (Array.isArray(phrases) ? phrases : []).filter((phrase) => phrase?.label && phrase?.text);
  const firstUnique = [];
  const remaining = [];
  const firstLabels = new Set();

  normalized.forEach((phrase) => {
    const labelKey = normalizeText(phrase.label || "agora") || "agora";
    if (firstUnique.length < 4 && !firstLabels.has(labelKey)) {
      firstLabels.add(labelKey);
      firstUnique.push(phrase);
      return;
    }

    remaining.push(phrase);
  });

  if (firstLabels.size >= 4) {
    return [...firstUnique, ...remaining];
  }

  const supplement = tickerPhrasePool.filter((phrase) => !firstLabels.has(normalizeText(phrase.label))).slice(0, 4);
  return [...firstUnique, ...supplement, ...remaining];
};

const getTickerPhrasePool = () => {
  const livePhrases = buildLiveTickerPhrasePool(window.NEWS_DATA || []);
  return ensureTickerPhraseDiversity(
    livePhrases.length >= 6 ? livePhrases : [...livePhrases, ...tickerPhrasePool]
  );
};
const splashStorageKey = "catalogo_splash_seen_v1";
const skipHomeIntroKey = "catalogo_skip_home_intro_once";
const offlineNewsCacheKey = "catalogo_news_cache_v2";
const offlineLastArticleKey = "catalogo_last_article_v2";
const legacyOfflineStorageKeys = ["catalogo_news_cache_v1", "catalogo_last_article_v1"];
const urlSearchParams = new URLSearchParams(window.location.search);
const urlRequestsSkipHomeIntro = (() => {
  const rawValue = String(urlSearchParams.get("skipIntro") || "").trim().toLowerCase();
  return rawValue === "1" || rawValue === "true" || rawValue === "yes";
})();
const clearSkipHomeIntroParamFromUrl = () => {
  if (!urlRequestsSkipHomeIntro || !window.history?.replaceState) {
    return;
  }

  try {
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("skipIntro");
    const nextUrl = `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`;
    window.history.replaceState({}, document.title, nextUrl);
  } catch (_error) {
    // Mantem a URL original se o navegador restringir a mudanca.
  }
};
const shouldSkipHomeIntro = (() => {
  if (urlRequestsSkipHomeIntro) {
    try {
      sessionStorage.setItem(skipHomeIntroKey, "1");
    } catch (_error) {
      // Continua pulando nesta visita mesmo sem sessionStorage.
    }

    clearSkipHomeIntroParamFromUrl();
    return true;
  }

  try {
    return sessionStorage.getItem(skipHomeIntroKey) === "1";
  } catch (_error) {
    return false;
  }
})();
const splashBootStartedAt =
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
window.__CATALOGO_SKIP_HOME_INTRO__ = shouldSkipHomeIntro;
legacyOfflineStorageKeys.forEach((storageKey) => {
  [window.localStorage, window.sessionStorage].forEach((storage) => {
    try {
      storage?.removeItem(storageKey);
    } catch (_error) {
      // Ignora ambientes sem storage disponivel.
    }
  });
});
const initialStaticNews = Array.isArray(window.NEWS_DATA) ? [...window.NEWS_DATA] : [];
const homepageStaticPreviewBySlug = {
  "pixel-art-nao-e-nostalgia-e-interface": {
    slug: "pixel-art-nao-e-nostalgia-e-interface",
    title: "Pixel art não é nostalgia: é uma tecnologia de leitura para jogos, mapas e notícias",
    category: "Jogos e arte",
    sourceName: "Cheffe Call - arte e design de jogos",
    imageUrl: "./assets/home-cache/pixel-art-editorial.svg",
    feedImageUrl: "./assets/home-cache/pixel-art-editorial.svg",
    sourceImageUrl: "./assets/home-cache/pixel-art-editorial.svg",
    imageFocus: "center 48%",
    heroFeatured: true
  },
  "michael-jackson-filme-cine-romeu-cruzeiro-do-sul": {
    slug: "michael-jackson-filme-cine-romeu-cruzeiro-do-sul",
    title: "Filme de Michael Jackson ganha peso global e pode movimentar o Cine Romeu",
    category: "Cinema em destaque",
    sourceName: "Catálogo Cruzeiro do Sul",
    imageUrl: "https://i.ytimg.com/vi/lIMj2ZRpo1M/maxresdefault.jpg",
    feedImageUrl: "https://i.ytimg.com/vi/lIMj2ZRpo1M/maxresdefault.jpg",
    sourceImageUrl: "https://i.ytimg.com/vi/lIMj2ZRpo1M/maxresdefault.jpg",
    imageFocus: "center 28%"
  },
  "filme-bolsonaro-memes-reacao-redes": {
    slug: "filme-bolsonaro-memes-reacao-redes",
    title: "Filme sobre Bolsonaro já chega cercado por memes, ironias e uma boa dose de gente irritada",
    category: "Memes e política pop",
    sourceName: "Catálogo Cruzeiro do Sul",
    imageUrl: "https://img.band.com.br/image/2026/04/08/dark-horse-e-o-novo-filme-sobre-jair-bolsonaro-91750.jpg",
    feedImageUrl: "https://img.band.com.br/image/2026/04/08/dark-horse-e-o-novo-filme-sobre-jair-bolsonaro-91750.jpg",
    sourceImageUrl: "https://img.band.com.br/image/2026/04/08/dark-horse-e-o-novo-filme-sobre-jair-bolsonaro-91750.jpg",
    imageFocus: "center 22%"
  },
  "fila-ovos-pascoa": {
    slug: "fila-ovos-pascoa",
    title: "Fila de ovos de Pascoa vira cena de rua e mostra o apetite do comercio em Cruzeiro do Sul",
    category: "Pascoa na cidade",
    sourceName: "ac24horas",
    imageUrl: "./assets/home-cache/buzz-cruzeiro-01.jpg",
    feedImageUrl: "./assets/home-cache/buzz-cruzeiro-01.jpg",
    sourceImageUrl: "./assets/home-cache/buzz-cruzeiro-01.jpg",
    imageFocus: "center 42%"
  },
  "aldir-blanc-cultura-czs": {
    slug: "aldir-blanc-cultura-czs",
    title: "Editais da Lei Aldir Blanc colocam artistas, produtores e agenda cultural no centro",
    category: "Cultura local",
    sourceName: "ac24horas",
    imageUrl: "./assets/home-cache/buzz-cultura-show.jpg",
    feedImageUrl: "./assets/home-cache/buzz-cultura-show.jpg",
    sourceImageUrl: "./assets/home-cache/buzz-cultura-show.jpg",
    imageFocus: "center 34%"
  },
  "victor-macario-viral": {
    slug: "victor-macario-viral",
    title: "Video bem editado, rosto conhecido e assunto local: a formula do viral acreano da semana",
    category: "Radar de redes",
    sourceName: "ac24horas",
    imageUrl: "./assets/home-cache/trend-theo-acreano.jpg",
    feedImageUrl: "./assets/home-cache/trend-theo-acreano.jpg",
    sourceImageUrl: "./assets/home-cache/trend-theo-acreano.jpg",
    imageFocus: "center 20%"
  },
  "lucas-dourado-pascoa": {
    slug: "lucas-dourado-pascoa",
    title: "Pascoa, boato e reaparicao: o caso Lucas Dourado ganha força nas redes acreanas",
    category: "Buzz publico",
    sourceName: "ac24horas",
    imageUrl: "./assets/home-cache/buzz-cruzeiro-04.jpg",
    feedImageUrl: "./assets/home-cache/buzz-cruzeiro-04.jpg",
    sourceImageUrl: "./assets/home-cache/buzz-cruzeiro-04.jpg",
    imageFocus: "center 34%"
  },
  "eja-czs-superacao": {
    slug: "eja-czs-superacao",
    title: "Historias de superacao na EJA de Cruzeiro do Sul inspiram novos estudantes",
    category: "Historias reais",
    sourceName: "Agencia Acre",
    imageUrl: "./assets/home-cache/fallback-educacao.jpg",
    feedImageUrl: "./assets/home-cache/fallback-educacao.jpg",
    sourceImageUrl: "./assets/home-cache/fallback-educacao.jpg",
    imageFocus: "center 34%"
  },
  "credenciamento-pareceristas-culturais": {
    slug: "credenciamento-pareceristas-culturais",
    title: "Cruzeiro do Sul abre credenciamento de pareceristas para projetos culturais",
    category: "Cultura e agenda",
    sourceName: "ac24horas",
    imageUrl: "./assets/home-cache/buzz-cultura-show.jpg",
    feedImageUrl: "./assets/home-cache/buzz-cultura-show.jpg",
    sourceImageUrl: "./assets/home-cache/buzz-cultura-show.jpg",
    imageFocus: "center 36%"
  },
  "ifac-professores-czs": {
    slug: "ifac-professores-czs",
    title: "Ifac abre selecao para professor substituto em Cruzeiro do Sul",
    category: "Educacao",
    sourceName: "ac24horas",
    imageUrl: "./assets/home-cache/fallback-educacao.jpg",
    feedImageUrl: "./assets/home-cache/fallback-educacao.jpg",
    sourceImageUrl: "./assets/home-cache/fallback-educacao.jpg",
    imageFocus: "center 30%"
  },
  "ifac-auxilio-cheia": {
    slug: "ifac-auxilio-cheia",
    title: "Ifac anuncia auxilio emergencial para estudantes afetados pela cheia",
    category: "Educacao",
    sourceName: "Jurua Online",
    imageUrl: "./assets/home-cache/fallback-educacao.jpg",
    feedImageUrl: "./assets/home-cache/fallback-educacao.jpg",
    sourceImageUrl: "./assets/home-cache/fallback-educacao.jpg",
    imageFocus: "center 34%"
  },
  "zequinha-assistencia-cheia": {
    slug: "zequinha-assistencia-cheia",
    title: "Zequinha intensifica assistencia as familias afetadas pela cheia",
    category: "Prefeitura e acoes",
    sourceName: "ac24horas",
    imageUrl: "./assets/home-cache/fallback-cheia.jpg",
    feedImageUrl: "./assets/home-cache/fallback-cheia.jpg",
    sourceImageUrl: "./assets/home-cache/fallback-cheia.jpg",
    imageFocus: "center 34%"
  },
  "agua-mineral-familias-cheia": {
    slug: "agua-mineral-familias-cheia",
    title: "Prefeitura distribui agua mineral para bairros atingidos",
    category: "Prefeitura e acoes",
    sourceName: "ac24horas",
    imageUrl: "./assets/home-cache/fallback-cheia.jpg",
    feedImageUrl: "./assets/home-cache/fallback-cheia.jpg",
    sourceImageUrl: "./assets/home-cache/fallback-cheia.jpg",
    imageFocus: "center 34%"
  },
  "saude-familias-abrigadas": {
    slug: "saude-familias-abrigadas",
    title: "Saude chega as familias que foram levadas para abrigos",
    category: "Social",
    sourceName: "ac24horas",
    imageUrl: "./assets/home-cache/fallback-cheia.jpg",
    feedImageUrl: "./assets/home-cache/fallback-cheia.jpg",
    sourceImageUrl: "./assets/home-cache/fallback-cheia.jpg",
    imageFocus: "center 34%"
  },
  "moradores-rotina-cheia": {
    slug: "moradores-rotina-cheia",
    title: "Moradores mantem a rotina mesmo com ruas e quintais alagados",
    category: "Social",
    sourceName: "ac24horas",
    imageUrl: "./assets/home-cache/fallback-cheia.jpg",
    feedImageUrl: "./assets/home-cache/fallback-cheia.jpg",
    sourceImageUrl: "./assets/home-cache/fallback-cheia.jpg",
    imageFocus: "center 34%"
  },
  "mais-12-mil-afetados": {
    slug: "mais-12-mil-afetados",
    title: "Mais de 12 mil pessoas afetadas e abertura do segundo abrigo",
    category: "Utilidade publica",
    sourceName: "ac24horas",
    imageUrl: "./assets/home-cache/fallback-cheia.jpg",
    feedImageUrl: "./assets/home-cache/fallback-cheia.jpg",
    sourceImageUrl: "./assets/home-cache/fallback-cheia.jpg",
    imageFocus: "center 34%"
  },
  "vazante-jurua-segue": {
    slug: "vazante-jurua-segue",
    title: "Vazante continua, mas centenas ainda seguem fora de casa",
    category: "Utilidade publica",
    sourceName: "ac24horas",
    imageUrl: "./assets/home-cache/fallback-cheia.jpg",
    feedImageUrl: "./assets/home-cache/fallback-cheia.jpg",
    sourceImageUrl: "./assets/home-cache/fallback-cheia.jpg",
    imageFocus: "center 34%"
  }
};

const getHomepageHydrationArticle = (slug = "") => {
  const normalizedSlug = String(slug || "").trim();
  if (!normalizedSlug) {
    return null;
  }

  return window.NEWS_MAP?.[normalizedSlug] || homepageStaticPreviewBySlug[normalizedSlug] || null;
};

const thumbTopicFallbacks = {
  "thumb-cheia": "Cheia",
  "thumb-saude": "Saude",
  "thumb-servico": "Servico",
  "thumb-politica": "Prefeitura",
  "thumb-social": "Social",
  "thumb-educacao": "Educacao",
  "thumb-educacao-alt": "Educacao",
  "thumb-cultura": "Cultura",
  "thumb-pascoa": "Pascoa",
  "thumb-policia": "Policia",
  "thumb-rede": "Rede",
  "thumb-alerta": "Utilidade"
};

const getSlugFromThumbNode = (node) => {
  const linkNode = node?.closest?.("a");
  const href = linkNode?.getAttribute("href") || node?.getAttribute?.("href") || "";
  const match = href.match(/slug=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : "";
};

const getThumbTopic = (thumbNode, article) => {
  const inlineLabel = thumbNode.querySelector("span")?.textContent?.trim();

  if (inlineLabel) {
    return inlineLabel;
  }

  if (article?.category) {
    return article.category;
  }

  const fallbackClass = [...thumbNode.classList].find((className) =>
    className.startsWith("thumb-")
  );

  return thumbTopicFallbacks[fallbackClass] || "Radar";
};

const HOTLINK_BLOCKED_IMAGE_HOSTS = ["awn.com"];

const isHotlinkBlockedImageUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return false;
  }

  try {
    const parsed = new URL(raw, window.location.href);
    const hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    return HOTLINK_BLOCKED_IMAGE_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`)
    );
  } catch (_error) {
    return /(^|\/\/)(?:www\.)?awn\.com\b/i.test(raw);
  }
};

const isTrackingPixelImageUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return false;
  }

  try {
    const parsed = new URL(raw, window.location.href);
    const hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    const pathname = parsed.pathname.toLowerCase();
    if (hostname === "agenciabrasil.ebc.com.br" && /\/ebc\.gif$/i.test(pathname)) {
      return true;
    }
  } catch (_error) {
    return /agenciabrasil\.ebc\.com\.br\/ebc\.gif(?:\?|$)/i.test(raw);
  }

  return false;
};

const normalizeLocalRuntimeAssetUrl = (value) => {
  const raw = String(value || "").trim();
  if (isLocalFileProtocol && /^\/(?:assets|data)\//i.test(raw)) {
    return `.${raw}`;
  }

  return raw;
};

const sanitizeImageUrl = (value) => {
  const raw = normalizeLocalRuntimeAssetUrl(value);
  if (!raw) {
    return "";
  }

  const cleaned = raw.replace(/'/g, "%27");
  if (isHotlinkBlockedImageUrl(cleaned) || isTrackingPixelImageUrl(cleaned)) {
    return "";
  }

  try {
    const parsed = new URL(cleaned, window.location.href);
    const path = decodeURIComponent(parsed.pathname || "").toLowerCase();
    if (/\.(?:pdf|docx?|xlsx?|pptx?|zip|rar|7z)(?:$|[?#])/i.test(`${path}${parsed.search || ""}`)) {
      return "";
    }
  } catch (_error) {
    if (/\.(?:pdf|docx?|xlsx?|pptx?|zip|rar|7z)(?:$|[?#])/i.test(cleaned.toLowerCase())) {
      return "";
    }
  }

  const needsProxy = /ac24horas\.com|jurua24horas\.com|cruzeirodosul\.net|cruzeirodosul\.ac\.gov\.br|static\.wixstatic\.com|agencia\.ac\.gov\.br|www\.amac\.com\.br|ifac\.edu\.br|portalacre\.com\.br/i.test(
    cleaned
  );

  if (!needsProxy || /images\.weserv\.nl/i.test(cleaned)) {
    return cleaned;
  }

  const withoutProtocol = cleaned.replace(/^https?:\/\//i, "");
  return `https://images.weserv.nl/?url=${encodeURIComponent(withoutProtocol)}`;
};

const isGeneratedNewsFallbackImageUrl = (value) =>
  /(?:^|\/)assets\/news-fallbacks\//i.test(String(value || ""));

const pushUniqueImageCandidate = (bucket, value) => {
  const normalized = String(value || "").trim();
  if (!normalized || bucket.includes(normalized)) {
    return;
  }

  bucket.push(normalized);
};

const buildImageLoadCandidates = (value) => {
  const raw = normalizeLocalRuntimeAssetUrl(value);
  if (!raw || isHotlinkBlockedImageUrl(raw) || isTrackingPixelImageUrl(raw)) {
    return [];
  }

  const directUrl = raw.replace(/'/g, "%27");
  const proxiedUrl = sanitizeImageUrl(directUrl);
  const candidates = [];

  if (!proxiedUrl) {
    return candidates;
  }

  if (proxiedUrl !== directUrl) {
    pushUniqueImageCandidate(candidates, proxiedUrl);
    return candidates;
  }

  pushUniqueImageCandidate(candidates, directUrl);

  return candidates;
};

const unwrapProxyImageUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  if (!/images\.weserv\.nl/i.test(raw)) {
    return raw;
  }

  try {
    const parsed = new URL(raw);
    const proxiedValue = parsed.searchParams.get("url") || "";
    return proxiedValue ? `https://${decodeURIComponent(proxiedValue)}` : raw;
  } catch (_error) {
    return raw;
  }
};

const getImageFingerprint = (value) => {
  const raw = unwrapProxyImageUrl(value);
  if (!raw) {
    return "";
  }

  try {
    const parsed = new URL(raw);
    return decodeURIComponent(`${parsed.hostname}${parsed.pathname}`)
      .toLowerCase()
      .replace(/-\d{2,4}x\d{2,4}(?=\.[a-z0-9]+$)/i, "")
      .replace(/\.(avif|gif|jpe?g|png|webp)$/i, "");
  } catch (_error) {
    return raw
      .toLowerCase()
      .replace(/^https?:\/\//i, "")
      .replace(/\?.*$/, "")
      .replace(/-\d{2,4}x\d{2,4}(?=\.[a-z0-9]+$)/i, "")
      .replace(/\.(avif|gif|jpe?g|png|webp)$/i, "");
  }
};

const buildOrderedImageSources = (article = {}, surface = "default") => {
  article = article || {};
  const inlineImageUrl = extractInlineArticleImage(article);
  const hasSourceToProbe = Boolean(article.sourceUrl || article.url || article.link);
  const sharedValues = [
    article.image,
    article.media?.imageUrl,
    article.media?.image,
    article.media?.src,
    article.media?.url
  ];

  const canonicalValues = [
    article.imageUrl,
    article.originalImageUrl,
    inlineImageUrl,
    article.feedImageUrl,
    article.originalFeedImageUrl,
    ...sharedValues,
    article.originalSourceImageUrl,
    article.sourceImageUrl
  ].filter((value) => !(hasSourceToProbe && isGeneratedNewsFallbackImageUrl(value)));

  if (surface === "hero") {
    return canonicalValues;
  }

  return canonicalValues;
};

const collectArticleImageCandidates = (article = {}, surface = "default") => {
  const candidates = [];
  const seenFingerprints = new Set();
  const seenUrls = new Set();
  const values = buildOrderedImageSources(article, surface);

  values.forEach((value) => {
    buildImageLoadCandidates(value).forEach((candidate) => {
      const normalizedCandidate = String(candidate || "").trim();
      const fingerprint = getImageFingerprint(normalizedCandidate);

      if (
        !normalizedCandidate ||
        seenUrls.has(normalizedCandidate) ||
        (fingerprint && seenFingerprints.has(fingerprint))
      ) {
        return;
      }

      seenUrls.add(normalizedCandidate);
      if (fingerprint) {
        seenFingerprints.add(fingerprint);
      }
      candidates.push(normalizedCandidate);
    });
  });

  return candidates;
};

const preloadFirstAvailableImage = (candidates = []) =>
  new Promise((resolve) => {
    const queue = [...candidates];

    const tryNext = () => {
      const candidate = queue.shift();
      if (!candidate) {
        resolve("");
        return;
      }

      const preloader = new Image();
      preloader.onload = () => resolve(candidate);
      preloader.onerror = tryNext;
      preloader.src = candidate;
    };

    tryNext();
  });

const extractImageUrlFromText = (value) => {
  const raw = String(value || "")
    .replace(/&quot;/gi, '"')
    .replace(/\\(["'])/g, "$1");
  if (!raw) {
    return "";
  }

  const directPatterns = [
    /data-large-file\s*=\s*["']([^"']+)["']/i,
    /data-medium-file\s*=\s*["']([^"']+)["']/i,
    /<img[^>]+src\s*=\s*["']([^"']+)["']/i,
    /src\s*=\s*["']([^"']+\.(?:avif|gif|jpe?g|png|webp)(?:\?[^"']*)?)["']/i
  ];

  for (const pattern of directPatterns) {
    const match = raw.match(pattern);
    if (match?.[1]) {
      return sanitizeImageUrl(
        match[1].replace(/\\\//g, "/").replace(/&amp;/gi, "&").trim()
      );
    }
  }

  const looseUrlMatch = raw.match(
    /https?:\/\/[^\s"'<>]+?\.(?:avif|gif|jpe?g|png|webp)(?:\?[^\s"'<>]*)?/i
  );
  if (looseUrlMatch?.[0]) {
    return sanitizeImageUrl(looseUrlMatch[0].replace(/&amp;/gi, "&"));
  }

  return "";
};

const extractInlineArticleImage = (article = {}) => {
  article = article || {};
  const candidates = [
    article.imageUrl,
    article.image,
    article.media?.imageUrl,
    article.media?.image,
    article.media?.src,
    article.media?.url,
    article.summary,
    article.lede,
    article.description,
    Array.isArray(article.body) ? article.body.join(" ") : "",
    Array.isArray(article.highlights) ? article.highlights.join(" ") : ""
  ];

  for (const candidate of candidates) {
    const imageUrl = extractImageUrlFromText(candidate);
    if (imageUrl) {
      return imageUrl;
    }
  }

  return "";
};

const isIllustrativeImage = (article) => {
  const imageUrl = String(article?.imageUrl || "");
  const credit = String(article?.imageCredit || "").toLowerCase();
  if (/images\.unsplash\.com/i.test(imageUrl)) return true;
  if (credit.includes("ilustrativa")) return true;
  return false;
};

const articleImageResolveCache = new Map();
const sourcePreviewImageResolveCache = new Map();

const canRequestProtectedPreviewImage = () =>
  Boolean(
    window.CATALOGO_ENABLE_PROTECTED_PREVIEWS === true ||
      document.body?.dataset?.allowProtectedPreviewImages === "true"
  );

const resolveSourcePreviewImage = async (article = {}) => {
  const sourceUrl = String(article.sourceUrl || article.url || article.link || "").trim();

  if (!sourceUrl) {
    return "";
  }

  if (!canRequestProtectedPreviewImage()) {
    return "";
  }

  if (!sourcePreviewImageResolveCache.has(sourceUrl)) {
    sourcePreviewImageResolveCache.set(
      sourceUrl,
      requestApiJson(`/api/preview-image?url=${encodeURIComponent(sourceUrl)}`, {
        method: "GET"
      })
        .then((payload) => sanitizeImageUrl(payload?.imageUrl || ""))
        .catch(() => "")
    );
  }

  return sourcePreviewImageResolveCache.get(sourceUrl) || "";
};

const resolveArticleImage = async (article, surface = "default") => {
  if (!article) return "";
  const candidates = collectArticleImageCandidates(article, surface).filter(
    (candidate) => !isIllustrativeImage({ ...article, imageUrl: candidate })
  );

  const sourceUrl = String(article.sourceUrl || article.url || article.link || "").trim();
  const cacheKey = `${surface}::${candidates.join("||")}::${sourceUrl}`;
  if (!articleImageResolveCache.has(cacheKey)) {
    articleImageResolveCache.set(
      cacheKey,
      (async () => {
        const directImage = candidates.length ? await preloadFirstAvailableImage(candidates) : "";
        if (directImage) {
          return directImage;
        }

        const sourcePreviewImage = await resolveSourcePreviewImage(article);
        if (!sourcePreviewImage) {
          return "";
        }

        return (await preloadFirstAvailableImage(buildImageLoadCandidates(sourcePreviewImage))) || "";
      })()
    );
  }

  return articleImageResolveCache.get(cacheKey) || "";
};

const paintSurfaceImage = (node, url, position = "center", size = "cover") => {
  if (!node || !url) {
    return;
  }
  node.style.setProperty("--bg-image", `url('${url}')`);
  node.style.setProperty("--news-photo", `url('${url}')`);
  node.style.setProperty("--bg-position", position);
  node.style.setProperty("--bg-size", size);
  node.style.setProperty("background-image", `url('${url}')`, "important");
  node.style.setProperty("background-position", position, "important");
  node.style.setProperty("background-size", size, "important");
  node.style.setProperty("background-repeat", "no-repeat", "important");
};

const thumbLightingCache = new Map();

const clampColorChannel = (value = 0) => Math.min(255, Math.max(0, Math.round(value)));

const buildThumbRgb = (red = 0, green = 0, blue = 0) =>
  `rgb(${clampColorChannel(red)}, ${clampColorChannel(green)}, ${clampColorChannel(blue)})`;

const buildThumbRgba = (red = 0, green = 0, blue = 0, alpha = 1) =>
  `rgba(${clampColorChannel(red)}, ${clampColorChannel(green)}, ${clampColorChannel(blue)}, ${alpha})`;

const buildFallbackThumbLighting = (article = {}, url = "") => {
  const seedSource = String(url || article.slug || article.title || article.category || "thumb");
  let hash = 0;

  for (const char of seedSource) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  const red = 76 + (hash % 104);
  const green = 94 + ((hash >> 7) % 92);
  const blue = 124 + ((hash >> 13) % 108);

  return {
    accent1: buildThumbRgb(red, green, blue),
    accent2: buildThumbRgb(red * 0.34, green * 0.36, blue * 0.44),
    glow: buildThumbRgba(red * 1.12, green * 1.08, blue * 1.04, 0.48),
    highlight: buildThumbRgba(255, 255, 255, 0.18),
    shadow: buildThumbRgba(red * 0.26, green * 0.22, blue * 0.3, 0.42)
  };
};

const canSampleImagePixels = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) {
    return false;
  }

  if (/^(?:data:|blob:)/i.test(raw)) {
    return true;
  }

  try {
    const parsed = new URL(raw, window.location.href);
    return parsed.origin === window.location.origin;
  } catch (_error) {
    return !/^https?:\/\//i.test(raw);
  }
};

const extractThumbLighting = (url, article = {}) => {
  const cacheKey = String(url || "").trim();
  const fallback = buildFallbackThumbLighting(article, cacheKey);

  if (!cacheKey || !canSampleImagePixels(cacheKey)) {
    return Promise.resolve(fallback);
  }

  if (!thumbLightingCache.has(cacheKey)) {
    thumbLightingCache.set(
      cacheKey,
      new Promise((resolve) => {
        const sample = new Image();
        sample.crossOrigin = "anonymous";
        sample.referrerPolicy = "no-referrer";

        sample.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d", { willReadFrequently: true });

            if (!context) {
              resolve(fallback);
              return;
            }

            const sampleSize = 18;
            canvas.width = sampleSize;
            canvas.height = sampleSize;
            context.drawImage(sample, 0, 0, sampleSize, sampleSize);

            const { data } = context.getImageData(0, 0, sampleSize, sampleSize);
            let totalWeight = 0;
            let red = 0;
            let green = 0;
            let blue = 0;
            let brightest = { red: 255, green: 244, blue: 194, luminance: 0 };

            for (let index = 0; index < data.length; index += 4) {
              const alpha = data[index + 3];
              if (alpha < 48) {
                continue;
              }

              const pixelRed = data[index];
              const pixelGreen = data[index + 1];
              const pixelBlue = data[index + 2];
              const luminance =
                pixelRed * 0.2126 + pixelGreen * 0.7152 + pixelBlue * 0.0722;
              const weight = 0.35 + luminance / 255;

              totalWeight += weight;
              red += pixelRed * weight;
              green += pixelGreen * weight;
              blue += pixelBlue * weight;

              if (luminance >= brightest.luminance) {
                brightest = {
                  red: pixelRed,
                  green: pixelGreen,
                  blue: pixelBlue,
                  luminance
                };
              }
            }

            if (!totalWeight) {
              resolve(fallback);
              return;
            }

            const avgRed = red / totalWeight;
            const avgGreen = green / totalWeight;
            const avgBlue = blue / totalWeight;

            resolve({
              accent1: buildThumbRgb(avgRed * 1.06, avgGreen * 1.03, avgBlue * 1.04),
              accent2: buildThumbRgb(avgRed * 0.34, avgGreen * 0.31, avgBlue * 0.4),
              glow: buildThumbRgba(
                brightest.red * 1.08,
                brightest.green * 1.06,
                brightest.blue * 1.02,
                0.52
              ),
              highlight: buildThumbRgba(
                Math.max(232, brightest.red),
                Math.max(232, brightest.green),
                Math.max(228, brightest.blue),
                0.2
              ),
              shadow: buildThumbRgba(avgRed * 0.2, avgGreen * 0.18, avgBlue * 0.24, 0.42)
            });
          } catch (_error) {
            resolve(fallback);
          }
        };

        sample.onerror = () => resolve(fallback);
        sample.src = cacheKey;
      })
    );
  }

  return thumbLightingCache.get(cacheKey) || Promise.resolve(fallback);
};

const applyThumbPhotoLighting = (node, article, url) => {
  if (!node || !url) {
    return;
  }

  const requestToken = `${article?.slug || article?.id || article?.sourceUrl || url}`;
  node.dataset.thumbLightingToken = requestToken;

  extractThumbLighting(url, article).then((lighting) => {
    if (!lighting || node.dataset.thumbLightingToken !== requestToken) {
      return;
    }

    node.style.setProperty("--thumb-accent-1", lighting.accent1);
    node.style.setProperty("--thumb-accent-2", lighting.accent2);
    node.style.setProperty("--thumb-glow", lighting.glow);
    node.style.setProperty("--thumb-photo-glow", lighting.glow);
    node.style.setProperty("--thumb-photo-highlight", lighting.highlight);
    node.style.setProperty("--thumb-photo-shadow", lighting.shadow);
  });
};

const paintMosaicImageElement = (panelNode, url, position = "center 35%") => {
  if (!panelNode || !url) {
    return;
  }

  const mosaicPhoto = panelNode.querySelector(".mosaic-photo");
  if (mosaicPhoto) {
    mosaicPhoto.remove();
  }

  panelNode.dataset.imageUrl = url;
  panelNode.dataset.sourceImage = url;
  panelNode.style.setProperty("--news-photo", `url('${url}')`);
  paintSurfaceImage(panelNode, url, position, "cover");
  panelNode.classList.add("has-photo", "has-real-photo");
};

const articleImageFocusOverridesBySlug = {
  "stf-decide-que-piso-nacional-deve-ser-pago-a-professores-temporarios": "62% 12%",
  "governo-avanca-na-regularizacao-fundiaria-e-conclui-primeira-etapa-do-programa-em-assis-brasil":
    "74% 32%",
  "acre-disputa-campeonato-regional-de-bocha-com-14-paratletas": "78% 43%",
  "jordao-celebra-34-anos-com-show-de-evoney-fernandes": "40% 38%",
  "com-presenca-da-familia-mario-sergio-toma-posse-no-tribunal-de-contas-do-acre": "58% 42%",
  "academia-acreana-de-letras-reune-mulheres-de-poder-em-primeira-roda-de-conversa-de-2026":
    "30% 58%",
  "socorro-propoe-jornada-especial-para-professores-em-tratamento-de-saude": "49% 26%",
  "prefeito-decreta-emergencia-e-anuncia-auxilio-a-familias-atingidas-por-enxurradas": "78% 38%",
  "traficante-foge-da-policia-e-deixa-esposa-com-bebe-recem-nascido-para-ser-presa": "58% 68%",
  "fundhacre-recebe-treinamento-da-fiocruz-para-diagnostico-molecular-de-leishmaniose": "78% 30%",
  "fundhacre-realiza-quinto-transplante-de-tecido-osseo-e-amplia-oferta-de-alta-complexidade-no-acre":
    "45% 22%",
  "acre-alcanca-o-segundo-lugar-no-ranking-nacional-de-matriculas-de-ensino-tecnico-articulado-com-o-ensino-medio":
    "38% 26%",
  "governo-do-acre-capacita-orgaos-do-executivo-estadual-sobre-planos-de-integridade": "60% 40%",
  "governo-do-acre-amplia-acesso-a-identidade-para-indigenas-com-acao-da-policia-civil-na-casai":
    "58% 16%",
  "morre-o-pai-de-ana-paula-renault-a-dois-dias-da-final-do-bbb-26": "center 18%",
  "com-um-a-menos-palmeiras-segura-athletico-pr-e-vence-pelo-brasileirao": "center 22%",
  "com-falha-de-lyanco-coritiba-vence-atletico-mg-no-campeonato-brasileiro": "center 22%",
  "internacional-perde-para-o-mirassol-e-se-aproxima-do-z-4-do-brasileirao": "center 22%",
  "paratletas-acreanos-conquistam-9-medalhas-no-regional-de-bocha": "center 24%",
  "brasileia-entrega-premiacao-aos-vencedores-do-2-campeonato-de-pesca": "center 24%",
  "mailza-e-gladson-se-encontram-em-manaus-para-reuniao-de-alinhamento-politico": "center 20%",
  "presidentes-de-bairros-denunciam-obra-irregular-e-mobilizam-embargo": "center 20%",
  "eua-ameacam-peru-apos-governo-sugerir-pausa-em-compra-de-avioes-de-combate": "center 18%",
  "denuncia-de-maus-tratos-contra-vendedor-de-bananas-termina-em-reconhecimento-de-ato-de-cuidado-em-rio-branco":
    "center 18%",
  "pista-goleia-o-ame-no-campeonato-estadual-de-futsal-sub-15": "center 22%",
  "seguranca-publica-intensifica-acoes-em-comunidades-indigenas-e-fortalece-seguranca-comunitaria-em-santa-rosa-do-purus":
    "center 24%",
  "governo-e-instituicoes-parceiras-certificam-40-alunos-na-1-etapa-do-projeto-pao-na-estrada":
    "center 22%",
  "crianca-desaparece-apos-naufragio-no-rio-purus-bombeiros-fazem-buscas": "center 18%",
  "com-foco-na-prevencao-prefeitura-de-mancio-lima-realiza-acao-de-saude-no-bairro-iracema":
    "center 22%",
  "bittar-sobre-ato-de-jv-nao-tem-votos-para-ganhar-de-mim-e-o-caminho-dele-e-o-tapetao": "center 30%",
  "esquenta-junino-2026-abre-temporada-cultural-com-quadrilhas-no-acre": "center 30%",
  "jorge-viana-aciona-stf-e-flavio-dino-investiga-emendas-de-bittar-a-santa-casa-e-obras-de-infraestrutura":
    "center 30%",
  "mais-de-200-inqueritos-foram-instaurados-na-delegacia-da-mulher-em-cruzeiro-do-sul": "center 30%",
  "circuito-country-em-epitaciolandia-tera-controle-de-acesso-de-criancas-e-adolescentes": "center 30%",
  "moradores-indigenas-cavam-estrada-para-escapar-da-lama-em-ramal-de-assis-brasil": "center 30%",
  "lula-preve-judicializacao-caso-desoneracao-seja-incluida-em-fim-da-6-215-1": "center 30%",
  "trump-diz-que-eua-tem-8220-controle-total-8221-sobre-o-estreito-de-ormuz": "center 30%",
  "prefeitura-de-cruzeiro-do-sul-realiza-4-edicao-do-programa-de-aquisicao-de-alimentos-com-investimento-de-r-225-mil":
    "center 30%",
  "voluntarios-da-adventist-health-atendem-milhares-de-pessoas-em-voluntariado-nas-filipinas":
    "center 30%",
  "edital-de-convocacao-da-assembleia-geral-extraordinaria-8211-coopertransgua": "center 30%",
  "edital-de-convocacao-de-assembleia-geral-ordinaria-8211-coopeguajara": "center 30%",
  "edital-de-convocacao-8211-assembleia-de-ratificacao-da-fundacao-do-sindicato-dos-trabalhadores-em-transporte-aquaviario-do-acre":
    "center 30%",
  "edital-de-convocacao-8211-assembleia-geral-de-eleicao-e-posse": "center 30%",
  "edital-de-eleicao-e-posse-8211-ascak": "center 30%",
  "exposicao-mostra-o-olhar-afro-brasileiro-da-fotografa-lita-cerqueira": "center 30%",
  "justica-nega-pedido-de-careca-do-inss-para-barrar-apelido": "center 30%",
  "sistema-prisional-de-sao-paulo-registra-uma-morte-a-cada-19-horas": "center 30%",
  "lula-qualidade-do-agro-e-essencial-para-ampliar-exportacoes": "center 30%",
  "stf-determina-atualizacao-anual-do-valor-do-minimo-existencial": "center 30%",
  "estado-de-sao-paulo-tem-mais-duas-mortes-por-febre-amarela": "center 30%",
  "enviado-de-trump-sugere-que-italia-substitua-ira-na-copa-do-mundo": "center 30%"
};

const articlePersonFocusPattern =
  /\b(rosto|face|pai|mae|mãe|filho|filha|crianca|criança|jovem|mulher|homem|prefeito|prefeita|governador|governadora|senador|senadora|deputado|deputada|presidente|atleta|jogador|jogadora|paratleta|cantor|cantora|ator|atriz|influenciadora|influenciador|motociclista|suspeito|vendedor|aluno|alunos|familia|família)\b/;
const articleGroupFocusPattern =
  /\b(grupo|equipe|time|selecao|seleção|cerimonia|cerimônia|premiacao|premiação|reuniao|reunião|evento|acao|ação|campeonato|jogos|comunidades|indigenas|indígenas|alunos|familias|famílias)\b/;
const articlePortraitFocusPattern = /\b(retrato|posse|entrevista|discurso|falou|reuniao|reunião|alinhamento)\b/;

const mosaicImageFocusOverridesBySlug = {
  "ciclista-acreano-chega-no-panama-para-disputa-do-sul-americano-da-juventude": "center 10%",
  "governadora-mailza-assis-empossa-novo-delegado-geral-e-anuncia-concurso-publico-da-policia-civil":
    "40% 18%",
  "bolsa-interrompe-sequencia-de-11-altas-e-cai-0-46": "center 46%"
};

const resolveArticleImageFocus = (article = {}, fallback = "center") => {
  article = article || {};
  const manualFocus = String(article.imageFocus || "").trim();
  if (manualFocus) {
    return manualFocus;
  }

  const slug = String(article.slug || "").trim();
  if (slug && articleImageFocusOverridesBySlug[slug]) {
    return articleImageFocusOverridesBySlug[slug];
  }

  const haystack = normalizeText(
    [article.title, article.lede, article.summary, article.category, article.sourceName].join(" ")
  );
  if (articlePortraitFocusPattern.test(haystack)) {
    return "center 18%";
  }
  if (articlePersonFocusPattern.test(haystack) && articleGroupFocusPattern.test(haystack)) {
    return "center 22%";
  }
  if (articlePersonFocusPattern.test(haystack)) {
    return "center 20%";
  }

  return fallback;
};

const mosaicPersonFocusPattern =
  /\b(ciclista|atleta|jogador|jogadora|governador|governadora|prefeito|prefeita|senador|senadora|deputado|deputada|delegado|delegada|secretario|secretaria|ministro|ministra|presidente|artista|cantor|cantora|ator|atriz|apresentador|apresentadora|treinador|treinadora|empresario|empresaria|medico|medica|juiz|juiza|estudante|aluno|aluna|entrevista)\b/;
const mosaicGroupScenePattern =
  /\b(posse|cerimonia|solenidade|evento|auditorio|reuniao|encontro|coletiva|equipe|time|selecao|colegio|grupo|plateia)\b/;
const mosaicLandscapePattern =
  /\b(bolsa|mercado|dolar|cidade|rio|ponte|bairro|rodovia|estrada|enchente|cheia|alag|obra|calcadao|orcamento|salario|superavit|petroleo|economia|feira|fachada|predio)\b/;

const getMosaicStorySignals = (article = {}) => {
  const text = normalizeText(
    [
      article.title,
      article.sourceLabel,
      article.lede,
      article.summary,
      article.category,
      article.sourceName
    ].join(" ")
  );

  return {
    text,
    prefersFace: mosaicPersonFocusPattern.test(text),
    isGroupScene: mosaicGroupScenePattern.test(text),
    isLandscape: mosaicLandscapePattern.test(text)
  };
};

const inferMosaicImageFocus = (article = {}, panelNode) => {
  const resolvedFocus = resolveArticleImageFocus(article, "");
  if (resolvedFocus) {
    return normalizeHeroSafeFocusPosition(resolvedFocus, {
      hasPeople: getMosaicStorySignals(article).prefersFace
    });
  }

  const slug = String(article.slug || "").trim();
  if (slug && mosaicImageFocusOverridesBySlug[slug]) {
    return mosaicImageFocusOverridesBySlug[slug];
  }

  const isSideCard = Boolean(panelNode?.classList?.contains("side"));
  const { prefersFace, isGroupScene, isLandscape } = getMosaicStorySignals(article);

  if (prefersFace && isGroupScene) {
    return isSideCard ? "42% 30%" : "40% 34%";
  }

  if (prefersFace) {
    return isSideCard ? "center 30%" : "center 34%";
  }

  if (isLandscape) {
    return isSideCard ? "center 46%" : "center 34%";
  }

  return isSideCard ? "center 28%" : "center 30%";
};

const inferMosaicLayoutMode = (article = {}, panelNode) => {
  const manualLayout = String(article.imageLayout || article.mosaicLayout || "").trim();
  if (manualLayout) {
    return manualLayout;
  }

  const isMainCard = Boolean(panelNode?.classList?.contains("main"));
  const { prefersFace, isGroupScene, isLandscape } = getMosaicStorySignals(article);

  if (prefersFace && isGroupScene) {
    return "group-safe";
  }

  if (isMainCard && prefersFace && !isLandscape) {
    return "portrait-safe";
  }

  return "default";
};

let thumbImageRequestSequence = 0;

const getThumbFallbackImageUrl = (thumbNode) => {
  const photoCard = thumbNode?.closest?.(".news-card, .archive-card, .live-feed-card, .feed-card");
  const fallbackCandidates = [
    thumbNode?.dataset?.imageUrl,
    thumbNode?.dataset?.sourceImage,
    photoCard?.dataset?.imageUrl,
    photoCard?.dataset?.sourceImage
  ];

  for (const candidate of fallbackCandidates) {
    const safeCandidate = sanitizeImageUrl(candidate);
    if (safeCandidate) {
      return safeCandidate;
    }
  }

  const inlineBackground =
    thumbNode?.style?.getPropertyValue("--bg-image") ||
    thumbNode?.style?.getPropertyValue("--news-photo") ||
    photoCard?.style?.getPropertyValue("--news-photo") ||
    "";
  const extractedInlineUrl = extractImageUrlFromText(inlineBackground);
  if (extractedInlineUrl) {
    return extractedInlineUrl;
  }

  const cssBackground =
    thumbNode?.style?.backgroundImage ||
    photoCard?.style?.backgroundImage ||
    "";
  return extractImageUrlFromText(cssBackground);
};

const applyThumbImage = (thumbNode, article) => {
  if (!thumbNode) {
    return;
  }

  const photoCard = thumbNode.closest(".news-card, .archive-card, .live-feed-card, .feed-card");
  const immediateImageUrl = sanitizeImageUrl(
    getArticleDisplayImageUrl(article) || getThumbFallbackImageUrl(thumbNode)
  );
  const immediateFocus = resolveArticleImageFocus(article, "center");
  const immediateFit = article?.imageFit || "cover";

  if (immediateImageUrl) {
    paintSurfaceImage(thumbNode, immediateImageUrl, immediateFocus, immediateFit);
    thumbNode.dataset.imageUrl = immediateImageUrl;
    thumbNode.dataset.sourceImage = immediateImageUrl;
    thumbNode.classList.add("has-photo", "has-real-photo");
    applyThumbPhotoLighting(thumbNode, article, immediateImageUrl);

    if (photoCard) {
      photoCard.classList.add("news-photo-fixed");
      photoCard.dataset.imageUrl = immediateImageUrl;
      photoCard.dataset.sourceImage = immediateImageUrl;
      photoCard.style.setProperty("--news-photo", `url('${immediateImageUrl}')`);
    }
  } else {
    clearSurfaceImage(thumbNode);
  }
  const requestId = String(++thumbImageRequestSequence);
  thumbNode.dataset.thumbImageRequest = requestId;

  if (photoCard && !immediateImageUrl) {
    photoCard.classList.remove("news-photo-fixed");
    delete photoCard.dataset.imageUrl;
    delete photoCard.dataset.sourceImage;
    photoCard.style.removeProperty("--news-photo");
  }

  if (!article) {
    return;
  }

  if (immediateImageUrl) {
    return;
  }

  resolveArticleImage(article).then((safeUrl) => {
    if (!safeUrl || thumbNode.dataset.thumbImageRequest !== requestId) return;
    paintSurfaceImage(
      thumbNode,
      safeUrl,
      resolveArticleImageFocus(article, "center"),
      article?.imageFit || "cover"
    );
    thumbNode.dataset.imageUrl = safeUrl;
    thumbNode.dataset.sourceImage = safeUrl;
    thumbNode.classList.add("has-photo", "has-real-photo");
    applyThumbPhotoLighting(thumbNode, article, safeUrl);

    if (photoCard) {
      photoCard.classList.add("news-photo-fixed");
      photoCard.dataset.imageUrl = safeUrl;
      photoCard.dataset.sourceImage = safeUrl;
      photoCard.style.setProperty("--news-photo", `url('${safeUrl}')`);
    }
  });
};

const clearSurfaceImage = (node) => {
  if (!node) {
    return;
  }

  const mosaicPhoto = node.querySelector?.(".mosaic-photo");
  if (mosaicPhoto) {
    mosaicPhoto.remove();
  }

  node.classList.remove("has-photo");
  node.classList.remove("has-real-photo");
  delete node.dataset.imageUrl;
  delete node.dataset.sourceImage;
  node.style.removeProperty("--bg-image");
  node.style.removeProperty("--bg-position");
  node.style.removeProperty("--bg-size");
  node.style.removeProperty("--news-photo");
  node.style.removeProperty("--thumb-accent-1");
  node.style.removeProperty("--thumb-accent-2");
  node.style.removeProperty("--thumb-glow");
  node.style.removeProperty("--thumb-photo-glow");
  node.style.removeProperty("--thumb-photo-highlight");
  node.style.removeProperty("--thumb-photo-shadow");
  delete node.dataset.thumbLightingToken;
  delete node.dataset.thumbImageRequest;
  node.style.removeProperty("background-image");
  node.style.removeProperty("background-position");
  node.style.removeProperty("background-size");
  node.style.removeProperty("background-repeat");
};

let mosaicImageRequestSequence = 0;

const applyMosaicImage = (panelNode, article) => {
  if (!panelNode) {
    return;
  }

  const requestId = String(++mosaicImageRequestSequence);
  panelNode.dataset.mosaicImageRequest = requestId;
  clearSurfaceImage(panelNode);

  resolveArticleImage(article, "hero").then((safeUrl) => {
    if (!safeUrl || panelNode.dataset.mosaicImageRequest !== requestId) return;
    const layoutMode = inferMosaicLayoutMode(article, panelNode);
    const imageFit = "contain";
    panelNode.dataset.mosaicLayout = layoutMode;
    panelNode.dataset.imageFit = imageFit;
    paintSurfaceImage(panelNode, safeUrl, "center", imageFit);
    panelNode.dataset.imageUrl = safeUrl;
    panelNode.dataset.sourceImage = safeUrl;
    panelNode.style.setProperty("--news-photo", `url('${safeUrl}')`);
    panelNode.classList.add("has-photo", "has-real-photo");
  });
};

const hydrateStaticThumbs = (newsMap = {}) => {
  thumbNodes.forEach((thumbNode) => {
    if (thumbNode.closest(".caderno-card[data-caderno-static='true']")) {
      return;
    }

    const slug = getSlugFromThumbNode(thumbNode);
    const article = newsMap?.[slug];
    thumbNode.dataset.topic = getThumbTopic(thumbNode, article);
    applyThumbImage(thumbNode, article);
  });
};

if (window.NEWS_DATA) {
  hydrateStaticThumbs(
    {
      ...homepageStaticPreviewBySlug,
      ...Object.fromEntries(window.NEWS_DATA.map((item) => [item.slug, item]))
    }
  );
}

const formatSplashStamp = () => {
  const now = new Date();
  const dateText = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    timeZone: localeTimeZone
  })
    .format(now)
    .replace(/\.$/, "");
  const timeText = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: localeTimeZone
  }).format(now);

  return `${dateText.charAt(0).toUpperCase()}${dateText.slice(1)} • ${timeText}`;
};

const setupSplashExperience = () => {
  document.body.classList.remove("mobile-simple-shell", "mobile-page-shift");

  if (document.body.classList.contains("editorial-home") && !mobileIntroMedia?.matches) {
    try {
      sessionStorage.setItem(splashStorageKey, "1");
      sessionStorage.removeItem(skipHomeIntroKey);
    } catch (_error) {
      // ignore session storage failures
    }

    document.body.classList.add("site-loaded");
    return;
  }

  if (mobileIntroMedia?.matches) {
    document.body.classList.add("mobile-simple-shell");
    window.setTimeout(() => {
      document.body.classList.add("site-loaded", "mobile-intro-ready");
      document.body.classList.remove("mobile-simple-shell");
    }, 180);
    return;
  }

  if (performanceLiteMode) {
    document.body.classList.add("site-loaded");
    return;
  }

  if (shouldSkipHomeIntro) {
    try {
      sessionStorage.setItem(splashStorageKey, "1");
      sessionStorage.removeItem(skipHomeIntroKey);
    } catch (_error) {
      // ignore session storage failures
    }

    document.body.classList.add("site-loaded");
    return;
  }

  if (!splashRoot) {
    document.body.classList.add("site-loaded");
    return;
  }

  if (splashDate) {
    splashDate.textContent = formatSplashStamp();
  }

  let splashReleased = false;
  let messageIndex = 0;
  let messageTimer = 0;
  let hasSeenSplash = false;

  try {
    hasSeenSplash = sessionStorage.getItem(splashStorageKey) === "1";
  } catch (_error) {
    hasSeenSplash = false;
  }

  splashRoot.classList.toggle("is-repeat-visit", hasSeenSplash);

  if (splashStatus) {
    splashStatus.textContent = splashMessages[messageIndex];

    if (!splashMotionQuery.matches) {
      messageTimer = window.setInterval(() => {
        messageIndex = (messageIndex + 1) % splashMessages.length;
        splashStatus.textContent = splashMessages[messageIndex];
      }, 760);
    }
  }

  const releaseSplash = () => {
    if (splashReleased) {
      return;
    }

    splashReleased = true;

    if (messageTimer) {
      window.clearInterval(messageTimer);
    }

    requestAnimationFrame(() => {
      document.body.classList.add("site-loaded");
    });

    try {
      sessionStorage.setItem(splashStorageKey, "1");
    } catch (_error) {
      // ignore session storage failures
    }
  };

  const currentTime =
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();
  const elapsed = currentTime - splashBootStartedAt;
  const minimumDuration = splashMotionQuery.matches ? 100 : hasSeenSplash ? 220 : 1100;
  const remaining = Math.max(100, minimumDuration - elapsed);

  window.setTimeout(releaseSplash, remaining);
};

const clearMobilePageTransitionState = () => {
  document.body.classList.remove("mobile-simple-shell", "mobile-page-shift");
  document.body.classList.add("site-loaded");
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupSplashExperience, { once: true });
} else {
  setupSplashExperience();
}

window.addEventListener("pageshow", clearMobilePageTransitionState);
window.addEventListener("focus", clearMobilePageTransitionState);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    clearMobilePageTransitionState();
  }
});

const buildTickerChip = (phrase) => {
  const chip = document.createElement("article");
  chip.className = "ticker-chip";
  chip.innerHTML = `
    <span class="ticker-chip-label"></span>
    <span class="ticker-chip-text"></span>
    <span class="ticker-chip-caret" aria-hidden="true"></span>
  `;
  setTickerChipPhrase(chip, phrase);
  return chip;
};

const setTickerChipPhrase = (chip, phrase, { type = false } = {}) => {
  if (!chip || !phrase) {
    return;
  }

  const labelNode = chip.querySelector(".ticker-chip-label");
  const textNode = chip.querySelector(".ticker-chip-text");
  const nextLabel = String(phrase.label || "Ao vivo").trim();
  const nextText = String(phrase.text || "").trim();

  if (chip._typingInterval) {
    window.clearInterval(chip._typingInterval);
    chip._typingInterval = 0;
  }

  if (chip._typingDoneTimer) {
    window.clearTimeout(chip._typingDoneTimer);
    chip._typingDoneTimer = 0;
  }

  if (labelNode) {
    labelNode.textContent = nextLabel;
  }

  if (!textNode) {
    return;
  }

  chip.classList.remove("is-typing");

  textNode.textContent = nextText;
};

const initializeLiveTicker = () => {
  if (!tickerLiveGrid) {
    return;
  }

  clearLiveTickerRuntime();

  const laneNodes = [...tickerLiveGrid.querySelectorAll(".ticker-lane")].slice(0, 1);
  const activeTickerPhrasePool = getTickerPhrasePool();

  if (!laneNodes.length || activeTickerPhrasePool.length === 0) {
    return;
  }

  const isDesktopStaticTicker = tickerDesktopStaticMedia?.matches === true;
  const phrasesPerLane = isDesktopStaticTicker ? 4 : 10;
  let phraseCursor = 0;
  const nextPhrase = () => {
    const phrase = activeTickerPhrasePool[phraseCursor % activeTickerPhrasePool.length];
    phraseCursor += 1;
    return phrase;
  };

  const lanes = laneNodes.map((laneNode, laneIndex) => {
    const track = document.createElement("div");
    track.className = "ticker-track";
    track.style.setProperty("--ticker-duration", "34s");

    const primarySegment = document.createElement("div");
    primarySegment.className = "ticker-segment";

    const cloneSegment = document.createElement("div");
    cloneSegment.className = "ticker-segment";
    cloneSegment.setAttribute("aria-hidden", "true");

    const primaryChips = [];
    const cloneChips = [];

    for (let chipIndex = 0; chipIndex < phrasesPerLane; chipIndex += 1) {
      const phrase = nextPhrase();
      const primaryChip = buildTickerChip(phrase);
      const cloneChip = buildTickerChip(phrase);

      cloneChip.classList.add("is-clone");
      primarySegment.appendChild(primaryChip);
      cloneSegment.appendChild(cloneChip);
      primaryChips.push(primaryChip);
      cloneChips.push(cloneChip);
    }

    track.append(primarySegment, cloneSegment);
    laneNode.replaceChildren(track);

    return {
      primaryChips,
      cloneChips,
      rotationIndex: laneIndex % phrasesPerLane
    };
  });

  if (splashMotionQuery.matches) {
    return;
  }

  lanes.forEach((lane, laneIndex) => {
    const cycleLane = () => {
      lane.rotationIndex = (lane.rotationIndex + 1) % lane.primaryChips.length;
      const phrase = nextPhrase();
      setTickerChipPhrase(lane.primaryChips[lane.rotationIndex], phrase, { type: true });
      setTickerChipPhrase(lane.cloneChips[lane.rotationIndex], phrase);
    };

    const timeoutId = window.setTimeout(() => {
      cycleLane();
      const intervalId = window.setInterval(cycleLane, 2600 + laneIndex * 240);
      tickerRuntime.timerIds.push(intervalId);
    }, 1100 + laneIndex * 320);

    tickerRuntime.timerIds.push(timeoutId);
  });
};

const guideMessages = [
  "Comece pelo Radar para ver o que mexeu com Cruzeiro do Sul nesta semana.",
  "No Arquivo de Abril você revê o mês até agora sem perder a linha do tempo.",
  "Festas & Social reúne clima de Páscoa, cultura e buzz público de rede.",
  "Pedidos de revisão ou remoção passam por análise manual da equipe."
];

if (!performanceLiteMode && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".reveal").forEach((node) => revealObserver.observe(node));
} else {
  document.querySelectorAll(".reveal").forEach((node) => node.classList.add("active"));
}

const motionPanelSelector = [
  ".mosaic-item",
  ".news-card",
  ".archive-card",
  ".social-card",
  ".caderno-card",
  ".sidebar-widget",
  ".side-card",
  ".ad-unit",
  ".membership-card",
  ".projection-card",
  ".feature-card",
  ".comment-card",
  ".signal-band"
].join(", ");

const motionMediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

const bindInteractivePanel = (panel) => {
  if (!panel || panel.dataset.motionBound === "true") {
    return;
  }

  panel.dataset.motionBound = "true";
  panel.classList.add("interactive-panel");

  const hasPhotoSurface =
    panel.matches(".news-card, .archive-card, .mosaic-item, .trending-card, .month-card") ||
    panel.querySelector(".news-thumb, .mini-thumb, .trend-photo, .month-photo");

  if (hasPhotoSurface) {
    return;
  }

  const resetPanel = () => {
    panel.style.transform = "";
  };

  panel.addEventListener("pointermove", (event) => {
    if (!motionMediaQuery.matches) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    const offsetX = (event.clientX - rect.left) / rect.width;
    const offsetY = (event.clientY - rect.top) / rect.height;
    const rotateY = (offsetX - 0.5) * 7;
    const rotateX = (0.5 - offsetY) * 5;

    panel.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });

  panel.addEventListener("pointerleave", resetPanel);
  panel.addEventListener("pointerup", resetPanel);
};

const registerInteractivePanels = (root = document) => {
  if (performanceLiteMode || !root) {
    return;
  }

  const panels = [];

  if (root.matches?.(motionPanelSelector)) {
    panels.push(root);
  }

  const nestedPanels = root.querySelectorAll
    ? [...root.querySelectorAll(motionPanelSelector)]
    : [];

  panels.push(...nestedPanels);
  panels.forEach(bindInteractivePanel);
};

registerInteractivePanels();

const radarGuideThemes = {
  todos: {
    label: "Tudo",
    text: "Uma leitura rápida do que mais importa no momento em Cruzeiro do Sul e na região, reunindo os assuntos que estão puxando o dia."
  },
  cotidiano: {
    label: "Cotidiano",
    text: "Aqui entram os assuntos que mexem direto com a rotina da cidade, do transporte aos serviços que afetam o dia."
  },
  prefeitura: {
    label: "Prefeitura",
    text: "Divisão própria para prefeituras do Vale do Juruá, com Cruzeiro do Sul sempre no primeiro plano."
  },
  "acre-governo": {
    label: "Acre / Governo",
    text: "Divisão própria para notícias principais do Acre e utilidade pública do Governo do Estado, sem misturar Prefeitura."
  },
  politica: {
    label: "Política",
    text: "Divisão própria para decisões, movimentos institucionais e disputas que ajudam a entender o cenário político."
  },
  policia: {
    label: "Polícia",
    text: "Segurança, operações e ocorrências aparecem aqui quando pedem atenção imediata."
  },
  saude: {
    label: "Saúde",
    text: "Saúde reúne campanhas, atendimento, prevenção e tudo o que mexe com o cuidado público na cidade."
  },
  educacao: {
    label: "Educação",
    text: "Educação acompanha escola, calendário letivo, formação, campus e oportunidades para estudantes e professores."
  },
  negocios: {
    label: "Negócios",
    text: "A leitura abre comércio, economia local, feiras, renda e movimentação do mercado regional."
  },
  cultura: {
    label: "Cultura",
    text: "Agenda criativa, festivais, cinema, arte e circuito cultural aparecem em um só recorte."
  },
  esporte: {
    label: "Esporte",
    text: "Jogos, atletas, campeonatos e histórias esportivas entram no mesmo acompanhamento."
  }
};

let radarGuideTargetFrame = 0;
let radarGuideScanIndex = 0;
let radarGuideScanTimer = 0;
let radarGuideScanTopic = null;
let radarGuideManualFocusUntil = Date.now() + 4200;
const RADAR_GUIDE_MANUAL_LOCK_MS = 1200;

const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeDegrees = (degrees = 0) => {
  let normalized = Number(degrees) || 0;

  while (normalized <= -180) normalized += 360;
  while (normalized > 180) normalized -= 360;

  return normalized;
};

const rotatePoint = ({ x = 0, y = 0 } = {}, angle = 0) => {
  const radians = (angle * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);

  return {
    x: x * cosine - y * sine,
    y: x * sine + y * cosine
  };
};

const getRadarGuideHandPose = (sceneRect, targetX, targetY) => {
  if (!radarGuideSprite || !radarGuideFrontArm) {
    return null;
  }

  const spriteRect = radarGuideSprite.getBoundingClientRect();
  const armWidth = radarGuideFrontArm.offsetWidth || 15;
  const armHeight = radarGuideFrontArm.offsetHeight || 76;
  const spriteWidth = radarGuideSprite.offsetWidth || spriteRect.width || 1;
  const spriteHeight = radarGuideSprite.offsetHeight || spriteRect.height || 1;
  const scaleX = spriteRect.width / spriteWidth;
  const scaleY = spriteRect.height / spriteHeight;
  const shoulderLocalX = radarGuideFrontArm.offsetLeft + armWidth;
  const shoulderLocalY = radarGuideFrontArm.offsetTop + armHeight * 0.16;
  const shoulderX = spriteRect.left - sceneRect.left + shoulderLocalX * scaleX;
  const shoulderY = spriteRect.top - sceneRect.top + shoulderLocalY * scaleY;
  const shoulderAimAngle = Math.atan2(targetY - shoulderY, targetX - shoulderX) * (180 / Math.PI);
  const handBaseVector = {
    x: (-armWidth - 3) * scaleX,
    y: (-(armHeight * 0.16) - 3) * scaleY
  };
  const handBaseAngle = Math.atan2(handBaseVector.y, handBaseVector.x) * (180 / Math.PI);
  const armAngle = clampNumber(normalizeDegrees(shoulderAimAngle - handBaseAngle), -84, -10);
  const handOffset = rotatePoint(handBaseVector, armAngle);

  return {
    armAngle,
    handX: shoulderX + handOffset.x,
    handY: shoulderY + handOffset.y
  };
};

const getRadarGuideLaserTopic = (topicNodes = [], activeTopic = null) => {
  const nodes = topicNodes.filter(Boolean);
  if (!nodes.length) {
    return activeTopic;
  }

  if (Date.now() < radarGuideManualFocusUntil) {
    radarGuideScanTopic = activeTopic || nodes[0];
    return radarGuideScanTopic;
  }

  const pool = nodes.filter((topic) => topic !== radarGuideScanTopic);
  const nextPool = pool.length ? pool : nodes;
  const nextTopic = nextPool[Math.floor(Math.random() * nextPool.length)] || activeTopic || nodes[0];
  radarGuideScanTopic = nextTopic;
  return nextTopic;
};

const startRadarGuideScan = () => {
  if (!radarGuide || radarGuideScanTimer || performanceLiteMode) {
    return;
  }

  radarGuideScanTimer = window.setInterval(() => {
    if (document.hidden) {
      return;
    }

    radarGuideScanIndex += 1;
    scheduleRadarGuideTarget();
  }, 1800);
};

const updateRadarGuideTarget = () => {
  if (!radarGuide || !radarGuideScene || !radarGuideLaser || !radarGuideLantern || !radarGuideFrontArm) {
    return;
  }

  const activeButton = document.querySelector("#radar .chip-button.is-active[data-filter]");
  if (!activeButton) {
    return;
  }

  const activeFilter = activeButton.dataset.filter || "todos";
  const topicNodes = [...radarGuideScene.querySelectorAll(".radar-office-topic[data-filter]")];
  const activeTopic =
    topicNodes.find((topic) => topic.dataset.filter === activeFilter) || topicNodes[0];
  const laserTopic = getRadarGuideLaserTopic(topicNodes, activeTopic);

  topicNodes.forEach((topic) => {
    const isLaserTopic = topic === (laserTopic || activeTopic);
    const isLinkedTopic = topic === activeTopic;
    topic.classList.toggle("is-active", isLaserTopic);
    topic.classList.toggle("is-linked", isLinkedTopic);
  });

  const sceneRect = radarGuideScene.getBoundingClientRect();
  const targetRect = (laserTopic || activeTopic || activeButton).getBoundingClientRect();
  const targetX = targetRect.left + targetRect.width / 2 - sceneRect.left;
  const targetY = targetRect.top + targetRect.height / 2 - sceneRect.top;
  const handPose = getRadarGuideHandPose(sceneRect, targetX, targetY);
  const fallbackArmRect = radarGuideFrontArm.getBoundingClientRect();
  const handX =
    handPose?.handX ?? fallbackArmRect.left + fallbackArmRect.width * 0.16 - sceneRect.left;
  const handY =
    handPose?.handY ?? fallbackArmRect.top + fallbackArmRect.height * 0.12 - sceneRect.top;
  const aimAngle = Math.atan2(targetY - handY, targetX - handX) * (180 / Math.PI);
  const penAngle = clampNumber(normalizeDegrees(aimAngle - 180), -34, 28);
  const armAngle = handPose?.armAngle ?? clampNumber(penAngle - 28, -84, -10);
  const penWidth = radarGuideLantern.offsetWidth || 58;
  const penHeight = radarGuideLantern.offsetHeight || 11;
  const penLeft = handX - penWidth + 6;
  const penTop = handY - penHeight / 2;
  const tipAngle = penAngle + 180;
  const tipRadians = (tipAngle * Math.PI) / 180;
  const penReach = Math.max(24, penWidth - 4);
  const originX = handX + Math.cos(tipRadians) * penReach;
  const originY = handY + Math.sin(tipRadians) * penReach;
  const distanceX = targetX - originX;
  const distanceY = targetY - originY;
  const length = Math.max(72, Math.hypot(distanceX, distanceY));
  const angle = Math.atan2(distanceY, distanceX) * (180 / Math.PI);

  radarGuide.style.setProperty("--radar-laser-origin-x", `${originX}px`);
  radarGuide.style.setProperty("--radar-laser-origin-y", `${originY}px`);
  radarGuide.style.setProperty("--radar-laser-target-x", `${targetX}px`);
  radarGuide.style.setProperty("--radar-laser-target-y", `${targetY}px`);
  radarGuide.style.setProperty("--radar-laser-length", `${length}px`);
  radarGuide.style.setProperty("--radar-laser-angle", `${angle}deg`);
  radarGuide.style.setProperty("--radar-guide-pen-angle", `${penAngle}deg`);
  radarGuide.style.setProperty("--radar-guide-arm-angle", `${armAngle}deg`);
  radarGuide.style.setProperty("--radar-guide-pen-left", `${penLeft}px`);
  radarGuide.style.setProperty("--radar-guide-pen-top", `${penTop}px`);
  radarGuide.classList.add("is-tracking-chip");

  if (radarGuideLaserDot) {
    radarGuideLaserDot.dataset.target = (laserTopic || activeTopic || activeButton).textContent.trim();
  }
};

const scheduleRadarGuideTarget = () => {
  if (!radarGuide || !radarGuideScene || !radarGuideLaser || !radarGuideLantern) {
    return;
  }

  if (radarGuideTargetFrame) {
    window.cancelAnimationFrame(radarGuideTargetFrame);
  }

  radarGuideTargetFrame = window.requestAnimationFrame(() => {
    radarGuideTargetFrame = 0;
    updateRadarGuideTarget();
  });
};

const updateRadarGuide = (filter = "todos", spotlightArticles = []) => {
  if (!radarGuide) {
    return;
  }

  const theme = radarGuideThemes[filter] || radarGuideThemes.todos;
  const leadTitle = spotlightArticles[0]?.title
    ? ` Em destaque agora: ${spotlightArticles[0].title}.`
    : "";

  radarGuide.dataset.theme = filter;

  if (radarGuideLabel) {
    radarGuideLabel.textContent = theme.label;
  }

  if (radarGuideText) {
    radarGuideText.textContent = `${theme.text}${leadTitle}`;
  }

  if (radarFlowFocus) {
    radarFlowFocus.textContent = theme.label;
  }

  if (radarFlowLead) {
    radarFlowLead.textContent = spotlightArticles[0]?.title || "Resumo local em preparação";
  }

  radarGuideScanIndex = 0;
  radarGuideScanTopic = null;
  radarGuideManualFocusUntil = Date.now() + RADAR_GUIDE_MANUAL_LOCK_MS;
  scheduleRadarGuideTarget();
};

const setActiveRadarFilter = (filter = "todos") => {
  radarFilterButtons.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
};

const getRadarSpotlightArticles = (filter = "todos") => {
  const allArticles = sortRadarArticles([...(window.NEWS_DATA || [])]);
  const normalizedFilter = normalizeText(filter);
  const reservedKeys = buildReservedArticleKeys(["radar"]);
  const filteredArticles =
    normalizedFilter === "todos"
      ? allArticles
      : allArticles.filter((article) => articleMatchesCategoryFilter(article, normalizedFilter));
  const spotlight = [];
  const seenKeys = new Set();

  const pushUnique = (article) => {
    if (!article) {
      return false;
    }

    if (!articleHasUsableImageCandidate(article)) {
      return false;
    }

    const articleKey = getRadarArticleKey(article);
    const usageKey = getArticleUsageKey(article);
    if (!articleKey || seenKeys.has(articleKey) || (usageKey && reservedKeys.has(usageKey))) {
      return false;
    }

    seenKeys.add(articleKey);
    spotlight.push(article);
    return spotlight.length >= 2;
  };

  if (normalizedFilter === "todos") {
    const { leadArticles } = pickRadarLeadArticles(allArticles);
    leadArticles.some(pushUnique);
  }

  filteredArticles.some(pushUnique);

  if (spotlight.length < 2) {
    allArticles.some(pushUnique);
  }

  return spotlight.slice(0, 2);
};

// FUNÇÃO PARA RENDERIZAR O RADAR (HOME)
const renderRadar = (filter = "todos") => {
  const radarGrid = document.querySelector("#radar .news-grid");
  if (!radarGrid || !window.NEWS_DATA) {
    return;
  }

  const spotlightArticles = getRadarSpotlightArticles(filter);

  radarGrid.innerHTML = "";
  radarGrid.dataset.activeFilter = filter;

  spotlightArticles.forEach((article, index) => {
    const card = buildFeedCard(article);
    card.classList.add(
      "radar-spotlight-card",
      "radar-top-story",
      "reveal",
      "active"
    );
    card.dataset.radarRank = String(index + 1);

    if (index === 0) {
      card.classList.add("featured", "featured-primary");
    } else {
      card.classList.add("featured-secondary");
    }

    radarGrid.appendChild(card);
  });

  if (spotlightArticles.length === 0) {
    const emptyState = document.createElement("article");
    emptyState.className = "news-card radar-empty-state reveal active";
    emptyState.innerHTML = `
      <span class="news-source">Resumo CZS</span>
      <h3>Sem destaque encontrado para este tema agora.</h3>
      <p>Escolha outro filtro acima para ver mais notícias.</p>
    `;
    radarGrid.appendChild(emptyState);
  }

  setActiveRadarFilter(filter);
  reserveSurfaceArticles("radar", spotlightArticles);
  updateRadarGuide(filter, spotlightArticles);
  registerInteractivePanels(radarGrid);
  window.setTimeout(() => registerArticleCardLinks(radarGrid), 0);
};

if (radarGuide && !performanceLiteMode) {
  window.addEventListener("resize", scheduleRadarGuideTarget);
  window.addEventListener("scroll", scheduleRadarGuideTarget, { passive: true });
  startRadarGuideScan();

  if (document.fonts?.ready) {
    document.fonts.ready.then(scheduleRadarGuideTarget).catch(() => {});
  }
}

dayChips.forEach((button) => {
  button.addEventListener("click", () => {
    dayChips.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
  });
});

betButtons.forEach((button) => {
  button.addEventListener("click", () => {
    betButtons.forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
  });
});

const parseProjectionArticleDate = (article = {}) => {
  const rawValue = String(article.publishedAt || article.createdAt || article.date || "").trim();
  const parsed = new Date(rawValue);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const monthMap = {
    jan: 0,
    janeiro: 0,
    fev: 1,
    fevereiro: 1,
    mar: 2,
    marco: 2,
    abr: 3,
    abril: 3,
    mai: 4,
    maio: 4,
    jun: 5,
    junho: 5,
    jul: 6,
    julho: 6,
    ago: 7,
    agosto: 7,
    set: 8,
    setembro: 8,
    out: 9,
    outubro: 9,
    nov: 10,
    novembro: 10,
    dez: 11,
    dezembro: 11
  };
  const normalized = rawValue
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const match = normalized.match(/(\d{1,2})\s*(?:de\s*)?([a-z]{3,9})\.?\s*(?:de\s*)?(\d{4})/);

  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const monthIndex = monthMap[month];
  return Number.isFinite(monthIndex) ? new Date(Number(year), monthIndex, Number(day)) : null;
};

const getProjectionArticleKey = (article = {}) =>
  String(
    article.slug ||
      article.sourceUrl ||
      article.url ||
      article.id ||
      [article.title, article.publishedAt || article.date].filter(Boolean).join("|")
  ).trim();

const countProjectionNotes = (days = 31) => {
  const articles = Array.isArray(window.NEWS_DATA) ? window.NEWS_DATA : [];
  const datedArticles = articles
    .map((article) => ({ article, date: parseProjectionArticleDate(article) }))
    .filter(({ date }) => date && !Number.isNaN(date.getTime()));

  if (!datedArticles.length) {
    return articles.length;
  }

  const latestTime = Math.max(...datedArticles.map(({ date }) => date.getTime()));
  const cutoff = new Date(latestTime);
  cutoff.setDate(cutoff.getDate() - (Math.max(1, days) - 1));
  cutoff.setHours(0, 0, 0, 0);

  return new Set(
    datedArticles
      .filter(({ date }) => date.getTime() >= cutoff.getTime() && date.getTime() <= latestTime)
      .map(({ article }) => getProjectionArticleKey(article))
      .filter(Boolean)
  ).size;
};

const updateProjection = () => {
  const stake = Number(stakeInput.value);
  const trackedItems = countProjectionNotes(stake);
  const noteLabel = trackedItems === 1 ? "nota" : "notas";

  stakeValue.textContent = `${stake} dias`;
  stakeReturn.textContent = `${trackedItems} ${noteLabel}`;
};

if (stakeInput && stakeValue && stakeReturn) {
  updateProjection();
  stakeInput.addEventListener("input", updateProjection);
}

if (opinionInput && charCount) {
  opinionInput.addEventListener("input", () => {
    charCount.textContent = `${opinionInput.value.length} / 180`;
  });
}

const buildCommentCard = (comment) => {
  const article = document.createElement("article");
  const header = document.createElement("header");
  const author = document.createElement("strong");
  const badge = document.createElement("span");
  const message = document.createElement("p");

  article.className = "comment-card reveal active";
  author.textContent = comment.name || comment.author || "Leitor local";
  badge.textContent = comment.badge || comment.city || "Comunidade";
  message.textContent = `“${comment.message || ""}”`;

  header.append(author, badge);
  article.append(header, message);
  return article;
};

const renderCommentsFeed = (items = []) => {
  if (!commentsFeed) {
    return;
  }

  commentsFeed.innerHTML = "";
  items.forEach((comment) => {
    commentsFeed.appendChild(buildCommentCard(comment));
  });
};

const getAnalyticsContext = () => {
  try {
    return window.CatalogoAnalytics?.getContext?.() || {};
  } catch {
    return {};
  }
};

const formatCommunityMessageTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "agora";
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 2) return "agora";
  if (diffMinutes < 60) return `${diffMinutes} min`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h`;

  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

const buildCommunityReportCard = (report = {}) => {
  const article = document.createElement("article");
  const header = document.createElement("header");
  const badge = document.createElement("span");
  const title = document.createElement("strong");
  const message = document.createElement("p");
  const footer = document.createElement("small");
  const time = document.createElement("time");

  article.className = "community-report-card";
  badge.textContent = "em conferência";
  title.textContent = report.neighborhood || "Bairro não informado";
  message.textContent = report.message || "";
  footer.textContent = `${report.name || "Morador local"} • informação da população`;
  if (report.createdAt) {
    time.dateTime = report.createdAt;
    time.textContent = formatCommunityMessageTime(report.createdAt);
  } else {
    time.textContent = "agora";
  }

  header.append(badge, title);
  footer.append(" • ", time);
  article.append(header, message, footer);
  return article;
};

const renderCommunityReports = (items = []) => {
  if (!communityReportList) return;

  communityReportList.innerHTML = "";
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "community-report-empty";
    empty.textContent = "As próximas mensagens da população aparecem aqui como avisos, opiniões e informações rápidas.";
    communityReportList.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    communityReportList.appendChild(buildCommunityReportCard(item));
  });
};

const loadCommunityReports = async () => {
  if (!communityReportList) return;

  try {
    const payload = await requestApiJson("/api/community/reports?limit=6");
    const items = Array.isArray(payload.items) ? payload.items : [];
    renderCommunityReports(items);
    return items;
  } catch (_error) {
    renderCommunityReports([]);
    return [];
  }
};

const revealCommunityReportsAfterSubmit = () => {
  const section = document.querySelector("#participacao-comunitaria");
  const board = document.querySelector(".community-signal-board");
  const target = board || section || communityReportList;

  if (!target) {
    return;
  }

  target.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
};

const submitCommunityReport = async (event) => {
  event.preventDefault();
  if (!communityAgentForm || !communityAgentFeedback) return;

  const formData = new FormData(communityAgentForm);
  const submitButton = communityAgentForm.querySelector('button[type="submit"]');
  const message = String(formData.get("message") || "").trim();
  if (message.length < 12) {
    communityAgentFeedback.textContent = "Conte um pouco mais para a mensagem ajudar outros moradores.";
    return;
  }

  communityAgentFeedback.textContent = "Enviando sua mensagem para o chat comunitário...";
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Enviando...";
  }

  const analyticsContext = getAnalyticsContext();
  const payload = {
    name: String(formData.get("name") || "").trim(),
    contact: String(formData.get("contact") || "").trim(),
    neighborhood: String(formData.get("neighborhood") || "").trim(),
    message,
    topic: "Mensagem comunitária",
    sourcePage: window.location.pathname,
    visitorId: analyticsContext.visitorId,
    sessionId: analyticsContext.sessionId
  };

  try {
    const result = await requestApiJson("/api/community/reports", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    communityAgentFeedback.textContent =
      "Mensagem recebida. Ela entra como informação da população e pode passar por conferência.";
    communityAgentForm.reset();
    const refreshedItems = await loadCommunityReports();
    if (!Array.isArray(refreshedItems) || !refreshedItems.length) {
      renderCommunityReports(result?.item ? [result.item] : []);
    }
    revealCommunityReportsAfterSubmit();
  } catch (error) {
    communityAgentFeedback.textContent = error.message || "Falha ao registrar. Tente novamente.";
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Enviar mensagem";
    }
  }
};

let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 2;
let scrollY = window.scrollY;

const renderParallax = () => {
  parallaxNodes.forEach((node) => {
    const depth = Number(node.dataset.depth || 12);
    const offsetX = ((pointerX - window.innerWidth / 2) / window.innerWidth) * depth;
    const offsetY = ((pointerY - window.innerHeight / 2) / window.innerHeight) * depth;
    const scrollOffset = Math.min(scrollY * 0.015, depth * 1.5);
    node.style.transform = `translate3d(${offsetX}px, ${offsetY + scrollOffset}px, 0)`;
  });
};

if (!performanceLiteMode && parallaxNodes.length > 0) {
  renderParallax();

  window.addEventListener("mousemove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    renderParallax();
  });

  window.addEventListener(
    "scroll",
    () => {
      scrollY = window.scrollY;
      renderParallax();
    },
    { passive: true }
  );
}

if (guideTip && !performanceLiteMode) {
  let guideIndex = 0;

  window.setInterval(() => {
    guideIndex = (guideIndex + 1) % guideMessages.length;
    guideTip.textContent = guideMessages[guideIndex];
  }, 4200);
}

const mediaDefaults = {
  badge: "",
  label: "",
  note: "Cobertura direta do Catálogo Cruzeiro do Sul",
  creditLabel: "Política visual do Catálogo",
  creditUrl: "./index.html#desmonte"
};

const getSlugFromHref = (href = "") => {
  const match = String(href || "").match(/[?&]slug=([^&#]+)/);
  return match ? decodeURIComponent(match[1]) : "";
};

const getSlugFromLink = (node) => {
  if (!node || !node.getAttribute) {
    return "";
  }

  return getSlugFromHref(node.getAttribute("href") || "");
};

const ensureMediaBadge = (node, media) => {
  if (!node || node.querySelector(".thumb-media-badge")) {
    return;
  }

  if (!media || !media.badge) {
    return;
  }

  const badge = document.createElement("span");
  badge.className = "thumb-media-badge";
  badge.textContent = media.badge;
  node.appendChild(badge);
};

const liveFeedGrid = document.querySelector("#live-feed-grid");
const liveFeedQuery = document.querySelector("#live-feed-query");
const liveFeedSuggestions = document.querySelector("#arquivo-noticias-sugestoes");
const liveFeedMore = document.querySelector("#live-feed-more");
const liveFeedCount = document.querySelector("#live-feed-count");
const liveFeedCountLabel = document.querySelector("#live-feed-count-label");
const liveFeedTotal = document.querySelector("#live-feed-total");
const liveFeedStatus = document.querySelector("#live-feed-status");
const liveFeedFilters = document.querySelector("#live-feed-filters");
const liveFeedUpdated = document.querySelector("#live-feed-updated");
const liveFeedFocus = document.querySelector("#live-feed-focus");
const liveFeedSources = document.querySelector("#live-feed-sources");
const liveFeedClear = document.querySelector("#live-feed-clear");
const liveFeedState = {
  pageSize: 6,
  visibleItems: 6,
  items: [...initialStaticNews],
  archiveTotal: Math.max(initialStaticNews.length, Number(window.NEWS_ARCHIVE_TOTAL || 0) || 0),
  activeCategory: ""
};

const monthIndex = {
  janeiro: 0,
  fevereiro: 1,
  marco: 2,
  abril: 3,
  maio: 4,
  junho: 5,
  julho: 6,
  agosto: 7,
  setembro: 8,
  outubro: 9,
  novembro: 10,
  dezembro: 11
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function slugifyText(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const archiveStoryStopwords = new Set([
  "a",
  "o",
  "os",
  "as",
  "ao",
  "aos",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "para",
  "por",
  "com",
  "sem",
  "que",
  "uma",
  "um",
  "sobre",
  "apos",
  "após",
  "acre",
  "brasil",
  "governo",
  "prefeitura"
]);

const decodeEditorialEntities = (value = "") =>
  String(value || "")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&ndash;|&mdash;/gi, "-")
    .replace(/[“”‘’]/g, "'")
    .replace(/[–—]/g, "-");

const normalizeArchiveStoryText = (value = "") =>
  normalizeText(decodeEditorialEntities(value))
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getCanonicalArticleUrl = (article = {}) => {
  const rawUrl = String(article.sourceUrl || article.url || article.link || "").trim();
  if (!rawUrl || rawUrl === "#") {
    return "";
  }

  try {
    const parsed = new URL(rawUrl, window.location.href);
    [...parsed.searchParams.keys()].forEach((key) => {
      if (/^(utm_|fbclid|gclid|mc_|output|ref|source)$/i.test(key)) {
        parsed.searchParams.delete(key);
      }
    });
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "").toLowerCase();
  } catch (_error) {
    return normalizeArchiveStoryText(rawUrl);
  }
};

const getArchiveStoryTokens = (article = {}) => {
  const text = normalizeArchiveStoryText(
    [
      article.title,
      article.sourceLabel,
      article.summary,
      article.lede,
      article.description,
      article.category,
      article.sourceName
    ].join(" ")
  );

  return text
    .split(/\s+/)
    .filter((token) => token.length > 3 && !archiveStoryStopwords.has(token))
    .slice(0, 9);
};

const getArchiveStoryCluster = (article = {}) => {
  const haystack = normalizeArchiveStoryText(
    [
      article.title,
      article.sourceLabel,
      article.summary,
      article.lede,
      article.description,
      article.category,
      article.sourceName
    ].join(" ")
  );

  if (/\b(parana pesquisas|pesquisas rj|flavio.*lula|lula.*flavio)\b/.test(haystack)) {
    return "pesquisa-rj-lula-flavio";
  }
  if (/\b(mailza|mailsa|governadora mailza|mailza assis)\b/.test(haystack)) {
    return "mailza-governo";
  }
  if (/\b(cheia|enchente|jurua|juru[aá]|alagamento|abrigos?|vazante|familias atingidas)\b/.test(haystack)) {
    return "cheia-jurua";
  }
  if (/\b(derramamento|diesel|oleo|balsa|tarauaca)\b/.test(haystack)) {
    return "oleo-tarauaca";
  }
  if (/\b(edital|licenca|licenca de operacao|assembleia|convocacao)\b/.test(haystack)) {
    return `edital-${getArchiveStoryTokens(article).slice(0, 3).join("-")}`;
  }

  return getArchiveStoryTokens(article).slice(0, 5).join("-") || slugifyText(article.title || article.id || "");
};

const getArchiveImageKey = (article = {}) =>
  normalizeArchiveStoryText(article.imageUrl || article.feedImageUrl || article.sourceImageUrl || article.originalImageUrl || "")
    .replace(/\?.*$/, "")
    .slice(0, 180);

const getArchiveArticleStoryKey = (article = {}) => {
  const dateKey =
    getArticleDateKey(article) ||
    normalizeArchiveStoryText(article.publishedAt || article.date || article.createdAt || "").slice(0, 48);
  const titleKey = slugifyText(article.title || article.sourceLabel || "");
  const slugKey = slugifyText(article.slug || "");
  const clusterKey = getArchiveStoryCluster(article);
  const storyKey = titleKey || slugKey || clusterKey;

  if (storyKey && dateKey) {
    return `story|${storyKey}|${dateKey}`;
  }

  return storyKey || "";
};

const getArchiveArticleCanonicalKey = (article = {}) => {
  const storyKey = getArchiveArticleStoryKey(article);
  if (storyKey) {
    return storyKey;
  }

  const canonicalUrl = getCanonicalArticleUrl(article);
  if (canonicalUrl) {
    return canonicalUrl;
  }

  return [
    getArchiveStoryCluster(article),
    normalizeArchiveStoryText(article.sourceName || article.source || ""),
    normalizeArchiveStoryText(article.publishedAt || article.date || article.createdAt || "")
  ]
    .filter(Boolean)
    .join("|");
};

const diversifyArchiveStories = (items = [], desiredCount = 6) => {
  const limit = Math.max(1, Number(desiredCount || 6));
  const selected = [];
  const selectedKeys = new Set();
  const counts = {
    source: new Map(),
    category: new Map(),
    cluster: new Map(),
    image: new Map()
  };
  const sourceLimit = 2;
  const categoryLimit = limit <= 6 ? 2 : 3;
  const clusterLimit = 1;
  const passes = [
    { source: sourceLimit, category: categoryLimit, cluster: clusterLimit, image: 1 },
    { source: sourceLimit + 1, category: categoryLimit + 1, cluster: clusterLimit + 1, image: 2 },
    { source: Infinity, category: Infinity, cluster: Infinity, image: Infinity }
  ];

  const canUse = (article, pass) => {
    const source = normalizeArchiveStoryText(article.sourceName || article.source || "fonte");
    const category = normalizeArchiveStoryText(article.categoryKey || article.category || "geral");
    const cluster = getArchiveStoryCluster(article);
    const image = getArchiveImageKey(article);

    return (
      (counts.source.get(source) || 0) < pass.source &&
      (counts.category.get(category) || 0) < pass.category &&
      (counts.cluster.get(cluster) || 0) < pass.cluster &&
      (!image || (counts.image.get(image) || 0) < pass.image)
    );
  };

  const addArticle = (article) => {
    const key = getArchiveArticleCanonicalKey(article);
    if (!key || selectedKeys.has(key)) {
      return false;
    }

    selected.push(article);
    selectedKeys.add(key);

    const source = normalizeArchiveStoryText(article.sourceName || article.source || "fonte");
    const category = normalizeArchiveStoryText(article.categoryKey || article.category || "geral");
    const cluster = getArchiveStoryCluster(article);
    const image = getArchiveImageKey(article);
    counts.source.set(source, (counts.source.get(source) || 0) + 1);
    counts.category.set(category, (counts.category.get(category) || 0) + 1);
    counts.cluster.set(cluster, (counts.cluster.get(cluster) || 0) + 1);
    if (image) counts.image.set(image, (counts.image.get(image) || 0) + 1);
    return true;
  };

  passes.forEach((pass) => {
    if (selected.length >= limit) {
      return;
    }

    items.forEach((article) => {
      if (selected.length >= limit || !canUse(article, pass)) {
        return;
      }

      addArticle(article);
    });
  });

  const remaining = items.filter((article) => !selectedKeys.has(getArchiveArticleCanonicalKey(article)));
  return [...selected, ...remaining];
};

const getLocalDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: localeTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const dateParts = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
};

const previewClassByCategory = {
  cotidiano: "thumb-cheia",
  saude: "thumb-saude",
  negocios: "thumb-pascoa",
  policia: "thumb-policia",
  educacao: "thumb-educacao",
  prefeitura: "thumb-politica",
  "acre-governo": "thumb-politica",
  politica: "thumb-politica",
  esporte: "thumb-cultura",
  "utilidade publica": "thumb-alerta",
  "festas & social": "thumb-social",
  social: "thumb-social",
  cultura: "thumb-cultura"
};

const categoryLabelByKey = {
  cotidiano: "Cotidiano",
  prefeitura: "Prefeitura",
  "acre-governo": "Acre / Governo",
  politica: "Política",
  policia: "Polícia",
  saude: "Saúde",
  educacao: "Educação",
  negocios: "Negócios",
  cultura: "Cultura",
  esporte: "Esporte",
  social: "Social",
  "festas & social": "Festas & Social",
  "utilidade publica": "Utilidade Pública"
};

const categoryAliasMap = {
  cotidiano: "cotidiano",
  politica: "politica",
  policia: "policia",
  saude: "saude",
  educacao: "educacao",
  economia: "negocios",
  negocios: "negocios",
  cultura: "cultura",
  variedades: "cultura",
  esporte: "esporte",
  "destaques esporte": "esporte",
  governo: "acre-governo",
  "governo do estado": "acre-governo",
  "governo do acre": "acre-governo",
  "acre / governo": "acre-governo",
  "acre-governo": "acre-governo",
  estado: "acre-governo",
  prefeitura: "prefeitura",
  editais: "utilidade publica",
  detran: "utilidade publica",
  social: "social",
  "festas & social": "festas & social",
  "ac24horas play": "cultura",
  newsletter: "",
  nacional: "",
  geral: "",
  acre: "acre-governo",
  "acre 03": "",
  "destaque 1": "",
  "extra total": ""
};

const genericCategoryKeys = new Set([
  "",
  "newsletter",
  "nacional",
  "geral",
  "acre",
  "acre 03",
  "destaque 1",
  "extra total"
]);

const radarCategoryRelevance = {
  prefeitura: 9,
  politica: 8,
  "acre-governo": 7,
  cotidiano: 6,
  saude: 5,
  "utilidade publica": 5,
  policia: 4,
  educacao: 4,
  esporte: 4,
  negocios: 3,
  cultura: 3,
  "festas & social": 2,
  social: 2
};

const isKnownCategoryKey = (categoryKey = "") => Boolean(categoryLabelByKey[categoryKey]);

const formatCategoryLabel = (categoryKey = "") =>
  categoryLabelByKey[categoryKey] || categoryLabelByKey.cotidiano;

const isJuruaPrefeituraScope = (rawText = "") => {
  const haystack = normalizeText(rawText);
  if (!haystack) {
    return false;
  }

  const hasMunicipalSignal =
    /\b(prefeitura|prefeito|prefeita|secretaria municipal|secretario municipal|secretaria de|municipio|municipal|gestao municipal|obras municipais|sedetur|semed|saurb|semtrans)\b/.test(
      haystack
    );
  const hasJuruaSignal =
    /\b(cruzeiro do sul|cruzeiro-do-sul|czs|vale do jurua|vale-do-jurua|jurua|juru[aá]|mancio lima|m[âa]ncio lima|rodrigues alves|porto walter|marechal thaumaturgo|tarauaca|tarauac[aá])\b/.test(
      haystack
    );
  const hasExplicitCzsPrefeitura =
    /\b(prefeitura (municipal )?de cruzeiro do sul|cruzeirodosul\.ac\.gov\.br|prefeitura-czs)\b/.test(haystack);

  return hasExplicitCzsPrefeitura || (hasMunicipalSignal && hasJuruaSignal);
};

const getPrefeituraJuruaPriorityScore = (rawText = "") => {
  const haystack = normalizeText(rawText);
  if (!haystack || !isJuruaPrefeituraScope(haystack)) {
    return 0;
  }

  if (/\b(prefeitura (municipal )?de cruzeiro do sul|cruzeirodosul\.ac\.gov\.br|prefeitura-czs|cruzeiro do sul|cruzeiro-do-sul|czs)\b/.test(haystack)) {
    return 400;
  }

  if (/\b(vale do jurua|vale-do-jurua|jurua|juru[aá])\b/.test(haystack)) {
    return 320;
  }

  return 280;
};

const isAcreGovernmentScope = (rawText = "") => {
  const haystack = normalizeText(rawText);
  if (!haystack) {
    return false;
  }

  return /\b(governo do acre|governo estadual|governador|governadora|estado do acre|secretaria de estado|secretaria estadual|detran|sesacre|seinfra|sejusp|aleac|assembleia legislativa|acre\.gov\.br|agencia\.ac\.gov\.br)\b/.test(
    haystack
  );
};

const isAcreGeneralScope = (rawText = "") => {
  const haystack = normalizeText(rawText);
  if (!haystack) {
    return false;
  }

  return /\b(acre|rio branco|cruzeiro do sul|vale do jurua|jurua|juru[aá]|mancio lima|m[âa]ncio lima|rodrigues alves|porto walter|marechal thaumaturgo|tarauaca|tarauac[aá]|sena madureira|brasileia|xapuri|agencia acre|agencia\.ac\.gov\.br)\b/.test(
    haystack
  );
};

const isJuruaRegionalScope = (rawText = "") => {
  const haystack = normalizeText(rawText);
  if (!haystack) {
    return false;
  }

  return /\b(cruzeiro do sul|cruzeiro-do-sul|czs|vale do jurua|vale do juru[aá]|vale-do-jurua|jurua|juru[aá]|mancio lima|m[âa]ncio lima|rodrigues alves|porto walter|marechal thaumaturgo|tarauaca|tarauac[aá]|jurua24horas|juruaemtempo|juruacomunicacao|cruzeirodosul\.net|cruzeirodosul\.ac\.gov\.br)\b/.test(
    haystack
  );
};

const getRegionalEditorialScopeText = (article = {}) => {
  const normalizedArticle = normalizeRuntimeArticle(article);
  return [
    normalizedArticle.title,
    normalizedArticle.summary,
    normalizedArticle.lede,
    normalizedArticle.description,
    normalizedArticle.category,
    normalizedArticle.categoryKey,
    normalizedArticle.eyebrow
  ].join(" ");
};

const getRegionalSourceScopeText = (article = {}) => {
  const normalizedArticle = normalizeRuntimeArticle(article);
  return [
    normalizedArticle.sourceName,
    normalizedArticle.sourceLabel,
    normalizedArticle.sourceUrl
  ].join(" ");
};

const getRegionalScopeText = (article = {}) =>
  [getRegionalEditorialScopeText(article), getRegionalSourceScopeText(article)].join(" ");

const isRemoteNationalMosaicScope = (rawText = "") => {
  const haystack = normalizeText(rawText);
  if (!haystack) {
    return false;
  }

  return /\b(eua|estados unidos|trump|biden|reino unido|rei charles|china|russia|rússia|ucrania|ucrânia|europa|oriente medio|oriente médio|israel|ira|irã|washington|nova york|londres|paris|madrid|argentina|peru|brasilia|brasília|governo federal|stf|senado federal|camara dos deputados|câmara dos deputados|congresso nacional|sao paulo|são paulo|sp|palmeiras|flamengo|corinthians|nba|champions|bbb|celebridade)\b/.test(
    haystack
  );
};

const getMosaicRegionalScope = (article = {}) => {
  const editorialScopeText = getRegionalEditorialScopeText(article);
  const sourceScopeText = getRegionalSourceScopeText(article);
  const hasJuruaEditorialSignal = isJuruaRegionalScope(editorialScopeText);
  const hasAcreEditorialSignal =
    isAcreGeneralScope(editorialScopeText) || isAcreGovernmentScope(editorialScopeText);
  const hasRemoteSignal = isRemoteNationalMosaicScope(editorialScopeText);

  if (hasJuruaEditorialSignal) {
    return "jurua";
  }

  if (hasRemoteSignal && !isAcreGeneralScope(editorialScopeText)) {
    return "";
  }

  if (hasAcreEditorialSignal) {
    return "acre";
  }

  if ((isAcreGeneralScope(sourceScopeText) || isAcreGovernmentScope(sourceScopeText)) && !hasRemoteSignal) {
    return "acre";
  }

  if (isJuruaRegionalScope(sourceScopeText) && !/\b(brasil|brasileir|mundo|eua|china|europa|sao paulo|são paulo|rio de janeiro|celebridade|bbb|serie a|champions|nba|tenis|tênis)\b/.test(normalizeText(editorialScopeText))) {
    return "jurua";
  }

  return "";
};

const inferCategoryKeyFromContent = (rawText = "") => {
  const haystack = normalizeText(rawText);

  if (!haystack) {
    return "";
  }

  if (
    /\b(policia|policial|preso|prende|prisao|trafico|crime|assalto|roubo|furto|homicidio|estupr|foragido|delegacia|delegado|operacao)\b/.test(
      haystack
    )
  ) {
    return "policia";
  }

  if (
    /\b(saude|hospital|ubs|upa|medic|vacina|vacinacao|dengue|cirurg|sus|atendimento|doenca|doula)\b/.test(
      haystack
    )
  ) {
    return "saude";
  }

  if (
    /\b(educacao|escola|colegio|ifac|ufac|universidade|estudante|enem|vestibular|aula|ensino|professor)\b/.test(
      haystack
    )
  ) {
    return "educacao";
  }

  if (
    /\b(esporte|futebol|basquete|campeonato|atleta|jogo|serie d|tourao|humaita|galvez)\b/.test(
      haystack
    )
  ) {
    return "esporte";
  }

  if (
    /\b(aleac|camara|deputad|senador|ministro|stj|stf|eleicao|eleitoral|parlamento|monopolio aereo)\b/.test(
      haystack
    )
  ) {
    return "politica";
  }

  if (isJuruaPrefeituraScope(haystack)) {
    return "prefeitura";
  }

  if (
    isAcreGovernmentScope(haystack)
  ) {
    return "acre-governo";
  }

  if (
    /\b(utilidade|servico|alerta|defesa civil|alag|chuva|temporal|transito|detran|edital|inscric|prazo|abastecimento|limpeza|coleta|ponto facultativo|pagamento|abrigo|rodovia|estrada)\b/.test(
      haystack
    )
  ) {
    return "utilidade publica";
  }

  if (/\b(negocio|economia|comercio|empresa|empreendedor|mercado|feira)\b/.test(haystack)) {
    return "negocios";
  }

  if (/\b(festa|social|celebridade|aniversario|casamento|coluna social)\b/.test(haystack)) {
    return "festas & social";
  }

  if (
    /\b(cultura|cinema|teatro|show|festival|musica|arte|artista|entretenimento|variedades)\b/.test(
      haystack
    )
  ) {
    return "cultura";
  }

  return "";
};

const normalizeNewsCategoryKey = (rawCategory = "", context = {}) => {
  const rawKey = normalizeText(rawCategory);
  const contextText = [context.title, context.summary, context.sourceName, context.sourceLabel, context.sourceUrl].join(" ");
  const fullText = [rawCategory, contextText].join(" ");
  const mappedKey = Object.prototype.hasOwnProperty.call(categoryAliasMap, rawKey)
    ? categoryAliasMap[rawKey]
    : "";

  if (mappedKey) {
    if (mappedKey === "prefeitura" && !isJuruaPrefeituraScope(fullText)) {
      return inferCategoryKeyFromContent(contextText) || "cotidiano";
    }
    return mappedKey;
  }

  if (rawKey && !genericCategoryKeys.has(rawKey) && isKnownCategoryKey(rawKey)) {
    if (rawKey === "prefeitura" && !isJuruaPrefeituraScope(fullText)) {
      return inferCategoryKeyFromContent(contextText) || "cotidiano";
    }
    return rawKey;
  }

  const inferredKey = inferCategoryKeyFromContent(fullText);
  if (inferredKey) {
    return inferredKey;
  }

  const defaultKey = normalizeText(context.defaultCategory || "");
  if (isKnownCategoryKey(defaultKey)) {
    return defaultKey;
  }

  return "cotidiano";
};

const formatDisplayDate = (value) => {
  if (!value) {
    return "Sem data";
  }

  if (typeof value === "string" && !/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: localeTimeZone
  });
};

const formatCompactDisplayDate = (value) => {
  if (!value) {
    return "Sem data";
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed
      .toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: localeTimeZone
      })
      .replace(/\./g, "")
      .replace(/\s+de\s+/gi, " ")
      .trim();
  }

  return cleanArticleText(String(value || ""))
    .replace(/\./g, "")
    .replace(/\s+de\s+/gi, " ")
    .trim();
};

const formatMosaicSourceLabel = (article = {}) => {
  const sourceName = cleanArticleText(
    article.sourceName || article.source || article.sourceLabel || "Fonte local"
  );
  const dateLabel = formatCompactDisplayDate(article.publishedAt || article.date || article.createdAt || "");
  return dateLabel && dateLabel !== "Sem data" ? `${sourceName} • ${dateLabel}` : sourceName;
};

const decodeBasicEntities = (value = "") =>
  String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&hellip;|&#8230;/gi, "...")
    .replace(/&#8211;|&#8212;/gi, "-")
    .replace(/&#8216;|&#8217;/gi, "'")
    .replace(/&#8220;|&#8221;/gi, '"')
    .replace(/&#(\d+);/g, (_match, code) => {
      const parsed = Number(code);
      return Number.isFinite(parsed) ? String.fromCharCode(parsed) : "";
    });

const cleanArticleText = (value = "") =>
  decodeBasicEntities(value)
    .replace(/<!\[CDATA\[|\]\]>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const cleanArticleExcerpt = (value = "", fallback = "") => {
  let text = cleanArticleText(value || fallback || "");

  text = text
    .replace(/\s*["“”]?\s*data-medium-file="[^"]*"/gi, " ")
    .replace(/\s*data-large-file="[^"]*"/gi, " ")
    .replace(/\s*data-orig-file="[^"]*"/gi, " ")
    .replace(/\s*data-orig-size="[^"]*"/gi, " ")
    .replace(/\s*srcset="[^"]*"/gi, " ")
    .replace(/\s*src="[^"]*"/gi, " ")
    .replace(/\s*The post .*? appeared first on .*?\.?$/i, "")
    .replace(/\[\s*\.{3}\s*\]|\[\s*…\s*\]/g, "...")
    .replace(/\s+/g, " ")
    .trim();

  if (/^(foto|fotos|imagem|imagens|screenshot|arquivo|reproducao|reprodução)\s*:/i.test(text)) {
    text = text
      .replace(
        /^(foto|fotos|imagem|imagens|screenshot|arquivo|reproducao|reprodução)\s*:\s*.*?(?=\s+(A|O|As|Os|Uma|Um|Na|No|Em|Foi|Com|Pontos|Fortes|Durante)\b)/i,
        ""
      )
      .trim();
  }

  return text || cleanArticleText(fallback || value || "");
};

const truncateCopyAtWord = (value, maxLength = 140, options = {}) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  const limit = Number.isFinite(maxLength) ? Math.max(0, Math.floor(maxLength)) : 140;
  const suffix = typeof options.suffix === "string" ? options.suffix : "...";

  if (!text || !limit || text.length <= limit) {
    return text;
  }

  const suffixLength = suffix.length;
  const available = Math.max(1, limit - suffixLength);
  const minSentenceLength = Math.min(
    available,
    Math.max(24, options.minSentenceLength || Math.floor(limit * 0.42))
  );
  const sentenceWindow = text.slice(0, limit + 1);
  const sentenceMatch = sentenceWindow.match(/^(.+?[.!?])(?:\s|$)/);

  if (
    sentenceMatch &&
    sentenceMatch[1].length >= minSentenceLength &&
    sentenceMatch[1].length <= limit
  ) {
    return sentenceMatch[1].trim();
  }

  const sliced = text.slice(0, available).trimEnd();
  const wordSafe = /\s/.test(sliced) ? sliced.replace(/\s+\S*$/, "").trim() : "";
  const cleanWordSafe = wordSafe.replace(/[.,;:!?-]+$/, "").trim();
  const minWordSafeLength = Math.min(
    available,
    Math.max(6, options.minWordSafeLength || Math.floor(limit * 0.32))
  );

  if (cleanWordSafe.length >= minWordSafeLength) {
    return `${cleanWordSafe}${suffix}`;
  }

  return text;
};

const buildShortArticleSummary = (value = "", fallback = "", maxLength = 172) => {
  const sourceText = cleanArticleExcerpt(value, fallback)
    .replace(/\b(LEIA TAMB[EÉ]M|ASSISTA|VEJA TAMB[EÉ]M|Clique aqui).*$/i, "")
    .replace(/\b(Reprodu[cç][aã]o|Divulga[cç][aã]o|Arquivo pessoal|Redes sociais)[/\\\w\s.-]{0,90}/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const fallbackText = cleanArticleText(fallback || "Resumo em atualização.");
  const text = sourceText || fallbackText;
  const sentenceMatch = text.match(/^(.{70,220}?[.!?])(\s|$)/);
  const firstSentence = sentenceMatch ? sentenceMatch[1].trim() : text;
  const compact = firstSentence.length > 45 ? firstSentence : text;

  return truncateCopyAtWord(compact, maxLength, {
    minSentenceLength: 52,
    minWordSafeLength: 18
  });
};

const heroUnsafeImageOverrides = {
  "aliado-de-mailza-pastor-reginaldo-e-nomeado-para-cargo-de-adjunto-na-secretaria-de-governo":
    "https://ac24horas.com/wp-content/uploads/2025/12/PALACIO-SERGIO-VALE-e1720103436277-1200x812.webp"
};

function resolveSafeArticleImageUrl(article = {}, fallback = "") {
  const sanitizedFallback = sanitizeImageUrl(fallback);
  const slug = String(article?.slug || "").trim().toLowerCase();
  const overrideUrl = heroUnsafeImageOverrides[slug] || "";
  const candidateUrl = String(
    article?.imageUrl || article?.feedImageUrl || article?.sourceImageUrl || fallback || ""
  ).trim();

  if (overrideUrl && /img_6556-1024x723\.jpeg/i.test(candidateUrl)) {
    return sanitizeImageUrl(overrideUrl);
  }

  return sanitizedFallback;
}

const normalizeRuntimeArticle = (article = {}) => {
  article = article || {};
  const title = cleanArticleText(article.title || "Atualizacao");
  const categoryKey = normalizeNewsCategoryKey(article.category, {
    defaultCategory: article.defaultCategory,
    title,
    summary: article.lede || article.summary || article.description,
    sourceName: article.sourceName || article.source || article.sourceLabel
  });
  const category = formatCategoryLabel(categoryKey);
  const sourceName = cleanArticleText(
    article.sourceName || article.source || article.sourceLabel || "Fonte local"
  );
  const sourceUrl = article.sourceUrl || article.url || article.link || "#";
  const rawLede = cleanArticleExcerpt(
    article.lede || article.summary || article.description || "Sem resumo.",
    article.sourceLabel || article.title || "Sem resumo."
  );
  const displaySummary = buildShortArticleSummary(
    rawLede,
    article.sourceLabel || article.title || "Resumo em atualização.",
    172
  );
  const summary = cleanArticleExcerpt(article.summary || article.lede || article.description || rawLede, rawLede);
  const slug = String(article.slug || slugifyText(title) || article.id || "").trim();
  const hasSourceToProbe = Boolean(sourceUrl && sourceUrl !== "#");
  const originalImageUrl = hasSourceToProbe && isGeneratedNewsFallbackImageUrl(article.feedImageUrl || article.imageUrl)
    ? ""
    : String(article.feedImageUrl || article.imageUrl || "");
  const originalSourceImageUrl = hasSourceToProbe && isGeneratedNewsFallbackImageUrl(article.sourceImageUrl)
    ? ""
    : String(article.sourceImageUrl || "");
  const originalFeedImageUrl = originalImageUrl;
  const imageUrl = resolveSafeArticleImageUrl(
    article,
    originalImageUrl ||
      originalFeedImageUrl ||
      extractInlineArticleImage(article) ||
      originalSourceImageUrl
  );

  return {
    ...article,
    id: article.id || slug || sourceUrl || title,
    slug,
    title,
    category,
    categoryKey,
    previewClass: article.previewClass || previewClassByCategory[categoryKey] || "thumb-servico",
    sourceName,
    sourceUrl,
    sourceLabel: cleanArticleText(article.sourceLabel || title),
    rawLede,
    summary,
    lede: displaySummary,
    displaySummary,
    date: formatDisplayDate(article.date || article.publishedAt || article.createdAt || ""),
    originalImageUrl,
    originalSourceImageUrl,
    originalFeedImageUrl,
    imageUrl
  };
};

const parseArticleDate = (value) => {
  const normalized = normalizeText(value).replace("º", "");
  const match = normalized.match(/(\d{1,2}) de ([a-z]+) de (\d{4})/);

  if (!match) {
    return 0;
  }

  const [, day, month, year] = match;
  return new Date(Number(year), monthIndex[month] ?? 0, Number(day)).getTime();
};

const getArticleDateKey = (article = {}) => {
  const rawValue = article.publishedAt || article.date || article.createdAt || "";

  if (!rawValue) {
    return "";
  }

  if (typeof rawValue === "string") {
    const isoMatch = rawValue.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) {
      return isoMatch[1];
    }

    const normalized = normalizeText(rawValue).replace("º", "");
    const longDateMatch = normalized.match(/(\d{1,2}) de ([a-z]+) de (\d{4})/);

    if (longDateMatch) {
      const [, day, month, year] = longDateMatch;
      const monthNumber = String((monthIndex[month] ?? 0) + 1).padStart(2, "0");
      const dayNumber = String(Number(day)).padStart(2, "0");
      return `${year}-${monthNumber}-${dayNumber}`;
    }
  }

  const parsed = new Date(rawValue);
  return Number.isNaN(parsed.getTime()) ? "" : getLocalDateKey(parsed);
};

const getArticleSortTimestamp = (article = {}) =>
  Date.parse(article.publishedAt || article.createdAt || "") || parseArticleDate(article.date || "");

const getRadarArticleKey = (article = {}) => {
  const normalizedArticle = normalizeRuntimeArticle(article);
  const canonicalDateKey = getArticleDateKey(normalizedArticle);
  const canonicalTitleKey = slugifyText(normalizedArticle.title || "");
  const canonicalPairKey = [canonicalTitleKey, canonicalDateKey].filter(Boolean).join("::");

  return (
    canonicalPairKey ||
    normalizedArticle.slug ||
    normalizedArticle.id ||
    normalizeText([normalizedArticle.title, normalizedArticle.date].join(" "))
  );
};

const getRadarRelevanceScore = (article = {}) =>
  radarCategoryRelevance[
    normalizeRuntimeArticle(article).categoryKey || normalizeText(article.category)
  ] || 0;

const getEditorialFlowPriorityScore = (article = {}) => {
  const normalizedArticle = normalizeRuntimeArticle(article);
  const scopeText = getRegionalScopeText(normalizedArticle);
  const categoryKey = normalizedArticle.categoryKey || normalizeText(normalizedArticle.category);
  const prefeituraScore = getPrefeituraJuruaPriorityScore(scopeText);

  if (prefeituraScore) {
    return 10000 + prefeituraScore;
  }

  if (categoryKey === "politica") {
    return 9000;
  }

  if (categoryKey === "acre-governo" || isAcreGovernmentScope(scopeText)) {
    return 8200;
  }

  if (isAcreGeneralScope(scopeText) && categoryKey !== "prefeitura") {
    return 7600;
  }

  return 0;
};

const isMailzaPriorityArticle = (article = {}) => {
  const normalizedArticle = normalizeRuntimeArticle(article);
  const text = normalizeText(
    [
      normalizedArticle.title,
      normalizedArticle.summary,
      normalizedArticle.lede,
      normalizedArticle.description,
      normalizedArticle.category,
      normalizedArticle.categoryKey,
      normalizedArticle.eyebrow,
      normalizedArticle.sourceName,
      normalizedArticle.sourceLabel,
      normalizedArticle.sourceUrl,
      Array.isArray(normalizedArticle.body) ? normalizedArticle.body.join(" ") : normalizedArticle.body
    ].join(" ")
  );

  return /\b(mailza|maisa|mailsa|mailza assis|mailza assis cameli|governadora mailza|governadora em exercicio)\b/.test(text);
};

const getMailzaPriorityScore = (article = {}) =>
  isMailzaPriorityArticle(article) ? 1000000000000 + Number(article.priority || 0) : 0;

const getEditorialRegionalTier = (article = {}) => {
  const normalizedArticle = normalizeRuntimeArticle(article);
  const haystack = normalizeText(
    [
      normalizedArticle.title,
      normalizedArticle.summary,
      normalizedArticle.lede,
      normalizedArticle.description,
      normalizedArticle.category,
      normalizedArticle.categoryKey,
      normalizedArticle.eyebrow,
      normalizedArticle.sourceName,
      normalizedArticle.sourceLabel,
      normalizedArticle.sourceUrl,
      Array.isArray(normalizedArticle.body) ? normalizedArticle.body.join(" ") : normalizedArticle.body
    ].join(" ")
  );

  if (/\b(cruzeiro do sul|cruzeiro-do-sul|cruzeirodosul|czs)\b/.test(haystack)) {
    return "cruzeiro";
  }

  if (
    /\b(vale do jurua|vale do juru[aá]|vale-do-jurua|jurua|juru[aá]|mancio lima|m[âa]ncio lima|rodrigues alves|porto walter|marechal thaumaturgo|tarauaca|tarauac[aá]|jurua24horas|juruaemtempo|juruacomunicacao|tribunadojurua|portaldojurua)\b/.test(
      haystack
    )
  ) {
    return "jurua";
  }

  if (
    /\b(acre|rio branco|sena madureira|feijo|feij[oó]|xapuri|brasileia|brasil[eé]ia|epitaciolandia|epitaciol[aâ]ndia|assis brasil|placido de castro|pl[aá]cido de castro|agencia acre|agencia\.ac|acre\.gov|ac24horas|contilnet|acrenews)\b/.test(
      haystack
    ) ||
    isAcreGeneralScope(haystack) ||
    isAcreGovernmentScope(haystack)
  ) {
    return "acre";
  }

  if (
    /\b(brasil|brasilia|bras[ií]lia|governo federal|stf|senado|camara dos deputados|c[aâ]mara dos deputados|congresso|lula|bolsonaro|ministerio|minist[eé]rio|agencia brasil|ag[eê]ncia brasil|g1|cnn brasil)\b/.test(
      haystack
    )
  ) {
    return "brasil";
  }

  return "global";
};

const editorialRegionalPriority = {
  cruzeiro: 5000,
  jurua: 4200,
  acre: 3200,
  brasil: 900,
  global: 0
};

const getEditorialRegionalPriorityScore = (article = {}) =>
  editorialRegionalPriority[getEditorialRegionalTier(article)] || 0;

const getLocalImpactScopeText = (article = {}) => {
  const normalizedArticle = normalizeRuntimeArticle(article);
  return normalizeText(
    [
      normalizedArticle.title,
      normalizedArticle.summary,
      normalizedArticle.lede,
      normalizedArticle.description,
      normalizedArticle.category,
      normalizedArticle.categoryKey,
      normalizedArticle.eyebrow,
      normalizedArticle.sourceName,
      normalizedArticle.sourceLabel,
      normalizedArticle.sourceUrl,
      Array.isArray(normalizedArticle.body) ? normalizedArticle.body.join(" ") : normalizedArticle.body
    ].join(" ")
  );
};

const hasClearLocalReaderImpact = (article = {}) => {
  const text = getLocalImpactScopeText(article);

  if (!text) {
    return false;
  }

  if (isJuruaRegionalScope(text) || isAcreGeneralScope(text) || isAcreGovernmentScope(text)) {
    return true;
  }

  return /\b(bolsa familia|bolsa família|inss|fgts|pis|pasep|aposentad|beneficio|benefício|auxilio|auxílio|salario minimo|salário mínimo|enem|sisu|prouni|fies|concurso|edital|calendario|calendário|prazo|vacina|sus|energia|tarifa|combustivel|combustível|gasolina|diesel|pix|imposto|declaracao do imposto|declaração do imposto|rodovia|br-364|aeroporto|passagem aerea|passagem aérea|defesa civil|cheia|enchente|alag|seca|chuva|alerta|rio jurua|rio juruá)\b/.test(
    text
  );
};

const isNationalPoliticsArticle = (article = {}) => {
  const normalizedArticle = normalizeRuntimeArticle(article);
  const categoryKey = normalizedArticle.categoryKey || normalizeText(normalizedArticle.category);
  const text = getLocalImpactScopeText(normalizedArticle);
  const hasPoliticsSignal =
    categoryKey === "politica" ||
    /\b(lula|bolsonaro|stf|senado|camara dos deputados|câmara dos deputados|congresso|governo federal|ministro|ministra|eleicao presidencial|eleição presidencial|partido|veto|dosimetria|bras[ií]lia)\b/.test(
      text
    );
  const hasLocalSignal = isJuruaRegionalScope(text) || isAcreGeneralScope(text) || isAcreGovernmentScope(text);

  return hasPoliticsSignal && !hasLocalSignal;
};

const shouldUseNationalPoliticsInHotSurface = (article = {}) =>
  !isNationalPoliticsArticle(article) || hasClearLocalReaderImpact(article);

const compareEditorialFlowArticles = (
  left,
  right,
  { scoreFn = null, imageBias = false } = {}
) => {
  const dateDiff = getArticleSortTimestamp(right) - getArticleSortTimestamp(left);
  if (dateDiff !== 0) {
    return dateDiff;
  }

  const regionalDiff =
    getEditorialRegionalPriorityScore(right) - getEditorialRegionalPriorityScore(left);
  if (regionalDiff !== 0) {
    return regionalDiff;
  }

  const mailzaDiff = getMailzaPriorityScore(right) - getMailzaPriorityScore(left);
  if (mailzaDiff !== 0) {
    return mailzaDiff;
  }

  const editorialFlowDiff =
    getEditorialFlowPriorityScore(right) - getEditorialFlowPriorityScore(left);
  if (editorialFlowDiff !== 0) {
    return editorialFlowDiff;
  }

  if (typeof scoreFn === "function") {
    const scoreDiff = Number(scoreFn(right) || 0) - Number(scoreFn(left) || 0);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
  }

  const priorityDiff = Number(right.priority || 0) - Number(left.priority || 0);
  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  if (imageBias) {
    const imageDiff =
      Number(articleHasUsableImageCandidate(right, "hero")) -
      Number(articleHasUsableImageCandidate(left, "hero"));
    if (imageDiff !== 0) {
      return imageDiff;
    }
  }

  return String(left.title || "").localeCompare(String(right.title || ""), "pt-BR");
};

const articleCategoryGroups = {
  cotidiano: ["cotidiano"],
  prefeitura: ["prefeitura"],
  "acre-governo": ["acre-governo"],
  "governo-estado": ["acre-governo"],
  politica: ["politica"],
  policia: ["policia", "seguranca"],
  saude: ["saude"],
  educacao: ["educacao"],
  negocios: ["negocios", "economia"],
  cultura: ["cultura", "variedades"],
  social: ["social", "festas & social"],
  esporte: ["esporte"]
};

const getArticleCategoryGroup = (filter = "") => {
  const normalizedFilter = normalizeText(filter);
  return articleCategoryGroups[normalizedFilter] || (normalizedFilter ? [normalizedFilter] : []);
};

const articleMatchesCategoryFilter = (article = {}, filter = "") => {
  const normalizedFilter = normalizeText(filter);

  if (!normalizedFilter || normalizedFilter === "todos") {
    return true;
  }

  const normalizedArticle = normalizeRuntimeArticle(article);
  const categoryKey = normalizedArticle.categoryKey || normalizeText(normalizedArticle.category);
  if (normalizedFilter === "prefeitura") {
    return categoryKey === "prefeitura" || isJuruaPrefeituraScope(getRegionalScopeText(normalizedArticle));
  }

  if (normalizedFilter === "acre-governo" || normalizedFilter === "governo-estado") {
    const scopeText = [
      normalizedArticle.title,
      normalizedArticle.summary,
      normalizedArticle.lede,
      normalizedArticle.description,
      normalizedArticle.category,
      normalizedArticle.categoryKey,
      normalizedArticle.eyebrow,
      normalizedArticle.sourceLabel,
      normalizedArticle.sourceUrl
    ].join(" ");
    return (
      categoryKey === "acre-governo" ||
      isAcreGovernmentScope(scopeText) ||
      (isAcreGeneralScope(scopeText) && categoryKey !== "prefeitura")
    );
  }

  return getArticleCategoryGroup(normalizedFilter).includes(categoryKey);
};

const sortRadarArticles = (articles = []) =>
  [...articles].sort((left, right) =>
    compareEditorialFlowArticles(left, right, {
      scoreFn: getRadarRelevanceScore,
      imageBias: true
    })
  );

function getArticleDisplayImageUrl(article = {}, surface = "default") {
  return getArticlePreferredImageUrl(article, surface);
}

function getArticlePreferredImageUrl(article = {}, surface = "default") {
  const candidates = collectArticleImageCandidates(article, surface).filter(
    (candidate) => !isIllustrativeImage({ ...article, imageUrl: candidate })
  );
  return candidates[0] || "";
}

function articleHasUsableImageCandidate(article = {}, surface = "default") {
  return Boolean(getArticlePreferredImageUrl(article, surface));
}

function getArticleImageKey(article = {}, surface = "default") {
  return getImageFingerprint(getArticleDisplayImageUrl(article, surface));
}

const newsSurfaceReservations = {
  topHero: new Set(),
  hero: new Set(),
  social: new Set(),
  cadernos: new Set(),
  monthly: new Set(),
  whatMatters: new Set(),
  dailyBuzz: new Set(),
  archive: new Set(),
  live: new Set(),
  radar: new Set(),
  buzz: new Set(),
  popular: new Set(),
  regional: new Set(),
  regionalPolitics: new Set(),
  globalPolitics: new Set(),
  entertainment: new Set()
};

const newsSurfaceImageReservations = Object.fromEntries(
  Object.keys(newsSurfaceReservations).map((surfaceName) => [surfaceName, new Set()])
);

const getArticleUsageKey = (article = {}) => {
  const normalizedArticle = normalizeRuntimeArticle(article);
  const dateKey = getArticleDateKey(normalizedArticle);
  const storyCluster = getArchiveStoryCluster(normalizedArticle);
  const clusterKey = [storyCluster, dateKey].filter(Boolean).join("::");

  return clusterKey || getRadarArticleKey(normalizedArticle);
};

const reserveSurfaceArticles = (surfaceName = "", articles = []) => {
  if (!surfaceName) {
    return;
  }

  newsSurfaceReservations[surfaceName] = new Set(
    (Array.isArray(articles) ? articles : [])
      .map((article) => getArticleUsageKey(article))
      .filter(Boolean)
  );
  newsSurfaceImageReservations[surfaceName] = new Set(
    (Array.isArray(articles) ? articles : [])
      .map((article) => getArticleImageKey(article))
      .filter(Boolean)
  );
};

const buildReservedArticleKeys = (excludedSurfaces = []) => {
  const excluded = new Set(excludedSurfaces);
  const reserved = new Set();

  Object.entries(newsSurfaceReservations).forEach(([surfaceName, surfaceKeys]) => {
    if (excluded.has(surfaceName) || !(surfaceKeys instanceof Set)) {
      return;
    }

    surfaceKeys.forEach((key) => reserved.add(key));
  });

  return reserved;
};

const buildReservedArticleImageKeys = (excludedSurfaces = []) => {
  const excluded = new Set(excludedSurfaces);
  const reserved = new Set();

  Object.entries(newsSurfaceImageReservations).forEach(([surfaceName, surfaceKeys]) => {
    if (excluded.has(surfaceName) || !(surfaceKeys instanceof Set)) {
      return;
    }

    surfaceKeys.forEach((key) => reserved.add(key));
  });

  return reserved;
};

const pushUniqueArticle = (
  article,
  bucket,
  selectedKeys,
  selectedImages,
  allowDuplicateImages = false
) => {
  const articleKey = getArticleUsageKey(article);
  if (!articleKey || selectedKeys.has(articleKey)) {
    return false;
  }

  const imageKey = getArticleImageKey(article, "hero");
  if (!allowDuplicateImages && imageKey && selectedImages.has(imageKey)) {
    return false;
  }

  selectedKeys.add(articleKey);
  if (imageKey) {
    selectedImages.add(imageKey);
  }
  bucket.push(article);
  return true;
};

const sortMosaicRegionalArticles = (articles = []) =>
  sortRadarArticles(articles);

const addMosaicRegionalPass = (sourceArticles, leadArticles, selectedKeys, selectedImages, targetCount) => {
  sourceArticles.some((article) => {
    if (leadArticles.length >= targetCount) return true;
    pushUniqueArticle(article, leadArticles, selectedKeys, selectedImages);
    return false;
  });
};

const isMosaicLowDisplayArticle = (article = {}) => {
  const normalizedArticle = normalizeRuntimeArticle(article);
  const text = normalizeText(
    [
      normalizedArticle.title,
      normalizedArticle.slug,
      normalizedArticle.category,
      normalizedArticle.categoryKey,
      normalizedArticle.sourceLabel
    ].join(" ")
  );

  return /\b(edital|convocacao|convocação|assembleia geral|licenca ambiental|licença ambiental|comunicado|aviso publico|aviso público)\b/.test(text);
};

const pickRadarLeadArticles = (articles = []) => {
  const targetCount = 13;
  const todayKey = getLocalDateKey();
  const availableDateKeys = [...new Set(articles.map((article) => getArticleDateKey(article)).filter(Boolean))]
    .sort((left, right) => right.localeCompare(left));
  const referenceDateKey = availableDateKeys.find((dateKey) => dateKey <= todayKey) || availableDateKeys[0] || "";
  const normalizedDisplayArticles = articles
    .map((article) => normalizeRuntimeArticle(article))
    .filter((article) => !isMosaicLowDisplayArticle(article));
  const normalizedRegionalArticles = normalizedDisplayArticles.filter((article) => getMosaicRegionalScope(article));
  const sameDayArticle = (article) => getArticleDateKey(article) === referenceDateKey;
  const olderArticle = (article) => !sameDayArticle(article);
  const sameDayArticles = sortMosaicRegionalArticles(
    normalizedRegionalArticles.filter(sameDayArticle)
  );
  const sameDayArticlesWithImage = sameDayArticles.filter((article) =>
    articleHasUsableImageCandidate(article, "hero")
  );
  const sameDayAllArticlesWithImage = sortMosaicRegionalArticles(
    normalizedDisplayArticles.filter(
      (article) => sameDayArticle(article) && articleHasUsableImageCandidate(article, "hero")
    )
  );
  const leadArticles = [];
  const selectedKeys = buildReservedArticleKeys(["hero"]);
  const selectedImages = buildReservedArticleImageKeys(["hero"]);
  const priorityJuruaArticlesWithImage = sortMosaicRegionalArticles(
    normalizedRegionalArticles.filter(
      (article) =>
        getMosaicRegionalScope(article) === "jurua" &&
        isMailzaPriorityArticle(article) &&
        articleHasUsableImageCandidate(article, "hero")
    )
  );
  const priorityAcreArticlesWithImage = sortMosaicRegionalArticles(
    normalizedRegionalArticles.filter(
      (article) =>
        getMosaicRegionalScope(article) === "acre" &&
        isMailzaPriorityArticle(article) &&
        articleHasUsableImageCandidate(article, "hero")
    )
  );
  const juruaArticlesWithImage = sortMosaicRegionalArticles(
    normalizedRegionalArticles.filter(
      (article) =>
        olderArticle(article) &&
        getMosaicRegionalScope(article) === "jurua" &&
        articleHasUsableImageCandidate(article, "hero")
    )
  );
  const acreArticlesWithImage = sortMosaicRegionalArticles(
    normalizedRegionalArticles.filter(
      (article) =>
        olderArticle(article) &&
        getMosaicRegionalScope(article) === "acre" &&
        articleHasUsableImageCandidate(article, "hero")
    )
  );

  addMosaicRegionalPass(
    sameDayArticlesWithImage.filter(
      (article) => getMosaicRegionalScope(article) === "jurua" && isMailzaPriorityArticle(article)
    ),
    leadArticles,
    selectedKeys,
    selectedImages,
    targetCount
  );
  addMosaicRegionalPass(
    sameDayArticlesWithImage.filter((article) => getMosaicRegionalScope(article) === "jurua"),
    leadArticles,
    selectedKeys,
    selectedImages,
    targetCount
  );
  addMosaicRegionalPass(
    sameDayArticlesWithImage.filter(
      (article) => getMosaicRegionalScope(article) === "acre" && isMailzaPriorityArticle(article)
    ),
    leadArticles,
    selectedKeys,
    selectedImages,
    targetCount
  );
  addMosaicRegionalPass(
    sameDayArticlesWithImage.filter((article) => getMosaicRegionalScope(article) === "acre"),
    leadArticles,
    selectedKeys,
    selectedImages,
    targetCount
  );
  addMosaicRegionalPass(sameDayArticlesWithImage, leadArticles, selectedKeys, selectedImages, targetCount);
  addMosaicRegionalPass(sameDayAllArticlesWithImage, leadArticles, selectedKeys, selectedImages, targetCount);

  if (sameDayAllArticlesWithImage.length < targetCount) {
    addMosaicRegionalPass(
      priorityJuruaArticlesWithImage.filter(olderArticle),
      leadArticles,
      selectedKeys,
      selectedImages,
      targetCount
    );
    addMosaicRegionalPass(juruaArticlesWithImage, leadArticles, selectedKeys, selectedImages, targetCount);
    addMosaicRegionalPass(
      priorityAcreArticlesWithImage.filter(olderArticle),
      leadArticles,
      selectedKeys,
      selectedImages,
      targetCount
    );
    addMosaicRegionalPass(acreArticlesWithImage, leadArticles, selectedKeys, selectedImages, targetCount);
  }

  if (leadArticles.length < targetCount) {
    const fallbackArticlesWithImage = sortMosaicRegionalArticles(
      normalizedDisplayArticles.filter(
        (article) =>
          (sameDayAllArticlesWithImage.length < targetCount || sameDayArticle(article)) &&
          !selectedKeys.has(getArticleUsageKey(article)) &&
          articleHasUsableImageCandidate(article, "hero")
      )
    );

    fallbackArticlesWithImage.some((article) => {
      pushUniqueArticle(article, leadArticles, selectedKeys, selectedImages);
      return leadArticles.length >= targetCount;
    });

    if (leadArticles.length < targetCount) {
      sameDayArticlesWithImage.some((article) => {
        if (leadArticles.length >= targetCount) return true;
        pushUniqueArticle(article, leadArticles, selectedKeys, selectedImages, true);
        return false;
      });
    }

    if (leadArticles.length < targetCount) {
      fallbackArticlesWithImage.some((article) => {
        if (leadArticles.length >= targetCount) return true;
        pushUniqueArticle(article, leadArticles, selectedKeys, selectedImages, true);
        return false;
      });
    }
  }

  const selectedReferenceDateKey =
    leadArticles.map((article) => getArticleDateKey(article)).filter(Boolean)[0] || referenceDateKey;

  return { leadArticles, referenceDateKey: selectedReferenceDateKey };
};

const resolveApiBases = () => {
  const bases = [];
  const addBase = (value) => {
    const normalized = String(value || "").trim().replace(/\/$/, "");
    if (!normalized || bases.includes(normalized)) {
      return;
    }
    bases.push(normalized);
  };
  const localBaseCandidates = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8787",
    "http://127.0.0.1:8787"
  ];
  const configuredBases = Array.isArray(window.CATALOGO_API_BASES) ? window.CATALOGO_API_BASES : [];
  const configuredBase =
    typeof window.CATALOGO_API_BASE === "string" && window.CATALOGO_API_BASE
      ? window.CATALOGO_API_BASE
      : "";
  const localHostPattern = /^(localhost|127(?:\.\d{1,3}){3})$/i;
  const isLocalHttp = window.location.protocol.startsWith("http") && localHostPattern.test(window.location.hostname);
  const isFileMode = window.location.protocol === "file:";
  const currentOrigin = String(window.location.origin || "").trim().replace(/\/$/, "");
  const isLocalLikeBase = (value) => {
    const normalized = String(value || "").trim().replace(/\/$/, "");

    if (!normalized) {
      return false;
    }

    try {
      const parsed = new URL(normalized);
      return localHostPattern.test(parsed.hostname);
    } catch (_error) {
      return false;
    }
  };

  if (!isFileMode && !isLocalHttp) {
    addBase(currentOrigin);
  }

  if (isLocalHttp) {
    addBase(currentOrigin);
  }

  configuredBases.forEach((base) => {
    if (isFileMode || base === currentOrigin || (!isLocalHttp && isLocalLikeBase(base))) {
      addBase(base);
    }
  });
  if (isFileMode || configuredBase === currentOrigin || (!isLocalHttp && isLocalLikeBase(configuredBase))) {
    addBase(configuredBase);
  }

  if (window.location.protocol.startsWith("http")) {
    addBase(currentOrigin);
  } else {
    localBaseCandidates.forEach(addBase);
  }

  if (isFileMode) {
    localBaseCandidates.forEach(addBase);
  }

  return bases.length ? bases : localBaseCandidates;
};

const rememberApiBase = (base = "") => {
  const normalized = String(base || "").trim().replace(/\/$/, "");
  if (!normalized) {
    return;
  }

  window.CATALOGO_API_BASE = normalized;
  window.CATALOGO_API_BASES = [normalized].concat(
    (Array.isArray(window.CATALOGO_API_BASES) ? window.CATALOGO_API_BASES : []).filter(
      (candidate) => String(candidate || "").trim().replace(/\/$/, "") !== normalized
    )
  );

  try {
    localStorage.setItem("catalogo_api_base", normalized);
  } catch {
    // ignore
  }
};

async function requestApiJson(path, options = {}) {
  const nextHeaders = { ...(options.headers || {}) };

  if (options.body && !nextHeaders["Content-Type"]) {
    nextHeaders["Content-Type"] = "application/json";
  }

  if (!nextHeaders.Accept) {
    nextHeaders.Accept = "application/json";
  }

  let lastError = null;
  const bases = resolveApiBases();

  for (let index = 0; index < bases.length; index += 1) {
    const apiBase = bases[index];

    try {
      const response = await fetch(`${apiBase}${path}`, {
        ...options,
        headers: nextHeaders
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = payload.error || payload.message || `Falha em ${path}`;
        const canRetry = (response.status === 404 || response.status === 405) && index < bases.length - 1;

        if (canRetry) {
          lastError = new Error(message);
          continue;
        }

        throw new Error(message);
      }

      const contentType = String(response.headers.get("content-type") || "").toLowerCase();
      if (!contentType.includes("json")) {
        const invalidPayloadError = new Error(`Resposta invalida em ${path}`);
        if (index < bases.length - 1) {
          lastError = invalidPayloadError;
          continue;
        }
        throw invalidPayloadError;
      }

      const payload = await response.json().catch(() => null);
      if (!payload || typeof payload !== "object") {
        const invalidPayloadError = new Error(`Resposta invalida em ${path}`);
        if (index < bases.length - 1) {
          lastError = invalidPayloadError;
          continue;
        }
        throw invalidPayloadError;
      }

      rememberApiBase(apiBase);
      return payload;
    } catch (error) {
      lastError = error;

      if (!(error instanceof TypeError) || index >= bases.length - 1) {
        break;
      }
    }
  }

  throw lastError || new Error(`Falha em ${path}`);
}

const copyTextToClipboard = async (value = "") => {
  const text = String(value || "").trim();
  if (!text) {
    return false;
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_error) {
    // Continua para o fallback abaixo.
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "readonly");
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  document.body.appendChild(helper);
  helper.select();
  const copied = document.execCommand("copy");
  helper.remove();
  return copied;
};

const heroTourismDailyPoolState = {
  dayKey: "",
  items: []
};

const heroTourismDailyTarget = 10;
const heroTourismRotationIntervalMs = 4000;
const heroTourismDailyTimeZone = "America/Rio_Branco";
const heroTourismLocalPattern =
  /\b(cruzeiro do sul|vale do jurua|vale do juruá|jurua|juruá|acre|mancio lima|mâncio lima|rodrigues alves)\b/i;
const heroTourismFocusPositions = [
  "center 42%",
  "center 36%",
  "center 48%",
  "center 30%",
  "center 54%",
  "center 40%",
  "center 46%",
  "center 34%"
];
const heroDailyThemeOrder = [
  "games",
  "prefeitura",
  "politica",
  "acre-governo",
  "policia",
  "saude",
  "educacao",
  "esporte",
  "negocios",
  "cultura",
  "social",
  "cotidiano"
];
const heroDailyAreaLabels = {
  politica: "Politica",
  prefeitura: "Prefeitura",
  policia: "Policia",
  saude: "Saude",
  educacao: "Educacao",
  esporte: "Esporte",
  negocios: "Negocios",
  cultura: "Cultura",
  social: "Social",
  cotidiano: "Cotidiano",
  comunidade: "Comunidade",
  servicos: "Serviços",
  entretenimento: "Entretenimento",
  games: "Jogos",
  infantil: "Infantil",
  estudantes: "Estudantil",
  acre: "Acre",
  trending: "Tendências"
};

const ensureMobileHomeLeadLayout = () => {
  if (!document.body.classList.contains("editorial-home")) {
    return;
  }

  const isMobile = mobileHomeLeadMedia?.matches;
  const siteHeaderStack = document.querySelector(".site-header-stack");
  const masthead = document.querySelector(".masthead");
  const mainNav = document.querySelector(".main-nav");
  const editorialStrip = document.querySelector(".header-services-strip");
  const mainLayout = document.querySelector(".main-layout");
  const heroShell = document.querySelector(".hero-newsroom-shell.hero-restored-shell");
  const officePlayStrip = document.querySelector(".office-play-strip");

  if (!siteHeaderStack || !masthead || !mainLayout || !heroShell) {
    return;
  }

  const moveAfterHero = [
    document.querySelector(".top-strip"),
    document.querySelector(".device-version-notice"),
    document.querySelector(".top-construction-yard"),
    document.querySelector(".ticker-live-shell"),
    document.querySelector(".header-services-strip")
  ].filter(Boolean);

  if (isMobile) {
    if (!mobileHomeDomState.menuDropdown) {
      const dropdown = document.createElement("details");
      dropdown.className = "mobile-main-nav-dropdown";
      dropdown.setAttribute("aria-label", "Menu principal do portal");
      dropdown.innerHTML = `<summary><span>Áreas</span><small>toque para abrir</small><i aria-hidden="true"></i></summary><div class="mobile-main-nav-links"></div>`;
      mobileHomeDomState.menuDropdown = dropdown;
    }

    const mobileLinksWrap = mobileHomeDomState.menuDropdown.querySelector(".mobile-main-nav-links");
    if (mobileLinksWrap) {
      const mobileEditorialPriority = [
        "#radar",
        "#acre-destaque",
        "#politica-global",
        "#entretenimento",
        "#social",
        "./lifestile.html",
        "#trending",
        "#panorama",
        "#arquivo"
      ];
      const stripLinks = editorialStrip
        ? [...editorialStrip.querySelectorAll("a[href]")].map((anchor) => ({
            href: anchor.getAttribute("href") || "",
            label: anchor.textContent?.trim() || ""
          }))
        : [];
      const editorialLinks = mobileEditorialPriority
        .map((targetHref) => stripLinks.find((link) => link.href === targetHref))
        .filter((link) => link?.href && link?.label)
        .map(
          (link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`
        );

      mobileLinksWrap.innerHTML = editorialLinks.join("");
    }

    if (!mobileHomeDomState.initialized) {
      moveAfterHero.forEach((node) => {
        const marker = document.createComment(`mobile-home-placeholder-${node.className || node.tagName}`);
        node.parentNode?.insertBefore(marker, node);
        mobileHomeDomState.placeHolders.set(node, marker);
      });

      mobileHomeDomState.movedNodes = moveAfterHero;
      mobileHomeDomState.initialized = true;
    }

    if (!masthead.contains(mobileHomeDomState.menuDropdown)) {
      masthead.appendChild(mobileHomeDomState.menuDropdown);
    }

    const anchorNode = officePlayStrip || heroShell.nextSibling;
    moveAfterHero.forEach((node) => {
      if (node.parentNode !== mainLayout) {
        mainLayout.insertBefore(node, anchorNode);
      }
    });
    return;
  }

  if (mobileHomeDomState.menuDropdown && masthead.contains(mobileHomeDomState.menuDropdown)) {
    mobileHomeDomState.menuDropdown.remove();
  }

  mobileHomeDomState.movedNodes.forEach((node) => {
    const placeholder = mobileHomeDomState.placeHolders.get(node);
    if (placeholder?.parentNode) {
      placeholder.parentNode.insertBefore(node, placeholder.nextSibling);
    }
  });
};
const heroDailyPersonFocusPattern =
  /\b(presidente|governador|governadora|prefeito|prefeita|senador|senadora|deputado|deputada|vereador|vereadora|delegado|delegada|secretario|secretaria|ministro|ministra|professor|professora|aluno|aluna|estudante|atleta|jogador|jogadora|cantor|cantora|artista|influencer|criador|criadora|empresario|empresaria|medico|medica|familia|mulher|homem|pessoa|equipe|time|colegio|posse|reuniao|entrevista)\b/;

const normalizeHeroSafeFocusPosition = (focusPosition = "", { hasPeople = false } = {}) => {
  const rawFocus = String(focusPosition || "").trim();
  const fallback = hasPeople ? "center 32%" : "center 38%";
  if (!rawFocus) {
    return fallback;
  }

  const tokens = rawFocus.split(/\s+/).filter(Boolean);
  const xToken = tokens[0] || "center";
  const yToken = tokens[1] || "";
  const yMatch = yToken.match(/^(-?\d+(?:\.\d+)?)%$/);

  if (!yMatch) {
    return rawFocus;
  }

  const yValue = Number(yMatch[1]);
  if (!Number.isFinite(yValue)) {
    return fallback;
  }

  const safeMin = hasPeople ? 24 : 28;
  const safeMax = hasPeople ? 52 : 60;
  const safeY = Math.min(safeMax, Math.max(safeMin, yValue));
  return `${xToken} ${safeY}%`;
};

const getHeroTourismDayKey = () => {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: heroTourismDailyTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());
  } catch (_error) {
    return getLocalDateKey();
  }
};

const hashHeroTourismSeed = (value = "") => {
  let hash = 2166136261;
  const text = String(value || "");

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const buildDailyOrderedHeroItems = (items = []) =>
  [...(Array.isArray(items) ? items : [])];

const getHeroDailyArticleFocus = (article = {}) => {
  const manualFocus = resolveArticleImageFocus(article, "").trim();
  const haystack = normalizeText(
    [article.title, article.lede, article.summary, article.category, article.sourceName].join(" ")
  );
  const hasPeople = heroDailyPersonFocusPattern.test(haystack);

  if (manualFocus) {
    return normalizeHeroSafeFocusPosition(manualFocus, { hasPeople });
  }

  if (hasPeople) {
    return "center 32%";
  }

  return "center 38%";
};

const buildHeroArticleHref = (article = {}) =>
  article.slug ? `./noticia.html?slug=${encodeURIComponent(article.slug)}` : article.sourceUrl || "#radar";

const getHeroAreaKey = (article = {}) => {
  const categoryKey = normalizeText(article.categoryKey || article.category || "");
  const haystack = normalizeText(
    [article.title, article.lede, article.summary, article.category, article.sourceName, article.sourceLabel].join(" ")
  );

  if (/(prefeitura|municipio|municipal|secretaria)/.test(categoryKey) || /\b(prefeitura|secretaria|municipal|bocalom)\b/.test(haystack)) {
    return "prefeitura";
  }
  if (/(politica|eleic|govern|senad|deput|veread)/.test(categoryKey) || /\b(eleic|governador|senador|deputad|vereador|politic|partido|aleac)\b/.test(haystack)) {
    return "politica";
  }
  if (/(policia|seguranca|segurança)/.test(categoryKey) || /\b(policia|delegacia|operacao|prisao|homicidio|seguranca)\b/.test(haystack)) {
    return "policia";
  }
  if (/(saude|saúde)/.test(categoryKey) || /\b(saude|hospital|ubs|vacina|medic|atendimento)\b/.test(haystack)) {
    return "saude";
  }
  if (/(educacao|educação|estudo|study)/.test(categoryKey) || /\b(escola|enem|vestibular|aluno|estudante|ifac|educacao)\b/.test(haystack)) {
    return "educacao";
  }
  if (/(esporte|sports)/.test(categoryKey) || /\b(futebol|campeonato|partida|esporte|atleta|time)\b/.test(haystack)) {
    return "esporte";
  }
  if (/(negocios|negócios|economia|comercio|comércio)/.test(categoryKey) || /\b(comercio|empresa|negocio|feira|mercado|empreendedor)\b/.test(haystack)) {
    return "negocios";
  }
  if (/(cultura|arte|evento|agenda)/.test(categoryKey) || /\b(show|teatro|cultura|festival|oficina|agenda)\b/.test(haystack)) {
    return "cultura";
  }
  if (/(social|festa|celebridade)/.test(categoryKey) || /\b(festa|social|aniversario|casamento|ensaio)\b/.test(haystack)) {
    return "social";
  }
  if (/(games|jogos)/.test(categoryKey)) {
    return "games";
  }
  if (/(kids|infantil)/.test(categoryKey)) {
    return "infantil";
  }
  if (/(study|estud)/.test(categoryKey)) {
    return "estudantes";
  }
  if (/(trending|buzz|viral)/.test(categoryKey)) {
    return "trending";
  }
  return categoryKey || "cotidiano";
};

const buildHeroTourismRuntimePool = () => {
  const articles = Array.isArray(window.NEWS_DATA) ? sortRadarArticles(window.NEWS_DATA) : [];
  const seenImages = new Set();
  const todayKey = getHeroTourismDayKey();
  const normalizedArticles = articles
    .map((article) => normalizeRuntimeArticle(article))
    .filter((article) => {
      const haystack = [
        article.title,
        article.lede,
        article.category,
        article.sourceName,
        article.sourceLabel
      ]
        .filter(Boolean)
        .join(" ");
      return heroTourismLocalPattern.test(haystack);
    });
  const todaysArticles = normalizedArticles.filter(
    (article) => getArticleDateKey(article) === todayKey
  );
  const sourceArticles = todaysArticles.length >= 3 ? todaysArticles : normalizedArticles;

  return sourceArticles
    .filter((article) => {
      const areaKey = getHeroAreaKey(article);
      const imageUrl = sanitizeImageUrl(getArticleDisplayImageUrl(article, "hero"));
      const imageKey = String(imageUrl || "").trim();
      if (!areaKey || !imageKey || seenImages.has(imageKey)) {
        return false;
      }

      seenImages.add(imageKey);
      return true;
    })
    .map((article) => {
      const areaKey = getHeroAreaKey(article);
      const imageUrl = sanitizeImageUrl(getArticleDisplayImageUrl(article, "hero"));
      const storyText = normalizeText(
        [article.title, article.lede, article.summary, article.category, article.sourceName].join(" ")
      );
      return {
        title: heroDailyAreaLabels[areaKey] || article.category || "Area em destaque",
        note: truncateCopy(article.sourceName || article.sourceLabel || "Fonte local", 46),
        proxyUrl: imageUrl,
        fallbackUrl: imageUrl,
        focusPosition: getHeroDailyArticleFocus(article),
        hasPeopleScene: heroDailyPersonFocusPattern.test(storyText),
        articleTitle: article.title || "Notícia em destaque",
        articleCategory: heroDailyAreaLabels[areaKey] || article.category || "Area em destaque",
        articleSummary: truncateCopy(article.displaySummary || article.lede || "Resumo da notícia em destaque.", 138),
        articleHref: buildHeroArticleHref(article),
        themeKey: areaKey,
        sourceName: article.sourceName || "Fonte local"
      };
    })
    .filter((photo) => {
      const imageKey = String(photo?.proxyUrl || "").trim();
      if (!imageKey || seenImages.has(imageKey)) {
        return true;
      }
      return true;
    })
    .slice(0, heroTourismDailyTarget);
};

const buildHeroTourismFallbackPool = () => {
  const articles = Array.isArray(window.NEWS_DATA) ? sortRadarArticles(window.NEWS_DATA) : [];
  const seenKeys = new Set();
  const normalizedArticles = articles
    .map((article) => normalizeRuntimeArticle(article))
    .filter((article) => {
      const haystack = [
        article.title,
        article.lede,
        article.summary,
        article.category,
        article.sourceName,
        article.sourceLabel
      ]
        .filter(Boolean)
        .join(" ");
      return heroTourismLocalPattern.test(haystack);
    });
  return buildDailyOrderedHeroItems(
    normalizedArticles.slice(0, heroTourismDailyTarget * 4),
    `${getHeroTourismDayKey()}:fallback-areas`
  )
    .filter((article) => {
      const areaKey = getHeroAreaKey(article);
      const imageUrl = sanitizeImageUrl(getArticleDisplayImageUrl(article, "hero"));
      const storyKey = getRadarArticleKey(article);
      if (!areaKey || !imageUrl || seenKeys.has(storyKey)) {
        return false;
      }
      seenKeys.add(storyKey);
      return true;
    })
    .map((article) => {
      const areaKey = getHeroAreaKey(article);
      const imageUrl = sanitizeImageUrl(getArticleDisplayImageUrl(article, "hero"));
      const storyText = normalizeText(
        [article.title, article.lede, article.summary, article.category, article.sourceName].join(" ")
      );
      return {
        title: heroDailyAreaLabels[areaKey] || article.category || "Area em destaque",
        note: truncateCopy(article.sourceName || article.sourceLabel || "Fonte local", 46),
        proxyUrl: imageUrl,
        fallbackUrl: imageUrl,
        focusPosition: getHeroDailyArticleFocus(article),
        hasPeopleScene: heroDailyPersonFocusPattern.test(storyText),
        articleTitle: article.title || "Notícia em destaque",
        articleCategory: heroDailyAreaLabels[areaKey] || article.category || "Area em destaque",
        articleSummary: truncateCopy(article.displaySummary || article.lede || "Resumo da notícia em destaque.", 138),
        articleHref: buildHeroArticleHref(article),
        themeKey: areaKey,
        sourceName: article.sourceName || "Fonte local"
      };
    });
};

const buildHeroTourismDailyPool = () => {
  const dayKey = getHeroTourismDayKey();
  if (heroTourismDailyPoolState.dayKey === dayKey && heroTourismDailyPoolState.items.length) {
    return heroTourismDailyPoolState.items;
  }

  const merged = [];
  const seenKeys = new Set();
  const featuredPool = (Array.isArray(window.NEWS_DATA) ? window.NEWS_DATA : [])
    .map((article) => normalizeRuntimeArticle(article))
    .filter((article) => article.heroFeatured || article.featuredHero)
    .map((article) => {
      const imageUrl = sanitizeImageUrl(getArticleDisplayImageUrl(article, "hero"));
      return {
        title: article.category || "Destaque autoral",
        note: truncateCopy(article.sourceName || "Catálogo Cruzeiro do Sul", 46),
        proxyUrl: imageUrl,
        fallbackUrl: imageUrl,
        focusPosition: getHeroDailyArticleFocus(article),
        hasPeopleScene: false,
        articleTitle: article.title || "Matéria autoral em destaque",
        articleCategory: article.category || "Destaque autoral",
        articleSummary: truncateCopy(article.displaySummary || article.lede || "Artigo autoral em destaque.", 138),
        articleHref: buildHeroArticleHref(article),
        themeKey: getHeroAreaKey(article),
        sourceName: article.sourceName || "Catálogo Cruzeiro do Sul"
      };
    })
    .filter((item) => item.proxyUrl && item.articleHref);
  const runtimePool = buildDailyOrderedHeroItems(buildHeroTourismRuntimePool(), `${dayKey}:runtime`);

  const pushUniquePhoto = (photo = {}) => {
    const sourceKey = String(photo.proxyUrl || photo.fallbackUrl || photo.file || photo.title || "").trim();
    if (!sourceKey || seenKeys.has(sourceKey)) {
      return false;
    }

    seenKeys.add(sourceKey);
    merged.push({
      ...photo,
      focusPosition:
        photo.focusPosition || heroTourismFocusPositions[merged.length % heroTourismFocusPositions.length]
    });
    return true;
  };

  runtimePool.forEach((photo) => pushUniquePhoto(photo));
  if (merged.length < heroTourismDailyTarget) {
    featuredPool.forEach((photo) => {
      if (merged.length < heroTourismDailyTarget) {
        pushUniquePhoto(photo);
      }
    });
  }
  if (merged.length < heroTourismDailyTarget) {
    const fallbackPool = buildHeroTourismFallbackPool();
    fallbackPool.forEach((photo) => {
      if (merged.length < heroTourismDailyTarget) {
        pushUniquePhoto(photo);
      }
    });
  }

  heroTourismDailyPoolState.dayKey = dayKey;
  heroTourismDailyPoolState.items = merged.slice(0, heroTourismDailyTarget);
  return heroTourismDailyPoolState.items;
};

const getHeroTourismDailyPool = () => buildHeroTourismDailyPool();

const preloadHeroTourismImage = (primaryUrl = "", fallbackUrl = "") =>
  new Promise((resolve) => {
    const candidates = [primaryUrl, fallbackUrl].filter(Boolean);

    const tryLoad = (index = 0) => {
      const targetUrl = candidates[index];
      if (!targetUrl) {
        resolve("");
        return;
      }

      const loader = new Image();
      loader.decoding = "async";
      loader.loading = "eager";

      loader.onload = () => {
        const finalize = () => resolve(targetUrl);
        if (typeof loader.decode === "function") {
          loader.decode().catch(() => {}).finally(finalize);
          return;
        }
        finalize();
      };

      loader.onerror = () => tryLoad(index + 1);
      loader.src = targetUrl;
    };

    tryLoad(0);
  });

const getHeroTourismPhoto = (photoIndex = 0) => {
  const dailyPool = buildHeroTourismDailyPool();
  if (!dailyPool.length) {
    return null;
  }

  const poolIndex =
    ((Number(photoIndex) % dailyPool.length) + dailyPool.length) % dailyPool.length;
  return dailyPool[poolIndex];
};

const getHeroStoryKey = (item = {}) =>
  normalizeText(
    item.articleHref ||
      item.articleTitle ||
      item.title ||
      item.proxyUrl ||
      item.fallbackUrl ||
      ""
  );

const getHeroPoolReservationArticles = (items = []) =>
  (Array.isArray(items) ? items : [])
    .map((item) => {
      const slug = getSlugFromHref(item.articleHref || "");
      const matchedArticle = slug && window.NEWS_MAP ? window.NEWS_MAP[slug] : null;
      if (matchedArticle) {
        return matchedArticle;
      }

      return item.articleTitle
        ? {
            slug,
            title: item.articleTitle,
            summary: item.articleSummary || item.note || "",
            category: item.articleCategory || item.title || "",
            sourceName: item.sourceName || "",
            publishedAt: item.publishedAt || item.date || item.createdAt || ""
          }
        : null;
    })
    .filter(Boolean);

const getNextHeroPoolItem = (currentItem = {}, offset = 1) => {
  const pool = buildHeroTourismDailyPool();
  if (pool.length < 2) {
    return null;
  }

  const currentKey = getHeroStoryKey(currentItem);
  const currentIndex = Math.max(
    pool.findIndex((item) => getHeroStoryKey(item) === currentKey),
    0
  );

  for (let step = offset; step < pool.length + offset; step += 1) {
    const candidate = pool[(currentIndex + step) % pool.length];
    if (candidate && getHeroStoryKey(candidate) !== currentKey) {
      return candidate;
    }
  }

  return null;
};

const setHeroTourismMeta = (photo) => {
  if (!photo) {
    return;
  }

  const dailyPhoto = getNextHeroPoolItem(photo, 1) || photo;

  if (heroTourismKicker) {
    heroTourismKicker.textContent = photo.articleCategory || photo.title || "Area em destaque";
  }

  if (heroTourismTitle) {
    heroTourismTitle.textContent =
      photo.articleTitle || photo.title || "Notícia principal em destaque";
  }

  if (heroTourismNote) {
    heroTourismNote.textContent =
      truncateCopy(
        photo.articleSummary || photo.note || photo.sourceName || "Resumo da notícia principal da área selecionada.",
        180
      );
  }

  if (heroDailyNewsCard) {
    heroDailyNewsCard.href = dailyPhoto.articleHref || "#radar";
  }

  if (heroTourismMetaLink) {
    const href = photo.articleHref || "#radar";
    heroTourismMetaLink.href = href;
    applyArticleLinkAttrs(heroTourismMetaLink, href);
  }

  if (heroDailyNewsCategory) {
    heroDailyNewsCategory.textContent = dailyPhoto.articleCategory || "Area em destaque";
  }

  if (heroDailyNewsTitle) {
    heroDailyNewsTitle.textContent = dailyPhoto.articleTitle || dailyPhoto.title || "Notícia em destaque";
  }

  if (heroDailyNewsSummary) {
    heroDailyNewsSummary.textContent =
      truncateCopy(
        dailyPhoto.articleSummary || dailyPhoto.note || "Resumo da notícia principal selecionada para este assunto.",
        132
      );
  }
};

const renderHeroDesktopHighlights = (items = []) => {
  if (!heroTopicCards.length) {
    return;
  }

  const safeItems = Array.isArray(items) ? items.filter(Boolean).slice(0, heroTopicCards.length) : [];
  heroDesktopHighlightItems = safeItems;

  heroTopicCards.forEach((card, index) => {
    const item = safeItems[index];
    const categoryNode = card.querySelector("[data-hero-topic-category]");
    const titleNode = card.querySelector("[data-hero-topic-title]");
    const summaryNode = card.querySelector("[data-hero-topic-summary]");
    const photoNode = card.querySelector("[data-hero-topic-photo]");

    if (!item) {
      card.hidden = true;
      return;
    }

    card.hidden = false;
    card.href = item.articleHref || "#radar";

    if (categoryNode) {
      categoryNode.textContent = item.articleCategory || item.title || "Area em destaque";
    }

    if (titleNode) {
      titleNode.textContent = truncateCopy(
        item.articleTitle || item.title || "Noticia principal do dia",
        86
      );
    }

    if (summaryNode) {
      summaryNode.textContent = truncateCopy(
        item.articleSummary || item.note || "Resumo curto do destaque mais importante deste assunto.",
        120
      );
    }

    if (photoNode) {
      const imageUrl = item.proxyUrl || item.fallbackUrl || "";
      photoNode.style.backgroundImage = imageUrl
        ? `linear-gradient(180deg, rgba(8, 20, 38, 0.04), rgba(8, 20, 38, 0.3)), url("${imageUrl}")`
        : "linear-gradient(135deg, rgba(64, 109, 160, 0.7), rgba(15, 39, 66, 0.92))";
      photoNode.style.backgroundPosition = normalizeHeroSafeFocusPosition(item.focusPosition, {
        hasPeople: Boolean(item.hasPeopleScene)
      });
      photoNode.style.backgroundSize = "cover";
    }
  });

  heroTourismRotation.activeTopicIndex = 0;
  syncHeroDesktopCarousel(0);
  mountHeroDesktopCarouselDots(safeItems.length);
};

const shouldUseLiteHomeRuntime = () => {
  const narrowViewport = window.matchMedia("(max-width: 640px)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = Boolean(connection?.saveData);
  const slowConnection = /2g/.test(String(connection?.effectiveType || ""));
  return narrowViewport || reducedMotion || saveData || slowConnection;
};

const stopHeroOfficeTv = () => {
  if (heroOfficeTvTimerId) {
    window.clearInterval(heroOfficeTvTimerId);
    heroOfficeTvTimerId = 0;
  }
};

const shouldAnimateHeroOfficeTv = () => {
  const reducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return !reducedMotion && !connection?.saveData && heroOfficeTvItems.length > 1;
};

const getHeroOfficeTvCanvasMetrics = () => {
  if (!heroOfficeTvCanvas) {
    return null;
  }

  const rect = heroOfficeTvCanvas.getBoundingClientRect();
  const width = Math.max(160, Math.round(rect.width || 320));
  const height = Math.max(94, Math.round(rect.height || 190));
  const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);

  if (heroOfficeTvCanvas.width !== pixelWidth || heroOfficeTvCanvas.height !== pixelHeight) {
    heroOfficeTvCanvas.width = pixelWidth;
    heroOfficeTvCanvas.height = pixelHeight;
  }

  const context = heroOfficeTvCanvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { context, width, height };
};

const wrapHeroOfficeTvText = (context, text = "", maxWidth = 220, maxLines = 2) => {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(testLine).width <= maxWidth || !currentLine) {
      currentLine = testLine;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length > maxLines) {
    const trimmed = lines.slice(0, maxLines);
    let lastLine = trimmed[trimmed.length - 1] || "";
    while (lastLine.length > 4 && context.measureText(`${lastLine}...`).width > maxWidth) {
      lastLine = lastLine.slice(0, -1).trim();
    }
    trimmed[trimmed.length - 1] = `${lastLine.replace(/[.,;:!?-]+$/g, "")}...`;
    return trimmed;
  }

  return lines;
};

const drawHeroOfficeTvItem = (item = {}, image = null, index = 0) => {
  const metrics = getHeroOfficeTvCanvasMetrics();
  if (!metrics) {
    return;
  }

  const { context, width, height } = metrics;
  context.clearRect(0, 0, width, height);

  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#123b68");
  background.addColorStop(0.55, "#0c2748");
  background.addColorStop(1, "#071a32");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  if (image?.naturalWidth && image?.naturalHeight) {
    const imageRatio = image.naturalWidth / image.naturalHeight;
    const canvasRatio = width / height;
    let sx = 0;
    let sy = 0;
    let sw = image.naturalWidth;
    let sh = image.naturalHeight;

    if (imageRatio > canvasRatio) {
      sw = image.naturalHeight * canvasRatio;
      sx = (image.naturalWidth - sw) / 2;
    } else {
      sh = image.naturalWidth / canvasRatio;
      sy = (image.naturalHeight - sh) / 2;
    }

    context.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
  } else {
    context.fillStyle = "rgba(94, 185, 255, 0.18)";
    for (let line = -height; line < width; line += 18) {
      context.fillRect(line, 0, 5, height);
    }
  }

  const shade = context.createLinearGradient(0, 0, 0, height);
  shade.addColorStop(0, "rgba(4, 12, 24, 0.06)");
  shade.addColorStop(0.52, "rgba(4, 12, 24, 0.34)");
  shade.addColorStop(1, "rgba(4, 12, 24, 0.9)");
  context.fillStyle = shade;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "rgba(186, 224, 255, 0.16)";
  for (let y = 0; y < height; y += 4) {
    context.fillRect(0, y, width, 1);
  }

  const pad = Math.max(12, width * 0.07);
  const category = truncateCopy(item.category || "Destaque captado", 24).toUpperCase();
  const title = truncateCopy(item.title || "Atualização local em destaque", 82);

  context.fillStyle = "rgba(238, 248, 255, 0.92)";
  context.font = "800 10px Arial, sans-serif";
  context.letterSpacing = "1px";
  context.fillText("TV DESTAQUES", pad, pad + 3);

  context.fillStyle = "#9ee2ff";
  context.font = "900 9px Arial, sans-serif";
  context.fillText(category, pad, height - 58);

  context.fillStyle = "#ffffff";
  context.font = "900 15px Arial, sans-serif";
  wrapHeroOfficeTvText(context, title, width - pad * 2, 2).forEach((line, lineIndex) => {
    context.fillText(line, pad, height - 34 + lineIndex * 17);
  });

  const total = Math.max(heroOfficeTvItems.length, 1);
  const dotStart = width - pad - total * 10;
  for (let dotIndex = 0; dotIndex < total; dotIndex += 1) {
    context.beginPath();
    context.arc(dotStart + dotIndex * 10, pad, 2.5, 0, Math.PI * 2);
    context.fillStyle = dotIndex === index ? "#6cf29a" : "rgba(238, 248, 255, 0.38)";
    context.fill();
  }
};

const paintHeroOfficeTvItem = (index = 0) => {
  if (!heroOfficeTvCanvas || !heroOfficeTvItems.length || !isMobileHomeViewport()) {
    return;
  }

  const safeIndex = ((index % heroOfficeTvItems.length) + heroOfficeTvItems.length) % heroOfficeTvItems.length;
  const item = heroOfficeTvItems[safeIndex];
  heroOfficeTvCursor = safeIndex;
  heroOfficeTvPaintToken += 1;
  const paintToken = heroOfficeTvPaintToken;

  if (heroOfficeTvCaption) {
    heroOfficeTvCaption.textContent = truncateCopy(item.title || "Destaques captados", 42);
  }

  if (!item.imageUrl) {
    drawHeroOfficeTvItem(item, null, safeIndex);
    return;
  }

  const image = new Image();
  image.decoding = "async";
  image.onload = () => {
    if (paintToken === heroOfficeTvPaintToken) {
      drawHeroOfficeTvItem(item, image, safeIndex);
    }
  };
  image.onerror = () => {
    if (paintToken === heroOfficeTvPaintToken) {
      drawHeroOfficeTvItem(item, null, safeIndex);
    }
  };
  image.src = item.imageUrl;
};

const renderHeroOfficeTv = (items = []) => {
  heroOfficeTvSourceItems = Array.isArray(items) ? items.filter(Boolean) : [];

  if (!heroOfficeTvCanvas || !heroOfficeTvFrame) {
    return;
  }

  stopHeroOfficeTv();
  const mobileActive = isMobileHomeViewport();
  heroOfficeTvFrame.hidden = !mobileActive;

  if (!mobileActive) {
    return;
  }

  heroOfficeTvItems = heroOfficeTvSourceItems
    .map((item) => normalizeRuntimeArticle(item))
    .map((article) => ({
      title: article.articleTitle || article.title || "Atualização local em destaque",
      category: article.articleCategory || article.category || article.topicGroup || "Destaques",
      imageUrl: sanitizeImageUrl(
        getArticleDisplayImageUrl(article, "hero") ||
          article.proxyUrl ||
          article.fallbackUrl ||
          article.imageUrl ||
          ""
      )
    }))
    .filter((item) => item.title || item.imageUrl)
    .slice(0, 4);

  if (!heroOfficeTvItems.length) {
    heroOfficeTvItems = [
      {
        title: "Destaques captados ao vivo",
        category: "Cobertura local",
        imageUrl: ""
      }
    ];
  }

  window.requestAnimationFrame(() => paintHeroOfficeTvItem(0));

  if (shouldAnimateHeroOfficeTv()) {
    heroOfficeTvTimerId = window.setInterval(() => {
      paintHeroOfficeTvItem(heroOfficeTvCursor + 1);
    }, 3200);
  }
};

const renderHeroOfficeFeed = (items = []) => {
  if (!heroOfficeFeedItems.length) {
    return;
  }

  const allItems = Array.isArray(items) ? items.filter(Boolean) : [];
  const leadItem = allItems[0];
  const safeItems = allItems.slice(1, heroOfficeFeedItems.length + 1);
  renderHeroOfficeTv(safeItems.length ? safeItems : allItems);

  heroOfficeFeedItems.forEach((card, index) => {
    const item = safeItems[index];
    const categoryNode = card.querySelector("[data-hero-office-item-category]");
    const titleNode = card.querySelector("[data-hero-office-item-title]");

    if (!item) {
      card.hidden = true;
      return;
    }

    card.hidden = false;
    card.href = item.articleHref || "#radar";

    if (categoryNode) {
      categoryNode.textContent = truncateCopy(
        item.articleCategory || item.title || "Cobertura local",
        30
      );
    }

    if (titleNode) {
      titleNode.textContent = truncateCopy(
        item.articleTitle || item.title || "Atualização do Vale do Juruá",
        78
      );
    }
  });

  if (leadItem && heroOfficePhoto) {
    const imageUrl = leadItem.proxyUrl || leadItem.fallbackUrl || "";
    const safeFocus = normalizeHeroSafeFocusPosition(leadItem.focusPosition, {
      hasPeople: Boolean(leadItem.hasPeopleScene)
    });
    heroOfficePhoto.style.setProperty("--hero-office-photo-image", imageUrl ? `url("${imageUrl}")` : "none");
    heroOfficePhoto.style.setProperty("--hero-office-photo-focus", safeFocus);
    heroOfficePhoto.classList.toggle("has-photo", Boolean(imageUrl));
  }

  if (leadItem && heroOfficePhotoCategory) {
    heroOfficePhotoCategory.textContent = truncateCopy(
      leadItem.articleCategory || leadItem.title || "Cobertura local",
      30
    );
  }

  if (leadItem && heroOfficePhotoTitle) {
    heroOfficePhotoTitle.textContent = truncateCopy(
      leadItem.articleTitle || leadItem.title || "Atualização do Vale do Juruá",
      72
    );
  }
};

const syncHeroDesktopCarousel = (index = 0) => {
  if (!heroTopicTrack || !heroTopicCards.length) {
    return;
  }

  const visibleCards = heroTopicCards.filter((card) => !card.hidden);
  if (!visibleCards.length) {
    heroTopicTrack.style.transform = "translate3d(0, 0, 0)";
    return;
  }

  const safeIndex = ((Number(index) % visibleCards.length) + visibleCards.length) % visibleCards.length;
  heroTourismRotation.activeTopicIndex = safeIndex;
  heroTopicTrack.style.transform = `translate3d(-${safeIndex * 100}%, 0, 0)`;

  visibleCards.forEach((card, cardIndex) => {
    card.classList.toggle("is-current", cardIndex === safeIndex);
  });

  if (heroTopicDots) {
    [...heroTopicDots.children].forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === safeIndex);
      dot.setAttribute("aria-pressed", dotIndex === safeIndex ? "true" : "false");
    });
  }
};

const mountHeroDesktopCarouselDots = (count = 0) => {
  if (!heroTopicDots) {
    return;
  }

  const safeCount = Math.max(0, Number(count) || 0);
  heroTopicDots.innerHTML = "";

  if (safeCount <= 1) {
    heroTopicDots.hidden = true;
    return;
  }

  heroTopicDots.hidden = false;
  for (let index = 0; index < safeCount; index += 1) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "hero-topic-dot";
    dot.setAttribute("aria-label", `Abrir destaque ${index + 1}`);
    dot.setAttribute("aria-pressed", index === 0 ? "true" : "false");
    dot.addEventListener("click", () => {
      syncHeroDesktopCarousel(index);
      restartHeroDesktopCarouselTimer();
    });
    heroTopicDots.appendChild(dot);
  }
};

const restartHeroDesktopCarouselTimer = () => {
  if (heroTourismRotation.topicTimerId) {
    window.clearInterval(heroTourismRotation.topicTimerId);
    heroTourismRotation.topicTimerId = 0;
  }

  if (!heroTopicTrack) {
    return;
  }

  const visibleCards = heroTopicCards.filter((card) => !card.hidden);
  if (visibleCards.length <= 1) {
    return;
  }

  heroTourismRotation.topicTimerId = window.setInterval(() => {
    syncHeroDesktopCarousel(heroTourismRotation.activeTopicIndex + 1);
  }, 4000);
};

const paintHeroTourismBackdrop = (slideNode, photo) => {
  if (shouldUseSolidHeroShell()) {
    return Promise.resolve(false);
  }

  if (!slideNode || !photo) {
    return Promise.resolve(false);
  }

  const requestToken = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  slideNode.dataset.heroBackdropToken = requestToken;

  return preloadHeroTourismImage(photo.proxyUrl, photo.fallbackUrl).then((resolvedUrl) => {
    const paintUrl = resolvedUrl || sanitizeImageUrl(photo.proxyUrl || photo.fallbackUrl || "");
    if (slideNode.dataset.heroBackdropToken !== requestToken || !paintUrl) {
      return false;
    }

    slideNode.style.backgroundImage = `
      linear-gradient(180deg, rgba(7, 18, 36, 0.14), rgba(7, 18, 36, 0.34)),
      linear-gradient(90deg, rgba(10, 23, 45, 0.4), rgba(10, 23, 45, 0.08) 40%, rgba(10, 23, 45, 0.48)),
      url("${paintUrl}")
    `;
    slideNode.style.backgroundPosition = normalizeHeroSafeFocusPosition(photo.focusPosition, {
      hasPeople: Boolean(photo.hasPeopleScene)
    });
    slideNode.style.backgroundSize = "cover";
    slideNode.dataset.heroBackdropReady = "true";
    return true;
  });
};

const rotateHeroOfficeStatus = (groupIndex = 0) => {
  if (!heroOfficeStatusNodes.length || !heroOfficeStatusGroups.length) {
    return;
  }

  const nextGroup = heroOfficeStatusGroups[groupIndex % heroOfficeStatusGroups.length] || [];
  heroOfficeStatusNodes.forEach((node, index) => {
    node.textContent = nextGroup[index] || nextGroup[nextGroup.length - 1] || node.textContent;
  });
};

const rotateHeroOfficeBubble = (bubbleIndex = 0) => {
  if (!heroOfficeBubble || !heroOfficeBubblePool.length) {
    return;
  }

  heroOfficeBubble.textContent =
    heroOfficeBubblePool[bubbleIndex % heroOfficeBubblePool.length] || heroOfficeBubble.textContent;
  heroOfficeBubble.classList.remove("is-pop");
  window.requestAnimationFrame(() => {
    heroOfficeBubble.classList.add("is-pop");
  });
};

const renderHeroTourismBackground = (photoIndex = 0, { initial = false } = {}) => {
  if (!heroTourismSlides.length) {
    return;
  }

  const photo = getHeroTourismPhoto(photoIndex);
  if (!photo) {
    return;
  }

  const activeSlide =
    heroTourismSlides[heroTourismRotation.activeSlideIndex] || heroTourismSlides[0];
  const fallbackNextSlide = heroTourismSlides.find((slide) => slide !== activeSlide) || activeSlide;
  const nextSlide = initial ? activeSlide : fallbackNextSlide;

  paintHeroTourismBackdrop(nextSlide, photo).then((painted) => {
    if (!painted) {
      return;
    }

    setHeroTourismMeta(photo);

    heroTourismSlides.forEach((slide) => {
      slide.classList.toggle("is-active", slide === nextSlide);
    });

    heroTourismRotation.activeSlideIndex = Math.max(heroTourismSlides.indexOf(nextSlide), 0);
    heroTourismRotation.photoIndex = photoIndex;

    if (heroTourismShell) {
      heroTourismShell.dataset.heroTourismReady = "true";
    }
  });
};

const initializeHeroTourismHero = () => {
  if (!heroTourismShell || !heroTourismSlides.length) {
    return;
  }

  const liteRuntime = shouldUseLiteHomeRuntime();

  const dailyPool = getHeroTourismDailyPool();
  reserveSurfaceArticles("topHero", getHeroPoolReservationArticles(dailyPool));

  if (heroTourismRotation.timerId) {
    window.clearInterval(heroTourismRotation.timerId);
  }

  if (heroTourismRotation.statusTimerId) {
    window.clearInterval(heroTourismRotation.statusTimerId);
  }

  if (heroTourismRotation.bubbleTimerId) {
    window.clearInterval(heroTourismRotation.bubbleTimerId);
  }

  if (heroTourismRotation.topicTimerId) {
    window.clearInterval(heroTourismRotation.topicTimerId);
  }

  heroTourismRotation.photoIndex = 0;
  heroTourismRotation.activeSlideIndex = 0;
  heroTourismRotation.activeTopicIndex = 0;
  heroTourismRotation.statusIndex = 0;
  heroTourismRotation.bubbleIndex = 0;
  const topicStartIndex = Math.min(2, Math.max(dailyPool.length - 1, 0));
  const topicItems = dailyPool.slice(topicStartIndex, topicStartIndex + heroTopicCards.length);
  const officeStartIndex = topicStartIndex + Math.max(topicItems.length, heroTopicCards.length);
  const officeItems = dailyPool.slice(officeStartIndex);
  renderHeroDesktopHighlights(topicItems.length ? topicItems : dailyPool.slice(1));
  renderHeroOfficeFeed(officeItems.length ? officeItems : dailyPool.slice(topicStartIndex + 1));

  if (shouldUseSolidHeroShell() || liteRuntime) {
    heroTourismSlides.forEach((slide) => {
      slide.classList.remove("is-active");
      slide.style.backgroundImage = "none";
      slide.dataset.heroBackdropReady = "false";
    });
    setHeroTourismMeta(dailyPool[0] || getHeroTourismPhoto(0));
    heroTourismShell.dataset.heroTourismReady = "solid";
  } else {
    renderHeroTourismBackground(0, { initial: true });
  }

  rotateHeroOfficeStatus(0);
  rotateHeroOfficeBubble(0);

  if (!shouldUseSolidHeroShell() && !liteRuntime && dailyPool.length > 1 && heroTopicCards.length === 0) {
    heroTourismRotation.timerId = window.setInterval(() => {
      const currentPool = getHeroTourismDailyPool();
      if (!currentPool.length) {
        return;
      }

      const nextPhotoIndex = (heroTourismRotation.photoIndex + 1) % currentPool.length;
      renderHeroTourismBackground(nextPhotoIndex);
    }, heroTourismRotationIntervalMs);
  }

  if (!liteRuntime && heroOfficeStatusNodes.length && heroOfficeStatusGroups.length > 1) {
    heroTourismRotation.statusTimerId = window.setInterval(() => {
      heroTourismRotation.statusIndex =
        (heroTourismRotation.statusIndex + 1) % heroOfficeStatusGroups.length;
      rotateHeroOfficeStatus(heroTourismRotation.statusIndex);
    }, 4200);
  }

  if (!liteRuntime && heroOfficeBubble && heroOfficeBubblePool.length > 1) {
    heroTourismRotation.bubbleTimerId = window.setInterval(() => {
      heroTourismRotation.bubbleIndex =
        (heroTourismRotation.bubbleIndex + 1) % heroOfficeBubblePool.length;
      rotateHeroOfficeBubble(heroTourismRotation.bubbleIndex);
    }, 3600);
  }

  if (!liteRuntime) {
    restartHeroDesktopCarouselTimer();
  }
};

const openArchiveBrowser = (seedQuery = "") => {
  const now = Date.now();
  if (now - lastArchiveBrowserOpenAt < 700) {
    return;
  }

  lastArchiveBrowserOpenAt = now;
  const archiveUrl = new URL("./arquivo.html", window.location.href);
  const normalizedQuery = String(seedQuery || "").trim();

  if (normalizedQuery) {
    archiveUrl.searchParams.set("q", normalizedQuery);
  }

  window.open(archiveUrl.toString(), "_blank", "noopener,noreferrer");
};

const attachArchiveBrowserLaunchers = () => {
  if (!archiveBrowserLaunchers.length) {
    return;
  }

  archiveBrowserLaunchers.forEach((launcher) => {
    if (!launcher || launcher.dataset.archiveBrowserBound === "true") {
      return;
    }

    launcher.dataset.archiveBrowserBound = "true";
    const launch = (event) => {
      event?.preventDefault?.();
      const inputValue =
        launcher instanceof HTMLInputElement
          ? String(launcher.value || "").trim()
          : String(liveFeedQuery?.value || "").trim();
      openArchiveBrowser(inputValue);
    };

    if (launcher instanceof HTMLInputElement) {
      launcher.addEventListener("focus", launch);
      launcher.addEventListener("click", launch);
      launcher.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          launch(event);
        }
      });
      return;
    }

    launcher.addEventListener("click", launch);
    launcher.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        launch(event);
      }
    });
  });
};

const typeInsidersLine = (node, text, delay, step) => {
  if (!node) {
    return;
  }

  if (splashMotionQuery.matches) {
    node.textContent = text;
    return;
  }

  node.textContent = "";
  let index = 0;
  window.setTimeout(function tick() {
    index += 1;
    node.textContent = text.slice(0, index);

    if (index < text.length) {
      window.setTimeout(tick, step);
    }
  }, delay);
};

const insidersBootPhaseNode = insidersBootScene?.querySelector("[data-insiders-boot-phase]") || null;
const insidersTerminalStream = insidersBootScene?.querySelector("[data-insiders-terminal-stream]") || null;
const insidersAsciiGlyphs = "01<>[]{}()/\\|=+*#%@&$░▒▓█";
const insidersCodeGlyphs = "const render local_stack = compose(dev, design, infra, dados);{}[]()<>/_$.:";

const insidersBootPhases = {
  code: "CODE_STREAM > BIN_STREAM > ASCII_DECODE > UI_RENDER",
  binary: "CODE_STREAM > [BIN_STREAM] > ASCII_DECODE > UI_RENDER",
  ascii: "CODE_STREAM > BIN_STREAM > [ASCII_DECODE] > UI_RENDER",
  render: "CODE_STREAM > BIN_STREAM > ASCII_DECODE > [UI_RENDER]"
};

const getRandomGlyph = () =>
  insidersAsciiGlyphs[Math.floor(Math.random() * insidersAsciiGlyphs.length)] || "0";

const getRandomCodeGlyph = () =>
  insidersCodeGlyphs[Math.floor(Math.random() * insidersCodeGlyphs.length)] || "_";

const buildBinaryMask = (text = "") =>
  [...String(text)].map((char) => (/\s/.test(char) ? char : Math.random() > 0.5 ? "1" : "0")).join("");

const buildCodeMask = (text = "", revealCount = 0) => {
  let visibleChars = 0;
  return [...String(text)]
    .map((char) => {
      if (/\s/.test(char)) {
        return char;
      }

      if (visibleChars < revealCount) {
        visibleChars += 1;
        return char;
      }

      visibleChars += 1;
      return getRandomCodeGlyph();
    })
    .join("");
};

const buildAsciiMask = (text = "", revealCount = 0) =>
  [...String(text)]
    .map((char, index) => {
      if (/\s/.test(char)) return char;
      return index < revealCount ? char : getRandomGlyph();
    })
    .join("");

const waitFrame = () =>
  new Promise((resolve) => {
    window.requestAnimationFrame(resolve);
  });

const waitFrames = async (count = 1) => {
  for (let frame = 0; frame < count; frame += 1) {
    await waitFrame();
  }
};

const setInsidersBootPhase = (phase) => {
  if (!insidersBootPhaseNode) {
    return;
  }

  insidersBootPhaseNode.textContent = insidersBootPhases[phase] || insidersBootPhases.render;
};

const animateInsidersTerminalStream = async () => {
  if (!insidersTerminalStream || insidersTerminalStream.dataset.ready === "true") {
    return;
  }

  const codeText = "const localStack = compose(dev, design, infra, dados);";
  const finalText = "render local_stack => operacao legivel para tela e atendimento";

  insidersTerminalStream.dataset.ready = "true";

  if (splashMotionQuery.matches) {
    insidersTerminalStream.textContent = finalText;
    setInsidersBootPhase("render");
    return;
  }

  insidersTerminalStream.classList.add("is-code");
  setInsidersBootPhase("code");
  insidersTerminalStream.textContent = "";

  for (let reveal = 0; reveal <= codeText.length; reveal += 4) {
    insidersTerminalStream.textContent = buildCodeMask(codeText, reveal);
    await waitFrames(2);
  }

  insidersTerminalStream.classList.remove("is-code");
  insidersTerminalStream.classList.add("is-binary");
  setInsidersBootPhase("binary");

  for (let frame = 0; frame < 8; frame += 1) {
    insidersTerminalStream.textContent = buildBinaryMask(codeText);
    await waitFrames(2);
  }

  insidersTerminalStream.classList.remove("is-binary");
  insidersTerminalStream.classList.add("is-ascii");
  setInsidersBootPhase("ascii");

  for (let reveal = 0; reveal <= finalText.length; reveal += 3) {
    insidersTerminalStream.textContent = buildAsciiMask(finalText, reveal);
    await waitFrames(2);
  }

  insidersTerminalStream.classList.remove("is-ascii");
  insidersTerminalStream.classList.add("is-typing");
  setInsidersBootPhase("render");
  insidersTerminalStream.textContent = "";

  const chars = [...finalText];
  for (let charIndex = 0; charIndex < chars.length; charIndex += 2) {
    insidersTerminalStream.textContent = chars.slice(0, charIndex + 2).join("");
    await waitFrames(2);
  }

  insidersTerminalStream.textContent = finalText;
  insidersTerminalStream.classList.remove("is-typing");
  insidersTerminalStream.classList.add("is-rendered");
  if (insidersBootPhaseNode) {
    insidersBootPhaseNode.textContent = "CODE_STREAM > BIN_STREAM > ASCII_DECODE > UI_RENDER";
  }
};

const animateInsidersCodeLine = async (node, index = 0) => {
  if (!node || node.dataset.insidersBootReady === "true") {
    return;
  }

  const finalText = String(node.dataset.insidersFinal || node.textContent || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!finalText) {
    return;
  }

  node.dataset.insidersFinal = finalText;
  node.dataset.insidersBootReady = "true";
  node.setAttribute("aria-label", finalText);

  const currentHeight = node.getBoundingClientRect().height;
  if (currentHeight > 0) {
    node.style.minHeight = `${Math.ceil(currentHeight)}px`;
  }

  if (splashMotionQuery.matches) {
    node.textContent = finalText;
    return;
  }

  node.classList.add("is-code");
  setInsidersBootPhase("code");

  const chars = [...finalText];
  const codeStep = Math.max(2, Math.ceil(chars.length / 10));

  for (let reveal = 0; reveal <= chars.length; reveal += codeStep) {
    node.textContent = buildCodeMask(finalText, reveal);
    await waitFrames(2);
  }

  node.classList.remove("is-code");
  node.classList.add("is-binary");
  setInsidersBootPhase("binary");

  for (let frame = 0; frame < 7; frame += 1) {
    node.textContent = buildBinaryMask(finalText);
    await waitFrames(2);
  }

  node.classList.remove("is-binary");
  node.classList.add("is-ascii");
  setInsidersBootPhase("ascii");

  const step = Math.max(2, Math.ceil(chars.length / 12));

  for (let reveal = 0; reveal <= chars.length; reveal += step) {
    node.textContent = buildAsciiMask(finalText, reveal);
    await waitFrames(2);
  }

  node.classList.remove("is-ascii");
  node.classList.add("is-typing");
  setInsidersBootPhase("render");
  node.textContent = "";

  const typeStep = node.closest(".construction-service-card") || node.closest(".construction-badges") ? 3 : 2;
  for (let charIndex = 0; charIndex < chars.length; charIndex += typeStep) {
    node.textContent = chars.slice(0, charIndex + typeStep).join("");
    await waitFrames(2);
  }

  node.textContent = finalText;
  node.classList.remove("is-typing");
  window.setTimeout(() => {
    node.style.minHeight = "";
  }, 360 + index * 12);
};

const runInsidersBootSequence = async () => {
  if (!insidersBootScene || insidersBootScene.dataset.bootStarted === "true") {
    return;
  }

  const screen = insidersBootScene.querySelector(".insiders-code-screen");
  const codeLines = [...insidersBootScene.querySelectorAll("[data-insiders-code-line]")];

  if (!screen || !codeLines.length) {
    return;
  }

  insidersBootScene.dataset.bootStarted = "true";
  screen.classList.add("is-booting");

  void animateInsidersTerminalStream();

  const introLines = codeLines.slice(0, 4);
  const moduleLines = codeLines.slice(4);

  for (let index = 0; index < introLines.length; index += 1) {
    await animateInsidersCodeLine(introLines[index], index);
  }

  moduleLines.forEach((node, index) => {
    window.setTimeout(() => {
      void animateInsidersCodeLine(node, introLines.length + index);
    }, index * 95);
  });

  window.setTimeout(() => {
    screen.classList.add("is-ready");
  }, 460);
};

const initializeInsidersBootScreen = () => {
  if (!insidersBootScene) {
    return;
  }

  if (splashMotionQuery.matches || !("IntersectionObserver" in window)) {
    void runInsidersBootSequence();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        observer.disconnect();
        void runInsidersBootSequence();
      });
    },
    { threshold: 0.28 }
  );

  observer.observe(insidersBootScene);
};

const initializeInsidersHeroScene = () => {
  if (!insidersTypedNodes.length) {
    return;
  }

  const startTypedNode = (node, index) => {
    if (!node || node.dataset.typedReady === "true") {
      return;
    }

    const fullText = String(node.dataset.typedFull || node.textContent || "").trim();
    if (!fullText) {
      return;
    }

    node.dataset.typedReady = "true";
    node.setAttribute("aria-label", fullText);
    typeInsidersLine(node, fullText, 220 + index * 320, node.closest(".construction-showcase") ? 11 : 13);
  };

  if (splashMotionQuery.matches || !("IntersectionObserver" in window)) {
    insidersTypedNodes.forEach(startTypedNode);

    if (heroInsidersShell) {
      window.requestAnimationFrame(() => {
        heroInsidersShell.classList.add("is-ready");
      });
    }

    return;
  }

  const typedObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const node = entry.target.querySelector?.("[data-insiders-typed]") || entry.target;
        typedObserver.unobserve(entry.target);
        startTypedNode(node, insidersTypedNodes.indexOf(node));
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );

  insidersTypedNodes.forEach((node, index) => {
    if (!node) {
      return;
    }

    const gate = node.closest(".site-footer") ? node.closest(".insiders-command-copy") || node : node;
    if (!gate) {
      startTypedNode(node, index);
      return;
    }

    typedObserver.observe(gate);
  });

  if (heroInsidersShell) {
    window.requestAnimationFrame(() => {
      heroInsidersShell.classList.add("is-ready");
    });
  }
};

const buildInsidersArmyChant = () => {
  if (!insidersChantTrack || insidersChantTrack.dataset.ready === "true") {
    return;
  }

  const slogans = ["GUERRA AO BOATO", "VERDADE EM CAMPO", "DEEPFAKE EM RETIRADA"];
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < 20; index += 1) {
    const badge = document.createElement("span");
    badge.textContent = slogans[index % slogans.length];
    fragment.appendChild(badge);
  }

  insidersChantTrack.appendChild(fragment);
  insidersChantTrack.dataset.ready = "true";

  window.requestAnimationFrame(() => {
    const midpointBadge =
      insidersChantTrack.children[Math.floor(insidersChantTrack.children.length / 2)];

    if (midpointBadge instanceof HTMLElement) {
      insidersChantTrack.style.setProperty("--chant-shift", `${midpointBadge.offsetLeft}px`);
    }
  });
};

const getInsidersLiteMode = () => {
  if (performanceLiteMode || splashMotionQuery.matches) {
    return true;
  }

  const connection =
    navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
  if (connection && (connection.saveData || /(?:^|slow-)?2g$/i.test(String(connection.effectiveType || "")))) {
    return true;
  }

  const deviceMemory = Number(navigator.deviceMemory || 0);
  if (deviceMemory > 0 && deviceMemory <= 4) {
    return true;
  }

  const hardwareThreads = Number(navigator.hardwareConcurrency || 0);
  return hardwareThreads > 0 && hardwareThreads <= 4;
};

const getInsidersArmyCount = (requestedCount = 3) => {
  const safeRequestedCount = Number.parseInt(requestedCount, 10) || 3;
  return Math.min(3, Math.max(3, safeRequestedCount));
};

const getInsidersSquadBlueprint = (isCompactViewport = false) => {
  if (isCompactViewport) {
    return [
      {
        x: 21,
        y: 60,
        scale: 1.03,
        tilt: -4,
        delay: 0,
        bob: 0,
        palette: "crimson",
        pose: "guard",
        patrolX: 0,
        patrolY: 0,
        parallax: 0,
        phase: 0,
        speed: 0,
        step: 1,
        eyeFire: "none",
        beamAngle: 0,
        beamLength: 0,
        beamPulse: 0,
        static: true
      },
      {
        x: 50,
        y: 42,
        scale: 1.18,
        tilt: 0,
        delay: 0,
        bob: 0,
        palette: "gold",
        pose: "command",
        patrolX: 0,
        patrolY: 0,
        parallax: 0,
        phase: 0,
        speed: 0,
        step: 1,
        eyeFire: "none",
        beamAngle: 0,
        beamLength: 0,
        beamPulse: 0,
        static: true
      },
      {
        x: 79,
        y: 60,
        scale: 1.03,
        tilt: 4,
        delay: 0,
        bob: 0,
        palette: "azure",
        pose: "guard",
        patrolX: 0,
        patrolY: 0,
        parallax: 0,
        phase: 0,
        speed: 0,
        step: 1,
        eyeFire: "none",
        beamAngle: 0,
        beamLength: 0,
        beamPulse: 0,
        static: true
      }
    ];
  }

  return [
    {
      x: 23,
      y: 60,
      scale: 1.08,
      tilt: -4,
      delay: 0,
      bob: 0,
      palette: "crimson",
      pose: "guard",
      patrolX: 0,
      patrolY: 0,
      parallax: 0,
      phase: 0,
      speed: 0,
      step: 1,
      eyeFire: "none",
      beamAngle: 0,
      beamLength: 0,
      beamPulse: 0,
      static: true
    },
    {
      x: 50,
      y: 40,
      scale: 1.24,
      tilt: 0,
      delay: 0,
      bob: 0,
      palette: "gold",
      pose: "command",
      patrolX: 0,
      patrolY: 0,
      parallax: 0,
      phase: 0,
      speed: 0,
      step: 1,
      eyeFire: "none",
      beamAngle: 0,
      beamLength: 0,
      beamPulse: 0,
      static: true
    },
    {
      x: 77,
      y: 60,
      scale: 1.08,
      tilt: 4,
      delay: 0,
      bob: 0,
      palette: "azure",
      pose: "guard",
      patrolX: 0,
      patrolY: 0,
      parallax: 0,
      phase: 0,
      speed: 0,
      step: 1,
      eyeFire: "none",
      beamAngle: 0,
      beamLength: 0,
      beamPulse: 0,
      static: true
    }
  ];
};

const getInsidersThreatBlueprint = () => [];

const createInsidersArmyRobot = (config = {}) => {
  const robot = document.createElement("article");
  const fragment = document.createDocumentFragment();
  const partClassNames = [
    "robot-shadow",
    "robot-crest",
    "robot-horn horn-left",
    "robot-horn horn-right",
    "robot-head",
    "robot-neck",
    "robot-faceplate",
    "robot-eye-band",
    "robot-collar",
    "robot-backpack",
    "robot-backpack-fin fin-left",
    "robot-backpack-fin fin-right",
    "robot-core",
    "robot-waist",
    "robot-shoulder shoulder-left",
    "robot-shoulder shoulder-right",
    "robot-arm arm-left",
    "robot-arm arm-right",
    "robot-forearm-shield shield-left",
    "robot-cannon cannon-right",
    "robot-thigh thigh-left",
    "robot-thigh thigh-right",
    "robot-leg leg-left",
    "robot-leg leg-right",
    "robot-knee knee-left",
    "robot-knee knee-right"
  ];
  const x = Number(config.x || 50);
  const y = Number(config.y || 58);
  const scale = Number(config.scale || 0.82);
  const delay = Number(config.delay || 0);
  const tilt = Number(config.tilt || 0);
  const bob = Number(config.bob || 7.2);
  const palette = String(config.palette || "gold").trim() || "gold";
  const pose = String(config.pose || "leader").trim() || "leader";
  const patrolX = Number(config.patrolX || 0);
  const patrolY = Number(config.patrolY || 0);
  const parallax = Number(config.parallax || 0);
  const phase = Number(config.phase || 0);
  const speed = Number(config.speed || 1);
  const step = Number(config.step || 1.75);
  const eyeFire = String(config.eyeFire || "right").trim() || "right";
  const beamAngle = Number(config.beamAngle || 12);
  const beamLength = Number(config.beamLength || 180);
  const beamPulse = Number(config.beamPulse || 0.4);
  const isStatic = config.static === true;

  robot.className = `insider-robot robot-squad palette-${palette} pose-${pose}`;
  robot.style.setProperty("--army-x", `${x.toFixed(2)}%`);
  robot.style.setProperty("--army-y", `${y.toFixed(2)}%`);
  robot.style.setProperty("--army-scale", scale.toFixed(3));
  robot.style.setProperty("--army-delay", `${delay.toFixed(2)}s`);
  robot.style.setProperty("--army-tilt", `${tilt.toFixed(2)}deg`);
  robot.style.setProperty("--army-bob", `${bob.toFixed(2)}px`);
  robot.style.setProperty("--army-step", `${step.toFixed(2)}s`);
  robot.style.setProperty("--army-opacity", scale >= 1 ? "1" : "0.96");
  robot.style.setProperty("--robot-z", `${Math.round(scale * 10) + 10}`);
  robot.style.setProperty("--beam-angle", `${beamAngle.toFixed(2)}deg`);
  robot.style.setProperty("--beam-length", `${beamLength.toFixed(2)}px`);
  robot.style.setProperty("--beam-pulse", `${beamPulse.toFixed(2)}s`);
  robot.dataset.armyPatrolX = patrolX.toFixed(2);
  robot.dataset.armyPatrolY = patrolY.toFixed(2);
  robot.dataset.armyParallax = parallax.toFixed(2);
  robot.dataset.armyPhase = phase.toFixed(2);
  robot.dataset.armySpeed = speed.toFixed(2);
  robot.dataset.eyeFire = eyeFire;
  robot.dataset.armyStatic = isStatic ? "true" : "false";

  partClassNames.forEach((className) => {
    const part = document.createElement("span");
    part.className = className;
    fragment.appendChild(part);
  });

  ["beam-left-eye", "beam-right-eye"].forEach((beamClass) => {
    const beam = document.createElement("span");
    beam.className = `robot-eye-beam ${beamClass}`;
    fragment.appendChild(beam);
  });

  const flare = document.createElement("span");
  flare.className = "robot-eye-flare";
  fragment.appendChild(flare);

  robot.appendChild(fragment);
  return robot;
};

const createInsidersArmyThreat = (config = {}) => {
  const threat = document.createElement("article");
  const core = document.createElement("div");
  const silhouette = document.createElement("div");
  const trench = document.createElement("div");
  const decal = document.createElement("span");
  const title = document.createElement("strong");
  const detail = document.createElement("small");
  const x = Number(config.x || 50);
  const y = Number(config.y || 20);
  const scale = Number(config.scale || 1);
  const drift = Number(config.drift || 1.2);
  const tone = String(config.tone || "ember").trim() || "ember";
  const type = String(config.type || "bunker").trim() || "bunker";

  threat.className = `insiders-army-threat tone-${tone} type-${type}`;
  threat.style.setProperty("--threat-x", `${x.toFixed(2)}%`);
  threat.style.setProperty("--threat-y", `${y.toFixed(2)}%`);
  threat.style.setProperty("--threat-scale", scale.toFixed(3));
  threat.style.setProperty("--threat-drift", `${drift.toFixed(2)}s`);

  core.className = "insiders-army-threat-core";
  silhouette.className = "insiders-army-threat-silhouette";
  trench.className = "insiders-army-threat-trench";
  decal.className = "insiders-army-threat-chip";
  decal.textContent = "guerra contra";
  title.textContent = String(config.label || "FAKE NEWS").trim();
  detail.textContent = String(config.detail || "ruido armado").trim();

  core.append(silhouette, trench, decal, title, detail);
  threat.appendChild(core);
  return threat;
};

const bindInsidersArmyMotion = (scene, robots = []) => {
  if (!scene || scene.dataset.armyMotionBound === "true") {
    return;
  }

  const robotList = robots.length ? robots : [...scene.querySelectorAll(".robot-squad")];

  if (!robotList.length) {
    return;
  }

  const prefersReducedMotion = performanceLiteMode || splashMotionQuery.matches;
  const state = {
    currentX: 0,
    currentY: 0,
    targetX: 0,
    targetY: 0,
    frameId: 0
  };

  const setSceneFocus = (x = 50, y = 20) => {
    scene.style.setProperty("--army-focus-x", `${x.toFixed(2)}%`);
    scene.style.setProperty("--army-focus-y", `${y.toFixed(2)}%`);
  };

  const resetFocus = () => {
    state.targetX = 0;
    state.targetY = 0;
    setSceneFocus(50, 20);
  };

  scene.dataset.armyMotionBound = "true";
  const allStatic = robotList.every((robot) => robot.dataset.armyStatic === "true");
  scene.dataset.armyMotion = prefersReducedMotion || allStatic ? "static" : "interactive";
  setSceneFocus(50, 20);

  if (allStatic) {
    robotList.forEach((robot) => {
      robot.style.setProperty("--army-drift-x", "0px");
      robot.style.setProperty("--army-drift-y", "0px");
      robot.style.setProperty("--army-tilt-extra", "0deg");
    });
    return;
  }

  scene.addEventListener("pointermove", (event) => {
    if (!motionMediaQuery.matches) {
      return;
    }

    const rect = scene.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return;
    }

    const offsetX = (event.clientX - rect.left) / rect.width;
    const offsetY = (event.clientY - rect.top) / rect.height;

    state.targetX = (offsetX - 0.5) * 2;
    state.targetY = (offsetY - 0.5) * 2;
    setSceneFocus(offsetX * 100, offsetY * 100);
  });

  scene.addEventListener("pointerleave", resetFocus);
  scene.addEventListener("pointercancel", resetFocus);

  if (prefersReducedMotion) {
    return;
  }

  const animateArmy = (now = 0) => {
    state.currentX += (state.targetX - state.currentX) * 0.15;
    state.currentY += (state.targetY - state.currentY) * 0.15;

    robotList.forEach((robot, index) => {
      const patrolX = Number(robot.dataset.armyPatrolX || 0);
      const patrolY = Number(robot.dataset.armyPatrolY || 0);
      const parallax = Number(robot.dataset.armyParallax || 0);
      const phase = Number(robot.dataset.armyPhase || index * 0.65);
      const speed = Number(robot.dataset.armySpeed || 1);
      const idleX = Math.sin(now * 0.00195 * speed + phase) * patrolX;
      const idleY = Math.cos(now * 0.00235 * speed + phase) * patrolY;
      const pointerX = state.currentX * parallax;
      const pointerY = state.currentY * (parallax * 0.92);

      robot.style.setProperty("--army-drift-x", `${(idleX + pointerX).toFixed(2)}px`);
      robot.style.setProperty("--army-drift-y", `${(idleY + pointerY).toFixed(2)}px`);
      robot.style.setProperty("--army-tilt-extra", `${(state.currentX * (parallax * 0.18)).toFixed(2)}deg`);
    });

    state.frameId = window.requestAnimationFrame(animateArmy);
  };

  state.frameId = window.requestAnimationFrame(animateArmy);
};

const initializeInsidersArmy = () => {
  if (!insidersArmyScene || insidersArmyScene.dataset.armyReady === "true") {
    return;
  }

  if (
    insidersArmyScene.classList.contains("insiders-logo-squad-crowd") ||
    insidersArmyScene.hasAttribute("data-insiders-crowd-stage")
  ) {
    buildInsidersArmyChant();
    insidersArmyScene.dataset.armyReady = "true";
    insidersArmyScene.dataset.armyMode = "crowd-march";
    return;
  }

  const renderArmy = () => {
    if (!insidersArmyScene || insidersArmyScene.dataset.armyReady === "true") {
      return;
    }

    buildInsidersArmyChant();

    const totalCount = getInsidersArmyCount(insidersArmyScene.dataset.armyCount || "3");
    const isLiteMode = getInsidersLiteMode();
    const isCompactViewport = window.matchMedia("(max-width: 960px)").matches;
    const blueprint = getInsidersSquadBlueprint(isCompactViewport).slice(0, totalCount);
    const threats = getInsidersThreatBlueprint(isCompactViewport);
    const fragment = document.createDocumentFragment();

    insidersArmyScene.dataset.armyMode = isLiteMode ? "lite" : "full";
    insidersArmyScene.dataset.armyFormation = "squad";
    insidersArmyScene.style.setProperty("--insiders-army-count", String(blueprint.length));
    threats.forEach((config) => fragment.appendChild(createInsidersArmyThreat(config)));
    blueprint.forEach((config) => fragment.appendChild(createInsidersArmyRobot(config)));

    insidersArmyScene.textContent = "";
    insidersArmyScene.appendChild(fragment);
    bindInsidersArmyMotion(insidersArmyScene, [...insidersArmyScene.querySelectorAll(".robot-squad")]);
    insidersArmyScene.dataset.armyReady = "true";
  };

  if (!("IntersectionObserver" in window)) {
    window.setTimeout(renderArmy, 180);
    return;
  }

  // Some headless/embedded browsers miss this intersection callback, so keep a
  // small fallback render to avoid an empty Insiders stage.
  const fallbackTimer = window.setTimeout(renderArmy, 2200);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        window.clearTimeout(fallbackTimer);
        observer.disconnect();
        renderArmy();
      });
    },
    {
      rootMargin: "320px 0px",
      threshold: 0.05
    }
  );

  observer.observe(insidersArmyScene);
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const escapeRuntimeAttribute = (value) =>
  String(value || "").replace(/"/g, "&quot;");

const trendingInfluencerBuzzPool = [
  {
    name: "Lia Juruá",
    handle: "@liajurua • criadora local",
    image: "./assets/home-cache/trend-lia-jurua.jpg",
    avatar: "./assets/home-cache/trend-lia-jurua.jpg",
    kicker: "a fala que dividiu a timeline",
    title:
      "Cruzeiro do Sul não precisa só viralizar bonito. Precisa ter banheiro, sinalização e rota segura antes de vender turismo.",
    summary:
      "A opinião pegou forte porque cutucou o hype da vista panorâmica: parte do público concordou que falta estrutura, enquanto outra parte achou que a crítica diminui o potencial turístico da cidade.",
    contextLabel: "Por que polemizou",
    contextTitle: "turismo x estrutura",
    contextText: "O post colocou influenciadores, empresários e moradores no mesmo debate.",
    counterLabel: "Resumo do contraponto",
    counterTitle: "divulgar sem romantizar",
    counterText: "A crítica não nega o atrativo, mas cobra contexto antes do viral.",
    meter: 64,
    reaction: "64% dos comentários monitorados apoiaram a cobrança por estrutura.",
    likes: "12.5K",
    comments: "2.3K",
    shares: "5.8K"
  },
  {
    name: "Nando do Centro",
    handle: "@nandocentro • conversa da cidade",
    image: "./assets/home-cache/trend-nando-centro.jpg",
    avatar: "./assets/home-cache/trend-nando-centro.jpg",
    kicker: "o vídeo que virou debate",
    title:
      "Evento grande também precisa combinar fila, estacionamento, internet e pagamento funcionando bem.",
    summary:
      "O comentário viralizou depois de um fim de semana movimentado. Comerciantes defenderam a crítica, enquanto produtores culturais lembraram que evento também precisa de patrocínio e apoio público.",
    contextLabel: "Ponto quente",
    contextTitle: "evento x operação",
    contextText: "A discussão saiu do entretenimento e entrou em logística, segurança e venda local.",
    counterLabel: "Outro lado",
    counterTitle: "festa também gera renda",
    counterText: "A defesa dos eventos destacou empregos temporários e movimento no comércio.",
    meter: 58,
    reaction: "58% dos comentários pediram planejamento melhor antes de ampliar a agenda.",
    likes: "9.8K",
    comments: "1.9K",
    shares: "3.7K"
  },
  {
    name: "Mara Pixel",
    handle: "@marapixel • opinião e cotidiano",
    image: "./assets/home-cache/trend-mara-pixel.jpg",
    avatar: "./assets/home-cache/trend-mara-pixel.jpg",
    kicker: "a thread que não parou",
    title:
      "A cidade está cheia de gente criando coisa boa, mas ainda trata internet como enfeite e não como infraestrutura.",
    summary:
      "A sequência de posts comparou atendimento, cardápio, localização, agenda e presença digital de negócios locais. O debate cresceu porque muita gente se reconheceu na dificuldade de achar informação básica.",
    contextLabel: "Por que pegou",
    contextTitle: "negócio x presença digital",
    contextText: "A fala conectou loja, serviço, turismo e atendimento no mesmo problema.",
    counterLabel: "Contraponto",
    counterTitle: "desafio de operação",
    counterText: "Pequenos empreendedores lembraram que falta tempo, equipe e orientação.",
    meter: 71,
    reaction: "71% dos comentários defenderam presença digital mínima para serviços locais.",
    likes: "15.2K",
    comments: "3.1K",
    shares: "6.4K"
  },
  {
    name: "Theo Acreano",
    handle: "@theoacreano • humor e opinião",
    image: "./assets/home-cache/trend-theo-acreano.jpg",
    avatar: "./assets/home-cache/trend-theo-acreano.jpg",
    kicker: "meme com fundo sério",
    title:
      "Se a fofoca chega mais rápido que o aviso oficial, o problema não é só a fofoca. É o canal oficial dormindo.",
    summary:
      "A frase começou como meme, mas virou cobrança por comunicação pública mais rápida. O público apontou que boato ocupa o espaço deixado por informação atrasada.",
    contextLabel: "Faísca",
    contextTitle: "boato x aviso oficial",
    contextText: "O humor abriu uma conversa sobre transparência, velocidade e checagem.",
    counterLabel: "Cuidado",
    counterTitle: "nem tudo é simples",
    counterText: "Órgãos públicos alegam que confirmação exige tempo e responsabilidade.",
    meter: 76,
    reaction: "76% dos comentários pediram canais oficiais mais diretos.",
    likes: "18.9K",
    comments: "4.4K",
    shares: "8.1K"
  },
  {
    name: "Bia dos Bairros",
    handle: "@biadosbairros • comunidade",
    image: "./assets/home-cache/trend-bia-bairros.jpg",
    avatar: "./assets/home-cache/trend-bia-bairros.jpg",
    kicker: "cobrança de bairro",
    title:
      "Quando a rua alaga, o print viraliza. Mas quem mora ali não precisa de viral: precisa de resposta.",
    summary:
      "O post reuniu vídeos de moradores e reacendeu a cobrança por manutenção, drenagem e retorno público. A repercussão cresceu porque misturou denúncia, rotina e humor local.",
    contextLabel: "Tema sensível",
    contextTitle: "bairro x resposta",
    contextText: "Moradores transformaram uma queixa repetida em pressão pública organizada.",
    counterLabel: "Outro lado",
    counterTitle: "obra tem etapa",
    counterText: "Comentários lembraram que solução urbana depende de projeto e orçamento.",
    meter: 69,
    reaction: "69% dos comentários cobraram calendário público de manutenção.",
    likes: "10.7K",
    comments: "2.8K",
    shares: "4.9K"
  },
  {
    name: "Rafa Castanhal",
    handle: "@rafacastanhal • cultura e rolê",
    image: "./assets/home-cache/trend-rafa-castanhal.jpg",
    avatar: "./assets/home-cache/trend-rafa-castanhal.jpg",
    kicker: "opinião de agenda",
    title:
      "A cena cultural local não precisa esperar permissão para existir. Precisa de calendário, palco e divulgação decente.",
    summary:
      "A fala mexeu com artistas, produtores e público. Muita gente concordou que a cidade tem talento, mas perde público quando eventos saem sem divulgação clara.",
    contextLabel: "Debate",
    contextTitle: "cultura x visibilidade",
    contextText: "Criadores defenderam mais calendário público e menos improviso na divulgação.",
    counterLabel: "Contraponto",
    counterTitle: "falta recurso",
    counterText: "Produtores apontaram custo alto e dificuldade de apoio contínuo.",
    meter: 62,
    reaction: "62% dos comentários defenderam uma agenda cultural fixa.",
    likes: "8.6K",
    comments: "1.6K",
    shares: "3.2K"
  }
];

const trendingControversyBuzzPool = [
  {
    badge: "Polêmica",
    tone: "hot",
    image: "./assets/home-cache/buzz-via-cruzeiro.jpg",
    title: "Mobilidade volta a dividir opiniões",
    summary: "Ciclovias, estacionamento e rotas de ônibus viraram tema de comentários cruzados entre moradores, comércio e poder público.",
    likes: "4.3K",
    comments: "2.1K"
  },
  {
    badge: "Criadores",
    tone: "viral",
    image: "./assets/home-cache/buzz-cruzeiro-01.jpg",
    title: "Criadores locais puxam agenda de fim de semana",
    summary: "Histórias, vídeos curtos e cenas de eventos estão guiando a escolha do público antes dos anúncios oficiais.",
    likes: "7.4K",
    comments: "980"
  },
  {
    badge: "Comentando",
    tone: "trending",
    image: "./assets/home-cache/buzz-cruzeiro-02.jpg",
    title: "Turismo bonito, estrutura cobrada",
    summary: "Fotos continuam viralizando, mas a conversa do dia cobra placas, banheiros, segurança e acesso mais claro.",
    likes: "6.2K",
    comments: "1.7K"
  },
  {
    badge: "Rede quente",
    tone: "viral",
    image: "./assets/home-cache/buzz-acai-bowl.jpg",
    title: "Produto local vira disputa de fila",
    summary: "Lanchonetes e pequenos negócios entraram na conversa depois que um sabor regional esgotou rápido.",
    likes: "5.9K",
    comments: "740"
  },
  {
    badge: "Por dentro",
    tone: "hot",
    image: "./assets/home-cache/buzz-cruzeiro-03.jpg",
    title: "Comunicação oficial demora e meme ocupa espaço",
    summary: "A timeline cobrou respostas mais rápidas quando boatos circularam antes dos canais formais.",
    likes: "9.1K",
    comments: "2.6K"
  },
  {
    badge: "Destaque",
    tone: "trending",
    image: "./assets/home-cache/buzz-model-local.jpg",
    title: "Nome local ganha atenção de marcas",
    summary: "Jovens criadores e modelos da região aparecem mais em campanhas, vídeos e collabs comerciais.",
    likes: "11.4K",
    comments: "1.8K"
  },
  {
    badge: "Cultura",
    tone: "viral",
    image: "./assets/home-cache/buzz-cultura-show.jpg",
    title: "Agenda cultural pede calendário único",
    summary: "Artistas e público cobram um lugar simples para acompanhar shows, oficinas, teatro e eventos comunitários.",
    likes: "3.8K",
    comments: "690"
  },
  {
    badge: "Serviço",
    tone: "hot",
    image: "./assets/home-cache/buzz-cruzeiro-04.jpg",
    title: "Bairros cobram retorno sobre manutenção",
    summary: "Posts de rua, iluminação e drenagem ganharam força porque moradores querem prazo, não só protocolo.",
    likes: "8.8K",
    comments: "2.4K"
  }
];

const getDailyIndexSeed = (key = getLocalDateKey()) =>
  String(key)
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

const pickDailyItems = (items = [], count = 1, salt = 0) => {
  if (!items.length || count <= 0) {
    return [];
  }

  const seed = getDailyIndexSeed() + salt;
  const start = seed % items.length;
  const picked = [];

  for (let index = 0; index < Math.min(count, items.length); index += 1) {
    picked.push(items[(start + index) % items.length]);
  }

  return picked;
};

const getBuzzSignalScore = (item = {}) =>
  Math.round(
    Number(item.engagement || 0) * 0.35 +
      Number(item.velocity || 0) * 0.25 +
      Number(item.trust || 0) * 0.25 +
      Number(item.utility || 0) * 0.15
  );

const getBuzzNetworkContexts = () => {
  const fallbackFeed = [
    {
      network: "Instagram",
      summary: "Repercussao visual, story e postagem curta.",
      signals: ["imagem forte", "comentários", "compartilhamento"],
      engagement: 92,
      velocity: 88,
      trust: 76,
      utility: 70
    },
    {
      network: "TikTok",
      summary: "Video curto e aceleracao de assunto nas primeiras horas.",
      signals: ["video curto", "repeticao", "viral"],
      engagement: 94,
      velocity: 95,
      trust: 62,
      utility: 60
    },
    {
      network: "YouTube",
      summary: "Contexto maior, opinião longa e vídeo de apoio.",
      signals: ["contexto", "opiniao", "retencao"],
      engagement: 81,
      velocity: 68,
      trust: 84,
      utility: 82
    },
    {
      network: "Facebook",
      summary: "Grupo local, bairro e servico publico em conversa.",
      signals: ["grupos", "bairro", "servico"],
      engagement: 76,
      velocity: 66,
      trust: 74,
      utility: 90
    },
    {
      network: "WhatsApp",
      summary: "Boato, alerta e pedido de confirmacao da comunidade.",
      signals: ["encaminhado", "alerta", "checagem"],
      engagement: 72,
      velocity: 82,
      trust: 52,
      utility: 78
    },
    {
      network: "X/Twitter",
      summary: "Termômetro de debate e comentário rápido.",
      signals: ["tempo real", "debate", "ruído alto"],
      engagement: 68,
      velocity: 88,
      trust: 55,
      utility: 62
    }
  ];

  return (Array.isArray(window.SOCIAL_RSS_DATA) ? window.SOCIAL_RSS_DATA : fallbackFeed)
    .map((item) => ({
      ...item,
      relevance: getBuzzSignalScore(item)
    }))
    .sort((left, right) => right.relevance - left.relevance);
};

const getBuzzSocialEvidence = (article = {}) => {
  const platformText = normalizeText(article.socialPlatform || article.platform || article.network || "");
  const topicText = normalizeText(article.topicGroup || article.topic || article.networkHint || "");
  const sourceText = normalizeText(article.sourceName || article.sourceTitle || article.source || "");
  const urlText = normalizeText(article.sourceUrl || article.url || article.link || "");
  const titleText = normalizeText(article.title || "");
  const haystack = [platformText, topicText, sourceText, urlText, titleText].join(" ");
  const hasExternalSocialSource =
    article.externalSource === true ||
    /\b(social-trends|twitter-trends|instagram-hashtags|facebook-public|facebook-pages|facebook-posts)\b/.test(topicText) ||
    /\b(getdaytrends|trends24|best hashtags|facebook publico|facebook público|facebook)\b/.test(sourceText) ||
    /\b(x\.com|twitter\.com|instagram\.com|facebook\.com|fb\.com)\b/.test(urlText);

  if (!hasExternalSocialSource) {
    return { hasSocialEvidence: false };
  }

  let network = "";
  if (/\b(facebook|fb\.com)\b/.test(haystack)) {
    network = "Facebook";
  } else if (/\b(instagram|reels?|stories?)\b/.test(haystack)) {
    network = "Instagram";
  } else if (/\b(tiktok)\b/.test(haystack)) {
    network = "TikTok";
  } else if (/\b(youtube|shorts?)\b/.test(haystack)) {
    network = "YouTube";
  } else if (/\b(x\/twitter|twitter|x\.com|getdaytrends|trends24)\b/.test(haystack)) {
    network = "X/Twitter";
  }

  if (!network) {
    return { hasSocialEvidence: false };
  }

  const socialSignals = {
    Facebook: ["página pública", "comentários", "compartilhamento"],
    Instagram: ["hashtag pública", "imagem", "repercussão visual"],
    TikTok: ["vídeo curto", "repetição", "velocidade"],
    YouTube: ["contexto", "vídeo", "retenção"],
    "X/Twitter": ["tempo real", "debate", "volume público"]
  };

  return {
    hasSocialEvidence: true,
    network,
    signals: socialSignals[network] || ["sinal público", "comentários", "compartilhamento"]
  };
};

const getNeutralBuzzNetworkContext = () => ({
  network: "Radar editorial",
  summary: "Notícia em acompanhamento pelo radar editorial; o card não trata o assunto como tendência sem prova pública.",
  signals: ["fonte editorial"],
  engagement: 42,
  velocity: 36,
  trust: 72,
  utility: 70,
  relevance: 58,
  hasSocialEvidence: false
});

const getBuzzFallbackItems = () => [
  ...trendingInfluencerBuzzPool.map((item) => ({
    title: item.title,
    summary: item.summary,
    imageUrl: item.image,
    sourceImageUrl: item.avatar || item.image,
    sourceName: item.name || "Radar social",
    sourceUrl: "./index.html#trending",
    publishedAt: new Date().toISOString(),
    category: "Buzz",
    topicGroup: "creators",
    networkHint: item.handle || item.kicker || ""
  })),
  ...trendingControversyBuzzPool.map((item) => ({
    title: item.title,
    summary: item.summary,
    imageUrl: item.image,
    sourceImageUrl: item.image,
    sourceName: item.badge || "Radar social",
    sourceUrl: "./index.html#trending",
    publishedAt: new Date().toISOString(),
    category: item.badge || "Buzz",
    topicGroup: "novidades",
    networkHint: item.tone || ""
  }))
];

const getBuzzControversyScore = (article = {}) => {
  const haystack = normalizeText(
    [
      article.title,
      article.summary,
      article.lede,
      article.category,
      article.topicGroup,
      article.sourceName,
      article.networkHint
    ].join(" ")
  );

  let score = 24;

  if (/\b(layoff|demiss|corta|corte|reevaluat|reavali|controvers|polem|divide|debate|critica|meme|boato|rumor|viral)\b/.test(haystack)) {
    score += 28;
  }

  if (/\b(xbox|meta|youtube|shorts|journalism|video-first|independent|future|memo|controle|parental)\b/.test(haystack)) {
    score += 18;
  }

  if (/\b(coment|publico|reacoes|opiniao|timeline|rede|social)\b/.test(haystack)) {
    score += 12;
  }

  if (/\b(cotidiano|creators|novidades)\b/.test(haystack)) {
    score += 6;
  }

  return score;
};

const buzzBrazilianDomains = [
  "g1.globo.com",
  "globo.com",
  "terra.com.br",
  "cnnbrasil.com.br",
  "agenciabrasil.ebc.com.br",
  "ac24horas.com",
  "contilnetnoticias.com.br",
  "jurua24horas.com",
  "juruaemtempo.com.br",
  "juruacomunicacao.com.br",
  "acre.com.br",
  "acrenews.com.br"
];

const buzzBlockedGlobalDomains = [
  "theverge.com",
  "blog.youtube",
  "youtube.com",
  "xbox.com",
  "playstation.com",
  "techcrunch.com",
  "animenewsnetwork.com",
  "awn.com",
  "animationmagazine.net",
  "cartoonbrew.com",
  "tubefilter.com"
];

const getBuzzHostname = (value = "") => {
  try {
    return new URL(String(value || ""), window.location.href).hostname.replace(/^www\./i, "").toLowerCase();
  } catch (error) {
    return "";
  }
};

const isBrazilBuzzArticle = (article = {}) => {
  const sourceUrl = article.sourceUrl || article.url || article.link || "";
  const hostname = getBuzzHostname(sourceUrl);
  const coverageLayer = normalizeText(article.coverageLayer || "");
  const sourceName = normalizeText(article.sourceName || "");
  const text = normalizeText([article.title, article.summary, article.lede, article.category, sourceName].join(" "));

  if (["acre", "jurua", "brasil"].includes(coverageLayer)) {
    return true;
  }

  if (hostname && buzzBlockedGlobalDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) {
    return false;
  }

  if (hostname && buzzBrazilianDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) {
    return true;
  }

  if (hostname.endsWith(".br")) {
    return true;
  }

  return /\b(brasil|brasileir|acre|rio branco|cruzeiro do sul|sao paulo|são paulo|rio de janeiro|bahia|minas|parana|paraná|nordeste|amazonia|amazônia|globo|g1|terra|cnn brasil|agencia brasil|agência brasil)\b/.test(
    text
  );
};

const resolveBuzzNetworkContext = (article = {}, index = 0) => {
  const contexts = getBuzzNetworkContexts();
  const evidence = getBuzzSocialEvidence(article);

  if (!evidence.hasSocialEvidence) {
    return getNeutralBuzzNetworkContext();
  }

  const directMatch =
    contexts.find((item) => {
      const network = normalizeText(item.network);
      const evidenceNetwork = normalizeText(evidence.network);
      return network === evidenceNetwork || network.includes(evidenceNetwork) || evidenceNetwork.includes(network);
    }) || null;

  return {
    ...(directMatch || getNeutralBuzzNetworkContext()),
    ...evidence,
    relevance: Number(directMatch?.relevance || 72),
    trust: Number(directMatch?.trust || 68),
    utility: Number(directMatch?.utility || 70)
  };
};

const clampBuzzPercent = (value, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Math.round(Number(value) || 0)));

const pickBuzzCopy = (items = [], seed = 0, offset = 0) =>
  items[(Math.abs(seed) + offset) % Math.max(items.length, 1)] || "";

const buzzAgentFallbackReaders = [
  {
    name: "Editora Ari",
    office: "Escritório Principal",
    role: "editor",
    specialty: "hierarquia de notícias, capa, manchetes e ritmo editorial"
  },
  {
    name: "Malu Cultura",
    office: "Escritório Principal",
    role: "editor",
    specialty: "agenda cultural, personagens, serviço e impacto para o leitor"
  },
  {
    name: "Paula Manchete",
    office: "Escritório Principal",
    role: "editor",
    specialty: "abertura de matéria, ângulo público e peso da manchete"
  },
  {
    name: "Revisor Bento",
    office: "Escritório Principal",
    role: "review",
    specialty: "erros editoriais, botões, acessibilidade e clareza"
  },
  {
    name: "Bruno Mesa",
    office: "Escritório Principal",
    role: "review",
    specialty: "contraponto, dúvida do leitor e excesso de certeza"
  },
  {
    name: "Lia Copy",
    office: "Escritório Principal",
    role: "copy",
    specialty: "títulos, chamadas, microcopy e tom humano"
  },
  {
    name: "Nina Texto",
    office: "Escritório Principal",
    role: "copy",
    specialty: "texto institucional, apresentação pública, clareza e edição de linguagem"
  },
  {
    name: "Paulo Lede",
    office: "Escritório Principal",
    role: "copy",
    specialty: "ledes curtos, precisão de promessa e ritmo de leitura"
  },
  {
    name: "Sofia Fontes",
    office: "Escritório Principal",
    role: "sources",
    specialty: "fontes confiáveis, origem da informação e cobertura externa"
  },
  {
    name: "Caio Fontes",
    office: "Escritório Principal",
    role: "sources",
    specialty: "checagem cruzada, datas, documentos e links de origem"
  },
  {
    name: "Téo Buzz",
    office: "Escritório Principal",
    role: "social",
    specialty: "redes sociais, buzz local, creators e pedidos da comunidade"
  },
  {
    name: "Rafa Redes",
    office: "Escritório Principal",
    role: "social",
    specialty: "temperatura de comentários, ironia, apoio e cobrança pública"
  },
  {
    name: "Dara Design",
    office: "Escritório Principal",
    role: "design",
    specialty: "layout, contraste, responsivo, identidade visual e experiência"
  },
  {
    name: "Joana UX",
    office: "Escritório Principal",
    role: "design",
    specialty: "escaneabilidade, densidade visual e leitura em card"
  },
  {
    name: "Vera Vendas",
    office: "Escritório Principal",
    role: "sales",
    specialty: "vendas locais, anúncios, vitrine, Pix e confiança"
  },
  {
    name: "Nico Study",
    office: "Escritório Principal",
    role: "sources",
    specialty: "educação, campus, carreira, IA e fontes globais"
  },
  {
    name: "Tami QA",
    office: "Escritório Nerd",
    role: "review",
    specialty: "playtest, revisão de atritos, clareza de botões e consistência"
  },
  {
    name: "Beto HUD",
    office: "Escritório Nerd",
    role: "design",
    specialty: "HUD, painéis, microcopy de ação e clareza de informação"
  },
  {
    name: "Codex CEO",
    office: "Escritório Principal",
    role: "ceo",
    specialty: "organização da equipe, prioridades do portal e visão de conjunto"
  }
];

const normalizeBuzzAgentReader = (agent = {}, index = 0) => {
  const name = String(agent.name || agent.agent || agent.agentName || "").trim();
  if (!name) {
    return null;
  }

  const focus = Array.isArray(agent.focus)
    ? agent.focus
    : Array.isArray(agent.monitoringFocus)
      ? agent.monitoringFocus
      : [];

  return {
    key: String(agent.slug || agent.id || `${name}:${agent.role || ""}:${index}`).trim(),
    name,
    office: String(agent.office || agent.officeLabel || agent.officeKey || "Redação").trim(),
    role: String(agent.role || "leitura").trim(),
    specialty: String(agent.specialty || agent.title || "").trim(),
    focus: focus.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 4),
    lastSignal: String(agent.lastSignal || agent.status || "").trim()
  };
};

const buildBuzzAgentReaderPool = (agentPulse = null) => {
  const readers = Array.isArray(agentPulse?.readers) ? agentPulse.readers : [];
  const actionReaders = Array.isArray(agentPulse?.actions)
    ? agentPulse.actions.map((action) => ({
        name: action.agent,
        office: action.office,
        role: action.role,
        specialty: action.title,
        lastSignal: action.status
      }))
    : [];
  const seen = new Set();

  return [...readers, ...actionReaders, ...buzzAgentFallbackReaders]
    .map((agent, index) => normalizeBuzzAgentReader(agent, index))
    .filter((agent) => {
      if (!agent) {
        return false;
      }

      const key = normalizeText(agent.key || agent.name);
      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
};

const inferBuzzOpinionTheme = (haystack = "") => {
  if (/\b(show|cantor|cantora|ator|atriz|musica|cultura|teatro|palco|festival|agenda cultural)\b/.test(haystack)) {
    return "culture";
  }
  if (/\b(futebol|jogo|gol|campeonato|serie d|time|atleta|esporte)\b/.test(haystack)) {
    return "sport";
  }
  if (/\b(prefeitura|governo|governador|governadora|deputado|senador|politica|politico|gestao)\b/.test(haystack)) {
    return "politics";
  }
  if (/\b(tempo|cheia|ubs|hospital|posto|edital|calendario|servico|serviço|bairro|morador)\b/.test(haystack)) {
    return "service";
  }
  if (/\b(preco|preço|oferta|produto|compra|venda|loja|mercado|negocio|negócio)\b/.test(haystack)) {
    return "commerce";
  }
  if (/\b(crianca|criança|adolescente|familia|família|escola|educacao|educação)\b/.test(haystack)) {
    return "family";
  }
  return "default";
};

const buzzOpinionThemeDetails = {
  culture: {
    roles: ["editor", "social", "copy", "review", "sources", "design"],
    axis: "experiência x contexto cultural",
    mood: "curiosidade cultural, leitura em aberto",
    climate: "curiosidade cultural com cautela",
    context: "experiência, agenda cultural e valor para quem não acompanhou o assunto",
    route: "entrar pelo clima do evento, separar crítica de agenda e explicar por que importa fora do círculo de fãs"
  },
  sport: {
    roles: ["social", "editor", "sources", "copy", "review", "ceo"],
    axis: "torcida x tabela x consequência",
    mood: "torcida ligada, cobrança por contexto",
    climate: "empolgação com cobrança de consequência",
    context: "resultado, tabela, personagem e impacto para a próxima rodada",
    route: "mostrar o placar sem perder o que muda na competição e no humor da torcida"
  },
  politics: {
    roles: ["sources", "editor", "review", "copy", "social", "ceo"],
    axis: "fala oficial x prova pública",
    mood: "atenção alta, tolerância baixa para frase pronta",
    climate: "interesse alto com desconfiança de promessa",
    context: "autoridade, decisão, documento e efeito prático para a população",
    route: "cruzar fala, fonte e impacto antes de deixar a opinião subir o tom"
  },
  service: {
    roles: ["sources", "social", "editor", "review", "copy", "design"],
    axis: "utilidade x prazo x responsável",
    mood: "interesse prático, cobrança por resposta",
    climate: "urgência prática com pedido de confirmação",
    context: "prazo, endereço, responsável e rotina de quem precisa do serviço",
    route: "transformar repercussão em orientação clara para o leitor resolver algo"
  },
  commerce: {
    roles: ["sales", "social", "copy", "review", "sources", "design"],
    axis: "valor real x hype",
    mood: "interesse com comparação",
    climate: "curiosidade de compra com pé no freio",
    context: "preço, benefício, risco de propaganda e experiência de quem já testou",
    route: "separar utilidade de empolgação comercial e explicar limite da oferta"
  },
  family: {
    roles: ["review", "sources", "copy", "editor", "social", "design"],
    axis: "proteção x autonomia",
    mood: "tema sensível, leitura cuidadosa",
    climate: "preocupação legítima sem solução mágica",
    context: "segurança, rotina das famílias, evidência e linguagem responsável",
    route: "reconhecer o medo real sem vender controle simples para problema complexo"
  },
  default: {
    roles: ["editor", "sources", "social", "copy", "review", "design"],
    axis: "interesse x dúvida x consequência",
    mood: "atenção moderada, leitura em disputa",
    climate: "interesse com dúvida organizada",
    context: "fonte, reação pública, utilidade e o que muda para o leitor",
    route: "dar clima sem fingir certeza: explicar o que importa, para quem muda algo e o que falta checar"
  }
};

const resolveBuzzAgentRoleKey = (role = "") => {
  const roleKey = normalizeText(role);
  if (/source|fonte/.test(roleKey)) return "sources";
  if (/review|revis/.test(roleKey)) return "review";
  if (/copy|texto/.test(roleKey)) return "copy";
  if (/social|buzz|rede/.test(roleKey)) return "social";
  if (/design|hud|visual/.test(roleKey)) return "design";
  if (/sales|venda|comercial/.test(roleKey)) return "sales";
  if (/editor/.test(roleKey)) return "editor";
  if (/ceo|lead|coord/.test(roleKey)) return "ceo";
  return roleKey || "leitura";
};

const pickBuzzAgentReaders = (agentPulse = null, theme = "default", seed = 0) => {
  const pool = buildBuzzAgentReaderPool(agentPulse);
  const detail = buzzOpinionThemeDetails[theme] || buzzOpinionThemeDetails.default;
  const selected = [];
  const usedKeys = new Set();
  const addAgent = (agent) => {
    if (!agent) {
      return false;
    }

    const key = normalizeText(agent.key || agent.name);
    if (!key || usedKeys.has(key)) {
      return false;
    }

    usedKeys.add(key);
    selected.push(agent);
    return true;
  };

  detail.roles.forEach((role, roleIndex) => {
    const matches = pool.filter((agent) => resolveBuzzAgentRoleKey(agent.role) === role);
    const candidate = matches[(Math.abs(seed) + roleIndex * 7) % Math.max(matches.length, 1)];
    addAgent(candidate);
  });

  pool.forEach((agent, poolIndex) => {
    if (selected.length >= 4) {
      return;
    }

    const candidate = pool[(Math.abs(seed) + poolIndex * 5) % pool.length];
    addAgent(candidate);
  });

  return selected.slice(0, 4);
};

const buildBuzzAgentVoice = (agent = {}, detail = buzzOpinionThemeDetails.default, context = {}) => {
  const role = resolveBuzzAgentRoleKey(agent.role);
  const networkName = context.networkName || "rede";
  const sourceName = context.sourceName || "fonte original";
  const hasSocialEvidence = context.hasSocialEvidence === true;
  const roleLabels = {
    editor: "ângulo editorial",
    sources: "checagem de fonte",
    social: "clima de rede",
    copy: "tom da chamada",
    review: "cautela editorial",
    design: "leitura visual",
    sales: "valor percebido",
    ceo: "prioridade da rodada"
  };
  const label = roleLabels[role] || "leitura de agente";
  const texts = {
    editor: `${agent.name} puxa a hierarquia: abrir por ${detail.context} e mostrar o que muda na leitura do público.`,
    sources: `${agent.name} pede lastro: fonte, data e confirmação antes de transformar reação em certeza.`,
    social: hasSocialEvidence
      ? `${agent.name} mede ${networkName}: ${detail.climate}; há conversa viva, mas apoio, ironia e cobrança precisam ficar separados.`
      : `${agent.name} segura o rótulo: vira radar editorial até existir sinal público verificável.`,
    copy: `${agent.name} segura o tom: chamada com energia, sem vender conclusão maior que o fato.`,
    review: `${agent.name} corta excesso: opinião só entra depois de contexto, fonte e pergunta respondida.`,
    design: `${agent.name} olha a tela: clima dos agentes precisa aparecer sem virar bloco pesado nem repetir a mesma frase.`,
    sales: `${agent.name} pergunta valor: o leitor precisa sair sabendo o que ganha, perde ou decide.`,
    ceo: `${agent.name} organiza prioridade: se ${sourceName} é ponto de partida, a equipe cruza fonte, rede e serviço antes do destaque.`
  };

  return {
    label,
    text: truncateCopy(texts[role] || `${agent.name} acrescenta uma leitura própria antes da avaliação final.`, 172)
  };
};

const buildBuzzAgentOpinion = ({
  article = {},
  networkContext = {},
  profile = {},
  seed = 0,
  index = 0,
  voiceWeights = [],
  agentPulse = null,
  subject = ""
} = {}) => {
  const haystack = normalizeText(
    [article.title, article.summary, article.lede, article.category, article.topicGroup].join(" ")
  );
  const theme = inferBuzzOpinionTheme(haystack);
  const detail = buzzOpinionThemeDetails[theme] || buzzOpinionThemeDetails.default;
  const agents = pickBuzzAgentReaders(agentPulse, theme, seed + index * 13);

  if (!agents.length) {
    return null;
  }

  const sourceName = article.sourceName || article.sourceTitle || "fonte original";
  const networkName = networkContext.network || "rede";
  const hasSocialEvidence = networkContext.hasSocialEvidence === true;
  const voiceAgents = agents.slice(0, 3);
  const voices = voiceAgents.map((agent, voiceIndex) => {
    const voice = buildBuzzAgentVoice(agent, detail, { networkName, sourceName, hasSocialEvidence });
    return {
      ...voice,
      weight: voiceWeights[voiceIndex] || 42
    };
  });
  const visibleNames = voiceAgents.map((agent) => agent.name).join(", ");
  const supportAgent = agents[3]?.name ? ` ${agents[3].name} fica no apoio de leitura.` : "";

  return {
    captureLabel: `${voiceAgents.length} leituras do time real`,
    debateAxis: detail.axis || profile.debateAxis,
    publicMood: detail.mood || profile.publicMood,
    voices,
    agentContext: `${visibleNames} leem "${subject}" por ${detail.context}.${supportAgent}`,
    agentEvaluation: `Clima dos agentes: ${detail.climate}; ${detail.route}.`
  };
};

const buildBuzzAudiencePulse = (article = {}, networkContext = {}, index = 0, agentPulse = null) => {
  const haystack = normalizeText(
    [article.title, article.summary, article.lede, article.category, article.topicGroup].join(" ")
  );
  const seed = getDailyIndexSeed(`${article.title || "buzz"}:${index}`);
  const trustSignal = Number(networkContext.trust || networkContext.relevance || 64);
  const utilitySignal = Number(networkContext.utility || 64);
  const networkName = networkContext.network || "rede";
  const primarySignal = Array.isArray(networkContext.signals) ? networkContext.signals[0] || "comentários" : "comentários";
  const sourceName = article.sourceName || article.sourceTitle || "fonte original";
  const subject = truncateCopy(article.title || article.topicGroup || "o caso em debate", 64);
  const hasSocialEvidence = networkContext.hasSocialEvidence === true;
  const profiles = {
    employment: {
      base: 36,
      kicker: `escuta crítica em ${networkName.toLowerCase()}`,
      debateAxis: "impacto real x discurso oficial",
      publicMood: "satisfação baixa, cobrança alta",
      captureLabel: "três grupos de fala em tensão",
      context: `Contexto para os agentes: separar anúncio, consequência prática e cobrança de dados antes de opinar sobre "${subject}".`,
      evaluation:
        "Avaliação dos agentes: o texto precisa começar pelo impacto humano, checar números e evitar tratar decisão empresarial como espetáculo.",
      voices: [
        ["preocupação", "Leitores cobram efeito concreto: emprego, renda e continuidade do serviço vêm antes do discurso bonito."],
        ["defesa", "Uma parte aceita mudança se houver plano claro, prazo e explicação sem frase pronta."],
        ["cobrança", "A pergunta que ficou é simples: quem perde, quem ganha e qual dado confirma a promessa?"]
      ]
    },
    strategy: {
      base: 52,
      kicker: `percepção dividida em ${networkName.toLowerCase()}`,
      debateAxis: "expectativa x prova prática",
      publicMood: "satisfação moderada, confiança em teste",
      captureLabel: "apoio, dúvida e cobrança mapeados",
      context: `Contexto para os agentes: explicar o que muda para o público e onde ainda falta evidência sobre "${subject}".`,
      evaluation:
        "Avaliação dos agentes: há espaço para leitura autoral, mas a conclusão deve pesar promessa, histórico e benefício real para o leitor.",
      voices: [
        ["apoio", "Parte do público vê chance de renovação se a mudança vier acompanhada de entrega visível."],
        ["dúvida", "Outra parte segura o entusiasmo porque já viu anúncio grande sem resultado prático."],
        ["cobrança", "O ponto comum é pedido por exemplo, prazo e comparação com o que existia antes."]
      ]
    },
    journalism: {
      base: 60,
      kicker: `escuta comentada em ${networkName.toLowerCase()}`,
      debateAxis: "formato x credibilidade",
      publicMood: "satisfação cautelosa",
      captureLabel: "preferências de leitura cruzadas",
      context: `Contexto para os agentes: cruzar reação de formato, pedido de apuração e utilidade para quem acompanha "${subject}".`,
      evaluation:
        "Avaliação dos agentes: a opinião autoral deve defender clareza, fonte aberta e ritmo humano, sem transformar formato em fetiche.",
      voices: [
        ["apoio", "Há leitores que gostam de formato mais direto quando ele ajuda a entender rápido."],
        ["critério", "Outro grupo pede fonte, contexto e apuração para não virar só embalagem de rede."],
        ["hábito", "Também aparece gente que prefere texto e resumo bem editado antes de vídeo longo."]
      ]
    },
    family: {
      base: 54,
      kicker: `tema sensível em ${networkName.toLowerCase()}`,
      debateAxis: "proteção x autonomia",
      publicMood: "satisfação dividida",
      captureLabel: "famílias, usuários e críticos separados",
      context: `Contexto para os agentes: tratar proteção, excesso de controle e rotina real das famílias no mesmo quadro sobre "${subject}".`,
      evaluation:
        "Avaliação dos agentes: a análise precisa reconhecer o medo legítimo sem vender controle como solução mágica.",
      voices: [
        ["famílias", "Pais e responsáveis querem menos exposição e mais ferramenta compreensível."],
        ["autonomia", "Usuários lembram que controle sem conversa pode só deslocar o problema."],
        ["equilíbrio", "A síntese pede educação digital, regra clara e transparência da plataforma."]
      ]
    },
    service: {
      base: 66,
      kicker: `serviço observado em ${networkName.toLowerCase()}`,
      debateAxis: "utilidade x prazo",
      publicMood: "satisfação útil, cobrança por resposta",
      captureLabel: "moradores, usuários e cobrança reunidos",
      context: `Contexto para os agentes: priorizar endereço, prazo, impacto no bairro e confirmação oficial antes de opinar sobre "${subject}".`,
      evaluation:
        "Avaliação dos agentes: o caso ganha força quando vira serviço autoral, com orientação clara e pergunta objetiva ao responsável.",
      voices: [
        ["uso prático", "Quem depende do serviço valoriza informação simples: onde, quando e o que muda."],
        ["cobrança", "A parte crítica quer prazo, responsável e retorno público, não só aviso genérico."],
        ["experiência", "Moradores ajudam a completar o quadro quando contam como aquilo aparece na rotina."]
      ]
    },
    commerce: {
      base: 57,
      kicker: `interesse com ressalva em ${networkName.toLowerCase()}`,
      debateAxis: "oportunidade x exagero",
      publicMood: "satisfação instável",
      captureLabel: "interesse, comparação e desconfiança",
      context: `Contexto para os agentes: separar desejo de compra, comparação de preço e risco de hype em torno de "${subject}".`,
      evaluation:
        "Avaliação dos agentes: o texto autoral deve apontar valor real, limite da oferta e cuidado com propaganda disfarçada.",
      voices: [
        ["interesse", "Uma parte entra pelo benefício imediato e quer saber se vale a pena agora."],
        ["comparação", "Outra parte compara preço, histórico e experiência de quem já testou."],
        ["desconfiança", "O ruído aparece quando a conversa parece empurrada por hype, não por utilidade."]
      ]
    },
    default: {
      base: 56,
      kicker: `escuta pública em ${networkName.toLowerCase()}`,
      debateAxis: "apoio x dúvida x cobrança",
      publicMood: "satisfação moderada, leitura aberta",
      captureLabel: "opiniões captadas em três camadas",
      context: `Contexto para os agentes: ler "${subject}" por utilidade, incômodo e dúvida antes de escrever uma avaliação autoral.`,
      evaluation:
        "Avaliação dos agentes: o caso ainda pede contexto; o melhor caminho é explicar por que importa, para quem muda algo e o que falta confirmar.",
      voices: [
        ["apoio", "Um grupo vê valor no tema porque ele toca rotina, consumo ou informação útil."],
        ["cautela", "Outro grupo evita conclusão rápida e pede dado melhor antes de aderir ao clima da rede."],
        ["pergunta", "A dúvida recorrente é o que muda de fato para o leitor quando a repercussão passa."]
      ]
    }
  };

  let profile = profiles.default;

  if (/\b(layoff|demiss|corte|job|staff)\b/.test(haystack)) {
    profile = profiles.employment;
  } else if (/\b(reevaluat|reavali|future|memo|strategy|xbox|mudanca|estrategia)\b/.test(haystack)) {
    profile = profiles.strategy;
  } else if (/\b(journalism|jornalismo|video-first|independent|credibil|news|noticia|apuracao)\b/.test(haystack)) {
    profile = profiles.journalism;
  } else if (/\b(parental|famil|healthy digital habits|shorts|crianca|adolescente)\b/.test(haystack)) {
    profile = profiles.family;
  } else if (/\b(tempo|cheia|leilao|edital|posto|calendario|fiscalizacao|ubs|hospital|educacao|servico|serviço|agenda)\b/.test(haystack)) {
    profile = profiles.service;
  } else if (/\b(sale|deal|promo|desconto|produto|speaker|oferta|compra|preco|preço)\b/.test(haystack)) {
    profile = profiles.commerce;
  }

  const satisfaction = clampBuzzPercent(
    profile.base + ((seed % 13) - 6) + (trustSignal - 64) * 0.1 + (utilitySignal - 64) * 0.08,
    24,
    84
  );
  const supportWeight = clampBuzzPercent(satisfaction + ((seed % 9) - 4), 22, 84);
  const concernWeight = clampBuzzPercent(92 - satisfaction + (((seed >> 1) % 11) - 5), 18, 78);
  const questionWeight = clampBuzzPercent(38 + ((seed >> 2) % 23), 18, 66);
  const voiceWeights = [supportWeight, concernWeight, questionWeight];
  const fallbackVoices = profile.voices.map(([label, text], voiceIndex) => ({
    label,
    text,
    weight: voiceWeights[voiceIndex] || questionWeight
  }));
  const sourceContext = hasSocialEvidence
    ? pickBuzzCopy(
        [
          `${networkName} trouxe ${primarySignal}; ${sourceName} dá o ponto de partida da notícia.`,
          `${sourceName} aparece como referência inicial, enquanto ${networkName} mostra a temperatura da conversa.`,
          `Os sinais vieram de ${primarySignal} e foram separados antes da avaliação editorial.`
        ],
        seed,
        index
      )
    : `${sourceName} sustenta a notícia. O card fica como radar editorial e não vende tendência sem sinal público real.`;
  const agentOpinion = buildBuzzAgentOpinion({
    article,
    networkContext,
    profile,
    seed,
    index,
    voiceWeights,
    agentPulse,
    subject
  });

  return {
    meter: satisfaction,
    satisfaction,
    kicker: hasSocialEvidence ? profile.kicker : "radar editorial em checagem",
    debateAxis: hasSocialEvidence ? agentOpinion?.debateAxis || profile.debateAxis : "fonte x impacto local",
    publicMood: hasSocialEvidence
      ? agentOpinion?.publicMood || profile.publicMood
      : "radar editorial em acompanhamento",
    captureLabel: hasSocialEvidence ? agentOpinion?.captureLabel || profile.captureLabel : "leituras editoriais separadas",
    signalLabel: hasSocialEvidence ? primarySignal : "fonte confirmada",
    sourceContext,
    agentContext: agentOpinion?.agentContext || profile.context,
    agentEvaluation: hasSocialEvidence
      ? agentOpinion?.agentEvaluation || profile.evaluation
      : "Leitura da equipe: assunto relevante, mas só vira conversa em alta quando Facebook, Instagram, X ou outra fonte pública entregarem sinal verificável.",
    voices: agentOpinion?.voices || fallbackVoices
  };
};

const dailyBuzzFallbackImages = [
  "./assets/home-cache/buzz-cruzeiro-01.jpg",
  "./assets/home-cache/buzz-cultura-show.jpg",
  "./assets/home-cache/buzz-via-cruzeiro.jpg",
  "./assets/home-cache/buzz-cruzeiro-03.jpg",
  "./assets/home-cache/buzz-model-local.jpg",
  "./assets/home-cache/ent-theater-stage.jpg"
];

const getDailyBuzzDisplayImageUrl = (article = {}, index = 0) => {
  const realImageUrl = sanitizeImageUrl(getArticleDisplayImageUrl(article) || article.imageUrl || "");
  if (realImageUrl) {
    return realImageUrl;
  }

  return dailyBuzzFallbackImages[index % dailyBuzzFallbackImages.length];
};

const getPublicSourceStatusBadge = (article = {}, networkContext = {}) => {
  if (networkContext?.hasSocialEvidence === true || getBuzzSocialEvidence(article).hasSocialEvidence) {
    return {
      label: "sinal social real",
      className: "is-social-real"
    };
  }

  const sourceName = normalizeText(article.sourceName || article.sourceTitle || article.source || "");
  const sourceUrl = String(article.sourceUrl || article.url || article.link || "").trim();
  const hasConfirmedSource =
    sourceUrl &&
    sourceUrl !== "#" &&
    !/^#/i.test(sourceUrl) &&
    !/^\.\/index\.html#trending/i.test(sourceUrl) &&
    !/\b(radar social|radar editorial|timeline local|tendencia local|tendência local)\b/.test(sourceName);

  if (hasConfirmedSource) {
    return {
      label: "fonte confirmada",
      className: "is-source-confirmed"
    };
  }

  return {
    label: "radar editorial",
    className: "is-editorial-radar"
  };
};

const buildDailyInfluencerBuzzCard = (item = {}, index = 0, agentPulse = null) => {
  const article = normalizeRuntimeArticle(item);
  const href = buildArticleHref(article);
  const externalAttrs = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noreferrer"' : "";
  const networkContext = resolveBuzzNetworkContext(article, index);
  const pulse = buildBuzzAudiencePulse(article, networkContext, index, agentPulse);
  const hasSocialEvidence = networkContext.hasSocialEvidence === true;
  const sourceStatus = getPublicSourceStatusBadge(article, networkContext);
  const photoUrl = getDailyBuzzDisplayImageUrl(article, index);
  const avatarUrl = sanitizeImageUrl(article.sourceImageUrl) || photoUrl;
  const dateLabel =
    formatCompactDisplayDate(article.publishedAt || article.date || article.createdAt || "") ||
    article.date ||
    "agora";
  const sourceMeta = [article.sourceName || networkContext.network || "Fonte ativa", dateLabel]
    .filter(Boolean)
    .join(" · ");
  const headline = truncateCopy(article.title || "Polemica em repercussao nas redes", 110);
  const summary = truncateCopy(
    cleanArticleExcerpt(
      article.displaySummary || article.lede || article.summary,
      "O assunto entrou na conversa pública e segue em acompanhamento."
    ),
    190
  );
  const networkLabel = hasSocialEvidence
    ? `${networkContext.network || "Rede"} • sinal ${index + 1}`
    : `radar editorial • caso ${index + 1}`;
  const signalLine = hasSocialEvidence
    ? `${networkContext.network || "Rede"}: ${pulse.signalLabel || "comentários"}`
    : `status: ${sourceStatus.label}`;
  const debateLine = `debate: ${pulse.debateAxis}`;
  const satisfactionPercent = clampBuzzPercent(pulse.satisfaction || pulse.meter || 50, 0, 100);
  const meterLabel = hasSocialEvidence ? "satisfação pública" : "relevância editorial";
  const voiceMarkup = (Array.isArray(pulse.voices) ? pulse.voices : [])
    .map(
      (voice) => `
        <div class="buzz-voice" style="--voice-weight:${clampBuzzPercent(voice.weight || 42, 0, 100)}%">
          <em>${escapeHtml(voice.label || "voz")}</em>
          <p>${escapeHtml(voice.text || "")}</p>
          <i aria-hidden="true"></i>
        </div>
      `
    )
    .join("");

  return `
    <article class="trending-card influencer-buzz-card daily-buzz-card opinion-buzz-card ${
      hasSocialEvidence ? "has-social-evidence" : "no-social-evidence"
    } reveal ${
      index > 2 ? "delay-2" : index ? "delay-1" : ""
    }">
      <span class="trend-badge hot">${escapeHtml(networkLabel)}</span>
      <span class="source-status-badge ${escapeHtml(sourceStatus.className)}">${escapeHtml(sourceStatus.label)}</span>
      <a
        class="trend-photo influencer-hero-photo"
        href="${escapeRuntimeAttribute(href)}"${externalAttrs}
        aria-label="${escapeRuntimeAttribute(headline)}"
        style="--trend-image:url('${escapeHtml(photoUrl)}')"
      >
        <div class="influencer-profile">
          <span class="influencer-avatar" style="--avatar-image:url('${escapeHtml(avatarUrl)}')"></span>
          <div>
            <strong>${escapeHtml(hasSocialEvidence ? networkContext.network || "Rede social" : article.sourceName || "Radar editorial")}</strong>
            <small>${escapeHtml(sourceMeta)}</small>
          </div>
        </div>
      </a>

      <div class="influencer-buzz-copy">
        <p class="buzz-kicker">${escapeHtml(pulse.kicker)}</p>
        <h3>
          <a class="buzz-card-link" href="${escapeRuntimeAttribute(href)}"${externalAttrs}>${escapeHtml(headline)}</a>
        </h3>
        <p>${escapeHtml(summary)}</p>
      </div>

      <div class="buzz-inline-meta" aria-label="Status da fonte e eixo do debate">
        <span>${escapeHtml(signalLine)}</span>
        <span>${escapeHtml(debateLine)}</span>
      </div>

      <div class="buzz-reaction-box buzz-public-capture" aria-label="Captação pública e avaliação dos agentes">
        <div class="buzz-capture-head">
          <span>${hasSocialEvidence ? "captação pública diversa" : "radar editorial"}</span>
          <strong>${escapeHtml(pulse.captureLabel || "vozes separadas")}</strong>
        </div>
        <p class="buzz-source-context">${escapeHtml(pulse.sourceContext || "Sinais públicos separados antes da avaliação.")}</p>
        <div class="buzz-voice-list" aria-label="Vozes captadas sobre o tema">
          ${voiceMarkup}
        </div>
        <div class="buzz-agent-evaluation">
          <span>clima e avaliação dos agentes</span>
          <p>${escapeHtml(pulse.agentContext || "Contexto editorial reunido antes da escrita autoral.")}</p>
          <strong>${escapeHtml(pulse.agentEvaluation || "Avaliação dos agentes em revisão.")}</strong>
        </div>
        <div class="buzz-satisfaction-panel" aria-label="${escapeRuntimeAttribute(meterLabel)}: ${satisfactionPercent}%">
          <div class="buzz-satisfaction-head">
            <span>${escapeHtml(meterLabel)}</span>
            <strong>${satisfactionPercent}%</strong>
          </div>
          <div class="reaction-meter public-satisfaction-meter">
            <i style="width: ${satisfactionPercent}%"></i>
          </div>
        </div>
      </div>

      <div class="engagement buzz-opinion-footer">
        <span>${escapeHtml(pulse.publicMood)}</span>
        <a href="${escapeRuntimeAttribute(href)}"${externalAttrs}>abrir caso</a>
      </div>
    </article>
  `;
};

const rerenderEditorialRemainderSurfaces = () => {
  window.setTimeout(() => {
    renderArchiveHighlights();
    renderLiveFeed();
  }, 0);
};

const renderDailyTrendingBuzz = async (options = {}) => {
  if (!trendingBuzzGrid) {
    return;
  }

  const [liveBuzzItems, socialTrendItems, agentPulse] = await Promise.all([
    fetchTopicFeedCached("buzz", 12, options),
    fetchSocialTrendsCached(12, options),
    fetchDailyAgentPulseCached(options)
  ]);
  const reservedKeys = buildReservedArticleKeys(["dailyBuzz"]);
  const reservedImages = buildReservedArticleImageKeys(["dailyBuzz"]);
  const socialCases = dedupeNewsItems(socialTrendItems)
    .map((item) => normalizeRuntimeArticle(item))
    .filter((item) => item.title && (item.sourceUrl || item.slug))
    .filter(shouldUseNationalPoliticsInHotSurface)
    .filter((item) => getBuzzSocialEvidence(item).hasSocialEvidence);
  const liveCases = dedupeNewsItems(liveBuzzItems)
    .map((item) => normalizeRuntimeArticle(item))
    .filter(isBrazilBuzzArticle)
    .filter(shouldUseNationalPoliticsInHotSurface)
    .filter((item) => item.title && (item.sourceUrl || item.slug))
    .sort((left, right) =>
      compareEditorialFlowArticles(left, right, {
        scoreFn: getBuzzControversyScore,
        imageBias: true
      })
    )
    .filter((item) => {
      const key = getArticleUsageKey(item);
      const imageKey = getArticleImageKey(item);
      if (!key || reservedKeys.has(key) || (imageKey && reservedImages.has(imageKey))) {
        return false;
      }

      reservedKeys.add(key);
      if (imageKey) {
        reservedImages.add(imageKey);
      }
      return true;
    })
    .slice(0, 6);
  const selectedPool = dedupeNewsItems([...socialCases, ...liveCases]);

  const selectedCases =
    selectedPool.length >= 6
      ? selectedPool.slice(0, 6)
      : [...selectedPool, ...pickDailyItems(getBuzzFallbackItems(), 6 - selectedPool.length, 31)].slice(0, 6);

  trendingBuzzGrid.classList.add("is-daily-buzz", "is-opinion-grid");
  trendingBuzzGrid.innerHTML = selectedCases
    .map((item, itemIndex) => buildDailyInfluencerBuzzCard(item, itemIndex, agentPulse))
    .join("");
  reserveSurfaceArticles("dailyBuzz", selectedCases);
  registerArticleCardLinks(trendingBuzzGrid);
  rerenderEditorialRemainderSurfaces();
};

const whatMattersTopics = [
  {
    key: "cheia-jurua",
    label: "Cheia / Juruá",
    cta: "Abrir cobertura",
    href: "./arquivo.html?busca=cheia",
    fallbackTitle: "Rio, bairros e Defesa Civil abrem a leitura prática do dia",
    fallbackSummary: "Quando a base atualiza, este card puxa a notícia mais recente sobre cheia, chuva ou rotina do Juruá.",
    matcher: /\b(cheia|enchente|alag|alagamento|rio jurua|rio juru[aá]|jurua|juru[aá]|defesa civil|abrigo|desabrig|cota|vazante|chuva|seca|bairro|familias atingidas|famílias atingidas)\b/
  },
  {
    key: "eventos",
    label: "Eventos",
    cta: "Ver agenda",
    href: "#social",
    fallbackTitle: "Agenda cultural entra junto com trânsito, público e serviço",
    fallbackSummary: "Shows, festas e encontros aparecem com data, local e efeito para a cidade.",
    matcher: /\b(show|festa|festival|evento|agenda|cultura|cultural|musica|música|teatro|cavalgada|feira|encontro|palco|artista|cantor|cantora)\b/
  },
  {
    key: "utilidade",
    label: "Utilidade pública",
    cta: "Abrir serviço",
    href: "./catalogo-servicos.html",
    fallbackTitle: "Prazos, atendimento e avisos úteis ficam separados do ruído",
    fallbackSummary: "Benefícios, saúde, educação, energia, trânsito e serviços ganham prioridade de leitor.",
    matcher: /\b(utilidade|servico|serviço|prazo|calendario|calendário|edital|concurso|inscric|atendimento|hospital|ubs|upa|saude|saúde|educacao|educação|bolsa familia|bolsa família|inss|energia|transito|trânsito|detran|rodovia|alerta|vacina|pix|beneficio|benefício)\b/
  },
  {
    key: "continuidade",
    label: "Continuidade",
    cta: "Ver subsites",
    href: "#cadernos",
    fallbackTitle: "Da home para arquivo, serviços e subsites sem perder o fio",
    fallbackSummary: "O caminho rápido mantém notícia, acervo e páginas especiais conectados.",
    matcher: /\b(esttiles|lifestile|infantil|estudantes|games|animes|servicos|serviços|arquivo|especial|guia|catalogo|catálogo)\b/
  }
];

const getWhatMattersArticleTopic = (article = {}, usedTopicKeys = new Set()) => {
  const normalizedArticle = normalizeRuntimeArticle(article);
  const text = normalizeText(
    [
      normalizedArticle.title,
      normalizedArticle.summary,
      normalizedArticle.lede,
      normalizedArticle.category,
      normalizedArticle.categoryKey,
      normalizedArticle.sourceName
    ].join(" ")
  );

  return whatMattersTopics.find((topic) => !usedTopicKeys.has(topic.key) && topic.matcher.test(text)) || null;
};

const buildWhatMattersCard = (article = {}, topic = whatMattersTopics[0], index = 0) => {
  const normalizedArticle = normalizeRuntimeArticle(article);
  const href = normalizedArticle.slug ? buildArticleHref(normalizedArticle) : topic.href;
  const externalAttrs = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noreferrer"' : "";
  const sourceStatus = getPublicSourceStatusBadge(normalizedArticle);
  const dateLabel =
    formatCompactDisplayDate(normalizedArticle.publishedAt || normalizedArticle.date || normalizedArticle.createdAt || "") ||
    normalizedArticle.date ||
    "agora";
  const title = truncateCopy(normalizedArticle.title || "Atualização importante", 98);
  const summary = truncateCopy(
    cleanArticleExcerpt(
      normalizedArticle.displaySummary || normalizedArticle.lede || normalizedArticle.summary,
      "Atualização em acompanhamento no portal."
    ),
    138
  );

  return `
    <article class="what-matters-card reveal ${index ? "delay-1" : ""}">
      <span class="source-status-badge ${escapeHtml(sourceStatus.className)}">${escapeHtml(sourceStatus.label)}</span>
      <p>${escapeHtml(topic.label)}</p>
      <h3><a href="${escapeRuntimeAttribute(href)}"${externalAttrs}>${escapeHtml(title)}</a></h3>
      <small>${escapeHtml(summary)}</small>
      <footer>
        <span>${escapeHtml(normalizedArticle.sourceName || "Fonte ativa")} · ${escapeHtml(dateLabel)}</span>
        <a href="${escapeRuntimeAttribute(href)}"${externalAttrs}>${escapeHtml(topic.cta)}</a>
      </footer>
    </article>
  `;
};

const renderWhatMattersNow = (items = []) => {
  if (!whatMattersGrid) {
    return;
  }

  const sourceItems = dedupeNewsItems(
    [
      ...(Array.isArray(items) ? items : []),
      ...(Array.isArray(liveFeedState.items) ? liveFeedState.items : []),
      ...(Array.isArray(window.NEWS_DATA) ? window.NEWS_DATA : [])
    ].filter(Boolean)
  )
    .map((item) => normalizeRuntimeArticle(item))
    .filter((item) => item.title && (item.sourceUrl || item.slug))
    .filter((item) => !isNationalPoliticsArticle(item) || hasClearLocalReaderImpact(item))
    .sort((left, right) =>
      compareEditorialFlowArticles(left, right, {
        imageBias: false
      })
    );

  const selected = [];
  const usedTopics = new Set();
  const usedKeys = buildReservedArticleKeys(["whatMatters"]);

  for (const article of sourceItems) {
    if (selected.length >= whatMattersTopics.length) {
      break;
    }

    const topic = getWhatMattersArticleTopic(article, usedTopics);
    const key = getArticleUsageKey(article);
    if (!topic || !key || usedKeys.has(key)) {
      continue;
    }

    usedTopics.add(topic.key);
    usedKeys.add(key);
    selected.push({ article, topic });
  }

  whatMattersTopics.forEach((topic) => {
    if (selected.some((item) => item.topic.key === topic.key)) {
      return;
    }

    selected.push({
      topic,
      article: {
        title: topic.fallbackTitle,
        summary: topic.fallbackSummary,
        lede: topic.fallbackSummary,
        sourceName: "Radar editorial",
        sourceUrl: topic.href,
        category: topic.label,
        publishedAt: new Date().toISOString()
      }
    });
  });

  whatMattersGrid.innerHTML = selected
    .slice(0, whatMattersTopics.length)
    .map(({ article, topic }, index) => buildWhatMattersCard(article, topic, index))
    .join("");

  if (selected.length) {
    reserveSurfaceArticles("whatMatters", selected.map((item) => item.article));
    registerArticleCardLinks(whatMattersGrid);
  }
};

const monthlyFallbackStories = [
  {
    title: "Criadores locais puxam a conversa da semana com vídeos de eventos",
    summary: "O recorte cruza posts, eventos e comentários para mostrar quem movimentou a timeline regional.",
    imageUrl: "./assets/home-cache/buzz-cruzeiro-01.jpg",
    sourceName: "Radar social",
    category: "Festas & Social",
    sourceUrl: "./index.html#monthly",
    monthlyTone: "celebs"
  },
  {
    title: "Agenda cultural vira termômetro de reputação para artistas e produtores",
    summary: "Shows, oficinas e eventos comunitários seguem rendendo cobrança por calendário mais claro.",
    imageUrl: "./assets/home-cache/buzz-cultura-show.jpg",
    sourceName: "Cultura local",
    category: "Cultura",
    sourceUrl: "./index.html#monthly",
    monthlyTone: "creators"
  },
  {
    title: "Debate urbano continua dividindo leitores entre pressa e planejamento",
    summary: "Mobilidade, obras e serviços aparecem como os temas que mais geram contraponto público.",
    imageUrl: "./assets/home-cache/buzz-via-cruzeiro.jpg",
    sourceName: "Radar da cidade",
    category: "Cotidiano",
    sourceUrl: "./index.html#monthly",
    monthlyTone: "civic"
  },
  {
    title: "Comunidades cobram resposta antes de decisões que mudam a rotina",
    summary: "O dia segue marcado por pedidos de diálogo, transparência e retorno objetivo ao morador.",
    imageUrl: "./assets/home-cache/buzz-cruzeiro-04.jpg",
    sourceName: "Comunidade",
    category: "Utilidade Pública",
    sourceUrl: "./index.html#monthly",
    monthlyTone: "territory"
  },
  {
    title: "Humor local transforma reclamação em pressão pública organizada",
    summary: "Memes e vídeos curtos deram alcance a temas de serviço, bairro e comunicação oficial.",
    imageUrl: "./assets/home-cache/buzz-cruzeiro-03.jpg",
    sourceName: "Timeline local",
    category: "Buzz",
    sourceUrl: "./index.html#monthly",
    monthlyTone: "pulse"
  },
  {
    title: "Nomes regionais ganham mais espaço em collabs, campanhas e lives",
    summary: "A vitrine social ficou mais distribuída entre criadores, pequenos negócios e eventos locais.",
    imageUrl: "./assets/home-cache/buzz-model-local.jpg",
    sourceName: "Radar de marcas",
    category: "Social",
    sourceUrl: "./index.html#monthly",
    monthlyTone: "brands"
  }
];

const monthlyHeavyCrimePattern =
  /\b(homicidio|homicídio|assassin|estupro|morte|morreu|cadaver|cadáver|facada|tiro|execucao|execução)\b/;

const getMonthlyArticleScore = (article = {}) => {
  const normalized = normalizeRuntimeArticle(article);
  const haystack = normalizeText(
    [
      normalized.title,
      normalized.summary,
      normalized.lede,
      normalized.category,
      normalized.categoryKey,
      normalized.sourceName,
      normalized.topicGroup,
      normalized.networkHint
    ].join(" ")
  );
  let score = 12;

  if (!normalized.title || !(normalized.sourceUrl || normalized.slug)) return -100;
  if (monthlyHeavyCrimePattern.test(haystack)) score -= 36;
  if (/\b(festa|show|artista|cantor|cantora|cultura|evento|festival|influenc|criador|criadora|modelo|marca|social|viral|meme|reels|story|tiktok|instagram)\b/.test(haystack)) score += 26;
  if (/\b(polem|debate|critica|cobr|divide|repercuss|opiniao|bastidor|boato|timeline|comentarios|comunidade)\b/.test(haystack)) score += 24;
  if (/\b(prefeitura|governo|governadora|vereador|deputad|obra|mobilidade|bairro|servico|serviço|educacao|saude)\b/.test(haystack)) score += 10;
  if (/\b(cruzeiro do sul|jurua|juru[aá]|acre|rio branco)\b/.test(haystack)) score += 12;
  if (articleHasUsableImageCandidate(normalized)) score += 10;

  const ageDays = getEntertainmentAgeDays(normalized);
  if (ageDays <= 7) score += 16;
  else if (ageDays <= 30) score += 9;
  else if (ageDays > 90) score -= 10;

  return score;
};

const getMonthlyTone = (article = {}, index = 0) => {
  const normalized = normalizeRuntimeArticle(article);
  const haystack = normalizeText(
    [normalized.title, normalized.summary, normalized.lede, normalized.category, normalized.categoryKey, normalized.sourceName, article.monthlyTone].join(" ")
  );

  if (/\b(agents|agente|agentes reais|rodada diaria|rodada diária|monitoramento)\b/.test(haystack)) {
    return { tag: "Assuntos do dia", className: "month-creators", axis: "em acompanhamento" };
  }

  if (/\b(festa|social|celebridade|modelo|marca|collab|criador|criadora|influenc|reels|story|tiktok|instagram)\b/.test(haystack)) {
    return { tag: "Celebridades da semana", className: "month-celebs", axis: "alcance social" };
  }

  if (/\b(cultura|show|palco|artista|cantor|cantora|evento|festival|agenda)\b/.test(haystack)) {
    return { tag: "Criadores em alta", className: "month-creators", axis: "cultura e agenda" };
  }

  if (/\b(polem|debate|critica|cobr|divide|boato|repercuss|opiniao|timeline)\b/.test(haystack)) {
    return { tag: "Polêmica em debate", className: "month-civic", axis: "opinião pública" };
  }

  if (/\b(bairro|comunidade|obra|mobilidade|servico|serviço|risco|transito|trânsito)\b/.test(haystack)) {
    return { tag: "Comunidade local", className: "month-territory", axis: "bairro e gestão" };
  }

  const fallback = [
    { tag: "Recorte social", className: "month-celebs", axis: "rede local" },
    { tag: "Influência local", className: "month-creators", axis: "criadores" },
    { tag: "Polêmica da semana", className: "month-civic", axis: "debate" },
    { tag: "Termômetro da cidade", className: "month-territory", axis: "comunidade" }
  ];
  return fallback[index % fallback.length];
};

const getDailyAgentActionForCard = (agentPulse = null, index = 0) => {
  const actions = Array.isArray(agentPulse?.actions) ? agentPulse.actions : [];
  return actions[index % Math.max(actions.length, 1)] || null;
};

const buildDailyAgentLabel = (agentPulse = null, action = null) => {
  const runLabel =
    formatCompactDisplayDate(agentPulse?.runGeneratedAt || agentPulse?.updatedAt || "") ||
    "hoje";
  const topicName = action?.title || action?.agent || "Leitura local";
  const officeName = action?.office || "Portal";
  return `${truncateCopy(topicName, 34)} • ${officeName} • ${runLabel}`;
};

const buildMonthlyDynamicCard = (item = {}, index = 0, agentPulse = null) => {
  const article = normalizeRuntimeArticle(item);
  const tone = getMonthlyTone(article, index);
  const agentAction = getDailyAgentActionForCard(agentPulse, index);
  const shouldShowInternalAgentNote = false;
  const href = buildArticleHref(article);
  const externalAttrs = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noreferrer"' : "";
  const imageUrl = sanitizeImageUrl(
    getArticleDisplayImageUrl(article) ||
      article.imageUrl ||
      monthlyFallbackStories[index % monthlyFallbackStories.length].imageUrl
  );
  const dateLabel =
    formatCompactDisplayDate(article.publishedAt || article.date || article.createdAt || "") ||
    formatCompactDisplayDate(new Date().toISOString());
  const score = Math.max(38, Math.min(96, getMonthlyArticleScore(article) + 32 + (index % 3) * 4));
  const delayClass = index % 3 === 1 ? "delay-1" : index % 3 === 2 ? "delay-2" : "";

  return `
    <article class="month-card ${escapeHtml(tone.className)} month-dynamic-card reveal ${delayClass}" data-live-score="${score}">
      <div class="month-card-topline">
        <span class="month-tag">${escapeHtml(tone.tag)}</span>
        <span class="month-live-pill">diário</span>
      </div>
      <a
        class="month-photo"
        href="${escapeRuntimeAttribute(href)}"${externalAttrs}
        aria-label="${escapeRuntimeAttribute(article.title || "Abrir recorte")}"
        style="--month-image:url('${escapeHtml(imageUrl)}')"
      ></a>
      <h3>
        <a href="${escapeRuntimeAttribute(href)}"${externalAttrs}>${escapeHtml(truncateCopy(article.title || "Recorte social em atualização", 108))}</a>
      </h3>
      <p>${escapeHtml(truncateCopy(cleanArticleExcerpt(article.lede || article.summary, "Tema em acompanhamento no portal."), 142))}</p>
      <div class="month-signal" aria-label="Força de repercussão">
        <span>${escapeHtml(tone.axis)}</span>
        <i><b style="width:${score}%"></b></i>
      </div>
      ${shouldShowInternalAgentNote ? `<div class="month-agent-note" aria-label="Leitura do dia">
        <strong>${escapeHtml(buildDailyAgentLabel(agentPulse, agentAction))}</strong>
        <span>${escapeHtml(truncateCopy(agentAction?.title || "Resumo do dia reuniu notícia, redes e temas em debate.", 118))}</span>
      </div>` : ""}
      <small>${escapeHtml(article.sourceName || "Fonte ativa")} · ${escapeHtml(dateLabel)}</small>
    </article>
  `;
};

const pickMonthlyDynamicStories = async (options = {}) => {
  const [liveBuzzItems, socialTrendItems, agentPulse] = await Promise.all([
    fetchTopicFeedCached("buzz", 18, options),
    fetchSocialTrendsCached(12, options),
    fetchDailyAgentPulseCached(options)
  ]);
  const candidates = dedupeNewsItems([
    ...socialTrendItems,
    ...liveBuzzItems,
    ...(Array.isArray(window.NEWS_DATA) ? window.NEWS_DATA : [])
  ])
    .map((item) => normalizeRuntimeArticle(item))
    .filter(shouldUseNationalPoliticsInHotSurface)
    .map((article) => ({ article, score: getMonthlyArticleScore(article) }))
    .filter((entry) => entry.score >= 12)
    .sort((left, right) => {
      const flowDiff = compareEditorialFlowArticles(left.article, right.article, {
        scoreFn: getMonthlyArticleScore,
        imageBias: true
      });
      if (flowDiff !== 0) return flowDiff;
      return right.score - left.score;
    });

  const selected = [];
  const usedKeys = buildReservedArticleKeys(["monthly"]);
  const usedImages = buildReservedArticleImageKeys(["monthly"]);

  for (const { article } of candidates) {
    if (selected.length >= 6) break;
    const articleKey = getArticleUsageKey(article);
    const imageKey = getArticleImageKey(article);
    if (!articleKey || usedKeys.has(articleKey)) continue;
    if (imageKey && usedImages.has(imageKey)) continue;
    usedKeys.add(articleKey);
    if (imageKey) usedImages.add(imageKey);
    selected.push(article);
  }

  if (selected.length < 6) {
    pickDailyItems(monthlyFallbackStories, 6 - selected.length, 73).forEach((item) => selected.push(item));
  }

  return {
    stories: selected.slice(0, 6),
    agentPulse
  };
};

const renderDynamicMonthlyBuzz = async (options = {}) => {
  if (!monthlyBuzzGrid) {
    return;
  }

  const { stories, agentPulse } = await pickMonthlyDynamicStories(options);
  monthlyBuzzGrid.classList.add("is-dynamic-monthly");
  monthlyBuzzGrid.innerHTML = stories.map((story, index) => buildMonthlyDynamicCard(story, index, agentPulse)).join("");
  reserveSurfaceArticles("monthly", stories);
  monthlyBuzzGrid
    .querySelectorAll(".reveal")
    .forEach((node) => node.classList.add("active", "is-visible"));
  registerArticleCardLinks(monthlyBuzzGrid);
  rerenderEditorialRemainderSurfaces();
};

const communityTrendFallbackTopics = [
  {
    title: "Bairros cobram resposta rápida para serviços do dia",
    summary: "Relatos de rua, iluminação, drenagem e atendimento público puxam a conversa local.",
    category: "Comunidade",
    sourceName: "Radar social",
    hashtags: ["#Bairros", "#ServicoPublico", "#CZS"]
  },
  {
    title: "Agenda cultural e eventos movimentam stories e grupos",
    summary: "Shows, encontros e cenas da cidade ajudam o leitor a escolher a programação local.",
    category: "Cultura",
    sourceName: "Tendência local",
    hashtags: ["#AgendaCultural", "#ValeDoJurua", "#CruzeiroDoSul"]
  },
  {
    title: "Humor local transforma reclamação em cobrança pública",
    summary: "Memes, prints e vídeos curtos aumentam o alcance de assuntos que precisam de contexto.",
    category: "Buzz",
    sourceName: "Redes sociais",
    hashtags: ["#BuzzLocal", "#MemeDoDia", "#Acre"]
  },
  {
    title: "Comércio e pequenos negócios entram na conversa",
    summary: "Produtos, filas, promoções e atendimento aparecem entre os temas mais compartilhados.",
    category: "Negócios",
    sourceName: "Radar de marcas",
    hashtags: ["#ComercioLocal", "#Negocios", "#CZS"]
  },
  {
    title: "Política regional gera debate e pedido de explicação",
    summary: "Decisões públicas, cobranças e explicações ganham força quando afetam a rotina da cidade.",
    category: "Política",
    sourceName: "Debate público",
    hashtags: ["#PoliticaAcre", "#DebatePublico", "#Jurua"]
  }
];

const communityTrendStopwords = new Set([
  "para",
  "por",
  "com",
  "uma",
  "um",
  "dos",
  "das",
  "que",
  "como",
  "mais",
  "sobre",
  "apos",
  "após",
  "dia",
  "tem",
  "ter",
  "foi",
  "sao",
  "são",
  "esta",
  "está",
  "de",
  "do",
  "da",
  "em",
  "no",
  "na",
  "ao",
  "as",
  "os",
  "e",
  "a",
  "o"
]);

const communityTrendPortuguesePattern =
  /\b(brasil|brasileir|acre|jurua|juru[aá]|cruzeiro do sul|czs|rio branco|amazonia|amazônia|cultura|politica|política|servico|serviço|saude|saúde|educacao|educação|cidade|bairro|comunidade|prefeitura|governo|agenda|evento|show|festa|comercio|comércio|negocio|negócio|cotidiano|chuva|rua|obra|transito|trânsito|esporte|futebol|musica|música|noticia|notícia|debate|publico|público|viralizou|repercussao|repercussão|memes?|hoje)\b/i;

const isPortugueseCommunityTrendText = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return false;
  if (/[^\u0000-\u024F#_\s\d.,'’$-]/u.test(raw)) return false;
  if (/^#?[A-Z0-9_]{8,}$/u.test(raw) && !/(BRASIL|ACRE|JURUA|CZS)/u.test(raw)) return false;
  if (/_/.test(raw) && !/(vale_do_jurua|cruzeiro_do_sul)/i.test(raw)) return false;

  const spaced = raw.replace(/^#/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
  const normalized = normalizeText(spaced);
  if (/^(?:\d{1,2}h|\d{1,2}:\d{2})$/i.test(normalized)) return false;
  return communityTrendPortuguesePattern.test(raw) || communityTrendPortuguesePattern.test(normalized);
};

const isPortugueseCommunityTrendItem = (item = {}) => {
  const tags = Array.isArray(item.hashtags) ? item.hashtags : [];
  return [
    item.title,
    item.summary,
    item.lede,
    item.category,
    item.sourceName,
    item.topicGroup,
    ...tags
  ].some(isPortugueseCommunityTrendText);
};

const normalizeCommunityHashtag = (value = "") => {
  const cleaned = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter((part) => part && !communityTrendStopwords.has(part.toLowerCase()))
    .slice(0, 3)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");

  return cleaned ? `#${cleaned}` : "";
};

const buildCommunityTrendHashtags = (items = []) => {
  const fixedTags = ["#CZS", "#ValeDoJurua", "#Acre"];
  const dynamicTags = [];

  items.forEach((item) => {
    const providedTags = Array.isArray(item.hashtags) ? item.hashtags : [];
    providedTags.forEach((tag) => {
      const safeTag = tag.startsWith("#") ? tag : normalizeCommunityHashtag(tag);
      if (safeTag && isPortugueseCommunityTrendText(safeTag)) dynamicTags.push(safeTag);
    });

    [item.category, item.topicGroup, item.sourceName, item.title]
      .map(normalizeCommunityHashtag)
      .filter(Boolean)
      .forEach((tag) => dynamicTags.push(tag));
  });

  return [...new Set([...fixedTags, ...dynamicTags])]
    .filter((tag) => tag.length > 1 && tag.length <= 32 && isPortugueseCommunityTrendText(tag))
    .slice(0, 12);
};

const getCommunityTrendScore = (article = {}) => {
  const normalized = normalizeRuntimeArticle(article);
  const haystack = normalizeText(
    [
      normalized.title,
      normalized.summary,
      normalized.lede,
      normalized.category,
      normalized.sourceName,
      normalized.topicGroup
    ].join(" ")
  );
  let score = 18;

  if (!normalized.title) return -100;
  if (/\b(trend|viral|buzz|coment|repercuss|polem|debate|hashtag|story|stories|video|meme)\b/.test(haystack)) score += 34;
  if (/\b(cruzeiro do sul|jurua|juru[aá]|acre|bairro|comunidade|centro)\b/.test(haystack)) score += 22;
  if (/\b(servico|serviço|agenda|evento|show|cultura|politica|prefeitura|obra|comercio|negocio)\b/.test(haystack)) score += 16;

  const ageHours = Math.max(0, (Date.now() - getArticlePublishedTime(normalized)) / 36e5);
  if (ageHours <= 24) score += 28;
  else if (ageHours <= 72) score += 16;
  else if (ageHours > 168) score -= 12;

  return score;
};

const pickCommunityTrendTopics = async (options = {}) => {
  const externalTrendItems = (await fetchSocialTrendsCached(24, options)).filter(isPortugueseCommunityTrendItem);
  const liveBuzzItems = await fetchTopicFeedCached("buzz", 18, options);
  const liveItems = dedupeNewsItems([
    ...liveBuzzItems,
    ...(Array.isArray(window.NEWS_DATA) ? window.NEWS_DATA : [])
  ])
    .map((item) => normalizeRuntimeArticle(item))
    .map((article) => ({ article, score: getCommunityTrendScore(article) }))
    .filter((entry) => entry.score >= 22)
    .sort((left, right) => {
      const flowDiff = compareEditorialFlowArticles(left.article, right.article, {
        scoreFn: getCommunityTrendScore
      });
      if (flowDiff !== 0) return flowDiff;
      return right.score - left.score;
    })
    .map((entry) => entry.article);

  const selected = [];
  const used = new Set();
  const pushTrend = (item) => {
    if (selected.length >= 6) return;
    const normalized = normalizeRuntimeArticle(item);
    const key = getArticleUsageKey(normalized) || normalizeText(normalized.title);
    if (!key || used.has(key)) return;
    used.add(key);
    selected.push(normalized);
  };

  externalTrendItems.forEach(pushTrend);
  liveItems.forEach(pushTrend);
  pickDailyItems(communityTrendFallbackTopics, communityTrendFallbackTopics.length, 91).forEach(pushTrend);

  return selected;
};

const renderCommunityTrendCard = async (options = {}) => {
  if (!communityTrendCard) {
    return;
  }

  const topics = await pickCommunityTrendTopics(options);
  const mainTopic = topics[0] || communityTrendFallbackTopics[0];
  const hashtags = buildCommunityTrendHashtags(topics);
  const updatedLabel = new Intl.DateTimeFormat("pt-BR", {
    timeZone: localeTimeZone,
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());

  if (communityTrendTitle) {
    communityTrendTitle.textContent = truncateCopy(mainTopic.title || "Assuntos em atualização", 64);
  }

  if (communityTrendSummary) {
    communityTrendSummary.textContent = truncateCopy(
      mainTopic.summary || mainTopic.lede || "Assuntos que estão rendendo conversa hoje.",
      92
    );
  }

  if (communityTrendUpdated) {
    communityTrendUpdated.textContent = mainTopic.externalSource ? `internet ${updatedLabel}` : `atualizado ${updatedLabel}`;
  }

  if (communityTrendCaptions) {
    communityTrendCaptions.innerHTML = topics
      .slice(0, 3)
      .map((item, index) => {
        const label = item.socialPlatform || item.category || item.sourceName || (index === 0 ? "top trend" : "em alta");
        return `
          <span>
            <b>${escapeHtml(truncateCopy(label, 22))}</b>
            ${escapeHtml(truncateCopy(item.title || "Assunto em alta no dia", 58))}
          </span>
        `;
      })
      .join("");
  }

  if (communityTrendTags) {
    communityTrendTags.innerHTML = hashtags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  }
};

const setFeedbackState = (node, message, tone = "") => {
  if (!node) {
    return;
  }

  node.textContent = message || "";
  node.classList.remove("is-error", "is-success");

  if (tone) {
    node.classList.add(tone);
  }
};

const getArticleSourceEntries = (article = {}) => {
  const entries = [];
  const pushEntry = (entry = {}) => {
    const name = cleanArticleText(entry.name || entry.sourceName || entry.source || entry.label || "");
    const url = String(entry.url || entry.sourceUrl || entry.href || "").trim();
    const key = normalizeText(url || name);

    if (!key || entries.some((item) => normalizeText(item.url || item.name) === key)) {
      return;
    }

    entries.push({ name: name || "Fonte local", url });
  };

  [article.crossSources, article.alternateSources, article.sources].forEach((collection) => {
    if (!Array.isArray(collection)) {
      return;
    }

    collection.forEach((entry) => {
      if (typeof entry === "string") {
        pushEntry({ name: entry });
        return;
      }

      pushEntry(entry);
    });
  });

  pushEntry({
    name: article.sourceName || article.source || article.sourceLabel,
    url: article.sourceUrl || article.url || article.link
  });

  return entries;
};

const getRuntimeArticleQualityScore = (article = {}) => {
  const imageUrl = String(article.imageUrl || article.feedImageUrl || article.sourceImageUrl || "").trim();
  const lede = String(article.lede || article.summary || article.description || "").trim();
  const bodyCount = Array.isArray(article.body) ? article.body.filter(Boolean).length : 0;
  const highlightsCount = Array.isArray(article.highlights) ? article.highlights.filter(Boolean).length : 0;
  const sourceUrl = String(article.sourceUrl || article.url || article.link || "").trim();
  let score = 0;

  if (String(article.title || "").trim()) score += 10;
  if (lede) score += Math.min(20, Math.ceil(lede.length / 60));
  if (imageUrl && !isGeneratedNewsFallbackImageUrl(imageUrl)) score += 30;
  if (sourceUrl && sourceUrl !== "#") score += 6;
  score += Math.min(24, bodyCount * 4);
  score += Math.min(12, highlightsCount * 2);

  if (/bloqueou o resumo importado|sem resumo|resumo em atualizacao/i.test(lede)) {
    score -= 12;
  }

  return score;
};

const mergeCrossedNewsItem = (existing = {}, candidate = {}) => {
  const candidateScore = getRuntimeArticleQualityScore(candidate);
  const existingScore = getRuntimeArticleQualityScore(existing);
  const candidateTime = getArticleSortTimestamp(candidate);
  const existingTime = getArticleSortTimestamp(existing);
  const candidateWins =
    candidateScore > existingScore || (candidateScore === existingScore && candidateTime > existingTime);
  const preferred = candidateWins ? candidate : existing;
  const secondary = candidateWins ? existing : candidate;
  const crossSources = getArticleSourceEntries(preferred);

  getArticleSourceEntries(secondary).forEach((source) => {
    const key = normalizeText(source.url || source.name);
    if (key && !crossSources.some((entry) => normalizeText(entry.url || entry.name) === key)) {
      crossSources.push(source);
    }
  });

  const alternateSlugs = [
    preferred.slug,
    secondary.slug,
    ...(Array.isArray(preferred.alternateSlugs) ? preferred.alternateSlugs : []),
    ...(Array.isArray(secondary.alternateSlugs) ? secondary.alternateSlugs : [])
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index);

  return {
    ...preferred,
    crossSources,
    alternateSources: crossSources,
    sourceCount: crossSources.length,
    alternateSlugs
  };
};

const formatCrossedSourceName = (article = {}) => {
  const sources = getArticleSourceEntries(article);

  if (sources.length > 1) {
    const extraCount = sources.length - 1;
    return `${sources[0].name} + ${extraCount} fonte${extraCount === 1 ? "" : "s"}`;
  }

  return sources[0]?.name || article.sourceName || "Fonte local";
};

const formatCrossedSourceMeta = (article = {}) => {
  const sourceName = formatCrossedSourceName(article);
  const date = article.date || formatDisplayDate(article.publishedAt || article.createdAt || "");
  return date && date !== "Sem data" ? `${sourceName} • ${date}` : sourceName;
};

const formatCrossedSourceFooter = (article = {}) => {
  const sources = getArticleSourceEntries(article);
  if (sources.length > 1) {
    return `Notícia cruzada em ${sources.length} fontes`;
  }

  return `Fonte consultada: ${sources[0]?.name || article.sourceName || "Fonte local"}`;
};

const dedupeNewsItems = (items = []) => {
  const mergedMap = new Map();

  items.forEach((item) => {
    const normalizedItem = normalizeRuntimeArticle(item);
    const key = getArchiveArticleCanonicalKey(normalizedItem);

    if (mergedMap.has(key)) {
      mergedMap.set(key, mergeCrossedNewsItem(mergedMap.get(key), normalizedItem));
    } else {
      mergedMap.set(key, normalizedItem);
    }
  });

  return [...mergedMap.values()].sort((left, right) => compareEditorialFlowArticles(left, right));
};

const cadernoCategoryPriority = {
  educacao: ["educacao"],
  "prefeitura e acoes": ["prefeitura", "politica", "cotidiano", "saude"],
  social: ["social", "saude", "cotidiano"],
  "festa & social": ["social", "cultura", "esporte", "cotidiano"],
  entretenimento: ["cultura", "social", "esporte", "cotidiano"],
  "utilidade publica": ["servicos", "cotidiano", "saude", "prefeitura"]
};

const dynamicCadernoKickers = new Set(["festa & social", "entretenimento"]);

const pickCadernoArticlesByPriority = (
  items = [],
  priorities = [],
  count = 2,
  usedKeys = new Set(),
  usedImages = buildReservedArticleImageKeys(["cadernos"])
) => {
  const normalizedItems = dedupeNewsItems(items).map((item) => normalizeRuntimeArticle(item));
  const selected = [];
  const seen = new Set();
  const tryPushArticle = (item, { requireImage = false } = {}) => {
    if (selected.length >= count || !item) {
      return;
    }

    const key = getArticleUsageKey(item);
    if (!key || seen.has(key) || usedKeys.has(key)) {
      return;
    }

    if (requireImage && !articleHasUsableImageCandidate(item)) {
      return;
    }

    const imageKey = getArticleImageKey(item);
    if (imageKey && usedImages.has(imageKey)) {
      return;
    }

    seen.add(key);
    usedKeys.add(key);
    if (imageKey) {
      usedImages.add(imageKey);
    }
    selected.push(item);
  };

  priorities.forEach((priority) => {
    normalizedItems.forEach((item) => {
      if (item.categoryKey === priority) {
        tryPushArticle(item, { requireImage: true });
      }
    });
  });

  if (selected.length < count) {
    priorities.forEach((priority) => {
      normalizedItems.forEach((item) => {
        if (item.categoryKey === priority) {
          tryPushArticle(item);
        }
      });
    });
  }

  if (selected.length < count) {
    normalizedItems.forEach((item) => {
      tryPushArticle(item, { requireImage: true });
    });
  }

  if (selected.length < count) {
    normalizedItems.forEach((item) => {
      tryPushArticle(item);
    });
  }

  return selected.slice(0, count);
};

const writeOfflineStorage = (key, value) => {
  const serialized = JSON.stringify(value);
  const storages = [];

  try {
    if (window.sessionStorage) {
      storages.push(window.sessionStorage);
    }
  } catch (error) {
    // Ignora ambiente sem sessionStorage.
  }

  try {
    if (window.localStorage) {
      storages.push(window.localStorage);
    }
  } catch (error) {
    // Ignora ambiente sem localStorage.
  }

  storages.forEach((storage) => {
    try {
      storage.setItem(key, serialized);
    } catch (error) {
      // Ignora limite de storage.
    }
  });
};

const readOfflineStorage = (key) => {
  const storages = [];

  try {
    if (window.sessionStorage) {
      storages.push(window.sessionStorage);
    }
  } catch (error) {
    // Ignora ambiente sem sessionStorage.
  }

  try {
    if (window.localStorage) {
      storages.push(window.localStorage);
    }
  } catch (error) {
    // Ignora ambiente sem localStorage.
  }

  for (const storage of storages) {
    try {
      const raw = storage.getItem(key);
      if (!raw) {
        continue;
      }

      return JSON.parse(raw);
    } catch (error) {
      // Tenta o proximo storage.
    }
  }
};

const topicFeedClientCache = new Map();
const TOPIC_FEED_CACHE_TTL_MS = 90 * 1000;
let topicSurfaceRefreshTimerId = 0;
let dailyAgentPulseCache = {
  createdAt: 0,
  promise: null
};

const fetchTopicFeedCached = async (topic, limit = 4, options = {}) => {
  const normalizedTopic = normalizeText(topic);
  const safeLimit = Math.max(1, Number(limit) || 4);
  const cacheKey = `${normalizedTopic}:${safeLimit}`;
  const forceRefresh = options.forceRefresh === true;
  const cachedEntry = topicFeedClientCache.get(cacheKey);
  const isFresh =
    cachedEntry &&
    typeof cachedEntry.createdAt === "number" &&
    Date.now() - cachedEntry.createdAt < TOPIC_FEED_CACHE_TTL_MS;

  if (!cachedEntry || forceRefresh || !isFresh) {
    topicFeedClientCache.set(
      cacheKey,
      {
        createdAt: Date.now(),
        promise: requestApiJson(
          `/api/topic-feed?topic=${encodeURIComponent(normalizedTopic)}&limit=${safeLimit}${forceRefresh ? "&force=1" : ""}`,
          {
            method: "GET"
          }
        )
          .then((payload) =>
            Array.isArray(payload?.items)
              ? payload.items.map((item) => normalizeRuntimeArticle(item))
              : []
          )
          .catch(() => [])
      }
    );
  }

  return topicFeedClientCache.get(cacheKey)?.promise || [];
};

const fetchDailyAgentPulseCached = async (options = {}) => {
  const forceRefresh = options.forceRefresh === true;
  const isFresh =
    dailyAgentPulseCache.promise &&
    Date.now() - Number(dailyAgentPulseCache.createdAt || 0) < TOPIC_FEED_CACHE_TTL_MS;

  if (!dailyAgentPulseCache.promise || forceRefresh || !isFresh) {
    dailyAgentPulseCache = {
      createdAt: Date.now(),
      promise: requestApiJson("/api/daily-agent-pulse", { method: "GET" }).catch(() => null)
    };
  }

  return dailyAgentPulseCache.promise;
};

const socialTrendsClientCache = new Map();

const fetchSocialTrendsCached = async (limit = 24, options = {}) => {
  const safeLimit = Math.max(1, Number(limit) || 24);
  const cacheKey = `social-trends:${safeLimit}`;
  const forceRefresh = options.forceRefresh === true;
  const cachedEntry = socialTrendsClientCache.get(cacheKey);
  const isFresh =
    cachedEntry &&
    typeof cachedEntry.createdAt === "number" &&
    Date.now() - cachedEntry.createdAt < TOPIC_FEED_CACHE_TTL_MS;

  if (!cachedEntry || forceRefresh || !isFresh) {
    socialTrendsClientCache.set(cacheKey, {
      createdAt: Date.now(),
      promise: requestApiJson(`/api/social-trends?limit=${safeLimit}`, { method: "GET" })
        .then((payload) =>
          Array.isArray(payload?.items)
            ? payload.items.map((item) => normalizeRuntimeArticle(item))
            : []
        )
        .catch(() => [])
    });
  }

  return socialTrendsClientCache.get(cacheKey)?.promise || [];
};

const getArticlePublishedTime = (article = {}) => {
  const rawValue = article.publishedAt || article.date || article.createdAt || "";
  const timestamp = Date.parse(rawValue);
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const getRecentTopicFallbackArticles = (matcher, limit = 6) =>
  dedupeNewsItems(window.NEWS_DATA || [])
    .map((item) => normalizeRuntimeArticle(item))
    .filter((article) => article.title && (article.sourceUrl || article.slug) && matcher(article))
    .sort((left, right) => compareEditorialFlowArticles(left, right))
    .slice(0, limit);

const buildTopicUtilityCards = (items = []) =>
  items
    .map((item) => {
      const normalizedItem = normalizeRuntimeArticle(item || {});
      const safeSummary = truncateCopy(
        normalizedItem.displaySummary ||
          normalizedItem.summary ||
          item.summary ||
          "Siga para o arquivo politico e acompanhe os pontos mais importantes.",
        190
      );

      return `
        <article class="global-politics-card">
          <p class="eyebrow">${escapeHtml(item.eyebrow || normalizedItem.eyebrow || "política")}</p>
          <h3>${escapeHtml(normalizedItem.title || item.title || "Atualização política")}</h3>
          <p>${escapeHtml(safeSummary)}</p>
          <footer>
            <span>${escapeHtml(item.label || "atalho de leitura")}</span>
            <a href="${escapeRuntimeAttribute(item.href || "./arquivo.html")}">${escapeHtml(item.cta || "Abrir agora")}</a>
          </footer>
        </article>
      `;
    })
    .join("");

const buildBuzzSidebarItemsFromArticles = (items = []) =>
  dedupeNewsItems(items)
    .filter((article) => article?.title && (article?.sourceUrl || article?.slug))
    .sort((left, right) => compareEditorialFlowArticles(left, right))
    .slice(0, 3)
    .map((article, index) => ({
      slug: article.slug || "",
      kicker:
        index === 0
          ? "buzz atualizado"
          : normalizeText(article.category || "").includes("cultura")
            ? "cultura e conversa"
            : "rede em movimento",
      stat:
        formatCompactDisplayDate(article.publishedAt || article.date || article.createdAt || "") ||
        "agora"
    }));

const buildDynamicMarketPayload = (articles = [], fallbackMarket = {}) => {
  const selected = dedupeNewsItems(articles)
    .filter((article) => article?.title && (article?.sourceUrl || article?.slug))
    .sort((left, right) => compareEditorialFlowArticles(left, right))
    .slice(0, 4);

  if (!selected.length) {
    return {
      ...fallbackMarket,
      snapshotLabel: buildSidebarSnapshotLabel()
    };
  }

  const latest = selected[0];
  const sourceCount = new Set(selected.map((article) => article.sourceName).filter(Boolean)).size;
  const latestDateLabel =
    formatCompactDisplayDate(latest.publishedAt || latest.date || latest.createdAt || "") || "agora";

  return {
    sourceName: "Radar economico",
    sourceUrl: latest.sourceUrl || latest.url || fallbackMarket.sourceUrl || "./arquivo.html",
    snapshotLabel: `economia viva • ${buildSidebarSnapshotLabel()}`,
    quotes: [
      {
        label: "Atualizado",
        value: latestDateLabel,
        note: "últimas manchetes"
      },
      {
        label: "Fontes",
        value: `${Math.max(1, sourceCount)}`,
        note: "origens acompanhadas"
      },
      {
        label: "Recorte",
        value: "panorama",
        note: "economia e serviços"
      }
    ],
    moves: selected.slice(0, 3).map((article, index) => ({
      bias: index === 0 ? "up" : "mixed",
      badge: index === 0 ? "agora" : "monitorando",
      label: article.category || "Economia",
      title: truncateCopy(article.title || "Atualização econômica", 88),
      summary: truncateCopy(
        cleanArticleExcerpt(article.summary || article.lede, "Leitura econômica em acompanhamento."),
        180
      ),
      sourceName: article.sourceName || "Fonte ativa",
      url: buildArticleHref(article)
    })),
    opinionTitle: "",
    opinionText: "",
    pocketTips: selected.slice(0, 2).map((article) => ({
      tag: normalizeText(article.category || "economia") || "economia",
      dateLabel:
        formatCompactDisplayDate(article.publishedAt || article.date || article.createdAt || "") ||
        "agora",
      title: truncateCopy(article.title || "Atualização econômica", 76),
      meta: truncateCopy(
        article.summary || article.lede || "Contexto econômico em acompanhamento.",
        90
      ),
      sourceName: article.sourceName || "Fonte ativa",
      url: buildArticleHref(article)
    }))
  };
};

const scheduleTopicSurfaceRefresh = () => {
  if (topicSurfaceRefreshTimerId) {
    return;
  }

  topicSurfaceRefreshTimerId = window.setInterval(() => {
    void renderDailyTrendingBuzz({ forceRefresh: true });
    void renderDynamicMonthlyBuzz({ forceRefresh: true });
    renderWhatMattersNow(window.NEWS_DATA || []);
    void renderCommunityTrendCard({ forceRefresh: true });
    void renderGlobalPoliticsHighlights({ forceRefresh: true });
    renderRegionalPoliticsHighlights(window.NEWS_DATA || []);
    renderSidebarWidgets({ forceRefresh: true });
  }, 60 * 1000);
};

const persistOfflineNewsCache = (items = []) => {
  const normalizedItems = dedupeNewsItems(items).slice(0, 180);

  if (normalizedItems.length === 0) {
    return;
  }

  writeOfflineStorage(offlineNewsCacheKey, normalizedItems);
};

const persistOfflineArticle = (article) => {
  const normalizedArticle = normalizeRuntimeArticle(article);

  if (!normalizedArticle.slug) {
    return;
  }

  writeOfflineStorage(offlineLastArticleKey, normalizedArticle);

  const cachedItems = readOfflineStorage(offlineNewsCacheKey);
  const mergedItems = Array.isArray(cachedItems)
    ? dedupeNewsItems([normalizedArticle, ...cachedItems])
    : [normalizedArticle];
  writeOfflineStorage(offlineNewsCacheKey, mergedItems.slice(0, 180));
};

const applyCadernoStoryArticle = (storyNode, article, { preserveHref = false } = {}) => {
  if (!storyNode || !article) {
    return;
  }

  const titleNode = storyNode.querySelector("strong");
  const metaNode = storyNode.querySelector("small");
  const thumbNode = storyNode.querySelector(".mini-thumb");

  if (!preserveHref && article.slug) {
    const href = `./noticia.html?slug=${encodeURIComponent(article.slug)}`;
    storyNode.setAttribute("href", href);
    applyArticleLinkAttrs(storyNode, href);
  }

  if (titleNode) {
    titleNode.textContent = truncateCopy(article.title || "Notícia em destaque", 96);
  }

  if (metaNode) {
    metaNode.textContent = formatMosaicSourceLabel(article);
  }

  if (thumbNode) {
    const hasUsableImage = articleHasUsableImageCandidate(article);
    storyNode.classList.toggle("story-without-photo", !hasUsableImage);
    thumbNode.dataset.topic = getThumbTopic(thumbNode, article);
    applyThumbImage(thumbNode, {
      ...article,
      imageFit: "contain"
    });
  }
};

const hydrateCadernoCards = async (items = []) => {
  if (!cadernoCards.length) {
    reserveSurfaceArticles("cadernos", []);
    return;
  }

  const normalizedItems = dedupeNewsItems(items);
  const usedKeys = buildReservedArticleKeys(["cadernos"]);
  const usedImages = buildReservedArticleImageKeys(["cadernos"]);
  const appliedArticles = [];
  const cardTasks = cadernoCards.map(async (card) => {
    const kicker = normalizeText(card.querySelector(".card-kicker")?.textContent || "");
    const stories = [...card.querySelectorAll(".mini-story")];

    if (!stories.length) {
      return;
    }

    if (card.dataset.cadernoStatic === "true" && !dynamicCadernoKickers.has(kicker)) {
      stories.forEach((storyNode) => {
        const thumbNode = storyNode.querySelector(".mini-thumb");
        const hasInlinePhoto =
          thumbNode &&
          /url\(/i.test(
            `${thumbNode.style.getPropertyValue("--bg-image")} ${thumbNode.style.getPropertyValue("--news-photo")} ${thumbNode.style.backgroundImage || ""}`
          );
        storyNode.classList.toggle("story-without-photo", !hasInlinePhoto);
        thumbNode?.classList.toggle("has-photo", Boolean(hasInlinePhoto));
        thumbNode?.classList.toggle("has-real-photo", Boolean(hasInlinePhoto));
      });
      return;
    }

    if (cadernoCategoryPriority[kicker]) {
      const articles = pickCadernoArticlesByPriority(
        normalizedItems,
        cadernoCategoryPriority[kicker],
        stories.length,
        usedKeys,
        usedImages
      );

      stories.forEach((storyNode, index) => {
        if (articles[index]) {
          appliedArticles.push(articles[index]);
          applyCadernoStoryArticle(storyNode, articles[index]);
        }
      });
      return;
    }

    if (kicker === "games" || kicker === "animes") {
      const topic = kicker === "games" ? "games" : "anime";
      const topicItems = await fetchTopicFeedCached(topic, 6, { forceRefresh: true });
      const filteredItems =
        kicker === "animes"
          ? topicItems.filter((item) =>
              /anime|animacao|animation|cartoon/i.test(
                [item.category, item.sourceName, item.title].join(" ")
              )
            )
          : topicItems;
      const displayItems = dedupeNewsItems(filteredItems.length ? filteredItems : topicItems).sort(
        (left, right) => Number(articleHasUsableImageCandidate(right)) - Number(articleHasUsableImageCandidate(left))
      );

      stories.forEach((storyNode, index) => {
        const article = displayItems[index] || topicItems[index];
        const articleKey = getArticleUsageKey(article);
        const imageKey = getArticleImageKey(article);
        if (
          (articleKey && usedKeys.has(articleKey)) ||
          (imageKey && usedImages.has(imageKey))
        ) {
          return;
        }

        if (articleKey) {
          usedKeys.add(articleKey);
        }
        if (imageKey) {
          usedImages.add(imageKey);
        }
        appliedArticles.push(article);

        applyCadernoStoryArticle(storyNode, article, {
          preserveHref: true
        });
      });
      return;
    }

    stories.forEach((storyNode) => {
      const thumbNode = storyNode.querySelector(".mini-thumb");
      if (thumbNode) {
        const hasInlinePhoto =
          thumbNode.classList.contains("has-photo") &&
          /url\(/i.test(
            `${thumbNode.style.getPropertyValue("--bg-image")} ${thumbNode.style.backgroundImage || ""}`
          );
        storyNode.classList.toggle("story-without-photo", !hasInlinePhoto);
        thumbNode.classList.toggle("has-photo", hasInlinePhoto);
      }
    });
  });

  await Promise.all(cardTasks);
  reserveSurfaceArticles("cadernos", appliedArticles);
  rerenderEditorialRemainderSurfaces();
};

const renderGlobalPoliticsHighlights = async (options = {}) => {
  const grid = document.querySelector("#global-politics-grid[data-topic-feed]");
  if (!grid) {
    return;
  }

  const items = await fetchTopicFeedCached(grid.dataset.topicFeed || "politics", 6, options);
  const reservedKeys = buildReservedArticleKeys(["globalPolitics"]);
  const reservedImages = buildReservedArticleImageKeys(["globalPolitics"]);
  const selected = dedupeNewsItems(items)
    .filter((item) => item.title && (item.sourceUrl || item.slug))
    .filter(hasClearLocalReaderImpact)
    .filter((item) => {
      const key = getArticleUsageKey(item);
      const imageKey = getArticleImageKey(item);
      return key && !reservedKeys.has(key) && (!imageKey || !reservedImages.has(imageKey));
    })
    .sort((left, right) => compareEditorialFlowArticles(left, right))
    .slice(0, 6);

  const fallbackItems = selected.length
    ? []
    : getRecentTopicFallbackArticles((article) => isRegionalPoliticsArticle(article) && hasClearLocalReaderImpact(article), 6);
  const finalItems = selected.length ? selected : fallbackItems;

  if (!finalItems.length) {
    grid.innerHTML = buildTopicUtilityCards([
      {
        eyebrow: "impacto nacional",
        title: "Abrir arquivo político com filtro local",
        summary: "Quando não houver fato nacional com consequência clara, este atalho leva você ao arquivo completo.",
        label: "guia rápido",
        href: "./arquivo.html",
        cta: "Ver arquivo"
      },
      {
        eyebrow: "contexto",
        title: "Voltar às notícias principais",
        summary: "Use a página principal para encontrar a notícia política mais recente.",
        label: "atalho útil",
        href: "#radar",
        cta: "Ver notícias"
      },
      {
        eyebrow: "busca",
        title: "Buscar política com impacto no portal",
        summary: "A busca lateral ajuda a localizar eleição, prefeitura, governo, Câmara, Acre e Brasília sem transformar ruído em manchete quente.",
        label: "busca interna",
        href: "#sidebar-now",
        cta: "Usar busca"
      }
    ]);
    return;
  }

  grid.innerHTML = finalItems
    .map((item) => {
      const href = item.slug
        ? `./noticia.html?slug=${encodeURIComponent(item.slug)}`
        : item.sourceUrl || item.url || "#";
      const source = formatMosaicSourceLabel(item);
      return `
        <article class="global-politics-card">
          <p class="eyebrow">${escapeHtml(item.category || item.eyebrow || "política")}</p>
          <h3>${escapeHtml(truncateCopy(item.title || "Destaque de política", 120))}</h3>
          <p>${escapeHtml(truncateCopy(item.summary || item.lede || "Atualização de política em acompanhamento.", 190))}</p>
          <footer>
            <span>${escapeHtml(source)}</span>
            <a href="${escapeRuntimeAttribute(href)}">Ler destaque</a>
          </footer>
        </article>
      `;
    })
    .join("");

  registerArticleCardLinks(grid);
  reserveSurfaceArticles("globalPolitics", finalItems);
};

const regionalPoliticsScopes = [
  {
    key: "jurua",
    label: "Vale do Juruá",
    fallbackTitle: "Movimentos políticos locais abrem esta divisão",
    matcher: /cruzeiro do sul|vale do jurua|vale do juruá|jurua|juruá|mancio lima|mâncio lima|rodrigues alves|porto walter|marechal thaumaturgo/i
  },
  {
    key: "acre",
    label: "Acre",
    fallbackTitle: "Acre / Governo entra em seguida",
    matcher: /acre|rio branco|governador|governadora|mailza|assembleia legislativa|aleac|secretaria de estado|palacio rio branco|palácio rio branco/i
  },
  {
    key: "brasil",
    label: "Brasil",
    fallbackTitle: "Brasília aparece como explicação, não como centro",
    matcher: /brasil|brasilia|brasília|stf|congresso|senado|camara dos deputados|câmara dos deputados|lula|bolsonaro|governo federal|ministerio|ministério/i
  }
];

const regionalPoliticsPoliticalPattern =
  /politic|polític|prefeit|govern|secretari|deputad|vereador|camara|câmara|assembleia|aleac|stf|congresso|senado|eleiç|eleic|nomeaç|nomeac|exoneraç|exonerac|partido|progressistas|pl\b|pt\b|mdb\b|psd\b|união|uniao/i;

const getRegionalPoliticsScope = (article = {}) => {
  const normalized = normalizeRuntimeArticle(article);
  const haystack = [
    normalized.title,
    normalized.lede,
    normalized.summary,
    normalized.category,
    normalized.sourceName,
    normalized.sourceLabel
  ].join(" ");

  return regionalPoliticsScopes.find((scope) => scope.matcher.test(haystack))?.key || "";
};

const getRegionalPoliticsScopeLabel = (scopeKey = "") =>
  regionalPoliticsScopes.find((scope) => scope.key === scopeKey)?.label || "";

const isRegionalPoliticsArticle = (article = {}) => {
  const normalized = normalizeRuntimeArticle(article);
  const haystack = [
    normalized.title,
    normalized.lede,
    normalized.summary,
    normalized.category,
    normalized.sourceName,
    normalized.sourceLabel
  ].join(" ");

  return normalizeText(normalized.category).includes("politica") || regionalPoliticsPoliticalPattern.test(haystack);
};

const renderRegionalPoliticsHighlights = (items = window.NEWS_DATA || []) => {
  const grid = document.querySelector("#regional-politics-grid[data-regional-politics]");
  if (!grid) {
    return;
  }

  const reservedKeys = buildReservedArticleKeys(["regionalPolitics"]);
  const candidates = sortRadarArticles(dedupeNewsItems(items))
    .map((item) => normalizeRuntimeArticle(item))
    .filter((article) => {
      const key = getArticleUsageKey(article);
      return (
        key &&
        !reservedKeys.has(key) &&
        article.title &&
        (article.sourceUrl || article.slug) &&
        isRegionalPoliticsArticle(article)
      );
    });
  const usedKeys = new Set();
  const latestDateKey = candidates.map((article) => getArticleDateKey(article)).find(Boolean) || "";
  const freshestCandidates = latestDateKey
    ? candidates.filter((article) => getArticleDateKey(article) === latestDateKey)
    : candidates;

  const findUnusedRegionalPoliticsArticle = (pool, scope, requireScope = false) =>
    pool.find((article) => {
      const key = getArticleUsageKey(article);
      if (!key || usedKeys.has(key)) {
        return false;
      }

      return requireScope ? getRegionalPoliticsScope(article) === scope.key : true;
    });

  const selected = regionalPoliticsScopes.map((scope) => {
    const article =
      findUnusedRegionalPoliticsArticle(freshestCandidates, scope, true) ||
      findUnusedRegionalPoliticsArticle(freshestCandidates, scope, false) ||
      findUnusedRegionalPoliticsArticle(candidates, scope, true) ||
      findUnusedRegionalPoliticsArticle(candidates, scope, false) ||
      null;
    const key = article ? getArticleUsageKey(article) : "";
    if (key) {
      usedKeys.add(key);
    }
    return { scope, article };
  });

  grid.innerHTML = selected
    .map(({ scope, article }) => {
      if (!article) {
        return `
          <article class="global-politics-card" data-scope="${escapeRuntimeAttribute(scope.key)}">
            <p class="eyebrow">${escapeHtml(scope.label)}</p>
            <h3>${escapeHtml(scope.fallbackTitle)}</h3>
            <p>Sem manchete perfeita nesta camada agora, use este bloco como atalho útil para continuar a leitura política sem espaço morto.</p>
            <footer>
              <span>guia rápido</span>
              <a href="${escapeRuntimeAttribute(scope.key === "brasil" ? "#politica-global" : "./arquivo.html")}">${scope.key === "brasil" ? "Ver contexto" : "Abrir arquivo"}</a>
            </footer>
          </article>
        `;
      }

      const href = buildArticleHref(article);
      const source = formatMosaicSourceLabel(article);
      const articleScopeLabel = getRegionalPoliticsScopeLabel(getRegionalPoliticsScope(article));
      const eyebrowLabel = articleScopeLabel || scope.label;
      return `
          <article class="global-politics-card" data-scope="${escapeRuntimeAttribute(scope.key)}">
          <p class="eyebrow">${escapeHtml(eyebrowLabel)}</p>
          <h3>${escapeHtml(truncateCopy(article.title || scope.fallbackTitle, 120))}</h3>
          <p>${escapeHtml(truncateCopy(cleanArticleExcerpt(article.summary || article.lede, "Atualização política em acompanhamento."), 190))}</p>
          <footer>
            <span>${escapeHtml(source)}</span>
            <a href="${escapeRuntimeAttribute(href)}">Ler destaque</a>
          </footer>
        </article>
      `;
    })
    .join("");

  registerArticleCardLinks(grid);
  reserveSurfaceArticles(
    "regionalPolitics",
    selected.map(({ article }) => article).filter(Boolean)
  );
};

const syncNewsDataset = (runtimeItems = []) => {
  const merged = sortRadarArticles(dedupeNewsItems([...(runtimeItems || []), ...initialStaticNews]));
  window.NEWS_DATA = merged;
  window.NEWS_MAP = merged.reduce((map, item) => {
    if (item.slug) {
      map[item.slug] = item;
    }

    (Array.isArray(item.alternateSlugs) ? item.alternateSlugs : []).forEach((slug) => {
      if (slug) {
        map[slug] = item;
      }
    });

    return map;
  }, {});
  persistOfflineNewsCache(merged);
  return merged;
};

const truncateCopy = (value, maxLength = 140) => {
  return truncateCopyAtWord(value, maxLength);
};

const entertainmentFilmPattern =
  /\b(cinema|filme|cine|cinebiografia|bilheteria|michael jackson|anima[cç][aã]o|movie|film)\b/;

const entertainmentStagePattern =
  /\b(teatro|palco|pe[cç]a|dramaturgia|dan[cç]a|festival|agenda cultural|programa[cç][aã]o|apresenta[cç][aã]o|oficina|parecerista|quadrilha|junin)\b/;

const entertainmentHeavyPattern =
  /\b(crime|homic[ií]dio|pris[aã]o|assalto|roubo|furto|morte|viol[eê]ncia|estupro|hospital|doen[cç]a|alerta|enchente|alag)\b/;

const entertainmentOffTopicPattern =
  /\b(reality|podcast|[aá]lbum|rapper|hip hop|macaxeira|agricultura|jur[ií]dico|convic[cç][aã]o|tribunal|comissariado|embarque|menores|ufac|professor|processo seletivo|sal[aá]rios?|governo|governadora|cnh|certifica[cç][aã]o|seguran[cç]a no tr[aâ]nsito|assembleia|cooper|licen[cç]a)\b/;

const entertainmentRemoteStagePattern =
  /\b(juiz de fora|minas gerais|belo horizonte|s[aã]o paulo|rio de janeiro|curitiba|porto alegre|recife|salvador|fortaleza)\b/;

const entertainmentLocalStagePattern =
  /\b(cruzeiro do sul|jurua|juru[aá]|acre|rio branco|cine romeu|teatro dos n[aá]uas|vale do juru[aá]|cultura local|lei aldir blanc)\b/;

const getEntertainmentAgeDays = (article = {}) => {
  const timestamp = getArticleSortTimestamp(article);
  if (!timestamp) return Number.POSITIVE_INFINITY;
  return Math.max(0, (Date.now() - timestamp) / 86400000);
};

const getEntertainmentScore = (article = {}, mode = "film") => {
  const normalized = normalizeRuntimeArticle(article);
  const haystack = normalizeText(
    [
      normalized.title,
      normalized.sourceLabel,
      normalized.summary,
      normalized.lede,
      normalized.category,
      normalized.categoryKey,
      normalized.sourceName,
      normalized.topic,
      normalized.topicGroup
    ].join(" ")
  );
  const pattern = mode === "stage" ? entertainmentStagePattern : entertainmentFilmPattern;
  const hasFilmCore = /\b(cinema|filme|cinebiografia|bilheteria|michael jackson|movie|film)\b/.test(haystack);
  const hasOffTopic = entertainmentOffTopicPattern.test(haystack);
  const ageDays = getEntertainmentAgeDays(normalized);
  if (mode === "film" && !hasFilmCore) {
    return -20;
  }
  if (mode === "stage" && hasOffTopic) {
    return -20;
  }
  if (mode === "stage" && !entertainmentLocalStagePattern.test(haystack)) {
    return -20;
  }
  if (mode === "stage" && entertainmentRemoteStagePattern.test(haystack) && !entertainmentLocalStagePattern.test(haystack)) {
    return -24;
  }
  if (mode === "stage" && ageDays > 120 && !entertainmentLocalStagePattern.test(haystack)) {
    return -22;
  }
  const hasDirectMatch = pattern.test(haystack);
  let score = hasDirectMatch ? 18 : -12;

  if ((normalized.categoryKey || normalizeText(normalized.category)) === "cultura") score += 5;
  if (/\b(cruzeiro do sul|jurua|juru[aá]|acre|rio branco|cine romeu|teatro dos n[aá]uas)\b/.test(haystack)) {
    score += 4;
  }
  if (/\b(global|variety|playbill|broadway|deadline|g1|agencia brasil)\b/.test(haystack)) score += 2;
  if (entertainmentHeavyPattern.test(haystack)) score -= 12;
  if (hasOffTopic) score -= 40;
  if (mode === "stage" && entertainmentRemoteStagePattern.test(haystack)) score -= 18;
  if (mode === "stage" && !entertainmentLocalStagePattern.test(haystack)) score -= 12;
  if (ageDays > 45) score -= mode === "stage" ? 6 : 2;
  if (ageDays > 120) score -= mode === "stage" ? 12 : 5;
  if (!articleHasUsableImageCandidate(normalized)) score -= 2;

  return score;
};

const pickEntertainmentArticles = (items = [], mode = "film", count = 3, usedKeys = new Set()) => {
  const ranked = sortRadarArticles(dedupeNewsItems(items))
    .map((item) => normalizeRuntimeArticle(item))
    .filter((article) => article.title && getEntertainmentScore(article, mode) >= 10)
    .sort((left, right) =>
      compareEditorialFlowArticles(left, right, {
        scoreFn: (article) => getEntertainmentScore(article, mode),
        imageBias: true
      })
    );
  const selected = [];
  const imageKeys = new Set();

  for (const article of ranked) {
    if (selected.length >= count) break;
    const articleKey = getArticleUsageKey(article);
    const imageKey = getArticleImageKey(article);
    if (!articleKey || usedKeys.has(articleKey)) continue;
    if (imageKey && imageKeys.has(imageKey)) continue;
    usedKeys.add(articleKey);
    if (imageKey) imageKeys.add(imageKey);
    selected.push(article);
  }

  return selected;
};

const applyEntertainmentArticle = (card, article, mode = "film", index = 0) => {
  if (!card || !article) return;
  const normalized = normalizeRuntimeArticle(article);
  const titleNode = card.querySelector("h4");
  const infoNode = card.querySelector(mode === "stage" ? ".theater-info" : ".movie-info");
  const descNode = card.querySelector(mode === "stage" ? ".theater-desc" : ".movie-desc");
  const statusNode = card.querySelector(mode === "stage" ? ".dates" : ".rating");
  const photoNode = card.querySelector(".ent-photo");
  const href = buildArticleHref(normalized);
  const sourceLabel = [normalized.sourceName, formatCompactDisplayDate(normalized.publishedAt || normalized.date)]
    .filter(Boolean)
    .join(" · ");

  if (titleNode) titleNode.textContent = truncateCopy(normalized.title, mode === "stage" ? 120 : 112);
  if (infoNode) {
    infoNode.textContent =
      mode === "stage"
        ? truncateCopy(sourceLabel || "Agenda cultural monitorada", 58)
        : truncateCopy(sourceLabel || "Cinema em destaque", 58);
  }
  if (descNode) {
    descNode.textContent = truncateCopy(
      normalized.summary || normalized.lede || "Atualização cultural em acompanhamento.",
      mode === "stage" ? 210 : 190
    );
  }
  if (statusNode) {
    statusNode.textContent = "Abrir matéria completa";
  }
  if (mode === "stage") {
    const venueNode = card.querySelector(".venue");
    const pills = [...card.querySelectorAll(".theater-pill")];
    if (venueNode) venueNode.textContent = `Fonte: ${normalized.sourceName || "agenda cultural"}`;
    ["Cultura", normalized.category || "Agenda", normalized.topicGroup || "Palco"].forEach((label, pillIndex) => {
      if (pills[pillIndex]) pills[pillIndex].textContent = truncateCopy(label, 18);
    });
  }
  if (photoNode) {
    const imageUrl = sanitizeImageUrl(getArticleDisplayImageUrl(normalized, "card"));
    if (imageUrl) {
      photoNode.style.setProperty("--ent-photo", `url("${imageUrl}")`);
      const focus = normalized.imageFocus || "center center";
      photoNode.style.backgroundPosition = focus;
    }
  }

  card.dataset.articleHref = href;
  card.setAttribute("role", "link");
  card.setAttribute("aria-label", `Abrir matéria: ${normalized.title}`);
  card.tabIndex = 0;
  if (card.dataset.entertainmentBound !== "true") {
    card.dataset.entertainmentBound = "true";
    card.addEventListener("click", (event) => {
      if (event.target.closest("a, button")) return;
      const targetHref = card.dataset.articleHref;
      if (targetHref) window.location.href = targetHref;
    });
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      const targetHref = card.dataset.articleHref;
      if (targetHref) window.location.href = targetHref;
    });
  }
};

const hydrateEntertainmentSection = (items = []) => {
  const shell = document.querySelector("#entretenimento");
  if (!shell) return;

  const usedKeys = buildReservedArticleKeys(["entertainment"]);
  const filmCards = [...shell.querySelectorAll(".movie-card")];
  const stageCards = [...shell.querySelectorAll(".theater-card")];
  const filmArticles = pickEntertainmentArticles(items, "film", filmCards.length, usedKeys);
  const stageArticles = pickEntertainmentArticles(items, "stage", stageCards.length, usedKeys);

  filmCards.forEach((card, index) => {
    if (filmArticles[index]) applyEntertainmentArticle(card, filmArticles[index], "film", index);
  });
  stageCards.forEach((card, index) => {
    if (stageArticles[index]) applyEntertainmentArticle(card, stageArticles[index], "stage", index);
  });
  reserveSurfaceArticles("entertainment", [...filmArticles, ...stageArticles]);
};

const socialSurfaceBaseScores = {
  "festas & social": 10,
  social: 10,
  cultura: 9,
  esporte: 7,
  educacao: 6,
  negocios: 5,
  prefeitura: 3,
  politica: 1,
  cotidiano: 1,
  saude: 0,
  policia: -8,
  "utilidade publica": -5
};

const socialSurfaceSignalPattern =
  /\b(festa|show|festival|evento|agenda|cultura|arte|teatro|cinema|musica|viral|rede social|instagram|tiktok|youtube|influenc|celebridade|aniversario|casamento|exposicao|feira|programacao|oficina|comunidade|historia|superacao|retrato|juventude|turma|bairro|trabalhador|pascoa)\b/;

const socialSurfaceHeavyPattern =
  /\b(crime|homicidio|prisao|operacao|assalto|roubo|furto|morte|ice|stf|cpi|inss|detran|doenca|hospital|vacina|alagacao|enchente|alerta|beneficiario)\b/;

const socialSurfacePublicEventPattern =
  /\b(show|festa|festival|programacao|agenda|evento|cultura|credenciamento|trabalhador|pascoa|natal|feira|oficina|artista|apresentacao)\b/;

const getSocialSurfaceScore = (article = {}) => {
  const normalized = normalizeRuntimeArticle(article);
  const categoryKey = normalized.categoryKey || normalizeText(normalized.category);
  const haystack = normalizeText(
    [
      normalized.title,
      normalized.sourceLabel,
      normalized.lede,
      normalized.summary,
      normalized.category,
      normalized.sourceName
    ].join(" ")
  );

  let score = socialSurfaceBaseScores[categoryKey] ?? 0;

  if (socialSurfaceSignalPattern.test(haystack)) {
    score += 6;
  }

  if (/\b(viral|instagram|tiktok|youtube|rede|post|video|fotos?)\b/.test(haystack)) {
    score += 3;
  }

  if (/\b(show|festival|cinema|teatro|musica|artista|agenda|evento|oficina|feira)\b/.test(haystack)) {
    score += 3;
  }

  if (/\b(historia|superacao|comunidade|aluno|estudante|professor|familia|bairro|juventude)\b/.test(haystack)) {
    score += 2;
  }

  if (categoryKey === "prefeitura" && socialSurfacePublicEventPattern.test(haystack)) {
    score += 3;
  }

  if (socialSurfaceHeavyPattern.test(haystack)) {
    score -= 7;
  }

  if (!articleHasUsableImageCandidate(normalized)) {
    score -= 2;
  }

  return score;
};

const pickSocialFallbackArticles = (
  items = [],
  count = 0,
  usedKeys = new Set(),
  usedImages = buildReservedArticleImageKeys(["social"])
) => {
  if (count <= 0) {
    return [];
  }

  const candidates = sortRadarArticles(dedupeNewsItems(items)).map((item) =>
    normalizeRuntimeArticle(item)
  );
  const heroReservedKeys =
    newsSurfaceReservations.hero instanceof Set ? newsSurfaceReservations.hero : new Set();
  const rankedCandidates = [...candidates].sort((left, right) => {
    return compareEditorialFlowArticles(left, right, {
      scoreFn: getSocialSurfaceScore,
      imageBias: true
    });
  });
  const selected = [];
  const categoryCounts = new Map();

  const tryPushSocialArticle = (
    article,
    {
      allowDuplicateImages = false,
      allowSecondFromCategory = false,
      allowAnyCategory = false,
      minimumScore = 0
    } = {}
  ) => {
    if (selected.length >= count) {
      return true;
    }

    const articleKey = getArticleUsageKey(article);
    if (!articleKey || usedKeys.has(articleKey) || heroReservedKeys.has(articleKey)) {
      return false;
    }

    if (getSocialSurfaceScore(article) < minimumScore) {
      return false;
    }

    if (!articleHasUsableImageCandidate(article)) {
      return false;
    }

    const categoryKey = article.categoryKey || normalizeText(article.category);
    const maxPerCategory = allowSecondFromCategory ? 2 : 1;
    if (!allowAnyCategory && (categoryCounts.get(categoryKey) || 0) >= maxPerCategory) {
      return false;
    }

    const imageKey = getArticleImageKey(article);
    if (!allowDuplicateImages && imageKey && usedImages.has(imageKey)) {
      return false;
    }

    if (imageKey) {
      usedImages.add(imageKey);
    }
    usedKeys.add(articleKey);
    categoryCounts.set(categoryKey, (categoryCounts.get(categoryKey) || 0) + 1);
    selected.push(article);
    return selected.length >= count;
  };

  rankedCandidates.some((article) =>
    tryPushSocialArticle(article, {
      minimumScore: 3
    })
  );

  if (selected.length < count) {
    rankedCandidates.some((article) =>
      tryPushSocialArticle(article, {
        allowSecondFromCategory: true,
        minimumScore: 1
      })
    );
  }

  if (selected.length < count) {
    candidates.some((article) =>
      tryPushSocialArticle(article, {
        allowDuplicateImages: true,
        allowSecondFromCategory: true,
        minimumScore: -2
      })
    );
  }

  if (selected.length < count) {
    candidates.some((article) =>
      tryPushSocialArticle(article, {
        allowDuplicateImages: true,
        allowSecondFromCategory: true,
        allowAnyCategory: true,
        minimumScore: Number.NEGATIVE_INFINITY
      })
    );
  }

  return selected;
};

const applySocialCardFromArticle = (card, article) => {
  if (!card || !article) {
    return;
  }

  const normalized = normalizeRuntimeArticle(article);
  const linkNode = card.querySelector(".news-thumb");
  const tagNode = linkNode?.querySelector("span");
  const sourceNode = card.querySelector(".news-source");
  const titleNode = card.querySelector("h3");
  const copyNode = card.querySelector("p");
  const footerSource = card.querySelector("footer span");
  const footerLink = card.querySelector("footer a");
  const href = buildArticleHref(normalized);

  if (linkNode) {
    linkNode.href = href;
    applyArticleLinkAttrs(linkNode, href);
    linkNode.setAttribute("aria-label", `Abrir notícia: ${normalized.title}`);
  }

  if (tagNode) {
    tagNode.textContent = truncateCopy(normalized.category, 22);
  }

  if (sourceNode) {
    sourceNode.textContent = formatCrossedSourceMeta(normalized);
  }

  if (titleNode) {
    titleNode.textContent = normalized.title;
  }

  if (copyNode) {
    copyNode.textContent = truncateCopy(normalized.displaySummary || normalized.lede, 132);
  }

  if (footerSource) {
    footerSource.textContent = formatCrossedSourceFooter(normalized);
  }

  if (footerLink) {
    footerLink.href = href;
    applyArticleLinkAttrs(footerLink, href);
  }

  if (linkNode) {
    const hasUsableImage = articleHasUsableImageCandidate(normalized);
    card.classList.toggle("card-without-photo", !hasUsableImage);
    applyThumbImage(linkNode, normalized);
  }
};

const hydrateSocialCards = (items = []) => {
  const cards = [...document.querySelectorAll(".social-card")].filter(
    (card) => !card.classList.contains("wide")
  );
  if (!cards.length || !window.NEWS_MAP) {
    reserveSurfaceArticles("social", []);
    return;
  }

  const appliedArticles = [];
  const usedKeys = buildReservedArticleKeys(["social"]);
  const usedImages = buildReservedArticleImageKeys(["social"]);
  const dynamicArticles = pickSocialFallbackArticles(items, cards.length, usedKeys, usedImages);

  cards.forEach((card, index) => {
    const article = dynamicArticles[index];
    if (!article) {
      return;
    }
    appliedArticles.push(article);
    applySocialCardFromArticle(card, article);
  });

  reserveSurfaceArticles("social", appliedArticles);
};

const hydrateStaticMediaSurfaces = async () => {
  if (thumbNodes.length > 0 && window.NEWS_MAP) {
    thumbNodes.forEach((node) => {
      const slugFromHref = getSlugFromLink(node.closest("a") || node);
      const article = getHomepageHydrationArticle(slugFromHref);
      ensureMediaBadge(node, article?.media);
    });
  }

  if (window.NEWS_MAP) {
    hydrateStaticThumbs(window.NEWS_MAP);
    hydrateSocialCards(window.NEWS_DATA || []);
    await hydrateCadernoCards(window.NEWS_DATA || []);
    hydrateEntertainmentSection(window.NEWS_DATA || []);
    renderAcreRegionalHighlights(window.NEWS_DATA || []);
  }

};

const hydrateMosaicHero = (items = []) => {
  const hero = document.querySelector(".mosaic-hero");
  if (!hero) {
    reserveSurfaceArticles("hero", []);
    return;
  }

  const cards = [...hero.querySelectorAll(".mosaic-item")];
  if (cards.length === 0) {
    return;
  }

  const { leadArticles, referenceDateKey } = pickRadarLeadArticles(dedupeNewsItems(items));
  if (!leadArticles.length) {
    reserveSurfaceArticles("hero", []);
    return;
  }

  const editionNode = hero.querySelector(".mosaic-edition");
  if (editionNode && referenceDateKey) {
    editionNode.textContent = `Edição visual • ${formatCompactDisplayDate(`${referenceDateKey}T12:00:00`)}`;
  }

  cards.forEach((card, index) => {
    const sourceArticle = leadArticles[index];
    if (!sourceArticle) {
      card.hidden = true;
      card.classList.add("is-empty");
      return;
    }

    card.hidden = false;
    card.classList.remove("is-empty");

    const article = normalizeRuntimeArticle(sourceArticle);
    const link = card.querySelector("a");
    const tag = card.querySelector(".mosaic-tag");
    const source = card.querySelector(".mosaic-source");
    const titleNode = card.querySelector("h1, h3");
    const copyNode = card.querySelector(".mosaic-copy p");
    const statNode = card.querySelector(".mosaic-stat");
    const actionNode = card.querySelector(".mosaic-action");
    const href = buildArticleHref(article);

    if (link) {
      link.href = href;
      applyArticleLinkAttrs(link, href);
    }

    card.dataset.category = normalizeText(article.category);
    [...card.classList]
      .filter((className) => className.startsWith("thumb-"))
      .forEach((className) => card.classList.remove(className));
    card.classList.add(article.previewClass);
    card.dataset.mosaicLayout = inferMosaicLayoutMode(article, card);

    if (tag) {
      tag.textContent = index === 0 ? "Destaque do dia" : truncateCopy(article.category, 22);
    }

    if (source) {
      source.textContent = formatMosaicSourceLabel(article);
    }

    if (titleNode) {
      titleNode.textContent = article.title;
    }

    if (copyNode) {
      copyNode.textContent = truncateCopy(
        cleanArticleExcerpt(article.displaySummary || article.lede, "Resumo em atualização."),
        index === 0 ? 88 : 64
      );
    }

    if (statNode) {
      statNode.textContent =
        index === 0
          ? truncateCopy(article.displaySummary || article.lede, 84)
          : truncateCopy(article.sourceLabel || article.title, 68);
    }

    if (actionNode) {
      actionNode.textContent = index === 0 ? "Ler tudo" : "Ler cobertura";
    }

    applyMosaicImage(card, article);
  });

  reserveSurfaceArticles("hero", leadArticles);
};

const buildArticleHref = (article) => {
  const normalizedArticle = normalizeRuntimeArticle(article);

  if (normalizedArticle.slug) {
    return `./noticia.html?slug=${encodeURIComponent(normalizedArticle.slug)}`;
  }

  return normalizedArticle.sourceUrl || "#";
};

const applyArticleLinkAttrs = (linkNode, href) => {
  if (!linkNode) {
    return;
  }

  linkNode.removeAttribute("target");
  linkNode.removeAttribute("rel");

  if (/^https?:\/\//i.test(href)) {
    linkNode.setAttribute("target", "_blank");
    linkNode.setAttribute("rel", "noreferrer");
  }
};

const getEditorialRegionalLabel = (article = {}) => {
  const tier = getEditorialRegionalTier(article);
  if (tier === "cruzeiro") return "Cruzeiro do Sul";
  if (tier === "jurua") return "Vale do Juruá";
  if (tier === "acre") return "Acre";
  if (tier === "brasil") return "Brasil";
  return "Geral";
};

const renderAcreRegionalHighlights = (items = window.NEWS_DATA || []) => {
  const grid = document.querySelector("#acre-destaque .regional-grid");
  if (!grid) {
    return;
  }

  const cards = [...grid.querySelectorAll(".regional-card")];
  if (!cards.length) {
    reserveSurfaceArticles("regional", []);
    return;
  }

  const reservedKeys = buildReservedArticleKeys(["regional"]);
  const candidates = sortRadarArticles(dedupeNewsItems(items))
    .map((item) => normalizeRuntimeArticle(item))
    .filter((article) => {
      const key = getArticleUsageKey(article);
      const tier = getEditorialRegionalTier(article);
      return key && !reservedKeys.has(key) && ["cruzeiro", "jurua", "acre"].includes(tier);
    });
  const selected = [];
  const selectedKeys = new Set();

  candidates.some((article) => {
    if (selected.length >= cards.length) return true;
    const key = getArticleUsageKey(article);
    if (!key || selectedKeys.has(key)) return false;
    selectedKeys.add(key);
    selected.push(article);
    return false;
  });

  cards.forEach((card, index) => {
    const article = selected[index];
    if (!article) {
      return;
    }

    const badge = card.querySelector(".city-badge");
    const title = card.querySelector("h3");
    const copy = card.querySelector("p");
    const footerDate = card.querySelector("footer span");
    const footerLink = card.querySelector("footer a");
    const href = buildArticleHref(article);

    if (badge) {
      badge.textContent = getEditorialRegionalLabel(article);
    }
    if (title) {
      title.textContent = truncateCopy(article.title || "Destaque regional", 118);
    }
    if (copy) {
      copy.textContent = truncateCopy(
        cleanArticleExcerpt(article.displaySummary || article.summary || article.lede, "Atualização regional em acompanhamento."),
        170
      );
    }
    if (footerDate) {
      footerDate.textContent =
        formatCompactDisplayDate(article.publishedAt || article.date || article.createdAt || "") ||
        article.sourceName ||
        "agora";
    }
    if (footerLink) {
      footerLink.href = href;
      footerLink.textContent = "Ler destaque";
      applyArticleLinkAttrs(footerLink, href);
    }
  });

  reserveSurfaceArticles("regional", selected);
  registerArticleCardLinks(grid);
};

const initialMergedNews = syncNewsDataset(initialStaticNews);
ensureMobileHomeLeadLayout();
reserveSurfaceArticles("topHero", getHeroPoolReservationArticles(getHeroTourismDailyPool()));
hydrateMosaicHero(initialMergedNews);
void hydrateStaticMediaSurfaces();
initializeHeroTourismHero();
if (heroDesktopBackdropMedia) {
  const handleHeroShellModeChange = () => {
    initializeHeroTourismHero();
  };

  if (typeof heroDesktopBackdropMedia.addEventListener === "function") {
    heroDesktopBackdropMedia.addEventListener("change", handleHeroShellModeChange);
  } else if (typeof heroDesktopBackdropMedia.addListener === "function") {
    heroDesktopBackdropMedia.addListener(handleHeroShellModeChange);
  }
}
attachArchiveBrowserLaunchers();
initializeInsidersArmy();
initializeInsidersBootScreen();
initializeInsidersHeroScene();
if (mobileHomeLeadMedia) {
  const handleMobileHomeLeadChange = () => {
    ensureMobileHomeLeadLayout();
    renderHeroOfficeTv(heroOfficeTvSourceItems);
  };

  if (typeof mobileHomeLeadMedia.addEventListener === "function") {
    mobileHomeLeadMedia.addEventListener("change", handleMobileHomeLeadChange);
  } else if (typeof mobileHomeLeadMedia.addListener === "function") {
    mobileHomeLeadMedia.addListener(handleMobileHomeLeadChange);
  }
}

const articleCardSelector = [
  ".news-card",
  ".archive-card",
  ".mosaic-item",
  ".global-politics-card",
  ".trending-card"
].join(", ");
const cardInteractiveSelector = "a, button, input, select, textarea, label, summary";

const getPrimaryCardLink = (card) =>
  card?.querySelector?.('a[href*="noticia.html?slug="], a[href]') || null;

const bindArticleCardLink = (card) => {
  if (!card || card.dataset.cardLinkBound === "true") {
    return;
  }

  const primaryLink = getPrimaryCardLink(card);
  if (!primaryLink) {
    return;
  }

  card.dataset.cardLinkBound = "true";
  card.classList.add("is-card-link");
  card.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.target.closest(cardInteractiveSelector)) {
      return;
    }

    const href = primaryLink.getAttribute("href") || "";
    const match = href.match(/[?&]slug=([^&#]+)/i);
    const slugFromHref = match ? decodeURIComponent(match[1]) : "";
    const article = slugFromHref ? window.NEWS_MAP?.[slugFromHref] : null;

    if (article) {
      persistOfflineArticle(article);
    }

    primaryLink.click();
  });
};

function registerArticleCardLinks(root = document) {
  if (!root) {
    return;
  }

  const cards = [];

  if (root.matches?.(articleCardSelector)) {
    cards.push(root);
  }

  const nestedCards = root.querySelectorAll
    ? [...root.querySelectorAll(articleCardSelector)]
    : [];

  cards.push(...nestedCards);
  cards.forEach(bindArticleCardLink);
}

registerArticleCardLinks();
renderRegionalPoliticsHighlights(initialMergedNews);
renderGlobalPoliticsHighlights();

const initializeMobilePagePrefetch = () => {
  if (!mobileIntroMedia?.matches) {
    return;
  }

  const prefetched = new Set();
  const ensurePrefetch = (href) => {
    if (!href || prefetched.has(href) || /^https?:\/\//i.test(href) || href.startsWith("#")) {
      return;
    }

    const normalizedHref = href.replace(/#.*/, "");
    if (!normalizedHref || prefetched.has(normalizedHref)) {
      return;
    }

    prefetched.add(normalizedHref);
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = normalizedHref;
    link.as = "document";
    document.head.appendChild(link);
  };

  document.querySelectorAll("a[href]").forEach((anchor) => {
    const href = anchor.getAttribute("href") || "";
    anchor.addEventListener("pointerenter", () => ensurePrefetch(href), { passive: true });
    anchor.addEventListener("touchstart", () => ensurePrefetch(href), { passive: true, once: true });
  });

  document.addEventListener("click", (event) => {
    const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
    const href = anchor?.getAttribute("href") || "";
    if (!anchor || !href || /^https?:\/\//i.test(href) || href.startsWith("#")) {
      return;
    }

    document.body.classList.add("mobile-page-shift");
  });
};

initializeMobilePagePrefetch();

const isInternalArticleLink = (link) => {
  const href = link?.getAttribute?.("href") || "";
  if (!href || !/noticia\.html\?slug=/i.test(href)) {
    return false;
  }

  try {
    const targetUrl = new URL(href, window.location.href);
    return targetUrl.origin === window.location.origin && /\/noticia\.html$/i.test(targetUrl.pathname);
  } catch (_error) {
    return false;
  }
};

const shouldHandleArticleNavigationClick = (event, link) => {
  if (!link || event.defaultPrevented || event.button !== 0) {
    return false;
  }

  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }

  const target = String(link.getAttribute("target") || "").trim();
  return !target || target === "_self";
};

const navigateWithArticleLoader = (href) => {
  let navigated = false;
  const navigate = () => {
    if (navigated) {
      return;
    }
    navigated = true;
    window.location.href = href;
  };

  try {
    sessionStorage.setItem("catalogo_page_action_loader_pending_v1", "1");
  } catch (_error) {
    // ignore storage failures
  }

  const loaderPromise = window.CatalogoPageLoader?.showForNavigation
    ? window.CatalogoPageLoader.showForNavigation({
        href,
        label: "Abrindo materia"
      })
    : Promise.resolve();

  Promise.race([
    Promise.resolve(loaderPromise),
    new Promise((resolve) => window.setTimeout(resolve, 3200))
  ])
    .catch(() => undefined)
    .then(navigate);
};

document.addEventListener("click", (event) => {
  const link = event.target instanceof Element ? event.target.closest('a[href*="noticia.html?slug="]') : null;
  if (!link) {
    return;
  }

  const href = link.getAttribute("href") || "";
  const match = href.match(/[?&]slug=([^&#]+)/i);
  const slugFromHref = match ? decodeURIComponent(match[1]) : "";
  const article = slugFromHref ? window.NEWS_MAP?.[slugFromHref] : null;

  if (article) {
    persistOfflineArticle(article);
  }

  if (isInternalArticleLink(link) && shouldHandleArticleNavigationClick(event, link)) {
    event.preventDefault();
    navigateWithArticleLoader(new URL(href, window.location.href).href);
  }
});

const getAnchorScrollOffset = () => {
  const headerStack = document.querySelector("#site-header-stack");
  const headerHeight = headerStack?.getBoundingClientRect().height || 0;
  return headerHeight + 18;
};

const scrollSectionIntoView = (target, { updateHash = true } = {}) => {
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const rect = target.getBoundingClientRect();
  const absoluteTop = window.scrollY + rect.top;
  const offsetTop = getAnchorScrollOffset();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const targetHeight = rect.height || target.offsetHeight || 0;
  const freeSpace = Math.max(0, viewportHeight - offsetTop - targetHeight);
  const centerOffset = offsetTop + freeSpace / 2;
  const nextTop = Math.max(0, absoluteTop - centerOffset);

  window.scrollTo({
    top: nextTop,
    behavior: splashMotionQuery.matches ? "auto" : "smooth"
  });

  if (updateHash && target.id) {
    try {
      const nextUrl = `${window.location.pathname}${window.location.search}#${target.id}`;
      window.history.replaceState({}, document.title, nextUrl);
    } catch (_error) {
      // Se o navegador bloquear a troca do hash, a rolagem continua valendo.
    }
  }
};

document.addEventListener("click", (event) => {
  const anchor = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
  if (!anchor) {
    return;
  }

  const href = anchor.getAttribute("href") || "";
  if (!href || href === "#") {
    return;
  }

  const target = document.querySelector(href);
  if (!(target instanceof HTMLElement)) {
    return;
  }

  event.preventDefault();
  scrollSectionIntoView(target);
});

window.addEventListener("hashchange", () => {
  const hash = window.location.hash || "";
  if (!hash || hash === "#") {
    return;
  }

  const target = document.querySelector(hash);
  if (!(target instanceof HTMLElement)) {
    return;
  }

  window.setTimeout(() => {
    scrollSectionIntoView(target, { updateHash: false });
  }, 20);
});

window.addEventListener("load", () => {
  const hash = window.location.hash || "";
  if (!hash || hash === "#") {
    return;
  }

  const target = document.querySelector(hash);
  if (!(target instanceof HTMLElement)) {
    return;
  }

  window.setTimeout(() => {
    scrollSectionIntoView(target, { updateHash: false });
  }, 60);
});

// --- Elections: poll by office with one vote per browser/office ---
if (window.ELECTIONS_DATA?.offices?.length) {
  const electionGrid = document.querySelector(".elections-grid");
  const electionFilters = [...document.querySelectorAll(".election-filter[data-office]")];
  const staticElectionVoteButtons = [...document.querySelectorAll("[data-static-vote][data-static-candidate]")];
  const electionResultsTitle = document.querySelector("#election-results-title");
  const electionResultsMeta = document.querySelector("#election-results-meta");
  const electionResultsBars = document.querySelector("#election-results-bars");
  const electionResultsOfficeButtons = document.querySelector("#election-results-office-buttons");
  const electionHeatTitle = document.querySelector("#election-heat-title");
  const electionHeatMeta = document.querySelector("#election-heat-meta");
  const electionHeatGrid = document.querySelector("#election-heat-grid");
  const electionDisclaimer = document.querySelector("#election-disclaimer");
  const electionVotesKey = "catalogo_election_votes_by_office_v1";
  const electionUserVotesKey = "catalogo_election_user_votes_v1";
  const electionOpinionSummaryKey = "catalogo_election_opinion_summary_v1";
  const electionLastVoteKey = "catalogo_election_last_vote_v1";
  const electionVoterIdKey = "catalogo_election_voter_id_v1";
  const electionVoterProfileKey = "catalogo_election_voter_profile_v1";
  const electionCycle = String(window.ELECTIONS_DATA.cycle || "").toLowerCase();
  const generalElectionOfficeIds = new Set([
    "governador",
    "senador",
    "deputado-federal",
    "deputado-estadual"
  ]);
  const electionOffices = window.ELECTIONS_DATA.offices.filter((office) => {
    const officeId = String(office?.id || "").trim();

    if (!officeId) {
      return false;
    }

    if (electionCycle === "geral") {
      return generalElectionOfficeIds.has(officeId);
    }

    if (electionCycle === "municipal") {
      return officeId === "municipal";
    }

    return true;
  });
  const availableElectionOfficeIds = new Set(electionOffices.map((office) => office.id));
  let remoteElectionVotes = null;
  let remoteElectionUserVotes = null;
  let remoteElectionOpinionSummary = null;
  let remoteElectionWeeklyTrend = null;
  let electionVoteModal = document.querySelector("#electionVoteModal");
  let electionVoteModalState = null;
  let electionVoteToastTimer = 0;
  let activeElectionResultsOfficeId = "";

  const showElectionVoteToast = (message = "Acompanhe semanalmente as parciais.") => {
    let toast = document.querySelector("#catalogoElectionVoteToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "catalogoElectionVoteToast";
      toast.className = "election-vote-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }

    toast.innerHTML = `<strong>Obrigado por votar.</strong><span>${escapeHtml(message)}</span>`;
    toast.classList.add("is-visible");

    if (electionVoteToastTimer) {
      window.clearTimeout(electionVoteToastTimer);
    }

    electionVoteToastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 5000);
  };

  const writeElectionLastVote = (payload = {}) => {
    writeElectionStorage(electionLastVoteKey, {
      ...payload,
      savedAt: new Date().toISOString()
    });
  };

  const readElectionLastVote = () => safeParseJson(electionLastVoteKey, {});

  const ensureElectionVoteSuccessModal = () => {
    let modal = document.querySelector("#catalogoElectionVoteSuccessModal");
    if (!modal) {
      modal = document.createElement("section");
      modal.id = "catalogoElectionVoteSuccessModal";
      modal.className = "election-success-modal";
      modal.hidden = true;
      modal.innerHTML = `
        <div class="election-success-backdrop" data-election-success-close></div>
        <article class="election-success-dialog" role="dialog" aria-modal="true" aria-labelledby="electionSuccessTitle">
          <button class="election-success-close" type="button" data-election-success-close aria-label="Fechar">×</button>
          <p class="panel-label">Participacao confirmada</p>
          <h3 id="electionSuccessTitle">Obrigado por participar.</h3>
          <p class="election-success-lead" data-election-success-message>
            Seu voto entrou na memoria semanal desta leitura eleitoral.
          </p>
          <div class="election-success-meta">
            <article>
              <span>Cargo</span>
              <strong data-election-success-office>Governador</strong>
            </article>
            <article>
              <span>Escolha registrada</span>
              <strong data-election-success-candidate>Nome do candidato</strong>
            </article>
            <article>
              <span>Cidade informada</span>
              <strong data-election-success-city>Rio Branco</strong>
            </article>
          </div>
          <p class="election-success-note">
            Continue acompanhando as parciais semanais e os graficos de todo o periodo para ver como o humor do eleitorado evolui.
          </p>
          <div class="election-success-actions">
            <button class="solid-button" type="button" data-election-success-follow>Acompanhar parciais e graficos</button>
            <button class="outline-button" type="button" data-election-success-close>Fechar</button>
          </div>
        </article>
      `;
      document.body.appendChild(modal);
    }

    if (modal.dataset.bound === "1") {
      return modal;
    }

    modal.dataset.bound = "1";
    const close = () => {
      modal.hidden = true;
      document.body.classList.remove("election-vote-open");
    };

    modal.addEventListener("click", (event) => {
      if (
        event.target === modal ||
        event.target?.matches?.(".election-success-backdrop, [data-election-success-close]")
      ) {
        close();
      }
    });

    modal.querySelectorAll("[data-election-success-close]").forEach((button) => {
      button.addEventListener("click", close);
    });

    modal.querySelector("[data-election-success-follow]")?.addEventListener("click", () => {
      close();
      document.querySelector("#elections")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) {
        close();
      }
    });

    return modal;
  };

  const showElectionVoteSuccessModal = ({ officeLabel = "", candidateName = "", city = "" } = {}) => {
    const modal = ensureElectionVoteSuccessModal();
    modal.querySelector("[data-election-success-office]").textContent = officeLabel || "Cargo";
    modal.querySelector("[data-election-success-candidate]").textContent = candidateName || "Candidato";
    modal.querySelector("[data-election-success-city]").textContent = city || "Cidade informada";
    modal.querySelector("[data-election-success-message]").textContent =
      `Voto autenticado neste dispositivo e confirmado para ${candidateName || "o candidato"} em ${officeLabel || "um cargo"}${city ? `, com cidade ${city}` : ""}.`;
    modal.hidden = false;
    document.body.classList.add("election-vote-open");
  };

  electionFilters.forEach((button) => {
    const officeId = String(button.dataset.office || "").trim();
    const isAvailable = availableElectionOfficeIds.has(officeId);

    button.hidden = !isAvailable;
    button.disabled = !isAvailable;
    button.setAttribute("aria-hidden", isAvailable ? "false" : "true");

    if (!isAvailable) {
      button.classList.remove("is-active");
    }
  });

  let activeElectionOfficeId =
    electionFilters.find(
      (button) =>
        button.classList.contains("is-active") &&
        availableElectionOfficeIds.has(String(button.dataset.office || "").trim())
    )?.dataset.office || electionOffices[0]?.id;
  activeElectionResultsOfficeId = activeElectionOfficeId || electionOffices[0]?.id || "";

  if (!electionOffices.length || !activeElectionOfficeId) {
    if (electionGrid) {
      electionGrid.innerHTML =
        '<div class="feed-empty">Ainda não há cargos disponíveis para o ciclo eleitoral atual.</div>';
    }
  } else {

  const safeParseJson = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch (_error) {
      return fallback;
    }
  };

  const writeElectionStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_error) {
      // Se o navegador bloquear localStorage, a enquete continua visual.
    }
  };

  const getElectionVoterProfile = () =>
    safeParseJson(electionVoterProfileKey, {
      city: "",
      name: "",
      party: ""
    });

  const writeElectionVoterProfile = (profile = {}) => {
    writeElectionStorage(electionVoterProfileKey, {
      city: String(profile.city || "").trim().slice(0, 80),
      name: String(profile.name || "").trim().slice(0, 120),
      party: String(profile.party || "").trim().slice(0, 90)
    });
  };

  const getElectionVoterId = () => {
    try {
      const stored = localStorage.getItem(electionVoterIdKey);
      if (stored) {
        return stored;
      }

      const nextId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `voter-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(electionVoterIdKey, nextId);
      return nextId;
    } catch (_error) {
      return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
  };

  const getElectionOffice = (officeId = activeElectionOfficeId) =>
    electionOffices.find((office) => office.id === officeId) || electionOffices[0];

  const getElectionResultsOffice = (officeId = activeElectionResultsOfficeId || activeElectionOfficeId) =>
    getElectionOffice(officeId);

  const getElectionVotes = () => remoteElectionVotes || safeParseJson(electionVotesKey, {});

  const getElectionUserVotes = () =>
    remoteElectionUserVotes || safeParseJson(electionUserVotesKey, {});

  const getElectionOpinionSummary = () =>
    remoteElectionOpinionSummary || safeParseJson(electionOpinionSummaryKey, {});
  const getElectionWeeklyTrend = () => remoteElectionWeeklyTrend || [];

  const cloneElectionData = (value, fallback) => {
    try {
      return JSON.parse(JSON.stringify(value ?? fallback));
    } catch (_error) {
      return fallback;
    }
  };

  const getElectionClientWeekKey = () => {
    const now = new Date();
    const utc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const weekday = utc.getUTCDay() || 7;
    utc.setUTCDate(utc.getUTCDate() + 4 - weekday);
    const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
    return `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  };

  const analyzeLocalElectionObservation = (value = "") => {
    const text = normalizeText(value);
    if (!text) {
      return { label: "equilibrado", bucket: "neutralCount" };
    }

    const positivePattern = /\b(apoio|bom|boa|forte|melhor|aprovo|preparado|competente|confio|reeleicao|continuidade|favoravel)\b/;
    const negativePattern = /\b(ruim|fraco|fraca|desgaste|rejeicao|rejeição|critica|critico|pessimo|péssimo|contra|troca|mudanca|mudança|nao voto)\b/;

    if (positivePattern.test(text) && !negativePattern.test(text)) {
      return { label: "favor e aprovacao", bucket: "positiveCount" };
    }

    if (negativePattern.test(text) && !positivePattern.test(text)) {
      return { label: "pressao e critica", bucket: "negativeCount" };
    }

    return { label: "equilibrado", bucket: "neutralCount" };
  };

  const applyLocalElectionVoteFallback = (officeId, candidateId, voterMeta = {}) => {
    const nextVotes = cloneElectionData(getElectionVotes(), {});
    const nextUserVotes = cloneElectionData(getElectionUserVotes(), {});
    const nextOpinionSummary = cloneElectionData(getElectionOpinionSummary(), {});
    const nextWeeklyTrend = cloneElectionData(getElectionWeeklyTrend(), []);
    const office = getElectionOffice(officeId);
    const candidate = office?.candidates?.find((item) => item.id === candidateId);
    const city = String(voterMeta.city || "").trim();
    const observation = String(voterMeta.observation || "").trim();
    const weekKey = getElectionClientWeekKey();
    const opinion = analyzeLocalElectionObservation(observation);

    nextVotes[officeId] = nextVotes[officeId] || {};
    nextVotes[officeId][candidateId] = Number(nextVotes[officeId][candidateId] || 0) + 1;
    nextUserVotes[officeId] = candidateId;

    const officeBucket = nextOpinionSummary[officeId] || { totalComments: 0, candidates: [] };
    officeBucket.candidates = Array.isArray(officeBucket.candidates) ? officeBucket.candidates : [];
    let candidateBucket = officeBucket.candidates.find((item) => item.candidateId === candidateId);

    if (!candidateBucket) {
      candidateBucket = {
        candidateId,
        candidateName: candidate?.name || "Nome em leitura",
        candidateParty: candidate?.party || "",
        totalVotes: 0,
        commentCount: 0,
        positiveCount: 0,
        neutralCount: 0,
        negativeCount: 0,
        topCity: city || "",
        moodLabel: "amostra inicial"
      };
      officeBucket.candidates.push(candidateBucket);
    }

    candidateBucket.totalVotes = Number(candidateBucket.totalVotes || 0) + 1;
    if (observation) {
      officeBucket.totalComments = Number(officeBucket.totalComments || 0) + 1;
      candidateBucket.commentCount = Number(candidateBucket.commentCount || 0) + 1;
      candidateBucket[opinion.bucket] = Number(candidateBucket[opinion.bucket] || 0) + 1;
      candidateBucket.moodLabel = opinion.label;
    }
    if (city) {
      candidateBucket.topCity = city;
    }
    nextOpinionSummary[officeId] = officeBucket;

    const existingWeek = nextWeeklyTrend.find((item) => item.weekKey === weekKey);
    if (existingWeek) {
      existingWeek.totalVotes = Number(existingWeek.totalVotes || existingWeek.total || 0) + 1;
      existingWeek.total = existingWeek.totalVotes;
    } else {
      nextWeeklyTrend.push({ weekKey, totalVotes: 1, total: 1 });
    }

    remoteElectionVotes = nextVotes;
    remoteElectionUserVotes = nextUserVotes;
    remoteElectionOpinionSummary = nextOpinionSummary;
    remoteElectionWeeklyTrend = nextWeeklyTrend;
    writeElectionStorage(electionVotesKey, nextVotes);
    writeElectionStorage(electionUserVotesKey, nextUserVotes);
    writeElectionStorage(electionOpinionSummaryKey, nextOpinionSummary);
    renderElectionOffice(officeId);

    return {
      ok: true,
      alreadyVoted: false,
      localFallback: true,
      votes: nextVotes,
      userVotes: nextUserVotes,
      opinionSummary: nextOpinionSummary,
      weeklyTrend: nextWeeklyTrend
    };
  };

  const getOfficeVotes = (officeId) => {
    const votes = getElectionVotes();
    return votes[officeId] || {};
  };

  const getUserOfficeVote = (officeId) => getElectionUserVotes()[officeId] || "";

  const getElectionOpinionOffice = (officeId) => getElectionOpinionSummary()[officeId] || null;

  const getElectionMoodClass = (label = "") => {
    const normalized = String(label || "").toLowerCase();
    if (normalized.includes("favor")) return "is-hot";
    if (normalized.includes("press")) return "is-cold";
    return "is-neutral";
  };

  const getElectionHeatBarWidth = (value, total) => {
    if (!value) {
      return 0;
    }

    if (!total) {
      return value > 0 ? 8 : 0;
    }

    return Math.max(6, Math.min(100, Math.round((value / total) * 100)));
  };

  const renderElectionHeat = (office) => {
    if (!electionHeatGrid || !office) {
      return;
    }

    const summary = getElectionOpinionOffice(office.id);
    const candidates = Array.isArray(summary?.candidates) ? summary.candidates.slice(0, 4) : [];
    const totalSignals = Number(summary?.totalComments || 0);

    if (electionHeatTitle) {
      electionHeatTitle.textContent = `Calor eleitoral para ${office.label}`;
    }

    if (electionHeatMeta) {
      electionHeatMeta.textContent = totalSignals
        ? `${totalSignals} observacao(oes) com leitura de humor e reeleicao percebida nesta faixa.`
        : "As observacoes enviadas junto com o voto alimentam um termometro de favor, pressao ou neutralidade.";
    }

    if (!candidates.length) {
      electionHeatGrid.innerHTML = `
        <article class="election-heat-card is-empty">
          <strong>Sem sinais suficientes ainda.</strong>
          <p>Os proximos votos com observacoes vao mostrar aqui o clima local de cada nome.</p>
        </article>
      `;
      return;
    }

    electionHeatGrid.innerHTML = candidates
      .map((item) => {
        const positiveCount = Number(item.positiveCount || 0);
        const neutralCount = Number(item.neutralCount || 0);
        const negativeCount = Number(item.negativeCount || 0);
        const commentCount = Number(item.commentCount || 0);
        const totalCount = Math.max(commentCount, positiveCount + neutralCount + negativeCount);
        const moodLabel = item.moodLabel || "equilibrado";

        return `
          <article class="election-heat-card">
            <div class="election-heat-card-header">
              <strong>${escapeHtml(item.candidateName || "Nome em leitura")}</strong>
              <span>${escapeHtml(item.candidateParty || office.label || "cargo")} • ${Number(item.totalVotes || 0)} voto(s)</span>
            </div>
            <span class="election-heat-mood ${getElectionMoodClass(moodLabel)}">${escapeHtml(moodLabel)}</span>
            <div class="election-heat-bars">
              <div class="election-heat-stat">
                <div class="election-heat-stat-row">
                  <span>positivo</span>
                  <strong>${positiveCount}</strong>
                </div>
                <div class="election-heat-bar"><span class="is-positive" style="width:${getElectionHeatBarWidth(positiveCount, totalCount)}%"></span></div>
              </div>
              <div class="election-heat-stat">
                <div class="election-heat-stat-row">
                  <span>neutro</span>
                  <strong>${neutralCount}</strong>
                </div>
                <div class="election-heat-bar"><span class="is-neutral" style="width:${getElectionHeatBarWidth(neutralCount, totalCount)}%"></span></div>
              </div>
              <div class="election-heat-stat">
                <div class="election-heat-stat-row">
                  <span>negativo</span>
                  <strong>${negativeCount}</strong>
                </div>
                <div class="election-heat-bar"><span class="is-negative" style="width:${getElectionHeatBarWidth(negativeCount, totalCount)}%"></span></div>
              </div>
            </div>
            <p class="election-heat-card-meta">
              ${commentCount ? `${commentCount} comentário(s) local(is)` : "Ainda sem comentário qualitativo"}${item.topCity ? ` • cidade mais citada: ${escapeHtml(item.topCity)}` : ""}.
            </p>
          </article>
        `;
      })
      .join("");
  };

  const ensureElectionVoteModal = () => {
    if (electionVoteModal) {
      if (electionVoteModal.dataset.voteModalBound === "1") {
        return electionVoteModal;
      }
    } else {
      electionVoteModal = document.querySelector("#electionVoteModal");
    }

    if (!electionVoteModal) {
      const modal = document.createElement("section");
      modal.id = "electionVoteModal";
      modal.className = "election-vote-modal";
      modal.hidden = true;
      modal.innerHTML = `
        <div class="election-vote-modal-backdrop" data-election-vote-close></div>
        <article class="election-vote-dialog" role="dialog" aria-modal="true" aria-labelledby="electionVoteTitle">
          <button class="election-vote-close" type="button" aria-label="Fechar coleta de voto" data-election-vote-close>&times;</button>
          <p class="panel-label">Pesquisa local com contexto</p>
          <h3 id="electionVoteTitle">Registrar voto com cidade</h3>
          <p class="election-vote-lead" data-election-vote-lead>
            Informe sua cidade. Nome, partido e observacao sao opcionais.
          </p>
          <form class="election-vote-form" novalidate>
            <div class="election-vote-form-grid">
              <label class="election-vote-field">
                <span>Cidade</span>
                <input type="text" name="city" maxlength="80" autocomplete="address-level2" required />
              </label>
              <label class="election-vote-field">
                <span>Seu nome (opcional)</span>
                <input type="text" name="voterName" maxlength="120" autocomplete="name" />
              </label>
              <label class="election-vote-field">
                <span>Partido ou apoio (opcional)</span>
                <input type="text" name="voterParty" maxlength="90" autocomplete="organization-title" />
              </label>
            </div>
            <label class="election-vote-field full">
              <span>Observacoes sobre o candidato</span>
              <textarea name="comment" maxlength="420"></textarea>
            </label>
            <p class="election-vote-feedback" data-election-vote-feedback aria-live="polite"></p>
            <div class="election-vote-actions">
              <button class="outline-button" type="button" data-election-vote-close>Cancelar</button>
              <button class="solid-button" type="submit" data-election-vote-submit>Confirmar voto</button>
            </div>
          </form>
        </article>
      `;
      document.body.appendChild(modal);
      electionVoteModal = modal;
    }

    const modal = electionVoteModal;
    const closeModal = ({ reset = false } = {}) => {
      modal.hidden = true;
      document.body.classList.remove("election-vote-open");
      modal.querySelector("[data-election-vote-confirm-panel]")?.setAttribute("hidden", "");
      delete modal.dataset.confirmReady;
      if (reset) {
        modal.querySelector(".election-vote-form")?.reset();
        setFeedbackState(
          modal.querySelector("[data-election-vote-feedback], #electionVoteFeedback"),
          "",
          ""
        );
      }
      electionVoteModalState = null;
    };

    modal.__closeElectionVote = closeModal;

    if (modal.dataset.voteModalBound === "1") {
      return modal;
    }

    modal.dataset.voteModalBound = "1";
    const confirmPanel = ensureElectionVoteConfirmPanel(modal);

    const setConfirmPanelVisible = (visible, payload = {}) => {
      if (!confirmPanel) {
        return;
      }

      confirmPanel.hidden = !visible;
      if (!visible) {
        delete modal.dataset.confirmReady;
        return;
      }

      modal.dataset.confirmReady = "1";
      confirmPanel.querySelector("[data-election-vote-confirm-title]").textContent =
        `Confirmar voto em ${payload.candidateName || "candidato"}?`;
      confirmPanel.querySelector("[data-election-vote-confirm-text]").textContent =
        `Você vai computar sua preferência para ${payload.officeLabel || "este cargo"} em ${payload.candidateName || "um nome"}${payload.city ? `, com cidade ${payload.city}` : ""}.`;
    };

    modal.addEventListener("click", (event) => {
      if (
        event.target === modal ||
        event.target?.matches?.(".election-vote-modal-backdrop, [data-election-vote-close], [data-close-election-vote]")
      ) {
        setConfirmPanelVisible(false);
        closeModal();
      }
    });

    modal.querySelectorAll("[data-close-election-vote], [data-election-vote-close]").forEach((button) => {
      button.addEventListener("click", () => {
        setConfirmPanelVisible(false);
        closeModal();
      });
    });

    modal.querySelector(".election-vote-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!electionVoteModalState) {
        return;
      }

      const form = event.currentTarget;
      const cityInput = form.elements.city || form.querySelector("[name='city']");
      const nameInput = form.elements.voterName || form.elements.name || form.querySelector("[name='voterName'], [name='name']");
      const partyInput = form.elements.voterParty || form.elements.party || form.querySelector("[name='voterParty'], [name='party']");
      const commentInput = form.elements.comment || form.elements.observation || form.querySelector("[name='comment'], [name='observation']");
      const city = String(cityInput?.value || "").trim();
      const name = String(nameInput?.value || "").trim();
      const party = String(partyInput?.value || "").trim();
      const observation = String(commentInput?.value || "").trim();
      const feedback = modal.querySelector("[data-election-vote-feedback], #electionVoteFeedback");
      const submitButton = modal.querySelector("[data-election-vote-submit], #electionVoteSubmitButton");

      if (!city) {
        setFeedbackState(feedback, "Informe a cidade para registrar o voto.", "is-error");
        cityInput?.focus();
        return;
      }

      const office = getElectionOffice(electionVoteModalState.officeId);
      const candidate = office?.candidates?.find((item) => item.id === electionVoteModalState.candidateId);
      const confirmationText = `Confirmar voto em ${candidate?.name || "este candidato"} para ${office?.label || "este cargo"}${city ? `, com cidade ${city}` : ""}?`;
      if (typeof window.confirm === "function" && !window.confirm(confirmationText)) {
        setFeedbackState(
          feedback,
          "Voto revisado. Você pode ajustar os dados antes de confirmar.",
          ""
        );
        return;
      }

      confirmPanel?.querySelector("[data-election-vote-confirm-submit]")?.click();
    });

    confirmPanel?.querySelector("[data-election-vote-confirm-cancel]")?.addEventListener("click", () => {
      setConfirmPanelVisible(false);
      setFeedbackState(
        modal.querySelector("[data-election-vote-feedback], #electionVoteFeedback"),
        "Você pode revisar a cidade e os detalhes antes de confirmar.",
        ""
      );
    });

    confirmPanel?.querySelector("[data-election-vote-confirm-submit]")?.addEventListener("click", async () => {
      if (!electionVoteModalState) {
        return;
      }

      const form = modal.querySelector(".election-vote-form");
      const cityInput = form?.elements?.city || form?.querySelector?.("[name='city']");
      const nameInput = form?.elements?.voterName || form?.elements?.name || form?.querySelector?.("[name='voterName'], [name='name']");
      const partyInput = form?.elements?.voterParty || form?.elements?.party || form?.querySelector?.("[name='voterParty'], [name='party']");
      const commentInput = form?.elements?.comment || form?.elements?.observation || form?.querySelector?.("[name='comment'], [name='observation']");
      const city = String(cityInput?.value || "").trim();
      const name = String(nameInput?.value || "").trim();
      const party = String(partyInput?.value || "").trim();
      const observation = String(commentInput?.value || "").trim();
      const feedback = modal.querySelector("[data-election-vote-feedback], #electionVoteFeedback");
      const submitButton = modal.querySelector("[data-election-vote-submit], #electionVoteSubmitButton");
      const confirmSubmitButton = confirmPanel.querySelector("[data-election-vote-confirm-submit]");
      const office = getElectionOffice(electionVoteModalState.officeId);
      const candidate = office?.candidates?.find((item) => item.id === electionVoteModalState.candidateId);

      submitButton.disabled = true;
      submitButton.textContent = "Registrando...";
      if (confirmSubmitButton) {
        confirmSubmitButton.disabled = true;
        confirmSubmitButton.textContent = "Computando...";
      }
      setFeedbackState(feedback, "", "");

      try {
        const submitResult = await submitElectionVote(electionVoteModalState.officeId, electionVoteModalState.candidateId, {
          city,
          name,
          party,
          observation
        });
        writeElectionVoterProfile({ city, name, party });
        try {
          localStorage.setItem("catalogo_user_city", city);
          localStorage.setItem("catalogo_user_country", "Brasil");
        } catch (_error) {
          // segue sem bloquear o voto
        }
        writeElectionLastVote({
          officeId: electionVoteModalState.officeId,
          officeLabel: office?.label || "",
          candidateId: electionVoteModalState.candidateId,
          candidateName: candidate?.name || "",
          city
        });
        activeElectionResultsOfficeId = electionVoteModalState.officeId;
        renderElectionResultsOfficeButtons();
        closeModal({ reset: true });
        showElectionVoteSuccessModal({
          officeLabel: office?.label || "",
          candidateName: candidate?.name || "",
          city
        });
        showElectionVoteToast(
          submitResult?.localFallback
            ? "Backend oscilando: voto salvo neste dispositivo e placar atualizado localmente."
            : "Obrigado pela participacao. Acompanhe as parciais semanais e os graficos."
        );
      } catch (error) {
        setFeedbackState(
          feedback,
          String(error?.message || "Nao foi possivel registrar o voto agora."),
          "is-error"
        );
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Confirmar voto";
        if (confirmSubmitButton) {
          confirmSubmitButton.disabled = false;
          confirmSubmitButton.textContent = "Sim, confirmar voto";
        }
        setConfirmPanelVisible(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) {
        closeModal();
      }
    });

    return modal;
  };

  const openElectionVoteModal = (officeId, candidateId) => {
    const office = getElectionOffice(officeId);
    const candidate = office?.candidates?.find((item) => item.id === candidateId);
    if (!office || !candidate) {
      return;
    }

    const modal = ensureElectionVoteModal();
    const form = modal.querySelector(".election-vote-form");
    const profile = getElectionVoterProfile();
    const lastVote = readElectionLastVote();

    electionVoteModalState = {
      officeId,
      candidateId
    };

    modal.querySelector("#electionVoteTitle").textContent = `Votar em ${candidate.name}`;
    modal.querySelector("[data-election-vote-lead], #electionVoteLead").textContent =
      lastVote?.candidateName && lastVote?.officeLabel
        ? `Seu ultimo voto salvo foi em ${lastVote.candidateName} para ${lastVote.officeLabel}. Agora o voto para ${office.label} pede cidade obrigatoria e confirmacao final neste dispositivo.`
        : `Seu voto para ${office.label} pede cidade obrigatoria e confirmacao final. Cada dispositivo registra um voto por cargo a cada semana.`;

    if (form) {
      const cityInput = form.elements.city || form.querySelector("[name='city']");
      const nameInput = form.elements.voterName || form.elements.name || form.querySelector("[name='voterName'], [name='name']");
      const partyInput = form.elements.voterParty || form.elements.party || form.querySelector("[name='voterParty'], [name='party']");
      const commentInput = form.elements.comment || form.elements.observation || form.querySelector("[name='comment'], [name='observation']");

      if (cityInput) cityInput.value = profile.city || "";
      if (nameInput) nameInput.value = profile.name || "";
      if (partyInput) partyInput.value = profile.party || "";
      if (commentInput) commentInput.value = "";
    }

    setFeedbackState(modal.querySelector("[data-election-vote-feedback], #electionVoteFeedback"), "", "");
    modal.querySelector("[data-election-vote-confirm-panel]")?.setAttribute("hidden", "");
    delete modal.dataset.confirmReady;
    modal.hidden = false;
    document.body.classList.add("election-vote-open");
    const authCard = modal.querySelector("[data-google-auth-card]");
    if (authCard) authCard.hidden = true;
    window.setTimeout(() => {
      const cityInput = form?.elements?.city || form?.querySelector?.("[name='city']");
      cityInput?.focus();
      cityInput?.select?.();
    }, 20);
  };

  const ensureElectionVoteConfirmPanel = (modal) => {
    if (!modal) {
      return null;
    }

    let panel = modal.querySelector("[data-election-vote-confirm-panel]");
    if (panel) {
      return panel;
    }

    panel = document.createElement("section");
    panel.className = "election-vote-confirm-panel";
    panel.setAttribute("data-election-vote-confirm-panel", "");
    panel.hidden = true;
    panel.innerHTML = `
      <div class="election-vote-confirm-copy">
        <span class="panel-label">Confirmar voto</span>
        <strong data-election-vote-confirm-title>Você confirma este voto?</strong>
        <p data-election-vote-confirm-text>
          Revise o cargo, o candidato e a cidade antes de confirmar.
        </p>
      </div>
      <div class="election-vote-confirm-actions">
        <button class="outline-button" type="button" data-election-vote-confirm-cancel>Revisar</button>
        <button class="solid-button" type="button" data-election-vote-confirm-submit>Sim, confirmar voto</button>
      </div>
    `;

    modal.querySelector(".election-vote-form")?.appendChild(panel);
    return panel;
  };

  const renderElectionResultsOfficeButtons = () => {
    if (!electionResultsOfficeButtons) {
      return;
    }

    const selectedOfficeId = activeElectionResultsOfficeId || activeElectionOfficeId;
    electionResultsOfficeButtons.innerHTML = electionOffices
      .map(
        (office) => `
          <button
            class="election-office-button${selectedOfficeId === office.id ? " active" : ""}"
            type="button"
            data-election-results-office="${escapeHtml(office.id)}"
          >
            Preferência para ${escapeHtml(office.label)}
          </button>
        `
      )
      .join("");
  };

  window.openElectionVoteModal = openElectionVoteModal;

  const hydrateElectionVotes = async () => {
    try {
      const voterId = getElectionVoterId();
      const payload = await requestApiJson(
        `/api/elections/votes?voterId=${encodeURIComponent(voterId)}`,
        { method: "GET" }
      );
      remoteElectionVotes = payload.votes || {};
      remoteElectionUserVotes = payload.userVotes || {};
      remoteElectionOpinionSummary = payload.opinionSummary || {};
      remoteElectionWeeklyTrend = payload.weeklyTrend || [];
      writeElectionStorage(electionVotesKey, remoteElectionVotes);
      writeElectionStorage(electionUserVotesKey, remoteElectionUserVotes);
      writeElectionStorage(electionOpinionSummaryKey, remoteElectionOpinionSummary);
      renderElectionOffice(activeElectionOfficeId);
    } catch (_error) {
      // Mantem a votação local se o backend não estiver disponível.
    }
  };

  const submitElectionVote = async (officeId, candidateId, voterMeta = {}) => {
    const userVotes = getElectionUserVotes();
    const city = String(voterMeta.city || "").trim();

    if (userVotes[officeId]) {
      renderElectionOffice(officeId);
      return { ok: true, alreadyVoted: true, localOnly: true };
    }

    if (!city) {
      throw new Error("Informe a cidade para registrar o voto.");
    }

    try {
      const payload = await requestApiJson("/api/elections/votes", {
        method: "POST",
        body: JSON.stringify({
          officeId,
          candidateId,
          voterId: getElectionVoterId(),
          city,
          name: String(voterMeta.name || "").trim(),
          party: String(voterMeta.party || "").trim(),
          observation: String(voterMeta.observation || "").trim()
        })
      });
      remoteElectionVotes = payload.votes || {};
      remoteElectionUserVotes = payload.userVotes || {};
      remoteElectionOpinionSummary = payload.opinionSummary || {};
      remoteElectionWeeklyTrend = payload.weeklyTrend || [];
      writeElectionStorage(electionVotesKey, remoteElectionVotes);
      writeElectionStorage(electionUserVotesKey, remoteElectionUserVotes);
      writeElectionStorage(electionOpinionSummaryKey, remoteElectionOpinionSummary);
      window.dispatchEvent(
        new CustomEvent("catalogo:election-vote-updated", {
          detail: { officeId, candidateId }
        })
      );
      renderElectionOffice(officeId);
      return;
    } catch (error) {
      applyLocalElectionVoteFallback(officeId, candidateId, voterMeta);
      return {
        ok: true,
        alreadyVoted: false,
        localFallback: true,
        message: String(
          error?.message ||
            "O backend oscilou, mas o voto foi salvo localmente neste dispositivo."
        )
      };
    }
  };

  const getCandidateInitials = (name = "") =>
    String(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?";

  const candidatePhotoResolveCache = new Map();

  const resolveCandidatePhoto = async (candidate = {}) => {
    const directCandidates = [];
    [candidate.imageUrl, candidate.photoUrl, candidate.avatarUrl].forEach((value) => {
      buildImageLoadCandidates(value).forEach((imageCandidate) =>
        pushUniqueImageCandidate(directCandidates, imageCandidate)
      );
    });

    if (directCandidates.length) {
      const directPhoto = await preloadFirstAvailableImage(directCandidates);
      if (directPhoto) {
        return directPhoto;
      }
    }

    const sourceUrl = String(candidate.sourceUrl || candidate.imageSourceUrl || "").trim();
    if (!sourceUrl || sourceUrl === "#") {
      return "";
    }

    if (!canRequestProtectedPreviewImage()) {
      return "";
    }

    if (!candidatePhotoResolveCache.has(sourceUrl)) {
      candidatePhotoResolveCache.set(
        sourceUrl,
        requestApiJson(`/api/preview-image?url=${encodeURIComponent(sourceUrl)}`, {
          method: "GET"
        })
          .then((payload) =>
            preloadFirstAvailableImage(buildImageLoadCandidates(payload?.imageUrl || ""))
          )
          .catch(() => "")
      );
    }

    return candidatePhotoResolveCache.get(sourceUrl) || "";
  };

  const applyCandidatePhoto = (avatarNode, candidate = {}) => {
    if (!avatarNode) {
      return;
    }

    resolveCandidatePhoto(candidate).then((photoUrl) => {
      if (!photoUrl) {
        return;
      }

      avatarNode.style.setProperty("--candidate-photo", `url('${photoUrl}')`);
      avatarNode.classList.add("has-photo");
    });
  };

  const buildCandidatePortalUrl = (officeId, candidateId) =>
    `./candidato.html?office=${encodeURIComponent(officeId)}&candidate=${encodeURIComponent(candidateId)}`;

  const buildCandidateCard = (office, candidate) => {
    const card = document.createElement("article");
    const votedCandidateId = getUserOfficeVote(office.id);
    const hasVoteInOffice = Boolean(votedCandidateId);
    const isSelected = votedCandidateId === candidate.id;
    const initial = getCandidateInitials(candidate.name);
    const summary =
      candidate.historySummary ||
      candidate.summary ||
      "Nome monitorado na cobertura política do Catálogo CZS.";
    const currentPosition = String(candidate.currentPosition || "").trim();
    const politicalPosition = String(
      candidate.politicalPositionShort || candidate.politicalPosition || ""
    ).trim();
    const scoreTotal = Number(candidate.score?.total || 0);
    const voteStatusText = isSelected
      ? "Seu voto para este cargo ja foi confirmado nesta semana."
      : hasVoteInOffice
        ? "Este dispositivo ja usou o voto semanal neste cargo."
        : "Cada dispositivo pode registrar um voto por cargo a cada semana.";
    const highlights = Array.isArray(candidate.achievements) && candidate.achievements.length
      ? candidate.achievements.slice(0, 3)
      : Array.isArray(candidate.proposals) && candidate.proposals.length
        ? candidate.proposals.slice(0, 3)
        : ["Perfil em atualização"];

    card.className = "candidate-card news-card reveal active";
    card.dataset.office = office.id;
    card.dataset.candidate = candidate.id;

    card.innerHTML = `
      <header class="candidate-header">
        <div class="candidate-avatar">${initial}</div>
        <div>
          <span class="candidate-office">${office.badge || office.label}</span>
          <h3>${candidate.name}</h3>
          <p class="candidate-party">${candidate.party || "partido em atualização"} • ${candidate.role || office.label}</p>
        </div>
      </header>
      <p class="candidate-summary">${escapeHtml(summary)}</p>
      ${currentPosition ? `<p class="candidate-status">${escapeHtml(currentPosition)}</p>` : ""}
      <div class="candidate-meta-chips">
        ${politicalPosition ? `<span>${escapeHtml(politicalPosition)}</span>` : ""}
        ${scoreTotal ? `<span>Pontuação ${escapeHtml(String(scoreTotal))}</span>` : ""}
      </div>
      <div class="candidate-propostas">
        <h4>Realizações e focos</h4>
        <ul>
          ${highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>
      <footer class="candidate-vote-footer">
        <a class="candidate-portal-link" href="${buildCandidatePortalUrl(office.id, candidate.id)}">
          Ver histórico e pontuação
        </a>
        <button
          class="chip-button vote-button${isSelected ? " voted" : ""}"
          type="button"
          data-office="${office.id}"
          data-candidate="${candidate.id}"
          ${hasVoteInOffice ? "disabled" : ""}
        >
          ${isSelected ? "Voto registrado" : hasVoteInOffice ? "Voto já usado neste cargo" : "Votar neste dispositivo"}
        </button>
        <p class="candidate-vote-status${isSelected ? " is-success" : hasVoteInOffice ? " is-locked" : ""}">
          ${escapeHtml(voteStatusText)}
        </p>
      </footer>
    `;

    applyCandidatePhoto(card.querySelector(".candidate-avatar"), candidate);

    return card;
  };

  const renderElectionResults = (office) => {
    if (!electionResultsBars) {
      return;
    }

    const officeVotes = getOfficeVotes(office.id);
    const totalVotes = (office.candidates || []).reduce(
      (sum, candidate) => sum + Number(officeVotes[candidate.id] || 0),
      0
    );
    const selectedCandidateId = getUserOfficeVote(office.id);
    activeElectionResultsOfficeId = office.id;
    renderElectionResultsOfficeButtons();

    if (electionResultsTitle) {
      electionResultsTitle.textContent = `Preferência para ${office.label}`;
    }

    if (electionResultsMeta) {
      const currentWeek = getElectionWeeklyTrend()[getElectionWeeklyTrend().length - 1] || null;
      const currentWeekTotal = Number(currentWeek?.totalVotes || currentWeek?.total || 0);
      electionResultsMeta.textContent = selectedCandidateId
        ? `Seu voto neste cargo ja foi registrado nesta semana. Total atual: ${totalVotes} voto${totalVotes === 1 ? "" : "s"}${currentWeekTotal ? ` • semana corrente: ${currentWeekTotal}` : ""}. Para trocar de nome, so na proxima rodada semanal deste dispositivo.`
        : `Escolha uma opcao para ${office.label}. A cidade e obrigatoria; nome, partido e observacao continuam opcionais. O bloqueio de voto vale por semana neste dispositivo.`;
    }

    electionResultsBars.innerHTML = "";

    (office.candidates || []).forEach((candidate) => {
      const votes = Number(officeVotes[candidate.id] || 0);
      const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
      const item = document.createElement("div");
      item.className = `result-item${selectedCandidateId === candidate.id ? " is-user-choice" : ""}`;
      item.innerHTML = `
        <span>${candidate.name} (${candidate.party || "partido em atualização"})</span>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${Math.max(percentage, votes > 0 ? 3 : 0)}%"></div>
        </div>
        <strong>${percentage}% <small>${votes} voto${votes === 1 ? "" : "s"}</small></strong>
      `;
      electionResultsBars.appendChild(item);
    });

    if (electionDisclaimer) {
      electionDisclaimer.innerHTML = `<strong>Aviso:</strong> Esta e uma enquete informal de leitores, sem amostragem cientifica e sem valor de pesquisa registrada. A cidade e obrigatoria no voto, e as observacoes ajudam a mapear sinais positivos, negativos e de reeleicao. ${escapeHtml(window.ELECTIONS_DATA.sourceNote || "")}`;
    }

    renderElectionHeat(office);
  };

  const renderElectionOffice = (officeId = activeElectionOfficeId) => {
    const office = getElectionOffice(officeId);

    if (!electionGrid || !office) {
      return;
    }

    activeElectionOfficeId = office.id;
    electionFilters.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.office === office.id);
    });

    electionGrid.innerHTML = "";

    if (!office.candidates?.length) {
      const empty = document.createElement("div");
      empty.className = "feed-empty";
      empty.textContent = "Ainda não há nomes cadastrados para este cargo.";
      electionGrid.appendChild(empty);
      renderElectionResults({ ...office, candidates: [] });
      return;
    }

    office.candidates.forEach((candidate) => {
      electionGrid.appendChild(buildCandidateCard(office, candidate));
    });

    renderElectionResults(getElectionResultsOffice(activeElectionResultsOfficeId || office.id));
    registerInteractivePanels(electionGrid);
  };

  electionFilters.forEach((button) => {
    button.addEventListener("click", () => {
      renderElectionOffice(button.dataset.office);
    });
  });

  electionGrid?.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest(".vote-button[data-office][data-candidate]") : null;
    if (!button || button.disabled) {
      return;
    }

    const officeId = button.dataset.office;
    const candidateId = button.dataset.candidate;
    openElectionVoteModal(officeId, candidateId);
  });

  electionResultsOfficeButtons?.addEventListener("click", (event) => {
    const button =
      event.target instanceof Element
        ? event.target.closest("[data-election-results-office]")
        : null;
    const officeId = String(button?.getAttribute("data-election-results-office") || "").trim();
    if (!officeId) {
      return;
    }

    activeElectionResultsOfficeId = officeId;
    renderElectionResults(getElectionResultsOffice(officeId));
  });

  staticElectionVoteButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const officeId = String(button.dataset.staticVote || "").trim();
      const candidateId = String(button.dataset.staticCandidate || "").trim();
      if (!officeId || !candidateId) {
        return;
      }
      openElectionVoteModal(officeId, candidateId);
    });
  });

  window.addEventListener("storage", (event) => {
    if (event.key === electionVotesKey || event.key === electionUserVotesKey) {
      renderElectionOffice(activeElectionOfficeId);
    }
  });

    renderElectionOffice(activeElectionOfficeId);
    hydrateElectionVotes();
    }
  }

const buildAgentWhatsappUrl = ({ name = "", email = "", subject = "", message = "" }) => {
  const lines = ["Olá, segue uma mensagem enviada pelo Catálogo Cruzeiro do Sul.", ""];

  if (name) {
    lines.push(`Nome: ${name}`);
  }

  if (email) {
    lines.push(`E-mail: ${email}`);
  }

  lines.push("", message, "", "Enviado pelo formulario Fale com a equipe.");

  if (subject) {
    lines.splice(1, 0, `Assunto: ${subject}`);
  }

  return `https://wa.me/${portalWhatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
};

const openAgentMailModal = (prefillMessage = "", prefillSubject = "") => {
  if (!agentMailModal) {
    return;
  }

  agentMailModal.hidden = false;
  document.body.classList.add("agent-mail-open");

  if (prefillMessage && agentMailMessageInput && !agentMailMessageInput.value.trim()) {
    agentMailMessageInput.value = prefillMessage;
  }

  if (prefillSubject && agentMailSubjectInput && !agentMailSubjectInput.value.trim()) {
    agentMailSubjectInput.value = prefillSubject;
  }

  setFeedbackState(agentMailFeedback, "", "");
  window.setTimeout(() => {
    agentMailMessageInput?.focus();
  }, 20);
};

const closeAgentMailModal = ({ reset = false } = {}) => {
  if (!agentMailModal) {
    return;
  }

  agentMailModal.hidden = true;
  document.body.classList.remove("agent-mail-open");

  if (reset) {
    agentMailForm?.reset();
    setFeedbackState(agentMailFeedback, "", "");
  }
};

const attachAgentMailFlow = () => {
  if (!agentMailModal || !agentMailForm || !agentMailMessageInput) {
    return;
  }

  document.querySelectorAll("[data-open-agent-mail]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const shouldUseFooterDraft = button === footerChatSend;
      const prefillMessage = shouldUseFooterDraft
        ? String(footerChatInput?.value || "").trim()
        : String(button.dataset.agentMessage || "").trim();
      const prefillSubject = String(button.dataset.agentSubject || "").trim();
      openAgentMailModal(prefillMessage, prefillSubject);
    });
  });

  document.querySelectorAll("[data-close-agent-mail]").forEach((button) => {
    button.addEventListener("click", () => closeAgentMailModal());
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !agentMailModal.hidden) {
      closeAgentMailModal();
    }
  });

  agentMailForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = String(agentMailNameInput?.value || "").trim();
    const email = String(agentMailEmailInput?.value || "").trim();
    const subject =
      String(agentMailSubjectInput?.value || "").trim() || "Contato pelo Catálogo Cruzeiro do Sul";
    const message = String(agentMailMessageInput?.value || "").trim();

    if (message.length < 5) {
      setFeedbackState(agentMailFeedback, "Escreva uma mensagem com pelo menos 5 caracteres.", "is-error");
      agentMailMessageInput.focus();
      return;
    }

    setFeedbackState(agentMailFeedback, "Preparando a mensagem no WhatsApp...", "");

    try {
      await requestApiJson("/api/agent-messages", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          recipient: `WhatsApp ${portalWhatsappNumber}`
        })
      });
    } catch (_error) {
      // Mesmo sem backend, o WhatsApp continua como caminho principal.
    }

    window.location.href = buildAgentWhatsappUrl({ name, email, subject, message });
    setFeedbackState(
      agentMailFeedback,
      "Mensagem pronta no WhatsApp. Confirme o envio para 68 99226-9296.",
      "is-success"
    );
  });
};

const buildFeedCard = (article) => {
  const normalizedArticle = normalizeRuntimeArticle(article);
  const card = document.createElement("article");
  const thumb = document.createElement("a");
  const chip = document.createElement("span");
  const source = document.createElement("span");
  const title = document.createElement("h3");
  const summary = document.createElement("p");
  const footer = document.createElement("footer");
  const category = document.createElement("span");
  const link = document.createElement("a");

  card.className = "news-card generated-feed-card reveal active";
  card.dataset.category = normalizeText(normalizedArticle.category);

  const href = buildArticleHref(normalizedArticle);

  thumb.className = `news-thumb ${normalizedArticle.previewClass}`;
  thumb.href = href;
  thumb.setAttribute("aria-label", `Abrir noticia ${normalizedArticle.title}`);
  thumb.dataset.topic = normalizedArticle.category;
  applyThumbImage(thumb, normalizedArticle);
  applyArticleLinkAttrs(thumb, href);

  chip.textContent = normalizedArticle.category;
  thumb.append(chip);

  source.className = "news-source";
  source.textContent = formatCrossedSourceMeta(normalizedArticle);

  title.textContent = normalizedArticle.title;
  summary.textContent = truncateCopy(
    normalizedArticle.displaySummary || normalizedArticle.lede,
    card.classList.contains("featured") ? 150 : 132
  );

  category.textContent = formatCrossedSourceFooter(normalizedArticle);
  link.href = href;
  link.textContent = "ler análise";
  applyArticleLinkAttrs(link, href);

  footer.append(category, link);
  card.append(thumb, source, title, summary, footer);

  return card;
};

const archiveHighlightShell = document.querySelector("#arquivo.archive-shell");
const archiveHighlightGrid = archiveHighlightShell?.querySelector(".archive-grid") || null;
const archiveHighlightButtons = archiveHighlightShell
  ? [...archiveHighlightShell.querySelectorAll(".day-chip[data-archive-filter]")]
  : [];
const archiveHighlightSummary = archiveHighlightShell?.querySelector(".section-heading > p:last-child") || null;
const archiveHighlightState = {
  filter: archiveHighlightButtons.find((button) => button.classList.contains("is-active"))?.dataset.archiveFilter || "today"
};
const archivePeriodFilters = {
  today: 1,
  "7d": 7,
  "15d": 15,
  "30d": 30
};
const archiveFilterLabels = {
  today: "Hoje",
  "7d": "7 dias",
  "15d": "15 dias",
  "30d": "30 dias",
  cheia: "Cheia",
  saude: "Saúde"
};
const archiveTopicPatterns = {
  cheia:
    /\b(cheia|enchente|alag|alagamento|rio|jurua|juruá|cota|vazante|abrigo|desabrig|inund|defesa civil|familias atingidas|famílias atingidas)\b/,
  saude:
    /\b(saude|saúde|hospital|ubs|upa|vacina|vacinacao|vacinação|atendimento|medic|consulta|dengue|sus|tenda)\b/
};

const dateFromLocalKey = (dateKey = "") => {
  const match = String(dateKey || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
};

const getArchiveArticleDate = (article = {}) => {
  const dateKey = getArticleDateKey(article);
  if (dateKey) {
    return dateFromLocalKey(dateKey);
  }

  const parsed = new Date(article.publishedAt || article.createdAt || article.date || "");
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getArchiveAnchorDate = (items = []) => {
  const todayKey = getLocalDateKey(new Date());
  const todayHasItems = items.some((item) => getArticleDateKey(item) === todayKey);

  if (todayHasItems) {
    return dateFromLocalKey(todayKey);
  }

  return (
    getSortedLiveFeedArticles(items)
      .map((item) => dateFromLocalKey(getArticleDateKey(item)))
      .find(Boolean) || new Date()
  );
};

const getArchiveHighlightItems = () => {
  const sourceItems = liveFeedState.items.length ? liveFeedState.items : initialStaticNews;
  const normalizedItems = sourceItems.map((item) => normalizeRuntimeArticle(item));
  const currentFilter = archiveHighlightState.filter;

  if (archivePeriodFilters[currentFilter]) {
    const anchorDate = getArchiveAnchorDate(normalizedItems);
    const periodDays = archivePeriodFilters[currentFilter];
    const startTime = new Date(
      anchorDate.getFullYear(),
      anchorDate.getMonth(),
      anchorDate.getDate() - periodDays + 1
    ).getTime();
    const endTime = new Date(
      anchorDate.getFullYear(),
      anchorDate.getMonth(),
      anchorDate.getDate() + 1
    ).getTime();

    return diversifyArchiveStories(
      getSortedLiveFeedArticles(normalizedItems).filter((article) => {
      const articleDate = getArchiveArticleDate(article);
      if (!articleDate) {
        return false;
      }

      const articleTime = new Date(
        articleDate.getFullYear(),
        articleDate.getMonth(),
        articleDate.getDate()
      ).getTime();

      return articleTime >= startTime && articleTime < endTime;
      }),
      18
    );
  }

  const topicPattern = archiveTopicPatterns[currentFilter];
  if (topicPattern) {
    return diversifyArchiveStories(
      getSortedLiveFeedArticles(normalizedItems).filter((article) => {
      const normalizedArticle = normalizeRuntimeArticle(article);
      const haystack = normalizeText(
        [
          normalizedArticle.title,
          normalizedArticle.lede,
          normalizedArticle.summary,
          normalizedArticle.category,
          normalizedArticle.categoryKey,
          normalizedArticle.sourceName
        ].join(" ")
      );

      return (
        (currentFilter === "saude" && articleMatchesCategoryFilter(normalizedArticle, "saude")) ||
        topicPattern.test(haystack)
      );
      }),
      18
    );
  }

  return diversifyArchiveStories(getSortedLiveFeedArticles(normalizedItems), 18);
};

const buildArchiveHighlightCard = (article, index = 0) => {
  const card = buildFeedCard(article);
  card.classList.remove("news-card");
  card.classList.add("archive-card", "generated-archive-card");
  card.classList.toggle("tall", index === 1);
  return card;
};

const renderArchiveHighlights = () => {
  if (!archiveHighlightGrid || !archiveHighlightButtons.length) {
    return;
  }

  const reservedKeys = buildReservedArticleKeys(["archive", "live"]);
  const reservedImages = buildReservedArticleImageKeys(["archive", "live"]);
  const filteredItems = getArchiveHighlightItems();
  const fallbackItems = getSortedLiveFeedArticles(
    liveFeedState.items.length ? liveFeedState.items : initialStaticNews
  ).map((item) => normalizeRuntimeArticle(item));
  const visibleItems = diversifyArchiveStories(
    (filteredItems.length ? filteredItems : fallbackItems).filter((article) => {
      const key = getArticleUsageKey(article);
      const imageKey = getArticleImageKey(article);
      return key && !reservedKeys.has(key) && (!imageKey || !reservedImages.has(imageKey));
    }),
    6
  ).slice(0, 6);
  const activeLabel = archiveFilterLabels[archiveHighlightState.filter] || "Arquivo";

  archiveHighlightButtons.forEach((button) => {
    const isActive = button.dataset.archiveFilter === archiveHighlightState.filter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  archiveHighlightGrid.innerHTML = "";

  if (!visibleItems.length) {
    const empty = document.createElement("div");
    empty.className = "feed-empty";
    empty.textContent = "Ainda não há notícia suficiente para montar esse recorte.";
    archiveHighlightGrid.appendChild(empty);
  } else {
    visibleItems.forEach((article, index) => {
      archiveHighlightGrid.appendChild(buildArchiveHighlightCard(article, index));
    });
  }

  if (archiveHighlightSummary) {
    const total = filteredItems.length || visibleItems.length;
    archiveHighlightSummary.textContent = `Recorte ${activeLabel}: ${total} notícia${total === 1 ? "" : "s"} encontrada${total === 1 ? "" : "s"} no arquivo real.`;
  }

  reserveSurfaceArticles("archive", visibleItems);
  registerInteractivePanels(archiveHighlightGrid);
  registerArticleCardLinks(archiveHighlightGrid);
};

const bindArchiveHighlightControls = () => {
  if (!archiveHighlightButtons.length || archiveHighlightShell?.dataset.archiveControlsBound === "true") {
    return;
  }

  if (archiveHighlightShell) {
    archiveHighlightShell.dataset.archiveControlsBound = "true";
  }

  archiveHighlightButtons.forEach((button) => {
    button.addEventListener("click", () => {
      archiveHighlightState.filter = button.dataset.archiveFilter || "today";
      renderArchiveHighlights();
    });
  });
};

const getSortedLiveFeedArticles = (items = []) =>
  [...items].sort((left, right) => compareEditorialFlowArticles(left, right));

const getLiveFeedSearchTerms = (query = "") =>
  [...new Set(normalizeText(query).split(/\s+/).filter(Boolean))];

const getLiveFeedQueryScore = (article, query = "") => {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const normalizedArticle = normalizeRuntimeArticle(article);
  const title = normalizeText(normalizedArticle.title);
  const lede = normalizeText(normalizedArticle.lede);
  const category = normalizeText(normalizedArticle.category);
  const sourceName = normalizeText(normalizedArticle.sourceName);
  const sourceLabel = normalizeText(normalizedArticle.sourceLabel);
  const haystack = normalizeText([title, lede, category, sourceName, sourceLabel].join(" "));
  const terms = getLiveFeedSearchTerms(normalizedQuery);

  let score = 0;
  let matchedTerms = 0;

  if (title === normalizedQuery) score += 260;
  if (title.includes(normalizedQuery)) score += 140;
  if (sourceLabel.includes(normalizedQuery)) score += 84;
  if (category === normalizedQuery) score += 72;
  if (category.includes(normalizedQuery)) score += 34;
  if (sourceName.includes(normalizedQuery)) score += 28;
  if (lede.includes(normalizedQuery)) score += 40;
  if (haystack.includes(normalizedQuery)) score += 18;

  terms.forEach((term) => {
    let matched = false;

    if (title.includes(term)) {
      score += 42;
      matched = true;
    }

    if (sourceLabel.includes(term)) {
      score += 22;
      matched = true;
    }

    if (category.includes(term)) {
      score += 18;
      matched = true;
    }

    if (sourceName.includes(term)) {
      score += 14;
      matched = true;
    }

    if (lede.includes(term)) {
      score += 12;
      matched = true;
    }

    if (matched || haystack.includes(term)) {
      matchedTerms += 1;
    }
  });

  if (matchedTerms === terms.length && terms.length > 1) {
    score += 56;
  } else if (matchedTerms > 0) {
    score += matchedTerms * 8;
  }

  return score;
};

const getLiveFeedFilterOptions = (items = []) => {
  const categoryMap = new Map();

  items.forEach((article) => {
    const normalizedArticle = normalizeRuntimeArticle(article);
    const key = normalizedArticle.categoryKey || normalizeText(normalizedArticle.category);

    if (!key) {
      return;
    }

    const current = categoryMap.get(key) || {
      key,
      label: normalizedArticle.category,
      count: 0
    };

    current.count += 1;
    categoryMap.set(key, current);
  });

  const sortedCategories = [...categoryMap.values()]
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, "pt-BR"))
    .slice(0, 7);

  return [
    {
      key: "",
      label: "Tudo",
      count: items.length
    },
    ...sortedCategories
  ];
};

const getLiveFeedActiveFilterLabel = () => {
  if (!liveFeedState.activeCategory) {
    return "";
  }

  return (
    getLiveFeedFilterOptions(liveFeedState.items).find(
      (option) => option.key === liveFeedState.activeCategory
    )?.label ||
    radarGuideThemes[liveFeedState.activeCategory]?.label ||
    liveFeedState.activeCategory
  );
};

const getLiveFeedDominantCategory = (items = []) =>
  getLiveFeedFilterOptions(items).find((option) => option.key)?.label || "Arquivo geral";

const getLiveFeedLatestDate = (items = []) => {
  const latestArticle = getSortedLiveFeedArticles(items)[0];
  return latestArticle ? normalizeRuntimeArticle(latestArticle).date : "--";
};

const getLiveFeedSourceCount = (items = []) =>
  new Set(items.map((article) => normalizeRuntimeArticle(article).sourceName).filter(Boolean)).size;

const renderLiveFeedFilters = () => {
  if (!liveFeedFilters) {
    return;
  }

  const filterOptions = getLiveFeedFilterOptions(liveFeedState.items);
  liveFeedFilters.innerHTML = "";

  filterOptions.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `feed-filter-chip${option.key === liveFeedState.activeCategory ? " is-active" : ""}`;
    button.dataset.category = option.key;
    button.textContent = option.label;
    button.setAttribute("aria-label", `${option.label}: ${option.count} notícia${option.count === 1 ? "" : "s"}`);
    button.addEventListener("click", () => {
      if (liveFeedState.activeCategory === option.key) {
        return;
      }

      liveFeedState.activeCategory = option.key;
      liveFeedState.visibleItems = liveFeedState.pageSize;
      renderLiveFeedFilters();
      renderLiveFeed();
    });
    liveFeedFilters.appendChild(button);
  });
};

const getFilteredLiveFeedArticles = () => {
  const query = String(liveFeedQuery?.value || "").trim();
  const normalizedQuery = normalizeText(query);
  const sortedArticles = getSortedLiveFeedArticles(liveFeedState.items);
  const shouldExcludePromotedSurfaces = !normalizedQuery && !liveFeedState.activeCategory;
  const reservedKeys = shouldExcludePromotedSurfaces ? buildReservedArticleKeys(["live"]) : new Set();
  const reservedImages = shouldExcludePromotedSurfaces ? buildReservedArticleImageKeys(["live"]) : new Set();
  const categoryFiltered = sortedArticles
    .map((article) => normalizeRuntimeArticle(article))
    .filter((article) => {
      if (
        liveFeedState.activeCategory &&
        !articleMatchesCategoryFilter(article, liveFeedState.activeCategory)
      ) {
        return false;
      }

      if (shouldExcludePromotedSurfaces) {
        const key = getArticleUsageKey(article);
        const imageKey = getArticleImageKey(article);
        if (!key || reservedKeys.has(key) || (imageKey && reservedImages.has(imageKey))) {
          return false;
        }
      }

      return true;
    });

  if (!normalizedQuery) {
    return diversifyArchiveStories(categoryFiltered, liveFeedState.visibleItems);
  }

  return categoryFiltered
    .map((article) => ({
      article,
      score: getLiveFeedQueryScore(article, normalizedQuery)
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      const rightDate = Date.parse(right.article.publishedAt || "") || parseArticleDate(right.article.date);
      const leftDate = Date.parse(left.article.publishedAt || "") || parseArticleDate(left.article.date);

      if (rightDate !== leftDate) {
        return rightDate - leftDate;
      }

      return String(left.article.title || "").localeCompare(String(right.article.title || ""), "pt-BR");
    })
    .map((entry) => entry.article);
};

const updateLiveFeedSummary = (filtered, visibleSlice) => {
  const totalItems = liveFeedState.items.length;
  const queryText = String(liveFeedQuery?.value || "").trim();
  const activeFilterLabel = getLiveFeedActiveFilterLabel();
  const summarySource = filtered.length > 0 ? filtered : liveFeedState.items;
  const activeContext = [activeFilterLabel, queryText ? `busca "${queryText}"` : ""].filter(Boolean);

  if (liveFeedCount) {
    liveFeedCount.textContent = String(filtered.length);
  }

  if (liveFeedCountLabel) {
    liveFeedCountLabel.textContent =
      activeContext.length > 0 ? "notícias no recorte atual" : "notícias verificadas na base";
  }

  if (liveFeedTotal) {
    const archiveTotal = Math.max(totalItems, liveFeedState.archiveTotal || 0);
    liveFeedTotal.textContent = `Acervo total: ${archiveTotal} notícias em arquivo`;
  }

  if (liveFeedUpdated) {
    liveFeedUpdated.textContent = getLiveFeedLatestDate(summarySource);
  }

  if (liveFeedFocus) {
    liveFeedFocus.textContent = getLiveFeedDominantCategory(summarySource);
  }

  if (liveFeedSources) {
    const sourceCount = getLiveFeedSourceCount(summarySource);
    liveFeedSources.textContent = `${sourceCount} ${sourceCount === 1 ? "fonte" : "fontes"}`;
  }

  if (liveFeedClear) {
    liveFeedClear.hidden = activeContext.length === 0;
  }

  if (!liveFeedStatus) {
    return;
  }

  if (filtered.length === 0) {
    liveFeedStatus.textContent =
      activeContext.length > 0
        ? `Nenhuma notícia bateu com ${activeContext.join(" e ")}. Limpe o filtro ou tente outro termo.`
        : "A base está pronta, mas nenhuma notícia entrou no recorte atual.";
    return;
  }

  if (activeContext.length > 0) {
    const loadedText =
      visibleSlice.length < filtered.length
        ? ` Mostrando ${visibleSlice.length} de ${filtered.length} agora.`
        : ` ${filtered.length} notícia${filtered.length === 1 ? "" : "s"} encontrada${filtered.length === 1 ? "" : "s"}.`;

    liveFeedStatus.textContent = `Recorte ativo por ${activeContext.join(" e ")}.${loadedText}`;
    return;
  }

  if (visibleSlice.length < filtered.length) {
    liveFeedStatus.textContent = `Arquivo vivo pronto: ${filtered.length} notícias verificadas na base. As ${liveFeedState.pageSize} mais recentes já aparecem aqui, e o restante pode ser aberto no botão abaixo.`;
    return;
  }

  liveFeedStatus.textContent = `Arquivo vivo com ${filtered.length} notícias. Use a busca ou os filtros rápidos para achar bairros, temas, fontes e assuntos.`;
};

const renderLiveFeed = () => {
  if (!liveFeedGrid || !liveFeedQuery || !liveFeedMore || !liveFeedCount) {
    return;
  }

  const filtered = getFilteredLiveFeedArticles();
  const visibleSlice = filtered.slice(0, liveFeedState.visibleItems);

  liveFeedGrid.innerHTML = "";
  updateLiveFeedSummary(filtered, visibleSlice);

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "feed-empty";
    empty.textContent =
      "Nenhuma notícia encontrada com esse termo. Tente buscar por tema, órgão ou bairro.";
    liveFeedGrid.appendChild(empty);
    liveFeedMore.hidden = true;
    return;
  }

  visibleSlice.forEach((article) => {
    liveFeedGrid.appendChild(buildFeedCard(article));
  });

  reserveSurfaceArticles("live", visibleSlice);
  liveFeedMore.hidden = visibleSlice.length >= filtered.length;
  registerInteractivePanels(liveFeedGrid);
  registerArticleCardLinks(liveFeedGrid);
};

const closeLiveFeedSuggestions = () => {
  if (!liveFeedSuggestions || !liveFeedQuery) {
    return;
  }

  liveFeedSuggestions.hidden = true;
  liveFeedQuery.setAttribute("aria-expanded", "false");
};

const getLiveFeedSuggestionArticles = () => {
  if (!liveFeedQuery) {
    return [];
  }

  const query = normalizeText(liveFeedQuery.value);
  const categoryFiltered = getSortedLiveFeedArticles(liveFeedState.items)
    .map((article) => normalizeRuntimeArticle(article))
    .filter((article) => {
      if (!liveFeedState.activeCategory) {
        return true;
      }

      return articleMatchesCategoryFilter(article, liveFeedState.activeCategory);
    });

  if (!query) {
    return categoryFiltered;
  }

  return categoryFiltered
    .map((article) => ({
      article,
      score: getLiveFeedQueryScore(article, query)
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return getArticleSortTimestamp(right.article) - getArticleSortTimestamp(left.article);
    })
    .map((entry) => entry.article);
};

const renderLiveFeedSuggestions = () => {
  if (!liveFeedSuggestions || !liveFeedQuery) {
    return;
  }

  if (document.activeElement !== liveFeedQuery) {
    closeLiveFeedSuggestions();
    return;
  }

  const matches = getLiveFeedSuggestionArticles();
  liveFeedSuggestions.innerHTML = "";

  if (!matches.length) {
    closeLiveFeedSuggestions();
    return;
  }

  const fragment = document.createDocumentFragment();

  matches.forEach((article) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "feed-suggestion-button is-article";
    button.setAttribute("role", "option");
    button.dataset.slug = article.slug || "";

    const title = document.createElement("strong");
    title.textContent = article.title;

    const meta = document.createElement("small");
    meta.textContent = `${article.sourceName} • ${article.date} • ${article.category}`;

    button.append(title, meta);
    fragment.appendChild(button);
  });

  liveFeedSuggestions.appendChild(fragment);
  liveFeedSuggestions.hidden = false;
  liveFeedQuery.setAttribute("aria-expanded", "true");
};

const attachLiveFeedAutocomplete = () => {
  if (!liveFeedSuggestions || !liveFeedQuery || liveFeedSuggestions.dataset.bound === "true") {
    return;
  }

  liveFeedSuggestions.dataset.bound = "true";
  liveFeedQuery.setAttribute("autocomplete", "off");
  liveFeedQuery.setAttribute("aria-controls", "arquivo-noticias-sugestoes");
  liveFeedQuery.setAttribute("aria-expanded", "false");

  liveFeedQuery.addEventListener("focus", renderLiveFeedSuggestions);
  liveFeedQuery.addEventListener("click", renderLiveFeedSuggestions);
  liveFeedQuery.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeLiveFeedSuggestions();
    }
  });

  liveFeedSuggestions.addEventListener("mousedown", (event) => {
    const button = event.target.closest(".feed-suggestion-button");
    if (!button) {
      return;
    }

    event.preventDefault();
    const slug = button.dataset.slug || "";
    const article = slug ? window.NEWS_MAP?.[slug] : null;
    const nextValue = article?.title || button.querySelector("strong")?.textContent || "";

    liveFeedQuery.value = nextValue;
    liveFeedState.visibleItems = liveFeedState.pageSize;
    renderLiveFeed();
    closeLiveFeedSuggestions();
    liveFeedQuery.focus();
  });

  document.addEventListener("mousedown", (event) => {
    if (event.target === liveFeedQuery || liveFeedSuggestions.contains(event.target)) {
      return;
    }

    closeLiveFeedSuggestions();
  });
};

const scrollToLiveFeed = () => {
  const target = document.querySelector("#arquivo-vivo") || liveFeedGrid;

  if (!target) {
    return;
  }

  target.scrollIntoView({
    behavior: splashMotionQuery.matches ? "auto" : "smooth",
    block: "start"
  });
};

const applyLiveFeedCategoryFilter = (filter = "todos", { scroll = false } = {}) => {
  if (!liveFeedGrid || !liveFeedQuery || !liveFeedMore || !liveFeedCount) {
    return;
  }

  const normalizedFilter = normalizeText(filter);
  liveFeedState.activeCategory = normalizedFilter === "todos" ? "" : normalizedFilter;
  liveFeedState.visibleItems = liveFeedState.pageSize;
  liveFeedQuery.value = "";

  renderLiveFeedFilters();
  renderLiveFeed();
  renderLiveFeedSuggestions();

  if (scroll) {
    scrollToLiveFeed();
  }
};

radarFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter || "todos";
    renderRadar(filter);
    applyLiveFeedCategoryFilter(filter, { scroll: true });
  });
});

const updateLiveFeedItems = (items = [], { resetFilter = true } = {}) => {
  const currentCategory = liveFeedState.activeCategory;
  liveFeedState.items = [...items];
  liveFeedState.archiveTotal = Math.max(
    liveFeedState.archiveTotal || 0,
    liveFeedState.items.length,
    Number(window.NEWS_ARCHIVE_TOTAL || 0) || 0
  );
  liveFeedState.activeCategory = resetFilter ? "" : currentCategory;
  liveFeedState.visibleItems = liveFeedState.pageSize;
  renderLiveFeedFilters();
  renderLiveFeed();
  renderLiveFeedSuggestions();
  renderArchiveHighlights();
};

if (liveFeedGrid && liveFeedQuery && liveFeedMore && liveFeedCount) {
  attachLiveFeedAutocomplete();

  liveFeedQuery.addEventListener("input", () => {
    liveFeedState.visibleItems = liveFeedState.pageSize;
    renderLiveFeed();
    renderLiveFeedSuggestions();
  });

  if (liveFeedClear) {
    liveFeedClear.addEventListener("click", () => {
      liveFeedState.activeCategory = "";
      liveFeedState.visibleItems = liveFeedState.pageSize;

      if (liveFeedQuery) {
        liveFeedQuery.value = "";
        liveFeedQuery.focus();
      }

      renderLiveFeedFilters();
      renderLiveFeed();
      renderLiveFeedSuggestions();
    });
  }

  liveFeedMore.addEventListener("click", () => {
    liveFeedState.visibleItems += liveFeedState.pageSize;
    renderLiveFeed();
  });

  updateLiveFeedItems(window.NEWS_DATA || []);
}

bindArchiveHighlightControls();
renderArchiveHighlights();

// Inicializar o radar somente depois que os helpers e normalizadores ja existem.
renderRadar();

// --- WIDGETS LATERAIS ---
const sidebarData = window.SIDEBAR_DATA || null;

const escapeAttribute = (value) =>
  String(value || "").replace(/"/g, "&quot;");

const isExternalUrl = (value) => /^https?:\/\//.test(String(value || ""));

const getSidebarHref = (item, article) => {
  if (article?.slug) {
    return `./noticia.html?slug=${article.slug}`;
  }

  return item?.url || "./index.html";
};

const getSidebarLinkAttrs = (href) =>
  isExternalUrl(href) ? ' target="_blank" rel="noreferrer"' : "";

const getSidebarWeatherIcon = (condition) => {
  const normalized = normalizeText(condition);

  if (normalized.includes("trovoada") || normalized.includes("tempestade")) {
    return "?";
  }

  if (normalized.includes("chuva")) {
    return "??";
  }

  if (normalized.includes("nuv")) {
    return "?";
  }

  return "?";
};

const getLocalTodayIso = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: localeTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(new Date());
};

let sidebarClockTimerId = 0;

const getSidebarSafeDateFormatter = (locale, options) => {
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: localeTimeZone });
  } catch (_error) {
    return new Intl.DateTimeFormat(locale, options);
  }
};

const getSidebarLocalDateParts = (date = new Date()) => {
  const timeLabel = getSidebarSafeDateFormatter("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).format(date);

  const dateLabel = getSidebarSafeDateFormatter("pt-BR", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);

  const weekdayLabel = getSidebarSafeDateFormatter("pt-BR", {
    weekday: "long"
  }).format(date);

  const hourValue = Number(
    getSidebarSafeDateFormatter("en-US", {
      hour: "2-digit",
      hourCycle: "h23"
    }).format(date)
  );

  return {
    timeLabel,
    dateLabel,
    weekdayLabel,
    hourValue: Number.isFinite(hourValue) ? hourValue : date.getHours()
  };
};

const getSidebarDayPeriod = (hourValue = 12) => {
  if (hourValue < 12) return "manhã";
  if (hourValue < 18) return "tarde";
  return "noite";
};

const buildSidebarSnapshotLabel = () => {
  const { dateLabel } = getSidebarLocalDateParts();
  return `snapshot ${dateLabel}`;
};

const buildSidebarWeatherNote = (weather = {}) => {
  const { dateLabel, hourValue } = getSidebarLocalDateParts();
  const period = getSidebarDayPeriod(hourValue);
  const tonight = String(weather.tonight || "").trim();
  const prefix = `Leitura pública atualizada para ${dateLabel}, ${period}.`;
  return tonight ? `${prefix} ${tonight}` : prefix;
};

const refreshSidebarClock = () => {
  const clockNode = document.querySelector("#live-clock");
  const dateNode = document.querySelector("#live-date");
  const weekdayNode = document.querySelector("#live-weekday");

  if (!clockNode && !dateNode && !weekdayNode) {
    return;
  }

  const { timeLabel, dateLabel, weekdayLabel } = getSidebarLocalDateParts();

  if (clockNode) {
    clockNode.textContent = timeLabel;
  }

  if (dateNode) {
    dateNode.textContent = dateLabel;
  }

  if (weekdayNode) {
    weekdayNode.textContent = `${weekdayLabel} • Acre • UTC-5`;
  }
};

const bindSidebarClock = () => {
  refreshSidebarClock();

  if (sidebarClockTimerId) {
    window.clearInterval(sidebarClockTimerId);
  }

  sidebarClockTimerId = window.setInterval(refreshSidebarClock, 1000);
};

const getNextHolidayText = (holidayGroups = []) => {
  const todayIso = getLocalTodayIso();
  const todayMs = Date.parse(`${todayIso}T12:00:00Z`);
  const upcoming = holidayGroups
    .flat()
    .filter((holiday) => holiday.isoDate >= todayIso)
    .sort((left, right) => left.isoDate.localeCompare(right.isoDate))[0];

  if (!upcoming) {
    return "Sem feriado futuro cadastrado no momento.";
  }

  const holidayMs = Date.parse(`${upcoming.isoDate}T12:00:00Z`);
  const diffDays = Math.round((holidayMs - todayMs) / 86400000);
  const plural = diffDays === 1 ? "" : "s";

  return `Próximo feriado: ${upcoming.name} em ${diffDays} dia${plural}.`;
};

const buildHolidayMarkup = (holidays) =>
  holidays
    .map(
      (holiday) => `
        <div class="holiday-item">
          <div>
            <span class="holiday-date">${holiday.shortDate}</span>
            <span class="holiday-weekday">${holiday.weekday}</span>
          </div>
          <div>
            <span class="holiday-name">${holiday.name}</span>
            ${holiday.scope ? `<small>${holiday.scope}</small>` : ""}
          </div>
        </div>
      `
    )
    .join("");

const buildAgendaMarkup = (items) =>
  items
    .map((item) => {
      const article = item.slug ? window.NEWS_MAP?.[item.slug] : null;
      const href = getSidebarHref(item, article);
      const title = article?.title || item.title;
      const sourceName = article?.sourceName || item.sourceName || "Fonte local";
      const meta = item.meta || article?.sourceLabel || "";

      return `
        <a class="sidebar-list-item" href="${escapeAttribute(href)}"${getSidebarLinkAttrs(href)}>
          <div class="sidebar-list-head">
            <span class="rail-pill">${item.tag}</span>
            <strong>${item.dateLabel}</strong>
          </div>
          <h3>${title}</h3>
          <p>${meta}</p>
          <small>Fonte: ${sourceName}</small>
        </a>
      `;
    })
    .join("");

const pickSidebarFallbackStories = (count = 0, usedKeys = new Set()) => {
  if (count <= 0) {
    return [];
  }

  const candidates = (window.NEWS_DATA || [])
    .map((item) => normalizeRuntimeArticle(item))
    .filter((article) => getArticleUsageKey(article))
    .sort((left, right) => compareEditorialFlowArticles(left, right, { imageBias: true }));
  const selected = [];
  const usedImages = new Set();

  candidates.some((article) => {
    if (selected.length >= count) return true;
    const articleKey = getArticleUsageKey(article);
    if (!articleKey || usedKeys.has(articleKey)) return false;
    const imageKey = getArticleImageKey(article);
    if (!imageKey || usedImages.has(imageKey)) return false;
    usedImages.add(imageKey);
    usedKeys.add(articleKey);
    selected.push(article);
    return false;
  });

  if (selected.length < count) {
    candidates.some((article) => {
      if (selected.length >= count) return true;
      const articleKey = getArticleUsageKey(article);
      if (!articleKey || usedKeys.has(articleKey)) return false;
      usedKeys.add(articleKey);
      selected.push(article);
      return false;
    });
  }

  return selected;
};

const buildStoryMarkup = (items, surfaceName = "") =>
  (() => {
    const usedKeys = buildReservedArticleKeys(surfaceName ? [surfaceName] : []);
    const selectedArticles = [];
    const fallbackArticles = pickSidebarFallbackStories(items.length, usedKeys);
    let fallbackIndex = 0;

    const markup = items
      .map((item) => {
        const requestedArticle = item.slug ? window.NEWS_MAP?.[item.slug] : null;
        const requestedKey = requestedArticle ? getArticleUsageKey(requestedArticle) : "";
        const shouldUseRequested = Boolean(requestedArticle && requestedKey && !usedKeys.has(requestedKey));
        const rawArticle = shouldUseRequested ? requestedArticle : fallbackArticles[fallbackIndex++];

        if (!rawArticle) {
          return "";
        }

        const article = normalizeRuntimeArticle(rawArticle);
        const articleKey = getArticleUsageKey(article);
        if (articleKey) {
          usedKeys.add(articleKey);
          selectedArticles.push(article);
        }
        const href = buildArticleHref(article);
        const photoUrl = sanitizeImageUrl(getArticleDisplayImageUrl(article) || article.imageUrl || "");
        const photoStyle = photoUrl
          ? ` style="--story-photo:url('${photoUrl}')"`
          : "";

        return `
          <a class="sidebar-photo-card" href="${escapeAttribute(href)}"${getSidebarLinkAttrs(href)}${photoStyle}>
            <div class="sidebar-photo-copy">
              <span>${item.kicker}</span>
              <strong>${article.title}</strong>
              <small>${item.stat} • ${article.sourceName}</small>
            </div>
          </a>
        `;
      })
      .join("");

    if (surfaceName) {
      reserveSurfaceArticles(surfaceName, selectedArticles);
    }

    return markup;
  })();

const buildListPanelMarkup = ({
  title,
  source,
  items,
  actionLabel,
  actionUrl,
  passiveLabel = "recorte real"
}) => {
  const actionMarkup = actionUrl
    ? `<a class="widget-link" href="${escapeAttribute(actionUrl)}"${getSidebarLinkAttrs(actionUrl)}>${actionLabel}</a>`
    : `<span class="widget-link passive-link">${passiveLabel}</span>`;

  return `
    <div class="sidebar-heading">
      <div>
        <p class="widget-title">${title}</p>
        <span class="widget-source">${source}</span>
      </div>
      ${actionMarkup}
    </div>
    <div class="sidebar-list">
      ${buildAgendaMarkup(items)}
    </div>
  `;
};

const buildMarketMarkup = (market) => `
  <div class="sidebar-heading">
    <div>
      <p class="widget-title">Radar de Mercado</p>
      <span class="widget-source">${market.snapshotLabel}</span>
    </div>
    <a class="widget-link" href="${escapeAttribute(market.sourceUrl)}"${getSidebarLinkAttrs(market.sourceUrl)}>fechamento</a>
  </div>
  <div class="market-quote-row">
    ${market.quotes
      .map(
        (quote) => `
          <div class="market-quote">
            <span>${quote.label}</span>
            <strong>${quote.value}</strong>
            <small>${quote.note}</small>
          </div>
        `
      )
      .join("")}
  </div>
  <div class="market-grid">
    ${market.moves
      .map(
        (item) => `
          <a class="market-move" href="${escapeAttribute(item.url)}"${getSidebarLinkAttrs(item.url)}>
            <div class="market-head">
              <span class="market-bias ${item.bias}">${item.badge}</span>
              <strong>${item.label}</strong>
            </div>
            <h3>${item.title}</h3>
            <p>${item.summary}</p>
            <small>Base: ${item.sourceName}</small>
          </a>
        `
      )
      .join("")}
  </div>
  ${
    market.opinionTitle || market.opinionText
      ? `<div class="market-opinion">
          ${market.opinionTitle ? `<p class="widget-kicker">${market.opinionTitle}</p>` : ""}
          ${market.opinionText ? `<p>${market.opinionText}</p>` : ""}
        </div>`
      : ""
  }
  <div class="sidebar-list compact-list">
    ${buildAgendaMarkup(market.pocketTips)}
  </div>
`;

const renderSidebarWidgets = (options = {}) => {
  if (!sidebarData) {
    return;
  }

  reserveSurfaceArticles("buzz", []);
  reserveSurfaceArticles("popular", []);

  const nowPanel = document.querySelector("#sidebar-now");
  const holidaysPanel = document.querySelector("#sidebar-holidays");
  const nationalPanel = document.querySelector("#sidebar-national");
  const politicsPanel = document.querySelector("#sidebar-politics");
  const marketPanel = document.querySelector("#sidebar-market");
  const agendaPanel = document.querySelector("#sidebar-agenda");
  const worldPanel = document.querySelector("#sidebar-world");
  const varietiesPanel = document.querySelector("#sidebar-varieties");
  const famousPanel = document.querySelector("#sidebar-famous");
  const buzzPanel = document.querySelector("#sidebar-buzz");
  const popularPanel = document.querySelector("#sidebar-popular");
  const commercialPanel = document.querySelector("#sidebar-commercial");
  const adsPanel = document.querySelector("#sidebar-ads");

  if (!nowPanel) {
    return;
  }

  const nextHolidayText = getNextHolidayText([
    sidebarData.holidays.national,
    sidebarData.holidays.local
  ]);
  const weatherIcon = getSidebarWeatherIcon(sidebarData.weather.current.condition);

  nowPanel.innerHTML = `
    <div class="rail-intro">
      <p class="rail-kicker">painel lateral</p>
      <h3>Painel Local</h3>
      <p>Relógio, clima, feriados, agenda, movimento da rede e oportunidades para marcas locais.</p>
    </div>
    <div class="sidebar-heading">
      <div>
        <p class="widget-title">Cruzeiro do Sul Agora</p>
        <span class="widget-source">${buildSidebarSnapshotLabel()}</span>
      </div>
      <a class="widget-link" href="${sidebarData.weather.sourceUrl}" target="_blank" rel="noreferrer">clima real</a>
    </div>
    <div class="sidebar-now-grid">
      <div>
        <div class="clock-time" id="live-clock">00:00:00</div>
        <div class="clock-date" id="live-date">hora local do Acre</div>
        <div class="clock-weekday" id="live-weekday">Acre • UTC-5</div>
      </div>
      <div class="sidebar-weather-badge">
        <span class="weather-icon">${weatherIcon}</span>
        <div>
          <strong class="weather-temp" id="weather-temp">${sidebarData.weather.current.temperature}</strong>
          <p class="weather-summary">${sidebarData.weather.current.condition}</p>
        </div>
      </div>
    </div>
    <div class="weather-details">
      ${sidebarData.weather.current.details
        .map((detail) => `<span>${detail}</span>`)
        .join("")}
    </div>
    <p class="widget-note">${buildSidebarWeatherNote(sidebarData.weather)}</p>
    <p class="widget-note">${nextHolidayText}</p>
    <label class="sidebar-search-inline">
      <span>Buscar no portal</span>
      <input type="text" id="sidebar-search" placeholder="cheia, escola, policia, cultura..." />
    </label>
  `;

  if (holidaysPanel) {
    holidaysPanel.innerHTML = `
    <div class="sidebar-heading">
      <div>
        <p class="widget-title">Próximos feriados</p>
        <span class="widget-source">nacional + Acre + municipio</span>
      </div>
      <a class="widget-link" href="${sidebarData.holidays.sourceUrl}" target="_blank" rel="noreferrer">fonte oficial</a>
    </div>
    <div class="holiday-columns">
      <section>
        <p class="widget-kicker">nacionais</p>
        <div class="holiday-list">
          ${buildHolidayMarkup(sidebarData.holidays.national)}
        </div>
      </section>
      <section>
        <p class="widget-kicker">locais e regionais</p>
        <div class="holiday-list">
          ${buildHolidayMarkup(sidebarData.holidays.local)}
        </div>
      </section>
    </div>
  `;
  }

  if (nationalPanel) {
    nationalPanel.innerHTML = buildListPanelMarkup({
      title: "Nacional do Dia",
      source: "serviço, consumo e custo de vida",
      items: sidebarData.national,
      actionLabel: "economia",
      actionUrl: "https://agenciabrasil.ebc.com.br/economia"
    });
  }

  if (politicsPanel) {
    politicsPanel.innerHTML = buildListPanelMarkup({
      title: "Politica",
      source: "Brasilia, eleicoes e mudancas de equipe",
      items: sidebarData.politics,
      actionLabel: "politica",
      actionUrl: "https://agenciabrasil.ebc.com.br/politica"
    });
  }

  if (marketPanel) {
    marketPanel.innerHTML = buildMarketMarkup({
      ...sidebarData.market,
      snapshotLabel: buildSidebarSnapshotLabel()
    });
    void fetchTopicFeedCached("economy", 6, options).then((items) => {
      marketPanel.innerHTML = buildMarketMarkup(buildDynamicMarketPayload(items, sidebarData.market));
    });
  }

  if (agendaPanel) {
    agendaPanel.innerHTML = buildListPanelMarkup({
      title: "Agenda & Servico",
      source: "acoes uteis com data certa",
      items: sidebarData.agenda
    });
  }

  if (worldPanel) {
    worldPanel.innerHTML = buildListPanelMarkup({
      title: "Internacional",
      source: "mundo, energia, juros e ciencia",
      items: sidebarData.world,
      actionLabel: "mundo",
      actionUrl: "https://agenciabrasil.ebc.com.br/internacional"
    });
  }

  if (varietiesPanel) {
    varietiesPanel.innerHTML = buildListPanelMarkup({
      title: "Variedades",
      source: "cinema, museu, cultura e conversa",
      items: sidebarData.varieties,
      actionLabel: "cultura",
      actionUrl: "https://agenciabrasil.ebc.com.br/cultura"
    });
  }

  if (famousPanel) {
    famousPanel.innerHTML = buildListPanelMarkup({
      title: "Famosos",
      source: "pop, relacionamento e conversa pública",
      items: sidebarData.famous,
      actionLabel: "gshow",
      actionUrl: "https://gshow.globo.com/cultura-pop/famosos/"
    });
  }

  if (buzzPanel) {
    buzzPanel.innerHTML = `
    <div class="sidebar-heading">
      <div>
        <p class="widget-title">Rede, Festas & Fofoca</p>
        <span class="widget-source">o que circula na conversa local</span>
      </div>
      <span class="widget-link passive-link">com foto quando houver</span>
    </div>
    <div class="sidebar-photo-list">
      ${buildStoryMarkup(sidebarData.buzz, "buzz")}
    </div>
  `;
    void fetchTopicFeedCached("buzz", 8, options).then((items) => {
      const liveBuzzItems = buildBuzzSidebarItemsFromArticles(items);
      if (!liveBuzzItems.length) {
        return;
      }

      buzzPanel.innerHTML = `
        <div class="sidebar-heading">
          <div>
            <p class="widget-title">Rede, Festas & Fofoca</p>
            <span class="widget-source">atualizações recentes</span>
          </div>
          <span class="widget-link passive-link">ver destaques</span>
        </div>
        <div class="sidebar-photo-list">
          ${buildStoryMarkup(liveBuzzItems, "buzz")}
        </div>
      `;
    });
  }

  if (popularPanel) {
    popularPanel.innerHTML = `
    <div class="sidebar-heading">
      <div>
        <p class="widget-title">Mais vistos do Catálogo</p>
        <span class="widget-source">destaques recentes</span>
      </div>
      <span class="widget-link passive-link">atalhos rápidos</span>
    </div>
    <div class="sidebar-photo-list compact">
      ${buildStoryMarkup(sidebarData.popular, "popular")}
    </div>
  `;
  }

  if (commercialPanel) {
    commercialPanel.innerHTML = `
    <p class="card-kicker">publicidade local</p>
    <h3>Sua marca em destaque na cobertura local</h3>
    <p>
      Divulgue eventos, cursos, clínicas, lojas, campanhas e serviços em um espaço
      visível, com chamada forte e presença constante ao lado das notícias.
    </p>
    <div class="side-pill-row">
      <span class="rail-pill">300 x 600</span>
      <span class="rail-pill">post patrocinado</span>
      <span class="rail-pill">agenda local</span>
    </div>
    <a class="solid-button" href="#monetizacao">Reservar a lateral</a>
  `;
  }

  if (adsPanel) {
    adsPanel.innerHTML = `
    <p class="card-kicker">anúncios e divulgação</p>
    <h3>Espaços prontos para vender</h3>
    <div class="sidebar-ad-grid">
      <a class="ad-slot tall" href="#monetizacao">
        <span>300 x 600</span>
        <strong>Anúncio vertical premium</strong>
        <small>campanha fixa ao lado da leitura</small>
      </a>
      <a class="ad-slot" href="#monetizacao">
        <span>agenda patrocinada</span>
        <strong>Evento com data, local e chamada</strong>
        <small>festa, show, encontro ou promoção</small>
      </a>
      <a class="ad-slot" href="#monetizacao">
        <span>vitrine local</span>
        <strong>Guia rápido de marcas e serviços</strong>
        <small>entrada enxuta com selo parceiro</small>
      </a>
    </div>
  `;
  }

  bindSidebarClock();
};

const initializeSidebarWidgets = () => {
  renderSidebarWidgets();
  document
    .querySelectorAll(".side-rail .reveal")
    .forEach((node) => node.classList.add("active"));

  const sidebarSearch = document.querySelector("#sidebar-search");

  if (sidebarSearch) {
    sidebarSearch.addEventListener("input", (event) => {
      const query = event.target.value;

      if (typeof liveFeedQuery !== "undefined" && liveFeedQuery) {
        liveFeedQuery.value = query;
        liveFeedQuery.dispatchEvent(new Event("input"));
      }

      if (typeof renderRadar === "function") {
        renderRadar("todos");
      }
    });
  }

  registerInteractivePanels(document.querySelector(".side-rail"));
};

initializeSidebarWidgets();

const hydrateDynamicNews = async () => {
  try {
    const payload = await requestApiJson("/api/news", { method: "GET" });
    const runtimeItems = Array.isArray(payload.items) ? payload.items : [];

    if (runtimeItems.length === 0) {
      return;
    }

    const merged = syncNewsDataset(runtimeItems);
    const activeFilter =
      document.querySelector("#radar .chip-button.is-active[data-filter]")?.dataset.filter ||
      "todos";
    hydrateMosaicHero(merged);
    renderWhatMattersNow(merged);
    await hydrateStaticMediaSurfaces();
    initializeHeroTourismHero();
    await Promise.all([
      renderDailyTrendingBuzz({ forceRefresh: true }),
      renderDynamicMonthlyBuzz(),
      renderCommunityTrendCard()
    ]);
    renderRegionalPoliticsHighlights(merged);
    await renderGlobalPoliticsHighlights({ forceRefresh: true });
    renderSidebarWidgets();
    renderRadar(activeFilter);
    updateLiveFeedItems(merged, { resetFilter: false });
    initializeLiveTicker();
  } catch (error) {
    // Mantem o fallback estatico quando a API nao estiver ligada.
  }
};

const hydrateCommentsFromApi = async () => {
  try {
    const payload = await requestApiJson("/api/comments?limit=8", { method: "GET" });
    const comments = Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.comments)
        ? payload.comments
        : [];

    if (comments.length > 0) {
      renderCommentsFeed(comments.slice(0, 8));
    }
  } catch (error) {
    // Mantém os comentários estáticos quando a API não estiver ligada.
  }
};

const scheduleHomeBackgroundHydration = () => {
  const run = () => {
    const execute = () => {
      hydrateDynamicNews();
      hydrateCommentsFromApi();
      window.setInterval(hydrateDynamicNews, 300000);
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(execute, { timeout: 1800 });
      return;
    }

    window.setTimeout(execute, 300);
  };

  if (document.readyState === "complete") {
    run();
    return;
  }

  window.addEventListener("load", run, { once: true });
};

const attachCommentSubmission = () => {
  if (!publishCommentButton || !opinionInput || !commentsFeed || !charCount) {
    return;
  }

  publishCommentButton.addEventListener("click", async () => {
    const name = commentAuthorInput?.value?.trim() || "";
    const message = opinionInput.value.trim();

    if (name.length < 2) {
      setFeedbackState(commentFeedback, "Escreva um nome ou apelido com pelo menos 2 letras.", "is-error");
      commentAuthorInput?.focus();
      return;
    }

    if (!message) {
      setFeedbackState(commentFeedback, "Escreva sua opiniao antes de enviar.", "is-error");
      opinionInput.focus();
      return;
    }

    publishCommentButton.disabled = true;
    setFeedbackState(commentFeedback, "Enviando comentário...", "");

    try {
      const analyticsContext = getAnalyticsContext();
      const payload = await requestApiJson("/api/comments", {
        method: "POST",
        body: JSON.stringify({
          articleId: "home-comunidade",
          pagePath: `${window.location.pathname || "/"}${window.location.search || ""}`,
          author: name,
          name,
          message,
          badge: "Leitor local",
          visitorId: analyticsContext.visitorId || "",
          sessionId: analyticsContext.sessionId || "",
          cookieVisitorId: analyticsContext.cookieVisitorId || "",
          cookieSessionId: analyticsContext.cookieSessionId || "",
          trackingConsent: analyticsContext.consent || ""
        })
      });

      if (payload.comment) {
        await hydrateCommentsFromApi();
      }

      opinionInput.value = "";
      if (commentAuthorInput) {
        commentAuthorInput.value = "";
      }
      charCount.textContent = "0 / 180";
      setFeedbackState(commentFeedback, "Comentario enviado para a comunidade.", "is-success");
    } catch (error) {
      commentsFeed.prepend(
        buildCommentCard({
          name,
          badge: "Somente local",
          message
        })
      );
      opinionInput.value = "";
      if (commentAuthorInput) {
        commentAuthorInput.value = "";
      }
      charCount.textContent = "0 / 180";
      setFeedbackState(
        commentFeedback,
        "Servidor sem conexão. Seu comentário apareceu só nesta tela por enquanto.",
        "is-error"
      );
    } finally {
      publishCommentButton.disabled = false;
    }
  });
};

const attachCommunitySignalFlow = () => {
  loadCommunityReports();
  communityAgentForm?.addEventListener("submit", submitCommunityReport);
};

const isFounderPlan = (value = "") => String(value || "").trim() === "fundadores";

const buildSupporterTxid = () =>
  `FUND${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 25);

const formatPixAmountLabel = (value = 0) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2
  });

const getFounderAmountValue = () => {
  const rawAmount = Number(subscriptionFounderAmountInput?.value || 5);
  return Math.max(1, Math.min(10, Number.isFinite(rawAmount) ? rawAmount : 5));
};

const getCatalogoGoogleAuthUser = () => {
  try {
    return window.CatalogoGoogleAuth?.getUser?.() || null;
  } catch (_error) {
    return null;
  }
};

const syncSubscriptionGoogleIdentity = () => {
  const user = getCatalogoGoogleAuthUser();
  if (subscriptionEmailInput) {
    subscriptionEmailInput.value = user?.email || "";
    subscriptionEmailInput.readOnly = true;
    subscriptionEmailInput.placeholder = user?.email || "Entre com Google para preencher o e-mail";
  }
  if (subscriptionNameInput && user && !subscriptionNameInput.value.trim()) {
    subscriptionNameInput.value = user.name || user.givenName || "";
  }
};

const resetSupporterPaymentCard = () => {
  if (!subscriptionPaymentCard) {
    return;
  }

  supporterPaymentState.locked = false;
  subscriptionPaymentCard.hidden = true;
  if (subscriptionPixKey) subscriptionPixKey.textContent = "oculta no QR";
  if (subscriptionPixAmount) subscriptionPixAmount.textContent = formatPixAmountLabel(getFounderAmountValue());
  if (subscriptionPixTxid) subscriptionPixTxid.textContent = "aguarde";
  if (subscriptionPixQr) subscriptionPixQr.innerHTML = "";
  if (subscriptionPixCode) subscriptionPixCode.value = "";
  if (subscriptionPaymentNote) {
    subscriptionPaymentNote.textContent = "O apoio só entra no mural depois da confirmação manual do pagamento.";
  }
};

const syncSupporterPaymentCard = async (forceNewTxid = false) => {
  if (!subscriptionPlanInput || !subscriptionPaymentCard) {
    return;
  }

  if (!isFounderPlan(subscriptionPlanInput.value)) {
    resetSupporterPaymentCard();
    return;
  }

  if (supporterPaymentState.locked && forceNewTxid) {
    if (subscriptionPaymentNote) {
      subscriptionPaymentNote.textContent =
        "Esta referência já foi vinculada ao apoio enviado. Use este mesmo código Pix ou recarregue a página para começar outro apoio.";
    }
    return;
  }

  const founderAmount = getFounderAmountValue();
  supporterPaymentState.amount = founderAmount;

  const authUser = getCatalogoGoogleAuthUser();
  if (!authUser?.email) {
    subscriptionPaymentCard.hidden = false;
    if (subscriptionPixKey) subscriptionPixKey.textContent = "oculta no QR";
    if (subscriptionPixTxid) subscriptionPixTxid.textContent = "aguarde login";
    if (subscriptionPixQr) {
      subscriptionPixQr.innerHTML = "<p>Entre com Google para gerar o QR code protegido.</p>";
    }
    if (subscriptionPaymentNote) {
      subscriptionPaymentNote.textContent =
        "O QR code de fundador só é criado depois que a conta Google identifica o apoiador.";
    }
    return;
  }

  if (forceNewTxid || !supporterPaymentState.txid) {
    supporterPaymentState.txid = buildSupporterTxid();
  }

  subscriptionPaymentCard.hidden = false;
  if (subscriptionPixAmount) {
    subscriptionPixAmount.textContent = formatPixAmountLabel(founderAmount);
  }
  if (subscriptionPixQr) {
    subscriptionPixQr.innerHTML = "<p>Gerando QR code do apoio...</p>";
  }

  try {
    const params = new URLSearchParams({
      amount: String(founderAmount),
      txid: supporterPaymentState.txid,
      description: "Apoio Fundador Catálogo"
    });
    const payload = await requestApiJson(`/api/subscriptions/pix?${params.toString()}`, { method: "GET" });
    const resolvedAmount = Number(payload.amount || founderAmount);

    supporterPaymentState.txid = payload.txid || supporterPaymentState.txid;
    supporterPaymentState.amount = resolvedAmount;
    if (subscriptionFounderAmountInput) {
      subscriptionFounderAmountInput.value = String(Math.round(resolvedAmount));
    }
    if (subscriptionPixKey) subscriptionPixKey.textContent = "oculta no QR";
    if (subscriptionPixAmount) subscriptionPixAmount.textContent = formatPixAmountLabel(resolvedAmount);
    if (subscriptionPixTxid) subscriptionPixTxid.textContent = supporterPaymentState.txid;
    if (subscriptionPixQr) {
      subscriptionPixQr.innerHTML =
        payload.qrSvg || "<p>QR code indisponível no momento. Tente atualizar a referência.</p>";
    }
    if (subscriptionPixCode) {
      subscriptionPixCode.value = "";
    }
    if (subscriptionPaymentNote) {
      subscriptionPaymentNote.textContent =
        `QR Code criado para ${authUser.email}. Apoio de ${formatPixAmountLabel(resolvedAmount)} aguardando confirmação manual antes de entrar no mural.`;
    }
  } catch (error) {
    if (subscriptionPixQr) {
      subscriptionPixQr.innerHTML = "<p>Não foi possível gerar o QR code agora.</p>";
    }
    if (subscriptionPaymentNote) {
      subscriptionPaymentNote.textContent = String(error?.message || "Falha ao gerar o pagamento.");
    }
  }
};

const activateFounderPlan = ({ focusAmount = false } = {}) => {
  if (!subscriptionPlanInput) {
    return;
  }

  subscriptionPlanInput.value = "fundadores";
  toggleFounderAmountField();
  void syncSupporterPaymentCard(true);

  if (focusAmount && subscriptionFounderAmountInput) {
    window.setTimeout(() => {
      subscriptionFounderAmountInput.focus();
      subscriptionFounderAmountInput.select?.();
    }, 120);
  }
};

const toggleFounderAmountField = () => {
  if (!subscriptionFounderWrap || !subscriptionPlanInput) {
    return;
  }

  const founderActive = isFounderPlan(subscriptionPlanInput.value);
  subscriptionFounderWrap.hidden = !founderActive;

  if (subscriptionFounderAmountInput) {
    subscriptionFounderAmountInput.disabled = !founderActive;
  }

  if (subscriptionSubmitButton) {
    subscriptionSubmitButton.textContent = founderActive
      ? "Quero virar fundador"
      : "Receber com Google";
  }

  if (!founderActive) {
    resetSupporterPaymentCard();
    supporterPaymentState.txid = "";
  }
};

const buildFounderCard = (founder = {}) => {
  const card = document.createElement("article");
  const amount = Number(founder.amount || 0);
  const safeName = String(founder.name || "Fundador do Catálogo").trim() || "Fundador do Catálogo";
  const joinedAt = founder.createdAt
    ? new Date(founder.createdAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: localeTimeZone
      })
    : "agora";

  card.className = "founder-card";
  card.innerHTML = `
    <strong>? ${escapeHtml(safeName)}</strong>
    <p>Fundador do Catálogo CZS com apoio simbólico${amount ? ` de R$ ${amount}` : ""}.</p>
    <span>entrou em ${escapeHtml(joinedAt)}</span>
  `;
  return card;
};

const renderFoundersWall = (items = [], totalFounders = items.length) => {
  if (!foundersList || !foundersCount) {
    return;
  }

  const founders = (Array.isArray(items) ? items : []).filter((item) => item?.name);
  const confirmedFounders = Math.max(4, Number(totalFounders || founders.length || 4));
  foundersCount.textContent = `${confirmedFounders} ${confirmedFounders === 1 ? "fundador confirmado" : "fundadores confirmados"}`;

  if (!founders.length) {
    foundersList.innerHTML = `
      <article class="founder-card is-empty">
        <strong>Quem fortalece este jornal</strong>
        <p>Marcas, profissionais e leitores que apoiam o portal aparecem neste espaço com destaque público.</p>
      </article>
    `;
    return;
  }

  foundersList.innerHTML = "";
  founders.slice(0, 18).forEach((founder) => {
    foundersList.appendChild(buildFounderCard(founder));
  });
};

const hydrateFoundersWallFromApi = async () => {
  try {
    const payload = await requestApiJson("/api/subscriptions", { method: "GET" });
    renderFoundersWall(payload.founders || [], Number(payload?.totals?.founders || 0));
  } catch (_error) {
    // Mantem o mural estatico quando a API nao estiver ligada.
  }
};

const attachSubscriptionSubmission = () => {
  if (!subscriptionForm || !subscriptionEmailInput || !subscriptionPlanInput) {
    return;
  }

  toggleFounderAmountField();
  syncSubscriptionGoogleIdentity();
  window.addEventListener("catalogo:google-auth", () => {
    syncSubscriptionGoogleIdentity();
    if (isFounderPlan(subscriptionPlanInput.value)) {
      void syncSupporterPaymentCard(true);
    }
  });

  if (isFounderPlan(subscriptionPlanInput.value)) {
    void syncSupporterPaymentCard(true);
  }

  document.querySelectorAll("[data-founder-cta]").forEach((cta) => {
    cta.addEventListener("click", () => {
      activateFounderPlan({ focusAmount: true });
      window.setTimeout(() => {
        subscriptionPaymentCard?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 180);
    });
  });

  subscriptionPlanInput.addEventListener("change", () => {
    toggleFounderAmountField();
    if (isFounderPlan(subscriptionPlanInput.value)) {
      void syncSupporterPaymentCard(true);
    }
  });

  subscriptionFounderAmountInput?.addEventListener("input", () => {
    if (!isFounderPlan(subscriptionPlanInput.value)) {
      return;
    }

    if (supporterPaymentState.locked) {
      if (subscriptionPaymentNote) {
        subscriptionPaymentNote.textContent =
          "O apoio já foi enviado com a referência atual. Recarregue a página se quiser começar outro pagamento.";
      }
      subscriptionFounderAmountInput.value = String(supporterPaymentState.amount || 5);
      return;
    }

    void syncSupporterPaymentCard(true);
  });

  subscriptionCopyPixButton?.addEventListener("click", async () => {
    const copied = await copyTextToClipboard(subscriptionPixCode?.value || "");
    if (subscriptionPaymentNote) {
      subscriptionPaymentNote.textContent = copied
        ? "Código Pix copiado para o apoio de fundador."
        : "Não consegui copiar o código Pix agora.";
    }
  });

    subscriptionRefreshPixButton?.addEventListener("click", () => {
    if (!isFounderPlan(subscriptionPlanInput.value)) {
      return;
    }

    if (supporterPaymentState.locked) {
      if (subscriptionPaymentNote) {
        subscriptionPaymentNote.textContent =
          "A referência já está presa ao apoio enviado. Use este código Pix para concluir o pagamento.";
      }
      return;
    }

    void syncSupporterPaymentCard(true);
  });

  subscriptionForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const authUser = getCatalogoGoogleAuthUser();
    const email = authUser?.email || "";
    const name = subscriptionNameInput?.value?.trim() || authUser?.name || authUser?.givenName || "";
    const plan = subscriptionPlanInput.value;
    const founderAmount = getFounderAmountValue();

    if (!authUser?.email) {
      setFeedbackState(
        subscriptionFeedback,
        "Entre com Google para assinar, apoiar ou gerar QR Code Pix.",
        "is-error"
      );
      document.querySelector("[data-google-auth-card]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (isFounderPlan(plan) && name.length < 2) {
      setFeedbackState(subscriptionFeedback, "Para entrar nos fundadores, informe um nome publico.", "is-error");
      subscriptionNameInput?.focus();
      return;
    }

    if (isFounderPlan(plan) && (founderAmount < 1 || founderAmount > 10)) {
      setFeedbackState(subscriptionFeedback, "O apoio de fundador precisa ficar entre R$ 1 e R$ 10.", "is-error");
      subscriptionFounderAmountInput?.focus();
      return;
    }

    if (isFounderPlan(plan) && !supporterPaymentState.txid) {
      await syncSupporterPaymentCard(true);
    }

    setFeedbackState(
      subscriptionFeedback,
      isFounderPlan(plan) ? "Registrando apoio e vinculando a referência do Pix..." : "Registrando assinatura...",
      ""
    );

    try {
      const payload = await requestApiJson("/api/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          email,
          name,
          plan,
          amount: isFounderPlan(plan) ? founderAmount : 0,
          paymentTxid: isFounderPlan(plan) ? supporterPaymentState.txid : ""
        })
      });

      if (isFounderPlan(plan)) {
        supporterPaymentState.locked = true;
        setFeedbackState(
          subscriptionFeedback,
          `Apoio de fundador registrado com referência ${supporterPaymentState.txid}. Agora conclua o Pix de R$ ${founderAmount} no quadro acima. O nome entra no mural após confirmação manual.`,
          "is-success"
        );
        if (subscriptionPaymentNote) {
          subscriptionPaymentNote.textContent =
            payload?.message ||
            "Apoio registrado e aguardando confirmação manual do Pix antes de entrar no mural.";
        }
      } else {
        subscriptionForm.reset();
        syncSubscriptionGoogleIdentity();
        toggleFounderAmountField();
        setFeedbackState(
          subscriptionFeedback,
          "Resumo das 7h registrado na sua conta Google. A partir de agora ele cai no seu e-mail.",
          "is-success"
        );
      }
    } catch (error) {
      setFeedbackState(
        subscriptionFeedback,
        String(error?.message || "Nao consegui falar com o backend agora. Ligue o servidor para receber assinaturas reais."),
        "is-error"
      );
    }
  });
};

attachCommentSubmission();
attachCommunitySignalFlow();
attachSubscriptionSubmission();
attachAgentMailFlow();
renderDailyTrendingBuzz();
renderWhatMattersNow(window.NEWS_DATA || []);
renderDynamicMonthlyBuzz();
renderCommunityTrendCard();
scheduleTopicSurfaceRefresh();
initializeLiveTicker();
scheduleHomeBackgroundHydration();
hydrateFoundersWallFromApi();
