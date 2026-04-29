#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const PDFDocument = require("pdfkit");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

function clampLines(values = [], maxLines = 120) {
  if (!Array.isArray(values)) return [];
  return values.slice(0, Math.max(0, maxLines)).map((value) => String(value || ""));
}

function formatIso(iso) {
  const date = new Date(iso || "");
  if (Number.isNaN(date.getTime())) return String(iso || "");
  return date.toISOString();
}

function formatLocal(iso) {
  const date = new Date(iso || "");
  if (Number.isNaN(date.getTime())) return String(iso || "");
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium"
  }).format(date);
}

function writeSectionTitle(doc, title) {
  doc.moveDown(0.6);
  doc.fontSize(14).fillColor("#0B1020").text(title, { underline: true });
  doc.moveDown(0.2);
}

function writeKeyValue(doc, key, value) {
  doc
    .fontSize(10)
    .fillColor("#111827")
    .text(`${key}: `, { continued: true })
    .fillColor("#374151")
    .text(String(value ?? ""));
}

function writeBullets(doc, lines = []) {
  const safeLines = clampLines(lines, 220);
  doc.fontSize(10).fillColor("#374151");
  safeLines.forEach((line) => {
    doc.text(`• ${line}`, { indent: 14 });
  });
}

function buildActor() {
  return {
    user: process.env.USERNAME || process.env.USER || "",
    host: os.hostname(),
    automationId: process.env.CODEX_AUTOMATION_ID || process.env.CATALOGO_AUTOMATION_ID || ""
  };
}

