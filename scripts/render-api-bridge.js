#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const HERMES_ENV_FILE = path.join(process.env.USERPROFILE || "C:\\Users\\junio", ".hermes", ".env");
const API_BASE = "https://api.render.com/v1";

function readText(file, fallback = "") {
  try {
    return fs.readFileSync(file, "utf-8");
  } catch {
    return fallback;
  }
}

function parseEnv(text) {
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const divider = trimmed.indexOf("=");
    if (divider < 1) continue;
    env[trimmed.slice(0, divider)] = trimmed.slice(divider + 1);
  }
  return env;
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }
    const [rawKey, inlineValue] = token.slice(2).split("=", 2);
    const next = argv[index + 1];
    if (inlineValue !== undefined) {
      args[rawKey] = inlineValue;
    } else if (next && !next.startsWith("--")) {
      args[rawKey] = next;
      index += 1;
    } else {
      args[rawKey] = true;
    }
  }
  return args;
}

function getApiKey() {
  const env = parseEnv(readText(HERMES_ENV_FILE));
  const key = String(env.RENDER_API_KEY || process.env.RENDER_API_KEY || "").trim();
  if (!key) throw new Error(`RENDER_API_KEY ausente em ${HERMES_ENV_FILE}`);
  return key;
}

async function request(pathname, options = {}) {
  const response = await fetch(`${API_BASE}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    const err = new Error(`Render API ${response.status}`);
    err.status = response.status;
    err.body = body;
    throw err;
  }
  return body;
}

function serviceRecord(entry) {
  const service = entry.service || entry;
  const details = service.serviceDetails || {};
  return {
    id: service.id,
    name: service.name,
    type: service.type,
    branch: service.branch,
    repo: service.repo,
    url: details.url || "",
    dashboardUrl: service.dashboardUrl,
    suspended: service.suspended,
    updatedAt: service.updatedAt
  };
}

async function listServices() {
  const payload = await request("/services?limit=100");
  return Array.isArray(payload) ? payload.map(serviceRecord) : [];
}

async function findService(nameOrId) {
  const services = await listServices();
  const query = String(nameOrId || "catalogo-cruzeiro-web").trim().toLowerCase();
  return (
    services.find((service) => service.id.toLowerCase() === query) ||
    services.find((service) => service.name.toLowerCase() === query) ||
    services.find((service) => service.name.toLowerCase().includes(query))
  );
}

async function listDeploys(serviceId) {
  const payload = await request(`/services/${encodeURIComponent(serviceId)}/deploys?limit=20`);
  return Array.isArray(payload)
    ? payload.map((entry) => {
        const deploy = entry.deploy || entry;
        return {
          id: deploy.id,
          status: deploy.status,
          commit: deploy.commit,
          createdAt: deploy.createdAt,
          updatedAt: deploy.updatedAt,
          finishedAt: deploy.finishedAt
        };
      })
    : [];
}

async function getService(serviceId) {
  return request(`/services/${encodeURIComponent(serviceId)}`);
}

async function listEnvVars(serviceId) {
  const payload = await request(`/services/${encodeURIComponent(serviceId)}/env-vars?limit=100`);
  return Array.isArray(payload)
    ? payload.map((entry) => ({ key: entry.envVar?.key || entry.key }))
    : [];
}

async function getEnvVars(serviceId) {
  const payload = await request(`/services/${encodeURIComponent(serviceId)}/env-vars?limit=100`);
  return Array.isArray(payload)
    ? payload.map((entry) => entry.envVar || entry).filter((entry) => entry?.key)
    : [];
}

async function createAshotelariaService(source) {
  const sourceConfig = await getService(source.id);
  const sourceEnv = await getEnvVars(source.id);
  const selected = sourceEnv.filter((entry) => entry.key.startsWith("ASHOTELARIA_"));
  const required = ["ASHOTELARIA_DATABASE_URL", "ASHOTELARIA_SESSION_SECRET", "ASHOTELARIA_ADMIN_PASSWORD"];
  const missing = required.filter((key) => !selected.some((entry) => entry.key === key && entry.value));
  if (missing.length) throw new Error(`Variaveis A.S obrigatorias ausentes: ${missing.join(", ")}`);
  const envVars = selected.filter((entry) => entry.key !== "ASHOTELARIA_ENABLED");
  envVars.push({ key: "ASHOTELARIA_ENABLED", value: "true" });
  envVars.push({ key: "NODE_ENV", value: "production" });
  envVars.push({ key: "TZ", value: "America/Rio_Branco" });
  const payload = {
    type: "web_service",
    name: "ashotelaria-saas",
    ownerId: sourceConfig.ownerId,
    repo: sourceConfig.repo,
    branch: sourceConfig.branch || "main",
    autoDeploy: "yes",
    envVars,
    serviceDetails: {
      env: "node",
      region: sourceConfig.serviceDetails?.region || "oregon",
      plan: "free",
      envSpecificDetails: {
        buildCommand: "npm install",
        startCommand: "npm run ashotelaria:migrate && npm run ashotelaria:start"
      },
      healthCheckPath: "/health",
      numInstances: 1
    }
  };
  const created = await request("/services", { method: "POST", body: JSON.stringify(payload) });
  const service = created.service || created;
  return { id: service.id, name: service.name, url: service.serviceDetails?.url, dashboardUrl: service.dashboardUrl };
}

async function isolateCatalogService(serviceId) {
  const current = await getEnvVars(serviceId);
  const removed = current.filter((entry) => entry.key.startsWith("ASHOTELARIA_")).map((entry) => entry.key);
  if (!removed.length) return { changed: false, removed: [] };
  const retained = current.filter((entry) => !entry.key.startsWith("ASHOTELARIA_"));
  if (!retained.some((entry) => entry.key === "OLLAMA_BASE_URL")) {
    throw new Error("Protecao acionada: OLLAMA_BASE_URL nao seria preservada.");
  }
  await request(`/services/${encodeURIComponent(serviceId)}/env-vars`, {
    method: "PUT",
    body: JSON.stringify(retained)
  });
  return { changed: true, removed, retainedCount: retained.length };
}

async function setCatalogCheffeTimeout(serviceId, timeoutMs = 75000) {
  const timeout = Math.max(1000, Math.min(90000, Number(timeoutMs) || 75000));
  const current = await getEnvVars(serviceId);
  const next = current.filter((entry) => entry.key !== "CZS_OLLAMA_TIMEOUT_MS");
  next.push({ key: "CZS_OLLAMA_TIMEOUT_MS", value: String(timeout) });
  await request(`/services/${encodeURIComponent(serviceId)}/env-vars`, {
    method: "PUT",
    body: JSON.stringify(next)
  });
  return { key: "CZS_OLLAMA_TIMEOUT_MS", value: String(timeout) };
}

async function fixCatalogRuntime(serviceId) {
  const updated = await request(`/services/${encodeURIComponent(serviceId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      serviceDetails: {
        envSpecificDetails: {
          buildCommand: "npm install",
          startCommand: "node render-start.js"
        },
        healthCheckPath: "/"
      }
    })
  });
  return {
    id: updated.id,
    startCommand: updated.serviceDetails?.envSpecificDetails?.startCommand,
    healthCheckPath: updated.serviceDetails?.healthCheckPath
  };
}

