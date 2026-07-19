#!/usr/bin/env node

/**
 * Agent OS — Setup & Validation
 *
 * Verifica dependências, gera manifestos, valida estrutura.
 * Execute uma vez antes de usar o Agent OS.
 *
 * Uso:
 *   node runtime/setup.js
 *   node runtime/setup.js --validate
 */

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

const ROOT = path.resolve(__dirname, "..", "..");
const AGENT_OS_DIR = path.resolve(__dirname, "..");
const MANIFESTS_DIR = path.join(AGENT_OS_DIR, "manifests");
const TEMP_DIR = path.join(ROOT, ".codex-temp", "agent-os");

let errors = 0;
let warnings = 0;
let checks = 0;

function check(condition, message) {
  checks++;
  if (condition) {
    console.log(`  ✅ ${message}`);
  } else {
    errors++;
    console.log(`  ❌ ${message}`);
  }
}

function warn(message) {
  warnings++;
  console.log(`  ⚠️  ${message}`);
}

function section(title) {
  console.log(`\n${title}`);
  console.log("─".repeat(60));
}

// ─── 1. Check Node.js ────────────────────────────────────────────────

section("1. Verificando Node.js");

const nodeVersion = process.version;
const nodeMajor = parseInt(nodeVersion.replace("v", "").split(".")[0], 10);
check(nodeMajor >= 18, `Node.js ${nodeVersion} (requer >= 18.0.0)`);

// ─── 2. Check directory structure ────────────────────────────────────

section("2. Verificando estrutura de diretórios");

const requiredDirs = [
  AGENT_OS_DIR,
  path.join(AGENT_OS_DIR, "runtime"),
  path.join(AGENT_OS_DIR, "supervisor"),
  path.join(AGENT_OS_DIR, "specialists"),
  path.join(AGENT_OS_DIR, "directors"),
  path.join(AGENT_OS_DIR, "managers"),
  MANIFESTS_DIR,
];

for (const dir of requiredDirs) {
  check(fs.existsSync(dir), `Diretório: ${path.basename(dir)}`);
}

// ─── 3. Check required files ────────────────────────────────────────

section("3. Verificando arquivos obrigatórios");

const requiredFiles = [
  "runtime/agent-os-runtime.js",
  "runtime/llm-client.js",
  "runtime/agent-os-server.js",
  "runtime/generate-manifests.js",
  "supervisor/agent-os-supervisor.html",
  "supervisor/agent-os-supervisor.js",
  "specialists/specialists-manifest.md",
  "specialists/INDEX.md",
  "hierarchy.json",
  "ceo-supervisor.md",
  "directors/dir-tecnologia.md",
  "directors/dir-editorial.md",
  "directors/dir-design.md",
  "directors/dir-crescimento.md",
  "package.json",
  "README.md",
];

for (const file of requiredFiles) {
  check(fs.existsSync(path.join(AGENT_OS_DIR, file)), `Arquivo: ${file}`);
}

// ─── 4. Generate manifests ──────────────────────────────────────────

section("4. Gerando manifestos");

const indexFile = path.join(MANIFESTS_DIR, "INDEX.json");

if (!fs.existsSync(indexFile)) {
  console.log("  🔨 Gerando manifestos...");

  try {
    const { execSync } = require("child_process");
    execSync("node runtime/generate-manifests.js", {
      cwd: AGENT_OS_DIR,
      stdio: "inherit",
    });
  } catch (err) {
    check(false, "Geração de manifestos");
  }
} else {
  check(true, "Manifestos já existem (INDEX.json)");
}

// Re-check after generation
if (fs.existsSync(indexFile)) {
  const index = JSON.parse(fs.readFileSync(indexFile, "utf8"));
  check(index.total >= 50, `${index.total} manifestos gerados (requer >= 50)`);
  check(index.byLevel?.specialist >= 40, `${index.byLevel?.specialist || 0} especialistas (requer >= 40)`);
}

// ─── 5. Validate data directory ─────────────────────────────────────

section("5. Verificando dados do CZS");

const dataDir = path.join(ROOT, "data");
check(fs.existsSync(dataDir), `Diretório data/ existe`);

if (fs.existsSync(dataDir)) {
  const dataFiles = fs.readdirSync(dataDir).slice(0, 10);
  check(dataFiles.length > 0, `${dataFiles.length} arquivos em data/`);
}

// ─── 6. Check LLM availability ──────────────────────────────────────

section("6. Verificando LLM (Ollama/Fable)");

async function checkLLM() {
  const llmUrl = process.env.LLM_API_URL || "http://127.0.0.1:11434/api/tags";

  try {
    const response = await fetch(llmUrl, { signal: AbortSignal.timeout });
    check(response.ok, `LLM disponível em ${llmUrl}`);
  } catch {
    warn("LLM não disponível — agentes executarão em modo fallback");
    warn("Para ativar: certifique-se que o Ollama está rodando");
    warn(`  URL: ${process.env.LLM_API_URL || "http://127.0.0.1:11434"}`);
    warn(`  Modelo: ${process.env.CZS_OLLAMA_MODEL || ":3b"}`);
  }
}

checkLLM();

// ─── 7. Validate server integration ─────────────────────────────────

section("7. Verificando integração com server.js");

const serverFile = path.join(ROOT, "server.js");
check(fs.existsSync(serverFile), `server.js existe`);

if (fs.existsSync(serverFile)) {
  const serverContent = fs.readFileSync(serverFile, "utf8");
  check(serverContent.includes("sendJson"), "Função sendJson encontrada");
  check(serverContent.includes("parseBody"), "Função parseBody encontrada");
}

// ─── 8. Summary ─────────────────────────────────────────────────────

console.log(`\n${"=".repeat(60)}`);
console.log("RESUMO");
console.log(`${"=".repeat(60)}`);
console.log(`  Checks: ${checks}`);
console.log(`  ✅ Sucessos: ${checks - errors - warnings}`);
console.log(`  ❌ Erros: ${errors}`);
console.log(`  ⚠️  Avisos: ${warnings}`);
console.log("");

if (errors > 0) {
  console.log("❌ Setup incompleto. Corrija os erros antes de continuar.");
  process.exit(1);
} else if (warnings > 0) {
  console.log("⚠️  Setup concluído com avisos. O Agent OS funcionará em modo fallback.");
  console.log("\nPara usar:");
  console.log("  1. node agent-os/runtime/generate-manifests.js");
  console.log("  2. node agent-os/runtime/agent-os-server.js");
  console.log("  3. Acesse http://localhost:3001/");
} else {
  console.log("✅ Setup completo! Tudo pronto para usar.");
  console.log("\nPara iniciar:");
  console.log("  Terminal 1: node agent-os/runtime/agent-os-server.js");
  console.log("  Terminal 2: node agent-os/runtime/agent-os-runtime.js --cycle full");
  console.log("\nOu simplesmente:");
  console.log("  node agent-os/runtime/agent-os-server.js");
  console.log("  # Acesse http://localhost:3001/ e clique em 'Executar Ciclo'");
}