function writeOnlineLocalSyncPdf({
  rootDir,
  outFile = null,
  syncReport = null
} = {}) {
  const ROOT_DIR = rootDir ? path.resolve(rootDir) : path.resolve(__dirname, "..");
  const REPORT_DIR = path.join(ROOT_DIR, ".codex-temp", "online-local-sync");
  const resolvedOutFile = outFile
    ? path.resolve(outFile)
    : path.join(REPORT_DIR, "latest-report.pdf");

  ensureDir(path.dirname(resolvedOutFile));

  const report =
    syncReport ||
    readJson(path.join(REPORT_DIR, "latest-report.json"), { ok: false, startedAt: "", finishedAt: "", steps: [] });
  const syncStep = Array.isArray(report?.steps) ? report.steps.find((step) => step.name === "sync online news to local") : null;
  const syncStdout = syncStep?.stdout ? readJsonFromString(syncStep.stdout) : null;
  const reviewReport = readJson(path.join(ROOT_DIR, ".codex-temp", "review-team", "latest-report.json"), {});
  const rodadReport = readJson(path.join(ROOT_DIR, "data", "re-rodada-dia-geral-report.json"), {});
  const imageAudit = readJson(path.join(ROOT_DIR, "data", "news-image-focus-audit.json"), {});

  const actor = buildActor();
  const delta = rodadReport?.delta || {};

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 42, bottom: 42, left: 42, right: 42 },
    info: {
      Title: "Relatório Sync Online → Local",
      Author: actor.user || "Codex Automation",
      Subject: "Catalogo Cruzeiro do Sul",
      Creator: "catalogo-cruzeiro-do-sul/scripts/write-online-local-sync-pdf.js"
    }
  });

  const stream = fs.createWriteStream(resolvedOutFile);
  doc.pipe(stream);

  doc.fontSize(18).fillColor("#0B1020").text("Relatório — Sync Online → Local", { align: "left" });
  doc.fontSize(12).fillColor("#111827").text("Catálogo Cruzeiro do Sul", { align: "left" });
  doc.moveDown(0.8);

  writeKeyValue(doc, "Status", report?.ok ? "ok" : "falhou");
  writeKeyValue(doc, "Início (UTC)", formatIso(report?.startedAt));
  writeKeyValue(doc, "Fim (UTC)", formatIso(report?.finishedAt));
  writeKeyValue(doc, "Início (local)", formatLocal(report?.startedAt));
  writeKeyValue(doc, "Fim (local)", formatLocal(report?.finishedAt));
  writeKeyValue(doc, "Usuário", actor.user || "(desconhecido)");
  writeKeyValue(doc, "Máquina", actor.host || "(desconhecida)");
  if (actor.automationId) writeKeyValue(doc, "Automation ID", actor.automationId);

  writeSectionTitle(doc, "Resumo do Sync");
  writeKeyValue(doc, "Janela ativa (itens)", rodadReport?.activeWindowItems ?? syncStdout?.activeWindowItems ?? "(n/a)");
  writeKeyValue(doc, "Arquivo (itens)", rodadReport?.archiveItems ?? syncStdout?.archiveItems ?? "(n/a)");
  writeKeyValue(doc, "Imagens reparadas", rodadReport?.repairedImages ?? syncStdout?.repairedImages ?? "(n/a)");
  writeKeyValue(doc, "Duplicatas (online antes)", syncStdout?.onlineAuditBefore?.sameDivisionDuplicates ?? "(n/a)");
  writeKeyValue(doc, "Duplicatas (local depois)", syncStdout?.localAuditAfterSync?.sameDivisionDuplicates ?? "(n/a)");

  writeSectionTitle(doc, "Delta (o que mudou localmente)");
  writeKeyValue(doc, "Entrou (novos)", delta.added ?? 0);
  writeKeyValue(doc, "Saiu (removidos)", delta.removed ?? 0);
  writeKeyValue(doc, "Mudou (atualizados)", delta.updated ?? 0);
  if (Array.isArray(delta.addedSlugs) && delta.addedSlugs.length) {
    doc.moveDown(0.2);
    doc.fontSize(11).fillColor("#111827").text("Novos slugs (amostra):");
    writeBullets(doc, delta.addedSlugs);
  }
  if (Array.isArray(delta.removedSlugs) && delta.removedSlugs.length) {
    doc.moveDown(0.2);
    doc.fontSize(11).fillColor("#111827").text("Removidos slugs (amostra):");
    writeBullets(doc, delta.removedSlugs);
  }
  if (Array.isArray(delta.updatedSlugs) && delta.updatedSlugs.length) {
    doc.moveDown(0.2);
    doc.fontSize(11).fillColor("#111827").text("Atualizados slugs (amostra):");
    writeBullets(doc, delta.updatedSlugs);
  }

  writeSectionTitle(doc, "Revisões / Agentes");
  writeKeyValue(doc, "Review-team totalIssues", reviewReport?.summary?.totalIssues ?? 0);
  writeKeyValue(doc, "Arquivos auditados", reviewReport?.summary?.filesAudited ?? reviewReport?.filesAudited ?? "(n/a)");
  writeKeyValue(doc, "Auditoria de imagens ok", imageAudit?.summary?.ok ?? "(n/a)");
  writeKeyValue(doc, "Auditoria de imagens error", imageAudit?.summary?.error ?? 0);

  writeSectionTitle(doc, "Passos executados");
  const stepLines = Array.isArray(report?.steps)
    ? report.steps.map((step) => `${step.status} — ${step.name} (exit=${step.exitCode})`)
    : [];
  writeBullets(doc, stepLines);

  writeSectionTitle(doc, "Arquivos de relatório (latest)");
  writeBullets(doc, [
    ".codex-temp/online-local-sync/latest-report.json",
    ".codex-temp/online-local-sync/latest-report.md",
    ".codex-temp/review-team/latest-report.json",
    ".codex-temp/review-team/latest-report.md",
    "data/re-rodada-dia-geral-report.json",
    "data/news-image-focus-audit.json"
  ]);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve({ ok: true, outFile: resolvedOutFile }));
    stream.on("error", (error) => reject(error));
  });
}

function readJsonFromString(value) {
  try {
    return JSON.parse(String(value || ""));
  } catch {
    return null;
  }
}

if (require.main === module) {
  writeOnlineLocalSyncPdf()
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  writeOnlineLocalSyncPdf
};

