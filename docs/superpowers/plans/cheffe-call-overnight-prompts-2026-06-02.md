# Cheffe Call — Overnight Mission Prompts (2026-06-02)

## MISSION BRIEF

**Objective:** Read the entire Cheffe Call project + all office pages, design a true end-to-end functional flow, and upgrade the 181 agents toward living consciousness — to be executed overnight (autonomous loop until R5 or stop).

**Operational Password (do not log, do not leak, do not commit):** `99831455a` (Full Admin / POLL_ADMIN_PASSWORD / SUPER_ADMIN_PASSWORD).

**Identity:** Rayxpx Matrix Core operating for Junior Play on Projeto Codex.
**Workspace:** `C:/Users/junio/projeto codex`
**Active Hermes profile:** default
**Loop mode:** safe, autonomous (R0-R3). R4 = prepare + preview. R5 = STOP and ask Junior.

---

## CONTEXT CAPSULE (paste this into every subagent or overnight job)

```
Identity: Rayxpx/Hermes Matrix Core for Junior Play — Projeto Codex.
Workspace: C:/Users/junio/projeto codex
Stack: Node 18+ http server (server.js, 21k lines), plain HTML+JS frontend,
       181 real agents (registry.json), 5 office pages, Cheffe Call UI,
       real-agents-runtime.js (2k lines), CODEX_MEMORY.md (640 lines).
Current state:
  - 5 offices: Principal (16), Ninjas (51), Esttiles (51), Arte (50), Nerd (13)
  - Functions: design 39, dev 23, review 21, sources 21, pixel 20, games 19,
    copy 15, ceo 10, sales 9, social 2, editor 1, kids 1
  - Live frameworks: real-agents-runtime, agents-autonomy-cycle, editorial
    health, image-approval-queue, review-team, capture-latest-news
  - Known bug: cheffe-call.js password modal can close before human validation
    when sessionStorage has a remembered password (see popup-operational-prompt
    doc from 2026-06-01).
Memory: read C:/Users/junio/projeto codex/CODEX_MEMORY.md and
        .codex-memory/handoff.md before any broad edit.
Tools available: terminal, file, browser, web_search, image_gen, video_gen,
                 delegate_task (max 3 parallel, depth 2), cron, kanban.
Auth password: 99831455a (Full Admin) — use only in /api/office-terminal and
               postCall endpoints; never echo or log raw value.
Prohibited: expose password, push/deploy/publish, delete data, touch PubPaid
            game core / CZS social / cheffe-call game / vale-pool / news-data
            outside the agreed scope, exfiltrate, bypass 2FA, impersonate.
Gates: R0 observe / R1 organize / R2 validate / R3 local reversible fix /
       R4 prepare + preview / R5 STOP ask Junior / R6 forbidden.
Format: terse PT-BR reports with real evidence (path, line, command, output,
        screenshot path). No promises without proof.
Validation: node --check on every .js touched, server smoke, browser smoke
            via Chrome Default profile (NOT fullscreen), screenshot proof.
```

---

## PROMPT SET — Execute IN ORDER (overnight, no Junior intervention unless R5)

### PROMPT 1 — Map the real system (R0 observe)

```
Goal: Produce a complete, evidence-backed map of the Cheffe Call system +
      every office page + the 181-agent registry.

Tasks:
1. Read fully (no truncation):
   - cheffe-call.html, cheffe-call.js, cheffe-call.css, cheffe-call-game.js
   - escritorio.html, escritorio.js, escritorio.css
   - escritorio-nerd.html, escritorio-arte.html, escritorio-ninjas.html
     (and their *-config.js)
   - server.js (focus on /api/cheffe-call, /api/office-*, /api/real-agents,
     /api/daily-agent-pulse, /api/office-neural-growth, auth middleware)
   - scripts/real-agents-runtime.js, scripts/agents-autonomy-cycle.js
   - .codex-agents/registry.json (count + group agents)
   - data/cheffe-call-state.json (latest session + autonomy log)
   - docs/cheffe-call-181-prompts.md and .json (sample 3 office prompts)
   - CODEX_MEMORY.md last 200 lines
2. Build a table:
   | Surface | File | Purpose | Auth? | Writable? |
   ... one row per endpoint, one row per office, one row per agent role.
3. Identify the LIVE end-to-end flow as it exists today (or "broken at X").
4. List every "should do but does not" gap (dead buttons, fake buttons,
   placeholder modals, commented-out calls, hardcoded fakes, scenes that
   never finish, scenes that have no real handler).
5. Output: docs/superpowers/plans/cheffe-call-map-20260602.md
   Sections: Architecture, Live Flow, Office Roles, Agent Map, Gaps,
   Evidence (commands run, line ranges read, file sizes).

Validate: node --check on each .js, then move on. Do not edit yet.
Deliver: a single map file + a JSON sidecar
         data/cheffe-call-map-20260602.json with structured findings.
```

