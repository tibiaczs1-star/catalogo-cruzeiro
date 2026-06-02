#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT_DIR, ".codex-temp", "hermes-opendesign");
const DATA_DIR = path.join(ROOT_DIR, "data");
const ORDERS_FILE = path.join(DATA_DIR, "opendesign-orders.json");
const STATUS_JSON = path.join(OUTPUT_DIR, "latest-status.json");
const STATUS_MD = path.join(OUTPUT_DIR, "latest-status.md");
const LATEST_REQUEST_MD = path.join(OUTPUT_DIR, "latest-request.md");
const HERMES_HOME = path.join(process.env.USERPROFILE || "C:\\Users\\junio", ".hermes");
const HERMES_ENV_FILE = path.join(HERMES_HOME, ".env");
const HERMES_CONFIG_FILE = path.join(HERMES_HOME, "config.yaml");

const GITHUB_RESOURCES = [
  {
    id: "open-codesign",
    name: "Open CoDesign",
    url: "https://github.com/OpenCoworkAI/open-codesign",
    role: "local-first prompt-to-prototype candidate",
    use: "Referencia para app desktop BYOK, sessoes de design, DESIGN.md e artefatos exportaveis."
  },
  {
    id: "open-pencil-main",
    name: "OpenPencil",
    url: "https://github.com/open-pencil/open-pencil",
    role: "open-source Figma alternative",
    use: "Referencia para canvas, colaboracao, arquivos de design e editor visual."
  },
  {
    id: "openpencil-agentic",
    name: "ZSeven-W OpenPencil",
    url: "https://github.com/ZSeven-W/openpencil",
    role: "AI-native design-as-code canvas",
    use: "Referencia para prompt to canvas, agent teams, MCP, CLI op e exportacao multi-plataforma."
  },
  {
    id: "opendesign-framework",
    name: "Open Design Framework",
    url: "https://github.com/opendesigndev/open-design-framework",
    role: "programmatic UI design data toolkit",
    use: "Referencia para leitura/manipulacao de dados de design por codigo."
  },
  {
    id: "open-generative-ui",
    name: "OpenGenerativeUI",
    url: "https://github.com/CopilotKit/OpenGenerativeUI",
    role: "sandboxed generative UI examples",
    use: "Referencia para renderizar HTML/SVG/graficos/mockups em iframe seguro."
  },
  {
    id: "shadcnspace",
    name: "Shadcn Space",
    url: "https://github.com/shadcnspace/shadcnspace",
    role: "blocks, components, templates and dashboard layouts",
    use: "Fonte de blocos e layouts editaveis para React/Tailwind/shadcn."
  },
  {
    id: "tailark-blocks",
    name: "Tailark Blocks",
    url: "https://github.com/tailark/blocks",
    role: "marketing blocks",
    use: "Fonte de secoes comerciais responsivas para landing pages."
  },
  {
    id: "flowbite",
    name: "Flowbite",
    url: "https://github.com/themesberg/flowbite",
    role: "Tailwind component library",
    use: "Fonte madura de componentes, icones, Figma/design-system e exemplos."
  },
  {
    id: "typeui",
    name: "TypeUI",
    url: "https://github.com/bergside/typeui",
    role: "DESIGN.md and SKILL.md design prompt packs",
    use: "Referencia direta para pacotes markdown de design skills e design systems."
  },
  {
    id: "onlook",
    name: "Onlook",
    url: "https://github.com/onlook-dev/onlook",
    role: "AI-first visual React editor",
    use: "Referencia para editar React visualmente com IA e fluxo designer/developer."
  },
  {
    id: "layout-prompter",
    name: "LayoutPrompter",
    url: "https://github.com/microsoft/LayoutGeneration/tree/main/LayoutPrompter",
    role: "layout generation research",
    use: "Referencia para serializacao, exemplos dinamicos e ranking de layouts."
  }
];

function nowIso() {
  return new Date().toISOString();
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readText(file, fallback = "") {
  try {
    return fs.readFileSync(file, "utf-8");
  } catch {
    return fallback;
  }
}

function readJson(file, fallback) {
  try {
    return JSON.parse(readText(file));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }
    const [rawKey, inlineValue] = token.slice(2).split("=", 2);
    const next = argv[index + 1];
    if (inlineValue !== undefined) {
      args[rawKey] = inlineValue;
    } else if (next && !next.startsWith("--")) {
      args[rawKey] = next;
      index += 1;
    } else {
      args[rawKey] = true;
    }
  }
  return args;
}

function parseEnv(text) {
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const divider = trimmed.indexOf("=");
    if (divider < 1) continue;
    env[trimmed.slice(0, divider)] = trimmed.slice(divider + 1);
  }
  return env;
}

function keyStatus(env, key) {
  const value = String(env[key] || "").trim();
  return { set: Boolean(value), length: value.length };
}

