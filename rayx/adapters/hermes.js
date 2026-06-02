#!/usr/bin/env node
"use strict";

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { buildReport } = require("../core/doctor");

function nowIso() {
  return new Date().toISOString();
}

function candidateLogDirs() {
  const local = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
  const roaming = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");

  return [
    path.join(local, "hermes", "logs"),
    path.join(local, "Hermes", "logs"),
    path.join(roaming, "hermes", "logs"),
    path.join(roaming, "Hermes", "logs")
  ];
}

function listLogFiles(limit = 12) {
  const files = [];

  for (const dir of candidateLogDirs()) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const fullPath = path.join(dir, entry.name);
      const stat = fs.statSync(fullPath);
      files.push({
        name: entry.name,
        path: fullPath,
        sizeBytes: stat.size,
        updatedAt: stat.mtime.toISOString()
      });
    }
  }

  return files
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, limit);
}

function getHermesStatus(options = {}) {
  const report = options.report || buildReport();
  const hermes = report.hermes || {};
  const gateway = String(hermes.status?.gateway || "").toLowerCase();
  const ready = Boolean(hermes.found && gateway.includes("running"));
  const partial = Boolean(hermes.found && !ready);
  const logs = listLogFiles();

  return {
    schema: "rayx.hermes.adapter.v1",
    generatedAt: nowIso(),
    found: Boolean(hermes.found || hermes.desktop?.found),
    ready,
    status: ready ? "ready" : partial ? "partial" : "missing",
    cliPath: hermes.cliPath || null,
    desktopPath: hermes.desktop?.path || null,
    desktopFound: Boolean(hermes.desktop?.found),
    provider: hermes.status?.provider || null,
    model: hermes.status?.model || null,
    gateway: hermes.status?.gateway || null,
    codexAuth: Boolean(hermes.status?.codexAuth),
    logs,
    actions: [
      {
        id: "status",
        title: "Ler status Hermes",
        command: "rayx hermes status",
        available: Boolean(hermes.found)
      },
      {
        id: "open-desktop",
        title: "Abrir Hermes Desktop",
        command: "rayx hermes open",
        available: Boolean(hermes.desktop?.found)
      },
      {
        id: "logs",
        title: "Listar logs Hermes",
        command: "rayx hermes logs",
        available: logs.length > 0
      }
    ]
  };
}

function openHermesDesktop(options = {}) {
  const status = getHermesStatus(options);

  if (!status.desktopFound || !status.desktopPath) {
    throw new Error("Hermes Desktop nao encontrado.");
  }

  const child = spawn(status.desktopPath, [], {
    cwd: path.dirname(status.desktopPath),
    detached: true,
    stdio: "ignore",
    windowsHide: false
  });
  child.unref();

  return {
    opened: true,
    pid: child.pid,
    path: status.desktopPath
  };
}

function renderHermesStatus(status) {
  const lines = [
    "RayX Hermes Adapter",
    "",
    `estado: ${status.status}`,
    `cli: ${status.cliPath || "nao encontrado"}`,
    `desktop: ${status.desktopFound ? status.desktopPath : "nao encontrado"}`,
    `provider: ${status.provider || "?"}`,
    `modelo: ${status.model || "?"}`,
    `gateway: ${status.gateway || "?"}`,
    `codex auth: ${status.codexAuth ? "ok" : "nao confirmado"}`,
    `logs: ${status.logs.length}`
  ];

  return lines.join("\n");
}

function main() {
  const command = process.argv[2] || "status";

  if (command === "open") {
    process.stdout.write(`${JSON.stringify(openHermesDesktop(), null, 2)}\n`);
    return;
  }

  const status = getHermesStatus();

  if (command === "logs") {
    process.stdout.write(`${JSON.stringify(status.logs, null, 2)}\n`);
    return;
  }

  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
    return;
  }

  process.stdout.write(`${renderHermesStatus(status)}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  getHermesStatus,
  listLogFiles,
  openHermesDesktop,
  renderHermesStatus
};
