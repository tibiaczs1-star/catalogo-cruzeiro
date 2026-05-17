# Handoff

Updated: 2026-05-17T11:22:00-05:00

PubPaid 2.0 esta na rodada `20260517-checkersarena1`. O trabalho atual focou Damas como arena PvP dedicada e premium, mantendo o fluxo canonico de Google, saldo real, escrow, ready duplo, W.O. e backend autoritativo.

## What Changed

- `server.js`
  - PvP aceita `pool`, `checkers`, `chess`, `poker`, `truco`, `dicecups`, `cards21`, `darts`.
  - Todas as mesas criadas entram em `readying`; os dois jogadores precisam confirmar `ready`.
  - Presenca por assento controla desconexao.
  - Desconexao abre janela de 60s (`abandoned`); retorno reativa a mesa.
  - Desistir usa `forfeit` e finaliza por W.O.
  - Sinuca, xadrez, poker, truco e dados tem endpoints de acao autoritativos.
  - Resultado `finished` antigo nao bloqueia nova fila do mesmo jogo.
  - Carteira registra ganho PvP, perda PvP, payout, fee e contadores.
  - Damas agora grava `checkersHistory` no match a cada lance.
- `pubpaid-phaser/scenes/PoolGameScene.js`
  - Refeito com bola branca, 15 bolas em triangulo, mira/forca, colisao, parede, caçapas e reposicao da branca.
- `pubpaid-phaser/ui/domGameInterface.js`
  - Lobby canonico mostra Sinuca, Damas, Xadrez, Poker, Truco e Dados.
  - Damas renderiza `abandoned`, resultado, desistir e mao animada.
  - Damas renderiza arena dedicada com timer, cards dos jogadores, hints, historico e suporte a drag/drop alem de tap.
  - Mesa generica renderiza sinuca/xadrez/poker/truco/dados e chama endpoints reais.
  - Render de mesa generica tem trava contra recursao e nao recria botoes a cada polling de presenca.
- `pubpaid-admin.html` e `pubpaid-runtime.js`
  - Dashboard separa saldo atual, livre/travado, ganho PvP, perdido PvP e liquido PvP.
- `assets/pubpaid/lobby/icons/*.svg`
  - Icones de lobby para as seis mesas.
- `pubpaid-phaser.css`
  - Damas recebeu arena premium fullscreen, grid 8x8 fixo, overlay da mao sem deformar casas e layout mobile retrato.
  - Mesa generica e cards novos adicionados.
  - Mobile/orientacao ajustados para nao travar por lock API.

## Validation Done

- Syntax checks para `server.js`, `domGameInterface.js`, `pvpService.js`, `accountService.js`, `app.js`, `PoolGameScene.js`.
- `npm run guard:pubpaid`.
- `git diff --check`.
- Teste backend local isolado com duas contas/cookies confirmou Damas `waiting -> readying -> active`, lance legal e `checkersHistory`.
- Chrome via CDP com dois perfis separados:
  - desktop 1365x768: Damas ativa, sem scroll, casas quadradas;
  - mobile retrato 390x844: Damas ativa, sem gate de orientacao, sem scroll, casas quadradas.
- Teste replay/backend local confirmou que um match `finished` antigo nao impede novo `waiting`.
- Chromium local com duas sessoes/cookies:
  - Sinuca, Damas, Xadrez, Poker e Truco passaram em uma bateria completa.
  - Dados passou em bateria focada com dois palpites, rodada registrada, W.O. e saldo atualizado.
- Backend local com duas sessoes/cookies:
  - Damas reconecta e desiste corretamente.
  - Xadrez valida lance.
  - Poker, Dados e Truco executam a primeira logica de partida.
- Browser local:
  - desktop 1280x720 sem scroll;
  - lobby com 6 mesas;
  - Sinuca abre e bolas colidem apos tacada;
  - sem erros de console no teste local.
- Usuario confirmou a direcao: primeiro tudo precisa funcionar; arte final fica como reposicao/substituicao posterior.

## Next

1. Deploy/sync online.
2. Confirmar `/api/pubpaid/build` online retornando `20260517-checkersarena1`.
3. Validar com duas contas Google reais nas janelas do usuario.
4. Continuar polimento visual por jogo sem quebrar o financeiro.

## Caution

- Sinuca/poker/truco/dados/xadrez ja tem backend autoritativo basico, mas ainda sao versoes simples. Arte final e regras premium entram depois.
- Nao chamar estas mesas de produto final ate passarem no teste online com duas contas reais.
