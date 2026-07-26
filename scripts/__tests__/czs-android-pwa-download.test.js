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
  assert.match(html, /class="app-footer-brand"/);
  assert.doesNotMatch(html, /<footer>[\s\S]*<img/);
  assert.match(html, /class="instagram-follow-card"/);
  assert.match(html, /https:\/\/www\.instagram\.com\/catalogo_czs_\//);
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
  const js = read("assets/v8-final/v8-merge-ready.js");
  const css = read("assets/v8-final/v8-merge-ready.css");
  assert.match(html, /class="android-download-bar android-download-native"/);
  assert.ok(html.indexOf('id="androidDownloadPanel"') > html.indexOf('id="latestThreeColumns"'));
  assert.ok(html.indexOf('id="androidDownloadPanel"') < html.indexOf('id="feed"'));
  assert.match(html, /data-download-url="\/downloads\/catalogo-czs-android\.apk"/);
  assert.match(html, /data-metadata-url="\/downloads\/catalogo-czs-android\.json"/);
  assert.match(html, /id="androidDownloadCta"[^>]*aria-disabled="true"/);
  assert.doesNotMatch(html, /id="androidDownloadCta"[^>]*href=/);
  assert.doesNotMatch(html, />Baixar app CZS</);
  assert.match(html, /id="androidDownloadMeta"[^>]*>Versão 1\.0\.0 · Em preparação</);
  assert.match(html, /android-download\.js/);
  assert.match(html, /@media\(max-width:760px\)[\s\S]*\.android-download-bar/);
  assert.match(css, /#androidDownloadPanel\.android-download-native[\s\S]*background:\s*#fff\s*!important;/);
  assert.match(css, /#androidDownloadPanel\.android-download-native\s+~\s+#feed[\s\S]*margin-top:\s*0\s*!important;/);
  assert.match(css, /#androidDownloadCta[\s\S]*display:\s*none\s*!important;/);
  assert.match(css, /#androidDownloadPanel\.android-download-native[\s\S]*max-width:\s*min\(1080px, calc\(100% - 32px\)\)\s*!important;/);
  assert.match(css, /#androidDownloadPanel\.android-download-native[\s\S]*border-radius:\s*0\s*!important;/);
  assert.match(html, /class="instagram-site-highlight"/);
  assert.match(html, /Instagram oficial/);
  assert.match(html, /https:\/\/www\.instagram\.com\/catalogo_czs_\//);
  assert.match(css, /\.instagram-site-highlight[\s\S]*background:\s*#fff\s*!important;/);
  assert.match(css, /\.instagram-site-highlight[\s\S]*box-shadow:\s*none\s*!important;/);
  assert.doesNotMatch(css, /\.instagram-site-highlight[\s\S]{0,500}linear-gradient/);
  assert.doesNotMatch(js, /czsAndroidFixedDownload|installAndroidFixedDownload/, "download do app não pode ser botão flutuante por cima do conteúdo");
  assert.doesNotMatch(css, /czs-android-fixed-download/, "CSS não deve manter CTA fixo sobreposto do Android");
});

test("home usa atalhos laterais discretos para app e Instagram e convite no loader", () => {
  const html = read("index.html");
  const js = read("assets/v8-final/v8-merge-ready.js");
  const css = read("assets/v8-final/v8-merge-ready.css");

  assert.match(html, /20260726-intro-recovery-v2/, "cache da home deve subir para publicar a abertura V8 restaurada");
  assert.match(js, /function installRightActionRail\(\)/);
  assert.match(js, /id = "czsRightActionRail"/);
  assert.match(js, /data-czs-action="instagram"/);
  assert.match(js, /data-czs-action="android"/);
  assert.match(js, /class="czs-rail-icon czs-rail-icon-instagram"/);
  assert.match(js, /class="czs-rail-icon czs-rail-icon-android"/);
  assert.match(js, /class="czs-rail-icon czs-rail-icon-partners"/);
  assert.match(js, /<rect class="czs-rail-phone"/);
  assert.match(js, /<path class="czs-rail-download"/);
  assert.doesNotMatch(js, />IG<\/b>/);
  assert.doesNotMatch(js, />APP<\/b>/);
  assert.match(js, /\/downloads\/catalogo-czs-android\.apk/);
  assert.match(js, /SOCIAL_INSTAGRAM/);
  assert.match(css, /\.czs-right-action-rail[\s\S]*position:\s*fixed\s*!important;/);
  assert.match(css, /\.czs-right-action-rail[\s\S]*right:\s*14px\s*!important;/);
  assert.match(css, /\.czs-right-action-rail a[\s\S]*border-radius:\s*999px\s*!important;/);
  assert.match(css, /\.czs-right-action-rail svg[\s\S]*width:\s*25px\s*!important;/);
  assert.match(css, /\.czs-right-action-rail svg[\s\S]*stroke-linecap:\s*round\s*!important;/);
  assert.match(css, /\.czs-right-action-rail a span[\s\S]*opacity:\s*0\s*!important;/);
  assert.match(css, /\.czs-right-action-rail a:is\(:hover, :focus-visible\) span[\s\S]*opacity:\s*1\s*!important;/);
  assert.match(js, /function hydrateSideUtilityDock\(\)/);
  assert.match(js, /api\.open-meteo\.com/);
  assert.match(js, /economia\.awesomeapi\.com\.br/);
  assert.doesNotMatch(js, /query1\.finance\.yahoo\.com/, "não usar API de bolsa que bloqueia CORS no navegador");
  assert.match(js, /data-czs-side-widget="weather"/);
  assert.match(js, /data-czs-side-widget="market"/);
  assert.match(js, /data-czs-side-widget="ibov"/);
  assert.match(js, /data-czs-side-widget="clock"/);
  assert.match(css, /\.czs-side-widget-panel[\s\S]*opacity:\s*0\s*!important;/);
  assert.match(css, /\.czs-right-action-rail:is\(:hover, :focus-within\) \.czs-side-widget-panel[\s\S]*opacity:\s*1\s*!important;/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.czs-right-action-rail/);

  assert.match(js, /function installLoaderActionInvites\(\)/);
  assert.match(js, /className = "czs-loader-action-invites"/);
  assert.match(css, /\.czs-loader-action-invites[\s\S]*display:\s*flex\s*!important;/);
  assert.match(css, /\.czs-loader-action-invites a[\s\S]*border:\s*1px solid rgba\(255, 255, 255, \.28\)\s*!important;/);
});

test("metadados do APK publicado descrevem o arquivo real", () => {
  const metadata = JSON.parse(read("downloads/catalogo-czs-android.json"));
  const apkPath = path.join(ROOT, "downloads", "catalogo-czs-android.apk");
  assert.equal(fs.existsSync(apkPath), true, "APK deve existir para download");
  assert.equal(metadata.status, "ready");
  assert.equal(metadata.versionName, "1.0.0");
  assert.equal(metadata.versionCode, 1);
  assert.equal(metadata.url, "/downloads/catalogo-czs-android.apk");
  assert.equal(metadata.sizeBytes, fs.statSync(apkPath).size);
  assert.match(metadata.sha256, /^[a-f0-9]{64}$/);
  assert.match(metadata.notes, /sem notificacoes push/i);
});

test("assetlinks publica a assinatura Android para TWA", () => {
  const assetlinks = JSON.parse(read(".well-known/assetlinks.json"));
  assert.equal(assetlinks[0].target.package_name, "com.catalogoczs.app");
  assert.deepEqual(assetlinks[0].relation, ["delegate_permission/common.handle_all_urls"]);
  assert.deepEqual(assetlinks[0].target.sha256_cert_fingerprints, [
    "FE:21:A5:36:2B:BB:AE:DC:09:4B:D8:75:C9:FC:33:45:54:FF:FE:A4:74:E2:43:B4:2A:9C:DB:56:A1:32:D7:AF"
  ]);
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
