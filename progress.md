Original prompt: continuar o protótipo PubPaid 2.0 migrado para Phaser, com responsividade e estrutura definitiva.

## 2026-04-21

- Núcleo Phaser definitivo criado em `pubpaid-phaser.html` e módulos `pubpaid-phaser/`.
- Rua e salão foram separados em scenes próprias, com overlay externo para HUD, prompt e painel.
- Sprites 2D geradas em canvas foram adicionadas para jogador, bartender, cantora e clientes.
- Expostos `window.render_game_to_text()` e `window.advanceTime(ms)` para validação automatizada.
- Próximos TODOs: validar no Playwright, revisar screenshot, ajustar responsividade fina e iniciar sprites animadas/spritesheets.

## 2026-04-21 retomada PubPaid/Escritório Nerd

- Reunião técnica feita: o foco atual é `pubpaid-phaser.html` + `pubpaid-phaser/`, não o monolito antigo.
- Escritório Nerd foi puxado para dentro do núcleo Phaser via `pubpaid-phaser/config/nerdTeam.js`.
- HUD ganhou campo `nerd` e cenas/painéis agora alternam agente em foco conforme o trabalho: Pixo FX, Gabi Avatar, Otto Physics, Beto HUD, Zed Engine e Tami QA.
- Capturas Playwright geradas em `.codex-temp/pubpaid-phaser-review/` para desktop e mobile.
- Bug corrigido: no mobile o HUD estava sendo cortado dentro do canvas shell; voltou a ficar sobreposto e visível.
- Validações: `node --check` passou nos módulos tocados e `pubpaid-phaser.css` ficou com `brace-balance=0`.
- TODO próximo: trocar sprites canvas provisórios por spritesheets reais/animáveis e transformar pelo menos uma mesa em minigame Phaser real.

## 2026-04-22 reunião da fachada PubPaid

- Criada `pubpaid-phaser/scenes/IntroScene.js` como entrada oficial dentro do Phaser, usando a fachada noturna e um letreiro `PUB PAID` vivo como logo do prédio.
- `BootScene` agora carrega a fachada e entra em `intro-scene` em vez de pular direto para `street-scene`.
- `app.js` passou a liberar `StreetScene`/`UIScene` só depois do fluxo de termos + Google; o canvas não é mais escondido durante o onboarding.
- `pubpaid-v2.html` e `pubpaid-phaser.css` foram ajustados para o aceite aparecer como overlay sobre o jogo, no canto inferior direito, sem cobrir a placa principal.
- Validações: `node --check` passou em `IntroScene.js`, `BootScene.js` e `app.js`; `pubpaid-phaser.css` ficou com `brace-balance=0`; `GET /pubpaid-v2.html` respondeu 200; Playwright gerou `.codex-temp/pubpaid-intro-scene-final/shot-0.png` com `scene=intro`, `activeScenes=intro-scene` e sem erro de console.
- TODO próximo: substituir a fachada/placa sobreposta por spritesheet/atlas exportado do pipeline Aseprite/Tiled e deixar o Google com aparência mais diegética dentro da UI do jogo.

## 2026-04-22 abertura com bitmaps do usuario

- Direção corrigida: as 6 imagens enviadas pelo usuario são a montagem real da entrada; a imagem larga de UI é referência para termos/Login, não frame da cinemática.
- Os bitmaps foram copiados para `assets/pubpaid/intro/pubpaid-intro-01.jpeg` até `pubpaid-intro-06.jpeg`.
- `IntroScene.js` foi refeita como timeline cinematográfica: fade entre frames, zoom/pan por frame, flash no celular/neon, shake leve, scanline e congelamento no frame 6.
- `app.js` deixou de abrir overlay no carregamento; a UI só aparece depois de `pubpaid:intro-ready`, emitido quando a sequência termina ou quando Enter/click pula para o frame final.
- `pubpaid-v2.html` e `pubpaid-phaser.css` receberam UI pixel de termos/Login inspirada na referência: painel escuro, borda dourada, checkbox e botão retangular.
- Validações: `node --check` passou em `IntroScene.js`, `BootScene.js` e `app.js`; `pubpaid-phaser.css` ficou com `brace-balance=0`; Playwright gerou `.codex-temp/pubpaid-bitmap-intro-start/shot-0.png` e `.codex-temp/pubpaid-bitmap-intro-final/shot-0.png`, ambos sem arquivo de erro.
- TODO próximo: ajustar timings/posicionamento com o usuario vendo no navegador e continuar a StreetScene em tela cheia após Google.

