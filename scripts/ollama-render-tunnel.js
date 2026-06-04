#!/usr/bin/env node
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const LOCAL_ENV_FILE = path.join(ROOT_DIR, ".env.local");
const HERMES_ENV_FILE = path.join(process.env.USERPROFILE || "C:\\Users\\junio", ".hermes", ".env");
const TOOLS_DIR = path.join(ROOT_DIR, ".codex-temp", "ollama-tunnel-tools");
const STATE_DIR = path.join(ROOT_DIR, ".codex-temp", "ollama-render-tunnel");
const CLOUDFLARED_EXE = path.join(TOOLS_DIR, "cloudflared.exe");
const CLOUDFLARED_URL = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe";
const RENDER_API_BASE = "https://api.render.com/v1";
const childProcesses = [];

function readText(file, fallback = "") {
  try {
    return fs.readFileSync(file, "utf-8");
  } catch {
    return fallback;
  }
}

function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, "utf-8");
}

function parseEnv(text) {
  const env = {};
  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const divider = trimmed.indexOf("=");
    if (divider < 1) return;
    let value = trimmed.slice(divider + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[trimmed.slice(0, divider).trim()] = value;
  });
  return env;
}

function serializeEnvValue(value) {
  const text = String(value || "");
  return /[\s#"'=]/.test(text) ? JSON.stringify(text) : text;
}

function ensureLocalEnvValue(key, value) {
  const source = readText(LOCAL_ENV_FILE, "");
  const lines = source ? source.split(/\r?\n/) : [];
  const nextLine = `${key}=${serializeEnvValue(value)}`;
  const index = lines.findIndex((line) => line.trim().startsWith(`${key}=`));
  if (index >= 0) lines[index] = nextLine;
  else {
    if (lines.length && lines[lines.length - 1].trim()) lines.push("");
    lines.push(nextLine);
  }
  writeText(LOCAL_ENV_FILE, lines.join("\n").replace(/\n{3,}/g, "\n\n"));
}

function getLocalEnv() {
  return {
    ...parseEnv(readText(path.join(ROOT_DIR, ".env"))),
    ...parseEnv(readText(LOCAL_ENV_FILE))
  };
}

function getRenderApiKey() {
  const env = { ...parseEnv(readText(HERMES_ENV_FILE)), ...process.env };
  const key = String(env.RENDER_API_KEY || "").trim();
  if (!key) throw new Error(`RENDER_API_KEY ausente em ${HERMES_ENV_FILE}`);
  return key;
}

async function renderRequest(pathname, options = {}) {
  const response = await fetch(`${RENDER_API_BASE}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getRenderApiKey()}`,
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
    const error = new Error(`Render API ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

async function findRenderService(query = "catalogo-cruzeiro-web") {
  const payload = await renderRequest("/services?limit=100");
  const services = Array.isArray(payload) ? payload.map((entry) => entry.service || entry) : [];
  const needle = String(query || "").trim().toLowerCase();
  return (
    services.find((service) => String(service.id || "").toLowerCase() === needle) ||
    services.find((service) => String(service.name || "").toLowerCase() === needle) ||
    services.find((service) => String(service.name || "").toLowerCase().includes(needle))
  );
}

async function upsertRenderEnvVars(serviceId, vars) {
  const results = [];
  for (const [key, value] of Object.entries(vars)) {
    results.push(await renderRequest(`/services/${encodeURIComponent(serviceId)}/env-vars/${encodeURIComponent(key)}`, {
      method: "PUT",
      body: JSON.stringify({ value: String(value) })
    }));
  }
  return results;
}

async function createDeploy(serviceId) {
  return renderRequest(`/services/${encodeURIComponent(serviceId)}/deploys`, {
    method: "POST",
    body: JSON.stringify({ clearCache: "do_not_clear", deployMode: "build_and_deploy" })
  });
}

async function ensureCloudflared() {
  if (fs.existsSync(CLOUDFLARED_EXE)) return CLOUDFLARED_EXE;
  fs.mkdirSync(TOOLS_DIR, { recursive: true });
  console.log(`Baixando cloudflared para ${CLOUDFLARED_EXE}`);
  const response = await fetch(CLOUDFLARED_URL);
  if (!response.ok) throw new Error(`Falha ao baixar cloudflared: HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(CLOUDFLARED_EXE, buffer);
  return CLOUDFLARED_EXE;
}

function spawnLogged(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: ROOT_DIR,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    env: { ...process.env, ...(options.env || {}) }
  });
  childProcesses.push(child);
  child.stdout.on("data", (data) => process.stdout.write(data));
  child.stderr.on("data", (data) => process.stderr.write(data));
  return child;
}

function cleanupChildren() {
  for (const child of childProcesses) {
    if (child && !child.killed && child.exitCode === null) {
      try {
        child.kill();
      } catch {
        // Best effort cleanup only.
      }
    }
  }
}

function waitForTunnelUrl(child, timeoutMs = 90000) {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const timer = setTimeout(() => reject(new Error("Timeout aguardando URL do cloudflared.")), timeoutMs);
    const onData = (data) => {
      buffer += data.toString("utf-8");
      const match = buffer.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
      if (match) {
        clearTimeout(timer);
        resolve(match[0]);
      }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`cloudflared encerrou antes da URL: exit=${code}`));
    });
  });
}

