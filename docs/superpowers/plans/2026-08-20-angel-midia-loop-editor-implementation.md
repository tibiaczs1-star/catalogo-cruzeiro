# Angel Mídia Loop and Media Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar programação contínua sem datas, reprodução circular no APK TV e uma biblioteca/editor Retro Pro que mostre a mídia inteira e permita enquadramento não destrutivo de imagem e vídeo.

**Architecture:** O banco e a API recebem um modo explícito de programação e publicam um manifesto com `loop: true`. O painel separa os componentes de programação, visualização e edição, persistindo apenas metadados; o APK aplica esses metadados e calcula o próximo índice circularmente. Cada camada é coberta por testes antes da implementação.

**Tech Stack:** PostgreSQL migrations, Node.js ESM, Fastify, Vitest/JSDOM, HTML/CSS, Android Kotlin, JUnit, Android `VideoView`/`ImageView`.

---

## File map

- Create `angel-midia/api/migrations/006_continuous_schedules.sql`: mode column, nullable dates and consistency constraint.
- Modify `angel-midia/api/src/services/schedule.js`: validate continuous/scheduled payloads and build loop-aware manifests.
- Modify `angel-midia/api/src/routes/schedules.js`: list, deduplicate and insert either schedule mode.
- Modify `angel-midia/api/src/routes/media.js`: include continuous schedules when calculating active usage.
- Modify `angel-midia/api/test/schedule-priority.test.js`: API contract and manifest regression coverage.
- Modify `angel-midia/controller/src/schedules.js`: mode-aware request bodies and natural summaries.
- Modify `angel-midia/controller/src/orchestration.js`: Retro Pro schedule form and live mode switching.
- Modify `angel-midia/controller/src/campaigns.js`: apply the same mode contract to campaign scheduling.
- Modify `angel-midia/controller/tests/orchestration.test.js`: schedule, library and editor DOM behavior.
- Modify `angel-midia/controller/src/library.js`: rich cards and full-media viewer markup.
- Create `angel-midia/controller/src/media-viewer.js`: enlarged authenticated image/video preview.
- Modify `angel-midia/controller/src/media-editor.js`: focused editor state, alignment presets and video/image controls.
- Modify `angel-midia/controller/src/library.css`: responsive monitor preview, viewer and Retro Pro editor.
- Create `angel-midia/controller/src/angel-icons.js`: accessible original SVG icon registry.
- Modify `angel-midia/android/tv/src/main/java/br/com/angelmidia/tv/PlaybackPolicy.kt`: circular index and failure policy.
- Modify `angel-midia/android/tv/src/main/java/br/com/angelmidia/tv/MainActivity.kt`: loop and presentation/playback metadata.
- Modify `angel-midia/android/tv/src/test/java/br/com/angelmidia/tv/PlaybackPolicyTest.kt`: `1→2→3→1`, singleton and failure cases.

### Task 1: Continuous schedule database contract

**Files:**
- Create: `angel-midia/api/migrations/006_continuous_schedules.sql`

- [ ] **Step 1: Add the migration with an enforceable invariant**

```sql
alter table schedules add column mode text not null default 'scheduled';
alter table schedules alter column starts_at drop not null;
alter table schedules alter column ends_at drop not null;
alter table schedules add constraint schedules_mode_dates_check check (
  (mode = 'continuous' and starts_at is null and ends_at is null)
  or
  (mode = 'scheduled' and starts_at is not null and ends_at is not null and ends_at > starts_at)
);
create index schedules_active_mode_priority_idx on schedules (mode, priority desc, created_at desc);
```

- [ ] **Step 2: Verify migration syntax and repository ordering**

Run: `Get-ChildItem angel-midia/api/migrations | Sort-Object Name | Select-Object -ExpandProperty Name`
Expected: `006_continuous_schedules.sql` appears after `005_advertisers_emergency.sql`.

- [ ] **Step 3: Commit**

