#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const LOCALAPPDATA = process.env.LOCALAPPDATA || "C:\\Users\\junio\\AppData\\Local";
const USERPROFILE = process.env.USERPROFILE || "C:\\Users\\junio";
const HERMES_STATE_DIR = path.join(LOCALAPPDATA, "hermes", "state");
const OUTPUT_DIR = path.join(ROOT_DIR, ".codex-temp", "hermes-continuity");
const LATEST_JSON = path.join(OUTPUT_DIR, "latest.json");
const LATEST_MD = path.join(OUTPUT_DIR, "latest.md");
const HERMES_EXE_CANDIDATES = [
  path.join(LOCALAPPDATA, "hermes", "hermes-agent", "venv", "Scripts", "hermes.exe"),
  path.join(LOCALAPPDATA, "hermes", "hermes-agent", ".venv", "Scripts", "hermes.exe"),
  "hermes"
];

const DEFAULT_SUPPORT_COUNT = 2;
const DEFAULT_TIMEOUT_MS = 90000;
const EXACT = "OK-HERMES-CONTINUITY";
const MINIMAX_ID = "minimax-m3-cloud";
const MINIMAX_IDS = new Set(["minimax-m3-cloud", "minimax-m27-fast"]);

function nowIso() {
  return new Date().toISOString();
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }
    const [key, inlineValue] = token.slice(2).split("=", 2);
    const next = argv[index + 1];
    if (inlineValue !== undefined) {
      args[key] = inlineValue;
    } else if (next && !next.startsWith("--")) {
      args[key] = next;
      index += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function readText(file, fallback = "") {
  try {
    return fs.readFileSync(file, "utf-8");
  } catch {
    return fallback;
  }
}

function resolveHermesExe() {
  for (const candidate of HERMES_EXE_CANDIDATES) {
    if (candidate === "hermes") return candidate;
    if (fs.existsSync(candidate)) return candidate;
  }
  return "hermes";
}

function summarize(text, max = 600) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 3)}...` : clean;
}

function run(command, args, options = {}) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: options.cwd || ROOT_DIR,
    encoding: "utf-8",
    windowsHide: true,
    timeout: options.timeoutMs || DEFAULT_TIMEOUT_MS,
    env: { ...process.env, ...(options.env || {}) }
  });
  const elapsedMs = Date.now() - started;
  return {
    command: [command, ...args].join(" "),
    ok: result.status === 0,
    status: result.status,
    elapsedMs,
    stdout: String(result.stdout || "").trim(),
    stderr: String(result.stderr || "").trim(),
    error: result.error ? result.error.message : ""
  };
}

function runHermes(hermesExe, args, timeoutMs) {
  return run(hermesExe, args, { timeoutMs });
}

function classifyFailure(result) {
  const haystack = `${result.stdout}\n${result.stderr}\n${result.error}`.toLowerCase();
  if (haystack.includes("401") || haystack.includes("authentication") || haystack.includes("oauth") || haystack.includes("signing in")) {
    return "auth";
  }
  if (haystack.includes("429") || haystack.includes("rate") || haystack.includes("usage_limit")) {
    return "rate-limit";
  }
  if (haystack.includes("timeout") || haystack.includes("timed out")) {
    return "timeout";
  }
  if (haystack.includes("not configured") || haystack.includes("api key") || haystack.includes("logged out")) {
    return "not-configured";
  }
  return "runtime";
}

function extractModelNamesFromOllamaList(text) {
  const models = new Set();
  for (const line of text.split(/\r?\n/).slice(1)) {
    const name = line.trim().split(/\s+/)[0];
    if (name) models.add(name);
  }
  return models;
}

function ollamaGenerate(model, timeoutMs) {
  const payload = JSON.stringify({
    model,
    prompt: `Reply exactly: ${EXACT}`,
    stream: false,
    think: false,
    options: { temperature: 0, num_predict: 24 }
  });
  const script = [
    "$ProgressPreference = 'SilentlyContinue';",
    `$body = @'`,
    payload,
    `'@;`,
    "try {",
    "  $r = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:11434/api/generate' -Body $body -ContentType 'application/json' -TimeoutSec 75;",
    "  Write-Output ([string]$r.response)",
    "} catch {",
    "  Write-Error $_.Exception.Message;",
    "  exit 1",
    "}"
  ].join("\n");
  return run("powershell", ["-NoProfile", "-Command", script], { timeoutMs });
}

