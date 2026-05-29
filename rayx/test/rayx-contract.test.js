"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("boot plan has visible steps and no silent operation above 10 minutes", () => {
  const { buildBootPlan } = require("../core/boot");
  const plan = buildBootPlan();

  assert.equal(plan.schema, "rayx.boot.plan.v1");
  assert.ok(plan.steps.length >= 6);
  assert.ok(plan.steps.every((step) => step.id && step.title && step.command));
  assert.ok(plan.steps.every((step) => step.maxSilentMinutes <= 10));
  assert.ok(plan.steps.some((step) => step.id === "doctor"));
  assert.ok(plan.steps.some((step) => step.id === "catalog"));
  assert.ok(plan.steps.some((step) => step.id === "chrome-bridge"));
});

test("tool catalog exposes inherited local tools and skill inventory", () => {
  const { scanCatalog } = require("../core/catalog");
  const catalog = scanCatalog();

  assert.equal(catalog.schema, "rayx.catalog.v1");
  assert.ok(catalog.tools.some((tool) => tool.name === "node" && tool.found));
  assert.ok(catalog.tools.some((tool) => tool.name === "git"));
  assert.ok(catalog.skills.total >= 1);
  assert.ok(catalog.groups.some((group) => group.id === "llm-cli"));
});

test("Hermes adapter exposes status, open and log actions", () => {
  const { getHermesStatus } = require("../adapters/hermes");
  const status = getHermesStatus();

  assert.equal(status.schema, "rayx.hermes.adapter.v1");
  assert.equal(typeof status.found, "boolean");
  assert.ok(status.actions.some((action) => action.id === "status"));
  assert.ok(status.actions.some((action) => action.id === "open-desktop"));
  assert.ok(status.actions.some((action) => action.id === "logs"));
});

test("Chrome bridge exposes profiles and a CDP launch contract", () => {
  const { getChromeBridgeStatus } = require("../adapters/chrome");
  const bridge = getChromeBridgeStatus();

  assert.equal(bridge.schema, "rayx.chrome.bridge.v1");
  assert.equal(bridge.remoteDebuggingPort, 9222);
  assert.ok(Array.isArray(bridge.profiles));
  assert.ok(bridge.actions.some((action) => action.id === "launch-cdp"));
  assert.ok(bridge.actions.some((action) => action.id === "list-tabs"));
});

test("RayX chat routes user messages to local tools before LLM fallback", () => {
  const { buildChatPrompt, routeChatMessage } = require("../core/chat");

  assert.equal(routeChatMessage("como esta o hermes agora?").intent, "hermes");
  assert.equal(routeChatMessage("abre o chrome cdp").intent, "chrome-bridge");
  assert.equal(routeChatMessage("faz o boot do sistema").intent, "boot");
  assert.equal(routeChatMessage("quais ferramentas voce herdou?").intent, "catalog");
  assert.equal(routeChatMessage("me explica o plano geral").intent, "llm");

  const prompt = buildChatPrompt("me explica o plano geral", { history: [] });
  assert.equal(prompt.outputLanguage, "pt-BR");
  assert.ok(prompt.system.includes("RayX"));
});

test("desktop exposes a useful non-blocking workspace", () => {
  const root = path.resolve(__dirname, "..", "desktop");
  const main = fs.readFileSync(path.join(root, "main.js"), "utf8");
  const html = fs.readFileSync(path.join(root, "renderer", "index.html"), "utf8");
  const app = fs.readFileSync(path.join(root, "renderer", "app.js"), "utf8");

  assert.ok(main.includes("execFile("));
  assert.ok(main.includes("runRayx"));
  assert.ok(!main.includes("buildReport"));
  assert.ok(html.includes("chatThread"));
  assert.ok(html.includes("evidenceList"));
  assert.ok(html.includes("activityList"));
  assert.ok(app.includes("addMessage"));
  assert.ok(app.includes("appendActivity"));
});
