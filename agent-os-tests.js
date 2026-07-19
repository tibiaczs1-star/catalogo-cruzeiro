/**
 * Agent OS — Bateria de Testes e Competição
 *
 * Executa testes reais contra o Agent OS e classifica os agentes.
 * Testes:
 *  1. Report — qualidade do relatório
 *  2. Memory — usa memória anterior
 *  3. Action — propõe ações concretas
 *  4. Speed — tempo de resposta
 *  5. Creativity — originalidade das ideias
 *  6. Data-Driven — usa dados do site
 *
 * Uso:
 *   node agent-os-tests.js
 *   node agent-os-tests.js --team editorial
 *   node agent-os-tests.js --agent dir-editorial
 */

const fs = require("fs");
const path = require("path");
const http = require("http");

const ROOT = path.resolve(__dirname, ".");
const AGENT_OS = require(path.join(ROOT, "agent-os-integration"));

const args = process.argv.slice(2);
const filterTeam = args.includes("--team") ? args[args.indexOf("--team") + 1] : null;
const filterAgent = args.includes("--agent") ? args[args.indexOf("--agent") + 1] : null;

const MANIFESTS = AGENT_OS.loadManifests();
const REPORTS_DIR = path.join(ROOT, ".codex-temp", "agent-os", "reports");
const RESULTS_DIR = path.join(ROOT, ".codex-temp", "agent-os", "test-results");
const LLM_URL = AGENT_OS.CONFIG.LLM_URL;
const LLM_MODEL = AGENT_OS.CONFIG.LLM_MODEL;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function timestamp() { return new Date().toISOString(); }
function today() { return new Date().toISOString().split("T")[0]; }
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

// ─── Test Suites ───────────────────────────────────────────────────────

