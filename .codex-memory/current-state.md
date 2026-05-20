# Current State

Updated: 2026-05-20T10:24:00-05:00

## Active Goal

- Damas PubPaid com abertura cinematica e mobile validado

## Summary

Build local 20260520-checkerscam1: Damas PubPaid recebeu intro cinematica, moeda de abertura, camera/zoom, virada para o adversario, arena com luzes e textos centralizados. A moeda bloqueia apenas a abertura; apos 5.2s ela some, re-renderiza o tabuleiro e libera a partida normal. O fluxo padrao foi preservado: Demo segue treino local sem ficha/carteira e PvP continua no matchmaking/ready real.

## Next

- Usuario revisar Damas em http://127.0.0.1:3002/pubpaid.html?v=20260520-checkerscam1&review=damas.
- Validado em Playwright desktop 1280x720 e mobile landscape 844x390: build correto, 64 casas, moeda escondida apos abertura, 64 casas liberadas e sem overflow do painel.
- Ainda falta validar PvP real em duas sessoes autenticadas antes de fechar fluxo financeiro.
