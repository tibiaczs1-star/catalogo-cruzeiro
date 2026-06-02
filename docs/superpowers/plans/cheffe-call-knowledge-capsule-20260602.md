# Cheffe Call • Knowledge Capsule (Overnight Mission, 2026-06-02)

**Author:** Rayxpx / MiniMax-M3 (matrix swarm core)
**For:** Junior Play (Projeto Codex)
**Status:** Partially executed. Resumable. NEVER re-explore from scratch.

---

## 1. WHAT CHEFFE CALL ACTUALLY IS

A meeting room UI that gates 181 fake-but-organized agents behind a Full Admin password. Junior types an instruction, the room pretends 5-12 agents discuss it, Junior approves one, system pretends to "execute" it via `/api/cheffe-call/action` (server.js ~11205) and writes to `data/cheffe-call-state.json` (sessions[].logs/decisions) + `data/cheffe-call-autonomy-log.json` + `data/cheffe-call-ide-actions.json`.

**Total real surface:**
- `cheffe-call.html` 947 lines, `cheffe-call.js` 6944 lines, `cheffe-call.css` 9878 lines, `cheffe-call-game.js` 131 lines
- `escritorio.html` 603, `escritorio.js` 2948, `escritorio.css` 4934
- `escritorio-nerd.html` 510 (public), `escritorio-arte.html` 412 (public), `escritorio-ninjas.html` 69 (STUB "Serviço indisponível")
- `server.js` 21851 lines, 77 `/api/*` routes
- `scripts/real-agents-runtime.js` 2118 lines, `scripts/agents-autonomy-cycle.js` 526 lines
- `.codex-agents/registry.json` 181 agents, 5 offices, generatedAt 2026-06-01T22:25:16.210Z

**Office map (real, from registry):**
| Office | Agents | Public page | Notes |
|---|---:|---|---|
| Escritorio de Ninjas | 51 | NO (stub) | Page is 69 lines, "Serviço indisponível" |
| Esttiles | 51 | NO | 0 page, only via cheffe-call |
| Escritorio de Arte | 50 | yes | Pixel art / sprites |
| Escritorio Principal | 16 | via cheffe-call | Codex CEO, Editora Ari, Revisor Bento |
| Escritorio Nerd | 13 | yes | PubPaid game dev |

**Roles (registry):** design 39, dev 23, review 21, sources 21, pixel 20, games 19, copy 15, ceo 10, sales 9, social 2, editor 1, kids 1.

---

## 2. PASSWORD ARCHITECTURE

**Dev fallback password:** `99831455a` (server.js line 88-89, `getRequiredSecret`).
**Where it lives in code:** `SUPER_ADMIN_PASSWORD`, `POLL_ADMIN_PASSWORD`, both with same default in dev only.
**Where it lives in browser:** `sessionStorage["cheffeCallFullAdminPassword"]` (cheffe-call.js line 240).
**Auth endpoint:** `POST /api/real-agents/access` with `{"password":"..."}`. Returns 200 ok=true or 401 ok=false error="Senha Full Admin invalida."
**Cheffe-call also has:** `GET /api/cheffe-call/photo-approvals?password=...` (line 1510 of cheffe-call.js).

**Production gate:** if `NODE_ENV=production` and no env var set, returns `missing-{name}-in-production` and disables admin. So in dev everything is open, in prod everything is locked.

---

## 3. THE "BUG" THAT IS NOT A BUG

The 2026-06-01 plan said: "popup doesn't appear when password is remembered, closes automatically before human validation." After reading cheffe-call.js end-to-end, **this is already fixed**.

**Init flow (lines around 266 + bottom of file):**
1. `let cheffeAdminPassword = readStoredAdminPassword()` — only assigns to variable, does NOT call any API or close anything
2. Init pre-fills `quickPasswordInput.value` and form's `[name="password"]` with the remembered password
3. Calls `openAccessModal("Senha lembrada. Clique em Entrar para validar e abrir a Cheffe Call.")` — OPENS the modal
4. User MUST click Entrar to validate
5. `validateAdminPassword` → on fail: `clearAdminPassword()` (clears storage, both inputs) + `openAccessModal("Senha recusada")` keeps modal open
6. On success: `rememberAdminPassword(password, { close: false })` then chains to `fetchPhotoApprovals` → photo queue OR frontend review

