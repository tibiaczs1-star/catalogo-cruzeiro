#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const MEMORY_DIR = path.join(ROOT_DIR, ".codex-memory");
const README_FILE = path.join(MEMORY_DIR, "README.md");
const CURRENT_STATE_FILE = path.join(MEMORY_DIR, "current-state.md");
const HANDOFF_FILE = path.join(MEMORY_DIR, "handoff.md");
const ORDERS_FILE = path.join(MEMORY_DIR, "orders.json");
const ASSETS_FILE = path.join(MEMORY_DIR, "assets.json");

function nowIso() {
  return new Date().toISOString();
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, payload) {
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
}

function parseArgs(argv) {
  const args = { _: [] };

  const appendArgValue = (key, value) => {
    if (!(key in args)) {
      args[key] = value;
      return;
    }

    if (Array.isArray(args[key])) {
      args[key].push(value);
      return;
    }

    args[key] = [args[key], value];
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }

    const [rawKey, inlineValue] = token.slice(2).split("=", 2);
    const key = rawKey.trim();
    if (!key) continue;

    if (inlineValue !== undefined) {
      appendArgValue(key, inlineValue);
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      appendArgValue(key, next);
      index += 1;
    } else {
      appendArgValue(key, true);
    }
  }

  return args;
}

function toList(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => toList(item));
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function ensureScaffold() {
  ensureDir(MEMORY_DIR);

  if (!fs.existsSync(README_FILE)) {
    fs.writeFileSync(
      README_FILE,
      "# Codex Memory System\n\nLeia este diretorio e o CODEX_MEMORY.md antes de retomar trabalhos.\n",
      "utf-8"
    );
  }

  if (!fs.existsSync(CURRENT_STATE_FILE)) {
    fs.writeFileSync(
      CURRENT_STATE_FILE,
      `# Current State\n\nUpdated: ${nowIso()}\n\n- Sistema de memoria inicializado.\n`,
      "utf-8"
    );
  }

  if (!fs.existsSync(HANDOFF_FILE)) {
    fs.writeFileSync(
      HANDOFF_FILE,
      `# Handoff\n\nUpdated: ${nowIso()}\n\n- Sistema de memoria inicializado.\n`,
      "utf-8"
    );
  }

  if (!fs.existsSync(ORDERS_FILE)) {
    writeJson(ORDERS_FILE, {
      version: 1,
      lastUpdatedAt: nowIso(),
      orders: []
    });
  }

  if (!fs.existsSync(ASSETS_FILE)) {
    writeJson(ASSETS_FILE, {
      version: 1,
      lastUpdatedAt: nowIso(),
      assets: []
    });
  }
}

function addOrder(args) {
  ensureScaffold();

  const raw = String(args.raw || "").trim();
  const summary = String(args.summary || "").trim();

  if (!raw || !summary) {
    throw new Error("Use --raw e --summary para registrar uma ordem.");
  }

  const payload = readJson(ORDERS_FILE, {
    version: 1,
    lastUpdatedAt: nowIso(),
    orders: []
  });

  const createdAt = nowIso();
  const idBase = slugify(summary) || "ordem";
  const id = `${createdAt.slice(0, 10)}-${idBase}`;

  const order = {
    id,
    createdAt,
    updatedAt: createdAt,
    status: String(args.status || "open").trim(),
    source: String(args.source || "chat").trim(),
    rawRequest: raw,
    summary,
    normalizedTasks: toList(args.tasks),
    filesTouched: toList(args.files),
    assetRefs: toList(args.assets),
    tags: toList(args.tags),
    nextSteps: toList(args.next),
    notes: String(args.notes || "").trim()
  };

  payload.orders.push(order);
  payload.lastUpdatedAt = createdAt;
  writeJson(ORDERS_FILE, payload);

  console.log(`order-added ${id}`);
}

