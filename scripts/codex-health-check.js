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
const RENDER_CREDENTIAL_KEYS = [
  "ADMIN_TOKEN",
  "FULL_ADMIN_PASSWORD",
  "SUPER_ADMIN_PASSWORD",
  "RENDER_API_KEY",
  "RENDER_TOKEN"
];
const BROAD_REQUEST_PATTERNS = [
  /\bresolv(a|er)\s+tudo\b/i,
  /\bfaz(er)?\s+tudo\b/i,
  /\barrum(a|ar)\s+tudo\b/i,
  /\blimp(a|ar)\s+tudo\b/i,
  /\bmelhor(a|ar)\s+tudo\b/i,
  /\bcontinua(r)?\s+tudo\b/i,
  /\bsem\s+escopo\b/i,
  /\border[mn]\s+ampla\b/i
];
const SCOPE_HINT_PATTERNS = [
  /\bpubpaid\b/i,
  /\bjornal\b/i,
  /\bcheffe\b/i,
  /\bagentes?\b/i,
  /\brender\b/i,
  /\bgit\b/i,
  /\bworktree\b/i,
  /\bmem[oó]ria\b/i,
  /\bcodex:health\b/i
];
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

function parseGitBranch(output) {
  const firstLine = output.split(/\r?\n/).find((line) => line.startsWith("## ")) || "";
  const cleanLine = firstLine.replace(/^##\s+/, "");
  const match = cleanLine.match(/^(.*?)(?:\.\.\.(.*?))?(?:\s+\[(.*)\])?$/);
  const flags = match?.[3] || "";
  const aheadMatch = flags.match(/ahead\s+(\d+)/);
  const behindMatch = flags.match(/behind\s+(\d+)/);

  return {
    raw: firstLine,
    branch: (match?.[1] || cleanLine || "").trim(),
    upstream: (match?.[2] || "").trim(),
    ahead: aheadMatch ? Number(aheadMatch[1]) : 0,
    behind: behindMatch ? Number(behindMatch[1]) : 0
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
    const branchOutput = execFileSync("git", ["status", "--short", "--branch"], {
      cwd: ROOT_DIR,
      encoding: "utf8",
      timeout: 10000
    });

    return {
      available: true,
      normal: parseGitStatus(normalOutput),
      expanded: parseGitStatus(expandedOutput),
      branch: parseGitBranch(branchOutput)
    };
  } catch (error) {
    return { available: false, error: error.message };
  }
}

function commandExists(commandName) {
  const lookupCommand = process.platform === "win32" ? "where" : "which";
  try {
    execFileSync(lookupCommand, [commandName], {
      cwd: ROOT_DIR,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000
    });
    return true;
  } catch (_error) {
    return false;
  }
}

function orderSearchText(order) {
  if (!order) return "";
  return [
    order.rawRequest,
    order.summary,
    ...(Array.isArray(order.normalizedTasks) ? order.normalizedTasks : []),
    ...(Array.isArray(order.tags) ? order.tags : []),
    ...(Array.isArray(order.nextSteps) ? order.nextSteps : [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesAnyPattern(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function hasAnyRenderCredential() {
  return RENDER_CREDENTIAL_KEYS.some((key) => String(process.env[key] || "").trim());
}

function hasOrderTag(order, tagName) {
  return Array.isArray(order?.tags) && order.tags.includes(tagName);
}

function assessRiskGates(activeOrder, git) {
  const gates = [];
  const activeText = orderSearchText(activeOrder);
  const hasActiveOrder = Boolean(activeOrder);
  const isGuardrailOrder = hasOrderTag(activeOrder, "risk-gates") || hasOrderTag(activeOrder, "scope-gates");
  const hasScopedHint = matchesAnyPattern(activeText, SCOPE_HINT_PATTERNS);
  const broadUnsafe =
    hasActiveOrder &&
    matchesAnyPattern(activeText, BROAD_REQUEST_PATTERNS) &&
    !hasScopedHint &&
    !isGuardrailOrder;
  const wantsRenderAdmin =
    hasActiveOrder &&
    !isGuardrailOrder &&
    /\brender\b|\bdeploy\b|\bstorage\b|\badmin\b|\bprodução\b|\bproducao\b|\bonline\b/.test(activeText);
  const wantsPubPaidVisual =
    hasActiveOrder &&
    !isGuardrailOrder &&
    /\bpubpaid\b/.test(activeText) &&
    /\bvisual\b|\barte\b|\bsprite\b|\bnpc\b|\bcarro\b|\bmoto\b|\bfundo\b|\bhud\b|\bphaser\b|\bcanvas\b/.test(
      activeText
    );
  const renderCredentialAvailable = hasAnyRenderCredential();
  const renderCliAvailable = commandExists("render");

  if (!hasActiveOrder) {
    gates.push({
      name: "escopo",
      status: "standby",
      message: "sem ordem ativa; parar e registrar escopo antes de editar"
    });
  } else if (broadUnsafe) {
    gates.push({
      name: "escopo",
      status: "blocked",
      message: "ordem ampla sem frente/arquivo/prova; pedir recorte antes de agir"
    });
  } else {
    gates.push({
      name: "escopo",
      status: "ok",
      message: "ordem ativa tem recorte ou e uma trava operacional"
    });
  }

  if (wantsRenderAdmin && !renderCredentialAvailable && !renderCliAvailable) {
    gates.push({
      name: "render-admin",
      status: "blocked",
      message: "pedido envolve Render/admin, mas nao ha token nem Render CLI; nao inventar acesso"
    });
  } else if (wantsRenderAdmin) {
    gates.push({
      name: "render-admin",
      status: "ok",
      message: "pedido Render detectado; exigir prova da rota ou CLI antes de declarar limpeza/deploy"
    });
  } else {
    gates.push({
      name: "render-admin",
      status: "standby",
      message: "sem pedido Render/admin ativo; se aparecer, exigir credencial/prova"
    });
  }

  if (wantsPubPaidVisual) {
    gates.push({
      name: "pubpaid-visual",
      status: "warn",
      message: "rodar npm run pubpaid:visual-audit antes de concluir; falha bloqueia declaracao visual"
    });
  } else {
    gates.push({
      name: "pubpaid-visual",
      status: "standby",
      message: "sem rodada visual PubPaid ativa"
    });
  }

  if (git.available && git.branch?.ahead > 0) {
    gates.push({
      name: "branch-ahead",
      status: "warn",
      message: `branch esta ${git.branch.ahead} commit(s) ahead; decidir push/PR/merge antes de chamar historico de pronto`
    });
  } else if (git.available) {
    gates.push({
      name: "branch-ahead",
      status: "ok",
      message: "branch sem commits locais pendentes contra upstream"
    });
  } else {
    gates.push({
      name: "branch-ahead",
      status: "warn",
      message: "git indisponivel para o health; conferir branch com git status antes de afirmar historico limpo"
    });
  }

  if (git.available && git.expanded.total > 0) {
    gates.push({
      name: "worktree",
      status: "warn",
      message: `worktree tem ${git.expanded.total} mudanca(s); nao misturar com novo escopo sem classificar`
    });
  } else if (git.available) {
    gates.push({
      name: "worktree",
      status: "ok",
      message: "worktree limpa"
    });
  } else {
    gates.push({
      name: "worktree",
      status: "warn",
      message: "git indisponivel para o health; conferir worktree externamente antes de editar"
    });
  }

  return gates;
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
  if (!git.available) {
    warnings.push(`Git status indisponivel para codex:health: ${git.error}. Conferir git status fora do script.`);
  }

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

  const riskGates = assessRiskGates(activeOrders[0] || null, git);
  for (const gate of riskGates) {
    if (gate.status === "blocked") {
      errors.push(`Risk gate bloqueado (${gate.name}): ${gate.message}`);
    } else if (gate.status === "warn") {
      warnings.push(`Risk gate aviso (${gate.name}): ${gate.message}`);
    }
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
    riskGates,
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

  if (summary.riskGates.length) {
    console.log("- risk gates:");
    for (const gate of summary.riskGates) {
      console.log(`  - ${gate.name}: ${gate.status} - ${gate.message}`);
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
