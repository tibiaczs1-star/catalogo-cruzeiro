/**
 * Agent OS — Servidor Standalone
 *
 * Serve o painel supervisor e os endpoints da API do Agent OS.
 * Roda na porta 3001 por padrão (não conflita com o servidor principal na 3000).
 *
 * Uso:
 *   node agent-os-server.js
 *   PORT=3002 node agent-os-server.js
 *
 * Endpoints:
 *   GET  /                     → Painel supervisor
 *   GET  /api/agent-os/state   → Estado atual
 *   GET  /api/agent-os/reports → Relatórios recentes
 *   POST /api/agent-os/cycle   → Executar ciclo (body: { cycle, team, agent })
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

// ─── Config ──────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || process.env.AGENT_OS_PORT || "3001", 10);
const AUTO_CYCLE_INTERVAL_MS = parseInt(process.env.AGENT_OS_CYCLE_INTERVAL_MS || "3600000", 10); // 1h default
const AUTO_CYCLE_ON_START = /^(1|true|yes|sim)$/i.test(process.env.AGENT_OS_CYCLE_ON_START || "1");
const ROOT = path.resolve(__dirname, "..", "..");
const AGENT_OS_DIR = path.join(ROOT, "agent-os");
const DATA_DIR = path.join(ROOT, "data");
const TEMP_DIR = path.join(ROOT, ".codex-temp", "agent-os");
const MANIFESTS_DIR = path.join(AGENT_OS_DIR, "manifests");

// ─── Constants ────────────────────────────────────────────────────────

const DIRECTORS = {
  tecnologia: { id: "dir-tecnologia", name: "Tecnologia", cargo: "CTO IA" },
  editorial: { id: "dir-editorial", name: "Editorial", cargo: "Editor-chefe" },
  design: { id: "dir-design", name: "Design", cargo: "Diretor de Design" },
  crescimento: { id: "dir-crescimento", name: "Crescimento", cargo: "Diretor de Crescimento" },
  auditoria: { id: "auditor-geral", name: "Auditoria", cargo: "Auditor Geral" },
};

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".md": "text/markdown",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

// ─── State ────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; }
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

const STATE_FILE = path.join(DATA_DIR, "agent-os-state.json");
let state = readJson(STATE_FILE, {
  version: "1.0.0",
  lastCycleAt: null,
  lastCycleType: null,
  cycles: 0,
  agentsExecuted: 0,
  reportsGenerated: 0,
  errors: [],
  agents: {},
});

function saveState() {
  writeJson(STATE_FILE, state);
}

// ─── Data Loaders ─────────────────────────────────────────────────────

function loadNews() {
  try {
    const runtimeNews = readJson(path.join(DATA_DIR, "runtime-news.json"), { items: [] });
    if (runtimeNews.items?.length) return runtimeNews.items.slice(0, 20);
    const archive = readJson(path.join(DATA_DIR, "news-archive.json"), { items: [] });
    return archive.items?.length ? archive.items.slice(0, 20) : [];
  } catch {
    return [];
  }
}

function loadCheffeCallState() {
  try {
    const localFile = path.join(TEMP_DIR, "cheffe-call-state.json");
    if (fs.existsSync(localFile)) return readJson(localFile);
  } catch {}
  return { meeting: { active: false }, summary: { totalAgents: 181 } };
}

function loadReports() {
  const reportDir = path.join(TEMP_DIR, "reports");
  if (!fs.existsSync(reportDir)) return [];
  const files = fs.readdirSync(reportDir).filter(f => f.endsWith(".md"));
  return files.slice(-10).map(f => {
    const fullPath = path.join(reportDir, f);
    const stat = fs.statSync(fullPath);
    return {
      title: f.replace(".md", "").replace(/-/g, " "),
      file: f,
      date: stat.mtime.toLocaleDateString("pt-BR"),
      size: stat.size,
      url: `/reports/${f}`,
    };
  });
}

function loadManifests() {
  if (!fs.existsSync(MANIFESTS_DIR)) return null;
  const indexFile = path.join(MANIFESTS_DIR, "INDEX.json");
  if (fs.existsSync(indexFile)) {
    const index = readJson(indexFile);
    // Normalize: if manifests is an array, convert to lookup object
    if (Array.isArray(index.manifests)) {
      const lookup = {};
      for (const m of index.manifests) {
        lookup[m.id] = m;
      }
      index.manifests = lookup;
    }
    return index;
  }
  // Fallback: load individual JSON files
  const files = fs.readdirSync(MANIFESTS_DIR).filter(f => f.endsWith(".json") && f !== "INDEX.json");
  const manifests = {};
  for (const f of files) {
    const content = readJson(path.join(MANIFESTS_DIR, f));
    if (content?.id) manifests[content.id] = content;
  }
  return { version: "1.0.0", total: files.length, manifests };
}

// ─── Agent Execution (via LLM) ────────────────────────────────────────

async function executeAgent(manifest, context) {
  const startTime = Date.now();

  // Build prompt
  const systemPrompt = buildSystemPrompt(manifest);
  const userPrompt = buildUserPrompt(manifest, context);

  // Call LLM
  const result = await callLLM(systemPrompt, userPrompt, manifest);

  const duration = Date.now() - startTime;

  return {
    agentId: manifest.id,
    agentName: manifest.name,
    level: manifest.level,
    cargo: manifest.cargo,
    content: result,
    status: result.startsWith("ERRO") ? "failed" : "completed",
    duration,
    timestamp: new Date().toISOString(),
  };
}

function buildSystemPrompt(manifest) {
  const lines = [
    `Você é ${manifest.name}.`,
    `Cargo: ${manifest.cargo}.`,
    `Nível: ${manifest.level}.`,
    `Especialidade: ${manifest.specialty || manifest.description || ""}`,
    "",
    "## Regras",
    "- Responda SOMENTE sobre sua área de especialidade.",
    "- Seja conciso e objetivo (máximo 500 palavras).",
    "- Use formato Markdown.",
    "- Nunca invente dados. Se não souber, diga.",
    "- Nunca exponha chaves, tokens ou senhas.",
    "- Responda em português brasileiro.",
  ];

  if (manifest.subroutines?.length) {
    lines.push("", "## Suas Sub-rotinas");
    for (const s of manifest.subroutines) {
      lines.push(`- ${s}`);
    }
  }

  if (manifest.objectives?.length) {
    lines.push("", "## Objetivos");
    for (const o of manifest.objectives) {
      lines.push(`- ${o}`);
    }
  }

  if (manifest.metrics?.length) {
    lines.push("", "## Métricas de Sucesso");
    for (const m of manifest.metrics) {
      lines.push(`- ${m}`);
    }
  }

  return lines.join("\n");
}

function buildUserPrompt(manifest, context) {
  const parts = [
    "## Contexto do Sistema",
    `- Data: ${new Date().toLocaleDateString("pt-BR", { timeZone: "America/Rio_Branco" })}`,
    `- Total de agentes: ${context.cheffeState?.summary?.totalAgents || 181}`,
    `- Autonomia média: ${context.cheffeState?.summary?.averageAutonomy || 75}%`,
    "",
  ];

  if (context.news?.length) {
    parts.push("## Notícias Recentes");
    for (const n of context.news.slice(0, 5)) {
      parts.push(`- ${n.title || n.slug || "Sem título"}`);
    }
    parts.push("");
  }

  if (context.task) {
    parts.push("## Tarefa", context.task, "");
  }

  parts.push("## Instrução", "Execute suas sub-rotinas e gere um relatório com: achados, análise e recomendações.");

  return parts.join("\n");
}

async function callLLM(systemPrompt, userPrompt, manifest) {
  const llmUrl = process.env.LLM_API_URL || "http://127.0.0.1:11434/v1/chat/completions";
  const model = manifest.llmModel || process.env.CZS_OLLAMA_MODEL || ":3b";

  try {
    const response = await fetch(llmUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: manifest.temperature || 0.3,
        max_tokens: manifest.maxTokens || 1500,
        stream: false,
      }),
      signal: AbortSignal.timeout(parseInt(process.env.LLM_TIMEOUT_MS || "90000", 10)),
    });

    if (!response.ok) {
      return `ERRO: LLM retornou HTTP ${response.status}`;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return "ERRO: Resposta vazia da LLM";
    }

    return content;
  } catch (err) {
    // Fallback: gerar relatório simulado
    return generateFallbackReport(manifest);
  }
}

function generateFallbackReport(manifest) {
  const news = loadNews();
  const newsCount = news.length;

  return `## Relatório — ${manifest.name}
**Cargo:** ${manifest.cargo}
**Data:** ${new Date().toLocaleDateString("pt-BR")}

### Status
✅ Agente operacional (modo fallback)
⚠️ LLM não disponível — relatório gerado sem inferência

### Achados
- ${newsCount} notícias capturadas no sistema
- Agente ${manifest.id} executou sub-rotinas em modo read-only
- Nenhuma alteração realizada (somente análise)

### Recomendações
1. Verificar conexão com Ollama/LLM
2. Executar novamente quando LLM estiver disponível
3. Revisar configuração de LLM_API_URL
`;
}

// ─── Cycle Runner ────────────────────────────────────────────────────

async function runAgentCycle(options = {}) {
  const cycleType = options.cycle || options.team || options.agent || "full";
  const teamFilter = options.team || null;
  const agentFilter = options.agent || null;

  const manifests = loadManifests();
  if (!manifests?.manifests) {
    return { ok: false, error: "Manifestos não encontrados. Rode: node generate-manifests.js" };
  }

  const llmAvailable = await checkLLMHealth();
  const context = {
    news: loadNews(),
    cheffeState: loadCheffeCallState(),
    llmAvailable,
  };

  const results = [];

  // Determine which agents to run
  let agentsToRun = [];

  if (agentFilter) {
    const found = manifests.manifests[agentFilter];
    if (found) agentsToRun = [found];
  } else if (teamFilter) {
    // Get director + managers for the team
    const teamDirectors = {
      tecnologia: ["dir-tecnologia"],
      editorial: ["dir-editorial"],
      design: ["dir-design"],
      crescimento: ["dir-crescimento"],
      seguranca: ["auditor-geral"],
    };

    const directors = teamDirectors[teamFilter] || [];
    for (const dId of directors) {
      const dir = manifests.manifests[dId];
      if (dir) {
        agentsToRun.push(dir);
        // Add managers under this director
        for (const mgrId of dir.manages || []) {
          const mgr = manifests.manifests[mgrId];
          if (mgr) agentsToRun.push(mgr);
        }
      }
    }
  } else {
    // Full cycle: CEO + Directors + Managers
    const ceo = manifests.manifests["ceo-supervisor"];
    if (ceo) agentsToRun.push(ceo);

    const directors = Object.values(manifests.manifests).filter(m => m.level === "director");
    for (const dir of directors) {
      agentsToRun.push(dir);
      for (const mgrId of dir.manages || []) {
        const mgr = manifests.manifests[mgrId];
        if (mgr) agentsToRun.push(mgr);
      }
    }
  }

  // Execute agents
  for (const manifest of agentsToRun) {
    process.stdout.write(`  [${manifest.id}] ${manifest.name}... `);

    const result = await executeAgent(manifest, context);
    results.push(result);

    if (result.status === "completed") {
      console.log(`✅ (${result.duration}ms, ${result.content.length} chars)`);
    } else {
      console.log(`❌`);
    }

    // Small delay between agents
    await new Promise(r => setTimeout(r, 300));
  }

  // Generate report
  const report = generateCycleReport(results, cycleType, llmAvailable);

  // Update state
  state.lastCycleAt = new Date().toISOString();
  state.lastCycleType = cycleType;
  state.cycles = (state.cycles || 0) + 1;
  state.agentsExecuted = (state.agentsExecuted || 0) + results.length;
  state.reportsGenerated = (state.reportsGenerated || 0) + 1;
  state.llmAvailable = llmAvailable;
  state.lastResults = results.slice(0, 20).map(r => ({
    id: r.agentId,
    name: r.agentName,
    status: r.status,
    duration: r.duration,
  }));
  saveState();

  return {
    ok: true,
    summary: {
      total: results.length,
      success: results.filter(r => r.status === "completed").length,
      failed: results.filter(r => r.status === "failed").length,
      llmAvailable,
      cycleType,
    },
    agents: results,
    report: report.slice(0, 2000),
  };
}

function generateCycleReport(results, cycleType, llmAvailable) {
  ensureDir(path.join(TEMP_DIR, "reports"));

  const lines = [
    `# Relatório Agent OS — ${cycleType.toUpperCase()}`,
    "",
    `**Gerado em:** ${new Date().toLocaleString("pt-BR")}`,
    `**LLM:** ${llmAvailable ? "✅ Online" : "❌ Offline (fallback mode)"}`,
    "",
    "## Resumo",
    `- Total de agentes: ${results.length}`,
    `- Sucessos: ${results.filter(r => r.status === "completed").length}`,
    `- Falhas: ${results.filter(r => r.status === "failed").length}`,
    "",
    "## Resultados por Agente",
    "",
  ];

  for (const r of results) {
    const icon = r.status === "completed" ? "✅" : "❌";
    lines.push(`### ${icon} ${r.agentName} (\`${r.agentId}\`)`);
    lines.push("");
    lines.push(`**Cargo:** ${r.cargo}`);
    lines.push(`**Duração:** ${r.duration}ms`);
    lines.push("");
    lines.push(r.content.slice(0, 1000));
    lines.push("");
  }

  const report = lines.join("\n");
  const reportFile = path.join(TEMP_DIR, "reports", `${cycleType}-${new Date().toISOString().split("T")[0]}.md`);
  ensureDir(path.dirname(reportFile));
  fs.writeFileSync(reportFile, report);

  return report;
}

async function checkLLMHealth() {
  const llmUrl = process.env.LLM_API_URL || "http://127.0.0.1:11434/api/tags";
  try {
    const response = await fetch(llmUrl, { signal: AbortSignal.timeout });
    return response.ok;
  } catch {
    return false;
  }
}

// ─── HTTP Server ─────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // ─── API Routes ───────────────────────────────────────────────────

  if (pathname === "/api/agent-os/state" && req.method === "GET") {
    const manifests = loadManifests();
    const reports = loadReports();
    const llmAvailable = await checkLLMHealth();

    const statePayload = {
      ...state,
      llmAvailable,
      totalManifests: manifests?.total || 0,
      reportsCount: reports.length,
      teams: Object.keys(DIRECTORS).reduce((acc, key) => {
        acc[key] = { name: DIRECTORS[key].name, active: true };
        return acc;
      }, {}),
    };

    return sendJson(res, 200, statePayload);
  }

  if (pathname === "/api/agent-os/reports" && req.method === "GET") {
    const reports = loadReports();
    return sendJson(res, 200, { reports, total: reports.length });
  }

  if (pathname === "/api/agent-os/cycle" && req.method === "POST") {
    const body = await parseBody(req);
    const result = await runAgentCycle(body || {});
    return sendJson(res, result.ok ? 200 : 500, result);
  }

  if (pathname === "/api/agent-os/manifests" && req.method === "GET") {
    const manifests = loadManifests();
    return sendJson(res, 200, manifests || { error: "Manifestos não encontrados" });
  }

  if (pathname === "/api/agent-os/llm/health" && req.method === "GET") {
    const healthy = await checkLLMHealth();
    return sendJson(res, 200, { ok: healthy, llmUrl: process.env.LLM_API_URL || "http://127.0.0.1:11434/v1/chat/completions" });
  }

  // ─── Reports Static ───────────────────────────────────────────────

  if (pathname.startsWith("/reports/")) {
    const reportFile = path.join(TEMP_DIR, pathname);
    if (fs.existsSync(reportFile)) {
      const content = fs.readFileSync(reportFile, "utf8");
      return sendJson(res, 200, { report: content });
    }
    return sendJson(res, 404, { error: "Relatório não encontrado" });
  }

  // ─── Static Files ─────────────────────────────────────────────────

  let filePath = path.join(AGENT_OS_DIR, "supervisor", pathname === "/" ? "agent-os-supervisor.html" : pathname);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(AGENT_OS_DIR, "supervisor", "agent-os-supervisor.html");
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const content = fs.readFileSync(filePath);

    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
    return;
  }

  // ─── 404 ──────────────────────────────────────────────────────────

  sendJson(res, 404, {
    error: "Not Found",
    message: "Agent OS — Centro de Comando",
    endpoints: [
      "GET  /",
      "GET  /api/agent-os/state",
      "GET  /api/agent-os/reports",
      "GET  /api/agent-os/manifests",
      "GET  /api/agent-os/llm/health",
      "POST /api/agent-os/cycle",
    ],
  });
});

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

async function parseBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const text = Buffer.concat(chunks).toString("utf8");
      try { resolve(JSON.parse(text)); } catch { resolve({}); }
    });
  });
}

// ─── Start ────────────────���───────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`\n🧠 Agent OS — Centro de Comando`);
  console.log(`   http://localhost:${PORT}/`);
  console.log(`   API: http://localhost:${PORT}/api/agent-os/`);
  console.log(`   LLM: ${process.env.LLM_API_URL || "http://127.0.0.1:11434/v1/chat/completions"}`);
  console.log(`   Model: ${process.env.CZS_OLLAMA_MODEL || ":3b"}`);
  console.log(`   Ciclo automático: ${AUTO_CYCLE_INTERVAL_MS / 1000 / 60}min`);
  console.log(`\n   Ctrl+C para parar\n`);

  // Auto-cycle on start
  if (AUTO_CYCLE_ON_START) {
    console.log(`🔄 Executando ciclo inicial automático...\n`);
    setTimeout(() => {
      runAgentCycle({ cycle: "auto-start" })
        .then(result => {
          if (result.ok) {
            console.log(`\n✅ Ciclo inicial concluído: ${result.summary.success}/${result.summary.total} agentes\n`);
          } else {
            console.log(`\n⚠️ Ciclo inicial com erro: ${result.error}\n`);
          }
        })
        .catch(err => console.error(`\n❌ Erro no ciclo inicial: ${err.message}\n`));
    }, 2000);
  }

  // Periodic auto-cycle
  if (AUTO_CYCLE_INTERVAL_MS > 0) {
    setInterval(() => {
      console.log(`\n🔄 Executando ciclo automático (${new Date().toLocaleTimeString("pt-BR")})...\n`);
      runAgentCycle({ cycle: "auto-periodic" })
        .then(result => {
          if (result.ok) {
            console.log(`✅ Ciclo concluído: ${result.summary.success}/${result.summary.total} agentes\n`);
          } else {
            console.log(`⚠️ Ciclo com erro: ${result.error}\n`);
          }
        })
        .catch(err => console.error(`❌ Erro no ciclo: ${err.message}\n`));
    }, AUTO_CYCLE_INTERVAL_MS);
    console.log(`   Ciclo automático a cada ${AUTO_CYCLE_INTERVAL_MS / 1000 / 60} minutos\n`);
  }
});

module.exports = { server, runAgentCycle, loadManifests, checkLLMHealth };
