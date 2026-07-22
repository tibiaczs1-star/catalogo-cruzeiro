"use strict";

const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const ROOT = path.resolve(__dirname, "../..");

test("publishes three exclusive Raiane story frames as public assets", () => {
  for (const frame of ["story-01.png", "story-02.png", "story-03.png"]) {
    const file = path.join(ROOT, "assets", "stories", "raiane-bookray", frame);
    assert.ok(fs.existsSync(file), `${frame} must exist`);
    assert.ok(fs.statSync(file).size > 100_000, `${frame} must be a production image`);
  }
});
