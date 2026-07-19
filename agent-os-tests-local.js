/**
 * Agent OS — Bateria de Testes e Competição (SEM LLM)
 *
 * Avalia agentes localmente baseado em:
 *  - Qualidade do manifesto
 *  - Rotinas (SOPs) definidas
 *  - Relevância com o contexto do site
 *  - Propostas de ação concretas
 *  - Memória
 *  - Originalidade
 *  - Uso de dados
 *
 * Uso:
 *   node agent-os-tests-local.js
 *   node agent-os-tests-local.js --team editorial
 *   node agent-os-tests-local.js --agent dir-editorial
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, ".");
const AGENT_OS = require(path.join(ROOT, "agent-os-integration"));

const args = process.argv.slice(2);
const filterTeam = args.includes("--team") ? args[args.indexOf("--team") + 1] : null;
const filterAgent = args.includes("--agent") ? args[args.indexOf("--agent") + 1] : null;

const MANIFESTS = AGENT_OS.loadManifests();
const RESULTS_DIR = path.join(ROOT, ".codex-temp", "agent-os", "test-results");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function timestamp() { return new Date().toISOString(); }
function today() { return new Date().toISOString().split("T")[0]; }

// ─── Test Suites (sem LLM) ─────────────────────────────────────────────

const TEST_SUITES = {
  manifestQuality: {
    name: "Manifesto",
    description: "Completude e qualidade do manifesto",
    weight: 1.0,
    run: (manifest) => {
      const routines = manifest.subroutines || manifest.routines || [];
      const specialty = manifest.specialty || manifest.cargo || "";

      let score = 0;
      const checks = {
        temNome: !!manifest.name && manifest.name.length > 3,
        temCargo: !!manifest.cargo && manifest.cargo.length > 3,
        temLevel: !!manifest.level && ["ceo","director","manager","specialist"].includes(manifest.level),
        temRotinas: Array.isArray(routines) && routines.length >= 3,
        temEspecialidade: !!specialty,
        temDescricao: !!manifest.description && manifest.description.length > 20,
        rotinasEspecificas: routines.some(r => r.length > 15),
        cargoDetalhado: (manifest.cargo || "").length > 15,
      };

      score = Object.values(checks).filter(Boolean).length;
      const maxScore = Object.keys(checks).length;
      return { score: Math.round((score / maxScore) * 100), maxScore, checks, details: `${score}/${maxScore} checks` };
    },
  },

  routineDepth: {
    name: "Rotinas",
    description: "Qualidade e especificidade das sub-rotinas (SOPs)",
    weight: 1.2,
    run: (manifest) => {
      const routines = manifest.subroutines || manifest.routines || [];
      if (!routines.length) return { score: 0, details: "Sem rotinas definidas" };

      const avgLength = routines.reduce((s, r) => s + r.length, 0) / routines.length;

      let score = 0;
      const checks = {
        temRotinas: routines.length >= 2,
        rotinasComConteudo: avgLength > 15,
        rotinasEspecificas: routines.some(r => /ROTINA|passo|etapa|\d\.|->/i.test(r)),
        rotinasAcao: routines.some(r => /criar|analis|gerar|verificar|monitorar|pesquisar|comparar|detectar|corrigir|publicar|receber|consolidar|tomar|enviar/i.test(r)),
        rotinasDados: routines.some(r => /not[íi]cia|site|seo|instagram|coment|m[eé]trica|relat[óo]rio/i.test(r)),
        coberturaAmpla: routines.length >= 3,
      };

      score = Object.values(checks).filter(Boolean).length;
      const maxScore = Object.keys(checks).length;
      return { score: Math.round((score / maxScore) * 100), maxScore, checks, details: `${routines.length} rotinas, tam médio ${Math.round(avgLength)}` };
    },
  },

  contextRelevance: {
    name: "Contexto",
    description: "Relevância do agente para o contexto atual do site",
    weight: 1.3,
    run: (manifest) => {
      const context = AGENT_OS.getSiteContext ? AGENT_OS.getSiteContext() : null;
      const newsCount = context?.news?.length || 0;
      const specialty = (manifest.specialty || manifest.cargo || "").toLowerCase();

      const relevanceKeywords = {
        noticias: ["not[íi]cia", "editorial", "jornalismo", "conte[úu]do", "redac"],
        instagram: ["instagram", "social", "reel", "story", "post", "hashtag"],
        seo: ["seo", "google", "busca", "palavra.chave", "meta", "otimizac"],
        codigo: ["backend", "frontend", "api", "banco", "performance", "seguranc"],
        design: ["ux", "ui", "design", "layout", "acessibilidade"],
        dados: ["analytics", "m[eé]trica", "dados", "convers[ãa]o", "engajamento"],
      };

      let matchedAreas = 0;
      for (const keywords of Object.values(relevanceKeywords)) {
        if (keywords.some(k => specialty.match(new RegExp(k, "i")))) {
          matchedAreas++;
        }
      }

      let score = 0;
      const checks = {
        areaRelevante: matchedAreas > 0,
        multiArea: matchedAreas >= 2,
        siteTemConteudo: newsCount > 0,
        alinhadoComSite: newsCount > 0 && matchedAreas > 0,
        especialidadeClara: !!manifest.specialty,
      };

      score = Object.values(checks).filter(Boolean).length;
      const maxScore = Object.keys(checks).length;
      const contextBonus = matchedAreas > 0 ? 10 : 0;

      return {
        score: Math.min(100, Math.round((score / maxScore) * 100) + contextBonus),
        maxScore,
        checks,
        matchedAreas,
        details: `${matchedAreas} áreas, ${newsCount} notícias no site`,
      };
    },
  },

  actionReadiness: {
    name: "Ações",
    description: "Prontidão para executar ações concretas no site",
    weight: 1.1,
    run: (manifest) => {
      const routines = manifest.subroutines || manifest.routines || [];

      const actionVerbs = routines.flatMap(r =>
        (r.match(/criar|corrigir|adicionar|remover|publicar|postar|alterar|implementar|fazer|analisar|verificar|monitorar|gerar|detectar|sugerir|propor|recomendar|receber|consolidar|tomar|enviar|comparar|priorizar/gi) || [])
      );

      let score = 0;
      const checks = {
        temAcoes: actionVerbs.length >= 2,
        acoesEspecificas: actionVerbs.some(v => /criar|corrigir|publicar|implementar|gerar|enviar|tomar/i.test(v)),
        acoesDados: actionVerbs.some(v => /analisar|verificar|monitorar|detectar|comparar|priorizar/i.test(v)),
        acoesCriativas: actionVerbs.some(v => /sugerir|propor|recomendar/i.test(v)),
        rotinasExecutaveis: routines.some(r => /ROTINA|passo|etapa|\d\.|->/i.test(r)),
      };

      score = Object.values(checks).filter(Boolean).length;
      const maxScore = Object.keys(checks).length;
      return { score: Math.round((score / maxScore) * 100), maxScore, checks, details: `${actionVerbs.length} ações identificadas` };
    },
  },

  memoryIntegration: {
    name: "Memória",
    description: "Capacidade de usar e manter memória",
    weight: 0.9,
    run: (manifest) => {
      const memory = AGENT_OS.loadAgentMemory(manifest.id);
      const hasMemory = memory.entries && memory.entries.length > 0;

      const routines = manifest.subroutines || manifest.routines || [];
      const hasMemoryRoutine = routines.some(r => /mem[óo]ria|hist[óo]rico|anterior|cont|aprendizado/i.test(r));

      let score = 0;
      const checks = {
        temMemoriaSalva: hasMemory,
        usaMemoriaRotinas: hasMemoryRoutine,
        memoriaRecente: hasMemory && memory.entries.some(e => {
          const age = Date.now() - new Date(e.timestamp).getTime();
          return age < 7 * 24 * 60 * 60 * 1000;
        }),
        memoriaGlobal: !!manifest.memory || !!manifest.persistentMemory,
      };

      score = Object.values(checks).filter(Boolean).length;
      const maxScore = Object.keys(checks).length;
      return { score: Math.round((score / maxScore) * 100), maxScore, checks, details: hasMemory ? `${memory.entries.length} entradas` : "Sem memória ainda" };
    },
  },

  uniqueness: {
    name: "Originalidade",
    description: "Originalidade e profundidade vs genérico",
    weight: 0.8,
    run: (manifest) => {
      const cargo = (manifest.cargo || "").toLowerCase();
      const specialty = (manifest.specialty || "").toLowerCase();
      const routines = (manifest.subroutines || manifest.routines || []).join(" ").toLowerCase();

      const genericPhrases = ["analisar", "verificar", "gerar relatório", "monitorar"];
      const specificPhrases = ["detectar gargalos", "comparar concorrentes", "sugerir reels", "fact-checking", "heatmaps", "core web vitals"];

      const genericCount = genericPhrases.filter(p => routines.includes(p)).length;
      const specificCount = specificPhrases.filter(p => routines.includes(p)).length;

      let score = 0;
      const checks = {
        cargoEspecifico: cargo.length > 20 && !cargo.includes("geral") && !cargo.includes("assistente"),
        specialtyUnica: specialty.length > 10,
        rotinasNaoGenericas: specificCount > 0,
        temIniciativa: routines.some(r => /propor|sugerir|criar|desenvolver|inovar/i.test(r)),
        naoRepetitivo: new Set(routines.split(/\s+/)).size / Math.max(routines.split(/\s+/).length, 1) > 0.7,
      };

      score = Object.values(checks).filter(Boolean).length;
      const maxScore = Object.keys(checks).length;
      return { score: Math.round((score / maxScore) * 100), maxScore, checks, details: `especificidade ${specificCount}/${specificCount + genericCount}` };
    },
  },
};

// ─── Runner ────────────────────────────────────────────────────────────

async function getContext() {
  try {
    const newsFile = path.join(ROOT, "data", "runtime-news.json");
    if (fs.existsSync(newsFile)) {
      const data = JSON.parse(fs.readFileSync(newsFile, "utf8"));
      return { newsCount: (data.items || []).length };
    }
  } catch {}
  return { newsCount: 0 };
}

async function runTestsForAgent(manifest, context) {
  const scores = {};
  let totalWeighted = 0;
  let totalWeight = 0;

  for (const [suiteKey, suite] of Object.entries(TEST_SUITES)) {
    try {
      const result = suite.run(manifest);
      scores[suiteKey] = {
        name: suite.name,
        weight: suite.weight,
        score: result.score,
        maxScore: result.maxScore,
        details: result.details,
        checks: result.checks,
      };
      totalWeighted += result.score * suite.weight;
      totalWeight += suite.weight;
    } catch (err) {
      scores[suiteKey] = { name: suite.name, weight: suite.weight, score: 0, error: err.message };
    }
  }

  const finalGrade = totalWeight > 0 ? Math.round(totalWeighted / totalWeight) : 0;
  return {
    agentId: manifest.id,
    agentName: manifest.name,
    cargo: manifest.cargo,
    level: manifest.level,
    grade: finalGrade,
    scores,
    letterGrade: gradeToLetter(finalGrade),
  };
}

function gradeToLetter(grade) {
  if (grade >= 90) return "A+";
  if (grade >= 80) return "A";
  if (grade >= 70) return "B+";
  if (grade >= 60) return "B";
  if (grade >= 50) return "C";
  if (grade >= 30) return "D";
  return "F";
}

function getLevelLabel(level) {
  const labels = { ceo: "🎯", director: "📋", manager: "👔", specialist: "🔧" };
  return labels[level] || "❓";
}

async function runAllTests() {
  console.log("\n🧪 AGENT OS — BATERIA DE TESTES E COMPETIÇÃO (Local, sem LLM)");
  console.log("=" .repeat(70));
  console.log(`   Manifestos: ${MANIFESTS?.total || 0}`);
  console.log(`   Suites: ${Object.entries(TEST_SUITES).map(([k, v]) => `${k} (peso ${v.weight})`).join(", ")}`);
  console.log("=" .repeat(70));

  if (!MANIFESTS?.manifests) {
    console.log("❌ Manifestos não encontrados.");
    return;
  }

  const context = await getContext();
  console.log(`\n📊 Contexto do site: ${context.newsCount} notícias\n`);

  let agentsToTest = Object.values(MANIFESTS.manifests);

  if (filterTeam) {
    const teamMap = {
      tecnologia: ["dir-tecnologia"],
      editorial: ["dir-editorial"],
      design: ["dir-design"],
      crescimento: ["dir-crescimento"],
      auditoria: ["auditor-geral"],
    };
    const dirIds = teamMap[filterTeam] || [];
    const dirs = agentsToTest.filter(m => dirIds.includes(m.id));
    const managed = dirs.flatMap(d => (d.manages || []).map(id => agentsToTest.find(m => m.id === id)).filter(Boolean));
    agentsToTest = [...dirs, ...managed];
    console.log(`🎯 Filtro time: ${filterTeam} (${agentsToTest.length} agentes)\n`);
  }

  if (filterAgent) {
    agentsToTest = agentsToTest.filter(m => m.id === filterAgent || m.name.toLowerCase().includes(filterAgent.toLowerCase()));
    console.log(`🎯 Filtro agente: "${filterAgent}" (${agentsToTest.length} resultado(s))\n`);
  }

  console.log(`🏁 Testando ${agentsToTest.length} agentes...\n`);

  const results = [];
  for (const manifest of agentsToTest) {
    const result = await runTestsForAgent(manifest, context);
    results.push(result);

    const bar = "█".repeat(Math.floor(result.grade / 10)) + "░".repeat(10 - Math.floor(result.grade / 10));
    const emoji = getLevelLabel(manifest.level);
    console.log(`   [${bar}] ${String(result.grade).padStart(3)}% ${result.letterGrade} — ${emoji} ${manifest.name} (${manifest.id})`);
  }

  results.sort((a, b) => b.grade - a.grade);

  ensureDir(RESULTS_DIR);
  const resultFile = path.join(RESULTS_DIR, `competition-${today()}-${Date.now().toString(36)}.json`);
  const resultSummary = {
    timestamp: timestamp(),
    totalAgents: results.length,
    suites: Object.fromEntries(Object.entries(TEST_SUITES).map(([k, v]) => [k, { name: v.name, weight: v.weight }])),
    rankings: results.map((r, i) => ({
      rank: i + 1,
      agentId: r.agentId,
      agentName: r.agentName,
      cargo: r.cargo,
      level: r.level,
      grade: r.grade,
      letterGrade: r.letterGrade,
      scores: Object.fromEntries(Object.entries(r.scores).map(([k, v]) => [k, { score: v.score, details: v.details }])),
    })),
  };
  fs.writeFileSync(resultFile, JSON.stringify(resultSummary, null, 2) + "\n");
  fs.writeFileSync(path.join(RESULTS_DIR, "latest.json"), JSON.stringify(resultSummary, null, 2) + "\n");

  // Leaderboard
  console.log("\n" + "=".repeat(70));
  console.log("🏆 LEADERBOARD — TOP 10");
  console.log("=".repeat(70));
  const medals = ["🥇", "🥈", "🥉"];
  for (let i = 0; i < Math.min(10, results.length); i++) {
    const r = results[i];
    const medal = i < 3 ? medals[i] : `  ${i + 1}.`;
    const emoji = getLevelLabel(r.level);
    const scoreDetails = Object.entries(r.scores)
      .map(([k, v]) => `${k}:${v.score}%`)
      .join(" ");
    console.log(`${medal} [${r.letterGrade}] ${emoji} ${r.agentName.padEnd(25)} ${String(r.grade).padStart(3)}%  ${scoreDetails}`);
  }

  // Statistics
  console.log("\n" + "=".repeat(70));
  console.log("📊 ESTATÍSTICAS");
  const grades = results.map(r => r.grade);
  const avg = Math.round(grades.reduce((s, g) => s + g, 0) / grades.length);
  const best = results[0];
  const worst = results[results.length - 1];

  const byLevel = {};
  for (const r of results) {
    if (!byLevel[r.level]) byLevel[r.level] = [];
    byLevel[r.level].push(r.grade);
  }
  console.log(`   Média geral:    ${avg}%`);
  console.log(`   Melhor:         ${best.agentName} (${best.grade}% ${best.letterGrade})`);
  console.log(`   Pior:           ${worst.agentName} (${worst.grade}% ${worst.letterGrade})`);
  console.log(`   Testados:       ${results.length} agentes`);
  console.log("\n   Por nível:");
  for (const [level, grades] of Object.entries(byLevel)) {
    const avgLevel = Math.round(grades.reduce((s, g) => s + g, 0) / grades.length);
    const emoji = getLevelLabel(level);
    console.log(`   ${emoji} ${level.padEnd(12)} média ${avgLevel}% (${grades.length} agentes)`);
  }
  console.log("=".repeat(70));
  console.log(`\n📁 Relatório: ${resultFile}`);
  console.log(`\n✅ Bateria de testes concluída!\n`);
}

runAllTests().catch(err => {
  console.error("❌ Erro fatal:", err.message);
  process.exit(1);
});
