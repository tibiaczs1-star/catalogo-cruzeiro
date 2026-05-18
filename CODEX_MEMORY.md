# Codex Memory - Estado Vivo

Atualizado: 2026-05-18

## Regra De Existencia

So existe um projeto de jogo PubPaid no Codex: o PubPaid 2.0 canonico, servido por `/pubpaid.html`.

O nome publico pode continuar PubPaid, mas tecnicamente nao ha PubPaid 1.0 ativo, demo separada, rota antiga de trabalho ou laboratorio anexado ao runtime.

## Canon PubPaid

- URL canonica: `/pubpaid.html`
- Compatibilidade antiga: `/pubpaid-v2.html` redireciona para `/pubpaid.html`
- Runtime: `pubpaid-phaser/`
- Shell: `pubpaid.html`
- Estilo: `pubpaid-phaser.css`
- Backend: `server.js`
- Carteira: `pubpaid-runtime.js` e `data/pubpaid-store.json`
- PvP: `data/pubpaid-pvp.json`
- Admin: `pubpaid-admin.html`

## O Que Virou Lixo

- `pubpaid-v2.js`, `pubpaid-v2.css` e `pubpaid-phaser.html` foram removidos.
- Prompts, relatorios, screenshots antigas, jogo externo de roleta e artefatos de validacao antigos foram removidos do Git.
- `CODEX_MEMORY.md`, `.codex-memory/current-state.md`, `.codex-memory/handoff.md`, `.codex-memory/orders.json`, `.codex-memory/assets.json` e `progress.md` foram reduzidos para o estado vivo atual.

## Regras De Trabalho

- Modo economico por padrao: leitura minima, respostas curtas e validacao proporcional.
- Nao abrir memorias extensas, docs grandes, auditorias ou varreduras amplas sem necessidade clara do pedido.
- Gastar contexto pesado apenas em PubPaid, homepage/CZS, deploy, revisao grande ou mudanca com risco real.
- Tratar jogo como jogo e site como site: estao no mesmo repo, mas sao frentes diferentes.
- Nao aplicar agentes, regras editoriais, revisao de cards/homepage ou contexto do site ao jogo, exceto se o usuario pedir explicitamente.
- Nao usar demo money nem IA local como prova de PvP.
- Demo local e permitido apenas como treino/teste visual separado, sem ficha, sem escrow, sem carteira e sem alterar saldo.
- Nao considerar teste API isolado como prova de jogo real.
- Validar PvP em duas sessoes autenticadas diferentes sempre que mexer no fluxo.
- Nao usar laboratorio, criador de imagem, prompt antigo ou screenshot antiga como fonte de verdade.
- Antes de validar PubPaid: `npm run guard:pubpaid`.

## Sistema Diretor De Jogos

- Skill global: `game-director-general`
- Prompt mestre: `.codex-agents/game-director-system/master-prompt.md`
- Fluxo: `.codex-agents/game-director-system/flow.md`
- Estudo inicial: `.codex-agents/game-director-system/study-report-2026-05-18.md`
- Manifestos: `.codex-agents/agents/game-*.md`
- Hierarquia: usuario acima; Codex/Hermes como ferramentas finais; Diretor Geral coordena; Conselho Tecnico Nerd alimenta; Diretor do Jogo lidera operacao; subagentes executam/revisam.
- Subagentes diretos: arte/design de games, interfaces/HUD, teste/seguranca gamer e linha final.
- Escritorio Nerd pode alimentar conhecimento tecnico, mas nao mistura direcao de jornal/CZS com direcao de jogos.
- Erros e acertos em jogos devem virar loop de aprendizado/reaprendizado antes de repetir implementacao.

## Direcao De Arte PubPaid

