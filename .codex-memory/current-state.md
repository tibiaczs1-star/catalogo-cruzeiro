# Current State

Updated: 2026-05-18T23:18:00.000Z

## Active Goal

- PubPaid 2.0 canonico: parte de jogos fechada localmente, pendente apenas de correções pontuais.

## Summary

Build local atual: 20260518-gamescomplete3. Textos visiveis do PubPaid revisados para portugues; `Lobby`, `Demo`, `Draw Poker`, `Desktop/Mobile`, `PvP real`, `backend` e `escrow` foram removidos dos textos publicos do jogo. Todos os 7 jogos do lobby agora têm `Treino` e `Real`; treinos locais foram adicionados para Xadrez, 21, Pôquer, Truco e Dados, sem ficha, sem saldo travado e sem mexer na carteira. Ultimo ajuste pontual: Sinuca orienta `Use Espaço para jogar`, mobile diz `Celular: toque em Jogar`, o botao touch da Sinuca e `Jogar`, e os botoes mobile globais sao `Caixa` e `Jogar`.

Direcao de arte canonicamente definida: `realistic-host-spritesheet.png` e o anchor oficial. Tudo novo do jogo deve seguir pixel art realista com leitura de sprite, corpo humano crivel, contorno, sombra, roupa detalhada, volume, luz e presenca, pronto para spritesheet/animacao.

## Next

- Se o usuario aprovar
- publicar/deployar 20260518-gamescomplete3.
- Depois do deploy
- validar online rua, salão, carteira/saque e jogos; corrigir apenas problemas pontuais que aparecerem.

## Files In Focus

- pubpaid-phaser/scenes/CharacterSelectScene.js
- pubpaid-phaser/scenes/InteriorScene.js
- pubpaid-phaser/scenes/StreetScene.js
- pubpaid-phaser/services/accountService.js
- pubpaid-phaser/services/pvpService.js
- pubpaid-runtime.js
- pubpaid-admin.html
- pubpaid-phaser.css
- pubpaid-phaser/app.js
- pubpaid-phaser/scenes/BootScene.js
- pubpaid-phaser/ui/domGameInterface.js
- pubpaid-phaser/ui/walletInterface.js
- pubpaid.html
- server.js

## Assets In Focus

- .codex-temp/pixellab-tests/realistic-host-walk-demo/assets/realistic-host-spritesheet.png
- .codex-temp/pubpaid-cleanselect1/02-interior-clean.png
- .codex-temp/pubpaid-withdrawrules1/01-wallet-clean-withdraw-rules.png
- .codex-temp/pubpaid-cardtables1-preview.png
- .codex-temp/pubpaid-gamescomplete2-lobby.png
- .codex-temp/pubpaid-gamescomplete2-poker-demo.png
- .codex-temp/pubpaid-gamescomplete3-pool-controls.png
