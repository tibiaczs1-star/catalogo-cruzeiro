const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");

test("callLLM envia o token Bearer configurado", async () => {
  let authorization = null;
  const server = http.createServer((req, res) => {
    authorization = req.headers.authorization || null;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ choices: [{ message: { content: "OK" } }] }));
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  process.env.AGENT_OS_LLM_URL = `http://127.0.0.1:${port}/v1/chat/completions`;
  process.env.OLLAMA_AUTH_TOKEN = "integration-secret";

  const integrationPath = require.resolve("../../agent-os-integration");
  delete require.cache[integrationPath];
  const integration = require(integrationPath);

  try {
    assert.equal(await integration.callLLM("system", "user"), "OK");
    assert.equal(authorization, "Bearer integration-secret");
  } finally {
    server.close();
    delete process.env.AGENT_OS_LLM_URL;
    delete process.env.OLLAMA_AUTH_TOKEN;
    delete require.cache[integrationPath];
  }
});
