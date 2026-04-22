# Current State

Updated: 2026-04-22T05:36:00-05:00

## Active Goal

- PubPaid 2.0 com abertura em 16 frames, trilha 16-bit tech, painel final ajustado e entrada local de teste

## Summary

A abertura correta da PubPaid 2.0 segue em `IntroScene`, agora com uma sequencia normalizada de 16 frames: os 6 bitmaps originais do usuario mais 10 frames intermediarios gerados localmente por `scripts/generate-pubpaid-intro-inbetweens.py`. O frame final congela e o painel de termos/Login fica menor e alinhado no canto inferior direito em desktop/tablet. A trilha sonora fica em `pubpaid-phaser/audio/chipTechSoundtrack.js`, sintetizada em Web Audio com arpejos, baixo, pad digital, bateria noise e glitches 16-bit. Ela reinicia no topo via `pubpaid:intro-start`, recebe acentos por `pubpaid:intro-frame`, marca `musicIntroSynced=yes` e continua sem resetar na StreetScene. O Phaser deixou de depender de CDN e carrega de `assets/vendor/phaser.min.js`. Quando Google nao esta configurado, o fluxo mostra estado de teste local e libera `Entrar no jogo em teste local`; quando o Google estiver configurado no Render, o fluxo real continua exigindo login.

## Next

- Ajustar timing fino da sequencia de 16 frames se o usuario achar longa ou curta
- Ajustar volume/timbre da trilha se o usuario quiser mais peso, mais melodia ou menos agudo
- Ajustar acentos por frame se o usuario quiser cortes mais fortes ou mais discretos
- Se o usuario pedir, ajustar ainda mais posicao/tamanho do painel conforme a referencia visual
- Evoluir a StreetScene para experiencia mais full-screen e menos pagina/documento
- Ligar Google real no Render com `GOOGLE_AUTH_CLIENT_ID` e `SITE_AUTH_SESSION_SECRET`

## Files In Focus

- assets/vendor/phaser.min.js
- assets/pubpaid/intro/pubpaid-intro-01.jpeg
- assets/pubpaid/intro/pubpaid-intro-02.jpeg
- assets/pubpaid/intro/pubpaid-intro-03.jpeg
- assets/pubpaid/intro/pubpaid-intro-04.jpeg
- assets/pubpaid/intro/pubpaid-intro-05.jpeg
- assets/pubpaid/intro/pubpaid-intro-06.jpeg
- assets/pubpaid/intro/pubpaid-intro-seq-01.jpeg
- assets/pubpaid/intro/pubpaid-intro-seq-16.jpeg
- scripts/generate-pubpaid-intro-inbetweens.py
- pubpaid-phaser/scenes/IntroScene.js
- pubpaid-phaser/scenes/StreetScene.js
- pubpaid-phaser/audio/chipTechSoundtrack.js
- pubpaid-phaser/app.js
- pubpaid-v2.html
- pubpaid-phaser.css
- package.json
- package-lock.json

## Assets In Focus

- output/web-game/full-page-pubpaid-adjust.png
- output/web-game/pubpaid-street-after-local-entry.png
- output/web-game/pubpaid-intro-seq-contact-sheet.jpg
- output/web-game/pubpaid-intro-16frames-overlay.png
- output/web-game/pubpaid-16bit-sound-toggle.png
- output/web-game/pubpaid-16bit-sound-street.png
- output/web-game/pubpaid-sound-synced-intro.png
- output/web-game/pubpaid-sound-synced-street.png
