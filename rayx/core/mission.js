#!/usr/bin/env node
"use strict";

const { execFile } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const DEFAULT_TIMEOUT_MS = 75_000;

function nowIso() {
  return new Date().toISOString();
}

function repoRoot() {
  return path.resolve(__dirname, "..", "..");
}

function missionDir() {
  const base = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
  return path.join(base, "RayX", "state", "missions");
}

function missionPath(id) {
  return path.join(missionDir(), `${id}.json`);
}

function missionId() {
  return `mission_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function classifyFactors(input) {
  const text = String(input || "").toLowerCase();
  const factors = [];

  if (/hermes|agent|agente/.test(text)) factors.push("hermes");
  if (/chrome|browser|navegador|site|pagina|cdp/.test(text)) factors.push("browser");
  if (/codigo|implementar|program|arquivo|repo|git|commit/.test(text)) factors.push("code");
  if (/estud|pesquis|document|modelo|llm|github|repo/.test(text)) factors.push("research");
  if (/pc|sistema|memoria|cpu|manutenc|otimiz/.test(text)) factors.push("machine");
  if (!factors.length) factors.push("general");

  return [...new Set(factors)];
}

function buildMissionPlan(input, options = {}) {
  const id = options.id || missionId();
  const factors = classifyFactors(input);

  return {
    schema: "rayx.mission.plan.v1",
    id,
    createdAt: nowIso(),
    goal: String(input || "").trim(),
    parallel: true,
    maxSilentMinutes: 10,
    language: {
      userInput: "pt-BR",
      internalPrompt: "en-US",
      output: "pt-BR"
    },
    factors,
    collectionJobs: [
      { id: "doctor", command: ["doctor"], lane: "machine", required: true },
      { id: "catalog", command: ["catalog"], lane: "capabilities", required: true },
      { id: "hermes", command: ["hermes", "status", "--json"], lane: "legacy-agent", required: false },
      { id: "chrome-bridge", command: ["chrome-bridge", "status", "--json"], lane: "browser", required: false }
    ],
    lanes: [
      {
        id: "codex-primary",
        role: "planejamento, codigo, revisao e decisao principal",
        kind: "cloud-cli",
        command: "codex",
        priority: 1
      },
      {
        id: "hermes-adapter",
        role: "execucao legado Hermes, status, logs e ponte com o agente antigo",
        kind: "local-cli",
        command: "rayx hermes",
        priority: 2
      },
      {
        id: "ollama-local",
        role: "resposta local rapida e fallback offline pequeno",
        kind: "local-llm",
        command: "ollama /api/generate",
        priority: 3
      },
      {
        id: "chrome-cdp",
        role: "observacao e controle de navegador por CDP",
        kind: "browser",
        command: "rayx chrome-bridge",
        priority: 4
      },
      {
        id: "shell-tools",
        role: "PowerShell, Node, Git, Python e ferramentas do PC",
        kind: "local-tools",
        command: "powershell/node/git/python",
        priority: 5
      },
      {
        id: "skills-and-agents",
        role: "skills Codex, prompts, agentes Copilot e inventario MCP",
        kind: "capability-registry",
        command: "rayx catalog",
        priority: 6
      }
    ],
    responseContract: {
      singlePortugueseAnswer: true,
      includeEvidence: true,
      includeNextActions: true,
      noSilentOperationAboveMinutes: 10
    }
  };
}

function runRayxJob(job) {
  const startedAt = Date.now();

  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [path.join(repoRoot(), "rayx", "bin", "rayx.js"), ...job.command],
      {
        cwd: repoRoot(),
        windowsHide: true,
        timeout: job.timeoutMs || DEFAULT_TIMEOUT_MS,
        maxBuffer: 1024 * 1024 * 8
      },
      (error, stdout, stderr) => {
        const output = String(stdout || "");
        let json = null;
        try {
          json = JSON.parse(output);
        } catch {
          json = null;
        }

        resolve({
          id: job.id,
          lane: job.lane,
          ok: !error,
          required: Boolean(job.required),
          command: `rayx ${job.command.join(" ")}`,
          durationMs: Date.now() - startedAt,
          stdout: output.slice(0, 12_000),
          stderr: String(stderr || error?.message || "").slice(0, 4_000),
          json
        });
      }
    );
  });
}

function chooseOllamaModel(doctorJson) {
  const models = doctorJson?.ollama?.models || [];
  const names = models.map((model) => model.name).filter(Boolean);
  return names.find((name) => name.includes("llama3.2:3b")) ||
    names.find((name) => name.includes("qwen2.5:3b")) ||
    names.find((name) => !name.includes("coder")) ||
    names[0] ||
    null;
}

async function tryLocalLlm(plan, jobResults) {
  const doctor = jobResults.find((job) => job.id === "doctor")?.json;
  const model = chooseOllamaModel(doctor);
  if (!model || typeof fetch !== "function") {
    return { ok: false, model, text: null, error: "Ollama model unavailable" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  const context = summarizeJobEvidence(jobResults);
  const prompt = [
    "You are RayX, a local multi-agent orchestration layer.",
    "Answer only in Brazilian Portuguese.",
    "Use the collected local evidence. Be concrete and action-oriented.",
    "",
    `User goal: ${plan.goal}`,
    "",
    "Collected evidence:",
    context
  ].join("\n");

  try {
    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false }),
      signal: controller.signal
    });
    const payload = await response.json();
    return {
      ok: response.ok,
      model,
      text: payload.response || null,
      error: response.ok ? null : JSON.stringify(payload).slice(0, 500)
    };
  } catch (error) {
    return { ok: false, model, text: null, error: error.message };
  } finally {
    clearTimeout(timeout);
  }
}

function summarizeJobEvidence(jobResults) {
  return jobResults.map((job) => {
    if (job.id === "doctor" && job.json) {
      return `doctor: PC ${job.json.hardware?.host || "?"}, modo ${job.json.recommendation?.mode || "?"}, Codex ${job.json.codex?.found ? "ok" : "missing"}, Ollama ${job.json.ollama?.models?.length || 0} modelos`;
    }
    if (job.id === "catalog" && job.json) {
      const found = job.json.tools.filter((tool) => tool.found).length;
      return `catalog: ${found}/${job.json.tools.length} ferramentas, ${job.json.skills.total} skills`;
    }
    if (job.id === "hermes" && job.json) {
      return `hermes: ${job.json.status}, gateway ${job.json.gateway || "?"}, provider ${job.json.provider || "?"}`;
    }
    if (job.id === "chrome-bridge" && job.json) {
      return `chrome: CDP ${job.json.cdpReachable ? "ativo" : "inativo"}, perfis ${job.json.profiles?.length || 0}, allow ${job.json.policy?.allowCount || 0}`;
    }
    return `${job.id}: ${job.ok ? "ok" : "falhou"}`;
  }).join("\n");
}

function composeMissionAnswer(plan, jobResults, localLlm) {
  const okJobs = jobResults.filter((job) => job.ok).length;
  const failedRequired = jobResults.filter((job) => job.required && !job.ok);
  const evidence = summarizeJobEvidence(jobResults);
  const llmText = localLlm?.text ? `\n\nResposta local Ollama (${localLlm.model}):\n${localLlm.text.trim()}` : "";
  const status = failedRequired.length ? "parcial" : "operacional";

  return [
    `RayX recebeu a missao e operou no fluxo unificado (${status}).`,
    "",
    `Objetivo: ${plan.goal}`,
    `Coleta paralela: ${okJobs}/${jobResults.length} lanes responderam.`,
    "",
    "Evidencias:",
    evidence,
    "",
    "Lanes prontas para agir:",
    ...plan.lanes.map((lane) => `- ${lane.id}: ${lane.role}`),
    llmText,
    "",
    "Proximo movimento do RayX: usar esse contexto unico para decidir ferramenta, executar a parte local e devolver uma resposta unica em portugues."
  ].filter(Boolean).join("\n");
}

function saveMission(result) {
  fs.mkdirSync(missionDir(), { recursive: true });
  fs.writeFileSync(missionPath(result.plan.id), `${JSON.stringify(result, null, 2)}\n`, "utf8");
}

async function runMission(input, options = {}) {
  const plan = buildMissionPlan(input, options);
  const startedAt = Date.now();
  const jobs = await Promise.all(plan.collectionJobs.map((job) => runRayxJob(job)));
  const localLlm = options.skipLlm ? { ok: false, text: null, error: "skipped" } : await tryLocalLlm(plan, jobs);
  const answer = composeMissionAnswer(plan, jobs, localLlm);
  const result = {
    schema: "rayx.mission.result.v1",
    generatedAt: nowIso(),
    durationMs: Date.now() - startedAt,
    plan,
    jobs,
    localLlm,
    answer
  };
  saveMission(result);
  return result;
}

function renderMissionResult(result) {
  return result.answer;
}

async function main() {
  const input = process.argv.slice(2).filter((arg) => arg !== "--json" && arg !== "--no-llm").join(" ").trim();
  if (!input) {
    process.stderr.write("Use: rayx mission \"sua tarefa\"\n");
    process.exitCode = 1;
    return;
  }

  const result = await runMission(input, { skipLlm: process.argv.includes("--no-llm") });
  process.stdout.write(process.argv.includes("--json") ? `${JSON.stringify(result, null, 2)}\n` : `${renderMissionResult(result)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  buildMissionPlan,
  classifyFactors,
  composeMissionAnswer,
  renderMissionResult,
  runMission
};
