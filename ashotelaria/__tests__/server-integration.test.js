"use strict";

const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const { createASHotelariaServerIntegration } = require("../server-integration");

const ROOT = path.resolve(__dirname, "..", "..");

test("server integration delegates the hotel API before returning to the portal", async () => {
  const calls = [];
  const integration = createASHotelariaServerIntegration({
    rootDir: ROOT,
    apiHandler: async (req, res) => {
      calls.push({ req, res });
      return true;
    },
    sendFile() { throw new Error("static fallback must not run"); },
  });
  const req = { method: "GET", url: "/api/ashotelaria/v1/health" };
  const res = {};

  assert.equal(await integration.handle(req, res, "/api/ashotelaria/v1/health"), true);
  assert.deepEqual(calls, [{ req, res }]);
  assert.equal(await integration.handle(req, res, "/api/news"), false);
});

test("friendly hotel aliases serve the correct existing HTML without redirecting", async () => {
  const files = [];
  const integration = createASHotelariaServerIntegration({
    rootDir: ROOT,
    apiHandler: async () => false,
    sendFile(_req, _res, filePath, options) { files.push({ filePath, options }); },
  });
  const req = { method: "GET", url: "/" };
  const res = {};
  const cases = [
    ["/ashotelaria/app", "index.html"],
    ["/czs-labs/ashotelaria", "index.html"],
    ["/hoteis", "booking.html"],
    ["/reservar/hotel-jurua-palace", "booking.html"],
  ];

  for (const [pathname, filename] of cases) {
    assert.equal(await integration.handle(req, res, pathname), true, pathname);
    assert.equal(path.basename(files.at(-1).filePath), filename, pathname);
    assert.equal(files.at(-1).options.cacheControl, "no-store");
  }
  assert.equal(await integration.handle(req, res, "/noticia.html"), false);
});

test("server.js invokes AShotelaria before the generic API fallback", () => {
  const source = fs.readFileSync(path.join(ROOT, "server.js"), "utf8");
  const hotelIndex = source.indexOf("ashotelariaIntegration.handle");
  const fallbackIndex = source.indexOf('pathname.startsWith("/api/")', hotelIndex);
  assert.ok(hotelIndex > 0, "AShotelaria integration must be wired");
  assert.ok(fallbackIndex > hotelIndex, "AShotelaria must run before generic API routing");
  assert.match(source, /ASHOTELARIA_ENABLED\s*&&\s*await ashotelariaIntegration\.handle/,
    "catalog must not expose hotel routes when the product is disabled");
});
