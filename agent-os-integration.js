/**
 * Agent OS — Integração com server.js (Render)
 *
 * Funciona DENTRO do servidor principal no Render.
 * - Ciclo automático a cada 1h
 * - Coleta contexto real do site (notícias, erros, fotos, SEO, destaques)
 * - Cada agente executa tarefas reais e emite relatórios
 * - Claude acessa os relatórios via API e implementa as mudanças
 *
 * Uso no server.js:
 *   const agentOs = require('./agent-os-integration');
 *   agentOs.start(); // inicia ciclo automático
 */

const fs = require("fs");
const path = require("path");
const http = require("http");

const ROOT = path.resolve(__dirname, ".");
const AGENT_OS_DIR = path.join(ROOT, "agent-os");

// On Render, use disk-mounted directory for persistence
// render.yaml mounts disk at /opt/render/project/src/render-data
const IS_RENDER = process.env.RENDER === "true" || process.env.NODE_ENV === "production";
const PERSISTENT_ROOT = IS_RENDER
  ? (process.env.DATA_DIR || path.join(ROOT, "..", "render-data"))
  : ROOT;

const DATA_DIR = path.join(PERSISTENT_ROOT, "data");
const TEMP_DIR = path.join(PERSISTENT_ROOT, ".codex-temp", "agent-os");
const MEMORY_DIR = path.join(DATA_DIR, "agent-os-memory");
const MANIFESTS_DIR = path.join(AGENT_OS_DIR, "manifests");
const REPORTS_DIR = path.join(TEMP_DIR, "reports");
const PENDING_DIR = path.join(TEMP_DIR, "pending");
const MEETINGS_DIR = path.join(TEMP_DIR, "meetings");
const ACTIONS_LOG_DIR = path.join(TEMP_DIR, "actions-log");
const INSTAGRAM_SYNC_DIR = path.join(TEMP_DIR, "instagram-sync");
const TEST_RESULTS_DIR = path.join(TEMP_DIR, "test-results");

const CYCLE_INTERVAL_MS = parseInt(process.env.AGENT_OS_CYCLE_INTERVAL_MS || process.env.AGENT_OS_CYCLE_MS || "3600000", 10); // 1h
const CYCLE_ON_START = /^(1|true|yes|sim)$/i.test(process.env.AGENT_OS_CYCLE_ON_START || "1");
const LLM_URL = process.env.AGENT_OS_LLM_URL || process.env.LLM_API_URL || process.env.CZS_LLM_URL || "http://127.0.0.1:11434/v1/chat/completions";
const LLM_MODEL = process.env.AGENT_OS_LLM_MODEL || process.env.CZS_OLLAMA_MODEL || process.env.LLM_MODEL || "llama3.2:3b";
const LLM_TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS || "90000", 10);

let timer = null;
let running = false;

// ─── Helpers ──────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; }
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

function now() { return new Date().toISOString(); }
function today() { return new Date().toISOString().split("T")[0]; }
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

function loadManifests() {
  const indexFile = path.join(MANIFESTS_DIR, "INDEX.json");
  if (!fs.existsSync(indexFile)) return null;
  const index = readJson(indexFile, {});
  if (Array.isArray(index.manifests)) {
    const lookup = {};
    for (const m of index.manifests) {
      if (m?.id) lookup[m.id] = m;
    }
    index.manifests = lookup;
    index.total = Object.keys(lookup).length;
  }
  return index;
}

function getNews() {
  try {
    const runtime = readJson(path.join(DATA_DIR, "runtime-news.json"), { items: [] });
    if (runtime.items?.length) return runtime.items.slice(0, 30);
    const archive = readJson(path.join(DATA_DIR, "news-archive.json"), { items: [] });
    return archive.items?.slice(0, 30) || [];
  } catch {
    return [];
  }
}

function getSiteContext() {
  // Gather real context from the site
  const context = {
    news: getNews(),
    newsCount: 0,
    businessesCount: 0,
    commentsCount: 0,
    subscriptionsCount: 0,
    pubpaidDepositsCount: 0,
    timestamp: new Date().toISOString(),
  };

  try {
    const comments = readJson(path.join(DATA_DIR, "comments.json"), []);
    context.commentsCount = Array.isArray(comments) ? comments.length : 0;
  } catch {}

  try {
    const subs = readJson(path.join(DATA_DIR, "subscriptions.json"), []);
    context.subscriptionsCount = Array.isArray(subs) ? subs.length : 0;
  } catch {}

  try {
    const deposits = readJson(path.join(DATA_DIR, "pubpaid-deposits.json"), []);
    context.pubpaidDepositsCount = Array.isArray(deposits) ? deposits.length : 0;
  } catch {}

  try {
    const biz = readJson(path.join(DATA_DIR, "businesses.json"), []);
    context.businessesCount = Array.isArray(biz) ? biz.length : 0;
  } catch {}

  context.newsCount = context.news.length;

  return context;
}

