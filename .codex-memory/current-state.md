# Current State

Updated: 2026-05-18T13:24:58.7213427-05:00

## Active Goal

- PubPaid 2.0 canonico: entrada limpa e caçapas da Sinuca corrigidas.

## Summary

- Build local atual: `20260518-withdrawpix1`.
- Retirada PubPaid agora exige a chave Pix para envio do dinheiro.
- O formulario de carteira tem campo `Chave Pix para receber`, o cliente bloqueia pedido sem Pix, o backend rejeita falta de Pix com `400`, e o Pix fica persistido em `pixKey`, `destination.pixKey` e `payment.pixKey`.
- Historico da carteira e dashboard admin exibem a chave Pix do saque.
- Build local atual: `20260518-entryclean1`.
- Bloco visual de objetivo/prompt removido de desktop e mobile; `Tocar para intro` removido; overlay textual `ENTER GAME` da intro removido.
- Entrada da rua reposicionada para a porta principal abaixo do letreiro PubPaid, sem label textual por cima da arte.
- Sinuca Demo detecta caçapa antes da colisao com parede e com raio maior, para a bola cair ao entrar na boca.

- Build local atual: `20260518-poolspace3`.
- Sinuca Demo e Sinuca PvP real agora usam o mesmo modelo de acao em 3 etapas:
  - `Espaco` trava a mira;
  - `Espaco` inicia a barra de forca;
  - `Espaco` solta o taco.
- Mobile usa controles laterais por toque para mirar e acionar as mesmas 3 etapas.
- A mesa da Sinuca foi centralizada e ganhou painel esquerdo `como jogar`, sem fundo pesado de salao ocupando a area de jogo.
- Sinuca agora e um unico card no lobby com `Demo` e `PvP real`.
- Demo da Sinuca usa a cena fisica local dentro de uma arena dedicada; PvP real usa fila, ready duplo, tacada autoritativa no backend e botao proprio de desistir.
- A arte da Sinuca ganhou fundo proprio de salao, painel fullscreen dedicado, placar, cards de jogadores e responsividade landscape.
- A falsa trava da Damas Demo mobile foi rastreada ate captura obrigatoria em cadeia sem feedback claro; quando existe `forcedPiece`, a peça agora e auto-selecionada e a UI mostra `Continue a captura`.
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

- Build `20260518-withdrawpix1`:
  - `node --check server.js`
  - `node --check pubpaid-runtime.js`
  - `node --check pubpaid-phaser/services/accountService.js`
  - `node --check pubpaid-phaser/ui/walletInterface.js`
  - `npm run guard:pubpaid`
  - `git diff --check`
  - Teste API isolado em servidor temporario: saque sem Pix retornou `400`; saque com Pix retornou `201`; historico voltou com `pixKey`; carteira passou de `25` para `18` e `lockedWithdrawalCoins=7`.

- Build `20260518-entryclean1`:
  - `node --check pubpaid-phaser/app.js`
  - `node --check pubpaid-phaser/scenes/BootScene.js`
  - `node --check pubpaid-phaser/scenes/IntroScene.js`
  - `node --check pubpaid-phaser/scenes/StreetScene.js`
  - `node --check pubpaid-phaser/scenes/PoolGameScene.js`
  - `node --check pubpaid-phaser/ui/domGameInterface.js`
  - `node --check pubpaid-phaser/ui/walletInterface.js`
  - `node --check server.js`
  - `npm run guard:pubpaid`
  - HTTP local confirmou build novo, sem `Tocar para intro`, sem texto `objetivo`, prompt hidden e campo Pix preservado.
  - Playwright local gerou screenshot da entrada e da intro sem overlay `ENTER GAME`.
  - Regressao matematica das 6 caçapas confirmou que pontos na boca agora entram em vez de rebater na parede.

- Build `20260518-poolspace3`:
  - `node --check pubpaid-phaser/ui/domGameInterface.js`
  - `node --check pubpaid-phaser/scenes/PoolGameScene.js`
  - `npm run guard:pubpaid`
  - Playwright local: Sinuca Demo abriu em desktop/mobile; desktop mostra instrucao lateral, mesa centralizada e sem scroll.
  - Playwright local: fluxo desktop da Sinuca com `Espaco` passou por `Travar mira -> Iniciar forca -> Tacar -> Bolas rolando`.
  - Backend real isolado com duas sessoes autenticadas: Sinuca PvP `waiting -> readying -> active`, `Espaco` gerou tacada real, `moveCount=1`, W.O. e settlement `100/100 -> 108/90`.

- Build `20260518-poolmodes1`:
  - `node --check server.js`
  - `node --check pubpaid-phaser/app.js`
  - `node --check pubpaid-phaser/ui/domGameInterface.js`
  - `node --check pubpaid-phaser/scenes/BootScene.js`
  - `node --check pubpaid-phaser/scenes/PoolGameScene.js`
  - `node --check pubpaid-phaser/ui/walletInterface.js`
  - `npm run guard:pubpaid`
  - Playwright local: lobby tem 1 card Sinuca com `Demo` e `PvP real`; demo abre em desktop/mobile landscape sem overflow; PvP abre arena dedicada em vez da mesa generica.
  - Backend real isolado com duas sessoes autenticadas: Sinuca `waiting -> readying -> active`, ready duplo, tacada real em `/api/pubpaid/pvp/pool/shot`, W.O. e settlement de carteira `100/100 -> 108/90`.
  - Playwright mobile landscape em Damas Demo: 35 lances rodados; captura encadeada agora manteve `forcedPiece`, 1 alvo valido e texto `Continue a captura`, sem travar.

- Build `20260518-checkersmodes2`:
  - `node --check server.js`
  - `node --check pubpaid-phaser/app.js`
  - `node --check pubpaid-phaser/ui/domGameInterface.js`
  - `node --check pubpaid-phaser/ui/walletInterface.js`
  - `node --check pubpaid-phaser/scenes/BootScene.js`
  - `npm run guard:pubpaid`
  - Playwright local com Google/carteira mockados: lobby tem 1 card Damas com `Demo` e `PvP real`; demo abriu 64 casas e nao chamou `/api/pubpaid/pvp/join`; PvP chamou join uma vez com `gameId=checkers` e entrou em `waiting`; estado demo nao vazou para PvP (`checkersGame=none`).
  - Online Render confirmou `/api/pubpaid/build` em `20260518-checkersmodes2`.
  - Playwright online repetiu o fluxo local: `pvpJoinAfterDemo=0`, `pvpJoinCount=1`, `pvpGameId=checkers`, `checkersGame=none`, sem overflow e sem erros de console.

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
- Online Render: `/api/pubpaid/build` respondeu `20260517-mobilefix1`; smoke online mobile landscape com Google mockado abriu intro pelo botao, audio nao abriu intro, Damas Demo respondeu a tap, 64 casas, sem mao e sem overflow.
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

- Reiniciar/deployar para servir `20260518-entryclean1` quando o usuario pedir.
- Nao subir online ate nova permissao do usuario.
- Quando autorizado, publicar `20260518-poolspace3` e confirmar `/api/pubpaid/build` online.
- Testar Sinuca com duas contas Google reais e Damas Demo em aparelho real mobile landscape.
- Continuar polimento visual por jogo sem quebrar escrow, ready duplo, W.O. e saldo real.
