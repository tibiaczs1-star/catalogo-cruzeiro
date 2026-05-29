#!/usr/bin/env node
"use strict";

const { getChromeBridgeStatus } = require("../adapters/chrome");
const { getHermesStatus } = require("../adapters/hermes");
const { syncProfiles } = require("./chrome-profiles");
const { scanCatalog } = require("./catalog");
const { checkDesktop } = require("./desktop");
const { buildReport } = require("./doctor");
const { runCycle } = require("./orchestrator");

function nowIso() {
  return new Date().toISOString();
}

function buildBootPlan() {
  return {
    schema: "rayx.boot.plan.v1",
    generatedAt: nowIso(),
    maxSilentOperationMinutes: 10,
    steps: [
      {
        id: "doctor",
        title: "Diagnosticar PC e provedores locais",
        command: "rayx doctor",
        maxSilentMinutes: 10
      },
      {
        id: "profiles",
        title: "Sincronizar perfis Chrome e permissoes",
        command: "rayx profiles",
        maxSilentMinutes: 10
      },
      {
        id: "catalog",
        title: "Catalogar CLIs, skills e prompts herdados",
        command: "rayx catalog",
        maxSilentMinutes: 10
      },
      {
        id: "hermes",
        title: "Preparar adaptador Hermes",
        command: "rayx hermes status",
        maxSilentMinutes: 10
      },
      {
        id: "chrome-bridge",
        title: "Preparar ponte Chrome/CDP",
        command: "rayx chrome-bridge status",
        maxSilentMinutes: 10
      },
      {
        id: "orchestrator",
        title: "Rodar ciclo operacional local",
        command: "rayx orchestrator cycle",
        maxSilentMinutes: 10
      },
      {
        id: "desktop-check",
        title: "Validar console desktop",
        command: "rayx desktop --check",
        maxSilentMinutes: 10
      }
    ]
  };
}

function runStep(step, context) {
  if (step.id === "doctor") {
    context.report = buildReport();
    return {
      ok: true,
      summary: `${context.report.hardware?.host || "PC"} / modo ${context.report.recommendation?.mode || "?"}`
    };
  }

  if (step.id === "profiles") {
    context.profileResult = syncProfiles(context.report);
    return {
      ok: true,
      summary: `${context.profileResult.payload.profiles.length} perfis Chrome`
    };
  }

  if (step.id === "catalog") {
    context.catalog = scanCatalog({ report: context.report });
    const found = context.catalog.tools.filter((tool) => tool.found).length;
    return {
      ok: true,
      summary: `${found}/${context.catalog.tools.length} ferramentas, ${context.catalog.skills.total} skills`
    };
  }

  if (step.id === "hermes") {
    context.hermes = getHermesStatus({ report: context.report });
    return {
      ok: context.hermes.found,
      summary: `${context.hermes.status} / ${context.hermes.provider || "sem provider"}`
    };
  }

  if (step.id === "chrome-bridge") {
    context.chromeBridge = getChromeBridgeStatus({
      report: context.report,
      profileResult: context.profileResult
    });
    return {
      ok: context.chromeBridge.found,
      summary: `${context.chromeBridge.profiles.length} perfis / CDP ${context.chromeBridge.cdpReachable ? "ativo" : "inativo"}`
    };
  }

  if (step.id === "orchestrator") {
    context.operational = runCycle();
    return {
      ok: true,
      summary: `${context.operational.lastCycle?.adapters?.ready ?? 0} adaptadores ready`
    };
  }

  if (step.id === "desktop-check") {
    context.desktop = checkDesktop();
    return {
      ok: context.desktop.ready,
      summary: context.desktop.ready ? "desktop pronto" : "desktop incompleto"
    };
  }

  return { ok: false, summary: "etapa desconhecida" };
}

function runBoot(options = {}) {
  const plan = buildBootPlan();
  const context = {};
  const results = [];

  for (const step of plan.steps) {
    const startedAt = Date.now();
    options.onProgress?.({
      type: "start",
      at: nowIso(),
      step
    });

    let result;
    try {
      result = runStep(step, context);
    } catch (error) {
      result = {
        ok: false,
        summary: error.message,
        error: error.stack || error.message
      };
    }

    const row = {
      ...step,
      ok: Boolean(result.ok),
      summary: result.summary,
      error: result.error || null,
      durationMs: Date.now() - startedAt,
      finishedAt: nowIso()
    };
    results.push(row);
    options.onProgress?.({
      type: "finish",
      at: nowIso(),
      step: row
    });
  }

  return {
    schema: "rayx.boot.result.v1",
    generatedAt: nowIso(),
    ok: results.every((step) => step.ok),
    plan,
    results,
    context: {
      catalog: context.catalog
        ? {
            foundTools: context.catalog.tools.filter((tool) => tool.found).length,
            totalTools: context.catalog.tools.length,
            skills: context.catalog.skills.total
          }
        : null,
      hermes: context.hermes || null,
      chromeBridge: context.chromeBridge
        ? {
            found: context.chromeBridge.found,
            profiles: context.chromeBridge.profiles.length,
            cdpReachable: context.chromeBridge.cdpReachable,
            remoteDebuggingPort: context.chromeBridge.remoteDebuggingPort
          }
        : null,
      desktop: context.desktop || null
    }
  };
}

function renderBootResult(result) {
  const lines = [
    "RayX Boot",
    "",
    `estado: ${result.ok ? "ok" : "parcial"}`,
    `etapas: ${result.results.length}`,
    ""
  ];

  for (const step of result.results) {
    lines.push(`${step.ok ? "OK" : "NO"} ${step.id} (${step.durationMs}ms) - ${step.summary}`);
  }

  return lines.join("\n");
}

function main() {
  const json = process.argv.includes("--json");
  const result = runBoot({
    onProgress: json
      ? null
      : (event) => {
          if (event.type === "start") {
            process.stdout.write(`> ${event.step.id}: ${event.step.title}\n`);
          }
          if (event.type === "finish") {
            process.stdout.write(`  ${event.step.ok ? "OK" : "NO"} ${event.step.summary} (${event.step.durationMs}ms)\n`);
          }
        }
  });

  process.stdout.write(json ? `${JSON.stringify(result, null, 2)}\n` : `${renderBootResult(result)}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  buildBootPlan,
  renderBootResult,
  runBoot
};
