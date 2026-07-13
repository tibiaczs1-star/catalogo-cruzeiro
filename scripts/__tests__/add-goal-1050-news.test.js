"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  mergeNews,
  storyKey,
  syncIndexSource,
  syncStaticSource
} = require("../add-goal-1050-news");

test("deduplicates title variants for the same regional story", () => {
  const existing = [
    {
      id: "old-ramal",
      title: "Moradores bloqueiam Ramal dos Esquecidos e cobram solução para estrada em Rodrigues Alves"
    },
    { id: "other", title: "Outra notícia do Acre" }
  ];
  const manual = [
    {
      id: "new-ramal",
      title: "Moradores fecham ramal em Rodrigues Alves",
      summary: "Manifestação no Ramal dos Esquecidos"
    }
  ];

  const merged = mergeNews(existing, manual, 10);

  assert.equal(storyKey(existing[0]), storyKey(manual[0]));
  assert.deepEqual(merged.map((item) => item.id), ["new-ramal", "other"]);
});

test("keeps editorial order and archive limit", () => {
  const existing = [
    { id: "old-a", title: "Antiga A" },
    { id: "old-b", title: "Antiga B" },
    { id: "old-c", title: "Antiga C" }
  ];
  const manual = [
    { id: "new-local", title: "Destaque do Vale do Juruá" },
    { id: "new-acre", title: "Destaque do Acre" }
  ];

  assert.deepEqual(
    mergeNews(existing, manual, 3).map((item) => item.id),
    ["new-local", "new-acre", "old-a"]
  );
});

test("preserves surface-specific fields while promoting the new stories", () => {
  const existing = [
    { id: "old-a", title: "Antiga A", runtimeOnly: "keep-runtime" },
    { id: "old-b", title: "Antiga B", staticOnly: "keep-static" }
  ];
  const manual = [{ id: "new", title: "Nova matéria" }];
  const staticSource = `window.NEWS_ARCHIVE_TOTAL = 2;\nwindow.NEWS_DATA = ${JSON.stringify(existing)};\n`;
  const indexSource = `<script id="newsData" type="application/json">${JSON.stringify({
    ok: true,
    total: 2,
    archiveTotal: 2,
    returned: 2,
    surfaceMarker: "keep-index",
    items: existing
  })}</script>`;

  const staticResult = syncStaticSource(staticSource, manual);
  const indexResult = syncIndexSource(indexSource, manual);
  const indexPayload = JSON.parse(indexResult.source.match(/application\/json">([\s\S]*?)<\/script>/)[1]);

  assert.deepEqual(staticResult.items.map((item) => item.id), ["new", "old-a"]);
  assert.equal(staticResult.items[1].runtimeOnly, "keep-runtime");
  assert.deepEqual(indexResult.items.map((item) => item.id), ["new", "old-a"]);
  assert.equal(indexPayload.surfaceMarker, "keep-index");
  assert.equal(indexPayload.items[1].runtimeOnly, "keep-runtime");
});