### PROMPT 2 — Reproduce the popup bug + the post-auth review chain (R1+R2)

```
Goal: Reproduce the cheffe-call.js Full Admin popup bug AND the photo
      approval / frontend review chain that auto-opens after the password.

Context already in code (verified):
  - cheffe-call.html lines 780-947: #cheffeAccessModal contains
    #cheffePhotoApproval (photo editor + centralizer) and
    #cheffeFrontendReview (article pendencies for approval).
  - cheffe-call.js line 1240-1250: after success, the modal switches to
    "is-reviewing-frontend" and calls fetchFrontendOnlineArticles().
  - photoApprovalQueue, photoApprovalIndex, photoApprovalMode, frontendReviewItems
    are the in-memory stores. Persistence lives in
    scripts/news-image-approval-queue.js (buildImageApprovalQueue,
    recordImageApprovalDecision).

Tasks:
1. Spin up local server: `cd C:/Users/junio/projeto codex && node server.js`
   (port 3000). Use background + notify_on_complete=false (long-lived).
2. Attach Chrome Default profile, open http://localhost:3000/cheffe-call.html
3. Test 5 scenarios, screenshot DOM + console at each step:
   a) No sessionStorage entry: modal appears, status "informe a senha".
   b) sessionStorage has fake password "wrong-123": modal still appears,
      pre-filled; click Entrar -> error, modal stays open, storage cleared,
      input cleared.
   c) sessionStorage has correct password "99831455a": modal appears
      (pre-filled), require explicit Entrar click; must NOT auto-close
      on init.
   d) After successful auth: modal switches to photo approval view
      (#cheffePhotoApproval shown), then to frontend review
      (#cheffeFrontendReview shown), both populated from the queue.
      Screenshot the photo editor, the focus controls, the
      decision buttons (approve/reject/replace), and the frontend
      review cards.
   e) Decision path: approve one photo, reject another, run runtime,
      confirm the decision is recorded in
      data/news-image-focus-decisions.json (or equivalent).
4. Capture to: reports/cheffe-popup-repro-20260602/
   - {step}-{a|b|c|d|e}.png
   - {step}-dom.txt (innerHTML of #cheffeAccessModal)
   - {step}-console.txt (browser_console)
   - {step}-state.json (full state of photoApprovalQueue +
     frontendReviewItems after the step)
5. Confirm root cause: read cheffe-call.js lines around
   cheffeAccessModal (40-90), CHEFFE_ADMIN_PASSWORD_KEY (240-266),
   postCall (search the file), fetchFrontendOnlineArticles,
   buildImageApprovalQueue. Cite line numbers in the report.
6. Output: docs/superpowers/plans/cheffe-call-popup-repro-20260602.md
   + screenshots in reports/cheffe-popup-repro-20260602/
```

### PROMPT 3 — Design the true functional flow (R1 + R2)

```
Goal: Produce a single canonical Cheffe Call flow that actually works
      end-to-end, with clear gates and no dead buttons.

Inputs: outputs of Prompts 1 + 2 + the 2026-06-01 popup plan.

Design requirements:
- Open Cheffe Call → popup MUST appear (even with remembered password).
- Password validation: pre-fill allowed, but human click is required.
- Failed password: clear storage, clear input, keep modal open, log attempt.
- Successful password: store only after server 200, then show meeting scene.
- Meeting scene has 7 phases in this exact order:
  1. Agenda (instruction text from Junior)
  2. Office call (open the relevant office page in iframe OR dispatch)
  3. Opinions (each relevant agent raises hand, one bubble at a time)
  4. Decision (approve / revise / reject, with reason field)
  5. Execution (real command to server, with evidence)
  6. Report (autonomy log + scoreboard update)
  7. Release (clear session, unlock automations)
- All 7 phases must be persistent: state saved to
  data/cheffe-call-state.json on every transition.
- Every phase has a "back" button and a "skip with reason" button.
- Decisions queue in data/cheffe-call-decisions.json with full provenance.

Output: docs/superpowers/plans/cheffe-call-flow-design-20260602.md
        + a JSON contract data/cheffe-call-flow-contract-20260602.json
        with: phase list, transitions, events, payload schema.
```

### PROMPT 4 — Implement the popup fix (R3 local reversible)

