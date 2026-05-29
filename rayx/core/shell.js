#!/usr/bin/env node
"use strict";

const readline = require("node:readline");
const { listProfiles, syncProfiles } = require("./chrome-profiles");
const { generateDashboard } = require("./dashboard");
const { buildReport } = require("./doctor");
const { renderStatus } = require("./status");

const COMMANDS = [
  ["/status", "Resumo local em portugues"],
  ["/doctor", "Diagnostico JSON completo"],
  ["/hermes", "Estado do Hermes local"],
  ["/ollama", "Modelos locais e politica"],
  ["/chrome", "Chrome e perfis detectados"],
  ["/dashboard", "Gera dashboard HTML local"],
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
  runCommand
};
