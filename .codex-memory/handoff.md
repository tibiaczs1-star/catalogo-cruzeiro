# Handoff

Updated: 2026-05-20T10:24:00-05:00

Damas PubPaid ajustada em 20260520-checkerscam1 a partir do CSV `C:\Users\junio\Downloads\table-1779287972054.csv`. Correcoes principais: intro cinematica, moeda de abertura, camera livre/zoom, virada visual para o adversario, luzes/arena, textos centralizados e bloqueio temporario so durante a moeda. Quando a moeda termina, a mesa libera automaticamente e o fim de jogo continua no fluxo normal de resultado. Demo segue treino local sem ficha/carteira; PvP segue o fluxo padrao de matchmaking/ready.

## Next

- Validacoes feitas: `node --check` em `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/app.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; `/api/pubpaid/build` na porta 3002 retornou `20260520-checkerscam1`.
- Playwright smoke confirmou desktop 1280x720 e mobile landscape 844x390 com `cells=64`, `enabledCells=64`, `coinHidden=true`, status `Escolha uma peça` e painel dentro do viewport.
- Evidencias: `.codex-temp/checkerscam-desktop.png` e `.codex-temp/checkerscam-mobile.png`.
- Ainda falta validar PvP real em duas sessoes autenticadas antes de fechar fluxo financeiro.
