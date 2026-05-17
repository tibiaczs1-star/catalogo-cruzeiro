# Handoff

Updated: 2026-05-17T12:05:00.000Z

Regra de operacao ativa: modo economico por padrao. Usar leitura minima, resposta curta e validacao proporcional. Nao gastar contexto com memorias extensas, docs grandes, auditorias ou varreduras amplas sem necessidade clara. Escalar apenas em PubPaid, homepage/CZS, deploy, revisao grande ou mudanca com risco real.

Separacao obrigatoria: tratar jogo como jogo e site como site. Eles estao no mesmo repo, mas sao frentes diferentes. O jogo nao deve puxar agentes do site, revisao editorial, homepage, cards, CZS ou contexto publico, salvo pedido explicito.

O PubPaid agora tem um unico canon: `/pubpaid.html`.

Nao retomar por `pubpaid-v2.html`, `pubpaid-v2.js`, `pubpaid-v2.css`, `pubpaid-phaser.html`, prompts antigos, relatorios antigos, screenshots antigas ou jogo externo. Esses itens eram conceito/teste e foram descartados ou removidos.

Arquivos vivos:

- `pubpaid.html`
- `pubpaid-phaser/`
- `pubpaid-phaser.css`
- `pubpaid-runtime.js`
- `pubpaid-admin.html`
- `server.js`
- `catalogo-sw.js`
- `data/pubpaid-store.json`
- `data/pubpaid-pvp.json`

Proxima etapa: provar o PvP real em duas sessoes autenticadas e corrigir qualquer falha de sincronizacao, cache ou tela cheia.
