#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.CZS_P0_TEST_PORT || 3197);
const BASE = `http://127.0.0.1:${PORT}`;
const BROKEN_RENDER_SLUG = 'rio-jurua-esta-proximo-de-sair-da-cota-de-transbordamento-em-cruzeiro-do-sul';

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

async function waitForServer(proc, timeoutMs = 25000) {
  const started = Date.now();
  let lastError = '';
  while (Date.now() - started < timeoutMs) {
    if (proc.exitCode !== null) {
      throw new Error(`server exited early with code ${proc.exitCode}: ${lastError}`);
    }
    try {
      const response = await fetch(`${BASE}/api/news?limit=1&lite=1`);
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  throw new Error(`server did not become ready: ${lastError}`);
}

async function fetchJson(pathname) {
  const response = await fetch(`${BASE}${pathname}`);
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (_error) {
    json = null;
  }
  return { status: response.status, ok: response.ok, json, text };
}

async function runHttpChecks() {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: 'test',
      REAL_AGENTS_AUTO_RUN_DISABLED: 'true',
      NEWS_REFRESH_AUTO_DISABLED: 'true',
      ARTICLE_INTEGRITY_AUTO_RUN_DISABLED: 'true',
      TOPIC_FEED_AUTO_REFRESH_DISABLED: 'true'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });

  try {
    await waitForServer(child);

    const health = await fetchJson('/api/health');
    assert.equal(health.status, 200, `/api/health deve responder 200; recebeu ${health.status} ${health.text.slice(0, 160)}`);
    assert.equal(health.json?.ok, true, '/api/health deve retornar ok=true');
    assert.ok(health.json?.service, '/api/health deve identificar o servico');

    const brokenSlug = await fetchJson(`/api/news/${BROKEN_RENDER_SLUG}`);
    assert.equal(
      brokenSlug.status,
      200,
      `/api/news/${BROKEN_RENDER_SLUG} deve ter fallback 200; recebeu ${brokenSlug.status} ${brokenSlug.text.slice(0, 180)}`
    );
    assert.equal(brokenSlug.json?.ok, true, 'fallback de slug antigo deve retornar ok=true');
    assert.ok(brokenSlug.json?.item?.title, 'fallback de slug antigo deve retornar materia com titulo');

    const latest = await fetchJson('/api/news?limit=12&lite=1');
    const items = latest.json?.items || [];
    assert.ok(items.length > 0, '/api/news?limit=12&lite=1 deve retornar itens');
    for (const item of items.slice(0, 8)) {
      assert.ok(item.slug, `item sem slug: ${item.title || item.id || 'sem titulo'}`);
      const detail = await fetchJson(`/api/news/${encodeURIComponent(item.slug)}`);
      assert.equal(detail.status, 200, `slug publicado deve abrir detalhe 200: ${item.slug}`);
      assert.equal(detail.json?.ok, true, `slug publicado deve retornar ok=true: ${item.slug}`);
    }
  } finally {
    child.kill('SIGTERM');
    setTimeout(() => child.kill('SIGKILL'), 1200).unref?.();
    if (process.env.CZS_P0_VERBOSE) process.stderr.write(output);
  }
}

function runStaticChecks() {
  const server = read('server.js');
  const serviceJs = read('catalogo-servicos.js');
  const homeJs = read('script.js');
  const serviceCss = read('catalogo-servicos.css');

  assert.ok(server.includes('pathname === "/api/health"'), 'server.js deve ter rota /api/health no servidor principal do Render');

  const serviceInitBody = serviceJs.match(/function init\(\) \{[\s\S]*?\n  \}/)?.[0] || '';
  assert.ok(
    /setupActivationPopup\(\);/.test(serviceInitBody),
    'catalogo-servicos.js deve abrir o popup automatico do sistema na tela de servicos'
  );
  assert.ok(
    /data-svc-activation-popup/.test(serviceJs),
    'popup do catalogo deve manter o modal original com data-svc-activation-popup'
  );

  assert.ok(
    /^scheduleHomeActivationPopup\(\);$/m.test(homeJs),
    'home deve agendar o popup central original PubPaid/enquete automaticamente'
  );
  assert.ok(
    /data-home-activation-popup/.test(homeJs),
    'popup PubPaid/enquete da home deve manter o modal original do sistema'
  );

  assert.ok(
    !/const staticThumbDelay = splashCompactViewportQuery\.matches \? 7600 : 3600;/.test(homeJs),
    'mobile nao pode atrasar thumbnails/primeira dobra por 7,6s depois do splash'
  );
  assert.ok(
    !/splashCompactViewportQuery\.matches \? 18000 :/.test(homeJs),
    'mobile nao pode manter fallback de splash/primeira dobra em 18s'
  );
  assert.ok(
    /const mobileFirstFoldMaximumMs\s*=\s*3000/.test(homeJs),
    'home deve declarar limite mobile de primeira dobra em ate 3s'
  );

  assert.ok(
    /\.svc-seo-local\s*{[\s\S]*color:\s*#102c49/.test(serviceCss),
    'card claro do catalogo deve declarar texto escuro para contraste'
  );
}

(async () => {
  runStaticChecks();
  await runHttpChecks();
  console.log('CZS_RENDER_P0_REGRESSION_OK');
})().catch((error) => {
  console.error('CZS_RENDER_P0_REGRESSION_FAIL');
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
