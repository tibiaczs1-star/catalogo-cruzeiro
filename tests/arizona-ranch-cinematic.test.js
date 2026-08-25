"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..");
const read = (...segments) => fs.readFileSync(path.join(projectRoot, ...segments), "utf8");

test("o manifesto não reutiliza arquivo entre cenas", () => {
  const manifest = JSON.parse(read("pagamentos", "reservaranch", "assets", "cinematic", "manifest.json"));
  const files = manifest.scenes.flatMap((scene) => scene.frames);
  assert.equal(new Set(files).size, files.length);
  assert.ok(manifest.scenes.filter((scene) => scene.frames.length >= 3).length >= 4);
});

test("o motor limita o frame ao intervalo da sequência", () => {
  const { frameIndex } = require("../pagamentos/reservaranch/cinematic.js");
  assert.equal(frameIndex(-1, 4), 0);
  assert.equal(frameIndex(0.5, 4), 2);
  assert.equal(frameIndex(2, 4), 3);
});

test("a paisagem sonora evita repetição imediata e mantém a voz só na abertura", () => {
  const source = read("pagamentos", "reservaranch", "soundscape.js");
  const { pickNonRepeating, createSoundscape } = require("../pagamentos/reservaranch/soundscape.js");
  ["wind", "horse", "wood"].forEach(() => {
    assert.notEqual(pickNonRepeating(["wind", "horse", "wood"], "wind", () => 0), "wind");
  });
  assert.equal(typeof createSoundscape, "function");
  assert.match(source, /wind|vento/);
  assert.match(source, /cattle|gado|mugido/);
  assert.match(source, /horse|cavalo|galope/);
  const startBody = source.match(/async start\(\)\s*\{([\s\S]*?)\n\s*\}/)?.[1] || "";
  assert.doesNotMatch(startBody, /setInterval[^]*voice|schedule[^]*voice/i);
});
