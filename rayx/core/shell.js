#!/usr/bin/env node
"use strict";

const readline = require("node:readline");
const { getChromeBridgeStatus, renderChromeBridge } = require("../adapters/chrome");
const { getHermesStatus, renderHermesStatus } = require("../adapters/hermes");
const { renderBootResult, runBoot } = require("./boot");
const { scanCatalog } = require("./catalog");
const { listProfiles, syncProfiles } = require("./chrome-profiles");
const { generateDashboard } = require("./dashboard");
const { openDesktop } = require("./desktop");
const { buildReport } = require("./doctor");
const { openRayX } = require("./open");
const { runCycle } = require("./orchestrator");
const { renderStatus } = require("./status");

const COMMANDS = [
  ["/status", "Resumo local em portugues"],
  ["/doctor", "Diagnostico JSON completo"],
  ["/boot", "Executa boot operacional com etapas visiveis"],
  ["/catalog", "Cataloga CLIs, skills e prompts herdados"],
  ["/hermes", "Estado do Hermes local"],
  ["/ollama", "Modelos locais e politica"],
  ["/chrome", "Chrome e perfis detectados"],
  ["/chrome-bridge", "Estado da ponte Chrome/CDP"],
  ["/desktop", "Abre o app desktop RayX"],
  ["/cycle", "Roda um ciclo local do orquestrador"],
  ["/dashboard", "Gera dashboard HTML local"],
  ["/open", "Abre dashboard e companion"],
  ["/profiles", "Sincroniza apelidos/permissoes dos perfis Chrome"],
  ["/help", "Lista comandos"],
  ["/exit", "Sair"]
];

function printHeader() {
  process.stdout.write([
    "RAYX LOCAL SHELL",
    "",
    "local-first | Hermes + Codex + Ollama + Chrome",
    "Digite /help para comandos.",
    ""
  ].join("\n"));
}

function printHelp() {
  process.stdout.write(`${COMMANDS.map(([name, desc]) => `${name.padEnd(10)} ${desc}`).join("\n")}\n`);
}

function printHermes(report) {
  const status = report.hermes?.status || {};
  const gatewayRunning = String(status.gateway || "").toLowerCase().includes("running");
  const state = !report.hermes?.found ? "falhando" : gatewayRunning ? "ok" : "parcial";

  process.stdout.write([
    "Hermes",
    `- estado: ${state}`,
    `- CLI: ${report.hermes?.cliPath || "nao encontrado"}`,
    `- Desktop: ${report.hermes?.desktop?.found ? report.hermes.desktop.path : "nao encontrado"}`,
    `- provider: ${status.provider || "?"}`,
    `- modelo: ${status.model || "?"}`,
    `- gateway: ${status.gateway || "?"}`,
    `- jobs: ${status.jobs || "?"}`,
    `- sessoes: ${status.sessions || "?"}`,
    `- OpenAI Codex auth: ${status.codexAuth ? "ok" : "nao confirmado"}`
  ].join("\n") + "\n");
}

function printOllama(report) {
  const models = report.ollama?.models || [];

  process.stdout.write([
    "Ollama",
    `- estado: ${report.ollama?.found ? "ok" : "falhando"}`,
    `- versao: ${report.ollama?.version || "?"}`,
    `- modelos: ${models.length}`,
    ...models.map((model) => `  - ${model.name} (${model.size})`),
    `- modelos locais quentes permitidos: ${report.recommendation?.policy?.keepWarmLocalModels ?? "?"}`
  ].join("\n") + "\n");
}

function printChrome(report) {
  const profiles = report.chrome?.profiles || [];

  process.stdout.write([
    "Chrome",
    `- estado: ${report.chrome?.found ? "ok" : "falhando"}`,
    `- no PATH: ${report.chrome?.inPath ? "sim" : "nao"}`,
    `- exe: ${report.chrome?.exePath || "nao encontrado"}`,
    `- user data: ${report.chrome?.userData || "?"}`,
    `- perfis: ${profiles.length}`,
    ...profiles.map((profile) => `  - ${profile.name}`)
  ].join("\n") + "\n");
}

