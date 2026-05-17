# Handoff

Updated: 2026-05-17T04:55:46.0376474-05:00

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

Estado do patch atual `20260517-avatarfix1`:

- Corrigido o race de assets que deixava avatar/preview como placeholder verde.
- Corrigida a escolha de avatar: sem texto masculino/feminino, sem badge feio em cima do personagem, labels `AVATAR 1` e `AVATAR 2`.
- Corrigido mobile: body/shell/stage em `100dvh`, overflow hidden, retrato bloqueado com gate para horizontal e paisagem liberada sem scroll.
- Corrigido PvP de Damas: join fresh nao reaproveita mesa ativa antiga sem controle; mesa active recente bloqueia nova fila com 409; readying antiga cancela e libera escrow; fechar/sair de partida ativa finaliza com vitoria do outro jogador.
- Validado localmente por `node --check`, `npm run guard:pubpaid`, teste backend PvP com duas sessoes autenticadas de teste e Playwright mobile/desktop.
- Nao validado nas janelas Chrome reais do usuario pelo Codex: a extensao esta instalada, mas `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.openai.codexextension` nao existe.
