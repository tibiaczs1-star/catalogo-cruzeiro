#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const MEMORY_DIR = path.join(ROOT_DIR, ".codex-memory");

const REQUIRED_FILES = [
  "AGENTS.md",
  "CODEX_MEMORY.md",
  ".codex-memory/README.md",
  ".codex-memory/current-state.md",
  ".codex-memory/handoff.md",
  ".codex-memory/orders.json",
  ".codex-memory/assets.json",
  ".codex-memory/credit-end-protocol.md",
  ".codex-memory/codex-health-protocol.md"
];

const ACTIVE_STATUSES = new Set(["open", "in-progress"]);
const MEMORY_LIMITS = {
  "CODEX_MEMORY.md": { warn: 6000, fail: 20000 },
  ".codex-memory/current-state.md": { warn: 6000, fail: 16000 },
  ".codex-memory/handoff.md": { warn: 5000, fail: 12000 },
  ".codex-memory/orders.json": { warn: 25000, fail: 80000 },
  ".codex-memory/assets.json": { warn: 15000, fail: 50000 },
  "progress.md": { warn: 3000, fail: 10000 }
};

function normalizeWindowsPath(value) {
  return String(value || "")
    .replace(/^\\\\\?\\/, "")
    .replace(/\//g, "\\")
    .replace(/\\+$/g, "")
    .toLowerCase();
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function fileInfo(relativePath) {
  const absolutePath = path.join(ROOT_DIR, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return { relativePath, exists: false };
  }

  const stats = fs.statSync(absolutePath);
  return {
    relativePath,
    exists: true,
    bytes: stats.size,
    updatedAt: stats.mtime.toISOString()
  };
}

function extractStatusPath(line) {
  return line
    .slice(3)
    .replace(/^"|"$/g, "")
    .replace(/\\"/g, "\"")
    .replace(/\\/g, "/");
}

function groupPath(filePath) {
  if (filePath.startsWith("assets/news-fallbacks/")) return "assets/news-fallbacks";
  if (filePath.startsWith("assets/pubpaid/")) return "assets/pubpaid";
  if (filePath.startsWith("pubpaid-phaser/")) return "pubpaid-phaser";
  if (filePath.startsWith("scripts/")) return "scripts";
  if (filePath.startsWith("data/")) return "data";
  if (filePath.startsWith(".codex-memory/")) return ".codex-memory";
  if (filePath.startsWith(".codex-agents/")) return ".codex-agents";
  if (filePath.startsWith(".codex-temp/")) return ".codex-temp";
  return filePath.split("/")[0] || filePath;
}

function parseGitStatus(output) {
  const lines = output.split(/\r?\n/).filter(Boolean);
  const groups = new Map();
  let tracked = 0;
  let untracked = 0;

  for (const line of lines) {
    const status = line.slice(0, 2);
    const filePath = extractStatusPath(line);
    const group = groupPath(filePath);

    if (status === "??") {
      untracked += 1;
    } else {
      tracked += 1;
    }

    const entry = groups.get(group) || { group, total: 0, tracked: 0, untracked: 0 };
    entry.total += 1;
    if (status === "??") {
      entry.untracked += 1;
    } else {
      entry.tracked += 1;
    }
    groups.set(group, entry);
  }

  return {
    total: lines.length,
    tracked,
    untracked,
    topGroups: Array.from(groups.values()).sort((a, b) => b.total - a.total).slice(0, 8)
  };
}

function safeGitStatus() {
  try {
    const normalOutput = execFileSync("git", ["status", "--porcelain=v1"], {
      cwd: ROOT_DIR,
      encoding: "utf8",
      timeout: 10000
    });
    const expandedOutput = execFileSync("git", ["status", "--porcelain=v1", "--untracked-files=all"], {
      cwd: ROOT_DIR,
      encoding: "utf8",
      timeout: 10000
    });

    return {
      available: true,
      normal: parseGitStatus(normalOutput),
      expanded: parseGitStatus(expandedOutput)
    };
  } catch (error) {
    return { available: false, error: error.message };
  }
}

function checkMemorySizes(files, warnings, errors) {
  for (const item of files) {
    if (!item.exists) continue;
    const limits = MEMORY_LIMITS[item.relativePath];
    if (!limits) continue;

    if (item.bytes > limits.fail) {
      errors.push(
        `Memoria operacional grande demais: ${item.relativePath} tem ${item.bytes} bytes; limite duro ${limits.fail}.`
      );
    } else if (item.bytes > limits.warn) {
      warnings.push(
        `Memoria operacional inchando: ${item.relativePath} tem ${item.bytes} bytes; alvo ${limits.warn}.`
      );
    }
  }
}

function collectSummary() {
  const errors = [];
  const warnings = [];
  const files = REQUIRED_FILES.concat("progress.md").map(fileInfo);

  for (const item of files) {
    if (!item.exists) {
      errors.push(`Arquivo obrigatorio ausente: ${item.relativePath}`);
    }
  }
  checkMemorySizes(files, warnings, errors);

  const cwd = process.cwd();
  const nativeRoot = fs.realpathSync.native(ROOT_DIR);
  const cwdMatchesRoot =
    normalizeWindowsPath(cwd) === normalizeWindowsPath(ROOT_DIR) ||
    normalizeWindowsPath(cwd) === normalizeWindowsPath(nativeRoot);

  if (!cwdMatchesRoot) {
    warnings.push(`Comando rodando fora da raiz do projeto: ${cwd}`);
  }

  const nativeRootHasExtendedPrefix = nativeRoot.startsWith("\\\\?\\");
  if (nativeRootHasExtendedPrefix) {
    warnings.push("Caminho nativo da raiz veio com prefixo Windows estendido \\\\?\\.");
  }

  let ordersPayload = null;
  let assetsPayload = null;
  try {
    ordersPayload = readJson(path.join(MEMORY_DIR, "orders.json"));
  } catch (error) {
    errors.push(`orders.json invalido: ${error.message}`);
  }

  try {
    assetsPayload = readJson(path.join(MEMORY_DIR, "assets.json"));
  } catch (error) {
    errors.push(`assets.json invalido: ${error.message}`);
  }

  let packagePayload = null;
  try {
    packagePayload = readJson(path.join(ROOT_DIR, "package.json"));
  } catch (error) {
    errors.push(`package.json invalido: ${error.message}`);
  }

  const orders = Array.isArray(ordersPayload?.orders) ? ordersPayload.orders : [];
  const assets = Array.isArray(assetsPayload?.assets) ? assetsPayload.assets : [];
  const activeOrders = orders.filter((order) => ACTIVE_STATUSES.has(order.status));
  const pausedOrders = orders.filter((order) => order.status === "paused");
  const latestOrder = orders[orders.length - 1] || null;

  if (orders.length > 12) {
    warnings.push(`orders.json tem ${orders.length} ordens; compacte para evitar retomada por historico antigo.`);
  }

  if (activeOrders.length === 0) {
    warnings.push("Nenhuma ordem ativa registrada. Nao agir por inercia; aguarde ou registre a ordem nova.");
  } else if (activeOrders.length > 1) {
    errors.push(
      `Mais de uma ordem ativa (${activeOrders.length}). Pause ou conclua as antigas antes de editar arquivos.`
    );
  }

  const scripts = packagePayload?.scripts || {};
  for (const scriptName of ["codex:health", "memory:status", "review:team"]) {
    if (!scripts[scriptName]) {
      warnings.push(`Script npm ausente: ${scriptName}`);
    }
  }

  const repairScript = path.join(
    ROOT_DIR,
    ".codex-temp",
    "codex-session-path-repair",
    "repair-codex-session-paths.mjs"
  );

  const git = safeGitStatus();
  if (git.available && git.normal.total > 0) {
    warnings.push(
      `Worktree com ${git.normal.total} mudanca(s): ${git.normal.tracked} rastreada(s), ${git.normal.untracked} nao rastreada(s).`
    );
  }

  if (git.available && git.expanded.total > 500) {
    warnings.push(
      `Worktree expandida com ${git.expanded.total} entrada(s). Antes de editar, declarar escopo e usar git add com pathspec explicito.`
    );
  }

  return {
    ok: errors.length === 0,
    checkedAt: new Date().toISOString(),
    root: ROOT_DIR,
    nativeRoot,
    cwd,
    pathCheck: {
      cwdMatchesRoot,
      nativeRootHasExtendedPrefix
    },
    memory: {
      orders: orders.length,
      assets: assets.length,
      activeOrders: activeOrders.length,
      pausedOrders: pausedOrders.length,
      activeOrder: activeOrders[0]
        ? {
            id: activeOrders[0].id,
            status: activeOrders[0].status,
            summary: activeOrders[0].summary,
            updatedAt: activeOrders[0].updatedAt
          }
        : null,
      latestOrder: latestOrder
        ? {
            id: latestOrder.id,
            status: latestOrder.status,
            summary: latestOrder.summary,
            updatedAt: latestOrder.updatedAt
          }
        : null
    },
    git,
    repairScript: {
      path: path.relative(ROOT_DIR, repairScript),
      exists: fs.existsSync(repairScript)
    },
    files,
    errors,
    warnings
  };
}

function printHuman(summary) {
  console.log(`[codex-health] ${summary.ok ? "OK" : "FALHA"}`);
  console.log(`root: ${summary.root}`);
  console.log(`cwd: ${summary.cwd}`);
  console.log(
    `orders: ${summary.memory.orders} | assets: ${summary.memory.assets} | active: ${summary.memory.activeOrders} | paused: ${summary.memory.pausedOrders}`
  );

  if (summary.memory.latestOrder) {
    console.log(`latest: ${summary.memory.latestOrder.summary}`);
  }

  console.log("");
  console.log("aterramento:");
  if (summary.memory.activeOrder) {
    console.log(`- ordem ativa: ${summary.memory.activeOrder.summary}`);
  } else {
    console.log("- ordem ativa: nenhuma; nao continuar tarefa antiga por inercia");
  }
  if (summary.git.available) {
    console.log(
      `- worktree: ${summary.git.normal.total} no status normal; ${summary.git.expanded.total} expandido`
    );
    if (summary.git.expanded.topGroups.length) {
      console.log("- grupos sujos principais:");
      for (const group of summary.git.expanded.topGroups) {
        console.log(
          `  - ${group.group}: ${group.total} (${group.tracked} rastreadas, ${group.untracked} nao rastreadas)`
        );
      }
    }
  }

  if (summary.warnings.length) {
    console.log("");
    console.log("avisos:");
    for (const warning of summary.warnings) {
      console.log(`- ${warning}`);
    }
  }

  if (summary.errors.length) {
    console.log("");
    console.log("erros:");
    for (const error of summary.errors) {
      console.log(`- ${error}`);
    }
  }

  console.log("");
  console.log("proximo passo:");
  console.log("- Ler .codex-memory/current-state.md e .codex-memory/handoff.md antes de agir.");
  console.log("- Registrar a ordem nova em .codex-memory/orders.json antes de editar arquivos.");
  console.log("- Antes de editar: declarar escopo, preservar mudancas vivas e usar stage com pathspec explicito.");
}

const summary = collectSummary();

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  printHuman(summary);
}

process.exit(summary.ok ? 0 : 1);
