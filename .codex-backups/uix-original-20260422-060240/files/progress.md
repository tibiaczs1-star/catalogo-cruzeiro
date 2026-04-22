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
