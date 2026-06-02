#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { buildReport } = require("./doctor");

function companionDir() {
  const base = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
  return path.join(base, "RayX", "companion");
}

function companionPath() {
  return path.join(companionDir(), "index.html");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hermesState(report) {
  if (!report.hermes?.found || !report.hermes?.status?.ok) return "alerta";
  const gateway = String(report.hermes.status.gateway || "").toLowerCase();
  return gateway.includes("running") ? "online" : "observando";
}

function companionMessage(report) {
  const state = hermesState(report);
  const mode = report.recommendation?.mode || "?";
  const freeRam = report.hardware?.memory?.freeGb;
  const ram = Number.isFinite(Number(freeRam)) ? `${Number(freeRam).toFixed(1)} GB` : "? GB";

  if (state === "online") {
    return `Estou online em modo ${mode}. RAM livre: ${ram}.`;
  }

  if (state === "observando") {
    return `Hermes responde, mas o gateway nao esta rodando. Modo ${mode}.`;
  }

  return `Preciso de atencao: algum eixo local falhou. Modo ${mode}.`;
}

function renderCompanion(report) {
  const state = hermesState(report);
  const message = companionMessage(report);
  const hermes = report.hermes?.status || {};

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>RayX Companion</title>
  <style>
    :root {
      --ink: #1c2026;
      --muted: #68707c;
      --line: #dfe5ec;
      --panel: #ffffff;
      --ok: #177245;
      --warn: #9a6a00;
      --bad: #a73832;
      --accent: #1b7895;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--ink);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #edf2f6;
      letter-spacing: 0;
    }

    .companion {
      width: min(360px, calc(100vw - 28px));
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: 0 18px 44px rgba(19, 30, 42, .14);
      padding: 18px;
      display: grid;
      gap: 14px;
    }

    .top {
      display: flex;
      align-items: center;
      gap: 13px;
    }

    .avatar {
      width: 74px;
      height: 74px;
      border-radius: 50%;
      position: relative;
      background:
        radial-gradient(circle at 50% 35%, #f8d9c7 0 30%, transparent 31%),
        radial-gradient(circle at 50% 62%, #2f2a33 0 48%, transparent 49%),
        linear-gradient(135deg, #1d343e, #6c4a80);
      border: 2px solid #ffffff;
      outline: 1px solid var(--line);
      overflow: hidden;
    }

    .avatar::before {
      content: "";
      position: absolute;
      inset: 9px 9px auto;
      height: 32px;
      border-radius: 50% 50% 40% 40%;
      background:
        radial-gradient(circle at 20% 56%, #15151a 0 5px, transparent 6px),
        radial-gradient(circle at 80% 56%, #15151a 0 5px, transparent 6px),
        linear-gradient(#1d171c, #3b2630);
    }

    .avatar::after {
      content: "";
      position: absolute;
      left: 24px;
      top: 42px;
      width: 26px;
      height: 12px;
      border-bottom: 2px solid rgba(28,32,38,.75);
      border-radius: 50%;
    }

    .identity {
      min-width: 0;
    }

    h1 {
      margin: 0;
      font-size: 22px;
      line-height: 1;
    }

    .state {
      margin-top: 6px;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-size: 13px;
      color: var(--muted);
    }

    .dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--bad);
    }

    .dot.online { background: var(--ok); }
    .dot.observando { background: var(--warn); }

    .bubble {
      border-radius: 8px;
      background: #f5f8fa;
      border: 1px solid var(--line);
      padding: 12px;
      color: var(--ink);
      font-size: 14px;
      line-height: 1.4;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .tile {
      border: 1px solid var(--line);
      border-radius: 7px;
      padding: 10px;
      background: #fff;
    }

    .tile span {
      display: block;
      color: var(--muted);
      font-size: 12px;
      margin-bottom: 5px;
    }

    .tile strong {
      font-size: 14px;
      word-break: break-word;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      color: var(--muted);
      font-size: 12px;
      border-top: 1px solid var(--line);
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <main class="companion">
    <div class="top">
      <div class="avatar" aria-hidden="true"></div>
      <div class="identity">
        <h1>RayX</h1>
        <div class="state"><span class="dot ${escapeHtml(state)}"></span>${escapeHtml(state)}</div>
      </div>
    </div>
    <div class="bubble">${escapeHtml(message)}</div>
    <section class="grid" aria-label="Resumo local">
      <div class="tile"><span>Modo</span><strong>${escapeHtml(report.recommendation?.mode || "?")}</strong></div>
      <div class="tile"><span>Hermes</span><strong>${escapeHtml(hermes.gateway || "?")}</strong></div>
      <div class="tile"><span>Provider</span><strong>${escapeHtml(hermes.provider || "?")}</strong></div>
      <div class="tile"><span>Chrome</span><strong>${escapeHtml(report.chrome?.profileCount || 0)} perfis</strong></div>
    </section>
    <div class="footer">
      <span>local-first</span>
      <span>${escapeHtml(new Date(report.generatedAt).toLocaleString("pt-BR"))}</span>
    </div>
  </main>
</body>
</html>`;
}

function generateCompanion() {
  const report = buildReport();
  const file = companionPath();
  const html = renderCompanion(report);

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html, "utf8");

  return { file, report };
}

function main() {
  const result = generateCompanion();
  process.stdout.write(`RayX companion gerado:\n${result.file}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  companionPath,
  generateCompanion,
  renderCompanion
};
