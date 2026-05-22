# Progress - PubPaid Canonico

Original prompt: criar uma Damas PvP premium, moderna e responsiva, adaptada ao PubPaid 2.0 sem quebrar o fluxo financeiro real.

Atualizado: 2026-05-17

## Estado Atual

O workspace foi limpo para tratar PubPaid como um unico jogo canonico.

## Atualizacao 2026-05-22 - pubpaidfix3

English execution prompt used: "Fix three focused PubPaid gameplay issues without redesigning the games: hide the mobile sound button while Checkers/Chess/Pool tables are active; make Chess Demo show clear lobby and exit controls, require an explicit player click before the coin/intro starts, and prevent overlap in mobile landscape; lock Vale Pool aim as soon as the player enters power measurement so later taps or pointer movement only affect shot power; add a waiter speech bubble inside the bar saying 'Click me to start betting.'"

- Damas mobile: botao global de som agora fica oculto durante qualquer mesa ativa, evitando sobreposicao com o painel de turno.
- Xadrez Demo: abre com tela `Comecar mesa`; a moeda/intro so roda apos clique do jogador; botoes `Mesas` e `Sair do treino` ficam visiveis e separados no mobile.
- Sinuca/Vale Pool: mira congela ao iniciar a etapa de forca; mover o dedo/mouse depois disso nao altera o angulo da tacada.
- Bar: garcom ganhou balao de fala em portugues: `Clique em mim para começar a apostar.`
- Build/cache-bust local: `20260522-pubpaidfix3`.
- Validacao: `node --check` nos JS tocados, `npm run guard:pubpaid`, `git diff --check`, `web_game_playwright_client` no Vale Pool e Playwright mobile em Xadrez/Damas/Sinuca sem console errors. Evidencias em `.codex-temp/pubpaidfix3/`.

## Atualizacao 2026-05-22 - pubpaidfix5

- Xadrez Demo ajustado para seguir a ordem pedida: intro primeiro, creditos depois, entao botao central `Jogar moeda`; a moeda nao dispara sozinha antes do clique.
- Intro do Xadrez encurtada no fallback para aliviar a espera quando o video nao encerra bem.
- Sinuca/Vale Pool mobile ganhou botao proprio no canvas para `FORCA` e depois `TACAR`; toques fora desse botao apenas ajustam a mira e nao disparam a medicao.
- Build/cache-bust local: `20260522-pubpaidfix5`.
- Usuario pediu para nao rodar testes automatizados; rodada preparada para subir e o usuario testar online.

## Atualizacao 2026-05-22 - final-sweep1

English execution prompt used: "Finish the current Projeto Codex workspace by separating the public CZS site and PubPaid as two products in the same repository; scan recent changes and open orders, implement only missing fixes, validate locally and in-browser, clean safe temporary artifacts, preserve rollback and approved PubPaid evidence, update agent/team handoffs, then commit and push for online synchronization."

- Projeto Codex/CZS e PubPaid ficaram explicitamente separados na memoria e no handoff: mesmo repo/endereco, produtos diferentes.
- Backup de rollback criado em `.codex-backups/final-sweep-20260522-132315`.
- Xadrez PubPaid recebeu ajuste final para preservar intro `video -> creditos -> moeda -> tabuleiro` antes de liberar a mesa.
- Limpeza segura: removidos `output/`, `debug.log`, `scripts/__pycache__/`, `backend/node_modules/pngjs/coverage` e `data/pubpaid-tournaments.json` local de runtime; `.gitignore` agora cobre `debug.log` e `output/web-game/`.
- Validacao local: `node --check`, `git diff --check`, `npm run cleanup:audit`, `npm run review:team`, HTTP local `:3062` e Browser desktop/mobile sem console errors.
- Pendente real: commit/push e confirmar Render online depois do deploy.

## Atualizacao 2026-05-22 - gameux2

English execution prompt used: "Fix the PubPaid Checkers and Chess camera UX without redesigning the games: on mobile, remove intrusive camera UI and rely on native gestures such as pinch-to-zoom and edge dragging; on desktop, allow dragging the table/frame edges with the mouse; cut the last two seconds from the Checkers intro video flow; and update Pool, Checkers, and Chess with original 32-bit Brazilian-inspired game themes without copying protected melodies."

- Damas e Xadrez: mobile sem controles-orbe/controles touch globais interferindo; hint mobile agora orienta pinch + arrasto de borda.
- Damas e Xadrez: camera aceita pinch para zoom e arrasto de borda/frame, com drag por mouse no desktop e roda para zoom.
- Damas: intro encurtada em 2 segundos no tempo padrao e no modo `intro=1`.
- Audio: temas de Sinuca, Damas e Xadrez atualizados para 32-bit brasileiro original.
- Build/cache-bust: `20260522-gameux2`.
- Validacao: `node --check`, `npm run guard:pubpaid`, `/api/pubpaid/build`, smoke mobile Damas/Xadrez sem controles intrusivos e sem erros de console.

