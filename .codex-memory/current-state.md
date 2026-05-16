# Current State

Updated: 2026-05-16T22:50:11.722Z

## Active Goal

- PubPaid 2.0 Google gate hotfix realflow2

## Summary

Hotfix aplicado apos feedback: o metodo Google foi removido da rua/jogo. PubPaid 2.0 agora mantem Google apenas no gate externo antes do jogo; usuario autenticado ve Continuar, carteira usa nome/email/sub Google, e Damas sem saldo aprovado fica bloqueada. Cache-bust subiu para 20260516-google-wallet-realflow2.

## Next

- Apos deploy
- abrir somente /pubpaid-v2.html?v=20260516-google-wallet-realflow2
- Confirmar online que app.js/HTML contem realflow2 e nao contem Google Port
- Manter npm run guard:pubpaid em toda mudanca PubPaid

## Files In Focus

- pubpaid-v2.html
- pubpaid-phaser/app.js
- pubpaid-phaser.css
- pubpaid-phaser/scenes/BootScene.js
- CODEX_MEMORY.md
- .codex-memory/current-state.md
- .codex-memory/handoff.md

## Assets In Focus

- output/playwright/pubpaid-google-port-hotfix/flow/01-google-gate-authenticated-desktop.png
- output/playwright/pubpaid-google-port-hotfix/flow/02-wallet-google-identity-pending.png
- output/playwright/pubpaid-google-port-hotfix/flow/04-street-no-google-port.png
- output/playwright/pubpaid-google-port-hotfix/flow/05-damas-blocked-no-real-balance.png
- output/playwright/pubpaid-google-port-hotfix/flow/06-google-gate-mobile-before-game.png
