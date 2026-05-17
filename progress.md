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

- Reproduzir PvP real com duas sessoes autenticadas.
- Corrigir cache/SW para nao depender de aba anonima.
- Forcar experiencia fullscreen/sem scroll.
- Validar local e online em `/pubpaid.html`.
