# Current State

Updated: 2026-05-17T09:00:00.000Z

## Active Goal

Unificar PubPaid em um unico caminho canonico e fazer PvP real funcionar.

## Operating Mode

- Modo economico por padrao.
- Ler so o necessario para a tarefa atual.
- Responder curto quando bastar.
- Validar de forma proporcional ao risco.
- Escalar contexto apenas para PubPaid, homepage/CZS, deploy, revisao grande ou mudanca arriscada.
- Separar frentes: jogo e site ficam no mesmo repo, mas nao devem herdar contexto um do outro.
- Para jogo, nao usar agentes do site, revisao editorial, cards, homepage ou CZS, salvo pedido explicito.

## Canon

- URL: `/pubpaid.html`
- Runtime: `pubpaid-phaser/`
- CSS: `pubpaid-phaser.css`
- Backend: `server.js`
- Carteira: `pubpaid-runtime.js` + `data/pubpaid-store.json`
- PvP: `data/pubpaid-pvp.json`

## Current Work

- PubPaid antigo descartado.
- `/pubpaid-v2.html` deixou de ser caminho oficial e deve apenas redirecionar para `/pubpaid.html`.
- Artefatos conceituais e validacoes antigas foram removidos/quarentenados.

## Next

1. Validar backend PvP em duas sessoes.
2. Validar frontend PvP em dois contextos reais de navegador.
3. Corrigir cache/SW e fullscreen/scroll.
4. Subir online e testar com duas contas Google reais.
