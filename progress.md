# Progress - PubPaid Canonico

Atualizado: 2026-05-17

## Estado Atual

O workspace foi limpo para tratar PubPaid como um unico jogo canonico.

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
