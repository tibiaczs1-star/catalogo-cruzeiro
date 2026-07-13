const test = require("node:test");
const assert = require("node:assert/strict");

const { mergeNewsItems } = require("../capture-latest-news");

test("deduplicates the same headline even when sources or publication days differ", () => {
  const items = mergeNewsItems(
    [{ title: "A mesma manchete", publishedAt: "2026-07-12T10:00:00Z", sourceUrl: "https://fonte-a.test/a" }],
    [{ title: "A mesma manchete", publishedAt: "2026-07-13T10:00:00Z", sourceUrl: "https://fonte-b.test/b" }]
  );

  assert.equal(items.length, 1);
});

test("deduplicates the same canonical URL when the headline was revised", () => {
  const items = mergeNewsItems(
    [{ title: "Manchete inicial", publishedAt: "2026-07-13T10:00:00Z", sourceUrl: "https://fonte.test/noticia?utm_source=x" }],
    [{ title: "Manchete atualizada", publishedAt: "2026-07-13T11:00:00Z", sourceUrl: "https://fonte.test/noticia" }]
  );

  assert.equal(items.length, 1);
});

test("keeps unrelated stories", () => {
  const items = mergeNewsItems([
    { title: "Primeira pauta", publishedAt: "2026-07-13T10:00:00Z", sourceUrl: "https://fonte.test/a" },
    { title: "Segunda pauta", publishedAt: "2026-07-13T10:00:00Z", sourceUrl: "https://fonte.test/b" }
  ]);

  assert.equal(items.length, 2);
});
