#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { syncProfiles } = require("./chrome-profiles");
const { buildReport } = require("./doctor");

function rayxDashboardDir() {
  const base = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
  return path.join(base, "RayX", "dashboard");
}

function dashboardPath() {
  return path.join(rayxDashboardDir(), "index.html");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatGb(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "? GB";
  return `${Number(value).toFixed(1)} GB`;
}

function statusClass(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("ok") || normalized.includes("running")) return "ok";
  if (normalized.includes("parcial") || normalized.includes("stopped")) return "warn";
  return "bad";
}

function hermesState(report) {
  if (!report.hermes?.found || !report.hermes?.status?.ok) return "falhando";
  const gateway = String(report.hermes.status.gateway || "").toLowerCase();
  return gateway.includes("running") ? "ok" : "parcial";
}

function listItems(items, mapper) {
  return items.map((item) => `<li>${mapper(item)}</li>`).join("");
}

function renderDashboard(report, profilePayload) {
  const hardware = report.hardware || {};
  const cpu = hardware.cpu || {};
  const memory = hardware.memory || {};
  const drive = hardware.drives?.find((item) => item.name === "C") || hardware.drives?.[0] || {};
  const hermes = report.hermes?.status || {};
  const ollamaModels = report.ollama?.models || [];
  const profiles = profilePayload.profiles || [];
  const allowedProfiles = profiles.filter((profile) => profile.permission === "allow").length;
  const observedProfiles = profiles.filter((profile) => profile.permission === "observe").length;
  const deniedProfiles = profiles.filter((profile) => profile.permission === "deny").length;
  const warnings = report.recommendation?.warnings || [];
  const hermesLabel = hermesState(report);
  const processRows = (report.processes?.processes || [])
    .filter((item) => ["chrome", "Codex", "codex", "ollama", "hermes"].includes(item.name))
    .slice(0, 14);

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>RayX Dashboard</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f4f6f8;
      --ink: #1b1d21;
      --muted: #636a74;
      --line: #d9dee6;
      --panel: #ffffff;
      --panel-2: #eef3f7;
      --ok: #177245;
      --warn: #9a6a00;
      --bad: #a73832;
      --cyan: #1b7895;
      --violet: #7048a8;
      --shadow: 0 12px 30px rgba(21, 28, 38, .08);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      background: var(--bg);
      color: var(--ink);
      letter-spacing: 0;
    }

    .app {
      display: grid;
      grid-template-columns: 260px minmax(0, 1fr);
      min-height: 100vh;
    }

    aside {
      background: #20242b;
      color: #f7f8fb;
      padding: 24px 18px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .mark {
      width: 42px;
      height: 42px;
      border: 1px solid rgba(255,255,255,.28);
      border-radius: 8px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #222, #38525c 52%, #6b3f87);
      font-weight: 800;
    }

    .brand h1 {
      margin: 0;
      font-size: 22px;
      line-height: 1;
    }

    .brand p {
      margin: 4px 0 0;
      color: rgba(255,255,255,.68);
      font-size: 12px;
    }

    nav {
      display: grid;
      gap: 8px;
    }

    nav a, .command {
      color: rgba(255,255,255,.78);
      text-decoration: none;
      font-size: 14px;
      padding: 9px 10px;
      border-radius: 6px;
      background: rgba(255,255,255,.06);
    }

    .command {
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      color: #ffffff;
      border: 1px solid rgba(255,255,255,.12);
    }

    main {
      padding: 28px;
      display: grid;
      gap: 18px;
      align-content: start;
    }

    .topbar {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      align-items: flex-start;
      border-bottom: 1px solid var(--line);
      padding-bottom: 18px;
    }

    .topbar h2 {
      margin: 0 0 6px;
      font-size: 28px;
      line-height: 1.05;
    }

    .topbar p {
      margin: 0;
      color: var(--muted);
      font-size: 14px;
    }

    .badge-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
    }

    .badge {
      border-radius: 999px;
      border: 1px solid var(--line);
      background: #fff;
      color: var(--ink);
      padding: 7px 10px;
      font-size: 12px;
      white-space: nowrap;
    }

    .badge.ok { border-color: rgba(23,114,69,.35); color: var(--ok); }
    .badge.warn { border-color: rgba(154,106,0,.35); color: var(--warn); }
    .badge.bad { border-color: rgba(167,56,50,.35); color: var(--bad); }

    .grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 14px;
    }

    section {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
      padding: 16px;
    }

    .span-3 { grid-column: span 3; }
    .span-4 { grid-column: span 4; }
    .span-5 { grid-column: span 5; }
    .span-6 { grid-column: span 6; }
    .span-7 { grid-column: span 7; }
    .span-8 { grid-column: span 8; }
    .span-12 { grid-column: span 12; }

    section h3 {
      margin: 0 0 12px;
      font-size: 14px;
      text-transform: uppercase;
      color: var(--muted);
      font-weight: 800;
    }

    .metric {
      display: grid;
      gap: 6px;
      margin-bottom: 12px;
    }

    .metric strong {
      font-size: 24px;
      line-height: 1;
    }

    .metric span, li, td {
      color: var(--muted);
      font-size: 13px;
    }

    .kv {
      display: grid;
      gap: 8px;
      margin: 0;
    }

    .kv div, .profile-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 0;
      border-top: 1px solid var(--line);
      font-size: 13px;
    }

    .kv dt { color: var(--muted); }
    .kv dd {
      margin: 0;
      text-align: right;
      font-weight: 700;
    }

    ul {
      margin: 0;
      padding-left: 18px;
      display: grid;
      gap: 7px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    th, td {
      padding: 8px 6px;
      border-top: 1px solid var(--line);
      text-align: left;
    }

    th {
      color: var(--muted);
      font-size: 12px;
    }

    .accent-cyan { color: var(--cyan); }
    .accent-violet { color: var(--violet); }
    .small { font-size: 12px; color: var(--muted); }

    @media (max-width: 920px) {
      .app { grid-template-columns: 1fr; }
      aside { position: static; }
      main { padding: 18px; }
      .topbar { flex-direction: column; }
      .badge-row { justify-content: flex-start; }
      .grid { grid-template-columns: 1fr; }
      .span-3, .span-4, .span-5, .span-6, .span-7, .span-8, .span-12 { grid-column: span 1; }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside>
      <div class="brand">
        <div class="mark">RX</div>
        <div>
          <h1>RayX</h1>
          <p>local-first controller</p>
        </div>
      </div>
      <nav>
        <a href="#sistema">Sistema</a>
        <a href="#inteligencia">Inteligencia</a>
        <a href="#chrome">Chrome</a>
        <a href="#processos">Processos</a>
      </nav>
      <div class="command">npm run rayx:shell</div>
      <div class="command">npm run rayx:status</div>
      <p class="small">Gerado em ${escapeHtml(report.generatedAt)}</p>
    </aside>

    <main>
      <header class="topbar">
        <div>
          <h2>Dashboard Local</h2>
          <p>${escapeHtml(hardware.host)} opera em modo ${escapeHtml(report.recommendation?.mode || "?")} com ${escapeHtml(formatGb(memory.freeGb))} livres de RAM.</p>
        </div>
        <div class="badge-row">
          <span class="badge ${statusClass(hermesLabel)}">Hermes ${escapeHtml(hermesLabel)}</span>
          <span class="badge ${report.codex?.found ? "ok" : "bad"}">Codex ${report.codex?.found ? "ok" : "falha"}</span>
          <span class="badge ${report.ollama?.found ? "ok" : "bad"}">Ollama ${ollamaModels.length}</span>
          <span class="badge ${report.chrome?.found ? "ok" : "bad"}">Chrome ${profiles.length}</span>
        </div>
      </header>

      <div class="grid" id="sistema">
        <section class="span-3">
          <h3>PC</h3>
          <div class="metric"><strong>${escapeHtml(cpu.name || "CPU ?")}</strong><span>${escapeHtml(cpu.cores)} cores, ${escapeHtml(cpu.logicalProcessors)} threads</span></div>
          <div class="metric"><strong>${escapeHtml(formatGb(memory.totalGb))}</strong><span>RAM total</span></div>
        </section>

        <section class="span-3">
          <h3>Recursos</h3>
          <div class="metric"><strong>${escapeHtml(formatGb(memory.freeGb))}</strong><span>RAM livre agora</span></div>
          <div class="metric"><strong>${escapeHtml(formatGb(drive.freeGb))}</strong><span>livres em ${escapeHtml(drive.root || "disco")}</span></div>
        </section>

        <section class="span-3">
          <h3>Politica</h3>
          <dl class="kv">
            <div><dt>Local pesado</dt><dd>${escapeHtml(report.recommendation?.policy?.localHeavyConcurrency ?? "?")}</dd></div>
            <div><dt>Cloud/API</dt><dd>${escapeHtml(report.recommendation?.policy?.cloudConcurrency ?? "?")}</dd></div>
            <div><dt>Modelos quentes</dt><dd>${escapeHtml(report.recommendation?.policy?.keepWarmLocalModels ?? "?")}</dd></div>
          </dl>
        </section>

        <section class="span-3">
          <h3>GPU</h3>
          <div class="metric"><strong>${escapeHtml((hardware.gpu || []).find((gpu) => gpu.adapterRamGb)?.name || "GPU ?")}</strong><span>${escapeHtml(formatGb((hardware.gpu || []).find((gpu) => gpu.adapterRamGb)?.adapterRamGb))} VRAM</span></div>
        </section>

        <section class="span-7" id="inteligencia">
          <h3>Inteligencia</h3>
          <dl class="kv">
            <div><dt>Hermes</dt><dd>${escapeHtml(hermesLabel)} / ${escapeHtml(hermes.gateway || "?")}</dd></div>
            <div><dt>Provider</dt><dd>${escapeHtml(hermes.provider || "?")}</dd></div>
            <div><dt>Modelo</dt><dd>${escapeHtml(hermes.model || "?")}</dd></div>
            <div><dt>Codex</dt><dd>${escapeHtml(report.codex?.version || "nao detectado")}</dd></div>
          </dl>
        </section>

        <section class="span-5">
          <h3>Ollama</h3>
          <ul>${listItems(ollamaModels, (model) => `${escapeHtml(model.name)} <span class="small">${escapeHtml(model.size)}</span>`) || "<li>Nenhum modelo local detectado</li>"}</ul>
        </section>

        <section class="span-8" id="chrome">
          <h3>Chrome</h3>
          <dl class="kv">
            <div><dt>Executavel</dt><dd>${escapeHtml(report.chrome?.exePath || "nao encontrado")}</dd></div>
            <div><dt>User data</dt><dd>${escapeHtml(report.chrome?.userData || "?")}</dd></div>
            <div><dt>Politica padrao</dt><dd>${escapeHtml(profilePayload.defaultPolicy || "ask")}</dd></div>
            <div><dt>Permissoes</dt><dd>${allowedProfiles} allow / ${observedProfiles} observe / ${deniedProfiles} deny</dd></div>
          </dl>
        </section>

        <section class="span-4">
          <h3>Perfis</h3>
          ${profiles.slice(0, 8).map((profile) => `<div class="profile-row"><span>${escapeHtml(profile.name)}</span><strong>${escapeHtml(profile.permission)}</strong></div>`).join("")}
        </section>

        <section class="span-6">
          <h3>Riscos</h3>
          <ul>${listItems(warnings.length ? warnings : ["Nenhum risco critico detectado"], escapeHtml)}</ul>
        </section>

        <section class="span-6">
          <h3>Proximos Passos</h3>
          <ul>${listItems(report.nextSteps || [], escapeHtml)}</ul>
        </section>

        <section class="span-12" id="processos">
          <h3>Processos observados</h3>
          <table>
            <thead><tr><th>Nome</th><th>PID</th><th>RAM</th><th>Caminho</th></tr></thead>
            <tbody>
              ${processRows.map((proc) => `<tr><td>${escapeHtml(proc.name)}</td><td>${escapeHtml(proc.id)}</td><td>${escapeHtml(proc.ramMb)} MB</td><td>${escapeHtml(proc.path || "")}</td></tr>`).join("")}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  </div>
</body>
</html>`;
}

function generateDashboard() {
  const report = buildReport();
  const profiles = syncProfiles().payload;
  const file = dashboardPath();
  const html = renderDashboard(report, profiles);

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html, "utf8");

  return { file, report, profiles };
}

function parseArgs(argv) {
  return {
    json: argv.includes("--json")
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = generateDashboard();

  if (args.json) {
    process.stdout.write(`${JSON.stringify({ file: result.file }, null, 2)}\n`);
    return;
  }

  process.stdout.write(`RayX dashboard gerado:\n${result.file}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  dashboardPath,
  generateDashboard,
  renderDashboard
};
