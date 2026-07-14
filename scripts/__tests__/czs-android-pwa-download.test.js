const fs = require("fs");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");

const ROOT = path.resolve(__dirname, "..", "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

test("manifesto Android abre o jornal em modo standalone com icones locais", () => {
  const manifestPath = path.join(ROOT, "app.webmanifest");
  assert.equal(fs.existsSync(manifestPath), true, "app.webmanifest deve existir");

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.name, "Catálogo CZS");
  assert.equal(manifest.id, "/app.html");
  assert.equal(manifest.start_url, "/app.html");
  assert.equal(manifest.scope, "/app.html");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.theme_color, "#071a3d");
  assert.deepEqual(
    manifest.icons.map(({ src, sizes, type }) => ({ src, sizes, type })),
    [
      { src: "/assets/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/assets/icon-512.png", sizes: "512x512", type: "image/png" }
    ]
  );
});

test("shell do app declara manifesto, icones e tema", () => {
  const html = read("app.html");
  assert.match(html, /<link rel="manifest" href="\/app\.webmanifest">/);
  assert.match(html, /<meta name="theme-color" content="#071a3d">/);
  assert.match(html, /<link rel="icon"[^>]+href="\/assets\/icon-192\.png"/);
  assert.match(html, /<link rel="apple-touch-icon"[^>]+href="\/assets\/icon-192\.png"/);
});

test("service worker usa stale-while-revalidate no shell e rede primeiro nas noticias", () => {
  const swPath = path.join(ROOT, "app-sw.js");
  assert.equal(fs.existsSync(swPath), true, "app-sw.js deve existir");
  const sw = read("app-sw.js");

  for (const asset of ["/app.html", "/app.css", "/app.js", "/app.webmanifest", "/assets/icon-192.png", "/assets/icon-512.png"]) {
    assert.ok(sw.includes(JSON.stringify(asset)), `shell deve incluir ${asset}`);
  }
  assert.match(sw, /\/api\/news/);
  assert.match(sw, /async function networkFirstNews[\s\S]*caches\.open[\s\S]*fetch\(request\)/);
  assert.match(sw, /cache\.put/);
  assert.match(sw, /function staleWhileRevalidateShell/);
  assert.match(sw, /const cachedPromise = caches\.match\(cacheKey\)/);
  assert.match(sw, /const networkPromise = fetch\(request\)/);
  assert.match(sw, /event\.waitUntil\(networkPromise\.catch/);
  assert.match(sw, /cached \|\| networkPromise/);
  assert.match(sw, /APP_CACHE_PREFIX/);
  assert.match(sw, /key\.startsWith\(APP_CACHE_PREFIX\)/);
  assert.match(sw, /\/downloads\//);
  assert.match(sw, /request\.mode === "navigate"/);
  assert.match(sw, /request\.mode === "navigate"[\s\S]*url\.pathname !== "\/app\.html"/);
  assert.match(sw, /staleWhileRevalidateShell\(request, url\.pathname, event\)/);
  assert.doesNotMatch(sw, /cheffe-call|escritorio|real-agents|admin/i);
});

test("app registra service worker com falha silenciosa quando indisponivel", () => {
  const js = read("app.js");
  assert.match(js, /"serviceWorker" in navigator/);
  assert.match(js, /navigator\.serviceWorker\.register\("\/app-sw\.js", \{ scope: "\/app\.html" \}\)/);
  assert.match(js, /\.catch\(\(\) => \{\}\)/);
});

test("home posiciona CTA CZS depois da primeira sequencia editorial e inicia bloqueado", () => {
  const html = read("index.html");
  assert.match(html, /class="android-download-bar"/);
  assert.ok(html.indexOf('id="androidDownloadPanel"') > html.indexOf('id="latestThreeColumns"'));
  assert.ok(html.indexOf('id="androidDownloadPanel"') < html.indexOf('id="feed"'));
  assert.match(html, /data-download-url="\/downloads\/catalogo-czs-android\.apk"/);
  assert.match(html, /data-metadata-url="\/downloads\/catalogo-czs-android\.json"/);
  assert.match(html, /id="androidDownloadCta"[^>]*aria-disabled="true"/);
  assert.doesNotMatch(html, /id="androidDownloadCta"[^>]*href=/);
  assert.match(html, />Baixar app CZS</);
  assert.match(html, /id="androidDownloadMeta"[^>]*>Versão 1\.0\.0 · Em preparação</);
  assert.match(html, /android-download\.js/);
  assert.match(html, /@media\(max-width:760px\)[\s\S]*\.android-download-bar/);
});

test("metadados iniciais nao fingem que o APK esta pronto", () => {
  const metadata = JSON.parse(read("downloads/catalogo-czs-android.json"));
  assert.deepEqual(metadata, {
    status: "preparing",
    versionName: "1.0.0",
    sizeBytes: null
  });
});

test("controle de download so habilita o APK ready que respondeu ao HEAD", () => {
  const modulePath = path.join(ROOT, "android-download.js");
  assert.equal(fs.existsSync(modulePath), true, "android-download.js deve existir");
  delete require.cache[require.resolve(modulePath)];
  const { resolveDownloadState, formatBytes } = require(modulePath);

  assert.deepEqual(resolveDownloadState({ status: "preparing", versionName: "1.0.0", sizeBytes: null }, false), {
    enabled: false,
    detail: "Versão 1.0.0 · Em preparação"
  });
  assert.deepEqual(resolveDownloadState({ status: "ready", versionName: "1.2.0", sizeBytes: 5242880 }, false), {
    enabled: false,
    detail: "Versão 1.2.0 · Download indisponível"
  });
  assert.deepEqual(resolveDownloadState({ status: "ready", versionName: "1.2.0", sizeBytes: 5242880 }, true), {
    enabled: true,
    detail: "Versão 1.2.0 · 5 MB"
  });
  assert.equal(formatBytes(15728640), "15 MB");

  const source = read("android-download.js");
  assert.match(source, /fetchImpl\(metadataUrl, \{ cache: "no-store" \}\)/);
  assert.match(source, /fetchImpl\(downloadUrl, \{ method: "HEAD", cache: "no-store" \}\)/);
  assert.match(source, /removeAttribute\("href"\)/);
  assert.match(source, /setAttribute\("aria-disabled", "true"\)/);
});

test("servidor publica APK com MIME nativo sem liberar pastas privadas", () => {
  const server = read("server.js");
  assert.match(server, /PUBLIC_STATIC_EXTENSIONS[\s\S]*"\.apk"/);
  assert.match(server, /case "\.apk":[\s\S]*application\/vnd\.android\.package-archive/);
  assert.match(server, /pathname === "\/downloads\/catalogo-czs-android\.json"[\s\S]*ANDROID_APP_METADATA_FILE/);
  assert.doesNotMatch(server, /PRIVATE_STATIC_SEGMENTS[\s\S]*"downloads"/);
});
