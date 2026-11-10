"use strict";

// Contrato de qualidade do corpo da materia: nenhum texto de formula pode
// voltar para a API. O leitor chamou de "IA slop" e o filtro precisa cobrir
// tanto o formato antigo ("registrou em ... leitura do CZS parte...") quanto
// os paragrafos por categoria ("Impacto pratico:", "O que seguir:").

const test = require("node:test");
const assert = require("node:assert/strict");
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

function fold(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

const SLOP = [
  (k) => k.includes("a leitura do czs parte desse fato confirmado"),
  (k) => k.startsWith("impacto pratico"),
  (k) => k.startsWith("o que seguir"),
  (k) => k.includes("publicou em") && k.includes("a base desta noticia"),
  (k) => k.includes("redacao automatica acompanha") && k.includes("novas atualizacoes"),
  (k) => k.includes("o eixo mais concreto da publicacao consultada"),
  (k) => k.includes("material original ainda nao trouxe desenvolvimento suficiente")
];

test("API nao devolve texto de formula no corpo", { timeout: 30000 }, async (t) => {
  const port = 36000 + (process.pid % 1000);
  const child = spawn(process.execPath, ["server.js"], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port), ARTICLE_INTEGRITY_INTERVAL_MS: "0", NEWS_REFRESH_AUTO: "0" },
    stdio: "ignore"
  });
  t.after(() => child.kill());
  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForServer(`${baseUrl}/api/health`, child);

  const response = await fetch(`${baseUrl}/api/news?limit=200`);
  assert.equal(response.status, 200);
  const payload = await response.json();
  const items = payload.items || [];
  assert.ok(items.length > 0, "API sem itens");

  const offenders = [];
  for (const item of items) {
    const body = Array.isArray(item.body) ? item.body : [];
    for (const paragraph of body) {
      const key = fold(paragraph);
      if (SLOP.some((matches) => matches(key))) {
        offenders.push(`${item.slug || item.title}: ${String(paragraph).slice(0, 90)}`);
        break;
      }
    }
    if (/^impacto pratico/i.test(String(item.lede || ""))) {
      offenders.push(`${item.slug}: lede com formula`);
    }
  }

  assert.deepEqual(offenders, [], `texto de formula encontrado:\n${offenders.join("\n")}`);
});