function candidateResult(candidate, result, extra = {}) {
  const output = `${result.stdout}\n${result.stderr}`.trim();
  const exact = output.includes(EXACT);
  const ok = result.ok && exact;
  return {
    id: candidate.id,
    role: candidate.role,
    provider: candidate.provider,
    model: candidate.model,
    lane: candidate.lane,
    authority: candidate.authority,
    priority: candidate.priority,
    tokenSaver: Boolean(candidate.tokenSaver),
    substitute: Boolean(candidate.substitute),
    specialSupport: Boolean(candidate.specialSupport),
    ok,
    exact,
    elapsedMs: result.elapsedMs,
    failure: ok ? null : classifyFailure(result),
    command: candidate.commandLabel || result.command,
    output: summarize(output || result.error),
    ...extra
  };
}

function buildCandidates(options) {
  const base = [
    {
      id: "chatgpt-codex-primary",
      role: "primary-brain",
      provider: "openai-codex",
      model: "gpt-5.5",
      lane: "authority",
      authority: "final-when-healthy"
    },
    {
      id: "minimax-m3-cloud",
      role: "primary-codex-substitute-long-context",
      provider: "custom:local-ollama",
      model: "minimax-m3:cloud",
      lane: "replacement",
      authority: "substitute-when-codex-stops",
      priority: 10,
      tokenSaver: true,
      substitute: true
    },
    {
      id: "minimax-m27-fast",
      role: "fast-codex-substitute-max-speed",
      provider: "nvidia",
      model: "minimaxai/minimax-m2.7",
      lane: "replacement",
      authority: "substitute-when-codex-stops",
      priority: 20,
      tokenSaver: true,
      substitute: true
    },
    {
      id: "gemma3-4b",
      role: "pt-br-review-worker",
      provider: "custom:local-ollama",
      model: "gemma3:4b",
      lane: "support",
      authority: "worker-only",
      priority: 80
    },
    {
      id: "llama3-2-3b",
      role: "ops-checklist-worker",
      provider: "custom:local-ollama",
      model: "llama3.2:3b",
      lane: "support",
      authority: "fallback-only",
      priority: 80
    },
    {
      id: "qwen3-4b",
      role: "local-qwen-reasoning-worker",
      provider: "custom:local-ollama",
      model: "qwen3-hermes:4b",
      lane: "support",
      authority: "worker-only",
      priority: 75,
      tokenSaver: true
    },
    {
      id: "qwen2-5-coder-3b",
      role: "code-only-worker",
      provider: "custom:local-ollama",
      model: "qwen2.5-coder:3b",
      lane: "code-support",
      authority: "code-draft-only",
      priority: 70,
      tokenSaver: true
    }
  ];

  if (options.includeCloud) {
    base.push(
      {
        id: "gemini-flash-lite",
        role: "cloud-fast-worker",
        provider: "gemini",
        model: "gemini-2.5-flash-lite",
        lane: "support",
        authority: "fallback-only",
        priority: 100
      },
      {
        id: "nvidia-nemotron-v15",
        role: "rescue-cloud-fallback-worker",
        provider: "nvidia",
        model: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
        lane: "support",
        authority: "fallback-only",
        priority: 110
      }
    );
  }

  return base;
}

