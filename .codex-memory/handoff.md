# Handoff

Updated: 2026-04-27T21:25:00.000Z

PubPaid 2.0 retomado localmente. Sempre entregar o endereco ao usuario: `http://127.0.0.1:3000/pubpaid-v2.html`.

Fluxo atual: primeira tela com `Entrar no jogo`; apos clique, some o topo e aparece o pedido Google. Em ambiente local sem config Google, aparece `Continuar teste local`. Depois disso abre a frente do bar ainda travada com selecao `Homem`/`Mulher`; escolher um personagem libera o controle e salva em `pubpaid_v2_selected_character`.

Arquivos principais tocados: `pubpaid-v2.html`, `pubpaid-phaser.css`, `pubpaid-phaser/app.js`, `pubpaid-phaser/core/gameState.js`, `pubpaid-phaser/scenes/BootScene.js`, `StreetScene.js`, `InteriorScene.js`, mais os sheets da mulher em `assets/pubpaid/sprites/protagonist/`.

Validado com `node --check` nos arquivos JS principais e Playwright em `output/web-game/pubpaid-character-flow/`, sem console errors.

## Next

- Usuario deve avaliar no navegador local.
- A protagonista mulher ainda e prototipo runtime; se o usuario gostar do caminho, proxima passada deve dar acabamento de arte 32-bit/pixel 2D antes de integrar como final.
