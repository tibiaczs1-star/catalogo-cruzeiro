# Current State

Updated: 2026-05-17T04:55:46.0376474-05:00

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
- Patch `20260517-avatarfix1` corrige entrada antes dos assets, escolha de avatar sem placeholder verde, bloqueio de retrato no mobile, tela sem scroll e fila PvP de Damas sem reentrar em mesa ativa antiga.
- Backend PvP local validado: waiting -> readying -> readying -> active -> finished; entrada fresh durante mesa ativa retorna 409; sair da mesa ativa da vitoria ao outro jogador.
- Playwright mobile validado: retrato mostra gate horizontal; paisagem fica sem scroll e sem alerta falso de fullscreen.
- Chrome real ainda nao foi controlado pelo Codex porque o native host do plugin esta sem chave no registro do Windows.

## Next

1. Fazer commit/push do patch.
2. Aguardar deploy online do build `20260517-avatarfix1`.
3. Usuario testar nas duas janelas Chrome reais com contas Google diferentes.
4. Se o online ainda pular a espera PvP, investigar estado real em `data/pubpaid-pvp.json` e fluxo do cliente autenticado.