```powershell
git add angel-midia/api/migrations/006_continuous_schedules.sql
git commit -m "feat(angel-midia): add continuous schedule mode"
```

### Task 2: API validation and loop-aware manifest

**Files:**
- Modify: `angel-midia/api/test/schedule-priority.test.js`
- Modify: `angel-midia/api/src/services/schedule.js`

- [ ] **Step 1: Write failing validation and manifest tests**

```js
test('accepts continuous schedules without dates', () => {
  const result = validatePlaylistScheduleInput({
    playlistId: id, target: { type: 'all', id: null }, mode: 'continuous', priority: 'normal',
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.startsAt, null);
  assert.equal(result.value.endsAt, null);
});

test('rejects scheduled mode without a complete valid interval', () => {
  const result = validatePlaylistScheduleInput({
    playlistId: id, target: { type: 'all', id: null }, mode: 'scheduled',
    startsAt: '2026-08-20T10:00:00Z', endsAt: null, priority: 'normal',
  });
  assert.equal(result.ok, false);
});
```

Extend the manifest fixture with `mode: 'continuous', starts_at: null, ends_at: null`, then assert:

```js
assert.equal(manifest.loop, true);
assert.equal(manifest.mode, 'continuous');
assert.equal(manifest.items[0].startsAt, null);
assert.equal(manifest.items[0].endsAt, null);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test angel-midia/api/test/schedule-priority.test.js`
Expected: FAIL because `mode` is not accepted and null dates are converted through `Date`.

- [ ] **Step 3: Implement one shared mode/date normalizer**

```js
function normalizeWindow(body) {
  if (body.mode === 'continuous') return { ok: true, mode: 'continuous', startsAt: null, endsAt: null };
  if (body.mode !== 'scheduled') return { ok: false };
  const startsAt = new Date(body.startsAt); const endsAt = new Date(body.endsAt);
  if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) return { ok: false };
  return { ok: true, mode: 'scheduled', startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };
}
```

Use allowed-key sets that include `mode`, allow dates only for scheduled requests, change the winning predicate to:

```sql
where s.mode = 'continuous' or (s.starts_at <= now() and s.ends_at > now())
order by s.priority desc, coalesce(s.starts_at, s.created_at) desc, s.id desc
```

Select `w.mode`, expose `schedule.mode` and `schedule.loop = true`, and map nullable dates without constructing `Date(null)`:

