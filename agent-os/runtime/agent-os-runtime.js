/**
 * Agent OS — Runtime Principal
 *
 * Ciclo completo: CEO → Diretores → Gerentes → Especialistas → Microagentes
 * Usa LLM local (Ollama/Fable) para executar cada agente.
 *
 * Uso:
 *   node agent-os-runtime.js --cycle full
 *   node agent-os-runtime.js --team editorial
 *   node agent-os-runtime.js --agent esp-instagram
 *   node agent-os-runtime.js --report weekly
 *   node agent-os-runtime.js --watch
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const AGENT_OS_DIR = path.join(ROOT, "agent-os");
const DATA_DIR = path.join(ROOT, "data");
const TEMP_DIR = path.join(ROOT, ".codex-temp", "agent-os");

const { LlmClient } = require("./llm-client");

// ─── Helpers ────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback ?? {};
  }
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

function timestamp() {
  return new Date().toISOString();
}

function today() {
  return new Date().toLocaleDateString("pt-BR", { timeZone: "America/Rio_Branco" });
}

function weekNumber() {
  const d = new Date();
  const firstDay = new Date(d.getFullYear(), 0, 1);
  const pastDays = (d - firstDay) / 86400000;
  return `W${String(Math.ceil((pastDays + firstDay.getDay() + 1) / 7)).padStart(2, "0")}`;
}

// ─── Estado ─────────────────────────────────────────────────────────────

const STATE_FILE = path.join(DATA_DIR, "agent-os-state.json");
let state = readJson(STATE_FILE, {
  version: "1.0.0",
  lastCycleAt: null,
  lastCycleType: null,
  cycles: 0,
  agentsExecuted: 0,
  reportsGenerated: 0,
  errors: [],
});

// ─── Carregar hierarquia ────────────────────────────────────────────────

function loadHierarchy() {
  const file = path.join(AGENT_OS_DIR, "hierarchy.json");
  return readJson(file, { hierarchy: {} });
}

// ─── Carregar notícias do site ──────────────────────────────────────────

function loadNews() {
  try {
    const runtimeNews = readJson(path.join(DATA_DIR, "runtime-news.json"), { items: [] });
    if (runtimeNews.items && runtimeNews.items.length > 0) return runtimeNews.items.slice(0, 20);
    const archive = readJson(path.join(DATA_DIR, "news-archive.json"), { items: [] });
    return archive.items ? archive.items.slice(0, 20) : [];
  } catch {
    return [];
  }
}

// ─── Carregar estado do Cheffe Call ─────────────────────────────────────

async function loadCheffeCallState() {
  // Tenta ler do arquivo local primeiro (sem servidor)
  const localFile = path.join(TEMP_DIR, "cheffe-call-state.json");
  if (fs.existsSync(localFile)) {
    return readJson(localFile, { meeting: { active: false }, summary: { totalAgents: 181 } });
  }
  return {
    meeting: { active: false, lastActivityAt: timestamp() },
    summary: { totalAgents: 181, autonomousAgents: 181, averageAutonomy: 75 },
    queue: [],
    orders: [],
  };
}

// ─── Carregar relatórios existentes ─────────────────────────────────────

function loadExistingReports() {
  const reports = [];
  const reportDir = path.join(TEMP_DIR, "reports");
  if (fs.existsSync(reportDir)) {
    const files = fs.readdirSync(reportDir).filter(f => f.endsWith(".md"));
    for (const f of files.slice(-10)) {
      reports.push(fs.readFileSync(path.join(reportDir, f), "utf8"));
    }
  }
  return reports;
}

// ─── Construir prompt de contexto ────────────────────────────────────────

function buildContext(teamFilter, agentFilter) {
  const news = loadNews();
  const hierarchy = loadHierarchy();
  const cheffeState = loadCheffeCallState();

  const topNews = news.slice(0, 5).map(n => `- ${n.title || n.slug || "Sem título"}`).join("\n");

  let context = `## Estado do Sistema\n`;
  context += `- Data: ${today()}\n`;
  context += `- Agentes totais: ${cheffeState.summary?.totalAgents || 181}\n`;
  context += `- Autonomia média: ${cheffeState.summary?.averageAutonomy || 75}%\n`;
  context += `- Reunião ativa: ${cheffeState.meeting?.active ? "Sim" : "Não"}\n\n`;

  context += `## Notícias Recentes\n${topNews || "Nenhuma notícia capturada"}\n\n`;

  if (teamFilter) {
    context += `## Filtro: Equipe ${teamFilter}\n`;
    const dir = hierarchy.hierarchy?.directors?.[teamFilter];
    if (dir) {
      context += `Diretor: ${dir.name} — ${dir.description}\n`;
      const managers = dir.manages || [];
      context += `Gerentes: ${managers.join(", ")}\n\n`;
    }
  }

  if (agentFilter) {
    context += `## Filtro: Agente ${agentFilter}\n`;
  }

  return context;
}

// ─── Executar agente ─────────────────────────────────────────────────────

async function executeAgent(manifest, context, client) {
  try {
    const result = await client.runAgent(manifest, context);
    return result;
  } catch (err) {
    return {
      agentId: manifest.id,
      agentName: manifest.name,
      content: `ERRO: ${err.message}`,
      status: "failed",
      timestamp: timestamp(),
    };
  }
}

// ─── Gerar relatório consolidado ────────────────────────────────────────

function generateReport(results, cycleType) {
  const now = timestamp();
  const reportDir = path.join(TEMP_DIR, "reports");
  ensureDir(reportDir);

  const lines = [`# Relatório Agent OS — ${cycleType}`, "", `**Gerado em:** ${now}`, ""];

  let successCount = 0;
  let failCount = 0;
  const byTeam = {};

  for (const r of results) {
    if (r.status === "completed") successCount++;
    else failCount++;

    const team = r.agentId?.split("-")[0] || "unknown";
    if (!byTeam[team]) byTeam[team] = [];
    byTeam[team].push(r);
  }

  lines.push(`## Resumo`);
  lines.push(`- Total: ${results.length} agentes`);
  lines.push(`- Sucesso: ${successCount}`);
  lines.push(`- Falhas: ${failCount}`);
  lines.push("");

  for (const [team, agents] of Object.entries(byTeam)) {
    lines.push(`## Equipe: ${team}`);
    for (const a of agents) {
      const statusIcon = a.status === "completed" ? "✅" : "❌";
      lines.push(`### ${statusIcon} ${a.agentName} (\`${a.agentId}\`)`);
      lines.push("");
      lines.push(a.content.slice(0, 500));
      lines.push("");
    }
  }

  const report = lines.join("\n");
  const reportFile = path.join(reportDir, `${cycleType}-${today()}.md`);
  fs.writeFileSync(reportFile, report);

  return { report, reportFile, successCount, failCount, total: results.length };
}

// ─── Salvar estado ──────────────────────────────────────────────────────

function saveState() {
  state.lastCycleAt = timestamp();
  state.lastCycleType = "full";
  state.cycles = (state.cycles || 0) + 1;
  state.agentsExecuted += state.agentsExecuted;
  writeJson(STATE_FILE, state);
}

// ─── Executar ciclo ─────────────────────────────────────────────────────

async function runCycle(options = {}) {
  const cycleType = options.cycle || options.team || options.agent || "full";
  const teamFilter = options.team || null;
  const agentFilter = options.agent || null;
  const watchMode = options.watch || false;

  const client = new LlmClient();
  const healthy = await client.healthCheck();

  console.log(`\n🚀 Agent OS — Ciclo ${cycleType.toUpperCase()}`);
  console.log(`   LLM: ${healthy ? "✅ Online" : "❌ Offline (fallback mode)"}`);
  console.log(`   Data: ${today()}`);
  console.log(`   Hora: ${new Date().toLocaleTimeString("pt-BR")}\n`);

  const context = buildContext(teamFilter, agentFilter);
  const hierarchy = loadHierarchy();
  const results = [];

  // Determinar quais agentes executar
  const agentsToRun = [];

  if (agentFilter) {
    // Executar agente específico
    const allAgents = getAllAgentManifests(hierarchy);
    const found = allAgents.find(a => a.id === agentFilter);
    if (found) agentsToRun.push(found);
  } else if (teamFilter) {
    // Executar equipe
    const teamAgents = getTeamAgents(hierarchy, teamFilter);
    agentsToRun.push(...teamAgents);
  } else {
    // Executar todos os especialistas + CEO + diretores
    agentsToRun.push(...getCEOManifest(hierarchy));
    agentsToRun.push(...getDirectorsManifests(hierarchy));
    agentsToRun.push(...getSpecialistsManifests(hierarchy));
  }

  console.log(`   Agentes na fila: ${agentsToRun.length}\n`);

  // Executar cada agente
  for (let i = 0; i < agentsToRun.length; i++) {
    const manifest = agentsToRun[i];
    process.stdout.write(`   [${i + 1}/${agentsToRun.length}] ${manifest.name}... `);

    const result = await executeAgent(manifest, context, client);
    results.push(result);

    if (result.status === "completed") {
      const contentLen = result.content.length;
      console.log(`✅ (${contentLen} chars)`);
    } else {
      console.log(`❌ ${result.content.slice(0, 50)}`);
    }

    // Pequena pausa entre agentes para não sobrecarregar a LLM
    await new Promise(r => setTimeout(r, 500));
  }

  // Gerar relatório
  const { report, reportFile, successCount, failCount, total } = generateReport(results, cycleType);

  // Salvar estado
  state.agentsExecuted = (state.agentsExecuted || 0) + total;
  state.reportsGenerated = (state.reportsGenerated || 0) + 1;
  if (failCount > 0) state.errors.push({ timestamp, cycle: cycleType, failed: failCount });
  saveState();

  // Output
  console.log(`\n📊 Resultado:`);
  console.log(`   Total: ${total} | ✅ ${successCount} | ❌ ${failCount}`);
  console.log(`   Relatório: ${reportFile}`);
  console.log(`\n${"=".repeat(60)}`);
  console.log(report.slice(0, 3000));
  console.log(`${"=".repeat(60)}\n`);

  // Gerar payload para o supervisor
  generateSupervisorPayload(results);

  return { results, report, reportFile };
}

// ─── Helpers de hierarquia ──────────────────────────────────────────────

function getAllAgentManifests(hierarchy) {
  const agents = [];
  const dirs = hierarchy.hierarchy?.directors || {};

  // CEO
  const ceo = hierarchy.hierarchy?.ceo;
  if (ceo) agents.push({ ...ceo, subroutines: getCEOSubroutines() });

  // Diretores
  for (const [key, dir] of Object.entries(dirs)) {
    agents.push({ ...dir, subroutines: getDirectorSubroutines(key) });
  }

  // Gerentes
  const managers = hierarchy.hierarchy?.managers || {};
  for (const [key, mgr] of Object.entries(managers)) {
    agents.push({ ...mgr, subroutines: getManagerSubroutines(key) });
  }

  return agents;
}

function getTeamAgents(hierarchy, team) {
  const agents = [];
  const dirs = hierarchy.hierarchy?.directors || {};
  const managers = hierarchy.hierarchy?.managers || {};

  // Mapear team para diretor
  const teamToDirector = {
    tecnologia: "dir-tecnologia",
    editorial: "dir-editorial",
    design: "dir-design",
    crescimento: "dir-crescimento",
    seguranca: "auditor-geral",
  };

  const dirKey = teamToDirector[team];
  if (dirKey && dirs[dirKey]) {
    agents.push({ ...dirs[dirKey], subroutines: getDirectorSubroutines(dirKey) });
  }

  // Adicionar gerentes da equipe
  const teamToManagers = {
    tecnologia: ["gerente-backend", "gerente-frontend", "gerente-ia", "gerente-seguranca"],
    editorial: ["gerente-noticias", "gerente-conteudo", "gerente-social", "gerente-pesquisa"],
    design: ["gerente-visual", "gerente-motion", "gerente-criativo"],
    crescimento: ["gerente-analytics", "gerente-engajamento", "gerente-monetizacao"],
    seguranca: ["auditor-codigo", "auditor-editorial", "auditor-estrategico"],
  };

  const mgrKeys = teamToManagers[team] || [];
  for (const key of mgrKeys) {
    if (managers[key]) {
      agents.push({ ...managers[key], subroutines: getManagerSubroutines(key) });
    }
  }

  return agents;
}

function getCEOManifest(hierarchy) {
  const ceo = hierarchy.hierarchy?.ceo;
  if (!ceo) return [];
  return [{ ...ceo, subroutines: getCEOSubroutines() }];
}

function getDirectorsManifests(hierarchy) {
  const dirs = hierarchy.hierarchy?.directors || {};
  return Object.entries(dirs).map(([key, dir]) => ({
    ...dir,
    subroutines: getDirectorSubroutines(key),
  }));
}

function getSpecialistsManifests(hierarchy) {
  // Carregar especialistas do manifest
  const file = path.join(AGENT_OS_DIR, "specialists", "specialists-manifest.md");
  if (!fs.existsSync(file)) return [];
  const content = fs.readFileSync(file, "utf8");
  const specialists = [];
  const regex = /### ESP-(\d+): (.+?)\n- \*\*Cargo:\*\* (.+?)\n- \*\*Especialidade:\*\* (.+?)\n- \*\*Sub-rotinas:\*\n([\s\S]*?)(?=\n### ESP-|\n## Diretor|$)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const subroutines = [];
    const subMatch = match[5].match(/- ROTINA [A-Z0-9]+: (.+)/g);
    if (subMatch) {
      for (const s of subMatch) {
        subroutines.push(s.replace("- ROTINA ", "ROTINA "));
      }
    }
    specialists.push({
      id: `esp-${match[1]}`,
      name: match[2],
      cargo: match[3],
      specialty: match[4],
      subroutines,
      llmModel: process.env.CZS_OLLAMA_MODEL || ":3b",
      temperature: 0.3,
      maxTokens: 1500,
    });
  }
  return specialists;
}

// ─── Sub-rotinas ─────────────────────────────────────────────────────────

function getCEOSubroutines() {
  return [
    "ROTINA 01 — Daily Brief: consultar endpoints, gerar resumo por diretor, decidir prioridades",
    "ROTINA 02 — Weekly Planning: analisar relatórios da semana, definir 3-5 prioridades, aprovar planos",
    "ROTINA 03 — Monthly Review: consolidar métricas, ajustar estratégia, reportar ao usuário",
    "ROTINA 04 — Crisis Response: detectar queda de métrica, consultar diretor, definir ação corretiva",
    "ROTINA 05 — Strategic Questions: perguntar sobre SEO, Instagram, crescimento, bugs, melhorias",
  ];
}

function getDirectorSubroutines(key) {
  const routines = {
    "dir-tecnologia": [
      "ROTINA A: Receber relatórios de backend, frontend, IA e segurança",
      "ROTINA B: Consolidar problemas técnicos",
      "ROTINA C: Priorizar por severidade e impacto",
      "ROTINA D: Aprovar ou bloquear deploy",
      "ROTINA E: Reportar ao CEO",
    ],
    "dir-editorial": [
      "ROTINA A: Receber relatórios de notícias, conteúdo, social e pesquisa",
      "ROTINA B: Verificar fact-checking e qualidade editorial",
      "ROTINA C: Aprovar ou rejeitar conteúdo",
      "ROTINA D: Reportar ao CEO",
    ],
    "dir-design": [
      "ROTINA A: Receber relatórios de UI, motion e criativo",
      "ROTINA B: Verificar consistência de marca",
      "ROTINA C: Aprovar ou rejeitar mudanças visuais",
      "ROTINA D: Reportar ao CEO",
    ],
    "dir-crescimento": [
      "ROTINA A: Receber relatórios de analytics, engajamento e monetização",
      "ROTINA B: Identificar oportunidades de crescimento",
      "ROTINA C: Propor experimentos",
      "ROTINA D: Reportar ao CEO",
    ],
    "auditor-geral": [
      "ROTINA A: Receber relatórios de código, editorial e estratégico",
      "ROTINA B: Verificar se mudanças entregaram valor",
      "ROTINA C: Rejeitar alterações sem ROI",
      "ROTINA D: Reportar ao CEO",
    ],
  };
  return routines[key] || ["ROTINA A: Receber relatórios", "ROTINA B: Consolidar", "ROTINA C: Reportar"];
}

function getManagerSubroutines(key) {
  const routines = {
    "gerente-backend": ["ROTINA A: Receber relatórios", "ROTINA B: Agrupar problemas", "ROTINA C: Remover duplicatas", "ROTINA D: Priorizar", "ROTINA E: Enviar ao Diretor"],
    "gerente-frontend": ["ROTINA A: Receber relatórios de UX/frontend", "ROTINA B: Consolidar problemas visuais", "ROTINA C: Priorizar por impacto", "ROTINA D: Enviar ao Diretor"],
    "gerente-ia": ["ROTINA A: Verificar saúde dos modelos", "ROTINA B: Monitorar custos", "ROTINA C: Otimizar prompts", "ROTINA D: Reportar ao Diretor"],
    "gerente-seguranca": ["ROTINA A: Rodar auditoria semanal", "ROTINA B: Consolidar vulnerabilidades", "ROTINA C: Priorizar correções", "ROTINA D: Reportar ao Diretor"],
    "gerente-noticias": ["ROTINA A: Receber relatórios de notícias", "ROTINA B: Verificar fact-checking", "ROTINA C: Priorizar pautas", "ROTINA D: Enviar ao Diretor"],
    "gerente-conteudo": ["ROTINA A: Revisar copy", "ROTINA B: Verificar SEO", "ROTINA C: Propor melhorias", "ROTINA D: Enviar ao Diretor"],
    "gerente-social": ["ROTINA A: Receber propostas de post", "ROTINA B: Verificar preview", "ROTINA C: Aprovar/rejeitar", "ROTINA D: Agendar publicação"],
    "gerente-pesquisa": ["ROTINA A: Verificar fontes RSS", "ROTINA B: Buscar vídeos virais", "ROTINA C: Validar conteúdo", "ROTINA D: Enviar ao Diretor"],
    "gerente-visual": ["ROTINA A: Revisar consistência visual", "ROTINA B: Verificar acessibilidade", "ROTINA C: Aprovar/rejeitar", "ROTINA D: Reportar ao Diretor"],
    "gerente-motion": ["ROTINA A: Verificar performance de animações", "ROTINA B: Revisar motion design", "ROTINA C: Aprovar/rejeitar", "ROTINA D: Reportar ao Diretor"],
    "gerente-criativo": ["ROTINA A: Revisar criativos", "ROTINA B: Verificar conversão", "ROTINA C: Aprovar/rejeitar", "ROTINA D: Reportar ao Diretor"],
    "gerente-analytics": ["ROTINA A: Consolidar métricas", "ROTINA B: Identificar anomalias", "ROTINA C: Gerar relatório semanal", "ROTINA D: Reportar ao Diretor"],
    "gerente-engajamento": ["ROTINA A: Consolidar dados de engajamento", "ROTINA B: Identificar padrões", "ROTINA C: Propor ajustes", "ROTINA D: Reportar ao Diretor"],
    "gerente-monetizacao": ["ROTINA A: Consolidar dados de receita", "ROTINA B: Calcular ROI", "ROTINA C: Propor oportunidades", "ROTINA D: Reportar ao Diretor"],
    "auditor-codigo": ["ROTINA A: Rodar review:team", "ROTINA B: Verificar code smells", "ROTINA C: Verificar vulnerabilidades", "ROTINA D: Rejeitar código inseguro"],
    "auditor-editorial": ["ROTINA A: Verificar factualidade", "ROTINA B: Verificar tom editorial", "ROTINA C: Bloquear conteúdo inadequado", "ROTINA D: Reportar ao CEO"],
    "auditor-estrategico": ["ROTINA A: Verificar ROI", "ROTINA B: Comparar métricas antes/depois", "ROTINA C: Rejeitar mudanças sem valor", "ROTINA D: Reportar ao CEO"],
  };
  return routines[key] || ["ROTINA A: Processar", "ROTINA B: Reportar"];
}

// ─── Gerar payload do supervisor ────────────────────────────────────────

function generateSupervisorPayload(results) {
  ensureDir(TEMP_DIR);
  const payload = {
    generatedAt: timestamp(),
    cycle: "full",
    summary: {
      totalAgents: results.length,
      success: results.filter(r => r.status === "completed").length,
      failed: results.filter(r => r.status === "failed").length,
    },
    teams: {},
    agents: results.map(r => ({
      id: r.agentId,
      name: r.agentName,
      status: r.status,
      content: r.content,
      timestamp: r.timestamp,
    })),
  };

  // Agrupar por time
  for (const r of results) {
    const team = r.agentId?.split("-")[0] || "unknown";
    if (!payload.teams[team]) payload.teams[team] = { total: 0, success: 0, failed: 0 };
    payload.teams[team].total++;
    if (r.status === "completed") payload.teams[team].success++;
    else payload.teams[team].failed++;
  }

  const payloadFile = path.join(TEMP_DIR, "supervisor-payload.json");
  fs.writeFileSync(payloadFile, JSON.stringify(payload, null, 2));
  return payload;
}

// ─── Watch mode ──────────────────────────────────────────────────────────

async function watchMode() {
  const intervalMs = parseInt(process.env.AGENT_OS_CYCLE_INTERVAL_MS || "300000", 10);
  console.log(`👁️  Agent OS Watch Mode — ciclo a cada ${intervalMs / 1000 / 60}min\n`);

  while (true) {
    try {
      await runCycle({ cycle: "watch", watch: true });
    } catch (err) {
      console.error(`❌ Erro no ciclo: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
}

// ─── CLI ─────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--cycle" && args[i + 1]) { opts.cycle = args[++i]; }
    else if (arg === "--team" && args[i + 1]) { opts.team = args[++i]; }
    else if (arg === "--agent" && args[i + 1]) { opts.agent = args[++i]; }
    else if (arg === "--report" && args[i + 1]) { opts.report = args[++i]; }
    else if (arg === "--watch") { opts.watch = true; }
    else if (arg === "--help" || arg === "-h") { printHelp(); process.exit(0); }
  }

  return opts;
}

function printHelp() {
  console.log(`
Agent OS Runtime

Uso:
  node agent-os-runtime.js --cycle full       Ciclo completo (todos os agentes)
  node agent-os-runtime.js --team editorial   Apenas equipe editorial
  node agent-os-runtime.js --agent esp-017    Agente específico
  node agent-os-runtime.js --report weekly    Relatório semanal
  node agent-os-runtime.js --watch            Ciclo contínuo (5min)

Variáveis:
  LLM_API_URL         URL da API LLM (default: http://127.0.0.1:11434/v1/chat/completions)
  LLM_MODEL           Modelo LLM (default: :3b)
  LLM_TIMEOUT_MS      Timeout em ms (default: 90000)
  AGENT_OS_CYCLE_INTERVAL_MS  Intervalo do watch mode em ms (default: 300000)
  `);
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();

  if (opts.watch) {
    await watchMode();
    return;
  }

  try {
    await runCycle(opts);
  } catch (err) {
    console.error(`❌ Erro fatal: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
