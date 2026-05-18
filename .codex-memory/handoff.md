# Handoff

Updated: 2026-05-17T19:02:00-05:00

PubPaid 2.0 esta na rodada `20260517-artpass1`. O trabalho atual focou Damas como arena PvP dedicada e premium, mantendo o fluxo canonico de Google, saldo real, escrow, ready duplo, W.O. e backend autoritativo.

Adicao desta rodada: `Damas Demo` e treino local contra maquina para teste visual/fluxo sem ficha, sem fila, sem escrow, sem carteira e sem alterar saldo.

Patch mais recente: mobile voltou a exigir horizontal antes de entrar no jogo; `Ligar som` nao abre mais o jogo; conta Google confirmada mostra `Tocar para intro`; Damas Demo removeu grafico de mao, ganhou fundo, pecas quadradas, score visual, som curto de movimento/captura e layout landscape compacto. A rodada `20260517-artpass1` deixou o mobile mais jogo e menos computador: tabuleiro protagonista, placas pixel/neon compactas, menos texto lateral e botao `Ja virei` que apenas revalida orientacao sem forcar lock no celular.

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
  - Lobby tambem mostra `Damas Demo`, que cria uma partida local contra maquina usando as mesmas regras de Damas, sem backend financeiro.
  - Damas renderiza `abandoned`, resultado e desistir.
  - Damas renderiza arena dedicada com timer, cards dos jogadores, hints, historico e suporte a drag/drop alem de tap.
  - Mesa generica renderiza sinuca/xadrez/poker/truco/dados e chama endpoints reais.
  - Render de mesa generica tem trava contra recursao e nao recria botoes a cada polling de presenca.
- `pubpaid-admin.html` e `pubpaid-runtime.js`
  - Dashboard separa saldo atual, livre/travado, ganho PvP, perdido PvP e liquido PvP.
- `assets/pubpaid/lobby/icons/*.svg`
  - Icones de lobby para as seis mesas.
- `pubpaid-phaser.css`
  - Damas recebeu arena premium fullscreen, grid 8x8 fixo, pecas quadradas, score visual, fundo de arena, layout mobile landscape compacto e gate portrait.
  - Mesa generica e cards novos adicionados.
  - Mobile/orientacao ajustados para nao travar por lock API.

## Validation Done

- Syntax checks para `server.js`, `domGameInterface.js`, `pvpService.js`, `accountService.js`, `app.js`, `PoolGameScene.js`.
- `npm run guard:pubpaid`.
- Browser local em Damas Demo: card abriu treino, lance `A3-B4`, maquina respondeu `D6-E5`, `realPvp=false`, `demo=true`, saldo 0 e sem console errors.
- Browser mobile 390x844 em Damas Demo: 64 casas, tabuleiro 332x332, sem scroll.
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
- Browser local `20260517-mobilefix1`:
  - desktop 1366x768: audio nao abriu intro, Damas Demo moveu/respondeu, 64 casas, sem mao, sem scroll;
  - mobile landscape 844x390: toque abriu intro sem depender de audio, Damas Demo respondeu a tap, 64 casas, sem overflow;
  - mobile portrait 390x844: gate horizontal visivel, intro nao iniciou;
  - Google mockado: `Tocar para intro` apareceu, audio nao abriu intro, toque no card abriu intro.
- Browser local `20260517-artpass1`:
  - portrait mobile: gate visivel, `Ja virei` nao inicia enquanto ainda vertical;
  - apos simular landscape, o gate libera entrada;
  - Damas Demo mobile landscape: 64 casas, sem mao, sem overflow, HUD em placas compactas e tabuleiro central.
- Online Render:
  - `/api/pubpaid/build` retornou `20260517-mobilefix1`;
  - smoke mobile landscape com Google mockado abriu intro pelo botao, manteve audio separado e rodou Damas Demo por tap sem overflow.
- Usuario confirmou a direcao: primeiro tudo precisa funcionar; arte final fica como reposicao/substituicao posterior.

## Next

1. Validar com duas contas Google reais nas janelas do usuario.
2. Confirmar em aparelho real que portrait mostra gate e landscape entra.
3. Continuar polimento visual por jogo sem quebrar o financeiro.

## Caution

- Sinuca/poker/truco/dados/xadrez ja tem backend autoritativo basico, mas ainda sao versoes simples. Arte final e regras premium entram depois.
- Nao chamar estas mesas de produto final ate passarem no teste online com duas contas reais.