function testCandidate(candidate, context) {
  if (candidate.provider === "openai-codex") {
    const result = runHermes(
      context.hermesExe,
      ["-z", `Responda exatamente: ${EXACT}`, "--provider", candidate.provider, "-m", candidate.model],
      context.timeoutMs
    );
    return candidateResult(candidate, result);
  }

  if (candidate.provider === "custom:local-ollama") {
    const shouldTryMissingModel = MINIMAX_IDS.has(candidate.id) && context.tryMissingMinimax;
    if (!context.ollamaModels.has(candidate.model) && !shouldTryMissingModel) {
      return {
        id: candidate.id,
        role: candidate.role,
        provider: candidate.provider,
        model: candidate.model,
        lane: candidate.lane,
        authority: candidate.authority,
        ok: false,
        exact: false,
        elapsedMs: null,
        failure: "not-installed-or-unavailable",
        command: "ollama list",
        output: "Model was not listed by Ollama in this session."
      };
    }
    const result = ollamaGenerate(candidate.model, context.timeoutMs);
    const direct = candidateResult(candidate, result, { command: `ollama /api/generate ${candidate.model}` });
    if (direct.ok || !MINIMAX_IDS.has(candidate.id)) return direct;

    const hermesResult = runHermes(
      context.hermesExe,
      ["-z", `Reply exactly: ${EXACT}`, "--provider", candidate.provider, "-m", candidate.model],
      context.timeoutMs
    );
    return candidateResult(candidate, hermesResult, {
      firstAttempt: {
        command: direct.command,
        ok: direct.ok,
        failure: direct.failure,
        output: direct.output
      }
    });
  }

  const result = runHermes(
    context.hermesExe,
    ["-z", `Reply exactly: ${EXACT}`, "--provider", candidate.provider, "-m", candidate.model],
    context.timeoutMs
  );
  return candidateResult(candidate, result);
}

function chooseContinuity(results, supportCount) {
  const codex = results.find((item) => item.id === "chatgpt-codex-primary");
  const healthyReplacement = results
    .filter((item) => item.ok && item.substitute)
    .sort((a, b) => (a.priority || 999) - (b.priority || 999) || a.elapsedMs - b.elapsedMs);
  const healthyPrioritySupport = results
    .filter((item) => item.ok && item.tokenSaver && item.lane !== "code-support")
    .sort((a, b) => (a.priority || 999) - (b.priority || 999) || a.elapsedMs - b.elapsedMs);
  const healthyFallback = results
    .filter((item) => item.ok && item.lane === "support" && !item.tokenSaver)
    .sort((a, b) => a.elapsedMs - b.elapsedMs);
  const codeSupport = results
    .filter((item) => item.ok && item.lane === "code-support")
    .sort((a, b) => a.elapsedMs - b.elapsedMs);
  const warmSupport = [...healthyPrioritySupport];
  for (const fallback of healthyFallback) {
    if (warmSupport.length >= supportCount) break;
    if (!warmSupport.some((item) => item.id === fallback.id)) warmSupport.push(fallback);
  }

  return {
    authority: codex && codex.ok ? codex.id : healthyReplacement[0]?.id || healthyPrioritySupport[0]?.id || codeSupport[0]?.id || null,
    substituteAuthority: codex && codex.ok ? null : healthyReplacement[0]?.id || null,
    codexHealthy: Boolean(codex && codex.ok),
    reauthRequired: Boolean(codex && !codex.ok && codex.failure === "auth"),
    fastestSupport: healthyPrioritySupport.sort((a, b) => a.elapsedMs - b.elapsedMs)[0]?.id || null,
    warmSupport: warmSupport.slice(0, supportCount),
    tokenSavers: healthyPrioritySupport,
    fallbacks: healthyFallback,
    codeSupport: codeSupport[0] || null
  };
}

