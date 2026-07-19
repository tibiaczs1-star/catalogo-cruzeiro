#!/usr/bin/env node
/**
 * Render startup script
 * Bootstraps Agent OS directories and starts the server
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname);
const IS_RENDER = process.env.RENDER === "true" || process.env.NODE_ENV === "production";
const PERSISTENT_ROOT = IS_RENDER
  ? (process.env.DATA_DIR || path.join(ROOT, "..", "render-data"))
  : ROOT;

// Create necessary directories
const DIRS = [
  path.join(PERSISTENT_ROOT, "data"),
  path.join(PERSISTENT_ROOT, "data", "agent-os-memory"),
  path.join(PERSISTENT_ROOT, ".codex-temp", "agent-os", "reports"),
  path.join(PERSISTENT_ROOT, ".codex-temp", "agent-os", "pending"),
  path.join(PERSISTENT_ROOT, ".codex-temp", "agent-os", "meetings"),
  path.join(PERSISTENT_ROOT, ".codex-temp", "agent-os", "actions-log"),
  path.join(PERSISTENT_ROOT, ".codex-temp", "agent-os", "instagram-sync"),
  path.join(PERSISTENT_ROOT, ".codex-temp", "agent-os", "test-results"),
  path.join(ROOT, "agent-os", "manifests"),
];

console.log(`[render-start] Ambiente: ${IS_RENDER ? "Render" : "local"}`);
console.log(`[render-start] PERSISTENT_ROOT: ${PERSISTENT_ROOT}`);

for (const dir of DIRS) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`[render-start] criado: ${dir}`);
  }
}

// Verify manifests exist
const manifestsDir = path.join(ROOT, "agent-os", "manifests");
const indexPath = path.join(manifestsDir, "INDEX.json");
if (!fs.existsSync(indexPath)) {
  console.log("[render-start] ⚠️ Manifestos não encontrados, gerando...");
  try {
    const { execSync } = require("child_process");
    execSync("node agent-os/runtime/generate-manifests.js", { cwd: ROOT, stdio: "inherit" });
  } catch (err) {
    console.error("[render-start] ❌ Erro ao gerar manifestos:", err.message);
  }
}

// Start the server
console.log("[render-start] Iniciando servidor...");
const serverEnv = { ...process.env, NODE_ENV: IS_RENDER ? "production" : "development" };
if (IS_RENDER && PERSISTENT_ROOT) {
  serverEnv.DATA_DIR = PERSISTENT_ROOT;
}
const server = spawn("node", ["server.js"], {
  cwd: ROOT,
  stdio: "inherit",
  env: serverEnv,
});

server.on("error", (err) => {
  console.error("[render-start] ❌ Erro ao iniciar servidor:", err.message);
  process.exit(1);
});

server.on("exit", (code) => {
  console.log(`[render-start] Servidor encerrado com código ${code}`);
  process.exit(code);
});

// Handle signals
process.on("SIGTERM", () => {
  console.log("[render-start] Recebido SIGTERM, encerrando...");
  server.kill("SIGTERM");
});

process.on("SIGINT", () => {
  console.log("[render-start] Recebido SIGINT, encerrando...");
  server.kill("SIGINT");
});
