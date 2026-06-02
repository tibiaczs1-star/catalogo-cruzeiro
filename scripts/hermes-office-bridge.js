#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const HERMES_HOME = path.join(process.env.USERPROFILE || "C:\\Users\\junio", ".hermes");
const HERMES_ENV_FILE = path.join(HERMES_HOME, ".env");
const HERMES_CONFIG_FILE = path.join(HERMES_HOME, "config.yaml");
const HERMES_EXE = path.join(
  process.env.LOCALAPPDATA || "C:\\Users\\junio\\AppData\\Local",
  "hermes",
  "hermes-agent",
  ".venv",
  "Scripts",
  "hermes.exe"
);
const HERMES_BIN = path.join(process.env.LOCALAPPDATA || "C:\\Users\\junio\\AppData\\Local", "hermes", "bin");
const OUTPUT_DIR = path.join(ROOT_DIR, ".codex-temp", "hermes-office");
const STATUS_JSON = path.join(OUTPUT_DIR, "latest-status.json");
const STATUS_MD = path.join(OUTPUT_DIR, "latest-status.md");

function nowIso() {
  return new Date().toISOString();
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
  fs.mkdirSync(path.dirname(file), { recursive: true });
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

function run(command, args, options = {}) {
  const hermesEnv = parseEnv(readText(HERMES_ENV_FILE));
  const childPath = [HERMES_BIN, hermesEnv.PATH, process.env.PATH || ""].filter(Boolean).join(path.delimiter);
  const result = spawnSync(command, args, {
    cwd: options.cwd || ROOT_DIR,
    encoding: "utf-8",
    windowsHide: true,
    timeout: options.timeout || 60000,
    env: {
      ...process.env,
      ...hermesEnv,
      PATH: childPath,
      ...(options.env || {})
    }
  });

  return {
    command: [command, ...args].join(" "),
    ok: result.status === 0,
    status: result.status,
    stdout: String(result.stdout || "").trim(),
    stderr: String(result.stderr || "").trim(),
    error: result.error ? result.error.message : ""
  };
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

  return "";
}

function normalizeOrders(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.orders)) return payload.orders;
  return [];
}