function renderMarkdown(report) {
  const rows = report.results
    .map((item) => {
      const elapsed = item.elapsedMs == null ? "-" : `${item.elapsedMs}ms`;
      return `| ${item.id} | ${item.ok ? "ok" : "fail"} | ${item.provider} | ${item.model} | ${elapsed} | ${item.failure || "-"} |`;
    })
    .join("\n");

  const warm = report.selection.warmSupport.length
    ? report.selection.warmSupport.map((item, index) => `${index + 1}. ${item.id} (${item.elapsedMs}ms)`).join("\n")
    : "None";

  const alert = report.selection.reauthRequired
    ? "\n## Alert\n\nChatGPT/Codex is the front door and is not healthy because authentication failed. Tell the user: `me autentique`; then run `hermes auth add openai-codex` and rerun this router.\n"
    : "";

  return [
    "# Hermes Continuity Router",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `Authority: ${report.selection.authority || "none"}`,
    `Substitute authority: ${report.selection.substituteAuthority || "none"}`,
    `Codex healthy: ${report.selection.codexHealthy ? "yes" : "no"}`,
    `Reauth required: ${report.selection.reauthRequired ? "yes" : "no"}`,
    "",
    "## Warm Support",
    "",
    warm,
    alert,
    "## Results",
    "",
    "| Candidate | Status | Provider | Model | Elapsed | Failure |",
    "| --- | --- | --- | --- | ---: | --- |",
    rows,
    "",
    "## Rule",
    "",
    "- ChatGPT/Codex is the final authority when healthy.",
    "- If ChatGPT/Codex stops, MiniMax M3 cloud is the first substitute and MiniMax M2.7 Max Speed is the second substitute.",
    "- When ChatGPT/Codex is healthy, only MiniMax workers stay warm by default; all other models are fallback.",
    "- Gemma, Gemini, Llama, Nemotron, and other healthy models are fallback only.",
    "- Qwen Coder remains code-only and never becomes the normal chat authority.",
    ""
  ].join("\n");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const watch = Boolean(args.watch);
  const intervalSeconds = Math.max(30, Number(args.interval || 300));
  runOnce(args);

  if (!watch) return;

  setInterval(() => {
    runOnce(args);
  }, intervalSeconds * 1000);
}

function runOnce(args) {
  const supportCount = Number(args.support || DEFAULT_SUPPORT_COUNT);
  const timeoutMs = Number(args.timeout || DEFAULT_TIMEOUT_MS);
  const includeCloud = args["include-cloud"] !== "false";
  const tryMissingMinimax = args["try-missing-minimax"] !== "false";
  const hermesExe = resolveHermesExe();

  const ollamaList = run("ollama", ["list"], { timeoutMs: 20000 });
  const ollamaModels = ollamaList.ok ? extractModelNamesFromOllamaList(ollamaList.stdout) : new Set();
  const candidates = buildCandidates({ includeCloud });
  const context = { hermesExe, timeoutMs, ollamaModels, tryMissingMinimax };
  const results = candidates.map((candidate) => testCandidate(candidate, context));
  const selection = chooseContinuity(results, supportCount);

  const report = {
    schema: "projeto-codex.hermes-continuity-router.v1",
    generatedAt: nowIso(),
    hermesExe,
    supportCount,
    includeCloud,
    tryMissingMinimax,
    ollama: {
      ok: ollamaList.ok,
      models: [...ollamaModels].sort(),
      output: summarize(ollamaList.stdout || ollamaList.stderr || ollamaList.error)
    },
    selection,
    results
  };

  writeJson(LATEST_JSON, report);
  fs.writeFileSync(LATEST_MD, renderMarkdown(report), "utf-8");
  ensureDir(HERMES_STATE_DIR);
  writeJson(path.join(HERMES_STATE_DIR, "hermes_continuity_router_latest.json"), report);

  if (selection.reauthRequired) {
    console.log("ALERTA: ChatGPT/Codex parou por autenticacao. Diga ao usuario: me autentique. Depois rode: hermes auth add openai-codex");
  }

  console.log(`authority=${selection.authority || "none"}`);
  console.log(`codexHealthy=${selection.codexHealthy}`);
  console.log(`fastestSupport=${selection.fastestSupport || "none"}`);
  console.log(`substituteAuthority=${selection.substituteAuthority || "none"}`);
  console.log(`warmSupport=${selection.warmSupport.map((item) => item.id).join(",") || "none"}`);
  console.log(`tokenSavers=${selection.tokenSavers.map((item) => item.id).join(",") || "none"}`);
  console.log(`report=${LATEST_MD}`);

  if (!selection.authority) {
    process.exitCode = 2;
  }
}

main();
