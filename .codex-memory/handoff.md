# Handoff

Updated: 2026-05-18T13:24:58.7213427-05:00

PubPaid 2.0 esta na rodada local `20260518-entryflow1`. O trabalho atual limpou a entrada visual e corrigiu a caçapa da Sinuca Demo.

Validacao nova desta rodada: Playwright local confirmou botao `Entrar`, nenhum marcador visual na porta da rua e as 6 caçapas encaçapando tacada rapida na cena real da Sinuca.

Correcao adicional: o botao `Entrar` agora abre/reabre a intro e a intro avanca automaticamente para a tela inicial do jogo ao terminar, sem precisar de um segundo clique no frame final. Playwright local validou `Entrar -> intro -> character-select` e reentrada `Entrar -> intro -> street`.

Rodada anterior: `20260518-withdrawpix1` adicionou chave Pix obrigatoria ao pedido de saque: valor + Pix sao enviados juntos, o backend rejeita pedido sem Pix e a chave aparece no historico da carteira e no admin.

Rodada anterior: `20260518-poolspace3` focou Sinuca como uma unica mesa com dois modos isolados, controle funcional por `Espaco` no desktop, toque lateral no mobile e mesa centralizada.

Adicao desta rodada: Sinuca Demo e Sinuca PvP real usam o mesmo fluxo de acao em 3 etapas: `Espaco` trava a mira, `Espaco` inicia a barra de forca, `Espaco` solta o taco. A mesa foi centralizada, recebeu instrucao lateral `como jogar`, e o mobile recebeu botoes laterais de toque para mirar/acionar sem depender do botao inferior.

Estado de deploy: nao publicar online sem nova permissao do usuario.

## What Changed

- `pubpaid.html` e `pubpaid-phaser.css`
  - Prompt/objetivo visual removido da interface em desktop e mobile.
- `pubpaid-phaser/app.js`
  - Botao de entrada passa a mostrar `Entrar`; removida copia `Tocar para intro`.
- `pubpaid-phaser/scenes/IntroScene.js`
  - Removido overlay textual final `ENTER GAME` e hints da intro.
- `pubpaid-phaser/scenes/StreetScene.js`
  - Hotspot da entrada movido para a porta principal sob o letreiro PubPaid; label textual, moldura e circulo no chao removidos da arte.
- `pubpaid-phaser/scenes/PoolGameScene.js`
  - Caçapas detectam antes da colisao com parede, com raio maior e com teste de caminho entre frames para evitar rebote ou travessia em tacada rapida.
- `pubpaid.html`
  - Formulario de retirada ganhou campo `Chave Pix para receber`.
- `pubpaid-phaser/ui/walletInterface.js`
  - Valida Pix antes de enviar, mostra feedback se faltar e exibe Pix no historico de saques.
- `pubpaid-phaser/services/accountService.js`
  - Envia `pixKey` para `/api/pubpaid/withdrawals`.
- `server.js`
  - Endpoint de saque exige Pix, grava `pixKey`, `destination.pixKey` e `payment.pixKey`, e devolve Pix para conta/admin/export.
- `pubpaid-runtime.js`
  - Normalizacao canonica preserva Pix em saques e atualiza status de pagamento na revisao de saque.
- `pubpaid-admin.html`
  - Tabela de saques pendentes mostra a chave Pix.
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
  - Refeito com bola branca, 15 bolas em triangulo, mira/forca, colisao, parede, caçapas, reposicao da branca e fundo proprio de salao.
  - Controle da demo mudou para maquina de estados `aim -> locked -> power -> rolling`, com barra de forca automatica e `Espaco` como acao unica no desktop.
  - Mesa centralizada no palco da Sinuca.
- `pubpaid-phaser/ui/domGameInterface.js`
  - Lobby canonico mostra Sinuca, Damas, Xadrez, Poker, Truco e Dados.
  - Sinuca e Damas usam card unico com `Demo` e `PvP real`.
  - Demo de Sinuca fica isolada do PvP real, sem ficha e sem carteira.
  - PvP real de Sinuca usa a mesma regra de acao por `Espaco`: trava mira, inicia forca e dispara tacada autoritativa.
  - Damas renderiza `abandoned`, resultado e desistir.
  - Damas renderiza arena dedicada com timer, cards dos jogadores, hints, historico e suporte a drag/drop alem de tap.
  - Damas Demo mobile auto-seleciona a peça de captura encadeada e mostra o texto de continuidade.
  - Mesa generica renderiza sinuca/xadrez/poker/truco/dados e chama endpoints reais.
  - Render de mesa generica tem trava contra recursao e nao recria botoes a cada polling de presenca.
- `pubpaid-admin.html` e `pubpaid-runtime.js`
  - Dashboard separa saldo atual, livre/travado, ganho PvP, perdido PvP e liquido PvP.
