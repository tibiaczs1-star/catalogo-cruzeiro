#!/usr/bin/env node
"use strict";

const { generateCompanion } = require("../core/companion");
const { syncProfiles, listProfiles, updateProfile } = require("../core/chrome-profiles");
const { generateDashboard } = require("../core/dashboard");
const { buildReport } = require("../core/doctor");
const { openRayX } = require("../core/open");
const { runCommand, startShell } = require("../core/shell");
const { renderStatus } = require("../core/status");

function printHelp() {
  process.stdout.write(`RayX local CLI

Uso:
  rayx status
  rayx doctor
  rayx shell
  rayx dashboard
  rayx companion
  rayx open dashboard|companion|all
  rayx profiles
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

function main(argv = process.argv.slice(2)) {
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

  if (["hermes", "ollama", "chrome"].includes(command)) {
    runCommand(`/${command}`);
    return;
  }

  process.stderr.write(`Comando desconhecido: ${command}\n\n`);
  printHelp();
  process.exitCode = 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  main
};
