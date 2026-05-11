# Handoff

Updated: 2026-05-11T19:15:27.395Z

Hotfix de abertura da home aplicado no worktree C:\Users\junio\catalogo-intro-hotfix-20260511-1342, branch codex/fix-home-intro-speed-20260511-1342. Mantem as intros, mas reduz gates/failsafes, libera a home cedo, fatia hidratacao de noticias, adia scripts auxiliares via deferred-home-boot.js e empurra warm cache para depois. Local QA: desktop maxLongTask 731ms, mobile 654ms, loaders ocultos, body sem catalogo-lock-scroll, review:team totalIssues=0, perf:budget ok.

## Next

- Stage apenas index.html
- script.js
- startup-experience.js
- startup-experience.css
- deferred-home-boot.js e memoria essencial; ignorar data runtime noise e .codex-temp-server.pid
- commit
- push origin/main
- validar site online

## Files In Focus

- index.html
- script.js
- startup-experience.js
- startup-experience.css
- deferred-home-boot.js
- .codex-memory/orders.json
- .codex-memory/assets.json
- .codex-memory/current-state.md
- .codex-memory/handoff.md
- CODEX_MEMORY.md

## Related Orders

- 2026-05-11-destravar-intros-e-otimizar-a-abertura-da-home-sem-remover-o-show-visual-de-carr
