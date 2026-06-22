const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT_DIR = path.resolve(__dirname, "..");
const INDEX_FILE = path.join(ROOT_DIR, "index.html");
const NEWS_FILE = path.join(ROOT_DIR, "news-data.js");

function readNewsItems() {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(NEWS_FILE, "utf8"), sandbox);
  return Array.isArray(sandbox.window.NEWS_DATA) ? sandbox.window.NEWS_DATA : [];
}

function run() {
  const items = readNewsItems();
  if (!items.length) {
    throw new Error("news-data.js nao possui noticias para sincronizar.");
  }

  const payload = {
    ok: true,
    total: items.length,
    archiveTotal: items.length,
    returned: items.length,
    items
  };
  const replacement = `<script id="newsData" type="application/json">${JSON.stringify(payload)}</script>`;
  const index = fs.readFileSync(INDEX_FILE, "utf8");
  const updated = index.replace(
    /<script id="newsData" type="application\/json">[\s\S]*?<\/script>/,
    replacement
  );

  if (updated === index) {
    throw new Error("Bloco newsData nao encontrado ou ja estava identico.");
  }

  fs.writeFileSync(INDEX_FILE, updated, "utf8");
  console.log(JSON.stringify({ ok: true, items: items.length, first: items[0].title }, null, 2));
}

run();