// ─── Agent Execution ──────────────────────────────────────────────────

function buildAgentPrompt(manifest, context, mode = "report") {
  const specialty = manifest.specialty || manifest.cargo || "geral";
  const routines = (manifest.routines || []).map((r, i) => `${i + 1}. ${r}`).join("\n");
  const memoryContext = buildMemoryContext(manifest.id);

  const contextBlock = [
    `## Contexto do Site (${new Date().toLocaleDateString("pt-BR")})`,
    ``,
    `### Notícias (${context.news.length} no sistema)`,
    context.news.slice(0, 8).map((n, i) => `${i + 1}. "${n.title || n.headline || "Sem título"}"`).join("\n") || "Nenhuma",
    ``,
    `### Métricas`,
    `- Notícias: ${context.metrics?.newsCount ?? context.newsCount ?? context.news.length}`,
    `- Comentários: ${context.metrics?.commentsCount ?? context.commentsCount ?? 0}`,
    `- Inscrições: ${context.metrics?.subscriptionsCount ?? context.subscriptionsCount ?? 0}`,
    `- Empresas: ${context.metrics?.businessesCount ?? context.businessesCount ?? 0}`,
    `- Anúncios pendentes: ${context.metrics?.pendingAds ?? context.pubpaidDepositsCount ?? 0}`,
    `- Notícias sem imagem: ${context.metrics?.issues?.missingImages ?? 0}`,
    ``,
  ].join("\n");

  if (mode === "meeting") {
    return `Você é ${manifest.name}, ${manifest.cargo}. Especialidade: ${specialty}.

Você está em uma REUNIÃO. Dê sua OPINIÃO profissional baseada em dados.

${contextBlock}

## Tópico
${context.meetingTopic || "Geral"}

${context.meetingHistory ? "## Histórico\n" + context.meetingHistory.slice(0, 1500) : ""}

${memoryContext}

Seja direto e opinativo. Máximo 200 palavras.`;
  }

  return `Você é ${manifest.name}.
Cargo: ${manifest.cargo}.
Especialidade: ${specialty}.

## Suas sub-rotinas (SOPs):
${routines || "1. Analisar.\n2. Reportar."}

${contextBlock}

${memoryContext}

## Instrução
Gere relatório com: achados, análise, recomendações e ações pendentes.
Seja OPINATIVO. Priorize crescimento e viralização.`;
}

async function callLLM(systemPrompt, userPrompt) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await fetch(LLM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 2000,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`LLM returned ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      console.error(`   ⏱️ LLM timeout após ${LLM_TIMEOUT_MS}ms`);
    } else {
      console.error(`   ❌ LLM error: ${err.message}`);
    }
    return null;
  }
}

async function executeAgent(manifest, context, mode = "report") {
  const startTime = Date.now();
  const memoryContext = buildMemoryContext(manifest.id);
  const systemPrompt = buildAgentPrompt(manifest, context, mode) + "\n\n" + memoryContext;
  const userPrompt = mode === "meeting"
    ? `Dê sua opinião sobre: "${context.meetingTopic || 'estado do site'}"`
    : `Execute suas sub-rotinas e gere relatório completo.`;

  const content = await callLLM(systemPrompt, userPrompt);
  const duration = Date.now() - startTime;

  if (!content) {
    saveAgentMemory(manifest.id, { type: mode, cycle: context.cycleLabel || today(), duration, status: "fallback", summary: "LLM indisponível" });
    return {
      agentId: manifest.id,
      agentName: manifest.name,
      cargo: manifest.cargo,
      level: manifest.level,
      status: "fallback",
      duration,
      content: `## ${manifest.name}\n\nLLM indisponível — relatório não gerado.\n\n**Recomendação:** Verificar LLM em ${LLM_URL}`,
      timestamp: now(),
    };
  }

  saveAgentMemory(manifest.id, {
    type: mode === "meeting" ? "meeting" : "cycle",
    cycle: context.cycleLabel || today(),
    duration,
    summary: content.slice(0, 200),
    data: { status: "ok", duration },
  });

  return {
    agentId: manifest.id,
    agentName: manifest.name,
    cargo: manifest.cargo,
    level: manifest.level,
    status: "ok",
    duration,
    content,
    timestamp: now(),
  };
}