function loadStatus() {
  const env = parseEnv(readText(HERMES_ENV_FILE));
  const config = readText(HERMES_CONFIG_FILE);
  const registry = readJson(path.join(ROOT_DIR, ".codex-agents", "registry.json"), {});
  const codexOrders = normalizeOrders(readJson(path.join(ROOT_DIR, ".codex-memory", "orders.json"), []));
  const officeOrders = readJson(path.join(ROOT_DIR, "data", "office-orders.json"), []);
  const latestRun = readJson(path.join(ROOT_DIR, ".codex-temp", "real-agents", "latest-run.json"), null);
  const renderYaml = readText(path.join(ROOT_DIR, "render.yaml"));
  const renderCli = run("render", ["--version"], { timeout: 15000 });
  const renderApiKey = keyStatus(env, "RENDER_API_KEY").set;
  const hermesVersion = fs.existsSync(HERMES_EXE) ? run(HERMES_EXE, ["--version"], { timeout: 20000 }) : null;
  const agentFiles = fs.existsSync(path.join(ROOT_DIR, ".codex-agents", "agents"))
    ? fs.readdirSync(path.join(ROOT_DIR, ".codex-agents", "agents")).filter((file) => file.endsWith(".md"))
    : [];

  return {
    schema: "projeto-codex.hermes-office-bridge.v1",
    generatedAt: nowIso(),
    project: {
      root: ROOT_DIR,
      siteUrl: (renderYaml.match(/SITE_URL\s*\n\s*value:\s*(\S+)/) || [])[1] || "https://catalogo-cruzeiro-web.onrender.com",
      renderService: (renderYaml.match(/name:\s*([^\r\n]+)/) || [])[1] || "catalogo-cruzeiro-web"
    },
    hermes: {
      exe: HERMES_EXE,
      exists: fs.existsSync(HERMES_EXE),
      version: hermesVersion ? hermesVersion.stdout || hermesVersion.stderr || hermesVersion.error : "",
      primaryRule: "openai-codex/gpt-5.5 decide, delega e sintetiza; modelos locais/cloud sao workers.",
      web: {
        backend: parseYamlValue(config, "web.backend"),
        searchBackend: parseYamlValue(config, "web.search_backend"),
        extractBackend: parseYamlValue(config, "web.extract_backend")
      },
      keys: {
        FIRECRAWL_API_KEY: keyStatus(env, "FIRECRAWL_API_KEY"),
        EXA_API_KEY: keyStatus(env, "EXA_API_KEY"),
        TAVILY_API_KEY: keyStatus(env, "TAVILY_API_KEY"),
        GEMINI_API_KEY: keyStatus(env, "GEMINI_API_KEY"),
        FAL_KEY: keyStatus(env, "FAL_KEY"),
        OPENROUTER_API_KEY: keyStatus(env, "OPENROUTER_API_KEY"),
        XAI_API_KEY: keyStatus(env, "XAI_API_KEY"),
        RENDER_API_KEY: keyStatus(env, "RENDER_API_KEY"),
        GITHUB_TOKEN: keyStatus(env, "GITHUB_TOKEN"),
        GH_TOKEN: keyStatus(env, "GH_TOKEN")
      }
    },
    render: {
      cliAvailable: renderCli.ok,
      cliOutput: renderCli.ok ? renderCli.stdout : renderCli.stderr || renderCli.error || renderCli.stdout,
      apiKeySet: renderApiKey,
      apiBaseUrl: "https://api.render.com/v1",
      canOperateRemote: renderApiKey,
      cliNeedsInteractiveLogin: renderCli.ok && renderApiKey
    },
    offices: {
      registryTotal: Number(registry.totalAgents || 0),
      fileTotal: agentFiles.length,
      offices: registry.offices || [],
      roles: registry.roles || []
    },
    orders: {
      codexMemoryCount: codexOrders.length,
      officeOrderCount: Array.isArray(officeOrders) ? officeOrders.length : 0,
      latestCodexMemory: codexOrders[0] || codexOrders[codexOrders.length - 1] || null,
      latestOfficeOrder: Array.isArray(officeOrders) ? officeOrders[officeOrders.length - 1] || null : null
    },
    latestRun: latestRun
      ? {
          generatedAt: latestRun.generatedAt || latestRun.updatedAt || null,
          summary: latestRun.summary || null,
          outputFiles: [
            path.join(ROOT_DIR, ".codex-temp", "real-agents", "latest-run.json"),
            path.join(ROOT_DIR, ".codex-temp", "real-agents", "latest-run.md")
          ]
        }
      : null,
    smartFlows: [
      { id: "status", command: "npm run hermes:office:status", purpose: "inventario local sem gastar IA" },
      { id: "brief", command: "npm run hermes:office:brief", purpose: "brief operacional para Codex decidir" },
      { id: "dispatch", command: "npm run hermes:office:dispatch -- --message \"ordem\"", purpose: "registra ordem e aciona agentes locais" },
      { id: "run", command: "npm run hermes:office:run", purpose: "roda a rotina dos escritorios reais" },
      { id: "web", command: "Hermes web: Exa busca, Firecrawl extrai, Tavily fallback manual", purpose: "pesquisa online avançada" }
    ]
  };
}

function renderMarkdown(status) {
  const keys = Object.entries(status.hermes.keys)
    .map(([key, value]) => `- ${key}: ${value.set ? "configurada" : "pendente"}`)
    .join("\n");
  const offices = status.offices.offices
    .map((office) => `- ${office.office}: ${office.agents} agentes`)
    .join("\n");

  return [
    "# Hermes Office Bridge",
    "",
    `Atualizado: ${status.generatedAt}`,
    "",
    "## Decisao Central",
    "",
    status.hermes.primaryRule,
    "",
    "## Web Inteligente",
    "",
    `- Busca: ${status.hermes.web.searchBackend || "nao configurada"}`,
    `- Extracao: ${status.hermes.web.extractBackend || "nao configurada"}`,
    `- Backend geral: ${status.hermes.web.backend || "nao configurado"}`,
    "",
    "## Chaves",
    "",
    keys,
    "",
    "## Escritorios",
    "",
    `- Total no registro: ${status.offices.registryTotal}`,
    `- Arquivos de agentes: ${status.offices.fileTotal}`,
    offices,
    "",
    "## Render",
    "",
    `- Servico: ${status.project.renderService}`,
    `- URL: ${status.project.siteUrl}`,
    `- CLI Render: ${status.render.cliAvailable ? "ok" : "pendente"}`,
    `- RENDER_API_KEY: ${status.render.apiKeySet ? "configurada" : "pendente"}`,
    "",
    "## Fluxos",
    "",
    ...status.smartFlows.map((flow) => `- ${flow.id}: ${flow.command} - ${flow.purpose}`),
    ""
  ].join("\n");
}

