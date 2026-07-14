"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawn } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..", "..");

async function waitForServer(url, child) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`servidor encerrou com codigo ${child.exitCode}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (_error) {
      // servidor ainda iniciando
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("servidor nao iniciou a tempo");
}

test("API lite preserva videos reais e sort latest entrega ordem cronologica", { timeout: 20000 }, async (t) => {
  const port = 34000 + (process.pid % 1000);
  const child = spawn(process.execPath, ["server.js"], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port), ARTICLE_INTEGRITY_INTERVAL_MS: "0" },
    stdio: "ignore"
  });
  t.after(() => child.kill());

  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForServer(`${baseUrl}/api/health`, child);

  const latestResponse = await fetch(`${baseUrl}/api/news?limit=40&lite=1&sort=latest`);
  assert.equal(latestResponse.status, 200);
  const latest = await latestResponse.json();
  assert.equal(latest.sort, "latest");
  assert.equal(latest.items.length, 40);
  const timestamps = latest.items.map((item) => Date.parse(item.publishedAt || item.date || "") || 0);
  assert.deepEqual(timestamps, [...timestamps].sort((left, right) => right - left));

  const allResponse = await fetch(`${baseUrl}/api/news?limit=1000&lite=1&sort=latest`);
  const all = await allResponse.json();
  const video = all.items.find((item) => typeof item.videoUrl === "string" && item.videoUrl.length > 0);
  assert.ok(video, "ao menos um video real de news-data deve chegar na API lite");
  assert.match(video.videoUrl, /^https?:\/\//);

  const videosResponse = await fetch(`${baseUrl}/api/news?limit=40&lite=1&sort=latest&video=1`);
  const videos = await videosResponse.json();
  assert.equal(videos.video, true);
  assert.ok(videos.items.length > 0);
  assert.ok(videos.items.length <= 40);
  assert.ok(videos.items.every((item) => item.videoUrl || item.media?.type === "video"));
  const videoTimestamps = videos.items.map((item) => Date.parse(item.publishedAt || item.date || "") || 0);
  assert.deepEqual(videoTimestamps, [...videoTimestamps].sort((left, right) => right - left));

  const readerResponse = await fetch(`${baseUrl}/api/news/${encodeURIComponent(video.slug)}`);
  assert.equal(readerResponse.status, 200);
  const reader = await readerResponse.json();
  assert.equal(reader.item.slug, video.slug);
  assert.equal(reader.item.videoUrl, video.videoUrl);
});