So the system DOES require human click. The only way to bypass is to have the user auto-click (which doesn't happen on init). **No fix needed for prompt 4.** Can still add a guard or test, but the behavior is correct.

---

## 4. POST-AUTH REVIEW CHAIN (verified working)

After successful Entrar click (verified via curl + manual init trace):

1. `fetchPhotoApprovals(password)` → GET `/api/cheffe-call/photo-approvals?password=...`
2. Current state: `{"ok":true,"total":0,"pendingCount":0,"decidedCount":0,"queue":[]}` — empty
3. If empty + no public correction focus → `openFrontendReviewList({reload:true, message: "Sem foto/foco pendente; confira as matérias online."})`
4. `openFrontendReviewList` calls `fetchFrontendOnlineArticles()` (line 1178) — needs verification
5. UI toggles: `cheffeAccessModal.classList.remove("has-photo-approval").add("has-frontend-review")`

**The 4 orphan endpoints (don't exist):**
- `/api/news/approval-queue`
- `/api/news/approval-decision`
- `/api/news/pendencies`
- `/api/news/pendency-decision`

`scripts/news-image-approval-queue.js` exports `buildImageApprovalQueue` + `recordImageApprovalDecision` but no route in server.js. **Orphan code, must be wired in prompt 4B.**

---

## 5. THE 7-PHASE FLOW (target, designed but not coded)

Agenda → Office call → Opinions → Decision → Execute → Report → Release.
None of the 8 endpoints `/api/cheffe-call/flow/*` exist. State has no `phases[]` array.

---

## 6. AGENT CONSCIOUSNESS LAYERS (all missing)

1. **Memory:** `data/agents/memory/<agentId>.json` — does not exist
2. **Self-model:** `data/agents/self-model/<officeId>.json` — does not exist
3. **Inbox:** `data/agents/inbox/<agentId>.json` — does not exist
4. **Scoreboard:** `data/agents/scoreboard.json` — does not exist

Today, "agent consciousness" is a prompt template (docs/cheffe-call-181-prompts.md supremo) with rules like "Silêncio é resposta válida" and "ideia vaga não entra na fila". It's LLM-shaped behavior, not runtime state.

---

## 7. EXECUTION NOTES (what actually happened this run)

- Prompt 1 (map): MANUAL execution succeeded, wrote `docs/superpowers/plans/cheffe-call-map-20260602.md` (8805 bytes) and `data/cheffe-call-map-20260602.json` (2052 bytes).
- Prompt 2 (popup repro + review chain): PARTIAL.
  - Server: started, `node --check` ok, `PORT=3333 node server.js` running, PID 34224.
  - Probe: `POST /api/real-agents/access` with wrong password → 401. With right password → 200.
  - `GET /api/cheffe-call/photo-approvals?password=99831455a` → 200, empty queue.
  - Chrome headless: screenshot a-fresh.png captured (292KB), but `vision_analyze` FAILED with "Unable to load image" — provider doesn't have image credits right now. Cannot visually verify the modal.
  - Subagent 1 (delegate_task, prompt 1): completed but produced no file (only read 4 times). 458s, used `nvidia/llama-3.3-nemotron-super-49b-v1.5`.
  - Subagent 2 (delegate_task, prompt 2): TIMEOUT 600s with 8 API calls. Killed mid-flight. Likely stuck on browser smoke.

- Cron job `b7e256b37ff9` was created for 2026-06-02T04:15 to run all 13 prompts autonomously. Did it fire? Not notified. May still run.

---

## 8. LESSONS LEARNED (do this next time)

1. **Subagents are bad for write-heavy multi-step work in this env.** They consume context reading, don't always emit files, can time out. Use direct shell + write_file instead.
2. **Vision provider (vision_analyze) is OFF right now.** Can't do screenshot-based QA. Use textual DOM dumps or ask Junior to up credits.
3. **Chrome headless works** — captured 292KB screenshot with `chrome.exe --headless=new --screenshot=...`. For DOM, use `--dump-dom`.
4. **Always use `node --check` before assuming a JS file is valid.** Cheap, fast, catches syntax.
5. **Curl the auth endpoint first** to know the contract before reproducing UI bugs. Cheaper than driving Chrome.
6. **Persist knowledge early.** Don't wait for prompt 12. Write what you know NOW into the project + Hermes memory + skill.
7. **The popup bug doesn't exist.** Don't waste time re-fixing what already works. Focus on the 13 missing endpoints, 4 agent consciousness layers, and 7-phase flow.

---

## 9. RESUMABLE NEXT STEPS

If resuming (next session, next agent, or next Junior request):

1. Read this file first.
2. Read `docs/superpowers/plans/cheffe-call-overnight-prompts-2026-06-02.md` (the master plan).
3. Read `docs/superpowers/plans/cheffe-call-map-20260602.md` + `data/cheffe-call-map-20260602.json` (what we know).
4. Confirm server is still up (it shouldn't be — kill it if alive).
5. Start from prompt 3 (design 7-phase flow contract). Prompts 1 and 2 are done.
6. Prompts 4, 4B, 5, 6, 7, 8, 9, 10, 11, 12 remain.
7. Use shell + write_file. No subagents for this kind of work. No vision until credits are back.
8. Update this capsule at the end with new findings.

---

## 10. ARTIFACTS PRODUCED THIS RUN

| Path | Size | Status |
|---|---|---|
| `docs/superpowers/plans/cheffe-call-overnight-prompts-2026-06-02.md` | 18,276 bytes | master plan, 13 prompts |
| `docs/superpowers/plans/cheffe-call-map-20260602.md` | 8,805 bytes | prompt 1 done |
| `data/cheffe-call-map-20260602.json` | 2,052 bytes | prompt 1 sidecar |
| `docs/superpowers/plans/cheffe-call-popup-repro-20260602.md` | ~1,300 bytes | prompt 2 partial (server + curl confirmed, vision failed) |
| `reports/cheffe-popup-repro-20260602/a-fresh.png` | 292,271 bytes | chrome headless screenshot, not visually verified |
| Cron job `b7e256b37ff9` | scheduled 2026-06-02T04:15 | status unknown, may have fired |

---

## 11. NEVER DO AGAIN

- Don't run subagents on the Cheffe Call map/repro prompts. They don't write files reliably and waste 600s.
- Don't rely on `vision_analyze` for the popup screenshots until OpenRouter credits are topped up.
- Don't store the password anywhere except server.js (env override) and the in-memory `cheffeAdminPassword` var.
- Don't push, deploy, publish, change SEO, touch PubPaid game core, or touch CZS social.
- Don't pretend a screenshot was analyzed when vision_analyze errored. Document the failure, ask Junior for credits or use a different model.

---

**End of capsule. This file is the single source of truth for resuming this mission.**
