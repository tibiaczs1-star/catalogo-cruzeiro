const fs = require("fs");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");

const ROOT = path.resolve(__dirname, "..", "..");

test("portal opens directly unless the cinematic intro is explicitly requested", () => {
  const index = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const runtime = fs.readFileSync(path.join(ROOT, "assets", "v8-final", "v8-merge-ready.js"), "utf8");

  assert.match(index, /var requested=.*forceIntro.*intro/);
  assert.match(index, /var skip=.*skipIntro.*!requested/);
  assert.match(runtime, /const introRequested = .*forceIntro.*intro/);
  assert.match(runtime, /const skipIntro = .*skipIntro.*!introRequested/);
});
