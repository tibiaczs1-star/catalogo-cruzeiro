const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

test("applied image approval decisions are not returned as pending", () => {
  const rootDir = path.resolve(__dirname, "..", "..");
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "news-image-approvals-"));
  const staticNewsPath = path.join(rootDir, "news-data.js");
  const originalStaticNews = fs.readFileSync(staticNewsPath, "utf-8");
  const slug = "materia-em-aprovacao";

  try {
    process.env.DATA_DIR = dataDir;
    delete require.cache[require.resolve("../news-image-approval-queue")];
    const { buildImageApprovalQueue, recordImageApprovalDecision } = require("../news-image-approval-queue");

    fs.writeFileSync(
      path.join(dataDir, "news-image-focus-audit.json"),
      `${JSON.stringify({
        updatedAt: "2026-06-02T00:00:00.000Z",
        checkedLimit: 1,
        total: 1,
        summary: { review: 1 },
        items: [
          {
            slug,
            title: "Materia em aprovacao",
            imageUrl: "https://example.com/photo.jpg",
            level: "manual-review",
            reasons: ["frontend-manual-review"]
          }
        ],
        reviewQueue: [
          {
            slug,
            title: "Materia em aprovacao",
            imageUrl: "https://example.com/photo.jpg",
            level: "manual-review",
            reasons: ["frontend-manual-review"]
          }
        ]
      }, null, 2)}\n`,
      "utf-8"
    );
    fs.writeFileSync(
      path.join(dataDir, "runtime-news.json"),
      `${JSON.stringify({ items: [{ slug, title: "Materia em aprovacao", imageUrl: "https://example.com/photo.jpg" }] }, null, 2)}\n`,
      "utf-8"
    );
    fs.writeFileSync(
      path.join(dataDir, "news-archive.json"),
      `${JSON.stringify([{ slug, title: "Materia em aprovacao", imageUrl: "https://example.com/photo.jpg" }], null, 2)}\n`,
      "utf-8"
    );
    fs.writeFileSync(
      staticNewsPath,
      `window.NEWS_DATA = ${JSON.stringify([{ slug, title: "Materia em aprovacao", imageUrl: "https://example.com/photo.jpg" }], null, 2)};\n`,
      "utf-8"
    );

    const recorded = recordImageApprovalDecision({ slug, decision: "approve-focus", focus: "center 42%" });
    assert.equal(recorded.ok, true);
    assert.equal(recorded.applied?.applied, 1);

    const queue = buildImageApprovalQueue({ newOnly: false });
    assert.equal(queue.summary.pending, 0);
    assert.equal(queue.allQueue[0].pending, false);
    assert.equal(queue.allQueue[0].decisionStatus, "applied");
  } finally {
    fs.writeFileSync(staticNewsPath, originalStaticNews, "utf-8");
    delete process.env.DATA_DIR;
    delete require.cache[require.resolve("../news-image-approval-queue")];
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});

test("records and applies approval for an article that is not in the audit queue", () => {
  const rootDir = path.resolve(__dirname, "..", "..");
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "news-image-approvals-fallback-"));
  const staticNewsPath = path.join(rootDir, "news-data.js");
  const originalStaticNews = fs.readFileSync(staticNewsPath, "utf-8");
  const slug = "materia-aprovada-fora-da-auditoria";

  try {
    process.env.DATA_DIR = dataDir;
    delete require.cache[require.resolve("../news-image-approval-queue")];
    const { recordImageApprovalDecision } = require("../news-image-approval-queue");

    fs.writeFileSync(
      path.join(dataDir, "news-image-focus-audit.json"),
      `${JSON.stringify({ updatedAt: "2026-06-02T00:00:00.000Z", summary: {}, items: [], reviewQueue: [] }, null, 2)}\n`,
      "utf-8"
    );
    fs.writeFileSync(
      path.join(dataDir, "runtime-news.json"),
      `${JSON.stringify({ items: [{ slug, title: "Materia aprovada fora da auditoria", imageUrl: "https://example.com/photo.jpg" }] }, null, 2)}\n`,
      "utf-8"
    );
    fs.writeFileSync(path.join(dataDir, "news-archive.json"), "[]\n", "utf-8");
    fs.writeFileSync(staticNewsPath, "window.NEWS_DATA = [];\n", "utf-8");

    const recorded = recordImageApprovalDecision({ slug, decision: "approve-focus", focus: "center 42%" });
    assert.equal(recorded.ok, true);
    assert.equal(recorded.applied?.applied, 1);

    const runtimeNews = JSON.parse(fs.readFileSync(path.join(dataDir, "runtime-news.json"), "utf-8"));
    assert.equal(runtimeNews.items[0].imageReviewStatus, "focus-approved");
  } finally {
    fs.writeFileSync(staticNewsPath, originalStaticNews, "utf-8");
    delete process.env.DATA_DIR;
    delete require.cache[require.resolve("../news-image-approval-queue")];
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});