function normalizeCommand(input) {
  const command = String(input || "").trim();
  if (!command) return "";
  return command.startsWith("/") ? command : `/${command}`;
}

function runCommand(input) {
  const command = normalizeCommand(input);
  if (!command) return false;

  if (command === "/help") {
    printHelp();
    return false;
  }

  if (command === "/exit" || command === "/quit") {
    return true;
  }

  if (command === "/desktop") {
    const result = openDesktop();
    process.stdout.write(`RayX desktop aberto. PID ${result.pid}\n`);
    return false;
  }

  if (command === "/cycle") {
    const state = runCycle();
    const cycle = state.lastCycle || {};
    process.stdout.write(`Ciclo concluido: ${cycle.adapters?.ready ?? 0} ready, ${cycle.adapters?.partial ?? 0} partial, ${cycle.adapters?.missing ?? 0} missing\n`);
    return false;
  }

  if (command === "/boot") {
    const result = runBoot({
      onProgress: (event) => {
        if (event.type === "start") process.stdout.write(`> ${event.step.id}: ${event.step.title}\n`);
        if (event.type === "finish") process.stdout.write(`  ${event.step.ok ? "OK" : "NO"} ${event.step.summary}\n`);
      }
    });
    process.stdout.write(`${renderBootResult(result)}\n`);
    return false;
  }

  if (command === "/catalog") {
    const catalog = scanCatalog();
    const found = catalog.tools.filter((tool) => tool.found).length;
    process.stdout.write(`Catalogo RayX: ${found}/${catalog.tools.length} ferramentas, ${catalog.skills.total} skills, ${catalog.prompts.total} prompts.\n`);
    return false;
  }

  if (command === "/hermes") {
    process.stdout.write(`${renderHermesStatus(getHermesStatus())}\n`);
    return false;
  }

  if (command === "/chrome-bridge") {
    process.stdout.write(`${renderChromeBridge(getChromeBridgeStatus())}\n`);
    return false;
  }

  const report = buildReport();

  if (command === "/status") {
    process.stdout.write(`${renderStatus(report)}\n`);
    return false;
  }

  if (command === "/doctor") {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return false;
  }

  if (command === "/hermes") {
    printHermes(report);
    return false;
  }

  if (command === "/ollama") {
    printOllama(report);
    return false;
  }

  if (command === "/chrome") {
    printChrome(report);
    return false;
  }

  if (command === "/profiles" || command === "/chrome-profiles") {
    const result = syncProfiles();
    process.stdout.write(`${listProfiles(result.payload)}\n\nArquivo: ${result.file}\n`);
    return false;
  }

  if (command === "/dashboard") {
    const result = generateDashboard();
    process.stdout.write(`Dashboard gerado:\n${result.file}\n`);
    return false;
  }

  if (command === "/open") {
    const results = openRayX("all");
    for (const result of results) {
      process.stdout.write(`${result.target} aberto: ${result.file}\n`);
    }
    return false;
  }

  process.stdout.write(`Comando desconhecido: ${command}\n`);
  printHelp();
  return false;
}

function parseArgs(argv) {
  const args = { command: null, once: false };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--command") {
      args.command = argv[index + 1] || null;
      index += 1;
      continue;
    }

    if (token === "--once") {
      args.once = true;
      continue;
    }
  }

  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  startShell(args);
}

function startShell(args = { command: null, once: false }) {
  printHeader();

  if (args.command || args.once) {
    runCommand(args.command || "/status");
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "rayx> "
  });

  rl.prompt();
  rl.on("line", (line) => {
    const shouldExit = runCommand(line);
    if (shouldExit) {
      rl.close();
      return;
    }

    rl.prompt();
  });
}

if (require.main === module) {
  main();
}

module.exports = {
  runCommand,
  startShell
};
