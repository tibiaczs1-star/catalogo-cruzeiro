const fs = require("node:fs");
const path = require("node:path");

const REQUIRED_CONFIRMATION = new Set(["confirmed", "developing"]);
const REAL_MEDIA_TYPES = new Set(["source-video", "source-photo", "source-screenshot"]);
const CATEGORIES_WITHOUT_MUSIC = new Set(["death", "accident-with-victim", "police-sensitive"]);

function clean(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function decideFormat(item) {
  if (item.mediaType === "source-video") return "video-first-reel";
  if (item.status === "developing") return "developing-update-story";
  if (item.mediaType === "source-photo" || item.mediaType === "source-screenshot") {
    return "capture-context-story";
  }
  return "blocked";
}

function musicPolicy(category = "") {
  return CATEGORIES_WITHOUT_MUSIC.has(category) ? "none-or-neutral-very-low" : "category-appropriate-low";
}

function validateItem(item, now = new Date()) {
  const errors = [];
  const warnings = [];
  const title = clean(item.title);
  const sourceName = clean(item.sourceName);
  const sourceUrl = clean(item.sourceUrl);
  const location = clean(item.location);
  const publishedAt = new Date(item.publishedAt || "");

  if (!title) errors.push("missing-title");
  if (!location) errors.push("missing-location");
  if (!sourceName) errors.push("missing-source-name");
  if (!/^https?:\/\//i.test(sourceUrl)) errors.push("missing-or-invalid-public-source-url");
  if (!REQUIRED_CONFIRMATION.has(item.status)) errors.push("invalid-confirmation-status");
  if (!REAL_MEDIA_TYPES.has(item.mediaType)) errors.push("missing-real-source-media");
  if (!/^https?:\/\//i.test(clean(item.mediaUrl))) errors.push("missing-or-invalid-media-url");
  if (item.rights !== "cleared") errors.push("media-rights-not-cleared");
  if (Number.isNaN(publishedAt.getTime())) errors.push("invalid-published-at");
  if (item.status === "developing" && !clean(item.unconfirmed)) {
    errors.push("developing-item-must-state-what-is-unconfirmed");
  }
  if (item.aiGeneratedDocumentaryMedia === true) {
    errors.push("ai-generated-media-cannot-be-documentary-evidence");
  }
  if (title.length > 90) warnings.push("title-needs-editorial-shortening");
  if (!Number.isNaN(publishedAt.getTime()) && publishedAt > now) warnings.push("published-at-is-in-future");

  return {
    id: clean(item.id) || null,
    accepted: errors.length === 0,
    errors,
    warnings,
    decision: {
      format: errors.length ? "blocked" : decideFormat(item),
      canvas: "1080x1920",
      safeArea: { xMin: 72, xMax: 1008, yMin: 280, yMax: 1540 },
      music: musicPolicy(item.category),
      publication: "awaiting-explicit-human-approval",
      render: item.mediaType === "source-video" ? "ffmpeg-nvenc-preferred" : "ffmpeg-template",
      generativeAi: "background-or-illustration-only-never-documentary-evidence",
    },
  };
}

function buildPlan(payload, now = new Date()) {
  const items = Array.isArray(payload.items) ? payload.items : [];
  const results = items.map((item) => validateItem(item, now));
  return {
    generatedAt: now.toISOString(),
    policy: "CZS video-first; real source media; factual verification; human publication gate",
    status: "prepared-not-published",
    accepted: results.filter((result) => result.accepted).length,
    blocked: results.filter((result) => !result.accepted).length,
    items: results,
  };
}

function main() {
  const input = process.argv[2];
  const output = process.argv[3];
  if (!input) throw new Error("Uso: node scripts/czs-video-newsroom-gate.js <intake.json> [plan.json]");
  const payload = JSON.parse(fs.readFileSync(path.resolve(input), "utf8"));
  const plan = buildPlan(payload);
  const serialized = `${JSON.stringify(plan, null, 2)}\n`;
  if (output) fs.writeFileSync(path.resolve(output), serialized, "utf8");
  process.stdout.write(serialized);
  if (plan.blocked > 0) process.exitCode = 2;
}

module.exports = { buildPlan, validateItem, decideFormat, musicPolicy };

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
