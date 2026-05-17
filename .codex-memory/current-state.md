# Current State

Updated: 2026-05-17T18:35:00-05:00

## Active Goal

- PubPaid 2.0 canonico: Damas PvP como arena dedicada premium, preservando financeiro real.

## Summary

- Build local atual: `20260517-mobilefix1`.
- Damas foi refeita como arena DOM dedicada: header de partida, timer, cards dos jogadores, tabuleiro premium, hints, historico de lances, drag/tap e botao Desistir.
- Lobby ganhou `Damas Demo`: treino local contra maquina, sem ficha, sem fila PvP, sem escrow e sem alterar saldo.
- Backend passou a persistir `checkersHistory` por match; o frontend mostra o ultimo historico sem depender de estado local.
- O grafico de mao do ultimo lance foi removido.
- Mobile agora deve jogar em horizontal: portrait mostra gate de orientacao e nao inicia a intro/jogo.
- Botao `Ligar som` nao abre mais o jogo; conta Google confirmada fica em `Tocar para intro`.
- Damas PvP agora diferencia desconexao e desistência:
  - fechar navegador/pagehide marca mesa como `abandoned`;
  - jogador tem 60 segundos para voltar;
  - voltar via polling/state reativa a mesa;
  - botão `Desistir` finaliza por W.O. imediatamente.
- Damas recebeu ajuste geometrico de fullscreen: grid 8x8 com linhas fixas, fundo de arena, pecas quadradas, score visual e som curto ao mover/capturar.
- Mobile landscape foi compactado para manter tabuleiro, score e botoes sem overflow.
- Sinuca foi reconstruida como cena fisica local: bola branca, 15 bolas em triangulo, mira, força, colisao bola-bola, paredes, caçapas e reposicao da branca.
- Xadrez, poker, truco e dados foram adicionados como mesas canonicas PvP:
  - xadrez usa `chess.js` no servidor para validar lance legal;
  - poker troca 5 cartas e resolve mao no backend;
  - truco simples melhor de 3 maos;
  - dados por palpite de soma em rodadas.
- Sinuca agora tambem usa o fluxo PvP real no DOM: fila, pareamento, dupla confirmacao e endpoint autoritativo de tacada.
- Dashboard PubPaid separa saldo atual, livre/travado, ganho PvP, perdido PvP e liquido PvP.
- Corrigido estado sujo: resultado `finished` antigo nao bloqueia nova fila do mesmo jogo.
- Corrigida recursao/render instavel da mesa generica: polling de presenca nao recria botoes enquanto o estado jogavel nao muda.

## Validation

- `node --check server.js`
- `node --check pubpaid-phaser/ui/domGameInterface.js`
- `node --check pubpaid-phaser/services/pvpService.js`
- `node --check pubpaid-phaser/services/accountService.js`
- `node --check pubpaid-phaser/app.js`
- `node --check pubpaid-phaser/scenes/PoolGameScene.js`
- `npm run guard:pubpaid`
- Browser local em Damas Demo: clique no card, lance `A3-B4`, resposta da maquina `D6-E5`, `realPvp=false`, `demo=true`, saldo 0 e sem erros de console.
- Browser mobile 390x844 em Damas Demo: tabuleiro 332x332, 64 casas, sem scroll e sem bloqueio de orientacao.
- Browser local `20260517-mobilefix1`:
  - desktop 1366x768: botao `Ligar som` nao inicia intro, Damas Demo moveu uma peca, maquina respondeu, 64 casas, sem grafico de mao, sem scroll;
  - mobile landscape 844x390: `Tocar para intro` abriu intro sem precisar do botao de som, Damas Demo respondeu a tap, 64 casas, sem overflow;
  - mobile portrait 390x844: gate horizontal visivel, `introStarted=no`, `orientationBlocked=yes`;
  - Google mockado: conta confirmada mostrou `Tocar para intro`; audio nao abriu intro; toque no card abriu intro.
- `git diff --check`
- Teste backend isolado com duas contas/cookies: Damas `waiting -> readying -> active`, lance legal validado e `checkersHistory[0]` persistido.
- Teste Chrome via CDP com dois perfis separados:
  - desktop 1365x768: Damas ativa, tabuleiro 440x440, casas 55x55, sem scroll, `orientationBlocked=false`;
  - mobile retrato 390x844: Damas ativa, tabuleiro 332x332, casas 41.5x41.5, sem scroll, `orientationBlocked=false`.
- Teste replay/backend local: depois de finalizar uma sinuca, novo join do mesmo jogador retorna `waiting` em vez de reaproveitar match `finished`.
- Teste Chromium local com duas sessoes autenticadas:
  - Sinuca: card do lobby, pareamento, ready duplo, tacada PvP e W.O.
  - Damas: card do lobby, pareamento, ready duplo, movimento e W.O.
  - Xadrez: card do lobby, pareamento, ready duplo, lance e W.O.
  - Poker: card do lobby, pareamento, ready duplo, duas trocas e resultado natural.
  - Truco: card do lobby, pareamento, ready duplo, carta jogada e W.O.
  - Dados: card do lobby, pareamento, ready duplo, dois palpites, rodada registrada e W.O.
- Teste backend local com duas sessoes/cookies:
  - Damas: join, ready duplo, desconexao -> `abandoned`, reconexao -> `active`, desistir -> `finished` com rival vencedor.
  - Xadrez: lance `e2-e4` validado pelo motor.
  - Poker: duas trocas concluem a mesa.
  - Dados: rodada registrada.
  - Truco: mao registrada.
- Browser local em build `20260517-poolpvp-ledger1`:
  - sem scroll em desktop 1280x720;
  - lobby mostra Sinuca, Damas, Xadrez, Poker, Truco e Dados;
  - Sinuca abre com 15 bolas em triangulo e tacada movimenta/colide bolas sem console errors.
- Observacao do usuario durante a rodada: o objetivo principal e tudo funcionar; arte pode ser reposicionada/substituida depois.

## Files In Focus

- `server.js`
- `pubpaid.html`
- `pubpaid-phaser.css`
- `pubpaid-phaser/app.js`
- `pubpaid-phaser/ui/domGameInterface.js`
- `pubpaid-phaser/services/accountService.js`
- `pubpaid-phaser/services/pvpService.js`
- `pubpaid-phaser/scenes/PoolGameScene.js`
- `pubpaid-runtime.js`
- `pubpaid-admin.html`
- `assets/pubpaid/lobby/icons/*.svg`
- `package.json`
- `package-lock.json`

## Next

- Commit/push e confirmar `/api/pubpaid/build` online com `20260517-checkersdemo1`.
- Testar online com duas contas Google reais quando o deploy novo estiver ativo nas duas janelas.
- Continuar polimento visual por jogo sem quebrar escrow, ready duplo, W.O. e saldo real.
