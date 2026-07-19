/**
 * Agent OS — Bootstrap para Render
 *
 * Garante que os diretórios necessários existem antes do servidor iniciar.
 * No Render, o filesystem é efêmero mas os diretórios devem existir em runtime.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIRS = [
  path.join(ROOT, "data"),
  path.join(ROOT, "data", "agent-os-memory"),
  path.join(ROOT, ".codex-temp", "agent-os", "reports"),
  path.join(ROOT, ".codex-temp", "agent-os", "pending"),
  path.join(ROOT, ".codex-temp", "agent-os", "meetings"),
  path.join(ROOT, ".codex-temp", "agent-os", "actions-log"),
  path.join(ROOT, ".codex-temp", "agent-os", "instagram-sync"),
  path.join(ROOT, ".codex-temp", "agent-os", "test-results"),
  path.join(ROOT, "agent-os", "manifests"),
];

for (const dir of DIRS) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`[bootstrap] criado: ${dir}`);
  }
}

console.log("[bootstrap] Agent OS diretórios prontos");
