#!/usr/bin/env node
/**
 * Testa o Agent OS com Ollama local
 *
 * Uso:
 *   node agent-os-tests-ollama.js
 *   node agent-os-tests-ollama.js --team editorial
 *   node agent-os-tests-ollama.js --agent dir-editorial
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, ".");
const AGENT_OS = require(path.join(ROOT, "agent-os-integration"));

const args = process.argv.slice(2);
const filterTeam = args.includes("--team") ? args[args.indexOf("--team") + 1] : null;
const filterAgent = args.includes("--agent") ? args[args.indexOf("--agent") + 1] : null;

const LLM_URL = "http://127.0.0.1:11434/v1/chat/completions";
const LLM_MODEL = "llama3.2:3b";

const MANIFESTS = AGENT_OS.loadManifests();
const RESULTS_DIR = path.join(ROOT, ".codex-temp", "agent-os", "test-results");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function timestamp() { return new Date().toISOString(); }
function today() { return new Date().toISOString().split("T")[0]; }

// ─── LLM Client ────────────────────────────────────────────────────────

async function callLLM(messages, options = {}) {
  const startTime = Date.now();
  try {
    const body = JSON.stringify({
      model: LLM_MODEL,
      messages,
      stream: false,
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature || 0.3,
    });

    const response = await fetch(LLM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const duration = Date.now() - startTime;
    return {
      ok: true,
      content: data.choices?.[0]?.message?.content || "",
      durationMs: duration,
      model: LLM_MODEL,
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message,
      durationMs: Date.now() - startTime,
      content: "",
    };
  }
}

// ─── Test Suites ───────────────────────────────────────────────────────

const TEST_SUITES = {
  report: {
    name: "Report Quality",
    description: "Qualidade do relatório gerado pela LLM",
    weight: 1.0,
    run: async (manifest) => {
      const context = AGENT_OS.getSiteContext ? AGENT_OS.getSiteContext() : {};
      const prompt = `Você é ${manifest.name}, ${manifest.cargo}. ${manifest.specialty || ""}
Gere um relatório curto sobre o estado do site Catálogo CZS hoje.
Notícias no site: ${context.news?.length || 0}
Responda em português, formato markdown, máximo 300 palavras.`;

      const result = await callLLM([
        { role: "system", content: manifest.specialty || "Você é um agente especializado." },
        { role: "user", content: prompt },
      ]);

      if (!result.ok) return { score: 0, details: `LLM error: ${result.error}`, durationMs: result.durationMs };

      const text = result.content;
      let score = 0;
      const checks = {
        temConteudo: text.length > 50,
        formatacaoOk: /#{1,3}\s/.test(text) || /\*\*/.test(text),
        mencionaSite: /site|not[íi]cia|seo|instagram|conte[úu]do/i.test(text),
        temRecomendacao: /suger|recomendo|deveria|priorit|urgente|oportunidade/i.test(text),
        tamanhoOk: text.length > 100 && text.length < 2000,
        portugues: /[áàâãéèêíïóôõöúüç]/i.test(text),
      };

      score = Object.values(checks).filter(Boolean).length;
      const maxScore = Object.keys(checks).length;
      return {
        score: Math.round((score / maxScore) * 100),
        maxScore,
        checks,
        details: `${score}/${maxScore} checks, ${result.durationMs}ms`,
        durationMs: result.durationMs,
        preview: text.slice(0, 200),
      };
    },
  },

  memory: {
    name: "Memory Usage",
    description: "Usa memória de execuções anteriores",
    weight: 0.8,
    run: async (manifest) => {
      const pastEntry = {
        type: "cycle",
        cycle: "pre-test-" + today(),
        summary: "Identifiquei que 3 notícias estão sem imagem e foram fixed",
        data: { action: "fix-missing-images", count: 3 },
      };
      AGENT_OS.saveAgentMemory(manifest.id, pastEntry);

      const prompt = `Você é ${manifest.name}. Baseado em sua memória anterior, qual foi a última ação que você executou? O que você aprendeu? Responda em português, máximo 150 palavras.`;

      const result = await callLLM([
        { role: "system", content: "Você é um agente com memória de execuções anteriores." },
        { role: "user", content: prompt },
      ]);

      if (!result.ok) return { score: 0, details: `LLM error: ${result.error}`, durationMs: result.durationMs };

      const text = result.content;
      let score = 0;
      const checks = {
        referenciaPassado: /anterior|[úu]ltimo|j[aá] foi|antes|mem[óo]ria|anteriormente/i.test(text),
        mencionouAcao: /fix|imagem|not[íi]cia|ação/i.test(text),
        naoRepete: !text.toLowerCase().includes(pastEntry.summary.slice(0, 20)),
        portugues: /[áàâãéèêíïóôõöúüç]/i.test(text),
      };

      score = Object.values(checks).filter(Boolean).length;
      const maxScore = Object.keys(checks).length;
      return {
        score: Math.round((score / maxScore) * 100),
        maxScore,
        checks,
        details: `${score}/${maxScore} checks, ${result.durationMs}ms`,
        durationMs: result.durationMs,
      };
    },
  },

  action: {
    name: "Action Proposal",
    description: "Propõe ações concretas, executáveis, com prioridade",
    weight: 1.2,
    run: async (manifest) => {
      const context = AGENT_OS.getSiteContext ? AGENT_OS.getSiteContext() : {};
      const prompt = `Você é ${manifest.name}, ${manifest.cargo}.
Site: Catálogo CZS (Cruzeiro do Sul, Juruá, Acre)
Notícias no site: ${context.news?.length || 0}

Liste 3 ações concretas que você executaria HOJE para melhorar o site, com prioridade (alta/média/baixa). Responda em português.`;

      const result = await callLLM([
        { role: "system", content: manifest.specialty || "Você é um agente especializado em melhorias de site." },
        { role: "user", content: prompt },
      ], { maxTokens: 400 });

      if (!result.ok) return { score: 0, details: `LLM error: ${result.error}`, durationMs: result.durationMs };

      const text = result.content;
      const actionLines = text.split("\n").filter(l => /^\s*[-*]\s/.test(l) || /^\d+\.\s/.test(l));
      const specificActions = actionLines.filter(l => l.length > 15 && l.length < 300);

      let score = 0;
      const checks = {
        temAcoesListadas: specificActions.length >= 2,
        acaoEspecifica: specificActions.some(l => /criar|corrigir|adicionar|remover|publicar|postar|alterar|implementar|fazer|analisar|verificar|monitorar|gerar|detectar|sugerir|propor|recomendar|receber|consolidar|tomar|enviar|comparar|priorizar/i.test(l)),
        comPrioridade: /urgente|priorit[áa]rio|alta|m[ée]dia|baixa|prioridade/i.test(text) || specificActions.some(l => /urgente|priorit/i.test(l)),
        comResponsavel: /respons[áa]vel|agente|equipe|time|diretor/i.test(text) || specificActions.length >= 3,
        executavel: specificActions.some(l => l.length > 20 && l.length < 150),
      };

      score = Object.values(checks).filter(Boolean).length;
      const maxScore = Object.keys(checks).length;
      return {
        score: Math.round((score / maxScore) * 100),
        maxScore,
        checks,
        actionCount: specificActions.length,
        details: `${specificActions.length} ações, ${score}/${maxScore}, ${result.durationMs}ms`,
        durationMs: result.durationMs,
        preview: text.slice(0, 300),
      };
    },
  },

  speed: {
    name: "Response Speed",
    description: "Tempo de resposta do agente (ms)",
    weight: 0.5,
    run: async (manifest) => {
      const start = Date.now();
      const result = await callLLM([
        { role: "user", content: "Responda em uma frase: qual é o papel de " + (manifest.cargo || manifest.name) + "?" },
      ], { maxTokens: 100 });

      const duration = Date.now() - start;
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
      };
    },
  },

  creativity: {
    name: "Creativity & Insight",
    description: "Originalidade e profundidade das ideias",
    weight: 0.9,
    run: async (manifest) => {
      const prompt = `Você é ${manifest.name}, ${manifest.cargo}.
Site: Catálogo CZS - portal local do Vale do Juruá (Cruzeiro do Sul, Acre)

Dê uma opinião original sobre como este site poderia crescer mais. Pense fora do óbvio. Responda em português, máximo 200 palavras.`;

      const result = await callLLM([
        { role: "system", content: "Você é um agente criativo e estratégico." },
        { role: "user", content: prompt },
      ], { temperature: 0.7, maxTokens: 300 });

      if (!result.ok) return { score: 0, details: `LLM error: ${result.error}`, durationMs: result.durationMs };

      const text = result.content;
      const words = text.split(/\s+/);
      const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-záàâãéèêíïóôõöúüç]/g, ""))).size;
      const lexicalDiversity = uniqueWords / Math.max(words.length, 1);

      let score = 0;
      const checks = {
        ideiasNaoGenericas: /viral|tend[êe]ncia|concorrente|inovac|diferencial|único|exclusiv|pioneir/i.test(text),
        profundidade: text.length > 150,
        diversidadeLexical: lexicalDiversity > 0.5,
        perspectivaPropria: /eu|minha opini[ãa]o|acredito|avali[áa]r|deveria|oportunidade/i.test(text),
        naoRepetitivo: (text.match(/\b(e|ou|mas|que|com|para|não|sim)\b/gi) || []).length < words.length * 0.15,
      };

      score = Object.values(checks).filter(Boolean).length;
      const maxScore = Object.keys(checks).length;
      return {
        score: Math.round((score / maxScore) * 100),
        maxScore,
        checks,
        lexicalDiversity: lexicalDiversity.toFixed(2),
        details: `diversidade ${lexicalDiversity.toFixed(2)}, ${score}/${maxScore}, ${result.durationMs}ms`,
        durationMs: result.durationMs,
      };
    },
  },

  dataDriven: {
    name: "Data-Driven Decisions",
    description: "Usa dados concretos do site para fundamentar decisões",
    weight: 1.1,
    run: async (manifest) => {
      const context = AGENT_OS.getSiteContext ? AGENT_OS.getSiteContext() : {};
      const newsCount = context.news?.length || 0;
      const prompt = `Você é ${manifest.name}, ${manifest.cargo}.
Site: Catálogo CZS (Cruzeiro do Sul, Juruá, Acre)
Notícias no site: ${newsCount}
Instagram: @catalogo_czs_

Analise os dados do site e sugira 2 melhorias baseadas em dados reais. Use números, referências específicas. Responda em português.`;

      const result = await callLLM([
        { role: "system", content: manifest.specialty || "Você é um agente analítico." },
        { role: "user", content: prompt },
      ], { maxTokens: 300 });

      if (!result.ok) return { score: 0, details: `LLM error: ${result.error}`, durationMs: result.durationMs };

      const text = result.content;
      let score = 0;
      const checks = {
        mencionaNoticias: /not[íi]cia|mat[eé]ria|reportagem/i.test(text),
        mencionaMetricas: /coment|inscri|empresa|an[úu]ncio|seguidor|dados|n[úu]mero/i.test(text),
        mencionaSEO: /seo|google|busca|palavra.chave|meta/i.test(text),
        mencionaInstagram: /instagram|reel|story|post|hashtag/i.test(text),
        usaNumeros: /\d+/.test(text),
        mencionaConcorrentes: /concorrente|simil|mercado|refer[êe]ncia/i.test(text) || /compar/i.test(text),
      };

      score = Object.values(checks).filter(Boolean).length;
      const maxScore = Object.keys(checks).length;
      return {
        score: Math.round((score / maxScore) * 100),
        maxScore,
        checks,
        details: `${score}/${maxScore} checks, ${result.durationMs}ms`,
        durationMs: result.durationMs,
      };
    },
  },
};

