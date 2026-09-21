const test = require("node:test");
const assert = require("node:assert/strict");
const { buildPlan, validateItem } = require("../czs-video-newsroom-gate");

const valid = {
  id: "czs-001",
  title: "Ponte recebe manutenção em Cruzeiro do Sul",
  location: "Cruzeiro do Sul",
  sourceName: "Órgão responsável",
  sourceUrl: "https://example.org/noticia",
  mediaType: "source-video",
  mediaUrl: "https://example.org/video.mp4",
  rights: "cleared",
  status: "confirmed",
  category: "public-service",
  publishedAt: "2026-09-14T15:00:00-05:00",
};

test("accepts verified real source video and routes to video-first reel", () => {
  const result = validateItem(valid, new Date("2026-09-14T21:00:00Z"));
  assert.equal(result.accepted, true);
  assert.equal(result.decision.format, "video-first-reel");
  assert.equal(result.decision.render, "ffmpeg-nvenc-preferred");
  assert.equal(result.decision.publication, "awaiting-explicit-human-approval");
});

test("blocks media without rights and public source", () => {
  const result = validateItem({ ...valid, rights: "unknown", sourceUrl: "" });
  assert.equal(result.accepted, false);
  assert.ok(result.errors.includes("media-rights-not-cleared"));
  assert.ok(result.errors.includes("missing-or-invalid-public-source-url"));
  assert.equal(result.decision.format, "blocked");
});

test("blocks AI-generated documentary evidence", () => {
  const result = validateItem({ ...valid, aiGeneratedDocumentaryMedia: true });
  assert.equal(result.accepted, false);
  assert.ok(result.errors.includes("ai-generated-media-cannot-be-documentary-evidence"));
});

test("developing coverage names what remains unconfirmed", () => {
  const blocked = validateItem({ ...valid, status: "developing", unconfirmed: "" });
  assert.ok(blocked.errors.includes("developing-item-must-state-what-is-unconfirmed"));
  const accepted = validateItem({ ...valid, status: "developing", unconfirmed: "Causa ainda não confirmada" });
  assert.equal(accepted.accepted, true);
});

test("plan reports accepted and blocked totals exactly", () => {
  const plan = buildPlan({ items: [valid, { ...valid, id: "czs-002", rights: "unknown" }] }, new Date("2026-09-14T21:00:00Z"));
  assert.equal(plan.accepted, 1);
  assert.equal(plan.blocked, 1);
  assert.equal(plan.status, "prepared-not-published");
});
