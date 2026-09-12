const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const test = require("node:test");
const { createHash } = require("node:crypto");

const ROOT = path.resolve(__dirname, "..", "..");

test("editorial assets use content fingerprints to invalidate immutable caches", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  for (const extension of ["css", "js"]) {
    const asset = `assets/v8-final/v8-merge-ready.${extension}`;
    const content = fs.readFileSync(path.join(ROOT, asset), "utf8").replace(/\r\n/g, "\n");
    const fingerprint = createHash("sha256").update(content).digest("hex").slice(0, 12);
    assert.ok(html.includes(`${asset}?v=${fingerprint}\"`), `${asset} needs its current content fingerprint`);
  }
});

test("every local homepage stylesheet exists and is tracked for deployment", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const hrefs = [...html.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
    .filter((href) => !/^(?:https?:)?\/\//i.test(href));

  assert.ok(hrefs.length > 0, "index.html must reference at least one local stylesheet");

  for (const href of hrefs) {
    const relativePath = href.split(/[?#]/, 1)[0].replace(/^\/+/, "");
    assert.ok(fs.existsSync(path.join(ROOT, relativePath)), `${href} is missing locally`);
    assert.doesNotThrow(
      () => execFileSync("git", ["ls-files", "--error-unmatch", relativePath], { cwd: ROOT, stdio: "pipe" }),
      `${href} exists locally but is not tracked by Git, so Render will return 404`,
    );
  }
});
