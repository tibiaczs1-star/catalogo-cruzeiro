# Handoff

Updated: 2026-05-11T19:21:50.655Z

Hotfix de abertura aplicado no worktree C:\Users\junio\catalogo-intro-hotfix-20260511-1342, branch codex/fix-home-intro-speed-20260511-1342. Mantem as intros, reduz gates/failsafes, libera home cedo, fatia hidratacao de noticias, adia scripts auxiliares via deferred-home-boot.js, nao carrega news-data.js cedo em HTTP quando a API demora e empurra warm cache para depois. Local QA: desktop maxLongTask ~630-731ms, mobile 654ms, loaders ocultos, body sem catalogo-lock-scroll, review:team totalIssues=0, perf:budget ok.

## Next

- Stage index.html
- CODEX_MEMORY.md
- .codex-memory/current-state.md
- .codex-memory/handoff.md se alterados
- commit complementar
- push origin/main
- validar online

## Files In Focus

- index.html
- CODEX_MEMORY.md
- .codex-memory/current-state.md
- .codex-memory/handoff.md

## Related Orders

- 2026-05-11-destravar-intros-e-otimizar-a-abertura-da-home-sem-remover-o-show-visual-de-carr