- `assets/pubpaid/lobby/icons/*.svg`
  - Icones de lobby para as seis mesas.
- `pubpaid-phaser.css`
  - Sinuca recebeu arena fullscreen premium com fundo proprio, placar, sidecar e responsividade landscape.
  - Sinuca recebeu painel esquerdo `como jogar` e controles laterais mobile; o botao principal inferior nao disputa espaco no mobile.
  - Damas recebeu arena premium fullscreen, grid 8x8 fixo, pecas quadradas, score visual, fundo de arena, layout mobile landscape compacto e gate portrait.
  - Mesa generica e cards novos adicionados.
  - Mobile/orientacao ajustados para nao travar por lock API.

## Validation Done

- `20260518-entryflow1` local:
  - syntax checks em app, BootScene, IntroScene, StreetScene, PoolGameScene, domGameInterface, walletInterface e server;
  - `npm run guard:pubpaid`;
  - HTTP local sem `Tocar para intro` e sem `objetivo`, prompt hidden e build correto;
  - screenshot local da entrada e intro sem overlay `ENTER GAME`;
  - regressao matematica confirmou as 6 caçapas aceitando bola na boca em vez de rebater.

- `20260518-withdrawpix1` local:
  - `node --check server.js`;
  - `node --check pubpaid-runtime.js`;
  - `node --check pubpaid-phaser/services/accountService.js`;
  - `node --check pubpaid-phaser/ui/walletInterface.js`;
  - `npm run guard:pubpaid`;
  - `git diff --check`;
  - API isolada em servidor temporario: saque sem Pix retornou `400`, saque com Pix retornou `201`, historico trouxe `pixKey` e saldo ficou travado corretamente.

- `20260518-poolspace3` local:
  - `node --check pubpaid-phaser/ui/domGameInterface.js`;
  - `node --check pubpaid-phaser/scenes/PoolGameScene.js`;
  - `npm run guard:pubpaid`;
  - Sinuca Demo validada com `Espaco` em desktop: trava mira, inicia forca, solta taco e entra em `Bolas rolando`;
  - Sinuca Demo validada em mobile landscape com controles laterais;
  - Sinuca PvP real validada contra backend real isolado com duas contas: ready duplo, tacada enviada por `Espaco`, `moveCount=1`, W.O. e settlement `100/100 -> 108/90`.

- `20260518-poolmodes1` local:
  - syntax checks de `server.js`, `app.js`, `domGameInterface.js`, `walletInterface.js`, `BootScene.js`, `PoolGameScene.js`;
  - `npm run guard:pubpaid`;
  - Sinuca Demo validada em desktop e mobile landscape, sem overflow;
  - PvP real de Sinuca validado contra backend real isolado com duas contas: `waiting -> readying -> active`, ready duplo, tacada autoritativa, W.O. e settlement `100/100 -> 108/90`;
  - Damas Demo mobile rodada por 35 lances; captura encadeada exibiu `Continue a captura`, alvo valido e nao travou.

- `20260518-checkersmodes2` local e online:
  - `node --check server.js`, `app.js`, `domGameInterface.js`, `walletInterface.js`, `BootScene.js`;
  - `npm run guard:pubpaid`;
  - lobby tem 1 card Damas, 1 botao Demo, 1 botao PvP real e 0 cards antigos separados;
  - demo abre 64 casas, `pvpStatus=idle`, `pvpGameId=` e nao chama `/api/pubpaid/pvp/join`;
  - PvP real chama `/api/pubpaid/pvp/join` uma vez com `gameId=checkers`, entra em `waiting` e deixa `checkersGame=none`;
  - online Render confirmou build `20260518-checkersmodes2` e repetiu o smoke sem overflow/console errors.

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
- Online Render:
  - `/api/pubpaid/build` retornou `20260517-mobilefix1`;
  - smoke mobile landscape com Google mockado abriu intro pelo botao, manteve audio separado e rodou Damas Demo por tap sem overflow.
- Usuario confirmou a direcao: primeiro tudo precisa funcionar; arte final fica como reposicao/substituicao posterior.

## Next

1. Quando o usuario autorizar, reiniciar/deployar `20260518-entryflow1`.
1. Quando o usuario autorizar, subir `20260518-poolspace3`.
2. Validar online com duas contas Google reais a Sinuca `PvP real`.
3. Confirmar em aparelho real que Damas Demo landscape mostra a captura encadeada sem falsa trava.
4. Continuar polimento visual por jogo sem quebrar o financeiro.

## Caution

- Sinuca/poker/truco/dados/xadrez ja tem backend autoritativo basico, mas ainda sao versoes simples. Arte final e regras premium entram depois.
- Nao chamar estas mesas de produto final ate passarem no teste online com duas contas reais.
