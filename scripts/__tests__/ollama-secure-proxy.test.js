"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { createProxyServer } = require("../ollama-secure-proxy");

test("proxy protects and forwards only required Ollama routes", async (t) => {
  const upstream = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (req.url === "/api/tags") return res.end(JSON.stringify({ models: [{ name: "llama3.2:3b" }] }));
    if (req.url === "/v1/chat/completions") return res.end(JSON.stringify({ choices: [{ message: { content: "OK" } }] }));
    if (req.url === "/api/chat") return res.end(JSON.stringify({ message: { content: "OK-CHEFFE" } }));
    res.writeHead(404).end("{}");
  });
  await new Promise((resolve) => upstream.listen(0, "127.0.0.1", resolve));
  t.after(() => upstream.close());

  const proxy = createProxyServer({ token: "x".repeat(32), ollamaBaseUrl: `http://127.0.0.1:${upstream.address().port}` });
  await new Promise((resolve) => proxy.listen(0, "127.0.0.1", resolve));
  t.after(() => proxy.close());
  const base = `http://127.0.0.1:${proxy.address().port}`;

  assert.equal((await fetch(`${base}/api/tags`)).status, 401);
  const headers = { Authorization: `Bearer ${"x".repeat(32)}` };
  assert.equal((await fetch(`${base}/api/tags`, { headers })).status, 200);
  const chat = await fetch(`${base}/v1/chat/completions`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: "{}" });
  assert.equal(chat.status, 200);
  assert.equal((await chat.json()).choices[0].message.content, "OK");
  const cheffeChat = await fetch(`${base}/api/chat`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: "{}" });
  assert.equal(cheffeChat.status, 200);
  assert.equal((await cheffeChat.json()).message.content, "OK-CHEFFE");
  assert.equal((await fetch(`${base}/api/generate`, { method: "POST", headers })).status, 404);
});