// ─── Cycle ─────────────────────────────────────────────────────────────

async function runCycle(options = {}) {
  if (running) {
    return { ok: false, error: "Ciclo já em execução" };
  }

  running = true;
  const cycleStart = Date.now();
  const cycleLabel = options.cycle || `auto-${new Date().toISOString().split("T")[0]}`;

  console.log(`\n🧠 Agent OS — Ciclo: ${cycleLabel}`);

  try {
    const manifests = loadManifests();
    if (!manifests?.manifests) {
      return { ok: false, error: "Manifestos não encontrados. Execute: node agent-os/runtime/generate-manifests.js" };
    }

    const context = getSiteContext();
    const allManifests = manifests.manifests;
    const results = [];

    // Determine which agents to run
    let agentsToRun = [];

    if (options.agent) {
      const found = allManifests[options.agent];
      if (found) agentsToRun.push(found);
    } else if (options.team) {
      // Run director + managers for a team
      const teamDirMap = {
        tecnologia: "dir-tecnologia",
        editorial: "dir-editorial",
        design: "dir-design",
        crescimento: "dir-crescimento",
        auditoria: "auditor-geral",
      };
      const dirId = teamDirMap[options.team];
      if (dirId) {
        const dir = allManifests[dirId];
        if (dir) {
          agentsToRun.push(dir);
          for (const mgrId of dir.manages || []) {
            const mgr = allManifests[mgrId];
            if (mgr) agentsToRun.push(mgr);
          }
        }
      }
    } else {
      // Full cycle: CEO + Directors + Managers
      const ceo = allManifests["ceo-supervisor"];
      if (ceo) agentsToRun.push(ceo);

      const directors = Object.values(allManifests).filter(m => m.level === "director");
      for (const dir of directors) {
        agentsToRun.push(dir);
        for (const mgrId of dir.manages || []) {
          const mgr = allManifests[mgrId];
          if (mgr) agentsToRun.push(mgr);
        }
      }
    }

    console.log(`   Executando ${agentsToRun.length} agentes...`);

    // Execute agents (with LLM concurrency limit of 3)
    const CONCURRENCY = 3;
    for (let i = 0; i < agentsToRun.length; i += CONCURRENCY) {
      const batch = agentsToRun.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.allSettled(
        batch.map(m => executeAgent(m, context))
      );

      for (let j = 0; j < batchResults.length; j++) {
        const settled = batchResults[j];
        if (settled.status === "fulfilled") {
          results.push(settled.value);
        } else {
          results.push({
            agentId: batch[j].id,
            agentName: batch[j].name,
            cargo: batch[j].cargo,
            level: batch[j].level,
            status: "error",
            duration: 0,
            content: `Erro: ${settled.reason?.message || "desconhecido"}`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    const successCount = results.filter(r => r.status === "ok").length;
    const fallbackCount = results.filter(r => r.status === "fallback").length;
    const errorCount = results.filter(r => r.status === "error").length;

    // Generate master report
    ensureDir(REPORTS_DIR);
    const reportDate = new Date().toISOString().split("T")[0];
    const reportLines = [
      `# 🧠 Agent OS — Relatório do Ciclo`,
      `**Ciclo:** ${cycleLabel}`,
      `**Data:** ${new Date().toLocaleString("pt-BR")}`,
      `**Duração:** ${((Date.now() - cycleStart) / 1000).toFixed(1)}s`,
      `**LLM:** ${LLM_URL} (${LLM_MODEL})`,
      ``,
      `## 📊 Resumo`,
      `- Total de agentes: ${results.length}`,
      `- ✅ Sucesso: ${successCount}`,
      `- ⚠️ Fallback: ${fallbackCount}`,
      `- ❌ Erro: ${errorCount}`,
      ``,
      `## 📰 Contexto do Site`,
      `- Notícias: ${context.newsCount}`,
      `- Comentários: ${context.commentsCount}`,
      `- Inscrições: ${context.subscriptionsCount}`,
      `- Anúncios pendentes: ${context.pubpaidDepositsCount}`,
      `- Empresas: ${context.businessesCount}`,
      ``,
      `---`,
      ``,
    ];

    // Group by level
    const byLevel = {};
    for (const r of results) {
      const level = r.level || "unknown";
      if (!byLevel[level]) byLevel[level] = [];
      byLevel[level].push(r);
    }

    const levelOrder = ["ceo", "director", "manager", "specialist", "unknown"];
    const levelNames = { ceo: "🎯 CEO", director: "📋 Diretores", manager: "👔 Gerentes", specialist: "🔧 Especialistas", unknown: "❓ Outros" };

    for (const level of levelOrder) {
      const agents = byLevel[level];
      if (!agents?.length) continue;

      reportLines.push(`## ${levelNames[level] || level}`);
      reportLines.push("");

      for (const r of agents) {
        const statusIcon = r.status === "ok" ? "✅" : r.status === "fallback" ? "⚠️" : "❌";
        reportLines.push(`### ${statusIcon} ${r.agentName} (\`${r.agentId}\`)`);
        reportLines.push(`**Cargo:** ${r.cargo} | **Duração:** ${r.duration}ms`);
        reportLines.push("");
        reportLines.push(r.content.slice(0, 1500));
        reportLines.push("");
        reportLines.push("---");
        reportLines.push("");
      }
    }

    const report = reportLines.join("\n");
    const reportFile = path.join(REPORTS_DIR, `cycle-${reportDate}-${Date.now()}.md`);
    writeJson(reportFile, report);

    // Also write latest report for easy access
    writeJson(path.join(REPORTS_DIR, "latest.md"), report);

    // Write pending actions for Claude to pick up
    const pendingActions = extractPendingActions(results);
    if (pendingActions.length > 0) {
      writeJson(path.join(PENDING_DIR, `actions-${reportDate}.json`), {
        cycle: cycleLabel,
        generatedAt: new Date().toISOString(),
        actions: pendingActions,
      });
    }

    // Update state
    const STATE_FILE = path.join(DATA_DIR, "agent-os-state.json");
    const state = readJson(STATE_FILE, {
      version: "1.0.0",
      cycles: 0,
      agentsExecuted: 0,
      reportsGenerated: 0,
      lastCycleAt: null,
      lastError: "",
      running: false,
    });
    state.lastCycleAt = new Date().toISOString();
    state.cycles = (state.cycles || 0) + 1;
    state.agentsExecuted = (state.agentsExecuted || 0) + results.length;
    state.reportsGenerated = (state.reportsGenerated || 0) + 1;
    state.lastSummary = { total: results.length, success: successCount, fallback: fallbackCount, error: errorCount };
    state.lastError = "";
    state.running = false;
    writeJson(STATE_FILE, state);

    const durationSec = ((Date.now() - cycleStart) / 1000).toFixed(1);
    console.log(`   ✅ Ciclo concluído: ${successCount}/${results.length} OK (${durationSec}s)`);

    // Generate Instagram sync for Codex/Claude
    const instagramSync = generateInstagramSync(cycleLabel, results, context);
    if (instagramSync) {
      writeInstagramSync(instagramSync);
    }

    return {
      ok: true,
      cycle: cycleLabel,
      summary: { total: results.length, success: successCount, fallback: fallbackCount, error: errorCount },
      duration: `${durationSec}s`,
      agents: results.slice(0, 30),
      reportFile: `agent-os/reports/cycle-${reportDate}-${Date.now()}.md`,
      pendingActions: pendingActions.length,
    };

  } catch (err) {
    console.error(`   ❌ Erro no ciclo: ${err.message}`);
    const STATE_FILE = path.join(DATA_DIR, "agent-os-state.json");
    const state = readJson(STATE_FILE, { version: "1.0.0", cycles: 0, agentsExecuted: 0, reportsGenerated: 0 });
    state.lastError = err.message;
    state.running = false;
    writeJson(STATE_FILE, state);
    return { ok: false, error: err.message };
  } finally {
    running = false;
  }
}

function extractPendingActions(results) {
  const actions = [];
  for (const r of results) {
    if (r.status !== "ok") continue;

    // Extract action items from report content
    const lines = r.content.split("\n");
    for (const line of lines) {
      // Look for action-like patterns
      if (line.match(/^(✅|❌|⚠️|🔧|📋|📝|📸|🔍|📊|🚀|📈|🔒|⚡)/)) {
        actions.push({
          agent: r.agentId,
          agentName: r.agentName,
          action: line.replace(/^[^\s]+\s*/, "").trim(),
          priority: line.startsWith("❌") || line.startsWith("🔒") ? "high" : "medium",
        });
      }
    }

    // Look for sections that mention specific actions
    const actionMatch = r.content.match(/### Ações?[:\s]*\n([\s\S]*?)(?:\n###|\n##|$)/i);
    if (actionMatch) {
      const actionLines = actionMatch[1].split("\n").filter(l => l.trim().startsWith("-") || l.trim().startsWith("*"));
      for (const al of actionLines.slice(0, 5)) {
        actions.push({
          agent: r.agentId,
          agentName: r.agentName,
          action: al.replace(/^[-*]\s*/, "").trim(),
          priority: "medium",
        });
      }
    }
  }
  return actions.slice(0, 50);
}

// ─── State & Reports (for API) ────────────────────────────────────────

function getState() {
  const manifests = loadManifests();
  const reports = loadReports();
  const state = readJson(path.join(DATA_DIR, "agent-os-state.json"), {
    version: "1.0.0",
    cycles: 0,
    agentsExecuted: 0,
    reportsGenerated: 0,
    lastCycleAt: null,
  });

  return {
    ok: true,
    ...state,
    totalManifests: manifests?.total || 0,
    reportsCount: reports.length,
    llmUrl: LLM_URL,
    llmModel: LLM_MODEL,
    llmAvailable: false, // checked separately
    autoCycle: {
      enabled: CYCLE_INTERVAL_MS > 0,
      intervalMs: CYCLE_INTERVAL_MS,
      intervalLabel: `${CYCLE_INTERVAL_MS / 1000 / 60} min`,
      started: !!timer,
    },
    meetingsEnabled: true,
    cheffeCallUrl: "/cheffe-call.html",
    supervisorUrl: "/cheffe-call-supervisor.html",
    teams: {
      tecnologia: { name: "Tecnologia", active: true },
      editorial: { name: "Editorial", active: true },
      design: { name: "Design", active: true },
      crescimento: { name: "Crescimento", active: true },
      auditoria: { name: "Auditoria", active: true },
    },
  };
}

function loadReports() {
  if (!fs.existsSync(REPORTS_DIR)) return [];
  const files = fs.readdirSync(REPORTS_DIR).filter(f => f.endsWith(".md"));
  return files
    .sort()
    .reverse()
    .slice(0, 20)
    .map(f => {
      const fullPath = path.join(REPORTS_DIR, f);
      const stat = fs.statSync(fullPath);
      return {
        title: f.replace(".md", "").replace(/cycle-/, ""),
        file: f,
        date: stat.mtime.toLocaleDateString("pt-BR"),
        time: stat.mtime.toLocaleTimeString("pt-BR"),
        size: stat.size,
        url: `/api/agent-os/reports/${encodeURIComponent(f)}`,
      };
    });
}

function getReport(filename) {
  const filePath = path.join(REPORTS_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  return { content: fs.readFileSync(filePath, "utf8"), filename };
}

function getPendingActions() {
  if (!fs.existsSync(PENDING_DIR)) return [];
  const files = fs.readdirSync(PENDING_DIR).filter(f => f.endsWith(".json"));
  const actions = [];
  for (const f of files) {
    const data = readJson(path.join(PENDING_DIR, f), { actions: [] });
    if (data.actions?.length) {
      actions.push(...data.actions.map(a => ({ ...a, source: f })));
    }
  }
  return actions.slice(0, 100);
}

// ─── Lifecycle ────────────────────────────────────────────────────────

function start() {
  if (timer) {
    console.log("🧠 Agent OS — Ciclo automático já iniciado");
    return;
  }

  console.log(`🧠 Agent OS — Ciclo automático: a cada ${CYCLE_INTERVAL_MS / 1000 / 60} minutos`);

  // Auto-cycle on start
  if (CYCLE_ON_START) {
    setTimeout(() => {
      runCycle({ cycle: "auto-start" }).catch(err => {
        console.error(`❌ Erro no ciclo inicial: ${err.message}`);
      });
    }, 5000); // Wait 5s for server to fully start
  }

  // Periodic auto-cycle
  timer = setInterval(() => {
    runCycle({ cycle: `auto-${new Date().toISOString().split("T")[0]}-${Date.now()}` })
      .then(result => {
        if (result.ok && result.pendingActions > 0) {
          console.log(`   📋 ${result.pendingActions} ações pendentes para Claude`);
        }
      })
      .catch(err => console.error(`❌ Erro no ciclo automático: ${err.message}`));
  }, CYCLE_INTERVAL_MS);

  console.log(`   ✅ Timer iniciado (intervalo: ${CYCLE_INTERVAL_MS / 1000 / 60} min)`);
}

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log("🧠 Agent OS — Ciclo automático parado");
  }
}

function isRunning() {
  return !!timer;
}

// ─── Site Actions ─────────────────────────────────────────────────────

const SiteActions = {
  createNews(title, body, source) {
    const news = getNews();
    const item = {
      id: uid(), title, headline: title,
      body: (body || title).slice(0, 500),
      source: source || "Agent OS", date: today(), publishedAt: now(),
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60),
      status: "published", createdAt: now(),
    };
    news.unshift(item);
    writeJson(path.join(DATA_DIR, "runtime-news.json"), { items: news, lastRefresh: now() });
    logAction("create-news", { id: item.id, title });
    return { ok: true, action: "create-news", item };
  },

  fixMissingImages() {
    const news = getNews();
    const count = news.filter(n => !n.image && !n.imageUrl).length;
    const updated = news.map(n => {
      if (!n.image && !n.imageUrl) return { ...n, image: "/assets/news-default.jpg", imageUrl: "/assets/news-default.jpg", fixedAt: now() };
      return n;
    });
    writeJson(path.join(DATA_DIR, "runtime-news.json"), { items: updated, lastRefresh: now() });
    logAction("fix-missing-images", { count });
    return { ok: true, action: "fix-missing-images", count };
  },

  analyzeSEO() {
    const news = getNews();
    const issues = {
      missingMeta: news.filter(n => !n.metaDescription && !n.description).length,
      shortTitles: news.filter(n => (n.title || "").length < 30).length,
      noSlug: news.filter(n => !n.slug).length,
    };
    const score = Math.max(0, 100 - (issues.missingMeta + issues.shortTitles + issues.noSlug) * 5);
    logAction("analyze-seo", issues);
    return { ok: true, action: "analyze-seo", issues, score };
  },

  analyzeEngagement() {
    const comments = getComments();
    const news = getNews();
    const result = {
      totalComments: Array.isArray(comments) ? comments.length : 0,
      topNews: news.slice(0, 5).map(n => n.title || n.headline),
      trendingTopics: extractTrendingTopics(news),
    };
    logAction("analyze-engagement", result);
    return { ok: true, action: "analyze-engagement", ...result };
  },
};

function extractTrendingTopics(news) {
  const words = {};
  const stop = new Set(["de","da","do","em","para","com","por","que","não","no","na","os","as","um","uma","seu","sua","mais","como","mas","foi","ser","tem","ano","dia","após","sobre"]);
  for (const item of news) {
    const text = (item.title || item.headline || "").toLowerCase();
    for (const w of text.split(/\s+/)) {
      if (w.length > 3 && !stop.has(w)) words[w] = (words[w] || 0) + 1;
    }
  }
  return Object.entries(words).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([word, count]) => ({ word, count }));
}

function logAction(type, data) {
  ensureDir(ACTIONS_LOG_DIR);
  const file = path.join(ACTIONS_LOG_DIR, `${today()}.jsonl`);
  fs.appendFileSync(file, JSON.stringify({ timestamp: now(), type, ...data }) + "\n");
}

// ─── Agent Memory (persistente para Codex/Claude ler) ─────────────────

const MEMORY_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function saveAgentMemory(agentId, entry) {
  ensureDir(MEMORY_DIR);
  const file = path.join(MEMORY_DIR, `${agentId}.json`);
  const memory = readJson(file, { agentId, entries: [], updatedAt: null });
  memory.entries.push({ timestamp: now(), ...entry });
  memory.entries = memory.entries.filter(e => Date.now() - new Date(e.timestamp).getTime() < MEMORY_TTL_MS);
  memory.updatedAt = now();
  writeJson(file, memory);
  return memory;
}

function loadAgentMemory(agentId) {
  const file = path.join(MEMORY_DIR, `${agentId}.json`);
  return readJson(file, { agentId, entries: [], updatedAt: null });
}

function loadAllAgentMemories() {
  if (!fs.existsSync(MEMORY_DIR)) return {};
  const files = fs.readdirSync(MEMORY_DIR).filter(f => f.endsWith(".json") && f !== "global.json");
  const memories = {};
  for (const f of files) {
    const data = readJson(path.join(MEMORY_DIR, f), null);
    if (data?.agentId) memories[data.agentId] = data;
  }
  return memories;
}

function saveGlobalMemory(key, value) {
  ensureDir(MEMORY_DIR);
  const file = path.join(MEMORY_DIR, "global.json");
  const memory = readJson(file, {});
  memory[key] = { timestamp: now(), value };
  memory.updatedAt = now();
  writeJson(file, memory);
}

function loadGlobalMemory(key, fallback) {
  const file = path.join(MEMORY_DIR, "global.json");
  const memory = readJson(file, {});
  return memory[key]?.value ?? fallback;
}

function buildMemoryContext(agentId) {
  const memory = loadAgentMemory(agentId);
  const recent = memory.entries.slice(-5);
  if (!recent.length) return "";
  return `## Memória Recente
${recent.map((e, i) => `${i + 1}. [${new Date(e.timestamp).toLocaleDateString("pt-BR")}] ${e.type || "event"}: ${JSON.stringify(e.data || e).slice(0, 150)}`).join("\n")}
Use essa memória para continuidade. Não repita ações já tomadas.`;
}

// ─── Instagram Sync Output ────────────────────────────────────────────

function writeInstagramSync(data) {
  ensureDir(INSTAGRAM_SYNC_DIR);
  const syncFile = path.join(INSTAGRAM_SYNC_DIR, `sync-${today()}-${Date.now().toString(36)}.json`);
  const payload = {
    generatedAt: now(),
    source: "Agent OS",
    cycle: data.cycle || "manual",
    items: data.items || [],
    topDrafts: data.topDrafts || [],
    hashtags: data.hashtags || [],
    captions: data.captions || [],
    schedule: data.schedule || [],
    notes: data.notes || "",
  };
  writeJson(syncFile, payload);
  writeJson(path.join(INSTAGRAM_SYNC_DIR, "latest.json"), payload);
  saveGlobalMemory("lastInstagramSync", { file: syncFile, generatedAt: now() });
  logAction("instagram-sync", { file: path.basename(syncFile), items: payload.items.length });
  return { ok: true, syncFile: path.basename(syncFile), url: `/api/agent-os/instagram-sync/${path.basename(syncFile)}` };
}

function getInstagramSyncLatest() {
  const latest = path.join(INSTAGRAM_SYNC_DIR, "latest.json");
  if (!fs.existsSync(latest)) return null;
  return readJson(latest, null);
}

function getAllInstagramSyncs() {
  if (!fs.existsSync(INSTAGRAM_SYNC_DIR)) return [];
  return fs.readdirSync(INSTAGRAM_SYNC_DIR)
    .filter(f => f.startsWith("sync-") && f.endsWith(".json") && f !== "latest.json")
    .sort()
    .reverse()
    .slice(0, 20)
    .map(f => {
      const data = readJson(path.join(INSTAGRAM_SYNC_DIR, f), {});
      return { file: f, generatedAt: data.generatedAt, items: data.items?.length || 0, cycle: data.cycle };
    });
}

function generateInstagramSync(cycleLabel, results, context) {
  const editorial = results.filter(r => r.agentId === "gerente-noticias" || r.agentId === "gerente-social" || r.agentId === "gerente-conteudo" || r.agentId === "gerente-engajamento");
  const social = results.filter(r => r.agentId.includes("social") || r.agentId.includes("instagram") || r.agentId.includes("engajamento"));
  const seo = results.filter(r => r.agentId.includes("seo") || r.agentId.includes("pesquisa"));

  const topDrafts = [];
  const hashtags = new Set();
  const captions = [];

  for (const r of [...editorial, ...social]) {
    if (r.status !== "ok" || !r.content) continue;
    // Extract draft-worthy lines
    const lines = r.content.split("\n").filter(l => l.trim().length > 20 && !l.startsWith("#"));
    for (const line of lines.slice(0, 5)) {
      if (line.match(/suger|propon|crie|faça|post|reel|story|legenda/i)) {
        topDrafts.push({ agent: r.agentName, suggestion: line.replace(/^[-*\s]+/, "").trim() });
      }
    }
    // Extract hashtags
    const tagMatches = r.content.match(/#[\wáàâãéèêíïóôõöúüç]+/gi) || [];
    tagMatches.forEach(t => hashtags.add(t));
  }

  if (!topDrafts.length && context.news.length > 0) {
    const top = context.news.slice(0, 3);
    for (const n of top) {
      topDrafts.push({ agent: "auto", suggestion: `${n.title || n.headline} — notícia em destaque para post` });
      hashtags.add("#notícias");
      hashtags.add("#cruzeirodosul");
      hashtags.add("#jurua");
    }
  }

  const schedule = [];
  if (topDrafts.length > 0) {
    const hours = ["08:00", "12:00", "17:00", "20:00"];
    for (let i = 0; i < Math.min(topDrafts.length, 4); i++) {
      schedule.push({ time: hours[i], draft: topDrafts[i].suggestion.slice(0, 120), hashtags: Array.from(hashtags).slice(0, 5) });
    }
  }

  const seoScore = seo.length > 0 && seo[0].content ? "ver relatório SEO" : "aguardando análise SEO";

  return {
    cycle: cycleLabel,
    generatedAt: now(),
    topDrafts: topDrafts.slice(0, 10),
    hashtags: Array.from(hashtags).slice(0, 20),
    captions,
    schedule,
    notes: `SEO: ${seoScore}. ${editorial.length} agentes editoriais opinaram. ${social.length} agentes sociais opinaram.`,
    items: context.news.slice(0, 10).map(n => n.title || n.headline),
  };
}

// ─── Meetings ─────────────────────────────────────────────────────────

async function startMeeting(topic, options = {}) {
  const meetingId = `meet-${today()}-${uid()}`;
  const manifests = loadManifests();
  if (!manifests?.manifests) return { ok: false, error: "Manifestos não encontrados" };

  const context = { metrics: getSiteMetrics(), news: getNews(), meetingTopic: topic };
  const participants = [];
  const ceo = getCEO();
  if (ceo) participants.push(ceo);
  for (const dir of getDirectors()) { if (participants.length < 12) participants.push(dir); }
  for (const spec of getSpecialists()) { if (participants.length < 12) participants.push(spec); }

  console.log(`\n🏛️ Reunião: "${topic}" (${participants.length} participantes)`);

  const meeting = { id: meetingId, topic, status: "in_progress", startedAt: now(), participants: participants.map(p => p.id), rounds: [], decisions: [] };
  ensureDir(MEETINGS_DIR);
  writeJson(path.join(MEETINGS_DIR, `${meetingId}.json`), meeting);

  let history = "";
  for (let round = 0; round < 3; round++) {
    for (const p of participants) {
      const result = await executeAgent(p, { ...context, meetingHistory: history }, "meeting");
      meeting.rounds = meeting.rounds || [];
      meeting.rounds.push({ round: round + 1, agent: p.id, preview: result.content.slice(0, 200) });
      history += `### ${result.agentName}: ${result.content.slice(0, 300)}\n\n`;
    }
    writeJson(path.join(MEETINGS_DIR, `${meetingId}.json`), meeting);
  }

  const decision = await callLLM("Você é o CEO. Sintetize: 1) Decisão, 2) Justificativa (1 frase), 3) Ações numeradas com responsável.", `Tópico: "${topic}"\n\n${history.slice(0, 3000)}`);

  meeting.status = "completed";
  meeting.endedAt = now();
  meeting.decision = decision;
  writeJson(path.join(MEETINGS_DIR, `${meetingId}.json`), meeting);

  console.log(`   ✅ Reunião concluída: ${meetingId}`);
  return { ok: true, meetingId, topic, participants: participants.length, rounds: meeting.rounds.length, decision, meeting };
}

// ─── Action Execution ─────────────────────────────────────────────────

function executeAction(type, params = {}) {
  const actions = SiteActions || {};
  switch (type) {
    case "create-news": return actions.createNews ? actions.createNews(params.title, params.body, params.source) : { ok: false, error: "Não disponível" };
    case "fix-missing-images": return actions.fixMissingImages ? actions.fixMissingImages() : { ok: false, error: "Não disponível" };
    case "analyze-seo": return actions.analyzeSEO ? actions.analyzeSEO() : { ok: false, error: "Não disponível" };
    case "analyze-engagement": return actions.analyzeEngagement ? actions.analyzeEngagement() : { ok: false, error: "Não disponível" };
    default: return { ok: false, error: `Ação "${type}" não reconhecida` };
  }
}

// ─── Public API ───────────────────────────────────────────────────────

module.exports = {
  // Lifecycle
  start,
  stop,
  isRunning,

  // Core
  runCycle,
  executeAgent,
  loadManifests,
  getSiteContext,
  startMeeting,
  executeAction,

  // State & Reports
  getState,
  loadReports,
  getReport,
  getPendingActions,

  // Agent Memory (para Codex/Claude ler e Instagram sync)
  saveAgentMemory,
  loadAgentMemory,
  loadAllAgentMemories,
  saveGlobalMemory,
  loadGlobalMemory,
  buildMemoryContext,

  // Instagram Sync Output
  writeInstagramSync,
  getInstagramSyncLatest,
  getAllInstagramSyncs,
  generateInstagramSync,

  // Site Actions
  SiteActions,

  // Config
  CONFIG: {
    CYCLE_INTERVAL_MS,
    LLM_URL,
    LLM_MODEL,
    LLM_TIMEOUT_MS,
    MANIFESTS_DIR,
    REPORTS_DIR,
    PENDING_DIR,
    MEMORY_DIR,
    INSTAGRAM_SYNC_DIR,
  },
};
