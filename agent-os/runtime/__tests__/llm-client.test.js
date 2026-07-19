"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { LlmClient } = require("../llm-client");

test("health and chat use correct routes with bearer authentication", async (t) => {
  const requests = [];
  const server = http.createServer((req, res) => {
    requests.push({ method: req.method, url: req.url, auth: req.headers.authorization });
    if (req.headers.authorization !== "Bearer test-token") {
      res.writeHead(401).end("unauthorized");
      return;
    }
    res.setHeader("Content-Type", "application/json");
    if (req.method === "GET" && req.url === "/api/tags") {
      res.end(JSON.stringify({ models: [{ name: "llama3.2:3b" }] }));
      return;
    }
    if (req.method === "POST" && req.url === "/v1/chat/completions") {
      res.end(JSON.stringify({ choices: [{ message: { content: "OK" } }] }));
      return;
    }
    res.writeHead(404).end("not found");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());

  const previous = { ...process.env };
  t.after(() => { process.env = previous; });
  process.env.AGENT_OS_LLM_URL = `http://127.0.0.1:${server.address().port}/v1/chat/completions`;
  process.env.AGENT_OS_LLM_MODEL = "llama3.2:3b";
  process.env.OLLAMA_AUTH_TOKEN = "test-token";

  const client = new LlmClient();
  assert.equal(await client.healthCheck(), true);
  assert.equal((await client.chat([{ role: "user", content: "oi" }])).content, "OK");
  assert.deepEqual(requests, [
    { method: "GET", url: "/api/tags", auth: "Bearer test-token" },
    { method: "POST", url: "/v1/chat/completions", auth: "Bearer test-token" }
  ]);
});