## 2026-04-22 ajuste de abertura e entrada local

- A cinemática dos 6 bitmaps foi acelerada para chegar ao frame final com mais ritmo.
- O painel de termos/Login ficou menor, alinhado no canto inferior direito em desktop/tablet e com estado visual próprio para teste local.
- `pubpaid-v2.html` passou a carregar Phaser de `assets/vendor/phaser.min.js`, evitando falha quando o CDN externo não abre.
- Quando o Google não está configurado, `app.js` libera o botão `Entrar no jogo em teste local`; no Render com `GOOGLE_AUTH_CLIENT_ID` ativo, o fluxo real continua exigindo Google.
- Corrigidos erros de console: `game.scene.launch` foi trocado pelo método compatível e os listeners de resize das scenes são removidos no shutdown.
- Validações: `node --check` passou em `app.js`, `IntroScene.js` e `StreetScene.js`; `pubpaid-phaser.css` ficou com `brace-balance=0`; Playwright confirmou overlay visível sem erros e entrada local para `street-scene, ui-scene` sem erros.
- Capturas novas: `output/web-game/full-page-pubpaid-adjust.png` e `output/web-game/pubpaid-street-after-local-entry.png`.

## 2026-04-22 frames intermediarios da abertura PubPaid

- Gerados 10 frames intermediarios entre os 6 bitmaps originais, preservando os originais e criando a sequência normalizada `assets/pubpaid/intro/pubpaid-intro-seq-01.jpeg` até `pubpaid-intro-seq-16.jpeg`.
- O script de geração ficou em `scripts/generate-pubpaid-intro-inbetweens.py`, usando Pillow para normalizar, misturar e polir os frames sem depender de CDN ou ferramenta externa.
- `BootScene.js` agora carrega os 16 frames `pubpaid-intro-seq-*`; `IntroScene.js` toca a timeline completa e atualiza a UI/caption para `16 / 16`.
- Capturas novas: `output/web-game/pubpaid-intro-seq-contact-sheet.jpg` e `output/web-game/pubpaid-intro-16frames-overlay.png`.
- Validações: `python -m py_compile scripts/generate-pubpaid-intro-inbetweens.py`, `node --check BootScene.js`, `node --check IntroScene.js`; Playwright aguardou a sequência terminar e confirmou overlay sem erros.

## 2026-04-22 trilha sonora 16-bit tech

- Criado `pubpaid-phaser/audio/chipTechSoundtrack.js`, uma trilha 16-bit sintetizada no navegador com arpejo, baixo, pad digital, kick, snare/hat de noise e glitches por compasso.
- `app.js` liga a trilha no primeiro clique/tecla ou pelo botão `Som 16-bit`, mantendo o estado no `render_game_to_text`.
- `pubpaid-v2.html` recebeu botão de som dentro do palco; `pubpaid-phaser.css` estiliza o toggle com estado `Som ligado`.
- Validações: `node --check` passou em `chipTechSoundtrack.js` e `app.js`; `pubpaid-phaser.css` ficou com `brace-balance=0`; Playwright confirmou `music=on`, botão ligado e transição para `street-scene, ui-scene` sem erros.
- Capturas novas: `output/web-game/pubpaid-16bit-sound-toggle.png` e `output/web-game/pubpaid-16bit-sound-street.png`.

