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

function safeGitStatus() {
  try {
    const output = execFileSync("git", ["status", "--porcelain=v1"], {
      cwd: ROOT_DIR,
      encoding: "utf8",
      timeout: 10000
    });
    const lines = output.split(/\r?\n/).filter(Boolean);
    const tracked = lines.filter((line) => !line.startsWith("?? ")).length;
    const untracked = lines.length - tracked;
    return { available: true, total: lines.length, tracked, untracked };
  } catch (error) {
    return { available: false, error: error.message };
  }
}

function collectSummary() {
  const errors = [];
  const warnings = [];
  const files = REQUIRED_FILES.map(fileInfo);

  for (const item of files) {
    if (!item.exists) {
      errors.push(`Arquivo obrigatorio ausente: ${item.relativePath}`);
    }
  }

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
  const openOrders = orders.filter((order) => order.status === "open");
  const latestOrder = orders[orders.length - 1] || null;

  if (openOrders.length > 0) {
    const latestOpen = openOrders[openOrders.length - 1];
    warnings.push(`Ha ${openOrders.length} ordem(ns) aberta(s); mais recente: ${latestOpen.summary}`);
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
  if (git.available && git.total > 0) {
    warnings.push(
      `Worktree com ${git.total} mudanca(s): ${git.tracked} rastreada(s), ${git.untracked} nao rastreada(s).`
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
      openOrders: openOrders.length,
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
  console.log(`orders: ${summary.memory.orders} | assets: ${summary.memory.assets} | open: ${summary.memory.openOrders}`);

  if (summary.memory.latestOrder) {
    console.log(`latest: ${summary.memory.latestOrder.summary}`);
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
  console.log("- Em rodada grande, atualizar CODEX_MEMORY.md, current-state.md e handoff.md ao encerrar.");
}

const summary = collectSummary();

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  printHuman(summary);
}

process.exit(summary.ok ? 0 : 1);
