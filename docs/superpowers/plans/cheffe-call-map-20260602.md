# Cheffe Call Map — 2026-06-02 (Prompt 1)

## Architecture

Projeto Codex, workspace `C:/Users/junio/projeto codex`.

| File | Lines | Role |
|---|---:|---|
| cheffe-call.html | 947 | UI principal: sala de reunião, popup de acesso Full Admin, photo editor, frontend review, mesa de decisão, comando real, prompt center, 7 cenas, painel admin |
| cheffe-call.js | 6944 | Runtime UI: 60+ selectors, 7-phase scene engine, photo approval queue, frontend review, decision desk, direct command, prompt preview, autonomy hooks |
| cheffe-call.css | 9878 | Visual: teatro bitmap, hologramas, lasers, plateia 181 avatares, palco sul, 5 zonas mapeadas, modais |
| cheffe-call-game.js | 131 | Canvas overlay: partículas, light shafts, datacenter wave, stage pulse |
| escritorio.html | 603 | Hub dos escritórios: lista de agentes, navegação entre escritórios |
| escritorio.js | 2948 | Runtime dos escritórios: 7 rooms (ceo/news/subpages/design/review/cafe/dev), obstacles, agents com skills+lines, animações |
| escritorio.css | 4934 | Visual escritório: grid 1200x680, 7 rooms, mobile responsive |
| escritorio-nerd.html | 510 | Game dev em pixel art, integrado com PubPaid |
| escritorio-arte.html | 412 | Pixel art / sprites, integrado com PubPaid |
| escritorio-ninjas.html | 69 | Stub: "Serviço indisponível", retirado da navegação pública |
| server.js | 21851 | HTTP server: 77 rotas /api/*, auth (SUPER_ADMIN/POLL_ADMIN), Google OAuth, PubPaid, news, cheffe-call, office-*, real-agents, daily-pulse, neural-growth |
| scripts/real-agents-runtime.js | 2118 | Loop dos 181 agentes, ROLE_PROFILES, MAILZA_PRIORITY_ROUTINE, EDITORIAL_BODY_ROUTINE, registry integration |
| scripts/agents-autonomy-cycle.js | 526 | Ciclo autônomo, scoreboard, decisions log |
| docs/cheffe-call-181-prompts.md | 5224 | Prompt supremo + 5 prompts de escritório + 175 prompts por agente |
| docs/cheffe-call-181-prompts.json | 1657 | Versão estruturada: globalPrompt + offices[] + agents[] |
| .codex-agents/registry.json | n/a | Registry: 181 agentes, 5 escritórios, generatedAt 2026-06-01T22:25:16.210Z |

## Live end-to-end flow (as it exists)

1. `GET /` (server.js:535) serve index.html, navigation tem link `/cheffe-call.html`.
2. `GET /cheffe-call.html` (server.js:535) serve a sala.
3. `cheffe-call.js` init (linha 240-266) lê `sessionStorage["cheffeCallFullAdminPassword"]` — **se houver, modal some sem validação humana (bug confirmado, ver prompt 2)**.
4. Sem senha: `cheffeAccessModal` aparece, usuário digita, clica Entrar, valida server-side, só então estado "logged".
5. Pós-login: modal muda pra `is-reviewing-photos` (photo editor), depois `is-reviewing-frontend` (pendências de matéria).
6. Cena 1 "Pop-up de pendências" (chefeSceneTimeline) renderiza, avançando 7 cenas.
7. Fila de opiniões: cada agente fala um por vez (activeSpeechBubble, raisedHandList).
8. Mesa de decisão: aceitar/revisar/implementar opinião vira ordem.
9. Comando real: `directOrderText` + `directOrderUrl` + `directOrderMode` (research/rewrite/run/validate).
10. Runtime: `POST /api/cheffe-call/action` (server.js:11205) executa autonomamente, com log em `data/cheffe-call-autonomy-log.json` e `data/cheffe-call-ide-actions.json`.
11. State persistido em `data/cheffe-call-state.json` (12 sessions, 3 logs, 1 decision na última).
12. Real-agents-runtime roda fora: `scripts/real-agents-runtime.js` lê registry, executa ROLE_PROFILES, atualiza scoreboard.

## Office roles

| Office | Agents | Page | Runtime | Notes |
|---|---:|---|---|---|
| Escritorio Principal | 16 | (only via cheffe-call scene) | sim, room "ceo"/"news"/"review" em escritorio.js | Codex CEO, Editora Ari, Revisor Bento |
| Escritorio de Ninjas | 51 | (stub, 69 linhas) | NÃO público, mas registry tem 51 | "Serviço indisponível" |
| Escritorio de Arte | 50 | escritorio-arte.html | sim, registry tem 50 | Pixel art, sprites, kits visuais |
| Esttiles | 51 | (sem page dedicada, só registry) | sim, registry tem 51 | Moda, lifestyle, marketplace |
| Escritorio Nerd | 13 | escritorio-nerd.html | sim, room "dev" | PubPaid game dev, física, HUD, som |

## Agent map (registry.json)

| Role | Count | Where |
|---|---:|---|
| design | 39 | Arte + Esttiles + Ninjas + Principal |
| dev | 23 | Nerd + Ninjas + Principal + Esttiles |
| review | 21 | Principal + Ninjas + Esttiles + Arte |
| sources | 21 | Ninjas + Esttiles + Principal + Arte |
| pixel | 20 | Arte + Ninjas + Principal + Esttiles |
| games | 19 | Nerd + Principal + Ninjas + Esttiles + Arte |
| copy | 15 | Esttiles + Principal + Ninjas + Arte |
| ceo | 10 | Principal + Ninjas + Esttiles + Arte |
| sales | 9 | Esttiles + Principal + Ninjas + Arte |
| social | 2 | Principal + Arte |
| editor | 1 | Principal |
| kids | 1 | Principal |

**Total: 181** (bate com registry).

## Endpoints mapped (server.js)

77 rotas `/api/*` (ver `/tmp/api_endpoints.txt` para lista completa).

Principais para o escopo Cheffe Call:
- `POST /api/cheffe-call/action` (server.js:11205) — autonomous execution
- arquivos: `CHEFFE_CALL_STATE_FILE`, `CHEFFE_CALL_AUTONOMY_LOG_FILE`, `CHEFFE_CALL_IDE_ACTIONS_FILE` (138-146)
- news image approval: `data/news-image-focus-decisions.json`
- real-agents: `/api/real`, `/api/daily`, `/api/office/*`, `/api/sprites`, `/api/news/integrity`, `/api/news/refresh`, `/api/news/aggregator`

Auth: `SUPER_ADMIN_PASSWORD` (default fallback 99831455a, l. 88), `POLL_ADMIN_PASSWORD` (l. 89), `getRequiredSecret` helper (l. 75-85) com fallback em dev, bloqueio em prod.

## Gaps (should do but doesn't)

1. **Popup auto-close com senha lembrada**: `cheffe-call.js` 240-266 inicializa `cheffeAdminPassword` direto do sessionStorage, sem gate humano. Plano 2026-06-01 já documentou.
2. **Photo editor centralizer**: `cheffePhotoApproval` (cheffe-call.html ~797) tem markup rico, mas `photoApprovalRunRuntime` pode estar chamando só UI, não `/api/news/approval-decision`. **Confirmar no prompt 2.**
3. **Frontend review pendencies**: `fetchFrontendOnlineArticles` — confirmar se persiste decisão no JSON.
4. **Oficina de Ninjas fora do ar**: `escritorio-ninjas.html` é stub "Serviço indisponível". 51 agentes registrados, sem page pública.
5. **Esttiles sem page dedicada**: 51 agentes, 0 pages. Só aparece no cheffe-call.
6. **Office-level Cheffe Call**: 5 escritórios, mas só 2 têm page (`arte`, `nerd`). Nenhum tem mini-Cheffe-Call própria.
7. **Agent memory file**: `data/agents/memory/*.json` não existe; agentes não têm memória persistente. Prompt 7 vai criar.
8. **Self-model por office**: registry tem role, mas não tem self-model JSON com `limits/refusalPolicy`. Prompt 8 vai criar.
9. **Inbox inter-agentes**: `data/agents/inbox/*.json` não existe. Prompt 9 vai criar.
10. **Scoreboard com guardrail**: `data/agents/scoreboard.json` não existe. Prompt 10 vai criar.
11. **Estado.sessions[].phases[]**: o state.json guarda sessions com logs/decisions, mas NÃO guarda a fase atual do fluxo 7-phase. Prompt 5 vai adicionar.
12. **`/api/cheffe-call/flow/*` (8 endpoints novos)**: não existem. Prompt 5 vai criar.
13. **`/api/news/approval-queue`, `/api/news/approval-decision`, `/api/news/pendencies`, `/api/news/pendency-decision`**: não existem (confirmar no prompt 2 step 4B). Prompt 4B vai criar.

## Evidence (commands + line ranges)

```
$ wc -l cheffe-call.{html,js,css,game.js} ...
947 cheffe-call.html
6944 cheffe-call.js
9878 cheffe-call.css
131 cheffe-call-game.js
... [omitido, todos acima]
58752 total

$ node --check cheffe-call.js && node --check server.js && node --check scripts/real-agents-runtime.js
SYNTAX_OK

$ python registry reader
totalAgents: 181
roles: design 39, dev 23, review 21, sources 21, pixel 20, games 19, copy 15, ceo 10, sales 9, social 2, editor 1, kids 1

$ grep '/api/' server.js | sort -u | wc -l
77

$ python state reader
active: False
sessions: 12
last_session_logs: 3
last_session_decisions: 1
last_instruction: "Validar correcao do gate humano completo da Cena 1."

cheffe-call.js line ranges read:
- 1-90 (selectors + constants)
- 207-294 (state vars + storage helpers)
- 240-266 (password persistence — BUG SITE)
- 1194-1250 (post-auth review chain — verify in prompt 2)

server.js line ranges read:
- 75-95 (secret/identity)
- 138-148 (cheffe-call file refs)
- 535-545 (cheffe-call.html route)
- 9120-9220 (cheffe-call in fileBrief/registry)
- 10479-10500 (photo focus decision handler)
- 11200-11250 (autonomous execution)
```

## Open questions for prompt 2

- O modal de fato some ao carregar com sessionStorage? (repro scenario c)
- `photoApprovalRunRuntime` chama `/api/news/approval-decision` ou só UI?
- `fetchFrontendOnlineArticles` retorna dados reais?
- `data/news-image-focus-decisions.json` existe? (vai ser criado pelo approval-queue se não existir)
