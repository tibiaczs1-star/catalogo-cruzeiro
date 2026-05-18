# Progress - PubPaid Canonico

Original prompt: criar uma Damas PvP premium, moderna e responsiva, adaptada ao PubPaid 2.0 sem quebrar o fluxo financeiro real.

Atualizado: 2026-05-17

## Estado Atual

O workspace foi limpo para tratar PubPaid como um unico jogo canonico.

- Caminho unico: `/pubpaid.html`
- Runtime unico: `pubpaid-phaser/`
- Dados reais: `pubpaid-runtime.js`, `data/pubpaid-store.json`, `data/pubpaid-pvp.json`
- Caminhos antigos: removidos ou redirect de compatibilidade

## Limpeza Feita

- Removidos do Git: prompts/relatorios conceituais, screenshots antigas de Playwright/web-game, jogo externo de roleta, `pubpaid-v2.js`, `pubpaid-v2.css`, `pubpaid-phaser.html` e painel antigo `sprites-check-change`.
- Quarentenados localmente: laboratorios, artes nao aprovadas, temporarios e `data/pubpaid-pvp.json` local antigo.
- Memoria local reduzida ao estado vivo atual.

## Em Andamento

- Patch `20260517-avatarfix1` pronto para deploy.
- Validado backend PvP com duas sessoes autenticadas de teste: espera, pareamento, dupla confirmacao, partida ativa e abandono com vitoria do outro jogador.
- Validado frontend local: selecao de avatar com sprites reais, sem placeholder verde, sem texto feio em cima dos personagens e sem alerta falso de fullscreen.
- Validado mobile por Playwright: retrato bloqueia para horizontal; paisagem fica sem scroll.
- Pendente: teste online nas duas contas Google reais do usuario, porque o conector Chrome do Codex ainda nao consegue controlar as janelas reais sem o native host registrado no Windows.

## Atualizacao 2026-05-17 - poolpvp-ledger1

- Sinuca agora entra no fluxo PvP real: fila, pareamento, dupla confirmacao, tacada autoritativa no backend e resultado com escrow.
- Lobby recebeu icones SVG para Sinuca, Damas, Xadrez, Poker, Truco e Dados.
- Dashboard PubPaid passou a separar saldo atual, livre/travado, ganho PvP, perdido PvP, liquido PvP, depositos e saques.
- Corrigido estado sujo: uma partida `finished` antiga nao bloqueia nova fila do mesmo jogo.
- Corrigida recursao da mesa generica PvP e estabilizado o DOM para polling nao recriar botoes durante clique.
- Validacao local: duas sessoes Chromium autenticadas passaram em Sinuca, Damas, Xadrez, Poker, Truco e Dados; Dados foi validado em rodada focada porque a partida tem multiplas rodadas antes de finalizar naturalmente.

## Atualizacao 2026-05-17 - checkersarena1

- Damas virou uma arena dedicada no PubPaid 2.0: header, timer, cards dos jogadores, tabuleiro premium, hints, historico, drag/tap e desistir.
- Backend grava `checkersHistory` em cada lance de Damas.
- Removido bloqueio duro de orientacao mobile; retrato agora entra no jogo em vez de travar no aviso.
- Corrigido o bug visual da mao animada deformando o grid 8x8.
- Validacao: backend com duas contas/cookies e Chrome CDP com dois perfis separados em desktop e mobile retrato, sem scroll e com casas quadradas.

## Atualizacao 2026-05-17 - checkersdemo1

- Adicionado `Damas Demo` no lobby como treino local contra maquina.
- Demo nao chama carteira, nao entra em fila, nao usa escrow, nao registra aposta e nao altera saldo.
- Demo reaproveita as regras oficiais de Damas: captura obrigatoria, combo, dama e fim por falta de peca/movimento.
- Objetivo: permitir teste visual e de fluxo de Damas sem precisar de segundo jogador real.

## Atualizacao 2026-05-18 - entryflow1

- Removido o prompt visual de objetivo da interface PubPaid em desktop e mobile.
- Removido o texto `Tocar para intro`; o botao de entrada passa a ser `Entrar`.
- Removido o overlay textual `ENTER GAME` da intro, mantendo clique/Enter funcionais.
- Hotspot de entrada da rua movido para a porta principal sob o letreiro PubPaid sem label textual, moldura ou circulo no chao.
- Sinuca Demo e PvP: caçapas detectam a bola antes da parede rebater, usam raio maior e testam o caminho da bola entre frames para evitar que tacadas rapidas atravessem a boca.
- Fluxo do botao `Entrar`: reinicia a intro mesmo se ela ja tiver rodado e avanca automaticamente para a tela inicial do jogo ao terminar.

## Atualizacao 2026-05-18 - game-director-demo1

- Criada demo separada `game-director-demo.html`, fora do runtime PubPaid.
- Jogo 2D simples: loading, intro e uma fase unica com tilemap, colisao AABB, HUD, timer, patrulha inimiga, coleta de 3 pacotes e saida.
- Incluidos hooks de teste `window.render_game_to_text` e `window.advanceTime(ms)`.
- Proximos passos: validar em browser/Playwright, checar screenshot e ajustar controles/legibilidade se necessario.

## Atualizacao 2026-05-18 - rua-viva1

- Demo refeita como `Correio do Jurua: Rua Viva`, seguindo a cadeia Diretor Geral -> Diretor do Jogo -> subagentes.
- Removido visual de labirinto/cubos; fase agora e rua 2.5D com fachadas, banca, mercado, radio, lanches, moto, barracas, postes, poças, pistas e carrinho movel.
- HUD virou prancheta/etiqueta de ronda, com pistas, tempo, confianca e estado da encomenda.
- Personagem Lia desenhado em camadas pixel art, com mochila/colete, rosto simples, passo e pacote.
- Proximos passos: validar screenshot e fluxo de coleta/chegada.
