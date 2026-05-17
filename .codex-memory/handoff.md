# Handoff

Updated: 2026-05-17T07:27:46-05:00

PubPaid 2.0 esta na rodada `20260517-poolpvp-ledger1`. O trabalho ativo deixou o jogo mais canonico e funcional: PvP com reconexao/W.O., Damas corrigida visualmente, Sinuca agora em PvP real, novas mesas PvP simples para Xadrez, Poker, Truco e Dados, e ledger de ganhos/perdas no dashboard.

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
- `pubpaid-phaser/scenes/PoolGameScene.js`
  - Refeito com bola branca, 15 bolas em triangulo, mira/forca, colisao, parede, caçapas e reposicao da branca.
- `pubpaid-phaser/ui/domGameInterface.js`
  - Lobby canonico mostra Sinuca, Damas, Xadrez, Poker, Truco e Dados.
  - Damas renderiza `abandoned`, resultado, desistir e mao animada.
  - Mesa generica renderiza sinuca/xadrez/poker/truco/dados e chama endpoints reais.
  - Render de mesa generica tem trava contra recursao e nao recria botoes a cada polling de presenca.
- `pubpaid-admin.html` e `pubpaid-runtime.js`
  - Dashboard separa saldo atual, livre/travado, ganho PvP, perdido PvP e liquido PvP.
- `assets/pubpaid/lobby/icons/*.svg`
  - Icones de lobby para as seis mesas.
- `pubpaid-phaser.css`
  - Damas recebeu grid 8x8 fixo.
  - Mesa generica e cards novos adicionados.
  - Mobile/orientacao ajustados para nao travar por lock API.

## Validation Done

- Syntax checks para `server.js`, `domGameInterface.js`, `pvpService.js`, `accountService.js`, `app.js`, `PoolGameScene.js`.
- `npm run guard:pubpaid`.
- `git diff --check`.
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

1. Rodar validacao mobile/landscape.
2. Deploy/sync online.
3. Confirmar `/api/pubpaid/build` online retornando `20260517-poolpvp-ledger1`.
4. Validar com duas contas Google reais nas janelas do usuario.

## Caution

- Sinuca/poker/truco/dados/xadrez ja tem backend autoritativo basico, mas ainda sao versoes simples. Arte final e regras premium entram depois.
- Nao chamar estas mesas de produto final ate passarem no teste online com duas contas reais.