## 2026-04-22 sincronização da trilha com os frames

- A trilha agora reinicia no topo da abertura via evento `pubpaid:intro-start`, marcando `musicIntroSynced=yes` no `render_game_to_text`.
- `IntroScene.js` emite `pubpaid:intro-frame` a cada frame; `chipTechSoundtrack.js` toca acentos/glitches 16-bit nas viradas importantes para bater a musica com a entrada.
- A música deixa de ser extra acionado depois: ela fica armada desde a intro e continua sem resetar na `StreetScene`.
- Validações: `node --check` passou em `chipTechSoundtrack.js`, `app.js` e `IntroScene.js`; CSS segue com `brace-balance=0`; Playwright confirmou intro e rua com `music=on`, `musicIntroSynced=yes`, sem erros.
- Capturas novas: `output/web-game/pubpaid-sound-synced-intro.png` e `output/web-game/pubpaid-sound-synced-street.png`.

## 2026-04-22 gate de permissões antes da intro

- A `BootScene` não inicia mais a `IntroScene` automaticamente; ela fica parada até o usuário tocar em `Ativar e começar`.
- `pubpaid-v2.html` ganhou `data-permission-gate` antes da splash de termos, pedindo som e tela cheia antes da abertura.
- `app.js` agora pede fullscreen no `.ppg-canvas-shell`, destrava o Web Audio com `soundtrack.startIntro()` e só então inicia `intro-scene`.
- O debug passou a mostrar `introStarted=yes/no` e `fullscreen=yes/no`.
- Validações: `node --check` passou em `app.js`, `BootScene.js` e `chipTechSoundtrack.js`; CSS ficou com `brace-balance=0`; Playwright confirmou antes `music=off/introStarted=no`, depois `music=on/musicIntroSynced=yes/fullscreen=yes`.

## 2026-04-22 cheffe-call game shell

- O usuario aprovou transformar `cheffe-call` em experiencia de jogo fullscreen e pediu para chamar nerds/especialistas em game design para a reuniao de direcao.
- Reuniao de subagentes fechou a direcao: teatro dominante na viewport, data center vivo como subsolo, HUD fina nas bordas e decks/logs recolhiveis.
- `cheffe-call.html` ganhou acoes de shell no topo (`Tela cheia`, `HUD`, `Decks`) e os paineis inferiores foram agrupados em `call-lower-decks`.
- `cheffe-call.css` recebeu camada forte de overrides `2026-04-22e` para virar shell de jogo fullscreen: palco central expandido, HUD lateral compacta, subsolo vivo com racks/terminais/trabalhadores, e deck inferior fixo/recolhivel.
- `cheffe-call.js` ganhou toggles de tela cheia/HUD/decks, atalhos de teclado (`f`, `h`, `l`, `c`, `n`, `a`, `i`, `t`), alem de `window.render_game_to_text()` e `window.advanceTime(ms)` para validacao estilo web-game.
- Validacoes locais desta rodada: `node --check cheffe-call.js`, `brace-balance=0` em `cheffe-call.css` e contagem de `<section>` equilibrada em `cheffe-call.html`.
- TODO seguinte: abrir o `cheffe-call` no navegador e validar visualmente a shell fullscreen; depois separar a cena central em modulo de jogo hibrido DOM + Phaser/canvas, com arte propria para teatro e data center.

## 2026-04-23 cheffe-call command bar + scene canvas

