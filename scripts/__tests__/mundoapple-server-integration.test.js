const test = require("node:test");
const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");

const { createMundoAppleServerIntegration } = require("../../mundoapple/server-integration");

test("Mundo Apple integration owns only its public and administrative route tree", async () => {
  const sent = [];
  const integration = createMundoAppleServerIntegration({
    rootDir: path.resolve(__dirname, "../.."),
    dataDir: path.join(os.tmpdir(), "mundoapple-integration-test"),
    environment: {},
    sendFile(_req, _res, filePath, options) {
      sent.push({ filePath, options });
    },
  });

  assert.equal(await integration.handleStatic({}, {}, "/"), false);
  assert.equal(await integration.handleStatic({}, {}, "/mundoapple/"), true);
  assert.match(sent.at(-1).filePath, /mundoapple[\\/]public[\\/]index\.html$/);
  assert.equal(await integration.handleStatic({}, {}, "/mundoapple/admin/"), true);
  assert.match(sent.at(-1).filePath, /mundoapple[\\/]public[\\/]admin[\\/]index\.html$/);
  assert.equal(await integration.handleStatic({}, {}, "/mundoapple/../server.js"), false);
});

test("extensionless Mundo Apple routes redirect to their canonical slash URLs", async () => {
  const redirects = [];
  const integration = createMundoAppleServerIntegration({
    rootDir: path.resolve(__dirname, "../.."),
    dataDir: path.join(os.tmpdir(), "mundoapple-integration-test"),
    environment: {},
    sendFile() {},
  });
  const response = {
    writeHead(status, headers) {
      redirects.push({ status, headers });
    },
    end() {},
  };

  assert.equal(await integration.handleStatic({}, response, "/mundoapple"), true);
  assert.deepEqual(redirects.at(-1), {
    status: 308,
    headers: { Location: "/mundoapple/", "Cache-Control": "no-store" },
  });
  assert.equal(await integration.handleStatic({}, response, "/mundoapple/admin"), true);
  assert.equal(redirects.at(-1).headers.Location, "/mundoapple/admin/");
});

test("administrative assets are always revalidated to avoid stale financial values", async () => {
  const sent = [];
  const integration = createMundoAppleServerIntegration({
    rootDir: path.resolve(__dirname, "../.."),
    dataDir: path.join(os.tmpdir(), "mundoapple-integration-test"),
    environment: {},
    sendFile(_req, _res, filePath, options) {
      sent.push({ filePath, options });
    },
  });

  assert.equal(await integration.handleStatic({}, {}, "/mundoapple/admin/admin.js"), true);
  assert.equal(sent.at(-1).options.cacheControl, "no-cache");
  assert.equal(await integration.handleStatic({}, {}, "/mundoapple/admin/admin.css"), true);
  assert.equal(sent.at(-1).options.cacheControl, "no-cache");
});