async function probeCatalogOllama(serviceId) {
  const env = Object.fromEntries((await getEnvVars(serviceId)).map((entry) => [entry.key, entry.value]));
  const baseUrl = String(env.OLLAMA_BASE_URL || "").replace(/\/+$/, "");
  if (!baseUrl) throw new Error("OLLAMA_BASE_URL ausente.");
  const headers = env.OLLAMA_AUTH_TOKEN ? { Authorization: `Bearer ${env.OLLAMA_AUTH_TOKEN}` } : {};
  const response = await fetch(`${baseUrl}/api/tags`, { headers, signal: AbortSignal.timeout(15000) });
  const body = await response.json().catch(() => ({}));
  let chat = null;
  if (response.ok) {
    const startedAt = Date.now();
    const chatResponse = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.CZS_OLLAMA_MODEL || env.LLM_MODEL || "llama3.2:3b",
        stream: false,
        think: false,
        messages: [{ role: "user", content: "Responda exatamente: OK-CHEFFE" }],
        options: { temperature: 0, num_ctx: 2048, num_predict: 24 }
      }),
      signal: AbortSignal.timeout(60000)
    });
    const chatBody = await chatResponse.json().catch(() => ({}));
    chat = {
      status: chatResponse.status,
      ok: chatResponse.ok,
      elapsedMs: Date.now() - startedAt,
      answer: String(chatBody?.message?.content || chatBody?.response || "").slice(0, 100),
      error: chatResponse.ok ? "" : String(chatBody.error || chatBody.message || "").slice(0, 180)
    };
  }
  return {
    host: new URL(baseUrl).host,
    status: response.status,
    ok: response.ok,
    models: Array.isArray(body.models) ? body.models.map((model) => model.name).slice(0, 20) : [],
    error: response.ok ? "" : String(body.error || body.message || "Resposta sem erro estruturado").slice(0, 180),
    chat
  };
}

