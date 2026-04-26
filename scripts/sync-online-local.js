#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

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

function runStep(name, command, args) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, args, {
    cwd: ROOT_DIR,
    encoding: "utf-8",
    env: {
      ...process.env,
      CATALOGO_SYNC_SURFACE: "home-front-preview",
      CATALOGO_DETAIL_PAGES_KEEP_FULL_BODY: "1"
    }
  });

  return {
    name,
    command: [command, ...args].join(" "),
    startedAt,
    finishedAt: new Date().toISOString(),
    status: result.status === 0 ? "passed" : "failed",
    exitCode: result.status,
    stdout: tail(result.stdout),
    stderr: tail(result.stderr || result.error?.message || "")
  };
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

function main() {
  const startedAt = new Date().toISOString();
  const node = process.execPath;
  const steps = [];

  steps.push(runStep("sync online news to local", node, ["scripts/re-rodada-dia-geral.js"]));

  if (steps.at(-1).status === "passed") {
    steps.push(enforceReviewTeamGate(runStep("review home/front summaries", node, ["scripts/review-team-audit.js"])));
  }

  if (steps.at(-1).status === "passed") {
    steps.push(
      runStep("audit news images", node, [
        "scripts/audit-news-image-focus.js",
        "--offline",
        `--limit=${NEWS_IMAGE_AUDIT_LIMIT}`,
        "--strict-new"
      ])
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
    process.exit(1);
  }
}

main();
