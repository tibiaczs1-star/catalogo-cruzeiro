# Current State

Updated: 2026-05-22T05:18:00.000Z

## Active Goal

- PubPaid Damas/Xadrez UX final + Torneio Damas

## Summary

Build 20260522-gameux1 ajusta o Torneio de Damas para fluxo real e fecha a rodada visual de Damas/Xadrez: loader de abertura espera assets/cache antes da intro, copy explicativa da abertura foi removida, Damas e Xadrez entram com mesa fixa por padrao, controles de camera por borda/toque e botao para alternar rotacao do rival. Xadrez recebeu botao visivel de sair/desistir e HUD lateral menor para nao cobrir o tabuleiro.

## Next

- Stage apenas arquivos PubPaid/memoria
- nao incluir data/pubpaid-tournaments.json; depois commitar
- push main e verificar Render em /api/pubpaid/build

## Files In Focus

- server.js
- pubpaid.html
- pubpaid-admin.html
- pubpaid-phaser.css
- pubpaid-phaser/ui/domGameInterface.js
- pubpaid-phaser/services/tournamentService.js
- pubpaid-phaser/app.js

## Assets In Focus

- .codex-temp/tourney-reg-desktop-fixed.png
- .codex-temp/gameux-final-checkers-desktop.png
- .codex-temp/gameux-final-chess-desktop.png
- .codex-temp/gameux-final-checkers-mobile.png
- .codex-temp/gameux-final-chess-mobile.png
