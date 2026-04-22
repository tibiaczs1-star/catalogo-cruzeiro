# Handoff

Updated: 2026-04-22T05:36:00-05:00

PubPaid 2.0: a abertura usa uma sequencia de 16 frames em `assets/pubpaid/intro/pubpaid-intro-seq-*.jpeg` dentro de `IntroScene`. Os 6 bitmaps originais permanecem preservados e `scripts/generate-pubpaid-intro-inbetweens.py` gera 10 frames intermediarios por interpolacao/crossfade com polimento local. A cinemática foi acelerada e agora o frame final emite `pubpaid:intro-ready` via `window.setTimeout`, mais confiavel que o timer interno do Phaser para abrir o overlay. O painel de termos/Login foi reduzido e alinhado no canto inferior direito; em modo sem Google configurado ele mostra acesso local e libera `Entrar no jogo em teste local`.

Trilha sonora adicionada em `pubpaid-phaser/audio/chipTechSoundtrack.js`: Web Audio 16-bit tech com arpejos, baixo, pad digital, kick, snare/hat de noise e glitches por compasso. A trilha reinicia no topo da intro via `pubpaid:intro-start`, recebe acentos nas transicoes via `pubpaid:intro-frame`, e continua sem resetar na StreetScene. `render_game_to_text` mostra `music=on/off`, `musicStyle=16-bit techno layered` e `musicIntroSynced=yes/no`.

Phaser foi instalado no projeto e copiado para `assets/vendor/phaser.min.js`; `pubpaid-v2.html` carrega esse arquivo local em vez de CDN. `app.js` usa `game.scene.start("ui-scene")` em vez de `game.scene.launch`, e `IntroScene`/`StreetScene` removem listeners de resize no shutdown para evitar erros de console.

Validações: `node --check` passou em `pubpaid-phaser/app.js`, `pubpaid-phaser/audio/chipTechSoundtrack.js`, `pubpaid-phaser/scenes/BootScene.js`, `pubpaid-phaser/scenes/IntroScene.js` e `pubpaid-phaser/scenes/StreetScene.js`; `python -m py_compile scripts/generate-pubpaid-intro-inbetweens.py` passou; `pubpaid-phaser.css` ficou com `brace-balance=0`; Playwright confirmou overlay visível sem erros, `music=on`, `musicIntroSynced=yes` e entrada local chegando em `street-scene, ui-scene` sem erros.

Capturas:

- `output/web-game/full-page-pubpaid-adjust.png`
- `output/web-game/pubpaid-street-after-local-entry.png`
- `output/web-game/pubpaid-intro-seq-contact-sheet.jpg`
- `output/web-game/pubpaid-intro-16frames-overlay.png`
- `output/web-game/pubpaid-16bit-sound-toggle.png`
- `output/web-game/pubpaid-16bit-sound-street.png`
- `output/web-game/pubpaid-sound-synced-intro.png`
- `output/web-game/pubpaid-sound-synced-street.png`

## Next

- Ajustar a StreetScene para ocupar mais a experiência como jogo em tela cheia
- Ajustar timing fino dos 16 frames se a sequencia parecer longa ou curta no navegador do usuario
- Ajustar volume/timbre da trilha se o usuario quiser uma pegada mais pesada, mais melodia ou menos agudo
- Ajustar acentos por frame se o usuario quiser cortes mais fortes ou mais discretos
- Configurar Google real no Render quando o produto sair do modo de teste local
- Continuar minigames/mesa PvP depois que a entrada estiver aprovada visualmente

## Files In Focus

- `pubpaid-phaser/scenes/IntroScene.js`
- `pubpaid-phaser/scenes/BootScene.js`
- `pubpaid-phaser/scenes/StreetScene.js`
- `pubpaid-phaser/audio/chipTechSoundtrack.js`
- `pubpaid-phaser/app.js`
- `pubpaid-v2.html`
- `pubpaid-phaser.css`
- `assets/vendor/phaser.min.js`
- `assets/pubpaid/intro/pubpaid-intro-seq-*.jpeg`
- `scripts/generate-pubpaid-intro-inbetweens.py`
- `package.json`
- `package-lock.json`