## Atualizacao 2026-05-22 - chessintrofix

- Xadrez PubPaid corrigido para nao disparar a moeda antes do fim da intro: removido o salto de video para o fim e protegido o `onended` para avancar apenas quando a fase ainda e `video`.
- Fluxo ficou alinhado com Damas: video -> creditos -> moeda -> tabuleiro liberado, com timer fallback sem chamada dupla.
- Validacao local em `20260522-lobbywaiter1`: mobile landscape e desktop com 64 casas, 32 pecas, moeda apos creditos e tabuleiro liberado; warnings vistos foram apenas `ReadPixels` do WebGL headless.

## Atualizacao 2026-05-22 - boardfit1

- Xadrez: pecas reduzidas e presas dentro das casas, com geometria 3D mais baixa, sem animacao de pouso mudando a transformacao e sem regra mobile que alterna para visual chapado.
- Xadrez e Damas: clique/drag no miolo do tabuleiro fica reservado para jogo; camera agora entra por bordas, botao do meio e pinch.
- Cursores estabilizados: frame `default`, casas/pecas `pointer`, bordas de camera `grab`.
- Validacao local: `node --check`, `npm run guard:pubpaid`, `git diff --check`, browser in-app e Playwright mobile landscape 844x390.

## Atualizacao 2026-05-22 - poolpvpfix2

- Corrigido travamento/repeticao da Sinuca PvP: o `iframe` do prototipo nao e mais remontado a cada mudanca de turno/tacada.
- O prototipo `games/vale-pool` nao executa a intro interna quando aberto em `mode=pvp`.
- Ajustado layout lateral da Sinuca para manter o perfil do rival dentro da viewport em desktop e mobile horizontal.
- O modo de revisao/teste aceita `review`/`silent=1` e nao liga audio automaticamente.
- Build/cache-bust preparado como `20260522-poolpvpfix2`.

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

## Atualizacao 2026-05-18 - sinuca-premium1

- Criada primeira versao jogavel local de `Mesa de Ouro: Sinuca Brasileira` em `.codex-temp/sinuca-premium/`.
- O jogo roda via servidor Node local, com canvas 1280x720, mesa premium, bola branca, 7 bolas da regra brasileira, mira pontilhada, taco, medidor de forca, caçapas, caçapa bonus, tentativas, combo e pontuacao arcade.
- Incluidos hooks `window.render_game_to_text` e `window.advanceTime(ms)` para teste automatizado.
- Esta versao e um prototipo premium isolado: nao mexe em carteira, saldo, PvP real ou runtime canonico PubPaid.
- Proximos passos: validar screenshot/playtest, ajustar peso da fisica, caçapas e controles mobile antes de integrar ao `/pubpaid.html`.

## Atualizacao 2026-05-19 - chessfocus4

- PubPaid foi reduzido para tres mesas ativas: Sinuca, Damas e Xadrez.
- 21, Poker, Truco e Dados foram preservados em backup restauravel: backups/pubpaid-disabled-games-20260519-1235.
- Xadrez recebeu pecas visuais em CSS por tipo/cor no lugar dos glifos unicode, com 32 pecas renderizadas no tabuleiro.
- Audio agora inicia desligado e os testes foram feitos com estado music=off / LIGAR SOM.
- Validacao: node --check em app/dom/server, npm run guard:pubpaid, Playwright screenshot do lobby e do Xadrez sem console errors. Primeira tentativa do web_game_client falhou por redirect de versao; segunda passou com URL versionada.
- Proximo: usuario revisar se o visual das pecas do Xadrez esta aprovado antes de repetir o padrao em Damas e Sinuca.

## Atualizacao 2026-05-19 - chesspro1

- Xadrez PubPaid virou uma mesa mais profissional: `chess.js` foi levado para o cliente Demo e reforcado no servidor PvP para lances legais reais, SAN, xeque, mate, empate, roque, en passant e promocao.
- A interface agora mostra maozinha animada, origem/destino legal, ultimo lance, rei em xeque, historico lateral e painel de guia.
- Lances obrigatorios aparecem quando ha xeque ou quando existe so um lance legal; o cenario `e4, f6, Qh5+` validou destaque obrigatorio em `g7-g6`.
- Sons novos foram adicionados para lance, captura, xeque e mate, mantendo o som desligado por padrao durante testes.
- Validacao: `/api/pubpaid/build` em `20260519-chesspro1`, `node --check` em `server.js`, `domGameInterface.js` e `chipTechSoundtrack.js`, `npm run guard:pubpaid`, Playwright com `music=off` e screenshots `.codex-temp/pubpaid-chesspro1-after-e4.png` / `.codex-temp/pubpaid-chesspro1-forced-check.png`.

## Atualizacao 2026-05-19 - mobileland1

