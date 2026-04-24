# PubPaid 2.0 Package

Pacote local da frente oficial do jogo `PubPaid 2.0`.

## Entrada principal

- `pubpaid-v2.html`

## Retomada global

- Leia `PUBPAID_2_GLOBAL_HANDOFF.md` antes de continuar a PubPaid 2.0 em outra conta, outro agente ou outra sessao.
- Esse arquivo aponta a entrada oficial, estado atual, memoria local e proximos passos.

## Estrutura incluida

- runtime Phaser em `pubpaid-phaser/`
- estilos principais `pubpaid-phaser.css` e `pubpaid-v2.css`
- assets visuais em `assets/pubpaid/`
- Phaser vendor local em `assets/vendor/phaser.min.js`
- backend base em `server.js`
- dados locais em `data/pubpaid-*.json`

## Como rodar

1. Instale dependencias com `npm install`
2. Inicie com `npm start`
3. Abra `http://127.0.0.1:3000/pubpaid-v2.html`

## Observacao

Abrir `pubpaid-v2.html` direto por `file://` nao carrega a experiencia completa. O jogo foi preparado para rodar por servidor local.
