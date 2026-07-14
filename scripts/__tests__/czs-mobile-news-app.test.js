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

  assert.equal(getArticleHref({ slug: "chuva-no-jurua" }), "/noticia.html?slug=chuva-no-jurua");
  assert.equal(getArticleHref({ slug: "../admin" }), "/arquivo.html");
  assert.equal(getArticleHref({ sourceUrl: "javascript:alert(1)" }), "/arquivo.html");
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

test("shell publico aponta para API leve e nao inclui modulos privados", () => {
  const htmlPath = path.join(ROOT, "app.html");
  assert.equal(fs.existsSync(htmlPath), true, "app.html deve existir");
  const html = fs.readFileSync(htmlPath, "utf8");
  const js = fs.readFileSync(APP_JS, "utf8");

  assert.match(js, /\/api\/news\?limit=40&lite=1/);
  assert.match(html, /id="newNewsNotice"/);
  assert.match(html, /id="newsFeed"/);
  assert.doesNotMatch(`${html}\n${js}`, /Cheffe Call|escrit[oó]rios|agentes/i);
  assert.doesNotMatch(js, /Notification|PushManager|serviceWorker/);
});
