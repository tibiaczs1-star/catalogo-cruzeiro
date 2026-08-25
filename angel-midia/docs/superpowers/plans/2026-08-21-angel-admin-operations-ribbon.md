# Angel Mídia Admin Operations Ribbon Implementation Plan

> Direction approved: comp B, with the TV inspector behavior adapted from comp C.

**Goal:** Replace the current dark card dashboard with a blue-and-white operational admin that shows a real map, three deterministic local test TVs, company imagery, and a contextual TV inspector.

**Architecture:** Keep the static ESM controller and existing API contract. Extract dashboard rendering into a focused overview module, replace the coordinate-only plot with a keyless OpenStreetMap tile renderer plus exact Google Maps deep links, and extend advertisers with persisted `logo_url` and `photo_url` fields. Demo data remains local-only and never seeds production implicitly.

**Tech Stack:** Vanilla ESM, CSS, Vitest/jsdom, Node test runner, Fastify/PostgreSQL, Android Gradle wrappers.

---

### Task 1: Lock tests around the approved surface

**Files:** `controller/tests/app-shell.test.js`, `controller/tests/tvs.test.js`, `controller/tests/finance.test.js`, `api/test/advertisers-emergency.test.js`

- Assert the operation ribbon, real OSM tiles, three markers, contextual drawer, company image fields, and blue-white tokens.
- Run targeted tests and confirm they fail before implementation.

### Task 2: Build the operational dashboard and real map

**Files:** `controller/src/app.js`, `controller/src/overview.js`, `controller/src/tvs.js`, `controller/src/styles.css`, `controller/src/tvs.css`, `controller/src/responsive.css`, `controller/index.html`

- Render compact navigation, top bar, ribbon, map, TV inventory, company gallery, publication footer, and inspector.
- Render OSM tiles with Web Mercator projection and retain exact Google Maps links.
- Use three deterministic local demo TVs only when the local test/demo path has no devices.

### Task 3: Persist company imagery

**Files:** `api/migrations/007_advertiser_images.sql`, `api/src/services/advertisers.js`, `api/src/routes/advertisers.js`, `controller/src/finance.js`

- Add `logo_url` and `photo_url`, validate safe URL/data-image values, persist them, and show live previews/fallbacks.
- Keep existing financial and media-link behavior intact.

### Task 4: Verify behavior and visual fidelity

**Files:** `.impeccable/review/*`, `DESIGN.md`, `.impeccable/design.json`

- Run focused tests, full test suites, syntax/build checks, responsive browser captures, and the Impeccable detector exactly once.
- Apply one correction batch, record final screenshots, then document the shipped system.

### Task 5: Build local Android artifacts

**Files:** `android/gradle.properties`, `controller/downloads/*.apk`

- Bump the local release, build Admin and TV APKs, copy versioned outputs, and verify package/version metadata.
- Stop before BlueStacks installation, push, deploy, or production demo insertion; those require fresh explicit authorization after visual proof.
