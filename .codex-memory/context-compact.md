# Context Compact - Projeto Codex

Updated: 2026-05-17T00:58:00-05:00

## Leia Primeiro

Esta e a compactacao viva para trabalhar melhor neste checkout. Use este arquivo antes de mergulhar no historico grande.

## Agora

1. Workspace foi estabilizado no nivel de conflito Git: `git ls-files -u` deve estar vazio.
2. Memoria local foi compactada: `CODEX_MEMORY.md` agora aponta apenas para o marco atual, backups e fila aberta.
3. Git/Render foram limpos: rotinas automaticas escondidas ficam desligadas por padrao e o workflow diario agora e manual.
4. Feedbacks PubPaid 2.0 foram aplicados no runtime; proxima etapa e validacao visual em navegador desktop/mobile.

## O Que Nao Fazer

- Nao puxar redesign amplo da home CZS.
- Nao apagar alteracoes nao relacionadas do workspace.
- Nao escolher um lado de conflito sem backup quando o arquivo tiver dados gerados importantes.
- Nao abrir Damas contra IA/demo se o pedido for mesa real PvP.

## Ordem PubPaid Aberta

Implementado: mascara para remover nome branco errado da intro, selecao mobile por direcional + A, cache-buster/entrada Google-saldo sem cache, clique/toque no botao Confirmar, remocao do Terminal, remocao visual dos efeitos ruins de luz/chao no interior, entrada/saida por colisao, garcom maior e Damas somente com dois players reais prontos com moeda para decidir inicio. Falta conferir visual em navegador.

## Backups

- Conflitos: `.codex-backups/conflicts-before-resolution-20260517/`
- Memoria: `.codex-backups/memory-before-compaction-20260517/`
- PubPaid antes da primeira tentativa interrompida: `.codex-backups/pubpaid-fixes-20260517-user-feedback/`

## Limpeza Git/Render

- `render.yaml`: `REAL_AGENTS_AUTO_RUN_DISABLED`, `NEWS_REFRESH_AUTO_DISABLED`, `ARTICLE_INTEGRITY_AUTO_RUN_DISABLED` e `TOPIC_FEED_AUTO_REFRESH_DISABLED` ficam `true`.
- `.github/workflows/daily-news-sync.yml`: sem `schedule`; roda apenas manual.
- `.gitignore`: ignora `.codex-backups/`, `.codex-temp/`, capturas e outputs locais antigos.
- `.codex-memory/cleanup-report-20260517.md`: relatorio da limpeza.
- Restante preso: `.codex-temp/npm-start.*.log`, segurado por `node.exe` PID 7088 na porta 3000 sem permissao para encerrar.

## Checks Rapidos

`git ls-files -u`
`node --check news-data.js`
`node --check pubpaid-phaser/app.js`
`npm run guard:pubpaid`
`git diff --check`
