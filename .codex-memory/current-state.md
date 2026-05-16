# Current State

Updated: 2026-05-16T21:15:00.000Z

## Active Goal

- PubPaid 2.0 realfix for cars, Google, wallet shortcut, idle phone and Damas gate

## Summary

Rodada realfix aplicada apos feedback do teste: carros aprovados corrigidos para nao andar de re; `Enter` abre carteira e porta usa `Espaco`; idle do protagonista so puxa celular apos 5s parado ou imediatamente ao abrir carteira; Google Port tenta login real; Damas sem saldo real fica preso na confirmacao demo e nao abre a cena sozinho.

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
- pubpaid-phaser/core/gameState.js
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
- output/playwright/pubpaid-realfix-final-local-20260516.png

## Runtime Note

- A selecao, a rua e o salao agora compartilham os protagonistas jogaveis reais por `selectedCharacter.id`, usando `walk`, `idle-breathe` e `idle-phone` em 8 direcoes.
- Damas real 1x1 agora usa matchmaking PvP autoritativo no backend; sem saldo segue demo, com saldo real suficiente entra em fila contra outro jogador real.
- A liquidacao real foi alinhada ao exemplo pedido: stake 100 + 100 => casa 20, vencedor 180.
- Carteira mobile agora tem `position:absolute`, rolagem touch propria e breakpoint ate 720px; o QR gerado usa `scrollIntoView()` para entrar na area visivel.
- Carteira mobile agora usa breakpoint ate 960px; `Esc` nao abre mais carteira e `Enter` assumiu esse papel fora de campos de formulario.
- Damas sem saldo real exibe confirmacao explicita antes de iniciar demo.
- Google Port chama `refresh()` + `promptSignIn()`; o teste local confirmou essas chamadas por mock.
- `walletOpen` foi adicionado ao `gameState` e ao `render_game_to_text`.