// ─── Runner ────────────────────────────────────────────────────────────

async function runTestsForAgent(manifest) {
  const scores = {};
  let totalWeighted = 0;
  let totalWeight = 0;

  for (const [suiteKey, suite] of Object.entries(TEST_SUITES)) {
    try {
      const result = await suite.run(manifest);
      scores[suiteKey] = {
        name: suite.name,
        weight: suite.weight,
        score: result.score,
        maxScore: result.maxScore,
        details: result.details,
        checks: result.checks,
        preview: result.preview,
        durationMs: result.durationMs,
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
  console.log("\n🧪 AGENT OS — BATERIA COM LLM (llama3.2:3b)");
  console.log("=".repeat(70));
  console.log(`   Modelo: ${LLM_MODEL}`);
  console.log(`   URL: ${LLM_URL}`);
  console.log(`   Manifestos: ${MANIFESTS?.total || 0}`);
  console.log("=".repeat(70));

  if (!MANIFESTS?.manifests) {
    console.log("❌ Manifestos não encontrados.");
    return;
  }

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
    console.log(`\n🎯 Filtro time: ${filterTeam} (${agentsToTest.length} agentes)\n`);
  }

  if (filterAgent) {
    agentsToTest = agentsToTest.filter(m => m.id === filterAgent || m.name.toLowerCase().includes(filterAgent.toLowerCase()));
    console.log(`🎯 Filtro agente: "${filterAgent}" (${agentsToTest.length} resultado(s))\n`);
  }

  if (agentsToTest.length > 20) {
    console.log(`⚠️ ${agentsToTest.length} agentes — testando amostra de 20`);
    agentsToTest = agentsToTest.slice(0, 20);
  }

  console.log(`🏁 Testando ${agentsToTest.length} agentes com LLM...\n`);

  const results = [];
  for (const manifest of agentsToTest) {
    const result = await runTestsForAgent(manifest);
    results.push(result);

    const bar = "█".repeat(Math.floor(result.grade / 10)) + "░".repeat(10 - Math.floor(result.grade / 10));
    const emoji = getLevelLabel(manifest.level);
    console.log(`   [${bar}] ${String(result.grade).padStart(3)}% ${result.letterGrade} — ${emoji} ${manifest.name} (${manifest.id})`);
  }

  results.sort((a, b) => b.grade - a.grade);

  ensureDir(RESULTS_DIR);
  const resultFile = path.join(RESULTS_DIR, `competition-llm-${today()}-${Date.now().toString(36)}.json`);
  const resultSummary = {
    timestamp: timestamp(),
    totalAgents: results.length,
    llm: LLM_MODEL,
    suites: Object.fromEntries(Object.entries(TEST_SUITES).map(([k, v]) => [k, { name: v.name, weight: v.weight }])),
    rankings: results.map((r, i) => ({
      rank: i + 1,
      agentId: r.agentId,
      agentName: r.agentName,
      cargo: r.cargo,
      level: r.level,
      grade: r.grade,
      letterGrade: r.letterGrade,
      scores: Object.fromEntries(Object.entries(r.scores).map(([k, v]) => [k, { score: v.score, details: v.details, preview: v.preview }])),
    })),
  };
  fs.writeFileSync(resultFile, JSON.stringify(resultSummary, null, 2) + "\n");
  fs.writeFileSync(path.join(RESULTS_DIR, "latest-llm.json"), JSON.stringify(resultSummary, null, 2) + "\n");

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
  console.log(`\n✅ Bateria com LLM concluída!\n`);
}

runAllTests().catch(err => {
  console.error("❌ Erro fatal:", err.message);
  process.exit(1);
});