- Anchor oficial de arte: `.codex-temp/pixellab-tests/realistic-host-walk-demo/assets/realistic-host-spritesheet.png`.
- Tudo novo deve parecer da mesma familia desse personagem: pixel art com leitura de sprite, mas volume, roupa, luz, proporcao e presenca super realistas.
- Nao aceitar arte chibi simples, cubo, cartoon infantil, pixel art flat demais ou pintura HD borrada.
- Criterio pratico: pixel art realista com contorno, sombra, roupa detalhada, corpo humano crivel e estrutura pronta para spritesheet/animacao.
- Personagens e NPCs devem ser adultos, expressivos, em escala e detalhamento coerentes com o anchor, com pose natural.
- Rua, cenario e props devem seguir pixel art realista com luz, textura, profundidade, volume e material legivel.
- HUD deve parecer premium e especifico do PubPaid, sem cara generica.
- Animacoes devem usar poucos frames, mas com peso realista e pes bem ancorados.

## Proximo Foco

1. Com permissao do usuario, publicar `20260518-poolspace3` e confirmar online com duas contas Google reais a Sinuca unificada: `Demo` local isolada e `PvP real` com fila, ready duplo, tacada por `Espaco`, tacada autoritativa e saldo real.
2. Testar Damas Demo em aparelho real mobile landscape depois da correcao de captura encadeada: a peça forcada deve permanecer selecionada e a UI deve dizer `Continue a captura`.
3. Continuar polimento visual por jogo, sempre preservando o fluxo financeiro/PvP real.
4. Corrigir o conector Chrome do Codex fora do runtime: extensao instalada, mas falta a chave Windows do native host.

## Ultima Rodada Validada

- Build local: `20260518-gamescomplete3`.
- Ajuste pontual de controles PubPaid: a Sinuca agora mostra `Use Espaço para jogar`; no celular mostra `Celular: toque em Jogar`; o botão touch da Sinuca ficou `Jogar`; os botões mobile globais ficaram `Caixa` e `Jogar`.
- Validação local: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260518-gamescomplete3`; `node --check`; `npm run guard:pubpaid`; Playwright confirmou os textos/botoes e gerou `.codex-temp/pubpaid-gamescomplete3-pool-controls.png` sem erros de console.

- Build local: `20260518-gamescomplete2`.
- Parte de jogos PubPaid fechada localmente: todos os 7 jogos do lobby têm `Treino` e `Real`.
- Treinos locais novos adicionados para `Xadrez`, `21`, `Pôquer`, `Truco` e `Dados`; os treinos não usam ficha, não travam saldo e não mexem na carteira. Sinuca e Damas preservam seus treinos existentes.
- Textos visíveis revisados para português: removidos termos públicos como `Lobby`, `Demo`, `Draw Poker`, `Desktop/Mobile`, `PvP real`, `backend` e `escrow` dos arquivos do jogo conferidos.
- Validação local: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260518-gamescomplete2`; `node --check`; `npm run guard:pubpaid`; `git diff --check`; Playwright confirmou 7 botões `Treino`, treino de Pôquer abrindo sem erros de console e sem vazamento dos termos buscados.

- Build local: `20260518-cardtables1`.
- Jogos de cartas PubPaid: primeira reforma visual/fluxo aplicada em `21`, `Poker` e `Truco`. O lobby ganhou o card `21`; as mesas agora usam DOM tematico com feltro, cartas com naipe/cantos/pip, verso para cartas ocultas, area do rival, area central e mao do jogador.
- Poker: fluxo visual de segurar/trocar cartas com mão do rival virada e botao `Trocar cartas soltas`.
- Truco: fluxo visual com placar, mao atual, cartas na mesa e cartas ja jogadas.
- 21: fluxo visual com total da mao, cartas do rival parcialmente ocultas e acoes `Comprar carta` / `Parar`.
- Os subagentes chamados para auditoria/UX bateram limite de uso; a implementacao continuou localmente.
- Validacao local: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260518-cardtables1`; `node --check` em `domGameInterface.js`, `pvpService.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; Playwright gerou `.codex-temp/pubpaid-cardtables1-preview.png` sem erros de console.