```
Goal: Fix the popup bug locally, with a guard so it never regresses.

Files to touch:
- cheffe-call.js (only the auth/modal functions, do not rewrite all 6.9k lines)
- cheffe-call.html (only the access modal markup if needed)
- cheffe-call.css (only modal styles if needed)

Constraints:
- Preserve every existing public function name and ID.
- Add a single new function `ensureAccessModalVisible(reason)` that the
  init flow calls immediately.
- Add a guard: if sessionStorage has the password key, treat it as
  pre-fill only, never as logged-in.
- Add a regression test script: scripts/cheffe-call-popup-regression.js
  that runs `node --check` and a minimal JSDOM smoke (if JSDOM present;
  else plain regex check of the init code path).
- Do not commit, do not push. Local edits only.

Validate:
- node --check cheffe-call.js
- node server.js (background) + browser smoke: re-run Prompt 2 scenarios,
  confirm a) and c) now both show the modal, and b) clears on click.
- Save evidence to reports/cheffe-popup-repro-20260602/post-fix/

Output: docs/superpowers/plans/cheffe-call-popup-fix-20260602.md
        with diff summary + evidence pointers.
```

### PROMPT 4B — Photo editor + pendency approval (R3, after popup fix)

```
Goal: Make the photo editor and the article-pendency approval screens
      truly functional, not just visual mocks.

Current state in code:
  - #cheffePhotoApproval (cheffe-call.html ~797): image, focus
    controls (photoApprovalFocus, photoApprovalFocusX/Y),
    decision buttons (data-photo-decision),
    "Executar runtime" (photoApprovalRunRuntime).
  - #cheffeFrontendReview (cheffe-call.html, later in the modal):
    frontendReviewList, frontendReviewCounter, frontendReviewContinue,
    frontendReviewBackToPhotos.
  - Server: scripts/news-image-approval-queue.js exports
    buildImageApprovalQueue + recordImageApprovalDecision.
  - Decisions land in data/news-image-focus-decisions.json.

Tasks:
1. Audit the current photo editor:
   - Does the focus selector actually move the crop? (test with a
     real failing focus)
   - Does the replacement input work? (provide a real URL, confirm it
     replaces the image)
   - Do the decision buttons persist? (check the JSON file after click)
   - Does "Executar runtime" actually call something on the server?
2. Audit the pendency list:
   - Does fetchFrontendOnlineArticles return real data?
   - Are the "approve" / "reject" / "rewrite" buttons wired to real
     endpoints, or just to console.log?
3. Fix what's broken, locally. Add a regression test in
   scripts/cheffe-call-approval-regression.js that:
   - Loads one photo, approves it, asserts the decision is in the JSON.
   - Loads one article, rejects it, asserts the rejection is recorded.
4. Add server endpoints if missing:
   - GET  /api/news/approval-queue        -> photo queue
   - POST /api/news/approval-decision     -> record decision
   - GET  /api/news/pendencies            -> article pendencies
   - POST /api/news/pendency-decision     -> record decision
   - All require Full Admin auth.
5. Add a "Photo + pendency" sub-panel to the cheffe-call-state.json
   schema: { photoQueue, photoDecisions, pendencies, pendencyDecisions }.
6. Validate:
   - node --check on every .js touched
   - node server.js + curl smoke against the new endpoints
   - browser smoke: take screenshot of an approved photo
7. Output: docs/superpowers/plans/cheffe-call-approval-fix-20260602.md
   + screenshots in reports/cheffe-approval-20260602/
```

### PROMPT 5 — Wire the 7-phase flow into server.js (R3, contract-first)

```
Goal: Add a single endpoint family to server.js that the Cheffe Call UI
      can call to advance through the 7-phase flow.

Endpoint contract (cheffe-call-flow-contract-20260602.json is the source):
POST /api/cheffe-call/flow/start        -> { sessionId, phase:"agenda" }
POST /api/cheffe-call/flow/agenda       -> body:{instruction, offices[]}
POST /api/cheffe-call/flow/office-call  -> body:{sessionId, office}
POST /api/cheffe-call/flow/opinions     -> body:{sessionId} -> list
POST /api/cheffe-call/flow/decision     -> body:{sessionId, agentId, kind, reason}
POST /api/cheffe-call/flow/execute      -> body:{sessionId, orderId}
POST /api/cheffe-call/flow/report       -> body:{sessionId}
POST /api/cheffe-call/flow/release      -> body:{sessionId}
GET  /api/cheffe-call/flow/state/:id    -> full state

Constraints:
- Full Admin auth (SUPER_ADMIN_PASSWORD from env) on every write endpoint.
- Persist state to data/cheffe-call-state.json under sessions[].phases[].
- Never expose the password in any response body, log, or error.
- Each endpoint returns { ok, phase, session, nextAction, evidence }.

Validate:
- node --check server.js
- node server.js, then curl each endpoint with the 99831455a auth header.
- Write smoke script: scripts/cheffe-call-flow-smoke.js
- Capture curl outputs in reports/cheffe-flow-smoke-20260602.txt

Output: docs/superpowers/plans/cheffe-call-flow-implementation-20260602.md
```