const TEST_SUITES = {
  report: {
    name: "Report Quality",
    description: "Qualidade do relatório: estrutura, clareza, dados usados",
    weight: 1.0,
    run: async (manifest, context) => {
      const result = await AGENT_OS.executeAgent(manifest, context, "report");
      if (!result || result.status === "fallback") return { score: 0, details: "LLM indisponível", raw: result };

      const text = result.content;
      let score = 0;
      const checks = {
        temAchados: /\*\*Achados\*\*|Achados/i.test(text),
        temAnalise: /\*\*An[áa]lise\*\*|An[áa]lise/i.test(text),
        temRecomendacoes: /\*\*Recomenda[çc][õo]es\*\*|Recomenda[çc][õo]es/i.test(text),
        temAcoes: /\*\*A[çc][õo]es\*\*|A[çc][õo]es/i.test(text) || /^\d+\./m.test(text),
        temDadosSite: /not[íi]cia|site|seo|instagram|coment[áa]rio|inscri/i.test(text),
        tamanhoOk: text.length > 150 && text.length < 3000,
        markdownOk: (text.match(/#{1,3}\s/g) || []).length >= 2,
        opinativo: /suger|propon|recomendo|deveria|priorit|urgente|opini/i.test(text),
      };

      score = Object.values(checks).filter(Boolean).length;
      const maxScore = Object.keys(checks).length;
      const percentage = Math.round((score / maxScore) * 100);

      return {
        score: percentage,
        maxScore,
        checks,
        details: `${score}/${maxScore} checks passed (${percentage}%)`,
        raw: result,
      };
    },
  },

  memory: {
    name: "Memory Usage",
    description: "Usa memória de execuções anteriores (não repete, referencia ações passadas)",
    weight: 0.8,
    run: async (manifest, context) => {
      // Pre-fill memory with a past action
      const pastEntry = {
        type: "cycle",
        cycle: "pre-test-" + today(),
        summary: "Identifiquei que 3 notícias estão sem imagem e foram fixed",
        data: { action: "fix-missing-images", count: 3 },
      };
      AGENT_OS.saveAgentMemory(manifest.id, pastEntry);

      // Give agent a context that references the past
      const contextWithMemory = {
        ...context,
        cycleLabel: "test-memory-cycle",
      };

      const result = await AGENT_OS.executeAgent(manifest, contextWithMemory, "report");
      if (!result || result.status === "fallback") return { score: 0, details: "LLM indisponível", raw: result };

      const text = result.content;
      const memory = AGENT_OS.loadAgentMemory(manifest.id);
      const hasMemory = memory.entries.length > 0;

      let score = 0;
      const checks = {
        salvouMemoria: hasMemory,
        referenciaPassado: /anterior|[úu]ltimo|j[aá] foi|antes|mem[óo]ria|anteriormente/i.test(text),
        naoRepete: !text.toLowerCase().includes(pastEntry.summary.slice(0, 30)),
        mencionouAcao: /fix|imagem|not[íi]cia/i.test(text),
      };

      score = Object.values(checks).filter(Boolean).length;
      const maxScore = Object.keys(checks).length;
      const percentage = Math.round((score / maxScore) * 100);

      return {
        score: percentage,
        maxScore,
        checks,
        details: `${score}/${maxScore} checks (memória: ${hasMemory ? "sim" : "não"})`,
        raw: result,
      };
    },
  },

  action: {
    name: "Action Proposal",
    description: "Propõe ações concretas, executáveis, com prioridade",
    weight: 1.2,
    run: async (manifest, context) => {
      const result = await AGENT_OS.executeAgent(manifest, context, "report");
      if (!result || result.status === "fallback") return { score: 0, details: "LLM indisponível", raw: result };

      const text = result.content;
      const actionLines = text.split("\n").filter(l => /^\s*[-*]\s/.test(l) || /^\d+\.\s/.test(l));
      const specificActions = actionLines.filter(l => l.length > 15 && l.length < 300);

      let score = 0;
      const checks = {
        temAcoesListadas: specificActions.length >= 2,
        acaoEspecifica: specificActions.some(l => /criar|corrigir|adicionar|remover|publicar|postar|alterar|implementar|fazer/i.test(l)),
        comPrioridade: /urgente|priorit[áa]rio|alta|m[ée]dia|baixa|prioridade/i.test(text) || specificActions.some(l => /urgente|priorit/i.test(l)),
        comResponsavel: /respons[áa]vel|agente|equipe|time|diretor/i.test(text) || specificActions.length >= 3,
        executavel: specificActions.some(l => l.length > 20 && l.length < 150),
      };

      score = Object.values(checks).filter(Boolean).length;
      const maxScore = Object.keys(checks).length;
      const percentage = Math.round((score / maxScore) * 100);

      return {
        score: percentage,
        maxScore,
        checks,
        actionCount: specificActions.length,
        details: `${specificActions.length} ações propostas, ${score}/${maxScore} checks (${percentage}%)`,
        raw: result,
      };
    },
  },

  speed: {
    name: "Response Speed",
    description: "Tempo de resposta do agente (ms)",
    weight: 0.5,
    run: async (manifest, context) => {
      const start = Date.now();
      const result = await AGENT_OS.executeAgent(manifest, context, "report");
      const duration = Date.now() - start;

      // Score: faster = better. Max at 2s, min at 30s
      let score;
      if (duration < 2000) score = 100;
      else if (duration < 5000) score = 80;
      else if (duration < 10000) score = 60;
      else if (duration < 20000) score = 40;
      else score = 20;

      return {
        score,
        durationMs: duration,
        details: `${(duration / 1000).toFixed(1)}s → nota ${score}`,
        raw: result,
      };
    },
  },

  creativity: {
    name: "Creativity & Insight",
    description: "Originalidade e profundidade das ideias",
    weight: 0.9,
    run: async (manifest, context) => {
      const result = await AGENT_OS.executeAgent(manifest, context, "report");
      if (!result || result.status === "fallback") return { score: 0, details: "LLM indisponível", raw: result };

      const text = result.content;
      const words = text.split(/\s+/);
      const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-záàâãéèêíïóôõöúüç]/g, ""))).size;
      const lexicalDiversity = uniqueWords / Math.max(words.length, 1);

      let score = 0;
      const checks = {
        ideiasNaoGenericas: /viral|tend[êe]ncia|concorrente|inovac|diferencial|único|exclusiv|pioneir/i.test(text),
        profundidade: text.length > 300,
        diversidadeLexical: lexicalDiversity > 0.5,
        perspectivaPropria: /eu|minha opini[ãa]o|acredito|avali[áa]r|deveria|oportunidade/i.test(text),
        naoRepetitivo: (text.match(/\b(e|ou|mas|que|com|para|não|sim)\b/gi) || []).length < words.length * 0.15,
      };

      score = Object.values(checks).filter(Boolean).length;
      const maxScore = Object.keys(checks).length;
      const percentage = Math.round((score / maxScore) * 100);

      return {
        score: percentage,
        maxScore,
        checks,
        lexicalDiversity: lexicalDiversity.toFixed(2),
        details: `diversidade ${lexicalDiversity.toFixed(2)}, ${score}/${maxScore} checks (${percentage}%)`,
        raw: result,
      };
    },
  },

  dataDriven: {
    name: "Data-Driven Decisions",
    description: "Usa dados concretos do site para fundamentar decisões",
    weight: 1.1,
    run: async (manifest, context) => {
      const result = await AGENT_OS.executeAgent(manifest, context, "report");
      if (!result || result.status === "fallback") return { score: 0, details: "LLM indisponível", raw: result };

      const text = result.content;
      const siteContext = AGENT_OS.getSiteContext ? AGENT_OS.getSiteContext() : null;

      let score = 0;
      const checks = {
        mencionaNoticias: /not[íi]cia|mat[eé]ria|reportagem/i.test(text),
        mencionaMetricas: /coment|inscri|empresa|an[úu]ncio|seguidor/i.test(text),
        mencionaSEO: /seo|google|busca|palavra.chave|meta/i.test(text),
        mencionaInstagram: /instagram|reel|story|post|hashtag/i.test(text),
        usaNumeros: /\d+/.test(text),
        mencionaConcorrentes: /concorrente|simil|mercado|refer[êe]ncia/i.test(text) || /compar/i.test(text),
      };

      score = Object.values(checks).filter(Boolean).length;
      const maxScore = Object.keys(checks).length;
      const percentage = Math.round((score / maxScore) * 100);

      return {
        score: percentage,
        maxScore,
        checks,
        details: `${score}/${maxScore} checks (${percentage}%)`,
        raw: result,
      };
    },
  },
};