- Build local: `20260518-withdrawrules1`.
- Carteira PubPaid: removido o cartão inclinado `PubPaid Pay`; no lugar ficou um aviso simples e discreto sobre saques.
- Saque PubPaid: agora exige chave Pix e nome da conta Pix, limita o pedido ao saldo livre, envia o pedido para conferencia do admin, informa prazo de ate 2 horas e deixa claro que o Pix so cai depois da conferencia do nome da conta Pix.
- Indicadores do jogo: rua/porta de entrada e garçom receberam bolinhas pequenas e discretas de interação, sem voltar com nomes/circulos grandes no chão.
- Validacao local: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260518-withdrawrules1`; `node --check` em `server.js`, `pubpaid-runtime.js`, `accountService.js`, `walletInterface.js`, `StreetScene.js`, `InteriorScene.js`, `app.js`, `BootScene.js` e `domGameInterface.js`; `npm run guard:pubpaid`; `git diff --check`; Playwright da carteira confirmou bloqueio de saque acima do saldo livre sem erros de console.

- Build local: `20260518-cleanselect1`.
- Limpeza visual pontual: removidos nomes, circulos, bolas/aneis de hotspot e indicador do garçom no chão do salão; a seleção de avatar também perdeu o piso/label `AVATAR 1/2` e a barra de marcação no chão.
- As áreas clicáveis continuam funcionando, mas sem desenho por cima do piso.
- Validação local: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260518-cleanselect1`; `node --check` em `CharacterSelectScene`, `InteriorScene`, `app`, `BootScene`, `domGameInterface`, `walletInterface` e `server`; `npm run guard:pubpaid`; Playwright abriu o salão limpo sem erros de console.

