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

- Prompt mestre: `.codex-agents/game-director-system/master-prompt.md`
- Fluxo: `.codex-agents/game-director-system/flow.md`
- Estudo inicial: `.codex-agents/game-director-system/study-report-2026-05-18.md`
- Manifestos: `.codex-agents/agents/game-*.md`
- Hierarquia: usuario acima; Codex/Hermes como ferramentas finais de decisao operacional; Diretor do Jogo coordena subagentes.
- Subagentes diretos: arte/design de games, interfaces/HUD, teste/seguranca gamer e linha final.
- Escritorio Nerd pode alimentar conhecimento tecnico, mas nao mistura direcao de jornal/CZS com direcao de jogos.

## Proximo Foco

1. Com permissao do usuario, publicar `20260518-poolspace3` e confirmar online com duas contas Google reais a Sinuca unificada: `Demo` local isolada e `PvP real` com fila, ready duplo, tacada por `Espaco`, tacada autoritativa e saldo real.
2. Testar Damas Demo em aparelho real mobile landscape depois da correcao de captura encadeada: a peça forcada deve permanecer selecionada e a UI deve dizer `Continue a captura`.
3. Continuar polimento visual por jogo, sempre preservando o fluxo financeiro/PvP real.
4. Corrigir o conector Chrome do Codex fora do runtime: extensao instalada, mas falta a chave Windows do native host.

## Ultima Rodada Validada

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
