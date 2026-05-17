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
- Nao considerar teste API isolado como prova de jogo real.
- Validar PvP em duas sessoes autenticadas diferentes sempre que mexer no fluxo.
- Nao usar laboratorio, criador de imagem, prompt antigo ou screenshot antiga como fonte de verdade.
- Antes de validar PubPaid: `npm run guard:pubpaid`.

## Proximo Foco

1. Publicar e conferir online o deploy `20260517-poolpvp-ledger1`.
2. Confirmar no navegador real: jogador A fica aguardando, jogador B pareia, ambos confirmam `Estou pronto`, e so entao a mesa escolhida abre.
3. Confirmar que Sinuca, Damas, Xadrez, Poker, Truco e Dados aparecem no lobby e fecham resultado com saldo real.
4. Confirmar em mobile real: retrato bloqueia pedindo horizontal, paisagem nao tem scroll e a escolha de avatar mostra personagens.
5. Corrigir o conector Chrome do Codex fora do runtime: extensao instalada, mas falta a chave Windows do native host.

## Ultima Rodada Validada

- Build local: `20260517-poolpvp-ledger1`.
- Sinuca foi movida para PvP real com endpoint autoritativo de tacada.
- Dashboard PubPaid separa saldo atual, livre/travado, ganho PvP, perdido PvP e liquido PvP.
- Corrigido estado sujo em que partida `finished` antiga podia sobrepor nova fila do mesmo jogo.
- Corrigida recursao/render instavel da mesa generica PvP; polling nao recria botoes se o estado jogavel nao mudou.
- Teste local com duas sessoes Chromium autenticadas passou em Sinuca, Damas, Xadrez, Poker, Truco e Dados.