- `cheffe-call.html` agora inclui `canvas` de cena (`#cheffeCallGameCanvas`) e `call-command-bar` fixa no rodape para ordem rapida.
- `cheffe-call-game.js` foi criado para dar respiracao de jogo a cena: particulas, shafts, trafego de dados, pulso de palco e onda de subsolo reagindo ao estado do speaker/HUD/decks.
- `cheffe-call.js` passou a sincronizar a command bar com o formulario principal, expor eventos `cheffe-call:scene-state` para o canvas e manter atalhos/estado da shell.
- `cheffe-call.css` recebeu a camada visual da command bar, empilhamento correto do canvas e mais refinamento na composicao fullscreen.
- Revisoes visuais reais geradas em `output/playwright/cheffe-call-fullscreen-check.png` ate `cheffe-call-fullscreen-check-5.png`; a ultima captura confirma command bar fixa, HUDs sobrepostos e cena central viva.
- Validacoes locais desta passada: `node --check cheffe-call.js` passou varias vezes, `brace-balance=0` no CSS e `GET http://127.0.0.1:4123/cheffe-call.html` segue `200`.
- Pendencia real que sobrou para elevar mais ainda: trocar os bitmaps reaproveitados por arte propria do teatro/data center ou entrar com modulo Phaser mais completo na area central.
- Capturas novas: `output/web-game/pubpaid-permission-gate.png` e `output/web-game/pubpaid-permission-started.png`.

## 2026-04-22 intro premium com luzes e camera

- A timeline da abertura foi desacelerada para 10,26s mantendo os 16 frames existentes.
- `IntroScene.js` ganhou direção visual extra: pulsos de luz por frame, glow no celular, varredura neon, raios de luz, partículas/glints digitais, letterbox e micro-zoom/shake de câmera.
- Os eventos de áudio continuam sincronizados com os frames, e a música segue para a StreetScene sem reset.
- Validações: `node --check pubpaid-phaser/scenes/IntroScene.js` passou; duração calculada `frames=16 durationMs=10260 durationSec=10.26`; Playwright confirmou fullscreen, música, overlay final e zero erros.
- Capturas novas: `output/web-game/pubpaid-premium-intro-lights-mid.png` e `output/web-game/pubpaid-premium-intro-lights-overlay.png`.

## 2026-04-22 transicao premium rua salao

- `StreetScene.js` ganhou transição premium de entrada com fade, veil, label diegética e glow reforçado na porta quando o jogador está em alcance.
- A porta continua clicável só para marcar aproximação; a travessia para o salão agora acontece apenas via `Enter`.
- `InteriorScene.js` ganhou a volta premium para a rua, com fade correspondente e pulso verde na saída.
- Validações: browser runtime confirmou `street -> interior -> street` sem erros, com `ERRORS=[]` e `scene=interior` só depois da rotina de entrada; o fluxo de ida e volta fechou em `http://127.0.0.1:4093/pubpaid-v2.html`.

## 2026-04-22 salao premium pass

- `InteriorScene.js` foi polida para casar com a rua: palco com beams e orb, névoa de lounge, reflexos no piso, bands de luz e hotspots diegéticos para bar, palco, lounge, premium e saída.

## 2026-04-23 fluxo correto e jogos separados

- O fluxo da `PubPaid 2.0` foi corrigido para: intro -> rua -> porta -> salão -> garçom -> lobby -> oponente -> aposta -> confirmação -> tela própria do jogo.
- `GameLobbyScene.js` virou o lobby oficial com seleção Dardos/Dama, aposta, adversário IA e confirmação.
- Foram adicionados fundos bitmap pixel art/2D para lobby, sala de Dardos e sala de Dama em `assets/pubpaid/lobby/`.
- Criada `DartsGameScene.js`: alvo clicável, mira, arremesso do jogador, resposta da IA, três rodadas, placar, resultado e botões de lobby/salão.
- Criada `CheckersGameScene.js`: tabuleiro grande, seleção de peça, movimentos, capturas simples, coroação, resposta da IA, condição de vitória/derrota/empate e botões de lobby/salão.
- `app.js`, `gameState.js` e `render_game_to_text()` agora expõem `dartsGame` e `checkersGame` para debug textual.
- Validações estáticas: `node --check` passou para `DartsGameScene.js`, `CheckersGameScene.js`, `GameLobbyScene.js`, `app.js` e `gameState.js`.
- TODO próximo: quando o usuário pedir teste visual, rodar Playwright no fluxo completo e refinar input/legibilidade; depois conectar essas cenas ao settlement real da carteira/PvP.