// ─── Runner ────────────────────────────────────────────────────────────

async function getContext() {
  const state = AGENT_OS.getState();
  const news = [];
  try {
    const newsFile = path.join(ROOT, "data", "runtime-news.json");
    if (fs.existsSync(newsFile)) {
      const data = JSON.parse(fs.readFileSync(newsFile, "utf8"));
      news.push(...(data.items || []).slice(0, 15));
    }
  } catch {}
  return {
    metrics: {
      newsCount: state.totalManifests || 0,
      commentsCount: 0,
      subscriptionsCount: 0,
      businessesCount: 0,
      pendingAds: 0,
      issues: { missingImages: 0, noSource: 0, oldNews: 0 },
      topEngaged: [],
    },
    news,
    cycleLabel: "test-battery-" + today(),
  };
}

async function runTestsForAgent(manifest, context) {
  const scores = {};
  let totalWeighted = 0;
  let totalWeight = 0;

  for (const [suiteKey, suite] of Object.entries(TEST_SUITES)) {
    try {
      const result = await suite.run(manifest, { ...context, cycleLabel: `test-${suiteKey}-${manifest.id}` });
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

async function runAllTests() {
  console.log("\n🧪 AGENT OS — BATERIA DE TESTES E COMPETIÇÃO");
  console.log("=" .repeat(60));
  console.log(`   LLM: ${LLM_MODEL} @ ${LLM_URL}`);
  console.log(`   Manifestos: ${MANIFESTS?.total || 0}`);
  console.log(`   Suites: ${Object.keys(TEST_SUITES).join(", ")}`);
  console.log("=" .repeat(60));

  if (!MANIFESTS?.manifests) {
    console.log("❌ Manifestos não encontrados.");
    return;
  }

  const context = await getContext();
  const results = [];

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
    console.log(`\n🎯 Filtro time: ${filterTeam} (${agentsToTest.length} agentes)`);
  }

  if (filterAgent) {
    agentsToTest = agentsToTest.filter(m => m.id === filterAgent || m.name.toLowerCase().includes(filterAgent.toLowerCase()));
    console.log(`\n🎯 Filtro agente: "${filterAgent}" (${agentsToTest.length} resultado(s))`);
  }

  if (agentsToTest.length > 20) {
    console.log(`\n⚠️ ${agentsToTest.length} agentes — testando amostra de 20`);
    agentsToTest = agentsToTest.slice(0, 20);
  }

  console.log(`\n🏁 Iniciando testes com ${agentsToTest.length} agentes...\n`);

  const BATCH = 3;
  for (let i = 0; i < agentsToTest.length; i += BATCH) {
    const batch = agentsToTest.slice(i, i + BATCH);
    const batchResults = await Promise.allSettled(
      batch.map(m => runTestsForAgent(m, context))
    );

    for (let j = 0; j < batchResults.length; j++) {
      if (batchResults[j].status === "fulfilled") {
        results.push(batchResults[j].value);
        const r = batchResults[j].value;
        const bar = "█".repeat(Math.floor(r.grade / 10)) + "░".repeat(10 - Math.floor(r.grade / 10));
        console.log(`   [${bar}] ${r.grade}% ${r.letterGrade} — ${r.agentName} (${r.agentId})`);
      } else {
        console.log(`   ❌ Erro: ${batchResults[j].reason?.message || "desconhecido"}`);
      }
    }
  }

  // Sort by grade
  results.sort((a, b) => b.grade - a.grade);

  // Save results
  ensureDir(RESULTS_DIR);
  const resultFile = path.join(RESULTS_DIR, `competition-${today()}-${Date.now().toString(36)}.json`);
  const resultSummary = {
    timestamp: timestamp(),
    totalAgents: results.length,
    suites: Object.fromEntries(Object.entries(TEST_SUITES).map(([k, v]) => [k, { name: v.name, weight: v.weight }])),
    rankings: results.map(r => ({
      rank: 0,
      agentId: r.agentId,
      agentName: r.agentName,
      cargo: r.cargo,
      level: r.level,
      grade: r.grade,
      letterGrade: r.letterGrade,
      scores: Object.fromEntries(Object.entries(r.scores).map(([k, v]) => [k, { score: v.score, details: v.details }])),
    })),
  };
  resultSummary.rankings.forEach((r, i) => r.rank = i + 1);
  fs.writeFileSync(resultFile, JSON.stringify(resultSummary, null, 2) + "\n");
  fs.writeFileSync(path.join(RESULTS_DIR, "latest.json"), JSON.stringify(resultSummary, null, 2) + "\n");

  // Print leaderboard
  console.log("\n" + "=".repeat(60));
  console.log("🏆 LEADERBOARD — TOP 10");
  console.log("=".repeat(60));
  const medals = ["🥇", "🥈", "🥉"];
  for (let i = 0; i < Math.min(10, results.length); i++) {
    const r = results[i];
    const medal = i < 3 ? medals[i] : `  ${i + 1}.`;
    const scoreDetails = Object.entries(r.scores)
      .map(([k, v]) => `${k}:${v.score}%`)
      .join(" ");
    console.log(`${medal} [${r.letterGrade}] ${r.agentName.padEnd(25)} ${String(r.grade).padStart(3)}%  ${scoreDetails}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 ESTATÍSTICAS");
  const grades = results.map(r => r.grade);
  const avg = Math.round(grades.reduce((s, g) => s + g, 0) / grades.length);
  const best = results[0];
  const worst = results[results.length - 1];
  console.log(`   Média geral:    ${avg}%`);
  console.log(`   Melhor:         ${best.agentName} (${best.grade}% ${best.letterGrade})`);
  console.log(`   Pior:           ${worst.agentName} (${worst.grade}% ${worst.letterGrade})`);
  console.log(`   Resultados:     ${results.length} agentes testados`);
  console.log("=".repeat(60));
  console.log(`\n📁 Relatório salvo: ${resultFile}`);
  console.log(`\n🌐 Ver online: http://localhost:3000/api/agent-os/test-results/${path.basename(resultFile)}`);
  console.log(`\n✅ Bateria de testes concluída!\n`);
}

runAllTests().catch(err => {
  console.error("❌ Erro fatal:", err.message);
  process.exit(1);
});