- Build local: `20260518-blackfix1`.
- Corrigida a tela/bloco preto que aparecia logo depois de apertar `Entrar`: a causa era uma mascara antiga da `IntroScene` para esconder texto removido, cobrindo o topo/esquerda da intro.
- A mascara foi removida e a versao de cache/build foi atualizada para `20260518-blackfix1`.
- Validacao local: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260518-blackfix1`; `node --check` em `IntroScene`, `app`, `BootScene`, `domGameInterface`, `walletInterface` e `server`; `npm run guard:pubpaid`; Playwright confirmou `Entrar -> intro limpa -> character-select` sem erros de console.

- Build local: `20260518-entryflow1`.
- UI de entrada limpa: removido o bloco visual de objetivo/prompt em desktop e mobile, removido o texto `Tocar para intro`, o botao principal agora mostra `Entrar`, o overlay `ENTER GAME` da intro foi removido e a zona de entrada da rua foi movida para a porta real sob o letreiro PubPaid sem circulo/marcador no chao.
- Fluxo de entrada: o botao `Entrar` agora reinicia a intro mesmo quando ela ja rodou antes; ao terminar, a intro dispara a entrada no jogo automaticamente sem exigir outro clique.
- Sinuca Demo e PvP: caçapas ficaram mais tolerantes, a deteccao acontece antes da parede rebater a bola e tambem considera o caminho entre frames para tacadas rapidas nao atravessarem a boca.
- Validacao local: `node --check` em app, BootScene, IntroScene, StreetScene, PoolGameScene, domGameInterface, walletInterface e server; `npm run guard:pubpaid`; HTML local sem `Tocar para intro`/`objetivo`; screenshot local sem overlay `ENTER GAME`; Playwright confirmou botao `Entrar`, fluxo `Entrar -> intro -> character-select/street`, porta sem marcadores visuais e as 6 caçapas encaçapando tacada rapida.

- Build local: `20260518-withdrawpix1`.
- Saque PubPaid agora exige chave Pix alem do valor: o formulario coleta a chave, o cliente bloqueia pedido sem Pix, o backend rejeita falta de Pix com `400`, grava `pixKey` no saque/campo `destination`/campo `payment` e devolve a chave no historico da carteira e na dashboard admin.
- Validacao local: `node --check` em `server.js`, `pubpaid-runtime.js`, `accountService.js` e `walletInterface.js`; `npm run guard:pubpaid`; `git diff --check`; teste API isolado em servidor temporario confirmou `400` sem Pix, `201` com Pix, chave no historico e saldo travado corretamente.

- Build local: `20260518-poolspace3`.
- Sinuca Demo e Sinuca PvP real agora usam o mesmo controle: no desktop, `Espaco` trava a mira, `Espaco` inicia a barra de forca e `Espaco` solta o taco; no mobile, controles laterais fazem as mesmas etapas por toque.
- Mesa da Sinuca foi centralizada e recebeu instrucao lateral `como jogar`; o mobile nao depende do botao inferior para tacar.
- Validacao local: `node --check` em `domGameInterface.js` e `PoolGameScene.js`, `npm run guard:pubpaid`, Playwright da Demo em desktop/mobile e PvP real com duas sessoes autenticadas. O PvP registrou `moveCount=1`, W.O. e settlement `108 x 90` a partir de `100 x 100`.

- Build local: `20260518-poolmodes1`.
- Sinuca virou uma unica mesa no lobby com dois caminhos internos: `Demo` e `PvP real`.
- `Demo` da Sinuca usa a cena fisica local, sem ficha, sem escrow e sem tocar na carteira; `PvP real` usa arena DOM dedicada, fila real, ready duplo e tacada calculada no backend.
- Validacao local com backend real isolado e duas sessoes autenticadas: Sinuca passou `waiting -> readying -> active`, aceitou tacada `/api/pubpaid/pvp/pool/shot`, finalizou por W.O. e liquidou carteiras em `108 x 90` a partir de `100 x 100`.
- Damas Demo mobile nao estava quebrando o motor: a falsa trava vinha de captura obrigatoria em cadeia sem feedback suficiente. Agora a peça forcada e auto-selecionada, a jogada legal fica destacada e a tela mostra `Continue a captura`.
- Playwright mobile landscape reproduziu 35 lances de Damas Demo depois da correcao sem travar; no ponto da captura em cadeia havia `forcedPiece`, 1 alvo valido e status explicito de continuidade.

- Build online: `20260518-checkersmodes2`.
- Damas agora e um unico card no lobby com dois caminhos internos: `Demo` e `PvP real`.
- `Demo` cria treino local contra maquina sem backend PvP, sem ficha, sem escrow, sem carteira e sem alterar saldo.
- `PvP real` limpa qualquer estado da demo antes de entrar na fila real; smoke online confirmou `checkersGame=none`, `pvpStatus=waiting`, `pvpGameId=checkers` e `join` chamado uma unica vez para Damas.
- Validado local e online com Google/carteira mockados: lobby tem 1 card de Damas, 1 botao Demo, 1 botao PvP real, 0 cards antigos separados, 64 casas no tabuleiro, sem overflow e sem erros de console.
- Commits publicados: `3715a553` unificou Damas Demo/PvP; `f237a3a5` limpou o estado da demo antes do PvP.

- Build local: `20260517-mobilefix1`.
- Mobile voltou a ter regra horizontal: portrait mostra gate de orientacao e nao abre intro/jogo antes de virar.
- Botao `Ligar som` deixou de abrir o jogo; com Google confirmado, o fluxo esperado e tocar no card/botao para abrir a intro.
- Damas Demo manteve treino local sem ficha/saldo, removeu grafico de mao, ganhou fundo de arena, pecas quadradas, placar mais visual, som de movimento e suporte melhor a tap.
- Layout de Damas em mobile landscape foi compactado para manter tabuleiro, score e botoes dentro do viewport, sem scroll.
- Teste Playwright local validou desktop, mobile landscape e mobile portrait; teste com Google mockado confirmou `Tocar para intro` e que audio nao inicia a intro.
- Online Render confirmou `/api/pubpaid/build` em `20260517-mobilefix1`; smoke online mobile landscape com Google mockado abriu intro pelo botao, manteve audio separado, moveu Damas Demo por tap, sem mao e sem overflow.