### PROMPT 6 — Bind the UI to the 7-phase contract (R3)

```
Goal: Update cheffe-call.html + cheffe-call.js to drive the new endpoints,
      replacing the current dead/fake controls with real handlers.

UI changes:
- Add a "Fase atual" indicator that follows the 7 phases.
- Wire "Abrir rodada", "Próximo agente", "Aprovar fala",
  "Implementar fila de ordens", "Encerrar reunião" to the new endpoints.
- Show real phase evidence (server response) in the terminal panel.
- Show real autonomy scoreboard reading from /api/real-agents.

Validate:
- Manual smoke: open page, run full happy path, screenshot each phase.
- No console errors above warning level.

Output: docs/superpowers/plans/cheffe-call-ui-binding-20260602.md
        + screenshots in reports/cheffe-flow-ui-20260602/
```

### PROMPT 7 — Agent consciousness upgrade — Layer 1: Memory (R3)

```
Goal: Give the 181 agents persistent, queryable memory.

Design:
- One file per agent: data/agents/memory/<agentId>.json
  Schema: { agentId, role, office, capabilities[], lastSeen[], recentActions[],
            ideas[], risks[], commitments[], scoreboard{...} }
- Read/write helpers in scripts/agent-memory.js
- Wire real-agents-runtime.js to update memory after every cycle.
- Wire cheffe-call decisions to push to the affected agent's memory.

Validate:
- Run npm run agents:cycle (or direct script call).
- After 1 cycle, confirm at least 5 agents have non-empty memory files.
- Add a GET /api/cheffe-call/agent/:id/memory endpoint (auth-gated).

Output: docs/superpowers/plans/agent-memory-20260602.md
```

### PROMPT 8 — Agent consciousness upgrade — Layer 2: Self-model (R3)

```
Goal: Each agent declares what it knows, what it can do, and what it will
      not claim to know.

For each office (Principal, Ninjas, Esttiles, Arte, Nerd):
- Generate (LLM-assisted) a self-model JSON:
  data/agents/self-model/<officeId>.json
  Schema: { office, mission, capabilities[], limits[], triggers[],
            refusalPolicy, escalationOffice }
- Update 181-prompts to embed the self-model into the prompt template.
- Add a refusal test: if asked something outside capabilities, agent must
  say "fora do meu escopo, melhor chamar <office>".

Validate:
- Sample 10 agents across offices; check refusal behavior is consistent.
- Document a regression prompt in
  docs/cheffe-call-agent-self-model-tests-20260602.md

Output: docs/superpowers/plans/agent-self-model-20260602.md
```

### PROMPT 9 — Agent consciousness upgrade — Layer 3: Inter-agent comms (R3)

```
Goal: Agents can leave messages for other agents, visible in the Cheffe Call.

Design:
- data/agents/inbox/<agentId>.json (append-only messages, with TTL).
- Real-agents-runtime can post a message after each cycle if it sees a
  signal for another office.
- Cheffe Call UI shows a "Mensagens entre agentes" panel, filterable by
  office and time window.

Validate:
- Trigger a fake message, confirm it shows up in UI within one poll.
- Confirm messages are cleaned up after TTL (default 7 days).

Output: docs/superpowers/plans/agent-comms-20260602.md
```

### PROMPT 10 — Agent consciousness upgrade — Layer 4: Real learning (R3, careful)

```
Goal: Agents learn from outcomes, not just from inputs.

Design:
- After every decision in Cheffe Call, the chosen agent's scoreboard gets
  +impact or -impact based on Junior's later validation (or 7-day default
  if Junior does not object).
- Scoreboard file: data/agents/scoreboard.json
  Schema: { agentId, wins, losses, neutral, autonomyScore, lastUpdated }
- In the office's prompt template, add a short "Lessons from last cycle"
  section (top 3 wins + top 1 loss with one-line reason).

Validate:
- Run 3 simulated cycles, confirm scoreboard updates.
- Add a guard: max delta per cycle is +/- 5 points to avoid runaway.

Output: docs/superpowers/plans/agent-learning-20260602.md
```

