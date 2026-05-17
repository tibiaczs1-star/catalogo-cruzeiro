# Codex Memory - Estado Vivo

Atualizado: 2026-05-17

## Regra De Existencia

So existe um projeto de jogo PubPaid no Codex: o PubPaid 2.0 canonico, servido por `/pubpaid.html`.

O nome publico pode continuar PubPaid, mas tecnicamente nao ha PubPaid 1.0 ativo, demo separada, rota antiga de trabalho ou laboratorio anexado ao runtime.

## Canon PubPaid

- URL canonica: `/pubpaid.html`
- Compatibilidade antiga: `/pubpaid-v2.html` redireciona para `/pubpaid.html`
- Runtime: `pubpaid-phaser/`
- Shell: `pubpaid.html`
- Estilo: `pubpaid-phaser.css`
- Backend: `server.js`
- Carteira: `pubpaid-runtime.js` e `data/pubpaid-store.json`
- PvP: `data/pubpaid-pvp.json`
- Admin: `pubpaid-admin.html`

## O Que Virou Lixo

- `pubpaid-v2.js`, `pubpaid-v2.css` e `pubpaid-phaser.html` foram removidos.
- Prompts, relatorios, screenshots antigas, jogo externo de roleta e artefatos de validacao antigos foram removidos do Git.
- `CODEX_MEMORY.md`, `.codex-memory/current-state.md`, `.codex-memory/handoff.md`, `.codex-memory/orders.json`, `.codex-memory/assets.json` e `progress.md` foram reduzidos para o estado vivo atual.

## Regras De Trabalho

- Modo economico por padrao: leitura minima, respostas curtas e validacao proporcional.
- Nao abrir memorias extensas, docs grandes, auditorias ou varreduras amplas sem necessidade clara do pedido.
- Gastar contexto pesado apenas em PubPaid, homepage/CZS, deploy, revisao grande ou mudanca com risco real.
- Tratar jogo como jogo e site como site: estao no mesmo repo, mas sao frentes diferentes.
- Nao aplicar agentes, regras editoriais, revisao de cards/homepage ou contexto do site ao jogo, exceto se o usuario pedir explicitamente.
- Nao usar demo money nem IA local como prova de PvP.
- Demo local e permitido apenas como treino/teste visual separado, sem ficha, sem escrow, sem carteira e sem alterar saldo.
- Nao considerar teste API isolado como prova de jogo real.
- Validar PvP em duas sessoes autenticadas diferentes sempre que mexer no fluxo.
- Nao usar laboratorio, criador de imagem, prompt antigo ou screenshot antiga como fonte de verdade.
- Antes de validar PubPaid: `npm run guard:pubpaid`.

## Proximo Foco

1. Publicar e conferir online o deploy `20260517-checkersdemo1`.
2. Confirmar online com duas contas Google reais: Damas abre no novo layout, pareia, confirma, move, registra historico e nao deforma mobile.
3. Continuar polimento visual por jogo, sempre preservando o fluxo financeiro/PvP real.
4. Corrigir o conector Chrome do Codex fora do runtime: extensao instalada, mas falta a chave Windows do native host.

## Ultima Rodada Validada

- Build local: `20260517-checkersdemo1`.
- Damas foi recriada como arena dedicada premium no DOM PvP, com header, cards dos jogadores, timer, historico, hints, drag/tap e botao Desistir.
- Lobby ganhou `Damas Demo`: treino local contra maquina, sem ficha, sem backend financeiro e sem alterar saldo.
- Historico de lances de Damas passou a ser persistido no match pelo backend.
- Mobile nao bloqueia mais por orientacao obrigatoria; o teste em retrato entrou na mesa e manteve tabuleiro quadrado.
- Teste local isolado com duas contas/sessoes Chrome via CDP: pareamento, ready duplo, lance backend, historico e render desktop/mobile sem scroll.
