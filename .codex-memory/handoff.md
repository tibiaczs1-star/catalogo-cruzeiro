# Handoff

Updated: 2026-05-18T23:18:00.000Z

PubPaid 2.0 esta na build local 20260518-gamescomplete3. Parte de jogos fechada localmente: todos os 7 jogos têm `Treino` e `Real`; textos visiveis foram revisados para portugues; treinos locais novos existem para Xadrez, 21, Pôquer, Truco e Dados. Ultimo ajuste pontual: a copy antiga de acao virou `Use Espaço para jogar`, mobile usa `Celular: toque em Jogar`, o botao touch da Sinuca ficou `Jogar`, e os botoes mobile globais ficaram `Caixa` e `Jogar`. Servidor local reiniciado e respondendo 20260518-gamescomplete3. Validado com node --check, npm run guard:pubpaid e Playwright confirmando os textos/botoes sem erros de console.

Direcao de arte obrigatoria registrada: o anchor oficial e `.codex-temp/pixellab-tests/realistic-host-walk-demo/assets/realistic-host-spritesheet.png`. Proximos personagens, NPCs, rua, cenario, props, HUD e animacoes devem parecer da mesma familia: pixel art realista, com leitura de sprite, volume, luz, roupa detalhada, corpo crivel, contorno, sombra e uso real em spritesheet/animacao.

## Next

- Nao publicar online sem permissao do usuario.
- Se publicar
- validar build online se o usuario pedir; a partir daqui tratar como correções pontuais em vez de nova reforma ampla dos jogos.

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

## Related Orders

- 2026-05-18-fixar-realistic-host-spritesheet-como-anchor-oficial-de-arte-pubpaid
- 2026-05-18-remover-nomes-circulos-e-marcadores-do-chao-na-selecao-salao-pubpaid
- 2026-05-18-ajustar-indicadores-discretos-e-regras-de-saque-pubpaid
- 2026-05-18-reformular-jogos-de-cartas-pubpaid-com-mesa-grafica
- 2026-05-18-finalizar-textos-e-treinos-de-todos-os-jogos-pubpaid
- 2026-05-18-ajustar-copy-controles-jogar-pubpaid
