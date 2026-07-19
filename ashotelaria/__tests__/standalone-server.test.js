"use strict";

const http = require("node:http");
const test = require("node:test");
const assert = require("node:assert/strict");

const { createStandaloneRequestHandler } = require("../standalone-server");

async function request(server, pathname) {
  const address = server.address();
  return new Promise((resolve, reject) => {
    http.get({ host: "127.0.0.1", port: address.port, path: pathname }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve({
        status: response.statusCode,
        type: response.headers["content-type"],
        body: Buffer.concat(chunks).toString("utf8"),
      }));
    }).on("error", reject);
  });
}

test("standalone A.S serves only hotel UI, assets, health and hotel API", async (t) => {
  const handler = createStandaloneRequestHandler({
    apiHandler: async (_req, res) => {
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: true, product: "ashotelaria" }));
      return true;
    },
  });
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const home = await request(server, "/");
  assert.equal(home.status, 200);
  assert.match(home.type, /text\/html/);
  assert.match(home.body, /AShotelaria/i);

  const asset = await request(server, "/ashotelaria-app/styles.css");
  assert.equal(asset.status, 200);
  assert.match(asset.type, /text\/css/);

  const health = await request(server, "/health");
  assert.equal(health.status, 200);
  assert.deepEqual(JSON.parse(health.body), { ok: true, product: "ashotelaria", mode: "standalone" });

  const api = await request(server, "/api/ashotelaria/v1/health");
  assert.equal(api.status, 200);
  assert.equal(JSON.parse(api.body).product, "ashotelaria");

  for (const forbidden of ["/api/cheffe-call/ai", "/cheffe-call.html", "/api/agents/status", "/noticia.html"]) {
    const response = await request(server, forbidden);
    assert.equal(response.status, 404, forbidden);
  }
});
