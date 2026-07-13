"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { dedupeArchiveItems, selectPinnedArchiveStories } = require("../news-archive-pins");

test("keeps the current social synchronization batch above the diversified archive", () => {
  const items = [
    { id: "old-local", priority: 9999, title: "Outra notícia local" },
    { id: "sync-b", priority: 1040, editorialPriority: "acre-social-sync-1050" },
    { id: "old-acre", priority: 9000, title: "Outra notícia do Acre" },
    { id: "sync-a", priority: 1100, editorialPriority: "jurua-social-sync-1050" }
  ];
  let diversifiedInput = [];

  const selected = selectPinnedArchiveStories(items, 4, (regular) => {
    diversifiedInput = regular;
    return regular.slice().reverse();
  });

  assert.deepEqual(selected.map((item) => item.id), ["sync-a", "sync-b", "old-acre", "old-local"]);
  assert.deepEqual(diversifiedInput.map((item) => item.id), ["old-local", "old-acre"]);
});

test("honors small API limits without leaking a regular item above a pin", () => {
  const items = [
    { id: "old", priority: 9999 },
    { id: "sync-b", priority: 1040, editorialPriority: "acre-social-sync-1050" },
    { id: "sync-a", priority: 1100, editorialPriority: "jurua-social-sync-1050" }
  ];

  assert.deepEqual(
    selectPinnedArchiveStories(items, 1, () => items).map((item) => item.id),
    ["sync-a"]
  );
});

test("removes repeated IDs and normalized headlines from the public archive", () => {
  const items = [
    { id: "same-id", title: "Primeira manchete" },
    { id: "same-id", title: "Outro título para o mesmo registro" },
    { id: "new-id", title: "Primeira Manchete!" },
    { id: "unique", title: "Notícia diferente" }
  ];

  assert.deepEqual(
    dedupeArchiveItems(items).map((item) => item.id),
    ["same-id", "unique"]
  );
});
