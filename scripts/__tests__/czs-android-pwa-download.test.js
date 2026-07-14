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
  assert.equal(manifest.start_url, "/app.html");
  assert.equal(manifest.scope, "/");
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

test("service worker guarda somente shell publico e usa rede primeiro para noticias", () => {
  const swPath = path.join(ROOT, "app-sw.js");
  assert.equal(fs.existsSync(swPath), true, "app-sw.js deve existir");
  const sw = read("app-sw.js");

  for (const asset of ["/app.html", "/app.css", "/app.js", "/app.webmanifest", "/assets/icon-192.png", "/assets/icon-512.png"]) {
    assert.ok(sw.includes(JSON.stringify(asset)), `shell deve incluir ${asset}`);
  }
  assert.match(sw, /\/api\/news/);
  assert.match(sw, /async function networkFirstNews[\s\S]*caches\.open[\s\S]*fetch\(request\)/);
  assert.match(sw, /cache\.put/);
  assert.match(sw, /APP_CACHE_PREFIX/);
  assert.match(sw, /key\.startsWith\(APP_CACHE_PREFIX\)/);
  assert.match(sw, /\/downloads\//);
  assert.match(sw, /request\.mode === "navigate"/);
  assert.match(sw, /request\.mode === "navigate"[\s\S]*url\.pathname === "\/app\.html"[\s\S]*caches\.match\("\/app\.html"\)/);
  assert.match(sw, /SHELL_ASSETS\.includes\(url\.pathname\)[\s\S]*caches\.match\(url\.pathname\)/);
  assert.doesNotMatch(sw, /cheffe-call|escritorio|real-agents|admin/i);
});

test("app registra service worker com falha silenciosa quando indisponivel", () => {
  const js = read("app.js");
  assert.match(js, /"serviceWorker" in navigator/);
  assert.match(js, /navigator\.serviceWorker\.register\("\/app-sw\.js"/);
  assert.match(js, /\.catch\(\(\) => \{\}\)/);
});

test("home oferece download direto do APK Android", () => {
  const html = read("index.html");
  assert.match(html, /class="android-download-bar"/);
  assert.match(html, /href="\/downloads\/catalogo-czs-android\.apk"/);
  assert.match(html, />Baixar app Android</);
  assert.match(html, /@media\(max-width:760px\)[\s\S]*\.android-download-bar/);
});

test("servidor publica APK com MIME nativo sem liberar pastas privadas", () => {
  const server = read("server.js");
  assert.match(server, /PUBLIC_STATIC_EXTENSIONS[\s\S]*"\.apk"/);
  assert.match(server, /case "\.apk":[\s\S]*application\/vnd\.android\.package-archive/);
  assert.doesNotMatch(server, /PRIVATE_STATIC_SEGMENTS[\s\S]*"downloads"/);
});