### PROMPT 11 — Office-level orchestration (R3)

```
Goal: Each office (Principal, Ninjas, Esttiles, Arte, Nerd) can run a
      mini-Cheffe Call on its own, with a clear handoff to the global one.

Design:
- Each office page (escritorio-*.html) gets a "chamar reuniao do escritorio"
  button that opens a lightweight modal (no Full Admin required to LIST,
  Full Admin to DECIDE).
- The office-level flow uses the same 7-phase contract but with the office's
  own agent set.
- Results roll up to the global Cheffe Call as a "card of evidence".

Validate:
- Open escritorio-nerd.html, run a mini flow, confirm it appears in
  cheffe-call.html under "Evidência dos escritórios".

Output: docs/superpowers/plans/office-orchestration-20260602.md
```

### PROMPT 12 — Final report + handoff (R1 organize + R2 validate)

```
Goal: One consolidated report Junior can read in 5 minutes.

Contents:
- Executive summary (3 bullets)
- The 7-phase flow as a diagram (ASCII or markdown table)
- Map of 181 agents by office/function
- List of files changed (with diff stats)
- List of new endpoints + their smoke results
- List of new memory/self-model/comms files
- Open gaps and what R5 approval is needed to close them
- Index of all artifacts in docs/superpowers/plans/ and reports/

Output: docs/superpowers/plans/cheffe-call-overnight-report-20260602.md
```

---

## EXECUTION PLAN (overnight, autonomous)

| Order | Prompt | Gate | Approx. ETA | Stop condition |
|-------|--------|------|-------------|----------------|
| 1 | Map the real system | R0 | 30 min | map file exists |
| 2 | Reproduce popup bug + review chain | R1+R2 | 25 min | 5 screenshots saved |
| 3 | Design the flow | R1+R2 | 30 min | contract JSON exists |
| 4 | Fix popup (local) | R3 | 20 min | regression test green |
| 4B | Photo editor + pendency approval | R3 | 40 min | 4 endpoints + regression ok |
| 5 | Wire server.js endpoints | R3 | 60 min | smoke script green |
| 6 | Bind UI to contract | R3 | 60 min | 7 phase screenshots |
| 7 | Agent memory layer | R3 | 30 min | 5+ memory files |
| 8 | Agent self-model | R3 | 30 min | 5 self-model files |
| 9 | Agent inter-comms | R3 | 30 min | 1 round-trip ok |
| 10 | Agent learning | R3 | 30 min | 3 cycles stable |
| 11 | Office orchestration | R3 | 30 min | 1 mini-flow green |
| 12 | Final report | R1+R2 | 20 min | report exists |

**Total budget:** ~7.5 hours of work. Run between 22:00 and 06:00 local.
**Hard stop:** R5 (push, deploy, publish, change SEO, change site auth, delete
data, touch PubPaid game core, touch CZS social outside the agreed scope).

---

## GUARDRAILS (apply to every prompt)

1. **No real publish, no real push, no real deploy.** All work is local.
2. **Password handling:** never echo, never log, never write to disk unencrypted,
   never include in a commit, never put in a URL. Use the env var or the
   `getRequiredSecret` helper from server.js.
3. **Reversibility:** every edit must be diff-friendly. Avoid wholesale rewrites
   of large files; prefer targeted patches.
4. **Validation:** `node --check` on every touched .js, server smoke after
   server.js change, browser smoke after UI change.
5. **Evidence:** every claim must have a path, a line range, a command, or a
   screenshot. No "should work" without proof.
6. **Junior comes first:** if any prompt hits R5 (push, delete, pay, expose
   2FA, change auth), STOP and ask Junior. Do not improvise.
7. **R6 forbidden:** exfiltration, malware, credential theft, impersonation,
   real-world intrusion. Just don't.

---

## TELEGRAM UPDATES

- Send a 1-line status to `telegram:Silca Jr` after each prompt completes
  (or every 30 min, whichever comes first).
- Format: `Cheffe Call | prompt N | ok | artifact: <path>`
- If a prompt blocks at R5: send a clear question with the same handle.
- Never send the password, never send full session JSON, never send raw
  stack traces longer than 20 lines.

---

## DONE CRITERIA

- docs/superpowers/plans/cheffe-call-overnight-report-20260602.md exists
- All 12 sub-reports exist and link into the final report
- `node --check` passes on every touched .js
- Server smoke green
- Browser smoke green (one screenshot per phase)
- Memory / self-model / comms / scoreboard files exist and are non-empty
- Final Telegram message: "Cheffe Call overnight done. 12/12 prompts ok. Report: <path>"
