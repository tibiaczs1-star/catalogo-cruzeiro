const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const ROOT = path.resolve(__dirname, "..", "..");
const CSS = fs.readFileSync(path.join(ROOT, "assets", "v8-final", "v8-merge-ready.css"), "utf8");

test("fallback empilhado nao sobrescreve a hero editorial ao vivo", () => {
  assert.match(
    CSS,
    /#leadStory\.lead-card:not\(\.v8-live-hero\)\s*\{\s*display:\s*flex\s*!important;/,
  );
  assert.doesNotMatch(
    CSS,
    /#leadStory\.lead-card\s*\{\s*display:\s*flex\s*!important;/,
  );
});
