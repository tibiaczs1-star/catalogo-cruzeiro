const fs = require("fs");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");

const ROOT = path.resolve(__dirname, "..", "..");

test("portal opens the approved cinematic intro once per Rio Branco day", () => {
  const index = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const runtime = fs.readFileSync(path.join(ROOT, "assets", "v8-final", "v8-merge-ready.js"), "utf8");

  assert.match(index, /var requested=.*forceIntro.*intro/);
  assert.match(index, /var disabled=.*skipIntro/);
  assert.match(index, /var showIntro=!disabled&&\(requested\|\|!seenToday\)/);
  assert.match(index, /v8-merge-ready\.css\?v=20260726-intro-recovery-v2/);
  assert.match(index, /<body class="v8-merge-ready">/);
  assert.match(runtime, /const introRequested = .*forceIntro.*intro/);
  assert.match(runtime, /const skipIntro = params\.get\("skipIntro"\) === "1";/);
  assert.doesNotMatch(runtime, /skipIntro.*!introRequested/);
});
