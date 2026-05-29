#!/usr/bin/env node
"use strict";

const { buildReport } = require("./doctor");

function yesNo(value) {
  return value ? "ok" : "falhando";
}

function hermesState(report) {
  if (!report.hermes?.found) return "falhando";
  if (!report.hermes?.status?.ok) return "falhando";

  const gateway = String(report.hermes.status.gateway || "").toLowerCase();
  if (gateway.includes("running")) return "ok";
  return "parcial";
}

function formatGb(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "? GB";
  }

  return `${Number(value).toFixed(1)} GB`;
}

function getDriveSummary(report) {
  const drive = report.hardware?.drives?.find((item) => item.name === "C") ||
    report.hardware?.drives?.[0];

  if (!drive) return "disco ?";
  return `${drive.name}: ${formatGb(drive.freeGb)} livres`;
}

function getMainGpu(report) {
  const gpus = report.hardware?.gpu || [];
  const realGpu = gpus.find((gpu) => gpu.adapterRamGb) || gpus[0];
  return realGpu?.name || "GPU ?";
}

function getWarnings(report) {
  const warnings = [...(report.recommendation?.warnings || [])];

  if (report.chrome?.found && !report.chrome?.inPath) {
    warnings.push("Chrome encontrado por caminho real, mas fora do PATH.");
  }

  if (report.hermes?.status?.needsUpdate) {
    warnings.push("Hermes indica atualizacao disponivel.");
  }

  if (!report.hermes?.status?.codexAuth) {
    warnings.push("Hermes nao confirmou auth OpenAI Codex.");
  }

  return warnings;
}

function renderStatus(report) {
  const hardware = report.hardware || {};
  const cpu = hardware.cpu || {};
  const memory = hardware.memory || {};
  const recommendation = report.recommendation || {};
  const hermesStatus = report.hermes?.status || {};
  const ollamaModels = report.ollama?.models || [];
  const warnings = getWarnings(report);
  const next = report.nextSteps || [];

  const lines = [
    "RAYX LOCAL STATUS",
    "",
    `PC: ${hardware.host || "?"} | ${cpu.name || "CPU ?"} | ${formatGb(memory.totalGb)} RAM | ${getMainGpu(report)}`,
    `Recursos: ${getDriveSummary(report)} | memoria livre ${formatGb(memory.freeGb)} | modo ${recommendation.mode || "?"}`,
    "",
    `Hermes: ${hermesState(report)} | gateway ${hermesStatus.gateway || "?"} | modelo ${hermesStatus.model || "?"} | provider ${hermesStatus.provider || "?"}`,
    `Codex: ${yesNo(report.codex?.found)} | ${report.codex?.version || "versao desconhecida"}`,
    `Ollama: ${yesNo(report.ollama?.found)} | ${ollamaModels.length} modelos locais${ollamaModels.length ? ` | ${ollamaModels.map((model) => model.name).join(", ")}` : ""}`,
    `Chrome: ${yesNo(report.chrome?.found)} | ${report.chrome?.profileCount || 0} perfis | ${report.chrome?.exePath || "nao encontrado"}`,
    "",
    "Politica local:",
    `- concorrencia local pesada: ${recommendation.policy?.localHeavyConcurrency ?? "?"}`,
    `- concorrencia cloud/API: ${recommendation.policy?.cloudConcurrency ?? "?"}`,
    `- modelos locais quentes: ${recommendation.policy?.keepWarmLocalModels ?? "?"}`,
    `- satisfacao obrigatoria: ${recommendation.policy?.maxSilentOperationMinutes ?? "?"} min`,
    "",
    "Riscos:",
    ...(warnings.length ? warnings.map((item) => `- ${item}`) : ["- nenhum risco critico detectado"]),
    "",
    "Proximos passos:",
    ...(next.length ? next.slice(0, 4).map((item) => `- ${item}`) : ["- criar shell e dashboard"])
  ];

  return lines.join("\n");
}

function main() {
  const report = buildReport();
  process.stdout.write(`${renderStatus(report)}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  renderStatus
};
