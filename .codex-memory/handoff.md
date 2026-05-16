# Handoff

Updated: 2026-05-16T20:42:00.000Z

PubPaid 2.0 / carteira mobile e demo gate: a correcao atual resolveu o bloqueio de rolagem que impedia chegar a area `Depositar por Pix` em celular. O problema era CSS: `.ppg-dom-wallet` nao tinha `position`, entao `top/right/bottom` nao delimitavam altura real e o painel escapava da viewport. Depois do feedback real do usuario, o breakpoint mobile foi ampliado de 720px para 960px para cobrir aparelhos que ainda caiam no layout lateral. `Esc` deixou de abrir a carteira; `Enter` assumiu esse atalho fora de campos de formulario. Damas sem saldo real agora abre uma confirmacao explicita antes de entrar em demo.

Validacoes desta rodada:

- `node --check pubpaid-phaser/ui/walletInterface.js`
- `brace-balance=0` em `pubpaid-phaser.css`
- `npm run guard:pubpaid`
- Playwright mobile portrait e landscape com rolagem funcional e QR Pix visivel
- Playwright com viewport 839px confirmando o novo breakpoint e a confirmacao de Damas demo
- Capturas:
  - `output/playwright/pubpaid-wallet-mobile-portrait-after-20260516.png`
  - `output/playwright/pubpaid-wallet-mobile-landscape-after-20260516.png`
  - `output/playwright/pubpaid-wallet-mobile-portrait-qr-20260516.png`
  - `output/playwright/pubpaid-wallet-mobile-landscape-qr-20260516.png`
  - `output/playwright/pubpaid-wallet-mobile-839-after-breakpoint-20260516.png`
  - `output/playwright/pubpaid-wallet-839-enter-demo-confirm-20260516.png`

## Next

- Testar o fluxo real em dois celulares online: login Google, abrir carteira, gerar QR Pix, registrar deposito e depois validar Damas real 1x1.
- Antes de criar novos assets PubPaid, continuar usando `pubpaid-concepts.html` como referencia.
- Se alterar runtime PubPaid 2.0, manter regra dura: nao usar `createElement`, `canvas`, `createCanvas`, `addCanvas` no runtime e rodar `npm run guard:pubpaid`.

## Files In Focus

- `pubpaid-phaser.css`
- `pubpaid-v2.html`
- `pubpaid-phaser/app.js`
- `pubpaid-phaser/ui/walletInterface.js`
- `pubpaid-phaser/ui/domGameInterface.js`
- `pubpaid-phaser/scenes/GameLobbyScene.js`
- `CODEX_MEMORY.md`

## Runtime Note

- O fluxo jogavel do PubPaid 2.0 voltou a usar os protagonistas corretos, nao sprites-conceito.
- Damas real 1x1 foi ligada ao backend PvP ja existente: fila real so com saldo real suficiente, servidor valida turno/jogada/tabuleiro e o cliente apenas renderiza o estado autoritativo.
- Correcao essencial aplicada antes em `pubpaid-runtime.js`: `lockedMatchCoins` agora sobrevive ao rebuild canonico da carteira, entao o escrow da partida real permanece travado.
- Liquidacao definida conforme pedido: com 100 de cada jogador, pote 200, casa 20, vencedor 180.
- Carteira mobile pronta para teste real: o deposito/QR Pix agora e alcancavel por scroll touch em viewport estreita.
- O atalho de carteira agora e `Enter`; `Esc` fica livre para o comportamento do navegador/fullscreen.
- Damas sem saldo real nao abre mais direto: pergunta antes se o jogador quer usar o saldo demo.
