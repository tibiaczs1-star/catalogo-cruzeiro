#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const REPORT_DIR = path.join(ROOT_DIR, ".codex-temp", "online-local-sync");
const REPORT_JSON_FILE = path.join(REPORT_DIR, "latest-report.json");
const REPORT_MD_FILE = path.join(REPORT_DIR, "latest-report.md");
const NEWS_IMAGE_AUDIT_LIMIT = Math.max(120, Number(process.env.CATALOGO_SYNC_NEWS_LIMIT || 1000));

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function tail(value = "", maxLength = 4000) {
  const text = String(value || "");
  return text.length > maxLength ? text.slice(-maxLength) : text;
}

async function runStep(name, fn) {
  const startedAt = new Date().toISOString();
  try {
    const value = await fn();
    const exitCode = Number(value?.exitCode || 0) || 0;

    return {
      name,
      command: "in-process",
      startedAt,
      finishedAt: new Date().toISOString(),
      status: exitCode === 0 ? "passed" : "failed",
      exitCode,
      stdout: tail(value ? JSON.stringify(value).slice(0, 4000) : ""),
      stderr: tail(value?.stderr || "")
    };
  } catch (error) {
    return {
      name,
      command: "in-process",
      startedAt,
      finishedAt: new Date().toISOString(),
      status: "failed",
      exitCode: 1,
      stdout: "",
      stderr: tail(error?.stack || error?.message || String(error || ""))
    };
  }
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

function enforceReviewTeamGate(step) {
  const reviewReport = readJson(path.join(ROOT_DIR, ".codex-temp", "review-team", "latest-report.json"));
  const totalIssues = Number(reviewReport?.summary?.totalIssues || 0);
  if (step.status === "passed" && totalIssues > 0) {
    return {
      ...step,
      status: "failed",
      exitCode: 1,
      stderr: tail(`${step.stderr || ""}\nreview-team totalIssues=${totalIssues}`)
    };
  }
  return step;
}

function buildMarkdown(report) {
  const lines = [
    "# Online Local Sync",
    "",
    `Started: ${report.startedAt}`,
    `Finished: ${report.finishedAt}`,
    `Status: ${report.ok ? "ok" : "failed"}`,
    "",
    "## Scope",
    "",
    "- Sync online Render news/API snapshot into the local workspace.",
    "- Validate home/front/card summaries.",
    "- Keep detail reading pages complete; do not shorten article bodies.",
    "- Audit news images after sync.",
    "",
    "## Steps",
    ""
  ];

  report.steps.forEach((step) => {
    lines.push(`- ${step.status}: ${step.name} (${step.exitCode})`);
  });

  return `${lines.join("\n")}\n`;
}

async function main() {
  const startedAt = new Date().toISOString();
  const steps = [];

  process.env.CATALOGO_SYNC_SURFACE = "home-front-preview";
  process.env.CATALOGO_DETAIL_PAGES_KEEP_FULL_BODY = "1";

  steps.push(
    await runStep("sync online news to local", async () => {
      // NOTE: child_process spawn is blocked in the sandbox (EPERM),
      // so run all steps in-process.
      const { runReRodadaDiaGeral } = require("./re-rodada-dia-geral.js");
      return runReRodadaDiaGeral();
    })
  );

  if (steps.at(-1)?.status === "passed") {
    steps.push(
      await runStep("sanitize public language", async () => {
        const { runSanitizePublicLanguage } = require("./sanitize-public-language.js");
        return runSanitizePublicLanguage();
      })
    );
  }

  if (steps.at(-1)?.status === "passed") {
    const reviewStep = enforceReviewTeamGate(
      await runStep("review home/front summaries", async () => {
        const { runReviewTeamAudit } = require("./review-team-audit.js");
        return runReviewTeamAudit();
      })
    );
    steps.push(reviewStep);
  }

  if (steps.at(-1)?.status === "passed") {
    steps.push(
      await runStep("audit news images", async () => {
        const { runAuditNewsImageFocus } = require("./audit-news-image-focus.js");
        return runAuditNewsImageFocus([
          "--offline",
          `--limit=${NEWS_IMAGE_AUDIT_LIMIT}`,
          "--strict-new"
        ]);
      })
    );
  }

  const report = {
    ok: steps.every((step) => step.status === "passed"),
    startedAt,
    finishedAt: new Date().toISOString(),
    rule:
      "Home/cards/chamadas usam resumo curto; noticia.html e paginas de leitura mantem estrutura completa.",
    steps
  };

  ensureDir(REPORT_DIR);
  fs.writeFileSync(REPORT_JSON_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
  fs.writeFileSync(REPORT_MD_FILE, buildMarkdown(report), "utf-8");
  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  ensureDir(REPORT_DIR);
  const report = {
    ok: false,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    rule:
      "Home/cards/chamadas usam resumo curto; noticia.html e paginas de leitura mantem estrutura completa.",
    steps: [
      {
        name: "sync orchestrator",
        command: "in-process",
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        status: "failed",
        exitCode: 1,
        stdout: "",
        stderr: tail(error?.stack || error?.message || String(error || ""))
      }
    ]
  };

  fs.writeFileSync(REPORT_JSON_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
  fs.writeFileSync(REPORT_MD_FILE, buildMarkdown(report), "utf-8");
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
});