async function waitForHealth(url, token, timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${url}/health`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.ok) return true;
    } catch {
      // keep waiting
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const localEnv = getLocalEnv();
  const token = String(localEnv.CZS_LOCAL_AI_TUNNEL_TOKEN || crypto.randomBytes(32).toString("base64url"));
  ensureLocalEnvValue("CZS_LOCAL_AI_TUNNEL_TOKEN", token);
  ensureLocalEnvValue("OLLAMA_AUTH_TOKEN", token);
  ensureLocalEnvValue("CZS_AI_PRIMARY", "ollama");
  ensureLocalEnvValue("CZS_OPENAI_FALLBACK_ENABLED", "false");
  ensureLocalEnvValue("CZS_OLLAMA_MODEL", localEnv.CZS_OLLAMA_MODEL || "qwen2.5:3b");

  const proxyPort = Number(localEnv.CZS_LOCAL_AI_PROXY_PORT || 11435);
  const proxy = spawnLogged(process.execPath, ["scripts/ollama-secure-proxy.js"], {
    env: {
      CZS_LOCAL_AI_TUNNEL_TOKEN: token,
      OLLAMA_AUTH_TOKEN: token,
      CZS_LOCAL_AI_PROXY_PORT: String(proxyPort),
      OLLAMA_BASE_URL: localEnv.OLLAMA_BASE_URL || "http://127.0.0.1:11434"
    }
  });

  const proxyReady = await waitForHealth(`http://127.0.0.1:${proxyPort}`, token);
  if (!proxyReady) throw new Error("Proxy local não respondeu em /health.");

  const cloudflared = await ensureCloudflared();
  const tunnel = spawnLogged(cloudflared, ["tunnel", "--url", `http://127.0.0.1:${proxyPort}`, "--no-autoupdate"]);
  const tunnelUrl = await waitForTunnelUrl(tunnel);
  console.log(`\nTunnel URL: ${tunnelUrl}\n`);

  fs.mkdirSync(STATE_DIR, { recursive: true });
  writeText(path.join(STATE_DIR, "latest.json"), JSON.stringify({
    updatedAt: new Date().toISOString(),
    tunnelUrl,
    proxyPort,
    model: localEnv.CZS_OLLAMA_MODEL || "qwen2.5:3b",
    renderEnv: {
      OLLAMA_BASE_URL: tunnelUrl,
      OLLAMA_AUTH_TOKEN: "[secret]",
      CZS_AI_PRIMARY: "ollama",
      CZS_OPENAI_FALLBACK_ENABLED: "false"
    }
  }, null, 2));

  if (!args.has("--no-render")) {
    const service = await findRenderService(process.env.RENDER_SERVICE || "catalogo-cruzeiro-web");
    if (!service?.id) throw new Error("Serviço Render não encontrado.");
    await upsertRenderEnvVars(service.id, {
      OLLAMA_BASE_URL: tunnelUrl,
      OLLAMA_AUTH_TOKEN: token,
      CZS_AI_PRIMARY: "ollama",
      CZS_OPENAI_FALLBACK_ENABLED: "false",
      CZS_OLLAMA_MODEL: localEnv.CZS_OLLAMA_MODEL || "qwen2.5:3b",
      CZS_OLLAMA_TIMEOUT_MS: localEnv.CZS_OLLAMA_TIMEOUT_MS || "30000"
    });
    console.log(`Render env vars atualizadas para ${service.name || service.id}.`);
    if (args.has("--deploy")) {
      const deploy = await createDeploy(service.id);
      console.log(`Deploy disparado: ${deploy?.deploy?.id || deploy?.id || "ok"}`);
    }
  }

  console.log("Mantenha esta janela/processo aberto enquanto o Render precisar usar a IA local.");
  const shutdown = () => {
    cleanupChildren();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  cleanupChildren();
  console.error(JSON.stringify({ ok: false, error: error.message, status: error.status || null, body: error.body || null }, null, 2));
  process.exitCode = 1;
});