## 2026-04-23 correção do salão pelo garçom

- Removidas as zonas antigas de jogo dentro do salão (`west/east`, Dardos/Dama/PvP como interação interna).
- O garçom voltou para o centro do salão como NPC pequeno e clicável/aproximável.
- Enter perto do garçom agora abre diretamente `game-lobby-scene`.
- O lobby agora abre como catálogo do garçom quando vem do salão: Dardos e Dama são opções clicáveis; só depois aparecem aposta, busca de oponente e confirmação.
- `pubpaid-v2.html` ganhou cache-bust `20260423waiterlobby`.
- Validações: `node --check` passou para `InteriorScene.js`, `GameLobbyScene.js` e `app.js`; `rg` não encontrou mais `west/east`, `fetchPvpState` ou ações de lobby antigas dentro do salão.

## 2026-04-23 garçom em sprite PNG

- Reunião rápida com agentes de direção de arte e UX/game flow definiu: personagem agora deve ser sprite PNG, e não render procedural/canvas.
- Gerados e integrados dois sprites transparentes do garçom:
  - `assets/pubpaid/characters/waiter-salon-small-v1.png`
  - `assets/pubpaid/characters/waiter-lobby-large-v1.png`
- `BootScene.js` carrega os dois PNGs como `ppg-waiter-hero-sprite` e `ppg-waiter-lobby-sprite`.
- `spriteFactory.js` parou de registrar o garçom por canvas.
- `InteriorScene.js` usa o sprite pequeno no centro do salão.
- `GameLobbyScene.js` usa o sprite grande no lobby, com janela de fala/instrução do garçom.
- `pubpaid-v2.html` ganhou cache-bust `20260423waitersprite`.
- Validações: `node --check` passou para `spriteFactory.js`, `BootScene.js`, `InteriorScene.js` e `GameLobbyScene.js`.

## 2026-04-23 lobby com garçom falando e público

- Gerado novo fundo `assets/pubpaid/lobby/pubpaid-lobby-bg-v2-crowd.png` com pub pixel art, pessoas sentadas/bebendo/dançando e espaço central limpo para garçom/HUD.
- Gerada variante `assets/pubpaid/characters/waiter-lobby-speaking-v1.png` com a boca aberta, mantendo o mesmo garçom.
- `BootScene.js` agora carrega o novo fundo de lobby e `ppg-waiter-lobby-speaking-sprite`.
- `GameLobbyScene.js` alterna a textura do garçom entre boca fechada e boca aberta enquanto ele fala.
- O lobby foi aproximado da referência: título `ESCOLHA SUA MESA`, fala do garçom e dois cards grandes `Dama`/`Dardos` na parte inferior/esquerda com visual de HUD.
- `pubpaid-v2.html` ganhou cache-bust `20260423talkingwaiter`.
- Validações: `node --check` passou para `spriteFactory.js`, `BootScene.js` e `GameLobbyScene.js`.

## 2026-04-23 cantora no lobby

