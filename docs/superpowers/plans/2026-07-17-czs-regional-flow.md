# CZS Regional Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a CZS regional infinite flow that organizes news by region plus subsection while mixing organic general items and native ads.

**Architecture:** Add a small tested flow engine, then integrate it into the existing V8 home renderer. The old feed stays available as data source but is visually replaced by the new `CZS Flow` surface.

**Tech Stack:** Plain JavaScript, browser DOM, Node `node:test`, existing CZS V8 CSS.

---

### Task 1: Flow engine test

**Files:**
- Create: `scripts/__tests__/czs-flow-engine.test.js`

- [ ] **Step 1: Write failing test**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { classifyStory, buildCzsFlowEntries } = require("../../assets/v8-final/czs-flow-engine.js");

test("classifies police by region instead of using one generic police bucket", () => {
  assert.equal(classifyStory({ title: "Polícia prende suspeito em Mâncio Lima" }).subsection, "Polícia do Juruá");
  assert.equal(classifyStory({ title: "Polícia Federal faz operação no Brasil" }).subsection, "Polícia do Brasil");
  assert.equal(classifyStory({ title: "PM apreende arma em Rio Branco" }).subsection, "Polícia de Rio Branco");
});

test("builds regional flow with headers, organic inserts and sponsors", () => {
  const stories = [
    { slug: "czs-1", title: "Prefeitura de Cruzeiro do Sul anuncia serviço", imageUrl: "a.jpg", category: "Serviços" },
    { slug: "czs-2", title: "Polícia prende suspeito em Cruzeiro do Sul", imageUrl: "b.jpg", category: "Polícia" },
    { slug: "jurua-1", title: "Polícia prende suspeito em Mâncio Lima", imageUrl: "c.jpg", category: "Polícia" },
    { slug: "jurua-2", title: "Rio Juruá tem alerta para comunidades", imageUrl: "d.jpg", category: "Clima" },
    { slug: "rb-1", title: "Governo decide pauta em Rio Branco", imageUrl: "e.jpg", category: "Política" },
    { slug: "purus-1", title: "Sena Madureira recebe ação no Purus", imageUrl: "f.jpg", category: "Cidades" },
    { slug: "br-1", title: "Polícia Federal faz operação no Brasil", imageUrl: "g.jpg", category: "Brasil" },
    { slug: "viral-1", title: "Vídeo viral gera polêmica nas redes", imageUrl: "h.jpg", category: "Vídeo" },
  ];
  const entries = buildCzsFlowEntries(stories, { limit: 30, sponsorEvery: 5, blockSize: 2 });
  assert(entries.some((entry) => entry.type === "region-header" && entry.regionId === "cruzeiro-do-sul"));
  assert(entries.some((entry) => entry.type === "organic"));
  assert(entries.some((entry) => entry.type === "sponsor"));
  assert(entries.some((entry) => entry.story?.flow?.subsection === "Polícia do Juruá"));
});
```

- [ ] **Step 2: Run red**

Run: `node --test scripts/__tests__/czs-flow-engine.test.js`
Expected: fails because `assets/v8-final/czs-flow-engine.js` does not exist yet.

### Task 2: Flow engine implementation

**Files:**
- Create: `assets/v8-final/czs-flow-engine.js`

- [ ] **Step 1: Implement exported functions**

Implement `classifyStory(story)` and `buildCzsFlowEntries(stories, options)` with deterministic region and subsection labels.

- [ ] **Step 2: Run green**

Run: `node --test scripts/__tests__/czs-flow-engine.test.js`
Expected: pass.

### Task 3: Browser integration

**Files:**
- Modify: `assets/v8-final/v8-merge-ready.js`
- Modify: `assets/v8-final/v8-merge-ready.css`
- Modify: `index.html`

- [ ] **Step 1: Render new section**

Add `installCzsRegionalFlow()` to replace the legacy `#feed` section with a new `CZS Flow`.

- [ ] **Step 2: Style**

Add CSS for `.czs-flow-section`, `.czs-flow-card`, `.czs-flow-region-header`, `.czs-flow-sponsor`, and mobile layout.

- [ ] **Step 3: Verify**

Run syntax, tests, review team and browser checks.