- Rodada de performance/responsividade do PubPaid: BootScene deixou de pre-carregar frames de intro nao usados e imagens grandes de jogos/salas que nao entram no corte atual.
- O gate de update ficou mais curto e o cache/service worker nao e limpo quando a versao local ja coincide, reduzindo custo de reabrir o jogo.
- URLs de assets repetidos foram alinhadas para evitar download duplicado da rua; build atual: `20260519-mobileland1`.
- Decisao final do usuario: Sinuca e jogos PubPaid em celular devem ser sempre horizontais. Retrato mobile agora bloqueia com `Mude para horizontal` e nao deixa a partida prosseguir.
- Paisagem estreita recebeu ajustes para Xadrez, Damas e Sinuca; o botao de audio some durante mesas para nao cobrir placar/HUD.
- Validacao: `/api/pubpaid/build` em `20260519-mobileland1`, `node --check`, `npm run guard:pubpaid`, Playwright confirmou retrato 375x667 bloqueado e paisagem 667x375/640x360/844x390 sem overflow e com `music=off`.

## Atualizacao 2026-05-19 - poolfix2

- Correção direta do PNG de Sinuca: caçapas fisicas e DOM foram colocadas para dentro da mesa e reduzidas para nao parecerem fora da borda.
- A topbar global fica escondida durante a Sinuca, removendo `POOL-GAME / Carteira` de cima da mesa.
- O layout demo em mobile landscape mantém a mesa centralizada e deixa informacoes somente no painel inferior.
- Build atual: `20260519-poolfix2`.
- Validacao: servidor reiniciado na porta 3000, `/api/pubpaid/build` em `20260519-poolfix2`, `node --check`, `npm run guard:pubpaid` e `node .codex-temp/pubpaid-mobileopt-check.mjs` com `failed=[]`, `music=off` e captura `.codex-temp/pubpaid-mobileopt-pool-844x390.png`.

## Atualizacao 2026-05-22 - checkerstourney1

- Damas ganhou modo separado `Torneio`, sem deposito, sem saldo travado, sem escrow e sem backend financeiro.
- Backend cria torneio diario no horario do Acre com 10 chaves `DAMAS-AAAAMMDD-01..10`, check-in, fechamento de chaves e chaveamento single elimination ate 1 campeao.
- Modo teste `tournamentTest=1` mostra as 10 chaves, permite fechar chaves manualmente e simular vencedores para validar o bracket.
- Frontend ganhou painel de torneio no lobby de Damas, entrada por chave/nome, bracket, estado do confronto atual e retorno ao painel apos partida.
- Responsividade ajustada: painel de torneio em retrato mobile fica por cima do gate de orientacao, sem overflow horizontal e com rolagem interna.
- Validacao: `node --check` em `server.js`, `domGameInterface.js`, `tournamentService.js`, `app.js` e `BootScene.js`; `npm run guard:pubpaid`; `/api/pubpaid/build` em `20260522-checkerstourney1`; smoke backend com 10 participantes -> 4 rodadas -> 1 campeao; Playwright desktop/mobile e clique real de chave + entrada pela UI sem erros de console.

## Atualizacao 2026-05-22 - tourneyreg1

- Fluxo do Torneio de Damas virou inscricao real: jogador reserva vaga com conta Google, nome e WhatsApp, recebe Pix/referencia e fica pendente.
- Admin PubPaid agora enxerga inscricoes pendentes do torneio e pode aprovar/rejeitar; a vaga so entra no chaveamento depois da aprovacao manual.
- A vaga aprovada fica vinculada a conta Google/WhatsApp da reserva; o check-in abre 1 hora antes e fecha as 20:00 no Acre.
- Painel publico mostra status `Pix pendente`, bloco do Pix/referencia e instrucao de aguardar aprovacao do admin.
- Validacao: `node --check`, `npm run guard:pubpaid`, `/api/pubpaid/build` em `20260522-gameux1`, smoke API `reserva -> admin pending -> aprovacao -> checked-in`, Playwright desktop mostrando Pix/status e mobile sem overflow/gate por cima.

## Atualizacao 2026-05-22 - gameux1

- Abertura do PubPaid ganhou loader que segura ate assets/cache/fontes/imagens estarem prontos antes da intro.
- Damas e Xadrez agora entram com mesa fixa por padrao; o jogador pode ligar/desligar a rotacao do rival pelo botao `Mesa fixa/Girar rival`.
- Camera recebeu arrasto pela borda da mesa, zoom por roda no desktop, controles de toque no mobile e copy diferente para mobile/desktop.
- Xadrez recebeu botao `Sair/Desistir` dentro da arena fullscreen e HUD lateral compacto, sem sobrepor o tabuleiro.
- Validacao visual: Playwright desktop/mobile confirmou 64 casas, 24 pecas em Damas, 32 pecas em Xadrez, loader escondido apos carregar, `turnYaw=0deg` com mesa fixa, botao de desistir visivel e sem erros de console.
