"use strict";

// Contrato das superficies de SEO e descoberta por IA: llms.txt responde,
// link limpo /noticia/<slug> redireciona 301 para o endereco canonico,
// slug inexistente devolve 404 e o sitemap nao repete o mesmo loc.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..", "..");

async function waitForServer(url, child) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`servidor encerrou com codigo ${child.exitCode}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (_error) {
      // ainda subindo
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("servidor nao iniciou a tempo");
}

test("superficies de descoberta respondem", { timeout: 30000 }, async (t) => {
  const port = 35000 + (process.pid % 1000);
  const child = spawn(process.execPath, ["server.js"], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port), ARTICLE_INTEGRITY_INTERVAL_MS: "0", NEWS_REFRESH_AUTO: "0" },
    stdio: "ignore"
  });
  t.after(() => child.kill());
  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForServer(`${baseUrl}/api/health`, child);

  const llms = await fetch(`${baseUrl}/llms.txt`);
  assert.equal(llms.status, 200);
  assert.match(llms.headers.get("content-type") || "", /text\/plain/);
  const llmsBody = await llms.text();
  assert.match(llmsBody, /^# Catalogo Cruzeiro do Sul/);
  assert.match(llmsBody, /api\/news/);
  assert.match(llmsBody, /noticia\.html\?slug=/);

  const robots = await (await fetch(`${baseUrl}/robots.txt`)).text();
  assert.match(robots, /llms\.txt/i);

  const runtime = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "runtime-news.json"), "utf8"));
  const sample = (runtime.items || []).find((item) => item && item.slug);
  assert.ok(sample, "runtime sem slug para testar o link limpo");

  const clean = await fetch(`${baseUrl}/noticia/${encodeURIComponent(sample.slug)}`, { redirect: "manual" });
  assert.equal(clean.status, 301);
  const location = clean.headers.get("location") || "";
  assert.match(location, /^\/noticia\.html\?slug=/);
  assert.ok(location.includes(encodeURIComponent(sample.slug)));

  const missing = await fetch(`${baseUrl}/noticia/slug-que-nao-existe-czs`);
  assert.equal(missing.status, 404);

  const sitemap = await (await fetch(`${baseUrl}/sitemap.xml`)).text();
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length > 10, "sitemap pequeno demais");
  assert.equal(new Set(locs).size, locs.length, "sitemap com loc repetido");
});
