# Current State

Updated: 2026-05-16T20:42:00.000Z

## Active Goal

- PubPaid 2.0 mobile wallet usability and demo-gate corrections

## Summary

Carteira mobile corrigida para o teste real em dois celulares. Alem do ajuste estrutural anterior, o breakpoint responsivo foi ampliado ate 960px para cobrir aparelhos que ainda caiam no layout lateral. O atalho de carteira saiu de `Esc` e passou para `Enter`. Damas sem saldo real agora para numa confirmacao antes de usar credito demo.

## Next

- Fazer teste real em dois celulares no ambiente online:
  1. login Google em ambos;
  2. abrir carteira;
  3. gerar QR Pix;
  4. confirmar que o deposito e alcancavel via scroll;
  5. depois validar Damas real 1x1.
- Continuar usando `pubpaid-concepts.html` como referencia visual para novos assets.
- Manter `npm run guard:pubpaid` em toda alteracao do runtime.

## Files In Focus

- pubpaid-phaser.css
- pubpaid-v2.html
- pubpaid-phaser/app.js
- pubpaid-phaser/ui/walletInterface.js
- pubpaid-phaser/ui/domGameInterface.js
- pubpaid-phaser/scenes/GameLobbyScene.js
- CODEX_MEMORY.md

## Assets In Focus

- output/playwright/pubpaid-wallet-mobile-before-20260516.png
- output/playwright/pubpaid-wallet-mobile-portrait-after-20260516.png
- output/playwright/pubpaid-wallet-mobile-landscape-after-20260516.png
- output/playwright/pubpaid-wallet-mobile-portrait-qr-20260516.png
- output/playwright/pubpaid-wallet-mobile-landscape-qr-20260516.png
- output/playwright/pubpaid-wallet-mobile-839-after-breakpoint-20260516.png
- output/playwright/pubpaid-wallet-839-enter-demo-confirm-20260516.png

## Runtime Note

- A selecao, a rua e o salao agora compartilham os protagonistas jogaveis reais por `selectedCharacter.id`, usando `walk`, `idle-breathe` e `idle-phone` em 8 direcoes.
- Damas real 1x1 agora usa matchmaking PvP autoritativo no backend; sem saldo segue demo, com saldo real suficiente entra em fila contra outro jogador real.
- A liquidacao real foi alinhada ao exemplo pedido: stake 100 + 100 => casa 20, vencedor 180.
- Carteira mobile agora tem `position:absolute`, rolagem touch propria e breakpoint ate 720px; o QR gerado usa `scrollIntoView()` para entrar na area visivel.
- Carteira mobile agora usa breakpoint ate 960px; `Esc` nao abre mais carteira e `Enter` assumiu esse papel fora de campos de formulario.
- Damas sem saldo real exibe confirmacao explicita antes de iniciar demo.
