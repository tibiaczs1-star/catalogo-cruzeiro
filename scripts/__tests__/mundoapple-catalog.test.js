const test = require("node:test");
const assert = require("node:assert/strict");

const catalog = require("../../mundoapple/data/apple-products.json");

test("Mundo Apple ships a unique 2016-2026 master catalog with zero initial stock", () => {
  assert.equal(catalog.length, 184);

  const keys = catalog.map((product) => product.key);
  assert.equal(new Set(keys).size, catalog.length);
  assert.equal(Math.min(...catalog.map((product) => product.year)), 2016);
  assert.equal(Math.max(...catalog.map((product) => product.year)), 2026);

  for (const product of catalog) {
    assert.ok(product.key);
    assert.ok(product.name);
    assert.ok(product.family);
    assert.ok(product.category);
    assert.ok(Number.isInteger(product.year));
    assert.equal(product.initialStock, 0);
    assert.equal(product.published, false);
    assert.equal(product.source, "Apple Support");
    assert.equal(product.reviewStatus, "confirmed");
  }
});
