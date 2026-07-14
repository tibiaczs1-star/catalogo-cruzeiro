const fs = require("fs");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");

const ROOT = path.resolve(__dirname, "..", "..");
const APP_JS = path.join(ROOT, "app.js");

function loadAppModule() {
  assert.equal(fs.existsSync(APP_JS), true, "app.js deve existir");
  delete require.cache[require.resolve(APP_JS)];
  return require(APP_JS);
}

test("normaliza somente itens de noticia publicaveis do endpoint leve", () => {
  const { normalizeNewsPayload } = loadAppModule();
  const result = normalizeNewsPayload({
    items: [
      { id: "1", slug: "rio-jurua", title: "Rio Jurua sobe", imageUrl: "/rio.webp" },
      { id: "2", slug: "sem-titulo" },
      null
    ]
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].title, "Rio Jurua sobe");
  assert.equal(result[0].imageUrl, "/rio.webp");
});

test("gera apenas rotas internas seguras para a leitura da noticia", () => {
  const { getArticleHref } = loadAppModule();

  assert.equal(getArticleHref({ slug: "chuva-no-jurua" }), "/app.html?slug=chuva-no-jurua");
  assert.equal(getArticleHref({ slug: "../admin" }), "");
  assert.equal(getArticleHref({ sourceUrl: "javascript:alert(1)" }), "");
});

test("reconhece video apenas quando a noticia traz midia reproduzivel", () => {
  const { hasPlayableVideo } = loadAppModule();

  assert.equal(hasPlayableVideo({ videoUrl: "/assets/noticias/resumo.mp4" }), true);
  assert.equal(hasPlayableVideo({ media: { type: "video", url: "https://youtu.be/exemplo" } }), true);
  assert.equal(hasPlayableVideo({ videoCaptionStatus: "ready", videoUrl: "" }), false);
});

test("detecta noticias novas sem avisar no primeiro carregamento", () => {
  const { findNewItems } = loadAppModule();
  const before = [
    { id: "a", slug: "primeira", title: "Primeira" },
    { id: "b", slug: "segunda", title: "Segunda" }
  ];
  const after = [{ id: "c", slug: "nova", title: "Nova" }, ...before];

  assert.deepEqual(findNewItems([], before), []);
  assert.deepEqual(findNewItems(before, after).map((item) => item.id), ["c"]);
});

test("filtra noticias localmente por busca e editoria", () => {
  const { filterNewsItems } = loadAppModule();
  const items = [
    { title: "Rio Juruá sobe", summary: "Alerta em Cruzeiro", category: "Clima" },
    { title: "Festival começa hoje", summary: "Agenda cultural", category: "Cultura" }
  ];

  assert.deepEqual(filterNewsItems(items, { query: "cruzeiro", category: "all" }).map((item) => item.title), ["Rio Juruá sobe"]);
  assert.deepEqual(filterNewsItems(items, { query: "", category: "Cultura" }).map((item) => item.title), ["Festival começa hoje"]);
  assert.deepEqual(filterNewsItems(items, { query: "rio", category: "Cultura" }), []);
});

test("calcula lotes leves de carregar mais com limite seguro", () => {
  const { getNextNewsLimit } = loadAppModule();

  assert.equal(getNextNewsLimit(40), 80);
  assert.equal(getNextNewsLimit(80), 120);
  assert.equal(getNextNewsLimit(200), 200);
});

test("shell publico aponta para API leve e nao inclui modulos privados", () => {
  const htmlPath = path.join(ROOT, "app.html");
  assert.equal(fs.existsSync(htmlPath), true, "app.html deve existir");
  const html = fs.readFileSync(htmlPath, "utf8");
  const js = fs.readFileSync(APP_JS, "utf8");

  assert.match(js, /\/api\/news\?limit=40&lite=1/);
  assert.match(js, /\/api\/news\?limit=1&lite=1&sort=latest/);
  assert.match(html, /id="newNewsNotice"/);
  assert.match(html, /id="newsFeed"/);
  assert.match(html, /id="newsFeed" tabindex="-1"/);
  assert.match(html, /id="loadMoreNews"/);
  assert.match(html, />Carregar mais</);
  assert.match(html, /id="feedView"/);
  assert.match(html, /id="articleReader"/);
  assert.match(html, /id="articleBack"/);
  assert.match(js, /\/api\/news\/\$\{encodeURIComponent\(slug\)\}/);
  assert.match(js, /\/api\/news\?limit=40&lite=1&sort=latest&video=1/);
  assert.match(js, /function ensureFeed\(/);
  assert.match(js, /ensureFeed\(\);[\s\S]*openArticle\(initialSlug\)/);
  assert.match(js, /if \(!currentItems\.length\) await ensureFeed\(\)/);
  assert.match(js, /createElement\("div", "story-static"\)/);
  assert.match(html, /id="newsSearch"/);
  assert.match(html, /id="categoryFilter"/);
  assert.match(html, /aria-label="Buscar nas notícias"/);
  assert.match(html, />Editorias</);
  assert.doesNotMatch(`${html}\n${js}`, /Cheffe Call|escrit[oó]rios|agentes/i);
  assert.doesNotMatch(`${html}\n${js}`, /noticia\.html/);
  assert.doesNotMatch(js, /Notification|PushManager/);
  assert.match(js, /navigator\.serviceWorker\.register\("\/app-sw\.js"/);
});

test("navegacao inferior reune os quatro destinos publicos com estados acessiveis", () => {
  const html = fs.readFileSync(path.join(ROOT, "app.html"), "utf8");
  const css = fs.readFileSync(path.join(ROOT, "app.css"), "utf8");
  const js = fs.readFileSync(APP_JS, "utf8");
  const nav = html.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)?.[0] || "";

  assert.match(nav, /data-destination="latest"[^>]*aria-current="page"[^>]*>[^<]*Últimas/);
  assert.match(nav, /data-destination="video"[^>]*aria-current="false"[^>]*>[^<]*Vídeos/);
  assert.match(nav, /data-destination="categories"[^>]*aria-expanded="false"[^>]*>[^<]*Editorias/);
  assert.match(nav, /data-destination="search"[^>]*aria-expanded="false"[^>]*>[^<]*Busca/);
  assert.match(css, /\.bottom-nav\s*\{[\s\S]*?position:\s*fixed/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(js, /aria-current/);
  assert.match(js, /aria-expanded/);
});