function addAsset(args) {
  ensureScaffold();

  const assetPath = String(args.path || "").trim();
  if (!assetPath) {
    throw new Error("Use --path para registrar um asset.");
  }

  const payload = readJson(ASSETS_FILE, {
    version: 1,
    lastUpdatedAt: nowIso(),
    assets: []
  });

  const id = String(args.id || slugify(path.basename(assetPath)) || `asset-${Date.now()}`);
  const createdAt = nowIso();
  const existingIndex = payload.assets.findIndex((asset) => asset.id === id);
  const asset = {
    id,
    kind: String(args.kind || "file").trim(),
    path: assetPath,
    source: String(args.source || "workspace").trim(),
    note: String(args.note || "").trim(),
    linkedOrderIds: toList(args.orders),
    createdAt
  };

  if (existingIndex >= 0) {
    payload.assets[existingIndex] = {
      ...payload.assets[existingIndex],
      ...asset
    };
  } else {
    payload.assets.push(asset);
  }

  payload.lastUpdatedAt = createdAt;
  writeJson(ASSETS_FILE, payload);
  console.log(`asset-added ${id}`);
}

function setState(args) {
  ensureScaffold();

  const updatedAt = nowIso();
  const title = String(args.title || "Sem titulo").trim();
  const summary = String(args.summary || "").trim();
  const next = toList(args.next);
  const files = toList(args.files);
  const assets = toList(args.assets);

  const content = [
    "# Current State",
    "",
    `Updated: ${updatedAt}`,
    "",
    "## Active Goal",
    "",
    `- ${title}`,
    ...(summary ? ["", "## Summary", "", summary] : []),
    ...(next.length
      ? ["", "## Next", "", ...next.map((item) => `- ${item}`)]
      : []),
    ...(files.length
      ? ["", "## Files In Focus", "", ...files.map((item) => `- ${item}`)]
      : []),
    ...(assets.length
      ? ["", "## Assets In Focus", "", ...assets.map((item) => `- ${item}`)]
      : [])
  ].join("\n");

  fs.writeFileSync(CURRENT_STATE_FILE, `${content}\n`, "utf-8");
  console.log("state-updated");
}

function setHandoff(args) {
  ensureScaffold();

  const updatedAt = nowIso();
  const summary = String(args.summary || "").trim();
  const next = toList(args.next);
  const files = toList(args.files);
  const orders = toList(args.orders);

  const content = [
    "# Handoff",
    "",
    `Updated: ${updatedAt}`,
    "",
    ...(summary ? [summary] : ["- Handoff atualizado sem resumo textual."]),
    ...(next.length
      ? ["", "## Next", "", ...next.map((item) => `- ${item}`)]
      : []),
    ...(files.length
      ? ["", "## Files In Focus", "", ...files.map((item) => `- ${item}`)]
      : []),
    ...(orders.length
      ? ["", "## Related Orders", "", ...orders.map((item) => `- ${item}`)]
      : [])
  ].join("\n");

  fs.writeFileSync(HANDOFF_FILE, `${content}\n`, "utf-8");
  console.log("handoff-updated");
}

function printStatus() {
  ensureScaffold();

  const ordersPayload = readJson(ORDERS_FILE, { version: 1, orders: [] });
  const assetsPayload = readJson(ASSETS_FILE, { version: 1, assets: [] });
  const latestOrder = [...(ordersPayload.orders || [])].slice(-1)[0] || null;

  console.log(
    JSON.stringify(
      {
        memoryDir: path.relative(ROOT_DIR, MEMORY_DIR) || ".codex-memory",
        orders: (ordersPayload.orders || []).length,
        assets: (assetsPayload.assets || []).length,
        latestOrder: latestOrder
          ? {
              id: latestOrder.id,
              status: latestOrder.status,
              summary: latestOrder.summary,
              updatedAt: latestOrder.updatedAt
            }
          : null
      },
      null,
      2
    )
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || "status";

  if (command === "ensure") {
    ensureScaffold();
    console.log("memory-ready");
    return;
  }

  if (command === "status") {
    printStatus();
    return;
  }

  if (command === "add-order") {
    addOrder(args);
    return;
  }

  if (command === "add-asset") {
    addAsset(args);
    return;
  }

  if (command === "set-state") {
    setState(args);
    return;
  }

  if (command === "set-handoff") {
    setHandoff(args);
    return;
  }

  throw new Error(`Comando desconhecido: ${command}`);
}

try {
  main();
} catch (error) {
  console.error(`[codex-memory] ${error.message}`);
  process.exit(1);
}