function writeStatus(status) {
  writeJson(STATUS_JSON, status);
  fs.writeFileSync(STATUS_MD, renderMarkdown(status), "utf-8");
}

function addOfficeOrder(message) {
  const file = path.join(ROOT_DIR, "data", "office-orders.json");
  const orders = readJson(file, []);
  const status = loadStatus();
  const order = {
    id: `hermes-${Date.now().toString(36)}`,
    from: "Hermes/Codex principal",
    to: "Codex CEO + escritorios reais",
    priority: "alta",
    message,
    ceoReply: "Ordem recebida pelo bridge Hermes. Codex decide, agentes locais executam e a rodada gera artefatos auditaveis.",
    status: "queued-by-hermes-bridge",
    hierarchy: "ChatGPT/Codex -> Hermes -> Codex CEO -> escritorios/agentes locais -> Render quando autorizado",
    createdAt: nowIso(),
    assignedAgents: Number(status.offices.registryTotal || status.offices.fileTotal || 0),
    assignments: []
  };
  const next = Array.isArray(orders) ? [...orders, order] : [order];
  writeJson(file, next);
  return order;
}

function runAgents() {
  return run(process.execPath, [path.join(ROOT_DIR, "scripts", "real-agents-runtime.js")], {
    cwd: ROOT_DIR,
    timeout: 120000
  });
}

function buildBrief(status) {
  return [
    "Codex principal deve receber tudo, decidir e delegar.",
    `Projeto: ${status.project.root}`,
    `Site Render: ${status.project.siteUrl}`,
    `Agentes locais: ${status.offices.registryTotal || status.offices.fileTotal}`,
    `Ordens Codex: ${status.orders.codexMemoryCount}; ordens de escritorio: ${status.orders.officeOrderCount}`,
    `Web: busca=${status.hermes.web.searchBackend}; extracao=${status.hermes.web.extractBackend}; backend=${status.hermes.web.backend}`,
    `MoA/OpenRouter: ${status.hermes.keys.OPENROUTER_API_KEY.set ? "operacional" : "bloqueado por chave"}`,
    `Render remoto: ${status.render.canOperateRemote ? "operacional" : "bloqueado por CLI/chave"}`,
    `GitHub: ${status.hermes.keys.GITHUB_TOKEN.set || status.hermes.keys.GH_TOKEN.set ? "operacional" : "bloqueado por token"}`,
    "Use Exa para descoberta, Firecrawl para pagina completa, Tavily como fallback, Gemma/MiniMax/Qwen/Llama como workers, e Codex como decisao final."
  ].join("\n");
}

function printHelp() {
  process.stdout.write(`Hermes Office Bridge

Comandos:
  status       gera inventario JSON/MD
  brief        imprime brief operacional para Hermes/Codex
  dispatch     registra ordem nos escritorios (--message "...") e opcionalmente roda --run
  run          roda agentes locais
  render       mostra status Render/local remoto

Arquivos:
  ${STATUS_JSON}
  ${STATUS_MD}
`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || "status";

  if (command === "help" || args.help) {
    printHelp();
    return;
  }

  if (command === "run") {
    const result = runAgents();
    const status = loadStatus();
    writeStatus(status);
    process.stdout.write(`${JSON.stringify({ ok: result.ok, run: result, statusFile: STATUS_JSON }, null, 2)}\n`);
    process.exitCode = result.ok ? 0 : 1;
    return;
  }

  if (command === "dispatch") {
    const message = String(args.message || args.m || "").trim();
    if (!message) throw new Error('Use --message "ordem"');
    const order = addOfficeOrder(message);
    const runResult = args.run ? runAgents() : null;
    const status = loadStatus();
    writeStatus(status);
    process.stdout.write(`${JSON.stringify({ ok: true, order, run: runResult, statusFile: STATUS_JSON }, null, 2)}\n`);
    return;
  }

  const status = loadStatus();
  writeStatus(status);

  if (command === "brief") {
    process.stdout.write(`${buildBrief(status)}\n\nArquivos: ${STATUS_JSON} | ${STATUS_MD}\n`);
    return;
  }

  if (command === "render") {
    process.stdout.write(`${JSON.stringify({ render: status.render, project: status.project }, null, 2)}\n`);
    return;
  }

  if (args.json) {
    process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
    return;
  }

  process.stdout.write(`${renderMarkdown(status)}\n`);
}

main();
