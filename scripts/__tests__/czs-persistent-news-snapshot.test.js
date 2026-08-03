"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_DATA_DIR = path.join(ROOT, "data");

async function waitForServer(url, child) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`servidor encerrou com codigo ${child.exitCode}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (_error) {
      // Servidor ainda iniciando.
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("servidor nao iniciou a tempo");
}

test("snapshot editorial mais novo substitui somente as noticias persistentes antigas", { timeout: 20000 }, async (t) => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "czs-news-snapshot-"));
  const port = 35000 + (process.pid % 1000);
  const staleRuntime = { items: [{ slug: "nacional-antiga", title: "Pauta antiga", publishedAt: "2026-07-27T12:00:00.000Z" }] };
  const staleArchive = { items: [{ slug: "nacional-antiga", title: "Pauta antiga", publishedAt: "2026-07-27T12:00:00.000Z" }] };

  fs.writeFileSync(path.join(dataDir, "runtime-news.json"), JSON.stringify(staleRuntime));
  fs.writeFileSync(path.join(dataDir, "news-archive.json"), JSON.stringify(staleArchive));
  fs.writeFileSync(path.join(dataDir, "latest-news-capture-report.json"), JSON.stringify({
    finishedAt: "2026-07-27T12:00:00.000Z",
    archiveItems: 1
  }));
  fs.writeFileSync(path.join(dataDir, "comments.json"), JSON.stringify([{ id: "preservar" }]));

  const child = spawn(process.execPath, ["server.js"], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(port),
      DATA_DIR: dataDir,
      ARTICLE_INTEGRITY_INTERVAL_MS: "0",
      NEWS_REFRESH_AUTO_DISABLED: "true"
    },
    stdio: "ignore"
  });

  t.after(() => child.kill());
  t.after(() => fs.rmSync(dataDir, { recursive: true, force: true }));

  await waitForServer(`http://127.0.0.1:${port}/api/health`, child);

  for (const fileName of ["runtime-news.json", "news-archive.json", "latest-news-capture-report.json"]) {
    const actual = JSON.parse(fs.readFileSync(path.join(dataDir, fileName), "utf-8"));
    const expected = JSON.parse(fs.readFileSync(path.join(DEFAULT_DATA_DIR, fileName), "utf-8"));
    assert.deepEqual(actual, expected, `${fileName} deve usar o lote editorial versionado`);
  }

  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dataDir, "comments.json"), "utf-8")), [{ id: "preservar" }]);
});
