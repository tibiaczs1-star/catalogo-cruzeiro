#!/usr/bin/env node
"use strict";

const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");

function readEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const source = fs.readFileSync(filePath, "utf-8");
  source.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const divider = trimmed.indexOf("=");
    if (divider < 1) return;
    const key = trimmed.slice(0, divider).trim();
    let value = trimmed.slice(divider + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  });
  return env;
}

function loadLocalEnv() {
  const env = {
    ...readEnvFile(path.join(ROOT_DIR, ".env")),
    ...readEnvFile(path.join(ROOT_DIR, ".env.local"))
  };
  Object.entries(env).forEach(([key, value]) => {
    if (!Object.prototype.hasOwnProperty.call(process.env, key)) process.env[key] = value;
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (!left.length || left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

async function readBody(req, limitBytes = 160000) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > limitBytes) throw new Error("payload_too_large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

function createProxyServer(options = {}) {
  const token = String(options.token || "").trim();
  const ollamaBaseUrl = String(options.ollamaBaseUrl || "http://127.0.0.1:11434").replace(/\/+$/, "");
  if (token.length < 24) throw new Error("token_too_short");
  return http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      return sendJson(res, 200, { ok: true, service: "czs-ollama-secure-proxy" });
    }

    const allowed = (req.method === "GET" && req.url === "/api/tags") ||
      (req.method === "POST" && req.url === "/v1/chat/completions");
    if (!allowed) {
      return sendJson(res, 404, { ok: false, error: "not_found" });
    }

    const auth = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
    if (!safeEqual(auth, token)) {
      return sendJson(res, 401, { ok: false, error: "unauthorized" });
    }

    const rawBody = req.method === "POST" ? await readBody(req) : null;
    const response = await fetch(`${ollamaBaseUrl}${req.url}`, {
      method: req.method,
      headers: req.method === "POST" ? { "Content-Type": "application/json" } : {},
      ...(rawBody !== null ? { body: rawBody } : {})
    });
    const text = await response.text();
    res.writeHead(response.status, {
      "Content-Type": response.headers.get("content-type") || "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });
    res.end(text);
  } catch (error) {
    const status = error?.message === "payload_too_large" ? 413 : 500;
    sendJson(res, status, { ok: false, error: error?.message || "proxy_error" });
  }
  });
}

if (require.main === module) {
  loadLocalEnv();
  const host = String(process.env.CZS_LOCAL_AI_PROXY_HOST || "127.0.0.1").trim();
  const port = Number(process.env.CZS_LOCAL_AI_PROXY_PORT || 11435);
  const token = String(process.env.CZS_LOCAL_AI_TUNNEL_TOKEN || process.env.OLLAMA_AUTH_TOKEN || "").trim();
  const ollamaBaseUrl = String(process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").trim();
  try {
    createProxyServer({ token, ollamaBaseUrl }).listen(port, host, () => {
      console.log(`CZS Ollama secure proxy: http://${host}:${port} -> ${ollamaBaseUrl}`);
    });
  } catch {
    console.error("CZS_LOCAL_AI_TUNNEL_TOKEN ausente ou curto demais. Gere um token antes de expor o proxy.");
    process.exit(1);
  }
}

module.exports = { createProxyServer };
