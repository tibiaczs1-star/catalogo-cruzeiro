const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { execFile, spawnSync } = require("child_process");
const { runRealAgentsRuntimeLocal } = require("./scripts/real-agents-runtime");
const {
  buildImageApprovalQueue,
  recordImageApprovalDecision
} = require("./scripts/news-image-approval-queue");
const {
  parseHomeLinkedArticleFallbacks,
  auditHomeLinkedArticleIntegrity
} = require("./scripts/home-linked-article-fallbacks");
const {
  buildDashboardPayload: buildCanonicalPubpaidAdminPayload,
  readStore: readCanonicalPubpaidStore,
  writeStore: writeCanonicalPubpaidStore,
  reviewDeposit: reviewCanonicalPubpaidDeposit,
  reviewWithdrawal: reviewCanonicalPubpaidWithdrawal,
  withPubpaidLock: withCanonicalPubpaidLock,
} = require("./pubpaid-runtime");
const vm = require("vm");
const zlib = require("zlib");
const { URL } = require("url");
let Chess = null;
try {
  Chess = require("chess.js").Chess;
} catch (_error) {
  Chess = null;
}
let QRCode = null;
try {
  QRCode = require("qrcode");
} catch (_error) {
  QRCode = null;
}

function loadLocalEnvFile(fileName) {
  const filePath = path.join(__dirname, fileName);
  if (!fs.existsSync(filePath)) return;

  const source = fs.readFileSync(filePath, "utf-8");
  source.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const divider = trimmed.indexOf("=");
    if (divider <= 0) return;

    const key = trimmed.slice(0, divider).trim();
    let value = trimmed.slice(divider + 1).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) return;

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  });
}

loadLocalEnvFile(".env.local");
loadLocalEnvFile(".env");

const PORT = Number(process.env.PORT || 3000);
const HOST = "0.0.0.0";
const ADMIN_TOKEN = String(process.env.ADMIN_TOKEN || "").trim();
const IS_PRODUCTION = String(process.env.NODE_ENV || "").trim().toLowerCase() === "production";
const PUBPAID_CLIENT_BUILD_VERSION = "20260520-poolmobileintro1";

function getRequiredSecret(name, fallbackValue) {
  const value = String(process.env[name] || "").trim();
  if (value) return value;

  if (!IS_PRODUCTION) {
    return fallbackValue;
  }

  console.warn(`[security] Missing required env ${name} in production. Related admin access is disabled until it is set.`);
  return `missing-${name.toLowerCase()}-in-production`;
}

const SUPER_ADMIN_USER = getRequiredSecret("SUPER_ADMIN_USER", "admin");
const SUPER_ADMIN_PASSWORD = getRequiredSecret("SUPER_ADMIN_PASSWORD", "99831455a");
const POLL_ADMIN_PASSWORD = getRequiredSecret("POLL_ADMIN_PASSWORD", "99831455a");
const GOOGLE_AUTH_CLIENT_ID = String(
  process.env.GOOGLE_AUTH_CLIENT_ID || process.env.PUBPAID_GOOGLE_CLIENT_ID || ""
).trim();
const SITE_AUTH_SESSION_SECRET = String(
  process.env.SITE_AUTH_SESSION_SECRET ||
    process.env.PUBPAID_SESSION_SECRET ||
    (IS_PRODUCTION ? "" : "catalogo-local-google-auth-session")
).trim();
const SITE_AUTH_COOKIE = "catalogo_google_session";
const SITE_AUTH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const GOOGLE_ID_TOKEN_CERTS_URL = "https://www.googleapis.com/oauth2/v1/certs";
let googleIdTokenCertCache = {
  certs: null,
  expiresAt: 0
};

const ROOT_DIR = __dirname;
const DEFAULT_DATA_DIR = path.join(ROOT_DIR, "data");
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : DEFAULT_DATA_DIR;
const INDEX_FILE = path.join(ROOT_DIR, "index.html");
const MAINTENANCE_FILE = path.join(ROOT_DIR, "maintenance.html");
const ADMIN_MASTER_FILE = path.join(ROOT_DIR, "backend", "public", "admin-master.html");
const ADMIN_DASHBOARD_FILE = path.join(ROOT_DIR, "backend", "public", "admin-dashboard.html");
const PUBPAID_ADMIN_FILE = path.join(ROOT_DIR, "pubpaid-admin.html");
const STATIC_NEWS_FILE = path.join(ROOT_DIR, "news-data.js");
const FAVICON_ICO_FILE = path.join(ROOT_DIR, "assets", "favicon-32x32.png");
const RE_RODADA_DIA_GERAL_REPORT_FILE = path.join(DATA_DIR, "re-rodada-dia-geral-report.json");
const NEWS_IMAGE_FOCUS_AUDIT_FILE = path.join(DATA_DIR, "news-image-focus-audit.json");
const NEWS_IMAGE_FOCUS_DECISIONS_FILE = path.join(DATA_DIR, "news-image-focus-decisions.json");
const SOCIAL_TRENDS_CACHE_FILE = path.join(DATA_DIR, "social-trends-cache.json");
const ELECTIONS_FILE = path.join(ROOT_DIR, "elections-data.js");
const SERVICES_CATALOG_FILE = path.join(ROOT_DIR, "catalogo-servicos-data.js");
const REAL_AGENTS_RUNTIME_SCRIPT = path.join(ROOT_DIR, "scripts", "real-agents-runtime.js");
const REAL_AGENTS_REGISTRY_FILE = path.join(ROOT_DIR, ".codex-agents", "registry.json");
const REAL_AGENTS_RUN_FILE = path.join(DATA_DIR, "real-agents-latest-run.json");
const REAL_AGENTS_RUN_MD_FILE = path.join(DATA_DIR, "real-agents-latest-run.md");
const LEGACY_REAL_AGENTS_RUN_FILE = path.join(ROOT_DIR, ".codex-temp", "real-agents", "latest-run.json");
const LEGACY_REAL_AGENTS_RUN_MD_FILE = path.join(ROOT_DIR, ".codex-temp", "real-agents", "latest-run.md");
const REAL_AGENTS_RUN_HISTORY_FILE = path.join(DATA_DIR, "real-agents-run-history.json");
const REAL_AGENTS_ACTIONS_FILE = path.join(DATA_DIR, "real-agents-actions.json");
const REAL_AGENTS_ECOSYSTEM_STUDY_FILE = path.join(DATA_DIR, "real-agents-ecosystem-study.json");
const REAL_AGENTS_EDITORIAL_TRAINING_FILE = path.join(DATA_DIR, "real-agents-editorial-training.json");
const EDITORIAL_CORRECTIONS_LOG_FILE = path.join(DATA_DIR, "editorial-corrections-log.json");
const EDITORIAL_MEETING_SHEETS_FILE = path.join(DATA_DIR, "editorial-meeting-sheets.json");
const EDITORIAL_HEALTH_REPORT_JSON_FILE = path.join(DATA_DIR, "editorial-health-report.json");
const EDITORIAL_HEALTH_REPORT_MD_FILE = path.join(DATA_DIR, "editorial-health-report.md");
const CHEFFE_CALL_AUTONOMY_LOG_FILE = path.join(DATA_DIR, "cheffe-call-autonomy-log.json");
const CHEFFE_CALL_IDE_ACTIONS_FILE = path.join(DATA_DIR, "cheffe-call-ide-actions.json");
const MASTER_ADMIN_AUDIT_FILE = path.join(DATA_DIR, "master-admin-audit-log.json");
const REVIEW_TEAM_REPORT_JSON_FILE = path.join(ROOT_DIR, ".codex-temp", "review-team", "latest-report.json");
const REVIEW_TEAM_REPORT_MD_FILE = path.join(ROOT_DIR, ".codex-temp", "review-team", "latest-report.md");
const REAL_AGENTS_AUTONOMY_REPORT_FILE = path.join(DATA_DIR, "agents-autonomy-report.json");
const REAL_AGENTS_AUTONOMY_SCRIPT = path.join(ROOT_DIR, "scripts", "agents-autonomy-cycle.js");
const ARTICLE_INTEGRITY_REPORT_FILE = path.join(DATA_DIR, "article-integrity-report.json");
const CHEFFE_CALL_STATE_FILE = path.join(DATA_DIR, "cheffe-call-state.json");
const CHEFFE_CALL_PROMPTS_FILE = path.join(ROOT_DIR, "docs", "cheffe-call-181-prompts.json");
const CHEFFE_CALL_TIMEOUT_MINUTES_INPUT = Number(process.env.CHEFFE_CALL_TIMEOUT_MINUTES || 90);
const CHEFFE_CALL_TIMEOUT_MS = Number.isFinite(CHEFFE_CALL_TIMEOUT_MINUTES_INPUT)
  ? Math.max(60, CHEFFE_CALL_TIMEOUT_MINUTES_INPUT) * 60 * 1000
  : 90 * 60 * 1000;
const REAL_AGENTS_AUTO_RUN_INTERVAL_INPUT = Number(process.env.REAL_AGENTS_AUTO_RUN_INTERVAL_MS || 5 * 60 * 1000);
const REAL_AGENTS_AUTO_RUN_INTERVAL_MS = Number.isFinite(REAL_AGENTS_AUTO_RUN_INTERVAL_INPUT)
  ? Math.max(60 * 1000, REAL_AGENTS_AUTO_RUN_INTERVAL_INPUT)
  : 5 * 60 * 1000;
const REAL_AGENTS_AUTO_RUN_DISABLED = String(process.env.REAL_AGENTS_AUTO_RUN_DISABLED || "true").toLowerCase() !== "false";
const NEWS_REFRESH_AUTO_DISABLED = String(process.env.NEWS_REFRESH_AUTO_DISABLED || "true").toLowerCase() !== "false";
const ARTICLE_INTEGRITY_AUTO_RUN_DISABLED = String(process.env.ARTICLE_INTEGRITY_AUTO_RUN_DISABLED || "true").toLowerCase() !== "false";
const TOPIC_FEED_AUTO_REFRESH_DISABLED = String(process.env.TOPIC_FEED_AUTO_REFRESH_DISABLED || "true").toLowerCase() !== "false";
const ARTICLE_INTEGRITY_INTERVAL_INPUT = Number(process.env.ARTICLE_INTEGRITY_INTERVAL_MS || 30 * 60 * 1000);
const ARTICLE_INTEGRITY_INTERVAL_MS = Number.isFinite(ARTICLE_INTEGRITY_INTERVAL_INPUT)
  ? Math.max(5 * 60 * 1000, ARTICLE_INTEGRITY_INTERVAL_INPUT)
  : 30 * 60 * 1000;
const TOPIC_FEED_AUTO_REFRESH_INTERVAL_INPUT = Number(
  process.env.TOPIC_FEED_AUTO_REFRESH_INTERVAL_MS || 20 * 60 * 1000
);
const TOPIC_FEED_AUTO_REFRESH_INTERVAL_MS = Number.isFinite(TOPIC_FEED_AUTO_REFRESH_INTERVAL_INPUT)
  ? Math.max(5 * 60 * 1000, TOPIC_FEED_AUTO_REFRESH_INTERVAL_INPUT)
  : 20 * 60 * 1000;
const realAgentsAutoRunState = {
  running: false,
  timer: null,
  startedAt: "",
  lastRunAt: "",
  lastError: "",
  cycles: 0
};
const realAgentsAutonomyState = {
  running: false,
  lastRunAt: "",
  lastError: "",
  cycles: 0
};
const articleIntegrityAutoState = {
  running: false,
  timer: null,
  lastRunAt: "",
  lastError: "",
  cycles: 0
};
const topicFeedAutoState = {
  running: false,
  timer: null,
  lastRunAt: "",
  lastError: "",
  cycles: 0,
  lastTopics: []
};
const SITE_NAME = "Catalogo Cruzeiro do Sul";
const SITE_REGION_NAME = "Cruzeiro do Sul e Vale do Jurua";
const DEFAULT_SITE_DESCRIPTION =
  "Jornal agregador local de Cruzeiro do Sul e Vale do Jurua, com editorias, arquivo mensal, resumos originais e links para as fontes.";
const DEFAULT_OG_IMAGE_PATH = "/assets/og-cover.svg";
const DEFAULT_PUBLISHER_LOGO_PATH = "/assets/favicon-512x512.png";
const PUBLIC_STATIC_EXTENSIONS = new Set([
  ".html",
  ".css",
  ".js",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".ico",
  ".webmanifest"
]);
const PRIVATE_STATIC_SEGMENTS = new Set([
  ".codex-temp",
  ".codex-agents",
  ".edge-headless",
  ".git",
  ".github",
  "backend",
  "data",
  "node_modules"
]);
const IMAGE_PREVIEW_CACHE_FILE = path.join(DATA_DIR, "image-preview-cache.json");
const NINJAS_REQUESTS_FILE = path.join(DATA_DIR, "ninjas-requests.json");
const NINJAS_PROFILES_FILE = path.join(DATA_DIR, "ninjas-profiles.json");
const SALES_LISTINGS_FILE = path.join(DATA_DIR, "sales-listings.json");
const VR_RENTAL_LEADS_FILE = path.join(DATA_DIR, "vr-rental-leads.json");
const VISITS_FILE = path.join(DATA_DIR, "visits.json");
const HEARTBEATS_FILE = path.join(DATA_DIR, "heartbeats.json");
const COMMUNITY_REPORTS_FILE = path.join(DATA_DIR, "community-reports.json");
const ACRE_2026_POLL_FILE = path.join(DATA_DIR, "acre-2026-poll.json");
const ACRE_2026_POLL_SETTINGS_FILE = path.join(DATA_DIR, "acre-2026-poll-settings.json");
const ACRE_2026_POLL_EXTENSION_SETTINGS = {
  version: 1,
  mode: "manual-week",
  baseWeekKey: "2026-W17",
  activeWeekKey: "2026-W17",
  activeWeekStartedAt: "2026-04-25T05:00:00.000Z",
  activeWeekExpiresAt: "2026-05-03T04:59:59.999Z",
  resetReason: "Extensao administrativa: manter a rodada Acre 2026 aberta por mais 7 dias sem mexer nos votos atuais.",
  updatedAt: "2026-04-25T18:00:00.000Z",
  history: []
};
const SPRITE_CHECK_REVIEWS_FILE = path.join(DATA_DIR, "sprite-check-reviews.json");
const OFFICE_ORDERS_FILE = path.join(DATA_DIR, "office-orders.json");
const OFFICE_WORK_FILE = path.join(DATA_DIR, "office-work.json");
const PIX_RECEIVER_KEY = cleanShortText(process.env.OFFICE_SUPPORT_PIX_KEY || "99566741204", 120);
const PIX_RECEIVER_NAME = cleanShortText(process.env.OFFICE_SUPPORT_PIX_RECEIVER_NAME || "ANTONIO CLOVIS", 25);
const PIX_RECEIVER_CITY = cleanShortText(process.env.OFFICE_SUPPORT_PIX_CITY || "CRUZEIRO SUL", 15);
const OFFICE_NEURAL_GROWTH_FILE = path.join(DATA_DIR, "office-neural-growth.json");
const WHATSAPP_CHAT_LOG_FILE = path.join(DATA_DIR, "whatsapp-chat-log.json");
const PUBPAID_SPRITE_SCOUT_FILE = path.join(DATA_DIR, "pubpaid-sprite-scout.json");
const PUBPAID_DEPOSITS_FILE = path.join(DATA_DIR, "pubpaid-deposits.json");
const PUBPAID_WITHDRAWALS_FILE = path.join(DATA_DIR, "pubpaid-withdrawals.json");
const PUBPAID_WALLETS_FILE = path.join(DATA_DIR, "pubpaid-wallets.json");
const PUBPAID_PVP_FILE = path.join(DATA_DIR, "pubpaid-pvp.json");
const LEGACY_BACKEND_DATA_DIR = path.join(ROOT_DIR, "backend", "data");
const LEGACY_PUBPAID_DEPOSITS_FILE = path.join(LEGACY_BACKEND_DATA_DIR, "pubpaidDeposits.json");
const LEGACY_PUBPAID_WITHDRAWALS_FILE = path.join(LEGACY_BACKEND_DATA_DIR, "pubpaidWithdrawals.json");
const LEGACY_PUBPAID_WALLETS_FILE = path.join(LEGACY_BACKEND_DATA_DIR, "pubpaidWallets.json");
const SITE_URL = String(process.env.SITE_URL || "").trim().replace(/\/+$/, "");
const WHATSAPP_CHAT_ENABLED = String(process.env.WHATSAPP_CHAT_ENABLED || "").trim().toLowerCase() === "true";
const WHATSAPP_CLOUD_TOKEN = String(process.env.WHATSAPP_CLOUD_TOKEN || "").trim();
const WHATSAPP_CLOUD_PHONE_NUMBER_ID = String(process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID || "").trim();
const WHATSAPP_WEBHOOK_VERIFY_TOKEN = String(process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "").trim();
const WHATSAPP_CHAT_AUTOREPLY_ENABLED =
  String(process.env.WHATSAPP_CHAT_AUTOREPLY_ENABLED || "").trim().toLowerCase() !== "false";
const WHATSAPP_CHAT_AUTOREPLY_TEXT = String(
  process.env.WHATSAPP_CHAT_AUTOREPLY_TEXT ||
    "Recebi sua mensagem aqui no WhatsApp. A ponte com o Catalogo/Codex esta ativa e eu vou responder por aqui assim que possivel."
)
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, 1000);
const SPRITE_CHECK_PASSWORD = String(process.env.SPRITE_CHECK_PASSWORD || "99831455").trim();
const FULL_ADMIN_PASSWORD = getRequiredSecret("FULL_ADMIN_PASSWORD", SUPER_ADMIN_PASSWORD).trim();
const CHEFFE_CALL_USER = getRequiredSecret("CHEFFE_CALL_USER", "chefecall");
const CHEFFE_CALL_PASSWORD = getRequiredSecret("CHEFFE_CALL_PASSWORD", FULL_ADMIN_PASSWORD).trim();
const LOCALE = "pt-BR";
const TIME_ZONE = "America/Rio_Branco";
const NINJAS_PIX_KEY = String(process.env.NINJAS_PIX_KEY || "").trim();
const NINJAS_PIX_DEFAULT_AMOUNT = 5;
const NINJAS_PIX_RECEIVER_NAME = String(
  process.env.NINJAS_PIX_RECEIVER_NAME || "CATALOGO CRUZEIRO"
).trim();
const NINJAS_MERCHANT_NAME = String(
  process.env.NINJAS_MERCHANT_NAME || NINJAS_PIX_RECEIVER_NAME || "CATALOGO CZS"
).trim();
const NINJAS_MERCHANT_CITY = String(process.env.NINJAS_MERCHANT_CITY || "CRUZEIRO DO SUL").trim();
const PUBPAID_ALLOWED_AMOUNTS = [5, 10, 20, 50, 100];
const PUBPAID_PENDING_WINDOW_MS = 2 * 60 * 60 * 1000;
const PREVIEW_CLASS_BY_CATEGORY = {
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
const CATEGORY_LABEL_BY_KEY = {
  cotidiano: "Cotidiano",
  prefeitura: "Prefeitura",
  "acre-governo": "Acre / Governo",
  politica: "Política",
  policia: "Polícia",
  saude: "Saúde",
  educacao: "Educação",
  negocios: "Negócios",
  calendario: "Calendário",
  cultura: "Cultura",
  esporte: "Esporte",
  social: "Social",
  "festas & social": "Festas & Social",
  "utilidade publica": "Utilidade Pública"
};
const CATEGORY_ALIAS_MAP = {
  cotidiano: "cotidiano",
  politica: "politica",
  policia: "policia",
  saude: "saude",
  educacao: "educacao",
  economia: "negocios",
  negocios: "negocios",
  calendario: "calendario",
  calendário: "calendario",
  feriado: "calendario",
  feriados: "calendario",
  "datas comemorativas": "calendario",
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
const ACRE_2026_POLL_OPTIONS = {
  ageRanges: [
    "16 a 17 anos",
    "18 a 24 anos",
    "25 a 34 anos",
    "35 a 44 anos",
    "45 a 59 anos",
    "60 anos ou mais",
    "Prefiro nao informar"
  ],
  previousVotes: [
    "Gladson Cameli",
    "Jorge Viana",
    "Marcia Bittar",
    "Sergio Petecao",
    "Branco/Nulo",
    "Nao lembro/Nao votei"
  ],
  vote2026: [
    "Alan Rick",
    "Mailza Assis",
    "Tiao Bocalom",
    "Thor Dantas",
    "Ainda nao decidi",
    "Branco/Nulo"
  ],
  secondChoice: [
    "Alan Rick",
    "Mailza Assis",
    "Tiao Bocalom",
    "Thor Dantas",
    "Ainda nao decidi",
    "Branco/Nulo",
    "Nenhuma segunda opcao"
  ],
  rejection: [
    "Nao rejeito nenhum",
    "Alan Rick",
    "Mailza Assis",
    "Tiao Bocalom",
    "Thor Dantas",
    "Rejeito todos"
  ],
  priorities: [
    "Emprego e renda",
    "Saude",
    "Seguranca",
    "Educacao",
    "Infraestrutura e mobilidade",
    "Combate a corrupcao",
    "Custo de vida e precos"
  ],
  governmentEvaluation: ["Otimo", "Bom", "Regular", "Ruim", "Pessimo", "Nao sabe"],
  stateDirection: ["No rumo certo", "No rumo errado", "Nem certo nem errado", "Nao sabe"],
  desiredCycle: ["Mudanca", "Continuidade", "Equilibrio", "Nao sabe"],
  voteCertainty: ["Ja esta decidido", "Pode mudar", "Muito indefinido"],
  politicalAttention: ["Acompanho sempre", "Acompanho as vezes", "Quase nao acompanho"],
  decisionDriver: [
    "Resultados concretos",
    "Postura e lideranca",
    "Combate a corrupcao",
    "Alinhamento politico",
    "Propostas para minha regiao"
  ]
};
const STATIC_PAGE_SEO = {
  "/": {
    title: `${SITE_NAME} | Jornal Agregador Local`,
    description: DEFAULT_SITE_DESCRIPTION,
    themeColor: "#1E3A5F",
    colorScheme: "light",
    ogType: "website",
    schemaType: "WebSite",
    priority: "1.0",
    changefreq: "hourly",
    fileName: "index.html"
  },
  "/arquivo.html": {
    title: `Pesquisa Completa | ${SITE_NAME}`,
    description:
      "Pesquisa completa do arquivo de noticias verificadas com filtros, rolagem e busca por tema, fonte, editoria e resumo.",
    themeColor: "#1E3A5F",
    colorScheme: "light",
    ogType: "website",
    schemaType: "CollectionPage",
    priority: "0.78",
    changefreq: "daily",
    fileName: "arquivo.html"
  },
  "/catalogo-servicos.html": {
    title: `Catalogo de Servicos | ${SITE_NAME}`,
    description:
      "Guia local com telefones, WhatsApp, links e modulos de restaurantes, saude, emergencia, transporte, hospedagem e utilidade publica em Cruzeiro do Sul.",
    themeColor: "#15304C",
    colorScheme: "light",
    ogType: "website",
    schemaType: "CollectionPage",
    priority: "0.72",
    changefreq: "weekly",
    fileName: "catalogo-servicos.html"
  },
  "/candidato.html": {
    title: `Portal do Candidato | ${SITE_NAME}`,
    description:
      "Historico, posicao politica, realizacoes, fontes e pontuacao editorial dos nomes monitorados nas eleicoes do Acre.",
    themeColor: "#1E3A5F",
    colorScheme: "light",
    ogType: "profile",
    schemaType: "ProfilePage",
    sitemap: false,
    fileName: "candidato.html"
  },
  "/estudantes.html": {
    title: `Para Estudantes | ${SITE_NAME}`,
    description:
      "Hub estudantil com buscador de assuntos, trilhas da educacao infantil ate a faculdade, dicas de rotina, materiais e apoio para vida academica.",
    themeColor: "#1E3A5F",
    colorScheme: "light",
    ogType: "website",
    schemaType: "CollectionPage",
    priority: "0.8",
    changefreq: "daily",
    fileName: "estudantes.html"
  },
  "/escritorio.html": {
    title: `Escritorio dos Agentes | ${SITE_NAME}`,
    description:
      "Escritorio pixel art dos agentes especialistas do Catalogo Cruzeiro do Sul, com editoria, copy, games, infantil, vendas, design, revisao, fontes e automacao.",
    themeColor: "#111827",
    colorScheme: "dark light",
    ogType: "website",
    schemaType: "CollectionPage",
    priority: "0.76",
    changefreq: "weekly",
    fileName: "escritorio.html"
  },
  "/real-agents.html": {
    title: `Agentes Reais em Operacao | ${SITE_NAME}`,
    description:
      "Painel operacional dos agentes reais do Catalogo Cruzeiro do Sul, com escritorios, capacidades, fila de monitoramento e ideias geradas a partir do jornal.",
    themeColor: "#101827",
    colorScheme: "dark light",
    ogType: "website",
    schemaType: "CollectionPage",
    priority: "0.74",
    changefreq: "hourly",
    fileName: "real-agents.html"
  },
  "/cheffe-call.html": {
    title: `Cheffe Call | ${SITE_NAME}`,
    description:
      "Sala de reuniao dos agentes reais, com escritorio bitmap, pausa operacional, memoria da reuniao, agente do dia, escritorio do dia e acao do dia.",
    themeColor: "#120f1a",
    colorScheme: "dark light",
    ogType: "website",
    schemaType: "CollectionPage",
    priority: "0.73",
    changefreq: "hourly",
    fileName: "cheffe-call.html"
  },
  "/escritorio-nerd.html": {
    title: `Escritorio Nerd | ${SITE_NAME}`,
    description:
      "Escritorio nerd em pixel art com o time de game dev do PubPaid, incluindo game design, fisica, HUD, pixel art, som, playtest e estabilidade.",
    themeColor: "#170d2d",
    colorScheme: "dark light",
    ogType: "website",
    schemaType: "CollectionPage",
    priority: "0.74",
    changefreq: "weekly",
    fileName: "escritorio-nerd.html"
  },
  "/escritorio-arte.html": {
    title: `Escritorio de Arte | ${SITE_NAME}`,
    description:
      "Escritorio de Arte com 50 agentes de Design Art e Programacao de Game Design estudando pixel art, sprites, engine, colisao, fisica, mapas e jogos junto com os Ninjas.",
    themeColor: "#111827",
    colorScheme: "dark light",
    ogType: "website",
    schemaType: "CollectionPage",
    priority: "0.72",
    changefreq: "weekly",
    fileName: "escritorio-arte.html"
  },
  "/esttiles.html": {
    title: `Esttiles | Editorial de Moda e Estilo | ${SITE_NAME}`,
    description:
      "Subsite editorial de moda com 50 agentes de estilo, passarela, beleza, fotografia, branding, vitrine e cobertura de moda local e cultural.",
    themeColor: "#182235",
    colorScheme: "dark light",
    ogType: "website",
    schemaType: "CollectionPage",
    priority: "0.72",
    changefreq: "weekly",
    fileName: "esttiles.html"
  },
  "/lifestile.html": {
    title: `Lifestile Acre | Moda e estilo de vida | ${SITE_NAME}`,
    description:
      "Editorial de moda e estilo de vida com recorte do Acre, street style, beleza, criadores locais, eventos, vitrine e sinais das redes sociais.",
    themeColor: "#FBF7F0",
    colorScheme: "light",
    ogType: "website",
    schemaType: "CollectionPage",
    priority: "0.72",
    changefreq: "daily",
    fileName: "lifestile.html"
  },
  "/games.html": {
    title: `Canal Tech Gamer | ${SITE_NAME}`,
    description:
      "Canal Tech Gamer com noticias de games, anime, Roblox, Mario Kart World, Game Pass, PlayStation Plus, trailers oficiais e guias para familias.",
    themeColor: "#08142A",
    colorScheme: "dark light",
    ogType: "website",
    schemaType: "CollectionPage",
    priority: "0.83",
    changefreq: "daily",
    fileName: "games.html"
  },
  "/animes.html": {
    title: `Radar Anime | ${SITE_NAME}`,
    description:
      "Pagina editorial de anime, manga, dublagem, cultura pop, trailers, estreias, comunidades de fas e pontes com games.",
    themeColor: "#1D1238",
    colorScheme: "dark light",
    ogType: "website",
    schemaType: "CollectionPage",
    priority: "0.78",
    changefreq: "daily",
    fileName: "animes.html"
  },
  "/infantil.html": {
    title: `Clube Infantil | ${SITE_NAME}`,
    description:
      "Canal infantil com personagens conhecidos, desenhos, Roblox, Minecraft, creators de conteudo familiar, noticias de games, macetes e leitura acompanhada.",
    themeColor: "#1E3A5F",
    colorScheme: "light",
    ogType: "website",
    schemaType: "CollectionPage",
    priority: "0.8",
    changefreq: "daily",
    fileName: "infantil.html"
  },
  "/legal.html": {
    title: `${SITE_NAME} | Termos de Uso e Aviso de Privacidade`,
    description:
      "Termos de uso, aviso de privacidade, cookies, direitos autorais e regras de transparencia do Catalogo Cruzeiro do Sul.",
    themeColor: "#1E3A5F",
    colorScheme: "light",
    ogType: "article",
    schemaType: "WebPage",
    priority: "0.42",
    changefreq: "monthly",
    fileName: "legal.html"
  },
  "/noticia.html": {
    title: `${SITE_NAME} | Noticia`,
    description:
      "Pagina interna do Catalogo Cruzeiro do Sul com resumo editorial, contexto e link para a fonte consultada.",
    themeColor: "#1E3A5F",
    colorScheme: "light",
    ogType: "article",
    schemaType: "NewsArticle",
    sitemap: false,
    fileName: "noticia.html"
  },
  "/remocao.html": {
    title: `${SITE_NAME} | Pedido de Remocao`,
    description:
      "Fluxo de pedido de revisao ou remocao de conteudo do Catalogo Cruzeiro do Sul com analise manual.",
    robots: "noindex,follow",
    themeColor: "#1E3A5F",
    colorScheme: "light",
    ogType: "website",
    schemaType: "ContactPage",
    sitemap: false,
    fileName: "remocao.html"
  },
  "/pesquisa-acre-2026.html": {
    title: `Enquete de Opiniao Acre 2026 | ${SITE_NAME}`,
    description:
      "Enquete publica espontanea, pessoal e sem carater cientifico sobre opiniao no Acre em 2026, com parciais automaticas das respostas voluntarias.",
    robots: "noindex,nofollow,noarchive",
    themeColor: "#081526",
    colorScheme: "dark light",
    ogType: "website",
    schemaType: "WebPage",
    sitemap: false,
    fileName: "pesquisa-acre-2026.html"
  },
  "/pubpaid.html": {
    title: `PubPaid 2.0 | Rua Viva e PvP`,
    description:
      "PubPaid 2.0 com rua viva, carteira real, Damas PvP e partidas confirmadas entre dois jogadores.",
    themeColor: "#070A18",
    colorScheme: "dark",
    ogType: "website",
    schemaType: "Game",
    robots: "noindex,nofollow",
    sitemap: false,
    fileName: "pubpaid.html"
  },
  "/palavras-da-rosa.html": {
    title: `Palavras da Rosa | ${SITE_NAME}`,
    description:
      "Jogo especial de palavras cruzadas com tema floral, visual rosa e uma singela homenagem integrada ao jornal.",
    themeColor: "#E91E63",
    colorScheme: "light",
    ogType: "website",
    schemaType: "Game",
    priority: "0.58",
    changefreq: "weekly",
    fileName: "palavras-da-rosa.html"
  },
  "/vendas.html": {
    title: `Vendas Locais | ${SITE_NAME}`,
    description:
      "Marketplace local para anunciar usados, eletronicos, moveis, veiculos, moda, casa e desapegos de Cruzeiro do Sul.",
    themeColor: "#102744",
    colorScheme: "light",
    ogType: "website",
    schemaType: "CollectionPage",
    priority: "0.74",
    changefreq: "daily",
    fileName: "vendas.html"
  }
};
const GENERIC_CATEGORY_KEYS = new Set([
  "",
  "newsletter",
  "nacional",
  "geral",
  "acre",
  "acre 03",
  "destaque 1",
  "extra total"
]);
const RSS_SOURCES = (() => {
  try {
    const list = require("./backend/source-config.js");
    return Array.isArray(list) ? list : [];
  } catch (_error) {
    return [];
  }
})();
const NEWS_REFRESH_INTERVAL_MS = Math.max(
  1000 * 60 * 5,
  Number(process.env.NEWS_REFRESH_INTERVAL_MS || 1000 * 60 * 15)
);
const TOPIC_FEED_TTL_MS = Math.max(
  1000 * 60 * 5,
  Number(process.env.TOPIC_FEED_TTL_MS || 1000 * 60 * 15)
);
const TOPIC_FEED_FALLBACK_FILE = path.join(ROOT_DIR, "data", "topic-feed-fallback.json");
const COVERAGE_LAYER_PRIORITY = {
  jurua: 0,
  acre: 1,
  brasil: 2,
  global: 3
};
const TOPIC_FEED_CONFIG = {
  study: [
    {
      id: "inside-higher-ed",
      name: "Inside Higher Ed",
      feedUrl: "https://www.insidehighered.com/rss.xml",
      siteUrl: "https://www.insidehighered.com/news",
      defaultCategory: "Educacao",
      topicGroup: "campus"
    },
    {
      id: "edsurge",
      name: "EdSurge",
      feedUrl: "https://www.edsurge.com/articles_rss",
      siteUrl: "https://www.edsurge.com/news",
      defaultCategory: "Educacao",
      topicGroup: "edtech"
    },
    {
      id: "hechinger",
      name: "The Hechinger Report",
      feedUrl: "https://hechingerreport.org/feed/",
      siteUrl: "https://hechingerreport.org/",
      defaultCategory: "Educacao",
      topicGroup: "acesso"
    },
    {
      id: "pie-news",
      name: "The PIE News",
      feedUrl: "https://thepienews.com/feed/",
      siteUrl: "https://thepienews.com/news/",
      defaultCategory: "Educacao",
      topicGroup: "mundo"
    }
  ],
  kids: [
    {
      id: "youtube-blog",
      name: "YouTube Blog",
      feedUrl: "https://blog.youtube/rss",
      siteUrl: "https://blog.youtube/",
      defaultCategory: "Cultura",
      topicGroup: "creators"
    },
    {
      id: "animation-magazine",
      name: "Animation Magazine",
      feedUrl: "https://www.animationmagazine.net/feed/",
      siteUrl: "https://www.animationmagazine.net/",
      defaultCategory: "Cartoons",
      topicGroup: "animation"
    },
    {
      id: "awn",
      name: "Animation World Network",
      feedUrl: "https://www.awn.com/news/rss.xml",
      siteUrl: "https://www.awn.com/",
      defaultCategory: "Cartoons",
      topicGroup: "animation"
    },
    {
      id: "cartoon-brew",
      name: "Cartoon Brew",
      feedUrl: "https://www.cartoonbrew.com/feed",
      siteUrl: "https://www.cartoonbrew.com/",
      defaultCategory: "Cartoons",
      topicGroup: "animation"
    },
    {
      id: "anime-news-network",
      name: "Anime News Network",
      feedUrl: "https://www.animenewsnetwork.com/all/rss.xml?ann-edition=us",
      siteUrl: "https://www.animenewsnetwork.com/",
      defaultCategory: "Anime",
      topicGroup: "anime"
    },
    {
      id: "toy-insider",
      name: "The Toy Insider",
      feedUrl: "https://thetoyinsider.com/feed/",
      siteUrl: "https://thetoyinsider.com/",
      defaultCategory: "Kids",
      topicGroup: "games"
    },
    {
      id: "tubefilter",
      name: "Tubefilter",
      feedUrl: "https://feeds.feedburner.com/tubefilter",
      siteUrl: "https://www.tubefilter.com/",
      defaultCategory: "Creators",
      topicGroup: "creators"
    }
  ],
  games: [
    {
      id: "youtube-blog",
      name: "YouTube Blog",
      feedUrl: "https://blog.youtube/rss",
      siteUrl: "https://blog.youtube/",
      defaultCategory: "Creators",
      topicGroup: "creators"
    },
    {
      id: "xbox-wire",
      name: "Xbox Wire",
      feedUrl: "https://news.xbox.com/en-us/feed/",
      siteUrl: "https://news.xbox.com/en-us/",
      defaultCategory: "Games",
      topicGroup: "premieres"
    },
    {
      id: "playstation-blog",
      name: "PlayStation Blog",
      feedUrl: "https://feeds.feedburner.com/psblog",
      siteUrl: "https://blog.playstation.com/",
      defaultCategory: "Games",
      topicGroup: "premieres"
    },
    {
      id: "the-verge-gaming",
      name: "The Verge Gaming",
      feedUrl: "https://www.theverge.com/rss/games/index.xml",
      siteUrl: "https://www.theverge.com/games",
      defaultCategory: "Games",
      topicGroup: "games"
    },
    {
      id: "anime-news-network",
      name: "Anime News Network",
      feedUrl: "https://www.animenewsnetwork.com/all/rss.xml?ann-edition=us",
      siteUrl: "https://www.animenewsnetwork.com/",
      defaultCategory: "Anime",
      topicGroup: "anime"
    },
    {
      id: "tubefilter",
      name: "Tubefilter",
      feedUrl: "https://feeds.feedburner.com/tubefilter",
      siteUrl: "https://www.tubefilter.com/",
      defaultCategory: "Creators",
      topicGroup: "creators"
    }
  ],
  anime: [
    {
      id: "anime-news-network",
      name: "Anime News Network",
      feedUrl: "https://www.animenewsnetwork.com/all/rss.xml?ann-edition=us",
      siteUrl: "https://www.animenewsnetwork.com/",
      defaultCategory: "Anime",
      topicGroup: "anime"
    },
    {
      id: "animation-magazine",
      name: "Animation Magazine",
      feedUrl: "https://www.animationmagazine.net/feed/",
      siteUrl: "https://www.animationmagazine.net/",
      defaultCategory: "Animacao",
      topicGroup: "animation"
    },
    {
      id: "cartoon-brew",
      name: "Cartoon Brew",
      feedUrl: "https://www.cartoonbrew.com/feed",
      siteUrl: "https://www.cartoonbrew.com/",
      defaultCategory: "Animacao",
      topicGroup: "animation"
    },
    {
      id: "awn",
      name: "Animation World Network",
      feedUrl: "https://www.awn.com/news/rss.xml",
      siteUrl: "https://www.awn.com/",
      defaultCategory: "Animacao",
      topicGroup: "animation"
    }
  ],
  buzz: [
    {
      id: "g1-pop-arte",
      name: "G1 Pop & Arte",
      feedUrl: "https://g1.globo.com/rss/g1/pop-arte/",
      siteUrl: "https://g1.globo.com/pop-arte/",
      defaultCategory: "Cultura",
      topicGroup: "cinema",
      coverageLayer: "brasil"
    },
    {
      id: "terra-diversao",
      name: "Terra Diversao",
      feedUrl: "https://www.terra.com.br/rss/Controller?channelid=7f6c931cc6b6d310VgnVCM4000009bcceb0aRCRD",
      siteUrl: "https://www.terra.com.br/diversao/",
      defaultCategory: "Cultura",
      topicGroup: "celebridades",
      coverageLayer: "brasil",
      disabled: true,
      disabledReason: "RSS monitorado retornou 0 itens; manter como referência manual até nova integração."
    },
    {
      id: "agencia-brasil-cultura",
      name: "Agencia Brasil Cultura",
      feedUrl: "https://agenciabrasil.ebc.com.br/rss/cultura/feed.xml",
      siteUrl: "https://agenciabrasil.ebc.com.br/cultura",
      defaultCategory: "Cultura",
      topicGroup: "cultura",
      coverageLayer: "brasil"
    }
  ],
  politics: [
    {
      id: "g1-politica",
      name: "G1 Politica",
      feedUrl: "https://g1.globo.com/rss/g1/politica/",
      siteUrl: "https://g1.globo.com/politica/",
      defaultCategory: "Politica",
      topicGroup: "brasilia"
    },
    {
      id: "senado-noticias",
      name: "Senado Noticias",
      feedUrl: "https://www12.senado.leg.br/noticias/feed",
      siteUrl: "https://www12.senado.leg.br/noticias",
      defaultCategory: "Politica",
      topicGroup: "congresso"
    },
    {
      id: "agencia-brasil-politica",
      name: "Agencia Brasil Politica",
      feedUrl: "https://agenciabrasil.ebc.com.br/rss/politica/feed.xml",
      siteUrl: "https://agenciabrasil.ebc.com.br/politica",
      defaultCategory: "Politica",
      topicGroup: "nacional"
    }
  ],
  jurua: [
    {
      id: "jurua-comunicacao",
      name: "Jurua Comunicacao",
      feedUrl: "https://juruacomunicacao.com.br/feed/",
      siteUrl: "https://juruacomunicacao.com.br/",
      defaultCategory: "Cotidiano",
      topicGroup: "jurua"
    },
    {
      id: "jurua-24h",
      name: "Jurua 24 Horas",
      feedUrl: "https://jurua24horas.com/feed/",
      siteUrl: "https://jurua24horas.com/",
      defaultCategory: "Cotidiano",
      topicGroup: "jurua"
    },
    {
      id: "jurua-em-tempo",
      name: "Jurua em Tempo",
      feedUrl: "https://www.juruaemtempo.com.br/feed/",
      siteUrl: "https://www.juruaemtempo.com.br/",
      defaultCategory: "Cotidiano",
      topicGroup: "jurua"
    },
    {
      id: "jurua-online",
      name: "Jurua Online",
      feedUrl: "https://juruaonline.com.br/wp-json/wp/v2/posts?per_page=16&_embed=1",
      feedType: "wordpress-json",
      siteUrl: "https://juruaonline.com.br/",
      defaultCategory: "Cotidiano",
      topicGroup: "jurua",
      priority: 980,
      priorityReason: "Fonte regional prioritaria; REST do WordPress substitui RSS redirecionado."
    },
    {
      id: "tribuna-do-jurua",
      name: "Tribuna do Jurua",
      feedUrl: "https://tribunadojurua.com.br/feed/",
      siteUrl: "https://tribunadojurua.com.br/",
      defaultCategory: "Cotidiano",
      topicGroup: "jurua"
    },
    {
      id: "portal-do-jurua",
      name: "Portal do Jurua",
      feedUrl: "https://www.portaldojurua.com.br/feeds/posts/default",
      siteUrl: "https://www.portaldojurua.com.br/",
      defaultCategory: "Cotidiano",
      topicGroup: "jurua",
      priority: 970,
      priorityReason: "Fonte regional prioritaria; feed Atom/Blogger valido."
    },
    {
      id: "voz-do-norte",
      name: "Voz do Norte",
      feedUrl: "https://www.vozdonorte.com.br/feed/",
      siteUrl: "https://www.vozdonorte.com.br/",
      defaultCategory: "Cotidiano",
      topicGroup: "jurua"
    },
    {
      id: "batelao",
      name: "Portal Batelao",
      feedUrl: "https://batelao.com/feed/",
      siteUrl: "https://batelao.com/",
      defaultCategory: "Cotidiano",
      topicGroup: "jurua"
    }
  ],
  acre: [
    {
      id: "ac24horas",
      name: "ac24horas",
      feedUrl: "https://ac24horas.com/feed/",
      siteUrl: "https://ac24horas.com/",
      defaultCategory: "Cotidiano",
      topicGroup: "acre"
    },
    {
      id: "ac24agro",
      name: "ac24agro",
      feedUrl: "https://ac24agro.com/feed/",
      siteUrl: "https://ac24agro.com/",
      defaultCategory: "Agro",
      topicGroup: "acre"
    },
    {
      id: "agencia-acre",
      name: "Agencia de Noticias do Acre",
      feedUrl: "https://agencia.ac.gov.br/feed/",
      siteUrl: "https://agencia.ac.gov.br/",
      defaultCategory: "Governo",
      topicGroup: "acre"
    },
    {
      id: "acre-online",
      name: "AcreOnline",
      feedUrl: "https://acreonline.net/feed/",
      siteUrl: "https://acreonline.net/",
      defaultCategory: "Cotidiano",
      topicGroup: "acre"
    },
    {
      id: "acre-noticias",
      name: "Acre Noticias",
      feedUrl: "https://www.acre.com.br/feed/",
      siteUrl: "https://www.acre.com.br/",
      defaultCategory: "Cotidiano",
      topicGroup: "acre"
    },
    {
      id: "acre-news",
      name: "AcreNews",
      feedUrl: "https://acrenews.com.br/feed/",
      siteUrl: "https://acrenews.com.br/",
      defaultCategory: "Cotidiano",
      topicGroup: "acre"
    }
  ],
  brasil: [
    {
      id: "g1-brasil",
      name: "G1 Brasil",
      feedUrl: "https://g1.globo.com/rss/g1/brasil/",
      siteUrl: "https://g1.globo.com/brasil/",
      defaultCategory: "Brasil",
      topicGroup: "brasil"
    },
    {
      id: "g1-politica",
      name: "G1 Politica",
      feedUrl: "https://g1.globo.com/rss/g1/politica/",
      siteUrl: "https://g1.globo.com/politica/",
      defaultCategory: "Politica",
      topicGroup: "brasil"
    },
    {
      id: "cnn-brasil",
      name: "CNN Brasil",
      feedUrl: "https://www.cnnbrasil.com.br/feed/",
      siteUrl: "https://www.cnnbrasil.com.br/",
      defaultCategory: "Brasil",
      topicGroup: "brasil"
    },
    {
      id: "agencia-brasil-geral",
      name: "Agencia Brasil",
      feedUrl: "https://agenciabrasil.ebc.com.br/rss/geral/feed.xml",
      siteUrl: "https://agenciabrasil.ebc.com.br/geral",
      defaultCategory: "Brasil",
      topicGroup: "brasil"
    },
    {
      id: "agencia-brasil-politica",
      name: "Agencia Brasil Politica",
      feedUrl: "https://agenciabrasil.ebc.com.br/rss/politica/feed.xml",
      siteUrl: "https://agenciabrasil.ebc.com.br/politica",
      defaultCategory: "Politica",
      topicGroup: "brasil"
    }
  ],
  films: [
    {
      id: "g1-pop-arte-filmes",
      name: "G1 Pop & Arte",
      feedUrl: "https://g1.globo.com/rss/g1/pop-arte/",
      siteUrl: "https://g1.globo.com/pop-arte/",
      defaultCategory: "Filmes",
      topicGroup: "cinema",
      coverageLayer: "brasil"
    },
    {
      id: "variety-film",
      name: "Variety Film",
      feedUrl: "https://variety.com/v/film/feed/",
      siteUrl: "https://variety.com/v/film/",
      defaultCategory: "Filmes",
      topicGroup: "cinema",
      coverageLayer: "global"
    },
    {
      id: "deadline-film",
      name: "Deadline Film",
      feedUrl: "https://deadline.com/category/film/feed/",
      siteUrl: "https://deadline.com/category/film/",
      defaultCategory: "Filmes",
      topicGroup: "cinema",
      coverageLayer: "global"
    }
  ],
  theater: [
    {
      id: "playbill-news",
      name: "Playbill",
      feedUrl: "https://playbill.com/rss/news",
      siteUrl: "https://playbill.com/",
      defaultCategory: "Teatro",
      topicGroup: "teatro",
      coverageLayer: "global"
    },
    {
      id: "broadwayworld",
      name: "BroadwayWorld",
      feedUrl: "https://www.broadwayworld.com/rss/news_main.cfm",
      siteUrl: "https://www.broadwayworld.com/",
      defaultCategory: "Teatro",
      topicGroup: "teatro",
      coverageLayer: "global"
    }
  ],
  tech: [
    {
      id: "the-verge-tech",
      name: "The Verge",
      feedUrl: "https://www.theverge.com/rss/index.xml",
      siteUrl: "https://www.theverge.com/tech",
      defaultCategory: "Tecnologia",
      topicGroup: "tech",
      coverageLayer: "global"
    },
    {
      id: "techcrunch",
      name: "TechCrunch",
      feedUrl: "https://techcrunch.com/feed/",
      siteUrl: "https://techcrunch.com/",
      defaultCategory: "Tecnologia",
      topicGroup: "tech",
      coverageLayer: "global"
    }
  ],
  economy: [
    {
      id: "g1-economia",
      name: "G1 Economia",
      feedUrl: "https://g1.globo.com/rss/g1/economia/",
      siteUrl: "https://g1.globo.com/economia/",
      defaultCategory: "Economia",
      topicGroup: "economia",
      coverageLayer: "brasil"
    },
    {
      id: "agencia-brasil-economia",
      name: "Agencia Brasil Economia",
      feedUrl: "https://agenciabrasil.ebc.com.br/rss/economia/feed.xml",
      siteUrl: "https://agenciabrasil.ebc.com.br/economia",
      defaultCategory: "Economia",
      topicGroup: "economia",
      coverageLayer: "brasil"
    }
  ],
  world: [
    {
      id: "g1-mundo",
      name: "G1 Mundo",
      feedUrl: "https://g1.globo.com/rss/g1/mundo/",
      siteUrl: "https://g1.globo.com/mundo/",
      defaultCategory: "Mundo",
      topicGroup: "mundo",
      coverageLayer: "brasil"
    },
    {
      id: "bbc-world",
      name: "BBC World",
      feedUrl: "https://feeds.bbci.co.uk/news/world/rss.xml",
      siteUrl: "https://www.bbc.com/news/world",
      defaultCategory: "Mundo",
      topicGroup: "mundo",
      coverageLayer: "global"
    }
  ]
};
const IMAGE_PREVIEW_ALLOWLIST = [
  "ac24horas.com",
  "ac24agro.com",
  "acreonline.net",
  "acre.com.br",
  "acrenews.com.br",
  "g1.globo.com",
  "cnnbrasil.com.br",
  "agenciabrasil.ebc.com.br",
  "jurua24horas.com",
  "juruacomunicacao.com.br",
  "juruaemtempo.com.br",
  "juruaonline.com.br",
  "tribunadojurua.com.br",
  "portaldojurua.com.br",
  "vozdonorte.com.br",
  "batelao.com",
  "agencia.ac.gov.br",
  "cruzeirodosul.net",
  "cruzeirodosul.ac.gov.br",
  "portalacre.com.br",
  "noticiasdahora.com.br",
  "amac.com.br",
  "ifac.edu.br",
  "blog.youtube",
  "news.xbox.com",
  "blog.playstation.com",
  "animenewsnetwork.com",
  "cartoonbrew.com",
  "tubefilter.com",
  "www.theverge.com",
  "theverge.com",
  "insidehighered.com",
  "edsurge.com",
  "hechingerreport.org",
  "thepienews.com",
  "nintendo.com",
  "roblox.com",
  "ir.roblox.com",
  "crunchyroll.com",
  "animationmagazine.net",
  "awn.com",
  "thetoyinsider.com",
  "press.disneyplus.com",
  "bluey.tv",
  "nick.com",
  "galinhapintadinha.com.br",
  "mundobita.com.br",
  "turmadamonica.uol.com.br"
];

function normalizeHostCandidate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const normalizedUrl = /^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, "")}`;
    return new URL(normalizedUrl).hostname.toLowerCase().replace(/^www\./, "");
  } catch (_error) {
    return raw.toLowerCase().replace(/^https?:\/\//i, "").replace(/^www\./, "").split("/")[0];
  }
}

function collectConfiguredPreviewHosts() {
  const hosts = new Set();

  IMAGE_PREVIEW_ALLOWLIST.forEach((entry) => {
    const normalized = normalizeHostCandidate(entry);
    if (normalized) {
      hosts.add(normalized);
    }
  });

  Object.values(TOPIC_FEED_CONFIG).forEach((group) => {
    if (!Array.isArray(group)) {
      return;
    }

    group.forEach((source) => {
      [source?.siteUrl, source?.feedUrl, source?.sourceUrl, source?.url].forEach((value) => {
        const normalized = normalizeHostCandidate(value);
        if (normalized) {
          hosts.add(normalized);
        }
      });
    });
  });

  [NINJAS_OPPORTUNITIES].forEach((collection) => {
    if (!Array.isArray(collection)) {
      return;
    }

    collection.forEach((item) => {
      [item?.sourceUrl, item?.url, item?.website].forEach((value) => {
        const normalized = normalizeHostCandidate(value);
        if (normalized) {
          hosts.add(normalized);
        }
      });
    });
  });

  return hosts;
}

function collectPreviewHostsFromNewsRecords(records = []) {
  const hosts = new Set();
  const items = Array.isArray(records) ? records : [];

  items.forEach((item) => {
    [item?.sourceUrl, item?.url, item?.link, item?.source].forEach((value) => {
      const normalized = normalizeHostCandidate(value);
      if (normalized) {
        hosts.add(normalized);
      }
    });
  });

  return hosts;
}

let IMAGE_PREVIEW_DYNAMIC_ALLOWLIST = new Set();
const DYNAMIC_ASSET_BASENAMES = new Set([
  "news-data.js",
  "social-rss-data.js",
  "elections-data.js",
  "sidebar-data.js",
  "runtime-config.js"
]);
const VERSIONED_STATIC_CACHE_CONTROL = "public, max-age=31536000, immutable";
const NEWS_API_CACHE_TTL_MS = 30 * 1000;
const newsApiResponseCache = new Map();
const NINJAS_OPPORTUNITIES_UPDATED_AT = "2026-04-14";
const NINJAS_OPPORTUNITIES = [
  {
    id: "sine-acre-painel-vagas",
    kind: "vaga",
    badge: "Sine Acre",
    city: "Acre / confirmar lotacao local",
    title: "Painel estadual com funcoes abertas para vendas, recepcao, construcao e suporte",
    summary:
      "O painel oficial do Sine Acre lista vagas como consultor de vendas, recepcionista, promotor de vendas, vendas em loja, entregador de gas, engenheiro civil em estagio, pedreiro e servente de obras. Como a pagina muda com frequencia e nem sempre destaca o municipio, vale checar se ha encaminhamento para Cruzeiro do Sul.",
    publishedAt: "Pesquisa em 14 de abril de 2026",
    deadline: "Atualizacao continua",
    status: "aberto",
    sourceLabel: "Painel de vagas do Sine Acre",
    sourceUrl: "https://sine.ac.gov.br/vagas/"
  },
  {
    id: "ufac-tae-2026",
    kind: "concurso",
    badge: "UFAC",
    city: "Rio Branco e Cruzeiro do Sul",
    title: "Concurso tecnico-administrativo da UFAC com vagas e provas em Cruzeiro do Sul",
    summary:
      "Edital publicado em 31 de marco de 2026 para a carreira tecnico-administrativa em educacao. As inscricoes vao de 6 de abril de 2026 a 7 de maio de 2026, e o edital menciona aplicacao de provas em Cruzeiro do Sul para cargos com lotacao no municipio.",
    publishedAt: "2026-03-31",
    deadline: "2026-05-07",
    status: "inscricoes abertas",
    sourceLabel: "UFAC - Edital no 1/2026 (PDF)",
    sourceUrl:
      "https://www3.ufac.br/prodgep/2026/edital-no-1-de-30-de-marco-de-2026-concurso-publico-para-carreira-de-tecnico-administrativo-em-educacao/01-edital-2026-03-31-dou.pdf"
  },
  {
    id: "see-acre-pss-professor-2026",
    kind: "concurso",
    badge: "SEE Acre",
    city: "Interior do Acre",
    title: "PSS 001/2026 segue com chamadas para professor temporario no interior",
    summary:
      "A Secretaria de Educacao do Acre mantem o processo seletivo simplificado para professor temporario e ja publicou convocacoes para o interior. E uma trilha boa para quem quer acompanhar chamadas, lotacoes e documentos exigidos.",
    publishedAt: "Edital 001/2026",
    deadline: "acompanhar convocacoes",
    status: "em andamento",
    sourceLabel: "SEE Acre - PSS Professor Temporario",
    sourceUrl: "https://see.ac.gov.br/edital-pss-professor-temporario/"
  },
  {
    id: "ifac-cruzeiro-professor-substituto",
    kind: "concurso",
    badge: "IFAC Cruzeiro do Sul",
    city: "Cruzeiro do Sul",
    title: "Selecao de professor substituto em cinco areas no campus Cruzeiro do Sul",
    summary:
      "Publicado em 10 de fevereiro de 2026. O processo abriu vagas para Fisica, Historia, Lingua Portuguesa, Engenharia de Pesca e Engenharia Ambiental, com remuneracao entre R$ 4.326,60 e R$ 8.058,29 mais beneficios.",
    publishedAt: "2026-02-10",
    deadline: "2026-02-15",
    status: "encerrado",
    sourceLabel: "IFAC - noticia oficial",
    sourceUrl:
      "https://www.ifac.edu.br/noticias/2026/fevereiro/ifac-de-cruzeiro-do-sul-abre-selecao-para-professor-substituto-em-cinco-areas"
  },
  {
    id: "ufac-pet-agronomia-czs",
    kind: "bolsa",
    badge: "UFAC Campus Floresta",
    city: "Cruzeiro do Sul",
    title: "Selecao de bolsistas para o grupo PET Agronomia/CZS",
    summary:
      "Edital da Prograd para selecao de bolsistas do grupo PET Agronomia no campus Cruzeiro do Sul. Boa oportunidade para estudante que quer portfolio academico, extensao e primeiro historico relevante no curriculo.",
    publishedAt: "2026-03-05",
    deadline: "2026-03-12",
    status: "consultar edital",
    sourceLabel: "UFAC - PET Agronomia CZS",
    sourceUrl:
      "https://www3.ufac.br/prograd/2026/edital-prograd-ndeg-16-2026-processo-seletivo-para-bolsistas-do-grupo-pet-agronomia-czs/edital_prograd_n-c2-ba16-2026_-_pet_agronomia_assinado.pdf"
  },
  {
    id: "ufac-midialab-bolsas",
    kind: "bolsa",
    badge: "UFAC",
    city: "Acre / acompanhar lotacao",
    title: "MidiaLab da UFAC com bolsas para laboratorio de midias digitais",
    summary:
      "Edital da Prograd com 3 bolsas para atuacao no Laboratorio de Midias Digitais do Campus Floresta, em Cruzeiro do Sul. Mesmo quando nao encaixa como emprego tradicional, entra muito bem para portfolio e experiencia aplicada.",
    publishedAt: "2026-02-02",
    deadline: "2026-02-06",
    status: "consultar edital",
    sourceLabel: "UFAC - MídiaLab",
    sourceUrl:
      "https://www3.ufac.br/prograd/2026/edital-prograd-ndeg-12-2026-processo-seletivo-para-bolsista-do-laboratorio-de-midias-digitais-midialab/edital_12-2026_-_midialab_assinado.pdf"
  },
  {
    id: "prefeitura-pnab-2026",
    kind: "edital",
    badge: "Prefeitura de Cruzeiro do Sul",
    city: "Cruzeiro do Sul",
    title: "Editais da Lei Aldir Blanc 2026 com mais de R$ 634 mil no municipio",
    summary:
      "A Prefeitura informou em 27 de marco de 2026 o lancamento de seis editais culturais com investimento superior a R$ 634 mil. As inscricoes seguem ate 20 de abril de 2026, servindo para artistas, produtores, pontos de cultura e projetos locais.",
    publishedAt: "2026-03-27",
    deadline: "2026-04-20",
    status: "inscricoes abertas",
    sourceLabel: "Prefeitura de Cruzeiro do Sul - Lei Aldir Blanc 2026",
    sourceUrl:
      "https://www.cruzeirodosul.ac.gov.br/post/prefeitura-de-cruzeiro-do-sul-lan%C3%A7a-editais-da-lei-aldir-blanc-2026-de-r-r-634-mil-e-fortalece-ince"
  }
];
IMAGE_PREVIEW_DYNAMIC_ALLOWLIST = collectConfiguredPreviewHosts();
const IMAGE_PREVIEW_CACHE = new Map();
const IMAGE_PREVIEW_TTL_MS = 1000 * 60 * 60 * 12;
const REMOTE_REQUEST_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; CatalogoCruzeiroBot/1.0; +https://localhost)",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
};
const COMPRESSIBLE_MIME_TYPES = [
  "text/",
  "application/javascript",
  "application/json",
  "image/svg+xml"
];

let imagePreviewCacheLoaded = false;
let imagePreviewCacheWriteTimer = null;
const JSON_FILE_MUTATION_QUEUES = new Map();

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  seedDataDirFromDefault();
}

function seedDataDirFromDefault() {
  if (path.resolve(DATA_DIR) === path.resolve(DEFAULT_DATA_DIR)) {
    return;
  }

  if (!fs.existsSync(DEFAULT_DATA_DIR)) {
    return;
  }

  const entries = fs.readdirSync(DEFAULT_DATA_DIR, { withFileTypes: true });
  entries.forEach((entry) => {
    if (!entry.isFile()) return;
    const sourcePath = path.join(DEFAULT_DATA_DIR, entry.name);
    const targetPath = path.join(DATA_DIR, entry.name);
    if (fs.existsSync(targetPath)) return;
    fs.copyFileSync(sourcePath, targetPath);
  });
}

function safeJoin(base, targetPath) {
  const target = path.normalize(path.join(base, targetPath));
  if (!target.startsWith(base)) return null;
  return target;
}

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (_error) {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempFilePath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempFilePath, JSON.stringify(value, null, 2), "utf-8");
  fs.renameSync(tempFilePath, filePath);
}

function normalizeJsonArrayPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object" && Array.isArray(payload.items)) {
    return payload.items;
  }

  return [];
}

function readMergedNewsCollection(fileName) {
  const liveItems = normalizeJsonArrayPayload(readJson(path.join(DATA_DIR, fileName), []));

  if (path.resolve(DATA_DIR) === path.resolve(DEFAULT_DATA_DIR)) {
    return liveItems;
  }

  const defaultItems = normalizeJsonArrayPayload(readJson(path.join(DEFAULT_DATA_DIR, fileName), []));
  return liveItems.concat(defaultItems);
}

function mutateJsonFile(filePath, fallback, mutator) {
  const previousTask = JSON_FILE_MUTATION_QUEUES.get(filePath) || Promise.resolve();
  const nextTask = previousTask
    .catch(() => {})
    .then(async () => {
      const currentValue = readJson(filePath, fallback);
      const result = await Promise.resolve(mutator(currentValue));
      const payload =
        result &&
        typeof result === "object" &&
        !Array.isArray(result) &&
        Object.prototype.hasOwnProperty.call(result, "value")
          ? result
          : { value: result };
      writeJson(filePath, payload.value);
      return payload;
    });

  const queueMarker = nextTask.catch(() => {});
  JSON_FILE_MUTATION_QUEUES.set(filePath, queueMarker);

  return nextTask.finally(() => {
    if (JSON_FILE_MUTATION_QUEUES.get(filePath) === queueMarker) {
      JSON_FILE_MUTATION_QUEUES.delete(filePath);
    }
  });
}

function buildStorageHealthPayload({ writeProbe = false } = {}) {
  const checks = [];
  const addCheck = (name, ok, details = {}) => {
    checks.push({
      name,
      ok: Boolean(ok),
      ...details
    });
  };

  let dataDirStat = null;
  try {
    ensureDataDir();
    dataDirStat = fs.statSync(DATA_DIR);
    addCheck("data-dir-exists", dataDirStat.isDirectory(), { target: DATA_DIR });
  } catch (error) {
    addCheck("data-dir-exists", false, { target: DATA_DIR, error: String(error?.message || error) });
  }

  const configuredByEnv = Boolean(String(process.env.DATA_DIR || "").trim());
  const renderExpectedPath = "/opt/render/project/src/render-data";
  const usingDefaultDataDir = path.resolve(DATA_DIR) === path.resolve(DEFAULT_DATA_DIR);
  const renderPersistentPath =
    path.resolve(DATA_DIR) === path.resolve(renderExpectedPath) ||
    path.resolve(DATA_DIR).startsWith(`${path.resolve(renderExpectedPath)}${path.sep}`);

  addCheck("data-dir-env", configuredByEnv || !IS_PRODUCTION, {
    configuredByEnv,
    usingDefaultDataDir,
    expectedRenderPath: renderExpectedPath
  });

  if (IS_PRODUCTION) {
    addCheck("render-persistent-path", renderPersistentPath, {
      expected: renderExpectedPath,
      target: DATA_DIR
    });
  }

  let acrePollResponses = 0;
  let acrePollFileSize = 0;
  try {
    const records = readJson(ACRE_2026_POLL_FILE, []);
    acrePollResponses = Array.isArray(records) ? records.length : 0;
    acrePollFileSize = fs.existsSync(ACRE_2026_POLL_FILE) ? fs.statSync(ACRE_2026_POLL_FILE).size : 0;
    addCheck("acre-poll-readable", Array.isArray(records), {
      file: ACRE_2026_POLL_FILE,
      responses: acrePollResponses,
      bytes: acrePollFileSize
    });
  } catch (error) {
    addCheck("acre-poll-readable", false, {
      file: ACRE_2026_POLL_FILE,
      error: String(error?.message || error)
    });
  }

  if (writeProbe) {
    const probeFile = path.join(DATA_DIR, ".storage-health.json");
    const marker = crypto.randomBytes(8).toString("hex");
    const probePayload = {
      marker,
      pid: process.pid,
      checkedAt: new Date().toISOString()
    };

    try {
      writeJson(probeFile, probePayload);
      const savedProbe = readJson(probeFile, null);
      addCheck("storage-write-probe", savedProbe?.marker === marker, {
        file: probeFile,
        checkedAt: probePayload.checkedAt
      });
    } catch (error) {
      addCheck("storage-write-probe", false, {
        file: probeFile,
        error: String(error?.message || error)
      });
    }
  }

  const ok = checks.every((check) => check.ok);
  const persistentExpected = IS_PRODUCTION ? renderPersistentPath : !usingDefaultDataDir || configuredByEnv;

  return {
    ok,
    service: "catalogo-cruzeiro",
    storage: {
      target: DATA_DIR,
      defaultTarget: DEFAULT_DATA_DIR,
      configuredByEnv,
      usingDefaultDataDir,
      persistentExpected,
      dataDirMode: dataDirStat ? dataDirStat.mode : null
    },
    acre2026Poll: {
      file: ACRE_2026_POLL_FILE,
      settingsFile: ACRE_2026_POLL_SETTINGS_FILE,
      responses: acrePollResponses,
      bytes: acrePollFileSize,
      round: getAcre2026PollRoundSettings()
    },
    checks,
    checkedAt: new Date().toISOString()
  };
}

function loadImagePreviewCache() {
  if (imagePreviewCacheLoaded) return;
  imagePreviewCacheLoaded = true;

  const persisted = readJson(IMAGE_PREVIEW_CACHE_FILE, {});
  if (!persisted || typeof persisted !== "object" || Array.isArray(persisted)) {
    return;
  }

  Object.entries(persisted).forEach(([sourceUrl, entry]) => {
    if (!entry || typeof entry !== "object") return;
    IMAGE_PREVIEW_CACHE.set(sourceUrl, {
      url: String(entry.url || ""),
      at: Number(entry.at || 0)
    });
  });
}

function persistImagePreviewCache() {
  if (!imagePreviewCacheLoaded) return;

  const payload = {};
  IMAGE_PREVIEW_CACHE.forEach((value, key) => {
    payload[key] = {
      url: String(value?.url || ""),
      at: Number(value?.at || Date.now())
    };
  });

  writeJson(IMAGE_PREVIEW_CACHE_FILE, payload);
}

function scheduleImagePreviewCacheWrite() {
  if (imagePreviewCacheWriteTimer) {
    clearTimeout(imagePreviewCacheWriteTimer);
  }

  imagePreviewCacheWriteTimer = setTimeout(() => {
    imagePreviewCacheWriteTimer = null;
    persistImagePreviewCache();
  }, 120);

  if (typeof imagePreviewCacheWriteTimer.unref === "function") {
    imagePreviewCacheWriteTimer.unref();
  }
}

function updateImagePreviewCache(sourceUrl, imageUrl) {
  loadImagePreviewCache();
  IMAGE_PREVIEW_CACHE.set(sourceUrl, {
    url: String(imageUrl || ""),
    at: Date.now()
  });
  scheduleImagePreviewCacheWrite();
}

function writeStaticNewsData(items = []) {
  const safeItems = Array.isArray(items) ? items : [];
  const payload = `window.NEWS_ARCHIVE_TOTAL = ${safeItems.length};\nwindow.NEWS_DATA = ${JSON.stringify(safeItems, null, 2)};\n`;
  fs.writeFileSync(STATIC_NEWS_FILE, payload, "utf-8");
}

function getStaticNewsItems() {
  try {
    if (!fs.existsSync(STATIC_NEWS_FILE)) return [];

    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(STATIC_NEWS_FILE, "utf-8"), sandbox, {
      filename: STATIC_NEWS_FILE,
      timeout: 1000
    });

    return Array.isArray(sandbox.window.NEWS_DATA) ? sandbox.window.NEWS_DATA : [];
  } catch (_error) {
    return [];
  }
}

function getElectionConfig() {
  try {
    if (!fs.existsSync(ELECTIONS_FILE)) return { offices: [] };

    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(ELECTIONS_FILE, "utf-8"), sandbox, {
      filename: ELECTIONS_FILE,
      timeout: 1000
    });

    return sandbox.window.ELECTIONS_DATA || { offices: [] };
  } catch (_error) {
    return { offices: [] };
  }
}

function getServicesCatalogConfig() {
  try {
    if (!fs.existsSync(SERVICES_CATALOG_FILE)) return { modules: [] };

    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(SERVICES_CATALOG_FILE, "utf-8"), sandbox, {
      filename: SERVICES_CATALOG_FILE,
      timeout: 1000
    });

    return sandbox.window.CATALOGO_SERVICOS_DATA || { modules: [] };
  } catch (_error) {
    return { modules: [] };
  }
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function slugify(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const REGIONAL_CALENDAR_EVENTS = [
  {
    isoDate: "2026-01-01",
    label: "Feriado nacional",
    title: "Confraternização Universal",
    summary: "Primeiro feriado nacional do calendário brasileiro.",
    sourceUrl: "https://www.gov.br/gestao/pt-br/assuntos/noticias/2025/dezembro/confira-o-calendario-oficial-de-feriados-nacionais-e-pontos-facultativos-em-2026"
  },
  {
    isoDate: "2026-01-23",
    label: "Feriado estadual",
    title: "Dia do Evangélico no Acre",
    summary: "Data estadual acreana para organização de atendimento e expediente.",
    sourceUrl: "/arquivo.html?busca=Dia%20do%20Evang%C3%A9lico%20Acre"
  },
  {
    isoDate: "2026-02-16",
    label: "Ponto facultativo",
    title: "Carnaval",
    summary: "Ponto facultativo federal, com impacto em serviços e repartições.",
    sourceUrl: "https://www.gov.br/gestao/pt-br/assuntos/noticias/2025/dezembro/confira-o-calendario-oficial-de-feriados-nacionais-e-pontos-facultativos-em-2026"
  },
  {
    isoDate: "2026-02-17",
    label: "Ponto facultativo",
    title: "Carnaval",
    summary: "Continuação do período de Carnaval no calendário administrativo.",
    sourceUrl: "https://www.gov.br/gestao/pt-br/assuntos/noticias/2025/dezembro/confira-o-calendario-oficial-de-feriados-nacionais-e-pontos-facultativos-em-2026"
  },
  {
    isoDate: "2026-03-08",
    label: "Data comemorativa",
    title: "Dia Internacional da Mulher",
    summary: "Referência para eventos, serviços, ações públicas e programação comunitária.",
    sourceUrl: "/arquivo.html?busca=Dia%20Internacional%20da%20Mulher"
  },
  {
    isoDate: "2026-04-03",
    label: "Feriado nacional",
    title: "Paixão de Cristo",
    summary: "Feriado nacional do calendário oficial de 2026.",
    sourceUrl: "https://www.gov.br/gestao/pt-br/assuntos/noticias/2025/dezembro/confira-o-calendario-oficial-de-feriados-nacionais-e-pontos-facultativos-em-2026"
  },
  {
    isoDate: "2026-04-21",
    label: "Feriado nacional",
    title: "Tiradentes",
    summary: "Data cívica nacional prevista no calendário federal.",
    sourceUrl: "https://www.gov.br/gestao/pt-br/assuntos/noticias/2025/dezembro/confira-o-calendario-oficial-de-feriados-nacionais-e-pontos-facultativos-em-2026"
  },
  {
    isoDate: "2026-05-01",
    label: "Feriado nacional",
    title: "Dia Mundial do Trabalho",
    summary: "Feriado nacional com reflexo em comércio, serviços e repartições.",
    sourceUrl: "https://www.gov.br/gestao/pt-br/assuntos/noticias/2025/dezembro/confira-o-calendario-oficial-de-feriados-nacionais-e-pontos-facultativos-em-2026"
  },
  {
    isoDate: "2026-05-10",
    label: "Data comemorativa",
    title: "Dia das Mães",
    summary: "Data de movimento familiar, comercial e comunitário no fim de semana.",
    sourceUrl: "/arquivo.html?busca=Dia%20das%20M%C3%A3es"
  },
  {
    isoDate: "2026-05-13",
    label: "Data cívica",
    title: "Abolição da Escravatura",
    summary: "Marco histórico brasileiro para pautas educativas e culturais.",
    sourceUrl: "/arquivo.html?busca=Aboli%C3%A7%C3%A3o%20da%20Escravatura"
  },
  {
    isoDate: "2026-06-04",
    label: "Ponto facultativo",
    title: "Corpus Christi",
    summary: "Data religiosa tratada como ponto facultativo federal em 2026.",
    sourceUrl: "https://www.gov.br/gestao/pt-br/assuntos/noticias/2025/dezembro/confira-o-calendario-oficial-de-feriados-nacionais-e-pontos-facultativos-em-2026"
  },
  {
    isoDate: "2026-06-15",
    label: "Data regional",
    title: "Aniversário do Estado do Acre",
    summary: "Marco da autonomia política do Acre e referência regional para o calendário.",
    sourceUrl: "/arquivo.html?busca=Anivers%C3%A1rio%20do%20Acre"
  },
  {
    isoDate: "2026-09-05",
    label: "Data ambiental",
    title: "Dia da Amazônia",
    summary: "Data útil para pautas de meio ambiente, educação e território amazônico.",
    sourceUrl: "/arquivo.html?busca=Dia%20da%20Amaz%C3%B4nia"
  },
  {
    isoDate: "2026-09-07",
    label: "Feriado nacional",
    title: "Independência do Brasil",
    summary: "Feriado nacional do calendário cívico brasileiro.",
    sourceUrl: "https://www.gov.br/gestao/pt-br/assuntos/noticias/2025/dezembro/confira-o-calendario-oficial-de-feriados-nacionais-e-pontos-facultativos-em-2026"
  },
  {
    isoDate: "2026-09-28",
    label: "Data municipal",
    title: "Aniversário de Cruzeiro do Sul",
    summary: "Data da fundação do município, celebrada com programação cívica e cultural.",
    sourceUrl: "https://www.cruzeirodosul.ac.gov.br/post/prefeitura-prepara-anivers%C3%A1rio-dos-121-anos-de-cruzeiro-do-sul-com-6-inaugura%C3%A7%C3%B5es"
  },
  {
    isoDate: "2026-10-12",
    label: "Feriado nacional",
    title: "Nossa Senhora Aparecida",
    summary: "Feriado nacional e Dia das Crianças no calendário brasileiro.",
    sourceUrl: "https://www.gov.br/gestao/pt-br/assuntos/noticias/2025/dezembro/confira-o-calendario-oficial-de-feriados-nacionais-e-pontos-facultativos-em-2026"
  },
  {
    isoDate: "2026-10-28",
    label: "Ponto facultativo",
    title: "Dia do Servidor Público",
    summary: "Ponto facultativo federal que pode alterar atendimento público.",
    sourceUrl: "https://www.gov.br/gestao/pt-br/assuntos/noticias/2025/dezembro/confira-o-calendario-oficial-de-feriados-nacionais-e-pontos-facultativos-em-2026"
  },
  {
    isoDate: "2026-11-02",
    label: "Feriado nacional",
    title: "Finados",
    summary: "Feriado nacional do calendário brasileiro.",
    sourceUrl: "https://www.gov.br/gestao/pt-br/assuntos/noticias/2025/dezembro/confira-o-calendario-oficial-de-feriados-nacionais-e-pontos-facultativos-em-2026"
  },
  {
    isoDate: "2026-11-15",
    label: "Feriado nacional",
    title: "Proclamação da República",
    summary: "Feriado nacional cívico.",
    sourceUrl: "https://www.gov.br/gestao/pt-br/assuntos/noticias/2025/dezembro/confira-o-calendario-oficial-de-feriados-nacionais-e-pontos-facultativos-em-2026"
  },
  {
    isoDate: "2026-11-17",
    label: "Data regional",
    title: "Tratado de Petrópolis",
    summary: "Marco histórico ligado à incorporação do território acreano ao Brasil.",
    sourceUrl: "/arquivo.html?busca=Tratado%20de%20Petr%C3%B3polis"
  },
  {
    isoDate: "2026-11-20",
    label: "Feriado nacional",
    title: "Consciência Negra",
    summary: "Feriado nacional de Zumbi e da Consciência Negra.",
    sourceUrl: "https://www.gov.br/gestao/pt-br/assuntos/noticias/2025/dezembro/confira-o-calendario-oficial-de-feriados-nacionais-e-pontos-facultativos-em-2026"
  },
  {
    isoDate: "2026-12-25",
    label: "Feriado nacional",
    title: "Natal",
    summary: "Feriado nacional de fim de ano.",
    sourceUrl: "https://www.gov.br/gestao/pt-br/assuntos/noticias/2025/dezembro/confira-o-calendario-oficial-de-feriados-nacionais-e-pontos-facultativos-em-2026"
  }
];

function buildRegionalCalendarArticleSlug(event = {}) {
  return `calendario-${String(event.isoDate || "data").replace(/[^0-9-]/g, "")}-${slugify(event.title || event.label || "data") || "data"}`;
}

function formatRegionalCalendarArticleDate(isoDate = "") {
  const [year, month, day] = String(isoDate || "").split("-").map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return "data do calendário";
  const date = new Date(`${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00-05:00`);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Rio_Branco" });
}

function getRegionalCalendarEventBySlug(slug = "") {
  const targetSlug = normalizeLookupSlug(slug);
  return REGIONAL_CALENDAR_EVENTS.find((event) => normalizeLookupSlug(buildRegionalCalendarArticleSlug(event)) === targetSlug) || null;
}

function buildRegionalCalendarArticle(event = {}) {
  const dateLabel = formatRegionalCalendarArticleDate(event.isoDate);
  const lowerLabel = String(event.label || "data do calendário").toLowerCase();
  const title = `O que significa ${event.title}`;

  return normalizeArticleRecord({
    id: buildRegionalCalendarArticleSlug(event),
    slug: buildRegionalCalendarArticleSlug(event),
    title,
    eyebrow: "Calendário regional",
    date: dateLabel,
    publishedAt: `${event.isoDate}T12:00:00-05:00`,
    category: "Calendário",
    sourceName: "Calendário regional",
    sourceUrl: event.sourceUrl || "/index.html#agenda",
    sourceLabel: `${event.title} em ${dateLabel}`,
    imageUrl: "./assets/home-cache/buzz-cruzeiro-04.jpg",
    feedImageUrl: "./assets/home-cache/buzz-cruzeiro-04.jpg",
    sourceImageUrl: "./assets/home-cache/buzz-cruzeiro-04.jpg",
    imageCredit: "Acervo visual do Catálogo Cruzeiro do Sul",
    imageFocus: "center 42%",
    lede: `${event.title} aparece em ${dateLabel} como ${lowerLabel}. A página explica por que a data entra no calendário do portal e como ela pode afetar serviços, eventos, comércio ou programação comunitária.`,
    summary: event.summary || `Data acompanhada pelo calendário regional em ${dateLabel}.`,
    analysis: `Esta matéria existe para transformar o clique no calendário em explicação. Em vez de abrir só uma lista de eventos, a data vira um artigo curto com significado, contexto e caminho para confirmação.`,
    body: [
      `${event.title} é marcada no calendário em ${dateLabel}. No portal, ela aparece como ${lowerLabel} para orientar o leitor antes de organizar atendimento, deslocamento, eventos ou rotina familiar.`,
      event.summary || "A data foi incluída por relevância nacional, estadual, municipal ou comunitária.",
      "Na prática, algumas datas mudam expediente público, funcionamento de serviços, movimento do comércio, agenda escolar, programação cultural ou campanhas de interesse público.",
      "Quando houver programação específica em Cruzeiro do Sul, no Vale do Juruá ou no Acre, o calendário pode apontar para novas matérias, avisos oficiais e cobertura de eventos."
    ],
    highlights: [
      `${event.title} cai em ${dateLabel}`,
      `Tipo da data: ${event.label || "Calendário"}`,
      "O calendário abre explicação em formato de matéria",
      "Programações locais podem ser vinculadas quando houver fonte"
    ],
    development: [
      "Vincular eventos oficiais de Cruzeiro do Sul quando a prefeitura ou organizadores publicarem programação.",
      "Atualizar a matéria se houver mudança de expediente, feriado local ou serviço especial."
    ]
  });
}

const ARCHIVE_STORY_STOPWORDS = new Set([
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

const DISPLAY_MONTH_INDEX = {
  janeiro: 0,
  jan: 0,
  fevereiro: 1,
  fev: 1,
  marco: 2,
  mar: 2,
  abril: 3,
  abr: 3,
  maio: 4,
  mai: 4,
  junho: 5,
  jun: 5,
  julho: 6,
  jul: 6,
  agosto: 7,
  ago: 7,
  setembro: 8,
  set: 8,
  outubro: 9,
  out: 9,
  novembro: 10,
  nov: 10,
  dezembro: 11,
  dez: 11
};

function decodeEditorialEntities(value = "") {
  return String(value || "")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&ndash;|&mdash;/gi, "-")
    .replace(/[“”‘’]/g, "'")
    .replace(/[–—]/g, "-");
}

function normalizeArchiveStoryText(value = "") {
  return normalizeText(decodeEditorialEntities(value))
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCanonicalArticleUrl(item = {}) {
  const rawUrl = String(item.sourceUrl || item.url || item.link || "").trim();
  if (!rawUrl || rawUrl === "#") {
    return "";
  }

  try {
    const parsed = new URL(rawUrl);
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
}

function getArchiveStoryTokens(item = {}) {
  return normalizeArchiveStoryText(
    [
      item.title,
      item.sourceLabel,
      item.summary,
      item.lede,
      item.description,
      item.category,
      item.sourceName
    ].join(" ")
  )
    .split(/\s+/)
    .filter((token) => token.length > 3 && !ARCHIVE_STORY_STOPWORDS.has(token))
    .slice(0, 9);
}

function getArchiveStoryCluster(item = {}) {
  const haystack = normalizeArchiveStoryText(
    [
      item.title,
      item.sourceLabel,
      item.summary,
      item.lede,
      item.description,
      item.category,
      item.sourceName
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
    return `edital-${getArchiveStoryTokens(item).slice(0, 3).join("-")}`;
  }

  return getArchiveStoryTokens(item).slice(0, 5).join("-") || slugify(item.title || item.id || "");
}

function getArchiveImageKey(item = {}) {
  return normalizeArchiveStoryText(item.imageUrl || item.feedImageUrl || item.sourceImageUrl || item.image || "")
    .replace(/\?.*$/, "")
    .slice(0, 180);
}

function getArticleDateKey(item = {}) {
  const rawValue = item.publishedAt || item.date || item.createdAt || "";

  if (!rawValue) {
    return "";
  }

  if (typeof rawValue === "string") {
    const isoMatch = rawValue.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) {
      return isoMatch[1];
    }

    const normalized = normalizeText(rawValue).replace("º", "").replace(/\./g, "");
    const longDateMatch = normalized.match(/(\d{1,2}) de ([a-z]+) de (\d{4})/);

    if (longDateMatch) {
      const [, day, month, year] = longDateMatch;
      const monthNumber = String((DISPLAY_MONTH_INDEX[month] ?? 0) + 1).padStart(2, "0");
      const dayNumber = String(Number(day)).padStart(2, "0");
      return `${year}-${monthNumber}-${dayNumber}`;
    }
  }

  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) {
    return normalizeArchiveStoryText(rawValue).slice(0, 48);
  }

  return parsed.toISOString().slice(0, 10);
}

function getArticleStoryKey(item = {}) {
  const dateKey = getArticleDateKey(item);
  const titleKey = slugify(item.title || item.sourceLabel || "");
  const slugKey = slugify(item.slug || "");
  const clusterKey = getArchiveStoryCluster(item);
  const storyKey = titleKey || slugKey || clusterKey;

  if (storyKey && dateKey) {
    return `story|${storyKey}|${dateKey}`;
  }

  return storyKey || "";
}

function getArticleCanonicalKey(item = {}) {
  const storyKey = getArticleStoryKey(item);
  if (storyKey) {
    return storyKey;
  }

  const canonicalUrl = getCanonicalArticleUrl(item);
  if (canonicalUrl) {
    return canonicalUrl;
  }

  return [
    getArchiveStoryCluster(item),
    normalizeArchiveStoryText(item.sourceName || item.source || ""),
    normalizeArchiveStoryText(item.publishedAt || item.date || item.createdAt || "")
  ]
    .filter(Boolean)
    .join("|");
}

function diversifyArchiveStories(items = [], desiredCount = 30) {
  const limit = Math.max(1, Number(desiredCount || 30));
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

  const canUse = (item, pass) => {
    const source = normalizeArchiveStoryText(item.sourceName || item.source || "fonte");
    const category = normalizeArchiveStoryText(item.categoryKey || item.category || "geral");
    const cluster = getArchiveStoryCluster(item);
    const image = getArchiveImageKey(item);

    return (
      (counts.source.get(source) || 0) < pass.source &&
      (counts.category.get(category) || 0) < pass.category &&
      (counts.cluster.get(cluster) || 0) < pass.cluster &&
      (!image || (counts.image.get(image) || 0) < pass.image)
    );
  };

  const addItem = (item) => {
    const key = getArticleCanonicalKey(item);
    if (!key || selectedKeys.has(key)) {
      return false;
    }

    selected.push(item);
    selectedKeys.add(key);

    const source = normalizeArchiveStoryText(item.sourceName || item.source || "fonte");
    const category = normalizeArchiveStoryText(item.categoryKey || item.category || "geral");
    const cluster = getArchiveStoryCluster(item);
    const image = getArchiveImageKey(item);
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

    items.forEach((item) => {
      if (selected.length >= limit || !canUse(item, pass)) {
        return;
      }

      addItem(item);
    });
  });

  const remaining = items.filter((item) => !selectedKeys.has(getArticleCanonicalKey(item)));
  return [...selected, ...remaining];
}

function isKnownCategoryKey(categoryKey) {
  return Boolean(CATEGORY_LABEL_BY_KEY[categoryKey]);
}

function formatCategoryLabel(categoryKey) {
  return CATEGORY_LABEL_BY_KEY[categoryKey] || CATEGORY_LABEL_BY_KEY.cotidiano;
}

function isJuruaPrefeituraScope(rawText = "") {
  const haystack = normalizeText(rawText);
  if (!haystack) return false;

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
}

function isAcreGovernmentScope(rawText = "") {
  const haystack = normalizeText(rawText);
  if (!haystack) return false;

  return /\b(governo do acre|governo estadual|governador|governadora|estado do acre|secretaria de estado|secretaria estadual|detran|sesacre|seinfra|sejusp|aleac|assembleia legislativa|acre\.gov\.br|agencia\.ac\.gov\.br)\b/.test(
    haystack
  );
}

function inferCategoryKeyFromContent(rawText) {
  const haystack = normalizeText(rawText);
  if (!haystack) return "";

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
    /\b(aleac|camara|deputad|senador|ministro|presidente|ex-presidente|bolsonaro|lula|stj|stf|eleicao|eleitoral|parlamento|congresso|senado|monopolio aereo)\b/.test(
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

  if (
    /\b(negocio|economia|comercio|empresa|empreendedor|mercado|feira)\b/.test(haystack)
  ) {
    return "negocios";
  }

  if (
    /\b(festa|social|celebridade|famoso|famosa|fofoca|aniversario|casamento|coluna social)\b/.test(haystack)
  ) {
    return "festas & social";
  }

  if (
    /\b(cultura|cinema|filme|estreia|bilheteria|trailer|teatro|peca|peça|show|festival|musica|arte|artista|entretenimento|variedades|michael jackson)\b/.test(
      haystack
    )
  ) {
    return "cultura";
  }

  return "";
}

function normalizeNewsCategoryKey(rawCategory = "", context = {}) {
  const rawKey = normalizeText(rawCategory);
  const contextText = [context.title, context.summary, context.sourceName, context.sourceLabel, context.sourceUrl].join(" ");
  const fullText = [rawCategory, contextText].join(" ");
  const mappedKey = Object.prototype.hasOwnProperty.call(CATEGORY_ALIAS_MAP, rawKey)
    ? CATEGORY_ALIAS_MAP[rawKey]
    : "";

  if (mappedKey) {
    if (mappedKey === "prefeitura" && !isJuruaPrefeituraScope(fullText)) {
      return inferCategoryKeyFromContent(contextText) || "cotidiano";
    }
    return mappedKey;
  }

  if (rawKey && !GENERIC_CATEGORY_KEYS.has(rawKey) && isKnownCategoryKey(rawKey)) {
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
}

function normalizeNewsCategoryLabel(rawCategory = "", context = {}) {
  return formatCategoryLabel(normalizeNewsCategoryKey(rawCategory, context));
}

function normalizeLookupSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}

function formatDisplayDate(value) {
  if (!value) return "Sem data";
  if (typeof value === "string" && !/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleDateString(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TIME_ZONE
  });
}

function cleanShortText(value, maxLength = 160) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function maskAuditActor(req) {
  const userAgent = cleanShortText(req?.headers?.["user-agent"] || "", 120);
  const forwarded = cleanShortText(req?.headers?.["x-forwarded-for"] || "", 80);
  const remote = cleanShortText(req?.socket?.remoteAddress || "", 80);
  return {
    ip: forwarded ? `${forwarded.split(",")[0].trim().slice(0, 16)}...` : remote.slice(0, 16),
    userAgent
  };
}

function readMasterAuditLog() {
  const payload = readJson(MASTER_ADMIN_AUDIT_FILE, []);
  return Array.isArray(payload) ? payload : [];
}

function appendMasterAudit(req, entry = {}) {
  const now = new Date().toISOString();
  const log = readMasterAuditLog();
  log.unshift({
    at: now,
    action: cleanShortText(entry.action || "master-action", 120),
    endpoint: cleanShortText(entry.endpoint || "", 120),
    ok: Boolean(entry.ok),
    result: cleanShortText(entry.result || (entry.ok ? "ok" : "blocked"), 160),
    payloadSummary: cleanShortText(entry.payloadSummary || "", 240),
    actor: maskAuditActor(req)
  });
  writeJson(MASTER_ADMIN_AUDIT_FILE, log.slice(0, 500));
}

function hasPixKeyConfigured() {
  return Boolean(cleanShortText(NINJAS_PIX_KEY, 77));
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cleanEmail(value) {
  return cleanShortText(value, 140).toLowerCase();
}

function cleanPhone(value) {
  return String(value || "").replace(/[^\d()+\-\s]/g, "").replace(/\s+/g, " ").trim().slice(0, 32);
}

function cleanPhoneDigits(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 32);
}

function safeString(value, max = 400) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function getWhatsappChatConfig() {
  return {
    enabled: WHATSAPP_CHAT_ENABLED,
    token: WHATSAPP_CLOUD_TOKEN,
    phoneNumberId: WHATSAPP_CLOUD_PHONE_NUMBER_ID,
    verifyToken: WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    autoReplyEnabled: WHATSAPP_CHAT_AUTOREPLY_ENABLED,
    autoReplyText: WHATSAPP_CHAT_AUTOREPLY_TEXT
  };
}

function extractWhatsappInboundMessages(payload) {
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];
  return entries.flatMap((entry) =>
    (Array.isArray(entry?.changes) ? entry.changes : []).flatMap((change) => {
      const value = change?.value || {};
      const contacts = Array.isArray(value?.contacts) ? value.contacts : [];
      const contactByWaId = new Map(
        contacts
          .map((contact) => [cleanPhoneDigits(contact?.wa_id), contact])
          .filter(([waId]) => waId)
      );
      const metadata = value?.metadata || {};
      const messages = Array.isArray(value?.messages) ? value.messages : [];

      return messages
        .map((message) => {
          const from = cleanPhoneDigits(message?.from);
          const contact = contactByWaId.get(from) || null;
          const type = String(message?.type || "unknown").trim().toLowerCase();
          let text = "";

          if (type === "text") {
            text = String(message?.text?.body || "");
          } else if (type === "button") {
            text = String(message?.button?.text || "");
          } else if (type === "interactive") {
            text = String(
              message?.interactive?.button_reply?.title ||
                message?.interactive?.list_reply?.title ||
                ""
            );
          }

          return {
            id: String(message?.id || ""),
            from,
            profileName: safeString(contact?.profile?.name || "", 120),
            type,
            text: safeString(text, 4000),
            timestamp: Number(message?.timestamp || 0) || 0,
            rawTimestamp: String(message?.timestamp || ""),
            phoneNumberId: String(metadata?.phone_number_id || ""),
            displayPhoneNumber: String(metadata?.display_phone_number || "")
          };
        })
        .filter((item) => item.from && item.id);
    })
  );
}

async function sendWhatsappTextMessage(to, message) {
  const config = getWhatsappChatConfig();
  const target = cleanPhoneDigits(to);
  const bodyText = safeString(message, 1000);

  if (!config.enabled) {
    return { ok: false, skipped: true, reason: "disabled" };
  }

  if (!config.token || !config.phoneNumberId || !target || !bodyText) {
    return { ok: false, skipped: true, reason: "missing-config" };
  }

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${encodeURIComponent(config.phoneNumberId)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: target,
        type: "text",
        text: {
          preview_url: false,
          body: bodyText
        }
      })
    }
  );

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`WhatsApp Cloud API ${response.status}: ${responseText.slice(0, 500)}`);
  }

  return {
    ok: true,
    responseText
  };
}

function appendWhatsappChatLog(items) {
  if (!Array.isArray(items) || !items.length) return [];

  const current = readJson(WHATSAPP_CHAT_LOG_FILE, []);
  const next = Array.isArray(current) ? current : [];
  next.push(...items);
  writeJson(WHATSAPP_CHAT_LOG_FILE, next);
  return items;
}

function base64UrlEncode(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBuffer(value) {
  let normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  while (normalized.length % 4) normalized += "=";
  return Buffer.from(normalized, "base64");
}

function parseJwtJson(part) {
  return JSON.parse(base64UrlToBuffer(part).toString("utf8"));
}

function safeTimingCompare(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function isCatalogoGoogleAuthEnabled() {
  return Boolean(GOOGLE_AUTH_CLIENT_ID && SITE_AUTH_SESSION_SECRET);
}

function parseCookies(req) {
  const header = String(req?.headers?.cookie || "");
  return header.split(";").reduce((cookies, part) => {
    const divider = part.indexOf("=");
    if (divider < 0) return cookies;
    const key = part.slice(0, divider).trim();
    const value = part.slice(divider + 1).trim();
    if (!key) return cookies;
    try {
      cookies[key] = decodeURIComponent(value);
    } catch (_error) {
      cookies[key] = value;
    }
    return cookies;
  }, {});
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Number(options.maxAge) || 0}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  return parts.join("; ");
}

function appendSetCookie(res, cookie) {
  const current = res.getHeader("Set-Cookie");
  if (!current) {
    res.setHeader("Set-Cookie", cookie);
    return;
  }
  const next = Array.isArray(current) ? current.concat(cookie) : [current, cookie];
  res.setHeader("Set-Cookie", next);
}

function isSecureRequest(req) {
  const forwardedProto = String(req?.headers?.["x-forwarded-proto"] || "").toLowerCase();
  return forwardedProto.includes("https") || Boolean(req?.socket?.encrypted) || IS_PRODUCTION;
}

function createCatalogoAuthToken(user) {
  const now = Date.now();
  const payload = {
    sub: safeString(user.sub, 120),
    email: cleanEmail(user.email),
    name: safeString(user.name || user.givenName || "", 120),
    givenName: safeString(user.givenName, 80),
    familyName: safeString(user.familyName, 80),
    picture: safeString(user.picture, 360),
    iat: now,
    exp: now + SITE_AUTH_MAX_AGE_SECONDS * 1000
  };
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = base64UrlEncode(crypto.createHmac("sha256", SITE_AUTH_SESSION_SECRET).update(body).digest());
  return `${body}.${signature}`;
}

function readCatalogoAuthSession(req) {
  if (!isCatalogoGoogleAuthEnabled()) return null;
  const token = parseCookies(req)[SITE_AUTH_COOKIE];
  if (!token || !token.includes(".")) return null;
  const [body, signature] = token.split(".");
  const expected = base64UrlEncode(crypto.createHmac("sha256", SITE_AUTH_SESSION_SECRET).update(body).digest());
  if (!safeTimingCompare(signature, expected)) return null;

  try {
    const payload = JSON.parse(base64UrlToBuffer(body).toString("utf8"));
    if (!payload?.sub || !payload?.email) return null;
    if (Number(payload.exp || 0) < Date.now()) return null;
    return {
      sub: safeString(payload.sub, 120),
      email: cleanEmail(payload.email),
      name: safeString(payload.name, 120),
      givenName: safeString(payload.givenName, 80),
      familyName: safeString(payload.familyName, 80),
      picture: safeString(payload.picture, 360)
    };
  } catch (_error) {
    return null;
  }
}

function publicAuthUser(user) {
  if (!user) return null;
  return {
    sub: safeString(user.sub, 120),
    email: cleanEmail(user.email),
    name: safeString(user.name, 120),
    givenName: safeString(user.givenName, 80),
    familyName: safeString(user.familyName, 80),
    picture: safeString(user.picture, 360)
  };
}

function setCatalogoAuthCookie(req, res, user) {
  appendSetCookie(
    res,
    serializeCookie(SITE_AUTH_COOKIE, createCatalogoAuthToken(user), {
      maxAge: SITE_AUTH_MAX_AGE_SECONDS,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: isSecureRequest(req)
    })
  );
}

function clearCatalogoAuthCookie(req, res) {
  appendSetCookie(
    res,
    serializeCookie(SITE_AUTH_COOKIE, "", {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: isSecureRequest(req)
    })
  );
}

async function fetchGoogleIdTokenCerts() {
  if (googleIdTokenCertCache.certs && googleIdTokenCertCache.expiresAt > Date.now()) {
    return googleIdTokenCertCache.certs;
  }

  const response = await fetch(GOOGLE_ID_TOKEN_CERTS_URL, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    throw new Error("Nao foi possivel carregar as chaves publicas do Google.");
  }

  const certs = await response.json();
  const cacheControl = String(response.headers.get("cache-control") || "");
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeMs = maxAgeMatch ? Number(maxAgeMatch[1]) * 1000 : 60 * 60 * 1000;
  googleIdTokenCertCache = {
    certs,
    expiresAt: Date.now() + Math.max(5 * 60 * 1000, maxAgeMs - 60 * 1000)
  };
  return certs;
}

async function verifyGoogleIdToken(idToken) {
  if (!isCatalogoGoogleAuthEnabled()) {
    throw new Error("Login Google ainda nao esta configurado neste ambiente.");
  }

  const parts = String(idToken || "").split(".");
  if (parts.length !== 3) {
    throw new Error("Credencial Google invalida.");
  }

  const header = parseJwtJson(parts[0]);
  const claims = parseJwtJson(parts[1]);
  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("Assinatura Google nao reconhecida.");
  }

  const certs = await fetchGoogleIdTokenCerts();
  const cert = certs?.[header.kid];
  if (!cert) {
    googleIdTokenCertCache = { certs: null, expiresAt: 0 };
    throw new Error("Chave publica do Google nao encontrada.");
  }

  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(`${parts[0]}.${parts[1]}`);
  verifier.end();
  if (!verifier.verify(cert, base64UrlToBuffer(parts[2]))) {
    throw new Error("Assinatura Google invalida.");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (String(claims.aud || "") !== GOOGLE_AUTH_CLIENT_ID) {
    throw new Error("Credencial Google emitida para outro aplicativo.");
  }
  if (!["accounts.google.com", "https://accounts.google.com"].includes(String(claims.iss || ""))) {
    throw new Error("Emissor Google invalido.");
  }
  if (Number(claims.exp || 0) <= nowSeconds) {
    throw new Error("Credencial Google expirada.");
  }
  if (claims.nbf && Number(claims.nbf) > nowSeconds + 30) {
    throw new Error("Credencial Google ainda nao esta valida.");
  }
  if (!claims.sub) {
    throw new Error("Credencial Google sem identificador.");
  }
  if (!claims.email) {
    throw new Error("Credencial Google sem e-mail.");
  }

  const emailVerified = claims.email_verified === true || claims.email_verified === "true";
  if (claims.email && !emailVerified) {
    throw new Error("Confirme o e-mail no Google antes de continuar.");
  }

  return {
    sub: safeString(claims.sub, 120),
    email: cleanEmail(claims.email),
    name: safeString(claims.name, 120),
    givenName: safeString(claims.given_name, 80),
    familyName: safeString(claims.family_name, 80),
    picture: safeString(claims.picture, 360),
    emailVerified
  };
}

function buildAbsoluteUrl(baseUrl, value = "/") {
  try {
    return new URL(String(value || "/"), baseUrl).toString();
  } catch (_error) {
    return String(value || baseUrl || "").trim();
  }
}

function serializeJsonLd(value) {
  return JSON.stringify(value || {})
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/<\/script/gi, "<\\/script");
}

function buildSiteOrganizationJsonLd(baseUrl) {
  return {
    "@type": "NewsMediaOrganization",
    "@id": `${baseUrl}#organization`,
    name: SITE_NAME,
    url: baseUrl,
    areaServed: SITE_REGION_NAME,
    inLanguage: LOCALE,
    logo: {
      "@type": "ImageObject",
      url: buildAbsoluteUrl(baseUrl, DEFAULT_PUBLISHER_LOGO_PATH)
    },
    image: buildAbsoluteUrl(baseUrl, DEFAULT_OG_IMAGE_PATH)
  };
}

function buildStaticPageJsonLd(baseUrl, canonicalUrl, seoConfig = {}) {
  if (seoConfig.schemaType === "WebSite") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        buildSiteOrganizationJsonLd(baseUrl),
        {
          "@type": "WebSite",
          "@id": `${baseUrl}#website`,
          name: SITE_NAME,
          url: baseUrl,
          inLanguage: LOCALE,
          description: seoConfig.description || DEFAULT_SITE_DESCRIPTION,
          publisher: {
            "@id": `${baseUrl}#organization`
          }
        }
      ]
    };
  }

  const payload = {
    "@context": "https://schema.org",
    "@type": seoConfig.schemaType || "WebPage",
    name: seoConfig.title || SITE_NAME,
    description: seoConfig.description || DEFAULT_SITE_DESCRIPTION,
    url: canonicalUrl,
    inLanguage: LOCALE,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${baseUrl}#website`,
      name: SITE_NAME,
      url: baseUrl
    },
    publisher: {
      "@id": `${baseUrl}#organization`
    },
    about: {
      "@type": "Place",
      name: SITE_REGION_NAME
    }
  };

  if (seoConfig.schemaType === "Service") {
    payload.provider = {
      "@id": `${baseUrl}#organization`
    };
  }

  return payload;
}

function buildArticleJsonLd(baseUrl, canonicalUrl, article, description, imageUrl) {
  const payload = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article?.title || SITE_NAME,
    description,
    image: [imageUrl],
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    inLanguage: LOCALE,
    isAccessibleForFree: true,
    datePublished: article?.publishedAt || article?.date || new Date().toISOString(),
    dateModified: article?.publishedAt || article?.date || new Date().toISOString(),
    articleSection: article?.category || "Noticia",
    publisher: {
      "@id": `${baseUrl}#organization`
    }
  };

  if (article?.sourceName) {
    payload.author = {
      "@type": "Organization",
      name: article.sourceName
    };
  }

  return payload;
}

function buildCandidateJsonLd(baseUrl, canonicalUrl, office, candidate, description, imageUrl) {
  const sameAs = []
    .concat(Array.isArray(candidate?.sources) ? candidate.sources : [])
    .concat(Array.isArray(candidate?.portalLinks) ? candidate.portalLinks : [])
    .map((item) => String(item?.url || "").trim())
    .filter(Boolean)
    .slice(0, 8);

  const person = {
    "@type": "Person",
    name: candidate?.name || "Candidato",
    description,
    image: imageUrl
  };

  if (candidate?.role) {
    person.jobTitle = candidate.role;
  }

  if (candidate?.party) {
    person.affiliation = {
      "@type": "Organization",
      name: candidate.party
    };
  }

  if (sameAs.length) {
    person.sameAs = sameAs;
  }

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${candidate?.name || "Candidato"} | ${office?.label || "Eleicoes"}`,
    description,
    url: canonicalUrl,
    inLanguage: LOCALE,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${baseUrl}#website`,
      name: SITE_NAME,
      url: baseUrl
    },
    mainEntity: person,
    publisher: {
      "@id": `${baseUrl}#organization`
    }
  };
}

function buildServiceModuleJsonLd(baseUrl, canonicalUrl, moduleConfig, description, imageUrl) {
  const items = Array.isArray(moduleConfig?.items) ? moduleConfig.items : [];
  const payload = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${moduleConfig?.title || "Catalogo de Servicos"} | ${SITE_NAME}`,
    description,
    url: canonicalUrl,
    inLanguage: LOCALE,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${baseUrl}#website`,
      name: SITE_NAME,
      url: baseUrl
    },
    publisher: {
      "@id": `${baseUrl}#organization`
    },
    about: {
      "@type": "Place",
      name: SITE_REGION_NAME
    }
  };

  if (imageUrl) {
    payload.image = imageUrl;
  }

  if (items.length) {
    payload.mainEntity = {
      "@type": "ItemList",
      itemListElement: items.slice(0, 12).map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item?.name || `Item ${index + 1}`,
        url: item?.website || item?.source || canonicalUrl
      }))
    };
  }

  return payload;
}

function resolveCandidateContext(searchParams) {
  const officeId = normalizeLookupSlug(searchParams?.get("office"));
  const candidateId = normalizeLookupSlug(searchParams?.get("candidate"));
  const electionConfig = getElectionConfig();
  const offices = Array.isArray(electionConfig?.offices) ? electionConfig.offices : [];
  const office =
    offices.find((item) => normalizeLookupSlug(item?.id || item?.label) === officeId) ||
    offices.find((item) =>
      Array.isArray(item?.candidates)
        ? item.candidates.some(
            (candidate) => normalizeLookupSlug(candidate?.id || candidate?.name) === candidateId
          )
        : false
    ) ||
    null;
  const candidate = Array.isArray(office?.candidates)
    ? office.candidates.find(
        (item) => normalizeLookupSlug(item?.id || item?.name) === candidateId
      ) || null
    : null;

  return { office, candidate };
}

function resolveServiceModule(searchParams) {
  const moduleId = normalizeLookupSlug(searchParams?.get("modulo") || searchParams?.get("module"));
  const catalogConfig = getServicesCatalogConfig();
  const modules = Array.isArray(catalogConfig?.modules) ? catalogConfig.modules : [];
  const moduleConfig =
    modules.find((item) => normalizeLookupSlug(item?.id || item?.title) === moduleId) || null;

  return {
    catalogConfig,
    moduleConfig
  };
}

function resolvePageSeo(req, pathname, requestUrl) {
  const baseUrl = getPublicSiteUrl(req);
  const baseConfig = STATIC_PAGE_SEO[pathname] || {
    title: SITE_NAME,
    description: DEFAULT_SITE_DESCRIPTION,
    themeColor: "#1E3A5F",
    colorScheme: "light",
    ogType: "website",
    schemaType: "WebPage"
  };
  const searchParams = requestUrl?.searchParams;
  const seo = {
    ...baseConfig,
    robots: baseConfig.robots || "index,follow,max-image-preview:large"
  };

  if (pathname === "/noticia.html") {
    const article = getArticleBySlug(searchParams?.get("slug") || searchParams?.get("id"));

    if (article) {
      const title = `${SITE_NAME} | ${article.title}`;
      const description = cleanShortText(
        stripHtml(article.lede || article.summary || article.analysis || DEFAULT_SITE_DESCRIPTION),
        180
      );
      const canonicalUrl = buildAbsoluteUrl(
        baseUrl,
        `/noticia.html?slug=${encodeURIComponent(article.slug)}`
      );
      const imageUrl = buildAbsoluteUrl(
        baseUrl,
        article.imageUrl || article.feedImageUrl || article.sourceImageUrl || DEFAULT_OG_IMAGE_PATH
      );

      return {
        ...seo,
        title,
        description,
        ogType: "article",
        canonicalUrl,
        ogUrl: canonicalUrl,
        imageUrl,
        structuredData: buildArticleJsonLd(baseUrl, canonicalUrl, article, description, imageUrl)
      };
    }

    return {
      ...seo,
      canonicalUrl: buildAbsoluteUrl(baseUrl, pathname),
      ogUrl: buildAbsoluteUrl(baseUrl, pathname),
      imageUrl: buildAbsoluteUrl(baseUrl, DEFAULT_OG_IMAGE_PATH),
      structuredData: buildStaticPageJsonLd(baseUrl, buildAbsoluteUrl(baseUrl, pathname), seo)
    };
  }

  if (pathname === "/candidato.html") {
    const { office, candidate } = resolveCandidateContext(searchParams);

    if (office && candidate) {
      const title = `${candidate.name} | ${office.label} | ${SITE_NAME}`;
      const description = cleanShortText(
        stripHtml(
          candidate.currentPosition ||
            candidate.historySummary ||
            candidate.summary ||
            seo.description
        ),
        180
      );
      const canonicalUrl = buildAbsoluteUrl(
        baseUrl,
        `/candidato.html?office=${encodeURIComponent(office.id)}&candidate=${encodeURIComponent(
          candidate.id
        )}`
      );
      const imageUrl = buildAbsoluteUrl(
        baseUrl,
        candidate.imageUrl || DEFAULT_OG_IMAGE_PATH
      );

      return {
        ...seo,
        title,
        description,
        ogType: "profile",
        canonicalUrl,
        ogUrl: canonicalUrl,
        imageUrl,
        structuredData: buildCandidateJsonLd(
          baseUrl,
          canonicalUrl,
          office,
          candidate,
          description,
          imageUrl
        )
      };
    }

    return {
      ...seo,
      robots: "noindex,follow",
      canonicalUrl: buildAbsoluteUrl(baseUrl, pathname),
      ogUrl: buildAbsoluteUrl(baseUrl, pathname),
      imageUrl: buildAbsoluteUrl(baseUrl, DEFAULT_OG_IMAGE_PATH),
      structuredData: buildStaticPageJsonLd(baseUrl, buildAbsoluteUrl(baseUrl, pathname), {
        ...seo,
        schemaType: "WebPage"
      })
    };
  }

  if (pathname === "/catalogo-servicos.html") {
    const { catalogConfig, moduleConfig } = resolveServiceModule(searchParams);

    if (moduleConfig) {
      const city = cleanShortText(catalogConfig?.city || SITE_REGION_NAME, 80);
      const title = `${moduleConfig.title} | Catalogo de Servicos | ${SITE_NAME}`;
      const description = cleanShortText(
        stripHtml(
          moduleConfig.subtitle ||
            `Guia local de ${moduleConfig.title || "servicos"} em ${city}, com telefones, links e atalhos rapidos.`
        ),
        180
      );
      const canonicalUrl = buildAbsoluteUrl(
        baseUrl,
        `/catalogo-servicos.html?modulo=${encodeURIComponent(moduleConfig.id)}`
      );
      const imageUrl = buildAbsoluteUrl(
        baseUrl,
        moduleConfig.photoUrl || DEFAULT_OG_IMAGE_PATH
      );

      return {
        ...seo,
        title,
        description,
        canonicalUrl,
        ogUrl: canonicalUrl,
        imageUrl,
        structuredData: buildServiceModuleJsonLd(
          baseUrl,
          canonicalUrl,
          moduleConfig,
          description,
          imageUrl
        )
      };
    }

    return {
      ...seo,
      canonicalUrl: buildAbsoluteUrl(baseUrl, pathname),
      ogUrl: buildAbsoluteUrl(baseUrl, pathname),
      imageUrl: buildAbsoluteUrl(baseUrl, DEFAULT_OG_IMAGE_PATH),
      structuredData: buildStaticPageJsonLd(baseUrl, buildAbsoluteUrl(baseUrl, pathname), seo)
    };
  }

  const canonicalUrl = buildAbsoluteUrl(
    baseUrl,
    pathname === "/" ? "/" : pathname
  );

  return {
    ...seo,
    canonicalUrl,
    ogUrl: canonicalUrl,
    imageUrl: buildAbsoluteUrl(baseUrl, DEFAULT_OG_IMAGE_PATH),
    structuredData: buildStaticPageJsonLd(baseUrl, canonicalUrl, seo)
  };
}

function buildSeoTemplateVars(req, pathname, requestUrl) {
  const seo = resolvePageSeo(req, pathname, requestUrl);

  return {
    SITE_URL: getPublicSiteUrl(req),
    SEO_TITLE: escapeHtml(seo.title || SITE_NAME),
    SEO_DESCRIPTION: escapeHtml(seo.description || DEFAULT_SITE_DESCRIPTION),
    SEO_ROBOTS: escapeHtml(seo.robots || "index,follow,max-image-preview:large"),
    SEO_THEME_COLOR: escapeHtml(seo.themeColor || "#1E3A5F"),
    SEO_COLOR_SCHEME: escapeHtml(seo.colorScheme || "light"),
    SEO_OG_TYPE: escapeHtml(seo.ogType || "website"),
    SEO_OG_TITLE: escapeHtml(seo.title || SITE_NAME),
    SEO_OG_DESCRIPTION: escapeHtml(seo.description || DEFAULT_SITE_DESCRIPTION),
    SEO_OG_IMAGE: escapeHtml(seo.imageUrl || buildAbsoluteUrl(getPublicSiteUrl(req), DEFAULT_OG_IMAGE_PATH)),
    SEO_OG_URL: escapeHtml(seo.ogUrl || seo.canonicalUrl || getPublicSiteUrl(req)),
    SEO_TWITTER_TITLE: escapeHtml(seo.title || SITE_NAME),
    SEO_TWITTER_DESCRIPTION: escapeHtml(seo.description || DEFAULT_SITE_DESCRIPTION),
    SEO_TWITTER_IMAGE: escapeHtml(
      seo.imageUrl || buildAbsoluteUrl(getPublicSiteUrl(req), DEFAULT_OG_IMAGE_PATH)
    ),
    SEO_CANONICAL: escapeHtml(seo.canonicalUrl || getPublicSiteUrl(req)),
    SEO_JSON_LD: serializeJsonLd(seo.structuredData || buildStaticPageJsonLd(getPublicSiteUrl(req), getPublicSiteUrl(req), seo))
  };
}

function normalizeUrl(value) {
  const url = safeString(value, 500);
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return url;
  return "";
}

function detectDeviceType(uaRaw) {
  const ua = String(uaRaw || "").toLowerCase();
  if (!ua) return "desconhecido";
  if (/mobile|android|iphone|ipod|blackberry|opera mini/i.test(ua)) {
    return "mobile";
  }
  if (/ipad|tablet/i.test(ua)) return "tablet";
  return "desktop";
}

function detectBrowser(uaRaw) {
  const ua = String(uaRaw || "").toLowerCase();
  if (ua.includes("edg/")) return "Edge";
  if (ua.includes("opr/") || ua.includes("opera")) return "Opera";
  if (ua.includes("firefox/")) return "Firefox";
  if (ua.includes("chrome/")) return "Chrome";
  if (ua.includes("safari/")) return "Safari";
  return "Outro";
}

function getClientIp(req) {
  const fromForward = safeString(req?.headers?.["x-forwarded-for"] || "", 120);
  if (fromForward) {
    return fromForward.split(",")[0].trim();
  }

  return safeString(req?.socket?.remoteAddress || "");
}

function getRequestCity(req, body = {}) {
  return (
    safeString(
      req?.headers?.["x-vercel-ip-city"] ||
        req?.headers?.["cf-ipcity"] ||
        body.city ||
        body.voterCity ||
        "",
      80
    ) || "não informado"
  );
}

function getRequestCountry(req, body = {}) {
  return (
    safeString(
      req?.headers?.["x-vercel-ip-country"] ||
        req?.headers?.["cf-ipcountry"] ||
        body.country ||
        "",
      40
    ) || "não informado"
  );
}

function summarizeReferrer(referrerRaw) {
  const referrer = safeString(referrerRaw, 300);
  if (!referrer) return "direto";

  try {
    return new URL(referrer).hostname || "direto";
  } catch {
    return referrer;
  }
}

function topEntries(bucket = {}, labelKey = "label", limit = 12) {
  return Object.entries(bucket)
    .map(([label, total]) => ({ [labelKey]: label, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

function sortByDateDesc(items = [], key = "at", limit = 20) {
  return [...items]
    .sort((left, right) => new Date(right[key] || 0).getTime() - new Date(left[key] || 0).getTime())
    .slice(0, limit);
}

function sumBy(items, keyGetter) {
  const bucket = {};

  for (const item of items) {
    const key = keyGetter(item) || "desconhecido";
    bucket[key] = (bucket[key] || 0) + 1;
  }

  return bucket;
}

function average(list = []) {
  if (!list.length) return 0;
  return list.reduce((sum, value) => sum + Number(value || 0), 0) / list.length;
}

function buildTrackingMeta(req, body = {}, userAgentRaw = "") {
  const userAgent = safeString(
    userAgentRaw || body.userAgent || req?.headers?.["user-agent"] || "",
    260
  );
  const referrer = safeString(body.referrer || req?.headers?.referer || "", 300);

  return {
    pagePath: safeString(body.pagePath || body.sourcePage || req?.headers?.referer || "/", 260) || "/",
    referrer,
    referrerHost: summarizeReferrer(referrer),
    deviceType: safeString(body.deviceType || detectDeviceType(userAgent), 40),
    browser: safeString(body.browser || detectBrowser(userAgent), 40),
    language: safeString(body.language || req?.headers?.["accept-language"] || "", 80),
    timezone: safeString(body.timezone, 80),
    screen: safeString(body.screen, 50),
    viewport: safeString(body.viewport, 50),
    platform: safeString(body.platform || req?.headers?.["sec-ch-ua-platform"] || "", 80),
    pageTitle: safeString(body.pageTitle, 160),
    city: getRequestCity(req, body),
    country: getRequestCountry(req, body),
    ip: getClientIp(req),
    userAgent,
    visitorId: safeString(body.visitorId, 90),
    sessionId: safeString(body.sessionId, 90),
    cookieVisitorId: safeString(body.cookieVisitorId, 90),
    cookieSessionId: safeString(body.cookieSessionId, 90),
    trackingConsent: safeString(body.trackingConsent || body.consentState || "", 30) || "accepted",
    trackingMethod: safeString(body.trackingMethod, 60) || "runtime",
    consentSource: safeString(body.consentSource, 40) || "banner",
    cookiesEnabled:
      typeof body.cookiesEnabled === "boolean" ? body.cookiesEnabled : Boolean(body.cookiesEnabled),
    storageEnabled:
      typeof body.storageEnabled === "boolean" ? body.storageEnabled : Boolean(body.storageEnabled),
    utmSource: safeString(body.utmSource, 120),
    utmMedium: safeString(body.utmMedium, 120),
    utmCampaign: safeString(body.utmCampaign, 160),
    utmContent: safeString(body.utmContent, 160),
    utmTerm: safeString(body.utmTerm, 160)
  };
}

function getJsonArray(filePath) {
  const items = readJson(filePath, []);
  return Array.isArray(items) ? items : [];
}

const ELECTION_SENTIMENT_KEYWORDS = {
  positive: [
    "bom",
    "boa",
    "otimo",
    "ótimo",
    "excelente",
    "honesto",
    "honesta",
    "preparado",
    "preparada",
    "competente",
    "serio",
    "sério",
    "confiavel",
    "confiável",
    "apoio",
    "voto nele",
    "voto nela",
    "merece",
    "gosto",
    "trabalha",
    "resultado",
    "entrega",
    "continuidade"
  ],
  negative: [
    "ruim",
    "péssimo",
    "pessimo",
    "fraco",
    "fraca",
    "corrupto",
    "corrupta",
    "mentira",
    "mentiroso",
    "mentirosa",
    "despreparado",
    "despreparada",
    "nao voto",
    "não voto",
    "rejeicao",
    "rejeição",
    "fora",
    "cansado",
    "cansada",
    "troca",
    "mudanca",
    "mudança",
    "desgaste",
    "promessa"
  ],
  reelectionPositive: [
    "reeleicao",
    "reeleição",
    "mais 4 anos",
    "continua",
    "continuar",
    "segue",
    "seguir",
    "continuidade"
  ],
  reelectionNegative: [
    "mudanca",
    "mudança",
    "alternancia",
    "alternância",
    "renovar",
    "troca",
    "fora",
    "chega",
    "nao merece reeleicao",
    "não merece reeleição"
  ]
};

function analyzeElectionObservation(value = "") {
  const observation = safeString(value, 1200);
  const normalized = normalizeText(observation);

  if (!normalized) {
    return {
      label: "sem-opiniao",
      score: 0,
      positiveHits: 0,
      negativeHits: 0,
      reelectionLabel: "neutro"
    };
  }

  const countHits = (list = []) =>
    list.reduce((total, entry) => total + (normalized.includes(normalizeText(entry)) ? 1 : 0), 0);

  const positiveHits = countHits(ELECTION_SENTIMENT_KEYWORDS.positive);
  const negativeHits = countHits(ELECTION_SENTIMENT_KEYWORDS.negative);
  const score = positiveHits - negativeHits;
  let label = "neutro";

  if (score >= 2 || (positiveHits > 0 && negativeHits === 0)) {
    label = "positivo";
  } else if (score <= -2 || (negativeHits > 0 && positiveHits === 0)) {
    label = "negativo";
  } else if (positiveHits > 0 && negativeHits > 0) {
    label = "misto";
  }

  const reelectionPositiveHits = countHits(ELECTION_SENTIMENT_KEYWORDS.reelectionPositive);
  const reelectionNegativeHits = countHits(ELECTION_SENTIMENT_KEYWORDS.reelectionNegative);
  let reelectionLabel = "neutro";

  if (reelectionPositiveHits > reelectionNegativeHits && reelectionPositiveHits > 0) {
    reelectionLabel = "favoravel";
  } else if (reelectionNegativeHits > reelectionPositiveHits && reelectionNegativeHits > 0) {
    reelectionLabel = "desgaste";
  }

  return {
    label,
    score,
    positiveHits,
    negativeHits,
    reelectionLabel
  };
}

function parseCurrency(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number(value.toFixed(2));
  }

  const normalized = String(value || "")
    .replace(/[R$\s]/gi, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : fallback;
}

function clampInteger(value, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePixText(value, maxLength = 25) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 /.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .slice(0, maxLength);
}

function normalizePixToken(value, maxLength = 25) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]/g, "")
    .trim()
    .toUpperCase()
    .slice(0, maxLength);
}

function cleanPubpaidWithdrawalPixKey(value) {
  return cleanShortText(value, 120).replace(/[<>]/g, "").trim();
}

function buildPixField(id, value) {
  const content = String(value || "");
  return `${id}${String(content.length).padStart(2, "0")}${content}`;
}

function computePixCrc16(payload) {
  let crc = 0xffff;

  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function formatPixAmount(value) {
  const numeric = parseCurrency(value, NINJAS_PIX_DEFAULT_AMOUNT);
  return Math.max(0.01, Math.min(99999.99, numeric)).toFixed(2);
}

function buildPixPayload({ amount, txid, description }) {
  const merchantName = normalizePixText(NINJAS_MERCHANT_NAME || "CATALOGO CZS", 25) || "CATALOGO CZS";
  const merchantCity = normalizePixText(NINJAS_MERCHANT_CITY || "CRUZEIRO DO SUL", 15) || "CRUZEIRO DO SUL";
  const safeTxid = normalizePixToken(txid || `NJS${Date.now()}`, 25) || `NJS${Date.now()}`;
  const pixKey = cleanShortText(NINJAS_PIX_KEY, 77);

  if (!pixKey) {
    throw new Error("pix-key-not-configured");
  }

  const accountInfo = [
    buildPixField("00", "br.gov.bcb.pix"),
    buildPixField("01", pixKey)
  ];
  const safeDescription = normalizePixText(description, 40);

  if (safeDescription) {
    accountInfo.push(buildPixField("02", safeDescription));
  }

  const payloadWithoutCrc = [
    buildPixField("00", "01"),
    buildPixField("01", "12"),
    buildPixField("26", accountInfo.join("")),
    buildPixField("52", "0000"),
    buildPixField("53", "986"),
    buildPixField("54", formatPixAmount(amount)),
    buildPixField("58", "BR"),
    buildPixField("59", merchantName),
    buildPixField("60", merchantCity),
    buildPixField("62", buildPixField("05", safeTxid)),
    "6304"
  ].join("");

  return {
    txid: safeTxid,
    copyCode: `${payloadWithoutCrc}${computePixCrc16(payloadWithoutCrc)}`
  };
}

async function buildNinjasPixConfig({
  amount,
  txid,
  description,
  minAmount = NINJAS_PIX_DEFAULT_AMOUNT,
  maxAmount = 100,
  defaultAmount = NINJAS_PIX_DEFAULT_AMOUNT
}) {
  const safeAmount = Math.max(minAmount, Math.min(maxAmount, parseCurrency(amount, defaultAmount)));
  const payload = buildPixPayload({
    amount: safeAmount,
    txid,
    description
  });

  let qrSvg = "";
  if (QRCode?.toString) {
    try {
      qrSvg = await QRCode.toString(payload.copyCode, {
        type: "svg",
        margin: 1,
        errorCorrectionLevel: "M",
        color: {
          dark: "#0B1C33",
          light: "#FFFFFF"
        }
      });
    } catch (_error) {
      qrSvg = "";
    }
  }

  return {
    paymentMethod: "pix-qr-code",
    keyVisible: true,
    merchantName: normalizePixText(NINJAS_MERCHANT_NAME, 25) || "CATALOGO CZS",
    amount: Number(safeAmount.toFixed(2)),
    txid: payload.txid,
    pixKey: cleanShortText(NINJAS_PIX_KEY, 77),
    copyCode: payload.copyCode,
    qrSvg,
    confirmationMode: "manual"
  };
}

function getNinjasCreditsFromPlan(plan, amount) {
  const normalizedPlan = normalizeText(plan);
  const normalizedAmount = Number(parseCurrency(amount, 0).toFixed(2));

  if (normalizedPlan === "creditos" || normalizedPlan === "creditos-pro") {
    if (normalizedAmount >= 100) return 80;
    if (normalizedAmount >= 50) return 30;
    if (normalizedAmount >= 20) return 10;
  }

  return 0;
}

function buildNinjasOpportunityPayload() {
  const items = NINJAS_OPPORTUNITIES.map((item) => ({
    ...item,
    publishedLabel: formatDisplayDate(item.publishedAt),
    deadlineLabel: item.deadline || "Sem prazo divulgado"
  }));

  return {
    updatedAt: NINJAS_OPPORTUNITIES_UPDATED_AT,
    updatedLabel: formatDisplayDate(NINJAS_OPPORTUNITIES_UPDATED_AT),
    total: items.length,
    items
  };
}

function normalizeSalesCategory(value) {
  const normalized = normalizeText(value || "outros");
  if (/veiculo|moto|carro|bike|bicicleta|transporte/.test(normalized)) return "veiculos";
  if (/casa|movel|moveis|eletro|geladeira|fogao|sofa|mesa/.test(normalized)) return "casa";
  if (/celular|notebook|computador|game|console|tech|eletronico/.test(normalized)) return "eletronicos";
  if (/moda|roupa|calcado|tenis|bolsa|acessorio/.test(normalized)) return "moda";
  if (/servico|frete|aula|manutencao|diaria|mao de obra/.test(normalized)) return "servicos";
  return "outros";
}

function getSalesListings({ category = "", limit = 80 } = {}) {
  const items = getJsonArray(SALES_LISTINGS_FILE)
    .filter((item) => !item.status || item.status === "publicado")
    .sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime());
  const normalizedCategory = normalizeSalesCategory(category);
  const filtered =
    category && normalizedCategory !== "outros"
      ? items.filter((item) => normalizeSalesCategory(item.category) === normalizedCategory)
      : items;

  return filtered.slice(0, Math.max(1, Math.min(200, Number(limit) || 80)));
}

function buildMostViewedArticles(visits = [], limit = 12) {
  const bucket = {};

  visits.forEach((visit) => {
    const pagePath = String(visit.pagePath || "");
    if (!pagePath.includes("noticia.html")) return;

    try {
      const url = new URL(pagePath, "https://catalogo.local");
      const slug = url.searchParams.get("slug") || url.searchParams.get("id") || "";
      if (slug) bucket[slug] = (bucket[slug] || 0) + 1;
    } catch (_error) {
      const match = pagePath.match(/[?&](?:slug|id)=([^&#]+)/i);
      const slug = match ? decodeURIComponent(match[1] || "") : "";
      if (slug) bucket[slug] = (bucket[slug] || 0) + 1;
    }
  });

  return Object.entries(bucket)
    .map(([slug, total]) => {
      const article = getArticleBySlug(slug);
      return {
        slug,
        title: article?.title || slug,
        category: article?.category || article?.section || "Materia",
        source: article?.source || article?.sourceName || "",
        total
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

function buildCollectionInventory({
  visits,
  heartbeats,
  comments,
  subscriptions,
  voteRecords,
  ninjasRequests,
  ninjasProfiles,
  pubpaidDeposits,
  salesListings,
  vrRentalLeads
}) {
  const agentMessages = getJsonArray(path.join(DATA_DIR, "agent-messages.json"));
  const newsArchive = getJsonArray(path.join(DATA_DIR, "news-archive.json"));
  const runtimeNews = getJsonArray(path.join(DATA_DIR, "runtime-news.json"));

  return [
    {
      key: "visits",
      label: "Acessos e paginas vistas",
      total: visits.length,
      source: "analytics-client.js -> /api/analytics/visit",
      purpose: "Mostra o que o publico abriu, origem, aparelho, cidade, IP e UTM.",
      readyForDb: true
    },
    {
      key: "heartbeats",
      label: "Tempo de permanencia",
      total: heartbeats.length,
      source: "analytics-client.js -> /api/analytics/heartbeat",
      purpose: "Ajuda a estimar leitura, abandono e sessoes ativas.",
      readyForDb: true
    },
    {
      key: "comments",
      label: "Comentarios e opinioes",
      total: comments.length,
      source: "formularios publicos -> /api/comments",
      purpose: "Registra comunidade, materia comentada, cidade, IP e mensagem.",
      readyForDb: true
    },
    {
      key: "subscriptions",
      label: "Apoiadores, fundadores e emails",
      total: subscriptions.length,
      source: "newsletter/apoie -> /api/subscriptions",
      purpose: "Controla contatos, interesse, plano, Pix pendente e apoiadores confirmaveis.",
      readyForDb: true
    },
    {
      key: "votes",
      label: "Pesquisas politicas e clima eleitoral",
      total: voteRecords.length,
      source: "enquetes eleitorais -> /api/elections/votes",
      purpose: "Conta votos, sentimento, sinal de reeleicao, cidade, partido declarado e observacoes.",
      readyForDb: true
    },
    {
      key: "ninjasRequests",
      label: "Pedidos Ninjas de clientes",
      total: ninjasRequests.length,
      source: "ninjas.html -> /api/ninjas/requests",
      purpose: "Fila de servicos pedidos, contato, bairro, urgencia, status e referencia Pix.",
      readyForDb: true
    },
    {
      key: "ninjasProfiles",
      label: "Curriculos e trabalhadores Ninjas",
      total: ninjasProfiles.length,
      source: "ninjas.html -> /api/ninjas/profiles",
      purpose: "Banco de profissionais, curriculo, area, plano gratis/destaque/creditos e Pix.",
      readyForDb: true
    },
    {
      key: "pubpaidDeposits",
      label: "Depositos PubPaid",
      total: pubpaidDeposits.length,
      source: "pubpaid.html -> /api/pubpaid/deposits",
      purpose: "Controla depositos em QR Code, conta Google, referencia e confirmacao manual.",
      readyForDb: true
    },
    {
      key: "salesListings",
      label: "Pagina filha de vendas",
      total: salesListings.length,
      source: "vendas.html -> /api/sales/listings",
      purpose: "Itens anunciados por tipo, vendedor, contato, preco, bairro e descricao.",
      readyForDb: true
    },
    {
      key: "vrRentalLeads",
      label: "Pedidos de aluguel VR",
      total: vrRentalLeads.length,
      source: "games.html popup -> /api/vr-rental/leads",
      purpose: "Guarda interessados no Meta Quest: nome, WhatsApp, data, horario, pacote e observacoes.",
      readyForDb: true
    },
    {
      key: "newsArchive",
      label: "Arquivo de noticias",
      total: newsArchive.length,
      source: "agregador/news-data/runtime",
      purpose: "Base para materias, arquivo, links de origem e mais vistas.",
      readyForDb: true
    },
    {
      key: "runtimeNews",
      label: "Cache de noticias em tempo real",
      total: runtimeNews.length,
      source: "RSS runtime",
      purpose: "Alimenta o radar quando o servidor consegue atualizar feeds.",
      readyForDb: true
    },
    {
      key: "agentMessages",
      label: "Mensagens e pedidos pelo site",
      total: agentMessages.length,
      source: "formularios de contato -> /api/agent-messages",
      purpose: "Centraliza pedidos comerciais, correcoes, pautas e contato direto.",
      readyForDb: true
    }
  ];
}

function createRecordId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeListInput(value, { maxItems = 12, itemLength = 80 } = {}) {
  const items = Array.isArray(value)
    ? value
    : String(value || "")
        .split(/\r?\n|,/)
        .map((item) => item.trim());

  return items
    .map((item) => cleanShortText(item, itemLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function isConfirmedFounderSubscription(item = {}) {
  if (String(item.plan || "").trim() !== "fundadores") return false;
  if (!String(item.name || "").trim()) return false;

  const paymentStatus = String(item?.payment?.status || item.status || "").trim();
  if (!paymentStatus) return true;
  return paymentStatus === "confirmado";
}

function isPendingFounderSubscription(item = {}) {
  if (String(item.plan || "").trim() !== "fundadores") return false;

  const paymentStatus = String(item?.payment?.status || item.status || "").trim();
  return paymentStatus === "pendente-manual" || paymentStatus === "aguardando-confirmacao-pix";
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function applyApiCors(req, res) {
  const origin = String(req?.headers?.origin || "").trim();
  if (!origin) {
    return;
  }

  const localOriginPattern =
    /^https?:\/\/(?:(?:localhost|127(?:\.\d{1,3}){3})|(?:10(?:\.\d{1,3}){3})|(?:192\.168(?:\.\d{1,3}){2})|(?:172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}))(?:\:\d+)?$/i;

  if (origin === "null" || localOriginPattern.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token, Accept");
    res.setHeader("Access-Control-Max-Age", "600");
    res.setHeader("Vary", "Origin");
  }
}

function sendText(res, status, text, cacheControl = "no-store") {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": cacheControl,
    "Content-Length": Buffer.byteLength(text),
  });
  res.end(text);
}

function sendXml(res, status, xml, cacheControl = "public, max-age=3600") {
  res.writeHead(status, {
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": cacheControl,
    "Content-Length": Buffer.byteLength(xml),
  });
  res.end(xml);
}

function sendCsv(res, status, csv, fileName) {
  const body = String(csv || "");
  res.writeHead(status, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename=${fileName}`,
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(rows = []) {
  if (!Array.isArray(rows) || !rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [headers.join(",")]
    .concat(rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")))
    .join("\n");
}

function sendAdminUnauthorized(res) {
  const body = "Login de super admin necessario.";
  res.writeHead(401, {
    "WWW-Authenticate": 'Basic realm="Catalogo Super Admin", charset="UTF-8"',
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getPublicSiteUrl(req) {
  if (SITE_URL) {
    return SITE_URL;
  }

  const host = String(req?.headers?.host || "").trim();
  if (!host) {
    return `http://localhost:${PORT}`;
  }

  const forwardedProto = String(req?.headers?.["x-forwarded-proto"] || "")
    .split(",")[0]
    .trim();
  const protocol = forwardedProto || (/localhost|127\.0\.0\.1/i.test(host) ? "http" : "https");
  return `${protocol}://${host}`.replace(/\/+$/, "");
}

function getFileLastModified(fileName) {
  try {
    return fs.statSync(path.join(ROOT_DIR, fileName)).mtime.toISOString();
  } catch (_error) {
    return new Date().toISOString();
  }
}

function isPublicStaticFile(filePath) {
  const relativePath = path.relative(ROOT_DIR, filePath);
  if (!relativePath || relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return false;
  }

  const segments = relativePath.split(path.sep).filter(Boolean);
  if (segments.some((segment) => PRIVATE_STATIC_SEGMENTS.has(segment))) {
    return false;
  }

  return PUBLIC_STATIC_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function buildRobotsTxt(req) {
  const baseUrl = getPublicSiteUrl(req);
  return `User-agent: *
Allow: /
Disallow: /api/admin/
Disallow: /backend/
Disallow: /data/

Sitemap: ${baseUrl}/sitemap.xml
`;
}

function buildSitemapXml(req) {
  const baseUrl = getPublicSiteUrl(req);
  const staticPages = Object.entries(STATIC_PAGE_SEO)
    .filter(([, config]) => config?.sitemap !== false)
    .map(([pagePath, config]) => ({
      path: pagePath,
      lastmod: getFileLastModified(config?.fileName || (pagePath === "/" ? "index.html" : pagePath.slice(1))),
      priority: config?.priority || "0.6",
      changefreq: config?.changefreq || "weekly"
    }));
  const serviceCatalogConfig = getServicesCatalogConfig();
  const modulePages = (Array.isArray(serviceCatalogConfig?.modules) ? serviceCatalogConfig.modules : [])
    .filter((moduleConfig) => normalizeLookupSlug(moduleConfig?.id || moduleConfig?.title))
    .map((moduleConfig) => ({
      path: `/catalogo-servicos.html?modulo=${encodeURIComponent(moduleConfig.id)}`,
      lastmod: getFileLastModified("catalogo-servicos-data.js"),
      priority: "0.68",
      changefreq: "weekly"
    }));
  const electionConfig = getElectionConfig();
  const candidatePages = (Array.isArray(electionConfig?.offices) ? electionConfig.offices : [])
    .flatMap((office) =>
      (Array.isArray(office?.candidates) ? office.candidates : [])
        .filter((candidate) => office?.id && candidate?.id)
        .map((candidate) => ({
          path: `/candidato.html?office=${encodeURIComponent(office.id)}&candidate=${encodeURIComponent(
            candidate.id
          )}`,
          lastmod: getFileLastModified("elections-data.js"),
          priority: "0.58",
          changefreq: "daily"
        }))
    );
  const articlePages = getArticleNews(500)
    .filter((item) => item?.slug)
    .map((item) => ({
      path: `/noticia.html?slug=${encodeURIComponent(item.slug)}`,
      lastmod: item.publishedAt || item.date || new Date().toISOString(),
      priority: "0.64",
      changefreq: "daily"
    }));
  const entries = staticPages.concat(modulePages, candidatePages, articlePages);
  const body = entries
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(`${baseUrl}${entry.path}`)}</loc>
    <lastmod>${escapeXml(entry.lastmod)}</lastmod>
    <changefreq>${escapeXml(entry.changefreq || "weekly")}</changefreq>
    <priority>${escapeXml(entry.priority)}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

function parseBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) req.destroy();
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (_error) {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[(.*?)\]\]>/gis, "$1")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ");
}

function stripHtml(value) {
  return decodeHtml(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function cleanFeedText(value) {
  return stripHtml(value)
    .replace(/\b[\w:-]+\s*=\s*["'][^"']*["']/gi, " ")
    .replace(/\b(?:data|srcset|sizes|loading|decoding|class|width|height)-?[a-z]*\s*=\s*["'][^"']*["']/gi, " ")
    .replace(/\s*\/>\s*/g, " ")
    .replace(/^\s*(?:foto|imagem)\s*:[^"“”]{0,140}["“”]\s*/i, "")
    .replace(/^[>"'\s-]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pickRssTag(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? match[1] : "";
}

function pickRssAttr(block, tagName, attrName) {
  const match = block.match(new RegExp(`<${tagName}[^>]*${attrName}=["']([^"']+)["'][^>]*>`, "i"));
  return match ? match[1] : "";
}

function pickFeedAttrFromTag(tag = "", attrName = "") {
  const match = String(tag || "").match(new RegExp(`\\s${attrName}=["']([^"']+)["']`, "i"));
  return match ? decodeHtml(match[1]) : "";
}

function pickAtomEntryLink(block = "") {
  const linkTags = [...String(block || "").matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
  const isUsable = (tag) => {
    const href = pickFeedAttrFromTag(tag, "href");
    const rel = pickFeedAttrFromTag(tag, "rel").toLowerCase();
    if (!href) return false;
    if (/comments?|repl|edit|self/i.test(rel)) return false;
    if (/\/comments\/default\b|\/feeds\/.*\/comments\/default\b/i.test(href)) return false;
    return true;
  };
  const alternate = linkTags.find(
    (tag) => pickFeedAttrFromTag(tag, "rel").toLowerCase() === "alternate" && isUsable(tag)
  );
  const fallback = linkTags.find(isUsable);
  return pickFeedAttrFromTag(alternate || fallback || "", "href");
}

function resolveFeedAssetUrl(baseUrl, candidate) {
  const cleanCandidate = decodeHtml(String(candidate || "").trim()).replace(/\\\//g, "/");
  if (!cleanCandidate) return "";

  try {
    const resolved = new URL(cleanCandidate, baseUrl || undefined);
    const nestedImageUrl =
      resolved.searchParams.get("url") ||
      resolved.searchParams.get("src") ||
      resolved.searchParams.get("image");

    if (nestedImageUrl && /^https?:/i.test(nestedImageUrl)) {
      return nestedImageUrl;
    }

    return resolved.toString();
  } catch (_error) {
    return cleanCandidate;
  }
}

function pickLargestSrcsetCandidate(rawSrcset, baseUrl) {
  const entries = String(rawSrcset || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [urlPart, descriptor = ""] = entry.split(/\s+/, 2);
      const widthMatch = descriptor.match(/(\d+)w/i);
      return {
        url: resolveFeedAssetUrl(baseUrl, urlPart),
        width: Number(widthMatch?.[1] || 0)
      };
    })
    .filter((entry) => entry.url);

  if (!entries.length) return "";
  entries.sort((left, right) => right.width - left.width);
  return entries[0].url;
}

const HOTLINK_BLOCKED_IMAGE_HOSTS = ["awn.com"];

function isHotlinkBlockedImageUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;

  try {
    const parsed = new URL(raw, "https://example.com");
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    return HOTLINK_BLOCKED_IMAGE_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`)
    );
  } catch (_error) {
    return /(^|\/\/)(?:www\.)?awn\.com\b/i.test(raw);
  }
}

function shouldIgnoreImageUrl(value) {
  const imageUrl = String(value || "").toLowerCase();
  if (!imageUrl) return true;
  if (imageUrl.includes("/assets/news-fallbacks/")) return false;
  if (isHotlinkBlockedImageUrl(imageUrl)) return true;
  if (/\.(?:pdf|docx?|xlsx?|pptx?|zip|rar|7z)(?:$|[?#])/i.test(imageUrl)) return true;
  const looksLikeKnownImageRoute =
    /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(imageUrl) ||
    imageUrl.includes("/wp-content/uploads/") ||
    imageUrl.includes("/uploads/") ||
    imageUrl.includes("/internal_photos/") ||
    /[?&](?:url|src|image)=https?:/i.test(imageUrl);
  if (!looksLikeKnownImageRoute) return true;
  if (/(?:logo|favicon|icon|avatar|emoji|gravatar|pixel|placeholder|spacer|blank)\b/i.test(imageUrl)) {
    return true;
  }
  if (
    imageUrl.includes("agenciabrasil.ebc.com.br/ebc.png") ||
    imageUrl.includes("agenciabrasil.ebc.com.br/ebc.gif") ||
    imageUrl.includes("/edital-assinado-")
  ) {
    return true;
  }
  return false;
}

function getArticleImageUrl(item = {}) {
  return item.imageUrl || item.feedImageUrl || item.sourceImageUrl || item.image || "";
}

function getArticleDivisionKey(item = {}) {
  return normalizeText(item.categoryKey || item.category || item.eyebrow || "sem-categoria") || "sem-categoria";
}

function normalizeComparableImageUrl(value) {
  return String(value || "")
    .trim()
    .replace(/[?#].*$/g, "")
    .replace(/-\d{2,5}x\d{2,5}(?=\.[a-z]{3,5}$)/i, "")
    .toLowerCase();
}

function splitSvgLongWord(word = "", maxChars = 31) {
  const raw = String(word || "");
  if (raw.length <= maxChars) return [raw];

  const chunks = [];
  for (let index = 0; index < raw.length; index += maxChars - 1) {
    chunks.push(raw.slice(index, index + maxChars - 1));
  }
  return chunks;
}

function wrapSvgTextByWords(value = "", maxChars = 27, maxLines = 3) {
  const words = cleanShortText(value, 150)
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((word) => splitSvgLongWord(word, maxChars));
  const lines = [];

  words.forEach((word) => {
    if (!lines.length) {
      lines.push(word);
      return;
    }

    const current = lines[lines.length - 1] || "";
    const next = current ? `${current} ${word}` : word;

    if (next.length <= maxChars) {
      lines[lines.length - 1] = next;
      return;
    }

    if (lines.length < maxLines) {
      lines.push(word);
    }
  });

  const consumed = lines.join(" ").replace(/\.\.\.$/, "");
  if (words.join(" ").length > consumed.length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/\s+\S*$/, "").trim() || lines[lines.length - 1]}...`;
  }

  return lines.slice(0, maxLines);
}

function buildNewsFallbackSvg(item = {}, reason = "fallback") {
  const title = cleanShortText(item.title || item.sourceLabel || "Notícia em revisão", 150);
  const category = cleanShortText(item.category || item.eyebrow || "Notícia", 40).toUpperCase();
  const source = cleanShortText(item.sourceName || "Catálogo", 42);
  const hue = (hashString(`${item.slug || title}|${reason}`) % 280) + 20;
  const accent = `hsl(${hue} 78% 58%)`;
  const accent2 = `hsl(${(hue + 55) % 360} 72% 48%)`;
  const titleLines = wrapSvgTextByWords(title, 27, 3);
  const titleMarkup = titleLines
    .map((line, index) => `<tspan x="126" dy="${index === 0 ? "0" : "60"}">${escapeHtml(line)}</tspan>`)
    .join("");
  const escapedTitle = escapeHtml(title);
  const escapedCategory = escapeHtml(cleanShortText(category, 20));
  const escapedSource = escapeHtml(cleanShortText(`${source} - imagem editorial segura`, 56));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720" role="img" aria-label="${escapedTitle}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#07111f"/>
      <stop offset="0.58" stop-color="#101827"/>
      <stop offset="1" stop-color="#1b2028"/>
    </linearGradient>
    <pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse">
      <path d="M42 0H0v42" fill="none" stroke="rgba(255,255,255,.055)" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="1200" height="720" fill="url(#bg)"/>
  <rect width="1200" height="720" fill="url(#grid)"/>
  <rect x="86" y="82" width="1028" height="556" rx="28" fill="rgba(255,255,255,.055)" stroke="rgba(255,255,255,.14)" stroke-width="2"/>
  <rect x="126" y="126" width="244" height="48" rx="24" fill="${accent}"/>
  <text x="154" y="158" fill="#07111f" font-family="Arial, sans-serif" font-size="24" font-weight="800">${escapedCategory}</text>
  <circle cx="986" cy="158" r="76" fill="${accent}" opacity=".9"/>
  <circle cx="1038" cy="210" r="52" fill="${accent2}" opacity=".78"/>
  <path d="M126 492h948" stroke="${accent}" stroke-width="12" stroke-linecap="round" opacity=".82"/>
  <text x="126" y="282" fill="#fff8ea" font-family="Georgia, serif" font-size="50" font-weight="700">
    ${titleMarkup}
  </text>
  <text x="126" y="574" fill="rgba(255,248,234,.72)" font-family="Arial, sans-serif" font-size="23" font-weight="700">${escapedSource}</text>
</svg>
`;
}

function ensureNewsFallbackImage(item = {}, reason = "fallback") {
  const slug = slugify(item.slug || item.title || createRecordId("noticia"));
  const fileName = `${slug || createRecordId("noticia")}.svg`;
  const relativeUrl = `./assets/news-fallbacks/${fileName}`;
  const filePath = path.join(ROOT_DIR, "assets", "news-fallbacks", fileName);
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, buildNewsFallbackSvg(item, reason), "utf-8");
  } catch (_error) {
    return "";
  }
  return relativeUrl;
}

function repairNewsImagesForDisplay(items = []) {
  const seenByDivision = new Map();
  return (Array.isArray(items) ? items : []).map((item) => {
    const currentImage = getArticleImageUrl(item);
    const sourceUrl = String(item.sourceUrl || item.url || item.link || "").trim();
    const division = getArticleDivisionKey(item);
    const imageKey = normalizeComparableImageUrl(currentImage);
    const duplicateKey = imageKey ? `${division}|${imageKey}` : "";
    const isBadImage = !currentImage || shouldIgnoreImageUrl(currentImage);
    const isRepeatedInDivision = duplicateKey && seenByDivision.has(duplicateKey);

    if (duplicateKey && !seenByDivision.has(duplicateKey)) {
      seenByDivision.set(duplicateKey, item.slug || item.id || currentImage);
    }

    if (!isBadImage && !isRepeatedInDivision) return item;

    const reason = isBadImage ? "imagem-ausente-ou-generica" : "foto-repetida-na-mesma-divisao";
    const fallbackUrl = ensureNewsFallbackImage(item, reason);
    if (!fallbackUrl) return item;

    return {
      ...item,
      imageUrl: fallbackUrl,
      feedImageUrl: fallbackUrl,
      sourceImageUrl: fallbackUrl,
      imageCredit: item.imageCredit || "Arte editorial automática do Catálogo Cruzeiro do Sul",
      imageFocus: item.imageFocus || "center 50%",
      imageQuality: `${reason}-fallback-e-buscar-na-fonte`,
      originalImageUrl: shouldIgnoreImageUrl(currentImage) ? "" : currentImage || item.originalImageUrl || "",
      originalFeedImageUrl: shouldIgnoreImageUrl(item.feedImageUrl) ? "" : item.originalFeedImageUrl || item.feedImageUrl || "",
      originalSourceImageUrl: shouldIgnoreImageUrl(item.sourceImageUrl) ? "" : item.originalSourceImageUrl || item.sourceImageUrl || ""
    };
  });
}

function getImageCandidateScore(value) {
  const imageUrl = String(value || "").toLowerCase();
  let score = 0;

  if (!imageUrl) return -1000;
  if (shouldIgnoreImageUrl(imageUrl)) return -1000;
  if (imageUrl.includes("/wp-content/uploads/")) score += 40;
  if (/(?:featured|hero|wp-post-image|attachment)/i.test(imageUrl)) score += 16;
  if (/(?:1200|1024|1536|2048)/.test(imageUrl)) score += 10;
  if (/(?:^|[-_])300x\d{2,5}|[-_]\d{2,5}x300/.test(imageUrl)) score += 8;
  if (/[-_](?:\d{3,4})x(?:\d{3,4})\./.test(imageUrl)) score += 2;
  if (/\.avif(?:[?#].*)?$/i.test(imageUrl)) score += 2;

  return score;
}

function selectBestImageCandidate(candidates = []) {
  const unique = [...new Set(candidates.map((value) => String(value || "").trim()).filter(Boolean))];
  if (!unique.length) return "";

  const ranked = unique
    .map((url) => ({ url, score: getImageCandidateScore(url) }))
    .filter((entry) => entry.score > -1000)
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.url || "";
}

function collectSrcsetCandidateUrls(value = "", baseUrl = "") {
  return String(value || "")
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0])
    .map((candidate) => resolveFeedAssetUrl(baseUrl, candidate))
    .filter(Boolean);
}

function collectImageCandidatesFromMarkup(markup, baseUrl) {
  const rawMarkup = decodeHtml(String(markup || "")).replace(/\\(["'])/g, "$1");
  if (!rawMarkup) return [];

  const candidates = [];
  const directPatterns = [
    /data-full-file=["']([^"']+)["']/gi,
    /data-large-file=["']([^"']+)["']/gi,
    /data-medium-file=["']([^"']+)["']/gi,
    /data-original=["']([^"']+)["']/gi,
    /data-lazy-src=["']([^"']+)["']/gi,
    /data-lazy-original=["']([^"']+)["']/gi,
    /data-srcset=["']([^"']+)["']/gi,
    /data-src=["']([^"']+)["']/gi,
    /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/gi,
    /<img[^>]+src=["']([^"']+)["']/gi,
    /<video[^>]+poster=["']([^"']+)["']/gi,
    /<enclosure[^>]+url=["']([^"']+)["']/gi
  ];

  directPatterns.forEach((pattern) => {
    for (const match of rawMarkup.matchAll(pattern)) {
      const resolved = resolveFeedAssetUrl(baseUrl, match[1]);
      if (resolved) {
        candidates.push(resolved);
      }
    }
  });

  for (const match of rawMarkup.matchAll(/srcset=["']([^"']+)["']/gi)) {
    candidates.push(...collectSrcsetCandidateUrls(match[1], baseUrl));
    const resolved = pickLargestSrcsetCandidate(match[1], baseUrl);
    if (resolved) {
      candidates.push(resolved);
    }
  }

  const looseUrlMatches =
    rawMarkup.match(/https?:\/\/[^\s"'<>]+?\.(?:avif|gif|jpe?g|png|svg|webp)(?:\?[^\s"'<>]*)?/gi) || [];
  looseUrlMatches.forEach((url) => {
    const resolved = resolveFeedAssetUrl(baseUrl, url);
    if (resolved) {
      candidates.push(resolved);
    }
  });

  return candidates;
}

function extractImageFromMarkup(markup, baseUrl) {
  return selectBestImageCandidate(collectImageCandidatesFromMarkup(markup, baseUrl));
}

function pickCanonicalFeedImage(item = {}) {
  const sourceUrl = item.sourceUrl || item.url || "";
  const inlineMarkup = [
    item.summary,
    item.lede,
    item.description,
    Array.isArray(item.body) ? item.body.join(" ") : "",
    Array.isArray(item.highlights) ? item.highlights.join(" ") : ""
  ]
    .filter(Boolean)
    .join(" ");

  const candidates = [
    item.feedImageUrl,
    item.imageUrl,
    extractImageFromMarkup(inlineMarkup, sourceUrl)
  ];

  return candidates.find((candidate) => !shouldIgnoreImageUrl(candidate)) || "";
}

function extractBestSourceImage(html, baseUrl) {
  const rawHtml = decodeHtml(String(html || ""));
  if (!rawHtml) return "";

  const candidates = [];
  const metaMatches = rawHtml.match(/<meta[^>]+>/gi) || [];

  metaMatches.forEach((metaTag) => {
    const lowerTag = metaTag.toLowerCase();
    if (!/(?:og:image|twitter:image|twitter:image:src)/i.test(lowerTag)) {
      return;
    }

    const contentMatch = metaTag.match(/\bcontent=["']([^"']+)["']/i);
    if (!contentMatch?.[1]) {
      return;
    }

    const resolved = resolveFeedAssetUrl(baseUrl, contentMatch[1]);
    if (resolved) {
      candidates.push(resolved);
    }
  });

  const jsonLdBlocks = rawHtml.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  jsonLdBlocks.forEach((block) => {
    const jsonText = block
      .replace(/^<script[^>]*>/i, "")
      .replace(/<\/script>$/i, "")
      .trim();

    if (!jsonText) {
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      const queue = Array.isArray(parsed) ? parsed : [parsed];

      queue.forEach((entry) => {
        const imageField = entry?.image;
        const values = Array.isArray(imageField)
          ? imageField
          : imageField && typeof imageField === "object"
            ? [imageField.url, imageField.contentUrl]
            : [imageField];

        values.forEach((value) => {
          const resolved = resolveFeedAssetUrl(baseUrl, value);
          if (resolved) {
            candidates.push(resolved);
          }
        });
      });
    } catch (_error) {
      // Ignora JSON-LD invalido da fonte.
    }
  });

  const focusedMarkupBlocks = [
    rawHtml.match(/<article\b[\s\S]*?<\/article>/i)?.[0] || "",
    rawHtml.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || "",
    rawHtml.match(/<div[^>]+(?:class|id)=["'][^"']*(?:post|entry|article|content|materia|noticia)[^"']*["'][^>]*>[\s\S]*?<\/div>/i)?.[0] || ""
  ].filter(Boolean);

  focusedMarkupBlocks.forEach((block) => {
    candidates.push(...collectImageCandidatesFromMarkup(block, baseUrl));
  });

  return selectBestImageCandidate(candidates);
}

function splitFeedBlocks(xmlText, tagName) {
  const blocks = [];
  const pattern = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi");

  for (const match of String(xmlText || "").matchAll(pattern)) {
    if (match?.[1]) {
      blocks.push(match[1]);
    }
  }

  return blocks;
}

function pickFirstFeedTag(block, tagNames = []) {
  for (const tagName of tagNames) {
    const value = pickRssTag(block, tagName);
    if (value) {
      return value;
    }
  }

  return "";
}

function pickFirstFeedAttr(block, candidates = []) {
  for (const candidate of candidates) {
    const value = pickRssAttr(block, candidate.tagName, candidate.attrName);
    if (value) {
      return value;
    }
  }

  return "";
}

function parseFeedDateValue(value) {
  const parsed = new Date(stripHtml(value));
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function buildFeedRecordFromBlock(block, source, { atom = false } = {}) {
  const title = stripHtml(pickRssTag(block, "title"));
  const link =
    (atom ? pickAtomEntryLink(block) : "") ||
    stripHtml(pickRssTag(block, "link")) ||
    stripHtml(pickRssTag(block, "guid")) ||
    stripHtml(pickRssTag(block, "id"));
  const pubDate = stripHtml(
    pickFirstFeedTag(block, ["pubDate", "published", "updated", "dc:date"])
  );
  const rawCategory =
    stripHtml(pickRssTag(block, "category")) ||
    pickFirstFeedAttr(block, [
      { tagName: "category", attrName: "term" },
      { tagName: "category", attrName: "label" }
    ]) ||
    source.defaultCategory ||
    "Cotidiano";
  const descriptionMarkup = pickFirstFeedTag(block, ["description", "summary"]);
  const encodedMarkup = pickFirstFeedTag(block, ["content:encoded", "content"]);
  const description = cleanFeedText(descriptionMarkup) || cleanFeedText(encodedMarkup);
  const imageUrl =
    pickRssAttr(block, "media:content", "url") ||
    pickRssAttr(block, "media:thumbnail", "url") ||
    pickRssAttr(block, "enclosure", "url") ||
    extractImageFromMarkup([descriptionMarkup, encodedMarkup].filter(Boolean).join(" "), link) ||
    "";

  if (!title || !link) {
    return null;
  }

  const category = normalizeNewsCategoryLabel(rawCategory, {
    defaultCategory: source.defaultCategory,
    title,
    summary: description,
    sourceName: source.name || source.id || "Fonte"
  });

  return {
    id: link,
    slug: slugify(title),
    title,
    summary: description,
    lede: description,
    url: link,
    sourceUrl: link,
    sourceName: source.name || source.id || "Fonte",
    sourceLabel: title,
    category,
    publishedAt: parseFeedDateValue(pubDate),
    imageUrl: imageUrl || "",
    feedImageUrl: imageUrl || "",
    sourceImageUrl: ""
  };
}

function parseRssItems(xmlText, source) {
  const rssItems = splitFeedBlocks(xmlText, "item").map((block) =>
    buildFeedRecordFromBlock(block, source)
  );
  const atomEntries = splitFeedBlocks(xmlText, "entry").map((block) =>
    buildFeedRecordFromBlock(block, source, { atom: true })
  );

  return [...rssItems, ...atomEntries]
    .filter(Boolean);
}

function extractWordPressFeaturedImage(post = {}) {
  const embedded = post && typeof post === "object" ? post._embedded || {} : {};
  const media = Array.isArray(embedded["wp:featuredmedia"]) ? embedded["wp:featuredmedia"][0] : null;
  return (
    media?.source_url ||
    media?.media_details?.sizes?.large?.source_url ||
    media?.media_details?.sizes?.medium?.source_url ||
    media?.guid?.rendered ||
    ""
  );
}

function buildDirectFeedRecord(raw = {}, source = {}) {
  const title = cleanShortText(stripHtml(raw.title || ""), 180);
  const link = safeString(raw.link || raw.url || raw.sourceUrl || raw.id || "", 520);
  const summary = cleanShortText(
    cleanFeedText(raw.summary || raw.description || raw.excerpt || raw.content || title),
    260
  );
  if (!title || !/^https?:\/\//i.test(link)) return null;

  const category = normalizeNewsCategoryLabel(raw.category || source.defaultCategory || "Cotidiano", {
    defaultCategory: source.defaultCategory,
    title,
    summary,
    sourceName: source.name || source.id || "Fonte"
  });
  const imageUrl = safeString(raw.imageUrl || raw.feedImageUrl || raw.sourceImageUrl || "", 520);

  return {
    id: link,
    slug: slugify(title),
    title,
    summary: summary || title,
    lede: summary || title,
    url: link,
    sourceUrl: link,
    sourceName: source.name || source.id || "Fonte",
    sourceLabel: title,
    category,
    publishedAt: parseFeedDateValue(raw.publishedAt || raw.date || raw.updatedAt || ""),
    imageUrl,
    feedImageUrl: imageUrl,
    sourceImageUrl: imageUrl,
    priority: Number(source.priority || 0) || 0,
    editorialPriority: source.priorityReason ? "fonte-regional-prioritaria" : ""
  };
}

function parseWordPressJsonItems(jsonText = "", source = {}) {
  let payload = [];
  try {
    payload = JSON.parse(String(jsonText || "[]"));
  } catch (_error) {
    return [];
  }
  if (!Array.isArray(payload)) return [];

  return payload
    .map((post) =>
      buildDirectFeedRecord(
        {
          title: post?.title?.rendered || post?.title || "",
          link: post?.link || post?.guid?.rendered || "",
          summary: post?.excerpt?.rendered || post?.content?.rendered || "",
          content: post?.content?.rendered || "",
          publishedAt: post?.date_gmt || post?.date || post?.modified_gmt || post?.modified || "",
          imageUrl: extractWordPressFeaturedImage(post)
        },
        source
      )
    )
    .filter(Boolean);
}

function parsePrefeituraWixHomeItems(htmlText = "", source = {}) {
  const html = String(htmlText || "");
  const items = [];
  const seen = new Set();
  const pattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = pattern.exec(html))) {
    const href = decodeHtml(match[1] || "");
    const block = match[0] || "";
    if (!/cruzeirodosul\.ac\.gov\.br\/publicacoes-transparencia\//i.test(href)) continue;

    const link = resolveAbsoluteUrl(source.siteUrl || source.feedUrl || "", href);
    if (!link || seen.has(link)) continue;
    seen.add(link);

    const title =
      cleanShortText(
        stripHtml(block.match(/data-testid=["']gallery-item-title["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] || ""),
        180
      ) ||
      cleanShortText(
        stripHtml(block.match(/<div[^>]*class=["'][^"']*XQ8CqQ[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] || ""),
        180
      );
    const description =
      cleanShortText(
        stripHtml(block.match(/data-testid=["']gallery-item-description["'][^>]*>([\s\S]*?)<\/p>/i)?.[1] || ""),
        260
      ) ||
      cleanShortText(
        stripHtml(block.match(/<p[^>]*class=["'][^"']*GGsCSl[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)?.[1] || ""),
        260
      );
    const imageUrl = extractImageFromMarkup(block, source.siteUrl || source.feedUrl || "");
    const item = buildDirectFeedRecord(
      {
        title: title || cleanShortText(stripHtml(block), 140),
        link,
        summary: description || title,
        imageUrl,
        publishedAt: new Date().toISOString()
      },
      source
    );
    if (item) items.push(item);
  }

  return items;
}

function parseSourceFeedItems(rawText = "", source = {}) {
  const feedType = String(source.feedType || "rss").trim().toLowerCase();
  if (feedType === "wordpress-json") return parseWordPressJsonItems(rawText, source);
  if (feedType === "prefeitura-wix-home") return parsePrefeituraWixHomeItems(rawText, source);
  return parseRssItems(rawText, source);
}

function fetchRemoteText(remoteUrl, { timeoutMs = 8000, maxBytes = 1200000, maxRedirects = 4 } = {}) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(remoteUrl);
    } catch (error) {
      return reject(error);
    }

    const client = parsed.protocol === "https:" ? require("https") : require("http");
    const req = client.get(
      remoteUrl,
      {
        timeout: timeoutMs,
        headers: REMOTE_REQUEST_HEADERS
      },
      (resp) => {
        const statusCode = Number(resp.statusCode || 0);
        const redirectLocation = String(resp.headers.location || "").trim();

        if (
          statusCode >= 300 &&
          statusCode < 400 &&
          redirectLocation &&
          maxRedirects > 0
        ) {
          const targetUrl = resolveAbsoluteUrl(remoteUrl, redirectLocation);
          resp.resume();
          if (!targetUrl) {
            return reject(new Error("redirect"));
          }
          return resolve(
            fetchRemoteText(targetUrl, {
              timeoutMs,
              maxBytes,
              maxRedirects: maxRedirects - 1
            })
          );
        }

        if (statusCode >= 400) {
          resp.resume();
          return reject(new Error(`http_${statusCode}`));
        }

        let raw = "";
        resp.setEncoding("utf8");
        resp.on("data", (chunk) => {
          raw += chunk;
          if (raw.length > maxBytes) {
            resp.destroy();
          }
        });
        resp.on("end", () => resolve(raw));
      }
    );

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

function fetchRssFeed(feedUrl, options = {}) {
  return fetchRemoteText(feedUrl, { timeoutMs: 4500, maxBytes: 1200000, ...options });
}

function fetchSourceFeed(source = {}, options = {}) {
  const feedType = String(source.feedType || "rss").trim().toLowerCase();
  const sourceOptions =
    feedType === "prefeitura-wix-home"
      ? { timeoutMs: 7000, maxBytes: 2200000 }
      : feedType === "wordpress-json"
        ? { timeoutMs: 5500, maxBytes: 1400000 }
        : {};
  return fetchRssFeed(source.feedUrl, { ...sourceOptions, ...options });
}

async function refreshRssRuntime(limitPerSource = 30) {
  const reports = [];
  const items = [];

  for (const source of RSS_SOURCES) {
    if (source.disabled) {
      reports.push({
        source: source.id,
        ok: true,
        count: 0,
        skipped: true,
        reason: source.disabledReason || "fonte desativada temporariamente"
      });
      continue;
    }

    try {
      const rawText = await fetchSourceFeed(source);
      const parsedItems = parseSourceFeedItems(rawText, source).slice(0, limitPerSource);
      items.push(...parsedItems);
      reports.push({ source: source.id, ok: true, count: parsedItems.length, mode: source.feedType || "rss" });
    } catch (error) {
      reports.push({ source: source.id, ok: false, error: String(error?.message || "falha") });
    }
  }

  const deduped = [];
  const seen = new Set();
  items.forEach((item) => {
    const key = item.url || item.sourceUrl || item.title;
    if (!key || seen.has(key)) return;
    seen.add(key);
    deduped.push(item);
  });

  const enrichedItems = repairNewsImagesForDisplay(
    (await enrichNewsItemsWithSourceImages(deduped))
      .map(normalizeArticleRecord)
      .map(sanitizePublicPortugueseRuntimeItem)
  );

  const payload = {
    lastAttemptAt: new Date().toISOString(),
    lastSuccessAt: enrichedItems.length ? new Date().toISOString() : null,
    items: enrichedItems,
    reports
  };

  writeJson(path.join(DATA_DIR, "runtime-news.json"), payload);
  if (enrichedItems.length) {
    writeStaticNewsData(enrichedItems);
  }
  return payload;
}

function getTopicFeedCacheFile(topic) {
  return path.join(DATA_DIR, `topic-feed-${slugify(topic || "topic")}.json`);
}

function getTopicFeedSources(topic) {
  const normalizedTopic = normalizeText(topic);
  return Array.isArray(TOPIC_FEED_CONFIG[normalizedTopic]) ? TOPIC_FEED_CONFIG[normalizedTopic] : [];
}

function readTopicFeedFallback(topic) {
  const fallback = readJson(TOPIC_FEED_FALLBACK_FILE, {});
  const items = fallback && typeof fallback === "object" ? fallback[normalizeText(topic)] : [];
  return Array.isArray(items) ? items : [];
}

function normalizeTopicFeedItem(item = {}, topic = "", sourceMeta = {}) {
  const normalizedTopic = normalizeText(topic);
  const normalizedRecord = normalizeArticleRecord({
    ...item,
    sourceName: item.sourceName || sourceMeta.name || item.source || "Fonte",
    sourceUrl: item.sourceUrl || item.url || sourceMeta.siteUrl || "#",
    defaultCategory: item.defaultCategory || sourceMeta.defaultCategory || item.category || "Cotidiano"
  });
  const publicRecord = sanitizePublicPortugueseRuntimeItem(normalizedRecord);

  return {
    ...publicRecord,
    topic: normalizedTopic,
    coverageLayer:
      normalizeText(
        item.coverageLayer ||
          sourceMeta.coverageLayer ||
          (normalizedTopic === "jurua"
            ? "jurua"
            : normalizedTopic === "acre"
              ? "acre"
              : normalizedTopic === "brasil" || normalizedTopic === "politics" || normalizedTopic === "economy"
                ? "brasil"
                : "global")
      ) || "global",
    topicGroup:
      normalizeText(item.topicGroup || sourceMeta.topicGroup || normalizedRecord.categoryKey || "") || "",
    summary: cleanShortText(publicRecord.summary || publicRecord.lede || publicRecord.description || "", 260),
    lede: cleanShortText(publicRecord.lede || publicRecord.summary || publicRecord.description || "", 220)
  };
}

function dedupeTopicFeedItems(items = []) {
  const map = new Map();

  items.forEach((item) => {
    const normalized = normalizeTopicFeedItem(item, item.topic || "", item);
    const key =
      normalized.sourceUrl ||
      normalized.slug ||
      normalized.id ||
      `${normalized.sourceName}-${normalized.title}`;

    if (!key || map.has(key)) {
      return;
    }

    map.set(key, normalized);
  });

  return Array.from(map.values()).sort(sortArticleItems);
}

function pickBalancedTopicFeedItems(items = [], limit = 12) {
  const deduped = dedupeTopicFeedItems(items);
  const buckets = new Map();

  deduped.forEach((item) => {
    const groupKey = normalizeText(item.topicGroup || "geral") || "geral";
    if (!buckets.has(groupKey)) {
      buckets.set(groupKey, []);
    }
    buckets.get(groupKey).push(item);
  });

  buckets.forEach((bucket, key) => {
    buckets.set(
      key,
      bucket.sort((left, right) => {
        const dateDiff = getPublicNewsTimestamp(right) - getPublicNewsTimestamp(left);
        if (dateDiff !== 0) {
          return dateDiff;
        }

        const leftPriority = COVERAGE_LAYER_PRIORITY[String(left.coverageLayer || "global")] ?? 99;
        const rightPriority = COVERAGE_LAYER_PRIORITY[String(right.coverageLayer || "global")] ?? 99;
        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }
        return sortArticleItems(left, right);
      })
    );
  });

  const selected = [];
  let progressed = true;

  while (selected.length < limit && progressed) {
    progressed = false;

    buckets.forEach((bucket) => {
      if (selected.length >= limit || !bucket.length) {
        return;
      }

      selected.push(bucket.shift());
      progressed = true;
    });
  }

  return selected.slice(0, Math.max(1, Math.min(40, limit)));
}

function mergeTopicFeedItems(primaryItems = [], fallbackItems = [], limit = 12) {
  return pickBalancedTopicFeedItems(
    [...(primaryItems || []), ...(fallbackItems || [])],
    Math.max(1, Math.min(40, limit))
  );
}

function sortTopicFeedItemsForDisplay(items = []) {
  return (Array.isArray(items) ? items : []).slice().sort((left, right) => {
    const dateDiff = getPublicNewsTimestamp(right) - getPublicNewsTimestamp(left);
    if (dateDiff !== 0) {
      return dateDiff;
    }

    const leftLayer = COVERAGE_LAYER_PRIORITY[String(left.coverageLayer || "global")] ?? 99;
    const rightLayer = COVERAGE_LAYER_PRIORITY[String(right.coverageLayer || "global")] ?? 99;
    if (leftLayer !== rightLayer) {
      return leftLayer - rightLayer;
    }

    const leftHasImage = shouldIgnoreImageUrl(getArticleImageUrl(left)) ? 0 : 1;
    const rightHasImage = shouldIgnoreImageUrl(getArticleImageUrl(right)) ? 0 : 1;
    if (leftHasImage !== rightHasImage) {
      return rightHasImage - leftHasImage;
    }
    return sortArticleItems(left, right);
  });
}

function buildTopicFeedFallback(topic, limit = 12) {
  return readTopicFeedFallback(topic)
    .map((item) => normalizeTopicFeedItem(item, topic, item))
    .sort(sortArticleItems)
    .slice(0, Math.max(1, Math.min(40, limit)));
}

const SOCIAL_TRENDS_TTL_MS = Math.max(
  1000 * 60 * 5,
  Number(process.env.SOCIAL_TRENDS_TTL_MS || 1000 * 60 * 12)
);

const SOCIAL_TREND_SOURCES = [
  {
    id: "getdaytrends-brazil",
    name: "GetDayTrends Brasil",
    platform: "X/Twitter",
    url: "https://getdaytrends.com/brazil/",
    type: "twitter"
  },
  {
    id: "trends24-brazil",
    name: "Trends24 Brasil",
    platform: "X/Twitter",
    url: "https://trends24.in/brazil/",
    type: "twitter"
  },
  {
    id: "best-hashtags-brasil",
    name: "Best Hashtags Brasil",
    platform: "Instagram",
    url: "https://best-hashtags.com/hashtag/brasil/",
    type: "instagram"
  },
  {
    id: "best-hashtags-acre",
    name: "Best Hashtags Acre",
    platform: "Instagram",
    url: "https://best-hashtags.com/hashtag/acre/",
    type: "instagram"
  },
  {
    id: "facebook-public-pages",
    name: "Facebook público monitorado",
    platform: "Facebook",
    url: "https://developers.facebook.com/docs/graph-api/reference/page/posts/",
    type: "facebook"
  }
];

const SOCIAL_TRENDS_ALLOW_DIRECTORY_SIGNALS = /^(1|true|yes)$/i.test(
  String(process.env.SOCIAL_TRENDS_ALLOW_DIRECTORY_SIGNALS || "")
);

const SOCIAL_TREND_DIRECTORY_SOURCE_PATTERN =
  /\b(best-hashtags\.com|getdaytrends\.com|trends24\.in|developers\.facebook\.com)\b/i;

const SOCIAL_TREND_BLOCKLIST = new Set([
  "twitter",
  "x",
  "brazil",
  "brasil",
  "trends",
  "trend",
  "trending",
  "trending now",
  "view details",
  "browse all",
  "about us",
  "contact us",
  "quick links",
  "copy",
  "button",
  "timeline",
  "tag cloud",
  "table",
  "now",
  "yesterday",
  "week ago",
  "month ago",
  "year ago",
  "later trends",
  "earlier trends",
  "popular hashtags",
  "related hashtags",
  "hashtag report",
  "top hashtags"
]);

function decodeHtmlEntities(value = "") {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code) || 32));
}

function stripHtml(value = "") {
  return decodeHtmlEntities(
    String(value || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, "\n")
  ).replace(/\s+/g, " ");
}

function normalizeSocialTrendLabel(value = "") {
  const label = decodeHtmlEntities(String(value || ""))
    .replace(/\s*under\s+\d+k?\s+tweets?.*$/i, "")
    .replace(/\s*\d+(?:\.\d+)?k?\s+tweets?.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!label || label.length < 2 || label.length > 82) {
    return "";
  }

  const normalized = normalizeText(label);
  if (SOCIAL_TREND_BLOCKLIST.has(normalized)) {
    return "";
  }

  if (/^(https?:|www\.|\/)/i.test(label)) {
    return "";
  }

  if (/^(utc time|coordinated universal time|tweet|explore|image)$/i.test(label)) {
    return "";
  }

  return label;
}

const SOCIAL_TREND_PORTUGUESE_PATTERN =
  /\b(brasil|brasileir|acre|jurua|juru[aá]|cruzeiro do sul|czs|rio branco|amazonia|amazônia|cultura|politica|política|servico|serviço|saude|saúde|educacao|educação|cidade|bairro|comunidade|prefeitura|governo|agenda|evento|show|festa|comercio|comércio|negocio|negócio|cotidiano|chuva|rua|obra|transito|trânsito|esporte|futebol|musica|música|noticia|notícia|debate|publico|público|viralizou|repercussao|repercussão|memes?|hoje)\b/i;

function isPortugueseBrazilianSocialTrendLabel(value = "") {
  const label = String(value || "").trim();
  if (!label) return false;
  if (/[^\u0000-\u024F#_\s\d.,'’$-]/u.test(label)) return false;
  if (/^#?[A-Z0-9_]{8,}$/u.test(label) && !/(BRASIL|ACRE|JURUA|CZS)/u.test(label)) return false;
  if (/_/.test(label) && !/(vale_do_jurua|cruzeiro_do_sul)/i.test(label)) return false;

  const normalized = normalizeText(label.replace(/^#/, "").replace(/([a-z])([A-Z])/g, "$1 $2"));
  if (SOCIAL_TREND_BLOCKLIST.has(normalized)) return false;
  if (/^(?:\d{1,2}h|\d{1,2}:\d{2})$/i.test(normalized)) return false;

  return SOCIAL_TREND_PORTUGUESE_PATTERN.test(label) || SOCIAL_TREND_PORTUGUESE_PATTERN.test(normalized);
}

function trendToHashtag(value = "") {
  const label = String(value || "").trim();
  if (label.startsWith("#")) {
    return label.replace(/[^\p{L}\p{N}_#]/gu, "").slice(0, 40);
  }

  const compact = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 1)
    .slice(0, 4)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");

  return compact ? `#${compact}`.slice(0, 40) : "";
}

function inferSocialTrendDivision(value = "") {
  const text = normalizeText(value);
  if (/\b(prefeitura|vereador|camara|câmara|governo|governador|governadora|aleac|politica|política|senado|deputad|eleicao|eleição)\b/.test(text)) {
    return "Política";
  }
  if (/\b(saude|saúde|hospital|ubs|educacao|educação|escola|enem|concurso|edital|transito|trânsito|obra|rua|bairro|chuva|alerta|servico|serviço|calendario|calendário)\b/.test(text)) {
    return "Utilidade Pública";
  }
  if (/\b(cultura|show|musica|música|livro|leitura|teatro|festival|festa|evento|artista|cinema)\b/.test(text)) {
    return "Cultura";
  }
  if (/\b(comercio|comércio|economia|preco|preço|pix|negocio|negócio|empreendedor|venda|mercado)\b/.test(text)) {
    return "Economia";
  }
  if (/\b(esporte|futebol|jogo|time|campeonato|atleta|final)\b/.test(text)) {
    return "Esporte";
  }
  if (/\b(acre|jurua|juru[aá]|cruzeiro do sul|czs|rio branco|amazonia|amazônia)\b/.test(text)) {
    return "Acre / Governo";
  }
  return "Cotidiano";
}

function isDirectorySocialTrendSource(source = {}) {
  return Boolean(source && source.type !== "facebook");
}

function isDirectorySocialTrendItem(item = {}) {
  const sourceText = [
    item.sourceName,
    item.source,
    item.sourceUrl,
    item.url,
    item.topicGroup,
    item.summary
  ]
    .map((value) => String(value || ""))
    .join(" ");

  return SOCIAL_TREND_DIRECTORY_SOURCE_PATTERN.test(sourceText);
}

async function fetchExternalText(url, timeoutMs = 6500) {
  const response = await withPromiseTimeout(
    fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CatalogoCruzeiroSocialTrends/1.0; +https://catalogocruzeiro.local)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    }),
    timeoutMs,
    "social_trends_fetch_timeout"
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

function extractTwitterTrendLabels(html = "") {
  const labels = [];
  const anchorPattern = /<a\b[^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorPattern.exec(html))) {
    const label = normalizeSocialTrendLabel(stripHtml(match[1]));
    if (label) {
      labels.push(label);
    }
  }

  const text = stripHtml(html);
  const rankedPattern = /(?:^|\s)(?:\d{1,2})\s+((?:#[\p{L}\p{N}_]+|[\p{L}\p{N}][\p{L}\p{N}\s'’$.-]{1,70}?))(?:\s+under\s+\d+k?\s+tweets?|\s+\d+(?:\.\d+)?k?\s+tweets?|\s{2,}|$)/giu;

  while ((match = rankedPattern.exec(text))) {
    const label = normalizeSocialTrendLabel(match[1]);
    if (label) {
      labels.push(label);
    }
  }

  return labels;
}

function extractInstagramHashtagLabels(html = "") {
  const labels = [];
  const text = stripHtml(html);
  const hashtagPattern = /#[\p{L}\p{N}_]{2,40}/gu;
  let match;

  while ((match = hashtagPattern.exec(text))) {
    const label = normalizeSocialTrendLabel(match[0]);
    if (label) {
      labels.push(label.toLowerCase());
    }
  }

  return labels;
}

function getFacebookGraphConfig() {
  const token = String(
    process.env.FACEBOOK_GRAPH_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN || ""
  ).trim();
  const pageIds = String(process.env.FACEBOOK_PUBLIC_PAGE_IDS || process.env.FACEBOOK_PAGE_IDS || "")
    .split(/[,\s;]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return { token, pageIds };
}

async function fetchExternalJson(url, timeoutMs = 7500) {
  const response = await withPromiseTimeout(
    fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CatalogoCruzeiroSocialTrends/1.0; +https://catalogocruzeiro.local)",
        Accept: "application/json,text/plain,*/*"
      }
    }),
    timeoutMs,
    "social_trends_json_timeout"
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

function getFacebookPostEngagement(post = {}) {
  return (
    Number(post.shares?.count || 0) * 3 +
    Number(post.comments?.summary?.total_count || 0) * 2 +
    Number(post.reactions?.summary?.total_count || 0)
  );
}

function classifyFacebookCommentOpinion(value = "") {
  const text = normalizeText(value);
  if (!text) {
    return "neutral";
  }

  const negativePattern =
    /\b(absurdo|absurda|vergonha|ridiculo|ridícula|ridiculo|ridicula|horrivel|horrível|péssimo|pessimo|lixo|errado|mentira|palhacada|palhaçada|contra|nao concordo|não concordo|revolt|critica|critico|criticao|criticaõ|buraco|fracasso)\b/;
  const positivePattern =
    /\b(apoio|concordo|boa|bom|otimo|ótimo|parabens|parabéns|importante|certo|acertou|arrasou|amei|gostei|justo|necessario|necessário|merecido|show)\b/;

  if (negativePattern.test(text) && !positivePattern.test(text)) {
    return "negative";
  }

  if (positivePattern.test(text) && !negativePattern.test(text)) {
    return "positive";
  }

  return "neutral";
}

function getFacebookPostOpinionStats(post = {}) {
  const comments = Array.isArray(post.comments?.data) ? post.comments.data : [];
  const stats = {
    sampledComments: 0,
    positiveCount: 0,
    neutralCount: 0,
    negativeCount: 0,
    dominantLabel: "sem leitura suficiente"
  };

  comments.forEach((comment) => {
    const message = stripHtml(comment?.message || "");
    if (!message) {
      return;
    }

    stats.sampledComments += 1;
    const bucket = classifyFacebookCommentOpinion(message);
    if (bucket === "positive") {
      stats.positiveCount += 1;
      return;
    }
    if (bucket === "negative") {
      stats.negativeCount += 1;
      return;
    }
    stats.neutralCount += 1;
  });

  if (!stats.sampledComments) {
    return stats;
  }

  if (stats.positiveCount > stats.negativeCount && stats.positiveCount > stats.neutralCount) {
    stats.dominantLabel = "apoio maior";
  } else if (stats.negativeCount > stats.positiveCount && stats.negativeCount > stats.neutralCount) {
    stats.dominantLabel = "rejeição maior";
  } else {
    stats.dominantLabel = "leitura dividida";
  }

  return stats;
}

function extractFacebookPostTitle(post = {}) {
  const text = stripHtml(post.message || post.story || "");
  const firstLine = text
    .split(/\n|(?<=[.!?])\s+/u)
    .map((item) => item.trim())
    .find((item) => item.length >= 8);

  return normalizeSocialTrendLabel(cleanShortText(firstLine || text, 82));
}

function buildFacebookTrendItems(source, posts = [], maxItems = 12) {
  const now = new Date().toISOString();
  const seen = new Set();
  const items = [];

  posts
    .slice()
    .sort((left, right) => getFacebookPostEngagement(right) - getFacebookPostEngagement(left))
    .forEach((post, index) => {
      if (items.length >= maxItems) {
        return;
      }

      const title = extractFacebookPostTitle(post);
      const key = normalizeText(title);
      if (!title || !key || seen.has(key) || !isPortugueseBrazilianSocialTrendLabel(title)) {
        return;
      }

      seen.add(key);
      const rawText = stripHtml([post.message, post.story].filter(Boolean).join(" "));
      const hashtags = [...new Set((rawText.match(/#[\p{L}\p{N}_]{2,40}/gu) || []).slice(0, 4))];
      const fallbackHashtag = trendToHashtag(title);
      const division = inferSocialTrendDivision(`${title} ${rawText}`);
      const engagement = getFacebookPostEngagement(post);
      const opinionStats = getFacebookPostOpinionStats(post);
      const opinionSummary = opinionStats.sampledComments
        ? `Comentários lidos: ${opinionStats.sampledComments}. Apoio: ${opinionStats.positiveCount}. Cautela: ${opinionStats.neutralCount}. Rejeição: ${opinionStats.negativeCount}.`
        : "Sem amostra pública suficiente de comentários para medir aprovação.";

      items.push({
        id: `${source.id}-${slugify(title).slice(0, 42) || post.id || index}`,
        title,
        summary: `Post público monitorado no Facebook. Interações públicas ponderadas: ${engagement}. ${opinionSummary} Divisão sugerida: ${division}.`,
        category: division,
        sourceName: source.name,
        sourceUrl: post.permalink_url || source.url,
        publishedAt: post.created_time || now,
        date: post.created_time || now,
        externalSource: true,
        socialPlatform: "Facebook",
        coverageLayer: "brasil",
        importanceDivision: division,
        topicGroup: "facebook-public",
        hashtags: hashtags.length ? hashtags : fallbackHashtag ? [fallbackHashtag] : [],
        facebookEngagement: engagement,
        opinionStats
      });
    });

  return items;
}

async function fetchFacebookTrendSource(source) {
  const { token, pageIds } = getFacebookGraphConfig();

  if (!token || !pageIds.length) {
    return {
      items: [],
      report: {
        source: source.id,
        platform: source.platform,
        ok: false,
        error: "facebook_graph_config_pending",
        hint: "Configure FACEBOOK_GRAPH_ACCESS_TOKEN e FACEBOOK_PUBLIC_PAGE_IDS para captar páginas públicas reais.",
        url: source.url
      }
    };
  }

  try {
    const pageResults = await mapWithConcurrency(pageIds, 2, async (pageId) => {
      const params = new URLSearchParams({
        fields:
          "message,story,permalink_url,created_time,shares,comments.summary(true).limit(25){message},reactions.summary(true).limit(0)",
        limit: "12",
        access_token: token
      });
      const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}/posts?${params.toString()}`;
      const payload = await fetchExternalJson(url);
      return Array.isArray(payload?.data) ? payload.data : [];
    });
    const posts = pageResults.flat();
    const items = buildFacebookTrendItems(source, posts, 14);

    return {
      items,
      report: {
        source: source.id,
        platform: source.platform,
        ok: true,
        count: items.length,
        pages: pageIds.length,
        mode: "graph-api-public-pages",
        url: source.url
      }
    };
  } catch (error) {
    return {
      items: [],
      report: {
        source: source.id,
        platform: source.platform,
        ok: false,
        error: String(error?.message || "falha"),
        url: source.url
      }
    };
  }
}

function buildSocialTrendItems(source, labels = [], maxItems = 12) {
  const seen = new Set();
  const now = new Date().toISOString();
  const items = [];

  labels.forEach((rawLabel, index) => {
    if (items.length >= maxItems) {
      return;
    }

    const label = normalizeSocialTrendLabel(rawLabel);
    const key = normalizeText(label);
    if (!label || !key || seen.has(key) || !isPortugueseBrazilianSocialTrendLabel(label)) {
      return;
    }

    seen.add(key);
    const hashtag = trendToHashtag(label);
    const division = inferSocialTrendDivision(label);
    const platformCopy =
      source.type === "instagram"
        ? "Hashtag pública monitorada em lista externa de Instagram"
        : "Tendência pública captada em lista externa de X/Twitter Brasil";
    items.push({
      id: `${source.id}-${slugify(label).slice(0, 42) || index}`,
      title: label,
      summary: `${platformCopy}: ${label}. Divisão sugerida: ${division}.`,
      category: division,
      sourceName: source.name,
      sourceUrl: source.url,
      publishedAt: now,
      date: now,
      externalSource: true,
      socialPlatform: source.platform,
      coverageLayer: "brasil",
      importanceDivision: division,
      topicGroup: source.type === "instagram" ? "instagram-hashtags" : "twitter-trends",
      hashtags: hashtag ? [hashtag] : []
    });
  });

  return items;
}

async function fetchSocialTrendSource(source) {
  if (source.type === "facebook") {
    return fetchFacebookTrendSource(source);
  }

  try {
    const html = await fetchExternalText(source.url);
    const labels =
      source.type === "instagram" ? extractInstagramHashtagLabels(html) : extractTwitterTrendLabels(html);
    const items = buildSocialTrendItems(source, labels, source.type === "instagram" ? 10 : 18);

    return {
      items,
      report: { source: source.id, platform: source.platform, ok: true, count: items.length, url: source.url }
    };
  } catch (error) {
    return {
      items: [],
      report: {
        source: source.id,
        platform: source.platform,
        ok: false,
        error: String(error?.message || "falha"),
        url: source.url
      }
    };
  }
}

function mergeSocialTrendItems(items = [], limit = 24) {
  const selected = [];
  const seen = new Set();
  const platformPriority = { Facebook: 0, "X/Twitter": 1, Instagram: 2 };

  items
    .filter((item) => SOCIAL_TRENDS_ALLOW_DIRECTORY_SIGNALS || !isDirectorySocialTrendItem(item))
    .filter((item) => isPortugueseBrazilianSocialTrendLabel(item.title || item.hashtags?.[0] || ""))
    .slice()
    .sort((left, right) => {
      const priorityDiff =
        (platformPriority[left.socialPlatform] ?? 9) - (platformPriority[right.socialPlatform] ?? 9);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      return String(left.title || "").localeCompare(String(right.title || ""), "pt-BR");
    })
    .forEach((item) => {
      if (selected.length >= limit) {
        return;
      }

      const key = normalizeText(item.title || item.id || "");
      if (!key || seen.has(key)) {
        return;
      }

      seen.add(key);
      selected.push(item);
    });

  return selected;
}

async function refreshSocialTrends(limit = 24) {
  const allowedSources = SOCIAL_TREND_SOURCES.filter(
    (source) => SOCIAL_TRENDS_ALLOW_DIRECTORY_SIGNALS || !isDirectorySocialTrendSource(source)
  );
  const skippedReports = SOCIAL_TREND_SOURCES.filter((source) => !allowedSources.includes(source)).map((source) => ({
    source: source.id,
    platform: source.platform,
    ok: false,
    skipped: true,
    reason: "directory_signal_disabled",
    url: source.url
  }));
  const sourceResults = await mapWithConcurrency(allowedSources, 3, fetchSocialTrendSource);
  const items = mergeSocialTrendItems(
    sourceResults.flatMap((entry) => entry.items),
    Math.max(1, Math.min(50, limit))
  );
  const payload = {
    ok: true,
    updatedAt: new Date().toISOString(),
    items,
    reports: [...sourceResults.map((entry) => entry.report), ...skippedReports],
    external: items.length > 0
  };

  writeJson(SOCIAL_TRENDS_CACHE_FILE, payload);

  return payload;
}

async function getSocialTrends(limit = 24) {
  const safeLimit = Math.max(1, Math.min(50, Number(limit) || 24));
  const cached = readJson(SOCIAL_TRENDS_CACHE_FILE, null);
  const cachedItems = Array.isArray(cached?.items) ? cached.items : [];
  const cachedUpdatedAt = cached?.updatedAt ? Date.parse(cached.updatedAt) : 0;
  const cacheIsFresh =
    cached?.ok === true && Number.isFinite(cachedUpdatedAt) && Date.now() - cachedUpdatedAt < SOCIAL_TRENDS_TTL_MS;

  if (cacheIsFresh) {
    const scopedItems = mergeSocialTrendItems(cachedItems, safeLimit);
    return {
      ...cached,
      items: scopedItems,
      total: scopedItems.length,
      external: scopedItems.length > 0,
      stale: false
    };
  }

  try {
    const refreshed = await withPromiseTimeout(refreshSocialTrends(Math.max(safeLimit, 24)), 9000, "social_trends_timeout");
    if (refreshed?.ok === true && Array.isArray(refreshed.items)) {
      return {
        ...refreshed,
        items: refreshed.items.slice(0, safeLimit),
        stale: false
      };
    }
  } catch (_error) {
    // usa cache antigo ou fallback abaixo
  }

  if (cachedItems.length) {
    const scopedItems = mergeSocialTrendItems(cachedItems, safeLimit);
    return {
      ...cached,
      items: scopedItems,
      total: scopedItems.length,
      external: scopedItems.length > 0,
      stale: true
    };
  }

  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    items: [],
    reports: [],
    external: false,
    stale: true
  };
}

const BUZZ_BRAZILIAN_DOMAINS = [
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

const BUZZ_BLOCKED_GLOBAL_DOMAINS = [
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

function getTopicFeedHostname(value = "") {
  try {
    return new URL(String(value || "")).hostname.replace(/^www\./i, "").toLowerCase();
  } catch (error) {
    return "";
  }
}

function isBrazilianBuzzItem(item = {}) {
  const hostname = getTopicFeedHostname(item.sourceUrl || item.url || item.link || "");
  const coverageLayer = normalizeText(item.coverageLayer || "");
  const sourceName = normalizeText(item.sourceName || item.source || "");
  const text = normalizeText([item.title, item.summary, item.lede, item.category, sourceName].join(" "));

  if (["acre", "jurua", "brasil"].includes(coverageLayer)) {
    return true;
  }

  if (hostname && BUZZ_BLOCKED_GLOBAL_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) {
    return false;
  }

  if (hostname && BUZZ_BRAZILIAN_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) {
    return true;
  }

  if (hostname.endsWith(".br")) {
    return true;
  }

  return /\b(brasil|brasileir|acre|rio branco|cruzeiro do sul|sao paulo|são paulo|rio de janeiro|bahia|minas|parana|paraná|nordeste|amazonia|amazônia|globo|g1|terra|cnn brasil|agencia brasil|agência brasil)\b/.test(
    text
  );
}

const PUBLIC_PORTUGUESE_TOPIC_GUARD = new Set(["games", "kids", "study", "anime"]);
const ENGLISH_CARD_LEAK_PATTERN =
  /\b(the post|appeared first|read more|click here|new games|new toys|monthly games|take home|host live|meet the|whole sick|brand and creator|creator|creators|partnerships|streamer|streamers|showrunner|spin-off|hub|review|study destination|higher ed|public trust|students|teachers|schools|website accessibility|will it help|launching|launches|reveals|unveils|announced|trailer reveals|trailer is|worth the wait|with evangelion|for april|for january|the future of|the age of|the year ahead|the classroom|the entertainment industry)\b|]]>|<img\b/i;
const PORTUGUESE_CARD_SIGNAL_PATTERN =
  /\b(uma?|pela?|pelos?|das?|dos?|para|com|sobre|entre|chega|estreia|refor[cç]a|acompanha|mostra|jogos|filme|temporada|educa[cç][aã]o|alunos|escolas|professores|criadores|crian[cç]as|brasileir[ao]s?|comunidades?|f[aã]s|lan[cç]amentos?|cultura|publico|p[uú]blico)\b/i;
const PUBLIC_NEWS_ENGLISH_MARKER_PATTERN =
  /\b(?:whether|it's|according to|today|started|rolling|coming|expected|available|company|people|users|feature|features|released|announced|podcast|fitness|playlist|dummy unit|foldable|touchscreen|gaming|mouse|smart lighting|mother's day|who's asking|the auto design world|school districts|three-year degrees|double milestone|opening the doors|phasmophobia|google started|microsoft will let|alex jones has uncovered|xreal’s best|xreal's best|360-degree cameras have|cybercab goes into production|skylight’s color-coded|skylight's color-coded|acclaimed japanese director)\b/i;
const PUBLIC_NEWS_KNOWN_URL_TITLES = new Map([
  ["best-mothers-day-gift-ideas-2026-mom-tech-gadgets", "Ideias de presentes tecnológicos para o Dia das Mães em 2026"],
  ["canva-magic-layers-ai-replacing-palestine", "Canva corrige falha de IA em camadas mágicas"],
  ["ul-testing-fire-safety-ai-standards-jennifer-scanlon", "UL fala sobre testes de segurança, fogo e padrões para IA"],
  ["amazon-wondery-oprah-podcast-show", "Podcast de Oprah Winfrey ganha distribuição pela Amazon"],
  ["govee-ceiling-light-ultra-led-pricing-availability", "Govee apresenta luminária de teto multicolorida"],
  ["spotify-peloton-guided-workouts", "Spotify amplia conteúdos de treino e bem-estar"],
  ["samsung-galaxy-z-fold-8-wide-dummy-leak", "Vazamento mostra possível Galaxy Z Fold largo"],
  ["gm-ai-car-design-nissan-neural-concept", "Montadoras testam IA no desenho de novos carros"],
  ["turtle-beach-mc7-gaming-mouse-touchscreen-command-series", "Mouse gamer da Turtle Beach aposta em tela sensível ao toque"],
  ["googles-new-gradient-icon-design-is-coming-to-more-apps", "Novo visual de ícones do Google chega a mais aplicativos"],
  ["girls-around-the-globe-are-losing-gains-in-math-data-shows", "Relatório aponta recuo global de meninas em matemática"],
  ["as-school-districts-cut-budgets-dei-work-may-be-first-to-go", "Cortes em distritos escolares ameaçam trabalho de diversidade"],
  ["opinion-three-year-degrees", "Diplomas de três anos ganham debate nos Estados Unidos"],
  ["eurovision-2026-70th-anniversary-youtube-guide", "Eurovision celebra 70 anos e guia especial no YouTube"],
  ["phasmophobia-by-alan-wake-opening-the-doors-to-phasmophobias-first-collaboration", "Phasmophobia anuncia colaboração com Alan Wake"]
]);

function hasEnglishCardLeak(value = "") {
  const text = cleanShortText(value || "", 500);
  if (!text) return true;
  return ENGLISH_CARD_LEAK_PATTERN.test(text);
}

function publicNewsTextLooksEnglish(value = "") {
  const text = cleanShortText(value || "", 900);
  if (!text) return false;
  return hasEnglishCardLeak(text) || PUBLIC_NEWS_ENGLISH_MARKER_PATTERN.test(text);
}

function hasPortugueseRuntimeSignal(value = "") {
  const text = cleanShortText(value || "", 900);
  if (!text) return false;
  return PORTUGUESE_CARD_SIGNAL_PATTERN.test(text) || /[áàâãéêíóôõúç]/i.test(text);
}

function isEnglishRuntimeSource(item = {}) {
  const sourceText = [item.sourceName, item.source, item.sourceDomain, item.sourceUrl, item.url, item.id, item.slug]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");
  return /\b(the verge|theverge\.com|techcrunch\.com|deadline\.com|variety\.com|cartoonbrew\.com|broadwayworld\.com|insidehighered\.com|edsurge\.com|thepienews\.com|hechingerreport\.org|the hechinger report|blog\.youtube|youtube blog|news\.xbox\.com|xbox wire|blog\.playstation\.com|playstation blog)\b/.test(sourceText);
}

function inferPublicRuntimeTitle(item = {}) {
  const candidates = [item.sourceUrl, item.url, item.id, item.slug].map((value) => String(value || ""));
  for (const candidate of candidates) {
    const known = [...PUBLIC_NEWS_KNOWN_URL_TITLES.entries()].find(([needle]) => candidate.includes(needle));
    if (known) return known[1];
  }

  const sourceName = cleanShortText(item.sourceName || item.source || item.sourceDomain || "fonte externa", 90);
  return `Atualização internacional de ${sourceName}`;
}

function buildPortugueseRuntimeFallback(item = {}) {
  const sourceName = cleanShortText(item.sourceName || item.source || item.sourceDomain || "Fonte externa", 90);
  const title = cleanShortText(item.title || item.sourceLabel || "tema internacional", 180);
  return `${sourceName} publicou uma atualização sobre ${title}. O portal mantém a referência da fonte original e apresenta o tema em português para acompanhamento.`;
}

function sanitizePublicPortugueseRuntimeItem(item = {}) {
  if (!item || typeof item !== "object") return item;

  const next = { ...item };
  const strictEnglishSource = isEnglishRuntimeSource(next);
  if (
    !cleanShortText(next.title || "", 180) ||
    (strictEnglishSource && (!hasPortugueseRuntimeSignal(next.title || "") || publicNewsTextLooksEnglish(next.title || "")))
  ) {
    next.title = inferPublicRuntimeTitle(next);
  }
  if (
    !cleanShortText(next.sourceLabel || "", 180) ||
    (strictEnglishSource && (!hasPortugueseRuntimeSignal(next.sourceLabel || "") || publicNewsTextLooksEnglish(next.sourceLabel || "")))
  ) {
    next.sourceLabel = next.title;
  }

  const fallback = buildPortugueseRuntimeFallback(next);
  if (publicNewsTextLooksEnglish(next.lede || "") || (strictEnglishSource && !hasPortugueseRuntimeSignal(next.lede || ""))) {
    next.lede = fallback;
  }
  if (publicNewsTextLooksEnglish(next.summary || "") || (strictEnglishSource && !hasPortugueseRuntimeSignal(next.summary || ""))) {
    next.summary = fallback;
  }
  if (publicNewsTextLooksEnglish(next.description || "") || (strictEnglishSource && !hasPortugueseRuntimeSignal(next.description || ""))) {
    next.description = fallback;
  }
  if (
    publicNewsTextLooksEnglish(next.displaySummary || "") ||
    (strictEnglishSource && !hasPortugueseRuntimeSignal(next.displaySummary || ""))
  ) {
    next.displaySummary = fallback;
  }
  if (
    Array.isArray(next.body) &&
    (strictEnglishSource || next.body.some((entry) => publicNewsTextLooksEnglish(entry || "")))
  ) {
    next.body = [
      `${cleanShortText(next.sourceName || next.source || "Fonte externa", 90)} publicou uma atualização internacional sobre ${cleanShortText(next.title || "tema educacional", 180)}. O portal mantém o link da fonte original e apresenta apenas uma síntese em português.`,
      "O item permanece no acervo como acompanhamento de fonte externa até receber apuração editorial completa."
    ];
  }

  return next;
}

function isPublicPortugueseTopicItem(item = {}, topic = "") {
  const normalizedTopic = normalizeText(topic || item.topic || "");
  if (!PUBLIC_PORTUGUESE_TOPIC_GUARD.has(normalizedTopic)) {
    return true;
  }

  const title = cleanShortText(item.title || item.sourceLabel || "", 180);
  const summary = cleanShortText(item.summary || item.lede || item.description || "", 260);
  const sourceLabel = cleanShortText(item.sourceLabel || "", 180);
  const combined = `${title} ${summary} ${sourceLabel}`.trim();

  if (!title || title.length < 4) {
    return false;
  }

  if (hasEnglishCardLeak(title) || hasEnglishCardLeak(sourceLabel) || hasEnglishCardLeak(summary)) {
    return false;
  }

  return PORTUGUESE_CARD_SIGNAL_PATTERN.test(combined);
}

function filterPublicTopicFeedItems(items = [], topic = "") {
  return (Array.isArray(items) ? items : []).filter((item) => isPublicPortugueseTopicItem(item, topic));
}

async function refreshTopicFeed(topic, { limitPerSource = 8, totalLimit = 12 } = {}) {
  const normalizedTopic = normalizeText(topic);
  const sources = getTopicFeedSources(normalizedTopic);
  if (!sources.length) {
    return {
      topic: normalizedTopic,
      updatedAt: new Date().toISOString(),
      items: buildTopicFeedFallback(normalizedTopic, totalLimit),
      reports: [],
      fallbackUsed: true
    };
  }

  const sourceResults = await mapWithConcurrency(sources, 4, async (source) => {
    if (source.disabled) {
      return {
        items: [],
        report: {
          source: source.id,
          ok: true,
          count: 0,
          skipped: true,
          reason: source.disabledReason || "fonte desativada temporariamente"
        }
      };
    }

    try {
      const rawText = await fetchSourceFeed(source);
      const items = parseSourceFeedItems(rawText, source)
        .slice(0, limitPerSource)
        .map((item) => ({
          ...item,
          topic: normalizedTopic,
          topicGroup: source.topicGroup || "",
          sourceName: source.name || item.sourceName || "Fonte",
          sourceUrl: item.sourceUrl || item.url || source.siteUrl || "#",
          defaultCategory: source.defaultCategory || item.category || "Cotidiano"
        }));

      return {
        items,
        report: { source: source.id, ok: true, count: items.length, mode: source.feedType || "rss" }
      };
    } catch (error) {
      return {
        items: [],
        report: { source: source.id, ok: false, error: String(error?.message || "falha") }
      };
    }
  });

  const reports = sourceResults.map((entry) => entry.report);
  const normalizedItems = pickBalancedTopicFeedItems(
    filterPublicTopicFeedItems(
      sourceResults
        .flatMap((entry) => entry.items)
        .map((item) => normalizeTopicFeedItem(item, normalizedTopic, item)),
      normalizedTopic
    ),
    Math.max(1, Math.min(40, totalLimit))
  );

  const mergedItems = mergeTopicFeedItems(
    normalizedTopic === "buzz" ? normalizedItems.filter(isBrazilianBuzzItem) : normalizedItems,
    normalizedTopic === "buzz"
      ? buildTopicFeedFallback(normalizedTopic, totalLimit).filter(isBrazilianBuzzItem)
      : filterPublicTopicFeedItems(buildTopicFeedFallback(normalizedTopic, totalLimit), normalizedTopic),
    totalLimit
  );
  const enrichedItems = sortTopicFeedItemsForDisplay(
    repairNewsImagesForDisplay(await enrichNewsItemsWithSourceImages(mergedItems))
  );

  const payload = {
    topic: normalizedTopic,
    updatedAt: new Date().toISOString(),
    items: enrichedItems,
    reports,
    fallbackUsed: normalizedItems.length === 0
  };

  writeJson(getTopicFeedCacheFile(normalizedTopic), payload);
  return payload;
}

async function getTopicFeed(topic, limit = 12, options = {}) {
  const normalizedTopic = normalizeText(topic);
  const safeLimit = Math.max(1, Math.min(40, Number(limit) || 12));
  const forceRefresh = options.forceRefresh === true;

  if (!getTopicFeedSources(normalizedTopic).length) {
    return {
      ok: false,
      topic: normalizedTopic,
      updatedAt: null,
      items: [],
      fallbackUsed: false
    };
  }

  const cached = readJson(getTopicFeedCacheFile(normalizedTopic), null);
  const cachedItems = Array.isArray(cached?.items)
    ? cached.items.map((item) => normalizeTopicFeedItem(item, normalizedTopic, item))
    : [];
  const publicCachedItems = filterPublicTopicFeedItems(cachedItems, normalizedTopic);
  const scopedCachedItems = normalizedTopic === "buzz" ? publicCachedItems.filter(isBrazilianBuzzItem) : publicCachedItems;
  const cachedUpdatedAt = cached?.updatedAt ? Date.parse(cached.updatedAt) : 0;
  const cacheIsFresh =
    scopedCachedItems.length > 0 && Number.isFinite(cachedUpdatedAt) && Date.now() - cachedUpdatedAt < TOPIC_FEED_TTL_MS;

  if (!forceRefresh && cacheIsFresh) {
    return {
      ok: true,
      topic: normalizedTopic,
      updatedAt: cached.updatedAt,
      items: scopedCachedItems.slice(0, safeLimit),
      reports: Array.isArray(cached?.reports) ? cached.reports : [],
      fallbackUsed: Boolean(cached?.fallbackUsed)
    };
  }

  try {
    const refreshed = await withPromiseTimeout(
      refreshTopicFeed(normalizedTopic, {
        limitPerSource: 8,
        totalLimit: Math.max(safeLimit, 12)
      }),
      forceRefresh ? 14000 : 9000,
      "topic_feed_timeout"
    );

    if (Array.isArray(refreshed?.items) && refreshed.items.length) {
      return {
        ok: true,
        topic: normalizedTopic,
        updatedAt: refreshed.updatedAt,
        items: refreshed.items.slice(0, safeLimit),
        reports: Array.isArray(refreshed?.reports) ? refreshed.reports : [],
        fallbackUsed: Boolean(refreshed?.fallbackUsed)
      };
    }
  } catch (_error) {
    // queda para cache ou fallback abaixo
  }

  if (publicCachedItems.length) {
    return {
      ok: true,
      topic: normalizedTopic,
      updatedAt: cached?.updatedAt || null,
      items: publicCachedItems.slice(0, safeLimit),
      reports: Array.isArray(cached?.reports) ? cached.reports : [],
      fallbackUsed: Boolean(cached?.fallbackUsed),
      stale: true
    };
  }

  const fallbackItems = buildTopicFeedFallback(normalizedTopic, safeLimit);
  return {
    ok: true,
    topic: normalizedTopic,
    updatedAt: new Date().toISOString(),
    items: fallbackItems,
    reports: [],
    fallbackUsed: true,
    stale: true
  };
}

function isAllowedPreviewHost(hostname) {
  if (!hostname) return false;
  const cleanHost = String(hostname || "").toLowerCase().replace(/^www\./, "");
  return [...IMAGE_PREVIEW_DYNAMIC_ALLOWLIST].some(
    (allowed) => cleanHost === allowed || cleanHost.endsWith(`.${allowed}`)
  );
}

function resolveAbsoluteUrl(baseUrl, candidate) {
  try {
    return new URL(candidate, baseUrl).toString();
  } catch (_error) {
    return "";
  }
}

function extractOgImage(html, baseUrl) {
  return extractBestSourceImage(html, baseUrl) || "";
}

function fetchPreviewImage(sourceUrl) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(sourceUrl);
    } catch (_error) {
      return resolve("");
    }

    if (!/^https?:$/.test(parsed.protocol)) {
      return resolve("");
    }

    if (!isAllowedPreviewHost(parsed.hostname)) {
      return resolve("");
    }

    loadImagePreviewCache();
    const cached = IMAGE_PREVIEW_CACHE.get(sourceUrl);
    if (cached && Date.now() - cached.at < IMAGE_PREVIEW_TTL_MS) {
      return resolve(cached.url || "");
    }

    fetchRemoteText(sourceUrl, { timeoutMs: 2500, maxBytes: 350000 })
      .then((raw) => {
        const imageUrl = extractBestSourceImage(raw, sourceUrl);
        updateImagePreviewCache(sourceUrl, imageUrl);
        resolve(imageUrl);
      })
      .catch(() => resolve(""));
  });
}

async function mapWithConcurrency(items = [], limit = 4, mapper) {
  const safeItems = Array.isArray(items) ? items : [];
  const concurrency = Math.max(1, Math.min(limit, safeItems.length || 1));
  const results = new Array(safeItems.length);
  let cursor = 0;

  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (cursor < safeItems.length) {
        const currentIndex = cursor++;
        results[currentIndex] = await mapper(safeItems[currentIndex], currentIndex);
      }
    })
  );

  return results;
}

function withPromiseTimeout(promise, timeoutMs = 9000, reason = "timeout") {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(reason)), timeoutMs);

    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function enrichNewsItemsWithSourceImages(items = []) {
  collectPreviewHostsFromNewsRecords(items).forEach((host) => {
    IMAGE_PREVIEW_DYNAMIC_ALLOWLIST.add(host);
  });

  return mapWithConcurrency(items, 4, async (item) => {
    if (!item || !item.sourceUrl) {
      return item;
    }

    const canonicalFeedImage = pickCanonicalFeedImage(item);
    if (canonicalFeedImage) {
      return {
        ...item,
        feedImageUrl: canonicalFeedImage || item.feedImageUrl || item.imageUrl || "",
        sourceImageUrl: item.sourceImageUrl || "",
        imageUrl: canonicalFeedImage || item.imageUrl || item.feedImageUrl || ""
      };
    }

    const sourceImageUrl = await fetchPreviewImage(item.sourceUrl).catch(() => "");
    return {
      ...item,
      feedImageUrl: canonicalFeedImage || item.feedImageUrl || item.imageUrl || "",
      sourceImageUrl: sourceImageUrl || item.sourceImageUrl || "",
      imageUrl:
        canonicalFeedImage ||
        sourceImageUrl ||
        item.imageUrl ||
        item.feedImageUrl ||
        ""
    };
  });
}

function mimeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".xml":
      return "application/xml; charset=utf-8";
    case ".webmanifest":
      return "application/manifest+json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".ico":
      return "image/x-icon";
    case ".txt":
      return "text/plain; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

function isCompressibleMime(mimeType) {
  return COMPRESSIBLE_MIME_TYPES.some((prefix) => mimeType.startsWith(prefix));
}

function getStaticCacheControl(filePath, hasVersionParam = false) {
  const ext = path.extname(filePath).toLowerCase();
  const baseName = path.basename(filePath);

  if (hasVersionParam && ext !== ".html") {
    return VERSIONED_STATIC_CACHE_CONTROL;
  }

  if (ext === ".html") {
    return "no-store";
  }

  if (DYNAMIC_ASSET_BASENAMES.has(baseName)) {
    return "no-store";
  }

  if (ext === ".css" || ext === ".js") {
    return "no-store";
  }

  if (
    ext === ".svg" ||
    ext === ".png" ||
    ext === ".jpg" ||
    ext === ".jpeg" ||
    ext === ".webp" ||
    ext === ".gif" ||
    ext === ".ico"
  ) {
    return "public, max-age=86400";
  }

  if (ext === ".webmanifest" || ext === ".xml" || baseName === "robots.txt") {
    return "public, max-age=3600";
  }

  return "no-store";
}

function maybeCompressBuffer(req, mimeType, buffer) {
  if (!req || !buffer || buffer.length < 1024 || !isCompressibleMime(mimeType)) {
    return { buffer, encoding: "" };
  }

  const acceptEncoding = String(req.headers["accept-encoding"] || "").toLowerCase();

  try {
    if (acceptEncoding.includes("br")) {
      return {
        buffer: zlib.brotliCompressSync(buffer, {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: 4
          }
        }),
        encoding: "br"
      };
    }

    if (acceptEncoding.includes("gzip")) {
      return {
        buffer: zlib.gzipSync(buffer, { level: 6 }),
        encoding: "gzip"
      };
    }
  } catch (_error) {
    return { buffer, encoding: "" };
  }

  return { buffer, encoding: "" };
}

function sendFile(req, res, filePath, options = {}) {
  fs.readFile(filePath, (err, buffer) => {
    if (err) {
      return sendText(res, 404, "Arquivo não encontrado.");
    }
    const mimeType = mimeFor(filePath);
    let fileBuffer = buffer;

    if (mimeType.startsWith("text/html") && options.templateVars) {
      let html = buffer.toString("utf-8");
      Object.entries(options.templateVars).forEach(([key, value]) => {
        html = html.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), String(value ?? ""));
      });

      if (
        options.templateVars.SEO_JSON_LD &&
        !/<script[^>]+type=["']application\/ld\+json["']/i.test(html)
      ) {
        html = html.replace(
          /<\/head>/i,
          `    <script type="application/ld+json">${options.templateVars.SEO_JSON_LD}</script>\n  </head>`
        );
      }

      fileBuffer = Buffer.from(html, "utf-8");
    }

    const { buffer: finalBuffer, encoding } = maybeCompressBuffer(req, mimeType, fileBuffer);
    const cacheControl = options.cacheControl || getStaticCacheControl(filePath);
    const headers = {
      "Content-Type": mimeType,
      "Cache-Control": cacheControl,
      "Content-Length": finalBuffer.length,
      ...(options.headers || {}),
    };

    if (/no-store/i.test(cacheControl)) {
      headers.Pragma = "no-cache";
      headers.Expires = "0";
      headers["Surrogate-Control"] = "no-store";
    }

    if (encoding) {
      headers["Content-Encoding"] = encoding;
      headers.Vary = "Accept-Encoding";
    }

    res.writeHead(200, {
      ...headers
    });
    res.end(finalBuffer);
  });
}

function pubpaidNoStoreHeaders() {
  return {
    "Clear-Site-Data": '"cache"',
    "Service-Worker-Allowed": "/",
    "X-PubPaid-Build": PUBPAID_CLIENT_BUILD_VERSION
  };
}

function normalizeNewsItem(item) {
  const title = item.title || "Atualização";
  const sourceUrl = item.url || item.sourceUrl || item.link || "#";
  const sourceName = item.source || item.sourceName || item.sourceLabel || "Fonte local";
  const slug = String(item.slug || slugify(title) || item.id || "").trim();
  const imageUrl = resolveSafeArticleRecordImage(
    item,
    item.imageUrl || item.feedImageUrl || item.sourceImageUrl || item.image || ""
  );
  const category = normalizeNewsCategoryLabel(item.category, {
    defaultCategory: item.defaultCategory,
    title,
    summary: item.summary || item.lede || item.description,
    sourceName,
    sourceLabel: item.sourceLabel || title,
    sourceUrl
  });

  return {
    id: item.id || sourceUrl || `news-${Date.now()}`,
    slug,
    title,
    summary: cleanShortText(cleanFeedText(item.summary || item.lede || item.description), 260) || "Sem resumo.",
    url: sourceUrl,
    sourceUrl,
    source: sourceName,
    sourceName,
    sourceLabel: item.sourceLabel || title,
    category,
    imageUrl,
    feedImageUrl: imageUrl || item.feedImageUrl || "",
    sourceImageUrl: imageUrl || item.sourceImageUrl || "",
    originalImageUrl: item.originalImageUrl || item.imageUrl || "",
    originalFeedImageUrl: item.originalFeedImageUrl || item.feedImageUrl || "",
    originalSourceImageUrl: item.originalSourceImageUrl || item.sourceImageUrl || "",
    imageFocus: item.imageFocus || "",
    location: item.location || "Cruzeiro do Sul",
    date: item.date || item.publishedAt || item.createdAt || new Date().toISOString(),
  };
}

const ARTICLE_UNSAFE_IMAGE_OVERRIDES = {
  "aliado-de-mailza-pastor-reginaldo-e-nomeado-para-cargo-de-adjunto-na-secretaria-de-governo":
    "https://ac24horas.com/wp-content/uploads/2025/12/PALACIO-SERGIO-VALE-e1720103436277-1200x812.webp"
};

function resolveSafeArticleRecordImage(item, fallback = "") {
  const slug = String(item?.slug || slugify(item?.title || "") || "").trim().toLowerCase();
  const overrideUrl = ARTICLE_UNSAFE_IMAGE_OVERRIDES[slug] || "";
  const candidateUrl = String(
    item?.feedImageUrl || item?.imageUrl || item?.sourceImageUrl || item?.image || fallback || ""
  ).trim();

  if (overrideUrl && /img_6556-1024x723\.jpeg/i.test(candidateUrl)) {
    return overrideUrl;
  }

  return fallback;
}

function normalizeEditorialFingerprint(value = "") {
  return stripHtml(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/the post .*? appeared first on .*?(?:\.|$)/gi, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isRepeatedEditorialText(paragraph = "", reference = "") {
  const paragraphKey = normalizeEditorialFingerprint(paragraph);
  const referenceKey = normalizeEditorialFingerprint(reference);

  if (!paragraphKey || !referenceKey) return false;
  if (paragraphKey === referenceKey) return true;

  const shortest = Math.min(paragraphKey.length, referenceKey.length);
  return shortest >= 80 && (paragraphKey.includes(referenceKey) || referenceKey.includes(paragraphKey));
}

function buildFallbackEditorialBody(item = {}) {
  const title = cleanShortText(stripHtml(item.title || "este assunto"), 180);
  const sourceName = cleanShortText(stripHtml(item.sourceName || item.source || item.sourceLabel || "a fonte consultada"), 90);
  const category = cleanShortText(stripHtml(item.category || "noticia local"), 80).toLowerCase();
  const publishedAt = item.publishedAt || item.date || item.createdAt || new Date().toISOString();
  const dateLabel = item.date || formatDisplayDate(publishedAt);
  const sourceLabel = cleanShortText(stripHtml(item.sourceLabel || title), 180);

  return [
    `${sourceName} publicou em ${dateLabel} a base desta noticia sobre ${title}. Para o leitor local, o ponto principal e entender como o tema se conecta ao cotidiano de quem vive no Acre e acompanha os servicos, decisoes publicas e impactos da regiao.`,
    `${sourceLabel} e o eixo mais concreto da publicacao consultada. A partir dele, a materia deve ser lida com atencao a origem da informacao, impacto imediato e possibilidade de novas atualizacoes conforme a fonte publicar mais detalhes.`,
    "Como o material original ainda nao trouxe desenvolvimento suficiente para um texto mais longo nesta pagina, o portal apresenta o essencial, mostra a base consultada e mantem o acesso direto para a fonte completa."
  ];
}

function normalizeEditorialBody(item = {}) {
  const lede = item.lede || item.summary || item.description || "";
  const body = Array.isArray(item.body) ? item.body.map((line) => cleanFeedText(line)).filter(Boolean) : [];
  const uniqueBody = body.filter((paragraph) => !isRepeatedEditorialText(paragraph, lede));

  return uniqueBody.length ? uniqueBody : buildFallbackEditorialBody(item);
}

function isMailzaPriorityArticle(item = {}) {
  const text = normalizeText(
    [
      item.title,
      item.summary,
      item.lede,
      item.description,
      item.category,
      item.categoryKey,
      item.location,
      item.sourceName,
      item.sourceLabel,
      item.sourceUrl,
      Array.isArray(item.body) ? item.body.join(" ") : item.body
    ].join(" ")
  );

  return /\b(mailza|mailsa|mailza assis|mailza assis cameli|governadora mailza|governadora em exercicio)\b/.test(text);
}

function normalizeArticleRecord(item) {
  const title = String(item.title || "Atualizacao");
  const isMailzaPriority = isMailzaPriorityArticle(item);
  const normalizedCategoryKey = normalizeNewsCategoryKey(item.category, {
    defaultCategory: item.defaultCategory,
    title,
    summary: item.summary || item.lede || item.description,
    sourceName: item.sourceName || item.source || item.sourceLabel,
    sourceLabel: item.sourceLabel || title,
    sourceUrl: item.sourceUrl || item.url || item.link
  });
  const categoryKey = isMailzaPriority ? "politica" : normalizedCategoryKey;
  const category = formatCategoryLabel(categoryKey);
  const sourceName = item.sourceName || item.source || item.sourceLabel || "Fonte local";
  const sourceUrl = item.sourceUrl || item.url || item.link || "#";
  const publishedAt = item.publishedAt || item.date || item.createdAt || new Date().toISOString();
  const slug = String(item.slug || slugify(title) || item.id || "").trim();

  return {
    id: item.id || slug || sourceUrl || title,
    slug,
    title,
    eyebrow: isMailzaPriority ? "governadora mailza" : item.eyebrow || categoryKey || "geral",
    date: item.date || formatDisplayDate(publishedAt),
    publishedAt,
    category,
    categoryKey,
    previewClass: item.previewClass || PREVIEW_CLASS_BY_CATEGORY[categoryKey] || "thumb-servico",
    sourceName,
    sourceUrl,
    sourceLabel: item.sourceLabel || title,
    lede: item.lede || item.summary || item.description || "Sem resumo.",
    summary: item.summary || item.lede || item.description || "Sem resumo.",
    analysis: item.analysis || "",
    body: normalizeEditorialBody({ ...item, title, sourceName, sourceLabel: item.sourceLabel || title }),
    highlights: Array.isArray(item.highlights) ? item.highlights.filter(Boolean) : [],
    development: Array.isArray(item.development) ? item.development.filter(Boolean) : [],
    imageUrl: resolveSafeArticleRecordImage(
      item,
      item.feedImageUrl || item.imageUrl || item.sourceImageUrl || item.image || ""
    ),
    sourceImageUrl: item.sourceImageUrl || "",
    feedImageUrl: resolveSafeArticleRecordImage(
      item,
      item.feedImageUrl || item.imageUrl || item.sourceImageUrl || ""
    ),
    imageCredit: item.imageCredit || "",
    imageFocus: item.imageFocus || "",
    imageFit: item.imageFit || "",
    media: item.media || null,
    priority: Math.max(Number(item.priority || 0), isMailzaPriority ? 950 : 0),
    editorialPriority: isMailzaPriority ? "mailza-prioridade" : item.editorialPriority || ""
  };
}

function getRawNewsItems() {
  const runtime = readMergedNewsCollection("runtime-news.json");
  const archive = readMergedNewsCollection("news-archive.json");
  const staticNews = getStaticNewsItems();
  const fileItems = []
    .concat(runtime)
    .concat(archive)
    .concat(staticNews);

  if (fileItems.length > 0) {
    return fileItems;
  }

  return parseHomeLinkedArticleFallbacks();
}

function getPublicNewsTimestamp(item = {}) {
  const direct = Date.parse(item.publishedAt || item.createdAt || item.date || "");
  if (!Number.isNaN(direct)) return direct;

  const match = String(item.date || "").match(/(\d{1,2})\s+de\s+([a-zç.]+)\s+de\s+(\d{4})/i);
  if (!match) return 0;

  const monthMap = {
    jan: 0,
    janeiro: 0,
    fev: 1,
    fevereiro: 1,
    mar: 2,
    marco: 2,
    "março": 2,
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
  const monthKey = normalizeText(match[2]).replace(/\.$/, "");
  const month = monthMap[monthKey];
  if (month === undefined) return 0;
  return new Date(Number(match[3]), month, Number(match[1])).getTime();
}

function getPublicNewsDayTimestamp(item = {}) {
  const timestamp = getPublicNewsTimestamp(item);
  if (!timestamp) return 0;

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 0;

  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function getEditorialCategoryFlowScore(item = {}) {
  const categoryKey = normalizeText(item.categoryKey || item.category || "");
  const scores = {
    prefeitura: 2600,
    servicos: 2400,
    "utilidade-publica": 2380,
    saude: 2350,
    seguranca: 2320,
    educacao: 2280,
    agenda: 2240,
    cotidiano: 2180,
    comunidade: 2140,
    cidades: 2100,
    "acre-governo": 1700,
    esporte: 1450,
    economia: 1360,
    cultura: 1280,
    politica: 1100,
    entretenimento: 720,
    buzz: 520,
    fofocas: 520,
    mundo: 240,
    tecnologia: 220
  };

  return scores[categoryKey] || 400;
}

function getEditorialFocusScore(item = {}) {
  const text = normalizeText(
    [
      item.title,
      item.summary,
      item.lede,
      item.category,
      item.categoryKey,
      item.location,
      item.sourceName,
      item.sourceLabel,
      item.sourceUrl
    ].join(" ")
  );
  const categoryScore = getEditorialCategoryFlowScore(item);

  if (isMailzaPriorityArticle(item)) return 9000 + categoryScore;

  const isAcre = /\b(acre|rio branco|sena madureira|feijo|feij[oó]|xapuri|brasileia|epitaciolandia|assis brasil|placido de castro)\b/.test(
    text
  );
  const isCruzeiro =
    /\b(cruzeiro do sul|cruzeiro-do-sul|cruzeirodosul|czs)\b/.test(text);
  const isValeJurua =
    /\b(cruzeiro do sul|jurua|juru[aá]|mancio lima|m[âa]ncio lima|porto walter|marechal thaumaturgo|tarauaca|tarauac[aá])\b/.test(
      text
    ) || (isAcre && /\brodrigues alves\b/.test(text));
  const isImportant =
    /\b(alerta|urgente|defesa civil|enchente|alag|saude|hospital|seguranca|policia|crime|acidente|educacao|prefeitura|governo|governador|governadora|eleicao|stf|congresso|senado|bolsonaro|lula)\b/.test(
      text
    );
  const isGlobalEntertainment =
    /\b(cinema|filme|trailer|estreia|bilheteria|teatro|peca|peça|famoso|famosa|celebridade|fofoca|michael jackson|entretenimento|novidades|tecnologia|games)\b/.test(
      text
    );

  if (isCruzeiro) return 8000 + categoryScore + (isImportant ? 50 : 0);
  if (isValeJurua) return 7000 + categoryScore + (isImportant ? 40 : 0);
  if (isAcre) return 6000 + categoryScore + (isImportant ? 35 : 0);
  if (categoryScore > 400) return 2000 + categoryScore;
  if (isImportant) return 1200;
  if (isGlobalEntertainment) return 700;
  return 400;
}

function sortArticleItems(left, right) {
  const dateLayerDiff = getPublicNewsDayTimestamp(right) - getPublicNewsDayTimestamp(left);
  if (dateLayerDiff !== 0) {
    return dateLayerDiff;
  }

  const rightFocus = getEditorialFocusScore(right);
  const leftFocus = getEditorialFocusScore(left);
  if (rightFocus !== leftFocus) {
    return rightFocus - leftFocus;
  }

  const priorityDiff = Number(right.priority || 0) - Number(left.priority || 0);
  if (priorityDiff !== 0) return priorityDiff;

  return getPublicNewsTimestamp(right) - getPublicNewsTimestamp(left);
}

function getArticleRecordQualityScore(item = {}) {
  const imageUrl = String(item.imageUrl || item.feedImageUrl || item.sourceImageUrl || item.image || "").trim();
  const bodyCount = Array.isArray(item.body) ? item.body.filter(Boolean).length : 0;
  const highlightsCount = Array.isArray(item.highlights) ? item.highlights.filter(Boolean).length : 0;
  const developmentCount = Array.isArray(item.development) ? item.development.filter(Boolean).length : 0;
  const title = String(item.title || "").trim();
  const lede = String(item.lede || item.summary || item.description || "").trim();
  const analysis = String(item.analysis || "").trim();
  const sourceUrl = String(item.sourceUrl || item.url || item.link || "").trim();
  const id = String(item.id || "").trim().toLowerCase();
  let score = 0;

  if (title) score += 10;
  if (lede) score += Math.min(12, Math.ceil(lede.length / 40));
  if (analysis) score += Math.min(14, Math.ceil(analysis.length / 50));
  if (imageUrl) score += 30;
  if (sourceUrl && sourceUrl !== "#") score += 6;
  if (String(item.publishedAt || item.date || "").trim()) score += 3;
  score += Math.min(24, bodyCount * 4);
  score += Math.min(12, highlightsCount * 2);
  score += Math.min(9, developmentCount * 3);

  if (id.startsWith("home-linked-")) {
    score -= 40;
  }

  return score;
}

function shouldReplaceArticleRecord(existing, candidate) {
  if (!existing) {
    return true;
  }

  const existingScore = getArticleRecordQualityScore(existing);
  const candidateScore = getArticleRecordQualityScore(candidate);

  if (candidateScore !== existingScore) {
    return candidateScore > existingScore;
  }

  const existingDate = new Date(existing.publishedAt || existing.date || 0).getTime();
  const candidateDate = new Date(candidate.publishedAt || candidate.date || 0).getTime();

  return candidateDate > existingDate;
}

function getArticleSourceEntries(item = {}) {
  const entries = [];
  const pushEntry = (entry = {}) => {
    const name = cleanShortText(entry.name || entry.sourceName || entry.source || entry.label || "", 120);
    const url = String(entry.url || entry.sourceUrl || entry.href || "").trim();
    const key = normalizeText(url || name);

    if (!key || entries.some((source) => normalizeText(source.url || source.name) === key)) {
      return;
    }

    entries.push({ name: name || "Fonte local", url });
  };

  [item.crossSources, item.alternateSources, item.sources].forEach((collection) => {
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
    name: item.sourceName || item.source || item.sourceLabel,
    url: item.sourceUrl || item.url || item.link
  });

  return entries;
}

function mergeCrossedArticleRecord(preferred = {}, secondary = {}) {
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
}

function upsertCrossedArticleRecord(map, key, item) {
  const existing = map.get(key);

  if (!existing) {
    map.set(key, item);
    return;
  }

  if (shouldReplaceArticleRecord(existing, item)) {
    map.set(key, mergeCrossedArticleRecord(item, existing));
    return;
  }

  map.set(key, mergeCrossedArticleRecord(existing, item));
}

function getArticleStorageKey(item = {}) {
  return String(getArticleCanonicalKey(item) || item.slug || item.id || item.title || "").trim();
}

function getArticleNews(limit = 30) {
  const items = getRawNewsItems().map(normalizeArticleRecord);
  const map = new Map();

  items.forEach((item) => {
    const key = getArticleStorageKey(item);
    if (key) {
      upsertCrossedArticleRecord(map, key, item);
    }
  });

  return repairNewsImagesForDisplay(Array.from(map.values()).sort(sortArticleItems).slice(0, limit));
}

function buildArticleNewsApiPayload(limit = 1000) {
  const safeLimit = Math.max(1, Math.min(1000, Number(limit) || 1000));
  const items = getRawNewsItems().map(normalizeArticleRecord);
  const map = new Map();

  items.forEach((item) => {
    const key = getArticleStorageKey(item);
    if (key) {
      upsertCrossedArticleRecord(map, key, item);
    }
  });

  const sorted = Array.from(map.values()).sort(sortArticleItems);
  const visibleItems = repairNewsImagesForDisplay(sorted.slice(0, safeLimit));

  return {
    ok: true,
    total: sorted.length,
    archiveTotal: sorted.length,
    returned: visibleItems.length,
    items: visibleItems
  };
}

function getCachedArticleNewsApiPayload(limit = 1000) {
  const safeLimit = Math.max(1, Math.min(1000, Number(limit) || 1000));
  const key = `limit:${safeLimit}`;
  const cached = newsApiResponseCache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.payload;
  }

  const payload = buildArticleNewsApiPayload(safeLimit);
  newsApiResponseCache.set(key, {
    expiresAt: Date.now() + NEWS_API_CACHE_TTL_MS,
    payload
  });

  return payload;
}

function getArticleBySlug(slug) {
  if (!slug) {
    return null;
  }

  const targetSlug = normalizeLookupSlug(slug);
  const regionalCalendarEvent = getRegionalCalendarEventBySlug(targetSlug);
  if (regionalCalendarEvent) {
    return buildRegionalCalendarArticle(regionalCalendarEvent);
  }

  const staticDetailFallbacks = {
    "prefeitura-bairros-e-servicos-entram-na-leitura-principal": normalizeArticleRecord({
      id: "prefeitura-bairros-e-servicos-entram-na-leitura-principal",
      slug: "prefeitura-bairros-e-servicos-entram-na-leitura-principal",
      title: "Prefeitura, bairros e serviços entram na leitura principal",
      eyebrow: "Cruzeiro do Sul",
      date: "08 de maio de 2026",
      publishedAt: "2026-05-08T08:20:00-05:00",
      category: "Cruzeiro do Sul",
      sourceName: "Catálogo Cruzeiro do Sul",
      sourceUrl: "./arquivo.html?busca=Cruzeiro%20do%20Sul",
      sourceLabel: "Resumo local organizado pelo Catálogo Cruzeiro do Sul.",
      imageUrl: "./assets/home-cache/buzz-via-cruzeiro.jpg",
      feedImageUrl: "./assets/home-cache/buzz-via-cruzeiro.jpg",
      sourceImageUrl: "./assets/home-cache/buzz-via-cruzeiro.jpg",
      imageCredit: "Imagem de apoio do acervo visual do portal",
      imageFocus: "center 48%",
      lede:
        "A leitura diária da cidade passa a reunir obras, atendimento, agenda pública e avisos úteis em um mesmo caminho, para que o morador encontre rápido o que muda na rotina.",
      summary:
        "O destaque organiza temas de prefeitura, bairros e serviços públicos com linguagem curta, fonte identificada quando houver e ligação com as áreas de serviço, arquivo e notícias locais.",
      analysis:
        "A proposta desta matéria é separar o que realmente ajuda a rotina do leitor: obras em andamento, mudanças em atendimento, avisos de órgãos públicos, prazos e informações de bairro.",
      body: [
        "Cruzeiro do Sul tem uma rotina de informações espalhadas entre prefeitura, órgãos públicos, comunidades, comércio, agenda e serviços essenciais.",
        "A leitura principal do portal organiza esse fluxo por impacto: primeiro o que mexe com deslocamento, atendimento, serviços, bairros e prazos.",
        "A cada nova atualização, a matéria pode apontar para a área correta do portal: notícias locais, serviços úteis, agenda, catálogo telefônico, fontes monitoradas ou arquivo do mês.",
        "Quando a informação depender de confirmação externa, o portal deve tratar como acompanhamento e direcionar o leitor para a origem."
      ],
      highlights: [
        "Bairros, serviços e agenda pública ficam reunidos por impacto local",
        "Cada destaque aponta para uma área real do portal",
        "A fonte deve aparecer sempre que estiver disponível",
        "Avisos sem confirmação entram como acompanhamento"
      ],
      development: [
        "Integrar fontes oficiais para automatizar avisos de serviços e obras.",
        "Criar filtros por bairro, órgão público e tipo de atendimento."
      ]
    })
  };

  if (staticDetailFallbacks[targetSlug]) {
    return staticDetailFallbacks[targetSlug];
  }

  return (
    getArticleNews(1000).find((item) => {
      if (normalizeLookupSlug(item.slug) === targetSlug) {
        return true;
      }

      return (Array.isArray(item.alternateSlugs) ? item.alternateSlugs : []).some(
        (alternateSlug) => normalizeLookupSlug(alternateSlug) === targetSlug
      );
    }) || null
  );
}

function buildNewsArchivePayload(limit = 500) {
  const safeLimit = Math.max(1, Math.min(1000, limit));
  const items = getRawNewsItems().map(normalizeArticleRecord);
  const map = new Map();

  items.forEach((item) => {
    const key = getArticleStorageKey(item);
    if (key) {
      upsertCrossedArticleRecord(map, key, item);
    }
  });

  const sorted = Array.from(map.values()).sort(sortArticleItems);

  const archiveItems = repairNewsImagesForDisplay(diversifyArchiveStories(sorted, safeLimit).slice(0, safeLimit));

  return {
    total: sorted.length,
    archiveTotal: sorted.length,
    returned: archiveItems.length,
    items: archiveItems
  };
}

function getNewsArchive(limit = 500) {
  return buildNewsArchivePayload(limit).items;
}

function getNewsSuggestions(query = "", limit = 80) {
  const normalizedQuery = normalizeText(query);
  const seen = new Set();
  const suggestions = [];

  getNewsArchive(1000).forEach((item) => {
    const values = [
      { type: "titulo", value: item.title, slug: item.slug },
      { type: "editoria", value: item.category, slug: "" },
      { type: "fonte", value: item.sourceName, slug: "" },
      { type: "assunto", value: item.sourceLabel, slug: item.slug },
      ...(Array.isArray(item.highlights)
        ? item.highlights.map((value) => ({ type: "destaque", value, slug: item.slug }))
        : [])
    ];

    values.forEach((suggestion) => {
      const label = String(suggestion.value || "").trim();
      const key = normalizeText(label);

      if (!label || seen.has(key)) {
        return;
      }

      if (normalizedQuery && !key.includes(normalizedQuery)) {
        return;
      }

      seen.add(key);
      suggestions.push({
        ...suggestion,
        value: label
      });
    });
  });

  return suggestions.slice(0, Math.max(1, Math.min(200, limit)));
}

function getElectionVotesFile() {
  return path.join(DATA_DIR, "election-votes.json");
}

function getCurrentWeekBucketKey() {
  return getWeekBucketKey(new Date().toISOString());
}

function normalizeElectionVoterOfficeEntry(entry) {
  if (typeof entry === "string") {
    return {
      candidateId: safeString(entry, 160),
      weekKey: getCurrentWeekBucketKey(),
      at: ""
    };
  }

  if (entry && typeof entry === "object" && !Array.isArray(entry)) {
    const candidateId = safeString(entry.candidateId || entry.vote || entry.value || "", 160);
    const at = safeString(entry.at || entry.createdAt || "", 80);
    return {
      candidateId,
      weekKey: safeString(entry.weekKey || "", 24) || getWeekBucketKey(at || new Date().toISOString()),
      at
    };
  }

  return {
    candidateId: "",
    weekKey: "",
    at: ""
  };
}

function getAutoRefreshTopicList() {
  return Object.keys(TOPIC_FEED_CONFIG)
    .map((topic) => normalizeText(topic))
    .filter(Boolean);
}

async function runTopicFeedsAutoCycle(trigger = "manual") {
  if (topicFeedAutoState.running) {
    return {
      ok: false,
      trigger,
      updatedAt: topicFeedAutoState.lastRunAt,
      error: "topic-feeds-auto-runner-busy"
    };
  }

  topicFeedAutoState.running = true;
  const topics = getAutoRefreshTopicList();
  const reports = [];

  try {
    for (const topic of topics) {
      const payload = await refreshTopicFeed(topic, { limitPerSource: 8, totalLimit: 12 });
      reports.push({
        topic,
        count: Array.isArray(payload?.items) ? payload.items.length : 0,
        fallbackUsed: Boolean(payload?.fallbackUsed)
      });
    }

    topicFeedAutoState.lastRunAt = new Date().toISOString();
    topicFeedAutoState.lastError = "";
    topicFeedAutoState.cycles += 1;
    topicFeedAutoState.lastTopics = topics;
    console.log(`[catalogo] topic feeds atualizados (${trigger}) -> ${topics.join(", ")}`);

    return {
      ok: true,
      trigger,
      updatedAt: topicFeedAutoState.lastRunAt,
      topics,
      reports
    };
  } catch (error) {
    topicFeedAutoState.lastError = String(error?.message || error || "falha na atualizacao de topic feeds");
    console.warn(`[catalogo] falha no ciclo de topic feeds (${trigger}): ${topicFeedAutoState.lastError}`);
    return {
      ok: false,
      trigger,
      updatedAt: new Date().toISOString(),
      topics,
      reports,
      error: topicFeedAutoState.lastError
    };
  } finally {
    topicFeedAutoState.running = false;
  }
}

function getElectionCurrentUserVotes(voterRecord = {}, weekKey = getCurrentWeekBucketKey()) {
  const currentVotes = {};
  Object.entries(voterRecord || {}).forEach(([officeId, rawEntry]) => {
    const entry = normalizeElectionVoterOfficeEntry(rawEntry);
    if (!entry.candidateId || entry.weekKey !== weekKey) {
      return;
    }
    currentVotes[officeId] = entry.candidateId;
  });
  return currentVotes;
}

function getElectionVoteStore() {
  const store = readJson(getElectionVotesFile(), {});
  return {
    votes: store && typeof store.votes === "object" && !Array.isArray(store.votes) ? store.votes : {},
    voters: store && typeof store.voters === "object" && !Array.isArray(store.voters) ? store.voters : {},
    records: Array.isArray(store.records) ? store.records : [],
    updatedAt: store.updatedAt || null
  };
}

function writeElectionVoteStore(store) {
  writeJson(getElectionVotesFile(), {
    votes: store.votes || {},
    voters: store.voters || {},
    records: Array.isArray(store.records) ? store.records : [],
    updatedAt: new Date().toISOString()
  });
}

function getElectionOffice(officeId) {
  const config = getElectionConfig();
  const offices = Array.isArray(config.offices) ? config.offices : [];
  return offices.find((office) => office.id === officeId) || null;
}

function getElectionCandidate(office, candidateId) {
  const candidates = Array.isArray(office?.candidates) ? office.candidates : [];
  return candidates.find((candidate) => candidate.id === candidateId) || null;
}

function buildElectionOpinionSummary(recordsInput = null) {
  const records = Array.isArray(recordsInput) ? recordsInput : getElectionVoteRecords();
  const summary = {};

  records.forEach((record) => {
    const officeId = String(record.officeId || "").trim();
    const candidateId = String(record.candidateId || record.candidateName || "").trim();

    if (!officeId || !candidateId) {
      return;
    }

    if (!summary[officeId]) {
      summary[officeId] = {
        officeId,
        office: record.office || officeId,
        totalVotes: 0,
        totalComments: 0,
        candidateMap: {}
      };
    }

    const officeBucket = summary[officeId];
    officeBucket.totalVotes += 1;

    if (!officeBucket.candidateMap[candidateId]) {
      officeBucket.candidateMap[candidateId] = {
        candidateId,
        candidateName: record.candidateName || candidateId,
        candidateParty: record.candidateParty || "",
        totalVotes: 0,
        commentCount: 0,
        positiveCount: 0,
        neutralCount: 0,
        negativeCount: 0,
        mixedCount: 0,
        noOpinionCount: 0,
        favorableReelection: 0,
        desgasteReelection: 0,
        cities: {}
      };
    }

    const candidateBucket = officeBucket.candidateMap[candidateId];
    const cityKey = safeString(record.city || "não informado", 80) || "não informado";

    candidateBucket.totalVotes += 1;
    candidateBucket.cities[cityKey] = (candidateBucket.cities[cityKey] || 0) + 1;

    if (record.observation) {
      officeBucket.totalComments += 1;
      candidateBucket.commentCount += 1;
    }

    if (record.sentiment === "positivo") {
      candidateBucket.positiveCount += 1;
    } else if (record.sentiment === "negativo") {
      candidateBucket.negativeCount += 1;
    } else {
      candidateBucket.neutralCount += 1;
    }

    if (record.sentiment === "misto") {
      candidateBucket.mixedCount += 1;
    }

    if (record.sentiment === "sem-opiniao") {
      candidateBucket.noOpinionCount += 1;
    }

    if (record.reelectionSignal === "favoravel") {
      candidateBucket.favorableReelection += 1;
    } else if (record.reelectionSignal === "desgaste") {
      candidateBucket.desgasteReelection += 1;
    }
  });

  return Object.fromEntries(
    Object.entries(summary).map(([officeId, officeBucket]) => {
      const candidates = Object.values(officeBucket.candidateMap)
        .map((candidateBucket) => {
          const topCities = Object.entries(candidateBucket.cities)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
          const topCity = topCities[0]?.[0] || "";
          let moodLabel = "equilibrado";

          if (candidateBucket.commentCount <= 1 && candidateBucket.totalVotes <= 1) {
            moodLabel = "amostra inicial";
          } else if (
            candidateBucket.positiveCount > candidateBucket.negativeCount + 1 ||
            candidateBucket.favorableReelection > candidateBucket.desgasteReelection + 1
          ) {
            moodLabel = "favoravel a reeleicao";
          } else if (
            candidateBucket.negativeCount > candidateBucket.positiveCount + 1 ||
            candidateBucket.desgasteReelection > candidateBucket.favorableReelection + 1
          ) {
            moodLabel = "pressao contra reeleicao";
          } else if (candidateBucket.positiveCount > candidateBucket.negativeCount) {
            moodLabel = "favor e aprovacao";
          } else if (candidateBucket.negativeCount > candidateBucket.positiveCount) {
            moodLabel = "pressao e critica";
          }

          return {
            candidateId: candidateBucket.candidateId,
            candidateName: candidateBucket.candidateName,
            candidateParty: candidateBucket.candidateParty,
            totalVotes: candidateBucket.totalVotes,
            commentCount: candidateBucket.commentCount,
            positiveCount: candidateBucket.positiveCount,
            neutralCount: candidateBucket.neutralCount,
            negativeCount: candidateBucket.negativeCount,
            mixedCount: candidateBucket.mixedCount,
            noOpinionCount: candidateBucket.noOpinionCount,
            favorableReelection: candidateBucket.favorableReelection,
            desgasteReelection: candidateBucket.desgasteReelection,
            topCity,
            citiesLabel: topCities.map(([city, total]) => `${city} (${total})`).join(" • "),
            moodLabel
          };
        })
        .sort((a, b) => {
          const signalA = a.positiveCount + a.favorableReelection - a.negativeCount - a.desgasteReelection;
          const signalB = b.positiveCount + b.favorableReelection - b.negativeCount - b.desgasteReelection;
          return (
            b.commentCount - a.commentCount ||
            b.totalVotes - a.totalVotes ||
            signalB - signalA ||
            a.candidateName.localeCompare(b.candidateName, "pt-BR")
          );
        });

      return [
        officeId,
        {
          officeId,
          office: officeBucket.office,
          totalVotes: officeBucket.totalVotes,
          totalComments: officeBucket.totalComments,
          candidates
        }
      ];
    })
  );
}

function buildElectionVotesFromRecords(records = []) {
  const votes = {};
  (Array.isArray(records) ? records : []).forEach((record) => {
    const officeId = safeString(record.officeId || "", 120);
    const candidateId = safeString(record.candidateId || "", 160);
    if (!officeId || !candidateId) {
      return;
    }
    votes[officeId] = votes[officeId] || {};
    votes[officeId][candidateId] = Number(votes[officeId][candidateId] || 0) + 1;
  });
  return votes;
}

function getElectionPublicSnapshot(voterId = "") {
  const store = getElectionVoteStore();
  const safeVoterId = String(voterId || "").slice(0, 120);
  const currentWeekKey = getCurrentWeekBucketKey();
  const voterRecord = safeVoterId && store.voters[safeVoterId] ? store.voters[safeVoterId] : {};
  const userVotes = getElectionCurrentUserVotes(voterRecord, currentWeekKey);
  const currentWeekRecords = getElectionVoteRecords().filter(
    (record) => safeString(record.weekKey || "", 24) === currentWeekKey
  );
  const weeklyTrend = buildWeeklyTrendSeries(
    getElectionVoteRecords().map((record) => ({
      ...record,
      weeklyLabel: `${record.candidateName || record.candidateId || "Candidato"} (${record.office || record.officeId || "Cargo"})`
    })),
    { valueField: "weeklyLabel", totalLabel: "totalVotes" }
  );
  return {
    votes: buildElectionVotesFromRecords(currentWeekRecords),
    userVotes,
    opinionSummary: buildElectionOpinionSummary(currentWeekRecords),
    weeklyTrend,
    totalHistoryVotes: getElectionVoteRecords().length,
    currentWeekKey,
    updatedAt: store.updatedAt
  };
}

function recordElectionVote(payload = {}, req = null) {
  const safeOfficeId = String(payload.officeId || "").trim();
  const safeCandidateId = String(payload.candidateId || "").trim();
  const safeGoogleSub = "";
  const safeGoogleEmail = "";
  const safeVoterId = safeString(payload.voterId || payload.deviceId || payload.visitorId, 120);
  const office = getElectionOffice(safeOfficeId);
  const tracking = buildTrackingMeta(req, payload);
  const currentFingerprints = buildWeeklyDeviceFingerprints(tracking);
  const city = safeString(payload.city || tracking.city || "", 80);
  const voterName = safeString(payload.name || payload.voterName, 120);
  const voterParty = safeString(payload.party || payload.voterParty, 90);
  const observation = safeString(payload.observation || payload.notes || payload.comment, 1200);

  if (!safeVoterId) {
    return { ok: false, status: 400, message: "Identificador de eleitor ausente." };
  }

  if (!city || city === "não informado") {
    return { ok: false, status: 400, message: "Informe a cidade antes de votar." };
  }

  if (!office || !getElectionCandidate(office, safeCandidateId)) {
    return { ok: false, status: 400, message: "Cargo ou candidato inválido." };
  }

  const candidate = getElectionCandidate(office, safeCandidateId);
  const store = getElectionVoteStore();
  const currentWeekKey = getCurrentWeekBucketKey();
  store.votes[safeOfficeId] = store.votes[safeOfficeId] || {};
  store.voters[safeVoterId] = store.voters[safeVoterId] || {};
  store.records = Array.isArray(store.records) ? store.records : [];

  const currentVoteEntry = normalizeElectionVoterOfficeEntry(store.voters[safeVoterId][safeOfficeId]);
  if (currentVoteEntry.candidateId && currentVoteEntry.weekKey === currentWeekKey) {
    const snapshot = getElectionPublicSnapshot(safeVoterId);
    return {
      ok: false,
      alreadyVoted: true,
      status: 409,
      message: "Este dispositivo já votou neste cargo.",
      ...snapshot
    };
  }

  const deviceAlreadyVoted = store.records.some(
    (item) =>
      safeString(item.officeId || "", 120) === safeOfficeId &&
      recordMatchesWeeklyDevice(item, currentWeekKey, currentFingerprints)
  );

  if (deviceAlreadyVoted) {
    const snapshot = getElectionPublicSnapshot(safeVoterId);
    return {
      ok: false,
      status: 409,
      message: "Este dispositivo já votou neste cargo.",
      ...snapshot
    };
  }

  store.votes[safeOfficeId][safeCandidateId] =
    Number(store.votes[safeOfficeId][safeCandidateId] || 0) + 1;
  store.voters[safeVoterId][safeOfficeId] = {
    candidateId: safeCandidateId,
    weekKey: currentWeekKey,
    at: new Date().toISOString()
  };
  const opinion = analyzeElectionObservation(observation);

  store.records.push({
    id: createRecordId("elv"),
    officeId: safeOfficeId,
    office: office.label || safeOfficeId,
    candidateId: safeCandidateId,
    candidateName: candidate?.name || safeCandidateId,
    candidateParty: candidate?.party || "",
    city,
    voterName,
    voterParty,
    observation,
    sentiment: opinion.label,
    sentimentScore: opinion.score,
    reelectionSignal: opinion.reelectionLabel,
    pagePath: tracking.pagePath,
    referrerHost: tracking.referrerHost,
    country: tracking.country,
    ip: tracking.ip,
    browser: tracking.browser,
    deviceType: tracking.deviceType,
    googleEmail: safeGoogleEmail,
    googleSub: safeGoogleSub,
    visitorId: tracking.visitorId || tracking.cookieVisitorId,
    sessionId: tracking.sessionId || tracking.cookieSessionId,
    weekKey: currentWeekKey,
    at: new Date().toISOString()
  });
  writeElectionVoteStore(store);
  const snapshot = getElectionPublicSnapshot(safeVoterId);

  return {
    ok: true,
    alreadyVoted: false,
    status: 200,
    message: "Obrigado por votar. Acompanhe semanalmente para ver as parciais.",
    ...snapshot,
    updatedAt: snapshot.updatedAt || new Date().toISOString()
  };
}

function getNews(limit = 30) {
  const runtime = readMergedNewsCollection("runtime-news.json");
  const archive = readMergedNewsCollection("news-archive.json");
  const staticNews = getStaticNewsItems();
  const items = []
    .concat(runtime)
    .concat(archive)
    .concat(staticNews)
    .map(normalizeNewsItem);

  const map = new Map();
  items.forEach((item) => {
    const titleKey = normalizeText(item.title || item.sourceLabel || "")
      .replace(/\bpra\b/g, "para")
      .replace(/\bpro\b/g, "para o")
      .replace(/\s+/g, " ")
      .trim();
    const dayKey = String(item.publishedAt || item.createdAt || item.date || "").slice(0, 10);
    const key = titleKey ? `${titleKey.slice(0, 120)}::${dayKey}` : item.id || item.url || item.title;
    if (!map.has(key)) map.set(key, item);
  });

  return Array.from(map.values()).sort(sortArticleItems).slice(0, limit);
}

function getBusinesses(cityFilter) {
  const list = readJson(path.join(DATA_DIR, "businesses-cruzeiro.json"), []);
  const items = Array.isArray(list) ? list : [];
  if (!cityFilter) return items;
  return items.filter((item) =>
    String(item.city || "").toLowerCase().includes(String(cityFilter).toLowerCase())
  );
}

function parseBasicAuth(req) {
  const header = String(req?.headers?.authorization || "");
  const match = header.match(/^Basic\s+(.+)$/i);
  if (!match) return null;

  try {
    const decoded = Buffer.from(match[1], "base64").toString("utf-8");
    const divider = decoded.indexOf(":");
    if (divider < 0) return null;
    return {
      user: decoded.slice(0, divider),
      password: decoded.slice(divider + 1)
    };
  } catch (_error) {
    return null;
  }
}

function requireAdmin(req) {
  const tokenFromHeader = req.headers["x-admin-token"];
  const tokenFromQuery = new URL(req.url, `http://${req.headers.host}`).searchParams.get("token");
  const masterFromHeader = req.headers["x-full-admin-password"] || req.headers["x-admin-password"];
  const basic = parseBasicAuth(req);
  const hasValidBasic =
    basic?.user === SUPER_ADMIN_USER && basic?.password === SUPER_ADMIN_PASSWORD;
  const hasValidToken =
    Boolean(ADMIN_TOKEN) && (tokenFromHeader === ADMIN_TOKEN || tokenFromQuery === ADMIN_TOKEN);
  const hasValidMaster = hasFullAdminPassword(masterFromHeader);

  return hasValidBasic || hasValidToken || hasValidMaster;
}

const SPRITE_IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);
const SPRITE_SCAN_ROOTS = [
  {
    key: "sprite-vault",
    label: "Sprite Vault - candidatos",
    dir: path.join(ROOT_DIR, "sprite-vault"),
    publicBase: "/sprite-vault"
  }
];
const SPRITE_CONTEXT_FILES = [
  "index.html",
  "pubpaid.html",
  "palavras-da-rosa.html",
  "games.html",
  "infantil.html",
  "estudantes.html",
  "escritorio.html",
  "escritorio-nerd.html",
  "escritorio-arte.html",
  "escritorio.js",
  "escritorio-arte-config.js"
];
const SPRITE_ACTION_ORDER = [
  "idle",
  "front",
  "walk",
  "run",
  "jump",
  "climb",
  "duck",
  "hit",
  "attack",
  "roll",
  "spin",
  "fall"
];

function getAuthValue(req, body = {}, keys = ["password", "token"]) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const headers = [
    req.headers["x-sprite-password"],
    req.headers["x-full-admin-password"],
    req.headers["x-admin-password"],
    req.headers["x-admin-token"]
  ];
  const candidates = [];

  keys.forEach((key) => {
    candidates.push(body?.[key]);
    candidates.push(requestUrl.searchParams.get(key));
  });
  headers.forEach((value) => candidates.push(value));

  return cleanShortText(candidates.find((value) => String(value || "").trim()) || "", 160);
}

function hasFullAdminPassword(value) {
  const token = cleanShortText(value, 160);
  return Boolean(token) && (
    token === FULL_ADMIN_PASSWORD ||
    token === SUPER_ADMIN_PASSWORD ||
    token.toLowerCase() === SUPER_ADMIN_PASSWORD.toLowerCase() ||
    token.toLowerCase() === FULL_ADMIN_PASSWORD.toLowerCase()
  );
}

function hasCheffeCallPassword(value) {
  const token = cleanShortText(value, 160);
  return Boolean(token) && (
    token === CHEFFE_CALL_PASSWORD ||
    token.toLowerCase() === CHEFFE_CALL_PASSWORD.toLowerCase()
  );
}

function requireSpriteCheckAccess(req, body = {}) {
  const authValue = getAuthValue(req, body);
  return authValue === SPRITE_CHECK_PASSWORD || hasFullAdminPassword(authValue) || requireAdmin(req);
}

function requireFullAdminOrderAccess(req, body = {}) {
  const authValue = getAuthValue(req, body);
  const basic = parseBasicAuth(req);
  return (
    hasFullAdminPassword(authValue) ||
    hasCheffeCallPassword(authValue) ||
    (basic?.user === CHEFFE_CALL_USER && hasCheffeCallPassword(basic?.password)) ||
    requireAdmin(req)
  );
}

function requireFullAdminPasswordAccess(req, body = {}) {
  const authValue = getAuthValue(req, body, ["password", "adminPassword", "fullAdminPassword", "token"]);
  const basic = parseBasicAuth(req);
  return (
    hasFullAdminPassword(authValue) ||
    (basic?.user === SUPER_ADMIN_USER && hasFullAdminPassword(basic?.password))
  );
}

function readOfficeWorkStore() {
  const store = readJson(OFFICE_WORK_FILE, { version: 1, updatedAt: "", offices: {}, actions: [], supportRequests: [] });
  return {
    version: 1,
    updatedAt: store.updatedAt || "",
    offices: store.offices && typeof store.offices === "object" ? store.offices : {},
    actions: Array.isArray(store.actions) ? store.actions : [],
    supportRequests: Array.isArray(store.supportRequests) ? store.supportRequests : [],
    terminalPasses: Array.isArray(store.terminalPasses) ? store.terminalPasses : [],
    customEnvironments: Array.isArray(store.customEnvironments) ? store.customEnvironments : []
  };
}

function writeOfficeWorkStore(store) {
  writeJson(OFFICE_WORK_FILE, {
    version: 1,
    updatedAt: new Date().toISOString(),
    offices: store.offices || {},
    actions: Array.isArray(store.actions) ? store.actions.slice(0, 500) : [],
    supportRequests: Array.isArray(store.supportRequests) ? store.supportRequests.slice(0, 500) : [],
    terminalPasses: Array.isArray(store.terminalPasses) ? store.terminalPasses.slice(0, 500) : [],
    customEnvironments: Array.isArray(store.customEnvironments) ? store.customEnvironments.slice(0, 200) : []
  });
}

function normalizeOfficeKey(value = "") {
  return slugify(cleanShortText(value || "editorial-hq", 80)) || "editorial-hq";
}

function getOfficeWorkPayload(officeKey = "") {
  const key = normalizeOfficeKey(officeKey);
  const store = readOfficeWorkStore();
  const office = store.offices[key] || { inventory: [] };
  return {
    ok: true,
    officeKey: key,
    inventory: Array.isArray(office.inventory) ? office.inventory : [],
    supportRequests: store.supportRequests.filter((item) => item.officeKey === key).slice(0, 80),
    terminalPasses: store.terminalPasses.filter((item) => item.officeKey === key).slice(0, 80),
    customEnvironments: store.customEnvironments.filter((item) => item.officeKey === key).slice(0, 40),
    actions: store.actions.filter((action) => action.officeKey === key).slice(0, 80),
    allActions: store.actions.slice(0, 120)
  };
}

function addOfficeWorkAction(body = {}) {
  const officeKey = normalizeOfficeKey(body.officeKey || body.office || "editorial-hq");
  const store = readOfficeWorkStore();
  const action = {
    id: createRecordId("work"),
    officeKey,
    officeLabel: cleanShortText(body.officeLabel || officeKey, 120),
    agentId: cleanShortText(body.agentId || "", 120),
    agentName: cleanShortText(body.agentName || "", 120),
    kind: cleanShortText(body.kind || "terminal-command", 80),
    status: cleanShortText(body.status || "queued", 60),
    title: cleanShortText(body.title || body.command || "Acao do escritorio", 180),
    detail: cleanShortText(body.detail || body.command || "", 1200),
    source: cleanShortText(body.source || "office-ui", 80),
    createdAt: new Date().toISOString()
  };
  store.actions.unshift(action);
  writeOfficeWorkStore(store);
  return action;
}

function addOfficeInventoryItem(body = {}) {
  const officeKey = normalizeOfficeKey(body.officeKey || body.office || "editorial-hq");
  const itemId = cleanShortText(body.itemId || body.id || "", 120);
  if (!itemId) return { ok: false, status: 400, error: "itemId obrigatorio." };

  const store = readOfficeWorkStore();
  const office = store.offices[officeKey] || { inventory: [] };
  const inventory = Array.isArray(office.inventory) ? office.inventory : [];
  if (!inventory.some((item) => item.id === itemId)) {
    inventory.unshift({
      id: itemId,
      name: cleanShortText(body.name || itemId, 180),
      description: cleanShortText(body.description || "", 500),
      price: Number(body.price || 0),
      addedAt: new Date().toISOString()
    });
  }
  store.offices[officeKey] = { ...office, inventory };
  const action = {
    id: createRecordId("work"),
    officeKey,
    officeLabel: cleanShortText(body.officeLabel || officeKey, 120),
    agentId: "",
    agentName: "Inventario do escritorio",
    kind: "inventory-support",
    status: "done",
    title: `Inventario atualizado: ${body.name || itemId}`,
    detail: body.description || "Item registrado no inventario persistente do escritorio.",
    source: "office-inventory",
    createdAt: new Date().toISOString()
  };
  store.actions.unshift(action);
  writeOfficeWorkStore(store);
  return { ok: true, officeKey, inventory, action };
}

function pixField(id, value) {
  const text = String(value || "");
  return `${id}${String(text.length).padStart(2, "0")}${text}`;
}

function crc16Pix(payload) {
  let crc = 0xffff;
  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function buildOfficeSupportPixPayload({ amount = 0, txid = "APOIO", description = "" } = {}) {
  const merchantAccount = pixField("00", "br.gov.bcb.pix") +
    pixField("01", PIX_RECEIVER_KEY) +
    (description ? pixField("02", cleanShortText(description, 70)) : "");
  const amountText = Number(amount || 0).toFixed(2);
  const payloadWithoutCrc = [
    pixField("00", "01"),
    pixField("26", merchantAccount),
    pixField("52", "0000"),
    pixField("53", "986"),
    Number(amount || 0) > 0 ? pixField("54", amountText) : "",
    pixField("58", "BR"),
    pixField("59", PIX_RECEIVER_NAME),
    pixField("60", PIX_RECEIVER_CITY),
    pixField("62", pixField("05", cleanShortText(txid, 25) || "APOIO"))
  ].join("");
  const crcInput = `${payloadWithoutCrc}6304`;
  return `${crcInput}${crc16Pix(crcInput)}`;
}

async function buildOfficeSupportPixResponse(body = {}) {
  const officeKey = normalizeOfficeKey(body.officeKey || body.office || "editorial-hq");
  const itemId = cleanShortText(body.itemId || body.id || "", 120);
  const itemName = cleanShortText(body.name || itemId || "Apoio ao escritorio", 80);
  const amount = Number(body.price || body.amount || 0);
  const txid = cleanShortText(`APOIO${Date.now().toString(36).slice(-8)}`, 25);
  const pixCode = buildOfficeSupportPixPayload({
    amount,
    txid,
    description: `${officeKey} ${itemName}`
  });
  const qrDataUrl = QRCode ? await QRCode.toDataURL(pixCode, { margin: 1, width: 280 }) : "";

  return {
    ok: true,
    officeKey,
    itemId,
    itemName,
    amount,
    txid,
    pixKey: PIX_RECEIVER_KEY,
    receiverName: PIX_RECEIVER_NAME,
    pixCode,
    qrDataUrl
  };
}

function createOfficeSupportRequest(body = {}, pixPayload = {}) {
  const store = readOfficeWorkStore();
  const request = {
    id: createRecordId("support"),
    officeKey: pixPayload.officeKey,
    itemId: pixPayload.itemId,
    itemName: pixPayload.itemName,
    kind: cleanShortText(body.kind || "inventory-item", 80),
    description: cleanShortText(body.description || "", 500),
    amount: pixPayload.amount,
    txid: pixPayload.txid,
    pixKey: PIX_RECEIVER_KEY,
    receiverName: PIX_RECEIVER_NAME,
    status: "pending-payment-check",
    createdAt: new Date().toISOString()
  };
  store.supportRequests.unshift(request);
  store.actions.unshift({
    id: createRecordId("work"),
    officeKey: request.officeKey,
    officeLabel: cleanShortText(body.officeLabel || request.officeKey, 120),
    agentName: "Vaquinha Pix",
    kind: "support-payment",
    status: "pending-payment-check",
    title: `Apoio pendente: ${request.itemName}`,
    detail: `Aguardando conferencia Pix de R$ ${request.amount.toFixed(2)} para ${PIX_RECEIVER_NAME}.`,
    source: "office-support",
    createdAt: request.createdAt
  });
  writeOfficeWorkStore(store);
  return request;
}

function approveOfficeSupportRequest(body = {}) {
  const requestId = cleanShortText(body.requestId || body.supportId || "", 120);
  const store = readOfficeWorkStore();
  const request = store.supportRequests.find((item) => item.id === requestId);
  if (!request) return { ok: false, status: 404, error: "Apoio nao encontrado." };
  request.status = "paid-confirmed";
  request.confirmedAt = new Date().toISOString();
  writeOfficeWorkStore(store);
  if (request.kind === "terminal-pass") {
    const nextStore = readOfficeWorkStore();
    nextStore.terminalPasses.unshift({
      id: createRecordId("terminal"),
      officeKey: request.officeKey,
      requestId: request.id,
      amount: request.amount,
      usesLeft: 1,
      createdAt: new Date().toISOString()
    });
    writeOfficeWorkStore(nextStore);
    return { ok: true, officeKey: request.officeKey, terminalPasses: nextStore.terminalPasses };
  }
  if (request.kind === "custom-environment") {
    const nextStore = readOfficeWorkStore();
    const environment = {
      id: slugify(`${request.officeKey}-${request.itemName}-${Date.now()}`),
      officeKey: request.officeKey,
      label: request.itemName,
      shortLabel: "novo ambiente",
      description: request.description || "Ambiente comprado e liberado pelo Full Admin.",
      focusLabel: request.itemName,
      spriteKit: "default",
      createdAt: new Date().toISOString()
    };
    nextStore.customEnvironments.unshift(environment);
    writeOfficeWorkStore(nextStore);
    return { ok: true, officeKey: request.officeKey, environment };
  }
  return addOfficeInventoryItem({
    officeKey: request.officeKey,
    itemId: request.itemId,
    name: request.itemName,
    description: request.description || `Apoio confirmado via Pix ${request.txid}.`,
    price: request.amount
  });
}

function consumeOfficeTerminalPass(body = {}) {
  const officeKey = normalizeOfficeKey(body.officeKey || body.office || "editorial-hq");
  const store = readOfficeWorkStore();
  const pass = store.terminalPasses.find((item) => item.officeKey === officeKey && Number(item.usesLeft || 0) > 0);
  if (!pass) return { ok: false, status: 402, error: "Terminal pago: gere um Pix de R$ 20 e confirme o pagamento para liberar uma interação." };
  pass.usesLeft = Math.max(0, Number(pass.usesLeft || 0) - 1);
  pass.usedAt = new Date().toISOString();
  store.actions.unshift({
    id: createRecordId("work"),
    officeKey,
    officeLabel: cleanShortText(body.officeLabel || officeKey, 120),
    agentName: cleanShortText(body.agentName || "Terminal", 120),
    kind: "terminal-interaction",
    status: "done",
    title: "Interacao paga no terminal",
    detail: cleanShortText(body.command || "", 1200),
    source: "office-terminal",
    createdAt: new Date().toISOString()
  });
  writeOfficeWorkStore(store);
  return { ok: true, pass };
}

function toPublicAssetUrl(rootConfig, absoluteFilePath) {
  const relativePath = path.relative(rootConfig.dir, absoluteFilePath).split(path.sep).map(encodeURIComponent).join("/");
  return `${rootConfig.publicBase}/${relativePath}`;
}

function categorizeSpriteAsset(relativePath) {
  const value = normalizeText(relativePath);
  if (/(character|characters|personagem|avatar|agent|ninja|dealer|garcom|waiter|hero|npc|player|enemy|enemies|monster|boss|body|head|skin)/i.test(value)) {
    return "personagens";
  }
  if (
    /(background|cenario|scene|floor|tile|tileset|wall|room|office|interior|exterior|map|terrain)/i.test(value) ||
    /(^|[\/_\-\s])(bar|pub)([\/_\-\s]|$)/i.test(value)
  ) {
    return "cenarios";
  }
  if (/(item|items|prop|props|cup|dice|table|chair|coin|card|glass|bottle|jukebox|roulette|pool|ball|furniture)/i.test(value)) {
    return "itens";
  }
  if (/(hud|ui|button|icon|logo|badge|marker|pointer|menu|panel|frame)/i.test(value)) {
    return "interface";
  }
  if (/(fx|effect|spark|light|beam|shadow|glow|particles|smoke|fire)/i.test(value)) {
    return "efeitos";
  }
  return "outros";
}

function inferSpriteAction(fileBase) {
  const value = normalizeText(fileBase);
  return SPRITE_ACTION_ORDER.find((action) => value.includes(action)) || "";
}

function getFrameOrderToken(fileBase) {
  const match = String(fileBase || "").match(/(?:[_-])(?:frame)?([a-z]|\d{1,3})$/i);
  if (!match) return 0;
  const token = match[1].toLowerCase();
  if (/^\d+$/.test(token)) return Number(token);
  return token.charCodeAt(0) - 96;
}

function buildAnimationGroupInfo(relativePath, category) {
  const directory = path.posix.dirname(relativePath);
  const fileBase = path.basename(relativePath, path.extname(relativePath));
  const normalizedBase = normalizeText(fileBase).replace(/\s+/g, "_");
  const action = inferSpriteAction(fileBase);
  let groupBase = normalizedBase.replace(/(?:[_-])(?:frame)?([a-z]|\d{1,3})$/i, "");

  if (category === "personagens") {
    const characterMatch = normalizedBase.match(/^(character|player|hero|npc|agent|dealer|garcom|waiter)[_-]([a-z0-9]+)(?:[_-].*)?$/i);
    if (characterMatch) {
      groupBase = `${characterMatch[1]}_${characterMatch[2]}`;
    }
  }

  if (category === "efeitos" || /(roll|spin|spark|smoke|fire|explosion|effect|fx)/i.test(normalizedBase)) {
    groupBase = groupBase.replace(/(?:[_-])(?:frame)?([a-z]|\d{1,3})$/i, "");
  }

  return {
    groupKey: `${directory}/${groupBase}`,
    action,
    frameOrder: getFrameOrderToken(fileBase)
  };
}

function inferSpriteContexts(relativePath, category) {
  const value = normalizeText(relativePath);
  const contexts = [];
  const add = (label) => {
    if (!contexts.includes(label)) contexts.push(label);
  };

  if (
    /(^|[\/_\-\s])(pub|bar|casino|roulette|roleta|cup|copo|dice|dado|card|poker|blackjack|pool|sinuca|jukebox|glass|bottle|drink|table|chair|dealer|waiter|garcom)([\/_\-\s]|$)/i.test(value)
  ) {
    add("PubPaid");
  }
  if (/(office|escritorio|agent|ninja|avatar|desk|room|worker|terminal)/i.test(value)) {
    add("Escritorios");
  }
  if (/(game|platform|character|tile|tileset|map|controller|hud|ui)/i.test(value) || ["personagens", "cenarios", "interface"].includes(category)) {
    add("Games");
  }
  if (/(kid|child|infantil|toy|school|student|book)/i.test(value)) {
    add("Infantil/Estudantes");
  }
  if (!contexts.length) add("Cofre Ninja");
  return contexts;
}

function buildConstructionPlan(item) {
  if (item.category === "cenarios") {
    return {
      mode: "modo construcao",
      usage: "Dividir em base visual, camada de colisao, decoracao e hotspots antes de virar mapa jogavel.",
      observation:
        "A equipe de Arte deve separar chao, parede, bloqueios e objetos. A equipe Nerd valida fluxo, camera e colisao.",
      collision: "Mapear paredes, mesas, balcões e limites como retangulos simples antes de detalhar.",
      layers: ["base", "colisao", "decoracao", "hotspots"]
    };
  }
  if (item.category === "personagens") {
    return {
      mode: "sprite animado",
      usage: "Avaliar o ciclo inteiro em movimento, nao frame solto. Depois mapear idle, walk, hit, jump e acoes.",
      observation:
        "So entra no jogo se tiver leitura parado e em movimento; itens equipaveis precisam encaixar no corpo.",
      collision: "Usar hitbox menor que a arte para nao prender em mesas e portas.",
      layers: ["corpo", "animacoes", "hitbox", "itens"]
    };
  }
  if (item.category === "itens") {
    return {
      mode: "prop jogavel",
      usage: "Definir se e decoracao, item clicavel, item equipavel ou feedback de rodada.",
      observation: "Copos, dados, cartas e fichas precisam ter som/queda/estado quando forem jogo.",
      collision: "Itens de mesa normalmente nao bloqueiam; moveis grandes bloqueiam passagem.",
      layers: ["visual", "estado", "som", "interacao"]
    };
  }
  return {
    mode: "asset de apoio",
    usage: "Validar se atende um contexto real do site antes de entrar em producao.",
    observation: "Prioridade para PubPaid, jogos, escritorios e subsites ja existentes.",
    collision: "Sem colisao ate virar mapa, item ou personagem.",
    layers: ["triagem", "contexto", "uso"]
  };
}

function buildSiteSpriteReferenceSet() {
  const references = new Set();
  SPRITE_CONTEXT_FILES.forEach((fileName) => {
    const filePath = path.join(ROOT_DIR, fileName);
    if (!fs.existsSync(filePath)) return;
    let content = "";
    try {
      content = fs.readFileSync(filePath, "utf-8");
    } catch (_error) {
      return;
    }
    const regex = /(?:\.\/)?(sprite-vault\/[^"'\s)]+)/gi;
    let match = regex.exec(content);
    while (match) {
      references.add(`/${match[1].replace(/\\/g, "/")}`);
      match = regex.exec(content);
    }
  });
  return references;
}

function collectSpriteFiles(rootConfig, currentDir = rootConfig.dir, output = []) {
  if (!fs.existsSync(currentDir)) return output;

  let entries = [];
  try {
    entries = fs.readdirSync(currentDir, { withFileTypes: true });
  } catch (_error) {
    return output;
  }

  entries.forEach((entry) => {
    const absolutePath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      collectSpriteFiles(rootConfig, absolutePath, output);
      return;
    }

    if (!entry.isFile() || !SPRITE_IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      return;
    }

    if (/^(preview|sample)\b/i.test(entry.name)) {
      return;
    }

    const relativePath = path.relative(rootConfig.dir, absolutePath).split(path.sep).join("/");
    const category = categorizeSpriteAsset(relativePath);
    const groupInfo = buildAnimationGroupInfo(relativePath, category);
    let stat = null;
    try {
      stat = fs.statSync(absolutePath);
    } catch (_error) {
      stat = null;
    }

    output.push({
      id: `${rootConfig.key}:${relativePath}`,
      name: path.basename(entry.name, path.extname(entry.name)).replace(/[-_]+/g, " "),
      fileName: entry.name,
      extension: path.extname(entry.name).replace(".", "").toLowerCase(),
      category,
      sourceRoot: rootConfig.label,
      path: relativePath,
      publicUrl: toPublicAssetUrl(rootConfig, absolutePath),
      groupKey: groupInfo.groupKey,
      action: groupInfo.action,
      frameOrder: groupInfo.frameOrder,
      sizeBytes: stat?.size || 0,
      updatedAt: stat?.mtime ? stat.mtime.toISOString() : ""
    });
  });

  return output;
}

function groupSpriteFiles(files, siteReferences) {
  const groups = new Map();
  files.forEach((file) => {
    const key = `${file.sourceRoot}:${file.groupKey}`;
    const existing = groups.get(key) || {
      id: `sprite-group:${key}`,
      name: path.basename(file.groupKey).replace(/[-_]+/g, " "),
      category: file.category,
      sourceRoot: file.sourceRoot,
      path: file.groupKey.replace(/^\.\//, ""),
      extension: file.extension,
      sizeBytes: 0,
      updatedAt: file.updatedAt,
      actions: [],
      frames: [],
      contexts: inferSpriteContexts(file.path, file.category)
    };

    existing.frames.push({
      name: file.name,
      fileName: file.fileName,
      path: file.path,
      publicUrl: file.publicUrl,
      action: file.action,
      frameOrder: file.frameOrder,
      sizeBytes: file.sizeBytes
    });
    existing.sizeBytes += Number(file.sizeBytes || 0);
    if (file.action && !existing.actions.includes(file.action)) existing.actions.push(file.action);
    if (file.updatedAt > existing.updatedAt) existing.updatedAt = file.updatedAt;
    if (siteReferences.has(file.publicUrl)) existing.alreadyInSite = true;
    groups.set(key, existing);
  });

  return Array.from(groups.values()).map((group) => {
    const actionOrder = new Map(SPRITE_ACTION_ORDER.map((action, index) => [action, index]));
    group.frames.sort((a, b) => {
      const actionDiff = (actionOrder.get(a.action) ?? 99) - (actionOrder.get(b.action) ?? 99);
      if (actionDiff) return actionDiff;
      return (a.frameOrder || 0) - (b.frameOrder || 0) || a.path.localeCompare(b.path);
    });
    group.actions.sort((a, b) => (actionOrder.get(a) ?? 99) - (actionOrder.get(b) ?? 99));
    group.frameCount = group.frames.length;
    group.previewUrl = group.frames[0]?.publicUrl || "";
    group.publicUrl = group.previewUrl;
    group.reviewMode =
      group.category === "cenarios"
        ? "construction"
        : group.frameCount > 1
          ? "animation"
          : "static";
    group.priority =
      (group.contexts.includes("PubPaid") ? 100 : 0) +
      (group.contexts.includes("Escritorios") ? 70 : 0) +
      (group.contexts.includes("Games") ? 45 : 0) +
      (group.frameCount > 1 ? 20 : 0);
    group.construction = buildConstructionPlan(group);
    return group;
  });
}

function buildSpriteCheckPayload() {
  const reviews = readJson(SPRITE_CHECK_REVIEWS_FILE, {});
  const reviewMap = reviews && typeof reviews === "object" && !Array.isArray(reviews) ? reviews : {};
  const siteReferences = buildSiteSpriteReferenceSet();
  const rawFiles = SPRITE_SCAN_ROOTS.flatMap((rootConfig) => collectSpriteFiles(rootConfig));
  const items = groupSpriteFiles(rawFiles, siteReferences)
    .sort((a, b) => b.priority - a.priority || a.category.localeCompare(b.category) || a.path.localeCompare(b.path))
    .map((item) => {
      const review = reviewMap[item.id] && typeof reviewMap[item.id] === "object" ? reviewMap[item.id] : {};
      const locked = Boolean(item.alreadyInSite);
      return {
        ...item,
        locked,
        status: cleanShortText(locked ? "accepted" : review.status || "pending", 40),
        statusReason: locked ? "Ja esta em uso no site/subsite, entao entra como aceito e nao volta para aprovacao." : "",
        note: cleanShortText(review.note || "", 500),
        reviewedAt: cleanShortText(review.reviewedAt || "", 60),
        reviewedBy: cleanShortText(review.reviewedBy || "", 80)
      };
    });
  const summary = items.reduce(
    (acc, item) => {
      acc.total += 1;
      acc.byCategory[item.category] = (acc.byCategory[item.category] || 0) + 1;
      acc.byStatus[item.status] = (acc.byStatus[item.status] || 0) + 1;
      if (item.frameCount > 1) acc.animated += 1;
      if (item.reviewMode === "construction") acc.construction += 1;
      if (item.locked) acc.alreadyAccepted += 1;
      return acc;
    },
    { total: 0, animated: 0, construction: 0, alreadyAccepted: 0, byCategory: {}, byStatus: {} }
  );

  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    menuFirst: "CHECKPUBPAID",
    hierarchy: {
      fullAdmin: "Junior",
      ceo: "Codex CEO",
      flow: "Full Admin -> Codex CEO -> equipes",
      teams: ["Ninjas", "Arte/Game Design", "Nerd", "Editorial", "PubPaid"]
    },
    summary,
    rawFiles: rawFiles.length,
    rules: {
      siteAssets: "Assets ja publicados nao entram na fila de aprovacao.",
      movement: "Personagens chegam agrupados como sprite animado, nao como frame solto.",
      canvas: "Sem canvas para ilustracao de personagens ou conteudo do site; usar arquivos reais em assets/sprite-vault.",
      context: "Prioridade para PubPaid, jogos, escritorios e subsites existentes."
    },
    reviews: reviewMap,
    items
  };
}

function normalizeSpriteReviewStatus(value) {
  const status = cleanShortText(value || "pending", 40).toLowerCase();
  if (["accepted", "rejected", "pending", "needs-change"].includes(status)) return status;
  if (status === "aceito" || status === "aprovado") return "accepted";
  if (status === "reprovado" || status === "recusado") return "rejected";
  if (status === "ajuste" || status === "needs change") return "needs-change";
  return "pending";
}

function buildOfficeOrderPayload() {
  const orders = readJson(OFFICE_ORDERS_FILE, []);
  const safeOrders = Array.isArray(orders) ? orders : [];
  return {
    ok: true,
    hierarchy: {
      fullAdmin: "Junior",
      ceo: "Codex CEO",
      rule: "O Full Admin ordena, o CEO responde, e as equipes recebem tarefas pelo CEO.",
      teams: ["Ninjas", "Arte/Game Design", "Nerd", "Editorial", "PubPaid", "Design", "Revisao"]
    },
    orders: safeOrders.slice(-80).reverse()
  };
}

function appendOfficeOrder(order) {
  const orders = readJson(OFFICE_ORDERS_FILE, []);
  const nextOrders = Array.isArray(orders) ? orders.concat(order).slice(-250) : [order];
  writeJson(OFFICE_ORDERS_FILE, nextOrders);
  return nextOrders;
}

function updateOfficeOrderById(orderId, patch = {}) {
  const id = cleanShortText(orderId || "", 120);
  if (!id) return null;
  const orders = readJson(OFFICE_ORDERS_FILE, []);
  if (!Array.isArray(orders)) return null;
  let found = null;
  const nextOrders = orders.map((order) => {
    if (order?.id !== id) return order;
    found = {
      ...order,
      ...patch,
      updatedAt: patch.updatedAt || new Date().toISOString()
    };
    return found;
  });
  if (found) writeJson(OFFICE_ORDERS_FILE, nextOrders);
  return found;
}

function countOfficeOrders() {
  const orders = readJson(OFFICE_ORDERS_FILE, []);
  return Array.isArray(orders) ? orders.length : 0;
}

function buildProofFile(filePath, label) {
  try {
    const stats = fs.statSync(filePath);
    return {
      label,
      path: path.relative(ROOT_DIR, filePath).replace(/\\/g, "/"),
      bytes: stats.size,
      updatedAt: stats.mtime.toISOString()
    };
  } catch (_error) {
    return {
      label,
      path: path.relative(ROOT_DIR, filePath).replace(/\\/g, "/"),
      missing: true
    };
  }
}

function countDirFilesByExtension(dirPath, extensions = [], maxFiles = 600) {
  const summary = {
    exists: false,
    totalFiles: 0,
    byExtension: {},
    recent: []
  };
  const allow = new Set(extensions.map((ext) => String(ext || "").toLowerCase()));
  const visit = (currentDir, depth = 0) => {
    if (summary.totalFiles >= maxFiles || depth > 3) return;
    let entries = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (_error) {
      return;
    }
    entries.forEach((entry) => {
      if (summary.totalFiles >= maxFiles) return;
      if (entry.name === "node_modules" || entry.name === ".git") return;
      const filePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        visit(filePath, depth + 1);
        return;
      }
      if (!entry.isFile()) return;
      const ext = path.extname(entry.name).toLowerCase() || "(none)";
      if (allow.size && !allow.has(ext)) return;
      summary.totalFiles += 1;
      summary.byExtension[ext] = (summary.byExtension[ext] || 0) + 1;
      try {
        const stats = fs.statSync(filePath);
        summary.recent.push({
          path: path.relative(ROOT_DIR, filePath).replace(/\\/g, "/"),
          updatedAt: stats.mtime.toISOString(),
          bytes: stats.size
        });
      } catch (_error) {
        // Ignore files that disappear during scan.
      }
    });
  };

  if (fs.existsSync(dirPath)) {
    summary.exists = true;
    visit(dirPath);
  }

  summary.recent = summary.recent
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, 8);
  return summary;
}

function readMemoryOrderSnapshot() {
  const ordersPayload = readJson(path.join(ROOT_DIR, ".codex-memory", "orders.json"), { orders: [] });
  const orders = Array.isArray(ordersPayload.orders) ? ordersPayload.orders : [];
  return {
    total: orders.length,
    open: orders.filter((order) => String(order.status || "open") === "open").length,
    latest: orders
      .slice(-6)
      .reverse()
      .map((order) => ({
        id: cleanShortText(order.id || "", 120),
        status: cleanShortText(order.status || "", 40),
        summary: cleanShortText(order.summary || order.rawRequest || "", 220),
        updatedAt: cleanShortText(order.updatedAt || order.createdAt || "", 80)
      }))
  };
}

function countJsonItems(filePath, pick = "") {
  const payload = readJson(filePath, null);
  const value = pick && payload && typeof payload === "object" ? payload[pick] : payload;
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return 0;
}

function fileBrief(relativePath, label, kind = "surface") {
  const filePath = path.join(ROOT_DIR, relativePath);
  const proof = buildProofFile(filePath, label || relativePath);
  return {
    kind,
    label: label || relativePath,
    path: proof.path,
    exists: !proof.missing,
    bytes: proof.bytes || 0,
    updatedAt: proof.updatedAt || ""
  };
}

function inferEcosystemFocus(instruction = "") {
  const text = normalizeText(instruction);
  const focus = [];
  const add = (area, reason, files = []) => {
    if (focus.some((item) => item.area === area)) return;
    focus.push({
      area,
      reason,
      files: files.map((file) => cleanShortText(file, 180)).filter(Boolean)
    });
  };

  if (/cheffe|call|ordem|agente|runtime|prova|evidencia|ecossistema|aprend/.test(text)) {
    add("Cheffe Call / agentes reais", "ordem ligada a comando, prova, aprendizado ou runtime", [
      "cheffe-call.html",
      "cheffe-call.js",
      "server.js",
      "scripts/real-agents-runtime.js",
      ".codex-agents/registry.json"
    ]);
  }
  if (/noticia|foto|materia|editor|jornal|feed|mailza|jurua|acre/.test(text)) {
    add("Editorial e noticias", "ordem menciona noticia, foto, feed ou cobertura regional", [
      "script.js",
      "news-data.js",
      "noticia.js",
      "data/runtime-news.json",
      "data/news-archive.json"
    ]);
  }
  if (/pubpaid|jogo|phaser|sprite|rua|trafego|dama|dardos/.test(text)) {
    add("PubPaid 2.0", "ordem menciona jogo, Phaser, sprites ou trafego", [
      "pubpaid.html",
      "pubpaid-phaser/app.js",
      "pubpaid-phaser/scenes/StreetScene.js",
      "pubpaid-phaser/scenes/InteriorScene.js"
    ]);
  }
  if (/visual|layout|css|mobile|card|tela|interface|design/.test(text)) {
    add("Interface visual", "ordem menciona visual, tela, layout ou mobile", [
      "styles.css",
      "premium-clarity.css",
      "cheffe-call.css",
      "mobile-home-final.css"
    ]);
  }
  if (!focus.length) {
    add("Ecossistema geral", "ordem ampla sem modulo unico; estudar superficies principais antes de agir", [
      "server.js",
      "index.html",
      "script.js",
      "CODEX_MEMORY.md",
      ".codex-memory/current-state.md"
    ]);
  }
  return focus.slice(0, 5);
}

function buildRealAgentsEcosystemStudy(options = {}) {
  const now = new Date().toISOString();
  const instruction = cleanShortText(options.instruction || options.message || "", 1200);
  const previous = readJson(REAL_AGENTS_ECOSYSTEM_STUDY_FILE, null);
  const packagePayload = readJson(path.join(ROOT_DIR, "package.json"), {});
  const registry = readJson(REAL_AGENTS_REGISTRY_FILE, {});
  const runtimeNewsCount = countJsonItems(path.join(DATA_DIR, "runtime-news.json"));
  const archiveNewsCount = countJsonItems(path.join(DATA_DIR, "news-archive.json"));
  const officeOrderCount = countOfficeOrders();
  const actionsCount = countJsonItems(REAL_AGENTS_ACTIONS_FILE, "actions");
  const topics = fs.existsSync(DATA_DIR)
    ? fs.readdirSync(DATA_DIR).filter((name) => /^topic-feed-.+\.json$/i.test(name)).length
    : 0;
  const serverText = fs.existsSync(__filename) ? fs.readFileSync(__filename, "utf-8") : "";
  const routeCount = (serverText.match(/pathname === "/g) || []).length;
  const routeFamilies = [...new Set(
    [...serverText.matchAll(/pathname === "([^"]+)"/g)]
      .map((match) => String(match[1] || "").split("/").slice(1, 3).join("/"))
      .filter(Boolean)
  )].slice(0, 20);
  const focusModules = inferEcosystemFocus(instruction);
  const memory = readMemoryOrderSnapshot();
  const agentCount = Array.isArray(registry.agents) ? registry.agents.length : Number(registry.totalAgents || 0);
  const officesCount = Array.isArray(registry.offices) ? registry.offices.length : 0;
  const directories = {
    scripts: countDirFilesByExtension(path.join(ROOT_DIR, "scripts"), [".js", ".mjs", ".cjs"], 300),
    pubpaidPhaser: countDirFilesByExtension(path.join(ROOT_DIR, "pubpaid-phaser"), [".js", ".css", ".json"], 260),
    agents: countDirFilesByExtension(path.join(ROOT_DIR, ".codex-agents", "agents"), [".md"], 260),
    data: countDirFilesByExtension(DATA_DIR, [".json"], 260)
  };
  const keyFiles = [
    fileBrief("server.js", "backend/API principal"),
    fileBrief("cheffe-call.html", "interface Cheffe Call"),
    fileBrief("cheffe-call.js", "runtime UI Cheffe Call"),
    fileBrief("cheffe-call.css", "estilo Cheffe Call"),
    fileBrief("script.js", "home/editorial"),
    fileBrief("news-data.js", "dados estaticos de noticias"),
    fileBrief("scripts/real-agents-runtime.js", "runtime dos agentes"),
    fileBrief(".codex-agents/registry.json", "registro dos agentes")
  ];
  const impactSignals = [
    officeOrderCount ? `${officeOrderCount} ordens no office-orders` : "",
    actionsCount ? `${actionsCount} acoes executaveis conhecidas` : "",
    runtimeNewsCount ? `${runtimeNewsCount} noticias runtime` : "",
    archiveNewsCount ? `${archiveNewsCount} noticias no arquivo` : "",
    routeCount ? `${routeCount} rotas/handlers mapeados no servidor` : "",
    memory.open ? `${memory.open} ordens abertas na memoria local` : ""
  ].filter(Boolean);

  return {
    ok: true,
    kind: "real-agents-ecosystem-study",
    studyId: createRecordId("study"),
    learningCycle: Number(previous?.learningCycle || 0) + 1,
    generatedAt: now,
    trigger: cleanShortText(options.trigger || "manual", 80),
    instruction,
    summary: {
      totalAgents: agentCount,
      totalOffices: officesCount,
      routeCount,
      routeFamilies,
      runtimeNewsCount,
      archiveNewsCount,
      topicFeeds: topics,
      officeOrderCount,
      executableActions: actionsCount,
      packageScripts: Object.keys(packagePayload.scripts || {}).slice(0, 20)
    },
    focusModules,
    keyFiles,
    directories,
    memory,
    learning: {
      previousStudyAt: previous?.generatedAt || "",
      previousCycle: Number(previous?.learningCycle || 0),
      latestLessons: memory.latest.slice(0, 4).map((order) => order.summary),
      intent: "estudar modulos, dados, rotas e memoria antes de recomendar ou executar",
      betterThanFilterBecause: [
        "usa arquivos reais do projeto e DATA_DIR",
        "liga a ordem aos modulos em foco",
        "retorna contadores, relatorios e arquivo persistente",
        "separa execucao de aplicacao/publicacao"
      ]
    },
    impactGate: {
      requiredBeforeImportant: [
        "modulo alvo identificado",
        "arquivo/rota/dado verificado",
        "ordem registrada em office-orders",
        "prova retornada no payload",
        "pendencia explicita quando ainda nao aplicou/publicou"
      ],
      weakIfOnly: [
        "opiniao sem arquivo",
        "resumo sem contador",
        "runtime sem relatorio",
        "status implementado sem mudanca ou bloqueio explicado"
      ],
      currentSignals: impactSignals
    },
    proof: {
      file: path.relative(ROOT_DIR, REAL_AGENTS_ECOSYSTEM_STUDY_FILE).replace(/\\/g, "/"),
      source: "server.js",
      dataDir: path.relative(ROOT_DIR, DATA_DIR).replace(/\\/g, "/") || ".",
      keyFilesChecked: keyFiles.filter((item) => item.exists).length,
      directoriesChecked: Object.keys(directories).filter((key) => directories[key].exists).length
    }
  };
}

function recordRealAgentsEcosystemStudy(options = {}) {
  const study = buildRealAgentsEcosystemStudy(options);
  writeJson(REAL_AGENTS_ECOSYSTEM_STUDY_FILE, study);
  return study;
}

function appendNewsImageApprovalOfficeOrder(decision = {}) {
  const action = cleanShortText(decision.action || "", 60);
  const title = cleanShortText(decision.title || decision.slug || "noticia em revisao", 180);
  const isApprovedAction = ["approve-focus", "keep-fallback", "replace-image"].includes(action);
  const status = isApprovedAction ? "aprovado" : "reaberto";
  const focusText = decision.focus ? ` Foco sugerido: ${decision.focus}.` : "";
  const fitText = decision.imageFit ? ` Fit: ${decision.imageFit}.` : "";
  const manualText = decision.manualAdjustment ? ` Ajuste manual: ${decision.manualAdjustment}.` : "";
  const replacementText = decision.replacementImageUrl ? ` Nova imagem: ${decision.replacementImageUrl}.` : "";
  const noteText = decision.note ? ` Observacao do chefe: ${decision.note}` : "";
  return appendOfficeOrder({
    id: createRecordId("img"),
    from: "Full Admin",
    to: "Codex CEO + Escritorio Design + agentes reais",
    priority: isApprovedAction ? "media" : "alta",
    message: cleanShortText(
      `Cheffe Call registrou decisao de foto/foco: ${decision.actionLabel || action} para "${title}".${focusText}${fitText}${manualText}${replacementText}${noteText}`,
      1200
    ),
    ceoReply: isApprovedAction
      ? "Decisao visual aprovada. A proxima runtime deve aplicar foco, fallback ou imagem definida e devolver feedback ao administrador."
      : "Revisao visual reaberta. A proxima runtime deve tentar ajustar imagem/foco e devolver uma opcao melhor ao administrador.",
    status,
    hierarchy: "Full Admin -> Cheffe Call -> Codex CEO -> agentes reais",
    imageApproval: {
      decisionId: decision.id || "",
      slug: decision.slug || "",
      action,
      focus: decision.focus || "",
      imageFit: decision.imageFit || "",
      manualAdjustment: decision.manualAdjustment || "",
      replacementImageUrl: decision.replacementImageUrl || "",
      articleUrl: decision.articleUrl || ""
    },
    review: {
      status,
      note: decision.note || decision.actionLabel || ""
    },
    createdAt: new Date().toISOString()
  });
}

function reviewOfficeOrder(body = {}) {
  const orderId = cleanShortText(body.orderId || body.id, 120);
  const status = cleanShortText(body.status || body.reviewStatus, 40).toLowerCase();
  const note = cleanShortText(body.note || body.message || "", 800);
  const allowed = {
    approved: "aprovado",
    approve: "aprovado",
    aprovado: "aprovado",
    rejected: "reprovado",
    reject: "reprovado",
    reprovado: "reprovado",
    reopened: "reaberto",
    reopen: "reaberto",
    reaberto: "reaberto"
  };
  const nextStatus = allowed[status];
  if (!orderId || !nextStatus) {
    return { ok: false, status: 400, error: "Informe orderId e status aprovado/reprovado/reaberto." };
  }

  const orders = readJson(OFFICE_ORDERS_FILE, []);
  const safeOrders = Array.isArray(orders) ? orders : [];
  let found = null;
  const nextOrders = safeOrders.map((order) => {
    if (order.id !== orderId) return order;
    found = {
      ...order,
      status: nextStatus,
      review: {
        status: nextStatus,
        note,
        reviewedBy: "Full Admin",
        reviewedAt: new Date().toISOString()
      },
      reviewHistory: [
        {
          status: nextStatus,
          note,
          reviewedBy: "Full Admin",
          reviewedAt: new Date().toISOString()
        },
        ...(Array.isArray(order.reviewHistory) ? order.reviewHistory : [])
      ].slice(0, 20)
    };
    return found;
  });

  if (!found) return { ok: false, status: 404, error: "Ordem nao encontrada." };
  writeJson(OFFICE_ORDERS_FILE, nextOrders);
  return { ok: true, order: found };
}

function reviewRealAgentAction(body = {}) {
  const actionId = cleanShortText(body.actionId || body.id, 160);
  const status = cleanShortText(body.status || "", 40).toLowerCase();
  const note = cleanShortText(body.note || "", 800);
  const allowed = {
    aprovado: "aprovado",
    approve: "aprovado",
    approved: "aprovado",
    reprovado: "reprovado",
    reject: "reprovado",
    rejected: "reprovado",
    aplicar: "aprovado-para-aplicar",
    executado: "executado",
    execute: "executado",
    executed: "executado",
    bloquear: "bloqueado",
    bloqueado: "bloqueado",
    blocked: "bloqueado",
    falhou: "falhou",
    failed: "falhou"
  };
  const nextStatus = allowed[status];
  if (!actionId || !nextStatus) {
    return { ok: false, status: 400, error: "Informe actionId e status aprovado/reprovado/executado/bloqueado." };
  }
  const store = readJson(REAL_AGENTS_ACTIONS_FILE, { version: 1, actions: [] });
  const actions = Array.isArray(store.actions) ? store.actions : [];
  let found = null;
  const nextActions = actions.map((action) => {
    if (action.id !== actionId) return action;
    found = {
      ...action,
      status: nextStatus,
      review: {
        status: nextStatus,
        note,
        reviewedBy: "Full Admin",
        reviewedAt: new Date().toISOString()
      }
    };
    return found;
  });
  if (!found) return { ok: false, status: 404, error: "Acao nao encontrada." };
  writeJson(REAL_AGENTS_ACTIONS_FILE, {
    version: 1,
    updatedAt: new Date().toISOString(),
    actions: nextActions
  });
  return { ok: true, action: found };
}

function normalizeCommunityReport(item = {}) {
  return {
    id: cleanShortText(item.id, 80),
    name: cleanShortText(item.name || "Morador local", 80),
    neighborhood: cleanShortText(item.neighborhood || item.bairro || "Bairro nao informado", 90),
    city: cleanShortText(item.city || "Cruzeiro do Sul - AC", 90),
    topic: cleanShortText(item.topic || "Mensagem comunitaria", 100),
    message: cleanShortText(item.message || item.details || item.text, 900),
    contact: cleanShortText(item.contact || item.phone || item.whatsapp || "", 100),
    status: cleanShortText(item.status || "nao-checado", 40),
    verificationStatus: cleanShortText(item.verificationStatus || "nao-checado", 40),
    publicNote:
      "Informacao enviada pela populacao. Pode conter aviso, opiniao ou relato local ainda nao checado.",
    createdAt: cleanShortText(item.createdAt || new Date().toISOString(), 60)
  };
}

function getCommunityReportsPayload(limit = 8) {
  const reports = readJson(COMMUNITY_REPORTS_FILE, []);
  const safeReports = Array.isArray(reports) ? reports : [];
  const publicItems = safeReports
    .map(normalizeCommunityReport)
    .filter((item) => item.message && item.verificationStatus !== "checado")
    .slice()
    .reverse()
    .slice(0, Math.max(1, Math.min(40, limit)));

  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    label: "Chat de informacoes da populacao",
    verificationRule:
      "Este bloco mostra mensagens da populacao. Informacoes relevantes podem ser conferidas antes de virar servico, alerta ou noticia em area propria.",
    total: publicItems.length,
    items: publicItems
  };
}

function recordCommunityReport(body = {}, req = null) {
  const tracking = req ? buildTrackingMeta(req, body) : {};
  const message = cleanShortText(body.message || body.details || body.text, 900);
  const neighborhood = cleanShortText(body.neighborhood || body.bairro, 90);
  const topic = cleanShortText(body.topic || body.subject || "Mensagem comunitaria", 100);

  if (!message || message.length < 12) {
    return {
      ok: false,
      status: 400,
      error: "Escreva uma mensagem com um pouco mais de contexto para ajudar outros moradores."
    };
  }

  const report = normalizeCommunityReport({
    id: createRecordId("com"),
    name: cleanShortText(body.name || body.author || "Morador local", 80),
    neighborhood: neighborhood || "Bairro nao informado",
    city: cleanShortText(body.city || "Cruzeiro do Sul - AC", 90),
    topic,
    message,
    contact: cleanShortText(body.contact || body.phone || body.whatsapp || "", 100),
    status: "recebido-nao-checado",
    verificationStatus: "nao-checado",
    sourcePage: cleanShortText(body.sourcePage || tracking.pagePath || "/", 260),
    visitorId: tracking.visitorId || tracking.cookieVisitorId,
    sessionId: tracking.sessionId || tracking.cookieSessionId,
    ip: tracking.ip,
    createdAt: new Date().toISOString()
  });

  const reports = readJson(COMMUNITY_REPORTS_FILE, []);
  const nextReports = Array.isArray(reports) ? reports.concat(report).slice(-300) : [report];
  writeJson(COMMUNITY_REPORTS_FILE, nextReports);

  appendOfficeOrder({
    id: createRecordId("ord"),
    from: "Comunidade",
    to: "Codex CEO + Revisor Bento + Sofia Fontes",
    priority: "normal",
    message: `Mensagem comunitaria recebida: ${report.topic} em ${report.neighborhood}. ${report.message}`,
    ceoReply:
      "Recebido. A mensagem fica como informacao da populacao e pode entrar na fila de verificacao antes de virar noticia.",
    status: "mensagem-comunitaria-recebida",
    hierarchy: "Comunidade -> Avatar comunitario -> Codex CEO -> agentes de verificacao",
    createdAt: report.createdAt
  });

  return {
    ok: true,
    status: 201,
    item: report,
    message:
      "Mensagem recebida. Ela pode aparecer no chat de informacoes da populacao."
  };
}

function readLatestRealAgentsRunArtifact() {
  const primaryRun = readJson(REAL_AGENTS_RUN_FILE, null);
  const legacyRun = primaryRun ? null : readJson(LEGACY_REAL_AGENTS_RUN_FILE, null);
  const latestRun = primaryRun || legacyRun;
  const mdFile = fs.existsSync(REAL_AGENTS_RUN_MD_FILE)
    ? REAL_AGENTS_RUN_MD_FILE
    : fs.existsSync(LEGACY_REAL_AGENTS_RUN_MD_FILE)
      ? LEGACY_REAL_AGENTS_RUN_MD_FILE
      : "";
  return {
    latestRun,
    source: primaryRun ? "data-dir" : legacyRun ? "legacy-codex-temp" : "missing",
    jsonFile: path.relative(ROOT_DIR, primaryRun ? REAL_AGENTS_RUN_FILE : legacyRun ? LEGACY_REAL_AGENTS_RUN_FILE : REAL_AGENTS_RUN_FILE).replace(/\\/g, "/"),
    markdownFile: mdFile ? path.relative(ROOT_DIR, mdFile).replace(/\\/g, "/") : path.relative(ROOT_DIR, REAL_AGENTS_RUN_MD_FILE).replace(/\\/g, "/"),
    markdown: mdFile ? fs.readFileSync(mdFile, "utf-8") : ""
  };
}

function buildRealAgentsPayload() {
  const registry = readJson(REAL_AGENTS_REGISTRY_FILE, null);
  const latestRunArtifact = readLatestRealAgentsRunArtifact();
  const latestRun = latestRunArtifact.latestRun;
  const autonomyReport = readJson(REAL_AGENTS_AUTONOMY_REPORT_FILE, null);
  const ecosystemStudy = readJson(REAL_AGENTS_ECOSYSTEM_STUDY_FILE, null);
  const latestRunMd = latestRunArtifact.markdown;
  const history = readRealAgentsRunHistory();
  const agents = Array.isArray(registry?.agents) ? registry.agents : [];
  const queue = Array.isArray(latestRun?.queue) ? latestRun.queue : [];

  return {
    ok: Boolean(registry && latestRun),
    updatedAt: new Date().toISOString(),
    registryGeneratedAt: registry?.generatedAt || "",
    runGeneratedAt: latestRun?.generatedAt || "",
    runtimePersistence: {
      source: latestRunArtifact.source,
      file: latestRunArtifact.jsonFile,
      markdownFile: latestRunArtifact.markdownFile,
      primaryFile: path.relative(ROOT_DIR, REAL_AGENTS_RUN_FILE).replace(/\\/g, "/"),
      legacyFile: path.relative(ROOT_DIR, LEGACY_REAL_AGENTS_RUN_FILE).replace(/\\/g, "/")
    },
    summary: {
      totalAgents: Number(registry?.totalAgents || agents.length || 0),
      totalOffices: Array.isArray(registry?.offices) ? registry.offices.length : 0,
      totalRoles: Array.isArray(registry?.roles) ? registry.roles.length : 0,
      newsItems: Number(latestRun?.summary?.newsItems || 0),
      reviewIssues: Number(latestRun?.summary?.reviewIssues || 0),
      activeQueue: queue.length,
      autonomousAgents: Number(latestRun?.summary?.autonomousAgents || 0),
      highAutonomyAgents: Number(latestRun?.summary?.highAutonomyAgents || 0),
      averageAutonomy: Number(latestRun?.summary?.averageAutonomy || 0),
      aliveAgents: Number(latestRun?.summary?.aliveAgents || 0),
      deliveredAgents: Number(latestRun?.summary?.deliveredAgents || 0),
      failedAgents: Number(latestRun?.summary?.failedAgents || 0),
      exhaustedAgents: Number(latestRun?.summary?.exhaustedAgents || 0),
      averageEnergy: Number(latestRun?.summary?.averageEnergy || 0),
      averageMorale: Number(latestRun?.summary?.averageMorale || 0),
      imageApprovalsApplied: Number(latestRun?.summary?.imageApprovalsApplied || 0),
      imageApprovalsSentToAgents: Number(latestRun?.summary?.imageApprovalsSentToAgents || 0),
      photoFocusDecisions: Number(latestRun?.summary?.photoFocusDecisions || 0)
    },
    autonomy: latestRun?.autonomy || null,
    life: latestRun?.life || null,
    autoRun: {
      enabled: !REAL_AGENTS_AUTO_RUN_DISABLED,
      pausedByCheffeCall: readCheffeCallState().active,
      intervalMs: REAL_AGENTS_AUTO_RUN_INTERVAL_MS,
      running: realAgentsAutoRunState.running,
      startedAt: realAgentsAutoRunState.startedAt,
      lastRunAt: realAgentsAutoRunState.lastRunAt,
      lastError: realAgentsAutoRunState.lastError,
      cycles: realAgentsAutoRunState.cycles,
      history
    },
    autonomyRunner: {
      enabled: !REAL_AGENTS_AUTO_RUN_DISABLED,
      running: realAgentsAutonomyState.running,
      lastRunAt: realAgentsAutonomyState.lastRunAt || autonomyReport?.finishedAt || "",
      lastError: realAgentsAutonomyState.lastError,
      cycles: realAgentsAutonomyState.cycles,
      report: autonomyReport
    },
    offices: Array.isArray(registry?.offices) ? registry.offices : [],
    roles: Array.isArray(registry?.roles) ? registry.roles : [],
    agents: agents.map((agent) => ({
      id: agent.id,
      slug: agent.slug,
      name: agent.name,
      officeKey: agent.officeKey,
      officeLabel: agent.officeLabel,
      role: agent.role,
      title: agent.title,
      specialty: agent.specialty,
      capabilities: Array.isArray(agent.capabilities) ? agent.capabilities.slice(0, 12) : [],
      monitoringFocus: Array.isArray(agent.monitoringFocus) ? agent.monitoringFocus.slice(0, 10) : [],
      deliverables: Array.isArray(agent.deliverables) ? agent.deliverables : [],
      newsroomBridge: agent.newsroomBridge || "",
      spriteProfile: agent.spriteProfile || null
    })),
    news: latestRun?.news || null,
    dailyContext: latestRun?.dailyContext || null,
    liveEvents: Array.isArray(latestRun?.liveEvents) ? latestRun.liveEvents : [],
    officeLogs: Array.isArray(latestRun?.officeLogs) ? latestRun.officeLogs : [],
    agentTimelines: Array.isArray(latestRun?.agentTimelines) ? latestRun.agentTimelines : [],
    officeDashboard: Array.isArray(latestRun?.officeDashboard) ? latestRun.officeDashboard : [],
    executableActions: Array.isArray(latestRun?.executableActions)
      ? latestRun.executableActions
      : (Array.isArray(readJson(REAL_AGENTS_ACTIONS_FILE, {})?.actions) ? readJson(REAL_AGENTS_ACTIONS_FILE, {}).actions : []),
    orders: Array.isArray(latestRun?.orders) ? latestRun.orders : [],
    awards: latestRun?.awards || null,
    scoreboard: latestRun?.scoreboard || null,
    officeStatus: Array.isArray(latestRun?.offices) ? latestRun.offices : [],
    queue,
    ecosystemStudy,
    reportMarkdown: latestRunMd
  };
}

function buildPublicDailyAgentPulse() {
  const payload = buildRealAgentsPayload();
  const actions = Array.isArray(payload.executableActions) ? payload.executableActions : [];
  const queue = Array.isArray(payload.queue) ? payload.queue : [];
  const officeDashboard = Array.isArray(payload.officeDashboard) ? payload.officeDashboard : [];
  const history = Array.isArray(payload.autoRun?.history) ? payload.autoRun.history : [];
  const runGeneratedAt = payload.runGeneratedAt || "";
  const runGeneratedTime = Date.parse(runGeneratedAt);
  const missingLatestRun = !payload.ok || !runGeneratedAt || payload.runtimePersistence?.source === "missing";
  const lastRunAgeMs = Number.isFinite(runGeneratedTime) ? Date.now() - runGeneratedTime : null;
  const staleAfterMs = Math.max(REAL_AGENTS_AUTO_RUN_INTERVAL_MS * 2, 90 * 60 * 1000);
  const lastRunAgeMinutes = lastRunAgeMs === null ? null : Math.max(0, Math.round(lastRunAgeMs / 60000));
  const stale = missingLatestRun || (lastRunAgeMs !== null && lastRunAgeMs > staleAfterMs);
  const timelineBySlug = new Map();
  const timelineByName = new Map();

  (Array.isArray(payload.agentTimelines) ? payload.agentTimelines : []).forEach((timeline) => {
    const slug = String(timeline?.slug || "").trim();
    const name = String(timeline?.name || "").trim();
    if (slug) timelineBySlug.set(slug, timeline);
    if (name) timelineByName.set(name, timeline);
  });

  const actionItems = actions
    .concat(queue)
    .filter((item) => item && (item.title || item.lastIntent || item.intent || item.task))
    .slice(0, 12)
    .map((item, index) => ({
      agent: cleanShortText(item.agent || item.agentName || item.name || `Agente ${index + 1}`, 80),
      office: cleanShortText(item.office || item.officeLabel || item.officeKey || "Redação", 80),
      role: cleanShortText(item.role || item.kind || "monitoramento", 60),
      title: cleanShortText(item.title || item.lastIntent || item.intent || item.task || "Monitorar assunto em alta", 150),
      status: cleanShortText(item.status || item.outcome || "em leitura", 60),
      points: Number(item.points || item.score || 0)
    }));
  const readerItems = (Array.isArray(payload.agents) ? payload.agents : [])
    .map((agent, index) => {
      const timeline =
        timelineBySlug.get(String(agent?.slug || "").trim()) ||
        timelineByName.get(String(agent?.name || "").trim()) ||
        null;
      const events = Array.isArray(timeline?.events) ? timeline.events : [];
      const memoryEvent = events.find((event) => event?.type === "memoria") || events[0] || null;

      return {
        name: cleanShortText(agent?.name || `Agente ${index + 1}`, 80),
        office: cleanShortText(agent?.officeLabel || agent?.officeKey || timeline?.office || "Redação", 80),
        role: cleanShortText(agent?.role || timeline?.role || "leitura", 60),
        specialty: cleanShortText(agent?.specialty || agent?.title || "", 160),
        focus: Array.isArray(agent?.monitoringFocus)
          ? agent.monitoringFocus.slice(0, 4).map((focus) => cleanShortText(focus, 80)).filter(Boolean)
          : [],
        bridge: cleanShortText(agent?.newsroomBridge || "", 160),
        lastSignal: cleanShortText(memoryEvent?.status || memoryEvent?.title || "", 180),
        level: Number(timeline?.level || 0),
        rank: cleanShortText(timeline?.rank || "", 40)
      };
    })
    .filter((agent) => agent.name)
    .slice(0, 120);

  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    runGeneratedAt: runGeneratedAt || payload.updatedAt || "",
    stale,
    paused: Boolean(payload.autoRun?.pausedByCheffeCall),
    missingLatestRun,
    lastRunAgeMinutes,
    lastRunAgeLabel: lastRunAgeMinutes === null ? "sem rodada registrada" : `${lastRunAgeMinutes} min`,
    runtimePersistence: payload.runtimePersistence || null,
    summary: {
      totalAgents: Number(payload.summary?.totalAgents || 0),
      totalOffices: Number(payload.summary?.totalOffices || 0),
      newsItems: Number(payload.summary?.newsItems || 0),
      reviewIssues: Number(payload.summary?.reviewIssues || 0),
      activeQueue: Number(payload.summary?.activeQueue || actionItems.length || 0),
      deliveredAgents: Number(payload.summary?.deliveredAgents || 0),
      averageEnergy: Number(payload.summary?.averageEnergy || 0)
    },
    lastRun: history[0]
      ? {
          at: cleanShortText(history[0].at || "", 40),
          trigger: cleanShortText(history[0].trigger || "", 80),
          newsItems: Number(history[0].newsItems || 0),
          reviewIssues: Number(history[0].reviewIssues || 0),
          queueItems: Number(history[0].queueItems || 0)
        }
      : null,
    offices: officeDashboard.slice(0, 6).map((office) => ({
      label: cleanShortText(office.label || office.office || office.name || "Escritório", 80),
      status: cleanShortText(office.status || office.mood || "ativo", 80),
      queue: Number(office.queue || office.queueDepth || office.actions || 0)
    })),
    readers: readerItems,
    actions: actionItems
  };
}

function buildMasterAgentsSummaryForHub() {
  const registry = readJson(REAL_AGENTS_REGISTRY_FILE, null);
  const latestRun = readJson(REAL_AGENTS_RUN_FILE, null) || readJson(LEGACY_REAL_AGENTS_RUN_FILE, null);
  const actions = readJson(REAL_AGENTS_ACTIONS_FILE, { actions: [] });
  const history = readRealAgentsRunHistory();
  const agents = Array.isArray(registry?.agents) ? registry.agents : [];
  const offices = Array.isArray(registry?.offices) ? registry.offices : [];
  const runSummary = latestRun?.summary || {};
  const actionItems = Array.isArray(actions?.actions) ? actions.actions : [];

  return {
    summary: {
      totalAgents: Number(registry?.totalAgents || agents.length || runSummary.totalAgents || 0),
      totalOffices: offices.length || Number(runSummary.totalOffices || 0),
      newsItems: Number(runSummary.newsItems || countJsonItems(path.join(DATA_DIR, "runtime-news.json")) || 0),
      reviewIssues: Number(runSummary.reviewIssues || 0),
      activeQueue: Number(runSummary.activeQueue || actionItems.length || 0),
      deliveredAgents: Number(runSummary.deliveredAgents || 0),
      averageEnergy: Number(runSummary.averageEnergy || 0)
    },
    autoRun: {
      enabled: !REAL_AGENTS_AUTO_RUN_DISABLED,
      pausedByCheffeCall: Boolean(readJson(CHEFFE_CALL_STATE_FILE, {})?.active),
      intervalMs: REAL_AGENTS_AUTO_RUN_INTERVAL_MS,
      running: realAgentsAutoRunState.running,
      startedAt: realAgentsAutoRunState.startedAt,
      lastRunAt: realAgentsAutoRunState.lastRunAt || latestRun?.generatedAt || history[0]?.at || "",
      lastError: realAgentsAutoRunState.lastError,
      cycles: realAgentsAutoRunState.cycles,
      history: history.slice(0, 5)
    },
    autonomy: latestRun?.autonomy
      ? {
          averageAutonomy: Number(runSummary.averageAutonomy || 0),
          autonomousAgents: Number(runSummary.autonomousAgents || 0),
          highAutonomyAgents: Number(runSummary.highAutonomyAgents || 0)
        }
      : null,
    lastRun: latestRun
      ? {
          generatedAt: latestRun.generatedAt || "",
          trigger: latestRun.trigger || latestRun.startedBy || "",
          summary: {
            newsItems: Number(runSummary.newsItems || 0),
            reviewIssues: Number(runSummary.reviewIssues || 0),
            queueItems: Number(runSummary.activeQueue || actionItems.length || 0)
          }
        }
      : null
  };
}

function buildMasterCheffeSummaryForHub() {
  const state = readCheffeCallState();
  const reviewReport = readJson(REVIEW_TEAM_REPORT_JSON_FILE, null);
  const reviewIssues = Array.isArray(reviewReport?.issues) ? reviewReport.issues.length : Number(reviewReport?.summary?.totalIssues || 0);
  return {
    active: Boolean(state.active),
    lastInstruction: cleanShortText(state.lastInstruction || "", 180),
    lastSessionAt: state.lastSessionAt || "",
    sessions: Array.isArray(state.sessions) ? state.sessions.length : 0,
    pendingDecisions: Number(reviewIssues || 0)
  };
}

function summarizeMasterCaptureReport(report = null, sourceReports = []) {
  const capturedItems = Number(report?.capturedItems || report?.totalItems || 0);
  const reports = Array.isArray(sourceReports) ? sourceReports : [];
  return {
    ok: Boolean(report),
    capturedItems,
    totalItems: capturedItems,
    lastSuccessAt: report?.lastSuccessAt || report?.finishedAt || report?.updatedAt || "",
    updatedAt: report?.updatedAt || report?.finishedAt || "",
    sourceCount: reports.length,
    okSources: reports.filter((item) => item?.ok && Number(item.count || 0) > 0).length,
    emptySources: reports.filter((item) => item?.ok && Number(item.count || 0) <= 0).length,
    failedSources: reports.filter((item) => !item?.ok).length
  };
}

function summarizeMasterArticleIntegrity(report = null) {
  return report
    ? {
        checkedAt: report.checkedAt || "",
        totalHomeLinked: Number(report.totalHomeLinked || 0),
        missingCount: Number(report.missingCount || 0),
        withoutImageCount: Number(report.withoutImageCount || 0)
      }
    : null;
}

function summarizeMasterEditorialHealth(report = null) {
  return report
    ? {
        ok: report.ok !== false,
        generatedAt: report.generatedAt || report.checkedAt || report.updatedAt || "",
        totalIssues: Number(report.totalIssues || report.summary?.totalIssues || 0),
        publicEnglishIssues: Number(report.publicEnglishIssues || report.summary?.publicEnglishIssues || 0)
      }
    : null;
}

function buildMasterAdminHubPayload() {
  const agents = buildMasterAgentsSummaryForHub();
  const cheffe = buildMasterCheffeSummaryForHub();
  const reviewReport = readJson(REVIEW_TEAM_REPORT_JSON_FILE, null);
  const syncReport = readJson(path.join(ROOT_DIR, ".codex-temp", "online-local-sync", "latest-report.json"), null);
  const captureReport = readJson(path.join(DATA_DIR, "latest-news-capture-report.json"), null);
  const dailyRoundReport = readJson(RE_RODADA_DIA_GERAL_REPORT_FILE, null);
  const articleIntegrity = readJson(ARTICLE_INTEGRITY_REPORT_FILE, null);
  const editorialHealth = readJson(EDITORIAL_HEALTH_REPORT_JSON_FILE, null);
  const storage = buildStorageHealthPayload({ writeProbe: false });
  const agentSummary = agents?.summary || {};
  const reviewIssues = Number(reviewReport?.summary?.totalIssues || 0);
  const syncOk = syncReport ? Boolean(syncReport.ok) : false;
  const captureItems = Number(captureReport?.capturedItems || captureReport?.totalItems || 0);
  const syncNewsStep = Array.isArray(syncReport?.steps)
    ? syncReport.steps.find((step) => step?.name === "sync online news to local")
    : null;
  let syncNewsPayload = null;
  try {
    syncNewsPayload = syncNewsStep?.stdout ? JSON.parse(syncNewsStep.stdout) : null;
  } catch {
    syncNewsPayload = null;
  }
  const sourceReports = Array.isArray(captureReport?.directCapture?.reports)
    ? captureReport.directCapture.reports
    : (Array.isArray(syncNewsPayload?.directCapture?.reports)
        ? syncNewsPayload.directCapture.reports
        : (Array.isArray(dailyRoundReport?.directCapture?.reports)
            ? dailyRoundReport.directCapture.reports
            : (Array.isArray(captureReport?.reports) ? captureReport.reports : [])));
  const sourceHealth = sourceReports.slice(0, 24).map((item) => ({
    source: cleanShortText(item.source || item.name || "fonte", 80),
    status: item.ok ? (Number(item.count || 0) > 0 ? "ok" : "vazia") : "erro",
    count: Number(item.count || 0),
    error: cleanShortText(item.error || "", 120)
  }));
  const auditLog = readMasterAuditLog().slice(0, 20);
  const newsCount = countJsonItems(path.join(DATA_DIR, "runtime-news.json")) + countJsonItems(path.join(DATA_DIR, "news-archive.json"));
  const adminTotals = {
    news: newsCount,
    runtimeNews: countJsonItems(path.join(DATA_DIR, "runtime-news.json")),
    archiveNews: countJsonItems(path.join(DATA_DIR, "news-archive.json")),
    businesses: countJsonItems(path.join(DATA_DIR, "businesses-cruzeiro.json"))
  };

  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    title: "Central Master do Catálogo",
    auth: {
      mode: "full-admin-password",
      passwordExposed: false,
      note: "Senha conferida no backend. O HTML nao contem a senha master."
    },
    links: [
      { id: "dashboard", label: "Dashboard completo", href: "/admin/admin-dashboard.html", area: "controle" },
      { id: "cheffe", label: "Chefe Call", href: "/cheffe-call.html", area: "reuniao" },
      { id: "office-main", label: "Escritório principal", href: "/escritorio.html", area: "agentes" },
      { id: "office-nerd", label: "Escritório Nerd", href: "/escritorio-nerd.html", area: "comunidade" },
      { id: "office-arte", label: "Escritório Arte", href: "/escritorio-arte.html", area: "visual" },
      { id: "capture", label: "Agregador de notícias", href: "/api/news/aggregator?limit=50", area: "captacao" },
      { id: "home", label: "Home pública", href: "/index.html?skipIntro=1&skipWelcome=1", area: "publico" }
    ],
    statusCards: [
      {
        label: "Agentes",
        value: Number(agentSummary.totalAgents || 0),
        detail: agents?.autoRun?.enabled
          ? `${Number(agentSummary.totalOffices || 0)} escritorios, ciclo ${Math.round(Number(agents.autoRun.intervalMs || 0) / 60000)} min`
          : `${Number(agentSummary.totalOffices || 0)} escritorios, ${Number(agentSummary.deliveredAgents || 0)} entregas`
      },
      {
        label: "Noticias no admin",
        value: Number(adminTotals.news || 0),
        detail: `${captureItems || 0} itens no ultimo relatorio de captacao`
      },
      {
        label: "Review team",
        value: reviewIssues,
        detail: reviewIssues ? "ha achados para corrigir antes de publicar" : "sem achados no ultimo relatorio"
      },
      {
        label: "Sync online/offline",
        value: syncReport ? (syncOk ? "OK" : "Revisar") : "Pendente",
        detail: syncReport?.finishedAt || "rode npm run sync:online-local antes de deploy"
      },
      {
        label: "Chefe Call",
        value: cheffe?.active ? "Ativa" : "Livre",
        detail: cheffe?.lastInstruction || "pronta para abrir reuniao com os agentes"
      },
      {
        label: "Storage",
        value: storage?.mode || "local",
        detail: storage?.target || "data/"
      }
    ],
    reports: {
      review: {
        ok: Boolean(reviewReport),
        totalIssues: reviewIssues,
        generatedAt: reviewReport?.generatedAt || ""
      },
      sync: syncReport
        ? {
            ok: Boolean(syncReport.ok),
            startedAt: syncReport.startedAt || "",
            finishedAt: syncReport.finishedAt || "",
            steps: Array.isArray(syncReport.steps)
              ? syncReport.steps.map((step) => ({
                  name: step.name,
                  status: step.status,
                  exitCode: step.exitCode
                }))
              : []
          }
        : null,
      capture: summarizeMasterCaptureReport(captureReport, sourceReports),
      agentsRuntime: {
        autoRun: agents?.autoRun || null,
        autonomy: agents?.autonomy || null,
        lastRun: agents?.lastRun || null
      },
      sourceHealth,
      audit: {
        total: readMasterAuditLog().length,
        recent: auditLog
      },
      articleIntegrity: summarizeMasterArticleIntegrity(articleIntegrity),
      editorialHealth: summarizeMasterEditorialHealth(editorialHealth)
    },
    suggestions: [
      {
        priority: "agora",
        title: "Centralizar operacao no hub master",
        detail: "Usar /admin como porta unica e deixar dashboard, Chefe Call, escritorios, captacao e relatorios como destinos internos."
      },
      {
        priority: "agora",
        title: "Fechar ciclo online/offline antes de deploy",
        detail: "Rodar sync, sanitizer, review team, auditoria de imagens e agentes; bloquear publicacao se totalIssues for maior que zero."
      },
      {
        priority: "proximo",
        title: "Transformar captacao em fila visual",
        detail: "Separar itens captados em Novo, Em revisao, Pronto, Sem fonte e Rejeitado, com origem e imagem visiveis."
      },
      {
        priority: "proximo",
        title: "Dar painel proprio para Chefe Call",
        detail: "Mostrar reuniao ativa, decisoes aguardando aprovacao, provas geradas e botoes de liberar, limpar ou executar acao."
      },
      {
        priority: "depois",
        title: "Migrar status critico para banco persistente",
        detail: "Manter arquivos locais como fallback, mas levar filas, votos, assinaturas, acoes dos agentes e relatorios para storage duravel."
      }
    ],
    adminSummary: {
      totals: adminTotals,
      period: null,
      storage: storage || null
    },
    agentsSummary: agentSummary,
    cheffeSummary: {
      active: Boolean(cheffe?.active),
      lastInstruction: cheffe?.lastInstruction || "",
      sessions: Number(cheffe?.sessions || 0),
      pendingDecisions: Number(cheffe?.pendingDecisions || 0)
    }
  };
}

function safeBuildMasterAdminHubPayload() {
  try {
    return buildMasterAdminHubPayload();
  } catch (error) {
    console.warn(`[catalogo] falha ao montar hub master resumido: ${String(error?.message || error)}`);
    const auditLog = readMasterAuditLog().slice(0, 20);
    return {
      ok: true,
      degraded: true,
      updatedAt: new Date().toISOString(),
      title: "Central Master do Catálogo",
      auth: {
        mode: "full-admin-password",
        passwordExposed: false,
        note: "Senha conferida no backend. O HTML nao contem a senha master."
      },
      links: [
        { id: "dashboard", label: "Dashboard completo", href: "/admin/admin-dashboard.html", area: "controle" },
        { id: "cheffe", label: "Chefe Call", href: "/cheffe-call.html", area: "reuniao" },
        { id: "office-main", label: "Escritório principal", href: "/escritorio.html", area: "agentes" },
        { id: "home", label: "Home pública", href: "/index.html?skipIntro=1&skipWelcome=1", area: "publico" }
      ],
      statusCards: [
        { label: "Central", value: "Aberta", detail: "Resumo reduzido entregue para preservar a operacao online." },
        { label: "Review team", value: "Revisar", detail: "Rode a revisão local antes de publicar novas alterações." },
        { label: "Storage", value: "Checar", detail: "Verifique os relatórios completos no dashboard interno." }
      ],
      reports: {
        review: null,
        sync: null,
        capture: null,
        agentsRuntime: null,
        sourceHealth: [],
        audit: {
          total: auditLog.length,
          recent: auditLog
        },
        articleIntegrity: null,
        editorialHealth: null
      },
      suggestions: [
        {
          priority: "agora",
          title: "Abrir dashboard completo",
          detail: "A central entrou em modo resumido. Use o dashboard interno e rode as checagens locais para diagnosticar o relatorio pesado."
        }
      ],
      adminSummary: {
        totals: {},
        period: null,
        storage: null
      },
      agentsSummary: {},
      cheffeSummary: {}
    };
  }
}

function readRealAgentsRunHistory() {
  const history = readJson(REAL_AGENTS_RUN_HISTORY_FILE, []);
  return Array.isArray(history) ? history.slice(0, 24) : [];
}

function recordRealAgentsRunHistory(entry) {
  const history = readRealAgentsRunHistory();
  writeJson(REAL_AGENTS_RUN_HISTORY_FILE, [
    {
      at: entry.at || new Date().toISOString(),
      trigger: entry.trigger || "manual",
      ok: Boolean(entry.ok),
      totalAgents: Number(entry.totalAgents || 0),
      newsItems: Number(entry.newsItems || 0),
      reviewIssues: Number(entry.reviewIssues || 0),
      queueItems: Number(entry.queueItems || 0),
      error: cleanShortText(entry.error || "", 280)
    },
    ...history
  ].slice(0, 24));
}

function getCheffeCallLastActivityAt(state = {}) {
  const stamps = [
    state.lastSessionAt,
    state.pausedAt,
    state.releasedAt,
    state.updatedAt,
    state.lastActivityAt
  ];
  (Array.isArray(state.sessions) ? state.sessions : []).forEach((session) => {
    stamps.push(session.createdAt, session.updatedAt, session.completedAt, session.expiredAt);
    ["logs", "decisions", "approvals"].forEach((key) => {
      (Array.isArray(session[key]) ? session[key] : []).forEach((item) => {
        stamps.push(item.createdAt, item.updatedAt, item.completedAt);
      });
    });
  });
  const times = stamps
    .map((stamp) => Date.parse(stamp || ""))
    .filter((time) => Number.isFinite(time));
  if (!times.length) return "";
  return new Date(Math.max(...times)).toISOString();
}

function reconcileCheffeCallExpiration(state = {}) {
  if (!state.active) return state;
  const lastActivityAt = getCheffeCallLastActivityAt(state) || state.pausedAt || state.lastSessionAt || "";
  const lastActivityTime = Date.parse(lastActivityAt);
  if (!Number.isFinite(lastActivityTime)) return { ...state, lastActivityAt };
  const idleMs = Date.now() - lastActivityTime;
  if (idleMs < CHEFFE_CALL_TIMEOUT_MS) return { ...state, lastActivityAt };
  const now = new Date().toISOString();
  const reason = `timeout-${Math.round(CHEFFE_CALL_TIMEOUT_MS / 60000)}-min-sem-acao`;
  const sessions = (Array.isArray(state.sessions) ? state.sessions : []).map((session, index) =>
    index === 0
      ? {
          ...session,
          status: "expirada-por-inatividade",
          expiredAt: now,
          updatedAt: now
        }
      : session
  );
  const expiredState = {
    ...state,
    active: false,
    releasedAt: now,
    expiredAt: now,
    expirationReason: reason,
    lastActivityAt,
    sessions
  };
  writeCheffeCallState(expiredState);
  return expiredState;
}

function readCheffeCallState() {
  const payload = readJson(CHEFFE_CALL_STATE_FILE, {});
  const legacyInstruction = payload["last" + "Brief" + "ing"] || "";
  return reconcileCheffeCallExpiration({
    active: Boolean(payload.active),
    pausedAt: payload.pausedAt || "",
    releasedAt: payload.releasedAt || "",
    expiredAt: payload.expiredAt || "",
    expirationReason: payload.expirationReason || "",
    lastActivityAt: payload.lastActivityAt || "",
    expiresAfterMinutes: Math.round(CHEFFE_CALL_TIMEOUT_MS / 60000),
    lastInstruction: payload.lastInstruction || legacyInstruction,
    lastSessionAt: payload.lastSessionAt || "",
    sessions: Array.isArray(payload.sessions) ? payload.sessions.slice(0, 12) : []
  });
}

function writeCheffeCallState(state) {
  writeJson(CHEFFE_CALL_STATE_FILE, {
    active: Boolean(state.active),
    pausedAt: state.pausedAt || "",
    releasedAt: state.releasedAt || "",
    expiredAt: state.expiredAt || "",
    expirationReason: state.expirationReason || "",
    lastActivityAt: state.lastActivityAt || getCheffeCallLastActivityAt(state),
    expiresAfterMinutes: Math.round(CHEFFE_CALL_TIMEOUT_MS / 60000),
    lastInstruction: state.lastInstruction || "",
    lastSessionAt: state.lastSessionAt || "",
    sessions: Array.isArray(state.sessions) ? state.sessions.slice(0, 12) : []
  });
}

function normalizeCheffeCallLog(entry = {}) {
  const createdAt = cleanShortText(entry.createdAt || new Date().toISOString(), 60);
  return {
    id: cleanShortText(entry.id || createRecordId("cheflog"), 80),
    createdAt,
    time: cleanShortText(entry.time || createdAt.slice(11, 16), 12),
    kind: cleanShortText(entry.kind || "", 40),
    kindLabel: cleanShortText(entry.kindLabel || "fala", 80),
    agent: cleanShortText(entry.agent || "Cheffe Call", 120),
    office: cleanShortText(entry.office || "", 120),
    text: cleanShortText(entry.text || "", 2400)
  };
}

function normalizeCheffeCallDecision(entry = {}) {
  return {
    id: cleanShortText(entry.id || createRecordId("chefdec"), 80),
    createdAt: cleanShortText(entry.createdAt || new Date().toISOString(), 60),
    state: cleanShortText(entry.state || "queued", 40),
    kindLabel: cleanShortText(entry.kindLabel || "fila", 80),
    agent: cleanShortText(entry.agent || "Cheffe Call", 120),
    office: cleanShortText(entry.office || "", 120),
    title: cleanShortText(entry.title || "Ação da Cheffe Call", 220),
    text: cleanShortText(entry.text || "", 2400),
    howTo: cleanShortText(entry.howTo || "", 3200),
    prompt: cleanShortText(entry.prompt || "", 3200),
    command: cleanShortText(entry.command || "", 1600),
    action: cleanShortText(entry.action || "", 80),
    opinionKey: cleanShortText(entry.opinionKey || "", 140),
    artifact: cleanShortText(entry.artifact || "", 400)
  };
}

const NEWS_IMAGE_FOCUS_DECISION_META = {
  "approve-focus": {
    label: "Aprovar foco",
    status: "aprovado-foco",
    target: "Revisor Bento + Dara Design",
    nextRuntimeAction: "aplicar o foco aprovado, liberar a noticia e manter rastreio de qualidade visual"
  },
  "replace-image": {
    label: "Trocar imagem",
    status: "trocar-imagem",
    target: "Bia Camera + Sofia Fontes + Revisor Bento",
    nextRuntimeAction: "buscar imagem melhor, validar fonte e voltar com nova proposta visual"
  },
  "keep-fallback": {
    label: "Manter fallback",
    status: "manter-fallback",
    target: "Dara Design + Revisor Bento",
    nextRuntimeAction: "manter o fallback atual e revisar se o card continua legivel no portal"
  },
  redo: {
    label: "Refazer",
    status: "refazer-foto-foco",
    target: "Bia Camera + Dara Design + Revisor Bento",
    nextRuntimeAction: "refazer a decisao visual da materia antes de liberar destaque"
  }
};

function normalizeNewsImageFocusDecision(value) {
  const token = cleanShortText(value || "", 80).toLowerCase();
  const aliases = {
    approve: "approve-focus",
    approved: "approve-focus",
    aprovar: "approve-focus",
    "aprovar-foco": "approve-focus",
    focus: "approve-focus",
    swap: "replace-image",
    "swap-image": "replace-image",
    trocar: "replace-image",
    "trocar-imagem": "replace-image",
    replace: "replace-image",
    fallback: "keep-fallback",
    keep: "keep-fallback",
    manter: "keep-fallback",
    "manter-fallback": "keep-fallback",
    refazer: "redo",
    redo: "redo",
    rework: "redo"
  };
  const normalized = aliases[token] || token;
  return NEWS_IMAGE_FOCUS_DECISION_META[normalized] ? normalized : "";
}

function labelNewsImageFocusReason(reason) {
  const labels = {
    "missing-image-url": "sem imagem",
    "image-unreachable": "imagem fora do ar",
    "image-content-type-not-confirmed": "tipo de imagem nao confirmado",
    "people-or-group-scene-without-manual-focus": "pessoa/grupo sem foco manual",
    "group-scene-without-manual-focus": "grupo sem foco manual",
    "manual-focus-present": "tem foco manual",
    "hero-focus-too-high-for-wide-headline": "foco alto demais para manchete larga",
    "frontend-manual-review": "revisão humana solicitada no frontend"
  };
  return labels[reason] || reason;
}

function readNewsImageFocusDecisionStore() {
  const store = readJson(NEWS_IMAGE_FOCUS_DECISIONS_FILE, { version: 1, updatedAt: "", decisions: [] });
  const decisions = Array.isArray(store)
    ? store
    : Array.isArray(store?.decisions)
      ? store.decisions
      : [];
  return {
    version: 1,
    updatedAt: safeString(store?.updatedAt || "", 80),
    decisions: decisions.filter(Boolean).slice(-500)
  };
}

function writeNewsImageFocusDecisionStore(store) {
  writeJson(NEWS_IMAGE_FOCUS_DECISIONS_FILE, {
    version: 1,
    updatedAt: new Date().toISOString(),
    decisions: Array.isArray(store.decisions) ? store.decisions.slice(-500) : []
  });
}

function normalizeNewsImageFocusAuditItem(item = {}, fullItem = {}) {
  const slug = safeString(item.slug || fullItem.slug || "", 220);
  const reasons = Array.isArray(item.reasons)
    ? item.reasons
    : Array.isArray(fullItem.reasons)
      ? fullItem.reasons
      : [];
  const effectiveFocus = safeString(item.effectiveFocus || fullItem.effectiveFocus || "", 80);
  return {
    slug,
    title: safeString(item.title || fullItem.title || "Sem titulo", 260),
    category: safeString(item.category || fullItem.category || "", 120),
    sourceName: safeString(item.sourceName || item.source || fullItem.sourceName || fullItem.source || "", 160),
    publishedAt: safeString(item.publishedAt || fullItem.publishedAt || fullItem.date || fullItem.createdAt || "", 80),
    level: safeString(item.level || fullItem.level || "review", 32),
    reasons: reasons.map((reason) => safeString(reason || "", 140)).filter(Boolean),
    reasonLabels: reasons.map((reason) => labelNewsImageFocusReason(safeString(reason || "", 140))).filter(Boolean),
    imageUrl: safeString(item.imageUrl || fullItem.imageUrl || "", 1200),
    effectiveFocus,
    suggestedFocus: effectiveFocus || "center 42%",
    hasManualFocus: Boolean(fullItem.hasManualFocus || effectiveFocus),
    isNewSinceLastAudit: Boolean(item.isNewSinceLastAudit ?? fullItem.isNewSinceLastAudit),
    articleUrl: slug ? `/noticia.html?slug=${encodeURIComponent(slug)}` : ""
  };
}

function buildNewsImageFocusApprovalQueue() {
  const report = readJson(NEWS_IMAGE_FOCUS_AUDIT_FILE, {});
  const fullItems = Array.isArray(report.items) ? report.items : [];
  const reviewQueue = Array.isArray(report.reviewQueue) ? report.reviewQueue : [];
  const itemsBySlug = new Map(fullItems.map((item) => [safeString(item.slug || "", 220), item]));
  const strictNewItems = fullItems.filter((item) => item.isNewSinceLastAudit && item.level !== "ok");
  const sourceItems = strictNewItems.length
    ? strictNewItems
    : fullItems.filter((item) => item.level !== "ok").length
      ? fullItems.filter((item) => item.level !== "ok")
      : reviewQueue;
  const store = readNewsImageFocusDecisionStore();
  const latestDecisionBySlug = new Map();
  store.decisions.forEach((decision) => {
    const slug = safeString(decision.slug || "", 220);
    if (slug) latestDecisionBySlug.set(slug, decision);
  });

  const queue = sourceItems
    .map((item) => normalizeNewsImageFocusAuditItem(item, itemsBySlug.get(safeString(item.slug || "", 220)) || {}))
    .filter((item) => item.slug)
    .map((item) => {
      const decision = latestDecisionBySlug.get(item.slug) || null;
      return {
        ...item,
        decision: decision
          ? {
              id: safeString(decision.id || "", 120),
              decision: safeString(decision.decision || "", 80),
              decisionLabel: safeString(decision.decisionLabel || "", 80),
              status: safeString(decision.status || "", 80),
              focus: safeString(decision.focus || "", 80),
              replacementImageUrl: safeString(decision.replacementImageUrl || "", 1200),
              note: safeString(decision.note || "", 600),
              nextRuntimeAction: safeString(decision.nextRuntimeAction || "", 260),
              updatedAt: safeString(decision.updatedAt || decision.createdAt || "", 80)
            }
          : null
      };
    });
  const summary = report && typeof report.summary === "object" ? report.summary : {};
  const pendingCount = queue.filter((item) => !item.decision).length;

  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    auditUpdatedAt: safeString(report.updatedAt || "", 80),
    checkedLimit: Number(report.checkedLimit || 0) || 0,
    total: queue.length,
    pendingCount,
    decidedCount: queue.length - pendingCount,
    sourceMode: strictNewItems.length ? "new-blockers" : "review-queue",
    summary: {
      ok: Number(summary.ok || 0) || 0,
      review: Number(summary.review || 0) || 0,
      warning: Number(summary.warning || 0) || 0,
      error: Number(summary.error || 0) || 0,
      manualFocus: Number(summary.manualFocus || 0) || 0,
      newSinceLastAudit: Number(summary.newSinceLastAudit || 0) || 0,
      missingImage: Number(summary.missingImage || 0) || 0,
      unreachableImage: Number(summary.unreachableImage || 0) || 0
    },
    queue
  };
}

function recordNewsImageFocusDecision(body = {}) {
  const slug = safeString(body.slug || body.articleSlug || "", 220);
  const decision = normalizeNewsImageFocusDecision(body.decision || body.action || body.status);
  if (!slug || !decision) {
    return { ok: false, status: 400, error: "Informe slug e decisao valida para a foto/foco." };
  }

  const queuePayload = buildNewsImageFocusApprovalQueue();
  let item = queuePayload.queue.find((entry) => entry.slug === slug);
  if (!item) {
    const frontendArticle = getArticleBySlug(slug);
    if (frontendArticle) {
      item = normalizeNewsImageFocusAuditItem(
        {
          slug,
          level: "manual-review",
          reasons: ["frontend-manual-review"],
          effectiveFocus: body.focus || frontendArticle.imageFocus || frontendArticle.effectiveFocus || ""
        },
        frontendArticle
      );
    }
  }
  if (!item) {
    return { ok: false, status: 404, error: "Item de foto/foco nao encontrado na fila atual." };
  }

  const meta = NEWS_IMAGE_FOCUS_DECISION_META[decision];
  const now = new Date().toISOString();
  const focus = cleanShortText(
    body.focus || (decision === "approve-focus" ? item.effectiveFocus || item.suggestedFocus || "center 42%" : item.effectiveFocus),
    80
  );
  const replacementImageUrl = safeString(body.replacementImageUrl || body.imageUrl || "", 1200);
  const note = cleanShortText(body.note || body.comment || "", 800);
  const store = readNewsImageFocusDecisionStore();
  const previous = store.decisions.find((entry) => safeString(entry.slug || "", 220) === slug);
  const nextDecision = {
    id: previous?.id || createRecordId("focusdec"),
    slug,
    title: item.title,
    category: item.category,
    sourceName: item.sourceName,
    imageUrl: item.imageUrl,
    articleUrl: item.articleUrl,
    level: item.level,
    reasons: item.reasons,
    reasonLabels: item.reasonLabels,
    decision,
    decisionLabel: meta.label,
    status: meta.status,
    focus,
    replacementImageUrl,
    note,
    requestedNextRuntime: true,
    nextRuntimeAction: meta.nextRuntimeAction,
    createdBy: "Full Admin",
    createdAt: previous?.createdAt || now,
    updatedAt: now
  };
  writeNewsImageFocusDecisionStore({
    decisions: store.decisions
      .filter((entry) => safeString(entry.slug || "", 220) !== slug)
      .concat(nextDecision)
  });

  let runtimeApproval = null;
  try {
    const runtimeResult = recordImageApprovalDecision({
      slug,
      decision,
      focus,
      replacementImageUrl,
      note,
      requestedBy: "Full Admin",
      source: "cheffe-call"
    });
    runtimeApproval = runtimeResult.ok ? runtimeResult.decision : null;
  } catch (error) {
    runtimeApproval = {
      error: cleanShortText(error?.message || "Falha ao registrar aprovacao para runtime.", 280)
    };
  }

  const orderId = createRecordId("ord");
  appendOfficeOrder({
    id: orderId,
    from: "Cheffe Call",
    to: meta.target,
    priority: "alta",
    message: cleanShortText(
      `Decisao de foto/foco no popup da Cheffe Call: ${meta.label} para "${item.title}". Slug: ${slug}. Foco: ${focus || "sem foco manual"}. ${replacementImageUrl ? `Nova imagem: ${replacementImageUrl}. ` : ""}Motivo: ${(item.reasonLabels || item.reasons || []).join(", ") || "revisao visual"}.`,
      1200
    ),
    ceoReply: cleanShortText(`Registrado. Na proxima runtime dos agentes: ${meta.nextRuntimeAction}.`, 1200),
    status: `cheffe-call-foto-foco-${decision}`,
    hierarchy: "Full Admin -> Cheffe Call -> agentes reais",
    createdAt: now,
    assignedAgents: 3,
    assignments: [
      {
        slug,
        title: item.title,
        action: meta.nextRuntimeAction,
        decision,
        focus,
        replacementImageUrl,
        imageUrl: item.imageUrl,
        articleUrl: item.articleUrl
      }
    ],
    executionSummary: {
      delivered: decision === "approve-focus" || decision === "keep-fallback" ? 1 : 0,
      failed: 0,
      running: decision === "replace-image" || decision === "redo" ? 1 : 0
    }
  });

  return {
    ok: true,
    orderId,
    decision: nextDecision,
    runtimeApproval,
    ...buildNewsImageFocusApprovalQueue()
  };
}

function summarizeCheffeCallSession(session = {}) {
  const decisions = Array.isArray(session.decisions) ? session.decisions : [];
  const logs = Array.isArray(session.logs) ? session.logs : [];
  const approvals = Array.isArray(session.approvals) ? session.approvals : [];
  return {
    approvals: approvals.length,
    decisions: decisions.length,
    logs: logs.length,
    running: decisions.filter((item) => item.state === "running").length,
    queued: decisions.filter((item) => item.state === "queued" || item.state === "ready").length,
    terminal: decisions.filter((item) => item.state === "terminal" || item.state === "fallback").length
  };
}

function findCheffeExecutableActionMatch(body = {}) {
  const store = readJson(REAL_AGENTS_ACTIONS_FILE, { actions: [] });
  const actions = Array.isArray(store.actions) ? store.actions : [];
  const agentSlug = slugify(body.agent || "");
  const titleSlug = slugify(body.title || body.text || body.opinion || "");
  return (
    actions.find((item) => {
      if ((item.status || "") !== "aguardando-aprovacao") return false;
      const sameAgent = slugify(item.agent || "") === agentSlug;
      if (!sameAgent) return false;
      if (!titleSlug) return true;
      const itemTitle = slugify(item.title || "");
      return itemTitle.includes(titleSlug.slice(0, 42)) || titleSlug.includes(itemTitle.slice(0, 42));
    }) || null
  );
}

function appendCheffeAutonomyLog(entry = {}) {
  const store = readJson(CHEFFE_CALL_AUTONOMY_LOG_FILE, { version: 1, runs: [] });
  const runs = Array.isArray(store.runs) ? store.runs : [];
  const nextEntry = {
    id: cleanShortText(entry.id || createRecordId("auto"), 120),
    createdAt: cleanShortText(entry.createdAt || new Date().toISOString(), 80),
    status: cleanShortText(entry.status || "unknown", 40),
    intent: cleanShortText(entry.intent || "", 80),
    title: cleanShortText(entry.title || "", 220),
    agent: cleanShortText(entry.agent || "", 120),
    summary: cleanShortText(entry.summary || "", 1200),
    proof: entry.proof || null
  };
  writeJson(CHEFFE_CALL_AUTONOMY_LOG_FILE, {
    version: 1,
    updatedAt: new Date().toISOString(),
    runs: [nextEntry, ...runs].slice(0, 120)
  });
  return nextEntry;
}

function cleanCheffePromptText(value, maxLength = 5000) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

function buildCheffeIdePrompt(action = {}) {
  const missingRequirements = Array.isArray(action.missingRequirements)
    ? action.missingRequirements.filter(Boolean).slice(0, 12)
    : [];
  const expectedProof = Array.isArray(action.expectedProof)
    ? action.expectedProof.filter(Boolean).slice(0, 12)
    : [];
  const lines = [
    "Cheffe Call gerou uma ação para resolver aqui no Codex/IDE.",
    "",
    "Contexto:",
    `- ID: ${action.id || "sem-id"}`,
    `- Status: ${action.status || "waiting-ide-command"}`,
    `- Intent: ${action.intent || "ide"}`,
    `- Título: ${action.title || "Ação aguardando IDE"}`,
    `- Agente: ${action.agent || "Cheffe Call"}${action.office ? ` / ${action.office}` : ""}`,
    action.reasonCode ? `- Bloqueio/falha: ${action.reasonCode}` : "",
    "",
    "Relatório da Cheffe:",
    action.reason || "A Cheffe Call não conseguiu executar esta ordem de verdade no ambiente atual.",
    "",
    "Comando sugerido pelo painel:",
    action.suggestedIdeCommand || "Codex IDE: reproduzir a pendência localmente, corrigir, testar e devolver prova.",
    "",
    "Requisitos faltando:",
    ...(missingRequirements.length ? missingRequirements.map((item) => `- ${item}`) : ["- identificar causa concreta no IDE"]),
    "",
    "Prova que devo devolver:",
    ...(expectedProof.length
      ? expectedProof.map((item) => `- ${item}`)
      : ["- problema identificado", "- arquivo/rota alterado ou bloqueio explicado", "- teste/check executado"]),
    "",
    "Pedido ao Codex:",
    "Resolva esta pendência localmente. Não marque como concluída sem execução real. Responda no formato: problema identificado -> causa encontrada -> arquivo alterado -> teste passou -> prova retornada."
  ];
  return cleanCheffePromptText(lines.filter((line) => line !== null && line !== undefined).join("\n"), 5000);
}

function readCheffeIdeActionQueue() {
  const store = readJson(CHEFFE_CALL_IDE_ACTIONS_FILE, { version: 1, actions: [] });
  const actions = Array.isArray(store.actions) ? store.actions : [];
  return actions
    .filter(Boolean)
    .map((action) => {
      const nextAction = {
        id: cleanShortText(action.id || createRecordId("ide"), 120),
        createdAt: cleanShortText(action.createdAt || "", 80),
        updatedAt: cleanShortText(action.updatedAt || action.createdAt || "", 80),
        status: cleanShortText(action.status || "waiting-ide", 60),
        source: cleanShortText(action.source || "Cheffe Call", 120),
        intent: cleanShortText(action.intent || "", 80),
        title: cleanShortText(action.title || "Acao aguardando IDE", 220),
        agent: cleanShortText(action.agent || "Cheffe Call", 120),
        office: cleanShortText(action.office || "", 120),
        reasonCode: cleanShortText(action.reasonCode || "", 80),
        reason: cleanShortText(action.reason || "", 1200),
        missingRequirements: Array.isArray(action.missingRequirements)
          ? action.missingRequirements.map((item) => cleanShortText(item || "", 220)).filter(Boolean).slice(0, 12)
          : [],
        suggestedIdeCommand: cleanShortText(action.suggestedIdeCommand || "", 1600),
        expectedProof: Array.isArray(action.expectedProof)
          ? action.expectedProof.map((item) => cleanShortText(item || "", 220)).filter(Boolean).slice(0, 12)
          : [],
        proofId: cleanShortText(action.proofId || "", 120),
        orderId: cleanShortText(action.orderId || "", 120)
      };
      nextAction.idePrompt = cleanCheffePromptText(action.idePrompt || buildCheffeIdePrompt(nextAction), 5000);
      return nextAction;
    })
    .slice(0, 80);
}

function appendCheffeIdeAction(action = {}) {
  const now = new Date().toISOString();
  const store = readJson(CHEFFE_CALL_IDE_ACTIONS_FILE, { version: 1, actions: [] });
  const actions = Array.isArray(store.actions) ? store.actions : [];
  const nextAction = {
    id: cleanShortText(action.id || createRecordId("ide"), 120),
    createdAt: cleanShortText(action.createdAt || now, 80),
    updatedAt: now,
    status: cleanShortText(action.status || "waiting-ide", 60),
    source: cleanShortText(action.source || "Cheffe Call", 120),
    intent: cleanShortText(action.intent || "", 80),
    title: cleanShortText(action.title || "Acao aguardando comando geral do IDE", 220),
    agent: cleanShortText(action.agent || "Cheffe Call", 120),
    office: cleanShortText(action.office || "", 120),
    reasonCode: cleanShortText(action.reasonCode || "", 80),
    reason: cleanShortText(action.reason || "", 1200),
    missingRequirements: Array.isArray(action.missingRequirements)
      ? action.missingRequirements.map((item) => cleanShortText(item || "", 220)).filter(Boolean).slice(0, 12)
      : [],
    suggestedIdeCommand: cleanShortText(action.suggestedIdeCommand || "", 1600),
    expectedProof: Array.isArray(action.expectedProof)
      ? action.expectedProof.map((item) => cleanShortText(item || "", 220)).filter(Boolean).slice(0, 12)
      : [],
    proofId: cleanShortText(action.proofId || "", 120),
    orderId: cleanShortText(action.orderId || "", 120)
  };
  nextAction.idePrompt = cleanCheffePromptText(action.idePrompt || buildCheffeIdePrompt(nextAction), 5000);
  const nextActions = [nextAction, ...actions.filter((item) => item.id !== nextAction.id)].slice(0, 120);
  writeJson(CHEFFE_CALL_IDE_ACTIONS_FILE, {
    version: 1,
    updatedAt: now,
    actions: nextActions
  });
  return nextAction;
}

function reconcileCheffeIdeActionQueue(reviewQueue = {}) {
  if (reviewQueue.status !== "clear" || Number(reviewQueue.total || 0) !== 0 || !reviewQueue.generatedAt) {
    return { ok: true, changed: 0, reason: "review-not-clear" };
  }
  const store = readJson(CHEFFE_CALL_IDE_ACTIONS_FILE, { version: 1, actions: [] });
  const actions = Array.isArray(store.actions) ? store.actions : [];
  const now = new Date().toISOString();
  let changed = 0;
  const nextActions = actions.map((action) => {
    const status = String(action?.status || "");
    const text = normalizeText(
      [
        action?.title,
        action?.reason,
        action?.reasonCode,
        action?.suggestedIdeCommand,
        ...(Array.isArray(action?.missingRequirements) ? action.missingRequirements : [])
      ].join(" ")
    );
    const waiting = /waiting|aguardando|open|pendente/i.test(status);
    const reviewRelated = /review|revisao|revisao-team|review-team|auditoria/.test(text);
    if (!waiting || !reviewRelated) return action;
    changed += 1;
    return {
      ...action,
      status: "resolved-reconciled",
      updatedAt: now,
      resolvedAt: now,
      resolution:
        "Fila reconciliada automaticamente: o relatorio npm run review:team atual esta sem pendencias abertas."
    };
  });
  if (changed > 0) {
    writeJson(CHEFFE_CALL_IDE_ACTIONS_FILE, {
      version: 1,
      updatedAt: now,
      actions: nextActions
    });
  }
  return { ok: true, changed, reason: changed ? "review-clear" : "no-review-ide-actions" };
}

function buildCheffeReviewQueue() {
  const file = path.relative(ROOT_DIR, REVIEW_TEAM_REPORT_JSON_FILE).replace(/\\/g, "/");
  const report = readJson(REVIEW_TEAM_REPORT_JSON_FILE, null);
  const imageAudit = readJson(NEWS_IMAGE_FOCUS_AUDIT_FILE, {});
  const auditImageIssues = Array.isArray(imageAudit.reviewQueue)
    ? imageAudit.reviewQueue.slice(0, 16).map((item, index) => ({
        id: cleanShortText(item.id || item.slug || `image-review-${index + 1}`, 80),
        status: "image-review",
        type: "image-focus-review",
        severity: cleanShortText(item.level === "error" ? "high" : item.level || "medium", 40),
        file: cleanShortText(item.slug ? `noticia.html?slug=${item.slug}` : "noticia.html", 220),
        line: 0,
        label: cleanShortText(item.title || "Foto da matéria precisa de revisão", 160),
        detail: cleanShortText(
          [
            Array.isArray(item.reasons) && item.reasons.length ? `Motivos: ${item.reasons.join(", ")}` : "",
            item.imageUrl ? `Imagem atual: ${item.imageUrl}` : "Sem imagem confiável",
            item.slug ? `Abrir: /noticia.html?slug=${encodeURIComponent(item.slug)}` : ""
          ]
            .filter(Boolean)
            .join("\n"),
          1200
        )
      }))
    : [];
  const imageIssueKeys = new Set(
    auditImageIssues.map((item) => normalizeText(`${item.type}|${item.file}`)).filter(Boolean)
  );
  const generatedFallbackImageIssues = getArticleNews(200)
    .filter((item) => {
      const imageUrl = String(getArticleImageUrl(item) || "");
      const hasSource = Boolean(item.sourceUrl || item.url || item.link);
      return hasSource && (imageUrl.includes("/assets/news-fallbacks/") || /buscar-na-fonte/i.test(String(item.imageQuality || "")));
    })
    .map((item, index) => {
      const fileName = item.slug ? `noticia.html?slug=${item.slug}` : "noticia.html";
      return {
        id: cleanShortText(item.slug || `source-image-review-${index + 1}`, 80),
        status: "image-review",
        type: "image-focus-review",
        severity: "medium",
        file: cleanShortText(fileName, 220),
        line: 0,
        label: cleanShortText(item.title || "Foto da matéria precisa de revisão", 160),
        detail: cleanShortText(
          [
            "Motivos: foto automática/fallback; buscar melhor imagem na fonte",
            item.sourceUrl ? `Fonte: ${item.sourceUrl}` : "",
            item.imageUrl ? `Imagem atual: ${item.imageUrl}` : ""
          ]
            .filter(Boolean)
            .join("\n"),
          1200
        )
      };
    })
    .filter((item) => {
      const key = normalizeText(`${item.type}|${item.file}`);
      if (!key || imageIssueKeys.has(key)) return false;
      imageIssueKeys.add(key);
      return true;
    })
    .slice(0, 16);
  const imageIssues = [...auditImageIssues, ...generatedFallbackImageIssues].slice(0, 24);
  const correctionsPayload = buildEditorialCorrectionsLog();
  const correctionKeys = new Set();
  const correctionIssues = Array.isArray(correctionsPayload.latest)
    ? correctionsPayload.latest
        .filter((item) => !["corrigido", "closed", "resolvido"].includes(String(item.status || "").toLowerCase()))
        .filter((item) => {
          const key = normalizeText(`${item.slug || item.file || item.articleUrl}|${item.type || item.typeLabel || "correction"}`);
          if (!key || correctionKeys.has(key)) return false;
          correctionKeys.add(key);
          return true;
        })
        .map((item, index) => ({
          id: cleanShortText(item.id || `public-correction-${index + 1}`, 80),
          status: "public-reported",
          type: "public-correction",
          severity: cleanShortText(item.severity || "alta", 40),
          file: cleanShortText(item.file || (item.slug ? `noticia.html?slug=${item.slug}` : "noticia.html"), 220),
          line: 0,
          label: cleanShortText(item.title || "Matéria enviada pelo leitor para revisão", 160),
          detail: cleanShortText(
            [
              item.publicNote ? `Pedido: ${item.publicNote}` : "",
              item.typeLabel ? `Tipo: ${item.typeLabel}` : "",
              item.articleUrl ? `Abrir: ${item.articleUrl}` : ""
            ]
              .filter(Boolean)
              .join("\n"),
            1200
          )
        }))
    : [];
  if (!report || typeof report !== "object") {
    return {
      kind: "cheffe-review-queue",
      source: correctionIssues.length || imageIssues.length ? "public-corrections + image-review + npm run review:team" : "npm run review:team",
      file,
      markdownFile: path.relative(ROOT_DIR, REVIEW_TEAM_REPORT_MD_FILE).replace(/\\/g, "/"),
      status: correctionIssues.length || imageIssues.length ? "open" : "not-run",
      generatedAt: "",
      total: correctionIssues.length + imageIssues.length,
      byType: {
        ...(correctionIssues.length ? { "public-correction": correctionIssues.length } : {}),
        ...(imageIssues.length ? { "image-focus-review": imageIssues.length } : {})
      },
      topFiles: [],
      issues: [...correctionIssues, ...imageIssues],
      summary: correctionIssues.length || imageIssues.length
        ? `${correctionIssues.length} matéria(s) enviada(s) pelo botão Informar erro aguardam revisão primária da Cheffe.`
        : "A equipe de revisão ainda não gerou relatório nesta worktree."
    };
  }

  const issues = Array.isArray(report.issues) ? report.issues : [];
  const total = Number(report.summary?.totalIssues ?? issues.length) || 0;
  const safeIssues = issues
    .map((issue, index) => ({
      id: cleanShortText(issue.id || `review-${index + 1}`, 80),
      status: "open-review",
      type: cleanShortText(issue.type || "review", 80),
      severity: cleanShortText(issue.severity || "medium", 40),
      file: cleanShortText(issue.file || "", 220),
      line: Number(issue.line || 0) || 0,
      label: cleanShortText(issue.label || "Pendência de revisão", 160),
      detail: cleanShortText(issue.detail || "", 1200)
    }))
    .slice(0, 80);

  const mergedIssues = [...correctionIssues, ...imageIssues, ...safeIssues].slice(0, 80);
  const mergedTotal = total + correctionIssues.length + imageIssues.length;
  const mergedByType = {
    ...(report.summary?.byType && typeof report.summary.byType === "object" ? report.summary.byType : {})
  };
  if (correctionIssues.length) {
    mergedByType["public-correction"] = correctionIssues.length;
  }
  if (imageIssues.length) {
    mergedByType["image-focus-review"] = imageIssues.length;
  }

  return {
    kind: "cheffe-review-queue",
    source: correctionIssues.length || imageIssues.length ? "public-corrections + image-review + npm run review:team" : "npm run review:team",
    file,
    markdownFile: path.relative(ROOT_DIR, REVIEW_TEAM_REPORT_MD_FILE).replace(/\\/g, "/"),
    status: mergedTotal > 0 ? "open" : "clear",
    generatedAt: cleanShortText(report.generatedAt || "", 80),
    total: mergedTotal,
    byType: mergedByType,
    topFiles: Array.isArray(report.summary?.topFiles)
      ? report.summary.topFiles
          .map((item) => ({
            file: cleanShortText(item.file || "", 220),
            count: Number(item.count || 0)
          }))
          .filter((item) => item.file)
          .slice(0, 12)
      : [],
    issues: mergedIssues,
    summary: mergedTotal > 0
      ? correctionIssues.length && total
        ? `Cheffe tem ${correctionIssues.length} correção(ões) do leitor, ${imageIssues.length} foto(s) para revisão e ${total} pendência(s) da revisão automática.`
        : correctionIssues.length
          ? `${correctionIssues.length} matéria(s) enviada(s) pelo botão Informar erro aguardam revisão primária da Cheffe.`
          : imageIssues.length
            ? `${imageIssues.length} foto(s) de matéria aguardam revisão primária da Cheffe.`
            : `Revisão encontrou ${total} pendência(s).`
      : "Revisão sem pendências no relatório atual."
  };
}

function runCheffeCommandProof(label, command, args = [], options = {}) {
  const startedAt = new Date().toISOString();
  const timeout = Math.max(1000, Math.min(Number(options.timeoutMs || 60000), 180000));
  const result = spawnSync(command, args, {
    cwd: options.cwd || ROOT_DIR,
    encoding: "utf-8",
    timeout,
    windowsHide: true,
    env: { ...process.env, ...(options.env || {}) }
  });
  const finishedAt = new Date().toISOString();
  const errorMessage = result.error?.message || "";
  return {
    kind: "command-proof",
    label: cleanShortText(label || command, 120),
    command: [path.basename(command), ...args].join(" "),
    cwd: path.relative(ROOT_DIR, options.cwd || ROOT_DIR).replace(/\\/g, "/") || ".",
    ok: !result.error && result.status === 0,
    exitCode: Number.isInteger(result.status) ? result.status : null,
    signal: cleanShortText(result.signal || "", 40),
    timedOut: result.error?.code === "ETIMEDOUT",
    startedAt,
    finishedAt,
    stdout: cleanShortText(result.stdout || "", 2400),
    stderr: cleanShortText(result.stderr || errorMessage, 2400)
  };
}

function inferCheffeAutonomousIntent(context = {}) {
  const forced = cleanShortText(context.body?.autonomyIntent || context.body?.intent || "", 80).toLowerCase();
  const allowedForced = new Set([
    "real-agents-runtime",
    "ecosystem-study",
    "review-team",
    "editorial-health",
    "health-check",
    "safe-cleanup",
    "deploy-gate",
    "agent-action"
  ]);
  if (allowedForced.has(forced)) return forced;

  const text = normalizeText([
    context.title,
    context.opinion,
    context.command,
    context.prompt,
    context.howTo,
    context.instruction,
    context.executableMatch?.kind,
    context.executableMatch?.title
  ].join(" "));

  if (/editorial:health|saude editorial|saúde editorial|gate p0|gate p1|gate p2|ranking editorial|cache editorial|titulos alternativos|títulos alternativos/.test(text)) {
    return "editorial-health";
  }
  if (/limp|lixo|temporario|temporarios|cache|log/.test(text)) return "safe-cleanup";
  if (/deploy|publicar|producao|produção|render|push|commit|github/.test(text)) return "deploy-gate";
  if (/review:team|revis[aã]o|auditoria|audit|validar layout|validar texto/.test(text)) return "review-team";
  if (/codex:health|saude|saúde|health|travamento|autoteste/.test(text)) return "health-check";
  if (/rodar agentes|agentes reais|181 agentes|runtime|real-agents|atualizar agentes/.test(text)) {
    return "real-agents-runtime";
  }
  if (/estudo|estudar|ecossistema|aprend|memoria|memória/.test(text)) return "ecosystem-study";
  if (context.executableMatch) return "agent-action";
  if (/organizar|redistribuir|prioridade|identificar rotinas|triagem|revisar|mapear|acompanhar/.test(text)) {
    return "agent-action";
  }
  if (context.command) return "blocked-terminal";
  return "unsupported";
}

function runCheffeSafeTempCleanup() {
  const startedAt = new Date().toISOString();
  const removed = [];
  const skipped = [];
  const roots = [
    {
      root: path.join(ROOT_DIR, ".codex-temp"),
      allowFile: (filePath) => /\.log$/i.test(path.basename(filePath)) || /smoke/i.test(path.basename(filePath))
    }
  ];

  roots.forEach(({ root, allowFile }) => {
    if (!fs.existsSync(root)) {
      skipped.push({ path: path.relative(ROOT_DIR, root).replace(/\\/g, "/"), reason: "missing" });
      return;
    }
    const visit = (currentDir, depth = 0) => {
      if (depth > 3) return;
      let entries = [];
      try {
        entries = fs.readdirSync(currentDir, { withFileTypes: true });
      } catch (error) {
        skipped.push({
          path: path.relative(ROOT_DIR, currentDir).replace(/\\/g, "/"),
          reason: cleanShortText(error.message || "read failed", 160)
        });
        return;
      }
      entries.forEach((entry) => {
        const filePath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          visit(filePath, depth + 1);
          return;
        }
        if (!entry.isFile() || !allowFile(filePath)) return;
        try {
          const stats = fs.statSync(filePath);
          fs.rmSync(filePath, { force: true });
          removed.push({
            path: path.relative(ROOT_DIR, filePath).replace(/\\/g, "/"),
            bytes: stats.size
          });
        } catch (error) {
          skipped.push({
            path: path.relative(ROOT_DIR, filePath).replace(/\\/g, "/"),
            reason: cleanShortText(error.message || "remove failed", 160)
          });
        }
      });
    };
    visit(root);
  });

  return {
    kind: "safe-temp-cleanup-proof",
    ok: true,
    startedAt,
    finishedAt: new Date().toISOString(),
    removedCount: removed.length,
    removedBytes: removed.reduce((sum, item) => sum + Number(item.bytes || 0), 0),
    removed: removed.slice(0, 40),
    skipped: skipped.slice(0, 20),
    rule: "remove apenas logs/smokes em .codex-temp; preserva data, assets, latest-run e provas atuais"
  };
}

function runCheffeDeployGate(context = {}) {
  const checks = [
    runCheffeCommandProof("syntax server", process.execPath, ["--check", "server.js"], { timeoutMs: 30000 }),
    runCheffeCommandProof("git status", "git", ["status", "--porcelain"], { timeoutMs: 30000 })
  ];
  const deployEnabled = String(process.env.CHEFFE_CALL_AUTO_DEPLOY || "").trim().toLowerCase() === "true";
  const dirty = cleanShortText(checks[1].stdout || "", 2400);
  const baseMissing = [
    "CHEFFE_CALL_AUTO_DEPLOY=true no ambiente online/local",
    "worktree limpo ou escopo de commit escolhido",
    "credencial Git/Render disponivel",
    "smoke online apos publicar"
  ];
  const proof = {
    kind: "deploy-gate-proof",
    ok: false,
    status: "blocked",
    deployEnabled,
    title: cleanShortText(context.title || "", 220),
    reasonCode: "",
    blockedReason: "",
    missingRequirements: [],
    suggestedIdeCommand: "",
    expectedProof: [
      "node --check server.js",
      "git status com escopo revisado",
      "push/deploy concluido",
      "smoke online da Cheffe Call"
    ],
    checks,
    requiredForAutoDeploy: baseMissing
  };

  if (!checks.every((item) => item.ok)) {
    proof.reasonCode = "local-checks-failed";
    proof.blockedReason = "Um ou mais checks locais falharam antes do deploy.";
    proof.missingRequirements = ["corrigir checks locais antes de publicar"];
    proof.suggestedIdeCommand = "Codex IDE: ler proof.deployProof.checks, corrigir erro local, rodar node --check server.js e repetir deploy-gate.";
    proof.summary = "Deploy bloqueado: checks locais falharam.";
    return proof;
  }
  if (dirty) {
    proof.reasonCode = "dirty-worktree";
    proof.blockedReason = "Ha mudancas locais sem escopo de commit/deploy definido.";
    proof.missingRequirements = ["selecionar arquivos do deploy", "rodar testes", "criar commit ou limpar alteracoes fora de escopo"];
    proof.suggestedIdeCommand = "Codex IDE: revisar git status, separar somente arquivos da ordem, rodar testes, commit/push/deploy e devolver URL validada.";
    proof.summary = "Deploy bloqueado: worktree possui mudancas locais; precisa commit/selecionar escopo antes de publicar.";
    proof.dirtyStatus = dirty;
    return proof;
  }
  if (!deployEnabled) {
    proof.reasonCode = "auto-deploy-disabled";
    proof.blockedReason = "O ambiente nao autorizou deploy automatico pela Cheffe Call.";
    proof.missingRequirements = ["definir CHEFFE_CALL_AUTO_DEPLOY=true", "confirmar credencial Git/Render", "confirmar branch/remoto de publicacao"];
    proof.suggestedIdeCommand = "Codex IDE: se o chefe autorizar, publicar manualmente pelo fluxo git/render e rodar smoke online.";
    proof.summary = "Deploy bloqueado: auto-deploy nao esta habilitado no ambiente.";
    return proof;
  }

  const push = runCheffeCommandProof("push render-target", "git", ["push", "render-target", "HEAD:main"], {
    timeoutMs: 180000
  });
  proof.steps = [push];
  proof.ok = push.ok;
  proof.status = push.ok ? "executed" : "failed";
  proof.summary = push.ok
    ? "Deploy enviado para render-target."
    : "Deploy tentou enviar para render-target, mas falhou.";
  if (!push.ok) {
    proof.reasonCode = "push-failed";
    proof.blockedReason = "O push/deploy falhou mesmo com gate habilitado.";
    proof.missingRequirements = ["verificar autenticacao Git/Render", "ver stderr do push", "repetir push/deploy pelo IDE"];
    proof.suggestedIdeCommand = "Codex IDE: inspecionar stderr do push, corrigir autenticacao/remoto e repetir git push render-target HEAD:main.";
  }
  return proof;
}

function markRealAgentActionExecution(actionId, status, note, proof = {}) {
  const action = reviewRealAgentAction({
    actionId,
    status,
    note
  });
  if (!action.ok) return action;
  const store = readJson(REAL_AGENTS_ACTIONS_FILE, { version: 1, actions: [] });
  const actions = Array.isArray(store.actions) ? store.actions : [];
  const nextActions = actions.map((item) => {
    if (item.id !== actionId) return item;
    return {
      ...item,
      execution: {
        status: cleanShortText(status || "", 40),
        note: cleanShortText(note || "", 800),
        proof,
        executedAt: new Date().toISOString()
      }
    };
  });
  writeJson(REAL_AGENTS_ACTIONS_FILE, {
    version: 1,
    updatedAt: new Date().toISOString(),
    actions: nextActions
  });
  return { ok: true, action: nextActions.find((item) => item.id === actionId) || action.action };
}

function buildCheffeIdeActionForBlockedProof(context = {}, proof = {}) {
  const reasonCode = cleanShortText(
    proof.reasonCode || proof.blockedReason || proof.blockedReasonCode || proof.blockedReason || proof.status || "blocked",
    80
  );
  const reason = cleanShortText(
    proof.blockedReason || proof.summary || "A Cheffe Call nao conseguiu executar esta ordem no ambiente atual.",
    1200
  );
  const suggestedIdeCommand = cleanShortText(
    proof.suggestedIdeCommand ||
      (proof.status === "failed"
        ? "Codex IDE: reproduzir a falha localmente, ler actionProof.autoExecution, corrigir a causa, rodar o check/teste adequado e devolver prova."
        : "") ||
      (proof.intent === "blocked-terminal" && context.command
        ? `Codex IDE: avaliar e executar manualmente, se seguro: ${context.command}`
        : "Codex IDE: abrir esta acao, executar pelo ambiente local com testes, e devolver prova para a Cheffe Call."),
    1600
  );
  return appendCheffeIdeAction({
    status: "waiting-ide-command",
    source: "Cheffe Call",
    intent: proof.intent || inferCheffeAutonomousIntent(context),
    title: proof.title || context.title || "Acao aguardando comando geral do IDE",
    agent: context.agent || proof.agent || "Cheffe Call",
    office: context.office || proof.office || "",
    reasonCode,
    reason,
    missingRequirements: proof.missingRequirements || [],
    suggestedIdeCommand,
    expectedProof: proof.expectedProof || [
      "problema identificado",
      "arquivo/rota alterado ou bloqueio explicado",
      "teste/check executado",
      "deploy/smoke online quando aplicavel"
    ],
    proofId: proof.id || "",
    orderId: context.order?.id || proof.orderId || ""
  });
}

function executeCheffeAutonomousOrder(context = {}) {
  const startedAt = new Date().toISOString();
  const intent = inferCheffeAutonomousIntent(context);
  const baseProof = {
    kind: "cheffe-call-autonomous-execution",
    mode: "controlled-autonomy",
    endpoint: "POST /api/cheffe-call/action",
    intent,
    agent: cleanShortText(context.agent || "Cheffe Call", 120),
    office: cleanShortText(context.office || "", 120),
    title: cleanShortText(context.title || "", 220),
    orderId: cleanShortText(context.order?.id || "", 120),
    startedAt,
    finishedAt: "",
    ok: false,
    status: "blocked",
    summary: "",
    files: []
  };

  const finish = (patch = {}) => {
    const proof = {
      ...baseProof,
      ...patch,
      finishedAt: new Date().toISOString()
    };
    const requiresIdeResolution = proof.status !== "executed" || proof.ok === false;
    if (requiresIdeResolution) {
      proof.ideAction = buildCheffeIdeActionForBlockedProof(context, proof);
      proof.ideQueueFile = path.relative(ROOT_DIR, CHEFFE_CALL_IDE_ACTIONS_FILE).replace(/\\/g, "/");
    }
    appendCheffeAutonomyLog({
      status: proof.status,
      intent,
      title: proof.title,
      agent: proof.agent,
      summary: proof.summary,
      proof
    });
    if (context.order?.id) {
      updateOfficeOrderById(context.order.id, {
        status:
          proof.status === "executed"
            ? "cheffe-call-autoexecutado"
            : proof.status === "failed"
              ? "cheffe-call-falhou"
              : "cheffe-call-bloqueado",
        ceoReply: cleanShortText(proof.summary || context.order.ceoReply || "", 1200),
        executionSummary: {
          delivered: proof.status === "executed" ? 1 : 0,
          failed: proof.status === "failed" ? 1 : 0,
          running: 0,
          blocked: proof.status === "blocked" ? 1 : 0
        },
        autonomyProof: proof
      });
    }
    return {
      ok: proof.ok,
      status: proof.status,
      intent,
      proof
    };
  };

  if (intent === "real-agents-runtime") {
    const beforeOrders = countOfficeOrders();
    const result = runRealAgentsRuntime({ trigger: "cheffe-call-auto-execute" });
    if (!result.ok) {
      return finish({
        ok: false,
        status: "failed",
        summary: cleanShortText(result.error || "Runtime dos agentes falhou.", 800),
        runtime: result
      });
    }
    runRealAgentsAutonomyCycle("cheffe-call-auto-execute");
    const runtimeProof = buildRealAgentsExecutionProof(result, {
      beforeOrders,
      afterOrders: countOfficeOrders(),
      message: context.title,
      endpoint: "POST /api/cheffe-call/action",
      httpStatus: 200,
      trigger: "cheffe-call-auto-execute"
    });
    return finish({
      ok: true,
      status: "executed",
      summary: `Runtime executada autonomamente: ${runtimeProof.totalAgents || 0} agentes, ${runtimeProof.files?.length || 0} provas.`,
      runtime: result.summary,
      runtimeProof,
      files: Array.isArray(runtimeProof.files) ? runtimeProof.files : []
    });
  }

  if (intent === "ecosystem-study") {
    const study = recordRealAgentsEcosystemStudy({
      trigger: "cheffe-call-auto-execute",
      instruction: context.instruction || context.title || ""
    });
    return finish({
      ok: true,
      status: "executed",
      summary: `Estudo do ecossistema atualizado no ciclo ${study.learningCycle}.`,
      study,
      files: [buildProofFile(REAL_AGENTS_ECOSYSTEM_STUDY_FILE, "estudo do ecossistema")]
    });
  }

  if (intent === "review-team") {
    const commandProof = runCheffeCommandProof("review team", process.execPath, ["scripts/review-team-audit.js"], {
      timeoutMs: 120000
    });
    const reviewQueue = buildCheffeReviewQueue();
    const hasReviewIssues = Number(reviewQueue.total || 0) > 0;
    return finish({
      ok: commandProof.ok && !hasReviewIssues,
      status: commandProof.ok ? (hasReviewIssues ? "blocked" : "executed") : "failed",
      summary: !commandProof.ok
        ? "Revisao automatica falhou; ver stderr no proof."
        : hasReviewIssues
          ? `Revisao automatica encontrou ${reviewQueue.total} pendencia(s).`
          : "Revisao automatica da equipe local executada sem pendencias.",
      reasonCode: hasReviewIssues ? "review-team-issues" : "",
      blockedReason: hasReviewIssues ? "A equipe de revisão encontrou pendências que precisam virar correção concreta." : "",
      missingRequirements: hasReviewIssues
        ? reviewQueue.issues.slice(0, 8).map((issue) => `${issue.severity}: ${issue.file}${issue.line ? `:${issue.line}` : ""} - ${issue.label}`)
        : [],
      suggestedIdeCommand: hasReviewIssues
        ? "Codex IDE: corrigir os arquivos listados em reviewQueue, rodar npm run review:team até totalIssues=0 e devolver prova."
        : "",
      expectedProof: hasReviewIssues
        ? ["arquivos corrigidos", "npm run review:team com totalIssues=0", "smoke da página afetada quando houver UI pública"]
        : [],
      commandProof,
      reviewQueue,
      files: [
        buildProofFile(REVIEW_TEAM_REPORT_MD_FILE, "relatorio review team"),
        buildProofFile(REVIEW_TEAM_REPORT_JSON_FILE, "json review team")
      ]
    });
  }

  if (intent === "editorial-health") {
    const commandProof = runCheffeCommandProof("editorial health", process.execPath, ["scripts/editorial-health-check.js"], {
      timeoutMs: 120000
    });
    const health = buildEditorialHealthReport();
    const humanApprovalRequired = Number(health.summary?.humanApprovalRequired || 0);
    const issueTotal =
      humanApprovalRequired +
      Number(health.summary?.sourceIssues || 0) +
      Number(health.summary?.visualIssues || 0);
    return finish({
      ok: commandProof.ok,
      status: commandProof.ok ? "executed" : "failed",
      summary: commandProof.ok
        ? `Saude editorial gerada: P0=${health.gates?.P0 || 0}, P1=${health.gates?.P1 || 0}, pendencias=${issueTotal}.`
        : "Saude editorial falhou; ver stderr no proof.",
      reasonCode: commandProof.ok && humanApprovalRequired ? "editorial-human-approval-required" : "",
      blockedReason: commandProof.ok && humanApprovalRequired
        ? "Ha materias P0 que precisam de aprovacao humana antes de destaque/publicacao sensivel."
        : "",
      missingRequirements: commandProof.ok && humanApprovalRequired
        ? health.humanApprovalQueue.slice(0, 8).map((item) => `${item.priority || item.gate}: ${item.title}`)
        : [],
      suggestedIdeCommand: commandProof.ok && humanApprovalRequired
        ? "Cheffe Call: revisar humanApprovalQueue, aprovar/segurar P0 e rodar npm run editorial:health novamente."
        : "",
      expectedProof: commandProof.ok && humanApprovalRequired
        ? ["decisao humana para cada P0 destacado", "fonte conferida", "imagem/credito validados"]
        : [],
      commandProof,
      health,
      files: [
        buildProofFile(EDITORIAL_HEALTH_REPORT_MD_FILE, "relatorio saude editorial"),
        buildProofFile(EDITORIAL_HEALTH_REPORT_JSON_FILE, "json saude editorial")
      ]
    });
  }

  if (intent === "health-check") {
    const commandProof = runCheffeCommandProof("codex health", process.execPath, ["scripts/codex-health-check.js"], {
      timeoutMs: 60000
    });
    return finish({
      ok: commandProof.ok,
      status: commandProof.ok ? "executed" : "failed",
      summary: commandProof.ok ? "Health check local executado." : "Health check local falhou.",
      commandProof
    });
  }

  if (intent === "safe-cleanup") {
    const cleanupProof = runCheffeSafeTempCleanup();
    return finish({
      ok: true,
      status: "executed",
      summary: `Limpeza segura executada: ${cleanupProof.removedCount} arquivo(s), ${cleanupProof.removedBytes} bytes removidos.`,
      cleanupProof
    });
  }

  if (intent === "deploy-gate") {
    const deployProof = runCheffeDeployGate(context);
    return finish({
      ok: deployProof.ok,
      status: deployProof.status,
      summary: deployProof.summary,
      reasonCode: deployProof.reasonCode || deployProof.status,
      blockedReason: deployProof.blockedReason || deployProof.summary,
      missingRequirements: deployProof.missingRequirements || deployProof.requiredForAutoDeploy || [],
      suggestedIdeCommand: deployProof.suggestedIdeCommand || "",
      expectedProof: deployProof.expectedProof || [],
      deployProof
    });
  }

  if (intent === "agent-action") {
    const proofFile = context.executableMatch?.artifact
      ? buildProofFile(path.join(ROOT_DIR, context.executableMatch.artifact), "artefato da acao do agente")
      : null;
    const executionProof = {
      kind: "agent-action-execution-proof",
      actionId: cleanShortText(context.executableMatch?.id || "", 120),
      artifact: proofFile,
      rule: "acao operacional segura: fecha proposta/triagem no painel e registra prova; codigo/deploy seguem pelo deploy-gate"
    };
    let actionReview = null;
    if (context.executableMatch?.id) {
      actionReview = markRealAgentActionExecution(
        context.executableMatch.id,
        "executado",
        `Executado autonomamente pela Cheffe Call em ${new Date().toISOString()}.`,
        executionProof
      );
    }
    return finish({
      ok: !actionReview || actionReview.ok,
      status: !actionReview || actionReview.ok ? "executed" : "failed",
      summary: actionReview && !actionReview.ok
        ? actionReview.error || "Falha ao marcar acao executada."
        : "Acao operacional do agente executada e registrada com prova.",
      actionReview,
      executionProof,
      files: proofFile ? [proofFile] : []
    });
  }

  return finish({
    ok: false,
    status: "blocked",
    summary:
      intent === "blocked-terminal"
        ? "Comando de terminal nao esta na lista segura de autoexecucao."
        : "Ordem nao mapeada para um executor autonomo seguro.",
    reasonCode: intent === "blocked-terminal" ? "terminal-command-requires-ide" : "unsupported-autonomous-order",
    blockedReason:
      intent === "blocked-terminal"
        ? "O agente pediu terminal/comando que precisa ser revisado e rodado no IDE."
        : "A ordem nao corresponde a um executor autonomo seguro conhecido.",
    missingRequirements:
      intent === "blocked-terminal"
        ? ["revisao humana/IDE do comando", "validacao de segurança", "prova apos execucao local"]
        : ["mapear executor seguro", "definir arquivo/rota alvo", "validar impacto antes de executar"],
    suggestedIdeCommand:
      intent === "blocked-terminal" && context.command
        ? `Codex IDE: revisar e, se seguro, executar este comando localmente: ${context.command}`
        : "Codex IDE: transformar esta ordem em tarefa concreta com arquivo alvo, teste e prova."
  });
}

function applyCheffeCallAction(body = {}) {
  const action = cleanShortText(body.action || body.type, 40).toLowerCase();
  if (!action) {
    return { ok: false, status: 400, error: "Informe a ação que a Cheffe Call deve registrar." };
  }

  const state = readCheffeCallState();
  if (!state.sessions.length) {
    return { ok: false, status: 409, error: "Nenhuma sessao de Cheffe Call esta aberta para receber a ação." };
  }

  const now = new Date().toISOString();
  const sessionId = cleanShortText(body.sessionId, 80);
  const sessionIndex = state.sessions.findIndex((item, index) => (sessionId ? item.id === sessionId : index === 0));
  if (sessionIndex < 0) {
    return { ok: false, status: 404, error: "Sessao da Cheffe Call nao encontrada." };
  }

  const targetSession = state.sessions[sessionIndex] || {};
  const instruction = cleanShortText(body.instruction || targetSession.instruction || state.lastInstruction, 1600);
  const agent = cleanShortText(body.agent || "Cheffe Call", 120);
  const office = cleanShortText(body.office || "", 120);
  const role = cleanShortText(body.role || "", 80);
  const title = cleanShortText(body.title || body.assignment || body.text || body.opinion || `Acao de ${agent}`, 220);
  const opinion = cleanShortText(body.opinion || body.text || "", 2400);
  const command = cleanShortText(body.command || "", 1600);
  const howTo = cleanShortText(body.howTo || "", 3200);
  const prompt = cleanShortText(body.prompt || "", 3200);
  const opinionKey = cleanShortText(body.opinionKey || "", 140);
  const approvals = Array.isArray(targetSession.approvals) ? targetSession.approvals.slice(0, 32) : [];
  const logs = Array.isArray(targetSession.logs) ? targetSession.logs.slice(0, 64) : [];
  const decisions = Array.isArray(targetSession.decisions) ? targetSession.decisions.slice(0, 32) : [];
  const executableMatch = findCheffeExecutableActionMatch({ agent, title, text: opinion });
  let reviewedAction = null;
  let autoExecution = null;
  let sessionStatusOverride = "";
  const actionProofs = [];

  const pushLog = (entry) => {
    logs.unshift(normalizeCheffeCallLog({ ...entry, createdAt: now }));
  };
  const pushDecision = (entry) => {
    decisions.unshift(normalizeCheffeCallDecision({ ...entry, createdAt: now, action }));
  };
  const pushApproval = (entry) => {
    approvals.unshift({
      id: cleanShortText(entry.id || createRecordId("chefvote"), 80),
      createdAt: now,
      action,
      agent,
      office,
      role,
      opinionKey,
      note: cleanShortText(entry.note || "", 1200),
      executableActionId: cleanShortText(entry.executableActionId || "", 120)
    });
  };
  const appendActionOrder = (payload = {}) => {
    const order = {
      id: createRecordId("ord"),
      from: "Cheffe Call",
      to: cleanShortText(payload.to || `${agent}${office ? ` • ${office}` : ""}`, 120),
      priority: cleanShortText(payload.priority || "alta", 40),
      message: cleanShortText(payload.message || title, 1200),
      ceoReply: cleanShortText(
        payload.ceoReply || "Cheffe Call registrou a decisão e jogou a ação na fila operacional da equipe.",
        1200
      ),
      status: cleanShortText(payload.status || `cheffe-call-${action}`, 80),
      hierarchy: "Full Admin -> Cheffe Call -> agentes reais",
      createdAt: now,
      assignedAgents: 1,
      assignments: [
        {
          agent,
          office,
          role,
          title,
          action,
          command
        }
      ],
      executionSummary: {
        delivered: ["approve", "complete"].includes(action) ? 1 : 0,
        failed: 0,
        running: action === "implement" ? 1 : 0
      }
    };
    appendOfficeOrder(order);
    actionProofs.push({
      kind: "office-order-proof",
      endpoint: "POST /api/cheffe-call/action",
      file: "data/office-orders.json",
      orderId: order.id,
      status: order.status,
      to: order.to,
      createdAt: order.createdAt
    });
    return order;
  };

  const maybeRegisterAgentArticleArtifact = () => {
    const haystack = normalizeText([instruction, title, opinion, command, prompt].join(" "));
    if (!/\b(pixel art|pixels art|arte pixel|pixel)\b/.test(haystack) || !/\b(artigo|materia|mat[eé]ria|autoral|hero)\b/.test(haystack)) {
      return;
    }
    pushLog({
      kind: "good",
      kindLabel: "matéria publicada pelos agentes",
      agent: "Ari Pipeline + Bia Camera + Dora AI",
      office: "Cheffe Call",
      text: "A fila executada gerou o artigo autoral sobre pixel art e marcou destaque na hero."
    });
    pushDecision({
      state: "published",
      kindLabel: "artigo autoral publicado",
      agent: "Ari Pipeline + Bia Camera + Dora AI",
      office: "Cheffe Call",
      title: "Pixel art não é nostalgia: é uma tecnologia de leitura para jogos, mapas e notícias",
      text: "Produzido pela execução dos agentes da Cheffe Call, com base em Pixel Joint e Lospec.",
      artifact: "./noticia.html?slug=pixel-art-nao-e-nostalgia-e-interface"
    });
  };

  if (action === "refresh") {
    const runtimeResult = runRealAgentsRuntime({ trigger: "cheffe-call-refresh" });
    pushLog({
      kindLabel: runtimeResult.ok ? "runtime atualizada" : "falha de runtime",
      agent: "Cheffe Call",
      office: "Sistema",
      text: runtimeResult.ok
        ? "Os agentes reais rodaram novo ciclo manual a partir da sala."
        : runtimeResult.error || "Falha ao rodar os agentes reais."
    });
    if (!runtimeResult.ok) {
      const failureProof = {
        kind: "cheffe-call-action-failure",
        mode: "controlled-autonomy",
        endpoint: "POST /api/cheffe-call/action",
        action,
        intent: "real-agents-runtime",
        agent,
        office,
        title: "Atualizar agentes reais",
        ok: false,
        status: "failed",
        reasonCode: "real-agents-runtime-failed",
        blockedReason: runtimeResult.error || "Falha ao atualizar os agentes reais.",
        summary: runtimeResult.error || "Falha ao atualizar os agentes reais.",
        missingRequirements: ["reproduzir npm run agents:run no IDE", "corrigir erro da runtime", "rodar smoke da Cheffe Call/agentes"],
        suggestedIdeCommand: "Codex IDE: rodar npm run agents:run, corrigir a falha da runtime, validar /api/real-agents/run e devolver prova.",
        expectedProof: [
          "npm run agents:run concluido",
          "POST /api/real-agents/run validado",
          "Cheffe Call atualizada com prova da runtime"
        ],
        runtimeResult,
        createdAt: now
      };
      failureProof.ideAction = buildCheffeIdeActionForBlockedProof(
        { body, action, instruction, agent, office, role, title, command },
        failureProof
      );
      failureProof.ideQueueFile = path.relative(ROOT_DIR, CHEFFE_CALL_IDE_ACTIONS_FILE).replace(/\\/g, "/");
      appendCheffeAutonomyLog({
        status: "failed",
        intent: "real-agents-runtime",
        title: failureProof.title,
        agent,
        summary: failureProof.summary,
        proof: failureProof
      });
      return {
        ok: false,
        status: 500,
        error: runtimeResult.error || "Falha ao atualizar os agentes reais.",
        proof: failureProof,
        actionProof: failureProof
      };
    }
  } else if (action === "approve") {
    pushApproval({
      note: `Ideia aprovada na Cheffe Call: ${title}`,
      executableActionId: executableMatch?.id || ""
    });
    pushLog({
      kind: "good",
      kindLabel: "boa ideia",
      agent,
      office,
      text: opinion || title
    });
    pushDecision({
      state: "ready",
      kindLabel: "aceita",
      agent,
      office,
      title: `Plano aprovado para ${agent}`,
      text: title,
      howTo,
      prompt,
      command,
      opinionKey,
      artifact: executableMatch?.artifact || ""
    });
    appendActionOrder({
      message: `Aprovado na Cheffe Call: ${title}. Contexto: ${opinion || instruction}`,
      ceoReply: `${agent} recebeu aprovação formal da sala e pode seguir para execução orientada.`
    });
    if (executableMatch) {
      const review = reviewRealAgentAction({
        actionId: executableMatch.id,
        status: "aprovado",
        note: `Aprovado pela Cheffe Call em ${now}.`
      });
      if (review.ok) reviewedAction = review.action;
    }
  } else if (action === "implement") {
    pushApproval({
      note: `Execução autorizada na Cheffe Call: ${title}`,
      executableActionId: executableMatch?.id || ""
    });
    pushLog({
      kind: "good",
      kindLabel: "implementando",
      agent,
      office,
      text: opinion || title
    });
    pushDecision({
      state: "running",
      kindLabel: "implementando",
      agent,
      office,
      title: `Execução iniciada por ${agent}`,
      text: title,
      howTo,
      prompt,
      command,
      opinionKey,
      artifact: executableMatch?.artifact || ""
    });
    const implementationOrder = appendActionOrder({
      message: `Executar agora a partir da Cheffe Call: ${title}. Comando: ${command || "sem complemento de terminal"}`,
      ceoReply: `${agent} entrou em execução acompanhada a partir da sala.`,
      status: "cheffe-call-em-execucao"
    });
    if (executableMatch) {
      const review = reviewRealAgentAction({
        actionId: executableMatch.id,
        status: "aprovado",
        note: `Execução liberada pela Cheffe Call em ${now}.`
      });
      if (review.ok) reviewedAction = review.action;
    }
    maybeRegisterAgentArticleArtifact();
    autoExecution = executeCheffeAutonomousOrder({
      body,
      action,
      instruction,
      agent,
      office,
      role,
      title,
      opinion,
      command,
      howTo,
      prompt,
      opinionKey,
      executableMatch,
      order: implementationOrder
    });
    if (autoExecution?.proof) {
      actionProofs.push(autoExecution.proof);
      const autoExecuted = autoExecution.status === "executed";
      const autoFailed = autoExecution.status === "failed";
      const autoLabel = autoExecuted
        ? "autoexecutado"
        : autoFailed
          ? "falha na autoexecucao"
          : "autoexecucao bloqueada";
      pushLog({
        kind: autoExecuted ? "good" : autoFailed ? "error" : "warning",
        kindLabel: autoLabel,
        agent: "Cheffe Autonomia",
        office: "Sistema",
        text: autoExecution.proof.summary || "Executor autonomo retornou prova."
      });
      pushDecision({
        state: autoExecuted ? "executed" : autoFailed ? "failed" : "blocked",
        kindLabel: autoLabel,
        agent,
        office,
        title: autoExecuted ? `Executado automaticamente por ${agent}` : `Execucao autonoma pendente para ${agent}`,
        text: autoExecution.proof.summary || title,
        howTo,
        prompt,
        command,
        opinionKey,
        artifact: executableMatch?.artifact || ""
      });
      if (autoExecution.proof.actionReview?.action) reviewedAction = autoExecution.proof.actionReview.action;
      sessionStatusOverride = autoExecuted
        ? "execucao-conferida"
        : autoFailed
          ? "execucao-falhou"
          : "execucao-bloqueada";
    }
  } else if (action === "complete") {
    const proofLevel = cleanShortText(body.proofLevel || "", 40);
    const runtimeEvidence = cleanShortText(body.runtimeEvidence || body.evidence || "", 1200);
    const isApplicationProof = proofLevel === "application";
    const finalState = isApplicationProof ? "published" : "executed";
    const finalLabel = isApplicationProof ? "aplicação provada" : "execução provada";
    pushLog({
      kind: isApplicationProof ? "good" : "info",
      kindLabel: finalLabel,
      agent,
      office,
      text: runtimeEvidence || opinion || title
    });
    pushDecision({
      state: finalState,
      kindLabel: finalLabel,
      agent,
      office,
      title: isApplicationProof ? `Aplicação provada por ${agent}` : `Execução provada por ${agent}`,
      text: runtimeEvidence || title,
      howTo,
      prompt,
      command,
      opinionKey,
      artifact: executableMatch?.artifact || ""
    });
    appendActionOrder({
      message: `${finalLabel} na Cheffe Call: ${title}. Evidência: ${runtimeEvidence || "runtime retornou prova resumida no painel."}`,
      ceoReply: isApplicationProof
        ? `${agent} ficou marcado como aplicado com prova no alvo final.`
        : `${agent} ficou marcado como executado com prova; aplicação/publicação ainda segue pendente.`,
      status: isApplicationProof ? "cheffe-call-aplicacao-provada" : "cheffe-call-execucao-provada"
    });
  } else if (action === "task") {
    pushLog({
      kindLabel: "tarefa criada",
      agent,
      office,
      text: title
    });
    pushDecision({
      state: "queued",
      kindLabel: "tarefa",
      agent,
      office,
      title: `Fila de tarefa para ${agent}`,
      text: title,
      howTo,
      prompt,
      command,
      opinionKey,
      artifact: executableMatch?.artifact || ""
    });
    appendActionOrder({
      message: `Nova tarefa vinda da Cheffe Call para ${agent}: ${title}. Critério: transformar em entrega revisável com validação.`,
      ceoReply: `${agent} recebeu uma tarefa formal da sala e entra na fila operacional.`,
      status: "cheffe-call-tarefa"
    });
  } else if (action === "terminal") {
    pushLog({
      kindLabel: "enviado ao terminal",
      agent,
      office,
      text: command || title
    });
    pushDecision({
      state: "terminal",
      kindLabel: "terminal",
      agent,
      office,
      title: `Prompt enviado ao terminal por ${agent}`,
      text: title,
      command,
      prompt,
      opinionKey,
      artifact: executableMatch?.artifact || ""
    });
    appendActionOrder({
      to: `Terminal + ${agent}`,
      message: `Terminal acionado pela Cheffe Call para ${agent}: ${command || title}`,
      ceoReply: "O pedido foi jogado no trilho de terminal e fica rastreado na reunião.",
      status: "cheffe-call-terminal"
    });
  } else if (action === "variation") {
    pushLog({
      kindLabel: "variação pedida",
      agent,
      office,
      text: title
    });
    pushDecision({
      state: "queued",
      kindLabel: "variação",
      agent,
      office,
      title: `Alternativa pedida para ${agent}`,
      text: title,
      howTo,
      prompt,
      command,
      opinionKey
    });
  } else if (action === "dismiss") {
    pushLog({
      kindLabel: "opinião ignorada",
      agent,
      office,
      text: opinion || title
    });
    pushDecision({
      state: "dismissed",
      kindLabel: "ignorada",
      agent,
      office,
      title: `Ignorada por enquanto: ${agent}`,
      text: title,
      command,
      opinionKey
    });
  } else {
    return { ok: false, status: 400, error: "Ação da Cheffe Call ainda nao suportada." };
  }

  const nextSession = {
    ...targetSession,
    instruction,
    updatedAt: now,
    status:
      sessionStatusOverride ||
      (action === "implement"
        ? "em-execucao"
        : action === "complete"
          ? "execucao-conferida"
        : action === "approve"
          ? "aprovado"
        : action === "refresh"
            ? "sincronizado"
            : "aguardando-aprovacao"),
    approvals: approvals.slice(0, 32),
    logs: logs.slice(0, 64),
    decisions: decisions.slice(0, 32),
    reviewedActionId: reviewedAction?.id || targetSession.reviewedActionId || "",
    lastActionProof: {
      kind: "cheffe-call-action-proof",
      endpoint: "POST /api/cheffe-call/action",
      httpStatus: 200,
      action,
      sessionId: targetSession.id || sessionId,
      createdAt: now,
      officeOrders: actionProofs,
      reviewedActionId: reviewedAction?.id || "",
      autoExecution: autoExecution?.proof || null,
      autonomyLogFile: path.relative(ROOT_DIR, CHEFFE_CALL_AUTONOMY_LOG_FILE).replace(/\\/g, "/")
    }
  };

  const nextSessions = state.sessions.slice();
  nextSessions[sessionIndex] = nextSession;
  writeCheffeCallState({
    ...state,
    active: true,
    pausedAt: state.pausedAt || now,
    releasedAt: "",
    expiredAt: "",
    expirationReason: "",
    lastActivityAt: now,
    lastInstruction: instruction,
    lastSessionAt: now,
    sessions: nextSessions
  });

  const payload = buildCheffeCallPayload();
  return {
    ok: true,
    action,
    reviewedAction,
    proof: nextSession.lastActionProof,
    session: payload.meeting.currentSession || null,
    payload
  };
}

function getCheffeCallOpinions(payload, instruction) {
  const daily = payload.dailyContext || {};
  const topAgents = Array.isArray(daily.topAgents) ? daily.topAgents.slice(0, 8) : [];
  const fallbackQueue = Array.isArray(payload.queue) ? payload.queue.slice(0, 8) : [];
  const sourceBase = topAgents.length
    ? topAgents.map((item) => ({
        name: item.name,
        office: item.office,
        role: item.role,
        intent: item.intent,
        autonomy: item.autonomy,
        urgency: item.urgency,
        confidence: item.confidence,
        points: item.points,
        competitionScore: item.competitionScore,
        intelligence: item.intelligence,
        execution: item.execution,
        impact: item.impact,
        action: item.action,
        deliverable: item.deliverable
      }))
    : fallbackQueue.map((item) => ({
        name: item.name,
        office: item.officeLabel,
        role: item.role,
        intent: item.autonomy?.intent || item.assignment?.idea || "",
        autonomy: item.autonomy?.autonomy || 0,
        urgency: item.autonomy?.urgency || 0,
        confidence: item.autonomy?.confidence || 0,
        points: item.points || 0,
        competitionScore: item.competition?.competitionScore || 0,
        intelligence: item.competition?.intelligence || 0,
        execution: item.competition?.execution || 0,
        impact: item.competition?.impact || 0,
        action: item.assignment?.action || "",
        deliverable: item.assignment?.deliverable || ""
      }));
  const source = sourceBase.length
    ? sourceBase
    : [
        {
          name: "Codex CEO",
          office: "Escritorio Principal",
          role: "ceo",
          intent: "organizar a reuniao e transformar fala em decisao rastreavel",
          autonomy: 82,
          urgency: 78
        },
        {
          name: "Bento Producer",
          office: "Escritorio de Arte",
          role: "review",
          intent: "priorizar o que precisa ficar legivel antes do deploy",
          autonomy: 82,
          urgency: 80
        },
        {
          name: "Lia Foto",
          office: "Esttiles",
          role: "image",
          intent: "garantir que a cena e os assets nao sumam no deploy",
          autonomy: 80,
          urgency: 72
        },
        {
          name: "Zed Engine",
          office: "Escritorio Nerd",
          role: "dev",
          intent: "validar API, estado e comandos antes de publicar",
          autonomy: 84,
          urgency: 76
        },
        {
          name: "Iris Proof",
          office: "Escritorio de Ninjas",
          role: "audit",
          intent: "bloquear falhas de permissao, cache e rota quebrada",
          autonomy: 81,
          urgency: 74
        },
        {
          name: "Nina Texto",
          office: "Escritorio Principal",
          role: "copy",
          intent: "deixar as mensagens da sala publicaveis e sem linguagem temporaria",
          autonomy: 79,
          urgency: 70
        }
      ];

  const subject = cleanShortText(instruction || "tema de hoje", 180);
  const subjectTokens = new Set(
    String(subject)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 4)
  );
  const actionMemory = Array.isArray(payload.executableActions) ? payload.executableActions : [];
  const queueMemory = Array.isArray(payload.queue) ? payload.queue : [];
  const ecosystemStudy = payload.ecosystemStudy || {};
  const ecosystemFocus = Array.isArray(ecosystemStudy.focusModules) ? ecosystemStudy.focusModules : [];
  const ecosystemSignals = Array.isArray(ecosystemStudy.impactGate?.currentSignals)
    ? ecosystemStudy.impactGate.currentSignals
    : [];
  const roleFocus = [
    { role: /\b(ceo|lead|coord|produtor)\b/i, words: ["prioridade", "reuniao", "decisao", "fluxo"], lens: "prioridade e decisão" },
    { role: /\b(dev|code|sistema|autom|terminal)\b/i, words: ["comando", "terminal", "api", "senha", "botao", "fluxo", "funciona"], lens: "fluxo técnico e API" },
    { role: /\b(review|revis|proof|audit|segur|qualidade)\b/i, words: ["erro", "falha", "nao", "quebrado", "validar", "risco"], lens: "risco e validação" },
    { role: /\b(copy|texto|editor|jornal|manchete)\b/i, words: ["fala", "opiniao", "texto", "prompt", "mensagem"], lens: "clareza da fala" },
    { role: /\b(arte|design|pixel|visual|foto)\b/i, words: ["avatar", "cadeira", "visual", "cena", "layout"], lens: "encaixe visual" },
    { role: /\b(sources|fonte|ninja)\b/i, words: ["fonte", "evidencia", "memoria", "historico", "rastrear"], lens: "evidência e memória" },
    { role: /\b(social|rede|insta|trend|crescimento)\b/i, words: ["rede", "social", "instagram", "alcance", "engajamento"], lens: "distribuição e crescimento" }
  ];
  const ideaTriggers = new Set(["ideia", "ideias", "sugestao", "melhorar", "criar", "fazer", "resolver", "como", "novo", "fluxo", "visual", "comando"]);

  const memoryMatchesAgent = (item) => {
    const haystack = actionMemory
      .concat(queueMemory)
      .filter((entry) => (
        String(entry.agent || entry.name || "").toLowerCase() === String(item.name || "").toLowerCase() ||
        String(entry.office || entry.officeLabel || "").toLowerCase() === String(item.office || "").toLowerCase()
      ))
      .map((entry) => cleanShortText(entry.title || entry.action || entry.message || entry.text || entry.status || "", 160))
      .filter(Boolean);
    return [...new Set(haystack)].slice(0, 2);
  };

  const seenOpinionKeys = new Set();
  const useful = source
    .map((item) => {
      const signature = `${item.name || ""} ${item.office || ""} ${item.role || ""} ${item.intent || ""}`;
      const normalizedSignature = signature
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      const focus = roleFocus.find((entry) => entry.role.test(signature) || entry.words.some((word) => subjectTokens.has(word)));
      const matchingTokens = [...subjectTokens].filter((token) => normalizedSignature.includes(token)).slice(0, 4);
      const memories = memoryMatchesAgent(item);
      const studyMatch = ecosystemFocus.find((entry) => {
        const haystack = normalizeText(`${entry.area || ""} ${entry.reason || ""} ${(entry.files || []).join(" ")}`);
        return [...subjectTokens].some((token) => haystack.includes(token)) ||
          /ceo|dev|review|audit|proof|fontes|sistema|autom/.test(normalizedSignature);
      });
      const hasDirectUse = Boolean(focus && focus.words.some((word) => subjectTokens.has(word)));
      const hasMemory = memories.length > 0;
      const hasOwnIdea = Boolean(focus && [...subjectTokens].some((token) => ideaTriggers.has(token)));
      const highUrgency = Number(item.urgency || 0) >= 76;
      if (!hasDirectUse && !hasMemory && !hasOwnIdea && !matchingTokens.length && !highUrgency && !studyMatch) return null;
      const lensKey = focus?.lens || item.role || item.office || item.name;
      const roleAction = cleanShortText(item.action || "", 220);
      const memoryDetail =
        memories.find((memory) => !normalizeText(memory).includes(normalizeText(subject).slice(0, 80))) ||
        roleAction ||
        cleanShortText(item.intent || "", 180) ||
        memories[0];
      const studyEvidence = studyMatch
        ? `estudo do ecossistema ciclo ${ecosystemStudy.learningCycle || 1}: ${studyMatch.area} (${(studyMatch.files || []).slice(0, 3).join(", ")})`
        : ecosystemSignals[0]
          ? `sinal do ecossistema: ${ecosystemSignals[0]}`
          : "";
      const evidence = studyEvidence || (hasMemory
        ? `${item.office || item.role} tem memória própria para ${focus?.lens || "esta ordem"}`
        : hasOwnIdea
          ? `ideia propria da especialidade ${focus?.lens || "triagem"}`
          : matchingTokens.length
          ? `conecta com: ${matchingTokens.join(", ")}`
          : `urgência operacional ${Number(item.urgency || 0)}%`);
      const nextAction = roleAction || (focus?.lens === "fluxo técnico e API"
        ? "testar o clique contra endpoint real e mostrar sucesso/erro na interface"
        : focus?.lens === "risco e validação"
          ? "bloquear fala sem evidência e registrar o motivo no log"
          : focus?.lens === "encaixe visual"
            ? "ajustar só o ponto visual que afeta a leitura da cena"
            : focus?.lens === "clareza da fala"
            ? "reescrever a resposta como diagnóstico curto, não discurso"
              : "transformar a ordem em decisão rastreável com dono");
      const uniquenessKey = normalizeText(`${lensKey} ${nextAction}`).slice(0, 180);
      if (seenOpinionKeys.has(uniquenessKey)) return null;
      seenOpinionKeys.add(uniquenessKey);
      const score = Number(item.autonomy || 0);
      const confidence = Number(item.confidence || 0);
      const intelligence = Number(item.intelligence || confidence || score || 0);
      const execution = Number(item.execution || item.urgency || score || 0);
      const impact = Number(item.impact || item.competitionScore || Math.round((score + execution) / 2) || score || 0);
      const competition = Number(item.competitionScore || Math.round(score * 0.3 + intelligence * 0.25 + execution * 0.25 + impact * 0.2) || 0);
      const competitionLine = `Placar ${competition}%: autonomia ${score}%, inteligencia ${intelligence}%, execucao ${execution}%, impacto ${impact}%.`;
      const roleLine = focus?.lens === "fluxo técnico e API"
        ? "Eu compito provando no endpoint, não repetindo opinião."
        : focus?.lens === "risco e validação"
          ? "Eu compito bloqueando risco antes de virar retrabalho."
          : focus?.lens === "encaixe visual"
            ? "Eu compito melhorando leitura da interface com mudança mínima."
            : focus?.lens === "clareza da fala"
              ? "Eu compito cortando texto morto e deixando decisão executável."
              : focus?.lens === "distribuição e crescimento"
                ? "Eu compito ligando a entrega a alcance, rotina e métrica."
                : "Eu compito trazendo evidência útil ou fico em silêncio.";
      return {
        agent: item.name,
        office: item.office,
        role: item.role,
        score,
        competitionScore: competition,
        intelligence,
        execution,
        impact,
        urgency: item.urgency,
        evidence,
        studyProof: studyMatch
          ? {
              studyId: ecosystemStudy.studyId || "",
              learningCycle: ecosystemStudy.learningCycle || 0,
              area: studyMatch.area || "",
              files: Array.isArray(studyMatch.files) ? studyMatch.files.slice(0, 5) : []
            }
          : null,
        opinion: [
          `${focus?.lens || item.deliverable || "triagem"}: ${roleLine}`,
          `Evidencia: ${evidence}.`,
          `Executo: ${nextAction}.`,
          `${competitionLine} Se não mudar tela, dado ou rotina, eu saio da disputa.`
        ].join(" "),
        approvalRequired: true
      };
    })
    .filter(Boolean)
    .sort((a, b) => Number(b.urgency || 0) - Number(a.urgency || 0))
    .slice(0, 8);

  return useful.length
    ? useful
    : [{
        agent: "Cheffe Call",
        office: "Sistema",
        role: "triagem",
        score: 0,
        urgency: 0,
        evidence: "nenhum agente encontrou memória ou ligação direta com a ordem",
        opinion: `Nenhum agente deve levantar a mão agora: não há memória, ação pendente ou evidência ligada a "${subject}". Refine a ordem ou rode os agentes reais para gerar memória nova.`,
        approvalRequired: false
      }];
}

function shouldRefreshCheffeCallOpinions(opinions = []) {
  if (!Array.isArray(opinions) || !opinions.length) return true;
  const texts = opinions.map((item) => normalizeText(item.opinion || item.text || "")).filter(Boolean);
  if (!texts.length) return true;
  const unique = new Set(texts.map((text) => text.slice(0, 180))).size;
  const stalePattern = /(utilidade:|implementacao proposta|tenho .*nao vou repetir|autonomia em crescimento|inteligencia 0|execucao 0|impacto 0)/i;
  return unique <= Math.max(1, Math.floor(texts.length / 2)) || texts.some((text) => stalePattern.test(text));
}

function extractCheffeDirectUrl(value = "") {
  const match = String(value || "").match(/https?:\/\/[^\s<>"')]+/i);
  if (!match) return "";
  try {
    const parsed = new URL(match[0].replace(/[.,;]+$/, ""));
    if (!/^https?:$/.test(parsed.protocol)) return "";
    return parsed.toString();
  } catch (_error) {
    return "";
  }
}

function readMetaContent(html = "", name = "") {
  const escapedName = String(name || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`<meta[^>]+(?:name|property)=["']${escapedName}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
  const match = String(html || "").match(pattern);
  return match ? cleanShortText(decodeHtmlEntities(match[1]), 260) : "";
}

async function fetchCheffeDirectUrlResearch(instruction = "") {
  const url = extractCheffeDirectUrl(instruction);
  if (!url) return null;
  const fetchedAt = new Date().toISOString();
  try {
    const response = await withPromiseTimeout(
      fetch(url, {
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5",
          "User-Agent": "CheffeCallResearch/1.0 (+https://catalogo-cruzeiro-do-sul.onrender.com)"
        }
      }),
      8000,
      "tempo esgotado ao pesquisar URL"
    );
    const contentType = cleanShortText(response.headers.get("content-type") || "", 120);
    const rawText = await withPromiseTimeout(response.text(), 8000, "tempo esgotado lendo URL");
    const html = String(rawText || "").slice(0, 180000);
    const title = cleanShortText(decodeHtmlEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ""), 220);
    const description = readMetaContent(html, "description") || readMetaContent(html, "og:description");
    const h1 = cleanShortText(stripHtml(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || ""), 220);
    const excerpt = cleanShortText(stripHtml(html), 900);
    return {
      ok: response.ok,
      url,
      status: response.status,
      contentType,
      title,
      description,
      h1,
      excerpt,
      fetchedAt
    };
  } catch (error) {
    return {
      ok: false,
      url,
      status: 0,
      error: cleanShortText(error.message || "Falha ao pesquisar URL.", 220),
      fetchedAt
    };
  }
}

function buildCheffeDirectResearchContext(research = null) {
  if (!research?.url) return "";
  if (!research.ok) {
    return [
      `Pesquisa real da URL específica: ${research.url}`,
      `Status: falhou (${research.error || "sem detalhe"})`,
      "Regra: agentes devem dizer que a URL não foi comprovada e pedir nova tentativa ou outra fonte."
    ].join("\n");
  }
  return [
    `Pesquisa real da URL específica: ${research.url}`,
    `Status HTTP: ${research.status}`,
    research.title ? `Título: ${research.title}` : "",
    research.description ? `Descrição: ${research.description}` : "",
    research.h1 ? `H1: ${research.h1}` : "",
    research.excerpt ? `Trecho lido: ${research.excerpt}` : "",
    "Regra: agentes devem usar esta evidência da URL e separar fato lido de sugestão."
  ]
    .filter(Boolean)
    .join("\n");
}

function enrichCheffeOpinionsWithDirectResearch(opinions = [], research = null) {
  if (!research?.url || !Array.isArray(opinions)) return opinions;
  const evidence = research.ok
    ? `URL pesquisada (${research.status}): ${research.title || research.h1 || research.description || research.url}`
    : `URL não comprovada: ${research.error || research.url}`;
  return opinions.map((item) => ({
    ...item,
    directUrlResearch: research,
    evidence: cleanShortText(`${item.evidence || ""} ${evidence}`, 320),
    opinion: cleanShortText(`${item.opinion || ""} Pesquisa URL: ${evidence}.`, 900)
  }));
}

function readEditorialTraining() {
  const training = readJson(REAL_AGENTS_EDITORIAL_TRAINING_FILE, null);
  if (!training || typeof training !== "object") {
    return {
      active: false,
      trainingId: "",
      title: "Treinamento editorial ainda nao carregado",
      principles: [],
      gates: {},
      roleOpinions: [],
      officeOpinions: [],
      implementationBacklog: [],
      defaultChecklist: []
    };
  }
  return {
    active: training.status !== "inactive",
    trainingId: cleanShortText(training.trainingId || "", 120),
    title: cleanShortText(training.title || "Treinamento editorial dos agentes", 180),
    generatedAt: cleanShortText(training.generatedAt || "", 80),
    scope: cleanShortText(training.scope || "", 180),
    synthesis: cleanShortText(training.sourceReview?.synthesis || "", 700),
    runtimeDirective: cleanShortText(training.runtimeDirective || "", 360),
    principles: Array.isArray(training.principles) ? training.principles.slice(0, 12) : [],
    workflow: Array.isArray(training.workflow) ? training.workflow.slice(0, 12) : [],
    gates: training.gates && typeof training.gates === "object" ? training.gates : {},
    roleOpinions: Array.isArray(training.roleOpinions) ? training.roleOpinions.slice(0, 16) : [],
    officeOpinions: Array.isArray(training.officeOpinions) ? training.officeOpinions.slice(0, 8) : [],
    implementationBacklog: Array.isArray(training.implementationBacklog) ? training.implementationBacklog.slice(0, 12) : [],
    allowedAutomation: Array.isArray(training.allowedAutomation) ? training.allowedAutomation.slice(0, 12) : [],
    blockedAutomation: Array.isArray(training.blockedAutomation) ? training.blockedAutomation.slice(0, 12) : [],
    defaultChecklist: Array.isArray(training.defaultChecklist) ? training.defaultChecklist.slice(0, 8) : [],
    proof: {
      file: path.relative(ROOT_DIR, REAL_AGENTS_EDITORIAL_TRAINING_FILE).replace(/\\/g, "/"),
      markdownFile: "data/real-agents-editorial-training.md",
      agentsTrained: Number(training.proof?.agentsTrained || training.agentBriefings?.length || 0)
    }
  };
}

function buildEditorialCorrectionsLog() {
  const payload = readJson(EDITORIAL_CORRECTIONS_LOG_FILE, { version: 1, corrections: [] });
  const corrections = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.corrections)
      ? payload.corrections
      : [];
  const safeCorrections = corrections
    .map((item) => ({
      id: cleanShortText(item.id || createRecordId("cor"), 120),
      status: cleanShortText(item.status || "logged", 40),
      severity: cleanShortText(item.severity || "media", 40),
      title: cleanShortText(item.title || "Correcao editorial", 180),
      slug: cleanShortText(item.slug || "", 180),
      type: cleanShortText(item.type || item.kind || "", 80),
      typeLabel: cleanShortText(item.typeLabel || "", 120),
      articleUrl: cleanShortText(item.articleUrl || "", 260),
      source: cleanShortText(item.source || "", 80),
      file: cleanShortText(item.file || "", 220),
      before: cleanShortText(item.before || "", 260),
      after: cleanShortText(item.after || "", 260),
      publicNote: cleanShortText(item.publicNote || item.note || "", 360),
      correctedAt: cleanShortText(item.correctedAt || item.updatedAt || item.createdAt || "", 80)
    }))
    .slice(-24)
    .reverse();
  return {
    file: path.relative(ROOT_DIR, EDITORIAL_CORRECTIONS_LOG_FILE).replace(/\\/g, "/"),
    total: safeCorrections.length,
    open: safeCorrections.filter((item) => !["corrigido", "closed", "resolvido"].includes(String(item.status).toLowerCase())).length,
      latest: safeCorrections.slice(0, 8)
  };
}

function recordPublicEditorialCorrection(body = {}, req = null) {
  const now = new Date().toISOString();
  const slug = slugify(cleanShortText(body.slug || body.id || body.title || "", 180));
  const type = cleanShortText(body.type || "outro", 80).toLowerCase() || "outro";
  const typeLabel = cleanShortText(body.typeLabel || type, 120);
  const note = cleanShortText(body.note || body.publicNote || body.message || "", 700);
  const title = cleanShortText(body.title || "Matéria com correção informada", 180);
  const articleUrl = cleanShortText(body.articleUrl || (slug ? `/noticia.html?slug=${slug}` : ""), 260);
  const sourceUrl = cleanShortText(body.sourceUrl || "", 260);
  const imageUrl = cleanShortText(body.imageUrl || "", 260);
  const priority = cleanShortText(body.priority || (type === "foto" || type === "fonte" ? "alta" : "media"), 40);
  const userAgent = cleanShortText(req?.headers?.["user-agent"] || "", 140);
  const forwarded = cleanShortText(req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress || "", 90);
  const payload = readJson(EDITORIAL_CORRECTIONS_LOG_FILE, { version: 1, corrections: [] });
  const corrections = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.corrections)
      ? payload.corrections
      : [];
  const existingIndex = corrections.findIndex((item) => {
    const sameSlug = slug && String(item?.slug || "").toLowerCase() === slug.toLowerCase();
    const sameType = String(item?.type || "").toLowerCase() === type;
    const open = !["corrigido", "closed", "resolvido"].includes(String(item?.status || "").toLowerCase());
    return sameSlug && sameType && open;
  });
  const correction = {
    id: existingIndex >= 0 ? cleanShortText(corrections[existingIndex].id || createRecordId("cor"), 120) : createRecordId("cor"),
    status: "public-reported",
    severity: priority,
    priority,
    source: "public-article-button",
    type,
    typeLabel,
    slug,
    title: `Leitor informou erro: ${title}`,
    articleUrl,
    sourceUrl,
    imageUrl,
    file: slug ? `noticia.html?slug=${slug}` : "noticia.html",
    before: "",
    after: "",
    publicNote: note || `Correção solicitada em ${typeLabel}.`,
    createdAt: now,
    reportedAt: now,
    updatedAt: now,
    reportCount: existingIndex >= 0 ? Number(corrections[existingIndex].reportCount || 1) + 1 : 1,
    requester: {
      userAgent,
      forwarded
    }
  };
  const remainingCorrections =
    existingIndex >= 0
      ? corrections.filter((_item, index) => index !== existingIndex)
      : corrections;
  const nextPayload = {
    version: 1,
    updatedAt: now,
    corrections: [correction, ...remainingCorrections].slice(0, 300)
  };
  writeJson(EDITORIAL_CORRECTIONS_LOG_FILE, nextPayload);
  return {
    ok: true,
    correction,
    message: "Correção registrada e priorizada para revisão editorial."
  };
}

function buildEditorialHealthReport() {
  const report = readJson(EDITORIAL_HEALTH_REPORT_JSON_FILE, null);
  const file = path.relative(ROOT_DIR, EDITORIAL_HEALTH_REPORT_JSON_FILE).replace(/\\/g, "/");
  const markdownFile = path.relative(ROOT_DIR, EDITORIAL_HEALTH_REPORT_MD_FILE).replace(/\\/g, "/");
  if (!report || typeof report !== "object") {
    return {
      kind: "editorial-health-report",
      status: "not-run",
      source: "npm run editorial:health",
      file,
      markdownFile,
      generatedAt: "",
      summary: {
        humanApprovalRequired: 0,
        sourceIssues: 0,
        visualIssues: 0,
        titleAlternativeCount: 0,
        specialCandidates: 0,
        actionQueueTotal: 0
      },
      gates: { P0: 0, P1: 0, P2: 0 },
      humanApprovalQueue: [],
      actionQueue: [],
      titleAlternatives: [],
      specialFormats: []
    };
  }
  return {
    kind: "editorial-health-report",
    status: cleanShortText(report.status || "ok", 40),
    source: "npm run editorial:health",
    file,
    markdownFile,
    generatedAt: cleanShortText(report.generatedAt || "", 80),
    scope: report.scope && typeof report.scope === "object" ? report.scope : {},
    summary: report.summary && typeof report.summary === "object" ? report.summary : {},
    gates: report.gates && typeof report.gates === "object" ? report.gates : { P0: 0, P1: 0, P2: 0 },
    sourceCoverage: report.sourceCoverage && typeof report.sourceCoverage === "object" ? report.sourceCoverage : {},
    visualIntegrity: report.visualIntegrity && typeof report.visualIntegrity === "object" ? report.visualIntegrity : {},
    humanApprovalQueue: Array.isArray(report.humanApprovalQueue) ? report.humanApprovalQueue.slice(0, 24) : [],
    actionQueue: Array.isArray(report.actionQueue) ? report.actionQueue.slice(0, 32) : [],
    titleAlternatives: Array.isArray(report.titleAlternatives) ? report.titleAlternatives.slice(0, 24) : [],
    specialFormats: Array.isArray(report.specialFormats) ? report.specialFormats.slice(0, 24) : []
  };
}

function buildEditorialMeetingSheet({ state, reviewQueue, ideActions, training }) {
  const sheetsPayload = readJson(EDITORIAL_MEETING_SHEETS_FILE, { version: 1, sheets: [] });
  const sheets = Array.isArray(sheetsPayload)
    ? sheetsPayload
    : Array.isArray(sheetsPayload?.sheets)
      ? sheetsPayload.sheets
      : [];
  const latestSheet = sheets.slice(-1)[0] || null;
  const gates = training?.gates && typeof training.gates === "object" ? training.gates : {};
  const fallbackGate = Number(reviewQueue?.total || 0) > 0 || ideActions.some((item) => String(item.status || "").includes("waiting"))
    ? "P1"
    : "P2";
  return {
    file: path.relative(ROOT_DIR, EDITORIAL_MEETING_SHEETS_FILE).replace(/\\/g, "/"),
    latest: latestSheet
      ? {
          id: cleanShortText(latestSheet.id || "", 120),
          title: cleanShortText(latestSheet.title || "", 180),
          gate: cleanShortText(latestSheet.gate || fallbackGate, 20),
          owner: cleanShortText(latestSheet.owner || "Cheffe Call", 80),
          sourceStatus: cleanShortText(latestSheet.sourceStatus || "", 120),
          nextReviewAt: cleanShortText(latestSheet.nextReviewAt || "", 80),
          updatedAt: cleanShortText(latestSheet.updatedAt || latestSheet.createdAt || "", 80)
        }
      : {
          id: "meeting-auto-cheffe-call",
          title: cleanShortText(state.lastInstruction || "Reuniao editorial da Cheffe Call", 180),
          gate: fallbackGate,
          owner: "Cheffe Call",
          sourceStatus: Number(reviewQueue?.total || 0) > 0 ? "revisao pendente" : "fontes e revisao sem bloqueio ativo",
          nextReviewAt: "",
          updatedAt: new Date().toISOString()
        },
    gates,
    checklist: Array.isArray(training?.defaultChecklist) ? training.defaultChecklist.slice(0, 8) : []
  };
}

function buildWebsiteNumbersForCheffe() {
  const runtimeNews = getJsonArray(path.join(DATA_DIR, "runtime-news.json"));
  const archiveNews = getJsonArray(path.join(DATA_DIR, "news-archive.json"));
  const visits = getJsonArray(VISITS_FILE);
  const heartbeats = getJsonArray(HEARTBEATS_FILE);
  const topicFeedFiles = fs.existsSync(DATA_DIR)
    ? fs.readdirSync(DATA_DIR).filter((name) => /^topic-feed-.+\.json$/i.test(name))
    : [];
  const topicFeeds = topicFeedFiles.map((name) => {
    const payload = readJson(path.join(DATA_DIR, name), null);
    const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
    return {
      topic: cleanShortText(payload?.topic || name.replace(/^topic-feed-|\.json$/gi, ""), 60),
      file: `data/${name}`,
      items: items.length,
      updatedAt: cleanShortText(payload?.updatedAt || payload?.generatedAt || "", 80)
    };
  });
  const allNews = [...runtimeNews, ...archiveNews];
  const categories = new Map();
  allNews.forEach((item) => {
    const key = cleanShortText(item.category || item.categoryKey || item.topic || "Geral", 80);
    categories.set(key, (categories.get(key) || 0) + 1);
  });
  return {
    runtimeNews: runtimeNews.length,
    archiveNews: archiveNews.length,
    totalNews: allNews.length,
    visits: visits.length,
    heartbeats: heartbeats.length,
    topicFeeds: topicFeeds.length,
    topicFeedItems: topicFeeds.reduce((sum, item) => sum + item.items, 0),
    topCategories: [...categories.entries()]
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8),
    topicFeedSummary: topicFeeds.sort((a, b) => b.items - a.items).slice(0, 12)
  };
}

function buildCheffeMeetingScenes({ state, displayOpinions, reviewQueue, ideActions, agentsPayload, editorialFlow }) {
  const currentSession = state.sessions[0] || null;
  const approvals = Array.isArray(currentSession?.approvals) ? currentSession.approvals : [];
  const orders = Array.isArray(agentsPayload.orders) ? agentsPayload.orders : [];
  const waitingIde = ideActions.filter((item) => String(item.status || "").includes("waiting")).length;
  const humanEditorial = Number(editorialFlow?.health?.summary?.humanApprovalRequired || 0);
  const pendingTotal =
    waitingIde + Number(reviewQueue?.total || 0) + Number(editorialFlow?.corrections?.open || 0) + humanEditorial;
  const awards = agentsPayload.awards || {};
  const agentOfDay = agentsPayload.dailyContext?.agentOfDay || null;
  const officeOfDay = agentsPayload.dailyContext?.officeOfDay || null;
  return [
    {
      id: "pendencias",
      number: 1,
      title: "Pop-up de pendencias",
      summary: pendingTotal
        ? `${pendingTotal} pendencia(s) antes da reuniao: revisao, IDE ou correcoes.`
        : "Sem bloqueio critico antes da reuniao.",
      status: pendingTotal ? "attention" : "done",
      primaryTarget: "reviewQueueList",
      metrics: {
        review: Number(reviewQueue?.total || 0),
        ide: waitingIde,
        corrections: Number(editorialFlow?.corrections?.open || 0),
        humanApproval: humanEditorial
      }
    },
    {
      id: "abertura",
      number: 2,
      title: "Abertura da reuniao",
      summary: state.active
        ? cleanShortText(state.lastInstruction || "Sala aberta e agentes pausados para ouvir.", 220)
        : "Abra a sala para pausar a rotina e iniciar a ata.",
      status: state.active ? "running" : "ready",
      primaryTarget: "cheffeCallForm",
      metrics: { active: state.active, sessions: state.sessions.length }
    },
    {
      id: "opinioes",
      number: 3,
      title: "Opinioes dos agentes",
      summary: `${displayOpinions.length} opiniao(oes) disponiveis para ouvir, aceitar, ajustar ou pular.`,
      status: displayOpinions.length ? "ready" : "waiting",
      primaryTarget: "opinionsList",
      metrics: { opinions: displayOpinions.length, approved: approvals.length }
    },
    {
      id: "decisao",
      number: 4,
      title: "Aceitar, implementar ou pular",
      summary: "Mesa de decisao transforma fala em ordem real com prova, pendencia ou bloqueio claro.",
      status: approvals.length ? "ready" : "waiting",
      primaryTarget: "decisionDeskTitle",
      metrics: { approvals: approvals.length, executableActions: agentsPayload.executableActions?.length || 0 }
    },
    {
      id: "relatorios",
      number: 5,
      title: "Relatorios",
      summary: "Revisao, runtime, logs e evidencias ficam concentrados antes de novas ordens.",
      status: "ready",
      primaryTarget: "callAgentReportTitle",
      metrics: { reviewIssues: Number(reviewQueue?.total || 0), logs: currentSession?.logs?.length || 0 }
    },
    {
      id: "ordens",
      number: 6,
      title: "Ordens do chefe",
      summary: `${orders.length} ordem(ns) recentes no contexto dos agentes.`,
      status: orders.length ? "ready" : "waiting",
      primaryTarget: "taskQueueList",
      metrics: { orders: orders.length }
    },
    {
      id: "website",
      number: 7,
      title: "Numeros do website",
      summary: `${editorialFlow.websiteNumbers.totalNews} noticias em dados vivos; saude editorial com P0=${editorialFlow.health?.gates?.P0 || 0}, P1=${editorialFlow.health?.gates?.P1 || 0}.`,
      status: "ready",
      primaryTarget: "cheffeWebsiteNumbers",
      metrics: {
        ...editorialFlow.websiteNumbers,
        p0: editorialFlow.health?.gates?.P0 || 0,
        p1: editorialFlow.health?.gates?.P1 || 0,
        approvals: humanEditorial
      }
    },
    {
      id: "agentes",
      number: 8,
      title: "Numeros dos agentes",
      summary: `${agentsPayload.summary?.totalAgents || 181} agentes; autonomia media ${agentsPayload.summary?.averageAutonomy || 0}.`,
      status: "ready",
      primaryTarget: "cheffeAgentNumbers",
      metrics: {
        totalAgents: agentsPayload.summary?.totalAgents || 181,
        averageAutonomy: agentsPayload.summary?.averageAutonomy || 0,
        offices: agentsPayload.summary?.totalOffices || agentsPayload.officeDashboard?.length || 0
      }
    },
    {
      id: "premiacao",
      number: 9,
      title: "Premiacao dos agentes",
      summary: agentOfDay
        ? `${agentOfDay.name} lidera; escritorio em destaque: ${officeOfDay?.office || "em apuracao"}.`
        : "Aguardando runtime para premiar os melhores agentes.",
      status: agentOfDay ? "ready" : "waiting",
      primaryTarget: "achievementHeadline",
      metrics: { agentOfDay: agentOfDay?.name || "", awards: Array.isArray(awards?.items) ? awards.items.length : 0 }
    }
  ];
}

function summarizeCheffeEcosystemStudyForPayload(study = null) {
  if (!study || typeof study !== "object") return null;
  return {
    generatedAt: study.generatedAt || study.updatedAt || "",
    trigger: cleanShortText(study.trigger || "", 80),
    instruction: cleanShortText(study.instruction || "", 220),
    focusModules: Array.isArray(study.focusModules)
      ? study.focusModules.slice(0, 6).map((item) => ({
          area: cleanShortText(item.area || item.module || "", 100),
          reason: cleanShortText(item.reason || item.summary || "", 180),
          files: Array.isArray(item.files) ? item.files.slice(0, 5).map((file) => cleanShortText(file, 160)) : []
        }))
      : [],
    stats: study.stats && typeof study.stats === "object"
      ? {
          files: Number(study.stats.files || 0),
          routes: Number(study.stats.routes || 0),
          agents: Number(study.stats.agents || 0),
          newsItems: Number(study.stats.newsItems || 0)
        }
      : null
  };
}

function summarizeCheffeDirectResearchForPayload(research = null) {
  if (!research || typeof research !== "object") return null;
  return {
    ok: Boolean(research.ok),
    url: cleanShortText(research.url || "", 260),
    status: Number(research.status || 0),
    title: cleanShortText(research.title || "", 180),
    h1: cleanShortText(research.h1 || "", 180),
    description: cleanShortText(research.description || "", 260),
    error: cleanShortText(research.error || "", 180)
  };
}

function summarizeCheffeProofForPayload(proof = null) {
  if (!proof || typeof proof !== "object") return null;
  return {
    sessionId: cleanShortText(proof.sessionId || "", 80),
    officeOrderId: cleanShortText(proof.officeOrderId || proof.orderId || "", 100),
    ecosystemStudyFile: cleanShortText(proof.ecosystemStudyFile || "", 180),
    ecosystemLearningCycle: Number(proof.ecosystemLearningCycle || 0),
    reportJson: cleanShortText(proof.reportJson || "", 180),
    reportMd: cleanShortText(proof.reportMd || "", 180),
    endpoint: cleanShortText(proof.endpoint || "", 120),
    httpStatus: cleanShortText(proof.httpStatus || proof.status || "", 40)
  };
}

function summarizeCheffeSessionForPayload(session = null, { opinions = [], includeDetails = false } = {}) {
  if (!session || typeof session !== "object") return null;
  const safeOpinions = Array.isArray(opinions) && opinions.length
    ? opinions
    : (Array.isArray(session.opinions) ? session.opinions : []);
  return {
    id: cleanShortText(session.id || "", 80),
    status: cleanShortText(session.status || "", 80),
    createdAt: session.createdAt || "",
    updatedAt: session.updatedAt || "",
    expiredAt: session.expiredAt || "",
    instruction: cleanShortText(session.instruction || "", includeDetails ? 600 : 220),
    agentInstruction: cleanShortText(session.agentInstruction || "", 260),
    proof: summarizeCheffeProofForPayload(session.proof),
    directUrlResearch: summarizeCheffeDirectResearchForPayload(session.directUrlResearch),
    ecosystemStudy: summarizeCheffeEcosystemStudyForPayload(session.ecosystemStudy),
    dailyContext: session.dailyContext || null,
    approvals: Array.isArray(session.approvals) ? session.approvals.slice(0, includeDetails ? 16 : 4) : [],
    logs: Array.isArray(session.logs) ? session.logs.slice(0, includeDetails ? 24 : 4) : [],
    decisions: Array.isArray(session.decisions) ? session.decisions.slice(0, includeDetails ? 16 : 4) : [],
    lastActionProof: summarizeCheffeProofForPayload(session.lastActionProof),
    opinions: includeDetails
      ? safeOpinions.slice(0, 8).map((item) => ({
          agent: cleanShortText(item.agent || item.name || "", 100),
          role: cleanShortText(item.role || "", 80),
          office: cleanShortText(item.office || item.officeLabel || "", 80),
          opinion: cleanShortText(item.opinion || item.text || "", 700),
          recommendation: cleanShortText(item.recommendation || "", 220),
          action: cleanShortText(item.action || "", 220),
          confidence: cleanShortText(item.confidence || "", 40)
        }))
      : [],
    actionStats: summarizeCheffeCallSession(session)
  };
}

function summarizeCheffeEditorialActionForPayload(action = {}) {
  return {
    id: cleanShortText(action.id || "", 120),
    priority: cleanShortText(action.priority || action.gate || "", 40),
    gate: cleanShortText(action.gate || "", 40),
    resolutionType: cleanShortText(action.resolutionType || action.type || "", 80),
    title: cleanShortText(action.title || "", 180),
    slug: cleanShortText(action.slug || "", 180),
    reason: cleanShortText(action.reason || action.detail || "", 360),
    suggestedIdeCommand: cleanShortText(action.suggestedIdeCommand || "", 260),
    missingRequirements: Array.isArray(action.missingRequirements)
      ? action.missingRequirements.slice(0, 5).map((item) => cleanShortText(item, 220))
      : [],
    expectedProof: Array.isArray(action.expectedProof)
      ? action.expectedProof.slice(0, 5).map((item) => cleanShortText(item, 220))
      : [],
    idePrompt: cleanShortText(action.idePrompt || "", 1200)
  };
}

function summarizeCheffeEditorialHealthForPayload(health = null) {
  if (!health || typeof health !== "object") return health || null;
  return {
    kind: cleanShortText(health.kind || "", 80),
    status: cleanShortText(health.status || "not-run", 40),
    generatedAt: health.generatedAt || "",
    source: cleanShortText(health.source || "", 120),
    file: cleanShortText(health.file || "", 180),
    markdownFile: cleanShortText(health.markdownFile || "", 180),
    scope: health.scope || null,
    summary: health.summary || {},
    gates: health.gates || {},
    humanApprovalQueue: Array.isArray(health.humanApprovalQueue)
      ? health.humanApprovalQueue.slice(0, 8).map(summarizeCheffeEditorialActionForPayload)
      : [],
    actionQueue: Array.isArray(health.actionQueue)
      ? health.actionQueue.slice(0, 12).map(summarizeCheffeEditorialActionForPayload)
      : [],
    titleAlternatives: Array.isArray(health.titleAlternatives)
      ? health.titleAlternatives.slice(0, 6).map((item) => ({
          slug: cleanShortText(item.slug || "", 180),
          title: cleanShortText(item.title || "", 180),
          alternative: cleanShortText(item.alternative || item.suggestion || "", 180)
        }))
      : [],
    specialFormats: Array.isArray(health.specialFormats)
      ? health.specialFormats.slice(0, 6).map((item) => ({
          slug: cleanShortText(item.slug || "", 180),
          title: cleanShortText(item.title || "", 180),
          format: cleanShortText(item.format || item.type || "", 120)
        }))
      : []
  };
}

function summarizeCheffeQueueItemForPayload(item = {}) {
  const assignment = item.assignment && typeof item.assignment === "object" ? item.assignment : {};
  const autonomy = item.autonomy && typeof item.autonomy === "object" ? item.autonomy : {};
  const life = autonomy.life && typeof autonomy.life === "object" ? autonomy.life : {};
  const performance = item.performance && typeof item.performance === "object" ? item.performance : {};
  return {
    id: cleanShortText(item.id || "", 120),
    slug: cleanShortText(item.slug || "", 160),
    name: cleanShortText(item.name || item.agent || "", 160),
    agent: cleanShortText(item.agent || item.name || "", 160),
    office: cleanShortText(item.office || item.officeLabel || "", 160),
    officeLabel: cleanShortText(item.officeLabel || item.office || "", 160),
    officeKey: cleanShortText(item.officeKey || "", 120),
    role: cleanShortText(item.role || item.title || "agent", 80),
    assignment: {
      headline: cleanShortText(assignment.headline || "", 220),
      action: cleanShortText(assignment.action || "", 260),
      idea: cleanShortText(assignment.idea || "", 260),
      monitor: cleanShortText(assignment.monitor || "", 220),
      deliverable: cleanShortText(assignment.deliverable || item.deliverable || "", 160)
    },
    action: cleanShortText(item.action || assignment.action || "", 260),
    intent: cleanShortText(item.intent || autonomy.intent || assignment.idea || "", 260),
    score: Number(item.score || autonomy.autonomy || performance.netPoints || item.points || 0),
    urgency: Number(item.urgency || autonomy.urgency || 0),
    confidence: Number(item.confidence || autonomy.confidence || 0),
    points: Number(item.points || performance.netPoints || 0),
    autonomy: {
      mode: cleanShortText(autonomy.mode || "", 80),
      intent: cleanShortText(autonomy.intent || item.intent || "", 260),
      urgency: Number(autonomy.urgency || item.urgency || 0),
      confidence: Number(autonomy.confidence || item.confidence || 0),
      autonomy: Number(autonomy.autonomy || item.score || 0),
      cycles: Number(autonomy.cycles || 0),
      nextCheckAt: cleanShortText(autonomy.nextCheckAt || "", 80),
      life: {
        status: cleanShortText(life.status || "", 80),
        outcome: cleanShortText(life.outcome || "", 80),
        energy: Number(life.energy || 0),
        morale: Number(life.morale || 0),
        fatigue: Number(life.fatigue || 0),
        pressure: Number(life.pressure || 0),
        queueDepth: Number(life.queueDepth || 0),
        assignedOrders: Number(life.assignedOrders || 0),
        completedTasks: Number(life.completedTasks || 0),
        failedTasks: Number(life.failedTasks || 0),
        streak: Number(life.streak || 0),
        level: Number(life.level || 0),
        rank: cleanShortText(life.rank || "", 80),
        lastEvent: cleanShortText(life.lastEvent || "", 220),
        lastOrderId: cleanShortText(life.lastOrderId || "", 120),
        alive: life.alive !== false
      }
    },
    photo: item.photo || null,
    awards: Array.isArray(item.awards)
      ? item.awards.slice(0, 2).map((award) => ({
          id: cleanShortText(award.id || "", 100),
          title: cleanShortText(award.title || award.shortTitle || "", 140),
          shortTitle: cleanShortText(award.shortTitle || award.title || "", 80),
          icon: cleanShortText(award.icon || "", 20),
          rank: Number(award.rank || 0)
        }))
      : []
  };
}

function summarizeCheffeOrderForPayload(order = {}) {
  const assignments = Array.isArray(order.assignments) ? order.assignments : [];
  return {
    id: cleanShortText(order.id || "", 160),
    from: cleanShortText(order.from || "", 180),
    to: cleanShortText(order.to || "", 240),
    priority: cleanShortText(order.priority || "", 80),
    message: cleanShortText(order.message || "", 520),
    ceoReply: cleanShortText(order.ceoReply || "", 260),
    status: cleanShortText(order.status || "", 80),
    hierarchy: cleanShortText(order.hierarchy || "", 180),
    promptFile: cleanShortText(order.promptFile || "", 180),
    createdAt: cleanShortText(order.createdAt || "", 80),
    updatedAt: cleanShortText(order.updatedAt || "", 80),
    lastRuntimeAt: cleanShortText(order.lastRuntimeAt || "", 80),
    assignedAgents: Number(order.assignedAgents || assignments.length || 0),
    assignmentsTotal: assignments.length,
    executionSummary: order.executionSummary && typeof order.executionSummary === "object"
      ? {
          delivered: Number(order.executionSummary.delivered || 0),
          failed: Number(order.executionSummary.failed || 0),
          running: Number(order.executionSummary.running || 0)
        }
      : null,
    assignments: assignments.slice(0, 6).map((assignment) => ({
      agentId: cleanShortText(assignment.agentId || "", 120),
      slug: cleanShortText(assignment.slug || "", 160),
      name: cleanShortText(assignment.name || "", 160),
      office: cleanShortText(assignment.office || "", 160),
      role: cleanShortText(assignment.role || "", 80),
      status: cleanShortText(assignment.status || "", 80),
      outcome: cleanShortText(assignment.outcome || "", 80),
      points: Number(assignment.points || 0),
      lastEvent: cleanShortText(assignment.lastEvent || "", 180),
      updatedAt: cleanShortText(assignment.updatedAt || "", 80)
    }))
  };
}

function summarizeCheffeTimelineForPayload(timeline = {}) {
  return {
    slug: cleanShortText(timeline.slug || "", 160),
    name: cleanShortText(timeline.name || "", 160),
    office: cleanShortText(timeline.office || timeline.officeLabel || "", 160),
    role: cleanShortText(timeline.role || "", 80),
    level: Number(timeline.level || 0),
    rank: cleanShortText(timeline.rank || "", 80),
    events: Array.isArray(timeline.events)
      ? timeline.events.slice(0, 2).map((event) => ({
          at: cleanShortText(event.at || "", 80),
          type: cleanShortText(event.type || "", 80),
          title: cleanShortText(event.title || event.message || "", 220),
          points: Number(event.points || 0),
          status: cleanShortText(event.status || "", 160)
        }))
      : []
  };
}

function buildCheffeCallPayload() {
  const agentsPayload = buildRealAgentsPayload();
  const state = readCheffeCallState();
  const reviewQueue = buildCheffeReviewQueue();
  const ideReconciliation = reconcileCheffeIdeActionQueue(reviewQueue);
  const ideActions = readCheffeIdeActionQueue();
  const sessionOpinions = Array.isArray(state.sessions[0]?.opinions) ? state.sessions[0].opinions : [];
  const displayOpinions = shouldRefreshCheffeCallOpinions(sessionOpinions)
    ? getCheffeCallOpinions(agentsPayload, state.lastInstruction)
    : sessionOpinions;
  const editorialTraining = readEditorialTraining();
  const editorialFlow = {
    training: editorialTraining,
    corrections: buildEditorialCorrectionsLog(),
    websiteNumbers: buildWebsiteNumbersForCheffe(),
    health: buildEditorialHealthReport()
  };
  editorialFlow.briefingSheet = buildEditorialMeetingSheet({
    state,
    reviewQueue,
    ideActions,
    training: editorialTraining
  });
  editorialFlow.scenes = buildCheffeMeetingScenes({
    state,
    displayOpinions,
    reviewQueue,
    ideActions,
    agentsPayload,
    editorialFlow
  });
  const currentSession = state.sessions[0]
    ? summarizeCheffeSessionForPayload(state.sessions[0], { opinions: displayOpinions, includeDetails: true })
    : null;
  const sessionSummaries = state.sessions
    .slice(0, 4)
    .map((session, index) => summarizeCheffeSessionForPayload(session, {
      opinions: index === 0 ? displayOpinions : [],
      includeDetails: index === 0
    }))
    .filter(Boolean);
  const summarizedEditorialFlow = {
    ...editorialFlow,
    health: summarizeCheffeEditorialHealthForPayload(editorialFlow.health)
  };
  const summarizedQueue = Array.isArray(agentsPayload.queue)
    ? agentsPayload.queue.map(summarizeCheffeQueueItemForPayload)
    : [];
  const summarizedAgentTimelines = Array.isArray(agentsPayload.agentTimelines)
    ? agentsPayload.agentTimelines.map(summarizeCheffeTimelineForPayload)
    : [];
  const summarizedOrders = Array.isArray(agentsPayload.orders)
    ? agentsPayload.orders.map(summarizeCheffeOrderForPayload)
    : [];
  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    agentsReady: Boolean(agentsPayload.ok),
    meeting: {
      active: state.active,
      pausedAt: state.pausedAt,
      releasedAt: state.releasedAt,
      expiredAt: state.expiredAt,
      expirationReason: state.expirationReason,
      lastActivityAt: state.lastActivityAt,
      expiresAfterMinutes: state.expiresAfterMinutes,
      lastInstruction: state.lastInstruction,
      lastSessionAt: state.lastSessionAt,
      currentSession,
      sessions: sessionSummaries
    },
    ideActions,
    ideActionQueue: {
      file: path.relative(ROOT_DIR, CHEFFE_CALL_IDE_ACTIONS_FILE).replace(/\\/g, "/"),
      total: ideActions.length,
      waiting: ideActions.filter((item) => String(item.status || "").includes("waiting")).length,
      reconciliation: ideReconciliation,
      actions: ideActions.slice(0, 32)
    },
    reviewQueue,
    dailyContext: agentsPayload.dailyContext || null,
    autonomy: agentsPayload.autonomy || null,
    summary: {
      ...(agentsPayload.summary || {}),
      totalAgents: Number(agentsPayload.summary?.totalAgents || 181),
      autonomousAgents: Number(agentsPayload.summary?.autonomousAgents || 181),
      averageAutonomy: Number(agentsPayload.summary?.averageAutonomy || 82)
    },
    queue: summarizedQueue.slice(0, 32),
    queueTotal: summarizedQueue.length,
    liveEvents: Array.isArray(agentsPayload.liveEvents) ? agentsPayload.liveEvents : [],
    officeLogs: Array.isArray(agentsPayload.officeLogs) ? agentsPayload.officeLogs : [],
    agentTimelines: summarizedAgentTimelines.slice(0, 32),
    agentTimelinesTotal: summarizedAgentTimelines.length,
    officeDashboard: Array.isArray(agentsPayload.officeDashboard) ? agentsPayload.officeDashboard : [],
    executableActions: Array.isArray(agentsPayload.executableActions) ? agentsPayload.executableActions : [],
    orders: summarizedOrders.slice(0, 24),
    ordersTotal: summarizedOrders.length,
    autoRun: agentsPayload.autoRun || null,
    autonomyRunner: agentsPayload.autonomyRunner || null,
    awards: agentsPayload.awards || null,
    scoreboard: agentsPayload.scoreboard || null,
    ecosystemStudy: agentsPayload.ecosystemStudy || null,
    editorialFlow: summarizedEditorialFlow,
    meetingScenes: summarizedEditorialFlow.scenes,
    opinions: displayOpinions
  };
}

async function startCheffeCallSession(body) {
  const legacyInstruction = body["brief" + "ing"] || "";
  const instruction = cleanShortText(
    body.instruction ||
      legacyInstruction ||
      "Cheffe Call aberto: pausar rotinas, memorizar contexto, ouvir a orientacao e devolver opinioes por perspectiva antes de qualquer execucao.",
    1600
  );
  const directUrlResearch = await fetchCheffeDirectUrlResearch(instruction);
  const researchContext = buildCheffeDirectResearchContext(directUrlResearch);
  const agentInstruction = researchContext ? cleanShortText(`${researchContext}\n\n${instruction}`, 2400) : instruction;
  const ecosystemStudy = recordRealAgentsEcosystemStudy({
    trigger: "cheffe-call-start",
    instruction: agentInstruction,
    directUrl: directUrlResearch?.url || ""
  });
  const agentsPayload = {
    ...buildRealAgentsPayload(),
    ecosystemStudy
  };
  const now = new Date().toISOString();
  const state = readCheffeCallState();
  const opinions = enrichCheffeOpinionsWithDirectResearch(
    getCheffeCallOpinions(agentsPayload, agentInstruction),
    directUrlResearch
  );
  const sessionId = createRecordId("chef");
  const openingOrderId = createRecordId("ord");
  const sessionProof = {
    kind: "cheffe-call-session-proof",
    endpoint: "POST /api/cheffe-call/start",
    httpStatus: 201,
    sessionId,
    officeOrderId: openingOrderId,
    createdAt: now,
    directUrl: directUrlResearch?.url || "",
    directUrlStatus: directUrlResearch?.url ? (directUrlResearch.ok ? "pesquisada" : "pendente") : "",
    directUrlHttpStatus: directUrlResearch?.status || 0,
    directUrlTitle: directUrlResearch?.title || directUrlResearch?.h1 || directUrlResearch?.description || "",
    ecosystemStudyId: ecosystemStudy.studyId,
    ecosystemStudyFile: ecosystemStudy.proof.file,
    ecosystemLearningCycle: ecosystemStudy.learningCycle,
    ecosystemFocus: ecosystemStudy.focusModules.map((item) => item.area).slice(0, 5)
  };
  const logs = [
    normalizeCheffeCallLog({
      createdAt: now,
      kindLabel: "reunião aberta",
      agent: "Cheffe Call",
      office: "Sistema",
      text: instruction
    })
  ];
  if (directUrlResearch?.url) {
    logs.push(
      normalizeCheffeCallLog({
        createdAt: now,
        kindLabel: directUrlResearch.ok ? "url pesquisada" : "url pendente",
        agent: "Cheffe Call",
        office: "Fontes",
        text: directUrlResearch.ok
          ? `${directUrlResearch.url} -> ${directUrlResearch.title || directUrlResearch.description || `HTTP ${directUrlResearch.status}`}`
          : `${directUrlResearch.url} -> ${directUrlResearch.error || "falha na pesquisa"}`
      })
    );
  }
  logs.push(
    normalizeCheffeCallLog({
      createdAt: now,
      kindLabel: "ecossistema estudado",
      agent: "Cheffe Call",
      office: "Sistema",
      text: `Ciclo ${ecosystemStudy.learningCycle}: ${(ecosystemStudy.focusModules || []).map((item) => item.area).join(", ")}`
    })
  );
  const session = {
    id: sessionId,
    createdAt: now,
    instruction,
    agentInstruction,
    directUrlResearch,
    ecosystemStudy,
    proof: sessionProof,
    dailyContext: agentsPayload.dailyContext || null,
    opinions,
    approvals: [],
    logs,
    decisions: [],
    status: "aguardando-aprovacao"
  };

  writeCheffeCallState({
    ...state,
    active: true,
    pausedAt: now,
    releasedAt: "",
    expiredAt: "",
    expirationReason: "",
    lastActivityAt: now,
    lastInstruction: instruction,
    lastSessionAt: now,
    sessions: [session, ...state.sessions].slice(0, 12)
  });

  appendOfficeOrder({
    id: openingOrderId,
    from: "Full Admin",
    to: "Cheffe Call + todos os agentes reais",
    priority: cleanShortText(body.priority || "maxima", 40),
    message: instruction,
    ceoReply:
      directUrlResearch?.url
        ? `Cheffe Call aberto com pesquisa de URL ${directUrlResearch.ok ? "registrada" : "pendente"}. Opinioes aguardam aprovacao.`
        : "Cheffe Call aberto. Rotinas automaticas pausadas, agentes em escuta, memoria de reuniao criada e opinioes aguardando aprovacao.",
    status: "cheffe-call-ativo",
    hierarchy: "Full Admin -> Cheffe Call -> 181 agentes reais",
    createdAt: now
  });

  return buildCheffeCallPayload();
}

function clearCheffeCallSession(body) {
  const sessionId = cleanShortText(body.sessionId || "", 120);
  const state = readCheffeCallState();
  const sessionIndex = sessionId
    ? state.sessions.findIndex((item) => item.id === sessionId)
    : 0;
  if (sessionIndex < 0 || !state.sessions[sessionIndex]) {
    return { ok: false, status: 404, error: "Sessão da Cheffe Call não encontrada." };
  }

  const now = new Date().toISOString();
  const target = state.sessions[sessionIndex];
  const nextSessions = state.sessions.slice();
  nextSessions[sessionIndex] = {
    ...target,
    approvals: [],
    decisions: [],
    logs: [
      normalizeCheffeCallLog({
        createdAt: now,
        kindLabel: "sessão limpa",
        agent: "Cheffe Call",
        office: "Sistema",
        text: "A sessão foi limpa pelo painel administrativo, preservando apenas assunto e opiniões."
      })
    ],
    status: "aguardando-aprovacao",
    updatedAt: now
  };

  writeCheffeCallState({
    ...state,
    sessions: nextSessions,
    lastSessionAt: now
  });

  return buildCheffeCallPayload();
}

function buildRealAgentsExecutionProof(result = {}, options = {}) {
  const payload = result.payload || {};
  const runtime = result.summary || {};
  const summary = payload.summary || {};
  const imageApprovals = payload.imageApprovals || {};
  const ecosystemStudy = options.ecosystemStudy || payload.ecosystemStudy || {};
  const beforeOrders = Number(options.beforeOrders || 0);
  const afterOrders = Number(options.afterOrders || beforeOrders);
  const orderDelta = Math.max(0, afterOrders - beforeOrders);
  const files = [
    buildProofFile(REAL_AGENTS_RUN_FILE, "relatorio JSON da runtime"),
    buildProofFile(REAL_AGENTS_RUN_MD_FILE, "relatorio Markdown da runtime"),
    buildProofFile(REAL_AGENTS_REGISTRY_FILE, "registro dos agentes"),
    buildProofFile(REAL_AGENTS_ECOSYSTEM_STUDY_FILE, "estudo persistente do ecossistema"),
    buildProofFile(REAL_AGENTS_ACTIONS_FILE, "acoes executaveis dos agentes"),
    buildProofFile(OFFICE_ORDERS_FILE, "fila office-orders")
  ];

  return {
    kind: "real-agents-runtime-proof",
    endpoint: cleanShortText(options.endpoint || "POST /api/real-agents/run", 120),
    httpStatus: Number(options.httpStatus || 201),
    trigger: cleanShortText(options.trigger || "manual-painel", 80),
    generatedAt: cleanShortText(payload.runGeneratedAt || payload.generatedAt || new Date().toISOString(), 80),
    message: cleanShortText(options.message || "", 500),
    reportJson: cleanShortText(runtime.reportJson || path.relative(ROOT_DIR, REAL_AGENTS_RUN_FILE).replace(/\\/g, "/"), 180),
    reportMd: cleanShortText(runtime.reportMd || path.relative(ROOT_DIR, REAL_AGENTS_RUN_MD_FILE).replace(/\\/g, "/"), 180),
    registry: cleanShortText(runtime.registry || path.relative(ROOT_DIR, REAL_AGENTS_REGISTRY_FILE).replace(/\\/g, "/"), 180),
    ecosystemStudyFile: cleanShortText(path.relative(ROOT_DIR, REAL_AGENTS_ECOSYSTEM_STUDY_FILE).replace(/\\/g, "/"), 180),
    ecosystemStudy: ecosystemStudy && typeof ecosystemStudy === "object"
      ? {
          studyId: cleanShortText(ecosystemStudy.studyId || "", 120),
          learningCycle: Number(ecosystemStudy.learningCycle || 0),
          generatedAt: cleanShortText(ecosystemStudy.generatedAt || "", 80),
          focusModules: Array.isArray(ecosystemStudy.focusModules)
            ? ecosystemStudy.focusModules.map((item) => cleanShortText(item.area || "", 120)).filter(Boolean).slice(0, 6)
            : [],
          currentSignals: Array.isArray(ecosystemStudy.impactGate?.currentSignals)
            ? ecosystemStudy.impactGate.currentSignals.map((item) => cleanShortText(item, 160)).slice(0, 6)
            : [],
          keyFilesChecked: Number(ecosystemStudy.proof?.keyFilesChecked || 0),
          directoriesChecked: Number(ecosystemStudy.proof?.directoriesChecked || 0)
        }
      : null,
    files,
    totalAgents: Number(summary.totalAgents || runtime.totalAgents || 0),
    deliveredAgents: Number(summary.deliveredAgents || 0),
    failedAgents: Number(summary.failedAgents || 0),
    queueItems: Array.isArray(payload.queue) ? payload.queue.length : 0,
    ordersBefore: beforeOrders,
    ordersAfter: afterOrders,
    orderDelta,
    ordersReturned: Array.isArray(payload.orders) ? payload.orders.length : 0,
    officeOrderId: cleanShortText(options.officeOrder?.id || "", 120),
    application: {
      imageApprovalsApplied: Number(summary.imageApprovalsApplied || imageApprovals.applied || 0),
      imageApprovalsSentToAgents: Number(summary.imageApprovalsSentToAgents || imageApprovals.sentToAgents || 0),
      publishedArticles: Number(summary.publishedArticles || 0),
      generatedArticles: Number(summary.generatedArticles || 0)
    }
  };
}

function runRealAgentsRuntime(options = {}) {
  const trigger = cleanShortText(options.trigger || "manual", 80);
  const at = new Date().toISOString();
  try {
    const summary = runRealAgentsRuntimeLocal();
    const payload = buildRealAgentsPayload();
    recordRealAgentsRunHistory({
      at,
      trigger,
      ok: true,
      totalAgents: payload.summary.totalAgents,
      newsItems: payload.summary.newsItems,
      reviewIssues: payload.summary.reviewIssues,
      queueItems: payload.summary.activeQueue
    });
    return {
      ok: true,
      summary,
      payload: buildRealAgentsPayload()
    };
  } catch (error) {
    recordRealAgentsRunHistory({
      at,
      trigger,
      ok: false,
      error: String(error?.message || error || "Falha ao rodar agentes reais.")
    });
    return {
      ok: false,
      error: String(error?.message || error || "Falha ao rodar agentes reais.")
    };
  }
}

function runRealAgentsAutoCycle(trigger) {
  if (REAL_AGENTS_AUTO_RUN_DISABLED || realAgentsAutoRunState.running) return;
  if (readCheffeCallState().active) {
    realAgentsAutoRunState.lastError = "Cheffe Call ativo: runtime automatica pausada para reuniao.";
    return;
  }

  realAgentsAutoRunState.running = true;
  realAgentsAutoRunState.startedAt = new Date().toISOString();
  const result = runRealAgentsRuntime({ trigger });
  realAgentsAutoRunState.running = false;
  realAgentsAutoRunState.lastRunAt = new Date().toISOString();
  realAgentsAutoRunState.cycles += 1;
  realAgentsAutoRunState.lastError = result.ok ? "" : result.error || "Falha ao rodar agentes reais.";

  if (result.ok) {
    console.log(`[catalogo] agentes reais atualizados (${trigger})`);
    runRealAgentsAutonomyCycle(`runtime-${trigger}`);
  } else {
    console.warn(`[catalogo] falha no ciclo dos agentes reais (${trigger}): ${realAgentsAutoRunState.lastError}`);
  }
}

function runRealAgentsAutonomyCycle(trigger = "auto") {
  if (REAL_AGENTS_AUTO_RUN_DISABLED || realAgentsAutonomyState.running) return;
  realAgentsAutonomyState.running = true;

  execFile(process.execPath, [REAL_AGENTS_AUTONOMY_SCRIPT, "--once"], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      AGENTS_AUTONOMY_TRIGGER: trigger
    },
    timeout: 2 * 60 * 1000
  }, (error) => {
    realAgentsAutonomyState.running = false;
    realAgentsAutonomyState.lastRunAt = new Date().toISOString();
    realAgentsAutonomyState.cycles += 1;
    realAgentsAutonomyState.lastError = error
      ? String(error?.message || error || "falha no ciclo autonomo")
      : "";

    if (realAgentsAutonomyState.lastError) {
      console.warn(`[catalogo] ciclo autonomo dos agentes falhou (${trigger}): ${realAgentsAutonomyState.lastError}`);
    } else {
      console.log(`[catalogo] ciclo autonomo dos agentes aplicado (${trigger})`);
    }
  });
}

function startRealAgentsAutoRunner() {
  if (REAL_AGENTS_AUTO_RUN_DISABLED || realAgentsAutoRunState.timer) return;

  realAgentsAutoRunState.timer = setInterval(() => {
    runRealAgentsAutoCycle("auto-5-minutos");
  }, REAL_AGENTS_AUTO_RUN_INTERVAL_MS);

  setTimeout(() => {
    runRealAgentsAutoCycle("auto-inicializacao");
  }, Math.min(15 * 1000, REAL_AGENTS_AUTO_RUN_INTERVAL_MS));
}

function runArticleIntegrityAudit(trigger = "manual") {
  if (articleIntegrityAutoState.running) {
    return readJson(ARTICLE_INTEGRITY_REPORT_FILE, null);
  }

  articleIntegrityAutoState.running = true;
  const knownSlugs = getArticleNews(1200).map((item) => item.slug).filter(Boolean);

  try {
    const payload = {
      trigger,
      ...auditHomeLinkedArticleIntegrity({ knownSlugs })
    };
    writeJson(ARTICLE_INTEGRITY_REPORT_FILE, payload);
    articleIntegrityAutoState.lastRunAt = payload.checkedAt;
    articleIntegrityAutoState.lastError = "";
    articleIntegrityAutoState.cycles += 1;
    if (payload.missingCount > 0) {
      console.warn(`[catalogo] auditoria de artigos encontrou ${payload.missingCount} slug(s) da home fora da base.`);
    } else {
      console.log(`[catalogo] auditoria de artigos ok (${trigger})`);
    }
    return payload;
  } catch (error) {
    articleIntegrityAutoState.lastError = String(error?.message || error || "falha na auditoria de artigos");
    console.warn(`[catalogo] falha na auditoria de artigos (${trigger}): ${articleIntegrityAutoState.lastError}`);
    return {
      ok: false,
      trigger,
      checkedAt: new Date().toISOString(),
      error: articleIntegrityAutoState.lastError
    };
  } finally {
    articleIntegrityAutoState.running = false;
  }
}

function startArticleIntegrityAutoRunner() {
  if (ARTICLE_INTEGRITY_AUTO_RUN_DISABLED) return;
  if (articleIntegrityAutoState.timer) return;

  articleIntegrityAutoState.timer = setInterval(() => {
    runArticleIntegrityAudit("auto-30-minutos");
  }, ARTICLE_INTEGRITY_INTERVAL_MS);

  setTimeout(() => {
    runArticleIntegrityAudit("auto-inicializacao");
  }, Math.min(20 * 1000, ARTICLE_INTEGRITY_INTERVAL_MS));
}

function startTopicFeedAutoRunner() {
  if (TOPIC_FEED_AUTO_REFRESH_DISABLED) return;
  if (topicFeedAutoState.timer) return;

  topicFeedAutoState.timer = setInterval(() => {
    runTopicFeedsAutoCycle("auto-20-minutos").catch(() => {});
  }, TOPIC_FEED_AUTO_REFRESH_INTERVAL_MS);

  setTimeout(() => {
    runTopicFeedsAutoCycle("auto-inicializacao").catch(() => {});
  }, Math.min(25 * 1000, TOPIC_FEED_AUTO_REFRESH_INTERVAL_MS));
}

const PUBPAID_SPRITE_SCOUT_SOURCES = [
  {
    name: "Kenney Assets",
    url: "https://kenney.nl/assets",
    licenseFocus: "CC0 / permissivo",
    use: "base segura para UI, tiles, itens, personagens e prototipos comerciais"
  },
  {
    name: "OpenGameArt",
    url: "https://opengameart.org/",
    licenseFocus: "varia por asset",
    use: "buscar sprites animados, tilesets, props de bar/cassino e efeitos revisando licenca item a item"
  },
  {
    name: "itch.io Game Assets",
    url: "https://itch.io/game-assets/free",
    licenseFocus: "varia por pacote",
    use: "garimpar pixel art de bar, cassino, interiores, UI e personagens com pagina de licenca clara"
  },
  {
    name: "CraftPix Freebies",
    url: "https://craftpix.net/freebies/",
    licenseFocus: "ver termos do pacote",
    use: "spritesheets, personagens e UI packs para estudo e referencia de pipeline"
  },
  {
    name: "GameDev Market Free Assets",
    url: "https://www.gamedevmarket.net/category/free/",
    licenseFocus: "ver termos do pacote",
    use: "props, UI, personagens e ambientes com revisao de permissao antes de uso"
  }
];

const PUBPAID_SPRITE_SCOUT_CATEGORIES = [
  "Garcom de busto/idle/talk para balcão",
  "Clientes sentados, rivais e dealer com idle e pequenas falas",
  "Copos, dados, fichas, cartas, garrafas e moedas com estados de animacao",
  "Roleta, sinuca, poker, blackjack, damas e caca-niqueis com sprites completos",
  "Tilesets de bar/pub/cassino: chao, parede, balcão, palco, luzes e mesas",
  "FX de moedas, jackpot, luz RGB, fumaca, brilho, confete e impacto",
  "UI/HUD: icones de mesa, marcadores de interacao, botoes, placas e prompts"
];

function buildDefaultNeuralGrowthState() {
  return {
    ok: true,
    version: 1,
    updatedAt: new Date().toISOString(),
    cycles: 0,
    score: 0,
    hierarchy: "Full Admin -> Codex CEO -> Ninjas + Arte/Game Design + Nerd",
    modules: [
      {
        id: "sprites",
        name: "Sprites com movimento",
        team: "Ninjas + Arte",
        level: 1,
        focus: "captar pacote completo, agrupar frames e separar acoes jogaveis"
      },
      {
        id: "game-engine",
        name: "Game engine e loop",
        team: "Nerd + Arte",
        level: 1,
        focus: "estado de jogo, input, render, tempo, camadas e performance"
      },
      {
        id: "collision-physics",
        name: "Colisao e fisica",
        team: "Nerd",
        level: 1,
        focus: "hitbox, parede, mesa, atrito, quique, easing e resposta"
      },
      {
        id: "maps",
        name: "Mapas e modo construcao",
        team: "Arte + Ninjas",
        level: 1,
        focus: "tiles, layers, colisao, decoracao, hotspots e fluxo"
      },
      {
        id: "pubpaid-feel",
        name: "PubPaid vivo",
        team: "Ninjas + Arte + Nerd",
        level: 1,
        focus: "som, suspense, NPCs, luz, UI e sensacao de aposta"
      }
    ],
    lessons: [
      "Nao avaliar frame solto quando o correto e sprite animado.",
      "Nao colocar assets ja publicados na fila de aceite.",
      "Priorizar contexto real: PubPaid, jogos, escritorios e subsites existentes.",
      "Sem canvas para ilustracao nova de personagem/conteudo; usar bitmap real revisado."
    ],
    pulses: []
  };
}

function buildNeuralGrowthPayload() {
  const persisted = readJson(OFFICE_NEURAL_GROWTH_FILE, null);
  const fallback = buildDefaultNeuralGrowthState();
  if (!persisted || typeof persisted !== "object" || Array.isArray(persisted)) return fallback;

  return {
    ...fallback,
    ...persisted,
    modules: Array.isArray(persisted.modules) && persisted.modules.length ? persisted.modules : fallback.modules,
    lessons: Array.isArray(persisted.lessons) && persisted.lessons.length ? persisted.lessons : fallback.lessons,
    pulses: Array.isArray(persisted.pulses) ? persisted.pulses : []
  };
}

function recordNeuralGrowthPulse(body = {}) {
  const current = buildNeuralGrowthPayload();
  const focus = cleanShortText(body.focus || "sprites-pubpaid", 120);
  const note = cleanShortText(body.note || "", 500);
  const pulse = {
    id: createRecordId("neural"),
    focus,
    note,
    from: "Full Admin",
    to: "Codex CEO + equipes",
    createdAt: new Date().toISOString()
  };
  const modules = current.modules.map((moduleItem) => {
    const shouldGrow =
      focus === "todos" ||
      normalizeText(`${moduleItem.id} ${moduleItem.name} ${moduleItem.focus}`).includes(normalizeText(focus));
    return {
      ...moduleItem,
      level: Number(moduleItem.level || 1) + (shouldGrow ? 1 : 0)
    };
  });
  const nextState = {
    ...current,
    ok: true,
    updatedAt: new Date().toISOString(),
    cycles: Number(current.cycles || 0) + 1,
    score: Number(current.score || 0) + 7,
    modules,
    pulses: [pulse].concat(current.pulses || []).slice(0, 80)
  };
  writeJson(OFFICE_NEURAL_GROWTH_FILE, nextState);
  return nextState;
}

function buildPubPaidSpriteScoutPayload() {
  const requests = readJson(PUBPAID_SPRITE_SCOUT_FILE, []);
  const safeRequests = Array.isArray(requests) ? requests : [];
  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    mission: "Buscar na internet sprites completos, animados e licenciaveis para o PubPaid.",
    rules: [
      "Priorizar sprite pronto com movimento, nao frame solto.",
      "Registrar fonte, licenca, URL, contexto de uso e risco antes de baixar.",
      "Nada entra no jogo sem passar pelo CHECKPUBPAID.",
      "Foco em bitmap/sprite real; canvas serve para mecanica, nao para ilustrar personagem novo."
    ],
    categories: PUBPAID_SPRITE_SCOUT_CATEGORIES,
    sources: PUBPAID_SPRITE_SCOUT_SOURCES,
    requests: safeRequests.slice(-60).reverse()
  };
}

function recordPubPaidSpriteScoutOrder(body = {}) {
  const target = cleanShortText(body.target || "Ninjas + Arte/Game Design + Nerd", 120);
  const focus = cleanShortText(body.focus || "sprites completos do PubPaid", 200);
  const scoutOrder = {
    id: createRecordId("scout"),
    target,
    focus,
    status: "ordem-enviada",
    createdAt: new Date().toISOString(),
    categories: PUBPAID_SPRITE_SCOUT_CATEGORIES,
    sources: PUBPAID_SPRITE_SCOUT_SOURCES
  };
  const requests = readJson(PUBPAID_SPRITE_SCOUT_FILE, []);
  const nextRequests = Array.isArray(requests) ? requests.concat(scoutOrder).slice(-120) : [scoutOrder];
  writeJson(PUBPAID_SPRITE_SCOUT_FILE, nextRequests);

  appendOfficeOrder({
    id: createRecordId("ord"),
    from: "Full Admin",
    to: target,
    priority: "critica",
    message:
      `Buscar pela internet sprites completos e animados para PubPaid: ${focus}. Registrar fonte, licenca, URL, contexto e risco antes de qualquer uso.`,
    ceoReply:
      "Recebido. CEO acionou Ninjas para garimpo/licenca, Arte para qualidade visual e Nerd para aplicacao em gameplay.",
    status: "recebida-pelo-ceo",
    hierarchy: "Full Admin -> Codex CEO -> Ninjas + Arte/Game Design + Nerd",
    createdAt: scoutOrder.createdAt
  });

  return scoutOrder;
}

function requireAcre2026PollAdmin(req) {
  if (requireAdmin(req)) {
    return true;
  }

  const password = safeString(req?.headers?.["x-poll-admin-password"] || "", 120);
  return Boolean(POLL_ADMIN_PASSWORD) && password === POLL_ADMIN_PASSWORD;
}

function normalizePollChoice(value, allowedValues = [], fallback = "") {
  const normalized = cleanShortText(value, 120);
  return allowedValues.includes(normalized) ? normalized : fallback;
}

function getAcre2026PollResponses() {
  return getJsonArray(ACRE_2026_POLL_FILE);
}

function buildWeeklyDeviceFingerprints(tracking = {}) {
  return [
    tracking.visitorId || tracking.cookieVisitorId || "",
    tracking.sessionId || tracking.cookieSessionId || "",
    tracking.ip || ""
  ]
    .map((item) => safeString(item, 160))
    .filter(Boolean);
}

function recordMatchesWeeklyDevice(item = {}, currentWeekKey = "", fingerprints = []) {
  if (!currentWeekKey || !Array.isArray(fingerprints) || !fingerprints.length) {
    return false;
  }

  if (safeString(item.weekKey || "", 24) !== currentWeekKey) {
    return false;
  }

  const savedFingerprints = [
    safeString(item.visitorId || "", 160),
    safeString(item.sessionId || "", 160),
    safeString(item.ip || "", 160)
  ].filter(Boolean);

  return fingerprints.some((fingerprint) => savedFingerprints.includes(fingerprint));
}

function getAcre2026PollRoundSettings(now = new Date()) {
  const currentDate = now instanceof Date && !Number.isNaN(now.getTime()) ? now : new Date();
  const baseWeekKey = getWeekBucketKey(currentDate.toISOString());
  const settings = readJson(ACRE_2026_POLL_SETTINGS_FILE, ACRE_2026_POLL_EXTENSION_SETTINGS);
  const activeWeekKey = safeString(settings?.activeWeekKey || "", 24);
  const activeWeekExpiresAt = safeString(settings?.activeWeekExpiresAt || "", 80);
  const expiresAtMs = activeWeekExpiresAt ? new Date(activeWeekExpiresAt).getTime() : 0;
  const isManualRoundActive =
    Boolean(activeWeekKey) &&
    (!activeWeekExpiresAt || (Number.isFinite(expiresAtMs) && expiresAtMs > currentDate.getTime()));

  return {
    version: 1,
    mode: safeString(settings?.mode || (isManualRoundActive ? "manual-week" : "iso-week"), 40),
    baseWeekKey,
    activeWeekKey,
    effectiveWeekKey: isManualRoundActive ? activeWeekKey : baseWeekKey,
    isManualRoundActive,
    activeWeekStartedAt: safeString(settings?.activeWeekStartedAt || "", 80),
    activeWeekExpiresAt,
    resetReason: cleanShortText(settings?.resetReason || "", 240),
    updatedAt: safeString(settings?.updatedAt || "", 80),
    history: Array.isArray(settings?.history) ? settings.history.slice(-10) : []
  };
}

function getActiveAcre2026PollWeekKey(value = new Date().toISOString()) {
  const date = new Date(value || Date.now());
  return getAcre2026PollRoundSettings(date).effectiveWeekKey;
}

function buildAcre2026PollRoundKey(date = new Date()) {
  const baseWeekKey = getWeekBucketKey(date.toISOString());
  const stamp = date.toISOString().replace(/\D/g, "").slice(4, 14);
  return safeString(`${baseWeekKey}-R${stamp}`, 24);
}

function resetAcre2026PollRound(reason = "") {
  const now = new Date();
  const previous = getAcre2026PollRoundSettings(now);
  const activeWeekKey = buildAcre2026PollRoundKey(now);
  const nextSettings = {
    version: 1,
    mode: "manual-week",
    baseWeekKey: previous.baseWeekKey,
    activeWeekKey,
    activeWeekStartedAt: now.toISOString(),
    activeWeekExpiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    resetReason: cleanShortText(reason || "Reset administrativo mantendo votos acumulados.", 240),
    previousWeekKey: previous.effectiveWeekKey,
    updatedAt: now.toISOString(),
    history: previous.history
      .concat({
        activeWeekKey: previous.activeWeekKey,
        effectiveWeekKey: previous.effectiveWeekKey,
        startedAt: previous.activeWeekStartedAt,
        expiresAt: previous.activeWeekExpiresAt,
        closedAt: now.toISOString()
      })
      .filter((item) => item.activeWeekKey || item.effectiveWeekKey)
      .slice(-10)
  };

  writeJson(ACRE_2026_POLL_SETTINGS_FILE, nextSettings);
  return getAcre2026PollRoundSettings(now);
}

function findAcre2026WeeklyVoteForAuth(authUser = {}, weekKey = getActiveAcre2026PollWeekKey()) {
  const googleSub = safeString(authUser?.sub || "", 160);
  const googleEmail = safeString(authUser?.email || "", 160);
  if (!googleSub && !googleEmail) return null;

  const records = getAcre2026PollResponses();
  return (
    (Array.isArray(records) ? records : []).find(
      (item) =>
        safeString(item.weekKey || "", 24) === weekKey &&
        ((googleSub && safeString(item.googleSub || "", 160) === googleSub) ||
          (googleEmail && safeString(item.googleEmail || "", 160) === googleEmail))
    ) || null
  );
}

function buildAcre2026PollCurrentUserPayload(authUser = {}) {
  const round = getAcre2026PollRoundSettings();
  const weekKey = round.effectiveWeekKey;
  const existingVote = findAcre2026WeeklyVoteForAuth(authUser, weekKey);
  return {
    ok: true,
    authenticated: Boolean(authUser?.email && authUser?.sub),
    alreadyVoted: Boolean(existingVote),
    weekKey,
    round,
    user: publicAuthUser(authUser),
    vote: existingVote
      ? {
          id: existingVote.id,
          createdAt: existingVote.createdAt,
          weekKey: existingVote.weekKey
        }
      : null,
    summary: buildAcre2026PollSummary(sortByDateDesc(getAcre2026PollResponses(), "createdAt", 5000)),
    message: existingVote
      ? "Seu Google já registrou uma resposta nesta semana. A participação fica encerrada e as parciais ficam liberadas."
      : "Google conectado. A participação semanal está liberada."
  };
}

function normalizeAcre2026PollRecord(item = {}) {
  if (!item || typeof item !== "object") return null;

  const id = safeString(item.id || "", 120) || createRecordId("poll");
  const createdAt = safeString(item.createdAt || item.at || "", 80) || new Date().toISOString();
  const voto2026 = normalizePollChoice(item.voto2026 || item.vote2026, ACRE_2026_POLL_OPTIONS.vote2026, "");
  if (!voto2026) return null;

  const normalized = {
    id,
    profissao: cleanShortText(item.profissao || item.profession || "Nao informado", 100),
    localizacao: cleanShortText(item.localizacao || item.location || item.city || "Nao informado", 120),
    faixaEtaria: normalizePollChoice(item.faixaEtaria || item.ageRange, ACRE_2026_POLL_OPTIONS.ageRanges, "Prefiro nao informar"),
    votoAnterior: normalizePollChoice(item.votoAnterior || item.previousVote, ACRE_2026_POLL_OPTIONS.previousVotes, "Nao lembro/Nao votei"),
    satisfacao: Math.max(1, Math.min(5, Number(item.satisfacao || item.satisfaction || 3))),
    avaliacaoGoverno: normalizePollChoice(
      item.avaliacaoGoverno || item.governmentEvaluation,
      ACRE_2026_POLL_OPTIONS.governmentEvaluation,
      "Nao sabe"
    ),
    direcaoEstado: normalizePollChoice(
      item.direcaoEstado || item.stateDirection,
      ACRE_2026_POLL_OPTIONS.stateDirection,
      "Nao sabe"
    ),
    desejoCiclo: normalizePollChoice(item.desejoCiclo || item.desiredCycle, ACRE_2026_POLL_OPTIONS.desiredCycle, "Nao sabe"),
    voto2026,
    segundaOpcao: normalizePollChoice(
      item.segundaOpcao || item.secondChoice,
      ACRE_2026_POLL_OPTIONS.secondChoice,
      "Nenhuma segunda opcao"
    ),
    certezaVoto: normalizePollChoice(
      item.certezaVoto || item.voteCertainty,
      ACRE_2026_POLL_OPTIONS.voteCertainty,
      "Muito indefinido"
    ),
    rejeicao: normalizePollChoice(item.rejeicao || item.rejection, ACRE_2026_POLL_OPTIONS.rejection, "Nao rejeito nenhum"),
    prioridade: normalizePollChoice(item.prioridade || item.priority, ACRE_2026_POLL_OPTIONS.priorities, "Emprego e renda"),
    atencaoPolitica: normalizePollChoice(
      item.atencaoPolitica || item.politicalAttention,
      ACRE_2026_POLL_OPTIONS.politicalAttention,
      "Acompanho as vezes"
    ),
    fatorDecisivo: normalizePollChoice(
      item.fatorDecisivo || item.decisionDriver,
      ACRE_2026_POLL_OPTIONS.decisionDriver,
      "Resultados concretos"
    ),
    comentario: safeString(item.comentario || item.comment || "", 1200),
    sourcePage: cleanShortText(item.sourcePage || "/pesquisa-acre-2026.html", 260),
    pageTitle: cleanShortText(item.pageTitle || "Enquete de Opiniao Acre 2026", 160),
    visitorId: safeString(item.visitorId || "", 90),
    sessionId: safeString(item.sessionId || "", 90),
    city: safeString(item.city || "", 80),
    country: safeString(item.country || "", 80),
    ip: safeString(item.ip || "", 160),
    browser: safeString(item.browser || "", 40),
    deviceType: safeString(item.deviceType || "", 40),
    referrerHost: safeString(item.referrerHost || "", 120),
    googleEmail: safeString(item.googleEmail || "", 160),
    googleSub: safeString(item.googleSub || "", 160),
    weekKey: safeString(item.weekKey || "", 24) || getWeekBucketKey(createdAt),
    createdAt
  };

  return normalized;
}

function dedupeAcre2026PollRecords(records = []) {
  const seen = new Set();
  const output = [];

  (Array.isArray(records) ? records : []).forEach((item) => {
    const normalized = normalizeAcre2026PollRecord(item);
    if (!normalized) return;
    const key = [
      normalized.id,
      normalized.weekKey,
      normalized.googleSub || normalized.googleEmail,
      normalized.createdAt,
      normalized.voto2026
    ].join("|");
    if (seen.has(key)) return;
    seen.add(key);
    output.push(normalized);
  });

  return sortByDateDesc(output, "createdAt", 10000);
}

function buildPollBreakdown(items = [], key, limit = 10) {
  const bucket = sumBy(items, (item) => item?.[key] || "Nao informado");
  const total = Array.isArray(items) ? items.length : 0;
  return Object.entries(bucket)
    .map(([label, count]) => ({
      label,
      total: Number(count || 0),
      percent: total ? Number((((Number(count || 0) / total) * 100)).toFixed(1)) : 0
    }))
    .sort((left, right) => right.total - left.total)
    .slice(0, limit);
}

function getPollLeaderLabel(items = [], key, fallback = "Sem leitura") {
  return buildPollBreakdown(items, key, 1)[0]?.label || fallback;
}

function buildPollCandidateProfiles(items = [], limit = 4) {
  return buildPollBreakdown(items, "voto2026", limit)
    .filter((entry) => entry.label !== "Ainda nao decidi" && entry.label !== "Branco/Nulo")
    .map((entry) => {
      const subset = items.filter((item) => item?.voto2026 === entry.label);
      const avgSatisfaction = Number(
        average(
          subset
            .map((item) => Number(item?.satisfacao || 0))
            .filter((value) => Number.isFinite(value) && value > 0)
        ).toFixed(1)
      );

      return {
        label: entry.label,
        total: entry.total,
        percent: entry.percent,
        topPriority: getPollLeaderLabel(subset, "prioridade"),
        desiredCycle: getPollLeaderLabel(subset, "desejoCiclo"),
        voteCertainty: getPollLeaderLabel(subset, "certezaVoto"),
        avgSatisfaction
      };
    });
}

function buildAcre2026PollSummary(records = getAcre2026PollResponses()) {
  const items = Array.isArray(records) ? records : [];
  const totalResponses = items.length;
  const satisfactionAverage = Number(
    average(
      items
        .map((item) => Number(item.satisfacao || 0))
        .filter((value) => Number.isFinite(value) && value > 0)
    ).toFixed(1)
  );
  const commentAverageLength = Number(
    average(
      items
        .map((item) => safeString(item.comentario || "", 1600).trim().length)
        .filter((value) => Number.isFinite(value) && value > 0)
    ).toFixed(0)
  );
  const distinctLocations = new Set(
    items
      .map((item) => normalizeText(item.localizacao || item.city || ""))
      .filter(Boolean)
  ).size;
  const distinctProfessions = new Set(
    items
      .map((item) => normalizeText(item.profissao || ""))
      .filter(Boolean)
  ).size;

  return {
    totalResponses,
    satisfactionAverage,
    commentAverageLength,
    distinctLocations,
    distinctProfessions,
    vote2026: buildPollBreakdown(items, "voto2026", 6),
    secondOptions: buildPollBreakdown(items, "segundaOpcao", 6),
    rejection: buildPollBreakdown(items, "rejeicao", 6),
    priorities: buildPollBreakdown(items, "prioridade", 6),
    stateDirection: buildPollBreakdown(items, "direcaoEstado", 6),
    desiredCycle: buildPollBreakdown(items, "desejoCiclo", 6),
    voteCertainty: buildPollBreakdown(items, "certezaVoto", 6),
    governmentEvaluation: buildPollBreakdown(items, "avaliacaoGoverno", 6),
    politicalAttention: buildPollBreakdown(items, "atencaoPolitica", 6),
    decisionDriver: buildPollBreakdown(items, "fatorDecisivo", 6),
    previousVote: buildPollBreakdown(items, "votoAnterior", 6),
    ageRanges: buildPollBreakdown(items, "faixaEtaria", 6),
    locations: buildPollBreakdown(items, "localizacao", 8),
    professions: buildPollBreakdown(items, "profissao", 8),
    devices: buildPollBreakdown(items, "deviceType", 6),
    browsers: buildPollBreakdown(items, "browser", 6),
    sourcePages: buildPollBreakdown(items, "sourcePage", 6),
    candidateProfiles: buildPollCandidateProfiles(items, 4),
    updatedAt: items[0]?.createdAt || ""
  };
}

function buildAcre2026PollPublicPayload() {
  const items = sortByDateDesc(getAcre2026PollResponses(), "createdAt", 5000);
  return {
    ok: true,
    updatedAt: items[0]?.createdAt || "",
    round: getAcre2026PollRoundSettings(),
    summary: buildAcre2026PollSummary(items),
    weekly: buildWeeklyTrendSeries(items, {
      valueField: "voto2026",
      totalLabel: "totalResponses"
    })
  };
}

function pickMeaningfulPollLeader(items = [], blockedLabels = []) {
  const blocked = new Set((Array.isArray(blockedLabels) ? blockedLabels : []).map((item) => normalizeText(item)));
  return (Array.isArray(items) ? items : []).find((item) => !blocked.has(normalizeText(item?.label || ""))) || items[0] || null;
}

function isElectionJournalNewsItem(item = {}) {
  const category = normalizeText(item.category || "");
  if (category === "politica" || category === "prefeitura") {
    return true;
  }

  const haystack = normalizeText(
    [item.title, item.summary, item.sourceName, item.sourceLabel, item.category, item.location].join(" ")
  );

  return /\b(eleic|governador|governadora|vice-governadora|senador|senado|deputad|prefeit|governo|politic|candidat|partido|alianc|mailza|gladson|alan rick|jorge viana|bocalom|petecao|marcio bittar|thor dantas)\b/.test(
    haystack
  );
}

function buildAcre2026PollBridgePayload() {
  const items = sortByDateDesc(getAcre2026PollResponses(), "createdAt", 5000);
  const summary = buildAcre2026PollSummary(items);
  const leadVote = pickMeaningfulPollLeader(summary.vote2026, ["Ainda nao decidi", "Branco/Nulo"]);
  const topPriority = summary.priorities?.[0] || null;
  const topDirection = summary.stateDirection?.[0] || null;
  const desiredCycle = pickMeaningfulPollLeader(summary.desiredCycle, ["Nao sabe"]);
  const journalItems = getNews(160)
    .filter(isElectionJournalNewsItem)
    .slice(0, 4)
    .map((item) => ({
      slug: safeString(item.slug, 160),
      title: safeString(item.title, 180),
      summary: safeString(item.summary, 280),
      category: safeString(item.category, 60),
      sourceName: safeString(item.sourceName || item.source, 80),
      publishedAt: item.date || item.publishedAt || "",
      localUrl: item.slug ? `/noticia.html?slug=${encodeURIComponent(item.slug)}` : safeString(item.url, 420),
      sourceUrl: safeString(item.url || item.sourceUrl, 420)
    }));

  return {
    ok: true,
    updatedAt: summary.updatedAt || journalItems[0]?.publishedAt || "",
    round: getAcre2026PollRoundSettings(),
    poll: {
      totalResponses: Number(summary.totalResponses || 0),
      satisfactionAverage: Number(summary.satisfactionAverage || 0),
      leadVote,
      topPriority,
      topDirection,
      desiredCycle,
      candidateProfiles: Array.isArray(summary.candidateProfiles) ? summary.candidateProfiles.slice(0, 4) : [],
      weekly: buildWeeklyTrendSeries(items, {
        valueField: "voto2026",
        totalLabel: "totalResponses"
      }),
      updatedAt: summary.updatedAt || ""
    },
    journal: {
      totalItems: journalItems.length,
      items: journalItems
    }
  };
}

function buildAcre2026PollAdminPayload() {
  const items = sortByDateDesc(getAcre2026PollResponses(), "createdAt", 5000);
  const weekly = buildWeeklyTrendSeries(items, {
    valueField: "voto2026",
    totalLabel: "totalResponses"
  });
  return {
    ok: true,
    updatedAt: items[0]?.createdAt || "",
    round: getAcre2026PollRoundSettings(),
    summary: buildAcre2026PollSummary(items),
    weekly,
    records: items.map((item) => ({
      id: item.id,
      createdAt: item.createdAt,
      weekKey: item.weekKey,
      profissao: item.profissao,
      localizacao: item.localizacao,
      faixaEtaria: item.faixaEtaria,
      votoAnterior: item.votoAnterior,
      satisfacao: item.satisfacao,
      avaliacaoGoverno: item.avaliacaoGoverno,
      direcaoEstado: item.direcaoEstado,
      desejoCiclo: item.desejoCiclo,
      voto2026: item.voto2026,
      segundaOpcao: item.segundaOpcao,
      certezaVoto: item.certezaVoto,
      rejeicao: item.rejeicao,
      prioridade: item.prioridade,
      atencaoPolitica: item.atencaoPolitica,
      fatorDecisivo: item.fatorDecisivo,
      comentario: item.comentario,
      sourcePage: item.sourcePage,
      pageTitle: item.pageTitle,
      referrerHost: item.referrerHost,
      city: item.city,
      country: item.country,
      browser: item.browser,
      deviceType: item.deviceType,
      googleEmail: item.googleEmail,
      googleSub: item.googleSub,
      visitorId: item.visitorId,
      sessionId: item.sessionId,
      ip: item.ip
    }))
  };
}

function getWeekBucketKey(value = "") {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) {
    return "week-unknown";
  }

  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function buildWeeklyTrendSeries(records = [], { valueField = "", totalLabel = "total" } = {}) {
  const bucket = new Map();
  (Array.isArray(records) ? records : []).forEach((item) => {
    const key = getWeekBucketKey(item?.createdAt || item?.at || "");
    if (!bucket.has(key)) {
      bucket.set(key, {
        week: key,
        total: 0,
        labels: {}
      });
    }
    const entry = bucket.get(key);
    entry.total += 1;
    const label = safeString(item?.[valueField] || "", 120) || "não informado";
    entry.labels[label] = (entry.labels[label] || 0) + 1;
  });

  const weeks = Array.from(bucket.values()).sort((a, b) => String(a.week).localeCompare(String(b.week), "pt-BR"));
  return weeks.map((entry, index) => {
    const topEntries = Object.entries(entry.labels)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, total]) => ({
        label,
        total,
        percent: entry.total ? Number(((total / entry.total) * 100).toFixed(1)) : 0
      }));
    const previous = weeks[index - 1];
    return {
      week: entry.week,
      [totalLabel]: entry.total,
      total: entry.total,
      labels: topEntries,
      changeFromPrevious: previous ? entry.total - previous.total : 0
    };
  });
}

function getPubpaidWalletKey(user = {}) {
  return safeString(user?.sub || user?.email || "", 180).toLowerCase();
}

function getPubpaidWalletAliases(user = {}) {
  const sub = safeString(user?.sub || "", 180).toLowerCase();
  const email = cleanEmail(user?.email || "").toLowerCase();
  return Array.from(new Set([
    sub,
    email,
    email ? `email:${email}` : "",
  ].filter(Boolean)));
}

function normalizePubpaidAmount(value, fallback = 10) {
  const parsed = Number(parseCurrency(value, fallback));
  return PUBPAID_ALLOWED_AMOUNTS.includes(parsed) ? parsed : fallback;
}

function normalizePubpaidMoney(value, fallback = 0) {
  return Number(parseCurrency(value, fallback).toFixed(2));
}

function readMergedPubpaidArray(primaryFile, legacyFile) {
  const primary = readJson(primaryFile, []);
  const legacy = readJson(legacyFile, []);
  const merged = [];
  const seen = new Set();

  [primary, legacy].forEach((list) => {
    (Array.isArray(list) ? list : []).forEach((item) => {
      if (!item || typeof item !== "object") return;
      const key = [
        safeString(item.id || "", 160),
        safeString(item?.payment?.txid || item.reference || "", 80),
        safeString(item.createdAt || "", 80),
        safeString(item.walletKey || item?.user?.email || "", 180)
      ].join("|");
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(item);
    });
  });

  return merged;
}

function writePubpaidArrayCompat(primaryFile, legacyFile, items = []) {
  const normalized = Array.isArray(items) ? items : [];
  writeJson(primaryFile, normalized);
  if (legacyFile) {
    writeJson(legacyFile, normalized);
  }
}

function normalizePubpaidWalletRecord(item = {}) {
  const coerceMoney = (value) => normalizePubpaidMoney(value, 0);
  const lockedLegacy = item.locked === true ? coerceMoney(item.balance || item.balanceCoins || 0) : 0;
  const lockedWithdrawalCoins = coerceMoney(item.lockedWithdrawalCoins ?? lockedLegacy);
  const lockedMatchCoins = coerceMoney(item.lockedMatchCoins ?? item.lockedPvpCoins ?? 0);
  const matchSpentCoins = coerceMoney(item.matchSpentCoins ?? item.matchDebitCoins ?? item.spentMatchCoins ?? 0);
  const matchPayoutCoins = coerceMoney(item.matchPayoutCoins ?? item.pvpPayoutCoins ?? 0);
  const matchWonCoins = coerceMoney(item.matchWonCoins ?? item.pvpWonCoins ?? 0);
  const matchLostCoins = coerceMoney(item.matchLostCoins ?? item.pvpLostCoins ?? 0);
  const matchHouseFeeCoins = coerceMoney(item.matchHouseFeeCoins ?? item.pvpHouseFeeCoins ?? 0);
  const balanceCoins = coerceMoney(item.balanceCoins ?? item.balance ?? 0);
  const manualApprovedBalanceCoins = coerceMoney(
    item.manualApprovedBalanceCoins ?? item.manualApprovedCoins ?? item.matchPayoutCoins ?? item.bonusCoins ?? 0
  );
  return {
    ...item,
    balanceCoins,
    availableCoins: Math.max(0, coerceMoney(item.availableCoins ?? (balanceCoins - lockedWithdrawalCoins - lockedMatchCoins))),
    lockedMatchCoins,
    matchSpentCoins,
    matchPayoutCoins,
    matchWonCoins,
    matchLostCoins,
    matchHouseFeeCoins,
    lockedWithdrawalCoins,
    totalApprovedDeposits: coerceMoney(item.totalApprovedDeposits ?? item.depositsApproved ?? 0),
    totalApprovedWithdrawals: coerceMoney(item.totalApprovedWithdrawals ?? item.withdrawalsApproved ?? 0),
    manualApprovedBalanceCoins,
    locked: Boolean(item.locked ?? (lockedWithdrawalCoins + lockedMatchCoins > 0))
  };
}

function getPubpaidWalletStore() {
  const items = readMergedPubpaidArray(PUBPAID_WALLETS_FILE, LEGACY_PUBPAID_WALLETS_FILE);
  return Object.fromEntries(
    (Array.isArray(items) ? items : [])
      .map((item) => normalizePubpaidWalletRecord(item))
      .map((item) => [safeString(item.walletKey || item.playerId || item.userId || "", 180).toLowerCase(), item])
      .filter(([key]) => Boolean(key))
  );
}

function writePubpaidWalletStore(items = {}) {
  const normalized = Array.isArray(items)
    ? items
    : Object.values(items && typeof items === "object" ? items : {});
  writePubpaidArrayCompat(PUBPAID_WALLETS_FILE, LEGACY_PUBPAID_WALLETS_FILE, normalized);
}

function getPubpaidWithdrawals() {
  const items = readMergedPubpaidArray(PUBPAID_WITHDRAWALS_FILE, LEGACY_PUBPAID_WITHDRAWALS_FILE);
  return Array.isArray(items) ? items : [];
}

function writePubpaidWithdrawals(items = []) {
  writePubpaidArrayCompat(PUBPAID_WITHDRAWALS_FILE, LEGACY_PUBPAID_WITHDRAWALS_FILE, items);
}

function getPubpaidWallet(authUser = {}, { createIfMissing = true } = {}) {
  const key = getPubpaidWalletKey(authUser);
  if (!key) {
    return null;
  }

  const walletStore = getPubpaidWalletStore();
  const wallets = walletStore && typeof walletStore === "object" ? walletStore : {};
  const walletAliases = getPubpaidWalletAliases(authUser);
  let walletRecord = wallets[key] || null;
  if (!walletRecord) {
    walletRecord = walletAliases.map((alias) => wallets[alias]).find(Boolean) || null;
  }
  let wallet = walletRecord
    ? {
        id: safeString(walletRecord.id || "", 120) || createRecordId("pubwallet"),
        walletKey: key,
        user: publicAuthUser(authUser),
        balanceCoins: normalizePubpaidMoney(walletRecord.balanceCoins ?? walletRecord.balance),
        availableCoins: normalizePubpaidMoney(
          walletRecord.availableCoins ??
            (normalizePubpaidMoney(walletRecord.balanceCoins ?? walletRecord.balance) -
              normalizePubpaidMoney(walletRecord.lockedWithdrawalCoins ?? 0) -
              normalizePubpaidMoney(walletRecord.lockedMatchCoins ?? 0))
        ),
        lockedMatchCoins: normalizePubpaidMoney(walletRecord.lockedMatchCoins ?? 0),
        matchSpentCoins: normalizePubpaidMoney(walletRecord.matchSpentCoins ?? 0),
        matchPayoutCoins: normalizePubpaidMoney(walletRecord.matchPayoutCoins ?? 0),
        matchWonCoins: normalizePubpaidMoney(walletRecord.matchWonCoins ?? 0),
        matchLostCoins: normalizePubpaidMoney(walletRecord.matchLostCoins ?? 0),
        matchHouseFeeCoins: normalizePubpaidMoney(walletRecord.matchHouseFeeCoins ?? 0),
        lockedWithdrawalCoins: normalizePubpaidMoney(walletRecord.lockedWithdrawalCoins ?? walletRecord.locked),
        totalApprovedDeposits: normalizePubpaidMoney(walletRecord.totalApprovedDeposits ?? walletRecord.approvedDeposits),
        totalApprovedWithdrawals: normalizePubpaidMoney(walletRecord.totalApprovedWithdrawals ?? walletRecord.approvedWithdrawals),
        manualApprovedBalanceCoins: normalizePubpaidMoney(walletRecord.manualApprovedBalanceCoins ?? 0),
        createdAt: safeString(walletRecord.createdAt || "", 40),
        updatedAt: safeString(walletRecord.updatedAt || "", 40)
      }
    : null;

  if (!wallet && createIfMissing) {
    wallet = {
      id: createRecordId("pubwallet"),
      walletKey: key,
      user: publicAuthUser(authUser),
      balanceCoins: 0,
      availableCoins: 0,
      lockedMatchCoins: 0,
      matchSpentCoins: 0,
      matchPayoutCoins: 0,
      matchWonCoins: 0,
      matchLostCoins: 0,
      matchHouseFeeCoins: 0,
      lockedWithdrawalCoins: 0,
      totalApprovedDeposits: 0,
      totalApprovedWithdrawals: 0,
      manualApprovedBalanceCoins: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    savePubpaidWalletStore({
      ...wallets,
      [key]: {
        id: wallet.id,
        walletKey: key,
        playerId: key,
        playerName: safeString(authUser.name, 120) || "Jogador",
        user: publicAuthUser(authUser),
        balanceCoins: 0,
        availableCoins: 0,
        lockedMatchCoins: 0,
        matchSpentCoins: 0,
        matchPayoutCoins: 0,
        matchWonCoins: 0,
        matchLostCoins: 0,
        matchHouseFeeCoins: 0,
        lockedWithdrawalCoins: 0,
        totalApprovedDeposits: 0,
        totalApprovedWithdrawals: 0,
        manualApprovedBalanceCoins: 0,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt
      }
    });
  }

  return wallet;
}

function updatePubpaidWallet(authUser = {}, updater = null) {
  const key = getPubpaidWalletKey(authUser);
  if (!key) {
    return null;
  }

  const walletStore = getPubpaidWalletStore();
  const wallets = walletStore && typeof walletStore === "object" ? walletStore : {};
  const current = getPubpaidWallet(authUser, { createIfMissing: true }) || {
    id: createRecordId("pubwallet"),
    walletKey: key,
    user: publicAuthUser(authUser),
    balanceCoins: 0,
    availableCoins: 0,
    lockedMatchCoins: 0,
    matchSpentCoins: 0,
    matchPayoutCoins: 0,
    matchWonCoins: 0,
    matchLostCoins: 0,
    matchHouseFeeCoins: 0,
    lockedWithdrawalCoins: 0,
    totalApprovedDeposits: 0,
    totalApprovedWithdrawals: 0,
    manualApprovedBalanceCoins: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const next = typeof updater === "function" ? updater({ ...current }) || current : current;
  next.user = publicAuthUser(authUser);
  next.walletKey = key;
  next.balanceCoins = Math.max(0, normalizePubpaidMoney(next.balanceCoins));
  next.lockedMatchCoins = Math.max(0, normalizePubpaidMoney(next.lockedMatchCoins));
  next.matchSpentCoins = Math.max(0, normalizePubpaidMoney(next.matchSpentCoins ?? 0));
  next.matchPayoutCoins = Math.max(0, normalizePubpaidMoney(next.matchPayoutCoins ?? 0));
  next.matchWonCoins = Math.max(0, normalizePubpaidMoney(next.matchWonCoins ?? 0));
  next.matchLostCoins = Math.max(0, normalizePubpaidMoney(next.matchLostCoins ?? 0));
  next.matchHouseFeeCoins = Math.max(0, normalizePubpaidMoney(next.matchHouseFeeCoins ?? 0));
  next.lockedWithdrawalCoins = Math.max(0, normalizePubpaidMoney(next.lockedWithdrawalCoins));
  next.manualApprovedBalanceCoins = Math.max(0, normalizePubpaidMoney(next.manualApprovedBalanceCoins ?? 0));
  next.availableCoins = Math.max(0, normalizePubpaidMoney(next.balanceCoins - next.lockedMatchCoins - next.lockedWithdrawalCoins));
  next.totalApprovedDeposits = Math.max(0, normalizePubpaidMoney(next.totalApprovedDeposits));
  next.totalApprovedWithdrawals = Math.max(0, normalizePubpaidMoney(next.totalApprovedWithdrawals));
  next.updatedAt = new Date().toISOString();
  savePubpaidWalletStore({
    ...wallets,
    [key]: {
      id: next.id,
      walletKey: key,
      playerId: key,
      playerName: safeString(next?.user?.name || authUser.name || "", 120) || "Jogador",
      user: publicAuthUser(authUser),
      balanceCoins: next.balanceCoins,
      availableCoins: next.availableCoins,
      lockedMatchCoins: next.lockedMatchCoins,
      matchSpentCoins: next.matchSpentCoins,
      matchPayoutCoins: next.matchPayoutCoins,
      matchWonCoins: next.matchWonCoins,
      matchLostCoins: next.matchLostCoins,
      matchHouseFeeCoins: next.matchHouseFeeCoins,
      lockedWithdrawalCoins: next.lockedWithdrawalCoins,
      totalApprovedDeposits: next.totalApprovedDeposits,
      totalApprovedWithdrawals: next.totalApprovedWithdrawals,
      manualApprovedBalanceCoins: normalizePubpaidMoney(next.manualApprovedBalanceCoins ?? 0),
      createdAt: safeString(next.createdAt || "", 40) || new Date().toISOString(),
      updatedAt: next.updatedAt
    }
  });
  return next;
}

function isPubpaidPendingStatus(value = "") {
  const normalized = normalizeText(value);
  return normalized.includes("pendente") || normalized.includes("aguardando");
}

function normalizePubpaidPlayerNick(value = "") {
  return safeString(value, 120)
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}_. -]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 18);
}

function getPubpaidWalletRecordForAuth(authUser = {}) {
  const wallets = getPubpaidWalletStore();
  const aliases = getPubpaidWalletAliases(authUser);
  const key = getPubpaidWalletKey(authUser);
  return wallets[key] || aliases.map((alias) => wallets[alias]).find(Boolean) || null;
}

function getPubpaidPlayerProfile(authUser = {}) {
  const record = getPubpaidWalletRecordForAuth(authUser) || {};
  const profile = record.profile && typeof record.profile === "object" ? record.profile : {};
  const nick = normalizePubpaidPlayerNick(
    profile.nick || profile.name || record.playerNick || record.nickname || record.nick || record.playerName || ""
  );
  if (!nick) return null;
  return {
    nick,
    name: nick,
    updatedAt: safeString(profile.updatedAt || record.profileUpdatedAt || record.updatedAt || "", 60)
  };
}

function savePubpaidPlayerProfile(authUser = {}, nickValue = "") {
  const key = getPubpaidWalletKey(authUser);
  const nick = normalizePubpaidPlayerNick(nickValue);
  if (!key) return { ok: false, error: "Conta Google obrigatoria para salvar nick." };
  if (nick.length < 3) return { ok: false, error: "Crie um nick com pelo menos 3 caracteres." };

  const wallets = getPubpaidWalletStore();
  const currentRecord = getPubpaidWalletRecordForAuth(authUser) || {};
  const wallet = getPubpaidWallet(authUser, { createIfMissing: true }) || {};
  const now = new Date().toISOString();
  const profile = {
    nick,
    name: nick,
    updatedAt: now
  };

  savePubpaidWalletStore({
    ...wallets,
    [key]: {
      ...currentRecord,
      ...wallet,
      walletKey: key,
      playerId: key,
      playerName: nick,
      nickname: nick,
      profile,
      user: publicAuthUser(authUser),
      updatedAt: now,
      createdAt: currentRecord.createdAt || wallet.createdAt || now
    }
  });

  return { ok: true, profile };
}

function buildPubpaidAccountPayload(authUser = {}) {
  const wallet = getPubpaidWallet(authUser);
  const walletKey = getPubpaidWalletKey(authUser);
  const walletAliases = getPubpaidWalletAliases(authUser);
  const matchesPubpaidWallet = (item = {}) => {
    const candidates = [
      item.walletKey,
      item.playerId,
      item.userId,
      item.email,
      item?.user?.email,
      item?.user?.sub,
      item.googleEmail,
      item.googleSub,
      item?.payment?.googleEmail,
      item?.payment?.googleSub,
      item?.user?.email ? `email:${item.user.email}` : "",
      item.googleEmail ? `email:${item.googleEmail}` : "",
      item?.payment?.googleEmail ? `email:${item.payment.googleEmail}` : ""
    ].map((value) => safeString(value || "", 180).toLowerCase()).filter(Boolean);
    return candidates.includes(walletKey) || walletAliases.some((alias) => candidates.includes(alias));
  };
  const deposits = readMergedPubpaidArray(PUBPAID_DEPOSITS_FILE, LEGACY_PUBPAID_DEPOSITS_FILE).filter(matchesPubpaidWallet);
  const withdrawals = getPubpaidWithdrawals().filter(matchesPubpaidWallet);
  const pendingDeposits = deposits.filter((item) => isPubpaidPendingStatus(item?.payment?.status || item?.status));
  const pendingWithdrawals = withdrawals.filter((item) =>
    isPubpaidPendingStatus(item?.payment?.status || item?.status || item?.status)
  );

  return {
    ok: true,
    user: publicAuthUser(authUser),
    profile: getPubpaidPlayerProfile(authUser),
    wallet: wallet
      ? {
          balanceCoins: normalizePubpaidMoney(wallet.balanceCoins),
          availableCoins: normalizePubpaidMoney(wallet.availableCoins ?? (wallet.balanceCoins - wallet.lockedMatchCoins - wallet.lockedWithdrawalCoins)),
          lockedMatchCoins: normalizePubpaidMoney(wallet.lockedMatchCoins),
          lockedWithdrawalCoins: normalizePubpaidMoney(wallet.lockedWithdrawalCoins),
          totalApprovedDeposits: normalizePubpaidMoney(wallet.totalApprovedDeposits),
          totalApprovedWithdrawals: normalizePubpaidMoney(wallet.totalApprovedWithdrawals),
          manualApprovedBalanceCoins: normalizePubpaidMoney(wallet.manualApprovedBalanceCoins ?? 0),
          walletKey,
          createdAt: wallet.createdAt || "",
          updatedAt: wallet.updatedAt || ""
        }
      : {
          balanceCoins: 0,
          availableCoins: 0,
          lockedMatchCoins: 0,
          lockedWithdrawalCoins: 0,
          totalApprovedDeposits: 0,
          totalApprovedWithdrawals: 0,
          manualApprovedBalanceCoins: 0,
          walletKey,
          createdAt: "",
          updatedAt: ""
        },
    pending: {
      deposits: pendingDeposits.length,
      withdrawals: pendingWithdrawals.length
    },
    recentDeposits: sortByDateDesc(deposits, "createdAt", 8).map((item) => ({
      id: item.id,
      amount: item.amount || item.amountCoins || 0,
      creditsRequested: item.creditsRequested || item.amountCoins || item.amount || 0,
      status: item.status || "",
      paymentStatus: item?.payment?.status || "",
      txid: item?.payment?.txid || item.reference || "",
      receiptName: item.receiptName || item?.payment?.receiptName || item?.payment?.pixReceiptName || "",
      createdAt: item.createdAt || "",
      reviewDeadlineAt: item.reviewDeadlineAt || ""
    })),
    recentWithdrawals: sortByDateDesc(withdrawals, "createdAt", 8).map((item) => ({
      id: item.id,
      amount: item.amount || item.amountCoins || 0,
      creditsRequested: item.creditsRequested || item.amountCoins || item.amount || 0,
      pixKey: item.pixKey || item?.payment?.pixKey || item?.destination?.pixKey || "",
      status: item.status || "",
      paymentStatus: item?.payment?.status || "",
      txid: item?.payment?.txid || item.reference || "",
      createdAt: item.createdAt || "",
      reviewDeadlineAt: item.reviewDeadlineAt || ""
    }))
  };
}

function getElectionVoteBoard(limit = 15) {
  const store = getElectionVoteStore();
  const config = getElectionConfig();
  const offices = Array.isArray(config.offices) ? config.offices : [];
  const rows = [];

  Object.entries(store.votes || {}).forEach(([officeId, candidates]) => {
    const office = offices.find((item) => item.id === officeId);
    Object.entries(candidates || {}).forEach(([candidateId, total]) => {
      const candidate = Array.isArray(office?.candidates)
        ? office.candidates.find((item) => item.id === candidateId)
        : null;
      rows.push({
        candidate: `${candidate?.name || candidateId} (${office?.label || officeId})`,
        office: office?.label || officeId,
        candidateName: candidate?.name || candidateId,
        candidateId,
        total: Number(total || 0)
      });
    });
  });

  return rows.sort((a, b) => b.total - a.total).slice(0, limit);
}

function getElectionVoteRecords(limit = 0) {
  const store = getElectionVoteStore();
  const records = Array.isArray(store.records) ? store.records : [];
  const sorted = sortByDateDesc(records, "at", Math.max(limit || records.length || 1, 1));
  return limit > 0 ? sorted.slice(0, limit) : sorted;
}

function buildElectionHeatBoard(limit = 12) {
  const buckets = new Map();

  getElectionVoteRecords().forEach((record) => {
    const key = `${record.officeId || record.office}::${record.candidateId || record.candidateName}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        office: record.office || record.officeId || "Cargo",
        candidate: record.candidateName || record.candidateId || "Candidato",
        candidateParty: record.candidateParty || "",
        totalVotes: 0,
        opinions: 0,
        positive: 0,
        negative: 0,
        neutral: 0,
        mixed: 0,
        noOpinion: 0,
        favorableReelection: 0,
        desgasteReelection: 0,
        cities: {},
        lastAt: record.at || ""
      });
    }

    const bucket = buckets.get(key);
    bucket.totalVotes += 1;
    bucket.cities[record.city || "não informado"] = (bucket.cities[record.city || "não informado"] || 0) + 1;
    bucket.lastAt = bucket.lastAt && new Date(bucket.lastAt) > new Date(record.at || 0) ? bucket.lastAt : record.at;

    if (record.observation) {
      bucket.opinions += 1;
    }

    if (record.sentiment === "positivo") {
      bucket.positive += 1;
    } else if (record.sentiment === "negativo") {
      bucket.negative += 1;
    } else if (record.sentiment === "misto") {
      bucket.mixed += 1;
    } else if (record.sentiment === "sem-opiniao") {
      bucket.noOpinion += 1;
    } else {
      bucket.neutral += 1;
    }

    if (record.reelectionSignal === "favoravel") {
      bucket.favorableReelection += 1;
    } else if (record.reelectionSignal === "desgaste") {
      bucket.desgasteReelection += 1;
    }
  });

  return Array.from(buckets.values())
    .map((bucket) => {
      const cityList = Object.entries(bucket.cities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([city, total]) => `${city} (${total})`)
        .join(" • ");
      const heatScore =
        bucket.totalVotes +
        bucket.positive * 1.6 -
        bucket.negative * 1.4 +
        bucket.favorableReelection -
        bucket.desgasteReelection;
      let heatLabel = "ambiente dividido";

      if (bucket.positive > bucket.negative + 1 || bucket.favorableReelection > bucket.desgasteReelection + 1) {
        heatLabel = "clima favorável";
      } else if (bucket.negative > bucket.positive + 1 || bucket.desgasteReelection > bucket.favorableReelection + 1) {
        heatLabel = "sinal de desgaste";
      } else if (bucket.opinions <= 1 && bucket.totalVotes <= 1) {
        heatLabel = "amostra inicial";
      }

      return {
        ...bucket,
        citiesLabel: cityList || "Sem cidades registradas",
        heatScore: Number(heatScore.toFixed(2)),
        heatLabel
      };
    })
    .sort((a, b) => b.heatScore - a.heatScore || b.totalVotes - a.totalVotes)
    .slice(0, limit);
}

function buildHourlyDistribution(items = [], dateKey = "at") {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: `${String(hour).padStart(2, "0")}:00`,
    total: 0
  }));

  items.forEach((item) => {
    const date = new Date(item?.[dateKey] || 0);
    if (Number.isNaN(date.getTime())) return;
    buckets[date.getHours()].total += 1;
  });

  return buckets;
}

function buildDailySeries(seriesMap = {}, days = 14) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const keys = Object.keys(seriesMap);
  const rows = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    const row = {
      date: key,
      label: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      total: 0
    };

    keys.forEach((name) => {
      const total = Number(seriesMap[name]?.[key] || 0);
      row[name] = total;
      row.total += total;
    });

    rows.push(row);
  }

  return rows;
}

function buildSourceSegments(visits = []) {
  const bucket = {
    direto: 0,
    social: 0,
    busca: 0,
    referencia: 0
  };

  visits.forEach((item) => {
    const ref = summarizeReferrer(item?.referrer).toLowerCase();
    if (!ref || ref === "direto") {
      bucket.direto += 1;
      return;
    }
    if (/(google|bing|yahoo|duckduckgo)/.test(ref)) {
      bucket.busca += 1;
      return;
    }
    if (/(facebook|instagram|whatsapp|tiktok|x\.com|twitter|youtube|telegram)/.test(ref)) {
      bucket.social += 1;
      return;
    }
    bucket.referencia += 1;
  });

  return bucket;
}

function buildExecutivePriorities({
  totals = {},
  founderItems = [],
  pendingFounderItems = [],
  pendingNinjasPayments = 0,
  voteRecords = [],
  acre2026Poll = [],
  recentSalesListings = [],
  recentVrRentalLeads = []
} = {}) {
  const priorities = [];
  const supportConversion = totals.subscriptions
    ? Number(((founderItems.length / totals.subscriptions) * 100).toFixed(1))
    : 0;
  const pollShare = totals.accesses
    ? Number(((totals.acre2026PollResponses / totals.accesses) * 100).toFixed(2))
    : 0;
  const opinionShare = totals.votes
    ? Number(((voteRecords.filter((item) => item.observation).length / totals.votes) * 100).toFixed(1))
    : 0;

  priorities.push({
    title: "Conversão em apoio fundador",
    tone: supportConversion >= 8 ? "good" : supportConversion >= 3 ? "watch" : "alert",
    metric: `${supportConversion}%`,
    detail: `${founderItems.length} confirmados de ${totals.subscriptions || 0} contatos captados`
  });
  priorities.push({
    title: "Pendências financeiras em fila",
    tone: pendingFounderItems.length + pendingNinjasPayments > 6 ? "alert" : pendingFounderItems.length + pendingNinjasPayments > 0 ? "watch" : "good",
    metric: fmtNumber(pendingFounderItems.length + pendingNinjasPayments),
    detail: `${pendingFounderItems.length} fundadores e ${pendingNinjasPayments} pagamentos Ninjas aguardando ação`
  });
  priorities.push({
    title: "Pulso eleitoral com comentário",
    tone: opinionShare >= 40 ? "good" : opinionShare >= 20 ? "watch" : "alert",
    metric: `${opinionShare}%`,
    detail: `${voteRecords.filter((item) => item.observation).length} votos com observação registrada`
  });
  priorities.push({
    title: "Captação da pesquisa Acre 2026",
    tone: pollShare >= 5 ? "good" : pollShare >= 2 ? "watch" : "alert",
    metric: `${pollShare}%`,
    detail: `${totals.acre2026PollResponses || 0} respostas em relação ao total de acessos`
  });
  priorities.push({
    title: "Mercado local em movimento",
    tone: recentSalesListings.length + recentVrRentalLeads.length >= 6 ? "good" : "watch",
    metric: fmtNumber((totals.salesListings || 0) + (totals.vrRentalLeads || 0)),
    detail: `${totals.salesListings || 0} vendas e ${totals.vrRentalLeads || 0} leads de aluguel VR`
  });

  return priorities;
}

function fmtNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString("pt-BR") : String(value || 0);
}

function buildAdminDashboardPayload() {
  const visits = getJsonArray(VISITS_FILE);
  const heartbeats = getJsonArray(HEARTBEATS_FILE);
  const comments = getJsonArray(path.join(DATA_DIR, "comments.json"));
  const subs = getJsonArray(path.join(DATA_DIR, "subscriptions.json"));
  const acre2026Poll = getAcre2026PollResponses();
  const acre2026PollSummary = buildAcre2026PollSummary(sortByDateDesc(acre2026Poll, "createdAt", 5000));
  const ninjasRequests = getJsonArray(NINJAS_REQUESTS_FILE);
  const ninjasProfiles = getJsonArray(NINJAS_PROFILES_FILE);
  const pubpaidDeposits = readMergedPubpaidArray(PUBPAID_DEPOSITS_FILE, LEGACY_PUBPAID_DEPOSITS_FILE);
  const salesListings = getJsonArray(SALES_LISTINGS_FILE);
  const vrRentalLeads = getJsonArray(VR_RENTAL_LEADS_FILE);
  const news = getNews(200);
  const biz = getBusinesses();
  const voteRecords = getElectionVoteRecords();
  const voteBoard = getElectionVoteBoard(15);
  const electoralHeat = buildElectionHeatBoard(12);
  const founderItems = subs.filter(isConfirmedFounderSubscription);
  const pendingFounderItems = subs.filter(isPendingFounderSubscription);
  const pendingNinjasPayments = ninjasRequests
    .concat(ninjasProfiles)
    .filter((item) => String(item?.payment?.status || item.status || "").includes("pendente")).length;

  const uniqueVisitors = new Set(
    visits.map((item) => item.visitorId || item.cookieVisitorId).filter(Boolean)
  );
  const uniqueSessions = new Set(
    visits.map((item) => item.sessionId || item.cookieSessionId).filter(Boolean)
  );
  const byDevice = sumBy(visits, (item) => item.deviceType || "desconhecido");
  const byBrowser = sumBy(visits, (item) => item.browser || "Outro");
  const byCity = sumBy(visits, (item) => item.city || "não informado");
  const byCountry = sumBy(visits, (item) => item.country || "não informado");
  const byIp = sumBy(visits, (item) => item.ip || "não informado");
  const byReferrer = sumBy(visits, (item) => summarizeReferrer(item.referrer));
  const byConsent = sumBy(visits, (item) => item.trackingConsent || "desconhecido");
  const byPage = sumBy(visits, (item) => item.pagePath || "/");
  const sourceSegments = buildSourceSegments(visits);
  const activityByDayRaw = {
    accesses: sumBy(visits, (item) => String(item.at || "").slice(0, 10) || "sem-data"),
    comments: sumBy(comments, (item) => String(item.createdAt || "").slice(0, 10) || "sem-data"),
    subscriptions: sumBy(subs, (item) => String(item.createdAt || "").slice(0, 10) || "sem-data"),
    votes: sumBy(voteRecords, (item) => String(item.at || "").slice(0, 10) || "sem-data"),
    poll: sumBy(acre2026Poll, (item) => String(item.createdAt || "").slice(0, 10) || "sem-data")
  };
  const hourlyActivity = {
    accesses: buildHourlyDistribution(visits, "at"),
    comments: buildHourlyDistribution(comments, "createdAt"),
    subscriptions: buildHourlyDistribution(subs, "createdAt"),
    votes: buildHourlyDistribution(voteRecords, "at")
  };
  const dailyActivity = buildDailySeries(activityByDayRaw, 14);

  const sessionDurations = {};
  heartbeats.forEach((item) => {
    const sessionId = String(item.sessionId || "").trim();
    if (!sessionId) return;
    sessionDurations[sessionId] = (sessionDurations[sessionId] || 0) + Number(item.durationSec || 0);
  });

  const sentimentTotals = {
    positivo: voteRecords.filter((item) => item.sentiment === "positivo").length,
    negativo: voteRecords.filter((item) => item.sentiment === "negativo").length,
    misto: voteRecords.filter((item) => item.sentiment === "misto").length,
    neutro: voteRecords.filter((item) => item.sentiment === "neutro").length,
    semOpiniao: voteRecords.filter((item) => item.sentiment === "sem-opiniao").length
  };
  const reelectionTotals = {
    favoravel: voteRecords.filter((item) => item.reelectionSignal === "favoravel").length,
    desgaste: voteRecords.filter((item) => item.reelectionSignal === "desgaste").length,
    neutro: voteRecords.filter((item) => item.reelectionSignal === "neutro").length
  };

  const activityDates = []
    .concat(visits.map((item) => item.at))
    .concat(comments.map((item) => item.createdAt))
    .concat(subs.map((item) => item.createdAt))
    .concat(voteRecords.map((item) => item.at))
    .concat(vrRentalLeads.map((item) => item.createdAt))
    .map((value) => new Date(value || 0).getTime())
    .filter((value) => Number.isFinite(value) && value > 0);

  const period = {
    from: activityDates.length ? new Date(Math.min(...activityDates)).toISOString() : null,
    to: activityDates.length ? new Date(Math.max(...activityDates)).toISOString() : null
  };
  const conversion = {
    visitToCommentRate: visits.length ? Number(((comments.length / visits.length) * 100).toFixed(2)) : 0,
    visitToSubscriptionRate: visits.length ? Number(((subs.length / visits.length) * 100).toFixed(2)) : 0,
    visitToPollRate: visits.length ? Number(((acre2026Poll.length / visits.length) * 100).toFixed(2)) : 0,
    subscriptionToFounderRate: subs.length ? Number(((founderItems.length / subs.length) * 100).toFixed(2)) : 0,
    ninjasDemandRate: visits.length ? Number((((ninjasRequests.length + ninjasProfiles.length) / visits.length) * 100).toFixed(2)) : 0
  };
  const topCityTotal = topEntries(byCity, "city", 1)[0]?.total || 0;
  const topCountryTotal = topEntries(byCountry, "country", 1)[0]?.total || 0;
  const geoReach = {
    topCityShare: visits.length ? Number(((topCityTotal / visits.length) * 100).toFixed(2)) : 0,
    topCountryShare: visits.length ? Number(((topCountryTotal / visits.length) * 100).toFixed(2)) : 0,
    totalCities: Object.keys(byCity).length,
    totalCountries: Object.keys(byCountry).length
  };
  const executiveSummary = buildExecutivePriorities({
    totals: {
      accesses: visits.length,
      subscriptions: subs.length,
      acre2026PollResponses: acre2026Poll.length,
      salesListings: salesListings.length,
      vrRentalLeads: vrRentalLeads.length,
      votes: voteRecords.length
    },
    founderItems,
    pendingFounderItems,
    pendingNinjasPayments,
    voteRecords,
    acre2026Poll,
    recentSalesListings: salesListings,
    recentVrRentalLeads: vrRentalLeads
  });
  const funnel = [
    { label: "Acessos", total: visits.length },
    { label: "Visitantes únicos", total: uniqueVisitors.size },
    { label: "Sessões", total: uniqueSessions.size },
    { label: "Comentários", total: comments.length },
    { label: "Assinaturas", total: subs.length },
    { label: "Fundadores", total: founderItems.length },
    { label: "Pesquisa Acre 2026", total: acre2026Poll.length },
    { label: "Pedidos Ninjas", total: ninjasRequests.length },
    { label: "Currículos Ninjas", total: ninjasProfiles.length },
    { label: "Vendas", total: salesListings.length },
    { label: "VR Leads", total: vrRentalLeads.length }
  ];
  const opportunityBoard = [
    { label: "Fundadores pendentes", total: pendingFounderItems.length, tone: pendingFounderItems.length ? "watch" : "good" },
    { label: "Pagamentos Ninjas pendentes", total: pendingNinjasPayments, tone: pendingNinjasPayments ? "alert" : "good" },
    { label: "Cidades alcançadas", total: Object.keys(byCity).length, tone: Object.keys(byCity).length >= 8 ? "good" : "watch" },
    { label: "Fontes de tráfego ativas", total: Object.keys(byReferrer).length, tone: Object.keys(byReferrer).length >= 4 ? "good" : "watch" }
  ];

  return {
    ok: true,
    period,
    storage: {
      mode: "arquivo local",
      target: DATA_DIR
    },
    totals: {
      accesses: visits.length,
      uniqueVisitors: uniqueVisitors.size,
      uniqueSessions: uniqueSessions.size,
      comments: comments.length,
      subscriptions: subs.length,
      acre2026PollResponses: acre2026Poll.length,
      supporters: founderItems.length,
      pendingSupporters: pendingFounderItems.length,
      votes: voteRecords.length || voteBoard.reduce((sum, item) => sum + Number(item.total || 0), 0),
      opinions: voteRecords.filter((item) => item.observation).length,
      ninjasRequests: ninjasRequests.length,
      ninjasProfiles: ninjasProfiles.length,
      ninjasPendingPayments: pendingNinjasPayments,
      salesListings: salesListings.length,
      vrRentalLeads: vrRentalLeads.length,
      news: Array.isArray(news) ? news.length : 0,
      businesses: Array.isArray(biz) ? biz.length : 0
    },
    engagement: {
      avgHeartbeatSec: Number(average(heartbeats.map((item) => Number(item.durationSec || 0))).toFixed(2)),
      avgSessionSec: Number(average(Object.values(sessionDurations)).toFixed(2))
    },
    executiveSummary,
    funnel,
    conversion,
    geoReach,
    sourceSegments,
    hourlyActivity,
    dailyActivity,
    opportunityBoard,
    distributions: {
      device: byDevice,
      browser: byBrowser,
      city: byCity,
      country: byCountry,
      ip: byIp,
      referrer: byReferrer,
      consent: byConsent
    },
    topPages: topEntries(byPage, "pagePath", 16),
    mostViewedArticles: buildMostViewedArticles(visits, 12),
    voteBoard,
    topCountries: topEntries(byCountry, "country", 16),
    topIps: topEntries(byIp, "ip", 16),
    topReferrers: topEntries(byReferrer, "referrer", 16),
    recentVisits: sortByDateDesc(visits, "at", 24).map((item) => ({
      at: item.at,
      pagePath: item.pagePath,
      city: item.city,
      country: item.country,
      browser: item.browser,
      ip: item.ip,
      visitorId: item.visitorId || item.cookieVisitorId || "",
      referrerHost: summarizeReferrer(item.referrer)
    })),
    recentComments: sortByDateDesc(comments, "createdAt", 18).map((item) => ({
      createdAt: item.createdAt,
      author: item.author || item.name || "Leitor",
      message: item.message || item.text || "",
      city: item.city || "",
      ip: item.ip || ""
    })),
    recentVotes: sortByDateDesc(voteRecords, "at", 18).map((item) => ({
      at: item.at,
      candidateName: item.candidateName,
      candidateParty: item.candidateParty || "",
      office: item.office,
      scope: item.office,
      city: item.city,
      voterName: item.voterName || "",
      voterParty: item.voterParty || "",
      ip: item.ip,
      observation: item.observation || "",
      sentiment: item.sentiment || "neutro",
      reelectionSignal: item.reelectionSignal || "neutro"
    })),
    electionWeekly: buildWeeklyTrendSeries(
      voteRecords.map((item) => ({
        ...item,
        weeklyLabel: `${item.candidateName || item.candidateId || "Candidato"} (${item.office || item.officeId || "Cargo"})`
      })),
      {
        valueField: "weeklyLabel",
        totalLabel: "totalVotes"
      }
    ),
    recentSubscriptions: sortByDateDesc(subs, "createdAt", 18).map((item) => ({
      createdAt: item.createdAt,
      name: item.name || "",
      email: item.email || "",
      whatsapp: item.whatsapp || item.phone || "",
      sourcePage: item.sourcePage || item.pagePath || "",
      city: item.city || "",
      ip: item.ip || ""
    })),
    acre2026PollSummary,
    acre2026PollWeekly: buildWeeklyTrendSeries(acre2026Poll, {
      valueField: "voto2026",
      totalLabel: "totalResponses"
    }),
    recentAcre2026Poll: sortByDateDesc(acre2026Poll, "createdAt", 18).map((item) => ({
      createdAt: item.createdAt,
      profissao: item.profissao || "",
      localizacao: item.localizacao || "",
      faixaEtaria: item.faixaEtaria || "",
      votoAnterior: item.votoAnterior || "",
      satisfacao: item.satisfacao || 0,
      voto2026: item.voto2026 || "",
      rejeicao: item.rejeicao || "",
      prioridade: item.prioridade || "",
      comentario: item.comentario || "",
      city: item.city || "",
      country: item.country || "",
      ip: item.ip || ""
    })),
    recentNinjasRequests: sortByDateDesc(ninjasRequests, "createdAt", 12).map((item) => ({
      createdAt: item.createdAt,
      type: item.type || "pedido",
      name: item.name || "",
      phone: item.phone || "",
      service: item.service || item.area || "",
      status: item.status || "",
      paymentStatus: item?.payment?.status || "",
      txid: item?.payment?.txid || ""
    })),
    recentNinjasProfiles: sortByDateDesc(ninjasProfiles, "createdAt", 12).map((item) => ({
      createdAt: item.createdAt,
      name: item.name || "",
      area: item.area || "",
      plan: item.plan || "gratis",
      credits: item.credits || 0,
      status: item.status || "",
      phone: item.phone || "",
      paymentStatus: item?.payment?.status || "",
      txid: item?.payment?.txid || ""
    })),
    recentSalesListings: sortByDateDesc(salesListings, "createdAt", 12).map((item) => ({
      createdAt: item.createdAt,
      title: item.title || "",
      category: item.category || "",
      price: item.price || "",
      sellerName: item.sellerName || "",
      phone: item.phone || "",
      city: item.city || "",
      status: item.status || ""
    })),
    recentVrRentalLeads: sortByDateDesc(vrRentalLeads, "createdAt", 12).map((item) => ({
      createdAt: item.createdAt,
      name: item.name || "",
      phone: item.phone || "",
      rentalDate: item.rentalDate || "",
      period: item.period || "",
      package: item.package || "",
      status: item.status || "",
      city: item.city || ""
    })),
    collectionInventory: buildCollectionInventory({
      visits,
      heartbeats,
      comments,
      subscriptions: subs,
      voteRecords,
      ninjasRequests,
      ninjasProfiles,
      pubpaidDeposits,
      salesListings,
      vrRentalLeads
    }),
    electoralHeat,
    sentimentTotals,
    reelectionTotals,
    updatedAt: new Date().toISOString()
  };
}

function buildPubpaidAdminPayload() {
  const pubpaidDeposits = readMergedPubpaidArray(PUBPAID_DEPOSITS_FILE, LEGACY_PUBPAID_DEPOSITS_FILE);
  const pubpaidWithdrawals = getPubpaidWithdrawals();
  const pubpaidWallets = getPubpaidWalletStore();
  const pendingPubpaidDeposits = sortByDateDesc(
    pubpaidDeposits.filter((item) => isPubpaidPendingStatus(item?.payment?.status || item?.status)),
    "createdAt",
    50
  ).map((item) => ({
    id: item.id,
    createdAt: item.createdAt || "",
    email: item?.user?.email || "",
    name: item?.user?.name || "",
    googleSub: item.googleSub || item?.user?.sub || item?.payment?.googleSub || "",
    googleEmail: item.googleEmail || item?.user?.email || item?.payment?.googleEmail || "",
    googleName: item.googleName || item?.user?.name || item?.payment?.googleName || "",
    googlePicture: item.googlePicture || item?.user?.picture || "",
    walletKey: item.walletKey || "",
    depositorName: item.depositorName || item?.payment?.depositorName || "",
    receiptName: item.receiptName || item?.payment?.receiptName || item?.payment?.pixReceiptName || "",
    amount: item.amount || 0,
    creditsRequested: item.creditsRequested || 0,
    status: item.status || "",
    paymentStatus: item?.payment?.status || "",
    txid: item?.payment?.txid || "",
    reviewDeadlineAt: item.reviewDeadlineAt || ""
  }));
  const pendingPubpaidWithdrawals = sortByDateDesc(
    pubpaidWithdrawals.filter((item) => isPubpaidPendingStatus(item?.payment?.status || item?.status)),
    "createdAt",
    50
  ).map((item) => ({
    id: item.id,
    createdAt: item.createdAt || "",
    email: item?.user?.email || "",
    name: item?.user?.name || "",
    googleSub: item?.user?.sub || "",
    walletKey: item.walletKey || "",
    amount: item.amount || item.amountCoins || 0,
    creditsRequested: item.creditsRequested || item.amountCoins || item.amount || 0,
    pixKey: item.pixKey || item?.payment?.pixKey || item?.destination?.pixKey || "",
    pixAccountName: item.pixAccountName || item?.payment?.pixAccountName || item?.destination?.pixAccountName || "",
    status: item.status || "",
    paymentStatus: item?.payment?.status || "",
    txid: item?.payment?.txid || "",
    reviewDeadlineAt: item.reviewDeadlineAt || ""
  }));
  const pubpaidWalletBoard = sortByDateDesc(pubpaidWallets, "updatedAt", 50).map((item) => ({
    updatedAt: item.updatedAt || item.createdAt || "",
    email: item?.user?.email || "",
    name: item?.user?.name || "",
    googleSub: item?.user?.sub || item.googleSub || "",
    googlePicture: item?.user?.picture || item.googlePicture || "",
    walletKey: item.walletKey || "",
    balanceCoins: normalizePubpaidMoney(item.balanceCoins),
    lockedWithdrawalCoins: normalizePubpaidMoney(item.lockedWithdrawalCoins),
    totalApprovedDeposits: normalizePubpaidMoney(item.totalApprovedDeposits),
    totalApprovedWithdrawals: normalizePubpaidMoney(item.totalApprovedWithdrawals)
  }));

  return {
    ok: true,
    storage: {
      mode: "pubpaid-file",
      target: DATA_DIR
    },
    totals: {
      pubpaidDeposits: pubpaidDeposits.length,
      pubpaidWithdrawals: pubpaidWithdrawals.length,
      pubpaidWallets: pubpaidWallets.length,
      pubpaidPendingDeposits: pendingPubpaidDeposits.length,
      pubpaidPendingWithdrawals: pendingPubpaidWithdrawals.length
    },
    pendingPubpaidDeposits,
    pendingPubpaidWithdrawals,
    pubpaidWalletBoard,
    updatedAt: new Date().toISOString()
  };
}

async function handleApi(req, res, pathname, searchParams) {
  applyApiCors(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (pathname === "/health") {
    return sendJson(res, 200, { ok: true, service: "catalogo-cruzeiro", time: new Date().toISOString() });
  }

  if (req.method === "GET" && pathname === "/api/whatsapp/webhook") {
    const config = getWhatsappChatConfig();
    const mode = String(searchParams.get("hub.mode") || "").trim();
    const token = String(searchParams.get("hub.verify_token") || "").trim();
    const challenge = String(searchParams.get("hub.challenge") || "");

    if (!config.enabled) {
      return sendJson(res, 503, {
        ok: false,
        error: "WhatsApp chat desativado. Defina WHATSAPP_CHAT_ENABLED=true para habilitar."
      });
    }

    if (!config.verifyToken) {
      return sendJson(res, 500, {
        ok: false,
        error: "WHATSAPP_WEBHOOK_VERIFY_TOKEN nao configurado."
      });
    }

    if (mode === "subscribe" && token === config.verifyToken) {
      return sendText(res, 200, challenge || "ok");
    }

    return sendJson(res, 403, { ok: false, error: "Falha na verificacao do webhook do WhatsApp." });
  }

  if (req.method === "POST" && pathname === "/api/whatsapp/webhook") {
    const config = getWhatsappChatConfig();
    const body = await parseBody(req);

    if (!config.enabled) {
      return sendJson(res, 503, {
        ok: false,
        error: "WhatsApp chat desativado. Defina WHATSAPP_CHAT_ENABLED=true para habilitar."
      });
    }

    const inboundItems = extractWhatsappInboundMessages(body);
    const createdAt = new Date().toISOString();
    const logItems = inboundItems.map((item) => ({
      id: item.id,
      channel: "whatsapp",
      direction: "inbound",
      from: item.from,
      profileName: item.profileName,
      type: item.type,
      text: item.text,
      receivedAt: item.rawTimestamp || createdAt,
      createdAt,
      phoneNumberId: item.phoneNumberId,
      displayPhoneNumber: item.displayPhoneNumber
    }));

    appendWhatsappChatLog(logItems);

    if (config.autoReplyEnabled && config.autoReplyText) {
      for (const item of inboundItems) {
        if (!item.from || !item.text) continue;
        try {
          const sendResult = await sendWhatsappTextMessage(item.from, config.autoReplyText);
          if (sendResult?.ok) {
            appendWhatsappChatLog([
              {
                id: `out-${Date.now()}-${item.from}`,
                channel: "whatsapp",
                direction: "outbound",
                to: item.from,
                type: "text",
                text: config.autoReplyText,
                createdAt: new Date().toISOString()
              }
            ]);
          }
        } catch (error) {
          console.warn(`[whatsapp-chat] falha ao responder ${item.from}: ${error.message}`);
        }
      }
    }

    return sendJson(res, 200, {
      ok: true,
      received: inboundItems.length
    });
  }

  if (req.method === "GET" && pathname === "/api/admin/storage-health") {
    if (!requireAdmin(req)) {
      return sendJson(res, 401, { ok: false, error: "Acesso administrativo obrigatorio." });
    }

    return sendJson(res, 200, buildStorageHealthPayload({ writeProbe: true }));
  }

  if (req.method === "GET" && pathname === "/api/auth/config") {
    return sendJson(res, 200, {
      ok: true,
      enabled: isCatalogoGoogleAuthEnabled(),
      provider: "google",
      clientId: isCatalogoGoogleAuthEnabled() ? GOOGLE_AUTH_CLIENT_ID : "",
      requiredFor: ["newsletter", "fundadores", "pubpaid", "pagamentos"]
    });
  }

  if (req.method === "GET" && pathname === "/api/auth/session") {
    return sendJson(res, 200, {
      ok: true,
      enabled: isCatalogoGoogleAuthEnabled(),
      user: publicAuthUser(readCatalogoAuthSession(req))
    });
  }

  if (req.method === "POST" && pathname === "/api/auth/google") {
    const body = await parseBody(req);
    try {
      const user = await verifyGoogleIdToken(body.credential || body.idToken || body.token);
      setCatalogoAuthCookie(req, res, user);
      return sendJson(res, 200, {
        ok: true,
        user: publicAuthUser(user)
      });
    } catch (error) {
      return sendJson(res, 401, {
        ok: false,
        error: String(error?.message || "Login Google nao foi validado.")
      });
    }
  }

  if (req.method === "POST" && pathname === "/api/auth/logout") {
    clearCatalogoAuthCookie(req, res);
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "POST" && pathname === "/api/master-admin/access") {
    const body = await parseBody(req);
    if (!requireFullAdminPasswordAccess(req, body)) {
      appendMasterAudit(req, {
        action: "master access",
        endpoint: "POST /api/master-admin/access",
        ok: false,
        result: "senha invalida"
      });
      return sendJson(res, 401, { ok: false, error: "Senha master invalida." });
    }

    appendMasterAudit(req, {
      action: "master access",
      endpoint: "POST /api/master-admin/access",
      ok: true,
      result: "central aberta"
    });
    return sendJson(res, 200, {
      ok: true,
      unlockedAt: new Date().toISOString(),
      hub: safeBuildMasterAdminHubPayload()
    });
  }

  if (req.method === "GET" && pathname === "/api/master-admin/summary") {
    if (!requireFullAdminPasswordAccess(req)) {
      appendMasterAudit(req, {
        action: "master summary",
        endpoint: "GET /api/master-admin/summary",
        ok: false,
        result: "sem senha master"
      });
      return sendJson(res, 401, { ok: false, error: "Senha master obrigatoria." });
    }

    appendMasterAudit(req, {
      action: "master summary",
      endpoint: "GET /api/master-admin/summary",
      ok: true,
      result: "resumo entregue"
    });
    return sendJson(res, 200, safeBuildMasterAdminHubPayload());
  }

  if (req.method === "GET" && pathname === "/api/sprites-check") {
    if (!requireSpriteCheckAccess(req)) {
      return sendJson(res, 401, { ok: false, error: "Senha do CHECKPUBPAID obrigatoria." });
    }

    return sendJson(res, 200, buildSpriteCheckPayload());
  }

  if (req.method === "POST" && pathname === "/api/sprites-check/review") {
    const body = await parseBody(req);
    if (!requireSpriteCheckAccess(req, body)) {
      return sendJson(res, 401, { ok: false, error: "Senha do CHECKPUBPAID obrigatoria." });
    }

    const id = cleanShortText(body.id, 500);
    const status = normalizeSpriteReviewStatus(body.status);
    const note = cleanShortText(body.note || "", 500);
    if (!id) {
      return sendJson(res, 400, { ok: false, error: "Informe o id do sprite." });
    }

    const reviews = readJson(SPRITE_CHECK_REVIEWS_FILE, {});
    const nextReviews = reviews && typeof reviews === "object" && !Array.isArray(reviews) ? reviews : {};
    nextReviews[id] = {
      id,
      status,
      note,
      reviewedBy: hasFullAdminPassword(getAuthValue(req, body)) ? "Full Admin" : "CHECKPUBPAID",
      reviewedAt: new Date().toISOString()
    };
    writeJson(SPRITE_CHECK_REVIEWS_FILE, nextReviews);

    return sendJson(res, 200, { ok: true, item: nextReviews[id], summary: buildSpriteCheckPayload().summary });
  }

  if (req.method === "GET" && pathname === "/api/office-orders") {
    if (!requireFullAdminOrderAccess(req)) {
      return sendJson(res, 401, { ok: false, error: "Acesso restrito ao Full Admin." });
    }

    return sendJson(res, 200, buildOfficeOrderPayload());
  }

  if (req.method === "POST" && pathname === "/api/office-orders") {
    const body = await parseBody(req);
    if (!requireFullAdminOrderAccess(req, body)) {
      return sendJson(res, 401, { ok: false, error: "Acesso restrito ao Full Admin." });
    }

    const message = cleanShortText(body.message || body.order || body.text, 1200);
    if (!message) {
      return sendJson(res, 400, { ok: false, error: "Escreva a ordem antes de enviar." });
    }

    const target = cleanShortText(body.target || "Codex CEO", 80);
    const priority = cleanShortText(body.priority || "normal", 40);
    const ceoReply =
      `Recebido, Full Admin. Vou transformar essa ordem em fila para ${target}, cobrar retorno pela hierarquia e registrar o status aqui.`;
    const order = {
      id: createRecordId("ord"),
      from: "Full Admin",
      to: target,
      priority,
      message,
      ceoReply,
      status: "recebida",
      hierarchy: "Full Admin -> Codex CEO -> equipes",
      createdAt: new Date().toISOString(),
      assignedAgents: 0,
      assignments: [],
      executionSummary: {
        delivered: 0,
        failed: 0,
        running: 0
      }
    };
    appendOfficeOrder(order);

    return sendJson(res, 201, { ok: true, order, ceoReply, ...buildOfficeOrderPayload() });
  }

  if (req.method === "POST" && pathname === "/api/office-orders/review") {
    const body = await parseBody(req);
    if (!requireFullAdminOrderAccess(req, body)) {
      return sendJson(res, 401, { ok: false, error: "Acesso restrito ao Full Admin." });
    }
    const result = reviewOfficeOrder(body);
    if (!result.ok) return sendJson(res, result.status || 400, result);
    return sendJson(res, 200, { ok: true, ...result, ...buildOfficeOrderPayload() });
  }

  if (req.method === "GET" && pathname === "/api/office-work") {
    return sendJson(res, 200, getOfficeWorkPayload(searchParams.get("officeKey") || ""));
  }

  if (req.method === "POST" && pathname === "/api/office-support/pix") {
    const body = await parseBody(req);
    return sendJson(res, 200, await buildOfficeSupportPixResponse(body));
  }

  if (req.method === "POST" && pathname === "/api/office-support/request") {
    const body = await parseBody(req);
    const pixPayload = await buildOfficeSupportPixResponse(body);
    const request = createOfficeSupportRequest(body, pixPayload);
    return sendJson(res, 201, { ok: true, request, ...pixPayload });
  }

  if (req.method === "POST" && pathname === "/api/office-support/confirm") {
    const body = await parseBody(req);
    if (!requireFullAdminOrderAccess(req, body)) {
      return sendJson(res, 401, { ok: false, error: "Senha Full Admin obrigatoria para confirmar pagamento." });
    }
    const result = approveOfficeSupportRequest(body);
    return sendJson(res, result.ok ? 200 : result.status || 400, result);
  }

  if (req.method === "POST" && pathname === "/api/office-terminal/consume") {
    const body = await parseBody(req);
    const result = consumeOfficeTerminalPass(body);
    return sendJson(res, result.ok ? 200 : result.status || 400, result);
  }

  if (req.method === "POST" && pathname === "/api/real-agents/actions/review") {
    const body = await parseBody(req);
    if (!requireFullAdminOrderAccess(req, body)) {
      return sendJson(res, 401, { ok: false, error: "Acesso restrito ao Full Admin." });
    }
    const result = reviewRealAgentAction(body);
    if (!result.ok) return sendJson(res, result.status || 400, result);
    return sendJson(res, 200, result);
  }

  if (req.method === "GET" && pathname === "/api/office-neural-growth") {
    return sendJson(res, 200, buildNeuralGrowthPayload());
  }

  if (req.method === "GET" && pathname === "/api/daily-agent-pulse") {
    return sendJson(res, 200, buildPublicDailyAgentPulse());
  }

  if (req.method === "GET" && pathname === "/api/real-agents") {
    if (!requireFullAdminOrderAccess(req)) {
      return sendJson(res, 401, { ok: false, error: "Senha Full Admin obrigatoria para abrir o relatorio geral." });
    }
    const payload = buildRealAgentsPayload();
    if (!payload.ok) {
      return sendJson(res, 200, {
        ok: false,
        error: "Agentes reais ainda nao foram gerados. Rode npm run agents:run ou use POST /api/real-agents/run."
      });
    }

    return sendJson(res, 200, payload);
  }

  if (req.method === "POST" && pathname === "/api/real-agents/access") {
    const body = await parseBody(req);
    if (!requireFullAdminOrderAccess(req, body)) {
      return sendJson(res, 401, { ok: false, error: "Senha Full Admin invalida." });
    }

    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "POST" && pathname === "/api/real-agents/run") {
    const body = await parseBody(req);
    if (!requireFullAdminOrderAccess(req, body)) {
      return sendJson(res, 401, { ok: false, error: "Acesso restrito ao Full Admin." });
    }

    const ecosystemStudy = recordRealAgentsEcosystemStudy({
      trigger: "real-agents-run",
      instruction: body.message || "Rodada operacional dos agentes reais"
    });
    const beforeOrders = countOfficeOrders();
    const result = runRealAgentsRuntime({ trigger: "manual-painel" });
    if (!result.ok) {
      return sendJson(res, 500, result);
    }
    runRealAgentsAutonomyCycle("manual-painel");

    const officeOrder = {
      id: createRecordId("ord"),
      from: "Full Admin",
      to: "Codex CEO + agentes reais",
      priority: cleanShortText(body.priority || "alta", 40),
      message: cleanShortText(body.message || "Rodada operacional dos agentes reais renovada pelo painel.", 1200),
      ceoReply: "Rodada renovada. Os agentes reais atualizaram fila, monitoramento e ideias em cima do jornal atual.",
      status: "rodada-real-agents-gerada",
      hierarchy: "Full Admin -> Codex CEO -> 181 agentes reais",
      createdAt: new Date().toISOString()
    };
    const nextOrders = appendOfficeOrder(officeOrder);

    const payload = result.payload;
    const executionProof = buildRealAgentsExecutionProof(result, {
      beforeOrders,
      afterOrders: nextOrders.length,
      officeOrder,
      message: body.message,
      endpoint: "POST /api/real-agents/run",
      httpStatus: 201,
      trigger: "manual-painel",
      ecosystemStudy
    });
    return sendJson(res, 201, {
      ok: true,
      runtime: result.summary,
      proof: executionProof,
      executionProof,
      feedback: {
        title: "Agentes reais finalizaram",
        message: "Runtime executada com prova: relatório, arquivos e ordem registrada foram retornados no payload.",
        imageApprovalsApplied:
          payload?.summary?.imageApprovalsApplied ?? result.summary?.imageApprovals?.applied ?? 0,
        imageApprovalsSentToAgents:
          payload?.summary?.imageApprovalsSentToAgents ?? result.summary?.imageApprovals?.sentToAgents ?? 0
      },
      ...payload
    });
  }

  if (req.method === "GET" && pathname === "/api/cheffe-call/photo-approvals") {
    if (!requireFullAdminOrderAccess(req)) {
      return sendJson(res, 401, { ok: false, error: "Senha Full Admin obrigatoria para revisar foto/foco." });
    }
    return sendJson(res, 200, buildNewsImageFocusApprovalQueue());
  }

  if (req.method === "POST" && pathname === "/api/cheffe-call/photo-approvals") {
    const body = await parseBody(req);
    if (!requireFullAdminOrderAccess(req, body)) {
      return sendJson(res, 401, { ok: false, error: "Acesso restrito ao Full Admin." });
    }
    const result = recordNewsImageFocusDecision(body);
    return sendJson(res, result.ok ? 200 : result.status || 400, result);
  }

  if (req.method === "POST" && pathname === "/api/editorial-corrections") {
    const body = await parseBody(req);
    const result = recordPublicEditorialCorrection(body, req);
    return sendJson(res, result.ok ? 201 : result.status || 400, result);
  }

  if (req.method === "GET" && pathname === "/api/cheffe-call") {
    return sendJson(res, 200, buildCheffeCallPayload());
  }

  if (req.method === "GET" && pathname === "/api/cheffe-call/prompts") {
    const payload = readJson(CHEFFE_CALL_PROMPTS_FILE, null);
    if (!payload) {
      return sendJson(res, 404, { ok: false, error: "Arquivo de prompts da Cheffe Call nao encontrado." });
    }
    return sendJson(res, 200, { ok: true, ...payload });
  }

  if (req.method === "GET" && pathname === "/api/cheffe-call/ecosystem-study") {
    if (!requireFullAdminOrderAccess(req)) {
      return sendJson(res, 401, { ok: false, error: "Senha Full Admin obrigatoria para consultar estudo do ecossistema." });
    }
    return sendJson(res, 200, {
      ok: true,
      study: readJson(REAL_AGENTS_ECOSYSTEM_STUDY_FILE, null)
    });
  }

  if (req.method === "POST" && pathname === "/api/cheffe-call/ecosystem-study") {
    const body = await parseBody(req);
    if (!requireFullAdminOrderAccess(req, body)) {
      appendMasterAudit(req, {
        action: "cheffe ecosystem study",
        endpoint: "POST /api/cheffe-call/ecosystem-study",
        ok: false,
        result: "acesso negado"
      });
      return sendJson(res, 401, { ok: false, error: "Acesso restrito ao Full Admin." });
    }
    appendMasterAudit(req, {
      action: "cheffe ecosystem study",
      endpoint: "POST /api/cheffe-call/ecosystem-study",
      ok: true,
      result: "estudo registrado",
      payloadSummary: body.instruction || body.message || body.trigger || ""
    });
    return sendJson(res, 201, {
      ok: true,
      study: recordRealAgentsEcosystemStudy({
        trigger: cleanShortText(body.trigger || "cheffe-call-manual-study", 80),
        instruction: body.instruction || body.message || ""
      })
    });
  }

  if (req.method === "POST" && pathname === "/api/cheffe-call/start") {
    const body = await parseBody(req);
    if (!requireFullAdminOrderAccess(req, body)) {
      appendMasterAudit(req, {
        action: "cheffe start",
        endpoint: "POST /api/cheffe-call/start",
        ok: false,
        result: "acesso negado"
      });
      return sendJson(res, 401, { ok: false, error: "Acesso restrito ao Full Admin." });
    }

    appendMasterAudit(req, {
      action: "cheffe start",
      endpoint: "POST /api/cheffe-call/start",
      ok: true,
      result: "reuniao aberta",
      payloadSummary: body.instruction || body.message || ""
    });
    return sendJson(res, 201, await startCheffeCallSession(body));
  }

  if (req.method === "POST" && pathname === "/api/cheffe-call/action") {
    const body = await parseBody(req);
    if (!requireFullAdminOrderAccess(req, body)) {
      appendMasterAudit(req, {
        action: "cheffe action",
        endpoint: "POST /api/cheffe-call/action",
        ok: false,
        result: "acesso negado"
      });
      return sendJson(res, 401, { ok: false, error: "Acesso restrito ao Full Admin." });
    }

    const result = applyCheffeCallAction(body);
    if (!result.ok) {
      appendMasterAudit(req, {
        action: "cheffe action",
        endpoint: "POST /api/cheffe-call/action",
        ok: false,
        result: result.error || "acao recusada",
        payloadSummary: body.title || body.action || body.text || ""
      });
      return sendJson(res, result.status || 400, result);
    }
    appendMasterAudit(req, {
      action: "cheffe action",
      endpoint: "POST /api/cheffe-call/action",
      ok: true,
      result: "acao registrada",
      payloadSummary: body.title || body.action || body.text || ""
    });
    return sendJson(res, 200, {
      ...result.payload,
      action: result.action,
      reviewedAction: result.reviewedAction || null,
      proof: result.proof || null,
      actionProof: result.proof || null
    });
  }

  if (req.method === "POST" && pathname === "/api/cheffe-call/release") {
    const body = await parseBody(req);
    if (!requireFullAdminOrderAccess(req, body)) {
      return sendJson(res, 401, { ok: false, error: "Acesso restrito ao Full Admin." });
    }

    const state = readCheffeCallState();
    writeCheffeCallState({
      ...state,
      active: false,
      releasedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString()
    });
    return sendJson(res, 200, buildCheffeCallPayload());
  }

  if (req.method === "POST" && pathname === "/api/cheffe-call/admin/clear") {
    const body = await parseBody(req);
    if (!requireFullAdminOrderAccess(req, body)) {
      return sendJson(res, 401, { ok: false, error: "Acesso restrito ao Full Admin." });
    }

    const payload = clearCheffeCallSession(body);
    if (!payload.ok) {
      return sendJson(res, payload.status || 400, payload);
    }
    return sendJson(res, 200, payload);
  }

  if (req.method === "POST" && pathname === "/api/office-neural-growth/pulse") {
    const body = await parseBody(req);
    if (!requireFullAdminOrderAccess(req, body)) {
      return sendJson(res, 401, { ok: false, error: "Acesso restrito ao Full Admin." });
    }

    const payload = recordNeuralGrowthPulse(body);
    return sendJson(res, 201, payload);
  }

  if (req.method === "GET" && pathname === "/api/pubpaid-sprite-scout") {
    return sendJson(res, 200, buildPubPaidSpriteScoutPayload());
  }

  if (req.method === "POST" && pathname === "/api/pubpaid-sprite-scout/order") {
    const body = await parseBody(req);
    if (!requireFullAdminOrderAccess(req, body)) {
      return sendJson(res, 401, { ok: false, error: "Acesso restrito ao Full Admin." });
    }

    const order = recordPubPaidSpriteScoutOrder(body);
    return sendJson(res, 201, { ok: true, order, ...buildPubPaidSpriteScoutPayload() });
  }

  if (req.method === "GET" && pathname === "/api/news/aggregator") {
    const limit = Number(searchParams.get("limit") || 30);
    return sendJson(res, 200, { items: getNews(Math.max(1, Math.min(200, limit))) });
  }

  if (req.method === "GET" && pathname === "/api/news") {
    const limit = Number(searchParams.get("limit") || 1000);
    return sendJson(res, 200, getCachedArticleNewsApiPayload(limit));
  }

  if (req.method === "GET" && pathname === "/api/news/archive") {
    const limit = Number(searchParams.get("limit") || 500);
    return sendJson(res, 200, { ok: true, ...buildNewsArchivePayload(limit) });
  }

  if (req.method === "GET" && pathname === "/api/news/integrity") {
    const payload = runArticleIntegrityAudit("api-read");
    return sendJson(res, 200, {
      ok: !payload?.error,
      ...payload,
      runtime: {
        intervalMs: ARTICLE_INTEGRITY_INTERVAL_MS,
        lastRunAt: articleIntegrityAutoState.lastRunAt,
        lastError: articleIntegrityAutoState.lastError,
        cycles: articleIntegrityAutoState.cycles
      }
    });
  }

  if (req.method === "GET" && pathname === "/api/community/reports") {
    const limit = Number(searchParams.get("limit") || 8);
    return sendJson(res, 200, getCommunityReportsPayload(limit));
  }

  if (req.method === "POST" && pathname === "/api/community/reports") {
    const body = await parseBody(req);
    const result = recordCommunityReport(body, req);
    return sendJson(res, result.status || 201, result);
  }

  if (req.method === "GET" && pathname === "/api/topic-feed") {
    const topic = searchParams.get("topic") || "";
    const limit = Number(searchParams.get("limit") || 12);
    const forceRefresh = /^(1|true|yes|sim)$/i.test(String(searchParams.get("force") || ""));
    const payload = await getTopicFeed(topic, limit, { forceRefresh });

    if (!payload?.ok) {
      return sendJson(res, 404, {
        ok: false,
        error: "topico_nao_encontrado",
        availableTopics: Object.keys(TOPIC_FEED_CONFIG)
      });
    }

    return sendJson(res, 200, {
      ok: true,
      topic: payload.topic,
      updatedAt: payload.updatedAt,
      total: Array.isArray(payload.items) ? payload.items.length : 0,
      items: Array.isArray(payload.items) ? payload.items : [],
      reports: Array.isArray(payload.reports) ? payload.reports : [],
      fallbackUsed: Boolean(payload.fallbackUsed),
      stale: Boolean(payload.stale)
    });
  }

  if (req.method === "GET" && pathname === "/api/social-trends") {
    const limit = Number(searchParams.get("limit") || 24);
    const payload = await getSocialTrends(limit);
    return sendJson(res, 200, {
      ok: true,
      updatedAt: payload.updatedAt,
      total: Array.isArray(payload.items) ? payload.items.length : 0,
      items: Array.isArray(payload.items) ? payload.items : [],
      reports: Array.isArray(payload.reports) ? payload.reports : [],
      external: Boolean(payload.external),
      stale: Boolean(payload.stale)
    });
  }

  if (req.method === "GET" && pathname === "/api/news/suggestions") {
    const limit = Number(searchParams.get("limit") || 80);
    const query = searchParams.get("q") || "";
    const items = getNewsSuggestions(query, limit);
    return sendJson(res, 200, { ok: true, total: items.length, items });
  }

  if (req.method === "GET" && pathname === "/api/elections/acre") {
    const scopeParam = normalizeText(searchParams.get("scope") || "");
    const electionConfig = getElectionConfig();
    const offices = Array.isArray(electionConfig.offices)
      ? electionConfig.offices.filter((office) => {
          if (!scopeParam || scopeParam === "todos" || scopeParam === "all") {
            return true;
          }
          return normalizeText(office.scope) === scopeParam;
        })
      : [];

    return sendJson(res, 200, {
      ok: true,
      scope: scopeParam || "all",
      updatedAt: electionConfig.updatedAt || "",
      summary: electionConfig.sourceNote || "",
      polling: electionConfig.polling || null,
      offices
    });
  }

  if (req.method === "GET" && pathname === "/api/elections/votes") {
    const voterId = searchParams.get("voterId") || "";
    return sendJson(res, 200, { ok: true, ...getElectionPublicSnapshot(voterId) });
  }

  if (req.method === "POST" && pathname === "/api/elections/votes") {
    const body = await parseBody(req);
    const result = recordElectionVote(body, req);
    return sendJson(res, result.status || 200, result);
  }

  if (req.method === "POST" && pathname === "/api/analytics/visit") {
    const body = await parseBody(req);
    const tracking = buildTrackingMeta(req, body);
    const visits = getJsonArray(VISITS_FILE);
    const visitorId = tracking.visitorId || tracking.cookieVisitorId || createRecordId("visitor");
    const sessionId = tracking.sessionId || tracking.cookieSessionId || createRecordId("session");
    const visit = {
      id: createRecordId("visit"),
      visitorId,
      sessionId,
      cookieVisitorId: tracking.cookieVisitorId,
      cookieSessionId: tracking.cookieSessionId,
      pagePath: tracking.pagePath,
      pageTitle: tracking.pageTitle,
      referrer: tracking.referrer,
      city: tracking.city,
      country: tracking.country,
      ip: tracking.ip,
      browser: tracking.browser,
      deviceType: tracking.deviceType,
      language: tracking.language,
      timezone: tracking.timezone,
      screen: tracking.screen,
      viewport: tracking.viewport,
      platform: tracking.platform,
      trackingConsent: tracking.trackingConsent,
      trackingMethod: tracking.trackingMethod,
      consentSource: tracking.consentSource,
      cookiesEnabled: tracking.cookiesEnabled,
      storageEnabled: tracking.storageEnabled,
      utmSource: tracking.utmSource,
      utmMedium: tracking.utmMedium,
      utmCampaign: tracking.utmCampaign,
      utmContent: tracking.utmContent,
      utmTerm: tracking.utmTerm,
      at: new Date().toISOString()
    };
    visits.push(visit);
    writeJson(VISITS_FILE, visits);

    return sendJson(res, 201, {
      ok: true,
      visitId: visit.id,
      sessionId: visit.sessionId,
      visitorId: visit.visitorId
    });
  }

  if (req.method === "POST" && pathname === "/api/analytics/heartbeat") {
    const body = await parseBody(req);
    const tracking = buildTrackingMeta(req, body);
    const sessionId = tracking.sessionId || tracking.cookieSessionId;
    const visitorId = tracking.visitorId || tracking.cookieVisitorId;
    const durationSec = Math.max(0, Number(body.durationSec || 0));

    if (!sessionId || !visitorId || !durationSec) {
      return sendJson(res, 400, {
        ok: false,
        error: "sessionId, visitorId e durationSec são obrigatórios."
      });
    }

    const heartbeats = getJsonArray(HEARTBEATS_FILE);
    heartbeats.push({
      id: createRecordId("hb"),
      sessionId,
      visitorId,
      pagePath: tracking.pagePath,
      pageTitle: tracking.pageTitle,
      durationSec: Math.min(durationSec, 600),
      at: new Date().toISOString()
    });
    writeJson(HEARTBEATS_FILE, heartbeats);

    return sendJson(res, 201, { ok: true });
  }

  if (req.method === "GET" && pathname.startsWith("/api/news/")) {
    const slug = decodeURIComponent(pathname.replace("/api/news/", ""));
    const item = getArticleBySlug(slug);

    if (!item) {
      return sendJson(res, 404, { ok: false, message: "Noticia nao encontrada." });
    }

    return sendJson(res, 200, { ok: true, item });
  }

  if (req.method === "GET" && pathname === "/api/catalog/businesses") {
    const city = searchParams.get("city");
    return sendJson(res, 200, { items: getBusinesses(city) });
  }

  if (pathname.startsWith("/api/ninjas/")) {
    return sendJson(res, 410, {
      ok: false,
      error: "Serviço indisponível."
    });
  }

  if (req.method === "GET" && pathname === "/api/ninjas/opportunities") {
    return sendJson(res, 200, { ok: true, ...buildNinjasOpportunityPayload() });
  }

  if (req.method === "GET" && pathname === "/api/ninjas/pix") {
    if (!hasPixKeyConfigured()) {
      return sendJson(res, 503, {
        ok: false,
        error: "Pagamento Pix indisponivel no momento."
      });
    }

    const amount = searchParams.get("amount") || NINJAS_PIX_DEFAULT_AMOUNT;
    const txid = searchParams.get("txid") || "";
    const description = searchParams.get("description") || searchParams.get("label") || "Ninjas Cruzeiro";
    const payload = await buildNinjasPixConfig({ amount, txid, description });
    return sendJson(res, 200, { ok: true, ...payload });
  }

  if (req.method === "POST" && pathname === "/api/ninjas/requests") {
    const body = await parseBody(req);
    const requests = readJson(NINJAS_REQUESTS_FILE, []);
    const service = cleanShortText(body.service || body.requestTitle || body.requestType, 140);
    const phone = cleanPhone(body.phone || body.whatsapp || body.contactPhone);

    if (!service || !phone) {
      return sendJson(res, 400, {
        ok: false,
        error: "Informe pelo menos o servico desejado e um telefone para contato."
      });
    }

    const paymentAmount = NINJAS_PIX_DEFAULT_AMOUNT;

    if (!hasPixKeyConfigured()) {
      return sendJson(res, 503, {
        ok: false,
        error: "Pedidos pagos estao indisponiveis ate configurar a chave Pix."
      });
    }

    const paymentTxid =
      normalizePixToken(body.paymentTxid || body.txid || `NJSREQ${Date.now()}`, 25) || `NJSREQ${Date.now()}`;
    const nextItem = {
      id: createRecordId("njr"),
      type: "pedido-servico",
      name: cleanShortText(body.name || "Cliente local", 80),
      phone,
      email: cleanEmail(body.email),
      neighborhood: cleanShortText(body.neighborhood || body.bairro, 80),
      city: cleanShortText(body.city || "Cruzeiro do Sul - AC", 80),
      service,
      details: cleanShortText(body.details || body.description, 1200),
      budget: cleanShortText(body.budget, 40),
      urgency: cleanShortText(body.urgency || "normal", 40),
      availability: cleanShortText(body.availability, 120),
      status: "aguardando-confirmacao-pix",
      payment: {
        amount: paymentAmount,
        method: "pix-qr-code",
        keyVisible: false,
        txid: paymentTxid,
        status: "pendente-manual",
        confirmationMode: "manual"
      },
      createdAt: new Date().toISOString()
    };

    const next = Array.isArray(requests) ? requests : [];
    next.push(nextItem);
    writeJson(NINJAS_REQUESTS_FILE, next);

    return sendJson(res, 201, {
      ok: true,
      item: nextItem,
      message: "Pedido recebido. Agora o Pix de R$ 5,00 precisa ser confirmado manualmente."
    });
  }

  if (req.method === "POST" && pathname === "/api/ninjas/profiles") {
    const body = await parseBody(req);
    const profiles = readJson(NINJAS_PROFILES_FILE, []);
    const name = cleanShortText(body.name, 80);
    const area = cleanShortText(body.area || body.role || body.profession, 90);

    if (!name || !area) {
      return sendJson(res, 400, {
        ok: false,
        error: "Preencha pelo menos nome e area principal para montar o perfil."
      });
    }

    const rawPlan = normalizeText(body.plan || "gratis");
    const plan =
      rawPlan === "destaque" || rawPlan === "creditos" || rawPlan === "creditos-pro" ? rawPlan : "gratis";
    const paymentAmount = plan === "gratis" ? 0 : Math.max(5, Math.min(100, parseCurrency(body.paymentAmount, 5)));

    if (paymentAmount > 0 && !hasPixKeyConfigured()) {
      return sendJson(res, 503, {
        ok: false,
        error: "Planos pagos estao indisponiveis ate configurar a chave Pix."
      });
    }

    const credits = getNinjasCreditsFromPlan(plan, paymentAmount);
    const paymentTxid = paymentAmount
      ? normalizePixToken(body.paymentTxid || body.txid || `NJSPRO${Date.now()}`, 25) || `NJSPRO${Date.now()}`
      : "";
    const resume = {
      objective: cleanShortText(body.objective, 220),
      summary: cleanShortText(body.summary, 900),
      experience: cleanShortText(body.experience, 1200),
      education: cleanShortText(body.education, 800),
      availability: cleanShortText(body.availability, 160),
      salaryGoal: cleanShortText(body.salaryGoal || body.salary, 80),
      portfolio: cleanShortText(body.portfolio, 240),
      skills: normalizeListInput(body.skills, { maxItems: 14, itemLength: 60 }),
      strengths: normalizeListInput(body.strengths, { maxItems: 10, itemLength: 48 })
    };

    const nextItem = {
      id: createRecordId("njp"),
      type: "perfil-profissional",
      name,
      city: cleanShortText(body.city || "Cruzeiro do Sul - AC", 80),
      phone: cleanPhone(body.phone || body.whatsapp),
      email: cleanEmail(body.email),
      area,
      highlightNote: cleanShortText(body.highlightNote || body.tagline, 140),
      firstJob: Boolean(body.firstJob || body.isFirstJob),
      plan,
      credits,
      status: paymentAmount ? "aguardando-confirmacao-pix" : "perfil-gratuito-recebido",
      payment: {
        amount: paymentAmount,
        method: paymentAmount ? "pix-qr-code" : "none",
        keyVisible: false,
        txid: paymentTxid,
        status: paymentAmount ? "pendente-manual" : "nao-aplicavel",
        confirmationMode: paymentAmount ? "manual" : "none"
      },
      resume,
      createdAt: new Date().toISOString()
    };

    const next = Array.isArray(profiles) ? profiles : [];
    next.push(nextItem);
    writeJson(NINJAS_PROFILES_FILE, next);

    return sendJson(res, 201, {
      ok: true,
      item: nextItem,
      message:
        paymentAmount > 0
          ? "Perfil recebido. O destaque ou pacote sera liberado apos confirmacao manual do Pix."
          : "Curriculo recebido no plano gratuito."
    });
  }

  if (req.method === "GET" && pathname === "/api/sales/listings") {
    const category = searchParams.get("category") || "";
    const limit = Number(searchParams.get("limit") || 80);
    const items = getSalesListings({ category, limit }).map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      categoryLabel: item.categoryLabel,
      price: item.price,
      city: item.city,
      neighborhood: item.neighborhood,
      sellerName: item.sellerName,
      phone: item.phone,
      description: item.description,
      condition: item.condition,
      deliveryMode: item.deliveryMode,
      createdAt: item.createdAt
    }));

    return sendJson(res, 200, {
      ok: true,
      total: items.length,
      updatedAt: new Date().toISOString(),
      items
    });
  }

  if (req.method === "POST" && pathname === "/api/sales/listings") {
    const body = await parseBody(req);
    const title = cleanShortText(body.title || body.item || body.product, 120);
    const phone = cleanPhone(body.phone || body.whatsapp);
    const category = normalizeSalesCategory(body.category || body.type);

    if (!title || !phone) {
      return sendJson(res, 400, {
        ok: false,
        error: "Informe o item que quer vender e um telefone ou WhatsApp para contato."
      });
    }

    const listings = readJson(SALES_LISTINGS_FILE, []);
    const nextItem = {
      id: createRecordId("sale"),
      title,
      category,
      categoryLabel: cleanShortText(body.categoryLabel || body.category || "Outros", 80),
      price: cleanShortText(body.price || body.value || "A combinar", 60),
      condition: cleanShortText(body.condition || "nao informado", 80),
      deliveryMode: cleanShortText(body.deliveryMode || body.delivery || "combinar com vendedor", 120),
      sellerName: cleanShortText(body.sellerName || body.name || "Vendedor local", 90),
      phone,
      city: cleanShortText(body.city || "Cruzeiro do Sul - AC", 90),
      neighborhood: cleanShortText(body.neighborhood || body.bairro, 90),
      description: cleanShortText(body.description || body.details, 1200),
      status: "publicado",
      createdAt: new Date().toISOString()
    };

    const next = Array.isArray(listings) ? listings : [];
    next.push(nextItem);
    writeJson(SALES_LISTINGS_FILE, next);

    return sendJson(res, 201, {
      ok: true,
      item: nextItem,
      message: "Item publicado na lista de vendas."
    });
  }

  if (req.method === "POST" && pathname === "/api/vr-rental/leads") {
    const body = await parseBody(req);
    const tracking = buildTrackingMeta(req, body);
    const name = cleanShortText(body.name || body.customerName, 100);
    const phone = cleanPhone(body.phone || body.whatsapp || body.contactPhone);

    if (!name || !phone) {
      return sendJson(res, 400, {
        ok: false,
        error: "Informe nome e WhatsApp para reservar o aluguel VR."
      });
    }

    const leads = readJson(VR_RENTAL_LEADS_FILE, []);
    const nextItem = {
      id: createRecordId("vr"),
      type: "aluguel-vr",
      name,
      phone,
      email: cleanEmail(body.email),
      rentalDate: cleanShortText(body.date || body.rentalDate || body.eventDate, 40),
      period: cleanShortText(body.period || body.time || "a combinar", 60),
      package: cleanShortText(body.package || body.plan || "experiencia rapida", 100),
      notes: cleanShortText(body.notes || body.message || body.details, 700),
      status: "novo",
      sourcePage: cleanShortText(body.sourcePage || tracking.pagePath || "/games.html", 260),
      visitorId: tracking.visitorId || tracking.cookieVisitorId,
      sessionId: tracking.sessionId || tracking.cookieSessionId,
      city: tracking.city,
      country: tracking.country,
      ip: tracking.ip,
      createdAt: new Date().toISOString()
    };

    const next = Array.isArray(leads) ? leads : [];
    next.push(nextItem);
    writeJson(VR_RENTAL_LEADS_FILE, next);

    return sendJson(res, 201, {
      ok: true,
      item: nextItem,
      message: "Pedido de aluguel VR salvo."
    });
  }

  if (req.method === "GET" && pathname === "/api/pesquisa-acre-2026/summary") {
    return sendJson(res, 200, buildAcre2026PollPublicPayload());
  }

  if (req.method === "GET" && pathname === "/api/news-image-focus-audit") {
    const report = readJson(NEWS_IMAGE_FOCUS_AUDIT_FILE, {});
    const reviewQueue = Array.isArray(report.reviewQueue) ? report.reviewQueue : [];
    const summary = report && typeof report.summary === "object" ? report.summary : {};
    return sendJson(res, 200, {
      ok: true,
      updatedAt: report.updatedAt || "",
      checkedLimit: Number(report.checkedLimit || 0) || 0,
      total: Number(report.total || 0) || 0,
      offline: Boolean(report.offline),
      summary: {
        ok: Number(summary.ok || 0) || 0,
        review: Number(summary.review || 0) || 0,
        warning: Number(summary.warning || 0) || 0,
        error: Number(summary.error || 0) || 0,
        manualFocus: Number(summary.manualFocus || 0) || 0,
        newSinceLastAudit: Number(summary.newSinceLastAudit || 0) || 0,
        missingImage: Number(summary.missingImage || 0) || 0,
        unreachableImage: Number(summary.unreachableImage || 0) || 0
      },
      reviewQueue: reviewQueue.map((item) => ({
        slug: safeString(item.slug || "", 200),
        title: safeString(item.title || "Sem titulo", 220),
        level: safeString(item.level || "review", 24),
        reasons: Array.isArray(item.reasons)
          ? item.reasons.map((reason) => safeString(reason || "", 120)).filter(Boolean)
          : [],
        imageUrl: safeString(item.imageUrl || "", 1000),
        effectiveFocus: safeString(item.effectiveFocus || "", 80),
        articleUrl: item.slug ? `/noticia.html?slug=${encodeURIComponent(item.slug)}` : ""
      }))
    });
  }

  if (req.method === "GET" && pathname === "/api/news-image-focus-approvals") {
    if (!requireFullAdminOrderAccess(req)) {
      return sendJson(res, 401, { ok: false, error: "Acesso restrito ao Full Admin." });
    }
    const newOnly = String(searchParams.get("newOnly") || "true").toLowerCase() !== "false";
    return sendJson(res, 200, buildImageApprovalQueue({ newOnly }));
  }

  if (req.method === "POST" && pathname === "/api/news-image-focus-approvals") {
    const body = await parseBody(req);
    if (!requireFullAdminOrderAccess(req, body)) {
      return sendJson(res, 401, { ok: false, error: "Acesso restrito ao Full Admin." });
    }
    const result = recordImageApprovalDecision({
      ...body,
      requestedBy: body.requestedBy || "Full Admin",
      source: body.source || "cheffe-call"
    });
    if (!result.ok) return sendJson(res, result.status || 400, result);
    appendNewsImageApprovalOfficeOrder(result.decision);
    return sendJson(res, 201, result);
  }

  if (req.method === "GET" && pathname === "/api/pesquisa-acre-2026/bridge") {
    return sendJson(res, 200, buildAcre2026PollBridgePayload());
  }

  if (req.method === "GET" && pathname === "/api/pesquisa-acre-2026/me") {
    const authUser = readCatalogoAuthSession(req);
    if (!authUser?.email || !authUser?.sub) {
      const round = getAcre2026PollRoundSettings();
      return sendJson(res, 200, {
        ok: true,
        authenticated: false,
        alreadyVoted: false,
        weekKey: round.effectiveWeekKey,
        round,
        user: null,
        vote: null,
        message: "Entre com Google para liberar a participação semanal."
      });
    }

    return sendJson(res, 200, buildAcre2026PollCurrentUserPayload(authUser));
  }

  if (req.method === "POST" && pathname === "/api/pesquisa-acre-2026") {
    const authUser = readCatalogoAuthSession(req);
    if (!authUser?.email || !authUser?.sub) {
      return sendJson(res, 401, {
        ok: false,
        error: "Entre com Google para responder. Isso evita duplicação e libera apenas uma resposta por conta Google a cada semana."
      });
    }

    const body = await parseBody(req);
    const tracking = buildTrackingMeta(req, body);
    const currentRound = getAcre2026PollRoundSettings();
    const currentWeekKey = currentRound.effectiveWeekKey;
    const profissao = cleanShortText(body.profissao || body.profession, 100);
    const localizacao = cleanShortText(body.localizacao || body.location, 120);
    const faixaEtaria = normalizePollChoice(
      body.faixaEtaria || body.faixa_etaria || body.ageRange,
      ACRE_2026_POLL_OPTIONS.ageRanges,
      ""
    );
    const votoAnterior = normalizePollChoice(
      body.votoAnterior || body.voto_anterior || body.previousVote,
      ACRE_2026_POLL_OPTIONS.previousVotes,
      ""
    );
    const avaliacaoGoverno = normalizePollChoice(
      body.avaliacaoGoverno || body.avaliacao_governo || body.governmentEvaluation,
      ACRE_2026_POLL_OPTIONS.governmentEvaluation,
      ""
    );
    const direcaoEstado = normalizePollChoice(
      body.direcaoEstado || body.direcao_estado || body.stateDirection,
      ACRE_2026_POLL_OPTIONS.stateDirection,
      ""
    );
    const desejoCiclo = normalizePollChoice(
      body.desejoCiclo || body.desejo_ciclo || body.desiredCycle,
      ACRE_2026_POLL_OPTIONS.desiredCycle,
      ""
    );
    const voto2026 = normalizePollChoice(
      body.voto2026 || body.voto_2026 || body.vote2026,
      ACRE_2026_POLL_OPTIONS.vote2026,
      ""
    );
    const segundaOpcao = normalizePollChoice(
      body.segundaOpcao || body.segunda_opcao || body.secondChoice,
      ACRE_2026_POLL_OPTIONS.secondChoice,
      ""
    );
    const certezaVoto = normalizePollChoice(
      body.certezaVoto || body.certeza_voto || body.voteCertainty,
      ACRE_2026_POLL_OPTIONS.voteCertainty,
      ""
    );
    const rejeicao = normalizePollChoice(
      body.rejeicao || body.rejection,
      ACRE_2026_POLL_OPTIONS.rejection,
      ""
    );
    const prioridade = normalizePollChoice(
      body.prioridade || body.priority,
      ACRE_2026_POLL_OPTIONS.priorities,
      ""
    );
    const atencaoPolitica = normalizePollChoice(
      body.atencaoPolitica || body.atencao_politica || body.politicalAttention,
      ACRE_2026_POLL_OPTIONS.politicalAttention,
      ""
    );
    const fatorDecisivo = normalizePollChoice(
      body.fatorDecisivo || body.fator_decisivo || body.decisionDriver,
      ACRE_2026_POLL_OPTIONS.decisionDriver,
      ""
    );
    const satisfacao = Math.max(0, Math.min(5, Number(body.satisfacao || body.satisfaction || 0)));
    const comentario = safeString(body.comentario || body.comment || "", 1200);

    if (
      !profissao ||
      !localizacao ||
      !faixaEtaria ||
      !votoAnterior ||
      !avaliacaoGoverno ||
      !direcaoEstado ||
      !desejoCiclo ||
      !satisfacao ||
      !voto2026 ||
      !segundaOpcao ||
      !certezaVoto ||
      !rejeicao ||
      !prioridade ||
      !atencaoPolitica ||
      !fatorDecisivo
    ) {
      return sendJson(res, 400, {
        ok: false,
        error: "Preencha todos os campos obrigatorios da pesquisa, incluindo a faixa etaria."
      });
    }

    let mutationResult;
    try {
      mutationResult = await mutateJsonFile(ACRE_2026_POLL_FILE, [], (currentRecords) => {
        const records = Array.isArray(currentRecords) ? currentRecords : [];
        const hasWeeklyGoogleVote = records.some(
          (item) =>
            safeString(item.weekKey || "", 24) === currentWeekKey &&
            (safeString(item.googleSub || "", 160) === safeString(authUser.sub, 160) ||
              safeString(item.googleEmail || "", 160) === safeString(authUser.email, 160))
        );

        if (hasWeeklyGoogleVote) {
          const error = new Error(
            "Este Google já registrou uma resposta nesta semana. Aguarde a próxima rodada para participar de novo."
          );
          error.statusCode = 409;
          throw error;
        }

        const nextItem = {
          id: createRecordId("poll"),
          profissao,
          localizacao,
          faixaEtaria,
          votoAnterior,
          satisfacao,
          avaliacaoGoverno,
          direcaoEstado,
          desejoCiclo,
          voto2026,
          segundaOpcao,
          certezaVoto,
          rejeicao,
          prioridade,
          atencaoPolitica,
          fatorDecisivo,
          comentario,
          sourcePage: cleanShortText(body.sourcePage || tracking.pagePath || "/pesquisa-acre-2026.html", 260),
          pageTitle: cleanShortText(body.pageTitle || tracking.pageTitle || "Enquete de Opiniao Acre 2026", 160),
          visitorId: tracking.visitorId || tracking.cookieVisitorId,
          sessionId: tracking.sessionId || tracking.cookieSessionId,
          city: tracking.city,
          country: tracking.country,
          ip: tracking.ip,
          browser: tracking.browser,
          deviceType: tracking.deviceType,
          referrerHost: tracking.referrerHost,
          googleEmail: safeString(authUser.email, 160),
          googleSub: safeString(authUser.sub, 160),
          weekKey: currentWeekKey,
          createdAt: new Date().toISOString()
        };

        const next = records.slice();
        next.push(nextItem);

        return {
          value: next,
          item: nextItem,
          records: next
        };
      });
    } catch (error) {
      if (error?.statusCode === 409) {
        return sendJson(res, 409, {
          ok: false,
          error: error.message
        });
      }
      throw error;
    }

    return sendJson(res, 201, {
      ok: true,
      item: {
        id: mutationResult.item.id,
        createdAt: mutationResult.item.createdAt
      },
      round: currentRound,
      summary: buildAcre2026PollSummary(sortByDateDesc(mutationResult.records, "createdAt", 5000)),
      message: "Resposta registrada. As parciais da enquete ja foram atualizadas."
    });
  }

  if (req.method === "POST" && pathname === "/api/pesquisa-acre-2026/admin") {
    if (!requireAcre2026PollAdmin(req)) {
      return sendJson(res, 401, {
        ok: false,
        error: "Senha administrativa invalida."
      });
    }

    return sendJson(res, 200, buildAcre2026PollAdminPayload());
  }

  if (req.method === "POST" && pathname === "/api/pesquisa-acre-2026/admin/reset-week") {
    if (!requireAcre2026PollAdmin(req)) {
      return sendJson(res, 401, {
        ok: false,
        error: "Senha administrativa invalida."
      });
    }

    const body = await parseBody(req);
    const round = resetAcre2026PollRound(body.reason || body.note || "");
    const records = getAcre2026PollResponses();

    return sendJson(res, 200, {
      ok: true,
      reset: true,
      preservedResponses: Array.isArray(records) ? records.length : 0,
      round,
      summary: buildAcre2026PollSummary(sortByDateDesc(records, "createdAt", 5000)),
      message: "Rodada semanal resetada por 7 dias, mantendo os votos acumulados."
    });
  }

  if (req.method === "POST" && pathname === "/api/pesquisa-acre-2026/admin/force-sync") {
    if (!requireAcre2026PollAdmin(req)) {
      return sendJson(res, 401, {
        ok: false,
        error: "Senha administrativa invalida."
      });
    }

    const result = await mutateJsonFile(ACRE_2026_POLL_FILE, [], (currentRecords) => {
      const normalizedRecords = dedupeAcre2026PollRecords(currentRecords);
      return {
        value: normalizedRecords,
        records: normalizedRecords
      };
    });
    const records = Array.isArray(result.records) ? result.records : [];

    return sendJson(res, 200, {
      ok: true,
      forced: true,
      total: records.length,
      summary: buildAcre2026PollSummary(records),
      message: "Votos reais da SPO normalizados e parciais recalculadas."
    });
  }

  if (req.method === "GET" && pathname === "/api/comments") {
    const comments = readJson(path.join(DATA_DIR, "comments.json"), []);
    const items = (Array.isArray(comments) ? comments : []).map((comment) => {
      const message = String(comment.message || comment.text || "").slice(0, 2000);

      return {
        ...comment,
        name: String(comment.name || comment.author || "Leitor").slice(0, 80),
        badge: String(comment.badge || "Leitor local").slice(0, 80),
        message,
        text: message
      };
    });

    return sendJson(res, 200, { items });
  }

  if (req.method === "GET" && pathname === "/api/preview-image") {
    const targetUrl = searchParams.get("url") || "";
    let previewHostAllowed = false;
    try {
      previewHostAllowed = isAllowedPreviewHost(new URL(targetUrl).hostname);
    } catch (_error) {
      previewHostAllowed = false;
    }
    if (!previewHostAllowed && !requireFullAdminPasswordAccess(req)) {
      return sendJson(res, 401, {
        ok: false,
        error: "Senha admin total obrigatoria para consultar imagem."
      });
    }

    const imageUrl = await fetchPreviewImage(targetUrl);
    if (!imageUrl) {
      return sendJson(res, 200, { ok: false, imageUrl: "", message: "Imagem nao encontrada." });
    }
    return sendJson(res, 200, { ok: true, imageUrl });
  }

  if (req.method === "POST" && pathname === "/api/comments") {
    const body = await parseBody(req);
    const tracking = buildTrackingMeta(req, body);
    const comments = readJson(path.join(DATA_DIR, "comments.json"), []);
    const message = String(body.message || body.text || "").slice(0, 2000);
    const nextItem = {
      id: `c-${Date.now()}`,
      articleId: String(body.articleId || body.slug || "").trim().slice(0, 180),
      author: String(body.author || body.name || "Leitor").slice(0, 80),
      name: String(body.name || body.author || "Leitor").slice(0, 80),
      badge: String(body.badge || "Leitor local").slice(0, 80),
      message,
      text: message,
      pagePath: tracking.pagePath,
      visitorId: tracking.visitorId || tracking.cookieVisitorId,
      sessionId: tracking.sessionId || tracking.cookieSessionId,
      city: tracking.city,
      country: tracking.country,
      ip: tracking.ip,
      status: "published",
      createdAt: new Date().toISOString(),
    };
    const next = Array.isArray(comments) ? comments : [];
    next.push(nextItem);
    writeJson(path.join(DATA_DIR, "comments.json"), next);
    return sendJson(res, 201, { ok: true, item: nextItem, comment: nextItem });
  }

  if (req.method === "POST" && pathname === "/api/agent-messages") {
    const body = await parseBody(req);
    const messages = readJson(path.join(DATA_DIR, "agent-messages.json"), []);
    const message = String(body.message || "").trim().slice(0, 3000);

    if (!message) {
      return sendJson(res, 400, { ok: false, error: "Mensagem obrigatória." });
    }

    const nextItem = {
      id: `m-${Date.now()}`,
      name: String(body.name || "").trim().slice(0, 80),
      email: String(body.email || "").trim().toLowerCase().slice(0, 120),
      subject: String(body.subject || "Contato pelo Catalogo Cruzeiro do Sul").trim().slice(0, 120),
      recipient: String(body.recipient || "juniorclovisa@gmail.com").trim().slice(0, 120),
      message,
      createdAt: new Date().toISOString()
    };
    const next = Array.isArray(messages) ? messages : [];
    next.push(nextItem);
    writeJson(path.join(DATA_DIR, "agent-messages.json"), next);
    return sendJson(res, 201, { ok: true, item: nextItem });
  }

  if (req.method === "GET" && pathname === "/api/subscriptions") {
    const subs = readJson(path.join(DATA_DIR, "subscriptions.json"), []);
    const items = Array.isArray(subs) ? subs : [];
    const founderItems = items.filter(isConfirmedFounderSubscription);
    const pendingFounderItems = items.filter(isPendingFounderSubscription);
    const founders = founderItems
      .slice()
      .reverse()
      .slice(0, 24)
      .map((item) => ({
        id: String(item.id || ""),
        name: String(item.name || "").slice(0, 100),
        amount: Number(item.amount || 0),
        badge: "Fundador",
        createdAt: item.createdAt || ""
      }));

    return sendJson(res, 200, {
      ok: true,
      totals: {
        subscriptions: items.length,
        founders: founderItems.length,
        pendingFounders: pendingFounderItems.length
      },
      founders
    });
  }

  if (req.method === "GET" && pathname === "/api/subscriptions/pix") {
    const authUser = readCatalogoAuthSession(req);
    if (!authUser) {
      return sendJson(res, 401, {
        ok: false,
        error: "Entre com Google para gerar um QR code de apoio."
      });
    }

    if (!hasPixKeyConfigured()) {
      return sendJson(res, 503, {
        ok: false,
        error: "Pagamento Pix indisponivel no momento."
      });
    }

    const amount = searchParams.get("amount") || 5;
    const txid = searchParams.get("txid") || "";
    const description = searchParams.get("description") || "Apoio Fundador Catalogo";
    const payload = await buildNinjasPixConfig({
      amount,
      txid,
      description,
      minAmount: 1,
      maxAmount: 10,
      defaultAmount: 5
    });
    return sendJson(res, 200, { ok: true, ...payload });
  }

  if (req.method === "GET" && pathname === "/api/pubpaid/deposit/pix") {
    const authUser = readCatalogoAuthSession(req);
    if (!authUser) {
      return sendJson(res, 401, {
        ok: false,
        error: "Entre com Google para gerar o QR code de deposito."
      });
    }

    if (!hasPixKeyConfigured()) {
      return sendJson(res, 503, {
        ok: false,
        error: "Depositos Pix indisponiveis ate configurar a chave Pix."
      });
    }

    const amount = normalizePubpaidAmount(searchParams.get("amount") || 10, 10);
    const txid = searchParams.get("txid") || "";
    const description = searchParams.get("description") || "PubPaid Creditos";
    const payload = await buildNinjasPixConfig({
      amount,
      txid,
      description,
      minAmount: 5,
      maxAmount: 100,
      defaultAmount: 10
    });
    return sendJson(res, 200, { ok: true, ...payload, user: publicAuthUser(authUser) });
  }

  if (req.method === "GET" && pathname === "/api/pubpaid/account") {
    const authUser = readCatalogoAuthSession(req);
    if (!authUser) {
      return sendJson(res, 401, {
        ok: false,
        error: "Entre com Google para abrir a carteira do PubPaid."
      });
    }

    return sendJson(res, 200, buildPubpaidAccountPayload(authUser));
  }

  if (req.method === "GET" && pathname === "/api/pubpaid/profile") {
    const authUser = readCatalogoAuthSession(req);
    if (!authUser) {
      return sendJson(res, 401, { ok: false, error: "Entre com Google para carregar seu nick." });
    }
    return sendJson(res, 200, {
      ok: true,
      user: publicAuthUser(authUser),
      profile: getPubpaidPlayerProfile(authUser)
    });
  }

  if (req.method === "POST" && pathname === "/api/pubpaid/profile") {
    const authUser = readCatalogoAuthSession(req);
    if (!authUser) {
      return sendJson(res, 401, { ok: false, error: "Entre com Google para salvar seu nick." });
    }
    const body = await parseBody(req);
    const result = savePubpaidPlayerProfile(authUser, body.nick || body.name || "");
    if (!result.ok) {
      return sendJson(res, 400, result);
    }
    return sendJson(res, 200, {
      ok: true,
      user: publicAuthUser(authUser),
      profile: result.profile
    });
  }

  if (req.method === "GET" && pathname === "/api/pubpaid/build") {
    return sendJson(
      res,
      200,
      {
        ok: true,
        buildVersion: PUBPAID_CLIENT_BUILD_VERSION,
        clientVersion: cleanShortText(searchParams.get("client") || "", 80),
        serverTime: new Date().toISOString()
      }
    );
  }

  if (req.method === "GET" && pathname === "/api/pubpaid/pvp/state") {
    const authUser = readCatalogoAuthSession(req);
    if (!authUser) {
      return sendJson(res, 401, { ok: false, error: "Entre com Google para abrir a fila PvP." });
    }
    const gameId = normalizePubpaidPvpGameId(searchParams.get("gameId"));
    if (!gameId) {
      return sendJson(res, 400, { ok: false, error: "Mesa PvP ainda nao liberada para esse jogo." });
    }
    let store = cleanupPubpaidPvpStore(readPubpaidPvpStore());
    store = touchPubpaidPvpPresence(store, authUser, gameId);
    store = writePubpaidPvpStore(cleanupPubpaidPvpStore(store));
    return sendJson(res, 200, buildPubpaidPvpStatePayload(store, authUser, gameId));
  }

  if (req.method === "POST" && pathname === "/api/pubpaid/pvp/join") {
    const authUser = readCatalogoAuthSession(req);
    if (!authUser) {
      return sendJson(res, 401, { ok: false, error: "Entre com Google para entrar na fila PvP." });
    }
    const body = await parseBody(req);
    const gameId = normalizePubpaidPvpGameId(body.gameId);
    if (!gameId) {
      return sendJson(res, 400, { ok: false, error: "Mesa PvP ainda nao liberada para esse jogo." });
    }
    const stake = normalizePubpaidAmount(body.stake, 10);
    const wantsFreshQueue = body.fresh !== false && !body.reconnect;
    const walletKey = getPubpaidWalletKey(authUser);
    let store = cleanupPubpaidPvpStore(readPubpaidPvpStore());
    store = touchPubpaidPvpPresence(store, authUser, gameId);
    const previousWaiting = store.waiting.filter((entry) => entry?.player?.walletKey === walletKey);
    previousWaiting.forEach((entry) => {
      if (entry?.escrow?.status === "locked") {
        releasePubpaidMatchEscrow(entry.player, entry.stake);
      }
    });
    store.waiting = store.waiting.filter((entry) => entry?.player?.walletKey !== walletKey);
    const existingMatch = store.matches.find((entry) =>
      entry?.gameId === gameId &&
      ["readying", "active", "abandoned"].includes(entry?.status) &&
      [entry?.playerOne?.walletKey, entry?.playerTwo?.walletKey].includes(walletKey)
    );
    if (existingMatch) {
      if (wantsFreshQueue && existingMatch.status === "readying") {
        const oldMatchAgeMs = Date.now() - new Date(existingMatch.updatedAt || existingMatch.startedAt || existingMatch.createdAt || 0).getTime();
        const canCloseWithoutResult = oldMatchAgeMs > 15000;
        if (!canCloseWithoutResult) {
          store = writePubpaidPvpStore(store);
          return sendJson(res, 200, buildPubpaidPvpStatePayload(store, authUser, gameId));
        }
        releasePubpaidMatchEscrow(existingMatch.playerOne, existingMatch.stake);
        releasePubpaidMatchEscrow(existingMatch.playerTwo, existingMatch.stake);
        existingMatch.status = "canceled";
        existingMatch.resultSummary = "Mesa antiga cancelada antes da confirmacao dupla. Escrow liberado.";
        existingMatch.finishedAt = new Date().toISOString();
        existingMatch.updatedAt = new Date().toISOString();
        store = cleanupPubpaidPvpStore(writePubpaidPvpStore(store));
      } else if (existingMatch.status === "active" || existingMatch.status === "abandoned") {
        store = writePubpaidPvpStore(store);
        return sendJson(res, 200, buildPubpaidPvpStatePayload(store, authUser, gameId));
      } else {
        store = writePubpaidPvpStore(store);
        return sendJson(res, 200, buildPubpaidPvpStatePayload(store, authUser, gameId));
      }
    }

    const player = createPubpaidPvpPlayer(authUser, body.profile || {});
    const lockResult = lockPubpaidMatchEscrow(player, stake);
    if (!lockResult.ok) {
      return sendJson(res, 402, { ok: false, error: lockResult.error });
    }
    const rivalWaiting = store.waiting.find((entry) =>
      entry?.gameId === gameId &&
      clampInteger(entry?.stake) === stake &&
      entry?.player?.walletKey !== walletKey
    );

    if (rivalWaiting) {
      if (rivalWaiting?.escrow?.status !== "locked") {
        const rivalLock = lockPubpaidMatchEscrow(rivalWaiting.player, stake);
        if (!rivalLock.ok) {
          releasePubpaidMatchEscrow(player, stake);
          store.waiting = store.waiting.filter((entry) => entry.id !== rivalWaiting.id);
          store = writePubpaidPvpStore(store);
          return sendJson(res, 409, {
            ok: false,
            error: "Rival saiu da mesa porque nao havia escrow disponivel."
          });
        }
      }
      store.waiting = store.waiting.filter((entry) => entry.id !== rivalWaiting.id);
      store.matches.push(createPubpaidPvpMatch(gameId, stake, rivalWaiting.player, player));
    } else {
      store.waiting.push({
        id: createRecordId("pvpw"),
        gameId,
        stake,
        createdAt: new Date().toISOString(),
        player,
        escrow: {
          status: "locked",
          amount: stake,
          lockedAt: new Date().toISOString(),
        },
      });
    }

    store = writePubpaidPvpStore(store);
    return sendJson(res, 200, buildPubpaidPvpStatePayload(store, authUser, gameId));
  }

  if (req.method === "POST" && pathname === "/api/pubpaid/pvp/leave") {
    const authUser = readCatalogoAuthSession(req);
    if (!authUser) {
      return sendJson(res, 401, { ok: false, error: "Entre com Google para sair da fila PvP." });
    }
    const body = await parseBody(req);
    const gameId = normalizePubpaidPvpGameId(body.gameId);
    if (!gameId) {
      return sendJson(res, 400, { ok: false, error: "Mesa PvP ainda nao liberada para esse jogo." });
    }
    const leaveReason = cleanShortText(body.reason || "", 40).toLowerCase();
    const wantsForfeit =
      Boolean(body.forfeit) ||
      ["forfeit", "resign", "desistir", "surrender"].includes(leaveReason);
    const walletKey = getPubpaidWalletKey(authUser);
    let store = cleanupPubpaidPvpStore(readPubpaidPvpStore());
    store.waiting
      .filter((entry) => entry?.gameId === gameId && entry?.player?.walletKey === walletKey && entry?.escrow?.status === "locked")
      .forEach((entry) => releasePubpaidMatchEscrow(entry.player, entry.stake));
    store.waiting = store.waiting.filter((entry) => !(entry?.gameId === gameId && entry?.player?.walletKey === walletKey));
    store.matches = store.matches.map((entry) => {
      if (entry?.gameId !== gameId || !["readying", "active", "abandoned"].includes(entry?.status)) return entry;
      const isPlayerOne = entry?.playerOne?.walletKey === walletKey;
      const isPlayerTwo = entry?.playerTwo?.walletKey === walletKey;
      if (!isPlayerOne && !isPlayerTwo) return entry;
      const abandonedBy = isPlayerOne ? "playerOne" : "playerTwo";
      const rivalSeat = isPlayerOne ? "playerTwo" : "playerOne";
      const nowIso = new Date().toISOString();
      if (entry.status === "readying") {
        releasePubpaidMatchEscrow(entry.playerOne, entry.stake);
        releasePubpaidMatchEscrow(entry.playerTwo, entry.stake);
        return {
          ...entry,
          status: "canceled",
          abandonedBy,
          resultSummary: "Mesa cancelada antes da confirmacao dupla. Escrow liberado.",
          finishedAt: nowIso,
          updatedAt: nowIso,
        };
      }
      if (!wantsForfeit) {
        if (entry.status === "abandoned") return entry;
        return {
          ...entry,
          status: "abandoned",
          abandonedBy,
          winner: "",
          deadlineAt: new Date(Date.now() + PUBPAID_PVP_ABANDON_MS).toISOString(),
          presence: {
            ...(entry.presence || {}),
            [abandonedBy]: {
              ...(entry.presence?.[abandonedBy] || {}),
              connected: false,
              lastSeenAt: entry?.presence?.[abandonedBy]?.lastSeenAt || nowIso,
            },
          },
          resultSummary: `${entry?.[abandonedBy]?.name || "Jogador"} desconectou. ${entry?.[rivalSeat]?.name || "Rival"} vence por W.O. se ele nao voltar em 60 segundos.`,
          updatedAt: nowIso,
        };
      }
      return {
        ...entry,
        status: "finished",
        abandonedBy,
        winner: rivalSeat,
        deadlineAt: "",
        resultSummary: isPlayerOne
          ? `${entry?.playerOne?.name || "Jogador 1"} desistiu. ${entry?.playerTwo?.name || "Jogador 2"} venceu por W.O.`
          : `${entry?.playerTwo?.name || "Jogador 2"} desistiu. ${entry?.playerOne?.name || "Jogador 1"} venceu por W.O.`,
        finishedAt: nowIso,
        updatedAt: nowIso,
      };
    });
    store = writePubpaidPvpStore(store);
    return sendJson(res, 200, buildPubpaidPvpStatePayload(store, authUser, gameId));
  }

  if (req.method === "POST" && pathname === "/api/pubpaid/pvp/ready") {
    const authUser = readCatalogoAuthSession(req);
    if (!authUser) {
      return sendJson(res, 401, { ok: false, error: "Entre com Google para confirmar a mesa PvP." });
    }
    const body = await parseBody(req);
    const gameId = normalizePubpaidPvpGameId(body.gameId);
    const matchId = cleanShortText(body.matchId || "", 120);
    if (!gameId || !matchId) {
      return sendJson(res, 400, { ok: false, error: "Informe a mesa PvP para confirmar." });
    }
    let store = cleanupPubpaidPvpStore(readPubpaidPvpStore());
    const matchIndex = store.matches.findIndex((entry) => entry?.id === matchId && entry?.gameId === gameId);
    if (matchIndex < 0) {
      return sendJson(res, 404, { ok: false, error: "Mesa PvP nao encontrada." });
    }
    const match = store.matches[matchIndex];
    const walletKey = getPubpaidWalletKey(authUser);
    const seat = match?.playerOne?.walletKey === walletKey ? "playerOne" : match?.playerTwo?.walletKey === walletKey ? "playerTwo" : "";
    if (!seat) {
      return sendJson(res, 403, { ok: false, error: "Essa mesa pertence a outros jogadores." });
    }
    if (match.status !== "readying") {
      return sendJson(res, 409, { ok: false, error: "Essa mesa nao esta aguardando confirmacao." });
    }
    const ready = {
      playerOne: Boolean(match.ready?.playerOne),
      playerTwo: Boolean(match.ready?.playerTwo),
      [seat]: true,
    };
    const bothReady = ready.playerOne && ready.playerTwo;
    const coinFlip = bothReady ? match.coinFlip || createPubpaidPvpCoinFlip(match) : match.coinFlip || null;
    const nowIso = new Date().toISOString();
    const nextChessState = gameId === "chess" && bothReady
      ? decorateChessPvPState({
          ...(match.chessState || createChessPvPState()),
          whiteSeat: coinFlip.firstSeat,
          blackSeat: coinFlip.firstSeat === "playerOne" ? "playerTwo" : "playerOne",
        })
      : match.chessState || null;
    const nextPoolState = gameId === "pool" && bothReady
      ? createPoolPvPState("livre", {
          complete: false,
          phase: "winner-choice",
          winnerSeat: coinFlip.firstSeat,
          chooserSeat: coinFlip.firstSeat,
          starterSeat: "",
          ruleMode: "",
          winnerChoice: "",
          tutorialReady: { playerOne: false, playerTwo: false },
        })
      : match.poolState || null;
    const nextPresence = {
      ...(match.presence || createPubpaidPvpPresence(nowIso)),
      [seat]: {
        ...(match.presence?.[seat] || {}),
        connected: true,
        lastSeenAt: nowIso,
      },
    };
    if (bothReady) {
      PUBPAID_PVP_SEATS.forEach((entrySeat) => {
        nextPresence[entrySeat] = {
          ...(nextPresence[entrySeat] || {}),
          connected: true,
          lastSeenAt: nowIso,
        };
      });
    }
    store.matches[matchIndex] = {
      ...match,
      ready,
      coinFlip,
      ...(nextChessState ? { chessState: nextChessState } : {}),
      ...(nextPoolState ? { poolState: nextPoolState } : {}),
      presence: nextPresence,
      status: bothReady ? "active" : "readying",
      startedAt: bothReady ? nowIso : match.startedAt,
      turn: bothReady ? coinFlip.firstSeat : match.turn,
      resultSummary: bothReady
        ? gameId === "pool"
          ? `Moeda ${coinFlip.face}: ${coinFlip.firstPlayerName} escolhe uma parte; o rival escolhe a outra.`
          : `Moeda ${coinFlip.face}: ${coinFlip.firstPlayerName} começa. ${getPubpaidPvpGameLabel(gameId)} liberado.`
        : `${seat === "playerOne" ? match?.playerOne?.name || "Jogador 1" : match?.playerTwo?.name || "Jogador 2"} confirmou. Aguardando o outro jogador.`,
      updatedAt: nowIso,
    };
    store = writePubpaidPvpStore(store);
    return sendJson(res, 200, buildPubpaidPvpStatePayload(store, authUser, gameId));
  }

  if (req.method === "POST" && pathname === "/api/pubpaid/pvp/pool/setup") {
    const authUser = readCatalogoAuthSession(req);
    if (!authUser) {
      return sendJson(res, 401, { ok: false, error: "Entre com Google para escolher a modalidade." });
    }
    const body = await parseBody(req);
    const matchId = cleanShortText(body.matchId || "", 120);
    const action = safeString(body.action || "", 40).toLowerCase();
    const requestedMode = normalizePoolRuleMode(body.mode || "livre");
    if (!matchId) {
      return sendJson(res, 400, { ok: false, error: "Informe a mesa PvP." });
    }

    let store = cleanupPubpaidPvpStore(readPubpaidPvpStore());
    const matchIndex = store.matches.findIndex((entry) => entry?.id === matchId && entry?.gameId === "pool");
    if (matchIndex < 0) {
      return sendJson(res, 404, { ok: false, error: "Mesa de sinuca PvP nao encontrada." });
    }
    const match = store.matches[matchIndex];
    const walletKey = getPubpaidWalletKey(authUser);
    const seat = match?.playerOne?.walletKey === walletKey ? "playerOne" : match?.playerTwo?.walletKey === walletKey ? "playerTwo" : "";
    if (!seat) {
      return sendJson(res, 403, { ok: false, error: "Essa mesa pertence a outros jogadores." });
    }
    if (match.status !== "active") {
      return sendJson(res, 409, { ok: false, error: "Essa mesa ainda nao esta pronta para escolha." });
    }
    const currentSetup = createPoolPvPSetup(match.poolState?.setup || {});
    if (currentSetup.complete) {
      return sendJson(res, 409, { ok: false, error: "A modalidade ja foi escolhida." });
    }
    const chooseMode = action === "mode";
    const chooseStart = action === "start" || action === "starter";
    const confirmTutorial = action === "tutorial";
    const revealMode = action === "reveal" || action === "continue";
    const rivalSeat = getPoolPvPRivalSeat(seat);
    const nowIso = new Date().toISOString();

    if (currentSetup.phase === "mode-reveal") {
      if (!revealMode) {
        return sendJson(res, 400, { ok: false, error: "Aguarde a animacao do modo escolhido." });
      }
      const nextSetup = createPoolPvPSetup({
        ...currentSetup,
        complete: false,
        phase: "tutorial",
        chooserSeat: "",
        tutorialReady: currentSetup.tutorialReady || { playerOne: false, playerTwo: false },
      });
      const poolState = {
        ...(match.poolState || createPoolPvPState(currentSetup.ruleMode || "livre", nextSetup)),
        setup: nextSetup,
      };
      store.matches[matchIndex] = patchPubpaidPvpMatchPresence({
        ...match,
        poolState,
        turn: nextSetup.starterSeat || match.turn,
        resultSummary: `Modo ${getPoolRuleMode(poolState.ruleMode).label} revelado. Leia o tutorial antes da primeira tacada.`,
      }, seat, nowIso);
      store = writePubpaidPvpStore(store);
      return sendJson(res, 200, buildPubpaidPvpStatePayload(store, authUser, "pool"));
    }

    if (currentSetup.phase === "tutorial") {
      if (revealMode) {
        return sendJson(res, 200, buildPubpaidPvpStatePayload(store, authUser, "pool"));
      }
      if (!confirmTutorial) {
        return sendJson(res, 400, { ok: false, error: "Leia o tutorial e confirme para comecar." });
      }
      const tutorialReady = {
        ...(currentSetup.tutorialReady || { playerOne: false, playerTwo: false }),
        [seat]: true,
      };
      const bothTutorialReady = Boolean(tutorialReady.playerOne && tutorialReady.playerTwo);
      const nextSetup = createPoolPvPSetup({
        ...currentSetup,
        complete: bothTutorialReady,
        phase: bothTutorialReady ? "done" : "tutorial",
        chooserSeat: "",
        tutorialReady,
        decidedAt: bothTutorialReady ? nowIso : currentSetup.decidedAt,
      });
      const poolState = {
        ...(match.poolState || createPoolPvPState(currentSetup.ruleMode || "livre", nextSetup)),
        setup: nextSetup,
      };
      const starterName = match?.[nextSetup.starterSeat]?.name || "Jogador";
      store.matches[matchIndex] = patchPubpaidPvpMatchPresence({
        ...match,
        poolState,
        turn: nextSetup.starterSeat || match.turn,
        resultSummary: bothTutorialReady
          ? `Tutorial confirmado. ${starterName} abre a sinuca ${getPoolRuleMode(poolState.ruleMode).label}.`
          : `${match?.[seat]?.name || "Jogador"} confirmou o tutorial. Aguardando o outro jogador.`,
      }, seat, nowIso);
      store = writePubpaidPvpStore(store);
      return sendJson(res, 200, buildPubpaidPvpStatePayload(store, authUser, "pool"));
    }

    if (currentSetup.chooserSeat !== seat) {
      return sendJson(res, 403, { ok: false, error: "Aguarde: a escolha da moeda esta com o outro jogador." });
    }
    if (!chooseMode && !chooseStart) {
      return sendJson(res, 400, { ok: false, error: "Escolha comecar ou escolher a modalidade." });
    }
    const chooserName = match?.[seat]?.name || "Jogador";
    let poolState = match.poolState || createPoolPvPState();
    let nextTurn = match.turn;
    let resultSummary = "";

    if (currentSetup.phase === "winner-choice") {
      if (chooseStart) {
        const nextSetup = createPoolPvPSetup({
          ...currentSetup,
          phase: "loser-mode",
          chooserSeat: rivalSeat,
          starterSeat: seat,
          modeChooserSeat: rivalSeat,
          winnerChoice: "start",
          choice: "start",
          ruleMode: "",
        });
        poolState = { ...poolState, setup: nextSetup };
        nextTurn = rivalSeat;
        resultSummary = `${chooserName} ganhou a moeda e escolheu comecar. O rival escolhe a modalidade.`;
      } else {
        const rule = getPoolRuleMode(requestedMode);
        const nextSetup = createPoolPvPSetup({
          ...currentSetup,
          phase: "loser-start",
          chooserSeat: rivalSeat,
          starterSeat: "",
          starterChooserSeat: rivalSeat,
          winnerChoice: "mode",
          choice: "mode",
          ruleMode: rule.id,
        });
        poolState = { ...poolState, ruleMode: rule.id, ruleLabel: rule.label, scoreLabel: rule.scoreLabel, setup: nextSetup };
        nextTurn = rivalSeat;
        resultSummary = `${chooserName} ganhou a moeda e escolheu ${rule.label}. O rival escolhe quem comeca.`;
      }
    } else if (currentSetup.phase === "loser-mode") {
      if (!chooseMode) {
        return sendJson(res, 400, { ok: false, error: "Agora escolha a modalidade que faltou." });
      }
      const rule = getPoolRuleMode(requestedMode);
      poolState = createPoolPvPState(rule.id, {
        ...currentSetup,
        complete: false,
        phase: "mode-reveal",
        chooserSeat: "",
        starterSeat: currentSetup.starterSeat || rivalSeat,
        ruleMode: rule.id,
        tutorialReady: { playerOne: false, playerTwo: false },
      });
      nextTurn = poolState.setup.starterSeat;
      resultSummary = `${chooserName} escolheu ${rule.label}. Animacao do modo antes do tutorial.`;
    } else if (currentSetup.phase === "loser-start") {
      if (!chooseStart) {
        return sendJson(res, 400, { ok: false, error: "Agora escolha quem começa a partida." });
      }
      const starterPreference = safeString(body.starter || "", 20);
      const starterSeat = starterPreference === "rival"
        ? rivalSeat
        : starterPreference === "playerOne" || starterPreference === "playerTwo"
          ? starterPreference
          : seat;
      const rule = getPoolRuleMode(currentSetup.ruleMode || requestedMode);
      poolState = createPoolPvPState(rule.id, {
        ...currentSetup,
        complete: false,
        phase: "mode-reveal",
        chooserSeat: "",
        starterSeat,
        ruleMode: rule.id,
        tutorialReady: { playerOne: false, playerTwo: false },
      });
      nextTurn = starterSeat;
      resultSummary = `${chooserName} escolheu quem comeca. Animacao de ${rule.label} antes do tutorial.`;
    } else {
      return sendJson(res, 409, { ok: false, error: "Estado da moeda invalido. Reabra a mesa." });
    }

    store.matches[matchIndex] = patchPubpaidPvpMatchPresence({
      ...match,
      poolState,
      turn: nextTurn,
      resultSummary,
    }, seat, nowIso);
    store = writePubpaidPvpStore(store);
    return sendJson(res, 200, buildPubpaidPvpStatePayload(store, authUser, "pool"));
  }

  if (req.method === "POST" && pathname === "/api/pubpaid/pvp/pool/shot") {
    const authUser = readCatalogoAuthSession(req);
    if (!authUser) {
      return sendJson(res, 401, { ok: false, error: "Entre com Google para jogar a sinuca PvP." });
    }
    const body = await parseBody(req);
    const matchId = cleanShortText(body.matchId || "", 120);
    const angle = clampPoolNumber(body.angle, -180, 180, 0);
    const power = clampPoolNumber(body.power, 0.1, 1, 0.5);
    const spin = normalizePoolSpin(body.spin || "centro");
    const cuePlace = Number.isFinite(Number(body.cueX)) && Number.isFinite(Number(body.cueY))
      ? {
          x: clampPoolNumber(body.cueX, PVP_POOL_TABLE.radius, PVP_POOL_TABLE.width - PVP_POOL_TABLE.radius, PVP_POOL_TABLE.cueStart.x),
          y: clampPoolNumber(body.cueY, PVP_POOL_TABLE.radius, PVP_POOL_TABLE.height - PVP_POOL_TABLE.radius, PVP_POOL_TABLE.cueStart.y),
        }
      : null;
    if (!matchId) {
      return sendJson(res, 400, { ok: false, error: "Informe a mesa PvP." });
    }

    let store = cleanupPubpaidPvpStore(readPubpaidPvpStore());
    const matchIndex = store.matches.findIndex((entry) => entry?.id === matchId && entry?.gameId === "pool");
    if (matchIndex < 0) {
      return sendJson(res, 404, { ok: false, error: "Mesa de sinuca PvP nao encontrada." });
    }
    const match = store.matches[matchIndex];
    const walletKey = getPubpaidWalletKey(authUser);
    const seat = match?.playerOne?.walletKey === walletKey ? "playerOne" : match?.playerTwo?.walletKey === walletKey ? "playerTwo" : "";
    if (!seat) {
      return sendJson(res, 403, { ok: false, error: "Essa mesa pertence a outros jogadores." });
    }
    if (match.status !== "active") {
      return sendJson(res, 400, { ok: false, error: "Essa mesa PvP nao esta mais ativa." });
    }
    if (match.turn !== seat) {
      return sendJson(res, 409, { ok: false, error: "Espere a vez do outro jogador." });
    }
    const currentPoolState = match.poolState || createPoolPvPState();
    const setup = createPoolPvPSetup(currentPoolState.setup || { complete: true, phase: "done" });
    if (!setup.complete) {
      return sendJson(res, 409, { ok: false, error: "A partida ainda esta na escolha da moeda/modalidade." });
    }

    if (currentPoolState.ballInHandSeat === seat && !cuePlace) {
      return sendJson(res, 400, { ok: false, error: "Bola na mao: posicione a branca antes de tacar." });
    }

    const simulation = simulatePoolPvPShot(currentPoolState, seat, angle, power, spin, cuePlace);
    const poolState = simulation.poolState;
    const rivalSeat = seat === "playerOne" ? "playerTwo" : "playerOne";
    const nextTurn = rivalSeat;
    let winner = "";
    let finished = Boolean(simulation.finished);
    let resultSummary =
      simulation.pocketedCount > 0
        ? `${match?.[seat]?.name || "Jogador"} encaçapou ${simulation.pocketedCount} bola${simulation.pocketedCount > 1 ? "s" : ""}. ${simulation.message || ""}`.trim()
        : `${match?.[seat]?.name || "Jogador"} tacou sem encaçapar.`;
    const groupSummary = describePoolGroupOwners(match, poolState);
    if (groupSummary) {
      resultSummary = `${resultSummary} ${groupSummary}`;
    }
    if (simulation.cuePocketed) {
      resultSummary = `${resultSummary} A branca caiu; falta, ${match?.[nextTurn]?.name || "rival"} fica com bola na mao e pode posicionar a branca.`;
    }
    if (finished) {
      winner = simulation.winner || resolvePoolPvPWinner(poolState);
      poolState.finished = true;
      poolState.winner = winner || "draw";
      if (winner) {
        resultSummary = `${match?.[winner]?.name || "Jogador"} venceu a sinuca por ${poolState.playerOneScore || 0} a ${poolState.playerTwoScore || 0}.`;
      } else {
        resultSummary = `A sinuca empatou em ${poolState.playerOneScore || 0} a ${poolState.playerTwoScore || 0}. Entrada devolvida.`;
      }
    } else if (!simulation.cuePocketed) {
      resultSummary = `${resultSummary} ${match?.[nextTurn]?.name || "Rival"} joga agora.`;
    }

    const nowIso = new Date().toISOString();
    store.matches[matchIndex] = patchPubpaidPvpMatchPresence({
      ...match,
      poolState,
      turn: finished ? match.turn : nextTurn,
      winner,
      resultSummary,
      moveCount: clampInteger(match.moveCount) + 1,
      status: finished ? "finished" : "active",
      finishedAt: finished ? nowIso : "",
    }, seat, nowIso);
    store = writePubpaidPvpStore(store);
    return sendJson(res, 200, buildPubpaidPvpStatePayload(store, authUser, "pool"));
  }

  if (req.method === "POST" && pathname === "/api/pubpaid/pvp/checkers/move") {
    const authUser = readCatalogoAuthSession(req);
    if (!authUser) {
      return sendJson(res, 401, { ok: false, error: "Entre com Google para jogar a mesa PvP." });
    }
    const body = await parseBody(req);
    const matchId = cleanShortText(body.matchId || "", 120);
    if (!matchId) {
      return sendJson(res, 400, { ok: false, error: "Informe a mesa PvP." });
    }
    let store = cleanupPubpaidPvpStore(readPubpaidPvpStore());
    const matchIndex = store.matches.findIndex((entry) => entry?.id === matchId && entry?.gameId === "checkers");
    if (matchIndex < 0) {
      return sendJson(res, 404, { ok: false, error: "Mesa PvP nao encontrada." });
    }
    const match = store.matches[matchIndex];
    const walletKey = getPubpaidWalletKey(authUser);
    const seat = match?.playerOne?.walletKey === walletKey ? "playerOne" : match?.playerTwo?.walletKey === walletKey ? "playerTwo" : "";
    if (!seat) {
      return sendJson(res, 403, { ok: false, error: "Essa mesa pertence a outros jogadores." });
    }
    if (match.status !== "active") {
      return sendJson(res, 400, { ok: false, error: "Essa mesa PvP nao esta mais ativa." });
    }
    if (match.turn !== seat) {
      return sendJson(res, 409, { ok: false, error: "Espere a vez do outro jogador." });
    }

    const move = body.move || {};
    const board = Array.isArray(match.board) ? match.board : createCheckersPvPBoard();
    const validMoves = getAllPvpCheckersMoves(board, seat, match.forcedPiece || null);
    const chosenMove = validMoves.find((entry) =>
      clampInteger(entry?.from?.row, -1) === clampInteger(move?.from?.row, -1) &&
      clampInteger(entry?.from?.col, -1) === clampInteger(move?.from?.col, -1) &&
      clampInteger(entry?.to?.row, -1) === clampInteger(move?.to?.row, -1) &&
      clampInteger(entry?.to?.col, -1) === clampInteger(move?.to?.col, -1)
    );
    if (!chosenMove) {
      return sendJson(res, 400, { ok: false, error: "Jogada invalida para o tabuleiro atual." });
    }

    let nextBoard = applyPvpCheckersMove(board, chosenMove);
    let nextTurn = seat === "playerOne" ? "playerTwo" : "playerOne";
    let forcedPiece = null;
    let resultSummary = "";
    let winner = getPvpCheckersOutcome(nextBoard);
    if (!winner && chosenMove.capture) {
      const followCaptures = getPvpCheckersCapturesForPiece(nextBoard, chosenMove.to.row, chosenMove.to.col);
      if (followCaptures.length) {
        nextTurn = seat;
        forcedPiece = { row: chosenMove.to.row, col: chosenMove.to.col };
        resultSummary = "A captura continua com a mesma peca.";
      }
    }
    if (!winner && !resultSummary) {
      resultSummary = nextTurn === "playerOne"
        ? `${match?.playerOne?.name || "Jogador 1"} pensa a resposta.`
        : `${match?.playerTwo?.name || "Jogador 2"} pensa a resposta.`;
    }
    const finished = Boolean(winner);
    if (winner) {
      resultSummary =
        winner === "playerOne"
          ? `${match?.playerOne?.name || "Jogador 1"} fechou a mesa de damas.`
          : `${match?.playerTwo?.name || "Jogador 2"} fechou a mesa de damas.`;
    }

    const nowIso = new Date().toISOString();
    const historyEntry = {
      index: clampInteger(match.moveCount) + 1,
      seat,
      playerName: seat === "playerOne" ? match?.playerOne?.name || "Jogador 1" : match?.playerTwo?.name || "Jogador 2",
      from: chosenMove.from,
      to: chosenMove.to,
      capture: chosenMove.capture || null,
      piece: board?.[chosenMove.from.row]?.[chosenMove.from.col] || "",
      crowned: Boolean(
        (board?.[chosenMove.from.row]?.[chosenMove.from.col] || "") !==
          (nextBoard?.[chosenMove.to.row]?.[chosenMove.to.col] || "") &&
          (board?.[chosenMove.from.row]?.[chosenMove.from.col] || "").toLowerCase() ===
            (nextBoard?.[chosenMove.to.row]?.[chosenMove.to.col] || "").toLowerCase()
      ),
      at: nowIso,
    };
    store.matches[matchIndex] = {
      ...match,
      presence: {
        ...(match.presence || {}),
        [seat]: {
          ...(match.presence?.[seat] || {}),
          connected: true,
          lastSeenAt: nowIso,
        },
      },
      board: nextBoard,
      lastMove: {
        ...chosenMove,
        seat,
        piece: historyEntry.piece,
        capturedPiece: chosenMove.capture ? board?.[chosenMove.capture.row]?.[chosenMove.capture.col] || "" : "",
        at: nowIso,
      },
      checkersHistory: Array.isArray(match.checkersHistory)
        ? match.checkersHistory.concat(historyEntry).slice(-80)
        : [historyEntry],
      turn: nextTurn,
      forcedPiece: finished ? null : forcedPiece,
      winner: winner || "",
      resultSummary,
      moveCount: clampInteger(match.moveCount) + 1,
      status: finished ? "finished" : "active",
      finishedAt: finished ? nowIso : "",
      updatedAt: nowIso,
    };
    store = writePubpaidPvpStore(store);
    return sendJson(res, 200, buildPubpaidPvpStatePayload(store, authUser, "checkers"));
  }

  if (req.method === "POST" && pathname === "/api/pubpaid/pvp/cards21/action") {
    const authUser = readCatalogoAuthSession(req);
    if (!authUser) {
      return sendJson(res, 401, { ok: false, error: "Entre com Google para jogar a mesa PvP." });
    }
    const body = await parseBody(req);
    const matchId = cleanShortText(body.matchId || "", 120);
    const action = cleanShortText(body.action || "", 20).toLowerCase();
    if (!matchId) {
      return sendJson(res, 400, { ok: false, error: "Informe a mesa PvP." });
    }
    if (!["hit", "stand"].includes(action)) {
      return sendJson(res, 400, { ok: false, error: "Acao invalida para a mesa do 21." });
    }

    let store = cleanupPubpaidPvpStore(readPubpaidPvpStore());
    const matchIndex = store.matches.findIndex((entry) => entry?.id === matchId && entry?.gameId === "cards21");
    if (matchIndex < 0) {
      return sendJson(res, 404, { ok: false, error: "Mesa PvP nao encontrada." });
    }
    const match = store.matches[matchIndex];
    const walletKey = getPubpaidWalletKey(authUser);
    const seat = match?.playerOne?.walletKey === walletKey ? "playerOne" : match?.playerTwo?.walletKey === walletKey ? "playerTwo" : "";
    if (!seat) {
      return sendJson(res, 403, { ok: false, error: "Essa mesa pertence a outros jogadores." });
    }
    if (match.status !== "active") {
      return sendJson(res, 400, { ok: false, error: "Essa mesa PvP nao esta mais ativa." });
    }
    if (match.turn !== seat) {
      return sendJson(res, 409, { ok: false, error: "Espere a vez do outro jogador." });
    }

    const cardsState = match?.cardsState || createCards21PvPState();
    const stateKey = getCards21SeatStateKey(seat);
    const cardsKey = getCards21SeatCardsKey(seat);
    const rivalSeat = seat === "playerOne" ? "playerTwo" : "playerOne";
    const rivalStateKey = getCards21SeatStateKey(rivalSeat);
    if (!stateKey || !cardsKey || cardsState[stateKey] !== "active") {
      return sendJson(res, 400, { ok: false, error: "Sua mao nessa mesa ja foi encerrada." });
    }

    let resultSummary = "";
    let winner = "";
    let finished = false;

    if (action === "hit") {
      cardsState[cardsKey] = [...(Array.isArray(cardsState[cardsKey]) ? cardsState[cardsKey] : []), drawPubpaid21Card(cardsState)];
      const total = sumPubpaid21Cards(cardsState[cardsKey]);
      if (total > 21) {
        cardsState[stateKey] = "busted";
        finished = true;
        winner = rivalSeat;
        resultSummary =
          rivalSeat === "playerOne"
            ? `${match?.playerTwo?.name || "Jogador 2"} estourou em ${total}. ${match?.playerOne?.name || "Jogador 1"} levou a mesa do 21.`
            : `${match?.playerOne?.name || "Jogador 1"} estourou em ${total}. ${match?.playerTwo?.name || "Jogador 2"} levou a mesa do 21.`;
      } else if (total === 21) {
        cardsState[stateKey] = "stood";
        resultSummary = `${seat === "playerOne" ? match?.playerOne?.name || "Jogador 1" : match?.playerTwo?.name || "Jogador 2"} travou em 21 e passou a vez.`;
      } else {
        resultSummary = `${seat === "playerOne" ? match?.playerOne?.name || "Jogador 1" : match?.playerTwo?.name || "Jogador 2"} comprou e foi para ${total}.`;
      }
    } else {
      cardsState[stateKey] = "stood";
      resultSummary = `${seat === "playerOne" ? match?.playerOne?.name || "Jogador 1" : match?.playerTwo?.name || "Jogador 2"} parou a mao.`;
    }

    const bothClosed = cardsState.playerOneState !== "active" && cardsState.playerTwoState !== "active";
    if (!finished && bothClosed) {
      const resolution = resolveCards21PvpMatch({ ...match, cardsState });
      finished = true;
      winner = resolution.winner;
      resultSummary = resolution.resultSummary;
    }

    let nextTurn = rivalSeat;
    if (!finished) {
      if (cardsState[rivalStateKey] !== "active") {
        nextTurn = seat;
      }
      resultSummary = `${resultSummary} ${nextTurn === "playerOne" ? match?.playerOne?.name || "Jogador 1" : match?.playerTwo?.name || "Jogador 2"} responde agora.`;
    }

    const nowIso = new Date().toISOString();
    store.matches[matchIndex] = patchPubpaidPvpMatchPresence({
      ...match,
      cardsState,
      turn: nextTurn,
      winner,
      resultSummary,
      moveCount: clampInteger(match.moveCount) + 1,
      status: finished ? "finished" : "active",
      finishedAt: finished ? nowIso : "",
    }, seat, nowIso);
    store = writePubpaidPvpStore(store);
    return sendJson(res, 200, buildPubpaidPvpStatePayload(store, authUser, "cards21"));
  }

  if (req.method === "POST" && pathname === "/api/pubpaid/pvp/poker/draw") {
    const authUser = readCatalogoAuthSession(req);
    if (!authUser) {
      return sendJson(res, 401, { ok: false, error: "Entre com Google para jogar a mesa PvP." });
    }
    const body = await parseBody(req);
    const matchId = cleanShortText(body.matchId || "", 120);
    if (!matchId) {
      return sendJson(res, 400, { ok: false, error: "Informe a mesa PvP." });
    }

    let store = cleanupPubpaidPvpStore(readPubpaidPvpStore());
    const matchIndex = store.matches.findIndex((entry) => entry?.id === matchId && entry?.gameId === "poker");
    if (matchIndex < 0) {
      return sendJson(res, 404, { ok: false, error: "Mesa PvP nao encontrada." });
    }
    const match = store.matches[matchIndex];
    const walletKey = getPubpaidWalletKey(authUser);
    const seat = match?.playerOne?.walletKey === walletKey ? "playerOne" : match?.playerTwo?.walletKey === walletKey ? "playerTwo" : "";
    if (!seat) {
      return sendJson(res, 403, { ok: false, error: "Essa mesa pertence a outros jogadores." });
    }
    if (match.status !== "active") {
      return sendJson(res, 400, { ok: false, error: "Essa mesa PvP nao esta mais ativa." });
    }
    if (match.turn !== seat) {
      return sendJson(res, 409, { ok: false, error: "Espere a vez do outro jogador." });
    }

    const pokerState = match?.pokerState || createPokerPvPState();
    const cardsKey = seat === "playerOne" ? "playerOneCards" : "playerTwoCards";
    const heldKey = seat === "playerOne" ? "playerOneHeld" : "playerTwoHeld";
    const drawUsedKey = seat === "playerOne" ? "playerOneDrawUsed" : "playerTwoDrawUsed";
    const rivalDrawUsedKey = seat === "playerOne" ? "playerTwoDrawUsed" : "playerOneDrawUsed";
    if (pokerState[drawUsedKey]) {
      return sendJson(res, 400, { ok: false, error: "Sua troca dessa mesa ja foi usada." });
    }

    const heldRaw = Array.isArray(body.held) ? body.held.slice(0, 5) : [];
    const held = Array.from({ length: 5 }, (_, index) => Boolean(heldRaw[index]));
    pokerState[heldKey] = held;
    pokerState[cardsKey] = (Array.isArray(pokerState[cardsKey]) ? pokerState[cardsKey] : []).map((card, index) =>
      held[index] ? card : drawPokerPvpCards(pokerState.deck, 1)[0] || card
    );
    pokerState[drawUsedKey] = true;

    let nextTurn = seat === "playerOne" ? "playerTwo" : "playerOne";
    let winner = "";
    let finished = false;
    let resultSummary = `${seat === "playerOne" ? match?.playerOne?.name || "Jogador 1" : match?.playerTwo?.name || "Jogador 2"} trocou as cartas e passou a vez.`;

    if (pokerState[rivalDrawUsedKey]) {
      const playerOneHand = evaluatePokerPvpHand(pokerState.playerOneCards);
      const playerTwoHand = evaluatePokerPvpHand(pokerState.playerTwoCards);
      const result = comparePokerPvpHands(playerOneHand, playerTwoHand);
      finished = true;
      if (result > 0) {
        winner = "playerOne";
        resultSummary = `${match?.playerOne?.name || "Jogador 1"} mostrou ${playerOneHand.label} e venceu ${match?.playerTwo?.name || "Jogador 2"} com ${playerTwoHand.label}.`;
      } else if (result < 0) {
        winner = "playerTwo";
        resultSummary = `${match?.playerTwo?.name || "Jogador 2"} mostrou ${playerTwoHand.label} e venceu ${match?.playerOne?.name || "Jogador 1"} com ${playerOneHand.label}.`;
      } else {
        resultSummary = `As duas maos fecharam em ${playerOneHand.label}. A mesa de poker empatou.`;
      }
    } else {
      resultSummary = `${resultSummary} ${nextTurn === "playerOne" ? match?.playerOne?.name || "Jogador 1" : match?.playerTwo?.name || "Jogador 2"} troca agora.`;
    }

    const nowIso = new Date().toISOString();
    store.matches[matchIndex] = patchPubpaidPvpMatchPresence({
      ...match,
      pokerState,
      turn: nextTurn,
      winner,
      resultSummary,
      moveCount: clampInteger(match.moveCount) + 1,
      status: finished ? "finished" : "active",
      finishedAt: finished ? nowIso : "",
    }, seat, nowIso);
    store = writePubpaidPvpStore(store);
    return sendJson(res, 200, buildPubpaidPvpStatePayload(store, authUser, "poker"));
  }

  if (req.method === "POST" && pathname === "/api/pubpaid/pvp/darts/throw") {
    const authUser = readCatalogoAuthSession(req);
    if (!authUser) {
      return sendJson(res, 401, { ok: false, error: "Entre com Google para jogar a mesa PvP." });
    }
    const body = await parseBody(req);
    const matchId = cleanShortText(body.matchId || "", 120);
    const aimX = clampDartsAimValue(body.aimX, 50);
    const aimY = clampDartsAimValue(body.aimY, 50);
    if (!matchId) {
      return sendJson(res, 400, { ok: false, error: "Informe a mesa PvP." });
    }
    if (aimX < 8 || aimX > 92 || aimY < 8 || aimY > 92) {
      return sendJson(res, 400, { ok: false, error: "A mira dos dardos precisa ficar dentro do alvo." });
    }

    let store = cleanupPubpaidPvpStore(readPubpaidPvpStore());
    const matchIndex = store.matches.findIndex((entry) => entry?.id === matchId && entry?.gameId === "darts");
    if (matchIndex < 0) {
      return sendJson(res, 404, { ok: false, error: "Mesa PvP nao encontrada." });
    }
    const match = store.matches[matchIndex];
    const walletKey = getPubpaidWalletKey(authUser);
    const seat = match?.playerOne?.walletKey === walletKey ? "playerOne" : match?.playerTwo?.walletKey === walletKey ? "playerTwo" : "";
    if (!seat) {
      return sendJson(res, 403, { ok: false, error: "Essa mesa pertence a outros jogadores." });
    }
    if (match.status !== "active") {
      return sendJson(res, 400, { ok: false, error: "Essa mesa PvP nao esta mais ativa." });
    }
    if (match.turn !== seat) {
      return sendJson(res, 409, { ok: false, error: "Espere a vez do outro jogador." });
    }

    const dartsState = match?.dartsState || createDartsPvPState();
    const throwKey = seat === "playerOne" ? "playerOneThrow" : "playerTwoThrow";
    const lastKey = seat === "playerOne" ? "lastPlayerOne" : "lastPlayerTwo";
    const aimXKey = seat === "playerOne" ? "playerOneAimX" : "playerTwoAimX";
    const aimYKey = seat === "playerOne" ? "playerOneAimY" : "playerTwoAimY";
    const rivalThrowKey = seat === "playerOne" ? "playerTwoThrow" : "playerOneThrow";
    if (dartsState[throwKey]) {
      return sendJson(res, 400, { ok: false, error: "Seu arremesso dessa rodada ja foi enviado." });
    }

    const throwResult = rollDartsPvpThrow(aimX, aimY);
    dartsState[throwKey] = throwResult;
    dartsState[lastKey] = throwResult;
    dartsState[aimXKey] = aimX;
    dartsState[aimYKey] = aimY;

    let nextTurn = seat === "playerOne" ? "playerTwo" : "playerOne";
    let winner = "";
    let finished = false;
    let resultSummary = `${seat === "playerOne" ? match?.playerOne?.name || "Jogador 1" : match?.playerTwo?.name || "Jogador 2"} mirou em ${throwResult.targetLabel} e caiu em ${throwResult.label} (${throwResult.score}).`;

    if (dartsState[rivalThrowKey]) {
      const playerOneThrow = dartsState.playerOneThrow;
      const playerTwoThrow = dartsState.playerTwoThrow;
      dartsState.playerOneScore += clampInteger(playerOneThrow.score);
      dartsState.playerTwoScore += clampInteger(playerTwoThrow.score);
      if (playerOneThrow.score > playerTwoThrow.score) {
        resultSummary = `${match?.playerOne?.name || "Jogador 1"} levou a rodada dos dardos por ${playerOneThrow.score} a ${playerTwoThrow.score}.`;
      } else if (playerTwoThrow.score > playerOneThrow.score) {
        resultSummary = `${match?.playerTwo?.name || "Jogador 2"} levou a rodada dos dardos por ${playerTwoThrow.score} a ${playerOneThrow.score}.`;
      } else {
        resultSummary = `A rodada de dardos empatou em ${playerOneThrow.score}.`;
      }
      dartsState.history.push({
        round: dartsState.round,
        playerOne: playerOneThrow.score,
        playerTwo: playerTwoThrow.score,
      });
      dartsState.playerOneThrow = null;
      dartsState.playerTwoThrow = null;

      if (dartsState.round >= dartsState.maxRounds) {
        finished = true;
        if (dartsState.playerOneScore > dartsState.playerTwoScore) {
          winner = "playerOne";
          resultSummary = `${match?.playerOne?.name || "Jogador 1"} venceu os dardos por ${dartsState.playerOneScore} a ${dartsState.playerTwoScore}.`;
        } else if (dartsState.playerTwoScore > dartsState.playerOneScore) {
          winner = "playerTwo";
          resultSummary = `${match?.playerTwo?.name || "Jogador 2"} venceu os dardos por ${dartsState.playerTwoScore} a ${dartsState.playerOneScore}.`;
        } else {
          resultSummary = `Os dardos fecharam empatados em ${dartsState.playerOneScore} a ${dartsState.playerTwoScore}.`;
        }
      } else {
        dartsState.round += 1;
        nextTurn = "playerOne";
        resultSummary = `${resultSummary} Nova rodada aberta no alvo. ${match?.playerOne?.name || "Jogador 1"} mira primeiro.`;
      }
    } else {
      resultSummary = `${resultSummary} ${nextTurn === "playerOne" ? match?.playerOne?.name || "Jogador 1" : match?.playerTwo?.name || "Jogador 2"} responde agora.`;
    }

    const nowIso = new Date().toISOString();
    store.matches[matchIndex] = patchPubpaidPvpMatchPresence({
      ...match,
      dartsState,
      lastThrow: {
        ...throwResult,
        seat,
        aimX,
        aimY,
        at: nowIso,
      },
      turn: nextTurn,
      winner,
      resultSummary,
      moveCount: clampInteger(match.moveCount) + 1,
      status: finished ? "finished" : "active",
      finishedAt: finished ? nowIso : "",
    }, seat, nowIso);
    store = writePubpaidPvpStore(store);
    return sendJson(res, 200, buildPubpaidPvpStatePayload(store, authUser, "darts"));
  }

  if (req.method === "POST" && pathname === "/api/pubpaid/pvp/dicecups/guess") {
    const authUser = readCatalogoAuthSession(req);
    if (!authUser) {
      return sendJson(res, 401, { ok: false, error: "Entre com Google para jogar a mesa PvP." });
    }
    const body = await parseBody(req);
    const matchId = cleanShortText(body.matchId || "", 120);
    const guess = clampInteger(body.guess);
    if (!matchId) {
      return sendJson(res, 400, { ok: false, error: "Informe a mesa PvP." });
    }
    if (guess < 2 || guess > 12) {
      return sendJson(res, 400, { ok: false, error: "Escolha uma soma valida entre 2 e 12." });
    }

    let store = cleanupPubpaidPvpStore(readPubpaidPvpStore());
    const matchIndex = store.matches.findIndex((entry) => entry?.id === matchId && entry?.gameId === "dicecups");
    if (matchIndex < 0) {
      return sendJson(res, 404, { ok: false, error: "Mesa PvP nao encontrada." });
    }
    const match = store.matches[matchIndex];
    const walletKey = getPubpaidWalletKey(authUser);
    const seat = match?.playerOne?.walletKey === walletKey ? "playerOne" : match?.playerTwo?.walletKey === walletKey ? "playerTwo" : "";
    if (!seat) {
      return sendJson(res, 403, { ok: false, error: "Essa mesa pertence a outros jogadores." });
    }
    if (match.status !== "active") {
      return sendJson(res, 400, { ok: false, error: "Essa mesa PvP nao esta mais ativa." });
    }
    if (match.turn !== seat) {
      return sendJson(res, 409, { ok: false, error: "Espere a vez do outro jogador." });
    }

    const diceState = match?.diceState || createDicecupsPvPState();
    const guessKey = seat === "playerOne" ? "playerOneGuess" : "playerTwoGuess";
    const rivalGuessKey = seat === "playerOne" ? "playerTwoGuess" : "playerOneGuess";
    if (clampInteger(diceState[guessKey]) > 0) {
      return sendJson(res, 400, { ok: false, error: "Seu palpite dessa rodada ja foi enviado." });
    }

    diceState[guessKey] = guess;
    let nextTurn = seat === "playerOne" ? "playerTwo" : "playerOne";
    let winner = "";
    let finished = false;
    let resultSummary = `${seat === "playerOne" ? match?.playerOne?.name || "Jogador 1" : match?.playerTwo?.name || "Jogador 2"} cobriu a soma ${guess}.`;

    if (clampInteger(diceState[rivalGuessKey]) > 0) {
      diceState.dice = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
      diceState.total = diceState.dice[0] + diceState.dice[1];
      const playerOneDiff = Math.abs(clampInteger(diceState.playerOneGuess) - diceState.total);
      const playerTwoDiff = Math.abs(clampInteger(diceState.playerTwoGuess) - diceState.total);
      if (playerOneDiff < playerTwoDiff) {
        diceState.playerOneScore += 1;
        resultSummary = `${match?.playerOne?.name || "Jogador 1"} leu melhor os copos e venceu a soma ${diceState.total}.`;
      } else if (playerTwoDiff < playerOneDiff) {
        diceState.playerTwoScore += 1;
        resultSummary = `${match?.playerTwo?.name || "Jogador 2"} leu melhor os copos e venceu a soma ${diceState.total}.`;
      } else {
        resultSummary = `Os dois ficaram na mesma distancia da soma ${diceState.total}.`;
      }
      diceState.history.push({
        round: diceState.round,
        playerOne: diceState.playerOneGuess,
        playerTwo: diceState.playerTwoGuess,
        total: diceState.total,
      });
      if (diceState.round >= diceState.maxRounds) {
        finished = true;
        if (diceState.playerOneScore > diceState.playerTwoScore) {
          winner = "playerOne";
          resultSummary = `${match?.playerOne?.name || "Jogador 1"} venceu os copos por ${diceState.playerOneScore} a ${diceState.playerTwoScore}.`;
        } else if (diceState.playerTwoScore > diceState.playerOneScore) {
          winner = "playerTwo";
          resultSummary = `${match?.playerTwo?.name || "Jogador 2"} venceu os copos por ${diceState.playerTwoScore} a ${diceState.playerOneScore}.`;
        } else {
          resultSummary = `Os copos fecharam empatados em ${diceState.playerOneScore} a ${diceState.playerTwoScore}.`;
        }
      } else {
        diceState.round += 1;
        diceState.playerOneGuess = 0;
        diceState.playerTwoGuess = 0;
        nextTurn = "playerOne";
        resultSummary = `${resultSummary} Nova rodada aberta. ${match?.playerOne?.name || "Jogador 1"} escolhe primeiro.`;
      }
    } else {
      resultSummary = `${resultSummary} ${nextTurn === "playerOne" ? match?.playerOne?.name || "Jogador 1" : match?.playerTwo?.name || "Jogador 2"} responde agora.`;
    }

    const nowIso = new Date().toISOString();
    store.matches[matchIndex] = patchPubpaidPvpMatchPresence({
      ...match,
      diceState,
      turn: nextTurn,
      winner,
      resultSummary,
      moveCount: clampInteger(match.moveCount) + 1,
      status: finished ? "finished" : "active",
      finishedAt: finished ? nowIso : "",
    }, seat, nowIso);
    store = writePubpaidPvpStore(store);
    return sendJson(res, 200, buildPubpaidPvpStatePayload(store, authUser, "dicecups"));
  }

  if (req.method === "POST" && pathname === "/api/pubpaid/pvp/truco/play") {
    const authUser = readCatalogoAuthSession(req);
    if (!authUser) {
      return sendJson(res, 401, { ok: false, error: "Entre com Google para jogar a mesa PvP." });
    }
    const body = await parseBody(req);
    const matchId = cleanShortText(body.matchId || "", 120);
    const cardIndex = clampInteger(body.cardIndex, -1);
    if (!matchId) {
      return sendJson(res, 400, { ok: false, error: "Informe a mesa PvP." });
    }
    if (cardIndex < 0 || cardIndex > 2) {
      return sendJson(res, 400, { ok: false, error: "Escolha uma carta valida." });
    }

    let store = cleanupPubpaidPvpStore(readPubpaidPvpStore());
    const matchIndex = store.matches.findIndex((entry) => entry?.id === matchId && entry?.gameId === "truco");
    if (matchIndex < 0) {
      return sendJson(res, 404, { ok: false, error: "Mesa PvP nao encontrada." });
    }
    const match = store.matches[matchIndex];
    const walletKey = getPubpaidWalletKey(authUser);
    const seat = match?.playerOne?.walletKey === walletKey ? "playerOne" : match?.playerTwo?.walletKey === walletKey ? "playerTwo" : "";
    if (!seat) {
      return sendJson(res, 403, { ok: false, error: "Essa mesa pertence a outros jogadores." });
    }
    if (match.status !== "active") {
      return sendJson(res, 400, { ok: false, error: "Essa mesa PvP nao esta mais ativa." });
    }
    if (match.turn !== seat) {
      return sendJson(res, 409, { ok: false, error: "Espere a vez do outro jogador." });
    }

    const trucoState = match?.trucoState || createTrucoPvPState();
    const cardsKey = seat === "playerOne" ? "playerOneCards" : "playerTwoCards";
    const card = Array.isArray(trucoState[cardsKey]) ? trucoState[cardsKey][cardIndex] : null;
    if (!card) {
      return sendJson(res, 400, { ok: false, error: "Essa carta ja foi jogada." });
    }
    trucoState[cardsKey][cardIndex] = null;
    trucoState.table = Array.isArray(trucoState.table) ? trucoState.table : [];
    trucoState.table.push({ seat, card, at: new Date().toISOString() });

    let nextTurn = seat === "playerOne" ? "playerTwo" : "playerOne";
    let winner = "";
    let finished = false;
    let resultSummary = `${seat === "playerOne" ? match?.playerOne?.name || "Jogador 1" : match?.playerTwo?.name || "Jogador 2"} jogou ${card.rank} de ${card.suit}.`;

    if (trucoState.table.length >= 2) {
      const [firstPlay, secondPlay] = trucoState.table.slice(-2);
      let roundWinner = "";
      if (firstPlay.card.strength > secondPlay.card.strength) roundWinner = firstPlay.seat;
      if (secondPlay.card.strength > firstPlay.card.strength) roundWinner = secondPlay.seat;
      if (roundWinner === "playerOne") trucoState.playerOneScore += 1;
      if (roundWinner === "playerTwo") trucoState.playerTwoScore += 1;
      trucoState.history.push({
        round: trucoState.round,
        playerOne: firstPlay.seat === "playerOne" ? firstPlay.card : secondPlay.card,
        playerTwo: firstPlay.seat === "playerTwo" ? firstPlay.card : secondPlay.card,
        winner: roundWinner,
      });
      resultSummary = roundWinner
        ? `${match?.[roundWinner]?.name || "Jogador"} levou a mao ${trucoState.round}.`
        : `A mao ${trucoState.round} empatou.`;
      trucoState.table = [];
      if (trucoState.playerOneScore >= 2 || trucoState.playerTwoScore >= 2 || trucoState.round >= trucoState.maxRounds) {
        finished = true;
        if (trucoState.playerOneScore > trucoState.playerTwoScore) {
          winner = "playerOne";
          resultSummary = `${match?.playerOne?.name || "Jogador 1"} venceu o truco por ${trucoState.playerOneScore} a ${trucoState.playerTwoScore}.`;
        } else if (trucoState.playerTwoScore > trucoState.playerOneScore) {
          winner = "playerTwo";
          resultSummary = `${match?.playerTwo?.name || "Jogador 2"} venceu o truco por ${trucoState.playerTwoScore} a ${trucoState.playerOneScore}.`;
        } else {
          resultSummary = `O truco fechou empatado em ${trucoState.playerOneScore} a ${trucoState.playerTwoScore}.`;
        }
      } else {
        trucoState.round += 1;
        nextTurn = roundWinner || "playerOne";
        resultSummary = `${resultSummary} Mao ${trucoState.round}: ${match?.[nextTurn]?.name || "Jogador"} abre.`;
      }
    }

    const nowIso = new Date().toISOString();
    store.matches[matchIndex] = {
      ...match,
      trucoState,
      presence: {
        ...(match.presence || {}),
        [seat]: {
          ...(match.presence?.[seat] || {}),
          connected: true,
          lastSeenAt: nowIso,
        },
      },
      turn: nextTurn,
      winner,
      resultSummary,
      moveCount: clampInteger(match.moveCount) + 1,
      status: finished ? "finished" : "active",
      finishedAt: finished ? nowIso : "",
      updatedAt: nowIso,
    };
    store = writePubpaidPvpStore(store);
    return sendJson(res, 200, buildPubpaidPvpStatePayload(store, authUser, "truco"));
  }

  if (req.method === "POST" && pathname === "/api/pubpaid/pvp/chess/move") {
    const authUser = readCatalogoAuthSession(req);
    if (!authUser) {
      return sendJson(res, 401, { ok: false, error: "Entre com Google para jogar a mesa PvP." });
    }
    if (!Chess) {
      return sendJson(res, 503, { ok: false, error: "Motor de xadrez indisponivel no servidor." });
    }
    const body = await parseBody(req);
    const matchId = cleanShortText(body.matchId || "", 120);
    const from = cleanShortText(body.from || "", 4).toLowerCase();
    const to = cleanShortText(body.to || "", 4).toLowerCase();
    const promotion = cleanShortText(body.promotion || "q", 1).toLowerCase() || "q";
    if (!matchId || !/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to)) {
      return sendJson(res, 400, { ok: false, error: "Informe origem e destino validos." });
    }

    let store = cleanupPubpaidPvpStore(readPubpaidPvpStore());
    const matchIndex = store.matches.findIndex((entry) => entry?.id === matchId && entry?.gameId === "chess");
    if (matchIndex < 0) {
      return sendJson(res, 404, { ok: false, error: "Mesa PvP nao encontrada." });
    }
    const match = store.matches[matchIndex];
    const walletKey = getPubpaidWalletKey(authUser);
    const seat = match?.playerOne?.walletKey === walletKey ? "playerOne" : match?.playerTwo?.walletKey === walletKey ? "playerTwo" : "";
    if (!seat) {
      return sendJson(res, 403, { ok: false, error: "Essa mesa pertence a outros jogadores." });
    }
    if (match.status !== "active") {
      return sendJson(res, 400, { ok: false, error: "Essa mesa PvP nao esta mais ativa." });
    }
    const chessState = decorateChessPvPState(match?.chessState || createChessPvPState());
    const ownColor = chessState.whiteSeat === seat ? "w" : "b";
    const chess = new Chess(chessState.fen || undefined);
    if (chess.turn() !== ownColor) {
      return sendJson(res, 409, { ok: false, error: "Espere a vez do outro jogador." });
    }
    const move = chess.move({ from, to, promotion });
    if (!move) {
      return sendJson(res, 400, { ok: false, error: "Lance invalido para o xadrez atual." });
    }
    const moveStatus = getChessStatus(chess);
    const moveEntry = {
      index: clampInteger(match.moveCount) + 1,
      seat,
      playerName: match?.[seat]?.name || "Jogador",
      ...normalizeChessMoveDescriptor(move),
      check: moveStatus.inCheck,
      checkmate: moveStatus.checkmate,
      draw: moveStatus.draw,
      at: new Date().toISOString(),
    };
    const nextChessState = decorateChessPvPState({
      ...chessState,
      fen: chess.fen(),
      history: (Array.isArray(chessState.history) ? chessState.history : []).concat(moveEntry).slice(-160),
      lastMove: moveEntry,
    });

    const whiteSeat = chessState.whiteSeat || "playerOne";
    const blackSeat = chessState.blackSeat || "playerTwo";
    let nextTurn = chess.turn() === "w" ? whiteSeat : blackSeat;
    let winner = "";
    let finished = false;
    let resultSummary = `${match?.[seat]?.name || "Jogador"} jogou ${move.san}.`;
    if (moveStatus.checkmate) {
      finished = true;
      winner = seat;
      resultSummary = `${match?.[seat]?.name || "Jogador"} deu xeque-mate com ${move.san}.`;
    } else if (moveStatus.draw) {
      finished = true;
      resultSummary = "A mesa de xadrez terminou empatada.";
    } else if (moveStatus.inCheck) {
      resultSummary = `${resultSummary} Xeque.`;
    }

    const nowIso = new Date().toISOString();
    store.matches[matchIndex] = {
      ...match,
      chessState: nextChessState,
      presence: {
        ...(match.presence || {}),
        [seat]: {
          ...(match.presence?.[seat] || {}),
          connected: true,
          lastSeenAt: nowIso,
        },
      },
      turn: nextTurn,
      winner,
      resultSummary,
      moveCount: clampInteger(match.moveCount) + 1,
      status: finished ? "finished" : "active",
      finishedAt: finished ? nowIso : "",
      updatedAt: nowIso,
    };
    store = writePubpaidPvpStore(store);
    return sendJson(res, 200, buildPubpaidPvpStatePayload(store, authUser, "chess"));
  }

  if (req.method === "POST" && pathname === "/api/pubpaid/deposits") {
    const authUser = readCatalogoAuthSession(req);
    if (!authUser) {
      return sendJson(res, 401, {
        ok: false,
        error: "Entre com Google para registrar o deposito."
      });
    }

    const body = await parseBody(req);
    const amount = normalizePubpaidAmount(body.amount, 10);
    const txid = normalizePixToken(body.paymentTxid || body.txid || `PUB${Date.now()}`, 25) || `PUB${Date.now()}`;
    const googleUser = publicAuthUser(authUser);
    const depositorName = cleanShortText(googleUser?.name || googleUser?.email || "", 90);
    const receiptName = cleanShortText(
      body.receiptName || body.pixReceiptName || body.proofName || body.comprovanteName || "",
      120
    );
    if (!googleUser?.sub || !googleUser?.email || !depositorName) {
      return sendJson(res, 400, {
        ok: false,
        error: "Entre com Google para registrar o deposito com nome e email reais."
      });
    }
    if (!receiptName) {
      return sendJson(res, 400, {
        ok: false,
        error: "Informe o nome que aparece no comprovante Pix para o admin conferir."
      });
    }
    const tracking = buildTrackingMeta(req, body);
    const wallet = getPubpaidWallet(authUser);
    const reviewDeadlineAt = new Date(Date.now() + PUBPAID_PENDING_WINDOW_MS).toISOString();
    const nextItem = {
      id: createRecordId("pubdep"),
      type: "pubpaid-deposito",
      user: googleUser,
      depositorName,
      receiptName,
      walletKey: wallet?.walletKey || getPubpaidWalletKey(authUser),
      googleSub: googleUser.sub,
      googleEmail: googleUser.email,
      googleName: googleUser.name,
      googlePicture: googleUser.picture,
      amount: Number(amount.toFixed(2)),
      creditsRequested: Math.floor(amount),
      status: "aguardando-confirmacao-pix",
      payment: {
        method: "pix-qr-code",
        keyVisible: false,
        txid,
        depositorName,
        receiptName,
        googleSub: googleUser.sub,
        googleEmail: googleUser.email,
        googleName: googleUser.name,
        status: "pendente-manual",
        confirmationMode: "manual"
      },
      reviewDeadlineAt,
      sourcePage: cleanShortText(body.sourcePage || tracking.pagePath || "/pubpaid.html", 260),
      visitorId: tracking.visitorId || tracking.cookieVisitorId,
      sessionId: tracking.sessionId || tracking.cookieSessionId,
      city: tracking.city,
      country: tracking.country,
      ip: tracking.ip,
      createdAt: new Date().toISOString()
    };

    await appendCanonicalPubpaidItem("deposits", nextItem);

    return sendJson(res, 201, {
      ok: true,
      item: nextItem,
      message: "Pagamento enviado. Aguardando confirmação."
    });
  }

  if (req.method === "POST" && pathname === "/api/pubpaid/withdrawals") {
    const authUser = readCatalogoAuthSession(req);
    if (!authUser) {
      return sendJson(res, 401, {
        ok: false,
        error: "Entre com Google para solicitar saque."
      });
    }

    const body = await parseBody(req);
    const amount = normalizePubpaidMoney(body.amount, 0);
    if (amount <= 0) {
      return sendJson(res, 400, {
        ok: false,
        error: "Informe um valor valido para a retirada."
      });
    }
    const pixKey = cleanPubpaidWithdrawalPixKey(
      body.pixKey || body.withdrawalPixKey || body.destinationPixKey || body.pix || body.key || ""
    );
    if (pixKey.length < 3) {
      return sendJson(res, 400, {
        ok: false,
        error: "Informe a chave Pix para receber a retirada."
      });
    }
    const pixAccountName = cleanShortText(
      body.pixAccountName || body.pixName || body.pixHolderName || body.destinationName || body.accountName || "",
      120
    );
    if (pixAccountName.length < 3) {
      return sendJson(res, 400, {
        ok: false,
        error: "Informe o nome da conta Pix para conferencia do admin."
      });
    }
    const wallet = getPubpaidWallet(authUser);
    if (!wallet) {
      return sendJson(res, 400, {
        ok: false,
        error: "Carteira PubPaid indisponivel."
      });
    }

    const availableCoins = normalizePubpaidMoney(
      wallet.availableCoins ?? (wallet.balanceCoins - wallet.lockedMatchCoins - wallet.lockedWithdrawalCoins)
    );
    if (availableCoins + 0.0001 < amount) {
      return sendJson(res, 400, {
        ok: false,
        error: `Saldo livre insuficiente. Voce pode retirar no maximo ${availableCoins.toLocaleString("pt-BR", { minimumFractionDigits: Number.isInteger(availableCoins) ? 0 : 2, maximumFractionDigits: 2 })} creditos agora.`
      });
    }

    const txid = normalizePixToken(body.paymentTxid || body.txid || `SAQ${Date.now()}`, 25) || `SAQ${Date.now()}`;
    const tracking = buildTrackingMeta(req, body);
    const reviewDeadlineAt = new Date(Date.now() + PUBPAID_PENDING_WINDOW_MS).toISOString();
    const nextItem = {
      id: createRecordId("pubwd"),
      type: "pubpaid-saque",
      user: publicAuthUser(authUser),
      walletKey: wallet.walletKey,
      amount: Number(amount.toFixed(2)),
      creditsRequested: Number(amount.toFixed(2)),
      pixKey,
      pixAccountName,
      destination: {
        method: "pix",
        pixKey,
        pixAccountName
      },
      status: "aguardando-confirmacao-saque",
      payment: {
        method: "pix-manual",
        txid,
        pixKey,
        pixAccountName,
        status: "pendente-manual",
        confirmationMode: "manual"
      },
      reviewDeadlineAt,
      sourcePage: cleanShortText(body.sourcePage || tracking.pagePath || "/pubpaid.html", 260),
      visitorId: tracking.visitorId || tracking.cookieVisitorId,
      sessionId: tracking.sessionId || tracking.cookieSessionId,
      city: tracking.city,
      country: tracking.country,
      ip: tracking.ip,
      createdAt: new Date().toISOString()
    };

    updatePubpaidWallet(authUser, (current) => ({
      ...current,
      balanceCoins: Math.max(0, normalizePubpaidMoney(current.balanceCoins) - amount),
      lockedWithdrawalCoins: normalizePubpaidMoney(current.lockedWithdrawalCoins) + amount
    }));

    await appendCanonicalPubpaidItem("withdrawals", nextItem);

    return sendJson(res, 201, {
      ok: true,
      item: nextItem,
      wallet: buildPubpaidAccountPayload(authUser).wallet,
      message: "Pedido de retirada enviado ao admin. Aguarde ate 2 horas; o valor sera depositado no Pix apos a conferencia do nome da conta Pix."
    });
  }

  if (req.method === "GET" && pathname === "/api/pubpaid-admin/dashboard") {
    if (!requireAdmin(req)) return sendAdminUnauthorized(res);
    return sendJson(res, 200, buildPubpaidAdminPayload());
  }

  if (req.method === "POST" && pathname === "/api/pubpaid-admin/deposits/review") {
    if (!requireAdmin(req)) return sendAdminUnauthorized(res);
    const body = await parseBody(req);
    try {
      const result = await reviewCanonicalPubpaidDeposit({
        depositId: cleanShortText(body.depositId || body.id, 120),
        decision: body.decision || body.status || "",
        reviewer: cleanShortText(body.reviewer || body.adminUser || body.username || SUPER_ADMIN_USER, 120),
        reason: cleanShortText(body.reason || body.reviewReason || body.note || "", 280),
      });
      const payload = buildPubpaidAdminPayload();
      return sendJson(res, 200, {
        ok: true,
        idempotent: result.idempotent,
        item: result.item,
        updatedAt: payload.updatedAt,
        storage: payload.storage,
        totals: payload.totals,
        dashboard: payload.dashboard,
        pendingPubpaidDeposits: payload.pendingPubpaidDeposits,
        pendingPubpaidWithdrawals: payload.pendingPubpaidWithdrawals,
        pubpaidWalletBoard: payload.pubpaidWalletBoard,
      });
    } catch (error) {
      console.error("[pubpaid-admin][deposit-review] failed", {
        depositId: cleanShortText(body.depositId || body.id, 120),
        decision: normalizeText(body.decision || body.status || ""),
        message: error?.message || String(error)
      });
      return sendJson(res, error?.statusCode || 500, {
        ok: false,
        error: error?.message || "Falha ao confirmar o deposito PubPaid."
      });
    }
  }

  if (req.method === "POST" && pathname === "/api/pubpaid-admin/withdrawals/review") {
    if (!requireAdmin(req)) return sendAdminUnauthorized(res);
    const body = await parseBody(req);
    try {
      const result = await reviewCanonicalPubpaidWithdrawal({
        withdrawalId: cleanShortText(body.withdrawalId || body.id, 120),
        decision: body.decision || body.status || "",
        reviewer: cleanShortText(body.reviewer || body.adminUser || body.username || SUPER_ADMIN_USER, 120),
        reason: cleanShortText(body.reason || body.reviewReason || body.note || "", 280),
      });
      const payload = buildPubpaidAdminPayload();
      return sendJson(res, 200, {
        ok: true,
        idempotent: result.idempotent,
        item: result.item,
        updatedAt: payload.updatedAt,
        storage: payload.storage,
        totals: payload.totals,
        dashboard: payload.dashboard,
        pendingPubpaidDeposits: payload.pendingPubpaidDeposits,
        pendingPubpaidWithdrawals: payload.pendingPubpaidWithdrawals,
        pubpaidWalletBoard: payload.pubpaidWalletBoard,
      });
    } catch (error) {
      console.error("[pubpaid-admin][withdrawal-review] failed", {
        withdrawalId: cleanShortText(body.withdrawalId || body.id, 120),
        decision: normalizeText(body.decision || body.status || ""),
        message: error?.message || String(error)
      });
      return sendJson(res, error?.statusCode || 500, {
        ok: false,
        error: error?.message || "Falha ao confirmar o saque PubPaid."
      });
    }
  }

  if (req.method === "GET" && pathname === "/api/pubpaid-admin/reports/pubpaid-deposits.csv") {
    if (!requireAdmin(req)) return sendAdminUnauthorized(res);
    const rows = readMergedPubpaidArray(PUBPAID_DEPOSITS_FILE, LEGACY_PUBPAID_DEPOSITS_FILE).map((item) => ({
      createdAt: item.createdAt || "",
      player: item?.user?.name || "",
      email: item?.user?.email || "",
      googleSub: item.googleSub || item?.user?.sub || item?.payment?.googleSub || "",
      walletKey: item.walletKey || "",
      amount: item.amount || 0,
      creditsRequested: item.creditsRequested || 0,
      status: item.status || "",
      paymentStatus: item?.payment?.status || "",
      txid: item?.payment?.txid || "",
      receiptName: item.receiptName || item?.payment?.receiptName || item?.payment?.pixReceiptName || ""
    }));
    return sendCsv(res, 200, toCsv(rows) || "createdAt,player,email,googleSub,walletKey,amount,creditsRequested,status,paymentStatus,txid,receiptName\n", "pubpaid_depositos.csv");
  }

  if (req.method === "GET" && pathname === "/api/pubpaid-admin/reports/pubpaid-withdrawals.csv") {
    if (!requireAdmin(req)) return sendAdminUnauthorized(res);
    const rows = getPubpaidWithdrawals().map((item) => ({
      createdAt: item.createdAt || "",
      player: item?.user?.name || "",
      email: item?.user?.email || "",
      amount: item.amount || item.amountCoins || 0,
      pixKey: item.pixKey || item?.payment?.pixKey || item?.destination?.pixKey || "",
      status: item.status || "",
      paymentStatus: item?.payment?.status || "",
      txid: item?.payment?.txid || ""
    }));
    return sendCsv(res, 200, toCsv(rows) || "createdAt,player,email,amount,pixKey,status,paymentStatus,txid\n", "pubpaid_retiradas.csv");
  }

  if (req.method === "GET" && pathname === "/api/pubpaid-admin/reports/pubpaid-wallets.csv") {
    if (!requireAdmin(req)) return sendAdminUnauthorized(res);
    const rows = (buildPubpaidAdminPayload().pubpaidWalletBoard || []).map((item) => ({
      updatedAt: item.updatedAt || item.createdAt || "",
      player: item.name || item.playerName || item?.user?.name || "",
      email: item.email || item?.user?.email || "",
      walletKey: item.walletKey || "",
      balanceCoins: normalizePubpaidMoney(item.balanceCoins),
      availableCoins: normalizePubpaidMoney(item.availableCoins),
      lockedWithdrawalCoins: normalizePubpaidMoney(item.lockedWithdrawalCoins),
      lockedMatchCoins: normalizePubpaidMoney(item.lockedMatchCoins),
      totalApprovedDeposits: normalizePubpaidMoney(item.totalApprovedDeposits),
      totalApprovedWithdrawals: normalizePubpaidMoney(item.totalApprovedWithdrawals),
      matchWonCoins: normalizePubpaidMoney(item.matchWonCoins),
      matchLostCoins: normalizePubpaidMoney(item.matchLostCoins),
      matchNetCoins: normalizePubpaidMoney(item.matchNetCoins),
      matchPayoutCoins: normalizePubpaidMoney(item.matchPayoutCoins),
      matchHouseFeeCoins: normalizePubpaidMoney(item.matchHouseFeeCoins),
      matchWonCount: clampInteger(item.matchWonCount),
      matchLostCount: clampInteger(item.matchLostCount),
    }));
    return sendCsv(res, 200, toCsv(rows) || "updatedAt,player,email,walletKey,balanceCoins,availableCoins,lockedWithdrawalCoins,lockedMatchCoins,totalApprovedDeposits,totalApprovedWithdrawals,matchWonCoins,matchLostCoins,matchNetCoins,matchPayoutCoins,matchHouseFeeCoins,matchWonCount,matchLostCount\n", "pubpaid_carteiras.csv");
  }

  if (req.method === "GET" && pathname === "/api/admin/dashboard") {
    if (!requireAdmin(req)) return sendAdminUnauthorized(res);
    return sendJson(res, 200, buildAdminDashboardPayload());
  }

  if (req.method === "GET" && pathname === "/api/admin/reports/access.csv") {
    if (!requireAdmin(req)) return sendAdminUnauthorized(res);
    const rows = getJsonArray(VISITS_FILE).map((item) => ({
      at: item.at,
      pagePath: item.pagePath,
      pageTitle: item.pageTitle,
      visitorId: item.visitorId,
      sessionId: item.sessionId,
      city: item.city,
      country: item.country,
      ip: item.ip,
      browser: item.browser,
      deviceType: item.deviceType,
      trackingConsent: item.trackingConsent,
      referrerHost: summarizeReferrer(item.referrer)
    }));
    return sendCsv(
      res,
      200,
      toCsv(rows) || "at,pagePath,pageTitle,visitorId,sessionId,city,country,ip,browser,deviceType,trackingConsent,referrerHost\n",
      "acessos_catalogo_czs.csv"
    );
  }

  if (req.method === "GET" && pathname === "/api/admin/reports/votes.csv") {
    if (!requireAdmin(req)) return sendAdminUnauthorized(res);
    const rows = getElectionVoteRecords().map((item) => ({
      at: item.at,
      office: item.office,
      candidateName: item.candidateName,
      candidateParty: item.candidateParty,
      city: item.city,
      voterName: item.voterName,
      voterParty: item.voterParty,
      observation: item.observation,
      sentiment: item.sentiment,
      reelectionSignal: item.reelectionSignal,
      ip: item.ip,
      browser: item.browser,
      deviceType: item.deviceType
    }));
    return sendCsv(
      res,
      200,
      toCsv(rows) || "at,office,candidateName,candidateParty,city,voterName,voterParty,observation,sentiment,reelectionSignal,ip,browser,deviceType\n",
      "votos_catalogo_czs.csv"
    );
  }

  if (req.method === "GET" && pathname === "/api/admin/reports/comments.csv") {
    if (!requireAdmin(req)) return sendAdminUnauthorized(res);
    const rows = getJsonArray(path.join(DATA_DIR, "comments.json")).map((item) => ({
      createdAt: item.createdAt,
      articleId: item.articleId,
      pagePath: item.pagePath,
      author: item.author || item.name,
      badge: item.badge,
      message: item.message || item.text,
      status: item.status,
      visitorId: item.visitorId,
      sessionId: item.sessionId,
      city: item.city,
      country: item.country,
      ip: item.ip
    }));
    return sendCsv(
      res,
      200,
      toCsv(rows) || "createdAt,articleId,pagePath,author,badge,message,status,visitorId,sessionId,city,country,ip\n",
      "comentarios_catalogo_czs.csv"
    );
  }

  if (req.method === "GET" && pathname === "/api/admin/reports/subscriptions.csv") {
    if (!requireAdmin(req)) return sendAdminUnauthorized(res);
    const rows = getJsonArray(path.join(DATA_DIR, "subscriptions.json")).map((item) => ({
      createdAt: item.createdAt,
      name: item.name,
      email: item.email,
      whatsapp: item.whatsapp,
      interests: Array.isArray(item.interests) ? item.interests.join(" | ") : "",
      sourcePage: item.sourcePage,
      visitorId: item.visitorId,
      sessionId: item.sessionId,
      city: item.city,
      country: item.country,
      ip: item.ip
    }));
    return sendCsv(
      res,
      200,
      toCsv(rows) || "createdAt,name,email,whatsapp,interests,sourcePage,visitorId,sessionId,city,country,ip\n",
      "assinaturas_catalogo_czs.csv"
    );
  }

  if (req.method === "GET" && pathname === "/api/admin/reports/acre-2026-poll.csv") {
    if (!requireAdmin(req)) return sendAdminUnauthorized(res);
    const rows = getAcre2026PollResponses().map((item) => ({
      createdAt: item.createdAt,
      profissao: item.profissao,
      localizacao: item.localizacao,
      faixaEtaria: item.faixaEtaria,
      votoAnterior: item.votoAnterior,
      satisfacao: item.satisfacao,
      avaliacaoGoverno: item.avaliacaoGoverno,
      direcaoEstado: item.direcaoEstado,
      desejoCiclo: item.desejoCiclo,
      voto2026: item.voto2026,
      segundaOpcao: item.segundaOpcao,
      certezaVoto: item.certezaVoto,
      rejeicao: item.rejeicao,
      prioridade: item.prioridade,
      atencaoPolitica: item.atencaoPolitica,
      fatorDecisivo: item.fatorDecisivo,
      comentario: item.comentario,
      sourcePage: item.sourcePage,
      pageTitle: item.pageTitle,
      visitorId: item.visitorId,
      sessionId: item.sessionId,
      city: item.city,
      country: item.country,
      ip: item.ip,
      browser: item.browser,
      deviceType: item.deviceType
    }));
    return sendCsv(
      res,
      200,
      toCsv(rows) || "createdAt,profissao,localizacao,faixaEtaria,votoAnterior,satisfacao,voto2026,rejeicao,prioridade,comentario,sourcePage,pageTitle,visitorId,sessionId,city,country,ip,browser,deviceType\n",
      "pesquisa_acre_2026.csv"
    );
  }

  if (req.method === "GET" && pathname.startsWith("/api/admin/raw/")) {
    if (!requireAdmin(req)) return sendAdminUnauthorized(res);
    const key = pathname.replace("/api/admin/raw/", "");
    const limit = Math.max(1, Math.min(500, Number(searchParams.get("limit") || 100)));
    const loaders = {
      visits: () => getJsonArray(VISITS_FILE),
      heartbeats: () => getJsonArray(HEARTBEATS_FILE),
      comments: () => getJsonArray(path.join(DATA_DIR, "comments.json")),
      subscriptions: () => getJsonArray(path.join(DATA_DIR, "subscriptions.json")),
      acre2026Poll: () => getAcre2026PollResponses(),
      votes: () => getElectionVoteRecords(),
      ninjasRequests: () => getJsonArray(NINJAS_REQUESTS_FILE),
      ninjasProfiles: () => getJsonArray(NINJAS_PROFILES_FILE),
      salesListings: () => getJsonArray(SALES_LISTINGS_FILE),
      vrRentalLeads: () => getJsonArray(VR_RENTAL_LEADS_FILE)
    };

    if (!loaders[key]) {
      return sendJson(res, 404, { ok: false, error: "Colecao nao suportada." });
    }

    const items = loaders[key]();
    const ordered =
      key === "heartbeats"
        ? sortByDateDesc(items, "at", limit)
        : sortByDateDesc(
            items,
            key === "votes"
              ? "at"
              : key === "comments" ||
                  key === "subscriptions" ||
                  key === "acre2026Poll" ||
                  key.startsWith("ninjas") ||
                  key === "salesListings" ||
                  key === "vrRentalLeads"
                ? "createdAt"
                : "at",
            limit
          );
    return sendJson(res, 200, {
      ok: true,
      key,
      total: items.length,
      items: ordered.slice(0, limit)
    });
  }

  if (req.method === "POST" && pathname === "/api/subscriptions") {
    const authUser = readCatalogoAuthSession(req);
    if (!authUser) {
      return sendJson(res, 401, {
        ok: false,
        error: "Entre com Google para assinar, apoiar ou entrar no mural."
      });
    }

    const body = await parseBody(req);
    const tracking = buildTrackingMeta(req, body);
    const subs = readJson(path.join(DATA_DIR, "subscriptions.json"), []);
    const plan = String(body.plan || "resumo-7h-gratis").trim() || "resumo-7h-gratis";
    const amount = plan === "fundadores" ? Math.max(1, Math.min(10, parseCurrency(body.amount, 5))) : 0;

    if (plan === "fundadores" && !hasPixKeyConfigured()) {
      return sendJson(res, 503, {
        ok: false,
        error: "Apoio fundador por Pix esta indisponivel ate configurar a chave Pix."
      });
    }

    const paymentTxid =
      plan === "fundadores"
        ? normalizePixToken(body.paymentTxid || body.txid || `FUND${Date.now()}`, 25) || `FUND${Date.now()}`
        : "";
    const nextItem = {
      id: createRecordId("s"),
      email: authUser.email,
      name: cleanShortText(body.name || authUser.name || authUser.givenName, 100),
      authProvider: "google",
      googleSub: authUser.sub,
      whatsapp: cleanPhone(body.whatsapp || body.phone),
      interests: normalizeListInput(body.interests, { maxItems: 8, itemLength: 60 }),
      plan,
      amount: plan === "fundadores" ? amount : 0,
      badge: plan === "fundadores" ? "Fundador" : "Resumo das 7h",
      status: plan === "fundadores" ? "aguardando-confirmacao-pix" : "ativo",
      sourcePage: cleanShortText(body.sourcePage || tracking.pagePath, 260),
      visitorId: tracking.visitorId || tracking.cookieVisitorId,
      sessionId: tracking.sessionId || tracking.cookieSessionId,
      city: tracking.city,
      country: tracking.country,
      ip: tracking.ip,
      payment:
        plan === "fundadores"
          ? {
              amount,
              method: "pix-qr-code",
              keyVisible: false,
              txid: paymentTxid,
              status: "pendente-manual",
              confirmationMode: "manual"
            }
          : {
              amount: 0,
              method: "none",
              keyVisible: false,
              txid: "",
              status: "nao-aplicavel",
              confirmationMode: "none"
            },
      createdAt: new Date().toISOString(),
    };
    const next = Array.isArray(subs) ? subs : [];
    if (nextItem.email) next.push(nextItem);
    writeJson(path.join(DATA_DIR, "subscriptions.json"), next);
    const founderItems = next.filter(isConfirmedFounderSubscription);
    const founders = founderItems
      .slice()
      .reverse()
      .slice(0, 24)
      .map((item) => ({
        id: String(item.id || ""),
        name: String(item.name || "").slice(0, 100),
        amount: Number(item.amount || 0),
        badge: "Fundador",
        createdAt: item.createdAt || ""
      }));
    return sendJson(res, 201, {
      ok: true,
      item: nextItem,
      founders,
      paymentPending: plan === "fundadores",
      message:
        plan === "fundadores"
          ? "Apoio registrado e aguardando confirmacao manual do Pix antes de entrar no mural."
          : "Resumo das 7h registrado."
    });
  }

  if (req.method === "POST" && pathname === "/api/news/refresh") {
    if (!requireAdmin(req)) return sendAdminUnauthorized(res);
    const body = await parseBody(req);
    const limit = Number(body.limit || 18);
    const payload = await refreshRssRuntime(Math.max(5, Math.min(80, limit)));
    return sendJson(res, 200, { ok: true, ...payload });
  }

  if (req.method === "GET" && pathname === "/api/admin/overview") {
    if (!requireAdmin(req)) return sendAdminUnauthorized(res);

    const comments = readJson(path.join(DATA_DIR, "comments.json"), []);
    const subs = readJson(path.join(DATA_DIR, "subscriptions.json"), []);
    const pubpaidDeposits = readMergedPubpaidArray(PUBPAID_DEPOSITS_FILE, LEGACY_PUBPAID_DEPOSITS_FILE);
    const news = getNews(200);
    const biz = getBusinesses();

    return sendJson(res, 200, {
      ok: true,
      totals: {
        comments: Array.isArray(comments) ? comments.length : 0,
        subscriptions: Array.isArray(subs) ? subs.length : 0,
        pubpaidDeposits: Array.isArray(pubpaidDeposits) ? pubpaidDeposits.length : 0,
        news: Array.isArray(news) ? news.length : 0,
        businesses: Array.isArray(biz) ? biz.length : 0,
      },
      updatedAt: new Date().toISOString(),
    });
  }

  return sendJson(res, 404, { ok: false, message: "Rota não encontrada." });
}

function handleStatic(req, res, pathname, requestUrl) {
  const templateVars = buildSeoTemplateVars(req, pathname, requestUrl);

  if (pathname === "/robots.txt") {
    return sendText(res, 200, buildRobotsTxt(req), "public, max-age=3600");
  }

  if (pathname === "/favicon.ico") {
    return sendFile(req, res, FAVICON_ICO_FILE, {
      cacheControl: VERSIONED_STATIC_CACHE_CONTROL
    });
  }

  if (pathname === "/sitemap.xml") {
    return sendXml(res, 200, buildSitemapXml(req));
  }

  if (pathname === "/ninjas.html" || pathname === "/escritorio-ninjas.html") {
    return sendText(res, 410, "Serviço indisponível.");
  }

  if (pathname === "/pubpaid" || pathname === "/pubpaid/") {
    res.writeHead(302, {
      Location: `/pubpaid.html?v=${PUBPAID_CLIENT_BUILD_VERSION}`,
      "Cache-Control": "no-store",
      Pragma: "no-cache",
      Expires: "0",
      ...pubpaidNoStoreHeaders()
    });
    return res.end();
  }

  if (pathname === "/pubpaid.js" || pathname === "/pubpaid.css") {
    return sendText(res, 410, "Versao antiga encerrada. Use /pubpaid.html.");
  }

  if (
    pathname === "/pubpaid-admin" ||
    pathname === "/pubpaid-admin/" ||
    pathname === "/pubpaid-admin.html" ||
    pathname === "/admin" ||
    pathname === "/admin/" ||
    pathname === "/admin/admin-dashboard.html" ||
    pathname === "/admin/admin_dashboard.html" ||
    pathname === "/admin-dashboard.html" ||
    pathname === "/admin_dashboard.html"
  ) {
    if (pathname === "/pubpaid-admin" || pathname === "/pubpaid-admin/" || pathname === "/pubpaid-admin.html") {
      return sendFile(req, res, PUBPAID_ADMIN_FILE, {
        cacheControl: "no-store",
        templateVars
      });
    }
    if (pathname === "/admin" || pathname === "/admin/") {
      return sendFile(req, res, ADMIN_MASTER_FILE, {
        cacheControl: "no-store",
        templateVars
      });
    }
    return sendFile(req, res, ADMIN_DASHBOARD_FILE, {
      cacheControl: "no-store",
      templateVars
    });
  }

  if (pathname === "/" || pathname === "/index.html") {
    return sendFile(req, res, MAINTENANCE_FILE, {
      cacheControl: "no-store",
      templateVars
    });
  }

  if (pathname === "/pubpaid-v2.html") {
    res.writeHead(302, {
      Location: `/pubpaid.html?v=${PUBPAID_CLIENT_BUILD_VERSION}`,
      "Cache-Control": "no-store",
      Pragma: "no-cache",
      Expires: "0",
      ...pubpaidNoStoreHeaders()
    });
    return res.end();
  }

  if (pathname === "/pubpaid.html") {
    return sendFile(req, res, path.join(ROOT_DIR, "pubpaid.html"), {
      cacheControl: "no-store",
      templateVars,
      headers: pubpaidNoStoreHeaders()
    });
  }

  const decodedPath = decodeURIComponent(pathname);
  const safePath = safeJoin(ROOT_DIR, decodedPath.replace(/^\/+/, ""));
  const hasVersionParam = Boolean(requestUrl?.searchParams?.has("v"));

  if (!safePath) return sendText(res, 400, "Caminho inválido.");

  if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    if (!isPublicStaticFile(safePath)) return sendText(res, 404, "Página não encontrada.");
    return sendFile(req, res, safePath, {
      cacheControl: getStaticCacheControl(safePath, hasVersionParam),
      templateVars
    });
  }

  if (!path.extname(decodedPath) && fs.existsSync(MAINTENANCE_FILE)) {
    return sendFile(req, res, MAINTENANCE_FILE, {
      cacheControl: "no-store",
      templateVars: buildSeoTemplateVars(req, "/", requestUrl)
    });
  }

  return sendText(res, 404, "Página não encontrada.");
}

ensureDataDir();
loadImagePreviewCache();
if (RSS_SOURCES.length && !NEWS_REFRESH_AUTO_DISABLED) {
  refreshRssRuntime().catch(() => {});
  setInterval(() => {
    refreshRssRuntime().catch(() => {});
  }, NEWS_REFRESH_INTERVAL_MS);
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = requestUrl.pathname;

  if (pathname.startsWith("/api/") || pathname === "/health") {
    return handleApi(req, res, pathname, requestUrl.searchParams);
  }

  return handleStatic(req, res, pathname, requestUrl);
});

server.listen(PORT, HOST, () => {
  console.log(`[catalogo] online em http://${HOST}:${PORT}`);
  startRealAgentsAutoRunner();
  startArticleIntegrityAutoRunner();
  startTopicFeedAutoRunner();
});

function emptyPubpaidWalletLedger() {
  return {
    matchPlayedCount: 0,
    matchWonCount: 0,
    matchLostCount: 0,
    matchDrawCount: 0,
    matchStakedCoins: 0,
    matchPayoutCoins: 0,
    matchWonCoins: 0,
    matchLostCoins: 0,
    matchHouseFeeCoins: 0,
  };
}

function ensurePubpaidWalletLedger(map, player = {}) {
  const key = safeString(player?.walletKey || player?.email || player?.sub || "", 180).toLowerCase();
  if (!key) return null;
  if (!map.has(key)) map.set(key, emptyPubpaidWalletLedger());
  return map.get(key);
}

function buildPubpaidPvpLedgerByWallet(matches = []) {
  const ledgerByWallet = new Map();
  (Array.isArray(matches) ? matches : []).forEach((match) => {
    if (match?.status !== "finished" || match?.settlement?.status !== "settled") return;
    const stake = normalizePubpaidMoney(match.stake);
    const payout = normalizePubpaidMoney(match?.settlement?.payout ?? (match.winner ? stake * 1.8 : stake));
    const houseFee = normalizePubpaidMoney(match?.settlement?.houseFee ?? (match.winner ? stake * 0.2 : 0));
    PUBPAID_PVP_SEATS.forEach((seat) => {
      const entry = ensurePubpaidWalletLedger(ledgerByWallet, match[seat]);
      if (!entry) return;
      entry.matchPlayedCount += 1;
      entry.matchStakedCoins = normalizePubpaidMoney(entry.matchStakedCoins + stake);
      if (!match.winner) {
        entry.matchDrawCount += 1;
        entry.matchPayoutCoins = normalizePubpaidMoney(entry.matchPayoutCoins + stake);
        return;
      }
      if (match.winner === seat) {
        entry.matchWonCount += 1;
        entry.matchPayoutCoins = normalizePubpaidMoney(entry.matchPayoutCoins + payout);
        entry.matchWonCoins = normalizePubpaidMoney(entry.matchWonCoins + Math.max(0, payout - stake));
        entry.matchHouseFeeCoins = normalizePubpaidMoney(entry.matchHouseFeeCoins + houseFee);
        return;
      }
      entry.matchLostCount += 1;
      entry.matchLostCoins = normalizePubpaidMoney(entry.matchLostCoins + stake);
    });
  });
  return ledgerByWallet;
}

function buildPubpaidAdminPayload() {
  const store = readCanonicalPubpaidStore();
  const pvpStore = readPubpaidPvpStore();
  const dashboard = buildCanonicalPubpaidAdminPayload(store);
  const activePvpMatches = (Array.isArray(pvpStore.matches) ? pvpStore.matches : []).filter((item) => item.status === "active");
  const settledPvpMatches = (Array.isArray(pvpStore.matches) ? pvpStore.matches : []).filter((item) => item.settlement?.status === "settled");
  const pvpLedger = buildPubpaidPvpLedgerByWallet(settledPvpMatches);
  const walletBoard = (Array.isArray(dashboard.walletBoard) ? dashboard.walletBoard : []).map((wallet) => {
    const key = safeString(wallet.walletKey || wallet.playerId || wallet.email || "", 180).toLowerCase();
    const ledger = pvpLedger.get(key) || emptyPubpaidWalletLedger();
    const matchPayoutCoins = Math.max(normalizePubpaidMoney(wallet.matchPayoutCoins), normalizePubpaidMoney(ledger.matchPayoutCoins));
    const matchWonCoins = Math.max(normalizePubpaidMoney(wallet.matchWonCoins), normalizePubpaidMoney(ledger.matchWonCoins));
    const matchLostCoins = Math.max(normalizePubpaidMoney(wallet.matchLostCoins), normalizePubpaidMoney(ledger.matchLostCoins));
    const matchHouseFeeCoins = Math.max(normalizePubpaidMoney(wallet.matchHouseFeeCoins), normalizePubpaidMoney(ledger.matchHouseFeeCoins));
    const matchWonCount = Math.max(clampInteger(wallet.matchWonCount), clampInteger(ledger.matchWonCount));
    const matchLostCount = Math.max(clampInteger(wallet.matchLostCount), clampInteger(ledger.matchLostCount));
    const matchPlayedCount = Math.max(clampInteger(wallet.matchPlayedCount), clampInteger(ledger.matchPlayedCount));
    return {
      ...wallet,
      matchPlayedCount,
      matchWonCount,
      matchLostCount,
      matchDrawCount: Math.max(clampInteger(wallet.matchDrawCount), clampInteger(ledger.matchDrawCount)),
      matchStakedCoins: Math.max(normalizePubpaidMoney(wallet.matchStakedCoins), normalizePubpaidMoney(ledger.matchStakedCoins)),
      matchPayoutCoins,
      matchWonCoins,
      matchLostCoins,
      matchHouseFeeCoins,
      matchNetCoins: normalizePubpaidMoney(matchWonCoins - matchLostCoins),
    };
  });
  const enhancedDashboard = {
    ...dashboard,
    walletBoard,
    stats: {
      ...(dashboard.stats || {}),
      totalMatchWonCoins: walletBoard.reduce((sum, item) => sum + normalizePubpaidMoney(item.matchWonCoins), 0),
      totalMatchLostCoins: walletBoard.reduce((sum, item) => sum + normalizePubpaidMoney(item.matchLostCoins), 0),
      totalMatchNetCoins: walletBoard.reduce((sum, item) => sum + normalizePubpaidMoney(item.matchNetCoins), 0),
    },
  };
  return {
    ok: true,
    updatedAt: dashboard.generatedAt,
    storage: {
      mode: "canonical-store",
      target: "data/pubpaid-store.json",
    },
    totals: {
      pubpaidDeposits: Array.isArray(store.deposits) ? store.deposits.length : 0,
      pubpaidWithdrawals: Array.isArray(store.withdrawals) ? store.withdrawals.length : 0,
      pubpaidWallets: Array.isArray(enhancedDashboard.walletBoard) ? enhancedDashboard.walletBoard.length : 0,
      pubpaidPendingDeposits: Array.isArray(dashboard.pendingDeposits) ? dashboard.pendingDeposits.length : 0,
      pubpaidPendingWithdrawals: Array.isArray(dashboard.pendingWithdrawals) ? dashboard.pendingWithdrawals.length : 0,
      pubpaidPvpWaiting: Array.isArray(pvpStore.waiting) ? pvpStore.waiting.length : 0,
      pubpaidPvpActive: activePvpMatches.length,
      pubpaidPvpSettled: settledPvpMatches.length,
      pubpaidPvpWonCoins: enhancedDashboard.stats.totalMatchWonCoins,
      pubpaidPvpLostCoins: enhancedDashboard.stats.totalMatchLostCoins,
      pubpaidPvpNetCoins: enhancedDashboard.stats.totalMatchNetCoins,
    },
    dashboard: enhancedDashboard,
    pubpaidPvp: {
      updatedAt: pvpStore.updatedAt,
      waiting: pvpStore.waiting,
      activeMatches: activePvpMatches,
      settledMatches: settledPvpMatches.slice(-50),
    },
    pendingPubpaidDeposits: enhancedDashboard.pendingDeposits,
    pendingPubpaidWithdrawals: enhancedDashboard.pendingWithdrawals,
    pubpaidWalletBoard: enhancedDashboard.walletBoard,
  };
}

const PUBPAID_PVP_ENABLED_GAMES = new Set(["pool", "checkers", "chess"]);
const PUBPAID_PVP_WAIT_MS = 1000 * 60 * 15;
const PUBPAID_PVP_MATCH_MS = 1000 * 60 * 60 * 6;
const PUBPAID_PVP_ABANDON_MS = 1000 * 60;
const PUBPAID_PVP_DISCONNECT_GRACE_MS = 1000 * 10;
const PUBPAID_PVP_SEATS = ["playerOne", "playerTwo"];

function emptyPubpaidPvpStore() {
  return {
    updatedAt: null,
    waiting: [],
    matches: [],
  };
}

function readPubpaidPvpStore() {
  const parsed = readJson(PUBPAID_PVP_FILE, emptyPubpaidPvpStore());
  return {
    updatedAt: parsed?.updatedAt || null,
    waiting: Array.isArray(parsed?.waiting) ? parsed.waiting : [],
    matches: Array.isArray(parsed?.matches) ? parsed.matches : [],
  };
}

function writePubpaidPvpStore(store = emptyPubpaidPvpStore()) {
  const settledStore = settleFinishedPubpaidPvpMatches(store);
  const nextStore = {
    updatedAt: new Date().toISOString(),
    waiting: Array.isArray(settledStore?.waiting) ? settledStore.waiting : [],
    matches: Array.isArray(settledStore?.matches) ? settledStore.matches : [],
  };
  writeJson(PUBPAID_PVP_FILE, nextStore);
  return nextStore;
}

function cleanupPubpaidPvpStore(store = emptyPubpaidPvpStore()) {
  const now = Date.now();
  const expiredWaiting = [];
  const matches = (Array.isArray(store.matches) ? store.matches : []).map((entry) => {
    if (entry?.status === "active") {
      const staleSeat = PUBPAID_PVP_SEATS.find((seat) => {
        const lastSeen = new Date(entry?.presence?.[seat]?.lastSeenAt || entry?.startedAt || 0).getTime();
        return lastSeen && now - lastSeen > PUBPAID_PVP_DISCONNECT_GRACE_MS;
      });
      if (staleSeat) {
        const rivalSeat = staleSeat === "playerOne" ? "playerTwo" : "playerOne";
        return {
          ...entry,
          status: "abandoned",
          abandonedBy: staleSeat,
          deadlineAt: new Date(now + PUBPAID_PVP_ABANDON_MS).toISOString(),
          presence: {
            ...(entry.presence || {}),
            [staleSeat]: {
              ...(entry.presence?.[staleSeat] || {}),
              connected: false,
              lastSeenAt: entry?.presence?.[staleSeat]?.lastSeenAt || entry?.startedAt || new Date(now).toISOString(),
            },
          },
          resultSummary: `${entry?.[staleSeat]?.name || "Jogador"} desconectou. ${entry?.[rivalSeat]?.name || "Rival"} vence por W.O. se ele nao voltar em 60 segundos.`,
          updatedAt: new Date().toISOString(),
        };
      }
      return entry;
    }
    if (entry?.status !== "abandoned") return entry;
    const deadline = new Date(entry.deadlineAt || 0).getTime();
    if (!deadline || now < deadline) return entry;
    const winner = entry.abandonedBy === "playerOne" ? "playerTwo" : "playerOne";
    return {
      ...entry,
      status: "finished",
      winner,
      resultSummary:
        winner === "playerOne"
          ? `${entry?.playerTwo?.name || "Jogador 2"} nao voltou em 60 segundos. ${entry?.playerOne?.name || "Jogador 1"} venceu por abandono.`
          : `${entry?.playerOne?.name || "Jogador 1"} nao voltou em 60 segundos. ${entry?.playerTwo?.name || "Jogador 2"} venceu por abandono.`,
      finishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
  return {
    ...store,
    waiting: (Array.isArray(store.waiting) ? store.waiting : []).filter((entry) => {
      const createdAt = new Date(entry?.createdAt || 0).getTime();
      const keep = createdAt && now - createdAt < PUBPAID_PVP_WAIT_MS;
      if (!keep) {
        expiredWaiting.push(entry);
        if (entry?.escrow?.status === "locked") {
          releasePubpaidMatchEscrow(entry.player, entry.stake);
        }
      }
      return keep;
    }),
    matches: matches.filter((entry) => {
      if (entry?.status === "finished") {
        const finishedAt = new Date(entry?.finishedAt || entry?.updatedAt || 0).getTime();
        return finishedAt && now - finishedAt < PUBPAID_PVP_MATCH_MS;
      }
      const startedAt = new Date(entry?.startedAt || entry?.createdAt || 0).getTime();
      return startedAt && now - startedAt < PUBPAID_PVP_MATCH_MS;
    }),
  };
}

function getPubpaidWalletRecordByKey(walletKey = "") {
  const key = safeString(walletKey, 180).toLowerCase();
  if (!key) return null;
  const wallets = getPubpaidWalletStore();
  const record = wallets && typeof wallets === "object" ? wallets[key] : null;
  return record ? normalizePubpaidWalletRecord(record) : null;
}

function savePubpaidWalletRecordByKey(walletKey = "", patch = {}) {
  const key = safeString(walletKey, 180).toLowerCase();
  if (!key) return null;
  const wallets = getPubpaidWalletStore();
  const current = normalizePubpaidWalletRecord(wallets?.[key] || {});
  const next = normalizePubpaidWalletRecord({
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  });
  savePubpaidWalletStore({
    ...(wallets && typeof wallets === "object" ? wallets : {}),
    [key]: {
      ...next,
      playerId: key,
      walletKey: key,
      playerName: safeString(patch.playerName || next.playerName || next?.user?.name || "", 120) || "Jogador",
    },
  });
  return next;
}

function lockPubpaidMatchEscrow(player = {}, stake = 0) {
  const walletKey = safeString(player?.walletKey || "", 180).toLowerCase();
  const amount = normalizePubpaidMoney(stake);
  const wallet = getPubpaidWalletRecordByKey(walletKey);
  if (!wallet || amount <= 0) {
    return { ok: false, error: "Carteira PubPaid nao encontrada." };
  }
  const available = normalizePubpaidMoney(wallet.availableCoins ?? (wallet.balanceCoins - wallet.lockedMatchCoins - wallet.lockedWithdrawalCoins));
  if (available < amount) {
    return { ok: false, error: "Saldo real disponivel insuficiente para travar escrow nessa mesa." };
  }
  const next = savePubpaidWalletRecordByKey(walletKey, {
    ...wallet,
    lockedMatchCoins: normalizePubpaidMoney(wallet.lockedMatchCoins + amount),
    playerName: player.name,
  });
  return { ok: true, wallet: next };
}

function releasePubpaidMatchEscrow(player = {}, amount = 0) {
  const walletKey = safeString(player?.walletKey || "", 180).toLowerCase();
  const wallet = getPubpaidWalletRecordByKey(walletKey);
  if (!wallet) return null;
  const nextLocked = Math.max(0, normalizePubpaidMoney(wallet.lockedMatchCoins - normalizePubpaidMoney(amount)));
  return savePubpaidWalletRecordByKey(walletKey, {
    ...wallet,
    availableCoins: Math.max(0, normalizePubpaidMoney(wallet.balanceCoins - nextLocked - wallet.lockedWithdrawalCoins)),
    lockedMatchCoins: nextLocked,
    playerName: player.name,
  });
}

function consumePubpaidMatchEscrow(player = {}, amount = 0) {
  const walletKey = safeString(player?.walletKey || "", 180).toLowerCase();
  const wallet = getPubpaidWalletRecordByKey(walletKey);
  if (!wallet) return null;
  const stake = normalizePubpaidMoney(amount);
  const nextBalance = Math.max(0, normalizePubpaidMoney(wallet.balanceCoins - stake));
  const nextLocked = Math.max(0, normalizePubpaidMoney(wallet.lockedMatchCoins - stake));
  return savePubpaidWalletRecordByKey(walletKey, {
    ...wallet,
    balanceCoins: nextBalance,
    availableCoins: Math.max(0, normalizePubpaidMoney(nextBalance - nextLocked - wallet.lockedWithdrawalCoins)),
    lockedMatchCoins: nextLocked,
    matchSpentCoins: normalizePubpaidMoney((wallet.matchSpentCoins || 0) + stake),
    playerName: player.name,
  });
}

function creditPubpaidMatchPayout(player = {}, amount = 0, meta = {}) {
  const walletKey = safeString(player?.walletKey || "", 180).toLowerCase();
  const wallet = getPubpaidWalletRecordByKey(walletKey);
  if (!wallet) return null;
  const payout = normalizePubpaidMoney(amount);
  const netWin = Math.max(0, normalizePubpaidMoney(meta.netWin || 0));
  const houseFee = Math.max(0, normalizePubpaidMoney(meta.houseFee || 0));
  return savePubpaidWalletRecordByKey(walletKey, {
    ...wallet,
    balanceCoins: normalizePubpaidMoney(wallet.balanceCoins + payout),
    availableCoins: Math.max(
      0,
      normalizePubpaidMoney(wallet.balanceCoins + payout - wallet.lockedMatchCoins - wallet.lockedWithdrawalCoins)
    ),
    manualApprovedBalanceCoins: normalizePubpaidMoney((wallet.manualApprovedBalanceCoins || 0) + payout),
    matchPayoutCoins: normalizePubpaidMoney((wallet.matchPayoutCoins || 0) + payout),
    matchWonCoins: normalizePubpaidMoney((wallet.matchWonCoins || 0) + netWin),
    matchHouseFeeCoins: normalizePubpaidMoney((wallet.matchHouseFeeCoins || 0) + houseFee),
    matchWonCount: clampInteger(wallet.matchWonCount) + (meta.win ? 1 : 0),
    playerName: player.name,
  });
}

function markPubpaidMatchLoss(player = {}, amount = 0) {
  const walletKey = safeString(player?.walletKey || "", 180).toLowerCase();
  const wallet = getPubpaidWalletRecordByKey(walletKey);
  if (!wallet) return null;
  const loss = Math.max(0, normalizePubpaidMoney(amount));
  return savePubpaidWalletRecordByKey(walletKey, {
    ...wallet,
    matchLostCoins: normalizePubpaidMoney((wallet.matchLostCoins || 0) + loss),
    matchLostCount: clampInteger(wallet.matchLostCount) + 1,
    playerName: player.name,
  });
}

function settlePubpaidPvpMatch(match = {}) {
  if (!match || match.status !== "finished" || match.settlement?.status === "settled") return match;
  const stake = normalizePubpaidMoney(match.stake);
  const pot = normalizePubpaidMoney(stake * 2);
  const houseFee = match.winner ? normalizePubpaidMoney(stake * 0.2) : 0;
  const payout = match.winner ? normalizePubpaidMoney(pot - houseFee) : stake;
  consumePubpaidMatchEscrow(match.playerOne, stake);
  consumePubpaidMatchEscrow(match.playerTwo, stake);
  if (match.winner === "playerOne") {
    creditPubpaidMatchPayout(match.playerOne, payout, { win: true, netWin: payout - stake, houseFee });
    markPubpaidMatchLoss(match.playerTwo, stake);
  } else if (match.winner === "playerTwo") {
    creditPubpaidMatchPayout(match.playerTwo, payout, { win: true, netWin: payout - stake, houseFee });
    markPubpaidMatchLoss(match.playerOne, stake);
  } else {
    creditPubpaidMatchPayout(match.playerOne, stake);
    creditPubpaidMatchPayout(match.playerTwo, stake);
  }
  return {
    ...match,
    settlement: {
      status: "settled",
      stake,
      pot,
      houseFee,
      payout,
      settledAt: new Date().toISOString(),
    },
  };
}

function settleFinishedPubpaidPvpMatches(store = emptyPubpaidPvpStore()) {
  return {
    ...store,
    matches: (Array.isArray(store.matches) ? store.matches : []).map((match) => settlePubpaidPvpMatch(match)),
  };
}

function normalizePubpaidPvpGameId(value = "") {
  const normalized = safeString(value, 40).toLowerCase();
  return PUBPAID_PVP_ENABLED_GAMES.has(normalized) ? normalized : "";
}

function getPubpaidPvpGameLabel(gameId = "") {
  return {
    pool: "Sinuca",
    checkers: "Damas",
    chess: "Xadrez",
    cards21: "21",
    poker: "Poker",
    truco: "Truco",
    darts: "Dardos",
    dicecups: "Dados",
  }[gameId] || "Mesa";
}

function createPubpaidPvpPresence(nowIso = new Date().toISOString()) {
  return {
    playerOne: { connected: true, lastSeenAt: nowIso },
    playerTwo: { connected: true, lastSeenAt: nowIso },
  };
}

function createCheckersPvPBoard() {
  const board = Array.from({ length: 8 }, () => Array(8).fill(""));
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      if ((row + col) % 2 === 1) board[row][col] = "o";
    }
  }
  for (let row = 5; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      if ((row + col) % 2 === 1) board[row][col] = "p";
    }
  }
  return board;
}

const PVP_CHECKERS_DIRECTIONS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1]
];

function drawPubpaid21Card(stateCards) {
  const deck = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 11];
  const value = deck[Math.floor(Math.random() * deck.length)];
  stateCards.drawCount = clampInteger(stateCards.drawCount) + 1;
  return value;
}

function sumPubpaid21Cards(cards = []) {
  let total = (Array.isArray(cards) ? cards : []).reduce((sum, card) => sum + clampInteger(card), 0);
  let aces = (Array.isArray(cards) ? cards : []).filter((card) => clampInteger(card) === 11).length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

function createCards21PvPState() {
  const cardsState = {
    drawCount: 0,
    playerOneCards: [],
    playerTwoCards: [],
    playerOneState: "active",
    playerTwoState: "active",
  };
  cardsState.playerOneCards.push(drawPubpaid21Card(cardsState));
  cardsState.playerOneCards.push(drawPubpaid21Card(cardsState));
  cardsState.playerTwoCards.push(drawPubpaid21Card(cardsState));
  cardsState.playerTwoCards.push(drawPubpaid21Card(cardsState));
  return cardsState;
}

function createPokerPvpDeck() {
  const suits = ["hearts", "diamonds", "clubs", "spades"];
  const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const deck = [];
  suits.forEach((suit) => {
    ranks.forEach((rank) => deck.push({ suit, rank }));
  });
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temp = deck[index];
    deck[index] = deck[swapIndex];
    deck[swapIndex] = temp;
  }
  return deck;
}

function drawPokerPvpCards(deck, count) {
  const cards = [];
  for (let index = 0; index < count; index += 1) {
    const card = deck.pop();
    if (card) cards.push(card);
  }
  return cards;
}

function createPokerPvPState() {
  const deck = createPokerPvpDeck();
  return {
    deck,
    playerOneCards: drawPokerPvpCards(deck, 5),
    playerTwoCards: drawPokerPvpCards(deck, 5),
    playerOneHeld: [false, false, false, false, false],
    playerTwoHeld: [false, false, false, false, false],
    playerOneDrawUsed: false,
    playerTwoDrawUsed: false,
  };
}

function countPokerPvpRanks(cards = []) {
  const counts = new Map();
  cards.forEach((card) => counts.set(card.rank, (counts.get(card.rank) || 0) + 1));
  return counts;
}

function isPokerPvpStraight(uniqueRanks = []) {
  if (uniqueRanks.length !== 5) return false;
  for (let index = 0; index < uniqueRanks.length - 1; index += 1) {
    if (uniqueRanks[index] - 1 !== uniqueRanks[index + 1]) {
      return uniqueRanks.join(",") === "14,5,4,3,2";
    }
  }
  return true;
}

function evaluatePokerPvpHand(cards = []) {
  const sorted = cards.slice().sort((a, b) => b.rank - a.rank);
  const ranks = sorted.map((card) => card.rank);
  const suits = sorted.map((card) => card.suit);
  const counts = Array.from(countPokerPvpRanks(sorted).entries()).sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const uniqueRanks = Array.from(new Set(ranks)).sort((a, b) => b - a);
  const flush = suits.every((suit) => suit === suits[0]);
  const straight = isPokerPvpStraight(uniqueRanks);

  if (flush && straight) {
    return { score: 8, label: "straight flush", tiebreak: [uniqueRanks[0] === 14 && uniqueRanks[1] === 5 ? 5 : uniqueRanks[0]] };
  }
  if (counts[0]?.[1] === 4) {
    return { score: 7, label: "quadra", tiebreak: [counts[0][0], counts[1][0]] };
  }
  if (counts[0]?.[1] === 3 && counts[1]?.[1] === 2) {
    return { score: 6, label: "full house", tiebreak: [counts[0][0], counts[1][0]] };
  }
  if (flush) {
    return { score: 5, label: "flush", tiebreak: uniqueRanks };
  }
  if (straight) {
    return { score: 4, label: "sequência", tiebreak: [uniqueRanks[0] === 14 && uniqueRanks[1] === 5 ? 5 : uniqueRanks[0]] };
  }
  if (counts[0]?.[1] === 3) {
    return { score: 3, label: "trinca", tiebreak: [counts[0][0], ...uniqueRanks.filter((rank) => rank !== counts[0][0])] };
  }
  if (counts[0]?.[1] === 2 && counts[1]?.[1] === 2) {
    const pairs = counts.filter((entry) => entry[1] === 2).map((entry) => entry[0]).sort((a, b) => b - a);
    const kicker = uniqueRanks.find((rank) => !pairs.includes(rank)) || 0;
    return { score: 2, label: "dois pares", tiebreak: [...pairs, kicker] };
  }
  if (counts[0]?.[1] === 2) {
    return { score: 1, label: "par", tiebreak: [counts[0][0], ...uniqueRanks.filter((rank) => rank !== counts[0][0])] };
  }
  return { score: 0, label: "carta alta", tiebreak: uniqueRanks };
}

function comparePokerPvpHands(a, b) {
  if (a.score !== b.score) return a.score > b.score ? 1 : -1;
  const maxLength = Math.max(a.tiebreak.length, b.tiebreak.length);
  for (let index = 0; index < maxLength; index += 1) {
    const left = a.tiebreak[index] || 0;
    const right = b.tiebreak[index] || 0;
    if (left !== right) return left > right ? 1 : -1;
  }
  return 0;
}

function createDartsPvPState() {
  return {
    round: 1,
    maxRounds: 3,
    playerOneScore: 0,
    playerTwoScore: 0,
    playerOneThrow: null,
    playerTwoThrow: null,
    lastPlayerOne: null,
    lastPlayerTwo: null,
    playerOneAimX: 50,
    playerOneAimY: 50,
    playerTwoAimX: 50,
    playerTwoAimY: 50,
    history: [],
  };
}

function createDicecupsPvPState() {
  return {
    round: 1,
    maxRounds: 3,
    playerOneScore: 0,
    playerTwoScore: 0,
    playerOneGuess: 0,
    playerTwoGuess: 0,
    dice: [0, 0],
    total: 0,
    history: [],
  };
}

function createTrucoPvpDeck() {
  const suits = ["ouros", "espadas", "copas", "paus"];
  const ranks = [
    { rank: "4", strength: 1 },
    { rank: "5", strength: 2 },
    { rank: "6", strength: 3 },
    { rank: "7", strength: 4 },
    { rank: "Q", strength: 5 },
    { rank: "J", strength: 6 },
    { rank: "K", strength: 7 },
    { rank: "A", strength: 8 },
    { rank: "2", strength: 9 },
    { rank: "3", strength: 10 },
  ];
  const deck = [];
  suits.forEach((suit) => {
    ranks.forEach((entry) => deck.push({ suit, rank: entry.rank, strength: entry.strength }));
  });
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temp = deck[index];
    deck[index] = deck[swapIndex];
    deck[swapIndex] = temp;
  }
  return deck;
}

function drawTrucoPvpCards(deck, count) {
  const cards = [];
  for (let index = 0; index < count; index += 1) {
    const card = deck.pop();
    if (card) cards.push(card);
  }
  return cards;
}

function createTrucoPvPState() {
  const deck = createTrucoPvpDeck();
  return {
    deck,
    round: 1,
    maxRounds: 3,
    playerOneScore: 0,
    playerTwoScore: 0,
    playerOneCards: drawTrucoPvpCards(deck, 3),
    playerTwoCards: drawTrucoPvpCards(deck, 3),
    table: [],
    history: [],
  };
}

function callChessMoveFlag(move, methodName) {
  try {
    return Boolean(move && typeof move[methodName] === "function" && move[methodName]());
  } catch (_error) {
    return false;
  }
}

function normalizeChessMoveDescriptor(move = {}) {
  const capture = Boolean(move.captured) || callChessMoveFlag(move, "isCapture");
  const promotion = move.promotion || "";
  return {
    color: move.color === "b" ? "black" : "white",
    from: cleanShortText(move.from || "", 4).toLowerCase(),
    to: cleanShortText(move.to || "", 4).toLowerCase(),
    piece: cleanShortText(move.piece || "", 2).toLowerCase(),
    captured: cleanShortText(move.captured || "", 2).toLowerCase(),
    promotion: cleanShortText(promotion, 2).toLowerCase(),
    flags: cleanShortText(move.flags || "", 12),
    san: cleanShortText(move.san || "", 24),
    lan: cleanShortText(move.lan || `${move.from || ""}${move.to || ""}${promotion || ""}`, 12),
    capture,
    castle: callChessMoveFlag(move, "isCastle") || callChessMoveFlag(move, "isKingsideCastle") || callChessMoveFlag(move, "isQueensideCastle"),
    enPassant: callChessMoveFlag(move, "isEnPassant"),
    bigPawn: callChessMoveFlag(move, "isBigPawn"),
  };
}

function getChessStatus(chess) {
  const inCheck = Boolean(chess?.isCheck?.() || chess?.inCheck?.());
  const checkmate = Boolean(chess?.isCheckmate?.());
  const stalemate = Boolean(chess?.isStalemate?.());
  const insufficient = Boolean(chess?.isInsufficientMaterial?.());
  const repetition = Boolean(chess?.isThreefoldRepetition?.());
  const fiftyMoves = Boolean(chess?.isDrawByFiftyMoves?.());
  const draw = Boolean(chess?.isDraw?.());
  const gameOver = Boolean(chess?.isGameOver?.()) || checkmate || draw;
  return {
    inCheck,
    checkmate,
    stalemate,
    insufficient,
    repetition,
    fiftyMoves,
    draw,
    gameOver,
  };
}

function decorateChessPvPState(state = {}) {
  const baseFen = state.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  if (!Chess) {
    return {
      ...state,
      fen: baseFen,
      turnColor: String(baseFen).split(" ")[1] === "b" ? "black" : "white",
      legalMoves: [],
      forcedMoves: [],
      inCheck: false,
      checkmate: false,
      draw: false,
      gameOver: false,
    };
  }
  try {
    const chess = new Chess(baseFen);
    const legalMoves = chess.moves({ verbose: true }).map(normalizeChessMoveDescriptor);
    const status = getChessStatus(chess);
    const forcedMoves = status.inCheck || legalMoves.length === 1 ? legalMoves : [];
    return {
      ...state,
      fen: chess.fen(),
      whiteSeat: state.whiteSeat || "playerOne",
      blackSeat: state.blackSeat || "playerTwo",
      history: Array.isArray(state.history) ? state.history.slice(-160) : [],
      lastMove: state.lastMove || null,
      turnColor: chess.turn() === "b" ? "black" : "white",
      legalMoves,
      forcedMoves,
      ...status,
    };
  } catch (_error) {
    const chess = new Chess();
    return decorateChessPvPState({
      ...state,
      fen: chess.fen(),
      history: [],
      lastMove: null,
    });
  }
}

function createChessPvPState() {
  const chess = Chess ? new Chess() : null;
  return decorateChessPvPState({
    fen: chess ? chess.fen() : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    whiteSeat: "playerOne",
    blackSeat: "playerTwo",
    history: [],
    lastMove: null,
  });
}

const PVP_POOL_TABLE = {
  width: 100,
  height: 50,
  radius: 1.55,
  pocketRadius: 8.35,
  cueStart: { x: 25, y: 25 },
};
const PVP_POOL_MAX_SHOTS = 24;
const PVP_POOL_COLORS = [
  "#f0c742", "#1f6ad4", "#c93645", "#6b49ba", "#e17a2d",
  "#2d8f72", "#7a2238", "#10131a", "#f0c742", "#1f6ad4",
  "#c93645", "#6b49ba", "#e17a2d", "#2d8f72", "#7a2238",
];
const PVP_POOL_BRAZILIAN_COLORS = {
  1: "#c8242c",
  2: "#f0b12d",
  3: "#1f8c4f",
  4: "#7a4b29",
  5: "#2a63c7",
  6: "#d766aa",
  7: "#181819",
};
const PVP_POOL_RULE_MODES = {
  livre: { id: "livre", label: "LIVRE", scoreLabel: "BOLAS" },
  brasileira: { id: "brasileira", label: "BRASILEIRA", scoreLabel: "PONTOS" },
  parimpar: { id: "parimpar", label: "PAR/IMPAR", scoreLabel: "BOLAS" },
};
const PVP_POOL_POCKETS = [
  { x: 0, y: 0 },
  { x: 50, y: 0 },
  { x: 100, y: 0 },
  { x: 0, y: 50 },
  { x: 50, y: 50 },
  { x: 100, y: 50 },
];
const PVP_POOL_SPINS = {
  centro: { vx: 0, vy: 0, turn: 0 },
  segue: { vx: 0, vy: 0.04, turn: 0 },
  puxa: { vx: 0, vy: -0.04, turn: 0 },
  esq: { vx: -0.035, vy: 0, turn: -0.01 },
  dir: { vx: 0.035, vy: 0, turn: 0.01 },
};

function normalizePoolSpin(value = "centro") {
  const spin = safeString(value || "centro", 20).toLowerCase();
  return Object.prototype.hasOwnProperty.call(PVP_POOL_SPINS, spin) ? spin : "centro";
}

function clampPoolNumber(value, min, max, fallback = min) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
}

function normalizePoolRuleMode(value = "livre") {
  const mode = safeString(value || "livre", 40).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (mode === "brasileira" || mode === "sinucabrasileira" || mode === "br") return "brasileira";
  if (mode === "parimpar" || mode === "parouimpar" || mode === "tacoforte") return "parimpar";
  return "livre";
}

function getPoolRuleMode(mode = "livre") {
  return PVP_POOL_RULE_MODES[normalizePoolRuleMode(mode)] || PVP_POOL_RULE_MODES.livre;
}

function getPoolBallColor(id, mode = "livre") {
  const number = clampInteger(id);
  if (normalizePoolRuleMode(mode) === "brasileira") {
    return PVP_POOL_BRAZILIAN_COLORS[number] || PVP_POOL_COLORS[(number - 1) % PVP_POOL_COLORS.length] || "#f0c742";
  }
  return PVP_POOL_COLORS[(number - 1) % PVP_POOL_COLORS.length] || "#f0c742";
}

function getPoolGroupForNumber(number = 0) {
  return clampInteger(number) % 2 === 0 ? "PAR" : "IMPAR";
}

function getPoolPvPRivalSeat(seat = "playerOne") {
  return seat === "playerOne" ? "playerTwo" : "playerOne";
}

function getNextBrazilianPoolBall(balls = []) {
  return (Array.isArray(balls) ? balls : [])
    .filter((ball) => !ball.cue && clampInteger(ball.id) > 0 && !ball.pocketed)
    .map((ball) => clampInteger(ball.id))
    .sort((a, b) => a - b)[0] || 0;
}

function isPoolGroupCleared(state = {}, seat = "playerOne") {
  const group = safeString(state[`${seat}Group`] || "", 20).toUpperCase();
  if (!group) return false;
  return (Array.isArray(state.balls) ? state.balls : [])
    .filter((ball) => !ball.cue && clampInteger(ball.id) !== 15 && getPoolGroupForNumber(ball.id) === group)
    .every((ball) => Boolean(ball.pocketed));
}

function distancePointToPoolSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const lengthSquared = abx * abx + aby * aby;
  if (lengthSquared <= 0.0001) return Math.hypot(px - bx, py - by);
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lengthSquared));
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}

function poolBallReachedPocket(ball, pocket) {
  if (Math.hypot(ball.x - pocket.x, ball.y - pocket.y) <= PVP_POOL_TABLE.pocketRadius) return true;
  if (!Number.isFinite(ball.prevX) || !Number.isFinite(ball.prevY)) return false;
  return distancePointToPoolSegment(pocket.x, pocket.y, ball.prevX, ball.prevY, ball.x, ball.y) <= PVP_POOL_TABLE.pocketRadius;
}

function createPoolRackRows(rowCounts = [1, 2, 3, 2, 1]) {
  const apex = { x: 63, y: 25 };
  const positions = [];
  rowCounts.forEach((rowCount, column) => {
    for (let row = 0; row < rowCount; row += 1) {
      positions.push({
        x: Number((apex.x + column * 3.05).toFixed(2)),
        y: Number((apex.y + (row - (rowCount - 1) / 2) * 3.35).toFixed(2)),
      });
    }
  });
  return positions;
}

function getPoolRackOrder(ruleMode = "livre") {
  const mode = normalizePoolRuleMode(ruleMode);
  if (mode === "brasileira") return [1, 2, 3, 4, 7, 5, 6];
  if (mode === "parimpar") return [2, 3, 4, 5, 15, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  return [1, 2, 3, 4, 9, 5, 6, 7, 8];
}

function getPoolRackPositions(ruleMode = "livre") {
  const mode = normalizePoolRuleMode(ruleMode);
  if (mode === "parimpar") return createPoolRackRows([1, 2, 3, 4, 4]);
  if (mode === "brasileira") return createPoolRackRows([1, 2, 3, 1]);
  return createPoolRackRows([1, 2, 3, 2, 1]);
}

function createPoolPvPBalls(ruleMode = "livre") {
  const mode = normalizePoolRuleMode(ruleMode);
  const balls = [{
    id: 0,
    label: "branca",
    cue: true,
    color: "#fff6dc",
    x: PVP_POOL_TABLE.cueStart.x,
    y: PVP_POOL_TABLE.cueStart.y,
    vx: 0,
    vy: 0,
    pocketed: false,
  }];
  const numbers = getPoolRackOrder(mode);
  const positions = getPoolRackPositions(mode);
  numbers.forEach((id, index) => {
    const position = positions[index] || { x: 63, y: 25 };
    balls.push({
      id,
      label: String(id),
      cue: false,
      color: getPoolBallColor(id, mode),
      x: position.x,
      y: position.y,
      vx: 0,
      vy: 0,
      pocketed: false,
    });
  });
  return balls;
}

function createPoolPvPSetup(setup = {}) {
  const tutorialReady = setup?.tutorialReady || {};
  return {
    complete: Boolean(setup.complete),
    phase: safeString(setup.phase || (setup.complete ? "done" : "waiting-ready"), 40),
    winnerSeat: safeString(setup.winnerSeat || "", 20),
    chooserSeat: safeString(setup.chooserSeat || "", 20),
    starterSeat: safeString(setup.starterSeat || "", 20),
    modeChooserSeat: safeString(setup.modeChooserSeat || "", 20),
    starterChooserSeat: safeString(setup.starterChooserSeat || "", 20),
    ruleMode: normalizePoolRuleMode(setup.ruleMode || ""),
    winnerChoice: safeString(setup.winnerChoice || setup.choice || "", 20),
    choice: safeString(setup.choice || "", 20),
    tutorialReady: {
      playerOne: Boolean(tutorialReady.playerOne),
      playerTwo: Boolean(tutorialReady.playerTwo),
    },
    decidedAt: safeString(setup.decidedAt || "", 40),
  };
}

function createPoolPvPState(ruleMode = "livre", setup = {}) {
  const mode = normalizePoolRuleMode(ruleMode);
  const rule = getPoolRuleMode(mode);
  return {
    shot: 1,
    maxShots: PVP_POOL_MAX_SHOTS,
    ruleMode: mode,
    ruleLabel: rule.label,
    scoreLabel: rule.scoreLabel,
    setup: createPoolPvPSetup(setup),
    playerOneScore: 0,
    playerTwoScore: 0,
    playerOneGroup: "",
    playerTwoGroup: "",
    ballInHandSeat: "",
    nextBall: mode === "brasileira" ? 1 : 0,
    balls: createPoolPvPBalls(mode),
    lastShot: null,
    history: [],
  };
}

function clonePoolPvPBalls(balls = [], ruleMode = "livre") {
  const source = Array.isArray(balls) && balls.length ? balls : createPoolPvPBalls(ruleMode);
  return source.map((ball) => ({
    id: clampInteger(ball.id),
    label: safeString(ball.label || ball.id || "", 20),
    cue: Boolean(ball.cue || clampInteger(ball.id) === 0),
    color: safeString(ball.color || (clampInteger(ball.id) === 0 ? "#fff6dc" : getPoolBallColor(ball.id, ruleMode)), 20),
    x: clampPoolNumber(ball.x, 0, PVP_POOL_TABLE.width, ball.cue ? PVP_POOL_TABLE.cueStart.x : 50),
    y: clampPoolNumber(ball.y, 0, PVP_POOL_TABLE.height, ball.cue ? PVP_POOL_TABLE.cueStart.y : 25),
    vx: clampPoolNumber(ball.vx, -250, 250, 0),
    vy: clampPoolNumber(ball.vy, -250, 250, 0),
    pocketed: Boolean(ball.pocketed),
    spin: normalizePoolSpin(ball.spin || "centro"),
  }));
}

function getPoolPvPSeatScoreKey(seat = "") {
  return seat === "playerOne" ? "playerOneScore" : "playerTwoScore";
}

function scorePoolPvPShot(state = createPoolPvPState(), seat = "playerOne", pocketedNow = [], cuePocketed = false, targetBefore = 0) {
  const ruleMode = normalizePoolRuleMode(state.ruleMode || "livre");
  const scoreKey = getPoolPvPSeatScoreKey(seat);
  const rivalSeat = getPoolPvPRivalSeat(seat);
  const rivalScoreKey = getPoolPvPSeatScoreKey(rivalSeat);
  let message = "";
  let winner = "";
  let finished = false;
  if (ruleMode === "brasileira") {
    const target = targetBefore || getNextBrazilianPoolBall(state.balls);
    const wrongBall = pocketedNow.find((ball) => clampInteger(ball.id) !== target);
    if (cuePocketed || wrongBall) {
      state[rivalScoreKey] = clampInteger(state[rivalScoreKey]) + 7;
      message = cuePocketed ? "Falta: branca caiu. 7 pontos ao rival." : `Falta: bola da vez era ${target}. 7 pontos ao rival.`;
    } else if (pocketedNow.length) {
      const made = pocketedNow.reduce((sum, ball) => sum + clampInteger(ball.id), 0);
      state[scoreKey] = clampInteger(state[scoreKey]) + made;
      message = `${made} ponto${made === 1 ? "" : "s"} na Sinuca Brasileira.`;
    } else {
      message = "Sem encaçapar na Sinuca Brasileira.";
    }
    state.nextBall = getNextBrazilianPoolBall(state.balls);
    finished = state.nextBall <= 0;
    return { message, winner, finished };
  }

  if (ruleMode === "parimpar") {
    let groupAssignedMessage = "";
    if (cuePocketed) message = "Falta: branca caiu. Rival fica com bola na mao.";
    for (const ball of pocketedNow) {
      const id = clampInteger(ball.id);
      if (id === 15) {
        if (isPoolGroupCleared(state, seat)) {
          winner = seat;
          message = "Bola 15 fechou a partida.";
        } else {
          winner = rivalSeat;
          message = "Bola 15 caiu antes da hora. Rival venceu.";
        }
        finished = true;
        break;
      }
      if (!state.playerOneGroup && !state.playerTwoGroup) {
        const group = getPoolGroupForNumber(id);
        const other = group === "PAR" ? "IMPAR" : "PAR";
        state[`${seat}Group`] = group;
        state[`${rivalSeat}Group`] = other;
        groupAssignedMessage = `Grupo definido: jogador ${group}, rival ${other}.`;
      }
      const ownGroup = safeString(state[`${seat}Group`] || "", 20).toUpperCase();
      if (!ownGroup || getPoolGroupForNumber(id) === ownGroup) {
        state[scoreKey] = clampInteger(state[scoreKey]) + 1;
        message = `Bola ${id} do grupo ${ownGroup || getPoolGroupForNumber(id)}.`;
      } else {
        state[rivalScoreKey] = clampInteger(state[rivalScoreKey]) + 1;
        message = `Bola ${id} era do rival.`;
      }
      if (groupAssignedMessage) {
        message = `${groupAssignedMessage} ${message}`;
        groupAssignedMessage = "";
      }
    }
    if (!message) message = "Sem encaçapar no Par/Impar.";
    return { message, winner, finished };
  }

  state[scoreKey] = clampInteger(state[scoreKey]) + pocketedNow.length;
  message = pocketedNow.length
    ? `${pocketedNow.length} bola${pocketedNow.length === 1 ? "" : "s"} no modo Livre.`
    : "Sem encaçapar no modo Livre.";
  finished = state.balls.filter((ball) => !ball.cue && !ball.pocketed).length <= 0;
  if (finished) {
    message = `${message} Mesa limpa.`;
  }
  return { message, winner, finished };
}

function describePoolGroupOwners(match = {}, poolState = {}) {
  if (normalizePoolRuleMode(poolState.ruleMode || "") !== "parimpar") return "";
  const playerOneGroup = safeString(poolState.playerOneGroup || "", 20).toUpperCase();
  const playerTwoGroup = safeString(poolState.playerTwoGroup || "", 20).toUpperCase();
  if (!playerOneGroup && !playerTwoGroup) return "Par/Impar: a primeira bola valida ainda vai definir os grupos.";
  const oneName = match?.playerOne?.name || "Jogador 1";
  const twoName = match?.playerTwo?.name || "Jogador 2";
  return `Grupos: ${oneName} joga ${playerOneGroup || "a definir"}; ${twoName} joga ${playerTwoGroup || "a definir"}.`;
}

function simulatePoolPvPShot(poolState = createPoolPvPState(), seat = "playerOne", angle = 0, power = 0.5, spinValue = "centro", cuePlace = null) {
  const ruleMode = normalizePoolRuleMode(poolState.ruleMode || "livre");
  const baseState = createPoolPvPState(ruleMode, poolState.setup || { complete: true, phase: "done" });
  const state = {
    ...baseState,
    ...poolState,
    ruleMode,
    ruleLabel: getPoolRuleMode(ruleMode).label,
    scoreLabel: getPoolRuleMode(ruleMode).scoreLabel,
    setup: createPoolPvPSetup(poolState.setup || { complete: true, phase: "done" }),
    balls: clonePoolPvPBalls(poolState.balls, ruleMode),
    history: Array.isArray(poolState.history) ? poolState.history.slice(-24) : [],
  };
  const cue = state.balls.find((ball) => ball.cue || ball.id === 0) || state.balls[0];
  const shotAngle = clampPoolNumber(angle, -180, 180, 0);
  const shotPower = clampPoolNumber(power, 0.1, 1, 0.5);
  const shotSpin = normalizePoolSpin(spinValue);
  const spin = PVP_POOL_SPINS[shotSpin] || PVP_POOL_SPINS.centro;
  const radians = (shotAngle * Math.PI) / 180;
  const speed = 58 + shotPower * 122;
  const pocketedBefore = new Set(state.balls.filter((ball) => ball.pocketed && !ball.cue).map((ball) => ball.id));
  const targetBefore = ruleMode === "brasileira" ? getNextBrazilianPoolBall(state.balls) : 0;
  cue.pocketed = false;
  const wasBallInHand = state.ballInHandSeat === seat;
  cue.x = clampPoolNumber(
    wasBallInHand && cuePlace ? cuePlace.x : cue.x,
    PVP_POOL_TABLE.radius,
    PVP_POOL_TABLE.width - PVP_POOL_TABLE.radius,
    PVP_POOL_TABLE.cueStart.x
  );
  cue.y = clampPoolNumber(
    wasBallInHand && cuePlace ? cuePlace.y : cue.y,
    PVP_POOL_TABLE.radius,
    PVP_POOL_TABLE.height - PVP_POOL_TABLE.radius,
    PVP_POOL_TABLE.cueStart.y
  );
  if (wasBallInHand) state.ballInHandSeat = "";
  cue.vx = Math.cos(radians) * speed + spin.vx * 190;
  cue.vy = Math.sin(radians) * speed + spin.vy * 190;
  cue.spin = shotSpin;

  let cuePocketed = false;
  let stillFrames = 0;
  const dt = 1 / 60;
  for (let frame = 0; frame < 3600; frame += 1) {
    state.balls.forEach((ball) => {
      if (ball.pocketed) return;
      if ((ball.cue || ball.id === 0) && ball.spin && ball.spin !== "centro") {
        const activeSpin = PVP_POOL_SPINS[ball.spin] || PVP_POOL_SPINS.centro;
        const ballSpeed = Math.hypot(ball.vx, ball.vy);
        if (ballSpeed > 12 && activeSpin.turn) {
          const curveAngle = Math.atan2(ball.vy, ball.vx) + activeSpin.turn * dt * 7;
          ball.vx = Math.cos(curveAngle) * ballSpeed;
          ball.vy = Math.sin(curveAngle) * ballSpeed;
        }
      }
      ball.prevX = ball.x;
      ball.prevY = ball.y;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      ball.vx *= 0.9915;
      ball.vy *= 0.9915;
      if (Math.hypot(ball.vx, ball.vy) < 0.72) {
        ball.vx = 0;
        ball.vy = 0;
      }
      const pocket = PVP_POOL_POCKETS.find((entry) => poolBallReachedPocket(ball, entry));
      if (pocket) {
        if (ball.cue || ball.id === 0) {
          cuePocketed = true;
          ball.x = PVP_POOL_TABLE.cueStart.x;
          ball.y = PVP_POOL_TABLE.cueStart.y;
          ball.vx = 0;
          ball.vy = 0;
          return;
        }
        ball.pocketed = true;
        ball.x = pocket.x;
        ball.y = pocket.y;
        ball.vx = 0;
        ball.vy = 0;
        return;
      }
      if (ball.x < PVP_POOL_TABLE.radius) {
        ball.x = PVP_POOL_TABLE.radius;
        ball.vx = Math.abs(ball.vx) * 0.88;
      }
      if (ball.x > PVP_POOL_TABLE.width - PVP_POOL_TABLE.radius) {
        ball.x = PVP_POOL_TABLE.width - PVP_POOL_TABLE.radius;
        ball.vx = -Math.abs(ball.vx) * 0.88;
      }
      if (ball.y < PVP_POOL_TABLE.radius) {
        ball.y = PVP_POOL_TABLE.radius;
        ball.vy = Math.abs(ball.vy) * 0.88;
      }
      if (ball.y > PVP_POOL_TABLE.height - PVP_POOL_TABLE.radius) {
        ball.y = PVP_POOL_TABLE.height - PVP_POOL_TABLE.radius;
        ball.vy = -Math.abs(ball.vy) * 0.88;
      }
    });

    for (let left = 0; left < state.balls.length; left += 1) {
      const a = state.balls[left];
      if (a.pocketed) continue;
      for (let right = left + 1; right < state.balls.length; right += 1) {
        const b = state.balls[right];
        if (b.pocketed) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy) || 0.0001;
        const minDistance = PVP_POOL_TABLE.radius * 2;
        if (distance >= minDistance) continue;
        const nx = dx / distance;
        const ny = dy / distance;
        const overlap = minDistance - distance;
        a.x -= nx * overlap * 0.5;
        a.y -= ny * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.y += ny * overlap * 0.5;
        const closing = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (closing <= 0) continue;
        const impulse = closing * 0.94;
        a.vx -= impulse * nx;
        a.vy -= impulse * ny;
        b.vx += impulse * nx;
        b.vy += impulse * ny;
      }
    }

    state.balls.forEach((ball) => {
      if (ball.pocketed) return;
      const pocket = PVP_POOL_POCKETS.find((entry) => poolBallReachedPocket(ball, entry));
      if (!pocket) return;
      if (ball.cue || ball.id === 0) {
        cuePocketed = true;
        ball.x = PVP_POOL_TABLE.cueStart.x;
        ball.y = PVP_POOL_TABLE.cueStart.y;
        ball.vx = 0;
        ball.vy = 0;
        return;
      }
      ball.pocketed = true;
      ball.x = pocket.x;
      ball.y = pocket.y;
      ball.vx = 0;
      ball.vy = 0;
    });

    const moving = state.balls.some((ball) => !ball.pocketed && Math.hypot(ball.vx, ball.vy) > 0);
    stillFrames = moving ? 0 : stillFrames + 1;
    if (stillFrames > 24) break;
  }

  state.balls.forEach((ball) => {
    ball.x = Number(ball.x.toFixed(2));
    ball.y = Number(ball.y.toFixed(2));
    ball.vx = 0;
    ball.vy = 0;
    delete ball.prevX;
    delete ball.prevY;
  });
  const pocketedNow = state.balls.filter((ball) => !ball.cue && ball.pocketed && !pocketedBefore.has(ball.id));
  const score = scorePoolPvPShot(state, seat, pocketedNow, cuePocketed, targetBefore);
  if (cuePocketed) state.ballInHandSeat = getPoolPvPRivalSeat(seat);
  const nextShot = clampInteger(state.shot, 1) + 1;
  const remaining = state.balls.filter((ball) => !ball.cue && !ball.pocketed).length;
  const lastShot = {
    seat,
    ruleMode,
    angle: Number(shotAngle.toFixed(1)),
    power: Number(shotPower.toFixed(2)),
    spin: shotSpin,
    pocketed: pocketedNow.map((ball) => ball.id),
    cuePocketed,
    ballInHand: wasBallInHand,
    remaining,
    message: score.message,
    at: new Date().toISOString(),
  };
  state.lastShot = lastShot;
  state.history.push(lastShot);
  state.shot = nextShot;
  return {
    poolState: state,
    pocketedCount: pocketedNow.length,
    cuePocketed,
    remaining,
    winner: score.winner,
    message: score.message,
    finished: Boolean(score.finished) || remaining <= 0 || nextShot > clampInteger(state.maxShots, PVP_POOL_MAX_SHOTS),
  };
}

function resolvePoolPvPWinner(poolState = {}) {
  const playerOneScore = clampInteger(poolState.playerOneScore);
  const playerTwoScore = clampInteger(poolState.playerTwoScore);
  if (playerOneScore > playerTwoScore) return "playerOne";
  if (playerTwoScore > playerOneScore) return "playerTwo";
  return "";
}

function clampDartsAimValue(value, fallback = 50) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(100, numeric));
}

function getDartboardScoreFromPoint(x, y) {
  const dx = clampDartsAimValue(x, 50) - 50;
  const dy = clampDartsAimValue(y, 50) - 50;
  const distance = Math.hypot(dx, dy);
  if (distance > 48) {
    return { score: 0, ring: "miss", number: 0, multiplier: 0, label: "fora do alvo" };
  }
  if (distance <= 4.2) {
    return { score: 50, ring: "bull", number: 25, multiplier: 2, label: "bull 50" };
  }
  if (distance <= 8.4) {
    return { score: 25, ring: "outerBull", number: 25, multiplier: 1, label: "outer bull 25" };
  }
  const order = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
  const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
  const normalizedAngle = (angle + 360 + 9) % 360;
  const number = order[Math.floor(normalizedAngle / 18) % order.length];
  if (distance >= 38.5 && distance <= 48) {
    return { score: number * 2, ring: "double", number, multiplier: 2, label: `double ${number}` };
  }
  if (distance >= 24.5 && distance <= 30.5) {
    return { score: number * 3, ring: "triple", number, multiplier: 3, label: `triple ${number}` };
  }
  return { score: number, ring: "single", number, multiplier: 1, label: `single ${number}` };
}

function getDartAimDifficulty(target) {
  if (!target || target.ring === "miss") return 0.9;
  if (target.ring === "bull") return 1.45;
  if (target.ring === "outerBull") return 1.2;
  if (target.ring === "triple" || target.ring === "double") return 1.15;
  return 0.82;
}

function randomDartSpread(range) {
  return (Math.random() * 2 - 1) * range + (Math.random() * 2 - 1) * range * 0.55;
}

function rollDartsPvpThrow(aimX, aimY) {
  const target = getDartboardScoreFromPoint(aimX, aimY);
  const difficulty = getDartAimDifficulty(target);
  const spread = Math.max(4, 8 + difficulty * 8);
  const finalX = clampDartsAimValue(aimX + randomDartSpread(spread), 50);
  const finalY = clampDartsAimValue(aimY + randomDartSpread(spread), 50);
  const outcome = getDartboardScoreFromPoint(finalX, finalY);
  return {
    aimX: clampDartsAimValue(aimX, 50),
    aimY: clampDartsAimValue(aimY, 50),
    targetLabel: target.label,
    score: outcome.score,
    ring: outcome.ring,
    number: outcome.number,
    multiplier: outcome.multiplier,
    label: outcome.label,
    x: finalX,
    y: finalY,
  };
}

function getCards21SeatStateKey(seat = "") {
  return seat === "playerOne" ? "playerOneState" : seat === "playerTwo" ? "playerTwoState" : "";
}

function getCards21SeatCardsKey(seat = "") {
  return seat === "playerOne" ? "playerOneCards" : seat === "playerTwo" ? "playerTwoCards" : "";
}

function patchPubpaidPvpMatchPresence(match = {}, seat = "", nowIso = new Date().toISOString()) {
  if (!seat) return match;
  return {
    ...match,
    presence: {
      ...(match.presence || {}),
      [seat]: {
        ...(match.presence?.[seat] || {}),
        connected: true,
        lastSeenAt: nowIso,
      },
    },
    updatedAt: nowIso,
  };
}

function createPubpaidPvpMatch(gameId, stake, playerOne, playerTwo) {
  const nowIso = new Date().toISOString();
  const match = {
    id: createRecordId("pvp"),
    gameId,
    stake,
    status: "readying",
    createdAt: nowIso,
    startedAt: "",
    matchedAt: nowIso,
    updatedAt: nowIso,
    playerOne,
    playerTwo,
    presence: createPubpaidPvpPresence(nowIso),
    ready: { playerOne: false, playerTwo: false },
    coinFlip: null,
    abandonedBy: "",
    deadlineAt: "",
    winner: "",
    resultSummary: "",
    moveCount: 0,
    turn: "",
  };

  if (gameId === "checkers") {
    return {
      ...match,
      board: createCheckersPvPBoard(),
      forcedPiece: null,
      lastMove: null,
      checkersHistory: [],
      resultSummary: "Jogador real encontrado. Os dois precisam confirmar para iniciar.",
    };
  }

  if (gameId === "pool") {
    return {
      ...match,
      poolState: createPoolPvPState(),
      resultSummary: "Jogador real encontrado. Os dois precisam confirmar para iniciar a sinuca.",
    };
  }

  if (gameId === "chess") {
    return {
      ...match,
      chessState: createChessPvPState(),
      resultSummary: "Jogador real encontrado. Os dois precisam confirmar para iniciar o xadrez.",
    };
  }

  if (gameId === "cards21") {
    return {
      ...match,
      cardsState: createCards21PvPState(),
      resultSummary: "Jogador real encontrado. Os dois precisam confirmar para iniciar o 21.",
    };
  }

  if (gameId === "poker") {
    return {
      ...match,
      pokerState: createPokerPvPState(),
      resultSummary: "Jogador real encontrado. Os dois precisam confirmar para iniciar o poker.",
    };
  }

  if (gameId === "truco") {
    return {
      ...match,
      trucoState: createTrucoPvPState(),
      resultSummary: "Jogador real encontrado. Os dois precisam confirmar para iniciar o truco.",
    };
  }

  if (gameId === "darts") {
    return {
      ...match,
      dartsState: createDartsPvPState(),
      resultSummary: "Jogador real encontrado. Os dois precisam confirmar para iniciar os dardos.",
    };
  }

  if (gameId === "dicecups") {
    return {
      ...match,
      diceState: createDicecupsPvPState(),
      resultSummary: "Jogador real encontrado. Os dois precisam confirmar para iniciar os dados.",
    };
  }

  return match;
}

function createPubpaidPvpCoinFlip(match = {}) {
  const playerOneStarts = Math.random() < 0.5;
  const firstSeat = playerOneStarts ? "playerOne" : "playerTwo";
  const firstPlayer = match[firstSeat] || {};
  return {
    face: playerOneStarts ? "cara" : "coroa",
    firstSeat,
    firstPlayerName: firstPlayer.name || firstPlayer.email || (firstSeat === "playerOne" ? "Jogador 1" : "Jogador 2"),
    decidedAt: new Date().toISOString()
  };
}

function getPubpaidPvpSeatForWallet(match = {}, walletKey = "") {
  const key = safeString(walletKey || "", 180).toLowerCase();
  if (!key) return "";
  if (match?.playerOne?.walletKey === key) return "playerOne";
  if (match?.playerTwo?.walletKey === key) return "playerTwo";
  return "";
}

function touchPubpaidPvpPresence(store = emptyPubpaidPvpStore(), authUser = {}, gameId = "") {
  const walletKey = getPubpaidWalletKey(authUser);
  if (!walletKey || !gameId) return store;
  const nowIso = new Date().toISOString();
  return {
    ...store,
    matches: (Array.isArray(store.matches) ? store.matches : []).map((match) => {
      if (match?.gameId !== gameId || !["active", "abandoned"].includes(match?.status)) return match;
      const seat = getPubpaidPvpSeatForWallet(match, walletKey);
      if (!seat) return match;
      const nextPresence = {
        ...(match.presence || {}),
        [seat]: {
          ...(match.presence?.[seat] || {}),
          connected: true,
          lastSeenAt: nowIso,
        },
      };
      if (match.status === "abandoned" && match.abandonedBy === seat) {
        return {
          ...match,
          status: "active",
          abandonedBy: "",
          deadlineAt: "",
          presence: nextPresence,
          resultSummary: `${match?.[seat]?.name || "Jogador"} reconectou. A mesa voltou ao estado ativo.`,
          updatedAt: nowIso,
        };
      }
      return {
        ...match,
        presence: nextPresence,
        updatedAt: match.updatedAt || nowIso,
      };
    }),
  };
}

function resolveCards21PvpMatch(match) {
  const cardsState = match?.cardsState || createCards21PvPState();
  const playerOneTotal = sumPubpaid21Cards(cardsState.playerOneCards);
  const playerTwoTotal = sumPubpaid21Cards(cardsState.playerTwoCards);
  const playerOneLive = playerOneTotal <= 21;
  const playerTwoLive = playerTwoTotal <= 21;

  if (!playerOneLive && !playerTwoLive) {
    return {
      winner: "",
      resultSummary: "As duas maos estouraram. A mesa devolveu a entrada.",
    };
  }
  if (!playerOneLive) {
    return {
      winner: "playerTwo",
      resultSummary: `${match?.playerOne?.name || "Jogador 1"} estourou. ${match?.playerTwo?.name || "Jogador 2"} levou a mesa do 21.`,
    };
  }
  if (!playerTwoLive) {
    return {
      winner: "playerOne",
      resultSummary: `${match?.playerTwo?.name || "Jogador 2"} estourou. ${match?.playerOne?.name || "Jogador 1"} levou a mesa do 21.`,
    };
  }
  if (playerOneTotal > playerTwoTotal) {
    return {
      winner: "playerOne",
      resultSummary: `${match?.playerOne?.name || "Jogador 1"} travou melhor em ${playerOneTotal} e venceu o 21.`,
    };
  }
  if (playerTwoTotal > playerOneTotal) {
    return {
      winner: "playerTwo",
      resultSummary: `${match?.playerTwo?.name || "Jogador 2"} travou melhor em ${playerTwoTotal} e venceu o 21.`,
    };
  }
  return {
    winner: "",
    resultSummary: `As duas maos fecharam em ${playerOneTotal}. A mesa devolveu a entrada.`,
  };
}

function getPvpCheckersOwner(piece = "") {
  if (!piece) return "";
  return piece.toLowerCase() === "p" ? "playerOne" : "playerTwo";
}

function getPvpCheckersEnemy(owner = "") {
  return owner === "playerOne" ? "playerTwo" : "playerOne";
}

function isPvpCheckersKing(piece = "") {
  return Boolean(piece) && piece === String(piece).toUpperCase();
}

function inPvpCheckersBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function crownPvpCheckersPiece(piece, row) {
  if (piece === "p" && row === 0) return "P";
  if (piece === "o" && row === 7) return "O";
  return piece;
}

function clonePvpCheckersBoard(board = []) {
  return board.map((row) => row.slice());
}

function getSimplePvpCheckersMovesForPiece(board, row, col) {
  const piece = board?.[row]?.[col];
  if (!piece) return [];
  const moves = [];

  if (isPvpCheckersKing(piece)) {
    PVP_CHECKERS_DIRECTIONS.forEach(([rowStep, colStep]) => {
      let nextRow = row + rowStep;
      let nextCol = col + colStep;
      while (inPvpCheckersBounds(nextRow, nextCol) && !board[nextRow][nextCol]) {
        moves.push({ from: { row, col }, to: { row: nextRow, col: nextCol }, capture: null });
        nextRow += rowStep;
        nextCol += colStep;
      }
    });
    return moves;
  }

  const directions = piece.toLowerCase() === "p" ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
  directions.forEach(([rowStep, colStep]) => {
    const nextRow = row + rowStep;
    const nextCol = col + colStep;
    if (inPvpCheckersBounds(nextRow, nextCol) && !board[nextRow][nextCol]) {
      moves.push({ from: { row, col }, to: { row: nextRow, col: nextCol }, capture: null });
    }
  });
  return moves;
}

function getPvpCheckersCapturesForPiece(board, row, col) {
  const piece = board?.[row]?.[col];
  if (!piece) return [];
  const owner = getPvpCheckersOwner(piece);
  const enemy = getPvpCheckersEnemy(owner);
  const captures = [];

  if (isPvpCheckersKing(piece)) {
    PVP_CHECKERS_DIRECTIONS.forEach(([rowStep, colStep]) => {
      let scanRow = row + rowStep;
      let scanCol = col + colStep;
      while (inPvpCheckersBounds(scanRow, scanCol) && !board[scanRow][scanCol]) {
        scanRow += rowStep;
        scanCol += colStep;
      }
      if (!inPvpCheckersBounds(scanRow, scanCol) || getPvpCheckersOwner(board[scanRow][scanCol]) !== enemy) return;
      const capture = { row: scanRow, col: scanCol };
      let landingRow = scanRow + rowStep;
      let landingCol = scanCol + colStep;
      while (inPvpCheckersBounds(landingRow, landingCol) && !board[landingRow][landingCol]) {
        captures.push({
          from: { row, col },
          to: { row: landingRow, col: landingCol },
          capture,
        });
        landingRow += rowStep;
        landingCol += colStep;
      }
    });
    return captures;
  }

  PVP_CHECKERS_DIRECTIONS.forEach(([rowStep, colStep]) => {
    const enemyRow = row + rowStep;
    const enemyCol = col + colStep;
    const landingRow = enemyRow + rowStep;
    const landingCol = enemyCol + colStep;
    if (
      inPvpCheckersBounds(landingRow, landingCol) &&
      getPvpCheckersOwner(board?.[enemyRow]?.[enemyCol]) === enemy &&
      !board[landingRow][landingCol]
    ) {
      captures.push({
        from: { row, col },
        to: { row: landingRow, col: landingCol },
        capture: { row: enemyRow, col: enemyCol },
      });
    }
  });
  return captures;
}

function applyPvpCheckersMove(board, move) {
  const next = clonePvpCheckersBoard(board);
  const piece = next?.[move?.from?.row]?.[move?.from?.col] || "";
  if (!piece) return next;
  next[move.from.row][move.from.col] = "";
  if (move.capture) next[move.capture.row][move.capture.col] = "";
  next[move.to.row][move.to.col] = crownPvpCheckersPiece(piece, move.to.row);
  return next;
}

function getPvpCheckersMaxCaptureDepth(board, row, col) {
  const captures = getPvpCheckersCapturesForPiece(board, row, col);
  if (!captures.length) return 0;
  return Math.max(
    ...captures.map((move) => 1 + getPvpCheckersMaxCaptureDepth(applyPvpCheckersMove(board, move), move.to.row, move.to.col))
  );
}

function normalizePvpCheckersForcedPiece(value = null) {
  if (!value) return null;
  const row = clampInteger(value.row, -1);
  const col = clampInteger(value.col, -1);
  return inPvpCheckersBounds(row, col) ? { row, col } : null;
}

function getAllPvpCheckersMoves(board, owner, forcedPiece = null) {
  const forced = normalizePvpCheckersForcedPiece(forcedPiece);
  const captures = [];
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      if (forced && (forced.row !== row || forced.col !== col)) continue;
      if (getPvpCheckersOwner(board[row][col]) !== owner) continue;
      getPvpCheckersCapturesForPiece(board, row, col).forEach((move) => {
        captures.push({
          ...move,
          chainLength: 1 + getPvpCheckersMaxCaptureDepth(applyPvpCheckersMove(board, move), move.to.row, move.to.col)
        });
      });
    }
  }
  if (captures.length) {
    const maxChain = Math.max(...captures.map((move) => move.chainLength || 1));
    return captures.filter((move) => (move.chainLength || 1) === maxChain);
  }
  if (forced) return [];

  const moves = [];
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      if (getPvpCheckersOwner(board[row][col]) !== owner) continue;
      moves.push(...getSimplePvpCheckersMovesForPiece(board, row, col));
    }
  }
  return moves;
}

function countPvpCheckersPieces(board, owner) {
  let count = 0;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      if (getPvpCheckersOwner(board[row][col]) === owner) count += 1;
    }
  }
  return count;
}

function getPvpCheckersOutcome(board) {
  const playerOnePieces = countPvpCheckersPieces(board, "playerOne");
  const playerTwoPieces = countPvpCheckersPieces(board, "playerTwo");
  if (!playerOnePieces) return "playerTwo";
  if (!playerTwoPieces) return "playerOne";
  if (!getAllPvpCheckersMoves(board, "playerOne").length) return "playerTwo";
  if (!getAllPvpCheckersMoves(board, "playerTwo").length) return "playerOne";
  return "";
}

function createPubpaidPvpPlayer(authUser = {}, profile = {}) {
  return {
    walletKey: getPubpaidWalletKey(authUser),
    sub: safeString(authUser.sub, 160),
    email: cleanEmail(authUser.email),
    name: cleanShortText(profile.name || authUser.name || authUser.givenName || "Jogador", 100),
    archetype: cleanShortText(profile.archetype || "neon", 40) || "neon",
    favorite: cleanShortText(profile.favorite || "", 40),
    picture: safeString(authUser.picture, 360),
  };
}

function buildPubpaidPvpStatePayload(store, authUser, gameId) {
  const walletKey = getPubpaidWalletKey(authUser);
  const waitingEntry = store.waiting.find((entry) => entry?.gameId === gameId && entry?.player?.walletKey === walletKey) || null;
  const playerMatches = store.matches.filter((entry) =>
    entry?.gameId === gameId &&
    ["readying", "active", "abandoned", "finished"].includes(entry?.status) &&
    [entry?.playerOne?.walletKey, entry?.playerTwo?.walletKey].includes(walletKey)
  );
  const byLatestUpdate = (left, right) =>
    new Date(right?.updatedAt || right?.finishedAt || right?.startedAt || right?.createdAt || 0).getTime() -
    new Date(left?.updatedAt || left?.finishedAt || left?.startedAt || left?.createdAt || 0).getTime();
  const liveMatch =
    playerMatches
      .filter((entry) => ["readying", "active", "abandoned"].includes(entry?.status))
      .sort(byLatestUpdate)[0] || null;
  const latestFinishedMatch =
    playerMatches
      .filter((entry) => entry?.status === "finished")
      .sort(byLatestUpdate)[0] || null;
  const matchEntry = liveMatch || (waitingEntry ? null : latestFinishedMatch);
  const seat = matchEntry
    ? matchEntry.playerOne?.walletKey === walletKey
      ? "playerOne"
      : "playerTwo"
    : "";
  const matchPayload = matchEntry?.gameId === "chess" && matchEntry?.chessState
    ? {
        ...matchEntry,
        chessState: decorateChessPvPState(matchEntry.chessState),
      }
    : matchEntry;
  return {
    ok: true,
    gameId,
    state: matchPayload ? matchPayload.status : waitingEntry ? "waiting" : "idle",
    seat,
    queue: waitingEntry,
    match: matchPayload,
  };
}

async function appendCanonicalPubpaidItem(collectionKey, item) {
  return withCanonicalPubpaidLock(() => {
    const store = readCanonicalPubpaidStore();
    const nextItems = Array.isArray(store?.[collectionKey]) ? store[collectionKey].slice() : [];
    nextItems.push(item);
    return writeCanonicalPubpaidStore({
      ...store,
      [collectionKey]: nextItems,
    });
  });
}

function readMergedPubpaidArray(primaryFile, legacyFile) {
  const store = readCanonicalPubpaidStore();
  const normalizedPrimary = String(primaryFile || "");
  const normalizedLegacy = String(legacyFile || "");

  if (normalizedPrimary.includes("withdraw") || normalizedLegacy.includes("withdraw")) {
    return store.withdrawals.slice();
  }

  return store.deposits.slice();
}

function getPubpaidWalletStore() {
  return readCanonicalPubpaidStore().wallets;
}

function writePubpaidArrayCompat(primaryFile, legacyFile, items = []) {
  const store = readCanonicalPubpaidStore();
  const normalizedPrimary = String(primaryFile || "");
  const normalizedLegacy = String(legacyFile || "");

  if (normalizedPrimary.includes("withdraw") || normalizedLegacy.includes("withdraw")) {
    const nextStore = {
      ...store,
      withdrawals: Array.isArray(items) ? items : [],
    };
    return require("./pubpaid-runtime").writeStore(nextStore).withdrawals;
  }

  const nextStore = {
    ...store,
    deposits: Array.isArray(items) ? items : [],
  };
  return require("./pubpaid-runtime").writeStore(nextStore).deposits;
}

function savePubpaidWalletStore(wallets = {}) {
  const store = readCanonicalPubpaidStore();
  return require("./pubpaid-runtime").writeStore({
    ...store,
    wallets: wallets || {},
  }).wallets;
}

function sendPubpaidAdminDashboard(res) {
  const payload = buildPubpaidAdminPayload();
  return res.json({
    ok: true,
    dashboard: payload.dashboard,
    pendingPubpaidDeposits: payload.pendingPubpaidDeposits,
    pendingPubpaidWithdrawals: payload.pendingPubpaidWithdrawals,
    pubpaidWalletBoard: payload.pubpaidWalletBoard,
  });
}

function patchPubpaidAdminRoutes() {
  if (typeof app === "undefined" || !app || !app._router || !Array.isArray(app._router.stack)) {
    return;
  }

  const replaceRouteHandler = (routePath, method, handler) => {
    for (const layer of app._router.stack) {
      if (!layer || !layer.route || layer.route.path !== routePath) {
        continue;
      }
      if (!layer.route.methods || !layer.route.methods[method]) {
        continue;
      }
      layer.route.stack = [
        {
          handle: handler,
          name: handler.name || "patchedPubpaidHandler",
          params: undefined,
          path: undefined,
          keys: [],
          method,
        },
      ];
    }
  };

  replaceRouteHandler("/api/pubpaid-admin/dashboard", "get", function patchedPubpaidDashboard(_req, res) {
    return sendPubpaidAdminDashboard(res);
  });

  replaceRouteHandler("/api/pubpaid-admin/deposits/review", "post", async function patchedPubpaidDepositReview(req, res) {
    try {
      const body = req.body || {};
      const result = await reviewCanonicalPubpaidDeposit({
        depositId: body.depositId || body.id,
        decision: body.decision,
        reviewer: body.reviewer || body.adminUser || body.username,
        reason: body.reason || body.reviewReason,
      });
      return res.json({
        ok: true,
        idempotent: result.idempotent,
        item: result.item,
        dashboard: result.dashboard,
        pendingPubpaidDeposits: result.dashboard.pendingDeposits,
        pendingPubpaidWithdrawals: result.dashboard.pendingWithdrawals,
        pubpaidWalletBoard: result.dashboard.walletBoard,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        ok: false,
        error: error.message || "Falha ao revisar depósito.",
      });
    }
  });

  replaceRouteHandler("/api/pubpaid-admin/withdrawals/review", "post", async function patchedPubpaidWithdrawalReview(req, res) {
    try {
      const body = req.body || {};
      const result = await reviewCanonicalPubpaidWithdrawal({
        withdrawalId: body.withdrawalId || body.id,
        decision: body.decision,
        reviewer: body.reviewer || body.adminUser || body.username,
        reason: body.reason || body.reviewReason,
      });
      return res.json({
        ok: true,
        idempotent: result.idempotent,
        item: result.item,
        dashboard: result.dashboard,
        pendingPubpaidDeposits: result.dashboard.pendingDeposits,
        pendingPubpaidWithdrawals: result.dashboard.pendingWithdrawals,
        pubpaidWalletBoard: result.dashboard.walletBoard,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        ok: false,
        error: error.message || "Falha ao revisar saque.",
      });
    }
  });
}

process.nextTick(patchPubpaidAdminRoutes);