- Gerada `assets/pubpaid/characters/singer-lobby-v1.png`, cantora pixel art PNG transparente no mesmo acabamento do garçom.
- `BootScene.js` carrega `ppg-singer-lobby-sprite`.
- `GameLobbyScene.js` posiciona a cantora no canto direito/lateral do lobby com brilho e idle vertical leve, sem cobrir garçom/cards.
- `pubpaid-v2.html` ganhou cache-bust `20260423lobbysinger`.
- Validações: `node --check` passou para `spriteFactory.js`, `BootScene.js` e `GameLobbyScene.js`.
- Os hotspots do salão agora seguem a mesma lógica da rua: clique aproxima, `Enter` interage, e o foco visual muda conforme a proximidade.
- `StreetScene.js` e `InteriorScene.js` passaram a chamar `ensureCoreSprites(this)` localmente para não depender só do bootstrap no registro das texturas base.
- Validações: `node --check` passou em `StreetScene.js` e `InteriorScene.js`; captura nova em `output/web-game/pubpaid-salao-premium-pass.png`; runtime sem console error (`ERRORS=[]`).
- Observação para a próxima rodada: os atores do salão ainda merecem spritesheets melhores, porque os placeholders atuais agora são o elemento mais fraco da cena.

## 2026-04-22 atores pixel lindosos

- `spriteFactory.js` recebeu sprites pixel art maiores e mais detalhados para player, bartender, cantora e clientes: cabelo, rosto, roupa, outline, sombra e brilho por personagem.
- A fábrica de sprites agora remove e recria as texturas base quando a scene sobe, evitando cache antigo ou fallback de textura quebrada.
- `InteriorScene.js` ganhou `addActor()` com glow e microanimação de respiração/pulso para bartender, cantora e clientes.
- Captura visual nova: `output/web-game/pubpaid-sprites-lindosos-v2.png`.
- Validações: `node --check` passou em `spriteFactory.js`, `InteriorScene.js` e `StreetScene.js`; browser confirmou textura `ppg-player-sprite` com tamanho `64x92`, sem console errors; interação do salão e transição de saída continuam funcionando.

## 2026-04-22 musica do salao samba hiphop

- `chipTechSoundtrack.js` agora tem zonas musicais: `street` mantém a trilha 16-bit techno e `salon` troca para samba brasileiro com hip-hop em 16-bit.
- O modo do salão adiciona surdo/kick sincopado, rimshot/pandeiro sintético, plucks tipo cavaquinho e baixo hip-hop.
- `StreetScene.js` emite `pubpaid:music-zone` como `street`; `InteriorScene.js` emite `salon`; `app.js` aplica `soundtrack.setZone(zone)`.
- `render_game_to_text()` passou a expor `musicZone`.
- Validações: `node --check` passou em áudio, app e scenes; browser confirmou `musicStyle=16-bit samba brasileiro hip-hop` no salão e retorno para `16-bit techno layered` na rua, com `ERRORS=[]`.

## 2026-04-22 salao neon max

- `InteriorScene.js` recebeu passe visual forte no salão: glows de neon na parede, brilho de máquinas, jukebox e bar, lasers animados no palco, scanlight horizontal, partículas coloridas e reflexos extras no piso.
- A intensidade foi ajustada em duas rodadas para ficar perceptível sem cobrir personagens, hotspots ou mesas.
- Capturas: `output/web-game/pubpaid-salao-neon-max.png` e `output/web-game/pubpaid-salao-neon-max-v2.png`.
- Validações: `node --check pubpaid-phaser/scenes/InteriorScene.js`; browser confirmou `scene=interior`, `musicZone=salon`, `musicStyle=16-bit samba brasileiro hip-hop` e `ERRORS=[]`.

## 2026-04-23 cheffe-call ponte operacional real

- server.js ganhou POST /api/cheffe-call/action, trilha de logs/decisoes/aprovacoes por sessao e sincronizacao da Cheffe Call com eal-agents-actions.json e office-orders.json.
- uildCheffeCallPayload() agora devolve meeting.currentSession com logs, decisions, pprovals e ctionStats, permitindo a sala refletir estado operacional real.
- cheffe-call.js passou a hidratar fila/logs vindos do backend, usar a senha para transformar pprove, implement, 	ask, 	erminal e efresh em acoes reais e adicionou o botao Atualizar na command bar.
- Validacao operacional local: POST /api/cheffe-call/action com efresh registrou log de runtime; pprove para Bento Producer gravou aprovacao/decisao na sessao e marcou a acao correspondente como provado em data/real-agents-actions.json.
- Captura nova: output/playwright/cheffe-call-operational-bridge.png mostrando fila ativa e registro das falas preenchidos pela ponte operacional.
- Proximo ganho grande: levar mais dessas acoes do palco para execucao automatica por tipo de agente, em vez de parar em ordem/fila/revisao.


