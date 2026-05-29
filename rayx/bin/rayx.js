#!/usr/bin/env node
"use strict";

const { generateCompanion } = require("../core/companion");
const { getChromeBridgeStatus, launchChromeBridge, renderChromeBridge } = require("../adapters/chrome");
const { getHermesStatus, openHermesDesktop, renderHermesStatus } = require("../adapters/hermes");
const { renderBootResult, runBoot } = require("../core/boot");
const { askRayX, startChat } = require("../core/chat");
const { scanCatalog } = require("../core/catalog");
const { syncProfiles, listProfiles, trustProfiles, updateProfile } = require("../core/chrome-profiles");
const { generateDashboard } = require("../core/dashboard");
const { checkDesktop, openDesktop } = require("../core/desktop");
const { buildReport } = require("../core/doctor");
const { openRayX } = require("../core/open");
const { getOperationalState, runCycle } = require("../core/orchestrator");
const { renderMissionResult, runMission } = require("../core/mission");
const { runCommand, startShell } = require("../core/shell");
const { renderStatus } = require("../core/status");

function printHelp() {
  process.stdout.write(`RayX local CLI

Uso:
  rayx status
  rayx doctor
  rayx desktop
  rayx boot
  rayx chat "sua missao"
  rayx mission "sua missao"
  rayx catalog
  rayx orchestrator [cycle]
  rayx hermes status|open|logs
  rayx chrome-bridge status|launch|tabs
  rayx shell
  rayx dashboard
  rayx companion
  rayx open dashboard|companion|all
  rayx profiles
  rayx profiles trust-local --permission allow|observe
  rayx profiles set <name> --alias <alias> --permission ask|allow|deny|observe --purpose <texto>

Atalhos:
  rayx hermes
  rayx ollama
  rayx chrome
`);
}

function parseNamedArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    args[token.slice(2)] = argv[index + 1] || "";
    index += 1;
  }

  return args;
}

async function main(argv = process.argv.slice(2)) {
  const [command, subcommand, ...rest] = argv;

  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "status") {
    process.stdout.write(`${renderStatus(buildReport())}\n`);
    return;
  }

  if (command === "doctor") {
    process.stdout.write(`${JSON.stringify(buildReport(), null, 2)}\n`);
    return;
  }

  if (command === "desktop") {
    if (argv.includes("--check") || argv.includes("--dry-run")) {
      process.stdout.write(`${JSON.stringify(checkDesktop(), null, 2)}\n`);
      return;
    }

    const result = openDesktop({
      wait: argv.includes("--wait"),
      dev: argv.includes("--dev")
    });
    process.stdout.write(`RayX desktop aberto. PID ${result.pid}\n`);
    return;
  }

  if (command === "boot") {
    const json = argv.includes("--json");
    const result = runBoot({
      onProgress: json
        ? null
        : (event) => {
            if (event.type === "start") process.stdout.write(`> ${event.step.id}: ${event.step.title}\n`);
            if (event.type === "finish") process.stdout.write(`  ${event.step.ok ? "OK" : "NO"} ${event.step.summary}\n`);
          }
    });
    process.stdout.write(json ? `${JSON.stringify(result, null, 2)}\n` : `${renderBootResult(result)}\n`);
    return;
  }

  if (command === "mission") {
    const message = argv.slice(1).filter((arg) => arg !== "--json" && arg !== "--no-llm").join(" ");
    const result = await runMission(message, { skipLlm: argv.includes("--no-llm") });
    process.stdout.write(argv.includes("--json") ? `${JSON.stringify(result, null, 2)}\n` : `${renderMissionResult(result)}\n`);
    return;
  }

  if (command === "chat") {
    const message = argv.slice(1).filter((arg) => arg !== "--json" && arg !== "--no-llm").join(" ");
    if (!message) {
      await startChat();
      return;
    }
    const turn = await askRayX(message, { skipLlm: argv.includes("--no-llm") });
    process.stdout.write(argv.includes("--json") ? `${JSON.stringify(turn, null, 2)}\n` : `${turn.answer}\n`);
    return;
  }

  if (command === "catalog") {
    process.stdout.write(`${JSON.stringify(scanCatalog(), null, 2)}\n`);
    return;
  }

  if (command === "orchestrator") {
    const payload = subcommand === "cycle" ? runCycle() : getOperationalState();
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  if (command === "hermes") {
    if (subcommand === "open") {
      process.stdout.write(`${JSON.stringify(openHermesDesktop(), null, 2)}\n`);
      return;
    }

    const status = getHermesStatus();
    if (subcommand === "logs") {
      process.stdout.write(`${JSON.stringify(status.logs, null, 2)}\n`);
      return;
    }

    if (argv.includes("--json")) {
      process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
      return;
    }

    process.stdout.write(`${renderHermesStatus(status)}\n`);
    return;
  }

  if (command === "chrome-bridge") {
    const named = parseNamedArgs(rest);
    const options = {
      profile: named.profile,
      port: named.port ? Number(named.port) : undefined,
      url: named.url
    };

    if (subcommand === "launch") {
      process.stdout.write(`${JSON.stringify(launchChromeBridge(options), null, 2)}\n`);
      return;
    }

    const status = getChromeBridgeStatus(options);
    if (subcommand === "tabs") {
      process.stdout.write(`${JSON.stringify(status.tabs, null, 2)}\n`);
      return;
    }

    if (argv.includes("--json")) {
      process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
      return;
    }

    process.stdout.write(`${renderChromeBridge(status)}\n`);
    return;
  }

  if (command === "shell") {
    startShell({ command: null, once: false });
    return;
  }

  if (command === "dashboard") {
    const result = generateDashboard();
    process.stdout.write(`Dashboard gerado:\n${result.file}\n`);
    return;
  }

  if (command === "companion") {
    const result = generateCompanion();
    process.stdout.write(`Companion gerado:\n${result.file}\n`);
    return;
  }

  if (command === "open") {
    const named = parseNamedArgs(rest);
    const results = openRayX(subcommand || "dashboard", {
      dryRun: argv.includes("--dry-run")
    });

    if (named.json !== undefined || argv.includes("--json")) {
      process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
      return;
    }

    for (const result of results) {
      const verb = result.opened ? "aberto" : "preparado";
      process.stdout.write(`${result.target} ${verb}: ${result.file}\n`);
    }
    return;
  }

  if (command === "profiles") {
    if (subcommand === "trust-local") {
      const named = parseNamedArgs(rest);
      const result = trustProfiles({
        permission: named.permission || "allow",
        purpose: named.purpose,
        notes: named.notes
      });
      process.stdout.write(`${result.payload.profiles.length} perfis atualizados para permissao=${result.permission}\n\nArquivo: ${result.file}\n`);
      return;
    }

    if (subcommand === "set") {
      const name = rest[0] || "";
      const named = parseNamedArgs(rest.slice(1));
      const result = updateProfile({
        set: name,
        alias: named.alias,
        permission: named.permission,
        purpose: named.purpose,
        notes: named.notes
      });
      process.stdout.write(`Perfil atualizado: ${result.profile.name} alias=${result.profile.alias} permissao=${result.profile.permission}\n`);
      return;
    }

    const result = syncProfiles();
    process.stdout.write(`${listProfiles(result.payload)}\n\nArquivo: ${result.file}\n`);
    return;
  }

  if (["ollama", "chrome"].includes(command)) {
    runCommand(`/${command}`);
    return;
  }

  process.stderr.write(`Comando desconhecido: ${command}\n\n`);
  printHelp();
  process.exitCode = 1;
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  main
};
