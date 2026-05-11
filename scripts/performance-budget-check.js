#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const STRICT = process.env.PERF_BUDGET_STRICT === "1";

const budgets = [
  {
    file: "index.html",
    targetKb: 140,
    ceilingKb: 180,
    reason: "HTML da primeira resposta"
  },
  {
    file: "script.js",
    targetKb: 520,
    ceilingKb: 720,
    reason: "JS principal da home"
  },
  {
    file: "news-data.js",
    targetKb: 2600,
    ceilingKb: 3400,
    reason: "Acervo estatico carregado no cliente"
  },
  {
    file: "styles.css",
    targetKb: 520,
    ceilingKb: 680,
    reason: "CSS legado compartilhado"
  },
  {
    file: "premium-home-redesign.css",
    targetKb: 380,
    ceilingKb: 520,
    reason: "Camada visual premium da home"
  },
  {
    file: "cheffe-call.js",
    targetKb: 260,
    ceilingKb: 340,
    reason: "Painel Cheffe Call"
  }
];

function sizeKb(filePath) {
  const bytes = fs.statSync(path.join(ROOT_DIR, filePath)).size;
  return Math.round((bytes / 1024) * 10) / 10;
}

function statusFor(size, budget) {
  if (size <= budget.targetKb) return "ok";
  if (size <= budget.ceilingKb) return "watch";
  return "over";
}

function run() {
  const entries = budgets.map((budget) => {
    const size = sizeKb(budget.file);
    return {
      file: budget.file,
      sizeKb: size,
      targetKb: budget.targetKb,
      ceilingKb: budget.ceilingKb,
      status: statusFor(size, budget),
      reason: budget.reason
    };
  });

  const summary = entries.reduce(
    (acc, entry) => {
      acc[entry.status] += 1;
      acc.totalKb += entry.sizeKb;
      return acc;
    },
    { ok: 0, watch: 0, over: 0, totalKb: 0 }
  );

  summary.totalKb = Math.round(summary.totalKb * 10) / 10;

  const report = {
    ok: STRICT ? summary.over === 0 : true,
    strict: STRICT,
    generatedAt: new Date().toISOString(),
    summary,
    entries
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

run();