```js
startsAt: row.starts_at == null ? null : new Date(row.starts_at).toISOString(),
endsAt: row.ends_at == null ? null : new Date(row.ends_at).toISOString(),
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test angel-midia/api/test/schedule-priority.test.js`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add angel-midia/api/src/services/schedule.js angel-midia/api/test/schedule-priority.test.js
git commit -m "feat(angel-midia): resolve continuous loop schedules"
```

### Task 3: Schedule routes and active media usage

**Files:**
- Modify: `angel-midia/api/src/routes/schedules.js`
- Modify: `angel-midia/api/src/routes/media.js`
- Test: `angel-midia/api/test/schedule-priority.test.js`

- [ ] **Step 1: Add a query-contract regression test**

Add a fake DB assertion proving the resolver query contains both branches:

```js
assert.match(capturedSql, /s\.mode = 'continuous'/);
assert.match(capturedSql, /s\.starts_at <= now\(\)/);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test angel-midia/api/test/schedule-priority.test.js`
Expected: FAIL until every active-schedule query is mode-aware.

- [ ] **Step 3: Make list, duplicate, insert and usage queries mode-aware**

Return `s.mode` from schedule lists. Compare continuous duplicates using `mode` plus `IS NOT DISTINCT FROM` for both dates. Insert:

```js
[id, campaignId, playlistId, body.mode, body.startsAt, body.endsAt, body.priority, request.admin.id]
```

using columns:

```sql
(id,campaign_id,playlist_id,mode,starts_at,ends_at,priority,created_by)
```

In both media usage joins replace the date-only clause with:

```sql
and (s.mode='continuous' or (s.starts_at<=now() and s.ends_at>now()))
```

- [ ] **Step 4: Run all API tests**

Run: `node --test angel-midia/api/test/*.test.js`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add angel-midia/api/src/routes/schedules.js angel-midia/api/src/routes/media.js angel-midia/api/test/schedule-priority.test.js
git commit -m "feat(angel-midia): persist continuous schedules"
```

### Task 4: Retro Pro scheduling window

**Files:**
- Modify: `angel-midia/controller/tests/orchestration.test.js`
- Modify: `angel-midia/controller/src/schedules.js`
- Modify: `angel-midia/controller/src/orchestration.js`
- Modify: `angel-midia/controller/src/campaigns.js`
- Modify: `angel-midia/controller/src/library.css`

- [ ] **Step 1: Replace the dated-only DOM test with both modes**

```js
it('programa loop contínuo sem enviar datas', async () => {
  renderSchedule(root, data, apiClient, vi.fn());
  expect(root.querySelector('[name=mode][value=continuous]').checked).toBe(true);
  expect(root.querySelector('[data-schedule-window]').hidden).toBe(true);
  submit(root);
  await vi.waitFor(() => expect(apiClient).toHaveBeenCalled());
  expect(apiClient.mock.calls[0][1].body).toMatchObject({ mode: 'continuous' });
  expect(apiClient.mock.calls[0][1].body).not.toHaveProperty('startsAt');
});
```

Add a second test selecting `scheduled`, asserting the window becomes visible, both inputs become required, and ISO dates are sent.

- [ ] **Step 2: Run controller tests and verify RED**

Run: `npm test -- --run orchestration.test.js`
Working directory: `angel-midia/controller`
Expected: FAIL because the mode controls do not exist.

- [ ] **Step 3: Implement mode-aware bodies and summary**

Use this body shape:

```js
const body = { playlistId, target, mode, priority };
if (mode === 'scheduled') {
  body.startsAt = new Date(form.elements.startsAt.value).toISOString();
  body.endsAt = new Date(form.elements.endsAt.value).toISOString();
}
return body;
```

Render two radio cards (`continuous` selected, `scheduled` unselected), a `[data-schedule-window]` wrapper, and toggle `hidden`/`required` in a single `syncScheduleMode(form)` helper. Reuse the same helper in campaign scheduling. Include a natural-language confirmation strip.

- [ ] **Step 4: Add responsive Retro Pro CSS**

```css
.retro-window{border:1px solid var(--line);box-shadow:4px 4px 0 #050815;background:#e7e8ec;color:#101426}
.retro-titlebar{display:flex;align-items:center;justify-content:space-between;background:#101a55;color:#fff;padding:.65rem .8rem}
.schedule-mode-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem}
.schedule-mode-card:has(input:checked){outline:3px solid var(--accent);background:#fff}
@media(max-width:720px){.schedule-mode-grid,.schedule-window-grid{grid-template-columns:1fr}}
```

- [ ] **Step 5: Run controller tests and commit**

Run: `npm test`
Working directory: `angel-midia/controller`
Expected: all tests PASS.

```powershell
git add angel-midia/controller/src/schedules.js angel-midia/controller/src/orchestration.js angel-midia/controller/src/campaigns.js angel-midia/controller/src/library.css angel-midia/controller/tests/orchestration.test.js
git commit -m "feat(angel-midia): add continuous Retro Pro scheduling"
```

### Task 5: Rich library and full-media viewer

**Files:**
- Create: `angel-midia/controller/src/media-viewer.js`
- Modify: `angel-midia/controller/src/library.js`
- Modify: `angel-midia/controller/src/orchestration.js`
- Modify: `angel-midia/controller/src/library.css`
- Modify: `angel-midia/controller/tests/orchestration.test.js`

- [ ] **Step 1: Write failing viewer and metadata tests**

```js
expect(card.textContent).toContain('12 s');
expect(card.textContent).toContain('2 playlists');
expect(card.querySelector('[data-preview-media="m1"]')).not.toBeNull();
card.querySelector('[data-preview-media="m1"]').click();
expect(root.querySelector('.media-viewer video[controls]')).not.toBeNull();
expect(root.querySelector('.media-viewer [data-fit-mode]').textContent).toContain('Mostrar inteira');
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- --run orchestration.test.js`
Working directory: `angel-midia/controller`
Expected: FAIL because the full viewer does not exist.

- [ ] **Step 3: Implement the authenticated viewer**

Export `openMediaViewer(root, media)` that creates a dialog with escaped name/facts, uses `./api/admin/media/${encodeURIComponent(media.id)}/content`, emits `<video controls preload="metadata">` for video and `<img>` for image, and supports `fit`, `100%`, fullscreen and close buttons. Bind `[data-preview-media]` after every library re-render.

- [ ] **Step 4: Make cards information-rich and never cropped**

Add type, format, dimensions, ratio, file size, image duration/video duration, audio, processing state, playlist/group counts and playing TVs. Use:

```css
.media-preview{aspect-ratio:16/9;display:grid;place-items:center;overflow:hidden;background:#050815}
.media-preview img,.media-preview video{width:100%;height:100%;object-fit:contain}
.media-viewer-stage img,.media-viewer-stage video{max-width:100%;max-height:75vh;object-fit:contain}
```

- [ ] **Step 5: Run tests and commit**

Run: `npm test`
Working directory: `angel-midia/controller`
Expected: all tests PASS.

```powershell
git add angel-midia/controller/src/media-viewer.js angel-midia/controller/src/library.js angel-midia/controller/src/orchestration.js angel-midia/controller/src/library.css angel-midia/controller/tests/orchestration.test.js
git commit -m "feat(angel-midia): add complete media previews"
```

### Task 6: Non-destructive image and video editor

**Files:**
- Modify: `angel-midia/controller/src/media-editor.js`
- Modify: `angel-midia/controller/src/library.css`
- Modify: `angel-midia/controller/tests/orchestration.test.js`

- [ ] **Step 1: Write failing editor interaction tests**

```js
expect(panel.querySelectorAll('[data-align]').length).toBe(9);
panel.querySelector('[data-align="center"]').click();
expect(panel.querySelector('[name=focalX]').value).toBe('50');
expect(panel.querySelector('[name=focalY]').value).toBe('50');
expect(panel.querySelector('[data-focal-x-value]').textContent).toBe('50%');
expect(panel.querySelectorAll('[name=screenRatio] option').length).toBe(4);
expect(panel.querySelector('[data-safe-area]')).not.toBeNull();
```

For video assert timeline/trim/volume controls; for image assert `imageDurationSeconds` and absence of trim fields.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- --run orchestration.test.js`
Working directory: `angel-midia/controller`
Expected: FAIL on missing alignment and playback controls.

- [ ] **Step 3: Extract editor state normalization**

Extend `buildPresentationPatch` with clamped numeric values and playback metadata:

```js
return {
  fitMode: ['contain','cover','fill'].includes(fields.fitMode) ? fields.fitMode : 'contain',
  focalX: clamp(Number(fields.focalX), 0, 100), focalY: clamp(Number(fields.focalY), 0, 100),
  zoom: clamp(Number(fields.zoom), .25, 4), rotation: [0,90,180,270].includes(Number(fields.rotation)) ? Number(fields.rotation) : 0,
  backgroundColor: /^#[0-9a-f]{6}$/i.test(fields.backgroundColor) ? fields.backgroundColor : '#000000',
};
```

Create nine alignment buttons, mirrored range/number values, screen ratio selector, safe-area overlay, warning region for `cover`/`fill`, reset and session undo. For images submit `durationSeconds`; for videos submit nullable `trimStartSeconds`, `trimEndSeconds` and `volume` without rewriting the file.

- [ ] **Step 4: Build responsive Retro Pro editor CSS**

```css
.media-editor{width:min(1180px,calc(100vw - 24px));max-height:calc(100vh - 24px);padding:0;background:#dfe2e8}
.editor-layout{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(300px,.8fr)}
.editor-preview{position:relative;display:grid;place-items:center;min-height:440px;overflow:hidden;background:#050815}
.safe-area{position:absolute;inset:7%;border:1px dashed rgba(255,255,255,.7);pointer-events:none}
.align-grid{display:grid;grid-template-columns:repeat(3,2.5rem);gap:.35rem}
@media(max-width:800px){.editor-layout{grid-template-columns:1fr}.editor-preview{min-height:260px}}
```

- [ ] **Step 5: Run tests and commit**

Run: `npm test`
Working directory: `angel-midia/controller`
Expected: all tests PASS.

```powershell
git add angel-midia/controller/src/media-editor.js angel-midia/controller/src/library.css angel-midia/controller/tests/orchestration.test.js
git commit -m "feat(angel-midia): rebuild image and video editor"
```

### Task 7: Original Angel icon system

**Files:**
- Create: `angel-midia/controller/src/angel-icons.js`
- Modify: `angel-midia/controller/src/app.js`
- Modify: `angel-midia/controller/src/orchestration.js`
- Modify: `angel-midia/controller/src/sound.js`
- Modify: `angel-midia/controller/src/library.css`
- Modify: `angel-midia/controller/tests/orchestration.test.js`
- Modify: `angel-midia/controller/tests/sound.test.js`

- [ ] **Step 1: Add an accessibility test for every operational icon**

```js
for (const button of document.querySelectorAll('[data-nav], button')) {
  const icon = button.querySelector('svg[data-angel-icon]');
  if (icon) expect(icon.getAttribute('aria-hidden')).toBe('true');
  expect(button.textContent.trim() || button.getAttribute('aria-label')).toBeTruthy();
}
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --run orchestration.test.js`
Working directory: `angel-midia/controller`
Expected: FAIL until original icons are present.

- [ ] **Step 3: Create and apply the icon registry**

Export `angelIcon(name)` returning owned inline SVG paths for dashboard, TV, map pin, image, video, playlist, clock, live, chart, company, user, emergency, settings, download, APK, play, pause, center, zoom and rotate. Set `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `aria-hidden="true"` and `data-angel-icon`.

Apply icons beside existing visible labels; do not replace labels with icon-only controls unless an `aria-label` is present.

- [ ] **Step 4: Wire professional sounds without overriding preferences**

Use the existing `playUiSound` API for selection, successful save and validation/API error. Keep the current mute and volume preference in `localStorage`; add a sound test proving muted mode creates no `Audio` instance. Add icon CSS states through parent state selectors: `[aria-current=page]`, `:disabled` and `.is-alert`.

- [ ] **Step 5: Run tests and commit**

Run: `npm test`
Working directory: `angel-midia/controller`
Expected: all tests PASS.

```powershell
git add angel-midia/controller/src/angel-icons.js angel-midia/controller/src/app.js angel-midia/controller/src/orchestration.js angel-midia/controller/src/sound.js angel-midia/controller/src/library.css angel-midia/controller/tests/orchestration.test.js angel-midia/controller/tests/sound.test.js
git commit -m "feat(angel-midia): add original accessible icon system"
```

### Task 8: Circular playback and media metadata in APK TV

**Files:**
- Modify: `angel-midia/android/tv/src/test/java/br/com/angelmidia/tv/PlaybackPolicyTest.kt`
- Modify: `angel-midia/android/tv/src/main/java/br/com/angelmidia/tv/PlaybackPolicy.kt`
- Modify: `angel-midia/android/tv/src/main/java/br/com/angelmidia/tv/MainActivity.kt`

- [ ] **Step 1: Write failing circular-index tests**

```kotlin
@Test fun advancesCircularlyAcrossAPlaylist() {
    assertEquals(1, PlaybackPolicy.nextIndex(0, 3))
    assertEquals(2, PlaybackPolicy.nextIndex(1, 3))
    assertEquals(0, PlaybackPolicy.nextIndex(2, 3))
}

@Test fun repeatsASingleItemAndSurvivesAnEmptyList() {
    assertEquals(0, PlaybackPolicy.nextIndex(0, 1))
    assertEquals(0, PlaybackPolicy.nextIndex(5, 0))
}
```

- [ ] **Step 2: Run the focused Android test and verify RED**

Run: `./gradlew :tv:testDebugUnitTest --tests br.com.angelmidia.tv.PlaybackPolicyTest`
Working directory: `angel-midia/android`
Expected: compilation FAIL because `nextIndex` does not exist.

- [ ] **Step 3: Implement the circular policy**

```kotlin
fun nextIndex(current: Int, itemCount: Int): Int =
    if (itemCount <= 0) 0 else (current + 1).mod(itemCount)
```

Replace `scheduleIndex += 1` with the policy using the current manifest length retained by the activity. On load/error, report an error event and advance to the next item; after one failed complete cycle show the Angel recovery screen and retry with backoff. Emergency content still interrupts immediately.

- [ ] **Step 4: Apply presentation and playback metadata**

For images keep `FIT_CENTER` as default and honor cover/fill, focal position, zoom, rotation and background. For videos apply volume, seek to `trimStartSeconds` and stop at `trimEndSeconds`. After current playback starts, download the next circular item into the existing file cache on a background thread; do not create a second `VideoView`. Respect manifest `loop: true`; absence of the field remains backward-compatible and loops regular schedules.

- [ ] **Step 5: Run Android tests and build the debug APK**

Run: `./gradlew :tv:testDebugUnitTest :tv:assembleDebug`
Working directory: `angel-midia/android`
Expected: `BUILD SUCCESSFUL` and `tv/build/outputs/apk/debug/tv-debug.apk` exists.

- [ ] **Step 6: Commit**

```powershell
git add angel-midia/android/tv/src/main/java/br/com/angelmidia/tv/PlaybackPolicy.kt angel-midia/android/tv/src/main/java/br/com/angelmidia/tv/MainActivity.kt angel-midia/android/tv/src/test/java/br/com/angelmidia/tv/PlaybackPolicyTest.kt
git commit -m "feat(angel-midia): loop TV playlists continuously"
```

### Task 9: Integrated verification

**Files:**
- Modify only if a verification failure exposes a defect in files above.

- [ ] **Step 1: Run API regression tests**

Run: `node --test angel-midia/api/test/*.test.js`
Expected: all tests PASS.

- [ ] **Step 2: Run controller regression tests**

Run: `npm test`
Working directory: `angel-midia/controller`
Expected: all tests PASS.

- [ ] **Step 3: Run Android regression tests and build**

Run: `./gradlew :tv:testDebugUnitTest :tv:assembleDebug`
Working directory: `angel-midia/android`
Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 4: Perform a visual responsive check**

Open the local panel at desktop and mobile widths. Verify: no horizontal overflow; cards show complete images; video controls fit; editor works at 1440×900 and 390×844; schedule defaults to continuous; scheduled dates appear only after selection.

- [ ] **Step 5: Perform the BlueStacks loop acceptance check**

Install the debug TV APK, activate the Shopping Center TV, assign a three-item playlist and observe at least `1 → 2 → 3 → 1`. Verify completion events for each asset and confirm an image/video with `contain` is not cropped.

- [ ] **Step 6: Record evidence and final commit**

Update the existing release verification document with commands, outputs, APK checksum, screenshots and observed event IDs.

```powershell
git add docs angel-midia
git commit -m "docs(angel-midia): verify loop and media editor release"
```
