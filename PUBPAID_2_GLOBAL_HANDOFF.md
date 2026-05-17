# PubPaid - Handoff Canonico

Este arquivo manteve o nome antigo porque `AGENTS.md` manda le-lo antes de mexer no jogo. O conteudo atual substitui a historia anterior: existe um unico PubPaid vivo.

## Canon

- URL publica e de teste: `/pubpaid.html`
- Runtime do jogo: `pubpaid-phaser/`
- HTML shell unico: `pubpaid.html`
- CSS principal: `pubpaid-phaser.css`
- Backend: `server.js`
- Carteira canonica: `pubpaid-runtime.js` + `data/pubpaid-store.json`
- PvP canonico: `data/pubpaid-pvp.json`

`/pubpaid-v2.html` e qualquer rota antiga sao apenas compatibilidade/redirect para `/pubpaid.html`. Nao usar como caminho de trabalho.

## Regras duras

- Nao recriar PubPaid 1.0.
- Nao usar demo money, IA local ou modo teste para validar PvP real.
- Nao promover laboratorio, prompt, screenshot ou arte conceitual para o runtime.
- Antes de validar: `npm run guard:pubpaid`.
- Runtime `pubpaid-phaser/` e `pubpaid.html` nao podem usar `spriteFactory`, `document.createElement`, `canvas`, `createCanvas` ou `addCanvas`.

## Fluxo esperado

1. Abrir `http://127.0.0.1:3000/pubpaid.html`.
2. Checagem de build/cache antes do jogo.
3. Google autentica e entra sem botao intermediario.
4. Nick persistido por conta, com opcao de alterar.
5. Damas abre somente com saldo real aprovado.
6. PvP: jogador A espera, jogador B entra, ambos confirmam `Estou pronto`, servidor ativa a partida e cada lado move no proprio tabuleiro.

## Foco atual

Corrigir e provar o PvP real em duas sessoes, eliminar cache que exige aba anonima, travar fullscreen/sem scroll e manter apenas o caminho canonico `/pubpaid.html`.
