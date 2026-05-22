# Handoff

Updated: 2026-05-22T05:18:00.000Z

Torneio de Damas agora usa fluxo real de inscricao: reserva com Google/WhatsApp, Pix/referencia, aprovacao manual do admin em /api/pubpaid-admin/tournaments/checkers/review, e check-in apenas para vaga aprovada. Na mesma build 20260522-gameux1, Damas/Xadrez receberam loader de abertura aguardando assets/cache, mesa fixa por padrao com botao para ligar/desligar rotacao do rival, camera por borda/toque, texto mobile proprio, Xadrez com sair/desistir visivel e HUD lateral compactado para nao sobrepor o tabuleiro.

## Next

- Commitar ajuste gameux1
- push main
- aguardar Render
- conferir /api/pubpaid/build e smoke rapido online

## Files In Focus

- server.js
- pubpaid.html
- pubpaid-admin.html
- pubpaid-phaser.css
- pubpaid-phaser/app.js
- pubpaid-phaser/ui/domGameInterface.js
- pubpaid-phaser/services/tournamentService.js
- pubpaid-phaser/ui/walletInterface.js

## Related Orders

- 2026-05-22-fluxo-real-de-inscricao-do-torneio-damas-com-pix-e-admin
- 2026-05-22-finalizar-ux-damas-xadrez-loading-camera-hud