function parseYamlValue(text, dottedKey) {
  const parts = dottedKey.split(".");
  const lines = text.split(/\r?\n/);
  let current = [];

  for (const line of lines) {
    const match = line.match(/^(\s*)([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const indent = match[1].length;
    const key = match[2];
    const value = match[3].trim().replace(/^['"]|['"]$/g, "");
    current = current.filter((entry) => entry.indent < indent);
    current.push({ indent, key });
    const pathNow = current.map((entry) => entry.key).join(".");
    if (pathNow === dottedKey) return value;
  }

  return parts.length ? "" : "";
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function toList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeOrders(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.orders)) return payload.orders;
  return [];
}

function loadAgentRegistry() {
  const registry = readJson(path.join(ROOT_DIR, ".codex-agents", "registry.json"), {});
  const roles = Array.isArray(registry.roles) ? registry.roles : [];
  const designRoles = roles.filter((role) =>
    ["design", "pixel", "copy", "sales", "review"].includes(String(role.role || "").toLowerCase())
  );
  return {
    totalAgents: Number(registry.totalAgents || 0),
    designRoles,
    designAgentCount: designRoles.reduce((sum, role) => sum + Number(role.agents || 0), 0)
  };
}

function loadStatus() {
  const env = parseEnv(readText(HERMES_ENV_FILE));
  const config = readText(HERMES_CONFIG_FILE);
  const registry = loadAgentRegistry();
  const orders = normalizeOrders(readJson(ORDERS_FILE, []));

  return {
    schema: "projeto-codex.hermes-opendesign-desk.v1",
    generatedAt: nowIso(),
    project: {
      root: ROOT_DIR,
      promptAnchor: path.join(ROOT_DIR, "docs", "commercial", "czs-divulgue-open-design-master-prompt-2026-06-01.md")
    },
    hermes: {
      primary: {
        provider: parseYamlValue(config, "model.provider") || "openai-codex",
        model: parseYamlValue(config, "model.default") || "gpt-5.5",
        rule: "Codex decide, delega e sintetiza; workers pesquisam, rascunham e revisam."
      },
      web: {
        backend: parseYamlValue(config, "web.backend"),
        searchBackend: parseYamlValue(config, "web.search_backend"),
        extractBackend: parseYamlValue(config, "web.extract_backend")
      },
      keys: {
        GITHUB_TOKEN: keyStatus(env, "GITHUB_TOKEN"),
        GH_TOKEN: keyStatus(env, "GH_TOKEN"),
        OPENROUTER_API_KEY: keyStatus(env, "OPENROUTER_API_KEY"),
        FIRECRAWL_API_KEY: keyStatus(env, "FIRECRAWL_API_KEY"),
        EXA_API_KEY: keyStatus(env, "EXA_API_KEY"),
        TAVILY_API_KEY: keyStatus(env, "TAVILY_API_KEY"),
        FAL_KEY: keyStatus(env, "FAL_KEY")
      }
    },
    desk: {
      name: "OpenDesign Desk",
      purpose: "receber pedidos de design, buscar referencias, gerar opcoes e devolver artefatos auditaveis",
      status: "configured-with-existing-hermes-bridge",
      orders: orders.length,
      designAgentCount: registry.designAgentCount,
      designRoles: registry.designRoles,
      resources: GITHUB_RESOURCES.length
    },
    workflow: [
      "1. receber pedido atomico de design",
      "2. classificar tipo: landing, dashboard, card, social, game UI, documento visual ou versao navegavel",
      "3. buscar referencias no catalogo GitHub e web Hermes quando necessario",
      "4. Codex define direcao visual e restricoes",
      "5. workers geram opcoes, copy, layout, contraste e checklist",
      "6. Codex sintetiza e valida antes de tocar pagina publica",
      "7. entregar HTML/MD navegavel quando fizer sentido"
    ],
    resources: GITHUB_RESOURCES
  };
}

function renderStatusMarkdown(status) {
  const keys = Object.entries(status.hermes.keys)
    .map(([key, value]) => `- ${key}: ${value.set ? "configurada" : "pendente"}`)
    .join("\n");
  const roles = status.desk.designRoles.map((role) => `- ${role.role}: ${role.agents}`).join("\n");
  const resources = status.resources.map((item) => `- ${item.name}: ${item.role} (${item.url})`).join("\n");

  return [
    "# Hermes OpenDesign Desk",
    "",
    `Atualizado: ${status.generatedAt}`,
    "",
    "## Regra",
    "",
    status.hermes.primary.rule,
    "",
    "## Hermes",
    "",
    `- Modelo principal: ${status.hermes.primary.provider}/${status.hermes.primary.model}`,
    `- Web: busca=${status.hermes.web.searchBackend || "nao configurada"}; extracao=${status.hermes.web.extractBackend || "nao configurada"}`,
    "",
    "## Chaves",
    "",
    keys,
    "",
    "## Design Desk",
    "",
    `- Status: ${status.desk.status}`,
    `- Pedidos registrados: ${status.desk.orders}`,
    `- Agentes de design/copy/revisao disponiveis: ${status.desk.designAgentCount}`,
    roles,
    "",
    "## Catalogo GitHub",
    "",
    resources,
    "",
    "## Fluxo",
    "",
    ...status.workflow.map((item) => `- ${item}`),
    ""
  ].join("\n");
}

function writeStatus(status) {
  writeJson(STATUS_JSON, status);
  fs.writeFileSync(STATUS_MD, renderStatusMarkdown(status), "utf-8");
}

function ensureOrdersFile() {
  ensureDir(DATA_DIR);
  if (!fs.existsSync(ORDERS_FILE)) {
    writeJson(ORDERS_FILE, []);
  }
}

function addOrder(args) {
  ensureOrdersFile();
  const request = String(args.request || args.message || args.m || "").trim();
  if (!request) throw new Error('Use --request "pedido de design"');

  const createdAt = nowIso();
  const order = {
    id: `${createdAt.slice(0, 10)}-${slugify(request) || "opendesign-request"}`,
    createdAt,
    updatedAt: createdAt,
    status: "queued",
    source: "hermes-opendesign-bridge",
    request,
    kind: String(args.kind || "auto").trim(),
    destination: String(args.destination || "design-desk").trim(),
    tags: toList(args.tags),
    hierarchy: "ChatGPT/Codex -> Hermes -> OpenDesign Desk -> design/copy/review workers",
    primaryRule: "Codex e o diretor final; workers nao publicam sozinhos.",
    outputPreference: "HTML navegavel quando visual; Markdown compacto para especificacao ou catalogo."
  };

  const orders = normalizeOrders(readJson(ORDERS_FILE, []));
  orders.push(order);
  writeJson(ORDERS_FILE, orders);

  const requestMd = [
    "# OpenDesign Request",
    "",
    `Criado: ${order.createdAt}`,
    "",
    `Pedido: ${order.request}`,
    "",
    `Tipo: ${order.kind}`,
    `Destino: ${order.destination}`,
    "",
    "## Prompt Para Hermes",
    "",
    buildPrompt(order),
    ""
  ].join("\n");
  ensureDir(OUTPUT_DIR);
  fs.writeFileSync(LATEST_REQUEST_MD, requestMd, "utf-8");
  return order;
}

function buildPrompt(order = null) {
  const status = loadStatus();
  const requestLine = order ? `Pedido atual: ${order.request}` : "Pedido atual: use o pedido informado pelo usuario.";
  const resources = status.resources
    .map((item) => `- ${item.name}: ${item.role}; use para ${item.use}; url=${item.url}`)
    .join("\n");

  return [
    "Voce e o Hermes operando o OpenDesign Desk do Projeto Codex.",
    "Codex/openai-codex e a autoridade final. Modelos locais/cloud sao workers.",
    requestLine,
    "",
    "Fluxo obrigatorio:",
    "- entender o destino e o publico antes de gerar layout;",
    "- escolher 2 ou 3 referencias do catalogo GitHub abaixo;",
    "- gerar direcao visual, estrutura, copy curta e checklist de acessibilidade;",
    "- se for visual, preferir entregar HTML navegavel ou versao local revisavel;",
    "- se tocar CZS publico, respeitar regras locais e nao mexer na homepage sem ordem explicita;",
    "- Qwen fica apenas para codigo pequeno e revisado; nao vira diretor de design.",
    "",
    "Catalogo GitHub:",
    resources
  ].join("\n");
}

function printBrief() {
  const status = loadStatus();
  const lines = [
    "OpenDesign Desk pronto para pedidos via Hermes.",
    `Modelo diretor: ${status.hermes.primary.provider}/${status.hermes.primary.model}`,
    `Web Hermes: busca=${status.hermes.web.searchBackend}; extracao=${status.hermes.web.extractBackend}`,
    `Agentes design/copy/revisao: ${status.desk.designAgentCount}`,
    `Recursos GitHub catalogados: ${status.resources.length}`,
    "",
    buildPrompt()
  ];
  process.stdout.write(`${lines.join("\n")}\n`);
}

function printResources() {
  process.stdout.write(`${JSON.stringify(GITHUB_RESOURCES, null, 2)}\n`);
}

function printHelp() {
  process.stdout.write(`Hermes OpenDesign Bridge

Comandos:
  status       gera inventario JSON/MD
  brief        imprime prompt operacional para Hermes
  request      registra um pedido (--request "...")
  resources    lista catalogo GitHub curado

Arquivos:
  ${STATUS_JSON}
  ${STATUS_MD}
  ${ORDERS_FILE}
`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || "status";

  if (command === "help" || args.help) {
    printHelp();
    return;
  }

  if (command === "resources") {
    printResources();
    return;
  }

  if (command === "brief") {
    const status = loadStatus();
    writeStatus(status);
    printBrief();
    return;
  }

  if (command === "request") {
    const order = addOrder(args);
    const status = loadStatus();
    writeStatus(status);
    process.stdout.write(`${JSON.stringify({ ok: true, order, requestFile: LATEST_REQUEST_MD, statusFile: STATUS_JSON }, null, 2)}\n`);
    return;
  }

  const status = loadStatus();
  writeStatus(status);
  if (args.json) {
    process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
    return;
  }
  process.stdout.write(`${renderStatusMarkdown(status)}\n`);
}

main();