async function createDeploy(serviceId, clearCache = false) {
  return request(`/services/${encodeURIComponent(serviceId)}/deploys`, {
    method: "POST",
    body: JSON.stringify({ clearCache: clearCache ? "clear" : "do_not_clear" })
  });
}

async function getDeploy(serviceId, deployId) {
  return request(`/services/${encodeURIComponent(serviceId)}/deploys/${encodeURIComponent(deployId)}`);
}

function printHelp() {
  process.stdout.write(`Render API Bridge

Comandos:
  services                         lista servicos
  status [--service nome-ou-id]    mostra servico e ultimo deploy
  deploys [--service nome-ou-id]   lista deploys
  deploy-info --id dep-id          mostra detalhes de um deploy
  inspect [--service nome-ou-id]   mostra configuracao sem segredos
  env-keys [--service nome-ou-id]  lista somente nomes das variaveis
  create-ashotelaria               cria servico A.S com segredos copiados
  isolate-catalog                  remove somente variaveis A.S do Catalogo
  set-cheffe-timeout [--ms 75000] ajusta o limite da Cheffe sem expor segredos
  fix-catalog-runtime              corrige comando do servico no painel Render
  probe-ollama                     testa a rota Ollama sem expor credenciais
  deploy --service nome-ou-id      dispara deploy manual

`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || "status";
  if (command === "help" || args.help) {
    printHelp();
    return;
  }

  if (command === "services") {
    process.stdout.write(`${JSON.stringify({ services: await listServices() }, null, 2)}\n`);
    return;
  }

  const service = await findService(args.service || args.s || "catalogo-cruzeiro-web");
  if (!service) throw new Error("Servico Render nao encontrado.");

  if (command === "deploys") {
    process.stdout.write(`${JSON.stringify({ service, deploys: await listDeploys(service.id) }, null, 2)}\n`);
    return;
  }


  if (command === "deploy-info") {
    if (!args.id) throw new Error("Use --id dep-id.");
    process.stdout.write(`${JSON.stringify({ service, deploy: await getDeploy(service.id, args.id) }, null, 2)}\n`);
    return;
  }

  if (command === "inspect") {
    process.stdout.write(`${JSON.stringify({ service: await getService(service.id) }, null, 2)}\n`);
    return;
  }

  if (command === "env-keys") {
    process.stdout.write(`${JSON.stringify({ service, envVars: await listEnvVars(service.id) }, null, 2)}\n`);
    return;
  }


  if (command === "create-ashotelaria") {
    process.stdout.write(`${JSON.stringify({ created: await createAshotelariaService(service) }, null, 2)}\n`);
    return;
  }

  if (command === "isolate-catalog") {
    process.stdout.write(`${JSON.stringify({ service, result: await isolateCatalogService(service.id) }, null, 2)}\n`);
    return;
  }

  if (command === "set-cheffe-timeout") {
    process.stdout.write(`${JSON.stringify({ service, result: await setCatalogCheffeTimeout(service.id, args.ms) }, null, 2)}\n`);
    return;
  }


  if (command === "fix-catalog-runtime") {
    process.stdout.write(`${JSON.stringify({ service, result: await fixCatalogRuntime(service.id) }, null, 2)}\n`);
    return;
  }


  if (command === "probe-ollama") {
    process.stdout.write(`${JSON.stringify({ service, result: await probeCatalogOllama(service.id) }, null, 2)}\n`);
    return;
  }

  if (command === "deploy") {
    const deploy = await createDeploy(service.id, Boolean(args.clearCache));
    process.stdout.write(`${JSON.stringify({ service, deploy }, null, 2)}\n`);
    return;
  }

  const deploys = await listDeploys(service.id);
  process.stdout.write(`${JSON.stringify({ service, latestDeploy: deploys[0] || null }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(
    `${JSON.stringify({ ok: false, error: error.message, status: error.status || null, body: error.body || null }, null, 2)}\n`
  );
  process.exitCode = 1;
});