## 2026-04-23 cheffe-call premium stage + office lock polish

- O teatro ganhou marquise de bulbs, notas musicais flutuando, lasers/spots/equalizer mais fortes e os pets ficaram mais visiveis nos cantos.
- scritorio.html, scritorio.js e scritorio.css agora mostram um banner proprio de Cheffe Call ativa e deixam o mapa mais escurecido/fechado quando a equipe saiu para a reuniao.
- A rodada reforcou a fantasia de palco premium e a leitura de que os escritorios entram em pausa enquanto a sala principal assume o comando.


2026-04-23 cheffe-call premium theater polish + real office lock validation
- finalizei spot-c e showline do palco premium
- validei cheffe-call em http://127.0.0.1:4126/cheffe-call.html e escritório travado em http://127.0.0.1:4126/escritorio.html
- capturas: output/playwright/cheffe-call-fullscreen-finish-v3.png e output/playwright/escritorio-cheffe-locked-real.png

## 2026-04-23 cheffe-call admin deploy functional

- `server.js` agora blinda a Cheffe Call para deploy: `/api/cheffe-call` responde `ok: true` mesmo sem `latest-run`, usando fallback operacional até a runtime real entrar.
- `getCheffeCallOpinions()` ganhou equipe-base de fallback para a sala continuar viva quando não houver payload real dos agentes.
- Foi criado `POST /api/cheffe-call/admin/clear`, protegido por Full Admin, para limpar a sessão atual sem derrubar a página.
- `cheffe-call.html` ganhou um painel administrativo dedicado com status de runtime, status da sessão, última ação e botões reais para rodar agentes, encerrar reunião, limpar sessão, exportar snapshot e abrir `real-agents.html`.
- `cheffe-call.js` passou a renderizar o estado administrativo e acionar `/api/real-agents/run`, `/api/cheffe-call/release` e `/api/cheffe-call/admin/clear`.
- Cache-bust atualizado para `20260423admin-functional` em `cheffe-call.html`.
- Validações desta passada: `node --check server.js`, `node --check cheffe-call.js`, `node --check cheffe-call-game.js`, `brace-balance=0` em `cheffe-call.css`, `GET /api/cheffe-call` com `ok=true`, `POST /api/cheffe-call/admin/clear` com `401` sem senha e `200` com senha, `POST /api/real-agents/run` com `200`.
- TODO seguinte: se o usuário pedir deploy, revisar o `git diff`, separar ruído de `data/` e `output/`, e então preparar commit/push desta frente; depois voltar ao mapeamento fino de avatar/cadeira.

## 2026-04-24 cheffe-call seat center

- Ajustei a plateia da Cheffe Call para os agentes ficarem no centro das cadeiras: `cheffe-call.js` agora zera o deslocamento lateral por assento, reduz o deslocamento vertical e aumenta a escala base dos avatares.
- `cheffe-call.css` centraliza sprite e token/foto no meio da cadeira, baixa levemente o topo do sprite e mantém destaque maior para agente falando/mão levantada/implementando.
- `cheffe-call.html` recebeu cache-bust `20260424-seat-center`.
- Validações: `node --check cheffe-call.js`, `node --check cheffe-call-game.js`, `brace-balance=0` em `cheffe-call.css`, `GET /cheffe-call.html` local retornou `200`.
- Limitação: screenshot automática por `npx @playwright/cli` e Chrome/Edge headless falhou por permissão/elevacão no Windows; validar no navegador real se ainda precisa microajuste de `top` ou `seatScale`.

