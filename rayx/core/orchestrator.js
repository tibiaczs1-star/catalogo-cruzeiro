#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { getChromeBridgeStatus } = require("../adapters/chrome");
const { getHermesStatus } = require("../adapters/hermes");
const { syncProfiles } = require("./chrome-profiles");
const { scanCatalog } = require("./catalog");
const { buildReport } = require("./doctor");

function rayxStateDir() {
  const base = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
  return path.join(base, "RayX", "state");
}

function statePath() {
  return path.join(rayxStateDir(), "orchestrator-state.json");
}

function nowIso() {
  return new Date().toISOString();
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(statePath(), "utf8"));
  } catch {
    return {
      schema: "rayx.orchestrator.v1",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      mode: "trabalho",
      tasks: [],
      events: [],
      cycles: []
    };
  }
}

function writeState(state) {
  state.updatedAt = nowIso();
  fs.mkdirSync(rayxStateDir(), { recursive: true });
  fs.writeFileSync(statePath(), `${JSON.stringify(state, null, 2)}\n`, "utf8");
  return state;
}

function pushEvent(state, type, message, data = {}) {
  state.events.unshift({
    id: `evt_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    at: nowIso(),
    type,
    message,
    data
  });
  state.events = state.events.slice(0, 80);
}

function adapterStatus(report, profiles) {
  const hermesGateway = String(report.hermes?.status?.gateway || "").toLowerCase();
  const chromeAllowed = (profiles.profiles || []).filter((profile) => profile.permission === "allow").length;
  const chromeObserved = (profiles.profiles || []).filter((profile) => profile.permission === "observe").length;

  return [
    {
      id: "codex",
      name: "Codex",
      role: "primary intelligence",
      status: report.codex?.found ? "ready" : "missing",
      detail: report.codex?.version || "not detected"
    },
    {
      id: "hermes",
      name: "Hermes",
      role: "legacy agent adapter",
      status: report.hermes?.found ? (hermesGateway.includes("running") ? "ready" : "partial") : "missing",
      detail: `${report.hermes?.status?.provider || "?"} / ${report.hermes?.status?.model || "?"}`
    },
    {
      id: "ollama",
      name: "Ollama",
      role: "local fallback",
      status: report.ollama?.found && report.ollama.models?.length ? "ready" : "partial",
      detail: `${report.ollama?.models?.length || 0} modelos locais`
    },
    {
      id: "chrome",
      name: "Chrome",
      role: "browser action surface",
      status: report.chrome?.found ? "ready" : "missing",
      detail: `${report.chrome?.profileCount || 0} perfis, ${chromeAllowed} allow, ${chromeObserved} observe`
    },
    {
      id: "cli-catalog",
      name: "CLI Catalog",
      role: "external workers",
      status: "planned",
      detail: "OpenCode, Kilo, Kiro, FreeBuff entram por benchmark"
    }
  ];
}

function defaultWorkers(report) {
  const mode = report.recommendation?.mode || "trabalho";
  const localLimit = report.recommendation?.policy?.localHeavyConcurrency || 1;
  const cloudLimit = report.recommendation?.policy?.cloudConcurrency || 3;

  return [
    {
      id: "orchestrator",
      name: "Orquestrador",
      lane: "core",
      status: "awake",
      capacity: 1,
      current: "classificar, priorizar e dividir tarefas"
    },
    {
      id: "codex-primary",
      name: "Codex Primary",
      lane: "cloud",
      status: report.codex?.found ? "ready" : "missing",
      capacity: cloudLimit,
      current: "execucao e revisao principal"
    },
    {
      id: "hermes-adapter",
      name: "Hermes Adapter",
      lane: "legacy",
      status: report.hermes?.found ? "ready" : "missing",
      capacity: 1,
      current: "status, doctor, logs e start/stop"
    },
    {
      id: "ollama-local",
      name: "Ollama Local",
      lane: "local",
      status: report.ollama?.found ? "ready" : "missing",
      capacity: localLimit,
      current: "fallback offline e helpers pequenos"
    },
    {
      id: "chrome-surface",
      name: "Chrome Surface",
      lane: "browser",
      status: report.chrome?.found ? "ready" : "missing",
      capacity: 1,
      current: "perfis, CDP e observacao"
    }
  ].map((worker) => ({ ...worker, mode }));
}

function seedTasks(state) {
  if (state.tasks.length) return;

  state.tasks.push(
    {
      id: "task_hermes_adapter",
      title: "Operar adaptador Hermes",
      status: "ready",
      priority: "P0",
      lane: "legacy",
      detail: "status, desktop e logs via rayx hermes"
    },
    {
      id: "task_chrome_bridge",
      title: "Liberar ponte Chrome/CDP",
      status: "ready",
      priority: "P1",
      lane: "browser",
      detail: "perfis com permissao allow e listagem de abas CDP"
    },
    {
      id: "task_boot_catalog",
      title: "Boot e catalogo funcional",
      status: "planned",
      priority: "P2",
      lane: "core",
      detail: "rayx boot e rayx catalog com resultados visiveis"
    }
  );
}

function getOperationalState() {
  const report = buildReport();
  const profileResult = syncProfiles(report);
  const profiles = profileResult.payload;
  const catalog = scanCatalog({ report });
  const hermesAdapter = getHermesStatus({ report });
  const chromeBridge = getChromeBridgeStatus({ report, profileResult });
  const state = readState();
  seedTasks(state);
  state.mode = report.recommendation?.mode || state.mode || "trabalho";
  writeState(state);

  return {
    schema: "rayx.operational.v1",
    generatedAt: nowIso(),
    statePath: statePath(),
    mode: state.mode,
    report,
    profiles,
    catalog: {
      toolsFound: catalog.tools.filter((tool) => tool.found).length,
      toolsTotal: catalog.tools.length,
      skills: catalog.skills.total,
      prompts: catalog.prompts.total,
      groups: catalog.groups
    },
    hermesAdapter,
    chromeBridge: {
      found: chromeBridge.found,
      chromeExePath: chromeBridge.chromeExePath,
      remoteDebuggingPort: chromeBridge.remoteDebuggingPort,
      cdpReachable: chromeBridge.cdpReachable,
      tabs: chromeBridge.tabs,
      policy: chromeBridge.policy,
      actions: chromeBridge.actions
    },
    adapters: adapterStatus(report, profiles),
    workers: defaultWorkers(report),
    tasks: state.tasks,
    events: state.events,
    cycles: state.cycles.slice(0, 20)
  };
}

function runCycle() {
  const state = readState();
  seedTasks(state);
  const startedAt = Date.now();
  pushEvent(state, "cycle", "Ciclo local iniciado");

  const operational = getOperationalState();
  const adapters = operational.adapters;
  const ready = adapters.filter((adapter) => adapter.status === "ready").length;
  const partial = adapters.filter((adapter) => adapter.status === "partial").length;
  const missing = adapters.filter((adapter) => adapter.status === "missing").length;
  const task = state.tasks.find((item) => item.status === "ready" || item.status === "planned");

  if (task && task.status === "planned") task.status = "ready";
  if (task) task.lastTouchedAt = nowIso();

  const cycle = {
    id: `cycle_${Date.now()}`,
    at: nowIso(),
    durationMs: Date.now() - startedAt,
    mode: operational.mode,
    adapters: { ready, partial, missing },
    selectedTask: task ? task.id : null,
    result: "local probes completed"
  };

  state.cycles.unshift(cycle);
  state.cycles = state.cycles.slice(0, 40);
  pushEvent(state, "cycle", `Ciclo local concluido: ${ready} ready, ${partial} partial, ${missing} missing`, cycle);
  writeState(state);

  return {
    ...operational,
    lastCycle: cycle,
    tasks: state.tasks,
    events: state.events,
    cycles: state.cycles.slice(0, 20)
  };
}

function main() {
  const command = process.argv[2] || "state";
  const payload = command === "cycle" ? runCycle() : getOperationalState();
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  getOperationalState,
  runCycle,
  statePath
};
